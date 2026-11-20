const { useState, useEffect, useRef, useCallback } = React;
import { NV2_COLORS } from '../data/constants.js';
import { parseDurationMs, formatMsToTime, computeTrackStructuralBands } from './waveformUtils.js';

// Visualizador de Onda Rekordbox Pro con Separación de Componentes, Beatgrid y Arrastre de Hot Cues
export const RekordboxWaveform = ({ 
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
    onToggleSnap,
    onToggleGrid
}) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [draggingCueIdx, setDraggingCueIdx] = useState(null);
    const [dragInfo, setDragInfo] = useState(null);

    const rawId = track && track.id ? String(track.id) : "1";
    const seed = rawId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;
    const durMs = parseDurationMs(duration);
    const bpm = (track && (track.bpm || track.b)) ? Math.max(30.0, parseFloat(track.bpm || track.b) || 128.0) : 128.0;
    const beatMs = 60000.0 / bpm;
    const barMs = beatMs * 4.0;
    const downbeatMs = track && track.first_downbeat_ms ? parseFloat(track.first_downbeat_ms) : 0;
    const trimMs = track && track.trim_start_ms ? parseFloat(track.trim_start_ms) : 0;
    const trimEndMs = track && track.trim_end_ms ? parseFloat(track.trim_end_ms) : durMs;
    const downbeatPct = downbeatMs > 0 ? Math.max(0.4, Math.min(99.0, (downbeatMs / durMs) * 100)) : null;
    const trimPct = trimMs > 0 ? Math.max(0.2, Math.min(99.0, (trimMs / durMs) * 100)) : null;

    // Hot Cues dinámicos reales (Sparse Cues de 4 a 8 pads)
    const activeCues = (cues && Array.isArray(cues) && cues.length > 0)
        ? cues.filter(c => c && !c.is_empty && ((c.pos_ms !== undefined && c.pos_ms !== null) || (c.pct !== undefined && c.pct !== null)))
        : [];

    const handleCanvasClick = (e) => {
        if (!containerRef.current || !onSeekTrack || draggingCueIdx !== null) return;
        const rect = containerRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        onSeekTrack(track, pct, true);
    };

    const handleCueMouseDown = (e, idx) => {
        e.stopPropagation();
        e.preventDefault();
        setDraggingCueIdx(idx);
        if (onSelectCue && activeCues[idx]) {
            onSelectCue(activeCues[idx].id || (idx + 1));
        }
    };

    useEffect(() => {
        if (draggingCueIdx === null) return;

        const handleMouseMove = (e) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const rawPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
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
    }, [draggingCueIdx, durMs, downbeatMs, beatMs, barMs, snapToGrid, activeCues, onUpdateCues]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.parentElement.clientWidth || 340;
        const height = 114;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = "#030306";
        ctx.fillRect(0, 0, width, height);
        const centerY = height / 2;

        // 1. Renderizado de líneas del Beatgrid Rekordbox/Serato (anclado al Bombo 1.0.0)
        if (showBeatgrid && bpm >= 40.0) {
            // Forward from downbeat
            for (let t = downbeatMs; t <= durMs; t += beatMs) {
                const bx = (t / durMs) * width;
                if (bx < 0 || bx > width) continue;
                const bIdx = Math.round((t - downbeatMs) / beatMs);
                const isBar = (bIdx % 4 === 0);
                const isPhrase16 = (bIdx % 16 === 0);

                ctx.beginPath();
                if (isPhrase16) {
                    ctx.strokeStyle = "rgba(6, 182, 212, 0.45)"; // Cian de frase
                    ctx.lineWidth = 1.2;
                } else if (isBar) {
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)"; // Blanco nítido de compás
                    ctx.lineWidth = 1.0;
                } else {
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)"; // Tick de negra
                    ctx.lineWidth = 0.75;
                }
                ctx.moveTo(bx, 0);
                ctx.lineTo(bx, height);
                ctx.stroke();

                // Marca de acento superior de compás
                if (isBar) {
                    ctx.fillStyle = isPhrase16 ? "#06b6d4" : "rgba(255, 255, 255, 0.4)";
                    ctx.fillRect(bx - 0.5, 0, 1.5, 5);
                }
            }
            // Backward from downbeat
            for (let t = downbeatMs - beatMs; t >= 0; t -= beatMs) {
                const bx = (t / durMs) * width;
                if (bx < 0 || bx > width) continue;
                const bIdx = Math.round((t - downbeatMs) / beatMs);
                const isBar = (bIdx % 4 === 0);
                const isSilent = trimMs > 0 && t < trimMs;
                ctx.beginPath();
                ctx.strokeStyle = isSilent ? "rgba(255, 255, 255, 0.02)" : (isBar ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.05)");
                ctx.lineWidth = isBar ? 1.0 : 0.75;
                ctx.moveTo(bx, 0);
                ctx.lineTo(bx, height);
                ctx.stroke();
            }
        }

        // Sombreado de silencio inicial recortado
        if (trimMs > 0 && durMs > 0) {
            const trimX = (trimMs / durMs) * width;
            if (trimX > 0) {
                ctx.fillStyle = "rgba(239, 68, 68, 0.06)";
                ctx.fillRect(0, 0, trimX, height);
                ctx.strokeStyle = "rgba(239, 68, 68, 0.45)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(trimX, 0);
                ctx.lineTo(trimX, height);
                ctx.stroke();
            }
        }

        // 2. Renderizado estructural por capas de instrumentación (Bass, Drums, Vocales, Treble)
        for (let x = 0; x <= width; x += 1.5) {
            const xNorm = x / width;
            const { bass, drums, vocals, treble, isBreak } = computeTrackStructuralBands(xNorm, seed, track);

            // Sombreado de fondo para Parones (Breakdowns)
            if (isBreak) {
                ctx.fillStyle = "rgba(16, 185, 129, 0.07)";
                ctx.fillRect(x, 0, 1.5, height);
            }

            // Capa 1: Bajos (Azul Cobalto profundo de subwoofer)
            const hBass = (height * 0.44) * bass;
            ctx.fillStyle = isBreak ? "rgba(30, 58, 138, 0.20)" : "rgba(37, 99, 235, 0.88)";
            ctx.fillRect(x, centerY - hBass, 1.5, hBass * 2);

            // Capa 2: Drums / Cajas (Rojo bermellón de impacto rítmico)
            const hDrums = (height * 0.32) * drums;
            ctx.fillStyle = "rgba(239, 68, 68, 0.86)";
            ctx.fillRect(x, centerY - hDrums, 1.5, hDrums * 2);

            // Capa 3: Vocales & Sintetizadores (Verde en parones, Ámbar en frase)
            const hVocals = (height * 0.22) * vocals;
            ctx.fillStyle = isBreak ? "rgba(16, 185, 129, 0.95)" : "rgba(245, 158, 11, 0.88)";
            ctx.fillRect(x, centerY - hVocals, 1.5, hVocals * 2);

            // Capa 4: Agudos & Platos (Cian brillante)
            const hTreble = (height * 0.14) * treble;
            ctx.fillStyle = "rgba(34, 211, 238, 0.95)";
            ctx.fillRect(x, centerY - hTreble, 1.5, hTreble * 2);
        }

        // Línea central de referencia cero
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Cursor blanco de posición de reproducción
        if (playProgress > 0) {
            const px = width * Math.min(1, Math.max(0, playProgress));
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.moveTo(px, 0);
            ctx.lineTo(px, height);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }, [track, seed, playProgress, isCurrentPlaying, showBeatgrid, bpm, downbeatMs, durMs, beatMs]);

    return (
        <div className="flex flex-col gap-1 w-full bg-[#050508] p-2.5 rounded-lg border border-djzinc-800">
            <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 px-0.5">
                <div className="flex items-center gap-2">
                    <span className="text-djcyan-400 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-djcyan-400 animate-pulse"></span>
                        WAVEFORM & BEATGRID REKORDBOX
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono bg-djzinc-900 px-1.5 py-0.2 rounded border border-djzinc-750">
                        {bpm.toFixed(2)} BPM • Grid @ {Math.round(downbeatMs)}ms
                    </span>
                </div>
                <div className="flex items-center gap-2 text-[9px]">
                    <button
                        type="button"
                        onClick={onToggleGrid}
                        className={`px-1.5 py-0.5 rounded font-mono font-bold text-[8px] transition-colors border cursor-pointer ${showBeatgrid ? 'bg-djcyan-950 text-djcyan-400 border-djcyan-700' : 'bg-djzinc-900 text-gray-500 border-djzinc-800'}`}
                        title="Activar/Desactivar visualización de compases del Beatgrid"
                    >
                        {showBeatgrid ? '🔲 Grid: ON' : '🔳 Grid: OFF'}
                    </button>
                    <button
                        type="button"
                        onClick={onToggleSnap}
                        className={`px-1.5 py-0.5 rounded font-mono font-bold text-[8px] transition-colors border cursor-pointer ${snapToGrid ? 'bg-emerald-950 text-emerald-400 border-emerald-700' : 'bg-djzinc-900 text-gray-500 border-djzinc-800'}`}
                        title="Imantar / Snap magnético al compás al arrastrar cues"
                    >
                        {snapToGrid ? '🧲 Snap: ON' : '🧲 Snap: OFF'}
                    </button>
                    <span className="text-gray-400 font-mono ml-1">{duration}</span>
                </div>
            </div>

            <div 
                ref={containerRef}
                onClick={handleCanvasClick} 
                className="relative w-full h-[114px] bg-[#030306] rounded border border-djzinc-800/80 overflow-hidden cursor-pointer hover:border-djcyan-500/50 transition-colors select-none"
            >
                <canvas ref={canvasRef} style={{ width: "100%", height: "114px", display: "block" }} />
                
                {/* Marcador Zero-Crossing Trim */}
                {trimPct !== null && (
                    <div className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none z-20" style={{ left: `${trimPct}%` }}>
                        <div className="px-1 py-0.5 rounded-b text-[7px] font-mono font-black text-black bg-amber-400 flex items-center justify-center shadow">
                            TRIM
                        </div>
                        <div className="w-[1.5px] h-full bg-amber-400 opacity-90 shadow-[0_0_6px_rgba(251,191,36,0.9)]"></div>
                    </div>
                )}

                {/* Marcador Beatgrid 1.0.0 Downbeat */}
                {downbeatPct !== null && (
                    <div className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none z-20" style={{ left: `${downbeatPct}%` }}>
                        <div className="px-1 py-0.5 rounded-b text-[7px] font-mono font-black text-black bg-djcyan-400 flex items-center justify-center shadow">
                            1.0.0
                        </div>
                        <div className="w-[1.5px] h-full bg-djcyan-400 opacity-90 shadow-[0_0_6px_rgba(34,211,238,0.9)]"></div>
                    </div>
                )}

                {/* Marcadores Hot Cues interactivos arrastrables */}
                {activeCues.map((c, idx) => {
                    let leftPos = c.pct !== undefined ? (c.pct * 100) : Math.min(94, Math.max(4, (idx * 12.2) + 3));
                    if (idx === 0 && downbeatPct !== null && c.pct === undefined) {
                        leftPos = Math.min(94, Math.max(0.5, downbeatPct));
                    }
                    const isSelected = selectedCueId === (c.id || (idx + 1));
                    const isDragging = draggingCueIdx === idx;

                    return (
                        <div 
                            key={c.id || idx} 
                            className="absolute top-0 bottom-0 flex flex-col items-center z-30" 
                            style={{ left: `${leftPos}%`, transform: 'translateX(-50%)' }}
                        >
                            <div 
                                onMouseDown={(e) => handleCueMouseDown(e, idx)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onSelectCue) onSelectCue(c.id || (idx + 1));
                                }}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    if (onSeekTrack) onSeekTrack(track, c.pct !== undefined ? c.pct : (leftPos / 100), true);
                                }}
                                title={`Pad ${c.id || (idx + 1)}: ${c.name || 'Cue'} (${c.time || '00:00.0'}) • ${c.color || '#ef4444'}\nArrastra para mover en el Grid • Clic para editar • Doble clic para reproducir`}
                                className={`w-4 h-4 rounded-b text-[8px] font-mono font-black text-black flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing select-none transition-all ${isSelected ? 'ring-2 ring-white scale-125 z-40' : 'hover:scale-115'}`} 
                                style={{ backgroundColor: c.color || '#ef4444' }}
                            >
                                {c.id || (idx + 1)}
                            </div>
                            <div 
                                className={`w-[1.5px] h-full ${isSelected || isDragging ? 'opacity-100 shadow-[0_0_8px]' : 'opacity-65'}`} 
                                style={{ backgroundColor: c.color || '#ef4444', boxShadow: isSelected ? `0 0 8px ${c.color || '#ef4444'}` : undefined }}
                            ></div>
                        </div>
                    );
                })}

                {/* Tooltip de arrastre activo en tiempo real */}
                {dragInfo && (
                    <div 
                        className="absolute top-1 pointer-events-none z-50 px-2 py-0.5 bg-black/90 border border-djcyan-400 rounded shadow-xl text-center transform -translate-x-1/2 flex items-center gap-1.5"
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
    );
};

