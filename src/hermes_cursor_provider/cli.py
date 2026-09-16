"""Control-plane CLI for Cursor login, policy, and diagnostics."""

from __future__ import annotations

import argparse
import contextlib
import json
import os
import stat
import subprocess
import sys
import tempfile
import webbrowser
from pathlib import Path
from typing import Any

from .config import ConfigurationError, ProviderConfig, allowlist_path, load_allowed_models
from .worker import WorkerError, WorkerSupervisor


def _atomic_private_json(path: Path, value: Any) -> None:
    path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    if os.name != "nt":
        path.parent.chmod(0o700)
    fd, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        if os.name != "nt":
            os.fchmod(fd, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(value, handle, indent=2)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
        if os.name != "nt":
            path.chmod(0o600)
    except BaseException:
        with contextlib.suppress(OSError):
            os.unlink(temporary)
        raise


def _supervisor(*, require_allowlist: bool) -> WorkerSupervisor:
    return WorkerSupervisor(ProviderConfig.load(require_allowlist=require_allowlist))


def _worker_call(method: str, *, require_allowlist: bool) -> Any:
    worker = _supervisor(require_allowlist=require_allowlist)
    try:
        return worker.call(method)
    finally:
        worker.close()


def _cmd_configure(args: argparse.Namespace) -> int:
    models = list(dict.fromkeys(args.models))
    if not models:
        raise ConfigurationError("Specify at least one exact model ID")
    path = allowlist_path()
    _atomic_private_json(path, {"models": models})
    # Re-read through the strict policy parser before reporting success.
    loaded = load_allowed_models()
    print(f"Configured {len(loaded)} allowed Cursor model(s) in {path}")
    return 0


def _cmd_login(args: argparse.Namespace) -> int:
    worker = _supervisor(require_allowlist=False)
    try:
        request = worker.request("login")
        result: Any = None
        for event in request:
            if event.type == "login_url":
                url = str(event.payload.get("url") or "")
                print(f"Open this URL to sign in:\n{url}")
                if not args.no_browser:
                    webbrowser.open(url)
            elif event.type == "result":
                result = event.payload.get("result")
        if not isinstance(result, dict) or result.get("authenticated") is not True:
            raise WorkerError("Cursor login did not complete", code="CURSOR_LOGIN_FAILED")
        print("Cursor login succeeded. The refresh credential was stored privately.")
        return 0
    finally:
        worker.close()


def _cmd_logout(_: argparse.Namespace) -> int:
    _worker_call("logout", require_allowlist=False)
    print("Cursor credentials and in-memory access token removed.")
    return 0


def _cmd_status(_: argparse.Namespace) -> int:
    result = _worker_call("status", require_allowlist=False)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if isinstance(result, dict) and result.get("authenticated") else 1


def _cmd_models(args: argparse.Namespace) -> int:
    method = "discover" if args.available else "models"
    result = _worker_call(method, require_allowlist=not args.available)
    models = result.get("models", []) if isinstance(result, dict) else []
    for model in models:
        if not isinstance(model, dict):
            continue
        capabilities = []
        if model.get("supportsImages"):
            capabilities.append("vision")
        if model.get("supportsAgent"):
            capabilities.append("tools")
        label = str(model.get("displayName") or "").strip()
        suffix = f" — {label}" if label else ""
        caps = f" [{', '.join(capabilities)}]" if capabilities else ""
        print(f"{model.get('id')}{suffix}{caps}")
    return 0


def _cmd_doctor(_: argparse.Namespace) -> int:
    config = ProviderConfig.load(require_allowlist=False)
    failures = 0

    node = subprocess.run(
        [config.node, "--version"],
        text=True,
        capture_output=True,
        check=False,
    )
    if node.returncode:
        print(f"FAIL Node executable: {config.node}")
        failures += 1
    else:
        version = node.stdout.strip()
        try:
            parts = version.removeprefix("v").split(".")
            parsed_version = tuple(int(part) for part in parts[:3])
        except ValueError:
            parsed_version = ()
        supported = parsed_version >= (22, 19, 0)
        outcome = "OK" if supported else "FAIL"
        print(f"{outcome} Node: {version} (22.19+ required)")
        failures += not supported

    if config.worker.is_file():
        print("OK bundled Cursor worker present")
    else:
        print(f"FAIL bundled Cursor worker missing: {config.worker}")
        failures += 1

    try:
        allowed = load_allowed_models()
    except ConfigurationError as exc:
        print(f"FAIL model policy: {exc}")
        failures += 1
    else:
        print(f"OK exact model allowlist: {len(allowed)} model(s)")

    if config.credentials.exists() and os.name != "nt":
        mode = stat.S_IMODE(config.credentials.stat().st_mode)
        if mode & 0o077:
            print(f"FAIL credential permissions: {oct(mode)} (expected 0o600)")
            failures += 1
        else:
            print("OK credential permissions")

    try:
        status = _worker_call("status", require_allowlist=False)
    except Exception as exc:
        print(f"FAIL worker readiness: {exc}")
        failures += 1
    else:
        print("OK worker readiness")
        if status.get("authenticated"):
            print("OK Cursor refresh credential present")
        else:
            print("FAIL Cursor login required; run `hermes-cursor login`")
            failures += 1
    return 1 if failures else 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="hermes-cursor")
    subparsers = parser.add_subparsers(dest="command", required=True)

    configure = subparsers.add_parser("configure", help="write the exact model allowlist")
    configure.add_argument("models", nargs="+", metavar="MODEL_ID")
    configure.set_defaults(handler=_cmd_configure)

    login = subparsers.add_parser("login", help="authenticate with Cursor using PKCE")
    login.add_argument("--no-browser", action="store_true")
    login.set_defaults(handler=_cmd_login)

    logout = subparsers.add_parser("logout", help="delete Cursor credentials")
    logout.set_defaults(handler=_cmd_logout)

    status = subparsers.add_parser("status", help="show structural authentication status")
    status.set_defaults(handler=_cmd_status)

    models = subparsers.add_parser("models", help="list selectable allowlisted models")
    models.add_argument(
        "--available",
        action="store_true",
        help="show eligible account models for choosing an exact allowlist",
    )
    models.set_defaults(handler=_cmd_models)

    doctor = subparsers.add_parser("doctor", help="check worker, policy, and credentials")
    doctor.set_defaults(handler=_cmd_doctor)
    return parser


def main(argv: list[str] | None = None) -> int:
    try:
        args = build_parser().parse_args(argv)
        return int(args.handler(args))
    except (ConfigurationError, WorkerError, OSError, ValueError) as exc:
        print(f"hermes-cursor: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
