#!/usr/bin/env bash
# ==============================================================================
# BeatWave Pro - High-Performance FastAPI Launcher
# Zero Cloud Audio Ingestion • Native Local Processing • WebSocket Telemetry
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "⚡ Arrancando BEATWAVE PRO (FastAPI + ASGI + WebSocket Engine)..."

# Seleccionar interprete con FastAPI y Uvicorn
if command -v python3.7 >/dev/null 2>&1; then
    exec python3.7 -m uvicorn server_api:app --host 0.0.0.0 --port 8000 --log-level info "$@"
elif [ -f "/Library/Frameworks/Python.framework/Versions/3.14/bin/python3" ]; then
    exec /Library/Frameworks/Python.framework/Versions/3.14/bin/python3 -m uvicorn server_api:app --host 0.0.0.0 --port 8000 --log-level info "$@"
else
    exec python3 -m uvicorn server_api:app --host 0.0.0.0 --port 8000 --log-level info "$@"
fi
