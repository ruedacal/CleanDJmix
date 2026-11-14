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
