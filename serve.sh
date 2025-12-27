#!/usr/bin/env bash
set -euo pipefail
PORT="${PORT:-8000}"
cd "$(dirname "$0")"
PAGE=index.html; [[ -f $PAGE ]] || PAGE=dancing-girl.html
[[ -f $PAGE ]] || { echo "Missing index.html/dancing-girl.html" >&2; exit 1; }
PY=python3; command -v "$PY" >/dev/null 2>&1 || PY=python
URL="http://localhost:$PORT/$PAGE"
"$PY" -m http.server "$PORT" >/dev/null 2>&1 & PID=$!
trap 'kill "$PID" >/dev/null 2>&1' EXIT
sleep 0.2
if command -v open >/dev/null 2>&1; then
  open "$URL"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL"
else
  echo "$URL"
fi
wait "$PID"
