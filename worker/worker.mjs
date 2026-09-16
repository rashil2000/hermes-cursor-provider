#!/usr/bin/env node

import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const PROTOCOL_VERSION = 1
const MAX_FRAME_BYTES = 40 * 1024 * 1024
const LOGIN_TIMEOUT_MS = 5 * 60_000
const OAUTH_CLIENT_ID = "KbZUR41cY7W6zRSdpSUJ7I7mLYBKOCmB"
const CURSOR_CLIENT_TYPE = "ide"
const SELF_TEST = process.argv.includes("--self-test")
const [NODE_MAJOR, NODE_MINOR] = process.versions.node.split(".").map(Number)
if (NODE_MAJOR < 22 || (NODE_MAJOR === 22 && NODE_MINOR < 19)) {
  process.stderr.write("Hermes Cursor worker requires Node 22.19 or newer\n")
  process.exit(2)
}
if (!SELF_TEST && !process.argv.includes("--stdio")) {
  process.stderr.write("Hermes Cursor worker must be started with --stdio\n")
  process.exit(2)
}
const API_BASE = process.env.CURSOR_API_BASE_URL || "https://api2.cursor.sh"
const CREDENTIALS_FILE = process.env.HERMES_CURSOR_CREDENTIALS_FILE
const ALLOWLIST_FILE = process.env.HERMES_CURSOR_ALLOWLIST_FILE
const STATE_DIR = process.env.HERMES_CURSOR_STATE_DIR
const activeRequests = new Map()
const pendingToolCalls = new Set()
let accessTokenCache = null
let refreshInFlight = null
let credentialGeneration = 0
let modelCache = null
let transportModules = null
let writeChain = Promise.resolve()

function requiredPath(value, name) {
  if (!value) throw providerError(`${name} is not configured`, "CURSOR_CONFIGURATION_ERROR")
  return path.resolve(value)
}

function providerError(message, code, options = {}) {
  const error = new Error(message)
  error.code = code
  error.transient = options.transient === true
  error.replaySafe = options.replaySafe === true
  if (Number.isFinite(options.retryAfterMs)) error.retryAfterMs = options.retryAfterMs
  return error
}

function publicError(error) {
  const value = error instanceof Error ? error : new Error(String(error))
  const code = typeof value.code === "string" ? value.code : value.name || "CURSOR_WORKER_ERROR"
  const safeMessages = {
    ENOENT: "Required Cursor provider state is missing",
    EACCES: "Cursor provider cannot access its private state",
  }
  return {
    message: safeMessages[code] || value.message || "Cursor worker request failed",
    code,
    transient: value.transient === true,
    replaySafe: value.replaySafe === true,
    ...(Number.isFinite(value.retryAfterMs) ? { retryAfterMs: value.retryAfterMs } : {}),
  }
}

async function writeFrame(message) {
  const body = Buffer.from(JSON.stringify(message), "utf8")
  if (body.length > MAX_FRAME_BYTES) {
    throw providerError("Worker response exceeds frame limit", "CURSOR_RESPONSE_TOO_LARGE")
  }
  const header = Buffer.allocUnsafe(4)
  header.writeUInt32BE(body.length)
  writeChain = writeChain.then(
    () =>
      new Promise((resolve, reject) => {
        process.stdout.write(Buffer.concat([header, body]), (error) =>
          error ? reject(error) : resolve(),
        )
      }),
  )
  return writeChain
}

function parseAllowedModels() {
  let value
  const inline = process.env.HERMES_CURSOR_ALLOWED_MODELS?.trim()
  if (inline) {
    try {
      value = JSON.parse(inline)
    } catch {
      value = inline.split(",").map((item) => item.trim()).filter(Boolean)
    }
  } else {
    value = JSON.parse(fs.readFileSync(requiredPath(ALLOWLIST_FILE, "allowlist path"), "utf8"))
  }
  if (!Array.isArray(value)) value = value?.models
  if (!Array.isArray(value) || value.length === 0) {
    throw providerError("Exact Cursor model allowlist is empty", "CURSOR_MODEL_POLICY_EMPTY")
  }
  const result = new Set()
  for (const model of value) {
    if (typeof model !== "string" || !model || model.trim() !== model) {
      throw providerError("Cursor model allowlist contains an invalid ID", "CURSOR_MODEL_POLICY_INVALID")
    }
    if (model.toLowerCase().split(/[-_]/).includes("fast")) {
      throw providerError(`Fast Cursor model variant is prohibited: ${model}`, "CURSOR_MODEL_POLICY_INVALID")
    }
    result.add(model)
  }
  return result
}

function readCredentials() {
  const file = requiredPath(CREDENTIALS_FILE, "credentials path")
  let descriptor
  let value
  try {
    const noFollow = process.platform === "win32" ? 0 : (fs.constants.O_NOFOLLOW || 0)
    descriptor = fs.openSync(file, fs.constants.O_RDONLY | noFollow)
    const stat = fs.fstatSync(descriptor)
    if (!stat.isFile()) {
      throw providerError("Cursor credential path is not a regular file", "CURSOR_AUTH_PERMISSIONS")
    }
    if (
      process.platform !== "win32" &&
      ((stat.mode & 0o077) !== 0 ||
        (typeof process.geteuid === "function" && stat.uid !== process.geteuid()))
    ) {
      throw providerError(
        "Cursor credential file must be owned by the current user with mode 0600",
        "CURSOR_AUTH_PERMISSIONS",
      )
    }
    value = JSON.parse(fs.readFileSync(descriptor, "utf8"))
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw providerError("Cursor login required; run `hermes-cursor login`", "CURSOR_AUTH_REQUIRED")
    }
    if (error?.code === "ELOOP") {
      throw providerError("Cursor credential file must not be a symlink", "CURSOR_AUTH_PERMISSIONS")
    }
    throw error
  } finally {
    if (descriptor !== undefined) {
      try { fs.closeSync(descriptor) } catch {}
    }
  }
  if (typeof value?.refreshToken !== "string" || !value.refreshToken) {
    throw providerError("Cursor credential file is invalid", "CURSOR_AUTH_INVALID")
  }
  if (
    value.accessToken !== undefined &&
    (typeof value.accessToken !== "string" || !value.accessToken)
  ) {
    throw providerError("Cursor credential file is invalid", "CURSOR_AUTH_INVALID")
  }
  return value
}

function atomicPrivateJson(file, value) {
  const directory = path.dirname(file)
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 })
  if (process.platform !== "win32") fs.chmodSync(directory, 0o700)
  const temporary = path.join(directory, `.${path.basename(file)}.${process.pid}.${crypto.randomUUID()}`)
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
      flag: "wx",
    })
    fs.renameSync(temporary, file)
    if (process.platform !== "win32") fs.chmodSync(file, 0o600)
  } catch (error) {
    try { fs.unlinkSync(temporary) } catch {}
    throw error
  }
}

function jwtExpiry(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"))
    return Number.isFinite(payload.exp) ? payload.exp * 1000 : 0
  } catch {
    return 0
  }
}

function accountKeyForToken(accessToken, refreshToken) {
  let identity = ""
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8"))
    identity = String(payload.sub || payload.user_id || payload.uuid || "")
  } catch {}
  // Store only a one-way, fixed-size partition key. The refresh token fallback
  // supports opaque/non-JWT access tokens without exposing either credential.
  return crypto
    .createHash("sha256")
    .update(identity ? `cursor-account:${identity}` : `cursor-refresh:${refreshToken}`)
    .digest("hex")
    .slice(0, 24)
}

async function refreshAccessToken(refreshToken) {
  let response
  try {
    response = await fetch(`${API_BASE}/oauth/token`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-cursor-client-type": CURSOR_CLIENT_TYPE,
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: OAUTH_CLIENT_ID,
        refresh_token: refreshToken,
      }),
      signal: AbortSignal.timeout(20_000),
    })
  } catch (cause) {
    throw providerError("Cursor token refresh request failed", "CURSOR_AUTH_REFRESH_NETWORK", {
      transient: true,
      replaySafe: true,
    })
  }
  if (!response.ok) {
    await response.body?.cancel().catch(() => {})
    throw providerError(
      `Cursor token refresh failed (HTTP ${response.status})`,
      response.status === 401 || response.status === 403
        ? "CURSOR_AUTH_EXPIRED"
        : "CURSOR_AUTH_REFRESH_FAILED",
      { transient: response.status >= 500, replaySafe: true },
    )
  }
  const body = await response.json()
  if (body?.shouldLogout === true) {
    throw providerError("Cursor revoked this login; sign in again", "CURSOR_AUTH_EXPIRED")
  }
  if (typeof body?.access_token !== "string" || !body.access_token) {
    throw providerError("Cursor token refresh returned no access token", "CURSOR_AUTH_REFRESH_INVALID")
  }
  return {
    accessToken: body.access_token,
    refreshToken:
      typeof body.refresh_token === "string" && body.refresh_token
        ? body.refresh_token
        : refreshToken,
  }
}

async function refreshAndCacheAccessToken() {
  const generation = credentialGeneration
  const credentials = readCredentials()
  const refreshed = await refreshAccessToken(credentials.refreshToken)
  if (generation !== credentialGeneration) {
    throw providerError("Cursor credentials changed during refresh", "CURSOR_AUTH_CHANGED", {
      transient: true,
      replaySafe: true,
    })
  }
  const accountKey =
    typeof credentials.accountKey === "string" && credentials.accountKey
      ? credentials.accountKey
      : accountKeyForToken(refreshed.accessToken, refreshed.refreshToken)
  if (
    refreshed.accessToken !== credentials.accessToken ||
    refreshed.refreshToken !== credentials.refreshToken ||
    credentials.accountKey !== accountKey
  ) {
    atomicPrivateJson(requiredPath(CREDENTIALS_FILE, "credentials path"), {
      version: 1,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      accountKey,
    })
  }
  accessTokenCache = {
    value: refreshed.accessToken,
    expiresAt: jwtExpiry(refreshed.accessToken) || Date.now() + 55 * 60_000,
    accountKey,
  }
  return accessTokenCache.value
}

async function accessToken() {
  if (accessTokenCache && accessTokenCache.expiresAt - Date.now() > 5 * 60_000) {
    return accessTokenCache.value
  }
  const credentials = readCredentials()
  const persistedExpiry =
    typeof credentials.accessToken === "string" ? jwtExpiry(credentials.accessToken) : 0
  if (credentials.accessToken && persistedExpiry - Date.now() > 5 * 60_000) {
    accessTokenCache = {
      value: credentials.accessToken,
      expiresAt: persistedExpiry,
      accountKey:
        typeof credentials.accountKey === "string" && credentials.accountKey
          ? credentials.accountKey
          : accountKeyForToken(credentials.accessToken, credentials.refreshToken),
    }
    return accessTokenCache.value
  }
  if (!refreshInFlight) {
    const refresh = refreshAndCacheAccessToken()
    const tracked = refresh.finally(() => {
      if (refreshInFlight === tracked) refreshInFlight = null
    })
    refreshInFlight = tracked
  }
  return refreshInFlight
}

async function loadTransport() {
  if (!transportModules) {
    try {
      const [{ createCursor }, { fetchModels }] = await Promise.all([
        import("cursor-opencode-provider"),
        import("cursor-opencode-provider/models"),
      ])
      transportModules = { createCursor, fetchModels }
    } catch (cause) {
      throw providerError(
        "Bundled Cursor transport failed to load",
        "CURSOR_WORKER_DEPENDENCY_MISSING",
      )
    }
  }
  return transportModules
}

function eligibleModel(model) {
  if (!model || typeof model.id !== "string") return false
  const text = `${model.id} ${model.displayName || ""}`.toLowerCase()
  if (text.includes("no zdr")) return false
  if (model.id.toLowerCase().split(/[-_]/).includes("fast")) return false
  return true
}

async function discoverModels({ force = false } = {}) {
  if (!force && modelCache && Date.now() - modelCache.fetchedAt < 60_000) {
    return modelCache.models.map((model) => ({ ...model }))
  }
  const [{ fetchModels }, token] = await Promise.all([loadTransport(), accessToken()])
  const models = (await fetchModels(token, { baseURL: API_BASE, timeoutMs: 10_000 }))
    .filter(eligibleModel)
  modelCache = { fetchedAt: Date.now(), models }
  return models.map((model) => ({ ...model }))
}

async function allowedDiscoveredModels() {
  const allowed = parseAllowedModels()
  return (await discoverModels()).filter((model) => allowed.has(model.id))
}

function textContent(content) {
  if (content == null) return ""
  if (typeof content === "string") return content
  if (!Array.isArray(content)) {
    throw providerError("Unsupported message content shape", "CURSOR_UNSUPPORTED_REQUEST")
  }
  return content
    .filter((part) => part?.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("")
}

function userContent(content) {
  if (typeof content === "string") return [{ type: "text", text: content }]
  if (!Array.isArray(content)) {
    throw providerError("Unsupported user message content", "CURSOR_UNSUPPORTED_REQUEST")
  }
  return content.map((part) => {
    if (part?.type === "text" && typeof part.text === "string") {
      return { type: "text", text: part.text }
    }
    if (part?.type === "image_url" && typeof part.image_url?.url === "string") {
      const match = /^data:(image\/(?:png|jpeg|gif));base64,/i.exec(part.image_url.url)
      if (!match) {
        throw providerError(
          "Only inline PNG, JPEG, or GIF base64 user images are supported",
          "CURSOR_UNSUPPORTED_IMAGE",
        )
      }
      return {
        type: "file",
        mediaType: match[1].toLowerCase(),
        data: part.image_url.url,
      }
    }
    throw providerError(`Unsupported user content part: ${part?.type || "unknown"}`, "CURSOR_UNSUPPORTED_REQUEST")
  })
}

function openAiMessagesToPrompt(messages, originalToWire) {
  const prompt = []
  const toolNames = new Map()
  for (const message of messages) {
    if (message?.role === "assistant" && Array.isArray(message.tool_calls)) {
      for (const call of message.tool_calls) {
        if (
          typeof call?.id !== "string" ||
          !call.id ||
          typeof call?.function?.name !== "string" ||
          !call.function.name
        ) {
          throw providerError("Assistant tool call is missing an id or name", "CURSOR_UNSUPPORTED_REQUEST")
        }
        if (toolNames.has(call.id)) {
          throw providerError("Assistant tool call ids must be unique", "CURSOR_UNSUPPORTED_REQUEST")
        }
        toolNames.set(call.id, call.function.name)
      }
    }
  }
  for (const message of messages) {
    if (!message || typeof message !== "object") {
      throw providerError("Message must be an object", "CURSOR_UNSUPPORTED_REQUEST")
    }
    if (message.role === "system" || message.role === "developer") {
      prompt.push({ role: "system", content: textContent(message.content) })
    } else if (message.role === "user") {
      prompt.push({ role: "user", content: userContent(message.content) })
    } else if (message.role === "assistant") {
      const content = []
      const text = textContent(message.content)
      if (text) content.push({ type: "text", text })
      for (const call of message.tool_calls || []) {
        if (call?.type !== "function" || typeof call.function?.name !== "string") {
          throw providerError("Only function tool calls are supported", "CURSOR_UNSUPPORTED_REQUEST")
        }
        let input
        try {
          input = JSON.parse(call.function.arguments || "{}")
        } catch {
          throw providerError("Assistant tool call contains invalid JSON arguments", "CURSOR_UNSUPPORTED_REQUEST")
        }
        content.push({
          type: "tool-call",
          toolCallId: call.id,
          toolName: originalToWire.get(call.function.name) || wireToolName(call.function.name),
          input,
        })
      }
      prompt.push({ role: "assistant", content })
    } else if (message.role === "tool") {
      const callId = message.tool_call_id
      if (typeof callId !== "string" || !callId) {
        throw providerError("Tool result is missing tool_call_id", "CURSOR_UNSUPPORTED_REQUEST")
      }
      const name = toolNames.get(callId)
      if (!name) {
        throw providerError("Tool result references an unknown tool call", "CURSOR_UNSUPPORTED_REQUEST")
      }
      const suppliedName = message.name ?? message.tool_name
      if (suppliedName !== undefined && suppliedName !== name) {
        throw providerError("Tool result name does not match its tool call", "CURSOR_UNSUPPORTED_REQUEST")
      }
      prompt.push({
        role: "tool",
        content: [{
          type: "tool-result",
          toolCallId: callId,
          toolName: originalToWire.get(name) || wireToolName(name),
          output: { type: "text", value: textContent(message.content) },
        }],
      })
    } else {
      throw providerError(`Unsupported message role: ${message.role}`, "CURSOR_UNSUPPORTED_REQUEST")
    }
  }
  return prompt
}

function trailingToolResultIds(messages) {
  let start = messages.length
  while (start > 0 && messages[start - 1]?.role === "tool") start -= 1
  if (start === messages.length) return []
  return messages
    .slice(start)
    .map((message) => message?.tool_call_id)
    .filter((value) => typeof value === "string" && value)
}

function requireLiveToolContinuations(messages) {
  const continuationIds = trailingToolResultIds(messages)
  const missingContinuation = continuationIds.find((callId) => !pendingToolCalls.has(callId))
  if (missingContinuation) {
    throw providerError(
      "Cursor tool continuation was lost with its worker process; refusing to replay it",
      "CURSOR_TOOL_CONTINUATION_LOST",
    )
  }
  return continuationIds
}

function wireToolName(name) {
  const digest = crypto.createHash("sha256").update(name).digest("hex").slice(0, 12)
  const safeName = name.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 40) || "tool"
  return `h_${digest}_${safeName}`
}

function openAiTools(tools) {
  const originalToWire = new Map()
  const wireToOriginal = new Map()
  const converted = tools.map((tool) => {
    if (tool?.type !== "function" || typeof tool.function?.name !== "string") {
      throw providerError("Only OpenAI function tools are supported", "CURSOR_UNSUPPORTED_REQUEST")
    }
    const wireName = wireToolName(tool.function.name)
    originalToWire.set(tool.function.name, wireName)
    wireToOriginal.set(wireName, tool.function.name)
    return {
      type: "function",
      name: wireName,
      description: `Hermes tool ${tool.function.name}. ${tool.function.description || ""}`.trim(),
      inputSchema: tool.function.parameters || { type: "object", properties: {} },
    }
  })
  return { converted, originalToWire, wireToOriginal }
}

function toolChoice(value, originalToWire) {
  if (value == null || value === "auto") return { type: "auto" }
  if (value === "none") return { type: "none" }
  if (value === "required") return { type: "required" }
  if (value?.type === "function" && typeof value.function?.name === "string") {
    const selected = originalToWire.get(value.function.name)
    if (!selected) throw providerError("tool_choice names an unadvertised tool", "CURSOR_UNSUPPORTED_REQUEST")
    return { type: "tool", toolName: selected }
  }
  throw providerError("Unsupported tool_choice value", "CURSOR_UNSUPPORTED_REQUEST")
}

function cursorProviderOptions(reasoningEffort) {
  if (typeof reasoningEffort !== "string" || !reasoningEffort) return {}
  return { providerOptions: { cursor: { reasoningEffort } } }
}

function usageFromPart(usage) {
  const prompt = usage?.inputTokens?.total || 0
  const completion = usage?.outputTokens?.total || 0
  return {
    prompt_tokens: prompt,
    completion_tokens: completion,
    total_tokens: prompt + completion,
    prompt_tokens_details: {
      cached_tokens: usage?.inputTokens?.cacheRead || 0,
      cache_write_tokens: usage?.inputTokens?.cacheWrite || 0,
    },
    completion_tokens_details: {
      reasoning_tokens: usage?.outputTokens?.reasoning || 0,
    },
  }
}

function finishReason(part) {
  const value = part?.finishReason?.unified || part?.finishReason || "stop"
  if (value === "tool-calls") return "tool_calls"
  if (value === "length") return "length"
  if (value === "content-filter") return "content_filter"
  if (value === "error") return "error"
  return "stop"
}

function cursorSessionHeaders(sessionId) {
  if (sessionId === undefined) return {}
  if (typeof sessionId !== "string" || !sessionId) {
    throw providerError(
      "Hermes session id must be a non-empty string",
      "CURSOR_UNSUPPORTED_REQUEST",
    )
  }
  return { "x-session-id": sessionId }
}

async function runChat(id, params, signal) {
  const allowed = parseAllowedModels()
  if (!allowed.has(params.model)) {
    throw providerError(
      `Cursor model ${JSON.stringify(params.model)} is not in the configured exact allowlist`,
      "CURSOR_MODEL_NOT_ALLOWED",
    )
  }
  const continuationIds = requireLiveToolContinuations(params.messages || [])
  const available = await discoverModels()
  const selected = available.find((model) => model.id === params.model)
  if (!selected) {
    throw providerError(
      `Cursor model ${JSON.stringify(params.model)} is not available to this account`,
      "CURSOR_MODEL_UNAVAILABLE",
    )
  }
  const tools = openAiTools(params.tools || [])
  const { createCursor } = await loadTransport()
  const token = await accessToken()
  const sdk = createCursor({
    name: "hermes-cursor",
    accessToken: token,
    apiBaseURL: API_BASE,
    cacheDir: path.join(
      requiredPath(STATE_DIR, "state directory"),
      accessTokenCache?.accountKey || accountKeyForToken(token, readCredentials().refreshToken),
    ),
    workspaceRoot: process.cwd(),
    telemetryEnabled: false,
    retry: { maxAttempts: 3, baseDelayMs: 500, maxDelayMs: 8_000 },
  })
  const model = sdk.languageModel(params.model)
  const timeout = setTimeout(
    () => signal.controller.abort(providerError("Cursor request timed out", "CURSOR_TIMEOUT")),
    Math.max(1_000, Number(params.timeoutMs) || 900_000),
  )
  timeout.unref?.()
  const callOptions = {
    prompt: openAiMessagesToPrompt(params.messages || [], tools.originalToWire),
    tools: tools.converted,
    toolChoice: toolChoice(params.toolChoice, tools.originalToWire),
    headers: cursorSessionHeaders(params.sessionId),
    abortSignal: signal.controller.signal,
    ...(Number.isFinite(params.temperature) ? { temperature: params.temperature } : {}),
    ...(Number.isFinite(params.maxOutputTokens) ? { maxOutputTokens: params.maxOutputTokens } : {}),
    ...cursorProviderOptions(params.reasoningEffort),
  }
  const choices = []
  let text = ""
  let reasoning = ""
  let toolCalls = []
  let finalReason = "stop"
  let usage = usageFromPart()
  try {
    // From this point a same-stream result write may occur. Never accept the
    // same continuation twice after an ambiguous failure.
    for (const callId of continuationIds) pendingToolCalls.delete(callId)
    const result = await model.doStream(callOptions)
    const reader = result.stream.getReader()
    while (true) {
      const { done, value: part } = await reader.read()
      if (done) break
      if (part.type === "stream-start" && params.stream) {
        await writeFrame({
          id,
          type: "chunk",
          chunk: {
            id,
            object: "chat.completion.chunk",
            model: params.model,
            choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null }],
          },
        })
      } else if (part.type === "text-delta") {
        text += part.delta
        if (params.stream) {
          await writeFrame({
            id,
            type: "chunk",
            chunk: {
              id,
              object: "chat.completion.chunk",
              model: params.model,
              choices: [{ index: 0, delta: { content: part.delta }, finish_reason: null }],
            },
          })
        }
      } else if (part.type === "reasoning-delta") {
        reasoning += part.delta
        if (params.stream) {
          await writeFrame({
            id,
            type: "chunk",
            chunk: {
              id,
              object: "chat.completion.chunk",
              model: params.model,
              choices: [{ index: 0, delta: { reasoning_content: part.delta }, finish_reason: null }],
            },
          })
        }
      } else if (part.type === "tool-call") {
        const originalName = tools.wireToOriginal.get(part.toolName)
        if (!originalName) {
          throw providerError(
            `Cursor requested unadvertised tool ${JSON.stringify(part.toolName)}`,
            "CURSOR_NATIVE_TOOL_REJECTED",
          )
        }
        const call = {
          id: part.toolCallId,
          type: "function",
          function: {
            name: originalName,
            arguments:
              typeof part.input === "string" ? part.input : JSON.stringify(part.input ?? {}),
          },
        }
        const index = toolCalls.length
        toolCalls.push(call)
        if (params.stream) {
          await writeFrame({
            id,
            type: "chunk",
            chunk: {
              id,
              object: "chat.completion.chunk",
              model: params.model,
              choices: [{
                index: 0,
                delta: { tool_calls: [{ index, ...call }] },
                finish_reason: null,
              }],
            },
          })
        }
      } else if (part.type === "finish") {
        finalReason = finishReason(part)
        usage = usageFromPart(part.usage)
      } else if (part.type === "error") {
        throw part.error instanceof Error ? part.error : new Error(String(part.error))
      }
    }
  } catch (error) {
    // A failed adapter boundary must not leave a held Cursor Run waiting for a
    // tool result Hermes will never execute.
    signal.controller.abort(error)
    throw error
  } finally {
    clearTimeout(timeout)
  }
  if (toolCalls.length) finalReason = "tool_calls"
  for (const call of toolCalls) pendingToolCalls.add(call.id)
  if (params.stream) {
    await writeFrame({
      id,
      type: "chunk",
      chunk: {
        id,
        object: "chat.completion.chunk",
        model: params.model,
        choices: [{ index: 0, delta: {}, finish_reason: finalReason }],
        usage,
      },
    })
    await writeFrame({ id, type: "done" })
    return
  }
  choices.push({
    index: 0,
    message: {
      role: "assistant",
      content: text || null,
      tool_calls: toolCalls.length ? toolCalls : null,
      reasoning: reasoning || null,
      reasoning_content: reasoning || null,
      reasoning_details: null,
    },
    finish_reason: finalReason,
  })
  await writeFrame({
    id,
    type: "result",
    result: {
      id,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: params.model,
      choices,
      usage,
    },
  })
}

function base64url(bytes) {
  return Buffer.from(bytes).toString("base64url")
}

function abortableDelay(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    const finish = (error) => {
      clearTimeout(timer)
      signal.removeEventListener("abort", cancel)
      error ? reject(error) : resolve()
    }
    const timer = setTimeout(finish, milliseconds)
    const cancel = () => {
      finish(providerError("Cursor login cancelled", "CURSOR_LOGIN_CANCELLED"))
    }
    signal.addEventListener("abort", cancel, { once: true })
  })
}

async function login(id, controller) {
  const verifier = base64url(crypto.randomBytes(32))
  const challenge = base64url(crypto.createHash("sha256").update(verifier).digest())
  const uuid = crypto.randomUUID()
  const query = new URLSearchParams({
    challenge,
    uuid,
    mode: "login",
    supportsSelectedTeamLogin: "true",
    redirectTarget: "cli",
  })
  const url = `https://cursor.com/loginDeepControl?${query}`
  await writeFrame({ id, type: "login_url", url })
  let delay = 1_000
  let consecutiveErrors = 0
  const deadline = Date.now() + LOGIN_TIMEOUT_MS
  for (let attempt = 0; attempt < 150; attempt++) {
    const beforePoll = deadline - Date.now()
    if (beforePoll <= 0) break
    await abortableDelay(Math.min(delay, beforePoll), controller.signal)
    const remaining = deadline - Date.now()
    if (remaining <= 0) break
    try {
      const response = await fetch(
        `${API_BASE}/auth/poll?uuid=${encodeURIComponent(uuid)}&verifier=${encodeURIComponent(verifier)}`,
        {
          headers: { "x-cursor-client-type": CURSOR_CLIENT_TYPE },
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(Math.min(10_000, remaining)),
          ]),
        },
      )
      if (response.status === 404) {
        consecutiveErrors = 0
        delay = Math.min(delay * 1.2, 10_000)
        continue
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const body = await response.json()
      if (typeof body.accessToken !== "string" || typeof body.refreshToken !== "string") {
        throw new Error("missing tokens")
      }
      credentialGeneration += 1
      refreshInFlight = null
      const accountKey = accountKeyForToken(body.accessToken, body.refreshToken)
      atomicPrivateJson(requiredPath(CREDENTIALS_FILE, "credentials path"), {
        version: 1,
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
        accountKey,
      })
      accessTokenCache = {
        value: body.accessToken,
        expiresAt: jwtExpiry(body.accessToken) || Date.now() + 55 * 60_000,
        accountKey,
      }
      await writeFrame({ id, type: "result", result: { authenticated: true } })
      return
    } catch (error) {
      if (controller.signal.aborted) throw error
      consecutiveErrors += 1
      if (consecutiveErrors >= 3) {
        throw providerError("Cursor login polling failed repeatedly", "CURSOR_LOGIN_POLL_FAILED", {
          transient: true,
          replaySafe: true,
        })
      }
    }
  }
  throw providerError("Cursor login timed out", "CURSOR_LOGIN_TIMEOUT")
}

async function dispatch(message) {
  if (message.protocolVersion !== PROTOCOL_VERSION) {
    throw providerError("Worker protocol version mismatch", "CURSOR_PROTOCOL_VERSION")
  }
  const id = String(message.id || "")
  const method = message.method
  if (!id || typeof method !== "string") {
    throw providerError("Malformed worker request", "CURSOR_PROTOCOL_ERROR")
  }
  if (method === "cancel") {
    activeRequests.get(String(message.params?.requestId || ""))?.abort()
    await writeFrame({ id, type: "result", result: { cancelled: true } })
    return
  }
  if (method === "shutdown") {
    for (const controller of activeRequests.values()) controller.abort()
    await writeFrame({ id, type: "result", result: { stopped: true } })
    await writeChain
    process.exit(0)
  }
  const controller = new AbortController()
  activeRequests.set(id, controller)
  try {
    if (method === "chat") {
      await runChat(id, message.params || {}, { controller })
    } else if (method === "login") {
      await login(id, controller)
    } else if (method === "logout") {
      const file = requiredPath(CREDENTIALS_FILE, "credentials path")
      credentialGeneration += 1
      refreshInFlight = null
      try { fs.unlinkSync(file) } catch (error) { if (error?.code !== "ENOENT") throw error }
      accessTokenCache = null
      modelCache = null
      await writeFrame({ id, type: "result", result: { authenticated: false } })
    } else if (method === "status") {
      let authenticated = false
      try {
        const credentials = readCredentials()
        authenticated = typeof credentials.refreshToken === "string"
      } catch {}
      await writeFrame({
        id,
        type: "result",
        result: {
          authenticated,
          structuralOnly: true,
          credentialsFile: requiredPath(CREDENTIALS_FILE, "credentials path"),
        },
      })
    } else if (method === "discover") {
      await writeFrame({ id, type: "result", result: { models: await discoverModels({ force: true }) } })
    } else if (method === "models") {
      await writeFrame({ id, type: "result", result: { models: await allowedDiscoveredModels() } })
    } else {
      throw providerError(`Unknown worker method: ${method}`, "CURSOR_PROTOCOL_ERROR")
    }
  } finally {
    activeRequests.delete(id)
  }
}

if (SELF_TEST) {
  const tools = openAiTools([
    {
      type: "function",
      function: {
        name: "read",
        description: "Read through Hermes",
        parameters: { type: "object", properties: {} },
      },
    },
  ])
  const wireName = tools.originalToWire.get("read")
  if (!wireName || wireName === "read" || tools.wireToOriginal.get(wireName) !== "read") {
    throw new Error("Hermes tool namespace isolation self-test failed")
  }
  const sanitizedWireName = wireToolName("danger/tool.name")
  if (!/^h_[0-9a-f]{12}_[A-Za-z0-9_-]+$/.test(sanitizedWireName)) {
    throw new Error("Hermes tool name sanitization self-test failed")
  }
  const prompt = openAiMessagesToPrompt(
    [
      {
        role: "assistant",
        content: null,
        tool_calls: [{
          id: "cursor_session_1",
          type: "function",
          function: { name: "read", arguments: "{}" },
        }],
      },
      {
        role: "tool",
        tool_call_id: "cursor_session_1",
        name: "read",
        content: "ok",
      },
    ],
    tools.originalToWire,
  )
  if (prompt[0].content[0].toolName !== wireName || prompt[1].content[0].toolName !== wireName) {
    throw new Error("Hermes tool continuation namespace self-test failed")
  }
  pendingToolCalls.add("cursor_session_1")
  if (
    trailingToolResultIds([
      { role: "user", content: "run" },
      { role: "tool", tool_call_id: "cursor_session_1", content: "ok" },
    ])[0] !== "cursor_session_1"
  ) {
    throw new Error("Hermes lost-continuation guard self-test failed")
  }
  let lostContinuationGuard = false
  try {
    requireLiveToolContinuations([
      { role: "tool", tool_call_id: "cursor_missing_1", content: "must not replay" },
    ])
  } catch (error) {
    lostContinuationGuard = error?.code === "CURSOR_TOOL_CONTINUATION_LOST"
  }
  if (!lostContinuationGuard) throw new Error("Hermes lost-continuation rejection self-test failed")
  let unknownHistoryGuard = false
  try {
    openAiMessagesToPrompt([
      { role: "tool", tool_call_id: "unknown", content: "must not forward" },
    ], new Map())
  } catch (error) {
    unknownHistoryGuard = error?.code === "CURSOR_UNSUPPORTED_REQUEST"
  }
  if (!unknownHistoryGuard) throw new Error("Hermes unknown tool history self-test failed")
  let unsupportedWebpGuard = false
  try {
    userContent([{
      type: "image_url",
      image_url: { url: "data:image/webp;base64,UklGRg==" },
    }])
  } catch (error) {
    unsupportedWebpGuard = error?.code === "CURSOR_UNSUPPORTED_IMAGE"
  }
  if (!unsupportedWebpGuard) throw new Error("Hermes unsupported WebP rejection self-test failed")
  let oauthRefreshGuard = false
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async (url, options) => {
      const body = JSON.parse(String(options?.body || ""))
      oauthRefreshGuard =
        String(url) === `${API_BASE}/oauth/token` &&
        options?.method === "POST" &&
        options?.headers?.["content-type"] === "application/json" &&
        options?.headers?.["x-cursor-client-type"] === CURSOR_CLIENT_TYPE &&
        options?.headers?.authorization === undefined &&
        body.grant_type === "refresh_token" &&
        body.client_id === OAUTH_CLIENT_ID &&
        body.refresh_token === "synthetic-refresh"
      return new Response(
        JSON.stringify({
          access_token: "synthetic-access",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      )
    }
    const refreshed = await refreshAccessToken("synthetic-refresh")
    oauthRefreshGuard =
      oauthRefreshGuard &&
      refreshed.accessToken === "synthetic-access" &&
      refreshed.refreshToken === "synthetic-refresh"
  } finally {
    globalThis.fetch = originalFetch
  }
  if (!oauthRefreshGuard) throw new Error("Hermes OAuth refresh contract self-test failed")
  const reasoningOptions = cursorProviderOptions("high")
  const reasoningEffortGuard =
    reasoningOptions.providerOptions?.cursor?.reasoningEffort === "high" &&
    Object.keys(cursorProviderOptions()).length === 0
  if (!reasoningEffortGuard) throw new Error("Hermes reasoning effort forwarding self-test failed")
  let invalidSessionGuard = false
  try {
    cursorSessionHeaders(null)
  } catch (error) {
    invalidSessionGuard = error?.code === "CURSOR_UNSUPPORTED_REQUEST"
  }
  const sessionCorrelationGuard =
    cursorSessionHeaders("physical-session")["x-session-id"] === "physical-session" &&
    Object.keys(cursorSessionHeaders(undefined)).length === 0 &&
    invalidSessionGuard
  if (!sessionCorrelationGuard) throw new Error("Hermes session correlation self-test failed")
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      wireName,
      lostContinuationGuard,
      unknownHistoryGuard,
      unsupportedWebpGuard,
      oauthRefreshGuard,
      reasoningEffortGuard,
      sessionCorrelationGuard,
    })}\n`,
  )
  process.exit(0)
}

let input = Buffer.alloc(0)
process.stdin.on("data", (chunk) => {
  input = Buffer.concat([input, chunk])
  while (input.length >= 4) {
    const length = input.readUInt32BE(0)
    if (length <= 0 || length > MAX_FRAME_BYTES) {
      process.exitCode = 2
      process.stdin.destroy()
      return
    }
    if (input.length < 4 + length) return
    const body = input.subarray(4, 4 + length)
    input = input.subarray(4 + length)
    let message
    try {
      message = JSON.parse(body.toString("utf8"))
    } catch {
      process.exitCode = 2
      process.stdin.destroy()
      return
    }
    // Dispatch concurrently; output framing is serialized by writeFrame.
    void dispatch(message).catch(async (error) => {
      await writeFrame({ id: String(message?.id || ""), type: "error", error: publicError(error) })
    })
  }
})
process.stdin.on("end", () => {
  for (const controller of activeRequests.values()) controller.abort()
  process.exit(0)
})

await writeFrame({ type: "ready", protocolVersion: PROTOCOL_VERSION, pid: process.pid })
