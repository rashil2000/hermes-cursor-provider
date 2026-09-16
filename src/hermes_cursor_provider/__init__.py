"""Hermes Cursor model-provider plugin."""

from __future__ import annotations

from .profile import CursorProviderProfile, cursor_profile

__all__ = ["CursorProviderProfile", "cursor_profile", "register"]
__version__ = "0.1.0"


def register() -> None:
    """Register the provider through Hermes' external plugin entry-point seam."""
    from providers import register_provider  # type: ignore[import-not-found]

    register_provider(cursor_profile)
