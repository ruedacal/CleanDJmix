#!/usr/bin/env bash
# ==============================================================================
# BeatWave Pro - Desktop Native Builder (Tauri v2)
# Genera instaladores ultraligeros (.dmg para macOS, .msi/.exe para Windows)
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "🎵 [1/3] Compilando Frontend Offline de BeatWave PRO..."
python3 scripts/build_offline.py --skip-vendor --skip-fonts --skip-css

echo "⚙️  [2/3] Verificando dependencias del empaquetador Tauri..."
if ! command -v cargo >/dev/null 2>&1; then
    echo "⚠️  Cargo/Rust no detectado en el PATH del sistema."
    echo "👉 Para compilar el binario nativo (.dmg/.msi), instala Rust ejecutando:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    echo "ℹ️  Los archivos de configuración Tauri (src-tauri/) y el frontend están listos para build."
    exit 0
fi

if ! command -v cargo-tauri >/dev/null 2>&1; then
    echo "📦 Instalando CLI de Tauri v2..."
    cargo install tauri-cli --version "^2.0.0"
fi

echo "🚀 [3/3] Ejecutando Tauri Build (Empaquetado Nativo)..."
cargo tauri build

echo "✅ Instaladores generados exitosamente en src-tauri/target/release/bundle/"
