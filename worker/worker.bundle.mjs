#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name14 in all)
    __defProp(target, name14, { get: all[name14], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/cursor-opencode-provider/dist/shared.js
var CURSOR_API_HOST, CURSOR_WEBSITE_HOST, FALLBACK_CLIENT_VERSION, CURSOR_PROVIDER_ID, CURSOR_COMPACTION_OPTION, SERVER_CONFIG_PATH, MODEL_CACHE_FILE, MODEL_CACHE_SCHEMA_VERSION, MODEL_CACHE_TTL_MS, CONVERSATION_CACHE_DIR, CONVERSATION_CACHE_SCHEMA_VERSION, CONVERSATION_CACHE_TTL_MS, VERSION_CACHE_FILE, CONNECT_PROTOCOL_VERSION;
var init_shared = __esm({
  "node_modules/cursor-opencode-provider/dist/shared.js"() {
    CURSOR_API_HOST = "api2.cursor.sh";
    CURSOR_WEBSITE_HOST = "cursor.com";
    FALLBACK_CLIENT_VERSION = "cli-2026.07.09-a3815c0";
    CURSOR_PROVIDER_ID = "cursor";
    CURSOR_COMPACTION_OPTION = "opencodeCompaction";
    SERVER_CONFIG_PATH = "/aiserver.v1.ServerConfigService/GetServerConfig";
    MODEL_CACHE_FILE = "cursor-models.json";
    MODEL_CACHE_SCHEMA_VERSION = 3;
    MODEL_CACHE_TTL_MS = 864e5;
    CONVERSATION_CACHE_DIR = "cursor-conversations";
    CONVERSATION_CACHE_SCHEMA_VERSION = 3;
    CONVERSATION_CACHE_TTL_MS = 864e5;
    VERSION_CACHE_FILE = "cursor-client-version.json";
    CONNECT_PROTOCOL_VERSION = "1";
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/framing.js
import { gunzipSync, gzipSync } from "node:zlib";
function encodeFrame(flags, payload) {
  let data = payload;
  if (flags & FLAG_GZIP) {
    data = gzipSync(data);
  }
  const len = data.length;
  const header2 = new Uint8Array(5);
  header2[0] = flags;
  header2[1] = len >> 24 & 255;
  header2[2] = len >> 16 & 255;
  header2[3] = len >> 8 & 255;
  header2[4] = len & 255;
  const out = new Uint8Array(5 + len);
  out.set(header2, 0);
  out.set(data, 5);
  return out;
}
function decodeFramePayload(frame) {
  return frame.flags & FLAG_GZIP ? gunzipSync(frame.payload) : frame.payload;
}
function* streamFrames(buffer) {
  let offset = 0;
  while (offset + 5 <= buffer.length) {
    const flags = buffer[offset];
    const len = (buffer[offset + 1] << 24 | buffer[offset + 2] << 16 | buffer[offset + 3] << 8 | buffer[offset + 4]) >>> 0;
    const start = offset + 5;
    if (start + len > buffer.length)
      break;
    yield { flags, payload: buffer.subarray(start, start + len) };
    offset = start + len;
  }
}
var FLAG_GZIP;
var init_framing = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/framing.js"() {
    FLAG_GZIP = 1;
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/checksum.js
function obfuscate(bytes) {
  const out = new Uint8Array(bytes);
  let a = 165;
  for (let i = 0; i < out.length; i++) {
    out[i] = (out[i] ^ a) + i & 255;
    a = out[i];
  }
  return out;
}
function createCursorChecksumHeader(machineId, macMachineId) {
  const n = Math.floor(Date.now() / 1e6);
  const ts = new Uint8Array([
    n >> 40 & 255,
    n >> 32 & 255,
    n >> 24 & 255,
    n >> 16 & 255,
    n >> 8 & 255,
    n & 255
  ]);
  const obfuscated = obfuscate(ts);
  const prefix = btoa(String.fromCharCode(...obfuscated)).replace(/=+$/, "");
  return macMachineId ? `${prefix}${machineId}/${macMachineId}` : `${prefix}${machineId}`;
}
var init_checksum = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/checksum.js"() {
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/device-id.js
import crypto2 from "node:crypto";
import os from "node:os";
import fs from "node:fs";
import { execSync } from "node:child_process";
function sha256hex(s) {
  return crypto2.createHash("sha256").update(s, "utf8").digest("hex");
}
function readMacOSUUID() {
  try {
    const out = execSync("ioreg -rd1 -c IOPlatformExpertDevice", {
      timeout: 5e3
    }).toString();
    const after = out.split("IOPlatformUUID")[1];
    if (!after)
      return void 0;
    return after.split("\n")[0].replace(/=|\s+|"/gi, "").toLowerCase();
  } catch {
    return void 0;
  }
}
function readLinuxMachineId() {
  for (const p of ["/etc/machine-id", "/var/lib/dbus/machine-id"]) {
    try {
      const v = fs.readFileSync(p, "utf8");
      if (v)
        return v.trim();
    } catch {
    }
  }
  return void 0;
}
function readWindowsMachineGuid() {
  try {
    const out = execSync('reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid', { timeout: 5e3 }).toString();
    const m = out.split("MachineGuid")[1];
    if (!m)
      return void 0;
    const hex4 = m.replace(/=|\s+|"/gi, "");
    return hex4 || void 0;
  } catch {
    return void 0;
  }
}
function platformUuid() {
  switch (process.platform) {
    case "darwin":
      return readMacOSUUID();
    case "linux":
      return readLinuxMachineId();
    case "win32":
      return readWindowsMachineGuid();
    default:
      return void 0;
  }
}
function firstMacAddress() {
  try {
    const ifaces = os.networkInterfaces();
    for (const list of Object.values(ifaces)) {
      if (!list)
        continue;
      for (const ni of list) {
        if (ni && ni.mac && ni.mac !== "00:00:00:00:00:00")
          return ni.mac;
      }
    }
  } catch {
  }
  return void 0;
}
function getDeviceIds() {
  if (_cached)
    return _cached;
  const mac = firstMacAddress();
  const uuid = platformUuid();
  let machineId;
  if (uuid) {
    machineId = sha256hex(uuid);
  } else if (mac) {
    machineId = sha256hex(mac);
  } else {
    machineId = sha256hex(os.hostname());
  }
  const macMachineId = mac ? sha256hex(mac) : void 0;
  _cached = { machineId, macMachineId };
  return _cached;
}
var _cached;
var init_device_id = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/device-id.js"() {
  }
});

// node_modules/cursor-opencode-provider/dist/debug.js
import fs2 from "node:fs";
import os2 from "node:os";
import path from "node:path";
function resolveDebugLogPath() {
  if (process.env.CURSOR_PROVIDER_DEBUG_FILE) {
    return process.env.CURSOR_PROVIDER_DEBUG_FILE;
  }
  const uid = typeof process.getuid === "function" ? process.getuid() : process.pid;
  return path.join(os2.tmpdir(), `cursor-provider-logs-${uid}`, `debug-${process.pid}.log`);
}
function ensureSecureDebugLog(filePath, options = {}) {
  const dir = path.dirname(filePath);
  const secureParent = options.secureParent ?? true;
  fs2.mkdirSync(dir, secureParent ? { recursive: true, mode: 448 } : { recursive: true });
  if (secureParent) {
    const stat7 = fs2.lstatSync(dir);
    if (!stat7.isDirectory() || stat7.isSymbolicLink()) {
      throw new Error(`Debug log directory is not a real directory: ${dir}`);
    }
    if (typeof process.getuid === "function" && stat7.uid !== process.getuid()) {
      throw new Error(`Debug log directory is not owned by the current user: ${dir}`);
    }
    fs2.chmodSync(dir, 448);
  }
  fs2.writeFileSync(filePath, "", { mode: 384 });
  fs2.chmodSync(filePath, 384);
}
function announceLogPath(filePath) {
  if (_announcedLogPath)
    return;
  _announcedLogPath = true;
  try {
    console.error(`[cursor-provider] CURSOR_PROVIDER_DEBUG logging to ${filePath}`);
  } catch {
  }
}
function trace(msg) {
  if (!DEBUG_ENABLED)
    return;
  try {
    if (!_debugFile) {
      _debugFileUsesManagedDirectory = !process.env.CURSOR_PROVIDER_DEBUG_FILE;
      _debugFile = resolveDebugLogPath();
    }
    if (!_traceInitialized) {
      ensureSecureDebugLog(_debugFile, { secureParent: _debugFileUsesManagedDirectory });
      fs2.writeFileSync(_debugFile, `--- cursor-provider debug (pid ${process.pid}) ${(/* @__PURE__ */ new Date()).toISOString()} ---
`, { mode: 384 });
      _traceInitialized = true;
      announceLogPath(_debugFile);
      fs2.appendFileSync(_debugFile, `[${(/* @__PURE__ */ new Date()).toISOString()}] debug: enabled file=${_debugFile} xdg_cache_home=${process.env.XDG_CACHE_HOME ?? "(unset)"} cwd=${process.cwd()}
`);
    }
    fs2.appendFileSync(_debugFile, `[${(/* @__PURE__ */ new Date()).toISOString()}] ${msg}
`);
  } catch {
  }
}
function traceRequestContextPaths(label, requestContext) {
  if (!DEBUG_ENABLED)
    return;
  const env = requestContext?.env && typeof requestContext.env === "object" ? requestContext.env : void 0;
  const mcp = requestContext?.mcp_file_system_options && typeof requestContext.mcp_file_system_options === "object" ? requestContext.mcp_file_system_options : void 0;
  trace(`${label}: workspace_paths=${JSON.stringify(env?.workspace_paths ?? null)} process_working_directory=${JSON.stringify(env?.process_working_directory ?? null)} project_folder=${JSON.stringify(env?.project_folder ?? null)} terminals_folder=${JSON.stringify(env?.terminals_folder ?? null)} agent_transcripts_folder=${JSON.stringify(env?.agent_transcripts_folder ?? null)} workspace_project_dir=${JSON.stringify(mcp?.workspace_project_dir ?? null)}`);
}
var DEBUG_ENABLED, _traceInitialized, _debugFile, _debugFileUsesManagedDirectory, _announcedLogPath;
var init_debug = __esm({
  "node_modules/cursor-opencode-provider/dist/debug.js"() {
    DEBUG_ENABLED = process.env.CURSOR_PROVIDER_DEBUG === "1" || process.env.CURSOR_PROVIDER_DEBUG === "true";
    _traceInitialized = false;
    _debugFileUsesManagedDirectory = false;
    _announcedLogPath = false;
  }
});

// node_modules/cursor-opencode-provider/dist/context/paths.js
import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import path2 from "node:path";
function pathBridge() {
  const value = globalThis[HOST_PATH_BRIDGE];
  if (!value || typeof value !== "object")
    return void 0;
  const bridge = value;
  return typeof bridge.projectConfigDirs === "function" && typeof bridge.globalConfigDirs === "function" ? bridge : void 0;
}
function openCodeGlobalDataDir(env = process.env) {
  if (env.XDG_DATA_HOME && env.XDG_DATA_HOME.length > 0) {
    return path2.join(env.XDG_DATA_HOME, "opencode");
  }
  return path2.join(resolveHome(env), ".local", "share", "opencode");
}
function openCodeGlobalCacheDir(env = process.env) {
  return path2.join(xdgCacheHome(env), "opencode");
}
function bridgeGlobalDataDir() {
  const value = pathBridge()?.globalDataDir?.();
  return typeof value === "string" && value.length > 0 ? path2.resolve(value) : void 0;
}
function bridgeGlobalCacheDir() {
  const value = pathBridge()?.globalCacheDir?.();
  return typeof value === "string" && value.length > 0 ? path2.resolve(value) : void 0;
}
function opencodeProjectConfigDirs(workspaceRoot) {
  return pathBridge()?.projectConfigDirs(path2.resolve(workspaceRoot)) ?? [
    path2.join(path2.resolve(workspaceRoot), ".opencode")
  ];
}
function opencodeGlobalConfigDirs() {
  return pathBridge()?.globalConfigDirs() ?? [opencodeGlobalConfigDir()];
}
function opencodeConfigFileNames() {
  return pathBridge()?.configFileNames?.length ? [...pathBridge().configFileNames] : ["opencode.json", "opencode.jsonc"];
}
function resolveHome(env = process.env) {
  return env.HOME || env.USERPROFILE || homedir();
}
function xdgCacheHome(env = process.env) {
  if (env.XDG_CACHE_HOME && env.XDG_CACHE_HOME.length > 0)
    return env.XDG_CACHE_HOME;
  return path2.join(resolveHome(env), ".cache");
}
function setHostCacheDirOverride(dir) {
  hostCacheDirOverride = dir && dir.length > 0 ? path2.resolve(dir) : void 0;
}
function resolveHostCacheDir(env = process.env) {
  return bridgeGlobalCacheDir() ?? openCodeGlobalCacheDir(env);
}
function opencodeGlobalConfigDir() {
  return path2.join(resolveHome(), ".config", "opencode");
}
function opencodeGlobalCacheDir() {
  if (hostCacheDirOverride)
    return hostCacheDirOverride;
  return resolveHostCacheDir();
}
function hostGlobalDataDir(env = process.env) {
  return bridgeGlobalDataDir() ?? openCodeGlobalDataDir(env);
}
function hostPlansDir(_workspaceRoot) {
  return path2.join(hostGlobalDataDir(), "plans");
}
function slugifyWorkspacePath(workspaceRoot) {
  const resolved = path2.resolve(workspaceRoot);
  return resolved.replace(/[^a-zA-Z0-9]/g, "-").split("-").filter(Boolean).join("-");
}
function opencodeProjectDir(workspaceRoot) {
  const projectsRoot = path2.join(opencodeGlobalCacheDir(), "projects");
  const slug = slugifyWorkspacePath(workspaceRoot);
  let dir = path2.join(projectsRoot, slug);
  if (dir.length > 92) {
    const hash = createHash("sha256").update(dir).digest("hex").slice(0, 7);
    dir = `${dir.slice(0, Math.min(84, dir.length))}-${hash}`;
  }
  return dir;
}
function ensureOpencodeProjectDir(workspaceRoot) {
  const resolved = path2.resolve(workspaceRoot);
  const dir = opencodeProjectDir(resolved);
  mkdirSync(dir, { recursive: true, mode: 448 });
  trace(`project-dir: workspace=${resolved} slug=${slugifyWorkspacePath(resolved)} dir=${dir} cache_root=${opencodeGlobalCacheDir()} override=${hostCacheDirOverride ?? "(none)"} xdg_cache_home=${process.env.XDG_CACHE_HOME ?? "(unset)"}`);
  return dir;
}
function resolveHomeRelative(p) {
  if (p.startsWith("~/"))
    return path2.join(homedir(), p.slice(2));
  return p;
}
var HOST_PATH_BRIDGE, hostCacheDirOverride;
var init_paths = __esm({
  "node_modules/cursor-opencode-provider/dist/context/paths.js"() {
    init_debug();
    HOST_PATH_BRIDGE = /* @__PURE__ */ Symbol.for("opencode.host.path-bridge");
  }
});

// node_modules/cursor-opencode-provider/dist/deadline.js
async function withAbortDeadline(timeoutMs2, timeoutError, run) {
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(timeoutError());
      controller.abort();
    }, timeoutMs2);
    timer.unref?.();
  });
  try {
    return await Promise.race([run(controller.signal), deadline]);
  } finally {
    if (timer)
      clearTimeout(timer);
  }
}
var init_deadline = __esm({
  "node_modules/cursor-opencode-provider/dist/deadline.js"() {
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/client-version.js
import fs3 from "node:fs";
import path3 from "node:path";
function resolveClientVersion() {
  cachedResolution ??= resolve();
  return cachedResolution;
}
async function resolve() {
  const env = process.env.CURSOR_CLIENT_VERSION?.trim();
  if (isClientVersion(env))
    return env;
  const local = discoverLocalVersion();
  if (local)
    return local;
  return await resolveRemoteVersion() ?? FALLBACK_CLIENT_VERSION;
}
function isClientVersion(value) {
  return typeof value === "string" && CLIENT_VERSION_RE.test(value);
}
function cursorAgentVersionsDir() {
  const home = process.env.HOME || process.env.USERPROFILE;
  if (!home)
    return void 0;
  switch (process.platform) {
    case "linux":
    case "darwin":
      return path3.join(home, ".local", "share", "cursor-agent", "versions");
    default:
      return void 0;
  }
}
function discoverLocalVersion(dir = cursorAgentVersionsDir()) {
  if (!dir)
    return void 0;
  let entries;
  try {
    entries = fs3.readdirSync(dir, { withFileTypes: true });
  } catch {
    return void 0;
  }
  let newest;
  for (const entry of entries) {
    if (!entry.isDirectory() || !BUILD_RE.test(entry.name))
      continue;
    try {
      const mtimeMs = fs3.statSync(path3.join(dir, entry.name)).mtimeMs;
      if (!newest || mtimeMs > newest.mtimeMs || mtimeMs === newest.mtimeMs && entry.name > newest.name) {
        newest = { name: entry.name, mtimeMs };
      }
    } catch {
    }
  }
  return newest ? `cli-${newest.name}` : void 0;
}
function extractVersionFromInstaller(script) {
  const match = script.match(/downloads\.cursor\.com\/lab\/([^/"'\s]+)\//);
  return match && BUILD_RE.test(match[1]) ? match[1] : void 0;
}
function versionCachePath() {
  return path3.join(opencodeGlobalCacheDir(), VERSION_CACHE_FILE);
}
function readVersionCache() {
  const file = versionCachePath();
  try {
    const value = JSON.parse(fs3.readFileSync(file, "utf8"));
    if (!isClientVersion(value.version) || typeof value.fetchedAt !== "number" || !Number.isFinite(value.fetchedAt)) {
      return void 0;
    }
    return { version: value.version, fetchedAt: value.fetchedAt };
  } catch {
    return void 0;
  }
}
function writeVersionCache(cache) {
  const file = versionCachePath();
  try {
    fs3.mkdirSync(path3.dirname(file), { recursive: true });
    fs3.writeFileSync(file, JSON.stringify(cache, null, 2));
  } catch {
  }
}
function isCacheFresh(cache, now = Date.now()) {
  const age = now - cache.fetchedAt;
  return age >= 0 && age < MODEL_CACHE_TTL_MS;
}
async function fetchInstallerVersion() {
  return withAbortDeadline(REMOTE_TIMEOUT_MS, () => new Error("Cursor installer version request timed out"), async (signal) => {
    const response = await fetch(INSTALL_URL, { signal });
    if (!response.ok)
      return void 0;
    const build = extractVersionFromInstaller(await response.text());
    return build ? `cli-${build}` : void 0;
  });
}
async function refreshVersionCache() {
  const version = await fetchInstallerVersion();
  if (version)
    writeVersionCache({ version, fetchedAt: Date.now() });
}
async function resolveRemoteVersion() {
  const cached = readVersionCache();
  if (cached && isCacheFresh(cached)) {
    void refreshVersionCache().catch(() => {
    });
    return cached.version;
  }
  try {
    const version = await fetchInstallerVersion();
    if (version) {
      writeVersionCache({ version, fetchedAt: Date.now() });
      return version;
    }
  } catch {
  }
  return cached?.version;
}
var INSTALL_URL, REMOTE_TIMEOUT_MS, BUILD_RE, CLIENT_VERSION_RE, cachedResolution;
var init_client_version = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/client-version.js"() {
    init_shared();
    init_paths();
    init_deadline();
    INSTALL_URL = "https://cursor.com/install";
    REMOTE_TIMEOUT_MS = 5e3;
    BUILD_RE = /^\d{4}\.\d{2}\.\d{2}-[0-9A-Za-z][0-9A-Za-z.-]*$/;
    CLIENT_VERSION_RE = /^cli-[0-9A-Za-z][0-9A-Za-z._-]*$/;
  }
});

// node_modules/cursor-opencode-provider/dist/errors.js
function sanitizeHostTerminalMessage(message) {
  return message.replace(/\bresource[_\s-]?exhausted\b/gi, "capacity_limit").replace(/\bservice[_\s-]?unavailable\b/gi, "capacity_limit").replace(/\bunavailable\b/gi, "capacity_limit").replace(/\boverloaded\b/gi, "capacity_limit").replace(/\bretry exhausted\b/gi, "retries finished").replace(/\bexhausted\b/gi, "finished");
}
function isTransientGrpcStatus(status) {
  const normalized = String(status).toLowerCase().replaceAll("-", "_");
  return normalized === "8" || normalized === "13" || normalized === "14" || normalized === "internal" || normalized === "resource_exhausted" || normalized === "unavailable";
}
function isAuthGrpcStatus(status) {
  const normalized = String(status).toLowerCase().replaceAll("-", "_");
  return normalized === "7" || normalized === "16" || normalized === "permission_denied" || normalized === "unauthenticated";
}
function cursorHttpError(operation, statusCode, diagnostics = {}) {
  if (statusCode === 401 || statusCode === 403) {
    return new CursorAuthError(`Cursor authentication failed (HTTP ${statusCode}); reauthenticate with Cursor`, { ...diagnostics, statusCode });
  }
  return new CursorServerError(`${operation} HTTP ${statusCode}`, {
    ...diagnostics,
    statusCode,
    transient: statusCode === 429 || statusCode >= 500,
    replaySafe: true
  });
}
function cursorGrpcError(operation, grpcStatus, diagnostics = {}) {
  if (isAuthGrpcStatus(grpcStatus)) {
    return new CursorAuthError(`Cursor authentication failed (gRPC ${grpcStatus}); reauthenticate with Cursor`, { ...diagnostics, grpcStatus });
  }
  return new CursorServerError(`${operation} gRPC status ${grpcStatus}`, {
    ...diagnostics,
    grpcStatus,
    transient: isTransientGrpcStatus(grpcStatus),
    replaySafe: true
  });
}
function errorCode(error) {
  if (!error || typeof error !== "object")
    return void 0;
  const code = error.code;
  return typeof code === "string" ? code : void 0;
}
function toCursorProviderError(error, options = { replaySafe: false }) {
  if (error instanceof CursorProviderError) {
    error.replaySafe = options.replaySafe && error.replaySafe;
    return error;
  }
  const code = errorCode(error);
  const name14 = error instanceof Error ? error.name : "Error";
  const message = error instanceof Error ? error.message : "";
  if (name14.startsWith("Auth") || /access token|api key|authentication/i.test(message)) {
    return new CursorAuthError(void 0, { code, cause: error });
  }
  const httpStatus = /\bHTTP\s+(\d{3})\b/i.exec(message)?.[1];
  if (httpStatus) {
    const failure = cursorHttpError("Cursor request failed with", Number(httpStatus), { code });
    failure.replaySafe = options.replaySafe && failure.replaySafe;
    return failure;
  }
  if (code && TRANSIENT_NETWORK_CODES.has(code)) {
    return new CursorTransportError(`Cursor transport failure (${code})`, {
      transient: true,
      replaySafe: options.replaySafe,
      code,
      cause: error
    });
  }
  if (error instanceof TypeError) {
    return new CursorProtocolError(options.fallback ?? "Invalid Cursor provider configuration", {
      code,
      cause: error
    });
  }
  return new CursorProtocolError(options.fallback ?? `Cursor provider failure (${name14})`, {
    code,
    cause: error
  });
}
function retrySuppressedError(cause, reason, attempt, maxAttempts) {
  const subject = sanitizeHostTerminalMessage(cause.message.replace(/^Cursor Run stream /, "Cursor stream "));
  return new CursorProviderError(`${subject} ${reason}; automatic retry unsafe (attempt ${attempt}/${maxAttempts})`, {
    origin: cause.origin,
    transient: false,
    replaySafe: false,
    statusCode: cause.statusCode,
    grpcStatus: cause.grpcStatus,
    rstCode: cause.rstCode,
    code: cause.code,
    retryAfterMs: cause.retryAfterMs,
    cause
  });
}
var CursorProviderError, CursorLocalCancellationError, CursorTransportError, CursorServerError, CursorProtocolError, CursorAuthError, CursorRetryExhaustedError, TRANSIENT_NETWORK_CODES;
var init_errors = __esm({
  "node_modules/cursor-opencode-provider/dist/errors.js"() {
    CursorProviderError = class extends Error {
      origin;
      transient;
      replaySafe;
      statusCode;
      grpcStatus;
      rstCode;
      code;
      retryAfterMs;
      constructor(message, options) {
        super(message, options.cause === void 0 ? void 0 : { cause: options.cause });
        this.name = "CursorProviderError";
        this.origin = options.origin;
        this.transient = options.transient;
        this.replaySafe = options.replaySafe;
        this.statusCode = options.statusCode;
        this.grpcStatus = options.grpcStatus;
        this.rstCode = options.rstCode;
        this.code = options.code;
        this.retryAfterMs = options.retryAfterMs;
      }
    };
    CursorLocalCancellationError = class extends CursorProviderError {
      constructor(message = "Cursor request cancelled locally", cause) {
        super(message, {
          origin: "local-cancel",
          transient: false,
          replaySafe: false,
          cause
        });
        this.name = "CursorLocalCancellationError";
      }
    };
    CursorTransportError = class extends CursorProviderError {
      constructor(message, options = {
        transient: true,
        replaySafe: true
      }) {
        super(message, { ...options, origin: "transport" });
        this.name = "CursorTransportError";
      }
    };
    CursorServerError = class extends CursorProviderError {
      constructor(message, options) {
        super(message, { ...options, origin: "server" });
        this.name = "CursorServerError";
      }
    };
    CursorProtocolError = class extends CursorProviderError {
      constructor(message, options = {}) {
        super(message, {
          ...options,
          origin: "protocol",
          transient: false,
          replaySafe: false
        });
        this.name = "CursorProtocolError";
      }
    };
    CursorAuthError = class extends CursorProviderError {
      constructor(message = "Cursor authentication failed; reauthenticate with Cursor", options = {}) {
        super(message, {
          ...options,
          origin: "auth",
          transient: false,
          replaySafe: false
        });
        this.name = "CursorAuthError";
      }
    };
    CursorRetryExhaustedError = class extends CursorProviderError {
      attempts;
      constructor(attempts, last) {
        super(`Cursor Run failed after ${attempts} attempts: ${sanitizeHostTerminalMessage(last.message)}`, {
          origin: last.origin,
          transient: false,
          replaySafe: false,
          statusCode: last.statusCode,
          grpcStatus: last.grpcStatus,
          rstCode: last.rstCode,
          code: last.code,
          retryAfterMs: last.retryAfterMs,
          cause: last
        });
        this.name = "CursorRetryExhaustedError";
        this.attempts = attempts;
      }
    };
    TRANSIENT_NETWORK_CODES = /* @__PURE__ */ new Set([
      "ECONNABORTED",
      "ECONNREFUSED",
      "ECONNRESET",
      "EHOSTUNREACH",
      "ENETDOWN",
      "ENETRESET",
      "ENETUNREACH",
      "ENOTFOUND",
      "EPIPE",
      "ERR_HTTP2_GOAWAY_SESSION",
      "ERR_HTTP2_SESSION_ERROR",
      "ERR_HTTP2_STREAM_CANCEL",
      "ERR_HTTP2_STREAM_ERROR",
      "ETIMEDOUT"
    ]);
  }
});

// node_modules/cursor-opencode-provider/dist/transport/connect.js
import http2 from "node:http2";
function unaryTimeoutMs(operation, value) {
  const timeoutMs2 = value ?? DEFAULT_UNARY_TIMEOUT_MS;
  if (!Number.isSafeInteger(timeoutMs2) || timeoutMs2 <= 0 || timeoutMs2 > MAX_TIMER_MS) {
    throw new CursorProtocolError(`${operation} timeout must be a positive integer no greater than ${MAX_TIMER_MS}`, { code: "CURSOR_INVALID_TIMEOUT" });
  }
  return timeoutMs2;
}
async function withUnaryDeadline(operation, timeoutMs2, timeoutCode, run) {
  return withAbortDeadline(timeoutMs2, () => new CursorTransportError(`${operation} timed out after ${timeoutMs2}ms`, {
    transient: true,
    replaySafe: true,
    code: timeoutCode
  }), run);
}
function resolveApiBaseURL(options) {
  return new URL(options.apiBaseURL ?? options.baseURL ?? API_BASE).origin;
}
function buildBaseHeaders(token, clientVersion, extra) {
  const { machineId, macMachineId } = getDeviceIds();
  const headers = {
    authorization: `Bearer ${token}`,
    "connect-protocol-version": CONNECT_PROTOCOL_VERSION,
    "x-cursor-client-type": "cli",
    "x-cursor-client-version": clientVersion,
    "x-cursor-checksum": createCursorChecksumHeader(machineId, macMachineId),
    "x-ghost-mode": "true",
    ...extra
  };
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === "x-request-id")
      delete headers[key];
  }
  headers["x-request-id"] = crypto.randomUUID();
  return headers;
}
async function unaryAvailableModels(token, options = {}) {
  const base = resolveApiBaseURL(options);
  const url = `${base}/aiserver.v1.AiService/AvailableModels`;
  const timeoutMs2 = unaryTimeoutMs("AvailableModels", options.timeoutMs);
  return withUnaryDeadline("AvailableModels", timeoutMs2, "CURSOR_AVAILABLE_MODELS_TIMEOUT", async (signal) => {
    const clientVersion = await resolveClientVersion();
    const headers = buildBaseHeaders(token, clientVersion, options.headers);
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
          accept: "application/json"
        },
        // Request parameterized effort/context/fast variants like Cursor IDE.
        body: JSON.stringify({
          includeLongContextModels: true,
          useModelParameters: true,
          useCloudAgentEffortModes: true
        }),
        signal
      });
    } catch (cause) {
      throw new CursorTransportError("AvailableModels network request failed", {
        transient: true,
        replaySafe: true,
        code: errorCode(cause),
        cause
      });
    }
    if (!res.ok) {
      throw await cursorHttpResponseError("AvailableModels failed:", res);
    }
    try {
      return await res.json();
    } catch (cause) {
      throw new CursorProtocolError("AvailableModels returned malformed JSON", { cause });
    }
  });
}
function isAllowedAgentHost(hostname) {
  return /^([a-z0-9-]+\.)+cursor\.sh$/i.test(hostname);
}
function normalizeAgentRunOrigin(raw) {
  if (raw === void 0 || raw === null)
    return null;
  const trimmed = String(raw).trim();
  if (!trimmed)
    return null;
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withScheme);
    if (parsed.protocol !== "https:")
      return null;
    if (parsed.username || parsed.password)
      return null;
    if (!isAllowedAgentHost(parsed.hostname))
      return null;
    return parsed.origin;
  } catch {
    return null;
  }
}
async function fetchAgentUrl(token, options = {}) {
  const base = resolveApiBaseURL(options);
  const url = `${base}${SERVER_CONFIG_PATH}`;
  const timeoutMs2 = unaryTimeoutMs("GetServerConfig", options.timeoutMs);
  return withUnaryDeadline("GetServerConfig", timeoutMs2, "CURSOR_AGENT_URL_TIMEOUT", async (signal) => {
    const clientVersion = await resolveClientVersion();
    const headers = buildBaseHeaders(token, clientVersion);
    trace(`GetServerConfig POST ${url}`);
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify({ telem_enabled: options.telemetryEnabled ?? false }),
        signal
      });
    } catch (cause) {
      throw new CursorTransportError("GetServerConfig network request failed", {
        transient: true,
        replaySafe: true,
        code: errorCode(cause),
        cause
      });
    }
    if (!res.ok) {
      throw await cursorHttpResponseError("GetServerConfig failed:", res);
    }
    let body;
    try {
      body = await res.json();
    } catch (cause) {
      throw new CursorProtocolError("GetServerConfig returned malformed JSON", { cause });
    }
    const cfg = body.agentUrlConfig;
    const raw = cfg?.agentnUrl || cfg?.agentUrl;
    const normalized = normalizeAgentRunOrigin(raw);
    trace(`GetServerConfig reply: agentnUrl=${cfg?.agentnUrl ?? "<missing>"} agentUrl=${cfg?.agentUrl ?? "<missing>"} \u2192 ${normalized ?? "<invalid>"}`);
    if (!normalized) {
      throw new CursorProtocolError(raw ? "GetServerConfig returned an invalid Cursor agent URL" : "GetServerConfig response missing agentUrlConfig.agentnUrl");
    }
    return normalized;
  });
}
function cursorRunTerminationError(input2) {
  const headers = input2.responseHeaders ?? {};
  const trailers = input2.responseTrailers ?? {};
  if (input2.streamError) {
    return new CursorRunInterruptedError(`Cursor Run transport interrupted: ${input2.streamError.message}`, { cause: input2.streamError });
  }
  if (input2.responseStatus !== 0 && input2.responseStatus !== 200) {
    return cursorRunHttpError(input2.responseStatus, headers);
  }
  const grpcStatus = trailers["grpc-status"] ?? headers["grpc-status"];
  if (grpcStatus !== void 0 && String(grpcStatus) !== "0") {
    return cursorRunGrpcError(String(grpcStatus), headers, trailers);
  }
  return new CursorRunInterruptedError();
}
function withErrorMessageSuffix(error, suffix) {
  if (suffix)
    error.message += suffix;
  return error;
}
async function cursorHttpResponseError(operation, res) {
  const text = await res.text().catch(() => "");
  return withErrorMessageSuffix(cursorHttpError(operation, res.status), `${res.statusText ? ` ${res.statusText}` : ""}${text ? ` - ${text.slice(0, 200)}` : ""}`);
}
function cursorRunHttpError(statusCode, headers) {
  return withErrorMessageSuffix(cursorHttpError("Cursor Run failed by remote:", statusCode), ` ${JSON.stringify(stripPseudo(headers))}`);
}
function cursorRunGrpcError(grpcStatus, headers, trailers) {
  const message = trailers["grpc-message"] ?? headers["grpc-message"];
  return withErrorMessageSuffix(cursorGrpcError("Cursor Run failed by remote:", grpcStatus), message === void 0 ? "" : `: ${message}`);
}
function shouldReuseHttp2Session(state, createdAt, now = Date.now()) {
  return !state.destroyed && !state.closed && now - createdAt < HTTP2_SESSION_MAX_AGE_MS;
}
function resolveAgentOrigin(baseURL) {
  const origin = normalizeAgentRunOrigin(baseURL);
  if (!origin) {
    throw new CursorProtocolError("Cursor Run stream requires an allowlisted Cursor agent base URL");
  }
  return origin;
}
function dropSession(origin, session) {
  if (_http2Sessions.get(origin) === session)
    _http2Sessions.delete(origin);
}
function timeoutMs(name14, value, fallback) {
  const resolved = value ?? fallback;
  if (!Number.isSafeInteger(resolved) || resolved <= 0 || resolved > MAX_TIMER_MS) {
    throw new CursorProtocolError(`${name14} must be a positive integer no greater than ${MAX_TIMER_MS}`);
  }
  return resolved;
}
function toTransportError(value, fallback) {
  if (value instanceof CursorTransportError)
    return value;
  return new CursorTransportError(fallback, {
    transient: true,
    replaySafe: true,
    code: errorCode(value),
    cause: value
  });
}
function installSessionInvalidation(origin, session) {
  const socket = session.socket;
  let cleaned = false;
  let removeSocketListeners;
  const cleanup = () => {
    if (cleaned)
      return;
    cleaned = true;
    session.removeListener("close", onSessionClose);
    session.removeListener("goaway", onSessionGoaway);
    session.removeListener("error", onSessionError);
    removeSocketListeners?.();
    removeSocketListeners = void 0;
    _http2SessionListenerCleanup.delete(session);
  };
  const onSessionClose = () => {
    trace(`h2 session closed: origin=${origin}`);
    dropSession(origin, session);
    cleanup();
  };
  const onSessionGoaway = (errorCode2, lastStreamID) => {
    trace(`h2 session GOAWAY: origin=${origin} errorCode=${errorCode2} lastStreamID=${lastStreamID}`);
    dropSession(origin, session);
  };
  const onSessionError = (error) => {
    trace(`h2 session error: origin=${origin} err=${error.message}`);
    dropSession(origin, session);
  };
  const onSocketEnd = () => {
    trace(`h2 socket ended: origin=${origin}`);
    dropSession(origin, session);
  };
  const onSocketClose = () => {
    trace(`h2 socket closed: origin=${origin}`);
    dropSession(origin, session);
  };
  session.once("close", onSessionClose);
  session.on("goaway", onSessionGoaway);
  session.on("error", onSessionError);
  if (socket) {
    socket.once("end", onSocketEnd);
    socket.once("close", onSocketClose);
    const removeEndListener = socket.removeListener.bind(socket, "end", onSocketEnd);
    const removeCloseListener = socket.removeListener.bind(socket, "close", onSocketClose);
    removeSocketListeners = () => {
      try {
        removeEndListener();
      } catch {
      }
      try {
        removeCloseListener();
      } catch {
      }
    };
  }
  _http2SessionListenerCleanup.set(session, cleanup);
}
function invalidateSession(origin, session) {
  dropSession(origin, session);
  _http2SessionListenerCleanup.get(session)?.();
  try {
    session.destroy();
  } catch {
  }
}
function validateCachedSession(session, pingTimeoutMs) {
  if (session.destroyed || session.closed) {
    return Promise.reject(new CursorTransportError("Cursor HTTP/2 cached session is already closed"));
  }
  return new Promise((resolve2, reject) => {
    let settled = false;
    const finish = (error) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timer);
      session.removeListener("close", onClosed);
      session.removeListener("goaway", onGoaway);
      session.removeListener("error", onError);
      if (error)
        reject(error);
      else
        resolve2();
    };
    const onClosed = () => finish(new CursorTransportError("Cursor HTTP/2 cached session closed during ping"));
    const onGoaway = () => finish(new CursorTransportError("Cursor HTTP/2 cached session received GOAWAY during ping"));
    const onError = (error) => finish(toTransportError(error, "Cursor HTTP/2 cached session ping failed"));
    const timer = setTimeout(() => {
      finish(new CursorTransportError(`Cursor HTTP/2 cached session ping timed out after ${pingTimeoutMs}ms`));
    }, pingTimeoutMs);
    timer.unref?.();
    session.once("close", onClosed);
    session.once("goaway", onGoaway);
    session.once("error", onError);
    try {
      const accepted = session.ping((error) => {
        if (error)
          finish(toTransportError(error, "Cursor HTTP/2 cached session ping failed"));
        else
          finish();
      });
      if (!accepted)
        finish(new CursorTransportError("Cursor HTTP/2 cached session refused a health-check ping"));
    } catch (error) {
      finish(toTransportError(error, "Cursor HTTP/2 cached session ping failed"));
    }
  });
}
function connectSession(origin) {
  return new Promise((resolve2, reject) => {
    const session = http2.connect(origin);
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      session.removeListener("error", onError);
      session.removeListener("close", onClose);
      session.removeListener("connect", onConnect);
    };
    const fail = (error) => {
      if (settled)
        return;
      settled = true;
      cleanup();
      dropSession(origin, session);
      try {
        session.destroy();
      } catch {
      }
      reject(error);
    };
    const onError = (error) => fail(toTransportError(error, "Cursor HTTP/2 connection failed"));
    const onClose = () => fail(new CursorTransportError(`HTTP/2 connection to ${origin} closed before connecting`));
    const onConnect = () => {
      if (settled)
        return;
      settled = true;
      cleanup();
      installSessionInvalidation(origin, session);
      if (session.destroyed || session.closed) {
        const error = new CursorTransportError(`HTTP/2 connection to ${origin} closed while connecting`);
        invalidateSession(origin, session);
        reject(error);
        return;
      }
      _http2SessionCreatedAt.set(session, Date.now());
      _http2Sessions.set(origin, session);
      trace(`h2 session connected: origin=${origin}`);
      resolve2(session);
    };
    const timer = setTimeout(() => {
      fail(new CursorTransportError(`HTTP/2 connect to ${origin} timed out after ${CONNECT_TIMEOUT_MS}ms`));
    }, CONNECT_TIMEOUT_MS);
    timer.unref?.();
    session.on("error", onError);
    session.once("close", onClose);
    session.once("connect", onConnect);
  });
}
function getSession(baseURL, options = {}) {
  const origin = resolveAgentOrigin(baseURL);
  const pingTimeoutMs = timeoutMs("Cursor provider pingTimeoutMs", options.pingTimeoutMs, DEFAULT_SESSION_PING_TIMEOUT_MS);
  const inflight = _http2Connecting.get(origin);
  if (inflight)
    return inflight;
  const promise = (async () => {
    const existing = _http2Sessions.get(origin);
    if (existing) {
      const createdAt = _http2SessionCreatedAt.get(existing) ?? 0;
      if (!shouldReuseHttp2Session(existing, createdAt)) {
        trace(`h2 session rotate: origin=${origin} ageMs=${Math.max(0, Date.now() - createdAt)}`);
        dropSession(origin, existing);
        try {
          existing.close();
        } catch {
        }
      } else {
        try {
          await validateCachedSession(existing, pingTimeoutMs);
          if (_http2Sessions.get(origin) === existing && !existing.destroyed && !existing.closed) {
            trace(`h2 cached session ping ok: origin=${origin}`);
            return existing;
          }
        } catch (error) {
          trace(`h2 cached session ping failed: origin=${origin} err=${error.message}`);
          invalidateSession(origin, existing);
        }
      }
    }
    return connectSession(origin);
  })();
  _http2Connecting.set(origin, promise);
  const cleanup = () => {
    if (_http2Connecting.get(origin) === promise)
      _http2Connecting.delete(origin);
  };
  promise.then(cleanup, cleanup);
  return promise;
}
async function bidiRunStream(token, options) {
  const origin = resolveAgentOrigin(options.baseURL);
  const readIdleMs = timeoutMs("Cursor provider readIdleMs", options.readIdleMs, DEFAULT_READ_IDLE_MS);
  const [session, clientVersion] = await Promise.all([
    getSession(options.baseURL, { pingTimeoutMs: options.pingTimeoutMs }),
    resolveClientVersion()
  ]);
  const headers = {
    ...buildBaseHeaders(token, clientVersion, options.headers),
    ":method": "POST",
    ":path": "/agent.v1.AgentService/Run",
    "content-type": "application/connect+proto",
    "connect-accept-encoding": "gzip,br",
    // The CLI's streaming interceptor sets this on the bidi Run stream
    // (decompiled client.ts:1190). Without it Cursor may treat the stream as
    // non-streaming.
    "x-cursor-streaming": "true",
    "user-agent": "connect-es/1.6.1"
  };
  const stream = session.request(headers, {
    endStream: false
  });
  let writable = true;
  let locallyClosed = false;
  let remotelyClosed = false;
  let backpressured = false;
  let responseStatus = 0;
  let responseHeaders = {};
  let responseTrailers = {};
  let rawStreamError;
  let streamFailure = null;
  let terminalEvent;
  let terminalSettlementScheduled = false;
  const terminalListeners = /* @__PURE__ */ new Set();
  const inboundFrames = [];
  const pendingChunks = [];
  let inboundEnded = false;
  let inboundFailure;
  let inboundWaiter;
  let readIdleTimer;
  let inboundReaderStarted = false;
  const abortSignal = options.signal;
  let abortHandler;
  const observedFailure = () => {
    if (streamFailure)
      return streamFailure;
    if (responseStatus !== 0 && responseStatus !== 200) {
      streamFailure = cursorRunHttpError(responseStatus, responseHeaders);
      return streamFailure;
    }
    const grpcStatus = responseTrailers["grpc-status"] ?? responseHeaders["grpc-status"];
    if (grpcStatus !== void 0 && String(grpcStatus) !== "0") {
      streamFailure = cursorRunGrpcError(String(grpcStatus), responseHeaders, responseTrailers);
      return streamFailure;
    }
    if (rawStreamError) {
      streamFailure = toTransportError(rawStreamError, "Cursor Run transport interrupted");
      return streamFailure;
    }
    return void 0;
  };
  const settleTerminal = (event) => {
    if (terminalEvent)
      return;
    terminalEvent = event;
    for (const listener of terminalListeners) {
      try {
        listener(event);
      } catch {
      }
    }
    terminalListeners.clear();
  };
  const clearReadIdleTimer = () => {
    if (readIdleTimer)
      clearTimeout(readIdleTimer);
    readIdleTimer = void 0;
  };
  const cleanupTerminalResources = () => {
    clearReadIdleTimer();
    if (abortSignal && abortHandler) {
      abortSignal.removeEventListener("abort", abortHandler);
      abortHandler = void 0;
    }
  };
  const finishInbound = (error) => {
    if (error) {
      inboundFailure = error;
      pendingChunks.length = 0;
    } else if (!inboundFailure) {
      inboundEnded = true;
    }
    const waiter = inboundWaiter;
    inboundWaiter = void 0;
    if (!waiter)
      return;
    if (inboundFailure)
      waiter.reject(inboundFailure);
    else
      waiter.resolve(void 0);
  };
  const stopInboundReader = () => {
    cleanupTerminalResources();
    if (inboundReaderStarted) {
      stream.removeListener("data", onInboundChunk);
      inboundReaderStarted = false;
    }
  };
  const nextInboundFrame = () => {
    const queued = inboundFrames.shift();
    if (queued)
      return Promise.resolve(queued);
    if (inboundFailure)
      return Promise.reject(inboundFailure);
    if (inboundEnded)
      return Promise.resolve(void 0);
    return new Promise((resolve2, reject) => {
      inboundWaiter = { resolve: resolve2, reject };
    });
  };
  const enqueueFrame = (frame) => {
    const waiter = inboundWaiter;
    inboundWaiter = void 0;
    if (waiter)
      waiter.resolve(frame);
    else
      inboundFrames.push(frame);
  };
  const settleObservedTerminal = () => {
    terminalSettlementScheduled = false;
    if (terminalEvent)
      return;
    if (locallyClosed) {
      finishInbound();
      stopInboundReader();
      settleTerminal({ kind: "local-close" });
      return;
    }
    const failure = observedFailure();
    finishInbound(failure);
    stopInboundReader();
    settleTerminal(failure ? { kind: "remote-error", error: failure } : { kind: "remote-clean-close" });
  };
  const scheduleTerminalSettlement = () => {
    if (terminalEvent || terminalSettlementScheduled)
      return;
    terminalSettlementScheduled = true;
    setImmediate(settleObservedTerminal);
  };
  const onReadIdleTimeout = () => {
    readIdleTimer = void 0;
    if (locallyClosed || remotelyClosed || streamFailure)
      return;
    streamFailure = new CursorTransportError(`Cursor Run stream read-idle timeout after ${readIdleMs}ms \u2014 connection presumed dead`, { transient: true, replaySafe: true, code: "CURSOR_READ_IDLE_TIMEOUT" });
    writable = false;
    finishInbound(streamFailure);
    stopInboundReader();
    settleTerminal({ kind: "remote-error", error: streamFailure });
    try {
      stream.destroy(streamFailure);
    } catch {
    }
  };
  const armReadIdleWatchdog = () => {
    clearReadIdleTimer();
    if (locallyClosed || remotelyClosed || streamFailure)
      return;
    readIdleTimer = setTimeout(onReadIdleTimeout, readIdleMs);
    readIdleTimer.unref?.();
  };
  const onInboundChunk = (chunk) => {
    armReadIdleWatchdog();
    if (inboundEnded || inboundFailure)
      return;
    pendingChunks.push(new Uint8Array(chunk));
    const merged = mergeBuffers(pendingChunks);
    const parsed = Array.from(streamFrames(merged));
    const consumed = parsed.reduce((sum, frame) => sum + 5 + frame.payload.length, 0);
    pendingChunks.length = 0;
    if (consumed < merged.length)
      pendingChunks.push(merged.subarray(consumed));
    for (const frame of parsed)
      enqueueFrame(frame);
  };
  const startInboundReader = () => {
    if (inboundReaderStarted || locallyClosed || remotelyClosed || streamFailure)
      return;
    inboundReaderStarted = true;
    stream.on("data", onInboundChunk);
    armReadIdleWatchdog();
  };
  stream.on("response", (h) => {
    responseHeaders = h;
    responseStatus = h[":status"] !== void 0 ? Number(h[":status"]) : 0;
    trace(`h2 response: status=${responseStatus} headers=${JSON.stringify(stripPseudo(h))}`);
  });
  stream.on("trailers", (h) => {
    responseTrailers = h;
    trace(`h2 trailers: ${JSON.stringify(stripPseudo(h))}`);
  });
  stream.on("error", (err) => {
    rawStreamError = err;
    writable = false;
    trace(`h2 stream error: ${err?.name}: ${err?.message}`);
    scheduleTerminalSettlement();
  });
  stream.on("aborted", () => {
    writable = false;
    rawStreamError ??= new CursorTransportError("Cursor Run stream aborted by remote", {
      transient: true,
      replaySafe: true,
      rstCode: stream.rstCode,
      code: "ERR_HTTP2_STREAM_CANCEL"
    });
    scheduleTerminalSettlement();
  });
  stream.on("end", () => {
    writable = false;
    scheduleTerminalSettlement();
  });
  stream.on("close", () => {
    writable = false;
    remotelyClosed = !locallyClosed;
    if (remotelyClosed) {
      dropSession(origin, session);
      try {
        session.close();
      } catch {
      }
    }
    trace(`h2 stream closed (status=${responseStatus}, local=${locallyClosed}, err=${rawStreamError instanceof Error ? rawStreamError.message : "none"})`);
    scheduleTerminalSettlement();
  });
  if (abortSignal) {
    abortHandler = () => {
      if (!locallyClosed) {
        locallyClosed = true;
        writable = false;
        inboundFrames.length = 0;
        pendingChunks.length = 0;
        finishInbound();
        stopInboundReader();
        settleTerminal({ kind: "local-close" });
        stream.close();
      }
    };
    abortSignal.addEventListener("abort", abortHandler, { once: true });
    if (abortSignal.aborted)
      abortHandler();
  }
  startInboundReader();
  return {
    write(msg) {
      if (!writable || remotelyClosed || stream.closed || stream.destroyed) {
        if (locallyClosed) {
          throw new CursorLocalCancellationError("Cursor Run stream is closed locally");
        }
        throw observedFailure() ?? new CursorRunInterruptedError("Cursor Run stream is no longer writable");
      }
      const frame = encodeFrame(0, msg);
      try {
        const accepted = stream.write(frame);
        backpressured = !accepted;
        return accepted;
      } catch (cause) {
        rawStreamError = cause;
        streamFailure = toTransportError(cause, "Cursor Run stream write failed");
        streamFailure.replaySafe = false;
        writable = false;
        scheduleTerminalSettlement();
        throw streamFailure;
      }
    },
    waitForDrain(timeout) {
      if (!backpressured)
        return Promise.resolve();
      const drainTimeoutMs = timeoutMs("Cursor write drain timeout", timeout, timeout);
      return new Promise((resolve2, reject) => {
        let settled = false;
        const finish = (error) => {
          if (settled)
            return;
          settled = true;
          clearTimeout(timer);
          stream.removeListener("drain", onDrain);
          stream.removeListener("error", onError);
          stream.removeListener("close", onClose);
          if (error)
            reject(error);
          else
            resolve2();
        };
        const onDrain = () => {
          backpressured = false;
          finish();
        };
        const onError = (cause) => {
          streamFailure ??= toTransportError(cause, "Cursor Run stream drain failed");
          streamFailure.replaySafe = false;
          finish(streamFailure);
        };
        const onClose = () => {
          finish(locallyClosed ? new CursorLocalCancellationError("Cursor Run stream closed locally during drain") : observedFailure() ?? new CursorRunInterruptedError("Cursor Run stream closed before drain"));
        };
        const timer = setTimeout(() => {
          streamFailure ??= new CursorTransportError(`Cursor Run stream backpressure did not drain after ${drainTimeoutMs}ms`, { transient: false, replaySafe: false, code: WRITE_DRAIN_TIMEOUT_CODE });
          finish(streamFailure);
          try {
            stream.destroy(streamFailure);
          } catch {
          }
        }, drainTimeoutMs);
        timer.unref?.();
        stream.once("drain", onDrain);
        stream.once("error", onError);
        stream.once("close", onClose);
      });
    },
    end() {
      locallyClosed = true;
      writable = false;
      inboundFrames.length = 0;
      pendingChunks.length = 0;
      finishInbound();
      stopInboundReader();
      settleTerminal({ kind: "local-close" });
      stream.end();
    },
    async *frames() {
      try {
        while (true) {
          const frame = await nextInboundFrame();
          if (!frame)
            break;
          trace(`frame yield: flags=0x${frame.flags.toString(16)} payload=${frame.payload.length}B`);
          yield frame;
        }
        remotelyClosed = !locallyClosed;
        if (locallyClosed)
          return;
        throw observedFailure() ?? cursorRunTerminationError({
          responseStatus,
          responseHeaders,
          responseTrailers
        });
      } catch (error) {
        if (locallyClosed)
          return;
        if (error instanceof CursorProviderError)
          throw error;
        throw toTransportError(error, `Cursor Run transport interrupted: ${error instanceof Error ? error.message : "unknown error"}`);
      } finally {
        stopInboundReader();
      }
    },
    destroy() {
      if (!locallyClosed) {
        locallyClosed = true;
        writable = false;
        inboundFrames.length = 0;
        pendingChunks.length = 0;
        finishInbound();
        stopInboundReader();
        settleTerminal({ kind: "local-close" });
        stream.close();
      }
    },
    isClosed() {
      return remotelyClosed || locallyClosed || stream.closed || stream.destroyed;
    },
    onTerminal(listener) {
      if (terminalEvent) {
        try {
          listener(terminalEvent);
        } catch {
        }
        return () => {
        };
      }
      terminalListeners.add(listener);
      return () => terminalListeners.delete(listener);
    }
  };
}
function mergeBuffers(buffers) {
  if (buffers.length === 0)
    return new Uint8Array(0);
  if (buffers.length === 1)
    return buffers[0];
  const total = buffers.reduce((s, b) => s + b.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const b of buffers) {
    merged.set(b, offset);
    offset += b.length;
  }
  return merged;
}
function stripPseudo(h) {
  const out = {};
  for (const [k, v] of Object.entries(h)) {
    if (k.startsWith(":")) {
      if (k === ":status")
        out[k] = v;
      continue;
    }
    if (k === "authorization" || k === "x-cursor-checksum") {
      out[k] = "<redacted>";
      continue;
    }
    out[k] = v;
  }
  return out;
}
var API_BASE, DEFAULT_UNARY_TIMEOUT_MS, MAX_TIMER_MS, CursorRunInterruptedError, _http2Sessions, _http2SessionCreatedAt, _http2SessionListenerCleanup, _http2Connecting, CONNECT_TIMEOUT_MS, DEFAULT_SESSION_PING_TIMEOUT_MS, DEFAULT_READ_IDLE_MS, WRITE_DRAIN_TIMEOUT_CODE, HTTP2_SESSION_MAX_AGE_MS;
var init_connect = __esm({
  "node_modules/cursor-opencode-provider/dist/transport/connect.js"() {
    init_shared();
    init_framing();
    init_checksum();
    init_device_id();
    init_client_version();
    init_debug();
    init_errors();
    init_deadline();
    API_BASE = `https://${CURSOR_API_HOST}`;
    DEFAULT_UNARY_TIMEOUT_MS = 5e3;
    MAX_TIMER_MS = 2147483647;
    trace("connect.ts module loaded");
    CursorRunInterruptedError = class extends CursorTransportError {
      constructor(message = "Cursor Run ended before turn_ended", options) {
        super(message, {
          transient: true,
          replaySafe: true,
          cause: options?.cause
        });
        this.name = "CursorRunInterruptedError";
      }
    };
    _http2Sessions = /* @__PURE__ */ new Map();
    _http2SessionCreatedAt = /* @__PURE__ */ new WeakMap();
    _http2SessionListenerCleanup = /* @__PURE__ */ new WeakMap();
    _http2Connecting = /* @__PURE__ */ new Map();
    CONNECT_TIMEOUT_MS = 15e3;
    DEFAULT_SESSION_PING_TIMEOUT_MS = 5e3;
    DEFAULT_READ_IDLE_MS = 12e4;
    WRITE_DRAIN_TIMEOUT_CODE = "CURSOR_WRITE_DRAIN_TIMEOUT";
    HTTP2_SESSION_MAX_AGE_MS = 15 * 6e4;
  }
});

// node_modules/@protobufjs/aspromise/index.js
var require_aspromise = __commonJS({
  "node_modules/@protobufjs/aspromise/index.js"(exports, module) {
    "use strict";
    module.exports = asPromise;
    function asPromise(fn, ctx) {
      var params = new Array(arguments.length - 1), offset = 0, index = 2, pending3 = true;
      while (index < arguments.length)
        params[offset++] = arguments[index++];
      return new Promise(function executor(resolve2, reject) {
        params[offset] = function callback(err) {
          if (pending3) {
            pending3 = false;
            if (err)
              reject(err);
            else {
              var params2 = new Array(arguments.length - 1), offset2 = 0;
              while (offset2 < params2.length)
                params2[offset2++] = arguments[offset2];
              resolve2.apply(null, params2);
            }
          }
        };
        try {
          fn.apply(ctx || null, params);
        } catch (err) {
          if (pending3) {
            pending3 = false;
            reject(err);
          }
        }
      });
    }
  }
});

// node_modules/@protobufjs/base64/index.js
var require_base64 = __commonJS({
  "node_modules/@protobufjs/base64/index.js"(exports) {
    "use strict";
    var base64 = exports;
    base64.length = function length(string) {
      var p = string.length;
      if (!p)
        return 0;
      var n = 0;
      while (--p % 4 > 1 && string.charAt(p) === "=")
        ++n;
      return Math.ceil(string.length * 3) / 4 - n;
    };
    var b64 = new Array(64);
    var s64 = new Array(123);
    for (i = 0; i < 64; )
      s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;
    var i;
    base64.encode = function encode(buffer, start, end) {
      var parts = null, chunk = [];
      var i2 = 0, j = 0, t;
      while (start < end) {
        var b = buffer[start++];
        switch (j) {
          case 0:
            chunk[i2++] = b64[b >> 2];
            t = (b & 3) << 4;
            j = 1;
            break;
          case 1:
            chunk[i2++] = b64[t | b >> 4];
            t = (b & 15) << 2;
            j = 2;
            break;
          case 2:
            chunk[i2++] = b64[t | b >> 6];
            chunk[i2++] = b64[b & 63];
            j = 0;
            break;
        }
        if (i2 > 8191) {
          (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
          i2 = 0;
        }
      }
      if (j) {
        chunk[i2++] = b64[t];
        chunk[i2++] = 61;
        if (j === 1)
          chunk[i2++] = 61;
      }
      if (parts) {
        if (i2)
          parts.push(String.fromCharCode.apply(String, chunk.slice(0, i2)));
        return parts.join("");
      }
      return String.fromCharCode.apply(String, chunk.slice(0, i2));
    };
    var invalidEncoding = "invalid encoding";
    base64.decode = function decode(string, buffer, offset) {
      var start = offset;
      var j = 0, t;
      for (var i2 = 0; i2 < string.length; ) {
        var c = string.charCodeAt(i2++);
        if (c === 61 && j > 1)
          break;
        if ((c = s64[c]) === void 0)
          throw Error(invalidEncoding);
        switch (j) {
          case 0:
            t = c;
            j = 1;
            break;
          case 1:
            buffer[offset++] = t << 2 | (c & 48) >> 4;
            t = c;
            j = 2;
            break;
          case 2:
            buffer[offset++] = (t & 15) << 4 | (c & 60) >> 2;
            t = c;
            j = 3;
            break;
          case 3:
            buffer[offset++] = (t & 3) << 6 | c;
            j = 0;
            break;
        }
      }
      if (j === 1)
        throw Error(invalidEncoding);
      return offset - start;
    };
    base64.test = function test(string) {
      return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(string);
    };
  }
});

// node_modules/@protobufjs/eventemitter/index.js
var require_eventemitter = __commonJS({
  "node_modules/@protobufjs/eventemitter/index.js"(exports, module) {
    "use strict";
    module.exports = EventEmitter;
    function EventEmitter() {
      this._listeners = /* @__PURE__ */ Object.create(null);
    }
    EventEmitter.prototype.on = function on(evt, fn, ctx) {
      (this._listeners[evt] || (this._listeners[evt] = [])).push({
        fn,
        ctx: ctx || this
      });
      return this;
    };
    EventEmitter.prototype.off = function off(evt, fn) {
      if (evt === void 0)
        this._listeners = /* @__PURE__ */ Object.create(null);
      else {
        if (fn === void 0)
          this._listeners[evt] = [];
        else {
          var listeners = this._listeners[evt];
          if (!listeners)
            return this;
          for (var i = 0; i < listeners.length; )
            if (listeners[i].fn === fn)
              listeners.splice(i, 1);
            else
              ++i;
        }
      }
      return this;
    };
    EventEmitter.prototype.emit = function emit(evt) {
      var listeners = this._listeners[evt];
      if (listeners) {
        var args = [], i = 1;
        for (; i < arguments.length; )
          args.push(arguments[i++]);
        for (i = 0; i < listeners.length; )
          listeners[i].fn.apply(listeners[i++].ctx, args);
      }
      return this;
    };
  }
});

// node_modules/@protobufjs/float/index.js
var require_float = __commonJS({
  "node_modules/@protobufjs/float/index.js"(exports, module) {
    "use strict";
    module.exports = factory(factory);
    function factory(exports2) {
      if (typeof Float32Array !== "undefined") (function() {
        var f32 = new Float32Array([-0]), f8b = new Uint8Array(f32.buffer), le = f8b[3] === 128;
        function writeFloat_f32_cpy(val, buf, pos) {
          f32[0] = val;
          buf[pos] = f8b[0];
          buf[pos + 1] = f8b[1];
          buf[pos + 2] = f8b[2];
          buf[pos + 3] = f8b[3];
        }
        function writeFloat_f32_rev(val, buf, pos) {
          f32[0] = val;
          buf[pos] = f8b[3];
          buf[pos + 1] = f8b[2];
          buf[pos + 2] = f8b[1];
          buf[pos + 3] = f8b[0];
        }
        exports2.writeFloatLE = le ? writeFloat_f32_cpy : writeFloat_f32_rev;
        exports2.writeFloatBE = le ? writeFloat_f32_rev : writeFloat_f32_cpy;
        function readFloat_f32_cpy(buf, pos) {
          f8b[0] = buf[pos];
          f8b[1] = buf[pos + 1];
          f8b[2] = buf[pos + 2];
          f8b[3] = buf[pos + 3];
          return f32[0];
        }
        function readFloat_f32_rev(buf, pos) {
          f8b[3] = buf[pos];
          f8b[2] = buf[pos + 1];
          f8b[1] = buf[pos + 2];
          f8b[0] = buf[pos + 3];
          return f32[0];
        }
        exports2.readFloatLE = le ? readFloat_f32_cpy : readFloat_f32_rev;
        exports2.readFloatBE = le ? readFloat_f32_rev : readFloat_f32_cpy;
      })();
      else (function() {
        function writeFloat_ieee754(writeUint, val, buf, pos) {
          var sign = val < 0 ? 1 : 0;
          if (sign)
            val = -val;
          if (val === 0)
            writeUint(1 / val > 0 ? (
              /* positive */
              0
            ) : (
              /* negative 0 */
              2147483648
            ), buf, pos);
          else if (isNaN(val))
            writeUint(2143289344, buf, pos);
          else if (val > 34028234663852886e22)
            writeUint((sign << 31 | 2139095040) >>> 0, buf, pos);
          else if (val < 11754943508222875e-54)
            writeUint((sign << 31 | Math.round(val / 1401298464324817e-60)) >>> 0, buf, pos);
          else {
            var exponent = Math.floor(Math.log(val) / Math.LN2), mantissa = Math.round(val * Math.pow(2, -exponent) * 8388608) & 8388607;
            writeUint((sign << 31 | exponent + 127 << 23 | mantissa) >>> 0, buf, pos);
          }
        }
        exports2.writeFloatLE = writeFloat_ieee754.bind(null, writeUintLE);
        exports2.writeFloatBE = writeFloat_ieee754.bind(null, writeUintBE);
        function readFloat_ieee754(readUint, buf, pos) {
          var uint = readUint(buf, pos), sign = (uint >> 31) * 2 + 1, exponent = uint >>> 23 & 255, mantissa = uint & 8388607;
          return exponent === 255 ? mantissa ? NaN : sign * Infinity : exponent === 0 ? sign * 1401298464324817e-60 * mantissa : sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
        }
        exports2.readFloatLE = readFloat_ieee754.bind(null, readUintLE);
        exports2.readFloatBE = readFloat_ieee754.bind(null, readUintBE);
      })();
      if (typeof Float64Array !== "undefined") (function() {
        var f64 = new Float64Array([-0]), f8b = new Uint8Array(f64.buffer), le = f8b[7] === 128;
        function writeDouble_f64_cpy(val, buf, pos) {
          f64[0] = val;
          buf[pos] = f8b[0];
          buf[pos + 1] = f8b[1];
          buf[pos + 2] = f8b[2];
          buf[pos + 3] = f8b[3];
          buf[pos + 4] = f8b[4];
          buf[pos + 5] = f8b[5];
          buf[pos + 6] = f8b[6];
          buf[pos + 7] = f8b[7];
        }
        function writeDouble_f64_rev(val, buf, pos) {
          f64[0] = val;
          buf[pos] = f8b[7];
          buf[pos + 1] = f8b[6];
          buf[pos + 2] = f8b[5];
          buf[pos + 3] = f8b[4];
          buf[pos + 4] = f8b[3];
          buf[pos + 5] = f8b[2];
          buf[pos + 6] = f8b[1];
          buf[pos + 7] = f8b[0];
        }
        exports2.writeDoubleLE = le ? writeDouble_f64_cpy : writeDouble_f64_rev;
        exports2.writeDoubleBE = le ? writeDouble_f64_rev : writeDouble_f64_cpy;
        function readDouble_f64_cpy(buf, pos) {
          f8b[0] = buf[pos];
          f8b[1] = buf[pos + 1];
          f8b[2] = buf[pos + 2];
          f8b[3] = buf[pos + 3];
          f8b[4] = buf[pos + 4];
          f8b[5] = buf[pos + 5];
          f8b[6] = buf[pos + 6];
          f8b[7] = buf[pos + 7];
          return f64[0];
        }
        function readDouble_f64_rev(buf, pos) {
          f8b[7] = buf[pos];
          f8b[6] = buf[pos + 1];
          f8b[5] = buf[pos + 2];
          f8b[4] = buf[pos + 3];
          f8b[3] = buf[pos + 4];
          f8b[2] = buf[pos + 5];
          f8b[1] = buf[pos + 6];
          f8b[0] = buf[pos + 7];
          return f64[0];
        }
        exports2.readDoubleLE = le ? readDouble_f64_cpy : readDouble_f64_rev;
        exports2.readDoubleBE = le ? readDouble_f64_rev : readDouble_f64_cpy;
      })();
      else (function() {
        function writeDouble_ieee754(writeUint, off0, off1, val, buf, pos) {
          var sign = val < 0 ? 1 : 0;
          if (sign)
            val = -val;
          if (val === 0) {
            writeUint(0, buf, pos + off0);
            writeUint(1 / val > 0 ? (
              /* positive */
              0
            ) : (
              /* negative 0 */
              2147483648
            ), buf, pos + off1);
          } else if (isNaN(val)) {
            writeUint(0, buf, pos + off0);
            writeUint(2146959360, buf, pos + off1);
          } else if (val > 17976931348623157e292) {
            writeUint(0, buf, pos + off0);
            writeUint((sign << 31 | 2146435072) >>> 0, buf, pos + off1);
          } else {
            var mantissa;
            if (val < 22250738585072014e-324) {
              mantissa = val / 5e-324;
              writeUint(mantissa >>> 0, buf, pos + off0);
              writeUint((sign << 31 | mantissa / 4294967296) >>> 0, buf, pos + off1);
            } else {
              var exponent = Math.floor(Math.log(val) / Math.LN2);
              if (exponent === 1024)
                exponent = 1023;
              mantissa = val * Math.pow(2, -exponent);
              writeUint(mantissa * 4503599627370496 >>> 0, buf, pos + off0);
              writeUint((sign << 31 | exponent + 1023 << 20 | mantissa * 1048576 & 1048575) >>> 0, buf, pos + off1);
            }
          }
        }
        exports2.writeDoubleLE = writeDouble_ieee754.bind(null, writeUintLE, 0, 4);
        exports2.writeDoubleBE = writeDouble_ieee754.bind(null, writeUintBE, 4, 0);
        function readDouble_ieee754(readUint, off0, off1, buf, pos) {
          var lo = readUint(buf, pos + off0), hi = readUint(buf, pos + off1);
          var sign = (hi >> 31) * 2 + 1, exponent = hi >>> 20 & 2047, mantissa = 4294967296 * (hi & 1048575) + lo;
          return exponent === 2047 ? mantissa ? NaN : sign * Infinity : exponent === 0 ? sign * 5e-324 * mantissa : sign * Math.pow(2, exponent - 1075) * (mantissa + 4503599627370496);
        }
        exports2.readDoubleLE = readDouble_ieee754.bind(null, readUintLE, 0, 4);
        exports2.readDoubleBE = readDouble_ieee754.bind(null, readUintBE, 4, 0);
      })();
      return exports2;
    }
    function writeUintLE(val, buf, pos) {
      buf[pos] = val & 255;
      buf[pos + 1] = val >>> 8 & 255;
      buf[pos + 2] = val >>> 16 & 255;
      buf[pos + 3] = val >>> 24;
    }
    function writeUintBE(val, buf, pos) {
      buf[pos] = val >>> 24;
      buf[pos + 1] = val >>> 16 & 255;
      buf[pos + 2] = val >>> 8 & 255;
      buf[pos + 3] = val & 255;
    }
    function readUintLE(buf, pos) {
      return (buf[pos] | buf[pos + 1] << 8 | buf[pos + 2] << 16 | buf[pos + 3] << 24) >>> 0;
    }
    function readUintBE(buf, pos) {
      return (buf[pos] << 24 | buf[pos + 1] << 16 | buf[pos + 2] << 8 | buf[pos + 3]) >>> 0;
    }
  }
});

// node_modules/@protobufjs/utf8/index.js
var require_utf8 = __commonJS({
  "node_modules/@protobufjs/utf8/index.js"(exports) {
    "use strict";
    var utf8 = exports;
    var replacementCharCode = 65533;
    utf8.length = function utf8_length(string) {
      var len = 0, c = 0;
      for (var i = 0; i < string.length; ++i) {
        c = string.charCodeAt(i);
        if (c < 128)
          len += 1;
        else if (c < 2048)
          len += 2;
        else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
          ++i;
          len += 4;
        } else
          len += 3;
      }
      return len;
    };
    utf8.read = function utf8_read(buffer, start, end) {
      if (end - start < 1)
        return "";
      var parts = null, chunk = [], i = 0, t, t2, c2, c3;
      while (start < end) {
        t = buffer[start++];
        if (t <= 127) {
          chunk[i++] = t;
        } else if (t >= 192 && t < 224) {
          c2 = (t & 31) << 6 | buffer[start++] & 63;
          chunk[i++] = c2 >= 128 ? c2 : replacementCharCode;
        } else if (t >= 224 && t < 240) {
          c3 = (t & 15) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
          chunk[i++] = c3 >= 2048 ? c3 : replacementCharCode;
        } else if (t >= 240) {
          t2 = (t & 7) << 18 | (buffer[start++] & 63) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
          if (t2 < 65536 || t2 > 1114111)
            chunk[i++] = replacementCharCode;
          else {
            t2 -= 65536;
            chunk[i++] = 55296 + (t2 >> 10);
            chunk[i++] = 56320 + (t2 & 1023);
          }
        }
        if (i > 8191) {
          (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk.slice(0, i)));
          i = 0;
        }
      }
      if (parts) {
        if (i)
          parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
      }
      return String.fromCharCode.apply(String, chunk.slice(0, i));
    };
    utf8.write = function utf8_write(string, buffer, offset) {
      var start = offset, c1, c2;
      for (var i = 0; i < string.length; ++i) {
        c1 = string.charCodeAt(i);
        if (c1 < 128) {
          buffer[offset++] = c1;
        } else if (c1 < 2048) {
          buffer[offset++] = c1 >> 6 | 192;
          buffer[offset++] = c1 & 63 | 128;
        } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
          c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
          ++i;
          buffer[offset++] = c1 >> 18 | 240;
          buffer[offset++] = c1 >> 12 & 63 | 128;
          buffer[offset++] = c1 >> 6 & 63 | 128;
          buffer[offset++] = c1 & 63 | 128;
        } else {
          buffer[offset++] = c1 >> 12 | 224;
          buffer[offset++] = c1 >> 6 & 63 | 128;
          buffer[offset++] = c1 & 63 | 128;
        }
      }
      return offset - start;
    };
  }
});

// node_modules/@protobufjs/pool/index.js
var require_pool = __commonJS({
  "node_modules/@protobufjs/pool/index.js"(exports, module) {
    "use strict";
    module.exports = pool;
    function pool(alloc, slice, size) {
      var SIZE = size || 8192;
      var MAX = SIZE >>> 1;
      var slab = null;
      var offset = SIZE;
      return function pool_alloc(size2) {
        if (size2 < 1 || size2 > MAX)
          return alloc(size2);
        if (offset + size2 > SIZE) {
          slab = alloc(SIZE);
          offset = 0;
        }
        var buf = slice.call(slab, offset, offset += size2);
        if (offset & 7)
          offset = (offset | 7) + 1;
        return buf;
      };
    }
  }
});

// node_modules/protobufjs/src/util/longbits.js
var require_longbits = __commonJS({
  "node_modules/protobufjs/src/util/longbits.js"(exports, module) {
    "use strict";
    module.exports = LongBits;
    var util = require_minimal();
    function LongBits(lo, hi) {
      this.lo = lo >>> 0;
      this.hi = hi >>> 0;
    }
    var zero = LongBits.zero = new LongBits(0, 0);
    zero.toNumber = function() {
      return 0;
    };
    zero.zzEncode = zero.zzDecode = function() {
      return this;
    };
    zero.length = function() {
      return 1;
    };
    var zeroHash = LongBits.zeroHash = "\0\0\0\0\0\0\0\0";
    LongBits.fromNumber = function fromNumber(value) {
      if (value === 0)
        return zero;
      var sign = value < 0;
      if (sign)
        value = -value;
      var lo = value >>> 0, hi = (value - lo) / 4294967296 >>> 0;
      if (sign) {
        hi = ~hi >>> 0;
        lo = ~lo >>> 0;
        if (++lo > 4294967295) {
          lo = 0;
          if (++hi > 4294967295)
            hi = 0;
        }
      }
      return new LongBits(lo, hi);
    };
    LongBits.from = function from(value) {
      if (typeof value === "number")
        return LongBits.fromNumber(value);
      if (util.isString(value)) {
        if (util.Long)
          value = util.Long.fromString(value);
        else
          return LongBits.fromNumber(parseInt(value, 10));
      }
      return value.low || value.high ? new LongBits(value.low >>> 0, value.high >>> 0) : zero;
    };
    LongBits.prototype.toNumber = function toNumber(unsigned) {
      if (!unsigned && this.hi >>> 31) {
        var lo = ~this.lo + 1 >>> 0, hi = ~this.hi >>> 0;
        if (!lo)
          hi = hi + 1 >>> 0;
        return -(lo + hi * 4294967296);
      }
      return this.lo + this.hi * 4294967296;
    };
    LongBits.prototype.toLong = function toLong(unsigned) {
      return util.Long ? new util.Long(this.lo | 0, this.hi | 0, Boolean(unsigned)) : { low: this.lo | 0, high: this.hi | 0, unsigned: Boolean(unsigned) };
    };
    var charCodeAt = String.prototype.charCodeAt;
    LongBits.fromHash = function fromHash(hash) {
      if (hash === zeroHash)
        return zero;
      return new LongBits(
        (charCodeAt.call(hash, 0) | charCodeAt.call(hash, 1) << 8 | charCodeAt.call(hash, 2) << 16 | charCodeAt.call(hash, 3) << 24) >>> 0,
        (charCodeAt.call(hash, 4) | charCodeAt.call(hash, 5) << 8 | charCodeAt.call(hash, 6) << 16 | charCodeAt.call(hash, 7) << 24) >>> 0
      );
    };
    LongBits.prototype.toHash = function toHash() {
      return String.fromCharCode(
        this.lo & 255,
        this.lo >>> 8 & 255,
        this.lo >>> 16 & 255,
        this.lo >>> 24,
        this.hi & 255,
        this.hi >>> 8 & 255,
        this.hi >>> 16 & 255,
        this.hi >>> 24
      );
    };
    LongBits.prototype.zzEncode = function zzEncode() {
      var mask = this.hi >> 31;
      this.hi = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
      this.lo = (this.lo << 1 ^ mask) >>> 0;
      return this;
    };
    LongBits.prototype.zzDecode = function zzDecode() {
      var mask = -(this.lo & 1);
      this.lo = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
      this.hi = (this.hi >>> 1 ^ mask) >>> 0;
      return this;
    };
    LongBits.prototype.length = function length() {
      var part0 = this.lo, part1 = (this.lo >>> 28 | this.hi << 4) >>> 0, part2 = this.hi >>> 24;
      return part2 === 0 ? part1 === 0 ? part0 < 16384 ? part0 < 128 ? 1 : 2 : part0 < 2097152 ? 3 : 4 : part1 < 16384 ? part1 < 128 ? 5 : 6 : part1 < 2097152 ? 7 : 8 : part2 < 128 ? 9 : 10;
    };
  }
});

// node_modules/long/umd/index.js
var require_umd = __commonJS({
  "node_modules/long/umd/index.js"(exports, module) {
    (function(global2, factory) {
      function preferDefault(exports2) {
        return exports2.default || exports2;
      }
      if (typeof define === "function" && define.amd) {
        define([], function() {
          var exports2 = {};
          factory(exports2);
          return preferDefault(exports2);
        });
      } else if (typeof exports === "object") {
        factory(exports);
        if (typeof module === "object") module.exports = preferDefault(exports);
      } else {
        (function() {
          var exports2 = {};
          factory(exports2);
          global2.Long = preferDefault(exports2);
        })();
      }
    })(
      typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : exports,
      function(_exports) {
        "use strict";
        Object.defineProperty(_exports, "__esModule", {
          value: true
        });
        _exports.default = void 0;
        var wasm = null;
        try {
          wasm = new WebAssembly.Instance(
            new WebAssembly.Module(
              new Uint8Array([
                // \0asm
                0,
                97,
                115,
                109,
                // version 1
                1,
                0,
                0,
                0,
                // section "type"
                1,
                13,
                2,
                // 0, () => i32
                96,
                0,
                1,
                127,
                // 1, (i32, i32, i32, i32) => i32
                96,
                4,
                127,
                127,
                127,
                127,
                1,
                127,
                // section "function"
                3,
                7,
                6,
                // 0, type 0
                0,
                // 1, type 1
                1,
                // 2, type 1
                1,
                // 3, type 1
                1,
                // 4, type 1
                1,
                // 5, type 1
                1,
                // section "global"
                6,
                6,
                1,
                // 0, "high", mutable i32
                127,
                1,
                65,
                0,
                11,
                // section "export"
                7,
                50,
                6,
                // 0, "mul"
                3,
                109,
                117,
                108,
                0,
                1,
                // 1, "div_s"
                5,
                100,
                105,
                118,
                95,
                115,
                0,
                2,
                // 2, "div_u"
                5,
                100,
                105,
                118,
                95,
                117,
                0,
                3,
                // 3, "rem_s"
                5,
                114,
                101,
                109,
                95,
                115,
                0,
                4,
                // 4, "rem_u"
                5,
                114,
                101,
                109,
                95,
                117,
                0,
                5,
                // 5, "get_high"
                8,
                103,
                101,
                116,
                95,
                104,
                105,
                103,
                104,
                0,
                0,
                // section "code"
                10,
                191,
                1,
                6,
                // 0, "get_high"
                4,
                0,
                35,
                0,
                11,
                // 1, "mul"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                126,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11,
                // 2, "div_s"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                127,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11,
                // 3, "div_u"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                128,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11,
                // 4, "rem_s"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                129,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11,
                // 5, "rem_u"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                130,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11
              ])
            ),
            {}
          ).exports;
        } catch {
        }
        function Long(low, high, unsigned) {
          this.low = low | 0;
          this.high = high | 0;
          this.unsigned = !!unsigned;
        }
        Long.prototype.__isLong__;
        Object.defineProperty(Long.prototype, "__isLong__", {
          value: true
        });
        function isLong(obj) {
          return (obj && obj["__isLong__"]) === true;
        }
        function ctz32(value) {
          var c = Math.clz32(value & -value);
          return value ? 31 - c : c;
        }
        Long.isLong = isLong;
        var INT_CACHE = {};
        var UINT_CACHE = {};
        function fromInt(value, unsigned) {
          var obj, cachedObj, cache;
          if (unsigned) {
            value >>>= 0;
            if (cache = 0 <= value && value < 256) {
              cachedObj = UINT_CACHE[value];
              if (cachedObj) return cachedObj;
            }
            obj = fromBits(value, 0, true);
            if (cache) UINT_CACHE[value] = obj;
            return obj;
          } else {
            value |= 0;
            if (cache = -128 <= value && value < 128) {
              cachedObj = INT_CACHE[value];
              if (cachedObj) return cachedObj;
            }
            obj = fromBits(value, value < 0 ? -1 : 0, false);
            if (cache) INT_CACHE[value] = obj;
            return obj;
          }
        }
        Long.fromInt = fromInt;
        function fromNumber(value, unsigned) {
          if (isNaN(value)) return unsigned ? UZERO : ZERO;
          if (unsigned) {
            if (value < 0) return UZERO;
            if (value >= TWO_PWR_64_DBL) return MAX_UNSIGNED_VALUE;
          } else {
            if (value <= -TWO_PWR_63_DBL) return MIN_VALUE;
            if (value + 1 >= TWO_PWR_63_DBL) return MAX_VALUE;
          }
          if (value < 0) return fromNumber(-value, unsigned).neg();
          return fromBits(
            value % TWO_PWR_32_DBL | 0,
            value / TWO_PWR_32_DBL | 0,
            unsigned
          );
        }
        Long.fromNumber = fromNumber;
        function fromBits(lowBits, highBits, unsigned) {
          return new Long(lowBits, highBits, unsigned);
        }
        Long.fromBits = fromBits;
        var pow_dbl = Math.pow;
        function fromString(str7, unsigned, radix) {
          if (str7.length === 0) throw Error("empty string");
          if (typeof unsigned === "number") {
            radix = unsigned;
            unsigned = false;
          } else {
            unsigned = !!unsigned;
          }
          if (str7 === "NaN" || str7 === "Infinity" || str7 === "+Infinity" || str7 === "-Infinity")
            return unsigned ? UZERO : ZERO;
          radix = radix || 10;
          if (radix < 2 || 36 < radix) throw RangeError("radix");
          var p;
          if ((p = str7.indexOf("-")) > 0) throw Error("interior hyphen");
          else if (p === 0) {
            return fromString(str7.substring(1), unsigned, radix).neg();
          }
          var radixToPower = fromNumber(pow_dbl(radix, 8));
          var result = ZERO;
          for (var i = 0; i < str7.length; i += 8) {
            var size = Math.min(8, str7.length - i), value = parseInt(str7.substring(i, i + size), radix);
            if (size < 8) {
              var power = fromNumber(pow_dbl(radix, size));
              result = result.mul(power).add(fromNumber(value));
            } else {
              result = result.mul(radixToPower);
              result = result.add(fromNumber(value));
            }
          }
          result.unsigned = unsigned;
          return result;
        }
        Long.fromString = fromString;
        function fromValue(val, unsigned) {
          if (typeof val === "number") return fromNumber(val, unsigned);
          if (typeof val === "string") return fromString(val, unsigned);
          return fromBits(
            val.low,
            val.high,
            typeof unsigned === "boolean" ? unsigned : val.unsigned
          );
        }
        Long.fromValue = fromValue;
        var TWO_PWR_16_DBL = 1 << 16;
        var TWO_PWR_24_DBL = 1 << 24;
        var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
        var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
        var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
        var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);
        var ZERO = fromInt(0);
        Long.ZERO = ZERO;
        var UZERO = fromInt(0, true);
        Long.UZERO = UZERO;
        var ONE = fromInt(1);
        Long.ONE = ONE;
        var UONE = fromInt(1, true);
        Long.UONE = UONE;
        var NEG_ONE = fromInt(-1);
        Long.NEG_ONE = NEG_ONE;
        var MAX_VALUE = fromBits(4294967295 | 0, 2147483647 | 0, false);
        Long.MAX_VALUE = MAX_VALUE;
        var MAX_UNSIGNED_VALUE = fromBits(4294967295 | 0, 4294967295 | 0, true);
        Long.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;
        var MIN_VALUE = fromBits(0, 2147483648 | 0, false);
        Long.MIN_VALUE = MIN_VALUE;
        var LongPrototype = Long.prototype;
        LongPrototype.toInt = function toInt() {
          return this.unsigned ? this.low >>> 0 : this.low;
        };
        LongPrototype.toNumber = function toNumber() {
          if (this.unsigned)
            return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
          return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
        };
        LongPrototype.toString = function toString(radix) {
          radix = radix || 10;
          if (radix < 2 || 36 < radix) throw RangeError("radix");
          if (this.isZero()) return "0";
          if (this.isNegative()) {
            if (this.eq(MIN_VALUE)) {
              var radixLong = fromNumber(radix), div = this.div(radixLong), rem1 = div.mul(radixLong).sub(this);
              return div.toString(radix) + rem1.toInt().toString(radix);
            } else return "-" + this.neg().toString(radix);
          }
          var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned), rem = this;
          var result = "";
          while (true) {
            var remDiv = rem.div(radixToPower), intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0, digits = intval.toString(radix);
            rem = remDiv;
            if (rem.isZero()) return digits + result;
            else {
              while (digits.length < 6) digits = "0" + digits;
              result = "" + digits + result;
            }
          }
        };
        LongPrototype.getHighBits = function getHighBits() {
          return this.high;
        };
        LongPrototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
          return this.high >>> 0;
        };
        LongPrototype.getLowBits = function getLowBits() {
          return this.low;
        };
        LongPrototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
          return this.low >>> 0;
        };
        LongPrototype.getNumBitsAbs = function getNumBitsAbs() {
          if (this.isNegative())
            return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
          var val = this.high != 0 ? this.high : this.low;
          for (var bit = 31; bit > 0; bit--) if ((val & 1 << bit) != 0) break;
          return this.high != 0 ? bit + 33 : bit + 1;
        };
        LongPrototype.isSafeInteger = function isSafeInteger() {
          var top11Bits = this.high >> 21;
          if (!top11Bits) return true;
          if (this.unsigned) return false;
          return top11Bits === -1 && !(this.low === 0 && this.high === -2097152);
        };
        LongPrototype.isZero = function isZero() {
          return this.high === 0 && this.low === 0;
        };
        LongPrototype.eqz = LongPrototype.isZero;
        LongPrototype.isNegative = function isNegative() {
          return !this.unsigned && this.high < 0;
        };
        LongPrototype.isPositive = function isPositive() {
          return this.unsigned || this.high >= 0;
        };
        LongPrototype.isOdd = function isOdd() {
          return (this.low & 1) === 1;
        };
        LongPrototype.isEven = function isEven() {
          return (this.low & 1) === 0;
        };
        LongPrototype.equals = function equals(other) {
          if (!isLong(other)) other = fromValue(other);
          if (this.unsigned !== other.unsigned && this.high >>> 31 === 1 && other.high >>> 31 === 1)
            return false;
          return this.high === other.high && this.low === other.low;
        };
        LongPrototype.eq = LongPrototype.equals;
        LongPrototype.notEquals = function notEquals(other) {
          return !this.eq(
            /* validates */
            other
          );
        };
        LongPrototype.neq = LongPrototype.notEquals;
        LongPrototype.ne = LongPrototype.notEquals;
        LongPrototype.lessThan = function lessThan(other) {
          return this.comp(
            /* validates */
            other
          ) < 0;
        };
        LongPrototype.lt = LongPrototype.lessThan;
        LongPrototype.lessThanOrEqual = function lessThanOrEqual(other) {
          return this.comp(
            /* validates */
            other
          ) <= 0;
        };
        LongPrototype.lte = LongPrototype.lessThanOrEqual;
        LongPrototype.le = LongPrototype.lessThanOrEqual;
        LongPrototype.greaterThan = function greaterThan(other) {
          return this.comp(
            /* validates */
            other
          ) > 0;
        };
        LongPrototype.gt = LongPrototype.greaterThan;
        LongPrototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
          return this.comp(
            /* validates */
            other
          ) >= 0;
        };
        LongPrototype.gte = LongPrototype.greaterThanOrEqual;
        LongPrototype.ge = LongPrototype.greaterThanOrEqual;
        LongPrototype.compare = function compare(other) {
          if (!isLong(other)) other = fromValue(other);
          if (this.eq(other)) return 0;
          var thisNeg = this.isNegative(), otherNeg = other.isNegative();
          if (thisNeg && !otherNeg) return -1;
          if (!thisNeg && otherNeg) return 1;
          if (!this.unsigned) return this.sub(other).isNegative() ? -1 : 1;
          return other.high >>> 0 > this.high >>> 0 || other.high === this.high && other.low >>> 0 > this.low >>> 0 ? -1 : 1;
        };
        LongPrototype.comp = LongPrototype.compare;
        LongPrototype.negate = function negate() {
          if (!this.unsigned && this.eq(MIN_VALUE)) return MIN_VALUE;
          return this.not().add(ONE);
        };
        LongPrototype.neg = LongPrototype.negate;
        LongPrototype.add = function add(addend) {
          if (!isLong(addend)) addend = fromValue(addend);
          var a48 = this.high >>> 16;
          var a32 = this.high & 65535;
          var a16 = this.low >>> 16;
          var a00 = this.low & 65535;
          var b48 = addend.high >>> 16;
          var b32 = addend.high & 65535;
          var b16 = addend.low >>> 16;
          var b00 = addend.low & 65535;
          var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
          c00 += a00 + b00;
          c16 += c00 >>> 16;
          c00 &= 65535;
          c16 += a16 + b16;
          c32 += c16 >>> 16;
          c16 &= 65535;
          c32 += a32 + b32;
          c48 += c32 >>> 16;
          c32 &= 65535;
          c48 += a48 + b48;
          c48 &= 65535;
          return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
        };
        LongPrototype.subtract = function subtract(subtrahend) {
          if (!isLong(subtrahend)) subtrahend = fromValue(subtrahend);
          return this.add(subtrahend.neg());
        };
        LongPrototype.sub = LongPrototype.subtract;
        LongPrototype.multiply = function multiply(multiplier) {
          if (this.isZero()) return this;
          if (!isLong(multiplier)) multiplier = fromValue(multiplier);
          if (wasm) {
            var low = wasm["mul"](
              this.low,
              this.high,
              multiplier.low,
              multiplier.high
            );
            return fromBits(low, wasm["get_high"](), this.unsigned);
          }
          if (multiplier.isZero()) return this.unsigned ? UZERO : ZERO;
          if (this.eq(MIN_VALUE)) return multiplier.isOdd() ? MIN_VALUE : ZERO;
          if (multiplier.eq(MIN_VALUE)) return this.isOdd() ? MIN_VALUE : ZERO;
          if (this.isNegative()) {
            if (multiplier.isNegative()) return this.neg().mul(multiplier.neg());
            else return this.neg().mul(multiplier).neg();
          } else if (multiplier.isNegative())
            return this.mul(multiplier.neg()).neg();
          if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24))
            return fromNumber(
              this.toNumber() * multiplier.toNumber(),
              this.unsigned
            );
          var a48 = this.high >>> 16;
          var a32 = this.high & 65535;
          var a16 = this.low >>> 16;
          var a00 = this.low & 65535;
          var b48 = multiplier.high >>> 16;
          var b32 = multiplier.high & 65535;
          var b16 = multiplier.low >>> 16;
          var b00 = multiplier.low & 65535;
          var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
          c00 += a00 * b00;
          c16 += c00 >>> 16;
          c00 &= 65535;
          c16 += a16 * b00;
          c32 += c16 >>> 16;
          c16 &= 65535;
          c16 += a00 * b16;
          c32 += c16 >>> 16;
          c16 &= 65535;
          c32 += a32 * b00;
          c48 += c32 >>> 16;
          c32 &= 65535;
          c32 += a16 * b16;
          c48 += c32 >>> 16;
          c32 &= 65535;
          c32 += a00 * b32;
          c48 += c32 >>> 16;
          c32 &= 65535;
          c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
          c48 &= 65535;
          return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
        };
        LongPrototype.mul = LongPrototype.multiply;
        LongPrototype.divide = function divide(divisor) {
          if (!isLong(divisor)) divisor = fromValue(divisor);
          if (divisor.isZero()) throw Error("division by zero");
          if (wasm) {
            if (!this.unsigned && this.high === -2147483648 && divisor.low === -1 && divisor.high === -1) {
              return this;
            }
            var low = (this.unsigned ? wasm["div_u"] : wasm["div_s"])(
              this.low,
              this.high,
              divisor.low,
              divisor.high
            );
            return fromBits(low, wasm["get_high"](), this.unsigned);
          }
          if (this.isZero()) return this.unsigned ? UZERO : ZERO;
          var approx, rem, res;
          if (!this.unsigned) {
            if (this.eq(MIN_VALUE)) {
              if (divisor.eq(ONE) || divisor.eq(NEG_ONE))
                return MIN_VALUE;
              else if (divisor.eq(MIN_VALUE)) return ONE;
              else {
                var halfThis = this.shr(1);
                approx = halfThis.div(divisor).shl(1);
                if (approx.eq(ZERO)) {
                  return divisor.isNegative() ? ONE : NEG_ONE;
                } else {
                  rem = this.sub(divisor.mul(approx));
                  res = approx.add(rem.div(divisor));
                  return res;
                }
              }
            } else if (divisor.eq(MIN_VALUE)) return this.unsigned ? UZERO : ZERO;
            if (this.isNegative()) {
              if (divisor.isNegative()) return this.neg().div(divisor.neg());
              return this.neg().div(divisor).neg();
            } else if (divisor.isNegative()) return this.div(divisor.neg()).neg();
            res = ZERO;
          } else {
            if (!divisor.unsigned) divisor = divisor.toUnsigned();
            if (divisor.gt(this)) return UZERO;
            if (divisor.gt(this.shru(1)))
              return UONE;
            res = UZERO;
          }
          rem = this;
          while (rem.gte(divisor)) {
            approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));
            var log2 = Math.ceil(Math.log(approx) / Math.LN2), delta = log2 <= 48 ? 1 : pow_dbl(2, log2 - 48), approxRes = fromNumber(approx), approxRem = approxRes.mul(divisor);
            while (approxRem.isNegative() || approxRem.gt(rem)) {
              approx -= delta;
              approxRes = fromNumber(approx, this.unsigned);
              approxRem = approxRes.mul(divisor);
            }
            if (approxRes.isZero()) approxRes = ONE;
            res = res.add(approxRes);
            rem = rem.sub(approxRem);
          }
          return res;
        };
        LongPrototype.div = LongPrototype.divide;
        LongPrototype.modulo = function modulo(divisor) {
          if (!isLong(divisor)) divisor = fromValue(divisor);
          if (wasm) {
            var low = (this.unsigned ? wasm["rem_u"] : wasm["rem_s"])(
              this.low,
              this.high,
              divisor.low,
              divisor.high
            );
            return fromBits(low, wasm["get_high"](), this.unsigned);
          }
          return this.sub(this.div(divisor).mul(divisor));
        };
        LongPrototype.mod = LongPrototype.modulo;
        LongPrototype.rem = LongPrototype.modulo;
        LongPrototype.not = function not() {
          return fromBits(~this.low, ~this.high, this.unsigned);
        };
        LongPrototype.countLeadingZeros = function countLeadingZeros() {
          return this.high ? Math.clz32(this.high) : Math.clz32(this.low) + 32;
        };
        LongPrototype.clz = LongPrototype.countLeadingZeros;
        LongPrototype.countTrailingZeros = function countTrailingZeros() {
          return this.low ? ctz32(this.low) : ctz32(this.high) + 32;
        };
        LongPrototype.ctz = LongPrototype.countTrailingZeros;
        LongPrototype.and = function and(other) {
          if (!isLong(other)) other = fromValue(other);
          return fromBits(
            this.low & other.low,
            this.high & other.high,
            this.unsigned
          );
        };
        LongPrototype.or = function or(other) {
          if (!isLong(other)) other = fromValue(other);
          return fromBits(
            this.low | other.low,
            this.high | other.high,
            this.unsigned
          );
        };
        LongPrototype.xor = function xor(other) {
          if (!isLong(other)) other = fromValue(other);
          return fromBits(
            this.low ^ other.low,
            this.high ^ other.high,
            this.unsigned
          );
        };
        LongPrototype.shiftLeft = function shiftLeft(numBits) {
          if (isLong(numBits)) numBits = numBits.toInt();
          if ((numBits &= 63) === 0) return this;
          else if (numBits < 32)
            return fromBits(
              this.low << numBits,
              this.high << numBits | this.low >>> 32 - numBits,
              this.unsigned
            );
          else return fromBits(0, this.low << numBits - 32, this.unsigned);
        };
        LongPrototype.shl = LongPrototype.shiftLeft;
        LongPrototype.shiftRight = function shiftRight(numBits) {
          if (isLong(numBits)) numBits = numBits.toInt();
          if ((numBits &= 63) === 0) return this;
          else if (numBits < 32)
            return fromBits(
              this.low >>> numBits | this.high << 32 - numBits,
              this.high >> numBits,
              this.unsigned
            );
          else
            return fromBits(
              this.high >> numBits - 32,
              this.high >= 0 ? 0 : -1,
              this.unsigned
            );
        };
        LongPrototype.shr = LongPrototype.shiftRight;
        LongPrototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
          if (isLong(numBits)) numBits = numBits.toInt();
          if ((numBits &= 63) === 0) return this;
          if (numBits < 32)
            return fromBits(
              this.low >>> numBits | this.high << 32 - numBits,
              this.high >>> numBits,
              this.unsigned
            );
          if (numBits === 32) return fromBits(this.high, 0, this.unsigned);
          return fromBits(this.high >>> numBits - 32, 0, this.unsigned);
        };
        LongPrototype.shru = LongPrototype.shiftRightUnsigned;
        LongPrototype.shr_u = LongPrototype.shiftRightUnsigned;
        LongPrototype.rotateLeft = function rotateLeft(numBits) {
          var b;
          if (isLong(numBits)) numBits = numBits.toInt();
          if ((numBits &= 63) === 0) return this;
          if (numBits === 32) return fromBits(this.high, this.low, this.unsigned);
          if (numBits < 32) {
            b = 32 - numBits;
            return fromBits(
              this.low << numBits | this.high >>> b,
              this.high << numBits | this.low >>> b,
              this.unsigned
            );
          }
          numBits -= 32;
          b = 32 - numBits;
          return fromBits(
            this.high << numBits | this.low >>> b,
            this.low << numBits | this.high >>> b,
            this.unsigned
          );
        };
        LongPrototype.rotl = LongPrototype.rotateLeft;
        LongPrototype.rotateRight = function rotateRight(numBits) {
          var b;
          if (isLong(numBits)) numBits = numBits.toInt();
          if ((numBits &= 63) === 0) return this;
          if (numBits === 32) return fromBits(this.high, this.low, this.unsigned);
          if (numBits < 32) {
            b = 32 - numBits;
            return fromBits(
              this.high << b | this.low >>> numBits,
              this.low << b | this.high >>> numBits,
              this.unsigned
            );
          }
          numBits -= 32;
          b = 32 - numBits;
          return fromBits(
            this.low << b | this.high >>> numBits,
            this.high << b | this.low >>> numBits,
            this.unsigned
          );
        };
        LongPrototype.rotr = LongPrototype.rotateRight;
        LongPrototype.toSigned = function toSigned() {
          if (!this.unsigned) return this;
          return fromBits(this.low, this.high, false);
        };
        LongPrototype.toUnsigned = function toUnsigned() {
          if (this.unsigned) return this;
          return fromBits(this.low, this.high, true);
        };
        LongPrototype.toBytes = function toBytes(le) {
          return le ? this.toBytesLE() : this.toBytesBE();
        };
        LongPrototype.toBytesLE = function toBytesLE() {
          var hi = this.high, lo = this.low;
          return [
            lo & 255,
            lo >>> 8 & 255,
            lo >>> 16 & 255,
            lo >>> 24,
            hi & 255,
            hi >>> 8 & 255,
            hi >>> 16 & 255,
            hi >>> 24
          ];
        };
        LongPrototype.toBytesBE = function toBytesBE() {
          var hi = this.high, lo = this.low;
          return [
            hi >>> 24,
            hi >>> 16 & 255,
            hi >>> 8 & 255,
            hi & 255,
            lo >>> 24,
            lo >>> 16 & 255,
            lo >>> 8 & 255,
            lo & 255
          ];
        };
        Long.fromBytes = function fromBytes(bytes, unsigned, le) {
          return le ? Long.fromBytesLE(bytes, unsigned) : Long.fromBytesBE(bytes, unsigned);
        };
        Long.fromBytesLE = function fromBytesLE(bytes, unsigned) {
          return new Long(
            bytes[0] | bytes[1] << 8 | bytes[2] << 16 | bytes[3] << 24,
            bytes[4] | bytes[5] << 8 | bytes[6] << 16 | bytes[7] << 24,
            unsigned
          );
        };
        Long.fromBytesBE = function fromBytesBE(bytes, unsigned) {
          return new Long(
            bytes[4] << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7],
            bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3],
            unsigned
          );
        };
        if (typeof BigInt === "function") {
          Long.fromBigInt = function fromBigInt(value, unsigned) {
            var lowBits = Number(BigInt.asIntN(32, value));
            var highBits = Number(BigInt.asIntN(32, value >> BigInt(32)));
            return fromBits(lowBits, highBits, unsigned);
          };
          Long.fromValue = function fromValueWithBigInt(value, unsigned) {
            if (typeof value === "bigint") return Long.fromBigInt(value, unsigned);
            return fromValue(value, unsigned);
          };
          LongPrototype.toBigInt = function toBigInt() {
            var lowBigInt = BigInt(this.low >>> 0);
            var highBigInt = BigInt(this.unsigned ? this.high >>> 0 : this.high);
            return highBigInt << BigInt(32) | lowBigInt;
          };
        }
        var _default = _exports.default = Long;
      }
    );
  }
});

// node_modules/protobufjs/src/util/minimal.js
var require_minimal = __commonJS({
  "node_modules/protobufjs/src/util/minimal.js"(exports) {
    "use strict";
    var util = exports;
    util.asPromise = require_aspromise();
    util.base64 = require_base64();
    util.EventEmitter = require_eventemitter();
    util.float = require_float();
    util.utf8 = require_utf8();
    util.pool = require_pool();
    util.LongBits = require_longbits();
    function isUnsafeProperty(key) {
      return key === "__proto__" || key === "prototype" || key === "constructor";
    }
    util.isUnsafeProperty = isUnsafeProperty;
    util.isNode = Boolean(typeof global !== "undefined" && global && global.process && global.process.versions && global.process.versions.node);
    util.global = util.isNode && global || typeof window !== "undefined" && window || typeof self !== "undefined" && self || exports;
    util.emptyArray = Object.freeze ? Object.freeze([]) : (
      /* istanbul ignore next */
      []
    );
    util.emptyObject = Object.freeze ? Object.freeze({}) : (
      /* istanbul ignore next */
      {}
    );
    util.isInteger = Number.isInteger || /* istanbul ignore next */
    function isInteger(value) {
      return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
    };
    util.isString = function isString(value) {
      return typeof value === "string" || value instanceof String;
    };
    util.isObject = function isObject(value) {
      return value && typeof value === "object";
    };
    util.isset = /**
     * Checks if a property on a message is considered to be present.
     * @param {Object} obj Plain object or message instance
     * @param {string} prop Property name
     * @returns {boolean} `true` if considered to be present, otherwise `false`
     */
    util.isSet = function isSet(obj, prop) {
      var value = obj[prop];
      if (value != null && Object.hasOwnProperty.call(obj, prop))
        return typeof value !== "object" || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0;
      return false;
    };
    util.Buffer = (function() {
      try {
        var Buffer2 = util.global.Buffer;
        return Buffer2.prototype.utf8Write ? Buffer2 : (
          /* istanbul ignore next */
          null
        );
      } catch (e) {
        return null;
      }
    })();
    util._Buffer_from = null;
    util._Buffer_allocUnsafe = null;
    util.newBuffer = function newBuffer(sizeOrArray) {
      return typeof sizeOrArray === "number" ? util.Buffer ? util._Buffer_allocUnsafe(sizeOrArray) : new util.Array(sizeOrArray) : util.Buffer ? util._Buffer_from(sizeOrArray) : typeof Uint8Array === "undefined" ? sizeOrArray : new Uint8Array(sizeOrArray);
    };
    util.Array = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
    util.Long = /* istanbul ignore next */
    util.global.dcodeIO && /* istanbul ignore next */
    util.global.dcodeIO.Long || /* istanbul ignore next */
    util.global.Long || (function() {
      try {
        var Long = require_umd();
        return Long && Long.isLong ? Long : null;
      } catch (e) {
        return null;
      }
    })();
    util.key2Re = /^true|false|0|1$/;
    util.key32Re = /^-?(?:0|[1-9][0-9]*)$/;
    util.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/;
    util.longToHash = function longToHash(value) {
      return value ? util.LongBits.from(value).toHash() : util.LongBits.zeroHash;
    };
    util.longFromHash = function longFromHash(hash, unsigned) {
      var bits = util.LongBits.fromHash(hash);
      if (util.Long)
        return util.Long.fromBits(bits.lo, bits.hi, unsigned);
      return bits.toNumber(Boolean(unsigned));
    };
    function merge(dst) {
      var ifNotSet = typeof arguments[arguments.length - 1] === "boolean", limit = ifNotSet ? arguments.length - 1 : arguments.length;
      ifNotSet = ifNotSet && arguments[arguments.length - 1];
      for (var a = 1; a < limit; ++a) {
        var src = arguments[a];
        if (!src)
          continue;
        for (var keys = Object.keys(src), i = 0; i < keys.length; ++i)
          if (!isUnsafeProperty(keys[i]) && (dst[keys[i]] === void 0 || !ifNotSet))
            dst[keys[i]] = src[keys[i]];
      }
      return dst;
    }
    util.merge = merge;
    util.nestingLimit = 32;
    util.recursionLimit = 100;
    util.makeProp = function makeProp(obj, key) {
      Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        writable: true
      });
    };
    util.lcFirst = function lcFirst(str7) {
      return str7.charAt(0).toLowerCase() + str7.substring(1);
    };
    function newError(name14) {
      function CustomError(message, properties) {
        if (!(this instanceof CustomError))
          return new CustomError(message, properties);
        Object.defineProperty(this, "message", { get: function() {
          return message;
        } });
        if (Error.captureStackTrace)
          Error.captureStackTrace(this, CustomError);
        else
          Object.defineProperty(this, "stack", { value: new Error().stack || "" });
        if (properties)
          merge(this, properties);
      }
      CustomError.prototype = Object.create(Error.prototype, {
        constructor: {
          value: CustomError,
          writable: true,
          enumerable: false,
          configurable: true
        },
        name: {
          get: function get() {
            return name14;
          },
          set: void 0,
          enumerable: false,
          // configurable: false would accurately preserve the behavior of
          // the original, but I'm guessing that was not intentional.
          // For an actual error subclass, this property would
          // be configurable.
          configurable: true
        },
        toString: {
          value: function value() {
            return this.name + ": " + this.message;
          },
          writable: true,
          enumerable: false,
          configurable: true
        }
      });
      return CustomError;
    }
    util.newError = newError;
    util.ProtocolError = newError("ProtocolError");
    util.oneOfGetter = function getOneOf(fieldNames) {
      var fieldMap = {};
      for (var i = 0; i < fieldNames.length; ++i)
        fieldMap[fieldNames[i]] = 1;
      return function() {
        for (var keys = Object.keys(this), i2 = keys.length - 1; i2 > -1; --i2)
          if (fieldMap[keys[i2]] === 1 && this[keys[i2]] !== void 0 && this[keys[i2]] !== null)
            return keys[i2];
      };
    };
    util.oneOfSetter = function setOneOf(fieldNames) {
      return function(name14) {
        for (var i = 0; i < fieldNames.length; ++i)
          if (fieldNames[i] !== name14)
            delete this[fieldNames[i]];
      };
    };
    util.toJSONOptions = {
      longs: String,
      enums: String,
      bytes: String,
      json: true
    };
    util._configure = function() {
      var Buffer2 = util.Buffer;
      if (!Buffer2) {
        util._Buffer_from = util._Buffer_allocUnsafe = null;
        return;
      }
      util._Buffer_from = Buffer2.from !== Uint8Array.from && Buffer2.from || /* istanbul ignore next */
      function Buffer_from(value, encoding) {
        return new Buffer2(value, encoding);
      };
      util._Buffer_allocUnsafe = Buffer2.allocUnsafe || /* istanbul ignore next */
      function Buffer_allocUnsafe(size) {
        return new Buffer2(size);
      };
    };
  }
});

// node_modules/protobufjs/src/writer.js
var require_writer = __commonJS({
  "node_modules/protobufjs/src/writer.js"(exports, module) {
    "use strict";
    module.exports = Writer;
    var util = require_minimal();
    var BufferWriter;
    var LongBits = util.LongBits;
    var base64 = util.base64;
    var utf8 = util.utf8;
    function Op(fn, len, val) {
      this.fn = fn;
      this.len = len;
      this.next = void 0;
      this.val = val;
    }
    function noop() {
    }
    function State(writer) {
      this.head = writer.head;
      this.tail = writer.tail;
      this.len = writer.len;
      this.next = writer.states;
    }
    function Writer() {
      this.len = 0;
      this.head = new Op(noop, 0, 0);
      this.tail = this.head;
      this.states = null;
    }
    var create = function create2() {
      return util.Buffer ? function create_buffer_setup() {
        return (Writer.create = function create_buffer() {
          return new BufferWriter();
        })();
      } : function create_array() {
        return new Writer();
      };
    };
    Writer.create = create();
    Writer.alloc = function alloc(size) {
      return new util.Array(size);
    };
    if (util.Array !== Array)
      Writer.alloc = util.pool(Writer.alloc, util.Array.prototype.subarray);
    Writer.prototype._push = function push(fn, len, val) {
      this.tail = this.tail.next = new Op(fn, len, val);
      this.len += len;
      return this;
    };
    function writeByte(val, buf, pos) {
      buf[pos] = val & 255;
    }
    function writeVarint32(val, buf, pos) {
      while (val > 127) {
        buf[pos++] = val & 127 | 128;
        val >>>= 7;
      }
      buf[pos] = val;
    }
    function VarintOp(len, val) {
      this.len = len;
      this.next = void 0;
      this.val = val;
    }
    VarintOp.prototype = Object.create(Op.prototype);
    VarintOp.prototype.fn = writeVarint32;
    Writer.prototype.uint32 = function write_uint32(value) {
      this.len += (this.tail = this.tail.next = new VarintOp(
        (value = value >>> 0) < 128 ? 1 : value < 16384 ? 2 : value < 2097152 ? 3 : value < 268435456 ? 4 : 5,
        value
      )).len;
      return this;
    };
    Writer.prototype.int32 = function write_int32(value) {
      return (value |= 0) < 0 ? this._push(writeVarint64, 10, LongBits.fromNumber(value)) : this.uint32(value);
    };
    Writer.prototype.sint32 = function write_sint32(value) {
      return this.uint32((value << 1 ^ value >> 31) >>> 0);
    };
    function writeVarint64(val, buf, pos) {
      var lo = val.lo, hi = val.hi;
      while (hi) {
        buf[pos++] = lo & 127 | 128;
        lo = (lo >>> 7 | hi << 25) >>> 0;
        hi >>>= 7;
      }
      while (lo > 127) {
        buf[pos++] = lo & 127 | 128;
        lo = lo >>> 7;
      }
      buf[pos++] = lo;
    }
    Writer.prototype.uint64 = function write_uint64(value) {
      var bits = LongBits.from(value);
      return this._push(writeVarint64, bits.length(), bits);
    };
    Writer.prototype.int64 = Writer.prototype.uint64;
    Writer.prototype.sint64 = function write_sint64(value) {
      var bits = LongBits.from(value).zzEncode();
      return this._push(writeVarint64, bits.length(), bits);
    };
    Writer.prototype.bool = function write_bool(value) {
      return this._push(writeByte, 1, value ? 1 : 0);
    };
    function writeFixed32(val, buf, pos) {
      buf[pos] = val & 255;
      buf[pos + 1] = val >>> 8 & 255;
      buf[pos + 2] = val >>> 16 & 255;
      buf[pos + 3] = val >>> 24;
    }
    Writer.prototype.fixed32 = function write_fixed32(value) {
      return this._push(writeFixed32, 4, value >>> 0);
    };
    Writer.prototype.sfixed32 = Writer.prototype.fixed32;
    Writer.prototype.fixed64 = function write_fixed64(value) {
      var bits = LongBits.from(value);
      return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
    };
    Writer.prototype.sfixed64 = Writer.prototype.fixed64;
    Writer.prototype.float = function write_float(value) {
      return this._push(util.float.writeFloatLE, 4, value);
    };
    Writer.prototype.double = function write_double(value) {
      return this._push(util.float.writeDoubleLE, 8, value);
    };
    var writeBytes = util.Array.prototype.set ? function writeBytes_set(val, buf, pos) {
      buf.set(val, pos);
    } : function writeBytes_for(val, buf, pos) {
      for (var i = 0; i < val.length; ++i)
        buf[pos + i] = val[i];
    };
    Writer.prototype.bytes = function write_bytes(value) {
      var len = value.length >>> 0;
      if (!len)
        return this._push(writeByte, 1, 0);
      if (util.isString(value)) {
        var buf = Writer.alloc(len = base64.length(value));
        base64.decode(value, buf, 0);
        value = buf;
      }
      return this.uint32(len)._push(writeBytes, len, value);
    };
    Writer.prototype.string = function write_string(value) {
      var len = utf8.length(value);
      return len ? this.uint32(len)._push(utf8.write, len, value) : this._push(writeByte, 1, 0);
    };
    Writer.prototype.fork = function fork() {
      this.states = new State(this);
      this.head = this.tail = new Op(noop, 0, 0);
      this.len = 0;
      return this;
    };
    Writer.prototype.reset = function reset() {
      if (this.states) {
        this.head = this.states.head;
        this.tail = this.states.tail;
        this.len = this.states.len;
        this.states = this.states.next;
      } else {
        this.head = this.tail = new Op(noop, 0, 0);
        this.len = 0;
      }
      return this;
    };
    Writer.prototype.ldelim = function ldelim() {
      var head = this.head, tail = this.tail, len = this.len;
      this.reset().uint32(len);
      if (len) {
        this.tail.next = head.next;
        this.tail = tail;
        this.len += len;
      }
      return this;
    };
    Writer.prototype.finish = function finish() {
      var head = this.head.next, buf = this.constructor.alloc(this.len), pos = 0;
      while (head) {
        head.fn(head.val, buf, pos);
        pos += head.len;
        head = head.next;
      }
      return buf;
    };
    Writer._configure = function(BufferWriter_) {
      BufferWriter = BufferWriter_;
      Writer.create = create();
      BufferWriter._configure();
    };
  }
});

// node_modules/protobufjs/src/writer_buffer.js
var require_writer_buffer = __commonJS({
  "node_modules/protobufjs/src/writer_buffer.js"(exports, module) {
    "use strict";
    module.exports = BufferWriter;
    var Writer = require_writer();
    (BufferWriter.prototype = Object.create(Writer.prototype)).constructor = BufferWriter;
    var util = require_minimal();
    function BufferWriter() {
      Writer.call(this);
    }
    BufferWriter._configure = function() {
      BufferWriter.alloc = util._Buffer_allocUnsafe;
      BufferWriter.writeBytesBuffer = util.Buffer && util.Buffer.prototype instanceof Uint8Array && util.Buffer.prototype.set.name === "set" ? function writeBytesBuffer_set(val, buf, pos) {
        buf.set(val, pos);
      } : function writeBytesBuffer_copy(val, buf, pos) {
        if (val.copy)
          val.copy(buf, pos, 0, val.length);
        else for (var i = 0; i < val.length; )
          buf[pos++] = val[i++];
      };
    };
    BufferWriter.prototype.bytes = function write_bytes_buffer(value) {
      if (util.isString(value))
        value = util._Buffer_from(value, "base64");
      var len = value.length >>> 0;
      this.uint32(len);
      if (len)
        this._push(BufferWriter.writeBytesBuffer, len, value);
      return this;
    };
    function writeStringBuffer(val, buf, pos) {
      if (val.length < 40)
        util.utf8.write(val, buf, pos);
      else if (buf.utf8Write)
        buf.utf8Write(val, pos);
      else
        buf.write(val, pos);
    }
    BufferWriter.prototype.string = function write_string_buffer(value) {
      var len = util.Buffer.byteLength(value);
      this.uint32(len);
      if (len)
        this._push(writeStringBuffer, len, value);
      return this;
    };
    BufferWriter._configure();
  }
});

// node_modules/protobufjs/src/reader.js
var require_reader = __commonJS({
  "node_modules/protobufjs/src/reader.js"(exports, module) {
    "use strict";
    module.exports = Reader;
    var util = require_minimal();
    var BufferReader;
    var LongBits = util.LongBits;
    var utf8 = util.utf8;
    function indexOutOfRange(reader, writeLength) {
      return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
    }
    function Reader(buffer) {
      this.buf = buffer;
      this.pos = 0;
      this.len = buffer.length;
    }
    var create_array = typeof Uint8Array !== "undefined" ? function create_typed_array(buffer) {
      if (buffer instanceof Uint8Array || Array.isArray(buffer))
        return new Reader(buffer);
      throw Error("illegal buffer");
    } : function create_array2(buffer) {
      if (Array.isArray(buffer))
        return new Reader(buffer);
      throw Error("illegal buffer");
    };
    var create = function create2() {
      return util.Buffer ? function create_buffer_setup(buffer) {
        return (Reader.create = function create_buffer(buffer2) {
          return util.Buffer.isBuffer(buffer2) ? new BufferReader(buffer2) : create_array(buffer2);
        })(buffer);
      } : create_array;
    };
    Reader.create = create();
    Reader.prototype._slice = util.Array.prototype.subarray || /* istanbul ignore next */
    util.Array.prototype.slice;
    function readVarint32NearEnd(reader) {
      var value = 0;
      for (var i = 0; i < 4; ++i) {
        if (reader.pos >= reader.len)
          throw indexOutOfRange(reader);
        var b = reader.buf[reader.pos++];
        value = (value | (b & 127) << i * 7) >>> 0;
        if (b < 128)
          return value;
      }
      throw indexOutOfRange(reader);
    }
    Reader.prototype.uint32 = /* @__PURE__ */ (function read_uint32_setup() {
      var value = 4294967295;
      return function read_uint32() {
        if (this.len - this.pos < 5) {
          if (this.pos >= this.len)
            throw indexOutOfRange(this);
          if (this.buf[this.pos] >= 128)
            return readVarint32NearEnd(this);
        }
        value = (this.buf[this.pos] & 127) >>> 0;
        if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 7) >>> 0;
        if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 14) >>> 0;
        if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 21) >>> 0;
        if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 15) << 28) >>> 0;
        if (this.buf[this.pos++] < 128) return value;
        if ((this.pos += 5) > this.len) {
          this.pos = this.len;
          throw indexOutOfRange(this, 10);
        }
        return value;
      };
    })();
    Reader.prototype.int32 = function read_int32() {
      return this.uint32() | 0;
    };
    Reader.prototype.sint32 = function read_sint32() {
      var value = this.uint32();
      return value >>> 1 ^ -(value & 1) | 0;
    };
    function readLongVarint() {
      var bits = new LongBits(0, 0);
      var i = 0;
      if (this.len - this.pos > 4) {
        for (; i < 4; ++i) {
          bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
          if (this.buf[this.pos++] < 128)
            return bits;
        }
        bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
        bits.hi = (bits.hi | (this.buf[this.pos] & 127) >> 4) >>> 0;
        if (this.buf[this.pos++] < 128)
          return bits;
        i = 0;
      } else {
        for (; i < 3; ++i) {
          if (this.pos >= this.len)
            throw indexOutOfRange(this);
          bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
          if (this.buf[this.pos++] < 128)
            return bits;
        }
        bits.lo = (bits.lo | (this.buf[this.pos++] & 127) << i * 7) >>> 0;
        return bits;
      }
      if (this.len - this.pos > 4) {
        for (; i < 5; ++i) {
          bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
          if (this.buf[this.pos++] < 128)
            return bits;
        }
      } else {
        for (; i < 5; ++i) {
          if (this.pos >= this.len)
            throw indexOutOfRange(this);
          bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
          if (this.buf[this.pos++] < 128)
            return bits;
        }
      }
      throw Error("invalid varint encoding");
    }
    Reader.prototype.bool = function read_bool() {
      return this.uint32() !== 0;
    };
    function readFixed32_end(buf, end) {
      return (buf[end - 4] | buf[end - 3] << 8 | buf[end - 2] << 16 | buf[end - 1] << 24) >>> 0;
    }
    Reader.prototype.fixed32 = function read_fixed32() {
      if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);
      return readFixed32_end(this.buf, this.pos += 4);
    };
    Reader.prototype.sfixed32 = function read_sfixed32() {
      if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);
      return readFixed32_end(this.buf, this.pos += 4) | 0;
    };
    function readFixed64() {
      if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 8);
      return new LongBits(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
    }
    Reader.prototype.float = function read_float() {
      if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);
      var value = util.float.readFloatLE(this.buf, this.pos);
      this.pos += 4;
      return value;
    };
    Reader.prototype.double = function read_double() {
      if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 4);
      var value = util.float.readDoubleLE(this.buf, this.pos);
      this.pos += 8;
      return value;
    };
    Reader.prototype.bytes = function read_bytes() {
      var length = this.uint32(), start = this.pos, end = this.pos + length;
      if (end > this.len)
        throw indexOutOfRange(this, length);
      this.pos += length;
      if (Array.isArray(this.buf))
        return this.buf.slice(start, end);
      if (start === end) {
        var nativeBuffer = util.Buffer;
        return nativeBuffer ? nativeBuffer.alloc(0) : new this.buf.constructor(0);
      }
      return this._slice.call(this.buf, start, end);
    };
    Reader.prototype.string = function read_string() {
      var bytes = this.bytes();
      return utf8.read(bytes, 0, bytes.length);
    };
    Reader.prototype.skip = function skip(length) {
      if (typeof length === "number") {
        if (this.pos + length > this.len)
          throw indexOutOfRange(this, length);
        this.pos += length;
      } else {
        do {
          if (this.pos >= this.len)
            throw indexOutOfRange(this);
        } while (this.buf[this.pos++] & 128);
      }
      return this;
    };
    Reader.recursionLimit = util.recursionLimit;
    Reader.prototype.skipType = function(wireType, depth) {
      if (depth === void 0) depth = 0;
      if (depth > Reader.recursionLimit)
        throw Error("maximum nesting depth exceeded");
      switch (wireType) {
        case 0:
          this.skip();
          break;
        case 1:
          this.skip(8);
          break;
        case 2:
          this.skip(this.uint32());
          break;
        case 3:
          while ((wireType = this.uint32() & 7) !== 4) {
            this.skipType(wireType, depth + 1);
          }
          break;
        case 5:
          this.skip(4);
          break;
        /* istanbul ignore next */
        default:
          throw Error("invalid wire type " + wireType + " at offset " + this.pos);
      }
      return this;
    };
    Reader._configure = function(BufferReader_) {
      BufferReader = BufferReader_;
      Reader.create = create();
      BufferReader._configure();
      var fn = util.Long ? "toLong" : (
        /* istanbul ignore next */
        "toNumber"
      );
      util.merge(Reader.prototype, {
        int64: function read_int64() {
          return readLongVarint.call(this)[fn](false);
        },
        uint64: function read_uint64() {
          return readLongVarint.call(this)[fn](true);
        },
        sint64: function read_sint64() {
          return readLongVarint.call(this).zzDecode()[fn](false);
        },
        fixed64: function read_fixed64() {
          return readFixed64.call(this)[fn](true);
        },
        sfixed64: function read_sfixed64() {
          return readFixed64.call(this)[fn](false);
        }
      });
    };
  }
});

// node_modules/protobufjs/src/reader_buffer.js
var require_reader_buffer = __commonJS({
  "node_modules/protobufjs/src/reader_buffer.js"(exports, module) {
    "use strict";
    module.exports = BufferReader;
    var Reader = require_reader();
    (BufferReader.prototype = Object.create(Reader.prototype)).constructor = BufferReader;
    var util = require_minimal();
    function BufferReader(buffer) {
      Reader.call(this, buffer);
    }
    BufferReader._configure = function() {
      if (util.Buffer)
        BufferReader.prototype._slice = util.Buffer.prototype.slice;
    };
    BufferReader.prototype.string = function read_string_buffer() {
      var len = this.uint32();
      return this.buf.utf8Slice ? this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + len, this.len)) : this.buf.toString("utf-8", this.pos, this.pos = Math.min(this.pos + len, this.len));
    };
    BufferReader._configure();
  }
});

// node_modules/protobufjs/src/rpc/service.js
var require_service = __commonJS({
  "node_modules/protobufjs/src/rpc/service.js"(exports, module) {
    "use strict";
    module.exports = Service;
    var util = require_minimal();
    (Service.prototype = Object.create(util.EventEmitter.prototype)).constructor = Service;
    function Service(rpcImpl, requestDelimited, responseDelimited) {
      if (typeof rpcImpl !== "function")
        throw TypeError("rpcImpl must be a function");
      util.EventEmitter.call(this);
      this.rpcImpl = rpcImpl;
      this.requestDelimited = Boolean(requestDelimited);
      this.responseDelimited = Boolean(responseDelimited);
    }
    Service.prototype.rpcCall = function rpcCall(method, requestCtor, responseCtor, request, callback) {
      if (!request)
        throw TypeError("request must be specified");
      var self2 = this;
      if (!callback)
        return util.asPromise(rpcCall, self2, method, requestCtor, responseCtor, request);
      if (!self2.rpcImpl) {
        setTimeout(function() {
          callback(Error("already ended"));
        }, 0);
        return void 0;
      }
      try {
        return self2.rpcImpl(
          method,
          requestCtor[self2.requestDelimited ? "encodeDelimited" : "encode"](request).finish(),
          function rpcCallback(err, response) {
            if (err) {
              self2.emit("error", err, method);
              return callback(err);
            }
            if (response === null) {
              self2.end(
                /* endedByRPC */
                true
              );
              return void 0;
            }
            if (!(response instanceof responseCtor)) {
              try {
                response = responseCtor[self2.responseDelimited ? "decodeDelimited" : "decode"](response);
              } catch (err2) {
                self2.emit("error", err2, method);
                return callback(err2);
              }
            }
            self2.emit("data", response, method);
            return callback(null, response);
          }
        );
      } catch (err) {
        self2.emit("error", err, method);
        setTimeout(function() {
          callback(err);
        }, 0);
        return void 0;
      }
    };
    Service.prototype.end = function end(endedByRPC) {
      if (this.rpcImpl) {
        if (!endedByRPC)
          this.rpcImpl(null, null, null);
        this.rpcImpl = null;
        this.emit("end").off();
      }
      return this;
    };
  }
});

// node_modules/protobufjs/src/rpc.js
var require_rpc = __commonJS({
  "node_modules/protobufjs/src/rpc.js"(exports) {
    "use strict";
    var rpc = exports;
    rpc.Service = require_service();
  }
});

// node_modules/protobufjs/src/roots.js
var require_roots = __commonJS({
  "node_modules/protobufjs/src/roots.js"(exports, module) {
    "use strict";
    module.exports = /* @__PURE__ */ Object.create(null);
  }
});

// node_modules/protobufjs/src/index-minimal.js
var require_index_minimal = __commonJS({
  "node_modules/protobufjs/src/index-minimal.js"(exports) {
    "use strict";
    var protobuf5 = exports;
    protobuf5.build = "minimal";
    protobuf5.Writer = require_writer();
    protobuf5.BufferWriter = require_writer_buffer();
    protobuf5.Reader = require_reader();
    protobuf5.BufferReader = require_reader_buffer();
    protobuf5.util = require_minimal();
    protobuf5.rpc = require_rpc();
    protobuf5.roots = require_roots();
    protobuf5.configure = configure;
    function configure() {
      protobuf5.util._configure();
      protobuf5.Writer._configure(protobuf5.BufferWriter);
      protobuf5.Reader._configure(protobuf5.BufferReader);
    }
    configure();
  }
});

// node_modules/@protobufjs/codegen/index.js
var require_codegen = __commonJS({
  "node_modules/@protobufjs/codegen/index.js"(exports, module) {
    "use strict";
    module.exports = codegen;
    var reservedRe = /^(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$/;
    function codegen(functionParams, functionName) {
      if (typeof functionParams === "string") {
        functionName = functionParams;
        functionParams = void 0;
      }
      var body = [];
      function Codegen(formatStringOrScope) {
        if (typeof formatStringOrScope !== "string") {
          var source = toString();
          if (codegen.verbose)
            console.log("codegen: " + source);
          source = "return " + source;
          if (formatStringOrScope) {
            var scopeKeys = Object.keys(formatStringOrScope), scopeParams = new Array(scopeKeys.length + 1), scopeValues = new Array(scopeKeys.length), scopeOffset = 0;
            while (scopeOffset < scopeKeys.length) {
              scopeParams[scopeOffset] = scopeKeys[scopeOffset];
              scopeValues[scopeOffset] = formatStringOrScope[scopeKeys[scopeOffset++]];
            }
            scopeParams[scopeOffset] = source;
            return Function.apply(null, scopeParams).apply(null, scopeValues);
          }
          return Function(source)();
        }
        var formatParams = new Array(arguments.length - 1), formatOffset = 0;
        while (formatOffset < formatParams.length)
          formatParams[formatOffset] = arguments[++formatOffset];
        formatOffset = 0;
        formatStringOrScope = formatStringOrScope.replace(/%([%dfijs])/g, function replace($0, $1) {
          var value = formatParams[formatOffset++];
          switch ($1) {
            case "d":
            case "f":
              return String(Number(value));
            case "i":
              return String(Math.floor(value));
            case "j":
              return JSON.stringify(value);
            case "s":
              return String(value);
          }
          return "%";
        });
        if (formatOffset !== formatParams.length)
          throw Error("parameter count mismatch");
        body.push(formatStringOrScope);
        return Codegen;
      }
      function toString(functionNameOverride) {
        return "function " + safeFunctionName(functionNameOverride || functionName) + "(" + (functionParams && functionParams.join(",") || "") + "){\n  " + body.join("\n  ") + "\n}";
      }
      Codegen.toString = toString;
      return Codegen;
    }
    codegen.verbose = false;
    function safeFunctionName(name14) {
      if (!name14)
        return "";
      name14 = String(name14).replace(/[^\w$]/g, "");
      if (!name14)
        return "";
      if (/^\d/.test(name14))
        name14 = "_" + name14;
      return reservedRe.test(name14) ? name14 + "_" : name14;
    }
  }
});

// node_modules/@protobufjs/fetch/util/fs.js
var require_fs = __commonJS({
  "node_modules/@protobufjs/fetch/util/fs.js"(exports, module) {
    "use strict";
    var fs9 = null;
    try {
      fs9 = __require(
        /* webpackIgnore: true */
        "fs"
      );
      if (!fs9 || !fs9.readFile || !fs9.readFileSync)
        fs9 = null;
    } catch (e) {
    }
    module.exports = fs9;
  }
});

// node_modules/@protobufjs/fetch/index.js
var require_fetch = __commonJS({
  "node_modules/@protobufjs/fetch/index.js"(exports, module) {
    "use strict";
    module.exports = fetch2;
    var asPromise = require_aspromise();
    var fs9 = require_fs();
    function fetch2(filename, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = {};
      } else if (!options)
        options = {};
      if (!callback)
        return asPromise(fetch2, this, filename, options);
      if (!options.xhr && fs9 && fs9.readFile)
        return fs9.readFile(filename, function fetchReadFileCallback(err, contents) {
          return err && typeof XMLHttpRequest !== "undefined" ? fetch2.xhr(filename, options, callback) : err ? callback(err) : callback(null, options.binary ? contents : contents.toString("utf8"));
        });
      return fetch2.xhr(filename, options, callback);
    }
    fetch2.xhr = function fetch_xhr(filename, options, callback) {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function fetchOnReadyStateChange() {
        if (xhr.readyState !== 4)
          return void 0;
        if (xhr.status !== 0 && xhr.status !== 200)
          return callback(Error("status " + xhr.status));
        if (options.binary) {
          var buffer = xhr.response;
          if (!buffer) {
            buffer = [];
            for (var i = 0; i < xhr.responseText.length; ++i)
              buffer.push(xhr.responseText.charCodeAt(i) & 255);
          }
          return callback(null, typeof Uint8Array !== "undefined" ? new Uint8Array(buffer) : buffer);
        }
        return callback(null, xhr.responseText);
      };
      if (options.binary) {
        if ("overrideMimeType" in xhr)
          xhr.overrideMimeType("text/plain; charset=x-user-defined");
        xhr.responseType = "arraybuffer";
      }
      xhr.open("GET", filename);
      xhr.send();
    };
  }
});

// node_modules/@protobufjs/path/index.js
var require_path = __commonJS({
  "node_modules/@protobufjs/path/index.js"(exports) {
    "use strict";
    var path25 = exports;
    var isAbsolute = (
      /**
       * Tests if the specified path is absolute.
       * @param {string} path Path to test
       * @returns {boolean} `true` if path is absolute
       */
      path25.isAbsolute = function isAbsolute2(path26) {
        return /^(?:\/|\w+:)/.test(path26);
      }
    );
    var normalize = (
      /**
       * Normalizes the specified path.
       * @param {string} path Path to normalize
       * @returns {string} Normalized path
       */
      path25.normalize = function normalize2(path26) {
        path26 = path26.replace(/\\/g, "/").replace(/\/{2,}/g, "/");
        var parts = path26.split("/"), absolute = isAbsolute(path26), prefix = "";
        if (absolute)
          prefix = parts.shift() + "/";
        for (var i = 0; i < parts.length; ) {
          if (parts[i] === "..") {
            if (i > 0 && parts[i - 1] !== "..")
              parts.splice(--i, 2);
            else if (absolute)
              parts.splice(i, 1);
            else
              ++i;
          } else if (parts[i] === ".")
            parts.splice(i, 1);
          else
            ++i;
        }
        return prefix + parts.join("/");
      }
    );
    path25.resolve = function resolve2(originPath, includePath, alreadyNormalized) {
      if (!alreadyNormalized)
        includePath = normalize(includePath);
      if (isAbsolute(includePath))
        return includePath;
      if (!alreadyNormalized)
        originPath = normalize(originPath);
      return (originPath = originPath.replace(/(?:\/|^)[^/]+$/, "")).length ? normalize(originPath + "/" + includePath) : includePath;
    };
  }
});

// node_modules/protobufjs/src/util/patterns.js
var require_patterns = __commonJS({
  "node_modules/protobufjs/src/util/patterns.js"(exports) {
    "use strict";
    var patterns = exports;
    patterns.numberRe = /^(?![eE])[0-9]*(?:\.[0-9]*)?(?:[eE][+-]?[0-9]+)?$/;
    patterns.typeRefRe = /^(?:\.?[a-zA-Z_][a-zA-Z_0-9]*)(?:\.[a-zA-Z_][a-zA-Z_0-9]*)*$/;
    patterns.reservedRe = /^(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$/;
  }
});

// node_modules/protobufjs/src/util/fs.js
var require_fs2 = __commonJS({
  "node_modules/protobufjs/src/util/fs.js"(exports, module) {
    "use strict";
    var fs9 = null;
    try {
      fs9 = __require(
        /* webpackIgnore: true */
        "fs"
      );
      if (!fs9 || !fs9.readFile || !fs9.readFileSync)
        fs9 = null;
    } catch (e) {
    }
    module.exports = fs9;
  }
});

// node_modules/protobufjs/src/namespace.js
var require_namespace = __commonJS({
  "node_modules/protobufjs/src/namespace.js"(exports, module) {
    "use strict";
    module.exports = Namespace;
    var ReflectionObject = require_object();
    ((Namespace.prototype = Object.create(ReflectionObject.prototype)).constructor = Namespace).className = "Namespace";
    var Field = require_field();
    var util = require_util();
    var OneOf = require_oneof();
    var Type;
    var Service;
    var Enum;
    Namespace.fromJSON = function fromJSON(name14, json, depth) {
      depth = util.checkDepth(depth);
      return new Namespace(name14, json.options).addJSON(json.nested, depth);
    };
    function arrayToJSON(array, toJSONOptions) {
      if (!(array && array.length))
        return void 0;
      var obj = {};
      for (var i = 0; i < array.length; ++i)
        obj[array[i].name] = array[i].toJSON(toJSONOptions);
      return obj;
    }
    Namespace.arrayToJSON = arrayToJSON;
    Namespace.isReservedId = function isReservedId(reserved, id) {
      if (reserved) {
        for (var i = 0; i < reserved.length; ++i)
          if (typeof reserved[i] !== "string" && reserved[i][0] <= id && reserved[i][1] > id)
            return true;
      }
      return false;
    };
    Namespace.isReservedName = function isReservedName(reserved, name14) {
      if (reserved) {
        for (var i = 0; i < reserved.length; ++i)
          if (reserved[i] === name14)
            return true;
      }
      return false;
    };
    function Namespace(name14, options) {
      ReflectionObject.call(this, name14, options);
      this.nested = void 0;
      this._nestedArray = null;
      this._lookupCache = /* @__PURE__ */ Object.create(null);
      this._needsRecursiveFeatureResolution = true;
      this._needsRecursiveResolve = true;
    }
    function clearCache(namespace) {
      namespace._nestedArray = null;
      namespace._lookupCache = /* @__PURE__ */ Object.create(null);
      var parent = namespace;
      while (parent = parent.parent) {
        parent._lookupCache = /* @__PURE__ */ Object.create(null);
      }
      return namespace;
    }
    Object.defineProperty(Namespace.prototype, "nestedArray", {
      get: function() {
        return this._nestedArray || (this._nestedArray = util.toArray(this.nested));
      }
    });
    Namespace.prototype.toJSON = function toJSON(toJSONOptions) {
      return util.toObject([
        "options",
        this.options,
        "nested",
        arrayToJSON(this.nestedArray, toJSONOptions)
      ]);
    };
    Namespace.prototype.addJSON = function addJSON(nestedJson, depth) {
      depth = util.checkDepth(depth);
      var ns = this;
      if (nestedJson) {
        for (var names = Object.keys(nestedJson), i = 0, nested; i < names.length; ++i) {
          nested = nestedJson[names[i]];
          ns.add(
            // most to least likely
            (nested.fields !== void 0 ? Type.fromJSON : nested.values !== void 0 ? Enum.fromJSON : nested.methods !== void 0 ? Service.fromJSON : nested.id !== void 0 ? Field.fromJSON : Namespace.fromJSON)(names[i], nested, depth + 1)
          );
        }
      }
      return this;
    };
    Namespace.prototype.get = function get(name14) {
      return this.nested && Object.prototype.hasOwnProperty.call(this.nested, name14) ? this.nested[name14] : null;
    };
    Namespace.prototype.getEnum = function getEnum(name14) {
      if (this.nested && Object.prototype.hasOwnProperty.call(this.nested, name14) && this.nested[name14] instanceof Enum)
        return this.nested[name14].values;
      throw Error("no such enum: " + name14);
    };
    Namespace.prototype.add = function add(object) {
      if (!(object instanceof Field && object.extend !== void 0 || object instanceof Type || object instanceof OneOf || object instanceof Enum || object instanceof Service || object instanceof Namespace))
        throw TypeError("object must be a valid nested object");
      if (object.name === "__proto__")
        return this;
      if (!this.nested)
        this.nested = {};
      else {
        var prev = this.get(object.name);
        if (prev) {
          if (prev instanceof Namespace && object instanceof Namespace && !(prev instanceof Type || prev instanceof Service)) {
            var nested = prev.nestedArray;
            for (var i = 0; i < nested.length; ++i)
              object.add(nested[i]);
            this.remove(prev);
            if (!this.nested)
              this.nested = {};
            object.setOptions(prev.options, true);
          } else
            throw Error("duplicate name '" + object.name + "' in " + this);
        }
      }
      this.nested[object.name] = object;
      if (!(this instanceof Type || this instanceof Service || this instanceof Enum || this instanceof Field)) {
        if (!object._edition) {
          object._edition = object._defaultEdition;
        }
      }
      this._needsRecursiveFeatureResolution = true;
      this._needsRecursiveResolve = true;
      var parent = this;
      while (parent = parent.parent) {
        parent._needsRecursiveFeatureResolution = true;
        parent._needsRecursiveResolve = true;
      }
      object.onAdd(this);
      return clearCache(this);
    };
    Namespace.prototype.remove = function remove(object) {
      if (!(object instanceof ReflectionObject))
        throw TypeError("object must be a ReflectionObject");
      if (object.parent !== this)
        throw Error(object + " is not a member of " + this);
      delete this.nested[object.name];
      if (!Object.keys(this.nested).length)
        this.nested = void 0;
      object.onRemove(this);
      return clearCache(this);
    };
    Namespace.prototype.define = function define2(path25, json) {
      if (util.isString(path25))
        path25 = path25.split(".");
      else if (!Array.isArray(path25))
        throw TypeError("illegal path");
      if (path25 && path25.length && path25[0] === "")
        throw Error("path must be relative");
      if (path25.length > util.recursionLimit)
        throw Error("max depth exceeded");
      var ptr = this;
      while (path25.length > 0) {
        var part = path25.shift();
        if (ptr.nested && ptr.nested[part]) {
          ptr = ptr.nested[part];
          if (!(ptr instanceof Namespace))
            throw Error("path conflicts with non-namespace objects");
        } else
          ptr.add(ptr = new Namespace(part));
      }
      if (json)
        ptr.addJSON(json);
      return ptr;
    };
    Namespace.prototype.resolveAll = function resolveAll() {
      if (!this._needsRecursiveResolve) return this;
      this._resolveFeaturesRecursive(this._edition);
      var nested = this.nestedArray, i = 0;
      this.resolve();
      while (i < nested.length)
        if (nested[i] instanceof Namespace)
          nested[i++].resolveAll();
        else
          nested[i++].resolve();
      this._needsRecursiveResolve = false;
      return this;
    };
    Namespace.prototype._resolveFeaturesRecursive = function _resolveFeaturesRecursive(edition) {
      if (!this._needsRecursiveFeatureResolution) return this;
      this._needsRecursiveFeatureResolution = false;
      edition = this._edition || edition;
      ReflectionObject.prototype._resolveFeaturesRecursive.call(this, edition);
      this.nestedArray.forEach((nested) => {
        nested._resolveFeaturesRecursive(edition);
      });
      return this;
    };
    Namespace.prototype.lookup = function lookup(path25, filterTypes, parentAlreadyChecked) {
      if (typeof filterTypes === "boolean") {
        parentAlreadyChecked = filterTypes;
        filterTypes = void 0;
      } else if (filterTypes && !Array.isArray(filterTypes))
        filterTypes = [filterTypes];
      if (util.isString(path25) && path25.length) {
        if (path25 === ".")
          return this.root;
        path25 = path25.split(".");
      } else if (!path25.length)
        return this;
      var flatPath = path25.join(".");
      if (path25[0] === "")
        return this.root.lookup(path25.slice(1), filterTypes);
      var found = this.root._fullyQualifiedObjects && this.root._fullyQualifiedObjects["." + flatPath];
      if (found && (!filterTypes || filterTypes.indexOf(found.constructor) > -1)) {
        return found;
      }
      found = this._lookupImpl(path25, flatPath);
      if (found && (!filterTypes || filterTypes.indexOf(found.constructor) > -1)) {
        return found;
      }
      if (parentAlreadyChecked)
        return null;
      var current = this;
      while (current.parent) {
        found = current.parent._lookupImpl(path25, flatPath);
        if (found && (!filterTypes || filterTypes.indexOf(found.constructor) > -1)) {
          return found;
        }
        current = current.parent;
      }
      return null;
    };
    Namespace.prototype._lookupImpl = function lookup(path25, flatPath) {
      if (Object.prototype.hasOwnProperty.call(this._lookupCache, flatPath)) {
        return this._lookupCache[flatPath];
      }
      var found = this.get(path25[0]);
      var exact = null;
      if (found) {
        if (path25.length === 1) {
          exact = found;
        } else if (found instanceof Namespace) {
          path25 = path25.slice(1);
          exact = found._lookupImpl(path25, path25.join("."));
        }
      } else {
        for (var i = 0; i < this.nestedArray.length; ++i)
          if (this._nestedArray[i] instanceof Namespace && (found = this._nestedArray[i]._lookupImpl(path25, flatPath))) {
            exact = found;
            break;
          }
      }
      this._lookupCache[flatPath] = exact;
      return exact;
    };
    Namespace.prototype.lookupType = function lookupType(path25) {
      var found = this.lookup(path25, [Type]);
      if (!found)
        throw Error("no such type: " + path25);
      return found;
    };
    Namespace.prototype.lookupEnum = function lookupEnum(path25) {
      var found = this.lookup(path25, [Enum]);
      if (!found)
        throw Error("no such Enum '" + path25 + "' in " + this);
      return found;
    };
    Namespace.prototype.lookupTypeOrEnum = function lookupTypeOrEnum(path25) {
      var found = this.lookup(path25, [Type, Enum]);
      if (!found)
        throw Error("no such Type or Enum '" + path25 + "' in " + this);
      return found;
    };
    Namespace.prototype.lookupService = function lookupService(path25) {
      var found = this.lookup(path25, [Service]);
      if (!found)
        throw Error("no such Service '" + path25 + "' in " + this);
      return found;
    };
    Namespace._configure = function(Type_, Service_, Enum_) {
      Type = Type_;
      Service = Service_;
      Enum = Enum_;
    };
  }
});

// node_modules/protobufjs/src/mapfield.js
var require_mapfield = __commonJS({
  "node_modules/protobufjs/src/mapfield.js"(exports, module) {
    "use strict";
    module.exports = MapField;
    var Field = require_field();
    ((MapField.prototype = Object.create(Field.prototype)).constructor = MapField).className = "MapField";
    var types = require_types();
    var util = require_util();
    function MapField(name14, id, keyType, type, options, comment) {
      Field.call(this, name14, id, type, void 0, void 0, options, comment);
      if (!util.isString(keyType))
        throw TypeError("keyType must be a string");
      this.keyType = keyType;
      this.resolvedKeyType = null;
      this.map = true;
    }
    MapField.fromJSON = function fromJSON(name14, json) {
      return new MapField(name14, json.id, json.keyType, json.type, json.options, json.comment);
    };
    MapField.prototype.toJSON = function toJSON(toJSONOptions) {
      var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
      return util.toObject([
        "keyType",
        this.keyType,
        "type",
        this.type,
        "id",
        this.id,
        "extend",
        this.extend,
        "options",
        this.options,
        "comment",
        keepComments ? this.comment : void 0
      ]);
    };
    MapField.prototype.resolve = function resolve2() {
      if (this.resolved)
        return this;
      if (types.mapKey[this.keyType] === void 0)
        throw Error("invalid key type: " + this.keyType);
      return Field.prototype.resolve.call(this);
    };
    MapField.d = function decorateMapField(fieldId, fieldKeyType, fieldValueType) {
      if (typeof fieldValueType === "function")
        fieldValueType = util.decorateType(fieldValueType).name;
      else if (fieldValueType && typeof fieldValueType === "object")
        fieldValueType = util.decorateEnum(fieldValueType).name;
      return function mapFieldDecorator(prototype, fieldName) {
        util.decorateType(prototype.constructor).add(new MapField(fieldName, fieldId, fieldKeyType, fieldValueType));
      };
    };
  }
});

// node_modules/protobufjs/src/method.js
var require_method = __commonJS({
  "node_modules/protobufjs/src/method.js"(exports, module) {
    "use strict";
    module.exports = Method;
    var ReflectionObject = require_object();
    ((Method.prototype = Object.create(ReflectionObject.prototype)).constructor = Method).className = "Method";
    var util = require_util();
    function Method(name14, type, requestType, responseType, requestStream, responseStream, options, comment, parsedOptions) {
      if (util.isObject(requestStream)) {
        options = requestStream;
        requestStream = responseStream = void 0;
      } else if (util.isObject(responseStream)) {
        options = responseStream;
        responseStream = void 0;
      }
      if (!(type === void 0 || util.isString(type)))
        throw TypeError("type must be a string");
      if (!util.isString(requestType))
        throw TypeError("requestType must be a string");
      if (!util.isString(responseType))
        throw TypeError("responseType must be a string");
      ReflectionObject.call(this, name14, options);
      this.type = type || "rpc";
      this.requestType = requestType;
      this.requestStream = requestStream ? true : void 0;
      this.responseType = responseType;
      this.responseStream = responseStream ? true : void 0;
      this.resolvedRequestType = null;
      this.resolvedResponseType = null;
      this.comment = comment;
      this.parsedOptions = parsedOptions;
    }
    Method.fromJSON = function fromJSON(name14, json) {
      return new Method(name14, json.type, json.requestType, json.responseType, json.requestStream, json.responseStream, json.options, json.comment, json.parsedOptions);
    };
    Method.prototype.toJSON = function toJSON(toJSONOptions) {
      var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
      return util.toObject([
        "type",
        this.type !== "rpc" && /* istanbul ignore next */
        this.type || void 0,
        "requestType",
        this.requestType,
        "requestStream",
        this.requestStream,
        "responseType",
        this.responseType,
        "responseStream",
        this.responseStream,
        "options",
        this.options,
        "comment",
        keepComments ? this.comment : void 0,
        "parsedOptions",
        this.parsedOptions
      ]);
    };
    Method.prototype.resolve = function resolve2() {
      if (this.resolved)
        return this;
      this.resolvedRequestType = this.parent.lookupType(this.requestType);
      this.resolvedResponseType = this.parent.lookupType(this.responseType);
      return ReflectionObject.prototype.resolve.call(this);
    };
  }
});

// node_modules/protobufjs/src/service.js
var require_service2 = __commonJS({
  "node_modules/protobufjs/src/service.js"(exports, module) {
    "use strict";
    module.exports = Service;
    var Namespace = require_namespace();
    ((Service.prototype = Object.create(Namespace.prototype)).constructor = Service).className = "Service";
    var Method = require_method();
    var util = require_util();
    var rpc = require_rpc();
    function Service(name14, options) {
      Namespace.call(this, name14, options);
      this.methods = {};
      this._methodsArray = null;
    }
    Service.fromJSON = function fromJSON(name14, json, depth) {
      depth = util.checkDepth(depth);
      var service = new Service(name14, json.options);
      if (json.methods)
        for (var names = Object.keys(json.methods), i = 0; i < names.length; ++i)
          service.add(Method.fromJSON(names[i], json.methods[names[i]]));
      if (json.nested)
        service.addJSON(json.nested, depth);
      if (json.edition)
        service._edition = json.edition;
      service.comment = json.comment;
      service._defaultEdition = "proto3";
      return service;
    };
    Service.prototype.toJSON = function toJSON(toJSONOptions) {
      var inherited = Namespace.prototype.toJSON.call(this, toJSONOptions);
      var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
      return util.toObject([
        "edition",
        this._editionToJSON(),
        "options",
        inherited && inherited.options || void 0,
        "methods",
        Namespace.arrayToJSON(this.methodsArray, toJSONOptions) || /* istanbul ignore next */
        {},
        "nested",
        inherited && inherited.nested || void 0,
        "comment",
        keepComments ? this.comment : void 0
      ]);
    };
    Object.defineProperty(Service.prototype, "methodsArray", {
      get: function() {
        return this._methodsArray || (this._methodsArray = util.toArray(this.methods));
      }
    });
    function clearCache(service) {
      service._methodsArray = null;
      return service;
    }
    Service.prototype.get = function get(name14) {
      return Object.prototype.hasOwnProperty.call(this.methods, name14) ? this.methods[name14] : Namespace.prototype.get.call(this, name14);
    };
    Service.prototype.resolveAll = function resolveAll() {
      if (!this._needsRecursiveResolve) return this;
      Namespace.prototype.resolve.call(this);
      var methods = this.methodsArray;
      for (var i = 0; i < methods.length; ++i)
        methods[i].resolve();
      return this;
    };
    Service.prototype._resolveFeaturesRecursive = function _resolveFeaturesRecursive(edition) {
      if (!this._needsRecursiveFeatureResolution) return this;
      edition = this._edition || edition;
      Namespace.prototype._resolveFeaturesRecursive.call(this, edition);
      this.methodsArray.forEach((method) => {
        method._resolveFeaturesRecursive(edition);
      });
      return this;
    };
    Service.prototype.add = function add(object) {
      if (this.get(object.name))
        throw Error("duplicate name '" + object.name + "' in " + this);
      if (object instanceof Method) {
        if (object.name === "__proto__")
          return this;
        this.methods[object.name] = object;
        object.parent = this;
        return clearCache(this);
      }
      return Namespace.prototype.add.call(this, object);
    };
    Service.prototype.remove = function remove(object) {
      if (object instanceof Method) {
        if (this.methods[object.name] !== object)
          throw Error(object + " is not a member of " + this);
        delete this.methods[object.name];
        object.parent = null;
        return clearCache(this);
      }
      return Namespace.prototype.remove.call(this, object);
    };
    Service.prototype.create = function create(rpcImpl, requestDelimited, responseDelimited) {
      var rpcService = new rpc.Service(rpcImpl, requestDelimited, responseDelimited);
      for (var i = 0, method; i < /* initializes */
      this.methodsArray.length; ++i) {
        var methodName = util.lcFirst((method = this._methodsArray[i]).resolve().name).replace(/[^$\w_]/g, "");
        rpcService[methodName] = /* @__PURE__ */ (function(method2, requestType, responseType) {
          return function rpcMethod(request, callback) {
            return rpc.Service.prototype.rpcCall.call(this, method2, requestType, responseType, request, callback);
          };
        })(method, method.resolvedRequestType.ctor, method.resolvedResponseType.ctor);
      }
      return rpcService;
    };
  }
});

// node_modules/protobufjs/src/message.js
var require_message = __commonJS({
  "node_modules/protobufjs/src/message.js"(exports, module) {
    "use strict";
    module.exports = Message;
    var util = require_minimal();
    function Message(properties) {
      if (properties)
        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
          var key = keys[i];
          if (key === "__proto__")
            continue;
          this[key] = properties[key];
        }
    }
    Message.create = function create(properties) {
      return this.$type.create(properties);
    };
    Message.encode = function encode(message, writer) {
      return this.$type.encode(message, writer);
    };
    Message.encodeDelimited = function encodeDelimited(message, writer) {
      return this.$type.encodeDelimited(message, writer);
    };
    Message.decode = function decode(reader) {
      return this.$type.decode(reader);
    };
    Message.decodeDelimited = function decodeDelimited(reader) {
      return this.$type.decodeDelimited(reader);
    };
    Message.verify = function verify(message) {
      return this.$type.verify(message);
    };
    Message.fromObject = function fromObject(object) {
      return this.$type.fromObject(object);
    };
    Message.toObject = function toObject(message, options) {
      return this.$type.toObject(message, options);
    };
    Message.prototype.toJSON = function toJSON() {
      return this.$type.toObject(this, util.toJSONOptions);
    };
  }
});

// node_modules/protobufjs/src/decoder.js
var require_decoder = __commonJS({
  "node_modules/protobufjs/src/decoder.js"(exports, module) {
    "use strict";
    module.exports = decoder;
    var Enum = require_enum();
    var types = require_types();
    var util = require_util();
    function missing(field) {
      return "missing required '" + field.name + "'";
    }
    function decoder(mtype) {
      var gen = util.codegen(["r", "l", "e", "n"], mtype.name + "$decode")("if(!(r instanceof Reader))")("r=Reader.create(r)")("if(n===undefined)n=0")("if(n>Reader.recursionLimit)")('throw Error("maximum nesting depth exceeded")')("var c,m" + (mtype.fieldsArray.filter(function(field2) {
        return field2.map;
      }).length ? ",k,value" : ""))("if(l===undefined)")("c=r.len")("else{")("c=r.pos+l")("if(c>r.len)")('throw RangeError("index out of range")')("l=r.len")("r.len=c")("}")("m=new this.ctor")("while(r.pos<c){")("var t=r.uint32()")("if(t===e)")("break")("switch(t>>>3){");
      var i = 0;
      for (; i < /* initializes */
      mtype.fieldsArray.length; ++i) {
        var field = mtype._fieldsArray[i].resolve(), type = field.resolvedType instanceof Enum ? "int32" : field.type, ref = "m" + util.safeProp(field.name);
        gen("case %i: {", field.id);
        if (field.map) {
          gen("if(%s===util.emptyObject)", ref)("%s={}", ref)("var c2=r.uint32()+r.pos")("if(c2>r.len)")('throw RangeError("index out of range")')("r.len=c2");
          if (types.defaults[field.keyType] !== void 0) gen("k=%j", types.defaults[field.keyType]);
          else gen("k=null");
          if (types.defaults[type] !== void 0) gen("value=%j", types.defaults[type]);
          else gen("value=null");
          gen("while(r.pos<c2){")("var tag2=r.uint32()")("switch(tag2>>>3){")("case 1: k=r.%s(); break", field.keyType)("case 2:");
          if (types.basic[type] === void 0) gen("value=types[%i].decode(r,r.uint32(),undefined,n+1)", i);
          else gen("value=r.%s()", type);
          gen("break")("default:")("r.skipType(tag2&7,n)")("break")("}")("}")("if(r.pos!==c2)")('throw RangeError("index out of range")')("r.len=c");
          if (types.long[field.keyType] !== void 0) gen('%s[typeof k==="object"?util.longToHash(k):k]=value', ref);
          else {
            if (field.keyType === "string") gen('if(k==="__proto__")')("util.makeProp(%s,k)", ref);
            gen("%s[k]=value", ref);
          }
        } else if (field.repeated) {
          gen("if(!(%s&&%s.length))", ref, ref)("%s=[]", ref);
          if (types.packed[type] !== void 0) gen("if((t&7)===2){")("var c2=r.uint32()+r.pos")("if(c2>r.len)")('throw RangeError("index out of range")')("r.len=c2")("while(r.pos<c2)")("%s.push(r.%s())", ref, type)("if(r.pos!==c2)")('throw RangeError("index out of range")')("r.len=c")("}else");
          if (types.basic[type] === void 0) gen(field.delimited ? "%s.push(types[%i].decode(r,undefined,((t&~7)|4),n+1))" : "%s.push(types[%i].decode(r,r.uint32(),undefined,n+1))", ref, i);
          else gen("%s.push(r.%s())", ref, type);
        } else if (types.basic[type] === void 0) gen(field.delimited ? "%s=types[%i].decode(r,undefined,((t&~7)|4),n+1)" : "%s=types[%i].decode(r,r.uint32(),undefined,n+1)", ref, i);
        else gen("%s=r.%s()", ref, type);
        gen("break")("}");
      }
      gen("default:")("r.skipType(t&7,n)")("break")("}")("}");
      gen("if(l!==undefined){")("if(r.pos!==c)")('throw RangeError("index out of range")')("r.len=l")("}");
      for (i = 0; i < mtype._fieldsArray.length; ++i) {
        var rfield = mtype._fieldsArray[i];
        if (rfield.required) gen("if(!Object.hasOwnProperty.call(m,%j))", rfield.name)("throw util.ProtocolError(%j,{instance:m})", missing(rfield));
      }
      return gen("return m");
    }
  }
});

// node_modules/protobufjs/src/verifier.js
var require_verifier = __commonJS({
  "node_modules/protobufjs/src/verifier.js"(exports, module) {
    "use strict";
    module.exports = verifier;
    var Enum = require_enum();
    var util = require_util();
    function invalid(field, expected) {
      return field.name + ": " + expected + (field.repeated && expected !== "array" ? "[]" : field.map && expected !== "object" ? "{k:" + field.keyType + "}" : "") + " expected";
    }
    function genVerifyValue(gen, field, fieldIndex, ref) {
      if (field.resolvedType) {
        if (field.resolvedType instanceof Enum) {
          gen("switch(%s){", ref)("default:")("return%j", invalid(field, "enum value"));
          for (var keys = Object.keys(field.resolvedType.values), j = 0; j < keys.length; ++j) gen("case %i:", field.resolvedType.values[keys[j]]);
          gen("break")("}");
        } else {
          gen("{")("var e=types[%i].verify(%s,n+1);", fieldIndex, ref)("if(e)")("return%j+e", field.name + ".")("}");
        }
      } else {
        switch (field.type) {
          case "int32":
          case "uint32":
          case "sint32":
          case "fixed32":
          case "sfixed32":
            gen("if(!util.isInteger(%s))", ref)("return%j", invalid(field, "integer"));
            break;
          case "int64":
          case "uint64":
          case "sint64":
          case "fixed64":
          case "sfixed64":
            gen("if(!util.isInteger(%s)&&!(%s&&util.isInteger(%s.low)&&util.isInteger(%s.high)))", ref, ref, ref, ref)("return%j", invalid(field, "integer|Long"));
            break;
          case "float":
          case "double":
            gen('if(typeof %s!=="number")', ref)("return%j", invalid(field, "number"));
            break;
          case "bool":
            gen('if(typeof %s!=="boolean")', ref)("return%j", invalid(field, "boolean"));
            break;
          case "string":
            gen("if(!util.isString(%s))", ref)("return%j", invalid(field, "string"));
            break;
          case "bytes":
            gen('if(!(%s&&typeof %s.length==="number"||util.isString(%s)))', ref, ref, ref)("return%j", invalid(field, "buffer"));
            break;
        }
      }
      return gen;
    }
    function genVerifyKey(gen, field, ref) {
      switch (field.keyType) {
        case "int32":
        case "uint32":
        case "sint32":
        case "fixed32":
        case "sfixed32":
          gen("if(!util.key32Re.test(%s))", ref)("return%j", invalid(field, "integer key"));
          break;
        case "int64":
        case "uint64":
        case "sint64":
        case "fixed64":
        case "sfixed64":
          gen("if(!util.key64Re.test(%s))", ref)("return%j", invalid(field, "integer|Long key"));
          break;
        case "bool":
          gen("if(!util.key2Re.test(%s))", ref)("return%j", invalid(field, "boolean key"));
          break;
      }
      return gen;
    }
    function verifier(mtype) {
      var gen = util.codegen(["m", "n"], mtype.name + "$verify")('if(typeof m!=="object"||m===null)')("return%j", "object expected")("if(n===undefined)n=0")("if(n>util.recursionLimit)")("return%j", "maximum nesting depth exceeded");
      var oneofs = mtype.oneofsArray, seenFirstField = {};
      if (oneofs.length) gen("var p={}");
      for (var i = 0; i < /* initializes */
      mtype.fieldsArray.length; ++i) {
        var field = mtype._fieldsArray[i].resolve(), ref = "m" + util.safeProp(field.name);
        if (field.optional) gen("if(%s!=null&&Object.hasOwnProperty.call(m,%j)){", ref, field.name);
        if (field.map) {
          gen("if(!util.isObject(%s))", ref)("return%j", invalid(field, "object"))("var k=Object.keys(%s)", ref)("for(var i=0;i<k.length;++i){");
          genVerifyKey(gen, field, "k[i]");
          genVerifyValue(gen, field, i, ref + "[k[i]]")("}");
        } else if (field.repeated) {
          gen("if(!Array.isArray(%s))", ref)("return%j", invalid(field, "array"))("for(var i=0;i<%s.length;++i){", ref);
          genVerifyValue(gen, field, i, ref + "[i]")("}");
        } else {
          if (field.partOf) {
            var oneofProp = util.safeProp(field.partOf.name);
            if (seenFirstField[field.partOf.name] === 1) gen("if(p%s===1)", oneofProp)("return%j", field.partOf.name + ": multiple values");
            seenFirstField[field.partOf.name] = 1;
            gen("p%s=1", oneofProp);
          }
          genVerifyValue(gen, field, i, ref);
        }
        if (field.optional) gen("}");
      }
      return gen("return null");
    }
  }
});

// node_modules/protobufjs/src/converter.js
var require_converter = __commonJS({
  "node_modules/protobufjs/src/converter.js"(exports) {
    "use strict";
    var converter = exports;
    var Enum = require_enum();
    var util = require_util();
    function genValuePartial_fromObject(gen, field, fieldIndex, prop) {
      var defaultAlreadyEmitted = false;
      if (field.resolvedType) {
        if (field.resolvedType instanceof Enum) {
          gen("switch(d%s){", prop);
          for (var values = field.resolvedType.values, keys = Object.keys(values), i = 0; i < keys.length; ++i) {
            if (values[keys[i]] === field.typeDefault && !defaultAlreadyEmitted) {
              gen("default:")('if(typeof(d%s)==="number"){m%s=d%s;break}', prop, prop, prop);
              if (!field.repeated) gen("break");
              defaultAlreadyEmitted = true;
            }
            gen("case%j:", keys[i])("case %i:", values[keys[i]])("m%s=%j", prop, values[keys[i]])("break");
          }
          gen("}");
        } else gen("if(!util.isObject(d%s))", prop)("throw TypeError(%j)", field.fullName + ": object expected")("m%s=types[%i].fromObject(d%s,n+1)", prop, fieldIndex, prop);
      } else {
        var isUnsigned = false;
        switch (field.type) {
          case "double":
          case "float":
            gen("m%s=Number(d%s)", prop, prop);
            break;
          case "uint32":
          case "fixed32":
            gen("m%s=d%s>>>0", prop, prop);
            break;
          case "int32":
          case "sint32":
          case "sfixed32":
            gen("m%s=d%s|0", prop, prop);
            break;
          case "uint64":
          case "fixed64":
            isUnsigned = true;
          // eslint-disable-next-line no-fallthrough
          case "int64":
          case "sint64":
          case "sfixed64":
            gen("if(util.Long)")("m%s=util.Long.fromValue(d%s,%j)", prop, prop, isUnsigned)('else if(typeof d%s==="string")', prop)("m%s=parseInt(d%s,10)", prop, prop)('else if(typeof d%s==="number")', prop)("m%s=d%s", prop, prop)('else if(typeof d%s==="object")', prop)("m%s=new util.LongBits(d%s.low>>>0,d%s.high>>>0).toNumber(%s)", prop, prop, prop, isUnsigned ? "true" : "");
            break;
          case "bytes":
            gen('if(typeof d%s==="string")', prop)("util.base64.decode(d%s,m%s=util.newBuffer(util.base64.length(d%s)),0)", prop, prop, prop)("else if(d%s.length >= 0)", prop)("m%s=d%s", prop, prop);
            break;
          case "string":
            gen("m%s=String(d%s)", prop, prop);
            break;
          case "bool":
            gen("m%s=Boolean(d%s)", prop, prop);
            break;
        }
      }
      return gen;
    }
    converter.fromObject = function fromObject(mtype) {
      var fields = mtype.fieldsArray;
      var gen = util.codegen(["d", "n"], mtype.name + "$fromObject")("if(d instanceof this.ctor)")("return d");
      if (!fields.length) return gen("return new this.ctor");
      gen("if(!util.isObject(d))")("throw TypeError(%j)", mtype.fullName + ": object expected")("if(n===undefined)n=0")("if(n>util.recursionLimit)")('throw Error("maximum nesting depth exceeded")');
      gen("var m=new this.ctor");
      for (var i = 0; i < fields.length; ++i) {
        var field = fields[i].resolve(), prop = util.safeProp(field.name);
        if (field.map) {
          gen("if(d%s){", prop)("if(!util.isObject(d%s))", prop)("throw TypeError(%j)", field.fullName + ": object expected")("m%s={}", prop)("for(var ks=Object.keys(d%s),i=0;i<ks.length;++i){", prop);
          gen('if(ks[i]==="__proto__")')("util.makeProp(m%s,ks[i])", prop);
          genValuePartial_fromObject(
            gen,
            field,
            /* not sorted */
            i,
            prop + "[ks[i]]"
          )("}")("}");
        } else if (field.repeated) {
          gen("if(d%s){", prop)("if(!Array.isArray(d%s))", prop)("throw TypeError(%j)", field.fullName + ": array expected")("m%s=[]", prop)("for(var i=0;i<d%s.length;++i){", prop);
          genValuePartial_fromObject(
            gen,
            field,
            /* not sorted */
            i,
            prop + "[i]"
          )("}")("}");
        } else {
          if (!(field.resolvedType instanceof Enum)) gen("if(d%s!=null){", prop);
          genValuePartial_fromObject(
            gen,
            field,
            /* not sorted */
            i,
            prop
          );
          if (!(field.resolvedType instanceof Enum)) gen("}");
        }
      }
      return gen("return m");
    };
    function genValuePartial_toObject(gen, field, fieldIndex, prop) {
      if (field.resolvedType) {
        if (field.resolvedType instanceof Enum) gen("d%s=o.enums===String?(types[%i].values[m%s]===undefined?m%s:types[%i].values[m%s]):m%s", prop, fieldIndex, prop, prop, fieldIndex, prop, prop);
        else gen("d%s=types[%i].toObject(m%s,o,q+1)", prop, fieldIndex, prop);
      } else {
        var isUnsigned = false;
        switch (field.type) {
          case "double":
          case "float":
            gen("d%s=o.json&&!isFinite(m%s)?String(m%s):m%s", prop, prop, prop, prop);
            break;
          case "uint64":
          case "fixed64":
            isUnsigned = true;
          // eslint-disable-next-line no-fallthrough
          case "int64":
          case "sint64":
          case "sfixed64":
            gen('if(typeof BigInt!=="undefined"&&o.longs===BigInt)')('d%s=typeof m%s==="number"?BigInt(m%s):util.Long.fromBits(m%s.low>>>0,m%s.high>>>0,%j).toBigInt()', prop, prop, prop, prop, prop, isUnsigned)('else if(typeof m%s==="number")', prop)("d%s=o.longs===String?String(m%s):m%s", prop, prop, prop)("else")("d%s=o.longs===String?util.Long.prototype.toString.call(m%s):o.longs===Number?new util.LongBits(m%s.low>>>0,m%s.high>>>0).toNumber(%s):m%s", prop, prop, prop, prop, isUnsigned ? "true" : "", prop);
            break;
          case "bytes":
            gen("d%s=o.bytes===String?util.base64.encode(m%s,0,m%s.length):o.bytes===Array?Array.prototype.slice.call(m%s):m%s", prop, prop, prop, prop, prop);
            break;
          default:
            gen("d%s=m%s", prop, prop);
            break;
        }
      }
      return gen;
    }
    converter.toObject = function toObject(mtype) {
      var fields = mtype.fieldsArray.slice().sort(util.compareFieldsById);
      if (!fields.length)
        return util.codegen()("return {}");
      var gen = util.codegen(["m", "o", "q"], mtype.name + "$toObject")("if(!o)")("o={}")("if(q===undefined)q=0")("if(q>util.recursionLimit)")('throw Error("max depth exceeded")')("var d={}");
      var repeatedFields = [], mapFields = [], normalFields = [], i = 0;
      for (; i < fields.length; ++i)
        if (!fields[i].partOf)
          (fields[i].resolve().repeated ? repeatedFields : fields[i].map ? mapFields : normalFields).push(fields[i]);
      if (repeatedFields.length) {
        gen("if(o.arrays||o.defaults){");
        for (i = 0; i < repeatedFields.length; ++i) gen("d%s=[]", util.safeProp(repeatedFields[i].name));
        gen("}");
      }
      if (mapFields.length) {
        gen("if(o.objects||o.defaults){");
        for (i = 0; i < mapFields.length; ++i) gen("d%s={}", util.safeProp(mapFields[i].name));
        gen("}");
      }
      if (normalFields.length) {
        gen("if(o.defaults){");
        for (i = 0; i < normalFields.length; ++i) {
          var field = normalFields[i], prop = util.safeProp(field.name);
          if (field.resolvedType instanceof Enum) gen("d%s=o.enums===String?%j:%j", prop, field.resolvedType.valuesById[field.typeDefault], field.typeDefault);
          else if (field.long) gen("if(util.Long){")("var n=new util.Long(%i,%i,%j)", field.typeDefault.low, field.typeDefault.high, field.typeDefault.unsigned)('d%s=o.longs===String?n.toString():o.longs===Number?n.toNumber():typeof BigInt!=="undefined"&&o.longs===BigInt?n.toBigInt():n', prop)("}else")('d%s=o.longs===String?%j:typeof BigInt!=="undefined"&&o.longs===BigInt?BigInt(%j):%i', prop, field.typeDefault.toString(), field.typeDefault.toString(), field.typeDefault.toNumber());
          else if (field.bytes) {
            var arrayDefault = Array.prototype.slice.call(field.typeDefault);
            gen("if(o.bytes===String)d%s=%j", prop, String.fromCharCode.apply(String, field.typeDefault))("else{")("d%s=%j", prop, arrayDefault)("if(o.bytes!==Array)d%s=util.newBuffer(d%s)", prop, prop)("}");
          } else gen("d%s=%j", prop, field.typeDefault);
        }
        gen("}");
      }
      var hasKs2 = false;
      for (i = 0; i < fields.length; ++i) {
        var field = fields[i], index = mtype._fieldsArray.indexOf(field), prop = util.safeProp(field.name);
        if (field.map) {
          if (!hasKs2) {
            hasKs2 = true;
            gen("var ks2");
          }
          gen("if(m%s&&(ks2=Object.keys(m%s)).length){", prop, prop)("d%s={}", prop)("for(var j=0;j<ks2.length;++j){");
          gen('if(ks2[j]==="__proto__")')("util.makeProp(d%s,ks2[j])", prop);
          genValuePartial_toObject(
            gen,
            field,
            /* sorted */
            index,
            prop + "[ks2[j]]"
          )("}");
        } else if (field.repeated) {
          gen("if(m%s&&m%s.length){", prop, prop)("d%s=[]", prop)("for(var j=0;j<m%s.length;++j){", prop);
          genValuePartial_toObject(
            gen,
            field,
            /* sorted */
            index,
            prop + "[j]"
          )("}");
        } else {
          gen("if(m%s!=null&&Object.hasOwnProperty.call(m,%j)){", prop, field.name);
          genValuePartial_toObject(
            gen,
            field,
            /* sorted */
            index,
            prop
          );
          if (field.partOf) gen("if(o.oneofs)")("d%s=%j", util.safeProp(field.partOf.name), field.name);
        }
        gen("}");
      }
      return gen("return d");
    };
  }
});

// node_modules/protobufjs/src/wrappers.js
var require_wrappers = __commonJS({
  "node_modules/protobufjs/src/wrappers.js"(exports) {
    "use strict";
    var wrappers = exports;
    var Message = require_message();
    var util = require_minimal();
    wrappers[".google.protobuf.Any"] = {
      fromObject: function(object, depth) {
        if (depth === void 0)
          depth = 0;
        if (depth > util.recursionLimit)
          throw Error("max depth exceeded");
        if (object && object["@type"]) {
          var name14 = object["@type"].substring(object["@type"].lastIndexOf("/") + 1);
          var type = this.lookup(name14);
          if (type) {
            var type_url = object["@type"].charAt(0) === "." ? object["@type"].slice(1) : object["@type"];
            if (type_url.indexOf("/") === -1) {
              type_url = "/" + type_url;
            }
            return this.create({
              type_url,
              value: type.encode(type.fromObject(object, depth + 1)).finish()
            });
          }
        }
        return this.fromObject(object, depth);
      },
      toObject: function(message, options, depth) {
        if (depth === void 0)
          depth = 0;
        if (depth > util.recursionLimit)
          throw Error("max depth exceeded");
        var googleApi = "type.googleapis.com/";
        var prefix = "";
        var name14 = "";
        if (options && options.json && message.type_url && message.value) {
          name14 = message.type_url.substring(message.type_url.lastIndexOf("/") + 1);
          prefix = message.type_url.substring(0, message.type_url.lastIndexOf("/") + 1);
          var type = this.lookup(name14);
          if (type)
            message = type.decode(message.value, void 0, void 0, depth + 1);
        }
        if (!(message instanceof this.ctor) && message instanceof Message) {
          var object = message.$type.toObject(message, options, depth + 1);
          var messageName = message.$type.fullName[0] === "." ? message.$type.fullName.slice(1) : message.$type.fullName;
          if (prefix === "") {
            prefix = googleApi;
          }
          name14 = prefix + messageName;
          object["@type"] = name14;
          return object;
        }
        return this.toObject(message, options, depth);
      }
    };
  }
});

// node_modules/protobufjs/src/type.js
var require_type = __commonJS({
  "node_modules/protobufjs/src/type.js"(exports, module) {
    "use strict";
    module.exports = Type;
    var Namespace = require_namespace();
    ((Type.prototype = Object.create(Namespace.prototype)).constructor = Type).className = "Type";
    var Enum = require_enum();
    var OneOf = require_oneof();
    var Field = require_field();
    var MapField = require_mapfield();
    var Service = require_service2();
    var Message = require_message();
    var Reader = require_reader();
    var Writer = require_writer();
    var util = require_util();
    var encoder = require_encoder();
    var decoder = require_decoder();
    var verifier = require_verifier();
    var converter = require_converter();
    var wrappers = require_wrappers();
    function Type(name14, options) {
      name14 = name14.replace(/\W/g, "");
      Namespace.call(this, name14, options);
      this.fields = {};
      this.oneofs = void 0;
      this.extensions = void 0;
      this.reserved = void 0;
      this.group = void 0;
      this._fieldsById = null;
      this._fieldsArray = null;
      this._oneofsArray = null;
      this._ctor = null;
    }
    Object.defineProperties(Type.prototype, {
      /**
       * Message fields by id.
       * @name Type#fieldsById
       * @type {Object.<number,Field>}
       * @readonly
       */
      fieldsById: {
        get: function() {
          if (this._fieldsById)
            return this._fieldsById;
          this._fieldsById = {};
          for (var names = Object.keys(this.fields), i = 0; i < names.length; ++i) {
            var field = this.fields[names[i]], id = field.id;
            if (this._fieldsById[id])
              throw Error("duplicate id " + id + " in " + this);
            this._fieldsById[id] = field;
          }
          return this._fieldsById;
        }
      },
      /**
       * Fields of this message as an array for iteration.
       * @name Type#fieldsArray
       * @type {Field[]}
       * @readonly
       */
      fieldsArray: {
        get: function() {
          return this._fieldsArray || (this._fieldsArray = util.toArray(this.fields));
        }
      },
      /**
       * Oneofs of this message as an array for iteration.
       * @name Type#oneofsArray
       * @type {OneOf[]}
       * @readonly
       */
      oneofsArray: {
        get: function() {
          return this._oneofsArray || (this._oneofsArray = util.toArray(this.oneofs));
        }
      },
      /**
       * The registered constructor, if any registered, otherwise a generic constructor.
       * Assigning a function replaces the internal constructor. If the function does not extend {@link Message} yet, its prototype will be setup accordingly and static methods will be populated. If it already extends {@link Message}, it will just replace the internal constructor.
       * @name Type#ctor
       * @type {Constructor<{}>}
       */
      ctor: {
        get: function() {
          return this._ctor || (this.ctor = Type.generateConstructor(this)());
        },
        set: function(ctor) {
          var prototype = ctor.prototype;
          if (!(prototype instanceof Message)) {
            (ctor.prototype = new Message()).constructor = ctor;
            util.merge(ctor.prototype, prototype);
          }
          ctor.$type = ctor.prototype.$type = this;
          util.merge(ctor, Message, true);
          this._ctor = ctor;
          var i = 0;
          for (; i < /* initializes */
          this.fieldsArray.length; ++i)
            this._fieldsArray[i].resolve();
          var ctorProperties = {};
          for (i = 0; i < /* initializes */
          this.oneofsArray.length; ++i)
            ctorProperties[this._oneofsArray[i].resolve().name] = {
              get: util.oneOfGetter(this._oneofsArray[i].oneof),
              set: util.oneOfSetter(this._oneofsArray[i].oneof)
            };
          if (i)
            Object.defineProperties(ctor.prototype, ctorProperties);
        }
      }
    });
    Type.generateConstructor = function generateConstructor(mtype) {
      var gen = util.codegen(["p"], mtype.name);
      for (var i = 0, field; i < mtype.fieldsArray.length; ++i)
        if ((field = mtype._fieldsArray[i]).map) gen("this%s={}", util.safeProp(field.name));
        else if (field.repeated) gen("this%s=[]", util.safeProp(field.name));
      return gen('if(p)for(var ks=Object.keys(p),i=0;i<ks.length;++i)if(p[ks[i]]!=null&&ks[i]!=="__proto__")')("this[ks[i]]=p[ks[i]]");
    };
    function clearCache(type) {
      type._fieldsById = type._fieldsArray = type._oneofsArray = null;
      delete type.encode;
      delete type.decode;
      delete type.verify;
      return type;
    }
    Type.fromJSON = function fromJSON(name14, json, depth) {
      if (depth === void 0)
        depth = 0;
      if (depth > util.nestingLimit)
        throw Error("max depth exceeded");
      var type = new Type(name14, json.options);
      type.extensions = json.extensions;
      type.reserved = json.reserved;
      var names = Object.keys(json.fields), i = 0;
      for (; i < names.length; ++i)
        type.add(
          (typeof json.fields[names[i]].keyType !== "undefined" ? MapField.fromJSON : Field.fromJSON)(names[i], json.fields[names[i]])
        );
      if (json.oneofs)
        for (names = Object.keys(json.oneofs), i = 0; i < names.length; ++i)
          type.add(OneOf.fromJSON(names[i], json.oneofs[names[i]]));
      if (json.nested)
        for (names = Object.keys(json.nested), i = 0; i < names.length; ++i) {
          var nested = json.nested[names[i]];
          type.add(
            // most to least likely
            (nested.id !== void 0 ? Field.fromJSON : nested.fields !== void 0 ? Type.fromJSON : nested.values !== void 0 ? Enum.fromJSON : nested.methods !== void 0 ? Service.fromJSON : Namespace.fromJSON)(names[i], nested, depth + 1)
          );
        }
      if (json.extensions && json.extensions.length)
        type.extensions = json.extensions;
      if (json.reserved && json.reserved.length)
        type.reserved = json.reserved;
      if (json.group)
        type.group = true;
      if (json.comment)
        type.comment = json.comment;
      if (json.edition)
        type._edition = json.edition;
      type._defaultEdition = "proto3";
      return type;
    };
    Type.prototype.toJSON = function toJSON(toJSONOptions) {
      var inherited = Namespace.prototype.toJSON.call(this, toJSONOptions);
      var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
      return util.toObject([
        "edition",
        this._editionToJSON(),
        "options",
        inherited && inherited.options || void 0,
        "oneofs",
        Namespace.arrayToJSON(this.oneofsArray, toJSONOptions),
        "fields",
        Namespace.arrayToJSON(this.fieldsArray.filter(function(obj) {
          return !obj.declaringField;
        }), toJSONOptions) || {},
        "extensions",
        this.extensions && this.extensions.length ? this.extensions : void 0,
        "reserved",
        this.reserved && this.reserved.length ? this.reserved : void 0,
        "group",
        this.group || void 0,
        "nested",
        inherited && inherited.nested || void 0,
        "comment",
        keepComments ? this.comment : void 0
      ]);
    };
    Type.prototype.resolveAll = function resolveAll() {
      if (!this._needsRecursiveResolve) return this;
      Namespace.prototype.resolveAll.call(this);
      var oneofs = this.oneofsArray;
      i = 0;
      while (i < oneofs.length)
        oneofs[i++].resolve();
      var fields = this.fieldsArray, i = 0;
      while (i < fields.length)
        fields[i++].resolve();
      return this;
    };
    Type.prototype._resolveFeaturesRecursive = function _resolveFeaturesRecursive(edition) {
      if (!this._needsRecursiveFeatureResolution) return this;
      edition = this._edition || edition;
      Namespace.prototype._resolveFeaturesRecursive.call(this, edition);
      this.oneofsArray.forEach((oneof) => {
        oneof._resolveFeatures(edition);
      });
      this.fieldsArray.forEach((field) => {
        field._resolveFeatures(edition);
      });
      return this;
    };
    Type.prototype.get = function get(name14) {
      if (Object.prototype.hasOwnProperty.call(this.fields, name14))
        return this.fields[name14];
      if (this.oneofs && Object.prototype.hasOwnProperty.call(this.oneofs, name14))
        return this.oneofs[name14];
      if (this.nested && Object.prototype.hasOwnProperty.call(this.nested, name14))
        return this.nested[name14];
      return null;
    };
    Type.prototype.add = function add(object) {
      if (this.get(object.name))
        throw Error("duplicate name '" + object.name + "' in " + this);
      if (object instanceof Field && object.extend === void 0) {
        if (this._fieldsById ? (
          /* istanbul ignore next */
          this._fieldsById[object.id]
        ) : this.fieldsById[object.id])
          throw Error("duplicate id " + object.id + " in " + this);
        if (this.isReservedId(object.id))
          throw Error("id " + object.id + " is reserved in " + this);
        if (this.isReservedName(object.name) || object.name.charAt(0) === "$")
          throw Error("name '" + object.name + "' is reserved in " + this);
        if (object.name === "__proto__")
          return this;
        if (object.parent)
          object.parent.remove(object);
        this.fields[object.name] = object;
        object.message = this;
        object.onAdd(this);
        return clearCache(this);
      }
      if (object instanceof OneOf) {
        if (object.name.charAt(0) === "$")
          throw Error("name '" + object.name + "' is reserved in " + this);
        if (object.name === "__proto__")
          return this;
        if (!this.oneofs)
          this.oneofs = {};
        this.oneofs[object.name] = object;
        object.onAdd(this);
        return clearCache(this);
      }
      return Namespace.prototype.add.call(this, object);
    };
    Type.prototype.remove = function remove(object) {
      if (object instanceof Field && object.extend === void 0) {
        if (!this.fields || this.fields[object.name] !== object)
          throw Error(object + " is not a member of " + this);
        delete this.fields[object.name];
        object.parent = null;
        object.onRemove(this);
        return clearCache(this);
      }
      if (object instanceof OneOf) {
        if (!this.oneofs || this.oneofs[object.name] !== object)
          throw Error(object + " is not a member of " + this);
        delete this.oneofs[object.name];
        object.parent = null;
        object.onRemove(this);
        return clearCache(this);
      }
      return Namespace.prototype.remove.call(this, object);
    };
    Type.prototype.isReservedId = function isReservedId(id) {
      return Namespace.isReservedId(this.reserved, id);
    };
    Type.prototype.isReservedName = function isReservedName(name14) {
      return Namespace.isReservedName(this.reserved, name14);
    };
    Type.prototype.create = function create(properties) {
      return new this.ctor(properties);
    };
    Type.prototype.setup = function setup() {
      var fullName = this.fullName, types = [];
      for (var i = 0; i < /* initializes */
      this.fieldsArray.length; ++i)
        types.push(this._fieldsArray[i].resolve().resolvedType);
      this.encode = encoder(this)({
        Writer,
        types,
        util
      });
      this.decode = decoder(this)({
        Reader,
        types,
        util
      });
      this.verify = verifier(this)({
        types,
        util
      });
      this.fromObject = converter.fromObject(this)({
        types,
        util
      });
      this.toObject = converter.toObject(this)({
        types,
        util
      });
      var wrapper = wrappers[fullName];
      if (wrapper) {
        var originalThis = Object.create(this);
        originalThis.fromObject = this.fromObject;
        this.fromObject = wrapper.fromObject.bind(originalThis);
        originalThis.toObject = this.toObject;
        this.toObject = wrapper.toObject.bind(originalThis);
      }
      return this;
    };
    Type.prototype.encode = function encode_setup(message, writer) {
      return this.setup().encode.apply(this, arguments);
    };
    Type.prototype.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
    };
    Type.prototype.decode = function decode_setup(reader, length, end, depth) {
      return this.setup().decode(reader, length, end, depth);
    };
    Type.prototype.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof Reader))
        reader = Reader.create(reader);
      return this.decode(reader, reader.uint32());
    };
    Type.prototype.verify = function verify_setup(message, depth) {
      return this.setup().verify(message, depth);
    };
    Type.prototype.fromObject = function fromObject(object, depth) {
      return this.setup().fromObject(object, depth);
    };
    Type.prototype.toObject = function toObject(message, options) {
      return this.setup().toObject.apply(this, arguments);
    };
    Type.d = function decorateType(typeName) {
      return function typeDecorator(target) {
        util.decorateType(target, typeName);
      };
    };
  }
});

// node_modules/protobufjs/src/root.js
var require_root = __commonJS({
  "node_modules/protobufjs/src/root.js"(exports, module) {
    "use strict";
    module.exports = Root;
    var Namespace = require_namespace();
    ((Root.prototype = Object.create(Namespace.prototype)).constructor = Root).className = "Root";
    var Field = require_field();
    var Enum = require_enum();
    var OneOf = require_oneof();
    var util = require_util();
    var Type;
    var parse;
    var common;
    function Root(options) {
      Namespace.call(this, "", options);
      this.deferred = [];
      this.files = [];
      this._edition = "proto2";
      this._fullyQualifiedObjects = {};
    }
    Root.fromJSON = function fromJSON(json, root, depth) {
      depth = util.checkDepth(depth);
      if (!root)
        root = new Root();
      if (json.options)
        root.setOptions(json.options);
      return root.addJSON(json.nested, depth).resolveAll();
    };
    Root.prototype.resolvePath = util.path.resolve;
    Root.prototype.fetch = util.fetch;
    function SYNC() {
    }
    Root.prototype.load = function load(filename, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = void 0;
      }
      var self2 = this;
      if (!callback) {
        return util.asPromise(load, self2, filename, options);
      }
      var sync = callback === SYNC;
      function finish(err, root) {
        if (!callback) {
          return;
        }
        if (sync) {
          throw err;
        }
        if (root) {
          root.resolveAll();
        }
        var cb = callback;
        callback = null;
        cb(err, root);
      }
      function getBundledFileName(filename2) {
        var idx = filename2.lastIndexOf("google/protobuf/");
        if (idx > -1) {
          var altname = filename2.substring(idx);
          if (altname in common) return altname;
        }
        return null;
      }
      function process3(filename2, source, depth) {
        if (depth === void 0)
          depth = 0;
        try {
          if (depth > util.recursionLimit)
            throw Error("max depth exceeded");
          if (util.isString(source) && source.charAt(0) === "{")
            source = JSON.parse(source);
          if (!util.isString(source))
            self2.setOptions(source.options).addJSON(source.nested);
          else {
            parse.filename = filename2;
            var parsed = parse(source, self2, options), resolved2, i2 = 0;
            if (parsed.imports) {
              for (; i2 < parsed.imports.length; ++i2)
                if (resolved2 = getBundledFileName(parsed.imports[i2]) || self2.resolvePath(filename2, parsed.imports[i2]))
                  fetch2(resolved2, false, depth + 1);
            }
            if (parsed.weakImports) {
              for (i2 = 0; i2 < parsed.weakImports.length; ++i2)
                if (resolved2 = getBundledFileName(parsed.weakImports[i2]) || self2.resolvePath(filename2, parsed.weakImports[i2]))
                  fetch2(resolved2, true, depth + 1);
            }
          }
        } catch (err) {
          finish(err);
        }
        if (!sync && !queued) {
          finish(null, self2);
        }
      }
      function fetch2(filename2, weak, depth) {
        if (depth === void 0)
          depth = 0;
        filename2 = getBundledFileName(filename2) || filename2;
        if (self2.files.indexOf(filename2) > -1) {
          return;
        }
        self2.files.push(filename2);
        if (filename2 in common) {
          if (sync) {
            process3(filename2, common[filename2], depth);
          } else {
            ++queued;
            setTimeout(function() {
              --queued;
              process3(filename2, common[filename2], depth);
            });
          }
          return;
        }
        if (sync) {
          var source;
          try {
            source = util.fs.readFileSync(filename2).toString("utf8");
          } catch (err) {
            if (!weak)
              finish(err);
            return;
          }
          process3(filename2, source, depth);
        } else {
          ++queued;
          self2.fetch(filename2, function(err, source2) {
            --queued;
            if (!callback) {
              return;
            }
            if (err) {
              if (!weak)
                finish(err);
              else if (!queued)
                finish(null, self2);
              return;
            }
            process3(filename2, source2, depth);
          });
        }
      }
      var queued = 0;
      if (util.isString(filename)) {
        filename = [filename];
      }
      for (var i = 0, resolved; i < filename.length; ++i)
        if (resolved = self2.resolvePath("", filename[i]))
          fetch2(resolved);
      if (sync) {
        self2.resolveAll();
        return self2;
      }
      if (!queued) {
        finish(null, self2);
      }
      return self2;
    };
    Root.prototype.loadSync = function loadSync(filename, options) {
      if (!util.isNode)
        throw Error("not supported");
      return this.load(filename, options, SYNC);
    };
    Root.prototype.resolveAll = function resolveAll() {
      if (!this._needsRecursiveResolve) return this;
      if (this.deferred.length)
        throw Error("unresolvable extensions: " + this.deferred.map(function(field) {
          return "'extend " + field.extend + "' in " + field.parent.fullName;
        }).join(", "));
      return Namespace.prototype.resolveAll.call(this);
    };
    var exposeRe = /^[A-Z]/;
    function tryHandleExtension(root, field) {
      var extendedType = field.parent.lookup(field.extend);
      if (extendedType) {
        var sisterField = new Field(field.fullName, field.id, field.type, field.rule, void 0, field.options);
        if (extendedType.get(sisterField.name)) {
          return true;
        }
        sisterField.declaringField = field;
        field.extensionField = sisterField;
        extendedType.add(sisterField);
        return true;
      }
      return false;
    }
    Root.prototype._handleAdd = function _handleAdd(object) {
      if (object instanceof Field) {
        if (
          /* an extension field (implies not part of a oneof) */
          object.extend !== void 0 && /* not already handled */
          !object.extensionField
        ) {
          if (!tryHandleExtension(this, object))
            this.deferred.push(object);
        }
      } else if (object instanceof Enum) {
        if (exposeRe.test(object.name))
          object.parent[object.name] = object.values;
      } else if (!(object instanceof OneOf)) {
        if (object instanceof Type)
          for (var i = 0; i < this.deferred.length; )
            if (tryHandleExtension(this, this.deferred[i]))
              this.deferred.splice(i, 1);
            else
              ++i;
        for (var j = 0; j < /* initializes */
        object.nestedArray.length; ++j)
          this._handleAdd(object._nestedArray[j]);
        if (exposeRe.test(object.name))
          object.parent[object.name] = object;
      }
      if (object instanceof Type || object instanceof Enum || object instanceof Field) {
        this._fullyQualifiedObjects[object.fullName] = object;
      }
    };
    Root.prototype._handleRemove = function _handleRemove(object) {
      if (object instanceof Field) {
        if (
          /* an extension field */
          object.extend !== void 0
        ) {
          if (
            /* already handled */
            object.extensionField
          ) {
            object.extensionField.parent.remove(object.extensionField);
            object.extensionField = null;
          } else {
            var index = this.deferred.indexOf(object);
            if (index > -1)
              this.deferred.splice(index, 1);
          }
        }
      } else if (object instanceof Enum) {
        if (exposeRe.test(object.name))
          delete object.parent[object.name];
      } else if (object instanceof Namespace) {
        for (var i = 0; i < /* initializes */
        object.nestedArray.length; ++i)
          this._handleRemove(object._nestedArray[i]);
        if (exposeRe.test(object.name))
          delete object.parent[object.name];
      }
      delete this._fullyQualifiedObjects[object.fullName];
    };
    Root._configure = function(Type_, parse_, common_) {
      Type = Type_;
      parse = parse_;
      common = common_;
    };
  }
});

// node_modules/protobufjs/src/util.js
var require_util = __commonJS({
  "node_modules/protobufjs/src/util.js"(exports, module) {
    "use strict";
    var util = module.exports = require_minimal();
    var roots = require_roots();
    var Type;
    var Enum;
    util.codegen = require_codegen();
    util.fetch = require_fetch();
    util.path = require_path();
    util.patterns = require_patterns();
    var reservedRe = util.patterns.reservedRe;
    util.fs = require_fs2();
    util.checkDepth = function checkDepth(depth) {
      if (depth === void 0)
        depth = 0;
      if (depth > util.recursionLimit)
        throw Error("max depth exceeded");
      return depth;
    };
    util.toArray = function toArray(object) {
      if (object) {
        var keys = Object.keys(object), array = new Array(keys.length), index = 0;
        while (index < keys.length)
          array[index] = object[keys[index++]];
        return array;
      }
      return [];
    };
    util.toObject = function toObject(array) {
      var object = {}, index = 0;
      while (index < array.length) {
        var key = array[index++], val = array[index++];
        if (val !== void 0)
          object[key] = val;
      }
      return object;
    };
    util.isReserved = function isReserved(name14) {
      return reservedRe.test(name14);
    };
    util.safeProp = function safeProp(prop) {
      if (!/^[$\w_]+$/.test(prop) || reservedRe.test(prop))
        return "[" + JSON.stringify(prop) + "]";
      return "." + prop;
    };
    util.ucFirst = function ucFirst(str7) {
      return str7.charAt(0).toUpperCase() + str7.substring(1);
    };
    var camelCaseRe = /_([a-z])/g;
    util.camelCase = function camelCase(str7) {
      return str7.substring(0, 1) + str7.substring(1).replace(camelCaseRe, function($0, $1) {
        return $1.toUpperCase();
      });
    };
    util.compareFieldsById = function compareFieldsById(a, b) {
      return a.id - b.id;
    };
    util.decorateType = function decorateType(ctor, typeName) {
      if (ctor.$type) {
        if (typeName && ctor.$type.name !== typeName) {
          util.decorateRoot.remove(ctor.$type);
          ctor.$type.name = typeName;
          util.decorateRoot.add(ctor.$type);
        }
        return ctor.$type;
      }
      if (!Type)
        Type = require_type();
      var type = new Type(typeName || ctor.name);
      util.decorateRoot.add(type);
      type.ctor = ctor;
      Object.defineProperty(ctor, "$type", { value: type, enumerable: false });
      Object.defineProperty(ctor.prototype, "$type", { value: type, enumerable: false });
      return type;
    };
    var decorateEnumIndex = 0;
    util.decorateEnum = function decorateEnum(object) {
      if (object.$type)
        return object.$type;
      if (!Enum)
        Enum = require_enum();
      var enm = new Enum("Enum" + decorateEnumIndex++, object);
      util.decorateRoot.add(enm);
      Object.defineProperty(object, "$type", { value: enm, enumerable: false });
      return enm;
    };
    util.setProperty = function setProperty(dst, path25, value, ifNotSet) {
      function setProp(dst2, path26, value2) {
        var part = path26.shift();
        if (util.isUnsafeProperty(part))
          return dst2;
        if (path26.length > 0) {
          dst2[part] = setProp(dst2[part] || {}, path26, value2);
        } else {
          var prevValue = dst2[part];
          if (prevValue && ifNotSet)
            return dst2;
          if (prevValue)
            value2 = [].concat(prevValue).concat(value2);
          dst2[part] = value2;
        }
        return dst2;
      }
      if (typeof dst !== "object")
        throw TypeError("dst must be an object");
      if (!path25)
        throw TypeError("path must be specified");
      path25 = path25.split(".");
      if (path25.length > util.recursionLimit)
        throw Error("max depth exceeded");
      return setProp(dst, path25, value);
    };
    Object.defineProperty(util, "decorateRoot", {
      get: function() {
        return roots["decorated"] || (roots["decorated"] = new (require_root())());
      }
    });
  }
});

// node_modules/protobufjs/src/types.js
var require_types = __commonJS({
  "node_modules/protobufjs/src/types.js"(exports) {
    "use strict";
    var types = exports;
    var util = require_util();
    var s = [
      "double",
      // 0
      "float",
      // 1
      "int32",
      // 2
      "uint32",
      // 3
      "sint32",
      // 4
      "fixed32",
      // 5
      "sfixed32",
      // 6
      "int64",
      // 7
      "uint64",
      // 8
      "sint64",
      // 9
      "fixed64",
      // 10
      "sfixed64",
      // 11
      "bool",
      // 12
      "string",
      // 13
      "bytes"
      // 14
    ];
    function bake(values, offset) {
      var i = 0, o = /* @__PURE__ */ Object.create(null);
      offset |= 0;
      while (i < values.length) o[s[i + offset]] = values[i++];
      return o;
    }
    types.basic = bake([
      /* double   */
      1,
      /* float    */
      5,
      /* int32    */
      0,
      /* uint32   */
      0,
      /* sint32   */
      0,
      /* fixed32  */
      5,
      /* sfixed32 */
      5,
      /* int64    */
      0,
      /* uint64   */
      0,
      /* sint64   */
      0,
      /* fixed64  */
      1,
      /* sfixed64 */
      1,
      /* bool     */
      0,
      /* string   */
      2,
      /* bytes    */
      2
    ]);
    types.defaults = bake([
      /* double   */
      0,
      /* float    */
      0,
      /* int32    */
      0,
      /* uint32   */
      0,
      /* sint32   */
      0,
      /* fixed32  */
      0,
      /* sfixed32 */
      0,
      /* int64    */
      0,
      /* uint64   */
      0,
      /* sint64   */
      0,
      /* fixed64  */
      0,
      /* sfixed64 */
      0,
      /* bool     */
      false,
      /* string   */
      "",
      /* bytes    */
      util.emptyArray,
      /* message  */
      null
    ]);
    types.long = bake([
      /* int64    */
      0,
      /* uint64   */
      0,
      /* sint64   */
      0,
      /* fixed64  */
      1,
      /* sfixed64 */
      1
    ], 7);
    types.mapKey = bake([
      /* int32    */
      0,
      /* uint32   */
      0,
      /* sint32   */
      0,
      /* fixed32  */
      5,
      /* sfixed32 */
      5,
      /* int64    */
      0,
      /* uint64   */
      0,
      /* sint64   */
      0,
      /* fixed64  */
      1,
      /* sfixed64 */
      1,
      /* bool     */
      0,
      /* string   */
      2
    ], 2);
    types.packed = bake([
      /* double   */
      1,
      /* float    */
      5,
      /* int32    */
      0,
      /* uint32   */
      0,
      /* sint32   */
      0,
      /* fixed32  */
      5,
      /* sfixed32 */
      5,
      /* int64    */
      0,
      /* uint64   */
      0,
      /* sint64   */
      0,
      /* fixed64  */
      1,
      /* sfixed64 */
      1,
      /* bool     */
      0
    ]);
  }
});

// node_modules/protobufjs/src/field.js
var require_field = __commonJS({
  "node_modules/protobufjs/src/field.js"(exports, module) {
    "use strict";
    module.exports = Field;
    var ReflectionObject = require_object();
    ((Field.prototype = Object.create(ReflectionObject.prototype)).constructor = Field).className = "Field";
    var Enum = require_enum();
    var types = require_types();
    var util = require_util();
    var Type;
    var ruleRe = /^required|optional|repeated$/;
    Field.fromJSON = function fromJSON(name14, json) {
      var field = new Field(name14, json.id, json.type, json.rule, json.extend, json.options, json.comment);
      if (json.edition)
        field._edition = json.edition;
      field._defaultEdition = "proto3";
      return field;
    };
    function Field(name14, id, type, rule, extend, options, comment) {
      if (util.isObject(rule)) {
        comment = extend;
        options = rule;
        rule = extend = void 0;
      } else if (util.isObject(extend)) {
        comment = options;
        options = extend;
        extend = void 0;
      }
      ReflectionObject.call(this, name14, options);
      if (!util.isInteger(id) || id < 0)
        throw TypeError("id must be a non-negative integer");
      if (!util.isString(type))
        throw TypeError("type must be a string");
      if (rule !== void 0 && !ruleRe.test(rule = rule.toString().toLowerCase()))
        throw TypeError("rule must be a string rule");
      if (extend !== void 0 && !util.isString(extend))
        throw TypeError("extend must be a string");
      if (rule === "proto3_optional") {
        rule = "optional";
      }
      this.rule = rule && rule !== "optional" ? rule : void 0;
      this.type = type;
      this.id = id;
      this.extend = extend || void 0;
      this.repeated = rule === "repeated";
      this.map = false;
      this.message = null;
      this.partOf = null;
      this.typeDefault = null;
      this.defaultValue = null;
      this.long = util.Long ? types.long[type] !== void 0 : (
        /* istanbul ignore next */
        false
      );
      this.bytes = type === "bytes";
      this.resolvedType = null;
      this.extensionField = null;
      this.declaringField = null;
      this.comment = comment;
    }
    Object.defineProperty(Field.prototype, "required", {
      get: function() {
        return this._features.field_presence === "LEGACY_REQUIRED";
      }
    });
    Object.defineProperty(Field.prototype, "optional", {
      get: function() {
        return !this.required;
      }
    });
    Object.defineProperty(Field.prototype, "delimited", {
      get: function() {
        return this.resolvedType instanceof Type && this._features.message_encoding === "DELIMITED";
      }
    });
    Object.defineProperty(Field.prototype, "packed", {
      get: function() {
        return this._features.repeated_field_encoding === "PACKED";
      }
    });
    Object.defineProperty(Field.prototype, "hasPresence", {
      get: function() {
        if (this.repeated || this.map) {
          return false;
        }
        return this.partOf || // oneofs
        this.declaringField || this.extensionField || // extensions
        this._features.field_presence !== "IMPLICIT";
      }
    });
    Field.prototype.setOption = function setOption(name14, value, ifNotSet) {
      return ReflectionObject.prototype.setOption.call(this, name14, value, ifNotSet);
    };
    Field.prototype.toJSON = function toJSON(toJSONOptions) {
      var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
      return util.toObject([
        "edition",
        this._editionToJSON(),
        "rule",
        this.rule !== "optional" && this.rule || void 0,
        "type",
        this.type,
        "id",
        this.id,
        "extend",
        this.extend,
        "options",
        this.options,
        "comment",
        keepComments ? this.comment : void 0
      ]);
    };
    Field.prototype.resolve = function resolve2() {
      if (this.resolved)
        return this;
      if ((this.typeDefault = types.defaults[this.type]) === void 0) {
        this.resolvedType = (this.declaringField ? this.declaringField.parent : this.parent).lookupTypeOrEnum(this.type);
        if (this.resolvedType instanceof Type)
          this.typeDefault = null;
        else
          this.typeDefault = this.resolvedType.values[Object.keys(this.resolvedType.values)[0]];
      } else if (this.options && this.options.proto3_optional) {
        this.typeDefault = null;
      }
      if (this.options && this.options["default"] != null) {
        this.typeDefault = this.options["default"];
        if (this.resolvedType instanceof Enum && typeof this.typeDefault === "string")
          this.typeDefault = this.resolvedType.values[this.typeDefault];
      }
      if (this.options) {
        if (this.options.packed !== void 0 && this.resolvedType && !(this.resolvedType instanceof Enum))
          delete this.options.packed;
        if (!Object.keys(this.options).length)
          this.options = void 0;
      }
      if (this.long) {
        this.typeDefault = util.Long.fromNumber(this.typeDefault, this.type === "uint64" || this.type === "fixed64");
        if (Object.freeze)
          Object.freeze(this.typeDefault);
      } else if (this.bytes && typeof this.typeDefault === "string") {
        var buf;
        if (util.base64.test(this.typeDefault))
          util.base64.decode(this.typeDefault, buf = util.newBuffer(util.base64.length(this.typeDefault)), 0);
        else
          util.utf8.write(this.typeDefault, buf = util.newBuffer(util.utf8.length(this.typeDefault)), 0);
        this.typeDefault = buf;
      }
      if (this.map)
        this.defaultValue = util.emptyObject;
      else if (this.repeated)
        this.defaultValue = util.emptyArray;
      else
        this.defaultValue = this.typeDefault;
      if (this.parent instanceof Type)
        this.parent.ctor.prototype[this.name] = this.defaultValue;
      return ReflectionObject.prototype.resolve.call(this);
    };
    Field.prototype._inferLegacyProtoFeatures = function _inferLegacyProtoFeatures(edition) {
      if (edition !== "proto2" && edition !== "proto3") {
        return {};
      }
      var features = {};
      if (this.rule === "required") {
        features.field_presence = "LEGACY_REQUIRED";
      }
      if (this.parent && types.defaults[this.type] === void 0) {
        var type = this.parent.get(this.type.split(".").pop());
        if (type && type instanceof Type && type.group) {
          features.message_encoding = "DELIMITED";
        }
      }
      if (this.getOption("packed") === true) {
        features.repeated_field_encoding = "PACKED";
      } else if (this.getOption("packed") === false) {
        features.repeated_field_encoding = "EXPANDED";
      }
      return features;
    };
    Field.prototype._resolveFeatures = function _resolveFeatures(edition) {
      return ReflectionObject.prototype._resolveFeatures.call(this, this._edition || edition);
    };
    Field.d = function decorateField(fieldId, fieldType, fieldRule, defaultValue) {
      if (typeof fieldType === "function")
        fieldType = util.decorateType(fieldType).name;
      else if (fieldType && typeof fieldType === "object")
        fieldType = util.decorateEnum(fieldType).name;
      return function fieldDecorator(prototype, fieldName) {
        util.decorateType(prototype.constructor).add(new Field(fieldName, fieldId, fieldType, fieldRule, { "default": defaultValue }));
      };
    };
    Field._configure = function configure(Type_) {
      Type = Type_;
    };
  }
});

// node_modules/protobufjs/src/oneof.js
var require_oneof = __commonJS({
  "node_modules/protobufjs/src/oneof.js"(exports, module) {
    "use strict";
    module.exports = OneOf;
    var ReflectionObject = require_object();
    ((OneOf.prototype = Object.create(ReflectionObject.prototype)).constructor = OneOf).className = "OneOf";
    var Field = require_field();
    var util = require_util();
    function OneOf(name14, fieldNames, options, comment) {
      if (!Array.isArray(fieldNames)) {
        options = fieldNames;
        fieldNames = void 0;
      }
      ReflectionObject.call(this, name14, options);
      if (!(fieldNames === void 0 || Array.isArray(fieldNames)))
        throw TypeError("fieldNames must be an Array");
      this.oneof = fieldNames || [];
      this.fieldsArray = [];
      this.comment = comment;
    }
    OneOf.fromJSON = function fromJSON(name14, json) {
      return new OneOf(name14, json.oneof, json.options, json.comment);
    };
    OneOf.prototype.toJSON = function toJSON(toJSONOptions) {
      var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
      return util.toObject([
        "options",
        this.options,
        "oneof",
        this.oneof,
        "comment",
        keepComments ? this.comment : void 0
      ]);
    };
    function addFieldsToParent(oneof) {
      if (oneof.parent) {
        for (var i = 0; i < oneof.fieldsArray.length; ++i)
          if (!oneof.fieldsArray[i].parent)
            oneof.parent.add(oneof.fieldsArray[i]);
      }
    }
    OneOf.prototype.add = function add(field) {
      if (!(field instanceof Field))
        throw TypeError("field must be a Field");
      if (field.parent && field.parent !== this.parent)
        field.parent.remove(field);
      this.oneof.push(field.name);
      this.fieldsArray.push(field);
      field.partOf = this;
      addFieldsToParent(this);
      return this;
    };
    OneOf.prototype.remove = function remove(field) {
      if (!(field instanceof Field))
        throw TypeError("field must be a Field");
      var index = this.fieldsArray.indexOf(field);
      if (index < 0)
        throw Error(field + " is not a member of " + this);
      this.fieldsArray.splice(index, 1);
      index = this.oneof.indexOf(field.name);
      if (index > -1)
        this.oneof.splice(index, 1);
      field.partOf = null;
      return this;
    };
    OneOf.prototype.onAdd = function onAdd(parent) {
      ReflectionObject.prototype.onAdd.call(this, parent);
      var self2 = this;
      for (var i = 0; i < this.oneof.length; ++i) {
        var field = parent.get(this.oneof[i]);
        if (field && !field.partOf) {
          field.partOf = self2;
          self2.fieldsArray.push(field);
        }
      }
      addFieldsToParent(this);
    };
    OneOf.prototype.onRemove = function onRemove(parent) {
      for (var i = 0, field; i < this.fieldsArray.length; ++i)
        if ((field = this.fieldsArray[i]).parent)
          field.parent.remove(field);
      ReflectionObject.prototype.onRemove.call(this, parent);
    };
    Object.defineProperty(OneOf.prototype, "isProto3Optional", {
      get: function() {
        if (this.fieldsArray == null || this.fieldsArray.length !== 1) {
          return false;
        }
        var field = this.fieldsArray[0];
        return field.options != null && field.options["proto3_optional"] === true;
      }
    });
    OneOf.d = function decorateOneOf() {
      var fieldNames = new Array(arguments.length), index = 0;
      while (index < arguments.length)
        fieldNames[index] = arguments[index++];
      return function oneOfDecorator(prototype, oneofName) {
        util.decorateType(prototype.constructor).add(new OneOf(oneofName, fieldNames));
        Object.defineProperty(prototype, oneofName, {
          get: util.oneOfGetter(fieldNames),
          set: util.oneOfSetter(fieldNames)
        });
      };
    };
  }
});

// node_modules/protobufjs/src/object.js
var require_object = __commonJS({
  "node_modules/protobufjs/src/object.js"(exports, module) {
    "use strict";
    module.exports = ReflectionObject;
    ReflectionObject.className = "ReflectionObject";
    var OneOf = require_oneof();
    var util = require_util();
    var Root;
    var editions2023Defaults = { enum_type: "OPEN", field_presence: "EXPLICIT", json_format: "ALLOW", message_encoding: "LENGTH_PREFIXED", repeated_field_encoding: "PACKED", utf8_validation: "VERIFY" };
    var proto2Defaults = { enum_type: "CLOSED", field_presence: "EXPLICIT", json_format: "LEGACY_BEST_EFFORT", message_encoding: "LENGTH_PREFIXED", repeated_field_encoding: "EXPANDED", utf8_validation: "NONE" };
    var proto3Defaults = { enum_type: "OPEN", field_presence: "IMPLICIT", json_format: "ALLOW", message_encoding: "LENGTH_PREFIXED", repeated_field_encoding: "PACKED", utf8_validation: "VERIFY" };
    function ReflectionObject(name14, options) {
      if (!util.isString(name14))
        throw TypeError("name must be a string");
      if (options && !util.isObject(options))
        throw TypeError("options must be an object");
      this.options = options;
      this.parsedOptions = null;
      this.name = name14;
      this._edition = null;
      this._defaultEdition = "proto2";
      this._features = {};
      this._featuresResolved = false;
      this.parent = null;
      this.resolved = false;
      this.comment = null;
      this.filename = null;
    }
    Object.defineProperties(ReflectionObject.prototype, {
      /**
       * Reference to the root namespace.
       * @name ReflectionObject#root
       * @type {Root}
       * @readonly
       */
      root: {
        get: function() {
          var ptr = this;
          while (ptr.parent !== null)
            ptr = ptr.parent;
          return ptr;
        }
      },
      /**
       * Full name including leading dot.
       * @name ReflectionObject#fullName
       * @type {string}
       * @readonly
       */
      fullName: {
        get: function() {
          var path25 = [this.name], ptr = this.parent;
          while (ptr) {
            path25.unshift(ptr.name);
            ptr = ptr.parent;
          }
          return path25.join(".");
        }
      }
    });
    ReflectionObject.prototype.toJSON = /* istanbul ignore next */
    function toJSON() {
      throw Error();
    };
    ReflectionObject.prototype.onAdd = function onAdd(parent) {
      if (this.parent && this.parent !== parent)
        this.parent.remove(this);
      this.parent = parent;
      this.resolved = false;
      var root = parent.root;
      if (root instanceof Root)
        root._handleAdd(this);
    };
    ReflectionObject.prototype.onRemove = function onRemove(parent) {
      var root = parent.root;
      if (root instanceof Root)
        root._handleRemove(this);
      this.parent = null;
      this.resolved = false;
    };
    ReflectionObject.prototype.resolve = function resolve2() {
      if (this.resolved)
        return this;
      if (this.root instanceof Root)
        this.resolved = true;
      return this;
    };
    ReflectionObject.prototype._resolveFeaturesRecursive = function _resolveFeaturesRecursive(edition) {
      return this._resolveFeatures(this._edition || edition);
    };
    ReflectionObject.prototype._resolveFeatures = function _resolveFeatures(edition) {
      if (this._featuresResolved) {
        return;
      }
      var defaults = {};
      if (!edition) {
        throw new Error("Unknown edition for " + this.fullName);
      }
      var protoFeatures = util.merge(
        {},
        this.options && this.options.features,
        this._inferLegacyProtoFeatures(edition)
      );
      if (this._edition) {
        if (edition === "proto2") {
          defaults = Object.assign({}, proto2Defaults);
        } else if (edition === "proto3") {
          defaults = Object.assign({}, proto3Defaults);
        } else if (edition === "2023") {
          defaults = Object.assign({}, editions2023Defaults);
        } else {
          throw new Error("Unknown edition: " + edition);
        }
        this._features = util.merge(defaults, protoFeatures);
        this._featuresResolved = true;
        return;
      }
      if (this.partOf instanceof OneOf) {
        var lexicalParentFeaturesCopy = util.merge({}, this.partOf._features);
        this._features = util.merge(lexicalParentFeaturesCopy, protoFeatures);
      } else if (this.declaringField) {
      } else if (this.parent) {
        var parentFeaturesCopy = util.merge({}, this.parent._features);
        this._features = util.merge(parentFeaturesCopy, protoFeatures);
      } else {
        throw new Error("Unable to find a parent for " + this.fullName);
      }
      if (this.extensionField) {
        this.extensionField._features = this._features;
      }
      this._featuresResolved = true;
    };
    ReflectionObject.prototype._inferLegacyProtoFeatures = function _inferLegacyProtoFeatures() {
      return {};
    };
    ReflectionObject.prototype.getOption = function getOption(name14) {
      if (this.options)
        return this.options[name14];
      return void 0;
    };
    ReflectionObject.prototype.setOption = function setOption(name14, value, ifNotSet) {
      if (name14 === "__proto__")
        return this;
      if (!this.options)
        this.options = {};
      if (/^features\./.test(name14)) {
        util.setProperty(this.options, name14, value, ifNotSet);
      } else if (!ifNotSet || this.options[name14] === void 0) {
        if (this.getOption(name14) !== value) this.resolved = false;
        this.options[name14] = value;
      }
      return this;
    };
    ReflectionObject.prototype.setParsedOption = function setParsedOption(name14, value, propName) {
      if (name14 === "__proto__")
        return this;
      if (!this.parsedOptions) {
        this.parsedOptions = [];
      }
      var parsedOptions = this.parsedOptions;
      if (propName) {
        var opt = parsedOptions.find(function(opt2) {
          return Object.prototype.hasOwnProperty.call(opt2, name14);
        });
        if (opt) {
          var newValue = opt[name14];
          util.setProperty(newValue, propName, value);
        } else {
          opt = {};
          opt[name14] = util.setProperty({}, propName, value);
          parsedOptions.push(opt);
        }
      } else {
        var newOpt = {};
        newOpt[name14] = value;
        parsedOptions.push(newOpt);
      }
      return this;
    };
    ReflectionObject.prototype.setOptions = function setOptions(options, ifNotSet) {
      if (options)
        for (var keys = Object.keys(options), i = 0; i < keys.length; ++i)
          this.setOption(keys[i], options[keys[i]], ifNotSet);
      return this;
    };
    ReflectionObject.prototype.toString = function toString() {
      var className = this.constructor.className, fullName = this.fullName;
      if (fullName.length)
        return className + " " + fullName;
      return className;
    };
    ReflectionObject.prototype._editionToJSON = function _editionToJSON() {
      if (!this._edition || this._edition === "proto3") {
        return void 0;
      }
      return this._edition;
    };
    ReflectionObject._configure = function(Root_) {
      Root = Root_;
    };
  }
});

// node_modules/protobufjs/src/enum.js
var require_enum = __commonJS({
  "node_modules/protobufjs/src/enum.js"(exports, module) {
    "use strict";
    module.exports = Enum;
    var ReflectionObject = require_object();
    ((Enum.prototype = Object.create(ReflectionObject.prototype)).constructor = Enum).className = "Enum";
    var Namespace = require_namespace();
    var util = require_util();
    function Enum(name14, values, options, comment, comments, valuesOptions) {
      ReflectionObject.call(this, name14, options);
      if (values && typeof values !== "object")
        throw TypeError("values must be an object");
      this.valuesById = {};
      this.values = Object.create(this.valuesById);
      this.comment = comment;
      this.comments = comments || {};
      this.valuesOptions = valuesOptions;
      this._valuesFeatures = {};
      this.reserved = void 0;
      if (values) {
        for (var keys = Object.keys(values), i = 0; i < keys.length; ++i)
          if (keys[i] !== "__proto__" && typeof values[keys[i]] === "number")
            this.valuesById[this.values[keys[i]] = values[keys[i]]] = keys[i];
      }
    }
    Enum.prototype._resolveFeatures = function _resolveFeatures(edition) {
      edition = this._edition || edition;
      ReflectionObject.prototype._resolveFeatures.call(this, edition);
      Object.keys(this.values).forEach((key) => {
        var parentFeaturesCopy = util.merge({}, this._features);
        this._valuesFeatures[key] = util.merge(parentFeaturesCopy, this.valuesOptions && this.valuesOptions[key] && this.valuesOptions[key].features || {});
      });
      return this;
    };
    Enum.fromJSON = function fromJSON(name14, json) {
      var enm = new Enum(name14, json.values, json.options, json.comment, json.comments);
      enm.reserved = json.reserved;
      if (json.edition)
        enm._edition = json.edition;
      enm._defaultEdition = "proto3";
      return enm;
    };
    Enum.prototype.toJSON = function toJSON(toJSONOptions) {
      var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
      return util.toObject([
        "edition",
        this._editionToJSON(),
        "options",
        this.options,
        "valuesOptions",
        this.valuesOptions,
        "values",
        this.values,
        "reserved",
        this.reserved && this.reserved.length ? this.reserved : void 0,
        "comment",
        keepComments ? this.comment : void 0,
        "comments",
        keepComments ? this.comments : void 0
      ]);
    };
    Enum.prototype.add = function add(name14, id, comment, options) {
      if (!util.isString(name14))
        throw TypeError("name must be a string");
      if (!util.isInteger(id))
        throw TypeError("id must be an integer");
      if (name14 === "__proto__")
        return this;
      if (this.values[name14] !== void 0)
        throw Error("duplicate name '" + name14 + "' in " + this);
      if (this.isReservedId(id))
        throw Error("id " + id + " is reserved in " + this);
      if (this.isReservedName(name14))
        throw Error("name '" + name14 + "' is reserved in " + this);
      if (this.valuesById[id] !== void 0) {
        if (!(this.options && this.options.allow_alias))
          throw Error("duplicate id " + id + " in " + this);
        this.values[name14] = id;
      } else
        this.valuesById[this.values[name14] = id] = name14;
      if (options) {
        if (this.valuesOptions === void 0)
          this.valuesOptions = {};
        this.valuesOptions[name14] = options || null;
      }
      this.comments[name14] = comment || null;
      return this;
    };
    Enum.prototype.remove = function remove(name14) {
      if (!util.isString(name14))
        throw TypeError("name must be a string");
      var val = this.values[name14];
      if (val == null)
        throw Error("name '" + name14 + "' does not exist in " + this);
      delete this.valuesById[val];
      delete this.values[name14];
      delete this.comments[name14];
      if (this.valuesOptions)
        delete this.valuesOptions[name14];
      return this;
    };
    Enum.prototype.isReservedId = function isReservedId(id) {
      return Namespace.isReservedId(this.reserved, id);
    };
    Enum.prototype.isReservedName = function isReservedName(name14) {
      return Namespace.isReservedName(this.reserved, name14);
    };
  }
});

// node_modules/protobufjs/src/encoder.js
var require_encoder = __commonJS({
  "node_modules/protobufjs/src/encoder.js"(exports, module) {
    "use strict";
    module.exports = encoder;
    var Enum = require_enum();
    var types = require_types();
    var util = require_util();
    function genTypePartial(gen, field, fieldIndex, ref) {
      return field.delimited ? gen("types[%i].encode(%s,w.uint32(%i),q+1).uint32(%i)", fieldIndex, ref, (field.id << 3 | 3) >>> 0, (field.id << 3 | 4) >>> 0) : gen("types[%i].encode(%s,w.uint32(%i).fork(),q+1).ldelim()", fieldIndex, ref, (field.id << 3 | 2) >>> 0);
    }
    function encoder(mtype) {
      var gen = util.codegen(["m", "w", "q"], mtype.name + "$encode")("if(!w)")("w=Writer.create()")("if(q===undefined)q=0")("if(q>util.recursionLimit)")('throw Error("max depth exceeded")');
      var i, ref;
      var fields = (
        /* initializes */
        mtype.fieldsArray.slice().sort(util.compareFieldsById)
      );
      for (var i = 0; i < fields.length; ++i) {
        var field = fields[i].resolve(), index = mtype._fieldsArray.indexOf(field), type = field.resolvedType instanceof Enum ? "int32" : field.type, wireType = types.basic[type];
        ref = "m" + util.safeProp(field.name);
        if (field.map) {
          gen("if(%s!=null&&Object.hasOwnProperty.call(m,%j)){", ref, field.name)("for(var ks=Object.keys(%s),i=0;i<ks.length;++i){", ref)("w.uint32(%i).fork().uint32(%i).%s(ks[i])", (field.id << 3 | 2) >>> 0, 8 | types.mapKey[field.keyType], field.keyType);
          if (wireType === void 0) gen("types[%i].encode(%s[ks[i]],w.uint32(18).fork(),q+1).ldelim().ldelim()", index, ref);
          else gen(".uint32(%i).%s(%s[ks[i]]).ldelim()", 16 | wireType, type, ref);
          gen("}")("}");
        } else if (field.repeated) {
          gen("if(%s!=null&&%s.length){", ref, ref);
          if (field.packed && types.packed[type] !== void 0) {
            gen("w.uint32(%i).fork()", (field.id << 3 | 2) >>> 0)("for(var i=0;i<%s.length;++i)", ref)("w.%s(%s[i])", type, ref)("w.ldelim()");
          } else {
            gen("for(var i=0;i<%s.length;++i)", ref);
            if (wireType === void 0)
              genTypePartial(gen, field, index, ref + "[i]");
            else gen("w.uint32(%i).%s(%s[i])", (field.id << 3 | wireType) >>> 0, type, ref);
          }
          gen("}");
        } else {
          if (field.optional) gen("if(%s!=null&&Object.hasOwnProperty.call(m,%j))", ref, field.name);
          if (wireType === void 0)
            genTypePartial(gen, field, index, ref);
          else gen("w.uint32(%i).%s(%s)", (field.id << 3 | wireType) >>> 0, type, ref);
        }
      }
      return gen("return w");
    }
  }
});

// node_modules/protobufjs/src/index-light.js
var require_index_light = __commonJS({
  "node_modules/protobufjs/src/index-light.js"(exports, module) {
    "use strict";
    var protobuf5 = module.exports = require_index_minimal();
    protobuf5.build = "light";
    function load(filename, root, callback) {
      if (typeof root === "function") {
        callback = root;
        root = new protobuf5.Root();
      } else if (!root)
        root = new protobuf5.Root();
      return root.load(filename, callback);
    }
    protobuf5.load = load;
    function loadSync(filename, root) {
      if (!root)
        root = new protobuf5.Root();
      return root.loadSync(filename);
    }
    protobuf5.loadSync = loadSync;
    protobuf5.encoder = require_encoder();
    protobuf5.decoder = require_decoder();
    protobuf5.verifier = require_verifier();
    protobuf5.converter = require_converter();
    protobuf5.ReflectionObject = require_object();
    protobuf5.Namespace = require_namespace();
    protobuf5.Root = require_root();
    protobuf5.Enum = require_enum();
    protobuf5.Type = require_type();
    protobuf5.Field = require_field();
    protobuf5.OneOf = require_oneof();
    protobuf5.MapField = require_mapfield();
    protobuf5.Service = require_service2();
    protobuf5.Method = require_method();
    protobuf5.Message = require_message();
    protobuf5.wrappers = require_wrappers();
    protobuf5.types = require_types();
    protobuf5.util = require_util();
    protobuf5.ReflectionObject._configure(protobuf5.Root);
    protobuf5.Namespace._configure(protobuf5.Type, protobuf5.Service, protobuf5.Enum);
    protobuf5.Root._configure(protobuf5.Type);
    protobuf5.Field._configure(protobuf5.Type);
  }
});

// node_modules/protobufjs/src/tokenize.js
var require_tokenize = __commonJS({
  "node_modules/protobufjs/src/tokenize.js"(exports, module) {
    "use strict";
    module.exports = tokenize;
    var delimRe = /[\s{}=;:[\],'"()<>]/g;
    var stringDoubleRe = /(?:"([^"\\]*(?:\\.[^"\\]*)*)")/g;
    var stringSingleRe = /(?:'([^'\\]*(?:\\.[^'\\]*)*)')/g;
    var setCommentRe = /^ *[*/]+ */;
    var setCommentAltRe = /^\s*\*?\/*/;
    var setCommentSplitRe = /\n/g;
    var whitespaceRe = /\s/;
    var unescapeRe = /\\(.?)/g;
    var unescapeMap = {
      "0": "\0",
      "r": "\r",
      "n": "\n",
      "t": "	"
    };
    function unescape(str7) {
      return str7.replace(unescapeRe, function($0, $1) {
        switch ($1) {
          case "\\":
          case "":
            return $1;
          default:
            return unescapeMap[$1] || "";
        }
      });
    }
    tokenize.unescape = unescape;
    function tokenize(source, alternateCommentMode) {
      source = source.toString();
      var offset = 0, length = source.length, line = 1, lastCommentLine = 0, comments = {};
      var stack = [];
      var stringDelim = null;
      function illegal(subject) {
        return Error("illegal " + subject + " (line " + line + ")");
      }
      function readString() {
        var re = stringDelim === "'" ? stringSingleRe : stringDoubleRe;
        re.lastIndex = offset - 1;
        var match = re.exec(source);
        if (!match)
          throw illegal("string");
        offset = re.lastIndex;
        push(stringDelim);
        stringDelim = null;
        return unescape(match[1]);
      }
      function charAt(pos) {
        return source.charAt(pos);
      }
      function setComment(start, end, isLeading) {
        var comment = {
          type: source.charAt(start++),
          lineEmpty: false,
          leading: isLeading
        };
        var lookback;
        if (alternateCommentMode) {
          lookback = 2;
        } else {
          lookback = 3;
        }
        var commentOffset = start - lookback, c;
        do {
          if (--commentOffset < 0 || (c = source.charAt(commentOffset)) === "\n") {
            comment.lineEmpty = true;
            break;
          }
        } while (c === " " || c === "	");
        var lines = source.substring(start, end).split(setCommentSplitRe);
        for (var i = 0; i < lines.length; ++i)
          lines[i] = lines[i].replace(alternateCommentMode ? setCommentAltRe : setCommentRe, "").trim();
        comment.text = lines.join("\n").trim();
        comments[line] = comment;
        lastCommentLine = line;
      }
      function isDoubleSlashCommentLine(startOffset) {
        var endOffset = findEndOfLine(startOffset);
        var lineText = source.substring(startOffset, endOffset);
        var isComment = /^\s*\/\//.test(lineText);
        return isComment;
      }
      function findEndOfLine(cursor) {
        var endOffset = cursor;
        while (endOffset < length && charAt(endOffset) !== "\n") {
          endOffset++;
        }
        return endOffset;
      }
      function next() {
        if (stack.length > 0)
          return stack.shift();
        if (stringDelim)
          return readString();
        var repeat, prev, curr, start, isDoc, isLeadingComment = offset === 0;
        do {
          if (offset === length)
            return null;
          repeat = false;
          while (whitespaceRe.test(curr = charAt(offset))) {
            if (curr === "\n") {
              isLeadingComment = true;
              ++line;
            }
            if (++offset === length)
              return null;
          }
          if (charAt(offset) === "/") {
            if (++offset === length) {
              throw illegal("comment");
            }
            if (charAt(offset) === "/") {
              if (!alternateCommentMode) {
                isDoc = charAt(start = offset + 1) === "/";
                while (charAt(++offset) !== "\n") {
                  if (offset === length) {
                    return null;
                  }
                }
                ++offset;
                if (isDoc) {
                  setComment(start, offset - 1, isLeadingComment);
                  isLeadingComment = true;
                }
                ++line;
                repeat = true;
              } else {
                start = offset;
                isDoc = false;
                if (isDoubleSlashCommentLine(offset - 1)) {
                  isDoc = true;
                  do {
                    offset = findEndOfLine(offset);
                    if (offset === length) {
                      break;
                    }
                    offset++;
                    if (!isLeadingComment) {
                      break;
                    }
                  } while (isDoubleSlashCommentLine(offset));
                } else {
                  offset = Math.min(length, findEndOfLine(offset) + 1);
                }
                if (isDoc) {
                  setComment(start, offset, isLeadingComment);
                  isLeadingComment = true;
                }
                line++;
                repeat = true;
              }
            } else if ((curr = charAt(offset)) === "*") {
              start = offset + 1;
              isDoc = alternateCommentMode || charAt(start) === "*";
              do {
                if (curr === "\n") {
                  ++line;
                }
                if (++offset === length) {
                  throw illegal("comment");
                }
                prev = curr;
                curr = charAt(offset);
              } while (prev !== "*" || curr !== "/");
              ++offset;
              if (isDoc) {
                setComment(start, offset - 2, isLeadingComment);
                isLeadingComment = true;
              }
              repeat = true;
            } else {
              return "/";
            }
          }
        } while (repeat);
        var end = offset;
        delimRe.lastIndex = 0;
        var delim = delimRe.test(charAt(end++));
        if (!delim)
          while (end < length && !delimRe.test(charAt(end)))
            ++end;
        var token = source.substring(offset, offset = end);
        if (token === '"' || token === "'")
          stringDelim = token;
        return token;
      }
      function push(token) {
        stack.push(token);
      }
      function peek() {
        if (!stack.length) {
          var token = next();
          if (token === null)
            return null;
          push(token);
        }
        return stack[0];
      }
      function skip(expected, optional) {
        var actual = peek(), equals = actual === expected;
        if (equals) {
          next();
          return true;
        }
        if (!optional)
          throw illegal("token '" + actual + "', '" + expected + "' expected");
        return false;
      }
      function cmnt(trailingLine) {
        var ret = null;
        var comment;
        if (trailingLine === void 0) {
          comment = comments[line - 1];
          delete comments[line - 1];
          if (comment && (alternateCommentMode || comment.type === "*" || comment.lineEmpty)) {
            ret = comment.leading ? comment.text : null;
          }
        } else {
          if (lastCommentLine < trailingLine) {
            peek();
          }
          comment = comments[trailingLine];
          delete comments[trailingLine];
          if (comment && !comment.lineEmpty && (alternateCommentMode || comment.type === "/")) {
            ret = comment.leading ? null : comment.text;
          }
        }
        return ret;
      }
      return Object.defineProperty({
        next,
        peek,
        push,
        skip,
        cmnt
      }, "line", {
        get: function() {
          return line;
        }
      });
    }
  }
});

// node_modules/protobufjs/src/parse.js
var require_parse = __commonJS({
  "node_modules/protobufjs/src/parse.js"(exports, module) {
    "use strict";
    module.exports = parse;
    parse.filename = null;
    parse.defaults = { keepCase: false };
    var tokenize = require_tokenize();
    var Root = require_root();
    var Type = require_type();
    var Field = require_field();
    var MapField = require_mapfield();
    var OneOf = require_oneof();
    var Enum = require_enum();
    var Service = require_service2();
    var Method = require_method();
    var ReflectionObject = require_object();
    var types = require_types();
    var util = require_util();
    var base10Re = /^[1-9][0-9]*$/;
    var base10NegRe = /^-?[1-9][0-9]*$/;
    var base16Re = /^0[x][0-9a-fA-F]+$/;
    var base16NegRe = /^-?0[x][0-9a-fA-F]+$/;
    var base8Re = /^0[0-7]+$/;
    var base8NegRe = /^-?0[0-7]+$/;
    var numberRe = util.patterns.numberRe;
    var nameRe = /^[a-zA-Z_][a-zA-Z_0-9]*$/;
    var typeRefRe = util.patterns.typeRefRe;
    function parse(source, root, options) {
      if (!(root instanceof Root)) {
        options = root;
        root = new Root();
      }
      if (!options)
        options = parse.defaults;
      var preferTrailingComment = options.preferTrailingComment || false;
      var tn = tokenize(source, options.alternateCommentMode || false), next = tn.next, push = tn.push, peek = tn.peek, skip = tn.skip, cmnt = tn.cmnt;
      var head = true, pkg, imports, weakImports, edition = "proto2";
      var ptr = root;
      var topLevelObjects = [];
      var topLevelOptions = {};
      var applyCase = options.keepCase ? function(name14) {
        return name14;
      } : util.camelCase;
      function resolveFileFeatures() {
        topLevelObjects.forEach((obj) => {
          obj._edition = edition;
          Object.keys(topLevelOptions).forEach((opt) => {
            if (obj.getOption(opt) !== void 0) return;
            obj.setOption(opt, topLevelOptions[opt], true);
          });
        });
      }
      function illegal(token2, name14, insideTryCatch) {
        var filename = parse.filename;
        if (!insideTryCatch)
          parse.filename = null;
        return Error("illegal " + (name14 || "token") + " '" + token2 + "' (" + (filename ? filename + ", " : "") + "line " + tn.line + ")");
      }
      function readString() {
        var values = [], token2;
        do {
          if ((token2 = next()) !== '"' && token2 !== "'")
            throw illegal(token2);
          values.push(next());
          skip(token2);
          token2 = peek();
        } while (token2 === '"' || token2 === "'");
        return values.join("");
      }
      function readValue(acceptTypeRef) {
        var token2 = next();
        switch (token2) {
          case "'":
          case '"':
            push(token2);
            return readString();
          case "true":
          case "TRUE":
            return true;
          case "false":
          case "FALSE":
            return false;
        }
        try {
          return parseNumber(
            token2,
            /* insideTryCatch */
            true
          );
        } catch (e) {
          if (acceptTypeRef && typeRefRe.test(token2))
            return token2;
          throw illegal(token2, "value");
        }
      }
      function readRanges(target, acceptStrings) {
        var token2, start;
        do {
          if (acceptStrings && ((token2 = peek()) === '"' || token2 === "'")) {
            var str7 = readString();
            target.push(str7);
            if (edition >= 2023) {
              throw illegal(str7, "id");
            }
          } else {
            try {
              target.push([start = parseId(next()), skip("to", true) ? parseId(next()) : start]);
            } catch (err) {
              if (acceptStrings && typeRefRe.test(token2) && edition >= 2023) {
                target.push(token2);
              } else {
                throw err;
              }
            }
          }
        } while (skip(",", true));
        var dummy = { options: void 0 };
        dummy.setOption = function(name14, value) {
          if (this.options === void 0) this.options = {};
          this.options[name14] = value;
        };
        ifBlock(
          dummy,
          function parseRange_block(token3) {
            if (token3 === "option") {
              parseOption(dummy, token3);
              skip(";");
            } else
              throw illegal(token3);
          },
          function parseRange_line() {
            parseInlineOptions(dummy);
          }
        );
      }
      function parseNumber(token2, insideTryCatch) {
        var sign = 1;
        if (token2.charAt(0) === "-") {
          sign = -1;
          token2 = token2.substring(1);
        }
        switch (token2) {
          case "inf":
          case "INF":
          case "Inf":
            return sign * Infinity;
          case "nan":
          case "NAN":
          case "Nan":
          case "NaN":
            return NaN;
          case "0":
            return 0;
        }
        if (base10Re.test(token2))
          return sign * parseInt(token2, 10);
        if (base16Re.test(token2))
          return sign * parseInt(token2, 16);
        if (base8Re.test(token2))
          return sign * parseInt(token2, 8);
        if (numberRe.test(token2))
          return sign * parseFloat(token2);
        throw illegal(token2, "number", insideTryCatch);
      }
      function parseId(token2, acceptNegative) {
        switch (token2) {
          case "max":
          case "MAX":
          case "Max":
            return 536870911;
          case "0":
            return 0;
        }
        if (!acceptNegative && token2.charAt(0) === "-")
          throw illegal(token2, "id");
        if (base10NegRe.test(token2))
          return parseInt(token2, 10);
        if (base16NegRe.test(token2))
          return parseInt(token2, 16);
        if (base8NegRe.test(token2))
          return parseInt(token2, 8);
        throw illegal(token2, "id");
      }
      function parsePackage() {
        if (pkg !== void 0)
          throw illegal("package");
        pkg = next();
        if (!typeRefRe.test(pkg))
          throw illegal(pkg, "name");
        ptr = ptr.define(pkg);
        skip(";");
      }
      function parseImport() {
        var token2 = peek();
        var whichImports;
        switch (token2) {
          case "weak":
            whichImports = weakImports || (weakImports = []);
            next();
            break;
          case "public":
            next();
          // eslint-disable-next-line no-fallthrough
          default:
            whichImports = imports || (imports = []);
            break;
        }
        token2 = readString();
        skip(";");
        whichImports.push(token2);
      }
      function parseSyntax() {
        skip("=");
        edition = readString();
        if (edition < 2023)
          throw illegal(edition, "syntax");
        skip(";");
      }
      function parseEdition() {
        skip("=");
        edition = readString();
        const supportedEditions = ["2023"];
        if (!supportedEditions.includes(edition))
          throw illegal(edition, "edition");
        skip(";");
      }
      function parseCommon(parent, token2, depth) {
        if (depth === void 0)
          depth = 0;
        switch (token2) {
          case "option":
            parseOption(parent, token2);
            skip(";");
            return true;
          case "message":
            parseType(parent, token2, depth + 1);
            return true;
          case "enum":
            parseEnum(parent, token2);
            return true;
          case "service":
            parseService(parent, token2, depth + 1);
            return true;
          case "extend":
            parseExtension(parent, token2, depth);
            return true;
        }
        return false;
      }
      function ifBlock(obj, fnIf, fnElse) {
        var trailingLine = tn.line;
        if (obj) {
          if (typeof obj.comment !== "string") {
            obj.comment = cmnt();
          }
          obj.filename = parse.filename;
        }
        if (skip("{", true)) {
          var token2;
          while ((token2 = next()) !== "}")
            fnIf(token2);
          skip(";", true);
        } else {
          if (fnElse)
            fnElse();
          skip(";");
          if (obj && (typeof obj.comment !== "string" || preferTrailingComment))
            obj.comment = cmnt(trailingLine) || obj.comment;
        }
      }
      function parseType(parent, token2, depth) {
        if (depth === void 0)
          depth = 0;
        if (depth > util.nestingLimit)
          throw Error("max depth exceeded");
        if (!nameRe.test(token2 = next()))
          throw illegal(token2, "type name");
        var type = new Type(token2);
        ifBlock(type, function parseType_block(token3) {
          if (parseCommon(type, token3, depth))
            return;
          switch (token3) {
            case "map":
              parseMapField(type, token3);
              break;
            case "required":
              if (edition !== "proto2")
                throw illegal(token3);
            /* eslint-disable no-fallthrough */
            case "repeated":
              parseField(type, token3, void 0, depth + 1);
              break;
            case "optional":
              if (edition === "proto3") {
                parseField(type, "proto3_optional", void 0, depth + 1);
              } else if (edition !== "proto2") {
                throw illegal(token3);
              } else {
                parseField(type, "optional", void 0, depth + 1);
              }
              break;
            case "oneof":
              parseOneOf(type, token3, depth + 1);
              break;
            case "extensions":
              readRanges(type.extensions || (type.extensions = []));
              break;
            case "reserved":
              readRanges(type.reserved || (type.reserved = []), true);
              break;
            default:
              if (edition === "proto2" || !typeRefRe.test(token3)) {
                throw illegal(token3);
              }
              push(token3);
              parseField(type, "optional", void 0, depth + 1);
              break;
          }
        });
        parent.add(type);
        if (parent === ptr) {
          topLevelObjects.push(type);
        }
      }
      function parseField(parent, rule, extend, depth) {
        var type = next();
        if (type === "group") {
          parseGroup(parent, rule, depth);
          return;
        }
        while (type.endsWith(".") || peek().startsWith(".")) {
          type += next();
        }
        if (!typeRefRe.test(type))
          throw illegal(type, "type");
        var name14 = next();
        if (!nameRe.test(name14))
          throw illegal(name14, "name");
        name14 = applyCase(name14);
        skip("=");
        var field = new Field(name14, parseId(next()), type, rule, extend);
        ifBlock(field, function parseField_block(token2) {
          if (token2 === "option") {
            parseOption(field, token2);
            skip(";");
          } else
            throw illegal(token2);
        }, function parseField_line() {
          parseInlineOptions(field);
        });
        if (rule === "proto3_optional") {
          var oneof = new OneOf("_" + name14);
          field.setOption("proto3_optional", true);
          oneof.add(field);
          parent.add(oneof);
        } else {
          parent.add(field);
        }
        if (parent === ptr) {
          topLevelObjects.push(field);
        }
      }
      function parseGroup(parent, rule, depth) {
        if (depth === void 0)
          depth = 0;
        if (depth > util.nestingLimit)
          throw Error("max depth exceeded");
        if (edition >= 2023) {
          throw illegal("group");
        }
        var name14 = next();
        if (!nameRe.test(name14))
          throw illegal(name14, "name");
        var fieldName = util.lcFirst(name14);
        if (name14 === fieldName)
          name14 = util.ucFirst(name14);
        skip("=");
        var id = parseId(next());
        var type = new Type(name14);
        type.group = true;
        var field = new Field(fieldName, id, name14, rule);
        field.filename = parse.filename;
        ifBlock(type, function parseGroup_block(token2) {
          switch (token2) {
            case "option":
              parseOption(type, token2);
              skip(";");
              break;
            case "required":
            case "repeated":
              parseField(type, token2, void 0, depth + 1);
              break;
            case "optional":
              if (edition === "proto3") {
                parseField(type, "proto3_optional", void 0, depth + 1);
              } else {
                parseField(type, "optional", void 0, depth + 1);
              }
              break;
            case "message":
              parseType(type, token2, depth + 1);
              break;
            case "enum":
              parseEnum(type, token2);
              break;
            case "reserved":
              readRanges(type.reserved || (type.reserved = []), true);
              break;
            /* istanbul ignore next */
            default:
              throw illegal(token2);
          }
        });
        parent.add(type).add(field);
      }
      function parseMapField(parent) {
        skip("<");
        var keyType = next();
        if (types.mapKey[keyType] === void 0)
          throw illegal(keyType, "type");
        skip(",");
        var valueType = next();
        if (!typeRefRe.test(valueType))
          throw illegal(valueType, "type");
        skip(">");
        var name14 = next();
        if (!nameRe.test(name14))
          throw illegal(name14, "name");
        skip("=");
        var field = new MapField(applyCase(name14), parseId(next()), keyType, valueType);
        ifBlock(field, function parseMapField_block(token2) {
          if (token2 === "option") {
            parseOption(field, token2);
            skip(";");
          } else
            throw illegal(token2);
        }, function parseMapField_line() {
          parseInlineOptions(field);
        });
        parent.add(field);
      }
      function parseOneOf(parent, token2, depth) {
        if (!nameRe.test(token2 = next()))
          throw illegal(token2, "name");
        var oneof = new OneOf(applyCase(token2));
        ifBlock(oneof, function parseOneOf_block(token3) {
          if (token3 === "option") {
            parseOption(oneof, token3);
            skip(";");
          } else {
            push(token3);
            parseField(oneof, "optional", void 0, depth);
          }
        });
        parent.add(oneof);
      }
      function parseEnum(parent, token2) {
        if (!nameRe.test(token2 = next()))
          throw illegal(token2, "name");
        var enm = new Enum(token2);
        ifBlock(enm, function parseEnum_block(token3) {
          switch (token3) {
            case "option":
              parseOption(enm, token3);
              skip(";");
              break;
            case "reserved":
              readRanges(enm.reserved || (enm.reserved = []), true);
              if (enm.reserved === void 0) enm.reserved = [];
              break;
            default:
              parseEnumValue(enm, token3);
          }
        });
        parent.add(enm);
        if (parent === ptr) {
          topLevelObjects.push(enm);
        }
      }
      function parseEnumValue(parent, token2) {
        if (!nameRe.test(token2))
          throw illegal(token2, "name");
        skip("=");
        var value = parseId(next(), true), dummy = {
          options: void 0
        };
        dummy.getOption = function(name14) {
          return this.options[name14];
        };
        dummy.setOption = function(name14, value2) {
          ReflectionObject.prototype.setOption.call(dummy, name14, value2);
        };
        dummy.setParsedOption = function() {
          return void 0;
        };
        ifBlock(dummy, function parseEnumValue_block(token3) {
          if (token3 === "option") {
            parseOption(dummy, token3);
            skip(";");
          } else
            throw illegal(token3);
        }, function parseEnumValue_line() {
          parseInlineOptions(dummy);
        });
        parent.add(token2, value, dummy.comment, dummy.parsedOptions || dummy.options);
      }
      function parseOption(parent, token2) {
        var option;
        var propName;
        var isOption = true;
        if (token2 === "option") {
          token2 = next();
        }
        while (token2 !== "=") {
          if (token2 === null) {
            throw illegal(token2, "end of input");
          }
          if (token2 === "(") {
            var parensValue = next();
            skip(")");
            token2 = "(" + parensValue + ")";
          }
          if (isOption) {
            isOption = false;
            if (token2.includes(".") && !token2.includes("(")) {
              var tokens = token2.split(".");
              option = tokens[0] + ".";
              token2 = tokens[1];
              continue;
            }
            option = token2;
          } else {
            propName = propName ? propName += token2 : token2;
          }
          token2 = next();
        }
        var name14 = propName ? option.concat(propName) : option;
        var optionValue = parseOptionValue(parent, name14);
        propName = propName && propName[0] === "." ? propName.slice(1) : propName;
        option = option && option[option.length - 1] === "." ? option.slice(0, -1) : option;
        setParsedOption(parent, option, optionValue, propName);
      }
      function parseOptionValue(parent, name14, depth) {
        if (depth === void 0)
          depth = 0;
        if (depth > util.recursionLimit)
          throw Error("max depth exceeded");
        if (skip("{", true)) {
          var objectResult = {};
          while (!skip("}", true)) {
            if (!nameRe.test(token = next())) {
              throw illegal(token, "name");
            }
            if (token === null) {
              throw illegal(token, "end of input");
            }
            var value;
            var propName = token;
            skip(":", true);
            if (peek() === "{") {
              value = parseOptionValue(parent, name14 + "." + token, depth + 1);
            } else if (peek() === "[") {
              value = [];
              var lastValue;
              if (skip("[", true)) {
                do {
                  lastValue = readValue(true);
                  value.push(lastValue);
                } while (skip(",", true));
                skip("]");
                if (typeof lastValue !== "undefined") {
                  setOption(parent, name14 + "." + token, lastValue);
                }
              }
            } else {
              value = readValue(true);
              setOption(parent, name14 + "." + token, value);
            }
            var prevValue = objectResult[propName];
            if (prevValue)
              value = [].concat(prevValue).concat(value);
            if (propName !== "__proto__")
              objectResult[propName] = value;
            skip(",", true);
            skip(";", true);
          }
          return objectResult;
        }
        var simpleValue = readValue(true);
        setOption(parent, name14, simpleValue);
        return simpleValue;
      }
      function setOption(parent, name14, value) {
        if (ptr === parent && /^features\./.test(name14)) {
          topLevelOptions[name14] = value;
          return;
        }
        if (parent.setOption)
          parent.setOption(name14, value);
      }
      function setParsedOption(parent, name14, value, propName) {
        if (parent.setParsedOption)
          parent.setParsedOption(name14, value, propName);
      }
      function parseInlineOptions(parent) {
        if (skip("[", true)) {
          do {
            parseOption(parent, "option");
          } while (skip(",", true));
          skip("]");
        }
        return parent;
      }
      function parseService(parent, token2, depth) {
        if (depth === void 0)
          depth = 0;
        if (depth > util.recursionLimit)
          throw Error("max depth exceeded");
        if (!nameRe.test(token2 = next()))
          throw illegal(token2, "service name");
        var service = new Service(token2);
        ifBlock(service, function parseService_block(token3) {
          if (parseCommon(service, token3, depth)) {
            return;
          }
          if (token3 === "rpc")
            parseMethod(service, token3);
          else
            throw illegal(token3);
        });
        parent.add(service);
        if (parent === ptr) {
          topLevelObjects.push(service);
        }
      }
      function parseMethod(parent, token2) {
        var commentText = cmnt();
        var type = token2;
        if (!nameRe.test(token2 = next()))
          throw illegal(token2, "name");
        var name14 = token2, requestType, requestStream, responseType, responseStream;
        skip("(");
        if (skip("stream", true))
          requestStream = true;
        if (!typeRefRe.test(token2 = next()))
          throw illegal(token2);
        requestType = token2;
        skip(")");
        skip("returns");
        skip("(");
        if (skip("stream", true))
          responseStream = true;
        if (!typeRefRe.test(token2 = next()))
          throw illegal(token2);
        responseType = token2;
        skip(")");
        var method = new Method(name14, type, requestType, responseType, requestStream, responseStream);
        method.comment = commentText;
        ifBlock(method, function parseMethod_block(token3) {
          if (token3 === "option") {
            parseOption(method, token3);
            skip(";");
          } else
            throw illegal(token3);
        });
        parent.add(method);
      }
      function parseExtension(parent, token2, depth) {
        if (!typeRefRe.test(token2 = next()))
          throw illegal(token2, "reference");
        var reference = token2;
        ifBlock(null, function parseExtension_block(token3) {
          switch (token3) {
            case "required":
            case "repeated":
              parseField(parent, token3, reference, depth + 1);
              break;
            case "optional":
              if (edition === "proto3") {
                parseField(parent, "proto3_optional", reference, depth + 1);
              } else {
                parseField(parent, "optional", reference, depth + 1);
              }
              break;
            default:
              if (edition === "proto2" || !typeRefRe.test(token3))
                throw illegal(token3);
              push(token3);
              parseField(parent, "optional", reference, depth + 1);
              break;
          }
        });
      }
      var token;
      while ((token = next()) !== null) {
        switch (token) {
          case "package":
            if (!head)
              throw illegal(token);
            parsePackage();
            break;
          case "import":
            if (!head)
              throw illegal(token);
            parseImport();
            break;
          case "syntax":
            if (!head)
              throw illegal(token);
            parseSyntax();
            break;
          case "edition":
            if (!head)
              throw illegal(token);
            parseEdition();
            break;
          case "option":
            parseOption(ptr, token);
            skip(";", true);
            break;
          default:
            if (parseCommon(ptr, token, 0)) {
              head = false;
              continue;
            }
            throw illegal(token);
        }
      }
      resolveFileFeatures();
      parse.filename = null;
      return {
        "package": pkg,
        "imports": imports,
        weakImports,
        root
      };
    }
  }
});

// node_modules/protobufjs/src/common.js
var require_common = __commonJS({
  "node_modules/protobufjs/src/common.js"(exports, module) {
    "use strict";
    module.exports = common;
    var commonRe = /\/|\./;
    function common(name14, json) {
      if (!commonRe.test(name14)) {
        name14 = "google/protobuf/" + name14 + ".proto";
        json = { nested: { google: { nested: { protobuf: { nested: json } } } } };
      }
      common[name14] = json;
    }
    common("any", {
      /**
       * Properties of a google.protobuf.Any message.
       * @interface IAny
       * @type {Object}
       * @property {string} [typeUrl]
       * @property {Uint8Array} [bytes]
       * @memberof common
       */
      Any: {
        fields: {
          type_url: {
            type: "string",
            id: 1
          },
          value: {
            type: "bytes",
            id: 2
          }
        }
      }
    });
    var timeType;
    common("duration", {
      /**
       * Properties of a google.protobuf.Duration message.
       * @interface IDuration
       * @type {Object}
       * @property {number|Long} [seconds]
       * @property {number} [nanos]
       * @memberof common
       */
      Duration: timeType = {
        fields: {
          seconds: {
            type: "int64",
            id: 1
          },
          nanos: {
            type: "int32",
            id: 2
          }
        }
      }
    });
    common("timestamp", {
      /**
       * Properties of a google.protobuf.Timestamp message.
       * @interface ITimestamp
       * @type {Object}
       * @property {number|Long} [seconds]
       * @property {number} [nanos]
       * @memberof common
       */
      Timestamp: timeType
    });
    common("empty", {
      /**
       * Properties of a google.protobuf.Empty message.
       * @interface IEmpty
       * @memberof common
       */
      Empty: {
        fields: {}
      }
    });
    common("struct", {
      /**
       * Properties of a google.protobuf.Struct message.
       * @interface IStruct
       * @type {Object}
       * @property {Object.<string,IValue>} [fields]
       * @memberof common
       */
      Struct: {
        fields: {
          fields: {
            keyType: "string",
            type: "Value",
            id: 1
          }
        }
      },
      /**
       * Properties of a google.protobuf.Value message.
       * @interface IValue
       * @type {Object}
       * @property {string} [kind]
       * @property {0} [nullValue]
       * @property {number} [numberValue]
       * @property {string} [stringValue]
       * @property {boolean} [boolValue]
       * @property {IStruct} [structValue]
       * @property {IListValue} [listValue]
       * @memberof common
       */
      Value: {
        oneofs: {
          kind: {
            oneof: [
              "nullValue",
              "numberValue",
              "stringValue",
              "boolValue",
              "structValue",
              "listValue"
            ]
          }
        },
        fields: {
          nullValue: {
            type: "NullValue",
            id: 1
          },
          numberValue: {
            type: "double",
            id: 2
          },
          stringValue: {
            type: "string",
            id: 3
          },
          boolValue: {
            type: "bool",
            id: 4
          },
          structValue: {
            type: "Struct",
            id: 5
          },
          listValue: {
            type: "ListValue",
            id: 6
          }
        }
      },
      NullValue: {
        values: {
          NULL_VALUE: 0
        }
      },
      /**
       * Properties of a google.protobuf.ListValue message.
       * @interface IListValue
       * @type {Object}
       * @property {Array.<IValue>} [values]
       * @memberof common
       */
      ListValue: {
        fields: {
          values: {
            rule: "repeated",
            type: "Value",
            id: 1
          }
        }
      }
    });
    common("wrappers", {
      /**
       * Properties of a google.protobuf.DoubleValue message.
       * @interface IDoubleValue
       * @type {Object}
       * @property {number} [value]
       * @memberof common
       */
      DoubleValue: {
        fields: {
          value: {
            type: "double",
            id: 1
          }
        }
      },
      /**
       * Properties of a google.protobuf.FloatValue message.
       * @interface IFloatValue
       * @type {Object}
       * @property {number} [value]
       * @memberof common
       */
      FloatValue: {
        fields: {
          value: {
            type: "float",
            id: 1
          }
        }
      },
      /**
       * Properties of a google.protobuf.Int64Value message.
       * @interface IInt64Value
       * @type {Object}
       * @property {number|Long} [value]
       * @memberof common
       */
      Int64Value: {
        fields: {
          value: {
            type: "int64",
            id: 1
          }
        }
      },
      /**
       * Properties of a google.protobuf.UInt64Value message.
       * @interface IUInt64Value
       * @type {Object}
       * @property {number|Long} [value]
       * @memberof common
       */
      UInt64Value: {
        fields: {
          value: {
            type: "uint64",
            id: 1
          }
        }
      },
      /**
       * Properties of a google.protobuf.Int32Value message.
       * @interface IInt32Value
       * @type {Object}
       * @property {number} [value]
       * @memberof common
       */
      Int32Value: {
        fields: {
          value: {
            type: "int32",
            id: 1
          }
        }
      },
      /**
       * Properties of a google.protobuf.UInt32Value message.
       * @interface IUInt32Value
       * @type {Object}
       * @property {number} [value]
       * @memberof common
       */
      UInt32Value: {
        fields: {
          value: {
            type: "uint32",
            id: 1
          }
        }
      },
      /**
       * Properties of a google.protobuf.BoolValue message.
       * @interface IBoolValue
       * @type {Object}
       * @property {boolean} [value]
       * @memberof common
       */
      BoolValue: {
        fields: {
          value: {
            type: "bool",
            id: 1
          }
        }
      },
      /**
       * Properties of a google.protobuf.StringValue message.
       * @interface IStringValue
       * @type {Object}
       * @property {string} [value]
       * @memberof common
       */
      StringValue: {
        fields: {
          value: {
            type: "string",
            id: 1
          }
        }
      },
      /**
       * Properties of a google.protobuf.BytesValue message.
       * @interface IBytesValue
       * @type {Object}
       * @property {Uint8Array} [value]
       * @memberof common
       */
      BytesValue: {
        fields: {
          value: {
            type: "bytes",
            id: 1
          }
        }
      }
    });
    common("field_mask", {
      /**
       * Properties of a google.protobuf.FieldMask message.
       * @interface IDoubleValue
       * @type {Object}
       * @property {number} [value]
       * @memberof common
       */
      FieldMask: {
        fields: {
          paths: {
            rule: "repeated",
            type: "string",
            id: 1
          }
        }
      }
    });
    common.get = function get(file) {
      return common[file] || null;
    };
  }
});

// node_modules/protobufjs/src/index.js
var require_src = __commonJS({
  "node_modules/protobufjs/src/index.js"(exports, module) {
    "use strict";
    var protobuf5 = module.exports = require_index_light();
    protobuf5.build = "full";
    protobuf5.tokenize = require_tokenize();
    protobuf5.parse = require_parse();
    protobuf5.common = require_common();
    protobuf5.Root._configure(protobuf5.Type, protobuf5.parse, protobuf5.common);
  }
});

// node_modules/protobufjs/index.js
var require_protobufjs = __commonJS({
  "node_modules/protobufjs/index.js"(exports, module) {
    "use strict";
    module.exports = require_src();
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/messages.js
function addType(root, name14, fields, oneofs) {
  const t = new import_protobufjs.default.Type(name14);
  for (const f of fields) {
    t.add(new import_protobufjs.default.Field(f.name, f.id, f.type, f.repeated ? "repeated" : void 0));
  }
  for (const o of oneofs ?? []) {
    t.add(new import_protobufjs.default.OneOf(o.name, o.fields));
  }
  root.add(t);
  return t;
}
function createMessageTypes() {
  const root = new import_protobufjs.default.Root();
  addType(root, "TextDeltaUpdate", [
    { id: 1, name: "text", type: "string" }
  ]);
  addType(root, "ThinkingDeltaUpdate", [
    { id: 1, name: "text", type: "string" }
  ]);
  addType(root, "TurnEnded", [
    { id: 1, name: "input_tokens", type: "uint32" },
    { id: 2, name: "output_tokens", type: "uint32" },
    { id: 3, name: "cache_read", type: "uint32" },
    { id: 4, name: "cache_write", type: "uint32" },
    { id: 5, name: "reasoning_tokens", type: "uint32" }
  ]);
  addType(root, "Heartbeat", []);
  root.add(new import_protobufjs.default.Enum("TodoStatus", {
    TODO_STATUS_UNSPECIFIED: 0,
    TODO_STATUS_PENDING: 1,
    TODO_STATUS_IN_PROGRESS: 2,
    TODO_STATUS_COMPLETED: 3,
    TODO_STATUS_CANCELLED: 4
  }));
  addType(root, "TodoItem", [
    { id: 1, name: "id", type: "string" },
    { id: 2, name: "content", type: "string" },
    { id: 3, name: "status", type: "TodoStatus" },
    { id: 4, name: "created_at", type: "int64" },
    { id: 5, name: "updated_at", type: "int64" },
    { id: 6, name: "dependencies", type: "string", repeated: true }
  ]);
  addType(root, "UpdateTodosArgs", [
    { id: 1, name: "todos", type: "TodoItem", repeated: true },
    { id: 2, name: "merge", type: "bool" }
  ]);
  addType(root, "UpdateTodosSuccess", [
    { id: 1, name: "todos", type: "TodoItem", repeated: true },
    { id: 2, name: "total_count", type: "int32" },
    { id: 3, name: "was_merge", type: "bool" }
  ]);
  addType(root, "UpdateTodosError", [{ id: 1, name: "error", type: "string" }]);
  addType(root, "UpdateTodosResult", [
    { id: 1, name: "success", type: "UpdateTodosSuccess" },
    { id: 2, name: "error", type: "UpdateTodosError" }
  ], [{ name: "result", fields: ["success", "error"] }]);
  addType(root, "UpdateTodosToolCall", [
    { id: 1, name: "args", type: "UpdateTodosArgs" },
    { id: 2, name: "result", type: "UpdateTodosResult" }
  ]);
  addType(root, "ReadToolArgs", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "offset", type: "int32" },
    { id: 3, name: "limit", type: "int32" }
  ]);
  addType(root, "ReadToolCall", [{ id: 1, name: "args", type: "ReadToolArgs" }]);
  addType(root, "ShellToolCall", [{ id: 1, name: "args", type: "ShellArgs" }]);
  addType(root, "DeleteToolCall", [{ id: 1, name: "args", type: "DeleteArgs" }]);
  addType(root, "GlobToolCall", [{ id: 1, name: "args", type: "GlobArgs" }]);
  addType(root, "GrepToolCall", [{ id: 1, name: "args", type: "GrepArgs" }]);
  addType(root, "EditToolArgs", [
    { id: 1, name: "path", type: "string" },
    { id: 6, name: "stream_content", type: "string" }
  ]);
  addType(root, "EditToolCall", [{ id: 1, name: "args", type: "EditToolArgs" }]);
  addType(root, "LsToolCall", [{ id: 1, name: "args", type: "LsArgs" }]);
  addType(root, "McpToolCall", [{ id: 1, name: "args", type: "McpArgs" }]);
  addType(root, "CreatePlanArgs", [
    { id: 1, name: "plan", type: "string" },
    { id: 2, name: "todos", type: "TodoItem", repeated: true },
    { id: 3, name: "overview", type: "string" },
    { id: 4, name: "name", type: "string" },
    { id: 5, name: "is_project", type: "bool" }
  ]);
  addType(root, "CreatePlanToolCall", [{ id: 1, name: "args", type: "CreatePlanArgs" }]);
  addType(root, "WebSearchToolArgs", [
    { id: 1, name: "search_term", type: "string" },
    { id: 2, name: "tool_call_id", type: "string" }
  ]);
  addType(root, "WebSearchToolCall", [{ id: 1, name: "args", type: "WebSearchToolArgs" }]);
  addType(root, "SubagentTypeUnspecified", []);
  addType(root, "SubagentTypeComputerUse", []);
  addType(root, "SubagentTypeCustom", [{ id: 1, name: "name", type: "string" }]);
  addType(root, "SubagentTypeExplore", []);
  addType(root, "SubagentTypeMediaReview", []);
  addType(root, "SubagentTypeBash", []);
  addType(root, "SubagentTypeBrowserUse", []);
  addType(root, "SubagentTypeShell", []);
  addType(root, "SubagentTypeVmSetupHelper", []);
  addType(root, "SubagentTypeDebug", []);
  addType(root, "SubagentTypeCursorGuide", []);
  addType(root, "SubagentTypeWatchVideo", []);
  addType(root, "SubagentType", [
    { id: 1, name: "unspecified", type: "SubagentTypeUnspecified" },
    { id: 2, name: "computer_use", type: "SubagentTypeComputerUse" },
    { id: 3, name: "custom", type: "SubagentTypeCustom" },
    { id: 4, name: "explore", type: "SubagentTypeExplore" },
    { id: 5, name: "media_review", type: "SubagentTypeMediaReview" },
    { id: 6, name: "bash", type: "SubagentTypeBash" },
    { id: 7, name: "browser_use", type: "SubagentTypeBrowserUse" },
    { id: 8, name: "shell", type: "SubagentTypeShell" },
    { id: 9, name: "vm_setup_helper", type: "SubagentTypeVmSetupHelper" },
    { id: 10, name: "debug", type: "SubagentTypeDebug" },
    { id: 11, name: "cursor_guide", type: "SubagentTypeCursorGuide" },
    { id: 12, name: "watch_video", type: "SubagentTypeWatchVideo" }
  ], [{
    name: "type",
    fields: [
      "unspecified",
      "computer_use",
      "custom",
      "explore",
      "media_review",
      "bash",
      "browser_use",
      "shell",
      "vm_setup_helper",
      "debug",
      "cursor_guide",
      "watch_video"
    ]
  }]);
  addType(root, "TaskToolArgs", [
    { id: 1, name: "description", type: "string" },
    { id: 2, name: "prompt", type: "string" },
    { id: 3, name: "subagent_type", type: "SubagentType" },
    { id: 4, name: "model", type: "string" },
    { id: 5, name: "resume", type: "string" },
    { id: 6, name: "agent_id", type: "string" }
  ]);
  addType(root, "TaskToolCall", [{ id: 1, name: "args", type: "TaskToolArgs" }]);
  addType(root, "SubagentArgs", [
    { id: 1, name: "tool_call_id", type: "string" },
    { id: 2, name: "subagent_type", type: "string" },
    { id: 3, name: "model_id", type: "string" },
    { id: 4, name: "prompt", type: "string" },
    { id: 5, name: "readonly", type: "bool" },
    { id: 6, name: "resume_agent_id", type: "string" },
    { id: 7, name: "run_in_background", type: "bool" }
  ]);
  addType(root, "SubagentSuccess", [
    { id: 1, name: "agent_id", type: "string" },
    { id: 2, name: "final_message", type: "string" },
    { id: 3, name: "tool_call_count", type: "int32" },
    { id: 4, name: "background_reason", type: "int32" },
    { id: 5, name: "transcript_path", type: "string" }
  ]);
  addType(root, "SubagentError", [
    { id: 1, name: "agent_id", type: "string" },
    { id: 2, name: "error", type: "string" }
  ]);
  addType(root, "SubagentResult", [
    { id: 1, name: "success", type: "SubagentSuccess" },
    { id: 2, name: "error", type: "SubagentError" }
  ], [{ name: "result", fields: ["success", "error"] }]);
  addType(root, "AskQuestionOption", [
    { id: 1, name: "id", type: "string" },
    { id: 2, name: "label", type: "string" }
  ]);
  addType(root, "AskQuestionItem", [
    { id: 1, name: "id", type: "string" },
    { id: 2, name: "prompt", type: "string" },
    { id: 3, name: "options", type: "AskQuestionOption", repeated: true },
    { id: 4, name: "allow_multiple", type: "bool" }
  ]);
  addType(root, "AskQuestionArgs", [
    { id: 1, name: "title", type: "string" },
    { id: 2, name: "questions", type: "AskQuestionItem", repeated: true },
    // #5/#6 drive Cursor's non-blocking AskQuestion: the client answers the
    // interaction with `async` right away and delivers the real answers later
    // through ConversationAction.async_ask_question_completion_action, keyed by
    // the originating tool call id. See protocol/ask-question.ts.
    { id: 5, name: "run_async", type: "bool" },
    { id: 6, name: "async_original_tool_call_id", type: "string" }
  ]);
  addType(root, "AskQuestionToolCall", [{ id: 1, name: "args", type: "AskQuestionArgs" }]);
  addType(root, "FetchToolArgs", [
    { id: 1, name: "url", type: "string" },
    { id: 2, name: "tool_call_id", type: "string" }
  ]);
  addType(root, "FetchToolCall", [{ id: 1, name: "args", type: "FetchToolArgs" }]);
  addType(root, "WebFetchToolCall", [{ id: 1, name: "args", type: "FetchToolArgs" }]);
  addType(root, "SwitchModeToolArgs", [
    { id: 1, name: "target_mode_id", type: "string" },
    { id: 2, name: "explanation", type: "string" },
    { id: 3, name: "tool_call_id", type: "string" }
  ]);
  addType(root, "SwitchModeSuccess", [
    { id: 1, name: "from_mode_id", type: "string" },
    { id: 2, name: "to_mode_id", type: "string" }
  ]);
  addType(root, "SwitchModeError", [{ id: 1, name: "error", type: "string" }]);
  addType(root, "SwitchModeRejected", [{ id: 1, name: "reason", type: "string" }]);
  addType(root, "SwitchModeResult", [
    { id: 1, name: "success", type: "SwitchModeSuccess" },
    { id: 2, name: "error", type: "SwitchModeError" },
    { id: 3, name: "rejected", type: "SwitchModeRejected" }
  ], [{ name: "result", fields: ["success", "error", "rejected"] }]);
  addType(root, "SwitchModeToolCall", [
    { id: 1, name: "args", type: "SwitchModeToolArgs" },
    { id: 2, name: "result", type: "SwitchModeResult" }
  ]);
  addType(root, "PiReadToolArgs", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "offset", type: "int32" },
    { id: 3, name: "limit", type: "int32" }
  ]);
  addType(root, "PiBashToolArgs", [
    { id: 1, name: "command", type: "string" },
    { id: 2, name: "timeout", type: "double" }
  ]);
  addType(root, "PiEditReplacement", [
    { id: 1, name: "old_text", type: "string" },
    { id: 2, name: "new_text", type: "string" }
  ]);
  addType(root, "PiEditToolArgs", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "edits", type: "PiEditReplacement", repeated: true }
  ]);
  addType(root, "PiWriteToolArgs", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "content", type: "string" }
  ]);
  addType(root, "PiGrepToolArgs", [
    { id: 1, name: "pattern", type: "string" },
    { id: 2, name: "path", type: "string" },
    { id: 3, name: "glob", type: "string" },
    { id: 4, name: "ignore_case", type: "bool" },
    { id: 5, name: "literal", type: "bool" },
    { id: 6, name: "context", type: "int32" },
    { id: 7, name: "limit", type: "int32" }
  ]);
  addType(root, "PiFindToolArgs", [
    { id: 1, name: "pattern", type: "string" },
    { id: 2, name: "path", type: "string" },
    { id: 3, name: "limit", type: "int32" }
  ]);
  addType(root, "PiLsToolArgs", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "limit", type: "int32" }
  ]);
  addType(root, "PiWriteToolCall", [{ id: 1, name: "args", type: "PiWriteToolArgs" }]);
  addType(root, "PiReadToolCall", [{ id: 1, name: "args", type: "PiReadToolArgs" }]);
  addType(root, "PiBashToolCall", [{ id: 1, name: "args", type: "PiBashToolArgs" }]);
  addType(root, "PiEditToolCall", [{ id: 1, name: "args", type: "PiEditToolArgs" }]);
  addType(root, "PiGrepToolCall", [{ id: 1, name: "args", type: "PiGrepToolArgs" }]);
  addType(root, "PiFindToolCall", [{ id: 1, name: "args", type: "PiFindToolArgs" }]);
  addType(root, "PiLsToolCall", [{ id: 1, name: "args", type: "PiLsToolArgs" }]);
  addType(root, "ReadTodosArgs", [
    { id: 1, name: "status_filter", type: "TodoStatus", repeated: true },
    { id: 2, name: "id_filter", type: "string", repeated: true }
  ]);
  addType(root, "ReadTodosToolCall", [{ id: 1, name: "args", type: "ReadTodosArgs" }]);
  addType(root, "AwaitArgs", [
    { id: 1, name: "task_id", type: "string" },
    { id: 2, name: "block_until_ms", type: "uint32" },
    { id: 3, name: "regex", type: "string" }
  ]);
  addType(root, "AwaitToolCall", [{ id: 1, name: "args", type: "AwaitArgs" }]);
  addType(root, "GetMcpToolsArgs", [
    { id: 1, name: "server", type: "string" },
    { id: 2, name: "tool_name", type: "string" },
    { id: 3, name: "pattern", type: "string" },
    { id: 4, name: "tool_call_id", type: "string" }
  ]);
  addType(root, "GetMcpToolsToolCall", [{ id: 1, name: "args", type: "GetMcpToolsArgs" }]);
  addType(root, "GenerateImageToolArgs", [
    { id: 1, name: "description", type: "string" },
    { id: 2, name: "file_path", type: "string" },
    { id: 5, name: "reference_image_paths", type: "string", repeated: true }
  ]);
  addType(root, "GenerateImageSuccess", [
    { id: 1, name: "file_path", type: "string" },
    { id: 2, name: "image_data", type: "string" }
  ]);
  addType(root, "GenerateImageError", [{ id: 1, name: "error", type: "string" }]);
  addType(root, "GenerateImageResult", [
    { id: 1, name: "success", type: "GenerateImageSuccess" },
    { id: 2, name: "error", type: "GenerateImageError" }
  ], [{ name: "result", fields: ["success", "error"] }]);
  addType(root, "GenerateImageToolCall", [
    { id: 1, name: "args", type: "GenerateImageToolArgs" },
    { id: 2, name: "result", type: "GenerateImageResult" }
  ]);
  addType(root, "GenerateImageRequestQuery", [
    { id: 1, name: "args", type: "GenerateImageToolArgs" },
    { id: 2, name: "tool_call_id", type: "string" }
  ]);
  addType(root, "ToolCall", [
    { id: 57, name: "tool_call_id", type: "string" },
    { id: 1, name: "shell_tool_call", type: "ShellToolCall" },
    { id: 3, name: "delete_tool_call", type: "DeleteToolCall" },
    { id: 4, name: "glob_tool_call", type: "GlobToolCall" },
    { id: 5, name: "grep_tool_call", type: "GrepToolCall" },
    { id: 8, name: "read_tool_call", type: "ReadToolCall" },
    { id: 9, name: "update_todos_tool_call", type: "UpdateTodosToolCall" },
    { id: 10, name: "read_todos_tool_call", type: "ReadTodosToolCall" },
    { id: 12, name: "edit_tool_call", type: "EditToolCall" },
    { id: 13, name: "ls_tool_call", type: "LsToolCall" },
    { id: 15, name: "mcp_tool_call", type: "McpToolCall" },
    { id: 17, name: "create_plan_tool_call", type: "CreatePlanToolCall" },
    { id: 18, name: "web_search_tool_call", type: "WebSearchToolCall" },
    { id: 19, name: "task_tool_call", type: "TaskToolCall" },
    { id: 23, name: "ask_question_tool_call", type: "AskQuestionToolCall" },
    { id: 24, name: "fetch_tool_call", type: "FetchToolCall" },
    { id: 25, name: "switch_mode_tool_call", type: "SwitchModeToolCall" },
    { id: 28, name: "generate_image_tool_call", type: "GenerateImageToolCall" },
    { id: 37, name: "web_fetch_tool_call", type: "WebFetchToolCall" },
    { id: 42, name: "await_tool_call", type: "AwaitToolCall" },
    { id: 44, name: "get_mcp_tools_tool_call", type: "GetMcpToolsToolCall" },
    { id: 61, name: "pi_read_tool_call", type: "PiReadToolCall" },
    { id: 62, name: "pi_bash_tool_call", type: "PiBashToolCall" },
    { id: 63, name: "pi_edit_tool_call", type: "PiEditToolCall" },
    { id: 64, name: "pi_write_tool_call", type: "PiWriteToolCall" },
    { id: 65, name: "pi_grep_tool_call", type: "PiGrepToolCall" },
    { id: 66, name: "pi_find_tool_call", type: "PiFindToolCall" },
    { id: 67, name: "pi_ls_tool_call", type: "PiLsToolCall" }
  ], [{
    name: "tool",
    fields: [
      "shell_tool_call",
      "delete_tool_call",
      "glob_tool_call",
      "grep_tool_call",
      "read_tool_call",
      "update_todos_tool_call",
      "read_todos_tool_call",
      "edit_tool_call",
      "ls_tool_call",
      "mcp_tool_call",
      "create_plan_tool_call",
      "web_search_tool_call",
      "task_tool_call",
      "ask_question_tool_call",
      "fetch_tool_call",
      "switch_mode_tool_call",
      "generate_image_tool_call",
      "web_fetch_tool_call",
      "await_tool_call",
      "get_mcp_tools_tool_call",
      "pi_read_tool_call",
      "pi_bash_tool_call",
      "pi_edit_tool_call",
      "pi_write_tool_call",
      "pi_grep_tool_call",
      "pi_find_tool_call",
      "pi_ls_tool_call"
    ]
  }]);
  addType(root, "ToolCallStarted", [
    { id: 1, name: "call_id", type: "string" },
    { id: 2, name: "tool_call", type: "ToolCall" },
    { id: 3, name: "model_call_id", type: "string" }
  ]);
  addType(root, "ToolCallCompleted", [
    { id: 1, name: "call_id", type: "string" },
    { id: 2, name: "tool_call", type: "ToolCall" },
    { id: 3, name: "model_call_id", type: "string" }
  ]);
  addType(root, "PartialToolCall", [
    { id: 1, name: "call_id", type: "string" },
    { id: 2, name: "tool_call", type: "ToolCall" },
    { id: 3, name: "args_text_delta", type: "string" },
    { id: 4, name: "model_call_id", type: "string" }
  ]);
  addType(root, "StepStarted", [
    { id: 1, name: "step_id", type: "uint64" }
  ]);
  addType(root, "StepCompleted", [
    { id: 1, name: "step_id", type: "uint64" },
    { id: 2, name: "step_duration_ms", type: "int64" }
  ]);
  addType(root, "InteractionUpdate", [
    { id: 1, name: "text_delta", type: "TextDeltaUpdate" },
    { id: 2, name: "tool_call_started", type: "ToolCallStarted" },
    { id: 3, name: "tool_call_completed", type: "ToolCallCompleted" },
    { id: 4, name: "thinking_delta", type: "ThinkingDeltaUpdate" },
    { id: 7, name: "partial_tool_call", type: "PartialToolCall" },
    { id: 13, name: "heartbeat", type: "Heartbeat" },
    { id: 14, name: "turn_ended", type: "TurnEnded" },
    { id: 16, name: "step_started", type: "StepStarted" },
    { id: 17, name: "step_completed", type: "StepCompleted" }
  ], [{ name: "update", fields: ["text_delta", "tool_call_started", "tool_call_completed", "thinking_delta", "partial_tool_call", "heartbeat", "turn_ended", "step_started", "step_completed"] }]);
  addType(root, "ReadArgs", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "tool_call_id", type: "string" },
    { id: 4, name: "offset", type: "int32" },
    { id: 5, name: "limit", type: "uint32" }
  ]);
  addType(root, "ReadSuccess", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "content", type: "string" },
    { id: 3, name: "total_lines", type: "int32" },
    { id: 4, name: "file_size", type: "int64" },
    { id: 5, name: "data", type: "bytes" },
    { id: 6, name: "truncated", type: "bool" },
    { id: 7, name: "output_blob_id", type: "bytes" },
    { id: 8, name: "range_applied", type: "bool" }
  ], [{ name: "output", fields: ["content", "data"] }]);
  addType(root, "ReadError", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "error", type: "string" }
  ]);
  addType(root, "ReadFileNotFound", [{ id: 1, name: "path", type: "string" }]);
  addType(root, "ReadPermissionDenied", [{ id: 1, name: "path", type: "string" }]);
  addType(root, "ReadInvalidFile", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "reason", type: "string" }
  ]);
  addType(root, "ReadResult", [
    { id: 1, name: "success", type: "ReadSuccess" },
    { id: 2, name: "error", type: "ReadError" },
    { id: 4, name: "file_not_found", type: "ReadFileNotFound" },
    { id: 5, name: "permission_denied", type: "ReadPermissionDenied" },
    { id: 6, name: "invalid_file", type: "ReadInvalidFile" }
  ], [
    {
      name: "result",
      fields: ["success", "error", "file_not_found", "permission_denied", "invalid_file"]
    }
  ]);
  addType(root, "GrepArgs", [
    { id: 1, name: "pattern", type: "string" },
    { id: 2, name: "path", type: "string" },
    { id: 3, name: "glob", type: "string" },
    { id: 4, name: "output_mode", type: "string" },
    { id: 8, name: "case_insensitive", type: "bool" },
    { id: 10, name: "head_limit", type: "int32" },
    { id: 14, name: "tool_call_id", type: "string" },
    { id: 16, name: "offset", type: "int32" }
  ]);
  addType(root, "GrepError", [{ id: 1, name: "error", type: "string" }]);
  addType(root, "GrepFilesResult", [
    { id: 1, name: "files", type: "string", repeated: true },
    { id: 2, name: "total_files", type: "int32" },
    { id: 3, name: "client_truncated", type: "bool" }
  ]);
  addType(root, "GrepContentMatch", [
    { id: 1, name: "line_number", type: "int32" },
    { id: 2, name: "content", type: "string" }
  ]);
  addType(root, "GrepFileMatch", [
    { id: 1, name: "file", type: "string" },
    { id: 2, name: "matches", type: "GrepContentMatch", repeated: true }
  ]);
  addType(root, "GrepContentResult", [
    { id: 1, name: "matches", type: "GrepFileMatch", repeated: true },
    { id: 2, name: "total_lines", type: "int32" },
    { id: 3, name: "total_matched_lines", type: "int32" }
  ]);
  addType(root, "GrepUnionResult", [
    { id: 2, name: "files", type: "GrepFilesResult" },
    { id: 3, name: "content", type: "GrepContentResult" }
  ], [{ name: "result", fields: ["files", "content"] }]);
  {
    const t = new import_protobufjs.default.Type("GrepSuccess");
    t.add(new import_protobufjs.default.Field("pattern", 1, "string"));
    t.add(new import_protobufjs.default.Field("path", 2, "string"));
    t.add(new import_protobufjs.default.Field("output_mode", 3, "string"));
    t.add(new import_protobufjs.default.MapField("workspace_results", 4, "string", "GrepUnionResult"));
    root.add(t);
  }
  addType(root, "GrepResult", [
    { id: 1, name: "success", type: "GrepSuccess" },
    { id: 2, name: "error", type: "GrepError" }
  ], [{ name: "result", fields: ["success", "error"] }]);
  addType(root, "WriteArgs", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "file_text", type: "string" },
    { id: 3, name: "tool_call_id", type: "string" },
    { id: 4, name: "return_file_content_after_write", type: "bool" },
    { id: 5, name: "file_bytes", type: "bytes" },
    { id: 6, name: "encoding_hint", type: "string" }
  ]);
  addType(root, "WriteSuccess", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "lines_created", type: "int32" },
    { id: 3, name: "file_size", type: "int32" },
    { id: 4, name: "file_content_after_write", type: "string" }
  ]);
  addType(root, "WriteError", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "error", type: "string" }
  ]);
  addType(root, "WritePermissionDenied", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "directory", type: "string" },
    { id: 3, name: "operation", type: "string" },
    { id: 4, name: "error", type: "string" },
    { id: 5, name: "is_readonly", type: "bool" }
  ]);
  addType(root, "WriteResult", [
    { id: 1, name: "success", type: "WriteSuccess" },
    { id: 3, name: "permission_denied", type: "WritePermissionDenied" },
    { id: 5, name: "error", type: "WriteError" }
  ], [{ name: "result", fields: ["success", "permission_denied", "error"] }]);
  addType(root, "PiWriteArgs", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "content", type: "string" }
  ]);
  addType(root, "PiWriteSuccess", [
    { id: 1, name: "output", type: "string" }
  ]);
  addType(root, "PiWriteError", [
    { id: 1, name: "error", type: "string" }
  ]);
  addType(root, "PiWriteRejected", [
    { id: 1, name: "reason", type: "string" }
  ]);
  addType(root, "PiWriteResult", [
    { id: 1, name: "success", type: "PiWriteSuccess" },
    { id: 2, name: "error", type: "PiWriteError" },
    { id: 3, name: "rejected", type: "PiWriteRejected" }
  ], [{ name: "result", fields: ["success", "error", "rejected"] }]);
  addType(root, "PiTruncation", [
    { id: 1, name: "truncated", type: "bool" },
    { id: 2, name: "truncated_by", type: "string" },
    { id: 3, name: "total_lines", type: "uint32" },
    { id: 4, name: "output_lines", type: "uint32" },
    { id: 5, name: "output_bytes", type: "uint32" },
    { id: 6, name: "max_lines", type: "uint32" },
    { id: 7, name: "max_bytes", type: "uint32" },
    { id: 8, name: "first_line_exceeds_limit", type: "bool" },
    { id: 9, name: "last_line_partial", type: "bool" }
  ]);
  addType(root, "PiOutputSuccess", [
    { id: 1, name: "output", type: "string" },
    { id: 2, name: "truncation", type: "PiTruncation" }
  ]);
  addType(root, "PiExecError", [{ id: 1, name: "error", type: "string" }]);
  addType(root, "PiExecRejected", [{ id: 1, name: "reason", type: "string" }]);
  for (const resultType of [
    "PiReadExecResult",
    "PiBashExecResult",
    "PiGrepExecResult",
    "PiFindExecResult",
    "PiLsExecResult"
  ]) {
    addType(root, resultType, [
      { id: 1, name: "success", type: "PiOutputSuccess" },
      { id: 2, name: "error", type: "PiExecError" }
    ], [{ name: "result", fields: ["success", "error"] }]);
  }
  addType(root, "PiEditExecResult", [
    { id: 1, name: "success", type: "PiOutputSuccess" },
    { id: 2, name: "error", type: "PiExecError" },
    { id: 3, name: "rejected", type: "PiExecRejected" }
  ], [{ name: "result", fields: ["success", "error", "rejected"] }]);
  addType(root, "DeleteArgs", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "tool_call_id", type: "string" }
  ]);
  addType(root, "DeleteSuccess", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "deleted_file", type: "string" }
  ]);
  addType(root, "DeleteError", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "error", type: "string" }
  ]);
  addType(root, "DeleteResult", [
    { id: 1, name: "success", type: "DeleteSuccess" },
    { id: 7, name: "error", type: "DeleteError" }
  ], [{ name: "result", fields: ["success", "error"] }]);
  addType(root, "LsArgs", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "ignore", type: "string", repeated: true },
    { id: 3, name: "tool_call_id", type: "string" }
  ]);
  addType(root, "LsDirectoryTreeFile", [{ id: 1, name: "name", type: "string" }]);
  addType(root, "LsDirectoryTreeNode", [
    { id: 1, name: "abs_path", type: "string" },
    { id: 2, name: "children_dirs", type: "LsDirectoryTreeNode", repeated: true },
    { id: 3, name: "children_files", type: "LsDirectoryTreeFile", repeated: true },
    { id: 6, name: "num_files", type: "int32" }
  ]);
  addType(root, "LsSuccess", [
    { id: 1, name: "directory_tree_root", type: "LsDirectoryTreeNode" }
  ]);
  addType(root, "LsError", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "error", type: "string" }
  ]);
  addType(root, "LsResult", [
    { id: 1, name: "success", type: "LsSuccess" },
    { id: 2, name: "error", type: "LsError" }
  ], [{ name: "result", fields: ["success", "error"] }]);
  addType(root, "ShellArgs", [
    { id: 1, name: "command", type: "string" },
    { id: 2, name: "working_directory", type: "string" },
    { id: 3, name: "timeout", type: "uint32" },
    { id: 4, name: "tool_call_id", type: "string" },
    // Canonical agent.v1 fields used by the native CLI to distinguish a
    // foreground cancellation deadline from a soft background handoff.
    { id: 13, name: "timeout_behavior", type: "uint32" },
    { id: 14, name: "hard_timeout", type: "uint32" }
  ]);
  addType(root, "ShellStreamStart", []);
  addType(root, "ShellStreamStdout", [{ id: 1, name: "data", type: "string" }]);
  addType(root, "ShellStreamStderr", [{ id: 1, name: "data", type: "string" }]);
  addType(root, "ShellStreamExit", [
    { id: 1, name: "code", type: "uint32" },
    { id: 2, name: "cwd", type: "string" },
    { id: 4, name: "aborted", type: "bool" },
    { id: 5, name: "abort_reason", type: "uint32" },
    { id: 6, name: "local_execution_time_ms", type: "uint32" }
  ]);
  addType(root, "ShellStreamBackgrounded", [
    { id: 1, name: "shell_id", type: "uint32" },
    { id: 2, name: "command", type: "string" },
    { id: 3, name: "working_directory", type: "string" },
    { id: 4, name: "pid", type: "uint32" },
    { id: 5, name: "ms_to_wait", type: "uint32" },
    { id: 6, name: "reason", type: "uint32" }
  ]);
  addType(root, "ShellRejected", [
    { id: 1, name: "command", type: "string" },
    { id: 2, name: "working_directory", type: "string" },
    { id: 3, name: "reason", type: "string" }
  ]);
  addType(root, "ShellPermissionDenied", [
    { id: 1, name: "command", type: "string" },
    { id: 2, name: "working_directory", type: "string" },
    { id: 3, name: "error", type: "string" }
  ]);
  addType(root, "ShellSuccess", [
    { id: 1, name: "command", type: "string" },
    { id: 2, name: "working_directory", type: "string" },
    { id: 3, name: "exit_code", type: "int32" },
    { id: 4, name: "signal", type: "string" },
    { id: 5, name: "stdout", type: "string" },
    { id: 6, name: "stderr", type: "string" },
    { id: 7, name: "execution_time", type: "int32" },
    { id: 9, name: "shell_id", type: "uint32" },
    { id: 11, name: "pid", type: "uint32" },
    { id: 12, name: "ms_to_wait", type: "int32" },
    { id: 13, name: "local_execution_time_ms", type: "int32" },
    { id: 14, name: "background_reason", type: "uint32" }
  ]);
  addType(root, "ShellFailure", [
    { id: 1, name: "command", type: "string" },
    { id: 2, name: "working_directory", type: "string" },
    { id: 3, name: "exit_code", type: "int32" },
    { id: 4, name: "signal", type: "string" },
    { id: 5, name: "stdout", type: "string" },
    { id: 6, name: "stderr", type: "string" },
    { id: 7, name: "execution_time", type: "int32" },
    { id: 10, name: "abort_reason", type: "uint32" },
    { id: 11, name: "aborted", type: "bool" }
  ]);
  addType(root, "ShellTimeout", [
    { id: 1, name: "command", type: "string" },
    { id: 2, name: "working_directory", type: "string" },
    { id: 3, name: "timeout_ms", type: "int32" }
  ]);
  addType(root, "ShellResult", [
    { id: 1, name: "success", type: "ShellSuccess" },
    { id: 2, name: "failure", type: "ShellFailure" },
    { id: 3, name: "timeout", type: "ShellTimeout" },
    { id: 4, name: "rejected", type: "ShellRejected" },
    { id: 102, name: "is_background", type: "bool" },
    { id: 104, name: "pid", type: "uint32" }
  ], [{ name: "result", fields: ["success", "failure", "timeout", "rejected"] }]);
  addType(root, "DiagnosticsError", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "error", type: "string" }
  ]);
  addType(root, "DiagnosticsResult", [
    { id: 2, name: "error", type: "DiagnosticsError" }
  ], [{ name: "result", fields: ["error"] }]);
  addType(root, "FetchError", [
    { id: 1, name: "url", type: "string" },
    { id: 2, name: "error", type: "string" }
  ]);
  addType(root, "FetchResult", [
    { id: 2, name: "error", type: "FetchError" }
  ], [{ name: "result", fields: ["error"] }]);
  addType(root, "RecordScreenFailure", [
    { id: 1, name: "error", type: "string" }
  ]);
  addType(root, "RecordScreenResult", [
    { id: 4, name: "failure", type: "RecordScreenFailure" }
  ], [{ name: "result", fields: ["failure"] }]);
  addType(root, "ComputerUseError", [
    { id: 1, name: "error", type: "string" }
  ]);
  addType(root, "ComputerUseResult", [
    { id: 2, name: "error", type: "ComputerUseError" }
  ], [{ name: "result", fields: ["error"] }]);
  addType(root, "WriteShellStdinError", [
    { id: 1, name: "error", type: "string" }
  ]);
  addType(root, "WriteShellStdinResult", [
    { id: 2, name: "error", type: "WriteShellStdinError" }
  ], [{ name: "result", fields: ["error"] }]);
  addType(root, "SubagentAwaitError", [
    { id: 1, name: "agent_id", type: "string" },
    { id: 2, name: "error", type: "string" }
  ]);
  addType(root, "SubagentAwaitResult", [
    { id: 4, name: "error", type: "SubagentAwaitError" }
  ], [{ name: "result", fields: ["error"] }]);
  addType(root, "SmartModeClassifierError", [
    { id: 1, name: "error", type: "string" }
  ]);
  addType(root, "SmartModeClassifierResult", [
    { id: 2, name: "error", type: "SmartModeClassifierError" }
  ], [{ name: "result", fields: ["error"] }]);
  addType(root, "CanvasDiagnosticsError", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "error", type: "string" }
  ]);
  addType(root, "CanvasDiagnosticsResult", [
    { id: 2, name: "error", type: "CanvasDiagnosticsError" }
  ], [{ name: "result", fields: ["error"] }]);
  addType(root, "ShellAllowlistPrecheckResult", [
    { id: 1, name: "allowlisted", type: "bool" }
  ]);
  addType(root, "McpAllowlistPrecheckResult", [
    { id: 1, name: "allowlisted", type: "bool" }
  ]);
  addType(root, "WebFetchAllowlistPrecheckResult", [
    { id: 1, name: "allowlisted", type: "bool" }
  ]);
  addType(root, "ForceBackgroundShellResult", [
    { id: 1, name: "status", type: "uint32" }
  ]);
  addType(root, "ForceBackgroundSubagentResult", [
    { id: 1, name: "status", type: "uint32" }
  ]);
  addType(root, "ConversationSearchHit", [
    { id: 1, name: "conversation_id", type: "string" },
    { id: 2, name: "title", type: "string" },
    { id: 3, name: "source", type: "uint32" },
    { id: 4, name: "updated_at_ms", type: "int64" },
    { id: 5, name: "snippet", type: "string" }
  ]);
  addType(root, "ConversationSearchSuccess", [
    { id: 1, name: "hits", type: "ConversationSearchHit", repeated: true },
    { id: 2, name: "truncated", type: "bool" },
    { id: 3, name: "partial", type: "bool" },
    { id: 4, name: "rebuilding", type: "bool" }
  ]);
  addType(root, "ConversationSearchError", [
    { id: 1, name: "error", type: "string" }
  ]);
  addType(root, "ConversationSearchResult", [
    { id: 1, name: "success", type: "ConversationSearchSuccess" },
    { id: 2, name: "error", type: "ConversationSearchError" }
  ], [{ name: "result", fields: ["success", "error"] }]);
  addType(root, "AgentStoreConflictError", [
    { id: 1, name: "error", type: "string" }
  ]);
  addType(root, "AgentStoreConflictResult", [
    { id: 2, name: "error", type: "AgentStoreConflictError" }
  ], [{ name: "result", fields: ["error"] }]);
  addType(root, "AdoptResult", [
    { id: 1, name: "source_agent_id", type: "string" },
    { id: 2, name: "target_agent_id", type: "string" },
    { id: 3, name: "project_root_id", type: "string" },
    { id: 5, name: "error", type: "string" }
  ], [{ name: "result", fields: ["error"] }]);
  addType(root, "GitDiffChunk", [
    { id: 1, name: "content", type: "string" },
    { id: 2, name: "lines", type: "string", repeated: true },
    { id: 3, name: "old_start", type: "int32" },
    { id: 4, name: "old_lines", type: "int32" },
    { id: 5, name: "new_start", type: "int32" },
    { id: 6, name: "new_lines", type: "int32" }
  ]);
  addType(root, "GitFileDiff", [
    { id: 1, name: "from", type: "string" },
    { id: 2, name: "to", type: "string" },
    { id: 3, name: "chunks", type: "GitDiffChunk", repeated: true },
    { id: 4, name: "added", type: "int32" },
    { id: 5, name: "removed", type: "int32" },
    { id: 6, name: "before_file_contents", type: "string" },
    { id: 7, name: "after_file_contents", type: "string" },
    { id: 8, name: "is_generated", type: "bool" }
  ]);
  addType(root, "GitDiff", [
    { id: 1, name: "diffs", type: "GitFileDiff", repeated: true },
    { id: 2, name: "diff_type", type: "uint32" }
  ]);
  addType(root, "GitDiffSubmoduleDiff", [
    { id: 1, name: "relative_path", type: "string" },
    { id: 2, name: "diff", type: "GitDiff" },
    { id: 3, name: "errored", type: "bool" }
  ]);
  addType(root, "GetDiffRequest", [
    { id: 1, name: "cwd", type: "string" },
    { id: 2, name: "ref", type: "string" },
    { id: 3, name: "base_ref", type: "string" },
    { id: 4, name: "merge_base", type: "bool" },
    { id: 5, name: "target_paths", type: "string", repeated: true },
    { id: 6, name: "unified_context_lines", type: "int32" },
    { id: 7, name: "max_untracked_files", type: "int32" },
    { id: 8, name: "output_format", type: "uint32" },
    { id: 9, name: "submodule_recurse_depth", type: "int32" },
    { id: 10, name: "include_space_changes", type: "bool" },
    { id: 11, name: "committed_only", type: "bool" },
    { id: 12, name: "compute_patch_id", type: "bool" },
    { id: 13, name: "return_head_sha", type: "bool" },
    { id: 14, name: "max_response_bytes", type: "int32" }
  ]);
  addType(root, "GetDiffResponse", [
    { id: 1, name: "diff", type: "GitDiff" },
    { id: 2, name: "submodule_diffs", type: "GitDiffSubmoduleDiff", repeated: true },
    { id: 3, name: "patch_id", type: "string" },
    { id: 4, name: "head_sha", type: "string" },
    { id: 5, name: "has_uncommitted_changes", type: "bool" }
  ]);
  addType(root, "BackgroundShellSpawnArgs", [
    { id: 1, name: "command", type: "string" },
    { id: 2, name: "working_directory", type: "string" },
    { id: 3, name: "tool_call_id", type: "string" },
    { id: 6, name: "enable_write_shell_stdin_tool", type: "bool" },
    { id: 7, name: "description", type: "string" },
    { id: 12, name: "skip_approval", type: "bool" },
    { id: 13, name: "conversation_id", type: "string" }
  ]);
  addType(root, "BackgroundShellSpawnSuccess", [
    { id: 1, name: "shell_id", type: "uint32" },
    { id: 2, name: "command", type: "string" },
    { id: 3, name: "working_directory", type: "string" },
    { id: 4, name: "pid", type: "uint32" }
  ]);
  addType(root, "BackgroundShellSpawnError", [
    { id: 1, name: "command", type: "string" },
    { id: 2, name: "working_directory", type: "string" },
    { id: 3, name: "error", type: "string" }
  ]);
  addType(root, "BackgroundShellSpawnResult", [
    { id: 1, name: "success", type: "BackgroundShellSpawnSuccess" },
    { id: 2, name: "error", type: "BackgroundShellSpawnError" },
    { id: 3, name: "rejected", type: "ShellRejected" },
    { id: 4, name: "permission_denied", type: "ShellPermissionDenied" }
  ], [{ name: "result", fields: ["success", "error", "rejected", "permission_denied"] }]);
  addType(root, "ShellStream", [
    { id: 1, name: "stdout", type: "ShellStreamStdout" },
    { id: 2, name: "stderr", type: "ShellStreamStderr" },
    { id: 3, name: "exit", type: "ShellStreamExit" },
    { id: 4, name: "start", type: "ShellStreamStart" },
    { id: 5, name: "rejected", type: "ShellRejected" },
    { id: 6, name: "permission_denied", type: "ShellPermissionDenied" },
    { id: 7, name: "backgrounded", type: "ShellStreamBackgrounded" }
  ], [{ name: "event", fields: ["stdout", "stderr", "exit", "start", "rejected", "permission_denied", "backgrounded"] }]);
  addType(root, "GlobArgs", [
    { id: 1, name: "target_directory", type: "string" },
    { id: 2, name: "glob_pattern", type: "string" }
  ]);
  addType(root, "GlobResult", [
    { id: 1, name: "files", type: "string", repeated: true },
    { id: 2, name: "error", type: "string" }
  ]);
  addType(root, "McpArgs", [
    { id: 1, name: "name", type: "string" },
    { id: 2, name: "args", type: "bytes", repeated: true },
    { id: 3, name: "tool_call_id", type: "string" },
    { id: 4, name: "provider_identifier", type: "string" },
    { id: 5, name: "tool_name", type: "string" }
  ]);
  addType(root, "McpTextContent", [{ id: 1, name: "text", type: "string" }]);
  addType(root, "McpToolResultContentItem", [{ id: 1, name: "text", type: "McpTextContent" }], [{ name: "content", fields: ["text"] }]);
  addType(root, "McpSuccess", [
    { id: 1, name: "content", type: "McpToolResultContentItem", repeated: true },
    { id: 2, name: "is_error", type: "bool" }
  ]);
  addType(root, "McpError", [{ id: 1, name: "error", type: "string" }]);
  addType(root, "McpResult", [
    { id: 1, name: "success", type: "McpSuccess" },
    { id: 2, name: "error", type: "McpError" }
  ], [{ name: "result", fields: ["success", "error"] }]);
  addType(root, "McpToolDefinition", [
    { id: 1, name: "name", type: "string" },
    { id: 2, name: "description", type: "string" },
    { id: 3, name: "input_schema", type: "bytes" },
    { id: 4, name: "provider_identifier", type: "string" },
    { id: 5, name: "tool_name", type: "string" }
  ]);
  addType(root, "SmartModeApproval", [
    { id: 1, name: "request_id", type: "string" },
    { id: 2, name: "reason", type: "string" }
  ]);
  addType(root, "OutputLocation", [
    { id: 1, name: "file_path", type: "string" },
    { id: 2, name: "size_bytes", type: "int64" },
    { id: 3, name: "line_count", type: "int64" }
  ]);
  addType(root, "ListMcpResourcesExecArgs", [
    { id: 1, name: "server", type: "string" }
  ]);
  {
    const t = new import_protobufjs.default.Type("ListMcpResourcesExecResult_McpResource");
    t.add(new import_protobufjs.default.Field("uri", 1, "string"));
    t.add(new import_protobufjs.default.Field("name", 2, "string"));
    t.add(new import_protobufjs.default.Field("description", 3, "string"));
    t.add(new import_protobufjs.default.Field("mime_type", 4, "string"));
    t.add(new import_protobufjs.default.Field("server", 5, "string"));
    t.add(new import_protobufjs.default.MapField("annotations", 6, "string", "string"));
    root.add(t);
  }
  addType(root, "ListMcpResourcesSuccess", [
    { id: 1, name: "resources", type: "ListMcpResourcesExecResult_McpResource", repeated: true }
  ]);
  addType(root, "ListMcpResourcesError", [{ id: 1, name: "error", type: "string" }]);
  addType(root, "ListMcpResourcesRejected", [{ id: 1, name: "reason", type: "string" }]);
  addType(root, "ListMcpResourcesExecResult", [
    { id: 1, name: "success", type: "ListMcpResourcesSuccess" },
    { id: 2, name: "error", type: "ListMcpResourcesError" },
    { id: 3, name: "rejected", type: "ListMcpResourcesRejected" }
  ], [{ name: "result", fields: ["success", "error", "rejected"] }]);
  addType(root, "ReadMcpResourceExecArgs", [
    { id: 1, name: "server", type: "string" },
    { id: 2, name: "uri", type: "string" },
    { id: 3, name: "download_path", type: "string" },
    { id: 4, name: "tool_call_id", type: "string" },
    { id: 5, name: "smart_mode_approval", type: "SmartModeApproval" }
  ]);
  {
    const t = new import_protobufjs.default.Type("ReadMcpResourceSuccess");
    t.add(new import_protobufjs.default.Field("uri", 1, "string"));
    t.add(new import_protobufjs.default.Field("name", 2, "string"));
    t.add(new import_protobufjs.default.Field("description", 3, "string"));
    t.add(new import_protobufjs.default.Field("mime_type", 4, "string"));
    t.add(new import_protobufjs.default.Field("text", 5, "string"));
    t.add(new import_protobufjs.default.Field("blob", 6, "bytes"));
    t.add(new import_protobufjs.default.MapField("annotations", 7, "string", "string"));
    t.add(new import_protobufjs.default.Field("download_path", 8, "string"));
    t.add(new import_protobufjs.default.Field("output_location", 9, "OutputLocation"));
    t.add(new import_protobufjs.default.OneOf("content", ["text", "blob"]));
    root.add(t);
  }
  addType(root, "ReadMcpResourceError", [
    { id: 1, name: "uri", type: "string" },
    { id: 2, name: "error", type: "string" }
  ]);
  addType(root, "ReadMcpResourceRejected", [
    { id: 1, name: "uri", type: "string" },
    { id: 2, name: "reason", type: "string" }
  ]);
  addType(root, "ReadMcpResourceNotFound", [{ id: 1, name: "uri", type: "string" }]);
  addType(root, "ReadMcpResourceExecResult", [
    { id: 1, name: "success", type: "ReadMcpResourceSuccess" },
    { id: 2, name: "error", type: "ReadMcpResourceError" },
    { id: 3, name: "rejected", type: "ReadMcpResourceRejected" },
    { id: 4, name: "not_found", type: "ReadMcpResourceNotFound" }
  ], [{ name: "result", fields: ["success", "error", "rejected", "not_found"] }]);
  addType(root, "RequestContextArgs", [
    { id: 2, name: "notes_session_id", type: "string" },
    { id: 3, name: "workspace_id", type: "string" },
    { id: 7, name: "use_cached", type: "bool" }
  ]);
  addType(root, "RequestContextEnv", [
    { id: 1, name: "os_version", type: "string" },
    { id: 2, name: "workspace_paths", type: "string", repeated: true },
    { id: 3, name: "shell", type: "string" },
    { id: 5, name: "sandbox_enabled", type: "bool" },
    { id: 7, name: "terminals_folder", type: "string" },
    { id: 10, name: "time_zone", type: "string" },
    { id: 11, name: "project_folder", type: "string" },
    { id: 12, name: "agent_transcripts_folder", type: "string" },
    { id: 14, name: "sandbox_supported", type: "bool" },
    { id: 20, name: "is_working_dir_home_dir", type: "bool" },
    { id: 21, name: "process_working_directory", type: "string" }
  ]);
  addType(root, "CursorRule", [
    { id: 1, name: "full_path", type: "string" },
    { id: 2, name: "content", type: "string" }
  ]);
  addType(root, "RepositoryIndexingInfo", [
    { id: 1, name: "relative_workspace_path", type: "string" },
    { id: 2, name: "remote_urls", type: "string", repeated: true },
    { id: 3, name: "remote_names", type: "string", repeated: true },
    { id: 4, name: "repo_name", type: "string" },
    { id: 5, name: "repo_owner", type: "string" },
    { id: 6, name: "is_tracked", type: "bool" },
    { id: 7, name: "is_local", type: "bool" },
    { id: 9, name: "workspace_uri", type: "string" }
  ]);
  addType(root, "GitRepoInfo", [
    { id: 1, name: "path", type: "string" },
    { id: 2, name: "status", type: "string" },
    { id: 3, name: "branch_name", type: "string" },
    { id: 4, name: "remote_url", type: "string" }
  ]);
  addType(root, "AgentSkill", [
    { id: 1, name: "full_path", type: "string" },
    { id: 2, name: "content", type: "string" },
    { id: 3, name: "description", type: "string" }
  ]);
  addType(root, "CustomSubagent", [
    { id: 1, name: "full_path", type: "string" },
    { id: 2, name: "name", type: "string" },
    { id: 3, name: "description", type: "string" },
    { id: 6, name: "prompt", type: "string" }
  ]);
  addType(root, "McpFsToolDescriptor", [
    { id: 1, name: "tool_name", type: "string" },
    { id: 3, name: "description", type: "string" },
    { id: 4, name: "input_schema", type: "bytes" }
  ]);
  addType(root, "McpDescriptor", [
    { id: 1, name: "server_name", type: "string" },
    { id: 2, name: "server_identifier", type: "string" },
    { id: 5, name: "tools", type: "McpFsToolDescriptor", repeated: true }
  ]);
  addType(root, "McpFileSystemOptions", [
    { id: 1, name: "enabled", type: "bool" },
    { id: 2, name: "workspace_project_dir", type: "string" },
    { id: 3, name: "mcp_descriptors", type: "McpDescriptor", repeated: true }
  ]);
  addType(root, "McpMetaToolOptions", [
    { id: 1, name: "enabled", type: "bool" },
    { id: 2, name: "mcp_descriptors", type: "McpDescriptor", repeated: true }
  ]);
  addType(root, "PermissionsAutoRunInstructions", [
    { id: 1, name: "allow_instructions", type: "string", repeated: true },
    { id: 2, name: "block_instructions", type: "string", repeated: true }
  ]);
  addType(root, "RequestContextPayload", [
    { id: 2, name: "rules", type: "CursorRule", repeated: true },
    { id: 4, name: "env", type: "RequestContextEnv" },
    { id: 6, name: "repository_info", type: "RepositoryIndexingInfo", repeated: true },
    { id: 7, name: "tools", type: "McpToolDefinition", repeated: true },
    { id: 11, name: "git_repos", type: "GitRepoInfo", repeated: true },
    { id: 13, name: "project_layouts", type: "LsDirectoryTreeNode", repeated: true },
    { id: 17, name: "web_search_enabled", type: "bool" },
    { id: 22, name: "custom_subagents", type: "CustomSubagent", repeated: true },
    { id: 23, name: "mcp_file_system_options", type: "McpFileSystemOptions" },
    { id: 24, name: "web_fetch_enabled", type: "bool" },
    { id: 25, name: "hooks_additional_context", type: "string" },
    { id: 29, name: "agent_skills", type: "AgentSkill", repeated: true },
    { id: 33, name: "git_repo_info_complete", type: "bool" },
    { id: 34, name: "mcp_meta_tool_options", type: "McpMetaToolOptions" },
    { id: 36, name: "mcp_info_complete", type: "bool" },
    { id: 39, name: "rules_info_complete", type: "bool" },
    { id: 40, name: "env_info_complete", type: "bool" },
    { id: 41, name: "repository_info_complete", type: "bool" },
    { id: 42, name: "custom_subagents_info_complete", type: "bool" },
    { id: 43, name: "agent_skills_info_complete", type: "bool" },
    { id: 44, name: "mcp_file_system_info_complete", type: "bool" },
    { id: 45, name: "git_status_info_complete", type: "bool" },
    { id: 46, name: "user_permissions_auto_run", type: "PermissionsAutoRunInstructions" },
    { id: 47, name: "project_permissions_auto_run", type: "PermissionsAutoRunInstructions" }
  ]);
  addType(root, "RequestContextSuccess", [
    { id: 1, name: "request_context", type: "RequestContextPayload" }
  ]);
  addType(root, "RequestContextResult", [
    { id: 1, name: "success", type: "RequestContextSuccess" }
  ]);
  addType(root, "McpStateExecArgs", [
    { id: 1, name: "server_identifiers", type: "string", repeated: true },
    { id: 2, name: "kick_only", type: "bool" }
  ]);
  addType(root, "McpInstructions", [
    { id: 1, name: "server_name", type: "string" },
    { id: 2, name: "instructions", type: "string" },
    { id: 3, name: "server_identifier", type: "string" }
  ]);
  addType(root, "McpStateServer", [
    { id: 1, name: "server_name", type: "string" },
    { id: 2, name: "server_identifier", type: "string" },
    { id: 3, name: "plugin", type: "string" },
    { id: 4, name: "marketplace", type: "string" },
    // Unlike McpDescriptor (#23/#34), exec #36 returns the full canonical
    // McpToolDefinition shape, including composite name and provider identity.
    { id: 5, name: "tools", type: "McpToolDefinition", repeated: true },
    { id: 6, name: "instructions", type: "McpInstructions", repeated: true },
    { id: 7, name: "status", type: "string" }
  ]);
  addType(root, "McpStateSuccess", [
    { id: 1, name: "servers", type: "McpStateServer", repeated: true }
  ]);
  addType(root, "McpStateError", [{ id: 1, name: "error", type: "string" }]);
  addType(root, "McpStateRejected", [{ id: 1, name: "reason", type: "string" }]);
  addType(root, "McpStateExecResult", [
    { id: 1, name: "success", type: "McpStateSuccess" },
    { id: 2, name: "error", type: "McpStateError" },
    { id: 3, name: "rejected", type: "McpStateRejected" }
  ], [{ name: "result", fields: ["success", "error", "rejected"] }]);
  addType(root, "ExecServerMessage", [
    { id: 1, name: "id", type: "uint32" },
    { id: 15, name: "exec_id", type: "string" },
    { id: 19, name: "span", type: "string" },
    { id: 2, name: "shell_args", type: "ShellArgs" },
    { id: 3, name: "write_args", type: "WriteArgs" },
    { id: 4, name: "delete_args", type: "DeleteArgs" },
    { id: 5, name: "grep_args", type: "GrepArgs" },
    { id: 7, name: "read_args", type: "ReadArgs" },
    { id: 8, name: "ls_args", type: "LsArgs" },
    { id: 10, name: "request_context_args", type: "RequestContextArgs" },
    { id: 11, name: "mcp_args", type: "McpArgs" },
    { id: 14, name: "shell_stream_args", type: "ShellArgs" },
    { id: 16, name: "background_shell_spawn_args", type: "BackgroundShellSpawnArgs" },
    { id: 17, name: "list_mcp_resources_exec_args", type: "ListMcpResourcesExecArgs" },
    { id: 18, name: "read_mcp_resource_exec_args", type: "ReadMcpResourceExecArgs" },
    { id: 28, name: "subagent_args", type: "SubagentArgs" },
    { id: 36, name: "mcp_state_exec_args", type: "McpStateExecArgs" },
    { id: 44, name: "git_diff_request", type: "GetDiffRequest" },
    { id: 45, name: "pi_read_args", type: "PiReadToolArgs" },
    { id: 46, name: "pi_bash_args", type: "PiBashToolArgs" },
    { id: 47, name: "pi_edit_args", type: "PiEditToolArgs" },
    { id: 48, name: "pi_write_args", type: "PiWriteArgs" },
    { id: 49, name: "pi_grep_args", type: "PiGrepToolArgs" },
    { id: 50, name: "pi_find_args", type: "PiFindToolArgs" },
    { id: 51, name: "pi_ls_args", type: "PiLsToolArgs" }
  ], [{ name: "args", fields: [
    "shell_args",
    "write_args",
    "delete_args",
    "grep_args",
    "read_args",
    "ls_args",
    "request_context_args",
    "mcp_args",
    "shell_stream_args",
    "background_shell_spawn_args",
    "list_mcp_resources_exec_args",
    "read_mcp_resource_exec_args",
    "mcp_state_exec_args",
    "subagent_args",
    "git_diff_request",
    "pi_read_args",
    "pi_bash_args",
    "pi_edit_args",
    "pi_write_args",
    "pi_grep_args",
    "pi_find_args",
    "pi_ls_args"
  ] }]);
  addType(root, "ExecClientMessage", [
    { id: 1, name: "id", type: "uint32" },
    { id: 15, name: "exec_id", type: "string" },
    { id: 39, name: "local_execution_time_ms", type: "uint64" },
    { id: 2, name: "shell_result", type: "ShellResult" },
    { id: 3, name: "write_result", type: "WriteResult" },
    { id: 4, name: "delete_result", type: "DeleteResult" },
    { id: 5, name: "grep_result", type: "GrepResult" },
    { id: 7, name: "read_result", type: "ReadResult" },
    { id: 8, name: "ls_result", type: "LsResult" },
    { id: 9, name: "diagnostics_result", type: "DiagnosticsResult" },
    { id: 10, name: "request_context_result", type: "RequestContextResult" },
    { id: 11, name: "mcp_result", type: "McpResult" },
    { id: 14, name: "shell_stream", type: "ShellStream" },
    { id: 16, name: "background_shell_spawn_result", type: "BackgroundShellSpawnResult" },
    { id: 17, name: "list_mcp_resources_exec_result", type: "ListMcpResourcesExecResult" },
    { id: 18, name: "read_mcp_resource_exec_result", type: "ReadMcpResourceExecResult" },
    { id: 20, name: "fetch_result", type: "FetchResult" },
    { id: 21, name: "record_screen_result", type: "RecordScreenResult" },
    { id: 22, name: "computer_use_result", type: "ComputerUseResult" },
    { id: 23, name: "write_shell_stdin_result", type: "WriteShellStdinResult" },
    { id: 28, name: "subagent_result", type: "SubagentResult" },
    { id: 29, name: "redacted_read_result", type: "ReadResult" },
    { id: 30, name: "force_background_shell_result", type: "ForceBackgroundShellResult" },
    { id: 31, name: "force_background_subagent_result", type: "ForceBackgroundSubagentResult" },
    { id: 36, name: "mcp_state_exec_result", type: "McpStateExecResult" },
    { id: 37, name: "subagent_await_result", type: "SubagentAwaitResult" },
    { id: 38, name: "smart_mode_classifier_result", type: "SmartModeClassifierResult" },
    { id: 40, name: "canvas_diagnostics_result", type: "CanvasDiagnosticsResult" },
    { id: 41, name: "shell_allowlist_precheck_result", type: "ShellAllowlistPrecheckResult" },
    { id: 42, name: "mcp_allowlist_precheck_result", type: "McpAllowlistPrecheckResult" },
    { id: 43, name: "web_fetch_allowlist_precheck_result", type: "WebFetchAllowlistPrecheckResult" },
    { id: 44, name: "git_diff_response", type: "GetDiffResponse" },
    { id: 46, name: "pi_read_result", type: "PiReadExecResult" },
    { id: 47, name: "pi_bash_result", type: "PiBashExecResult" },
    { id: 48, name: "pi_edit_result", type: "PiEditExecResult" },
    { id: 49, name: "pi_write_result", type: "PiWriteResult" },
    { id: 50, name: "pi_grep_result", type: "PiGrepExecResult" },
    { id: 51, name: "pi_find_result", type: "PiFindExecResult" },
    { id: 52, name: "pi_ls_result", type: "PiLsExecResult" },
    { id: 53, name: "conversation_search_result", type: "ConversationSearchResult" },
    { id: 54, name: "agent_store_conflict_result", type: "AgentStoreConflictResult" },
    { id: 55, name: "mini_swe_agent_bash_result", type: "ShellResult" },
    { id: 56, name: "adopt_result", type: "AdoptResult" }
  ], [{ name: "result", fields: [
    "shell_result",
    "write_result",
    "delete_result",
    "grep_result",
    "read_result",
    "ls_result",
    "diagnostics_result",
    "request_context_result",
    "mcp_result",
    "shell_stream",
    "background_shell_spawn_result",
    "list_mcp_resources_exec_result",
    "read_mcp_resource_exec_result",
    "fetch_result",
    "record_screen_result",
    "computer_use_result",
    "write_shell_stdin_result",
    "subagent_result",
    "redacted_read_result",
    "force_background_shell_result",
    "force_background_subagent_result",
    "mcp_state_exec_result",
    "subagent_await_result",
    "smart_mode_classifier_result",
    "canvas_diagnostics_result",
    "shell_allowlist_precheck_result",
    "mcp_allowlist_precheck_result",
    "web_fetch_allowlist_precheck_result",
    "git_diff_response",
    "pi_read_result",
    "pi_bash_result",
    "pi_edit_result",
    "pi_write_result",
    "pi_grep_result",
    "pi_find_result",
    "pi_ls_result",
    "conversation_search_result",
    "agent_store_conflict_result",
    "mini_swe_agent_bash_result",
    "adopt_result"
  ] }]);
  addType(root, "ExecServerControlMessage", [
    { id: 1, name: "abort", type: "ExecServerAbort" }
  ]);
  addType(root, "ExecServerAbort", [
    { id: 1, name: "id", type: "uint32" }
  ]);
  addType(root, "ExecClientStreamClose", [{ id: 1, name: "id", type: "uint32" }]);
  addType(root, "ExecClientThrow", [
    { id: 1, name: "id", type: "uint32" },
    { id: 2, name: "error", type: "string" }
  ]);
  addType(root, "ExecClientHeartbeat", [{ id: 1, name: "id", type: "uint32" }]);
  addType(root, "ExecClientControlMessage", [
    { id: 1, name: "stream_close", type: "ExecClientStreamClose" },
    { id: 2, name: "throw", type: "ExecClientThrow" },
    { id: 3, name: "heartbeat", type: "ExecClientHeartbeat" }
  ], [{ name: "message", fields: ["stream_close", "throw", "heartbeat"] }]);
  addType(root, "ParameterValue", [
    { id: 1, name: "id", type: "string" },
    { id: 2, name: "value", type: "string" }
  ]);
  addType(root, "RequestedModel", [
    { id: 1, name: "model_id", type: "string" },
    { id: 2, name: "max_mode", type: "bool" },
    { id: 3, name: "parameters", type: "ParameterValue", repeated: true }
  ]);
  addType(root, "SelectedImageDimension", [
    { id: 1, name: "width", type: "int32" },
    { id: 2, name: "height", type: "int32" }
  ]);
  addType(root, "SelectedImageBlobIdWithData", [
    { id: 1, name: "blob_id", type: "bytes" },
    { id: 2, name: "data", type: "bytes" }
  ]);
  addType(root, "SelectedImage", [
    { id: 1, name: "blob_id", type: "bytes" },
    { id: 8, name: "data", type: "bytes" },
    { id: 9, name: "blob_id_with_data", type: "SelectedImageBlobIdWithData" },
    { id: 2, name: "uuid", type: "string" },
    { id: 3, name: "path", type: "string" },
    { id: 4, name: "dimension", type: "SelectedImageDimension" },
    { id: 7, name: "mime_type", type: "string" }
  ], [{ name: "data_or_blob_id", fields: ["blob_id", "data", "blob_id_with_data"] }]);
  addType(root, "SelectedContext", [
    { id: 1, name: "selected_images", type: "SelectedImage", repeated: true }
  ]);
  addType(root, "UserMessage", [
    { id: 1, name: "text", type: "string" },
    { id: 2, name: "message_id", type: "string" },
    { id: 3, name: "selected_context", type: "SelectedContext" }
  ]);
  addType(root, "RequestContext", [
    { id: 2, name: "rules", type: "CursorRule", repeated: true },
    { id: 4, name: "env", type: "RequestContextEnv" },
    { id: 6, name: "repository_info", type: "RepositoryIndexingInfo", repeated: true },
    { id: 7, name: "tools", type: "McpToolDefinition", repeated: true },
    { id: 11, name: "git_repos", type: "GitRepoInfo", repeated: true },
    { id: 13, name: "project_layouts", type: "LsDirectoryTreeNode", repeated: true },
    { id: 17, name: "web_search_enabled", type: "bool" },
    { id: 22, name: "custom_subagents", type: "CustomSubagent", repeated: true },
    { id: 23, name: "mcp_file_system_options", type: "McpFileSystemOptions" },
    { id: 24, name: "web_fetch_enabled", type: "bool" },
    { id: 25, name: "hooks_additional_context", type: "string" },
    { id: 29, name: "agent_skills", type: "AgentSkill", repeated: true },
    { id: 33, name: "git_repo_info_complete", type: "bool" },
    { id: 34, name: "mcp_meta_tool_options", type: "McpMetaToolOptions" },
    { id: 36, name: "mcp_info_complete", type: "bool" },
    { id: 39, name: "rules_info_complete", type: "bool" },
    { id: 40, name: "env_info_complete", type: "bool" },
    { id: 41, name: "repository_info_complete", type: "bool" },
    { id: 42, name: "custom_subagents_info_complete", type: "bool" },
    { id: 43, name: "agent_skills_info_complete", type: "bool" },
    { id: 44, name: "mcp_file_system_info_complete", type: "bool" },
    { id: 45, name: "git_status_info_complete", type: "bool" },
    { id: 46, name: "user_permissions_auto_run", type: "PermissionsAutoRunInstructions" },
    { id: 47, name: "project_permissions_auto_run", type: "PermissionsAutoRunInstructions" }
  ]);
  addType(root, "UserMessageAction", [
    { id: 1, name: "user_message", type: "UserMessage" },
    { id: 2, name: "request_context", type: "RequestContext" }
  ]);
  addType(root, "ResumeAction", [
    // Cursor CLI sends an empty ResumeAction. Field #2 is available for a
    // refreshed RequestContext; the conversation id belongs to AgentRunRequest.
    { id: 2, name: "request_context", type: "RequestContext" }
  ]);
  addType(root, "CancelAction", [
    { id: 1, name: "conversation_id", type: "string" }
  ]);
  addType(root, "AsyncAskQuestionCompletionAction", [
    { id: 1, name: "original_tool_call_id", type: "string" },
    { id: 2, name: "original_args", type: "bytes" },
    { id: 3, name: "result", type: "AskQuestionResult" }
  ]);
  addType(root, "ConversationAction", [
    { id: 1, name: "user_message_action", type: "UserMessageAction" },
    { id: 2, name: "resume_action", type: "ResumeAction" },
    { id: 3, name: "cancel_action", type: "CancelAction" },
    { id: 8, name: "async_ask_question_completion_action", type: "AsyncAskQuestionCompletionAction" }
  ], [{
    name: "action",
    fields: [
      "user_message_action",
      "resume_action",
      "cancel_action",
      "async_ask_question_completion_action"
    ]
  }]);
  addType(root, "AssistantMessage", [
    { id: 1, name: "text", type: "string" }
  ]);
  addType(root, "ConversationStep", [
    { id: 1, name: "assistant_message", type: "AssistantMessage" }
  ], [{ name: "message", fields: ["assistant_message"] }]);
  addType(root, "AgentConversationTurn", [
    { id: 1, name: "user_message", type: "UserMessage" },
    { id: 2, name: "steps", type: "ConversationStep", repeated: true }
  ]);
  addType(root, "ConversationTurn", [
    { id: 1, name: "agent_conversation_turn", type: "AgentConversationTurn" }
  ], [{ name: "turn", fields: ["agent_conversation_turn"] }]);
  addType(root, "PromptTokenBreakdownCategory", [
    { id: 1, name: "id", type: "string" },
    { id: 2, name: "label", type: "string" },
    { id: 3, name: "estimated_tokens", type: "uint32" },
    { id: 4, name: "character_count", type: "uint32" }
  ]);
  addType(root, "PromptTokenBreakdownSnapshot", [
    { id: 1, name: "total_used_tokens", type: "uint32" },
    { id: 2, name: "max_tokens", type: "uint32" },
    { id: 3, name: "categories", type: "PromptTokenBreakdownCategory", repeated: true }
  ]);
  addType(root, "ConversationTokenDetails", [
    { id: 1, name: "used_tokens", type: "uint32" },
    { id: 2, name: "max_tokens", type: "uint32" },
    { id: 3, name: "breakdown", type: "PromptTokenBreakdownSnapshot" }
  ]);
  addType(root, "ConversationStateStructure", [
    { id: 1, name: "root_prompt_messages_json", type: "string", repeated: true },
    { id: 5, name: "token_details", type: "ConversationTokenDetails" },
    { id: 8, name: "turns", type: "ConversationTurn", repeated: true }
  ]);
  addType(root, "ModelDetails", [
    { id: 1, name: "model_id", type: "string" }
  ]);
  addType(root, "McpTools", [
    { id: 1, name: "mcp_tools", type: "McpToolDefinition", repeated: true }
  ]);
  addType(root, "AgentRunRequest", [
    { id: 1, name: "conversation_state", type: "bytes" },
    { id: 2, name: "action", type: "ConversationAction" },
    { id: 4, name: "mcp_tools", type: "McpTools" },
    { id: 5, name: "conversation_id", type: "string" },
    { id: 8, name: "custom_system_prompt", type: "string" },
    { id: 9, name: "requested_model", type: "RequestedModel" },
    { id: 10, name: "unknown_flag", type: "uint32" },
    { id: 12, name: "field_12", type: "uint32" },
    { id: 14, name: "selected_subagent_models", type: "RequestedModel", repeated: true },
    { id: 16, name: "conversation_group_id", type: "string" },
    { id: 25, name: "run_id", type: "string" }
  ]);
  addType(root, "ClientHeartbeat", []);
  addType(root, "InteractionQuery", [
    { id: 1, name: "id", type: "uint32" },
    { id: 2, name: "web_search_request_query", type: "bytes" },
    { id: 3, name: "ask_question_interaction_query", type: "bytes" },
    { id: 4, name: "switch_mode_request_query", type: "bytes" },
    { id: 7, name: "create_plan_request_query", type: "bytes" },
    { id: 8, name: "setup_vm_environment_args", type: "bytes" },
    { id: 9, name: "web_fetch_request_query", type: "bytes" },
    { id: 10, name: "pr_management_request_query", type: "bytes" },
    { id: 11, name: "mcp_auth_request_query", type: "bytes" },
    { id: 12, name: "generate_image_request_query", type: "bytes" },
    { id: 13, name: "replace_env_args", type: "bytes" },
    { id: 14, name: "connect_scm_request_query", type: "bytes" }
  ], [{
    name: "query",
    fields: [
      "web_search_request_query",
      "ask_question_interaction_query",
      "switch_mode_request_query",
      "create_plan_request_query",
      "setup_vm_environment_args",
      "web_fetch_request_query",
      "pr_management_request_query",
      "mcp_auth_request_query",
      "generate_image_request_query",
      "replace_env_args",
      "connect_scm_request_query"
    ]
  }]);
  addType(root, "WebSearchRequestApproved", []);
  addType(root, "WebSearchRequestRejected", [{ id: 1, name: "reason", type: "string" }]);
  addType(root, "WebSearchRequestResponse", [
    { id: 1, name: "approved", type: "WebSearchRequestApproved" },
    { id: 2, name: "rejected", type: "WebSearchRequestRejected" }
  ], [{ name: "result", fields: ["approved", "rejected"] }]);
  addType(root, "AskQuestionRejected", [{ id: 1, name: "reason", type: "string" }]);
  addType(root, "AskQuestionError", [{ id: 1, name: "error_message", type: "string" }]);
  addType(root, "AskQuestionAsync", []);
  addType(root, "AskQuestionSuccessAnswer", [
    { id: 1, name: "question_id", type: "string" },
    { id: 2, name: "selected_option_ids", type: "string", repeated: true },
    { id: 3, name: "freeform_text", type: "string" }
  ]);
  addType(root, "AskQuestionSuccess", [
    { id: 1, name: "answers", type: "AskQuestionSuccessAnswer", repeated: true }
  ]);
  addType(root, "AskQuestionResult", [
    { id: 1, name: "success", type: "AskQuestionSuccess" },
    { id: 2, name: "error", type: "AskQuestionError" },
    { id: 3, name: "rejected", type: "AskQuestionRejected" },
    { id: 4, name: "async", type: "AskQuestionAsync" }
  ], [{ name: "result", fields: ["success", "error", "rejected", "async"] }]);
  addType(root, "AskQuestionInteractionResponse", [
    { id: 1, name: "result", type: "AskQuestionResult" }
  ]);
  addType(root, "AskQuestionInteractionQuery", [
    { id: 1, name: "args", type: "AskQuestionArgs" },
    { id: 2, name: "tool_call_id", type: "string" }
  ]);
  addType(root, "SwitchModeRequestApproved", []);
  addType(root, "SwitchModeRequestRejected", [{ id: 1, name: "reason", type: "string" }]);
  addType(root, "SwitchModeRequestResponse", [
    { id: 1, name: "approved", type: "SwitchModeRequestApproved" },
    { id: 2, name: "rejected", type: "SwitchModeRequestRejected" }
  ], [{ name: "result", fields: ["approved", "rejected"] }]);
  addType(root, "SwitchModeRequestQuery", [
    { id: 1, name: "args", type: "SwitchModeToolArgs" }
  ]);
  addType(root, "CreatePlanSuccess", []);
  addType(root, "CreatePlanError", [{ id: 1, name: "error", type: "string" }]);
  addType(root, "CreatePlanResult", [
    { id: 1, name: "success", type: "CreatePlanSuccess" },
    { id: 2, name: "error", type: "CreatePlanError" },
    { id: 3, name: "plan_uri", type: "string" }
  ], [{ name: "result", fields: ["success", "error"] }]);
  addType(root, "CreatePlanRequestResponse", [
    { id: 1, name: "result", type: "CreatePlanResult" }
  ]);
  addType(root, "CreatePlanRequestQuery", [
    { id: 1, name: "args", type: "CreatePlanArgs" },
    { id: 2, name: "tool_call_id", type: "string" }
  ]);
  addType(root, "SetupVmEnvironmentSuccess", []);
  addType(root, "SetupVmEnvironmentResult", [
    { id: 1, name: "success", type: "SetupVmEnvironmentSuccess" }
  ], [{ name: "result", fields: ["success"] }]);
  addType(root, "WebFetchRequestApproved", []);
  addType(root, "WebFetchRequestRejected", [{ id: 1, name: "reason", type: "string" }]);
  addType(root, "WebFetchRequestResponse", [
    { id: 1, name: "approved", type: "WebFetchRequestApproved" },
    { id: 2, name: "rejected", type: "WebFetchRequestRejected" }
  ], [{ name: "result", fields: ["approved", "rejected"] }]);
  addType(root, "PrManagementRejected", [{ id: 1, name: "reason", type: "string" }]);
  addType(root, "PrManagementResult", [
    { id: 3, name: "rejected", type: "PrManagementRejected" }
  ], [{ name: "result", fields: ["rejected"] }]);
  addType(root, "McpAuthRequestApproved", []);
  addType(root, "McpAuthRequestRejected", [{ id: 1, name: "reason", type: "string" }]);
  addType(root, "McpAuthRequestResponse", [
    { id: 1, name: "approved", type: "McpAuthRequestApproved" },
    { id: 2, name: "rejected", type: "McpAuthRequestRejected" }
  ], [{ name: "result", fields: ["approved", "rejected"] }]);
  addType(root, "GenerateImageRequestApproved", [{ id: 1, name: "description", type: "string" }]);
  addType(root, "GenerateImageRequestRejected", [{ id: 1, name: "reason", type: "string" }]);
  addType(root, "GenerateImageRequestResponse", [
    { id: 1, name: "approved", type: "GenerateImageRequestApproved" },
    { id: 2, name: "rejected", type: "GenerateImageRequestRejected" }
  ], [{ name: "result", fields: ["approved", "rejected"] }]);
  addType(root, "ReplaceEnvSuccess", []);
  addType(root, "ReplaceEnvFailure", [
    { id: 1, name: "error_message", type: "string" },
    { id: 2, name: "setup_logs", type: "string" }
  ]);
  addType(root, "ReplaceEnvResult", [
    { id: 1, name: "success", type: "ReplaceEnvSuccess" },
    { id: 2, name: "failure", type: "ReplaceEnvFailure" }
  ], [{ name: "result", fields: ["success", "failure"] }]);
  addType(root, "ConnectScmRequestApproved", []);
  addType(root, "ConnectScmRequestRejected", [{ id: 1, name: "reason", type: "string" }]);
  addType(root, "ConnectScmRequestFailed", [{ id: 1, name: "error", type: "string" }]);
  addType(root, "ConnectScmRequestResponse", [
    { id: 1, name: "approved", type: "ConnectScmRequestApproved" },
    { id: 2, name: "rejected", type: "ConnectScmRequestRejected" },
    { id: 3, name: "failed", type: "ConnectScmRequestFailed" }
  ], [{ name: "result", fields: ["approved", "rejected", "failed"] }]);
  addType(root, "InteractionResponse", [
    { id: 1, name: "id", type: "uint32" },
    { id: 2, name: "web_search_request_response", type: "WebSearchRequestResponse" },
    { id: 3, name: "ask_question_interaction_response", type: "AskQuestionInteractionResponse" },
    { id: 4, name: "switch_mode_request_response", type: "SwitchModeRequestResponse" },
    { id: 7, name: "create_plan_request_response", type: "CreatePlanRequestResponse" },
    { id: 8, name: "setup_vm_environment_result", type: "SetupVmEnvironmentResult" },
    { id: 9, name: "web_fetch_request_response", type: "WebFetchRequestResponse" },
    { id: 10, name: "pr_management_result", type: "PrManagementResult" },
    { id: 11, name: "mcp_auth_request_response", type: "McpAuthRequestResponse" },
    { id: 12, name: "generate_image_request_response", type: "GenerateImageRequestResponse" },
    { id: 13, name: "replace_env_result", type: "ReplaceEnvResult" },
    { id: 14, name: "connect_scm_request_response", type: "ConnectScmRequestResponse" }
  ], [{
    name: "result",
    fields: [
      "web_search_request_response",
      "ask_question_interaction_response",
      "switch_mode_request_response",
      "create_plan_request_response",
      "setup_vm_environment_result",
      "web_fetch_request_response",
      "pr_management_result",
      "mcp_auth_request_response",
      "generate_image_request_response",
      "replace_env_result",
      "connect_scm_request_response"
    ]
  }]);
  addType(root, "GetBlobArgs", [
    { id: 1, name: "blob_id", type: "bytes" }
  ]);
  addType(root, "GetBlobResult", [
    { id: 1, name: "blob_data", type: "bytes" }
  ]);
  addType(root, "SetBlobArgs", [
    { id: 1, name: "blob_id", type: "bytes" },
    { id: 2, name: "blob_data", type: "bytes" }
  ]);
  addType(root, "SetBlobResult", [
    { id: 1, name: "error", type: "string" }
  ]);
  addType(root, "KvServerMessage", [
    { id: 1, name: "id", type: "uint32" },
    { id: 2, name: "get_blob_args", type: "GetBlobArgs" },
    { id: 3, name: "set_blob_args", type: "SetBlobArgs" }
  ], [{ name: "message", fields: ["get_blob_args", "set_blob_args"] }]);
  addType(root, "KvClientMessage", [
    { id: 1, name: "id", type: "uint32" },
    { id: 2, name: "get_blob_result", type: "GetBlobResult" },
    { id: 3, name: "set_blob_result", type: "SetBlobResult" }
  ], [{ name: "message", fields: ["get_blob_result", "set_blob_result"] }]);
  addType(root, "AgentClientMessage", [
    { id: 1, name: "run_request", type: "AgentRunRequest" },
    { id: 2, name: "exec_client_message", type: "ExecClientMessage" },
    { id: 3, name: "kv_client_message", type: "KvClientMessage" },
    { id: 4, name: "conversation_action", type: "ConversationAction" },
    { id: 5, name: "exec_client_control_message", type: "ExecClientControlMessage" },
    { id: 6, name: "interaction_response", type: "InteractionResponse" },
    { id: 7, name: "client_heartbeat", type: "ClientHeartbeat" }
  ], [{
    name: "message",
    fields: [
      "run_request",
      "exec_client_message",
      "kv_client_message",
      "conversation_action",
      "exec_client_control_message",
      "interaction_response",
      "client_heartbeat"
    ]
  }]);
  addType(root, "AgentServerMessage", [
    { id: 1, name: "interaction_update", type: "InteractionUpdate" },
    { id: 2, name: "exec_server_message", type: "ExecServerMessage" },
    { id: 3, name: "conversation_checkpoint_update", type: "bytes" },
    { id: 4, name: "kv_server_message", type: "KvServerMessage" },
    { id: 5, name: "exec_server_control_message", type: "ExecServerControlMessage" },
    { id: 7, name: "interaction_query", type: "InteractionQuery" }
  ], [{ name: "message", fields: ["interaction_update", "exec_server_message", "conversation_checkpoint_update", "kv_server_message", "exec_server_control_message", "interaction_query"] }]);
  addType(root, "AvailableModelsRequest", []);
  addType(root, "AvailableModelParameterDefinition", [
    { id: 1, name: "id", type: "string" },
    { id: 2, name: "values", type: "string", repeated: true }
  ]);
  addType(root, "AvailableModelParameterValue", [
    { id: 1, name: "id", type: "string" },
    { id: 2, name: "value", type: "string" }
  ]);
  addType(root, "AvailableModelVariant", [
    { id: 1, name: "display_name", type: "string" },
    { id: 2, name: "is_max_mode", type: "bool" },
    { id: 3, name: "is_default_max_config", type: "bool" },
    { id: 4, name: "is_default_non_max_config", type: "bool" },
    { id: 5, name: "parameter_values", type: "AvailableModelParameterValue", repeated: true }
  ]);
  addType(root, "AvailableModelEntry", [
    { id: 1, name: "name", type: "string" },
    { id: 2, name: "default_on", type: "bool" },
    { id: 5, name: "supports_agent", type: "bool" },
    { id: 9, name: "supports_thinking", type: "bool" },
    { id: 10, name: "supports_images", type: "bool" },
    { id: 14, name: "supports_max_mode", type: "bool" },
    { id: 15, name: "context_token_limit", type: "uint32" },
    { id: 17, name: "client_display_name", type: "string" },
    { id: 18, name: "server_model_name", type: "string" },
    { id: 29, name: "parameter_definitions", type: "AvailableModelParameterDefinition", repeated: true },
    { id: 30, name: "variants", type: "AvailableModelVariant", repeated: true }
  ]);
  addType(root, "AvailableModelsResponse", [
    { id: 1, name: "models", type: "AvailableModelEntry", repeated: true }
  ]);
  return root;
}
function getMessageTypes() {
  if (!_root) {
    _root = createMessageTypes();
  }
  return _root;
}
function encodeMessage(typeName, message) {
  const root = getMessageTypes();
  const type = root.lookupType(typeName);
  const err = type.verify(message);
  if (err)
    throw new Error(`Invalid message for ${typeName}: ${err}`);
  return type.encode(type.fromObject(message)).finish();
}
function decodeMessage(typeName, data) {
  const root = getMessageTypes();
  const type = root.lookupType(typeName);
  const decoded = type.decode(data);
  return type.toObject(decoded, { defaults: true, json: true, longs: Number });
}
function decodeMessageSparse(typeName, data) {
  const root = getMessageTypes();
  const type = root.lookupType(typeName);
  const decoded = type.decode(data);
  return type.toObject(decoded, { json: true, longs: Number });
}
function readRawFields(buf) {
  const reader = import_protobufjs.default.Reader.create(buf);
  const fields = [];
  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    const field = tag >>> 3;
    const wireType = tag & 7;
    switch (wireType) {
      case 0:
        fields.push({ field, wireType, varint: reader.uint64().toString() });
        break;
      case 1:
        fields.push({ field, wireType, fixed: reader.fixed64().toString() });
        break;
      case 2:
        fields.push({ field, wireType, bytes: reader.bytes() });
        break;
      case 5:
        fields.push({ field, wireType, fixed: reader.fixed32() });
        break;
      default:
        return fields;
    }
  }
  return fields;
}
function debugWalkTurnEnded(payload) {
  try {
    const top = readRawFields(payload);
    const iuField = top.find((f) => f.field === 1 && f.wireType === 2);
    if (!iuField?.bytes)
      return "(no interaction_update field)";
    const iu = readRawFields(iuField.bytes);
    const teField = iu.find((f) => f.field === 14 && f.wireType === 2);
    if (!teField?.bytes)
      return "(no turn_ended field in interaction_update)";
    const te = readRawFields(teField.bytes);
    return te.map((f) => `f${f.field}:wt${f.wireType}=${f.varint ?? f.fixed ?? (f.bytes ? `bytes[${f.bytes.length}]` : "?")}`).join(" ");
  } catch (e) {
    return `(walk failed: ${e.message})`;
  }
}
var import_protobufjs, _root;
var init_messages = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/messages.js"() {
    import_protobufjs = __toESM(require_protobufjs(), 1);
    _root = null;
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/struct.js
function writeVarint(out, n) {
  let v = n >>> 0;
  while (v > 127) {
    out.push(v & 127 | 128);
    v >>>= 7;
  }
  out.push(v);
}
function writeTag(out, field, wire) {
  writeVarint(out, field << 3 | wire);
}
function writeLengthDelimited(out, field, bytes) {
  writeTag(out, field, 2);
  writeVarint(out, bytes.length);
  for (let i = 0; i < bytes.length; i++)
    out.push(bytes[i]);
}
function writeString(out, field, str7) {
  writeLengthDelimited(out, field, new TextEncoder().encode(str7));
}
function writeDouble(out, field, num3) {
  writeTag(out, field, 1);
  const buf = new ArrayBuffer(8);
  new DataView(buf).setFloat64(0, num3, true);
  const view = new Uint8Array(buf);
  for (let i = 0; i < 8; i++)
    out.push(view[i]);
}
function readVarintAt(b, i) {
  let r = 0, s = 0;
  while (i < b.length) {
    const x = b[i++];
    r |= (x & 127) << s;
    if (!(x & 128))
      break;
    s += 7;
  }
  return [r >>> 0, i];
}
function readAllFields(b) {
  let i = 0;
  const out = [];
  while (i < b.length) {
    let key;
    [key, i] = readVarintAt(b, i);
    const fn = key >>> 3, wt = key & 7;
    if (wt === 0) {
      let v;
      [v, i] = readVarintAt(b, i);
      out.push({ fn, wt, varint: v });
    } else if (wt === 2) {
      let len;
      [len, i] = readVarintAt(b, i);
      out.push({ fn, wt, varint: 0, bytes: b.subarray(i, i + len) });
      i += len;
    } else if (wt === 1) {
      out.push({ fn, wt, varint: 0, i64: b.subarray(i, i + 8) });
      i += 8;
    } else if (wt === 5) {
      i += 4;
    } else
      break;
  }
  return out;
}
function readBoundedVarint(bytes, offset, maximum) {
  let value = 0n;
  let shift = 0n;
  for (let index = offset; index < bytes.length && index < offset + 10; index++) {
    const byte = bytes[index];
    value |= BigInt(byte & 127) << shift;
    if (value > maximum)
      return void 0;
    if ((byte & 128) === 0)
      return { value, nextOffset: index + 1 };
    shift += 7n;
  }
  return void 0;
}
function readAllFieldsStrict(bytes) {
  let offset = 0;
  const fields = [];
  while (offset < bytes.length) {
    const tag = readBoundedVarint(bytes, offset, MAX_UINT32);
    if (!tag)
      return void 0;
    offset = tag.nextOffset;
    const fieldNumber = Number(tag.value >> 3n);
    const wireType = Number(tag.value & 7n);
    if (fieldNumber === 0 || fieldNumber > MAX_PROTOBUF_FIELD_NUMBER)
      return void 0;
    if (wireType === 0) {
      const scalar = readBoundedVarint(bytes, offset, MAX_UINT64);
      if (!scalar)
        return void 0;
      fields.push({ fn: fieldNumber, wt: wireType, varint: scalar.value });
      offset = scalar.nextOffset;
      continue;
    }
    if (wireType === 1) {
      if (offset + 8 > bytes.length)
        return void 0;
      fields.push({ fn: fieldNumber, wt: wireType, fixed64: bytes.subarray(offset, offset + 8) });
      offset += 8;
      continue;
    }
    if (wireType === 2) {
      const encodedLength = readBoundedVarint(bytes, offset, MAX_UINT32);
      if (!encodedLength)
        return void 0;
      offset = encodedLength.nextOffset;
      const length = Number(encodedLength.value);
      if (offset + length > bytes.length)
        return void 0;
      fields.push({ fn: fieldNumber, wt: wireType, bytes: bytes.subarray(offset, offset + length) });
      offset += length;
      continue;
    }
    if (wireType === 5) {
      if (offset + 4 > bytes.length)
        return void 0;
      fields.push({ fn: fieldNumber, wt: wireType, fixed32: bytes.subarray(offset, offset + 4) });
      offset += 4;
      continue;
    }
    return void 0;
  }
  return fields;
}
function decodeStructBytes(b) {
  const obj = {};
  for (const f of readAllFields(b)) {
    if (f.fn !== 1 || !f.bytes)
      continue;
    const { key, valBytes } = readMapEntry(f.bytes);
    if (key !== void 0)
      obj[key] = valBytes ? decodeValueToJson(valBytes) : null;
  }
  return obj;
}
function decodeListBytes(b) {
  const arr = [];
  for (const f of readAllFields(b)) {
    if (f.fn === 1 && f.bytes)
      arr.push(decodeValueToJson(f.bytes));
  }
  return arr;
}
function readMapEntry(b) {
  let key;
  let valBytes;
  for (const e of readAllFields(b)) {
    if (e.fn === 1 && e.bytes)
      key = new TextDecoder().decode(e.bytes);
    else if (e.fn === 2 && e.bytes)
      valBytes = e.bytes;
  }
  return { key, valBytes };
}
function decodeValueToJson(bytes) {
  const fs9 = readAllFields(bytes);
  if (fs9.length === 0)
    return null;
  const f = fs9[0];
  switch (f.fn) {
    case 1:
      return null;
    // null_value
    case 2:
      return f.i64 ? new DataView(f.i64.buffer, f.i64.byteOffset, 8).getFloat64(0, true) : 0;
    case 3:
      return f.bytes ? new TextDecoder().decode(f.bytes) : "";
    case 4:
      return f.varint !== 0;
    case 5:
      return f.bytes ? decodeStructBytes(f.bytes) : {};
    case 6:
      return f.bytes ? decodeListBytes(f.bytes) : [];
    default:
      return null;
  }
}
function decodeStructEntriesToJson(entries) {
  const obj = {};
  for (const entry of entries) {
    const { key, valBytes } = readMapEntry(entry);
    if (key !== void 0)
      obj[key] = valBytes ? decodeValueToJson(valBytes) : null;
  }
  return obj;
}
function encodeJsonAsValue(v) {
  const out = [];
  if (v === null || v === void 0) {
    writeTag(out, 1, 0);
    writeVarint(out, 0);
  } else if (typeof v === "number") {
    writeDouble(out, 2, v);
  } else if (typeof v === "boolean") {
    writeTag(out, 4, 0);
    writeVarint(out, v ? 1 : 0);
  } else if (typeof v === "string") {
    writeString(out, 3, v);
  } else if (Array.isArray(v)) {
    const lv = [];
    for (const item of v)
      writeLengthDelimited(lv, 1, encodeJsonAsValue(item));
    writeLengthDelimited(out, 6, new Uint8Array(lv));
  } else if (typeof v === "object") {
    const st = [];
    for (const [key, val] of Object.entries(v).sort(([left], [right]) => left.localeCompare(right))) {
      if (val === void 0)
        continue;
      const entry = [];
      writeString(entry, 1, key);
      writeLengthDelimited(entry, 2, encodeJsonAsValue(val));
      writeLengthDelimited(st, 1, new Uint8Array(entry));
    }
    writeLengthDelimited(out, 5, new Uint8Array(st));
  } else {
    writeTag(out, 1, 0);
    writeVarint(out, 0);
  }
  return new Uint8Array(out);
}
var MAX_UINT32, MAX_UINT64, MAX_PROTOBUF_FIELD_NUMBER;
var init_struct = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/struct.js"() {
    MAX_UINT32 = 0xffffffffn;
    MAX_UINT64 = 0xffffffffffffffffn;
    MAX_PROTOBUF_FIELD_NUMBER = 536870911;
  }
});

// node_modules/cursor-opencode-provider/dist/context/env.js
import { homedir as homedir2 } from "node:os";
import path4 from "node:path";
function buildEnv(workspaceRoot) {
  const cwd = path4.resolve(workspaceRoot);
  let timeZone = "UTC";
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
  }
  const home = homedir2();
  const osVersion = (() => {
    const p = process.platform;
    const r = process.release?.version;
    return r ? `${p} ${r}` : p;
  })();
  const projectFolder = ensureOpencodeProjectDir(cwd);
  const env = {
    os_version: osVersion,
    workspace_paths: [cwd],
    shell: process.env.SHELL || "/bin/bash",
    sandbox_enabled: false,
    sandbox_supported: false,
    time_zone: timeZone,
    project_folder: projectFolder,
    terminals_folder: path4.join(projectFolder, "terminals"),
    agent_transcripts_folder: path4.join(projectFolder, "agent-transcripts"),
    process_working_directory: cwd,
    is_working_dir_home_dir: cwd === path4.resolve(home)
  };
  trace(`buildEnv: workspace_paths=${JSON.stringify(env.workspace_paths)} project_folder=${env.project_folder} terminals_folder=${env.terminals_folder} agent_transcripts_folder=${env.agent_transcripts_folder} process_working_directory=${env.process_working_directory}`);
  return env;
}
function workspaceRootFromRequestContext(requestContext) {
  const env = requestContext?.env;
  if (env && typeof env === "object") {
    const paths = env.workspace_paths;
    if (Array.isArray(paths) && typeof paths[0] === "string" && paths[0].trim()) {
      const root = path4.resolve(paths[0]);
      trace(`workspaceRootFromRequestContext: using workspace_paths[0]=${root}`);
      return root;
    }
  }
  const fallback = process.cwd();
  trace(`workspaceRootFromRequestContext: workspace_paths missing; fallback cwd=${fallback}`);
  return fallback;
}
var init_env = __esm({
  "node_modules/cursor-opencode-provider/dist/context/env.js"() {
    init_debug();
    init_paths();
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/exec-variants.js
function cursorExecVariantByRequestField(field) {
  return BY_REQUEST_FIELD.get(field);
}
function cursorExecVariantByRequestName(name14) {
  return BY_REQUEST_NAME.get(name14);
}
function describeCursorExecVariant(field) {
  if (field === void 0)
    return "unknown request field";
  const variant = cursorExecVariantByRequestField(field);
  if (!variant)
    return `unknown request field #${field}`;
  return `${variant.requestName} (request field #${variant.requestField}, expected result ${variant.resultName} field #${variant.resultField}, handling=${variant.handling})`;
}
var CURSOR_EXEC_VARIANTS, BY_REQUEST_FIELD, BY_REQUEST_NAME, FORCE_BACKGROUND_STATUS_ERROR;
var init_exec_variants = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/exec-variants.js"() {
    CURSOR_EXEC_VARIANTS = [
      { requestField: 2, requestName: "shell_args", resultField: 2, resultName: "shell_result", handling: "opencode-tool" },
      { requestField: 3, requestName: "write_args", resultField: 3, resultName: "write_result", handling: "opencode-tool" },
      { requestField: 4, requestName: "delete_args", resultField: 4, resultName: "delete_result", handling: "opencode-tool" },
      { requestField: 5, requestName: "grep_args", resultField: 5, resultName: "grep_result", handling: "opencode-tool" },
      { requestField: 7, requestName: "read_args", resultField: 7, resultName: "read_result", handling: "opencode-tool" },
      { requestField: 8, requestName: "ls_args", resultField: 8, resultName: "ls_result", handling: "opencode-tool" },
      // Dedicated Cursor read_lints (#9) is not planned. OpenCode only presents
      // LSP errors on write/edit/apply_patch output plus GET /lsp status / navigation.
      { requestField: 9, requestName: "diagnostics_args", resultField: 9, resultName: "diagnostics_result", handling: "unsupported" },
      { requestField: 10, requestName: "request_context_args", resultField: 10, resultName: "request_context_result", handling: "provider-control" },
      { requestField: 11, requestName: "mcp_args", resultField: 11, resultName: "mcp_result", handling: "opencode-tool" },
      { requestField: 14, requestName: "shell_stream_args", resultField: 14, resultName: "shell_stream", handling: "opencode-tool" },
      { requestField: 16, requestName: "background_shell_spawn_args", resultField: 16, resultName: "background_shell_spawn_result", handling: "opencode-tool" },
      { requestField: 17, requestName: "list_mcp_resources_exec_args", resultField: 17, resultName: "list_mcp_resources_exec_result", handling: "provider-control" },
      { requestField: 18, requestName: "read_mcp_resource_exec_args", resultField: 18, resultName: "read_mcp_resource_exec_result", handling: "provider-control" },
      { requestField: 20, requestName: "fetch_args", resultField: 20, resultName: "fetch_result", handling: "unsupported" },
      { requestField: 21, requestName: "record_screen_args", resultField: 21, resultName: "record_screen_result", handling: "unsupported" },
      { requestField: 22, requestName: "computer_use_args", resultField: 22, resultName: "computer_use_result", handling: "unsupported" },
      { requestField: 23, requestName: "write_shell_stdin_args", resultField: 23, resultName: "write_shell_stdin_result", handling: "unsupported" },
      { requestField: 27, requestName: "execute_hook_args", resultField: 27, resultName: "execute_hook_result", handling: "unsupported" },
      { requestField: 28, requestName: "subagent_args", resultField: 28, resultName: "subagent_result", handling: "opencode-tool" },
      { requestField: 29, requestName: "redacted_read_args", resultField: 29, resultName: "redacted_read_result", handling: "unsupported" },
      { requestField: 30, requestName: "force_background_shell_args", resultField: 30, resultName: "force_background_shell_result", handling: "unsupported" },
      { requestField: 31, requestName: "force_background_subagent_args", resultField: 31, resultName: "force_background_subagent_result", handling: "unsupported" },
      { requestField: 36, requestName: "mcp_state_exec_args", resultField: 36, resultName: "mcp_state_exec_result", handling: "provider-control" },
      { requestField: 37, requestName: "subagent_await_args", resultField: 37, resultName: "subagent_await_result", handling: "unsupported" },
      // OpenCode has no Auto-review / `--auto-review` mode. Not planned: keep the typed soft-deny.
      { requestField: 38, requestName: "smart_mode_classifier_args", resultField: 38, resultName: "smart_mode_classifier_result", handling: "unsupported" },
      { requestField: 40, requestName: "canvas_diagnostics_args", resultField: 40, resultName: "canvas_diagnostics_result", handling: "unsupported" },
      { requestField: 41, requestName: "shell_allowlist_precheck_args", resultField: 41, resultName: "shell_allowlist_precheck_result", handling: "unsupported" },
      { requestField: 42, requestName: "mcp_allowlist_precheck_args", resultField: 42, resultName: "mcp_allowlist_precheck_result", handling: "unsupported" },
      { requestField: 43, requestName: "web_fetch_allowlist_precheck_args", resultField: 43, resultName: "web_fetch_allowlist_precheck_result", handling: "unsupported" },
      { requestField: 44, requestName: "git_diff_request", resultField: 44, resultName: "git_diff_response", handling: "provider-control" },
      { requestField: 45, requestName: "pi_read_args", resultField: 46, resultName: "pi_read_result", handling: "opencode-tool" },
      { requestField: 46, requestName: "pi_bash_args", resultField: 47, resultName: "pi_bash_result", handling: "opencode-tool" },
      { requestField: 47, requestName: "pi_edit_args", resultField: 48, resultName: "pi_edit_result", handling: "opencode-tool" },
      { requestField: 48, requestName: "pi_write_args", resultField: 49, resultName: "pi_write_result", handling: "opencode-tool" },
      { requestField: 49, requestName: "pi_grep_args", resultField: 50, resultName: "pi_grep_result", handling: "opencode-tool" },
      { requestField: 50, requestName: "pi_find_args", resultField: 51, resultName: "pi_find_result", handling: "opencode-tool" },
      { requestField: 51, requestName: "pi_ls_args", resultField: 52, resultName: "pi_ls_result", handling: "opencode-tool" },
      // Mini-SWE request #52 pairs with ShellResult at #55 (Pi-style offset; #55
      // request is accept_hook_additional_contexts, not a variant).
      // Mini-SWE / SWE-agent bash is not planned (same surface as Auto-review). Keep the typed soft-deny.
      { requestField: 52, requestName: "mini_swe_agent_bash_args", resultField: 55, resultName: "mini_swe_agent_bash_result", handling: "unsupported" },
      { requestField: 53, requestName: "conversation_search_args", resultField: 53, resultName: "conversation_search_result", handling: "unsupported" },
      { requestField: 54, requestName: "agent_store_conflict_args", resultField: 54, resultName: "agent_store_conflict_result", handling: "unsupported" },
      { requestField: 56, requestName: "adopt_args", resultField: 56, resultName: "adopt_result", handling: "unsupported" }
    ];
    BY_REQUEST_FIELD = new Map(CURSOR_EXEC_VARIANTS.map((variant) => [variant.requestField, variant]));
    BY_REQUEST_NAME = new Map(CURSOR_EXEC_VARIANTS.map((variant) => [variant.requestName, variant]));
    FORCE_BACKGROUND_STATUS_ERROR = 2;
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/apply-patch.js
function buildAddFilePatch(filePath, content) {
  const lines = splitLines(content);
  return [BEGIN, `*** Add File: ${filePath}`, ...lines.map((line) => `+${line}`), END].join("\n");
}
function buildUpdateFilePatch(filePath, chunks) {
  const body = [];
  for (const chunk of chunks) {
    body.push("@@");
    for (const line of chunk.oldLines)
      body.push(`-${line}`);
    for (const line of chunk.newLines)
      body.push(`+${line}`);
  }
  return [BEGIN, `*** Update File: ${filePath}`, ...body, END].join("\n");
}
function planSubstringEdit(source, oldString, newString, replaceAll = false) {
  if (oldString === "")
    return { ok: false, reason: "the text to replace is empty" };
  const offsets = [];
  for (let at = source.indexOf(oldString); at !== -1; at = source.indexOf(oldString, at + oldString.length)) {
    offsets.push(at);
  }
  if (offsets.length === 0)
    return { ok: false, reason: "the text to replace was not found in the file" };
  if (offsets.length > 1 && !replaceAll) {
    return {
      ok: false,
      reason: `the text to replace appears ${offsets.length} times; it must be unique`
    };
  }
  const targets = replaceAll ? offsets : offsets.slice(0, 1);
  const chunks = [];
  let previousEnd = -1;
  for (const offset of targets) {
    const start = lineStart(source, offset);
    const end = lineEnd(source, offset + oldString.length);
    if (start < previousEnd) {
      return { ok: false, reason: "overlapping replacements cannot be expressed as a patch" };
    }
    previousEnd = end;
    const before = source.slice(start, offset);
    const after = source.slice(offset + oldString.length, end);
    chunks.push({
      oldLines: splitLines(source.slice(start, end)),
      newLines: splitLines(before + newString + after)
    });
  }
  return { ok: true, chunks };
}
function splitLines(text) {
  const normalized = text.endsWith("\n") ? text.slice(0, -1) : text;
  return normalized.split("\n");
}
function lineStart(source, offset) {
  const at = source.lastIndexOf("\n", offset - 1);
  return at === -1 ? 0 : at + 1;
}
function lineEnd(source, offset) {
  const at = source.indexOf("\n", offset);
  return at === -1 ? source.length : at;
}
var APPLY_PATCH_TOOL, BEGIN, END;
var init_apply_patch = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/apply-patch.js"() {
    APPLY_PATCH_TOOL = "apply_patch";
    BEGIN = "*** Begin Patch";
    END = "*** End Patch";
  }
});

// node_modules/cursor-opencode-provider/dist/shell-timeout.js
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, delimiter, join } from "node:path";
function setCursorShellPath(shell) {
  configuredShell = shell?.trim() || void 0;
}
function executableOnPath(name14) {
  for (const dir of (process.env.PATH ?? "").split(delimiter)) {
    if (dir && existsSync(join(dir, name14)))
      return true;
  }
  return false;
}
function resolveCursorShellKind(shell = configuredShell ?? process.env.SHELL) {
  let name14 = shell ? basename(shell).toLowerCase().replace(/\.exe$/, "") : "";
  if (name14 === "fish" || name14 === "nu" || !name14) {
    name14 = executableOnPath("bash") ? "bash" : "sh";
  }
  if (name14 === "bash" || name14 === "zsh" || name14 === "sh" || name14 === "dash")
    return name14;
  return "other";
}
function remember(map, key, value, onEvict) {
  map.delete(key);
  map.set(key, value);
  while (map.size > MAX_TRACKED_SHELL_CALLS) {
    const oldest = map.keys().next().value;
    if (!oldest)
      break;
    const evicted = map.get(oldest);
    map.delete(oldest);
    if (evicted !== void 0 && onEvict)
      onEvict(evicted);
  }
}
function finiteNonNegative(value) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0)
    return void 0;
  return Math.floor(n);
}
function shellPolicyFromMetadata(metadata) {
  if (!metadata)
    return void 0;
  if (metadata.background_shell_spawn === true) {
    return {
      command: typeof metadata.command === "string" ? metadata.command : "",
      workingDirectory: typeof metadata.working_directory === "string" ? metadata.working_directory : "",
      timeoutMs: 0,
      timeoutBehavior: 0,
      backgroundSpawn: true
    };
  }
  if (metadata.shell_stream !== true)
    return void 0;
  const timeoutMs2 = finiteNonNegative(metadata.timeout_ms) ?? 3e4;
  const timeoutBehavior = finiteNonNegative(metadata.timeout_behavior) ?? 0;
  const hardTimeoutMs = finiteNonNegative(metadata.hard_timeout_ms);
  return {
    command: typeof metadata.command === "string" ? metadata.command : "",
    workingDirectory: typeof metadata.working_directory === "string" ? metadata.working_directory : "",
    timeoutMs: timeoutMs2,
    timeoutBehavior,
    ...hardTimeoutMs !== void 0 && hardTimeoutMs > 0 ? { hardTimeoutMs } : {}
  };
}
function registerCursorShellCall(toolCallId, metadata) {
  const policy = shellPolicyFromMetadata(metadata);
  if (!policy || !toolCallId.startsWith("cursor_"))
    return;
  remember(policies, toolCallId, policy);
}
function shellQuote(value) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
function buildSoftBackgroundCommand(policy) {
  const polls = Math.ceil(policy.timeoutMs / POLL_INTERVAL_MS);
  const hardPolls = policy.hardTimeoutMs !== void 0 ? Math.max(1, Math.ceil(policy.hardTimeoutMs / POLL_INTERVAL_MS)) : void 0;
  const lines = [
    'cursor_shell_log="$(mktemp "${TMPDIR:-/tmp}/cursor-opencode-shell.XXXXXX")" || exit 1',
    `nohup sh -c ${shellQuote(policy.command)} >"$cursor_shell_log" 2>&1 </dev/null &`,
    "cursor_shell_pid=$!"
  ];
  if (hardPolls !== void 0) {
    lines.push('cursor_shell_status="$(mktemp "${TMPDIR:-/tmp}/cursor-opencode-shell-status.XXXXXX")" || exit 1', `nohup sh -c 'cursor_hard_poll=0; while [ "$cursor_hard_poll" -lt "$1" ] && kill -0 "$2" 2>/dev/null; do sleep ${POLL_INTERVAL_MS / 1e3}; cursor_hard_poll=$((cursor_hard_poll + 1)); done; if kill -0 "$2" 2>/dev/null; then printf timeout >"$3"; kill -TERM "$2" 2>/dev/null; sleep 3; kill -KILL "$2" 2>/dev/null; fi' cursor-shell-watchdog ${hardPolls} "$cursor_shell_pid" "$cursor_shell_status" >/dev/null 2>&1 </dev/null &`, "cursor_shell_watchdog_pid=$!");
  } else {
    lines.push('cursor_shell_status=""', 'cursor_shell_watchdog_pid=""');
  }
  lines.push(
    // Avoid interactive job-control noise ("Terminated: 15 …") when we later
    // reap the watchdog; that text can otherwise land after our private marker
    // and leak into OpenCode's bash UI.
    "set +m 2>/dev/null || true",
    'if [ -n "$cursor_shell_watchdog_pid" ]; then disown "$cursor_shell_watchdog_pid" 2>/dev/null || true; fi',
    'disown "$cursor_shell_pid" 2>/dev/null || true',
    "cursor_shell_poll=0",
    `while [ "$cursor_shell_poll" -lt ${polls} ] && kill -0 "$cursor_shell_pid" 2>/dev/null; do`,
    `  sleep ${POLL_INTERVAL_MS / 1e3}`,
    "  cursor_shell_poll=$((cursor_shell_poll + 1))",
    "done",
    'if kill -0 "$cursor_shell_pid" 2>/dev/null; then',
    '  cat "$cursor_shell_log"',
    `  printf '
${BACKGROUND_MARKER}%s:%s
' "$cursor_shell_pid" "$cursor_shell_log"`,
    "  exit 0",
    "fi",
    'wait "$cursor_shell_pid" 2>/dev/null',
    "cursor_shell_code=$?",
    'cat "$cursor_shell_log"',
    'if [ -n "$cursor_shell_status" ] && [ "$(cat "$cursor_shell_status" 2>/dev/null)" = timeout ]; then',
    // Reap the watchdog before printing the private marker so any residual
    // shell diagnostics cannot trail the sentinel.
    '  if [ -n "$cursor_shell_watchdog_pid" ]; then kill "$cursor_shell_watchdog_pid" 2>/dev/null || true; wait "$cursor_shell_watchdog_pid" 2>/dev/null || true; fi',
    `  printf '
${TIMEOUT_MARKER}%s
' ${policy.hardTimeoutMs ?? policy.timeoutMs}`,
    "else",
    '  if [ -n "$cursor_shell_watchdog_pid" ]; then kill "$cursor_shell_watchdog_pid" 2>/dev/null || true; wait "$cursor_shell_watchdog_pid" 2>/dev/null || true; fi',
    `  printf '
${EXIT_MARKER}%s
' "$cursor_shell_code"`,
    "fi",
    'rm -f -- "$cursor_shell_log"',
    'if [ -n "$cursor_shell_status" ]; then rm -f -- "$cursor_shell_status"; fi'
  );
  return lines.join("\n");
}
function buildBackgroundShellCommand(command) {
  return [
    'bg_log="$(mktemp "${TMPDIR:-/tmp}/cursor-opencode-bg.XXXXXX")" || exit 1',
    `nohup sh -c ${shellQuote(command)} >"$bg_log" 2>&1 </dev/null &`,
    "bg_pid=$!",
    `printf '${BACKGROUND_SHELL_MARKER}%s:%s\\n' "$bg_pid" "$bg_log"`
  ].join("\n");
}
function wrapperBodyForPolicy(policy) {
  if (policy.backgroundSpawn)
    return buildBackgroundShellCommand(policy.command);
  if (policy.timeoutBehavior === CURSOR_TIMEOUT_BACKGROUND)
    return buildSoftBackgroundCommand(policy);
  return void 0;
}
function writeShellEnvInjector(wrapperBody) {
  const dir = mkdtempSync(join(tmpdir(), "cursor-opencode-wrap-"));
  const wrapperPath = join(dir, "wrapper.sh");
  const bashEnvPath = join(dir, "bashenv.sh");
  const zshenvPath = join(dir, ".zshenv");
  writeFileSync(wrapperPath, `${wrapperBody}
`, { mode: 448 });
  const injector = [
    "unset BASH_ENV ZDOTDIR ENV CURSOR_OPENCODE_WRAP_ACTIVE",
    `exec /bin/sh ${shellQuote(wrapperPath)}`,
    ""
  ].join("\n");
  writeFileSync(bashEnvPath, injector, { mode: 384 });
  writeFileSync(zshenvPath, injector, { mode: 384 });
  return {
    wrapperPath,
    env: {
      BASH_ENV: bashEnvPath,
      ZDOTDIR: dir
    },
    cleanup: () => {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
      }
    }
  };
}
function ensureShellEnvWrap(toolCallId, policy) {
  const existing = activeEnvWraps.get(toolCallId);
  if (existing)
    return existing;
  const wrapperBody = wrapperBodyForPolicy(policy);
  if (!wrapperBody)
    return void 0;
  const wrap = writeShellEnvInjector(wrapperBody);
  remember(activeEnvWraps, toolCallId, wrap, (evicted) => evicted.cleanup());
  return wrap;
}
function prepareCursorShellArgs(toolCallId, args, options = {}) {
  const policy = policies.get(toolCallId);
  if (!policy)
    return;
  if (!policy.backgroundSpawn && policy.timeoutBehavior !== CURSOR_TIMEOUT_BACKGROUND)
    return;
  pendingEnvWraps.add(toolCallId);
  if (!policy.backgroundSpawn) {
    args.timeout = Math.max(OPENCODE_TIMEOUT_GRACE_MS, policy.timeoutMs + OPENCODE_TIMEOUT_GRACE_MS);
  }
  const shellKind = resolveCursorShellKind();
  const envInjectable = !options.preferWrapperCommand && (shellKind === "bash" || shellKind === "zsh");
  if (process.platform === "win32" || envInjectable) {
    args.command = policy.command;
    return;
  }
  const wrap = ensureShellEnvWrap(toolCallId, policy);
  if (wrap)
    args.command = `exec /bin/sh ${shellQuote(wrap.wrapperPath)}`;
}
function cursorShellOriginalCommand(toolCallId) {
  return policies.get(toolCallId)?.command || void 0;
}
function releaseCursorShellEnv(toolCallId) {
  pendingEnvWraps.delete(toolCallId);
  const active = activeEnvWraps.get(toolCallId);
  if (!active)
    return;
  activeEnvWraps.delete(toolCallId);
  active.cleanup();
}
function cursorShellEnvForCall(toolCallId) {
  if (typeof toolCallId !== "string" || !toolCallId || !pendingEnvWraps.has(toolCallId))
    return void 0;
  const policy = policies.get(toolCallId);
  if (!policy)
    return void 0;
  const wrap = ensureShellEnvWrap(toolCallId, policy);
  if (!wrap)
    return void 0;
  pendingEnvWraps.delete(toolCallId);
  return wrap.env;
}
function withoutMarker(output, index) {
  let clean = output.slice(0, index).replace(/[\t ]+$/gm, "").replace(/\n{2,}$/, "\n");
  if (clean.trim() === "" || clean.trim() === "(no output)")
    clean = "";
  return clean;
}
function formatShellOutcomeDisplay(clean, outcome) {
  let notice;
  if (outcome.kind === "backgrounded") {
    notice = outcome.msToWait > 0 ? `Still running in the background (pid ${outcome.pid}) after ${outcome.msToWait}ms.` : `Started in the background (pid ${outcome.pid}).`;
  } else if (outcome.kind === "timeout") {
    notice = `Timed out after ${outcome.timeoutMs}ms.`;
  }
  if (!notice)
    return clean;
  if (!clean)
    return `${notice}
`;
  return clean.endsWith("\n") ? `${clean}${notice}
` : `${clean}
${notice}
`;
}
function lastPrivateMarker(output, marker15, valuePattern) {
  const re = new RegExp(`(?:^|\\r?\\n)(${marker15}${valuePattern})`, "g");
  let match;
  let last;
  while ((match = re.exec(output)) !== null) {
    if (match.index === void 0 || match[1] === void 0)
      continue;
    const index = match[0].startsWith("\r\n") ? match.index + 2 : match[0].startsWith("\n") ? match.index + 1 : match.index;
    last = { index, values: match.slice(2) };
  }
  return last;
}
function parseOpenCodeTimeout(output) {
  const closeTag = "</shell_metadata>";
  const closeAt = output.lastIndexOf(closeTag);
  if (closeAt === -1 || output.slice(closeAt + closeTag.length).trim() !== "")
    return void 0;
  const header2 = /<shell_metadata>\r?\nshell tool terminated command after exceeding timeout (\d+) ms\./;
  const match = header2.exec(output.slice(0, closeAt));
  if (!match || match.index === void 0)
    return void 0;
  return { output: withoutMarker(output, match.index), timeoutMs: Number(match[1]) };
}
function parseSoftBackgroundOutcome(output, policy) {
  const background = lastPrivateMarker(output, BACKGROUND_MARKER, "(\\d+):([^\\r\\n]+)");
  if (background) {
    const pid = Number(background.values[0]);
    if (Number.isSafeInteger(pid) && pid > 0 && pid <= 4294967295) {
      return {
        output: withoutMarker(output, background.index),
        outcome: {
          kind: "backgrounded",
          shellId: pid,
          pid,
          command: policy?.command ?? "",
          workingDirectory: policy?.workingDirectory ?? "",
          msToWait: policy?.timeoutMs ?? 0,
          reason: 1
        }
      };
    }
  }
  const timeout = lastPrivateMarker(output, TIMEOUT_MARKER, "(\\d+)");
  if (timeout) {
    return {
      output: withoutMarker(output, timeout.index),
      outcome: { kind: "timeout", timeoutMs: Number(timeout.values[0]) }
    };
  }
  const exit = lastPrivateMarker(output, EXIT_MARKER, "(-?\\d+)");
  if (exit) {
    return {
      output: withoutMarker(output, exit.index),
      outcome: { kind: "exit", code: Number(exit.values[0]) }
    };
  }
  return void 0;
}
function parseBackgroundSpawnOutcome(output, policy) {
  const match = lastPrivateMarker(output, BACKGROUND_SHELL_MARKER, "(\\d+):([^\\r\\n]+)");
  if (!match)
    return void 0;
  const pid = Number(match.values[0]);
  if (!Number.isSafeInteger(pid) || pid <= 0 || pid > 4294967295)
    return void 0;
  return {
    output: withoutMarker(output, match.index),
    outcome: {
      kind: "backgrounded",
      shellId: pid,
      pid,
      command: policy?.command ?? "",
      workingDirectory: policy?.workingDirectory ?? "",
      msToWait: 0,
      reason: 1
    }
  };
}
function sanitizeCursorShellDisplayOutput(output, policy) {
  if (policy?.backgroundSpawn) {
    const spawn = parseBackgroundSpawnOutcome(output, policy);
    if (spawn)
      return formatShellOutcomeDisplay(spawn.output, spawn.outcome);
  }
  if (policy?.timeoutBehavior === CURSOR_TIMEOUT_BACKGROUND) {
    const wrapper = parseSoftBackgroundOutcome(output, policy);
    if (wrapper)
      return formatShellOutcomeDisplay(wrapper.output, wrapper.outcome);
  }
  const timeout = parseOpenCodeTimeout(output);
  if (timeout) {
    return formatShellOutcomeDisplay(timeout.output, {
      kind: "timeout",
      timeoutMs: timeout.timeoutMs
    });
  }
  return output;
}
function sanitizeRegisteredCursorShellOutput(toolCallId, output) {
  if (typeof toolCallId !== "string" || !toolCallId)
    return output;
  return sanitizeCursorShellDisplayOutput(output, policies.get(toolCallId));
}
function captureCursorShellResult(toolCallId, output, metadata) {
  if (typeof toolCallId !== "string" || !toolCallId.startsWith("cursor_"))
    return output;
  const policy = policies.get(toolCallId);
  if (policy?.backgroundSpawn) {
    const spawn = parseBackgroundSpawnOutcome(output, policy);
    if (spawn) {
      remember(outcomes, toolCallId, spawn.outcome);
      return formatShellOutcomeDisplay(spawn.output, spawn.outcome);
    }
  }
  const wrapper = policy?.timeoutBehavior === CURSOR_TIMEOUT_BACKGROUND ? parseSoftBackgroundOutcome(output, policy) : void 0;
  if (wrapper) {
    remember(outcomes, toolCallId, wrapper.outcome);
    return formatShellOutcomeDisplay(wrapper.output, wrapper.outcome);
  }
  const timeout = parseOpenCodeTimeout(output);
  if (timeout) {
    const outcome = { kind: "timeout", timeoutMs: timeout.timeoutMs };
    remember(outcomes, toolCallId, outcome);
    return formatShellOutcomeDisplay(timeout.output, outcome);
  }
  const exitCode = finiteNonNegative(metadata?.exit);
  if (exitCode !== void 0)
    remember(outcomes, toolCallId, { kind: "exit", code: exitCode });
  return output;
}
function consumeCursorShellResult(toolCallId, output) {
  if (typeof toolCallId !== "string" || !toolCallId) {
    return { output };
  }
  let clean = output;
  if (!outcomes.has(toolCallId))
    clean = captureCursorShellResult(toolCallId, output);
  const outcome = outcomes.get(toolCallId);
  outcomes.delete(toolCallId);
  policies.delete(toolCallId);
  releaseCursorShellEnv(toolCallId);
  return { output: clean, outcome };
}
var CURSOR_TIMEOUT_BACKGROUND, MAX_TRACKED_SHELL_CALLS, OPENCODE_TIMEOUT_GRACE_MS, POLL_INTERVAL_MS, BACKGROUND_MARKER, EXIT_MARKER, TIMEOUT_MARKER, BACKGROUND_SHELL_MARKER, policies, outcomes, pendingEnvWraps, activeEnvWraps, configuredShell;
var init_shell_timeout = __esm({
  "node_modules/cursor-opencode-provider/dist/shell-timeout.js"() {
    CURSOR_TIMEOUT_BACKGROUND = 2;
    MAX_TRACKED_SHELL_CALLS = 512;
    OPENCODE_TIMEOUT_GRACE_MS = 15e3;
    POLL_INTERVAL_MS = 100;
    BACKGROUND_MARKER = "__CURSOR_SHELL_BACKGROUND__";
    EXIT_MARKER = "__CURSOR_SHELL_EXIT__";
    TIMEOUT_MARKER = "__CURSOR_SHELL_TIMEOUT__";
    BACKGROUND_SHELL_MARKER = "__CURSOR_BACKGROUND_SHELL__";
    policies = /* @__PURE__ */ new Map();
    outcomes = /* @__PURE__ */ new Map();
    pendingEnvWraps = /* @__PURE__ */ new Set();
    activeEnvWraps = /* @__PURE__ */ new Map();
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/tools.js
import fs4 from "node:fs";
import os3 from "node:os";
import path5 from "node:path";
function sanitizeMcpServerId(value) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}
function resolveToolServerIdentity(opencodeName, defaultServer = "opencode", knownMcpServers = []) {
  if (!opencodeName) {
    return { server: defaultServer, toolName: "mcp", opencodeName: "mcp" };
  }
  const servers = [...new Set([...knownMcpServers].map(sanitizeMcpServerId).filter(Boolean))].sort((a, b) => b.length - a.length);
  for (const server of servers) {
    const prefix = `${server}_`;
    if (!opencodeName.startsWith(prefix) || opencodeName.length === prefix.length)
      continue;
    return {
      server,
      toolName: opencodeName.slice(prefix.length),
      opencodeName
    };
  }
  return { server: defaultServer, toolName: opencodeName, opencodeName };
}
function toolsToDescriptors(tools, providerIdentifier = "opencode", knownMcpServers = []) {
  return [...tools].sort((left, right) => left.name.localeCompare(right.name)).map((t) => {
    const id = resolveToolServerIdentity(t.sourceName ?? t.name, providerIdentifier, knownMcpServers);
    const collisionSafeAlias = COLLISION_SAFE_ALIASES.has(t.name);
    return {
      // Keep the collision-safe public name exact. Prefixing it with the
      // synthetic default server weakens the distinction from Cursor-native
      // capabilities (web search/fetch, MCP resource list/read) in the
      // model-visible catalog.
      name: collisionSafeAlias ? t.name : `${id.server}-${id.toolName}`,
      description: t.description ?? "",
      input_schema: encodeJsonAsValue(normalizeInputSchema(t.inputSchema)),
      provider_identifier: id.server,
      tool_name: t.sourceName ? t.name : id.toolName
    };
  });
}
function normalizeInputSchema(schema) {
  if (schema && typeof schema === "object" && !Array.isArray(schema)) {
    return schema;
  }
  return { type: "object", properties: {} };
}
function buildCustomWebToolAliases(tools) {
  const aliases = /* @__PURE__ */ new Map();
  const ambiguous = /* @__PURE__ */ new Map();
  const replacements = /* @__PURE__ */ new Map();
  for (const rule of WEB_ALIAS_RULES) {
    if (tools.some((tool) => tool.name === rule.alias))
      continue;
    const exact = tools.filter((tool) => rule.exact.includes(tool.name.toLowerCase()));
    const candidates = exact.length > 0 ? exact : tools.filter((tool) => {
      const name14 = tool.name.toLowerCase();
      return rule.suffixes.some((suffix) => name14.endsWith(suffix));
    });
    if (candidates.length !== 1) {
      if (candidates.length > 1)
        ambiguous.set(rule.alias, candidates.map((tool) => tool.name));
      continue;
    }
    const original = candidates[0].name;
    aliases.set(rule.alias, original);
    replacements.set(original, rule.alias);
  }
  return {
    advertisedTools: tools.map((tool) => {
      const alias = replacements.get(tool.name);
      return alias ? { ...tool, name: alias, sourceName: tool.name } : { ...tool };
    }),
    aliases,
    ambiguous
  };
}
function resolveCustomWebToolAlias(toolName, aliases) {
  const direct = aliases?.get(toolName);
  if (direct)
    return direct;
  for (const [alias, original] of aliases ?? []) {
    if (toolName.endsWith(`_${alias}`))
      return original;
  }
  return toolName;
}
function toolsToMcpDescriptors(tools, providerIdentifier = "opencode", knownMcpServers = []) {
  if (tools.length === 0)
    return [];
  const order = [];
  const byServer = /* @__PURE__ */ new Map();
  for (const t of tools) {
    const id = resolveToolServerIdentity(t.sourceName ?? t.name, providerIdentifier, knownMcpServers);
    let list = byServer.get(id.server);
    if (!list) {
      list = [];
      byServer.set(id.server, list);
      order.push(id.server);
    }
    list.push({
      tool_name: t.sourceName ? t.name : id.toolName,
      description: t.description ?? "",
      input_schema: encodeJsonAsValue(normalizeInputSchema(t.inputSchema))
    });
  }
  return order.map((server) => ({
    server_name: server,
    server_identifier: server,
    tools: byServer.get(server)
  }));
}
function parseSubagentDescriptionCatalog(description) {
  if (!description)
    return { found: false, agents: [] };
  const marker15 = description.indexOf(SUBAGENT_CATALOG_MARKER);
  if (marker15 < 0)
    return { found: false, agents: [] };
  const agents = [];
  const lines = description.slice(marker15 + SUBAGENT_CATALOG_MARKER.length).split(/\r?\n/);
  let started = false;
  for (const line of lines) {
    const match = line.match(/^\s*-\s+([^:]+):\s*(.*)$/);
    if (!match) {
      if (started && line.trim())
        break;
      continue;
    }
    started = true;
    const name14 = match[1].trim().replace(/^`|`$/g, "");
    if (!name14)
      continue;
    const agentDescription = match[2].trim();
    agents.push({
      name: name14,
      ...agentDescription ? { description: agentDescription } : {}
    });
  }
  return { found: true, agents };
}
function subagentTypeEnumValues(schema) {
  const out = /* @__PURE__ */ new Set();
  const seen = /* @__PURE__ */ new Set();
  const visit = (value, propertyName) => {
    if (!value || typeof value !== "object")
      return;
    if (seen.has(value))
      return;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value)
        visit(item, propertyName);
      return;
    }
    const record = value;
    if (propertyName === "subagent_type" && Array.isArray(record.enum)) {
      for (const item of record.enum) {
        if (typeof item === "string" && item)
          out.add(item);
      }
    }
    for (const [key, child] of Object.entries(record))
      visit(child, key);
  };
  visit(schema);
  return [...out];
}
function extractHostSubagentCatalog(tools) {
  const executorTool = tools.find((tool) => tool.name === "task");
  if (!executorTool)
    return { agents: [], complete: true };
  const described = parseSubagentDescriptionCatalog(executorTool.description);
  const enumNames = subagentTypeEnumValues(executorTool.inputSchema);
  const descriptions = new Map(described.agents.map((agent) => [agent.name, agent.description]));
  const names = new Set(enumNames.length > 0 ? enumNames : described.agents.map((agent) => agent.name));
  return {
    executor: "task",
    agents: [...names].map((name14) => ({
      name: name14,
      ...descriptions.get(name14) ? { description: descriptions.get(name14) } : {}
    })),
    complete: enumNames.length > 0 || described.found
  };
}
function cursorSubagentCandidates(subagentType) {
  if (GENERIC_CURSOR_SUBAGENT_TYPES.has(subagentType))
    return ["general"];
  if (subagentType === "cursor-guide" || subagentType === "cursor_guide") {
    return ["scout", "explore", "general"];
  }
  if (subagentType === "explore" || subagentType === "bugbot" || subagentType === "security-review" || subagentType === "security_review") {
    return ["explore", "general"];
  }
  return ["general"];
}
function resolveCursorSubagentType(subagentType, catalog) {
  const available = new Set(catalog?.agents.map((agent) => agent.name) ?? []);
  if (!GENERIC_CURSOR_SUBAGENT_TYPES.has(subagentType) && available.has(subagentType)) {
    return subagentType;
  }
  const candidates = cursorSubagentCandidates(subagentType);
  for (const candidate of candidates) {
    if (available.has(candidate))
      return candidate;
  }
  if (catalog?.complete)
    return void 0;
  return candidates[0];
}
function mapCursorSubagentTypeToOpenCode(subagentType) {
  return CURSOR_SUBAGENT_TYPE_TO_OPENCODE[subagentType] ?? subagentType;
}
function remapNativeSubagentForCatalog(parsed, advertisedToolNames, catalog) {
  if (parsed.resultField !== "subagent_result" || parsed.toolName !== "task")
    return;
  const advertised = new Set(advertisedToolNames);
  if (!advertised.has("task"))
    return;
  const executor = "task";
  const description = str(parsed.args.description) ?? "";
  const prompt = str(parsed.args.prompt) ?? "";
  const cursorSubagentType = str(parsed.resultMetadata?.cursor_subagent_type) ?? str(parsed.args.subagent_type) ?? "";
  const subagentType = resolveCursorSubagentType(cursorSubagentType, catalog);
  if (!subagentType) {
    const available = catalog?.agents.map((agent) => agent.name).join(", ") || "none";
    parsed.localError = `Cursor subagent '${cursorSubagentType}' has no compatible host agent. Available subagents: ${available}.`;
    return;
  }
  const resumeAgentId = str(parsed.args.task_id);
  parsed.toolName = executor;
  parsed.args = {
    description,
    prompt,
    subagent_type: subagentType,
    ...resumeAgentId ? { task_id: resumeAgentId } : {},
    ...parsed.args.background === true ? { background: true } : {}
  };
}
function buildCompleteEditReadMessages(execId, sourcePath, resultPath = sourcePath) {
  try {
    const stat7 = fs4.statSync(sourcePath);
    if (!stat7.isFile() || stat7.size > MAX_EDIT_SOURCE_BYTES)
      return void 0;
    const content = fs4.readFileSync(sourcePath, "utf8");
    return [
      encodeMessage("AgentClientMessage", {
        exec_client_message: {
          id: execId,
          local_execution_time_ms: 0,
          read_result: {
            success: {
              path: resultPath,
              content,
              total_lines: countLines(content),
              file_size: stat7.size,
              truncated: false,
              range_applied: false
            }
          }
        }
      }),
      buildExecStreamClose(execId)
    ];
  } catch {
    return void 0;
  }
}
function replacementOccurrenceCount(source, needle) {
  if (!needle)
    return 0;
  const first = source.indexOf(needle);
  if (first === -1)
    return 0;
  return source.indexOf(needle, first + needle.length) === -1 ? 1 : 2;
}
function previousLineStart(source, start) {
  if (start <= 0)
    return 0;
  const before = source[start - 1] === "\n" ? start - 2 : start - 1;
  return source.lastIndexOf("\n", before) + 1;
}
function followingLineEnd(source, end) {
  if (end >= source.length)
    return source.length;
  const newline = source.indexOf("\n", end);
  return newline === -1 ? source.length : newline + 1;
}
function planWholeFileEdit(source, target) {
  if (!source || source === target)
    return void 0;
  let prefix = 0;
  const shared = Math.min(source.length, target.length);
  while (prefix < shared && source[prefix] === target[prefix])
    prefix++;
  let suffix = 0;
  while (suffix < source.length - prefix && suffix < target.length - prefix && source[source.length - suffix - 1] === target[target.length - suffix - 1])
    suffix++;
  const sourceChangeEnd = source.length - suffix;
  const targetChangeEnd = target.length - suffix;
  let start = prefix === 0 ? 0 : source.lastIndexOf("\n", prefix - 1) + 1;
  let end = sourceChangeEnd >= source.length ? source.length : followingLineEnd(source, sourceChangeEnd);
  if (start === end) {
    if (start > 0)
      start = previousLineStart(source, start);
    else
      end = followingLineEnd(source, end);
  }
  const replacement = () => ({
    oldString: source.slice(start, end),
    newString: source.slice(start, prefix) + target.slice(prefix, targetChangeEnd) + source.slice(sourceChangeEnd, end)
  });
  let result = replacement();
  while (replacementOccurrenceCount(source, result.oldString) !== 1) {
    const priorStart = start;
    const priorEnd = end;
    if (start > 0)
      start = previousLineStart(source, start);
    if (end < source.length)
      end = followingLineEnd(source, end);
    if (start === priorStart && end === priorEnd)
      return void 0;
    result = replacement();
  }
  return result;
}
function remapCorrelatedEditWriteForCatalog(parsed, advertisedToolNames, editPath, workspaceRoot) {
  if (parsed.resultField !== "write_result" || parsed.toolName !== "write")
    return false;
  const advertised = new Set(advertisedToolNames);
  if (!advertised.has("edit") && !advertised.has(APPLY_PATCH_TOOL))
    return false;
  const filePath = str(parsed.args.filePath);
  const content = stringValue(parsed.args.content);
  if (!filePath || content === void 0 || !editPath)
    return false;
  const root = workspaceRoot ?? process.cwd();
  const absolute = path5.resolve(root, filePath);
  if (absolute !== path5.resolve(root, editPath))
    return false;
  let source;
  try {
    const stat7 = fs4.statSync(absolute);
    if (!stat7.isFile() || stat7.size > MAX_EDIT_SOURCE_BYTES)
      return false;
    if (Buffer.byteLength(content, "utf8") > MAX_EDIT_SOURCE_BYTES)
      return false;
    source = fs4.readFileSync(absolute, "utf8");
  } catch {
    return false;
  }
  const replacement = planWholeFileEdit(source, content);
  if (!replacement)
    return false;
  parsed.toolName = "edit";
  parsed.args = {
    filePath,
    oldString: replacement.oldString,
    newString: replacement.newString
  };
  parsed.resultMetadata = { ...parsed.resultMetadata, path: filePath };
  return true;
}
function remapEditToolsForCatalog(parsed, advertisedToolNames, workspaceRoot) {
  if (parsed.toolName !== "write" && parsed.toolName !== "edit")
    return;
  if (binaryWritePayload(parsed))
    return;
  const advertised = new Set(advertisedToolNames);
  if (advertised.has(parsed.toolName) || !advertised.has(APPLY_PATCH_TOOL))
    return;
  const requested = parsed.toolName;
  const filePath = str(parsed.args.filePath);
  const refuse = (reason) => {
    parsed.toolName = APPLY_PATCH_TOOL;
    parsed.args = {};
    parsed.localError = `Cursor ${requested} request cannot be expressed as an apply_patch call: ${reason}. The host advertises \`apply_patch\` instead of \`edit\`/\`write\` for this model.`;
  };
  if (!filePath) {
    refuse("no target path was provided");
    return;
  }
  let patchText;
  if (requested === "write") {
    const content = stringValue(parsed.args.content);
    if (content === void 0) {
      refuse("no file content was provided");
      return;
    }
    patchText = buildAddFilePatch(filePath, content);
  } else {
    const oldString = stringValue(parsed.args.oldString);
    const newString = stringValue(parsed.args.newString);
    if (oldString === void 0 || newString === void 0) {
      refuse("the replacement is missing its old or new text");
      return;
    }
    const absolute = path5.resolve(workspaceRoot ?? process.cwd(), filePath);
    let source;
    try {
      const size = fs4.statSync(absolute).size;
      if (size > MAX_EDIT_SOURCE_BYTES) {
        refuse(`the target file is ${Math.round(size / 1024 / 1024)} MB, too large to patch`);
        return;
      }
      source = fs4.readFileSync(absolute, "utf8");
    } catch (e) {
      refuse(`the target file could not be read (${e.message})`);
      return;
    }
    const plan = planSubstringEdit(source, oldString, newString, parsed.args.replaceAll === true);
    if (!plan.ok) {
      refuse(plan.reason);
      return;
    }
    patchText = buildUpdateFilePatch(filePath, plan.chunks);
  }
  parsed.toolName = APPLY_PATCH_TOOL;
  parsed.args = { patchText };
  parsed.resultMetadata = { ...parsed.resultMetadata, path: filePath };
}
function rejectPartialReadMutation(parsed) {
  if (parsed.localError)
    return;
  let content;
  if (parsed.toolName === "write") {
    content = parsed.args.content;
  } else if (parsed.toolName === APPLY_PATCH_TOOL) {
    const patchText = parsed.args.patchText;
    if (typeof patchText !== "string" || !patchText.includes("*** Add File:"))
      return;
    content = patchText;
  } else {
    return;
  }
  if (typeof content !== "string" || !content.includes("[Partial read:") || !content.includes("It is NOT the complete file."))
    return;
  const filePath = typeof parsed.args.filePath === "string" ? parsed.args.filePath : "the target file";
  const nextOffset = /Continue with offset=(\d+)/.exec(content)?.[1];
  parsed.localError = `NO FILE CHANGE WAS MADE. Refusing a whole-file mutation of ${JSON.stringify(filePath)} because it contains the provider's partial-read notice. Do not retry the same mutation. ` + (nextOffset ? `Read the file from offset=${nextOffset}, then use a targeted edit or Update File patch.` : "Read the remaining file ranges, then use a targeted edit or Update File patch.");
}
function parseExecServerMessage(msg) {
  const id = msg.id;
  if (id === void 0)
    return void 0;
  const execVariant = findOneOfVariant(msg, [
    "read_args",
    "write_args",
    "pi_read_args",
    "pi_bash_args",
    "pi_edit_args",
    "pi_write_args",
    "pi_grep_args",
    "pi_find_args",
    "pi_ls_args",
    "grep_args",
    "ls_args",
    "delete_args",
    "shell_args",
    "shell_stream_args",
    "background_shell_spawn_args",
    "mcp_args",
    "subagent_args"
  ]);
  if (!execVariant)
    return void 0;
  const resultField = cursorExecVariantByRequestName(execVariant)?.resultName;
  if (!resultField)
    return void 0;
  const execId = msg.exec_id ?? "";
  if (execVariant === "background_shell_spawn_args") {
    const raw = msg.background_shell_spawn_args ?? {};
    const command = str(raw.command);
    const workingDirectory = str(raw.working_directory) ?? "";
    const args = {};
    if (command)
      args.command = buildBackgroundShellCommand(command);
    if (workingDirectory)
      args.workdir = workingDirectory;
    return {
      id,
      execId,
      toolName: "bash",
      args,
      resultField,
      resultMetadata: {
        background_shell_spawn: true,
        command: command ?? "",
        working_directory: workingDirectory
      },
      localError: raw.enable_write_shell_stdin_tool === true ? "Interactive background shells are not available through OpenCode's bash tool." : command ? void 0 : "Cursor background shell request is missing a command."
    };
  }
  if (execVariant === "subagent_args") {
    const raw = msg.subagent_args ?? {};
    const prompt = str(raw.prompt);
    const cursorSubagentType = str(raw.subagent_type);
    const subagentType = cursorSubagentType ? mapCursorSubagentTypeToOpenCode(cursorSubagentType) : void 0;
    const args = {
      description: describeSubagentTask(prompt, subagentType),
      prompt: prompt ?? "",
      subagent_type: subagentType ?? ""
    };
    const resumeAgentId = str(raw.resume_agent_id);
    if (resumeAgentId)
      args.task_id = resumeAgentId;
    if (raw.run_in_background === true)
      args.background = true;
    return {
      id,
      execId,
      toolName: "task",
      args,
      resultField,
      resultMetadata: cursorSubagentType ? { cursor_subagent_type: cursorSubagentType } : void 0,
      localError: prompt && cursorSubagentType ? void 0 : "Cursor subagent request is missing a required prompt or subagent type."
    };
  }
  if (execVariant === "mcp_args") {
    const m = msg.mcp_args ?? {};
    const mapped2 = mapCursorArgsToOpencode(mcpRealToolName(m), decodeMcpArgs(m.args), "mcp_args");
    return {
      id,
      execId,
      toolName: mapped2.toolName,
      args: mapped2.args,
      resultField
    };
  }
  if (execVariant === "pi_edit_args") {
    const raw = msg.pi_edit_args ?? {};
    const edits = Array.isArray(raw.edits) ? raw.edits : [];
    const replacement = edits.length === 1 && edits[0] && typeof edits[0] === "object" ? edits[0] : void 0;
    const path25 = str(raw.path);
    const oldString = replacement ? stringValue(replacement.old_text) : void 0;
    const newString = replacement ? stringValue(replacement.new_text) : void 0;
    const args = {};
    if (path25)
      args.filePath = path25;
    if (oldString !== void 0)
      args.oldString = oldString;
    if (newString !== void 0)
      args.newString = newString;
    return {
      id,
      execId,
      toolName: "edit",
      args,
      resultField,
      localError: path25 && oldString && newString !== void 0 ? void 0 : "Cursor Pi edit cannot be represented safely: expected one non-empty replacement."
    };
  }
  const toolName = cursorToolToOpencode[execVariant];
  if (!toolName)
    return void 0;
  const mapped = mapCursorArgsToOpencode(toolName, msg[execVariant] ?? {}, execVariant);
  const rawArgs = msg[execVariant] ?? {};
  const resultMetadata = execVariant === "shell_stream_args" || execVariant === "shell_args" ? shellStreamResultMetadata(rawArgs) : execVariant === "read_args" ? {
    path: str(rawArgs.path) ?? str(rawArgs.file_path) ?? "",
    ...typeof mapped.args.offset === "number" ? { offset: mapped.args.offset } : {},
    ...typeof mapped.args.limit === "number" ? { limit: mapped.args.limit } : {}
  } : void 0;
  if (resultMetadata && resultMetadata.timeout_behavior !== 2 && typeof resultMetadata.timeout_ms === "number") {
    mapped.args.timeout = resultMetadata.timeout_ms;
  }
  return {
    id,
    execId,
    toolName: mapped.toolName,
    args: mapped.args,
    resultField,
    ...resultMetadata || mapped.binaryBytes ? {
      resultMetadata: {
        ...resultMetadata,
        ...mapped.binaryBytes ? {
          binaryWriteBytes: mapped.binaryBytes,
          path: str(rawArgs.path) ?? str(rawArgs.file_path) ?? ""
        } : {}
      }
    } : {}
  };
}
function shellStreamResultMetadata(raw) {
  const timeout = num(raw.timeout) ?? 0;
  const timeoutBehavior = num(raw.timeout_behavior) ?? 0;
  const hardTimeout = num(raw.hard_timeout);
  const effectiveTimeout = timeout !== 0 ? timeout : timeoutBehavior === 2 || hardTimeout !== void 0 && hardTimeout > 0 ? 0 : 3e4;
  return {
    shell_stream: true,
    command: str(raw.command) ?? "",
    working_directory: str(raw.working_directory) ?? "",
    timeout_ms: effectiveTimeout,
    timeout_behavior: timeoutBehavior,
    ...hardTimeout !== void 0 && hardTimeout > 0 ? { hard_timeout_ms: hardTimeout } : {}
  };
}
function mapCursorArgsToOpencode(toolName, raw, execVariant) {
  const cleaned = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === void 0 || v === null)
      continue;
    if (CURSOR_INTERNAL_KEYS.has(k))
      continue;
    if (typeof v === "string" && v.length === 0 && !PRESERVE_EMPTY_STRING_KEYS.has(k))
      continue;
    cleaned[k] = v;
  }
  if (execVariant === "ls_args") {
    const filePath = str(cleaned.path) ?? str(cleaned.filePath);
    return { toolName: "read", args: filePath ? { filePath } : {} };
  }
  if (execVariant === "delete_args") {
    const target = str(cleaned.path) ?? str(cleaned.filePath);
    return {
      toolName: "bash",
      args: target ? { command: `rm -f -- ${shellQuote2(target)}` } : { command: "true" }
    };
  }
  switch (toolName) {
    case "read": {
      const args = {};
      const filePath = str(cleaned.filePath) ?? str(cleaned.path) ?? str(cleaned.file_path);
      if (filePath)
        args.filePath = filePath;
      const offset = num(cleaned.offset);
      if (offset !== void 0 && offset > 0)
        args.offset = offset;
      const limit = num(cleaned.limit);
      if (limit !== void 0 && limit > 0)
        args.limit = limit;
      return { toolName: "read", args };
    }
    case "write": {
      const args = {};
      const filePath = str(cleaned.filePath) ?? str(cleaned.path) ?? str(cleaned.file_path);
      if (filePath)
        args.filePath = filePath;
      const bytes = bytesValue(cleaned.file_bytes) ?? bytesValue(cleaned.fileBytes);
      let content;
      if (bytes !== void 0) {
        content = decodeWriteBytes(bytes, str(cleaned.encoding_hint) ?? str(cleaned.encodingHint));
        if (content === void 0) {
          return { toolName: "write", args, binaryBytes: bytes };
        }
      } else {
        content = stringValue(cleaned.content) ?? stringValue(cleaned.file_text) ?? stringValue(cleaned.fileText);
      }
      if (content !== void 0)
        args.content = content;
      return { toolName: "write", args };
    }
    case "edit": {
      if (typeof cleaned.input === "string") {
        return { toolName: "edit", args: { input: cleaned.input } };
      }
      const args = {};
      const filePath = str(cleaned.filePath) ?? str(cleaned.path) ?? str(cleaned.file_path);
      if (filePath)
        args.filePath = filePath;
      const oldString = stringValue(cleaned.oldString) ?? stringValue(cleaned.old_string);
      if (oldString !== void 0)
        args.oldString = oldString;
      const newString = stringValue(cleaned.newString) ?? stringValue(cleaned.new_string);
      if (newString !== void 0)
        args.newString = newString;
      if (typeof cleaned.replaceAll === "boolean")
        args.replaceAll = cleaned.replaceAll;
      return { toolName: "edit", args };
    }
    case "bash": {
      const args = {};
      const command = str(cleaned.command);
      if (command)
        args.command = command;
      const workdir = str(cleaned.workdir) ?? str(cleaned.working_directory);
      if (workdir)
        args.workdir = workdir;
      const timeout = num(cleaned.timeout);
      if (timeout !== void 0)
        args.timeout = timeout;
      return { toolName: "bash", args };
    }
    case "grep": {
      const pattern = str(cleaned.pattern);
      const path25 = str(cleaned.path);
      const include = str(cleaned.include) ?? str(cleaned.glob);
      if (!pattern) {
        const args2 = { pattern: include ?? "**/*" };
        if (path25)
          args2.path = path25;
        return { toolName: "glob", args: args2 };
      }
      const args = { pattern };
      if (path25)
        args.path = path25;
      if (include)
        args.include = include;
      return { toolName: "grep", args };
    }
    case "glob": {
      const args = {};
      const pattern = str(cleaned.pattern) ?? str(cleaned.glob_pattern) ?? str(cleaned.globPattern);
      if (pattern)
        args.pattern = pattern;
      const path25 = str(cleaned.path) ?? str(cleaned.target_directory) ?? str(cleaned.targetDirectory);
      if (path25)
        args.path = path25;
      return { toolName: "glob", args };
    }
    default:
      return { toolName, args: cleaned };
  }
}
function str(v) {
  return typeof v === "string" && v.length > 0 ? v : void 0;
}
function stringValue(v) {
  return typeof v === "string" ? v : void 0;
}
function bytesValue(v) {
  if (v instanceof Uint8Array)
    return v.length > 0 ? v : void 0;
  if (Array.isArray(v) && v.every((b) => typeof b === "number")) {
    return v.length > 0 ? Uint8Array.from(v) : void 0;
  }
  return void 0;
}
function decodeWriteBytes(bytes, encodingHint) {
  const encoding = encodingHint?.trim().toLowerCase().replace(/[_ ]/g, "-");
  let decoder;
  let label = "utf-8";
  if (encoding && encoding !== "utf-8" && encoding !== "utf8") {
    try {
      decoder = new TextDecoder(encoding, { fatal: true });
      label = encoding;
    } catch {
      trace(`write: unsupported encoding_hint ${JSON.stringify(encodingHint)} \u2014 decoding as utf-8`);
    }
  }
  if (!decoder)
    decoder = new TextDecoder("utf-8", { fatal: true });
  if (!WIDE_TEXT_ENCODING.test(label) && bytes.includes(0))
    return void 0;
  try {
    return decoder.decode(bytes);
  } catch {
    return void 0;
  }
}
function binaryWritePayload(parsed) {
  if (parsed.toolName !== "write")
    return void 0;
  const data = parsed.resultMetadata?.binaryWriteBytes;
  if (!(data instanceof Uint8Array))
    return void 0;
  return { path: str(parsed.resultMetadata?.path) ?? "", data };
}
function num(v) {
  if (typeof v === "number" && Number.isFinite(v))
    return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)))
    return Number(v);
  return void 0;
}
function describeSubagentTask(prompt, subagentType) {
  const words = prompt?.replace(/\s+/g, " ").trim().split(" ").filter(Boolean).slice(0, 5);
  if (words?.length)
    return words.join(" ");
  return `${subagentType || "Delegated"} task`;
}
function shellQuote2(s) {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}
function mcpRealToolName(mcpArgs, defaultServer = "opencode") {
  const toolName = typeof mcpArgs.tool_name === "string" ? mcpArgs.tool_name : void 0;
  const provider = typeof mcpArgs.provider_identifier === "string" ? mcpArgs.provider_identifier : void 0;
  if (toolName) {
    if (provider && provider !== defaultServer) {
      if (toolName.startsWith(`${provider}_`))
        return toolName;
      return `${provider}_${toolName}`;
    }
    return toolName;
  }
  const name14 = typeof mcpArgs.name === "string" ? mcpArgs.name : "";
  const dash = name14.indexOf("-");
  if (dash > 0) {
    const server = name14.slice(0, dash);
    const bare = name14.slice(dash + 1);
    if (server && bare) {
      if (server === defaultServer)
        return bare;
      return `${server}_${bare}`;
    }
  }
  return name14 || "mcp";
}
function decodeMcpArgs(raw) {
  if (!Array.isArray(raw))
    return {};
  const entries = raw.map((a) => typeof a === "string" ? b64ToBytes(a) : a);
  try {
    return decodeStructEntriesToJson(entries);
  } catch {
    return {};
  }
}
function b64ToBytes(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++)
    out[i] = bin.charCodeAt(i);
  return out;
}
function findOneOfVariant(msg, candidates) {
  for (const key of candidates) {
    if (msg[key] !== void 0 && msg[key] !== null) {
      return key;
    }
  }
  return void 0;
}
function untildify(input2) {
  return input2.replace(/^~(?=$|\/|\\)/, os3.homedir());
}
function isUriReadTarget(requested) {
  return /^[a-zA-Z][a-zA-Z0-9+.-]+:\/\//.test(requested);
}
function resolveReadTargetPath(requested, workspaceRoot) {
  const expanded = untildify(requested);
  if (workspaceRoot && !path5.isAbsolute(expanded)) {
    return path5.resolve(workspaceRoot, expanded);
  }
  return path5.resolve(expanded);
}
function classifyMissingReadTarget(absolutePath) {
  let stat7;
  try {
    stat7 = fs4.statSync(absolutePath);
  } catch (e) {
    const code = e.code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return { file_not_found: { path: absolutePath } };
    }
    return void 0;
  }
  if (stat7.isDirectory()) {
    return { invalid_file: { path: absolutePath, reason: "Path is a directory, not a file" } };
  }
  if (!stat7.isFile()) {
    return {
      invalid_file: { path: absolutePath, reason: "Path is neither a file nor a directory" }
    };
  }
  return void 0;
}
function buildReadRejectionMessages(execId, readResult) {
  return [
    encodeMessage("AgentClientMessage", {
      exec_client_message: {
        id: execId,
        local_execution_time_ms: 0,
        read_result: readResult
      }
    }),
    buildExecStreamClose(execId)
  ];
}
function buildExecClientMessages(input2) {
  const resultField = input2.resultField || "mcp_result";
  const frames = [];
  if (resultField === "shell_stream") {
    frames.push(encodeShellStream(input2.execId, void 0, { start: {} }));
    if (input2.error) {
      frames.push(encodeShellStream(input2.execId, void 0, { stderr: { data: input2.error } }));
      frames.push(encodeShellStream(input2.execId, input2.executionTimeMs, { exit: { code: 1, aborted: false } }));
    } else {
      if (input2.output) {
        frames.push(encodeShellStream(input2.execId, void 0, { stdout: { data: input2.output } }));
      }
      if (input2.shellOutcome?.kind === "backgrounded") {
        frames.push(encodeShellStream(input2.execId, input2.executionTimeMs, {
          backgrounded: {
            shell_id: input2.shellOutcome.shellId,
            command: input2.shellOutcome.command,
            working_directory: input2.shellOutcome.workingDirectory,
            pid: input2.shellOutcome.pid,
            ms_to_wait: input2.shellOutcome.msToWait,
            reason: input2.shellOutcome.reason
          }
        }));
      } else if (input2.shellOutcome?.kind === "timeout") {
        frames.push(encodeShellStream(input2.execId, input2.executionTimeMs, {
          // Native CLI represents timeout structurally. ShellAbortReason.TIMEOUT=2.
          exit: { code: 0, aborted: true, abort_reason: 2 }
        }));
      } else {
        const exitCode = input2.shellOutcome?.kind === "exit" ? Math.max(0, Math.min(4294967295, input2.shellOutcome.code)) : 0;
        frames.push(encodeShellStream(input2.execId, input2.executionTimeMs, {
          exit: { code: exitCode, aborted: false }
        }));
      }
    }
  } else {
    const clientMsg = {
      id: input2.execId,
      local_execution_time_ms: input2.executionTimeMs ?? 0
    };
    clientMsg[resultField] = buildTypedExecResult(resultField, input2.output, input2.error, input2.toolName, input2.resultMetadata, input2.shellOutcome, input2.workspaceRoot);
    frames.push(encodeMessage("AgentClientMessage", {
      exec_client_message: clientMsg
    }));
  }
  frames.push(buildExecStreamClose(input2.execId));
  return frames;
}
function buildExecStreamClose(execId) {
  return encodeMessage("AgentClientMessage", {
    exec_client_control_message: {
      stream_close: { id: execId }
    }
  });
}
function buildUnsupportedExecDeny(input2) {
  const { execId, variant, reason } = input2;
  const resultName = variant.resultName;
  const frames = [];
  const throwFrame = (msg) => encodeMessage("AgentClientMessage", {
    exec_client_control_message: {
      throw: { id: execId, error: msg }
    }
  });
  switch (resultName) {
    case "shell_result":
      frames.push(encodeMessage("AgentClientMessage", {
        exec_client_message: {
          id: execId,
          local_execution_time_ms: 0,
          shell_result: { rejected: { reason } }
        }
      }));
      break;
    case "diagnostics_result":
    case "canvas_diagnostics_result":
      frames.push(encodeMessage("AgentClientMessage", {
        exec_client_message: {
          id: execId,
          local_execution_time_ms: 0,
          [resultName]: { error: { path: "", error: reason } }
        }
      }));
      break;
    case "fetch_result":
      frames.push(encodeMessage("AgentClientMessage", {
        exec_client_message: {
          id: execId,
          local_execution_time_ms: 0,
          fetch_result: { error: { url: "", error: reason } }
        }
      }));
      break;
    case "record_screen_result":
      frames.push(encodeMessage("AgentClientMessage", {
        exec_client_message: {
          id: execId,
          local_execution_time_ms: 0,
          record_screen_result: { failure: { error: reason } }
        }
      }));
      break;
    case "computer_use_result":
    case "write_shell_stdin_result":
    case "smart_mode_classifier_result":
      frames.push(encodeMessage("AgentClientMessage", {
        exec_client_message: {
          id: execId,
          local_execution_time_ms: 0,
          [resultName]: { error: { error: reason } }
        }
      }));
      break;
    case "redacted_read_result":
      frames.push(encodeMessage("AgentClientMessage", {
        exec_client_message: {
          id: execId,
          local_execution_time_ms: 0,
          redacted_read_result: { error: { path: "", error: reason } }
        }
      }));
      break;
    case "subagent_await_result":
      frames.push(encodeMessage("AgentClientMessage", {
        exec_client_message: {
          id: execId,
          local_execution_time_ms: 0,
          subagent_await_result: { error: { error: reason } }
        }
      }));
      break;
    case "shell_allowlist_precheck_result":
    case "mcp_allowlist_precheck_result":
    case "web_fetch_allowlist_precheck_result":
      frames.push(encodeMessage("AgentClientMessage", {
        exec_client_message: {
          id: execId,
          local_execution_time_ms: 0,
          [resultName]: { allowlisted: false }
        }
      }));
      break;
    case "force_background_shell_result":
    case "force_background_subagent_result":
      frames.push(encodeMessage("AgentClientMessage", {
        exec_client_message: {
          id: execId,
          local_execution_time_ms: 0,
          [resultName]: { status: FORCE_BACKGROUND_STATUS_ERROR }
        }
      }));
      break;
    case "mini_swe_agent_bash_result":
      frames.push(encodeMessage("AgentClientMessage", {
        exec_client_message: {
          id: execId,
          local_execution_time_ms: 0,
          mini_swe_agent_bash_result: { rejected: { reason } }
        }
      }));
      break;
    case "conversation_search_result":
      frames.push(encodeMessage("AgentClientMessage", {
        exec_client_message: {
          id: execId,
          local_execution_time_ms: 0,
          conversation_search_result: {
            success: { hits: [], truncated: false, partial: false, rebuilding: false }
          }
        }
      }));
      break;
    case "agent_store_conflict_result":
      frames.push(encodeMessage("AgentClientMessage", {
        exec_client_message: {
          id: execId,
          local_execution_time_ms: 0,
          agent_store_conflict_result: { error: { error: reason } }
        }
      }));
      break;
    case "adopt_result":
      frames.push(encodeMessage("AgentClientMessage", {
        exec_client_message: {
          id: execId,
          local_execution_time_ms: 0,
          adopt_result: { error: reason }
        }
      }));
      break;
    case "execute_hook_result":
      frames.push(throwFrame(reason));
      frames.push(buildExecStreamClose(execId));
      return frames;
    default:
      frames.push(throwFrame(reason));
      frames.push(buildExecStreamClose(execId));
      return frames;
  }
  frames.push(buildExecStreamClose(execId));
  return frames;
}
function unwrapReadOutput(output) {
  if (typeof output !== "string" || output.length === 0)
    return output;
  const contentHeaderIdx = output.indexOf("<content>");
  if (contentHeaderIdx === -1)
    return output;
  const header2 = output.slice(0, contentHeaderIdx);
  const hasSkeleton = header2.indexOf("<path>") !== -1 && header2.indexOf("<type>file</type>") !== -1;
  if (!hasSkeleton) {
    trace("unwrapReadOutput: <content> present without leading <path>/<type>file> skeleton \u2014 leaving output unchanged (possible non-read payload or opencode read format drift)");
    return output;
  }
  let rest = output.slice(contentHeaderIdx + "<content>".length);
  if (rest.startsWith("\n"))
    rest = rest.slice(1);
  const raw = [];
  for (const line of rest.split("\n")) {
    const m = /^(\d+):[ \t]?(.*)$/.exec(line);
    if (!m)
      break;
    raw.push(m[2]);
  }
  return raw.join("\n");
}
function buildTypedExecResult(resultField, output, error, toolName, resultMetadata, shellOutcome, workspaceRoot) {
  const resultRoot = typeof workspaceRoot === "string" && workspaceRoot.trim() ? path5.resolve(workspaceRoot) : void 0;
  switch (resultField) {
    case "read_result": {
      const readPath = str(resultMetadata?.path) ?? extractPathTag(output) ?? "";
      if (error)
        return { error: { path: readPath, error } };
      const statPath = extractPathTag(output) ?? readPath;
      const outputMetadata = parseOpenCodeReadMetadata(output);
      const content = restoreCompleteReadTerminator(unwrapReadOutput(output), statPath, outputMetadata, resultMetadata, resultRoot);
      const totalLines = outputMetadata.totalLines ?? readFileLineCount(statPath) ?? countLines(content);
      const rangeApplied = readRangeApplied(resultMetadata, totalLines);
      const notice = readTruncationNotice(output, resultMetadata);
      return {
        success: {
          path: readPath,
          content: notice ? `${content}

${notice}` : content,
          total_lines: totalLines,
          file_size: readFileSize(statPath),
          truncated: readOutputTruncated(resultMetadata, outputMetadata, totalLines),
          range_applied: rangeApplied
        }
      };
    }
    case "grep_result": {
      if (error)
        return { error: { error } };
      const files = extractPathLines(output);
      const cwd = resultRoot ?? "";
      return {
        success: {
          pattern: "",
          path: cwd,
          output_mode: "files_with_matches",
          workspace_results: {
            [cwd]: {
              files: {
                files,
                total_files: files.length,
                client_truncated: false
              }
            }
          }
        }
      };
    }
    case "write_result": {
      const remappedPath = str(resultMetadata?.path);
      if (error)
        return { error: { path: remappedPath ?? "", error } };
      return {
        success: {
          path: remappedPath ?? extractPathTag(output) ?? "",
          lines_created: countLines(output),
          file_size: output.length
        }
      };
    }
    case "pi_write_result":
      if (error)
        return { error: { error } };
      return { success: { output: output || "Wrote file successfully." } };
    case "pi_read_result": {
      if (error)
        return { error: { error } };
      const content = unwrapReadOutput(output);
      const truncation = readTruncationMessage(output, content);
      return { success: { output: content, ...truncation ? { truncation } : {} } };
    }
    case "shell_result": {
      const command = str(resultMetadata?.command) ?? "";
      const workingDirectory = str(resultMetadata?.working_directory) ?? "";
      if (error) {
        return {
          failure: {
            command,
            working_directory: workingDirectory,
            exit_code: 1,
            stdout: output || "",
            stderr: error,
            aborted: false
          }
        };
      }
      if (shellOutcome?.kind === "timeout") {
        return {
          timeout: {
            command,
            working_directory: workingDirectory,
            timeout_ms: shellOutcome.timeoutMs
          }
        };
      }
      if (shellOutcome?.kind === "backgrounded") {
        return {
          success: {
            command: shellOutcome.command || command,
            working_directory: shellOutcome.workingDirectory || workingDirectory,
            exit_code: 0,
            stdout: output,
            shell_id: shellOutcome.shellId,
            pid: shellOutcome.pid,
            ms_to_wait: shellOutcome.msToWait,
            background_reason: shellOutcome.reason
          },
          is_background: true,
          pid: shellOutcome.pid
        };
      }
      const exitCode = shellOutcome?.kind === "exit" ? Math.max(0, Math.min(4294967295, shellOutcome.code)) : 0;
      return {
        success: {
          command,
          working_directory: workingDirectory,
          exit_code: exitCode,
          stdout: output
        }
      };
    }
    case "pi_bash_result":
    case "pi_edit_result":
    case "pi_grep_result":
    case "pi_find_result":
    case "pi_ls_result":
      if (error)
        return { error: { error } };
      return { success: { output } };
    case "delete_result":
      if (error)
        return { error: { path: "", error } };
      return { success: { path: "", deleted_file: "" } };
    case "background_shell_spawn_result": {
      const command = str(resultMetadata?.command) ?? "";
      const workingDirectory = str(resultMetadata?.working_directory) ?? "";
      if (error)
        return { error: { command, working_directory: workingDirectory, error } };
      if (shellOutcome?.kind === "backgrounded") {
        return {
          success: {
            shell_id: shellOutcome.shellId,
            command: shellOutcome.command || command,
            working_directory: shellOutcome.workingDirectory || workingDirectory,
            pid: shellOutcome.pid
          }
        };
      }
      const match = new RegExp(`${BACKGROUND_SHELL_MARKER}(\\d+):([^\\r\\n]+)`).exec(output);
      const pid = match ? Number(match[1]) : 0;
      if (!Number.isSafeInteger(pid) || pid <= 0 || pid > 4294967295) {
        return {
          error: {
            command,
            working_directory: workingDirectory,
            error: "OpenCode did not return a valid background shell process id."
          }
        };
      }
      return {
        success: {
          shell_id: pid,
          command,
          working_directory: workingDirectory,
          pid
        }
      };
    }
    case "ls_result": {
      if (error)
        return { error: { path: "", error } };
      const rootPath = resultRoot ?? "";
      const entries = extractPathLines(output);
      return {
        success: {
          directory_tree_root: {
            abs_path: rootPath,
            children_dirs: [],
            children_files: entries.map((name14) => ({
              name: name14.includes("/") ? name14.slice(name14.lastIndexOf("/") + 1) : name14
            })),
            num_files: entries.length
          }
        }
      };
    }
    case "mcp_result": {
      if (error)
        return { error: { error } };
      if (toolName !== "read") {
        return { success: { content: [{ text: { text: output } }], is_error: false } };
      }
      const notice = readTruncationNotice(output);
      return {
        success: {
          content: [
            { text: { text: unwrapReadOutput(output) } },
            ...notice ? [{ text: { text: notice } }] : []
          ],
          is_error: false
        }
      };
    }
    case "subagent_result": {
      const task = parseOpenCodeTaskOutput(output);
      if (error || task.state === "error") {
        return {
          error: {
            ...task.agentId ? { agent_id: task.agentId } : {},
            error: error ?? task.message ?? output
          }
        };
      }
      return {
        success: {
          agent_id: task.agentId ?? "",
          ...task.message !== void 0 ? { final_message: task.message } : {},
          tool_call_count: 0,
          // OpenCode marks an asynchronous launch as state="running". Cursor's
          // canonical USER_REQUEST enum value is 2; foreground/default is 0.
          background_reason: task.state === "running" ? 2 : 0
        }
      };
    }
    default:
      if (error)
        return { error: { error } };
      return { success: { content: output } };
  }
}
function parseOpenCodeTaskOutput(output) {
  const open = /<task\b([^>]*)>/i.exec(output);
  if (!open)
    return { message: output };
  const attrs = open[1];
  const agentId = /\bid="([^"]+)"/i.exec(attrs)?.[1];
  const state = /\bstate="(running|completed|error)"/i.exec(attrs)?.[1];
  if (!agentId || !state)
    return { message: output };
  const tag = state === "error" ? "task_error" : "task_result";
  const body = new RegExp(`<${tag}>\\n?([\\s\\S]*?)\\n?</${tag}>`, "i").exec(output);
  return {
    agentId,
    state,
    message: body?.[1] ?? output
  };
}
function extractPathTag(output) {
  const m = output.match(/<path>([^<]+)<\/path>/);
  return m?.[1];
}
function readEnvelopeFooter(output) {
  const close = output.lastIndexOf("\n</content>");
  if (close === -1)
    return output;
  const start = output.lastIndexOf("\n\n", close);
  if (start === -1)
    return output;
  return output.slice(start + 2, close);
}
function parseOpenCodeReadMetadata(output) {
  const footer = readEnvelopeFooter(output);
  const showing = /Showing lines (\d+)-(\d+)(?: of (\d+))?\./.exec(footer);
  if (showing) {
    return {
      startLine: Number(showing[1]),
      endLine: Number(showing[2]),
      ...showing[3] ? { totalLines: Number(showing[3]) } : {},
      outputCapped: footer.includes("(Output capped at ")
    };
  }
  const complete = /\(End of file - total (\d+) lines?\)/.exec(footer);
  if (complete)
    return { totalLines: Number(complete[1]) };
  return {};
}
function restoreCompleteReadTerminator(content, readPath, metadata, resultMetadata, workspaceRoot) {
  if (!readPath || metadata.totalLines === void 0 || metadata.startLine !== void 0 || metadata.endLine !== void 0 || num(resultMetadata?.offset) !== void 0 || num(resultMetadata?.limit) !== void 0 || content.endsWith("\n"))
    return content;
  const absolute = path5.isAbsolute(readPath) ? readPath : path5.resolve(workspaceRoot ?? process.cwd(), readPath);
  let fd;
  try {
    fd = fs4.openSync(absolute, "r");
    const size = fs4.fstatSync(fd).size;
    if (size === 0)
      return content;
    const tail = Buffer.alloc(Math.min(2, size));
    fs4.readSync(fd, tail, 0, tail.length, size - tail.length);
    if (tail.length >= 2 && tail[tail.length - 2] === 13 && tail[tail.length - 1] === 10) {
      return `${content}\r
`;
    }
    if (tail[tail.length - 1] === 10)
      return `${content}
`;
  } catch {
  } finally {
    if (fd !== void 0) {
      try {
        fs4.closeSync(fd);
      } catch {
      }
    }
  }
  return content;
}
function readTruncationSummary(output) {
  const meta = parseOpenCodeReadMetadata(output);
  if (meta.startLine === void 0 || meta.endLine === void 0)
    return void 0;
  if (meta.totalLines !== void 0 && meta.endLine >= meta.totalLines && !meta.outputCapped)
    return void 0;
  return {
    startLine: meta.startLine,
    endLine: meta.endLine,
    nextOffset: meta.endLine + 1,
    capped: meta.outputCapped === true,
    ...meta.totalLines !== void 0 ? { totalLines: meta.totalLines } : {}
  };
}
function readTruncationNotice(output, resultMetadata) {
  const summary = readTruncationSummary(output);
  if (!summary)
    return void 0;
  const rangeRequested = num(resultMetadata?.offset) !== void 0 || num(resultMetadata?.limit) !== void 0;
  if (rangeRequested && !summary.capped)
    return void 0;
  const range = summary.totalLines !== void 0 ? `lines ${summary.startLine}-${summary.endLine} of ${summary.totalLines}` : `lines ${summary.startLine}-${summary.endLine}`;
  return `[Partial read: the content above is ${range}` + (summary.capped ? ", capped at the host's 50 KB output limit" : "") + `. It is NOT the complete file. Continue with offset=${summary.nextOffset} before acting on the whole file; writing the content above back would delete everything after line ${summary.endLine}.]`;
}
function readTruncationMessage(output, content) {
  const summary = readTruncationSummary(output);
  if (!summary)
    return void 0;
  return {
    truncated: true,
    truncated_by: summary.capped ? "bytes" : "lines",
    ...summary.totalLines !== void 0 ? { total_lines: summary.totalLines } : {},
    output_lines: Math.max(0, summary.endLine - summary.startLine + 1),
    output_bytes: Buffer.byteLength(content, "utf8"),
    ...summary.capped ? { max_bytes: OPENCODE_READ_MAX_BYTES } : {}
  };
}
function readRangeApplied(resultMetadata, totalLines) {
  const offset = num(resultMetadata?.offset);
  const limit = num(resultMetadata?.limit);
  if (offset === void 0 && limit === void 0)
    return false;
  if (totalLines === 0)
    return false;
  const startLine = offset ?? 1;
  return startLine < 0 || startLine <= totalLines;
}
function readOutputTruncated(resultMetadata, outputMetadata, totalLines) {
  if (outputMetadata.outputCapped)
    return true;
  const returnedEnd = outputMetadata.endLine;
  if (returnedEnd === void 0 || totalLines === 0)
    return false;
  const offset = num(resultMetadata?.offset);
  const limit = num(resultMetadata?.limit);
  const startLine = offset ?? 1;
  if (startLine < 0)
    return false;
  const expectedEnd = limit === void 0 ? totalLines : Math.min(totalLines, Math.max(1, startLine) + limit - 1);
  return returnedEnd < expectedEnd;
}
function readFileSize(filePath) {
  if (!filePath)
    return 0;
  try {
    return fs4.statSync(filePath).size;
  } catch {
    return 0;
  }
}
function readFileLineCount(filePath) {
  if (!filePath)
    return void 0;
  let fd;
  try {
    fd = fs4.openSync(filePath, "r");
    const buffer = Buffer.allocUnsafe(64 * 1024);
    let totalBytes = 0;
    let lines = 1;
    while (true) {
      const bytesRead = fs4.readSync(fd, buffer, 0, buffer.length, null);
      if (bytesRead === 0)
        break;
      totalBytes += bytesRead;
      for (let index = 0; index < bytesRead; index++) {
        if (buffer[index] === 10)
          lines++;
      }
    }
    return totalBytes === 0 ? 0 : lines;
  } catch {
    return void 0;
  } finally {
    if (fd !== void 0) {
      try {
        fs4.closeSync(fd);
      } catch {
      }
    }
  }
}
function extractPathLines(output) {
  const lines = output.split("\n").map((l) => l.trim()).filter(Boolean);
  const paths = lines.filter((l) => l.startsWith("/") || l.startsWith("./") || l.includes("/"));
  return (paths.length > 0 ? paths : lines).slice(0, 2e3);
}
function countLines(s) {
  if (!s)
    return 0;
  let n = 1;
  for (let i = 0; i < s.length; i++)
    if (s.charCodeAt(i) === 10)
      n++;
  return n;
}
function encodeShellStream(execId, executionTimeMs, shellStream) {
  const clientMsg = {
    id: execId,
    shell_stream: shellStream
  };
  if (executionTimeMs !== void 0) {
    clientMsg.local_execution_time_ms = executionTimeMs;
  }
  return encodeMessage("AgentClientMessage", {
    exec_client_message: clientMsg
  });
}
function buildToolCallPart(execMsg, sessionId) {
  return {
    toolCallId: `cursor_${sessionId}_${execMsg.id}`,
    toolName: execMsg.toolName,
    // LanguageModelV3ToolCall.input is a *stringified* JSON object. The AI SDK
    // does `input.trim()` before JSON.parse; emitting a plain object crashes
    // with "input.trim is not a function" and the model retries forever.
    // OpenCode's processor then receives the parsed object from the SDK.
    input: JSON.stringify(execMsg.args ?? {})
  };
}
function parseExecIdFromToolCallId(toolCallId) {
  const match = toolCallId.match(/^cursor_(.+)_(\d+)$/);
  if (!match)
    return void 0;
  const execId = parseInt(match[2], 10);
  if (!Number.isFinite(execId))
    return void 0;
  return { sessionId: match[1], execId };
}
function detectExecVariantField(agentServerPayload) {
  const execBytes = readAllFields(agentServerPayload).find((f) => f.fn === 2 && f.wt === 2)?.bytes;
  if (!execBytes)
    return void 0;
  for (const f of readAllFields(execBytes)) {
    if (f.wt !== 2)
      continue;
    if (f.fn === 1 || f.fn === 15 || f.fn === 19)
      continue;
    return f.fn;
  }
  return void 0;
}
function buildRequestContextResult(execId, requestContext) {
  traceRequestContextPaths(`buildRequestContextResult id=${execId}`, requestContext);
  return encodeMessage("AgentClientMessage", {
    exec_client_message: {
      id: execId,
      request_context_result: {
        success: {
          request_context: requestContext
        }
      }
    }
  });
}
function buildMcpStateResult(execId, args, requestContext) {
  const requested = new Set(Array.isArray(args.server_identifiers) ? args.server_identifiers.filter((id) => typeof id === "string" && id.length > 0) : []);
  const fsOptions = recordValue(requestContext.mcp_file_system_options);
  const nested = Array.isArray(fsOptions?.mcp_descriptors) ? fsOptions.mcp_descriptors.map(recordValue).filter((d) => !!d) : [];
  const descriptors = nested.length > 0 ? nested : descriptorsFromFlatTools(requestContext.tools);
  const flatTools = Array.isArray(requestContext.tools) ? requestContext.tools.map(recordValue).filter((tool) => !!tool) : [];
  const servers = descriptors.filter((descriptor) => {
    const id = stringValue(descriptor.server_identifier);
    return requested.size === 0 || id !== void 0 && requested.has(id);
  }).map((descriptor) => {
    const serverIdentifier = stringValue(descriptor.server_identifier) ?? stringValue(descriptor.server_name) ?? "";
    const tools = Array.isArray(descriptor.tools) ? descriptor.tools.map(recordValue).filter((tool) => !!tool).map((tool) => mcpStateToolDefinition(serverIdentifier, tool, flatTools)) : [];
    return {
      server_name: stringValue(descriptor.server_name) ?? serverIdentifier,
      server_identifier: serverIdentifier,
      tools
    };
  });
  return encodeMessage("AgentClientMessage", {
    exec_client_message: {
      id: execId,
      mcp_state_exec_result: { success: { servers } }
    }
  });
}
function mcpStateToolDefinition(serverIdentifier, descriptor, flatTools) {
  const toolName = stringValue(descriptor.tool_name) ?? "";
  const advertised = flatTools.find((tool) => stringValue(tool.provider_identifier) === serverIdentifier && stringValue(tool.tool_name) === toolName);
  return {
    name: stringValue(advertised?.name) ?? `${serverIdentifier}-${toolName}`,
    description: stringValue(advertised?.description) ?? stringValue(descriptor.description) ?? "",
    input_schema: advertised?.input_schema ?? descriptor.input_schema,
    provider_identifier: serverIdentifier,
    tool_name: toolName
  };
}
function buildListMcpResourcesFallback(execId) {
  return encodeMessage("AgentClientMessage", {
    exec_client_message: {
      id: execId,
      list_mcp_resources_exec_result: { success: { resources: [] } }
    }
  });
}
function buildReadMcpResourceFallback(execId, server, uri) {
  return encodeMessage("AgentClientMessage", {
    exec_client_message: {
      id: execId,
      read_mcp_resource_exec_result: {
        error: { uri, error: `Server "${server}" not found` }
      }
    }
  });
}
function recordValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function descriptorsFromFlatTools(value) {
  if (!Array.isArray(value))
    return [];
  const byServer = /* @__PURE__ */ new Map();
  for (const raw of value) {
    const tool = recordValue(raw);
    if (!tool)
      continue;
    const server = stringValue(tool.provider_identifier) ?? "opencode";
    const tools = byServer.get(server) ?? [];
    tools.push({
      tool_name: stringValue(tool.tool_name) ?? stringValue(tool.name) ?? "",
      description: stringValue(tool.description) ?? "",
      input_schema: tool.input_schema
    });
    byServer.set(server, tools);
  }
  return [...byServer].map(([server, tools]) => ({
    server_name: server,
    server_identifier: server,
    tools
  }));
}
var CUSTOM_WEBSEARCH_TOOL, CUSTOM_WEBFETCH_TOOL, CUSTOM_LIST_MCP_RESOURCES_TOOL, CUSTOM_READ_MCP_RESOURCE_TOOL, WEB_ALIAS_RULES, COLLISION_SAFE_ALIASES, cursorToolToOpencode, CURSOR_INTERNAL_KEYS, PRESERVE_EMPTY_STRING_KEYS, CURSOR_SUBAGENT_TYPE_TO_OPENCODE, SUBAGENT_CATALOG_MARKER, GENERIC_CURSOR_SUBAGENT_TYPES, MAX_EDIT_SOURCE_BYTES, WIDE_TEXT_ENCODING, OPENCODE_READ_MAX_BYTES;
var init_tools = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/tools.js"() {
    init_messages();
    init_struct();
    init_env();
    init_paths();
    init_debug();
    init_exec_variants();
    init_apply_patch();
    init_shell_timeout();
    CUSTOM_WEBSEARCH_TOOL = "custom_websearch";
    CUSTOM_WEBFETCH_TOOL = "custom_webfetch";
    CUSTOM_LIST_MCP_RESOURCES_TOOL = "custom_list_mcp_resources";
    CUSTOM_READ_MCP_RESOURCE_TOOL = "custom_read_mcp_resource";
    WEB_ALIAS_RULES = [
      {
        alias: CUSTOM_WEBSEARCH_TOOL,
        exact: ["websearch", "web_search"],
        suffixes: ["_web_search", "-web_search", "_websearch", "-websearch"]
      },
      {
        alias: CUSTOM_WEBFETCH_TOOL,
        exact: ["webfetch", "web_fetch"],
        suffixes: ["_web_fetch", "-web_fetch", "_webfetch", "-webfetch"]
      },
      {
        alias: CUSTOM_LIST_MCP_RESOURCES_TOOL,
        exact: ["list_mcp_resources"],
        suffixes: ["_list_mcp_resources", "-list_mcp_resources"]
      },
      {
        alias: CUSTOM_READ_MCP_RESOURCE_TOOL,
        exact: ["read_mcp_resource"],
        suffixes: ["_read_mcp_resource", "-read_mcp_resource"]
      }
    ];
    COLLISION_SAFE_ALIASES = /* @__PURE__ */ new Set([
      CUSTOM_WEBSEARCH_TOOL,
      CUSTOM_WEBFETCH_TOOL,
      CUSTOM_LIST_MCP_RESOURCES_TOOL,
      CUSTOM_READ_MCP_RESOURCE_TOOL
    ]);
    cursorToolToOpencode = {
      read_args: "read",
      write_args: "write",
      pi_read_args: "read",
      pi_bash_args: "bash",
      pi_edit_args: "edit",
      pi_write_args: "write",
      pi_grep_args: "grep",
      pi_find_args: "glob",
      pi_ls_args: "read",
      grep_args: "grep",
      ls_args: "read",
      delete_args: "bash",
      shell_args: "bash",
      shell_stream_args: "bash",
      background_shell_spawn_args: "bash",
      subagent_args: "task",
      mcp_args: "mcp"
    };
    CURSOR_INTERNAL_KEYS = /* @__PURE__ */ new Set([
      "tool_call_id",
      "toolCallId",
      "exec_id",
      "span",
      "sandbox_policy",
      "requested_sandbox_policy",
      "smart_mode_approval",
      "smart_mode_approval_only",
      "skip_approval",
      "parsing_result",
      "classifier_result",
      "hook_approval_requirement",
      "conversation_id",
      "simple_commands",
      "has_input_redirect",
      "has_output_redirect",
      "is_background",
      "timeout_behavior",
      "hard_timeout",
      "close_stdin",
      "output_notification",
      "file_output_threshold_bytes",
      // WriteArgs #4. A request for WriteSuccess.file_content_after_write, which we
      // do not populate; harmless to omit, but it is not tool input.
      "return_file_content_after_write",
      "ignore"
    ]);
    PRESERVE_EMPTY_STRING_KEYS = /* @__PURE__ */ new Set([
      "content",
      "file_text",
      "fileText",
      "stream_content",
      // Some advertised edit schemas use a single textual `input` payload. Preserve
      // an empty value so the executor reports the real edit error rather than a
      // misleading missing-property error.
      "input",
      "oldString",
      "old_string",
      "newString",
      "new_string"
    ]);
    CURSOR_SUBAGENT_TYPE_TO_OPENCODE = {
      generalPurpose: "general",
      "general-purpose": "general",
      general_purpose: "general",
      general: "general",
      unspecified: "general",
      "cursor-guide": "explore",
      cursor_guide: "explore",
      "best-of-n-runner": "general",
      best_of_n_runner: "general",
      bash: "general",
      shell: "general",
      debug: "general",
      computer_use: "general",
      computerUse: "general",
      browser_use: "general",
      browserUse: "general",
      media_review: "general",
      mediaReview: "general",
      watch_video: "general",
      watchVideo: "general",
      vm_setup_helper: "general",
      vmSetupHelper: "general",
      explore: "explore",
      bugbot: "explore",
      "security-review": "explore",
      security_review: "explore"
    };
    SUBAGENT_CATALOG_MARKER = "Available agent types and the tools they have access to:";
    GENERIC_CURSOR_SUBAGENT_TYPES = /* @__PURE__ */ new Set([
      "generalPurpose",
      "general-purpose",
      "general_purpose",
      "general",
      "unspecified"
    ]);
    MAX_EDIT_SOURCE_BYTES = 50 * 1024 * 1024;
    WIDE_TEXT_ENCODING = /^utf-?(16|32)/;
    OPENCODE_READ_MAX_BYTES = 50 * 1024;
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/request.js
function buildSeedConversationState(input2) {
  const root = getMessageTypes();
  const type = root.lookupType("ConversationStateStructure");
  const messages = [];
  if (input2?.systemPrompt && input2.systemPrompt.length > 0) {
    messages.push(JSON.stringify({ role: "system", content: input2.systemPrompt }));
  }
  for (const entry of input2?.history ?? []) {
    if (!entry.content)
      continue;
    if (entry.role === "system" && input2?.systemPrompt)
      continue;
    messages.push(JSON.stringify({ role: entry.role, content: entry.content }));
  }
  const obj = {};
  if (messages.length > 0)
    obj.root_prompt_messages_json = messages;
  return type.encode(type.fromObject(obj)).finish();
}
function buildRunRequest(input2) {
  const msgId = input2.messageId ?? crypto.randomUUID();
  const tools = input2.tools ?? [];
  const mcpTools = input2.toolDescriptors ?? (tools.length > 0 ? toolsToDescriptors(tools) : []);
  const requestContext = input2.requestContext;
  const userMessage = {
    text: input2.text,
    message_id: msgId
  };
  if (input2.images?.length) {
    userMessage.selected_context = {
      selected_images: input2.images.map((image) => ({
        data: image.data,
        uuid: crypto.randomUUID(),
        path: image.filename,
        mime_type: image.mimeType
      }))
    };
  }
  const userMessageAction = { user_message: userMessage };
  if (requestContext)
    userMessageAction.request_context = requestContext;
  const action = input2.action === "resume" ? { resume_action: {} } : { user_message_action: userMessageAction };
  const conversationState = input2.conversationState && input2.conversationState.length > 0 ? input2.conversationState : buildSeedConversationState({
    systemPrompt: input2.systemPrompt,
    history: input2.history
  });
  const runRequest = {
    conversation_id: input2.conversationId,
    conversation_group_id: input2.conversationGroupId ?? input2.conversationId,
    run_id: msgId,
    action,
    requested_model: {
      // The provider always selects a concrete model. Cursor's "default"
      // pseudo-model (Auto) is never used here — we send the real id plus the
      // chosen variant's parameter values.
      model_id: input2.modelId,
      max_mode: input2.maxMode ?? false,
      parameters: input2.parameterValues ?? []
    },
    conversation_state: conversationState,
    // Keep #4 populated too (harmless on real turns; useful for prewarm /
    // older server builds that still read it).
    mcp_tools: { mcp_tools: mcpTools },
    unknown_flag: 0,
    field_12: 0
  };
  return encodeMessage("AgentClientMessage", {
    run_request: runRequest
  });
}
function buildHeartbeat() {
  return encodeMessage("AgentClientMessage", {
    client_heartbeat: {}
  });
}
var init_request = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/request.js"() {
    init_messages();
    init_tools();
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/git-diff.js
import { execFile } from "node:child_process";
import fs5 from "node:fs";
import path6 from "node:path";
import { promisify } from "node:util";
function gitErrorMessage(error, fallback) {
  if (!error || typeof error !== "object")
    return fallback;
  const err = error;
  const stderr = typeof err.stderr === "string" ? err.stderr.trim() : "";
  if (stderr)
    return stderr.split("\n")[0] ?? stderr;
  if (typeof err.message === "string" && err.message)
    return err.message;
  return fallback;
}
async function git(cwd, args, options) {
  try {
    const { stdout, stderr } = await execFileAsync("git", args, {
      cwd,
      encoding: "utf8",
      timeout: GIT_TIMEOUT_MS,
      maxBuffer: GIT_MAX_BUFFER,
      env: GIT_ENV
    });
    return {
      stdout: options?.trim === false ? stdout : stdout.trimEnd(),
      stderr: stderr ?? "",
      code: 0
    };
  } catch (error) {
    const err = error;
    const code = typeof err.code === "number" ? err.code : 1;
    if (options?.ignoreExit) {
      return {
        stdout: options.trim === false ? err.stdout ?? "" : (err.stdout ?? "").trimEnd(),
        stderr: err.stderr ?? "",
        code
      };
    }
    throw new Error(gitErrorMessage(error, `git ${args.join(" ")} failed`));
  }
}
function str2(value) {
  return typeof value === "string" ? value : "";
}
function num2(value) {
  if (typeof value === "number" && Number.isFinite(value))
    return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return void 0;
}
function resolveGitCwd(requestCwd, workspaceRoot) {
  const root = path6.resolve(workspaceRoot || process.cwd());
  const requested = requestCwd.trim();
  if (!requested)
    return root;
  return path6.isAbsolute(requested) ? path6.resolve(requested) : path6.resolve(root, requested);
}
async function resolveDefaultBase(cwd) {
  try {
    const head = (await git(cwd, ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"])).stdout.trim();
    if (head)
      return head;
  } catch {
  }
  for (const name14 of DEFAULT_REMOTE_BRANCHES) {
    const ref = `origin/${name14}`;
    try {
      await git(cwd, ["rev-parse", "--verify", ref]);
      return ref;
    } catch {
    }
  }
  try {
    const remotes = (await git(cwd, ["branch", "-r"])).stdout.split("\n").map((line) => line.trim()).find((line) => line.startsWith("origin/"));
    if (remotes)
      return remotes;
  } catch {
  }
  try {
    const configured = (await git(cwd, ["config", "--get", "init.defaultBranch"])).stdout.trim();
    if (configured)
      return configured;
  } catch {
  }
  throw new Error("Could not determine default branch");
}
function stripDiffPrefix(value) {
  return value.replace(/^[abiwco12]\//, "");
}
function parseDiffGitPaths(line) {
  if (!line.startsWith("diff --git "))
    return void 0;
  const rest = line.slice("diff --git ".length).trim();
  const match = rest.match(/^(?:[abiwco12]\/)?(.+?) (?:[abiwco12]\/)?(.+)$/);
  if (!match)
    return void 0;
  return { from: stripDiffPrefix(match[1]), to: stripDiffPrefix(match[2]) };
}
function parsePathHeader(line) {
  const body = line.replace(/^(---|\+\+\+)\s+/, "");
  const tab = body.indexOf("	");
  const raw = (tab >= 0 ? body.slice(0, tab) : body).trim().replace(/^["']|["']$/g, "");
  if (raw === "/dev/null")
    return "/dev/null";
  return stripDiffPrefix(raw);
}
function parseUnifiedDiff(text) {
  if (!text || /^\s+$/.test(text))
    return [];
  const diffs = [];
  let current;
  let chunk;
  let remainingOld = 0;
  let remainingNew = 0;
  let oldLine = 0;
  let newLine = 0;
  let inHunk = false;
  const startFile = (from = "", to = "") => {
    current = { from, to, chunks: [], added: 0, removed: 0 };
    diffs.push(current);
    chunk = void 0;
    inHunk = false;
  };
  const ensureFile = () => {
    if (!current)
      startFile();
  };
  const appendNoNewline = (line) => {
    if (!chunk || chunk.lines.length === 0)
      return;
    chunk.lines.push(line);
  };
  for (const line of text.split("\n")) {
    if (inHunk && chunk && current) {
      if (line === "\\ No newline at end of file") {
        appendNoNewline(line);
        continue;
      }
      if (line.startsWith("-")) {
        chunk.lines.push(line);
        current.removed++;
        oldLine++;
        remainingOld--;
      } else if (line.startsWith("+")) {
        chunk.lines.push(line);
        current.added++;
        newLine++;
        remainingNew--;
      } else if (line.startsWith(" ") || line === "") {
        chunk.lines.push(line.length === 0 ? " " : line);
        oldLine++;
        newLine++;
        remainingOld--;
        remainingNew--;
      } else {
        inHunk = false;
      }
      if (inHunk && remainingOld <= 0 && remainingNew <= 0)
        inHunk = false;
      if (inHunk)
        continue;
    }
    if (line.startsWith("diff --git ")) {
      const paths = parseDiffGitPaths(line);
      startFile(paths?.from ?? "", paths?.to ?? "");
      continue;
    }
    if (line.startsWith("new file mode ")) {
      ensureFile();
      current.from = "/dev/null";
      continue;
    }
    if (line.startsWith("deleted file mode ")) {
      ensureFile();
      current.to = "/dev/null";
      continue;
    }
    if (line.startsWith("--- ")) {
      ensureFile();
      current.from = parsePathHeader(line);
      continue;
    }
    if (line.startsWith("+++ ")) {
      ensureFile();
      current.to = parsePathHeader(line);
      continue;
    }
    const hunk = /^@@\s+-(\d+),?(\d+)?\s+\+(\d+),?(\d+)?\s@@/.exec(line);
    if (hunk) {
      ensureFile();
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[3]);
      remainingOld = hunk[2] !== void 0 ? Number(hunk[2]) : 1;
      remainingNew = hunk[4] !== void 0 ? Number(hunk[4]) : 1;
      chunk = {
        content: line,
        lines: [],
        old_start: Number(hunk[1]),
        old_lines: remainingOld,
        new_start: Number(hunk[3]),
        new_lines: remainingNew
      };
      current.chunks.push(chunk);
      inHunk = true;
    }
  }
  return diffs;
}
function effectiveFormat(raw) {
  switch (raw) {
    case GIT_DIFF_FORMAT_NAME_STATUS:
    case GIT_DIFF_FORMAT_NAME_STATUS_AND_NUMSTAT:
    case GIT_DIFF_FORMAT_FILE_DIFFS:
    case GIT_DIFF_FORMAT_DIFFS_WITH_BEFORE_AND_AFTER:
      return raw;
    default:
      return GIT_DIFF_FORMAT_FILE_DIFFS;
  }
}
async function collectUntrackedDiffs(cwd, maxFiles) {
  if (maxFiles <= 0)
    return [];
  const listed = (await git(cwd, ["ls-files", "--others", "--exclude-standard"])).stdout.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, maxFiles);
  const extra = [];
  for (const file of listed) {
    const raw = await git(cwd, ["diff", "--no-color", "--no-index", "/dev/null", file], {
      ignoreExit: true,
      trim: false
    });
    extra.push(...parseUnifiedDiff(raw.stdout));
  }
  return extra;
}
async function executeGitDiff(request, workspaceRoot) {
  const cwd = resolveGitCwd(str2(request.cwd), workspaceRoot);
  if (!fs5.existsSync(cwd)) {
    throw new Error(`git_diff cwd does not exist: ${cwd}`);
  }
  const inside = await git(cwd, ["rev-parse", "--is-inside-work-tree"]).catch((error) => {
    throw new Error(gitErrorMessage(error, "not a git repository"));
  });
  if (inside.stdout.trim() !== "true") {
    throw new Error("not a git repository");
  }
  const ref = str2(request.ref);
  let base = str2(request.base_ref);
  if (!base)
    base = await resolveDefaultBase(cwd);
  if (request.merge_base === true) {
    base = (await git(cwd, ["merge-base", base, ref || "HEAD"])).stdout.trim();
  }
  const args = ["diff", "--no-color"];
  if (request.include_space_changes !== true)
    args.push("--ignore-space-change");
  const contextLines = num2(request.unified_context_lines);
  if (contextLines !== void 0 && contextLines > 0)
    args.push(`-U${contextLines}`);
  args.push(base);
  if (ref)
    args.push(ref);
  const targetPaths = Array.isArray(request.target_paths) ? request.target_paths.filter((item) => typeof item === "string" && item.length > 0) : [];
  if (targetPaths.length > 0) {
    args.push("--");
    args.push(...targetPaths);
  }
  const diffText = (await git(cwd, args, { trim: false })).stdout;
  const diffs = parseUnifiedDiff(diffText);
  diffs.push(...await collectUntrackedDiffs(cwd, num2(request.max_untracked_files) ?? 0));
  const format = effectiveFormat(num2(request.output_format));
  if (format !== GIT_DIFF_FORMAT_FILE_DIFFS && format !== GIT_DIFF_FORMAT_DIFFS_WITH_BEFORE_AND_AFTER) {
    for (const diff of diffs)
      diff.chunks = [];
  }
  const response = {
    diff: {
      diffs,
      diff_type: 0
    }
  };
  if (request.return_head_sha === true) {
    response.head_sha = (await git(cwd, ["rev-parse", "HEAD"])).stdout.trim();
    const status = (await git(cwd, ["status", "--porcelain=v1", "--untracked-files=all"])).stdout.trim();
    response.has_uncommitted_changes = status.length > 0;
  }
  return response;
}
function throwAndClose(execId, error) {
  return [
    encodeMessage("AgentClientMessage", {
      exec_client_control_message: {
        throw: { id: execId, error }
      }
    }),
    encodeMessage("AgentClientMessage", {
      exec_client_control_message: {
        stream_close: { id: execId }
      }
    })
  ];
}
async function buildGitDiffExecMessages(input2) {
  let response;
  try {
    response = await executeGitDiff(input2.request, input2.workspaceRoot);
  } catch (error) {
    return throwAndClose(input2.execId, error.message || "git_diff failed");
  }
  const responseBytes = encodeMessage("GetDiffResponse", response);
  const maxBytes = num2(input2.request.max_response_bytes) ?? 0;
  if (maxBytes > 0 && responseBytes.byteLength > maxBytes) {
    return throwAndClose(input2.execId, `GetDiffResponseTooLarge: ${responseBytes.byteLength} bytes exceeds the ${maxBytes} byte limit`);
  }
  return [
    encodeMessage("AgentClientMessage", {
      exec_client_message: {
        id: input2.execId,
        local_execution_time_ms: 0,
        git_diff_response: response
      }
    }),
    encodeMessage("AgentClientMessage", {
      exec_client_control_message: {
        stream_close: { id: input2.execId }
      }
    })
  ];
}
var execFileAsync, GIT_DIFF_FORMAT_NAME_STATUS, GIT_DIFF_FORMAT_NAME_STATUS_AND_NUMSTAT, GIT_DIFF_FORMAT_FILE_DIFFS, GIT_DIFF_FORMAT_DIFFS_WITH_BEFORE_AND_AFTER, DEFAULT_REMOTE_BRANCHES, GIT_TIMEOUT_MS, GIT_MAX_BUFFER, GIT_ENV;
var init_git_diff = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/git-diff.js"() {
    init_messages();
    execFileAsync = promisify(execFile);
    GIT_DIFF_FORMAT_NAME_STATUS = 1;
    GIT_DIFF_FORMAT_NAME_STATUS_AND_NUMSTAT = 2;
    GIT_DIFF_FORMAT_FILE_DIFFS = 3;
    GIT_DIFF_FORMAT_DIFFS_WITH_BEFORE_AND_AFTER = 4;
    DEFAULT_REMOTE_BRANCHES = ["main", "master", "develop"];
    GIT_TIMEOUT_MS = 3e4;
    GIT_MAX_BUFFER = 32 * 1024 * 1024;
    GIT_ENV = {
      ...process.env,
      GIT_TERMINAL_PROMPT: "0",
      GIT_OPTIONAL_LOCKS: "0"
    };
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/workspace-grounding.js
function appendWorkspaceRootGrounding(reason, workspaceRoot) {
  if (!workspaceRoot || !workspaceRoot.trim())
    return reason;
  if (reason.includes("Workspace root:"))
    return reason;
  return `${reason}
Workspace root: ${JSON.stringify(workspaceRoot)}. Resolve workspace paths against exactly this root; never invent an absolute prefix, and verify uncertain paths with an available tool before using them.`;
}
var init_workspace_grounding = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/workspace-grounding.js"() {
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/progress-continuation.js
function normalizeWhitespace(text) {
  return text.trim().replace(/\s+/g, " ");
}
function restAfterPrefix(text, prefix) {
  return text.slice(prefix.length).trim();
}
function isProgressOnlyAssistantText(text) {
  const trimmed = text.trim();
  if (!trimmed)
    return false;
  if (trimmed.length > 240)
    return false;
  if (/\n\s*\n/.test(trimmed))
    return false;
  const normalized = normalizeWhitespace(trimmed);
  const withoutEllipsis = normalized.replace(/(?:\.{3}|…)+\s*$/u, "").trim();
  if (!withoutEllipsis)
    return false;
  if (/[.!?;:]/.test(withoutEllipsis))
    return false;
  if (withoutEllipsis.includes(","))
    return false;
  if (withoutEllipsis.split(" ").length > MAX_PROGRESS_FRAGMENT_WORDS)
    return false;
  if (!PROGRESS_ONLY_PATTERNS.some((pattern) => pattern.test(withoutEllipsis)))
    return false;
  const lower = withoutEllipsis.toLowerCase();
  if (lower.startsWith("let me check")) {
    return withoutEllipsis.length > "let me check".length;
  }
  if (lower.startsWith("looking into") || lower.startsWith("looking at")) {
    const prefix = lower.startsWith("looking into") ? "looking into" : "looking at";
    return INSPECTION_OBJECT.test(restAfterPrefix(withoutEllipsis, prefix));
  }
  if (PREFIXES_WITH_OBJECT.some((pattern) => pattern.test(withoutEllipsis))) {
    const rest = withoutEllipsis.replace(/^\S+\s+/i, "");
    return INSPECTION_OBJECT.test(rest);
  }
  return false;
}
function shouldContinueProgressOnlyTurn(input2) {
  return input2.allowTools && input2.advertisedToolCount > 0 && input2.pendingExecs === 0 && input2.emittedHostTools === 0 && input2.continuationAttempts < 1 && isProgressOnlyAssistantText(input2.assistantText);
}
function progressOnlyContinuationPrompt(workspaceRoot) {
  const base = "Continue the same turn now. Your previous assistant message was only progress narration and ended without a tool call or a complete answer. Do not repeat the progress update. If evidence is still needed, call an available listed tool immediately; otherwise provide the complete user-facing answer now. Do not finish until the requested work or answer is complete.";
  if (!workspaceRoot || !workspaceRoot.trim())
    return base;
  return appendWorkspaceRootGrounding(base, workspaceRoot);
}
var PROGRESS_ONLY_PATTERNS, PREFIXES_WITH_OBJECT, INSPECTION_OBJECT, MAX_PROGRESS_FRAGMENT_WORDS;
var init_progress_continuation = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/progress-continuation.js"() {
    init_workspace_grounding();
    PROGRESS_ONLY_PATTERNS = [
      /^checking\b/i,
      /^inspecting\b/i,
      /^let me check\b/i,
      /^looking into\b/i,
      /^looking at\b/i,
      /^reviewing\b/i,
      /^scanning\b/i,
      /^verifying\b/i,
      /^examining\b/i,
      /^investigating\b/i
    ];
    PREFIXES_WITH_OBJECT = [
      /^checking\b/i,
      /^inspecting\b/i,
      /^reviewing\b/i,
      /^scanning\b/i,
      /^verifying\b/i,
      /^examining\b/i,
      /^investigating\b/i
    ];
    INSPECTION_OBJECT = /^(?:the|how|whether|if|for|on|this|that|it)\b/i;
    MAX_PROGRESS_FRAGMENT_WORDS = 8;
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/ask-question.js
function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function str3(value) {
  return typeof value === "string" ? value : "";
}
function extractArgsBytes(queryBytes) {
  let offset = 0;
  while (offset < queryBytes.length) {
    let key = 0;
    let shift = 0;
    while (offset < queryBytes.length) {
      const byte = queryBytes[offset++];
      key |= (byte & 127) << shift;
      if ((byte & 128) === 0)
        break;
      shift += 7;
      if (shift > 28)
        return void 0;
    }
    const fieldNumber = key >>> 3;
    const wireType = key & 7;
    if (wireType === 2) {
      let length = 0;
      let lengthShift = 0;
      while (offset < queryBytes.length) {
        const byte = queryBytes[offset++];
        length |= (byte & 127) << lengthShift;
        if ((byte & 128) === 0)
          break;
        lengthShift += 7;
        if (lengthShift > 28)
          return void 0;
      }
      if (offset + length > queryBytes.length)
        return void 0;
      if (fieldNumber === 1)
        return queryBytes.subarray(offset, offset + length);
      offset += length;
    } else if (wireType === 0) {
      while (offset < queryBytes.length && (queryBytes[offset++] & 128) !== 0) {
      }
    } else if (wireType === 5) {
      offset += 4;
    } else if (wireType === 1) {
      offset += 8;
    } else {
      return void 0;
    }
  }
  return void 0;
}
function decodeAskQuestionQuery(queryBytes) {
  let decoded;
  try {
    decoded = decodeMessageSparse("AskQuestionInteractionQuery", queryBytes);
  } catch {
    return void 0;
  }
  const rawArgs = extractArgsBytes(queryBytes);
  const argsRecord = asRecord(decoded.args);
  if (!argsRecord || !rawArgs)
    return void 0;
  const questions = Array.isArray(argsRecord.questions) ? argsRecord.questions.flatMap((raw) => {
    const item = asRecord(raw);
    if (!item)
      return [];
    const prompt = str3(item.prompt);
    if (!prompt)
      return [];
    const options = Array.isArray(item.options) ? item.options.flatMap((rawOption) => {
      const option = asRecord(rawOption);
      if (!option)
        return [];
      const label = str3(option.label);
      if (!label)
        return [];
      return [{ id: str3(option.id), label }];
    }) : [];
    return [{
      id: str3(item.id),
      prompt,
      options,
      allowMultiple: item.allow_multiple === true
    }];
  }) : [];
  if (questions.length === 0)
    return void 0;
  return {
    args: {
      title: str3(argsRecord.title),
      questions,
      runAsync: argsRecord.run_async === true
    },
    rawArgs,
    toolCallId: str3(decoded.tool_call_id)
  };
}
function isCatchAllOptionLabel(label) {
  const normalized = label.toLowerCase().trim();
  return normalized === "other" || normalized === "something else" || normalized.startsWith("other:") || normalized.startsWith("other -") || normalized.startsWith("other (") || normalized.startsWith("something else:") || normalized.startsWith("something else -") || normalized.startsWith("something else (");
}
function displayOptions(question) {
  const last = question.options.at(-1);
  if (last && isCatchAllOptionLabel(last.label))
    return question.options.slice(0, -1);
  return question.options.slice();
}
function header(title) {
  const trimmed = title.trim();
  if (!trimmed)
    return "Question";
  return trimmed.length > HEADER_MAX_LENGTH ? trimmed.slice(0, HEADER_MAX_LENGTH - 1).trimEnd() + "\u2026" : trimmed;
}
function askQuestionToolInput(args) {
  return {
    questions: args.questions.map((question) => ({
      question: question.prompt,
      header: header(args.title),
      options: displayOptions(question).map((option) => ({
        label: option.label,
        description: ""
      })),
      ...question.allowMultiple ? { multiple: true } : {}
    }))
  };
}
function rejectedResult(reason) {
  return { rejected: { reason: reason ?? SKIPPED_REASON } };
}
function parseAnswerSegments(questions, output) {
  const answers = [];
  let cursor = 0;
  for (const question of questions) {
    const anchor = `"${question.prompt}"="`;
    const start = output.indexOf(anchor, cursor);
    if (start < 0) {
      answers.push(void 0);
      continue;
    }
    const valueStart = start + anchor.length;
    const nextAnchorStart = questions.map((other) => output.indexOf(`"${other.prompt}"="`, valueStart)).filter((index) => index > valueStart).reduce((min, index) => min < 0 || index < min ? index : min, -1);
    const searchEnd = nextAnchorStart >= 0 ? nextAnchorStart : output.length;
    const valueEnd = output.lastIndexOf('"', searchEnd - 1);
    if (valueEnd < valueStart) {
      answers.push(void 0);
      continue;
    }
    answers.push(output.slice(valueStart, valueEnd));
    cursor = valueEnd;
  }
  return answers;
}
function answerForQuestion(question, segment) {
  const answer = { question_id: question.id };
  if (segment === void 0 || segment.trim().length === 0 || segment.trim() === UNANSWERED) {
    return answer;
  }
  const byLabel = new Map(displayOptions(question).map((option) => [option.label.trim().toLowerCase(), option.id]));
  const selected = [];
  const custom = [];
  for (const piece of segment.split(", ")) {
    const label = piece.trim();
    if (!label)
      continue;
    const optionId = byLabel.get(label.toLowerCase());
    if (optionId !== void 0)
      selected.push(optionId);
    else
      custom.push(label);
  }
  if (selected.length > 0)
    answer.selected_option_ids = selected;
  if (custom.length > 0)
    answer.freeform_text = custom.join(", ");
  else if (selected.length === 0)
    answer.freeform_text = "Other";
  return answer;
}
function askQuestionResultFromToolOutput(args, output, isError) {
  if (isError) {
    const reason = output.trim();
    return rejectedResult(reason.length > 0 ? reason : DISMISSED_REASON);
  }
  const segments = parseAnswerSegments(args.questions, output);
  return {
    success: {
      answers: args.questions.map((question, index) => answerForQuestion(question, segments[index]))
    }
  };
}
var ASK_QUESTION_RESULT_FIELD, SKIPPED_REASON, DISMISSED_REASON, MISSING_QUERY_REASON, MISSING_ARGS_REASON, HEADER_MAX_LENGTH, UNANSWERED;
var init_ask_question = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/ask-question.js"() {
    init_messages();
    ASK_QUESTION_RESULT_FIELD = "ask_question_interaction_response";
    SKIPPED_REASON = "Questions skipped by user";
    DISMISSED_REASON = "Ask-question prompt dismissed";
    MISSING_QUERY_REASON = "Missing ask-question query";
    MISSING_ARGS_REASON = "Missing ask-question arguments";
    HEADER_MAX_LENGTH = 30;
    UNANSWERED = "Unanswered";
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/switch-mode.js
function asRecord2(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function str4(value) {
  return typeof value === "string" ? value : "";
}
function normalizeSwitchModeId(targetModeId) {
  return targetModeId.trim().toLowerCase();
}
function mapSwitchModeTarget(targetModeId) {
  const id = normalizeSwitchModeId(targetModeId);
  if (!id)
    return { ok: false, reason: MISSING_TARGET_REASON };
  if (id === "plan" || id === "spec") {
    return { ok: true, toolName: "plan_enter" };
  }
  return { ok: true, toolName: "plan_exit" };
}
function switchModeExitQuestionItem() {
  return {
    id: "switch_mode_exit",
    prompt: SWITCH_MODE_EXIT_QUESTION,
    options: [
      { id: "yes", label: SWITCH_MODE_EXIT_YES },
      { id: "no", label: SWITCH_MODE_EXIT_NO }
    ],
    allowMultiple: false
  };
}
function switchModeExitQuestionInput() {
  return {
    questions: [
      {
        question: SWITCH_MODE_EXIT_QUESTION,
        header: SWITCH_MODE_EXIT_HEADER,
        options: [
          {
            label: SWITCH_MODE_EXIT_YES,
            description: "Switch to build agent and start implementing the plan"
          },
          {
            label: SWITCH_MODE_EXIT_NO,
            description: "Stay with plan agent to continue refining the plan"
          }
        ]
      }
    ]
  };
}
function resolveSwitchModeBridge(targetModeId, options) {
  const mapped = mapSwitchModeTarget(targetModeId);
  if (!mapped.ok)
    return { kind: "reject", reason: mapped.reason };
  if (!options.allowTools)
    return { kind: "ack" };
  if (options.activeModeId && normalizeSwitchModeId(options.activeModeId) === normalizeSwitchModeId(targetModeId)) {
    return { kind: "approve" };
  }
  const names = options.advertised instanceof Set ? options.advertised : new Set(options.advertised);
  if (names.has(mapped.toolName))
    return { kind: "native", toolName: mapped.toolName };
  if (mapped.toolName === "plan_enter")
    return { kind: "approve" };
  if (names.has("question")) {
    return { kind: "question", input: switchModeExitQuestionInput() };
  }
  return { kind: "reject", reason: PLAN_EXIT_UNAVAILABLE_REASON };
}
function decodeSwitchModeQuery(queryBytes) {
  let decoded;
  try {
    decoded = decodeMessageSparse("SwitchModeRequestQuery", queryBytes);
  } catch {
    return void 0;
  }
  const argsRecord = asRecord2(decoded.args);
  if (!argsRecord)
    return void 0;
  const targetModeId = str4(argsRecord.target_mode_id);
  if (!targetModeId.trim())
    return void 0;
  const toolCallId = str4(argsRecord.tool_call_id) || str4(decoded.tool_call_id);
  return {
    args: {
      targetModeId,
      explanation: str4(argsRecord.explanation),
      toolCallId
    },
    toolCallId
  };
}
function switchModeToolInput() {
  return {};
}
function switchModeApprovedResult() {
  return { approved: {} };
}
function switchModeRejectedResult(reason) {
  return { rejected: { reason } };
}
function switchModeResultFromToolOutput(output, isError) {
  if (!isError)
    return switchModeApprovedResult();
  const trimmed = output.trim();
  if (!trimmed || /reject/i.test(trimmed) || /denied/i.test(trimmed) || /permission/i.test(trimmed) || /cancelled|canceled|dismissed/i.test(trimmed)) {
    return switchModeRejectedResult(USER_REJECTED_REASON);
  }
  return switchModeRejectedResult(trimmed);
}
function switchModeResultFromQuestionOutput(output, isError) {
  if (isError)
    return switchModeResultFromToolOutput(output, true);
  const [segment] = parseAnswerSegments([switchModeExitQuestionItem()], output);
  const answer = (segment ?? "").trim().toLowerCase();
  if (answer === SWITCH_MODE_EXIT_YES.toLowerCase())
    return switchModeApprovedResult();
  return switchModeRejectedResult(USER_REJECTED_REASON);
}
function setActiveCursorMode(sessionKey, targetModeId, options = {}) {
  if (!sessionKey)
    return;
  const modeId = normalizeSwitchModeId(targetModeId);
  if (!modeId)
    return;
  activeCursorModeBySession.set(sessionKey, {
    modeId,
    firstTurn: true,
    bridgedPlanEntered: options.bridgedPlanEntered === true
  });
}
function getActiveCursorMode(sessionKey) {
  if (!sessionKey)
    return void 0;
  return activeCursorModeBySession.get(sessionKey)?.modeId;
}
function isCursorPlanModeActive(sessionKey) {
  const mode = getActiveCursorMode(sessionKey);
  return mode === "plan" || mode === "spec";
}
function isBridgedCursorPlanModeActive(sessionKey) {
  if (!sessionKey)
    return false;
  const state = activeCursorModeBySession.get(sessionKey);
  return (state?.modeId === "plan" || state?.modeId === "spec") && state.bridgedPlanEntered;
}
function wrapReminder(body) {
  return `<system_reminder>
${body.trim()}
</system_reminder>`;
}
function cursorModeSystemReminder(targetModeId, options = {}) {
  const id = normalizeSwitchModeId(targetModeId);
  if (!id)
    return void 0;
  const first = options.firstTurn !== false;
  const leavePlan = options.planExitAdvertised === false ? "record the finished plan (Cursor CreatePlan). Writing it needs no approval, and the user is then asked whether to start implementing; if they decline, refine the plan and record it again" : "record the finished plan, then call OpenCode `plan_exit` so the user can approve leaving plan mode";
  if (id === "plan" || id === "spec") {
    return wrapReminder(first ? `Plan mode is active. The user does not want execution yet -- you MUST NOT make edits, run non-readonly tools (including changing configs or making commits), or otherwise modify system state. This supersedes any conflicting instruction.

1. Research enough to make an accurate plan.
2. Before finishing, resolve decisions that would materially change the implementation path, touched files, architecture, user-visible behavior, data model, or validation strategy. If investigation cannot resolve one, ask clarifying questions in small batches (use the OpenCode \`question\` tool when available).
3. Do not put choices in the plan for the user to resolve. The plan must present one recommended approach, not unresolved questions or "choose A or B" options.
4. When ready, ${leavePlan}.
5. Do not execute the plan until the user confirms it.` : `Plan mode is still active. You MUST NOT make edits, run non-readonly tools (including changing configs or making commits), or otherwise modify system state. This supersedes any conflicting instruction.`);
  }
  if (id === "chat") {
    return wrapReminder(first ? `Ask mode is active. The user wants you to answer questions about their codebase or coding in general. You MUST NOT make any edits, run any non-readonly tools (including changing configs or making commits), or otherwise make any changes to the system. This supersedes any other instructions you have received (for example, to make edits).

Your role in Ask mode:

1. Answer the user's questions comprehensively and accurately. Focus on providing clear, detailed explanations.
2. Use readonly tools to explore the codebase and gather information needed to answer the user's questions.
3. Provide code examples and references when helpful, citing specific file paths and line numbers.
4. If you need more information, ask the user for clarification (OpenCode \`question\` when available).
5. You may provide suggestions about how to implement something, but you MUST NOT actually implement it yourself.
6. If the user asks you to make changes or implement something, politely remind them that you're in Ask mode and can only provide information and guidance. Suggest they switch to Agent mode (OpenCode \`plan_exit\` / SwitchMode target agent) if they want you to make changes.` : `Ask mode is still active. You MUST NOT make any edits, run any non-readonly tools (including changing configs or making commits), or otherwise make any changes to the system. This supersedes any other instructions you have received (for example, to make edits).`);
  }
  if (id === "debug") {
    return wrapReminder(first ? `You are now in **DEBUG MODE**. You must debug with **runtime evidence**.

**Why this approach:** Traditional AI agents jump to fixes claiming high confidence, but fail due to lacking runtime information. You cannot and must NOT fix bugs from code-only guesses \u2014 you need actual runtime data.

**Your systematic workflow:**
1. Generate 3-5 precise hypotheses about WHY the bug occurs.
2. Instrument code with logs to test hypotheses in parallel.
3. Ask the user to reproduce the bug. Conclude with a <reproduction_steps>...</reproduction_steps> block when the user must run something (mandatory unless the issue is fully confirmed fixed).
4. Analyze logs, accept/reject hypotheses, and only then implement a fix.
5. Verify the fix with runtime evidence before claiming success.

Prefer reproduction, runtime logs, and end-to-end verification over speculative refactors.` : `Debug mode is still active. You must debug with **runtime evidence**.

**During fixes:** Do NOT remove instrumentation until post-fix verification logs prove success or the user explicitly asks you to remove it.
**Testing:** Prefer reproduction, runtime logs, and end-to-end verification; run tests when they directly exercise a hypothesis or confirm the final fix.
**Reproduction steps (MANDATORY):** Unless the issue is fully confirmed fixed, conclude with a <reproduction_steps>...</reproduction_steps> block when the user must reproduce.
**If fix failed:** Generate NEW hypotheses from different subsystems and add more instrumentation.`);
  }
  if (id === "multitask") {
    return wrapReminder(`Multitask Mode is active. You are a coordinator who pushes meaningful work to asynchronous workers through the OpenCode \`task\` tool (prefer background=true when the host supports it).

- For most non-trivial requests, launch or resume one coherent worker and let that worker handle the investigation/implementation.
- After delegating the only coherent worker task, do not redo the same work in the foreground. Only coordinate, answer a new independent question, or synthesize after multiple workers return.
- NEVER await or sleep while waiting for a running subagent \u2014 end your response; you will be notified when it completes.
- Do NOT aggressively decompose small or medium tasks into many sibling agents. Multitask Mode is about moving substantial work out of the foreground, not maximizing parallel agents.
- For trivial requests (zero or one tool call), fulfill them directly and disregard these Multitask instructions.`);
  }
  if (id === "triage") {
    return wrapReminder(first ? `Triage mode is active. Your job is to coordinate long-horizon, multi-step work by delegating to subagents and integrating their progress.

1. Break the user's task into well-scoped subtasks and launch subagents with the OpenCode \`task\` tool. Provide clear objectives and context so each subagent can make measurable progress.
2. Routinely inspect subagent output and synthesize results.
3. Decide next steps and iterate: launch additional agents, request revisions, or merge work when ready.
4. Throughout triage mode, maintain a global plan, document your decisions, and ensure the combined work moves the user toward their goal.` : `Triage mode is still active. You must continue to coordinate long-horizon, multi-step work by delegating to subagents and integrating their progress.`);
  }
  if (id === "project") {
    return wrapReminder(`You are Project Agent Mode: a long-running, high-level planner and orchestrator for complex software projects.

Your mandate is to convert user intent into a correct, high-quality implementation by delegating nearly all work to subagents and coordinating them safely over long horizons.

## Non-Negotiable Rules
1) Orchestrate, don't execute \u2014 you are NOT an implementer. Workspace modifications MUST be performed by OpenCode \`task\` subagents.
2) Task-first for everything \u2014 default to spawning subagents for research, exploration, implementation, validation, and review. Use your own read-only tools only for quick triage and synthesizing plans.
3) No work without clarity \u2014 if ambiguity remains, stop and ask clarifying questions (OpenCode \`question\` when available).
4) Phase-gated workflow \u2014 Clarify \u2192 Research \u2192 Plan \u2192 User Review \u2192 Implement \u2192 Review \u2192 Iterate \u2192 Finalize. Do not skip phases.
5) Externalize state \u2014 assume chat context may be condensed; keep durable progress notes so work can resume from written artifacts.`);
  }
  if (id === "background") {
    return wrapReminder(`Cloud / background mode intent is active. Prefer long-running and environment/browser automation work via OpenCode \`task\` subagents (background=true when advertised) rather than blocking the foreground turn.

- Useful when the task needs browser automation, multi-service environments, or should keep running if the local session is interrupted.
- After launching background work, end your response promptly; do not busy-wait.
- For short local unit/lint/typecheck work, stay in ordinary agent execution instead.`);
  }
  return wrapReminder(first ? `Agent mode is active (OpenCode build / agents). You have left plan mode and may implement: edit files, run tools, and execute the agreed approach.

- Prefer making progress with the advertised host tools.
- If the task is large or ambiguous again, switch back to plan mode (OpenCode \`plan_enter\` / SwitchMode target plan) before a large rewrite.` : `Agent mode is still active. Continue implementing with the advertised host tools. Switch back to plan mode only when a new large/ambiguous design decision appears.`);
}
function takeActiveCursorModeReminder(sessionKey, options = {}) {
  if (!sessionKey)
    return void 0;
  const state = activeCursorModeBySession.get(sessionKey);
  if (!state)
    return void 0;
  const advertised = options.advertisedTools ? options.advertisedTools instanceof Set ? options.advertisedTools : new Set(options.advertisedTools) : void 0;
  const isPlanMode = state.modeId === "plan" || state.modeId === "spec";
  if (isPlanMode && state.bridgedPlanEntered && advertised) {
    if (advertised.has("plan_enter")) {
      activeCursorModeBySession.delete(sessionKey);
      return cursorModeSystemReminder("agent", { firstTurn: true });
    }
  }
  const reminder = cursorModeSystemReminder(state.modeId, {
    firstTurn: state.firstTurn,
    ...advertised ? { planExitAdvertised: advertised.has("plan_exit") } : {}
  });
  if (state.firstTurn)
    state.firstTurn = false;
  return reminder;
}
var SWITCH_MODE_RESULT_FIELD, USER_REJECTED_REASON, MISSING_QUERY_REASON2, MISSING_ARGS_REASON2, MISSING_TARGET_REASON, PLAN_EXIT_UNAVAILABLE_REASON, SWITCH_MODE_EXIT_QUESTION, SWITCH_MODE_EXIT_HEADER, SWITCH_MODE_EXIT_YES, SWITCH_MODE_EXIT_NO, activeCursorModeBySession;
var init_switch_mode = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/switch-mode.js"() {
    init_ask_question();
    init_messages();
    SWITCH_MODE_RESULT_FIELD = "switch_mode_request_response";
    USER_REJECTED_REASON = "Mode switch rejected by user";
    MISSING_QUERY_REASON2 = "Missing switch-mode query";
    MISSING_ARGS_REASON2 = "Missing switch-mode arguments";
    MISSING_TARGET_REASON = "Missing targetModeId";
    PLAN_EXIT_UNAVAILABLE_REASON = "Neither the OpenCode `plan_exit` tool nor the `question` tool is available to the current agent, so leaving plan mode cannot be approved this turn.";
    SWITCH_MODE_EXIT_QUESTION = "Planning is complete. Would you like to switch to the build agent and start implementing?";
    SWITCH_MODE_EXIT_HEADER = "Build Agent";
    SWITCH_MODE_EXIT_YES = "Yes";
    SWITCH_MODE_EXIT_NO = "No";
    activeCursorModeBySession = /* @__PURE__ */ new Map();
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/tool-call-bridge.js
function asRecord3(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : void 0;
}
function findToolVariant(toolCall) {
  for (const key of TOOL_CALL_VARIANTS) {
    if (toolCall[key] != null)
      return key;
  }
  for (const [key, value] of Object.entries(toolCall)) {
    if (!key.endsWith("_tool_call"))
      continue;
    if (value && typeof value === "object")
      return key;
  }
  return void 0;
}
function mapTodoStatus(status) {
  if (typeof status === "string" && status.length > 0) {
    const s = status.toLowerCase().replace(/^todo_status_/, "");
    if (s === "unspecified")
      return "pending";
    return s;
  }
  if (typeof status === "number" && TODO_STATUS[status])
    return TODO_STATUS[status];
  return "pending";
}
function mapTodos(raw) {
  if (!Array.isArray(raw))
    return [];
  return raw.map((item, index) => {
    const t = asRecord3(item) ?? {};
    const content = typeof t.content === "string" ? t.content : "";
    const id = typeof t.id === "string" && t.id.length > 0 ? t.id : `todo_${index + 1}`;
    return {
      id,
      content,
      status: mapTodoStatus(t.status),
      priority: typeof t.priority === "string" && t.priority ? t.priority : "medium"
    };
  });
}
function unwrapArgs(variantPayload) {
  const nested = asRecord3(variantPayload.args);
  return nested ?? variantPayload;
}
function parseDisplayToolCall(callId, toolCall) {
  if (!toolCall || !callId)
    return void 0;
  const variant = findToolVariant(toolCall);
  if (!variant)
    return void 0;
  const payload = asRecord3(toolCall[variant]);
  if (!payload)
    return void 0;
  const args = unwrapArgs(payload);
  if (variant === "mcp_tool_call") {
    const name14 = mcpRealToolName(args);
    let mcpArgs = asRecord3(args.args) ?? {};
    if (Array.isArray(args.args)) {
      mcpArgs = decodeStructEntriesToJson(args.args);
    }
    return {
      callId,
      variant,
      preferredToolName: name14,
      args: mcpArgs
    };
  }
  if (variant === "update_todos_tool_call" || variant === "create_plan_tool_call") {
    const result = asRecord3(payload.result);
    const success = asRecord3(result?.success);
    const completedTodos = Array.isArray(success?.todos) ? success.todos : void 0;
    const isMerge = variant === "update_todos_tool_call" && args.merge === true;
    const sourceTodos = completedTodos ?? (!isMerge ? args.todos : void 0);
    const todos = mapTodos(sourceTodos);
    if (variant === "create_plan_tool_call") {
      const overview = typeof args.overview === "string" ? args.overview.trim() : "";
      const plan = typeof args.plan === "string" ? args.plan.trim() : "";
      const name14 = typeof args.name === "string" ? args.name.trim() : "";
      if (overview || plan || name14) {
        todos.unshift({
          id: "plan",
          content: [name14 && `Plan: ${name14}`, overview, plan].filter(Boolean).join("\n").slice(0, 2e3),
          status: "pending",
          priority: "high"
        });
      }
    }
    return {
      callId,
      variant,
      preferredToolName: "todowrite",
      args: { todos },
      bridgeable: variant === "create_plan_tool_call" ? todos.length > 0 : Array.isArray(sourceTodos)
    };
  }
  if (variant === "edit_tool_call") {
    const path25 = typeof args.path === "string" ? args.path : "";
    const content = typeof args.stream_content === "string" ? args.stream_content : void 0;
    return {
      callId,
      variant,
      preferredToolName: "write",
      args: { path: path25, content },
      bridgeable: path25.length > 0 && content !== void 0
    };
  }
  if (variant === "pi_edit_tool_call") {
    const path25 = typeof args.path === "string" ? args.path : "";
    const edits = Array.isArray(args.edits) ? args.edits : [];
    const replacement = edits.length === 1 ? asRecord3(edits[0]) : void 0;
    const oldText = replacement?.old_text;
    const newText = replacement?.new_text;
    return {
      callId,
      variant,
      preferredToolName: "edit",
      args: { path: path25, old_string: oldText, new_string: newText },
      bridgeable: path25.length > 0 && typeof oldText === "string" && oldText.length > 0 && typeof newText === "string"
    };
  }
  if (variant === "task_tool_call") {
    const subagentType = openCodeSubagentType(args.subagent_type);
    const description = typeof args.description === "string" ? args.description : "";
    const prompt = typeof args.prompt === "string" ? args.prompt : "";
    const taskArgs = {
      description,
      prompt,
      subagent_type: subagentType
    };
    if (typeof args.resume === "string" && args.resume)
      taskArgs.task_id = args.resume;
    return {
      callId,
      variant,
      preferredToolName: "task",
      args: taskArgs,
      bridgeable: description.length > 0 && prompt.length > 0 && !!subagentType
    };
  }
  if (variant === "ask_question_tool_call") {
    const title = typeof args.title === "string" ? args.title : "";
    const questions = Array.isArray(args.questions) ? args.questions.map((q) => {
      const qq = asRecord3(q) ?? {};
      const prompt = typeof qq.prompt === "string" ? qq.prompt : "";
      const options = Array.isArray(qq.options) ? qq.options.map((o) => {
        const oo = asRecord3(o) ?? {};
        return {
          label: typeof oo.label === "string" ? oo.label : String(oo.id ?? ""),
          description: typeof oo.description === "string" ? oo.description : ""
        };
      }) : [];
      return {
        question: prompt,
        header: typeof qq.id === "string" && qq.id || title || "Question",
        options,
        multiple: qq.allow_multiple === true
      };
    }) : [];
    return {
      callId,
      variant,
      preferredToolName: "question",
      args: { questions }
    };
  }
  if (variant === "switch_mode_tool_call") {
    const target = typeof args.target_mode_id === "string" ? args.target_mode_id : "";
    const mapped = mapSwitchModeTarget(target);
    return {
      callId,
      variant,
      preferredToolName: mapped.ok ? mapped.toolName : "plan_exit",
      // OpenCode plan_enter / plan_exit both advertise an empty input schema.
      args: {},
      bridgeable: mapped.ok
    };
  }
  if (variant === "delete_tool_call") {
    const path25 = typeof args.path === "string" ? args.path : "";
    return {
      callId,
      variant,
      preferredToolName: "bash",
      args: path25 ? { command: `rm -f -- ${shellQuote3(path25)}` } : { command: "true" }
    };
  }
  const preferred = VARIANT_TO_OPENCODE[variant] ?? variant.replace(/_tool_call$/, "");
  return {
    callId,
    variant,
    preferredToolName: preferred,
    args
  };
}
function shellQuote3(s) {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}
function resolveBridgedOpenCodeToolCall(display, advertised) {
  if (!DISPLAY_STATE_MIRROR_VARIANTS.has(display.variant))
    return void 0;
  if (display.bridgeable === false)
    return void 0;
  const names = new Set([...advertised].filter(Boolean));
  if (names.size === 0)
    return void 0;
  const candidates = candidateToolNames(display, names);
  for (const toolName of candidates) {
    if (!names.has(toolName))
      continue;
    const mapped = mapCursorArgsToOpencode(toolName, display.args);
    if (toolName === "todowrite") {
      mapped.args = {
        todos: mapTodos(display.args.todos ?? mapped.args.todos)
      };
    }
    return {
      toolName: mapped.toolName,
      args: mapped.args,
      callId: display.callId,
      variant: display.variant
    };
  }
  return void 0;
}
function candidateToolNames(display, advertised) {
  const out = [];
  const add = (n) => {
    if (n && !out.includes(n))
      out.push(n);
  };
  add(display.preferredToolName);
  if (display.variant === "create_plan_tool_call")
    add("todowrite");
  if (display.variant === "update_todos_tool_call")
    add("todowrite");
  if (display.variant === "read_todos_tool_call")
    add("todoread");
  if (display.variant === "ask_question_tool_call")
    add("question");
  if (display.variant === "web_search_tool_call")
    add("websearch");
  if (display.variant === "fetch_tool_call" || display.variant === "web_fetch_tool_call") {
    add("webfetch");
  }
  for (const name14 of advertised) {
    if (name14.toLowerCase() === display.preferredToolName.toLowerCase())
      add(name14);
  }
  return out;
}
function openCodeSubagentType(raw) {
  const subtype = asRecord3(raw);
  if (!subtype)
    return void 0;
  const custom = asRecord3(subtype.custom);
  if (typeof custom?.name === "string" && custom.name.length > 0)
    return custom.name;
  if (subtype.explore != null)
    return mapCursorSubagentTypeToOpenCode("explore");
  if (subtype.cursor_guide != null)
    return mapCursorSubagentTypeToOpenCode("cursor_guide");
  if (subtype.bash != null)
    return mapCursorSubagentTypeToOpenCode("bash");
  if (subtype.shell != null)
    return mapCursorSubagentTypeToOpenCode("shell");
  if (subtype.debug != null)
    return mapCursorSubagentTypeToOpenCode("debug");
  if (subtype.computer_use != null)
    return mapCursorSubagentTypeToOpenCode("computer_use");
  if (subtype.browser_use != null)
    return mapCursorSubagentTypeToOpenCode("browser_use");
  if (subtype.media_review != null)
    return mapCursorSubagentTypeToOpenCode("media_review");
  if (subtype.watch_video != null)
    return mapCursorSubagentTypeToOpenCode("watch_video");
  if (subtype.vm_setup_helper != null)
    return mapCursorSubagentTypeToOpenCode("vm_setup_helper");
  if (subtype.unspecified != null)
    return mapCursorSubagentTypeToOpenCode("unspecified");
  return void 0;
}
function advertisedToolNamesFromDescriptors(descriptors) {
  const out = [];
  for (const d of descriptors) {
    const toolName = typeof d.tool_name === "string" ? d.tool_name : void 0;
    const provider = typeof d.provider_identifier === "string" ? d.provider_identifier : "opencode";
    if (!toolName)
      continue;
    if (provider && provider !== "opencode")
      out.push(`${provider}_${toolName}`);
    else
      out.push(toolName);
  }
  return out;
}
function listProtobufFieldNumbers(buf) {
  const fields = [];
  let i = 0;
  while (i < buf.length) {
    let key = 0;
    let shift = 0;
    while (i < buf.length) {
      const byte = buf[i++];
      key |= (byte & 127) << shift;
      if ((byte & 128) === 0)
        break;
      shift += 7;
      if (shift > 35)
        return fields;
    }
    const field = key >>> 3;
    const wire = key & 7;
    fields.push(field);
    if (wire === 0) {
      while (i < buf.length && (buf[i++] & 128) !== 0) {
      }
    } else if (wire === 1) {
      i += 8;
    } else if (wire === 2) {
      let len = 0;
      shift = 0;
      while (i < buf.length) {
        const byte = buf[i++];
        len |= (byte & 127) << shift;
        if ((byte & 128) === 0)
          break;
        shift += 7;
        if (shift > 35)
          return fields;
      }
      i += len;
    } else if (wire === 5) {
      i += 4;
    } else {
      break;
    }
    if (i > buf.length)
      break;
  }
  return fields;
}
function extractProtobufSubmessage(buf, path25) {
  let cur = buf;
  for (const want of path25) {
    if (!cur)
      return void 0;
    let i = 0;
    let found;
    while (i < cur.length) {
      let key = 0;
      let shift = 0;
      while (i < cur.length) {
        const byte = cur[i++];
        key |= (byte & 127) << shift;
        if ((byte & 128) === 0)
          break;
        shift += 7;
        if (shift > 35)
          return void 0;
      }
      const field = key >>> 3;
      const wire = key & 7;
      if (wire === 0) {
        while (i < cur.length && (cur[i++] & 128) !== 0) {
        }
      } else if (wire === 1) {
        i += 8;
      } else if (wire === 2) {
        let len = 0;
        shift = 0;
        while (i < cur.length) {
          const byte = cur[i++];
          len |= (byte & 127) << shift;
          if ((byte & 128) === 0)
            break;
          shift += 7;
          if (shift > 35)
            return void 0;
        }
        const slice = cur.subarray(i, i + len);
        i += len;
        if (field === want)
          found = slice;
      } else if (wire === 5) {
        i += 4;
      } else {
        return void 0;
      }
      if (i > cur.length)
        return void 0;
    }
    cur = found;
  }
  return cur;
}
function extractExecDisplayCallId(execMsg) {
  for (const key of [
    "read_args",
    "write_args",
    "pi_write_args",
    "grep_args",
    "ls_args",
    "delete_args",
    "shell_stream_args",
    "background_shell_spawn_args",
    "mcp_args",
    "subagent_args"
  ]) {
    const args = asRecord3(execMsg[key]);
    if (!args)
      continue;
    if (typeof args.tool_call_id === "string" && args.tool_call_id.length > 0) {
      return args.tool_call_id;
    }
  }
  return void 0;
}
var TODO_STATUS, VARIANT_TO_OPENCODE, TOOL_CALL_VARIANTS, DISPLAY_STATE_MIRROR_VARIANTS;
var init_tool_call_bridge = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/tool-call-bridge.js"() {
    init_tools();
    init_struct();
    init_switch_mode();
    TODO_STATUS = {
      0: "pending",
      1: "pending",
      2: "in_progress",
      3: "completed",
      4: "cancelled"
    };
    VARIANT_TO_OPENCODE = {
      shell_tool_call: "bash",
      delete_tool_call: "bash",
      glob_tool_call: "glob",
      grep_tool_call: "grep",
      read_tool_call: "read",
      update_todos_tool_call: "todowrite",
      read_todos_tool_call: "todoread",
      edit_tool_call: "write",
      ls_tool_call: "read",
      mcp_tool_call: "mcp",
      create_plan_tool_call: "todowrite",
      web_search_tool_call: "websearch",
      task_tool_call: "task",
      ask_question_tool_call: "question",
      fetch_tool_call: "webfetch",
      web_fetch_tool_call: "webfetch",
      switch_mode_tool_call: "plan_enter",
      generate_image_tool_call: "generateimage",
      await_tool_call: "await",
      get_mcp_tools_tool_call: "get_mcp_tools",
      pi_read_tool_call: "read",
      pi_bash_tool_call: "bash",
      pi_edit_tool_call: "edit",
      pi_write_tool_call: "write",
      pi_grep_tool_call: "grep",
      pi_find_tool_call: "glob",
      pi_ls_tool_call: "read"
    };
    TOOL_CALL_VARIANTS = Object.keys(VARIANT_TO_OPENCODE);
    DISPLAY_STATE_MIRROR_VARIANTS = /* @__PURE__ */ new Set([
      "update_todos_tool_call",
      "create_plan_tool_call"
    ]);
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/blob-reachability.js
function hex(bytes) {
  let result = "";
  for (let index = 0; index < bytes.length; index++) {
    result += bytes[index].toString(16).padStart(2, "0");
  }
  return result;
}
function bytesFields(data) {
  const reader = import_protobufjs2.default.Reader.create(data);
  const fields = [];
  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    const number = tag >>> 3;
    const wireType = tag & 7;
    if (number === 0)
      throw new Error("invalid protobuf field zero");
    if (wireType === 2)
      fields.push({ number, bytes: reader.bytes() });
    else
      reader.skipType(wireType);
  }
  return fields;
}
function mapValue(entry) {
  return bytesFields(entry).find((field) => field.number === 2)?.bytes;
}
function collectReachableConversationBlobIds(checkpoint, resolveBlob) {
  const reachable = /* @__PURE__ */ new Set();
  const reference = (id) => {
    if (id.length === 0)
      return void 0;
    reachable.add(hex(id));
    const value = resolveBlob(id);
    if (!value)
      throw new Error(`missing referenced blob ${hex(id)}`);
    return value;
  };
  const walkUserMessage = (data) => {
    const selectedContext = bytesFields(data).find((field) => field.number === 3)?.bytes;
    if (!selectedContext)
      return;
    for (const imageField of bytesFields(selectedContext)) {
      if (imageField.number !== 1)
        continue;
      for (const imagePart of bytesFields(imageField.bytes)) {
        if (imagePart.number === 1) {
          reference(imagePart.bytes);
        } else if (imagePart.number === 9) {
          const blobId = bytesFields(imagePart.bytes).find((field) => field.number === 1)?.bytes;
          if (blobId)
            reference(blobId);
        }
      }
    }
  };
  const walkTurn = (data) => {
    for (const turnField of bytesFields(data)) {
      if (turnField.number === 1) {
        for (const agentField of bytesFields(turnField.bytes)) {
          if (agentField.number === 1) {
            const userMessage = reference(agentField.bytes);
            if (userMessage)
              walkUserMessage(userMessage);
          } else if (agentField.number === 2) {
            reference(agentField.bytes);
          }
        }
        return;
      }
      if (turnField.number === 2) {
        for (const shellField of bytesFields(turnField.bytes)) {
          if (shellField.number === 1 || shellField.number === 2) {
            reference(shellField.bytes);
          }
        }
        return;
      }
    }
  };
  const walkPersistedSubagent = (data, depth) => {
    const nestedState = bytesFields(data).find((field) => field.number === 1)?.bytes;
    if (nestedState)
      walkState(nestedState, depth + 1);
  };
  const walkState = (data, depth) => {
    if (depth > MAX_NESTED_STATE_DEPTH)
      throw new Error("conversation state nesting is too deep");
    for (const field of bytesFields(data)) {
      switch (field.number) {
        case 8: {
          const turn = reference(field.bytes);
          if (turn)
            walkTurn(turn);
          break;
        }
        case 1:
        // root_prompt_messages_json
        case 3:
        // todos
        case 6:
        // summary
        case 7:
        // plan
        case 13:
          reference(field.bytes);
          break;
        case 16: {
          const persisted = mapValue(field.bytes);
          if (persisted)
            walkPersistedSubagent(persisted, depth);
          break;
        }
        case 31: {
          const subagentId = mapValue(field.bytes);
          if (!subagentId)
            break;
          const persisted = reference(subagentId);
          if (persisted)
            walkPersistedSubagent(persisted, depth);
          break;
        }
      }
    }
  };
  walkState(checkpoint, 0);
  return reachable;
}
var import_protobufjs2, MAX_NESTED_STATE_DEPTH;
var init_blob_reachability = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/blob-reachability.js"() {
    import_protobufjs2 = __toESM(require_protobufjs(), 1);
    MAX_NESTED_STATE_DEPTH = 64;
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/blob-store.js
function hex2(b) {
  let s = "";
  for (let i = 0; i < b.length; i++)
    s += b[i].toString(16).padStart(2, "0");
  return s;
}
function retainedBlobStats(current) {
  let bytes = 0;
  for (const data of current.values())
    bytes += data.length;
  return { count: current.size, bytes };
}
function bucket(conversationId) {
  let m = byConversation.get(conversationId);
  if (!m) {
    m = /* @__PURE__ */ new Map();
    byConversation.set(conversationId, m);
  }
  return m;
}
function setConversationBlob(conversationId, blobId, blobData) {
  const key = hex2(blobId);
  bucket(conversationId).set(key, Uint8Array.from(blobData));
  return key;
}
function getConversationBlob(conversationId, blobId) {
  return bucket(conversationId).get(hex2(blobId));
}
function conversationBlobCount(conversationId) {
  return byConversation.get(conversationId)?.size ?? 0;
}
function inspectConversationBlobGraph(conversationId, checkpoint) {
  const current = byConversation.get(conversationId) ?? /* @__PURE__ */ new Map();
  const retainedStats = (fallbackReason) => ({
    ...retainedBlobStats(current),
    complete: fallbackReason === void 0,
    ...fallbackReason ? { fallbackReason } : {}
  });
  if (!checkpoint?.length)
    return retainedStats("checkpoint unavailable");
  try {
    const reachable = collectReachableConversationBlobIds(checkpoint, (id) => {
      const stored = current.get(hex2(id));
      if (stored)
        return stored;
      return isBlobIdHash(id) ? void 0 : id;
    });
    let count = 0;
    let bytes = 0;
    for (const id of reachable) {
      const data = current.get(id);
      if (!data)
        continue;
      count++;
      bytes += data.length;
    }
    return { count, bytes, complete: true };
  } catch (error) {
    return retainedStats(error instanceof Error ? error.message : String(error));
  }
}
function snapshotConversationBlobs(conversationId) {
  return [...byConversation.get(conversationId) ?? []].map(([id, data]) => ({
    id,
    data: Uint8Array.from(data)
  }));
}
function compactConversationBlobs(conversationId, checkpoint) {
  const current = byConversation.get(conversationId) ?? /* @__PURE__ */ new Map();
  const before = retainedBlobStats(current);
  const beforeCount = before.count;
  const beforeBytes = before.bytes;
  const fallback = (reason) => ({
    blobs: snapshotConversationBlobs(conversationId),
    beforeCount,
    beforeBytes,
    afterCount: beforeCount,
    afterBytes: beforeBytes,
    compacted: false,
    fallbackReason: reason
  });
  if (!checkpoint?.length)
    return fallback("checkpoint unavailable");
  try {
    const reachable = collectReachableConversationBlobIds(checkpoint, (id) => {
      const stored = current.get(hex2(id));
      if (stored)
        return stored;
      return isBlobIdHash(id) ? void 0 : id;
    });
    const retained = new Map([...current].filter(([id]) => reachable.has(id)));
    if (retained.size > 0)
      byConversation.set(conversationId, retained);
    else
      byConversation.delete(conversationId);
    const afterBytes = [...retained.values()].reduce((total, data) => total + data.length, 0);
    return {
      blobs: snapshotConversationBlobs(conversationId),
      beforeCount,
      beforeBytes,
      afterCount: retained.size,
      afterBytes,
      compacted: true
    };
  } catch (error) {
    return fallback(error instanceof Error ? error.message : String(error));
  }
}
function restoreConversationBlobs(conversationId, blobs) {
  if (!conversationId)
    return;
  const restored = /* @__PURE__ */ new Map();
  for (const blob of blobs) {
    if (!/^(?:[0-9a-f]{2})+$/i.test(blob.id))
      continue;
    restored.set(blob.id.toLowerCase(), Uint8Array.from(blob.data));
  }
  if (restored.size > 0)
    byConversation.set(conversationId, restored);
  else
    byConversation.delete(conversationId);
}
function clearConversationBlobs(conversationId) {
  byConversation.delete(conversationId);
}
function isBlobIdHash(blobId) {
  if (blobId.length !== 32)
    return false;
  for (let i = 0; i < blobId.length; i++) {
    const b = blobId[i];
    if (b < 9 || b > 13 && b < 32 || b > 126)
      return true;
  }
  return false;
}
var byConversation;
var init_blob_store = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/blob-store.js"() {
    init_blob_reachability();
    byConversation = /* @__PURE__ */ new Map();
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/kv.js
function hex3(b) {
  let s = "";
  for (let i = 0; i < b.length; i++)
    s += b[i].toString(16).padStart(2, "0");
  return s;
}
function handleKvServerMessage(ksm, session) {
  const id = ksm.id ?? 0;
  const setArgs = ksm.set_blob_args;
  const getArgs = ksm.get_blob_args;
  if (setArgs && setArgs.blob_id) {
    const data = setArgs.blob_data ?? new Uint8Array(0);
    const key = hex3(setArgs.blob_id);
    session.blobs.set(key, data);
    if (session.conversationId) {
      setConversationBlob(session.conversationId, setArgs.blob_id, data);
    }
    return {
      kind: "set",
      id,
      blobIdHex: key,
      found: true,
      replyBlobBytes: 0,
      reply: encodeMessage("AgentClientMessage", {
        kv_client_message: { id, set_blob_result: {} }
      })
    };
  }
  if (getArgs && getArgs.blob_id) {
    const key = hex3(getArgs.blob_id);
    const stored = session.blobs.get(key) ?? (session.conversationId ? getConversationBlob(session.conversationId, getArgs.blob_id) : void 0);
    let blobData;
    let echoed = false;
    let found = false;
    if (stored) {
      blobData = stored;
      found = true;
    } else if (!isBlobIdHash(getArgs.blob_id)) {
      blobData = getArgs.blob_id;
      echoed = true;
    } else {
      blobData = new Uint8Array(0);
    }
    return {
      kind: "get",
      id,
      blobIdHex: key,
      found,
      echoed,
      replyBlobBytes: blobData.length,
      reply: encodeMessage("AgentClientMessage", {
        kv_client_message: { id, get_blob_result: { blob_data: blobData } }
      })
    };
  }
  return null;
}
var init_kv = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/kv.js"() {
    init_messages();
    init_blob_store();
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/generate-image.js
import path7 from "node:path";
function imageMimeForPath(filePath) {
  const dot = path7.basename(filePath).lastIndexOf(".");
  if (dot <= 0)
    return "image/png";
  return IMAGE_MIME_BY_EXTENSION[path7.extname(filePath).toLowerCase()] ?? "image/png";
}
function asRecord4(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function str5(value) {
  return typeof value === "string" ? value : "";
}
function decodeGenerateImageQuery(queryBytes) {
  let decoded;
  try {
    decoded = decodeMessageSparse("GenerateImageRequestQuery", queryBytes);
  } catch {
    return void 0;
  }
  const args = asRecord4(decoded.args);
  if (!args)
    return void 0;
  const description = str5(args.description);
  if (!description)
    return void 0;
  return {
    description,
    filePath: str5(args.file_path),
    referenceImagePaths: Array.isArray(args.reference_image_paths) ? args.reference_image_paths.filter((item) => typeof item === "string") : [],
    toolCallId: str5(decoded.tool_call_id)
  };
}
function isInside(root, target) {
  const relative = path7.relative(path7.resolve(root), path7.resolve(target));
  return relative !== "" && !relative.startsWith(`..${path7.sep}`) && !path7.isAbsolute(relative);
}
function remapCursorImageWritePath(target, roots) {
  const projectDir = path7.resolve(roots.projectDir);
  const assets = path7.join(projectDir, CURSOR_IMAGE_ASSETS_DIR);
  const fallback = path7.join(assets, path7.basename(target) || "generated-image.png");
  if (!target)
    return fallback;
  const absolute = path7.isAbsolute(target) ? target : path7.resolve(projectDir, target);
  if (isInside(projectDir, absolute))
    return path7.resolve(absolute);
  if (roots.workspaceRoot && isInside(roots.workspaceRoot, absolute))
    return path7.resolve(absolute);
  return fallback;
}
var CURSOR_IMAGE_SAVE_TOOL, CURSOR_IMAGE_ASSETS_DIR, IMAGE_MIME_BY_EXTENSION;
var init_generate_image = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/generate-image.js"() {
    init_messages();
    CURSOR_IMAGE_SAVE_TOOL = "cursor_image_save";
    CURSOR_IMAGE_ASSETS_DIR = "assets";
    IMAGE_MIME_BY_EXTENSION = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp"
    };
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/create-plan.js
import { mkdirSync as mkdirSync2, writeFileSync as writeFileSync2 } from "node:fs";
import path8 from "node:path";
import { pathToFileURL } from "node:url";
function createPlanApprovalQuestion(planLabel) {
  const where = planLabel.trim();
  return where ? `Plan at ${where} is complete. Would you like to switch to the build agent and start implementing?` : "The plan is complete. Would you like to switch to the build agent and start implementing?";
}
function resolveCreatePlanBridge(options) {
  if (!options.allowTools)
    return { kind: "ack" };
  if (options.canStage)
    return { kind: "stage" };
  const names = options.advertised instanceof Set ? options.advertised : new Set(options.advertised);
  if (options.planModeActive && names.has("question"))
    return { kind: "approve" };
  return { kind: "ack" };
}
function createPlanApprovalItem(question) {
  return {
    id: "create_plan_approval",
    prompt: question,
    options: [
      { id: "yes", label: CREATE_PLAN_APPROVAL_YES },
      { id: "no", label: CREATE_PLAN_APPROVAL_NO }
    ],
    allowMultiple: false
  };
}
function createPlanApprovalQuestionInput(planLabel) {
  return {
    questions: [
      {
        question: createPlanApprovalQuestion(planLabel),
        header: CREATE_PLAN_APPROVAL_HEADER,
        options: [
          {
            label: CREATE_PLAN_APPROVAL_YES,
            description: "Switch to build agent and start implementing the plan"
          },
          {
            label: CREATE_PLAN_APPROVAL_NO,
            description: "Stay with plan agent to continue refining the plan"
          }
        ]
      }
    ]
  };
}
function createPlanApproved(output, isError, question) {
  if (isError)
    return false;
  const [segment] = parseAnswerSegments([createPlanApprovalItem(question)], output);
  return (segment ?? "").trim().toLowerCase() === CREATE_PLAN_APPROVAL_YES.toLowerCase();
}
function asRecord5(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function str6(value) {
  return typeof value === "string" ? value : "";
}
function mapTodoStatus2(status) {
  if (typeof status === "string")
    return status.toLowerCase();
  if (typeof status === "number") {
    switch (status) {
      case 2:
        return "in_progress";
      case 3:
        return "completed";
      case 4:
        return "cancelled";
      default:
        return "pending";
    }
  }
  return "pending";
}
function todoCheckbox(status) {
  const s = status.toLowerCase();
  if (s === "completed" || s === "complete" || s === "done")
    return "[x]";
  if (s === "cancelled" || s === "canceled")
    return "[~]";
  return "[ ]";
}
function decodeCreatePlanQuery(queryBytes) {
  let decoded;
  try {
    decoded = decodeMessageSparse("CreatePlanRequestQuery", queryBytes);
  } catch {
    return void 0;
  }
  const args = asRecord5(decoded.args);
  if (!args)
    return void 0;
  const plan = str6(args.plan);
  const overview = str6(args.overview);
  const name14 = str6(args.name);
  const todos = Array.isArray(args.todos) ? args.todos.flatMap((raw) => {
    const item = asRecord5(raw);
    if (!item)
      return [];
    const content = str6(item.content);
    if (!content)
      return [];
    return [
      {
        id: str6(item.id),
        content,
        status: mapTodoStatus2(item.status)
      }
    ];
  }) : [];
  if (!plan && !overview && !name14 && todos.length === 0)
    return void 0;
  return {
    args: {
      plan,
      overview,
      name: name14,
      isProject: args.is_project === true,
      todos
    },
    toolCallId: str6(decoded.tool_call_id)
  };
}
function randomPlanSlug(seed = Date.now()) {
  const adj = PLAN_ADJECTIVES[seed % PLAN_ADJECTIVES.length];
  const noun = PLAN_NOUNS[Math.floor(seed / PLAN_ADJECTIVES.length) % PLAN_NOUNS.length];
  return `${adj}-${noun}`;
}
function slugifyPlanName(name14) {
  const slug = name14.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
  return slug || randomPlanSlug();
}
function createPlanStageInput(args) {
  const slug = slugifyPlanName(args.name);
  return {
    plan_uri: `local://${slug}-plan.md`,
    content: renderOpencodePlanMarkdown(args),
    title: slug
  };
}
function resolveHostPlanPath(workspaceRoot, name14, created = Date.now()) {
  const slug = name14?.trim() ? slugifyPlanName(name14) : randomPlanSlug(created);
  return path8.join(hostPlansDir(workspaceRoot), `${created}-${slug}.md`);
}
function renderOpencodePlanMarkdown(args) {
  const parts = [];
  const name14 = args.name.trim();
  const overview = args.overview.trim();
  const plan = args.plan.trim();
  const planLeadHeading = /^#\s+(.+?)\s*$/.exec(plan.split("\n", 1)[0] ?? "")?.[1];
  const planBody = name14 && planLeadHeading !== void 0 && planLeadHeading.trim().toLowerCase() === name14.toLowerCase() ? plan.slice(plan.indexOf("\n") + 1).trimStart() : plan;
  if (name14) {
    parts.push(`# ${name14}`);
    parts.push("");
  }
  if (overview) {
    if (!planBody || !planBody.startsWith(overview)) {
      parts.push(overview);
      parts.push("");
    }
  }
  if (planBody) {
    parts.push(planBody);
    if (!planBody.endsWith("\n"))
      parts.push("");
  }
  if (args.todos.length > 0) {
    if (parts.length > 0 && parts[parts.length - 1] !== "")
      parts.push("");
    parts.push("## Todos");
    parts.push("");
    for (const todo of args.todos) {
      parts.push(`- ${todoCheckbox(todo.status)} ${todo.content}`);
    }
    parts.push("");
  }
  const body = parts.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
  return body ? `${body}
` : "";
}
function writeOpencodePlanFile(args, workspaceRoot, created = Date.now()) {
  const markdown = renderOpencodePlanMarkdown(args);
  if (!markdown.trim()) {
    return { ok: false, error: "CreatePlan produced no plan content to write" };
  }
  const planPath = resolveHostPlanPath(workspaceRoot, args.name, created);
  try {
    mkdirSync2(path8.dirname(planPath), { recursive: true });
    writeFileSync2(planPath, markdown, "utf-8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Failed to write plan file: ${message}` };
  }
  return {
    ok: true,
    planPath,
    planUri: pathToFileURL(planPath).href,
    markdown
  };
}
function renderPlanReviewMessage(markdown, planPath) {
  const body = markdown.trim();
  const saved = `_Plan saved to ${planPath}_`;
  return body ? `${body}

${saved}
` : `${saved}
`;
}
var PLAN_ADJECTIVES, PLAN_NOUNS, CURSOR_PLAN_STAGE_TOOL, CREATE_PLAN_RESULT_FIELD, CREATE_PLAN_APPROVAL_HEADER, CREATE_PLAN_APPROVAL_YES, CREATE_PLAN_APPROVAL_NO, CREATE_PLAN_NOT_APPROVED_REASON;
var init_create_plan = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/create-plan.js"() {
    init_paths();
    init_ask_question();
    init_messages();
    PLAN_ADJECTIVES = [
      "brave",
      "calm",
      "clever",
      "cosmic",
      "crisp",
      "curious",
      "eager",
      "gentle",
      "glowing",
      "happy",
      "hidden",
      "jolly",
      "kind",
      "lucky",
      "mighty",
      "misty",
      "neon",
      "nimble",
      "playful",
      "proud",
      "quick",
      "quiet",
      "shiny",
      "silent",
      "stellar",
      "sunny",
      "swift",
      "tidy",
      "witty"
    ];
    PLAN_NOUNS = [
      "cabin",
      "cactus",
      "canyon",
      "circuit",
      "comet",
      "eagle",
      "engine",
      "falcon",
      "forest",
      "garden",
      "harbor",
      "island",
      "knight",
      "lagoon",
      "meadow",
      "moon",
      "mountain",
      "nebula",
      "orchid",
      "otter",
      "panda",
      "pixel",
      "planet",
      "river",
      "rocket",
      "sailor",
      "squid",
      "star",
      "tiger",
      "wizard",
      "wolf"
    ];
    CURSOR_PLAN_STAGE_TOOL = "cursor_plan_stage";
    CREATE_PLAN_RESULT_FIELD = "create_plan_request_response";
    CREATE_PLAN_APPROVAL_HEADER = "Build Agent";
    CREATE_PLAN_APPROVAL_YES = "Yes";
    CREATE_PLAN_APPROVAL_NO = "No";
    CREATE_PLAN_NOT_APPROVED_REASON = "The user did not approve executing this plan. Keep planning: refine the plan and propose it again when it is ready.";
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/interactions.js
function inspectInteractionQueryWire(agentServerPayload) {
  const queryBytes = readAllFields(agentServerPayload).find((field) => field.fn === 7 && field.wt === 2)?.bytes;
  if (!queryBytes)
    return {};
  let id = 0;
  let variantField;
  let variantBytes;
  for (const field of readAllFields(queryBytes)) {
    if (field.fn === 1 && field.wt === 0)
      id = field.varint;
    else if (field.wt === 2 && variantField === void 0) {
      variantField = field.fn;
      variantBytes = field.bytes;
    }
  }
  return {
    id,
    variantField,
    variantName: variantField === void 0 ? void 0 : variantNames[variantField],
    variantBytes
  };
}
function handleInteractionQuery(query, agentServerPayload, options = {}) {
  const info = inspectInteractionQueryWire(agentServerPayload);
  if (info.id === void 0 || info.variantField === void 0 || !info.variantName) {
    throw new UnsupportedInteractionQueryError(info);
  }
  if (typeof query.id === "number" && query.id !== info.id) {
    throw new Error(`Cursor interaction query id mismatch: decoded=${query.id} wire=${info.id}`);
  }
  if (info.variantField === 3) {
    return handleAskQuestionQuery(info.id, info.variantBytes, options);
  }
  if (info.variantField === 4) {
    return handleSwitchModeQuery(info.id, info.variantBytes, options);
  }
  if (info.variantField === 7) {
    return handleCreatePlanQuery(info.id, info.variantBytes, options);
  }
  if (info.variantField === 12) {
    return handleGenerateImageQuery(info.id, info.variantBytes, options);
  }
  let response;
  let outcome;
  switch (info.variantField) {
    case 2:
      response = { web_search_request_response: { rejected: { reason: HEADLESS_REASON } } };
      outcome = "rejected";
      break;
    case 8:
      response = { setup_vm_environment_result: { success: {} } };
      outcome = "acknowledged";
      break;
    case 9:
      response = { web_fetch_request_response: { rejected: { reason: HEADLESS_REASON } } };
      outcome = "rejected";
      break;
    case 10:
      response = { pr_management_result: { rejected: { reason: HEADLESS_REASON } } };
      outcome = "rejected";
      break;
    case 11:
      response = { mcp_auth_request_response: { rejected: { reason: HEADLESS_REASON } } };
      outcome = "rejected";
      break;
    case 13:
      response = {
        replace_env_result: {
          failure: {
            error_message: "Environment replacement is not supported by the OpenCode provider.",
            setup_logs: ""
          }
        }
      };
      outcome = "failed";
      break;
    case 14:
      response = { connect_scm_request_response: { rejected: { reason: HEADLESS_REASON } } };
      outcome = "rejected";
      break;
    default:
      throw new UnsupportedInteractionQueryError(info);
  }
  return {
    id: info.id,
    variantField: info.variantField,
    variantName: info.variantName,
    outcome,
    reply: encodeMessage("AgentClientMessage", {
      interaction_response: { id: info.id, ...response }
    })
  };
}
function handleAskQuestionQuery(id, variantBytes, options) {
  const base = { id, variantField: 3, variantName: "ask_question_interaction_query" };
  const reject = (reason) => ({
    ...base,
    outcome: "rejected",
    reply: buildAskQuestionInteractionReply(id, { rejected: { reason } })
  });
  if (!variantBytes)
    return reject(MISSING_QUERY_REASON);
  const decoded = decodeAskQuestionQuery(variantBytes);
  if (!decoded)
    return reject(MISSING_ARGS_REASON);
  if (!options.canBridgeAskQuestion)
    return reject(ASK_QUESTION_UNAVAILABLE_REASON);
  return {
    ...base,
    outcome: "bridged",
    askQuestion: decoded,
    // Async queries are unblocked now and answered later through a
    // ConversationAction; synchronous ones keep Cursor waiting, which is what
    // its CLI does while the user is still choosing.
    reply: decoded.args.runAsync ? buildAskQuestionInteractionReply(id, { async: {} }) : void 0
  };
}
function buildAskQuestionInteractionReply(id, result) {
  return encodeMessage("AgentClientMessage", {
    interaction_response: {
      id,
      ask_question_interaction_response: { result }
    }
  });
}
function handleSwitchModeQuery(id, variantBytes, options) {
  const base = { id, variantField: 4, variantName: "switch_mode_request_query" };
  const reject = (reason) => ({
    ...base,
    outcome: "rejected",
    reply: buildSwitchModeInteractionReply(id, { rejected: { reason } })
  });
  if (!variantBytes)
    return reject(MISSING_QUERY_REASON2);
  const decoded = decodeSwitchModeQuery(variantBytes);
  if (!decoded)
    return reject(MISSING_ARGS_REASON2);
  const bridge = resolveSwitchModeBridge(decoded.args.targetModeId, {
    allowTools: options.allowTools === true,
    advertised: options.advertisedTools ?? [],
    ...options.activeCursorModeId ? { activeModeId: options.activeCursorModeId } : {}
  });
  if (bridge.kind === "reject")
    return reject(bridge.reason);
  if (bridge.kind === "ack") {
    return {
      ...base,
      outcome: "acknowledged",
      reply: buildSwitchModeInteractionReply(id, switchModeApprovedResult())
    };
  }
  if (bridge.kind === "approve") {
    return {
      ...base,
      outcome: "approved",
      switchMode: { ...decoded, bridge },
      reply: buildSwitchModeInteractionReply(id, switchModeApprovedResult())
    };
  }
  return {
    ...base,
    outcome: "bridged",
    switchMode: {
      ...decoded,
      bridge,
      toolName: bridge.kind === "native" ? bridge.toolName : "question"
    },
    // Keep Cursor waiting until the host tool returns, matching CLI blocking on
    // the mode-switch approval prompt.
    reply: void 0
  };
}
function buildSwitchModeInteractionReply(id, result) {
  return encodeMessage("AgentClientMessage", {
    interaction_response: {
      id,
      switch_mode_request_response: result
    }
  });
}
function buildCreatePlanInteractionReply(id, result) {
  return encodeMessage("AgentClientMessage", {
    interaction_response: {
      id,
      create_plan_request_response: { result }
    }
  });
}
function buildAsyncAskQuestionCompletion(originalToolCallId, originalArgs, result) {
  return encodeMessage("AgentClientMessage", {
    conversation_action: {
      async_ask_question_completion_action: {
        original_tool_call_id: originalToolCallId,
        original_args: originalArgs,
        result
      }
    }
  });
}
function handleCreatePlanQuery(id, variantBytes, options) {
  const base = { id, variantField: 7, variantName: "create_plan_request_query" };
  const reply = (result) => ({
    ...base,
    outcome: result.error ? "failed" : "acknowledged",
    reply: encodeMessage("AgentClientMessage", {
      interaction_response: {
        id,
        create_plan_request_response: { result }
      }
    })
  });
  if (!variantBytes)
    return reply({ success: {}, plan_uri: "" });
  const decoded = decodeCreatePlanQuery(variantBytes);
  if (!decoded)
    return reply({ success: {}, plan_uri: "" });
  const bridge = resolveCreatePlanBridge({
    allowTools: options.allowTools === true,
    canStage: options.canBridgeCreatePlan === true,
    planModeActive: options.planModeActive === true,
    advertised: options.advertisedTools ?? []
  });
  if (bridge.kind === "stage") {
    return {
      ...base,
      outcome: "bridged",
      createPlan: { ...decoded, bridge, toolName: CURSOR_PLAN_STAGE_TOOL },
      reply: void 0
    };
  }
  if (options.allowTools !== true)
    return reply({ success: {}, plan_uri: "" });
  const workspaceRoot = options.workspaceRoot?.trim();
  if (!workspaceRoot) {
    return reply({
      error: { error: "CreatePlan requires a workspace root to write the plan file" },
      plan_uri: ""
    });
  }
  const written = writeOpencodePlanFile(decoded.args, workspaceRoot);
  if (!written.ok) {
    return reply({ error: { error: written.error }, plan_uri: "" });
  }
  if (bridge.kind === "approve") {
    return {
      ...base,
      outcome: "bridged",
      createPlan: {
        ...decoded,
        bridge,
        toolName: "question",
        planUri: written.planUri,
        planPath: written.planPath,
        questionInput: createPlanApprovalQuestionInput(written.planPath),
        planReview: renderPlanReviewMessage(written.markdown, written.planPath)
      },
      reply: void 0
    };
  }
  return reply({ success: {}, plan_uri: written.planUri });
}
function handleGenerateImageQuery(id, variantBytes, options) {
  const base = { id, variantField: 12, variantName: "generate_image_request_query" };
  const reject = (reason) => ({
    ...base,
    outcome: "rejected",
    reply: encodeMessage("AgentClientMessage", {
      interaction_response: { id, generate_image_request_response: { rejected: { reason } } }
    })
  });
  if (!variantBytes)
    return reject("Missing generate image query");
  const decoded = decodeGenerateImageQuery(variantBytes);
  if (!decoded)
    return reject("Missing generate image arguments");
  if (!options.canSaveGeneratedImage) {
    return reject("This OpenCode agent cannot save a generated image, so generating one would produce nothing. Describe the image in your reply instead.");
  }
  return {
    ...base,
    outcome: "acknowledged",
    generateImage: decoded,
    reply: encodeMessage("AgentClientMessage", {
      interaction_response: {
        id,
        // Cursor's CLI returns the description the user may have edited at the
        // prompt. There is no text field on OpenCode's permission, so the
        // model's own description is passed through unchanged.
        generate_image_request_response: { approved: { description: decoded.description } }
      }
    })
  };
}
var HEADLESS_REASON, ASK_QUESTION_UNAVAILABLE_REASON, variantNames, UnsupportedInteractionQueryError;
var init_interactions = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/interactions.js"() {
    init_messages();
    init_struct();
    init_ask_question();
    init_generate_image();
    init_create_plan();
    init_switch_mode();
    HEADLESS_REASON = "This Cursor interaction requires UI approval and is not available through the OpenCode provider.";
    ASK_QUESTION_UNAVAILABLE_REASON = "The OpenCode `question` tool is not available to the current agent, so questions cannot be shown to the user this turn. State the question in your reply instead.";
    variantNames = {
      2: "web_search_request_query",
      3: "ask_question_interaction_query",
      4: "switch_mode_request_query",
      7: "create_plan_request_query",
      8: "setup_vm_environment_args",
      9: "web_fetch_request_query",
      10: "pr_management_request_query",
      11: "mcp_auth_request_query",
      12: "generate_image_request_query",
      13: "replace_env_args",
      14: "connect_scm_request_query"
    };
    UnsupportedInteractionQueryError = class extends Error {
      constructor(info) {
        const variant = info.variantField === void 0 ? "missing variant" : `unsupported variant field #${info.variantField}`;
        const id = info.id === void 0 ? "missing id" : `id=${info.id}`;
        super(`Cursor interaction query cannot be handled (${id}, ${variant})`);
        this.name = "UnsupportedInteractionQueryError";
      }
    };
  }
});

// node_modules/cursor-opencode-provider/dist/plan-execution-kickoff.js
import path9 from "node:path";
import { fileURLToPath } from "node:url";
function createPlanExecutionKickoffText(planPath) {
  const where = planPath.trim() || "the plan";
  return `The plan at ${where} has been approved, you can now edit files. Execute the plan`;
}
function formatPlanKickoffPath(planPath, workspaceRoot) {
  const absolute = planPath.trim();
  if (!absolute)
    return absolute;
  const root = workspaceRoot?.trim();
  if (!root)
    return absolute;
  const relative = path9.relative(root, absolute);
  if (!relative || relative.startsWith("..") || path9.isAbsolute(relative)) {
    return absolute;
  }
  return relative;
}
function planPathFromUri(planUri) {
  const raw = planUri.trim();
  if (!raw)
    return "";
  if (raw.startsWith("file:")) {
    try {
      return fileURLToPath(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}
function setPlanExecutionKickoff(fn) {
  kickoff = fn;
}
function hasPlanExecutionKickoff() {
  return kickoff !== void 0;
}
function queuePlanExecutionKickoff(input2) {
  const sessionID = input2.sessionID.trim();
  const planPath = input2.planPath.trim();
  if (!sessionID || !planPath || !kickoff) {
    trace(`plan-execution-kickoff: not queued sessionID=${JSON.stringify(sessionID)} planPath=${JSON.stringify(planPath)} handler=${Boolean(kickoff)}`);
    return false;
  }
  pending.set(sessionID, {
    sessionID,
    planPath,
    ...input2.cursorSessionID ? { cursorSessionID: input2.cursorSessionID } : {},
    status: "pending",
    attempts: 0
  });
  warnings.delete(sessionID);
  trace(`plan-execution-kickoff: pending sessionID=${sessionID} cursorSessionID=${input2.cursorSessionID ?? ""} planPath=${planPath}`);
  return true;
}
async function flushPlanExecutionKickoff(sessionID, options = {}) {
  const key = sessionID?.trim();
  if (!key)
    return false;
  const state = pending.get(key);
  if (!state)
    return false;
  if (options.terminal !== true || options.pumpActive || (options.pendingExecs ?? 0) > 0) {
    trace(`plan-execution-kickoff: deferred sessionID=${key} terminal=${Boolean(options.terminal)} pumpActive=${Boolean(options.pumpActive)} pending=${options.pendingExecs ?? 0}`);
    return false;
  }
  if (state.cursorSessionID && options.cursorSessionID && state.cursorSessionID !== options.cursorSessionID) {
    trace(`plan-execution-kickoff: skipped stale Run sessionID=${key} owner=${state.cursorSessionID} terminal=${options.cursorSessionID}`);
    return false;
  }
  const run = kickoff;
  if (!run) {
    const message = "The plan was approved, but this host cannot start its execution turn.";
    state.status = "failed";
    state.lastError = message;
    warnings.set(key, message);
    return false;
  }
  state.attempts += 1;
  try {
    await run({
      sessionID: state.sessionID,
      planPath: state.planPath,
      ...state.cursorSessionID ? { cursorSessionID: state.cursorSessionID } : {}
    });
    pending.delete(key);
    warnings.delete(key);
    trace(`plan-execution-kickoff: queued sessionID=${key} planPath=${state.planPath}`);
    return true;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const message = `The approved plan could not start execution: ${detail}. The plan remains active and can be retried.`;
    state.status = "failed";
    state.lastError = detail;
    delete state.cursorSessionID;
    warnings.set(key, message);
    trace(`plan-execution-kickoff: FAILED sessionID=${key} attempts=${state.attempts} err=${detail}`);
    return false;
  }
}
function takePlanExecutionKickoffWarning(sessionID) {
  const key = sessionID?.trim();
  if (!key)
    return void 0;
  const message = warnings.get(key);
  if (message)
    warnings.delete(key);
  return message;
}
function planExecutionKickoffState(sessionID) {
  const key = sessionID?.trim();
  const state = key ? pending.get(key) : void 0;
  return state ? { ...state } : void 0;
}
var kickoff, pending, warnings;
var init_plan_execution_kickoff = __esm({
  "node_modules/cursor-opencode-provider/dist/plan-execution-kickoff.js"() {
    init_debug();
    pending = /* @__PURE__ */ new Map();
    warnings = /* @__PURE__ */ new Map();
  }
});

// node_modules/cursor-opencode-provider/dist/image-staging.js
import { randomUUID } from "node:crypto";
function prune(now) {
  for (const [id, image] of pending2) {
    if (now - image.createdAt > STAGED_IMAGE_TTL_MS)
      pending2.delete(id);
  }
  while (pending2.size >= MAX_PENDING) {
    const oldest = pending2.keys().next().value;
    if (oldest === void 0)
      break;
    pending2.delete(oldest);
  }
}
function stageCursorImage(input2, now = Date.now()) {
  if (input2.data.length > MAX_STAGED_IMAGE_BYTES) {
    throw new StagedImageTooLargeError(input2.data.length);
  }
  prune(now);
  const id = `cursor-image-${randomUUID()}`;
  pending2.set(id, {
    id,
    path: input2.path,
    projectDir: input2.projectDir,
    mime: input2.mime,
    data: input2.data,
    sessionId: input2.sessionId,
    createdAt: now
  });
  return id;
}
function takePendingCursorImage(id, now = Date.now()) {
  const image = pending2.get(id);
  if (!image)
    return void 0;
  pending2.delete(id);
  if (now - image.createdAt > STAGED_IMAGE_TTL_MS)
    return void 0;
  return image;
}
var MAX_STAGED_IMAGE_BYTES, STAGED_IMAGE_TTL_MS, MAX_PENDING, pending2, StagedImageTooLargeError;
var init_image_staging = __esm({
  "node_modules/cursor-opencode-provider/dist/image-staging.js"() {
    MAX_STAGED_IMAGE_BYTES = 50 * 1024 * 1024;
    STAGED_IMAGE_TTL_MS = 10 * 6e4;
    MAX_PENDING = 8;
    pending2 = /* @__PURE__ */ new Map();
    StagedImageTooLargeError = class extends Error {
      constructor(bytes) {
        super(`Generated image is ${bytes} bytes, above the ${MAX_STAGED_IMAGE_BYTES} byte limit`);
        this.name = "StagedImageTooLargeError";
      }
    };
  }
});

// node_modules/cursor-opencode-provider/dist/image-save.js
import fs6 from "node:fs";
import path10 from "node:path";
function resolveContainedImagePath(target, allowedRoots) {
  const roots = allowedRoots.filter(Boolean).map((root) => path10.resolve(root));
  if (roots.length === 0)
    return { error: "no writable root is configured" };
  const absolute = path10.isAbsolute(target) ? path10.resolve(target) : path10.resolve(roots[0], target);
  let probe = absolute;
  let realProbe;
  while (true) {
    try {
      realProbe = fs6.realpathSync(probe);
      break;
    } catch {
      const parent = path10.dirname(probe);
      if (parent === probe)
        break;
      probe = parent;
    }
  }
  if (realProbe === void 0)
    return { error: "target path could not be resolved" };
  const suffix = path10.relative(probe, absolute);
  const realTarget = suffix ? path10.join(realProbe, suffix) : realProbe;
  for (const root of roots) {
    let realRoot2;
    try {
      realRoot2 = fs6.realpathSync(root);
    } catch {
      realRoot2 = root;
    }
    const relative = path10.relative(realRoot2, realTarget);
    if (relative && !relative.startsWith(`..${path10.sep}`) && !path10.isAbsolute(relative)) {
      return { path: realTarget, relative, root };
    }
  }
  return { error: "target path resolves outside the workspace and project folder" };
}
function realRoot(root) {
  const resolved = path10.resolve(root);
  try {
    return fs6.realpathSync(resolved);
  } catch {
    return resolved;
  }
}
function isInsideProject(target, worktree, directory) {
  for (const root of [directory, worktree]) {
    if (!root || root === "/")
      continue;
    const relative = path10.relative(realRoot(root), target);
    if (relative === "")
      return true;
    if (relative && !relative.startsWith(`..${path10.sep}`) && !path10.isAbsolute(relative))
      return true;
  }
  return false;
}
async function executeCursorImageSave(args, ctx) {
  const imageId = typeof args.image_id === "string" ? args.image_id : "";
  if (!imageId)
    return "No image id was provided, so there is nothing to save.";
  const image = takePendingCursorImage(imageId);
  if (!image) {
    return "No pending Cursor image matches that id. It may have already been saved or expired.";
  }
  const workspace = ctx.worktree || ctx.directory;
  const contained = resolveContainedImagePath(image.path, [image.projectDir, workspace].filter((root) => !!root));
  if ("error" in contained) {
    trace(`image save: refused path=${JSON.stringify(image.path)} reason=${contained.error}`);
    return `Refusing to save the generated image: ${contained.error}.`;
  }
  const editPattern = path10.relative(realRoot(workspace), contained.path);
  try {
    if (!isInsideProject(contained.path, workspace, ctx.directory)) {
      const parentDir = path10.dirname(contained.path);
      const glob = path10.join(parentDir, "*").replaceAll("\\", "/");
      await ctx.ask({
        permission: "external_directory",
        patterns: [glob],
        always: [glob],
        metadata: { filepath: contained.path, parentDir }
      });
    }
    await ctx.ask({
      permission: "edit",
      patterns: [editPattern],
      always: ["*"],
      metadata: {
        filepath: contained.path,
        mime: image.mime,
        bytes: image.data.length,
        source: "cursor-generate-image"
      }
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    trace(`image save: permission refused path=${JSON.stringify(contained.path)} reason=${reason}`);
    throw new Error(`${IMAGE_PERMISSION_DENIED_PREFIX} ${reason}`);
  }
  const directory = path10.dirname(contained.path);
  try {
    fs6.mkdirSync(directory, { recursive: true });
    fs6.writeFileSync(contained.path, image.data);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    trace(`image save: write failed path=${JSON.stringify(contained.path)} reason=${reason}`);
    throw new Error(`Could not save the generated image to ${contained.path}: ${reason}. Check that ${directory} is a writable directory.`);
  }
  trace(`image save: wrote path=${JSON.stringify(contained.path)} bytes=${image.data.length} mime=${image.mime}`);
  return {
    title: editPattern,
    output: `Saved the generated image to ${contained.path} (${image.data.length} bytes).`
  };
}
var IMAGE_PERMISSION_DENIED_PREFIX;
var init_image_save = __esm({
  "node_modules/cursor-opencode-provider/dist/image-save.js"() {
    init_debug();
    init_image_staging();
    IMAGE_PERMISSION_DENIED_PREFIX = "CursorImagePermissionDenied:";
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/checkpoint.js
function setCheckpoint(conversationId, bytes) {
  if (!conversationId || bytes.length === 0)
    return;
  byConversationId.set(conversationId, Uint8Array.from(bytes));
}
function getCheckpoint(conversationId) {
  return byConversationId.get(conversationId);
}
function clearCheckpoint(conversationId) {
  byConversationId.delete(conversationId);
}
var byConversationId;
var init_checkpoint = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/checkpoint.js"() {
    byConversationId = /* @__PURE__ */ new Map();
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/token-details.js
function requireWireType(actual, expected, field) {
  if (actual !== expected)
    throw new Error(`invalid ${field} wire type`);
}
function decodeCategory(data) {
  const reader = import_protobufjs3.default.Reader.create(data);
  let id = "";
  let label = "";
  let estimatedTokens = 0;
  let characterCount;
  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    const wireType = tag & 7;
    switch (tag >>> 3) {
      case 1:
        requireWireType(wireType, 2, "category id");
        id = reader.string();
        break;
      case 2:
        requireWireType(wireType, 2, "category label");
        label = reader.string();
        break;
      case 3:
        requireWireType(wireType, 0, "category token count");
        estimatedTokens = reader.uint32();
        break;
      case 4:
        requireWireType(wireType, 0, "category character count");
        characterCount = reader.uint32();
        break;
      default:
        reader.skipType(wireType);
    }
  }
  return {
    id,
    label,
    estimatedTokens,
    ...characterCount === void 0 ? {} : { characterCount }
  };
}
function decodeBreakdown(data) {
  const reader = import_protobufjs3.default.Reader.create(data);
  let totalUsedTokens = 0;
  let maxTokens = 0;
  const categories = [];
  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    const wireType = tag & 7;
    switch (tag >>> 3) {
      case 1:
        requireWireType(wireType, 0, "breakdown used tokens");
        totalUsedTokens = reader.uint32();
        break;
      case 2:
        requireWireType(wireType, 0, "breakdown max tokens");
        maxTokens = reader.uint32();
        break;
      case 3:
        requireWireType(wireType, 2, "breakdown category");
        if (categories.length < MAX_BREAKDOWN_CATEGORIES) {
          categories.push(decodeCategory(reader.bytes()));
        } else {
          reader.bytes();
        }
        break;
      default:
        reader.skipType(wireType);
    }
  }
  return { totalUsedTokens, maxTokens, categories };
}
function decodeTokenDetails(data) {
  const reader = import_protobufjs3.default.Reader.create(data);
  let usedTokens = 0;
  let maxTokens = 0;
  let sawUsedTokens = false;
  let sawMaxTokens = false;
  let breakdown;
  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    const wireType = tag & 7;
    switch (tag >>> 3) {
      case 1:
        requireWireType(wireType, 0, "used tokens");
        usedTokens = reader.uint32();
        sawUsedTokens = true;
        break;
      case 2:
        requireWireType(wireType, 0, "max tokens");
        maxTokens = reader.uint32();
        sawMaxTokens = true;
        break;
      case 3:
        requireWireType(wireType, 2, "token breakdown");
        breakdown = decodeBreakdown(reader.bytes());
        break;
      default:
        reader.skipType(wireType);
    }
  }
  if (!sawUsedTokens && !sawMaxTokens && !breakdown)
    return void 0;
  return {
    usedTokens,
    maxTokens,
    ...breakdown ? { breakdown } : {}
  };
}
function decodeConversationTokenDetails(checkpoint) {
  if (!checkpoint?.length)
    return void 0;
  try {
    const reader = import_protobufjs3.default.Reader.create(checkpoint);
    let details;
    while (reader.pos < reader.len) {
      const tag = reader.uint32();
      const wireType = tag & 7;
      if (tag >>> 3 === 5) {
        requireWireType(wireType, 2, "conversation token details");
        details = decodeTokenDetails(reader.bytes());
      } else {
        reader.skipType(wireType);
      }
    }
    return details;
  } catch {
    return void 0;
  }
}
function cursorContextUsageMetadata(details, source = "checkpoint-current-run") {
  const usedPercent = details.maxTokens > 0 ? Math.max(0, Math.min(100, Math.round(details.usedTokens / details.maxTokens * 1e3) / 10)) : void 0;
  return {
    contextUsageVersion: 2,
    source,
    stale: source === "checkpoint-previous-turn",
    usedTokens: details.usedTokens,
    maxTokens: details.maxTokens,
    remainingTokens: Math.max(0, details.maxTokens - details.usedTokens),
    ...usedPercent === void 0 ? {} : { usedPercent },
    ...details.breakdown ? { breakdown: details.breakdown } : {}
  };
}
var import_protobufjs3, MAX_BREAKDOWN_CATEGORIES;
var init_token_details = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/token-details.js"() {
    import_protobufjs3 = __toESM(require_protobufjs(), 1);
    MAX_BREAKDOWN_CATEGORIES = 128;
  }
});

// node_modules/cursor-opencode-provider/dist/context/rules.js
import { readFile, readdir, stat } from "node:fs/promises";
import { homedir as homedir3 } from "node:os";
import path11 from "node:path";
async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}
async function readJsonConfig(dir) {
  for (const name14 of opencodeConfigFileNames()) {
    const file = path11.join(dir, name14);
    if (!await exists(file))
      continue;
    try {
      const raw = await readFile(file, "utf-8");
      const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      return JSON.parse(stripped);
    } catch {
      return {};
    }
  }
  return {};
}
async function findGitWorktree(start) {
  let dir = path11.resolve(start);
  for (; ; ) {
    if (await exists(path11.join(dir, ".git")))
      return dir;
    const parent = path11.dirname(dir);
    if (parent === dir)
      return path11.resolve(start);
    dir = parent;
  }
}
async function findUp(name14, start, stop) {
  let dir = path11.resolve(start);
  const root = path11.resolve(stop);
  for (; ; ) {
    const candidate = path11.join(dir, name14);
    if (await exists(candidate))
      return candidate;
    if (dir === root)
      return void 0;
    const parent = path11.dirname(dir);
    if (parent === dir)
      return void 0;
    dir = parent;
  }
}
async function readRule(file) {
  if (!await exists(file))
    return void 0;
  try {
    const content = await readFile(file, "utf-8");
    if (!content.trim())
      return void 0;
    return { fullPath: path11.resolve(file), content };
  } catch {
    return void 0;
  }
}
function globToRegExp(glob) {
  const norm = glob.replace(/\\/g, "/");
  let re = "^";
  for (let i = 0; i < norm.length; i++) {
    const c = norm[i];
    if (c === "*") {
      if (norm[i + 1] === "*") {
        re += ".*";
        i++;
        if (norm[i + 1] === "/")
          i++;
      } else {
        re += "[^/]*";
      }
    } else if (".$^+?()[]{}|".includes(c) || c === "\\") {
      re += "\\" + c;
    } else {
      re += c;
    }
  }
  return new RegExp(re + "$");
}
async function expandGlob(pattern, workspaceRoot) {
  const abs = path11.isAbsolute(pattern) ? pattern : path11.join(workspaceRoot, pattern);
  if (!abs.includes("*"))
    return await exists(abs) ? [abs] : [];
  const out = [];
  const base = abs.split("*")[0] || workspaceRoot;
  const startDir = path11.dirname(base.endsWith("/") ? base : base);
  const regex = globToRegExp(abs);
  async function walk2(dir, depth) {
    if (depth > 8)
      return;
    let entries;
    try {
      entries = await readdir(dir);
    } catch {
      return;
    }
    entries.sort();
    for (const name14 of entries) {
      if (name14 === "node_modules" || name14 === ".git")
        continue;
      const full = path11.join(dir, name14);
      let st;
      try {
        st = await stat(full);
      } catch {
        continue;
      }
      if (st.isDirectory())
        await walk2(full, depth + 1);
      else if (regex.test(full.replace(/\\/g, "/")))
        out.push(full);
    }
  }
  await walk2(startDir, 0);
  return out;
}
function isProjectConfigDisabled() {
  const value = process.env.OPENCODE_DISABLE_PROJECT_CONFIG?.toLowerCase();
  return value === "true" || value === "1";
}
async function fetchRemoteInstruction(url, timeoutMs2 = 5e3) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), Math.max(1, timeoutMs2));
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok)
      return void 0;
    return await res.text();
  } catch {
    return void 0;
  } finally {
    clearTimeout(timer);
  }
}
function mergeConfig(base, overlay) {
  return {
    ...base,
    ...overlay,
    instructions: [...base.instructions ?? [], ...overlay.instructions ?? []],
    plugin: [.../* @__PURE__ */ new Set([...base.plugin ?? [], ...overlay.plugin ?? []])],
    plugins: [.../* @__PURE__ */ new Set([...base.plugins ?? [], ...overlay.plugins ?? []])],
    mcp: { ...base.mcp ?? {}, ...overlay.mcp ?? {} },
    permission: overlay.permission ?? base.permission
  };
}
async function loadMergedConfig(workspaceRoot) {
  const globalConfig = await readJsonConfig(opencodeGlobalConfigDirs()[0] ?? "");
  if (isProjectConfigDisabled())
    return mergeConfig({}, globalConfig);
  let projectConfig = await readJsonConfig(workspaceRoot);
  for (const configDir of opencodeProjectConfigDirs(workspaceRoot)) {
    projectConfig = mergeConfig(projectConfig, await readJsonConfig(configDir));
  }
  return mergeConfig(globalConfig, projectConfig);
}
async function collectRules(workspaceRoot) {
  const worktree = await findGitWorktree(workspaceRoot);
  const rules = [];
  const seen = /* @__PURE__ */ new Set();
  const config = await loadMergedConfig(workspaceRoot);
  const add = async (file) => {
    if (!file)
      return;
    const resolved = path11.resolve(file);
    if (seen.has(resolved))
      return;
    const rule = await readRule(resolved);
    if (!rule)
      return;
    seen.add(resolved);
    rules.push(rule);
  };
  if (!isProjectConfigDisabled()) {
    for (const name14 of ["AGENTS.md", "CLAUDE.md", "CONTEXT.md"]) {
      const hit = await findUp(name14, workspaceRoot, worktree);
      if (hit) {
        await add(hit);
        break;
      }
    }
  }
  for (const globalDir of opencodeGlobalConfigDirs()) {
    await add(path11.join(globalDir, "AGENTS.md"));
  }
  await add(path11.join(homedir3(), ".claude", "CLAUDE.md"));
  for (const raw of config.instructions ?? []) {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      let remoteUrl;
      try {
        remoteUrl = new URL(raw);
      } catch {
        continue;
      }
      if (remoteUrl.protocol !== "https:")
        continue;
      const content = await fetchRemoteInstruction(remoteUrl.href);
      if (!content?.trim() || seen.has(raw))
        continue;
      seen.add(raw);
      rules.push({ fullPath: raw, content });
      continue;
    }
    const expanded = resolveHomeRelative(raw);
    for (const m of await expandGlob(expanded, workspaceRoot))
      await add(m);
  }
  return { rules, config, worktree };
}
var init_rules = __esm({
  "node_modules/cursor-opencode-provider/dist/context/rules.js"() {
    init_paths();
  }
});

// node_modules/cursor-opencode-provider/dist/context/skills.js
import { readdir as readdir2, readFile as readFile2, stat as stat2 } from "node:fs/promises";
import path12 from "node:path";
import { homedir as homedir4 } from "node:os";
async function exists2(p) {
  try {
    await stat2(p);
    return true;
  } catch {
    return false;
  }
}
function parseFrontmatter(raw) {
  if (!raw.startsWith("---"))
    return { body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end < 0)
    return { body: raw };
  const fm = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\n/, "");
  let name14;
  let description;
  for (const line of fm.split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m)
      continue;
    const key = m[1];
    let val = m[2].trim();
    if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1);
    }
    if (key === "name")
      name14 = val;
    if (key === "description")
      description = val;
  }
  return { name: name14, description, body };
}
async function loadSkillFile(file) {
  try {
    const raw = await readFile2(file, "utf-8");
    const { name: name14, description, body } = parseFrontmatter(raw);
    const dirName = path12.basename(path12.dirname(file));
    return {
      fullPath: path12.resolve(file),
      name: name14 || dirName,
      description: description || "",
      content: body.slice(0, 2e4)
    };
  } catch {
    return void 0;
  }
}
async function scanSkillsRoot(root, out) {
  if (!await exists2(root))
    return;
  let entries;
  try {
    entries = await readdir2(root);
  } catch {
    return;
  }
  entries.sort();
  for (const name14 of entries) {
    const skillMd = path12.join(root, name14, "SKILL.md");
    if (!await exists2(skillMd))
      continue;
    const skill = await loadSkillFile(skillMd);
    if (!skill)
      continue;
    if (!out.has(skill.name))
      out.set(skill.name, skill);
  }
}
async function walkAncestorsFor(dir, rel, stop, out) {
  let cur = path12.resolve(dir);
  const root = path12.resolve(stop);
  for (; ; ) {
    await scanSkillsRoot(path12.join(cur, rel), out);
    if (cur === root)
      break;
    const parent = path12.dirname(cur);
    if (parent === cur)
      break;
    cur = parent;
  }
}
async function collectSkills(workspaceRoot, worktree) {
  const out = /* @__PURE__ */ new Map();
  const home = homedir4();
  for (const projectDir of opencodeProjectConfigDirs(workspaceRoot)) {
    const relative = path12.relative(workspaceRoot, projectDir);
    await walkAncestorsFor(workspaceRoot, path12.join(relative, "skills"), worktree, out);
  }
  for (const globalDir of opencodeGlobalConfigDirs()) {
    await scanSkillsRoot(path12.join(globalDir, "skills"), out);
  }
  await walkAncestorsFor(workspaceRoot, path12.join(".claude", "skills"), worktree, out);
  await scanSkillsRoot(path12.join(home, ".claude", "skills"), out);
  await walkAncestorsFor(workspaceRoot, path12.join(".agents", "skills"), worktree, out);
  await scanSkillsRoot(path12.join(home, ".agents", "skills"), out);
  return [...out.values()];
}
var init_skills = __esm({
  "node_modules/cursor-opencode-provider/dist/context/skills.js"() {
    init_paths();
  }
});

// node_modules/cursor-opencode-provider/dist/context/agents.js
import { readdir as readdir3, readFile as readFile3, realpath, stat as stat3 } from "node:fs/promises";
import path13 from "node:path";
async function exists3(p) {
  try {
    await stat3(p);
    return true;
  } catch {
    return false;
  }
}
function parseAgentMarkdown(raw, fallbackName) {
  let name14 = fallbackName;
  let description = "";
  let body = raw;
  if (raw.startsWith("---")) {
    const end = raw.indexOf("\n---", 3);
    if (end >= 0) {
      const fm = raw.slice(3, end).trim();
      body = raw.slice(end + 4).replace(/^\n/, "");
      for (const line of fm.split("\n")) {
        const m = line.match(/^(\w+):\s*(.*)$/);
        if (!m)
          continue;
        let val = m[2].trim();
        if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
          val = val.slice(1, -1);
        }
        if (m[1] === "name")
          name14 = val;
        if (m[1] === "description")
          description = val;
      }
    }
  }
  return { name: name14, description, prompt: body.slice(0, 2e4) };
}
function uniquePaths(paths) {
  const seen = /* @__PURE__ */ new Set();
  return paths.filter((value) => {
    const normalized = path13.resolve(value);
    if (seen.has(normalized))
      return false;
    seen.add(normalized);
    return true;
  });
}
async function scanAgentRoot(root, out) {
  if (!await exists3(root))
    return;
  const visitedDirs = /* @__PURE__ */ new Set();
  const scanDir = async (dir, relativePrefix) => {
    let canonical;
    try {
      canonical = await realpath(dir);
    } catch {
      return;
    }
    if (visitedDirs.has(canonical))
      return;
    visitedDirs.add(canonical);
    let entries;
    try {
      entries = await readdir3(dir, { withFileTypes: true });
      entries.sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path13.join(dir, entry.name);
      const relative = path13.join(relativePrefix, entry.name);
      let isDirectory = entry.isDirectory();
      let isFile = entry.isFile();
      if (entry.isSymbolicLink()) {
        try {
          const target = await stat3(full);
          isDirectory = target.isDirectory();
          isFile = target.isFile();
        } catch {
          continue;
        }
      }
      if (isDirectory) {
        await scanDir(full, relative);
        continue;
      }
      if (!isFile || !entry.name.endsWith(".md"))
        continue;
      try {
        const raw = await readFile3(full, "utf-8");
        const fallbackName = relative.replace(/\\/g, "/").replace(/\.md$/, "");
        const parsed = parseAgentMarkdown(raw, fallbackName);
        if (!out.has(parsed.name)) {
          out.set(parsed.name, {
            fullPath: path13.resolve(full),
            name: parsed.name,
            description: parsed.description,
            prompt: parsed.prompt
          });
        }
      } catch {
      }
    }
  };
  await scanDir(path13.join(root, "agent"), "agent");
  await scanDir(path13.join(root, "agents"), "agents");
}
async function collectAgents(workspaceRoot) {
  const out = /* @__PURE__ */ new Map();
  const roots = uniquePaths([
    ...opencodeProjectConfigDirs(workspaceRoot),
    ...opencodeGlobalConfigDirs()
  ]);
  for (const root of roots)
    await scanAgentRoot(root, out);
  return [...out.values()];
}
var init_agents = __esm({
  "node_modules/cursor-opencode-provider/dist/context/agents.js"() {
    init_paths();
  }
});

// node_modules/cursor-opencode-provider/dist/context/plugins.js
import { readdir as readdir4, stat as stat4 } from "node:fs/promises";
import path14 from "node:path";
async function listLocalPlugins(dir) {
  try {
    await stat4(dir);
  } catch {
    return [];
  }
  const out = [];
  let entries;
  try {
    entries = await readdir4(dir);
  } catch {
    return [];
  }
  entries.sort();
  for (const name14 of entries) {
    if (!/\.(m?[jt]s)$/.test(name14))
      continue;
    const full = path14.join(dir, name14);
    out.push({ id: name14.replace(/\.(m?[jt]s)$/, ""), source: "local", path: full });
  }
  return out;
}
async function collectPlugins(workspaceRoot, config) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const id of [...config.plugin ?? [], ...config.plugins ?? []]) {
    if (!id || seen.has(id))
      continue;
    seen.add(id);
    out.push({ id, source: "npm" });
  }
  for (const configDir of opencodeProjectConfigDirs(workspaceRoot)) {
    for (const p of await listLocalPlugins(path14.join(configDir, "plugins"))) {
      if (seen.has(p.id))
        continue;
      seen.add(p.id);
      out.push(p);
    }
  }
  for (const configDir of opencodeGlobalConfigDirs()) {
    for (const p of await listLocalPlugins(path14.join(configDir, "plugins"))) {
      if (seen.has(p.id))
        continue;
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
}
var init_plugins = __esm({
  "node_modules/cursor-opencode-provider/dist/context/plugins.js"() {
    init_paths();
  }
});

// node_modules/cursor-opencode-provider/dist/context/git.js
import { execFile as execFile2 } from "node:child_process";
import { promisify as promisify2 } from "node:util";
import path15 from "node:path";
async function git2(cwd, args) {
  try {
    const { stdout } = await execFileAsync2("git", args, { cwd, encoding: "utf-8", timeout: 5e3 });
    return stdout.trim();
  } catch {
    return "";
  }
}
async function collectGit(workspaceRoot) {
  const root = await git2(workspaceRoot, ["rev-parse", "--show-toplevel"]);
  if (!root)
    return { repositoryInfo: [], gitRepos: [] };
  const remotesRaw = await git2(root, ["remote", "-v"]);
  const remote_urls = [];
  const remote_names = [];
  for (const line of remotesRaw.split("\n")) {
    const m = line.match(/^(\S+)\s+(\S+)\s+\(fetch\)/);
    if (!m)
      continue;
    remote_names.push(m[1]);
    remote_urls.push(m[2]);
  }
  const primary = remote_urls[0] ?? "";
  let repo_owner = "";
  let repo_name = path15.basename(root);
  const gh = primary.match(/[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (gh) {
    repo_owner = gh[1];
    repo_name = gh[2];
  }
  const branch = await git2(root, ["rev-parse", "--abbrev-ref", "HEAD"]) || "HEAD";
  const status = await git2(root, ["status", "--porcelain", "-b"]);
  const repositoryInfo = [
    {
      relative_workspace_path: ".",
      remote_urls,
      remote_names,
      repo_name,
      repo_owner,
      is_tracked: remote_urls.length > 0,
      is_local: remote_urls.length === 0,
      workspace_uri: `file://${root}`
    }
  ];
  const gitRepos = [
    {
      path: root,
      status: status.slice(0, 4e3),
      branch_name: branch,
      ...primary ? { remote_url: primary } : {}
    }
  ];
  return { repositoryInfo, gitRepos };
}
var execFileAsync2;
var init_git = __esm({
  "node_modules/cursor-opencode-provider/dist/context/git.js"() {
    execFileAsync2 = promisify2(execFile2);
  }
});

// node_modules/cursor-opencode-provider/dist/context/layout.js
import { readdir as readdir5, stat as stat5 } from "node:fs/promises";
import path16 from "node:path";
async function collectProjectLayout(workspaceRoot, opts = {}) {
  const maxDepth = opts.maxDepth ?? 2;
  const maxEntries = opts.maxEntries ?? 80;
  return walk(path16.resolve(workspaceRoot), 0, maxDepth, maxEntries);
}
async function walk(dir, depth, maxDepth, maxEntries) {
  const node = {
    abs_path: dir,
    children_dirs: [],
    children_files: [],
    children_were_processed: depth < maxDepth,
    num_files: 0
  };
  if (depth >= maxDepth)
    return node;
  let names;
  try {
    names = await readdir5(dir);
  } catch {
    node.children_were_processed = false;
    return node;
  }
  names.sort();
  let count = 0;
  for (const name14 of names) {
    if (count >= maxEntries)
      break;
    if (name14.startsWith(".") && name14 !== ".opencode" && name14 !== ".claude" && name14 !== ".agents")
      continue;
    if (SKIP.has(name14))
      continue;
    const full = path16.join(dir, name14);
    let st;
    try {
      st = await stat5(full);
    } catch {
      continue;
    }
    count++;
    if (st.isDirectory()) {
      node.children_dirs.push(await walk(full, depth + 1, maxDepth, maxEntries));
    } else {
      node.children_files.push({ name: name14 });
      node.num_files++;
    }
  }
  return node;
}
var SKIP;
var init_layout = __esm({
  "node_modules/cursor-opencode-provider/dist/context/layout.js"() {
    SKIP = /* @__PURE__ */ new Set(["node_modules", ".git", "dist", "build", ".next", "coverage", ".turbo"]);
  }
});

// node_modules/cursor-opencode-provider/dist/context/build.js
import path17 from "node:path";
function buildAdvertisedSubagentCatalog(hostSubagents, discoveredAgents) {
  if (!hostSubagents.executor)
    return { agents: [], complete: true };
  if (hostSubagents.complete)
    return { agents: hostSubagents.agents, complete: true };
  return {
    agents: [...DEFAULT_HOST_SUBAGENTS, ...hostSubagents.agents, ...discoveredAgents],
    complete: true
  };
}
async function buildRequestContext(input2) {
  const workspaceRoot = path17.resolve(input2.workspaceRoot || process.cwd());
  const { rules, config, worktree } = await collectRules(workspaceRoot);
  const [dynamic, git3, layout] = await Promise.all([
    buildDynamicRequestContextFromDiscovery(input2, workspaceRoot, worktree, config),
    collectGit(workspaceRoot),
    collectProjectLayout(workspaceRoot)
  ]);
  const base = {
    env: buildEnv(workspaceRoot),
    rules: rules.map((r) => ({
      full_path: r.fullPath,
      content: r.content
    })),
    repository_info: git3.repositoryInfo,
    git_repos: git3.gitRepos,
    project_layouts: [layout],
    rules_info_complete: true,
    env_info_complete: true,
    repository_info_complete: true,
    git_repo_info_complete: true,
    git_status_info_complete: true
  };
  const ctx = materializeRequestContext(base, dynamic);
  traceRequestContextPaths("buildRequestContext", ctx);
  return ctx;
}
async function buildDynamicRequestContextFromDiscovery(input2, workspaceRoot, worktree, config) {
  const providerIdentifier = input2.providerIdentifier ?? "opencode";
  const tools = input2.tools ?? [];
  const [skills, agents, plugins] = await Promise.all([
    collectSkills(workspaceRoot, worktree),
    collectAgents(workspaceRoot),
    collectPlugins(workspaceRoot, config)
  ]);
  const mcpServerNames = Object.keys(config.mcp ?? {});
  const flat = toolsToDescriptors(tools, providerIdentifier, mcpServerNames);
  const nested = toolsToMcpDescriptors(tools, providerIdentifier, mcpServerNames);
  const projectDir = ensureOpencodeProjectDir(workspaceRoot);
  const hostSubagents = extractHostSubagentCatalog(tools);
  const advertisedSubagents = buildAdvertisedSubagentCatalog(hostSubagents, agents);
  const discoveredByName = new Map(agents.map((agent) => [agent.name, agent]));
  const advertisedByName = /* @__PURE__ */ new Map();
  for (const agent of advertisedSubagents.agents) {
    if (!advertisedByName.has(agent.name))
      advertisedByName.set(agent.name, agent);
  }
  const customSubagents = [...advertisedByName.values()].map((agent) => {
    const discovered = discoveredByName.get(agent.name);
    return {
      full_path: discovered?.fullPath ?? "",
      name: agent.name,
      description: discovered?.description || agent.description || "Host-configured subagent.",
      // The host applies the real configured prompt when Task/Actor executes.
      // Cursor only needs enough context to select the recipient intentionally.
      prompt: discovered?.prompt || `Delegate to the host-configured ${agent.name} subagent; its host instructions and tools apply.`
    };
  });
  const dynamic = {
    tools: flat,
    agent_skills: skills.map((s) => ({
      full_path: s.fullPath,
      content: s.content,
      description: s.description
    })),
    custom_subagents: customSubagents,
    mcp_file_system_options: {
      enabled: true,
      // Cursor metadata root (mcps / agent-tools), not the git workspace.
      workspace_project_dir: projectDir,
      mcp_descriptors: nested
    },
    mcp_meta_tool_options: {
      enabled: true,
      mcp_descriptors: nested
    },
    // This provider always rejects native web_search/web_fetch interaction
    // queries with a headless-UI reason (see interactions.ts). Advertise that
    // unavailability up front so Cursor prefers the collision-safe
    // custom_web* aliases instead of routing through a query doomed to fail.
    web_search_enabled: false,
    web_fetch_enabled: false,
    agent_skills_info_complete: true,
    custom_subagents_info_complete: advertisedSubagents.complete,
    mcp_file_system_info_complete: true,
    mcp_info_complete: true
  };
  if (plugins.length > 0) {
    dynamic.hooks_additional_context = plugins.map((p) => `opencode-plugin:${p.source}:${p.id}`).join("\n");
  }
  return dynamic;
}
async function buildDynamicRequestContext(input2) {
  const workspaceRoot = path17.resolve(input2.workspaceRoot || process.cwd());
  const [worktree, config] = await Promise.all([
    findGitWorktree(workspaceRoot),
    loadMergedConfig(workspaceRoot)
  ]);
  return buildDynamicRequestContextFromDiscovery(input2, workspaceRoot, worktree, config);
}
function materializeRequestContext(base, dynamic) {
  const context = structuredClone(base);
  for (const key of DYNAMIC_REQUEST_CONTEXT_KEYS)
    delete context[key];
  for (const key of DYNAMIC_REQUEST_CONTEXT_KEYS) {
    if (Object.hasOwn(dynamic, key))
      context[key] = structuredClone(dynamic[key]);
  }
  return context;
}
function requestContextBase(context) {
  const base = structuredClone(context);
  for (const key of DYNAMIC_REQUEST_CONTEXT_KEYS)
    delete base[key];
  return base;
}
var DYNAMIC_REQUEST_CONTEXT_KEYS, DEFAULT_HOST_SUBAGENTS;
var init_build = __esm({
  "node_modules/cursor-opencode-provider/dist/context/build.js"() {
    init_tools();
    init_rules();
    init_skills();
    init_agents();
    init_plugins();
    init_git();
    init_layout();
    init_env();
    init_paths();
    init_debug();
    DYNAMIC_REQUEST_CONTEXT_KEYS = [
      "tools",
      "agent_skills",
      "custom_subagents",
      "mcp_file_system_options",
      "mcp_meta_tool_options",
      "web_search_enabled",
      "web_fetch_enabled",
      "agent_skills_info_complete",
      "custom_subagents_info_complete",
      "mcp_file_system_info_complete",
      "mcp_info_complete",
      "hooks_additional_context"
    ];
    DEFAULT_HOST_SUBAGENTS = [
      {
        name: "general",
        description: "General-purpose agent for complex research and multi-step tasks."
      },
      {
        name: "explore",
        description: "Read-only agent for searching and understanding the local codebase."
      }
    ];
  }
});

// node_modules/cursor-opencode-provider/dist/context/frozen.js
function freezeSnapshot(value, seen = /* @__PURE__ */ new Set()) {
  if (!value || typeof value !== "object")
    return value;
  const object = value;
  if (seen.has(object) || ArrayBuffer.isView(object))
    return value;
  seen.add(object);
  for (const child of Object.values(object))
    freezeSnapshot(child, seen);
  return Object.freeze(value);
}
function remember2(conversationId, context) {
  byConversationId2.delete(conversationId);
  byConversationId2.set(conversationId, freezeSnapshot(structuredClone(context)));
  materializedByConversationId.delete(conversationId);
  while (byConversationId2.size > MAX_FROZEN_REQUEST_CONTEXTS) {
    const oldest = byConversationId2.keys().next().value;
    if (!oldest)
      break;
    byConversationId2.delete(oldest);
    materializedByConversationId.delete(oldest);
  }
}
function getFrozenRequestContext(conversationId) {
  const frozen = byConversationId2.get(conversationId);
  if (!frozen)
    return void 0;
  byConversationId2.delete(conversationId);
  byConversationId2.set(conversationId, frozen);
  return frozen;
}
function setFrozenRequestContext(conversationId, context) {
  if (!conversationId)
    return;
  remember2(conversationId, requestContextBase(context));
}
function clearFrozenRequestContext(conversationId) {
  byConversationId2.delete(conversationId);
  materializedByConversationId.delete(conversationId);
}
function transferFrozenRequestContext(previousConversationId, nextConversationId) {
  if (!previousConversationId || !nextConversationId)
    return false;
  const base = byConversationId2.get(previousConversationId);
  const materialized = materializedByConversationId.get(previousConversationId);
  clearFrozenRequestContext(previousConversationId);
  clearFrozenRequestContext(nextConversationId);
  if (!base)
    return false;
  remember2(nextConversationId, base);
  if (materialized) {
    materializedByConversationId.set(nextConversationId, {
      context: materialized.context,
      bytes: Uint8Array.from(materialized.bytes)
    });
  }
  return true;
}
function sameBytes(a, b) {
  if (a.length !== b.length)
    return false;
  for (let i = 0; i < a.length; i++)
    if (a[i] !== b[i])
      return false;
  return true;
}
function rememberMaterialized(conversationId, context) {
  const bytes = encodeMessage("RequestContext", context);
  const previous = materializedByConversationId.get(conversationId);
  if (previous && sameBytes(previous.bytes, bytes)) {
    return { context: previous.context, reused: true };
  }
  const frozen = freezeSnapshot(structuredClone(context));
  materializedByConversationId.set(conversationId, {
    context: frozen,
    bytes: Uint8Array.from(bytes)
  });
  return { context: frozen, reused: false };
}
async function getOrBuildRequestContext(conversationId, input2, opts) {
  if (!opts?.refresh && conversationId) {
    const base = getFrozenRequestContext(conversationId);
    if (base) {
      const dynamic = await buildDynamicRequestContext(input2);
      const materialized2 = rememberMaterialized(conversationId, materializeRequestContext(base, dynamic));
      trace(`request_context: materialized conversationId=${conversationId} tools=${Array.isArray(materialized2.context.tools) ? materialized2.context.tools.length : 0} reused=${materialized2.reused}`);
      return materialized2;
    }
  }
  if (!opts?.refresh && conversationId) {
    const inFlight = buildsByConversationId.get(conversationId);
    if (inFlight) {
      await inFlight;
      return getOrBuildRequestContext(conversationId, input2);
    }
  }
  const build = buildRequestContext(input2);
  if (conversationId)
    buildsByConversationId.set(conversationId, build);
  let context;
  try {
    context = await build;
  } finally {
    if (conversationId && buildsByConversationId.get(conversationId) === build) {
      buildsByConversationId.delete(conversationId);
    }
  }
  if (conversationId)
    setFrozenRequestContext(conversationId, context);
  const materialized = conversationId ? rememberMaterialized(conversationId, context) : { context: freezeSnapshot(structuredClone(context)), reused: false };
  trace(`request_context: built+frozen conversationId=${conversationId || "(none)"} tools=${Array.isArray(materialized.context.tools) ? materialized.context.tools.length : 0} refresh=${!!opts?.refresh}`);
  return { context: materialized.context, reused: false };
}
var byConversationId2, materializedByConversationId, buildsByConversationId, MAX_FROZEN_REQUEST_CONTEXTS;
var init_frozen = __esm({
  "node_modules/cursor-opencode-provider/dist/context/frozen.js"() {
    init_build();
    init_debug();
    init_messages();
    byConversationId2 = /* @__PURE__ */ new Map();
    materializedByConversationId = /* @__PURE__ */ new Map();
    buildsByConversationId = /* @__PURE__ */ new Map();
    MAX_FROZEN_REQUEST_CONTEXTS = 256;
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/conversation-bind.js
import { createHash as createHash2 } from "node:crypto";
function rememberConversation(sessionKey, conversationId) {
  activeBySession.delete(sessionKey);
  activeBySession.set(sessionKey, conversationId);
  while (activeBySession.size > MAX_ACTIVE_CONVERSATION_BINDINGS) {
    const oldest = activeBySession.entries().next().value;
    if (!oldest)
      break;
    activeBySession.delete(oldest[0]);
    clearCheckpoint(oldest[1]);
    clearConversationBlobs(oldest[1]);
    clearFrozenRequestContext(oldest[1]);
  }
}
function hasConversationBinding(sessionKey) {
  return activeBySession.has(sessionKey);
}
function isActiveConversationBinding(sessionKey, conversationId) {
  return activeBySession.get(sessionKey) === conversationId;
}
function restoreConversationBinding(sessionKey, conversationId) {
  if (!sessionKey || !conversationId)
    return;
  rememberConversation(sessionKey, conversationId);
}
function sessionIdToUuid(sessionId) {
  const hash = createHash2("sha256").update(`cursor-opencode-provider:conv:${sessionId}`).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = bytes[6] & 15 | 64;
  bytes[8] = bytes[8] & 63 | 128;
  const hex4 = bytes.toString("hex");
  return `${hex4.slice(0, 8)}-${hex4.slice(8, 12)}-${hex4.slice(12, 16)}-${hex4.slice(16, 20)}-${hex4.slice(20, 32)}`;
}
function resolveConversationGroupId(sessionKey, conversationId) {
  return sessionKey ? sessionIdToUuid(sessionKey) : conversationId;
}
function peekConversationId(sessionKey) {
  let id = activeBySession.get(sessionKey);
  if (!id) {
    id = sessionIdToUuid(sessionKey);
  }
  rememberConversation(sessionKey, id);
  return id;
}
function bindConversationId(sessionKey, opts) {
  if (opts?.ephemeral) {
    return { conversationId: crypto.randomUUID(), reset: false };
  }
  if (!sessionKey) {
    return { conversationId: crypto.randomUUID(), reset: !!opts?.reset };
  }
  if (opts?.reset) {
    const previousId = activeBySession.get(sessionKey) ?? sessionIdToUuid(sessionKey);
    const conversationId = crypto.randomUUID();
    clearCheckpoint(previousId);
    clearConversationBlobs(previousId);
    transferFrozenRequestContext(previousId, conversationId);
    rememberConversation(sessionKey, conversationId);
    return { conversationId, reset: true, previousId };
  }
  return { conversationId: peekConversationId(sessionKey), reset: false };
}
var activeBySession, MAX_ACTIVE_CONVERSATION_BINDINGS;
var init_conversation_bind = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/conversation-bind.js"() {
    init_checkpoint();
    init_blob_store();
    init_frozen();
    activeBySession = /* @__PURE__ */ new Map();
    MAX_ACTIVE_CONVERSATION_BINDINGS = 256;
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/conversation-persistence.js
import { createHash as createHash3, randomUUID as randomUUID2 } from "node:crypto";
import path18 from "node:path";
import { chmod, link, mkdir, readFile as readFile4, readdir as readdir6, rename, unlink, writeFile } from "node:fs/promises";
import { constants as zlibConstants, gunzipSync as gunzipSync2, gzipSync as gzipSync2 } from "node:zlib";
function recordStartupDiscard(cacheDir, fileName, status) {
  const root = path18.resolve(cacheDir);
  let statuses = startupDiscardedStatuses.get(root);
  if (!statuses) {
    statuses = /* @__PURE__ */ new Map();
    startupDiscardedStatuses.set(root, statuses);
  }
  statuses.set(fileName, status);
}
function conversationCacheDirectoryPath(cacheDir) {
  return path18.join(cacheDir, CONVERSATION_CACHE_DIR);
}
function sessionFileName(sessionKey) {
  const label = sessionKey.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 48);
  const hash = createHash3("sha256").update(sessionKey).digest("hex");
  return `${label || "session"}-${hash}.pb.gz`;
}
function conversationCacheFilePath(cacheDir, sessionKey) {
  return path18.join(conversationCacheDirectoryPath(cacheDir), sessionFileName(sessionKey));
}
function cloneConversation(value) {
  return {
    ...value,
    checkpoint: value.checkpoint ? Uint8Array.from(value.checkpoint) : void 0,
    blobs: value.blobs.map((blob) => ({ id: blob.id, data: Uint8Array.from(blob.data) })),
    requestContext: structuredClone(value.requestContext),
    toolCatalog: structuredClone(value.toolCatalog),
    postCompactionRebase: value.postCompactionRebase
  };
}
function fieldTag(field, wireType) {
  return field << 3 | wireType;
}
function bytesToHex(bytes) {
  return Buffer.from(bytes).toString("hex");
}
function readUint64(reader) {
  const raw = reader.uint64();
  const value = typeof raw === "number" ? raw : Number(raw.toString());
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error("invalid uint64");
  return value;
}
function readBlob(encoded) {
  const reader = import_protobufjs4.default.Reader.create(encoded);
  let id;
  let blobData;
  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag >>> 3) {
      case 1:
        if ((tag & 7) !== 2)
          throw new Error("invalid blob id");
        id = reader.bytes();
        break;
      case 2:
        if ((tag & 7) !== 2)
          throw new Error("invalid blob data");
        blobData = reader.bytes();
        break;
      default:
        reader.skipType(tag & 7);
    }
  }
  if (!id || id.length === 0 || !blobData)
    throw new Error("incomplete blob");
  return { id: bytesToHex(id), data: Uint8Array.from(blobData) };
}
function readTool(data) {
  const reader = import_protobufjs4.default.Reader.create(data);
  let name14;
  let description;
  let inputSchema;
  let hasInputSchema = false;
  let sourceName;
  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    const wireType = tag & 7;
    switch (tag >>> 3) {
      case 1:
        if (wireType !== 2)
          throw new Error("invalid tool name");
        name14 = reader.string();
        break;
      case 2:
        if (wireType !== 2)
          throw new Error("invalid tool description");
        description = reader.string();
        break;
      case 3:
        if (wireType !== 2)
          throw new Error("invalid tool schema");
        inputSchema = JSON.parse(utf8Decoder.decode(reader.bytes()));
        hasInputSchema = true;
        break;
      case 4:
        if (wireType !== 2)
          throw new Error("invalid tool source name");
        sourceName = reader.string();
        break;
      default:
        reader.skipType(wireType);
    }
  }
  if (!name14)
    throw new Error("incomplete tool");
  return {
    name: name14,
    description,
    ...hasInputSchema ? { inputSchema } : {},
    sourceName
  };
}
function blobIdBytes(id) {
  if (!/^(?:[0-9a-f]{2})+$/i.test(id))
    throw new Error("invalid conversation blob id");
  return Buffer.from(id, "hex");
}
function encodeCacheFile(value) {
  const writer = import_protobufjs4.default.Writer.create();
  const requestContext = encodeMessage("RequestContext", value.requestContext);
  writer.uint32(fieldTag(1, 0)).uint32(CONVERSATION_CACHE_SCHEMA_VERSION);
  writer.uint32(fieldTag(2, 2)).string(value.sessionKey);
  writer.uint32(fieldTag(3, 2)).string(value.conversationId);
  writer.uint32(fieldTag(4, 0)).uint64(value.updatedAt);
  if (value.checkpoint?.length)
    writer.uint32(fieldTag(5, 2)).bytes(value.checkpoint);
  for (const blob of value.blobs) {
    writer.uint32(fieldTag(6, 2)).fork();
    writer.uint32(fieldTag(1, 2)).bytes(blobIdBytes(blob.id));
    writer.uint32(fieldTag(2, 2)).bytes(blob.data);
    writer.ldelim();
  }
  writer.uint32(fieldTag(7, 2)).bytes(requestContext);
  for (const tool of value.toolCatalog) {
    writer.uint32(fieldTag(8, 2)).fork();
    writer.uint32(fieldTag(1, 2)).string(tool.name);
    if (tool.description !== void 0)
      writer.uint32(fieldTag(2, 2)).string(tool.description);
    if (tool.inputSchema !== void 0) {
      writer.uint32(fieldTag(3, 2)).bytes(Buffer.from(JSON.stringify(tool.inputSchema), "utf8"));
    }
    if (tool.sourceName !== void 0)
      writer.uint32(fieldTag(4, 2)).string(tool.sourceName);
    writer.ldelim();
  }
  if (value.postCompactionRebase)
    writer.uint32(fieldTag(9, 0)).bool(true);
  return { protobufBytes: writer.finish(), requestContextBytes: requestContext.length };
}
function decodeProtobuf(data) {
  const reader = import_protobufjs4.default.Reader.create(data);
  let schemaVersion;
  let sessionKey;
  let conversationId;
  let updatedAt;
  let checkpoint;
  const blobs = [];
  let requestContextBytes;
  const toolCatalog = [];
  let postCompactionRebase = false;
  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    const wireType = tag & 7;
    switch (tag >>> 3) {
      case 1:
        if (wireType !== 0)
          throw new Error("invalid schema version");
        schemaVersion = reader.uint32();
        break;
      case 2:
        if (wireType !== 2)
          throw new Error("invalid session key");
        sessionKey = reader.string();
        break;
      case 3:
        if (wireType !== 2)
          throw new Error("invalid conversation id");
        conversationId = reader.string();
        break;
      case 4:
        if (wireType !== 0)
          throw new Error("invalid update timestamp");
        updatedAt = readUint64(reader);
        break;
      case 5:
        if (wireType !== 2)
          throw new Error("invalid checkpoint");
        checkpoint = Uint8Array.from(reader.bytes());
        break;
      case 6:
        if (wireType !== 2)
          throw new Error("invalid blob");
        blobs.push(readBlob(reader.bytes()));
        break;
      case 7:
        if (wireType !== 2)
          throw new Error("invalid request context");
        requestContextBytes = reader.bytes();
        break;
      case 8:
        if (wireType !== 2)
          throw new Error("invalid tool");
        toolCatalog.push(readTool(reader.bytes()));
        break;
      case 9:
        if (wireType !== 0)
          throw new Error("invalid compaction marker");
        postCompactionRebase = reader.bool();
        break;
      default:
        reader.skipType(wireType);
    }
  }
  if (schemaVersion !== CONVERSATION_CACHE_SCHEMA_VERSION || !sessionKey || !conversationId || updatedAt === void 0 || !requestContextBytes || requestContextBytes.length === 0)
    throw new Error("incomplete conversation cache");
  const requestContext = decodeMessageSparse("RequestContext", requestContextBytes);
  return {
    sessionKey,
    conversationId,
    updatedAt,
    checkpoint,
    blobs,
    requestContext,
    toolCatalog,
    postCompactionRebase
  };
}
function decodeCacheFile(compressed, expectedSessionKey) {
  try {
    if (compressed.length > MAX_CONVERSATION_CACHE_BYTES)
      return void 0;
    const protobufBytes = gunzipSync2(compressed, { maxOutputLength: MAX_CONVERSATION_CACHE_BYTES });
    const conversation = decodeProtobuf(protobufBytes);
    if (expectedSessionKey && conversation.sessionKey !== expectedSessionKey)
      return void 0;
    return conversation;
  } catch {
    return void 0;
  }
}
function isFresh(value, now) {
  return now - value.updatedAt <= CONVERSATION_CACHE_TTL_MS;
}
async function readConversationFile(filePath, expectedSessionKey) {
  try {
    return decodeCacheFile(await readFile4(filePath), expectedSessionKey);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : void 0;
    if (code !== "ENOENT")
      return void 0;
    return void 0;
  }
}
async function readConversationFileWithStatus(filePath, expectedSessionKey) {
  try {
    const value = decodeCacheFile(await readFile4(filePath), expectedSessionKey);
    return value ? { status: "restored", value } : { status: "invalid" };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : void 0;
    return { status: code === "ENOENT" ? "missing" : "invalid" };
  }
}
async function discardCacheCandidate(filePath, now) {
  const quarantinePath = `${filePath}.${process.pid}.${randomUUID2()}.stale`;
  try {
    await rename(filePath, quarantinePath);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : void 0;
    if (code === "ENOENT")
      return void 0;
    throw error;
  }
  try {
    const moved = await readConversationFile(quarantinePath);
    if (moved && isFresh(moved, now)) {
      try {
        await link(quarantinePath, filePath);
        return moved;
      } catch (error) {
        const code = error && typeof error === "object" && "code" in error ? error.code : void 0;
        if (code !== "EEXIST")
          throw error;
        return await readConversationFile(filePath);
      }
    }
  } finally {
    await unlink(quarantinePath).catch(() => {
    });
  }
  return await readConversationFile(filePath);
}
async function writeConversationFile(cacheDir, value) {
  const directory = conversationCacheDirectoryPath(cacheDir);
  const filePath = conversationCacheFilePath(cacheDir, value.sessionKey);
  const tempPath = path18.join(directory, `.${path18.basename(filePath)}.${process.pid}.${randomUUID2()}.tmp`);
  const encoded = encodeCacheFile(value);
  const { protobufBytes } = encoded;
  const compressed = gzipSync2(protobufBytes, { level: zlibConstants.Z_BEST_COMPRESSION });
  await ensureCacheDirectory(directory);
  try {
    await writeFile(tempPath, compressed, { mode: 384 });
    await rename(tempPath, filePath);
    trace(`conversation persistence: snapshot written sessionKey=${value.sessionKey} fileBytes=${compressed.length} protobufBytes=${protobufBytes.length} checkpointBytes=${value.checkpoint?.length ?? 0} blobCount=${value.blobs.length} blobBytes=${value.blobs.reduce((sum, blob) => sum + blob.data.length, 0)} requestContextBytes=${encoded.requestContextBytes} toolCatalogBytes=${Buffer.byteLength(JSON.stringify(value.toolCatalog))}`);
  } finally {
    await unlink(tempPath).catch(() => {
    });
  }
}
async function ensureCacheDirectory(directory) {
  await mkdir(directory, { recursive: true, mode: 448 });
  if (process.platform !== "win32")
    await chmod(directory, 448);
}
function queueWrite(store, value) {
  const snapshot = cloneConversation(value);
  const write = store.writeChain.catch(() => {
  }).then(() => writeConversationFile(store.cacheDir, snapshot));
  store.writeChain = write;
  return write;
}
function queueDelete(store) {
  const write = store.writeChain.catch(() => {
  }).then(async () => {
    await unlink(conversationCacheFilePath(store.cacheDir, store.sessionKey)).catch((error) => {
      const code = error && typeof error === "object" && "code" in error ? error.code : void 0;
      if (code !== "ENOENT")
        throw error;
    });
  });
  store.writeChain = write;
  return write;
}
async function pruneConversationDirectory(cacheDir, now) {
  const directory = conversationCacheDirectoryPath(cacheDir);
  await ensureCacheDirectory(directory);
  const entries = await readdir6(directory, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    if (!entry.isFile())
      return;
    const filePath = path18.join(directory, entry.name);
    if (entry.name.endsWith(".json")) {
      trace(`conversation persistence: startup removed legacy JSON snapshot file=${entry.name}`);
      await unlink(filePath).catch(() => {
      });
      return;
    }
    if (!entry.name.endsWith(".pb.gz"))
      return;
    const loaded = await readConversationFileWithStatus(filePath);
    if (loaded.status === "invalid") {
      recordStartupDiscard(cacheDir, entry.name, "invalid");
      trace(`conversation persistence: startup discarded invalid snapshot file=${entry.name}`);
      await discardCacheCandidate(filePath, now);
    } else if (loaded.value && !isFresh(loaded.value, now)) {
      recordStartupDiscard(cacheDir, entry.name, "expired");
      trace(`conversation persistence: startup discarded expired snapshot sessionKey=${loaded.value.sessionKey} ageMs=${Math.max(0, now - loaded.value.updatedAt)}`);
      await discardCacheCandidate(filePath, now);
    }
  }));
}
async function initializeConversationPersistence(cacheDir, now = Date.now()) {
  const key = path18.resolve(cacheDir);
  let pending3 = initializedRoots.get(key);
  if (!pending3) {
    pending3 = pruneConversationDirectory(key, now);
    initializedRoots.set(key, pending3);
    pending3.catch(() => {
      if (initializedRoots.get(key) === pending3)
        initializedRoots.delete(key);
    });
  }
  await pending3;
}
async function loadStore(cacheDir, sessionKey, now) {
  await initializeConversationPersistence(cacheDir, now);
  const filePath = conversationCacheFilePath(cacheDir, sessionKey);
  const loaded = await readConversationFileWithStatus(filePath, sessionKey);
  let value = loaded.value;
  let loadStatus = loaded.status === "missing" ? startupDiscardedStatuses.get(path18.resolve(cacheDir))?.get(path18.basename(filePath)) ?? "missing" : loaded.status;
  if (value && !isFresh(value, now)) {
    loadStatus = "expired";
    value = await discardCacheCandidate(filePath, now);
    if (value && isFresh(value, now))
      loadStatus = "restored";
  }
  return {
    cacheDir,
    sessionKey,
    value: value && value.sessionKey === sessionKey && isFresh(value, now) ? value : void 0,
    loadStatus,
    writeChain: Promise.resolve()
  };
}
async function getStore(cacheDir, sessionKey, now = Date.now()) {
  const root = path18.resolve(cacheDir);
  const key = `${root}\0${sessionKey}`;
  let pending3 = stores.get(key);
  if (!pending3) {
    pending3 = loadStore(root, sessionKey, now);
    stores.set(key, pending3);
    pending3.catch(() => {
      if (stores.get(key) === pending3)
        stores.delete(key);
    });
  }
  return pending3;
}
async function loadPersistedConversation(cacheDir, sessionKey, now = Date.now()) {
  const store = await getStore(cacheDir, sessionKey, now);
  return store.value ? { status: "restored", value: cloneConversation(store.value) } : { status: store.loadStatus };
}
async function persistConversation(cacheDir, value, now = Date.now()) {
  const store = await getStore(cacheDir, value.sessionKey, now);
  const snapshot = cloneConversation({
    ...value,
    updatedAt: now,
    toolCatalog: structuredClone(value.toolCatalog ?? []),
    postCompactionRebase: value.postCompactionRebase === true
  });
  store.value = snapshot;
  store.loadStatus = "restored";
  startupDiscardedStatuses.get(path18.resolve(cacheDir))?.delete(path18.basename(conversationCacheFilePath(cacheDir, value.sessionKey)));
  await queueWrite(store, snapshot);
}
async function deletePersistedConversation(cacheDir, sessionKey, expectedConversationId) {
  const store = await getStore(cacheDir, sessionKey);
  const current = store.value;
  if (!current || expectedConversationId && current.conversationId !== expectedConversationId)
    return;
  store.value = void 0;
  store.loadStatus = "missing";
  await queueDelete(store);
}
var import_protobufjs4, stores, initializedRoots, startupDiscardedStatuses, MAX_CONVERSATION_CACHE_BYTES, utf8Decoder;
var init_conversation_persistence = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/conversation-persistence.js"() {
    import_protobufjs4 = __toESM(require_protobufjs(), 1);
    init_shared();
    init_messages();
    init_debug();
    stores = /* @__PURE__ */ new Map();
    initializedRoots = /* @__PURE__ */ new Map();
    startupDiscardedStatuses = /* @__PURE__ */ new Map();
    MAX_CONVERSATION_CACHE_BYTES = 256 * 1024 * 1024;
    utf8Decoder = new TextDecoder("utf-8", { fatal: true });
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/conversation-state.js
async function hydrateConversationState(cacheDir, sessionKey) {
  if (hasConversationBinding(sessionKey))
    return void 0;
  const loaded = await loadPersistedConversation(cacheDir, sessionKey);
  const persisted = loaded.value;
  if (!persisted) {
    trace(`conversation persistence: hydration skipped sessionKey=${sessionKey} status=${loaded.status}`);
    return void 0;
  }
  restoreConversationBinding(sessionKey, persisted.conversationId);
  if (persisted.checkpoint)
    setCheckpoint(persisted.conversationId, persisted.checkpoint);
  restoreConversationBlobs(persisted.conversationId, persisted.blobs);
  setFrozenRequestContext(persisted.conversationId, persisted.requestContext);
  trace(`conversation persistence: restored sessionKey=${sessionKey} conversationId=${persisted.conversationId} checkpoint=${persisted.checkpoint?.length ?? 0}B blobs=${persisted.blobs.length}`);
  return {
    conversationId: persisted.conversationId,
    postCompactionRebase: persisted.postCompactionRebase,
    toolCatalog: structuredClone(persisted.toolCatalog)
  };
}
async function persistConversationState(cacheDir, input2) {
  if (!isActiveConversationBinding(input2.sessionKey, input2.conversationId)) {
    trace(`conversation persistence: skipped superseded TurnEnded sessionKey=${input2.sessionKey} conversationId=${input2.conversationId}`);
    return;
  }
  const checkpoint = getCheckpoint(input2.conversationId);
  const blobCompaction = compactConversationBlobs(input2.conversationId, checkpoint);
  const blobs = blobCompaction.blobs;
  const requestContext = getFrozenRequestContext(input2.conversationId) ?? input2.requestContext;
  await persistConversation(cacheDir, {
    sessionKey: input2.sessionKey,
    conversationId: input2.conversationId,
    checkpoint,
    blobs,
    requestContext,
    toolCatalog: structuredClone(input2.toolCatalog ?? []),
    postCompactionRebase: input2.postCompactionRebase
  });
  trace(`conversation persistence: saved sessionKey=${input2.sessionKey} conversationId=${input2.conversationId} checkpoint=${checkpoint?.length ?? 0}B blobs=${blobCompaction.beforeCount}->${blobCompaction.afterCount} blobBytes=${blobCompaction.beforeBytes}->${blobCompaction.afterBytes}` + (blobCompaction.fallbackReason ? ` compactionFallback=${blobCompaction.fallbackReason}` : ""));
}
async function clearPersistedConversationState(cacheDir, sessionKey, expectedConversationId) {
  await deletePersistedConversation(cacheDir, sessionKey, expectedConversationId);
}
var init_conversation_state = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/conversation-state.js"() {
    init_debug();
    init_frozen();
    init_conversation_bind();
    init_blob_store();
    init_checkpoint();
    init_conversation_persistence();
  }
});

// node_modules/cursor-opencode-provider/dist/activity.js
var MAX_ANCESTRY_DEPTH, MAX_TRACKED_SESSIONS, ACTIVITY_RETENTION_MS, SessionActivityTracker, sessionActivity;
var init_activity = __esm({
  "node_modules/cursor-opencode-provider/dist/activity.js"() {
    MAX_ANCESTRY_DEPTH = 64;
    MAX_TRACKED_SESSIONS = 1024;
    ACTIVITY_RETENTION_MS = 24 * 60 * 60 * 1e3;
    SessionActivityTracker = class {
      parentBySession = /* @__PURE__ */ new Map();
      lastActivityBySession = /* @__PURE__ */ new Map();
      linkSession(sessionId, parentId) {
        if (!sessionId)
          return;
        this.prune(Date.now());
        if (parentId && parentId !== sessionId)
          this.parentBySession.set(sessionId, parentId);
        else
          this.parentBySession.delete(sessionId);
        const existing = this.lastActivityBySession.get(sessionId);
        if (existing !== void 0)
          this.recordActivity(sessionId, existing);
        this.prune(Date.now());
      }
      recordActivity(sessionId, at = Date.now()) {
        if (!sessionId || !Number.isFinite(at))
          return;
        this.prune(at);
        const visited = /* @__PURE__ */ new Set();
        let current = sessionId;
        for (let depth = 0; current && depth < MAX_ANCESTRY_DEPTH; depth++) {
          if (visited.has(current))
            return;
          visited.add(current);
          const previous = this.lastActivityBySession.get(current);
          if (previous === void 0 || at > previous) {
            this.lastActivityBySession.delete(current);
            this.lastActivityBySession.set(current, at);
          }
          current = this.parentBySession.get(current);
        }
        this.prune(at);
      }
      lastActivityAt(sessionId) {
        this.prune(Date.now());
        return this.lastActivityBySession.get(sessionId);
      }
      removeSession(sessionId) {
        this.parentBySession.delete(sessionId);
        this.lastActivityBySession.delete(sessionId);
      }
      clear() {
        this.parentBySession.clear();
        this.lastActivityBySession.clear();
      }
      prune(now) {
        const oldestAllowed = now - ACTIVITY_RETENTION_MS;
        for (const [sessionId, activityAt] of this.lastActivityBySession) {
          if (activityAt >= oldestAllowed)
            break;
          this.lastActivityBySession.delete(sessionId);
          this.parentBySession.delete(sessionId);
        }
        while (this.lastActivityBySession.size > MAX_TRACKED_SESSIONS) {
          const oldest = this.lastActivityBySession.keys().next().value;
          if (!oldest)
            break;
          this.lastActivityBySession.delete(oldest);
          this.parentBySession.delete(oldest);
        }
        while (this.parentBySession.size > MAX_TRACKED_SESSIONS) {
          const oldest = this.parentBySession.keys().next().value;
          if (!oldest)
            break;
          this.parentBySession.delete(oldest);
        }
      }
    };
    sessionActivity = new SessionActivityTracker();
  }
});

// node_modules/cursor-opencode-provider/dist/session.js
function positiveInteger(name14, value, fallback) {
  const resolved = value === void 0 ? fallback : value;
  if (typeof resolved !== "number" || !Number.isSafeInteger(resolved) || resolved <= 0 || resolved > MAX_TIMER_MS2) {
    throw new CursorProtocolError(`Cursor continuation ${name14} must be a positive integer no greater than ${MAX_TIMER_MS2}`);
  }
  return resolved;
}
function resolveContinuationPolicy(options) {
  if (options !== void 0 && (options === null || typeof options !== "object" || Array.isArray(options))) {
    throw new CursorProtocolError("Cursor continuation options must be an object");
  }
  for (const key of Object.keys(options ?? {})) {
    if (!["heartbeatMs", "semanticIdleMs", "softHealthMs", "hardCapMs"].includes(key)) {
      throw new CursorProtocolError(`Unknown Cursor continuation option: ${key}`);
    }
  }
  if (options?.semanticIdleMs !== void 0 && options.softHealthMs !== void 0 && options.semanticIdleMs !== options.softHealthMs) {
    throw new CursorProtocolError("Cursor continuation semanticIdleMs and deprecated softHealthMs must match when both are set");
  }
  const heartbeatMs = positiveInteger("heartbeatMs", options?.heartbeatMs, DEFAULT_CONTINUATION_POLICY.heartbeatMs);
  const semanticIdleMs = positiveInteger("semanticIdleMs", options?.semanticIdleMs ?? options?.softHealthMs, DEFAULT_CONTINUATION_POLICY.semanticIdleMs);
  const hardCapMs = positiveInteger("hardCapMs", options?.hardCapMs, DEFAULT_CONTINUATION_POLICY.hardCapMs);
  if (heartbeatMs >= semanticIdleMs) {
    throw new CursorProtocolError("Cursor continuation heartbeatMs must be less than semanticIdleMs");
  }
  if (semanticIdleMs > hardCapMs) {
    throw new CursorProtocolError("Cursor continuation semanticIdleMs must be no greater than hardCapMs");
  }
  return { heartbeatMs, semanticIdleMs, hardCapMs };
}
function installProcessCleanup() {
  const dispose = () => {
    try {
      sessionManager.dispose();
    } catch {
    }
  };
  process.once("exit", dispose);
  process.once("beforeExit", dispose);
}
var DEFAULT_CONTINUATION_POLICY, MAX_TIMER_MS2, DEFAULT_TOMBSTONE_TTL_MS, DEFAULT_TOMBSTONE_LIMIT, DEFAULT_MAX_OPEN_SESSIONS, SessionManager, sessionManager;
var init_session = __esm({
  "node_modules/cursor-opencode-provider/dist/session.js"() {
    init_debug();
    init_errors();
    init_activity();
    DEFAULT_CONTINUATION_POLICY = {
      semanticIdleMs: 12e4,
      hardCapMs: 6e5,
      heartbeatMs: 5e3
    };
    MAX_TIMER_MS2 = 2147483647;
    DEFAULT_TOMBSTONE_TTL_MS = 15 * 6e4;
    DEFAULT_TOMBSTONE_LIMIT = 1024;
    DEFAULT_MAX_OPEN_SESSIONS = 24;
    SessionManager = class {
      // Composite key `${sessionId}:${execId}` → owning session. Composite keying
      // means two Run streams that both register an execId of 1 (Cursor resets
      // counters per stream) coexist instead of overwriting each other.
      byExecId = /* @__PURE__ */ new Map();
      sessions = /* @__PURE__ */ new Set();
      // Most recently registered open session per OpenCode session id. A second
      // registration for the same id means the caller started a fresh Run instead
      // of continuing the held-open one — the prior entry is stale and superseded.
      byOpenCodeSessionId = /* @__PURE__ */ new Map();
      tombstones = /* @__PURE__ */ new Map();
      now;
      setTimer;
      clearTimer;
      activitySource;
      tombstoneTtlMs;
      tombstoneLimit;
      maxOpenSessions;
      constructor(options = {}) {
        this.now = options.now ?? Date.now;
        this.setTimer = options.setTimer ?? ((callback, delayMs) => setTimeout(callback, delayMs));
        this.clearTimer = options.clearTimer ?? ((timer) => clearTimeout(timer));
        this.activitySource = options.activitySource ?? sessionActivity;
        this.tombstoneTtlMs = positiveInteger("tombstoneTtlMs", options.tombstoneTtlMs, DEFAULT_TOMBSTONE_TTL_MS);
        this.tombstoneLimit = positiveInteger("tombstoneLimit", options.tombstoneLimit, DEFAULT_TOMBSTONE_LIMIT);
        this.maxOpenSessions = positiveInteger("maxOpenSessions", options.maxOpenSessions, DEFAULT_MAX_OPEN_SESSIONS);
      }
      registerSession(session) {
        if (session.closed)
          throw new CursorProtocolError("Cannot register a closed Cursor session");
        if (this.sessions.has(session))
          return;
        session.closed ??= false;
        session.closeError ??= null;
        session.pumpOwner ??= null;
        session.heartbeatCancel ??= null;
        session.hardDeadlineTimer ??= null;
        session.semanticDeadlineCancel ??= null;
        session.terminalUnsubscribe ??= null;
        session.deferredTerminalReason ??= null;
        session.policy ??= { ...DEFAULT_CONTINUATION_POLICY };
        session.createdAt ??= this.now();
        session.lastInboundAt ??= this.now();
        session.lastHeartbeatWriteAt ??= this.now();
        session.semanticDeadlineAt ??= this.now() + session.policy.semanticIdleMs;
        this.sessions.add(session);
        if (session.openCodeSessionId) {
          const prior = this.byOpenCodeSessionId.get(session.openCodeSessionId);
          if (prior && prior !== session && !prior.closed) {
            if (this.isPumping(prior)) {
              trace(`sessionManager.registerSession: openCodeSessionId=${session.openCodeSessionId} has a still-pumping prior session ${prior.sessionId} (pending=${prior.pending.size}) \u2014 leaving it to finish or expire naturally instead of interrupting it`);
            } else {
              trace(`sessionManager.registerSession: superseding stale session ${prior.sessionId} (openCodeSessionId=${session.openCodeSessionId}, pending=${prior.pending.size}) with new session ${session.sessionId}`);
              this.close(prior, "superseded-by-new-run");
            }
          }
          this.byOpenCodeSessionId.set(session.openCodeSessionId, session);
        }
        this.enforceOpenSessionCap(session);
        this.subscribeTerminal(session);
      }
      isPumping(session) {
        return session.pumpOwner != null || session.pumpActive;
      }
      /**
       * Force-close the oldest idle open session(s) once registration exceeds the
       * cap. Never closes a session with a live pull() mid-await (see the same
       * guard in the supersede check above) — an unclosable backlog of genuinely
       * active sessions just means the cap can't be enforced until one finishes.
       */
      enforceOpenSessionCap(justRegistered) {
        while (this.sessions.size > this.maxOpenSessions) {
          let oldest;
          for (const candidate of this.sessions) {
            if (candidate === justRegistered || this.isPumping(candidate))
              continue;
            if (!oldest || candidate.createdAt < oldest.createdAt)
              oldest = candidate;
          }
          if (!oldest) {
            trace(`sessionManager.registerSession: open session cap exceeded (${this.sessions.size} > ${this.maxOpenSessions}) but no idle session is available to close \u2014 all remaining sessions are actively pumping`);
            return;
          }
          trace(`sessionManager.registerSession: open session cap exceeded (${this.sessions.size} > ${this.maxOpenSessions}), force-closing oldest idle session ${oldest.sessionId} (openCodeSessionId=${oldest.openCodeSessionId ?? "-"}, ageMs=${this.now() - oldest.createdAt}, pending=${oldest.pending.size})`);
          this.close(oldest, "open-session-cap-exceeded");
        }
      }
      recordSemanticProgress(session, at) {
        if (session.closed)
          return;
        const now = at ?? this.now();
        session.lastInboundAt = now;
        session.semanticDeadlineAt = now + session.policy.semanticIdleMs;
      }
      recordHeartbeatWrite(session) {
        if (!session.closed)
          session.lastHeartbeatWriteAt = this.now();
      }
      /** Register that `session` is awaiting a result for `execId`. */
      registerPending(execId, session, resultField, toolName, bridged = false, resultMetadata) {
        this.registerSession(session);
        if (session.closed)
          throw new CursorProtocolError("Cannot register a pending exec on a closed Cursor session");
        const now = this.now();
        const key = this.key(session.sessionId, execId);
        this.tombstones.delete(key);
        session.pending.set(execId, {
          resultField,
          toolName,
          bridged,
          resultMetadata,
          state: "pending",
          registeredAt: now,
          hardDeadlineAt: now + session.policy.hardCapMs
        });
        this.byExecId.set(key, session);
        this.scheduleHardDeadline(session);
      }
      /** The pending exec info for an id on a specific session, if still awaiting it. */
      pendingFor(sessionId, execId) {
        return this.byExecId.get(this.key(sessionId, execId))?.pending.get(execId);
      }
      classify(sessionId, execId) {
        const key = this.key(sessionId, execId);
        const session = this.byExecId.get(key);
        if (session) {
          const pending3 = session.pending.get(execId);
          const legacyExpiresAt = session.expiresAt;
          if (!pending3 || session.closed || session.stream.isClosed() || typeof legacyExpiresAt === "number" && this.now() >= legacyExpiresAt) {
            this.byExecId.delete(key);
            if (!session.closed)
              this.close(session, "remote-clean-close");
          } else if (this.hardDeadlineExpired(session, pending3)) {
            this.close(session, "hard-cap-expired");
          } else if (pending3.state === "pending") {
            return { kind: "deliverable", session, pending: pending3 };
          } else if (pending3.state === "claimed") {
            return { kind: "duplicate", reason: "in-flight" };
          } else {
            return { kind: "duplicate", reason: "delivered" };
          }
        }
        const tombstone = this.getTombstone(key);
        if (!tombstone)
          return { kind: "missing", reason: "missing-process-local-state" };
        if (tombstone.reason === "delivered")
          return { kind: "duplicate", reason: "delivered" };
        return { kind: "terminal", reason: tombstone.reason };
      }
      claim(sessionId, execId) {
        const classification = this.classify(sessionId, execId);
        if (classification.kind !== "deliverable")
          return classification;
        classification.pending.state = "claimed";
        return {
          session: classification.session,
          execId,
          pending: classification.pending
        };
      }
      deliverClaim(claim, frames) {
        const { session, execId, pending: pending3 } = claim;
        const key = this.key(session.sessionId, execId);
        if (session.closed || this.byExecId.get(key) !== session || session.pending.get(execId) !== pending3) {
          const current = this.classify(session.sessionId, execId);
          if (current.kind === "duplicate")
            return { ...current, framesWritten: 0 };
          if (current.kind === "terminal")
            return { ...current, framesWritten: 0 };
          return { kind: "missing", reason: "missing-process-local-state", framesWritten: 0 };
        }
        if (pending3.state !== "claimed") {
          return {
            kind: "duplicate",
            reason: pending3.state === "delivered" ? "delivered" : "in-flight",
            framesWritten: 0
          };
        }
        if (this.hardDeadlineExpired(session, pending3)) {
          this.close(session, "hard-cap-expired");
          return { kind: "terminal", reason: "hard-cap-expired", framesWritten: 0 };
        }
        let framesWritten = 0;
        try {
          if (!pending3.bridged && frames.length === 0) {
            throw new CursorProtocolError("No result frames were produced");
          }
          for (const frame of frames) {
            session.stream.write(frame);
            framesWritten++;
          }
        } catch {
          const reason = framesWritten === 0 ? "result-write-failed" : "ambiguous-partial-write";
          this.close(session, reason);
          return { kind: "terminal", reason, framesWritten };
        }
        pending3.state = "delivered";
        this.putTombstone(key, "delivered");
        session.pending.delete(execId);
        this.byExecId.delete(key);
        if (session.pending.size === 0)
          this.recordSemanticProgress(session);
        this.scheduleHardDeadline(session);
        return { kind: "delivered", framesWritten };
      }
      /** Find the live session awaiting one of the given exec ids. */
      findByExecIds(sessionId, execIds) {
        for (const id of execIds) {
          const classification = this.classify(sessionId, id);
          if (classification.kind === "deliverable")
            return classification.session;
        }
        return void 0;
      }
      /** Mark an exec id as resolved (its result has been delivered). */
      resolve(sessionId, execId) {
        const k = this.key(sessionId, execId);
        const s = this.byExecId.get(k);
        if (s) {
          s.pending.delete(execId);
          this.putTombstone(k, "delivered");
          this.scheduleHardDeadline(s);
        }
        this.byExecId.delete(k);
      }
      beginPump(session, owner) {
        this.registerSession(session);
        if (session.pumpOwner && session.pumpOwner !== owner) {
          throw new CursorProtocolError("Cursor session already has an active pump");
        }
        session.pumpOwner = owner;
        session.pumpActive = true;
      }
      isPumpOwner(session, owner) {
        return !session.closed && session.pumpOwner === owner;
      }
      endPump(session, owner) {
        if (session.pumpOwner !== owner)
          return false;
        session.pumpOwner = null;
        session.pumpActive = false;
        const deferred = session.deferredTerminalReason;
        session.deferredTerminalReason = null;
        if (deferred)
          this.close(session, deferred);
        return true;
      }
      /**
       * Swap the live bidi Run while a pump is still pulling frames.
       * Callers must cancel the session heartbeat and wait for the old stream's
       * write chain before this, so an in-flight heartbeat cannot close the session.
       */
      replaceStream(session, next) {
        if (session.closed)
          throw new CursorProtocolError("Cannot replace stream on a closed Cursor session");
        session.heartbeatCancel?.();
        session.terminalUnsubscribe?.();
        session.terminalUnsubscribe = null;
        session.deferredTerminalReason = null;
        const old = session.stream;
        session.stream = next;
        session.frames = next.frames()[Symbol.asyncIterator]();
        this.subscribeTerminal(session);
        try {
          old.destroy();
        } catch {
        }
      }
      subscribeTerminal(session) {
        const boundStream = session.stream;
        const unsubscribe = boundStream.onTerminal?.((event) => {
          if (session.stream !== boundStream)
            return;
          this.onStreamTerminal(session, event);
        }) ?? (() => {
        });
        if (session.closed)
          unsubscribe();
        else
          session.terminalUnsubscribe = unsubscribe;
      }
      key(sessionId, execId) {
        return `${sessionId}:${execId}`;
      }
      close(session, reason = "ordinary-cleanup", error) {
        if (session.closed)
          return;
        session.closed = true;
        session.closeError = error ?? session.closeError ?? null;
        trace(`sessionManager.close: reason=${reason} pendingCount=${session.pending.size} blobs=${session.blobs.size}`);
        if (session.heartbeatCancel)
          session.heartbeatCancel();
        else if (session.heartbeat)
          clearInterval(session.heartbeat);
        session.heartbeat = null;
        session.heartbeatCancel = null;
        if (session.hardDeadlineTimer)
          this.clearTimer(session.hardDeadlineTimer);
        session.hardDeadlineTimer = null;
        session.semanticDeadlineCancel?.();
        session.semanticDeadlineCancel = null;
        session.terminalUnsubscribe?.();
        session.terminalUnsubscribe = null;
        session.deferredTerminalReason = null;
        for (const id of session.pending.keys()) {
          const key = this.key(session.sessionId, id);
          this.byExecId.delete(key);
          if (this.isTerminalReason(reason))
            this.putTombstone(key, reason);
        }
        session.pending.clear();
        session.pumpOwner = null;
        session.pumpActive = false;
        session.displayToolCalls?.clear();
        session.blobs?.clear();
        this.sessions.delete(session);
        if (session.openCodeSessionId && this.byOpenCodeSessionId.get(session.openCodeSessionId) === session) {
          this.byOpenCodeSessionId.delete(session.openCodeSessionId);
        }
        try {
          session.stream.destroy();
        } catch {
        }
      }
      /**
       * Close only if nothing is awaiting a tool result AND no pull() is actively
       * pumping this session. OpenCode aborts each doStream after finishReason
       * "tool-calls"; that abort must NOT tear down the Cursor Run stream.
       * Equally, a late cancel from the previous ReadableStream must not destroy
       * the session once the continuation has cleared pending and resumed pumping.
       * Returns true if the session was closed.
       */
      closeUnlessPending(session) {
        if (session.closed)
          return true;
        const pumpActive = this.isPumping(session);
        if (session.pending.size > 0 || pumpActive) {
          trace(`sessionManager.closeUnlessPending: KEEP open pendingCount=${session.pending.size} pumpActive=${pumpActive}`);
          return false;
        }
        this.close(session, "ordinary-cleanup");
        return true;
      }
      dispose() {
        for (const session of [...this.sessions])
          this.close(session, "process-disposed");
        this.byExecId.clear();
      }
      sweepHardDeadlines() {
        for (const session of [...this.sessions]) {
          if (!session.closed && [...session.pending.values()].some((pending3) => this.hardDeadlineExpired(session, pending3))) {
            this.close(session, "hard-cap-expired");
          }
        }
      }
      onStreamTerminal(session, event) {
        if (event.kind === "local-close" || session.closed)
          return;
        const reason = event.kind === "remote-error" ? "remote-error" : "remote-clean-close";
        if (event.kind === "remote-error")
          session.closeError = event.error;
        if (session.pumpOwner !== null) {
          session.deferredTerminalReason = reason;
          return;
        }
        this.close(session, reason, event.kind === "remote-error" ? event.error : void 0);
      }
      refreshHardDeadline(session, pending3) {
        if (!session.openCodeSessionId)
          return pending3.hardDeadlineAt;
        const activityAt = this.activitySource.lastActivityAt(session.openCodeSessionId);
        if (activityAt === void 0 || activityAt <= pending3.registeredAt)
          return pending3.hardDeadlineAt;
        const renewedDeadline = activityAt + session.policy.hardCapMs;
        if (renewedDeadline > pending3.hardDeadlineAt) {
          pending3.hardDeadlineAt = renewedDeadline;
          trace("continuation lease renewed from OpenCode session activity");
        }
        return pending3.hardDeadlineAt;
      }
      hardDeadlineExpired(session, pending3) {
        return this.now() >= this.refreshHardDeadline(session, pending3);
      }
      scheduleHardDeadline(session) {
        if (session.hardDeadlineTimer)
          this.clearTimer(session.hardDeadlineTimer);
        session.hardDeadlineTimer = null;
        if (session.closed || session.pending.size === 0)
          return;
        const earliest = Math.min(...[...session.pending.values()].map((pending3) => this.refreshHardDeadline(session, pending3)));
        const delayMs = Math.max(0, earliest - this.now());
        const timer = this.setTimer(() => {
          session.hardDeadlineTimer = null;
          if (session.closed)
            return;
          if ([...session.pending.values()].some((pending3) => this.hardDeadlineExpired(session, pending3))) {
            this.close(session, "hard-cap-expired");
          } else {
            this.scheduleHardDeadline(session);
          }
        }, delayMs);
        session.hardDeadlineTimer = timer;
        const unref = timer.unref;
        if (typeof unref === "function")
          unref.call(timer);
      }
      getTombstone(key) {
        const tombstone = this.tombstones.get(key);
        if (!tombstone)
          return void 0;
        if (this.now() >= tombstone.expiresAt) {
          this.tombstones.delete(key);
          return void 0;
        }
        return tombstone;
      }
      putTombstone(key, reason) {
        this.tombstones.delete(key);
        this.tombstones.set(key, {
          reason,
          expiresAt: this.now() + this.tombstoneTtlMs
        });
        while (this.tombstones.size > this.tombstoneLimit) {
          const oldest = this.tombstones.keys().next().value;
          if (oldest === void 0)
            break;
          this.tombstones.delete(oldest);
        }
      }
      isTerminalReason(reason) {
        return !["ordinary-cleanup", "turn-ended", "initial-write-failed"].includes(reason);
      }
    };
    sessionManager = new SessionManager();
    installProcessCleanup();
  }
});

// node_modules/cursor-opencode-provider/dist/protocol/thinking.js
function buildRequestedModelParams(variantParameters, options) {
  const params = variantParameters.map((p) => ({ ...p }));
  if (options?.reasoningEffort) {
    const effortIdx = params.findIndex((p) => p.id === "effort" || p.id === "reasoning");
    if (effortIdx >= 0) {
      params[effortIdx] = { ...params[effortIdx], value: options.reasoningEffort };
    }
  }
  return params;
}
var init_thinking = __esm({
  "node_modules/cursor-opencode-provider/dist/protocol/thinking.js"() {
  }
});

// node_modules/cursor-opencode-provider/dist/models.js
var models_exports = {};
__export(models_exports, {
  CURSOR_VARIANT_PARAMETERS_KEY: () => CURSOR_VARIANT_PARAMETERS_KEY,
  CURSOR_WIRE_MODEL_ID_KEY: () => CURSOR_WIRE_MODEL_ID_KEY,
  CursorVariantSelectionError: () => CursorVariantSelectionError,
  cacheFilePath: () => cacheFilePath,
  discoverModels: () => discoverModels,
  extractCursorVariantParameters: () => extractCursorVariantParameters,
  fetchModels: () => fetchModels,
  isCacheFresh: () => isCacheFresh2,
  mapAvailableModelsResponse: () => mapAvailableModelsResponse,
  normalizeModelCache: () => normalizeModelCache,
  normalizeModelParameterValues: () => normalizeModelParameterValues,
  paramsImplyMaxMode: () => paramsImplyMaxMode,
  parseCursorContextLimit: () => parseCursorContextLimit,
  readCache: () => readCache,
  refreshModelCache: () => refreshModelCache,
  resolveCursorWireModelId: () => resolveCursorWireModelId,
  resolveVariantMaxMode: () => resolveVariantMaxMode,
  resolveVariantParameters: () => resolveVariantParameters,
  writeCache: () => writeCache
});
import { mkdir as mkdir2, readFile as readFile5, rename as rename2, unlink as unlink2, writeFile as writeFile2 } from "node:fs/promises";
import path19 from "node:path";
function isPlainRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function optionalString(record, names) {
  for (const name14 of names) {
    if (!Object.hasOwn(record, name14))
      continue;
    if (record[name14] === void 0)
      return void 0;
    return typeof record[name14] === "string" ? record[name14] : null;
  }
  return void 0;
}
function optionalBoolean(record, names) {
  for (const name14 of names) {
    if (!Object.hasOwn(record, name14))
      continue;
    if (record[name14] === void 0)
      return void 0;
    return typeof record[name14] === "boolean" ? record[name14] : null;
  }
  return void 0;
}
function optionalPositiveNumber(record, names) {
  for (const name14 of names) {
    if (!Object.hasOwn(record, name14))
      continue;
    const value = record[name14];
    if (value === void 0)
      return void 0;
    return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
  }
  return void 0;
}
function normalizeModelParameterValues(value) {
  if (!Array.isArray(value))
    return null;
  const parameters = [];
  for (const parameter of value) {
    if (!isPlainRecord(parameter))
      return null;
    if (!isNonEmptyString(parameter.id) || typeof parameter.value !== "string")
      return null;
    parameters.push({ id: parameter.id, value: parameter.value });
  }
  return parameters;
}
function normalizeVariant(value, fallbackName) {
  if (!isPlainRecord(value))
    return null;
  const parameters = normalizeModelParameterValues(value.parameterValues ?? value.parameter_values ?? []);
  if (!parameters)
    return null;
  const key = optionalString(value, ["key"]);
  const displayName = optionalString(value, ["displayName", "display_name"]);
  const isDefaultNonMax = optionalBoolean(value, ["isDefaultNonMax", "isDefaultNonMaxConfig", "is_default_non_max_config"]);
  const isDefaultMax = optionalBoolean(value, ["isDefaultMax", "isDefaultMaxConfig", "is_default_max_config"]);
  if (key === null || displayName === null || isDefaultNonMax === null || isDefaultMax === null) {
    return null;
  }
  if (key !== void 0 && !isNonEmptyString(key) || displayName !== void 0 && !isNonEmptyString(displayName)) {
    return null;
  }
  return {
    key: key ?? fallbackName,
    displayName: displayName ?? fallbackName,
    parameterValues: parameters,
    isDefaultNonMax: isDefaultNonMax ?? false,
    isDefaultMax: isDefaultMax ?? false
  };
}
function normalizeModelInfo(value) {
  if (!isPlainRecord(value) || !isNonEmptyString(value.id))
    return null;
  const rawVariants = value.variants ?? [];
  if (!Array.isArray(rawVariants))
    return null;
  const variants = rawVariants.map((variant) => normalizeVariant(variant, value.id));
  if (variants.some((variant) => variant === null))
    return null;
  const displayName = optionalString(value, ["displayName", "display_name"]);
  const family = optionalString(value, ["family"]);
  const supportsThinking = optionalBoolean(value, ["supportsThinking", "supports_thinking"]);
  const supportsAgent = optionalBoolean(value, ["supportsAgent", "supports_agent"]);
  const supportsImages = optionalBoolean(value, ["supportsImages", "supports_images"]);
  const supportsMaxMode = optionalBoolean(value, ["supportsMaxMode", "supports_max_mode"]);
  const maxContext = optionalPositiveNumber(value, ["maxContext", "contextTokenLimit", "context_token_limit"]);
  const maxContextForMaxMode = optionalPositiveNumber(value, ["maxContextForMaxMode", "contextTokenLimitForMaxMode", "context_token_limit_for_max_mode"]);
  if (displayName === null || family === null || supportsThinking === null || supportsAgent === null || supportsImages === null || supportsMaxMode === null || maxContext === null || maxContextForMaxMode === null) {
    return null;
  }
  return {
    id: value.id,
    ...displayName === void 0 ? {} : { displayName },
    ...family === void 0 ? {} : { family },
    ...supportsThinking === void 0 ? {} : { supportsThinking },
    ...supportsAgent === void 0 ? {} : { supportsAgent },
    ...supportsImages === void 0 ? {} : { supportsImages },
    ...maxContext === void 0 ? {} : { maxContext },
    ...maxContextForMaxMode === void 0 ? {} : { maxContextForMaxMode },
    ...supportsMaxMode === void 0 ? {} : { supportsMaxMode },
    variants
  };
}
function normalizeModelCache(value) {
  if (!isPlainRecord(value) || !Array.isArray(value.models))
    return null;
  if (typeof value.fetchedAt !== "number" || !Number.isFinite(value.fetchedAt))
    return null;
  if (value.schemaVersion !== void 0 && (!Number.isSafeInteger(value.schemaVersion) || value.schemaVersion < 0)) {
    return null;
  }
  const models = value.models.map(normalizeModelInfo);
  if (models.some((model) => model === null))
    return null;
  return {
    models,
    fetchedAt: value.fetchedAt,
    ...value.schemaVersion === void 0 ? {} : { schemaVersion: value.schemaVersion }
  };
}
function extractCursorVariantParameters(providerOptions) {
  if (!providerOptions || !Object.hasOwn(providerOptions, CURSOR_VARIANT_PARAMETERS_KEY)) {
    return void 0;
  }
  const params = normalizeModelParameterValues(providerOptions[CURSOR_VARIANT_PARAMETERS_KEY]);
  if (!params) {
    throw new CursorVariantSelectionError("is malformed: cursorVariantParameters must be a parameter array");
  }
  return params;
}
function resolveCursorWireModelId(providerOptions, fallback) {
  const value = providerOptions?.[CURSOR_WIRE_MODEL_ID_KEY];
  return typeof value === "string" && value.trim() ? value : fallback;
}
function paramsImplyMaxMode(params) {
  return params.some((parameter) => parameter.id === "context" && parseCursorContextLimit(parameter.value) === 1e6);
}
function resolveVariantMaxMode(params, opts = {}) {
  return paramsImplyMaxMode(params) || opts.picked === void 0 && opts.maxMode === true;
}
function parseCursorContextLimit(value) {
  if (typeof value !== "string")
    return void 0;
  const text = value.trim();
  const match = /^(\d+(?:\.\d+)?)\s*([km])$/i.exec(text);
  if (match) {
    const multiplier = match[2].toLowerCase() === "k" ? 1e3 : 1e6;
    const limit = Number(match[1]) * multiplier;
    return Number.isSafeInteger(limit) && limit > 0 ? limit : void 0;
  }
  const numeric = Number(text);
  return Number.isSafeInteger(numeric) && numeric > 0 ? numeric : void 0;
}
function variantContextTokens(v) {
  const raw = v?.parameterValues.find((p) => p.id === "context")?.value;
  return parseCursorContextLimit(raw);
}
function isLongContextVariant(v) {
  return variantContextTokens(v) === 1e6;
}
function positiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : void 0;
}
function isCacheFresh2(cache, ttlMs = MODEL_CACHE_TTL_MS) {
  if (cache.schemaVersion !== MODEL_CACHE_SCHEMA_VERSION)
    return false;
  return Date.now() - cache.fetchedAt < ttlMs;
}
function cacheFilePath(cacheDir) {
  return path19.join(cacheDir, MODEL_CACHE_FILE);
}
async function readCache(cacheDir) {
  const filePath = cacheFilePath(cacheDir);
  try {
    const data = await readFile5(filePath, "utf-8");
    return normalizeModelCache(JSON.parse(data));
  } catch {
    return null;
  }
}
async function writeCache(cacheDir, cache) {
  const normalized = normalizeModelCache(cache);
  if (!normalized)
    throw new Error("Refusing to write an invalid Cursor model cache");
  const filePath = cacheFilePath(cacheDir);
  const directory = path19.dirname(filePath);
  const tempPath = path19.join(directory, `.${MODEL_CACHE_FILE}.${process.pid}.${crypto.randomUUID()}.tmp`);
  await mkdir2(directory, { recursive: true });
  try {
    await writeFile2(tempPath, JSON.stringify(normalized, null, 2), "utf-8");
    await rename2(tempPath, filePath);
  } finally {
    await unlink2(tempPath).catch(() => {
    });
  }
}
function apiBoolean(record, names) {
  const value = optionalBoolean(record, names);
  if (value === null)
    throw new Error(`AvailableModels returned a non-boolean ${names[0]}`);
  return value ?? false;
}
function mapAvailableModelsResponse(raw) {
  const entries = raw.models ?? [];
  const models = [];
  for (const entry of entries) {
    if (!isPlainRecord(entry))
      continue;
    const e = entry;
    const name14 = e.name;
    if (!isNonEmptyString(name14))
      continue;
    const variants = [];
    const rawVariants = e.variants ?? [];
    if (!Array.isArray(rawVariants)) {
      throw new Error(`AvailableModels returned invalid variants for ${name14}`);
    }
    for (const v of rawVariants) {
      if (!isPlainRecord(v)) {
        throw new Error(`AvailableModels returned an invalid variant for ${name14}`);
      }
      const rawParams = v.parameterValues ?? v.parameter_values ?? [];
      const parameterValues = normalizeModelParameterValues(rawParams);
      if (!parameterValues) {
        throw new Error(`AvailableModels returned invalid parameter values for ${name14}`);
      }
      variants.push({
        key: name14,
        parameterValues,
        displayName: v.displayName ?? v.display_name ?? name14,
        isDefaultNonMax: apiBoolean(v, ["isDefaultNonMaxConfig", "is_default_non_max_config"]),
        isDefaultMax: apiBoolean(v, ["isDefaultMaxConfig", "is_default_max_config"])
      });
    }
    const variantBaseContext = variantContextTokens(variants.find((v) => v.isDefaultNonMax)) ?? variantContextTokens(variants.find((v) => variantContextTokens(v) !== 1e6)) ?? variantContextTokens(variants.find((v) => v.parameterValues.some((p) => p.id === "context")));
    const variantMaxContext = variantContextTokens(variants.find((v) => v.isDefaultMax));
    const supportsImages = optionalBoolean(e, ["supportsImages", "supports_images"]);
    if (supportsImages === null) {
      throw new Error(`AvailableModels returned invalid supportsImages for ${name14}`);
    }
    models.push({
      id: name14,
      displayName: e.clientDisplayName ?? e.client_display_name ?? name14,
      supportsThinking: apiBoolean(e, ["supportsThinking", "supports_thinking"]),
      supportsAgent: apiBoolean(e, ["supportsAgent", "supports_agent"]),
      ...supportsImages === void 0 ? {} : { supportsImages },
      maxContext: variantBaseContext ?? positiveNumber(e.contextTokenLimit ?? e.context_token_limit),
      maxContextForMaxMode: variantMaxContext ?? positiveNumber(e.contextTokenLimitForMaxMode ?? e.context_token_limit_for_max_mode),
      supportsMaxMode: apiBoolean(e, ["supportsMaxMode", "supports_max_mode"]),
      variants
    });
  }
  return models;
}
function resolveVariantParameters(model, opts = {}) {
  const picked = opts.picked?.map((p) => ({ ...p }));
  if (!model || model.variants.length === 0) {
    if (picked !== void 0) {
      throw new CursorVariantSelectionError(`is stale: model ${JSON.stringify(model?.id ?? "unknown")} has no cached variants`);
    }
    return opts.reasoningEffort ? [{ id: "effort", value: opts.reasoningEffort }] : [];
  }
  const effortOf = (v) => v.parameterValues.find((p) => p.id === "effort" || p.id === "reasoning")?.value;
  const isFast = (v) => v.parameterValues.find((p) => p.id === "fast")?.value === "true";
  const isMaxVariant = (v) => v.isDefaultMax || isLongContextVariant(v);
  const wantMax = opts.maxMode ?? false;
  const pool = model.variants.filter((v) => !isFast(v));
  const scoped = pool.length > 0 ? pool : model.variants;
  if (picked !== void 0) {
    const pickedById = new Map(picked.map((parameter) => [parameter.id, parameter.value]));
    const exact = model.variants.find((v) => v.parameterValues.length === picked.length && pickedById.size === picked.length && v.parameterValues.every((parameter) => pickedById.get(parameter.id) === parameter.value));
    if (exact) {
      return buildRequestedModelParams(exact.parameterValues);
    }
    throw new CursorVariantSelectionError(`is stale for model ${JSON.stringify(model.id)}: its exact parameter tuple is unavailable`);
  }
  const maxScoped = wantMax ? scoped.filter(isMaxVariant) : [];
  const effortPool = maxScoped.length > 0 ? maxScoped : scoped;
  if (opts.reasoningEffort) {
    const match = effortPool.find((v) => effortOf(v) === opts.reasoningEffort);
    if (match) {
      return buildRequestedModelParams(match.parameterValues, {
        reasoningEffort: opts.reasoningEffort,
        maxMode: wantMax
      });
    }
  }
  if (wantMax) {
    const max = scoped.find((v) => v.isDefaultMax) ?? scoped.find(isLongContextVariant);
    if (max)
      return buildRequestedModelParams(max.parameterValues, { maxMode: true });
  }
  const byDefault = scoped.find((v) => v.isDefaultNonMax) ?? scoped[0];
  return buildRequestedModelParams(byDefault.parameterValues, {
    reasoningEffort: opts.reasoningEffort,
    maxMode: false
  });
}
async function fetchModels(token, options = {}) {
  const raw = await unaryAvailableModels(token, options);
  return mapAvailableModelsResponse(raw);
}
async function refreshModelCache(cacheDir, fetcher) {
  const key = path19.resolve(cacheDir);
  const existing = refreshesByDirectory.get(key);
  if (existing)
    return existing;
  const refresh = (async () => {
    const models = await fetcher();
    await writeCache(cacheDir, {
      models,
      fetchedAt: Date.now(),
      schemaVersion: MODEL_CACHE_SCHEMA_VERSION
    });
    return models;
  })();
  refreshesByDirectory.set(key, refresh);
  try {
    return await refresh;
  } finally {
    if (refreshesByDirectory.get(key) === refresh)
      refreshesByDirectory.delete(key);
  }
}
async function discoverModels(token, cacheDir, options = {}) {
  const cached = await readCache(cacheDir);
  const refresh = () => refreshModelCache(cacheDir, () => fetchModels(token, options));
  if (cached && isCacheFresh2(cached)) {
    void refresh().catch(() => {
    });
    return cached.models;
  }
  if (cached) {
    try {
      return await refresh();
    } catch {
      return cached.models;
    }
  }
  return refresh();
}
var CURSOR_VARIANT_PARAMETERS_KEY, CURSOR_WIRE_MODEL_ID_KEY, CursorVariantSelectionError, refreshesByDirectory;
var init_models = __esm({
  "node_modules/cursor-opencode-provider/dist/models.js"() {
    init_shared();
    init_connect();
    init_thinking();
    CURSOR_VARIANT_PARAMETERS_KEY = "cursorVariantParameters";
    CURSOR_WIRE_MODEL_ID_KEY = "cursorModelId";
    CursorVariantSelectionError = class extends Error {
      constructor(message) {
        super(`Cursor variant selection ${message}`);
        this.name = "CursorVariantSelectionError";
      }
    };
    refreshesByDirectory = /* @__PURE__ */ new Map();
  }
});

// node_modules/cursor-opencode-provider/dist/agent-url.js
import { createHash as createHash4 } from "node:crypto";
function normalizeApiBaseURL(baseURL) {
  if (!baseURL)
    return DEFAULT_API_BASE;
  return new URL(baseURL).origin;
}
function resolveCacheKey(token, options) {
  const tokenHash = createHash4("sha256").update(token).digest("hex").slice(0, 16);
  return `${tokenHash}|${normalizeApiBaseURL(options.apiBaseURL ?? options.baseURL)}|telem:${options.telemetryEnabled === true}`;
}
async function resolveAgentUrl(token, options = {}) {
  const cacheKey = resolveCacheKey(token, options);
  const memo = _resolved.get(cacheKey);
  if (memo) {
    trace(`agent-url: reuse in-process memo \u2192 ${memo}`);
    return memo;
  }
  const inflight = _inflight.get(cacheKey);
  if (inflight) {
    trace("agent-url: awaiting in-flight GetServerConfig");
    return inflight;
  }
  const promise = (async () => {
    try {
      const url = await fetchAgentUrl(token, options);
      _resolved.set(cacheKey, url);
      trace(`agent-url: resolved via GetServerConfig \u2192 ${url}`);
      return url;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      trace(`agent-url: GetServerConfig failed (${reason}); no fallback agent host will be used`);
      throw err;
    } finally {
      _inflight.delete(cacheKey);
    }
  })();
  _inflight.set(cacheKey, promise);
  return promise;
}
var DEFAULT_API_BASE, _resolved, _inflight;
var init_agent_url = __esm({
  "node_modules/cursor-opencode-provider/dist/agent-url.js"() {
    init_connect();
    init_debug();
    init_shared();
    DEFAULT_API_BASE = `https://${CURSOR_API_HOST}`;
    _resolved = /* @__PURE__ */ new Map();
    _inflight = /* @__PURE__ */ new Map();
  }
});

// node_modules/cursor-opencode-provider/dist/compaction-marker.js
function isCompactionSession(sessionID) {
  return typeof sessionID === "string" && compactionSessions.has(sessionID);
}
var compactionSessions;
var init_compaction_marker = __esm({
  "node_modules/cursor-opencode-provider/dist/compaction-marker.js"() {
    compactionSessions = /* @__PURE__ */ new Set();
  }
});

// node_modules/cursor-opencode-provider/dist/session-directory.js
function getSessionDirectory(sessionID) {
  return typeof sessionID === "string" ? sessionDirectories.get(sessionID) : void 0;
}
var sessionDirectories;
var init_session_directory = __esm({
  "node_modules/cursor-opencode-provider/dist/session-directory.js"() {
    sessionDirectories = /* @__PURE__ */ new Map();
  }
});

// node_modules/@ai-sdk/provider/dist/index.mjs
function getErrorMessage(error) {
  if (error == null) {
    return "unknown error";
  }
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return JSON.stringify(error);
}
var marker, symbol, _a, _b, AISDKError, name, marker2, symbol2, _a2, _b2, APICallError, name2, marker3, symbol3, _a3, _b3, EmptyResponseBodyError, name3, marker4, symbol4, _a4, _b4, InvalidArgumentError, name4, marker5, symbol5, _a5, _b5, InvalidPromptError, name5, marker6, symbol6, _a6, _b6, InvalidResponseDataError, name6, marker7, symbol7, _a7, _b7, JSONParseError, name7, marker8, symbol8, _a8, _b8, LoadAPIKeyError, name8, marker9, symbol9, _a9, _b9, LoadSettingError, name9, marker10, symbol10, _a10, _b10, NoContentGeneratedError, name10, marker11, symbol11, _a11, _b11, NoSuchModelError, name11, marker12, symbol12, _a12, _b12, TooManyEmbeddingValuesForCallError, name12, marker13, symbol13, _a13, _b13, TypeValidationError, name13, marker14, symbol14, _a14, _b14, UnsupportedFunctionalityError;
var init_dist = __esm({
  "node_modules/@ai-sdk/provider/dist/index.mjs"() {
    marker = "vercel.ai.error";
    symbol = Symbol.for(marker);
    AISDKError = class _AISDKError extends (_b = Error, _a = symbol, _b) {
      /**
       * Creates an AI SDK Error.
       *
       * @param {Object} params - The parameters for creating the error.
       * @param {string} params.name - The name of the error.
       * @param {string} params.message - The error message.
       * @param {unknown} [params.cause] - The underlying cause of the error.
       */
      constructor({
        name: name14,
        message,
        cause
      }) {
        super(message);
        this[_a] = true;
        this.name = name14;
        this.cause = cause;
      }
      /**
       * Checks if the given error is an AI SDK Error.
       * @param {unknown} error - The error to check.
       * @returns {boolean} True if the error is an AI SDK Error, false otherwise.
       */
      static isInstance(error) {
        return _AISDKError.hasMarker(error, marker);
      }
      static hasMarker(error, marker15) {
        const markerSymbol = Symbol.for(marker15);
        return error != null && typeof error === "object" && markerSymbol in error && typeof error[markerSymbol] === "boolean" && error[markerSymbol] === true;
      }
    };
    name = "AI_APICallError";
    marker2 = `vercel.ai.error.${name}`;
    symbol2 = Symbol.for(marker2);
    APICallError = class extends (_b2 = AISDKError, _a2 = symbol2, _b2) {
      constructor({
        message,
        url,
        requestBodyValues,
        statusCode,
        responseHeaders,
        responseBody,
        cause,
        isRetryable = statusCode != null && (statusCode === 408 || // request timeout
        statusCode === 409 || // conflict
        statusCode === 429 || // too many requests
        statusCode >= 500),
        // server error
        data
      }) {
        super({ name, message, cause });
        this[_a2] = true;
        this.url = url;
        this.requestBodyValues = requestBodyValues;
        this.statusCode = statusCode;
        this.responseHeaders = responseHeaders;
        this.responseBody = responseBody;
        this.isRetryable = isRetryable;
        this.data = data;
      }
      static isInstance(error) {
        return AISDKError.hasMarker(error, marker2);
      }
    };
    name2 = "AI_EmptyResponseBodyError";
    marker3 = `vercel.ai.error.${name2}`;
    symbol3 = Symbol.for(marker3);
    EmptyResponseBodyError = class extends (_b3 = AISDKError, _a3 = symbol3, _b3) {
      // used in isInstance
      constructor({ message = "Empty response body" } = {}) {
        super({ name: name2, message });
        this[_a3] = true;
      }
      static isInstance(error) {
        return AISDKError.hasMarker(error, marker3);
      }
    };
    name3 = "AI_InvalidArgumentError";
    marker4 = `vercel.ai.error.${name3}`;
    symbol4 = Symbol.for(marker4);
    InvalidArgumentError = class extends (_b4 = AISDKError, _a4 = symbol4, _b4) {
      constructor({
        message,
        cause,
        argument
      }) {
        super({ name: name3, message, cause });
        this[_a4] = true;
        this.argument = argument;
      }
      static isInstance(error) {
        return AISDKError.hasMarker(error, marker4);
      }
    };
    name4 = "AI_InvalidPromptError";
    marker5 = `vercel.ai.error.${name4}`;
    symbol5 = Symbol.for(marker5);
    InvalidPromptError = class extends (_b5 = AISDKError, _a5 = symbol5, _b5) {
      constructor({
        prompt,
        message,
        cause
      }) {
        super({ name: name4, message: `Invalid prompt: ${message}`, cause });
        this[_a5] = true;
        this.prompt = prompt;
      }
      static isInstance(error) {
        return AISDKError.hasMarker(error, marker5);
      }
    };
    name5 = "AI_InvalidResponseDataError";
    marker6 = `vercel.ai.error.${name5}`;
    symbol6 = Symbol.for(marker6);
    InvalidResponseDataError = class extends (_b6 = AISDKError, _a6 = symbol6, _b6) {
      constructor({
        data,
        message = `Invalid response data: ${JSON.stringify(data)}.`
      }) {
        super({ name: name5, message });
        this[_a6] = true;
        this.data = data;
      }
      static isInstance(error) {
        return AISDKError.hasMarker(error, marker6);
      }
    };
    name6 = "AI_JSONParseError";
    marker7 = `vercel.ai.error.${name6}`;
    symbol7 = Symbol.for(marker7);
    JSONParseError = class extends (_b7 = AISDKError, _a7 = symbol7, _b7) {
      constructor({ text, cause }) {
        super({
          name: name6,
          message: `JSON parsing failed: Text: ${text}.
Error message: ${getErrorMessage(cause)}`,
          cause
        });
        this[_a7] = true;
        this.text = text;
      }
      static isInstance(error) {
        return AISDKError.hasMarker(error, marker7);
      }
    };
    name7 = "AI_LoadAPIKeyError";
    marker8 = `vercel.ai.error.${name7}`;
    symbol8 = Symbol.for(marker8);
    LoadAPIKeyError = class extends (_b8 = AISDKError, _a8 = symbol8, _b8) {
      // used in isInstance
      constructor({ message }) {
        super({ name: name7, message });
        this[_a8] = true;
      }
      static isInstance(error) {
        return AISDKError.hasMarker(error, marker8);
      }
    };
    name8 = "AI_LoadSettingError";
    marker9 = `vercel.ai.error.${name8}`;
    symbol9 = Symbol.for(marker9);
    LoadSettingError = class extends (_b9 = AISDKError, _a9 = symbol9, _b9) {
      // used in isInstance
      constructor({ message }) {
        super({ name: name8, message });
        this[_a9] = true;
      }
      static isInstance(error) {
        return AISDKError.hasMarker(error, marker9);
      }
    };
    name9 = "AI_NoContentGeneratedError";
    marker10 = `vercel.ai.error.${name9}`;
    symbol10 = Symbol.for(marker10);
    NoContentGeneratedError = class extends (_b10 = AISDKError, _a10 = symbol10, _b10) {
      // used in isInstance
      constructor({
        message = "No content generated."
      } = {}) {
        super({ name: name9, message });
        this[_a10] = true;
      }
      static isInstance(error) {
        return AISDKError.hasMarker(error, marker10);
      }
    };
    name10 = "AI_NoSuchModelError";
    marker11 = `vercel.ai.error.${name10}`;
    symbol11 = Symbol.for(marker11);
    NoSuchModelError = class extends (_b11 = AISDKError, _a11 = symbol11, _b11) {
      constructor({
        errorName = name10,
        modelId,
        modelType,
        message = `No such ${modelType}: ${modelId}`
      }) {
        super({ name: errorName, message });
        this[_a11] = true;
        this.modelId = modelId;
        this.modelType = modelType;
      }
      static isInstance(error) {
        return AISDKError.hasMarker(error, marker11);
      }
    };
    name11 = "AI_TooManyEmbeddingValuesForCallError";
    marker12 = `vercel.ai.error.${name11}`;
    symbol12 = Symbol.for(marker12);
    TooManyEmbeddingValuesForCallError = class extends (_b12 = AISDKError, _a12 = symbol12, _b12) {
      constructor(options) {
        super({
          name: name11,
          message: `Too many values for a single embedding call. The ${options.provider} model "${options.modelId}" can only embed up to ${options.maxEmbeddingsPerCall} values per call, but ${options.values.length} values were provided.`
        });
        this[_a12] = true;
        this.provider = options.provider;
        this.modelId = options.modelId;
        this.maxEmbeddingsPerCall = options.maxEmbeddingsPerCall;
        this.values = options.values;
      }
      static isInstance(error) {
        return AISDKError.hasMarker(error, marker12);
      }
    };
    name12 = "AI_TypeValidationError";
    marker13 = `vercel.ai.error.${name12}`;
    symbol13 = Symbol.for(marker13);
    TypeValidationError = class _TypeValidationError extends (_b13 = AISDKError, _a13 = symbol13, _b13) {
      constructor({
        value,
        cause,
        context
      }) {
        let contextPrefix = "Type validation failed";
        if (context == null ? void 0 : context.field) {
          contextPrefix += ` for ${context.field}`;
        }
        if ((context == null ? void 0 : context.entityName) || (context == null ? void 0 : context.entityId)) {
          contextPrefix += " (";
          const parts = [];
          if (context.entityName) {
            parts.push(context.entityName);
          }
          if (context.entityId) {
            parts.push(`id: "${context.entityId}"`);
          }
          contextPrefix += parts.join(", ");
          contextPrefix += ")";
        }
        super({
          name: name12,
          message: `${contextPrefix}: Value: ${JSON.stringify(value)}.
Error message: ${getErrorMessage(cause)}`,
          cause
        });
        this[_a13] = true;
        this.value = value;
        this.context = context;
      }
      static isInstance(error) {
        return AISDKError.hasMarker(error, marker13);
      }
      /**
       * Wraps an error into a TypeValidationError.
       * If the cause is already a TypeValidationError with the same value and context, it returns the cause.
       * Otherwise, it creates a new TypeValidationError.
       *
       * @param {Object} params - The parameters for wrapping the error.
       * @param {unknown} params.value - The value that failed validation.
       * @param {unknown} params.cause - The original error or cause of the validation failure.
       * @param {TypeValidationContext} params.context - Optional context about what is being validated.
       * @returns {TypeValidationError} A TypeValidationError instance.
       */
      static wrap({
        value,
        cause,
        context
      }) {
        var _a15, _b15, _c;
        if (_TypeValidationError.isInstance(cause) && cause.value === value && ((_a15 = cause.context) == null ? void 0 : _a15.field) === (context == null ? void 0 : context.field) && ((_b15 = cause.context) == null ? void 0 : _b15.entityName) === (context == null ? void 0 : context.entityName) && ((_c = cause.context) == null ? void 0 : _c.entityId) === (context == null ? void 0 : context.entityId)) {
          return cause;
        }
        return new _TypeValidationError({ value, cause, context });
      }
    };
    name13 = "AI_UnsupportedFunctionalityError";
    marker14 = `vercel.ai.error.${name13}`;
    symbol14 = Symbol.for(marker14);
    UnsupportedFunctionalityError = class extends (_b14 = AISDKError, _a14 = symbol14, _b14) {
      constructor({
        functionality,
        message = `'${functionality}' functionality not supported.`
      }) {
        super({ name: name13, message });
        this[_a14] = true;
        this.functionality = functionality;
      }
      static isInstance(error) {
        return AISDKError.hasMarker(error, marker14);
      }
    };
  }
});

// node_modules/cursor-opencode-provider/dist/image-input.js
import { createHash as createHash5 } from "node:crypto";
import { readFile as readFile6, stat as stat6 } from "node:fs/promises";
import path20 from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
function hasCursorUserImages(lastUser) {
  return !!lastUser && Array.isArray(lastUser.content) && lastUser.content.some((part) => {
    if (!part || typeof part !== "object")
      return false;
    const file = part;
    return file.type === "file" && typeof file.mediaType === "string" && file.mediaType.startsWith("image/");
  });
}
function unsupported(functionality, message) {
  throw new UnsupportedFunctionalityError({ functionality, message });
}
function assertCursorUserImageSupport(lastUser, supportsImages, modelId) {
  if (!hasCursorUserImages(lastUser) || supportsImages)
    return;
  unsupported("image input", `Cursor model ${JSON.stringify(modelId)} does not support image input`);
}
function decodeBase64(value) {
  const normalized = value.replace(/\s/g, "");
  if (!normalized || !/^[A-Za-z0-9+/_-]*={0,2}$/.test(normalized)) {
    return unsupported("image input", "Cursor provider received invalid base64 image data");
  }
  const data = Uint8Array.from(Buffer.from(normalized, "base64"));
  if (data.length === 0) {
    return unsupported("image input", "Cursor provider received an empty image");
  }
  return data;
}
function decodeDataUrl(value) {
  if (!value.startsWith("data:")) {
    return unsupported("image input", "Cursor provider supports base64-encoded image data URLs only");
  }
  const commaIndex = value.indexOf(",", 5);
  if (commaIndex < 0) {
    return unsupported("image input", "Cursor provider supports base64-encoded image data URLs only");
  }
  const metadata = value.slice(5, commaIndex);
  const finalSeparator = metadata.lastIndexOf(";");
  if (finalSeparator < 0 || metadata.slice(finalSeparator + 1) !== "base64") {
    return unsupported("image input", "Cursor provider supports base64-encoded image data URLs only");
  }
  const firstSeparator = metadata.indexOf(";");
  const mimeType = metadata.slice(0, firstSeparator);
  return {
    data: decodeBase64(value.slice(commaIndex + 1)),
    mimeType: mimeType || void 0
  };
}
function inferImageMimeType(data) {
  if (data.length >= 8 && data[0] === 137 && data[1] === 80 && data[2] === 78 && data[3] === 71 && data[4] === 13 && data[5] === 10 && data[6] === 26 && data[7] === 10)
    return "image/png";
  if (data.length >= 3 && data[0] === 255 && data[1] === 216 && data[2] === 255) {
    return "image/jpeg";
  }
  if (data.length >= 6) {
    const header2 = Buffer.from(data.subarray(0, 6)).toString("ascii");
    if (header2 === "GIF87a" || header2 === "GIF89a")
      return "image/gif";
  }
  if (data.length >= 12 && Buffer.from(data.subarray(0, 4)).toString("ascii") === "RIFF" && Buffer.from(data.subarray(8, 12)).toString("ascii") === "WEBP")
    return "image/webp";
  return void 0;
}
function assertImageSize(size, remaining) {
  if (size > remaining) {
    unsupported("image input", `Cursor provider image attachments exceed the ${MAX_CURSOR_IMAGE_INPUT_BYTES / 1024 / 1024} MiB limit`);
  }
}
function cursorImageBudget(value) {
  if (!Number.isFinite(value))
    return MAX_CURSOR_IMAGE_INPUT_BYTES;
  return Math.min(MAX_CURSOR_IMAGE_INPUT_BYTES, Math.max(0, Math.floor(value)));
}
function imageContentHash(data) {
  return createHash5("sha256").update(data).digest("hex");
}
async function readResponseBytes(response, remaining) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > remaining) {
    assertImageSize(declaredLength, remaining);
  }
  if (!response.body) {
    const data2 = new Uint8Array(await response.arrayBuffer());
    assertImageSize(data2.length, remaining);
    return data2;
  }
  const chunks = [];
  let total = 0;
  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      total += value.length;
      if (total > remaining) {
        await reader.cancel();
        assertImageSize(total, remaining);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const data = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.length;
  }
  return data;
}
async function resolveImageData(value, remaining, signal) {
  if (value instanceof Uint8Array)
    return { data: Uint8Array.from(value) };
  if (typeof value === "string") {
    return value.startsWith("data:") ? decodeDataUrl(value) : { data: decodeBase64(value) };
  }
  if (value.protocol === "data:")
    return decodeDataUrl(value.href);
  if (value.protocol === "file:") {
    const filePath = fileURLToPath2(value);
    const info = await stat6(filePath);
    assertImageSize(info.size, remaining);
    return { data: Uint8Array.from(await readFile6(filePath)), filename: path20.basename(filePath) };
  }
  if (value.protocol !== "http:" && value.protocol !== "https:") {
    return unsupported("image URL input", `Cursor provider does not support image URL protocol ${JSON.stringify(value.protocol)}`);
  }
  const response = await fetch(value, { signal });
  if (!response.ok) {
    return unsupported("image URL input", `Cursor provider could not fetch image URL (HTTP ${response.status})`);
  }
  return {
    data: await readResponseBytes(response, remaining),
    mimeType: response.headers.get("content-type")?.split(";", 1)[0]?.trim() || void 0,
    filename: path20.basename(value.pathname) || void 0
  };
}
async function decodeCursorImagePart(file, remaining, signal, defaultFilename, resolveLimit = remaining) {
  if (typeof file.mediaType !== "string" || !file.mediaType.startsWith("image/")) {
    return unsupported("file input", `Cursor provider supports image attachments only, not ${JSON.stringify(file.mediaType)}`);
  }
  if (!(file.data instanceof Uint8Array) && typeof file.data !== "string" && !(file.data instanceof URL)) {
    return unsupported("image input", "Cursor provider received an invalid image data value");
  }
  const resolved = await resolveImageData(file.data, resolveLimit, signal);
  assertImageSize(resolved.data.length, remaining);
  const declaredMimeType = file.mediaType;
  const mimeType = declaredMimeType === "image/*" ? resolved.mimeType?.startsWith("image/") ? resolved.mimeType : inferImageMimeType(resolved.data) : declaredMimeType;
  if (!mimeType?.startsWith("image/") || mimeType === "image/*") {
    return unsupported("image input", "Cursor provider could not determine the image media type");
  }
  return {
    data: resolved.data,
    filename: (typeof file.filename === "string" && file.filename ? path20.basename(file.filename) : void 0) ?? resolved.filename ?? defaultFilename,
    mimeType
  };
}
async function extractCursorUserImages(lastUser, signal, maxBytes = MAX_CURSOR_IMAGE_INPUT_BYTES) {
  if (!lastUser || !Array.isArray(lastUser.content))
    return [];
  const byteBudget = cursorImageBudget(maxBytes);
  const images = [];
  let totalBytes = 0;
  for (const part of lastUser.content) {
    if (!part || typeof part !== "object")
      continue;
    const file = part;
    if (file.type !== "file")
      continue;
    const image = await decodeCursorImagePart(file, byteBudget - totalBytes, signal, `image-${images.length + 1}`);
    totalBytes += image.data.length;
    images.push(image);
  }
  return images;
}
function cursorHistoryImageParts(prompt) {
  const parts = [];
  for (const message of prompt) {
    if (!message || typeof message !== "object")
      continue;
    const record = message;
    if (!Array.isArray(record.content))
      continue;
    if (record.role === "assistant") {
      for (const part of record.content) {
        if (!part || typeof part !== "object")
          continue;
        const file = part;
        if (file.type === "file" && typeof file.mediaType === "string" && file.mediaType.startsWith("image/"))
          parts.push(file);
      }
      continue;
    }
    if (record.role !== "tool")
      continue;
    for (const part of record.content) {
      if (!part || typeof part !== "object")
        continue;
      const toolResult = part;
      if (toolResult.type !== "tool-result" || !toolResult.output || typeof toolResult.output !== "object") {
        continue;
      }
      const output = toolResult.output;
      if (output.type !== "content" || !Array.isArray(output.value))
        continue;
      for (const value of output.value) {
        if (!value || typeof value !== "object")
          continue;
        const file = value;
        if (file.type === "file-data" && typeof file.mediaType === "string" && file.mediaType.startsWith("image/"))
          parts.push(file);
      }
    }
  }
  return parts;
}
async function extractCursorHistoryImages(prompt, options) {
  const candidates = cursorHistoryImageParts(prompt);
  if (!options.supportsImages) {
    return { images: [], hashes: [], candidateCount: candidates.length, duplicateCount: 0 };
  }
  const maxBytes = cursorImageBudget(options.maxBytes ?? MAX_CURSOR_IMAGE_INPUT_BYTES);
  const images = [];
  const hashes = [];
  const hashesThisTurn = /* @__PURE__ */ new Set();
  let duplicateCount = 0;
  let totalBytes = 0;
  for (const file of candidates) {
    const image = await decodeCursorImagePart(file, MAX_CURSOR_IMAGE_INPUT_BYTES, options.signal, `image-${(options.filenameOffset ?? 0) + images.length + 1}`, MAX_CURSOR_IMAGE_INPUT_BYTES);
    const hash = imageContentHash(image.data);
    if (options.seenHashes?.has(hash) || hashesThisTurn.has(hash)) {
      duplicateCount++;
      continue;
    }
    assertImageSize(image.data.length, maxBytes - totalBytes);
    totalBytes += image.data.length;
    images.push(image);
    hashes.push(hash);
    hashesThisTurn.add(hash);
  }
  return { images, hashes, candidateCount: candidates.length, duplicateCount };
}
async function extractCursorPromptImages(prompt, lastUser, options) {
  const maxBytes = cursorImageBudget(options.maxBytes ?? MAX_CURSOR_IMAGE_INPUT_BYTES);
  const userImages = await extractCursorUserImages(lastUser, options.signal, maxBytes);
  const userBytes = userImages.reduce((total, image) => total + image.data.length, 0);
  const history = await extractCursorHistoryImages(prompt, {
    supportsImages: options.supportsImages,
    seenHashes: options.seenHistoryHashes,
    signal: options.signal,
    maxBytes: maxBytes - userBytes,
    filenameOffset: userImages.length
  });
  return {
    ...history,
    images: [...userImages, ...history.images],
    userImageCount: userImages.length
  };
}
var MAX_CURSOR_IMAGE_INPUT_BYTES;
var init_image_input = __esm({
  "node_modules/cursor-opencode-provider/dist/image-input.js"() {
    init_dist();
    MAX_CURSOR_IMAGE_INPUT_BYTES = 20 * 1024 * 1024;
  }
});

// node_modules/cursor-opencode-provider/dist/pricing-data.js
var CURSOR_MODEL_COSTS, CURSOR_MODEL_CONTEXTS, CURSOR_MODEL_CAPABILITIES;
var init_pricing_data = __esm({
  "node_modules/cursor-opencode-provider/dist/pricing-data.js"() {
    CURSOR_MODEL_COSTS = {
      "claude-fable-5": {
        "input": 10,
        "output": 50,
        "cache_read": 1,
        "cache_write": 12.5
      },
      "claude-fable-5-1": {
        "input": 10,
        "output": 50,
        "cache_read": 0.25,
        "cache_write": 12.5
      },
      "claude-haiku-4-5": {
        "input": 1,
        "output": 5,
        "cache_read": 0.1,
        "cache_write": 1.25
      },
      "claude-opus-4-5": {
        "input": 5,
        "output": 25,
        "cache_read": 0.5,
        "cache_write": 6.25
      },
      "claude-opus-4-6": {
        "input": 5,
        "output": 25,
        "cache_read": 0.5,
        "cache_write": 6.25
      },
      "claude-opus-4-7": {
        "input": 5,
        "output": 25,
        "cache_read": 0.5,
        "cache_write": 6.25
      },
      "claude-opus-4-8": {
        "input": 5,
        "output": 25,
        "cache_read": 0.5,
        "cache_write": 6.25
      },
      "claude-opus-5": {
        "input": 5,
        "output": 25,
        "cache_read": 0.5,
        "cache_write": 6.25
      },
      "claude-sonnet-4": {
        "input": 3,
        "output": 15,
        "cache_read": 0.3,
        "cache_write": 3.75,
        "context_over_200k": {
          "input": 6,
          "output": 22.5,
          "cache_read": 0.6,
          "cache_write": 7.5
        }
      },
      "claude-sonnet-4-5": {
        "input": 3,
        "output": 15,
        "cache_read": 0.3,
        "cache_write": 3.75
      },
      "claude-sonnet-4-6": {
        "input": 3,
        "output": 15,
        "cache_read": 0.3,
        "cache_write": 3.75
      },
      "claude-sonnet-5": {
        "input": 2,
        "output": 10,
        "cache_read": 0.2,
        "cache_write": 2.5
      },
      "composer-2.5": {
        "input": 0.5,
        "output": 2.5,
        "cache_read": 0.2
      },
      "composer-2.5-fast": {
        "input": 3,
        "output": 15,
        "cache_read": 0.5
      },
      "gemini-2.5-flash": {
        "input": 0.3,
        "output": 2.5,
        "cache_read": 0.03
      },
      "gemini-3-flash": {
        "input": 0.5,
        "output": 3,
        "cache_read": 0.05
      },
      "gemini-3.1-pro": {
        "input": 2,
        "output": 12,
        "cache_read": 0.2
      },
      "gemini-3.5-flash": {
        "input": 1.5,
        "output": 9,
        "cache_read": 0.15
      },
      "gemini-3.6-flash": {
        "input": 1.5,
        "output": 7.5,
        "cache_read": 0.15
      },
      "gemini-3.7-flash": {
        "input": 0.75,
        "output": 3.5,
        "cache_read": 0.075
      },
      "gemini-3.8-flash": {
        "input": 0.75,
        "output": 3.5,
        "cache_read": 0.075
      },
      "glm-5.2": {
        "input": 1.4,
        "output": 4.4,
        "cache_read": 0.26
      },
      "gpt-5-mini": {
        "input": 0.25,
        "output": 2,
        "cache_read": 0.025
      },
      "gpt-5.1": {
        "input": 1.25,
        "output": 10,
        "cache_read": 0.125
      },
      "gpt-5.2": {
        "input": 1.75,
        "output": 14,
        "cache_read": 0.175
      },
      "gpt-5.3-codex": {
        "input": 1.75,
        "output": 14,
        "cache_read": 0.175
      },
      "gpt-5.4": {
        "input": 2.5,
        "output": 15,
        "cache_read": 0.25,
        "context_over_200k": {
          "input": 5,
          "output": 15,
          "cache_read": 0.5
        }
      },
      "gpt-5.4-mini": {
        "input": 0.75,
        "output": 4.5,
        "cache_read": 0.075
      },
      "gpt-5.4-nano": {
        "input": 0.2,
        "output": 1.25,
        "cache_read": 0.02
      },
      "gpt-5.5": {
        "input": 5,
        "output": 30,
        "cache_read": 0.5,
        "context_over_200k": {
          "input": 10,
          "output": 30,
          "cache_read": 1
        }
      },
      "gpt-5.6-luna": {
        "input": 0.2,
        "output": 1.2,
        "cache_read": 0.02,
        "cache_write": 0.25,
        "context_over_200k": {
          "input": 0.4,
          "output": 1.2,
          "cache_read": 0.04,
          "cache_write": 0.5
        }
      },
      "gpt-5.6-sol": {
        "input": 4,
        "output": 20,
        "cache_read": 0.4,
        "cache_write": 5,
        "context_over_200k": {
          "input": 8,
          "output": 20,
          "cache_read": 0.8,
          "cache_write": 10
        }
      },
      "gpt-5.6-terra": {
        "input": 2,
        "output": 12,
        "cache_read": 0.2,
        "cache_write": 2.5,
        "context_over_200k": {
          "input": 4,
          "output": 12,
          "cache_read": 0.4,
          "cache_write": 5
        }
      },
      "grok-4.5": {
        "input": 2,
        "output": 6,
        "cache_read": 0.5
      },
      "grok-4.5-fast": {
        "input": 4,
        "output": 18,
        "cache_read": 1
      },
      "grok-4.6": {
        "input": 2,
        "output": 6,
        "cache_read": 0.5
      },
      "grok-4.6-fast": {
        "input": 4,
        "output": 12,
        "cache_read": 1
      },
      "kimi-k2.7-code": {
        "input": 0.95,
        "output": 4,
        "cache_read": 0.19
      },
      "kimi-k3": {
        "input": 3,
        "output": 15,
        "cache_read": 0.3
      },
      "muse-spark-1.3": {
        "input": 1.25,
        "output": 4.25,
        "cache_read": 0.15
      }
    };
    CURSOR_MODEL_CONTEXTS = {
      "claude-fable-5": {
        "maxContext": 3e5,
        "maxContextForMaxMode": 1e6
      },
      "claude-fable-5-1": {
        "maxContext": 3e5,
        "maxContextForMaxMode": 1e6
      },
      "claude-haiku-4-5": {
        "maxContext": 2e5
      },
      "claude-opus-4-5": {
        "maxContext": 2e5,
        "maxContextForMaxMode": 2e5
      },
      "claude-opus-4-6": {
        "maxContext": 2e5,
        "maxContextForMaxMode": 1e6
      },
      "claude-opus-4-7": {
        "maxContext": 3e5,
        "maxContextForMaxMode": 1e6
      },
      "claude-opus-4-8": {
        "maxContext": 3e5,
        "maxContextForMaxMode": 1e6
      },
      "claude-opus-5": {
        "maxContext": 3e5,
        "maxContextForMaxMode": 1e6
      },
      "claude-sonnet-4": {
        "maxContext": 2e5,
        "maxContextForMaxMode": 1e6
      },
      "claude-sonnet-4-5": {
        "maxContext": 2e5,
        "maxContextForMaxMode": 1e6
      },
      "claude-sonnet-4-6": {
        "maxContext": 2e5,
        "maxContextForMaxMode": 1e6
      },
      "claude-sonnet-5": {
        "maxContext": 2e5,
        "maxContextForMaxMode": 1e6
      },
      "composer-2.5": {
        "maxContext": 2e5
      },
      "gemini-2.5-flash": {
        "maxContext": 2e5,
        "maxContextForMaxMode": 1e6
      },
      "gemini-3-flash": {
        "maxContext": 2e5,
        "maxContextForMaxMode": 1e6
      },
      "gemini-3.1-pro": {
        "maxContext": 2e5,
        "maxContextForMaxMode": 1e6
      },
      "gemini-3.5-flash": {
        "maxContext": 2e5,
        "maxContextForMaxMode": 1e6
      },
      "gemini-3.6-flash": {
        "maxContext": 2e5,
        "maxContextForMaxMode": 1e6
      },
      "gemini-3.7-flash": {
        "maxContext": 2e5,
        "maxContextForMaxMode": 1e6
      },
      "gemini-3.8-flash": {
        "maxContext": 2e5,
        "maxContextForMaxMode": 1e6
      },
      "glm-5.2": {
        "maxContext": 2e5
      },
      "gpt-5-mini": {
        "maxContext": 272e3
      },
      "gpt-5.1": {
        "maxContext": 272e3
      },
      "gpt-5.2": {
        "maxContext": 272e3
      },
      "gpt-5.3-codex": {
        "maxContext": 272e3
      },
      "gpt-5.4": {
        "maxContext": 272e3,
        "maxContextForMaxMode": 1e6
      },
      "gpt-5.4-mini": {
        "maxContext": 272e3
      },
      "gpt-5.4-nano": {
        "maxContext": 272e3
      },
      "gpt-5.5": {
        "maxContext": 272e3,
        "maxContextForMaxMode": 1e6
      },
      "gpt-5.6-luna": {
        "maxContext": 272e3,
        "maxContextForMaxMode": 1e6
      },
      "gpt-5.6-sol": {
        "maxContext": 272e3,
        "maxContextForMaxMode": 1e6
      },
      "gpt-5.6-terra": {
        "maxContext": 272e3,
        "maxContextForMaxMode": 1e6
      },
      "grok-4.5": {
        "maxContext": 256e3
      },
      "grok-4.6": {
        "maxContext": 256e3
      },
      "kimi-k2.7-code": {
        "maxContext": 262e3
      },
      "kimi-k3": {
        "maxContext": 2e5,
        "maxContextForMaxMode": 1e6
      },
      "muse-spark-1.3": {
        "maxContext": 3e5,
        "maxContextForMaxMode": 1e6
      }
    };
    CURSOR_MODEL_CAPABILITIES = {
      "claude-fable-5": {
        "supportsImages": true
      },
      "claude-fable-5-1": {
        "supportsImages": true
      },
      "claude-haiku-4-5": {
        "supportsImages": true
      },
      "claude-opus-4-5": {
        "supportsImages": true
      },
      "claude-opus-4-6": {
        "supportsImages": true
      },
      "claude-opus-4-7": {
        "supportsImages": true
      },
      "claude-opus-4-8": {
        "supportsImages": true
      },
      "claude-opus-5": {
        "supportsImages": true
      },
      "claude-sonnet-4": {
        "supportsImages": true
      },
      "claude-sonnet-4-5": {
        "supportsImages": true
      },
      "claude-sonnet-4-6": {
        "supportsImages": true
      },
      "claude-sonnet-5": {
        "supportsImages": true
      },
      "composer-2.5": {
        "supportsImages": true
      },
      "gemini-2.5-flash": {
        "supportsImages": true
      },
      "gemini-3-flash": {
        "supportsImages": true
      },
      "gemini-3.1-pro": {
        "supportsImages": true
      },
      "gemini-3.5-flash": {
        "supportsImages": true
      },
      "gemini-3.6-flash": {
        "supportsImages": true
      },
      "gemini-3.7-flash": {
        "supportsImages": true
      },
      "gemini-3.8-flash": {
        "supportsImages": true
      },
      "glm-5.2": {
        "supportsImages": false
      },
      "gpt-5-mini": {
        "supportsImages": true
      },
      "gpt-5.1": {
        "supportsImages": true
      },
      "gpt-5.2": {
        "supportsImages": true
      },
      "gpt-5.3-codex": {
        "supportsImages": true
      },
      "gpt-5.4": {
        "supportsImages": true
      },
      "gpt-5.4-mini": {
        "supportsImages": true
      },
      "gpt-5.4-nano": {
        "supportsImages": true
      },
      "gpt-5.5": {
        "supportsImages": true
      },
      "gpt-5.6-luna": {
        "supportsImages": true
      },
      "gpt-5.6-sol": {
        "supportsImages": true
      },
      "gpt-5.6-terra": {
        "supportsImages": true
      },
      "grok-4.5": {
        "supportsImages": false
      },
      "grok-4.6": {
        "supportsImages": false
      },
      "kimi-k2.7-code": {
        "supportsImages": true
      },
      "kimi-k3": {
        "supportsImages": true
      },
      "muse-spark-1.3": {
        "supportsImages": true
      }
    };
  }
});

// node_modules/cursor-opencode-provider/dist/model-metadata.js
function getDocumentedCursorModelContext(modelId) {
  const context = CURSOR_MODEL_CONTEXTS[modelId];
  return context ? { ...context } : void 0;
}
function getDocumentedCursorModelCapabilities(modelId) {
  const capabilities = CURSOR_MODEL_CAPABILITIES[modelId];
  return capabilities ? { ...capabilities } : void 0;
}
function resolveCursorModelSupportsImages(modelId, availableModelsValue) {
  return availableModelsValue ?? getDocumentedCursorModelCapabilities(modelId)?.supportsImages ?? false;
}
var init_model_metadata = __esm({
  "node_modules/cursor-opencode-provider/dist/model-metadata.js"() {
    init_pricing_data();
  }
});

// node_modules/cursor-opencode-provider/dist/replay-safety.js
function nestedFields(topLevel, field) {
  if (topLevel?.fn !== field || topLevel.wt !== 2 || !topLevel.bytes)
    return [];
  return readAllFieldsStrict(topLevel.bytes) ?? [];
}
function analyzeExecWire(topLevel) {
  const variants = nestedFields(topLevel, 2).filter((field) => ![1, 15, 19].includes(field.fn));
  const exactVariant = (field) => variants.length === 1 && variants[0].fn === field && variants[0].wt === 2;
  return {
    exactRequestContext: exactVariant(10),
    exactMcpState: exactVariant(36)
  };
}
function validKvWire(topLevel) {
  const variants = nestedFields(topLevel, 4).filter((field) => field.fn !== 1);
  const variant = variants.length === 1 ? variants[0] : void 0;
  const args = variant?.wt === 2 && variant.bytes ? readAllFieldsStrict(variant.bytes) ?? [] : [];
  const blobIds = args.filter((field) => field.fn === 1 && field.wt === 2 && (field.bytes?.length ?? 0) > 0);
  return !!variant && [2, 3].includes(variant.fn) && variant.wt === 2 && blobIds.length === 1 && args.every((field) => field.wt === 2 && (field.fn === 1 || variant.fn === 3 && field.fn === 2));
}
function validInteractionUpdateWire(topLevel, decoded) {
  if (!decoded)
    return true;
  const fields = nestedFields(topLevel, 1);
  const update = fields.length === 1 ? fields[0] : void 0;
  if (!update || update.wt !== 2 || !INTERACTION_UPDATE_FIELDS.has(update.fn))
    return false;
  if (![1, 4].includes(update.fn))
    return true;
  const delta = update.bytes ? readAllFieldsStrict(update.bytes) ?? [] : [];
  return delta.length === 1 && delta[0].fn === 1 && delta[0].wt === 2;
}
function validInteractionQueryWire(topLevel, decoded) {
  if (!decoded)
    return true;
  const fields = nestedFields(topLevel, 7);
  const ids = fields.filter((field) => field.fn === 1);
  const variants = fields.filter((field) => field.fn !== 1);
  return ids.length <= 1 && ids.every((field) => field.wt === 0) && variants.length === 1 && variants[0].wt === 2 && INTERACTION_QUERY_FIELDS.has(variants[0].fn);
}
function decodedMatchesWire(topLevel, decoded) {
  return !(topLevel?.fn === 1 && !decoded.interactionUpdate || topLevel?.fn === 2 && !decoded.exec || topLevel?.fn === 4 && !decoded.kv || topLevel?.fn === 5 && !decoded.execControl || topLevel?.fn === 7 && !decoded.interactionQuery);
}
function hasSemanticProgress(decoded) {
  const update = decoded.interactionUpdate;
  const text = update?.text_delta?.text;
  const thinking = update?.thinking_delta?.text;
  return typeof text === "string" && text.length > 0 || typeof thinking === "string" && thinking.length > 0 || !!update?.turn_ended || !!update?.tool_call_started || !!update?.tool_call_completed || !!decoded.exec || !!decoded.kv || !!decoded.execControl || !!decoded.interactionQuery || !!decoded.checkpointBytes?.length;
}
function analyzeReplayFrame(payload, decoded) {
  const topLevelFields = readAllFieldsStrict(payload) ?? [];
  const topLevel = topLevelFields.length === 1 ? topLevelFields[0] : void 0;
  const exec = analyzeExecWire(topLevel);
  const validKv = validKvWire(topLevel);
  const malformed = !topLevel || topLevel.wt !== 2 || !TOP_LEVEL_FIELDS.has(topLevel.fn) || !validInteractionUpdateWire(topLevel, decoded.interactionUpdate) || !validInteractionQueryWire(topLevel, decoded.interactionQuery) || !decodedMatchesWire(topLevel, decoded) || !!decoded.execControl;
  let barrier;
  if (decoded.interactionUpdate?.tool_call_started || decoded.interactionUpdate?.tool_call_completed) {
    barrier = "display-tool-lifecycle";
  } else if (malformed || topLevel.fn === 4 && !validKv) {
    barrier = "unknown-or-malformed-frame";
  } else if (topLevel.fn === 2 && !exec.exactRequestContext && !exec.exactMcpState) {
    barrier = "non-control-exec";
  }
  return {
    semanticProgress: hasSemanticProgress(decoded),
    barrier
  };
}
var AttemptReplaySafety, INTERACTION_UPDATE_FIELDS, INTERACTION_QUERY_FIELDS, TOP_LEVEL_FIELDS;
var init_replay_safety = __esm({
  "node_modules/cursor-opencode-provider/dist/replay-safety.js"() {
    init_debug();
    init_struct();
    AttemptReplaySafety = class {
      sessionId;
      barrierReason;
      constructor(sessionId) {
        this.sessionId = sessionId;
      }
      markBarrier(reason) {
        if (this.barrierReason)
          return;
        this.barrierReason = reason;
        trace(`replay barrier: reason=${reason} sessionId=${this.sessionId}`);
      }
      applyTo(failure) {
        failure.replaySafe = this.barrierReason === void 0 && failure.replaySafe;
        if (this.barrierReason) {
          trace(`replay suppressed: reason=${this.barrierReason} sessionId=${this.sessionId}`);
        }
        return failure;
      }
    };
    INTERACTION_UPDATE_FIELDS = /* @__PURE__ */ new Set([1, 2, 3, 4, 7, 13, 14, 16, 17]);
    INTERACTION_QUERY_FIELDS = /* @__PURE__ */ new Set([2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14]);
    TOP_LEVEL_FIELDS = /* @__PURE__ */ new Set([1, 2, 3, 4, 5, 7]);
  }
});

// node_modules/cursor-opencode-provider/dist/usage.js
function turnEndedCounter(te, key) {
  const value = te[key];
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.trunc(value) : 0;
}
function cursorUsageCountersFromTurnEnded(te) {
  return {
    inputTokens: turnEndedCounter(te, "input_tokens"),
    outputTokens: turnEndedCounter(te, "output_tokens"),
    cacheRead: turnEndedCounter(te, "cache_read"),
    cacheWrite: turnEndedCounter(te, "cache_write"),
    reasoningTokens: turnEndedCounter(te, "reasoning_tokens")
  };
}
function buildLanguageModelV3UsageFromCounters(counters, options = {}) {
  const rawInput = Math.max(0, Math.trunc(counters.inputTokens));
  const rawOutput = Math.max(0, Math.trunc(counters.outputTokens));
  const rawCacheRead = Math.min(Math.max(0, Math.trunc(counters.cacheRead)), rawInput);
  const rawCacheWrite = Math.min(Math.max(0, Math.trunc(counters.cacheWrite)), rawInput - rawCacheRead);
  const rawReasoning = Math.min(Math.max(0, Math.trunc(counters.reasoningTokens)), rawOutput);
  const contextTotal = options.contextTotalTokens;
  const hasContextTotal = typeof contextTotal === "number" && Number.isFinite(contextTotal) && contextTotal >= 0;
  const total = hasContextTotal ? Math.trunc(contextTotal) : rawInput + rawOutput;
  const output = Math.min(rawOutput, total);
  const input2 = Math.max(0, total - output);
  const proportionalRead = rawInput > 0 ? Math.min(input2, Math.round(input2 * rawCacheRead / rawInput)) : 0;
  const priorContext = options.priorContextTokens;
  const prefixRead = typeof priorContext === "number" && Number.isFinite(priorContext) && priorContext > 0 && rawCacheRead >= priorContext ? Math.min(input2, Math.trunc(priorContext)) : 0;
  const cacheRead = Math.min(input2, Math.max(proportionalRead, prefixRead));
  const cacheWrite = rawInput > 0 ? Math.min(input2 - cacheRead, Math.round(input2 * rawCacheWrite / rawInput)) : 0;
  const reasoning = rawOutput > 0 ? Math.min(output, Math.round(output * rawReasoning / rawOutput)) : 0;
  return {
    inputTokens: {
      total: input2,
      noCache: Math.max(input2 - cacheRead - cacheWrite, 0),
      cacheRead,
      cacheWrite
    },
    outputTokens: {
      total: output,
      text: Math.max(output - reasoning, 0),
      reasoning
    }
  };
}
function usageCount(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.trunc(value) : 0;
}
function usageRatio(part, total) {
  return total > 0 ? `${(part / total * 100).toFixed(1)}%` : "n/a";
}
function categoryTokens(details) {
  return new Map(details?.breakdown?.categories.map((category) => [
    category.id || category.label || "(unnamed)",
    category.estimatedTokens
  ]) ?? []);
}
function formatCursorTokenCategories(details) {
  const categories = Object.fromEntries(categoryTokens(details));
  return Object.keys(categories).length > 0 ? JSON.stringify(categories) : "unavailable";
}
function formatCursorCacheDiagnostics(counters, current, prior, stats) {
  const rawInput = Math.max(0, Math.trunc(counters.inputTokens));
  const rawRead = Math.min(rawInput, Math.max(0, Math.trunc(counters.cacheRead)));
  const rawWrite = Math.min(rawInput - rawRead, Math.max(0, Math.trunc(counters.cacheWrite)));
  const rawUncached = Math.max(0, rawInput - rawRead - rawWrite);
  const priorCategories = categoryTokens(prior);
  const currentCategories = categoryTokens(current);
  const categoriesComparable = !!prior?.breakdown && !!current?.breakdown;
  const categoryDelta = {};
  let sameSizedCategoryTokens = 0;
  if (categoriesComparable) {
    for (const id of /* @__PURE__ */ new Set([...priorCategories.keys(), ...currentCategories.keys()])) {
      const before = priorCategories.get(id);
      const after = currentCategories.get(id);
      if (before === void 0)
        categoryDelta[id] = "new";
      else if (after === void 0)
        categoryDelta[id] = "removed";
      else {
        categoryDelta[id] = after - before;
        if (after === before)
          sameSizedCategoryTokens += after;
      }
    }
  }
  const continuity = stats.startedWithCheckpoint ? prior ? "warm" : "checkpoint-without-token-details" : "cold";
  const contextDelta = current && prior ? current.usedTokens - prior.usedTokens : void 0;
  return [
    "cache diagnosis:",
    `sessionKey=${stats.sessionKey ?? "-"}`,
    `conversationId=${stats.conversationId}`,
    `conversationGroupId=${stats.conversationGroupId ?? "-"}`,
    `model=${stats.modelId ?? "-"}`,
    `continuity=${continuity}`,
    `rawInput=${rawInput}`,
    `rawCacheRead=${rawRead}`,
    `rawCacheWrite=${rawWrite}`,
    `rawUncached=${rawUncached}`,
    `rawReadRatio=${usageRatio(rawRead, rawInput)}`,
    `rawWriteRatio=${usageRatio(rawWrite, rawInput)}`,
    `priorContext=${prior?.usedTokens ?? "unavailable"}`,
    `currentContext=${current?.usedTokens ?? "unavailable"}`,
    `contextDelta=${contextDelta ?? "unavailable"}`,
    `rawReadVsPriorContext=${prior ? usageRatio(rawRead, prior.usedTokens) : "n/a"}`,
    `sameSizedCategoryTokens=${categoriesComparable ? sameSizedCategoryTokens : "unavailable"}`,
    `categoryDelta=${categoriesComparable && Object.keys(categoryDelta).length > 0 ? JSON.stringify(categoryDelta) : "unavailable"}`,
    `requestContext=${stats.requestContextReused ? "reused" : "built"}`,
    `requestContextHash=${stats.requestContextHash.slice(0, 16)}`,
    `systemPromptHash=${stats.systemPromptHash?.slice(0, 16) ?? "none"}`,
    `systemPromptSent=${!stats.startedWithCheckpoint}`,
    `checkpointUpdates=${stats.checkpointUpdates}`,
    `tokenDetailUpdates=${stats.tokenDetailUpdates}`,
    `pumpPasses=${stats.pumpPasses}`,
    `steps=${stats.stepStarts}/${stats.stepCompletes}`,
    `displayToolCalls=${stats.displayToolCalls}`,
    `execRequests=${stats.execRequests}`,
    "perModelCallCache=unavailable"
  ].join(" ");
}
function formatTurnUsageValidation(counters, usage, tokenDetails, contextSource) {
  const input2 = usageCount(usage.inputTokens.total);
  const noCache = usageCount(usage.inputTokens.noCache);
  const cacheRead = usageCount(usage.inputTokens.cacheRead);
  const cacheWrite = usageCount(usage.inputTokens.cacheWrite);
  const inputParts = noCache + cacheRead + cacheWrite;
  const output = usageCount(usage.outputTokens.total);
  const text = usageCount(usage.outputTokens.text);
  const reasoning = usageCount(usage.outputTokens.reasoning);
  const outputParts = text + reasoning;
  const sentTotal = input2 + output;
  const projectedOpenCodeTotal = inputParts + outputParts;
  const rawTotal = counters.inputTokens + counters.outputTokens;
  const cursor = tokenDetails ? `${tokenDetails.usedTokens}/${tokenDetails.maxTokens}(${usageRatio(tokenDetails.usedTokens, tokenDetails.maxTokens)})` : "unavailable";
  const totalMatch = tokenDetails ? String(sentTotal === tokenDetails.usedTokens) : "unavailable";
  const breakdown = tokenDetails?.breakdown;
  const categorySum = breakdown?.categories.reduce((sum, category) => sum + category.estimatedTokens, 0);
  const breakdownMatch = breakdown && categorySum !== void 0 ? breakdown.totalUsedTokens === tokenDetails.usedTokens && categorySum === breakdown.totalUsedTokens : void 0;
  const rawCached = counters.cacheRead + counters.cacheWrite;
  const sentCached = cacheRead + cacheWrite;
  const proportionalCached = counters.inputTokens > 0 && input2 > 0 ? Math.round(input2 * rawCached / counters.inputTokens) : 0;
  const cacheRatioMatch = tokenDetails ? counters.inputTokens > 0 && input2 > 0 ? Math.abs(rawCached / counters.inputTokens - sentCached / input2) <= 1 / input2 || sentCached >= proportionalCached && sentCached <= input2 : rawCached === 0 && sentCached === 0 : void 0;
  const status = input2 === inputParts && output === outputParts && projectedOpenCodeTotal === sentTotal && (cacheRatioMatch ?? true) && (!tokenDetails || sentTotal === tokenDetails.usedTokens) && (breakdownMatch ?? true) ? "ok" : "mismatch";
  return [
    "turn usage validation:",
    `status=${status}`,
    `source=${tokenDetails ? contextSource ?? "checkpoint-current-run" : "unavailable"}`,
    `cursor=${cursor}`,
    `rawTotal=${rawTotal}`,
    `sentTotal=${sentTotal}`,
    `totalMatch=${totalMatch}`,
    `input=${input2}`,
    `inputParts=${inputParts}`,
    `inputMatch=${input2 === inputParts}`,
    `output=${output}`,
    `outputParts=${outputParts}`,
    `outputMatch=${output === outputParts}`,
    `opencodeProjectedTotal=${projectedOpenCodeTotal}`,
    `opencodeMatch=${projectedOpenCodeTotal === sentTotal}`,
    `breakdownTotal=${breakdown?.totalUsedTokens ?? "unavailable"}`,
    `categorySum=${categorySum ?? "unavailable"}`,
    `breakdownMatch=${breakdownMatch ?? "unavailable"}`,
    `rawCachedRatio=${usageRatio(rawCached, counters.inputTokens)}`,
    `sentCachedRatio=${usageRatio(sentCached, input2)}`,
    `cacheRatioMatch=${cacheRatioMatch ?? "unavailable"}`
  ].join(" ");
}
function emptyLanguageModelV3Usage() {
  return buildLanguageModelV3UsageFromCounters({
    inputTokens: 0,
    outputTokens: 0,
    cacheRead: 0,
    cacheWrite: 0,
    reasoningTokens: 0
  });
}
function occupancyUsageFromTokenDetails(details, prior) {
  const used = Math.max(0, Math.trunc(details.usedTokens));
  if (used <= 0)
    return emptyLanguageModelV3Usage();
  return buildLanguageModelV3UsageFromCounters({
    inputTokens: used,
    outputTokens: 1,
    cacheRead: prior?.usedTokens ?? 0,
    cacheWrite: 0,
    reasoningTokens: 0
  }, {
    contextTotalTokens: used,
    priorContextTokens: prior?.usedTokens
  });
}
var OPENCODE_DISPLAY_ONLY_COST_METADATA;
var init_usage = __esm({
  "node_modules/cursor-opencode-provider/dist/usage.js"() {
    OPENCODE_DISPLAY_ONLY_COST_METADATA = {
      copilot: { totalNanoAiu: 0 }
    };
  }
});

// node_modules/cursor-opencode-provider/dist/auth.js
var auth_exports = {};
__export(auth_exports, {
  AuthExchangeError: () => AuthExchangeError,
  AuthPollError: () => AuthPollError,
  AuthRefreshError: () => AuthRefreshError,
  AuthTimeoutError: () => AuthTimeoutError,
  buildLoginUrl: () => buildLoginUrl,
  clearBearerTokenCache: () => clearBearerTokenCache,
  decodeJwtExpiryMs: () => decodeJwtExpiryMs,
  decodeJwtPayload: () => decodeJwtPayload,
  exchangeApiKey: () => exchangeApiKey,
  generatePkceChallenge: () => generatePkceChallenge,
  generatePkceParams: () => generatePkceParams,
  isExpiringSoon: () => isExpiringSoon,
  pollForTokens: () => pollForTokens,
  refreshAccessToken: () => refreshAccessToken,
  resolveBearerToken: () => resolveBearerToken,
  useAuthToken: () => useAuthToken
});
function isExpiringSoon(jwt, thresholdS = 300) {
  const payload = decodeJwtPayload(jwt);
  if (!payload || typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
    return true;
  }
  return payload.exp * 1e3 - Date.now() < thresholdS * 1e3;
}
function decodeJwtPayload(jwt) {
  try {
    const segment = jwt.split(".")[1];
    if (!segment)
      return null;
    const json = Buffer.from(segment, "base64url").toString("utf8");
    const payload = JSON.parse(json);
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      return null;
    return payload;
  } catch {
    return null;
  }
}
function decodeJwtExpiryMs(jwt) {
  const payload = decodeJwtPayload(jwt);
  if (!payload || typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
    return null;
  }
  return payload.exp * 1e3;
}
function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function useAuthToken(token) {
  return { accessToken: token };
}
async function exchangeApiKey(apiKey, baseUrl = API_BASE2) {
  return withAbortDeadline(AUTH_REQUEST_TIMEOUT_MS, () => new AuthExchangeError("API key exchange timed out"), async (signal) => {
    let res;
    try {
      res = await fetch(`${baseUrl}/auth/exchange_user_api_key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: "{}",
        signal
      });
    } catch (cause) {
      throw new AuthExchangeError("API key exchange request failed", cause);
    }
    if (!res.ok) {
      throw new AuthExchangeError(`API key exchange failed: ${res.status} ${res.statusText}`);
    }
    let body;
    try {
      body = await res.json();
    } catch (cause) {
      throw new AuthExchangeError("API key exchange returned malformed JSON", cause);
    }
    if (typeof body.accessToken !== "string" || typeof body.refreshToken !== "string") {
      throw new AuthExchangeError("Exchange response missing tokens");
    }
    return { accessToken: body.accessToken, refreshToken: body.refreshToken };
  });
}
async function refreshAccessToken(refreshToken, baseUrl = API_BASE2) {
  return withAbortDeadline(AUTH_REQUEST_TIMEOUT_MS, () => new AuthRefreshError("Token refresh timed out"), async (signal) => {
    let res;
    try {
      res = await fetch(`${baseUrl}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        signal
      });
    } catch (cause) {
      throw new AuthRefreshError("Token refresh request failed", cause);
    }
    if (!res.ok) {
      throw new AuthRefreshError(`Token refresh failed: ${res.status} ${res.statusText}`);
    }
    let body;
    try {
      body = await res.json();
    } catch (cause) {
      throw new AuthRefreshError("Token refresh returned malformed JSON", cause);
    }
    if (typeof body.accessToken !== "string" || typeof body.refreshToken !== "string") {
      throw new AuthRefreshError("Refresh response missing tokens");
    }
    return { accessToken: body.accessToken, refreshToken: body.refreshToken };
  });
}
function clearBearerTokenCache() {
  _apiKeyTokenCache.clear();
  inflightBearer.clear();
}
async function resolveBearerToken(input2) {
  if (input2.accessToken)
    return input2.accessToken;
  if (!input2.apiKey) {
    throw new Error("Cursor provider: no access token or API key provided");
  }
  if (!input2.apiKey.startsWith("crsr_"))
    return input2.apiKey;
  const baseUrl = input2.baseUrl ?? API_BASE2;
  const cached = _apiKeyTokenCache.get(input2.apiKey);
  if (cached && !isExpiringSoon(cached.accessToken)) {
    return cached.accessToken;
  }
  const inflightKey = `${baseUrl}\0${input2.apiKey}`;
  const existing = inflightBearer.get(inflightKey);
  if (existing)
    return existing;
  async function refreshOrExchange() {
    if (cached) {
      try {
        const refreshed = await refreshAccessToken(cached.refreshToken, baseUrl);
        _apiKeyTokenCache.set(input2.apiKey, refreshed);
        return refreshed.accessToken;
      } catch {
      }
    }
    const pair = await exchangeApiKey(input2.apiKey, baseUrl);
    _apiKeyTokenCache.set(input2.apiKey, pair);
    return pair.accessToken;
  }
  const pending3 = refreshOrExchange();
  inflightBearer.set(inflightKey, pending3);
  try {
    return await pending3;
  } finally {
    if (inflightBearer.get(inflightKey) === pending3)
      inflightBearer.delete(inflightKey);
  }
}
async function sha256(data) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
}
function generatePkceParams() {
  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const verifier = base64url(verifierBytes);
  const uuid = crypto.randomUUID();
  return { verifier, challenge: "", uuid };
}
async function generatePkceChallenge(verifier) {
  const enc = new TextEncoder();
  const hash = await sha256(enc.encode(verifier));
  return base64url(hash);
}
function buildLoginUrl(challenge, uuid, websiteUrl = `https://${CURSOR_WEBSITE_HOST}`) {
  return `${websiteUrl}/loginDeepControl?challenge=${encodeURIComponent(challenge)}&uuid=${encodeURIComponent(uuid)}&mode=login&redirectTarget=cli`;
}
async function pollForTokens(uuid, verifier, baseUrl = API_BASE2, signal, maxAttempts = 150) {
  let failures = 0;
  for (let i = 0; i < maxAttempts; i++) {
    if (signal?.aborted)
      throw new AuthTimeoutError("Poll cancelled");
    const delay = Math.min(1e3 * Math.pow(1.2, i), 1e4);
    await new Promise((r) => setTimeout(r, delay));
    try {
      const url = `${baseUrl}/auth/poll?uuid=${encodeURIComponent(uuid)}&verifier=${encodeURIComponent(verifier)}`;
      const res = await fetch(url);
      if (res.status === 404) {
        failures = 0;
        continue;
      }
      if (!res.ok) {
        failures++;
        if (failures >= 3) {
          throw new AuthPollError(`Poll failed after ${failures} consecutive errors (last: ${res.status})`);
        }
        continue;
      }
      const body = await res.json();
      if (body.accessToken && body.refreshToken) {
        return { accessToken: body.accessToken, refreshToken: body.refreshToken };
      }
      failures++;
      if (failures >= 3) {
        throw new AuthPollError("Poll returned 3 consecutive 200 responses without tokens");
      }
    } catch (err) {
      if (err instanceof AuthPollError)
        throw err;
      failures++;
      if (failures >= 3) {
        throw new AuthPollError("Poll failed after 3 consecutive network errors", err);
      }
    }
  }
  throw new AuthTimeoutError(`Poll timed out after ${maxAttempts} attempts (~5 min)`);
}
var API_BASE2, AUTH_REQUEST_TIMEOUT_MS, AuthExchangeError, AuthRefreshError, AuthPollError, AuthTimeoutError, _apiKeyTokenCache, inflightBearer;
var init_auth = __esm({
  "node_modules/cursor-opencode-provider/dist/auth.js"() {
    init_shared();
    init_deadline();
    API_BASE2 = `https://${CURSOR_API_HOST}`;
    AUTH_REQUEST_TIMEOUT_MS = 5e3;
    AuthExchangeError = class extends Error {
      cause;
      constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = "AuthExchangeError";
      }
    };
    AuthRefreshError = class extends Error {
      cause;
      constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = "AuthRefreshError";
      }
    };
    AuthPollError = class extends Error {
      cause;
      constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = "AuthPollError";
      }
    };
    AuthTimeoutError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "AuthTimeoutError";
      }
    };
    _apiKeyTokenCache = /* @__PURE__ */ new Map();
    inflightBearer = /* @__PURE__ */ new Map();
  }
});

// node_modules/cursor-opencode-provider/dist/language-model.js
import fs7 from "node:fs";
import path21 from "node:path";
import { createHash as createHash6 } from "node:crypto";
function checkpointBlobGraphRequiresRebase(stats, maxBytes = MAX_CHECKPOINT_BLOB_GRAPH_BYTES) {
  return !stats.complete || stats.bytes > maxBytes;
}
function responseRequiredChannel(payload) {
  const fields = readAllFieldsStrict(payload);
  if (fields) {
    const channels = fields.map((field) => RESPONSE_REQUIRED_CHANNEL_BY_FIELD.get(field.fn)).filter((channel) => !!channel);
    if (channels.length > 1)
      return "multiple";
    return channels[0];
  }
  const tag = payload[0];
  return tag !== void 0 ? RESPONSE_REQUIRED_CHANNEL_BY_FIELD.get(tag >> 3) : void 0;
}
function retryInteger(name14, value, fallback) {
  const resolved = value === void 0 ? fallback : value;
  if (typeof resolved !== "number" || !Number.isSafeInteger(resolved) || resolved <= 0) {
    throw new CursorProtocolError(`Cursor retry ${name14} must be a positive integer`);
  }
  return resolved;
}
function resolveRetryPolicy(options) {
  if (options !== void 0 && (options === null || typeof options !== "object" || Array.isArray(options))) {
    throw new CursorProtocolError("Cursor retry options must be an object");
  }
  for (const key of Object.keys(options ?? {})) {
    if (!["maxAttempts", "baseDelayMs", "maxDelayMs"].includes(key)) {
      throw new CursorProtocolError(`Unknown Cursor retry option: ${key}`);
    }
  }
  const maxAttempts = retryInteger("maxAttempts", options?.maxAttempts, DEFAULT_RETRY_POLICY.maxAttempts);
  const baseDelayMs = retryInteger("baseDelayMs", options?.baseDelayMs, DEFAULT_RETRY_POLICY.baseDelayMs);
  const maxDelayMs = retryInteger("maxDelayMs", options?.maxDelayMs, DEFAULT_RETRY_POLICY.maxDelayMs);
  if (maxAttempts > MAX_RETRY_ATTEMPTS) {
    throw new CursorProtocolError(`Cursor retry maxAttempts must be no greater than ${MAX_RETRY_ATTEMPTS}`);
  }
  if (baseDelayMs > MAX_RETRY_DELAY_MS || maxDelayMs > MAX_RETRY_DELAY_MS) {
    throw new CursorProtocolError(`Cursor retry delays must be no greater than ${MAX_RETRY_DELAY_MS}ms`);
  }
  if (baseDelayMs > maxDelayMs) {
    throw new CursorProtocolError("Cursor retry baseDelayMs must be no greater than maxDelayMs");
  }
  return { maxAttempts, baseDelayMs, maxDelayMs };
}
function retryDelayMs(error, attempt, policy) {
  if (error.retryAfterMs !== void 0)
    return Math.min(MAX_RETRY_DELAY_MS, error.retryAfterMs);
  const ceiling = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** Math.max(0, attempt - 1));
  return Math.floor(Math.random() * ceiling);
}
function sleepForRetry(delayMs, signal) {
  if (signal?.aborted)
    return Promise.reject(new CursorLocalCancellationError("Cursor retry cancelled"));
  return new Promise((resolve2, reject) => {
    const timer = setTimeout(finish, delayMs);
    const onAbort = () => finish(new CursorLocalCancellationError("Cursor retry cancelled"));
    function finish(error) {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      if (error)
        reject(error);
      else
        resolve2();
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
function retryDelayFromValue(value) {
  if (typeof value === "string") {
    const seconds2 = /^(\d+(?:\.\d+)?)s$/.exec(value.trim());
    if (seconds2)
      return Math.ceil(Number(seconds2[1]) * 1e3);
    const protobufDelay = retryInfoProtobufDelayMs(value.trim());
    if (protobufDelay !== void 0)
      return protobufDelay;
  }
  if (!value || typeof value !== "object")
    return void 0;
  const duration = value;
  const seconds = Number(duration.seconds ?? 0);
  const nanos = Number(duration.nanos ?? 0);
  if (!Number.isFinite(seconds) || !Number.isFinite(nanos) || seconds < 0 || nanos < 0)
    return void 0;
  return Math.ceil(seconds * 1e3 + nanos / 1e6);
}
function retryInfoProtobufDelayMs(encoded) {
  if (!encoded || encoded.length > 512 || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(encoded)) {
    return void 0;
  }
  let bytes;
  try {
    bytes = Buffer.from(encoded.replaceAll("-", "+").replaceAll("_", "/"), "base64");
  } catch {
    return void 0;
  }
  const readVarint = (input2, start) => {
    let value = 0n;
    let shift = 0n;
    for (let offset2 = start; offset2 < input2.length && offset2 < start + 10; offset2++) {
      const byte = input2[offset2];
      value |= BigInt(byte & 127) << shift;
      if ((byte & 128) === 0)
        return [value, offset2 + 1];
      shift += 7n;
    }
    return void 0;
  };
  const outerKey = readVarint(bytes, 0);
  if (!outerKey || outerKey[0] !== 0x0an)
    return void 0;
  const outerLength = readVarint(bytes, outerKey[1]);
  if (!outerLength || outerLength[0] > BigInt(bytes.length - outerLength[1]))
    return void 0;
  const duration = bytes.subarray(outerLength[1], outerLength[1] + Number(outerLength[0]));
  let offset = 0;
  let seconds = 0n;
  let nanos = 0n;
  while (offset < duration.length) {
    const key = readVarint(duration, offset);
    if (!key)
      return void 0;
    offset = key[1];
    const field = Number(key[0] >> 3n);
    if (Number(key[0] & 7n) !== 0)
      return void 0;
    const item = readVarint(duration, offset);
    if (!item)
      return void 0;
    offset = item[1];
    if (field === 1)
      seconds = item[0];
    else if (field === 2)
      nanos = item[0];
  }
  if (seconds > BigInt(Number.MAX_SAFE_INTEGER) || nanos > 999999999n)
    return void 0;
  return Math.ceil(Number(seconds) * 1e3 + Number(nanos) / 1e6);
}
function connectFrameError(payload) {
  try {
    const envelope = JSON.parse(payload);
    const code = typeof envelope.error?.code === "string" ? envelope.error.code : "unknown";
    if (code === "unauthenticated" || code === "permission_denied") {
      return new CursorAuthError(`Cursor authentication failed (${code}); reauthenticate with Cursor`, { code });
    }
    let retryAfterMs = retryDelayFromValue(envelope.error?.retryAfter ?? envelope.error?.retry_after);
    let hasRetryInfo = false;
    if (Array.isArray(envelope.error?.details)) {
      for (const detail of envelope.error.details) {
        if (!detail || typeof detail !== "object")
          continue;
        const record = detail;
        const type = record.type;
        if (type === "google.rpc.RetryInfo" || typeof type === "string" && type.endsWith("/google.rpc.RetryInfo")) {
          hasRetryInfo = true;
          retryAfterMs ??= retryDelayFromValue(record.retryDelay ?? record.retry_delay ?? record.value);
        }
      }
    }
    return new CursorServerError(`Cursor API error (code=${code})`, {
      transient: isTransientGrpcStatus(code) || hasRetryInfo,
      replaySafe: true,
      code,
      retryAfterMs: retryAfterMs === void 0 ? void 0 : Math.min(MAX_RETRY_DELAY_MS, retryAfterMs)
    });
  } catch {
    return new CursorProtocolError("Cursor returned a malformed Connect error envelope");
  }
}
function publishToolCatalogWaiters(sessionKey, tools) {
  const waiters = toolCatalogWaitersBySession.get(sessionKey);
  if (!waiters || waiters.size === 0)
    return;
  toolCatalogWaitersBySession.delete(sessionKey);
  for (const waiter of waiters)
    waiter.resolve(tools);
}
function waitForSiblingToolCatalog(sessionKey, signal) {
  const existing = toolCatalogBySession.get(sessionKey);
  if (existing && existing.length > 0) {
    return Promise.resolve(structuredClone(existing));
  }
  if (signal?.aborted) {
    return Promise.reject(new CursorLocalCancellationError("Cursor tool-catalog wait cancelled"));
  }
  return new Promise((resolve2, reject) => {
    let settled = false;
    let set = toolCatalogWaitersBySession.get(sessionKey);
    const finish = (tools, error) => {
      if (settled)
        return;
      settled = true;
      set?.delete(waiter);
      if (set?.size === 0)
        toolCatalogWaitersBySession.delete(sessionKey);
      signal?.removeEventListener("abort", onAbort);
      if (error)
        reject(error);
      else
        resolve2(structuredClone(tools));
    };
    const onAbort = () => finish(void 0, new CursorLocalCancellationError("Cursor tool-catalog wait cancelled"));
    const waiter = {
      resolve: (tools) => finish(tools),
      cancel: onAbort
    };
    if (!set) {
      set = /* @__PURE__ */ new Set();
      toolCatalogWaitersBySession.set(sessionKey, set);
    }
    set.add(waiter);
    signal?.addEventListener("abort", onAbort, { once: true });
    const raced = toolCatalogBySession.get(sessionKey);
    if (raced && raced.length > 0)
      finish(raced);
  });
}
function rememberToolCatalog(sessionKey, tools) {
  toolCatalogBySession.delete(sessionKey);
  toolCatalogBySession.set(sessionKey, structuredClone(tools));
  publishToolCatalogWaiters(sessionKey, tools);
  while (toolCatalogBySession.size > MAX_TURN_STATE_SESSIONS) {
    const oldest = toolCatalogBySession.keys().next().value;
    if (!oldest)
      break;
    toolCatalogBySession.delete(oldest);
  }
}
function restoreTurnToolCatalog(sessionKey, tools) {
  if (!sessionKey || tools.length === 0)
    return;
  rememberToolCatalog(sessionKey, tools);
}
function snapshotToolCatalog(sessionKey) {
  if (!sessionKey)
    return [];
  return structuredClone(toolCatalogBySession.get(sessionKey) ?? []);
}
function rememberPostCompactionRebase(sessionKey) {
  postCompactionRebaseBySession.delete(sessionKey);
  postCompactionRebaseBySession.add(sessionKey);
  while (postCompactionRebaseBySession.size > MAX_TURN_STATE_SESSIONS) {
    const oldest = postCompactionRebaseBySession.values().next().value;
    if (!oldest)
      break;
    postCompactionRebaseBySession.delete(oldest);
  }
}
function sentHistoryImageHashes(sessionKey) {
  if (!sessionKey)
    return void 0;
  const hashes = sentHistoryImageHashesBySession.get(sessionKey);
  if (!hashes)
    return void 0;
  sentHistoryImageHashesBySession.delete(sessionKey);
  sentHistoryImageHashesBySession.set(sessionKey, hashes);
  return hashes;
}
function rememberSentHistoryImageHashes(sessionKey, hashes) {
  if (!sessionKey || hashes.length === 0)
    return;
  const remembered = sentHistoryImageHashesBySession.get(sessionKey) ?? /* @__PURE__ */ new Set();
  for (const hash of hashes) {
    remembered.delete(hash);
    remembered.add(hash);
    while (remembered.size > MAX_SENT_HISTORY_IMAGES_PER_SESSION) {
      const oldest = remembered.values().next().value;
      if (!oldest)
        break;
      remembered.delete(oldest);
    }
  }
  sentHistoryImageHashesBySession.delete(sessionKey);
  sentHistoryImageHashesBySession.set(sessionKey, remembered);
  while (sentHistoryImageHashesBySession.size > MAX_TURN_STATE_SESSIONS) {
    const oldest = sentHistoryImageHashesBySession.keys().next().value;
    if (!oldest)
      break;
    sentHistoryImageHashesBySession.delete(oldest);
  }
}
function createCursorLanguageModel(modelId, providerId, options) {
  if (options.cacheDir)
    setHostCacheDirOverride(options.cacheDir);
  void initializeConversationPersistence(opencodeGlobalCacheDir()).catch((error) => {
    trace(`conversation persistence: startup load failed: ${String(error)}`);
  });
  return {
    specificationVersion: "v3",
    provider: providerId,
    modelId,
    supportedUrls: {},
    async doStream(callOptions) {
      return doStreamImpl(modelId, options, callOptions);
    },
    async doGenerate(callOptions) {
      const result = await doStreamImpl(modelId, options, callOptions);
      const parts = [];
      const reader = result.stream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done)
          break;
        parts.push(value);
      }
      return foldStreamParts(parts);
    }
  };
}
async function doStreamImpl(modelId, options, callOptions) {
  const { resolveBearerToken: resolveBearerToken2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
  const token = await resolveBearerToken2({
    accessToken: options.accessToken,
    apiKey: options.apiKey,
    baseUrl: resolveApiBaseURL2(options)
  });
  const prompt = callOptions.prompt;
  const retryPolicy = resolveRetryPolicy(options.retry);
  const openSession = (startOptions) => startSession(modelId, token, callOptions, options, startOptions);
  const trailingToolResults = extractTrailingToolResults(prompt);
  let session = findContinuationSession(trailingToolResults);
  if (session) {
    session = deliverContinuationResults(session, trailingToolResults);
  }
  if (!session) {
    if (trailingToolResults.length > 0) {
      const ids = trailingToolResults.map((r) => `${r.sessionId}:${r.execId}`).join(",");
      trace(`continuation: ${trailingToolResults.length} interrupted trailing tool result(s) [${ids}] \u2014 rebasing fresh Run`);
      session = await openSession({ recovery: { kind: "rebase" } });
    } else {
      const historical = extractToolResults(prompt).length;
      if (historical > 0) {
        trace(`fresh turn: ignoring ${historical} historical tool result(s) (not trailing)`);
      }
      session = await openSession();
    }
  }
  let activeSession = session;
  return {
    stream: new ReadableStream({
      async pull(controller) {
        try {
          try {
            controller.enqueue({ type: "stream-start", warnings: [] });
          } catch (e) {
            trace(`pull: stream-start enqueue failed (cancelled) err=${e.message}`);
            return;
          }
          activeSession = await pumpWithRecovery({
            initialSession: activeSession,
            controller,
            abortSignal: callOptions.abortSignal,
            retryPolicy,
            recover: (recovery) => openSession({ recovery }),
            onSession: (next) => {
              activeSession = next;
            }
          });
          try {
            controller.close();
          } catch (e) {
            trace(`pull: close failed (already closed/cancelled) err=${e.message}`);
          }
          const kickoff2 = await flushPlanExecutionKickoff(activeSession.openCodeSessionId, {
            cursorSessionID: activeSession.sessionId,
            terminal: activeSession.closed,
            pumpActive: activeSession.pumpActive || activeSession.pumpOwner != null,
            pendingExecs: activeSession.pending.size
          });
          if (!kickoff2) {
            const state = planExecutionKickoffState(activeSession.openCodeSessionId);
            if (state?.status === "failed") {
              setActiveCursorMode(activeSession.openCodeSessionId, "plan");
            }
          }
        } catch (e) {
          activeSession.pumpActive = false;
          trace(`pull: pump threw (cleaning up): ${e.message}`);
          sessionManager.close(activeSession);
          try {
            controller.error(e instanceof Error ? e : new Error(String(e)));
          } catch {
          }
        }
      },
      cancel() {
        trace("ReadableStream cancel() \u2192 closeUnlessPending");
        sessionManager.closeUnlessPending(activeSession);
      }
    })
  };
}
async function pumpWithRecovery(input2) {
  let session = input2.initialSession;
  const retryPolicy = input2.retryPolicy ?? {
    ...DEFAULT_RETRY_POLICY,
    maxAttempts: (input2.maxRecoveries ?? 1) + 1
  };
  const maxRecoveries = retryPolicy.maxAttempts - 1;
  input2.onSession?.(session);
  for (let attempt = 0; ; attempt++) {
    const pumpedSession = session;
    const pumpOwner = /* @__PURE__ */ Symbol("cursor-pump");
    sessionManager.beginPump(pumpedSession, pumpOwner);
    try {
      await pump(pumpedSession, input2.controller, {
        textId: crypto.randomUUID(),
        reasoningId: crypto.randomUUID()
      }, input2.abortSignal);
      return session;
    } catch (error) {
      const failure = toCursorProviderError(error, {
        replaySafe: error instanceof CursorProviderError ? error.replaySafe : false,
        fallback: "Cursor Run interrupted"
      });
      if (!failure.transient)
        throw failure;
      const checkpoint = pumpedSession.resumeCheckpoint;
      if (!failure.replaySafe && !checkpoint) {
        throw retrySuppressedError(failure, "after visible output or stateful server activity", attempt + 1, maxRecoveries + 1);
      }
      if (attempt >= maxRecoveries) {
        throw new CursorRetryExhaustedError(attempt + 1, failure);
      }
      trace(`Run interrupted: sessionId=${pumpedSession.sessionId} attempt=${attempt + 1}/${maxRecoveries} err=${failure.message} \u2014 ${checkpoint ? `resuming ${checkpoint.length}B checkpoint` : "rebasing fresh Run"}`);
      sessionManager.close(pumpedSession, "remote-error", failure);
      const delayMs = retryDelayMs(failure, attempt + 1, retryPolicy);
      trace(`Run retry backoff: attempt=${attempt + 1}/${maxRecoveries} delayMs=${delayMs}`);
      await sleepForRetry(delayMs, input2.abortSignal);
      const recovery = checkpoint ? {
        kind: "resume",
        conversationId: pumpedSession.conversationId,
        checkpoint: Uint8Array.from(checkpoint)
      } : { kind: "rebase" };
      session = await input2.recover(recovery);
      if (recovery.kind === "resume") {
        session.usageEstimate = { ...pumpedSession.usageEstimate };
        session.editToolCalls = new Map(pumpedSession.editToolCalls);
      }
      input2.onSession?.(session);
    } finally {
      sessionManager.endPump(pumpedSession, pumpOwner);
    }
  }
}
function bumpHeartbeatGeneration(session) {
  const generation = (heartbeatGenerationBySession.get(session) ?? 0) + 1;
  heartbeatGenerationBySession.set(session, generation);
  heartbeatWritePendingBySession.set(session, false);
  return generation;
}
function isCurrentHeartbeatGeneration(session, generation) {
  return heartbeatGenerationBySession.get(session) === generation;
}
function attachSessionHeartbeat(session) {
  session.heartbeatCancel?.();
  if (session.heartbeat) {
    clearInterval(session.heartbeat);
    session.heartbeat = null;
  }
  const generation = bumpHeartbeatGeneration(session);
  const interval = setInterval(() => {
    if (session.closed || !isCurrentHeartbeatGeneration(session, generation))
      return;
    if (heartbeatWritePendingBySession.get(session)) {
      trace(`heartbeat skipped: prior heartbeat write is still pending sessionId=${session.sessionId}`);
      return;
    }
    heartbeatWritePendingBySession.set(session, true);
    const stream = session.stream;
    void writeWithBackpressure(stream, buildHeartbeat(), "heartbeat").then(() => {
      if (!isCurrentHeartbeatGeneration(session, generation) || session.closed)
        return;
      sessionManager.recordHeartbeatWrite(session);
    }).catch((cause) => {
      if (!isCurrentHeartbeatGeneration(session, generation) || session.closed)
        return;
      sessionManager.close(session, "heartbeat-write-failed", toCursorProviderError(cause, {
        replaySafe: false,
        fallback: "Cursor heartbeat write failed"
      }));
    }).finally(() => {
      if (isCurrentHeartbeatGeneration(session, generation)) {
        heartbeatWritePendingBySession.set(session, false);
      }
    });
  }, session.policy.heartbeatMs);
  interval.unref?.();
  session.heartbeat = interval;
  session.heartbeatCancel = () => {
    if (session.heartbeat)
      clearInterval(session.heartbeat);
    session.heartbeat = null;
    if (isCurrentHeartbeatGeneration(session, generation))
      bumpHeartbeatGeneration(session);
  };
}
async function startSession(modelId, token, callOptions, options, startOptions) {
  const continuationPolicy = resolveContinuationPolicy(options.continuation);
  const prompt = callOptions.prompt;
  const incomingTools = extractTools(callOptions);
  const sessionKey = opencodeSessionKey(callOptions);
  const cacheDir = opencodeGlobalCacheDir();
  if (sessionKey) {
    const restored = await hydrateConversationState(cacheDir, sessionKey).catch((error) => {
      trace(`conversation persistence: restore failed sessionKey=${sessionKey}: ${String(error)}`);
      return void 0;
    });
    if (restored?.postCompactionRebase)
      rememberPostCompactionRebase(sessionKey);
    if (restored?.toolCatalog.length)
      restoreTurnToolCatalog(sessionKey, restored.toolCatalog);
  }
  const providerOptions = callOptions.providerOptions?.cursor;
  const isCompaction = providerOptions?.[CURSOR_COMPACTION_OPTION] === true || isCompactionSession(sessionKey);
  const toolState = await resolveTurnToolState({
    sessionKey,
    incomingTools,
    toolChoice: callOptions.toolChoice,
    isCompaction,
    abortSignal: callOptions.abortSignal
  });
  const tools = toolState.advertisedTools;
  const webToolAliases = buildCustomWebToolAliases(tools);
  const cursorTools = webToolAliases.advertisedTools;
  for (const [alias, candidates] of webToolAliases.ambiguous) {
    trace(`web tool alias skipped: alias=${alias} ambiguous=[${candidates.join(",")}]`);
  }
  for (const [alias, original] of webToolAliases.aliases) {
    trace(`web tool alias: ${alias} -> ${original}`);
  }
  const allowTools = toolState.allowTools;
  const discoveredSubagentCatalog = extractHostSubagentCatalog(cursorTools);
  const resetState = resolveTurnConversationReset({ sessionKey, isCompaction });
  let recovery = startOptions?.recovery;
  let resumeRecovery = recovery?.kind === "resume" ? recovery : void 0;
  let resuming = !!resumeRecovery;
  const lifecycle = !allowTools && !isCompaction && !recovery;
  let bound = resuming ? { conversationId: resumeRecovery.conversationId, reset: false, previousId: void 0 } : bindConversationId(sessionKey, {
    reset: resetState.reset || recovery?.kind === "rebase",
    ephemeral: lifecycle
  });
  let conversationState = lifecycle ? void 0 : resuming ? resumeRecovery.checkpoint : bound.reset ? void 0 : getCheckpoint(bound.conversationId);
  let checkpointGraph = conversationState ? inspectConversationBlobGraph(bound.conversationId, conversationState) : { count: 0, bytes: 0, complete: true };
  let forcedResetReason;
  if (conversationState && checkpointBlobGraphRequiresRebase(checkpointGraph)) {
    const previousConversationId = bound.conversationId;
    forcedResetReason = checkpointGraph.complete ? "oversized-checkpoint-graph" : "incomplete-checkpoint-graph";
    trace(`checkpoint state rejected: reason=${forcedResetReason} conversationId=${previousConversationId} checkpointBytes=${conversationState.length} blobCount=${checkpointGraph.count} blobBytes=${checkpointGraph.bytes} limitBytes=${MAX_CHECKPOINT_BLOB_GRAPH_BYTES} detail=${checkpointGraph.fallbackReason ?? "-"} action=rebase`);
    if (recovery?.kind === "resume")
      recovery = { kind: "rebase" };
    resumeRecovery = void 0;
    resuming = false;
    if (!sessionKey) {
      clearCheckpoint(previousConversationId);
      clearConversationBlobs(previousConversationId);
    }
    bound = bindConversationId(sessionKey, { reset: true });
    conversationState = void 0;
    checkpointGraph = { count: 0, bytes: 0, complete: true };
  }
  const conversationId = bound.conversationId;
  const conversationGroupId = resolveConversationGroupId(sessionKey, conversationId);
  if (bound.reset) {
    if (sessionKey) {
      await clearPersistedConversationState(cacheDir, sessionKey, bound.previousId).catch((error) => {
        trace(`conversation persistence: reset cleanup failed sessionKey=${sessionKey}: ${String(error)}`);
      });
    }
    trace(`conversation reset: reason=${forcedResetReason ?? (recovery?.kind === "rebase" ? "interrupted-run" : resetState.reason ?? "unknown")} sessionKey=${sessionKey ?? "(none)"} previousId=${bound.previousId ?? "-"} \u2192 conversationId=${conversationId}`);
  }
  const lastUser = [...prompt].reverse().find((message) => message.role === "user");
  const userText = recovery?.kind === "rebase" ? "Continue the interrupted turn from the conversation history above. Do not repeat completed work." : extractUserText(lastUser) || ".";
  const workspaceRoot = path21.resolve(getSessionDirectory(sessionKey) ?? (options.workspaceRoot || process.cwd()));
  const baseSystemPrompt = extractSystemPrompt(prompt);
  const interactionGuidance = buildOpenCodeInteractionGuidance(cursorTools, isCompaction, workspaceRoot);
  const startedWithCheckpoint = !!conversationState;
  const modeReminder = isCompaction || startedWithCheckpoint || lifecycle ? void 0 : takeActiveCursorModeReminder(sessionKey, {
    advertisedTools: cursorTools.map((tool) => tool.name)
  });
  const kickoffWarning = isCompaction || startedWithCheckpoint || lifecycle ? void 0 : takePlanExecutionKickoffWarning(sessionKey);
  const systemPrompt = [
    baseSystemPrompt,
    interactionGuidance,
    modeReminder,
    kickoffWarning ? `<system_reminder>${kickoffWarning}</system_reminder>` : void 0
  ].filter(Boolean).join("\n\n");
  const history = extractPromptHistory(prompt, {
    preserveTrailingUser: recovery?.kind === "rebase",
    toolResults: isCompaction ? "all" : recovery?.kind === "rebase" ? "trailing" : "omit"
  });
  await loadAvailableModels();
  const agentBaseUrl = resolveExplicitAgentBaseURL(options) ?? await resolveAgentUrl(token, {
    apiBaseURL: resolveApiBaseURL2(options),
    telemetryEnabled: resolveTelemetryEnabled(options)
  });
  const picked = extractCursorVariantParameters(providerOptions);
  const cursorModelId = resolveCursorWireModelId(providerOptions, modelId);
  const reasoningEffort = typeof providerOptions?.reasoningEffort === "string" ? providerOptions.reasoningEffort : void 0;
  const hintMaxMode = !!(providerOptions?.maxMode ?? false);
  const modelInfo = _availableModels?.find((m) => m.id === cursorModelId);
  const supportsImages = resolveCursorModelSupportsImages(cursorModelId, modelInfo?.supportsImages);
  if (!resuming) {
    assertCursorUserImageSupport(lastUser, supportsImages, cursorModelId);
  }
  const imageExtraction = resuming ? { images: [], hashes: [], candidateCount: 0, duplicateCount: 0, userImageCount: 0 } : await extractCursorPromptImages(prompt, lastUser, {
    supportsImages,
    // Content hashes are retained for the OpenCode session so growing
    // history does not re-upload old screenshots. A recovery rebase opens
    // a new Cursor conversation, so it must resend the same payload.
    seenHistoryHashes: recovery?.kind === "rebase" ? void 0 : sentHistoryImageHashes(sessionKey),
    signal: callOptions.abortSignal
  });
  if (!supportsImages && imageExtraction.candidateCount > 0) {
    trace(`image input: dropped ${imageExtraction.candidateCount} tool/assistant history image(s); model=${cursorModelId} does not support images`);
  }
  if (imageExtraction.duplicateCount > 0) {
    trace(`image input: skipped ${imageExtraction.duplicateCount} previously sent history image(s)`);
  }
  const images = imageExtraction.images;
  const parameterValues = resolveVariantParameters(modelInfo, {
    reasoningEffort,
    maxMode: hintMaxMode,
    picked
  });
  const maxMode = resolveVariantMaxMode(parameterValues, {
    picked,
    maxMode: hintMaxMode
  });
  const stream = await bidiRunStream(token, {
    baseURL: agentBaseUrl,
    headers: options.headers
  });
  const { context: requestContext, reused: requestContextReused } = await getOrBuildRequestContext(conversationId, { workspaceRoot, tools: cursorTools });
  const contextSubagents = Array.isArray(requestContext.custom_subagents) ? requestContext.custom_subagents.map((agent) => agent && typeof agent === "object" && typeof agent.name === "string" ? {
    name: agent.name,
    description: typeof agent.description === "string" ? agent.description : void 0
  } : void 0).filter((agent) => !!agent) : [];
  const subagentCatalog = {
    ...discoveredSubagentCatalog,
    agents: [...new Map([...discoveredSubagentCatalog.agents, ...contextSubagents].map((agent) => [agent.name, agent])).values()]
  };
  const toolDescriptors = Array.isArray(requestContext.tools) ? requestContext.tools : [];
  const reqBytes = buildRunRequest({
    text: userText,
    images,
    modelId: cursorModelId,
    conversationId,
    conversationGroupId,
    systemPrompt: conversationState ? void 0 : systemPrompt,
    history: conversationState ? void 0 : history,
    conversationState,
    parameterValues,
    maxMode,
    tools: cursorTools,
    toolDescriptors,
    requestContext,
    action: resuming ? "resume" : "user"
  });
  const sha = (b) => createHash6("sha256").update(b).digest("hex");
  const skillsCount = Array.isArray(requestContext.agent_skills) ? requestContext.agent_skills.length : 0;
  const hooksCtx = typeof requestContext.hooks_additional_context === "string" ? requestContext.hooks_additional_context : "";
  const historyChars = history.reduce((n, m) => n + m.content.length, 0);
  const seedChars = conversationState ? 0 : (systemPrompt?.length ?? 0) + userText.length + historyChars;
  const seedEstimateIn = estimateTokens(seedChars);
  const checkpointEnvelopeEstimateIn = conversationState ? estimateTokens(userText.length + conversationState.length) : 0;
  const runRequestWireEstimateIn = estimateTokens(reqBytes.length);
  const encodedRequestContext = encodeMessage("RequestContext", requestContext);
  const priorTokenDetails = decodeConversationTokenDetails(conversationState);
  const requestContextHash = sha(encodedRequestContext);
  const systemPromptHash = systemPrompt ? sha(systemPrompt) : void 0;
  const usageEstimate = {
    // This is used only before Cursor supplies authoritative TurnEnded usage.
    // Estimate the actual protobuf request, not history/system text omitted by
    // checkpoint Runs. The opaque remote interpretation of KV blobs is logged
    // separately and deliberately is not mislabeled as a token count.
    inputTokens: runRequestWireEstimateIn,
    outputTokens: 0,
    cacheRead: 0,
    cacheWrite: 0,
    reasoningTokens: 0
  };
  trace(`outbound Run: model=${cursorModelId} opencodeModel=${modelId} conversationId=${conversationId} conversationGroupId=${conversationGroupId} params=${JSON.stringify(parameterValues ?? [])} maxMode=${maxMode} systemPromptLen=${systemPrompt?.length ?? 0} tools=${tools.length} incomingTools=${incomingTools.length} compaction=${isCompaction} skills=${skillsCount} hooks=${hooksCtx ? hooksCtx.split("\n").length : 0} availableModels=${_availableModels?.length ?? 0} userTextLen=${userText.length} images=${images.length} imageBytes=${images.reduce((total, image) => total + image.data.length, 0)} historyMsgs=${history.length} historyChars=${historyChars} checkpointLen=${conversationState?.length ?? 0} checkpointBlobCount=${checkpointGraph.count} checkpointBlobBytes=${checkpointGraph.bytes} checkpointGraphComplete=${checkpointGraph.complete} seedChars=${seedChars} seedEstimateIn=${seedEstimateIn} checkpointEnvelopeEstimateIn=${checkpointEnvelopeEstimateIn} reset=${bound.reset} resume=${resuming} requestContextReused=${requestContextReused} usageEstimateMode=run-request-wire usageEstimateIn=${usageEstimate.inputTokens} runRequestBytes=${reqBytes.length} requestContextBytes=${encodedRequestContext.length}`);
  if (hooksCtx)
    trace(`outbound Run hooks_additional_context: ${hooksCtx}`);
  trace(`hash run_request sha256=${sha(reqBytes)}`);
  if (systemPrompt)
    trace(`hash systemPrompt sha256=${sha(systemPrompt)}`);
  trace(`hash requestContext sha256=${requestContextHash}`);
  if (conversationState)
    trace(`hash checkpoint sha256=${sha(conversationState)}`);
  try {
    await writeWithBackpressure(stream, reqBytes, "initial Run request");
    rememberSentHistoryImageHashes(sessionKey, imageExtraction.hashes);
  } catch (error) {
    stream.destroy();
    throw error;
  }
  const session = {
    sessionId: crypto.randomUUID(),
    conversationId,
    cacheDir,
    resumeCheckpoint: void 0,
    tokenDetails: priorTokenDetails,
    tokenDetailsFresh: false,
    cacheDiagnostics: {
      sessionKey,
      conversationId,
      conversationGroupId,
      modelId: cursorModelId,
      priorTokenDetails,
      startedWithCheckpoint: !!conversationState,
      requestContextReused,
      requestContextHash,
      systemPromptHash,
      checkpointUpdates: 0,
      tokenDetailUpdates: 0,
      pumpPasses: 0,
      stepStarts: 0,
      stepCompletes: 0,
      displayToolCalls: 0,
      execRequests: 0
    },
    openCodeSessionId: lifecycle ? void 0 : sessionKey,
    postCompactionRebase: isCompaction,
    toolCatalog: snapshotToolCatalog(sessionKey),
    stream,
    frames: stream.frames()[Symbol.asyncIterator](),
    pending: /* @__PURE__ */ new Map(),
    displayToolCalls: /* @__PURE__ */ new Map(),
    editToolCalls: /* @__PURE__ */ new Map(),
    nextBridgedExecId: 9e5,
    blobs: /* @__PURE__ */ new Map(),
    toolDescriptors,
    toolAliases: webToolAliases.aliases,
    subagentCatalog,
    requestContext,
    allowTools,
    usageEstimate,
    pumpActive: false,
    pumpOwner: null,
    heartbeat: null,
    heartbeatCancel: null,
    hardDeadlineTimer: null,
    semanticDeadlineCancel: null,
    terminalUnsubscribe: null,
    deferredTerminalReason: null,
    policy: continuationPolicy,
    createdAt: Date.now(),
    lastInboundAt: Date.now(),
    lastHeartbeatWriteAt: Date.now(),
    semanticDeadlineAt: Date.now() + continuationPolicy.semanticIdleMs,
    closeError: null,
    closed: false
  };
  sessionManager.registerSession(session);
  attachSessionHeartbeat(session);
  const abortIfNeeded = (stream2) => {
    if (!session.closed && !callOptions.abortSignal?.aborted)
      return;
    try {
      stream2?.destroy();
    } catch {
    }
    if (callOptions.abortSignal?.aborted) {
      throw new CursorLocalCancellationError("Cursor progress-only continuation cancelled");
    }
    throw new CursorProtocolError("Cannot reopen a closed Cursor session");
  };
  session.reopenWithUserMessage = async (text) => {
    abortIfNeeded();
    const { resolveBearerToken: resolveBearerToken2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    const freshToken = await resolveBearerToken2({
      accessToken: options.accessToken,
      apiKey: options.apiKey,
      baseUrl: resolveApiBaseURL2(options)
    });
    abortIfNeeded();
    const next = await bidiRunStream(freshToken, { baseURL: agentBaseUrl, headers: options.headers });
    abortIfNeeded(next);
    const conversationState2 = session.resumeCheckpoint ?? getCheckpoint(session.conversationId);
    const reqBytes2 = buildRunRequest({
      text,
      modelId: cursorModelId,
      conversationId: session.conversationId,
      conversationGroupId: session.cacheDiagnostics?.conversationGroupId ?? session.conversationId,
      conversationState: conversationState2,
      parameterValues,
      maxMode,
      toolDescriptors: session.toolDescriptors,
      requestContext: session.requestContext,
      action: "user"
    });
    try {
      await writeWithBackpressure(next, reqBytes2, "progress-only continuation Run");
    } catch (error) {
      try {
        next.destroy();
      } catch {
      }
      throw error;
    }
    abortIfNeeded(next);
    session.heartbeatCancel?.();
    await waitForStreamWrites(session.stream);
    abortIfNeeded(next);
    sessionManager.replaceStream(session, next);
    attachSessionHeartbeat(session);
  };
  callOptions.abortSignal?.addEventListener("abort", () => {
    trace("abortSignal aborted \u2192 closeUnlessPending");
    sessionManager.closeUnlessPending(session);
  }, { once: true });
  return session;
}
function findContinuationSession(toolResults) {
  for (let i = toolResults.length - 1; i >= 0; i--) {
    const r = toolResults[i];
    const s = sessionManager.findByExecIds(r.sessionId, [r.execId]);
    if (s)
      return s;
  }
  return void 0;
}
function buildAskQuestionContinuationFrame(pending3, result) {
  const metadata = pending3.resultMetadata ?? {};
  const args = metadata.askQuestionArgs;
  if (!args)
    throw new CursorProtocolError("Bridged AskQuestion lost its decoded arguments");
  const answer = askQuestionResultFromToolOutput(args, result.output, result.error !== void 0);
  if (!args.runAsync) {
    const interactionId = metadata.interactionId;
    if (typeof interactionId !== "number") {
      throw new CursorProtocolError("Bridged AskQuestion lost its interaction id");
    }
    return buildAskQuestionInteractionReply(interactionId, answer);
  }
  const rawArgs = metadata.askQuestionRawArgs;
  if (!(rawArgs instanceof Uint8Array)) {
    throw new CursorProtocolError("Bridged async AskQuestion lost its original arguments");
  }
  const toolCallId = metadata.askQuestionToolCallId;
  return buildAsyncAskQuestionCompletion(typeof toolCallId === "string" ? toolCallId : "", rawArgs, answer);
}
function buildCreatePlanContinuationFrame(pending3, result, sessionKey, cursorSessionID) {
  const metadata = pending3.resultMetadata ?? {};
  const interactionId = metadata.interactionId;
  if (typeof interactionId !== "number") {
    throw new CursorProtocolError("Bridged CreatePlan lost its interaction id");
  }
  const planUri = metadata.planUri;
  if (typeof planUri !== "string" || !planUri.trim()) {
    throw new CursorProtocolError("Bridged CreatePlan lost its plan URI");
  }
  const approved = metadata.createPlanBridgeKind === "approve" ? createPlanApproved(result.output, result.error !== void 0, typeof metadata.createPlanQuestion === "string" ? metadata.createPlanQuestion : "") : result.error === void 0;
  if (!approved) {
    const reason = result.error?.trim();
    return buildCreatePlanInteractionReply(interactionId, {
      error: { error: reason || CREATE_PLAN_NOT_APPROVED_REASON },
      plan_uri: ""
    });
  }
  if (metadata.createPlanBridgeKind === "approve" && !hasPlanExecutionKickoff()) {
    return buildCreatePlanInteractionReply(interactionId, {
      error: { error: "The plan was approved, but this host cannot start its execution turn." },
      plan_uri: planUri
    });
  }
  setActiveCursorMode(sessionKey, "agent");
  if (metadata.createPlanBridgeKind === "approve" && sessionKey) {
    const absolute = typeof metadata.planPath === "string" && metadata.planPath.trim() ? metadata.planPath.trim() : planPathFromUri(planUri);
    const workspaceRoot = typeof metadata.workspaceRoot === "string" ? metadata.workspaceRoot : void 0;
    if (!queuePlanExecutionKickoff({
      sessionID: sessionKey,
      planPath: formatPlanKickoffPath(absolute, workspaceRoot),
      cursorSessionID
    })) {
      return buildCreatePlanInteractionReply(interactionId, {
        error: { error: "The plan was approved, but this host cannot start its execution turn." },
        plan_uri: planUri
      });
    }
  }
  return buildCreatePlanInteractionReply(interactionId, {
    success: {},
    plan_uri: planUri
  });
}
function buildSwitchModeContinuationFrame(pending3, result, sessionKey) {
  const metadata = pending3.resultMetadata ?? {};
  const interactionId = metadata.interactionId;
  if (typeof interactionId !== "number") {
    throw new CursorProtocolError("Bridged SwitchMode lost its interaction id");
  }
  const answer = metadata.switchModeBridgeKind === "question" ? switchModeResultFromQuestionOutput(result.output, result.error !== void 0) : switchModeResultFromToolOutput(result.output, result.error !== void 0);
  if ("approved" in answer) {
    const target = metadata.switchModeTarget;
    if (typeof target === "string" && target.trim()) {
      const normalized = target.trim().toLowerCase();
      setActiveCursorMode(sessionKey, target, {
        bridgedPlanEntered: normalized === "plan" || normalized === "spec"
      });
    }
  }
  return buildSwitchModeInteractionReply(interactionId, answer);
}
function deliverContinuationResults(session, trailingToolResults) {
  const pendingResults = trailingToolResults.filter((r) => r.sessionId === session.sessionId && session.pending.has(r.execId));
  trace(`continuation: ${trailingToolResults.length} trailing tool result(s), ${pendingResults.length} pending for sessionId=${session.sessionId} pending={${[...session.pending.keys()].join(",")}}`);
  for (const r of pendingResults) {
    const claim = sessionManager.claim(session.sessionId, r.execId);
    if ("kind" in claim) {
      if (claim.kind === "deliverable") {
        throw new CursorProtocolError("Cursor continuation claim remained unclaimed");
      }
      if (claim.kind === "duplicate") {
        trace(`continuation: skipped duplicate execId=${r.execId} reason=${claim.reason}`);
        continue;
      }
      trace(`continuation: unavailable execId=${r.execId} reason=${claim.reason}`);
      return void 0;
    }
    const pending3 = claim.pending;
    let frames = [];
    if (pending3.resultField === ASK_QUESTION_RESULT_FIELD) {
      try {
        frames = [buildAskQuestionContinuationFrame(pending3, r)];
      } catch (error) {
        trace(`continuation: ask_question encode FAILED execId=${r.execId} err=${error.message}`);
        sessionManager.close(session, "result-write-failed");
        return void 0;
      }
    } else if (pending3.resultField === SWITCH_MODE_RESULT_FIELD) {
      try {
        frames = [buildSwitchModeContinuationFrame(pending3, r, session.openCodeSessionId)];
      } catch (error) {
        trace(`continuation: switch_mode encode FAILED execId=${r.execId} err=${error.message}`);
        sessionManager.close(session, "result-write-failed");
        return void 0;
      }
    } else if (pending3.resultField === CREATE_PLAN_RESULT_FIELD) {
      try {
        frames = [buildCreatePlanContinuationFrame(pending3, r, session.openCodeSessionId, session.sessionId)];
      } catch (error) {
        trace(`continuation: create_plan encode FAILED execId=${r.execId} err=${error.message}`);
        sessionManager.close(session, "result-write-failed");
        return void 0;
      }
    } else if (!pending3.bridged) {
      try {
        const shellResult = pending3.resultField === "shell_stream" || pending3.resultField === "shell_result" || pending3.resultField === "background_shell_spawn_result" ? consumeCursorShellResult(r.toolCallId, r.output) : void 0;
        const workspaceRoot = workspaceRootFromRequestContext(session.requestContext);
        const correlatedEditCallId = pending3.resultMetadata?.correlatedEditCallId;
        const requestedPath = pending3.resultMetadata?.path;
        const correlatedEdit = !r.error && pending3.resultField === "read_result" && pending3.toolName === "read" && typeof correlatedEditCallId === "string" && typeof requestedPath === "string" ? session.editToolCalls?.get(correlatedEditCallId) : void 0;
        if (correlatedEdit) {
          const absolutePath = path21.resolve(workspaceRoot, requestedPath);
          if (absolutePath === path21.resolve(workspaceRoot, correlatedEdit.path)) {
            frames = buildCompleteEditReadMessages(r.execId, absolutePath, requestedPath) ?? [];
            if (frames.length > 0) {
              correlatedEdit.completeRead = true;
              trace(`continuation: upgraded authorized correlated edit read execId=${r.execId} path=${JSON.stringify(requestedPath)}`);
            }
          }
        }
        if (pending3.toolName === CURSOR_IMAGE_SAVE_TOOL && pending3.resultField === "write_result" && r.error?.includes(IMAGE_PERMISSION_DENIED_PREFIX)) {
          const deniedPath = typeof pending3.resultMetadata?.path === "string" ? pending3.resultMetadata.path : "";
          frames = [encodeMessage("AgentClientMessage", {
            exec_client_message: {
              id: r.execId,
              write_result: {
                permission_denied: {
                  path: deniedPath,
                  directory: deniedPath ? path21.dirname(deniedPath) : "",
                  operation: "write",
                  error: r.error.replace(`${IMAGE_PERMISSION_DENIED_PREFIX} `, ""),
                  is_readonly: false
                }
              }
            }
          })];
        }
        if (frames.length === 0 && !r.error && pending3.toolName === CURSOR_IMAGE_SAVE_TOOL && pending3.resultField === "write_result") {
          frames = [encodeMessage("AgentClientMessage", {
            exec_client_message: {
              id: r.execId,
              write_result: {
                success: {
                  path: typeof pending3.resultMetadata?.path === "string" ? pending3.resultMetadata.path : "",
                  lines_created: 0,
                  file_size: typeof pending3.resultMetadata?.imageByteLength === "number" ? pending3.resultMetadata.imageByteLength : 0
                }
              }
            }
          })];
        }
        if (frames.length === 0) {
          frames = buildExecClientMessages({
            execId: r.execId,
            resultField: pending3.resultField,
            output: shellResult?.output ?? r.output,
            error: r.error,
            toolName: pending3.toolName ?? r.toolName,
            resultMetadata: pending3.resultMetadata,
            shellOutcome: shellResult?.outcome,
            workspaceRoot
          });
        }
      } catch (error) {
        trace(`continuation: result encode FAILED execId=${r.execId} err=${error.message}`);
        sessionManager.close(session, "result-write-failed");
        return void 0;
      }
    }
    const outcome = sessionManager.deliverClaim(claim, frames);
    if (outcome.kind !== "delivered") {
      trace(`continuation: delivery stopped execId=${r.execId} reason=${outcome.reason}`);
      if (outcome.kind === "duplicate")
        continue;
      return void 0;
    }
    session.usageEstimate.inputTokens += estimateTokens(r.output.length);
    if (pending3.bridged) {
      trace(`continuation: completed bridged result execId=${r.execId} toolName=${pending3.toolName ?? r.toolName} outLen=${r.output.length}`);
      continue;
    }
    const resultKind = pending3.resultField === ASK_QUESTION_RESULT_FIELD ? "ask_question answer" : pending3.resultField === SWITCH_MODE_RESULT_FIELD ? "switch_mode answer" : pending3.resultField === CREATE_PLAN_RESULT_FIELD ? "create_plan answer" : "exec result";
    trace(`continuation: wrote ${resultKind} execId=${r.execId} field=${pending3.resultField} frames=${outcome.framesWritten} outLen=${r.output.length}`);
  }
  return session;
}
async function loadAvailableModels() {
  const cacheDir = opencodeGlobalCacheDir();
  try {
    const filePath = cacheFilePath(cacheDir);
    let mtime = 0;
    try {
      const stat7 = await fs7.promises.stat(filePath);
      mtime = stat7.mtimeMs;
    } catch {
    }
    if (mtime !== _availableModelsMtimeMs) {
      const cached = await readCache(cacheDir);
      _availableModels = cached?.models;
      _availableModelsMtimeMs = mtime;
    }
  } catch {
  }
}
function resolveApiBaseURL2(options) {
  return options.apiBaseURL ?? process.env.CURSOR_API_BASE_URL ?? `https://${CURSOR_API_HOST}`;
}
function resolveTelemetryEnabled(options) {
  return options.telemetryEnabled ?? isTruthyEnv(process.env.CURSOR_GET_SERVER_CONFIG_TELEMETRY);
}
function resolveExplicitAgentBaseURL(options) {
  const raw = options.agentBaseURL ?? options.baseURL;
  if (!raw)
    return void 0;
  const normalized = normalizeAgentRunOrigin(raw);
  if (!normalized) {
    throw new CursorProtocolError("Invalid Cursor agent base URL override: expected https://*.cursor.sh");
  }
  return normalized;
}
function isTruthyEnv(value) {
  return value === "1" || value === "true";
}
async function waitForStreamWrites(stream) {
  const pending3 = streamWriteChains.get(stream);
  if (pending3)
    await pending3.catch(() => void 0);
}
async function writeWithBackpressure(stream, message, operation) {
  const previous = streamWriteChains.get(stream);
  const current = (previous ? previous.catch(() => void 0) : Promise.resolve()).then(() => writeWithBackpressureNow(stream, message, operation));
  streamWriteChains.set(stream, current);
  try {
    await current;
  } finally {
    if (streamWriteChains.get(stream) === current)
      streamWriteChains.delete(stream);
  }
}
async function writeWithBackpressureNow(stream, message, operation) {
  let accepted;
  try {
    accepted = stream.write(message);
  } catch (cause) {
    throw toCursorProviderError(cause, {
      replaySafe: false,
      fallback: `Cursor ${operation} write failed`
    });
  }
  if (accepted !== false)
    return;
  trace(`stream write backpressured: operation=${operation} bytes=${message.length}`);
  if (!stream.waitForDrain) {
    throw new CursorTransportError(`Cursor ${operation} write was backpressured`, {
      transient: false,
      replaySafe: false,
      code: "CURSOR_WRITE_BACKPRESSURE"
    });
  }
  try {
    await stream.waitForDrain(5e3);
    trace(`stream write drained: operation=${operation} bytes=${message.length}`);
  } catch (cause) {
    throw toCursorProviderError(cause, {
      replaySafe: false,
      fallback: `Cursor ${operation} backpressure drain failed`
    });
  }
}
async function nextFrameWithSemanticDeadline(session) {
  const remainingMs = session.semanticDeadlineAt - Date.now();
  if (remainingMs <= 0) {
    throw new CursorTransportError(`Cursor semantic-progress timeout after ${session.policy.semanticIdleMs}ms`, { transient: true, replaySafe: true, code: "CURSOR_SEMANTIC_IDLE_TIMEOUT" });
  }
  let timer;
  let rejectCancelled;
  const deadline = new Promise((_, reject) => {
    rejectCancelled = reject;
    timer = setTimeout(() => {
      reject(new CursorTransportError(`Cursor semantic-progress timeout after ${session.policy.semanticIdleMs}ms`, { transient: true, replaySafe: true, code: "CURSOR_SEMANTIC_IDLE_TIMEOUT" }));
    }, remainingMs);
    timer.unref?.();
  });
  session.semanticDeadlineCancel = () => {
    rejectCancelled?.(session.closeError ?? new CursorTransportError("Cursor semantic wait cancelled locally", {
      transient: false,
      replaySafe: false
    }));
  };
  try {
    return await Promise.race([session.frames.next(), deadline]);
  } finally {
    if (timer)
      clearTimeout(timer);
    session.semanticDeadlineCancel = null;
  }
}
async function pump(session, controller, ids, abortSignal) {
  sessionManager.registerSession(session);
  const cacheDiagnostics = session.cacheDiagnostics ??= {
    sessionKey: session.openCodeSessionId,
    conversationId: session.conversationId,
    priorTokenDetails: session.tokenDetails,
    startedWithCheckpoint: !!session.tokenDetails,
    requestContextReused: false,
    requestContextHash: "unavailable",
    checkpointUpdates: 0,
    tokenDetailUpdates: 0,
    pumpPasses: 0,
    stepStarts: 0,
    stepCompletes: 0,
    displayToolCalls: 0,
    execRequests: 0
  };
  cacheDiagnostics.pumpPasses++;
  const { textId, reasoningId } = ids;
  const advertisedToolNames = advertisedToolNamesFromDescriptors(session.toolDescriptors);
  const advertisedToolNameSet = new Set(advertisedToolNames.map((name14) => resolveCustomWebToolAlias(name14, session.toolAliases)));
  let textStarted = false;
  let reasoningStarted = false;
  let assistantText = "";
  let progressContinuationAttempts = 0;
  let emittedHostTools = 0;
  const replaySafety = new AttemptReplaySafety(session.sessionId);
  const failRunProtocol = (message, code) => {
    replaySafety.markBarrier("unknown-or-malformed-frame");
    const error = new CursorProtocolError(message, { code });
    sessionManager.close(session, "remote-error", error);
    throw error;
  };
  const rethrowTransportWriteFailure = (error) => {
    if (error instanceof CursorProviderError && error.origin !== "protocol")
      throw error;
  };
  const writeExecFrames = async (frames, operation) => {
    try {
      for (const frame of frames) {
        await writeWithBackpressure(session.stream, frame, operation);
      }
      return true;
    } catch (error) {
      rethrowTransportWriteFailure(error);
      const wrapped = new Error(`Failed to ${operation}: ${error.message}`);
      trace(`exec: reply FAILED ${wrapped.message}`);
      safeError(wrapped);
      sessionManager.close(session);
      return false;
    }
  };
  let streamClosed = false;
  const safeEnqueue = (part) => {
    if (streamClosed)
      return false;
    try {
      controller.enqueue(part);
      return true;
    } catch (e) {
      streamClosed = true;
      trace(`pump: enqueue on closed controller (suppressing) err=${e.message}`);
      return false;
    }
  };
  const safeError = (err) => {
    if (streamClosed)
      return;
    try {
      controller.error(err);
    } catch (e) {
      trace(`pump: controller.error failed (suppressing) err=${e.message}`);
    }
    streamClosed = true;
  };
  const rejectExec = async (parsed, reason, label) => {
    const groundedReason = appendWorkspaceRootGrounding(reason, workspaceRootFromRequestContext(session.requestContext));
    const ok = await writeExecFrames(buildExecClientMessages({
      execId: parsed.id,
      resultField: parsed.resultField,
      output: "",
      error: groundedReason,
      toolName: parsed.toolName,
      resultMetadata: parsed.resultMetadata,
      workspaceRoot: workspaceRootFromRequestContext(session.requestContext)
    }), `reject ${label} id=${parsed.id}`);
    if (ok)
      trace(`exec: REFUSED ${label} toolName=${parsed.toolName} id=${parsed.id}`);
    return ok;
  };
  const recoverCorrelatedEditRead = (parsed, displayCallId) => {
    if (!displayCallId || parsed.resultField !== "read_result" || parsed.toolName !== "read" || // `apply_patch` is the substitute this host offers when it withholds
    // `write` — the follow-up write_args is remapped onto it either way.
    !(advertisedToolNameSet.has("write") || advertisedToolNameSet.has("apply_patch")))
      return false;
    const stored = session.displayToolCalls.get(displayCallId);
    const display = parseDisplayToolCall(displayCallId, stored);
    if (display?.variant !== "edit_tool_call" || display.bridgeable === false)
      return false;
    const requestedPath = typeof parsed.args.filePath === "string" ? parsed.args.filePath : "";
    const editPath = typeof display.args.path === "string" ? display.args.path : "";
    if (!requestedPath || !editPath)
      return false;
    const workspaceRoot = workspaceRootFromRequestContext(session.requestContext);
    const resolvePath = (value) => path21.resolve(workspaceRoot, value);
    const absolutePath = resolvePath(requestedPath);
    if (absolutePath !== resolvePath(editPath))
      return false;
    let exists4 = true;
    try {
      fs7.lstatSync(absolutePath);
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? error.code : void 0;
      if (code !== "ENOENT")
        return false;
      exists4 = false;
    }
    if (exists4) {
      try {
        const realRoot2 = fs7.realpathSync(workspaceRoot);
        const realTarget = fs7.realpathSync(absolutePath);
        const relative = path21.relative(realRoot2, realTarget);
        if (relative.startsWith(`..${path21.sep}`) || path21.isAbsolute(relative)) {
          parsed.resultMetadata = {
            ...parsed.resultMetadata,
            correlatedEditCallId: displayCallId
          };
          return false;
        }
        const frames = buildCompleteEditReadMessages(parsed.id, absolutePath, requestedPath);
        if (!frames)
          return false;
        for (const frame of frames)
          session.stream.write(frame);
        const editCall = session.editToolCalls?.get(displayCallId);
        if (editCall)
          editCall.completeRead = true;
        trace(`exec: correlated edit read completed directly id=${parsed.id} path=${JSON.stringify(requestedPath)}; awaiting write_args`);
        return true;
      } catch {
        parsed.resultMetadata = {
          ...parsed.resultMetadata,
          correlatedEditCallId: displayCallId
        };
        return false;
      }
    }
    try {
      for (const frame of buildExecClientMessages({
        execId: parsed.id,
        resultField: parsed.resultField,
        output: "",
        toolName: parsed.toolName,
        resultMetadata: { path: requestedPath },
        workspaceRoot
      })) {
        session.stream.write(frame);
      }
      trace(`exec: missing edit target treated as empty file id=${parsed.id} path=${JSON.stringify(requestedPath)}; awaiting write_args`);
      return true;
    } catch (e) {
      const error = new Error(`Failed to recover Cursor edit read: ${e.message}`);
      trace(`exec: edit read recovery FAILED ${error.message}`);
      safeError(error);
      sessionManager.close(session);
      return true;
    }
  };
  const rejectMissingReadTarget = (parsed) => {
    if (parsed.toolName !== "read")
      return false;
    const requested = typeof parsed.args.filePath === "string" ? parsed.args.filePath : "";
    if (!requested)
      return false;
    if (isUriReadTarget(requested)) {
      trace(`exec: forwarding URI read target id=${parsed.id} target=${JSON.stringify(requested)}`);
      return false;
    }
    const workspaceRoot = workspaceRootFromRequestContext(session.requestContext);
    const absolutePath = resolveReadTargetPath(requested, workspaceRoot);
    const readResult = classifyMissingReadTarget(absolutePath);
    if (!readResult)
      return false;
    try {
      for (const frame of buildReadRejectionMessages(parsed.id, readResult)) {
        session.stream.write(frame);
      }
      const kind = Object.keys(readResult)[0];
      trace(`exec: rejected missing read target id=${parsed.id} kind=${kind} path=${JSON.stringify(absolutePath)}`);
      return true;
    } catch (e) {
      const error = new Error(`Failed to reject Cursor read of a missing path: ${e.message}`);
      trace(`exec: missing read rejection FAILED ${error.message}`);
      safeError(error);
      sessionManager.close(session);
      return true;
    }
  };
  const closeOpenSpans = () => {
    for (const part of spanEndParts({ textStarted, reasoningStarted, textId, reasoningId })) {
      safeEnqueue(part);
    }
    reasoningStarted = false;
    textStarted = false;
  };
  const emitText = (text) => {
    if (!text)
      return;
    assistantText += text;
    replaySafety.markBarrier("visible-text");
    if (reasoningStarted && !textStarted) {
      safeEnqueue({ type: "reasoning-end", id: reasoningId });
      reasoningStarted = false;
    }
    if (!textStarted) {
      safeEnqueue({ type: "text-start", id: textId });
      textStarted = true;
    }
    session.usageEstimate.outputTokens += estimateTokens(text.length);
    safeEnqueue({ type: "text-delta", id: textId, delta: text });
  };
  const emitReasoning = (text) => {
    if (!text)
      return;
    replaySafety.markBarrier("visible-reasoning");
    if (!reasoningStarted) {
      safeEnqueue({ type: "reasoning-start", id: reasoningId });
      reasoningStarted = true;
    }
    session.usageEstimate.outputTokens += estimateTokens(text.length);
    safeEnqueue({ type: "reasoning-delta", id: reasoningId, delta: text });
  };
  const emitFinish = (te, reason, settledUsage, settledSource) => {
    closeOpenSpans();
    const est = session.usageEstimate;
    const tokenDetails = session.tokenDetails;
    const occupancyDetails = !te && tokenDetails && tokenDetails.usedTokens > 0 ? tokenDetails : void 0;
    const contextSource = tokenDetails ? session.tokenDetailsFresh ? "checkpoint-current-run" : "checkpoint-previous-turn" : void 0;
    const counters = te ? cursorUsageCountersFromTurnEnded(te) : void 0;
    const usage = settledUsage ?? (te ? tokenDetails ? buildLanguageModelV3UsageFromCounters(counters, {
      contextTotalTokens: tokenDetails.usedTokens,
      priorContextTokens: session.cacheDiagnostics?.priorTokenDetails?.usedTokens
    }) : emptyLanguageModelV3Usage() : occupancyDetails ? occupancyUsageFromTokenDetails(occupancyDetails, session.cacheDiagnostics?.priorTokenDetails) : emptyLanguageModelV3Usage());
    const providerMetadata = te ? cursorTurnEndedProviderMetadata(te, tokenDetails, contextSource) : occupancyDetails && contextSource ? {
      ...OPENCODE_DISPLAY_ONLY_COST_METADATA,
      cursor: {
        usageVersion: 3,
        occupancyOnly: true,
        context: cursorContextUsageMetadata(occupancyDetails, contextSource)
      }
    } : void 0;
    const reasonLabel = typeof reason === "object" && reason && "unified" in reason ? String(reason.unified ?? "unknown") : String(reason);
    const inTotal = usage.inputTokens?.total ?? 0;
    const outTotal = usage.outputTokens?.total ?? 0;
    const occupancySource = occupancyDetails ? `occupancy-${contextSource ?? "unavailable"}` : "intermediate-zero";
    trace(`finish: reason=${reasonLabel} v3In=${inTotal} v3Out=${outTotal} v3CacheRead=${usage.inputTokens?.cacheRead ?? 0} v3CacheWrite=${usage.inputTokens?.cacheWrite ?? 0} v3Reasoning=${usage.outputTokens?.reasoning ?? 0} rawIn=${te ? turnEndedCounter(te, "input_tokens") : est.inputTokens} rawOut=${te ? turnEndedCounter(te, "output_tokens") : est.outputTokens} rawCacheRead=${te ? turnEndedCounter(te, "cache_read") : est.cacheRead} rawCacheWrite=${te ? turnEndedCounter(te, "cache_write") : est.cacheWrite} source=${te ? settledSource ?? (contextSource ?? "unavailable") : occupancySource}`);
    if (counters) {
      trace(formatTurnUsageValidation(counters, usage, tokenDetails, contextSource));
      trace(formatCursorCacheDiagnostics(counters, tokenDetails, cacheDiagnostics.priorTokenDetails, cacheDiagnostics));
    } else if (occupancyDetails) {
      trace(formatTurnUsageValidation({
        inputTokens: occupancyDetails.usedTokens,
        outputTokens: 1,
        cacheRead: session.cacheDiagnostics?.priorTokenDetails?.usedTokens ?? 0,
        cacheWrite: 0,
        reasoningTokens: 0
      }, usage, occupancyDetails, contextSource));
    }
    safeEnqueue({
      type: "finish",
      usage,
      finishReason: reason,
      ...providerMetadata ? { providerMetadata } : {}
    });
  };
  while (true) {
    if (streamClosed) {
      trace(`pump: stream closed (consumer cancelled) pending=${session.pending.size}`);
      sessionManager.closeUnlessPending(session);
      return;
    }
    if (abortSignal?.aborted) {
      trace(`pump: abortSignal aborted pending=${session.pending.size}`);
      sessionManager.closeUnlessPending(session);
      return;
    }
    let next;
    try {
      next = session.pending.size === 0 ? await nextFrameWithSemanticDeadline(session) : await session.frames.next();
    } catch (error) {
      closeOpenSpans();
      const failure = error instanceof CursorProviderError ? error : new CursorRunInterruptedError(`Cursor Run frame stream interrupted: ${error.message}`, { cause: error });
      throw replaySafety.applyTo(failure);
    }
    if (next.done) {
      closeOpenSpans();
      trace("pump: frames iterator ended before turn_ended");
      const failure = new CursorRunInterruptedError();
      throw replaySafety.applyTo(failure);
    }
    const frame = next.value;
    if (frame.flags & 2) {
      let payload2 = "";
      if (frame.payload.length > 0) {
        try {
          payload2 = new TextDecoder().decode(decodeFramePayload(frame));
        } catch {
          replaySafety.markBarrier("unknown-or-malformed-frame");
        }
      }
      closeOpenSpans();
      const failure = payload2 ? connectFrameError(payload2) : new CursorRunInterruptedError();
      throw replaySafety.applyTo(failure);
    }
    let payload;
    try {
      payload = decodeFramePayload(frame);
    } catch (e) {
      replaySafety.markBarrier("unknown-or-malformed-frame");
      trace(`gunzip FAILED (skipping frame): flags=0x${frame.flags.toString(16)} len=${frame.payload.length} err=${e.message}`);
      continue;
    }
    let asm;
    try {
      asm = decodeMessage("AgentServerMessage", payload);
    } catch {
      replaySafety.markBarrier("unknown-or-malformed-frame");
      const channel = responseRequiredChannel(payload);
      if (channel) {
        failRunProtocol(`Cursor ${channel} request could not be decoded`, RUN_REQUEST_DECODE_FAILED);
      }
      trace(`decode FAILED (skipping non-request frame): flags=0x${frame.flags.toString(16)} len=${payload.length}`);
      continue;
    }
    const iu = asm.interaction_update;
    const esm = asm.exec_server_message;
    const kv = asm.kv_server_message;
    const execControl = asm.exec_server_control_message;
    const interactionQuery = asm.interaction_query;
    const checkpointRaw = asm.conversation_checkpoint_update;
    const topField = payload.length > 0 ? payload[0] >> 3 : 0;
    const checkpointProgress = normalizeCheckpointBytes(checkpointRaw);
    const requiredChannel = responseRequiredChannel(payload);
    if (requiredChannel === "multiple" || requiredChannel === "exec" && !esm || requiredChannel === "kv" && !kv || requiredChannel === "interaction" && !interactionQuery) {
      failRunProtocol("Cursor response-requiring request could not be decoded", RUN_REQUEST_DECODE_FAILED);
    }
    const replayFrame = analyzeReplayFrame(payload, {
      interactionUpdate: iu,
      exec: esm,
      kv,
      execControl,
      interactionQuery,
      checkpointBytes: checkpointProgress
    });
    if (replayFrame.semanticProgress) {
      sessionManager.recordSemanticProgress(session);
    }
    if (replayFrame.barrier)
      replaySafety.markBarrier(replayFrame.barrier);
    {
      const iuKind = iu ? Object.keys(iu).find((k) => iu[k]) : void 0;
      trace(`pump frame: topField=${topField} interaction_update=${iuKind ?? "-"} exec=${esm ? "yes" : "no"} kv=${kv ? "yes" : "no"} interaction_query=${interactionQuery ? "yes" : "no"} checkpoint=${checkpointRaw ? "yes" : "no"}`);
    }
    try {
      if (checkpointRaw != null) {
        const bytes = normalizeCheckpointBytes(checkpointRaw);
        if (bytes && bytes.length > 0) {
          cacheDiagnostics.checkpointUpdates++;
          setCheckpoint(session.conversationId, bytes);
          session.resumeCheckpoint = Uint8Array.from(bytes);
          const tokenDetails = decodeConversationTokenDetails(bytes);
          if (tokenDetails) {
            cacheDiagnostics.tokenDetailUpdates++;
            session.tokenDetails = tokenDetails;
            session.tokenDetailsFresh = true;
          }
          const context = tokenDetails ? ` context=${tokenDetails.usedTokens}/${tokenDetails.maxTokens} categories=${formatCursorTokenCategories(tokenDetails)}` : " context=unavailable";
          trace(`checkpoint: stored ${bytes.length}B for conversationId=${session.conversationId}${context}`);
        }
      }
      if (iu?.text_delta) {
        emitText(iu.text_delta.text ?? "");
      } else if (iu?.thinking_delta) {
        emitReasoning(iu.thinking_delta.text ?? "");
      } else if (iu?.turn_ended) {
        trace(`turn_ended raw wire fields: ${debugWalkTurnEnded(payload)}`);
        const turnEnded = iu.turn_ended;
        if (session.openCodeSessionId) {
          await persistConversationState(session.cacheDir ?? opencodeGlobalCacheDir(), {
            sessionKey: session.openCodeSessionId,
            conversationId: session.conversationId,
            requestContext: session.requestContext,
            toolCatalog: session.toolCatalog ?? [],
            postCompactionRebase: session.postCompactionRebase
          }).catch((error) => {
            trace(`conversation persistence: TurnEnded save failed sessionKey=${session.openCodeSessionId}: ${String(error)}`);
          });
        }
        const checkpoint = session.resumeCheckpoint ?? getCheckpoint(session.conversationId);
        if (typeof session.reopenWithUserMessage === "function" && checkpoint && checkpoint.length > 0 && shouldContinueProgressOnlyTurn({
          allowTools: session.allowTools,
          advertisedToolCount: advertisedToolNames.length,
          assistantText,
          emittedHostTools,
          continuationAttempts: progressContinuationAttempts,
          pendingExecs: session.pending.size
        })) {
          progressContinuationAttempts += 1;
          trace("progress-only: continuing attempt=1");
          try {
            await session.reopenWithUserMessage(progressOnlyContinuationPrompt(workspaceRootFromRequestContext(session.requestContext)));
            assistantText = "";
            continue;
          } catch (error) {
            trace(`progress-only: continuation failed, finishing original turn: ${error.message}`);
          }
        }
        emitFinish(turnEnded, { unified: "stop", raw: void 0 });
        sessionManager.close(session);
        return;
      } else if (iu?.tool_call_started) {
        cacheDiagnostics.displayToolCalls++;
        const started = iu.tool_call_started;
        const callId = typeof started.call_id === "string" ? started.call_id : "";
        const toolCall = started.tool_call;
        if (callId && toolCall) {
          session.displayToolCalls.set(callId, toolCall);
          const variant = Object.keys(toolCall).find((k) => k.endsWith("_tool_call")) ?? "?";
          const display = parseDisplayToolCall(callId, toolCall);
          const editPath = display?.variant === "edit_tool_call" && typeof display.args.path === "string" ? display.args.path : void 0;
          if (editPath) {
            const editToolCalls = session.editToolCalls ?? (session.editToolCalls = /* @__PURE__ */ new Map());
            editToolCalls.set(callId, { path: editPath });
          }
          const callIdLog = callId.replace(/\r?\n/g, "\\n");
          let wireFields = "";
          if (variant === "?") {
            const toolBytes = extractProtobufSubmessage(payload, [1, 2, 2]);
            if (toolBytes) {
              wireFields = ` wireFields=[${listProtobufFieldNumbers(toolBytes).join(",")}]`;
            }
          }
          trace(`display tool_call_started: callId=${callIdLog} variant=${variant}${wireFields}`);
        }
      } else if (iu?.tool_call_completed) {
        const completed = iu.tool_call_completed;
        const callId = typeof completed.call_id === "string" ? completed.call_id : "";
        if (callId)
          session.editToolCalls?.delete(callId);
        if (!callId || !session.displayToolCalls.has(callId)) {
          if (callId) {
            trace(`display tool_call_completed: ignore (exec-handled or unknown) callId=${callId}`);
          }
        } else {
          const stored = session.displayToolCalls.get(callId);
          session.displayToolCalls.delete(callId);
          const toolCall = completed.tool_call ?? stored;
          if (!session.allowTools) {
            trace(`display tool_call_completed: SKIPPED (allowTools=false) callId=${callId}`);
          } else {
            const display = parseDisplayToolCall(callId, toolCall);
            const advertised = advertisedToolNamesFromDescriptors(session.toolDescriptors);
            const bridged = display ? resolveBridgedOpenCodeToolCall(display, advertised) : void 0;
            if (!display) {
              const callIdLog = callId.replace(/\r?\n/g, "\\n");
              const toolBytes = extractProtobufSubmessage(payload, [1, 3, 2]);
              const wire = toolBytes ? ` wireFields=[${listProtobufFieldNumbers(toolBytes).join(",")}]` : "";
              trace(`display tool_call_completed: unparsed callId=${callIdLog} keys=[${Object.keys(toolCall).join(",")}]${wire}`);
            } else if (!bridged) {
              trace(`display tool_call_completed: no advertised OpenCode tool callId=${callId} variant=${display.variant} preferred=${display.preferredToolName} advertised=[${advertised.join(",")}]`);
            } else {
              const execId = session.nextBridgedExecId++;
              sessionManager.registerPending(execId, session, "bridged", bridged.toolName, true);
              const toolCallId = `cursor_${session.sessionId}_${execId}`;
              const input2 = JSON.stringify(bridged.args ?? {});
              trace(`display BRIDGED tool-call toolCallId=${toolCallId} toolName=${bridged.toolName} variant=${bridged.variant} callId=${callId} inputLen=${input2.length}`);
              emittedHostTools++;
              closeOpenSpans();
              safeEnqueue({
                type: "tool-call",
                toolCallId,
                toolName: bridged.toolName,
                input: input2
              });
              emitFinish(void 0, { unified: "tool-calls", raw: void 0 });
              return;
            }
          }
        }
      } else if (iu?.step_started) {
        cacheDiagnostics.stepStarts++;
      } else if (iu?.step_completed) {
        cacheDiagnostics.stepCompletes++;
      } else if (esm) {
        cacheDiagnostics.execRequests++;
        const esmId = esm.id ?? 0;
        if (esm.request_context_args) {
          {
            const rc = session.requestContext;
            const skills = Array.isArray(rc.agent_skills) ? rc.agent_skills.length : 0;
            const hooks = typeof rc.hooks_additional_context === "string" ? rc.hooks_additional_context : "";
            trace(`exec request_context: id=${esmId} \u2014 replying context tools=${session.toolDescriptors.length} skills=${skills} hooks=${hooks ? hooks.split("\n").length : 0}`);
            if (hooks)
              trace(`exec request_context hooks_additional_context: ${hooks}`);
          }
          try {
            traceRequestContextPaths(`exec request_context reply id=${esmId}`, session.requestContext);
            await writeWithBackpressure(session.stream, buildRequestContextResult(esmId, session.requestContext), `request-context reply id=${esmId}`);
            trace(`exec request_context: replied`);
          } catch (error) {
            rethrowTransportWriteFailure(error);
            failRunProtocol("Cursor request-context reply failed", RUN_REPLY_FAILED);
          }
        } else if (esm.mcp_state_exec_args) {
          const stateArgs = esm.mcp_state_exec_args;
          const requested = Array.isArray(stateArgs.server_identifiers) ? stateArgs.server_identifiers.join(",") : "";
          try {
            await writeWithBackpressure(session.stream, buildMcpStateResult(esmId, stateArgs, session.requestContext), `MCP-state reply id=${esmId}`);
            trace(`exec mcp_state: replied id=${esmId} requested=[${requested}]`);
          } catch (error) {
            rethrowTransportWriteFailure(error);
            failRunProtocol("Cursor MCP-state reply failed", RUN_REPLY_FAILED);
          }
        } else if (esm.list_mcp_resources_exec_args) {
          const args = esm.list_mcp_resources_exec_args;
          const server = typeof args.server === "string" ? args.server : "";
          try {
            await writeWithBackpressure(session.stream, buildListMcpResourcesFallback(esmId), `list-MCP-resources reply id=${esmId}`);
            trace(`exec list_mcp_resources: replied id=${esmId} server=${server || "(all)"} success{resources:[]}`);
          } catch (error) {
            rethrowTransportWriteFailure(error);
            failRunProtocol("Cursor list_mcp_resources reply failed", RUN_REPLY_FAILED);
          }
        } else if (esm.read_mcp_resource_exec_args) {
          const args = esm.read_mcp_resource_exec_args;
          const server = typeof args.server === "string" ? args.server : "";
          const uri = typeof args.uri === "string" ? args.uri : "";
          try {
            await writeWithBackpressure(session.stream, buildReadMcpResourceFallback(esmId, server, uri), `read-MCP-resource reply id=${esmId}`);
            trace(`exec read_mcp_resource: replied id=${esmId} server=${server} uri=${uri} error{server not found}`);
          } catch (error) {
            rethrowTransportWriteFailure(error);
            failRunProtocol("Cursor read_mcp_resource reply failed", RUN_REPLY_FAILED);
          }
        } else if (esm.git_diff_request) {
          const request = esm.git_diff_request ?? {};
          try {
            const frames = await buildGitDiffExecMessages({
              execId: esmId,
              request,
              workspaceRoot: workspaceRootFromRequestContext(session.requestContext)
            });
            for (const frame2 of frames) {
              await writeWithBackpressure(session.stream, frame2, `git_diff reply id=${esmId}`);
            }
            trace(`exec git_diff: replied id=${esmId}`);
          } catch (error) {
            rethrowTransportWriteFailure(error);
            failRunProtocol("Cursor git_diff reply failed", RUN_REPLY_FAILED);
          }
        } else {
          replaySafety.markBarrier("non-control-exec");
          const displayCallId = extractExecDisplayCallId(esm);
          const parsed = parseExecServerMessage(esm);
          if (parsed) {
            const executableToolName = resolveCustomWebToolAlias(parsed.toolName, session.toolAliases);
            if (executableToolName !== parsed.toolName) {
              trace(`web tool alias resolved: ${parsed.toolName} -> ${executableToolName}`);
              parsed.toolName = executableToolName;
            }
            remapNativeSubagentForCatalog(parsed, advertisedToolNameSet, session.subagentCatalog);
            const editCall = displayCallId ? session.editToolCalls?.get(displayCallId) : void 0;
            if (!editCall?.completeRead)
              rejectPartialReadMutation(parsed);
            if (editCall) {
              const remapped = remapCorrelatedEditWriteForCatalog(parsed, advertisedToolNameSet, editCall.path, workspaceRootFromRequestContext(session.requestContext));
              if (parsed.resultField === "write_result" && displayCallId) {
                session.editToolCalls?.delete(displayCallId);
              }
              if (remapped) {
                trace(`exec: preserved edit intent callId=${displayCallId} path=${JSON.stringify(editCall.path)}`);
              }
            }
            remapEditToolsForCatalog(parsed, advertisedToolNameSet, workspaceRootFromRequestContext(session.requestContext));
          }
          trace(`exec: id=${parsed?.id} variant=${parsed ? Object.keys(parsed).join(",") : "none"} toolName=${parsed?.toolName} resultField=${parsed?.resultField}`);
          if (parsed) {
            if (parsed.localError) {
              if (!await rejectExec(parsed, parsed.localError, "invalid mapping"))
                return;
              continue;
            }
            if (!session.allowTools) {
              const reason = "Tool calls are not available during this turn (summary/compaction).";
              if (!await rejectExec(parsed, reason, "allowTools=false"))
                return;
              continue;
            }
            const binaryWrite = binaryWritePayload(parsed);
            if (binaryWrite) {
              if (!advertisedToolNameSet.has(CURSOR_IMAGE_SAVE_TOOL)) {
                const reason = "This OpenCode agent cannot write binary file content. Do not retry this write with the same bytes.";
                if (!await rejectExec(parsed, reason, "binary write unsupported"))
                  return;
                continue;
              }
              const workspaceRoot = workspaceRootFromRequestContext(session.requestContext);
              const projectDir = ensureOpencodeProjectDir(workspaceRoot);
              const target = remapCursorImageWritePath(binaryWrite.path, {
                workspaceRoot,
                projectDir
              });
              let imageId;
              try {
                imageId = stageCursorImage({
                  path: target,
                  projectDir,
                  mime: imageMimeForPath(target),
                  data: binaryWrite.data,
                  sessionId: session.openCodeSessionId
                });
              } catch (error) {
                if (!await rejectExec(parsed, error.message, "binary write too large"))
                  return;
                continue;
              }
              if (displayCallId)
                session.displayToolCalls.delete(displayCallId);
              sessionManager.registerPending(parsed.id, session, parsed.resultField, CURSOR_IMAGE_SAVE_TOOL, false, {
                ...parsed.resultMetadata,
                path: target,
                binaryWriteBytes: void 0,
                imageByteLength: binaryWrite.data.length
              });
              const toolCallId = `cursor_${session.sessionId}_${parsed.id}`;
              trace(`exec: binary write STAGED toolCallId=${toolCallId} requested=${JSON.stringify(binaryWrite.path)} target=${JSON.stringify(target)} bytes=${binaryWrite.data.length}`);
              emittedHostTools++;
              closeOpenSpans();
              safeEnqueue({
                type: "tool-call",
                toolCallId,
                toolName: CURSOR_IMAGE_SAVE_TOOL,
                input: JSON.stringify({ image_id: imageId })
              });
              emitFinish(void 0, { unified: "tool-calls", raw: void 0 });
              return;
            }
            if (!advertisedToolNameSet.has(parsed.toolName)) {
              const available = advertisedToolNames.length > 0 ? advertisedToolNames.join(", ") : "none";
              const reason = `OpenCode tool '${parsed.toolName}' is unavailable for the current agent. Available tools: ${available}. Continue using only available tools; do not retry '${parsed.toolName}'.`;
              trace(`exec: unavailable catalog target toolName=${parsed.toolName} advertised=[${advertisedToolNames.join(",")}]`);
              if (!await rejectExec(parsed, reason, "unavailable tool"))
                return;
              continue;
            }
            if (recoverCorrelatedEditRead(parsed, displayCallId))
              continue;
            if (rejectMissingReadTarget(parsed)) {
              if (displayCallId)
                session.displayToolCalls.delete(displayCallId);
              continue;
            }
            if (displayCallId) {
              session.displayToolCalls.delete(displayCallId);
              trace(`exec: claimed display callId=${displayCallId}`);
            }
            const tc = buildToolCallPart(parsed, session.sessionId);
            if (parsed.resultField === "shell_stream" || parsed.resultField === "shell_result" || parsed.resultField === "background_shell_spawn_result") {
              registerCursorShellCall(tc.toolCallId, parsed.resultMetadata);
            }
            sessionManager.registerPending(parsed.id, session, parsed.resultField, parsed.toolName, false, parsed.resultMetadata);
            trace(`exec: EMITTED tool-call toolCallId=${tc.toolCallId} toolName=${tc.toolName} inputLen=${tc.input.length}`);
            emittedHostTools++;
            closeOpenSpans();
            safeEnqueue({
              type: "tool-call",
              toolCallId: tc.toolCallId,
              toolName: tc.toolName,
              input: tc.input
            });
            emitFinish(void 0, { unified: "tool-calls", raw: void 0 });
            return;
          }
          const variantField = detectExecVariantField(payload);
          const variant = variantField !== void 0 ? cursorExecVariantByRequestField(variantField) : void 0;
          if (variant?.handling === "unsupported") {
            const advertised = advertisedToolNames.length > 0 ? advertisedToolNames.join(", ") : "none";
            const rawReason = `Cursor-native '${variant.requestName}' is not available on this host. Continue with listed tools: ${advertised}; do not retry '${variant.requestName}'.`;
            const grounded = appendWorkspaceRootGrounding(rawReason, workspaceRootFromRequestContext(session.requestContext));
            const frames = buildUnsupportedExecDeny({ execId: esmId, variant, reason: grounded });
            try {
              for (const frame2 of frames) {
                await writeWithBackpressure(session.stream, frame2, `unsupported deny ${variant.requestName} id=${esmId}`);
              }
            } catch (error) {
              rethrowTransportWriteFailure(error);
              failRunProtocol("Cursor unsupported exec deny reply failed", RUN_REPLY_FAILED);
            }
            trace(`exec: SOFT-DENIED ${variant.requestName} id=${esmId}`);
            continue;
          }
          const variantDescription = describeCursorExecVariant(variantField);
          const hex4 = Array.from(payload.subarray(0, 48)).map((x) => x.toString(16).padStart(2, "0")).join("");
          trace(`exec UNMAPPED: id=${esmId} variant=${variantDescription} keys=[${Object.keys(esm).join(",")}] hex=${hex4}`);
          failRunProtocol(`Unsupported Cursor exec variant ${variantDescription} (id=${esmId})`, RUN_REQUEST_UNSUPPORTED);
        }
      } else if (interactionQuery) {
        const handled = (() => {
          try {
            return handleInteractionQuery(interactionQuery, payload, {
              canBridgeAskQuestion: session.allowTools && advertisedToolNameSet.has("question"),
              allowTools: session.allowTools,
              advertisedTools: advertisedToolNameSet,
              canSaveGeneratedImage: session.allowTools && advertisedToolNameSet.has(CURSOR_IMAGE_SAVE_TOOL),
              canBridgeCreatePlan: session.allowTools && isBridgedCursorPlanModeActive(session.openCodeSessionId) && advertisedToolNameSet.has(CURSOR_PLAN_STAGE_TOOL) && advertisedToolNameSet.has("write"),
              planModeActive: isCursorPlanModeActive(session.openCodeSessionId),
              ...getActiveCursorMode(session.openCodeSessionId) ? { activeCursorModeId: getActiveCursorMode(session.openCodeSessionId) } : {},
              workspaceRoot: workspaceRootFromRequestContext(session.requestContext)
            });
          } catch {
            return failRunProtocol("Cursor interaction request could not be handled", RUN_REQUEST_UNSUPPORTED);
          }
        })();
        try {
          if (handled.outcome === "acknowledged") {
            replaySafety.markBarrier("stateful-interaction");
          }
          if (handled.reply) {
            await writeWithBackpressure(session.stream, handled.reply, `interaction reply id=${handled.id}`);
          }
          trace(`interaction_query: replied id=${handled.id} variant=${handled.variantName} field=${handled.variantField} outcome=${handled.outcome}` + (handled.reply ? "" : " (deferred to host tool result)"));
          if (handled.generateImage) {
            trace(`interaction_query: approved generate_image target=${JSON.stringify(handled.generateImage.filePath || "(unspecified)")} refs=${handled.generateImage.referenceImagePaths.length} cursorToolCallId=${handled.generateImage.toolCallId || "(none)"}`);
          }
        } catch (error) {
          rethrowTransportWriteFailure(error);
          failRunProtocol("Cursor interaction reply failed", RUN_REPLY_FAILED);
        }
        if (handled.outcome === "bridged" && handled.askQuestion) {
          const ask = handled.askQuestion;
          const execId = session.nextBridgedExecId++;
          sessionManager.registerPending(execId, session, ASK_QUESTION_RESULT_FIELD, "question", false, {
            interactionId: handled.id,
            askQuestionArgs: ask.args,
            askQuestionRawArgs: ask.rawArgs,
            askQuestionToolCallId: ask.toolCallId
          });
          const toolCallId = `cursor_${session.sessionId}_${execId}`;
          const input2 = JSON.stringify(askQuestionToolInput(ask.args));
          trace(`interaction_query: BRIDGED ask_question id=${handled.id} toolCallId=${toolCallId} questions=${ask.args.questions.length} runAsync=${ask.args.runAsync} cursorToolCallId=${ask.toolCallId || "(none)"}`);
          emittedHostTools++;
          closeOpenSpans();
          safeEnqueue({
            type: "tool-call",
            toolCallId,
            toolName: "question",
            input: input2
          });
          emitFinish(void 0, { unified: "tool-calls", raw: void 0 });
          return;
        }
        if (handled.outcome === "approved" && handled.switchMode) {
          const sw = handled.switchMode;
          setActiveCursorMode(session.openCodeSessionId, sw.args.targetModeId, {
            bridgedPlanEntered: false
          });
          trace(`interaction_query: APPROVED switch_mode id=${handled.id} target=${JSON.stringify(sw.args.targetModeId)} (no host plan tool; provider-owned mode) cursorToolCallId=${sw.toolCallId || "(none)"}`);
          continue;
        }
        if (handled.outcome === "bridged" && handled.switchMode) {
          const sw = handled.switchMode;
          const bridgeKind = sw.bridge.kind;
          const toolName = sw.toolName ?? "plan_exit";
          const execId = session.nextBridgedExecId++;
          sessionManager.registerPending(execId, session, SWITCH_MODE_RESULT_FIELD, toolName, false, {
            interactionId: handled.id,
            switchModeTarget: sw.args.targetModeId,
            switchModeToolCallId: sw.toolCallId,
            switchModeBridgeKind: bridgeKind
          });
          const toolCallId = `cursor_${session.sessionId}_${execId}`;
          const input2 = JSON.stringify(sw.bridge.kind === "question" ? sw.bridge.input : switchModeToolInput());
          trace(`interaction_query: BRIDGED switch_mode id=${handled.id} toolCallId=${toolCallId} bridge=${bridgeKind} hostTool=${toolName} target=${JSON.stringify(sw.args.targetModeId)} cursorToolCallId=${sw.toolCallId || "(none)"}`);
          emittedHostTools++;
          closeOpenSpans();
          safeEnqueue({
            type: "tool-call",
            toolCallId,
            toolName,
            input: input2
          });
          emitFinish(void 0, { unified: "tool-calls", raw: void 0 });
          return;
        }
        if (handled.outcome === "bridged" && handled.createPlan) {
          const plan = handled.createPlan;
          const staged = plan.bridge.kind === "stage" ? createPlanStageInput(plan.args) : void 0;
          const planUri = staged?.plan_uri ?? plan.planUri ?? "";
          const input2 = staged ?? plan.questionInput ?? {};
          const stageExecId = session.nextBridgedExecId++;
          sessionManager.registerPending(stageExecId, session, CREATE_PLAN_RESULT_FIELD, plan.toolName, false, {
            interactionId: handled.id,
            createPlanToolCallId: plan.toolCallId,
            createPlanBridgeKind: plan.bridge.kind,
            // The host echoes the prompt verbatim; it anchors the answer parse.
            createPlanQuestion: plan.questionInput?.questions[0]?.question ?? "",
            planUri,
            // Absolute path for the post-Yes OpenCode kickoff (plan_exit shape).
            ...typeof plan.planPath === "string" && plan.planPath.trim() ? { planPath: plan.planPath.trim() } : {},
            workspaceRoot: workspaceRootFromRequestContext(session.requestContext)
          });
          const stageToolCallId = `cursor_${session.sessionId}_${stageExecId}`;
          trace(`interaction_query: BRIDGED create_plan id=${handled.id} bridge=${plan.bridge.kind} hostTool=${plan.toolName} stageToolCallId=${stageToolCallId} planUri=${planUri || "(none)"} cursorToolCallId=${plan.toolCallId || "(none)"}`);
          if (plan.planReview)
            emitText(plan.planReview);
          emittedHostTools++;
          closeOpenSpans();
          safeEnqueue({
            type: "tool-call",
            toolCallId: stageToolCallId,
            toolName: plan.toolName,
            input: JSON.stringify(input2)
          });
          emitFinish(void 0, { unified: "tool-calls", raw: void 0 });
          return;
        }
      } else if (kv) {
        trace(`kv frame raw: gunzippedLen=${payload.length} id=${kv.id ?? "?"} get=${!!kv.get_blob_args} set=${!!kv.set_blob_args} getBlobIdLen=${kv.get_blob_args?.blob_id?.length ?? "-"} setBlobIdLen=${kv.set_blob_args?.blob_id?.length ?? "-"} setDataLen=${kv.set_blob_args?.blob_data?.length ?? "-"}`);
        const handled = handleKvServerMessage(kv, session);
        if (handled) {
          try {
            await writeWithBackpressure(session.stream, handled.reply, `KV ${handled.kind}_blob reply id=${handled.id}`);
            trace(`kv replied: kind=${handled.kind} id=${handled.id} blobId=${handled.blobIdHex.slice(0, 16)}\u2026 found=${handled.found} echoed=${!!handled.echoed} replyBytes=${handled.reply.length} replyBlobBytes=${handled.replyBlobBytes} sessionBlobs=${session.blobs.size} convBlobs=${conversationBlobCount(session.conversationId)}`);
          } catch (error) {
            rethrowTransportWriteFailure(error);
            failRunProtocol("Cursor KV reply failed", RUN_REPLY_FAILED);
          }
        } else {
          failRunProtocol("Cursor KV request could not be handled", RUN_REQUEST_UNSUPPORTED);
        }
      }
    } catch (e) {
      if (e instanceof CursorProviderError)
        throw e;
      if (requiredChannel) {
        failRunProtocol(`Cursor ${requiredChannel} request could not be handled`, RUN_REQUEST_UNSUPPORTED);
      }
      trace(`frame dispatch FAILED (skipping): topField=${topField}`);
    }
  }
}
function normalizeCheckpointBytes(raw) {
  if (raw instanceof Uint8Array)
    return raw;
  if (Buffer.isBuffer(raw))
    return new Uint8Array(raw);
  if (Array.isArray(raw))
    return Uint8Array.from(raw);
  if (raw && typeof raw === "object" && "type" in raw && "data" in raw) {
    const data = raw.data;
    if (Array.isArray(data))
      return Uint8Array.from(data);
  }
  return void 0;
}
function extractToolResults(prompt) {
  const out = [];
  for (const msg of prompt) {
    if (msg.role !== "tool" || !Array.isArray(msg.content))
      continue;
    for (const part of msg.content) {
      const p = part;
      if (p.type !== "tool-result")
        continue;
      const toolCallId = p.toolCallId ?? "";
      const parsed = parseExecIdFromToolCallId(toolCallId);
      if (!parsed)
        continue;
      const { text, isError } = toolResultOutputToText(p.output);
      out.push({
        toolCallId,
        sessionId: parsed.sessionId,
        execId: parsed.execId,
        toolName: p.toolName ?? "mcp",
        output: text,
        error: isError ? text : void 0
      });
    }
  }
  return out;
}
function extractTrailingToolResults(prompt) {
  if (prompt.length === 0)
    return [];
  let i = prompt.length - 1;
  while (i >= 0 && prompt[i].role === "tool")
    i--;
  if (i === prompt.length - 1)
    return [];
  return extractToolResults(prompt.slice(i + 1));
}
function toolResultOutputToText(output) {
  if (output == null)
    return { text: "", isError: false };
  if (typeof output === "string")
    return { text: output, isError: false };
  const o = output;
  const isError = typeof o.type === "string" && o.type.startsWith("error");
  if (o.type === "text" || o.type === "error-text") {
    return { text: String(o.value ?? ""), isError };
  }
  if (o.type === "json" || o.type === "error-json") {
    return { text: JSON.stringify(o.value ?? null), isError };
  }
  if (o.type === "content" && Array.isArray(o.value)) {
    const text = o.value.map((c) => {
      const cp = c;
      return cp.type === "text" ? String(cp.text ?? "") : "";
    }).join("");
    return { text, isError };
  }
  return { text: JSON.stringify(output), isError };
}
function extractSystemPrompt(prompt) {
  const parts = [];
  for (const m of prompt) {
    if (m.role === "system" && typeof m.content === "string")
      parts.push(m.content);
  }
  return parts.length > 0 ? parts.join("\n\n") : void 0;
}
function buildOpenCodeInteractionGuidance(tools, isCompaction, workspaceRoot) {
  if (isCompaction)
    return void 0;
  const names = new Set(tools.map((tool) => tool.name));
  if (names.size === 0)
    return void 0;
  const instructions = [];
  const subagents = extractHostSubagentCatalog(tools);
  if (names.has("question")) {
    instructions.push("- When user input is required, call the OpenCode `question` tool. Cursor-native AskQuestion requests are also accepted and answered through it.");
  }
  instructions.push("- Cursor-native CreatePlan is accepted as a Cursor interaction (not an OpenCode or MCP catalog tool). Raise it normally; the provider writes the plan under the host's calculated plans directory and handles execution approval. Do not narrate that CreatePlan is missing, unavailable, or not an MCP tool.");
  if (names.has("plan_enter")) {
    instructions.push("- To enter plan mode, call the OpenCode `plan_enter` tool. Cursor-native SwitchMode requests for plan/spec are also accepted and answered through it.");
  } else if (names.has("todowrite")) {
    instructions.push("- For planning task lists, call the OpenCode `todowrite` tool and/or write the plan as normal markdown.");
  }
  if (names.has("plan_exit")) {
    instructions.push("- To leave plan mode, call the OpenCode `plan_exit` tool. Cursor-native SwitchMode for any non-plan target (agent, build, chat, debug, edit, background, multitask, triage, project, \u2026) is also accepted and answered through it; the provider then injects the Cursor CLI-shaped mode reminder for that target.");
  }
  if (names.has(CUSTOM_WEBSEARCH_TOOL)) {
    instructions.push(`- For web searches, call \`${CUSTOM_WEBSEARCH_TOOL}\`; do not use Cursor's native WebSearch interaction.`);
  }
  if (names.has(CUSTOM_WEBFETCH_TOOL)) {
    instructions.push(`- To fetch a known URL, call \`${CUSTOM_WEBFETCH_TOOL}\`; do not use Cursor's native WebFetch interaction.`);
  }
  if (names.has(CUSTOM_LIST_MCP_RESOURCES_TOOL)) {
    instructions.push(`- To list MCP resources, call \`${CUSTOM_LIST_MCP_RESOURCES_TOOL}\`; do not use Cursor's native resource-listing interaction.`);
  }
  if (names.has(CUSTOM_READ_MCP_RESOURCE_TOOL)) {
    instructions.push(`- To read an MCP resource, call \`${CUSTOM_READ_MCP_RESOURCE_TOOL}\`; do not use Cursor's native resource-reading interaction.`);
  }
  if (names.has("task")) {
    const target = "`task`";
    const available = subagents.agents.map((agent) => `\`${agent.name}\``).join(", ");
    instructions.push(`- Native Cursor Task/subagent requests are executed through OpenCode ${target}. Advertised custom subagent names are used exactly; otherwise \`unspecified\` and \`generalPurpose\` select host \`general\`, \`bugbot\`, \`security-review\`, and \`explore\` select host \`explore\` (then \`general\`), and other specialized Cursor types fall back to \`general\`.` + (available ? ` Spawnable host agents this turn: ${available}.` : ""));
    if (subagents.agents.some((agent) => agent.name === "scout")) {
      instructions.push("- Host `scout` is available for external documentation and dependency-source research. Use Cursor `cursor-guide` for that use case; local repository discovery still uses `bugbot`/`explore`.");
    }
  }
  if (names.has("write")) {
    instructions.push(names.has("edit") ? "- For file changes, use OpenCode `edit` for targeted changes to existing files and `write` to create files or intentionally replace complete contents; do not use shell, Python, or heredocs to change file content while these tools are available." : "- Use OpenCode `write` for file-content changes; do not use shell, Python, or heredocs to change file content while it is available.");
  } else if (names.has("apply_patch")) {
    instructions.push("- Use OpenCode `apply_patch` for file-content changes; do not use shell, Python, or heredocs to change file content while it is available. Cursor-native write and edit requests are accepted and converted to `apply_patch` automatically.");
  }
  if (names.has("edit") || names.has("write") || names.has("apply_patch")) {
    instructions.push("- Never use a read result as complete file content when it says the output is capped, partial, or requires another offset. Read the remaining ranges first, or make a targeted edit/patch from complete context; do not pass a partial read back as a whole-file replacement.");
  }
  return [
    `OpenCode exposes exactly these executable tools for this turn: ${[...names].map((name14) => `\`${name14}\``).join(", ")}.`,
    `Workspace root: ${JSON.stringify(workspaceRoot)}. Resolve workspace paths against exactly this root; never invent an absolute prefix, and verify uncertain paths with an available tool before using them.`,
    subagents.executor ? "Call only tools in that exact list for ordinary host execution. Cursor-native Task/subagent requests are permitted because a compatible host executor is listed. Bridged Cursor interactions named below (AskQuestion, SwitchMode, CreatePlan, \u2026) are not OpenCode/MCP catalog tools \u2014 raise them normally and do not narrate that they are missing." : "Call only tools in that exact list for ordinary host execution. Bridged Cursor interactions named below (AskQuestion, SwitchMode, CreatePlan, \u2026) are not OpenCode/MCP catalog tools \u2014 raise them normally and do not narrate that they are missing. Other unlisted Cursor-native tools are not bridged; complete the work with the listed tools or explain the limitation without claiming a missing MCP tool.",
    ...instructions.length > 0 ? ["Use these OpenCode tools instead of equivalent Cursor-native UI interactions:"] : [],
    ...instructions,
    "Emit the actual tool call and wait for its result; never merely claim or summarize that a tool was used.",
    'A progress update such as "Checking\u2026", "Inspecting\u2026", or "Let me look\u2026" is not a final answer.',
    "After progress narration, call a listed tool in the same turn; if no tool is needed, provide the complete user-facing answer before finishing.",
    "Never end a turn with progress narration alone."
  ].join("\n");
}
function estimateTokens(chars) {
  if (!Number.isFinite(chars) || chars <= 0)
    return 0;
  return Math.ceil(chars / 4);
}
function cursorTurnEndedProviderMetadata(te, tokenDetails, contextSource) {
  return {
    cursor: {
      usageVersion: 3,
      inputTokensRaw: turnEndedCounter(te, "input_tokens"),
      outputTokensRaw: turnEndedCounter(te, "output_tokens"),
      cacheReadRaw: turnEndedCounter(te, "cache_read"),
      cacheWriteRaw: turnEndedCounter(te, "cache_write"),
      reasoningTokensRaw: turnEndedCounter(te, "reasoning_tokens"),
      ...tokenDetails ? { context: cursorContextUsageMetadata(tokenDetails, contextSource) } : {}
    }
  };
}
function extractPromptHistory(prompt, options) {
  const out = [];
  const toolResults = options?.toolResults ?? "omit";
  let trailingToolStart = prompt.length;
  if (toolResults === "trailing") {
    while (trailingToolStart > 0 && prompt[trailingToolStart - 1]?.role === "tool") {
      trailingToolStart--;
    }
  }
  for (let messageIndex = 0; messageIndex < prompt.length; messageIndex++) {
    const m = prompt[messageIndex];
    if (m.role === "system") {
      if (typeof m.content === "string" && m.content.length > 0) {
        out.push({ role: "system", content: m.content });
      }
      continue;
    }
    if (m.role === "user") {
      const text = extractUserText(m);
      if (text && text !== ".")
        out.push({ role: "user", content: text });
      continue;
    }
    if (m.role === "assistant") {
      const text = extractAssistantHistoryText(m);
      if (text)
        appendSeedHistory(out, "assistant", text);
      continue;
    }
    if (m.role === "tool" && Array.isArray(m.content)) {
      if (toolResults === "omit" || toolResults === "trailing" && messageIndex < trailingToolStart)
        continue;
      const results = [];
      for (const part of m.content) {
        const p = part;
        if (p.type !== "tool-result")
          continue;
        const toolName = typeof p.toolName === "string" && p.toolName ? p.toolName : "tool";
        const toolCallId = typeof p.toolCallId === "string" ? p.toolCallId : "";
        const result = toolResultOutputToText(p.output);
        results.push(formatSeedToolObservation({
          toolName,
          toolCallId,
          output: result.text,
          isError: result.isError
        }));
      }
      if (results.length > 0)
        appendSeedHistory(out, "user", results.join("\n\n"));
    }
  }
  if (!options?.preserveTrailingUser && out.length > 0 && out[out.length - 1].role === "user") {
    out.pop();
  }
  return out;
}
function formatSeedToolObservation(input2) {
  const metadata = JSON.stringify({
    source: "opencode-tool",
    tool: input2.toolName,
    callId: input2.toolCallId,
    status: input2.isError ? "error" : "completed"
  });
  return `OpenCode host observation ${metadata}:
${input2.output}`;
}
function extractAssistantHistoryText(msg) {
  const content = msg.content;
  if (typeof content === "string")
    return content;
  if (!Array.isArray(content))
    return "";
  const texts = [];
  for (const part of content) {
    const p = part;
    if (p.type === "text" && typeof p.text === "string" && p.text.length > 0) {
      texts.push(p.text);
    }
  }
  return texts.join("\n");
}
function appendSeedHistory(out, role, content) {
  if (!content)
    return;
  const last = out[out.length - 1];
  if (last?.role === role) {
    last.content += `

${content}`;
    return;
  }
  out.push({ role, content });
}
function opencodeSessionKey(callOptions) {
  const h = callOptions.headers ?? {};
  const raw = h["x-session-id"] ?? h["X-Session-Id"] ?? h["x-session-affinity"] ?? h["x-opencode-session"];
  if (typeof raw === "string" && raw.trim().length > 0)
    return raw.trim();
  return void 0;
}
function extractTools(callOptions) {
  const tools = callOptions.tools;
  if (!tools || tools.length === 0) {
    trace("extractTools: callOptions.tools empty/missing");
    return [];
  }
  const out = [];
  for (const t of tools) {
    const any = t;
    if (any.type === "function" || any.name && any.inputSchema !== void 0) {
      if (!any.name)
        continue;
      out.push({ name: any.name, description: any.description, inputSchema: any.inputSchema });
    }
  }
  trace(`extractTools: ${tools.length} incoming \u2192 ${out.length} advertised [${out.map((t) => t.name).join(",")}]`);
  return out;
}
function spanEndParts(opts) {
  const out = [];
  if (opts.reasoningStarted)
    out.push({ type: "reasoning-end", id: opts.reasoningId });
  if (opts.textStarted)
    out.push({ type: "text-end", id: opts.textId });
  return out;
}
function toolsInFixedOrder(tools) {
  return tools.map((tool) => ({ ...tool })).sort((left, right) => (left.name ?? "").localeCompare(right.name ?? ""));
}
function computeAllowTools(toolCount, toolChoice2) {
  return toolCount > 0 && toolChoice2?.type !== "none";
}
async function resolveTurnToolState(input2) {
  const { sessionKey, incomingTools, isCompaction } = input2;
  if (sessionKey && incomingTools.length > 0) {
    rememberToolCatalog(sessionKey, toolsInFixedOrder(incomingTools));
  }
  let advertisedTools;
  if (incomingTools.length > 0) {
    advertisedTools = toolsInFixedOrder(incomingTools);
  } else if (sessionKey) {
    const cached = toolCatalogBySession.get(sessionKey) ?? await waitForSiblingToolCatalog(sessionKey, input2.abortSignal);
    advertisedTools = toolsInFixedOrder(cached);
  } else {
    advertisedTools = [];
  }
  return {
    advertisedTools,
    allowTools: !isCompaction && computeAllowTools(incomingTools.length, input2.toolChoice)
  };
}
function resolveTurnConversationReset(input2) {
  const { sessionKey, isCompaction } = input2;
  if (isCompaction) {
    if (sessionKey)
      rememberPostCompactionRebase(sessionKey);
    return { reset: true, reason: "compaction" };
  }
  if (sessionKey && postCompactionRebaseBySession.delete(sessionKey)) {
    return { reset: true, reason: "post-compaction-rebase" };
  }
  return { reset: false };
}
function extractUserText(lastUser) {
  if (!lastUser)
    return ".";
  const content = lastUser.content;
  if (typeof content === "string")
    return content;
  if (Array.isArray(content)) {
    const texts = [];
    for (const part of content) {
      const p = part;
      if (p.type === "text" && typeof p.text === "string")
        texts.push(p.text);
    }
    if (texts.length > 0)
      return texts.join("\n");
  }
  return ".";
}
function foldStreamParts(parts) {
  let text = "";
  let reasoning = "";
  const content = [];
  let finishReason2 = { unified: "stop", raw: void 0 };
  let providerMetadata;
  let usage = {
    inputTokens: { total: void 0, noCache: void 0, cacheRead: void 0, cacheWrite: void 0 },
    outputTokens: { total: void 0, text: void 0, reasoning: void 0 }
  };
  for (const part of parts) {
    if (part.type === "text-delta")
      text += part.delta;
    else if (part.type === "reasoning-delta")
      reasoning += part.delta;
    else if (part.type === "tool-call") {
      content.push({
        type: "tool-call",
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        input: part.input
      });
    } else if (part.type === "finish") {
      finishReason2 = part.finishReason;
      usage = part.usage;
      providerMetadata = part.providerMetadata;
    }
  }
  if (reasoning)
    content.unshift({ type: "reasoning", text: reasoning });
  if (text)
    content.unshift({ type: "text", text });
  return {
    content,
    finishReason: finishReason2,
    usage,
    warnings: [],
    ...providerMetadata ? { providerMetadata } : {}
  };
}
var _availableModels, _availableModelsMtimeMs, toolCatalogBySession, sentHistoryImageHashesBySession, postCompactionRebaseBySession, MAX_TURN_STATE_SESSIONS, MAX_SENT_HISTORY_IMAGES_PER_SESSION, DEFAULT_RETRY_POLICY, MAX_RETRY_ATTEMPTS, MAX_RETRY_DELAY_MS, RUN_REQUEST_DECODE_FAILED, RUN_REQUEST_UNSUPPORTED, RUN_REPLY_FAILED, MAX_CHECKPOINT_BLOB_GRAPH_BYTES, RESPONSE_REQUIRED_CHANNEL_BY_FIELD, toolCatalogWaitersBySession, heartbeatWritePendingBySession, heartbeatGenerationBySession, streamWriteChains;
var init_language_model = __esm({
  "node_modules/cursor-opencode-provider/dist/language-model.js"() {
    init_connect();
    init_debug();
    init_request();
    init_framing();
    init_messages();
    init_tools();
    init_git_diff();
    init_exec_variants();
    init_workspace_grounding();
    init_progress_continuation();
    init_tool_call_bridge();
    init_kv();
    init_interactions();
    init_ask_question();
    init_switch_mode();
    init_create_plan();
    init_plan_execution_kickoff();
    init_generate_image();
    init_image_staging();
    init_image_save();
    init_checkpoint();
    init_token_details();
    init_blob_store();
    init_conversation_bind();
    init_conversation_state();
    init_conversation_persistence();
    init_session();
    init_errors();
    init_models();
    init_frozen();
    init_env();
    init_paths();
    init_agent_url();
    init_shared();
    init_compaction_marker();
    init_session_directory();
    init_image_input();
    init_model_metadata();
    init_shell_timeout();
    init_replay_safety();
    init_struct();
    init_usage();
    init_conversation_bind();
    _availableModelsMtimeMs = -1;
    toolCatalogBySession = /* @__PURE__ */ new Map();
    sentHistoryImageHashesBySession = /* @__PURE__ */ new Map();
    postCompactionRebaseBySession = /* @__PURE__ */ new Set();
    MAX_TURN_STATE_SESSIONS = 256;
    MAX_SENT_HISTORY_IMAGES_PER_SESSION = 256;
    DEFAULT_RETRY_POLICY = {
      maxAttempts: 3,
      baseDelayMs: 500,
      maxDelayMs: 8e3
    };
    MAX_RETRY_ATTEMPTS = 10;
    MAX_RETRY_DELAY_MS = 3e4;
    RUN_REQUEST_DECODE_FAILED = "CURSOR_RUN_REQUEST_DECODE_FAILED";
    RUN_REQUEST_UNSUPPORTED = "CURSOR_RUN_REQUEST_UNSUPPORTED";
    RUN_REPLY_FAILED = "CURSOR_RUN_REPLY_FAILED";
    MAX_CHECKPOINT_BLOB_GRAPH_BYTES = 100 * 1024 * 1024;
    RESPONSE_REQUIRED_CHANNEL_BY_FIELD = /* @__PURE__ */ new Map([
      [2, "exec"],
      [4, "kv"],
      [7, "interaction"]
    ]);
    toolCatalogWaitersBySession = /* @__PURE__ */ new Map();
    heartbeatWritePendingBySession = /* @__PURE__ */ new WeakMap();
    heartbeatGenerationBySession = /* @__PURE__ */ new WeakMap();
    streamWriteChains = /* @__PURE__ */ new WeakMap();
  }
});

// node_modules/cursor-opencode-provider/dist/plugin-core.js
function createSdk(options) {
  const providerId = options.name || CURSOR_PROVIDER_ID;
  return {
    languageModel(modelId) {
      return createCursorLanguageModel(modelId, providerId, options);
    }
  };
}
function cursorApiBaseURL() {
  return process.env.CURSOR_API_BASE_URL ?? `https://${CURSOR_API_HOST}`;
}
function cursorGetServerConfigTelemetryEnabled() {
  return process.env.CURSOR_GET_SERVER_CONFIG_TELEMETRY === "1" || process.env.CURSOR_GET_SERVER_CONFIG_TELEMETRY === "true";
}
var init_plugin_core = __esm({
  "node_modules/cursor-opencode-provider/dist/plugin-core.js"() {
    init_shared();
    init_language_model();
  }
});

// node_modules/cursor-opencode-provider/dist/pricing.js
function wireModelIdForPricing(modelId) {
  const match = /^(.*)-1m(?:-\d+)?(-fast)?$/.exec(modelId);
  if (match) {
    return { baseId: `${match[1]}${match[2] ?? ""}`, longContextEntry: true };
  }
  return { baseId: modelId, longContextEntry: false };
}
function hasCursorFastPricing(modelId) {
  return Object.prototype.hasOwnProperty.call(CURSOR_MODEL_COSTS, `${modelId}-fast`);
}
function asMutableCost(value) {
  const copy = { input: value.input, output: value.output };
  if (value.cache_read !== void 0)
    copy.cache_read = value.cache_read;
  if (value.cache_write !== void 0)
    copy.cache_write = value.cache_write;
  if (value.context_over_200k) {
    copy.context_over_200k = asMutableCost(value.context_over_200k);
  }
  return copy;
}
function getCursorModelCost(modelId) {
  const { baseId } = wireModelIdForPricing(modelId);
  const found = CURSOR_MODEL_COSTS[baseId];
  if (!found)
    return void 0;
  return asMutableCost(found);
}
function applyCursorModelCost(modelId, entry) {
  const modelCost = getCursorModelCost(modelId);
  if (!modelCost)
    return entry;
  return { ...entry, cost: modelCost };
}
var CURSOR_UNPRICED_MODEL_IDS, UNPRICED;
var init_pricing = __esm({
  "node_modules/cursor-opencode-provider/dist/pricing.js"() {
    init_pricing_data();
    CURSOR_UNPRICED_MODEL_IDS = ["default"];
    UNPRICED = new Set(CURSOR_UNPRICED_MODEL_IDS);
  }
});

// node_modules/cursor-opencode-provider/dist/model-config.js
function stripMarkupTags(value) {
  const chunks = [];
  let cursor = 0;
  while (cursor < value.length) {
    const start = value.indexOf("<", cursor);
    if (start === -1) {
      chunks.push(value.slice(cursor));
      break;
    }
    chunks.push(value.slice(cursor, start));
    const end = value.indexOf(">", start + 1);
    if (end === -1) {
      chunks.push(value.slice(start));
      break;
    }
    cursor = end + 1;
  }
  return chunks.join("");
}
function safeLabel(value) {
  return stripMarkupTags(value).replace(/[()<>&"'`]/g, "").replace(/\s+/g, " ").trim() || "default";
}
function baseName(mi) {
  return safeLabel(mi.displayName ?? mi.id);
}
function modelInfoVariants(mi, variants) {
  if (variants.length === 0)
    return void 0;
  const entries = {};
  const usedKeys = /* @__PURE__ */ new Set();
  const baseName2 = safeLabel(mi.displayName ?? mi.id);
  const tagDims = (p) => {
    const labels = [];
    for (const d of p) {
      if (d.id === "fast" && d.value === "true")
        labels.push("Fast");
      else if (d.id === "thinking" && d.value === "true")
        labels.push("Thinking");
      else if (d.id === "context")
        labels.push(d.value);
    }
    if (labels.length > 0)
      return ` ${labels.join(" ")}`;
    if (p.length === 0)
      return "";
    return " default";
  };
  for (const v of variants) {
    const sanitized = safeLabel(v.displayName || v.key || "default");
    let key = sanitized;
    if (key === baseName2 && !usedKeys.has(key)) {
      key = `${baseName2}${tagDims(v.parameterValues)}` || `${baseName2} default`;
    } else if (usedKeys.has(key)) {
      key = `${sanitized}${tagDims(v.parameterValues)}`;
    }
    let n = 2;
    while (usedKeys.has(key))
      key = `${sanitized}${tagDims(v.parameterValues)} ${n++}`;
    usedKeys.add(key);
    entries[key] = {
      [CURSOR_VARIANT_PARAMETERS_KEY]: v.parameterValues.map((p) => ({ ...p }))
    };
  }
  return entries;
}
function isLongContextVariant2(v) {
  return v.parameterValues.some((p) => p.id === "context" && parseCursorContextLimit(p.value) === 1e6);
}
function isFastVariant(v) {
  return v.parameterValues.some((p) => p.id === "fast" && p.value === "true");
}
function variantsForTier(mi, tier) {
  return mi.variants.filter((v) => isLongContextVariant2(v) === (tier === "long"));
}
function thinkingSuffixBaseNames(models) {
  const flags = /* @__PURE__ */ new Map();
  for (const m of models) {
    const base = baseName(m);
    const entry = flags.get(base) ?? { hasThinking: false, hasNonThinking: false };
    if (m.supportsThinking)
      entry.hasThinking = true;
    else
      entry.hasNonThinking = true;
    flags.set(base, entry);
  }
  const ambiguous = /* @__PURE__ */ new Set();
  for (const [base, f] of flags)
    if (f.hasThinking && f.hasNonThinking)
      ambiguous.add(base);
  return ambiguous;
}
function modelInfoToConfig(mi, options = {}) {
  const contextTier = options.contextTier ?? "base";
  const variants = options.variants ?? variantsForTier(mi, contextTier);
  let name14 = baseName(mi);
  if (options.thinkingSuffix)
    name14 += " Thinking";
  if (options.fast)
    name14 += " Fast";
  if (contextTier === "long")
    name14 += " 1M";
  const documentedContext = getDocumentedCursorModelContext(mi.id);
  const context = contextTier === "long" ? mi.maxContextForMaxMode ?? documentedContext?.maxContextForMaxMode ?? 1e6 : mi.maxContext ?? documentedContext?.maxContext ?? 2e5;
  const output = contextTier === "long" ? 128e3 : 32e3;
  const supportsImages = resolveCursorModelSupportsImages(mi.id, mi.supportsImages);
  const config = {
    name: name14,
    attachment: supportsImages,
    reasoning: mi.supportsThinking ?? false,
    tool_call: mi.supportsAgent ?? true,
    temperature: false,
    modalities: {
      input: supportsImages ? ["text", "image"] : ["text"],
      output: ["text"]
    },
    limit: {
      context,
      output
    }
  };
  const variantConfig = modelInfoVariants(mi, variants);
  if (variantConfig)
    config.variants = variantConfig;
  if (contextTier === "long" || options.fast) {
    const defaultVariant = contextTier === "long" ? variants.find((v) => v.isDefaultMax) ?? variants[0] : variants.find((v) => v.isDefaultNonMax) ?? variants[0];
    if (defaultVariant) {
      config.options = {
        [CURSOR_WIRE_MODEL_ID_KEY]: mi.id,
        [CURSOR_VARIANT_PARAMETERS_KEY]: defaultVariant.parameterValues.map((p) => ({ ...p }))
      };
    }
  }
  return config;
}
function speedGroups(variants, splitFast) {
  if (!splitFast)
    return variants.length > 0 ? [{ fast: false, variants }] : [];
  const slow = variants.filter((variant) => !isFastVariant(variant));
  const fast = variants.filter((variant) => isFastVariant(variant));
  const groups = [];
  if (slow.length > 0)
    groups.push({ fast: false, variants: slow });
  if (fast.length > 0)
    groups.push({ fast: true, variants: fast });
  return groups;
}
function uniqueCatalogId(usedIds, modelId, suffix) {
  let id = `${modelId}${suffix}`;
  if (!usedIds.has(id)) {
    usedIds.add(id);
    return id;
  }
  let n = 2;
  while (true) {
    const candidate = suffix === "-fast" ? `${modelId}-fast-${n}` : suffix === "-1m-fast" ? `${modelId}-1m-${n}-fast` : `${modelId}-1m-${n}`;
    if (!usedIds.has(candidate)) {
      usedIds.add(candidate);
      return candidate;
    }
    n++;
  }
}
function modelsToConfig(models) {
  const ambiguous = thinkingSuffixBaseNames(models);
  const out = {};
  const usedIds = new Set(models.map((m) => m.id));
  for (const m of models) {
    const thinkingSuffix = !!m.supportsThinking && ambiguous.has(baseName(m));
    const splitFast = hasCursorFastPricing(m.id);
    const groups = [];
    for (const contextTier of ["base", "long"]) {
      const suffixFor = (fast) => contextTier === "long" ? fast ? "-1m-fast" : "-1m" : fast ? "-fast" : "";
      for (const group of speedGroups(variantsForTier(m, contextTier), splitFast)) {
        groups.push({
          contextTier,
          fast: group.fast,
          variants: group.variants,
          suffix: suffixFor(group.fast)
        });
      }
    }
    if (groups.length === 0) {
      out[m.id] = applyCursorModelCost(m.id, modelInfoToConfig(m, { thinkingSuffix, contextTier: "base" }));
      continue;
    }
    const primaryIndex = groups.findIndex((group) => group.suffix === "");
    const primary = primaryIndex >= 0 ? primaryIndex : 0;
    for (const [index, group] of groups.entries()) {
      const catalogId = index === primary ? m.id : uniqueCatalogId(usedIds, m.id, group.suffix || "-fast");
      const pricingId = group.fast ? `${m.id}-fast` : group.contextTier === "long" ? `${m.id}-1m` : m.id;
      const config = modelInfoToConfig(m, {
        thinkingSuffix,
        contextTier: group.contextTier,
        variants: group.variants,
        fast: group.fast
      });
      if (catalogId !== m.id && !config.options) {
        const defaultVariant = (group.contextTier === "long" ? group.variants.find((v) => v.isDefaultMax) : group.variants.find((v) => v.isDefaultNonMax)) ?? group.variants[0];
        if (defaultVariant) {
          config.options = {
            [CURSOR_WIRE_MODEL_ID_KEY]: m.id,
            [CURSOR_VARIANT_PARAMETERS_KEY]: defaultVariant.parameterValues.map((p) => ({ ...p }))
          };
        }
      }
      out[catalogId] = applyCursorModelCost(pricingId, config);
    }
  }
  return out;
}
var init_model_config = __esm({
  "node_modules/cursor-opencode-provider/dist/model-config.js"() {
    init_models();
    init_pricing();
    init_model_metadata();
  }
});

// node_modules/cursor-opencode-provider/dist/context/auth-store.js
import { readFile as readFile7 } from "node:fs/promises";
import path22 from "node:path";
function debugEnabled() {
  return process.env.CURSOR_PROVIDER_DEBUG === "1" || process.env.CURSOR_PROVIDER_DEBUG === "true";
}
function debugAuthStore(message) {
  if (!debugEnabled())
    return;
  console.debug(`[cursor-opencode-provider] auth-store: ${message}`);
}
async function readStoredAuth(providerId) {
  if (process.env.OPENCODE_AUTH_CONTENT) {
    try {
      const data = JSON.parse(process.env.OPENCODE_AUTH_CONTENT);
      return asStoredAuth(data[providerId]);
    } catch {
      debugAuthStore("OPENCODE_AUTH_CONTENT is not valid JSON");
      return void 0;
    }
  }
  const filePath = path22.join(hostGlobalDataDir(), "auth.json");
  try {
    const raw = await readFile7(filePath, "utf-8");
    try {
      const data = JSON.parse(raw);
      return asStoredAuth(data[providerId]);
    } catch {
      debugAuthStore("auth.json is not valid JSON");
      return void 0;
    }
  } catch (err) {
    const code = err?.code;
    if (code !== "ENOENT") {
      debugAuthStore(`failed to read auth.json (${code ?? "unknown"})`);
    }
    return void 0;
  }
}
function asStoredAuth(value) {
  if (!value || typeof value !== "object")
    return void 0;
  const v = value;
  if (v.type === "oauth" && typeof v.access === "string" && typeof v.refresh === "string" && typeof v.expires === "number") {
    return value;
  }
  if (v.type === "api" && typeof v.key === "string") {
    return value;
  }
  return void 0;
}
var init_auth_store = __esm({
  "node_modules/cursor-opencode-provider/dist/context/auth-store.js"() {
    init_paths();
  }
});

// node_modules/cursor-opencode-provider/dist/web-tools.js
function exaMcpUrl() {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey)
    return EXA_MCP_URL;
  const url = new URL(EXA_MCP_URL);
  url.searchParams.set("exaApiKey", apiKey);
  return url.href;
}
function mcpText(value) {
  if (!value || typeof value !== "object")
    return void 0;
  const result = value.result;
  if (!result || typeof result !== "object")
    return void 0;
  const content = result.content;
  if (!Array.isArray(content))
    return void 0;
  for (const item of content) {
    if (item && typeof item === "object" && item.type === "text" && typeof item.text === "string") {
      return item.text;
    }
  }
  return void 0;
}
function parseOpenCodeWebSearchResponse(raw) {
  const trimmed = raw.trim();
  if (!trimmed)
    return void 0;
  try {
    const text = mcpText(JSON.parse(trimmed));
    if (text)
      return text;
  } catch {
  }
  for (const line of raw.split("\n")) {
    if (!line.startsWith("data: "))
      continue;
    try {
      const text = mcpText(JSON.parse(line.slice(6)));
      if (text)
        return text;
    } catch {
    }
  }
  return void 0;
}
async function fetchOpenCodeWebSearchText(args, signal, fetchImpl = fetch) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted)
    abort();
  else
    signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => controller.abort(new Error("Web search timed out")), WEB_SEARCH_TIMEOUT_MS);
  try {
    const response = await fetchImpl(exaMcpUrl(), {
      method: "POST",
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "web_search_exa",
          arguments: {
            query: args.query,
            type: args.type ?? "auto",
            numResults: args.numResults ?? 8,
            livecrawl: args.livecrawl ?? "fallback",
            contextMaxCharacters: args.contextMaxCharacters
          }
        }
      }),
      signal: controller.signal
    });
    const raw = await response.text();
    if (!response.ok)
      throw new Error(`Web search failed (${response.status}): ${raw.slice(0, 500)}`);
    return parseOpenCodeWebSearchResponse(raw) ?? "No search results found. Please try a different query.";
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
async function executeOpenCodeWebSearch(args, context, fetchImpl = fetch) {
  await context.ask({
    permission: "websearch",
    patterns: [args.query],
    always: ["*"],
    metadata: {
      query: args.query,
      numResults: args.numResults,
      livecrawl: args.livecrawl,
      type: args.type,
      contextMaxCharacters: args.contextMaxCharacters,
      provider: "exa"
    }
  });
  const output = await fetchOpenCodeWebSearchText(args, context.abort, fetchImpl);
  return {
    title: `Exa Web Search: ${args.query}`,
    output,
    metadata: { provider: "exa" }
  };
}
var EXA_MCP_URL, WEB_SEARCH_TIMEOUT_MS;
var init_web_tools = __esm({
  "node_modules/cursor-opencode-provider/dist/web-tools.js"() {
    EXA_MCP_URL = "https://mcp.exa.ai/mcp";
    WEB_SEARCH_TIMEOUT_MS = 25e3;
  }
});

// node_modules/cursor-opencode-provider/dist/web-search-tool.js
function createOpenCodeWebSearchTool(factory) {
  const schema = factory.schema;
  return factory.tool({
    description: "Search the web for current information using OpenCode's web search backend.",
    args: {
      query: schema.string().describe("Web search query"),
      numResults: schema.number().int().min(1).max(20).optional(),
      livecrawl: schema.enum(["fallback", "preferred"]).optional(),
      type: schema.enum(["auto", "fast", "deep"]).optional(),
      contextMaxCharacters: schema.number().int().positive().optional()
    },
    execute: executeOpenCodeWebSearch
  });
}
var openCodeWebSearchTool;
var init_web_search_tool = __esm({
  "node_modules/cursor-opencode-provider/dist/web-search-tool.js"() {
    init_web_tools();
    openCodeWebSearchTool = {
      description: "Search the web for current information using OpenCode's web search backend.",
      args: {
        query: { type: "string", description: "Web search query" }
      },
      execute: executeOpenCodeWebSearch
    };
  }
});

// node_modules/cursor-opencode-provider/dist/image-save-tool.js
function createCursorImageSaveTool(factory) {
  return factory.tool({
    description: "Save an image that Cursor generated during this session to its target path. Takes only the id of an already-generated image \u2014 it cannot write arbitrary files, and it is not a general-purpose file writer. You do not normally call this: the Cursor provider issues it after an image is generated.",
    args: {
      image_id: factory.schema.string().describe("Id of the pending Cursor-generated image to save")
    },
    execute: executeCursorImageSave
  });
}
var cursorImageSaveTool;
var init_image_save_tool = __esm({
  "node_modules/cursor-opencode-provider/dist/image-save-tool.js"() {
    init_image_save();
    cursorImageSaveTool = {
      description: "Save an image that Cursor generated during this session to its target path. Takes only the id of an already-generated image \u2014 it cannot write arbitrary files, and it is not a general-purpose file writer. You do not normally call this: the Cursor provider issues it after an image is generated.",
      args: {
        image_id: { type: "string", description: "Id of the pending Cursor-generated image to save" }
      },
      execute: executeCursorImageSave
    };
  }
});

// node_modules/cursor-opencode-provider/dist/plugin.js
import path23 from "node:path";
import { pathToFileURL as pathToFileURL2 } from "node:url";
async function loadClassicTools(options = {}) {
  const configDir = options.configDirs?.[0] ?? opencodeGlobalConfigDirs()[0];
  const candidates = [
    ...configDir ? [path23.join(configDir, "node_modules", "@opencode-ai", "plugin", "dist", "index.js")] : [],
    "@opencode-ai/plugin"
  ];
  const importModule = options.importModule ?? ((specifier) => import(specifier));
  for (const candidate of candidates) {
    try {
      const specifier = path23.win32.isAbsolute(candidate) && !path23.isAbsolute(candidate) ? new URL(`file:///${candidate.replaceAll("\\", "/")}`).href : path23.isAbsolute(candidate) ? pathToFileURL2(candidate).href : candidate;
      const module = await importModule(specifier);
      if (typeof module.tool === "function" && module.tool.schema) {
        const factory = { tool: module.tool, schema: module.tool.schema };
        return {
          webSearch: createOpenCodeWebSearchTool(factory),
          imageSave: createCursorImageSaveTool(factory)
        };
      }
    } catch {
    }
  }
  return { webSearch: openCodeWebSearchTool, imageSave: cursorImageSaveTool };
}
async function CursorPlugin(input2) {
  const cacheDir = opencodeGlobalCacheDir();
  const apiBaseURL = cursorApiBaseURL();
  const classicTools = await loadClassicTools();
  setPlanExecutionKickoff(async ({ sessionID, planPath }) => {
    await input2.client.session.promptAsync({
      path: { id: sessionID },
      body: {
        agent: "build",
        parts: [{
          type: "text",
          text: createPlanExecutionKickoffText(planPath),
          synthetic: true
        }]
      }
    });
  });
  let sessionAccessToken;
  async function persistAuth(body) {
    await input2.client.auth.set({
      path: { id: CURSOR_PROVIDER_ID },
      body
    });
  }
  async function persistAuthBestEffort(body) {
    try {
      await persistAuth(body);
    } catch {
    }
  }
  async function authFromStore() {
    return readStoredAuth(CURSOR_PROVIDER_ID);
  }
  async function authForLoader(getAuth) {
    return await getAuth() ?? await authFromStore();
  }
  async function resolveAccessToken(auth) {
    if (auth.type === "api") {
      let accessToken2 = auth.key;
      const refreshToken = auth.metadata?.refreshToken;
      if (refreshToken && isExpiringSoon(auth.key)) {
        try {
          const newTokens = await refreshAccessToken(refreshToken, apiBaseURL);
          accessToken2 = newTokens.accessToken;
          await persistAuthBestEffort({
            type: "api",
            key: newTokens.accessToken,
            metadata: {
              ...auth.metadata,
              refreshToken: newTokens.refreshToken
            }
          });
        } catch {
        }
      }
      if (accessToken2)
        sessionAccessToken = accessToken2;
      return accessToken2;
    }
    if (auth.type === "oauth") {
      if (!isExpiringSoon(auth.access)) {
        sessionAccessToken = auth.access;
        return auth.access;
      }
      if (!auth.refresh)
        return void 0;
      try {
        const newTokens = await refreshAccessToken(auth.refresh, apiBaseURL);
        const extras = auth;
        await persistAuthBestEffort({
          type: "oauth",
          access: newTokens.accessToken,
          refresh: newTokens.refreshToken,
          expires: decodeJwtExpiryMs(newTokens.accessToken) ?? Date.now(),
          ...extras.accountId !== void 0 ? { accountId: extras.accountId } : {},
          ...extras.enterpriseUrl !== void 0 ? { enterpriseUrl: extras.enterpriseUrl } : {}
        });
        sessionAccessToken = newTokens.accessToken;
        return newTokens.accessToken;
      } catch {
        return void 0;
      }
    }
    return void 0;
  }
  async function loadModels() {
    const cached = await readCache(cacheDir);
    if (cached?.models.length && isCacheFresh2(cached)) {
      return modelsToConfig(cached.models);
    }
    const auth = await authFromStore();
    if (auth) {
      const accessToken2 = await resolveAccessToken(auth);
      if (accessToken2) {
        try {
          const models = await discoverModels(accessToken2, cacheDir, { baseURL: apiBaseURL });
          return modelsToConfig(models);
        } catch {
        }
      }
    }
    return cached?.models.length ? modelsToConfig(cached.models) : {};
  }
  return {
    tool: {
      // `websearch` is a reserved OpenCode id and is filtered for third-party
      // providers after plugin tools are merged. Use the collision-safe id
      // Cursor already sees so this host-side fallback survives that filter.
      custom_websearch: classicTools.webSearch,
      // Commits Cursor-generated image bytes, which cannot travel through the
      // host's text `write`. Handle-only, so its presence in the catalog does
      // not give any model a way to write arbitrary files — see image-save.ts.
      cursor_image_save: classicTools.imageSave
    },
    async event({ event }) {
      switch (event.type) {
        case "session.created":
          sessionActivity.linkSession(event.properties.info.id, event.properties.info.parentID);
          sessionActivity.recordActivity(event.properties.info.id);
          break;
        case "session.updated":
          sessionActivity.linkSession(event.properties.info.id, event.properties.info.parentID);
          break;
        case "session.deleted":
          sessionActivity.removeSession(event.properties.info.id);
          break;
        case "message.updated":
          sessionActivity.recordActivity(event.properties.info.sessionID);
          break;
        case "message.part.updated":
          sessionActivity.recordActivity(event.properties.part.sessionID);
          break;
      }
    },
    async "tool.execute.before"(hookInput, output) {
      if (hookInput.tool !== "bash")
        return;
      prepareCursorShellArgs(hookInput.callID, output.args);
    },
    async "shell.env"(hookInput, output) {
      const env = cursorShellEnvForCall(hookInput.callID);
      if (!env)
        return;
      Object.assign(output.env, env);
    },
    async "tool.execute.after"(hookInput, output) {
      if (hookInput.tool !== "bash")
        return;
      try {
        output.title = cursorShellOriginalCommand(hookInput.callID) ?? output.title;
        output.output = captureCursorShellResult(hookInput.callID, output.output, output.metadata);
        if (output.metadata && typeof output.metadata === "object") {
          const metadata = output.metadata;
          if (typeof metadata.output === "string") {
            metadata.output = sanitizeRegisteredCursorShellOutput(hookInput.callID, metadata.output);
          }
        }
      } finally {
        releaseCursorShellEnv(hookInput.callID);
      }
    },
    async "chat.params"(hookInput, output) {
      if (hookInput.model.providerID !== CURSOR_PROVIDER_ID)
        return;
      if (hookInput.agent === "compaction") {
        output.options[CURSOR_COMPACTION_OPTION] = true;
      }
    },
    async config(cfg) {
      setCursorShellPath(cfg.shell);
      cfg.provider ??= {};
      const models = await loadModels();
      const existing = cfg.provider[CURSOR_PROVIDER_ID];
      if (existing) {
        const existingModels = existing.models;
        if (!existingModels || Object.keys(existingModels).length === 0) {
          ;
          existing.models = models;
        }
        return;
      }
      cfg.provider[CURSOR_PROVIDER_ID] = {
        name: "Cursor Integration",
        npm: MODULE_URL,
        models
      };
    },
    auth: {
      provider: CURSOR_PROVIDER_ID,
      methods: [
        {
          type: "oauth",
          label: "Cursor account (browser login)",
          async authorize() {
            const params = generatePkceParams();
            const challenge = await generatePkceChallenge(params.verifier);
            const websiteUrl = process.env.CURSOR_WEBSITE_URL ?? `https://${CURSOR_WEBSITE_HOST}`;
            const apiBaseUrl = process.env.CURSOR_API_BASE_URL ?? `https://${CURSOR_API_HOST}`;
            const url = buildLoginUrl(challenge, params.uuid, websiteUrl);
            return {
              url,
              instructions: "Open this URL in a browser to sign in to Cursor",
              method: "auto",
              async callback() {
                const result = await pollForTokens(params.uuid, params.verifier, apiBaseUrl);
                return {
                  type: "success",
                  provider: CURSOR_PROVIDER_ID,
                  access: result.accessToken,
                  refresh: result.refreshToken,
                  expires: decodeJwtExpiryMs(result.accessToken) ?? Date.now()
                };
              }
            };
          }
        },
        {
          type: "api",
          label: "API key (cursor.com/settings)",
          prompts: [
            {
              type: "text",
              key: "apiKey",
              message: "Cursor API key",
              placeholder: "crsr_...",
              validate(value) {
                if (!value.startsWith("crsr_"))
                  return "API key should start with crsr_";
                return void 0;
              }
            }
          ],
          async authorize(inputs) {
            const apiKey = inputs?.apiKey;
            if (!apiKey)
              return { type: "failed" };
            try {
              const result = await exchangeApiKey(apiKey, apiBaseURL);
              return {
                type: "success",
                key: result.accessToken,
                provider: CURSOR_PROVIDER_ID,
                metadata: { refreshToken: result.refreshToken }
              };
            } catch {
              return { type: "failed" };
            }
          }
        }
      ],
      async loader(getAuth) {
        const auth = await authForLoader(getAuth);
        const accessToken2 = (auth ? await resolveAccessToken(auth) : void 0) ?? sessionAccessToken;
        if (accessToken2) {
          const cached = await readCache(cacheDir);
          if (!cached || cached.models.length === 0 || !isCacheFresh2(cached)) {
            await discoverModels(accessToken2, cacheDir, { baseURL: apiBaseURL }).catch(() => {
            });
          }
          await resolveAgentUrl(accessToken2, {
            apiBaseURL,
            telemetryEnabled: cursorGetServerConfigTelemetryEnabled()
          }).catch(() => {
          });
        }
        return {
          ...accessToken2 ? { accessToken: accessToken2 } : {},
          workspaceRoot: input2.directory,
          cacheDir
        };
      }
    }
  };
}
var MODULE_URL;
var init_plugin = __esm({
  "node_modules/cursor-opencode-provider/dist/plugin.js"() {
    init_shared();
    init_plugin_core();
    init_auth();
    init_models();
    init_model_config();
    init_model_config();
    init_paths();
    init_auth_store();
    init_agent_url();
    init_shell_timeout();
    init_activity();
    init_web_search_tool();
    init_image_save_tool();
    init_plan_execution_kickoff();
    MODULE_URL = new URL("./index.js", import.meta.url).href;
  }
});

// node_modules/cursor-opencode-provider/dist/index.js
var dist_exports = {};
__export(dist_exports, {
  CursorPlugin: () => CursorPlugin,
  createCursor: () => createCursor,
  default: () => dist_default
});
function createCursor(options) {
  return createSdk(options);
}
var dist_default;
var init_dist2 = __esm({
  "node_modules/cursor-opencode-provider/dist/index.js"() {
    init_plugin_core();
    init_plugin();
    dist_default = CursorPlugin;
  }
});

// worker.mjs
import crypto3 from "node:crypto";
import fs8 from "node:fs";
import path24 from "node:path";
import process2 from "node:process";
var PROTOCOL_VERSION = 1;
var MAX_FRAME_BYTES = 40 * 1024 * 1024;
var LOGIN_TIMEOUT_MS = 5 * 6e4;
var SELF_TEST = process2.argv.includes("--self-test");
var [NODE_MAJOR, NODE_MINOR] = process2.versions.node.split(".").map(Number);
if (NODE_MAJOR < 22 || NODE_MAJOR === 22 && NODE_MINOR < 19) {
  process2.stderr.write("Hermes Cursor worker requires Node 22.19 or newer\n");
  process2.exit(2);
}
if (!SELF_TEST && !process2.argv.includes("--stdio")) {
  process2.stderr.write("Hermes Cursor worker must be started with --stdio\n");
  process2.exit(2);
}
var API_BASE3 = process2.env.CURSOR_API_BASE_URL || "https://api2.cursor.sh";
var CREDENTIALS_FILE = process2.env.HERMES_CURSOR_CREDENTIALS_FILE;
var ALLOWLIST_FILE = process2.env.HERMES_CURSOR_ALLOWLIST_FILE;
var STATE_DIR = process2.env.HERMES_CURSOR_STATE_DIR;
var activeRequests = /* @__PURE__ */ new Map();
var pendingToolCalls = /* @__PURE__ */ new Set();
var accessTokenCache = null;
var refreshInFlight = null;
var credentialGeneration = 0;
var modelCache = null;
var transportModules = null;
var writeChain = Promise.resolve();
function requiredPath(value, name14) {
  if (!value) throw providerError(`${name14} is not configured`, "CURSOR_CONFIGURATION_ERROR");
  return path24.resolve(value);
}
function providerError(message, code, options = {}) {
  const error = new Error(message);
  error.code = code;
  error.transient = options.transient === true;
  error.replaySafe = options.replaySafe === true;
  if (Number.isFinite(options.retryAfterMs)) error.retryAfterMs = options.retryAfterMs;
  return error;
}
function publicError(error) {
  const value = error instanceof Error ? error : new Error(String(error));
  const code = typeof value.code === "string" ? value.code : value.name || "CURSOR_WORKER_ERROR";
  const safeMessages = {
    ENOENT: "Required Cursor provider state is missing",
    EACCES: "Cursor provider cannot access its private state"
  };
  return {
    message: safeMessages[code] || value.message || "Cursor worker request failed",
    code,
    transient: value.transient === true,
    replaySafe: value.replaySafe === true,
    ...Number.isFinite(value.retryAfterMs) ? { retryAfterMs: value.retryAfterMs } : {}
  };
}
async function writeFrame(message) {
  const body = Buffer.from(JSON.stringify(message), "utf8");
  if (body.length > MAX_FRAME_BYTES) {
    throw providerError("Worker response exceeds frame limit", "CURSOR_RESPONSE_TOO_LARGE");
  }
  const header2 = Buffer.allocUnsafe(4);
  header2.writeUInt32BE(body.length);
  writeChain = writeChain.then(
    () => new Promise((resolve2, reject) => {
      process2.stdout.write(
        Buffer.concat([header2, body]),
        (error) => error ? reject(error) : resolve2()
      );
    })
  );
  return writeChain;
}
function parseAllowedModels() {
  let value;
  const inline = process2.env.HERMES_CURSOR_ALLOWED_MODELS?.trim();
  if (inline) {
    try {
      value = JSON.parse(inline);
    } catch {
      value = inline.split(",").map((item) => item.trim()).filter(Boolean);
    }
  } else {
    value = JSON.parse(fs8.readFileSync(requiredPath(ALLOWLIST_FILE, "allowlist path"), "utf8"));
  }
  if (!Array.isArray(value)) value = value?.models;
  if (!Array.isArray(value) || value.length === 0) {
    throw providerError("Exact Cursor model allowlist is empty", "CURSOR_MODEL_POLICY_EMPTY");
  }
  const result = /* @__PURE__ */ new Set();
  for (const model of value) {
    if (typeof model !== "string" || !model || model.trim() !== model) {
      throw providerError("Cursor model allowlist contains an invalid ID", "CURSOR_MODEL_POLICY_INVALID");
    }
    if (model.toLowerCase().split(/[-_]/).includes("fast")) {
      throw providerError(`Fast Cursor model variant is prohibited: ${model}`, "CURSOR_MODEL_POLICY_INVALID");
    }
    result.add(model);
  }
  return result;
}
function readCredentials() {
  const file = requiredPath(CREDENTIALS_FILE, "credentials path");
  let descriptor;
  let value;
  try {
    const noFollow = process2.platform === "win32" ? 0 : fs8.constants.O_NOFOLLOW || 0;
    descriptor = fs8.openSync(file, fs8.constants.O_RDONLY | noFollow);
    const stat7 = fs8.fstatSync(descriptor);
    if (!stat7.isFile()) {
      throw providerError("Cursor credential path is not a regular file", "CURSOR_AUTH_PERMISSIONS");
    }
    if (process2.platform !== "win32" && ((stat7.mode & 63) !== 0 || typeof process2.geteuid === "function" && stat7.uid !== process2.geteuid())) {
      throw providerError(
        "Cursor credential file must be owned by the current user with mode 0600",
        "CURSOR_AUTH_PERMISSIONS"
      );
    }
    value = JSON.parse(fs8.readFileSync(descriptor, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw providerError("Cursor login required; run `hermes-cursor login`", "CURSOR_AUTH_REQUIRED");
    }
    if (error?.code === "ELOOP") {
      throw providerError("Cursor credential file must not be a symlink", "CURSOR_AUTH_PERMISSIONS");
    }
    throw error;
  } finally {
    if (descriptor !== void 0) {
      try {
        fs8.closeSync(descriptor);
      } catch {
      }
    }
  }
  if (typeof value?.refreshToken !== "string" || !value.refreshToken) {
    throw providerError("Cursor credential file is invalid", "CURSOR_AUTH_INVALID");
  }
  return value;
}
function atomicPrivateJson(file, value) {
  const directory = path24.dirname(file);
  fs8.mkdirSync(directory, { recursive: true, mode: 448 });
  if (process2.platform !== "win32") fs8.chmodSync(directory, 448);
  const temporary = path24.join(directory, `.${path24.basename(file)}.${process2.pid}.${crypto3.randomUUID()}`);
  try {
    fs8.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}
`, {
      encoding: "utf8",
      mode: 384,
      flag: "wx"
    });
    fs8.renameSync(temporary, file);
    if (process2.platform !== "win32") fs8.chmodSync(file, 384);
  } catch (error) {
    try {
      fs8.unlinkSync(temporary);
    } catch {
    }
    throw error;
  }
}
function jwtExpiry(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return Number.isFinite(payload.exp) ? payload.exp * 1e3 : 0;
  } catch {
    return 0;
  }
}
function accountKeyForToken(accessToken2, refreshToken) {
  let identity = "";
  try {
    const payload = JSON.parse(Buffer.from(accessToken2.split(".")[1], "base64url").toString("utf8"));
    identity = String(payload.sub || payload.user_id || payload.uuid || "");
  } catch {
  }
  return crypto3.createHash("sha256").update(identity ? `cursor-account:${identity}` : `cursor-refresh:${refreshToken}`).digest("hex").slice(0, 24);
}
async function refreshAccessToken2(refreshToken) {
  let response;
  try {
    response = await fetch(`${API_BASE3}/auth/exchange_user_api_key`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${refreshToken}`,
        "content-type": "application/json"
      },
      body: "{}",
      signal: AbortSignal.timeout(1e4)
    });
  } catch (cause) {
    throw providerError("Cursor token refresh request failed", "CURSOR_AUTH_REFRESH_NETWORK", {
      transient: true,
      replaySafe: true
    });
  }
  if (!response.ok) {
    await response.body?.cancel().catch(() => {
    });
    throw providerError(
      `Cursor token refresh failed (HTTP ${response.status})`,
      response.status === 401 || response.status === 403 ? "CURSOR_AUTH_EXPIRED" : "CURSOR_AUTH_REFRESH_FAILED",
      { transient: response.status >= 500, replaySafe: true }
    );
  }
  const body = await response.json();
  if (typeof body.accessToken !== "string" || !body.accessToken) {
    throw providerError("Cursor token refresh returned no access token", "CURSOR_AUTH_REFRESH_INVALID");
  }
  return {
    accessToken: body.accessToken,
    refreshToken: typeof body.refreshToken === "string" && body.refreshToken ? body.refreshToken : refreshToken
  };
}
async function refreshAndCacheAccessToken() {
  const generation = credentialGeneration;
  const credentials = readCredentials();
  const refreshed = await refreshAccessToken2(credentials.refreshToken);
  if (generation !== credentialGeneration) {
    throw providerError("Cursor credentials changed during refresh", "CURSOR_AUTH_CHANGED", {
      transient: true,
      replaySafe: true
    });
  }
  const accountKey = typeof credentials.accountKey === "string" && credentials.accountKey ? credentials.accountKey : accountKeyForToken(refreshed.accessToken, refreshed.refreshToken);
  if (refreshed.refreshToken !== credentials.refreshToken || credentials.accountKey !== accountKey) {
    atomicPrivateJson(requiredPath(CREDENTIALS_FILE, "credentials path"), {
      version: 1,
      refreshToken: refreshed.refreshToken,
      accountKey
    });
  }
  accessTokenCache = {
    value: refreshed.accessToken,
    expiresAt: jwtExpiry(refreshed.accessToken) || Date.now() + 55 * 6e4,
    accountKey
  };
  return accessTokenCache.value;
}
async function accessToken() {
  if (accessTokenCache && accessTokenCache.expiresAt - Date.now() > 5 * 6e4) {
    return accessTokenCache.value;
  }
  if (!refreshInFlight) {
    const refresh = refreshAndCacheAccessToken();
    const tracked = refresh.finally(() => {
      if (refreshInFlight === tracked) refreshInFlight = null;
    });
    refreshInFlight = tracked;
  }
  return refreshInFlight;
}
async function loadTransport() {
  if (!transportModules) {
    try {
      const [{ createCursor: createCursor2 }, { fetchModels: fetchModels2 }] = await Promise.all([
        Promise.resolve().then(() => (init_dist2(), dist_exports)),
        Promise.resolve().then(() => (init_models(), models_exports))
      ]);
      transportModules = { createCursor: createCursor2, fetchModels: fetchModels2 };
    } catch (cause) {
      throw providerError(
        "Bundled Cursor transport failed to load",
        "CURSOR_WORKER_DEPENDENCY_MISSING"
      );
    }
  }
  return transportModules;
}
function eligibleModel(model) {
  if (!model || typeof model.id !== "string") return false;
  const text = `${model.id} ${model.displayName || ""}`.toLowerCase();
  if (text.includes("no zdr")) return false;
  if (model.id.toLowerCase().split(/[-_]/).includes("fast")) return false;
  return true;
}
async function discoverModels2({ force = false } = {}) {
  if (!force && modelCache && Date.now() - modelCache.fetchedAt < 6e4) {
    return modelCache.models.map((model) => ({ ...model }));
  }
  const [{ fetchModels: fetchModels2 }, token] = await Promise.all([loadTransport(), accessToken()]);
  const models = (await fetchModels2(token, { baseURL: API_BASE3, timeoutMs: 1e4 })).filter(eligibleModel);
  modelCache = { fetchedAt: Date.now(), models };
  return models.map((model) => ({ ...model }));
}
async function allowedDiscoveredModels() {
  const allowed = parseAllowedModels();
  return (await discoverModels2()).filter((model) => allowed.has(model.id));
}
function textContent(content) {
  if (content == null) return "";
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) {
    throw providerError("Unsupported message content shape", "CURSOR_UNSUPPORTED_REQUEST");
  }
  return content.filter((part) => part?.type === "text" && typeof part.text === "string").map((part) => part.text).join("");
}
function userContent(content) {
  if (typeof content === "string") return [{ type: "text", text: content }];
  if (!Array.isArray(content)) {
    throw providerError("Unsupported user message content", "CURSOR_UNSUPPORTED_REQUEST");
  }
  return content.map((part) => {
    if (part?.type === "text" && typeof part.text === "string") {
      return { type: "text", text: part.text };
    }
    if (part?.type === "image_url" && typeof part.image_url?.url === "string") {
      const match = /^data:(image\/(?:png|jpeg|gif));base64,/i.exec(part.image_url.url);
      if (!match) {
        throw providerError(
          "Only inline PNG, JPEG, or GIF base64 user images are supported",
          "CURSOR_UNSUPPORTED_IMAGE"
        );
      }
      return {
        type: "file",
        mediaType: match[1].toLowerCase(),
        data: part.image_url.url
      };
    }
    throw providerError(`Unsupported user content part: ${part?.type || "unknown"}`, "CURSOR_UNSUPPORTED_REQUEST");
  });
}
function openAiMessagesToPrompt(messages, originalToWire) {
  const prompt = [];
  const toolNames = /* @__PURE__ */ new Map();
  for (const message of messages) {
    if (message?.role === "assistant" && Array.isArray(message.tool_calls)) {
      for (const call of message.tool_calls) {
        if (typeof call?.id !== "string" || !call.id || typeof call?.function?.name !== "string" || !call.function.name) {
          throw providerError("Assistant tool call is missing an id or name", "CURSOR_UNSUPPORTED_REQUEST");
        }
        if (toolNames.has(call.id)) {
          throw providerError("Assistant tool call ids must be unique", "CURSOR_UNSUPPORTED_REQUEST");
        }
        toolNames.set(call.id, call.function.name);
      }
    }
  }
  for (const message of messages) {
    if (!message || typeof message !== "object") {
      throw providerError("Message must be an object", "CURSOR_UNSUPPORTED_REQUEST");
    }
    if (message.role === "system" || message.role === "developer") {
      prompt.push({ role: "system", content: textContent(message.content) });
    } else if (message.role === "user") {
      prompt.push({ role: "user", content: userContent(message.content) });
    } else if (message.role === "assistant") {
      const content = [];
      const text = textContent(message.content);
      if (text) content.push({ type: "text", text });
      for (const call of message.tool_calls || []) {
        if (call?.type !== "function" || typeof call.function?.name !== "string") {
          throw providerError("Only function tool calls are supported", "CURSOR_UNSUPPORTED_REQUEST");
        }
        let input2;
        try {
          input2 = JSON.parse(call.function.arguments || "{}");
        } catch {
          throw providerError("Assistant tool call contains invalid JSON arguments", "CURSOR_UNSUPPORTED_REQUEST");
        }
        content.push({
          type: "tool-call",
          toolCallId: call.id,
          toolName: originalToWire.get(call.function.name) || wireToolName(call.function.name),
          input: input2
        });
      }
      prompt.push({ role: "assistant", content });
    } else if (message.role === "tool") {
      const callId = message.tool_call_id;
      if (typeof callId !== "string" || !callId) {
        throw providerError("Tool result is missing tool_call_id", "CURSOR_UNSUPPORTED_REQUEST");
      }
      const name14 = toolNames.get(callId);
      if (!name14) {
        throw providerError("Tool result references an unknown tool call", "CURSOR_UNSUPPORTED_REQUEST");
      }
      const suppliedName = message.name ?? message.tool_name;
      if (suppliedName !== void 0 && suppliedName !== name14) {
        throw providerError("Tool result name does not match its tool call", "CURSOR_UNSUPPORTED_REQUEST");
      }
      prompt.push({
        role: "tool",
        content: [{
          type: "tool-result",
          toolCallId: callId,
          toolName: originalToWire.get(name14) || wireToolName(name14),
          output: { type: "text", value: textContent(message.content) }
        }]
      });
    } else {
      throw providerError(`Unsupported message role: ${message.role}`, "CURSOR_UNSUPPORTED_REQUEST");
    }
  }
  return prompt;
}
function trailingToolResultIds(messages) {
  let start = messages.length;
  while (start > 0 && messages[start - 1]?.role === "tool") start -= 1;
  if (start === messages.length) return [];
  return messages.slice(start).map((message) => message?.tool_call_id).filter((value) => typeof value === "string" && value);
}
function requireLiveToolContinuations(messages) {
  const continuationIds = trailingToolResultIds(messages);
  const missingContinuation = continuationIds.find((callId) => !pendingToolCalls.has(callId));
  if (missingContinuation) {
    throw providerError(
      "Cursor tool continuation was lost with its worker process; refusing to replay it",
      "CURSOR_TOOL_CONTINUATION_LOST"
    );
  }
  return continuationIds;
}
function wireToolName(name14) {
  const digest = crypto3.createHash("sha256").update(name14).digest("hex").slice(0, 12);
  const safeName = name14.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 40) || "tool";
  return `h_${digest}_${safeName}`;
}
function openAiTools(tools) {
  const originalToWire = /* @__PURE__ */ new Map();
  const wireToOriginal = /* @__PURE__ */ new Map();
  const converted = tools.map((tool) => {
    if (tool?.type !== "function" || typeof tool.function?.name !== "string") {
      throw providerError("Only OpenAI function tools are supported", "CURSOR_UNSUPPORTED_REQUEST");
    }
    const wireName = wireToolName(tool.function.name);
    originalToWire.set(tool.function.name, wireName);
    wireToOriginal.set(wireName, tool.function.name);
    return {
      type: "function",
      name: wireName,
      description: `Hermes tool ${tool.function.name}. ${tool.function.description || ""}`.trim(),
      inputSchema: tool.function.parameters || { type: "object", properties: {} }
    };
  });
  return { converted, originalToWire, wireToOriginal };
}
function toolChoice(value, originalToWire) {
  if (value == null || value === "auto") return { type: "auto" };
  if (value === "none") return { type: "none" };
  if (value === "required") return { type: "required" };
  if (value?.type === "function" && typeof value.function?.name === "string") {
    const selected = originalToWire.get(value.function.name);
    if (!selected) throw providerError("tool_choice names an unadvertised tool", "CURSOR_UNSUPPORTED_REQUEST");
    return { type: "tool", toolName: selected };
  }
  throw providerError("Unsupported tool_choice value", "CURSOR_UNSUPPORTED_REQUEST");
}
function usageFromPart(usage) {
  const prompt = usage?.inputTokens?.total || 0;
  const completion = usage?.outputTokens?.total || 0;
  return {
    prompt_tokens: prompt,
    completion_tokens: completion,
    total_tokens: prompt + completion,
    prompt_tokens_details: {
      cached_tokens: usage?.inputTokens?.cacheRead || 0,
      cache_write_tokens: usage?.inputTokens?.cacheWrite || 0
    },
    completion_tokens_details: {
      reasoning_tokens: usage?.outputTokens?.reasoning || 0
    }
  };
}
function finishReason(part) {
  const value = part?.finishReason?.unified || part?.finishReason || "stop";
  if (value === "tool-calls") return "tool_calls";
  if (value === "length") return "length";
  if (value === "content-filter") return "content_filter";
  if (value === "error") return "error";
  return "stop";
}
async function runChat(id, params, signal) {
  const allowed = parseAllowedModels();
  if (!allowed.has(params.model)) {
    throw providerError(
      `Cursor model ${JSON.stringify(params.model)} is not in the configured exact allowlist`,
      "CURSOR_MODEL_NOT_ALLOWED"
    );
  }
  const continuationIds = requireLiveToolContinuations(params.messages || []);
  const available = await discoverModels2();
  const selected = available.find((model2) => model2.id === params.model);
  if (!selected) {
    throw providerError(
      `Cursor model ${JSON.stringify(params.model)} is not available to this account`,
      "CURSOR_MODEL_UNAVAILABLE"
    );
  }
  const tools = openAiTools(params.tools || []);
  const { createCursor: createCursor2 } = await loadTransport();
  const token = await accessToken();
  const sdk = createCursor2({
    name: "hermes-cursor",
    accessToken: token,
    apiBaseURL: API_BASE3,
    cacheDir: path24.join(
      requiredPath(STATE_DIR, "state directory"),
      accessTokenCache?.accountKey || accountKeyForToken(token, readCredentials().refreshToken)
    ),
    workspaceRoot: process2.cwd(),
    telemetryEnabled: false,
    retry: { maxAttempts: 3, baseDelayMs: 500, maxDelayMs: 8e3 }
  });
  const model = sdk.languageModel(params.model);
  const timeout = setTimeout(
    () => signal.controller.abort(providerError("Cursor request timed out", "CURSOR_TIMEOUT")),
    Math.max(1e3, Number(params.timeoutMs) || 9e5)
  );
  timeout.unref?.();
  const callOptions = {
    prompt: openAiMessagesToPrompt(params.messages || [], tools.originalToWire),
    tools: tools.converted,
    toolChoice: toolChoice(params.toolChoice, tools.originalToWire),
    headers: { "x-session-id": String(params.sessionId || crypto3.randomUUID()) },
    abortSignal: signal.controller.signal,
    ...Number.isFinite(params.temperature) ? { temperature: params.temperature } : {},
    ...Number.isFinite(params.maxOutputTokens) ? { maxOutputTokens: params.maxOutputTokens } : {}
  };
  const choices = [];
  let text = "";
  let reasoning = "";
  let toolCalls = [];
  let finalReason = "stop";
  let usage = usageFromPart();
  try {
    for (const callId of continuationIds) pendingToolCalls.delete(callId);
    const result = await model.doStream(callOptions);
    const reader = result.stream.getReader();
    while (true) {
      const { done, value: part } = await reader.read();
      if (done) break;
      if (part.type === "stream-start" && params.stream) {
        await writeFrame({
          id,
          type: "chunk",
          chunk: {
            id,
            object: "chat.completion.chunk",
            model: params.model,
            choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null }]
          }
        });
      } else if (part.type === "text-delta") {
        text += part.delta;
        if (params.stream) {
          await writeFrame({
            id,
            type: "chunk",
            chunk: {
              id,
              object: "chat.completion.chunk",
              model: params.model,
              choices: [{ index: 0, delta: { content: part.delta }, finish_reason: null }]
            }
          });
        }
      } else if (part.type === "reasoning-delta") {
        reasoning += part.delta;
        if (params.stream) {
          await writeFrame({
            id,
            type: "chunk",
            chunk: {
              id,
              object: "chat.completion.chunk",
              model: params.model,
              choices: [{ index: 0, delta: { reasoning_content: part.delta }, finish_reason: null }]
            }
          });
        }
      } else if (part.type === "tool-call") {
        const originalName = tools.wireToOriginal.get(part.toolName);
        if (!originalName) {
          throw providerError(
            `Cursor requested unadvertised tool ${JSON.stringify(part.toolName)}`,
            "CURSOR_NATIVE_TOOL_REJECTED"
          );
        }
        const call = {
          id: part.toolCallId,
          type: "function",
          function: {
            name: originalName,
            arguments: typeof part.input === "string" ? part.input : JSON.stringify(part.input ?? {})
          }
        };
        const index = toolCalls.length;
        toolCalls.push(call);
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
                finish_reason: null
              }]
            }
          });
        }
      } else if (part.type === "finish") {
        finalReason = finishReason(part);
        usage = usageFromPart(part.usage);
      } else if (part.type === "error") {
        throw part.error instanceof Error ? part.error : new Error(String(part.error));
      }
    }
  } catch (error) {
    signal.controller.abort(error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  if (toolCalls.length) finalReason = "tool_calls";
  for (const call of toolCalls) pendingToolCalls.add(call.id);
  if (params.stream) {
    await writeFrame({
      id,
      type: "chunk",
      chunk: {
        id,
        object: "chat.completion.chunk",
        model: params.model,
        choices: [{ index: 0, delta: {}, finish_reason: finalReason }],
        usage
      }
    });
    await writeFrame({ id, type: "done" });
    return;
  }
  choices.push({
    index: 0,
    message: {
      role: "assistant",
      content: text || null,
      tool_calls: toolCalls.length ? toolCalls : null,
      reasoning: reasoning || null,
      reasoning_content: reasoning || null,
      reasoning_details: null
    },
    finish_reason: finalReason
  });
  await writeFrame({
    id,
    type: "result",
    result: {
      id,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1e3),
      model: params.model,
      choices,
      usage
    }
  });
}
function base64url2(bytes) {
  return Buffer.from(bytes).toString("base64url");
}
function abortableDelay(milliseconds, signal) {
  return new Promise((resolve2, reject) => {
    const finish = (error) => {
      clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
      error ? reject(error) : resolve2();
    };
    const timer = setTimeout(finish, milliseconds);
    const cancel = () => {
      finish(providerError("Cursor login cancelled", "CURSOR_LOGIN_CANCELLED"));
    };
    signal.addEventListener("abort", cancel, { once: true });
  });
}
async function login(id, controller) {
  const verifier = base64url2(crypto3.randomBytes(96));
  const challenge = base64url2(crypto3.createHash("sha256").update(verifier).digest());
  const uuid = crypto3.randomUUID();
  const query = new URLSearchParams({ challenge, uuid, mode: "login", redirectTarget: "cli" });
  const url = `https://cursor.com/loginDeepControl?${query}`;
  await writeFrame({ id, type: "login_url", url });
  let delay = 1e3;
  let consecutiveErrors = 0;
  const deadline = Date.now() + LOGIN_TIMEOUT_MS;
  for (let attempt = 0; attempt < 150; attempt++) {
    const beforePoll = deadline - Date.now();
    if (beforePoll <= 0) break;
    await abortableDelay(Math.min(delay, beforePoll), controller.signal);
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    try {
      const response = await fetch(
        `${API_BASE3}/auth/poll?uuid=${encodeURIComponent(uuid)}&verifier=${encodeURIComponent(verifier)}`,
        {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(Math.min(1e4, remaining))
          ])
        }
      );
      if (response.status === 404) {
        consecutiveErrors = 0;
        delay = Math.min(delay * 1.2, 1e4);
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.json();
      if (typeof body.accessToken !== "string" || typeof body.refreshToken !== "string") {
        throw new Error("missing tokens");
      }
      credentialGeneration += 1;
      refreshInFlight = null;
      atomicPrivateJson(requiredPath(CREDENTIALS_FILE, "credentials path"), {
        version: 1,
        refreshToken: body.refreshToken,
        accountKey: accountKeyForToken(body.accessToken, body.refreshToken)
      });
      accessTokenCache = {
        value: body.accessToken,
        expiresAt: jwtExpiry(body.accessToken) || Date.now() + 55 * 6e4,
        accountKey: accountKeyForToken(body.accessToken, body.refreshToken)
      };
      await writeFrame({ id, type: "result", result: { authenticated: true } });
      return;
    } catch (error) {
      if (controller.signal.aborted) throw error;
      consecutiveErrors += 1;
      if (consecutiveErrors >= 3) {
        throw providerError("Cursor login polling failed repeatedly", "CURSOR_LOGIN_POLL_FAILED", {
          transient: true,
          replaySafe: true
        });
      }
    }
  }
  throw providerError("Cursor login timed out", "CURSOR_LOGIN_TIMEOUT");
}
async function dispatch(message) {
  if (message.protocolVersion !== PROTOCOL_VERSION) {
    throw providerError("Worker protocol version mismatch", "CURSOR_PROTOCOL_VERSION");
  }
  const id = String(message.id || "");
  const method = message.method;
  if (!id || typeof method !== "string") {
    throw providerError("Malformed worker request", "CURSOR_PROTOCOL_ERROR");
  }
  if (method === "cancel") {
    activeRequests.get(String(message.params?.requestId || ""))?.abort();
    await writeFrame({ id, type: "result", result: { cancelled: true } });
    return;
  }
  if (method === "shutdown") {
    for (const controller2 of activeRequests.values()) controller2.abort();
    await writeFrame({ id, type: "result", result: { stopped: true } });
    await writeChain;
    process2.exit(0);
  }
  const controller = new AbortController();
  activeRequests.set(id, controller);
  try {
    if (method === "chat") {
      await runChat(id, message.params || {}, { controller });
    } else if (method === "login") {
      await login(id, controller);
    } else if (method === "logout") {
      const file = requiredPath(CREDENTIALS_FILE, "credentials path");
      credentialGeneration += 1;
      refreshInFlight = null;
      try {
        fs8.unlinkSync(file);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
      accessTokenCache = null;
      modelCache = null;
      await writeFrame({ id, type: "result", result: { authenticated: false } });
    } else if (method === "status") {
      let authenticated = false;
      try {
        const credentials = readCredentials();
        authenticated = typeof credentials.refreshToken === "string";
      } catch {
      }
      await writeFrame({
        id,
        type: "result",
        result: {
          authenticated,
          structuralOnly: true,
          credentialsFile: requiredPath(CREDENTIALS_FILE, "credentials path")
        }
      });
    } else if (method === "discover") {
      await writeFrame({ id, type: "result", result: { models: await discoverModels2({ force: true }) } });
    } else if (method === "models") {
      await writeFrame({ id, type: "result", result: { models: await allowedDiscoveredModels() } });
    } else {
      throw providerError(`Unknown worker method: ${method}`, "CURSOR_PROTOCOL_ERROR");
    }
  } finally {
    activeRequests.delete(id);
  }
}
if (SELF_TEST) {
  const tools = openAiTools([
    {
      type: "function",
      function: {
        name: "read",
        description: "Read through Hermes",
        parameters: { type: "object", properties: {} }
      }
    }
  ]);
  const wireName = tools.originalToWire.get("read");
  if (!wireName || wireName === "read" || tools.wireToOriginal.get(wireName) !== "read") {
    throw new Error("Hermes tool namespace isolation self-test failed");
  }
  const sanitizedWireName = wireToolName("danger/tool.name");
  if (!/^h_[0-9a-f]{12}_[A-Za-z0-9_-]+$/.test(sanitizedWireName)) {
    throw new Error("Hermes tool name sanitization self-test failed");
  }
  const prompt = openAiMessagesToPrompt(
    [
      {
        role: "assistant",
        content: null,
        tool_calls: [{
          id: "cursor_session_1",
          type: "function",
          function: { name: "read", arguments: "{}" }
        }]
      },
      {
        role: "tool",
        tool_call_id: "cursor_session_1",
        name: "read",
        content: "ok"
      }
    ],
    tools.originalToWire
  );
  if (prompt[0].content[0].toolName !== wireName || prompt[1].content[0].toolName !== wireName) {
    throw new Error("Hermes tool continuation namespace self-test failed");
  }
  pendingToolCalls.add("cursor_session_1");
  if (trailingToolResultIds([
    { role: "user", content: "run" },
    { role: "tool", tool_call_id: "cursor_session_1", content: "ok" }
  ])[0] !== "cursor_session_1") {
    throw new Error("Hermes lost-continuation guard self-test failed");
  }
  let lostContinuationGuard = false;
  try {
    requireLiveToolContinuations([
      { role: "tool", tool_call_id: "cursor_missing_1", content: "must not replay" }
    ]);
  } catch (error) {
    lostContinuationGuard = error?.code === "CURSOR_TOOL_CONTINUATION_LOST";
  }
  if (!lostContinuationGuard) throw new Error("Hermes lost-continuation rejection self-test failed");
  let unknownHistoryGuard = false;
  try {
    openAiMessagesToPrompt([
      { role: "tool", tool_call_id: "unknown", content: "must not forward" }
    ], /* @__PURE__ */ new Map());
  } catch (error) {
    unknownHistoryGuard = error?.code === "CURSOR_UNSUPPORTED_REQUEST";
  }
  if (!unknownHistoryGuard) throw new Error("Hermes unknown tool history self-test failed");
  let unsupportedWebpGuard = false;
  try {
    userContent([{
      type: "image_url",
      image_url: { url: "data:image/webp;base64,UklGRg==" }
    }]);
  } catch (error) {
    unsupportedWebpGuard = error?.code === "CURSOR_UNSUPPORTED_IMAGE";
  }
  if (!unsupportedWebpGuard) throw new Error("Hermes unsupported WebP rejection self-test failed");
  process2.stdout.write(
    `${JSON.stringify({
      ok: true,
      wireName,
      lostContinuationGuard,
      unknownHistoryGuard,
      unsupportedWebpGuard
    })}
`
  );
  process2.exit(0);
}
var input = Buffer.alloc(0);
process2.stdin.on("data", (chunk) => {
  input = Buffer.concat([input, chunk]);
  while (input.length >= 4) {
    const length = input.readUInt32BE(0);
    if (length <= 0 || length > MAX_FRAME_BYTES) {
      process2.exitCode = 2;
      process2.stdin.destroy();
      return;
    }
    if (input.length < 4 + length) return;
    const body = input.subarray(4, 4 + length);
    input = input.subarray(4 + length);
    let message;
    try {
      message = JSON.parse(body.toString("utf8"));
    } catch {
      process2.exitCode = 2;
      process2.stdin.destroy();
      return;
    }
    void dispatch(message).catch(async (error) => {
      await writeFrame({ id: String(message?.id || ""), type: "error", error: publicError(error) });
    });
  }
});
process2.stdin.on("end", () => {
  for (const controller of activeRequests.values()) controller.abort();
  process2.exit(0);
});
await writeFrame({ type: "ready", protocolVersion: PROTOCOL_VERSION, pid: process2.pid });
