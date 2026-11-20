#!/usr/bin/env python3
"""
Genera el paquete completo de exportación para Figma en `Figma_Design/`.
Incluye:
1. Tokens de diseño (W3C / Tokens Studio JSON y Figma Variables).
2. Hojas de estilo CSS completas (Tailwind, BeatWave DS, Fonts).
3. Assets y vectores.
4. Renderizado HTML completo de cada pantalla con clases, estilos y auto-layout preservados.
5. README explicativo paso a paso.
"""
import os
import shutil
import subprocess
import json
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT_DIR, "Figma_Design")
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def setup_directories():
    os.makedirs(os.path.join(OUT_DIR, "tokens"), exist_ok=True)
    os.makedirs(os.path.join(OUT_DIR, "css"), exist_ok=True)
    os.makedirs(os.path.join(OUT_DIR, "assets"), exist_ok=True)
    os.makedirs(os.path.join(OUT_DIR, "screens"), exist_ok=True)
    print(f"✓ Carpetas creadas en {OUT_DIR}")

def copy_css_and_assets():
    # Copiar CSS
    web_css = os.path.join(ROOT_DIR, "web", "css")
    out_css = os.path.join(OUT_DIR, "css")
    for f in os.listdir(web_css):
        src = os.path.join(web_css, f)
        if os.path.isfile(src):
            shutil.copy2(src, os.path.join(out_css, f))
    
    styles_src = os.path.join(ROOT_DIR, "web", "styles.css")
    if os.path.isfile(styles_src):
        shutil.copy2(styles_src, os.path.join(out_css, "styles.css"))
    print("✓ Hojas de estilo CSS copiadas (Tailwind, BeatWave DS, Fonts)")

    # Copiar Assets (imágenes, SVGs, favicon)
    web_assets = os.path.join(ROOT_DIR, "web", "assets")
    out_assets = os.path.join(OUT_DIR, "assets")
    if os.path.isdir(web_assets):
        shutil.copytree(web_assets, out_assets, dirs_exist_ok=True)
    print("✓ Assets gráficos copiados")

def generate_tokens():
    # 1. Tokens Studio / W3C Design Tokens JSON
    tokens = {
        "global": {
            "color": {
                "djcyan": {
                    "200": { "value": "#A5F3FC", "type": "color", "description": "Cyan Light Tint" },
                    "300": { "value": "#67E8F9", "type": "color", "description": "Cyan Glow / Neon" },
                    "400": { "value": "#22D3EE", "type": "color", "description": "Primary Brand Cyan (Focus, Active)" },
                    "500": { "value": "#06B6D4", "type": "color", "description": "Cyan Core" },
                    "600": { "value": "#0891B2", "type": "color", "description": "Cyan Dark Accent" },
                    "700": { "value": "#0E7490", "type": "color", "description": "Cyan Deep Accent" },
                    "800": { "value": "#155E75", "type": "color", "description": "Cyan Border / Stroke" },
                    "900": { "value": "#164E63", "type": "color", "description": "Cyan Surface Deep" },
                    "950": { "value": "#082f49", "type": "color", "description": "Cyan Dark Container" }
                },
                "djzinc": {
                    "950": { "value": "#09090B", "type": "color", "description": "App Canvas Background" },
                    "925": { "value": "#101014", "type": "color", "description": "Deep Surface / Panel" },
                    "900": { "value": "#121216", "type": "color", "description": "Card & Deck Surface" },
                    "850": { "value": "#18181F", "type": "color", "description": "Nested Wells & Controls" },
                    "800": { "value": "#202028", "type": "color", "description": "Subtle Borders" },
                    "750": { "value": "#2A2A35", "type": "color", "description": "Default Border / Hairlines" },
                    "700": { "value": "#32323F", "type": "color", "description": "Active Borders" },
                    "600": { "value": "#484858", "type": "color", "description": "Muted Text & Icons" }
                },
                "signals": {
                    "sub_bass": { "value": "#3B82F6", "type": "color", "description": "DSP Band < 150 Hz" },
                    "low_mid": { "value": "#EF4444", "type": "color", "description": "DSP Band 150-800 Hz" },
                    "mid_high": { "value": "#F59E0B", "type": "color", "description": "DSP Band 800-4000 Hz" },
                    "treble": { "value": "#22D3EE", "type": "color", "description": "DSP Band > 4000 Hz" }
                },
                "semantic": {
                    "background": { "value": "{color.djzinc.950}", "type": "color" },
                    "surface": { "value": "{color.djzinc.900}", "type": "color" },
                    "surface_secondary": { "value": "{color.djzinc.850}", "type": "color" },
                    "border": { "value": "{color.djzinc.750}", "type": "color" },
                    "primary": { "value": "{color.djcyan.400}", "type": "color" },
                    "success": { "value": "#4ADE80", "type": "color" },
                    "warning": { "value": "#FBBF24", "type": "color" },
                    "destructive": { "value": "#F87171", "type": "color" }
                }
            },
            "fontFamilies": {
                "title": { "value": "Syne, sans-serif", "type": "fontFamilies" },
                "mono": { "value": "'JetBrains Mono', monospace", "type": "fontFamilies" },
                "body": { "value": "Inter, sans-serif", "type": "fontFamilies" }
            },
            "fontSize": {
                "display": { "value": "48px", "type": "fontSizes" },
                "h1": { "value": "36px", "type": "fontSizes" },
                "h2": { "value": "30px", "type": "fontSizes" },
                "h3": { "value": "24px", "type": "fontSizes" },
                "h4": { "value": "20px", "type": "fontSizes" },
                "body_lg": { "value": "18px", "type": "fontSizes" },
                "body": { "value": "16px", "type": "fontSizes" },
                "small": { "value": "14px", "type": "fontSizes" },
                "label": { "value": "12px", "type": "fontSizes" },
                "micro": { "value": "10px", "type": "fontSizes" }
            },
            "borderRadius": {
                "sm": { "value": "4px", "type": "borderRadius" },
                "md": { "value": "8px", "type": "borderRadius" },
                "lg": { "value": "12px", "type": "borderRadius" },
                "xl": { "value": "16px", "type": "borderRadius" },
                "2xl": { "value": "24px", "type": "borderRadius" },
                "full": { "value": "9999px", "type": "borderRadius" }
            },
            "spacing": {
                "0": { "value": "0px", "type": "spacing" },
                "1": { "value": "4px", "type": "spacing" },
                "2": { "value": "8px", "type": "spacing" },
                "3": { "value": "12px", "type": "spacing" },
                "4": { "value": "16px", "type": "spacing" },
                "5": { "value": "20px", "type": "spacing" },
                "6": { "value": "24px", "type": "spacing" },
                "8": { "value": "32px", "type": "spacing" },
                "10": { "value": "40px", "type": "spacing" },
                "12": { "value": "48px", "type": "spacing" },
                "16": { "value": "64px", "type": "spacing" }
            }
        }
    }

    tokens_path = os.path.join(OUT_DIR, "tokens", "beatwave_tokens.json")
    with open(tokens_path, "w", encoding="utf-8") as f:
        json.dump(tokens, f, indent=2)
    print("✓ beatwave_tokens.json generado (compatible con Tokens Studio y Figma Variables)")

    # 2. Figma Variables Collections JSON (para Plugin API / REST import)
    figma_vars = {
        "collections": [
            {
                "name": "BeatWave PRO - Colors",
                "modes": ["Dark (Club)"],
                "variables": [
                    { "name": "color/background", "type": "COLOR", "value": "#09090B", "scopes": ["FRAME_FILL"] },
                    { "name": "color/surface", "type": "COLOR", "value": "#121216", "scopes": ["FRAME_FILL"] },
                    { "name": "color/surface-2", "type": "COLOR", "value": "#18181F", "scopes": ["FRAME_FILL"] },
                    { "name": "color/border", "type": "COLOR", "value": "#2A2A35", "scopes": ["STROKE_COLOR"] },
                    { "name": "color/primary", "type": "COLOR", "value": "#22D3EE", "scopes": ["ALL_SCOPES"] },
                    { "name": "color/primary-hover", "type": "COLOR", "value": "#06B6D4", "scopes": ["ALL_SCOPES"] },
                    { "name": "color/success", "type": "COLOR", "value": "#4ADE80", "scopes": ["ALL_SCOPES"] },
                    { "name": "color/warning", "type": "COLOR", "value": "#FBBF24", "scopes": ["ALL_SCOPES"] },
                    { "name": "color/destructive", "type": "COLOR", "value": "#F87171", "scopes": ["ALL_SCOPES"] },
                    { "name": "dsp/sub-bass", "type": "COLOR", "value": "#3B82F6", "scopes": ["ALL_SCOPES"] },
                    { "name": "dsp/low-mid", "type": "COLOR", "value": "#EF4444", "scopes": ["ALL_SCOPES"] },
                    { "name": "dsp/mid-high", "type": "COLOR", "value": "#F59E0B", "scopes": ["ALL_SCOPES"] },
                    { "name": "dsp/treble", "type": "COLOR", "value": "#22D3EE", "scopes": ["ALL_SCOPES"] }
                ]
            },
            {
                "name": "BeatWave PRO - Dimensions",
                "modes": ["Default"],
                "variables": [
                    { "name": "radius/sm", "type": "FLOAT", "value": 4, "scopes": ["CORNER_RADIUS"] },
                    { "name": "radius/md", "type": "FLOAT", "value": 8, "scopes": ["CORNER_RADIUS"] },
                    { "name": "radius/lg", "type": "FLOAT", "value": 12, "scopes": ["CORNER_RADIUS"] },
                    { "name": "radius/xl", "type": "FLOAT", "value": 16, "scopes": ["CORNER_RADIUS"] },
                    { "name": "spacing/sm", "type": "FLOAT", "value": 8, "scopes": ["GAP"] },
                    { "name": "spacing/md", "type": "FLOAT", "value": 16, "scopes": ["GAP"] },
                    { "name": "spacing/lg", "type": "FLOAT", "value": 24, "scopes": ["GAP"] }
                ]
            }
        ]
    }
    vars_path = os.path.join(OUT_DIR, "tokens", "figma_variables.json")
    with open(vars_path, "w", encoding="utf-8") as f:
        json.dump(figma_vars, f, indent=2)
    print("✓ figma_variables.json generado")

def load_inlined_assets():
    """Carga todo el CSS compilado y assets para incrustarlos inline en el HTML."""
    css_files = ['fonts.css', 'tailwind.min.css', 'styles.css', 'beatwave.css', 'beatwave-ds.css', 'studio.css']
    combined_css = "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@700;800;900&display=swap');\n\n"
    
    for f in css_files:
        p = os.path.join(OUT_DIR, "css", f)
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as fh:
                combined_css += f"\n/* ===== {f} ===== */\n" + fh.read() + "\n"
        else:
            p_web = os.path.join(ROOT_DIR, "web", "css", f)
            if os.path.exists(p_web):
                with open(p_web, "r", encoding="utf-8") as fh:
                    combined_css += f"\n/* ===== {f} ===== */\n" + fh.read() + "\n"

    # Logo base64
    import base64
    logo_b64 = ""
    logo_path = os.path.join(ROOT_DIR, "web", "assets", "beatwave_text.png")
    if os.path.exists(logo_path):
        with open(logo_path, "rb") as fh:
            logo_b64 = f"data:image/png;base64,{base64.b64encode(fh.read()).decode('utf-8')}"

    return combined_css, logo_b64

def dump_screen(tab_name, filename, title, combined_css, logo_b64):
    url = f"http://localhost:8000/?skipintro=1&tab={tab_name}"
    cmd = [
        CHROME_PATH,
        "--headless",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=6000",
        "--window-size=1512,982",
        "--dump-dom",
        url
    ]
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        html = res.stdout.decode("utf-8", "ignore")

        # Inyectar estilos CSS inline completos para que html.to.design los lea sin servidor
        style_block = f"""
    <!-- ESTILOS INLINE COMPLETOS PARA IMPORTACIÓN EN FIGMA SIN DEPENDENCIAS EXTERNAS -->
    <style>
        html, body {{
            background-color: #09090b !important;
            color: #d4d4d8 !important;
            width: 1512px;
            min-height: 982px;
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-font-smoothing: antialiased;
        }}
        {combined_css}
    </style>
        """

        # Reemplazar tags <link rel="stylesheet"> por el bloque de estilos inline
        html = re.sub(r'<link[^>]*rel=["\']stylesheet["\'][^>]*>', '', html)
        html = html.replace('</head>', f'{style_block}\n</head>')

        # Reemplazar el logo por versión base64 embebida
        if logo_b64:
            html = re.sub(r'src=["\'][^"\']*beatwave_text\.png["\']', f'src="{logo_b64}"', html)

        # Forzar estilos explícitos en body
        html = html.replace('<body ', '<body style="background-color: #09090b !important; color: #d4d4d8 !important; width: 1512px; height: 982px; margin: 0; overflow: hidden;" ')

        out_path = os.path.join(OUT_DIR, "screens", filename)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"✓ Pantalla exportada (Inline CSS): {filename} ({title})")
    except Exception as e:
        print(f"✗ Error exportando {filename}: {e}")

def dump_all_screens():
    combined_css, logo_b64 = load_inlined_assets()
    screens = [
        ("audit", "01_cabina_auditoria.html", "Cabina & Auditoría de Biblioteca"),
        ("setbuilder", "02_sets_energy_flow.html", "Set-Builder & Energy Flow Canvas"),
        ("map", "03_mapa_constelacion_3d.html", "Constelación Armónica 3D"),
        ("hotcues", "04_hotcues_beatgrid.html", "Estudio de Hot Cues & Grid"),
        ("taxonomy", "05_crates_taxonomia.html", "Crates & Taxonomía Electrónica"),
        ("spotify", "06_pool_ingesta_spotify.html", "Record Pool & Ingesta"),
        ("shazam", "07_radar_acustico.html", "Radar Acústico & ID"),
        ("copilot", "08_live_copilot.html", "Live Copilot en Cabina"),
        ("trends", "09_trends_intelligence.html", "Trends & Inteligencia Global"),
        ("knowledge", "10_conocimiento_masterclass.html", "Masterclass & Base de Conocimiento")
    ]
    for tab, fn, title in screens:
        dump_screen(tab, fn, title, combined_css, logo_b64)

    dump_responsive_screens(combined_css, logo_b64)

def dump_responsive_screens(combined_css, logo_b64):
    responsive_dir = os.path.join(OUT_DIR, "screens", "responsive")
    os.makedirs(responsive_dir, exist_ok=True)
    viewports = [
        ("mobile_393px.html", 393, 852, "Móvil (393px iPhone 14/15)"),
        ("tablet_768px.html", 768, 1024, "Tablet (768px iPad Mini)"),
        ("desktop_1512px.html", 1512, 982, "Desktop (1512px MacBook Pro)")
    ]
    for fn, w, h, desc in viewports:
        url = "http://localhost:8000/?skipintro=1&tab=audit"
        cmd = [
            CHROME_PATH,
            "--headless",
            "--disable-gpu",
            "--run-all-compositor-stages-before-draw",
            "--virtual-time-budget=6000",
            f"--window-size={w},{h}",
            "--dump-dom",
            url
        ]
        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            html = res.stdout.decode("utf-8", "ignore")
            html = re.sub(r'<link[^>]*rel=["\']stylesheet["\'][^>]*>', '', html)
            style_block = f"""
    <style>
        html, body {{
            background-color: #09090b !important;
            color: #d4d4d8 !important;
            width: {w}px;
            min-height: {h}px;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
            font-family: 'Inter', -apple-system, sans-serif;
        }}
        {combined_css}
    </style>
    """
            html = html.replace('</head>', f'{style_block}\n</head>')
            if logo_b64:
                html = re.sub(r'src=["\'][^"\']*beatwave_text\.png["\']', f'src="{logo_b64}"', html)
            html = html.replace('<body ', f'<body style="background-color: #09090b !important; color: #d4d4d8 !important; width: {w}px; min-height: {h}px; margin: 0;" ')
            out = os.path.join(responsive_dir, fn)
            with open(out, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"✓ Pantalla responsive exportada: {fn} ({desc})")
        except Exception as e:
            print(f"✗ Error exportando responsive {fn}: {e}")


def write_readme():
    content = """# BEATWAVE PRO — Figma Design Package
Este paquete contiene todas las pantallas, tokens y estilos de **BeatWave PRO** listos para ser importados en Figma preservando clases, estilos, CSS, auto-layout y jerarquía visual.

---

## 📁 Estructura del Paquete
```
Figma_Design/
├── README.md                      # Esta guía paso a paso
├── tokens/
│   ├── beatwave_tokens.json       # Tokens de diseño W3C / Tokens Studio (Colores, Tipografías, Espaciados)
│   └── figma_variables.json       # Variables nativas de Figma (Colecciones, Modos y Scopes)
├── css/                           # Hojas de estilo completas de la aplicación
│   ├── beatwave.css               # Reglas y componentes BeatWave PRO
│   ├── beatwave-ds.css            # Design System oficial (tokens y utilidades)
│   ├── tailwind.min.css           # Clases utilitarias de Tailwind compiladas
│   ├── fonts.css                  # Definiciones @font-face locales (Syne, JetBrains Mono, Inter)
│   └── styles.css                 # Estilos base
├── screens/                       # Pantallas HTML completas con clases y estilos preservados
│   ├── 00_galeria_todas_las_vistas.html   # TODAS las 10 pantallas juntas en un lienzo continuo
│   ├── 01_cabina_auditoria.html           # Cabina & Auditoría de Biblioteca (FFT, Waveform, Inspector)
│   ├── 02_sets_energy_flow.html           # Set-Builder & Energy Flow Canvas (Curva BPM, Asesor AI)
│   ├── 03_mapa_constelacion_3d.html       # Constelación Armónica 3D (Rueda Camelot y Nodos)
│   ├── 04_hotcues_beatgrid.html           # Estudio de 8 Hot Cues, Fraseo 16/32/64 y Beat Grid
│   ├── 05_crates_taxonomia.html           # Crates & Taxonomía de Géneros Electrónicos
│   ├── 06_pool_ingesta_spotify.html       # Record Pool, Ingesta y Conversor FLAC Lossless
│   ├── 07_radar_acustico.html             # Radar Acústico e Identificación en Vivo
│   ├── 08_live_copilot.html               # Live Copilot en Cabina, Decks y Semáforo de Mezcla
│   ├── 09_trends_intelligence.html        # Trends & Inteligencia Global de Géneros
│   └── 10_conocimiento_masterclass.html   # Masterclass & Base de Conocimiento DJ
└── assets/                        # Vectores SVG, logotipos oficiales e imágenes
```

---

## 🚀 Cómo importar en Figma manteniendo Clases, Estilos y CSS

### Método 1: Importar Pantallas con "html.to.design" (Recomendado — 100% Nativo en Figma)
El plugin **html.to.design** en Figma traduce automáticamente cada clase CSS a un layer nombrado, cada flexbox a un **Auto Layout** y cada color a un Fill editable.

1. Abre Figma y crea o abre un archivo.
2. Pulsa **`Shift + I`**, busca **html.to.design** y haz clic en **Run**.
3. En el plugin, selecciona la pestaña **"Import HTML file"** (o arrastra directamente cualquier archivo de la carpeta `Figma_Design/screens/`).
   * Para importar todo el producto de una vez: arrastra `00_galeria_todas_las_vistas.html`.
   * Para importar pantallas individuales aisladas: arrastra `01_cabina_auditoria.html`, `02_sets_energy_flow.html`, etc.
4. Haz clic en **Import**: Figma creará los Frames nativos correspondientes con:
   * **Nombres de capas**: nombradas exactamente según su clase CSS (`bw-topbar`, `bw-deckbar`, `ws-card`, etc.).
   * **Auto Layout**: con padding, gap y alineaciones equivalentes a las clases de Tailwind.
   * **Tipografías**: Syne (títulos), JetBrains Mono (métricas DJ y Camelot) e Inter (textos).

---

### Método 2: Importar Variables y Tokens con "Tokens Studio for Figma"
Si deseas que todos los colores, radios y espaciados queden registrados como **Figma Variables**:

1. En Figma, pulsa **`Shift + I`**, busca el plugin **Tokens Studio for Figma** y ábrelo.
2. Ve a **Settings / Tools ➔ Load from file**.
3. Selecciona el archivo: `Figma_Design/tokens/beatwave_tokens.json`.
4. El plugin cargará automáticamente:
   * **DJ Cyan** (escalas 200 a 950)
   * **DJ Zinc** (escalas 600 a 950)
   * **DSP Signals** (Sub-bass, Low-mid, Mid-high, Treble)
   * **Tipografías, Radios y Espaciados**
5. Pulsa **Apply to Document / Export to Figma Variables** para convertirlos en estilos y variables nativas del archivo.
"""
    with open(os.path.join(OUT_DIR, "README.md"), "w", encoding="utf-8") as f:
        f.write(content)
    print("✓ README.md generado")

def main():
    print("==================================================")
    print("Generando paquete Figma_Design para BeatWave PRO...")
    print("==================================================")
    setup_directories()
    copy_css_and_assets()
    generate_tokens()
    dump_all_screens()
    write_readme()
    print("==================================================")
    print("✓ ¡Paquete Figma_Design generado con éxito!")
    print("==================================================")

if __name__ == "__main__":
    main()
