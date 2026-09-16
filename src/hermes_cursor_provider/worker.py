"""Framed-stdio supervisor for the Hermes-owned Cursor worker."""

from __future__ import annotations

import contextlib
import json
import queue
import struct
import subprocess
import threading
import time
from collections import deque
from collections.abc import Iterator
from dataclasses import dataclass
from typing import Any

from .config import MAX_FRAME_BYTES, PROTOCOL_VERSION, ProviderConfig


class WorkerError(RuntimeError):
    """A sanitized worker or Cursor upstream failure."""

    def __init__(
        self,
        message: str,
        *,
        code: str = "CURSOR_WORKER_ERROR",
        transient: bool = False,
        replay_safe: bool = False,
        retry_after_ms: int | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.transient = transient
        self.replay_safe = replay_safe
        self.retry_after_ms = retry_after_ms
        self.status_code = self._status_for_code(code, transient)

    @staticmethod
    def _status_for_code(code: str, transient: bool) -> int | None:
        normalized = code.lower()
        if any(part in normalized for part in ("auth", "unauthenticated")):
            return 401
        if "permission" in normalized:
            return 403
        if any(part in normalized for part in ("rate", "resource_exhausted")):
            return 429
        if any(part in normalized for part in ("too_large", "payload")):
            return 413
        if any(part in normalized for part in ("model_unavailable", "not_found")):
            return 404
        if transient:
            return 503
        return None

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> WorkerError:
        return cls(
            str(payload.get("message") or "Cursor worker request failed"),
            code=str(payload.get("code") or "CURSOR_WORKER_ERROR"),
            transient=payload.get("transient") is True,
            replay_safe=payload.get("replaySafe") is True,
            retry_after_ms=(
                int(payload["retryAfterMs"])
                if isinstance(payload.get("retryAfterMs"), (int, float))
                else None
            ),
        )


@dataclass
class WorkerEvent:
    type: str
    payload: dict[str, Any]


_END = object()


class WorkerRequest(Iterator[WorkerEvent]):
    def __init__(
        self,
        supervisor: WorkerSupervisor,
        request_id: str,
        inbox: queue.Queue[dict[str, Any] | BaseException | object],
    ) -> None:
        self._supervisor = supervisor
        self.request_id = request_id
        self._inbox = inbox
        self._closed = False

    def __iter__(self) -> WorkerRequest:
        return self

    def __next__(self) -> WorkerEvent:
        item = self._inbox.get()
        if item is _END:
            self._closed = True
            raise StopIteration
        if isinstance(item, BaseException):
            self._closed = True
            raise item
        if not isinstance(item, dict):
            self._closed = True
            raise WorkerError("Invalid internal worker event", code="CURSOR_PROTOCOL_ERROR")
        event_type = str(item.get("type") or "")
        if event_type == "error":
            self._closed = True
            raise WorkerError.from_payload(item.get("error") or {})
        return WorkerEvent(event_type, item)

    def result(self) -> Any:
        for event in self:
            if event.type == "result":
                self._closed = True
                return event.payload.get("result")
        raise WorkerError("Cursor worker ended without a result", code="CURSOR_PROTOCOL_ERROR")

    def close(self) -> None:
        if self._closed:
            return
        self._closed = True
        self._supervisor.cancel(self.request_id)

    def __enter__(self) -> WorkerRequest:
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    def __del__(self) -> None:
        with contextlib.suppress(Exception):
            self.close()


class WorkerSupervisor:
    """Own one lazy worker process and multiplex requests by request ID."""

    def __init__(self, config: ProviderConfig, *, readiness_timeout: float = 15.0) -> None:
        self.config = config
        self.readiness_timeout = readiness_timeout
        self._process: subprocess.Popen[bytes] | None = None
        self._write_lock = threading.Lock()
        self._lifecycle_lock = threading.RLock()
        self._pending_lock = threading.Lock()
        self._pending: dict[str, queue.Queue[dict[str, Any] | BaseException | object]] = {}
        self._ready = threading.Event()
        self._request_number = 0
        self._stderr_tail: deque[str] = deque(maxlen=20)
        self.is_closed = False

    def _start(self) -> None:
        with self._lifecycle_lock:
            if self._process is not None and self._process.poll() is None:
                return
            if self.is_closed:
                raise WorkerError("Cursor client is closed", code="CURSOR_CLIENT_CLOSED")
            if not self.config.worker.is_file():
                raise WorkerError(
                    f"Cursor worker not found at {self.config.worker}",
                    code="CURSOR_WORKER_NOT_FOUND",
                )
            self._ready.clear()
            self._stderr_tail.clear()
            creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
            try:
                process = subprocess.Popen(
                    [self.config.node, str(self.config.worker), "--stdio"],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    env=self.config.worker_environment(),
                    bufsize=0,
                    creationflags=creationflags,
                )
            except (OSError, ValueError) as exc:
                raise WorkerError(
                    f"Could not start Cursor worker with {self.config.node!r}: {exc}",
                    code="CURSOR_WORKER_START_FAILED",
                ) from exc
            self._process = process
            threading.Thread(target=self._read_loop, args=(process,), daemon=True).start()
            threading.Thread(target=self._stderr_loop, args=(process,), daemon=True).start()
        if not self._ready.wait(self.readiness_timeout):
            self._terminate(process)
            detail = self._stderr_tail[-1] if self._stderr_tail else "no diagnostic"
            raise WorkerError(
                f"Cursor worker did not become ready: {detail}",
                code="CURSOR_WORKER_NOT_READY",
            )
        if process.poll() is not None:
            detail = self._stderr_tail[-1] if self._stderr_tail else "no diagnostic"
            raise WorkerError(
                f"Cursor worker exited before readiness: {detail}",
                code="CURSOR_WORKER_START_FAILED",
            )

    @staticmethod
    def _read_exact(stream: Any, length: int) -> bytes | None:
        chunks: list[bytes] = []
        remaining = length
        while remaining:
            chunk = stream.read(remaining)
            if not chunk:
                return None
            chunks.append(chunk)
            remaining -= len(chunk)
        return b"".join(chunks)

    def _read_loop(self, process: subprocess.Popen[bytes]) -> None:
        stream = process.stdout
        assert stream is not None
        failure: BaseException | None = None
        try:
            while True:
                header = self._read_exact(stream, 4)
                if header is None:
                    break
                length = struct.unpack(">I", header)[0]
                if length <= 0 or length > MAX_FRAME_BYTES:
                    raise WorkerError(
                        "Cursor worker sent an invalid frame length",
                        code="CURSOR_PROTOCOL_ERROR",
                    )
                body = self._read_exact(stream, length)
                if body is None:
                    raise WorkerError(
                        "Cursor worker closed during a frame",
                        code="CURSOR_WORKER_EXITED",
                    )
                message = json.loads(body)
                if message.get("type") == "ready":
                    if message.get("protocolVersion") != PROTOCOL_VERSION:
                        raise WorkerError(
                            "Cursor worker protocol version mismatch",
                            code="CURSOR_PROTOCOL_VERSION",
                        )
                    self._ready.set()
                    continue
                request_id = str(message.get("id") or "")
                with self._pending_lock:
                    inbox = self._pending.get(request_id)
                    if message.get("type") in {"result", "error", "done"}:
                        self._pending.pop(request_id, None)
                if inbox is not None:
                    inbox.put(message)
                    if message.get("type") in {"result", "error", "done"}:
                        inbox.put(_END)
        except BaseException as exc:
            failure = exc
        finally:
            if not self._ready.is_set():
                self._ready.set()
            error = failure or WorkerError(
                f"Cursor worker exited with status {process.poll()}",
                code="CURSOR_WORKER_EXITED",
                transient=True,
            )
            with self._pending_lock:
                pending, self._pending = self._pending, {}
            for inbox in pending.values():
                inbox.put(error)

    def _stderr_loop(self, process: subprocess.Popen[bytes]) -> None:
        stream = process.stderr
        assert stream is not None
        for raw in iter(stream.readline, b""):
            text = raw.decode("utf-8", errors="replace").strip()
            if text:
                self._stderr_tail.append(text[:500])

    def _send(self, message: dict[str, Any]) -> None:
        self._start()
        encoded = json.dumps(
            message, ensure_ascii=True, separators=(",", ":")
        ).encode("utf-8")
        if len(encoded) > MAX_FRAME_BYTES:
            raise WorkerError("Cursor worker request is too large", code="CURSOR_REQUEST_TOO_LARGE")
        frame = struct.pack(">I", len(encoded)) + encoded
        with self._write_lock:
            process = self._process
            if process is None or process.poll() is not None or process.stdin is None:
                raise WorkerError(
                    "Cursor worker is unavailable",
                    code="CURSOR_WORKER_EXITED",
                    transient=True,
                )
            try:
                process.stdin.write(frame)
                process.stdin.flush()
            except (BrokenPipeError, OSError) as exc:
                raise WorkerError(
                    "Cursor worker pipe closed",
                    code="CURSOR_WORKER_EXITED",
                    transient=True,
                ) from exc

    def request(self, method: str, params: dict[str, Any] | None = None) -> WorkerRequest:
        with self._pending_lock:
            self._request_number += 1
            request_id = f"{int(time.time() * 1000):x}-{self._request_number:x}"
            inbox: queue.Queue[dict[str, Any] | BaseException | object] = queue.Queue()
            self._pending[request_id] = inbox
        try:
            self._send(
                {
                    "protocolVersion": PROTOCOL_VERSION,
                    "id": request_id,
                    "method": method,
                    "params": params or {},
                }
            )
        except BaseException:
            with self._pending_lock:
                self._pending.pop(request_id, None)
            raise
        return WorkerRequest(self, request_id, inbox)

    def call(self, method: str, params: dict[str, Any] | None = None) -> Any:
        return self.request(method, params).result()

    def cancel(self, request_id: str) -> None:
        if self.is_closed:
            return
        with contextlib.suppress(Exception):
            self._send(
                {
                    "protocolVersion": PROTOCOL_VERSION,
                    "id": f"cancel-{request_id}",
                    "method": "cancel",
                    "params": {"requestId": request_id},
                }
            )

    @staticmethod
    def _terminate(process: subprocess.Popen[bytes]) -> None:
        with contextlib.suppress(Exception):
            process.terminate()
            process.wait(timeout=2)
        if process.poll() is None:
            with contextlib.suppress(Exception):
                process.kill()
                process.wait(timeout=2)

    def close(self) -> None:
        with self._lifecycle_lock:
            if self.is_closed:
                return
            process = self._process
            if process is not None and process.poll() is None:
                with contextlib.suppress(Exception):
                    self._send(
                        {
                            "protocolVersion": PROTOCOL_VERSION,
                            "id": "shutdown",
                            "method": "shutdown",
                            "params": {},
                        }
                    )
                self._terminate(process)
            self._process = None
            self.is_closed = True
