from __future__ import annotations

import importlib.util
import subprocess
import sys
import types
from pathlib import Path
from typing import Any


class FakeProviderProfile:
    def __init__(self, **values: Any) -> None:
        self.__dict__.update(values)


def test_git_install_entrypoint_registers_and_finds_bundled_worker(
    monkeypatch: Any,
) -> None:
    root = Path(__file__).parents[1]
    registered: list[Any] = []
    providers = types.ModuleType("providers")
    providers.register_provider = registered.append  # type: ignore[attr-defined]
    providers_base = types.ModuleType("providers.base")
    providers_base.ProviderProfile = FakeProviderProfile  # type: ignore[attr-defined]
    monkeypatch.setitem(sys.modules, "providers", providers)
    monkeypatch.setitem(sys.modules, "providers.base", providers_base)
    for loaded_name in list(sys.modules):
        if loaded_name == "hermes_cursor_provider" or loaded_name.startswith(
            "hermes_cursor_provider."
        ):
            monkeypatch.delitem(sys.modules, loaded_name)

    module_name = "_hermes_user_provider_cursor"
    spec = importlib.util.spec_from_file_location(
        module_name,
        root / "__init__.py",
        submodule_search_locations=[str(root)],
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    monkeypatch.setitem(sys.modules, module_name, module)
    spec.loader.exec_module(module)

    assert [profile.name for profile in registered] == ["cursor"]
    config_module = sys.modules["hermes_cursor_provider.config"]
    assert config_module.worker_entrypoint() == root / "worker" / "worker.bundle.mjs"


def test_repository_local_cli_runs_without_installing_package() -> None:
    root = Path(__file__).parents[1]
    completed = subprocess.run(
        [sys.executable, str(root), "--help"],
        text=True,
        capture_output=True,
        check=False,
        timeout=10,
    )
    assert completed.returncode == 0, completed.stderr
    assert "login" in completed.stdout
