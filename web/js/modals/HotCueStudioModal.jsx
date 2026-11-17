const { useState, useEffect, useRef, useCallback } = React;
import { Icons } from '../shell/icons.jsx';
import { NV2_COLORS, getValidCover } from '../data/constants.js';
import { ZoomableRekordboxWaveform, parseDurationMs, formatMsToTime } from '../waveforms/index.js';

// Modal de Estudio Completo de Hot Cues & Beatgrid Rekordbox con Reproductor Dedicado y Guardado por Pista
export const HotCueStudioModal = ({
    isOpen,
    onClose,
    track,
    cues = NV2_COLORS,
    duration = "05:00",
    onUpdateCues,
    selectedCueId = 1,
    onSelectCue,
    onPlayTrack,
    nowPlayingTrack,
    isPlaying = false,
    onTogglePlay,
    playProgress = 0,
    onGuardarTrack,
    saveFeedback = "",
    onAutoPhraseCues
}) => {
    if (!isOpen || !track) return null;

    // Hot Cues dinámicos reales (Sparse Cues de 4 a 8 pads)
    const activeCues = (cues && Array.isArray(cues) && cues.length > 0)
        ? cues.filter(c => c && !c.is_empty && ((c.pos_ms !== undefined && c.pos_ms !== null) || (c.pct !== undefined && c.pct !== null)))
        : [];
    const currentCue = activeCues.find(c => (c.id || 1) === selectedCueId) || activeCues[0] || {};
    const durMs = parseDurationMs(duration);
    const bpm = (track && (track.bpm || track.b)) ? Math.max(30.0, parseFloat(track.bpm || track.b) || 128.0) : 128.0;
    const beatMs = 60000.0 / bpm;
    const barMs = beatMs * 4.0;
    const downbeatMs = track && track.first_downbeat_ms ? parseFloat(track.first_downbeat_ms) : 0;
    const trimMs = track && track.trim_start_ms ? parseFloat(track.trim_start_ms) : 0;
    const trimEndMs = track && track.trim_end_ms ? parseFloat(track.trim_end_ms) : durMs;

    const [snapToGrid, setSnapToGrid] = useState(true);
    const [showBeatgrid, setShowBeatgrid] = useState(true);
    const [timeInputValue, setTimeInputValue] = useState(currentCue.time || "00:00.00");
    const [nameInputValue, setNameInputValue] = useState(currentCue.name || "");
    const [isSavingLocal, setIsSavingLocal] = useState(false);
    const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

    useEffect(() => {
        setTimeInputValue(currentCue.time || "00:00.00");
        setNameInputValue(currentCue.name || currentCue.short_name || `Cue ${currentCue.id || 1}`);
    }, [selectedCueId, currentCue.time, currentCue.name]);

    const updateSingleCue = (updatedFields) => {
        if (!onUpdateCues) return;
        const targetId = currentCue.id || 1;
        const newCues = activeCues.map((c, idx) => {
            const cid = c.id !== undefined ? c.id : (idx + 1);
            if (cid === targetId) {
                return { ...c, ...updatedFields };
            }
            return c;
        });
        onUpdateCues(newCues);
    };

    const handleTimeInputChange = (e) => {
        const val = e.target.value;
        setTimeInputValue(val);
        const ms = parseTimeToMs(val);
        const newPct = durMs > 0 ? Math.max(0, Math.min(1, ms / durMs)) : 0;
        const barNum = Math.max(1, Math.floor((ms - downbeatMs) / barMs) + 1);
        updateSingleCue({
            time: val,
            pos_ms: Math.round(ms),
            pct: newPct,
            bar: barNum,
            bar_str: `Bar ${barNum}`
        });
    };

    const handleNudge = (deltaMs) => {
        const curMs = currentCue.pos_ms !== undefined ? currentCue.pos_ms : parseTimeToMs(currentCue.time || "00:00.00");
        const nextMs = Math.max(0, Math.min(durMs, curMs + deltaMs));
        const newPct = durMs > 0 ? (nextMs / durMs) : 0;
        const formattedTime = formatMsToTime(nextMs);
        const barNum = Math.max(1, Math.floor((nextMs - downbeatMs) / barMs) + 1);
        setTimeInputValue(formattedTime);
        updateSingleCue({
            pos_ms: Math.round(nextMs),
            time: formattedTime,
            pct: newPct,
            bar: barNum,
            bar_str: `Bar ${barNum}`
        });
    };

    const handleSnapCurrentCue = () => {
        const curMs = currentCue.pos_ms !== undefined ? currentCue.pos_ms : parseTimeToMs(currentCue.time || "00:00.00");
        const beatOffset = Math.round((curMs - downbeatMs) / beatMs);
        const snappedMs = Math.max(0, Math.min(durMs, downbeatMs + (beatOffset * beatMs)));
        const newPct = durMs > 0 ? (snappedMs / durMs) : 0;
        const formattedTime = formatMsToTime(snappedMs);
        const barNum = Math.max(1, Math.floor((snappedMs - downbeatMs) / barMs) + 1);
        setTimeInputValue(formattedTime);
        updateSingleCue({
            pos_ms: Math.round(snappedMs),
            time: formattedTime,
            pct: newPct,
            bar: barNum,
            bar_str: `Bar ${barNum}`
        });
    };

    const handleSetToPlayhead = () => {
        const playheadMs = Math.max(0, Math.min(durMs, playProgress * durMs));
        let targetMs = playheadMs;
        if (snapToGrid) {
            const beatOffset = Math.round((playheadMs - downbeatMs) / beatMs);
            targetMs = Math.max(0, Math.min(durMs, downbeatMs + (beatOffset * beatMs)));
        }
        const newPct = durMs > 0 ? (targetMs / durMs) : 0;
        const formattedTime = formatMsToTime(targetMs);
        const barNum = Math.max(1, Math.floor((targetMs - downbeatMs) / barMs) + 1);
        setTimeInputValue(formattedTime);
        updateSingleCue({
            pos_ms: Math.round(targetMs),
            time: formattedTime,
            pct: newPct,
            bar: barNum,
            bar_str: `Bar ${barNum}`
        });
    };

    const handleSaveTrackInternal = async () => {
        setIsSavingLocal(true);
        try {
            if (onGuardarTrack) {
                await onGuardarTrack();
                setSaveSuccessMsg("✓ Guardado en disco con éxito");
                setTimeout(() => setSaveSuccessMsg(""), 3500);
            }
        } finally {
            setIsSavingLocal(false);
        }
    };

    const handlePreviousCue = () => {
        const currentIdx = activeCues.findIndex(c => (c.id || 1) === (currentCue.id || 1));
        const prevIdx = currentIdx > 0 ? currentIdx - 1 : activeCues.length - 1;
        const targetCue = activeCues[prevIdx];
        if (targetCue && onSelectCue) {
            onSelectCue(targetCue.id || (prevIdx + 1));
            if (onPlayTrack) onPlayTrack(track, targetCue.pct !== undefined ? targetCue.pct : 0, true);
        }
    };

    const handleNextCue = () => {
        const currentIdx = activeCues.findIndex(c => (c.id || 1) === (currentCue.id || 1));
        const nextIdx = currentIdx < activeCues.length - 1 ? currentIdx + 1 : 0;
        const targetCue = activeCues[nextIdx];
        if (targetCue && onSelectCue) {
            onSelectCue(targetCue.id || (nextIdx + 1));
            if (onPlayTrack) onPlayTrack(track, targetCue.pct !== undefined ? targetCue.pct : 0, true);
        }
    };

    const isThisTrackPlaying = isPlaying && nowPlayingTrack && (String(nowPlayingTrack.id) === String(track.id) || nowPlayingTrack.path === track.path || nowPlayingTrack.f === track.f);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-6xl max-h-[95vh] bg-[#09090e] border border-djcyan-500/40 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden text-gray-200">
                {/* Cabecera del Estudio */}
                <div className="px-5 py-3.5 bg-djzinc-950 border-b border-djzinc-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <img 
                            src={getValidCover(track.cover || (track.path ? `/cover?path=${encodeURIComponent(track.path)}` : null))} 
                            alt="Cover" 
                            className="w-12 h-12 rounded border border-djzinc-700 object-cover shrink-0 shadow"
                        />
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-sm sm:text-base text-white truncate max-w-md" title={track.t || track.title}>
                                    {track.t || track.title || 'Pista de Audio'}
                                </h3>
                                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-djcyan-950 text-djcyan-400 border border-djcyan-800">
                                    {track.format || 'FLAC'}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                                    {track.k || track.key || '8A'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 truncate max-w-sm">
                                {track.a || track.artist || '--'} • <span className="text-gray-500 font-mono">{track.album || '--'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Estado y Guardado Pista por Pista */}
                        {saveSuccessMsg ? (
                            <span className="text-xs font-mono font-bold text-djgreen-400 bg-djgreen-950/80 px-3 py-1 rounded border border-djgreen-700 animate-pulse">
                                {saveSuccessMsg}
                            </span>
                        ) : saveFeedback ? (
                            <span className="text-xs font-mono font-bold text-djgreen-400 bg-djgreen-950/80 px-3 py-1 rounded border border-djgreen-700 animate-pulse">
                                {saveFeedback}
                            </span>
                        ) : null}

                        <button
                            type="button"
                            onClick={handleSaveTrackInternal}
                            disabled={isSavingLocal}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-djgreen-950 hover:bg-djgreen-900 text-djgreen-400 hover:text-white border border-djgreen-700/80 rounded-lg font-mono font-bold text-xs cursor-pointer shadow-lg active:scale-95 transition-all"
                            title="Guardar metadatos, tags y cues directamente en el archivo en disco"
                        >
                            <Icons.Save size={14} className="inline-block align-[-2px]" />
                            <span>{isSavingLocal ? 'Guardando...' : 'Guardar Pista en Disco'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-djzinc-900 hover:bg-djzinc-800 text-gray-400 hover:text-white flex items-center justify-center font-bold text-sm border border-djzinc-750 transition-colors cursor-pointer"
                            title="Cerrar estudio"
                        >
                            <Icons.Close size={14} className="inline-block align-[-2px]" />
                        </button>
                    </div>
                </div>

                {/* Contenido del Estudio (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    {/* Reproductor de Audio y Deck de Transporte */}
                    <div className="p-3 bg-djzinc-950/90 rounded-lg border border-djzinc-800 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    if (isThisTrackPlaying) {
                                        onTogglePlay && onTogglePlay();
                                    } else {
                                        onPlayTrack && onPlayTrack(track, 0, true);
                                    }
                                }}
                                className="px-4 py-2 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-black text-xs rounded-lg shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                {isThisTrackPlaying ? '❚❚ PAUSAR' : '▶ REPRODUCIR'}
                            </button>
                            <button
                                type="button"
                                onClick={handlePreviousCue}
                                className="px-2.5 py-1.5 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 font-mono text-xs rounded border border-djzinc-750 cursor-pointer shadow transition-colors"
                                title="Saltar al Cue anterior"
                            >
                                ⏮ Cue Anterior
                            </button>
                            <button
                                type="button"
                                onClick={handleNextCue}
                                className="px-2.5 py-1.5 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 font-mono text-xs rounded border border-djzinc-750 cursor-pointer shadow transition-colors"
                                title="Saltar al siguiente Cue"
                            >
                                Siguiente Cue ⏭
                            </button>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono">
                            <div className="bg-[#050508] px-3 py-1.5 rounded border border-djzinc-800 flex items-center gap-2">
                                <span className="text-gray-400">Posición:</span>
                                <span className="text-djcyan-400 font-bold">{formatMsToTime(playProgress * durMs)}</span>
                                <span className="text-gray-600">/</span>
                                <span className="text-gray-300">{duration}</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleSetToPlayhead}
                                className="px-3 py-1.5 bg-djcyan-950 hover:bg-djcyan-900 text-djcyan-400 border border-djcyan-700/60 rounded font-mono font-bold text-xs cursor-pointer shadow active:scale-95 transition-all"
                                title="Fijar el cue seleccionado exactamente en la posición actual del playhead"
                            >
                                <Icons.Pin size={14} className="inline-block align-[-2px]" /> Posicionar Pad {currentCue.id || 1} en Playhead
                            </button>
                        </div>
                    </div>

                    {/* Forma de Onda Expandida y Beatgrid */}
                    <div>
                        <RekordboxWaveform 
                            track={track} 
                            cues={activeCues} 
                            duration={duration} 
                            onSeekTrack={onPlayTrack}
                            playProgress={isThisTrackPlaying ? playProgress : 0}
                            isCurrentPlaying={isThisTrackPlaying}
                            onUpdateCues={onUpdateCues}
                            selectedCueId={selectedCueId}
                            onSelectCue={onSelectCue}
                            snapToGrid={snapToGrid}
                            showBeatgrid={showBeatgrid}
                            onToggleSnap={() => setSnapToGrid(prev => !prev)}
                            onToggleGrid={() => setShowBeatgrid(prev => !prev)}
                        />
                    </div>

                    {/* Códigos de Color de la Forma de Onda y Pads */}
                    <div className="bg-[#05050a] p-3 rounded-lg border border-djzinc-800 space-y-2">
                        <div className="flex justify-between items-center text-xs font-mono font-bold">
                            <span className="text-gray-300 flex items-center gap-1.5">
                                <Icons.Wand size={14} className="inline-block align-[-2px]" />
                                <span>CÓDIGOS DE COLOR DE FORMA DE ONDA & BANDA ESPECTRAL</span>
                            </span>
                            <span className="text-[10px] text-gray-500">Pioneer DJ RGB Multi-Frequency Standard</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                            {WAVEFORM_COLOR_LEGEND.map(stem => (
                                <div key={stem.name} className="flex items-center gap-2 p-2 rounded bg-djzinc-900/80 border border-djzinc-800" title={stem.desc}>
                                    <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-md" style={{ backgroundColor: stem.color }}></span>
                                    <div className="min-w-0">
                                        <span className={`font-bold block truncate ${stem.text}`}>{stem.name}</span>
                                        <span className="text-gray-400 text-[10px]">{stem.hex} • {stem.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Matriz 8 Pads DJ Profesional */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-mono px-1">
                            <span className="font-bold text-gray-300 uppercase">
                                8 HOT CUES PERFORMANCE (Pioneer DJ / Numark NV2)
                            </span>
                            <span className="text-gray-400 text-[11px]">
                                Clic en Pad para seleccionar y editar • Botón ▶ para pre-escucha instantánea
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {activeCues.map((c, idx) => {
                                const cueId = c.id !== undefined ? c.id : (idx + 1);
                                const isSelected = selectedCueId === cueId;
                                const cuePct = c.pct !== undefined ? c.pct : ((idx * 0.12) + 0.02);

                                return (
                                    <div
                                        key={cueId}
                                        onClick={() => onSelectCue && onSelectCue(cueId)}
                                        className={`ws-pad p-3 pt-3.5 cursor-pointer select-none group ${isSelected ? 'ws-pad-on' : (c.time !== undefined && c.time !== null ? 'ws-pad-set' : '')}`}
                                        style={{ '--pad-color': c.color || '#22d3ee' }}
                                    >
                                        <div className="flex justify-between items-center mb-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <span 
                                                    className="text-[10px] font-mono font-black px-2 py-0.5 rounded text-black shadow"
                                                    style={{ backgroundColor: c.color || '#ef4444' }}
                                                >
                                                    PAD {cueId}
                                                </span>
                                                <span className="text-[9px] font-mono font-semibold text-gray-400">
                                                    {c.color || '#ef4444'}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onPlayTrack) onPlayTrack(track, cuePct, true);
                                                }}
                                                className="w-6 h-6 rounded-md bg-djzinc-950 hover:bg-djcyan-500 hover:text-black text-djcyan-400 flex items-center justify-center text-xs font-bold border border-djzinc-700 transition-colors shadow"
                                                title={`Reproducir desde ${c.time || '00:00.0'}`}
                                            >
                                                <Icons.Play size={14} className="inline-block align-[-2px]" />
                                            </button>
                                        </div>
                                        <span className={`text-xs font-bold truncate ${c.text || 'text-gray-100'}`}>
                                            {c.short_name || c.name || `Cue ${cueId}`}
                                        </span>
                                        <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 mt-2 pt-1.5 border-t border-djzinc-800">
                                            <span className="text-gray-200 font-bold">{c.time || '00:00.0'}</span>
                                            <span className="text-gray-400">{c.bar_str || `Bar ${c.bar || ((idx * 16) + 1)}`}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Deck de Edición Detallada del Pad Seleccionado */}
                    <div className="bg-djzinc-950 p-4 rounded-xl border border-djcyan-500/30 space-y-3">
                        <div className="flex flex-wrap justify-between items-center border-b border-djzinc-850 pb-2.5 gap-2">
                            <div className="flex items-center gap-2">
                                <span 
                                    className="px-2.5 py-1 rounded text-xs font-black font-mono text-black shadow-md" 
                                    style={{ backgroundColor: currentCue.color || '#ef4444' }}
                                >
                                    PAD {currentCue.id || 1}
                                </span>
                                <span className="font-extrabold text-white text-sm">
                                    Editando: <span className="text-djcyan-400">{currentCue.name || `Cue ${currentCue.id || 1}`}</span>
                                </span>
                                <span className="text-xs font-mono text-gray-400">
                                    ({currentCue.color || '#ef4444'})
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleSetToPlayhead}
                                    className="px-2.5 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-200 text-xs font-mono rounded border border-djzinc-700 cursor-pointer shadow active:scale-95 transition-colors"
                                    title="Mover este cue a la posición actual de reproducción"
                                >
                                    <Icons.Pin size={14} className="inline-block align-[-2px]" /> Fijar en Playhead
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSnapCurrentCue}
                                    className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 text-xs font-mono rounded border border-emerald-800 cursor-pointer shadow active:scale-95 transition-colors"
                                    title="Alinear al beatgrid más próximo"
                                >
                                    <Icons.Link size={14} className="inline-block align-[-2px]" /> Snap a Beat
                                </button>
                            </div>
                        </div>

                        {/* Entradas de Tiempo y Nombre */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <div className="flex justify-between items-center text-xs font-mono text-gray-400 mb-1">
                                    <span className="font-semibold text-gray-300">TIEMPO EXACTO (mm:ss.ms)</span>
                                    <span className="text-gray-400 font-mono">{currentCue.pos_ms || 0} ms</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="text"
                                        value={timeInputValue}
                                        onChange={handleTimeInputChange}
                                        placeholder="00:00.00"
                                        className="w-full bg-[#050508] border border-djzinc-700 focus:border-djcyan-400 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-djcyan-300 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const cuePct = currentCue.pct !== undefined ? currentCue.pct : 0;
                                            if (onPlayTrack) onPlayTrack(track, cuePct, true);
                                        }}
                                        className="px-3 py-1.5 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-bold text-xs rounded-lg cursor-pointer shadow shrink-0"
                                        title="Audicionar este punto de cue"
                                    >
                                        <Icons.Play size={14} className="inline-block align-[-2px]" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center text-xs font-mono text-gray-400 mb-1">
                                    <span className="font-semibold text-gray-300">NOMBRE DEL CUE / FRASE</span>
                                    <span className="text-gray-400">{currentCue.bar_str || 'Bar 1'}</span>
                                </div>
                                <input
                                    type="text"
                                    value={nameInputValue}
                                    onChange={(e) => {
                                        setNameInputValue(e.target.value);
                                        updateSingleCue({ name: e.target.value, short_name: e.target.value });
                                    }}
                                    placeholder="Nombre táctico del cue..."
                                    className="w-full bg-[#050508] border border-djzinc-700 focus:border-djcyan-400 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-200 outline-none"
                                />
                            </div>
                        </div>

                        {/* Nudge y Presets */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-djzinc-850">
                            <div className="flex items-center gap-1.5 text-xs font-mono">
                                <span className="text-gray-400 mr-1">Micro-Ajuste:</span>
                                <button
                                    type="button"
                                    onClick={() => handleNudge(-barMs)}
                                    className="px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95"
                                    title="Retroceder 1 compás (4 beats)"
                                >
                                    ◀◀ -1 Compás
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleNudge(-beatMs)}
                                    className="px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95"
                                    title="Retroceder 1 beat"
                                >
                                    ◀ -1 Beat
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleNudge(-10)}
                                    className="px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95"
                                    title="Retroceder 10ms"
                                >
                                    -10ms
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleNudge(10)}
                                    className="px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95"
                                    title="Avanzar 10ms"
                                >
                                    +10ms
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleNudge(beatMs)}
                                    className="px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95"
                                    title="Avanzar 1 beat"
                                >
                                    +1 Beat ▶
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleNudge(barMs)}
                                    className="px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95"
                                    title="Avanzar 1 compás (4 beats)"
                                >
                                    +1 Compás ▶▶
                                </button>
                            </div>

                            <div className="flex items-center gap-1 text-[10px] font-mono">
                                <span className="text-gray-400 mr-1">Presets:</span>
                                {['Kick', 'Hi-Hats', 'Bass', 'Break', 'Drop 1', 'Drop 2', 'Outro'].map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => {
                                            setNameInputValue(p);
                                            updateSingleCue({ name: p, short_name: p });
                                        }}
                                        className="px-1.5 py-0.5 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-750 cursor-pointer transition-colors"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Paleta de Color RGB con Códigos HEX */}
                        <div className="pt-2 border-t border-djzinc-850">
                            <div className="flex justify-between items-center text-xs font-mono text-gray-400 mb-1.5">
                                <span className="font-semibold text-gray-300">ASIGNAR COLOR DE PAD (PIONEER DJ / NUMARK RGB)</span>
                                <span>Actual: <span className="font-mono text-white font-bold">{currentCue.color || '#ef4444'}</span></span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {DJ_PAD_PALETTE.map(pal => {
                                    const isCurrentColor = (currentCue.color || '#ef4444').toLowerCase() === pal.color.toLowerCase();
                                    return (
                                        <button
                                            key={pal.color}
                                            type="button"
                                            onClick={() => {
                                                updateSingleCue({
                                                    color: pal.color,
                                                    hex: pal.hex,
                                                    rgb: pal.rgb,
                                                    text: pal.text,
                                                    border: pal.border,
                                                    bg: pal.bg
                                                });
                                            }}
                                            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                                                isCurrentColor 
                                                    ? 'ring-2 ring-white border-white scale-105 shadow-md bg-djzinc-800' 
                                                    : 'bg-djzinc-900 border-djzinc-750 hover:border-gray-500'
                                            }`}
                                            title={`${pal.name} • ${pal.hex}`}
                                        >
                                            <span className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: pal.color }}></span>
                                            <span className="text-gray-200">{pal.hex}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pie del Estudio con Botón de Guardado Pista por Pista */}
                <div className="px-5 py-3.5 bg-djzinc-950 border-t border-djzinc-800 flex items-center justify-between shrink-0">
                    <span className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-djcyan-400"></span>
                        Estudio sincronizado con Serato Markers2 & BeatGrid oficial.
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 font-mono text-xs rounded-lg border border-djzinc-750 cursor-pointer transition-colors"
                        >
                            Cerrar
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveTrackInternal}
                            disabled={isSavingLocal}
                            className="px-4 py-2 bg-djgreen-950 hover:bg-djgreen-900 text-djgreen-400 hover:text-white border border-djgreen-700/80 rounded-lg font-mono font-bold text-xs cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
                        >
                            <Icons.Save size={14} className="inline-block align-[-2px]" />
                            <span>{isSavingLocal ? 'Guardando en Archivo...' : 'Guardar Pista en Fichero'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

