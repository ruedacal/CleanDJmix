import { SectionHeader, Card, Stat, Badge, Button, Icon, LineChart, Bars, Chips, num } from './ui.jsx';
import { DAYS } from './data.js';
import {
    SQL_TABLES, SAVED_QUERIES, TIME_BY_SECTION, BEHAVIOR_KPIS, AVG_SESSION_TREND, TRACKS_HISTOGRAM,
    TOP_PROCESSORS, FLOW_SECTIONS, TRANSITIONS, TOP_PATHS, COHORTS, DEVICE_SPLIT,
} from './data-deep.js';
import { runSql, toCsv } from './sql.js';

const { useState, useMemo } = React;

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/* ── Consultas SQL ─────────────────────────────────────────────── */
export function QueryConsole({ toast }) {
    const [sql, setSql] = useState(SAVED_QUERIES[0].sql);
    const [result, setResult] = useState(() => runSql(SAVED_QUERIES[0].sql, SQL_TABLES));
    const [error, setError] = useState(null);
    const [view, setView] = useState('Tabla');
    const [history, setHistory] = useState([]);
    const [saved, setSaved] = useState(SAVED_QUERIES);

    const run = (q = sql) => {
        try {
            const r = runSql(q, SQL_TABLES);
            setResult(r);
            setError(null);
            setHistory((h) => [{ sql: q, rows: r.total, ms: r.ms, at: new Date().toLocaleTimeString('es-ES') }, ...h].slice(0, 8));
        } catch (e) {
            setError(e.message);
            setResult(null);
        }
    };

    const onKeyDown = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            run();
        }
    };

    const load = (q) => {
        setSql(q);
        run(q);
    };

    const insert = (text) => setSql((s) => `${s}${/\s$/.test(s) || !s ? '' : ' '}${text}`);

    const exportCsv = () => {
        if (!result) return;
        const blob = new Blob([toCsv(result.columns, result.rows)], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'consulta-beatwave.csv';
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const saveQuery = () => {
        const name = window.prompt('Nombre de la consulta');
        if (!name) return;
        setSaved((s) => [{ name, sql }, ...s]);
        toast('Consulta guardada');
    };

    const chartable = result && result.columns.length >= 2 && result.rows.length > 0 && result.rows.every((r) => typeof r[r.length - 1] === 'number');

    return (
        <>
            <SectionHeader eyebrow="Datos" title="Consultas SQL" desc="Lanza consultas de solo lectura contra la base de datos. Ctrl/⌘ + Enter para ejecutar. Las sentencias de escritura están bloqueadas.">
                <Button icon="download" onClick={exportCsv} disabled={!result}>Exportar CSV</Button>
                <Button icon="plus" onClick={saveQuery}>Guardar consulta</Button>
            </SectionHeader>

            <div className="grid q-layout">
                <aside className="stack">
                    <Card title="Esquema" bodyClass="schema">
                        {Object.entries(SQL_TABLES).map(([name, t]) => (
                            <details key={name} className="schema-table" open={name === 'eventos_seccion'}>
                                <summary>
                                    <Icon name="db" size={14} />
                                    <span className="mono">{name}</span>
                                    <span className="faint mono schema-count">{num(t.rows.length)}</span>
                                </summary>
                                <ul>
                                    <li><button type="button" className="schema-col" onClick={() => insert(name)}>insertar tabla</button></li>
                                    {t.columns.map((c) => (
                                        <li key={c}>
                                            <button type="button" className="schema-col mono" onClick={() => insert(c)}>
                                                {c}<span className="faint">{typeof t.rows[0][c] === 'number' ? 'num' : 'text'}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        ))}
                    </Card>
                    <Card title="Consultas guardadas" bodyClass="list">
                        {saved.map((q) => (
                            <button key={q.name} type="button" className="list-item saved-q" onClick={() => load(q.sql)}>
                                <Icon name="play" size={12} />
                                <span>{q.name}</span>
                            </button>
                        ))}
                    </Card>
                </aside>

                <div className="stack">
                    <section className="card">
                        <div className="card-head">
                            <h2 className="card-title">Editor</h2>
                            <div className="row">
                                <Badge tone="on">read-only</Badge>
                                <Button variant="primary" size="sm" icon="play" onClick={() => run()}>Ejecutar</Button>
                            </div>
                        </div>
                        <label htmlFor="sql-editor" className="sr-only">Consulta SQL</label>
                        <textarea id="sql-editor" className="sql-editor" spellCheck="false" value={sql} onChange={(e) => setSql(e.target.value)} onKeyDown={onKeyDown} rows={7} />
                    </section>

                    <section className="card">
                        <div className="card-head">
                            <h2 className="card-title">
                                Resultado
                                {result && <span className="faint mono q-meta">{num(result.total)} filas · {result.ms} ms{result.total > result.rows.length ? ` · mostrando ${result.rows.length}` : ''}</span>}
                            </h2>
                            {chartable && <Chips label="Vista del resultado" options={['Tabla', 'Gráfica']} value={view} onChange={setView} />}
                        </div>
                        {error && <p className="q-error" role="alert"><Icon name="x" size={14} />{error}</p>}
                        {result && (view === 'Gráfica' && chartable ? (
                            <div className="card-body">
                                <Bars items={result.rows.slice(0, 15).map((r) => ({ label: String(r[0]), value: r[r.length - 1] }))} format={(v) => num(v)} />
                            </div>
                        ) : (
                            <div className="tbl-wrap q-results">
                                <table className="tbl">
                                    <thead><tr>{result.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
                                    <tbody>
                                        {result.rows.map((r, i) => (
                                            <tr key={i}>{r.map((v, j) => <td key={j} className={typeof v === 'number' ? 'num mono' : 'mono'}>{v == null ? <span className="faint">NULL</span> : typeof v === 'number' ? num(v) : v}</td>)}</tr>
                                        ))}
                                    </tbody>
                                </table>
                                {!result.rows.length && <p className="empty">La consulta no devolvió filas.</p>}
                            </div>
                        ))}
                    </section>

                    {history.length > 0 && (
                        <Card title="Historial de esta sesión" bodyClass="list">
                            {history.map((h, i) => (
                                <button key={i} type="button" className="list-item saved-q" onClick={() => load(h.sql)}>
                                    <span className="mono faint">{h.at}</span>
                                    <span className="mono q-hist">{h.sql.replace(/\s+/g, ' ')}</span>
                                    <span className="mono faint">{h.rows} f · {h.ms} ms</span>
                                </button>
                            ))}
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}

/* ── Comportamiento ────────────────────────────────────────────── */
function VBars({ items, label }) {
    const max = Math.max(...items.map((i) => i.value));
    return (
        <div className="vbars" role="img" aria-label={label}>
            {items.map((it) => (
                <div key={it.label} className="vbar">
                    <span className="mono vbar-val">{it.value}</span>
                    <div className="vbar-track"><div className="vbar-fill" style={{ height: `${(it.value / max) * 100}%` }} /></div>
                    <span className="mono faint vbar-label">{it.label}</span>
                </div>
            ))}
        </div>
    );
}

const heat = (v, max = 100) => ({ background: `rgba(34, 211, 238, ${(0.06 + (v / max) * 0.8).toFixed(2)})`, color: v / max > 0.55 ? 'var(--bw-cyan-ink)' : 'var(--bw-white)' });

function TransitionMatrix() {
    const max = Math.max(...TRANSITIONS.flatMap((t) => t.values));
    return (
        <div className="tbl-wrap">
            <table className="heat">
                <caption className="sr-only">Porcentaje de usuarios que pasan de una sección (fila) a otra (columna)</caption>
                <thead>
                    <tr><th scope="col"><span className="faint">desde ↓ / hacia →</span></th>{FLOW_SECTIONS.map((s) => <th key={s} scope="col">{s}</th>)}</tr>
                </thead>
                <tbody>
                    {TRANSITIONS.map((t) => (
                        <tr key={t.from}>
                            <th scope="row">{t.from}</th>
                            {t.values.map((v, j) => (
                                <td key={j} style={v ? heat(v, max) : undefined} className="mono">{v ? `${v}%` : '—'}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Cohorts() {
    return (
        <div className="tbl-wrap">
            <table className="heat">
                <caption className="sr-only">Retención mensual por cohorte de alta</caption>
                <thead>
                    <tr><th scope="col">Cohorte</th><th scope="col">Usuarios</th>{[0, 1, 2, 3, 4, 5].map((m) => <th key={m} scope="col">M{m}</th>)}</tr>
                </thead>
                <tbody>
                    {COHORTS.map((c) => (
                        <tr key={c.cohort}>
                            <th scope="row">{c.cohort}</th>
                            <td className="mono muted">{num(c.size)}</td>
                            {[0, 1, 2, 3, 4, 5].map((m) => (c.values[m] != null
                                ? <td key={m} className="mono" style={heat(c.values[m])}>{c.values[m]}%</td>
                                : <td key={m} className="heat-empty" />))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function Behavior({ go }) {
    const [range, setRange] = useState('30 días');
    const k = BEHAVIOR_KPIS;
    const totalSec = useMemo(() => TIME_BY_SECTION.reduce((a, b) => a + b.value * b.visits, 0), []);

    return (
        <>
            <SectionHeader eyebrow="Insights" title="Comportamiento de usuarios" desc="Tiempo de uso, navegación entre secciones, retención y volumen de temas procesados por usuario.">
                <Chips label="Rango" options={['7 días', '30 días', '90 días']} value={range} onChange={setRange} />
                <Button icon="terminal" onClick={() => go('query')}>Abrir en SQL</Button>
            </SectionHeader>

            <div className="grid g-4">
                <Stat label="Tiempo medio por sesión" value={`${k.avgSessionMin.toFixed(1)} min`} delta="6,2%" />
                <Stat label="Sesiones por usuario" value={k.sessionsPerUser.toFixed(1)} delta="3,1%" />
                <Stat label="Temas procesados / usuario" value={k.tracksPerUser.toFixed(1)} delta="11,4%" />
                <Stat label="Secciones por sesión" value={k.sectionsPerSession.toFixed(1)} delta="-1,8%" />
            </div>

            <div className="grid g-main">
                <Card title="Duración media de sesión (min)" action={<span className="faint mono">{range}</span>}>
                    <LineChart data={AVG_SESSION_TREND} labels={DAYS} />
                </Card>
                <Card title="Sesiones por dispositivo">
                    <Bars items={DEVICE_SPLIT} format={num} />
                </Card>
            </div>

            <div className="grid g-2">
                <Card title="Tiempo medio por sección (mm:ss)">
                    <Bars items={TIME_BY_SECTION} format={mmss} />
                </Card>
                <Card title="Reparto del tiempo total" bodyClass="tbl-wrap">
                    <table className="tbl">
                        <thead><tr><th scope="col">Sección</th><th scope="col" className="num">Visitas</th><th scope="col" className="num">Media</th><th scope="col" className="num">% tiempo</th></tr></thead>
                        <tbody>
                            {TIME_BY_SECTION.map((s) => (
                                <tr key={s.label}>
                                    <td>{s.label}</td>
                                    <td className="num mono">{num(s.visits)}</td>
                                    <td className="num mono">{mmss(s.value)}</td>
                                    <td className="num mono">{((s.value * s.visits * 100) / totalSec).toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>

            <Card title="Navegación entre secciones" action={<span className="faint">% de salidas desde cada sección</span>}>
                <TransitionMatrix />
            </Card>

            <div className="grid g-main">
                <Card title="Recorridos más frecuentes" bodyClass="list">
                    {TOP_PATHS.map((p) => (
                        <div key={p.path.join()} className="list-item path-row">
                            <div className="path">
                                {p.path.map((step, i) => (
                                    <React.Fragment key={step + i}>
                                        {i > 0 && <span className="faint" aria-hidden="true">→</span>}
                                        <span className="code-tag">{step}</span>
                                    </React.Fragment>
                                ))}
                            </div>
                            <span className="mono muted">{p.share}% sesiones</span>
                            <span className="mono cyan">{p.conv}% conv.</span>
                        </div>
                    ))}
                </Card>
                <Card title="Temas procesados por usuario">
                    <VBars items={TRACKS_HISTOGRAM} label="Distribución de usuarios por número de temas procesados" />
                    <p className="faint vbars-cap">Nº de usuarios por tramo de temas procesados</p>
                </Card>
            </div>

            <div className="grid g-main">
                <Card title="Retención por cohorte">
                    <Cohorts />
                </Card>
                <Card title="Usuarios con más temas" bodyClass="tbl-wrap">
                    <table className="tbl">
                        <thead><tr><th scope="col">Usuario</th><th scope="col">Plan</th><th scope="col" className="num">Temas</th><th scope="col" className="num">Min</th></tr></thead>
                        <tbody>
                            {TOP_PROCESSORS.map((u) => (
                                <tr key={u.id}>
                                    <td className="mono">{u.email}</td>
                                    <td><Badge tone={u.plan === 'FREE' ? 'off' : 'on'} plain>{u.plan}</Badge></td>
                                    <td className="num mono">{u.temas_procesados}</td>
                                    <td className="num mono">{num(u.minutos_totales)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}
