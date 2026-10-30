#!/usr/bin/env python3
"""
build_offline.py — Preparador de entorno offline para BEATWAVE PRO.

Ejecutar una sola vez (con conexión a Internet) para descargar y compilar
todos los recursos necesarios. Después la app funciona completamente offline.

Uso:
    python3 scripts/build_offline.py [--skip-vendor] [--skip-fonts] [--skip-css] [--skip-js]
"""

import argparse
import hashlib
import json
import os
import ssl
import subprocess
import sys
import urllib.request
from pathlib import Path
from typing import Optional

# SSL context para assets públicos (unpkg, jsdelivr, etc.)
def _ssl_ctx() -> ssl.SSLContext:
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        pass
    try:
        return ssl._create_unverified_context()
    except Exception:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx

_SSL_CTX = _ssl_ctx()

# ── Colores ANSI ─────────────────────────────────────────────────────────────
RESET  = "\033[0m"
BOLD   = "\033[1m"
GREEN  = "\033[32m"
CYAN   = "\033[36m"
YELLOW = "\033[33m"
RED    = "\033[31m"
DIM    = "\033[2m"

def ok(msg):    print(f"  {GREEN}✓{RESET}  {msg}")
def info(msg):  print(f"  {CYAN}→{RESET}  {msg}")
def warn(msg):  print(f"  {YELLOW}⚠{RESET}  {YELLOW}{msg}{RESET}")
def err(msg):   print(f"  {RED}✗{RESET}  {RED}{msg}{RESET}")
def head(msg):  print(f"\n{BOLD}{CYAN}▶ {msg}{RESET}")

# ── Rutas ─────────────────────────────────────────────────────────────────────
ROOT    = Path(__file__).parent.parent.resolve()
WEB     = ROOT / "web"
VENDOR  = WEB / "vendor"
FONTS   = WEB / "fonts"
CSS_OUT = WEB / "css"
JS_DIR  = WEB / "js"

# ── Vendor: React 18 UMD (production) ─────────────────────────────────────────
VENDOR_ASSETS = [
    {
        "url":      "https://unpkg.com/react@18/umd/react.production.min.js",
        "dest":     VENDOR / "react.production.min.js",
        "sha256":   None,  # se calcula en la primera descarga y se cachea
        "local":    "/vendor/react.production.min.js",
    },
    {
        "url":      "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
        "dest":     VENDOR / "react-dom.production.min.js",
        "sha256":   None,
        "local":    "/vendor/react-dom.production.min.js",
    },
]

# ── Fuentes web a descargar ────────────────────────────────────────────────────
# Subset manual de las familias usadas (woff2 desde Google Fonts CDN de Bunny/Fontsource)
FONT_FAMILIES = {
    "inter": {
        "css_url": (
            "https://fonts.googleapis.com/css2?"
            "family=Inter:wght@300;400;500;600;700&display=swap"
        ),
        "fallback": "sans-serif",
    },
    "jetbrains-mono": {
        "css_url": (
            "https://fonts.googleapis.com/css2?"
            "family=JetBrains+Mono:wght@400;500;700&display=swap"
        ),
        "fallback": "monospace",
    },
    "orbitron": {
        "css_url": (
            "https://fonts.googleapis.com/css2?"
            "family=Orbitron:wght@600;800;900&display=swap"
        ),
        "fallback": "sans-serif",
    },
    "syne": {
        "css_url": (
            "https://fonts.googleapis.com/css2?"
            "family=Syne:wght@700;800;900&display=swap"
        ),
        "fallback": "sans-serif",
    },
}

# ── Tailwind config inline (copia de tailwind.config.js) ──────────────────────
TAILWIND_CONFIG_JS = """
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./web/**/*.html",
        "./web/js/**/*.jsx",
        "./web/js/**/*.js",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans:  ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
                mono:  ["JetBrains Mono", "ui-monospace", "monospace"],
                syne:  ["Syne", "sans-serif"],
                orbitron: ["Orbitron", "sans-serif"],
            },
            colors: {
                djzinc: {
                    950: "#09090b", 925: "#101014", 900: "#121216",
                    850: "#18181f", 800: "#202028", 750: "#2a2a35",
                    700: "#32323f", 600: "#484858",
                },
                djcyan:  { 400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2", 950: "#0a1a1f" },
                djgreen: { 400: "#4ade80", 500: "#22c55e" },
            },
            screens: {
                xs: "375px",
            },
            backdropBlur: {
                xs: "2px",
            },
        },
    },
    plugins: [],
};
"""

# ── CSS base con @font-face fallback offline ───────────────────────────────────
FONTS_CSS_FALLBACK = """
/* ── Fuentes offline: se generan por build_offline.py ─────────────────────── */
/* Si no se pudo descargar woff2, usar stack de sistema */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: local('Inter'), local('Inter-Regular');
}
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: local('JetBrains Mono'), local('JetBrainsMono-Regular');
}
@font-face {
  font-family: 'Orbitron';
  font-style: normal;
  font-weight: 400 900;
  font-display: swap;
  src: local('Orbitron'), local('Orbitron-Regular');
}
@font-face {
  font-family: 'Syne';
  font-style: normal;
  font-weight: 400 900;
  font-display: swap;
  src: local('Syne'), local('Syne-Regular');
}
"""


# ─────────────────────────────────────────────────────────────────────────────
# Utilidades
# ─────────────────────────────────────────────────────────────────────────────

def download(url: str, dest: Path, label: str = "") -> bool:
    """Descarga url → dest. Devuelve True si éxito."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    label = label or dest.name
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30, context=_SSL_CTX) as resp:
            data = resp.read()
        dest.write_bytes(data)
        size_kb = len(data) / 1024
        ok(f"{label} → {dest.relative_to(ROOT)} ({size_kb:.1f} KB)")
        return True
    except Exception as exc:
        # Fallback con curl si urllib falla
        try:
            res = subprocess.run(
                ["curl", "-sSL", "-A", "Mozilla/5.0", url, "-o", str(dest)],
                capture_output=True, timeout=30
            )
            if res.returncode == 0 and dest.exists() and dest.stat().st_size > 0:
                size_kb = dest.stat().st_size / 1024
                ok(f"{label} (vía curl) → {dest.relative_to(ROOT)} ({size_kb:.1f} KB)")
                return True
        except Exception:
            pass
        err(f"No se pudo descargar {label}: {exc}")
        return False


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def run(cmd: list, cwd: Optional[Path] = None, capture: bool = False):
    """Ejecuta un subproceso; lanza SystemExit si falla."""
    result = subprocess.run(
        cmd, cwd=str(cwd or ROOT),
        capture_output=capture, text=True
    )
    if result.returncode != 0:
        if capture:
            err(result.stderr or result.stdout)
        raise SystemExit(f"Fallo al ejecutar: {' '.join(cmd)}")
    return result


def npm_install_if_needed():
    """Instala devDependencies si node_modules no existe."""
    nm = ROOT / "node_modules"
    if not nm.exists():
        info("Instalando devDependencies npm…")
        run(["npm", "install", "--prefer-offline"], cwd=ROOT)
        ok("node_modules instalado")
    else:
        ok("node_modules ya existe, omitiendo npm install")


def node_bin(name: str) -> str:
    """Devuelve la ruta al binario local de node_modules/.bin/."""
    candidate = ROOT / "node_modules" / ".bin" / name
    if candidate.exists():
        return str(candidate)
    return name  # fallback a PATH


# ─────────────────────────────────────────────────────────────────────────────
# Paso 1: Vendor — React + ReactDOM UMD
# ─────────────────────────────────────────────────────────────────────────────

def build_vendor():
    head("PASO 1 — Descarga de vendor (React 18 UMD)")
    VENDOR.mkdir(parents=True, exist_ok=True)

    checksums = {}
    checksum_file = VENDOR / "checksums.json"
    if checksum_file.exists():
        try:
            checksums = json.loads(checksum_file.read_text())
        except Exception:
            pass

    for asset in VENDOR_ASSETS:
        dest: Path = asset["dest"]
        if dest.exists():
            stored = checksums.get(dest.name)
            current = sha256_file(dest)
            if stored == current:
                ok(f"{dest.name} ya existe y checksum OK — omitiendo")
                continue
        download(asset["url"], dest, dest.name)
        if dest.exists():
            checksums[dest.name] = sha256_file(dest)

    checksum_file.write_text(json.dumps(checksums, indent=2))
    ok("checksums.json actualizado")


# ─────────────────────────────────────────────────────────────────────────────
# Paso 2: Fuentes web offline
# ─────────────────────────────────────────────────────────────────────────────

def build_fonts():
    head("PASO 2 — Descarga de fuentes web (woff2)")
    FONTS.mkdir(parents=True, exist_ok=True)

    # Intentamos descargar los woff2 directamente via fontsource (npm-free CDN alternativo)
    # Los pesos clave para la app
    fontsource_assets = [
        # Inter
        ("https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-400-normal.woff2",   "inter-400.woff2"),
        ("https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-500-normal.woff2",   "inter-500.woff2"),
        ("https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-600-normal.woff2",   "inter-600.woff2"),
        ("https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-700-normal.woff2",   "inter-700.woff2"),
        # JetBrains Mono
        ("https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/files/jetbrains-mono-latin-400-normal.woff2", "jetbrains-mono-400.woff2"),
        ("https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/files/jetbrains-mono-latin-700-normal.woff2", "jetbrains-mono-700.woff2"),
        # Orbitron
        ("https://cdn.jsdelivr.net/npm/@fontsource/orbitron@5/files/orbitron-latin-700-normal.woff2", "orbitron-700.woff2"),
        ("https://cdn.jsdelivr.net/npm/@fontsource/orbitron@5/files/orbitron-latin-900-normal.woff2", "orbitron-900.woff2"),
        # Syne
        ("https://cdn.jsdelivr.net/npm/@fontsource/syne@5/files/syne-latin-700-normal.woff2", "syne-700.woff2"),
        ("https://cdn.jsdelivr.net/npm/@fontsource/syne@5/files/syne-latin-800-normal.woff2", "syne-800.woff2"),
    ]

    downloaded = []
    failed = []
    for url, fname in fontsource_assets:
        dest = FONTS / fname
        if dest.exists():
            ok(f"{fname} ya existe — omitiendo")
            downloaded.append(fname)
            continue
        success = download(url, dest, fname)
        if success:
            downloaded.append(fname)
        else:
            failed.append(fname)

    # Generar fonts.css con @font-face apuntando a /fonts/*.woff2
    fonts_css_lines = [
        "/* fonts.css — Generado por build_offline.py — NO EDITAR MANUALMENTE */\n",
        "/* Fuentes locales cargadas desde /fonts/ para uso offline en cabina */\n\n",
    ]

    font_defs = [
        ("Inter",          "inter",          [("300","light"),("400","normal"),("500","medium"),("600","semibold"),("700","bold")], "sans-serif"),
        ("JetBrains Mono", "jetbrains-mono", [("400","normal"),("700","bold")], "monospace"),
        ("Orbitron",       "orbitron",       [("700","bold"),("900","black")], "sans-serif"),
        ("Syne",           "syne",           [("700","bold"),("800","extrabold")], "sans-serif"),
    ]

    for family_name, file_prefix, weights, fallback in font_defs:
        for weight_num, _ in weights:
            woff2_file = f"{file_prefix}-{weight_num}.woff2"
            if woff2_file in downloaded:
                src = f"url('/fonts/{woff2_file}') format('woff2'), local('{family_name}')"
            else:
                src = f"local('{family_name}')"
            fonts_css_lines.append(
                f"@font-face {{\n"
                f"  font-family: '{family_name}';\n"
                f"  font-style: normal;\n"
                f"  font-weight: {weight_num};\n"
                f"  font-display: swap;\n"
                f"  src: {src};\n"
                f"}}\n\n"
            )

    fonts_css_path = CSS_OUT / "fonts.css"
    CSS_OUT.mkdir(parents=True, exist_ok=True)
    fonts_css_path.write_text("".join(fonts_css_lines), encoding="utf-8")
    ok(f"fonts.css generado ({len(downloaded)}/{len(fontsource_assets)} woff2 descargados)")

    if failed:
        warn(f"No se descargaron: {', '.join(failed)} — se usará local() como fallback")


# ─────────────────────────────────────────────────────────────────────────────
# Paso 3: Tailwind CSS estático
# ─────────────────────────────────────────────────────────────────────────────

def build_css():
    head("PASO 3 — Generación de Tailwind CSS estático")

    # Escribir tailwind.config.js en la raíz del proyecto
    tw_config = ROOT / "tailwind.config.js"
    tw_config.write_text(TAILWIND_CONFIG_JS, encoding="utf-8")
    ok("tailwind.config.js escrito")

    # CSS de entrada con las directivas de Tailwind
    css_input = ROOT / "web" / "css" / "tailwind.input.css"
    css_input_content = (
        "@tailwind base;\n"
        "@tailwind components;\n"
        "@tailwind utilities;\n"
    )
    css_input.write_text(css_input_content, encoding="utf-8")

    css_out = CSS_OUT / "tailwind.min.css"

    tailwind_bin = node_bin("tailwindcss")
    info(f"Ejecutando Tailwind CLI → {css_out.relative_to(ROOT)}")
    try:
        result = subprocess.run(
            [
                tailwind_bin,
                "-i", str(css_input),
                "-o", str(css_out),
                "--minify",
            ],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode == 0:
            size_kb = css_out.stat().st_size / 1024
            ok(f"tailwind.min.css generado ({size_kb:.1f} KB)")
        else:
            err(f"Tailwind CLI falló:\n{result.stderr}")
            warn("Continuando sin CSS de Tailwind estático")
    except FileNotFoundError:
        err(f"tailwindcss no encontrado en {tailwind_bin}")
        warn("Ejecuta: npm install  y vuelve a correr el script")
    except subprocess.TimeoutExpired:
        err("Tailwind CLI superó el tiempo límite (120s)")


# ─────────────────────────────────────────────────────────────────────────────
# Paso 4: Bundle JS con esbuild
# ─────────────────────────────────────────────────────────────────────────────

def build_js():
    head("PASO 4 — Bundle JS (esbuild)")

    esbuild_bin = node_bin("esbuild")

    bundles = [
        {
            "entry":  WEB / "js" / "app.jsx",
            "output": WEB / "js" / "app.bundle.js",
            "label":  "app.bundle.js",
        },
    ]

    # Copilot bundle solo si existe el archivo fuente
    copilot_src = WEB / "js" / "copilot.jsx"
    copilot_js  = WEB / "js" / "copilot.js"
    if copilot_src.exists():
        bundles.append({
            "entry":  copilot_src,
            "output": WEB / "js" / "copilot.bundle.js",
            "label":  "copilot.bundle.js",
        })
    elif copilot_js.exists():
        bundles.append({
            "entry":  copilot_js,
            "output": WEB / "js" / "copilot.bundle.js",
            "label":  "copilot.bundle.js",
        })

    for bundle in bundles:
        entry  = bundle["entry"]
        output = bundle["output"]
        label  = bundle["label"]

        if not entry.exists():
            warn(f"{entry.name} no existe, omitiendo {label}")
            continue

        info(f"Compilando {entry.name} → {label}")
        try:
            result = subprocess.run(
                [
                    esbuild_bin,
                    str(entry),
                    f"--outfile={output}",
                    "--loader:.jsx=jsx",
                    "--target=es2019",
                    # React ya está disponible como global UMD desde vendor/
                    "--define:process.env.NODE_ENV=\"production\"",
                ],
                cwd=str(ROOT),
                capture_output=True,
                text=True,
                timeout=60,
            )
            if result.returncode == 0:
                size_kb = output.stat().st_size / 1024
                ok(f"{label} ({size_kb:.1f} KB)")
            else:
                err(f"esbuild falló para {label}:\n{result.stderr}")
        except FileNotFoundError:
            err(f"esbuild no encontrado en {esbuild_bin}")
            warn("Ejecuta: npm install")
        except subprocess.TimeoutExpired:
            err(f"esbuild superó el tiempo límite para {label}")


# ─────────────────────────────────────────────────────────────────────────────
# Paso 5: Parchear HTML para rutas locales
# ─────────────────────────────────────────────────────────────────────────────

def patch_html():
    head("PASO 5 — Actualización de HTML (CDN → local)")

    html_files = [
        WEB / "index.html",
        WEB / "copilot.html",
    ]

    for html_path in html_files:
        if not html_path.exists():
            warn(f"{html_path.name} no existe, omitiendo")
            continue

        content = html_path.read_text(encoding="utf-8")
        original = content

        # ── React + ReactDOM CDN → vendor local
        content = content.replace(
            'src="https://unpkg.com/react@18/umd/react.production.min.js"',
            'src="/vendor/react.production.min.js"',
        )
        content = content.replace(
            'src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"',
            'src="/vendor/react-dom.production.min.js"',
        )

        # ── Tailwind CDN script → CSS estático precompilado
        # Eliminar línea del CDN script y la del tailwind.config.js (ya no necesaria en runtime)
        lines = content.splitlines(keepends=True)
        new_lines = []
        tailwind_css_injected = False

        for line in lines:
            stripped = line.strip()

            # Eliminar Tailwind CDN runtime
            if 'cdn.tailwindcss.com' in stripped:
                if not tailwind_css_injected:
                    # Sustituir por el CSS compilado estático
                    indent = line[: len(line) - len(line.lstrip())]
                    new_lines.append(
                        f'{indent}<link rel="stylesheet" href="/css/tailwind.min.css">\n'
                    )
                    tailwind_css_injected = True
                # Omitir la línea original del CDN
                continue

            # Eliminar tailwind.config.js en runtime (ya no necesario con CSS estático)
            if '/js/tailwind.config.js' in stripped and '<script' in stripped:
                continue

            # Eliminar Google Fonts preconnect + link (reemplazar por fuentes locales)
            if 'fonts.googleapis.com' in stripped or 'fonts.gstatic.com' in stripped:
                if not any('/css/fonts.css' in l for l in new_lines):
                    indent = line[: len(line) - len(line.lstrip())]
                    new_lines.append(
                        f'{indent}<link rel="stylesheet" href="/css/fonts.css">\n'
                    )
                continue

            new_lines.append(line)

        content = "".join(new_lines)

        if content != original:
            # Guardar backup antes de modificar
            backup = html_path.with_suffix(".html.cdn-backup")
            if not backup.exists():
                backup.write_text(original, encoding="utf-8")
                info(f"Backup guardado: {backup.name}")
            html_path.write_text(content, encoding="utf-8")
            ok(f"{html_path.name} actualizado (CDN eliminado)")
        else:
            ok(f"{html_path.name} ya estaba sin CDN — sin cambios")


# ─────────────────────────────────────────────────────────────────────────────
# Paso 6: Crear .gitignore entries para node_modules
# ─────────────────────────────────────────────────────────────────────────────

def update_gitignore():
    head("PASO 6 — Actualización de .gitignore")
    gitignore = ROOT / ".gitignore"
    entries = [
        "node_modules/",
        "web/vendor/checksums.json",
        "web/css/tailwind.input.css",
        "tailwind.config.js",
    ]
    existing = gitignore.read_text(encoding="utf-8") if gitignore.exists() else ""
    added = []
    for entry in entries:
        if entry not in existing:
            existing += f"\n{entry}"
            added.append(entry)
    gitignore.write_text(existing, encoding="utf-8")
    if added:
        ok(f".gitignore actualizado: {', '.join(added)}")
    else:
        ok(".gitignore ya tenía todas las entradas necesarias")


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="BEATWAVE PRO — Preparador de entorno offline"
    )
    parser.add_argument("--skip-vendor", action="store_true", help="Omitir descarga de React/ReactDOM")
    parser.add_argument("--skip-fonts",  action="store_true", help="Omitir descarga de fuentes")
    parser.add_argument("--skip-css",    action="store_true", help="Omitir generación de CSS Tailwind")
    parser.add_argument("--skip-js",     action="store_true", help="Omitir compilación de JS")
    parser.add_argument("--skip-patch",  action="store_true", help="Omitir parcheo de HTML")
    args = parser.parse_args()

    print(f"\n{BOLD}{CYAN}╔══════════════════════════════════════════════════════╗")
    print(f"║   BEATWAVE PRO — Build Offline                       ║")
    print(f"╚══════════════════════════════════════════════════════╝{RESET}")
    print(f"{DIM}  Raíz del proyecto: {ROOT}{RESET}")

    # Siempre instalar npm deps si faltan (necesario para esbuild + tailwindcss)
    try:
        npm_install_if_needed()
    except SystemExit as e:
        err(str(e))
        warn("¿Tienes npm instalado? Instala Node.js ≥ 18 desde https://nodejs.org")
        sys.exit(1)

    if not args.skip_vendor:
        build_vendor()

    if not args.skip_fonts:
        build_fonts()

    if not args.skip_css:
        build_css()

    if not args.skip_js:
        build_js()

    if not args.skip_patch:
        patch_html()

    update_gitignore()

    print(f"\n{BOLD}{GREEN}╔══════════════════════════════════════════════════════╗")
    print(f"║   ✓  Build offline completado                        ║")
    print(f"╚══════════════════════════════════════════════════════╝{RESET}")
    print(f"""
{DIM}Recursos generados:
  web/vendor/react.production.min.js        ← React 18 UMD
  web/vendor/react-dom.production.min.js    ← ReactDOM 18 UMD
  web/fonts/*.woff2                         ← Fuentes web locales
  web/css/fonts.css                         ← @font-face offline
  web/css/tailwind.min.css                  ← CSS Tailwind estático
  web/js/app.bundle.js                      ← Bundle React compilado
  web/index.html                            ← Solo rutas locales
  web/copilot.html                          ← Solo rutas locales{RESET}
""")


if __name__ == "__main__":
    main()
