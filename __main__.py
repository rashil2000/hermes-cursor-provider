"""Repository-local CLI for Git-installed copies of the plugin."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from hermes_cursor_provider.cli import main  # noqa: E402

raise SystemExit(main())
