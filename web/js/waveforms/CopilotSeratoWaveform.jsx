const { useState, useEffect, useRef, useMemo } = React;
import { computeTrackStructuralBands } from './waveformUtils.js';

// =======================================================
export const CopilotSeratoWaveform = ({
    deck,
    side = "1",
    antiMuddy = null,
    partnerDeck = null
}) => {
    const canvasRef = useRef(null);
    const minimapRef = useRef(null);
    const minimapCacheRef = useRef(null);
    const [zoom, setZoom] = useState(4); // 2x, 4x, 8x, 16x
    const [showTacticalAids, setShowTacticalAids] = useState(true);
    const [hoveredMilestone, setHoveredMilestone] = useState(null);
    const initialProgress = (typeof deck.play_progress === 'number' && !isNaN(deck.play_progress)) ? deck.play_progress : 0.0;
    const [progress, setProgress] = useState(initialProgress);
    const progressRef = useRef(initialProgress);
    const isPlayingRef = useRef(Boolean(deck.is_playing));
    const bpmRef = useRef(deck.bpm || 130.0);
    const durationSecRef = useRef(deck.duration_sec || 390.0);

    useEffect(() => {
        if (deck.play_progress !== undefined && deck.play_progress !== null) {
            const diff = Math.abs(progressRef.current - deck.play_progress);
            if (diff > 0.01) {
                progressRef.current = deck.play_progress;
                setProgress(deck.play_progress);
            }
        }
        isPlayingRef.current = Boolean(deck.is_playing);
        bpmRef.current = parseFloat(deck.bpm) || 130.0;
        durationSecRef.current = parseFloat(deck.duration_sec) || 390.0;
    }, [deck.play_progress, deck.is_playing, deck.bpm, deck.duration_sec]);

    // Reproducción optimizada en tiempo real: solo corre rAF cuando deck.is_playing es verdadero
    useEffect(() => {
        let animId;
        let lastTime = performance.now();
        let lastUiUpdate = 0;

        const tick = (now) => {
            const dt = (now - lastTime) / 1000.0;
            lastTime = now;

            if (isPlayingRef.current && durationSecRef.current > 0) {
                const advance = dt / durationSecRef.current;
                const next = (progressRef.current + advance) % 1.0;
                progressRef.current = next;

                // Throttled UI state updates a ~30fps para mantener el hilo principal ágil
                if (now - lastUiUpdate >= 33) {
                    lastUiUpdate = now;
                    setProgress(next);
                }
            }
            if (isPlayingRef.current) {
                animId = requestAnimationFrame(tick);
            }
        };

        if (isPlayingRef.current) {
            animId = requestAnimationFrame(tick);
        }
        return () => {
            if (animId) cancelAnimationFrame(animId);
        };
    }, [deck.is_playing]);

    const rawId = deck.file_path || deck.title || "1";
    const seed = rawId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;
    const durSec = deck.duration_sec || 390.0;
    const elapsedSec = progress * durSec;
    const remainSec = Math.max(0, durSec - elapsedSec);

    // Decodificación de la silueta espectral real Serato Overview (1280 columnas x 3 bandas)
    const overviewBytes = useMemo(() => {
        if (!deck.serato_overview) return null;
        try {
            const bin = atob(deck.serato_overview);
            const u8 = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) {
                u8[i] = bin.charCodeAt(i);
            }
            return u8;
        } catch (e) {
            return null;
        }
    }, [deck.serato_overview]);

    const formatSec = (s) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const cues = deck.cues || [
        { id: 1, name: "Downbeat 1.0.0", color: "#ef4444", pct: 0.04, time: "00:00.25", directive: "Punto de anclaje inicial. Arranca beatmatching aquí." },
        { id: 2, name: "Intro Perc", color: "#f97316", pct: 0.16, time: "01:04.00", directive: "Entrada de caja y charles. Inicia subida gradual del fader." },
        { id: 3, name: "Bassline In", color: "#eab308", pct: 0.32, time: "02:08.00", directive: "Aparecen graves dominantes. Revisa EQ Low del otro deck." },
        { id: 4, name: "MAIN DROP", color: "#10b981", pct: 0.48, time: "03:12.00", directive: "Clímax 100% de potencia. Corta totalmente los graves del deck saliente." },
        { id: 5, name: "Breakdown", color: "#06b6d4", pct: 0.62, time: "04:16.00", directive: "Parón melódico sin bombo. Ventana idónea para transiciones vocales." },
        { id: 6, name: "Climax 2", color: "#22d3ee", pct: 0.74, time: "05:04.00", directive: "Segundo impacto de sala. Mantén energía alta." },
        { id: 7, name: "Outro 32b", color: "#8b5cf6", pct: 0.86, time: "06:08.00", directive: "Se retiran capas rítmicas. Zona recomendada para mezclar track entrante." },
        { id: 8, name: "Cut / Fade", color: "#ec4899", pct: 0.96, time: "07:15.00", directive: "Final de pista. Fade-out o corte antes del silencio." }
    ];

    const phases = deck.structural_phases || [
        { id: "intro", name: "Intro", start_pct: 0.0, end_pct: 0.16, type: "intro", label: "Intro 32b • Mezcla In", color: "#06b6d4", directive: "32 compases de entrada. Sincroniza beatgrid." },
        { id: "build", name: "Bassline In", start_pct: 0.16, end_pct: 0.35, type: "build", label: "Bassline Activa", color: "#eab308", directive: "Filtra frecuencias sub con filtro High-Pass." },
        { id: "break", name: "Breakdown", start_pct: 0.35, end_pct: 0.48, type: "break", label: "Breakdown (Sin Graves)", color: "#38bdf8", directive: "Sin bombo. Oportunidad para cruce de leads o acapellas." },
        { id: "drop", name: "MAIN DROP", start_pct: 0.48, end_pct: 0.74, type: "drop", label: "⚡ DROP PRINCIPAL (Clímax)", color: "#ef4444", directive: "Energía máxima en pista. Kill switch en graves opuestos." },
        { id: "break2", name: "Segundo Parón", start_pct: 0.74, end_pct: 0.82, type: "break", label: "Puente Melódico", color: "#a855f7", directive: "Transición melódica antes del outro." },
        { id: "outro", name: "Outro", start_pct: 0.82, end_pct: 1.0, type: "outro", label: "🟢 MEZCLA SEGURA (Outro)", color: "#10b981", directive: "Zona segura de mezcla. Abre canal entrante." }
    ];

    const nextCue = cues.find(c => (c.pct || 0) > progress);
    const beatsToNextCue = nextCue && deck.bpm ? Math.round(((nextCue.pct - progress) * durSec) / (60.0 / deck.bpm)) : null;
    const barsToNextCue = beatsToNextCue ? Math.max(1, Math.ceil(beatsToNextCue / 4)) : null;
    const timeToNextCue = nextCue ? Math.max(0, (nextCue.pct - progress) * durSec) : 0;

    const bothPlaying = Boolean(deck.is_playing && partnerDeck && partnerDeck.is_playing);
    const isBassClashDanger = bothPlaying && antiMuddy && antiMuddy.status === 'danger' && (deck.low_ratio || 0) >= 44;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const w = rect.width || canvas.parentElement.clientWidth || 550;
        const h = 88;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        const ctx = canvas.getContext('2d');
        if (ctx.resetTransform) ctx.resetTransform(); else ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#05050a';
        ctx.fillRect(0, 0, w, h);

        const midY = h / 2;
        const playheadX = w / 2; // Aguja central Serato

        const windowSec = durSec / zoom;
        const halfWindowSec = windowSec / 2;
        const currentSec = progress * durSec;
        const startSec = currentSec - halfWindowSec;
        const endSec = currentSec + halfWindowSec;

        // Rejilla de compases (Beatgrid Serato)
        const bpm = deck.bpm || 130.0;
        const beatSec = 60.0 / bpm;
        const downbeatSec = (deck && deck.first_downbeat_ms) ? (parseFloat(deck.first_downbeat_ms) / 1000.0) : 0.0;
        if (beatSec > 0) {
            const firstBeatIdx = Math.floor((startSec - downbeatSec) / beatSec);
            const lastBeatIdx = Math.ceil((endSec - downbeatSec) / beatSec);
            for (let b = firstBeatIdx; b <= lastBeatIdx; b++) {
                const bSec = downbeatSec + (b * beatSec);
                const bx = playheadX + ((bSec - currentSec) / windowSec) * w;
                if (bx >= 0 && bx <= w) {
                    const isBar = (b % 4 === 0);
                    const isPhrase = (b % 16 === 0);
                    ctx.strokeStyle = isPhrase ? 'rgba(255, 255, 255, 0.45)' : isBar ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.08)';
                    ctx.lineWidth = isPhrase ? 1.5 : 1;
                    ctx.beginPath();
                    ctx.moveTo(bx, isBar ? 6 : 14);
                    ctx.lineTo(bx, h - (isBar ? 6 : 14));
                    ctx.stroke();

                    if (isBar && bx > 15 && bx < w - 25) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                        ctx.font = '8px monospace';
                        ctx.fillText(`${Math.floor(b / 4) + 1}`, bx + 2, 12);
                    }
                }
            }
        }

        // Zonas de fases (Tintado suave)
        if (showTacticalAids) {
            phases.forEach(ph => {
                const phStartSec = ph.start_pct * durSec;
                const phEndSec = ph.end_pct * durSec;
                if (phEndSec >= startSec && phStartSec <= endSec) {
                    const x1 = Math.max(0, playheadX + ((phStartSec - currentSec) / windowSec) * w);
                    const x2 = Math.min(w, playheadX + ((phEndSec - currentSec) / windowSec) * w);
                    if (x2 > x1) {
                        ctx.fillStyle = `${ph.color}14`;
                        ctx.fillRect(x1, 0, x2 - x1, h);

                        ctx.fillStyle = `${ph.color}88`;
                        ctx.fillRect(x1, 0, x2 - x1, 2);
                    }
                }
            });

            // Resaltado de Choque de Graves si Anti-Muddy está en peligro
            if (isBassClashDanger) {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
                ctx.fillRect(playheadX - 60, 0, 120, h);
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
                ctx.lineWidth = 1;
                ctx.strokeRect(playheadX - 60, 0, 120, h);
            }
        }

        // Espectro Tricromático Serato Oficial (1280 columnas x 3 bandas reales o síntesis acústica de respaldo)
        const stepPx = 2;
        const totalSlices = Math.ceil(w / stepPx);
        for (let i = 0; i < totalSlices; i++) {
            const x = i * stepPx;
            const sliceSec = startSec + (x / w) * windowSec;
            const sliceNorm = sliceSec / durSec;

            if (sliceNorm >= 0.0 && sliceNorm <= 1.0) {
                let bass, mid, treble;
                if (overviewBytes && overviewBytes.length >= 3840) {
                    const colIdx = Math.min(1279, Math.max(0, Math.floor(sliceNorm * 1280)));
                    const byteOffset = colIdx * 3;
                    bass = Math.min(1.0, (overviewBytes[byteOffset] || 0) / 220.0);
                    mid = Math.min(1.0, (overviewBytes[byteOffset + 1] || 0) / 120.0);
                    treble = Math.min(1.0, (overviewBytes[byteOffset + 2] || 0) / 120.0);
                } else {
                    const bands = computeTrackStructuralBands(sliceNorm, seed, deck);
                    bass = bands.bass;
                    mid = Math.max(bands.drums, bands.vocals);
                    treble = bands.treble;
                }
                const maxAmp = (h / 2) - 8;

                // 1. Sub-Bass & Bombo (<200Hz) en Rojo Serato Canónico
                const bassAmp = bass * maxAmp * 0.95;
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(x, midY - bassAmp, stepPx - 0.4, bassAmp * 2);

                // 2. Medios y Vocales (200Hz - 2.5kHz) en Cian / Azul Eléctrico Serato
                const midAmp = mid * maxAmp * 0.72;
                ctx.fillStyle = '#06b6d4';
                ctx.fillRect(x, midY - midAmp, stepPx - 0.4, midAmp * 2);

                // 3. Agudos y Transientes (>2.5kHz) en Blanco Brillante Serato
                const trebAmp = treble * maxAmp * 0.48;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x, midY - trebAmp, stepPx - 0.4, trebAmp * 2);

                // Núcleo central amarillo en picos de pegada (>0.85)
                if (bass > 0.85) {
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillRect(x, midY - 2, stepPx - 0.4, 4);
                }
            }
        }

        // Pines y Banderines de Hot Cues (1 a 8) - Marcadores sin texto intrusivo
        if (showTacticalAids) {
            cues.forEach(cue => {
                const cueSec = (cue.pct !== undefined ? cue.pct : 0) * durSec;
                if (cueSec >= startSec && cueSec <= endSec) {
                    const cx = playheadX + ((cueSec - currentSec) / windowSec) * w;
                    if (cx >= 0 && cx <= w) {
                        ctx.strokeStyle = cue.color || '#06b6d4';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(cx, 0);
                        ctx.lineTo(cx, h);
                        ctx.stroke();

                        ctx.fillStyle = cue.color || '#06b6d4';
                        ctx.fillRect(cx - 1, 2, 16, 12);

                        ctx.fillStyle = '#000000';
                        ctx.font = 'bold 8px monospace';
                        ctx.fillText(`C${cue.id || ''}`, cx + 2, 11);
                    }
                }
            });
        }

        // Aguja Central Playhead Serato (Línea Blanca con Flechas)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, h);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(playheadX - 5, 0);
        ctx.lineTo(playheadX + 5, 0);
        ctx.lineTo(playheadX, 8);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(playheadX - 5, h);
        ctx.lineTo(playheadX + 5, h);
        ctx.lineTo(playheadX, h - 8);
        ctx.closePath();
        ctx.fill();

        // Minimapa Overview de la Pista Completa con Capa Pre-renderizada en Cache
        const miniCanvas = minimapRef.current;
        if (!miniCanvas) return;
        const mRect = miniCanvas.getBoundingClientRect();
        const mw = mRect.width || miniCanvas.parentElement.clientWidth || 550;
        const mh = 22;
        miniCanvas.width = Math.round(mw * dpr);
        miniCanvas.height = Math.round(mh * dpr);
        const mCtx = miniCanvas.getContext('2d');
        if (mCtx.resetTransform) mCtx.resetTransform(); else mCtx.setTransform(1, 0, 0, 1, 0, 0);
        mCtx.scale(dpr, dpr);

        const cacheKey = `${rawId}_${mw}_${showTacticalAids}_${overviewBytes ? 'real' : 'synth'}`;
        if (!minimapCacheRef.current || minimapCacheRef.current.key !== cacheKey) {
            const off = document.createElement('canvas');
            off.width = Math.round(mw * dpr);
            off.height = Math.round(mh * dpr);
            const oCtx = off.getContext('2d');
            if (oCtx.resetTransform) oCtx.resetTransform(); else oCtx.setTransform(1, 0, 0, 1, 0, 0);
            oCtx.scale(dpr, dpr);

            oCtx.fillStyle = '#06060e';
            oCtx.fillRect(0, 0, mw, mh);

            const mStep = 2;
            const mSlices = Math.ceil(mw / mStep);
            for (let j = 0; j < mSlices; j++) {
                const mx = j * mStep;
                const mNorm = mx / mw;
                let bVal, mVal, tVal;
                if (overviewBytes && overviewBytes.length >= 3840) {
                    const colIdx = Math.min(1279, Math.max(0, Math.floor(mNorm * 1280)));
                    const byteOffset = colIdx * 3;
                    bVal = Math.min(1.0, (overviewBytes[byteOffset] || 0) / 220.0);
                    mVal = Math.min(1.0, (overviewBytes[byteOffset + 1] || 0) / 120.0);
                    tVal = Math.min(1.0, (overviewBytes[byteOffset + 2] || 0) / 120.0);
                } else {
                    const bands = computeTrackStructuralBands(mNorm, seed, deck);
                    bVal = bands.bass;
                    mVal = Math.max(bands.drums, bands.vocals);
                    tVal = bands.treble;
                }
                const mHalf = mh / 2;
                const bAmp = bVal * (mHalf - 2);
                const mAmp = mVal * (mHalf - 3);
                const tAmp = tVal * (mHalf - 4);

                // 1. Capa Sub-Graves (Rojo Serato Canónico)
                oCtx.fillStyle = '#ef4444';
                oCtx.fillRect(mx, mHalf - bAmp, mStep - 0.4, bAmp * 2);

                // 2. Capa Medios (Cian / Azul Serato)
                oCtx.fillStyle = '#06b6d4';
                oCtx.fillRect(mx, mHalf - mAmp, mStep - 0.4, mAmp * 2);

                // 3. Capa Agudos (Blanco Serato)
                oCtx.fillStyle = '#ffffff';
                oCtx.fillRect(mx, mHalf - tAmp, mStep - 0.4, tAmp * 2);
            }

            if (showTacticalAids) {
                phases.forEach(ph => {
                    const px1 = ph.start_pct * mw;
                    const px2 = ph.end_pct * mw;
                    oCtx.fillStyle = `${ph.color}25`;
                    oCtx.fillRect(px1, 0, px2 - px1, mh);
                    oCtx.fillStyle = ph.color;
                    oCtx.fillRect(px1, 0, px2 - px1, 1.5);
                });

                cues.forEach(cue => {
                    const cx = (cue.pct || 0) * mw;
                    oCtx.fillStyle = cue.color || '#06b6d4';
                    oCtx.fillRect(cx - 0.5, 0, 1.5, mh);
                });
            }

            minimapCacheRef.current = { key: cacheKey, canvas: off };
        }

        // Dibujar el fondo estático precalculado instantáneamente
        mCtx.drawImage(minimapCacheRef.current.canvas, 0, 0, mw, mh);

        // Aguja playhead y ventana de zoom visible
        const vStart = Math.max(0, (startSec / durSec) * mw);
        const vEnd = Math.min(mw, (endSec / durSec) * mw);
        mCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        mCtx.fillRect(vStart, 0, Math.max(4, vEnd - vStart), mh);
        mCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        mCtx.lineWidth = 1;
        mCtx.strokeRect(vStart, 0, Math.max(4, vEnd - vStart), mh);

        const mPlayheadX = progress * mw;
        mCtx.fillStyle = '#ffffff';
        mCtx.fillRect(mPlayheadX - 1, 0, 2, mh);
    }, [zoom, showTacticalAids, progress, deck, antiMuddy, isBassClashDanger]);

    const handleMinimapClick = (e) => {
        const miniCanvas = minimapRef.current;
        if (!miniCanvas) return;
        const rect = miniCanvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newPct = Math.max(0, Math.min(1, clickX / rect.width));
        progressRef.current = newPct;
        setProgress(newPct);
    };

    return (
        <div className="flex flex-col gap-2 p-2 sm:p-2.5 rounded-2xl bg-[#030308] border border-zinc-800/90 shadow-inner">
            {/* TACTICAL ANTICIPATION HUD BOX: CONTADOR Y PUNTOS CLAVE CON TOOLTIP DETALLADO */}
            {showTacticalAids && (
                <div className="relative p-2 rounded-xl bg-zinc-950/90 border border-zinc-800/80 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* CONTADOR DE ANTICIPACIÓN (URGENCIA EN ROJO < 5s) */}
                        <div className="flex items-center gap-2">
                            {!deck.is_playing ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-500/70 text-indigo-200 font-mono text-[11px] font-bold shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                                    <span className="text-sm">🎧</span>
                                    <span>EN CUE (PREPARADO) ➔ Listo para soltar en primer bombo (Bar 1)</span>
                                </div>
                            ) : isBassClashDanger ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500 text-red-200 font-mono text-[11px] font-bold shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse ring-1 ring-red-400">
                                    <span className="text-sm">⚠️</span>
                                    <span>EN {barsToNextCue || 8} COMPASES ({formatSec(timeToNextCue || 16)}) ➔ BASS CLASH: Cortar Low EQ</span>
                                </div>
                            ) : nextCue ? (
                                (timeToNextCue <= 5.0 && timeToNextCue > 0) ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white font-mono text-[11px] font-black shadow-[0_0_25px_rgba(239,68,68,1)] ring-2 ring-red-400 border border-white animate-pulse scale-105">
                                        <span className="text-sm animate-bounce">🚨</span>
                                        <span>¡ATENCIÓN! EN <strong className="text-yellow-300 font-orbitron">{formatSec(timeToNextCue)}</strong> ➔ <span className="uppercase tracking-wider">{nextCue.name}</span></span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-djcyan-950/60 border border-djcyan-500/60 text-djcyan-300 font-mono text-[11px] font-bold">
                                        <span>⏳</span>
                                        <span>EN <strong className="text-white font-orbitron">{barsToNextCue}</strong> BARS ({formatSec(timeToNextCue)}) ➔ <span className="text-white uppercase">{nextCue.name}</span></span>
                                    </div>
                                )
                            ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold">
                                    <span>🟢</span>
                                    <span>EN ZONA SEGURA DE MEZCLA (OUTRO)</span>
                                </div>
                            )}
                        </div>

                        {/* HITOS DE AYUDA TÁCTICOS DIFERENCIADOS CLARAMENTE DE LOS CUES */}
                        <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[9px] font-mono uppercase text-amber-400 font-bold mr-1 hidden md:inline">🎯 Hitos:</span>
                            {phases.map((ph) => {
                                const phStart = ph.start_pct || 0;
                                const isPassed = phStart <= progress;
                                const isCurrent = progress >= ph.start_pct && progress < ph.end_pct;
                                const iconsMap = { intro: '🚀', build: '🛑', break: '🌊', break2: '🌊', drop: '🎯', outro: '🏁' };
                                const icon = iconsMap[ph.type] || '⚡';
                                return (
                                    <div
                                        key={ph.id}
                                        onMouseEnter={() => setHoveredMilestone({
                                            name: ph.name || ph.label,
                                            time: formatSec(ph.start_pct * durSec),
                                            pct: ph.start_pct,
                                            color: ph.color,
                                            directive: ph.directive || ph.label
                                        })}
                                        onMouseLeave={() => setHoveredMilestone(null)}
                                        className={`relative px-1.5 py-0.5 rounded cursor-pointer transition-all text-[9px] font-mono font-bold flex items-center gap-1 border ${
                                            isCurrent
                                                ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.9)] scale-105 ring-1 ring-white'
                                                : isPassed
                                                ? 'bg-zinc-900/80 text-zinc-400 border-zinc-800'
                                                : 'bg-zinc-950 text-zinc-300 border-zinc-700/60 hover:border-amber-400'
                                        }`}
                                    >
                                        <span>{icon}</span>
                                        <span className="truncate max-w-[70px]">{ph.name.toUpperCase()}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* POPOVER CON INSTRUCCIÓN DETALLADA AL HACER HOVER */}
                    {hoveredMilestone && (
                        <div className="absolute left-2 right-2 top-full mt-1.5 z-30 p-2.5 rounded-xl bg-black/95 border border-djcyan-500/60 shadow-2xl backdrop-blur-md text-xs font-mono animate-fadeIn">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-1 mb-1.5">
                                <span className="font-syne font-bold text-white flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredMilestone.color }}></span>
                                    {hoveredMilestone.name} ({hoveredMilestone.time})
                                </span>
                                <span className="text-[10px] text-djcyan-400 font-mono">
                                    Compás {Math.round((hoveredMilestone.pct * durSec) / (60 / (deck.bpm || 130)) / 4)}
                                </span>
                            </div>
                            <p className="text-[11px] text-zinc-300 leading-relaxed">
                                <strong className="text-emerald-400">Acción DJ:</strong> {hoveredMilestone.directive || "Ajuste de ganancia y sincronía armónica antes del drop."}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Barra de Control del Waveform + LEYENDA DE FRECUENCIAS */}
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
                {/* BOTÓN TOGGLE DE AYUDAS TÁCTICAS DJ + LEYENDA 3-BANDAS */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setShowTacticalAids(!showTacticalAids)}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg font-bold uppercase transition-all cursor-pointer border text-[10px] sm:text-[11px] ${
                            showTacticalAids
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                        }`}
                        title="Habilitar/Deshabilitar ayudas visuales (Drops, Cues, Zonas Seguras y Anti-Muddy) en el waveform"
                    >
                        <span>{showTacticalAids ? '🎯' : '⚪'}</span>
                        <span>{showTacticalAids ? 'Ayudas DJ' : 'Puro Wave'}</span>
                    </button>

                    {/* LEYENDA VISUAL DE FRECUENCIAS SERATO 3-BAND */}
                    <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 rounded-md bg-zinc-950/80 border border-zinc-800 text-[9px] text-zinc-400">
                        {overviewBytes && (
                            <span className="flex items-center gap-1 font-mono text-[8.5px] font-black px-1.5 py-0.2 rounded bg-red-950/70 border border-red-500/50 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.3)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                                SERATO OVERVIEW REAL
                            </span>
                        )}
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>Graves (&lt;200Hz)</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4]"></span>Medios (200Hz-2.5kHz)</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#ffffff]"></span>Agudos (&gt;2.5kHz)</span>
                    </div>
                </div>

                {/* CONTROLES DE ZOOM Y TIEMPOS */}
                <div className="flex items-center gap-2">
                    {/* Zoom Presets */}
                    <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px]">
                        {[2, 4, 8, 16].map(z => (
                            <button
                                key={z}
                                type="button"
                                onClick={() => setZoom(z)}
                                className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                                    zoom === z ? 'bg-djcyan-500 text-black shadow' : 'text-zinc-400 hover:text-white'
                                }`}
                            >
                                {z}x
                            </button>
                        ))}
                    </div>

                    {/* Tiempo Transcurrido y Restante */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[10px] sm:text-[11px]">
                        <span className="text-white font-bold">{formatSec(elapsedSec)}</span>
                        <span className="text-zinc-600">/</span>
                        <span className="text-zinc-400">-{formatSec(remainSec)}</span>
                    </div>
                </div>
            </div>

            {/* Canvas Waveform Zoom Serato (Centrado en Playhead) */}
            <div className="relative w-full rounded-xl overflow-hidden border border-zinc-800/80 bg-[#05050b]">
                <canvas
                    ref={canvasRef}
                    style={{ width: '100%', height: '88px', display: 'block' }}
                />
            </div>

            {/* Canvas Minimap Track Overview Completo (0-100%) */}
            <div 
                onClick={handleMinimapClick}
                className="relative w-full rounded-lg overflow-hidden border border-zinc-800/60 bg-[#06060e] cursor-pointer hover:border-zinc-700 transition-colors"
                title="Haz clic en cualquier punto para saltar en la pista"
            >
                <canvas
                    ref={minimapRef}
                    style={{ width: '100%', height: '22px', display: 'block' }}
                />
            </div>
        </div>
    );
};

