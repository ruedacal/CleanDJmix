#!/usr/bin/env python3
"""
Genera la biblioteca de componentes maestros para Figma en:
`Figma_Design/components/00_master_components_library.html`
Incluye los 32 componentes maestros del BeatWave Design System.
"""
import os, sys, base64

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_FILE = os.path.join(ROOT_DIR, "Figma_Design", "components", "00_master_components_library.html")

# Cargar CSS
sys.path.insert(0, os.path.join(ROOT_DIR, "scripts"))
from export_figma_design import load_inlined_assets
combined_css, logo_b64 = load_inlined_assets()

html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>BEATWAVE PRO — Master Component Library</title>
    <style>
        html, body {{
            background-color: #05070a !important;
            color: #d4d4d8 !important;
            margin: 0;
            padding: 40px;
            font-family: 'Inter', -apple-system, sans-serif;
            -webkit-font-smoothing: antialiased;
        }}
        .font-mono {{
            font-family: 'Nimbus Mono PS', 'JetBrains Mono', monospace !important;
        }}
        .component-canvas {{
            max-width: 1440px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 60px;
        }}
        .section-header {{
            border-bottom: 1px solid rgba(34, 211, 238, 0.3);
            padding-bottom: 12px;
            margin-bottom: 24px;
            display: flex;
            align-items: baseline;
            gap: 12px;
        }}
        .section-title {{
            font-family: 'Syne', sans-serif;
            font-size: 20px;
            font-weight: 800;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}
        .section-tag {{
            font-family: 'Nimbus Mono PS', monospace;
            font-size: 11px;
            color: #22d3ee;
            background: rgba(34, 211, 238, 0.1);
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid rgba(34, 211, 238, 0.2);
        }}
        .component-card {{
            background: #09090b;
            border: 1px solid #2a2a35;
            border-radius: 12px;
            padding: 24px;
            position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }}
        .component-label {{
            position: absolute;
            top: -12px;
            left: 20px;
            background: #121216;
            border: 1px solid #38bdf8;
            color: #38bdf8;
            font-family: 'Nimbus Mono PS', monospace;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 10px;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }}
        .grid-variants {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            align-items: start;
        }}
        {combined_css}
    </style>
</head>
<body>

<div class="component-canvas">

    <!-- HEADER DE LA BIBLIOTECA -->
    <div style="background: linear-gradient(135deg, #09090b 0%, #0d1525 100%); border: 1px solid rgba(34, 211, 238, 0.3); border-radius: 16px; padding: 32px; display: flex; justify-content: space-between; align-items: center;">
        <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #22d3ee; box-shadow: 0 0 12px #22d3ee;"></span>
                <span style="font-family: 'Nimbus Mono PS', monospace; font-size: 12px; color: #22d3ee; font-weight: bold; letter-spacing: 0.1em;">BEATWAVE PRO • DESIGN SYSTEM v1.0</span>
            </div>
            <h1 style="font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -0.02em;">
                MASTER COMPONENT LIBRARY
            </h1>
            <p style="font-family: 'Nimbus Mono PS', monospace; font-size: 13px; color: #9ca3af; margin: 8px 0 0 0;">
                32 Componentes Maestros con Auto Layout, Tokens de Color y Tipografía Nimbus Mono PS.
            </p>
        </div>
        <div style="text-align: right; font-family: 'Nimbus Mono PS', monospace; font-size: 11px; color: #6b7280;">
            <div>BREAKPOINTS: 393px / 768px / 1024px / 1512px</div>
            <div>STATUS: SINGLE SOURCE OF TRUTH (FIGMA ↔ REACT)</div>
        </div>
    </div>

    <!-- DOMINIO 1: SHELL Y NAVEGACIÓN -->
    <section>
        <div class="section-header">
            <span class="section-title">1. Shell y Navegación</span>
            <span class="section-tag">DOMINIO: SHELL</span>
        </div>

        <!-- 01: TopBar -->
        <div class="component-card" style="margin-bottom: 24px;">
            <div class="component-label">❖ 01. TopBar (Desktop & Mobile)</div>
            <div style="display: flex; flex-direction: column; gap: 20px; margin-top: 10px;">
                <!-- Desktop TopBar -->
                <div style="border: 1px dashed #2a2a35; border-radius: 8px; padding: 8px; background: #07070a;">
                    <div style="font-size: 10px; font-family: 'Nimbus Mono PS', monospace; color: #6b7280; margin-bottom: 6px;">VARIANTE: Desktop (1512px)</div>
                    <header class="bw-topbar flex h-14 w-full items-center gap-3 px-4 bg-[#09090b] border-b border-white/10 rounded-lg">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full border-2 border-cyan-400 bg-black flex items-center justify-center shadow-[0_0_12px_rgba(34,211,238,0.5)]">
                                <span style="color:#22d3ee; font-weight:900; font-size:12px;">BW</span>
                            </div>
                            <span style="font-family:'Syne',sans-serif; font-weight:800; color:#fff; font-size:15px; letter-spacing:0.05em;">BEATWAVE <span style="color:#22d3ee;">PRO</span></span>
                        </div>
                        <div class="flex items-center gap-2 pl-3 ml-2 border-l border-white/10">
                            <span class="text-xs text-zinc-500 font-mono">Cabina</span>
                            <span class="text-xs text-zinc-600">/</span>
                            <h1 class="text-xs font-semibold text-white font-mono uppercase">Auditar Biblioteca</h1>
                        </div>
                        <div class="ml-auto flex items-center gap-2">
                            <button class="bw-btn bw-btn-live"><span class="bw-live-dot"></span><span>LIVE COPILOT</span></button>
                            <button class="bw-user-chip">
                                <span class="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs">🎧</span>
                                <span class="text-xs text-white font-mono">DJ Alex</span>
                                <span class="bw-pro-tag font-mono">PRO</span>
                            </button>
                        </div>
                    </header>
                </div>

                <!-- Mobile TopBar -->
                <div style="border: 1px dashed #2a2a35; border-radius: 8px; padding: 8px; background: #07070a; max-width: 393px;">
                    <div style="font-size: 10px; font-family: 'Nimbus Mono PS', monospace; color: #6b7280; margin-bottom: 6px;">VARIANTE: Mobile (393px)</div>
                    <header class="flex h-12 w-full items-center justify-between px-3 bg-[#09090b] border-b border-white/10 rounded-lg">
                        <div class="flex items-center gap-2">
                            <span style="color:#22d3ee; font-weight:900; font-size:14px; font-family:'Syne',sans-serif;">BEATWAVE</span>
                            <span class="bw-pro-tag text-[9px] font-mono">PRO</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button class="bw-btn bw-btn-live text-[10px] py-1 px-2"><span class="bw-live-dot"></span><span>LIVE</span></button>
                            <span class="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px]">🎧</span>
                        </div>
                    </header>
                </div>
            </div>
        </div>

        <!-- 02 & 03: Navigation (Rail & BottomTabBar) + UserChip -->
        <div class="grid-variants">
            <!-- Navigation Rail -->
            <div class="component-card">
                <div class="component-label">❖ 02. NavigationRail (Desktop/Tablet)</div>
                <div style="display: flex; gap: 16px; margin-top: 10px;">
                    <!-- Colapsada 56px -->
                    <div class="flex flex-col w-14 bg-[#09090b] border border-white/10 rounded-xl p-2 gap-2 items-center">
                        <div class="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold text-xs">AUD</div>
                        <div class="w-10 h-10 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-400 font-mono text-xs">CUE</div>
                        <div class="w-10 h-10 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-400 font-mono text-xs">SET</div>
                        <div class="w-10 h-10 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-400 font-mono text-xs">MAP</div>
                    </div>
                    <!-- Expandida 180px -->
                    <div class="flex flex-col w-44 bg-[#09090b] border border-white/10 rounded-xl p-2 gap-1 font-mono text-xs">
                        <div class="flex items-center gap-2 p-2 rounded-lg bg-cyan-950/50 text-cyan-300 font-bold border border-cyan-500/30">
                            <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
                            <span>Auditar</span>
                        </div>
                        <div class="flex items-center gap-2 p-2 rounded-lg text-zinc-400 hover:text-white">
                            <span class="w-2 h-2 rounded-full bg-transparent"></span>
                            <span>Hot Cues</span>
                        </div>
                        <div class="flex items-center gap-2 p-2 rounded-lg text-zinc-400 hover:text-white">
                            <span class="w-2 h-2 rounded-full bg-transparent"></span>
                            <span>Set-Builder</span>
                        </div>
                        <div class="flex items-center gap-2 p-2 rounded-lg text-zinc-400 hover:text-white">
                            <span class="w-2 h-2 rounded-full bg-transparent"></span>
                            <span>Mapa 3D</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- BottomTabBar & UserChip -->
            <div class="component-card">
                <div class="component-label">❖ 03. BottomTabBar & UserChip</div>
                <div style="display: flex; flex-direction: column; gap: 20px; margin-top: 10px;">
                    <div>
                        <div style="font-size: 10px; font-family: 'Nimbus Mono PS', monospace; color: #6b7280; margin-bottom: 6px;">VARIANTE: Mobile BottomTabBar (393px)</div>
                        <nav class="flex justify-around items-center h-14 bg-[#09090b] border border-white/10 rounded-xl px-2 font-mono text-[10px]">
                            <button class="flex flex-col items-center gap-1 text-cyan-400 font-bold">
                                <span>📊</span><span>Auditar</span>
                            </button>
                            <button class="flex flex-col items-center gap-1 text-zinc-500">
                                <span>🎯</span><span>Cues</span>
                            </button>
                            <button class="flex flex-col items-center gap-1 text-zinc-500">
                                <span>🎚️</span><span>Sets</span>
                            </button>
                            <button class="flex flex-col items-center gap-1 text-zinc-500">
                                <span>⚡</span><span>Live</span>
                            </button>
                        </nav>
                    </div>

                    <div>
                        <div style="font-size: 10px; font-family: 'Nimbus Mono PS', monospace; color: #6b7280; margin-bottom: 6px;">❖ 04. UserChip</div>
                        <button class="bw-user-chip">
                            <span class="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 ring-1 ring-white/15">🎧</span>
                            <span class="text-xs text-white font-mono">DJ Alex BeatWave</span>
                            <span class="bw-pro-tag font-mono">PRO</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- DOMINIO 2: AUDIO, DECKS Y WAVEFORMS -->
    <section>
        <div class="section-header">
            <span class="section-title">2. Audio, Decks y Waveforms</span>
            <span class="section-tag">DOMINIO: DSP</span>
        </div>

        <!-- 05: DeckPlayer -->
        <div class="component-card" style="margin-bottom: 24px;">
            <div class="component-label">❖ 05. DeckPlayer (Transporte CUE/PLAY/SYNC)</div>
            <div class="flex items-center justify-between p-3.5 bg-[#09090b] border border-white/10 rounded-xl gap-4" style="margin-top: 10px;">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl">💿</div>
                    <div class="flex flex-col">
                        <span class="bw-eyebrow font-mono text-[10px] text-cyan-400">DECK 1 • MASTER</span>
                        <span class="text-sm font-bold text-white font-mono">Fisher - Losing It (Original Mix)</span>
                        <span class="text-xs text-zinc-400 font-mono">126.00 BPM • Key 8A (Am) • 04:08</span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button class="bw-deck-btn font-mono font-bold bg-amber-950 text-amber-300 border border-amber-600/70 px-4 py-2 rounded-lg">CUE</button>
                    <button class="bw-deck-play font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-600/70 px-5 py-2 rounded-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.3)]">▶ PLAY</button>
                    <button class="bw-deck-btn font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-600/70 px-3 py-2 rounded-lg">SYNC</button>
                </div>
                <div class="flex-1 max-w-md hidden lg:flex items-center bg-black/60 border border-zinc-800 rounded-lg p-2 h-10">
                    <div class="w-full h-4 bg-gradient-to-r from-blue-500 via-rose-500 to-cyan-400 rounded opacity-80"></div>
                </div>
            </div>
        </div>

        <!-- 06, 07 & 08: Waveform, HotCueGrid & RotaryKnob -->
        <div class="grid-variants">
            <!-- WaveformSpectrum -->
            <div class="component-card">
                <div class="component-label">❖ 06. WaveformSpectrum (4 Bandas)</div>
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                    <div style="height: 48px; background: #07070a; border: 1px solid #2a2a35; border-radius: 8px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                        <svg width="100%" height="40" preserveAspectRatio="none" viewBox="0 0 400 40">
                            <rect x="10" y="15" width="4" height="10" fill="#3b82f6"/>
                            <rect x="20" y="10" width="4" height="20" fill="#ef4444"/>
                            <rect x="30" y="5" width="4" height="30" fill="#f59e0b"/>
                            <rect x="40" y="2" width="4" height="36" fill="#22d3ee"/>
                            <rect x="50" y="8" width="4" height="24" fill="#3b82f6"/>
                            <rect x="60" y="12" width="4" height="16" fill="#22d3ee"/>
                            <line x1="80" y1="0" x2="80" y2="40" stroke="#ffffff" stroke-width="2"/>
                            <rect x="90" y="6" width="4" height="28" fill="#ef4444"/>
                            <rect x="100" y="14" width="4" height="12" fill="#3b82f6"/>
                            <rect x="110" y="3" width="4" height="34" fill="#22d3ee"/>
                        </svg>
                    </div>
                    <div class="flex justify-between font-mono text-[9px] text-zinc-500">
                        <span><b style="color:#3b82f6;">■</b> Bass</span>
                        <span><b style="color:#ef4444;">■</b> Low-Mid</span>
                        <span><b style="color:#f59e0b;">■</b> Mid-High</span>
                        <span><b style="color:#22d3ee;">■</b> Treble</span>
                    </div>
                </div>
            </div>

            <!-- HotCueGrid -->
            <div class="component-card">
                <div class="component-label">❖ 07. HotCueGrid (8 Pads)</div>
                <div style="margin-top: 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
                    <button class="p-2 rounded-lg bg-rose-950 border border-rose-500/70 text-rose-300 font-mono text-[10px] font-bold flex flex-col items-center">
                        <span>1</span><span class="text-[8px] opacity-70">DROP</span>
                    </button>
                    <button class="p-2 rounded-lg bg-amber-950 border border-amber-500/70 text-amber-300 font-mono text-[10px] font-bold flex flex-col items-center">
                        <span>2</span><span class="text-[8px] opacity-70">VOCAL</span>
                    </button>
                    <button class="p-2 rounded-lg bg-emerald-950 border border-emerald-500/70 text-emerald-300 font-mono text-[10px] font-bold flex flex-col items-center">
                        <span>3</span><span class="text-[8px] opacity-70">BEAT</span>
                    </button>
                    <button class="p-2 rounded-lg bg-cyan-950 border border-cyan-500/70 text-cyan-300 font-mono text-[10px] font-bold flex flex-col items-center">
                        <span>4</span><span class="text-[8px] opacity-70">OUTRO</span>
                    </button>
                    <button class="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono text-[10px] font-bold flex flex-col items-center">5</button>
                    <button class="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono text-[10px] font-bold flex flex-col items-center">6</button>
                    <button class="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono text-[10px] font-bold flex flex-col items-center">7</button>
                    <button class="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono text-[10px] font-bold flex flex-col items-center">8</button>
                </div>
            </div>

            <!-- RotaryKnob -->
            <div class="component-card">
                <div class="component-label">❖ 08. RotaryKnob</div>
                <div style="margin-top: 10px; display: flex; align-items: center; justify-content: space-around;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                        <div class="w-11 h-11 rounded-full border-2 border-cyan-400 bg-zinc-900 flex items-center justify-center relative shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                            <div style="position: absolute; top: 3px; width: 2px; height: 10px; background: #22d3ee; border-radius: 2px;"></div>
                        </div>
                        <span class="font-mono text-[10px] text-zinc-400">GAIN</span>
                        <span class="font-mono text-[9px] text-cyan-400 font-bold">+1.2 dB</span>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                        <div class="w-11 h-11 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center relative">
                            <div style="position: absolute; top: 3px; width: 2px; height: 10px; background: #9ca3af; border-radius: 2px;"></div>
                        </div>
                        <span class="font-mono text-[10px] text-zinc-400">FILTER</span>
                        <span class="font-mono text-[9px] text-zinc-500 font-bold">FLAT</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- DOMINIO 3: DATOS, TABLAS Y PISTAS -->
    <section>
        <div class="section-header">
            <span class="section-title">3. Datos, Tablas y Pistas</span>
            <span class="section-tag">DOMINIO: DATA</span>
        </div>

        <!-- 09 & 10: TrackTable vs TrackCard -->
        <div class="grid-variants" style="grid-template-columns: 1.5fr 1fr;">
            <!-- TrackTable (Desktop/Tablet) -->
            <div class="component-card">
                <div class="component-label">❖ 09. TrackTable & TrackRow (Desktop/Tablet)</div>
                <div style="margin-top: 10px; overflow-x: auto;">
                    <table class="w-full text-left font-mono text-xs border-collapse">
                        <thead>
                            <tr class="bg-zinc-900 border-b border-zinc-800 text-[10px] uppercase text-zinc-400">
                                <th class="p-2">#</th>
                                <th class="p-2">Wave</th>
                                <th class="p-2">Título / Artista</th>
                                <th class="p-2 text-center">BPM</th>
                                <th class="p-2 text-center">Key</th>
                                <th class="p-2 text-center">Calidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="border-b border-zinc-800/60 bg-zinc-950/40 hover:bg-zinc-900/60">
                                <td class="p-2 text-zinc-500">01</td>
                                <td class="p-2"><span class="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 text-[9px]">WAVE</span></td>
                                <td class="p-2 font-bold text-white">Fisher - Losing It</td>
                                <td class="p-2 text-center text-cyan-400 font-bold">126</td>
                                <td class="p-2 text-center"><span class="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-bold text-[10px]">8A</span></td>
                                <td class="p-2 text-center"><span class="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[9px]">Lossless</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- TrackCard (Mobile) -->
            <div class="component-card">
                <div class="component-label">❖ 10. TrackCard (Mobile)</div>
                <div style="margin-top: 10px;">
                    <div class="p-3 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 to-zinc-900 flex items-center justify-between gap-3 shadow-md">
                        <div class="flex items-center gap-2.5">
                            <div class="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-white">▶</div>
                            <div class="flex flex-col">
                                <span class="text-xs font-bold text-white font-mono">Losing It</span>
                                <span class="text-[10px] text-zinc-400 font-mono">Fisher • Tech House</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-end font-mono">
                            <span class="text-xs text-cyan-300 font-bold">126 BPM</span>
                            <span class="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 font-bold">8A</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 11 & 12: FilterToolbar & Dropzone -->
        <div class="grid-variants" style="margin-top: 20px;">
            <!-- FilterToolbar -->
            <div class="component-card">
                <div class="component-label">❖ 11. FilterToolbar</div>
                <div class="ws-toolbar flex flex-wrap gap-2 items-center p-2 bg-[#09090b] border border-zinc-800 rounded-xl" style="margin-top: 10px;">
                    <button class="bw-btn bw-btn-primary text-xs py-1.5 px-3">📂 Cargar Biblioteca</button>
                    <button class="bw-btn bw-btn-ghost text-xs py-1.5 px-3">⚡ Analizar (16)</button>
                    <button class="bw-btn bw-btn-ghost text-xs py-1.5 px-3">⚙️ Configurar</button>
                    <button class="bw-btn bw-btn-export text-xs py-1.5 px-3 ml-auto">📤 Exportar</button>
                </div>
            </div>

            <!-- Dropzone -->
            <div class="component-card">
                <div class="component-label">❖ 12. Dropzone (Ingesta)</div>
                <div style="margin-top: 10px; border: 2px dashed #2a2a35; border-radius: 12px; padding: 20px; text-align: center; background: #07070a;">
                    <span style="font-size: 24px;">📁</span>
                    <div style="font-family: 'Nimbus Mono PS', monospace; font-size: 11px; color: #fff; font-weight: bold; margin-top: 4px;">ARRASTRA ARCHIVOS O CARPETAS DE AUDIO</div>
                    <div style="font-family: 'Nimbus Mono PS', monospace; font-size: 9px; color: #6b7280;">FLAC, MP3, WAV, AIFF, M4A</div>
                </div>
            </div>
        </div>
    </section>

    <!-- DOMINIO 4: INTELIGENCIA ACÚSTICA Y KPIs -->
    <section>
        <div class="section-header">
            <span class="section-title">4. Inteligencia Acústica y KPIs</span>
            <span class="section-tag">DOMINIO: INTEL</span>
        </div>

        <!-- 13: MetricCard (HUD Variants) -->
        <div class="component-card" style="margin-bottom: 24px;">
            <div class="component-label">❖ 13. MetricCard (HUD KPI)</div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3" style="margin-top: 10px;">
                <!-- Variante 1: Salud Global (Cyan Active) -->
                <div class="p-3 rounded-xl border border-cyan-500/50 bg-cyan-950/30 flex flex-col justify-between shadow-[0_0_12px_rgba(34,211,238,0.15)]">
                    <div class="flex justify-between font-mono text-[10px] uppercase text-zinc-400">
                        <span>SALUD GLOBAL</span><span class="text-cyan-400 font-bold">100%</span>
                    </div>
                    <div class="flex items-baseline justify-between mt-2">
                        <span class="text-xl font-mono font-black text-white">16</span>
                        <span class="text-[10px] font-mono text-zinc-500">pistas</span>
                    </div>
                </div>

                <!-- Variante 2: Alerta Ámbar -->
                <div class="p-3 rounded-xl border border-amber-500/50 bg-amber-950/20 flex flex-col justify-between">
                    <div class="flex justify-between font-mono text-[10px] uppercase text-zinc-400">
                        <span>FALTA BPM/KEY</span><span class="text-amber-400 font-bold">WARN</span>
                    </div>
                    <div class="flex items-baseline justify-between mt-2">
                        <span class="text-xl font-mono font-black text-amber-300">0</span>
                        <span class="text-[10px] font-mono text-zinc-500">sin pitch</span>
                    </div>
                </div>

                <!-- Variante 3: Éxito Verde Lossless -->
                <div class="p-3 rounded-xl border border-emerald-500/50 bg-emerald-950/20 flex flex-col justify-between">
                    <div class="flex justify-between font-mono text-[10px] uppercase text-zinc-400">
                        <span>LOSSLESS PURO</span><span class="text-emerald-400 font-bold">OK</span>
                    </div>
                    <div class="flex items-baseline justify-between mt-2">
                        <span class="text-xl font-mono font-black text-emerald-400">16</span>
                        <span class="text-[10px] font-mono text-zinc-500">certificados</span>
                    </div>
                </div>

                <!-- Variante 4: Peligro Rojo Fake / Clip -->
                <div class="p-3 rounded-xl border border-rose-500/50 bg-rose-950/20 flex flex-col justify-between">
                    <div class="flex justify-between font-mono text-[10px] uppercase text-zinc-400">
                        <span>FAKE DETECTADO</span><span class="text-rose-400 font-bold">FAIL</span>
                    </div>
                    <div class="flex items-baseline justify-between mt-2">
                        <span class="text-xl font-mono font-black text-rose-400">0</span>
                        <span class="text-[10px] font-mono text-zinc-500">transcodes</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 14: InspectorPanel & AntiMuddyBadge -->
        <div class="grid-variants">
            <!-- InspectorPanel -->
            <div class="component-card">
                <div class="component-label">❖ 14. InspectorPanel (Sidebar / Drawer)</div>
                <div style="margin-top: 10px; background: #07070a; border: 1px solid #2a2a35; border-radius: 12px; padding: 16px; font-mono;">
                    <div class="flex items-center gap-3 pb-3 border-b border-zinc-800">
                        <div class="w-12 h-12 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold">ART</div>
                        <div class="flex flex-col">
                            <span class="text-xs text-white font-bold">Losing It</span>
                            <span class="text-[10px] text-zinc-400">Fisher • Catch & Release</span>
                        </div>
                    </div>
                    <div class="py-2.5 border-b border-zinc-800 flex justify-between text-xs">
                        <span class="text-zinc-500">Corte FFT:</span>
                        <span class="text-emerald-400 font-bold">22.05 kHz (Puro FLAC)</span>
                    </div>
                    <div class="py-2.5 flex justify-between text-xs">
                        <span class="text-zinc-500">Sonoridad:</span>
                        <span class="text-cyan-400 font-bold">-7.2 LUFS • -0.1 dB Peak</span>
                    </div>
                </div>
            </div>

            <!-- AntiMuddyBadge -->
            <div class="component-card">
                <div class="component-label">❖ 15. AntiMuddyBadge (Rol Acústico)</div>
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                    <div class="flex items-center gap-2 p-2 rounded-lg bg-rose-950/60 border border-rose-600/70 text-rose-300 font-mono text-xs">
                        <span>🔴</span><span class="font-bold">Bass Driver</span><span class="text-[10px] opacity-70 ml-auto">Graves 52%</span>
                    </div>
                    <div class="flex items-center gap-2 p-2 rounded-lg bg-amber-950/60 border border-amber-600/70 text-amber-300 font-mono text-xs">
                        <span>🟡</span><span class="font-bold">Vocal / Lead</span><span class="text-[10px] opacity-70 ml-auto">Medios 48%</span>
                    </div>
                    <div class="flex items-center gap-2 p-2 rounded-lg bg-emerald-950/60 border border-emerald-600/70 text-emerald-300 font-mono text-xs">
                        <span>🟢</span><span class="font-bold">Percussive Tool</span><span class="text-[10px] opacity-70 ml-auto">Transitorios</span>
                    </div>
                    <div class="flex items-center gap-2 p-2 rounded-lg bg-cyan-950/60 border border-cyan-600/70 text-cyan-300 font-mono text-xs">
                        <span>🔵</span><span class="font-bold">Balanced Mix</span><span class="text-[10px] opacity-70 ml-auto">Full Spectrum</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- DOMINIO 5: PRIMITIVAS Y ELEMENTOS BASE -->
    <section>
        <div class="section-header">
            <span class="section-title">5. Primitivas y UI Base</span>
            <span class="section-tag">DOMINIO: ATOMS</span>
        </div>

        <div class="grid-variants" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
            <!-- 16: ActionButton -->
            <div class="component-card">
                <div class="component-label">❖ 16. ActionButton</div>
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                    <button class="bw-btn bw-btn-primary w-full justify-center">Primary Cyan</button>
                    <button class="bw-btn bw-btn-ghost w-full justify-center">Ghost Neutral</button>
                    <button class="bw-btn bw-btn-live w-full justify-center"><span class="bw-live-dot"></span>Live Pulso</button>
                    <button class="bw-btn bw-btn-danger w-full justify-center">Danger Action</button>
                </div>
            </div>

            <!-- 17: SearchInput -->
            <div class="component-card">
                <div class="component-label">❖ 17. SearchInput</div>
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
                    <div class="relative flex items-center">
                        <span style="position: absolute; left: 10px; color: #6b7280; font-size: 12px;">🔍</span>
                        <input type="text" value="Tech House 126 8A" class="w-full bg-[#09090b] border border-cyan-500/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white font-mono outline-none shadow-inner" />
                    </div>
                    <div class="flex gap-1.5 flex-wrap">
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50">Tech House</span>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50">126 BPM</span>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50">8A (Am)</span>
                    </div>
                </div>
            </div>

            <!-- 18: StatusBadge & InfoTooltip -->
            <div class="component-card">
                <div class="component-label">❖ 18. StatusBadge & Tooltip</div>
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                    <div class="flex gap-2 flex-wrap">
                        <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-700/60">Lossless 24-bit</span>
                        <span class="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-700/60">320 kbps</span>
                        <span class="px-2 py-0.5 rounded bg-rose-950 text-rose-400 font-mono text-[10px] font-bold border border-rose-700/60">Fake FLAC</span>
                    </div>
                    <div style="background: #101014; border: 1px solid #38bdf8; border-radius: 8px; padding: 8px; font-mono; font-size: 10px; color: #d4d4d8;">
                        <span style="color: #38bdf8; font-weight: bold;">ℹ️ Certificación FFT:</span> Mide el corte espectral real a 20 kHz para evitar archivos de audio inflados.
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- DOMINIO 6: SETS & FLUJO DE ENERGÍA (SET-BUILDER & DAG) -->
    <section>
        <div class="section-header">
            <span class="section-title">6. Sets, Flujo de Energía & DAG</span>
            <span class="section-tag">DOMINIO: SETS</span>
        </div>

        <div class="grid-variants" style="grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));">
            <!-- 19: BpmEnergyCurve -->
            <div class="component-card">
                <div class="component-label">❖ 19. BpmEnergyCurve (Lienzo Progresión BPM)</div>
                <div style="margin-top: 10px; background: #09090d; border: 1px solid #202028; border-radius: 12px; padding: 14px;">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                            <span class="text-xs font-mono font-bold text-cyan-300 uppercase">Curva Progresión BPM (124 → 128)</span>
                        </div>
                        <span class="text-[10px] font-mono font-bold text-emerald-400">Score Armónico: 94%</span>
                    </div>
                    <svg viewBox="0 0 400 80" class="w-full h-20 overflow-visible select-none">
                        <defs>
                            <linearGradient id="mcBpmGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#06b6d4" />
                                <stop offset="50%" stop-color="#a855f7" />
                                <stop offset="100%" stop-color="#ec4899" />
                            </linearGradient>
                            <linearGradient id="mcAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.3" />
                                <stop offset="100%" stop-color="#06b6d4" stop-opacity="0" />
                            </linearGradient>
                        </defs>
                        <polyline points="20,60 100,50 180,55 260,35 340,25 380,20" fill="none" stroke="url(#mcBpmGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                        <polygon points="20,75 20,60 100,50 180,55 260,35 340,25 380,20 380,75" fill="url(#mcAreaGrad)" />
                        <circle cx="100" cy="50" r="4" fill="#06b6d4" stroke="#fff" stroke-width="1.5" />
                        <circle cx="260" cy="35" r="4" fill="#a855f7" stroke="#fff" stroke-width="1.5" />
                        <circle cx="380" cy="20" r="4" fill="#ec4899" stroke="#fff" stroke-width="1.5" />
                    </svg>
                    <div class="flex justify-between text-[9px] font-mono text-zinc-500 mt-1">
                        <span>#1 Intro (124)</span>
                        <span>#3 Build (126)</span>
                        <span>#5 Peak Drop (128)</span>
                    </div>
                </div>
            </div>

            <!-- 20: GraphPlaylistStep -->
            <div class="component-card">
                <div class="component-label">❖ 20. GraphPlaylistStep (Nodo DAG con Alternativas)</div>
                <div style="margin-top: 10px; background: #0c0c14; border: 1px solid #581c87; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-mono font-bold text-purple-300 uppercase">PASO #03 · RUTA PRINCIPAL</span>
                        <span class="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">DJOID DAG</span>
                    </div>
                    <div class="flex items-center gap-3 bg-[#12121c] p-2.5 rounded-lg border border-purple-900/60">
                        <div class="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">▶</div>
                        <div class="min-w-0 flex-1">
                            <div class="text-xs font-mono font-bold text-white truncate">Losing It (Original Mix)</div>
                            <div class="text-[10px] text-zinc-400 font-sans">Fisher · 126 BPM · 8A (Am)</div>
                        </div>
                        <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold">+1 Camelot</span>
                    </div>
                    <div class="flex flex-col gap-1.5 pl-3 border-l-2 border-dashed border-purple-800/80 mt-1">
                        <span class="text-[9px] font-mono text-zinc-400 uppercase">Bifurcaciones compatibles en vivo:</span>
                        <div class="flex items-center justify-between text-[10px] font-mono bg-zinc-950/80 px-2 py-1 rounded border border-zinc-800 text-zinc-300">
                            <span>↳ Consciousness (Anyma) · 126 · 9A</span>
                            <span class="text-purple-400 font-bold">98% match</span>
                        </div>
                        <div class="flex items-center justify-between text-[10px] font-mono bg-zinc-950/80 px-2 py-1 rounded border border-zinc-800 text-zinc-300">
                            <span>↳ Rumble (Skrillex) · 127 · 8A</span>
                            <span class="text-purple-400 font-bold">95% match</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 21: TransitionAlertCard -->
            <div class="component-card">
                <div class="component-label">❖ 21. TransitionAlertCard (Diagnóstico Choque & Puente)</div>
                <div style="margin-top: 10px; background: #13090c; border: 1px solid #881337; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                    <div class="flex items-center gap-2 text-rose-400 font-bold text-xs font-mono">
                        <span>⚠️ ALERTA DE TRANSICIÓN: CHOQUE ARMÓNICO</span>
                    </div>
                    <p class="text-[11px] text-zinc-300 font-sans leading-relaxed">
                        Salto disonante de 6 pasos Camelot entre <strong class="text-white font-mono">#02 (8A)</strong> y <strong class="text-white font-mono">#03 (2B)</strong>. Riesgo de enmascaramiento tímbrico en medios-altos.
                    </p>
                    <div class="bg-zinc-950/90 border border-rose-900/60 rounded-lg p-2.5 flex items-center justify-between gap-2">
                        <div>
                            <span class="text-[9px] font-mono text-rose-300 uppercase block">Pista Puente Sugerida:</span>
                            <span class="text-xs font-mono font-bold text-white">Artbat - Horizon (126 BPM · 1A)</span>
                        </div>
                        <button class="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-black cursor-pointer shrink-0">Insertar Puente</button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- DOMINIO 7: CONSTELACIÓN ARMÓNICA & TAXONOMÍA (MAP 3D & CRATES) -->
    <section>
        <div class="section-header">
            <span class="section-title">7. Armonía Camelot & Crates</span>
            <span class="section-tag">DOMINIO: TAXONOMY</span>
        </div>

        <div class="grid-variants" style="grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));">
            <!-- 22: HarmonicWheelNode -->
            <div class="component-card">
                <div class="component-label">❖ 22. HarmonicWheelNode (Camelot Wheel Node)</div>
                <div style="margin-top: 10px; display: flex; gap: 10px; align-items: center; justify-content: center; background: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 16px;">
                    <div class="w-16 h-16 rounded-full bg-cyan-950 border-2 border-cyan-400 flex flex-col items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)] select-none">
                        <span class="text-sm font-black font-mono">8A</span>
                        <span class="text-[9px] font-mono text-cyan-400">A minor</span>
                    </div>
                    <div class="flex flex-col gap-1 text-[11px] font-mono text-zinc-400">
                        <div class="flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span>Vecino Seguro: <strong class="text-white">7A / 9A / 8B</strong></span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-purple-400"></span>
                            <span>Modulación +2: <strong class="text-white">10A (+Energy)</strong></span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span>Choque Disonante: <strong class="text-rose-400">2A / 2B</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 23: CrateTreeNode -->
            <div class="component-card">
                <div class="component-label">❖ 23. CrateTreeNode (Jerarquía Serato / Rekordbox)</div>
                <div style="margin-top: 10px; background: #0e0e13; border: 1px solid #202028; border-radius: 12px; padding: 12px; font-mono; display: flex; flex-direction: column; gap: 6px;">
                    <div class="flex items-center justify-between p-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-bold text-white">
                        <span class="flex items-center gap-2">📁 Main Crates Festival 2026</span>
                        <span class="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">48</span>
                    </div>
                    <div class="flex items-center justify-between p-1.5 rounded hover:bg-zinc-900/60 text-xs text-zinc-300 pl-5 border-l-2 border-cyan-400">
                        <span class="flex items-center gap-1.5">📂 Peak Time Bangers</span>
                        <span class="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">18</span>
                    </div>
                    <div class="flex items-center justify-between p-1.5 rounded hover:bg-zinc-900/60 text-xs text-zinc-300 pl-5 border-l-2 border-purple-500">
                        <span class="flex items-center gap-1.5">📂 Melodic & Deep</span>
                        <span class="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">14</span>
                    </div>
                    <div class="flex items-center justify-between p-1.5 rounded hover:bg-zinc-900/60 text-xs text-zinc-300 pl-5 border-l-2 border-amber-500">
                        <span class="flex items-center gap-1.5">📂 Warmup Groove</span>
                        <span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">16</span>
                    </div>
                </div>
            </div>

            <!-- 24: TaxonomyGenreBadge -->
            <div class="component-card">
                <div class="component-label">❖ 24. TaxonomyGenreBadge (Metadatos Taxonómicos)</div>
                <div style="margin-top: 10px; background: #09090b; border: 1px solid #202028; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="px-2.5 py-1 rounded-lg bg-purple-950 text-purple-300 border border-purple-700 font-mono text-xs font-bold">Tech House</span>
                        <span class="text-zinc-600">➔</span>
                        <span class="px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-200 border border-zinc-750 font-mono text-xs">Minimal Tech</span>
                        <span class="text-zinc-600">➔</span>
                        <span class="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-xs font-bold">125–128 BPM</span>
                    </div>
                    <div class="flex items-center gap-2 mt-1 text-[10px] font-mono text-zinc-400">
                        <span class="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">Sub-Bass Driver</span>
                        <span class="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">Tight Kick 50Hz</span>
                        <span class="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">Percussive Roll</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- DOMINIO 8: RECORD POOL & INGESTA (SPOTIFY / FLAC LOSSLESS) -->
    <section>
        <div class="section-header">
            <span class="section-title">8. Pool, Ingesta & FLAC</span>
            <span class="section-tag">DOMINIO: INGEST</span>
        </div>

        <div class="grid-variants" style="grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));">
            <!-- 25: IngestSourceCard -->
            <div class="component-card">
                <div class="component-label">❖ 25. IngestSourceCard (Pista Ingesta Spotify/Pool)</div>
                <div style="margin-top: 10px; background: #0d0d12; border: 1px solid #202028; border-radius: 12px; padding: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-600/60 flex items-center justify-center text-emerald-400 text-base font-bold shrink-0">♫</div>
                        <div class="min-w-0">
                            <div class="text-xs font-mono font-bold text-white truncate">Astral Projection</div>
                            <div class="text-[10px] text-zinc-400 font-sans truncate">Artbat & CamelPhat · UPPERGROUND</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-700/60">FLAC 24-bit</span>
                        <button class="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-mono font-bold text-[10px] cursor-pointer">Ingestar</button>
                    </div>
                </div>
            </div>

            <!-- 26: DownloadProgressBar -->
            <div class="component-card">
                <div class="component-label">❖ 26. DownloadProgressBar (Transcodificación DSP)</div>
                <div style="margin-top: 10px; background: #09090d; border: 1px solid #202028; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 8px;">
                    <div class="flex justify-between items-center text-xs font-mono">
                        <span class="text-cyan-300 font-bold">Transcodificando Lossless & Hot Cues...</span>
                        <span class="text-white font-bold">74%</span>
                    </div>
                    <div class="w-full h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden relative">
                        <div class="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" style="width: 74%;"></div>
                    </div>
                    <div class="flex justify-between text-[10px] font-mono text-zinc-500">
                        <span>18.4 MB / 24.8 MB · 4.2 MB/s</span>
                        <span>ETA: 2s · Motor FFmpeg Lossless</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- DOMINIO 9: LIVE COPILOT & RADAR ACÚSTICO -->
    <section>
        <div class="section-header">
            <span class="section-title">9. Live Copilot & Radar</span>
            <span class="section-tag">DOMINIO: COPILOT</span>
        </div>

        <div class="grid-variants" style="grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));">
            <!-- 27: MixTrafficLight -->
            <div class="component-card">
                <div class="component-label">❖ 27. MixTrafficLight (Semáforo de Mezcla en Cabina)</div>
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                    <div class="flex items-center justify-between p-2.5 rounded-xl bg-[#091a14] border border-emerald-600 text-emerald-300 font-mono text-xs">
                        <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                            <span class="font-bold">🟢 SAFE MIX</span>
                        </div>
                        <span class="text-[10px] text-emerald-400">Sync 100% · Camelot 8A ➔ 8A · No Bass Clash</span>
                    </div>
                    <div class="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1809] border border-amber-600 text-amber-300 font-mono text-xs">
                        <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]"></span>
                            <span class="font-bold">🟡 CAUTION</span>
                        </div>
                        <span class="text-[10px] text-amber-400">Diagonal 8A ➔ 9B · Cortar Bajos Deck A</span>
                    </div>
                    <div class="flex items-center justify-between p-2.5 rounded-xl bg-[#20090f] border border-rose-600 text-rose-300 font-mono text-xs">
                        <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]"></span>
                            <span class="font-bold">🔴 BASS CLASH</span>
                        </div>
                        <span class="text-[10px] text-rose-400">Disonancia 8A ➔ 2B · Enmascaramiento 60Hz</span>
                    </div>
                </div>
            </div>

            <!-- 28: DualDeckComparisonCard -->
            <div class="component-card">
                <div class="component-label">❖ 28. DualDeckComparisonCard (Deck A vs Deck B)</div>
                <div style="margin-top: 10px; background: #09090e; border: 1px solid #202028; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                    <div class="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div class="bg-zinc-950 p-2 rounded-lg border border-cyan-800/60">
                            <span class="text-[9px] text-cyan-400 font-bold block">DECK 1 (MASTER)</span>
                            <span class="text-white font-bold block truncate">Losing It</span>
                            <span class="text-[10px] text-zinc-400">126.0 BPM · 8A · -8.4 LUFS</span>
                        </div>
                        <div class="bg-zinc-950 p-2 rounded-lg border border-purple-800/60">
                            <span class="text-[9px] text-purple-400 font-bold block">DECK 2 (CUED)</span>
                            <span class="text-white font-bold block truncate">Consciousness</span>
                            <span class="text-[10px] text-zinc-400">126.2 BPM · 9A · -8.1 LUFS</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between text-[10px] font-mono bg-zinc-900/80 px-2.5 py-1.5 rounded-lg border border-zinc-800 text-zinc-300">
                        <span>Delta: <strong class="text-cyan-300">+0.2 BPM</strong> · Camelot: <strong class="text-purple-300">+1 Paso</strong></span>
                        <span class="text-emerald-400 font-bold">Fase Alineada ✓</span>
                    </div>
                </div>
            </div>

            <!-- 29: AcousticRadarVisualizer -->
            <div class="component-card">
                <div class="component-label">❖ 29. AcousticRadarVisualizer (Huella Acústica)</div>
                <div style="margin-top: 10px; background: #0a0a0f; border: 1px solid #202028; border-radius: 12px; padding: 14px; display: flex; align-items: center; justify-content: space-around;">
                    <div class="flex flex-col items-center gap-1 font-mono text-[10px]">
                        <span class="text-blue-400 font-bold">SUB-BASS</span>
                        <div class="w-12 h-12 rounded-full border-2 border-blue-500 bg-blue-950/40 flex items-center justify-center text-white font-bold">42%</div>
                        <span class="text-zinc-500">&lt; 150 Hz</span>
                    </div>
                    <div class="flex flex-col items-center gap-1 font-mono text-[10px]">
                        <span class="text-rose-400 font-bold">LOW-MID</span>
                        <div class="w-12 h-12 rounded-full border-2 border-rose-500 bg-rose-950/40 flex items-center justify-center text-white font-bold">26%</div>
                        <span class="text-zinc-500">150-800 Hz</span>
                    </div>
                    <div class="flex flex-col items-center gap-1 font-mono text-[10px]">
                        <span class="text-amber-400 font-bold">MID-HIGH</span>
                        <div class="w-12 h-12 rounded-full border-2 border-amber-500 bg-amber-950/40 flex items-center justify-center text-white font-bold">20%</div>
                        <span class="text-zinc-500">800-4k Hz</span>
                    </div>
                    <div class="flex flex-col items-center gap-1 font-mono text-[10px]">
                        <span class="text-cyan-400 font-bold">TREBLE</span>
                        <div class="w-12 h-12 rounded-full border-2 border-cyan-400 bg-cyan-950/40 flex items-center justify-center text-white font-bold">12%</div>
                        <span class="text-zinc-500">&gt; 4k Hz</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- DOMINIO 10: TRENDS, MASTERCLASS & DIÁLOGOS MODALES -->
    <section>
        <div class="section-header">
            <span class="section-title">10. Trends, Masterclass & Modales</span>
            <span class="section-tag">DOMINIO: INTEL</span>
        </div>

        <div class="grid-variants" style="grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));">
            <!-- 30: TrendMetricCard -->
            <div class="component-card">
                <div class="component-label">❖ 30. TrendMetricCard (Velocidad & Tendencia de Género)</div>
                <div style="margin-top: 10px; background: #0c0a14; border: 1px solid #4c1d95; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-mono font-bold text-white uppercase">Peak Time Techno</span>
                        <span class="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700 font-bold">+24.6% Semanal</span>
                    </div>
                    <p class="text-[11px] text-zinc-400 font-sans">Artistas en ascenso: Amelie Lens, Charlotte de Witte, Eli Brown</p>
                    <div class="flex items-center justify-between text-[10px] font-mono bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-zinc-300">
                        <span>Índice de Energía: <strong class="text-purple-300">92/100</strong></span>
                        <span class="text-cyan-400">Top 1 en Clubes EU</span>
                    </div>
                </div>
            </div>

            <!-- 31: MasterclassTipCard -->
            <div class="component-card">
                <div class="component-label">❖ 31. MasterclassTipCard (Técnica & Fraseo DJ)</div>
                <div style="margin-top: 10px; background: #081014; border: 1px solid #0e7490; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-mono font-bold text-cyan-300 uppercase">Transición EQ Split en Frase 32</span>
                        <span class="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">Nivel PRO</span>
                    </div>
                    <p class="text-[11px] text-zinc-300 font-sans leading-relaxed">
                        Corta el Bass de Deck A en el compás 31.4 y activa el Sub de Deck B exactamente en el impacto 32.1 para una entrega limpia sin choque de frecuencias.
                    </p>
                    <div class="flex items-center justify-between text-[10px] font-mono text-zinc-400 border-t border-zinc-800 pt-1.5">
                        <span>Atajo rápido: <kbd class="bg-zinc-900 px-1.5 py-0.5 rounded text-white border border-zinc-700">Space</kbd> Play / <kbd class="bg-zinc-900 px-1.5 py-0.5 rounded text-white border border-zinc-700">Shift + 1</kbd> Cue 1</span>
                    </div>
                </div>
            </div>

            <!-- 32: ConfirmModalDialog -->
            <div class="component-card">
                <div class="component-label">❖ 32. ConfirmModalDialog (Modal Exportación Serato)</div>
                <div style="margin-top: 10px; background: #121218; border: 1px solid #3f3f46; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                    <div class="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span class="text-xs font-mono font-bold text-white">Exportar Metadatos a Serato / Rekordbox</span>
                        <span class="text-zinc-500 text-xs cursor-pointer">✕</span>
                    </div>
                    <p class="text-[11px] text-zinc-300 font-sans leading-relaxed">
                        Se actualizarán los tags <strong class="text-cyan-400 font-mono">ID3v2.4</strong> de 16 pistas con Tonalidad Camelot, Hot Cues y Beat Grids calculados. ¿Deseas proceder?
                    </p>
                    <div class="flex justify-end gap-2 mt-1">
                        <button class="px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 cursor-pointer">Cancelar</button>
                        <button class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-black bg-cyan-400 hover:bg-cyan-300 shadow-md cursor-pointer">Confirmar y Escribir</button>
                    </div>
                </div>
            </div>
        </div>
    </section>

</div>

</body>
</html>
"""

with open(OUT_FILE, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"✓ Master Component Library generada con éxito en:\n  {OUT_FILE} ({len(html_content)} bytes)")
