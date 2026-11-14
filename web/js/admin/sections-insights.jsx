import { SectionHeader, Card, Stat, Badge, Button, Toggle, Field, Icon, LineChart, Bars, Chips, eur, num } from './ui.jsx';
import { DAYS, SESSIONS, ACTIVE_USERS, SEO_PAGES, INVOICES, NOTICES, REVENUE } from './data.js';

const { useState } = React;

export function Analytics() {
    const [metric, setMetric] = useState('Sesiones');
    const series = metric === 'Sesiones' ? SESSIONS : ACTIVE_USERS;
    return (
        <>
            <SectionHeader eyebrow="Insights" title="Analítica" desc="Uso de la app por sección, retención y fuentes de adquisición.">
                <Button icon="download">Exportar</Button>
            </SectionHeader>
            <div className="grid g-4">
                <Stat label="Sesiones (30 d)" value={num(SESSIONS.reduce((a, b) => a + b, 0))} delta="12,7%" />
                <Stat label="Duración media" value="23m 41s" delta="4,2%" />
                <Stat label="Retención D30" value="41,8%" delta="2,1%" />
                <Stat label="Pistas analizadas" value="186.420" delta="22,5%" />
            </div>
            <Card title="Tendencia" action={<Chips label="Métrica" options={['Sesiones', 'Usuarios activos']} value={metric} onChange={setMetric} />}>
                <LineChart data={series} labels={DAYS} seriesLabel={metric} />
            </Card>
            <div className="grid g-2">
                <Card title="Uso por sección">
                    <Bars items={[{ label: 'Copilot', value: 38 }, { label: 'Cues', value: 24 }, { label: 'Sets', value: 18 }, { label: 'Map', value: 12 }, { label: 'Auditar', value: 8 }]} format={(v) => `${v}%`} />
                </Card>
                <Card title="Adquisición">
                    <Bars items={[{ label: 'Orgánico', value: 4820 }, { label: 'Referidos', value: 2140 }, { label: 'Instagram', value: 1760 }, { label: 'YouTube', value: 980 }, { label: 'Email', value: 610 }]} format={num} />
                </Card>
            </div>
        </>
    );
}

function ScoreRing({ value }) {
    const r = 36, c = 2 * Math.PI * r;
    return (
        <div className="score-ring" role="img" aria-label={`Puntuación SEO ${value} de 100`}>
            <svg width="84" height="84" viewBox="0 0 84 84">
                <circle cx="42" cy="42" r={r} fill="none" stroke="#1b1b21" strokeWidth="6" />
                <circle cx="42" cy="42" r={r} fill="none" stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 42 42)" />
            </svg>
            <span>{value}</span>
        </div>
    );
}

export function Seo({ toast }) {
    const [meta, setMeta] = useState({ title: 'BEATWAVE PRO — Precision Audio Intelligence', desc: 'Analiza, organiza y mezcla tu música con IA: BPM, tonalidad, cues y un copiloto en directo para DJs.' });
    const avg = Math.round(SEO_PAGES.reduce((a, p) => a + p.score, 0) / SEO_PAGES.length);
    return (
        <>
            <SectionHeader eyebrow="Insights" title="SEO" desc="Rendimiento orgánico por página y edición de metadatos con vista previa de Google.">
                <Button icon="refresh" onClick={() => toast('Auditoría SEO lanzada')}>Auditar ahora</Button>
            </SectionHeader>
            <div className="grid g-main">
                <Card title="Páginas indexadas" bodyClass="">
                    <div className="tbl-wrap">
                        <table className="tbl">
                            <thead><tr><th>Ruta</th><th>Título</th><th className="num">Clics</th><th className="num">Pos. media</th><th className="num">Score</th></tr></thead>
                            <tbody>
                                {SEO_PAGES.map((p) => (
                                    <tr key={p.path}>
                                        <td className="mono">{p.path}</td>
                                        <td className="muted" style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</td>
                                        <td className="num">{num(p.clicks)}</td>
                                        <td className="num">{p.pos.toFixed(1)}</td>
                                        <td className="num"><span className={p.score < 70 ? 'danger' : p.score >= 85 ? 'cyan' : ''}>{p.score}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
                <Card title="Salud global">
                    <div className="row" style={{ gap: 16 }}>
                        <ScoreRing value={avg} />
                        <div className="stack" style={{ gap: 4, fontSize: 13 }}>
                            <span><span className="danger mono">2</span> páginas sin meta descripción</span>
                            <span><span className="mono">5</span> imágenes sin texto alternativo</span>
                            <span><span className="cyan mono">0</span> errores 404 activos</span>
                        </div>
                    </div>
                </Card>
            </div>
            <Card title="Metadatos de la home">
                <div className="grid g-2">
                    <div className="stack">
                        <Field label={`Título (${meta.title.length}/60)`} id="seo-t"><input id="seo-t" className="input" maxLength={70} value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} /></Field>
                        <Field label={`Descripción (${meta.desc.length}/160)`} id="seo-d"><textarea id="seo-d" className="textarea" maxLength={180} value={meta.desc} onChange={(e) => setMeta({ ...meta, desc: e.target.value })} /></Field>
                        <div><Button variant="primary" onClick={() => toast('Metadatos guardados')}>Guardar metadatos</Button></div>
                    </div>
                    <div className="serp" aria-label="Vista previa en Google">
                        <div className="serp-url">beatwave.pro › inicio</div>
                        <div className="serp-title">{meta.title.length > 60 ? meta.title.slice(0, 60) + '…' : meta.title}</div>
                        <p className="serp-desc">{meta.desc.length > 160 ? meta.desc.slice(0, 160) + '…' : meta.desc}</p>
                    </div>
                </div>
            </Card>
        </>
    );
}

const invTone = { pagada: 'on', fallida: 'err', reembolsada: 'off' };

export function Billing({ toast }) {
    const [filter, setFilter] = useState('Todas');
    const list = INVOICES.filter((i) => filter === 'Todas' || i.status === filter.toLowerCase());
    return (
        <>
            <SectionHeader eyebrow="Negocio" title="Facturación" desc="Ingresos recurrentes, facturas emitidas, cobros fallidos y reembolsos.">
                <Button icon="external" onClick={() => toast('Abriendo pasarela de pago')}>Abrir pasarela</Button>
                <Button icon="download">Exportar facturas</Button>
            </SectionHeader>
            <div className="grid g-4">
                <Stat label="MRR" value={eur(18640)} delta="7,9%" />
                <Stat label="ARR" value={eur(223680)} delta="7,9%" />
                <Stat label="ARPU" value="11,42 €" delta="1,6%" />
                <Stat label="Cobros fallidos" value="14" delta="-3" />
            </div>
            <Card title="Facturas" bodyClass="" action={<Chips label="Estado" options={['Todas', 'Pagada', 'Fallida', 'Reembolsada']} value={filter} onChange={setFilter} />}>
                <div className="tbl-wrap">
                    <table className="tbl">
                        <thead><tr><th>Factura</th><th>Cliente</th><th>Plan</th><th>Fecha</th><th className="num">Importe</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
                        <tbody>
                            {list.map((i) => (
                                <tr key={i.id}>
                                    <td className="mono">{i.id}</td>
                                    <td>{i.client}</td>
                                    <td className="muted">{i.plan}</td>
                                    <td className="mono faint">{i.date}</td>
                                    <td className="num">{i.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                    <td><Badge tone={invTone[i.status]}>{i.status}</Badge></td>
                                    <td style={{ textAlign: 'right' }}>
                                        {i.status === 'fallida'
                                            ? <Button size="sm" onClick={() => toast(`Reintentando cobro ${i.id}`)}>Reintentar</Button>
                                            : <Button size="sm" variant="ghost" icon="download" aria-label={`Descargar ${i.id}`} />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            <Card title="Ingresos diarios">
                <LineChart data={REVENUE} labels={DAYS} height={180} format={eur} seriesLabel="Ingresos" />
            </Card>
        </>
    );
}

export function Notices({ toast }) {
    const [items, setItems] = useState(NOTICES);
    const [form, setForm] = useState({ title: '', body: '', channel: 'In-app', audience: 'Todos' });
    const send = (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.body.trim()) return;
        setItems([{ id: 'n' + Date.now(), ...form, date: new Date().toISOString().slice(0, 10), status: 'enviado' }, ...items]);
        setForm({ title: '', body: '', channel: 'In-app', audience: 'Todos' });
        toast('Aviso enviado');
    };
    return (
        <>
            <SectionHeader eyebrow="Sistema" title="Avisos" desc="Comunica mantenimientos, novedades e incidencias por notificación in-app, email o ambos." />
            <div className="grid g-main">
                <Card title="Historial" bodyClass="list">
                    {items.map((n) => (
                        <div key={n.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                            <div className="ico-box"><Icon name="bell" /></div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="row between wrap">
                                    <strong style={{ fontWeight: 600 }}>{n.title}</strong>
                                    <Badge tone={n.status === 'enviado' ? 'on' : 'off'}>{n.status}</Badge>
                                </div>
                                <p className="muted" style={{ margin: '4px 0', textWrap: 'pretty' }}>{n.body}</p>
                                <span className="faint" style={{ fontSize: 12 }}>{n.channel} · {n.audience} · <span className="mono">{n.date}</span></span>
                            </div>
                        </div>
                    ))}
                </Card>
                <Card title="Nuevo aviso">
                    <form className="stack" onSubmit={send}>
                        <Field label="Título" id="nt-t"><input id="nt-t" className="input" maxLength={80} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
                        <Field label="Mensaje" id="nt-b"><textarea id="nt-b" className="textarea" maxLength={400} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></Field>
                        <div className="grid g-2" style={{ gap: 10 }}>
                            <Field label="Canal" id="nt-c">
                                <select id="nt-c" className="select" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}><option>In-app</option><option>Email</option><option>In-app + Email</option></select>
                            </Field>
                            <Field label="Audiencia" id="nt-a">
                                <select id="nt-a" className="select" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}><option>Todos</option><option>FREE</option><option>PRO</option><option>STUDIO</option><option>Impagos</option></select>
                            </Field>
                        </div>
                        <button type="submit" className="btn btn-primary"><Icon name="send" /> Enviar aviso</button>
                    </form>
                </Card>
            </div>
        </>
    );
}

export function Settings({ toast }) {
    const [flags, setFlags] = useState({ maintenance: false, signups: true, twofa: true, betas: false });
    const items = [
        ['maintenance', 'Modo mantenimiento', 'Muestra una pantalla de mantenimiento a todos los usuarios.'],
        ['signups', 'Registro abierto', 'Permite que nuevos usuarios creen cuenta.'],
        ['twofa', '2FA obligatorio para admins', 'Exige segundo factor en este panel.'],
        ['betas', 'Funciones beta', 'Activa funciones experimentales para usuarios STUDIO.'],
    ];
    const admins = [['Víctor Rueda', 'admin@beatwave.pro', 'Propietario'], ['Laura M.', 'laura@beatwave.pro', 'Marketing'], ['Soporte', 'soporte@beatwave.pro', 'Solo lectura']];
    return (
        <>
            <SectionHeader eyebrow="Sistema" title="Ajustes" desc="Interruptores globales de la plataforma y equipo con acceso al panel." />
            <div className="grid g-2">
                <Card title="Plataforma" bodyClass="list">
                    {items.map(([k, t, d]) => (
                        <div key={k} className="list-item">
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500 }}>{t}</div>
                                <div className="faint" style={{ fontSize: 12 }}>{d}</div>
                            </div>
                            <Toggle label={t} checked={flags[k]} onChange={(v) => { setFlags({ ...flags, [k]: v }); toast(`${t}: ${v ? 'activado' : 'desactivado'}`); }} />
                        </div>
                    ))}
                </Card>
                <Card title="Equipo" bodyClass="list" action={<Button size="sm" icon="plus" onClick={() => toast('Invitación enviada')}>Invitar</Button>}>
                    {admins.map(([n, e, r]) => (
                        <div key={e} className="list-item">
                            <div className="adm-avatar">{n.split(' ').map((p) => p[0]).join('').slice(0, 2)}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 500 }}>{n}</div>
                                <div className="faint" style={{ fontSize: 12 }}>{e}</div>
                            </div>
                            <Badge plain>{r}</Badge>
                        </div>
                    ))}
                </Card>
            </div>
        </>
    );
}
