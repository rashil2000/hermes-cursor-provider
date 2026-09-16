from __future__ import annotations

import os
import uuid
from typing import Any

import pytest

from hermes_cursor_provider.client import HermesCursorClient

pytestmark = pytest.mark.live_cursor

if os.environ.get("HERMES_CURSOR_LIVE") != "1":
    pytest.skip("set HERMES_CURSOR_LIVE=1 for live Cursor tests", allow_module_level=True)

MODEL = os.environ.get("HERMES_CURSOR_LIVE_MODEL", "")
if not MODEL:
    pytest.skip("set HERMES_CURSOR_LIVE_MODEL to an allowlisted ID", allow_module_level=True)

RED_2X2_PNG = (
    "data:image/png;base64,"
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGP8z8DA"
    "wMDAxMDAAAANHQEDasKb6QAAAABJRU5ErkJggg=="
)


def _scope() -> dict[str, str]:
    return {"hermes_cache_scope_id": f"live-{uuid.uuid4()}"}


def test_live_incremental_streaming() -> None:
    client = HermesCursorClient()
    try:
        stream = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "user",
                    "content": "Count from one to five, one number per line.",
                }
            ],
            stream=True,
            extra_body=_scope(),
        )
        deltas = [
            chunk.choices[0].delta.content
            for chunk in stream
            if getattr(chunk.choices[0].delta, "content", None)
        ]
        assert len(deltas) >= 2
        assert "1" in "".join(deltas)
    finally:
        client.close()


def test_live_red_png_and_multiturn_context() -> None:
    client = HermesCursorClient()
    scope = _scope()
    try:
        messages: list[dict[str, Any]] = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Reply with only the dominant color."},
                    {"type": "image_url", "image_url": {"url": RED_2X2_PNG}},
                ],
            }
        ]
        first = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            extra_body=scope,
        )
        answer = first.choices[0].message.content
        assert "red" in answer.lower()
        messages.extend(
            [
                {"role": "assistant", "content": answer},
                {
                    "role": "user",
                    "content": "Without seeing the image again, what color was it? One word.",
                },
            ]
        )
        second = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            extra_body=scope,
        )
        assert "red" in second.choices[0].message.content.lower()
    finally:
        client.close()


def test_live_hermes_owned_tool_round_trip() -> None:
    client = HermesCursorClient()
    scope = _scope()
    tools = [
        {
            "type": "function",
            "function": {
                "name": "echo_from_hermes",
                "description": "Return the supplied text exactly. This is executed by Hermes.",
                "parameters": {
                    "type": "object",
                    "properties": {"text": {"type": "string"}},
                    "required": ["text"],
                    "additionalProperties": False,
                },
            },
        }
    ]
    messages: list[dict[str, Any]] = [
        {
            "role": "user",
            "content": "Call echo_from_hermes with text set to tool-round-trip.",
        }
    ]
    try:
        first = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=tools,
            tool_choice={
                "type": "function",
                "function": {"name": "echo_from_hermes"},
            },
            extra_body=scope,
        )
        call = first.choices[0].message.tool_calls[0]
        assert call.function.name == "echo_from_hermes"
        messages.extend(
            [
                {
                    "role": "assistant",
                    "content": first.choices[0].message.content,
                    "tool_calls": [
                        {
                            "id": call.id,
                            "type": "function",
                            "function": {
                                "name": call.function.name,
                                "arguments": call.function.arguments,
                            },
                        }
                    ],
                },
                {
                    "role": "tool",
                    "tool_call_id": call.id,
                    "name": call.function.name,
                    "content": "tool-round-trip",
                },
            ]
        )
        second = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=tools,
            extra_body=scope,
        )
        assert "tool-round-trip" in second.choices[0].message.content
    finally:
        client.close()
