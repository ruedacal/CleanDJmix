#!/usr/bin/env python3
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEN_FILE = os.path.join(ROOT_DIR, "scripts", "generate_master_components.py")

with open(GEN_FILE, "r", encoding="utf-8") as f:
    content = f.read()

# Verify if sections 6-10 are already present
if "DOMINIO 6: SETS" in content:
    print("Already expanded.")
    exit(0)

new_sections = """
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
"""

# Replace the closing tag
target = """            </div>
        </div>
    </section>

</div>

</body>
</html>"""

replacement = """            </div>
        </div>
    </section>
""" + new_sections + """
</div>

</body>
</html>"""

if target in content:
    content = content.replace(target, replacement)
    # Also update header description
    content = content.replace("18 Componentes Maestros", "32 Componentes Maestros")
    content = content.replace("18 componentes maestros", "32 componentes maestros")
    with open(GEN_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    print("✓ Successfully expanded generate_master_components.py to 32 components!")
else:
    print("Target not found in content!")
