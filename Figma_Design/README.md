# BEATWAVE PRO — Figma Design Package
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
