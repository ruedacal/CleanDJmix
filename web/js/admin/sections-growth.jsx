import { SectionHeader, Card, Badge, Button, Toggle, Field, Icon, num } from './ui.jsx';
import { PROMOS, CODES, SKILLS, BANNERS } from './data.js';

const { useState } = React;

export function Promotions({ toast }) {
    const [items, setItems] = useState(PROMOS);
    const [form, setForm] = useState({ name: '', audience: 'Usuarios FREE', start: '', end: '' });
    const add = (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setItems([{ id: 'p' + Date.now(), ...form, status: true, conv: 0 }, ...items]);
        setForm({ name: '', audience: 'Usuarios FREE', start: '', end: '' });
        toast('Promoción creada');
    };
    return (
        <>
            <SectionHeader eyebrow="Crecimiento" title="Promociones" desc="Campañas con segmentación por audiencia y ventana de fechas. Combínalas con códigos y banners." />
            <div className="grid g-main">
                <Card title="Campañas" bodyClass="">
                    <div className="tbl-wrap">
                        <table className="tbl">
                            <thead><tr><th>Campaña</th><th>Audiencia</th><th>Fechas</th><th className="num">Conv.</th><th>Activa</th></tr></thead>
                            <tbody>
                                {items.map((p) => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                                        <td className="muted">{p.audience}</td>
                                        <td className="mono faint">{p.start || '—'} → {p.end || '—'}</td>
                                        <td className="num">{p.conv.toFixed(1)}%</td>
                                        <td><Toggle label={`Activar ${p.name}`} checked={p.status} onChange={(v) => setItems(items.map((x) => (x.id === p.id ? { ...x, status: v } : x)))} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
                <Card title="Nueva promoción">
                    <form className="stack" onSubmit={add}>
                        <Field label="Nombre" id="pr-name"><input id="pr-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Navidad — STUDIO -30%" required /></Field>
                        <Field label="Audiencia" id="pr-aud">
                            <select id="pr-aud" className="select" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                                <option>Usuarios FREE</option><option>Usuarios PRO</option><option>Usuarios STUDIO</option><option>Inactivos {'>'} 60 días</option><option>Todos</option>
                            </select>
                        </Field>
                        <div className="grid g-2" style={{ gap: 10 }}>
                            <Field label="Inicio" id="pr-s"><input id="pr-s" type="date" className="input" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></Field>
                            <Field label="Fin" id="pr-e"><input id="pr-e" type="date" className="input" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></Field>
                        </div>
                        <button type="submit" className="btn btn-primary"><Icon name="plus" /> Crear promoción</button>
                    </form>
                </Card>
            </div>
        </>
    );
}

const randomCode = () => 'BW' + Math.random().toString(36).slice(2, 8).toUpperCase();

export function Codes({ toast }) {
    const [codes, setCodes] = useState(CODES);
    const [form, setForm] = useState({ code: '', type: '%', value: 15, limit: 100, expires: '' });
    const inject = (e) => {
        e.preventDefault();
        const code = (form.code || randomCode()).toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (codes.some((c) => c.code === code)) return toast('Ese código ya existe');
        setCodes([{ ...form, code, value: Number(form.value), limit: Number(form.limit), uses: 0, expires: form.expires || '—', active: true }, ...codes]);
        setForm({ code: '', type: '%', value: 15, limit: 100, expires: '' });
        toast(`Código ${code} inyectado`);
    };
    return (
        <>
            <SectionHeader eyebrow="Crecimiento" title="Códigos descuento" desc="Genera e inyecta códigos con límite de usos y caducidad. Se validan en el servidor al pagar." />
            <div className="grid g-main">
                <Card title="Códigos" bodyClass="">
                    <div className="tbl-wrap">
                        <table className="tbl">
                            <thead><tr><th>Código</th><th className="num">Descuento</th><th>Usos</th><th>Caduca</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
                            <tbody>
                                {codes.map((c) => {
                                    const pct = c.limit ? Math.min(100, (c.uses / c.limit) * 100) : 0;
                                    return (
                                        <tr key={c.code}>
                                            <td><span className="code-tag">{c.code}</span></td>
                                            <td className="num">{c.type === '%' ? `${c.value}%` : `${c.value} €`}</td>
                                            <td>
                                                <div className="row">
                                                    <span className="mono" style={{ fontSize: 12 }}>{num(c.uses)}{c.limit ? ` / ${num(c.limit)}` : ' / ∞'}</span>
                                                    {c.limit > 0 && <div className="progress"><span style={{ width: `${pct}%` }} /></div>}
                                                </div>
                                            </td>
                                            <td className="mono faint">{c.expires}</td>
                                            <td><Toggle label={`Activar ${c.code}`} checked={c.active} onChange={(v) => setCodes(codes.map((x) => (x.code === c.code ? { ...x, active: v } : x)))} /></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <Button size="sm" variant="ghost" icon="copy" aria-label={`Copiar ${c.code}`} onClick={() => { navigator.clipboard && navigator.clipboard.writeText(c.code); toast('Copiado'); }} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
                <Card title="Inyectar código">
                    <form className="stack" onSubmit={inject}>
                        <Field label="Código (vacío = aleatorio)" id="cd-code">
                            <div className="row">
                                <input id="cd-code" className="input mono" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="NAVIDAD30" maxLength={20} />
                                <Button icon="refresh" aria-label="Generar código" onClick={() => setForm({ ...form, code: randomCode() })} />
                            </div>
                        </Field>
                        <div className="grid g-2" style={{ gap: 10 }}>
                            <Field label="Tipo" id="cd-type">
                                <select id="cd-type" className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="%">Porcentaje</option><option value="€">Importe fijo</option></select>
                            </Field>
                            <Field label="Valor" id="cd-val"><input id="cd-val" type="number" min="1" max={form.type === '%' ? 100 : 500} className="input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required /></Field>
                            <Field label="Límite de usos (0 = ∞)" id="cd-lim"><input id="cd-lim" type="number" min="0" className="input" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} /></Field>
                            <Field label="Caducidad" id="cd-exp"><input id="cd-exp" type="date" className="input" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} /></Field>
                        </div>
                        <button type="submit" className="btn btn-primary"><Icon name="ticket" /> Inyectar código</button>
                    </form>
                </Card>
            </div>
        </>
    );
}

export function Skills({ toast }) {
    const [skills, setSkills] = useState(SKILLS);
    const toggle = (id, v) => { setSkills(skills.map((s) => (s.id === id ? { ...s, active: v } : s))); toast(v ? 'Skill desplegada a usuarios' : 'Skill retirada'); };
    const togglePlan = (id, plan) => setSkills(skills.map((s) => (s.id === id ? { ...s, plans: s.plans.includes(plan) ? s.plans.filter((p) => p !== plan) : [...s.plans, plan] } : s)));
    return (
        <>
            <SectionHeader eyebrow="Crecimiento" title="Skills en campañas" desc="Desbloquea funciones de la app de forma temporal por campaña y plan, sin publicar una nueva versión.">
                <Button icon="plus" variant="primary" onClick={() => toast('Registrar skill (pendiente de backend)')}>Registrar skill</Button>
            </SectionHeader>
            <div className="grid g-2">
                {skills.map((s) => (
                    <Card key={s.id}>
                        <div className="stack">
                            <div className="row between">
                                <div className="row">
                                    <div className="ico-box" style={s.active ? { color: 'var(--bw-cyan)' } : undefined}><Icon name="spark" /></div>
                                    <div>
                                        <h3 className="card-title">{s.name}</h3>
                                        <p className="faint" style={{ margin: 0, fontSize: 12 }}>Campaña: {s.campaign}</p>
                                    </div>
                                </div>
                                <Toggle label={`Desplegar ${s.name}`} checked={s.active} onChange={(v) => toggle(s.id, v)} />
                            </div>
                            <p className="muted" style={{ margin: 0 }}>{s.desc}</p>
                            <div className="row wrap" role="group" aria-label="Planes con acceso">
                                <span className="faint" style={{ fontSize: 12 }}>Planes:</span>
                                {['FREE', 'PRO', 'STUDIO'].map((p) => (
                                    <button key={p} type="button" className="chip" aria-pressed={s.plans.includes(p)} onClick={() => togglePlan(s.id, p)}>{p}</button>
                                ))}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </>
    );
}

export function Banners({ toast }) {
    const [banners, setBanners] = useState(BANNERS);
    const [draft, setDraft] = useState({ title: 'Nuevo set de bienvenida', sub: 'Descarga 20 pistas analizadas gratis', cta: 'Descargar', placement: 'Home — superior', style: 'cyan' });
    const save = () => { setBanners([{ id: 'b' + Date.now(), ...draft, active: false, ctr: 0 }, ...banners]); toast('Banner guardado como borrador'); };
    return (
        <>
            <SectionHeader eyebrow="Crecimiento" title="Banners" desc="Diseña banners con vista previa en vivo y elige dónde aparecen dentro de la app." />
            <div className="grid g-main">
                <Card title="Editor">
                    <div className="stack">
                        <div className={`banner-preview style-${draft.style}`} aria-label="Vista previa del banner">
                            <div>
                                <p className="bp-title">{draft.title || 'Título'}</p>
                                <p className="bp-sub">{draft.sub}</p>
                            </div>
                            <button type="button" className="bp-cta" tabIndex={-1}><span>{draft.cta || 'CTA'}</span></button>
                        </div>
                        <div className="grid g-2" style={{ gap: 10 }}>
                            <Field label="Título" id="bn-t"><input id="bn-t" className="input" maxLength={60} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
                            <Field label="Subtítulo" id="bn-s"><input id="bn-s" className="input" maxLength={90} value={draft.sub} onChange={(e) => setDraft({ ...draft, sub: e.target.value })} /></Field>
                            <Field label="Texto del botón" id="bn-c"><input id="bn-c" className="input" maxLength={20} value={draft.cta} onChange={(e) => setDraft({ ...draft, cta: e.target.value })} /></Field>
                            <Field label="Ubicación" id="bn-p">
                                <select id="bn-p" className="select" value={draft.placement} onChange={(e) => setDraft({ ...draft, placement: e.target.value })}>
                                    <option>Home — superior</option><option>Cues — lateral</option><option>Sets — inferior</option><option>Modal post-sesión</option>
                                </select>
                            </Field>
                        </div>
                        <div className="row between wrap">
                            <div className="chips" role="group" aria-label="Estilo">
                                {[['cyan', 'Cian'], ['dark', 'Oscuro'], ['light', 'Claro']].map(([k, l]) => (
                                    <button key={k} type="button" className="chip" aria-pressed={draft.style === k} onClick={() => setDraft({ ...draft, style: k })}>{l}</button>
                                ))}
                            </div>
                            <Button variant="primary" icon="plus" onClick={save}>Guardar banner</Button>
                        </div>
                    </div>
                </Card>
                <Card title="Publicados" bodyClass="list">
                    {banners.map((b) => (
                        <div key={b.id} className="list-item">
                            <div className="ico-box"><Icon name="image" /></div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                                <div className="faint" style={{ fontSize: 12 }}>{b.placement} · CTR <span className="mono">{b.ctr.toFixed(1)}%</span></div>
                            </div>
                            <Toggle label={`Activar ${b.title}`} checked={b.active} onChange={(v) => setBanners(banners.map((x) => (x.id === b.id ? { ...x, active: v } : x)))} />
                        </div>
                    ))}
                </Card>
            </div>
        </>
    );
}
