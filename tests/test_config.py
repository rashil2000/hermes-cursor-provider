from __future__ import annotations

import json
import logging
from pathlib import Path

import pytest

from hermes_cursor_provider.config import ConfigurationError, load_allowed_models
from hermes_cursor_provider.profile import cursor_profile


def test_allowlist_is_exact_deduplicated_and_ordered(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("HERMES_CURSOR_ALLOWED_MODELS", '["one", "two", "one"]')
    assert load_allowed_models() == ("one", "two")


def test_fast_model_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("HERMES_CURSOR_ALLOWED_MODELS", '["model-fast"]')
    with pytest.raises(ConfigurationError, match="fast variant"):
        load_allowed_models()


def test_file_allowlist(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    path = tmp_path / "models.json"
    path.write_text(json.dumps({"models": ["exact-id"]}), encoding="utf-8")
    monkeypatch.delenv("HERMES_CURSOR_ALLOWED_MODELS", raising=False)
    monkeypatch.setenv("HERMES_CURSOR_ALLOWLIST_FILE", str(path))
    assert load_allowed_models() == ("exact-id",)


def test_profile_declares_security_boundaries() -> None:
    assert cursor_profile.auth_type == "external_process"
    assert cursor_profile.supports_vision is True
    assert cursor_profile.supports_vision_tool_messages is False
    assert cursor_profile.fallback_models == ()


def test_profile_uses_supported_hermes_session_id() -> None:
    body = cursor_profile.build_extra_body(
        session_id="physical-session",
        unsupported_future_context="ignored",
    )
    assert body == {"hermes_session_id": "physical-session"}


def test_model_discovery_failure_returns_no_fallback_and_logs_type(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    def fail_client(**_: object) -> None:
        raise RuntimeError("sensitive upstream details")

    monkeypatch.setattr(cursor_profile, "create_client", fail_client)
    with caplog.at_level(logging.WARNING):
        assert cursor_profile.fetch_models() is None
    assert "RuntimeError" in caplog.text
    assert "sensitive upstream details" not in caplog.text
