import { Icon, SectionHeader, Card, Stat, Badge, Toggle, Button, Field, Chips, Bars, eur } from './ui.jsx';
import { COSTS, COST_CATEGORIES, CYCLES } from './costs-data.js';

const { useState, useMemo } = React;

const DAY_MS = 86400000;
const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};
const daysUntil = (iso) => Math.round((new Date(`${iso}T00:00:00`) - startOfToday()) / DAY_MS);
const monthly = (c) => c.amount / CYCLES[c.cycle];
const eur2 = (n) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const shortDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

const addMonths = (iso, months) => {
    const d = new Date(`${iso}T00:00:00`);
    d.setMonth(d.getMonth() + months);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function renewalState(c) {
    const d = daysUntil(c.renews);
    if (d < 0) return { tone: 'err', label: `Vencido hace ${-d} d`, alert: true, urgent: true };
    if (d <= Math.min(7, c.alertDays)) return { tone: 'err', label: d === 0 ? 'Hoy' : `En ${d} d`, alert: true, urgent: true };
    if (d <= c.alertDays) return { tone: 'on', label: `En ${d} d`, alert: true, urgent: false };
    return { tone: 'off', label: `En ${d} d`, alert: false, urgent: false };
}

const EMPTY = { name: '', provider: '', category: 'Dominios', amount: '', cycle: 'mensual', renews: '', auto: true, alertDays: 30 };

export function Costs({ toast }) {
    const [items, setItems] = useState(COSTS);
    const [cat, setCat] = useState('Todas');
    const [period, setPeriod] = useState('Mensual');
    const [q, setQ] = useState('');
    const [form, setForm] = useState(EMPTY);

    const totalMonthly = useMemo(() => items.reduce((s, c) => s + monthly(c), 0), [items]);
    const alerts = useMemo(
        () => items.map((c) => ({ ...c, st: renewalState(c), days: daysUntil(c.renews) })).filter((c) => c.st.alert).sort((a, b) => a.days - b.days),
        [items],
    );
    const due30 = useMemo(() => items.filter((c) => {
        const d = daysUntil(c.renews);
        return d >= 0 && d <= 30;
    }), [items]);
    const byCategory = useMemo(() => {
        const map = {};
        items.forEach((c) => { map[c.category] = (map[c.category] || 0) + monthly(c); });
        return Object.entries(map).map(([label, value]) => ({ label, value: period === 'Mensual' ? value : value * 12 })).sort((a, b) => b.value - a.value);
    }, [items, period]);

    const usedCats = ['Todas', ...COST_CATEGORIES.filter((c) => items.some((i) => i.category === c))];
    const list = items
        .filter((c) => cat === 'Todas' || c.category === cat)
        .filter((c) => !q || `${c.name} ${c.provider}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => daysUntil(a.renews) - daysUntil(b.renews));

    const update = (id, patch) => setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const renew = (c) => {
        update(c.id, { renews: addMonths(c.renews, CYCLES[c.cycle]) });
        toast(`${c.name} renovado hasta ${shortDate(addMonths(c.renews, CYCLES[c.cycle]))}`);
    };
    const remove = (c) => {
        setItems((prev) => prev.filter((i) => i.id !== c.id));
        toast(`${c.name} eliminado`);
    };
    const add = (e) => {
        e.preventDefault();
        const amount = Number(String(form.amount).replace(',', '.'));
        if (!form.name.trim() || !form.renews || !(amount > 0)) return;
        setItems((prev) => [...prev, { ...form, id: `c${Date.now()}`, amount, alertDays: Math.max(1, Number(form.alertDays) || 30) }]);
        setForm(EMPTY);
        toast('Coste añadido');
    };
    const exportCsv = () => {
        const rows = [['Concepto', 'Proveedor', 'Categoría', 'Ciclo', 'Importe', 'Mensual', 'Anual', 'Renovación', 'Auto']];
        items.forEach((c) => rows.push([c.name, c.provider, c.category, c.cycle, c.amount, monthly(c).toFixed(2), (monthly(c) * 12).toFixed(2), c.renews, c.auto ? 'sí' : 'no']));
        const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = 'costes-beatwave.csv';
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const mrr = 18640;
    const urgent = alerts.filter((a) => a.st.urgent).length;

    return (
        <>
            <SectionHeader eyebrow="Negocio" title="Costes" desc="Gastos fijos y variables de la plataforma, equivalentes mensuales y anuales, y avisos antes de cada renovación.">
                <Button icon="download" onClick={exportCsv}>Exportar CSV</Button>
            </SectionHeader>

            <div className="grid g-4">
                <Stat label="Coste mensual" value={eur(totalMonthly)} />
                <Stat label="Coste anual" value={eur(totalMonthly * 12)} />
                <Stat label="Renovaciones en 30 días" value={`${due30.length} · ${eur(due30.reduce((s, c) => s + c.amount, 0))}`} />
                <Stat label="Margen sobre MRR" value={`${Math.round(((mrr - totalMonthly) / mrr) * 100)} %`} />
            </div>

            <div className="grid g-main">
                <Card
                    title="Alertas de renovación"
                    action={<span className={urgent ? 'danger mono' : 'faint mono'} style={{ fontSize: 12 }}>{alerts.length} activas · {urgent} urgentes</span>}
                    bodyClass="list"
                >
                    {alerts.length === 0 && <p className="empty">No hay renovaciones dentro de su ventana de aviso.</p>}
                    {alerts.map((c) => (
                        <div key={c.id} className={`list-item cost-alert ${c.st.urgent ? 'is-urgent' : ''}`}>
                            <div className="ico-box"><Icon name={c.st.urgent ? 'alert' : 'bell'} /></div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="row between wrap">
                                    <strong style={{ fontWeight: 600 }}>{c.name}</strong>
                                    <Badge tone={c.st.tone}>{c.st.label}</Badge>
                                </div>
                                <span className="faint" style={{ fontSize: 12 }}>
                                    {c.provider} · {eur2(c.amount)} / {c.cycle} · <span className="mono">{shortDate(c.renews)}</span> · {c.auto ? 'renovación automática' : 'renovación manual'}
                                </span>
                            </div>
                            {!c.auto && <Button size="sm" onClick={() => renew(c)}>Marcar renovado</Button>}
                        </div>
                    ))}
                </Card>

                <Card title="Por categoría" action={<Chips label="Periodo" options={['Mensual', 'Anual']} value={period} onChange={setPeriod} />}>
                    <Bars items={byCategory} format={eur} />
                </Card>
            </div>

            <Card
                title="Todos los costes"
                bodyClass=""
                action={
                    <div className="cost-search">
                        <Icon name="search" size={14} />
                        <label htmlFor="cost-q" className="sr-only">Buscar coste</label>
                        <input id="cost-q" className="input" placeholder="Concepto o proveedor" value={q} onChange={(e) => setQ(e.target.value)} />
                    </div>
                }
            >
                <div className="cost-cats">
                    <Chips label="Categoría" options={usedCats} value={cat} onChange={setCat} />
                </div>
                <div className="tbl-wrap">
                    <table className="tbl">
                        <thead>
                            <tr>
                                <th>Concepto</th><th>Categoría</th><th>Ciclo</th>
                                <th className="num">Importe</th><th className="num">Mensual</th><th className="num">Anual</th>
                                <th>Renovación</th><th>Aviso</th><th>Auto</th><th><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((c) => {
                                const st = renewalState(c);
                                return (
                                    <tr key={c.id}>
                                        <td><div style={{ fontWeight: 500 }}>{c.name}</div><div className="faint" style={{ fontSize: 12 }}>{c.provider}</div></td>
                                        <td className="muted">{c.category}</td>
                                        <td className="muted">{c.cycle}</td>
                                        <td className="num">{eur2(c.amount)}</td>
                                        <td className="num">{eur2(monthly(c))}</td>
                                        <td className="num">{eur2(monthly(c) * 12)}</td>
                                        <td><div className="mono" style={{ fontSize: 12 }}>{shortDate(c.renews)}</div><Badge tone={st.tone} plain>{st.label}</Badge></td>
                                        <td>
                                            <label className="sr-only" htmlFor={`ad-${c.id}`}>Días de aviso para {c.name}</label>
                                            <select id={`ad-${c.id}`} className="select cost-days" value={c.alertDays} onChange={(e) => update(c.id, { alertDays: Number(e.target.value) })}>
                                                {[3, 5, 7, 10, 15, 30, 45, 60, 90].map((d) => <option key={d} value={d}>{d} d</option>)}
                                            </select>
                                        </td>
                                        <td><Toggle checked={c.auto} label={`Renovación automática de ${c.name}`} onChange={(v) => update(c.id, { auto: v })} /></td>
                                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            <Button size="sm" variant="ghost" icon="refresh" aria-label={`Renovar ${c.name}`} onClick={() => renew(c)} />
                                            <Button size="sm" variant="ghost" icon="trash" aria-label={`Eliminar ${c.name}`} onClick={() => remove(c)} />
                                        </td>
                                    </tr>
                                );
                            })}
                            {list.length === 0 && <tr><td colSpan={10} className="empty">Sin resultados.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card title="Añadir coste">
                <form className="cost-form" onSubmit={add}>
                    <Field label="Concepto" id="cf-n"><input id="cf-n" className="input" maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
                    <Field label="Proveedor" id="cf-p"><input id="cf-p" className="input" maxLength={60} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} /></Field>
                    <Field label="Categoría" id="cf-c">
                        <select id="cf-c" className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                            {COST_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                    </Field>
                    <Field label="Importe (€)" id="cf-a"><input id="cf-a" className="input" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></Field>
                    <Field label="Ciclo" id="cf-y">
                        <select id="cf-y" className="select" value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })}>
                            {Object.keys(CYCLES).map((c) => <option key={c}>{c}</option>)}
                        </select>
                    </Field>
                    <Field label="Próxima renovación" id="cf-r"><input id="cf-r" type="date" className="input" value={form.renews} onChange={(e) => setForm({ ...form, renews: e.target.value })} required /></Field>
                    <Field label="Avisar con (días)" id="cf-d"><input id="cf-d" type="number" min="1" max="365" className="input" value={form.alertDays} onChange={(e) => setForm({ ...form, alertDays: e.target.value })} /></Field>
                    <div className="row cost-form-actions">
                        <Toggle checked={form.auto} label="Renovación automática" onChange={(v) => setForm({ ...form, auto: v })} />
                        <span className="muted">Renovación automática</span>
                        <button type="submit" className="btn btn-primary"><Icon name="plus" /> Añadir</button>
                    </div>
                </form>
            </Card>
        </>
    );
}
