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
