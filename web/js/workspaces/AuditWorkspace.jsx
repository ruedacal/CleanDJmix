const { useState, useEffect, useRef, useCallback, useMemo } = React;
import { Icons, PlatformRekordboxLogo, PlatformSeratoLogo, PlatformTraktorLogo, PlatformVirtualDjLogo } from '../shell/icons.jsx';
import { apiClient } from '../services/apiClient.js';
import { 
    TableHarmonicWaveform, 
    CopilotSeratoWaveform, 
    formatMsToTime, 
    parseDurationMs, 
    parseTimeToMs, 
    parseDurationToSeconds, 
    computeTrackStructuralBands, 
    WAVEFORM_COLOR_LEGEND, 
    DJ_PAD_PALETTE 
} from '../waveforms/index.js';
import { 
    DEFAULT_VINYL_SVG, 
    getValidCover, 
    NV2_COLORS, 
    CAMELOT_TO_MUSICAL, 
    getHarmonicKeyDisplay 
} from '../data/constants.js';
import { 
    CAMELOT_WHEEL_DATA, 
    TAXONOMY_TREE, 
    DJ_GENRES_LIST, 
    DJ_VERSIONS_LIST, 
    DJ_MOODS_LIST, 
    parseAIDJQuery 
} from '../data/djCatalog.js';
import { useVirtualRows, useDrawerResize } from '../shell/hooks.js';
import { 
    CamelotWheelModal, 
    BatchAuditorModal, 
    DuplicateComparisonModal, 
    HotCueStudioModal,
    UnifiedLibraryBrowserModal
} from '../modals/index.js';
import { 
    SectionTitle, 
    InfoTip, 
    RotaryKnob, 
    getAudioEQNodes, 
    WsButton, 
    ToolbarDivider, 
    ExportMenu, 
    AddToCollectionMenu, 
    FilterMenu, 
    IngestDropzone, 
    CamelotKeyBadge 
} from '../shell/workspace-ui.jsx';

// Resumen Compacto y Elegante de los 8 Hot Cues para la columna derecha de Auditoría
const CompactHotCuesSummary = ({ track, cues = NV2_COLORS, onOpenStudio, onSelectCue, selectedCueId = 1, t = (k) => k }) => {
    // Hot Cues dinámicos reales (Sparse Cues de 4 a 8 pads)
    const activeCues = (cues && Array.isArray(cues) && cues.length > 0)
        ? cues.filter(c => c && !c.is_empty && ((c.pos_ms !== undefined && c.pos_ms !== null) || (c.pct !== undefined && c.pct !== null)))
        : [];
    return (
        <div className="bg-djzinc-950/90 border border-djzinc-800 rounded-lg p-2.5 flex flex-col gap-2 shadow-md">
            <div className="flex items-center justify-between border-b border-djzinc-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-djcyan-400 shadow-[0_0_6px_#06b6d4]"></span>
                    <span className="text-[10px] font-bold text-djcyan-300 uppercase tracking-wider font-mono">
                        8 Hot Cues (Resumen)
                    </span>
                </div>
                {onOpenStudio && (
                    <button
                        type="button"
                        onClick={onOpenStudio}
                        className="px-2 py-0.5 text-[9px] font-mono font-bold bg-djcyan-500/20 hover:bg-djcyan-500 text-djcyan-300 hover:text-black rounded border border-djcyan-500/40 cursor-pointer shadow transition-all flex items-center gap-1 active:scale-95 group"
                        title="Abrir en el Estudio Completo de Hot Cues con Waveform Ampliado y Scroll Horizontal"
                    >
                        <span><Icons.Sliders size={14} className="inline-block align-[-2px]" /> Abrir Estudio</span>
                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </button>
                )}
            </div>

            {/* Grid 4x2 compacto de los 8 pads con sus tiempos */}
            <div className="grid grid-cols-2 gap-1.5">
                {activeCues.slice(0, 8).map((cue, idx) => {
                    const padNum = cue.id !== undefined ? cue.id : (idx + 1);
                    const color = cue.color || (NV2_COLORS[idx] ? NV2_COLORS[idx].color : '#06b6d4');
                    const isSelected = (selectedCueId === padNum);
                    return (
                        <div
                            key={idx}
                            onClick={() => onSelectCue && onSelectCue(padNum)}
                            className={`flex items-center justify-between p-1.5 rounded border text-[10px] font-mono cursor-pointer transition-all ${
                                isSelected 
                                ? 'bg-djzinc-850 border-djcyan-500/80 shadow-[0_0_8px_rgba(6,182,212,0.3)]' 
                                : 'bg-djzinc-900/60 border-djzinc-800/80 hover:border-djzinc-700 hover:bg-djzinc-850/60'
                            }`}
                        >
                            <div className="flex items-center gap-1.5 truncate">
                                <span 
                                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                    style={{ backgroundColor: color }}
                                ></span>
                                <span className="font-bold text-gray-300 truncate max-w-[70px]">
                                    P{padNum} {cue.short_name || cue.name || `Cue ${padNum}`}
                                </span>
                            </div>
                            <span className="text-djcyan-400 font-mono text-[9px] shrink-0 font-semibold ml-1">
                                {cue.time || "00:00.00"}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Panel interactivo de edición de Hot Cues con códigos de color de forma de onda y beatgrid
const HotCueEditorPanel = ({
    track,
    cues = NV2_COLORS,
    duration = "05:00",
    onUpdateCues,
    selectedCueId = 1,
    onSelectCue,
    onPlayTrack,
    onAutoPhraseCues,
    snapToGrid = true,
    onToggleSnap,
    playProgress = 0,
    onGuardarTrack,
    onOpenStudio
}) => {
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

    const [timeInputValue, setTimeInputValue] = useState(currentCue.time || "00:00.00");
    const [nameInputValue, setNameInputValue] = useState(currentCue.name || "");

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

    const handleNameChange = (newName) => {
        setNameInputValue(newName);
        updateSingleCue({
            name: newName,
            short_name: newName
        });
    };

    const handleColorChange = (paletteItem) => {
        updateSingleCue({
            color: paletteItem.color,
            hex: paletteItem.hex,
            rgb: paletteItem.rgb,
            text: paletteItem.text,
            border: paletteItem.border,
            bg: paletteItem.bg
        });
    };

    return (
        <div className="flex flex-col gap-3 bg-djzinc-900/60 p-3 rounded-lg border border-djzinc-800">
            {/* Botón de apertura a pantalla completa con Reproductor */}
            {onOpenStudio && (
                <button
                    type="button"
                    onClick={onOpenStudio}
                    className="w-full py-2 px-3 bg-gradient-to-r from-blue-950 via-djzinc-900 to-indigo-950 hover:from-blue-900 hover:to-indigo-900 border border-djcyan-500/50 hover:border-djcyan-400 rounded-lg text-xs font-mono font-bold text-djcyan-300 flex items-center justify-between shadow-lg active:scale-[0.99] transition-all cursor-pointer group"
                    title="Abrir estudio completo de Hot Cues a pantalla completa con reproductor y guardado por pista"
                >
                    <div className="flex items-center gap-2">
                        <Icons.Sliders size={14} className="inline-block align-[-2px]" />
                        <span>ESTUDIO COMPLETO DE HOT CUES</span>
                    </div>
                    <span className="text-[10px] font-mono bg-djcyan-500/20 text-djcyan-300 px-2 py-0.5 rounded border border-djcyan-500/40 group-hover:bg-djcyan-500 group-hover:text-black transition-colors">
                        ⛶ Pantalla Completa
                    </span>
                </button>
            )}

            {/* Cabecera del Editor */}
            <div className="flex items-center justify-between border-b border-djzinc-800 pb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-djcyan-400 uppercase tracking-wide flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-djcyan-400"></span>
                        8 HOT CUES & BEATGRID (NUMARK NV2 / PIONEER RGB)
                    </span>
                    <InfoTip title="Hot Cues & Beatgrid" text="Editor táctico de los 8 pads RGB sincronizados al Beatgrid Rekordbox/Serato. Arrastra los marcadores en la onda, escribe el tiempo exacto en milisegundos y asigna colores estándar." />
                </div>
                <div className="flex items-center gap-1.5">
                    {onOpenStudio && (
                        <button
                            type="button"
                            onClick={onOpenStudio}
                            className="px-2 py-1 text-[9px] font-mono font-bold bg-djcyan-950 hover:bg-djcyan-900 text-djcyan-400 rounded border border-djcyan-700/60 cursor-pointer shadow active:scale-95 transition-all"
                            title="Abrir modal espacioso con reproductor y guardado por pista"
                        >
                            ⛶ Estudio
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onAutoPhraseCues}
                        className="px-2 py-1 text-[9px] font-mono font-bold bg-djcyan-500/20 hover:bg-djcyan-500/30 text-djcyan-400 rounded border border-djcyan-500/40 cursor-pointer shadow active:scale-95 transition-all"
                        title="Auto-calcular 8 Hot Cues por frases musicales (16/32 compases) anclados al Beatgrid 1.0.0"
                    >
                        <Icons.Zap size={14} className="inline-block align-[-2px]" /> Auto-Frasear 16/32b
                    </button>
                    {onGuardarTrack && (
                        <button
                            type="button"
                            onClick={onGuardarTrack}
                            className="px-2 py-1 text-[9px] font-mono font-bold bg-djgreen-950 hover:bg-djgreen-900 text-djgreen-400 rounded border border-djgreen-700/60 cursor-pointer shadow active:scale-95 transition-all"
                            title="Guardar cues modificados en archivo de disco"
                        >
                            <Icons.Save size={14} className="inline-block align-[-2px]" /> Guardar
                        </button>
                    )}
                </div>
            </div>

            {/* CÓDIGOS DE COLOR DE FORMA DE ONDA & PADS */}
            <div className="bg-[#040407] p-2 rounded border border-djzinc-800/80 space-y-1.5">
                <div className="flex justify-between items-center text-[9px] font-mono font-bold text-gray-400">
                    <span className="text-gray-300 flex items-center gap-1">
                        <Icons.Wand size={14} className="inline-block align-[-2px]" /> CÓDIGOS DE COLOR DE FORMA DE ONDA (FRECUENCIAS)
                    </span>
                    <span className="text-[8px] text-gray-400">Pioneer DJ RGB Standard</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-[8px] font-mono">
                    {WAVEFORM_COLOR_LEGEND.map(stem => (
                        <div key={stem.name} className="flex items-center gap-1.5 p-1 rounded bg-djzinc-900 border border-djzinc-800" title={stem.desc}>
                            <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow" style={{ backgroundColor: stem.color }}></span>
                            <div className="min-w-0">
                                <span className={`font-bold block truncate ${stem.text}`}>{stem.name}</span>
                                <span className="text-gray-400 text-[7px]">{stem.hex}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Matriz de los 8 Pads Numark NV2 / Pioneer DJ */}
            <div>
                <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 mb-1 px-0.5">
                    <span className="font-semibold text-gray-300">PADS 1 - 8 (Clic para editar • ▶ para reproducir)</span>
                    <span className="text-[9px] text-djcyan-400">Imantación al Grid: {snapToGrid ? 'ACTIVA' : 'LIBRE'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {activeCues.map((c, idx) => {
                        const cueId = c.id !== undefined ? c.id : (idx + 1);
                        const isSelected = selectedCueId === cueId;
                        const cuePct = c.pct !== undefined ? c.pct : ((idx * 0.12) + 0.02);

                        return (
                            <div
                                key={cueId}
                                onClick={() => onSelectCue && onSelectCue(cueId)}
                                className={`ws-pad p-2 pt-2.5 cursor-pointer select-none group ${isSelected ? 'ws-pad-on' : (c.time !== undefined && c.time !== null ? 'ws-pad-set' : '')}`}
                                style={{ '--pad-color': c.color || '#22d3ee' }}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-1">
                                        <span 
                                            className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded text-black shadow-sm"
                                            style={{ backgroundColor: c.color || '#ef4444' }}
                                        >
                                            PAD {cueId}
                                        </span>
                                        <span className="text-[7px] font-mono text-gray-400">
                                            {c.color || '#ef4444'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onPlayTrack) onPlayTrack(track, cuePct, true);
                                        }}
                                        className="w-4 h-4 rounded bg-djzinc-900 hover:bg-djcyan-500 hover:text-black text-djcyan-400 flex items-center justify-center text-[8px] font-bold border border-djzinc-700 transition-colors shadow"
                                        title={`Reproducir desde ${c.time || '00:00.0'}`}
                                    >
                                        <Icons.Play size={14} className="inline-block align-[-2px]" />
                                    </button>
                                </div>
                                <span className={`text-[10px] font-bold truncate ${c.text || 'text-gray-200'}`}>
                                    {c.short_name || c.name || `Cue ${cueId}`}
                                </span>
                                <div className="flex justify-between items-center text-[8px] font-mono text-gray-400 mt-1 pt-1 border-t border-djzinc-800">
                                    <span className="text-gray-300 font-semibold">{c.time || '00:00.0'}</span>
                                    <span>{c.bar_str || `Bar ${c.bar || ((idx * 16) + 1)}`}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* EDITOR DETALLADO DEL PAD SELECCIONADO */}
            <div className="bg-[#050509] p-2.5 rounded border border-djcyan-500/30 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono border-b border-djzinc-800 pb-1.5">
                    <div className="flex items-center gap-2">
                        <span 
                            className="px-2 py-0.5 rounded text-[9px] font-black font-mono text-black shadow" 
                            style={{ backgroundColor: currentCue.color || '#ef4444' }}
                        >
                            PAD {currentCue.id || 1}
                        </span>
                        <span className="font-bold text-gray-200">
                            Editando: <span className="text-djcyan-400">{currentCue.name || `Cue ${currentCue.id || 1}`}</span>
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono">
                            ({currentCue.color || '#ef4444'})
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={handleSetToPlayhead}
                            className="px-2 py-0.5 bg-djzinc-850 hover:bg-djzinc-750 text-gray-200 text-[8px] font-mono rounded border border-djzinc-700 cursor-pointer shadow active:scale-95 transition-colors"
                            title="Mover este cue a la posición actual de reproducción"
                        >
                            <Icons.Pin size={14} className="inline-block align-[-2px]" /> Fijar en Playhead
                        </button>
                        <button
                            type="button"
                            onClick={handleSnapCurrentCue}
                            className="px-2 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 text-[8px] font-mono rounded border border-emerald-800/60 cursor-pointer shadow active:scale-95 transition-colors"
                            title="Alinear magnéticamente al beatgrid más próximo"
                        >
                            <Icons.Link size={14} className="inline-block align-[-2px]" /> Snap a Beat
                        </button>
                    </div>
                </div>

                {/* Edición de tiempo y Nudge */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                        <div className="flex justify-between items-center text-[9px] font-mono text-gray-400 mb-0.5">
                            <span className="font-semibold text-gray-300">TIEMPO EXACTO (mm:ss.ms)</span>
                            <span className="text-gray-400 font-mono">{currentCue.pos_ms || 0} ms</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <input
                                type="text"
                                value={timeInputValue}
                                onChange={handleTimeInputChange}
                                placeholder="00:00.00"
                                className="w-full bg-djzinc-950 border border-djzinc-700 focus:border-djcyan-400 rounded px-2 py-1 text-xs font-mono font-bold text-djcyan-300 outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const cuePct = currentCue.pct !== undefined ? currentCue.pct : 0;
                                    if (onPlayTrack) onPlayTrack(track, cuePct, true);
                                }}
                                className="px-2.5 py-1 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-bold text-[10px] rounded cursor-pointer shadow shrink-0"
                                title="Audicionar este punto de cue"
                            >
                                <Icons.Play size={14} className="inline-block align-[-2px]" />
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center text-[9px] font-mono text-gray-400 mb-0.5">
                            <span className="font-semibold text-gray-300">NOMBRE DEL CUE / FRASE</span>
                            <span className="text-gray-400">{currentCue.bar_str || 'Bar 1'}</span>
                        </div>
                        <input
                            type="text"
                            value={nameInputValue}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Nombre táctico del cue..."
                            className="w-full bg-djzinc-950 border border-djzinc-700 focus:border-djcyan-400 rounded px-2 py-1 text-xs font-semibold text-gray-200 outline-none"
                        />
                    </div>
                </div>

                {/* Botones de Nudge rápido (Compás, Beat, 10ms) */}
                <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-djzinc-850">
                    <div className="flex items-center gap-1 text-[9px] font-mono">
                        <span className="text-gray-400 mr-0.5">Ajuste Fino:</span>
                        <button
                            type="button"
                            onClick={() => handleNudge(-barMs)}
                            className="px-1.5 py-0.5 bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95"
                            title="Retroceder 1 compás (4 beats)"
                        >
                            ◀◀ -1 Compás
                        </button>
                        <button
                            type="button"
                            onClick={() => handleNudge(-beatMs)}
                            className="px-1.5 py-0.5 bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95"
                            title="Retroceder 1 beat"
                        >
                            ◀ -1 Beat
                        </button>
                        <button
                            type="button"
                            onClick={() => handleNudge(-10)}
                            className="px-1.5 py-0.5 bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95"
                            title="Retroceder 10ms"
                        >
                            -10ms
                        </button>
                        <button
                            type="button"
                            onClick={() => handleNudge(10)}
                            className="px-1.5 py-0.5 bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95"
                            title="Avanzar 10ms"
                        >
                            +10ms
                        </button>
                        <button
                            type="button"
                            onClick={() => handleNudge(beatMs)}
                            className="px-1.5 py-0.5 bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95"
                            title="Avanzar 1 beat"
                        >
                            +1 Beat ▶
                        </button>
                        <button
                            type="button"
                            onClick={() => handleNudge(barMs)}
                            className="px-1.5 py-0.5 bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95"
                            title="Avanzar 1 compás (4 beats)"
                        >
                            +1 Compás ▶▶
                        </button>
                    </div>

                    {/* Presets rápidos de nombre de Cue */}
                    <div className="flex items-center gap-1 text-[8px] font-mono">
                        <span className="text-gray-400">Presets:</span>
                        {['Kick', 'Hi-Hats', 'Bass', 'Break', 'Drop 1', 'Drop 2', 'Outro'].map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => handleNameChange(p)}
                                className="px-1 py-0.2 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-750 cursor-pointer transition-colors"
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selector de Color RGB del Pad con Código Hexadecimal Explícito */}
                <div className="pt-1 border-t border-djzinc-850">
                    <div className="flex justify-between items-center text-[9px] font-mono text-gray-400 mb-1">
                        <span className="font-semibold text-gray-300">ASIGNAR COLOR DE PAD (PIONEER DJ / NUMARK RGB)</span>
                        <span className="text-gray-400">Actual: <span className="font-mono text-white font-bold">{currentCue.color || '#ef4444'}</span></span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {DJ_PAD_PALETTE.map(pal => {
                            const isCurrentColor = (currentCue.color || '#ef4444').toLowerCase() === pal.color.toLowerCase();
                            return (
                                <button
                                    key={pal.color}
                                    type="button"
                                    onClick={() => handleColorChange(pal)}
                                    className={`px-1.5 py-1 rounded text-[8px] font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                                        isCurrentColor 
                                            ? 'ring-2 ring-white border-white scale-105 shadow-md bg-djzinc-800' 
                                            : 'bg-djzinc-900 border-djzinc-750 hover:border-gray-500'
                                    }`}
                                    title={`${pal.name} • ${pal.hex}`}
                                >
                                    <span className="w-2.5 h-2.5 rounded-full shadow" style={{ backgroundColor: pal.color }}></span>
                                    <span className="text-gray-200">{pal.hex}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Espacio de Trabajo: Auditoría & DSP


// Espacio de Trabajo: Auditoría & DSP
export const AuditWorkspace = ({ 
    tracks: externalTracks, 
    setTracks: setExternalTracks, 
    customLibraries = [],
    onSaveCustomLibraries,
    activeCustomLibId,
    selectedTrack, 
    setSelectedTrack, 
    onPlayTrack, 
    nowPlayingTrack, 
    isPlaying, 
    onTogglePlay, 
    playProgress = 0,
    onNavigateTab,
    onAddTrackToSet,
    onSendToSpotify,
    onRemoveTrack,
    onRemoveMultipleTracks,
    onClearAllTracks,
    lang = "es",
    t = (k) => k,
    currentFolder = "",
    setCurrentFolder,
    audioRef,
    onAuditProgressChange,
    onOpenLibrary,
    isSimulationMode = false,
    onToggleSimulation,
    activeCrateFilter = null,
    onClearCrateFilter,
    onOpenBeatgridStudio
}) => {
    const [localRutaOrigen, setLocalRutaOrigen] = useState('');
    const rutaOrigen = currentFolder || localRutaOrigen;
    const setRutaOrigen = setCurrentFolder || setLocalRutaOrigen;
    const [selectedLooseFiles, setSelectedLooseFiles] = useState([]);
    const [isAuditing, setIsAuditing] = useState(false);
    const [isLoadingDir, setIsLoadingDir] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isInjecting, setIsInjecting] = useState(false);
    const [metrics, setMetrics] = useState({ total: 0, missing: 0, missing_title: 0, missing_artist: 0, missing_cover: 0, duplicates: 0, ready: 0, errors: 0 });
    const [filtro, setFiltro] = useState('todos');
    const [busqueda, setBusqueda] = useState('');
    const [filterHeaderAcousticRole, setFilterHeaderAcousticRole] = useState('ALL');
    const [batchModalOpen, setBatchModalOpen] = useState(false);
    const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
    const [batchProgress, setBatchProgress] = useState(0);
    const [batchStatusMsg, setBatchStatusMsg] = useState('');
    const [saveFeedback, setSaveFeedback] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { width: inspectorWidth, onPointerDown: onInspectorResizeDown, resetWidth: onInspectorResetWidth } = useDrawerResize('bw_inspector_drawer_width', 540);
    const { width: columnsDrawerWidth, onPointerDown: onColumnsResizeDown, resetWidth: onColumnsResetWidth } = useDrawerResize('bw_columns_drawer_width', 540);
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
    const [mobileWorkflowTab, setMobileWorkflowTab] = useState('analizar'); // 'analizar' | 'exportar'
    const [batchConfigured, setBatchConfigured] = useState(false);
    const [isAppendMode, setIsAppendMode] = useState(false);
    const [batchConfigOpts, setBatchConfigOpts] = useState({
        fftLossless: true,
        trimSilences: true,
        beatgrid: false,
        bpmKey: true,
        energyDance: true,
        moodDetect: true,
        hotCues8: true,
        tacticalComments: true,
        injectCovers: true,
        detectDuplicates: true,
        fixMissingNames: true,
        normalizeNames: true,
        stripWhitespace: true,
        onlyIncomplete: false
    });
    // 🔮 Mix Oracle (Radar de Mezcla Mágica)
    const [mixOracleOpen, setMixOracleOpen] = useState(false);
    const [mixOracleTargetTrack, setMixOracleTargetTrack] = useState(null);

    // Selección Multitrack & Ingesta de Reemplazos HD a Spotify
    const [selectedAuditIds, setSelectedAuditIds] = useState(new Set());
    const [isSearchingSpotifyHD, setIsSearchingSpotifyHD] = useState(false);
    // Modal de confirmación de eliminación segura de pistas (lista y disco físico)
    const [deleteModalState, setDeleteModalState] = useState({ open: false, tracks: [], mode: 'trash' });
    // Modal de confirmación previa para guardar metadatos en disco
    const [saveModalState, setSaveModalState] = useState({
        open: false,
        tracks: [],
        fields: {
            bpm: true,
            key: true,
            cues: true,
            comment: true,
            genre_mood: true,
            cover: true,
        }
    });
    const [deleteOriginalsOnUpgrade, setDeleteOriginalsOnUpgrade] = useState(() => {
        try {
            return localStorage.getItem('dj_metatagger_delete_originals') === 'true';
        } catch (e) {
            return false;
        }
    });

    const [internalTracks, setInternalTracks] = useState([]);
    const tracks = externalTracks !== undefined ? externalTracks : internalTracks;
    const setTracks = setExternalTracks !== undefined ? setExternalTracks : setInternalTracks;
    const [fftModalOpen, setFftModalOpen] = useState(false);
    const [fftAnalysisData, setFftAnalysisData] = useState(null);
    const [isAnalyzingFft, setIsAnalyzingFft] = useState(false);

    // Navegador de Carpetas Integrado con Ingesta Incremental (Cero popups de permisos del SO)
    const [fsBrowserOpen, setFsBrowserOpen] = useState(false);
    const [fsCurrentPath, setFsCurrentPath] = useState('');
    const [fsParentPath, setFsParentPath] = useState('');
    const [fsFolders, setFsFolders] = useState([]);
    const [fsFiles, setFsFiles] = useState([]);
    const [selectedFsFiles, setSelectedFsFiles] = useState([]);
    // Cesta de selección acumulativa: permite navegar entre carpetas y acumular múltiples carpetas y pistas sueltas
    const [stagedFolders, setStagedFolders] = useState([]);
    const [stagedFiles, setStagedFiles] = useState([]);
    const [fsActiveTab, setFsActiveTab] = useState('folders'); // 'folders' | 'files'
    const [fsLoading, setFsLoading] = useState(false);

    // Rueda Armónica Camelot & TAP Tempo
    const [camelotModalOpen, setCamelotModalOpen] = useState(false);
    const tapTimesRef = useRef([]);
    // PERF: ref del contenedor scrollable de la tabla para virtualización de filas
    const tableScrollRef = useRef(null);
    const isProcessCancelledRef = useRef(false);
    const activeAbortControllerRef = useRef(null);

    // UX CABINA: Estado de colapso de las 8 tarjetas de métricas (maximiza espacio vertical para ver más pistas y waveforms)
    const [metricsCollapsed, setMetricsCollapsed] = useState(() => {
        try {
            return localStorage.getItem('bw_metrics_collapsed') !== 'false';
        } catch (e) {
            return true;
        }
    });

    const toggleMetricsCollapsed = () => {
        setMetricsCollapsed(prev => {
            const next = !prev;
            try { localStorage.setItem('bw_metrics_collapsed', String(next)); } catch (e) {}
            return next;
        });
    };

    useEffect(() => {
        const handleToggleEvent = () => toggleMetricsCollapsed();
        window.addEventListener('bw:toggle-metrics', handleToggleEvent);
        return () => window.removeEventListener('bw:toggle-metrics', handleToggleEvent);
    }, []);

    // Desplegar automáticamente el HUD cuando la tabla deja de estar vacía
    useEffect(() => {
        if (tracks && tracks.length > 0) {
            setMetricsCollapsed(false);
        }
    }, [tracks && tracks.length > 0]);

    // Hot Cues & Beatgrid
    const [selectedCueId, setSelectedCueId] = useState(1);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [showBeatgrid, setShowBeatgrid] = useState(true);
    const [cueStudioModalOpen, setCueStudioModalOpen] = useState(false);

    const currentTrack = tracks.find(t => t.id === selectedTrack) || tracks[0] || {};

    // Reinicia todos los valores cacheados en botones, filtros y métricas
    const resetAuditWorkspace = (keepFolder = false) => {
        if (!keepFolder) {
            if (setRutaOrigen) setRutaOrigen('');
            if (setCurrentFolder) setCurrentFolder('');
        }
        setTracks([]);
        setSelectedTrack(null);
        if (onClearAllTracks) onClearAllTracks();
        setMetrics({ total: 0, missing: 0, missing_title: 0, missing_artist: 0, missing_cover: 0, duplicates: 0, ready: 0, errors: 0 });
        setSelectedAuditIds(new Set());
        setSelectedLooseFiles([]);
        setStagedFolders([]);
        setStagedFiles([]);
        setSelectedFsFiles([]);
        setFiltro('todos');
        setBusqueda('');
        setFilterHeaderSearch('');
        setFilterHeaderFormat('ALL');
        setFilterHeaderQuality('ALL');
        setFilterHeaderStatus('ALL');
        setFilterHeaderEnergy('ALL');
        setFilterHeaderDance('ALL');
        setFilterHeaderGenre('');
        setFilterHeaderSubgenre('');
        setFilterHeaderAcousticRole('ALL');
        setBatchProgress(0);
        setBatchStatusMsg('');
        setSaveFeedback('');
        setIsAuditing(false);
        setIsLoadingDir(false);
        setIsInjecting(false);
        setIsExporting(false);
        setExportDropdownOpen(false);
        setBatchModalOpen(false);
        if (typeof onAuditProgressChange === 'function') {
            onAuditProgressChange({ isAuditing: false, progress: 0, statusMsg: '' });
        }
    };

    useEffect(() => {
        const handleAuditEvt = (e) => {
            if (!e.detail) return;
            const { pct, msg } = e.detail;
            if (!msg || msg.includes('detenid') || msg.includes('cancelad')) {
                setBatchProgress(0);
                setBatchStatusMsg('');
                setIsAuditing(false);
                setIsLoadingDir(false);
                setIsInjecting(false);
                setIsExporting(false);
                if (typeof onAuditProgressChange === 'function') {
                    onAuditProgressChange({ isAuditing: false, progress: 0, statusMsg: '' });
                }
                return;
            }
            if (pct > 0 && pct < 100) {
                setIsAuditing(true);
            }
            setBatchProgress(pct);
            setBatchStatusMsg(msg);
        };
        window.addEventListener('bw:audit_progress', handleAuditEvt);

        if (true) {
            window.actualizar_progreso_batch = (pct, msg) => {
                window.dispatchEvent(new CustomEvent('bw:audit_progress', { detail: { pct, msg } }));
            };
            try {
                apiClient.registerCallback("actualizar_progreso_batch", window.actualizar_progreso_batch);
            } catch (err) {}
        }
        return () => window.removeEventListener('bw:audit_progress', handleAuditEvt);
    }, [onAuditProgressChange]);

    // Polling redundante de alta precisión para barra de progreso (/api/audit/progress)
    const startProgressPolling = () => {
        if (window._bw_audit_poll) clearInterval(window._bw_audit_poll);
        isProcessCancelledRef.current = false;
        window._bw_audit_poll = setInterval(async () => {
            if (isProcessCancelledRef.current) return;
            try {
                const res = await fetch('/api/audit/progress');
                if (isProcessCancelledRef.current) return;
                if (res.ok) {
                    const data = await res.json();
                    if (isProcessCancelledRef.current) return;
                    if (data && typeof data.pct === 'number') {
                        if (data.pct > 0) {
                            setBatchProgress(data.pct);
                            if (data.msg) setBatchStatusMsg(data.msg);
                            if (data.pct >= 100) {
                                stopProgressPolling();
                            }
                        } else if (data.pct === 0 && !data.active) {
                            if (isProcessCancelledRef.current) {
                                stopProgressPolling();
                                setBatchProgress(0);
                            }
                        }
                    }
                }
            } catch (_) {}
        }, 200);
    };

    const stopProgressPolling = () => {
        if (window._bw_audit_poll) {
            clearInterval(window._bw_audit_poll);
            window._bw_audit_poll = null;
        }
    };

    // Cargar la colección guardada de la app en la tabla de auditoría
    const handleCargarColeccionGuardada = (targetLibId = null) => {
        const activeLib = (targetLibId && (customLibraries || []).find(l => l.id === targetLibId))
            || (customLibraries || []).find(l => l.id === activeCustomLibId) 
            || (customLibraries && customLibraries[0]);
        const colTracks = [];
        const seenKeys = new Set();
        if (activeLib && activeLib.folders) {
            activeLib.folders.forEach(f => {
                (f.tracks || []).forEach(tr => {
                    const key = tr.path || tr.filepath || tr.f || tr.id;
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        colTracks.push(tr);
                    }
                });
            });
        }
        if (colTracks.length > 0) {
            setTracks(colTracks);
            setSelectedTrack(colTracks[0]?.id || null);
            setSaveFeedback(lang === 'en' ? `✓ Loaded ${colTracks.length} tracks from Colección` : `✓ Colección cargada (${colTracks.length} pistas)`);
        } else {
            setSaveFeedback(lang === 'en' ? "Your saved Colección is empty. Add tracks with 'Llevar a Colección'." : "Tu Colección guardada está vacía. Añade pistas con 'Llevar a Colección'.");
        }
        setTimeout(() => setSaveFeedback(''), 3500);
    };

    // Llevar pistas auditadas a un Crate o carpeta de la colección guardada
    const handleLlevarAColeccion = (targetFolder = null, newCrateName = null) => {
        const sourceTracks = selectedAuditIds.size > 0 
            ? tracks.filter(t => selectedAuditIds.has(t.id)) 
            : tracks;
        if (!sourceTracks || sourceTracks.length === 0) {
            setSaveFeedback(lang === 'en' ? "No tracks available to add to Colección." : "No hay pistas para añadir a la Colección.");
            setTimeout(() => setSaveFeedback(''), 3000);
            return;
        }

        const activeLib = (customLibraries || []).find(l => l.id === activeCustomLibId) || (customLibraries && customLibraries[0]) || {
            id: 'lib_default',
            name: 'Mi Colección Principal',
            tracks: [],
            folders: []
        };

        let chosenFolder = targetFolder;
        let updatedFolders = [...(activeLib.folders || [])];

        if (newCrateName && newCrateName.trim()) {
            chosenFolder = {
                id: `f_${Date.now()}`,
                name: newCrateName.trim(),
                tracks: []
            };
            updatedFolders.push(chosenFolder);
        } else if (!chosenFolder && activeLib.folders && activeLib.folders.length > 0) {
            chosenFolder = activeLib.folders[0];
        }

        let addedCount = 0;
        const existingRootPaths = new Set((activeLib.tracks || []).map(t => t.path || t.filepath || t.f || t.id));
        const newRootTracks = [...(activeLib.tracks || [])];

        sourceTracks.forEach(t => {
            const key = t.path || t.filepath || t.f || t.id;
            if (!existingRootPaths.has(key)) {
                existingRootPaths.add(key);
                newRootTracks.push(t);
                addedCount++;
            }
        });

        if (chosenFolder) {
            const existingFolderPaths = new Set((chosenFolder.tracks || []).map(t => t.path || t.filepath || t.f || t.id));
            const newFolderTracks = [...(chosenFolder.tracks || [])];
            sourceTracks.forEach(t => {
                const key = t.path || t.filepath || t.f || t.id;
                if (!existingFolderPaths.has(key)) {
                    existingFolderPaths.add(key);
                    newFolderTracks.push(t);
                }
            });
            updatedFolders = updatedFolders.map(f => f.id === chosenFolder.id ? { ...f, tracks: newFolderTracks } : f);
        }

        const updatedLib = { ...activeLib, tracks: newRootTracks, folders: updatedFolders };
        const updatedLibs = (customLibraries && customLibraries.length > 0)
            ? customLibraries.map(l => l.id === updatedLib.id ? updatedLib : l)
            : [updatedLib];

        if (typeof onSaveCustomLibraries === 'function') {
            onSaveCustomLibraries(updatedLibs, updatedLib.id);
        }

        setSaveFeedback(lang === 'en' 
            ? `✓ Added ${sourceTracks.length} tracks to Colección` 
            : `✓ ${sourceTracks.length} pistas añadidas a tu Colección`
        );
        setTimeout(() => setSaveFeedback(''), 4000);
    };

    // Notificar al componente raíz (App) para persistir estado y mostrar progreso entre pestañas
    useEffect(() => {
        if (typeof onAuditProgressChange === 'function') {
            onAuditProgressChange({
                isAuditing,
                progress: batchProgress,
                statusMsg: batchStatusMsg
            });
        }
    }, [isAuditing, batchProgress, batchStatusMsg, onAuditProgressChange]);

    // Sincronización continua de métricas en función del estado de tracks
    useEffect(() => {
        if (!tracks || tracks.length === 0) {
            setMetrics({ total: 0, missing: 0, missing_title: 0, missing_artist: 0, missing_cover: 0, duplicates: 0, ready: 0, errors: 0 });
        } else {
            const total = tracks.length;
            const missing = tracks.filter(t => !t.b || t.b === '--' || !t.k || t.k === '--').length;
            const missing_title = tracks.filter(t => t.missing_title || !t.t || t.t === 'Desconocido').length;
            const missing_artist = tracks.filter(t => t.missing_artist || !t.a || t.a === 'Artista Desconocido').length;
            // Detección reactiva de carátulas: si t.missing_cover es false o tiene cover/has_cover válido, no falta carátula
            const missing_cover = tracks.filter(t => t.missing_cover === true || (!t.cover && !t.has_cover)).length;
            const errors = tracks.filter(x => Boolean(x.es_fake) || (x.format === 'FLAC' && String(x.status || '').includes('Fake'))).length;
            const ready = Math.max(0, total - missing);
            setMetrics(prev => ({
                ...prev,
                total,
                missing,
                missing_title,
                missing_artist,
                missing_cover,
                errors,
                ready
            }));
        }
    }, [tracks]);

    // Apertura del modal de confirmación de eliminación segura
    const solicitarEliminarPistas = (tracksToDelete, defaultMode = 'trash', e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!tracksToDelete || tracksToDelete.length === 0) return;
        setDeleteModalState({
            open: true,
            tracks: tracksToDelete,
            mode: defaultMode
        });
    };

    // Ejecución de eliminación (de la lista y/o del disco físico)
    const ejecutarEliminarPistas = async (modo) => {
        const toDelete = deleteModalState.tracks;
        if (!toDelete || toDelete.length === 0) {
            setDeleteModalState({ open: false, tracks: [], mode: 'trash' });
            return;
        }
        const count = toDelete.length;
        const idsToRemove = new Set(toDelete.map(t => String(t.id)));
        const pathsToRemove = toDelete.map(t => t.path || t.f).filter(Boolean);

        // Si se seleccionó borrado físico (Papelera o Permanente)
        if (modo === 'trash' || modo === 'permanent') {
            const permanente = (modo === 'permanent');
            try {
                if (true) {
                    await apiClient.rpc('eliminar_pistas_disco', pathsToRemove, permanente);
                } else {
                    await fetch('/api/eliminar_pistas_disco', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paths: pathsToRemove, permanente })
                    });
                }
            } catch (err) {
                console.error("Error al eliminar pistas del disco:", err);
            }
        }

        // Eliminar de la lista de tracks en React
        if (onRemoveMultipleTracks) {
            onRemoveMultipleTracks(Array.from(idsToRemove));
        } else {
            setTracks(prev => prev.filter(t => !idsToRemove.has(String(t.id)) && !idsToRemove.has(String(t.path))));
            if (selectedTrack && idsToRemove.has(String(selectedTrack))) {
                const remaining = tracks.filter(t => !idsToRemove.has(String(t.id)));
                setSelectedTrack(remaining.length > 0 ? remaining[0].id : null);
            }
            if (nowPlayingTrack && (idsToRemove.has(String(nowPlayingTrack.id)) || idsToRemove.has(String(nowPlayingTrack.path)))) {
                if (audioRef && audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
                if (onPlayTrack) onPlayTrack(null);
            }
        }

        setSelectedAuditIds(prev => {
            const next = new Set(prev);
            toDelete.forEach(t => next.delete(t.id));
            return next;
        });

        setDeleteModalState({ open: false, tracks: [], mode: 'trash' });
        const feedbackMsg = modo === 'list_only'
            ? (lang === 'en' ? `✓ ${count} track(s) removed from list.` : `✓ ${count} pista(s) quitada(s) de la lista.`)
            : modo === 'permanent'
                ? (lang === 'en' ? `✓ ${count} file(s) permanently deleted from disk.` : `✓ ${count} archivo(s) eliminados definitivamente del disco.`)
                : (lang === 'en' ? `✓ ${count} file(s) moved to Trash.` : `✓ ${count} archivo(s) trasladados a la Papelera de reciclaje.`);
        setSaveFeedback(feedbackMsg);
        setTimeout(() => setSaveFeedback(''), 3000);
    };

    // Eliminación individual de pista del análisis global (ahora con modal de seguridad)
    const handleRemoveSingleTrack = (trackId, e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!trackId && trackId !== 0) return;
        const targetTrack = tracks.find(t => String(t.id) === String(trackId) || t.path === trackId);
        if (targetTrack) {
            solicitarEliminarPistas([targetTrack], 'trash', e);
        } else {
            setTracks(prev => prev.filter(t => String(t.id) !== String(trackId) && t.path !== trackId));
        }
    };

    // Eliminación por lote de pistas seleccionadas
    const handleRemoveSelectedTracks = (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!selectedAuditIds || selectedAuditIds.size === 0) return;
        const toDelete = tracks.filter(t => selectedAuditIds.has(t.id));
        if (toDelete.length > 0) {
            solicitarEliminarPistas(toDelete, 'trash', e);
        }
    };

    // Vaciar lista completa y reiniciar valores en botones
    const handleClearAllTracks = (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!tracks || tracks.length === 0) return;

        const confirmMsg = lang === 'en'
            ? `Empty the analysis list and remove all ${tracks.length} track(s)?`
            : `¿Vaciar la lista y eliminar todas las ${tracks.length} pistas del análisis?`;

        if (!window.confirm(confirmMsg)) return;

        if (audioRef && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (onPlayTrack) onPlayTrack(null);

        resetAuditWorkspace(false);
        setSaveFeedback(lang === 'en' ? "✓ Analysis list emptied." : "✓ Lista de análisis vaciada.");
        setTimeout(() => setSaveFeedback(''), 2500);
    };

    const updateCurrentTrackField = (field, val) => {
        setTracks(prev => prev.map(t => {
            if (t.id !== currentTrack?.id) return t;
            const updated = { ...t, [field]: val };
            if (field === 'bpm' || field === 'b') {
                const bpmNum = parseFloat(val);
                updated.bpm = val;
                updated.b = val;
                updated.recalcular_grid = true;
                updated.recalcular_cues = true;
                if (!isNaN(bpmNum) && bpmNum > 20.0) {
                    const durMs = parseDurationMs(t.duration || "05:00");
                    const downbeatMs = parseFloat(t.first_downbeat_ms || 0);
                    // Sincronizar Cues al nuevo tempo inmediatamente (8 marcas de fraseo estándar)
                    const beatMs = (60000.0 / bpmNum);
                    const cueNames = ["Intro (1.1)", "Bassline In", "Hi-Hats In", "Main Break", "Drop 1 (Climax)", "Mid Break", "Drop 2 (Re-Kick)", "Outro Mix Point"];
                    const cueBeats = [0, 32, 64, 96, 128, 160, 192, 224];
                    const cueColors = ["#06b6d4", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#ec4899", "#3b82f6", "#14b8a6"];
                    updated.cues = cueNames.map((name, i) => {
                        const pos = Math.min(durMs - 1000, Math.round(downbeatMs + (cueBeats[i] * beatMs)));
                        return {
                            id: i + 1,
                            name,
                            pos_ms: Math.max(0, pos),
                            time: formatMsToTime(pos),
                            pct: durMs > 0 ? (pos / durMs) : 0,
                            color: cueColors[i]
                        };
                    });
                }
            }
            return updated;
        }));
    };

    // Detección de FLAC que no cumple con estándares Lossless o es de calidad media/baja (SuperFLAC)
    const isFlacUpgradeCandidate = (t) => {
        if (!t) return false;
        const fmt = String(t.format || '').toUpperCase();
        if (fmt !== 'FLAC') return false;

        // 1. FLAC marcado como Fake / Transcode
        if (Boolean(t.es_fake) || String(t.status || '').toLowerCase().includes('fake')) return true;

        // 2. Calidad declarada como Baja, Media, Regular, Pobre o Transcode
        const cal = String(t.calidad || '').toLowerCase();
        if (cal.includes('baja') || cal.includes('media') || cal.includes('regular') || cal.includes('poor') || cal.includes('bad') || cal.includes('transcode')) {
            return true;
        }

        // 3. Corte espectral prematuro en FLAC (< 20.0 kHz, típico transcode desde MP3/AAC)
        const cutoff = Number(t.cutoff_khz) || 0;
        if (cutoff > 0 && cutoff < 20.0) return true;

        // 4. Bitrate bajo para FLAC sin pérdidas (< 650 kbps)
        const bitrate = Number(t.bitrate_kbps) || 0;
        if (bitrate > 0 && bitrate < 650) return true;

        // 5. Pérdida espectral porcentual detectable (>= 15%)
        const perdida = Number(t.perdida_pct) || 0;
        if (perdida >= 15.0) return true;

        return false;
    };

    // Detección Acústica General de Pistas de Mala Calidad (Fakes, bitrates bajos, corte espectral prematuro)
    const isBadQualityTrack = (t) => {
        if (!t) return false;
        // 1. Pistas FLAC que no cumplen estándar lossless (SuperFLAC)
        if (isFlacUpgradeCandidate(t)) return true;
        // 2. Calidad declarada como Baja, Pobre o Transcode
        const cal = String(t.calidad || '').toLowerCase();
        if (cal.includes('baja') || cal.includes('poor') || cal.includes('bad') || cal.includes('transcode')) {
            return true;
        }
        // 3. MP3 con bitrate bajo (< 310 kbps)
        const bitrate = Number(t.bitrate_kbps) || 0;
        if (t.format === 'MP3' && bitrate > 0 && bitrate < 310) {
            return true;
        }
        // 4. Corte espectral bajo (< 18.0 kHz) en pistas auditadas
        const cutoff = Number(t.cutoff_khz) || 0;
        if (cutoff > 0 && cutoff < 18.0) {
            return true;
        }
        // 5. Pérdida porcentual alta (>= 20%)
        const perdida = Number(t.perdida_pct) || 0;
        if (perdida >= 20.0) {
            return true;
        }
        return false;
    };

    const badQualityTracks = useMemo(() => {
        return (tracks || []).filter(t => isBadQualityTrack(t));
    }, [tracks]);

    const flacUpgradeTracks = useMemo(() => {
        return (tracks || []).filter(t => isFlacUpgradeCandidate(t));
    }, [tracks]);

    const missingMetaTracks = useMemo(() => {
        return (tracks || []).filter(t => !t?.title || !t?.t || String(t?.title || t?.t).toLowerCase().trim() === 'untitled' || !t?.artist || !t?.a || String(t?.artist || t?.a).toLowerCase().trim() === 'desconocido');
    }, [tracks]);

    const missingCuesTracks = useMemo(() => {
        return (tracks || []).filter(t => !t?.cues || (Array.isArray(t?.cues) && t?.cues.length === 0) || !t?.hotcues);
    }, [tracks]);

    const trimmedSilenceTracks = useMemo(() => {
        return (tracks || []).filter(t => Boolean((t?.trim_start_ms && t?.trim_start_ms > 0) || t?.silence_trimmed || t?.zero_cross_trim));
    }, [tracks]);

    const excellentQualityTracks = useMemo(() => {
        return (tracks || []).filter(t => !isBadQualityTrack(t) && (t?.format === 'FLAC' || t?.format === 'WAV' || t?.format === 'AIFF' || (t?.bitrate_kbps && t?.bitrate_kbps >= 320)));
    }, [tracks]);

    const highEnergyTracks = useMemo(() => {
        return (tracks || []).filter(t => Number(t?.e || t?.energy || 0) >= 75);
    }, [tracks]);

    const handleToggleSelectRow = (id, e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setSelectedAuditIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSelectAllBadQuality = () => {
        const badIds = badQualityTracks.map(t => t.id);
        if (badIds.length === 0) {
            alert("No se han detectado pistas de mala calidad en la lista actual.");
            return;
        }
        const allBadAlreadySelected = badIds.every(id => selectedAuditIds.has(id));
        if (allBadAlreadySelected) {
            setSelectedAuditIds(new Set());
        } else {
            setSelectedAuditIds(new Set(badIds));
        }
    };

    const handleBuscarReemplazosSpotify = async (customTracks = null) => {
        let targetTracks = customTracks;
        if (!targetTracks || targetTracks.length === 0) {
            if (selectedAuditIds.size > 0) {
                targetTracks = (tracks || []).filter(t => selectedAuditIds.has(t.id));
            } else if (badQualityTracks.length > 0) {
                targetTracks = badQualityTracks;
            }
        }
        if (!targetTracks || targetTracks.length === 0) {
            alert("No hay pistas seleccionadas ni pistas de baja calidad detectadas para buscar en el Catálogo.");
            return;
        }

        setIsSearchingSpotifyHD(true);
        setBatchProgress(20);
        setBatchStatusMsg(`Buscando reemplazos oficiales en Catálogo HD para ${targetTracks.length} pista(s)...`);

        try {
            let rawRes = null;
            if (true) {
                try {
                    rawRes = await apiClient.rpc('buscar_reemplazos_spotify_batch', targetTracks);
                } catch (eelErr) {
                    console.warn("[REEMPLAZOS] Fallo llamada Eel, recurriendo a HTTP:", eelErr);
                }
            }
            if (!rawRes || !rawRes.tracks) {
                try {
                    const res = await fetch('/api/buscar_reemplazos_spotify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tracks: targetTracks })
                    });
                    if (res.ok) {
                        rawRes = await res.json();
                    }
                } catch (httpErr) {
                    console.warn("[REEMPLAZOS] Fallo fallback HTTP:", httpErr);
                }
            }

            let results = rawRes && Array.isArray(rawRes.tracks) ? rawRes.tracks : (Array.isArray(rawRes) ? rawRes : []);

            if (!results || results.length === 0) {
                // Modo resiliente: si ningún servicio externo respondió, crear entradas con los datos locales para no bloquear al usuario
                results = targetTracks.map((trk, i) => ({
                    id: trk.id || `sp_hd_offline_${i}`,
                    title: trk.title || trk.t || trk.displayTitle || 'Pista Local',
                    artist: trk.artist || trk.a || trk.displayArtist || 'Artista',
                    album: trk.album || 'Búsqueda Manual Requerida',
                    bpm: trk.bpm || trk.b || 128,
                    key: trk.key || trk.k || '8A',
                    cover: trk.cover || null,
                    duration: trk.duration || trk.d || '03:45',
                    match_score: 0,
                    es_misma_pista: false,
                    match_recomendacion: 'Sin coincidencia directa. Clic para buscar versión manualmente.',
                    origin: 'audit_upgrade',
                    reemplazo_de: `${trk.artist || trk.a || ''} - ${trk.title || trk.t || ''}`,
                    original_file: trk.filename || trk.f || null,
                    original_path: trk.path || trk.filepath || trk.f || null
                }));
            }

            setBatchProgress(90);
            setBatchStatusMsg(`✓ ${results.length} pistas transferidas a Descargas. Redirigiendo a Pool Ingest...`);

            const formattedTracks = results.map((r, i) => {
                const isVerified = (r.match_score !== undefined ? r.match_score >= 80 : true) && r.es_misma_pista !== false;
                return {
                    id: `sp_hd_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
                    title: r.title,
                    artist: r.artist,
                    album: r.album || 'Catálogo Master HD',
                    bpm: parseFloat(r.bpm) || 128,
                    key: (r.key || '8A').toUpperCase(),
                    cover: r.cover || null,
                    duration: r.duration || '03:45',
                    origin: 'audit_upgrade',
                    reemplazo_de: r.reemplazo_de || r.filename || (targetTracks[i] ? `${targetTracks[i].artist || targetTracks[i].a || ''} - ${targetTracks[i].title || targetTracks[i].t || ''}` : null),
                    original_file: r.original_file || r.filename || targetTracks[i]?.filename || targetTracks[i]?.f || null,
                    original_path: r.original_path || targetTracks[i]?.path || targetTracks[i]?.filepath || targetTracks[i]?.f || null,
                    original_duration: r.original_duration || targetTracks[i]?.duration || null,
                    original_artist: r.original_artist || targetTracks[i]?.artist || targetTracks[i]?.a || 'Desconocido',
                    original_title: r.original_title || targetTracks[i]?.title || targetTracks[i]?.t || 'Sin Título',
                    original_calidad: r.original_calidad || targetTracks[i]?.calidad || null,
                    downloaded: false,
                    selected: true, // Pre-marcar siempre para que el DJ pueda descargar inmediatamente el lote
                    format: 'FLAC',
                    calidad: 'Catálogo Master HD',
                    status: isVerified ? 'Listo para Descarga (Match Verificado)' : 'Listo para Descarga (Match Pendiente)',
                    match_score: r.match_score !== undefined ? r.match_score : 100,
                    match_confianza: r.match_confianza || (isVerified ? 'ALTA' : 'MEDIA'),
                    match_badge_color: r.match_badge_color || (isVerified ? 'emerald' : 'amber'),
                    match_recomendacion: r.match_recomendacion || '',
                    alerta_version: r.alerta_version || null,
                    alerta_duracion: r.alerta_duracion || null,
                    es_misma_pista: r.es_misma_pista !== undefined ? r.es_misma_pista : true,
                    candidatos_alternativos: r.candidatos_alternativos || [],
                    todos_candidatos: r.todos_candidatos || [],
                    spotify_id: r.spotify_id || r.id || null,
                    spotify_url: r.spotify_url || null,
                    apple_url: r.apple_url || null,
                    isrc: r.isrc || null,
                    preview_url: r.preview_url || null,
                    energy: r.energy || r.e || 78,
                    danceability: r.danceability || r.dance || 84,
                    fase_badge: r.fase_badge || null,
                    comment: `Reemplazo HD para: ${r.reemplazo_de || r.filename || 'Pista local'}`
                };
            });

            if (typeof onSendToSpotify === 'function') {
                onSendToSpotify(formattedTracks, 'audit_upgrade');
            } else if (typeof onNavigateTab === 'function') {
                onNavigateTab('spotify');
            }

            setBatchProgress(100);
        } catch (err) {
            console.error("Error buscando reemplazos en Catálogo:", err);
            setBatchStatusMsg("Aviso en búsqueda online. Conmutando a transferencia directa...");
            if (targetTracks && targetTracks.length > 0) {
                const fallbackTracks = targetTracks.map((trk, i) => ({
                    id: trk.id || `sp_hd_err_${Date.now()}_${i}`,
                    title: trk.title || trk.t || trk.displayTitle || 'Pista Local',
                    artist: trk.artist || trk.a || trk.displayArtist || 'Artista',
                    album: trk.album || 'Pendiente Descarga',
                    bpm: trk.bpm || trk.b || 128,
                    key: trk.key || trk.k || '8A',
                    cover: trk.cover || null,
                    duration: trk.duration || trk.d || '03:45',
                    match_score: 0,
                    es_misma_pista: false,
                    match_recomendacion: 'Transferido desde Auditoría. Clic para seleccionar versión en streaming.',
                    origin: 'audit_upgrade',
                    reemplazo_de: `${trk.artist || trk.a || ''} - ${trk.title || trk.t || ''}`,
                    original_file: trk.filename || trk.f || null,
                    original_path: trk.path || trk.filepath || trk.f || null,
                    downloaded: false,
                    selected: true,
                    format: 'FLAC',
                    status: 'Listo para Descarga'
                }));
                if (typeof onSendToSpotify === 'function') {
                    onSendToSpotify(fallbackTracks, 'audit_upgrade');
                } else if (typeof onNavigateTab === 'function') {
                    onNavigateTab('spotify');
                }
            } else {
                const errMsg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err)) || 'Error desconocido';
                alert("Aviso al procesar reemplazos: " + errMsg);
            }
        } finally {
            setTimeout(() => {
                setIsSearchingSpotifyHD(false);
                setBatchProgress(0);
                setBatchStatusMsg('');
            }, 1000);
        }
    };

    const handleTapTempo = () => {
        const now = Date.now();
        const taps = tapTimesRef.current.filter(t => now - t < 2500);
        taps.push(now);
        tapTimesRef.current = taps;
        if (taps.length >= 2) {
            const intervals = [];
            for (let i = 1; i < taps.length; i++) {
                intervals.push(taps[i] - taps[i - 1]);
            }
            const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const bpmCalc = (60000.0 / avg);
            if (bpmCalc >= 40 && bpmCalc <= 240) {
                const formatted = bpmCalc.toFixed(2);
                updateCurrentTrackField('b', formatted);
                updateCurrentTrackField('bpm', formatted);
            }
        }
    };

    const handleMicroAjusteTrim = (deltaMs) => {
        if (!currentTrack || !currentTrack.id) return;
        const cur = parseFloat(currentTrack.trim_start_ms || 0);
        const nxt = Math.max(0, parseFloat((cur + deltaMs).toFixed(1)));
        updateCurrentTrackField('trim_start_ms', nxt);
    };

    const handleMicroAjusteDownbeat = (deltaMs) => {
        if (!currentTrack || !currentTrack.id) return;
        const cur = parseFloat(currentTrack.first_downbeat_ms || 0);
        const nxt = Math.max(0, parseFloat((cur + deltaMs).toFixed(1)));
        updateCurrentTrackField('first_downbeat_ms', nxt);
    };

    const handleAutoDetectarTrimDownbeat = async () => {
        if (!currentTrack || !currentTrack.id) return;
        const targetPath = currentTrack.path || currentTrack.f;
        if (!targetPath) return;
        setBatchProgress(25);
        setBatchStatusMsg(`Calculando Zero-Crossing y Beat 1.0.0 en ${currentTrack.t || currentTrack.title || currentTrack.f}...`);
        try {
            if (true) {
                const res = await apiClient.rpc('calcular_trim_downbeat_track', targetPath, currentTrack.id);
                if (res && res.status === 'ok') {
                    updateCurrentTrackField('trim_start_ms', res.trim_start_ms);
                    updateCurrentTrackField('first_downbeat_ms', res.first_downbeat_ms);
                    if (res.cues && Array.isArray(res.cues) && res.cues.length > 0) {
                        updateCurrentTrackField('cues', res.cues);
                    }
                    setBatchProgress(100);
                    setBatchStatusMsg(`✓ Trim: -${res.trim_start_ms}ms | Beatgrid 1.0.0: ${res.first_downbeat_ms}ms (8 Cues sincronizados)`);
                } else {
                    setBatchStatusMsg("No se pudo detectar el corte de silencio.");
                }
            }
        } catch (err) {
            console.error("Error auto-detecting trim/downbeat:", err);
            setBatchStatusMsg("Error al calcular DSP.");
        } finally {
            setTimeout(() => {
                setBatchProgress(0);
                setBatchStatusMsg('');
            }, 1200);
        }
    };

    const handleAutoPhraseCues = async () => {
        if (!currentTrack || !currentTrack.id) return;
        const durMs = parseDurationMs(currentTrack.duration || "05:00");
        const bpm = parseFloat(currentTrack.b || currentTrack.bpm || 128.0);
        const downbeatMs = parseFloat(currentTrack.first_downbeat_ms || 0);

        setBatchProgress(40);
        setBatchStatusMsg(`Calculando 8 Hot Cues por frases musicales (16/32b) para ${currentTrack.t || currentTrack.title || currentTrack.f}...`);
        try {
            if (true) {
                const res = await apiClient.rpc('calcular_hot_cues_fraseo', durMs, bpm, downbeatMs);
                if (res && Array.isArray(res) && res.length > 0) {
                    updateCurrentTrackField('cues', res);
                    setBatchProgress(100);
                    setBatchStatusMsg(`✓ 8 Hot Cues anclados al Beatgrid 1.0.0 (Compases 1, 17, 33...) generados.`);
                } else {
                    setBatchStatusMsg("No se pudieron generar los cues.");
                }
            }
        } catch (err) {
            console.error("Error auto-calculating hot cues:", err);
            setBatchStatusMsg("Error calculando frases.");
        } finally {
            setTimeout(() => {
                setBatchProgress(0);
                setBatchStatusMsg('');
            }, 1500);
        }
    };

    const handleEnrutarPistaActual = async () => {
        if (!currentTrack || !currentTrack.id) return;
        const targetPath = currentTrack.path || currentTrack.f;
        if (!targetPath) return;

        const gen = currentTrack.genre || 'Tech House';
        const subg = currentTrack.subgenre || (TAXONOMY_TREE[gen] ? TAXONOMY_TREE[gen][0] : 'General');

        setBatchProgress(40);
        setBatchStatusMsg(`Enrutando ${currentTrack.t || currentTrack.title} a crate /${gen}/${subg}...`);
        try {
            if (true) {
                const res = await apiClient.rpc('organizar_pista_en_crate', { ...currentTrack, genre: gen, subgenre: subg },
                    destinoDescarga || "/Users/admin/Music/mi musica",
                    "copy");
                if (res && res.status === 'ok') {
                    setBatchProgress(100);
                    setBatchStatusMsg(`✓ Archivo enrutado con éxito a /${gen}/${subg}`);
                    setSaveFeedback("✓ Enrutado a Crate Serato");
                    setTimeout(() => setSaveFeedback(''), 3000);
                } else {
                    setBatchStatusMsg(res?.msg || "Error al enrutar archivo.");
                }
            }
        } catch (err) {
            console.error("Error al enrutar pista:", err);
            setBatchStatusMsg("Error al enrutar.");
        } finally {
            setTimeout(() => {
                setBatchProgress(0);
                setBatchStatusMsg('');
            }, 1500);
        }
    };

    const handlePreescuchaOffset = (offsetMs) => {
        if (!currentTrack) return;
        const offsetSec = Math.max(0, (parseFloat(offsetMs || 0) / 1000.0));
        if (onPlayTrack) {
            onPlayTrack(currentTrack, 0, true, offsetSec);
        }
    };

    const fetchDirectoryListing = async (path) => {
        // 1. Priorizar llamada directa HTTP REST con timeout (independiente de websockets)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const r = await fetch('/api/listar_subcarpetas?ruta=' + encodeURIComponent(path || ''), {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (r.ok) {
                const data = await r.json();
                if (data && (data.folders || data.files || data.current)) return data;
            }
        } catch (e) {
            console.warn("HTTP listar_subcarpetas falló, intentando alternativa:", e);
        }

        // 2. Fallback a Eel con timeout para evitar cuelgues si el websocket no responde
        if (true) {
            try {
                const eelPromise = apiClient.rpc('listar_subcarpetas_sistema', path);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Eel timeout")), 1500));
                const res = await Promise.race([eelPromise, timeoutPromise]);
                if (res && (res.folders || res.files || res.current)) return res;
            } catch (e) {
                console.warn("Eel listar_subcarpetas falló:", e);
            }
        }

        // 3. Fallback a RPC FastAPI
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const r = await fetch('/api/rpc/listar_subcarpetas_sistema', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ args: [path || ''] }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (r.ok) {
                const data = await r.json();
                return data.result || data;
            }
        } catch (e) {}
        return null;
    };

    const handleAbrirDialogoNativo = async () => {
        try {
            let target = null;
            if (true) {
                try {
                    target = await apiClient.rpc('seleccionar_directorio');
                } catch (e) {}
            }
            if (!target || target === 'cancelado') {
                try {
                    const r = await fetch('/api/seleccionar_directorio');
                    if (r.ok) {
                        const d = await r.json();
                        target = d.path;
                    }
                } catch (e) {}
            }
            if (target && target !== 'cancelado') {
                setFsBrowserOpen(false);
                handleSeleccionarCarpetaUI(target);
            }
        } catch (err) {
            console.error("Error abriendo diálogo nativo:", err);
        }
    };

    const handleAbrirNavegadorCarpetas = async (initialPath = "") => {
        setFsBrowserOpen(true);
        setFsLoading(true);
        const startPath = initialPath || (typeof rutaOrigen === 'string' && !rutaOrigen.includes('pista') ? rutaOrigen : "") || "";
        try {
            let res = await fetchDirectoryListing(startPath);
            if (!res || (!res.folders?.length && !res.files?.length && !res.current)) {
                // Si la ruta solicitada falló o está vacía, rescatar con la carpeta Music estándar
                res = await fetchDirectoryListing("/Users/admin/Music");
            }
            if (res) {
                setFsCurrentPath(res.current || "/Users/admin/Music");
                setFsParentPath(res.parent || "/Users/admin");
                setFsFolders(res.folders || []);
                setFsFiles(res.files || []);
                if ((!res.folders || res.folders.length === 0) && (res.files && res.files.length > 0)) {
                    setFsActiveTab('files');
                }
            } else {
                setFsCurrentPath("/Users/admin/Music");
            }
        } catch (err) {
            console.error("Error al listar carpetas:", err);
            setFsCurrentPath("/Users/admin/Music");
        } finally {
            setFsLoading(false);
        }
    };

    const handleNavegarACarpeta = async (targetPath) => {
        setFsLoading(true);
        try {
            const res = await fetchDirectoryListing(targetPath);
            if (res) {
                setFsCurrentPath(res.current || targetPath);
                setFsParentPath(res.parent || "");
                setFsFolders(res.folders || []);
                setFsFiles(res.files || []);
                if ((!res.folders || res.folders.length === 0) && (res.files && res.files.length > 0)) {
                    setFsActiveTab('files');
                }
            }
        } catch (err) {
            console.error("Error navegando:", err);
        } finally {
            setFsLoading(false);
        }
    };

    const toggleStageFolder = (folderPath) => {
        setStagedFolders(prev => {
            if (prev.includes(folderPath)) {
                return prev.filter(p => p !== folderPath);
            } else {
                return [...prev, folderPath];
            }
        });
    };

    const toggleStageFile = (filePath) => {
        setStagedFiles(prev => {
            if (prev.includes(filePath)) {
                return prev.filter(p => p !== filePath);
            } else {
                return [...prev, filePath];
            }
        });
    };

    const toggleStageAllCurrentFsFiles = () => {
        const currentPaths = (fsFiles || []).map(f => f.path);
        const allPresent = currentPaths.length > 0 && currentPaths.every(p => stagedFiles.includes(p));
        if (allPresent) {
            setStagedFiles(prev => prev.filter(p => !currentPaths.includes(p)));
        } else {
            setStagedFiles(prev => {
                const combined = new Set([...prev, ...currentPaths]);
                return Array.from(combined);
            });
        }
    };

    const clearStagedSelection = () => {
        setStagedFolders([]);
        setStagedFiles([]);
        setSelectedFsFiles([]);
    };

    const handleConfirmarSeleccionLote = async () => {
        const combined = [...stagedFolders, ...stagedFiles];
        const append = isAppendMode;
        if (combined.length === 0) {
            // Si el usuario no marcó elementos individuales, carga la carpeta actual abierta
            if (fsCurrentPath) {
                clearStagedSelection();
                setSelectedLooseFiles([]);
                if (!append) setRutaOrigen(fsCurrentPath);
                setFsBrowserOpen(false);
                await handleCargarDirectorio(fsCurrentPath, append);
            }
            return;
        }

        clearStagedSelection();
        setSelectedLooseFiles(stagedFiles);
        const descParts = [];
        if (stagedFolders.length > 0) descParts.push(`${stagedFolders.length} carpeta(s)`);
        if (stagedFiles.length > 0) descParts.push(`${stagedFiles.length} pista(s)`);
        if (!append) setRutaOrigen(descParts.join(' + '));
        setFsBrowserOpen(false);
        await handleCargarDirectorio(combined, append);
    };

    const handleSeleccionarCarpetaUI = async (targetPath) => {
        const finalPath = targetPath || fsCurrentPath;
        const append = isAppendMode;
        clearStagedSelection();
        setSelectedLooseFiles([]);
        if (!append) setRutaOrigen(finalPath);
        setFsBrowserOpen(false);
        await handleCargarDirectorio(finalPath, append);
    };

    const handleExplorar = async () => {
        setIsAppendMode(false);
        handleAbrirNavegadorCarpetas(rutaOrigen);
    };

    const handleAnadirMas = () => {
        setIsAppendMode(true);
        handleAbrirNavegadorCarpetas(rutaOrigen);
    };

    // Resuelve de forma inteligente la lista de archivos o carpetas objetivo
    const resolveAuditTargets = (pathOverride) => {
        if (pathOverride) return pathOverride;
        // 1. Si hay pistas seleccionadas en la tabla con checkbox:
        if (selectedAuditIds && selectedAuditIds.size > 0) {
            const selectedPaths = (tracks || [])
                .filter(t => selectedAuditIds.has(t.id))
                .map(t => t.path || t.f)
                .filter(Boolean);
            if (selectedPaths.length > 0) return selectedPaths;
        }
        // 2. Si se han acumulado carpetas y pistas en la cesta:
        if (stagedFolders.length > 0 || stagedFiles.length > 0) {
            return [...stagedFolders, ...stagedFiles];
        }
        // 3. Si se han seleccionado pistas sueltas desde el explorador:
        if (selectedLooseFiles && selectedLooseFiles.length > 0) {
            return selectedLooseFiles;
        }
        // 3. Si la rutaOrigen es un directorio real físico en disco:
        if (rutaOrigen && typeof rutaOrigen === 'string') {
            const isSynthetic = rutaOrigen.includes(' pistas') || rutaOrigen.includes(' archivos)');
            if (!isSynthetic && (rutaOrigen.startsWith('/') || rutaOrigen.includes(':\\') || rutaOrigen.length > 2)) {
                return rutaOrigen;
            }
        }
        // 4. Si hay pistas cargadas en el listado actual (cargadas previamente o como pistas sueltas):
        if (tracks && tracks.length > 0) {
            const trackPaths = tracks.map(t => t.path || t.f).filter(Boolean);
            if (trackPaths.length > 0) return trackPaths;
        }
        return null;
    };

    const handleCargarDirectorio = async (pathOverride, isAppend = false) => {
        const target = pathOverride || rutaOrigen;
        if (!target) return;
        if (!isAppend) {
            // Reiniciar estado anterior y limpiar valores cacheados
            resetAuditWorkspace(true);
        }
        if (true) {
            setIsLoadingDir(true);
            setBatchProgress(0);
            startProgressPolling();
            const targetDesc = Array.isArray(target) ? `${target.length} pistas seleccionadas` : `archivos en ${target}`;
            setBatchStatusMsg(isAppend ? `Añadiendo metadatos de ${targetDesc}...` : `Leyendo metadatos de ${targetDesc}...`);
            try {
                const res = await apiClient.rpc('cargar_metadatos_directorio', target);
                if (res && Array.isArray(res.tracks)) {
                    if (isAppend) {
                        const existingPaths = new Set((tracks || []).map(t => String(t.path || t.f || t.id)));
                        const newTracks = res.tracks.filter(t => !existingPaths.has(String(t.path || t.f || t.id)));
                        const merged = [...(tracks || []), ...newTracks];
                        setTracks(merged);
                        if (!selectedTrack && merged.length > 0) {
                            setSelectedTrack(merged[0].id);
                        }
                        setMetrics({
                            total: merged.length,
                            missing: merged.filter(t => t.missing_title || t.missing_artist || !t.genre || !t.bpm).length,
                            missing_title: merged.filter(t => t.missing_title).length,
                            missing_artist: merged.filter(t => t.missing_artist).length,
                            missing_cover: merged.filter(t => t.missing_cover).length,
                            duplicates: (res.duplicates || 0),
                            ready: merged.filter(t => !t.missing_title && !t.missing_artist && t.bpm && t.key).length,
                            errors: 0
                        });
                        setRutaOrigen(`${merged.length} pistas en biblioteca`);
                    } else {
                        setTracks(res.tracks);
                        if (res.tracks.length > 0) {
                            setSelectedTrack(res.tracks[0].id);
                        } else {
                            setSelectedTrack(null);
                        }
                        setMetrics({
                            total: res.total || 0,
                            missing: res.sin_meta || 0,
                            missing_title: res.missing_title !== undefined ? res.missing_title : res.tracks.filter(t => t.missing_title).length,
                            missing_artist: res.missing_artist !== undefined ? res.missing_artist : res.tracks.filter(t => t.missing_artist).length,
                            missing_cover: res.missing_cover !== undefined ? res.missing_cover : res.tracks.filter(t => t.missing_cover).length,
                            duplicates: res.duplicates !== undefined ? res.duplicates : 0,
                            ready: res.ready !== undefined ? res.ready : Math.max(0, (res.total || 0) - (res.sin_meta || 0)),
                            errors: res.errors || 0
                        });
                    }
                } else if (!isAppend) {
                    setTracks([]);
                    setSelectedTrack(null);
                    setMetrics({ total: 0, missing: 0, missing_title: 0, missing_artist: 0, missing_cover: 0, duplicates: 0, ready: 0, errors: 0 });
                }
            } catch (e) {
                console.error("Fallo carga metadatos de directorio:", e);
                setBatchStatusMsg("Error al leer metadatos del directorio.");
            } finally {
                stopProgressPolling();
                setIsAppendMode(false);
                setIsLoadingDir(false);
                setBatchProgress(0);
                setBatchStatusMsg('');
                if (typeof onAuditProgressChange === 'function') {
                    onAuditProgressChange({ isAuditing: false, progress: 0, statusMsg: '' });
                }
            }
        }
    };

    const handleAuditar = async (pathOverride) => {
        const target = resolveAuditTargets(pathOverride);
        if (!target || (Array.isArray(target) && target.length === 0)) {
            alert("Por favor selecciona una carpeta o carga pistas sueltas primero.");
            return;
        }
        if (true && !isAuditing) {
            setIsAuditing(true);
            setBatchProgress(0);
            startProgressPolling();
            const targetDesc = Array.isArray(target) ? `${target.length} pistas seleccionadas` : target;
            setBatchStatusMsg(`Iniciando auditoría acústica avanzada en ${targetDesc}...`);
            try {
                const res = await apiClient.rpc('iniciar_auditoria', target);
                if (res && Array.isArray(res.tracks)) {
                    setTracks(res.tracks);
                    if (res.tracks.length > 0) {
                        setSelectedTrack(res.tracks[0].id);
                    }
                    const badDetected = res.tracks.filter(t => isBadQualityTrack(t));
                    if (badDetected.length > 0) {
                        setSelectedAuditIds(new Set(badDetected.map(t => t.id)));
                    }
                    setMetrics({
                        total: res.total || 0,
                        missing: res.sin_meta || 0,
                        missing_title: res.missing_title !== undefined ? res.missing_title : res.tracks.filter(t => t.missing_title).length,
                        missing_artist: res.missing_artist !== undefined ? res.missing_artist : res.tracks.filter(t => t.missing_artist).length,
                        missing_cover: res.missing_cover !== undefined ? res.missing_cover : res.tracks.filter(t => t.missing_cover).length,
                        duplicates: res.duplicates !== undefined ? res.duplicates : 0,
                        ready: res.ready !== undefined ? res.ready : Math.max(0, (res.total || 0) - (res.sin_meta || 0)),
                        errors: res.errors !== undefined ? res.errors : res.tracks.filter(x => Boolean(x.es_fake) || (x.format === 'FLAC' && String(x.status).includes('Fake'))).length
                    });
                }
                setBatchProgress(100);
                setBatchStatusMsg(`✓ Auditoría completada: ${res?.total || 0} pistas procesadas.`);
                if (typeof registrarEnBitacora === 'function') {
                    registrarEnBitacora({
                        action: "Auditoría Acústica DSP",
                        category: "audit",
                        trackTitle: `Auditoría ${res?.total || 0} pistas`,
                        filePath: targetDesc,
                        detailsBefore: "Sin certificar",
                        detailsAfter: `${res?.ready || 0} Lossless OK • ${res?.errors || 0} Fakes • ${res?.sin_meta || 0} Sin Meta`,
                        status: (res?.errors || 0) > 0 ? "⚠️ Con advertencias" : "✓ Completado",
                        fullLog: `=== REPORTE DE AUDITORÍA ACÚSTICA ===\nDirectorio / Pistas: ${targetDesc}\nTotal procesadas: ${res?.total || 0}\nLossless Certificadas: ${res?.ready || 0}\nTranscodificaciones Fake / Corruptos: ${res?.errors || 0}\nPistas sin metadatos: ${res?.sin_meta || 0}\nDuplicados detectados: ${res?.duplicates || 0}\nInspección FFT: Activa\nFijación BeatGrid 1.0.0: Activa`
                    });
                }
            } catch (e) {
                console.error("Fallo auditoría:", e);
                setBatchStatusMsg("Error durante la auditoría.");
            } finally {
                stopProgressPolling();
                setTimeout(() => {
                    setIsAuditing(false); 
                    setBatchProgress(0); 
                    setBatchStatusMsg(''); 
                    if (typeof onAuditProgressChange === 'function') {
                        onAuditProgressChange({ isAuditing: false, progress: 0, statusMsg: '' });
                    }
                }, 800);
            }
        }
    };

    const handleEjecutarAuditoriaLote = async (overrideOpts = null) => {
        const target = resolveAuditTargets();
        if (!target || (Array.isArray(target) && target.length === 0)) {
            alert("Por favor selecciona una carpeta o carga pistas sueltas primero con 'Cargar Colección'.");
            return;
        }
        const opts = overrideOpts || batchConfigOpts || {};
        setIsAuditing(true);
        setBatchProgress(0);
        startProgressPolling();
        const targetDesc = Array.isArray(target) ? `${target.length} pistas seleccionadas` : target;
        setBatchStatusMsg(`Ejecutando auditoría avanzada con ajustes seleccionados en ${targetDesc}...`);
        try {
            if (true) {
                const res = await apiClient.rpc('ejecutar_auditoria_lote', target, opts);
                if (res && res.tracks) {
                    setTracks(res.tracks);
                    const badDetected = res.tracks.filter(t => isBadQualityTrack(t));
                    if (badDetected.length > 0) {
                        setSelectedAuditIds(new Set(badDetected.map(t => t.id)));
                    }
                    setMetrics({
                        total: res.total || res.tracks.length,
                        missing: res.sin_meta || 0,
                        missing_title: res.missing_title !== undefined ? res.missing_title : res.tracks.filter(t => t.missing_title).length,
                        missing_artist: res.missing_artist !== undefined ? res.missing_artist : res.tracks.filter(t => t.missing_artist).length,
                        missing_cover: res.missing_cover !== undefined ? res.missing_cover : res.tracks.filter(t => t.missing_cover).length,
                        duplicates: res.duplicates !== undefined ? res.duplicates : 0,
                        ready: res.ready || 0,
                        errors: res.errors || 0
                    });
                    if (opts.injectCovers && window.eel.inyectar_caratulas_lote) {
                        setBatchStatusMsg("Inyectando carátulas 1:1 en archivos físicos...");
                        await apiClient.rpc('inyectar_caratulas_lote', res.tracks);
                    }
                    if (opts.tacticalComments && window.eel.inyectar_lote_metadatos) {
                        setBatchStatusMsg("Inyectando comentarios tácticos y tags en archivos físicos...");
                        await apiClient.rpc('inyectar_lote_metadatos', res.tracks);
                    }
                    if (opts.normalizeNames && window.eel.sanitizar_metadatos_pistas) {
                        setBatchStatusMsg("Normalizando nombres de archivo y títulos...");
                        await apiClient.rpc('sanitizar_metadatos_pistas', res.tracks, false);
                    }
                    setBatchProgress(100);
                    setSaveFeedback(`✓ Análisis completado con éxito (${res.tracks.length} pistas)`);
                    setTimeout(() => setSaveFeedback(''), 4000);
                    if (typeof registrarEnBitacora === 'function') {
                        registrarEnBitacora({
                            action: "Auditoría en Lote & DSP",
                            category: "audit",
                            trackTitle: `Lote ${res?.total || res?.tracks?.length || 0} pistas`,
                            filePath: targetDesc,
                            detailsBefore: "Pendiente de procesamiento",
                            detailsAfter: `${res?.total || res?.tracks?.length || 0} pistas procesadas con éxito`,
                            status: "✓ Completado",
                            fullLog: `=== AUDITORÍA EN LOTE BEATWAVE PRO ===\nObjetivo: ${targetDesc}\nPistas analizadas: ${res?.tracks?.length || 0}\nOpciones aplicadas: ${Object.entries(opts).filter(([_, v]) => v).map(([k]) => k).join(", ")}\nBeatgrid 1.0.0 Anti-Drift: ${opts.beatgrid ? "Activado (Autocorrelación 40-120Hz)" : "Desactivado"}`
                        });
                    }
                }
            } else {
                await handleAuditar();
            }
        } catch (e) {
            console.error("Error al ejecutar auditoría en lote:", e);
            setBatchStatusMsg("Error al procesar lote.");
        } finally {
            stopProgressPolling();
            setTimeout(() => {
                setIsAuditing(false);
                setBatchProgress(0);
                setBatchStatusMsg('');
            }, 800);
        }
    };

    const handleExportarXLS = async () => {
        if (!tracks || tracks.length === 0) {
            alert("No hay pistas auditadas para exportar.");
            return;
        }
        const destino = await solicitarCarpetaDestino("Selecciona la carpeta donde guardar el Informe Excel (.xlsx):");
        if (!destino) return;
        if (true) {
            setIsExporting(true);
            setBatchProgress(25);
            setBatchStatusMsg("Generando reporte de auditoría en formato Excel (XLSX)...");
            try {
                const res = await apiClient.rpc('exportar_auditoria_xls', tracks, destino);
                setBatchProgress(100);
                if (res && res.status === 'ok') {
                    const nombreArchivo = res.path ? res.path.split('/').pop() : "CleanDJmix_Audit_Respaldo.xlsx";
                    setBatchStatusMsg(`✓ Exportado con éxito: ${nombreArchivo}`);
                    setSaveFeedback(`✓ Informe guardado en: ${destino}`);
                    setTimeout(() => setSaveFeedback(''), 4000);
                } else {
                    setBatchStatusMsg("Error al exportar a Excel.");
                    alert(res?.msg || "Error al exportar a Excel.");
                }
            } catch (e) {
                console.error("Error al exportar XLS:", e);
                setBatchStatusMsg("Error durante la exportación.");
                alert("Error al exportar reporte XLS.");
            } finally {
                setTimeout(() => {
                    setIsExporting(false);
                    setBatchProgress(0);
                    setBatchStatusMsg('');
                }, 800);
            }
        }
    };

    // Exportación / Inyección de Metadatos nativos requeridos por Serato DJ Pro en los archivos
    const handleExportarSerato = async () => {
        if (!tracks || tracks.length === 0) {
            alert("No hay pistas auditadas para configurar para Serato.");
            return;
        }
        setIsInjecting(true);
        setBatchProgress(15);
        setBatchStatusMsg("Inyectando configuración y metadatos nativos para Serato DJ Pro en los archivos...");
        try {
            if (true) {
                const res = await apiClient.rpc('inyectar_lote_metadatos', tracks);
                setBatchProgress(100);
                if (res && res.status === 'ok') {
                    const total = res.total_inyectadas || tracks.length;
                    setBatchStatusMsg(`✓ ${total} pistas configuradas con metadatos oficiales de Serato DJ Pro`);
                    setSaveFeedback(`✓ Metadatos Serato inyectados en los archivos de audio`);
                    setTimeout(() => setSaveFeedback(''), 4500);
                } else {
                    alert(res?.msg || "Error al inyectar metadatos para Serato.");
                }
            }
        } catch (e) {
            console.error("Error al inyectar metadatos Serato:", e);
            alert("Error al procesar pistas para Serato DJ Pro.");
        } finally {
            setTimeout(() => {
                setIsInjecting(false);
                setBatchProgress(0);
                setBatchStatusMsg('');
            }, 800);
        }
    };
    const handleExportarSeratoCrates = handleExportarSerato;

    const handleExportarTraktor = async () => {
        if (!tracks || tracks.length === 0) {
            alert("No hay pistas auditadas para exportar.");
            return;
        }
        const destino = await solicitarCarpetaDestino("Selecciona la carpeta donde guardar colección Traktor (.nml):");
        if (!destino) return;
        if (true) {
            setIsExporting(true);
            setBatchProgress(40);
            setBatchStatusMsg("Generando colección Traktor Pro (.nml)...");
            try {
                const res = await apiClient.rpc('exportar_traktor_nml', tracks, destino);
                setBatchProgress(100);
                if (res && res.status === 'ok') {
                    setBatchStatusMsg(`✓ Traktor NML generado en ${res.path}`);
                    setSaveFeedback(`✓ Traktor NML guardado en ${destino}`);
                    setTimeout(() => setSaveFeedback(''), 4000);
                } else {
                    alert(res?.msg || "Error al exportar Traktor NML.");
                }
            } catch (e) {
                console.error("Error al exportar Traktor NML:", e);
            } finally {
                setTimeout(() => {
                    setIsExporting(false);
                    setBatchProgress(0);
                    setBatchStatusMsg('');
                }, 800);
            }
        }
    };

    const handleExportarVirtualDJ = async () => {
        if (!tracks || tracks.length === 0) {
            alert("No hay pistas auditadas para exportar.");
            return;
        }
        const destino = await solicitarCarpetaDestino("Selecciona la carpeta donde guardar lista VirtualDJ (.m3u):");
        if (!destino) return;
        setIsExporting(true);
        setBatchProgress(40);
        setBatchStatusMsg("Generando lista y metadatos para VirtualDJ...");
        try {
            if (true) {
                const res = await apiClient.rpc('exportar_set_m3u', tracks, "VirtualDJ_Coleccion", destino);
                setBatchProgress(100);
                if (res && res.status === 'ok') {
                    setSaveFeedback(`✓ Colección VirtualDJ guardada en ${destino}`);
                    setTimeout(() => setSaveFeedback(''), 4000);
                }
            } else {
                setSaveFeedback("✓ Colección VirtualDJ exportada");
                setTimeout(() => setSaveFeedback(''), 4000);
            }
        } catch (e) {
            console.error("Error exportando VirtualDJ:", e);
        } finally {
            setTimeout(() => {
                setIsExporting(false);
                setBatchProgress(0);
                setBatchStatusMsg('');
            }, 800);
        }
    };

    const handleExportarRekordboxXml = async () => {
        if (!tracks || tracks.length === 0) {
            alert("No hay pistas auditadas para exportar.");
            return;
        }
        const destino = await solicitarCarpetaDestino("Selecciona la carpeta donde guardar rekordbox.xml:");
        if (!destino) return;
        if (true) {
            setIsExporting(true);
            setBatchProgress(40);
            setBatchStatusMsg("Generando archivo rekordbox.xml estándar Pioneer DJ...");
            try {
                const res = await apiClient.rpc('exportar_rekordbox_xml', tracks, destino, "rekordbox.xml");
                setBatchProgress(100);
                if (res && res.status === 'ok') {
                    setBatchStatusMsg(`✓ rekordbox.xml generado exitosamente (${res.total_tracks} pistas, ${res.playlists} playlists)`);
                    setSaveFeedback(`✓ rekordbox.xml guardado en ${destino}`);
                    setTimeout(() => setSaveFeedback(''), 4000);
                } else {
                    setBatchStatusMsg("Error al exportar rekordbox.xml.");
                    alert(res?.msg || "Error al exportar rekordbox.xml.");
                }
            } catch (e) {
                console.error("Error al exportar rekordbox XML:", e);
                setBatchStatusMsg("Error durante la exportación.");
            } finally {
                setTimeout(() => {
                    setIsExporting(false);
                    setBatchProgress(0);
                    setBatchStatusMsg('');
                }, 1000);
            }
        }
    };

    const handleSincronizarPasaporteUniversal = async () => {
        if (!tracks || tracks.length === 0) {
            alert("No hay pistas cargadas para exportar.");
            return;
        }
        const destino = await solicitarCarpetaDestino("Selecciona la carpeta destino para la exportación universal:");
        if (!destino) return;
        setIsExporting(true);
        setBatchProgress(30);
        setBatchStatusMsg("Ejecutando Pasaporte Universal: Serato, Rekordbox, Traktor y VirtualDJ...");
        try {
            let res = null;
            if (true) {
                res = await apiClient.rpc('sincronizar_pasaporte_universal', tracks, destino);
            } else {
                const resp = await fetch('/api/export/universal_sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tracks, destino_dir: destino })
                });
                res = await resp.json();
            }
            setBatchProgress(100);
            if (res && res.status === 'ok') {
                setBatchStatusMsg(`✓ Pasaporte Universal Sincronizado: ${tracks.length} pistas en 4 plataformas.`);
                setSaveFeedback(`✓ Sincronizado en ${destino}: Rekordbox XML, Traktor NML y VirtualDJ M3U`);
                setTimeout(() => setSaveFeedback(''), 5000);
            } else {
                alert("Error sincronizando: " + (res?.msg || "Fallo inesperado"));
            }
        } catch (e) {
            console.error("Error en Pasaporte Universal:", e);
            alert("Error ejecutando la sincronización universal.");
        } finally {
            setTimeout(() => {
                setIsExporting(false);
                setBatchProgress(0);
                setBatchStatusMsg('');
            }, 1000);
        }
    };

    const handleAbrirFftModal = async (trackParaAnalisis) => {
        const trk = trackParaAnalisis || currentTrack;
        const targetPath = trk?.path || trk?.f;
        if (!targetPath) {
            alert("No hay ruta de archivo disponible para el análisis espectral FFT.");
            return;
        }
        setFftModalOpen(true);
        setIsAnalyzingFft(true);
        setFftAnalysisData(null);
        if (true) {
            try {
                const res = await apiClient.rpc('analizar_espectro_fft', targetPath, trk.id);
                setFftAnalysisData(res);
                if (res && res.cutoff_khz !== undefined) {
                    updateCurrentTrackField('cutoff_khz', res.cutoff_khz);
                    if (res.estado) {
                        updateCurrentTrackField('status', res.estado);
                    }
                }
            } catch (err) {
                console.error("Error al ejecutar análisis FFT:", err);
            } finally {
                setIsAnalyzingFft(false);
            }
        } else {
            setIsAnalyzingFft(false);
        }
    };

    const handleGuardarTrack = async () => {
        if (!currentTrack) return;
        setIsInjecting(true);
        setBatchProgress(30);
        setBatchStatusMsg(`Inyectando tags ID3v2.4 y marcas Serato en ${currentTrack.t || currentTrack.title || currentTrack.f}...`);
        try {
            if (true) {
                const res = await apiClient.rpc('guardar_cambios_track', currentTrack);
                if (res && res.status === 'ok') {
                    setBatchProgress(100);
                    setBatchStatusMsg("✓ Inyección completada y guardada en disco.");
                    setSaveFeedback('✓ Guardado en disco e inyectado');
                    setTimeout(() => setSaveFeedback(''), 3000);
                } else {
                    setBatchStatusMsg(res?.msg || "Error al inyectar metadatos.");
                    alert(res?.msg || "Error al inyectar metadatos.");
                }
            }
        } catch (err) {
            setBatchStatusMsg("Error al inyectar metadatos.");
        } finally {
            setTimeout(() => {
                setIsInjecting(false);
                setBatchProgress(0);
                setBatchStatusMsg('');
            }, 800);
        }
    };

    const handleInyectarCaratulasLote = async () => {
        if (!tracks || tracks.length === 0) {
            alert("No hay pistas cargadas para inyectar carátulas.");
            return;
        }
        setIsInjecting(true);
        setBatchProgress(5);
        setBatchStatusMsg(`Buscando e inyectando carátulas 1:1 en ${tracks.length} pistas...`);
        try {
            if (true) {
                const res = await apiClient.rpc('inyectar_caratulas_lote', tracks);
                setBatchProgress(100);
                if (res && res.status === 'ok') {
                    setBatchStatusMsg(`✓ Carátulas actualizadas: ${res.actualizadas} pistas con artwork.`);
                    setSaveFeedback(`✓ ${res.actualizadas} carátulas incrustadas en archivos`);
                    setTimeout(() => setSaveFeedback(''), 4000);
                } else {
                    setBatchStatusMsg("Error al inyectar carátulas.");
                }
            }
        } catch (e) {
            console.error("Error al inyectar carátulas:", e);
            setBatchStatusMsg("Fallo durante la inyección de carátulas.");
        } finally {
            setTimeout(() => {
                setIsInjecting(false);
                setBatchProgress(0);
                setBatchStatusMsg('');
            }, 1000);
        }
    };

    const handleSanitizarMetadatos = async () => {
        if (!tracks || tracks.length === 0) {
            alert("No hay pistas cargadas para sanitizar.");
            return;
        }
        setIsInjecting(true);
        setBatchProgress(10);
        setBatchStatusMsg(`Higienizando metadatos, eliminando spam promocional y normalizando feats en ${tracks.length} pistas...`);
        try {
            let res = null;
            if (true) {
                res = await apiClient.rpc('sanitizar_metadatos_pistas', tracks, false);
            } else {
                const resp = await fetch('/api/sanitizar_metadatos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tracks, guardar_en_disco: false })
                });
                if (resp.ok) res = await resp.json();
            }

            if (res && res.status === 'ok') {
                if (res.tracks && res.tracks.length > 0) {
                    setTracks(res.tracks);
                }
                setBatchProgress(100);
                const msg = `✓ Higienización DJ completada: ${res.modificados} pista(s) corregidas (spam eliminado, feats normalizados, versiones etiquetadas).`;
                setBatchStatusMsg(msg);
                setSaveFeedback(msg);
                setTimeout(() => setSaveFeedback(''), 5000);
            } else {
                setBatchStatusMsg("No se detectó spam o modificaciones pendientes.");
            }
        } catch (e) {
            console.error("Error al sanitizar etiquetas:", e);
            setBatchStatusMsg("Fallo durante la higienización de etiquetas.");
        } finally {
            setTimeout(() => {
                setIsInjecting(false);
                setBatchProgress(0);
                setBatchStatusMsg('');
            }, 1200);
        }
    };

    const handleSolicitarGuardarTodo = (customTracks = null) => {
        const targetTracks = customTracks || ((selectedAuditIds && selectedAuditIds.size > 0)
            ? tracks.filter(t => selectedAuditIds.has(t.id))
            : tracks);

        if (!targetTracks || targetTracks.length === 0) {
            alert(lang === 'en' ? "No tracks loaded to save." : "No hay pistas cargadas para guardar.");
            return;
        }

        setSaveModalState({
            open: true,
            tracks: targetTracks,
            fields: {
                bpm: true,
                key: true,
                cues: true,
                comment: true,
                genre_mood: true,
                cover: true,
            }
        });
    };

    const handleGuardarTodoEnFicheros = async (customTracks = null, customFields = null) => {
        const targetTracks = customTracks || ((selectedAuditIds && selectedAuditIds.size > 0)
            ? tracks.filter(t => selectedAuditIds.has(t.id))
            : tracks);

        if (!targetTracks || targetTracks.length === 0) {
            alert(lang === 'en' ? "No tracks loaded to save." : "No hay pistas cargadas para guardar.");
            return;
        }

        const fields = customFields || {
            bpm: true,
            key: true,
            cues: true,
            comment: true,
            genre_mood: true,
            cover: true,
        };

        isProcessCancelledRef.current = false;
        activeAbortControllerRef.current = new AbortController();
        const signal = activeAbortControllerRef.current.signal;

        setIsInjecting(true);
        setBatchProgress(5);
        setBatchStatusMsg(`Guardando metadatos seleccionados en ${targetTracks.length} archivos físicos...`);
        startProgressPolling();

        try {
            // Sanitizar carga útil para transferencias HTTP ultraligeras y seguras (sin buffers de audio pesados)
            const sanitizedTracks = targetTracks.map(t => ({
                id: t.id,
                path: t.path || t.filepath || t.f || '',
                filename: t.filename || t.f || '',
                title: t.title || t.t || '',
                artist: t.artist || t.a || '',
                album: t.album || '',
                bpm: fields.bpm ? (t.bpm || t.b || 128.0) : null,
                key: fields.key ? (t.key || t.k || t.initialkey || '') : null,
                genre: fields.genre_mood ? (t.genre || '') : null,
                subgenre: fields.genre_mood ? (t.subgenre || '') : null,
                energy: t.energy || 80,
                danceability: t.danceability || 80,
                comment: fields.comment ? (t.comment || '') : null,
                grouping: fields.genre_mood ? (t.grouping || t.mood || '') : null,
                label: t.label || '',
                remixer: t.remixer || '',
                composer: t.composer || '',
                year: t.year || '',
                cues: fields.cues ? (t.cues || []) : null,
                skip_cues: !fields.cues,
                skip_cover: !fields.cover,
                first_downbeat_ms: t.first_downbeat_ms || t.downbeat_ms || 0,
                trim_start_ms: t.trim_start_ms || 0,
                trim_end_ms: t.trim_end_ms || 0,
                recalcular_grid: false,
                modo_rapido: true
            }));

            // REST API con soporte nativo de AbortSignal y sin límite de tamaño de websocket (cross-platform compatible)
            const response = await fetch('/api/metadata/save_batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tracks: sanitizedTracks }),
                signal
            });

            if (isProcessCancelledRef.current) return;

            const data = await response.json();
            const res = data.result || data;

            stopProgressPolling();
            if (isProcessCancelledRef.current) return;

            setBatchProgress(100);
            if (res && (res.status === 'ok' || res.inyectados > 0)) {
                setBatchStatusMsg(`✓ Guardado completo: ${res.inyectados} archivos actualizados en disco con éxito.`);
                setSaveFeedback(`✓ ${res.inyectados} archivos guardados con metadatos completos`);
                setTimeout(() => setSaveFeedback(''), 4000);
            } else if (res && res.status === 'cancelled') {
                setBatchStatusMsg("Proceso cancelado por el usuario.");
            } else {
                setBatchStatusMsg("Error durante el guardado de archivos.");
            }
        } catch (e) {
            if (e.name === 'AbortError' || isProcessCancelledRef.current) {
                console.log("Guardado abortado por el usuario.");
                setBatchStatusMsg("Proceso cancelado por el usuario.");
            } else {
                console.error("Error al guardar todo en ficheros:", e);
                setBatchStatusMsg("Error al guardar metadatos.");
            }
        } finally {
            activeAbortControllerRef.current = null;
            stopProgressPolling();
            setTimeout(() => {
                setIsInjecting(false);
                setBatchProgress(0);
                setBatchStatusMsg('');
            }, 1200);
        }
    };

    const handleInyectarSeratoLote = handleGuardarTodoEnFicheros;

    const [isAuditPaused, setIsAuditPaused] = useState(false);

    const handleTogglePausaProceso = async () => {
        const nextState = !isAuditPaused;
        setIsAuditPaused(nextState);
        try {
            const endpoint = nextState ? '/api/audit/pause' : '/api/audit/resume';
            fetch(endpoint, { method: 'POST' }).catch(() => {});
            if (window.eel) {
                if (nextState && window.eel.pausar_auditoria) {
                    await apiClient.rpc('pausar_auditoria');
                } else if (!nextState && window.eel.reanudar_auditoria) {
                    await apiClient.rpc('reanudar_auditoria');
                }
            }
        } catch (e) {
            console.error("Error al pausar/reanudar:", e);
        }
    };

    const handleCancelarProceso = async () => {
        isProcessCancelledRef.current = true;
        stopProgressPolling();
        if (activeAbortControllerRef.current) {
            try { activeAbortControllerRef.current.abort(); } catch (_) {}
            activeAbortControllerRef.current = null;
        }
        setIsAuditPaused(false);
        setIsAuditing(false);
        setIsLoadingDir(false);
        setIsInjecting(false);
        setIsExporting(false);
        setBatchProgress(0);
        setBatchStatusMsg('✓ Proceso cancelado inmediatamente por el usuario.');
        if (typeof onAuditProgressChange === 'function') {
            onAuditProgressChange({ isAuditing: false, progress: 0, statusMsg: '' });
        }
        try {
            fetch('/api/cancelar_procesos', { method: 'POST' }).catch(() => {});
        } catch (e) {}
        if (true) {
            try {
                apiClient.rpc('cancelar_procesos_activos');
            } catch (e) {}
        }
        setTimeout(() => {
            if (isProcessCancelledRef.current) {
                setBatchStatusMsg('');
            }
        }, 2000);
    };

    // Estado de Ordenación y Filtros por Cabecera de Tabla
    const [auditSortField, setAuditSortField] = useState('id');
    const [auditSortDir, setAuditSortDir] = useState('asc'); // 'asc' | 'desc'
    const [filterHeaderSearch, setFilterHeaderSearch] = useState('');
    const [filterHeaderArtist, setFilterHeaderArtist] = useState('');
    const [filterHeaderFormat, setFilterHeaderFormat] = useState('ALL');
    const [filterHeaderKhz, setFilterHeaderKhz] = useState('ALL');
    const [filterHeaderKbps, setFilterHeaderKbps] = useState('ALL');
    const [filterHeaderQuality, setFilterHeaderQuality] = useState('ALL');
    const [filterHeaderLoss, setFilterHeaderLoss] = useState('ALL');
    const [filterHeaderCutoff, setFilterHeaderCutoff] = useState('ALL');
    const [filterHeaderLufs, setFilterHeaderLufs] = useState('ALL');
    const [filterHeaderDuration, setFilterHeaderDuration] = useState('');
    const [filterHeaderBpm, setFilterHeaderBpm] = useState('');
    const [filterHeaderKey, setFilterHeaderKey] = useState('');
    const [filterHeaderCues, setFilterHeaderCues] = useState('ALL');
    const [filterHeaderStatus, setFilterHeaderStatus] = useState('ALL');
    const [filterHeaderEnergy, setFilterHeaderEnergy] = useState('ALL');
    const [filterHeaderDance, setFilterHeaderDance] = useState('ALL');
    const [filterHeaderPhase, setFilterHeaderPhase] = useState('ALL');
    const [filterHeaderGenre, setFilterHeaderGenre] = useState('');
    const [filterHeaderSubgenre, setFilterHeaderSubgenre] = useState('');
    const [filterHeaderComment, setFilterHeaderComment] = useState('');

    // Visibilidad de Columnas con persistencia en localStorage y categorización tematica
    const DEFAULT_AUDIT_COLUMNS = {
        id: true,
        waveform: true,
        title: true,
        artist: true,
        genre: true,
        subgenre: true,
        format: true,
        sample_rate_khz: true,
        bitrate_kbps: true,
        calidad: true,
        perdida_pct: true,
        cutoff_khz: true,
        lufs: true,
        duration: true,
        bpm: true,
        key: true,
        beatgrid_status: true,
        trim_silences: true,
        cues: true,
        e: true,
        dance: true,
        intensity: true,
        valence: true,
        fase_badge: true,
        acoustic_role: true,
        comment: true,
        status: true,
        actions: true,
    };

    const COLUMN_CATEGORIES = [
        {
            id: 'identity',
            name: 'Identificación Básica',
            icon: '🎵',
            color: 'text-djcyan-400',
            columns: [
                { key: 'id', label: '# ID & Checkbox', desc: 'Identificador y selector de lote' },
                { key: 'waveform', label: 'Waveform Espectral', desc: 'Forma de onda corporativa interactiva' },
                { key: 'title', label: 'Archivo / Título', desc: 'Nombre del archivo o título ID3' },
                { key: 'artist', label: 'Artista', desc: 'Intérprete o creador principal' },
                { key: 'genre', label: 'Género Musical', desc: 'Clasificación electrónica primaria' },
                { key: 'subgenre', label: 'Subgénero', desc: 'Taxonomía electrónica de precisión' },
            ]
        },
        {
            id: 'performance',
            name: 'Rendimiento en Cabina DJ',
            icon: '🎛️',
            color: 'text-purple-400',
            columns: [
                { key: 'bpm', label: 'Tempo Real (BPM)', desc: 'Velocidad con Zero-Crossing y Beatgrid' },
                { key: 'key', label: 'Tonalidad Camelot', desc: 'Rueda armónica Camelot (ej. 8A = Am)' },
                { key: 'beatgrid_status', label: 'Estado Beatgrid', desc: 'Alineación de downbeat y detección de drift rítmico' },
                { key: 'trim_silences', label: 'Silencios / Auto-Trim', desc: 'Espacio muerto inicial y cola final recortados' },
                { key: 'cues', label: 'Hot Cues 1-8', desc: '8 saltos tácticos (Intro, Drops, Breaks, Outro)' },
                { key: 'fase_badge', label: 'Fase DJ / Mood', desc: 'Momento de sesión (Warm-Up, Peak, Cierre)' },
                { key: 'acoustic_role', label: 'Rol Acústico', desc: 'Función en mezcla (Bass Driver, Lead, Perc.)' },
            ]
        },
        {
            id: 'quality',
            name: 'Calidad & Análisis Espectral',
            icon: '🔬',
            color: 'text-emerald-400',
            columns: [
                { key: 'format', label: 'Formato Audio', desc: 'Extensión y códec (FLAC, MP3, WAV, AIFF)' },
                { key: 'sample_rate_khz', label: 'Frecuencia (kHz)', desc: 'Tasa de muestreo (44.1, 48, 96 kHz)' },
                { key: 'bitrate_kbps', label: 'Bitrate (kbps)', desc: 'Tasa de bits real calculada' },
                { key: 'calidad', label: 'Calidad Master', desc: 'Certificación acústica y pureza sonora' },
                { key: 'perdida_pct', label: 'Pérdida / Transcode', desc: 'Pérdida de espectro respecto a máster' },
                { key: 'cutoff_khz', label: 'Corte FFT (Cutoff)', desc: 'Frecuencia de agudos para cazar fakes' },
            ]
        },
        {
            id: 'metadata',
            name: 'Dinámica & Metadatos Pro',
            icon: '📊',
            color: 'text-amber-400',
            columns: [
                { key: 'lufs', label: 'LUFS & True Peak', desc: 'Sonoridad EBU R128 y pico dBFS de club' },
                { key: 'duration', label: 'Duración (Time)', desc: 'Tiempo total de reproducción MM:SS' },
                { key: 'e', label: 'Energía (⚡ %)', desc: 'Intensidad acústica percibida de 0 a 100%' },
                { key: 'dance', label: 'Bailabilidad (🕺 %)', desc: 'Regularidad rítmica para pista de baile' },
                { key: 'intensity', label: 'Intensidad (🔥 %)', desc: 'Nivel de excitación y pegada acústica (Arousal)' },
                { key: 'valence', label: 'Positividad (✨ %)', desc: 'Valencia emocional y brillo positivo (Valence)' },
                { key: 'comment', label: 'Comentario Pro', desc: 'Tag táctico formateado para display CDJ' },
                { key: 'status', label: 'Estado Global', desc: 'Veredicto de auditoría (Lossless, MP3, Fake)' },
                { key: 'actions', label: 'Acción Quitar', desc: 'Botón rápido para retirar pista de lista' },
            ]
        }
    ];

    const [visibleColumns, setVisibleColumns] = useState(() => {
        try {
            const saved = localStorage.getItem('bw_audit_visible_columns');
            if (saved) return { ...DEFAULT_AUDIT_COLUMNS, ...JSON.parse(saved) };
        } catch (_) {}
        return DEFAULT_AUDIT_COLUMNS;
    });

    const [columnSelectorOpen, setColumnSelectorOpen] = useState(false);
    const [columnSearchText, setColumnSearchText] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);

    // Estado y Persistencia Jerárquica de Carpetas y Crates
    const [libraryFolders, setLibraryFolders] = useState(() => {
        try {
            const saved = localStorage.getItem('bw_library_folders_v2');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (_) {}
        return [
            { id: 'f_warm', name: '01 - Warm Up (120-124 BPM)', color: 'amber', collapsed: false, trackIds: [], subfolders: [] },
            { id: 'f_peak', name: '02 - Peak Time (125-130 BPM)', color: 'rose', collapsed: false, trackIds: [], subfolders: [] },
            { id: 'f_deep', name: '03 - Deep & Melodic', color: 'purple', collapsed: false, trackIds: [], subfolders: [] },
            { id: 'f_close', name: '04 - Closing & Anthems', color: 'cyan', collapsed: false, trackIds: [], subfolders: [] }
        ];
    });
    const [selectedFolderId, setSelectedFolderId] = useState('all');
    const [isFolderSidebarOpen, setIsFolderSidebarOpen] = useState(true);
    const [folderMoveMenuOpen, setFolderMoveMenuOpen] = useState(false);
    const [cloudSyncStatus, setCloudSyncStatus] = useState({ isSyncing: false, synced: false, lastSyncText: '' });

    const handleCloudMetadataSync = async () => {
        setCloudSyncStatus({ isSyncing: true, synced: false, lastSyncText: 'Sincronizando...' });
        try {
            if (window.BeatWaveSync && window.BeatWaveSync.push) {
                const res = await window.BeatWaveSync.push("Mi Biblioteca DJ", libraryFolders, tracks);
                if (res && res.status === 'success') {
                    setCloudSyncStatus({
                        isSyncing: false,
                        synced: true,
                        lastSyncText: `✓ ${res.total_tracks} tracks (${res.payload_size_kb} KB)`
                    });
                    setSaveFeedback(`☁️ Sincronizados ${res.total_tracks} tracks (${res.payload_size_kb} KB) en la nube sin transferir audio`);
                    setTimeout(() => setSaveFeedback(null), 5000);
                } else {
                    setCloudSyncStatus({ isSyncing: false, synced: false, lastSyncText: 'Error sync' });
                }
            } else {
                setCloudSyncStatus({ isSyncing: false, synced: true, lastSyncText: 'Local OK' });
            }
        } catch (e) {
            console.error("Error en sync cloud:", e);
            setCloudSyncStatus({ isSyncing: false, synced: false, lastSyncText: 'Fallo sync' });
        }
    };

    const saveFolders = (newFolders) => {
        setLibraryFolders(newFolders);
        try {
            localStorage.setItem('bw_library_folders_v2', JSON.stringify(newFolders));
        } catch (_) {}
    };

    const handleAddFolder = (name, colorId = 'cyan') => {
        const newF = {
            id: `f_${Date.now()}`,
            name,
            color: colorId,
            collapsed: false,
            trackIds: [],
            subfolders: []
        };
        saveFolders([...libraryFolders, newF]);
        setSaveFeedback(`✓ Carpeta "${name}" creada`);
    };

    const handleAddSubfolder = (parentId, name, colorId = null) => {
        const updateTree = (list) => list.map(f => {
            if (f.id === parentId) {
                const sub = {
                    id: `sub_${Date.now()}`,
                    name,
                    color: colorId || f.color,
                    trackIds: [],
                    subfolders: []
                };
                return { ...f, collapsed: false, subfolders: [...(f.subfolders || []), sub] };
            }
            return f;
        });
        saveFolders(updateTree(libraryFolders));
        setSaveFeedback(`✓ Subcarpeta "${name}" creada`);
    };

    const handleRenameFolder = (folderId, newName) => {
        const updateTree = (list) => list.map(f => {
            if (f.id === folderId) return { ...f, name: newName };
            if (f.subfolders) {
                return {
                    ...f,
                    subfolders: f.subfolders.map(s => s.id === folderId ? { ...s, name: newName } : s)
                };
            }
            return f;
        });
        saveFolders(updateTree(libraryFolders));
        setSaveFeedback(`✓ Renombrada a "${newName}"`);
    };

    const handleChangeFolderColor = (folderId, newColor) => {
        const updateTree = (list) => list.map(f => {
            if (f.id === folderId) return { ...f, color: newColor };
            if (f.subfolders) {
                return {
                    ...f,
                    subfolders: f.subfolders.map(s => s.id === folderId ? { ...s, color: newColor } : s)
                };
            }
            return f;
        });
        saveFolders(updateTree(libraryFolders));
    };

    const handleDeleteFolder = (folderId) => {
        const filterTree = (list) => list
            .filter(f => f.id !== folderId)
            .map(f => ({
                ...f,
                subfolders: f.subfolders ? f.subfolders.filter(s => s.id !== folderId) : []
            }));
        saveFolders(filterTree(libraryFolders));
        if (selectedFolderId === folderId) setSelectedFolderId('all');
        setSaveFeedback(`✓ Carpeta eliminada`);
    };

    const handleToggleFolderCollapse = (folderId) => {
        const updateTree = (list) => list.map(f => {
            if (f.id === folderId) return { ...f, collapsed: !f.collapsed };
            return f;
        });
        saveFolders(updateTree(libraryFolders));
    };

    const handleAssignTracksToFolder = (targetFolderId, trackKeys) => {
        if (!trackKeys || trackKeys.length === 0) return;
        const keySet = new Set(trackKeys);
        const updateTree = (list) => list.map(f => {
            if (f.id === targetFolderId) {
                const currentSet = new Set(f.trackIds || []);
                keySet.forEach(k => currentSet.add(k));
                return { ...f, trackIds: Array.from(currentSet) };
            }
            if (f.subfolders) {
                return {
                    ...f,
                    subfolders: f.subfolders.map(s => {
                        if (s.id === targetFolderId) {
                            const currentSet = new Set(s.trackIds || []);
                            keySet.forEach(k => currentSet.add(k));
                            return { ...s, trackIds: Array.from(currentSet) };
                        }
                        return s;
                    })
                };
            }
            return f;
        });
        saveFolders(updateTree(libraryFolders));
        const target = findFolderOrSub(libraryFolders, targetFolderId);
        setSaveFeedback(`✓ ${trackKeys.length} pistas asignadas a "${target?.folder?.name || 'carpeta'}"`);
    };

    const handleAutoGroupByGenre = () => {
        if (!tracks || tracks.length === 0) {
            alert("Carga pistas en la colección para auto-organizar por género.");
            return;
        }
        const genreMap = new Map();
        tracks.forEach(t => {
            const trId = t.id !== undefined ? t.id : (t.file_path || t.filename);
            const g = (t.genre || 'Sin Género').trim();
            const sg = (t.subgenre || '').trim();
            if (!genreMap.has(g)) {
                genreMap.set(g, { subgenres: new Map(), trackIds: new Set() });
            }
            const gEntry = genreMap.get(g);
            gEntry.trackIds.add(trId);
            if (sg && sg.toLowerCase() !== g.toLowerCase()) {
                if (!gEntry.subgenres.has(sg)) {
                    gEntry.subgenres.set(sg, new Set());
                }
                gEntry.subgenres.get(sg).add(trId);
            }
        });

        const newFolders = [];
        let colorIdx = 0;
        genreMap.forEach((gData, gName) => {
            const color = FOLDER_COLORS[colorIdx % FOLDER_COLORS.length].id;
            colorIdx++;
            const subfolders = [];
            let subColorIdx = 0;
            gData.subgenres.forEach((subTrackIds, subName) => {
                subfolders.push({
                    id: `f_auto_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                    name: subName,
                    color: FOLDER_COLORS[(colorIdx + subColorIdx) % FOLDER_COLORS.length].id,
                    trackIds: Array.from(subTrackIds),
                    subfolders: []
                });
                subColorIdx++;
            });

            newFolders.push({
                id: `f_auto_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                name: gName,
                color,
                collapsed: false,
                trackIds: Array.from(gData.trackIds),
                subfolders
            });
        });

        saveFolders(newFolders);
        setSaveFeedback(`✓ Auto-organizado en ${newFolders.length} géneros y subcarpetas`);
    };

    const handleMaterializarFoldersEnDisco = async () => {
        if (!libraryFolders || libraryFolders.length === 0) {
            alert("No hay carpetas para exportar a disco.");
            return;
        }
        const destino = await solicitarCarpetaDestino(`Selecciona la carpeta base donde crear la copia estructurada de tus carpetas:`);
        if (!destino) return;

        const estructura = [];
        libraryFolders.forEach(f => {
            const folderKeys = new Set(f.trackIds || []);
            const fTracks = tracks.filter(t => folderKeys.has(t.id) || folderKeys.has(t.file_path) || folderKeys.has(t.filename));
            if (fTracks.length > 0) {
                estructura.push({ folder_name: f.name, tracks: fTracks });
            }
            if (f.subfolders) {
                f.subfolders.forEach(sub => {
                    const subKeys = new Set(sub.trackIds || []);
                    const subTracks = tracks.filter(t => subKeys.has(t.id) || subKeys.has(t.file_path) || subKeys.has(t.filename));
                    if (subTracks.length > 0) {
                        estructura.push({ folder_name: `${f.name}/${sub.name}`, tracks: subTracks });
                    }
                });
            }
        });

        if (estructura.length === 0) {
            alert("Asigna pistas a las carpetas antes de crear la copia en disco.");
            return;
        }

        setIsExporting(true);
        setBatchProgress(20);
        setBatchStatusMsg(`Copiando biblioteca estructurada en disco...`);
        try {
            if (true) {
                const res = await apiClient.rpc('crear_biblioteca_en_disco', "Coleccion_Organizada", estructura, destino);
                setBatchProgress(100);
                if (res && res.status === 'ok') {
                    setBatchStatusMsg(`✓ Creada en: ${res.base_dir}`);
                    setSaveFeedback(`✓ ${res.total_copied} pistas organizadas copiadas`);
                    alert(`¡Carpetas creadas con éxito en disco!

Ubicación: ${res.base_dir}
Pistas copiadas: ${res.total_copied}

Tus archivos originales de respaldo permanecen 100% intactos.`);
                } else {
                    alert(res?.msg || "Error al crear la estructura en disco.");
                }
            }
        } catch (err) {
            console.error("Error materializando carpetas:", err);
            alert("Error al exportar carpetas.");
        } finally {
            setTimeout(() => {
                setIsExporting(false);
                setBatchProgress(0);
                setBatchStatusMsg('');
            }, 800);
        }
    };

    // Lista plana de carpetas para el menú de mover
    const foldersFlatList = useMemo(() => {
        const list = [];
        libraryFolders.forEach(f => {
            list.push({ id: f.id, name: f.name, color: f.color, isSub: false });
            if (f.subfolders) {
                f.subfolders.forEach(s => {
                    list.push({ id: s.id, name: `↳ ${s.name}`, color: s.color || f.color, isSub: true, parentName: f.name });
                });
            }
        });
        return list;
    }, [libraryFolders]);

    const activeFolderMeta = useMemo(() => {
        if (!selectedFolderId || selectedFolderId === 'all') return null;
        const target = findFolderOrSub(libraryFolders, selectedFolderId);
        if (!target || !target.folder) return null;
        const col = getColorObj(target.folder.color);
        return {
            name: target.parent ? `${target.parent.name} / ${target.folder.name}` : target.folder.name,
            dotClass: col.dot
        };
    }, [selectedFolderId, libraryFolders]);

    const toggleColumnVisibility = (colKey) => {
        setVisibleColumns(prev => {
            const next = { ...prev, [colKey]: !prev[colKey] };
            try { localStorage.setItem('bw_audit_visible_columns', JSON.stringify(next)); } catch (_) {}
            return next;
        });
    };

    const setColumnPreset = (preset) => {
        let next = { ...DEFAULT_AUDIT_COLUMNS };
        if (preset === 'all') {
            Object.keys(next).forEach(k => { next[k] = true; });
        } else if (preset === 'none') {
            Object.keys(next).forEach(k => { next[k] = false; });
            next.title = true; // Mantener al menos el título
        } else if (preset === 'dj') {
            Object.keys(next).forEach(k => { next[k] = false; });
            ['id', 'waveform', 'title', 'artist', 'bpm', 'key', 'cues', 'fase_badge'].forEach(k => { next[k] = true; });
        } else if (preset === 'audio') {
            Object.keys(next).forEach(k => { next[k] = false; });
            ['id', 'title', 'format', 'sample_rate_khz', 'bitrate_kbps', 'calidad', 'cutoff_khz', 'perdida_pct', 'lufs'].forEach(k => { next[k] = true; });
        } else if (preset === 'tags') {
            Object.keys(next).forEach(k => { next[k] = false; });
            ['id', 'title', 'artist', 'genre', 'subgenre', 'comment', 'status'].forEach(k => { next[k] = true; });
        } else if (preset === 'reset') {
            next = { ...DEFAULT_AUDIT_COLUMNS };
        }
        setVisibleColumns(next);
        try { localStorage.setItem('bw_audit_visible_columns', JSON.stringify(next)); } catch (_) {}
    };

    const handleSortAudit = (field) => {
        setAuditSortDir(prev => auditSortField === field && prev === 'asc' ? 'desc' : 'asc');
        setAuditSortField(field);
    };

    const renderSortArrowAudit = (field) => {
        if (auditSortField !== field) return <span className="text-gray-600 ml-1 text-[9px]">↕</span>;
        return <span className="text-djcyan-400 ml-1 font-bold text-[10px]">{auditSortDir === 'asc' ? '▲' : '▼'}</span>;
    };

    const hasActiveHeaderFilters = Boolean(
        filterHeaderSearch || 
        filterHeaderArtist || 
        filterHeaderGenre || 
        filterHeaderSubgenre || 
        filterHeaderFormat !== 'ALL' || 
        filterHeaderQuality !== 'ALL' || 
        filterHeaderStatus !== 'ALL' || 
        filterHeaderEnergy !== 'ALL' || 
        filterHeaderDance !== 'ALL' || 
        filterHeaderAcousticRole !== 'ALL' || 
        filterHeaderKhz !== 'ALL' || 
        filterHeaderKbps !== 'ALL' || 
        filterHeaderLoss !== 'ALL' || 
        filterHeaderCutoff !== 'ALL' || 
        filterHeaderLufs !== 'ALL' || 
        filterHeaderDuration || 
        filterHeaderBpm || 
        filterHeaderKey || 
        filterHeaderCues !== 'ALL' || 
        filterHeaderPhase !== 'ALL' || 
        filterHeaderComment
    );

    const handleResetAllHeaderFilters = () => {
        setFilterHeaderSearch('');
        setFilterHeaderArtist('');
        setFilterHeaderGenre('');
        setFilterHeaderSubgenre('');
        setFilterHeaderFormat('ALL');
        setFilterHeaderQuality('ALL');
        setFilterHeaderStatus('ALL');
        setFilterHeaderEnergy('ALL');
        setFilterHeaderDance('ALL');
        setFilterHeaderAcousticRole('ALL');
        setFilterHeaderKhz('ALL');
        setFilterHeaderKbps('ALL');
        setFilterHeaderLoss('ALL');
        setFilterHeaderCutoff('ALL');
        setFilterHeaderLufs('ALL');
        setFilterHeaderDuration('');
        setFilterHeaderBpm('');
        setFilterHeaderKey('');
        setFilterHeaderCues('ALL');
        setFilterHeaderPhase('ALL');
        setFilterHeaderComment('');
    };

    // ─── PASO 3: ÍNDICE INVERTIDO EN MEMORIA RAM PARA BÚSQUEDA INSTANTÁNEA (<1ms) ───
    const searchIndex = useMemo(() => {
        if (!tracks || tracks.length === 0) return null;
        const tokenMap = new Map();
        const tokenize = (str) => {
            if (!str) return [];
            return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[\s\-_.,/()[\]+&]+/);
        };
        for (let i = 0; i < tracks.length; i++) {
            const t = tracks[i];
            const id = t.id !== undefined ? t.id : i;
            const terms = [
                ...tokenize(t.t || t.title),
                ...tokenize(t.a || t.artist),
                ...tokenize(t.genre),
                ...tokenize(t.subgenre),
                ...tokenize(t.k || t.key),
                ...tokenize(t.f || t.filename)
            ];
            for (const term of terms) {
                if (!term || term.length < 2) continue;
                let s = tokenMap.get(term);
                if (!s) {
                    s = new Set();
                    tokenMap.set(term, s);
                }
                s.add(id);
            }
        }
        return tokenMap;
    }, [tracks]);

    const searchBenchmarkRef = useRef(0.2);

    const tracksFiltrados = useMemo(() => {
        const benchStart = performance.now();
        const parsed = (busqueda && busqueda.length > 2) ? parseAIDJQuery(busqueda) : null;

        let baseTracks = tracks;

        // Filtrado por Crate Virtual Activo procedente de Librería
        if (activeCrateFilter && activeCrateFilter.trackKeys && activeCrateFilter.trackKeys.size > 0) {
            baseTracks = baseTracks.filter(t => {
                const k = t.id !== undefined ? t.id : (t.file_path || t.filename);
                return activeCrateFilter.trackKeys.has(k) || activeCrateFilter.trackKeys.has(t.file_path) || activeCrateFilter.trackKeys.has(t.filename);
            });
        } else if (selectedFolderId && selectedFolderId !== 'all') {
            const target = findFolderOrSub(libraryFolders, selectedFolderId);
            if (target && target.folder) {
                const allowedKeys = getFolderTrackKeysSet(target.folder);
                baseTracks = baseTracks.filter(t => {
                    const k = t.id !== undefined ? t.id : (t.file_path || t.filename);
                    return allowedKeys.has(k) || allowedKeys.has(t.file_path) || allowedKeys.has(t.filename);
                });
            }
        }

        const rawTerm = busqueda.trim().toLowerCase();
        let candidateIds = null;

        // Búsqueda instantánea en RAM <1ms usando el índice invertido (si no es IA query con BPM/Key)
        if (rawTerm.length >= 2 && !parsed && searchIndex) {
            const cleanTerm = rawTerm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const searchTokens = cleanTerm.split(/\s+/).filter(t => t.length >= 2);
            if (searchTokens.length > 0) {
                for (const tok of searchTokens) {
                    let matchedSet = new Set();
                    for (const [indexedToken, idSet] of searchIndex.entries()) {
                        if (indexedToken.startsWith(tok) || indexedToken.includes(tok)) {
                            idSet.forEach(id => matchedSet.add(id));
                        }
                    }
                    if (candidateIds === null) {
                        candidateIds = matchedSet;
                    } else {
                        const intersection = new Set();
                        matchedSet.forEach(id => {
                            if (candidateIds.has(id)) intersection.add(id);
                        });
                        candidateIds = intersection;
                    }
                    if (candidateIds.size === 0) break;
                }
            }
        }

        let result = baseTracks.filter((t, i) => {
            const term = rawTerm;

            // Poda ultrarrápida O(1) con índice invertido
            if (candidateIds !== null) {
                const k = t.id !== undefined ? t.id : i;
                if (!candidateIds.has(k)) return false;
            }

            // Filtrado determinista en memoria mediante parseAIDJQuery
            if (parsed && parsed.tokens && parsed.tokens.length > 0) {
                // 1. Matching de BPM con rango ±3
                if (parsed.targetBpm) {
                    const trkBpm = parseFloat(t?.bpm || t?.b) || 0;
                    if (trkBpm > 0 && Math.abs(trkBpm - parsed.targetBpm) > 4.5) return false;
                } else if (parsed.minBpm && parsed.maxBpm) {
                    const trkBpm = parseFloat(t?.bpm || t?.b) || 0;
                    if (trkBpm < parsed.minBpm || trkBpm > parsed.maxBpm) return false;
                }
                // 2. Matching de Tonalidad Camelot
                if (parsed.key) {
                    const trkKey = (t?.key || t?.k || '').toUpperCase();
                    if (trkKey !== parsed.key && !parsed.compatibleKeys.includes(trkKey)) return false;
                }
                // 3. Matching de Rol Acústico
                if (parsed.acousticRole) {
                    if (t?.acoustic_role !== parsed.acousticRole) return false;
                }
                // 4. Matching de Energía
                if (parsed.minEnergy) {
                    const trkE = Number(t?.e || t?.energy || 80);
                    if (trkE < parsed.minEnergy) return false;
                }
                if (parsed.maxEnergy) {
                    const trkE = Number(t?.e || t?.energy || 80);
                    if (trkE > parsed.maxEnergy) return false;
                }
                // 5. Matching de Género / Versión
                if (parsed.subgenre) {
                    const sub = (t?.subgenre || t?.genre || '').toLowerCase();
                    if (!sub.includes(parsed.subgenre.toLowerCase())) return false;
                } else if (parsed.genre) {
                    const g = (t?.genre || '').toLowerCase();
                    if (!g.includes(parsed.genre.toLowerCase())) return false;
                }
            } else {
                const m = (t?.t || t?.title || '').toLowerCase().includes(term) || (t?.a || t?.artist || '').toLowerCase().includes(term) || (t?.f || t?.filename || '').toLowerCase().includes(term);
                if (!m) return false;
            }
            if (filtro === 'missing') return (t?.b === '--' || t?.k === '--');
            if (filtro === 'missing_title') return Boolean(t?.missing_title || !t?.title || t?.title.toLowerCase().trim() === 'untitled');
            if (filtro === 'missing_artist') return Boolean(t?.missing_artist || !t?.artist || t?.artist.toLowerCase().trim() === 'desconocido');
            if (filtro === 'missing_cover') return Boolean(t?.missing_cover === true || (!t?.cover && !t?.has_cover));
            if (filtro === 'missing_meta') return !t?.title || !t?.t || String(t?.title || t?.t).toLowerCase().trim() === 'untitled' || !t?.artist || !t?.a || String(t?.artist || t?.a).toLowerCase().trim() === 'desconocido';
            if (filtro === 'missing_cues') return !t?.cues || (Array.isArray(t?.cues) && t?.cues.length === 0) || !t?.hotcues;
            if (filtro === 'silences_trimmed') return Boolean((t?.trim_start_ms && t?.trim_start_ms > 0) || t?.silence_trimmed || t?.zero_cross_trim);
            if (filtro === 'excellent_quality') return !isBadQualityTrack(t) && (t?.format === 'FLAC' || t?.format === 'WAV' || t?.format === 'AIFF' || (t?.bitrate_kbps && t?.bitrate_kbps >= 320));
            if (filtro === 'high_energy') return Number(t?.e || t?.energy || 0) >= 75;
            if (filtro === 'error') return Boolean(t?.es_fake) || (t?.format === 'FLAC' && String(t?.status || '').includes('Fake'));
            if (filtro === 'bad_quality') return isBadQualityTrack(t);

            // Filtros de Cabecera (TODAS LAS COLUMNAS)
            if (filterHeaderSearch) {
                const hTerm = filterHeaderSearch.toLowerCase();
                const matchHeader = (t?.t || t?.title || '').toLowerCase().includes(hTerm) || (t?.f || t?.filename || '').toLowerCase().includes(hTerm);
                if (!matchHeader) return false;
            }
            if (filterHeaderArtist) {
                const aTerm = filterHeaderArtist.toLowerCase();
                if (!(t?.a || t?.artist || '').toLowerCase().includes(aTerm)) return false;
            }
            if (filterHeaderFormat !== 'ALL') {
                if (String(t?.format || '').toUpperCase() !== filterHeaderFormat) return false;
            }
            if (filterHeaderKhz !== 'ALL') {
                const khzVal = String(t?.sample_rate_khz || '');
                if (!khzVal.includes(filterHeaderKhz)) return false;
            }
            if (filterHeaderKbps !== 'ALL') {
                const kbpsVal = Number(t?.bitrate_kbps || 0);
                if (filterHeaderKbps === '320' && kbpsVal < 320) return false;
                if (filterHeaderKbps === 'LOSSLESS' && kbpsVal < 700) return false;
                if (filterHeaderKbps === 'LOW' && kbpsVal >= 320) return false;
            }
            if (filterHeaderQuality !== 'ALL') {
                if (!String(t?.calidad || '').toLowerCase().includes(filterHeaderQuality.toLowerCase())) return false;
            }
            if (filterHeaderLoss !== 'ALL') {
                const isSinPerdida = t?.perdida === 'Sin Pérdida' && !t?.es_fake;
                if (filterHeaderLoss === 'SIN_PERDIDA' && !isSinPerdida) return false;
                if (filterHeaderLoss === 'CON_PERDIDA' && isSinPerdida) return false;
            }
            if (filterHeaderCutoff !== 'ALL') {
                const cutoff = Number(t?.cutoff_khz || 0);
                if (filterHeaderCutoff === 'PASS' && cutoff > 0 && cutoff < 20) return false;
                if (filterHeaderCutoff === 'CUT' && cutoff > 0 && cutoff >= 20) return false;
            }
            if (filterHeaderLufs !== 'ALL') {
                if (filterHeaderLufs === 'CLIP' && !t?.clipping) return false;
                if (filterHeaderLufs === 'LOUD' && Number(t?.lufs || -9) < -7) return false;
                if (filterHeaderLufs === 'QUIET' && Number(t?.lufs || -9) > -14) return false;
            }
            if (filterHeaderDuration) {
                const durTerm = filterHeaderDuration.toLowerCase();
                if (!String(t?.duration || '').toLowerCase().includes(durTerm)) return false;
            }
            if (filterHeaderBpm) {
                const bpmTerm = filterHeaderBpm.trim();
                const trkBpm = parseFloat(t?.bpm || t?.b) || 0;
                if (bpmTerm.startsWith('>')) {
                    const min = parseFloat(bpmTerm.slice(1)) || 0;
                    if (trkBpm < min) return false;
                } else if (bpmTerm.startsWith('<')) {
                    const max = parseFloat(bpmTerm.slice(1)) || 999;
                    if (trkBpm > max) return false;
                } else {
                    const target = parseFloat(bpmTerm);
                    if (target && Math.abs(trkBpm - target) > 2.5) return false;
                }
            }
            if (filterHeaderKey) {
                const keyTerm = filterHeaderKey.trim().toUpperCase();
                const trkKey = (t?.key || t?.k || '').toUpperCase();
                if (!trkKey.includes(keyTerm)) return false;
            }
            if (filterHeaderCues !== 'ALL') {
                const hasCues = Boolean(t?.cues && Array.isArray(t?.cues) && t?.cues.length > 0) || Boolean(t?.hotcues);
                if (filterHeaderCues === 'YES' && !hasCues) return false;
                if (filterHeaderCues === 'NO' && hasCues) return false;
            }
            if (filterHeaderStatus !== 'ALL') {
                const isFake = Boolean(t?.es_fake || (t?.format === 'FLAC' && String(t?.status || '').includes('Fake')));
                if (filterHeaderStatus === 'FAKE' && !isFake) return false;
                if (filterHeaderStatus === 'LOSSLESS' && (isFake || (!String(t?.status || '').includes('Lossless') && !String(t?.status || '').includes('VERDADERO') && !String(t?.status || '').includes('HI-RES')))) return false;
                if (filterHeaderStatus === 'MP3' && (t?.format !== 'MP3' && !String(t?.status || '').includes('MP3'))) return false;
            }
            if (filterHeaderEnergy !== 'ALL') {
                const eVal = Number(t?.e || t?.energy || 80);
                if (filterHeaderEnergy === 'HIGH' && eVal < 80) return false;
                if (filterHeaderEnergy === 'MED' && (eVal < 65 || eVal >= 80)) return false;
                if (filterHeaderEnergy === 'LOW' && eVal >= 65) return false;
            }
            if (filterHeaderDance !== 'ALL') {
                const dVal = Number(t?.dance || t?.danceability || 80);
                if (filterHeaderDance === 'HIGH' && dVal < 80) return false;
                if (filterHeaderDance === 'MED' && (dVal < 65 || dVal >= 80)) return false;
                if (filterHeaderDance === 'LOW' && dVal >= 65) return false;
            }
            if (filterHeaderPhase !== 'ALL') {
                const p = String(t?.fase_badge || '');
                if (!p.toUpperCase().includes(filterHeaderPhase.toUpperCase())) return false;
            }
            if (filterHeaderGenre) {
                const gTerm = filterHeaderGenre.toLowerCase();
                const trkGenre = (t?.genre || 'House').toLowerCase();
                if (!trkGenre.includes(gTerm)) return false;
            }
            if (filterHeaderSubgenre) {
                const sgTerm = filterHeaderSubgenre.toLowerCase();
                const trkSubgenre = (t?.subgenre || (TAXONOMY_TREE[t?.genre || 'Tech House'] ? TAXONOMY_TREE[t?.genre || 'Tech House'][0] : 'Tech House')).toLowerCase();
                if (!trkSubgenre.includes(sgTerm)) return false;
            }
            if (filterHeaderAcousticRole !== 'ALL') {
                if (t?.acoustic_role !== filterHeaderAcousticRole) return false;
            }
            if (filterHeaderComment) {
                const cTerm = filterHeaderComment.toLowerCase();
                if (!(t?.comment || '').toLowerCase().includes(cTerm)) return false;
            }
            return true;
        });

        result.sort((a, b) => {
            let valA = a[auditSortField];
            let valB = b[auditSortField];

            if (auditSortField === 'title') {
                valA = a.t || a.title || '';
                valB = b.t || b.title || '';
            } else if (auditSortField === 'artist') {
                valA = a.a || a.artist || '';
                valB = b.a || b.artist || '';
            } else if (auditSortField === 'genre') {
                valA = a.genre || 'House';
                valB = b.genre || 'House';
            } else if (auditSortField === 'subgenre') {
                valA = a.subgenre || (TAXONOMY_TREE[a.genre || 'Tech House'] ? TAXONOMY_TREE[a.genre || 'Tech House'][0] : 'Tech House');
                valB = b.subgenre || (TAXONOMY_TREE[b.genre || 'Tech House'] ? TAXONOMY_TREE[b.genre || 'Tech House'][0] : 'Tech House');
            } else if (auditSortField === 'bpm') {
                valA = parseFloat(a.b || a.bpm) || 0;
                valB = parseFloat(b.b || b.bpm) || 0;
            } else if (auditSortField === 'key') {
                valA = a.k || a.key || '';
                valB = b.k || b.key || '';
            } else if (auditSortField === 'duration') {
                const parseSec = (d) => {
                    if (!d || !d.includes(':')) return 0;
                    const p = d.split(':');
                    return parseInt(p[0]) * 60 + parseFloat(p[1]);
                };
                valA = parseSec(a.duration);
                valB = parseSec(b.duration);
            } else if (['id', 'cutoff_khz', 'sample_rate_khz', 'bitrate_kbps', 'e', 'dance'].includes(auditSortField)) {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
            } else if (auditSortField === 'fase_badge' || auditSortField === 'mood') {
                valA = a.fase_badge || a.mood || '';
                valB = b.fase_badge || b.mood || '';
            } else if (auditSortField === 'comment') {
                valA = a.comment || '';
                valB = b.comment || '';
            }

            if (typeof valA === 'number' && typeof valB === 'number') {
                return auditSortDir === 'asc' ? valA - valB : valB - valA;
            }
            return auditSortDir === 'asc' 
                ? String(valA || '').localeCompare(String(valB || '')) 
                : String(valB || '').localeCompare(String(valA || ''));
        });

        searchBenchmarkRef.current = Math.max(0.1, Number((performance.now() - benchStart).toFixed(2)));

        return result;
    }, [tracks, busqueda, filtro, filterHeaderSearch, filterHeaderArtist, filterHeaderGenre, filterHeaderSubgenre, filterHeaderFormat, filterHeaderQuality, filterHeaderStatus, filterHeaderEnergy, filterHeaderDance, filterHeaderAcousticRole, filterHeaderKhz, filterHeaderKbps, filterHeaderLoss, filterHeaderCutoff, filterHeaderLufs, filterHeaderDuration, filterHeaderBpm, filterHeaderKey, filterHeaderCues, filterHeaderPhase, filterHeaderComment, auditSortField, auditSortDir, selectedFolderId, libraryFolders, activeCrateFilter, searchIndex]);

    // PERF: Virtualización de filas — solo renderiza las visibles + buffer overscan
    const {
        visibleItems: virtualRows,
        paddingTop:   virtualPaddingTop,
        paddingBottom: virtualPaddingBottom,
        startIndex:   virtualStartIndex
    } = useVirtualRows(tracksFiltrados, tableScrollRef, 40, 5);

    const handleToggleSelectAllVisible = () => {
        const visibleIds = (tracksFiltrados || []).map(t => t.id);
        if (visibleIds.length === 0) return;
        const allVisibleSelected = visibleIds.every(id => selectedAuditIds.has(id));
        if (allVisibleSelected) {
            setSelectedAuditIds(prev => {
                const next = new Set(prev);
                visibleIds.forEach(id => next.delete(id));
                return next;
            });
        } else {
            setSelectedAuditIds(prev => {
                const next = new Set(prev);
                visibleIds.forEach(id => next.add(id));
                return next;
            });
        }
    };

    return (
        <div className="flex w-full h-full overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
                {/* 1. TOP BAR TÁCTICA: Ingesta, Contexto de Colección, Crear Biblioteca & Vista y Herramientas */}
                <div className="px-3.5 py-2 border-b border-djzinc-800 bg-[#09090f]/95 backdrop-blur flex items-center justify-between shrink-0 gap-3 z-20">
                    {/* IZQUIERDA: Contexto Activo de Biblioteca & Crear Biblioteca */}
                    <div data-tour="tour-audit-select" className="flex items-center gap-3 shrink-0">
                        <SectionTitle icon={Icons.AuditEye} title="Biblioteca" accent="Auditoría" />
                        {tracks && tracks.length > 0 && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-djzinc-900 border border-djzinc-750 text-xs font-mono text-gray-300 shadow-sm max-w-[200px] sm:max-w-[280px] truncate shrink-0" title={typeof rutaOrigen === 'string' ? rutaOrigen : 'Selección múltiple'}>
                                <span className="w-2 h-2 rounded-full bg-djgreen-400 shrink-0"></span>
                                <Icons.Folder size={14} className="inline-block align-[-2px] text-gray-400 text-[11px] shrink-0" />
                                <span className="truncate">
                                    {typeof rutaOrigen === 'string' && rutaOrigen ? (rutaOrigen.split('/').pop() || rutaOrigen) : 'Colección Activa'}
                                </span>
                                <span className="px-1.5 py-0.2 bg-djzinc-800 text-djcyan-300 font-bold rounded text-[10px] shrink-0 border border-djzinc-700">
                                    {tracks.length}
                                </span>
                            </div>
                        )}


                        {/* Menú Desplegable Mover Selección a Carpeta */}
                        {selectedAuditIds.size > 0 && (
                            <div className="relative shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setFolderMoveMenuOpen(prev => !prev)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/80 text-emerald-300 hover:text-white text-xs font-mono font-black cursor-pointer transition-all active:scale-95 shadow-md shadow-emerald-950/40 shrink-0"
                                    title="Mover o asignar las pistas seleccionadas a una carpeta"
                                >
                                    <Icons.Folder size={13} />
                                    <span>Mover a carpeta ({selectedAuditIds.size})</span>
                                    <Icons.ChevronDown size={11} />
                                </button>
                                {folderMoveMenuOpen && (
                                    <div 
                                        onClick={(e) => e.stopPropagation()} 
                                        className="absolute left-0 top-full mt-1.5 z-50 w-56 max-h-64 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1.5 font-mono text-xs space-y-0.5"
                                    >
                                        <div className="px-2 py-1 text-[10px] text-zinc-500 uppercase font-bold border-b border-zinc-800">
                                            Selecciona carpeta destino:
                                        </div>
                                        {foldersFlatList.map(item => {
                                            const col = getColorObj(item.color);
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => {
                                                        handleAssignTracksToFolder(item.id, Array.from(selectedAuditIds));
                                                        setFolderMoveMenuOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800 text-left text-zinc-200 hover:text-white transition-colors cursor-pointer"
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${col.dot} shrink-0`} />
                                                    <span className="truncate">{item.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* DERECHA: Vista y Herramientas (Columnas, HUD, Inspector) + Feedback & Cancelar */}
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                        {saveFeedback && (
                            <span className="text-xs font-mono text-djgreen-400 font-bold animate-pulse hidden md:inline">
                                {saveFeedback}
                            </span>
                        )}

                        {/* Grupo Vista y Herramientas (Alineado a la derecha en la barra superior) */}
                        <div className="flex items-center gap-1.5 bg-djzinc-950/80 p-0.5 rounded-xl border border-djzinc-800 shrink-0">
                            {/* Selector de Columnas Visibles (Abre Modal Pro de Configuración) */}
                            <button
                                type="button"
                                onClick={() => setColumnSelectorOpen(true)}
                                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 ${
                                    columnSelectorOpen 
                                        ? 'bg-djcyan-950 text-djcyan-300 border-djcyan-600/70 shadow-inner' 
                                        : 'bg-djzinc-900 text-gray-300 border-djzinc-750 hover:text-white hover:border-djzinc-650'
                                }`}
                                title="Abrir Centro de Personalización de Columnas y Vistas"
                            >
                                <Icons.Gear size={14} className="inline-block align-[-2px]" />
                                <span>Columnas</span>
                                <span className="text-[10px] text-djcyan-400 font-mono font-bold">
                                    ({Object.values(visibleColumns).filter(Boolean).length}/{Object.keys(visibleColumns).length})
                                </span>
                            </button>

                            {/* Toggle de Métricas HUD */}
                            <button
                                type="button"
                                onClick={toggleMetricsCollapsed}
                                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                                    !metricsCollapsed 
                                        ? 'bg-amber-950/50 text-amber-300 border-amber-600/60 shadow-inner' 
                                        : 'bg-djzinc-900 text-gray-400 border-djzinc-750 hover:text-white'
                                }`}
                                title={!metricsCollapsed ? "Plegar HUD de métricas completas (Tecla M)" : "Desplegar HUD analítico completo (Tecla M)"}
                            >
                                <Icons.Activity size={14} aria-hidden="true" />
                                <span className="hidden xl:inline">HUD</span>
                                <kbd className="text-[9px] bg-black/50 px-1 rounded border border-djzinc-700">M</kbd>
                            </button>

                            {/* Toggle de Inspector */}
                            <button
                                onClick={() => setSidebarOpen(prev => !prev)}
                                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                                    sidebarOpen 
                                        ? 'bg-djcyan-950 text-djcyan-400 border-djcyan-700/60 shadow-inner' 
                                        : 'bg-djzinc-900 text-gray-400 border-djzinc-750 hover:text-white'
                                }`}
                                title={sidebarOpen ? "Ocultar panel inspector" : "Mostrar panel inspector"}
                            >
                                <Icons.PanelLeft size={14} aria-hidden="true" className="rotate-180" />
                                <span className="hidden sm:inline">{t('btn_inspector') || 'Inspector'}</span>
                            </button>
                        </div>

                        {/* Cancelación de Proceso */}
                        {(isAuditing || isLoadingDir || isInjecting || isExporting || batchProgress > 0) && (
                            <button 
                                onClick={handleCancelarProceso}
                                className="bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/60 px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer shadow-md transition-all active:scale-95 font-mono shrink-0"
                                title="Detener el proceso actual inmediatamente"
                            >
                                <Icons.Close size={14} className="inline-block align-[-2px]" />
                                <span className="hidden sm:inline">{t('btn_cancel') || 'Cancelar'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* DS 3.0 · Barra de herramientas unificada de la biblioteca */}
                <div className="ws-toolbar select-none" role="toolbar" aria-label="Acciones de biblioteca">
                    <div className="ws-toolbar-group">
                        <WsButton variant="primary" icon={Icons.Folder} label="Cargar Colección" onClick={handleExplorar} title="Cargar carpetas completas o pistas desde el explorador" />
                        <WsButton icon={Icons.Layers} label="Colección" onClick={handleCargarColeccionGuardada} title="Cargar la colección guardada en la app en la tabla de auditoría" />
                        <AddToCollectionMenu
                            customLibraries={customLibraries}
                            activeCustomLibId={activeCustomLibId}
                            onAddToFolder={(folder) => handleLlevarAColeccion(folder)}
                            onCreateAndAdd={(name) => handleLlevarAColeccion(null, name)}
                            selectedCount={selectedAuditIds.size > 0 ? selectedAuditIds.size : tracks.length}
                            disabled={tracks.length === 0}
                        />
                        <WsButton icon={Icons.Plus} label="Añadir" onClick={handleAnadirMas} title="Añadir más carpetas o pistas sin vaciar la selección" />
                        <WsButton compact icon={Icons.Refresh} label="Recargar selección" onClick={() => handleCargarDirectorio(resolveAuditTargets())} />
                        {onToggleSimulation && (
                            <WsButton 
                                compact 
                                variant={isSimulationMode ? 'active' : 'ghost'} 
                                icon={Icons.Zap} 
                                label={isSimulationMode ? 'Simulación Activa' : 'Simulación'} 
                                onClick={() => onToggleSimulation()} 
                                title={isSimulationMode ? 'Desactivar datos demo y vaciar cabina' : 'Cargar datos simulados demo'} 
                            />
                        )}
                        {tracks && tracks.length > 0 && (
                            <WsButton compact variant="danger" icon={Icons.Trash} label="Vaciar lista" onClick={handleClearAllTracks} />
                        )}
                    </div>

                    <ToolbarDivider />

                    <div className="ws-toolbar-group">
                        <WsButton
                            variant={batchConfigured ? 'active' : 'ghost'}
                            icon={Icons.Sliders}
                            label="Configurar"
                            badge={batchConfigured ? 'Listo' : null}
                            onClick={() => setBatchModalOpen(true)}
                            title="Elegir qué análisis y correcciones ejecutar"
                        />
                        <WsButton
                            variant={batchConfigured ? 'primary' : 'ghost'}
                            icon={isAuditing ? Icons.Activity : Icons.Play}
                            label={isAuditing ? 'Auditando...' : 'Analizar'}
                            badge={tracks.length}
                            disabled={isAuditing || tracks.length === 0}
                            onClick={() => (batchConfigured ? handleEjecutarAuditoriaLote() : setBatchModalOpen(true))}
                            title={batchConfigured ? 'Ejecutar el análisis configurado sobre las pistas cargadas' : 'Primero configura la auditoría'}
                        />
                    </div>

                    <div className="ws-toolbar-group ml-auto flex items-center gap-2">
                        <WsButton
                            variant={cloudSyncStatus.synced ? 'active' : 'ghost'}
                            icon={cloudSyncStatus.isSyncing ? Icons.Refresh : Icons.Cloud}
                            label={cloudSyncStatus.isSyncing ? "Sincronizando..." : "Sync Cloud"}
                            badge={cloudSyncStatus.lastSyncText || (cloudSyncStatus.synced ? "✓ Listo" : null)}
                            onClick={handleCloudMetadataSync}
                            title="Sincronizar metadatos y carpetas en la nube (<5 KB por pista, coste cero, sin subir audio)"
                        />
                        <ExportMenu
                            disabled={tracks.length === 0}
                            busy={isExporting || isInjecting}
                            onSyncAll={handleSincronizarPasaporteUniversal}
                            onSaveTags={handleSolicitarGuardarTodo}
                            targets={[
                                { id: 'rekordbox', label: 'Rekordbox', ext: '.XML', desc: 'Hot Cues A–H y beatgrid', Logo: PlatformRekordboxLogo, onClick: handleExportarRekordboxXml },
                                { id: 'serato', label: 'Serato DJ Pro', ext: 'CRATES', desc: 'Markers2, BPM y key en tags', Logo: PlatformSeratoLogo, onClick: handleExportarSerato },
                                { id: 'traktor', label: 'Traktor Pro', ext: '.NML', desc: 'Colección con Hot Cues 1–8', Logo: PlatformTraktorLogo, onClick: handleExportarTraktor },
                                { id: 'vdj', label: 'VirtualDJ', ext: '.M3U', desc: 'Lista y tags optimizados', Logo: PlatformVirtualDjLogo, onClick: handleExportarVirtualDJ },
                                { id: 'xlsx', label: 'Informe Excel', ext: '.XLSX', desc: 'Hojas por destino y auditoría', Logo: null, onClick: handleExportarXLS },
                            ]}
                        />
                    </div>
                </div>

                {(isAuditing || isLoadingDir || isExporting || isInjecting || batchProgress > 0) && (
                    <div className="bg-djzinc-900 border-b border-djzinc-800 px-4 py-2.5 flex flex-col gap-1.5 shrink-0 transition-all">
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-emerald-400 font-semibold truncate flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isAuditPaused ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`}></span>
                                {isAuditPaused ? "⏸ Auditoría en pausa (cero pérdida de datos, puedes reanudar cuando quieras)" : (batchStatusMsg || (isLoadingDir ? "Leyendo metadatos de archivos..." : isAuditing ? "Auditando colección..." : isExporting ? "Generando Excel..." : isInjecting ? "Inyectando metadatos..." : "Procesando..."))}
                            </span>
                            <div className="flex items-center gap-2.5">
                                <span className="text-emerald-400 font-bold font-mono">{batchProgress}%</span>
                                <button
                                    type="button"
                                    onClick={handleTogglePausaProceso}
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors shadow flex items-center gap-1 ${
                                        isAuditPaused 
                                            ? 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-300 animate-pulse' 
                                            : 'bg-djzinc-800 hover:bg-djzinc-700 text-amber-300 border border-amber-600/50'
                                    }`}
                                    title={isAuditPaused ? "Reanudar procesamiento de auditoría" : "Pausar temporalmente sin perder progreso"}
                                >
                                    {isAuditPaused ? <Icons.Play size={12} className="inline-block align-[-1px]" /> : <Icons.Pause size={12} className="inline-block align-[-1px]" />}
                                    <span>{isAuditPaused ? 'Reanudar' : 'Pausar'}</span>
                                </button>
                                <button
                                    onClick={handleCancelarProceso}
                                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 hover:bg-red-900 text-red-300 border border-red-750 cursor-pointer transition-colors shadow flex items-center gap-1"
                                    title="Cancelar y descartar proceso"
                                >
                                    <Icons.Close size={14} className="inline-block align-[-2px]" />
                                    <span>{t('btn_cancel') || 'Cancelar'}</span>
                                </button>
                            </div>
                        </div>
                        <div className="w-full bg-djzinc-950 h-2 rounded-full overflow-hidden border border-djzinc-800 shadow-inner">
                            <div 
                                className="bg-emerald-500 h-full transition-all duration-200 ease-out shadow-lg shadow-emerald-500/50" 
                                style={{ width: `${Math.min(100, Math.max(0, batchProgress))}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* UX CABINA & PRECISION HUD: Métricas Inteligentes y Health Score Global */}
                {metricsCollapsed ? (
                    <div className="px-4 py-2 bg-[#08080d] border-b border-djzinc-800 flex items-center justify-between text-xs font-mono shrink-0 select-none shadow-inner">
                        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                            <span className="text-white font-bold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-djcyan-400"></span>
                                {(metrics.total || 0).toLocaleString()} pistas
                            </span>
                            <span className="text-djzinc-600">•</span>
                            <span className="text-emerald-400 font-bold">
                                {metrics.total > 0 ? Math.max(0, Math.min(100, Math.round(((metrics.total - (badQualityTracks.length + metrics.missing + metrics.duplicates)) / metrics.total) * 100))) : 100}% Salud
                            </span>
                            <span className="text-djzinc-600">•</span>
                            <span className={badQualityTracks.length > 0 ? "text-amber-400 font-bold" : "text-gray-400"}>
                                {badQualityTracks.length.toLocaleString()} {t('kpi_bad_quality') || 'mala calidad'}
                            </span>
                            <span className="text-djzinc-600">•</span>
                            <span className="text-amber-300">{(metrics.missing || 0).toLocaleString()} {t('kpi_missing_bpm_key') || 'falta BPM/Key'}</span>
                            <span className="text-djzinc-600">•</span>
                            <span className="text-djcyan-400 font-bold">
                                {tracks.filter(t => t.cutoff_khz && !String(t.status || '').includes('Fake')).length} Lossless
                            </span>
                        </div>
                        <button 
                            type="button"
                            onClick={toggleMetricsCollapsed} 
                            className="px-2.5 py-1 rounded text-[11px] font-mono text-djcyan-400 hover:text-djcyan-300 hover:bg-djcyan-950/60 border border-djcyan-800/60 cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 shadow"
                            title="Desplegar el HUD de métricas y salud de cabina (Tecla M)"
                        >
                            <span>{t('hud_expand') || '▼ Desplegar HUD'}</span>
                            <kbd className="text-[9px] bg-djzinc-900 border border-djzinc-700 px-1 rounded font-bold">M</kbd>
                        </button>
                    </div>
                ) : (
                    <div className="relative group shrink-0 bg-[#07070c] border-b border-djzinc-800/90 p-2.5">
                        <div data-tour="tour-audit-table" className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                            {/* KPI 1: Health Score Global */}
                            <div 
                                onClick={() => setFiltro('todos')} 
                                className={`p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                                    filtro === 'todos' 
                                        ? 'bg-djcyan-950/30 border-djcyan-500/50 shadow-md shadow-djcyan-500/10' 
                                        : 'bg-djzinc-900/60 border-djzinc-800 hover:bg-djzinc-850/70 hover:border-djzinc-700'
                                }`}
                            >
                                <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-gray-400">
                                    <span>{t('kpi_health') || 'Salud Global'}</span>
                                    <span className="text-emerald-400 font-bold">
                                        {metrics.total > 0 ? Math.max(0, Math.min(100, Math.round(((metrics.total - (badQualityTracks.length + metrics.missing + metrics.duplicates)) / metrics.total) * 100))) : 100}%
                                    </span>
                                </div>
                                <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-lg font-mono font-black text-white">{(metrics.total || 0).toLocaleString()}</span>
                                    <span className="text-[10px] font-mono text-gray-500">{t('hud_subtitle_tracks') || 'pistas'}</span>
                                </div>
                            </div>

                            {/* KPI 2: Falta Artista / Título (Unificado) */}
                            <div 
                                onClick={() => setFiltro(filtro === 'missing_meta' ? 'todos' : 'missing_meta')} 
                                className={`p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                                    filtro === 'missing_meta' 
                                        ? 'bg-amber-950/40 border-amber-500/60 shadow-md' 
                                        : 'bg-djzinc-900/60 border-djzinc-800 hover:bg-djzinc-850/70 hover:border-djzinc-700'
                                }`}
                            >
                                <div className="text-[10px] font-mono font-bold uppercase text-gray-400 truncate">Falta Artista/Título</div>
                                <div className="flex items-baseline justify-between mt-1">
                                    <span className={`text-lg font-mono font-black ${missingMetaTracks.length > 0 ? 'text-amber-300' : 'text-gray-400'}`}>
                                        {missingMetaTracks.length.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-mono text-gray-500">sin tags</span>
                                </div>
                            </div>

                            {/* KPI 3: Falta BPM / Key */}
                            <div 
                                onClick={() => setFiltro(filtro === 'missing' ? 'todos' : 'missing')} 
                                className={`p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                                    filtro === 'missing' 
                                        ? 'bg-amber-950/40 border-amber-500/60 shadow-md shadow-amber-500/10' 
                                        : 'bg-djzinc-900/60 border-djzinc-800 hover:bg-djzinc-850/70 hover:border-djzinc-700'
                                }`}
                            >
                                <div className="text-[10px] font-mono font-bold uppercase text-gray-400 truncate">{t('kpi_missing_bpm_key') || 'Falta BPM/Key'}</div>
                                <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-lg font-mono font-black text-amber-300">{(metrics.missing || 0).toLocaleString()}</span>
                                    <span className="text-[10px] font-mono text-gray-500">{t('hud_subtitle_no_pitch') || 'sin pitch'}</span>
                                </div>
                            </div>

                            {/* KPI 4: Falta Cover */}
                            <div 
                                onClick={() => setFiltro(filtro === 'missing_cover' ? 'todos' : 'missing_cover')} 
                                className={`p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                                    filtro === 'missing_cover' 
                                        ? 'bg-amber-950/40 border-amber-500/60 shadow-md' 
                                        : 'bg-djzinc-900/60 border-djzinc-800 hover:bg-djzinc-850/70 hover:border-djzinc-700'
                                }`}
                            >
                                <div className="text-[10px] font-mono font-bold uppercase text-gray-400 truncate">{t('kpi_missing_cover') || 'Falta Cover'}</div>
                                <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-lg font-mono font-black text-amber-300">{(metrics.missing_cover || 0).toLocaleString()}</span>
                                    <span className="text-[10px] font-mono text-gray-500">{t('hud_subtitle_no_art') || 'sin arte'}</span>
                                </div>
                            </div>

                            {/* KPI 5: Faltan Cues */}
                            <div 
                                onClick={() => setFiltro(filtro === 'missing_cues' ? 'todos' : 'missing_cues')} 
                                className={`p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                                    filtro === 'missing_cues' 
                                        ? 'bg-amber-950/40 border-amber-500/60 shadow-md' 
                                        : 'bg-djzinc-900/60 border-djzinc-800 hover:bg-djzinc-850/70 hover:border-djzinc-700'
                                }`}
                            >
                                <div className="text-[10px] font-mono font-bold uppercase text-gray-400 truncate">Faltan Cues</div>
                                <div className="flex items-baseline justify-between mt-1">
                                    <span className={`text-lg font-mono font-black ${missingCuesTracks.length > 0 ? 'text-amber-300' : 'text-gray-400'}`}>
                                        {missingCuesTracks.length.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-mono text-gray-500">sin Hot Cues</span>
                                </div>
                            </div>

                            {/* KPI 6: Silencios Corregidos */}
                            <div 
                                onClick={() => setFiltro(filtro === 'silences_trimmed' ? 'todos' : 'silences_trimmed')} 
                                className={`p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                                    filtro === 'silences_trimmed' 
                                        ? 'bg-djcyan-950/40 border-djcyan-500/60 shadow-md' 
                                        : 'bg-djzinc-900/60 border-djzinc-800 hover:bg-djzinc-850/70 hover:border-djzinc-700'
                                }`}
                            >
                                <div className="text-[10px] font-mono font-bold uppercase text-gray-400 truncate">Silencios Corregidos</div>
                                <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-lg font-mono font-black text-djcyan-300">
                                        {trimmedSilenceTracks.length.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-mono text-gray-500">recortados</span>
                                </div>
                            </div>

                            {/* KPI 7: Mala Calidad / Fakes */}
                            <div 
                                onClick={() => setFiltro(filtro === 'bad_quality' ? 'todos' : 'bad_quality')} 
                                className={`p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                                    filtro === 'bad_quality' 
                                        ? 'bg-rose-950/40 border-rose-500/60 shadow-md shadow-rose-500/10' 
                                        : 'bg-djzinc-900/60 border-djzinc-800 hover:bg-djzinc-850/70 hover:border-djzinc-700'
                                }`}
                            >
                                <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-gray-400">
                                    <span>{t('kpi_bad_quality') || 'Mala Calidad'}</span>
                                    {badQualityTracks.length > 0 && <span className="text-[9px] bg-rose-900 text-rose-200 px-1 rounded font-mono font-bold">FAKES</span>}
                                </div>
                                <div className="flex items-baseline justify-between mt-1">
                                    <span className={`text-lg font-mono font-black ${badQualityTracks.length > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                                        {badQualityTracks.length.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-mono text-gray-500">transcodes</span>
                                </div>
                            </div>

                            {/* KPI 8: Calidad Excelente */}
                            <div 
                                onClick={() => setFiltro(filtro === 'excellent_quality' ? 'todos' : 'excellent_quality')} 
                                className={`p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                                    filtro === 'excellent_quality' 
                                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md' 
                                        : 'bg-djzinc-900/60 border-djzinc-800 hover:bg-djzinc-850/70 hover:border-djzinc-700'
                                }`}
                            >
                                <div className="text-[10px] font-mono font-bold uppercase text-gray-400 truncate">Calidad Excelente</div>
                                <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-lg font-mono font-black text-emerald-400">
                                        {excellentQualityTracks.length.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-mono text-gray-500">Lossless / 320k</span>
                                </div>
                            </div>
                        </div>

                        {/* Botón Plegar HUD */}
                        <button 
                            type="button"
                            onClick={toggleMetricsCollapsed}
                            className="absolute top-1 right-2 z-10 opacity-70 hover:opacity-100 px-2 py-0.5 rounded text-[10px] font-mono bg-djzinc-900/90 text-gray-400 hover:text-white border border-djzinc-750 cursor-pointer transition-all flex items-center gap-1 shadow"
                            title="Plegar HUD de métricas para maximizar espacio vertical (Tecla M)"
                        >
                            <span>{t('hud_collapse') || '▲ Plegar HUD'}</span>
                            <kbd className="text-[8px] bg-black px-1 rounded border border-djzinc-700">M</kbd>
                        </button>
                    </div>
                )}

                {/* BARRA DE BÚSQUEDA INTELIGENTE & FILTROS TÁCTICOS EN PÍLDORAS (NIVEL 3) */}
                {/* 🚨 ANTI-MUDDY LIVE GUARDIAN BANNER: Alerta si hay choque de bajos con la pista en reproducción */}
                {nowPlayingTrack && (
                    (() => {
                        const isNowBass = (nowPlayingTrack.low_ratio || 33) >= 44 || nowPlayingTrack.acoustic_role === 'Bass Driver';
                        const isSelBass = currentTrack && String(currentTrack.id) !== String(nowPlayingTrack.id) && ((currentTrack.low_ratio || 33) >= 44 || currentTrack.acoustic_role === 'Bass Driver');
                        if (isNowBass && isSelBass) {
                            return (
                                <div className="px-4 py-2 bg-gradient-to-r from-red-950 via-red-900/60 to-red-950 border-b border-red-600/70 flex items-center justify-between text-xs font-mono shadow-lg animate-pulse shrink-0">
                                    <div className="flex items-center gap-2.5">
                                        <Icons.Alert size={14} className="inline-block align-[-2px]" />
                                        <span className="font-black text-red-200 uppercase tracking-wide">
                                            Anti-Muddy Live Guardian: ¡Conflicto de Sub-Graves Detectado!
                                        </span>
                                        <span className="hidden md:inline text-red-300/90 font-normal">
                                            Ambos temas ({nowPlayingTrack.t || nowPlayingTrack.title} & {currentTrack.t || currentTrack.title}) dominan el subgrave ({'>'}44%). Corta EQ Low -6dB en canal entrante para evitar empaste en la sala.
                                        </span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[10px] shrink-0">
                                        BASS CLASH
                                    </span>
                                </div>
                            );
                        }
                        return null;
                    })()
                )}

                <div className="px-3.5 py-2 bg-[#0a0a10] border-b border-djzinc-800 flex items-center justify-between shrink-0 gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Buscador de Cabina con Soporte AI DJ Query */}
                        <div className="relative flex items-center flex-1 max-w-md">
                            <Icons.Search size={14} className="inline-block align-[-2px] absolute left-3 text-gray-500  pointer-events-none" />
                            <input 
                                type="text" 
                                value={busqueda} 
                                onChange={(e) => setBusqueda(e.target.value)} 
                                placeholder={t('search_placeholder') || "Buscar pista, BPM, Camelot, estilo o rol acústico..."} 
                                className="w-full bg-djzinc-950 border border-djzinc-750 focus:border-djcyan-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 outline-none font-mono transition-colors shadow-inner" 
                            />
                            {busqueda && (
                                <button 
                                    onClick={() => setBusqueda('')} 
                                    className="absolute right-2.5 text-gray-500 hover:text-gray-300 text-xs cursor-pointer"
                                >
                                    <Icons.Close size={14} className="inline-block align-[-2px]" />
                                </button>
                            )}
                        </div>

                        {/* Benchmark visual de latencia de búsqueda en RAM (<1ms) */}
                        {busqueda && busqueda.trim().length >= 2 && (
                            <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/50 text-[10.5px] font-mono text-cyan-300 font-bold shadow-md shadow-cyan-950/50 animate-fadeIn">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                <span>{tracksFiltrados.length} pistas</span>
                                <span className="text-zinc-600">•</span>
                                <span className="text-emerald-400 font-black">{searchBenchmarkRef.current}ms</span>
                            </div>
                        )}

                        {/* Chips Inteligentes detectados por IA DJ */}
                        {(() => {
                            const p = (busqueda && busqueda.length > 2) ? parseAIDJQuery(busqueda) : null;
                            if (!p || !p.tokens || p.tokens.length === 0) return null;
                            return (
                                <div className="hidden lg:flex items-center gap-1.5 flex-wrap">
                                    {p.tokens.map((tok, tIdx) => (
                                        <span key={tIdx} className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-djcyan-950 text-djcyan-300 border border-djcyan-500/50 shadow-sm animate-fadeIn">
                                            {tok.label}
                                        </span>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* DS 3.0 · Filtros consolidados */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <FilterMenu
                                value={filtro}
                                onChange={setFiltro}
                                allLabel={t('filter_all_label') || 'Todas las pistas'}
                                allCount={metrics.total || 0}
                                groups={[
                                    {
                                        label: 'Metadatos',
                                        options: [
                                            { id: 'missing', label: t('filter_missing_bpm_label') || 'Falta BPM / Key', count: metrics.missing || 0, tone: 'amber' },
                                            { id: 'missing_meta', label: 'Sin artista / título', count: missingMetaTracks.length, tone: 'amber' },
                                            { id: 'missing_cover', label: t('filter_missing_cover_label') || 'Sin portada', count: metrics.missing_cover || 0, tone: 'amber' },
                                            { id: 'missing_cues', label: 'Faltan Hot Cues', count: missingCuesTracks.length, tone: 'amber' },
                                        ],
                                    },
                                    {
                                        label: 'Calidad de audio',
                                        options: [
                                            { id: 'bad_quality', label: 'Mala calidad / fakes', count: badQualityTracks.length, tone: 'rose' },
                                            { id: 'excellent_quality', label: 'Calidad excelente', count: excellentQualityTracks.length, tone: 'emerald' },
                                            { id: 'silences_trimmed', label: 'Silencios recortados', count: trimmedSilenceTracks.length, tone: 'cyan' },
                                        ],
                                    },
                                    {
                                        label: 'Pista de baile',
                                        options: [
                                            { id: 'high_energy', label: 'Alta energía', count: highEnergyTracks.length, tone: 'cyan' },
                                        ],
                                    },
                                ]}
                            />

                            <WsButton icon={Icons.Scale} label={t('filter_duplicates_label') || 'Duplicados'} badge={metrics.duplicates || 0} onClick={() => setDuplicateModalOpen(true)} title="Comparar y resolver duplicados" />
                            <WsButton
                                icon={Icons.Compass}
                                label="Mix Oracle"
                                disabled={tracks.length === 0}
                                onClick={() => { setMixOracleTargetTrack(currentTrack || tracks[0]); setMixOracleOpen(true); }}
                                title="Sugerir qué pista mezclar a continuación"
                            />

                            {(filtro === 'bad_quality' && badQualityTracks.length > 0) && (
                                <>
                                    <WsButton
                                        variant="active"
                                        icon={Icons.Download}
                                        label={t('btn_upgrade_quality') || 'Mejorar calidad'}
                                        badge={badQualityTracks.length}
                                        disabled={isSearchingSpotifyHD || isAuditing}
                                        onClick={() => handleBuscarReemplazosSpotify(badQualityTracks)}
                                        title={t('tooltip_upgrade_quality') || 'Buscar copias lossless para las pistas de baja calidad'}
                                    />
                                    <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer select-none shrink-0" title="Eliminar del disco el archivo original al descargar su reemplazo">
                                        <input
                                            type="checkbox"
                                            checked={deleteOriginalsOnUpgrade}
                                            onChange={(e) => {
                                                const val = e.target.checked;
                                                setDeleteOriginalsOnUpgrade(val);
                                                try { localStorage.setItem('dj_metatagger_delete_originals', val ? 'true' : 'false'); } catch (_) {}
                                            }}
                                            className="w-3.5 h-3.5 rounded"
                                        />
                                        <span className="hidden lg:inline">Borrar originales</span>
                                    </label>
                                </>
                            )}

                            {selectedAuditIds.size > 0 && (
                                <WsButton
                                    variant="primary"
                                    icon={Icons.Download}
                                    label={t('btn_send_to_downloads') || 'Llevar a descargas'}
                                    badge={selectedAuditIds.size}
                                    disabled={isSearchingSpotifyHD || isAuditing}
                                    onClick={() => handleBuscarReemplazosSpotify(tracks.filter(t => selectedAuditIds.has(t.id)))}
                                    title={t('tooltip_send_downloads') || 'Buscar las pistas seleccionadas en máxima calidad'}
                                />
                            )}
                        </div>
                    </div>

                    {saveFeedback && <span className="text-xs font-mono text-djgreen-400 font-bold animate-pulse shrink-0">{saveFeedback}</span>}
                </div>

                <div className="flex-1 min-h-0 flex overflow-hidden relative">
                    <div ref={tableScrollRef} className="flex-1 min-w-0 overflow-auto bg-[#0f0f13] flex flex-col">
                        {/* Banner Informativo de Crate Virtual Activo procedente de Librería */}
                        {activeCrateFilter && (
                            <div className="px-4 py-2 bg-gradient-to-r from-cyan-950/90 via-[#0d1527] to-[#09090f] border-b border-cyan-500/50 flex items-center justify-between gap-3 text-xs font-mono shrink-0 select-none animate-fadeIn">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] animate-pulse"></span>
                                    <span className="text-gray-400">Filtrando por Crate:</span>
                                    <span className="text-white font-black tracking-wide text-sm">{activeCrateFilter.name}</span>
                                    <span className="text-cyan-300 font-mono text-[11px] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-600/40">{activeCrateFilter.libName}</span>
                                    <span className="text-cyan-400 font-bold">({tracksFiltrados.length} pistas en tabla de auditoría)</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClearCrateFilter}
                                    className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 hover:text-white text-[11px] font-mono font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                                    title="Quitar filtro de crate y ver toda la biblioteca"
                                >
                                    <Icons.Close size={13} className="inline-block align-[-1px]" />
                                    <span>Ver toda la biblioteca ({tracks.length})</span>
                                </button>
                            </div>
                        )}

                        {/* Banner Informativo de Carpeta Activa con botón para Ver Todas */}
                        {activeFolderMeta && !activeCrateFilter && (
                            <div className="px-4 py-2 bg-gradient-to-r from-[#121324] via-[#0d0e1a] to-[#09090f] border-b border-djzinc-800 flex items-center justify-between gap-3 text-xs font-mono shrink-0 select-none">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${activeFolderMeta.dotClass || 'bg-cyan-400'} shadow-[0_0_8px_currentColor]`}></span>
                                    <span className="text-gray-400">Carpeta activa:</span>
                                    <span className="text-white font-black tracking-wide">{activeFolderMeta.name}</span>
                                    <span className="text-cyan-400 font-bold">({tracksFiltrados.length} pistas en tabla de auditoría)</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedFolderId('all')}
                                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono font-bold hover:underline cursor-pointer flex items-center gap-1"
                                >
                                    ✕ Ver todas las pistas ({tracks.length})
                                </button>
                            </div>
                        )}
                    {tracks.length === 0 ? (
                        <IngestDropzone
                            isDragOver={isDragOver}
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleExplorar(); }}
                            onBrowse={handleExplorar}
                            onImportCollection={handleCargarColeccionGuardada}
                            customLibraries={customLibraries}
                            activeCustomLibId={activeCustomLibId}
                        />
                    ) : (
                        <>
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap hidden md:table">
                        <thead className="sticky top-0 z-10 bg-djzinc-900/95 border-b border-djzinc-800 text-[11px] font-mono uppercase text-djzinc-400">
                            <tr>
                                {visibleColumns.id && (
                                    <th className="py-2.5 px-2 w-12 text-center" title="ID secuencial de pista y casilla para selección masiva o acciones en lote">
                                        <div className="flex items-center justify-center gap-1">
                                            <input 
                                                type="checkbox" 
                                                checked={tracksFiltrados.length > 0 && tracksFiltrados.every(t => selectedAuditIds.has(t.id))}
                                                onChange={handleToggleSelectAllVisible}
                                                className="accent-djcyan-500 cursor-pointer w-3.5 h-3.5 rounded"
                                                title="Seleccionar / deseleccionar todas las pistas visibles"
                                            />
                                            <span onClick={() => handleSortAudit('id')} className="cursor-pointer hover:text-white text-[9px] font-mono">#</span>
                                            {renderSortArrowAudit('id')}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.waveform && (
                                    <th className="py-2.5 px-2 w-28 text-center text-djcyan-400" title="Huella acústica corporativa en 4 bandas espectrales (Bajos, Pegada, Vocales, Agudos) con scrubber y reproducción interactiva">
                                        {t('th_waveform') || 'Waveform'}
                                    </th>
                                )}
                                {visibleColumns.title && (
                                    <th onClick={() => handleSortAudit('title')} className="py-2.5 px-3 min-w-[220px] cursor-pointer hover:text-white transition-colors" title="Nombre del archivo de audio o etiqueta ID3 Title. Doble clic en la fila para abrir inspector">
                                        {t('th_title') || 'Archivo / Título'} {renderSortArrowAudit('title')}
                                    </th>
                                )}
                                {visibleColumns.artist && (
                                    <th onClick={() => handleSortAudit('artist')} className="py-2.5 px-2 w-28 cursor-pointer hover:text-white transition-colors" title="Artista o creador principal del track. Reconoce colaboraciones y remezclas">
                                        {t('th_artist') || 'Artista'} {renderSortArrowAudit('artist')}
                                    </th>
                                )}
                                {visibleColumns.genre && (
                                    <th onClick={() => handleSortAudit('genre')} className="py-2.5 px-2 text-center w-24 cursor-pointer hover:text-white transition-colors" title="Clasificación de género musical primario (House, Techno, Drum & Bass, etc.)">
                                        {t('th_genre') || 'Género'} {renderSortArrowAudit('genre')}
                                    </th>
                                )}
                                {visibleColumns.subgenre && (
                                    <th onClick={() => handleSortAudit('subgenre')} className="py-2.5 px-2 text-center w-28 cursor-pointer hover:text-white transition-colors" title="Taxonomía electrónica de precisión calculada según características tímbricas y tempo">
                                        {t('th_subgenre') || 'Subgénero'} {renderSortArrowAudit('subgenre')}
                                    </th>
                                )}
                                {visibleColumns.format && (
                                    <th onClick={() => handleSortAudit('format')} className="py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" title="Contenedor y formato de audio (FLAC, WAV, AIFF, MP3, M4A). Identifica compresión con o sin pérdida">
                                        {t('th_format') || 'Formato'} {renderSortArrowAudit('format')}
                                    </th>
                                )}
                                {visibleColumns.sample_rate_khz && (
                                    <th onClick={() => handleSortAudit('sample_rate_khz')} className="py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" title="Frecuencia de muestreo (44.1 kHz estándar CD, 48 kHz / 96 kHz Hi-Res Studio)">
                                        {t('th_khz') || 'kHz'} {renderSortArrowAudit('sample_rate_khz')}
                                    </th>
                                )}
                                {visibleColumns.bitrate_kbps && (
                                    <th onClick={() => handleSortAudit('bitrate_kbps')} className="py-2.5 px-2 text-center w-20 cursor-pointer hover:text-white transition-colors" title="Tasa de bits real calculada en disco (320 kbps para MP3 de alta fidelidad, 800-1411 kbps para Lossless)">
                                        {t('th_kbps') || 'kbps'} {renderSortArrowAudit('bitrate_kbps')}
                                    </th>
                                )}
                                {visibleColumns.calidad && (
                                    <th onClick={() => handleSortAudit('calidad')} className="py-2.5 px-2 text-center w-24 cursor-pointer hover:text-white transition-colors" title="Certificación acústica de pureza sonora del Master Engine (Master Studio, Alta Calidad, Compresión Fuerte o Fake detectado)">
                                        {t('th_quality') || 'Calidad'} {renderSortArrowAudit('calidad')}
                                    </th>
                                )}
                                {visibleColumns.perdida_pct && (
                                    <th onClick={() => handleSortAudit('perdida_pct')} className="py-2.5 px-3 text-center min-w-[170px] cursor-pointer hover:text-white transition-colors" title="Pérdida de espectro respecto a una fuente analógica/máster pura sin compresión">
                                        {t('th_loss') || 'Pérdida / Compresión'} {renderSortArrowAudit('perdida_pct')}
                                    </th>
                                )}
                                {visibleColumns.cutoff_khz && (
                                    <th onClick={() => handleSortAudit('cutoff_khz')} className="py-2.5 px-1.5 text-center cursor-pointer hover:text-white transition-colors" title="Frecuencia máxima de corte FFT en agudos. Esencial para cazar fakes: si un FLAC corta a 16 kHz, fue inflado desde un MP3 de 128 kbps">
                                        {t('th_fft') || 'Cert. FFT'} {renderSortArrowAudit('cutoff_khz')}
                                    </th>
                                )}
                                {visibleColumns.lufs && (
                                    <th onClick={() => handleSortAudit('lufs')} className="py-2.5 px-1.5 text-center cursor-pointer hover:text-white transition-colors" title="Sonoridad integrada en LUFS (EBU R128) y True Peak en dBFS. Rango ideal para mezclar en club: -8 a -6 LUFS">
                                        {t('th_lufs_peak') || 'LUFS / Peak'} {renderSortArrowAudit('lufs')}
                                    </th>
                                )}
                                {visibleColumns.duration && (
                                    <th onClick={() => handleSortAudit('duration')} className="py-2.5 px-1.5 text-center cursor-pointer hover:text-white transition-colors" title="Duración total de la canción en minutos y segundos (MM:SS)">
                                        {t('th_duration') || 'Time'} {renderSortArrowAudit('duration')}
                                    </th>
                                )}
                                {visibleColumns.bpm && (
                                    <th onClick={() => handleSortAudit('bpm')} className="py-2.5 px-1.5 text-center cursor-pointer hover:text-white transition-colors" title="Tempo exacto en pulsos por minuto con cálculo de Zero-Crossing y Beatgrid para mezcla sincronizada">
                                        BPM {renderSortArrowAudit('bpm')}
                                    </th>
                                )}
                                {visibleColumns.key && (
                                    <th onClick={() => handleSortAudit('key')} className="py-2.5 px-1.5 text-center cursor-pointer hover:text-white transition-colors" title="Tonalidad armónica según la rueda Camelot (ej. 8A = La menor). Facilita mezclas en armonía sin choques tonales">
                                        Key {renderSortArrowAudit('key')}
                                    </th>
                                )}
                                {visibleColumns.beatgrid_status && (
                                    <th className="py-2.5 px-1.5 text-center text-cyan-400 font-mono text-[11px]" title="Alineación del Beatgrid 1.0.0 al primer bombo real y detección de deriva de tempo (Grid Drift)">
                                        Beatgrid
                                    </th>
                                )}
                                {visibleColumns.trim_silences && (
                                    <th className="py-2.5 px-1.5 text-center text-emerald-400 font-mono text-[11px]" title="Auto-Trim Zero-Crossing: Silencio inicial recortado y cola final descartada">
                                        Auto-Trim
                                    </th>
                                )}
                                {visibleColumns.cues && (
                                    <th className="py-2.5 px-1.5 text-center" title="8 Hot Cues fijados automáticamente en Beat 1.0.0, Drops, Breakdowns y Outro listos para Rekordbox, Serato y Traktor">
                                        {t('th_cues') || '8 Hot Cues'}
                                    </th>
                                )}
                                {visibleColumns.e && (
                                    <th onClick={() => handleSortAudit('e')} className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors" title="Índice de energía acústica percibida (0% a 100%) según densidad de graves y transitorios rítmicos">
                                        <Icons.Zap size={14} className="inline-block align-[-2px]" /> {t('th_energy') || 'Energía'} {renderSortArrowAudit('e')}
                                    </th>
                                )}
                                {visibleColumns.dance && (
                                    <th onClick={() => handleSortAudit('dance')} className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors" title="Índice de regularidad rítmica y cadencia bailable para la pista de baile">
                                        <Icons.Activity size={14} className="inline-block align-[-2px]" /> {t('th_dance') || 'Dance'} {renderSortArrowAudit('dance')}
                                    </th>
                                )}
                                {visibleColumns.intensity && (
                                    <th onClick={() => handleSortAudit('arousal')} className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors text-emerald-400" title="Intensidad y excitación acústica percibida (Arousal) de 0% a 100%">
                                        <Icons.Activity size={14} className="inline-block align-[-2px]" /> Intensidad {renderSortArrowAudit('arousal')}
                                    </th>
                                )}
                                {visibleColumns.valence && (
                                    <th onClick={() => handleSortAudit('valence')} className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors text-djcyan-400" title="Positividad emocional y brillo armónico (Valence) de 0% a 100%">
                                        <Icons.Sparkles size={14} className="inline-block align-[-2px]" /> Positividad {renderSortArrowAudit('valence')}
                                    </th>
                                )}
                                {visibleColumns.fase_badge && (
                                    <th onClick={() => handleSortAudit('fase_badge')} className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors" title="Fase de la sesión DJ (Warm-Up, Build-Up, Caña / Clímax, Cierre, Calma)">
                                        {t('th_phase') || 'Fase DJ'} {renderSortArrowAudit('fase_badge')}
                                    </th>
                                )}
                                {visibleColumns.acoustic_role && (
                                    <th onClick={() => handleSortAudit('acoustic_role')} className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors text-djcyan-400" title="Rol espectral en la mezcla (Bass Driver, Vocal/Lead, Percussive Tool, Balanced) y compatibilidad Anti-Muddy">
                                        {t('th_acoustic_role') || 'Rol Acústico & Anti-Muddy'} {renderSortArrowAudit('acoustic_role')}
                                    </th>
                                )}
                                {visibleColumns.comment && (
                                    <th onClick={() => handleSortAudit('comment')} className="py-2.5 px-2 text-left cursor-pointer hover:text-white transition-colors" title="Tag de comentario inteligente formateado para mostrar métricas clave en la pantalla del reproductor DJ (CDJ/XDJ)">
                                        {t('th_comment_pro') || 'Comentario Pro DJ'} {renderSortArrowAudit('comment')}
                                    </th>
                                )}
                                {visibleColumns.status && (
                                    <th onClick={() => handleSortAudit('status')} className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors" title="Veredicto de auditoría global: Lossless verificado, MP3 de cabina, o FLAC Fake que requiere reemplazo">
                                        {t('th_status') || 'Estado'} {renderSortArrowAudit('status')}
                                    </th>
                                )}
                                {visibleColumns.actions && (
                                    <th className="py-2.5 px-2 text-center w-14 text-red-400/80 font-mono" title="Quitar pista del análisis global">
                                        {t('th_remove') || 'Quitar'}
                                    </th>
                                )}
                            </tr>
                            <tr className="bg-djzinc-950/90 border-b border-djzinc-800 text-[10px] lowercase font-sans">
                                {visibleColumns.id && (
                                    <th className="p-1 text-center font-mono text-[9px] text-gray-500">
                                        {hasActiveHeaderFilters ? (
                                            <button 
                                                onClick={handleResetAllHeaderFilters}
                                                title="Limpiar todos los filtros de cabecera"
                                                className="text-amber-400 hover:text-white cursor-pointer font-bold px-1 py-0.5 rounded bg-amber-950/60 border border-amber-600/40"
                                            ><Icons.Close size={14} className="inline-block align-[-2px]" /></button>
                                        ) : (lang === 'en' ? 'filtro' : 'filtro')}
                                    </th>
                                )}
                                {visibleColumns.waveform && (
                                    <th className="p-1"></th>
                                )}
                                {visibleColumns.title && (
                                    <th className="p-1">
                                        <input 
                                            type="text" 
                                            value={filterHeaderSearch} 
                                            onChange={(e) => setFilterHeaderSearch(e.target.value)} 
                                            placeholder={t('placeholder_filter_title') || "Filtrar título..."} 
                                            className="w-full bg-djzinc-900 border border-djzinc-750 rounded px-1.5 py-0.5 text-[11px] text-gray-200 outline-none focus:border-djcyan-400 font-sans"
                                        />
                                    </th>
                                )}
                                {visibleColumns.artist && (
                                    <th className="p-1">
                                        <input 
                                            type="text" 
                                            value={filterHeaderArtist} 
                                            onChange={(e) => setFilterHeaderArtist(e.target.value)} 
                                            placeholder="Artista..." 
                                            className="w-full bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-sans"
                                        />
                                    </th>
                                )}
                                {visibleColumns.genre && (
                                    <th className="p-1 text-center">
                                        <input 
                                            type="text" 
                                            value={filterHeaderGenre} 
                                            onChange={(e) => setFilterHeaderGenre(e.target.value)} 
                                            placeholder={lang === 'en' ? "Genre..." : "Género..."} 
                                            className="w-full bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                        />
                                    </th>
                                )}
                                {visibleColumns.subgenre && (
                                    <th className="p-1 text-center">
                                        <input 
                                            type="text" 
                                            value={filterHeaderSubgenre} 
                                            onChange={(e) => setFilterHeaderSubgenre(e.target.value)} 
                                            placeholder={lang === 'en' ? "Subgenre..." : "Subgénero..."} 
                                            className="w-full bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                        />
                                    </th>
                                )}
                                {visibleColumns.format && (
                                    <th className="p-1 text-center">
                                        <select 
                                            value={filterHeaderFormat} 
                                            onChange={(e) => setFilterHeaderFormat(e.target.value)}
                                            className="bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                        >
                                            <option value="ALL">{t('filter_all_label') || 'Todos'}</option>
                                            <option value="FLAC">FLAC</option>
                                            <option value="MP3">MP3</option>
                                            <option value="WAV">WAV</option>
                                            <option value="AIFF">AIFF</option>
                                            <option value="M4A">M4A</option>
                                        </select>
                                    </th>
                                )}
                                {visibleColumns.sample_rate_khz && (
                                    <th className="p-1 text-center">
                                        <select 
                                            value={filterHeaderKhz} 
                                            onChange={(e) => setFilterHeaderKhz(e.target.value)}
                                            className="bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                        >
                                            <option value="ALL">kHz</option>
                                            <option value="44.1">44.1</option>
                                            <option value="48">48</option>
                                            <option value="96">96</option>
                                        </select>
                                    </th>
                                )}
                                {visibleColumns.bitrate_kbps && (
                                    <th className="p-1 text-center">
                                        <select 
                                            value={filterHeaderKbps} 
                                            onChange={(e) => setFilterHeaderKbps(e.target.value)}
                                            className="bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                        >
                                            <option value="ALL">kbps</option>
                                            <option value="320">≥320k</option>
                                            <option value="LOSSLESS">Lossless</option>
                                            <option value="LOW">&lt;320k</option>
                                        </select>
                                    </th>
                                )}
                                {visibleColumns.calidad && (
                                    <th className="p-1 text-center">
                                        <select 
                                            value={filterHeaderQuality} 
                                            onChange={(e) => setFilterHeaderQuality(e.target.value)}
                                            className="bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                        >
                                            <option value="ALL">Todas</option>
                                            <option value="Hi-Res">Hi-Res</option>
                                            <option value="Alta">Alta</option>
                                            <option value="Media">Media</option>
                                            <option value="Baja">Baja</option>
                                        </select>
                                    </th>
                                )}
                                {visibleColumns.perdida_pct && (
                                    <th className="p-1 text-center">
                                        <select 
                                            value={filterHeaderLoss} 
                                            onChange={(e) => setFilterHeaderLoss(e.target.value)}
                                            className="bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                        >
                                            <option value="ALL">Pérdida</option>
                                            <option value="SIN_PERDIDA">Sin Pérdida</option>
                                            <option value="CON_PERDIDA">Transcode</option>
                                        </select>
                                    </th>
                                )}
                                {visibleColumns.cutoff_khz && (
                                    <th className="p-1 text-center">
                                        <select 
                                            value={filterHeaderCutoff} 
                                            onChange={(e) => setFilterHeaderCutoff(e.target.value)}
                                            className="bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                        >
                                            <option value="ALL">FFT</option>
                                            <option value="PASS">Pass (≥20k)</option>
                                            <option value="CUT">Corte (&lt;20k)</option>
                                        </select>
                                    </th>
                                )}
                                {visibleColumns.lufs && (
                                    <th className="p-1 text-center">
                                        <select 
                                            value={filterHeaderLufs} 
                                            onChange={(e) => setFilterHeaderLufs(e.target.value)}
                                            className="bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                        >
                                            <option value="ALL">LUFS</option>
                                            <option value="CLIP">⚠️ CLIP</option>
                                            <option value="LOUD">&gt; -7 dB</option>
                                            <option value="QUIET">&lt; -14 dB</option>
                                        </select>
                                    </th>
                                )}
                                {visibleColumns.duration && (
                                    <th className="p-1 text-center">
                                        <input 
                                            type="text" 
                                            value={filterHeaderDuration} 
                                            onChange={(e) => setFilterHeaderDuration(e.target.value)} 
                                            placeholder="05:..." 
                                            className="w-full bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono text-center"
                                        />
                                    </th>
                                )}
                                {visibleColumns.bpm && (
                                    <th className="p-1 text-center">
                                        <input 
                                            type="text" 
                                            value={filterHeaderBpm} 
                                            onChange={(e) => setFilterHeaderBpm(e.target.value)} 
                                            placeholder="128..." 
                                            className="w-full bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono text-center"
                                        />
                                    </th>
                                )}
                                {visibleColumns.key && (
                                    <th className="p-1 text-center">
                                        <input 
                                            type="text" 
                                            value={filterHeaderKey} 
                                            onChange={(e) => setFilterHeaderKey(e.target.value)} 
                                            placeholder="8A..." 
                                            className="w-full bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono text-center"
                                        />
                                    </th>
                                )}
                                {visibleColumns.cues && (
                                    <th className="p-1 text-center">
                                        <select 
                                            value={filterHeaderCues} 
                                            onChange={(e) => setFilterHeaderCues(e.target.value)}
                                            className="bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                        >
                                            <option value="ALL">Cues</option>
                                            <option value="YES">Con Cues</option>
                                            <option value="NO">Sin Cues</option>
                                        </select>
                                    </th>
                                )}
                                {visibleColumns.e && (
                                    <th className="p-1 text-center">
                                        <select 
                                            value={filterHeaderEnergy} 
                                            onChange={(e) => setFilterHeaderEnergy(e.target.value)}
                                            className="bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                        >
                                            <option value="ALL">⚡</option>
                                            <option value="HIGH">&gt;80%</option>
                                            <option value="MED">65-80%</option>
                                            <option value="LOW">&lt;65%</option>
                                        </select>
                                    </th>
                                )}
                                {visibleColumns.dance && (
                                    <th className="p-1 text-center">
                                        <select 
                                            value={filterHeaderDance} 
                                            onChange={(e) => setFilterHeaderDance(e.target.value)}
                                            className="bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                        >
                                            <option value="ALL">🕺</option>
                                            <option value="HIGH">&gt;80%</option>
                                            <option value="MED">65-80%</option>
                                            <option value="LOW">&lt;65%</option>
                                        </select>
                                    </th>
                                )}
                                {visibleColumns.intensity && (
                                    <th className="p-1 text-center font-mono text-[10px] text-emerald-400 font-bold" title="Filtro Intensidad">🔥</th>
                                )}
                                {visibleColumns.valence && (
                                    <th className="p-1 text-center font-mono text-[10px] text-cyan-400 font-bold" title="Filtro Positividad">✨</th>
                                )}
                                {visibleColumns.fase_badge && (
                                    <th className="p-1 text-center">
                                        <select 
                                            value={filterHeaderPhase} 
                                            onChange={(e) => setFilterHeaderPhase(e.target.value)}
                                            className="bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                        >
                                            <option value="ALL">Fase</option>
                                            <option value="CAÑA">🔥 Caña</option>
                                            <option value="BUILD-UP">🚀 Build</option>
                                            <option value="WARM-UP">🎧 Warm</option>
                                            <option value="CIERRE">🌌 Cierre</option>
                                            <option value="CALMA">☕ Calma</option>
                                        </select>
                                    </th>
                                )}
                                {visibleColumns.acoustic_role && (
                                    <th className="p-1 text-center">
                                        <select 
                                            value={filterHeaderAcousticRole} 
                                            onChange={(e) => setFilterHeaderAcousticRole(e.target.value)}
                                            className="bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[9.5px] text-djcyan-300 outline-none font-mono"
                                        >
                                            <option value="ALL">Todos Roles</option>
                                            <option value="Bass Driver">🔴 Bass</option>
                                            <option value="Vocal / Lead">🟡 Vocal</option>
                                            <option value="Percussive Tool">🟢 Perc.</option>
                                            <option value="Balanced Full-Range">🔵 Balanced</option>
                                        </select>
                                    </th>
                                )}
                                {visibleColumns.comment && (
                                    <th className="p-1">
                                        <input 
                                            type="text" 
                                            value={filterHeaderComment} 
                                            onChange={(e) => setFilterHeaderComment(e.target.value)} 
                                            placeholder="Comentario..." 
                                            className="w-full bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                        />
                                    </th>
                                )}
                                {visibleColumns.status && (
                                    <th className="p-1 text-center">
                                        <select 
                                            value={filterHeaderStatus} 
                                            onChange={(e) => setFilterHeaderStatus(e.target.value)}
                                            className="bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
                                        >
                                            <option value="ALL">Todos</option>
                                            <option value="LOSSLESS">Lossless</option>
                                            <option value="MP3">MP3</option>
                                            <option value="FAKE">FLAC Fake</option>
                                        </select>
                                    </th>
                                )}
                                {visibleColumns.actions && (
                                    <th className="p-1"></th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-djzinc-850/60 font-sans">
                            {tracks.length === 0 && !isAuditing ? (
                                <tr>
                                    <td colSpan={Math.max(1, Object.values(visibleColumns).filter(Boolean).length)} className="py-20 text-center text-gray-400 font-mono text-xs whitespace-normal px-4">
                                        <div className="flex flex-col items-center justify-center gap-3.5 max-w-lg mx-auto py-8">
                                            <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)]">
                                                <Icons.Library size={28} />
                                            </div>
                                            <div className="space-y-1">
                                                <strong className="text-white text-base font-syne font-bold block">Cabina de Auditoría Vacía</strong>
                                                <p className="text-xs text-gray-400 font-sans leading-relaxed max-w-md">
                                                    Carga una carpeta de tu colección musical para auditar frecuencias, BPM, claves armónicas y 8 Hot Cues, o activa la simulación para explorar la cabina con pistas demo.
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                                                <button
                                                    type="button"
                                                    onClick={handleExplorar}
                                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-djcyan-400 to-djcyan-500 hover:from-djcyan-300 hover:to-djcyan-400 text-black font-sans font-bold text-xs shadow-lg shadow-djcyan-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Icons.Folder size={15} />
                                                    <span>Cargar Carpeta de Música</span>
                                                </button>
                                                {onToggleSimulation && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onToggleSimulation(true)}
                                                        className="px-4 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 hover:border-purple-400 text-purple-200 hover:text-white font-sans font-bold text-xs shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <Icons.Zap size={15} />
                                                        <span>Cargar Simulación Demo</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : tracksFiltrados.length === 0 && !isAuditing ? (
                                <tr>
                                    <td colSpan={Math.max(1, Object.values(visibleColumns).filter(Boolean).length)} className="py-16 text-center text-gray-400 font-mono text-xs whitespace-normal px-4">
                                        <div className="flex flex-col items-center justify-center gap-2.5 max-w-md mx-auto">
                                            <Icons.Search size={14} className="inline-block align-[-2px]" />
                                            <strong className="text-white text-sm">Sin coincidencias con los filtros activos</strong>
                                            <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                                                Hay {tracks.length} pista(s) cargadas en la biblioteca, pero los filtros de columna actuales ocultan todos los resultados.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleResetAllHeaderFilters}
                                                className="mt-1 px-3 py-1.5 rounded-lg bg-djcyan-500/20 hover:bg-djcyan-500/30 text-djcyan-300 border border-djcyan-500/40 text-xs font-mono font-bold cursor-pointer transition-all active:scale-95"
                                            >
                                                <Icons.Close size={14} className="inline-block align-[-2px]" /> Limpiar Filtros de Cabecera
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : null}
                            {/* PERF: Virtualización — espaciador superior */}
                            {virtualPaddingTop > 0 && <tr aria-hidden="true" style={{ height: virtualPaddingTop }}><td colSpan={Math.max(1, Object.values(visibleColumns).filter(Boolean).length)} /></tr>}
                            {(virtualRows?.length > 0 ? virtualRows : tracksFiltrados.slice(0, 60)).map((row, i) => {
                                const isRowPlaying = nowPlayingTrack && String(nowPlayingTrack.id) === String(row.id) && isPlaying;
                                const coverUrl = getValidCover(row.cover || (row.path ? `/cover?path=${encodeURIComponent(row.path)}` : (row.f ? `/cover?path=${encodeURIComponent(row.f)}` : null)));
                                const isFake = Boolean(row.es_fake || (row.format === 'FLAC' && String(row.status || '').includes('Fake')));
                                return (
                                    <tr 
                                        key={row.id !== undefined ? row.id : (row.file_path || i)} 
                                        draggable={true}
                                        onDragStart={(e) => {
                                            const idsToDrag = selectedAuditIds.has(row.id)
                                                ? Array.from(selectedAuditIds)
                                                : [row.id !== undefined ? row.id : (row.file_path || row.filename)];
                                            e.dataTransfer.setData('text/plain', JSON.stringify(idsToDrag));
                                            e.dataTransfer.effectAllowed = 'copyMove';
                                        }}
                                        onClick={() => { setSelectedTrack(row.id); setSidebarOpen(true); if (onPlayTrack) onPlayTrack(row, 0, false); }} 
                                        className={`cursor-pointer select-none transition-colors ${selectedTrack === row.id ? 'bg-djcyan-950/40 border-l-2 border-djcyan-400' : 'hover:bg-djzinc-850/40'}`}
                                    >
                                        {visibleColumns.id && (
                                            <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedAuditIds.has(row.id)}
                                                        onChange={(e) => handleToggleSelectRow(row.id, e)}
                                                        className="accent-djcyan-500 cursor-pointer w-3.5 h-3.5 rounded"
                                                    />
                                                    <span className="text-djzinc-500 font-mono text-[10px] w-4 text-right">{row.id}</span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.waveform && (
                                            <td className="py-2 px-2 text-center">
                                                <TableHarmonicWaveform 
                                                    track={row} 
                                                    duration={row.duration || '05:00'} 
                                                    onPlayTrack={onPlayTrack} 
                                                    onTogglePlay={onTogglePlay} 
                                                    isCurrentPlaying={isRowPlaying} 
                                                    playProgress={isRowPlaying ? playProgress : 0} 
                                                />
                                            </td>
                                        )}
                                        {visibleColumns.title && (
                                            <td className="py-2 px-3">
                                                <div className="flex items-center gap-3">
                                                    <img 
                                                        src={coverUrl} 
                                                        className="w-9 h-9 rounded bg-djzinc-800 object-cover shrink-0 border border-djzinc-700 shadow-sm" 
                                                        alt="cover" 
                                                        onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }} 
                                                    />
                                                    <div className="flex flex-col min-w-0 text-left">
                                                        <span className="font-semibold text-djcyan-400 text-xs truncate max-w-[210px] flex items-center gap-1.5" title={row.t || row.title || row.f}>
                                                            <span className="truncate">{row.t || row.title || row.f || 'Desconocido'}</span>
                                                            {row.version_type && row.version_type !== 'standard' && (
                                                                <span className="px-1 py-0.2 rounded text-[8px] font-mono font-black uppercase bg-purple-950 text-purple-300 border border-purple-700/60 shrink-0">
                                                                    {row.version_type}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-mono truncate max-w-[210px]" title={row.f}>
                                                            {row.f || ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.artist && (
                                            <td className="py-2 px-2 text-gray-300 truncate max-w-[120px]" title={row.a || row.artist}>{row.a || row.artist}</td>
                                        )}

                                        {/* GÉNERO */}
                                        {visibleColumns.genre && (
                                            <td className="py-2 px-2 text-center">
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/70 text-purple-300 border border-purple-800/60 truncate max-w-[95px] inline-block shadow-sm" title={row.genre || 'House'}>
                                                    {row.genre || 'House'}
                                                </span>
                                            </td>
                                        )}

                                        {/* SUBGÉNERO */}
                                        {visibleColumns.subgenre && (
                                            <td className="py-2 px-2 text-center">
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-djzinc-850 text-gray-300 border border-djzinc-750 truncate max-w-[110px] inline-block" title={(!row.subgenre || ['Pop', 'Electronic', 'Dance', 'Club', 'Other'].includes(row.subgenre)) ? (row.genre || 'Tech House') : row.subgenre}>
                                                    {(!row.subgenre || ['Pop', 'Electronic', 'Dance', 'Club', 'Other'].includes(row.subgenre)) ? (row.genre || 'Tech House') : row.subgenre}
                                                </span>
                                            </td>
                                        )}

                                        {/* FORMATO */}
                                        {visibleColumns.format && (
                                            <td className="py-2 px-2 text-center">
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-djzinc-850 text-djcyan-400 border border-djzinc-750">
                                                    {row.format || (row.f ? row.f.split('.').pop().toUpperCase() : 'FLAC')}
                                                </span>
                                            </td>
                                        )}

                                        {/* KHZ */}
                                        {visibleColumns.sample_rate_khz && (
                                            <td className="py-2 px-2 text-center font-mono text-[10px] text-gray-300">
                                                {row.sample_rate_khz ? `${row.sample_rate_khz} kHz` : '44.1 kHz'}
                                            </td>
                                        )}

                                        {/* KBPS */}
                                        {visibleColumns.bitrate_kbps && (
                                            <td className="py-2 px-2 text-center font-mono text-[10px] text-gray-300">
                                                {row.bitrate_kbps ? `${row.bitrate_kbps} kbps` : (row.format === 'MP3' ? '320 kbps' : '1062 kbps')}
                                            </td>
                                        )}

                                        {/* CALIDAD */}
                                        {visibleColumns.calidad && (
                                            <td className="py-2 px-2 text-center">
                                                <div className="flex flex-col items-center justify-center gap-1">
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                                                        isFake ? 'bg-red-950 text-red-400 border-red-800' :
                                                        (String(row.calidad || '').includes('Alta') || String(row.calidad || '').includes('Hi-Res')) ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' :
                                                        String(row.calidad || '').includes('Media') ? 'bg-amber-950/80 text-amber-400 border-amber-800' :
                                                        (row.calidad && row.calidad !== 'Pendiente Auditoría') ? 'bg-red-950/80 text-red-400 border-red-800' :
                                                        'bg-djzinc-850 text-gray-400 border-djzinc-750'
                                                    }`}>
                                                        {row.calidad || (isFake ? 'Baja' : 'Alta')}
                                                    </span>
                                                    {isFlacUpgradeCandidate(row) ? (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleBuscarReemplazosSpotify([row]);
                                                            }}
                                                            className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-black bg-gradient-to-r from-cyan-950 to-purple-950 hover:from-cyan-900 hover:to-purple-900 text-cyan-300 border border-cyan-500/70 cursor-pointer shadow-sm flex items-center justify-center gap-1 transition-all active:scale-95"
                                                            title="FLAC no cumple estándares lossless o es de calidad media/fake. Buscar master oficial en Catálogo Global (SuperFLAC)"
                                                        >
                                                            <Icons.Gem size={14} className="inline-block align-[-2px]" />
                                                            <span>SuperFLAC</span>
                                                        </button>
                                                    ) : isBadQualityTrack(row) ? (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleBuscarReemplazosSpotify([row]);
                                                            }}
                                                            className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-600/70 cursor-pointer shadow flex items-center justify-center gap-1 transition-all active:scale-95"
                                                            title="Buscar versión oficial en el Record Pool para sustituir este track"
                                                        >
                                                            <Icons.Refresh size={14} className="inline-block align-[-2px]" />
                                                            <span>Catálogo HD</span>
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        )}

                                        {/* PÉRDIDA / COMPRESIÓN */}
                                        {visibleColumns.perdida_pct && (
                                            <td className="py-2 px-3 text-center">
                                                {isFake ? (
                                                    <span className="text-[10px] font-mono text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800" title={`Corte espectral a ${row.cutoff_khz || '--'}kHz`}>
                                                        <Icons.Warning size={14} className="inline-block align-[-2px]" /> Transcode ({row.perdida_pct || 0}%)
                                                    </span>
                                                ) : row.perdida === 'Sin Pérdida' ? (
                                                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/60">
                                                        Sin Pérdida
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-mono text-gray-300">
                                                        {row.perdida || 'Sin auditar'}
                                                    </span>
                                                )}
                                            </td>
                                        )}

                                        {/* CERT. FFT */}
                                        {visibleColumns.cutoff_khz && (
                                            <td className="py-2 px-1.5 text-center">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${isFake ? 'bg-red-950 text-red-400 border-red-800' : 'bg-djgreen-950/80 text-djgreen-400 border-djgreen-800'}`}>
                                                    {row.cutoff_khz ? `${row.cutoff_khz}kHz` : 'PASS'}
                                                </span>
                                            </td>
                                        )}

                                        {/* LUFS & TRUE PEAK */}
                                        {visibleColumns.lufs && (
                                            <td className="py-2 px-1.5 text-center font-mono">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className={`text-[10px] font-bold ${row.lufs > -7 ? 'text-amber-400' : (row.lufs && row.lufs <= -14) ? 'text-cyan-400' : 'text-emerald-400'}`}>
                                                        {row.lufs !== undefined ? `${row.lufs} LUFS` : '-9.0 LUFS'}
                                                    </span>
                                                    <span className={`text-[9px] ${row.clipping ? 'text-red-400 font-black animate-pulse' : 'text-gray-500'}`} title={row.clipping ? 'Clipping detectado: pico real supera 0.0 dBFS' : 'Pico inter-sample en rango'}>
                                                        {row.clipping ? '⚠️ CLIP' : `${row.true_peak !== undefined ? (row.true_peak > 0 ? `+${row.true_peak}` : row.true_peak) : '-0.1'}dB`}
                                                    </span>
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.duration && (
                                            <td className="py-2 px-1.5 text-center text-gray-400 font-mono">{row.duration}</td>
                                        )}
                                        {visibleColumns.bpm && (
                                            <td className="py-2 px-1.5 text-center"><span className="ws-bpm text-[13px]">{row.b || '--'}</span></td>
                                        )}
                                        {visibleColumns.key && (
                                            <td className="py-2 px-1.5 text-center" title={getHarmonicKeyDisplay(row.k)}>
                                                <CamelotKeyBadge value={row.k} />
                                            </td>
                                        )}
                                        {visibleColumns.beatgrid_status && (
                                            <td className="py-2 px-1.5 text-center">
                                                {parseFloat(row.first_downbeat_ms || 0) > 0 ? (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onOpenBeatgridStudio) onOpenBeatgridStudio(row.id);
                                                            else if (onNavigateTab) { setSelectedTrack(row.id); onNavigateTab('hotcues'); }
                                                        }}
                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/80 hover:bg-blue-900 text-cyan-400 hover:text-white border border-blue-800/60 shadow-sm cursor-pointer transition-all active:scale-95"
                                                        title={`Beatgrid 1.0.0 bloqueado al transitorio del primer golpe de bombo real a ${Number(row.first_downbeat_ms).toFixed(1)} ms. Clic para editar en el Estudio.`}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                                                        {`1.0.0 (${Number(row.first_downbeat_ms).toFixed(0)}ms)`}
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onOpenBeatgridStudio) onOpenBeatgridStudio(row.id);
                                                            else if (onNavigateTab) { setSelectedTrack(row.id); onNavigateTab('hotcues'); }
                                                        }}
                                                        className="text-zinc-500 hover:text-zinc-300 text-[10px] font-mono cursor-pointer underline-offset-2 hover:underline"
                                                        title="Beatgrid no auditado. Clic para calibrar manualmente en el Estudio."
                                                    >
                                                        ⚪ Calibrar
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                        {visibleColumns.trim_silences && (
                                            <td className="py-2 px-1.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onOpenBeatgridStudio) onOpenBeatgridStudio(row.id);
                                                        else if (onNavigateTab) { setSelectedTrack(row.id); onNavigateTab('hotcues'); }
                                                    }}
                                                    className="inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                                    title="Clic para ajustar recorte manual de silencios (Trim In / Trim Out) en el Estudio"
                                                >
                                                    {parseFloat(row.trim_start_ms || 0) > 0 ? (
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${parseFloat(row.trim_start_ms) > 150 ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'}`}>
                                                            {`-${Number(row.trim_start_ms).toFixed(0)}ms`}
                                                        </span>
                                                    ) : (
                                                        <span className="text-zinc-500 hover:text-zinc-300 text-[10px] font-mono hover:underline">0ms</span>
                                                    )}
                                                </button>
                                            </td>
                                        )}
                                        {visibleColumns.cues && (
                                            <td className="py-2 px-1.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedTrack(row.id);
                                                        if (onNavigateTab) {
                                                            onNavigateTab('hotcues');
                                                        } else {
                                                            setCueStudioModalOpen(true);
                                                        }
                                                    }}
                                                    className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-pink-950/80 hover:bg-pink-900 text-pink-300 border border-pink-800/60 transition-all shadow active:scale-95 cursor-pointer"
                                                    title="Abrir Estudio de Hot Cues a pantalla completa con reproductor"
                                                >
                                                    <Icons.Sliders size={14} className="inline-block align-[-2px]" /> 8 Cues
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onAddTrackToSet) {
                                                            onAddTrackToSet(row);
                                                        }
                                                    }}
                                                    className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-djcyan-950/80 hover:bg-djcyan-900 text-djcyan-300 border border-djcyan-800/60 transition-all shadow active:scale-95 cursor-pointer ml-1"
                                                    title="Añadir pista a Set-Builder & Energy Flow Canvas"
                                                >
                                                    <Icons.Plus size={14} className="inline-block align-[-2px]" /> Set
                                                </button>
                                            </td>
                                        )}

                                        {/* ENERGÍA */}
                                        {visibleColumns.e && (
                                            <td className="py-2 px-2 text-center">
                                                <div className="flex flex-col items-center justify-center gap-0.5 w-16 mx-auto">
                                                    <div className="flex items-center justify-between w-full text-[9px] font-mono">
                                                        <Icons.Zap size={14} className="inline-block align-[-2px] text-gray-400" />
                                                        <span className={`font-bold ${row.e >= 82 ? 'text-red-400' : row.e >= 68 ? 'text-amber-400' : 'text-djcyan-400'}`}>{row.e || 80}%</span>
                                                    </div>
                                                    <div className="w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750">
                                                        <div 
                                                            className={`h-full rounded-full ${row.e >= 82 ? 'bg-gradient-to-r from-amber-500 to-red-500' : row.e >= 68 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500'}`} 
                                                            style={{ width: `${Math.min(100, Math.max(10, row.e || 80))}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {/* DANCEABILITY */}
                                        {visibleColumns.dance && (
                                            <td className="py-2 px-2 text-center">
                                                <div className="flex flex-col items-center justify-center gap-0.5 w-16 mx-auto">
                                                    <div className="flex items-center justify-between w-full text-[9px] font-mono">
                                                        <Icons.Activity size={14} className="inline-block align-[-2px] text-gray-400" />
                                                        <span className="font-bold text-purple-300">{row.dance || row.danceability || 80}%</span>
                                                    </div>
                                                    <div className="w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750">
                                                        <div 
                                                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" 
                                                            style={{ width: `${Math.min(100, Math.max(10, row.dance || row.danceability || 80))}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {/* INTENSIDAD (AROUSAL) */}
                                        {visibleColumns.intensity && (
                                            <td className="py-2 px-2 text-center">
                                                <div className="flex flex-col items-center justify-center gap-0.5 w-16 mx-auto">
                                                    <div className="flex items-center justify-between w-full text-[9px] font-mono">
                                                        <span className="text-[10px]">🔥</span>
                                                        <span className="font-bold text-emerald-400">{row.arousal || row.intensity || Math.round((row.e || 80) * 0.95)}%</span>
                                                    </div>
                                                    <div className="w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750">
                                                        <div 
                                                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" 
                                                            style={{ width: `${Math.min(100, Math.max(10, row.arousal || row.intensity || Math.round((row.e || 80) * 0.95)))}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {/* POSITIVIDAD (VALENCE) */}
                                        {visibleColumns.valence && (
                                            <td className="py-2 px-2 text-center">
                                                <div className="flex flex-col items-center justify-center gap-0.5 w-16 mx-auto">
                                                    <div className="flex items-center justify-between w-full text-[9px] font-mono">
                                                        <span className="text-[10px]">✨</span>
                                                        <span className="font-bold text-cyan-300">{row.valence != null ? row.valence : (row.key && row.key.includes('B') ? 65 : 45)}%</span>
                                                    </div>
                                                    <div className="w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750">
                                                        <div 
                                                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_6px_rgba(6,182,212,0.5)]" 
                                                            style={{ width: `${Math.min(100, Math.max(10, row.valence != null ? row.valence : (row.key && row.key.includes('B') ? 65 : 45)))}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {/* FASE DJ / MOOD */}
                                        {visibleColumns.fase_badge && (
                                            <td className="py-2 px-2 text-center">
                                                {(() => {
                                                    const badge = row.fase_badge || (row.e >= 82 ? 'CAÑA' : row.e >= 68 ? 'BUILD-UP' : (row.bpm && parseFloat(row.bpm) < 118 ? 'CALMA' : 'WARM-UP'));
                                                    const colorMap = {
                                                        'CAÑA': 'bg-red-950/80 text-red-300 border-red-700 shadow-[0_0_8px_rgba(239,68,68,0.3)]',
                                                        'BUILD-UP': 'bg-amber-950/80 text-amber-300 border-amber-700',
                                                        'WARM-UP': 'bg-cyan-950/80 text-cyan-300 border-cyan-700',
                                                        'CIERRE': 'bg-purple-950/80 text-purple-300 border-purple-700',
                                                        'CALMA': 'bg-teal-950/80 text-teal-300 border-teal-700'
                                                    };
                                                    const iconMap = {
                                                        'CAÑA': '🔥',
                                                        'BUILD-UP': '🚀',
                                                        'WARM-UP': '🎧',
                                                        'CIERRE': '🌌',
                                                        'CALMA': '☕'
                                                    };
                                                    return (
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border inline-flex items-center gap-1 ${colorMap[badge] || 'bg-djzinc-800 text-gray-300 border-djzinc-700'}`} title={row.fase_dj || row.recomendacion_dj || row.mood}>
                                                            <span>{iconMap[badge] || '🎵'}</span>
                                                            <span>{badge}</span>
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                        )}

                                        {/* ROL ACÚSTICO & ANTI-MUDDY */}
                                        {visibleColumns.acoustic_role && (
                                            <td className="py-2 px-2 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold border ${
                                                        row.acoustic_role === 'Bass Driver' 
                                                            ? 'bg-rose-950/80 text-rose-300 border-rose-700/80' 
                                                            : row.acoustic_role === 'Vocal / Lead'
                                                                ? 'bg-amber-950/80 text-amber-300 border-amber-700/80'
                                                                : row.acoustic_role === 'Percussive Tool'
                                                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                                                                    : 'bg-djzinc-850 text-gray-300 border-djzinc-700'
                                                    }`} title={`Ratio Espectral: Low ${row.low_ratio || 33}% | Mid ${row.mid_ratio || 33}% | High ${row.high_ratio || 34}%`}>
                                                        {row.acoustic_role === 'Bass Driver' ? '🔴 Bass Driver' : row.acoustic_role === 'Vocal / Lead' ? '🟡 Vocal / Lead' : row.acoustic_role === 'Percussive Tool' ? '🟢 Percussive' : '🔵 Balanced'}
                                                    </span>

                                                    {/* Indicador Anti-Muddy dinámico frente a pista seleccionada */}
                                                    {currentTrack && String(currentTrack.id) !== String(row.id) && (
                                                        (() => {
                                                            const isCurBass = (currentTrack.low_ratio || 33) >= 45 || currentTrack.acoustic_role === 'Bass Driver';
                                                            const isRowBass = (row.low_ratio || 33) >= 45 || row.acoustic_role === 'Bass Driver';
                                                            if (isCurBass && isRowBass) {
                                                                return (
                                                                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-red-950 text-red-300 border border-red-700/80 animate-pulse" title="Riesgo de colisión en subgraves 30-80 Hz">
                                                                        <Icons.Warning size={14} className="inline-block align-[-2px]" /> Colisión Bass
                                                                    </span>
                                                                );
                                                            } else if ((isCurBass && (row.acoustic_role === 'Vocal / Lead' || row.acoustic_role === 'Percussive Tool')) || (isRowBass && (currentTrack.acoustic_role === 'Vocal / Lead' || currentTrack.acoustic_role === 'Percussive Tool'))) {
                                                                return (
                                                                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/80" title="Frecuencias complementarias: Mezcla limpia garantizada">
                                                                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 " aria-hidden="true" /> Anti-Muddy Compl.
                                                                    </span>
                                                                );
                                                            }
                                                            return null;
                                                        })()
                                                    )}
                                                </div>
                                            </td>
                                        )}

                                        {/* COMENTARIO PRO DJ */}
                                        {visibleColumns.comment && (
                                            <td className="py-2 px-2 text-left">
                                                <div className="flex items-center gap-1.5 max-w-[260px]">
                                                    <Icons.MessageSquare size={14} className="inline-block align-[-2px] text-emerald-400  shrink-0" />
                                                    <span className="text-[10.5px] font-mono text-gray-200 truncate" title={row.comment || `[${row.b || '--'} BPM | ${row.k || '--'}] Intro limpia 32b • Drop contundente • Outro 64b`}>
                                                        {row.comment || `[${row.b || '--'} BPM | ${row.k || '--'}] Intro limpia 32b • Drop contundente • Outro 64b`}
                                                    </span>
                                                </div>
                                            </td>
                                        )}

                                        {/* ESTADO */}
                                        {visibleColumns.status && (
                                            <td className="py-2 px-2 text-center">
                                                {isFake ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-red-950 text-red-400 border border-red-700 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" title="¡Alerta! Falso FLAC con corte lossy previo">
                                                        FLAC FAKE
                                                    </span>
                                                ) : String(row.status || '').includes('VERDADERO') || String(row.status || '').includes('True') || String(row.status || '').includes('HI-RES') ? (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                                        {row.status}
                                                    </span>
                                                ) : row.format === 'MP3' || String(row.status || '').includes('MP3') ? (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-djzinc-850 text-cyan-300 border border-djzinc-700">
                                                        {row.status}
                                                    </span>
                                                ) : (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-djzinc-850 text-gray-300 border border-djzinc-750">
                                                        {row.status}
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        {visibleColumns.actions && (
                                            <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    type="button"
                                                    onClick={(e) => handleRemoveSingleTrack(row.id, e)}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/60 border border-transparent hover:border-red-800/60 cursor-pointer transition-all active:scale-90"
                                                    title="Quitar pista del análisis (eliminar de la lista global)"
                                                >
                                                    <Icons.Trash size={14} className="inline-block align-[-2px]" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                            {/* PERF: Virtualización — espaciador inferior */}
                            {virtualPaddingBottom > 0 && <tr aria-hidden="true" style={{ height: virtualPaddingBottom }}><td colSpan={Math.max(1, Object.values(visibleColumns).filter(Boolean).length)} /></tr>}
                        </tbody>
                    </table>

                    {/* VISTA MÓVIL TÁCTIL: TARJETAS RESPONSIVAS (< 768px) CON PB-36 */}
                    <div className="block md:hidden p-2 space-y-2.5 pb-36">
                        {tracksFiltrados.length === 0 && !isAuditing && (
                            <div className="py-14 text-center text-gray-400 font-mono text-xs px-4 flex flex-col items-center gap-2">
                                <Icons.Search size={14} className="inline-block align-[-2px]" />
                                <span className="text-white font-bold">Sin coincidencias con los filtros</span>
                                <button
                                    type="button"
                                    onClick={handleResetAllHeaderFilters}
                                    className="mt-1 px-3 py-1.5 rounded-lg bg-djcyan-500/20 text-djcyan-300 border border-djcyan-500/40 text-xs font-mono font-bold cursor-pointer"
                                >
                                    Limpiar Filtros
                                </button>
                            </div>
                        )}
                        {virtualPaddingTop > 0 && <div aria-hidden="true" style={{ height: virtualPaddingTop }} />}
                        {(virtualRows && virtualRows.length > 0 ? virtualRows : tracksFiltrados.slice(0, 40)).map((row) => {
                            const isRowPlaying = nowPlayingTrack && String(nowPlayingTrack.id) === String(row.id) && isPlaying;
                            const coverUrl = getValidCover(row.cover || (row.path ? `/cover?path=${encodeURIComponent(row.path)}` : (row.f ? `/cover?path=${encodeURIComponent(row.f)}` : null)));
                            const isFake = Boolean(row.es_fake || (row.format === 'FLAC' && String(row.status || '').includes('Fake')));
                            const isSelected = selectedTrack === row.id;
                            const isChecked = selectedAuditIds.has(row.id);
                            const isSuperFlacCandidate = (row.format === 'FLAC' && (row.calidad === 'Media' || row.calidad === 'Baja' || isFake));

                            return (
                                <div 
                                    key={`mob_trk_${row.id}`} 
                                    onClick={() => { setSelectedTrack(row.id); setSidebarOpen(true); if (onPlayTrack) onPlayTrack(row, 0, false); }}
                                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                        isSelected 
                                            ? 'bg-gradient-to-r from-djcyan-950/70 to-djzinc-900 border-djcyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]' 
                                            : 'bg-djzinc-900/90 border-djzinc-800 hover:border-djzinc-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Mini Cover con Play Button Táctil */}
                                        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <img 
                                                src={coverUrl} 
                                                className="w-12 h-12 rounded-lg bg-djzinc-800 object-cover border border-djzinc-700 shadow-md" 
                                                alt="cover" 
                                                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }} 
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isRowPlaying) {
                                                        if (onTogglePlay) onTogglePlay();
                                                    } else {
                                                        if (onPlayTrack) onPlayTrack(row, 0, true);
                                                    }
                                                }}
                                                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-lg border border-black/50 ${
                                                    isRowPlaying 
                                                        ? 'bg-emerald-400 text-black font-black animate-pulse' 
                                                        : 'bg-djcyan-500 text-black font-bold'
                                                }`}
                                            >
                                                {isRowPlaying ? '❚❚' : '▶'}
                                            </button>
                                        </div>

                                        {/* Título, Artista y Checkbox */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-1">
                                                <h4 className="font-bold text-xs text-white truncate" title={row.t || row.title || row.f}>
                                                    {row.t || row.title || row.f || 'Desconocido'}
                                                </h4>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isChecked}
                                                    onChange={(e) => { e.stopPropagation(); handleToggleSelectRow(row.id, e); }}
                                                    className="accent-djcyan-500 cursor-pointer w-4 h-4 rounded shrink-0 mt-0.5"
                                                />
                                            </div>
                                            <p className="text-[11px] text-djcyan-400 font-medium truncate" title={row.a || row.artist}>
                                                {row.a || row.artist || 'Artista Desconocido'}
                                            </p>
                                            <p className="text-[9.5px] text-gray-500 font-mono truncate">
                                                {row.f || ''}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Insignias Acústicas y DSP */}
                                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-djzinc-800/80">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                            isFake 
                                                ? 'bg-red-950/80 text-red-300 border-red-700/80 animate-pulse' 
                                                : (row.format === 'FLAC' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60' : 'bg-djzinc-850 text-gray-300 border-djzinc-700')
                                        }`}>
                                            {isFake ? '⚠️ FLAC FALSO' : (row.format || 'FLAC')}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0d0d16] text-djcyan-400 border border-djzinc-750">
                                            {row.b ? `${parseFloat(row.b).toFixed(1)} BPM` : (row.bpm ? `${parseFloat(row.bpm).toFixed(1)} BPM` : '-- BPM')}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#130d1e] text-purple-300 border border-purple-800/60">
                                            {row.k || row.key || '--'}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-300 bg-djzinc-850 border border-djzinc-750">
                                            {row.sample_rate_khz ? `${row.sample_rate_khz} kHz` : '--'}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-300 bg-djzinc-850 border border-djzinc-750">
                                            {row.cutoff_khz ? `FFT ${row.cutoff_khz}k` : '--'}
                                        </span>
                                        {row.fase_badge && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                                                {row.fase_badge}
                                            </span>
                                        )}
                                        {row.e && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-amber-950/60 text-amber-300 border border-amber-800/60">
                                                <Icons.Zap size={14} className="inline-block align-[-2px]" /> {row.e}%
                                            </span>
                                        )}
                                        <div className="ml-auto flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTrack(row.id);
                                                    if (onNavigateTab) onNavigateTab('hotcues');
                                                }}
                                                className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-pink-950/80 text-pink-300 border border-pink-800/60 cursor-pointer"
                                            >
                                                <Icons.Sliders size={14} className="inline-block align-[-2px]" /> Cues
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (onAddTrackToSet) onAddTrackToSet(row);
                                                }}
                                                className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-djcyan-950/80 text-djcyan-300 border border-djcyan-800/60 cursor-pointer"
                                            >
                                                <Icons.Plus size={14} className="inline-block align-[-2px]" /> Set
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => handleRemoveSingleTrack(row.id, e)}
                                                className="p-1 rounded text-[11px] font-mono bg-red-950/60 hover:bg-red-900 text-red-400 hover:text-white border border-red-800/60 cursor-pointer transition-colors active:scale-90"
                                                title="Quitar del análisis"
                                            >
                                                <Icons.Trash size={14} className="inline-block align-[-2px]" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Botón de SuperFLAC si es de baja/media calidad */}
                                    {isSuperFlacCandidate && (
                                        <div className="mt-2 pt-2 border-t border-djzinc-800/60 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                                            <span className="text-[10px] font-mono text-amber-400">
                                                Calidad {row.calidad || 'Mejorable'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (onSendToSpotify) {
                                                        onSendToSpotify({
                                                            title: row.t || row.title,
                                                            artist: row.a || row.artist,
                                                            format: 'FLAC',
                                                            origin: 'audit_upgrade',
                                                            reemplazo_de: row.id,
                                                            original_file: row.f || row.title,
                                                            original_path: row.path
                                                        }, 'audit_upgrade');
                                                    }
                                                    if (onNavigateTab) onNavigateTab('spotify');
                                                }}
                                                className="px-2.5 py-1 rounded bg-gradient-to-r from-emerald-500 to-djcyan-500 hover:from-emerald-400 hover:to-djcyan-400 text-black text-[10px] font-mono font-black flex items-center gap-1 shadow cursor-pointer active:scale-95"
                                            >
                                                <Icons.Search size={14} className="inline-block align-[-2px]" />
                                                <span>SuperFLAC Lossless HD</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {virtualPaddingBottom > 0 && <div aria-hidden="true" style={{ height: virtualPaddingBottom }} />}
                    </div>
                    </>
                )}
                </div>
                </div>
            </div>

            {sidebarOpen && currentTrack && (currentTrack.id || currentTrack.id === 0) && (
                <>
                    {/* Backdrop oscuro para móvil y desktop */}
                    <div 
                        onClick={() => setSidebarOpen(false)} 
                        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-fadeIn" 
                        style={{ zIndex: 99998 }}
                        aria-hidden="true" 
                    />
                    <aside 
                        key={currentTrack ? currentTrack.id : "none"} 
                        style={{ width: '100%', maxWidth: `${inspectorWidth}px`, zIndex: 99999 }}
                        className="ws-inspector fixed top-0 bottom-0 right-0 h-full bg-[#0a0b14] border-l-4 border-l-cyan-400 shadow-[-25px_0_60px_rgba(0,0,0,1)] flex flex-col font-sans text-gray-200 animate-slideInRight"
                    >
                    {/* Manija táctil de redimensión (Drag to Resize) para Desktop */}
                    <div 
                        onPointerDown={onInspectorResizeDown}
                        onDoubleClick={onInspectorResetWidth}
                        className="hidden md:flex absolute top-0 bottom-0 -left-2 w-4 cursor-ew-resize items-center justify-center z-50 group select-none hover:bg-cyan-500/10 transition-colors"
                        title="Arrastra para redimensionar el inspector (Doble clic para restablecer a 540px)"
                    >
                        <div className="w-1 h-12 rounded-full bg-zinc-600 group-hover:bg-cyan-400 group-hover:scale-y-125 transition-all shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                    </div>
                    {/* Cabecera del Inspector unificada con el Look & Feel de BeatWave */}
                    <div className="px-5 py-3.5 border-b border-djzinc-800 bg-[#0d0e1c] flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-djcyan-950/80 border border-djcyan-500/50 flex items-center justify-center text-djcyan-400 text-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0 font-black">
                                <Icons.Sliders size={18} className="text-djcyan-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xs sm:text-sm font-mono font-black uppercase text-white tracking-wider">
                                        TRACK INSPECTOR
                                    </h3>
                                    <span className="text-[9.5px] bg-djcyan-950/90 text-djcyan-300 border border-djcyan-500/60 px-2 py-0.5 rounded-full font-mono font-black">
                                        ID #{currentTrack.id || '--'}
                                    </span>
                                </div>
                                <p className="text-[10.5px] text-gray-400 font-mono truncate max-w-[280px] sm:max-w-[400px]">
                                    ANÁLISIS ACÚSTICO, TAGS & METADATOS
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button 
                                onClick={() => setSidebarOpen(false)} 
                                className="h-8 px-2.5 sm:px-2 rounded-xl bg-[#14162a] hover:bg-amber-950/60 text-gray-300 hover:text-amber-300 flex items-center justify-center gap-1.5 border border-djzinc-700 hover:border-amber-400/80 transition-colors cursor-pointer text-xs font-mono font-bold"
                                aria-label={t('btn_close_panel') || 'Cerrar Panel'}
                                title={t('btn_close_panel') || 'Cerrar Panel'}
                            >
                                <Icons.Close size={15} />
                                <span className="sm:hidden font-mono text-[11px]">Cerrar</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Direct Link to Hot Cues Studio */}
                        <button 
                            type="button"
                            onClick={() => {
                                if (currentTrack && currentTrack.id) {
                                    setSelectedTrack(currentTrack.id);
                                }
                                if (onNavigateTab) {
                                    onNavigateTab('hotcues');
                                }
                            }}
                            className="ws-btn ws-btn-outline w-full justify-center h-9"
                            title="Abrir este track en la pestaña Estudio Hot Cues a pantalla completa con Beatgrid ampliado"
                        >
                            <Icons.Sliders size={14} className="inline-block align-[-2px]" />
                            <span>{t('btn_edit_cues_studio') || 'Editar Hot Cues en Estudio'}</span>
                        </button>

                        {/* Carátula Replicada en el Inspector */}
                    <div className="w-full aspect-video bg-djzinc-950 rounded-lg border border-djzinc-800 relative group overflow-hidden flex items-center justify-center shadow-inner">
                        <img 
                            src={getValidCover(currentTrack.cover || (currentTrack.path ? `/cover?path=${encodeURIComponent(currentTrack.path)}` : (currentTrack.f ? `/cover?path=${encodeURIComponent(currentTrack.f)}` : null)))} 
                            alt="Cover Art" 
                            onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }}
                            className="w-full h-full object-cover" 
                        />
                        <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-gray-300 font-mono backdrop-blur border border-djzinc-700">
                            ID3v2.4
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <h4 className="font-bold text-sm text-djcyan-400 truncate" title={currentTrack.t || currentTrack.title}>{currentTrack.t || currentTrack.title || 'Selecciona un track'}</h4>
                            <p className="text-xs text-gray-400 truncate" title={currentTrack.a || currentTrack.artist}>{currentTrack.a || currentTrack.artist || '--'}</p>
                        </div>
                        <button 
                            onClick={() => {
                                if (nowPlayingTrack && (String(nowPlayingTrack.id) === String(currentTrack.id) || nowPlayingTrack.path === currentTrack.path || nowPlayingTrack.f === currentTrack.f)) {
                                    onTogglePlay && onTogglePlay();
                                } else {
                                    onPlayTrack && onPlayTrack(currentTrack, 0, true);
                                }
                            }} 
                            className="px-2.5 py-1 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-bold text-[10px] rounded shadow cursor-pointer shrink-0 transition-colors"
                        >
                            {nowPlayingTrack && (String(nowPlayingTrack.id) === String(currentTrack.id) || nowPlayingTrack.path === currentTrack.path || nowPlayingTrack.f === currentTrack.f) && isPlaying ? <span className="inline-flex items-center gap-1.5"><Icons.Pause size={12} />PAUSE</span> : <span className="inline-flex items-center gap-1.5"><Icons.Play size={12} />PLAY</span>}
                        </button>
                    </div>

                    {/* Alerta SuperFLAC o Mala Calidad & Reemplazo en Inspector */}
                    {isFlacUpgradeCandidate(currentTrack) ? (
                        <div className="p-3 bg-gradient-to-br from-cyan-950/60 via-purple-950/40 to-djzinc-900 border border-cyan-500/70 rounded-xl flex flex-col gap-2 shadow-lg shadow-cyan-950/30">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-cyan-300 flex items-center gap-1.5">
                                    <Icons.Gem size={14} className="inline-block align-[-2px]" /> SuperFLAC: No Cumple Hi-Res
                                </span>
                                <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-700/60 font-bold">
                                    {currentTrack.es_fake ? 'FAKE / TRANSCODE' : (currentTrack.calidad || 'CALIDAD MEDIA')}
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-300 leading-tight">
                                Este archivo FLAC presenta corte de frecuencia ({currentTrack.cutoff_khz || '--'} kHz) o bitrate insuficiente para considerarse True Lossless. Puedes buscar y descargar el master original en el Record Pool.
                            </p>
                            <button 
                                type="button"
                                onClick={() => handleBuscarReemplazosSpotify([currentTrack])}
                                disabled={isSearchingSpotifyHD}
                                className="w-full py-1.5 px-3 rounded bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400 text-black font-black text-xs cursor-pointer shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                            >
                                {isSearchingSpotifyHD ? <Icons.Clock size={13} /> : <Icons.Sparkles size={13} />}
                                <span>{isSearchingSpotifyHD ? 'Buscando en Catálogo...' : 'Buscar SuperFLAC Lossless en Catálogo'}</span>
                            </button>
                        </div>
                    ) : isBadQualityTrack(currentTrack) ? (
                        <div className="p-3 bg-amber-950/40 border border-amber-600/70 rounded-lg flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                                    <Icons.Warning size={14} className="inline-block align-[-2px]" /> Calidad Sub-óptima Detectada
                                </span>
                                <span className="text-[9px] font-mono text-red-400 bg-red-950 px-1.5 py-0.5 rounded border border-red-800 font-bold">
                                    {currentTrack.es_fake ? 'FLAC FAKE' : currentTrack.calidad || 'Baja Calidad'}
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-300 leading-tight">
                                Esta pista presenta compresión lossy o corte espectral ({currentTrack.cutoff_khz || '--'} kHz). Puedes reemplazarla automáticamente por su versión oficial en FLAC.
                            </p>
                            <button 
                                type="button"
                                onClick={() => handleBuscarReemplazosSpotify([currentTrack])}
                                disabled={isSearchingSpotifyHD}
                                className="w-full py-1.5 px-3 rounded bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black font-black text-xs cursor-pointer shadow transition-all active:scale-95 flex items-center justify-center gap-1.5"
                            >
                                <Icons.Refresh size={14} className="inline-block align-[-2px]" />
                                <span>{isSearchingSpotifyHD ? 'Buscando en Catálogo...' : 'Buscar Reemplazo HD en Catálogo'}</span>
                            </button>
                        </div>
                    ) : null}

                    <CopilotSeratoWaveform 
                        track={currentTrack} 
                        cues={(currentTrack && currentTrack.cues && currentTrack.cues.length > 0) ? currentTrack.cues : NV2_COLORS} 
                        duration={currentTrack.duration || "05:00"} 
                        onSeekTrack={onPlayTrack}
                        playProgress={isPlaying && nowPlayingTrack && (String(nowPlayingTrack.id) === String(currentTrack.id) || nowPlayingTrack.path === currentTrack.path || nowPlayingTrack.f === currentTrack.f) ? playProgress : 0}
                        isCurrentPlaying={isPlaying && nowPlayingTrack && (String(nowPlayingTrack.id) === String(currentTrack.id) || nowPlayingTrack.path === currentTrack.path || nowPlayingTrack.f === currentTrack.f)}
                        onUpdateCues={(newCues) => updateCurrentTrackField('cues', newCues)}
                        selectedCueId={selectedCueId}
                        onSelectCue={setSelectedCueId}
                        snapToGrid={snapToGrid}
                        showBeatgrid={showBeatgrid}
                        onToggleSnap={() => setSnapToGrid(prev => !prev)}
                        onToggleGrid={() => setShowBeatgrid(prev => !prev)}
                    />

                    <div className="bg-djzinc-950 p-3 rounded-lg border border-djzinc-800 space-y-3">
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-djzinc-850">
                            <span className="text-gray-300 font-bold flex items-center gap-1">
                                <span><Icons.ZoomIn size={14} className="inline-block align-[-2px]" /> Pureza & Calidad Acústica</span>
                                <InfoTip title="Teorema de Nyquist y Pérdida" text="En audio sin pérdida (FLAC/WAV a 44.1kHz), la frecuencia máxima teórica es de 22.05kHz cubriendo todo el rango audible humano. Un corte abrupto a 16kHz o 20kHz evidencia transcode falso desde MP3 con pérdida." />
                            </span>
                            <button 
                                onClick={() => handleAbrirFftModal(currentTrack)} 
                                className="px-2 py-0.5 bg-djzinc-800 hover:bg-djzinc-700 text-djcyan-400 text-[10px] font-mono font-bold rounded border border-djzinc-650 cursor-pointer transition-colors"
                                title="Abrir análisis espectral FFT en detalle"
                            >
                                <Icons.Activity size={13} /> VER FFT
                            </button>
                        </div>

                        {/* Grid de Métricas Técnicas */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                            <div className="bg-djzinc-900/80 p-2 rounded border border-djzinc-800">
                                <span className="text-gray-500 text-[9px] uppercase block">Formato / Tasa</span>
                                <span className="text-djcyan-300 font-bold">{currentTrack.format || 'FLAC'} • {currentTrack.sample_rate_khz || 44.1} kHz</span>
                            </div>
                            <div className="bg-djzinc-900/80 p-2 rounded border border-djzinc-800">
                                <span className="text-gray-500 text-[9px] uppercase block">Bitrate / Bits</span>
                                <span className="text-gray-200 font-bold">{currentTrack.bitrate_kbps ? `${currentTrack.bitrate_kbps} kbps` : (currentTrack.format === 'MP3' ? '320 kbps' : '1062 kbps')}</span>
                            </div>
                            <div className="bg-djzinc-900/80 p-2 rounded border border-djzinc-800">
                                <span className="text-gray-500 text-[9px] uppercase block">Corte Espectral FFT</span>
                                <span className={`font-bold ${Boolean(currentTrack.es_fake || (currentTrack.format === 'FLAC' && String(currentTrack.status || '').includes('Fake'))) ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {currentTrack.cutoff_khz ? `${currentTrack.cutoff_khz} kHz` : 'PASS 22.05 kHz'}
                                </span>
                            </div>
                            <div className="bg-djzinc-900/80 p-2 rounded border border-djzinc-800">
                                <span className="text-gray-500 text-[9px] uppercase block">Calidad & Pérdida</span>
                                <span className={`font-bold ${Boolean(currentTrack.es_fake || (currentTrack.format === 'FLAC' && String(currentTrack.status || '').includes('Fake'))) ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {currentTrack.calidad || (Boolean(currentTrack.es_fake) ? 'Baja' : 'Alta')} ({currentTrack.perdida_pct ? `${currentTrack.perdida_pct}%` : '0%'})
                                </span>
                            </div>
                        </div>

                        {/* Veredicto de Integridad */}
                        {Boolean(currentTrack.es_fake || (currentTrack.format === 'FLAC' && String(currentTrack.status || '').includes('Fake'))) ? (
                            <div className="p-2 bg-red-950/80 border border-red-700/80 rounded text-[11px] font-mono text-red-300 flex items-center gap-2 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                                <Icons.Warning size={14} className="inline-block align-[-2px]" />
                                <div>
                                    <span className="font-bold block uppercase">FLAC FAKE DETECTADO</span>
                                    <span className="text-[10px] text-red-400">Corte a {currentTrack.cutoff_khz}kHz. Archivo inflado desde MP3 con pérdida.</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-2 bg-emerald-950/50 border border-emerald-800/60 rounded text-[11px] font-mono text-emerald-300 flex items-center gap-2">
                                <Icons.Check size={14} className="inline-block align-[-2px]" />
                                <div>
                                    <span className="font-bold block uppercase">{currentTrack.status || 'Audio Auténtico'}</span>
                                    <span className="text-[10px] text-emerald-400/90">{currentTrack.perdida || 'Sin Pérdida (Rango audible 100% preservado)'}</span>
                                </div>
                            </div>
                        )}

                        {/* Medidor EBU R128: Sonoridad LUFS & True Peak */}
                        <div className="bg-djzinc-900/80 p-2.5 rounded border border-djzinc-800 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-300 font-bold flex items-center gap-1">
                                    <span><Icons.Volume size={14} className="inline-block align-[-2px]" /> Sonoridad & Dinámica (EBU R128)</span>
                                    <InfoTip title="Sonoridad LUFS y True Peak" text="Mide el volumen percibido para evitar saltos en cabina. -8 a -11 LUFS es el estándar de club moderno. True Peak > 0.0 dBFS indica clipping y distorsión." />
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${currentTrack.clipping ? 'bg-red-950 text-red-400 border border-red-700 animate-pulse' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                                    {currentTrack.clipping ? <span className="inline-flex items-center gap-1"><Icons.Alert size={12} />CLIPPING</span> : <span className="inline-flex items-center gap-1"><Icons.Check size={12} />CLEAN PEAK</span>}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                                <div className="bg-djzinc-950 p-1.5 rounded border border-djzinc-800/80">
                                    <span className="text-[9px] text-gray-500 block">LUFS Int.</span>
                                    <span className={`font-bold text-xs ${currentTrack.lufs > -7 ? 'text-amber-400' : (currentTrack.lufs && currentTrack.lufs <= -14) ? 'text-cyan-400' : 'text-emerald-400'}`}>
                                        {currentTrack.lufs !== undefined ? `${currentTrack.lufs} LUFS` : '-9.0 LUFS'}
                                    </span>
                                </div>
                                <div className="bg-djzinc-950 p-1.5 rounded border border-djzinc-800/80">
                                    <span className="text-[9px] text-gray-500 block">True Peak</span>
                                    <span className={`font-bold text-xs ${currentTrack.clipping ? 'text-red-400 font-black' : 'text-gray-200'}`}>
                                        {currentTrack.true_peak !== undefined ? `${currentTrack.true_peak > 0 ? '+' : ''}${currentTrack.true_peak} dB` : '-0.1 dB'}
                                    </span>
                                </div>
                                <div className="bg-djzinc-950 p-1.5 rounded border border-djzinc-800/80">
                                    <span className="text-[9px] text-gray-500 block">Rango (LRA)</span>
                                    <span className="font-bold text-xs text-gray-300">
                                        {currentTrack.lra ? `${currentTrack.lra} LU` : '3.5 LU'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* Alineación Temporal: Trim Zero-Crossing */}
                        <div className="pt-2 border-t border-djzinc-850 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-300 font-semibold flex items-center">
                                    Trim Silencio (Zero-Cross)
                                    <InfoTip title="Recorte de Silencio" text="Elimina el silencio muerto en cabecera cortando en paso por cero de amplitud (-60dBFS) para evitar clicks al mezclar." />
                                </span>
                                <span className="text-[11px] font-mono font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60 flex items-center gap-1.5">
                                    <span>{`-${Number(currentTrack.trim_start_ms || 0).toFixed(1)} ms`}</span>
                                    {currentTrack.trim_end_ms > 0 && (
                                        <span className="text-gray-400 text-[10px]" title="Silencio de cola podado">
                                            {`• Cola: -${Math.max(0, (parseDurationMs(currentTrack.duration || "05:00") - currentTrack.trim_end_ms)).toFixed(0)} ms`}
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleMicroAjusteTrim(-10)} className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer" title="Restar 10ms">-10ms</button>
                                    <button onClick={() => handleMicroAjusteTrim(-1)} className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer" title="Restar 1ms">-1ms</button>
                                    <button onClick={() => handleMicroAjusteTrim(1)} className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer" title="Sumar 1ms">+1ms</button>
                                    <button onClick={() => handleMicroAjusteTrim(10)} className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer" title="Sumar 10ms">+10ms</button>
                                    <button onClick={handleAutoDetectarTrimDownbeat} className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-800 hover:bg-djzinc-700 text-amber-300 rounded border border-amber-800/60 cursor-pointer" title="Auto-detectar con DSP">Auto</button>
                                </div>
                                <button 
                                    onClick={() => handlePreescuchaOffset(currentTrack.trim_start_ms || 0)} 
                                    className="px-2 py-0.5 text-[9px] font-bold bg-amber-950/70 hover:bg-amber-900 text-amber-300 rounded border border-amber-800/80 cursor-pointer transition-colors"
                                    title="Preescucha directa desde el punto de recorte"
                                >
                                    <Icons.Play size={14} className="inline-block align-[-2px]" /> Trim
                                </button>
                            </div>
                        </div>

                        {/* Alineación Temporal: Beatgrid 1.0.0 Downbeat */}
                        <div className="pt-2 border-t border-djzinc-850 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-300 font-semibold flex items-center">
                                    Beatgrid 1.0.0 (Downbeat)
                                    <InfoTip title="Beatgrid Downbeat" text="Fija el primer golpe de bombo real para que el sincro de Serato/Rekordbox nunca quede a contratiempo." />
                                </span>
                                <span className="text-[11px] font-mono font-black text-djcyan-300 bg-djcyan-950/80 px-2 py-0.5 rounded border border-djcyan-800/60">
                                    {`${Number(currentTrack.first_downbeat_ms || 0).toFixed(1)} ms`}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleMicroAjusteDownbeat(-10)} className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer" title="Restar 10ms">-10ms</button>
                                    <button onClick={() => handleMicroAjusteDownbeat(-1)} className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer" title="Restar 1ms">-1ms</button>
                                    <button onClick={() => handleMicroAjusteDownbeat(1)} className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer" title="Sumar 1ms">+1ms</button>
                                    <button onClick={() => handleMicroAjusteDownbeat(10)} className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer" title="Sumar 10ms">+10ms</button>
                                    <button onClick={handleAutoDetectarTrimDownbeat} className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-800 hover:bg-djzinc-700 text-djcyan-300 rounded border border-djcyan-800/60 cursor-pointer" title="Auto-detectar con DSP">Auto</button>
                                </div>
                                <button 
                                    onClick={() => handlePreescuchaOffset(currentTrack.first_downbeat_ms || 0)} 
                                    className="px-2 py-0.5 text-[9px] font-bold bg-djcyan-950/70 hover:bg-djcyan-900 text-djcyan-300 rounded border border-djcyan-800/80 cursor-pointer transition-colors"
                                    title="Preescucha directa desde el primer golpe de bombo"
                                >
                                    <Icons.Play size={14} className="inline-block align-[-2px]" /> Beat 1
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {/* BPM Exacto con TAP y micro-ajustes */}
                        <div className="bg-djzinc-950 p-2.5 rounded border border-djzinc-800">
                            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                                <span>BPM Decimal</span>
                                <InfoTip title="BPM Exacto & TAP" text="Tempo con precisión de dos decimales con botón TAP para marcar pulsaciones y micro-ajustes finos." />
                            </div>
                            <div className="flex items-center gap-1">
                                <input 
                                    type="text" 
                                    value={currentTrack.b || ''} 
                                    onChange={(e) => updateCurrentTrackField('b', e.target.value)} 
                                    className="w-full bg-djzinc-900 border border-djzinc-700 rounded px-1.5 py-1 text-xs font-mono font-bold text-white outline-none" 
                                />
                                <button 
                                    type="button" 
                                    onClick={handleTapTempo} 
                                    className="px-2 py-1 text-[9px] font-mono font-black bg-djcyan-950 hover:bg-djcyan-900 text-djcyan-400 rounded border border-djcyan-800/80 cursor-pointer shadow active:scale-95 transition-all"
                                    title="Pulsa repetidamente al ritmo de la música para calcular el tempo"
                                >
                                    TAP
                                </button>
                                <button onClick={() => { const v = parseFloat(currentTrack.b); if (!isNaN(v)) updateCurrentTrackField('b', (v - 0.1).toFixed(2)); }} className="px-1 py-1 text-[9px] font-mono bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 rounded border border-djzinc-700 cursor-pointer" title="Restar 0.1 BPM">-0.1</button>
                                <button onClick={() => { const v = parseFloat(currentTrack.b); if (!isNaN(v)) updateCurrentTrackField('b', (v + 0.1).toFixed(2)); }} className="px-1 py-1 text-[9px] font-mono bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 rounded border border-djzinc-700 cursor-pointer" title="Sumar 0.1 BPM">+0.1</button>
                                <button onClick={() => { const v = parseFloat(currentTrack.b); if (!isNaN(v)) updateCurrentTrackField('b', (v / 2).toFixed(2)); }} className="px-1 py-1 text-[9px] font-mono bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 rounded border border-djzinc-700 cursor-pointer" title="Dividir por 2">/2</button>
                                <button onClick={() => { const v = parseFloat(currentTrack.b); if (!isNaN(v)) updateCurrentTrackField('b', (v * 2).toFixed(2)); }} className="px-1 py-1 text-[9px] font-mono bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 rounded border border-djzinc-700 cursor-pointer" title="Multiplicar por 2">x2</button>
                            </div>
                        </div>

                        {/* Clave Armónica Bidireccional (Camelot ↔ Clásica) */}
                        <div className="bg-djzinc-950 p-2.5 rounded border border-djzinc-800">
                            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                                <span className="flex items-center gap-1">
                                    <span>Key</span>
                                    <span className="text-[10px] font-mono text-djcyan-400 font-bold">
                                        ({CAMELOT_WHEEL_DATA[currentTrack.k]?.classical || 'Am'})
                                    </span>
                                </span>
                                <button 
                                    type="button" 
                                    onClick={() => setCamelotModalOpen(true)}
                                    className="text-[9px] font-mono font-bold text-djcyan-400 hover:text-djcyan-300 flex items-center gap-0.5 cursor-pointer"
                                    title="Abrir Rueda Armónica Camelot Interactiva"
                                >
                                    <Icons.Disc size={14} className="inline-block align-[-2px]" /> Rueda
                                </button>
                            </div>
                            <select 
                                value={currentTrack.k || '8A'} 
                                onChange={(e) => updateCurrentTrackField('k', e.target.value)} 
                                className="w-full bg-djzinc-900 border border-djzinc-700 rounded px-2 py-1 text-xs font-mono font-bold text-djcyan-400 outline-none cursor-pointer"
                            >
                                {Object.entries(CAMELOT_WHEEL_DATA).map(([kKey, kData]) => (
                                    <option key={kKey} value={kKey}>
                                        {kKey} • {kData.classical} ({kData.name})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Medidor de Pegada en 5 Segmentos LED (Pioneer / Numark style) */}
                    <div className="bg-djzinc-950 p-3 rounded border border-djzinc-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                            <span className="font-semibold flex items-center">
                                Nivel de Energía & Pegada
                                <InfoTip title="Vúmetro de Energía" text="Medidor de pegada e intensidad sonora (rango 1-100) en escala de 5 segmentos LED de club." />
                            </span>
                            <span className="font-mono font-bold text-xs text-white">
                                {currentTrack.e || 80}%
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-5 gap-1.5 h-6 p-1 bg-black/60 rounded border border-djzinc-850">
                            {[
                                { val: 20, color: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]', off: 'bg-emerald-950/40 border-emerald-900/40' },
                                { val: 40, color: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]', off: 'bg-emerald-950/40 border-emerald-900/40' },
                                { val: 60, color: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]', off: 'bg-amber-950/40 border-amber-900/40' },
                                { val: 80, color: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]', off: 'bg-orange-950/40 border-orange-900/40' },
                                { val: 100, color: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-pulse', off: 'bg-red-950/40 border-red-900/40' }
                            ].map((seg, sIdx) => {
                                const isActive = (currentTrack.e || 80) >= seg.val;
                                return (
                                    <button
                                        key={sIdx}
                                        type="button"
                                        onClick={() => updateCurrentTrackField('e', seg.val)}
                                        className={`h-full rounded-sm border transition-all cursor-pointer ${isActive ? `${seg.color} border-transparent` : `${seg.off}`}`}
                                        title={`Nivel ${sIdx + 1} (${seg.val}%)`}
                                    />
                                );
                            })}
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="100" 
                            value={currentTrack.e || 80} 
                            onChange={(e) => updateCurrentTrackField('e', Number(e.target.value))} 
                            className="w-full accent-djgreen-500 h-1.5 bg-djzinc-800 rounded-lg cursor-pointer" 
                        />
                    </div>

                    {/* Danceability & Mood Dropdown */}
                    <div className="grid grid-cols-2 gap-2">
                        {/* Danceability */}
                        <div className="bg-djzinc-950 p-2.5 rounded border border-djzinc-800 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                                <span>Danceability</span>
                                <InfoTip title="Bailabilidad" text="Fuerza del compás y estabilidad rítmica para mantener la pista bailando." />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold text-djcyan-400">{currentTrack.dance || 85}%</span>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="100" 
                                    value={currentTrack.dance || 85} 
                                    onChange={(e) => updateCurrentTrackField('dance', Number(e.target.value))} 
                                    className="w-20 accent-djcyan-400 h-1.5 bg-djzinc-800 rounded-lg cursor-pointer" 
                                />
                            </div>
                        </div>

                        {/* Mood Selector */}
                        <div className="bg-djzinc-950 p-2.5 rounded border border-djzinc-800 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                                <span>Mood / Color</span>
                                <InfoTip title="Atmósfera Sonora" text="Clasificador del color sonoro y momento ideal de sesión." />
                            </div>
                            <select 
                                value={currentTrack.mood || 'Peak Time'} 
                                onChange={(e) => updateCurrentTrackField('mood', e.target.value)} 
                                className="w-full bg-djzinc-900 border border-djzinc-700 rounded px-1.5 py-1 text-xs font-semibold text-emerald-400 outline-none cursor-pointer"
                            >
                                {DJ_MOODS_LIST.map(m => (
                                    <option key={m.id} value={m.id}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Género y Subgénero / Taxonomía Crate */}
                    <div className="bg-djzinc-950 p-2.5 rounded border border-djzinc-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                            <span className="font-bold">Taxonomía Serato Crate</span>
                            <InfoTip title="Género y Taxonomía" text="Clasificación en dos niveles (Género raíz > Subgénero) que determina el etiquetado TCON y el ruteo físico a carpetas y crates de Serato / Rekordbox." />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="text-[10px] text-gray-400 block mb-1">Género Raíz</span>
                                <select 
                                    value={currentTrack.genre || 'Tech House'} 
                                    onChange={(e) => {
                                        const newG = e.target.value;
                                        updateCurrentTrackField('genre', newG);
                                        const subList = TAXONOMY_TREE[newG] || [];
                                        updateCurrentTrackField('subgenre', subList[0] || newG);
                                    }}
                                    className="w-full bg-djzinc-900 border border-djzinc-700 rounded px-2 py-1 text-xs font-semibold text-gray-200 outline-none cursor-pointer"
                                >
                                    {Object.keys(TAXONOMY_TREE).map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-400 block mb-1">Subgénero / Crate</span>
                                <select 
                                    value={currentTrack.subgenre || (TAXONOMY_TREE[currentTrack.genre || 'Tech House'] ? TAXONOMY_TREE[currentTrack.genre || 'Tech House'][0] : 'Tech House')} 
                                    onChange={(e) => updateCurrentTrackField('subgenre', e.target.value)} 
                                    className="w-full bg-djzinc-900 border border-djzinc-700 rounded px-2 py-1 text-xs font-semibold text-djcyan-400 outline-none cursor-pointer"
                                >
                                    {(TAXONOMY_TREE[currentTrack.genre || 'Tech House'] || [currentTrack.subgenre || 'Tech House']).map(sg => (
                                        <option key={sg} value={sg}>{sg}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-djzinc-850 text-[10px]">
                            <span className="text-gray-400 font-mono truncate max-w-[210px]" title={`/${currentTrack.genre || 'Tech House'}/${currentTrack.subgenre || ''}/`}>
                                <Icons.Folder size={14} className="inline-block align-[-2px]" /> /{currentTrack.genre || 'Tech House'}/{currentTrack.subgenre || 'General'}/
                            </span>
                            <button
                                type="button"
                                onClick={handleEnrutarPistaActual}
                                className="px-2 py-1 bg-djcyan-950 hover:bg-djcyan-900 text-djcyan-400 border border-djcyan-700/60 rounded font-bold text-[9px] cursor-pointer transition-colors shadow active:scale-95"
                                title="Enrutar y copiar/mover archivo a su carpeta física y crate Serato"
                            >
                                <Icons.Package size={14} className="inline-block align-[-2px]" /> Enrutar a Crate
                            </button>
                        </div>
                    </div>

                    {/* Resumen Táctico de los 8 Hot Cues (Columna derecha optimizada y sin sobrecarga) */}
                    <CompactHotCuesSummary
                        track={currentTrack}
                        cues={(currentTrack && currentTrack.cues && currentTrack.cues.length > 0) ? currentTrack.cues : NV2_COLORS}
                        selectedCueId={selectedCueId}
                        onSelectCue={setSelectedCueId}
                        onOpenStudio={() => {
                            if (onNavigateTab) {
                                onNavigateTab('hotcues');
                            } else {
                                setCueStudioModalOpen(true);
                            }
                        }}
                    />

                    <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase mb-1">
                            <span>Comentario Táctico DJ</span>
                            <InfoTip title="Comentario de Mezcla" text="Texto estratégico inyectado en el tag ID3 COMM visible en las pantallas de la mesa para recordar qué hacer con la pista." />
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1.5">
                            {[
                                { label: 'Peak Time', text: 'Peak Time • Drop Contundente • Outro Rápido 32b' },
                                { label: 'Warm Up', text: 'Warm Up • Groovy 64b • Entrada Progresiva' },
                                { label: 'Breakdown', text: 'Breakdown Vocal Intenso • Mezcla Larga con Bajos' },
                                { label: 'After', text: 'Afterhours • Dark Hypnotic • Bombo Pesado' }
                            ].map((tpl, tIdx) => (
                                <button
                                    key={tIdx}
                                    type="button"
                                    onClick={() => updateCurrentTrackField('comment', tpl.text)}
                                    className="px-1.5 py-0.5 text-[9px] font-mono bg-djzinc-850 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-750 cursor-pointer transition-colors"
                                    title={`Insertar: "${tpl.text}"`}
                                >
                                    {tpl.label}
                                </button>
                            ))}
                        </div>
                        <textarea 
                            value={currentTrack.comment || ""} 
                            onChange={(e) => updateCurrentTrackField('comment', e.target.value)} 
                            rows="2" 
                            className="w-full bg-djzinc-950 border border-djzinc-700 rounded p-2 text-xs text-gray-200 outline-none font-mono resize-none"
                        ></textarea>
                    </div>
                </div>
                <div className="p-3 bg-djzinc-950 border-t border-djzinc-800 space-y-2">
                    {/* Botón Mix Oracle en el Inspector */}
                    <button 
                        type="button"
                        onClick={() => {
                            setMixOracleTargetTrack(currentTrack);
                            setMixOracleOpen(true);
                        }}
                        className="w-full py-2 bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 text-purple-200 border border-purple-500/50 rounded font-mono font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        title="Buscar en la biblioteca los tracks armónica y espectralmente compatibles con este tema"
                    >
                        <Icons.Compass size={14} className="inline-block align-[-2px]" />
                        <span>Buscar Parejas (Mix Oracle)</span>
                    </button>

                    <button onClick={handleGuardarTrack} className="w-full py-2 bg-djcyan-600 hover:bg-djcyan-500 text-black rounded font-bold text-xs shadow-md cursor-pointer transition-colors">
                        Aplicar Cambios a este Track
                    </button>
                    <button 
                        type="button"
                        onClick={(e) => {
                            if (currentTrack && (currentTrack.id || currentTrack.id === 0)) {
                                handleRemoveSingleTrack(currentTrack.id, e);
                                setSidebarOpen(false);
                            }
                        }} 
                        className="w-full py-1.5 bg-red-950/50 hover:bg-red-900/80 text-red-300 hover:text-white rounded border border-red-800/60 font-mono text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                        title="Quitar este archivo de la lista y del análisis global"
                    >
                        <Icons.Trash size={14} className="inline-block align-[-2px]" />
                        <span>Quitar este track del análisis</span>
                    </button>
                </div>

                {/* Barra Sticky Inferior en Móvil para Guardar o Cerrar en la Zona del Pulgar */}
                <div className="sticky bottom-0 px-4 py-3 bg-[#0a0b16]/95 backdrop-blur-md border-t border-djzinc-800 flex items-center justify-between gap-2 shrink-0 sm:hidden z-20 font-mono text-xs">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="px-3.5 py-2 rounded-xl bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 font-bold transition-colors cursor-pointer"
                    >
                        Cerrar
                    </button>
                    <button
                        type="button"
                        onClick={handleGuardarTrack}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase text-xs transition-all cursor-pointer shadow-md active:scale-95 text-center"
                    >
                        Aplicar Cambios ➔
                    </button>
                </div>
                    </aside>
                </>
            )}

            {/* DOCK FLOTANTE DE ACCIONES POR LOTE (FLOATING BATCH DOCK) */}
            {selectedAuditIds.size > 0 && (
                <div 
                    className="fixed bottom-24 md:bottom-20 inset-x-0 mx-auto max-w-2xl bg-[#0e0e18]/95 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-djcyan-500/40 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(6,182,212,0.25)] flex items-center justify-between gap-3 z-40 animate-fadeIn font-mono"
                >
                    <div className="flex items-center gap-2.5 pl-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-djcyan-400 animate-ping"></span>
                        <span className="text-xs font-bold text-white">
                            <strong className="text-djcyan-300 font-black">{selectedAuditIds.size}</strong> {t('batch_selected_count') || 'pistas seleccionadas'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Incrustar Carátulas en seleccionadas */}
                        <button 
                            type="button"
                            onClick={handleInyectarCaratulasLote}
                            disabled={isInjecting}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-djzinc-900 hover:bg-djzinc-850 text-gray-200 border border-djzinc-750 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                            title="Buscar e incrustar carátulas 600x600 en las pistas seleccionadas"
                        >
                            <Icons.Image size={14} className="inline-block align-[-2px]" />
                            <span>{t('batch_covers') || 'Carátulas'}</span>
                        </button>

                        {/* Higienizar metadatos */}
                        <button 
                            type="button"
                            onClick={handleSanitizarMetadatos}
                            disabled={isInjecting}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-djzinc-900 hover:bg-djzinc-850 text-gray-200 border border-djzinc-750 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                            title="Eliminar spam y normalizar etiquetas de las pistas seleccionadas"
                        >
                            <Icons.Trash size={14} className="inline-block align-[-2px]" />
                            <span>{t('batch_clean') || 'Limpiar'}</span>
                        </button>

                        {/* Llevar a Descargas / Upgrade Lossless */}
                        <button 
                            type="button"
                            onClick={() => handleBuscarReemplazosSpotify(tracks.filter(t => selectedAuditIds.has(t.id)))}
                            disabled={isSearchingSpotifyHD || isAuditing}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-600/60 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
                            title={t('tooltip_send_downloads') || "Buscar y llevar a descargas las pistas seleccionadas en máxima calidad (FLAC/Lossless)"}
                        >
                            <Icons.Download size={14} className="inline-block align-[-2px]" />
                            <span>{t('btn_send_to_downloads') || 'Llevar a Descargas'}</span>
                        </button>

                        {/* Guardar en Disco */}
                        <button 
                            type="button"
                            onClick={() => handleSolicitarGuardarTodo()}
                            disabled={isInjecting}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
                            title="Persistir cambios físicamente en disco"
                        >
                            <Icons.Save size={14} className="inline-block align-[-2px]" />
                            <span>{t('batch_save') || 'Guardar'}</span>
                        </button>

                        {/* Deseleccionar / Quitar Selección */}
                        <button 
                            type="button"
                            onClick={handleRemoveSelectedTracks}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                            title="Quitar las pistas seleccionadas del análisis"
                        >
                            <Icons.Trash size={14} className="inline-block align-[-2px]" />
                        </button>

                        <button 
                            type="button"
                            onClick={() => setSelectedAuditIds(new Set())}
                            className="px-2 py-1.5 rounded-xl text-[11px] font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                            title="Deseleccionar todas"
                        >
                            <Icons.Close size={14} className="inline-block align-[-2px]" />
                        </button>
                    </div>
                </div>
            )}

            <BatchAuditorModal 
                isOpen={batchModalOpen} 
                onClose={() => setBatchModalOpen(false)} 
                onSaveConfig={(opts) => {
                    setBatchConfigOpts(opts);
                    setBatchConfigured(true);
                    setBatchModalOpen(false);
                    setSaveFeedback('✓ Ajustes guardados. Ya puedes pulsar "Ejecutar Análisis"');
                    setTimeout(() => setSaveFeedback(''), 4000);
                }}
                onRunBatch={async (opts) => {
                    setBatchConfigOpts(opts);
                    setBatchConfigured(true);
                    setBatchModalOpen(false);
                    await handleEjecutarAuditoriaLote(opts);
                }} 
            />

            {/* Modal de Comparación Cara a Cara & Eliminación de Duplicados */}
            <DuplicateComparisonModal 
                isOpen={duplicateModalOpen} 
                onClose={() => setDuplicateModalOpen(false)} 
                tracks={tracks} 
                onDuplicatesDeleted={(deletedPaths) => {
                    setTracks(prev => prev.filter(t => !deletedPaths.includes(t.path) && !deletedPaths.includes(t.f)));
                    setMetrics(prev => ({
                        ...prev,
                        total: Math.max(0, prev.total - deletedPaths.length),
                        duplicates: 0
                    }));
                }} 
            />

            {/* Modal Espectral FFT Profesional */}
            {fftModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#0b0b10] border border-djzinc-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-4 border-b border-djzinc-800 bg-djzinc-950 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-djcyan-400 animate-pulse"></span>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                                        Análisis de Espectro FFT • Certificación Lossless
                                    </h3>
                                    <p className="text-[11px] text-gray-400 truncate max-w-md">
                                        {currentTrack.t || currentTrack.title || currentTrack.f}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setFftModalOpen(false)} 
                                className="w-7 h-7 rounded-full bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 flex items-center justify-center font-bold text-xs cursor-pointer"
                            >
                                <Icons.Close size={14} className="inline-block align-[-2px]" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 font-sans">
                            {isAnalyzingFft ? (
                                <div className="py-16 flex flex-col items-center justify-center space-y-3">
                                    <div className="w-8 h-8 border-2 border-djcyan-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs font-mono text-gray-400">Calculando transformada rápida de Fourier (FFT 4096 / Blackman-Harris)...</span>
                                </div>
                            ) : fftAnalysisData ? (
                                <>
                                    {/* Métricas clave */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-djzinc-950 p-3 rounded-lg border border-djzinc-800">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Diagnóstico</span>
                                            <span className={`text-base font-mono font-bold ${fftAnalysisData.estado === 'True Lossless' ? 'text-djgreen-400' : 'text-red-400'}`}>
                                                {fftAnalysisData.estado}
                                            </span>
                                        </div>
                                        <div className="bg-djzinc-950 p-3 rounded-lg border border-djzinc-800">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Frecuencia de Corte</span>
                                            <span className="text-base font-mono font-bold text-djcyan-400">
                                                {fftAnalysisData.corte || `${fftAnalysisData.cutoff_khz} kHz`}
                                            </span>
                                        </div>
                                        <div className="bg-djzinc-950 p-3 rounded-lg border border-djzinc-800">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Pérdida Espectral</span>
                                            <span className="text-base font-mono font-bold text-amber-400">
                                                {fftAnalysisData.perdida || 0}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Gráfica de barras de espectro FFT */}
                                    <div className="bg-djzinc-950 p-4 rounded-lg border border-djzinc-800 flex flex-col space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                                            <span>20 Hz</span>
                                            <span>1 kHz</span>
                                            <span>5 kHz</span>
                                            <span>10 kHz</span>
                                            <span>16 kHz</span>
                                            <span className="text-amber-400 font-bold">20 kHz (Corte MP3)</span>
                                            <span className="text-djcyan-400 font-bold">22.05 kHz (Nyquist FLAC)</span>
                                        </div>
                                        <div className="h-32 w-full bg-[#050508] rounded border border-djzinc-850 flex items-end gap-1 p-2 relative overflow-hidden">
                                            {/* Línea guía 20kHz */}
                                            <div className="absolute top-0 bottom-0 right-[9%] w-0.5 bg-amber-500/50 border-r border-dashed border-amber-400/80 pointer-events-none z-10"></div>
                                            {(fftAnalysisData.spectrum && fftAnalysisData.spectrum.length > 0 ? fftAnalysisData.spectrum : Array.from({ length: 64 }, (_, i) => Math.max(0.05, Math.sin(i / 10) * 0.8))).map((bar, i) => {
                                                const heightPct = Math.max(4, Math.round(bar * 100));
                                                const isHighFreq = i >= 50;
                                                return (
                                                    <div 
                                                        key={i} 
                                                        className="flex-1 rounded-t-sm transition-all duration-300"
                                                        style={{
                                                            height: `${heightPct}%`,
                                                            backgroundColor: isHighFreq 
                                                                ? (fftAnalysisData.cutoff_khz >= 20.0 ? '#06b6d4' : '#ef4444')
                                                                : (i < 15 ? '#22d3ee' : '#f59e0b')
                                                        }}
                                                        title={`Banda #${i + 1}: ${Math.round((i / 64) * 24)} kHz (${heightPct}%)`}
                                                    ></div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex justify-between text-[10px] font-mono text-gray-500">
                                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-blue-500"></span> Graves</span>
                                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-500"></span> Medios</span>
                                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-djcyan-500"></span> Agudos / Aire FLAC</span>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-djzinc-900/60 rounded border border-djzinc-800 text-xs text-gray-300 leading-relaxed font-sans">
                                        <p>
                                            {fftAnalysisData.cutoff_khz >= 20.0 
                                                ? "✅ El archivo contiene armónicos reales y energía sostenida por encima de los 20 kHz. Se certifica como audio auténticamente Lossless (no re-codificado desde MP3 a 320kbps)."
                                                : "⚠️ Se detecta una caída vertical de energía en el corte de alta frecuencia típico de transcodificaciones con pérdida (MP3/AAC inflado a WAV/FLAC)."}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="py-12 text-center text-gray-500 text-xs font-mono">
                                    No se pudo obtener el espectro para este archivo.
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-djzinc-950 border-t border-djzinc-800 flex justify-end gap-2">
                            <button 
                                onClick={() => handleAbrirFftModal(currentTrack)} 
                                className="px-4 py-1.5 bg-djzinc-800 hover:bg-djzinc-700 text-gray-200 rounded font-mono font-semibold text-xs border border-djzinc-700 cursor-pointer transition-colors"
                            >
                                Re-analizar
                            </button>
                            <button 
                                onClick={() => setFftModalOpen(false)} 
                                className="px-4 py-1.5 bg-djcyan-600 hover:bg-djcyan-500 text-black rounded font-mono font-bold text-xs cursor-pointer transition-colors shadow"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Unificada de Exploración de Bibliotecas & Archivos */}
            <UnifiedLibraryBrowserModal
                isOpen={fsBrowserOpen}
                onClose={() => setFsBrowserOpen(false)}
                title="Explorador de Biblioteca & Selección de Archivos"
                initialPath={rutaOrigen}
                onSelectPath={(selectedPath, append) => handleSeleccionarCarpetaUI(selectedPath)}
                onSelectMultiple={(allTargets, append) => {
                    handleCargarDirectorio(allTargets, append);
                }}
                customLibraries={customLibraries}
                activeCustomLibId={activeCustomLibId}
                onImportCollection={handleCargarColeccionGuardada}
                isAppendMode={isAppendMode}
            />
            {/* Modal Rueda Armónica Camelot (Circle of Fifths) */}
            {camelotModalOpen && (
                <CamelotWheelModal 
                    isOpen={camelotModalOpen} 
                    onClose={() => setCamelotModalOpen(false)} 
                    currentKey={currentTrack.k || '8A'} 
                    onSelectKey={(newKey) => updateCurrentTrackField('k', newKey)} 
                />
            )}

            {/* Modal de Estudio Completo de Hot Cues con Reproductor & Guardado por Pista */}
            {cueStudioModalOpen && (
                <HotCueStudioModal
                    isOpen={cueStudioModalOpen}
                    onClose={() => setCueStudioModalOpen(false)}
                    track={currentTrack}
                    cues={(currentTrack && currentTrack.cues && currentTrack.cues.length > 0) ? currentTrack.cues : NV2_COLORS}
                    duration={currentTrack.duration || "05:00"}
                    onUpdateCues={(newCues) => updateCurrentTrackField('cues', newCues)}
                    selectedCueId={selectedCueId}
                    onSelectCue={setSelectedCueId}
                    onPlayTrack={onPlayTrack}
                    nowPlayingTrack={nowPlayingTrack}
                    isPlaying={isPlaying}
                    onTogglePlay={onTogglePlay}
                    playProgress={playProgress}
                    onGuardarTrack={handleGuardarTrack}
                    saveFeedback={saveFeedback}
                    onAutoPhraseCues={handleAutoPhraseCues}
                />
            )}

            {/* 🔮 Modal Radar de Mezcla Mágica (Mix Oracle) */}
            {mixOracleOpen && (
                <MixOracleModal 
                    isOpen={mixOracleOpen}
                    onClose={() => setMixOracleOpen(false)}
                    currentTrack={mixOracleTargetTrack || currentTrack}
                    allTracks={tracks}
                    onPlayTrack={onPlayTrack}
                    onSelectTrack={(id) => {
                        setSelectedTrack(id);
                        setSidebarOpen(true);
                    }}
                />
            )}

            {/* 💾 Modal de Diálogo Previo de Confirmación para Guardado de Metadatos */}
            {saveModalState.open && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn"
                    onClick={() => setSaveModalState(prev => ({ ...prev, open: false }))}
                >
                    <div 
                        className="bg-[#0f0f18] border border-emerald-500/40 rounded-2xl w-full max-w-xl shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Cabecera */}
                        <div className="p-4 bg-gradient-to-r from-emerald-950 via-[#0a1810] to-zinc-950 border-b border-emerald-800/40 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-900/50 border border-emerald-500/50 flex items-center justify-center text-emerald-300 shadow-md">
                                    <Icons.Save size={18} />
                                </div>
                                <div>
                                    <h3 className="font-syne font-black text-white text-base tracking-wide flex items-center gap-2">
                                        <span>GUARDAR METADATOS EN DISCO</span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                                            {saveModalState.tracks.length} {saveModalState.tracks.length === 1 ? 'pista' : 'pistas'}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-emerald-300/80 font-mono mt-0.5">
                                        Revisa los campos ID3v2.3 / Vorbis que se escribirán directamente en los archivos físicos
                                    </p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setSaveModalState(prev => ({ ...prev, open: false }))}
                                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 flex items-center justify-center text-xs cursor-pointer transition-colors"
                            >
                                <Icons.Close size={14} />
                            </button>
                        </div>

                        {/* Checklist de Campos a Persistir */}
                        <div className="p-4 bg-[#0a0a12] border-b border-zinc-800 space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-mono">
                                <span>CAMPOS A SOBREESCRIBIR EN DISCO:</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const allOn = Object.values(saveModalState.fields).every(Boolean);
                                        setSaveModalState(prev => ({
                                            ...prev,
                                            fields: {
                                                bpm: !allOn,
                                                key: !allOn,
                                                cues: !allOn,
                                                comment: !allOn,
                                                genre_mood: !allOn,
                                                cover: !allOn
                                            }
                                        }));
                                    }}
                                    className="text-emerald-400 hover:underline cursor-pointer"
                                >
                                    {Object.values(saveModalState.fields).every(Boolean) ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                                {/* BPM */}
                                <label className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${saveModalState.fields.bpm ? 'bg-emerald-950/30 border-emerald-500/50 text-white' : 'bg-zinc-900/50 border-zinc-800 text-gray-400'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={saveModalState.fields.bpm} 
                                        onChange={e => setSaveModalState(p => ({ ...p, fields: { ...p.fields, bpm: e.target.checked } }))}
                                        className="accent-emerald-500 rounded"
                                    />
                                    <div className="min-w-0">
                                        <span className="font-bold flex items-center gap-1.5"><Icons.Activity size={13} className="text-emerald-400" /> BPM & Beatgrid</span>
                                        <p className="text-[10px] text-gray-400 font-sans truncate">Tempo cuantizado y BeatGrid Serato</p>
                                    </div>
                                </label>

                                {/* Key Camelot */}
                                <label className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${saveModalState.fields.key ? 'bg-emerald-950/30 border-emerald-500/50 text-white' : 'bg-zinc-900/50 border-zinc-800 text-gray-400'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={saveModalState.fields.key} 
                                        onChange={e => setSaveModalState(p => ({ ...p, fields: { ...p.fields, key: e.target.checked } }))}
                                        className="accent-emerald-500 rounded"
                                    />
                                    <div className="min-w-0">
                                        <span className="font-bold flex items-center gap-1.5"><Icons.Music size={13} className="text-purple-400" /> Tonalidad Armónica</span>
                                        <p className="text-[10px] text-gray-400 font-sans truncate">Notación Camelot (TKEY / INITIALKEY)</p>
                                    </div>
                                </label>

                                {/* Hot Cues */}
                                <label className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${saveModalState.fields.cues ? 'bg-emerald-950/30 border-emerald-500/50 text-white' : 'bg-zinc-900/50 border-zinc-800 text-gray-400'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={saveModalState.fields.cues} 
                                        onChange={e => setSaveModalState(p => ({ ...p, fields: { ...p.fields, cues: e.target.checked } }))}
                                        className="accent-emerald-500 rounded"
                                    />
                                    <div className="min-w-0">
                                        <span className="font-bold flex items-center gap-1.5"><Icons.Play size={13} className="text-amber-400" /> Hot Cues (1–8)</span>
                                        <p className="text-[10px] text-gray-400 font-sans truncate">Serato Markers2 oficial y colores</p>
                                    </div>
                                </label>

                                {/* Comentario */}
                                <label className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${saveModalState.fields.comment ? 'bg-emerald-950/30 border-emerald-500/50 text-white' : 'bg-zinc-900/50 border-zinc-800 text-gray-400'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={saveModalState.fields.comment} 
                                        onChange={e => setSaveModalState(p => ({ ...p, fields: { ...p.fields, comment: e.target.checked } }))}
                                        className="accent-emerald-500 rounded"
                                    />
                                    <div className="min-w-0">
                                        <span className="font-bold flex items-center gap-1.5"><Icons.FileText size={13} className="text-cyan-400" /> Comentario Táctico</span>
                                        <p className="text-[10px] text-gray-400 font-sans truncate">Mix armónico y estructura (COMM)</p>
                                    </div>
                                </label>

                                {/* Género & Mood */}
                                <label className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${saveModalState.fields.genre_mood ? 'bg-emerald-950/30 border-emerald-500/50 text-white' : 'bg-zinc-900/50 border-zinc-800 text-gray-400'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={saveModalState.fields.genre_mood} 
                                        onChange={e => setSaveModalState(p => ({ ...p, fields: { ...p.fields, genre_mood: e.target.checked } }))}
                                        className="accent-emerald-500 rounded"
                                    />
                                    <div className="min-w-0">
                                        <span className="font-bold flex items-center gap-1.5"><Icons.Sliders size={13} className="text-pink-400" /> Taxonomía & Mood</span>
                                        <p className="text-[10px] text-gray-400 font-sans truncate">Genre, Grouping (Mood) y Subgénero</p>
                                    </div>
                                </label>

                                {/* Carátula */}
                                <label className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${saveModalState.fields.cover ? 'bg-emerald-950/30 border-emerald-500/50 text-white' : 'bg-zinc-900/50 border-zinc-800 text-gray-400'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={saveModalState.fields.cover} 
                                        onChange={e => setSaveModalState(p => ({ ...p, fields: { ...p.fields, cover: e.target.checked } }))}
                                        className="accent-emerald-500 rounded"
                                    />
                                    <div className="min-w-0">
                                        <span className="font-bold flex items-center gap-1.5"><Icons.Image size={13} className="text-blue-400" /> Carátula 1:1 HD</span>
                                        <p className="text-[10px] text-gray-400 font-sans truncate">Incrustar Artwork cuadrado en tags</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Muestra previa de pistas afectadas */}
                        <div className="p-4 bg-[#0d0d16] border-b border-zinc-800 max-h-40 overflow-y-auto space-y-1.5 font-mono text-xs">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex justify-between">
                                <span>MUESTRA DE ARCHIVOS OBJETIVO:</span>
                                <span>Mostrando {Math.min(5, saveModalState.tracks.length)} de {saveModalState.tracks.length}</span>
                            </div>
                            {saveModalState.tracks.slice(0, 5).map((t, idx) => (
                                <div key={t.id || idx} className="flex items-center justify-between p-2 rounded bg-zinc-900/70 border border-zinc-800/80">
                                    <div className="min-w-0 flex-1 pr-2">
                                        <div className="text-white font-bold truncate">{t.title || t.t || t.f}</div>
                                        <div className="text-[11px] text-gray-400 truncate">{t.artist || t.a} • {t.format || 'FLAC'}</div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                                        {t.bpm && <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 font-bold">{t.bpm} BPM</span>}
                                        {t.key && <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-purple-300 font-bold">{t.key}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Aviso de Seguridad No Destructiva */}
                        <div className="px-4 py-3 bg-[#0a120e] border-b border-emerald-950/60 flex items-center gap-2.5 text-xs text-emerald-300/90 font-mono">
                            <Icons.Check size={14} className="text-emerald-400 shrink-0" />
                            <span>
                                Escritura segura no destructiva. El audio PCM original permanece intacto y la caché SQLite se sincroniza automáticamente.
                            </span>
                        </div>

                        {/* Botones de Acción */}
                        <div className="p-4 bg-[#0f0f18] flex items-center justify-between gap-3">
                            <button 
                                type="button"
                                onClick={() => setSaveModalState(prev => ({ ...prev, open: false }))}
                                className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-zinc-800 hover:bg-zinc-700 text-gray-300 cursor-pointer transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="button"
                                onClick={() => {
                                    const targetTracks = saveModalState.tracks;
                                    const targetFields = saveModalState.fields;
                                    setSaveModalState(prev => ({ ...prev, open: false }));
                                    handleGuardarTodoEnFicheros(targetTracks, targetFields);
                                }}
                                className="px-5 py-2 rounded-xl text-xs font-black font-sans bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer transition-all flex items-center gap-2"
                            >
                                <Icons.Save size={14} />
                                <span>Confirmar y Guardar ({saveModalState.tracks.length} pistas)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🗑️ Modal de Confirmación de Eliminación de Pistas (Seguridad DJ de Cabina) */}
            {deleteModalState.open && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn"
                    onClick={() => setDeleteModalState(prev => ({ ...prev, open: false }))}
                >
                    <div 
                        className="bg-[#0f0f18] border border-red-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Cabecera */}
                        <div className="p-4 bg-gradient-to-r from-red-950 via-[#180808] to-zinc-950 border-b border-red-900/40 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Icons.Trash size={14} className="inline-block align-[-2px] p-2 rounded-xl bg-red-900/60 border border-red-500/50 text-red-300" />
                                <div>
                                    <h3 className="font-syne font-black text-white text-base tracking-wide flex items-center gap-2">
                                        <span>GESTIÓN DE ELIMINACIÓN DE PISTAS</span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-700">
                                            {deleteModalState.tracks.length} {deleteModalState.tracks.length === 1 ? 'pista' : 'pistas'}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-red-300/80 font-mono mt-0.5">
                                        Selecciona si deseas quitar del análisis o eliminar físicamente del disco
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setDeleteModalState(prev => ({ ...prev, open: false }))}
                                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 flex items-center justify-center text-xs cursor-pointer"
                            >
                                <Icons.Close size={14} className="inline-block align-[-2px]" />
                            </button>
                        </div>

                        {/* Lista previa de pistas afectadas */}
                        <div className="p-4 bg-[#0a0a12] border-b border-zinc-800 max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                PISTAS AFECTADAS:
                            </div>
                            {deleteModalState.tracks.map((t, idx) => (
                                <div key={t.id || idx} className="flex items-center justify-between p-2 rounded bg-zinc-900/70 border border-zinc-800/80">
                                    <div className="min-w-0 flex-1 pr-2">
                                        <div className="text-white font-bold truncate">{t.title || t.t || t.f}</div>
                                        <div className="text-[11px] text-gray-400 truncate">{t.artist || t.a} • {t.format || 'AUDIO'}</div>
                                    </div>
                                    {isBadQualityTrack(t) && (
                                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-700/60 rounded shrink-0">
                                            {t.es_fake ? 'FLAC FAKE' : 'BAJA CALIDAD'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Opciones de Borrado */}
                        <div className="p-4 space-y-3 bg-[#0d0d16]">
                            <label 
                                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                                    deleteModalState.mode === 'trash'
                                        ? 'bg-red-950/40 border-red-500/70 shadow'
                                        : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-850'
                                }`}
                                onClick={() => setDeleteModalState(prev => ({ ...prev, mode: 'trash' }))}
                            >
                                <input 
                                    type="radio" 
                                    name="deleteMode" 
                                    checked={deleteModalState.mode === 'trash'} 
                                    onChange={() => setDeleteModalState(prev => ({ ...prev, mode: 'trash' }))}
                                    className="mt-1 accent-red-500"
                                />
                                <div>
                                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                                        <span><Icons.Trash size={14} className="inline-block align-[-2px]" /> Mover a la Papelera de reciclaje</span>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">Recomendado</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Mueve los archivos físicos a la Papelera de macOS. Los archivos se quitan de tu biblioteca pero podrás recuperarlos si te arrepientes.
                                    </p>
                                </div>
                            </label>

                            <label 
                                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                                    deleteModalState.mode === 'list_only'
                                        ? 'bg-amber-950/30 border-amber-500/70 shadow'
                                        : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-850'
                                }`}
                                onClick={() => setDeleteModalState(prev => ({ ...prev, mode: 'list_only' }))}
                            >
                                <input 
                                    type="radio" 
                                    name="deleteMode" 
                                    checked={deleteModalState.mode === 'list_only'} 
                                    onChange={() => setDeleteModalState(prev => ({ ...prev, mode: 'list_only' }))}
                                    className="mt-1 accent-amber-500"
                                />
                                <div>
                                    <div className="text-sm font-bold text-white">
                                        Quitar solo de la lista (Conservar en disco)
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Quita las canciones de la vista de análisis sin tocar ni borrar tus archivos físicos en la computadora.
                                    </p>
                                </div>
                            </label>

                            <label 
                                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                                    deleteModalState.mode === 'permanent'
                                        ? 'bg-red-950/60 border-red-600 shadow'
                                        : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-850'
                                }`}
                                onClick={() => setDeleteModalState(prev => ({ ...prev, mode: 'permanent' }))}
                            >
                                <input 
                                    type="radio" 
                                    name="deleteMode" 
                                    checked={deleteModalState.mode === 'permanent'} 
                                    onChange={() => setDeleteModalState(prev => ({ ...prev, mode: 'permanent' }))}
                                    className="mt-1 accent-red-600"
                                />
                                <div>
                                    <div className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                                        <span><Icons.Warning size={14} className="inline-block align-[-2px]" /> Eliminación física permanente</span>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-700 font-mono">Irreversible</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Borra los archivos de audio del disco duro directamente sin pasar por la papelera para liberar espacio inmediato.
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Botones de acción */}
                        <div className="p-4 bg-[#0a0a12] border-t border-zinc-800 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setDeleteModalState(prev => ({ ...prev, open: false }))}
                                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-mono font-bold text-xs cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => ejecutarEliminarPistas(deleteModalState.mode)}
                                className={`px-5 py-2 rounded-xl text-xs font-mono font-black cursor-pointer shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
                                    deleteModalState.mode === 'list_only'
                                        ? 'bg-amber-500 hover:bg-amber-400 text-black'
                                        : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-900/40'
                                }`}
                            >
                                <span>{deleteModalState.mode === 'list_only' ? 'Quitar de la Lista' : 'Confirmar Eliminación'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Centro de Columnas & Vistas (Columna / Drawer Lateral Derecho) */}
            {columnSelectorOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 overflow-hidden select-none pointer-events-none" style={{ zIndex: 99998 }}>
                    <div 
                        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-fadeIn pointer-events-auto"
                        style={{ zIndex: 99998 }}
                        onClick={() => { setColumnSelectorOpen(false); setColumnSearchText(''); }}
                    />
                    <aside 
                        style={{ width: '100%', maxWidth: `${columnsDrawerWidth}px`, zIndex: 99999 }}
                        className="fixed top-0 bottom-0 right-0 h-full bg-[#0a0b14] border-l-4 border-l-cyan-400 shadow-[-25px_0_60px_rgba(0,0,0,1)] flex flex-col font-sans text-gray-200 animate-slideInRight pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Manija táctil de redimensión para Desktop */}
                        <div 
                            onPointerDown={onColumnsResizeDown}
                            onDoubleClick={onColumnsResetWidth}
                            className="hidden md:flex absolute top-0 bottom-0 -left-2 w-4 cursor-ew-resize items-center justify-center z-50 group select-none hover:bg-cyan-500/10 transition-colors"
                            title="Arrastra para redimensionar (Doble clic para restablecer a 540px)"
                        >
                            <div className="w-1 h-12 rounded-full bg-zinc-600 group-hover:bg-cyan-400 group-hover:scale-y-125 transition-all shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                        </div>

                        {/* Cabecera */}
                        <div className="px-5 py-4 border-b border-djzinc-800 flex items-center justify-between bg-gradient-to-r from-[#0e0f1d] to-[#080910] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-djcyan-950/80 text-djcyan-400 border border-djcyan-500/50 flex items-center justify-center shadow-inner shrink-0">
                                    <Icons.Sliders size={18} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-syne font-black text-base sm:text-lg text-white uppercase tracking-wider">
                                            Centro de Columnas & Vistas
                                        </h3>
                                        <span className="px-2 py-0.5 rounded-full bg-djcyan-950 border border-djcyan-600/60 text-djcyan-300 font-mono text-[11px] font-black">
                                            {Object.values(visibleColumns).filter(Boolean).length} de {Object.keys(visibleColumns).length} activas
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 font-sans mt-0.5">
                                        Personaliza las columnas visibles en la tabla principal según tu flujo de trabajo de análisis o preparación de cabina DJ.
                                    </p>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => { setColumnSelectorOpen(false); setColumnSearchText(''); }}
                                className="w-9 h-9 rounded-xl bg-djzinc-900 hover:bg-djzinc-800 text-gray-400 hover:text-white border border-djzinc-750 flex items-center justify-center cursor-pointer transition-colors text-sm font-bold shadow-sm"
                                title="Cerrar modal (Esc)"
                            >
                                <Icons.Close size={14} className="inline-block align-[-2px]" />
                            </button>
                        </div>

                        {/* Buscador y Presets */}
                        <div className="p-4 border-b border-djzinc-800/80 bg-[#080910] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                            {/* Buscador en vivo */}
                            <div className="relative flex-1 max-w-md">
                                <Icons.Search size={14} className="inline-block align-[-2px] absolute left-3 top-2.5  text-gray-400" />
                                <input 
                                    type="text" 
                                    value={columnSearchText}
                                    onChange={(e) => setColumnSearchText(e.target.value)}
                                    placeholder="Buscar columna (ej. bpm, lufs, cues, transcode, cutoff)..."
                                    className="w-full pl-8 pr-8 py-2 bg-djzinc-900 border border-djzinc-750 rounded-xl text-xs font-mono text-gray-200 placeholder-gray-500 outline-none focus:border-djcyan-500/70 focus:ring-1 focus:ring-djcyan-500/40 transition-all"
                                />
                                {columnSearchText && (
                                    <button 
                                        type="button" 
                                        onClick={() => setColumnSearchText('')}
                                        className="absolute right-2.5 top-2.5 text-xs text-gray-400 hover:text-white cursor-pointer"
                                    ><Icons.Close size={14} className="inline-block align-[-2px]" /></button>
                                )}
                            </div>

                            {/* Presets Rápidos */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-mono text-gray-400 uppercase font-bold shrink-0">Presets:</span>
                                <button 
                                    type="button" 
                                    onClick={() => setColumnPreset('all')}
                                    className="px-2.5 py-1 rounded-lg bg-djzinc-900 hover:bg-djzinc-850 text-djcyan-300 border border-djzinc-750 hover:border-djcyan-500/50 text-[11px] font-mono font-bold cursor-pointer transition-all active:scale-95"
                                >
                                    <Icons.Eye size={14} className="inline-block align-[-2px]" /> Ver Todas ({Object.keys(DEFAULT_AUDIT_COLUMNS).length})
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setColumnPreset('dj')}
                                    className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-700/60 text-[11px] font-mono font-bold cursor-pointer transition-all active:scale-95"
                                >
                                    <Icons.Zap size={14} className="inline-block align-[-2px]" /> Cabina DJ (8)
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setColumnPreset('audio')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-700/60 text-[11px] font-mono font-bold cursor-pointer transition-all active:scale-95"
                                >
                                    <Icons.ZoomIn size={14} className="inline-block align-[-2px]" /> Auditoría Acústica (9)
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setColumnPreset('tags')}
                                    className="px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 border border-amber-700/60 text-[11px] font-mono font-bold cursor-pointer transition-all active:scale-95"
                                >
                                    <Icons.Tag size={14} className="inline-block align-[-2px]" /> Metadatos (7)
                                </button>
                            </div>
                        </div>

                        {/* Cuadrícula de Categorías Temáticas */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 custom-scrollbar">
                            {COLUMN_CATEGORIES.map(cat => {
                                const q = (columnSearchText || '').trim().toLowerCase();
                                const matchingCols = cat.columns.filter(col => {
                                    if (!q) return true;
                                    return col.label.toLowerCase().includes(q) || col.key.toLowerCase().includes(q) || col.desc.toLowerCase().includes(q);
                                });
                                if (q && matchingCols.length === 0) return null;

                                const activeInCat = matchingCols.filter(c => visibleColumns[c.key]).length;

                                return (
                                    <div key={cat.id} className="p-3.5 rounded-xl bg-djzinc-900/60 border border-djzinc-800 flex flex-col gap-2.5">
                                        {/* Encabezado de la categoría */}
                                        <div className="flex items-center justify-between border-b border-djzinc-800/80 pb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base">{cat.icon}</span>
                                                <span className={`font-mono text-xs font-black uppercase tracking-wider ${cat.color}`}>
                                                    {cat.name}
                                                </span>
                                                <span className="text-[10px] font-mono text-gray-500 font-bold">
                                                    ({activeInCat}/{matchingCols.length})
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const next = { ...visibleColumns };
                                                        matchingCols.forEach(c => { next[c.key] = true; });
                                                        setVisibleColumns(next);
                                                        try { localStorage.setItem('bw_audit_visible_columns', JSON.stringify(next)); } catch (_) {}
                                                    }}
                                                    className="text-djcyan-400 hover:text-djcyan-300 cursor-pointer hover:underline"
                                                >
                                                    Todas
                                                </button>
                                                <span className="text-gray-600">/</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const next = { ...visibleColumns };
                                                        matchingCols.forEach(c => { next[c.key] = false; });
                                                        setVisibleColumns(next);
                                                        try { localStorage.setItem('bw_audit_visible_columns', JSON.stringify(next)); } catch (_) {}
                                                    }}
                                                    className="text-gray-500 hover:text-gray-300 cursor-pointer hover:underline"
                                                >
                                                    Ninguna
                                                </button>
                                            </div>
                                        </div>

                                        {/* Lista de Columnas */}
                                        <div className="space-y-1.5">
                                            {matchingCols.map(col => {
                                                const isChecked = Boolean(visibleColumns[col.key]);
                                                return (
                                                    <label 
                                                        key={col.key}
                                                        className={`flex items-start justify-between p-2 rounded-lg border transition-all cursor-pointer select-none ${
                                                            isChecked 
                                                                ? 'bg-djzinc-850/80 border-djzinc-700/80 text-white' 
                                                                : 'bg-djzinc-950/40 border-djzinc-850/60 text-gray-500 hover:border-djzinc-800'
                                                        }`}
                                                    >
                                                        <div className="flex flex-col pr-2">
                                                            <span className={`text-xs font-mono font-bold ${isChecked ? 'text-white' : 'text-gray-400'}`}>
                                                                {col.label}
                                                            </span>
                                                            <span className="text-[10.5px] text-gray-400 font-sans leading-tight mt-0.5">
                                                                {col.desc}
                                                            </span>
                                                        </div>
                                                        <input 
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => toggleColumnVisibility(col.key)}
                                                            className="accent-djcyan-400 w-4 h-4 rounded cursor-pointer mt-0.5 shrink-0"
                                                        />
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pie de modal */}
                        <div className="px-5 py-3.5 border-t border-djzinc-800 bg-[#07080e] flex items-center justify-between flex-wrap gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => setColumnPreset('reset')}
                                    className="px-3 py-1.5 rounded-lg bg-djzinc-900 hover:bg-djzinc-850 text-gray-300 border border-djzinc-750 text-xs font-mono font-bold cursor-pointer transition-all active:scale-95"
                                >
                                    ↺ Restablecer por Defecto
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setColumnPreset('none')}
                                    className="px-3 py-1.5 rounded-lg bg-djzinc-900 hover:bg-djzinc-850 text-gray-400 hover:text-white border border-djzinc-750 text-xs font-mono cursor-pointer transition-all active:scale-95"
                                >
                                    Deseleccionar Todas
                                </button>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => { setColumnSelectorOpen(false); setColumnSearchText(''); }}
                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-djcyan-400 to-djcyan-500 hover:from-djcyan-300 hover:to-djcyan-400 text-black font-mono font-black text-xs shadow-md shadow-djcyan-500/20 cursor-pointer transition-all active:scale-95"
                            >
                                <Icons.Check size={14} className="inline-block align-[-2px]" /> Aplicar y Guardar ({Object.values(visibleColumns).filter(Boolean).length} Activas)
                            </button>
                        </div>
                    </aside>
                </div>,
                document.body
            )}
        </div>
    );
};

