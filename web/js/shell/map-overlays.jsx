import { ShellIcons } from './icons.jsx';

export const MAP_ZOOM_MIN = 0.3;
export const MAP_ZOOM_MAX = 20;

const toSlider = (z) => {
    const val = Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, Number(z) || 1));
    return Math.log(val / MAP_ZOOM_MIN) / Math.log(MAP_ZOOM_MAX / MAP_ZOOM_MIN);
};
const fromSlider = (v) => {
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
        <section className={`ws-glass w-[240px] flex flex-col transition-all overflow-hidden select-none ${open ? 'h-[285px]' : 'h-[38px]'}`} aria-label="Rueda Camelot">
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
        <section className={`ws-glass w-[240px] flex flex-col transition-all overflow-hidden select-none ${open ? 'h-[285px]' : 'h-[38px]'}`} aria-label="Navegación y zoom">
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
                <div className="flex-1 flex flex-col justify-between p-3 pt-2 overflow-hidden">
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
