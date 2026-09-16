"""Git-install entrypoint for the Hermes Cursor model provider."""

from __future__ import annotations

import sys
from pathlib import Path


def register(context: object | None = None) -> None:
    """Register the provider, or no-op for Hermes's general capability probe."""
    if context is not None:
        return
    source = str(Path(__file__).resolve().parent / "src")
    if source not in sys.path:
        sys.path.insert(0, source)
    from hermes_cursor_provider import register as register_provider

    register_provider()


if __name__.startswith(("_hermes_user_provider_", "plugins.model_providers.")):
    register()
