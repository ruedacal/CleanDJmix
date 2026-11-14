import { SectionHeader, Card, Stat, Badge, Button, Icon, LineChart, Bars, Chips, eur, num } from './ui.jsx';
import { DAYS, REVENUE, REVENUE_PREV, LOGS, DB_TABLES, ACTIVE_USERS } from './data.js';

const { useState, useMemo } = React;

export function Overview({ go }) {
    const total = REVENUE.reduce((a, b) => a + b, 0);
    return (
        <>
            <SectionHeader eyebrow="Resumen" title="Estado de la plataforma" desc="Ingresos, usuarios y salud del sistema en los últimos 30 días.">
                <Button icon="download">Exportar informe</Button>
            </SectionHeader>
            <div className="grid g-4">
                <Stat label="Ingresos (30 d)" value={eur(total)} delta="18,4%" />
                <Stat label="Usuarios activos" value={num(ACTIVE_USERS[ACTIVE_USERS.length - 1])} delta="9,1%" />
                <Stat label="Suscripciones PRO" value="1.284" delta="6,3%" />
                <Stat label="Tasa de abandono" value="2,9%" delta="-0,4%" />
            </div>
            <div className="grid g-main">
                <Card title="Ingresos diarios" action={<span className="faint" style={{ fontSize: 12 }}>— periodo anterior</span>}>
                    <LineChart data={REVENUE} compare={REVENUE_PREV} labels={DAYS} format={eur} seriesLabel="Ingresos" />
                </Card>
                <Card title="Accesos rápidos">
                    <div className="stack">
                        {[
                            ['ticket', 'Crear código descuento', 'codes'],
                            ['megaphone', 'Lanzar promoción', 'promos'],
                            ['image', 'Nuevo banner', 'banners'],
                            ['bell', 'Enviar aviso', 'notices'],
                        ].map(([ic, label, id]) => (
                            <button key={id} type="button" className="btn" style={{ justifyContent: 'flex-start', height: 42 }} onClick={() => go(id)}>
                                <Icon name={ic} /> {label}
                            </button>
                        ))}
                    </div>
                </Card>
            </div>
            <div className="grid g-2">
                <Card title="Ingresos por plan">
                    <Bars items={[{ label: 'PRO mensual', value: 21400 }, { label: 'PRO anual', value: 18900 }, { label: 'STUDIO', value: 9800 }, { label: 'Equipos', value: 4200 }]} format={eur} />
                </Card>
                <Card title="Últimos eventos" bodyClass="log" action={<button type="button" className="btn btn-ghost btn-sm" onClick={() => go('logs')}>Ver logs</button>}>
                    {LOGS.slice(0, 5).map((l, i) => (
                        <div key={i} className="log-line" style={{ gridTemplateColumns: '70px 56px 1fr' }}>
                            <span className="faint">{l[0].slice(11)}</span>
                            <span className={`lvl-${l[1]}`}>{l[1]}</span>
                            <span className="muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l[3]}</span>
                        </div>
                    ))}
                </Card>
            </div>
        </>
    );
}

const stateTone = (v) => (['activo', 'completo', 'sí'].includes(v) ? 'on' : ['suspendido', 'error', 'impago'].includes(v) ? 'err' : null);

export function Database({ toast }) {
    const [table, setTable] = useState('users');
    const [q, setQ] = useState('');
    const t = DB_TABLES[table];
    const rows = useMemo(() => t.rows.filter((r) => r.join(' ').toLowerCase().includes(q.toLowerCase())), [t, q]);
    return (
        <>
            <SectionHeader eyebrow="Datos" title="Base de datos" desc="Explora, filtra y edita registros de las tablas principales. Los cambios quedan registrados en Logs.">
                <Button icon="download" onClick={() => toast(`Exportando ${table}.csv`)}>Exportar CSV</Button>
                <Button icon="plus" variant="primary" onClick={() => toast('Nuevo registro (pendiente de backend)')}>Nuevo registro</Button>
            </SectionHeader>
            <div className="grid g-4">
                {Object.entries(DB_TABLES).map(([name, tb]) => (
                    <button key={name} type="button" className="card stat" style={{ cursor: 'pointer', textAlign: 'left', borderColor: table === name ? 'var(--bw-cyan)' : undefined }} onClick={() => { setTable(name); setQ(''); }} aria-pressed={table === name}>
                        <span className="stat-label row"><Icon name="db" size={14} /> {name}</span>
                        <span className="stat-value">{num(tb.rows.length * 1873 + 12)}</span>
                        <span className="faint mono" style={{ fontSize: 11 }}>{tb.columns.length} columnas</span>
                    </button>
                ))}
            </div>
            <Card
                title={<span className="mono">public.{table}</span>}
                bodyClass=""
                action={
                    <div className="adm-search" style={{ height: 32, maxWidth: 260 }}>
                        <Icon name="search" size={14} />
                        <label htmlFor="db-q" className="sr-only">Buscar en la tabla</label>
                        <input id="db-q" placeholder="Filtrar filas…" value={q} onChange={(e) => setQ(e.target.value)} />
                    </div>
                }
            >
                <div className="tbl-wrap">
                    <table className="tbl">
                        <thead><tr>{t.columns.map((c) => <th key={c} scope="col">{c}</th>)}<th><span className="sr-only">Acciones</span></th></tr></thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r[0]}>
                                    {r.map((cell, i) => {
                                        const tone = stateTone(cell);
                                        return <td key={i} className={i === 0 ? 'mono faint' : ''}>{tone ? <Badge tone={tone}>{cell}</Badge> : cell}</td>;
                                    })}
                                    <td style={{ textAlign: 'right' }}>
                                        <Button size="sm" variant="ghost" onClick={() => toast(`Editar ${r[0]}`)}>Editar</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!rows.length && <div className="empty">Sin resultados para “{q}”.</div>}
                </div>
            </Card>
        </>
    );
}

export function Logs() {
    const [level, setLevel] = useState('Todos');
    const [q, setQ] = useState('');
    const rows = LOGS.filter((l) => (level === 'Todos' || l[1] === level) && l.join(' ').toLowerCase().includes(q.toLowerCase()));
    return (
        <>
            <SectionHeader eyebrow="Sistema" title="Logs" desc="Registro en tiempo real de API, autenticación, facturación y acciones de administradores.">
                <Button icon="refresh">Actualizar</Button>
                <Button icon="download">Descargar</Button>
            </SectionHeader>
            <div className="row between wrap">
                <Chips label="Nivel" options={['Todos', 'ERROR', 'WARN', 'INFO', 'DEBUG']} value={level} onChange={setLevel} />
                <div className="adm-search" style={{ maxWidth: 300 }}>
                    <Icon name="search" size={14} />
                    <label htmlFor="log-q" className="sr-only">Buscar en logs</label>
                    <input id="log-q" placeholder="Buscar módulo o mensaje…" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
            </div>
            <Card bodyClass="log">
                {rows.map((l, i) => (
                    <div key={i} className="log-line">
                        <span className="faint">{l[0]}</span>
                        <span className={`lvl-${l[1]}`}>{l[1]}</span>
                        <span className="muted">{l[2]}</span>
                        <span>{l[3]}</span>
                    </div>
                ))}
                {!rows.length && <div className="empty">No hay eventos con estos filtros.</div>}
            </Card>
        </>
    );
}
