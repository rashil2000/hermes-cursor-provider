"""Hermes provider profile for Cursor's private Connect protocol."""

from __future__ import annotations

import logging
from typing import Any

try:
    from providers.base import ProviderProfile  # type: ignore[import-not-found]
except ImportError:  # Allows local tooling/tests without Hermes installed.

    class ProviderProfile:  # type: ignore[no-redef]
        def __init__(self, **values: Any) -> None:
            self.__dict__.update(values)


from .client import HermesCursorClient

logger = logging.getLogger(__name__)


class CursorProviderProfile(ProviderProfile):  # type: ignore[misc]
    """Supply the stdio client and account-specific allowlisted catalog."""

    def create_client(self, **client_kwargs: Any) -> HermesCursorClient:
        return HermesCursorClient(**client_kwargs)

    def fetch_models(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout: float = 15.0,
    ) -> list[str] | None:
        del api_key, base_url
        client: HermesCursorClient | None = None
        try:
            client = self.create_client()
            return client.list_models()
        except Exception as exc:
            logger.warning(
                "Cursor model discovery failed (%s); no models will be listed",
                type(exc).__name__,
            )
            return None
        finally:
            if client is not None:
                client.close()

    def build_extra_body(
        self,
        *,
        session_id: str | None = None,
        **context: Any,
    ) -> dict[str, Any]:
        del context
        body: dict[str, Any] = {}
        if session_id:
            body["hermes_session_id"] = session_id
        return body

    def build_api_kwargs_extras(
        self,
        *,
        reasoning_config: dict[str, Any] | None = None,
        **context: Any,
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        del context
        top_level: dict[str, Any] = {}
        if isinstance(reasoning_config, dict):
            effort = reasoning_config.get("effort")
            if reasoning_config.get("enabled") is False:
                effort = "none"
            if isinstance(effort, str) and effort:
                top_level["reasoning_effort"] = effort
        return {}, top_level


cursor_profile = CursorProviderProfile(
    name="cursor",
    aliases=("cursor-subscription", "cursor-connect"),
    api_mode="chat_completions",
    display_name="Cursor Subscription",
    description="Approved models from a Cursor subscription via a Hermes-owned worker",
    signup_url="https://cursor.com/",
    env_vars=(),
    base_url="cursor+stdio://worker",
    auth_type="external_process",
    supports_health_check=False,
    supports_model_listing=True,
    supports_vision=True,
    supports_vision_tool_messages=False,
    supports_prompt_cache_key=False,
    process_command="node",
    process_args=(),
    process_command_env_vars=("HERMES_CURSOR_NODE",),
    process_args_env_var="",
    fallback_models=(),
    default_aux_model="",
)
