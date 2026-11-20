const { useState, useEffect, useRef, useCallback, useMemo } = React;
import { NV2_COLORS } from '../data/constants.js';
import { parseDurationMs, formatMsToTime, parseTimeToMs, computeTrackStructuralBands } from './waveformUtils.js';

// Waveform Rekordbox Ampliado con Zoom Horizontal, Beatgrid Milimétrico y Minimapa Overview
export const ZoomableRekordboxWaveform = ({
    track,
    cues = NV2_COLORS,
    duration = "06:12",
    onSeekTrack,
    playProgress = 0,
    isCurrentPlaying = false,
    onUpdateCues,
    selectedCueId = 1,
    onSelectCue,
    snapToGrid = true,
    showBeatgrid = true,
    zoom = 4,
    followPlayhead = true,
    height = 160,
    lang = "es"
}) => {
    const scrollContainerRef = useRef(null);
    const canvasRef = useRef(null);
    const minimapCanvasRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(900);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [draggingCueIdx, setDraggingCueIdx] = useState(null);
    const [dragInfo, setDragInfo] = useState(null);
    const isMinimapDraggingRef = useRef(false);

    const rawId = track && track.id ? String(track.id) : "1";
    const seed = rawId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;
    const durMs = parseDurationMs(duration);
    const bpm = (track && (track.bpm || track.b)) ? Math.max(30.0, parseFloat(track.bpm || track.b) || 128.0) : 128.0;
    const beatMs = 60000.0 / bpm;
    const barMs = beatMs * 4.0;
    const downbeatMs = track && track.first_downbeat_ms ? parseFloat(track.first_downbeat_ms) : 0;
    const trimMs = track && track.trim_start_ms ? parseFloat(track.trim_start_ms) : 0;
    const trimEndMs = track && track.trim_end_ms ? parseFloat(track.trim_end_ms) : durMs;

    // Hot Cues dinámicos reales (Sparse Cues de 4 a 8 pads)
    const activeCues = (cues && Array.isArray(cues) && cues.length > 0)
        ? cues.filter(c => c && !c.is_empty && ((c.pos_ms !== undefined && c.pos_ms !== null) || (c.pct !== undefined && c.pct !== null)))
        : [];
    const totalWidth = Math.max(containerWidth, Math.round(containerWidth * Math.max(1, zoom)));

    // Medición del ancho visible del contenedor
    useEffect(() => {
        const updateWidth = () => {
            if (scrollContainerRef.current) {
                const w = scrollContainerRef.current.clientWidth;
                if (w > 100) setContainerWidth(w);
            }
        };
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    // Sincronización de scroll y posición horizontal
    const handleScroll = (e) => {
        setScrollLeft(e.target.scrollLeft);
    };

    // Auto-Seguir Playhead durante la reproducción
    useEffect(() => {
        if (!isCurrentPlaying || !followPlayhead || !scrollContainerRef.current) return;
        const playheadPx = playProgress * totalWidth;
        const targetScroll = playheadPx - (containerWidth / 2);
        scrollContainerRef.current.scrollLeft = Math.max(0, Math.min(totalWidth - containerWidth, targetScroll));
    }, [isCurrentPlaying, followPlayhead, playProgress, totalWidth, containerWidth]);

    // Dragging de Hot Cues con Rejilla y Tiempos Milimétricos
    const handleCueMouseDown = (e, idx) => {
        e.stopPropagation();
        e.preventDefault();
        setDraggingCueIdx(idx);
        if (onSelectCue && activeCues[idx]) {
            onSelectCue(activeCues[idx].id !== undefined ? activeCues[idx].id : (idx + 1));
        }
    };

    useEffect(() => {
        if (draggingCueIdx === null) return;

        const handleMouseMove = (e) => {
            if (!canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const rawX = e.clientX - rect.left;
            const rawPct = Math.max(0, Math.min(1, rawX / totalWidth));
            const rawMs = rawPct * durMs;

            let finalMs = rawMs;
            if (snapToGrid) {
                const beatOffset = Math.round((rawMs - downbeatMs) / beatMs);
                finalMs = Math.max(0, Math.min(durMs, downbeatMs + (beatOffset * beatMs)));
            }
            const finalPct = durMs > 0 ? (finalMs / durMs) : 0;
            const timeStr = formatMsToTime(finalMs);
            const barNum = Math.max(1, Math.floor((finalMs - downbeatMs) / barMs) + 1);
            const beatNum = Math.floor(Math.max(0, (finalMs - downbeatMs) % barMs) / beatMs) + 1;
            const barStr = `Bar ${barNum}.${beatNum}`;

            setDragInfo({
                idx: draggingCueIdx,
                pct: finalPct * 100,
                time: timeStr,
                bar: barStr,
                posMs: Math.round(finalMs)
            });

            if (onUpdateCues) {
                const updated = activeCues.map((c, i) => {
                    if (i === draggingCueIdx) {
                        return {
                            ...c,
                            pct: finalPct,
                            pos_ms: Math.round(finalMs),
                            time: timeStr,
                            bar: barNum,
                            bar_str: `Bar ${barNum}`
                        };
                    }
                    return c;
                });
                onUpdateCues(updated);
            }
        };

        const handleMouseUp = () => {
            setDraggingCueIdx(null);
            setDragInfo(null);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [draggingCueIdx, durMs, downbeatMs, beatMs, barMs, snapToGrid, activeCues, onUpdateCues, totalWidth]);

    // Click o Arrastre (Scrubbing) en Canvas Zoomed para situar la aguja de reproducción (Playhead)
    const [isScrubbing, setIsScrubbing] = useState(false);

    const handleSeekToX = (clientX) => {
        if (!canvasRef.current || !onSeekTrack) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const rawX = clientX - rect.left;
        const pct = Math.max(0, Math.min(1, rawX / totalWidth));
        const targetSec = (durMs * pct) / 1000.0;
        onSeekTrack(track, pct, true, targetSec);
    };

    const handleCanvasMouseDown = (e) => {
        if (draggingCueIdx !== null) return;
        setIsScrubbing(true);
        handleSeekToX(e.clientX);
    };

    useEffect(() => {
        if (!isScrubbing) return;
        const handleMouseMove = (e) => {
            handleSeekToX(e.clientX);
        };
        const handleMouseUp = () => {
            setIsScrubbing(false);
        };
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isScrubbing, totalWidth, durMs, track, onSeekTrack]);

    const handleCanvasClick = (e) => {
        if (!canvasRef.current || !onSeekTrack || draggingCueIdx !== null) return;
        handleSeekToX(e.clientX);
    };

    // Render del Minimapa Overview (Pista Completa con Ventana de Viewport)
    useEffect(() => {
        const canvas = minimapCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const mWidth = containerWidth;
        const mHeight = 28;
        canvas.width = mWidth * dpr;
        canvas.height = mHeight * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = "#07070b";
        ctx.fillRect(0, 0, mWidth, mHeight);
        const mCenterY = mHeight / 2;

        // Renderizado estructural en miniatura
        for (let x = 0; x <= mWidth; x += 2) {
            const xNorm = x / mWidth;
            const { bass, drums, isBreak } = computeTrackStructuralBands(xNorm, seed, track);
            const h = (mHeight * 0.42) * Math.max(0.1, (bass + drums) * 0.7);
            ctx.fillStyle = isBreak ? "rgba(16, 185, 129, 0.4)" : "rgba(6, 182, 212, 0.75)";
            ctx.fillRect(x, mCenterY - h, 1.8, h * 2);
        }

        // Marcas de los 8 Hot Cues en el minimapa
        activeCues.slice(0, 8).forEach((cue, idx) => {
            const pct = cue.pct !== undefined ? cue.pct : (parseTimeToMs(cue.time || "0") / durMs);
            const cx = Math.max(0, Math.min(mWidth, pct * mWidth));
            const color = cue.color || (NV2_COLORS[idx] ? NV2_COLORS[idx].color : '#06b6d4');
            ctx.fillStyle = color;
            ctx.fillRect(cx - 1, 0, 2, mHeight);
        });
    }, [containerWidth, seed, durMs, activeCues, track]);

    // Navegación y Salto por click/arrastre en el Minimapa
    const handleMinimapInteraction = (e) => {
        if (!minimapCanvasRef.current || !scrollContainerRef.current) return;
        const rect = minimapCanvasRef.current.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const pct = clickX / rect.width;
        const targetScroll = (pct * totalWidth) - (containerWidth / 2);
        scrollContainerRef.current.scrollLeft = Math.max(0, Math.min(totalWidth - containerWidth, targetScroll));
        if (onSeekTrack && track) {
            const targetSec = (durMs * pct) / 1000.0;
            onSeekTrack(track, pct, true, targetSec);
        }
    };

    // Render del Canvas Principal Zoomed con Beatgrid Ampliado y Formas de Onda HD
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        canvas.width = totalWidth * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = "#030306";
        ctx.fillRect(0, 0, totalWidth, height);
        const centerY = height / 2;

        // 1. BEATGRID AMPLIO (Compases, Frases y Subdivisiones)
        if (showBeatgrid && bpm >= 40.0) {
            // Adelante desde el downbeat
            for (let t = downbeatMs; t <= durMs; t += beatMs) {
                const bx = (t / durMs) * totalWidth;
                if (bx < 0 || bx > totalWidth) continue;
                const bIdx = Math.round((t - downbeatMs) / beatMs);
                const isBar = (bIdx % 4 === 0);
                const barNum = Math.floor(bIdx / 4) + 1;
                const isPhrase16 = (bIdx % 16 === 0);

                ctx.beginPath();
                if (isPhrase16) {
                    ctx.strokeStyle = "rgba(6, 182, 212, 0.75)";
                    ctx.lineWidth = 1.5;
                } else if (isBar) {
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
                    ctx.lineWidth = 1.0;
                } else {
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.10)";
                    ctx.lineWidth = 0.75;
                }
                ctx.moveTo(bx, 0);
                ctx.lineTo(bx, height);
                ctx.stroke();

                // Rótulos de Compás y Frase visibles con zoom amplio
                if (isPhrase16) {
                    ctx.fillStyle = "#06b6d4";
                    ctx.fillRect(bx - 1, 0, 2.5, 10);
                    ctx.font = "bold 9px monospace";
                    ctx.fillText(`P${barNum}`, bx + 3, 11);
                } else if (isBar && zoom >= 2) {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
                    ctx.fillRect(bx - 0.5, 0, 1.5, 6);
                    if (zoom >= 4) {
                        ctx.font = "8px monospace";
                        ctx.fillText(`${barNum}`, bx + 2, 8);
                    }
                }
            }

            // Hacia atrás antes del primer downbeat
            for (let t = downbeatMs - beatMs; t >= 0; t -= beatMs) {
                const bx = (t / durMs) * totalWidth;
                if (bx < 0 || bx > totalWidth) continue;
                const bIdx = Math.round((t - downbeatMs) / beatMs);
                const isBar = (bIdx % 4 === 0);
                const isSilent = trimMs > 0 && t < trimMs;
                ctx.beginPath();
                ctx.strokeStyle = isSilent ? "rgba(255, 255, 255, 0.02)" : (isBar ? "rgba(255, 255, 255, 0.20)" : "rgba(255, 255, 255, 0.08)");
                ctx.lineWidth = isBar ? 1.0 : 0.75;
                ctx.moveTo(bx, 0);
                ctx.lineTo(bx, height);
                ctx.stroke();
            }
        }

        // Sombreado de silencio inicial recortado (Trim In)
        if (trimMs > 0 && durMs > 0) {
            const trimX = (trimMs / durMs) * totalWidth;
            if (trimX > 0) {
                ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
                ctx.fillRect(0, 0, trimX, height);
                ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(trimX, 0);
                ctx.lineTo(trimX, height);
                ctx.stroke();
                ctx.fillStyle = "#ef4444";
                ctx.font = "bold 9px monospace";
                ctx.fillText(`TRIM IN -${Math.round(trimMs)}ms`, Math.max(2, trimX - 70), 10);
            }
        }

        // Sombreado de silencio final recortado (Trim Out / Cola)
        if (trimEndMs > 0 && trimEndMs < durMs && durMs > 0) {
            const trimEndX = (trimEndMs / durMs) * totalWidth;
            if (trimEndX < totalWidth) {
                ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
                ctx.fillRect(trimEndX, 0, totalWidth - trimEndX, height);
                ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(trimEndX, 0);
                ctx.lineTo(trimEndX, height);
                ctx.stroke();
                ctx.fillStyle = "#ef4444";
                ctx.font = "bold 9px monospace";
                ctx.fillText("TRIM OUT", trimEndX + 4, 10);
            }
        }

        // Marcador Especial Ancla 1.0.0 Beatgrid (Transitorio de Bombo / Downbeat)
        if (downbeatMs > 0 && durMs > 0) {
            const dbX = (downbeatMs / durMs) * totalWidth;
            if (dbX >= 0 && dbX <= totalWidth) {
                ctx.strokeStyle = "#06b6d4";
                ctx.lineWidth = 2.5;
                ctx.shadowColor = "#06b6d4";
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(dbX, 0);
                ctx.lineTo(dbX, height);
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Bandera distintiva Downbeat 1.0.0
                ctx.fillStyle = "#06b6d4";
                ctx.fillRect(dbX - 28, 0, 56, 13);
                ctx.fillStyle = "#000000";
                ctx.font = "bold 8.5px monospace";
                ctx.textAlign = "center";
                ctx.fillText("1.0.0 KICK", dbX, 9.5);
                ctx.textAlign = "start";
            }
        }

        // 2. FORMA DE ONDA DE 4 BANDAS EN ALTA RESOLUCIÓN A TRAVÉS DE TODO EL ANCHO ZOOMED
        for (let x = 0; x <= totalWidth; x += 1.5) {
            const xNorm = x / totalWidth;
            const { bass, drums, vocals, treble, isBreak } = computeTrackStructuralBands(xNorm, seed, track);

            // Fondo tenue de Breakdown
            if (isBreak) {
                ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
                ctx.fillRect(x, 0, 1.5, height);
            }

            // Capa 1: Bajos (Azul Cobalto profundo)
            const hBass = (height * 0.44) * bass;
            ctx.fillStyle = isBreak ? "rgba(30, 58, 138, 0.25)" : "rgba(37, 99, 235, 0.88)";
            ctx.fillRect(x, centerY - hBass, 1.5, hBass * 2);

            // Capa 2: Drums / Cajas (Naranja / Rojo bermellón)
            const hDrums = (height * 0.38) * drums;
            ctx.fillStyle = isBreak ? "rgba(153, 27, 27, 0.2)" : "rgba(239, 68, 68, 0.85)";
            ctx.fillRect(x, centerY - hDrums, 1.5, hDrums * 2);

            // Capa 3: Vocales / Medios (Amarillo ámbar)
            const hVocals = (height * 0.30) * vocals;
            ctx.fillStyle = isBreak ? "rgba(217, 119, 6, 0.85)" : "rgba(234, 179, 8, 0.88)";
            ctx.fillRect(x, centerY - hVocals, 1.5, hVocals * 2);

            // Capa 4: Agudos / Hi-Hats (Blanco / Cian brillante)
            const hTreble = (height * 0.20) * treble;
            ctx.fillStyle = isBreak ? "rgba(52, 211, 153, 0.6)" : "rgba(6, 182, 212, 0.95)";
            ctx.fillRect(x, centerY - hTreble, 1.5, hTreble * 2);
        }

        // 3. Eje central estéreo
        ctx.strokeStyle = "rgba(255, 255, 255, 0.20)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(totalWidth, centerY);
        ctx.stroke();

    }, [totalWidth, height, showBeatgrid, bpm, downbeatMs, durMs, beatMs, barMs, seed, zoom]);

    // Cálculo de la lente de Viewport en el Minimapa
    const viewportLeftPct = totalWidth > 0 ? (scrollLeft / totalWidth) * 100 : 0;
    const viewportWidthPct = totalWidth > 0 ? Math.min(100, (containerWidth / totalWidth) * 100) : 100;
    const downbeatPct = downbeatMs > 0 ? (downbeatMs / durMs) * 100 : null;

    return (
        <div className="flex flex-col gap-1.5 w-full select-none">
            {/* MINIMAPA OVERVIEW CON LENTE DE ZOOM */}
            <div 
                className="w-full relative h-7 bg-[#07070b] border border-djzinc-800 rounded overflow-hidden cursor-pointer shadow-inner"
                onClick={handleMinimapInteraction}
                onMouseDown={() => { isMinimapDraggingRef.current = true; }}
                onMouseMove={(e) => { if (isMinimapDraggingRef.current) handleMinimapInteraction(e); }}
                onMouseUp={() => { isMinimapDraggingRef.current = false; }}
                onMouseLeave={() => { isMinimapDraggingRef.current = false; }}
                title="Minimapa de la pista completa. Haz clic o arrastra para desplazarte rápidamente."
            >
                <canvas ref={minimapCanvasRef} className="w-full h-full block" />
                {/* Lente transparente indicadora de la zona visible actual */}
                <div 
                    style={{ left: `${viewportLeftPct}%`, width: `${viewportWidthPct}%` }}
                    className="absolute top-0 bottom-0 border-2 border-djcyan-400 bg-djcyan-500/20 backdrop-blur-[1px] pointer-events-none rounded shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-75"
                ></div>
                {/* Aguja de reproducción en minimapa */}
                <div 
                    style={{ left: `${playProgress * 100}%` }}
                    className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none z-10 shadow-[0_0_5px_#fff]"
                ></div>
            </div>

            {/* CONTENEDOR CON DESPLAZAMIENTO HORIZONTAL (SCROLL) DEL WAVEFORM AMPLIADO */}
            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="w-full overflow-x-auto overflow-y-hidden relative select-none custom-scrollbar rounded-lg border border-djzinc-800 bg-[#030306] shadow-xl"
                style={{ height: `${height}px` }}
            >
                <div 
                    style={{ width: `${totalWidth}px`, height: `${height}px`, position: "relative" }}
                    onMouseDown={handleCanvasMouseDown}
                    onClick={handleCanvasClick}
                >
                    <canvas 
                        ref={canvasRef} 
                        className="block cursor-crosshair"
                        style={{ width: `${totalWidth}px`, height: `${height}px` }}
                    />

                    {/* Bandera del Bombo 1.0.0 (Downbeat anclado al Beatgrid Rekordbox) */}
                    {downbeatPct !== null && (
                        <div 
                            style={{ left: `${downbeatPct}%` }}
                            className="absolute top-0 bottom-0 pointer-events-none z-15 flex flex-col items-center"
                        >
                            <div className="w-[1.5px] h-full bg-djcyan-400 shadow-[0_0_8px_#06b6d4]"></div>
                            <div className="absolute top-1 -translate-x-1/2 bg-djcyan-500 text-black font-mono font-bold text-[8px] px-1 py-0.5 rounded shadow">
                                1.0.0
                            </div>
                        </div>
                    )}

                    {/* AGUJA DE REPRODUCCIÓN (PLAYHEAD) */}
                    <div 
                        style={{ left: `${playProgress * 100}%` }}
                        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_12px_#fff,0_0_5px_#06b6d4] pointer-events-none z-20 flex flex-col items-center"
                    >
                        <div className="w-2.5 h-2.5 -ml-[1px] bg-white rotate-45 border border-djcyan-400 shadow-[0_0_6px_#06b6d4]"></div>
                    </div>

                    {/* PUNTOS HOT CUE ARRASTRABLES (1 AL 8) CON CLAVIJAS NUMERADAS Y RÓTULOS (IGNICIÓN 1 A 1) */}
                    {activeCues.map((cue, idx) => {
                        const padNum = cue.id !== undefined ? cue.id : (idx + 1);
                        const cuePct = cue.pct !== undefined ? (cue.pct * 100) : ((parseTimeToMs(cue.time || "0") / durMs) * 100);
                        const isSelected = (selectedCueId === padNum);
                        const color = cue.color || (NV2_COLORS[idx] ? NV2_COLORS[idx].color : '#ef4444');
                        const staggerDelay = `${idx * 110}ms`;

                        return (
                            <div
                                key={`${track?.id || 'trk'}_wave_cue_${idx}`}
                                style={{ 
                                    left: `${cuePct}%`,
                                    animation: 'cuePointCascadeBeam 0.65s cubic-bezier(0.16, 1, 0.3, 1) both',
                                    animationDelay: staggerDelay,
                                    '--cue-color': color
                                }}
                                onMouseDown={(e) => handleCueMouseDown(e, idx)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onSelectCue) onSelectCue(padNum);
                                    if (onSeekTrack && track) {
                                        const cuePctRatio = cue.pct !== undefined ? cue.pct : (parseTimeToMs(cue.time || '0') / durMs);
                                        const targetSec = (durMs * cuePctRatio) / 1000.0;
                                        onSeekTrack(track, cuePctRatio, true, targetSec);
                                    }
                                }}
                                className={`absolute top-0 bottom-0 z-20 flex flex-col items-center cursor-ew-resize group select-none transition-transform duration-75`}
                                title={`Hot Cue ${padNum}: ${cue.name || 'Cue'} (${cue.time || '00:00.00'}) - Arrastra para mover`}
                            >
                                {/* Línea vertical del Cue con halo y color del Pad */}
                                <div 
                                    className={`w-[2px] h-full transition-all ${isSelected ? 'w-[2.5px]' : 'opacity-85 group-hover:opacity-100'}`}
                                    style={{ 
                                        backgroundColor: color, 
                                        color: color,
                                        boxShadow: isSelected ? `0 0 16px ${color}, 0 0 6px #ffffff` : `0 0 8px ${color}80` 
                                    }}
                                ></div>

                                {/* Clavija superior de rendimiento DJ */}
                                <div 
                                    className={`absolute top-1 -translate-x-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-full font-mono text-[9px] font-bold text-white shadow-lg border cursor-ew-resize transition-all ${
                                        isSelected 
                                        ? 'scale-110 ring-2 ring-white shadow-[0_0_14px_rgba(255,255,255,0.9)]' 
                                        : 'opacity-90 group-hover:scale-105 group-hover:opacity-100'
                                    }`}
                                    style={{ 
                                        backgroundColor: color, 
                                        borderColor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.4)',
                                        boxShadow: `0 0 10px ${color}`
                                    }}
                                >
                                    <span>P{padNum}</span>
                                    {zoom >= 2 && <span className="text-[8px] opacity-90 truncate max-w-[50px]">{cue.short_name || cue.name || ''}</span>}
                                </div>

                                {/* Rótulo de tiempo inferior */}
                                <div className="absolute bottom-1 -translate-x-1/2 bg-black/85 px-1 py-0.2 rounded border border-djzinc-700 text-[8px] font-mono text-gray-300 pointer-events-none whitespace-nowrap shadow">
                                    {cue.time || "00:00.00"}
                                </div>
                            </div>
                        );
                    })}

                    {/* Tooltip flotante de arrastre en tiempo real */}
                    {dragInfo && (
                        <div 
                            className="absolute -top-7 -translate-x-1/2 bg-djzinc-900 text-white px-2 py-0.5 rounded border border-djcyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center gap-1.5 pointer-events-none z-30 whitespace-nowrap"
                            style={{ left: `${Math.min(92, Math.max(8, dragInfo.pct))}%` }}
                        >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeCues[dragInfo.idx]?.color || '#ef4444' }}></span>
                            <span className="text-[9px] font-mono font-bold text-white">Pad {activeCues[dragInfo.idx]?.id || (dragInfo.idx + 1)}:</span>
                            <span className="text-[9px] font-mono font-bold text-djcyan-400">{dragInfo.time}</span>
                            <span className="text-[8px] font-mono text-gray-300">({dragInfo.bar})</span>
                            {snapToGrid && <span className="text-[7px] font-bold text-emerald-400 uppercase bg-emerald-950/80 px-1 rounded">Snap</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

