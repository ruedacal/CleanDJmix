import { ShellIcons } from './icons.jsx';

export const MAP_ZOOM_MIN = 0.3;
export const MAP_ZOOM_MAX = 20;

export const toSlider = (z) => {
    const val = Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, Number(z) || 1));
    return Math.log(val / MAP_ZOOM_MIN) / Math.log(MAP_ZOOM_MAX / MAP_ZOOM_MIN);
};
export const fromSlider = (v) => {
    const clamped = Math.max(0, Math.min(1, Number(v) || 0));
    return MAP_ZOOM_MIN * Math.pow(MAP_ZOOM_MAX / MAP_ZOOM_MIN, clamped);
};

const sectorPath = (cx, cy, rOuter, rInner, a1, a2) => {
    const p = (r, a) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
    return `M ${p(rOuter, a1)} A ${rOuter} ${rOuter} 0 0 1 ${p(rOuter, a2)} L ${p(rInner, a2)} A ${rInner} ${rInner} 0 0 0 ${p(rInner, a1)} Z`;
};

export const MapCamelotOverlay = ({ open, onToggle, selectedKey, keyFilter, onFilter, colors, isMatch }) => {
    const size = 196;
    const c = size / 2;
    const rOut = 94;
    const rMid = 62;
    const rIn = 32;

    return (
        <section 
            style={{ width: '240px', height: open ? '280px' : '38px', padding: 0 }}
            className="ws-glass flex flex-col transition-all overflow-hidden select-none" 
            aria-label="Rueda Camelot"
        >
            <header className="ws-glass-head shrink-0 h-[38px] px-3">
                <span className="ws-glass-title">
                    <ShellIcons.Disc size={13} />
                    Camelot
                </span>
                <span className="flex items-center gap-1.5">
                    {selectedKey && (
                        <span className="ws-key-chip" style={{ '--key': colors[selectedKey] || 'var(--bw-cyan)' }}>{selectedKey}</span>
                    )}
                    <button type="button" className="ws-glass-icon" onClick={onToggle} aria-expanded={open} aria-label={open ? 'Minimizar rueda Camelot' : 'Expandir rueda Camelot'}>
                        {open ? <ShellIcons.Minus size={12} /> : <ShellIcons.Plus size={12} />}
                    </button>
                </span>
            </header>

            {open && (
                <div className="flex-1 flex flex-col items-center justify-between p-2 pt-1 overflow-hidden">
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="group" aria-label="Selector de tonalidad" className="shrink-0">
                        <circle cx={c} cy={c} r={rOut + 3} fill="var(--bw-surface-1)" stroke="var(--bw-line-strong)" />
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
                            const mid = ((num - 1) * 30 - 90) * Math.PI / 180;
                            const half = 14.2 * Math.PI / 180;
                            const rings = [
                                { key: `${num}B`, outer: rOut, inner: rMid, lr: (rOut + rMid) / 2 },
                                { key: `${num}A`, outer: rMid - 1, inner: rIn, lr: (rMid + rIn) / 2 },
                            ];
                            return rings.map((ring) => {
                                const isSel = selectedKey === ring.key;
                                const isFil = keyFilter === ring.key;
                                const match = selectedKey ? isMatch(selectedKey, ring.key) : false;
                                const dim = selectedKey && !isSel && !match;
                                const lit = isSel || isFil;
                                return (
                                    <g
                                        key={ring.key}
                                        className="cursor-pointer"
                                        onClick={() => onFilter(ring.key)}
                                        role="button"
                                        aria-label={`Filtrar ${ring.key}`}
                                        aria-pressed={isFil}
                                    >
                                        <path
                                            d={sectorPath(c, c, ring.outer, ring.inner, mid - half, mid + half)}
                                            fill={colors[ring.key] || '#22d3ee'}
                                            fillOpacity={lit ? 0.95 : match ? 0.7 : dim ? 0.12 : 0.32}
                                            stroke={isSel ? '#fafafa' : isFil ? '#22d3ee' : 'transparent'}
                                            strokeWidth={lit ? 1.5 : 0}
                                            className="ws-wheel-sector"
                                        />
                                        <text
                                            x={c + ring.lr * Math.cos(mid)}
                                            y={c + ring.lr * Math.sin(mid) + 3}
                                            textAnchor="middle"
                                            className="ws-wheel-label"
                                            fill={lit ? '#09090b' : dim ? '#52525b' : '#e4e4e7'}
                                        >
                                            {ring.key}
                                        </text>
                                    </g>
                                );
                            });
                        })}
                        <circle cx={c} cy={c} r={rIn - 3} fill="var(--bw-black)" stroke="var(--bw-line-strong)" />
                        <text x={c} y={c - 1} textAnchor="middle" className="ws-wheel-center" fill={selectedKey ? '#fafafa' : '#71717a'}>
                            {selectedKey || (keyFilter !== 'ALL' ? keyFilter : '--')}
                        </text>
                        <text x={c} y={c + 11} textAnchor="middle" className="ws-wheel-sub" fill="#71717a">
                            {selectedKey ? 'ACTUAL' : keyFilter !== 'ALL' ? 'FILTRO' : 'KEY'}
                        </text>
                    </svg>

                    <div className="ws-glass-foot w-full shrink-0 text-center text-[10px]">
                        {keyFilter !== 'ALL' ? (
                            <div className="flex items-center justify-between w-full">
                                <span>Filtro <b className="text-[var(--bw-cyan)]">{keyFilter}</b></span>
                                <button type="button" className="ws-glass-link" onClick={() => onFilter(keyFilter)}>Quitar</button>
                            </div>
                        ) : selectedKey ? (
                            <span className="flex items-center justify-center gap-1.5"><span className="ws-dot ws-dot-ok" />Compatibles: +1 / -1 / modo</span>
                        ) : (
                            <span>Pulsa una tonalidad para filtrar</span>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export const MapNavOverlay = ({ open = true, onToggle, zoom, onZoom, onReset, startPan, stopPan }) => {
    const step = (dir) => onZoom(Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, zoom * (dir > 0 ? 1.4 : 1 / 1.4))));
    const pad = (dx, dy, label, Icon) => (
        <button
            type="button"
            className="ws-pad-btn"
            aria-label={label}
            title={label}
            onPointerDown={() => startPan(dx, dy)}
            onPointerUp={stopPan}
            onPointerLeave={stopPan}
            onPointerCancel={stopPan}
        >
            <Icon size={13} />
        </button>
    );

    return (
        <section 
            style={{ width: '240px', height: open ? '280px' : '38px', padding: 0 }}
            className="ws-glass flex flex-col transition-all overflow-hidden select-none" 
            aria-label="Navegación y zoom"
        >
            <header className="ws-glass-head shrink-0 h-[38px] px-3">
                <span className="ws-glass-title">
                    <ShellIcons.Sliders size={13} />
                    Navegación & Zoom
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="ws-glass-readout font-mono font-bold text-cyan-400">
                        {zoom.toFixed(zoom < 10 ? 1 : 0)}x
                    </span>
                    {onToggle && (
                        <button 
                            type="button" 
                            className="ws-glass-icon" 
                            onClick={onToggle} 
                            aria-expanded={open} 
                            aria-label={open ? 'Minimizar controles de navegación' : 'Expandir controles de navegación'}
                        >
                            {open ? <ShellIcons.Minus size={12} /> : <ShellIcons.Plus size={12} />}
                        </button>
                    )}
                </span>
            </header>

            {open && (
                <div className="flex-1 flex flex-col justify-between p-2.5 pt-1.5 overflow-hidden">
                    <div className="grid grid-cols-3 gap-1.5 place-items-center">
                        <span />
                        {pad(0, 30, 'Mover arriba', ShellIcons.ChevronUp)}
                        <span />
                        {pad(30, 0, 'Mover a la izquierda', ShellIcons.ChevronLeft)}
                        <button type="button" className="ws-pad-btn ws-pad-btn-center" onClick={onReset} aria-label="Centrar y reajustar mapa" title="Centrar y reajustar mapa">
                            <ShellIcons.Target size={13} />
                        </button>
                        {pad(-30, 0, 'Mover a la derecha', ShellIcons.ChevronRight)}
                        <span />
                        {pad(0, -30, 'Mover abajo', ShellIcons.ChevronDown)}
                        <span />
                    </div>

                    <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--bw-line)]">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="ws-glass-kicker text-zinc-400 font-bold">Zoom 20X Pro</span>
                            <span className="text-[10px] text-cyan-400 font-bold">{zoom.toFixed(1)}x / {MAP_ZOOM_MAX}x</span>
                        </div>
                        <div 
                            className="flex items-center gap-2 w-full px-0.5"
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                        >
                            <button type="button" className="ws-glass-icon shrink-0 cursor-pointer" onClick={() => step(-1)} aria-label="Alejar">
                                <ShellIcons.Minus size={12} />
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.001"
                                value={toSlider(zoom)}
                                onInput={(e) => {
                                    e.stopPropagation();
                                    onZoom(fromSlider(parseFloat(e.target.value)));
                                }}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    onZoom(fromSlider(parseFloat(e.target.value)));
                                }}
                                className="ws-fader flex-1 min-w-0 cursor-pointer"
                                aria-label="Nivel de zoom"
                                aria-valuetext={`${zoom.toFixed(1)}x`}
                            />
                            <button type="button" className="ws-glass-icon shrink-0 cursor-pointer" onClick={() => step(1)} aria-label="Acercar">
                                <ShellIcons.Plus size={12} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 pt-0.5">
                            <span>0.3x Min</span>
                            <span>Auto-Centrado Activo</span>
                            <span>20x Max</span>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export const MapStatsHud = ({ visible, total, avgBpm, avgEnergy, keyCount, selected }) => (
    <div className="ws-glass ws-hud" role="status" aria-live="polite">
        <div className="ws-hud-cell">
            <span className="ws-glass-kicker">Visibles</span>
            <span className="ws-hud-val">{visible}<span className="ws-hud-unit">/{total}</span></span>
        </div>
        <div className="ws-hud-cell">
            <span className="ws-glass-kicker">BPM medio</span>
            <span className="ws-hud-val">{avgBpm || '--'}</span>
        </div>
        <div className="ws-hud-cell">
            <span className="ws-glass-kicker">Energía</span>
            <span className="ws-hud-val flex items-center gap-2">
                {avgEnergy || '--'}
                <span className="ws-hud-bar" aria-hidden="true"><span style={{ width: `${avgEnergy || 0}%` }} /></span>
            </span>
        </div>
        <div className="ws-hud-cell hidden sm:flex">
            <span className="ws-glass-kicker">Tonalidades</span>
            <span className="ws-hud-val">{keyCount}</span>
        </div>
        {selected > 0 && (
            <div className="ws-hud-cell">
                <span className="ws-glass-kicker">Selección</span>
                <span className="ws-hud-val text-[var(--bw-cyan)]">{selected}</span>
            </div>
        )}
    </div>
);

export const MapAcousticConsole = ({
    isOpen = true,
    width = 270,
    onResizeDown,
    onResetWidth,
    onClose,
    // Zoom & Vista
    zoom = 1.0,
    onZoom,
    onResetZoom,
    onAutoFrame,
    // Camelot
    selectedTrack = null,
    selectedKey = null,
    keyFilter = 'ALL',
    onKeyFilter,
    colors = {},
    isMatch = () => false,
    // Filtros Acústicos
    filterMinEnergy = 0,
    setFilterMinEnergy,
    filterMinDance = 0,
    setFilterMinDance,
    filterMinIntensity = 0,
    setFilterMinIntensity,
    filterMinValence = 0,
    setFilterMinValence,
    filterQualityMode = 'ALL',
    setFilterQualityMode,
    onResetFilters,
    hasActiveFilters = false,
    // Estadísticas
    visibleCount = 0,
    totalCount = 0,
    // Drag & Drop / Selección
    selectedMapTracks = [],
    onPlayTrack,
    onAddTracksToSet,
    nowPlayingTrack = null,
    isPlaying = false,
    onTogglePlay,
    onClearSelection
}) => {
    if (!isOpen) return null;

    const stepZoom = (dir) => {
        if (!onZoom) return;
        const nextZ = Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, zoom * (dir > 0 ? 1.35 : 1 / 1.35)));
        onZoom(nextZ);
    };

    const size = 184;
    const c = size / 2;
    const rOut = 88;
    const rMid = 58;
    const rIn = 30;

    return (
        <aside
            style={{ width: `${width}px` }}
            className="h-full bg-[var(--bw-surface-1)] border-l border-[var(--bw-line-strong)] flex flex-col shrink-0 relative z-20 select-none text-zinc-300 shadow-2xl"
            aria-label="Consola Acústica y Controles del Mapa"
        >
            {/* MANEJADOR DE REDIMENSIONADO LATERAL IZQUIERDO */}
            {onResizeDown && (
                <div
                    onPointerDown={onResizeDown}
                    onDoubleClick={onResetWidth}
                    title="Arrastra para redimensionar (Doble clic para restablecer a 270px)"
                    className="absolute top-0 bottom-0 -left-1.5 w-3 cursor-col-resize z-30 flex items-center justify-center hover:bg-cyan-500/20 group"
                >
                    <div className="w-[3px] h-10 bg-zinc-600 group-hover:bg-cyan-400 rounded-full transition-colors" />
                </div>
            )}

            {/* CABECERA DE LA CONSOLA */}
            <div className="h-10 px-3 border-b border-[var(--bw-line)] flex items-center justify-between shrink-0 bg-[var(--bw-surface-2)]">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-cyan-400 flex items-center shrink-0">
                        <ShellIcons.Sliders size={14} />
                    </span>
                    <h3 className="font-syne font-bold text-xs text-white uppercase tracking-wider truncate">
                        Consola Acústica
                    </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 font-bold" title="Pistas visibles tras filtros / Total biblioteca">
                        {visibleCount}/{totalCount}
                    </span>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Ocultar consola lateral"
                            aria-label="Ocultar consola lateral"
                        >
                            <ShellIcons.Close size={13} />
                        </button>
                    )}
                </div>
            </div>

            {/* CONTENIDO DESPLAZABLE DE LA CONSOLA */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 font-mono text-xs divide-y divide-[var(--bw-line)]">
                {/* 1. SECCIÓN: ZOOM & NAVEGACIÓN */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <ShellIcons.Target size={12} className="text-cyan-400" /> Zoom 20X Pro
                        </span>
                        <span className="text-cyan-400 font-bold font-mono">
                            {zoom.toFixed(zoom < 10 ? 1 : 0)}x
                        </span>
                    </div>

                    <div 
                        className="flex items-center gap-1.5 w-full"
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <button 
                            type="button" 
                            className="ws-glass-icon shrink-0 cursor-pointer" 
                            onClick={() => stepZoom(-1)} 
                            aria-label="Alejar zoom"
                        >
                            <ShellIcons.Minus size={11} />
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.001"
                            value={toSlider(zoom)}
                            onInput={(e) => {
                                e.stopPropagation();
                                if (onZoom) onZoom(fromSlider(parseFloat(e.target.value)));
                            }}
                            onChange={(e) => {
                                e.stopPropagation();
                                if (onZoom) onZoom(fromSlider(parseFloat(e.target.value)));
                            }}
                            className="ws-fader flex-1 min-w-0 cursor-pointer"
                            aria-label="Fader de Zoom"
                        />
                        <button 
                            type="button" 
                            className="ws-glass-icon shrink-0 cursor-pointer" 
                            onClick={() => stepZoom(1)} 
                            aria-label="Acercar zoom"
                        >
                            <ShellIcons.Plus size={11} />
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 pt-0.5">
                        {onAutoFrame && (
                            <button
                                type="button"
                                onClick={onAutoFrame}
                                className="ws-btn ws-btn-outline flex-1 justify-center py-1 text-[10.5px] h-7"
                                title="Recentrar y enmarcar todos los tracks visibles"
                            >
                                <ShellIcons.Target size={11} />
                                <span>Enmarcar</span>
                            </button>
                        )}
                        {onResetZoom && (
                            <button
                                type="button"
                                onClick={onResetZoom}
                                className="ws-btn ws-btn-outline px-2.5 py-1 text-[10.5px] h-7"
                                title="Restablecer zoom a 1.0x"
                            >
                                <span>↺ 1.0x</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. SECCIÓN: RUEDA CAMELOT ARMÓNICA */}
                <div className="pt-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <ShellIcons.Disc size={12} className="text-purple-400" /> Rueda Camelot
                        </span>
                        {keyFilter !== 'ALL' && (
                            <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-500/40">
                                {keyFilter}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col items-center justify-center pt-0.5">
                        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="group" aria-label="Rueda Camelot interactiva" className="shrink-0 drop-shadow-md">
                            <circle cx={c} cy={c} r={rOut + 2} fill="var(--bw-surface-1)" stroke="var(--bw-line-strong)" />
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
                                const mid = ((num - 1) * 30 - 90) * Math.PI / 180;
                                const half = 14.2 * Math.PI / 180;
                                const rings = [
                                    { key: `${num}B`, outer: rOut, inner: rMid, lr: (rOut + rMid) / 2 },
                                    { key: `${num}A`, outer: rMid - 1, inner: rIn, lr: (rMid + rIn) / 2 },
                                ];
                                return rings.map((ring) => {
                                    const isSel = selectedKey === ring.key;
                                    const isFil = keyFilter === ring.key;
                                    const match = selectedKey ? isMatch(selectedKey, ring.key) : false;
                                    const dim = selectedKey && !isSel && !match;
                                    const lit = isSel || isFil;
                                    return (
                                        <g
                                            key={ring.key}
                                            className="cursor-pointer"
                                            onClick={() => onKeyFilter && onKeyFilter(keyFilter === ring.key ? 'ALL' : ring.key)}
                                            role="button"
                                            aria-label={`Filtrar tonalidad ${ring.key}`}
                                            aria-pressed={isFil}
                                        >
                                            <path
                                                d={sectorPath(c, c, ring.outer, ring.inner, mid - half, mid + half)}
                                                fill={colors[ring.key] || '#22d3ee'}
                                                fillOpacity={lit ? 0.95 : match ? 0.7 : dim ? 0.12 : 0.32}
                                                stroke={isSel ? '#fafafa' : isFil ? '#22d3ee' : 'transparent'}
                                                strokeWidth={lit ? 1.5 : 0}
                                                className="ws-wheel-sector transition-all hover:opacity-100"
                                            />
                                            <text
                                                x={c + ring.lr * Math.cos(mid)}
                                                y={c + ring.lr * Math.sin(mid) + 3}
                                                textAnchor="middle"
                                                className="ws-wheel-label"
                                                style={{ fontSize: '9px', fontWeight: 'bold' }}
                                                fill={lit ? '#09090b' : dim ? '#52525b' : '#e4e4e7'}
                                            >
                                                {ring.key}
                                            </text>
                                        </g>
                                    );
                                });
                            })}
                            <circle cx={c} cy={c} r={rIn - 2} fill="var(--bw-black)" stroke="var(--bw-line-strong)" />
                            <text x={c} y={c - 1} textAnchor="middle" className="ws-wheel-center" fill={selectedKey ? '#fafafa' : '#71717a'} style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                {selectedKey || (keyFilter !== 'ALL' ? keyFilter : '--')}
                            </text>
                            <text x={c} y={c + 10} textAnchor="middle" className="ws-wheel-sub" fill="#71717a" style={{ fontSize: '8px' }}>
                                {selectedKey ? 'ACTUAL' : keyFilter !== 'ALL' ? 'FILTRO' : 'KEY'}
                            </text>
                        </svg>

                        {keyFilter !== 'ALL' && (
                            <button
                                type="button"
                                onClick={() => onKeyFilter && onKeyFilter('ALL')}
                                className="text-[10.5px] text-cyan-400 hover:text-white flex items-center justify-center gap-1 mt-1.5 cursor-pointer"
                            >
                                <span>✕ Quitar filtro ({keyFilter})</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. SECCIÓN: FILTROS ACÚSTICOS (DJ MIXER) */}
                <div className="pt-3 space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <ShellIcons.Sliders size={12} className="text-emerald-400" /> Filtros Acústicos
                        </span>
                        {hasActiveFilters && onResetFilters && (
                            <button
                                type="button"
                                onClick={onResetFilters}
                                className="text-[10px] text-cyan-400 hover:text-white cursor-pointer"
                                title="Restablecer todos los filtros acústicos"
                            >
                                ↺ Reset
                            </button>
                        )}
                    </div>

                    {/* ENERGÍA */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10.5px]">
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                                <ShellIcons.Zap size={11} /> Energía Min
                            </span>
                            <span className="text-amber-300 font-bold font-mono">{filterMinEnergy}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={filterMinEnergy}
                            onChange={(e) => setFilterMinEnergy && setFilterMinEnergy(parseInt(e.target.value, 10))}
                            className="ws-fader w-full cursor-pointer"
                            aria-label="Filtro de Energía Mínima"
                        />
                    </div>

                    {/* BAILABILIDAD */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10.5px]">
                            <span className="text-cyan-400 font-bold flex items-center gap-1">
                                🕺 Bailabilidad Min
                            </span>
                            <span className="text-cyan-300 font-bold font-mono">{filterMinDance}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={filterMinDance}
                            onChange={(e) => setFilterMinDance && setFilterMinDance(parseInt(e.target.value, 10))}
                            className="ws-fader w-full cursor-pointer"
                            aria-label="Filtro de Bailabilidad Mínima"
                        />
                    </div>

                    {/* INTENSIDAD */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10.5px]">
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <ShellIcons.Flame size={11} /> Intensidad Min
                            </span>
                            <span className="text-emerald-300 font-bold font-mono">{filterMinIntensity}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={filterMinIntensity}
                            onChange={(e) => setFilterMinIntensity && setFilterMinIntensity(parseInt(e.target.value, 10))}
                            className="ws-fader w-full cursor-pointer"
                            aria-label="Filtro de Intensidad Mínima"
                        />
                    </div>

                    {/* POSITIVIDAD (VALENCE) */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10.5px]">
                            <span className="text-purple-400 font-bold flex items-center gap-1">
                                <ShellIcons.Sparkles size={11} /> Positividad Min
                            </span>
                            <span className="text-purple-300 font-bold font-mono">{filterMinValence}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={filterMinValence}
                            onChange={(e) => setFilterMinValence && setFilterMinValence(parseInt(e.target.value, 10))}
                            className="ws-fader w-full cursor-pointer"
                            aria-label="Filtro de Positividad Mínima"
                        />
                    </div>

                    {/* CALIDAD MASTER */}
                    <div className="space-y-1.5 pt-1">
                        <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider block">
                            🔬 Calidad Master
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                            {[
                                { id: 'ALL', label: 'Todas' },
                                { id: 'lossless', label: '💎 Lossless' },
                                { id: 'nofake', label: '🛡️ Sin Fakes' }
                            ].map(q => (
                                <button
                                    key={q.id}
                                    type="button"
                                    onClick={() => setFilterQualityMode && setFilterQualityMode(q.id)}
                                    className={`py-1 px-1 text-[10px] font-mono rounded-lg border transition-all truncate text-center cursor-pointer ${
                                        filterQualityMode === q.id
                                            ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold shadow-sm'
                                            : 'bg-[var(--bw-surface-2)] border-[var(--bw-line)] text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    {q.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. SECCIÓN: DRAG & DROP & PISTA SELECCIONADA */}
                <div className="pt-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <span className="text-cyan-400 text-xs">⠿</span> Drag & Drop
                        </span>
                        {selectedTrack && onClearSelection && (
                            <button
                                type="button"
                                onClick={onClearSelection}
                                className="text-[10px] text-zinc-500 hover:text-white cursor-pointer"
                            >
                                Deseleccionar
                            </button>
                        )}
                    </div>

                    {selectedTrack ? (
                        <div
                            draggable={true}
                            onDragStart={(e) => {
                                try {
                                    e.dataTransfer.setData('application/json', JSON.stringify(selectedTrack));
                                    e.dataTransfer.setData('text/plain', selectedTrack.path || selectedTrack.title || '');
                                    e.dataTransfer.effectAllowed = 'copyMove';
                                } catch (err) {}
                            }}
                            className="p-2.5 rounded-xl bg-[var(--bw-surface-2)] border border-cyan-500/50 hover:border-cyan-400 transition-all shadow-md group cursor-grab active:cursor-grabbing flex flex-col gap-2 relative"
                            title="Arrastra esta pista para soltarla en Set Builder, Decks o Listas"
                        >
                            <div className="flex items-center gap-1.5 text-[9px] text-cyan-400 font-bold uppercase tracking-wider">
                                <span className="animate-pulse">⠿</span> Arrastra a Set Builder / Decks
                            </div>

                            <div className="flex items-start gap-2.5">
                                <div className="w-11 h-11 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-zinc-700/60 shadow relative">
                                    <img
                                        src={selectedTrack.cover || selectedTrack.cover_url || (selectedTrack.path ? `/cover?path=${encodeURIComponent(selectedTrack.path)}&thumb=96` : null)}
                                        alt="Cover"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-0.5 right-0.5 px-1 py-0.2 rounded font-black text-black text-[8px]" style={{ backgroundColor: colors[(selectedTrack.key || '8A').toUpperCase()] || '#06b6d4' }}>
                                        {(selectedTrack.key || '8A').toUpperCase()}
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-bold text-white text-xs truncate" title={selectedTrack.artist}>
                                        {selectedTrack.artist || 'Desconocido'}
                                    </div>
                                    <div className="text-cyan-300 text-[11px] truncate" title={selectedTrack.title}>
                                        {selectedTrack.title || 'Sin Título'}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                                        <span>{selectedTrack.bpm ? parseFloat(selectedTrack.bpm).toFixed(1) : '126.0'} BPM</span>
                                        <span>•</span>
                                        <span className="text-amber-300">{selectedTrack.energy !== undefined ? selectedTrack.energy : 80}% Energía</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center gap-1.5 pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const isCur = Boolean(nowPlayingTrack && (
                                            nowPlayingTrack.id === selectedTrack.id ||
                                            (nowPlayingTrack.path && selectedTrack.path && nowPlayingTrack.path === selectedTrack.path) ||
                                            (nowPlayingTrack.title === selectedTrack.title)
                                        ));
                                        if (isCur && isPlaying && onTogglePlay) {
                                            onTogglePlay();
                                        } else if (onPlayTrack) {
                                            onPlayTrack(selectedTrack, 0, true);
                                        }
                                    }}
                                    className="ws-btn ws-btn-primary flex-1 justify-center py-1 text-[11px] h-7"
                                >
                                    <ShellIcons.Play size={11} />
                                    <span>{Boolean(nowPlayingTrack && isPlaying && (nowPlayingTrack.id === selectedTrack.id || nowPlayingTrack.title === selectedTrack.title)) ? 'Pausar' : 'Preview'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (onAddTracksToSet) onAddTracksToSet([selectedTrack]);
                                    }}
                                    className="ws-btn ws-btn-outline px-2 py-1 text-[11px] h-7"
                                    title="Añadir a Set Builder"
                                >
                                    <ShellIcons.Plus size={11} />
                                    <span>Set</span>
                                </button>
                            </div>
                        </div>
                    ) : selectedMapTracks && selectedMapTracks.length > 0 ? (
                        <div
                            draggable={true}
                            onDragStart={(e) => {
                                try {
                                    e.dataTransfer.setData('application/json', JSON.stringify(selectedMapTracks));
                                    e.dataTransfer.setData('text/plain', selectedMapTracks.map(t => t.path || t.title).join('\n'));
                                    e.dataTransfer.effectAllowed = 'copyMove';
                                } catch (err) {}
                            }}
                            className="p-2.5 rounded-xl bg-[var(--bw-surface-2)] border border-cyan-500/50 hover:border-cyan-400 transition-all shadow-md group cursor-grab active:cursor-grabbing flex flex-col gap-2"
                            title="Arrastra este grupo de pistas para soltarlas en Set Builder"
                        >
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <span className="animate-pulse">⠿</span> {selectedMapTracks.length} Pistas Seleccionadas
                                </span>
                                <span className="text-zinc-400 font-mono text-[9px]">Lasso / Caja</span>
                            </div>
                            <p className="text-[10px] text-zinc-300">
                                Grupo de zona capturada. Arrastra directamente al Set Builder o pulsa enviar.
                            </p>
                            <div className="flex items-center gap-1.5 pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (onAddTracksToSet) onAddTracksToSet(selectedMapTracks);
                                    }}
                                    className="ws-btn ws-btn-primary flex-1 justify-center py-1 text-[11px] h-7"
                                >
                                    <ShellIcons.Zap size={11} />
                                    <span>Enviar Todas a Set</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 rounded-xl bg-zinc-950/60 border border-dashed border-zinc-800 text-center text-zinc-500 flex flex-col items-center gap-1.5">
                            <span className="text-base text-zinc-400">⠿</span>
                            <p className="text-[10px] leading-tight text-zinc-400 font-mono">
                                Haz clic en una pista del mapa o usa Lasso para seleccionarla y arrastrarla directamente con Drag & Drop hacia Set Builder o Decks.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};
