# Hermes Cursor Provider

Hermes `model-provider` plugin for using an explicitly approved subset of the
models available through a Cursor subscription.

> This plugin's code was generated end-to-end by large language models with
> human review and iteration. Audit the source, run the verification suite,
> and validate against your own security and account-policy requirements
> before trusting it in production.

> Cursor's Connect/CLI protocol is private and unsupported. Review the pinned
> upstream code and obtain the required legal, security, and account-policy
> approval before production use.

## Architecture

```text
Hermes
  -> Python OpenAI-compatible client facade
  -> length-prefixed JSON over stdio
  -> Hermes-owned Node worker
  -> Cursor Connect-RPC over HTTP/2
```

There is no daemon, systemd unit, loopback listener, or independently managed
service. The Python client starts the worker lazily, performs a protocol-version
handshake, cancels streams explicitly, and terminates the worker when Hermes
closes the client.

The worker bundles `cursor-opencode-provider` 0.6.7 into
`worker/worker.bundle.mjs`. Its build dependency is locked by tarball integrity
in `worker/package-lock.json`; users do not need npm or `node_modules`. The
reviewed source revision is
`889ad0bf981c0c325100134d86be87f426bc940f`. OAuth behavior is adapted from
`offbynan/pi-cursor-provider` revision
`a89ac0ff34d1d6209f5a40a0b362cce0eea5915c`.

## Requirements

- Python 3.11+
- Node 22.19+
- Hermes Agent 0.21.1+ with pip provider discovery and
  `ProviderProfile.create_client()` support
- A Cursor account permitted to use the configured models

The integration is validated against Hermes Agent 0.21.1 upstream revision
`422bc9bde9d212ab3741fbc45a871a3938436d59`. It uses only the public provider
entry point, external-process routing metadata, profile hooks, and custom-client
construction seam available in that revision. No Hermes source patch is
required.

## Install from Git

Hermes 0.21.1 can install this repository directly:

```bash
hermes plugins install rashil2000/hermes-cursor-provider --enable
```

Hermes clones the repository to `$HERMES_HOME/plugins/cursor` and displays
`after-install.md`. No pip or npm installation is performed or required.
Follow the displayed instructions to authenticate and configure the exact
allowed model IDs:

```bash
export HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
CURSOR_PLUGIN="$HERMES_HOME/plugins/cursor"

python "$CURSOR_PLUGIN" login --no-browser
python "$CURSOR_PLUGIN" models --available
python "$CURSOR_PLUGIN" configure exact-cursor-model-id another-exact-id
python "$CURSOR_PLUGIN" models
python "$CURSOR_PLUGIN" doctor
hermes model --refresh
hermes gateway restart
```

The repository-local Python launcher exists because a Git plugin install does
not create a global `hermes-cursor` command.

## Install with pip

The same repository can be installed as a Python package:

```bash
python -m pip install .
hermes plugins enable cursor --no-allow-tool-override
hermes-cursor login --no-browser
hermes-cursor models --available
hermes-cursor configure exact-cursor-model-id another-exact-id
hermes-cursor doctor
hermes model --refresh
hermes gateway restart
```

The wheel contains the same bundled worker used by the Git installation.

`models --available` is a policy-administration view. Hermes only receives the
intersection of the account catalog and the exact configured allowlist.
If discovery fails, Hermes receives no live models and the plugin emits a
sanitized warning; it never substitutes a stale or bundled entitlement catalog.

## Configuration

| Environment variable | Purpose |
|---|---|
| `HERMES_CURSOR_HOME` | Provider root; defaults to `$HERMES_HOME/providers/cursor` |
| `HERMES_CURSOR_CREDENTIALS_FILE` | Refresh credential override |
| `HERMES_CURSOR_ALLOWLIST_FILE` | Exact model allowlist override |
| `HERMES_CURSOR_STATE_DIR` | Conversation/checkpoint/blob state override |
| `HERMES_CURSOR_ALLOWED_MODELS` | JSON array or comma-separated allowlist override |
| `HERMES_CURSOR_NODE` | Node executable override |
| `HERMES_CURSOR_WORKER` | Worker entrypoint override |
| `CURSOR_API_BASE_URL` | Test/managed Cursor API endpoint override |

The default allowlist file is:

```json
{
  "models": [
    "exact-id-returned-by-hermes-cursor-models-available"
  ]
}
```

Fast variants are rejected during policy loading. Models whose live display
metadata contains `NO ZDR` are excluded. A listed ID remains provisional until
it appears in the authenticated account catalog; catalog access alone is not a
privacy guarantee. Cursor Privacy Mode and organization restrictions must also
be enforced administratively.

## Security boundaries

- Login is explicit PKCE authentication.
- Only the refresh credential is persisted. Access tokens remain in worker
  memory and are refreshed before expiry.
- Credential directories and atomic writes use owner-only permissions on
  POSIX. The worker also refuses symlinked, non-regular, foreign-owned, or
  group/world-accessible credential files.
- Prompts, responses, tokens, tool arguments, and images are not logged.
- Only inline base64 PNG, JPEG, and GIF user images are accepted.
- The Python boundary enforces image count, byte, dimension, and pixel limits.
- Hermes functions are renamed into a collision-resistant worker namespace
  before advertisement as Cursor MCP tools. Returned calls are accepted only
  when they map to a function Hermes advertised.
- Cursor-native shell, file, browser, web, task, and other tool requests cannot
  match that namespace and are rejected by the transport.
- Tool-result images are disabled until their end-to-end boundary is separately
  verified.
- Cursor's OAuth polling protocol sends the PKCE verifier in an HTTPS query
  string. Operators must ensure reverse proxies and TLS terminators do not log
  authentication query strings.

## Session, streaming, and failures

Hermes 0.21.1 passes its session ID through the supported provider hooks, and
the plugin uses that as the Cursor conversation key. Cursor conversation
checkpoints and blobs live under the configured Hermes-owned state directory.
If Hermes changes the session ID during a host-managed context rotation, the
plugin starts a new Cursor conversation from the messages Hermes supplies
rather than relying on an unsupported cache-scope hook. Pending tool streams
remain process-local. A worker crash while waiting for a tool result fails
closed; the worker does not fabricate or replay the result.

Streaming chunks are forwarded as they arrive from the Cursor Run stream.
Closing the Python iterator sends cancellation to the worker, and closing the
client shuts the worker down. The worker also enforces the timeout supplied when
Hermes constructs the client (900 seconds only when the host supplies none).
Hermes 0.21.1 does not expose a provider-specific cross-thread abort hook, so an
abandoned call that is not closed by the host remains bounded by that worker
timeout. The adopted transport retries only replay-safe failures and suppresses
retry after semantic progress.

Unsupported OpenAI request features are rejected explicitly rather than
silently discarded.

## Verification

```bash
cd worker
npm ci
npm run bundle
git diff --exit-code -- worker.bundle.mjs worker.bundle.mjs.LEGAL.txt
cd ..
python -m pytest
ruff check .
mypy src/hermes_cursor_provider
node worker/worker.bundle.mjs --self-test
```

npm is a maintainer-only build dependency. Deployment and Git installation use
the committed `worker.bundle.mjs` artifact.

Live tests require a Cursor account and are intentionally opt-in. Before
production deployment, verify text streaming, a direct 2x2 red PNG followed by
multi-turn image context, a Hermes tool round trip, cancellation, token expiry,
rate limits, worker restart, and partial-stream failure behavior on the target
VM.

```bash
HERMES_CURSOR_LIVE=1 \
HERMES_CURSOR_LIVE_MODEL=exact-allowlisted-id \
python -m pytest -m live_cursor
```

## Upgrade procedure

1. Review upstream changes from the pinned revision, especially authentication,
   HTTP/2 framing, protobuf schemas, tool translation, persistence, retries, and
   redaction.
2. Update the exact npm version and regenerate `worker/package-lock.json`.
3. Run `npm ci && npm run bundle` in `worker/` and commit the regenerated
   `worker.bundle.mjs`.
4. Update `THIRD_PARTY_NOTICES.md` with the reviewed commit.
5. Run unit tests and the opt-in live acceptance suite on a non-production
   Cursor account.
6. Reapprove security/legal/account policy before deployment.

## Remove or completely purge

For a Git installation, stop the gateway and log out while the repository-local
CLI still exists:

```bash
export HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
CURSOR_PLUGIN="$HERMES_HOME/plugins/cursor"

hermes gateway stop
python "$CURSOR_PLUGIN" logout
hermes plugins disable cursor
hermes plugins remove cursor
hermes gateway start
```

This preserves the model allowlist and Cursor conversation state for a future
reinstall. To erase all provider-owned credentials, configuration, checkpoints,
and blobs instead, perform the removal above and then run:

```bash
rm -rf -- "$HERMES_HOME/providers/cursor"
```

For a pip installation, stop the gateway, run `hermes-cursor logout`, disable
the plugin, and run `python -m pip uninstall hermes-cursor-provider`. The same
provider-state directory can then be deleted for a complete purge.
