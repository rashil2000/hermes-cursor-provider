from __future__ import annotations

import asyncio
import threading
from collections.abc import Iterator
from typing import Any

import pytest

import hermes_cursor_provider.client as client_module
from hermes_cursor_provider.client import HermesCursorClient, UnsupportedRequestError
from hermes_cursor_provider.worker import WorkerEvent


class FakeRequest(Iterator[WorkerEvent]):
    def __init__(self, events: list[WorkerEvent], result: Any = None) -> None:
        self.events = iter(events)
        self.value = result
        self.closed = False

    def __iter__(self) -> FakeRequest:
        return self

    def __next__(self) -> WorkerEvent:
        return next(self.events)

    def result(self) -> Any:
        return self.value

    def close(self) -> None:
        self.closed = True


class FakeSupervisor:
    def __init__(self) -> None:
        self.requests: list[tuple[str, dict[str, Any]]] = []
        self.response: Any = {
            "choices": [
                {
                    "message": {
                        "content": "ok",
                        "tool_calls": None,
                        "reasoning": None,
                        "reasoning_content": None,
                    },
                    "finish_reason": "stop",
                }
            ],
            "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
        }
        self.events: list[WorkerEvent] = []
        self.request_threads: list[int] = []
        self.is_closed = False

    def request(self, method: str, params: dict[str, Any]) -> FakeRequest:
        self.request_threads.append(threading.get_ident())
        self.requests.append((method, params))
        return FakeRequest(self.events, self.response)

    def call(self, method: str, params: dict[str, Any] | None = None) -> Any:
        self.requests.append((method, params or {}))
        return self.response

    def close(self) -> None:
        self.is_closed = True


@pytest.fixture(autouse=True)
def configured(monkeypatch: pytest.MonkeyPatch, tmp_path: Any) -> None:
    monkeypatch.setenv("HERMES_CURSOR_ALLOWED_MODELS", '["approved-model"]')
    monkeypatch.setenv("HERMES_CURSOR_HOME", str(tmp_path))


def make_client() -> tuple[HermesCursorClient, FakeSupervisor]:
    supervisor = FakeSupervisor()
    return HermesCursorClient(supervisor=supervisor), supervisor


def test_unknown_model_fails_before_worker_request() -> None:
    client, supervisor = make_client()
    with pytest.raises(ValueError, match="exact allowlist"):
        client.chat.completions.create(
            model="unknown-model",
            messages=[{"role": "user", "content": "hello"}],
        )
    assert supervisor.requests == []


def test_nonstream_completion_has_openai_attribute_shape() -> None:
    client, supervisor = make_client()
    response = client.chat.completions.create(
        model="approved-model",
        messages=[{"role": "user", "content": "hello"}],
        extra_body={"hermes_session_id": "session-1"},
    )
    assert response.choices[0].message.content == "ok"
    assert supervisor.requests[0][1]["sessionId"] == "session-1"


def test_completion_without_explicit_session_id_is_uncorrelated() -> None:
    client, supervisor = make_client()
    client.chat.completions.create(
        model="approved-model",
        messages=[{"role": "user", "content": "title this"}],
    )
    assert "sessionId" not in supervisor.requests[0][1]


def test_reasoning_effort_is_forwarded_to_worker() -> None:
    client, supervisor = make_client()
    client.chat.completions.create(
        model="approved-model",
        messages=[{"role": "user", "content": "hello"}],
        reasoning_effort="high",
    )
    assert supervisor.requests[0][1]["reasoningEffort"] == "high"


def test_constructor_timeout_bounds_requests_and_call_override_wins() -> None:
    supervisor = FakeSupervisor()
    client = HermesCursorClient(supervisor=supervisor, timeout=12.5)
    client.chat.completions.create(
        model="approved-model",
        messages=[{"role": "user", "content": "hello"}],
    )
    client.chat.completions.create(
        model="approved-model",
        messages=[{"role": "user", "content": "hello"}],
        timeout=3,
    )
    assert supervisor.requests[0][1]["timeoutMs"] == 12_500
    assert supervisor.requests[1][1]["timeoutMs"] == 3_000


def test_structured_timeout_uses_read_limit_or_client_default() -> None:
    class StructuredTimeout:
        timeout = None
        read = None
        connect = 5

    supervisor = FakeSupervisor()
    client = HermesCursorClient(supervisor=supervisor, timeout=20)
    client.chat.completions.create(
        model="approved-model",
        messages=[{"role": "user", "content": "hello"}],
        timeout=StructuredTimeout(),
    )
    assert supervisor.requests[0][1]["timeoutMs"] == 20_000

    with pytest.raises(ValueError, match="finite positive"):
        client.chat.completions.create(
            model="approved-model",
            messages=[{"role": "user", "content": "hello"}],
            timeout=float("nan"),
        )


def test_explicit_session_id_must_be_nonempty_string() -> None:
    client, supervisor = make_client()
    with pytest.raises(UnsupportedRequestError, match="non-empty string"):
        client.chat.completions.create(
            model="approved-model",
            messages=[{"role": "user", "content": "hello"}],
            extra_body={"hermes_session_id": ""},
        )
    assert supervisor.requests == []


def test_stream_yields_incremental_openai_chunks() -> None:
    client, supervisor = make_client()
    supervisor.events = [
        WorkerEvent(
            "chunk",
            {
                "chunk": {
                    "choices": [{"delta": {"content": "a"}, "finish_reason": None}]
                }
            },
        ),
        WorkerEvent(
            "chunk",
            {
                "chunk": {
                    "choices": [{"delta": {"content": "b"}, "finish_reason": None}]
                }
            },
        ),
    ]
    stream = client.chat.completions.create(
        model="approved-model",
        messages=[{"role": "user", "content": "hello"}],
        stream=True,
    )
    assert [chunk.choices[0].delta.content for chunk in stream] == ["a", "b"]


def test_inline_two_by_two_png_passes_boundary_validation() -> None:
    client, supervisor = make_client()
    # Valid 2x2 red PNG.
    image = (
        "data:image/png;base64,"
        "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGP8z8DA"
        "wMDAxMDAAAANHQEDasKb6QAAAABJRU5ErkJggg=="
    )
    client.chat.completions.create(
        model="approved-model",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What color?"},
                    {"type": "image_url", "image_url": {"url": image}},
                ],
            }
        ],
    )
    assert supervisor.requests[0][0] == "chat"


def test_async_inline_image_completion_is_awaitable_and_nonblocking() -> None:
    client, supervisor = make_client()
    caller_thread = threading.get_ident()
    image = (
        "data:image/png;base64,"
        "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGP8z8DA"
        "wMDAxMDAAAANHQEDasKb6QAAAABJRU5ErkJggg=="
    )

    async def invoke() -> Any:
        return await client.chat.completions.create(
            model="approved-model",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "What color?"},
                        {"type": "image_url", "image_url": {"url": image}},
                    ],
                }
            ],
        )

    response = asyncio.run(invoke())
    assert response.choices[0].message.content == "ok"
    assert supervisor.request_threads[0] != caller_thread


def test_async_completion_stream_wraps_blocking_worker_stream() -> None:
    client, supervisor = make_client()
    supervisor.events = [
        WorkerEvent(
            "chunk",
            {"chunk": {"choices": [{"delta": {"content": "a"}, "finish_reason": None}]}},
        ),
        WorkerEvent(
            "chunk",
            {"chunk": {"choices": [{"delta": {"content": "b"}, "finish_reason": None}]}},
        ),
    ]

    async def collect() -> list[str]:
        stream = await client.chat.completions.create(
            model="approved-model",
            messages=[{"role": "user", "content": "hello"}],
            stream=True,
        )
        return [chunk.choices[0].delta.content async for chunk in stream]

    assert asyncio.run(collect()) == ["a", "b"]


def test_remote_webp_and_tool_result_images_are_rejected() -> None:
    client, _ = make_client()
    with pytest.raises(UnsupportedRequestError, match="Only inline"):
        client.chat.completions.create(
            model="approved-model",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": "https://example.test/image.png"},
                        }
                    ],
                }
            ],
        )
    with pytest.raises(UnsupportedRequestError, match="PNG, JPEG, or GIF"):
        client.chat.completions.create(
            model="approved-model",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": "data:image/webp;base64,UklGRg=="},
                        }
                    ],
                }
            ],
        )
    with pytest.raises(UnsupportedRequestError, match="tool results"):
        client.chat.completions.create(
            model="approved-model",
            messages=[{"role": "tool", "tool_call_id": "x", "content": []}],
        )


def test_unsupported_features_are_explicit() -> None:
    client, _ = make_client()
    with pytest.raises(UnsupportedRequestError, match="response_format"):
        client.chat.completions.create(
            model="approved-model",
            messages=[{"role": "user", "content": "hello"}],
            response_format={"type": "json_object"},
        )


def test_request_facades_share_worker_until_last_client_closes(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    supervisor = FakeSupervisor()
    monkeypatch.setattr(client_module, "WorkerSupervisor", lambda config: supervisor)
    client_module._WORKER_POOL.clear()
    shared_client = HermesCursorClient()
    request_client = HermesCursorClient()
    assert shared_client._worker is request_client._worker

    request_client.close()
    assert supervisor.is_closed is False
    shared_client.close()
    assert supervisor.is_closed is True
    assert client_module._WORKER_POOL == {}
