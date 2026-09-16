from __future__ import annotations

import os
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pytest

from hermes_cursor_provider.config import ProviderConfig
from hermes_cursor_provider.worker import WorkerError, WorkerSupervisor


def fake_config(tmp_path: Path) -> ProviderConfig:
    return ProviderConfig(
        node=sys.executable,
        worker=Path(__file__).parent / "fixtures" / "fake_worker.py",
        credentials=tmp_path / "credentials.json",
        allowlist=tmp_path / "allowed-models.json",
        state=tmp_path / "state",
        allowed_models=("approved-model",),
    )


def test_worker_errors_expose_hermes_classification_status() -> None:
    assert WorkerError("expired", code="CURSOR_AUTH_EXPIRED").status_code == 401
    assert WorkerError("limited", code="resource_exhausted").status_code == 429
    assert WorkerError("down", code="transport", transient=True).status_code == 503


@pytest.mark.skipif(shutil.which("node") is None, reason="Node is not installed")
def test_worker_readiness_status_and_shutdown(tmp_path: Path) -> None:
    root = Path(__file__).parents[1]
    config = ProviderConfig(
        node=shutil.which("node") or "node",
        worker=root / "worker" / "worker.bundle.mjs",
        credentials=tmp_path / "credentials.json",
        allowlist=tmp_path / "allowed-models.json",
        state=tmp_path / "state",
        allowed_models=("approved-model",),
    )
    supervisor = WorkerSupervisor(config)
    status = supervisor.call("status")
    assert status["authenticated"] is False
    assert status["structuralOnly"] is True
    supervisor.close()
    assert supervisor.is_closed is True


@pytest.mark.skipif(os.name == "nt", reason="POSIX credential modes do not apply")
@pytest.mark.skipif(shutil.which("node") is None, reason="Node is not installed")
def test_worker_refuses_insecure_credential_permissions(tmp_path: Path) -> None:
    credentials = tmp_path / "credentials.json"
    credentials.write_text('{"refreshToken":"not-a-real-token"}', encoding="utf-8")
    credentials.chmod(0o644)
    allowlist = tmp_path / "allowed-models.json"
    allowlist.write_text('{"models":["approved-model"]}', encoding="utf-8")
    supervisor = WorkerSupervisor(
        ProviderConfig(
            node=shutil.which("node") or "node",
            worker=Path(__file__).parents[1] / "worker" / "worker.bundle.mjs",
            credentials=credentials,
            allowlist=allowlist,
            state=tmp_path / "state",
            allowed_models=("approved-model",),
        )
    )
    try:
        with pytest.raises(WorkerError) as raised:
            supervisor.call("models")
        assert raised.value.code == "CURSOR_AUTH_PERMISSIONS"
    finally:
        supervisor.close()


@pytest.mark.skipif(shutil.which("node") is None, reason="Node is not installed")
def test_bundled_worker_is_standalone_and_passes_self_test(tmp_path: Path) -> None:
    source = Path(__file__).parents[1] / "worker" / "worker.bundle.mjs"
    worker = tmp_path / "worker.bundle.mjs"
    shutil.copyfile(source, worker)
    result = subprocess.run(
        [shutil.which("node") or "node", str(worker), "--self-test"],
        text=True,
        capture_output=True,
        check=False,
        timeout=10,
    )
    assert result.returncode == 0, result.stderr
    assert '"ok":true' in result.stdout
    assert '"wireName":"read"' not in result.stdout
    assert '"lostContinuationGuard":true' in result.stdout
    assert '"unknownHistoryGuard":true' in result.stdout
    assert '"unsupportedWebpGuard":true' in result.stdout
    assert '"oauthRefreshGuard":true' in result.stdout
    assert '"reasoningEffortGuard":true' in result.stdout


def test_supervisor_multiplexes_concurrent_requests(tmp_path: Path) -> None:
    supervisor = WorkerSupervisor(fake_config(tmp_path))
    try:
        with ThreadPoolExecutor(max_workers=8) as executor:
            results = list(
                executor.map(
                    lambda number: supervisor.call("echo", {"number": number}),
                    range(20),
                )
            )
        assert sorted(result["number"] for result in results) == list(range(20))
    finally:
        supervisor.close()


def test_stream_cancellation_is_sent_to_worker(tmp_path: Path) -> None:
    supervisor = WorkerSupervisor(fake_config(tmp_path))
    try:
        request = supervisor.request("hold")
        request.close()
        with pytest.raises(WorkerError) as raised:
            next(request)
        assert raised.value.code == "CURSOR_CANCELLED"
    finally:
        supervisor.close()


def test_partial_stream_error_preserves_replay_safety(tmp_path: Path) -> None:
    supervisor = WorkerSupervisor(fake_config(tmp_path))
    try:
        request = supervisor.request("partial")
        assert next(request).payload["chunk"]["text"] == "partial"
        with pytest.raises(WorkerError) as raised:
            next(request)
        assert raised.value.transient is True
        assert raised.value.replay_safe is False
    finally:
        supervisor.close()


def test_worker_crash_fails_request_and_next_request_restarts(tmp_path: Path) -> None:
    supervisor = WorkerSupervisor(fake_config(tmp_path))
    try:
        with pytest.raises(WorkerError, match="exited"):
            supervisor.call("crash")
        assert supervisor.call("echo", {"restarted": True}) == {"restarted": True}
    finally:
        supervisor.close()
