"""Configuration and model-policy loading for the Cursor provider."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from importlib.resources import files
from pathlib import Path
from typing import Any

PROVIDER_NAME = "cursor"
PROTOCOL_VERSION = 1
MAX_FRAME_BYTES = 40 * 1024 * 1024


class ConfigurationError(RuntimeError):
    """The provider's local configuration is missing or unsafe."""


def hermes_home() -> Path:
    configured = os.environ.get("HERMES_HOME", "").strip()
    return Path(configured).expanduser() if configured else Path.home() / ".hermes"


def provider_home() -> Path:
    configured = os.environ.get("HERMES_CURSOR_HOME", "").strip()
    return (
        Path(configured).expanduser()
        if configured
        else hermes_home() / "providers" / PROVIDER_NAME
    )


def credential_path() -> Path:
    configured = os.environ.get("HERMES_CURSOR_CREDENTIALS_FILE", "").strip()
    return (
        Path(configured).expanduser()
        if configured
        else provider_home() / "credentials.json"
    )


def allowlist_path() -> Path:
    configured = os.environ.get("HERMES_CURSOR_ALLOWLIST_FILE", "").strip()
    return (
        Path(configured).expanduser()
        if configured
        else provider_home() / "allowed-models.json"
    )


def state_path() -> Path:
    configured = os.environ.get("HERMES_CURSOR_STATE_DIR", "").strip()
    return Path(configured).expanduser() if configured else provider_home() / "state"


def worker_entrypoint() -> Path:
    configured = os.environ.get("HERMES_CURSOR_WORKER", "").strip()
    if configured:
        return Path(configured).expanduser()
    package_worker = Path(
        str(files(__package__).joinpath("worker", "worker.bundle.mjs"))
    )
    if package_worker.is_file():
        return package_worker
    return Path(__file__).resolve().parents[2] / "worker" / "worker.bundle.mjs"


def node_command() -> str:
    return os.environ.get("HERMES_CURSOR_NODE", "").strip() or "node"


def _parse_model_list(value: Any, source: str) -> tuple[str, ...]:
    if isinstance(value, dict):
        value = value.get("models")
    if not isinstance(value, list):
        raise ConfigurationError(f"{source} must be a JSON array or an object with a models array")

    result: list[str] = []
    seen: set[str] = set()
    for raw in value:
        if not isinstance(raw, str) or not raw.strip() or raw != raw.strip():
            raise ConfigurationError(f"{source} contains an invalid model ID")
        if raw in seen:
            continue
        if "fast" in raw.lower().replace("_", "-").split("-"):
            raise ConfigurationError(f"{source} must not include fast variant {raw!r}")
        seen.add(raw)
        result.append(raw)
    if not result:
        raise ConfigurationError(
            f"{source} is empty; configure exact Cursor model IDs before using the provider"
        )
    return tuple(result)


def load_allowed_models() -> tuple[str, ...]:
    inline = os.environ.get("HERMES_CURSOR_ALLOWED_MODELS", "").strip()
    if inline:
        try:
            value = json.loads(inline)
        except json.JSONDecodeError:
            value = [part.strip() for part in inline.split(",") if part.strip()]
        return _parse_model_list(value, "HERMES_CURSOR_ALLOWED_MODELS")

    path = allowlist_path()
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ConfigurationError(
            f"Cursor model allowlist not found at {path}; run `hermes-cursor configure`"
        ) from exc
    except (OSError, json.JSONDecodeError) as exc:
        raise ConfigurationError(f"Cannot read Cursor model allowlist at {path}: {exc}") from exc
    return _parse_model_list(value, str(path))


@dataclass(frozen=True)
class ProviderConfig:
    node: str
    worker: Path
    credentials: Path
    allowlist: Path
    state: Path
    allowed_models: tuple[str, ...]

    @classmethod
    def load(cls, *, require_allowlist: bool = True) -> ProviderConfig:
        allowed = load_allowed_models() if require_allowlist else ()
        return cls(
            node=node_command(),
            worker=worker_entrypoint(),
            credentials=credential_path(),
            allowlist=allowlist_path(),
            state=state_path(),
            allowed_models=allowed,
        )

    def worker_environment(self) -> dict[str, str]:
        env = {
            "PATH": os.environ.get("PATH", ""),
            "HOME": os.environ.get("HOME", str(Path.home())),
            "HERMES_CURSOR_CREDENTIALS_FILE": str(self.credentials),
            "HERMES_CURSOR_ALLOWLIST_FILE": str(self.allowlist),
            "HERMES_CURSOR_STATE_DIR": str(self.state),
        }
        for name in (
            "HTTPS_PROXY",
            "HTTP_PROXY",
            "NO_PROXY",
            "NODE_EXTRA_CA_CERTS",
            "CURSOR_API_BASE_URL",
        ):
            if name in os.environ:
                env[name] = os.environ[name]
        if "HERMES_CURSOR_ALLOWED_MODELS" in os.environ:
            env["HERMES_CURSOR_ALLOWED_MODELS"] = os.environ[
                "HERMES_CURSOR_ALLOWED_MODELS"
            ]
        return env
