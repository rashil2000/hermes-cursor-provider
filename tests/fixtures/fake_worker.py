from __future__ import annotations

import json
import os
import struct
import sys
import threading
from typing import Any

write_lock = threading.Lock()
held: set[str] = set()


def read_exact(length: int) -> bytes | None:
    chunks: list[bytes] = []
    while length:
        chunk = sys.stdin.buffer.read(length)
        if not chunk:
            return None
        chunks.append(chunk)
        length -= len(chunk)
    return b"".join(chunks)


def read_frame() -> dict[str, Any] | None:
    header = read_exact(4)
    if header is None:
        return None
    body = read_exact(struct.unpack(">I", header)[0])
    return json.loads(body) if body is not None else None


def write_frame(message: dict[str, Any]) -> None:
    body = json.dumps(message).encode()
    with write_lock:
        sys.stdout.buffer.write(struct.pack(">I", len(body)) + body)
        sys.stdout.buffer.flush()


write_frame({"type": "ready", "protocolVersion": 1})
while message := read_frame():
    request_id = str(message["id"])
    method = message["method"]
    if method == "crash":
        os._exit(7)
    if method == "hold":
        held.add(request_id)
        continue
    if method == "cancel":
        target = str(message["params"]["requestId"])
        if target in held:
            held.remove(target)
            write_frame(
                {
                    "id": target,
                    "type": "error",
                    "error": {"message": "cancelled", "code": "CURSOR_CANCELLED"},
                }
            )
        write_frame({"id": request_id, "type": "result", "result": {"cancelled": True}})
        continue
    if method == "partial":
        write_frame({"id": request_id, "type": "chunk", "chunk": {"text": "partial"}})
        write_frame(
            {
                "id": request_id,
                "type": "error",
                "error": {
                    "message": "interrupted",
                    "code": "CURSOR_PARTIAL_STREAM",
                    "transient": True,
                    "replaySafe": False,
                },
            }
        )
        continue
    if method == "shutdown":
        write_frame({"id": request_id, "type": "result", "result": {"stopped": True}})
        break
    write_frame({"id": request_id, "type": "result", "result": message.get("params", {})})
