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

export function LineChart({ data, labels, height = 220, compare }) {
    const w = 640, h = height, pad = 28;
    const all = compare ? data.concat(compare) : data;
    const max = Math.max(...all) * 1.1, min = 0;
    const x = (i) => pad + (i * (w - pad * 2)) / (data.length - 1);
    const y = (v) => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    const path = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `${path(data)} L${x(data.length - 1)},${h - pad} L${x(0)},${h - pad} Z`;
    return (
        <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Gráfico de evolución">
            <defs>
                <linearGradient id="lc-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#22d3ee" stopOpacity="0.22" />
                    <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
                </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((i) => {
                const yy = pad + (i * (h - pad * 2)) / 3;
                return <line key={i} x1={pad} x2={w - pad} y1={yy} y2={yy} stroke="rgba(255,255,255,0.06)" />;
            })}
            {compare && <path d={path(compare)} fill="none" stroke="#71717a" strokeWidth="1.5" strokeDasharray="4 4" />}
            <path d={area} fill="url(#lc-fill)" />
            <path d={path(data)} fill="none" stroke="#22d3ee" strokeWidth="2" />
            {labels && labels.map((l, i) => (i % Math.ceil(labels.length / 7) === 0 ? (
                <text key={i} x={x(i)} y={h - 8} fill="#71717a" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono">{l}</text>
            ) : null))}
        </svg>
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
