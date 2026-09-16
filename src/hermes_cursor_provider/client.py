"""OpenAI-compatible client facade consumed by Hermes."""

from __future__ import annotations

import asyncio
import base64
import binascii
import math
import re
import struct
import threading
from io import BytesIO
from types import SimpleNamespace
from typing import Any, Protocol

from .config import ProviderConfig
from .worker import WorkerSupervisor

_DATA_IMAGE_RE = re.compile(
    r"^data:(image/(?:png|jpeg|gif));base64,([A-Za-z0-9+/]+={0,2})$",
    re.IGNORECASE,
)
_MAX_IMAGE_BYTES = 10 * 1024 * 1024
_MAX_IMAGES = 8
_MAX_DIMENSION = 16_384
_MAX_PIXELS = 100_000_000
_CURSOR_MAX_IMAGE_WIDTH = 2_000
_CURSOR_MAX_IMAGE_HEIGHT = 2_000
_CURSOR_MAX_IMAGE_BASE64_BYTES = 5 * 1024 * 1024
_CURSOR_JPEG_QUALITIES = (80, 85, 70, 55, 40)
_WORKER_POOL_LOCK = threading.Lock()
_WORKER_POOL: dict[tuple[Any, ...], tuple[WorkerSupervisor, int]] = {}


class _WorkerRequestProtocol(Protocol):
    def __iter__(self) -> Any: ...

    def __next__(self) -> Any: ...

    def result(self) -> Any: ...

    def close(self) -> None: ...


class _WorkerSupervisorProtocol(Protocol):
    def request(self, method: str, params: dict[str, Any]) -> _WorkerRequestProtocol: ...

    def call(self, method: str, params: dict[str, Any] | None = None) -> Any: ...

    def close(self) -> None: ...


def _worker_pool_key(config: ProviderConfig) -> tuple[Any, ...]:
    return (
        config.node,
        config.worker,
        config.credentials,
        config.allowlist,
        config.state,
        config.allowed_models,
    )


def _acquire_worker(config: ProviderConfig) -> tuple[tuple[Any, ...], WorkerSupervisor]:
    key = _worker_pool_key(config)
    with _WORKER_POOL_LOCK:
        existing = _WORKER_POOL.get(key)
        if existing is not None:
            worker, references = existing
            _WORKER_POOL[key] = (worker, references + 1)
            return key, worker
        worker = WorkerSupervisor(config)
        _WORKER_POOL[key] = (worker, 1)
        return key, worker


def _release_worker(key: tuple[Any, ...], worker: _WorkerSupervisorProtocol) -> None:
    close = False
    with _WORKER_POOL_LOCK:
        existing = _WORKER_POOL.get(key)
        if existing is None or existing[0] is not worker:
            return
        if existing[1] <= 1:
            _WORKER_POOL.pop(key, None)
            close = True
        else:
            _WORKER_POOL[key] = (existing[0], existing[1] - 1)
    if close:
        worker.close()


class UnsupportedRequestError(ValueError):
    """Hermes requested a feature this provider cannot safely preserve."""


def _namespace(value: Any) -> Any:
    if isinstance(value, dict):
        return SimpleNamespace(**{key: _namespace(item) for key, item in value.items()})
    if isinstance(value, list):
        return [_namespace(item) for item in value]
    return value


def _image_dimensions(data: bytes, mime: str) -> tuple[int, int] | None:
    if mime == "image/png" and len(data) >= 24 and data[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", data[16:24])
    if mime == "image/gif" and len(data) >= 10 and data[:6] in {b"GIF87a", b"GIF89a"}:
        return struct.unpack("<HH", data[6:10])
    if mime == "image/jpeg" and data[:2] == b"\xff\xd8":
        offset = 2
        while offset + 9 < len(data):
            if data[offset] != 0xFF:
                offset += 1
                continue
            marker = data[offset + 1]
            offset += 2
            if marker in {0xD8, 0xD9}:
                continue
            if offset + 2 > len(data):
                break
            length = int.from_bytes(data[offset : offset + 2], "big")
            if length < 2 or offset + length > len(data):
                break
            if marker in {
                0xC0,
                0xC1,
                0xC2,
                0xC3,
                0xC5,
                0xC6,
                0xC7,
                0xC9,
                0xCA,
                0xCB,
                0xCD,
                0xCE,
                0xCF,
            }:
                return (
                    int.from_bytes(data[offset + 5 : offset + 7], "big"),
                    int.from_bytes(data[offset + 3 : offset + 5], "big"),
                )
            offset += length
    return None


def _image_data_url(mime: str, data: bytes) -> str:
    return f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"


def _encode_image(image: Any, image_format: str, quality: int | None = None) -> bytes:
    output = BytesIO()
    options = {} if quality is None else {"quality": quality}
    image.save(output, format=image_format, **options)
    return output.getvalue()


def _normalize_cursor_image(
    url: str,
    mime: str,
    decoded: bytes,
    dimensions: tuple[int, int],
) -> str:
    width, height = dimensions
    encoded_size = len(base64.b64encode(decoded))
    if (
        width <= _CURSOR_MAX_IMAGE_WIDTH
        and height <= _CURSOR_MAX_IMAGE_HEIGHT
        and encoded_size <= _CURSOR_MAX_IMAGE_BASE64_BYTES
    ):
        return url

    try:
        from PIL import Image
    except ImportError as exc:
        raise UnsupportedRequestError(
            "Pillow is required to resize images for Cursor"
        ) from exc

    try:
        with Image.open(BytesIO(decoded)) as opened:
            opened.seek(0)
            opened.load()
            converted = (
                opened
                if opened.mode in {"RGB", "RGBA", "L", "LA"}
                else opened.convert("RGBA" if "transparency" in opened.info else "RGB")
            )
            try:
                source = converted.copy()
            finally:
                if converted is not opened:
                    converted.close()
    except Exception as exc:
        raise UnsupportedRequestError(f"Could not decode {mime} image for resizing") from exc

    scale = min(
        1.0,
        _CURSOR_MAX_IMAGE_WIDTH / width,
        _CURSOR_MAX_IMAGE_HEIGHT / height,
    )
    candidate_width = max(1, math.floor(width * scale + 0.5))
    candidate_height = max(1, math.floor(height * scale + 0.5))
    seen_sizes: set[tuple[int, int]] = set()
    try:
        for _ in range(32):
            size = (candidate_width, candidate_height)
            if size in seen_sizes:
                break
            seen_sizes.add(size)
            resized = (
                source.copy()
                if source.size == size
                else source.resize(size, Image.Resampling.LANCZOS)
            )
            try:
                png = _encode_image(resized, "PNG")
                if len(base64.b64encode(png)) <= _CURSOR_MAX_IMAGE_BASE64_BYTES:
                    return _image_data_url("image/png", png)

                jpeg_image = (
                    resized
                    if resized.mode in {"RGB", "L"}
                    else resized.convert("RGB")
                )
                try:
                    for quality in _CURSOR_JPEG_QUALITIES:
                        jpeg = _encode_image(jpeg_image, "JPEG", quality)
                        if len(base64.b64encode(jpeg)) <= _CURSOR_MAX_IMAGE_BASE64_BYTES:
                            return _image_data_url("image/jpeg", jpeg)
                finally:
                    if jpeg_image is not resized:
                        jpeg_image.close()
            finally:
                resized.close()

            candidate_width = (
                1 if candidate_width == 1 else max(1, math.floor(candidate_width * 0.75))
            )
            candidate_height = (
                1 if candidate_height == 1 else max(1, math.floor(candidate_height * 0.75))
            )
    finally:
        source.close()

    raise UnsupportedRequestError(
        "Image could not be resized below Cursor's 2000x2000 / 5 MiB base64 limits"
    )


def _prepare_messages(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    image_count = 0
    prepared_messages: list[dict[str, Any]] = []
    for message in messages:
        if not isinstance(message, dict):
            raise UnsupportedRequestError("Every message must be an object")
        role = message.get("role")
        content = message.get("content")
        if role == "tool" and isinstance(content, list):
            raise UnsupportedRequestError(
                "Images and multipart content in tool results are not supported"
            )
        if not isinstance(content, list):
            prepared_messages.append(message)
            continue
        prepared_content: list[Any] = []
        for part in content:
            if not isinstance(part, dict) or part.get("type") != "image_url":
                prepared_content.append(part)
                continue
            if role != "user":
                raise UnsupportedRequestError("Images are supported only in user messages")
            image_count += 1
            if image_count > _MAX_IMAGES:
                raise UnsupportedRequestError(
                    f"A request may contain at most {_MAX_IMAGES} images"
                )
            image_url = part.get("image_url")
            url = image_url.get("url") if isinstance(image_url, dict) else None
            if not isinstance(image_url, dict) or not isinstance(url, str):
                raise UnsupportedRequestError("image_url.url must be a string")
            match = _DATA_IMAGE_RE.fullmatch(url)
            if not match:
                raise UnsupportedRequestError(
                    "Only inline PNG, JPEG, or GIF base64 data URLs are supported"
                )
            mime = match.group(1).lower()
            try:
                decoded = base64.b64decode(match.group(2), validate=True)
            except (binascii.Error, ValueError) as exc:
                raise UnsupportedRequestError("Image data URL contains invalid base64") from exc
            if not decoded or len(decoded) > _MAX_IMAGE_BYTES:
                raise UnsupportedRequestError(
                    f"Each image must be between 1 byte and {_MAX_IMAGE_BYTES} bytes"
                )
            dimensions = _image_dimensions(decoded, mime)
            if dimensions is None:
                raise UnsupportedRequestError(f"Could not validate {mime} image dimensions")
            width, height = dimensions
            if (
                width <= 0
                or height <= 0
                or width > _MAX_DIMENSION
                or height > _MAX_DIMENSION
                or width * height > _MAX_PIXELS
            ):
                raise UnsupportedRequestError(
                    f"Image dimensions {width}x{height} exceed provider limits"
                )
            normalized_url = _normalize_cursor_image(url, mime, decoded, dimensions)
            if normalized_url == url:
                prepared_content.append(part)
            else:
                prepared_content.append(
                    {
                        **part,
                        "image_url": {
                            **image_url,
                            "url": normalized_url,
                        },
                    }
                )
        prepared_messages.append(
            message if all(a is b for a, b in zip(prepared_content, content, strict=True)) else {
                **message,
                "content": prepared_content,
            }
        )
    return prepared_messages


def _timeout_seconds(value: Any, *, default: float = 900.0) -> float:
    candidates = (value,) if isinstance(value, (int, float)) else (
        getattr(value, "timeout", None),
        getattr(value, "read", None),
    )
    for candidate in candidates:
        if candidate is None:
            continue
        if (
            isinstance(candidate, bool)
            or not isinstance(candidate, (int, float))
            or not math.isfinite(candidate)
            or candidate <= 0
        ):
            raise ValueError("Cursor request timeout must be a finite positive number")
        return float(candidate)
    return default


class _CompletionStream:
    def __init__(self, request: _WorkerRequestProtocol) -> None:
        self._request = request
        self._events = iter(request)
        self._closed = False

    def __iter__(self) -> _CompletionStream:
        return self

    def __next__(self) -> Any:
        for event in self._events:
            if event.type == "chunk":
                return _namespace(event.payload["chunk"])
        self._closed = True
        raise StopIteration

    def close(self) -> None:
        if not self._closed:
            self._closed = True
            self._request.close()

    def __enter__(self) -> _CompletionStream:
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    def __del__(self) -> None:
        self.close()


def _next_stream_item(stream: _CompletionStream) -> tuple[bool, Any]:
    """Read one synchronous stream item without leaking StopIteration through a Future."""
    try:
        return False, next(stream)
    except StopIteration:
        return True, None


class _AsyncCompletionStream:
    """Async iterator over the worker's blocking completion stream."""

    def __init__(self, stream: _CompletionStream) -> None:
        self._stream = stream

    def __aiter__(self) -> _AsyncCompletionStream:
        return self

    async def __anext__(self) -> Any:
        done, item = await asyncio.to_thread(_next_stream_item, self._stream)
        if done:
            raise StopAsyncIteration
        return item

    async def aclose(self) -> None:
        await asyncio.to_thread(self._stream.close)


class HermesCursorClient:
    """Minimal OpenAI client shape backed by one Hermes-owned Node worker."""

    HERMES_SKIP_TRANSPORT_WRAP = True
    HERMES_SKIP_ASYNC_WRAP = True

    def __init__(
        self,
        *,
        command: str | None = None,
        args: list[str] | None = None,
        supervisor: _WorkerSupervisorProtocol | None = None,
        timeout: Any = None,
        **_: Any,
    ) -> None:
        config = ProviderConfig.load()
        if command:
            config = ProviderConfig(
                node=command,
                worker=config.worker,
                credentials=config.credentials,
                allowlist=config.allowlist,
                state=config.state,
                allowed_models=config.allowed_models,
            )
        del args
        self._config = config
        self._allowed_models = frozenset(config.allowed_models)
        self._default_timeout_seconds = _timeout_seconds(timeout)
        self._pool_key: tuple[Any, ...] | None
        self._worker: _WorkerSupervisorProtocol
        if supervisor is None:
            self._pool_key, self._worker = _acquire_worker(config)
        else:
            self._pool_key, self._worker = None, supervisor
        self.chat = SimpleNamespace(
            completions=SimpleNamespace(create=self._dispatch_chat_completion)
        )
        self.api_key = ""
        self.base_url = "cursor+stdio://worker"
        self.is_closed = False

    def _dispatch_chat_completion(self, **kwargs: Any) -> Any:
        """Use the sync API normally and a worker thread when called from async Hermes paths."""
        try:
            asyncio.get_running_loop()
        except RuntimeError:
            return self._create_chat_completion(**kwargs)
        return self._create_chat_completion_async(**kwargs)

    async def _create_chat_completion_async(self, **kwargs: Any) -> Any:
        response = await asyncio.to_thread(self._create_chat_completion, **kwargs)
        if isinstance(response, _CompletionStream):
            return _AsyncCompletionStream(response)
        return response

    def _create_chat_completion(
        self,
        *,
        model: str,
        messages: list[dict[str, Any]],
        stream: bool = False,
        tools: list[dict[str, Any]] | None = None,
        tool_choice: Any = None,
        timeout: Any = None,
        extra_body: dict[str, Any] | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        reasoning_effort: str | None = None,
        n: int | None = None,
        response_format: Any = None,
        logprobs: Any = None,
        modalities: Any = None,
        audio: Any = None,
        **kwargs: Any,
    ) -> Any:
        if self.is_closed:
            raise RuntimeError("Cursor client is closed")
        if model not in self._allowed_models:
            raise ValueError(
                f"Cursor model {model!r} is not in the configured exact allowlist"
            )
        if n not in (None, 1):
            raise UnsupportedRequestError("Cursor provider supports exactly one completion")
        unsupported = {
            "response_format": response_format,
            "logprobs": logprobs,
            "modalities": modalities,
            "audio": audio,
        }
        requested = [name for name, value in unsupported.items() if value is not None]
        requested.extend(
            key
            for key, value in kwargs.items()
            if value is not None
            and key
            not in {
                "stream_options",
                "extra_headers",
                "parallel_tool_calls",
                "user",
                "top_p",
                "stop",
                "presence_penalty",
                "frequency_penalty",
                "seed",
            }
        )
        if requested:
            raise UnsupportedRequestError(
                "Cursor provider does not support request features: "
                + ", ".join(sorted(set(requested)))
            )
        prepared_messages = _prepare_messages(messages)
        scope = extra_body or {}
        session_id: str | None = None
        if "hermes_session_id" in scope:
            session_id = scope["hermes_session_id"]
            if not isinstance(session_id, str) or not session_id:
                raise UnsupportedRequestError(
                    "hermes_session_id must be a non-empty string"
                )
        timeout_seconds = (
            _timeout_seconds(timeout, default=self._default_timeout_seconds)
            if timeout is not None
            else self._default_timeout_seconds
        )
        params = {
            "model": model,
            "messages": prepared_messages,
            "stream": stream,
            "tools": tools or [],
            "toolChoice": tool_choice,
            "timeoutMs": int(timeout_seconds * 1000),
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
            "reasoningEffort": reasoning_effort,
        }
        if session_id is not None:
            params["sessionId"] = session_id
        request = self._worker.request("chat", params)
        if stream:
            return _CompletionStream(request)
        return _namespace(request.result())

    def list_models(self) -> list[str]:
        result = self._worker.call("models")
        if not isinstance(result, dict) or not isinstance(result.get("models"), list):
            raise RuntimeError("Cursor worker returned an invalid model catalog")
        return [
            str(item["id"])
            for item in result["models"]
            if isinstance(item, dict) and isinstance(item.get("id"), str)
        ]

    def status(self) -> dict[str, Any]:
        result = self._worker.call("status")
        return result if isinstance(result, dict) else {}

    def close(self) -> None:
        if self.is_closed:
            return
        if self._pool_key is None:
            self._worker.close()
        else:
            _release_worker(self._pool_key, self._worker)
        self.is_closed = True
