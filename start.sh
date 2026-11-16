#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
exec uv run --no-project --cache-dir "${UV_CACHE_DIR:-.cache/uv}" --python "${UV_PYTHON:-3.12}" --with-requirements requirements.txt python -u app.py
