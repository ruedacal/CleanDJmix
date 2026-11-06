import { ShellIcons } from './icons.jsx';

export const MAP_ZOOM_MIN = 0.3;
export const MAP_ZOOM_MAX = 12;

const toSlider = (z) => Math.log(z / MAP_ZOOM_MIN) / Math.log(MAP_ZOOM_MAX / MAP_ZOOM_MIN);
const fromSlider = (v) => MAP_ZOOM_MIN * Math.pow(MAP_ZOOM_MAX / MAP_ZOOM_MIN, v);

const sectorPath = (cx, cy, rOuter, rInner, a1, a2) => {
    const p = (r, a) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
    return `M ${p(rOuter, a1)} A ${rOuter} ${rOuter} 0 0 1 ${p(rOuter, a2)} L ${p(rInner, a2)} A ${rInner} ${rInner} 0 0 0 ${p(rInner, a1)} Z`;
};

export const MapCamelotOverlay = ({ open, onToggle, selectedKey, keyFilter, onFilter, colors, isMatch }) => {
    const size = 208;
    const c = size / 2;
    const rOut = 100;
    const rMid = 66;
    const rIn = 34;

    return (
        <section className="ws-glass w-[232px]" aria-label="Rueda Camelot">
            <header className="ws-glass-head">
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
                <div className="flex flex-col items-center gap-2 pt-2">
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="group" aria-label="Selector de tonalidad">
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

                    <div className="ws-glass-foot">
                        {keyFilter !== 'ALL' ? (
                            <>
                                <span>Filtro <b className="text-[var(--bw-cyan)]">{keyFilter}</b></span>
                                <button type="button" className="ws-glass-link" onClick={() => onFilter(keyFilter)}>Quitar</button>
                            </>
                        ) : selectedKey ? (
                            <span className="flex items-center gap-1.5"><span className="ws-dot ws-dot-ok" />Compatibles: +1 / -1 / modo</span>
                        ) : (
                            <span>Pulsa una tonalidad para filtrar</span>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export const MapNavOverlay = ({ zoom, onZoom, onReset, startPan, stopPan }) => {
    const step = (dir) => onZoom(Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, zoom * (dir > 0 ? 1.35 : 1 / 1.35))));
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
        <section className="ws-glass w-[148px]" aria-label="Navegación y zoom">
            <header className="ws-glass-head">
                <span className="ws-glass-title"><ShellIcons.Sliders size={13} />Nav</span>
                <span className="ws-glass-readout">{zoom.toFixed(zoom < 10 ? 1 : 0)}x</span>
            </header>

            <div className="grid grid-cols-3 gap-1 pt-2.5 place-items-center">
                <span />
                {pad(0, 30, 'Mover arriba', ShellIcons.ChevronUp)}
                <span />
                {pad(30, 0, 'Mover a la izquierda', ShellIcons.ChevronLeft)}
                <button type="button" className="ws-pad-btn ws-pad-btn-center" onClick={onReset} aria-label="Centrar y reajustar" title="Centrar y reajustar">
                    <ShellIcons.Target size={13} />
                </button>
                {pad(-30, 0, 'Mover a la derecha', ShellIcons.ChevronRight)}
                <span />
                {pad(0, -30, 'Mover abajo', ShellIcons.ChevronDown)}
                <span />
            </div>

            <div className="flex flex-col gap-1.5 pt-3 mt-2.5 border-t border-[var(--bw-line)]">
                <div className="flex items-center justify-between">
                    <span className="ws-glass-kicker">Zoom</span>
                    <span className="ws-glass-kicker">{MAP_ZOOM_MIN}–{MAP_ZOOM_MAX}x</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <button type="button" className="ws-glass-icon" onClick={() => step(-1)} aria-label="Alejar"><ShellIcons.Minus size={12} /></button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.001"
                        value={toSlider(zoom)}
                        onChange={(e) => onZoom(fromSlider(parseFloat(e.target.value)))}
                        className="ws-fader flex-1"
                        aria-label="Nivel de zoom"
                        aria-valuetext={`${zoom.toFixed(1)}x`}
                    />
                    <button type="button" className="ws-glass-icon" onClick={() => step(1)} aria-label="Acercar"><ShellIcons.Plus size={12} /></button>
                </div>
            </div>
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
