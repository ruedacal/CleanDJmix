import { ShellIcons as Icons } from './icons.jsx';

const { useState, useEffect, useRef } = React;

function useDismissable(open, setOpen) {
    const rootRef = useRef(null);
    useEffect(() => {
        if (!open) return undefined;
        const onPointer = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('pointerdown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, setOpen]);
    return rootRef;
}

export const WsButton = ({ icon: Icon, label, onClick, variant = 'ghost', disabled, title, badge, compact = false, className = '' }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title || label}
        aria-label={compact ? label : undefined}
        className={`ws-btn ws-btn-${variant} ${className}`}
    >
        {Icon && <Icon size={15} />}
        {label && <span className={compact ? 'sr-only' : 'ws-btn-label'}>{label}</span>}
        {badge !== undefined && badge !== null && <span className="ws-btn-badge">{badge}</span>}
    </button>
);

export const ToolbarDivider = () => <span className="ws-divider" aria-hidden="true" />;

export const ExportMenu = ({ targets, onSyncAll, onSaveTags, disabled, busy }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useDismissable(open, setOpen);
    const run = (fn) => { setOpen(false); fn && fn(); };

    return (
        <div className="relative" ref={rootRef}>
            <button
                type="button"
                className="ws-btn ws-btn-export"
                aria-haspopup="menu"
                aria-expanded={open}
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
            >
                <Icons.Upload size={15} />
                <span className="ws-btn-label">{busy ? 'Exportando...' : 'Exportar a cabina'}</span>
                <Icons.ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div role="menu" className="ws-menu right-0 w-72 bw-fade-in">
                    <p className="ws-menu-heading">Software de cabina</p>
                    {targets.map(({ id, label, ext, desc, Logo, onClick }) => (
                        <button key={id} type="button" role="menuitem" className="ws-menu-row" onClick={() => run(onClick)}>
                            <span className="ws-menu-logo">{Logo ? <Logo size={18} /> : <Icons.Excel size={16} />}</span>
                            <span className="flex flex-col min-w-0 text-left">
                                <span className="ws-menu-title">{label}</span>
                                <span className="ws-menu-desc">{desc}</span>
                            </span>
                            <span className="ws-menu-ext">{ext}</span>
                        </button>
                    ))}
                    <div className="ws-menu-sep" />
                    <button type="button" role="menuitem" className="ws-menu-row" onClick={() => run(onSyncAll)}>
                        <span className="ws-menu-logo text-[var(--bw-cyan)]"><Icons.Passport size={16} /></span>
                        <span className="flex flex-col min-w-0 text-left">
                            <span className="ws-menu-title">Pasaporte universal</span>
                            <span className="ws-menu-desc">Los 4 destinos en una pasada</span>
                        </span>
                    </button>
                    <button type="button" role="menuitem" className="ws-menu-row" onClick={() => run(onSaveTags)}>
                        <span className="ws-menu-logo"><Icons.Save size={16} /></span>
                        <span className="flex flex-col min-w-0 text-left">
                            <span className="ws-menu-title">Escribir tags en archivos</span>
                            <span className="ws-menu-desc">ID3 / Vorbis directamente en disco</span>
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
};

export const AddToCollectionMenu = ({ customLibraries = [], activeCustomLibId, onAddToFolder, onCreateAndAdd, selectedCount = 0, disabled = false }) => {
    const [open, setOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newCrateName, setNewCrateName] = useState('');
    const rootRef = useDismissable(open, (next) => {
        setOpen(next);
        if (!next) {
            setIsCreating(false);
            setNewCrateName('');
        }
    });

    const activeLib = (customLibraries || []).find((l) => l.id === activeCustomLibId) || (customLibraries && customLibraries[0]) || {
        id: 'lib_default',
        name: 'Mi Colección Principal',
        folders: []
    };

    const handleSelect = (folder) => {
        setOpen(false);
        setIsCreating(false);
        if (onAddToFolder) onAddToFolder(folder);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (!newCrateName.trim()) return;
        setOpen(false);
        setIsCreating(false);
        const name = newCrateName.trim();
        setNewCrateName('');
        if (onCreateAndAdd) onCreateAndAdd(name);
    };

    return (
        <div className="relative" ref={rootRef}>
            <button
                type="button"
                className="ws-btn ws-btn-ghost hover:text-cyan-400"
                aria-haspopup="menu"
                aria-expanded={open}
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                title="Llevar pistas a un Crate o carpeta de tu Colección"
            >
                <Icons.Plus size={15} />
                <span className="ws-btn-label">Llevar a Colección</span>
                <Icons.ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div role="menu" className="ws-menu left-0 w-80 bw-fade-in z-50 shadow-2xl">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                        <span className="ws-menu-heading !p-0">Crate de Destino</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
                            {selectedCount} {selectedCount === 1 ? 'pista' : 'pistas'}
                        </span>
                    </div>

                    <div className="max-h-56 overflow-y-auto py-1">
                        {activeLib.folders && activeLib.folders.length > 0 ? (
                            activeLib.folders.map((folder) => (
                                <button
                                    key={folder.id}
                                    type="button"
                                    role="menuitem"
                                    className="ws-menu-row w-full flex items-center justify-between hover:bg-white/5"
                                    onClick={() => handleSelect(folder)}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="text-cyan-400"><Icons.Folder size={15} /></span>
                                        <span className="ws-menu-title truncate text-xs">{folder.name}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-white/5 shrink-0 ml-2">
                                        {folder.tracks?.length || 0}
                                    </span>
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-xs text-zinc-500 font-mono italic">
                                No hay crates creados aún.
                            </div>
                        )}
                    </div>

                    <div className="ws-menu-sep" />

                    {isCreating ? (
                        <form onSubmit={handleCreate} className="p-2 flex flex-col gap-1.5 bg-black/40">
                            <input
                                type="text"
                                autoFocus
                                value={newCrateName}
                                onChange={(e) => setNewCrateName(e.target.value)}
                                placeholder="Nombre del nuevo crate..."
                                className="w-full px-2.5 py-1.5 text-xs bg-zinc-900 border border-cyan-500/60 rounded text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-400"
                            />
                            <div className="flex items-center justify-end gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => { setIsCreating(false); setNewCrateName(''); }}
                                    className="px-2 py-1 text-[10px] font-mono rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newCrateName.trim()}
                                    className="px-2.5 py-1 text-[10px] font-mono rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold disabled:opacity-50"
                                >
                                    Crear y Añadir
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            type="button"
                            role="menuitem"
                            className="ws-menu-row w-full flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                            onClick={() => setIsCreating(true)}
                        >
                            <Icons.Plus size={15} />
                            <span className="ws-menu-title text-xs">+ Crear nuevo Crate / Carpeta</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const TONE_DOT = {
    cyan: 'bg-[var(--bw-cyan)]',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    zinc: 'bg-zinc-500',
};

export const FilterMenu = ({ value, onChange, groups, allLabel = 'Todas las pistas', allCount = 0 }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useDismissable(open, setOpen);
    const flat = groups.flatMap((g) => g.options);
    const active = flat.find((o) => o.id === value);
    const isFiltered = value && value !== 'todos';

    return (
        <div className="relative flex items-center gap-1.5" ref={rootRef}>
            <button
                type="button"
                className={`ws-btn ${isFiltered ? 'ws-btn-active' : 'ws-btn-ghost'}`}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
            >
                <Icons.Filter size={14} />
                <span className="ws-btn-label">{isFiltered ? active?.label : 'Filtros'}</span>
                <span className={`ws-count ${isFiltered ? 'ws-count-on' : ''}`}>{isFiltered ? active?.count ?? 0 : allCount}</span>
                <Icons.ChevronDown size={14} />
            </button>
            {isFiltered && (
                <button type="button" className="ws-icon-btn" onClick={() => onChange('todos')} aria-label="Quitar filtro">
                    <Icons.Close size={14} />
                </button>
            )}

            {open && (
                <div role="menu" className="ws-menu left-0 w-64 bw-fade-in">
                    <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={!isFiltered}
                        className={`ws-menu-row ${!isFiltered ? 'ws-menu-row-on' : ''}`}
                        onClick={() => { onChange('todos'); setOpen(false); }}
                    >
                        <span className="ws-menu-title flex-1 text-left">{allLabel}</span>
                        <span className="ws-menu-ext">{allCount}</span>
                    </button>
                    {groups.map((group) => (
                        <div key={group.label}>
                            <p className="ws-menu-heading">{group.label}</p>
                            {group.options.map((opt) => {
                                const on = opt.id === value;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        role="menuitemradio"
                                        aria-checked={on}
                                        className={`ws-menu-row ${on ? 'ws-menu-row-on' : ''}`}
                                        onClick={() => { onChange(on ? 'todos' : opt.id); setOpen(false); }}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TONE_DOT[opt.tone] || TONE_DOT.zinc}`} aria-hidden="true" />
                                        <span className="ws-menu-title flex-1 text-left">{opt.label}</span>
                                        <span className={`ws-menu-ext ${opt.count > 0 ? '' : 'opacity-40'}`}>{opt.count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const FORMATS = ['FLAC', 'WAV', 'AIFF', 'MP3', 'M4A', 'OGG'];

export const IngestDropzone = ({ isDragOver, onDragOver, onDragLeave, onDrop, onBrowse }) => (
    <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className="flex-1 flex items-center justify-center p-4 sm:p-8 select-none my-auto"
    >
        <div className={`ws-dropzone ${isDragOver ? 'ws-dropzone-over' : ''}`}>
            <div className="ws-dropzone-icon" aria-hidden="true">
                <Icons.Upload size={26} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="font-sans font-semibold text-lg sm:text-xl text-zinc-50 text-balance">
                    {isDragOver ? 'Suelta para analizar' : 'Arrastra tu música aquí'}
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-md text-pretty">
                    Carpetas completas o pistas sueltas. Calculamos BPM, Key Camelot y Hot Cues, y certificamos la calidad real de cada archivo.
                </p>
            </div>
            <button type="button" onClick={onBrowse} className="ws-btn ws-btn-primary ws-btn-lg">
                <Icons.Folder size={16} />
                <span>Elegir carpeta o pistas</span>
            </button>
            <p className="font-mono text-[11px] tracking-wider text-zinc-500">
                {FORMATS.join('  ·  ')}
            </p>
        </div>
    </div>
);

export function camelotTone(keyStr) {
    const m = String(keyStr || '').trim().toUpperCase().match(/^(\d{1,2})\s*([AB])$/);
    if (!m) return null;
    return m[2] === 'A' ? 'minor' : 'major';
}

export const CamelotKeyBadge = ({ value, className = '' }) => {
    const tone = camelotTone(value);
    if (!tone) {
        return <span className={`ws-key ws-key-none ${className}`}>{value || '--'}</span>;
    }
    return (
        <span className={`ws-key ws-key-${tone} ${className}`} title={tone === 'minor' ? 'Camelot menor (A)' : 'Camelot mayor (B)'}>
            {String(value).trim().toUpperCase().replace(/\s+/g, '')}
        </span>
    );
};

// ─── UI COMÚN DE WORKSPACES (SectionTitle, InfoTip, RotaryKnob, AudioEQ) ───
export const SECTION_TITLE_CLASS = "font-syne font-black text-lg sm:text-xl leading-tight text-white tracking-wide uppercase";

export const SectionTitle = ({ icon: Icon, title, accent, badge, accentColor = "cyan", className = "" }) => {
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
export const InfoTip = ({ text, title }) => {
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
export function getAudioEQNodes(audioElement) {
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
export const RotaryKnob = ({ label, value = 0, min = -24, max = 6, defaultValue = 0, onChange, color = "#06b6d4" }) => {
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

