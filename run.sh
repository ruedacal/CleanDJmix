#!/usr/bin/env bash
# ==============================================================================
# BeatWave Pro - Launcher Oficial
# Asegura la ejecución con el entorno Python correcto (Python 3.7 con Eel)
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "🎵 Iniciando BEATWAVE PRO..."

# 1. Probar python3.7 (instalación oficial con Eel y mutagen)
if command -v python3.7 >/dev/null 2>&1; then
    exec python3.7 main_web.py "$@"
# 2. Probar ruta de Framework oficial Python 3.7
elif [ -f "/Library/Frameworks/Python.framework/Versions/3.7/bin/python3" ]; then
    exec /Library/Frameworks/Python.framework/Versions/3.7/bin/python3 main_web.py "$@"
# 3. Fallback a python3 estándar
else
    exec python3 main_web.py "$@"
fi
