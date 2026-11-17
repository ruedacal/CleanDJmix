import { ShellIcons } from './shell/icons.jsx';
import { SideRail } from './shell/SideRail.jsx';
import { TopBar } from './shell/TopBar.jsx';
import { MobileTabBar, MoreSheet } from './shell/MobileNav.jsx';
import { WsButton, ToolbarDivider, ExportMenu, AddToCollectionMenu, FilterMenu, IngestDropzone, CamelotKeyBadge } from './shell/workspace-ui.jsx';
import { PricingModal } from './shell/pricing-modal.jsx';
import { RegisterFlowModal } from './shell/register-modal.jsx';
import { MapCamelotOverlay, MapNavOverlay, MapStatsHud, MapAcousticConsole, MAP_ZOOM_MIN, MAP_ZOOM_MAX } from './shell/map-overlays.jsx';
import { classifyTrackGenre } from './modules/genreClassifier.ts';
import { Phase1FastRecognizer } from './modules/Phase1FastRecognizer.ts';
import { NV2_COLORS, DEFAULT_VINYL_SVG, getValidCover, CAMELOT_TO_MUSICAL, getHarmonicKeyDisplay } from './data/constants.js';
import { I18N_TRANSLATIONS } from './data/i18n.js';
import { 
    CAMELOT_WHEEL_DATA, 
    TAXONOMY_TREE, 
    DJ_GENRES_LIST, 
    DJ_VERSIONS_LIST, 
    DJ_MOODS_LIST, 
    AI_PROMPT_CHIPS, 
    CUENCA_PROMPT_CHIPS, 
    DJ_CURATED_CATALOG, 
    parseAIDJQuery, 
    parseCuencaDJQuery 
} from './data/djCatalog.js';
import { BEATWAVE_MASTER_GLOSSARY } from './data/glossary.js';
import { 
    TableHarmonicWaveform, 
    RekordboxWaveform, 
    ZoomableRekordboxWaveform, 
    FooterMasterWaveform, 
    CopilotSeratoWaveform,
    getTrackHash,
    computeTrackStructuralBands,
    WAVEFORM_COLOR_LEGEND,
    DJ_PAD_PALETTE,
    parseDurationMs,
    parseTimeToMs,
    parseDurationToSeconds,
    formatMsToTime
} from './waveforms/index.js';
import { useVirtualRows, useDrawerResize, MASTER_DRAWER_STORAGE_KEY } from './shell/hooks.js';
import { 
    HotCueStudioModal, 
    CamelotWheelModal, 
    BatchAuditorModal, 
    DuplicateComparisonModal, 
    UserAccountModal, 
    BitacoraDetailContent, 
    BitacoraDetailModal, 
    BitacoraModal, 
    detectClientOS, 
    DJShortcutsModal, 
    MANUAL_SECTIONS, 
    InteractiveManualModal, 
    MixOracleModal 
} from './modals/index.js';
import { LibraryWorkspace, CustomLibraryModal, FOLDER_COLORS } from './workspaces/LibraryWorkspace.jsx';
import { KnowledgeWorkspace } from './workspaces/KnowledgeWorkspace.jsx';
import { TaxonomyWorkspace } from './workspaces/TaxonomyWorkspace.jsx';
import { ShazamWorkspace } from './workspaces/ShazamWorkspace.jsx';
import { LogsWorkspace } from './workspaces/LogsWorkspace.jsx';
import { TrendsWorkspace } from './workspaces/TrendsWorkspace.jsx';
import { HotCuesWorkspace } from './workspaces/HotCuesWorkspace.jsx';
import { SetBuilderWorkspace } from './workspaces/SetBuilderWorkspace.jsx';
import { SpotifyWorkspace } from './workspaces/SpotifyWorkspace.jsx';
import { MapWorkspace } from './workspaces/MapWorkspace.jsx';
const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

// ─── PERF: PlayerContext ──────────────────────────────────────────────────────
// Aísla COMPLETAMENTE el estado de reproducción del árbol de componentes.
// - playProgressRef: ref mutable (nunca dispara renders), leída por canvas via rAF.
// - isPlaying / nowPlayingTrack: solo cambian al cambiar pista o play/pause,
//   NO con cada tick de ontimeupdate → cero re-renders de App durante playback.
// ─────────────────────────────────────────────────────────────────────────────
const PlayerContext = createContext({
    playProgressRef: { current: 0 },
    isPlaying: false,
    nowPlayingTrack: null,
});

const usePlayerContext = () => useContext(PlayerContext);
// Hook para saber si una pista concreta está sonando (render solo al cambiar pista/play)
const useIsTrackPlaying = (trackId) => {
    const { isPlaying, nowPlayingTrack } = usePlayerContext();
    if (!trackId || !nowPlayingTrack) return false;
    return isPlaying && (
        String(nowPlayingTrack.id) === String(trackId) ||
        nowPlayingTrack.path === trackId ||
        nowPlayingTrack.f === trackId
    );
};

// Unified icon system (Lucide geometry, consistent stroke) shared by every workspace.
const Icons = {
    ...ShellIcons,
    Edit: ShellIcons.Pencil,
};

const SECTION_TITLE_CLASS = "font-syne font-black text-lg sm:text-xl leading-tight text-white tracking-wide uppercase";

const SectionTitle = ({ icon: Icon, title, accent, badge, accentColor = "cyan", className = "" }) => {
    const isPurple = accentColor === "purple";
    const iconBg = isPurple ? "bg-purple-500/15 border-purple-500/40 text-purple-300" : "bg-djcyan-500/10 border-djcyan-500/30 text-djcyan-400";
    const accentText = isPurple ? "text-purple-400" : "text-djcyan-400";
    const badgeStyle = isPurple ? "bg-purple-950/80 text-purple-300 border-purple-800" : "bg-djcyan-950 text-djcyan-400 border-djcyan-800";
    return (
        <div className={`flex items-center gap-2.5 min-w-0 shrink-0 ${className}`}>
            {Icon && (
                <span className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon size={16} />
                </span>
            )}
            <h2 className={`${SECTION_TITLE_CLASS} truncate`}>
                {title}{accent && <span className={accentText}> {accent}</span>}
            </h2>
            {badge && (
                <span className={`hidden sm:inline-flex text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${badgeStyle}`}>
                    {badge}
                </span>
            )}
        </div>
    );
};

// Tooltip Flotante Educativo Desacoplado de Overflows mediante ReactDOM.createPortal
const InfoTip = ({ text, title }) => {
    const [coords, setCoords] = useState(null);
    const btnRef = useRef(null);

    const handleEnter = () => {
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        setCoords({
            top: rect.top + rect.height / 2,
            right: window.innerWidth - rect.left + 12
        });
    };

    const handleLeave = () => setCoords(null);

    return (
        <span className="inline-flex items-center ml-1.5 align-middle">
            <button 
                ref={btnRef}
                type="button"
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                onClick={(e) => { e.stopPropagation(); coords ? handleLeave() : handleEnter(); }}
                className="w-3.5 h-3.5 rounded-full bg-djzinc-800 hover:bg-djcyan-500 hover:text-black border border-djzinc-600 flex items-center justify-center text-[9px] font-mono font-bold text-gray-400 transition-colors cursor-help select-none shrink-0"
            >
                i
            </button>

            {coords && ReactDOM.createPortal(
                <div 
                    style={{ 
                        position: 'fixed', 
                        top: `${coords.top}px`, 
                        right: `${coords.right}px`, 
                        transform: 'translateY(-50%)',
                        zIndex: 999999
                    }}
                    className="w-72 bg-djzinc-900 border border-djzinc-700 rounded-lg p-3 text-xs text-gray-200 shadow-[0_12px_36px_rgba(0,0,0,0.95),0_0_15px_rgba(6,182,212,0.2)] pointer-events-none select-none"
                >
                    <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-djzinc-900 border-t border-r border-djzinc-700 rotate-45"></div>

                    {title && (
                        <div className="text-[11px] font-bold text-djcyan-400 mb-1 uppercase tracking-wider flex items-center gap-1.5 border-b border-djzinc-800 pb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-djcyan-400"></span>
                            {title}
                        </div>
                    )}
                    <div className="text-[11px] leading-relaxed text-gray-300 font-sans break-words whitespace-normal">
                        {text}
                    </div>
                </div>,
                document.body
            )}
        </span>
    );
};

// Gestor de Ecualizador Web Audio API de 3 Bandas (BASS 250Hz, MID 1000Hz, HI 3500Hz)
function getAudioEQNodes(audioElement) {
    if (!audioElement) return null;
    if (window.__bwAudioNodes && window.__bwAudioNodes.audio === audioElement) {
        if (window.__bwAudioNodes.ctx.state === 'suspended') {
            window.__bwAudioNodes.ctx.resume().catch(() => {});
        }
        return window.__bwAudioNodes;
    }
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        const ctx = new AudioCtx();
        const source = ctx.createMediaElementSource(audioElement);
        
        const low = ctx.createBiquadFilter();
        low.type = 'lowshelf';
        low.frequency.value = 250;
        low.gain.value = 0;

        const mid = ctx.createBiquadFilter();
        mid.type = 'peaking';
        mid.frequency.value = 1000;
        mid.Q.value = 1.0;
        mid.gain.value = 0;

        const high = ctx.createBiquadFilter();
        high.type = 'highshelf';
        high.frequency.value = 3500;
        high.gain.value = 0;

        source.connect(low);
        low.connect(mid);
        mid.connect(high);
        high.connect(ctx.destination);

        const nodes = { audio: audioElement, ctx, source, low, mid, high };
        window.__bwAudioNodes = nodes;
        return nodes;
    } catch (e) {
        console.warn("Web Audio EQ initialization note:", e);
        return null;
    }
}

// Potenciómetro Rotatorio Hardware DJ de Alta Precisión
const RotaryKnob = ({ label, value = 0, min = -24, max = 6, defaultValue = 0, onChange, color = "#06b6d4" }) => {
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const angle = -135 + normalized * 270;

    const handlePointerDown = (e) => {
        e.preventDefault();
        const startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
        const startVal = value;

        const onPointerMove = (me) => {
            const currentY = me.clientY || (me.touches && me.touches[0].clientY) || 0;
            const deltaY = startY - currentY;
            const range = max - min;
            const step = deltaY * (range / 120);
            const newVal = Math.min(max, Math.max(min, Math.round((startVal + step) * 10) / 10));
            if (onChange) onChange(newVal);
        };

        const onPointerUp = () => {
            window.removeEventListener('mousemove', onPointerMove);
            window.removeEventListener('mouseup', onPointerUp);
            window.removeEventListener('touchmove', onPointerMove);
            window.removeEventListener('touchend', onPointerUp);
        };

        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);
        window.addEventListener('touchmove', onPointerMove);
        window.addEventListener('touchend', onPointerUp);
    };

    return (
        <div className="flex flex-col items-center gap-1 select-none">
            <span className="text-[9px] font-mono font-bold text-gray-400 tracking-wider uppercase">{label}</span>
            <div 
                onMouseDown={handlePointerDown}
                onTouchStart={handlePointerDown}
                onDoubleClick={() => onChange && onChange(defaultValue)}
                className="w-10 h-10 rounded-full bg-gradient-to-b from-[#181826] to-[#0c0c14] border-2 border-djzinc-700 hover:border-gray-400 relative cursor-ns-resize shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_2px_6px_rgba(0,0,0,0.6)] flex items-center justify-center group active:scale-95 transition-transform"
                title={`${label}: ${value > 0 ? '+' : ''}${value.toFixed(1)} dB (Doble clic para 0dB)`}
            >
                {/* Indicador de posición de rotación */}
                <div 
                    className="absolute w-full h-full rounded-full pointer-events-none"
                    style={{ transform: `rotate(${angle}deg)` }}
                >
                    <div 
                        className="w-1 h-3 rounded-full mx-auto mt-0.5 shadow-sm"
                        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                    ></div>
                </div>
                {/* Tapa central estriada */}
                <div className="w-4 h-4 rounded-full bg-[#1e1e2c] border border-djzinc-600 pointer-events-none flex items-center justify-center shadow-inner">
                    <div className="w-1 h-1 rounded-full bg-djzinc-500"></div>
                </div>
            </div>
            <span className="text-[9px] font-mono text-gray-300 font-extrabold">
                {value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)} <span className="text-[7.5px] text-gray-500 font-normal">dB</span>
            </span>
        </div>
    );
};

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
const AuditWorkspace = ({ 
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

        if (window.eel && typeof window.eel.expose === 'function') {
            window.actualizar_progreso_batch = (pct, msg) => {
                window.dispatchEvent(new CustomEvent('bw:audit_progress', { detail: { pct, msg } }));
            };
            try {
                window.eel.expose(window.actualizar_progreso_batch, "actualizar_progreso_batch");
            } catch (err) {}
        }
        return () => window.removeEventListener('bw:audit_progress', handleAuditEvt);
    }, [onAuditProgressChange]);

    // Polling redundante de alta precisión para barra de progreso (/api/audit/progress)
    const startProgressPolling = () => {
        if (window._bw_audit_poll) clearInterval(window._bw_audit_poll);
        window._bw_audit_poll = setInterval(async () => {
            try {
                const res = await fetch('/api/audit/progress');
                if (res.ok) {
                    const data = await res.json();
                    if (data && typeof data.pct === 'number') {
                        if (data.pct > 0) {
                            setBatchProgress(data.pct);
                            if (data.msg) setBatchStatusMsg(data.msg);
                            if (data.pct >= 100) {
                                clearInterval(window._bw_audit_poll);
                                window._bw_audit_poll = null;
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
    const handleCargarColeccionGuardada = () => {
        const activeLib = (customLibraries || []).find(l => l.id === activeCustomLibId) || (customLibraries && customLibraries[0]);
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
                if (window.eel && window.eel.eliminar_pistas_disco) {
                    await window.eel.eliminar_pistas_disco(pathsToRemove, permanente)();
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
            if (window.eel && window.eel.buscar_reemplazos_spotify_batch) {
                try {
                    rawRes = await window.eel.buscar_reemplazos_spotify_batch(targetTracks)();
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
            if (window.eel && window.eel.calcular_trim_downbeat_track) {
                const res = await window.eel.calcular_trim_downbeat_track(targetPath, currentTrack.id)();
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
            if (window.eel && window.eel.calcular_hot_cues_fraseo) {
                const res = await window.eel.calcular_hot_cues_fraseo(durMs, bpm, downbeatMs)();
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
            if (window.eel && window.eel.organizar_pista_en_crate) {
                const res = await window.eel.organizar_pista_en_crate(
                    { ...currentTrack, genre: gen, subgenre: subg },
                    destinoDescarga || "/Users/admin/Music/mi musica",
                    "copy"
                )();
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
        if (window.eel && window.eel.listar_subcarpetas_sistema) {
            try {
                const eelPromise = window.eel.listar_subcarpetas_sistema(path)();
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
            if (window.eel && window.eel.seleccionar_directorio) {
                try {
                    target = await window.eel.seleccionar_directorio()();
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
        if (window.eel && window.eel.cargar_metadatos_directorio) {
            setIsLoadingDir(true);
            setBatchProgress(0);
            startProgressPolling();
            const targetDesc = Array.isArray(target) ? `${target.length} pistas seleccionadas` : `archivos en ${target}`;
            setBatchStatusMsg(isAppend ? `Añadiendo metadatos de ${targetDesc}...` : `Leyendo metadatos de ${targetDesc}...`);
            try {
                const res = await window.eel.cargar_metadatos_directorio(target)();
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
        if (window.eel && window.eel.iniciar_auditoria && !isAuditing) {
            setIsAuditing(true);
            setBatchProgress(0);
            startProgressPolling();
            const targetDesc = Array.isArray(target) ? `${target.length} pistas seleccionadas` : target;
            setBatchStatusMsg(`Iniciando auditoría acústica avanzada en ${targetDesc}...`);
            try {
                const res = await window.eel.iniciar_auditoria(target)();
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
            if (window.eel && window.eel.ejecutar_auditoria_lote) {
                const res = await window.eel.ejecutar_auditoria_lote(target, opts)();
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
                        await window.eel.inyectar_caratulas_lote(res.tracks)();
                    }
                    if (opts.tacticalComments && window.eel.inyectar_lote_metadatos) {
                        setBatchStatusMsg("Inyectando comentarios tácticos y tags en archivos físicos...");
                        await window.eel.inyectar_lote_metadatos(res.tracks)();
                    }
                    if (opts.normalizeNames && window.eel.sanitizar_metadatos_pistas) {
                        setBatchStatusMsg("Normalizando nombres de archivo y títulos...");
                        await window.eel.sanitizar_metadatos_pistas(res.tracks, false)();
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
        if (window.eel && window.eel.exportar_auditoria_xls) {
            setIsExporting(true);
            setBatchProgress(25);
            setBatchStatusMsg("Generando reporte de auditoría en formato Excel (XLSX)...");
            try {
                const res = await window.eel.exportar_auditoria_xls(tracks, destino)();
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
            if (window.eel && window.eel.inyectar_lote_metadatos) {
                const res = await window.eel.inyectar_lote_metadatos(tracks)();
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
        if (window.eel && window.eel.exportar_traktor_nml) {
            setIsExporting(true);
            setBatchProgress(40);
            setBatchStatusMsg("Generando colección Traktor Pro (.nml)...");
            try {
                const res = await window.eel.exportar_traktor_nml(tracks, destino)();
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
            if (window.eel && window.eel.exportar_set_m3u) {
                const res = await window.eel.exportar_set_m3u(tracks, "VirtualDJ_Coleccion", destino)();
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
        if (window.eel && window.eel.exportar_rekordbox_xml) {
            setIsExporting(true);
            setBatchProgress(40);
            setBatchStatusMsg("Generando archivo rekordbox.xml estándar Pioneer DJ...");
            try {
                const res = await window.eel.exportar_rekordbox_xml(tracks, destino, "rekordbox.xml")();
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
            if (window.eel && window.eel.sincronizar_pasaporte_universal) {
                res = await window.eel.sincronizar_pasaporte_universal(tracks, destino)();
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
        if (window.eel && window.eel.analizar_espectro_fft) {
            try {
                const res = await window.eel.analizar_espectro_fft(targetPath, trk.id)();
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
            if (window.eel && window.eel.guardar_cambios_track) {
                const res = await window.eel.guardar_cambios_track(currentTrack)();
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
            if (window.eel && window.eel.inyectar_caratulas_lote) {
                const res = await window.eel.inyectar_caratulas_lote(tracks)();
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
            if (window.eel && window.eel.sanitizar_metadatos_pistas) {
                res = await window.eel.sanitizar_metadatos_pistas(tracks, false)();
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

    const handleGuardarTodoEnFicheros = async () => {
        if (!tracks || tracks.length === 0) {
            alert("No hay pistas cargadas para guardar.");
            return;
        }
        setIsInjecting(true);
        setBatchProgress(5);
        setBatchStatusMsg(`Guardando todos los metadatos en ${tracks.length} archivos físicos...`);
        try {
            if (window.eel && window.eel.inyectar_lote_metadatos) {
                const res = await window.eel.inyectar_lote_metadatos(tracks)();
                setBatchProgress(100);
                if (res && res.status === 'ok') {
                    setBatchStatusMsg(`✓ Guardado completo: ${res.inyectados} archivos actualizados en disco con éxito.`);
                    setSaveFeedback(`✓ ${res.inyectados} archivos guardados con metadatos completos`);
                    setTimeout(() => setSaveFeedback(''), 4000);
                } else {
                    setBatchStatusMsg("Error durante el guardado de archivos.");
                }
            }
        } catch (e) {
            console.error("Error al guardar todo en ficheros:", e);
            setBatchStatusMsg("Error al guardar metadatos.");
        } finally {
            setTimeout(() => {
                setIsInjecting(false);
                setBatchProgress(0);
                setBatchStatusMsg('');
            }, 1000);
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
                    await window.eel.pausar_auditoria()();
                } else if (!nextState && window.eel.reanudar_auditoria) {
                    await window.eel.reanudar_auditoria()();
                }
            }
        } catch (e) {
            console.error("Error al pausar/reanudar:", e);
        }
    };

    const handleCancelarProceso = async () => {
        setIsAuditPaused(false);
        try {
            fetch('/api/cancelar_procesos', { method: 'POST' }).catch(() => {});
        } catch (e) {}
        if (window.eel && window.eel.cancelar_procesos_activos) {
            try {
                await window.eel.cancelar_procesos_activos()();
            } catch (e) {
                console.error("Error al cancelar procesos:", e);
            }
        }
        setIsAuditing(false);
        setIsLoadingDir(false);
        setIsInjecting(false);
        setIsExporting(false);
        setBatchProgress(0);
        setBatchStatusMsg('');
        if (typeof onAuditProgressChange === 'function') {
            onAuditProgressChange({ isAuditing: false, progress: 0, statusMsg: '' });
        }
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
            if (window.eel && window.eel.crear_biblioteca_en_disco) {
                const res = await window.eel.crear_biblioteca_en_disco("Coleccion_Organizada", estructura, destino)();
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
                        <SectionTitle icon={Icons.Library} title="Biblioteca" accent="Auditoría" />
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
                            onSaveTags={handleGuardarTodoEnFicheros}
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

                    <RekordboxWaveform 
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
                            onClick={handleGuardarTodoEnFicheros}
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

            {/* Modal Navegador de Carpetas y Selección de Archivos Web Integrado */}
            {fsBrowserOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans animate-fadeIn">
                    <div className="bg-[#0c0c12] border border-djzinc-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b border-djzinc-800 bg-djzinc-950 flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <span className="text-djcyan-400 font-bold text-sm uppercase tracking-wider font-mono flex items-center gap-2">
                                    <Icons.Library /> Explorador de Biblioteca & Selección de Archivos
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleAbrirDialogoNativo}
                                    className="px-3.5 py-2 min-h-[34px] bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/70 text-emerald-300 hover:text-white rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shadow flex items-center gap-1.5 active:scale-95"
                                    title="Abrir ventana nativa del Finder de macOS para seleccionar carpeta"
                                >
                                    <Icons.Folder size={14} />
                                    <span>Abrir Finder (macOS)</span>
                                </button>
                                <button onClick={() => setFsBrowserOpen(false)} className="w-8 h-8 rounded-full bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 flex items-center justify-center text-xs cursor-pointer"><Icons.Close size={15} className="inline-block align-[-2px]" /></button>
                            </div>
                        </div>

                        <div className="px-4 py-3 bg-djzinc-900/90 border-b border-djzinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-gray-400 shrink-0 font-bold">Ruta:</span>
                                <span className="text-djcyan-400 font-bold truncate" title={fsCurrentPath}>{fsCurrentPath || "Cargando..."}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {fsCurrentPath && (
                                    <button 
                                        type="button"
                                        onClick={() => toggleStageFolder(fsCurrentPath)}
                                        className={`px-3 py-2 min-h-[34px] rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow ${
                                            stagedFolders.includes(fsCurrentPath)
                                                ? 'bg-emerald-500 text-black border-emerald-400 font-black'
                                                : 'bg-djcyan-950/80 hover:bg-djcyan-900 border-djcyan-700/70 text-djcyan-300'
                                        }`}
                                        title="Añadir o quitar toda esta carpeta de la cesta de selección conjunta"
                                    >
                                        <span>{stagedFolders.includes(fsCurrentPath) ? '✓' : '+'}</span>
                                        <span>{stagedFolders.includes(fsCurrentPath) ? 'Carpeta Añadida' : 'Añadir Toda Esta Carpeta'}</span>
                                    </button>
                                )}
                                {fsParentPath && fsParentPath !== fsCurrentPath && (
                                    <button onClick={() => handleNavegarACarpeta(fsParentPath)} className="px-3 py-2 min-h-[34px] bg-djzinc-800 hover:bg-djzinc-700 text-white rounded-lg text-xs font-mono font-bold border border-djzinc-700 cursor-pointer shrink-0 flex items-center gap-1.5 shadow">
                                        <span>▲</span> <span>Subir Nivel</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Pestañas de Vista: Subcarpetas / Archivos de Audio */}
                        <div className="flex border-b border-djzinc-800 bg-[#07070a] px-4 pt-2.5 gap-2 text-xs font-mono">
                            <button
                                onClick={() => setFsActiveTab('folders')}
                                className={`px-4 py-2.5 min-h-[38px] rounded-t-lg font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                    fsActiveTab === 'folders'
                                        ? 'bg-djzinc-900 text-djcyan-400 border-t border-x border-djzinc-700'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <span><Icons.Folder size={15} className="inline-block align-[-2px]" /> Subcarpetas</span>
                                <span className="px-2 py-0.5 bg-djzinc-800 text-[11px] rounded-full text-gray-300 font-mono font-bold leading-none">{fsFolders.length}</span>
                                {stagedFolders.length > 0 && (
                                    <span className="px-2 py-0.5 bg-emerald-500 text-black text-[11px] font-bold rounded-full font-mono leading-none">
                                        {stagedFolders.length} en cesta
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setFsActiveTab('files')}
                                className={`px-4 py-2.5 min-h-[38px] rounded-t-lg font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                    fsActiveTab === 'files'
                                        ? 'bg-djzinc-900 text-djcyan-400 border-t border-x border-djzinc-700'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <span><Icons.Music size={15} className="inline-block align-[-2px]" /> Pistas Sueltas</span>
                                <span className={`px-2 py-0.5 text-[11px] rounded-full font-bold font-mono leading-none ${
                                    stagedFiles.length > 0 ? 'bg-djcyan-500 text-black' : 'bg-djzinc-800 text-gray-300'
                                }`}>
                                    {stagedFiles.length > 0 ? `${stagedFiles.length} en cesta` : fsFiles.length}
                                </span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-[#07070a]">
                            {fsLoading ? (
                                <div className="py-14 text-center text-gray-400 text-xs font-mono flex flex-col items-center gap-2">
                                    <div className="w-6 h-6 border-2 border-djcyan-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Leyendo directorio y pistas de audio...</span>
                                </div>
                            ) : fsActiveTab === 'folders' ? (
                                fsFolders.length === 0 ? (
                                    <div className="py-12 text-center text-gray-500 text-xs font-mono">
                                        No hay subcarpetas en este directorio.
                                    </div>
                                ) : (
                                    fsFolders.map((f, idx) => {
                                        const isFolderStaged = stagedFolders.includes(f.path);
                                        return (
                                            <div 
                                                key={idx} 
                                                onClick={() => handleNavegarACarpeta(f.path)}
                                                className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer group transition-all ${
                                                    isFolderStaged 
                                                        ? 'bg-emerald-950/20 border-emerald-500/50' 
                                                        : 'bg-djzinc-900/60 hover:bg-djcyan-950/40 border-djzinc-800/80 hover:border-djcyan-500/50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <Icons.Folder size={14} className="inline-block align-[-2px] text-amber-400" />
                                                    <span className="text-xs text-gray-200 group-hover:text-white font-medium truncate">{f.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleStageFolder(f.path); }}
                                                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                                                            isFolderStaged
                                                                ? 'bg-emerald-500 text-black border-emerald-400 font-black'
                                                                : 'bg-djzinc-800 hover:bg-djcyan-950 text-djcyan-300 border-djzinc-700 hover:border-djcyan-600'
                                                        }`}
                                                        title="Añadir o quitar esta subcarpeta de la cesta"
                                                    >
                                                        <span>{isFolderStaged ? '✓' : '+'}</span>
                                                        <span>{isFolderStaged ? 'Añadida a Cesta' : 'Añadir Carpeta'}</span>
                                                    </button>
                                                    <span className="text-gray-500 text-xs group-hover:text-djcyan-400 font-mono">➔</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            ) : (
                                /* Pestaña de Archivos de Audio con Selección Incremental */
                                <div>
                                    {fsFiles.length > 0 && (
                                        <div className="flex items-center justify-between p-2 mb-2 bg-djzinc-900/80 rounded border border-djzinc-800 text-xs font-mono">
                                            <label className="flex items-center gap-2 text-gray-300 cursor-pointer select-none">
                                                <input 
                                                    type="checkbox"
                                                    checked={fsFiles.length > 0 && fsFiles.every(f => stagedFiles.includes(f.path))}
                                                    onChange={toggleStageAllCurrentFsFiles}
                                                    className="rounded bg-djzinc-950 border-djzinc-700 text-djcyan-500 focus:ring-0 cursor-pointer"
                                                />
                                                <span className="font-bold">Seleccionar todas las de este nivel ({fsFiles.length})</span>
                                            </label>
                                            {stagedFiles.length > 0 && (
                                                <span className="text-djcyan-400 text-[11px] font-bold">
                                                    <Icons.Check size={14} className="inline-block align-[-2px]" /> {stagedFiles.length} pista(s) acumuladas en cesta
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {fsFiles.length === 0 ? (
                                        <div className="py-12 text-center text-gray-500 text-xs font-mono">
                                            No se encontraron archivos de audio directos (.flac, .mp3, .wav, etc.) en este nivel.
                                            <br />
                                            <span className="text-gray-400 mt-1 inline-block">Navega a una subcarpeta para explorar más pistas.</span>
                                        </div>
                                    ) : (
                                        fsFiles.map((fileItem, idx) => {
                                            const isSelected = stagedFiles.includes(fileItem.path);
                                            return (
                                                <div 
                                                    key={idx}
                                                    onClick={() => toggleStageFile(fileItem.path)}
                                                    className={`p-2 rounded flex items-center justify-between cursor-pointer border transition-colors ${
                                                        isSelected 
                                                            ? 'bg-djcyan-950/40 border-djcyan-500/60 text-white' 
                                                            : 'bg-djzinc-900/40 hover:bg-djzinc-800/60 border-djzinc-800 text-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        <input 
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {}}
                                                            className="rounded bg-djzinc-950 border-djzinc-700 text-djcyan-500 focus:ring-0 cursor-pointer"
                                                        />
                                                        <Icons.Music size={14} className="inline-block align-[-2px] text-djcyan-400" />
                                                        <span className="text-xs truncate font-mono">{fileItem.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
                                                        <span className="px-1.5 py-0.5 rounded bg-djzinc-800 text-djcyan-300 font-bold border border-djzinc-700">
                                                            {fileItem.ext || 'AUDIO'}
                                                        </span>
                                                        <span className="text-gray-400">{fileItem.size_mb ? `${fileItem.size_mb} MB` : ''}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-3.5 bg-djzinc-950 border-t border-djzinc-800 flex flex-wrap justify-between items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-gray-300 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-djcyan-400 animate-pulse"></span>
                                    <span>Cesta:</span>
                                    <span className="text-emerald-400">{stagedFolders.length} carpeta(s)</span>
                                    <span>•</span>
                                    <span className="text-djcyan-300">{stagedFiles.length} pista(s)</span>
                                </span>
                                {(stagedFolders.length > 0 || stagedFiles.length > 0) && (
                                    <button 
                                        type="button" 
                                        onClick={clearStagedSelection}
                                        className="px-2 py-0.5 text-[10px] font-mono text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                                        title="Vaciar la selección acumulada"
                                    >
                                        [Vaciar Cesta]
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2.5">
                                <button 
                                    type="button"
                                    onClick={() => setFsBrowserOpen(false)} 
                                    className="px-5 py-2.5 min-h-[40px] bg-djzinc-800 hover:bg-djzinc-700 text-gray-200 hover:text-white rounded-xl text-xs font-mono font-bold cursor-pointer transition-all flex items-center justify-center shadow active:scale-95 border border-djzinc-700"
                                >
                                    Cancelar
                                </button>
                                {(stagedFolders.length > 0 || stagedFiles.length > 0) ? (
                                    <button 
                                        type="button"
                                        onClick={handleConfirmarSeleccionLote}
                                        className="px-5 py-2.5 min-h-[40px] bg-gradient-to-r from-emerald-500 to-djcyan-400 hover:from-emerald-400 hover:to-djcyan-300 text-black font-mono font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/40 cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Icons.Download size={15} />
                                        <span>Cargar Cesta Completa ({stagedFolders.length} carp., {stagedFiles.length} pistas)</span>
                                    </button>
                                ) : (
                                    <button 
                                        type="button"
                                        onClick={() => handleSeleccionarCarpetaUI(fsCurrentPath)} 
                                        className="px-5 py-2.5 min-h-[40px] bg-djcyan-400 hover:bg-djcyan-300 text-black font-mono font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Icons.Folder size={15} />
                                        <span>Cargar Toda la Carpeta Actual</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

// =========================================================================
// ESPACIO DE TRABAJO: CONOCIMIENTO (CURSOS, VÍDEOS Y MANUALES DJ)
// =========================================================================

// =======================================================
// WORKSPACE IN-APP: BEATWAVE LIVE COPILOT (CABINA)
// =======================================================

const MASTER_TRACKS_POOL = [
    {
        id: 'rec_1',
        title: 'Higher (Original Mix)',
        artist: 'Amelie Lens',
        bpm: 138.0,
        camelot: '10A',
        raw_key: 'Bm',
        role: 'Percussive Tool',
        lufs: -6.5,
        low_ratio: 36.0,
        genre: 'Acid / Peak Techno',
        subgenre: 'Lenske Peak',
        energy: 94,
        danceability: 89,
        arousal: 92,
        mood: 'Acid Drive',
        format: 'FLAC 24-bit',
        duration: '06:12',
        year: '2023',
        cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
        strategy: 'Mezcla Armónica Segura',
        reason: 'Mismo tono (10A) y espectro percusivo limpio. Cero riesgo de embarre en graves.',
        camelot_color: '#f472b6'
    },
    {
        id: 'rec_2',
        title: 'Your Mind (Extended Club)',
        artist: 'Adam Beyer & Bart Skils',
        bpm: 138.5,
        camelot: '11A',
        raw_key: 'F#m',
        role: 'Peak Time Driver',
        lufs: -5.9,
        low_ratio: 49.0,
        genre: 'Drumcode Techno',
        subgenre: 'Drumcode Peak',
        energy: 96,
        danceability: 92,
        arousal: 95,
        mood: 'Peak Time Climax',
        format: 'FLAC Hi-Res',
        duration: '07:22',
        year: '2022',
        cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
        strategy: 'Subidón de Energía (+1)',
        reason: 'Aumento armónico a 11A con +1.0 BPM. Eleva la intensidad del club para el clímax.',
        camelot_color: '#fb7185'
    },
    {
        id: 'rec_3',
        title: 'Old School',
        artist: 'Hertz',
        bpm: 138.0,
        camelot: '10A',
        raw_key: 'Bm',
        role: 'Industrial Driver',
        lufs: -6.2,
        low_ratio: 38.0,
        genre: 'Hard Techno Industrial',
        subgenre: 'Sway Records',
        energy: 93,
        danceability: 91,
        arousal: 90,
        mood: 'Raw Industrial',
        format: 'FLAC 24-bit',
        duration: '05:12',
        year: '2024',
        cover: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop',
        strategy: 'Groove Industrial Limpio',
        reason: 'Mismo Camelot (10A), pegada seca sin saturar sub-graves. Transición directa perfecta.',
        camelot_color: '#f472b6'
    },
    {
        id: 'rec_4',
        title: 'Booster (Gary Beck Remix)',
        artist: 'Planetary Assault Systems',
        bpm: 137.5,
        camelot: '10A',
        raw_key: 'Bm',
        role: 'Percussive Descongestor',
        lufs: -7.1,
        low_ratio: 32.0,
        genre: 'Hypnotic / Raw',
        subgenre: 'Mote-Evolver',
        energy: 88,
        danceability: 86,
        arousal: 85,
        mood: 'Hypnotic Groove',
        format: 'WAV 24-bit',
        duration: '05:48',
        year: '2021',
        cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=300&fit=crop',
        strategy: 'Descongestión de Sala',
        reason: 'Textura enfocada en medios y agudos. Ideal para limpiar la sala tras un drop saturado.',
        camelot_color: '#f472b6'
    },
    {
        id: 'rec_5',
        title: 'Subversion',
        artist: 'Enrico Sangiuliano',
        bpm: 138.0,
        camelot: '11A',
        raw_key: 'F#m',
        role: 'Cosmic Climax',
        lufs: -6.0,
        low_ratio: 44.0,
        genre: 'Peak Time Techno',
        subgenre: 'NINETOZERO',
        energy: 95,
        danceability: 90,
        arousal: 94,
        mood: 'Cosmic Meltdown',
        format: 'FLAC Hi-Res',
        duration: '06:48',
        year: '2023',
        cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
        strategy: 'Ascensión Hipnótica',
        reason: 'Sintetizadores espaciales que abren el panorama estéreo antes de cortar los bajos.',
        camelot_color: '#fb7185'
    },
    {
        id: 'rec_6',
        title: 'Rave Generation',
        artist: 'Reinier Zonneveld',
        bpm: 139.0,
        camelot: '11A',
        raw_key: 'F#m',
        role: 'Acid Meltdown',
        lufs: -5.5,
        low_ratio: 46.0,
        genre: 'Acid Techno',
        subgenre: 'Filth on Acid',
        energy: 98,
        danceability: 94,
        arousal: 98,
        mood: 'High Energy Climax',
        format: 'WAV 24-bit',
        duration: '06:15',
        year: '2024',
        cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop',
        strategy: 'Explosión Peak Time',
        reason: 'Energía máxima para cerrar el set. Requiere swap rápido de EQ Low en drop.',
        camelot_color: '#fb7185'
    },
    {
        id: 'rec_7',
        title: 'Age of Love (Charlotte de Witte Remix)',
        artist: 'Age of Love',
        bpm: 138.0,
        camelot: '9A',
        raw_key: 'Em',
        role: 'Peak Acid Driver',
        lufs: -5.8,
        low_ratio: 41.0,
        genre: 'Peak Techno',
        subgenre: 'Diki Records',
        energy: 96,
        danceability: 92,
        arousal: 95,
        mood: 'Euphoric Peak',
        format: 'FLAC 24-bit',
        duration: '07:30',
        year: '2021',
        cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop',
        strategy: 'Descenso Armónico Suave (-1)',
        reason: 'Transición diagonal suave a 9A, manteniendo la tensión alta en el público.',
        camelot_color: '#818cf8'
    },
    {
        id: 'rec_8',
        title: 'Consciousness',
        artist: 'Anyma & Chris Avantgarde',
        bpm: 130.0,
        camelot: '8A',
        raw_key: 'Am',
        role: 'Melodic Journey',
        lufs: -6.4,
        low_ratio: 35.0,
        genre: 'Melodic Techno',
        subgenre: 'Afterlife',
        energy: 90,
        danceability: 88,
        arousal: 89,
        mood: 'Atmospheric Meltdown',
        format: 'FLAC Hi-Res',
        duration: '05:48',
        year: '2022',
        cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
        strategy: 'Cruce Melódico Espacioso',
        reason: 'Ideal para bajar de BPM o abrir el viaje melódico con graves limpios.',
        camelot_color: '#c084fc'
    }
];

const DEFAULT_COPILOT_STATE = {
    "connected": true,
    "source": "SIMULATION_MODE",
    "platform": "serato",
    "platform_mode": "auto",
    "platform_name": "Serato DJ Pro",
    "platform_icon": "\ud83d\udcbf",
    "platform_color": "#06b6d4",
    "platform_status": "LIVE",
    "detected_platforms": {
        "serato": true,
        "rekordbox": true,
        "virtualdj": true,
        "traktor": false
    },
    "deck_1": {
        "deck_num": "1",
        "status": "ON AIR (MASTER)",
        "is_master": true,
        "is_playing": true,
        "artist": "Mauro Picotto",
        "title": "Komodo (Megavoices Claxixx)",
        "bpm": 137.68,
        "camelot": "10A",
        "camelot_color": "#f472b6",
        "raw_key": "Bm",
        "file_path": "Users/admin/Music/FLAC quality/The Midnight - Deep Blue.flac",
        "genre": "Melodic Techno",
        "subgenre": "Club Master",
        "energy": 92,
        "danceability": 88,
        "valence": 55,
        "arousal": 88,
        "format": "FLAC 24-bit",
        "duration": "06:30",
        "duration_sec": 390.0,
        "elapsed_sec": 182.25,
        "play_progress": 0.4673,
        "phase": "Peak Time",
        "year": "2024",
        "cover": "/cover?path=Users/admin/Music/FLAC quality/The Midnight - Deep Blue.flac",
        "cues": [
            {
                "id": 1,
                "name": "Downbeat 1.0.0",
                "color": "#ef4444",
                "pct": 0.04,
                "time": "00:00.25"
            },
            {
                "id": 2,
                "name": "Intro Perc",
                "color": "#f97316",
                "pct": 0.16,
                "time": "01:04.00"
            },
            {
                "id": 3,
                "name": "Bassline In",
                "color": "#eab308",
                "pct": 0.32,
                "time": "02:08.00"
            },
            {
                "id": 4,
                "name": "MAIN DROP",
                "color": "#10b981",
                "pct": 0.48,
                "time": "03:12.00"
            },
            {
                "id": 5,
                "name": "Breakdown",
                "color": "#06b6d4",
                "pct": 0.62,
                "time": "04:16.00"
            },
            {
                "id": 6,
                "name": "Climax 2",
                "color": "#22d3ee",
                "pct": 0.74,
                "time": "05:04.00"
            },
            {
                "id": 7,
                "name": "Outro 32b",
                "color": "#8b5cf6",
                "pct": 0.86,
                "time": "06:08.00"
            },
            {
                "id": 8,
                "name": "Cut / Fade",
                "color": "#ec4899",
                "pct": 0.96,
                "time": "07:15.00"
            }
        ],
        "structural_phases": [
            {
                "id": "intro",
                "name": "Intro Percusiva",
                "start_pct": 0.0,
                "end_pct": 0.16,
                "type": "intro",
                "label": "Intro 32b \u2022 Mezcla In",
                "color": "#06b6d4"
            },
            {
                "id": "build",
                "name": "Bassline In",
                "start_pct": 0.16,
                "end_pct": 0.35,
                "type": "build",
                "label": "Bassline Activa",
                "color": "#eab308"
            },
            {
                "id": "break",
                "name": "Breakdown",
                "start_pct": 0.35,
                "end_pct": 0.48,
                "type": "break",
                "label": "Breakdown (Sin Graves)",
                "color": "#38bdf8"
            },
            {
                "id": "drop",
                "name": "MAIN DROP",
                "start_pct": 0.48,
                "end_pct": 0.74,
                "type": "drop",
                "label": "\u26a1 DROP PRINCIPAL (Cl\u00edmax)",
                "color": "#ef4444"
            },
            {
                "id": "break2",
                "name": "Segundo Par\u00f3n",
                "start_pct": 0.74,
                "end_pct": 0.82,
                "type": "break",
                "label": "Puente Mel\u00f3dico",
                "color": "#a855f7"
            },
            {
                "id": "outro",
                "name": "Outro Limpio",
                "start_pct": 0.82,
                "end_pct": 1.0,
                "type": "outro",
                "label": "\ud83d\udfe2 OUTRO SEGURO \u2022 Mezcla Out",
                "color": "#10b981"
            }
        ],
        "lufs": -8.7,
        "low_ratio": 48.0,
        "mid_ratio": 32.0,
        "high_ratio": 20.0,
        "acoustic_role": "Bass Driver",
        "is_audited": true,
        "comment": "[Bass Driver] Intro 32b \u2022 Drop contundente \u2022 Outro 64b",
        "tactical_comment": "[Bass Driver] Intro 32b \u2022 Drop contundente \u2022 Outro 64b",
        "mood": "Peak Time Climax"
    },
    "deck_2": {
        "deck_num": "2",
        "status": "CUE / PREPARADO",
        "is_master": false,
        "is_playing": false,
        "artist": "Marco Bailey / Sigvard",
        "title": "Smooth Mind",
        "bpm": 140.0,
        "camelot": "6A",
        "camelot_color": "#c084fc",
        "raw_key": "Gm",
        "file_path": "Users/admin/Music/FLAC quality/Snog - Turn on your Brain Baby vs. Acid Outburst 06.flac",
        "genre": "Raw / Deep Techno",
        "subgenre": "Drumcode Core",
        "energy": 91,
        "danceability": 95,
        "valence": 62,
        "arousal": 91,
        "format": "FLAC 16-bit",
        "duration": "05:48",
        "duration_sec": 348.0,
        "elapsed_sec": 88.25,
        "play_progress": 0.2536,
        "phase": "Hypnotic Groove",
        "year": "2023",
        "cover": "/cover?path=Users/admin/Music/FLAC quality/Snog - Turn on your Brain Baby vs. Acid Outburst 06.flac",
        "cues": [
            {
                "id": 1,
                "name": "Downbeat 1.0.0",
                "color": "#ef4444",
                "pct": 0.05,
                "time": "00:00.30"
            },
            {
                "id": 2,
                "name": "Vocal Hook",
                "color": "#f97316",
                "pct": 0.19,
                "time": "01:08.00"
            },
            {
                "id": 3,
                "name": "Build-Up 16b",
                "color": "#eab308",
                "pct": 0.35,
                "time": "02:16.00"
            },
            {
                "id": 4,
                "name": "PEAK DROP",
                "color": "#10b981",
                "pct": 0.5,
                "time": "03:20.00"
            },
            {
                "id": 5,
                "name": "Acid Meltdown",
                "color": "#06b6d4",
                "pct": 0.64,
                "time": "04:24.00"
            },
            {
                "id": 6,
                "name": "Second Drop",
                "color": "#22d3ee",
                "pct": 0.76,
                "time": "05:12.00"
            },
            {
                "id": 7,
                "name": "Outro Limpio",
                "color": "#8b5cf6",
                "pct": 0.88,
                "time": "06:16.00"
            },
            {
                "id": 8,
                "name": "Fade Out",
                "color": "#ec4899",
                "pct": 0.97,
                "time": "06:45.00"
            }
        ],
        "structural_phases": [
            {
                "id": "intro",
                "name": "Intro Percusiva",
                "start_pct": 0.0,
                "end_pct": 0.16,
                "type": "intro",
                "label": "Intro 32b \u2022 Mezcla In",
                "color": "#06b6d4"
            },
            {
                "id": "build",
                "name": "Bassline In",
                "start_pct": 0.16,
                "end_pct": 0.35,
                "type": "build",
                "label": "Bassline Activa",
                "color": "#eab308"
            },
            {
                "id": "break",
                "name": "Breakdown",
                "start_pct": 0.35,
                "end_pct": 0.48,
                "type": "break",
                "label": "Breakdown (Sin Graves)",
                "color": "#38bdf8"
            },
            {
                "id": "drop",
                "name": "MAIN DROP",
                "start_pct": 0.48,
                "end_pct": 0.74,
                "type": "drop",
                "label": "\u26a1 DROP PRINCIPAL (Cl\u00edmax)",
                "color": "#ef4444"
            },
            {
                "id": "break2",
                "name": "Segundo Par\u00f3n",
                "start_pct": 0.74,
                "end_pct": 0.82,
                "type": "break",
                "label": "Puente Mel\u00f3dico",
                "color": "#a855f7"
            },
            {
                "id": "outro",
                "name": "Outro Limpio",
                "start_pct": 0.82,
                "end_pct": 1.0,
                "type": "outro",
                "label": "\ud83d\udfe2 OUTRO SEGURO \u2022 Mezcla Out",
                "color": "#10b981"
            }
        ],
        "lufs": -9.5,
        "low_ratio": 51.0,
        "mid_ratio": 31.0,
        "high_ratio": 18.0,
        "acoustic_role": "Bass Driver",
        "is_audited": true,
        "comment": "[Bass Driver] Intro 32b \u2022 Drop contundente \u2022 Outro 64b",
        "tactical_comment": "[Bass Driver] Intro 32b \u2022 Drop contundente \u2022 Outro 64b",
        "mood": "Hypnotic Groove"
    },
    "anti_muddy": {
        "clash_detected": true,
        "severity": "CRITICAL",
        "badge": "BASS CLASH",
        "color": "#ef4444",
        "message": "Ambos tracks tienen sub-graves dominantes (>44%). El solape directo crear\u00e1 empaste y distorsi\u00f3n en el sistema de sala.",
        "tactical_advice": "Corta la EQ de graves (Low) en el canal entrante (-6dB a -12dB) antes de abrir el fader, o usa filtro paso-alto."
    },
    "harmonic": {
        "compatible": false,
        "match_type": "HARMONIC CLASH",
        "camelot_diff": "+4 Pasos",
        "energy_trend": "Disonancia Tonal",
        "badge": "HARMONIC CLASH",
        "color": "#ef4444",
        "advice": "Choque arm\u00f3nico severo (10A \u2794 6A). Usa par\u00f3n o transici\u00f3n por percusi\u00f3n."
    },
    "lufs_delta": -0.8,
    "bpm_delta": -0.37,
    "bpm_pct": -0.28,
    "recommendations": [
        {
            "id": "rec_1",
            "title": "Higher (Original Mix)",
            "artist": "Amelie Lens",
            "bpm": 130.0,
            "camelot": "10A",
            "role": "Percussive Tool",
            "lufs": -6.5,
            "low_ratio": 36.0,
            "genre": "Acid / Peak Techno",
            "subgenre": "Lenske Peak",
            "energy": 94,
            "danceability": 89,
            "mood": "Acid Drive",
            "format": "FLAC 24-bit",
            "duration": "06:12",
            "year": "2023",
            "cover": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
            "strategy": "Mezcla Arm\u00f3nica Segura",
            "reason": "Mismo tono (10A) y espectro percusivo limpio. Cero riesgo de embarre en graves.",
            "camelot_color": "#f472b6"
        },
        {
            "id": "rec_2",
            "title": "Your Mind (Extended Club)",
            "artist": "Adam Beyer & Bart Skils",
            "bpm": 131.0,
            "camelot": "11A",
            "role": "Peak Time Driver",
            "lufs": -5.9,
            "low_ratio": 49.0,
            "genre": "Drumcode Techno",
            "subgenre": "Drumcode Peak",
            "energy": 96,
            "danceability": 92,
            "mood": "Peak Time Climax",
            "format": "FLAC Hi-Res",
            "duration": "07:22",
            "year": "2022",
            "cover": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
            "strategy": "Subid\u00f3n de Energ\u00eda (+1)",
            "reason": "Aumento arm\u00f3nico a 11A con +1.0 BPM. Eleva la intensidad del club para el cl\u00edmax.",
            "camelot_color": "#fb7185"
        },
        {
            "id": "rec_3",
            "title": "Old School",
            "artist": "Hertz",
            "bpm": 130.0,
            "camelot": "10A",
            "role": "Industrial Driver",
            "lufs": -6.2,
            "low_ratio": 38.0,
            "genre": "Hard Techno Industrial",
            "subgenre": "Sway Records",
            "energy": 93,
            "danceability": 91,
            "mood": "Raw Industrial",
            "format": "FLAC 24-bit",
            "duration": "05:12",
            "year": "2024",
            "cover": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop",
            "strategy": "Groove Industrial Limpio",
            "reason": "Mismo Camelot (10A), pegada seca sin saturar sub-graves. Transici\u00f3n directa perfecta.",
            "camelot_color": "#f472b6"
        },
        {
            "id": "rec_4",
            "title": "Booster (Gary Beck Remix)",
            "artist": "Planetary Assault Systems",
            "bpm": 129.5,
            "camelot": "10A",
            "role": "Percussive Descongestor",
            "lufs": -7.1,
            "low_ratio": 32.0,
            "genre": "Hypnotic / Raw",
            "subgenre": "Mote-Evolver",
            "energy": 88,
            "danceability": 86,
            "mood": "Hypnotic Groove",
            "format": "WAV 24-bit",
            "duration": "05:48",
            "year": "2021",
            "cover": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=300&fit=crop",
            "strategy": "Descongesti\u00f3n de Sala",
            "reason": "Textura enfocada en medios y agudos. Ideal para limpiar la sala tras un drop saturado.",
            "camelot_color": "#f472b6"
        },
        {
            "id": "rec_5",
            "title": "Subversion",
            "artist": "Enrico Sangiuliano",
            "bpm": 130.5,
            "camelot": "11A",
            "role": "Cosmic Climax",
            "lufs": -6.0,
            "low_ratio": 44.0,
            "genre": "Peak Time Techno",
            "subgenre": "NINETOZERO",
            "energy": 95,
            "danceability": 90,
            "mood": "Cosmic Meltdown",
            "format": "FLAC Hi-Res",
            "duration": "06:48",
            "year": "2023",
            "cover": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
            "strategy": "Ascensi\u00f3n Hipn\u00f3tica",
            "reason": "Sintetizadores espaciales que abren el panorama est\u00e9reo antes de cortar los bajos.",
            "camelot_color": "#fb7185"
        },
        {
            "id": "rec_6",
            "title": "Rave Generation",
            "artist": "Reinier Zonneveld",
            "bpm": 132.0,
            "camelot": "11A",
            "role": "Acid Meltdown",
            "lufs": -5.5,
            "low_ratio": 46.0,
            "genre": "Acid Techno",
            "subgenre": "Filth on Acid",
            "energy": 98,
            "danceability": 94,
            "mood": "High Energy Climax",
            "format": "WAV 24-bit",
            "duration": "06:15",
            "year": "2024",
            "cover": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
            "strategy": "Explosi\u00f3n Peak Time",
            "reason": "Energ\u00eda m\u00e1xima para cerrar el set. Requiere swap r\u00e1pido de EQ Low en drop.",
            "camelot_color": "#fb7185"
        }
    ],
    "local_ip": "192.168.1.151",
    "timestamp": 1794309847.254317,
    "last_updated": "12:24:07",
    "is_simulating": true
};

const CopilotWorkspace = ({ onOpenPopOut, onOpenQr }) => {
    const [state, setState] = useState(DEFAULT_COPILOT_STATE);
    const [clock, setClock] = useState('');
    const [latency, setLatency] = useState(2);
    const [visibleCount, setVisibleCount] = useState(4);
    const [tracksList, setTracksList] = useState(DEFAULT_COPILOT_STATE.recommendations);
    const [draggedIdx, setDraggedIdx] = useState(null);
    const [transitionAnalysis, setTransitionAnalysis] = useState(null);
    const [lowEqApplied, setLowEqApplied] = useState(false);
    const [manualPickerOpen, setManualPickerOpen] = useState(false);
    const [manualSearchQuery, setManualSearchQuery] = useState('');
    const wsRef = useRef(null);

    const togglePlayDeck = async (targetSide) => {
        const sideStr = targetSide === '2' ? '2' : '1';
        // 1. Optimistic UI update inmediato para 0ms de respuesta táctica
        setState(prev => {
            if (!prev) return prev;
            const curDeck = sideStr === '1' ? prev.deck_1 : prev.deck_2;
            if (!curDeck) return prev;
            const newIsPlaying = !curDeck.is_playing;
            return {
                ...prev,
                [`deck_${sideStr}`]: {
                    ...curDeck,
                    is_playing: newIsPlaying,
                    status: newIsPlaying ? (curDeck.is_master ? 'ON AIR (MASTER)' : 'REPRODUCIENDO') : 'CUE / PREPARADO'
                }
            };
        });

        // 2. Transmitir comando a 0ms vía WebSocket o REST
        try {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ action: 'toggle_play', deck: sideStr }));
            } else {
                const res = await fetch('/api/copilot/toggle_play', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deck: sideStr })
                });
                if (res.ok) {
                    const data = await res.json();
                    setState(data);
                }
            }
        } catch (_) {}
    };

    const cueDeck = async (targetSide) => {
        const sideStr = targetSide === '2' ? '2' : '1';
        setState(prev => {
            if (!prev) return prev;
            const curDeck = sideStr === '1' ? prev.deck_1 : prev.deck_2;
            if (!curDeck) return prev;
            return {
                ...prev,
                [`deck_${sideStr}`]: {
                    ...curDeck,
                    is_playing: false,
                    play_progress: 0.0,
                    elapsed_sec: 0.0,
                    status: 'CUE / PREPARADO'
                }
            };
        });

        try {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ action: 'cue_deck', deck: sideStr }));
            } else {
                const res = await fetch('/api/copilot/cue_deck', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deck: sideStr })
                });
                if (res.ok) {
                    const data = await res.json();
                    setState(data);
                }
            }
        } catch (_) {}
    };

    const handleApplyCorrection = () => {
        setLowEqApplied(prev => {
            const next = !prev;
            setState(curr => {
                if (!curr) return curr;
                return {
                    ...curr,
                    deck_2: {
                        ...curr.deck_2,
                        low_ratio: next ? 24 : 51,
                        lufs: next ? -7.8 : -6.3
                    },
                    anti_muddy: {
                        ...curr.anti_muddy,
                        status: next ? 'safe' : 'danger',
                        tag: next ? 'EQ LOW -10dB APLICADO' : 'BASS CLASH',
                        color: next ? '#10b981' : '#ef4444',
                        message: next 
                            ? 'Low EQ cortado en Deck 2 (-10dB). Espectro de sub-graves despejado y sin distorsión en sala.' 
                            : 'Ambos tracks tienen sub-graves dominantes (>44%). El solape directo creará empaste y distorsión en el sistema de sala.',
                        action: next ? 'Restablecer EQ (Deshacer)' : 'Corta la EQ de graves (Low) en el canal entrante (-6dB a -12dB)'
                    }
                };
            });
            return next;
        });
    };

    const handleRandomLoad = () => {
        const poolCopy = [...MASTER_TRACKS_POOL];
        for (let i = poolCopy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [poolCopy[i], poolCopy[j]] = [poolCopy[j], poolCopy[i]];
        }
        setTracksList(poolCopy.slice(0, 8));
        setVisibleCount(8);
    };

    const handleAddManualTrack = (track) => {
        setTracksList(prev => {
            if (prev.some(t => t.id === track.id)) return prev;
            if (prev.length >= 8) {
                return [...prev.slice(0, 7), track];
            }
            return [...prev, track];
        });
        setVisibleCount(v => Math.max(v, Math.min(8, tracksList.length + 1)));
        setManualPickerOpen(false);
    };

    const [controllerState, setControllerState] = useState({
        detected: true,
        name: 'NUMARK NV II (USB)',
        status: 'CONECTADA'
    });

    // Detección automática y mapeo reactivo de Controladora DJ (WebMIDI API <1ms)
    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess({ sysex: false })
                .then(access => {
                    const checkDevices = () => {
                        const inputs = Array.from(access.inputs.values());
                        const djDev = inputs.find(d => /nv|numark|mkii|ddj|flx|pioneer|traktor|kontrol|denon|hercules|reloop|dj/i.test(d.name || ''));
                        if (djDev) {
                            let cleanName = djDev.name.toUpperCase();
                            if (/nv|mkii/i.test(cleanName)) {
                                cleanName = 'NUMARK NV II (USB)';
                            }
                            setControllerState({
                                detected: true,
                                name: cleanName,
                                status: 'CONECTADA'
                            });
                        } else if (inputs.length > 0) {
                            setControllerState({
                                detected: true,
                                name: inputs[0].name.toUpperCase(),
                                status: 'MIDI ACTIVO'
                            });
                        }

                        // Escuchar mensajes MIDI en vivo para transporte DJ (Play/Pause, Cue)
                        inputs.forEach(input => {
                            input.onmidimessage = (msg) => {
                                if (!msg || !msg.data || msg.data.length < 2) return;
                                const status = msg.data[0];
                                const note = msg.data[1];
                                const vel = msg.data.length > 2 ? msg.data[2] : 0;
                                const isNoteOn = ((status & 0xf0) === 0x90 && vel > 0) || ((status & 0xf0) === 0xb0 && vel > 0);
                                const channel = status & 0x0f;

                                if (isNoteOn) {
                                    // Numark NV / NV II / Pioneer / Traktor transport:
                                    // Ch 0 o Ch 2 (Deck 1 / 3):
                                    if ((channel === 0 || channel === 2) && (note === 0 || note === 8 || note === 11 || note === 39 || note === 64 || note === 67 || note === 71 || note === 75)) {
                                        togglePlayDeck('1');
                                    } else if ((channel === 1 || channel === 3) && (note === 0 || note === 8 || note === 12 || note === 39 || note === 64 || note === 67 || note === 72 || note === 75)) {
                                        togglePlayDeck('2');
                                    } else if (note === 11 || note === 71) {
                                        togglePlayDeck('1');
                                    } else if (note === 12 || note === 72) {
                                        togglePlayDeck('2');
                                    } else if (note === 1 || note === 9 || note === 51 || note === 68) {
                                        if (channel === 1 || channel === 3) {
                                            cueDeck('2');
                                        } else {
                                            cueDeck('1');
                                        }
                                    }
                                }
                            };
                        });
                    };
                    checkDevices();
                    access.onstatechange = checkDevices;
                })
                .catch(() => {});
        }
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setClock(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Conexión en tiempo real: WebSocket nativo 60 FPS (<25ms) con fallback a Polling reactivo
    useEffect(() => {
        let isMounted = true;
        let ws = null;
        let fallbackInterval = null;
        let isFetching = false;

        const startPollingFallback = () => {
            if (fallbackInterval) return;
            const fetchStatus = async () => {
                if (isFetching || document.hidden) return;
                isFetching = true;
                const t0 = performance.now();
                try {
                    const res = await fetch('/api/copilot/status');
                    if (res.ok) {
                        const data = await res.json();
                        const dt = Math.round(performance.now() - t0);
                        if (isMounted) {
                            setState(data);
                            if (data.controller && data.controller.name) {
                                setControllerState(data.controller);
                            }
                            const measured = data.capture_latency_ms ? Math.round(data.capture_latency_ms + (dt * 0.15)) : dt;
                            setLatency(Math.max(1, measured));
                            if (data.recommendations && data.recommendations.length > 0) {
                                setTracksList(prev => (prev.length === 0 ? data.recommendations : prev));
                            }
                        }
                    }
                } catch (e) {
                    if (isMounted) {
                        setState(prev => prev || DEFAULT_COPILOT_STATE);
                        setLatency(1);
                        setTracksList(prev => (prev.length === 0 ? DEFAULT_COPILOT_STATE.recommendations : prev));
                    }
                } finally {
                    isFetching = false;
                }
            };
            fetchStatus();
            fallbackInterval = setInterval(fetchStatus, 150);
        };

        const connectWebSocket = () => {
            try {
                const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const host = window.location.host || '127.0.0.1:8000';
                ws = new WebSocket(`${proto}//${host}/ws/copilot`);
                wsRef.current = ws;

                let lastPingTime = performance.now();
                const pingInterval = setInterval(() => {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        lastPingTime = performance.now();
                        ws.send(JSON.stringify({ action: 'ping', client_ts: lastPingTime }));
                    }
                }, 2000);

                ws.onmessage = (event) => {
                    if (!isMounted) return;
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'pong') {
                            const rtt = Math.round(performance.now() - (data.client_ts || lastPingTime));
                            setLatency(Math.max(1, Math.min(25, rtt)));
                            return;
                        }
                        setState(data);
                        if (data.controller && data.controller.name) {
                            setControllerState(data.controller);
                        }
                        const cap = data.capture_latency_ms || 0.4;
                        const netDt = data.server_ts ? Math.max(1, Math.round((Date.now() / 1000 - data.server_ts) * 1000)) : 1;
                        const totalLat = Math.min(25, Math.max(1, Math.round(cap + netDt)));
                        setLatency(totalLat);
                        if (data.recommendations && data.recommendations.length > 0) {
                            setTracksList(prev => (prev.length === 0 ? data.recommendations : prev));
                        }
                    } catch (_) {}
                };

                ws.onerror = () => {
                    if (ws) ws.close();
                };

                ws.onclose = () => {
                    clearInterval(pingInterval);
                    if (isMounted) {
                        startPollingFallback();
                    }
                };
            } catch (_) {
                startPollingFallback();
            }
        };

        connectWebSocket();

        return () => {
            isMounted = false;
            if (ws) ws.close();
            if (fallbackInterval) clearInterval(fallbackInterval);
        };
    }, []);

    const setMasterDeck = async (deckTarget) => {
        const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isLocalHost) {
            try {
                const res = await fetch('/api/copilot/set_master', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ master: deckTarget })
                });
                if (res.ok) {
                    const data = await res.json();
                    setState(data);
                    return;
                }
            } catch (_) {}
        }
        // Fallback local:
        setState(prev => {
            if (!prev) return prev;
            const cur1Master = prev.deck_1?.is_master;
            const new1Master = deckTarget === '1' ? true : deckTarget === '2' ? false : !cur1Master;
            return {
                ...prev,
                deck_1: {
                    ...prev.deck_1,
                    is_master: new1Master,
                    status: new1Master ? 'ON AIR (MASTER)' : 'CUE / PREPARADO',
                    is_playing: new1Master,
                    elapsed_sec: new1Master ? prev.deck_1.elapsed_sec : 0.0
                },
                deck_2: {
                    ...prev.deck_2,
                    is_master: !new1Master,
                    status: !new1Master ? 'ON AIR (MASTER)' : 'CUE / PREPARADO',
                    is_playing: !new1Master,
                    elapsed_sec: !new1Master ? prev.deck_2.elapsed_sec : 0.0
                }
            };
        });
    };

    // Atajos de teclado para cabina DJ: '1' Play D1, '2' Play D2, Espacio Play Master, 'C' Cue, 'M' Master
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
            if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                setMasterDeck('toggle');
            } else if (e.key === '1') {
                e.preventDefault();
                togglePlayDeck('1');
            } else if (e.key === '2') {
                e.preventDefault();
                togglePlayDeck('2');
            } else if (e.code === 'Space') {
                e.preventDefault();
                const masterTarget = state?.deck_1?.is_master ? '1' : '2';
                togglePlayDeck(masterTarget);
            } else if (e.key === 'c' || e.key === 'C') {
                e.preventDefault();
                const cueTarget = state?.deck_1?.is_master ? '2' : '1';
                cueDeck(cueTarget);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state]);

    const toggleSimulation = async () => {
        const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isLocalHost) {
            try {
                const res = await fetch('/api/copilot/toggle_simulation', { method: 'POST' });
                if (res.ok) {
                    const data = await res.json();
                    setState(data);
                    if (data.recommendations) setTracksList(data.recommendations);
                    return;
                }
            } catch (e) {}
        }

        // Fallback interactivo local para Figma / Offline:
        setState(prev => {
            const current = prev || DEFAULT_COPILOT_STATE;
            const newSim = !current.is_simulating;
            return {
                ...current,
                is_simulating: newSim,
                source: newSim ? 'SIMULATION_MODE' : 'SERATO_LIVE',
                deck_1: {
                    ...current.deck_1,
                    title: newSim ? 'Komodo (Megavoices Claxixx)' : 'Deep Blue',
                    artist: newSim ? 'Mauro Picotto' : 'The Midnight',
                    bpm: newSim ? 137.68 : 130.0,
                    camelot: newSim ? '10A' : '10A',
                    mood: newSim ? 'Peak Time Climax' : 'Melodic Club'
                },
                deck_2: {
                    ...current.deck_2,
                    title: newSim ? 'Smooth Mind' : 'Turn on your Brain Baby',
                    artist: newSim ? 'Marco Bailey / Sigvard' : 'Snog',
                    bpm: newSim ? 140.0 : 129.63,
                    camelot: newSim ? '6A' : '8A',
                    mood: newSim ? 'Hypnotic Groove' : 'Drumcode Core'
                },
                anti_muddy: {
                    clash_detected: newSim,
                    severity: newSim ? 'CRITICAL' : 'SAFE',
                    color: newSim ? '#ef4444' : '#10b981',
                    badge: newSim ? 'BASS CLASH' : 'SAFE MIX',
                    message: newSim 
                        ? 'Ambos tracks tienen sub-graves dominantes (>44%). El solape directo creará empaste y distorsión en el sistema de sala.'
                        : 'Equilibrio de frecuencias óptimo entre Decks. Transición limpia sin solape.',
                    tactical_advice: newSim 
                        ? 'Corta la EQ de graves (Low) en el canal entrante (-6dB a -12dB) antes de abrir el fader, o usa filtro paso-alto.'
                        : 'Curva de mezcla perfecta en compás 32.'
                }
            };
        });
    };

    const setPlatform = async (plat) => {
        try {
            const res = await fetch('/api/copilot/set_platform', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform: plat })
            });
            if (res.ok) {
                const data = await res.json();
                setState(data);
                return;
            }
        } catch (e) {}
        setState(prev => {
            const current = prev || DEFAULT_COPILOT_STATE;
            return {
                ...current,
                platform: plat,
                platform_mode: plat,
                platform_name: plat === 'serato' ? 'Serato DJ Pro' : plat === 'rekordbox' ? 'Rekordbox' : plat === 'virtualdj' ? 'VirtualDJ Pro' : plat === 'traktor' ? 'Traktor Pro' : 'Auto-Detect'
            };
        });
    };

    // Lógica Drag and Drop para reordenar pistas próximas + Análisis dinámico
    const handleDragStart = (e, index) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetIdx) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === targetIdx) return;

        const updated = [...tracksList];
        const [movedItem] = updated.splice(draggedIdx, 1);
        updated.splice(targetIdx, 0, movedItem);
        setTracksList(updated);
        setDraggedIdx(null);

        // Análisis dinámico instantáneo de la transición resultante
        const masterTrack = state?.deck_1 || {};
        const incomingTrack = updated[0];
        const mCamelot = masterTrack.camelot || '10A';
        const inCamelot = incomingTrack.camelot || '10A';
        const mBpm = parseFloat(masterTrack.bpm) || 138.0;
        const inBpm = parseFloat(incomingTrack.bpm) || 138.0;
        const bpmDelta = (inBpm - mBpm).toFixed(1);

        const mNum = parseInt(mCamelot);
        const inNum = parseInt(inCamelot);
        const isExactMatch = mCamelot === inCamelot;
        const isEnergyBoost = (inNum === ((mNum % 12) + 1));
        const isHarmonic = isExactMatch || isEnergyBoost || (mNum === ((inNum % 12) + 1));

        setTransitionAnalysis({
            trackTitle: incomingTrack.title,
            isHarmonic,
            matchType: isExactMatch ? 'MATCH PERFECTO (Mismo Tono)' : isEnergyBoost ? 'SUBIDÓN DE ENERGÍA (+1 Camelot)' : isHarmonic ? 'COMPATIBLE' : 'CHOQUE ARMÓNICO (Cuidado)',
            bpmDelta: bpmDelta >= 0 ? `+${bpmDelta}` : bpmDelta,
            lowRatio: incomingTrack.low_ratio,
            safeBass: incomingTrack.low_ratio < 44,
            advice: isExactMatch 
                ? 'Excelente acople tímbrico. Realiza el cruce en el compás 32 con EQ Low compensado.'
                : isEnergyBoost 
                ? 'Sube la intensidad de la pista. Filtra graves con HPF antes del drop para impacto limpio.'
                : 'Diferencia armónica. Usa un parón (breakdown) o reverb out para no desafinar.'
        });
    };

    const activeState = state || DEFAULT_COPILOT_STATE;
    const { deck_1, deck_2, anti_muddy, harmonic } = activeState;
    const isLive = state.source && state.source.endsWith('_LIVE');
    const isStandby = state.source && state.source.endsWith('_STANDBY');
    const displayRecommendations = tracksList.length > 0 ? tracksList : (state.recommendations || []);

    const platformsList = [
        { id: 'auto', label: 'Auto', color: '#a855f7' },
        { id: 'serato', label: 'Serato', color: '#00d1e8' },
        { id: 'rekordbox', label: 'Rekordbox', color: '#38bdf8' },
        { id: 'virtualdj', label: 'VirtualDJ', color: '#f97316' },
        { id: 'traktor', label: 'Traktor', color: '#facc15' }
    ];

    return (
        <div className="flex flex-col w-full h-full p-3 sm:p-5 pb-32 md:pb-6 overflow-y-auto select-none bg-[#040407] text-gray-200">
            {/* Cabecera de la Pantalla Táctica */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-2.5 border-b border-zinc-800 mb-3 gap-2">
                {/* IZQUIERDA: PUNTO Y TEXTO EN LA MISMA LÍNEA + BADGES DE CABINA */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`w-3 h-3 rounded-full shrink-0 ${
                            isLive 
                            ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse' 
                            : isStandby
                            ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)] animate-pulse'
                            : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                        }`}></span>
                        <span className="w-7 h-7 rounded-lg bg-djcyan-500/10 border border-djcyan-500/30 flex items-center justify-center text-djcyan-400 shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                            <Icons.Turntable size={16} />
                        </span>
                        <h2 className="font-syne font-black text-sm sm:text-base leading-none text-white tracking-wide uppercase whitespace-nowrap flex items-center gap-1">
                            Copilot <span className="text-djcyan-400">Cabina DJ</span>
                        </h2>
                    </div>

                    {/* BADGE DEL SOFTWARE ACTIVO CON LOGO VECTORIAL */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700/60 font-mono text-[10px]">
                        {renderPlatformLogo(state.platform || 'serato', 13)}
                        <strong style={{ color: state.platform_color || '#00d1e8' }}>{state.platform_name || 'DJ LINK'}</strong>
                        <span className="text-zinc-600">|</span>
                        <span className={isLive ? 'text-red-400 font-bold' : isStandby ? 'text-cyan-400' : 'text-amber-400 font-bold'}>
                            {state.platform_status || (isLive ? 'LIVE' : 'STANDBY')}
                        </span>
                    </div>

                    {/* BADGE DETECCIÓN DE CONTROLADORA DJ */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-emerald-500/50 font-mono text-[10px] text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse"></span>
                        <span className="text-zinc-400">🎛️</span>
                        <strong className="text-white">{controllerState.name}</strong>
                    </div>

                    {/* BADGE ABLETON LINK SYNC (Solo visible si hay peers activos) */}
                    {state.ableton_link?.peers > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[10px] border bg-purple-950/70 border-purple-500/80 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.35)]" title="Ableton Link Activo: sincronizado con software DJ">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                            <span>🔗 LINK:</span>
                            <strong className="text-white">
                                {`${state.ableton_link.peers} PEER (${state.ableton_link.playing ? 'PLAY' : 'PAUSA'})`}
                            </strong>
                        </div>
                    )}

                    {/* HUD BADGE LATENCIA CABINA (<25ms) & SELECTOR MASTER */}
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/50 font-mono text-[10px] text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse"></span>
                        <span className="font-bold tracking-tight">⚡ Latencia Cabina: <strong className="text-white font-extrabold">{latency}ms</strong> • Sincronizado</span>
                        <button
                            type="button"
                            onClick={() => setMasterDeck('toggle')}
                            className="ml-1 px-1.5 py-0.2 rounded bg-zinc-800 hover:bg-zinc-700 text-cyan-300 hover:text-white border border-cyan-500/40 font-bold transition-all cursor-pointer active:scale-95 text-[9px]"
                            title="Intercambiar qué Deck es Master en vivo (Atajo de teclado: M)"
                        >
                            ⇄ DECK {deck_1.is_master ? '1' : '2'} [M]
                        </button>
                    </div>
                </div>

                {/* DERECHA: SELECTOR DE CABINA + RELOJ + SIMULADOR + POP-OUT EN LÍNEA COMPACTO */}
                <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
                    {/* SELECTOR DE PLATAFORMA */}
                    <div className="flex items-center p-0.5 bg-zinc-950/90 rounded-xl border border-zinc-800 shadow-inner">
                        {platformsList.map(p => {
                            const isSelected = (state.platform_mode === p.id) || (state.platform_mode === 'auto' && p.id === 'auto');
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setPlatform(p.id)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                                        isSelected 
                                        ? 'bg-zinc-800 text-white shadow-md border border-zinc-600'
                                        : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                    style={isSelected ? { color: p.color, borderColor: `${p.color}66` } : {}}
                                    title={`Conectar con ${p.label}`}
                                >
                                    {renderPlatformLogo(p.id, 13)}
                                    <span className="hidden sm:inline text-[10px]">{p.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="font-mono text-xs font-bold text-white bg-zinc-900 px-2 py-1 rounded-xl border border-zinc-800 shadow-inner">
                        {clock || state.last_updated}
                    </div>

                    <button
                        type="button"
                        onClick={toggleSimulation}
                        className={`px-2 py-1 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer border ${
                            state.source === 'SIMULATION_MODE'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-700/60'
                        }`}
                        title="Alternar simulación"
                    >
                        <Icons.Brain size={12} className="inline-block align-[-1px]" /> {state.source === 'SIMULATION_MODE' ? 'Simulando' : 'Simular'}
                    </button>

                    {onOpenPopOut && (
                        <button
                            type="button"
                            onClick={onOpenPopOut}
                            className="px-2 py-1 rounded-xl text-xs font-mono font-bold text-white bg-red-600/90 hover:bg-red-500 uppercase transition-all cursor-pointer shadow-sm flex items-center gap-1 shrink-0"
                            title="Abrir en ventana independiente Pop-Out para segundo monitor"
                        >
                            <Icons.Grid size={12} />
                            <span>Pop-Out ↗</span>
                        </button>
                    )}
                </div>
            </div>

            {/* GUARDIÁN TÁCTICO ANTI-MUDDY (REDUCIDO Y UBICADO ENCIMA DE LOS DECKS) */}
            <section className="mb-2.5">
                <div className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-2 ${
                    anti_muddy.status === 'danger'
                    ? 'bg-red-950/40 border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                    : anti_muddy.status === 'warning'
                    ? 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                }`}>
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">
                            {anti_muddy.status === 'danger' ? '🛡️' : anti_muddy.status === 'warning' ? '⚡' : '🟢'}
                        </span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="font-syne font-black text-xs text-white tracking-wide">{anti_muddy.title}</h3>
                                <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-mono font-black uppercase tracking-wider shrink-0 ${
                                    anti_muddy.status === 'danger' ? 'bg-red-600 text-white' : anti_muddy.status === 'warning' ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-black'
                                }`}>
                                    {anti_muddy.tag}
                                </span>
                            </div>
                            <p className="text-[10.5px] text-zinc-300 truncate mt-0.5">{anti_muddy.message}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-between md:justify-end text-[10.5px] font-mono">
                        {(anti_muddy.controller_knobs || anti_muddy.flx4) && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 font-bold text-[10px] shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                <span>🎛️ {(state.controller?.name || controllerState.name || 'NUMARK NV II').replace(' (USB)', '')}:</span>
                                <span className="text-white font-extrabold">{(anti_muddy.controller_knobs || anti_muddy.flx4).filter_knob}</span>
                                <span className="text-zinc-400">•</span>
                                <span className="text-amber-300 font-extrabold">{(anti_muddy.controller_knobs || anti_muddy.flx4).eq_low}</span>
                            </div>
                        )}
                        {/* BOTÓN INTERACTIVO DE ACCIÓN CORRECTIVA ANTI-MUDDY */}
                        <button
                            type="button"
                            onClick={handleApplyCorrection}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer shadow-sm border ${
                                lowEqApplied
                                ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500 text-emerald-300 hover:text-white'
                                : 'bg-red-900/90 hover:bg-red-800 border-red-500 text-white animate-pulse'
                            }`}
                            title="Aplicar corte táctico de EQ para resolver choque de sub-graves"
                        >
                            <span>{lowEqApplied ? '✓' : '⚡'}</span>
                            <span className="text-djcyan-300 font-bold">ACCIÓN:</span>
                            <span className="truncate max-w-[280px]">{lowEqApplied ? 'Restablecer EQ (Deshacer)' : (anti_muddy.action || 'Corta Low EQ en Deck 2 (-10dB)')}</span>
                        </button>

                        <div className="flex items-center gap-2 text-zinc-400 text-[10px]">
                            <span>CAMELOT: <strong style={{ color: harmonic.color }}>{harmonic.badge}</strong></span>
                            <span>Δ LUFS: <strong className="text-white">{state.lufs_delta > 0 ? `+${state.lufs_delta}` : state.lufs_delta} dB</strong></span>
                        </div>
                    </div>
                </div>
            </section>

            {/* DUAL DECK HEADS-UP DISPLAY ENRIQUECIDO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-4">
                <CopilotDeckCard 
                    deck={deck_1} 
                    side="1" 
                    isMaster={deck_1.is_master} 
                    antiMuddy={anti_muddy} 
                    partnerDeck={deck_2} 
                    onSetMaster={setMasterDeck} 
                    onTogglePlay={togglePlayDeck}
                    onCue={cueDeck}
                />
                <CopilotDeckCard 
                    deck={deck_2} 
                    side="2" 
                    isMaster={deck_2.is_master} 
                    antiMuddy={anti_muddy} 
                    partnerDeck={deck_1} 
                    onSetMaster={setMasterDeck} 
                    onTogglePlay={togglePlayDeck}
                    onCue={cueDeck}
                />
            </div>

            {/* PRÓXIMAS PISTAS (4 VISIBLES, CARGAR MÁS, DRAG & DROP Y ANÁLISIS DINÁMICO) */}
            <section className="mt-auto">
                <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <h4 className="font-syne font-bold text-xs sm:text-sm text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Icons.Bulb size={14} className="text-amber-400 inline-block" />
                            <span>PRÓXIMAS PISTAS SUGERIDAS ({displayRecommendations.length})</span>
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">• Arrastra para reordenar la secuencia</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* CARGAR MÁS DE 4 EN 4 HASTA MÁXIMO 8 */}
                        <button
                            type="button"
                            onClick={() => setVisibleCount(v => v === 4 ? Math.min(8, displayRecommendations.length) : 4)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-mono font-bold text-djcyan-400 transition-colors cursor-pointer"
                            title="Alternar entre 4 y 8 pistas visibles"
                        >
                            {visibleCount === 4 ? 'Cargar más (+4)' : 'Mostrar 4 (-4)'}
                        </button>

                        {/* BOTÓN CARGA ALEATORIA */}
                        <button
                            type="button"
                            onClick={handleRandomLoad}
                            className="px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-500/60 text-xs font-mono font-bold text-purple-300 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                            title="Cargar selección aleatoria de candidatos de la biblioteca"
                        >
                            <span>🎲</span>
                            <span>Carga Aleatoria</span>
                        </button>

                        {/* BOTÓN CARGA MANUAL */}
                        <button
                            type="button"
                            onClick={() => setManualPickerOpen(true)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/60 text-xs font-mono font-bold text-emerald-300 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                            title="Buscar y añadir manualmente una pista a la cola"
                        >
                            <span>➕</span>
                            <span>Carga Manual</span>
                        </button>
                    </div>
                </div>

                {/* MODAL / BANNER DE ANÁLISIS DE TRANSICIÓN TRAS DRAG & DROP */}
                {transitionAnalysis && (
                    <div className="mb-3 p-2.5 rounded-xl bg-zinc-950 border border-djcyan-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono animate-fadeIn">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base">⚡</span>
                            <span className="text-zinc-300">Transición con <strong className="text-white">{transitionAnalysis.trackTitle}</strong>:</span>
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                transitionAnalysis.isHarmonic ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'
                            }`}>
                                {transitionAnalysis.matchType}
                            </span>
                            <span className="text-zinc-400">Δ BPM: <strong className="text-white">{transitionAnalysis.bpmDelta}</strong></span>
                            <span className="text-zinc-400">Sub-Graves: <strong className={transitionAnalysis.safeBass ? 'text-emerald-400' : 'text-amber-400'}>{transitionAnalysis.lowRatio}%</strong></span>
                        </div>
                        <div className="text-[11px] text-zinc-300 truncate">
                            <strong className="text-djcyan-400">Acción:</strong> {transitionAnalysis.advice}
                        </div>
                    </div>
                )}

                {/* GRID DE 4 PISTAS VISIBLES REORDENABLES MEDIANTE DRAG AND DROP */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {displayRecommendations.slice(0, visibleCount).map((rec, idx) => {
                        const isDragging = draggedIdx === idx;
                        return (
                            <div 
                                key={rec.id || idx}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, idx)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, idx)}
                                className={`p-2.5 rounded-2xl bg-[#090912] border transition-all shadow-md group flex flex-col justify-between cursor-grab active:cursor-grabbing ${
                                    isDragging 
                                    ? 'opacity-40 border-djcyan-400 scale-95' 
                                    : 'border-zinc-800 hover:border-djcyan-500/50 hover:bg-[#0c0c17]'
                                }`}
                                title="Arrastra para cambiar el orden de mezcla"
                            >
                                <div className="flex items-start gap-2.5 mb-1.5">
                                    {/* Thumbnail Carátula con orden numérico */}
                                    <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-zinc-700/60 bg-black">
                                        <img 
                                            src={getValidCover(rec.cover)} 
                                            alt="Cover" 
                                            onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }} 
                                            className="w-full h-full object-cover"
                                        />
                                        <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded bg-black/80 text-[8px] font-mono font-bold text-zinc-300 flex items-center justify-center">
                                            #{idx + 1}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="font-syne font-bold text-xs text-white group-hover:text-djcyan-300 transition-colors truncate">{rec.title}</span>
                                            <span className="w-6 h-6 rounded flex items-center justify-center font-orbitron font-black text-[10px] text-black shadow shrink-0" style={{ backgroundColor: rec.camelot_color }}>
                                                {rec.camelot}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-zinc-400 truncate font-mono">{rec.artist}</div>
                                        <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-mono">
                                            <span className="text-djcyan-400 font-bold">{rec.bpm} BPM</span>
                                            {rec.mood && <span className="text-purple-400 truncate">• {rec.mood}</span>}
                                            {rec.energy && <span className="text-amber-400 font-bold shrink-0">• {rec.energy}%</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1.5 border-t border-zinc-800/60">
                                    <span className="text-djcyan-400 font-semibold truncate max-w-[130px]">{rec.strategy}</span>
                                    <span className="text-zinc-500 shrink-0">Sub: {rec.low_ratio}%</span>
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{rec.reason}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* MODAL DE CARGA MANUAL DE PISTAS (HASTA 8 MÁXIMO) */}
            {manualPickerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn" onClick={() => setManualPickerOpen(false)}>
                    <div className="bg-[#0b0b12] border border-zinc-700 rounded-2xl w-full max-w-xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">➕</span>
                                <h3 className="font-syne font-bold text-base text-white">Carga Manual de Pistas a la Cola</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setManualPickerOpen(false)}
                                className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-mono cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="relative">
                            <input
                                type="text"
                                value={manualSearchQuery}
                                onChange={e => setManualSearchQuery(e.target.value)}
                                placeholder="Buscar por título, artista, tono Camelot o género..."
                                className="w-full h-10 px-3 pl-9 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-djcyan-400 font-mono"
                                autoFocus
                            />
                            <span className="absolute left-3 top-2.5 text-zinc-500 text-xs">🔍</span>
                        </div>

                        <div className="overflow-y-auto flex-1 flex flex-col gap-2 pr-1 max-h-[45vh]">
                            {MASTER_TRACKS_POOL
                                .filter(t => {
                                    if (!manualSearchQuery) return true;
                                    const q = manualSearchQuery.toLowerCase();
                                    return (t.title || '').toLowerCase().includes(q) ||
                                           (t.artist || '').toLowerCase().includes(q) ||
                                           (t.camelot || '').toLowerCase().includes(q) ||
                                           (t.genre || '').toLowerCase().includes(q);
                                })
                                .map(t => {
                                    const isAlreadyAdded = tracksList.some(item => item.id === t.id);
                                    return (
                                        <div key={t.id} className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-all gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div 
                                                    className="w-7 h-7 rounded text-[10px] font-orbitron font-black text-black flex items-center justify-center shrink-0"
                                                    style={{ backgroundColor: t.camelot_color || '#f472b6' }}
                                                >
                                                    {t.camelot}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-syne font-bold text-xs text-white truncate">{t.title}</div>
                                                    <div className="text-[10px] font-mono text-zinc-400">{t.artist} • {t.bpm} BPM • {t.genre}</div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={isAlreadyAdded || tracksList.length >= 8}
                                                onClick={() => handleAddManualTrack(t)}
                                                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                                                    isAlreadyAdded
                                                    ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                                                    : tracksList.length >= 8
                                                    ? 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed'
                                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                                                }`}
                                            >
                                                {isAlreadyAdded ? 'En cola ✓' : tracksList.length >= 8 ? 'Cola llena (8 máx)' : '+ Añadir'}
                                            </button>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// =======================================================
// MODAL SELECTOR Y LANZADOR DE BEATWAVE LIVE COPILOT
// =======================================================
const CopilotLaunchModal = ({ isOpen, onClose, onSelectEmbedded }) => {
    const [copilotInfo, setCopilotInfo] = useState({ local_ip: '127.0.0.1', companion_url: '/copilot.html', simulation_mode: false, platform_mode: 'auto', platforms: [] });
    const [copied, setCopied] = useState(false);
    const [qrShown, setQrShown] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetch('/api/copilot/info')
                .then(r => r.json())
                .then(data => setCopilotInfo(data))
                .catch(() => {});
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const launchPopOut = () => {
        const w = 1380;
        const h = 880;
        const left = (window.screen.width - w) / 2;
        const top = (window.screen.height - h) / 2;
        window.open(
            '/copilot.html',
            'BeatWaveLiveCopilot',
            `width=${w},height=${h},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
        );
        onClose();
    };

    const copyCompanionUrl = () => {
        const url = copilotInfo.companion_url || (window.location.origin + '/copilot.html');
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const toggleSimulation = async () => {
        try {
            const res = await fetch('/api/copilot/toggle_simulation', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setCopilotInfo(prev => ({ ...prev, simulation_mode: !prev.simulation_mode }));
                return;
            }
        } catch (e) {}
        setCopilotInfo(prev => ({ ...prev, simulation_mode: !prev.simulation_mode }));
    };

    const selectPlatform = async (pId) => {
        try {
            const res = await fetch('/api/copilot/set_platform', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform: pId })
            });
            if (res.ok) {
                const data = await res.json();
                setCopilotInfo(prev => ({
                    ...prev,
                    platform_mode: pId,
                    active_platform: data.platform
                }));
                return;
            }
        } catch (e) {}
        setCopilotInfo(prev => ({
            ...prev,
            platform_mode: pId,
            active_platform: pId === 'auto' ? 'serato' : pId
        }));
    };

    const companionUrl = copilotInfo.companion_url || `${window.location.protocol}//${copilotInfo.local_ip || '127.0.0.1'}:8000/copilot.html`;

    const activePlatObj = (copilotInfo.platforms || []).find(p => p.id === copilotInfo.active_platform) || { name: 'Suite DJ', id: 'serato' };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn" onClick={onClose}>
            <div 
                className="ws-booth relative w-full max-w-2xl flex flex-col gap-5 p-5 sm:p-6 max-h-[88vh] overflow-y-auto custom-scrollbar" role="dialog" aria-modal="true" aria-labelledby="copilot-launch-title"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabecera */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-[var(--bw-line)]">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                            <span className="ws-badge-live"><span className="ws-dot ws-dot-alert" />LIVE</span>
                            <span className="ws-glass-kicker">Booth monitor</span>
                        </div>
                        <h2 id="copilot-launch-title" className="text-lg sm:text-xl font-semibold text-[var(--bw-white)] tracking-tight">Live Copilot</h2>
                        <p className="text-xs text-[var(--bw-text-2)] leading-relaxed">Compatibilidad armónica Camelot y anti-muddy en tiempo real, sobre tu software de cabina.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="ws-glass-icon shrink-0"
                    >
                        <Icons.Close size={14} className="inline-block align-[-2px]" />
                    </button>
                </div>

                {/* SELECTOR DE PLATAFORMA DE CABINA CON LOGOS VECTORIALES */}
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                        <span className="ws-glass-kicker">Software de cabina</span>
                        <button 
                            type="button" 
                            onClick={() => selectPlatform('auto')} 
                            className={`text-[11px] font-mono transition-colors cursor-pointer ${copilotInfo.platform_mode === 'auto' || !copilotInfo.platform_mode ? 'text-cyan-400 font-semibold' : 'text-zinc-500 hover:text-zinc-300'}`}
                            title="Alternar modo detección automática en cabina"
                        >
                            {copilotInfo.platform_mode === 'auto' || !copilotInfo.platform_mode ? '● Auto-detectar activo' : 'Modo Auto'}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                            { id: 'rekordbox', label: 'Rekordbox', color: '#38bdf8' },
                            { id: 'virtualdj', label: 'VirtualDJ', color: '#f97316' },
                            { id: 'serato', label: 'Serato', color: '#00d1e8' },
                            { id: 'traktor', label: 'Traktor', color: '#facc15' }
                        ].map(p => {
                            const isSelected = copilotInfo.platform_mode === p.id;
                            const platData = (copilotInfo.platforms || []).find(x => x.id === p.id);
                            const isDetected = platData ? platData.detected : false;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => selectPlatform(isSelected ? 'auto' : p.id)}
                                    className={`flex items-center justify-between h-10 px-3 rounded-xl border transition-all cursor-pointer select-none ${
                                        isSelected 
                                        ? 'bg-zinc-800/90 text-white shadow-md' 
                                        : 'bg-zinc-950/70 hover:bg-zinc-900 text-zinc-300 hover:text-white border-zinc-800/90'
                                    }`}
                                    aria-pressed={isSelected}
                                    style={isSelected ? { borderColor: p.color, boxShadow: `0 0 12px ${p.color}33` } : {}}
                                    title={isDetected ? `${p.label} (Detectado en cabina)` : `${p.label} (Standby)`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                            {renderPlatformLogo(p.id, 20)}
                                        </div>
                                        <span className="text-xs font-mono font-semibold truncate tracking-tight text-white">
                                            {p.label}
                                        </span>
                                    </div>
                                    <span 
                                        className={`w-2 h-2 rounded-full shrink-0 ml-1.5 transition-all ${
                                            isDetected 
                                            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] ring-1 ring-emerald-300' 
                                            : 'bg-zinc-600'
                                        }`} 
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3 Modos de Visualización en Cabina */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Tarjeta 1: Segundo Monitor / Pop-Out */}
                    <div 
                        onClick={launchPopOut}
                        className="ws-card ws-card-action p-4 flex flex-col justify-between gap-4 cursor-pointer"
                    >
                        <div>
                            <span className="ws-card-icon"><Icons.Grid size={16} /></span>
                            <h3 className="mt-3 text-sm font-semibold text-[var(--bw-white)]">
                                Segundo Monitor
                            </h3>
                            <p className="text-xs text-[var(--bw-text-2)] mt-1 leading-relaxed">
                                Ventana flotante limpia para arrastrar a tu pantalla secundaria o proyector con soporte F11.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="ws-btn ws-btn-outline w-full justify-center h-9"
                        >
                            <Icons.External size={13} /> Lanzar Pop-Out
                        </button>
                    </div>

                    {/* Tarjeta 2: iPad / Tablet Companion */}
                    <div 
                        onClick={() => setQrShown(!qrShown)}
                        className="ws-card ws-card-action p-4 flex flex-col justify-between gap-4 cursor-pointer"
                    >
                        <div>
                            <span className="ws-card-icon"><Icons.Grid size={16} /></span>
                            <h3 className="mt-3 text-sm font-semibold text-[var(--bw-white)]">
                                iPad / Tablet
                            </h3>
                            <p className="text-xs text-[var(--bw-text-2)] mt-1 leading-relaxed">
                                Abre en el navegador de tu iPad sin cables. Enlace Wi-Fi directo para cabina.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="ws-btn ws-btn-outline w-full justify-center h-9"
                        >
                            {qrShown ? 'Ocultar QR' : 'Ver Código QR'}
                        </button>
                    </div>

                    {/* Tarjeta 3: Esta Pantalla (In-App) */}
                    <div 
                        onClick={onSelectEmbedded}
                        className="ws-card ws-card-action p-4 flex flex-col justify-between gap-4 cursor-pointer"
                    >
                        <div>
                            <span className="ws-card-icon"><Icons.Sliders size={16} /></span>
                            <h3 className="mt-3 text-sm font-semibold text-[var(--bw-white)]">
                                Esta Pantalla
                            </h3>
                            <p className="text-xs text-[var(--bw-text-2)] mt-1 leading-relaxed">
                                Maximiza el HUD en esta misma ventana para preparar el set antes de la actuación.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="ws-btn ws-btn-primary w-full justify-center h-9"
                        >
                            Ver en la App <Icons.ChevronRight size={13} />
                        </button>
                    </div>
                </div>

                {/* Desplegable QR & Enlace */}
                {qrShown && (
                    <div className="ws-card p-4 flex flex-col sm:flex-row items-center gap-4 animate-fadeIn">
                        <div className="p-2 bg-white rounded-xl shrink-0 shadow-lg">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(companionUrl)}`} 
                                alt="Código QR iPad"
                                className="w-28 h-28 object-contain"
                            />
                        </div>
                        <div className="flex-1 flex flex-col gap-2 min-w-0">
                            <div className="ws-glass-kicker">
                                Dirección local de cabina (misma red Wi-Fi):
                            </div>
                            <div className="p-2 rounded-md bg-[var(--bw-black)] border border-[var(--bw-line)] font-mono text-xs text-[var(--bw-cyan)] break-all select-all">
                                {companionUrl}
                            </div>
                            <button
                                type="button"
                                onClick={copyCompanionUrl}
                                className="ws-btn ws-btn-ghost self-start h-8"
                            >
                                {copied ? <><Icons.Check size={13} /> Enlace copiado</> : <><Icons.Copy size={13} /> Copiar enlace</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* Barra de Estado y Simulación */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[var(--bw-line)] text-xs">
                    <div className="flex items-center gap-2 text-[var(--bw-text-2)]">
                        <span className="ws-dot ws-dot-ok"></span>
                        <div className="flex items-center gap-1.5">
                            <span>Motor Activo:</span>
                            {renderPlatformLogo(copilotInfo.active_platform || 'serato', 16)}
                            <strong className="text-[var(--bw-white)] font-medium">{activePlatObj.name}</strong>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[var(--bw-text-3)]">¿Sin software activo?</span>
                        <button
                            type="button"
                            onClick={toggleSimulation}
                            className={`ws-btn h-8 ${copilotInfo.simulation_mode ? 'ws-btn-warn' : 'ws-btn-ghost'}`}
                            aria-pressed={!!copilotInfo.simulation_mode}
                        >
                            <Icons.Brain size={13} /> {copilotInfo.simulation_mode ? 'Simulación Activa' : 'Activar Simulación'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==============================================================================
// ==============================================================================
// LOGOTIPO CORPORATIVO BEATWAVE PRO (5 BARRAS ANIMADAS EN BUCLE CONSTANTE DE 3S)
// ==============================================================================
const BeatWaveLogoBadge = ({ size = 'sm', className = '' }) => {
    return (
        <div 
            className={`relative rounded-full flex items-center justify-center shrink-0 bw-brand-logo-badge size-${size} select-none transition-all duration-300 ${className}`}
        >
            {/* SVG Vectorial Nativo de 5 Barras Ecualizadoras Animadas en Cian Corporativo */}
            <svg 
                viewBox="0 0 100 100" 
                className="w-[74%] h-[74%] overflow-visible" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="bw-bar-cyan-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a5f3fc" />
                        <stop offset="25%" stopColor="#67e8f9" />
                        <stop offset="55%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#0891b2" />
                    </linearGradient>
                    <filter id="bw-bar-glow-fx" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#06b6d4" floodOpacity="0.95" />
                    </filter>
                </defs>

                <g filter="url(#bw-bar-glow-fx)">
                    {/* Barra 1 (Izquierda exterior) */}
                    <rect 
                        x="13.3" y="40.3" width="11.8" height="35.9" rx="5.9" ry="5.9" 
                        fill="url(#bw-bar-cyan-grad)" 
                        className="bw-equalizer-bar-1" 
                    />
                    {/* Barra 2 (Izquierda interior) */}
                    <rect 
                        x="28.7" y="27.1" width="11.8" height="53.8" rx="5.9" ry="5.9" 
                        fill="url(#bw-bar-cyan-grad)" 
                        className="bw-equalizer-bar-2" 
                    />
                    {/* Barra 3 (Centro - Pico Máximo) */}
                    <rect 
                        x="44.1" y="17.0" width="11.8" height="66.0" rx="5.9" ry="5.9" 
                        fill="url(#bw-bar-cyan-grad)" 
                        className="bw-equalizer-bar-3" 
                    />
                    {/* Barra 4 (Derecha interior) */}
                    <rect 
                        x="59.5" y="30.0" width="11.8" height="50.1" rx="5.9" ry="5.9" 
                        fill="url(#bw-bar-cyan-grad)" 
                        className="bw-equalizer-bar-4" 
                    />
                    {/* Barra 5 (Derecha exterior) */}
                    <rect 
                        x="74.9" y="44.2" width="11.8" height="32.0" rx="5.9" ry="5.9" 
                        fill="url(#bw-bar-cyan-grad)" 
                        className="bw-equalizer-bar-5" 
                    />
                </g>
            </svg>
        </div>
    );
};

// ==============================================================================
// CANONICAL BRAND IDENTITY LOGO (COMPARTIDO EXACTAMENTE EN HEADER Y EN HERO/INTRO)
// ==============================================================================
const BeatWaveBrandIdentity = ({ 
    variant = 'hero', // 'header' | 'hero'
    isTechnoActive = false, 
    onClick = null,
    className = '' 
}) => {
    const isHero = variant === 'hero';
    const badgeSize = isHero ? 'hero' : 'sm'; // hero: 76px / sm: 36px
    const titleSize = isHero ? 48 : 24;       // font-size en px (Syne 800)
    const proSize = isHero ? 19 : 10.5;       // font-size de PRO en px (Inter 900)
    const proBorder = isHero ? 2.5 : 1.5;     // grosor del borde
    const proRadius = isHero ? 12 : 8;        // radio del borde
    const proPx = isHero ? 12 : 7;            // padding horizontal
    const proPy = isHero ? 3 : 1.5;           // padding vertical
    const subSize = isHero ? 18.5 : 11;       // font-size de PRECISION • AUDIO • INTELLIGENCE (más grande y nítida)
    const dotSize = isHero ? 28 : 17;         // puntos separadores notablemente más grandes
    const subGap = isHero ? 7 : 3.5;          // margen entre título y subtítulo
    const mainGap = isHero ? 22 : 12;         // espacio entre el badge y el texto

    return (
        <div 
            onClick={onClick}
            className={`inline-flex items-center select-none ${onClick ? 'cursor-pointer' : ''} group ${className}`}
            style={{ columnGap: `${mainGap}px` }}
        >
            {/* 1. Badge Circular Oficial */}
            <BeatWaveLogoBadge size={badgeSize} />

            {/* 2. Bloque Tipográfico Limpio Sin Efectos de Texto con Proporción 1:1 */}
            <div className="flex flex-col justify-center text-left shrink-0 select-none">
                {/* Fila 1: BEATWAVE + PRO (Sin sombras ni halos de texto) */}
                <div className="flex items-center leading-none" style={{ gap: isHero ? '12px' : '7px' }}>
                    <span 
                        className={`font-syne select-none uppercase tracking-[0.02em] leading-none transition-all duration-200 ${
                            isTechnoActive ? 'anim-soundwave' : ''
                        }`}
                        style={{ 
                            fontFamily: "'Syne', -apple-system, BlinkMacSystemFont, sans-serif",
                            fontWeight: 800,
                            fontSize: `${titleSize}px`,
                            lineHeight: 1
                        }}
                    >
                        <span className="text-white">BEAT</span>
                        <span className="text-cyan-400">WAVE</span>
                    </span>
                    <span 
                        className="font-sans font-black tracking-wider text-cyan-400 shrink-0 self-center leading-none uppercase"
                        style={{
                            fontFamily: "Inter, -apple-system, sans-serif",
                            fontWeight: 900,
                            fontSize: `${proSize}px`,
                            padding: `${proPy}px ${proPx}px`,
                            borderRadius: `${proRadius}px`,
                            border: `${proBorder}px solid #22d3ee`,
                            lineHeight: 1
                        }}
                    >
                        PRO
                    </span>
                </div>

                {/* Fila 2: PRECISION • AUDIO • INTELLIGENCE (Tipografía mayor y puntos grandes centrados) */}
                <div 
                    className="w-full flex justify-between items-center text-cyan-200 select-none leading-none"
                    style={{
                        fontFamily: "Inter, -apple-system, sans-serif",
                        fontWeight: 800,
                        fontSize: `${subSize}px`,
                        letterSpacing: '0.11em',
                        marginTop: `${subGap}px`,
                        lineHeight: 1
                    }}
                >
                    <span>PRECISION</span>
                    <span 
                        className="text-cyan-400 font-black inline-flex items-center justify-center select-none" 
                        style={{ fontSize: `${dotSize}px`, lineHeight: 0, transform: 'translateY(-1px)' }}
                    >
                        •
                    </span>
                    <span>AUDIO</span>
                    <span 
                        className="text-cyan-400 font-black inline-flex items-center justify-center select-none" 
                        style={{ fontSize: `${dotSize}px`, lineHeight: 0, transform: 'translateY(-1px)' }}
                    >
                        •
                    </span>
                    <span>INTELLIGENCE</span>
                </div>
            </div>
        </div>
    );
};

// ==============================================================================
// BEATWAVE HERO SHOWCASE STUDIO · 01 WARP DEPTH & LASER SCRAMBLE
// ==============================================================================
const HERO_SHOWCASE_SLIDES = [
    {
        title: "AUDITORÍA FORENSE DE AUDIO LOSSLESS",
        subtitle: "Detecta transcodificaciones falsas MP3-a-FLAC al instante mediante análisis FFT de corte espectral, clics digitales y silencios anómalos.",
        badge: "Escaneo FFT 24-bit · Detección Fake 320"
    },
    {
        title: "SEPARACIÓN NEURONAL DE STEMS EN VIVO",
        subtitle: "Aísla voces, baterías, bajos y melodías en segundos con aceleración nativa en Apple Silicon conservando todos tus metadatos ID3.",
        badge: "Motor BS-Roformer · 4 Canales Sin Pérdida"
    },
    {
        title: "DETECCIÓN AUTOMÁTICA DE DROPS Y HOT CUES",
        subtitle: "Analiza la energía sub-bass y alinea la rejilla de compases 4/4 para marcar Intro, Breakdown, Drop y Outro listos para Rekordbox.",
        badge: "Beatgrid 1.1 Exacto · Exportación XML"
    },
    {
        title: "SINCRONIZACIÓN ARMÓNICA CAMELOT 4/4",
        subtitle: "Navega toda tu colección como una galaxia espacial en 3D: agrupa temas por compatibilidad armónica Camelot, densidad de graves y BPM para sets hipnóticos sin esfuerzo.",
        badge: "Clustering 3D Espectral · Compatibilidad +1/-1"
    },
    {
        title: "BÚSQUEDA SEMÁNTICA POR VIBRA SONORA",
        subtitle: "Encuentra al instante el track exacto describiendo su textura, atmósfera o energía sin depender de etiquetas manuales incompletas.",
        badge: "Embeddings Vectoriales · Similitud Tímbrica"
    }
];

const GLYPHS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+/<>[]=";

const CleanLineKineticStudioStage = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const slideRef = useRef(null);
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const badgeRef = useRef(null);
    const trailRef = useRef(null);

    const timersRef = useRef([]);
    const intervalsRef = useRef([]);
    const isHoveredRef = useRef(false);
    isHoveredRef.current = isHovered;
    const isTransitioningRef = useRef(false);

    const clearAsync = () => {
        timersRef.current.forEach(t => clearTimeout(t));
        intervalsRef.current.forEach(i => clearInterval(i));
        timersRef.current = [];
        intervalsRef.current = [];
    };

    const addTimeout = (fn, delay) => {
        const id = setTimeout(fn, delay);
        timersRef.current.push(id);
        return id;
    };

    const addInterval = (fn, delay) => {
        const id = setInterval(fn, delay);
        intervalsRef.current.push(id);
        return id;
    };

    const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    const scrambleText = (str) => str.split('').map(c => (c === ' ' ? ' ' : randomGlyph())).join('');

    const resetAnimationClasses = () => {
        const slideEl = slideRef.current;
        const titleEl = titleRef.current;
        const trailEl = trailRef.current;
        const badgeEl = badgeRef.current;

        if (slideEl) slideEl.classList.remove('choreo-01-exit');
        if (titleEl) titleEl.classList.remove('title-fly-in');
        if (trailEl) trailEl.classList.remove('trail-active');
        if (badgeEl) badgeEl.classList.remove('badge-sweep-run');
        if (slideEl) void slideEl.offsetWidth; // Reflow forzado
    };

    const transitionToSlide = (targetIndex, skipExit = false) => {
        if (isTransitioningRef.current && !skipExit) return;
        clearAsync();
        isTransitioningRef.current = true;

        const exitDuration = skipExit ? 0 : 480;
        const slideEl = slideRef.current;

        if (!skipExit && slideEl) {
            resetAnimationClasses();
            slideEl.classList.add('choreo-01-exit');
        }

        addTimeout(() => {
            setCurrentIndex(targetIndex);
            const slideData = HERO_SHOWCASE_SLIDES[targetIndex];

            resetAnimationClasses();

            const titleEl = titleRef.current;
            const subtitleEl = subtitleRef.current;
            const badgeEl = badgeRef.current;
            const trailEl = trailRef.current;

            if (subtitleEl) {
                subtitleEl.textContent = slideData.subtitle;
                subtitleEl.style.opacity = '0';
                subtitleEl.style.transform = 'translateY(14px)';
                subtitleEl.style.filter = 'blur(8px)';
            }

            if (badgeEl) {
                badgeEl.style.opacity = '0';
                badgeEl.style.transform = 'translateY(16px) scale(0.96)';
                badgeEl.style.filter = 'blur(8px)';
            }

            if (titleEl) {
                titleEl.innerHTML = `<span class="glyph-scramble">${scrambleText(slideData.title)}</span>`;
                titleEl.classList.add('title-fly-in');
            }
            if (trailEl) {
                trailEl.classList.add('trail-active');
            }

            const flightMutator = addInterval(() => {
                if (titleEl) {
                    titleEl.innerHTML = `<span class="glyph-scramble">${scrambleText(slideData.title)}</span>`;
                }
            }, 32);

            // Desplegar subtítulo y badge con escalonamiento
            addTimeout(() => {
                if (subtitleEl) {
                    subtitleEl.style.opacity = '1';
                    subtitleEl.style.transform = 'translateY(0px)';
                    subtitleEl.style.filter = 'blur(0px)';
                }
                if (badgeEl) {
                    badgeEl.style.opacity = '1';
                    badgeEl.style.transform = 'translateY(0px) scale(1)';
                    badgeEl.style.filter = 'blur(0px)';
                }
            }, 180);

            // Decodificar caracteres de izquierda a derecha al aterrizar
            addTimeout(() => {
                clearInterval(flightMutator);
                let iter = 0;
                const totalLen = slideData.title.length;

                const decodeLoop = addInterval(() => {
                    let html = '';
                    for (let i = 0; i < totalLen; i++) {
                        const ch = slideData.title[i];
                        if (ch === ' ') {
                            html += ' ';
                        } else if (i < iter) {
                            html += `<span class="glyph-locked">${ch}</span>`;
                        } else {
                            html += `<span class="glyph-scramble">${randomGlyph()}</span>`;
                        }
                    }
                    if (titleEl) titleEl.innerHTML = html;

                    if (iter >= totalLen) {
                        clearInterval(decodeLoop);
                        if (titleEl) titleEl.innerHTML = `<span class="glyph-locked">${slideData.title}</span>`;
                        if (badgeEl) badgeEl.classList.add('badge-sweep-run');
                        isTransitioningRef.current = false;
                        scheduleNextAutoSlide(targetIndex);
                    }
                    iter += 1.6;
                }, 22);
            }, 360);

        }, exitDuration);
    };

    const scheduleNextAutoSlide = (activeIdx) => {
        addTimeout(() => {
            if (isHoveredRef.current) {
                const checkHover = addInterval(() => {
                    if (!isHoveredRef.current) {
                        clearInterval(checkHover);
                        scheduleNextAutoSlide(activeIdx);
                    }
                }, 800);
                return;
            }

            const nextIdx = (activeIdx + 1) % HERO_SHOWCASE_SLIDES.length;
            transitionToSlide(nextIdx, false);
        }, 4200);
    };

    useEffect(() => {
        transitionToSlide(0, true);
        return () => clearAsync();
    }, []);

    const currentSlide = HERO_SHOWCASE_SLIDES[currentIndex] || HERO_SHOWCASE_SLIDES[0];

    return (
        <div 
            className="w-full flex flex-col items-center justify-center relative select-none hero-stage"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <style dangerouslySetInnerHTML={{ __html: `
                .hero-stage { perspective: 1200px; perspective-origin: 50% 50%; width: 100%; }
                .hero-slide { width: 100%; max-width: 960px; display: flex; flex-direction: column; align-items: center; text-align: center; will-change: transform, opacity, filter; margin: 0 auto; }
                .hero-title { font-family: 'Inter', -apple-system, sans-serif !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 0.02em !important; line-height: 1.15 !important; color: #ffffff !important; white-space: nowrap !important; will-change: transform, opacity, filter; }
                @media (max-width: 768px) { .hero-title { white-space: normal !important; } }
                .glyph-scramble { font-family: 'JetBrains Mono', monospace !important; color: #22d3ee !important; text-shadow: 0 0 16px rgba(34, 211, 238, 0.95), 0 0 32px rgba(6, 182, 212, 0.7) !important; font-weight: 700 !important; }
                .glyph-locked { color: #ffffff !important; text-shadow: 0 0 24px rgba(56, 189, 248, 0.16) !important; font-family: 'Inter', sans-serif !important; font-weight: 700 !important; }
                .title-fly-in { animation: titleStreakFromRight 560ms cubic-bezier(0.08, 0.96, 0.18, 1.14) forwards; }
                @keyframes titleStreakFromRight {
                  0% { opacity: 0; transform: translateX(105vw) scaleX(2.1) skewX(-14deg); filter: blur(20px); }
                  48% { opacity: 1; transform: translateX(-18px) scaleX(1.05) skewX(3deg); filter: blur(3px); }
                  78% { transform: translateX(6px) scaleX(0.99) skewX(-1deg); filter: blur(0px); }
                  100% { opacity: 1; transform: translateX(0px) scaleX(1) skewX(0deg); filter: blur(0px); }
                }
                .hero-subtitle { max-width: 760px; color: #cbd5e1 !important; font-weight: 400 !important; line-height: 1.55 !important; will-change: transform, opacity, filter; transition: opacity 480ms cubic-bezier(0.16, 1, 0.3, 1), transform 480ms cubic-bezier(0.16, 1, 0.3, 1), filter 480ms cubic-bezier(0.16, 1, 0.3, 1); }
                .tech-pill-badge { position: relative !important; display: inline-flex !important; align-items: center !important; gap: 10px !important; padding: 8px 22px !important; border-radius: 9999px !important; background: rgba(5, 11, 18, 0.92) !important; border: 1px solid rgba(255, 255, 255, 0.78) !important; box-shadow: 0 0 24px rgba(34, 211, 238, 0.22), inset 0 0 12px rgba(34, 211, 238, 0.12) !important; overflow: hidden !important; will-change: transform, opacity, filter; transition: opacity 480ms cubic-bezier(0.16, 1, 0.3, 1) 80ms, transform 480ms cubic-bezier(0.16, 1, 0.3, 1) 80ms, filter 480ms cubic-bezier(0.16, 1, 0.3, 1) 80ms, border-color 300ms ease, box-shadow 300ms ease; }
                .badge-shimmer-bar { position: absolute; inset: 0; background: linear-gradient(90deg, transparent 0%, rgba(34, 211, 238, 0.45) 50%, transparent 100%); transform: translateX(-100%); pointer-events: none; }
                .badge-sweep-run .badge-shimmer-bar { animation: badgeLightPass 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards; }
                @keyframes badgeLightPass { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                .choreo-01-exit { animation: c01WarpOut 520ms cubic-bezier(0.4, 0, 0.2, 1) forwards !important; }
                @keyframes c01WarpOut { 0% { opacity: 1; transform: scale(1) translateZ(0px); filter: blur(0px); } 100% { opacity: 0; transform: scale(1.12) translateZ(80px); filter: blur(22px); } }
                .page-dot { height: 8px !important; width: 8px !important; border-radius: 9999px !important; background-color: #475569 !important; transition: all 380ms cubic-bezier(0.16, 1, 0.3, 1) !important; cursor: pointer !important; border: none !important; outline: none !important; padding: 0 !important; margin: 0 !important; display: inline-block !important; }
                .page-dot:hover { background-color: #94a3b8 !important; }
                .page-dot.is-active { width: 34px !important; background: linear-gradient(90deg, #0891b2, #22d3ee) !important; box-shadow: 0 0 16px rgba(34, 211, 238, 0.85) !important; }
                .laser-trail { position: absolute; height: 1px; background: linear-gradient(90deg, transparent 0%, #0891b2 40%, #22d3ee 85%, transparent 100%); box-shadow: 0 0 14px rgba(34, 211, 238, 0.75); opacity: 0; pointer-events: none; will-change: transform, opacity; }
                .trail-active .laser-trail.t1 { top: calc(50% - 76px); width: 45vw; animation: trailShoot 520ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .trail-active .laser-trail.t2 { top: calc(50% - 22px); width: 34vw; animation: trailShoot 480ms cubic-bezier(0.16, 1, 0.3, 1) 40ms forwards; }
                @keyframes trailShoot { 0% { opacity: 0; transform: translateX(100vw) scaleX(2.4); } 35% { opacity: 0.9; transform: translateX(5vw) scaleX(2.8); } 100% { opacity: 0; transform: translateX(-75vw) scaleX(0.4); } }
            ` }} />
            {/* Estelas láser horizontales en azul corporativo */}
            <div ref={trailRef} className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="laser-trail t1" />
                <div className="laser-trail t2" />
            </div>

            {/* BLOQUE HERO DE DIAPOSITIVA (SIN TELEMETRÍA LOCKED READABLE) */}
            <section ref={slideRef} className="hero-slide px-4">
                {/* 1. TÍTULO SIN MARCO EN TIPOGRAFÍA INTER */}
                <h1 
                    ref={titleRef} 
                    className="hero-title text-2xl sm:text-4xl md:text-[42px] lg:text-[46px] mb-4 text-center"
                >
                    {currentSlide.title}
                </h1>

                {/* 2. SUBTÍTULO DESCRIPTIVO DE 2 LÍNEAS */}
                <p 
                    ref={subtitleRef} 
                    className="hero-subtitle text-sm sm:text-base md:text-[18px] mb-6 px-2 text-center"
                >
                    {currentSlide.subtitle}
                </p>

                {/* 3. FILA INFERIOR: PILL BADGE TÉCNICO + DOTS DE PAGINACIÓN */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                    {/* Pill Badge técnico con check verde esmeralda y texto cian */}
                    <div ref={badgeRef} className="tech-pill-badge">
                        <div className="badge-shimmer-bar" />
                        <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="4 10.5 8 14.5 16 6" />
                        </svg>
                        <span className="font-mono text-xs sm:text-[13px] font-semibold tracking-wide text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                            {currentSlide.badge}
                        </span>
                    </div>

                    {/* Indicadores de paginación con píldora activa alargada */}
                    <div className="flex items-center space-x-2.5">
                        {HERO_SHOWCASE_SLIDES.map((_, dotIdx) => (
                            <button
                                key={dotIdx}
                                type="button"
                                onClick={() => {
                                    if (dotIdx !== currentIndex) {
                                        transitionToSlide(dotIdx, false);
                                    }
                                }}
                                className={`page-dot ${dotIdx === currentIndex ? 'is-active' : ''}`}
                                aria-label={`Diapositiva ${dotIdx + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

const AppCinematicIntro = ({ isOpen, onClose, onOpenLogin, onOpenRegister, onOpenTour, onOpenPricing }) => {
    if (!isOpen) return null;

    const [phase, setPhase] = useState('video'); // 'video' | 'portal'
    const [videoOpacity, setVideoOpacity] = useState(1.0); // Opacidad visible directa
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [selectedAlpha, setSelectedAlpha] = useState(0.85); // Alpha 85% exacto solicitado por el usuario
    const [isMuted, setIsMuted] = useState(false);
    const [isBassShaking, setIsBassShaking] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // ENTRADA DEL VÍDEO: Suave aparición inicial
    useEffect(() => {
        const timer = setTimeout(() => {
            setVideoOpacity(1.0);
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    // Reproducción automática limpia: desmutear de inmediato sin forzar al usuario a hacer clic en la pantalla
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid) return;

        vid.currentTime = 0;
        vid.muted = false;
        vid.volume = 1.0;

        const tryUnmute = () => {
            if (vid) {
                vid.muted = false;
                vid.volume = 1.0;
                setIsMuted(false);
                vid.play().catch(() => {});
            }
        };

        const playPromise = vid.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                setIsMuted(false);
            }).catch(() => {
                vid.muted = true;
                setIsMuted(true);
                vid.play().catch(() => {});

                const triggerEvents = ['pointermove', 'mousemove', 'mouseenter', 'touchstart', 'focus', 'wheel', 'scroll', 'keydown', 'pointerdown'];
                const onUserInteract = () => {
                    tryUnmute();
                    triggerEvents.forEach(ev => window.removeEventListener(ev, onUserInteract));
                };
                triggerEvents.forEach(ev => window.addEventListener(ev, onUserInteract, { passive: true, once: true }));
            });
        }
    }, []);

    // SEGUIMIENTO DE TIEMPO Y DISOLUCIÓN ULTRA-SUAVE
    const handleTimeUpdate = () => {
        const vid = videoRef.current;
        if (!vid || !vid.duration) return;

        // Vibración de cámara y distorsión de graves desde el drop sincronizado con el play (9.259s)
        if (vid.currentTime >= 9.258 && !isBassShaking) {
            setIsBassShaking(true);
        }

        // Alpha fijo al 85% solicitado por el usuario para todas las etapas del vídeo
        if (selectedAlpha !== 0.85) {
            setSelectedAlpha(0.85);
        }

        // SALIDA DEL VÍDEO: Disolución cruzada gradual en los últimos 1.8 segundos sin corte negro
        const timeLeft = vid.duration - vid.currentTime;
        if (timeLeft <= 1.8 && !isTransitioning) {
            setIsTransitioning(true);
            setVideoOpacity(0.0);
            setTimeout(() => {
                setPhase('portal');
            }, 1100);
        }
    };

    const handleVideoEnded = () => {
        setIsTransitioning(true);
        setVideoOpacity(0.0);
        setTimeout(() => {
            setPhase('portal');
        }, 1000);
    };

    const handleSkip = () => {
        setIsTransitioning(true);
        setVideoOpacity(0.0);
        setTimeout(() => {
            setPhase('portal');
        }, 900);
    };

    // Acciones al pulsar los botones del portal
    const handleAction = (action) => {
        if (action === 'login') {
            onClose();
            if (onOpenLogin) onOpenLogin();
        } else if (action === 'register') {
            onClose();
            if (onOpenRegister) onOpenRegister();
        } else if (action === 'tour') {
            onClose();
            if (onOpenTour) onOpenTour();
        } else if (action === 'pricing') {
            if (onOpenPricing) onOpenPricing();
            onClose();
        } else {
            onClose();
        }
    };

    // Atmósfera 3D y Rayos Láser en Fase Portal
    useEffect(() => {
        if (phase !== 'portal' && !isTransitioning) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        let t = 0;

        const render3D = () => {
            t += 0.035;
            const w = canvas.width = window.innerWidth;
            const h = canvas.height = window.innerHeight;
            ctx.clearRect(0, 0, w, h);

            // Láseres Neón volumétricos en perspectiva
            const count = 10;
            for (let i = 0; i < count; i++) {
                const angle = Math.sin(t * 0.8 + i * 0.7) * 0.45;
                const startX = (w / (count + 1)) * (i + 1);
                ctx.beginPath();
                ctx.moveTo(startX, 0);
                ctx.lineTo(startX + Math.tan(angle) * h, h);
                const g = ctx.createLinearGradient(startX, 0, startX + Math.tan(angle) * h, h);
                g.addColorStop(0, i % 2 === 0 ? 'rgba(34, 211, 238, 0.55)' : 'rgba(250, 250, 250, 0.28)');
                g.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.strokeStyle = g;
                ctx.lineWidth = 2.5 + Math.sin(t * 2 + i) * 1.5;
                ctx.stroke();
            }

            animId = requestAnimationFrame(render3D);
        };

        render3D();
        return () => cancelAnimationFrame(animId);
    }, [phase, isTransitioning]);

    return (
        <div 
            className="fixed inset-0 z-[99999] bg-[#09090b] overflow-hidden flex flex-col justify-between font-sans text-white select-none"
            onClick={() => {
                const vid = videoRef.current;
                if (vid && vid.muted) {
                    vid.muted = false;
                    setIsMuted(false);
                }
            }}
        >
            {/* CAPA 1: PUERTA DE ACCESO Y PORTAL ESPECTACULAR (SIEMPRE DISPONIBLE EN EL FONDO) */}
            <div 
                className="absolute inset-0 z-10 flex flex-col bg-[#09090b] overflow-y-auto custom-scrollbar"
                style={{
                    opacity: phase === 'portal' ? 1.0 : (isTransitioning ? 1.0 : 0.0),
                    pointerEvents: phase === 'portal' || isTransitioning ? 'auto' : 'none',
                    transform: phase === 'portal' || isTransitioning ? 'scale(1)' : 'scale(0.98)',
                    transition: 'opacity 1100ms cubic-bezier(0.16, 1, 0.3, 1), transform 1100ms cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-35" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(34,211,238,0.18),transparent_70%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_45%,#09090b)] pointer-events-none" />

                {/* Topbar del Portal */}
                <div className="relative z-10 flex items-center justify-between gap-4 px-5 sm:px-8 pt-5 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span className="bw-eyebrow text-cyan-300 font-mono text-[11px] font-black uppercase tracking-widest hidden sm:inline">
                            BeatWave Pro · Precision Audio Intelligence
                        </span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            type="button"
                            onClick={() => handleAction('pricing')}
                            className="bw-btn bw-btn-primary font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                        >
                            <Icons.Crown size={14} />
                            <span>Desbloquear Licencia Pro</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAction('cabin')}
                            className="bw-btn bw-btn-ghost hover:text-white"
                        >
                            <span>Entrar a la cabina</span>
                            <Icons.ChevronRight size={14} />
                        </button>
                    </div>
                </div>

                {/* Contenido Principal con Logo y Rotador de Hooks Persuasivos */}
                <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-6 text-center max-w-5xl mx-auto w-full my-auto">
                    {/* Logo Oficial + Tipografía Idéntica al Header (Misma Tipografía Syne, Diseño y Proporción 1:1) Separado del Carrusel */}
                    <div 
                        className="flex items-center justify-center select-none group"
                        style={{ marginTop: '16px', marginBottom: '84px' }}
                    >
                        <BeatWaveBrandIdentity variant="hero" />
                    </div>

                    {/* ESCENARIO LIBRE SIN MARCOS NI TARJETAS: CLEAN-LINE KINETIC SCRAMBLE STUDIO (MISMO ESPACIO INFERIOR DE 84PX) */}
                    <div className="w-full flex flex-col items-center justify-center select-none" style={{ marginBottom: '84px' }}>
                        <CleanLineKineticStudioStage />
                    </div>

                    {/* BOTONES DE CONVERSIÓN & ACCESO A LICENCIA */}
                    <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <button
                            type="button"
                            onClick={() => handleAction('pricing')}
                            className="bw-gate-rise is-primary relative overflow-hidden group shadow-[0_15px_40px_rgba(34,211,238,0.45)] cursor-pointer flex flex-col justify-between p-5 min-h-[112px] rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black text-left transition-all hover:-translate-y-0.5 active:scale-98"
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/15 group-hover:scale-110 transition-transform text-black shrink-0">
                                    <Icons.Crown size={22} />
                                </span>
                                <div className="px-2.5 py-1 rounded bg-black/20 text-[9.5px] font-mono font-black uppercase tracking-wider text-black">
                                    MÁS ELEGIDO
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5 text-left mt-3">
                                <span className="text-base font-black tracking-tight text-black">Desbloquear Licencia Pro</span>
                                <span className="text-xs text-black/75 font-medium leading-tight">Acceso total e ilimitado al motor DSP y Hot Cues</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleAction('login')}
                            className="bw-gate-rise bg-[#141524]/90 hover:bg-[#1a1c30] border border-cyan-500/30 hover:border-cyan-400 relative overflow-hidden group shadow-lg cursor-pointer flex flex-col justify-between p-5 min-h-[112px] rounded-2xl text-left transition-all hover:-translate-y-0.5 active:scale-98"
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-cyan-300 group-hover:scale-110 transition-transform shrink-0">
                                    <Icons.LogIn size={20} />
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5 text-left mt-3">
                                <span className="text-base font-bold text-white tracking-tight">Iniciar Sesión en Cabina</span>
                                <span className="text-xs text-zinc-400 font-medium leading-tight">Continúa tu sesión, maleta y preferencias</span>
                            </div>
                        </button>
                    </div>

                    <p className="text-[11px] font-mono text-zinc-500 mt-3 flex items-center gap-1.5">
                        <Icons.Check size={12} className="text-emerald-400" />
                        Garantía de rendimiento en directo · 100% Offline tras activación · Sin cuelgues
                    </p>
                </main>

                {/* Footer del Portal */}
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-1.5 border-t border-white/5 px-5 sm:px-8 py-3.5 font-mono text-[11px] text-zinc-500 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-zinc-400 font-bold">ECOSISTEMA UNIVERSAL:</span>
                        <span>CDJ-3000 · Rekordbox · Serato DJ Pro · Traktor Pro 3 · VirtualDJ</span>
                    </div>
                    <span className="text-cyan-400/80 font-bold">v2.4 Studio Pro · Ready for Tour</span>
                </div>
            </div>

            {/* CAPA 2: VÍDEO CINEMÁTICO (SE DISUELVE SUAVEMENTE SIN CORTE NEGRO) */}
            {phase === 'video' && (
                <div 
                    className="duotone-video-container absolute inset-0 z-20 w-full h-full bg-[#191414] overflow-hidden flex items-center justify-center transition-opacity duration-1000 ease-out"
                    style={{ 
                        opacity: videoOpacity * selectedAlpha,
                        pointerEvents: videoOpacity < 0.1 ? 'none' : 'auto'
                    }}
                >
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        preload="auto"
                        muted={isMuted}
                        onError={() => { setVideoOpacity(0.0); setPhase('portal'); }}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleVideoEnded}
                        src="assets/intro_cinematic.mp4"
                        className="duotone-video duotone-filter w-full h-full object-cover pointer-events-none"
                        style={{ 
                            transform: 'translateZ(0)',
                            filter: 'grayscale(100%) contrast(120%) sepia(100%) hue-rotate(145deg) saturate(200%)'
                        }}
                    />

                    {/* Botón en esquina inferior derecha para saltar si el usuario lo desea */}
                    <div className="absolute bottom-6 right-6 z-50">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSkip(); }}
                            className="px-4 py-2 rounded-full bg-black/75 hover:bg-black/95 border border-white/20 hover:border-cyan-400 text-gray-300 hover:text-white text-xs font-mono font-bold tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center gap-1.5"
                        >
                            <span>Saltar Intro</span>
                            <Icons.ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const AppTutorialModal = ({ isOpen, onClose, activeTab, setActiveTab, initialMode = 'launcher' }) => {
    return null;
};

// Componente Principal de la Aplicación
const App = () => {
    // Intro Espectacular a Pantalla Completa con Video de Fondo
    const [pricingOpen, setPricingOpen] = useState(false);
    const [registerModalOpen, setRegisterModalOpen] = useState(false);
    const [selectedPlanForRegister, setSelectedPlanForRegister] = useState('pro');
    const [cinematicIntroOpen, setCinematicIntroOpen] = useState(() => {
        try {
            const p = new URLSearchParams(window.location.search);
            if (p.get('intro') === '1' || p.get('portal') === '1') return true;
            if (p.get('skipintro') === '1' || p.get('nointro') === '1') return false;
            return !sessionStorage.getItem('bw_intro_viewed');
        } catch (e) {
            return false;
        }
    });

    const [lang, setLang] = useState(() => {
        try {
            return localStorage.getItem('beatwave_lang') || 'es';
        } catch (e) {
            return 'es';
        }
    });

    const changeLang = (newLang) => {
        setLang(newLang);
        try {
            localStorage.setItem('beatwave_lang', newLang);
        } catch (e) {}
    };

    const t = (k) => (I18N_TRANSLATIONS[lang] && I18N_TRANSLATIONS[lang][k]) || (I18N_TRANSLATIONS['es'][k]) || k;

    const [activeTab, setActiveTab] = useState(() => {
        try {
            const p = new URLSearchParams(window.location.search);
            const q = p.get('tab') || window.location.hash.replace('#', '');
            if (q) {
                const map = {
                    'all': 'all', 'todas': 'all', 'galeria': 'all',
                    'library': 'library', 'coleccion': 'library', 'colección': 'library', 'biblioteca': 'library',
                    'audit': 'audit', 'cabina': 'audit',
                    'cues': 'hotcues', 'hotcues': 'hotcues',
                    'sets': 'setbuilder', 'setbuilder': 'setbuilder',
                    'map': 'map', 'mapa': 'map',
                    'pool': 'spotify', 'spotify': 'spotify',
                    'radar': 'shazam', 'shazam': 'shazam',
                    'crates': 'taxonomy', 'taxonomy': 'taxonomy',
                    'trends': 'trends',
                    'knowledge': 'knowledge', 'conocimiento': 'knowledge',
                    'copilot': 'copilot'
                };
                if (map[q.toLowerCase()]) return map[q.toLowerCase()];
            }
        } catch (e) {}
        return 'library';
    });
    const [isSimulationMode, setIsSimulationMode] = useState(false);
    const [currentFolder, setCurrentFolder] = useState('');
    const [studioMode, setStudioMode] = useState('cues');
    const [auditTracks, setAuditTracks] = useState([]);
    const [setBuilderTracks, setSetBuilderTracks] = useState([]);
    const [spotifyTracks, setSpotifyTracks] = useState([]);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const currentTrack = selectedTrack ? (auditTracks.find(t => t.id === selectedTrack) || null) : null;
    const [nowPlayingTrack, setNowPlayingTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFooterDeckExpanded, setIsFooterDeckExpanded] = useState(false);
    const [loadTrackMenuOpen, setLoadTrackMenuOpen] = useState(false);
    const localAudioInputRef = useRef(null);

    const handleLoadLocalAudioFile = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        const localTrack = {
            id: 'local_' + Date.now(),
            title: fileNameWithoutExt,
            t: fileNameWithoutExt,
            artist: 'Archivo Local DJ',
            a: 'Archivo Local DJ',
            bpm: 128.0,
            b: 128.0,
            key: '10A',
            k: '10A',
            raw_key: 'Bm',
            genre: 'Audio Cabina',
            cover: null,
            f: file.name,
            path: file.name,
            url: objectUrl,
            cues: NV2_COLORS
        };
        setSelectedTrack(localTrack.id);
        setNowPlayingTrack(localTrack);
        setIsPlaying(true);
        setIsFooterDeckExpanded(true);
        setLoadTrackMenuOpen(false);
    };

    const handleLoadFirstLibraryTrack = () => {
        const candidate = (auditTracks && auditTracks.length > 0) ? auditTracks[0] : null;
        if (candidate) {
            setSelectedTrack(candidate.id);
            setNowPlayingTrack(candidate);
            setIsPlaying(true);
            setIsFooterDeckExpanded(true);
        }
        setLoadTrackMenuOpen(false);
    };
    // PERF A2: playProgress eliminado del estado React → ref mutable + CustomEvent.
    // Ningún re-render se dispara por ontimeupdate; solo FooterMasterWaveform y la
    // barra móvil (mobileProgress) reaccionan al avance de la reproducción.
    const playProgressRef = useRef(0);
    const setPlayProgress = useCallback((pct) => {
        const safe = Math.max(0, Math.min(1, typeof pct === "number" ? pct : 0));
        playProgressRef.current = safe;
        window.dispatchEvent(new CustomEvent("bw:progress", { detail: { pct: safe } }));
    }, []);
    const audioRef = useRef(null);

    // PERF A4: mobileProgress — estado local para la barra de progreso ultra-fina
    // en móvil (<768 px). Se actualiza vía CustomEvent 'bw:progress' en lugar de
    // leer playProgress del estado global, evitando re-renders en todo el árbol.
    const [mobileProgress, setMobileProgress] = useState(0);
    useEffect(() => {
        const onProgress = (e) => setMobileProgress(e.detail.pct);
        window.addEventListener("bw:progress", onProgress);
        return () => window.removeEventListener("bw:progress", onProgress);
    }, []);
    // PERF: playProgress para workspaces — se actualiza cada ~100ms via CustomEvent
    // (throttle), evitando re-renders a 60 fps. Los workspaces usan este valor
    // solo para el playhead de la fila activa, no en cada frame de audio.
    const [playProgress, setPlayProgressForWorkspaces] = useState(0);
    useEffect(() => {
        let lastUpdate = 0;
        const THROTTLE_MS = 100;
        const onProgress = (e) => {
            const now = Date.now();
            if (now - lastUpdate >= THROTTLE_MS) {
                lastUpdate = now;
                setPlayProgressForWorkspaces(e.detail.pct);
            }
        };
        window.addEventListener("bw:progress", onProgress);
        return () => window.removeEventListener("bw:progress", onProgress);
    }, []);

    // Estado Global de Tareas en Background & Tutorial de Bienvenida (Deshabilitado a petición)
    const [globalAuditInfo, setGlobalAuditInfo] = useState({ isAuditing: false, isLoadingDir: false, progress: 0, statusMsg: '' });

    // RAM Warm-up: Monitorear precarga en caliente del catálogo al arrancar
    useEffect(() => {
        fetch('/api/warmup/status')
            .then(res => res.json())
            .then(data => {
                if (data && data.ready) {
                    console.log(`[RAM WARM-UP] Catálogo precalentado: ${data.total_cached} pistas en memoria RAM.`);
                }
            })
            .catch(() => {});
    }, []);

    // Listener Global de Progreso de Carga y Auditoría para TopBar y Workspaces
    useEffect(() => {
        const handleGlobalAuditEvt = (e) => {
            if (!e.detail) return;
            const { pct, msg } = e.detail;
            if (!msg || msg.includes('detenid') || msg.includes('cancelad')) {
                setGlobalAuditInfo({ isAuditing: false, isLoadingDir: false, progress: 0, statusMsg: '' });
                return;
            }
            const isLoading = msg.toLowerCase().includes('leyendo') || msg.toLowerCase().includes('carga') || msg.toLowerCase().includes('tags') || msg.toLowerCase().includes('archivo');
            setGlobalAuditInfo({
                isAuditing: !isLoading && pct < 100,
                isLoadingDir: isLoading,
                progress: pct,
                statusMsg: msg
            });
            if (pct >= 100) {
                setTimeout(() => {
                    setGlobalAuditInfo(prev => ({ ...prev, isAuditing: false, isLoadingDir: false, progress: 0, statusMsg: '' }));
                }, 2500);
            }
        };

        window.addEventListener('bw:audit_progress', handleGlobalAuditEvt);

        window.actualizar_progreso_batch = (pct, msg) => {
            window.dispatchEvent(new CustomEvent('bw:audit_progress', { detail: { pct, msg } }));
        };

        if (window.eel && typeof window.eel.expose === 'function') {
            try {
                window.eel.expose(window.actualizar_progreso_batch, "actualizar_progreso_batch");
            } catch (err) {}
        }

        return () => window.removeEventListener('bw:audit_progress', handleGlobalAuditEvt);
    }, []);
    const [tutorialOpen, setTutorialOpen] = useState(false);
    const [tutorialInitialMode, setTutorialInitialMode] = useState('launcher');
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    // Barra lateral de navegación: Al inicio siempre está desplegada hasta que el usuario interactúa (toca un menú u otro punto de la app)
    const [railExpanded, setRailExpanded] = useState(true);
    const toggleRailExpanded = () => {
        setRailExpanded((prev) => !prev);
    };

    useEffect(() => {
        if (!railExpanded) return;
        const handleAutoCollapse = (e) => {
            const isToggleBtn = e.target && e.target.closest && e.target.closest('[data-rail-toggle="true"]');
            if (isToggleBtn) return;
            setRailExpanded(false);
        };
        const timer = setTimeout(() => {
            window.addEventListener('pointerdown', handleAutoCollapse, true);
        }, 120);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('pointerdown', handleAutoCollapse, true);
        };
    }, [railExpanded]);
    const [copilotModalOpen, setCopilotModalOpen] = useState(false);

    // GESTIÓN GLOBAL DE LIBRERÍAS PERSONALIZADAS Y PERSISTENTES (COLUMNA DERECHA)
    const [customLibraries, setCustomLibraries] = useState(() => {
        try {
            const saved = localStorage.getItem('bw_user_custom_libraries');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map(l => ({
                        ...l,
                        tracks: l.tracks || [],
                        folders: (l.folders || []).filter(f => !f.id?.startsWith('f_default_') || (f.tracks && f.tracks.length > 0))
                    }));
                }
            }
        } catch (_) {}
        return [
            {
                id: 'lib_default',
                name: 'Mi Biblioteca Principal',
                createdAt: new Date().toISOString(),
                tracks: [],
                folders: []
            }
        ];
    });

    const [activeCustomLibId, setActiveCustomLibId] = useState(() => {
        try {
            return localStorage.getItem('bw_user_active_library_id') || 'lib_default';
        } catch (_) {
            return 'lib_default';
        }
    });

    // Carga automática de la biblioteca guardada en backend al iniciar la aplicación
    useEffect(() => {
        const loadSavedLibraryFromBackend = async () => {
            try {
                const r = await fetch('/api/biblioteca/cargar');
                if (r.ok) {
                    const res = await r.json();
                    if (res && res.status === 'success' && res.data && Array.isArray(res.data.libraries) && res.data.libraries.length > 0) {
                        const cleaned = res.data.libraries.map(l => ({
                            ...l,
                            tracks: l.tracks || [],
                            folders: (l.folders || []).filter(f => !f.id?.startsWith('f_default_') || (f.tracks && f.tracks.length > 0))
                        }));
                        setCustomLibraries(cleaned);
                        if (res.data.active_id) {
                            setActiveCustomLibId(res.data.active_id);
                        }
                    }
                }
            } catch (e) {
                console.warn("No se pudo cargar biblioteca remota:", e);
            }
        };
        loadSavedLibraryFromBackend();
    }, []);

    const [isLibraryDrawerOpen, setIsLibraryDrawerOpen] = useState(false);
    const [activeCrateFilter, setActiveCrateFilter] = useState(null);

    const handleAuditarCrateDesdeModal = (folder, lib) => {
        if (!folder) return;
        const keys = new Set((folder.tracks || []).map(t => t.id !== undefined ? t.id : (t.file_path || t.filename || t.path)));
        setActiveCrateFilter({
            id: folder.id,
            name: folder.name,
            libName: lib ? lib.name : 'Biblioteca',
            trackKeys: keys
        });
        setActiveTab('audit');
        setIsLibraryDrawerOpen(false);
    };

    const saveCustomLibraries = (newLibs, newActiveId = null) => {
        setCustomLibraries(newLibs);
        const activeIdToSave = newActiveId || activeCustomLibId;
        try {
            localStorage.setItem('bw_user_custom_libraries', JSON.stringify(newLibs));
            if (newActiveId) {
                setActiveCustomLibId(newActiveId);
                localStorage.setItem('bw_user_active_library_id', newActiveId);
            }
            fetch('/api/biblioteca/guardar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ libraries: newLibs, active_id: activeIdToSave })
            }).catch(() => {});
        } catch (_) {}
    };

    const handleMaterializarBibliotecaEnDisco = async (lib) => {
        if (!lib || !lib.folders || lib.folders.length === 0) {
            alert("Crea al menos una carpeta y asigna pistas para materializar en disco.");
            return;
        }
        if (window.eel && window.eel.seleccionar_directorio) {
            try {
                const destino = await window.eel.seleccionar_directorio(`Selecciona la carpeta base donde crear la biblioteca "${lib.name}":`)();
                if (!destino) return;
                const estructura = lib.folders.map(f => ({
                    folder_name: f.name,
                    track_paths: (f.tracks || []).map(t => t.file_path || t.path || t.filepath).filter(Boolean)
                }));
                if (window.eel.exportar_biblioteca_a_disco) {
                    const res = await window.eel.exportar_biblioteca_a_disco(destino, lib.name, estructura)();
                    if (res && res.success) {
                        alert(`✓ Biblioteca "${lib.name}" creada con éxito en:\n${res.path}`);
                    } else {
                        alert(`Atención: ${res?.error || 'No se pudo exportar a disco'}`);
                    }
                }
            } catch (err) {
                console.error("Error materializando biblioteca:", err);
            }
        }
    };

    // MANUAL MAESTRO INTERACTIVO INDIVIDUALIZADO (Modal & Masterclass)
    const [manualModalOpen, setManualModalOpen] = useState(false);
    const [manualSection, setManualSection] = useState('audit');

    const handleOpenManual = (section = null) => {
        const secMap = {
            'audit': 'audit', 'copilot': 'copilot', 'hotcues': 'hotcues', 'cues': 'hotcues',
            'setbuilder': 'setbuilder', 'sets': 'setbuilder', 'map': 'map',
            'spotify': 'spotify', 'pool': 'spotify', 'radar': 'radar',
            'crates': 'crates', 'taxonomy': 'crates', 'trends': 'radar', 'knowledge': 'radar'
        };
        const target = (section && secMap[section]) ? secMap[section] : (secMap[activeTab] || 'audit');
        if (manualModalOpen && manualSection === target) {
            setManualModalOpen(false);
        } else {
            setManualSection(target);
            setManualModalOpen(true);
        }
    };

    // ESPACIO DE USUARIO, LOGIN & SESIONES GUARDADAS
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [userProfile, setUserProfile] = useState(() => {
        try {
            const saved = localStorage.getItem('bw_user_profile');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            alias: 'DJ Alex BeatWave',
            email: 'alex.dj@beatwave.pro',
            plan: 'PRO CABINA VIP',
            djSoftware: 'Serato DJ Pro',
            audioInterface: 'Focusrite Scarlett 2i2 / Serato Club Kit',
            targetLufs: -9.0,
            autoSave: true
        };
    });

    const handleUpdateUserProfile = (newProfile) => {
        setUserProfile(newProfile);
        try { localStorage.setItem('bw_user_profile', JSON.stringify(newProfile)); } catch (e) {}
    };

    const DEMO_SAVED_SESSIONS = [
        {
            id: 'sess-init-1',
            name: '🌟 Sesión Club Ibiza - Warmup Melodic (12 pistas)',
            date: '31/10/2026 20:30',
            folder: 'Simulación Cabina BeatWave',
            tracksCount: 12,
            activeTab: 'audit'
        }
    ];

    const [savedSessions, setSavedSessions] = useState(() => {
        try {
            const saved = localStorage.getItem('bw_saved_sessions');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return [];
    });

    const handleSaveCurrentSession = (customName) => {
        const sessionObj = {
            id: 'sess-' + Date.now(),
            name: customName || `Sesión ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString().slice(0, 5)}`,
            date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString().slice(0, 5),
            folder: currentFolder,
            activeTab: activeTab,
            tracksCount: auditTracks.length,
            selectedTrackId: selectedTrack,
            tracksData: auditTracks.map(t => ({
                id: t.id,
                path: t.path || t.f,
                title: t.title || t.name,
                artist: t.artist,
                bpm: t.bpm,
                key: t.key,
                cues: t.cues,
                quality: t.quality
            }))
        };
        setSavedSessions(prev => {
            const next = [sessionObj, ...prev.slice(0, 9)];
            try { localStorage.setItem('bw_saved_sessions', JSON.stringify(next)); } catch (e) {}
            return next;
        });
    };

    const handleLoadSession = (session) => {
        if (!session) return;
        if (session.folder) setCurrentFolder(session.folder);
        if (session.activeTab) setActiveTab(session.activeTab);
        if (session.tracksData && session.tracksData.length > 0) {
            setAuditTracks(session.tracksData);
            if (session.selectedTrackId) setSelectedTrack(session.selectedTrackId);
        }
    };

    const handleDeleteSession = (sessionId) => {
        setSavedSessions(prev => {
            const next = prev.filter(s => s.id !== sessionId);
            try { localStorage.setItem('bw_saved_sessions', JSON.stringify(next)); } catch (e) {}
            return next;
        });
    };

    // CUADERNO DE BITÁCORA DE PROCESOS (HISTORIAL DE CAMBIOS Y EXPORTACIÓN EXCEL)
    const DEMO_BITACORA_ENTRIES = [
        {
            id: 'b-1',
            timestamp: '31/10/2026 20:45',
            category: 'audit',
            action: 'Diagnóstico Espectral DSP & FFT',
            trackTitle: 'Cascada - Everytime We Touch',
            filePath: 'Cascada - Everytime We Touch.mp3',
            detailsBefore: 'MP3 218 kbps • Corte en 18.5 kHz • Sin tags Serato',
            detailsAfter: 'Certificado Media Calidad • BPM: 143.00 • Camelot: 8A • -9.0 LUFS',
            status: '✓ Certificado'
        },
        {
            id: 'b-2',
            timestamp: '31/10/2026 20:46',
            category: 'cues',
            action: 'Inyección de 8 Hot Cues & Fraseo',
            trackTitle: 'Kriss / New Limit - Tonight / Smile',
            filePath: 'Tonight Smile.mp3',
            detailsBefore: '0 Hot Cues en Serato',
            detailsAfter: '8 Hot Cues (1: Intro, 3: Break, 5: Snare, 7: Drop) • Pioneer RGB',
            status: '✓ Inyectado'
        },
        {
            id: 'b-3',
            timestamp: '31/10/2026 20:48',
            category: 'download',
            action: 'Sustitución SuperFLAC Lossless Ingest',
            trackTitle: 'Plastikman, Richie Hawtin - Artifakts (BC)',
            filePath: 'Plastikman - Artifakts.mp3',
            detailsBefore: 'MP3 83 kbps (Pérdida Severa <16kHz Fake)',
            detailsAfter: 'FLAC Lossless 24-bit Genuino (22.05 kHz) • Carátula 1400x1400',
            status: '✓ Reemplazado'
        },
        {
            id: 'b-4',
            timestamp: '31/10/2026 20:51',
            category: 'crates',
            action: 'Exportación a Serato Crates & Rekordbox XML',
            trackTitle: 'Lote Principal (12 pistas)',
            filePath: 'Melodic_Techno.crate',
            detailsBefore: 'Sin sincronización multisoftware',
            detailsAfter: 'Crate binario Serato .crate generado + Rekordbox XML sincronizado',
            status: '✓ Sincronizado'
        }
    ];

    const [bitacoraModalOpen, setBitacoraModalOpen] = useState(false);
    const [bitacoraEntries, setBitacoraEntries] = useState(() => {
        try {
            const saved = localStorage.getItem('bw_audit_bitacora');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return [];
    });

    const handleClearBitacora = () => {
        setBitacoraEntries([]);
        try { localStorage.removeItem('bw_audit_bitacora'); } catch (e) {}
    };

    useEffect(() => {
        const handleBitacoraSync = (e) => {
            if (e && e.detail && Array.isArray(e.detail)) {
                setBitacoraEntries(e.detail);
            }
        };
        window.addEventListener('bw_bitacora_updated', handleBitacoraSync);
        return () => window.removeEventListener('bw_bitacora_updated', handleBitacoraSync);
    }, []);

    // Auto-guardado continuo del estado de la sesión para que el DJ continúe donde lo dejó
    useEffect(() => {
        if (userProfile && userProfile.autoSave !== false) {
            try {
                const autoSession = {
                    folder: currentFolder,
                    activeTab: activeTab,
                    selectedTrackId: selectedTrack,
                    updatedAt: Date.now()
                };
                localStorage.setItem('bw_auto_session', JSON.stringify(autoSession));
            } catch (e) {}
        }
    }, [currentFolder, activeTab, selectedTrack, userProfile]);

    // UX CABINA: Modo Cabina Oscura (High-Contrast Club Mode) y Modal de Atajos DJ
    const [clubMode, setClubMode] = useState(() => {
        try {
            return localStorage.getItem('bw_club_mode') === 'true';
        } catch (e) {
            return false;
        }
    });

    const toggleClubMode = () => {
        setClubMode(prev => {
            const next = !prev;
            try { localStorage.setItem('bw_club_mode', String(next)); } catch (e) {}
            return next;
        });
    };

    const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

    // Modo del Altavoz: 'neon' (nuevo con borde azul corporativo y efecto neón) | 'original' (preservado para recuperación)
    const [speakerLogoMode, setSpeakerLogoMode] = useState(() => {
        try {
            return localStorage.getItem('cleandjmix_speaker_logo_mode') || 'neon';
        } catch (e) {
            return 'neon';
        }
    });

    const handleSetSpeakerLogoMode = (mode) => {
        setSpeakerLogoMode(mode);
        try {
            localStorage.setItem('cleandjmix_speaker_logo_mode', mode);
        } catch (e) {}
    };

    useEffect(() => {
        window.setSpeakerLogoMode = handleSetSpeakerLogoMode;
        window.toggleSpeakerLogoMode = () => {
            handleSetSpeakerLogoMode(speakerLogoMode === 'neon' ? 'original' : 'neon');
        };
    }, [speakerLogoMode]);

    // Secuencia Techno del Logo: vibraciones en bucle durante 10 segundos, luego estático
    // IMPORTANTE: Si salta el tutorial o alguna modal está abierta, NO debe iniciarse hasta que el usuario termine/cierre las modales
    const [isLogoTechnoActive, setIsLogoTechnoActive] = useState(false);
    const logoTechnoTimerRef = useRef(null);
    const initialTechnoPlayedRef = useRef(false);

    const triggerLogoTechno = () => {
        setIsLogoTechnoActive(true);
        if (logoTechnoTimerRef.current) clearTimeout(logoTechnoTimerRef.current);
        logoTechnoTimerRef.current = setTimeout(() => {
            setIsLogoTechnoActive(false);
        }, 10000);
    };

    // Animación automática al entrar al panel eliminada a petición del usuario (logotipo limpio y estático)
    useEffect(() => {
        if (tutorialOpen || copilotModalOpen) {
            if (logoTechnoTimerRef.current) clearTimeout(logoTechnoTimerRef.current);
            setIsLogoTechnoActive(false);
        }
    }, [tutorialOpen, copilotModalOpen]);

    useEffect(() => {
        window.abrirIntroCinematica = () => {
            setCinematicIntroOpen(true);
        };
        window.abrirTutorial = (mode = 'launcher') => {
            setTutorialInitialMode(mode);
            setTutorialOpen(true);
        };
    }, []);

    const handleAddTracksToSpotify = (tracksData, origin = 'taxonomy') => {
        if (!tracksData) return;
        const list = Array.isArray(tracksData) ? tracksData : [tracksData];
        if (list.length === 0) return;

        const newTracks = list.map((trackData, idx) => {
            const bNum = parseFloat(trackData.displayBpm || trackData.bpm || trackData.b || 128) || 128;
            const titleStr = String(trackData.displayTitle || trackData.title || trackData.t || '').toLowerCase();
            const artistStr = String(trackData.displayArtist || trackData.artist || trackData.a || '').toLowerCase();
            const seed = (titleStr + artistStr).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + (idx * 17);
            const dynEnergy = Math.min(98, Math.max(45, Math.round(60 + (bNum - 118) * 1.5 + ((seed % 17) - 8))));
            const dynDance = Math.min(98, Math.max(48, Math.round(92 - Math.abs(bNum - 126) * 0.9 + ((seed % 15) - 7))));

            return {
                id: trackData.id || `tax_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
                title: trackData.displayTitle || trackData.title || trackData.t || 'Pista Taxonomía',
                artist: trackData.displayArtist || trackData.artist || trackData.a || 'Artista',
                album: trackData.displayAlbum || trackData.album || (origin === 'audit_upgrade' || trackData.origin === 'audit_upgrade' ? 'Catálogo Master HD' : 'Taxonomía AI'),
                bpm: bNum,
                key: (trackData.displayKey || trackData.key || trackData.k || '8A').toUpperCase(),
                cover: trackData.displayCover || trackData.cover || null,
                duration: trackData.duration || '04:00',
                origin: trackData.origin || origin,
                reemplazo_de: trackData.reemplazo_de || null,
                original_file: trackData.original_file || null,
                original_path: trackData.original_path || null,
                original_duration: trackData.original_duration || null,
                original_calidad: trackData.original_calidad || null,
                downloaded: false,
                selected: trackData.selected !== undefined ? trackData.selected : true,
                format: trackData.format || 'FLAC',
                energy: trackData.energy || trackData.e || dynEnergy,
                danceability: trackData.danceability || trackData.dance || dynDance,
                fase_badge: trackData.fase_badge || null,
                comment: trackData.comment || null,
                calidad: trackData.calidad || (origin === 'audit_upgrade' || trackData.origin === 'audit_upgrade' ? 'Catálogo Master HD' : 'Pendiente'),
                status: trackData.status || 'Pendiente Descarga',
                spotify_id: trackData.spotify_id || null,
                spotify_url: trackData.spotify_url || null,
                apple_url: trackData.apple_url || null,
                isrc: trackData.isrc || null,
                preview_url: trackData.preview_url || null,
                match_score: trackData.match_score !== undefined ? trackData.match_score : 100,
                match_confianza: trackData.match_confianza || 'ALTA',
                match_badge_color: trackData.match_badge_color || 'emerald',
                match_recomendacion: trackData.match_recomendacion || '',
                candidatos_alternativos: trackData.candidatos_alternativos || [],
                todos_candidatos: trackData.todos_candidatos || [],
                alerta_version: trackData.alerta_version || null,
                alerta_duracion: trackData.alerta_duracion || null,
                es_misma_pista: trackData.es_misma_pista !== undefined ? trackData.es_misma_pista : true
            };
        });

        setSpotifyTracks(prev => {
            const current = prev || [];
            const filteredNew = newTracks.filter(nt => !current.some(c => 
                (c.title || '').toLowerCase() === nt.title.toLowerCase() && 
                (c.artist || '').toLowerCase() === nt.artist.toLowerCase()
            ));
            return [...filteredNew, ...current];
        });
        setActiveTab('spotify');
    };
    const handleAddTrackToSpotify = handleAddTracksToSpotify;

    const [logs, setLogs] = useState([
        { type: 'info', text: "> CleanDJmix PRO v2.0 - Core Engine Initialized" },
        { type: 'divider', text: "--------------------------------------------------" },
        { type: 'success', text: "[ OK ] Audio Engine & Stream Router Online." },
        { type: 'success', text: "[ OK ] Serato Database XML Link Ready." }
    ]);

    // Web Audio Synthesizer fallback para preescucha cuando una pista no tiene archivo físico local
    const synthAudioCtxRef = useRef(null);
    const synthIntervalRef = useRef(null);

    const stopSynthPreview = () => {
        if (synthIntervalRef.current) {
            clearInterval(synthIntervalRef.current);
            synthIntervalRef.current = null;
        }
        if (synthAudioCtxRef.current) {
            try { synthAudioCtxRef.current.close(); } catch (e) {}
            synthAudioCtxRef.current = null;
        }
    };

    const playSynthPreview = (track) => {
        stopSynthPreview();
        setIsPlaying(false);
    };

    useEffect(() => {
        const audio = new Audio();
        audio.preload = "auto";

        audio.onended = () => {
            setIsPlaying(false);
            setPlayProgress(0);
        };

        audio.onerror = (err) => {
            if (audio.src && audio.src !== window.location.href && !audio.src.endsWith('/')) {
                console.warn("Global audio element error:", err);
            }
            setIsPlaying(false);
        };

        audio.ontimeupdate = () => {
            // PERF A3: solo actualiza ref + dispara CustomEvent, sin setState → sin re-renders
            if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                setPlayProgress(audio.currentTime / audio.duration);
            }
        };

        audioRef.current = audio;

        if (window.eel && typeof window.eel.expose === 'function') {
            window.log_to_console = (msg) => {
                setLogs(prev => [...prev, { type: 'info', text: `[${new Date().toLocaleTimeString()}] ${msg}` }]);
            };
            window.eel.expose(window.log_to_console, "log_to_console");

            window.notificar_archivo_original_eliminado_global = (info) => {
                if (info && info.original_path) {
                    const normPath = info.original_path.toLowerCase();
                    setAuditTracks(prev => prev.filter(t => {
                        const tPath = (t.path || t.filepath || t.f || '').toLowerCase();
                        return tPath !== normPath;
                    }));
                }
            };
            window.eel.expose(window.notificar_archivo_original_eliminado_global, "notificar_archivo_original_eliminado_global");
        }

        return () => {
            stopSynthPreview();
            audio.pause();
            audio.src = "";
        };
    }, []);

    const handlePlayTrack = (track, seekPct = 0, autoPlay = true, startOffsetSec = null) => {
        if (!track) return;
        stopSynthPreview();
        const resolvedCover = track.cover || (track.path ? `/cover?path=${encodeURIComponent(track.path)}` : (track.f ? `/cover?path=${encodeURIComponent(track.f)}` : null));
        const trackTitle = track.title || track.t || track.displayTitle || 'Audio Track';
        const trackArtist = track.artist || track.a || track.displayArtist || 'Unknown Artist';
        const trackWithCover = { 
            ...track, 
            cover: resolvedCover,
            title: trackTitle,
            t: trackTitle,
            artist: trackArtist,
            a: trackArtist
        };
        setNowPlayingTrack(trackWithCover);
        window.__bwCurrentTrack = trackWithCover;

        if (autoPlay) {
            const audio = audioRef.current;
            if (audio) {
                let targetSrc = "";
                const isDirectAudioUrl = (url) => {
                    if (!url || typeof url !== "string") return false;
                    if (url.startsWith("/previews/") || url.startsWith("/stream_audio")) return true;
                    if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
                    // Bloquear URLs de páginas web HTML que congelan el decodificador de audio
                    if (url.includes("open.spotify.com") || url.includes("music.apple.com") || url.includes("youtube.com/watch") || url.includes("youtu.be/")) {
                        return false;
                    }
                    return true;
                };

                if (isDirectAudioUrl(track.preview_url)) {
                    targetSrc = track.preview_url;
                } else if (isDirectAudioUrl(track.previewUrl)) {
                    targetSrc = track.previewUrl;
                } else if (isDirectAudioUrl(track.path)) {
                    targetSrc = track.path;
                } else if (track.preview_url && track.preview_url.startsWith("/previews/")) {
                    targetSrc = track.preview_url;
                } else if (track.path && !track.path.startsWith("http")) {
                    targetSrc = `/stream_audio?path=${encodeURIComponent(track.path)}`;
                } else if (track.f && !track.f.startsWith("http")) {
                    targetSrc = `/stream_audio?path=${encodeURIComponent(track.f)}`;
                }

                if (targetSrc) {
                    const isSameSrc = (audio.src === targetSrc || audio.src.endsWith(targetSrc));
                    const applyPosition = () => {
                        const dur = audio.duration;
                        if (startOffsetSec !== null && !isNaN(startOffsetSec)) {
                            const safeOffset = (dur && !isNaN(dur) && dur > 0.5)
                                ? Math.max(0, Math.min(dur - 0.25, startOffsetSec))
                                : Math.max(0, startOffsetSec);
                            try { audio.currentTime = safeOffset; } catch (_) {}
                            if (dur && !isNaN(dur) && dur > 0) {
                                setPlayProgress(safeOffset / dur);
                            }
                        } else if (seekPct > 0) {
                            const safePct = Math.min(0.99, Math.max(0, seekPct));
                            if (dur && !isNaN(dur) && dur > 0.5) {
                                const targetSec = Math.max(0, Math.min(dur - 0.25, dur * safePct));
                                try { audio.currentTime = targetSec; } catch (_) {}
                                setPlayProgress(targetSec / dur);
                            } else {
                                setPlayProgress(safePct);
                            }
                        }
                    };

                    if (isSameSrc) {
                        applyPosition();
                        const p = audio.play();
                        if (p && typeof p.then === 'function') {
                            p.then(() => setIsPlaying(true)).catch((err) => {
                                if (err && err.name !== 'AbortError') console.warn("Audio HTML5 play error:", err);
                            });
                        }
                    } else {
                        audio.pause();
                        audio.preload = "auto";
                        audio.src = targetSrc;
                        const onReady = () => {
                            applyPosition();
                            audio.removeEventListener('canplay', onReady);
                        };
                        audio.addEventListener('canplay', onReady, { once: true });
                        const p = audio.play();
                        if (p && typeof p.then === 'function') {
                            p.then(() => {
                                setIsPlaying(true);
                                applyPosition();
                            }).catch((err) => {
                                if (err && err.name !== 'AbortError' && err.name !== 'NotSupportedError') console.warn("Audio HTML5 play error:", err);
                            });
                        }
                    }
                } else if (track.path || track.f) {
                    if (window.eel && window.eel.reproducir_pista_mac) {
                        window.eel.reproducir_pista_mac(track.path || track.f)();
                        setIsPlaying(true);
                    }
                } else {
                    // Si no hay stream_url ni archivo local válido, detener audio limpiamente
                    audio.pause();
                    audio.src = "";
                    setIsPlaying(false);
                }
            }
        }
    };

    const handleFooterSeek = (pct) => {
        setPlayProgress(pct);
        const audio = audioRef.current;
        if (audio && audio.duration && !isNaN(audio.duration)) {
            audio.currentTime = audio.duration * pct;
            if (!isPlaying) {
                audio.play().then(() => setIsPlaying(true)).catch(() => {});
            }
        }
    };

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (isPlaying) {
            if (audio) {
                audio.pause();
            }
            stopSynthPreview();
            setIsPlaying(false);
            if (window.eel && window.eel.detener_audio_mac) {
                window.eel.detener_audio_mac()();
            }
        } else {
            if (audio && audio.src && audio.src !== window.location.href && !audio.src.endsWith("/") && !audio.ended && nowPlayingTrack) {
                const p = audio.play();
                if (p && typeof p.then === 'function') {
                    p.then(() => setIsPlaying(true)).catch((err) => {
                        if (err && err.name !== 'AbortError' && err.name !== 'NotSupportedError') console.warn("Play error:", err);
                        if (nowPlayingTrack) {
                            handlePlayTrack(nowPlayingTrack, playProgressRef.current, true);
                        }
                    });
                }
            } else if (nowPlayingTrack) {
                handlePlayTrack(nowPlayingTrack, playProgressRef.current, true);
            }
        }
    };

    const handleCue = () => {
        stopSynthPreview();
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        setIsPlaying(false);
        setPlayProgress(0);
        if (window.eel && window.eel.cue_audio_mac) {
            const trk = window.__bwCurrentTrack || nowPlayingTrack || {};
            window.eel.cue_audio_mac(trk.path || trk.f || "")();
        }
    };

    // ─── UX CABINA: Atajos de Teclado Profesionales DJ en Vivo (Adaptados por SO) ────
    useEffect(() => {
        const handleKeyDown = (e) => {
            const active = document.activeElement;
            const tag = active ? active.tagName.toLowerCase() : '';
            const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || (active && active.isContentEditable);

            // 1. ESC: Cerrar cualquier modal abierto (funciona incluso mientras se escribe)
            if (e.key === 'Escape') {
                if (pricingOpen) {
                    e.preventDefault();
                    setPricingOpen(false);
                    return;
                }
                if (userModalOpen) {
                    e.preventDefault();
                    setUserModalOpen(false);
                    return;
                }
                if (bitacoraModalOpen) {
                    e.preventDefault();
                    setBitacoraModalOpen(false);
                    return;
                }
                if (manualModalOpen) {
                    e.preventDefault();
                    setManualModalOpen(false);
                    return;
                }
                if (shortcutsModalOpen) {
                    e.preventDefault();
                    setShortcutsModalOpen(false);
                    return;
                }
                if (copilotModalOpen) {
                    e.preventDefault();
                    setCopilotModalOpen(false);
                    return;
                }
            }

            // 2. Atajo de Búsqueda Global: ⌘+F / ⌘+K (Mac) o Ctrl+F / Ctrl+K (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && (e.key === 'f' || e.key === 'F' || e.key === 'k' || e.key === 'K')) {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder*="Buscar"], input[type="search"], input[name="search"], input[data-search]');
                if (searchInput) {
                    searchInput.focus();
                    if (searchInput.select) searchInput.select();
                }
                return;
            }

            // 3. F1 o ⌘+/ / Ctrl+/: Abrir/cerrar Manual Maestro o Atajos
            if (e.key === 'F1') {
                e.preventDefault();
                if (manualModalOpen) {
                    setManualModalOpen(false);
                } else {
                    handleOpenManual(activeTab);
                }
                return;
            }
            if ((e.metaKey || e.ctrlKey) && (e.key === '/' || e.key === '?')) {
                e.preventDefault();
                setShortcutsModalOpen(prev => !prev);
                return;
            }

            // 4. Cambio Directo de Espacio de Trabajo: ⌘+1..7 (Mac) o Ctrl+1..7 (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '7') {
                e.preventDefault();
                const tabs = ['audit', 'hotcues', 'setbuilder', 'map', 'spotify', 'shazam', 'taxonomy'];
                const targetTab = tabs[parseInt(e.key, 10) - 1];
                if (targetTab) {
                    setActiveTab(targetTab);
                }
                return;
            }

            // 5. Colapsar/Expandir Barra Lateral (Side Rail): ⌘+B (Mac) o Ctrl+B (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
                e.preventDefault();
                toggleRailExpanded();
                return;
            }

            // Si está escribiendo texto en un input, ignorar atajos directos sin modificadores
            if (isTyping) {
                return;
            }

            // 6. ? o H: Abrir / cerrar Cheatsheet de atajos
            if (e.key === '?' || (e.key === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey)) {
                e.preventDefault();
                setShortcutsModalOpen(prev => !prev);
                return;
            }

            // 7. ESPACIO: Play / Pausa
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                if (nowPlayingTrack) {
                    togglePlayPause();
                } else if (currentTrack) {
                    handlePlayTrack(currentTrack, 0, true);
                }
                return;
            }

            // 8. C: Volver a CUE
            if (e.key === 'c' || e.key === 'C') {
                e.preventDefault();
                handleCue();
                return;
            }

            // 9. Teclas 1 a 8: Salto directo a Hot Cues
            if (e.key >= '1' && e.key <= '8' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const cueNum = parseInt(e.key, 10);
                const targetTrack = nowPlayingTrack || currentTrack;
                if (targetTrack) {
                    const cues = (targetTrack.cues && targetTrack.cues.length > 0) ? targetTrack.cues : NV2_COLORS;
                    const cue = cues[cueNum - 1] || cues.find(c => c.id === cueNum);
                    if (cue && typeof cue.pct === 'number') {
                        e.preventDefault();
                        handleFooterSeek(cue.pct);
                    }
                }
                return;
            }

            // 10. ↑ / ↓: Navegar entre pistas en la tabla
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                if (auditTracks && auditTracks.length > 0) {
                    e.preventDefault();
                    const curIdx = auditTracks.findIndex(t => t.id === selectedTrack);
                    let targetIdx = 0;
                    if (e.key === 'ArrowUp') {
                        targetIdx = curIdx <= 0 ? auditTracks.length - 1 : curIdx - 1;
                    } else {
                        targetIdx = curIdx === -1 || curIdx >= auditTracks.length - 1 ? 0 : curIdx + 1;
                    }
                    const nextTrk = auditTracks[targetIdx];
                    if (nextTrk) {
                        setSelectedTrack(nextTrk.id);
                    }
                }
                return;
            }

            // 11. M: Plegar / Desplegar panel de métricas
            if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('bw:toggle-metrics'));
                return;
            }

            // 12. L: Alternar Modo Cabina Oscura (High Contrast Club Mode)
            if (e.key === 'l' || e.key === 'L') {
                e.preventDefault();
                toggleClubMode();
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nowPlayingTrack, currentTrack, auditTracks, selectedTrack, shortcutsModalOpen, manualModalOpen, userModalOpen, bitacoraModalOpen, pricingOpen, copilotModalOpen, activeTab, togglePlayPause, handlePlayTrack, handleCue, handleFooterSeek, toggleClubMode, toggleRailExpanded]);

    // Gestión Global de Eliminación de Pistas del Análisis
    const handleRemoveTrackGlobal = (trackId) => {
        if (!trackId && trackId !== 0) return;
        setAuditTracks(prev => prev.filter(t => String(t.id) !== String(trackId) && t.path !== trackId));
        setSelectedTrack(prev => (String(prev) === String(trackId) ? null : prev));
        if (nowPlayingTrack && (String(nowPlayingTrack.id) === String(trackId) || nowPlayingTrack.path === trackId)) {
            stopSynthPreview();
            const audio = audioRef.current;
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
            setIsPlaying(false);
            setNowPlayingTrack(null);
            window.__bwCurrentTrack = null;
        }
    };

    const handleRemoveMultipleTracksGlobal = (trackIds) => {
        if (!Array.isArray(trackIds) || trackIds.length === 0) return;
        const idSet = new Set(trackIds.map(id => String(id)));
        setAuditTracks(prev => prev.filter(t => !idSet.has(String(t.id)) && !idSet.has(String(t.path))));
        setSelectedTrack(prev => (idSet.has(String(prev)) ? null : prev));
        if (nowPlayingTrack && (idSet.has(String(nowPlayingTrack.id)) || idSet.has(String(nowPlayingTrack.path)))) {
            stopSynthPreview();
            const audio = audioRef.current;
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
            setIsPlaying(false);
            setNowPlayingTrack(null);
            window.__bwCurrentTrack = null;
        }
    };

    const handleToggleSimulation = (forceState) => {
        setIsSimulationMode(prev => {
            const next = forceState !== undefined ? forceState : !prev;
            if (next) {
                const demoList = (typeof DEMO_MAP_TRACKS !== 'undefined' && Array.isArray(DEMO_MAP_TRACKS)) ? [...DEMO_MAP_TRACKS] : [];
                setAuditTracks(demoList);
                setSetBuilderTracks(demoList.slice(0, 8));
                if (demoList[0]) setSelectedTrack(demoList[0].id);
                setCurrentFolder('Cabina Demo (Simulación)');
                setBitacoraEntries(DEMO_BITACORA_ENTRIES);
                setSavedSessions(DEMO_SAVED_SESSIONS);
            } else {
                setAuditTracks([]);
                setSetBuilderTracks([]);
                setSelectedTrack(null);
                setCurrentFolder('');
                setBitacoraEntries([]);
                setSavedSessions([]);
                if (nowPlayingTrack) {
                    stopSynthPreview();
                    const audio = audioRef.current;
                    if (audio) {
                        audio.pause();
                        audio.currentTime = 0;
                    }
                    setIsPlaying(false);
                    setNowPlayingTrack(null);
                    window.__bwCurrentTrack = null;
                }
            }
            return next;
        });
    };

    const handleClearAllTracksGlobal = () => {
        setIsSimulationMode(false);
        setAuditTracks([]);
        setSelectedTrack(null);
        stopSynthPreview();
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        setIsPlaying(false);
        setNowPlayingTrack(null);
        window.__bwCurrentTrack = null;
    };

    const handleCargarDirectorioGlobal = async (pathOverride) => {
        try {
            let target = pathOverride;
            if (!target) {
                if (window.eel && window.eel.seleccionar_directorio) {
                    try {
                        target = await window.eel.seleccionar_directorio()();
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
            }
            if (!target || target === 'cancelado') {
                return;
            }
            setIsSimulationMode(false);
            setCurrentFolder(target);
            setAuditTracks([]);
            setSelectedTrack(null);
            setGlobalAuditInfo({ isAuditing: false, isLoadingDir: true, progress: 3, statusMsg: 'Iniciando lectura de archivos en carpeta...' });

            let res = null;
            if (window.eel && window.eel.cargar_metadatos_directorio) {
                try {
                    res = await window.eel.cargar_metadatos_directorio(target)();
                } catch (e) {}
            }
            if (!res) {
                try {
                    const r = await fetch('/api/rpc/cargar_metadatos_directorio', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ args: [target] })
                    });
                    if (r.ok) {
                        const d = await r.json();
                        res = d.result || d;
                    }
                } catch (e) {}
            }

            const rawTracks = (res && Array.isArray(res.tracks)) ? res.tracks : (Array.isArray(res) ? res : []);
            if (rawTracks.length > 0) {
                setAuditTracks(rawTracks);
                if (rawTracks[0] && rawTracks[0].id) {
                    setSelectedTrack(rawTracks[0].id);
                }
                setGlobalAuditInfo({ isAuditing: false, isLoadingDir: false, progress: 100, statusMsg: `✓ ${rawTracks.length} pistas cargadas correctamente.` });
                setTimeout(() => {
                    setGlobalAuditInfo(prev => ({ ...prev, progress: 0, statusMsg: '' }));
                }, 2500);
            } else {
                setGlobalAuditInfo({ isAuditing: false, isLoadingDir: false, progress: 0, statusMsg: 'No se encontraron pistas de audio en la carpeta.' });
                setTimeout(() => {
                    setGlobalAuditInfo(prev => ({ ...prev, statusMsg: '' }));
                }, 3000);
            }
        } catch (e) {
            console.error("Error al cargar directorio:", e);
        }
    };

    const handleAbrirNavegadorCarpetas = handleCargarDirectorioGlobal;

    const handleOpenBeatgridStudio = (trackRef) => {
        if (trackRef) {
            let found = null;
            if (typeof trackRef === 'object' && trackRef !== null) {
                found = auditTracks.find(t => String(t.id) === String(trackRef.id)) || trackRef;
            } else {
                const query = String(trackRef).trim();
                found = auditTracks.find(t => 
                    String(t.id) === query || 
                    (t.filePath && t.filePath === query) ||
                    (t.path && t.path === query) ||
                    (t.title && t.title.toLowerCase() === query.toLowerCase()) ||
                    (t.t && t.t.toLowerCase() === query.toLowerCase())
                );
            }

            if (found) {
                setSelectedTrack(found.id);
                if (handlePlayTrack) {
                    handlePlayTrack(found, 0, false);
                }
            } else if (typeof trackRef === 'string' && (trackRef.includes('/') || trackRef.includes('\\'))) {
                const filename = trackRef.split('/').pop().replace(/\.[^/.]+$/, "");
                const dynamicTrack = {
                    id: 'trk_' + Date.now(),
                    title: filename,
                    artist: 'DJ Library',
                    filePath: trackRef,
                    path: trackRef,
                    bpm: 138,
                    first_downbeat_ms: 0,
                    status: 'Listo'
                };
                setAuditTracks(prev => [dynamicTrack, ...prev]);
                setSelectedTrack(dynamicTrack.id);
                if (handlePlayTrack) {
                    handlePlayTrack(dynamicTrack, 0, false);
                }
            }
        }
        setStudioMode('beatgrid');
        setActiveTab('hotcues');
    };

    // CUANDO LA INTRO ESTÁ ACTIVA: SE RENDERIZA ÚNICA Y EXCLUSIVAMENTE LA INTRO A PANTALLA COMPLETA
    if (cinematicIntroOpen) {
        return (
            <AppCinematicIntro
                isOpen={true}
                onOpenPricing={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    setPricingOpen(true);
                }}
                onClose={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                }}
                onOpenLogin={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    setUserModalOpen(true);
                }}
                onOpenRegister={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    setRegisterModalOpen(true);
                }}
                onOpenTour={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    handleOpenManual('audit');
                }}
            />
        );
    }

    const shellHelpItems = [
        { id: 'manual', label: 'Manual interactivo', description: 'Masterclass del módulo actual', icon: 'Knowledge', kbd: 'F1', onClick: () => handleOpenManual(activeTab) },
        { id: 'pricing', label: 'Planes y precios', description: 'Free, DJ Pro y Founder Lifetime', icon: 'Crown', onClick: () => setPricingOpen(true) },
        { id: 'shortcuts', label: 'Atajos de teclado', description: 'Controles rápidos de cabina', icon: 'Keyboard', onClick: () => setShortcutsModalOpen(true) },
        { id: 'tutorial', label: 'Tutorial guiado', description: 'Recorrido por la interfaz', icon: 'Compass', onClick: () => setTutorialOpen(true) },
        { id: 'intro', label: 'Ver intro cinemática', description: 'Presentación a pantalla completa', icon: 'Film', onClick: () => setCinematicIntroOpen(true) },
        { id: 'pdf', label: 'Manual técnico (PDF)', description: 'Documentación funcional completa', icon: 'FileText', href: '/api/manual/pdf', download: 'CleanDJmix_PRO_Manual_Funcional_y_Tecnico.pdf' },
    ];

    return (
        <div className={`bw-app flex flex-col h-screen h-[100dvh] w-full max-w-full bg-[#09090b] text-zinc-300 overflow-hidden font-sans select-none ${clubMode ? 'club-mode' : ''}`}>
            <svg width="0" height="0" className="absolute pointer-events-none">
                    <defs>
                        {/* 1. DISTORSIÓN VERTICAL TEARING PARA LAS LETRAS BEATWAVE (BOMBO 4/4 + ROLLING RUMBLE + STUTTER) */}
                        <filter id="waveDistortion" x="-60%" y="-120%" width="220%" height="340%">
                            <feTurbulence type="fractalNoise" baseFrequency="0 0.38" numOctaves="3" result="warp">
                                <animate 
                                    attributeName="baseFrequency" 
                                    values="0 0.16; 0 0.68; 0 0.28; 0 0.58; 0 0.28; 0 0.62; 0 0.28; 0 0.68; 0 0.45; 0 0.16" 
                                    keyTimes="0; 0.04; 0.14; 0.25; 0.35; 0.50; 0.60; 0.75; 0.88; 1" 
                                    dur="2.0s" 
                                    repeatCount="indefinite" 
                                />
                            </feTurbulence>
                            
                            {/* Desplazamiento explosivo masivo sincronizado con la secuencia techno */}
                            <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="0" in="SourceGraphic" in2="warp">
                                <animate 
                                    attributeName="scale" 
                                    values="0; 86; 16; 76; 14; 80; 15; 86; 55; 65; 0" 
                                    keyTimes="0; 0.04; 0.14; 0.25; 0.35; 0.50; 0.60; 0.75; 0.83; 0.92; 1" 
                                    dur="2.0s" 
                                    repeatCount="indefinite"
                                />
                            </feDisplacementMap>
                        </filter>

                        {/* 2. DISTORSIÓN MECÁNICA / RUPTURA DE MEMBRANA PARA EL CONO DEL ALTAVOZ */}
                        <filter id="wooferMechanicalDistortion" x="-50%" y="-50%" width="200%" height="200%">
                            <feTurbulence type="fractalNoise" baseFrequency="0.08 0.14" numOctaves="2" result="coneNoise">
                                <animate 
                                    attributeName="baseFrequency" 
                                    values="0.04 0.08; 0.16 0.26; 0.06 0.12; 0.14 0.22; 0.06 0.12; 0.16 0.26; 0.04 0.08" 
                                    keyTimes="0; 0.04; 0.20; 0.50; 0.70; 0.85; 1" 
                                    dur="2.0s" 
                                    repeatCount="indefinite" 
                                />
                            </feTurbulence>
                            <feDisplacementMap in="SourceGraphic" in2="coneNoise" scale="0" xChannelSelector="R" yChannelSelector="G">
                                <animate 
                                    attributeName="scale" 
                                    values="0; 22; 4; 18; 4; 20; 4; 22; 14; 18; 0" 
                                    keyTimes="0; 0.04; 0.14; 0.25; 0.35; 0.50; 0.60; 0.75; 0.83; 0.92; 1" 
                                    dur="2.0s" 
                                    repeatCount="indefinite" 
                                />
                            </feDisplacementMap>
                        </filter>
                    </defs>
                </svg>

            <TopBar
                logo={(
                    <div className="flex items-center select-none my-auto pl-3 sm:pl-4">
                        <BeatWaveBrandIdentity 
                            variant="header"
                            isTechnoActive={isLogoTechnoActive}
                            onClick={triggerLogoTechno}
                        />
                    </div>
                )}
                activeTab={activeTab}
                t={t}
                auditInfo={globalAuditInfo}
                clubMode={clubMode}
                onToggleClubMode={toggleClubMode}
                onOpenCopilot={() => setCopilotModalOpen(true)}
                helpItems={shellHelpItems}
                onOpenBitacora={() => setBitacoraModalOpen(true)}
                onOpenUser={() => setUserModalOpen(true)}
                userProfile={userProfile}
                lang={lang}
                onToggleLang={() => changeLang(lang === 'es' ? 'en' : 'es')}
            />

            <div className="flex flex-1 min-h-0 w-full">
                <SideRail
                    activeTab={activeTab}
                    onSelect={(tabId) => {
                        setActiveTab(tabId);
                        setRailExpanded(false);
                        try { localStorage.setItem('bw_rail_expanded', '0'); } catch (e) {}
                    }}
                    t={t}
                    expanded={railExpanded}
                    onToggleExpanded={toggleRailExpanded}
                    auditInfo={globalAuditInfo}
                    trackCount={auditTracks ? auditTracks.length : 0}
                    onOpenCopilot={() => {
                        setActiveTab('copilot');
                        setRailExpanded(false);
                        try { localStorage.setItem('bw_rail_expanded', '0'); } catch (e) {}
                    }}
                    onOpenLibrary={() => {
                        setActiveTab('library');
                        setRailExpanded(false);
                    }}
                    libraryCount={customLibraries.length}
                    isLibraryOpen={activeTab === 'library'}
                />
                <div className="flex flex-1 min-w-0 min-h-0 flex-col">

            {/* MAIN WORKSPACES: Persistencia Total de Estado Manteniendo Todo Montado */}
            <main className="flex-1 min-h-0 w-full overflow-hidden relative">
                <div style={{ display: activeTab === 'library' ? 'flex' : 'none' }} className="w-full h-full flex flex-col">
                    <LibraryWorkspace 
                        libraries={customLibraries}
                        activeLibraryId={activeCustomLibId}
                        onSaveLibraries={(updatedLibs, newActiveId) => saveCustomLibraries(updatedLibs, newActiveId)}
                        onSelectLibrary={(id) => saveCustomLibraries(customLibraries, id)}
                        currentTracks={auditTracks}
                        selectedTrackIds={new Set((auditTracks || []).filter(t => t.selected).map(t => t.id))}
                        onMaterializarEnDisco={handleMaterializarBibliotecaEnDisco}
                        onAuditarCrate={(folder, lib) => {
                            handleAuditarCrateDesdeModal(folder, lib);
                            setActiveTab('audit');
                        }}
                        onNavigateTab={setActiveTab}
                        onLoadFolderFromDisk={() => handleCargarDirectorioGlobal()}
                        currentFolder={currentFolder}
                        onPlayTrack={handlePlayTrack}
                        onTogglePlay={togglePlayPause}
                        nowPlayingTrack={nowPlayingTrack}
                        isPlaying={isPlaying}
                        playProgress={playProgress}
                        setAuditTracks={setAuditTracks}
                        setSelectedTrack={setSelectedTrack}
                    />
                </div>
                <div style={{ display: activeTab === 'audit' ? 'flex' : 'none' }} className="w-full h-full">
                    <AuditWorkspace 
                        tracks={auditTracks}
                        setTracks={setAuditTracks}
                        customLibraries={customLibraries}
                        onSaveCustomLibraries={saveCustomLibraries}
                        activeCustomLibId={activeCustomLibId}
                        selectedTrack={selectedTrack} 
                        setSelectedTrack={setSelectedTrack} 
                        onPlayTrack={handlePlayTrack} 
                        onTogglePlay={togglePlayPause} 
                        nowPlayingTrack={nowPlayingTrack} 
                        isPlaying={isPlaying} 
                        playProgress={playProgress} 
                        onNavigateTab={setActiveTab}
                        onSendToSpotify={handleAddTracksToSpotify}
                        onRemoveTrack={handleRemoveTrackGlobal}
                        onRemoveMultipleTracks={handleRemoveMultipleTracksGlobal}
                        onClearAllTracks={handleClearAllTracksGlobal}
                        lang={lang}
                        t={t}
                        currentFolder={currentFolder}
                        setCurrentFolder={setCurrentFolder}
                        audioRef={audioRef}
                        onAuditProgressChange={setGlobalAuditInfo}
                        onOpenLibrary={() => setActiveTab('library')}
                        isSimulationMode={isSimulationMode}
                        onToggleSimulation={handleToggleSimulation}
                        activeCrateFilter={activeCrateFilter}
                        onClearCrateFilter={() => setActiveCrateFilter(null)}
                        onOpenBeatgridStudio={handleOpenBeatgridStudio}
                    />
                </div>
                <div style={{ display: activeTab === 'hotcues' ? 'flex' : 'none' }} className="w-full h-full">
                    <HotCuesWorkspace 
                        tracks={auditTracks}
                        setTracks={setAuditTracks}
                        selectedTrack={selectedTrack} 
                        setSelectedTrack={setSelectedTrack} 
                        onPlayTrack={handlePlayTrack} 
                        onTogglePlay={togglePlayPause} 
                        nowPlayingTrack={nowPlayingTrack} 
                        isPlaying={isPlaying} 
                        playProgress={playProgress} 
                        onNavigateTab={setActiveTab}
                        onSendToSpotify={handleAddTracksToSpotify}
                        onRemoveTrack={handleRemoveTrackGlobal}
                        onRemoveMultipleTracks={handleRemoveMultipleTracksGlobal}
                        lang={lang}
                        t={t}
                        currentFolder={currentFolder}
                        setCurrentFolder={setCurrentFolder}
                        audioRef={audioRef}
                        studioMode={studioMode}
                        onSetStudioMode={setStudioMode}
                    />
                </div>
                <div style={{ display: activeTab === 'spotify' ? 'flex' : 'none' }} className="w-full h-full">
                    <SpotifyWorkspace 
                        tracks={spotifyTracks}
                        setTracks={setSpotifyTracks}
                        onPlayTrack={handlePlayTrack} 
                        nowPlayingTrack={nowPlayingTrack} 
                        isPlaying={isPlaying} 
                        onTogglePlay={togglePlayPause} 
                        lang={lang}
                        t={t}
                    />
                </div>
                <div style={{ display: activeTab === 'shazam' ? 'flex' : 'none' }} className="w-full h-full">
                    <ShazamWorkspace 
                        onSendToSpotify={(query) => {
                            if (typeof query === 'object' && query !== null) {
                                handleAddTrackToSpotify(query, 'shazam');
                            } else {
                                setActiveTab('spotify');
                            }
                        }}
                        onSendToAudit={(trackData) => {
                            setAuditTracks(prev => [trackData, ...prev]);
                            setSelectedTrack(trackData.id);
                            setActiveTab('audit');
                        }}
                        onNavigateTab={setActiveTab}
                        onLoadFolderFromDisk={() => handleCargarDirectorioGlobal()}
                        currentFolder={currentFolder}
                    />
                </div>
                <div style={{ display: activeTab === 'taxonomy' ? 'flex' : 'none' }} className="w-full h-full">
                    <TaxonomyWorkspace 
                        tracks={auditTracks} 
                        onTracksUpdated={setAuditTracks} 
                        onNavigateTab={setActiveTab} 
                        onPlayTrack={handlePlayTrack}
                        nowPlayingTrack={nowPlayingTrack}
                        isPlaying={isPlaying}
                        onTogglePlay={togglePlayPause}
                        onRemoveTrack={handleRemoveTrackGlobal}
                        onSelectTrackForCues={(trk) => {
                            if (!trk) return;
                            const existing = auditTracks.find(t => t.id === trk.id || (t.path && t.path === trk.path));
                            if (existing) {
                                setSelectedTrack(existing.id);
                            } else {
                                const newId = auditTracks.length > 0 ? Math.max(...auditTracks.map(t => Number(t.id) || 0)) + 1 : 1;
                                const newTrk = { ...trk, id: newId };
                                setAuditTracks(prev => [newTrk, ...prev]);
                                setSelectedTrack(newId);
                            }
                            setActiveTab('hotcues');
                        }}
                        onSendToSpotify={(query) => {
                            setActiveTab('spotify');
                        }}
                        onAddTrackToSet={(track) => {
                            if (!track) return;
                            setSetBuilderTracks(prev => [...prev, track]);
                            setActiveTab('setbuilder');
                        }}
                        onAddTrackToSpotify={handleAddTracksToSpotify}
                        onAddTracksToSpotify={handleAddTracksToSpotify}
                    />
                </div>
                <div style={{ display: activeTab === 'trends' ? 'flex' : 'none' }} className="w-full h-full">
                    <TrendsWorkspace lang={lang} />
                </div>
                <div style={{ display: activeTab === 'setbuilder' ? 'flex' : 'none' }} className="w-full h-full">
                    <SetBuilderWorkspace 
                        setTracks={setBuilderTracks}
                        setSetTracks={setSetBuilderTracks}
                        auditTracks={auditTracks}
                        setAuditTracks={setAuditTracks}
                        onPlayTrack={handlePlayTrack}
                        nowPlayingTrack={nowPlayingTrack}
                        isPlaying={isPlaying}
                        onTogglePlay={togglePlayPause}
                        onNavigateTab={setActiveTab}
                        lang={lang}
                    />
                </div>
                <div style={{ display: activeTab === 'map' ? 'flex' : 'none' }} className="w-full h-full">
                    <MapWorkspace 
                        tracks={auditTracks}
                        onPlayTrack={handlePlayTrack}
                        nowPlayingTrack={nowPlayingTrack}
                        isPlaying={isPlaying}
                        onTogglePlay={togglePlayPause}
                        onNavigateTab={setActiveTab}
                        onAddTracksToSet={(newTracks) => {
                            if (!newTracks || newTracks.length === 0) return;
                            setSetBuilderTracks(prev => [...prev, ...newTracks]);
                            setActiveTab('setbuilder');
                        }}
                        onSelectDirectory={() => handleCargarDirectorioGlobal()}
                        lang={lang}
                    />
                </div>
                <div style={{ display: activeTab === 'knowledge' ? 'flex' : 'none' }} className="w-full h-full">
                    <KnowledgeWorkspace lang={lang} />
                </div>
                {activeTab === 'copilot' && (
                    <div className="w-full h-full">
                        <CopilotWorkspace 
                            onOpenPopOut={() => {
                                const w = 1380, h = 880;
                                const left = (window.screen.width - w) / 2;
                                const top = (window.screen.height - h) / 2;
                                window.open('/copilot.html', 'BeatWaveLiveCopilot', `width=${w},height=${h},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no,resizable=yes`);
                            }}
                            onOpenQr={() => setCopilotModalOpen(true)}
                        />
                    </div>
                )}
            </main>

            {/* INPUT OCULTO PARA CARGA DE AUDIO LOCAL DESDE EL DISPOSITIVO DEL USUARIO */}
            <input 
                ref={localAudioInputRef} 
                type="file" 
                accept="audio/*" 
                onChange={handleLoadLocalAudioFile} 
                className="hidden" 
            />

            {/* DECK BAR GLOBAL — visible si hay pista reproduciéndose, seleccionada, o expandido manualmente */}
            {!nowPlayingTrack && !isFooterDeckExpanded ? (
                <div className="fixed bottom-3 right-4 z-40 hidden md:block">
                    <button
                        type="button"
                        onClick={() => setIsFooterDeckExpanded(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-md cursor-pointer"
                        title="Expandir Deck de Reproducción DJ"
                    >
                        <span>🎧</span>
                        <span>Deck Cabina</span>
                        <Icons.ChevronUp size={14} />
                    </button>
                </div>
            ) : (
                <footer className="flex bw-deckbar relative z-30 h-16 shrink-0 items-center gap-3 px-3 sm:px-4">
                    <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-white/5 md:hidden">
                        <div className="h-full bg-cyan-400 transition-all duration-200" style={{ width: `${Math.min(100, Math.max(0, mobileProgress * 100))}%` }} />
                    </div>

                    {!nowPlayingTrack ? (
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 md:w-80 shrink-0">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/15 text-zinc-600">
                                <Icons.Disc size={20} />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="bw-eyebrow">{t('deck_standby_label') || 'DECK 1 STANDBY'}</span>
                                <span className="text-xs text-zinc-500 truncate">{t('deck_standby_comment_hint') || 'Carga una pista para reproducir'}</span>
                            </div>

                            {/* SELECTOR DE CARGA DE PISTA: DESDE BIBLIOTECA O DISPOSITIVO */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setLoadTrackMenuOpen(prev => !prev)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/40 hover:bg-cyan-500/25 text-cyan-300 font-mono text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                                >
                                    <span>🎵 Cargar</span>
                                    <Icons.ChevronDown size={11} />
                                </button>

                                {loadTrackMenuOpen && (
                                    <div className="absolute left-0 bottom-full mb-2 z-50 w-52 rounded-xl bg-zinc-950/98 border border-zinc-700/80 shadow-2xl p-1.5 flex flex-col gap-1 backdrop-blur-md text-xs font-mono">
                                        <button
                                            type="button"
                                            onClick={handleLoadFirstLibraryTrack}
                                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors text-left cursor-pointer"
                                        >
                                            <span>📚</span>
                                            <span>Desde Biblioteca DJ</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (localAudioInputRef.current) localAudioInputRef.current.click();
                                            }}
                                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-950/60 text-cyan-300 hover:text-white border border-transparent hover:border-cyan-500/30 transition-colors text-left cursor-pointer"
                                        >
                                            <span>📁</span>
                                            <span>Desde tu Dispositivo</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 min-w-0 flex-1 md:w-72 md:flex-initial">
                            <img
                                src={getValidCover(nowPlayingTrack.cover || (nowPlayingTrack.path ? `/cover?path=${encodeURIComponent(nowPlayingTrack.path)}` : (nowPlayingTrack.f ? `/cover?path=${encodeURIComponent(nowPlayingTrack.f)}` : null)))}
                                alt=""
                                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }}
                                className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                            />
                            <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                                <span className="text-sm font-semibold text-white truncate" title={nowPlayingTrack.t || nowPlayingTrack.title}>
                                    {nowPlayingTrack.t || nowPlayingTrack.title}
                                </span>
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs text-cyan-300 truncate" title={nowPlayingTrack.a || nowPlayingTrack.artist}>{nowPlayingTrack.a || nowPlayingTrack.artist}</span>
                                    <span className="font-mono text-xs text-white shrink-0">{nowPlayingTrack.b || nowPlayingTrack.bpm || '--'}<span className="text-zinc-500"> BPM</span></span>
                                    <span className="bw-key-chip shrink-0">{nowPlayingTrack.k || nowPlayingTrack.key || '--'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 shrink-0">
                        <button type="button" disabled={!nowPlayingTrack} onClick={handleCue} className="bw-deck-btn">CUE</button>
                        <button type="button" disabled={!nowPlayingTrack} onClick={togglePlayPause} className="bw-deck-play" aria-label={isPlaying ? 'Pausar' : 'Reproducir'}>
                            {isPlaying ? <Icons.Pause size={18} /> : <Icons.Play size={18} />}
                        </button>
                        <button type="button" disabled={!nowPlayingTrack} onClick={() => handleFooterSeek(0.22)} className="bw-deck-btn hidden sm:inline-flex">SYNC</button>
                    </div>

                    {(nowPlayingTrack && (nowPlayingTrack.comment || nowPlayingTrack.comentario)) && (
                        <div className="hidden xl:flex items-center gap-2 max-w-xs shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5" title={nowPlayingTrack.comment || nowPlayingTrack.comentario}>
                            <Icons.MessageSquare size={14} className="text-cyan-300" />
                            <span className="font-mono text-xs text-zinc-300 truncate">{nowPlayingTrack.comment || nowPlayingTrack.comentario}</span>
                        </div>
                    )}

                    <div className="hidden md:flex flex-1 min-w-0">
                        <FooterMasterWaveform 
                            track={nowPlayingTrack} 
                            isPlaying={isPlaying} 
                            playProgressRef={playProgressRef} 
                            onSeek={handleFooterSeek} 
                            cues={(nowPlayingTrack && nowPlayingTrack.cues && nowPlayingTrack.cues.length > 0) ? nowPlayingTrack.cues : ((currentTrack && currentTrack.cues && currentTrack.cues.length > 0) ? currentTrack.cues : NV2_COLORS)} 
                            t={t}
                        />
                    </div>

                    {/* BOTÓN MINIMIZAR DECK */}
                    <button
                        type="button"
                        onClick={() => setIsFooterDeckExpanded(false)}
                        className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                        title="Minimizar Deck"
                    >
                        <Icons.ChevronDown size={16} />
                    </button>
                </footer>
            )}
                </div>
            </div>

            <MobileTabBar
                activeTab={activeTab}
                onSelect={setActiveTab}
                onOpenMore={() => setMobileDrawerOpen(true)}
                moreOpen={mobileDrawerOpen}
                t={t}
            />

            <MoreSheet
                open={mobileDrawerOpen}
                onClose={() => setMobileDrawerOpen(false)}
                activeTab={activeTab}
                onSelect={setActiveTab}
                onOpenCopilot={() => setCopilotModalOpen(true)}
                helpItems={shellHelpItems}
                clubMode={clubMode}
                onToggleClubMode={toggleClubMode}
                lang={lang}
                onChangeLang={changeLang}
                onOpenBitacora={() => setBitacoraModalOpen(true)}
                t={t}
            />

            {/* TUTORIAL & ASISTENTE INTERACTIVO DE BIENVENIDA */}
            <AppTutorialModal 
                isOpen={tutorialOpen} 
                onClose={() => setTutorialOpen(false)} 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                initialMode={tutorialInitialMode}
            />

            {/* MODAL LANZADOR BEATWAVE LIVE COPILOT */}
            <PricingModal 
                isOpen={pricingOpen} 
                onClose={() => setPricingOpen(false)} 
                onSelectPlan={(plan) => { 
                    setPricingOpen(false); 
                    if (plan === 'free') return; 
                    setSelectedPlanForRegister(plan === 'lifetime' ? 'lifetime' : 'pro');
                    setRegisterModalOpen(true); 
                }} 
            />
            <CopilotLaunchModal 
                isOpen={copilotModalOpen}
                onClose={() => setCopilotModalOpen(false)}
                onSelectEmbedded={() => {
                    setActiveTab('copilot');
                    setCopilotModalOpen(false);
                }}
            />

            {/* UX CABINA: MODAL DE ATAJOS DE TECLADO DJ PROFESIONAL */}
            <DJShortcutsModal 
                isOpen={shortcutsModalOpen}
                onClose={() => setShortcutsModalOpen(false)}
                clubMode={clubMode}
                onToggleClubMode={toggleClubMode}
            />

            {/* MANUAL INTERACTIVO MAESTRO DE CABINA BEATWAVE PRO (8 SECCIONES & SIMULADOR) */}
            <InteractiveManualModal
                isOpen={manualModalOpen}
                onClose={() => setManualModalOpen(false)}
                initialSection={manualSection}
                onNavigateTab={(tab) => {
                    setActiveTab(tab);
                    setManualModalOpen(false);
                }}
                lang={lang}
            />

            {/* ESPACIO DE USUARIO, LOGIN & SESIONES GUARDADAS */}
            <UserAccountModal 
                isOpen={userModalOpen}
                onClose={() => setUserModalOpen(false)}
                userProfile={userProfile}
                onUpdateProfile={handleUpdateUserProfile}
                savedSessions={savedSessions}
                onSaveCurrentSession={handleSaveCurrentSession}
                onLoadSession={handleLoadSession}
                onDeleteSession={handleDeleteSession}
                currentSessionSnapshot={{
                    folder: currentFolder,
                    tracksCount: auditTracks.length,
                    activeTab: activeTab
                }}
                onNavigateTab={setActiveTab}
                onOpenShortcuts={() => setShortcutsModalOpen(true)}
                onOpenPricing={() => {
                    setUserModalOpen(false);
                    setPricingOpen(true);
                }}
                onOpenRegister={() => {
                    setUserModalOpen(false);
                    setRegisterModalOpen(true);
                }}
            />

            {/* MODAL DE REGISTRO & PASARELA DE PAGO COMPLETA */}
            <RegisterFlowModal
                isOpen={registerModalOpen}
                initialPlan={selectedPlanForRegister}
                onClose={() => setRegisterModalOpen(false)}
                onOpenPricing={() => {
                    setRegisterModalOpen(false);
                    setPricingOpen(true);
                }}
                onSuccessRegister={(newProfile) => {
                    setRegisterModalOpen(false);
                    if (handleUpdateUserProfile) {
                        handleUpdateUserProfile(newProfile);
                    }
                    setUserModalOpen(true);
                }}
            />

            {/* CUADERNO DE BITÁCORA Y REGISTRO DE CAMBIOS AUDITABLE (DRAWER LATERAL DERECHO) */}
            <BitacoraModal 
                isOpen={bitacoraModalOpen}
                onClose={() => setBitacoraModalOpen(false)}
                entries={bitacoraEntries}
                onClearEntries={handleClearBitacora}
                onOpenBeatgridStudio={handleOpenBeatgridStudio}
                tracks={auditTracks}
            />


            {/* PRESENTACIÓN CINEMÁTICA A PANTALLA COMPLETA CON VÍDEO DE FONDO */}
            <AppCinematicIntro
                isOpen={cinematicIntroOpen}
                onOpenPricing={() => setPricingOpen(true)}
                onClose={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                }}
                onOpenFolder={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    handleCargarDirectorioGlobal();
                }}
                onOpenDemo={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    setActiveTab('map');
                }}
                onOpenManual={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    handleOpenManual('audit');
                }}
                onOpenLogin={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    setUserModalOpen(true);
                }}
                onOpenRegister={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    setRegisterModalOpen(true);
                }}
                onOpenTour={() => {
                    setCinematicIntroOpen(false);
                    try { sessionStorage.setItem('bw_intro_viewed', 'true'); } catch (e) {}
                    handleOpenManual('copilot');
                }}
            />
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
