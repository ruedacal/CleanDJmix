const { useState } = React;

const ICON_PATHS = {
    home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    db: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    users: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm13 9v-1a4 4 0 0 0-3-3.8M16 4.2a3 3 0 0 1 0 5.6',
    megaphone: 'M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1zm14-3a5 5 0 0 1 0 8',
    ticket: 'M3 8a2 2 0 0 0 0 4v-0 4a2 2 0 0 1 2 2h14a2 2 0 0 1 2-2v-4a2 2 0 0 1 0-4V6a2 2 0 0 1-2-2H5a2 2 0 0 1-2 2zm10-4v16',
    spark: 'M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z',
    image: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9.5a1 1 0 1 0 0-.01',
    chart: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 3l-4.3-4.3',
    card: 'M3 6h18v12H3zM3 10h18M7 15h4',
    bell: 'M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7m4 11a2 2 0 0 0 4 0',
    terminal: 'M4 5h16v14H4zM8 9l3 3-3 3m5 0h3',
    gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
    plus: 'M12 5v14M5 12h14',
    download: 'M12 4v11m-5-5l5 5 5-5M5 20h14',
    trash: 'M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3',
    copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
    menu: 'M4 6h16M4 12h16M4 18h16',
    x: 'M6 6l12 12M18 6L6 18',
    send: 'M4 12l16-8-6 16-2-7z',
    refresh: 'M20 11a8 8 0 0 0-14.9-3M4 4v4h4m-4 5a8 8 0 0 0 14.9 3M20 20v-4h-4',
    external: 'M14 4h6v6m0-6l-9 9M18 14v6H4V6h6',
    code: 'M8 8l-4 4 4 4m8-8l4 4-4 4M14 5l-4 14',
    flow: 'M5 4h6v5H5zM13 15h6v5h-6zM8 9v4a2 2 0 0 0 2 2h3',
    share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
    pen: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
    play: 'M7 5l12 7-12 7z',
    up: 'M12 19V5m-6 6l6-6 6 6',
    down: 'M12 5v14m-6-6l6 6 6-6',
};

export function Icon({ name, size = 16, className = '' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
            <path d={ICON_PATHS[name] || ''} />
        </svg>
    );
}

export function SectionHeader({ eyebrow, title, desc, children }) {
    return (
        <header className="sec-head">
            <div>
                <p className="sec-eyebrow">{eyebrow}</p>
                <h1 className="sec-title">{title}</h1>
                {desc && <p className="sec-desc">{desc}</p>}
            </div>
            {children && <div className="sec-actions">{children}</div>}
        </header>
    );
}

export function Card({ title, action, children, bodyClass = 'card-body', className = '' }) {
    return (
        <section className={`card ${className}`}>
            {title && (
                <div className="card-head">
                    <h2 className="card-title">{title}</h2>
                    {action}
                </div>
            )}
            <div className={bodyClass}>{children}</div>
        </section>
    );
}

export function Stat({ label, value, delta }) {
    const positive = delta && !String(delta).startsWith('-');
    return (
        <div className="card stat">
            <span className="stat-label">{label}</span>
            <span className="stat-value">{value}</span>
            {delta && <span className={`stat-delta ${positive ? 'up' : 'down'}`}>{positive ? '+' : ''}{delta} vs. mes anterior</span>}
        </div>
    );
}

export function Badge({ tone = 'off', children, plain }) {
    return <span className={`badge badge-${tone} ${plain ? 'badge-plain' : ''}`}>{children}</span>;
}

export function Toggle({ checked, onChange, label }) {
    return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="toggle" onClick={() => onChange(!checked)} />;
}

export function Button({ icon, children, variant = '', size = '', ...props }) {
    return (
        <button type="button" className={`btn ${variant ? 'btn-' + variant : ''} ${size ? 'btn-' + size : ''}`} {...props}>
            {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
            {children}
        </button>
    );
}

export function Field({ label, id, children }) {
    return (
        <div className="field">
            <label htmlFor={id}>{label}</label>
            {children}
        </div>
    );
}

export function Chips({ options, value, onChange, label }) {
    return (
        <div className="chips" role="group" aria-label={label}>
            {options.map((o) => (
                <button key={o} type="button" className="chip" aria-pressed={value === o} onClick={() => onChange(o)}>{o}</button>
            ))}
        </div>
    );
}

const CHART_YEAR = 2026;
const labelToIso = (label, i) => {
    const m = /^(\d{1,2})\/(\d{1,2})$/.exec(String(label));
    const d = m ? new Date(CHART_YEAR, Number(m[2]) - 1, Number(m[1])) : new Date(CHART_YEAR, 9, 12 + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const longDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
let chartSeq = 0;

export function LineChart({ data, labels, height = 220, compare, format = (v) => num(v), seriesLabel = 'Periodo actual', compareLabel = 'Periodo anterior' }) {
    const { useMemo, useRef } = React;
    const n = data.length;
    const isoDates = useMemo(() => (labels || data.map((_, i) => i)).map(labelToIso), [labels, n]);
    const gradId = useMemo(() => `lc-fill-${++chartSeq}`, []);
    const [range, setRange] = useState([0, n - 1]);
    const [hover, setHover] = useState(null);
    const [pinned, setPinned] = useState(null);
    const [drag, setDrag] = useState(null);
    const svgRef = useRef(null);

    const [lo, hi] = range;
    const len = hi - lo + 1;
    const view = data.slice(lo, hi + 1);
    const viewCmp = compare ? compare.slice(lo, hi + 1) : null;
    const w = 640, h = height, padX = 44, padY = 24;
    const max = Math.max(...(viewCmp ? view.concat(viewCmp) : view)) * 1.1 || 1;
    const x = (i) => padX + (len === 1 ? (w - padX * 2) / 2 : ((i - lo) * (w - padX * 2)) / (len - 1));
    const y = (v) => h - padY - (v / max) * (h - padY * 2);
    const path = (arr) => arr.map((v, k) => `${k ? 'L' : 'M'}${x(lo + k).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `${path(view)} L${x(hi)},${h - padY} L${x(lo)},${h - padY} Z`;
    const step = Math.max(1, Math.ceil(len / 7));

    const active = hover ?? pinned;
    const zoomed = lo !== 0 || hi !== n - 1;

    const idxFromEvent = (e) => {
        const r = svgRef.current.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * w;
        const rel = len === 1 ? 0 : Math.round(((px - padX) / (w - padX * 2)) * (len - 1));
        return lo + clamp(rel, 0, len - 1);
    };
    const applyRange = (a, b) => {
        let s = clamp(Math.min(a, b), 0, n - 1), e = clamp(Math.max(a, b), 0, n - 1);
        if (e - s < 1) { if (e < n - 1) e += 1; else s -= 1; }
        setRange([s, e]);
        if (pinned !== null && (pinned < s || pinned > e)) setPinned(null);
    };
    const zoomBy = (factor) => {
        const center = active ?? Math.round((lo + hi) / 2);
        const half = Math.max(1, Math.round((len * factor) / 2));
        applyRange(center - half, center + half);
    };

    const onPointerDown = (e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        const i = idxFromEvent(e);
        setDrag({ a: i, b: i });
    };
    const onPointerMove = (e) => {
        const i = idxFromEvent(e);
        setHover(i);
        if (drag) setDrag((d) => ({ ...d, b: i }));
    };
    const onPointerUp = () => {
        if (!drag) return;
        if (Math.abs(drag.b - drag.a) >= 1) applyRange(drag.a, drag.b);
        else setPinned((p) => (p === drag.a ? null : drag.a));
        setDrag(null);
    };
    const onKeyDown = (e) => {
        const cur = active ?? lo;
        if (e.key === 'ArrowRight') { e.preventDefault(); setPinned(clamp(cur + 1, lo, hi)); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); setPinned(clamp(cur - 1, lo, hi)); }
        else if (e.key === '+' || e.key === '=') zoomBy(0.5);
        else if (e.key === '-') zoomBy(2);
        else if (e.key === 'Escape') { setPinned(null); setRange([0, n - 1]); }
    };
    const onDateChange = (which, value) => {
        const idx = isoDates.findIndex((d) => d >= value);
        const target = idx === -1 ? n - 1 : which === 'to' && isoDates[idx] !== value ? Math.max(0, idx - 1) : idx;
        if (which === 'from') applyRange(target, Math.max(target + 1, hi));
        else applyRange(Math.min(lo, target - 1), target);
    };

    const tipLeftPct = active !== null ? (x(active) / w) * 100 : 0;
    const delta = active !== null && compare && compare[active] ? ((data[active] - compare[active]) / compare[active]) * 100 : null;
    const fmtDelta = (d) => `${d >= 0 ? '+' : ''}${d.toFixed(1).replace('.', ',')}%`;

    return (
        <div className="lc">
            <div className="lc-toolbar">
                <div className="lc-dates">
                    <label className="lc-date">
                        <span>Desde</span>
                        <input type="date" value={isoDates[lo]} min={isoDates[0]} max={isoDates[n - 2]} onChange={(e) => e.target.value && onDateChange('from', e.target.value)} />
                    </label>
                    <label className="lc-date">
                        <span>Hasta</span>
                        <input type="date" value={isoDates[hi]} min={isoDates[1]} max={isoDates[n - 1]} onChange={(e) => e.target.value && onDateChange('to', e.target.value)} />
                    </label>
                </div>
                <div className="lc-zoom" role="group" aria-label="Zoom del gráfico">
                    <button type="button" className="btn btn-sm" onClick={() => zoomBy(0.5)} disabled={len <= 2} aria-label="Acercar">+</button>
                    <button type="button" className="btn btn-sm" onClick={() => zoomBy(2)} disabled={!zoomed} aria-label="Alejar">−</button>
                    <button type="button" className="btn btn-sm" onClick={() => { setRange([0, n - 1]); setPinned(null); }} disabled={!zoomed}>Restablecer</button>
                </div>
            </div>

            <div className="lc-plot">
                <svg
                    ref={svgRef}
                    className="chart lc-svg"
                    viewBox={`0 0 ${w} ${h}`}
                    role="img"
                    tabIndex={0}
                    aria-label={`Gráfico de evolución del ${longDate(isoDates[lo])} al ${longDate(isoDates[hi])}. Flechas para recorrer días, + y − para zoom.`}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={() => { setHover(null); }}
                    onDoubleClick={() => { setRange([0, n - 1]); setPinned(null); }}
                    onKeyDown={onKeyDown}
                >
                    <defs>
                        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0" stopColor="#22d3ee" stopOpacity="0.22" />
                            <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {[0, 1, 2, 3].map((i) => {
                        const yy = padY + (i * (h - padY * 2)) / 3;
                        const val = max - (i * max) / 3;
                        return (
                            <g key={i}>
                                <line x1={padX} x2={w - padX} y1={yy} y2={yy} stroke="rgba(255,255,255,0.06)" />
                                <text x={padX - 8} y={yy + 3} fill="#71717a" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">{format(Math.round(val * 10) / 10)}</text>
                            </g>
                        );
                    })}
                    {drag && drag.a !== drag.b && (
                        <rect x={x(Math.min(drag.a, drag.b))} y={padY} width={Math.abs(x(drag.b) - x(drag.a))} height={h - padY * 2} fill="rgba(34,211,238,0.1)" stroke="rgba(34,211,238,0.4)" />
                    )}
                    {viewCmp && <path d={path(viewCmp)} fill="none" stroke="#71717a" strokeWidth="1.5" strokeDasharray="4 4" />}
                    <path d={area} fill={`url(#${gradId})`} />
                    <path d={path(view)} fill="none" stroke="#22d3ee" strokeWidth="2" />
                    {active !== null && (
                        <g pointerEvents="none">
                            <line x1={x(active)} x2={x(active)} y1={padY} y2={h - padY} stroke="rgba(250,250,250,0.25)" />
                            {viewCmp && <circle cx={x(active)} cy={y(compare[active])} r="3.5" fill="#09090b" stroke="#71717a" strokeWidth="1.5" />}
                            <circle cx={x(active)} cy={y(data[active])} r="4.5" fill="#09090b" stroke="#22d3ee" strokeWidth="2" />
                        </g>
                    )}
                    {pinned !== null && pinned !== hover && pinned >= lo && pinned <= hi && (
                        <circle cx={x(pinned)} cy={y(data[pinned])} r="4.5" fill="#22d3ee" pointerEvents="none" />
                    )}
                    {labels && labels.slice(lo, hi + 1).map((l, k) => (k % step === 0 ? (
                        <text key={k} x={x(lo + k)} y={h - 6} fill="#71717a" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono">{l}</text>
                    ) : null))}
                </svg>

                {active !== null && (
                    <div className={`lc-tip ${tipLeftPct > 60 ? 'left' : ''}`} style={{ left: `${tipLeftPct}%` }} role="status">
                        <div className="lc-tip-date">{longDate(isoDates[active])}{pinned === active && <span className="lc-tip-pin">fijado</span>}</div>
                        <div className="lc-tip-row"><span className="lc-sw" />{seriesLabel}<strong>{format(data[active])}</strong></div>
                        {compare && <div className="lc-tip-row"><span className="lc-sw cmp" />{compareLabel}<strong>{format(compare[active])}</strong></div>}
                        {delta !== null && <div className={`lc-tip-delta ${delta >= 0 ? 'up' : 'down'}`}>{fmtDelta(delta)} vs. anterior</div>}
                        {active > 0 && <div className="lc-tip-sub">Día anterior: {format(data[active - 1])}</div>}
                    </div>
                )}
            </div>
            <p className="lc-hint">Pasa el ratón para ver el detalle · clic para fijar · arrastra para hacer zoom · doble clic para restablecer</p>
        </div>
    );
}

export function Bars({ items, format = (v) => v }) {
    const max = Math.max(...items.map((i) => i.value));
    return (
        <div className="bars">
            {items.map((it, idx) => (
                <div className="bar-row" key={it.label}>
                    <span className="muted">{it.label}</span>
                    <div className="bar-track"><div className={`bar-fill ${idx > 0 ? 'dim' : ''}`} style={{ width: `${(it.value / max) * 100}%` }} /></div>
                    <span className="mono" style={{ textAlign: 'right' }}>{format(it.value)}</span>
                </div>
            ))}
        </div>
    );
}

export function useToast() {
    const [msg, setMsg] = useState(null);
    const show = (m) => {
        setMsg(m);
        clearTimeout(show._t);
        show._t = setTimeout(() => setMsg(null), 2400);
    };
    const node = msg ? <div className="toast" role="status">{msg}</div> : null;
    return [node, show];
}

export const eur = (n) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
export const num = (n) => n.toLocaleString('es-ES');
