import { SectionHeader, Card, Stat, Badge, Button, Icon, LineChart, Field, Chips, Toggle, num } from './ui.jsx';
import { DAYS } from './data.js';
import { SOCIAL_ACCOUNTS, SCHEDULED_POSTS, CONTENT_LIBRARY, ACADEMY_MODULES } from './data-deep.js';

const { useState } = React;

const statusTone = { publicado: 'on', programado: 'on', borrador: 'off', revisión: 'off', error: 'err' };
const netName = (id) => SOCIAL_ACCOUNTS.find((a) => a.id === id)?.name || id;
const initials = (name) => name.slice(0, 2).toUpperCase();

/* ── Redes sociales ────────────────────────────────────────────── */
export function Social({ go, toast }) {
    const [accounts, setAccounts] = useState(SOCIAL_ACCOUNTS);
    const [selected, setSelected] = useState('tt');
    const [posts, setPosts] = useState(SCHEDULED_POSTS);
    const current = accounts.find((a) => a.id === selected);
    const connected = accounts.filter((a) => a.connected);
    const totalFollowers = connected.reduce((s, a) => s + a.followers, 0);
    const avgEng = connected.reduce((s, a) => s + a.engagement, 0) / (connected.length || 1);

    const toggleConn = (id) => {
        setAccounts((list) => list.map((a) => (a.id === id ? { ...a, connected: !a.connected } : a)));
        const acc = accounts.find((a) => a.id === id);
        toast(acc.connected ? `${acc.name} desconectada` : `${acc.name} conectada`);
    };

    return (
        <>
            <SectionHeader eyebrow="Contenido" title="Redes sociales" desc="Cuentas conectadas, crecimiento de audiencia y publicaciones programadas.">
                <Button variant="primary" icon="pen" onClick={() => go('content')}>Crear publicación</Button>
            </SectionHeader>

            <div className="grid g-4">
                <Stat label="Seguidores totales" value={num(totalFollowers)} delta="5,9%" />
                <Stat label="Engagement medio" value={`${avgEng.toFixed(1)}%`} delta="0,8%" />
                <Stat label="Cuentas conectadas" value={`${connected.length}/${accounts.length}`} />
                <Stat label="Publicaciones programadas" value={posts.filter((p) => p.status === 'programado').length} />
            </div>

            <div className="grid g-3">
                {accounts.map((a) => (
                    <section key={a.id} className={`card social-card ${selected === a.id ? 'is-selected' : ''}`}>
                        <button type="button" className="social-main" onClick={() => setSelected(a.id)} aria-pressed={selected === a.id}>
                            <div className="ico-box mono">{initials(a.name)}</div>
                            <div className="social-id">
                                <span className="social-name">{a.name}</span>
                                <span className="faint mono">{a.handle}</span>
                            </div>
                            <Badge tone={a.connected ? 'on' : 'off'}>{a.connected ? 'Conectada' : 'Sin conectar'}</Badge>
                        </button>
                        <div className="social-metrics">
                            <div><span className="faint">Seguidores</span><span className="mono">{num(a.followers)}</span></div>
                            <div><span className="faint">30 días</span><span className={`mono ${a.growth >= 0 ? 'up' : 'down'}`}>{a.growth >= 0 ? '+' : ''}{a.growth}%</span></div>
                            <div><span className="faint">Engagement</span><span className="mono">{a.engagement}%</span></div>
                        </div>
                        <div className="social-foot">
                            <Button size="sm" variant={a.connected ? 'ghost' : ''} onClick={() => toggleConn(a.id)}>{a.connected ? 'Desconectar' : 'Conectar cuenta'}</Button>
                        </div>
                    </section>
                ))}
            </div>

            <div className="grid g-main">
                <Card title={`Crecimiento de seguidores · ${current.name}`} action={<span className="faint mono">30 días</span>}>
                    <LineChart data={current.series} labels={DAYS} />
                </Card>
                <Card title="Cola de publicación" bodyClass="list">
                    {posts.map((p) => (
                        <div key={p.id} className="list-item post-row">
                            <div className="stack-tight">
                                <span>{p.text}</span>
                                <span className="faint mono">{p.when} · {p.networks.map(netName).join(', ')}</span>
                            </div>
                            <div className="row">
                                <Badge tone={statusTone[p.status]}>{p.status}</Badge>
                                <Button size="sm" variant="ghost" icon="trash" aria-label={`Eliminar publicación: ${p.text}`} onClick={() => { setPosts((l) => l.filter((x) => x.id !== p.id)); toast('Publicación eliminada'); }} />
                            </div>
                        </div>
                    ))}
                    {!posts.length && <p className="empty">No hay publicaciones en cola.</p>}
                </Card>
            </div>
        </>
    );
}

/* ── Estudio de contenido ──────────────────────────────────────── */
const HASHTAGS = ['#DJ', '#DJLife', '#Techno', '#HouseMusic', '#Camelot', '#BEATWAVE', '#MixingTips'];

function SocialComposer({ onCreate }) {
    const connected = SOCIAL_ACCOUNTS.filter((a) => a.connected);
    const [nets, setNets] = useState(['ig', 'tt']);
    const [text, setText] = useState('');
    const [when, setWhen] = useState('2026-11-14T18:00');
    const limit = Math.min(...nets.map((n) => SOCIAL_ACCOUNTS.find((a) => a.id === n).limit), 5000);
    const over = text.length > limit;
    const toggleNet = (id) => setNets((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

    const submit = (status) => {
        if (!text.trim() || !nets.length || over) return;
        onCreate({ type: 'Redes', title: text.slice(0, 70), status, date: when.slice(0, 10) }, status === 'programado' ? `Programado en ${nets.map(netName).join(', ')}` : 'Borrador guardado');
        setText('');
    };

    return (
        <div className="grid g-main">
            <Card title="Nueva publicación">
                <div className="stack">
                    <div className="field">
                        <span className="field-label" id="nets-label">Redes</span>
                        <div className="chips" role="group" aria-labelledby="nets-label">
                            {connected.map((a) => (
                                <button key={a.id} type="button" className="chip" aria-pressed={nets.includes(a.id)} onClick={() => toggleNet(a.id)}>{a.name}</button>
                            ))}
                        </div>
                    </div>
                    <Field label="Texto" id="sc-text">
                        <textarea id="sc-text" className="textarea" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe el copy de la publicación…" />
                    </Field>
                    <div className="row between wrap">
                        <div className="chips" role="group" aria-label="Añadir hashtag">
                            {HASHTAGS.map((h) => <button key={h} type="button" className="chip" onClick={() => setText((t) => `${t}${t && !/\s$/.test(t) ? ' ' : ''}${h}`)}>{h}</button>)}
                        </div>
                        <span className={`mono ${over ? 'danger' : 'faint'}`}>{text.length}/{limit}</span>
                    </div>
                    <Field label="Programar para" id="sc-when">
                        <input id="sc-when" type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} />
                    </Field>
                    <div className="row">
                        <Button variant="primary" icon="send" onClick={() => submit('programado')} disabled={!text.trim() || !nets.length || over}>Programar</Button>
                        <Button onClick={() => submit('borrador')} disabled={!text.trim()}>Guardar borrador</Button>
                    </div>
                </div>
            </Card>
            <Card title="Vista previa">
                <div className="post-preview">
                    <div className="row">
                        <div className="adm-brand-mark">BW</div>
                        <div className="stack-tight">
                            <span className="social-name">beatwave.app</span>
                            <span className="faint">{nets.map(netName).join(' · ') || 'Selecciona una red'}</span>
                        </div>
                    </div>
                    <p className="post-text">{text || <span className="faint">El texto aparecerá aquí.</span>}</p>
                    <span className="faint mono">{when.replace('T', ' ')}</span>
                </div>
            </Card>
        </div>
    );
}

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function BlogEditor({ onCreate }) {
    const [f, setF] = useState({ title: '', excerpt: '', body: '', category: 'Técnica', tags: '' });
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
    const words = f.body.trim() ? f.body.trim().split(/\s+/).length : 0;
    const slug = slugify(f.title) || 'nuevo-articulo';

    const submit = (status) => {
        if (!f.title.trim()) return;
        onCreate({ type: 'Blog', title: f.title, status, date: '2026-11-12' }, status === 'publicado' ? 'Artículo publicado en el blog' : 'Borrador guardado');
        setF({ title: '', excerpt: '', body: '', category: 'Técnica', tags: '' });
    };

    return (
        <div className="grid g-main">
            <Card title="Nuevo artículo">
                <div className="stack">
                    <Field label="Título" id="bl-title"><input id="bl-title" className="input" value={f.title} onChange={set('title')} placeholder="Ej. Cómo preparar un set de 2 horas" /></Field>
                    <div className="grid g-2">
                        <Field label="Categoría" id="bl-cat">
                            <select id="bl-cat" className="select" value={f.category} onChange={set('category')}>
                                {['Técnica', 'Armonía', 'Producto', 'Entrevistas', 'Novedades'].map((c) => <option key={c}>{c}</option>)}
                            </select>
                        </Field>
                        <Field label="Etiquetas" id="bl-tags"><input id="bl-tags" className="input" value={f.tags} onChange={set('tags')} placeholder="techno, bpm, mezcla" /></Field>
                    </div>
                    <Field label="Extracto / meta descripción" id="bl-ex">
                        <textarea id="bl-ex" className="textarea" rows={2} value={f.excerpt} onChange={set('excerpt')} />
                    </Field>
                    <span className={`mono ${f.excerpt.length > 160 ? 'danger' : 'faint'}`}>{f.excerpt.length}/160 caracteres</span>
                    <Field label="Contenido (Markdown)" id="bl-body">
                        <textarea id="bl-body" className="textarea mono" rows={10} value={f.body} onChange={set('body')} placeholder={'## Introducción\n\nEscribe aquí…'} />
                    </Field>
                    <div className="row between wrap">
                        <span className="faint mono">{words} palabras · {Math.max(1, Math.round(words / 220))} min de lectura</span>
                        <div className="row">
                            <Button onClick={() => submit('borrador')} disabled={!f.title.trim()}>Guardar borrador</Button>
                            <Button variant="primary" icon="send" onClick={() => submit('publicado')} disabled={!f.title.trim()}>Publicar</Button>
                        </div>
                    </div>
                </div>
            </Card>
            <div className="stack">
                <Card title="Vista previa en Google">
                    <div className="serp" aria-label="Vista previa en Google">
                        <div className="serp-url">beatwave.pro › blog › {slug}</div>
                        <div className="serp-title">{f.title || 'Título del artículo'} — BEATWAVE</div>
                        <p className="serp-desc">{f.excerpt || 'Añade un extracto para controlar cómo aparece el artículo en buscadores.'}</p>
                    </div>
                </Card>
                <Card title="Checklist SEO" bodyClass="list">
                    {[
                        ['Título entre 30 y 60 caracteres', f.title.length >= 30 && f.title.length <= 60],
                        ['Meta descripción de 70–160', f.excerpt.length >= 70 && f.excerpt.length <= 160],
                        ['Más de 600 palabras', words > 600],
                        ['Incluye subtítulos (##)', /^##\s/m.test(f.body)],
                        ['Al menos una etiqueta', f.tags.trim().length > 0],
                    ].map(([label, ok]) => (
                        <div key={label} className="list-item">
                            <Badge tone={ok ? 'on' : 'off'}>{ok ? 'OK' : 'Pendiente'}</Badge>
                            <span className={ok ? '' : 'muted'}>{label}</span>
                        </div>
                    ))}
                </Card>
            </div>
        </div>
    );
}

const BLOCK_TYPES = ['Texto', 'Vídeo', 'Ejercicio', 'Quiz'];

function LessonBuilder({ onCreate }) {
    const [f, setF] = useState({ module: ACADEMY_MODULES[0], title: '', level: 'Inicial', minutes: 12, audience: 'Todos' });
    const [blocks, setBlocks] = useState([{ id: 1, type: 'Texto', content: '' }, { id: 2, type: 'Vídeo', content: '' }]);
    const [featured, setFeatured] = useState(false);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

    const addBlock = (type) => setBlocks((b) => [...b, { id: Date.now(), type, content: '' }]);
    const updateBlock = (id, content) => setBlocks((b) => b.map((x) => (x.id === id ? { ...x, content } : x)));
    const removeBlock = (id) => setBlocks((b) => b.filter((x) => x.id !== id));
    const move = (i, d) => setBlocks((b) => {
        const n = [...b];
        const j = i + d;
        if (j < 0 || j >= n.length) return b;
        [n[i], n[j]] = [n[j], n[i]];
        return n;
    });

    const submit = (status) => {
        if (!f.title.trim()) return;
        onCreate({ type: 'Academia', title: `${f.module} · ${f.title}`, status, date: '2026-11-12' }, status === 'publicado' ? 'Lección publicada en Academia' : 'Lección enviada a revisión');
        setF({ ...f, title: '' });
    };

    const placeholder = { Texto: 'Explicación de la lección…', Vídeo: 'URL del vídeo (YouTube, Vimeo o CDN)', Ejercicio: 'Instrucciones del ejercicio práctico en la app…', Quiz: 'Pregunta | respuesta correcta | opción 2 | opción 3' };

    return (
        <div className="grid g-main">
            <Card title="Nueva lección de Academia">
                <div className="stack">
                    <div className="grid g-2">
                        <Field label="Módulo" id="ac-mod">
                            <select id="ac-mod" className="select" value={f.module} onChange={set('module')}>{ACADEMY_MODULES.map((m) => <option key={m}>{m}</option>)}</select>
                        </Field>
                        <Field label="Título de la lección" id="ac-title"><input id="ac-title" className="input" value={f.title} onChange={set('title')} placeholder="Ej. Mezclar en claves adyacentes" /></Field>
                    </div>
                    <div className="grid g-3">
                        <div className="field">
                            <span className="field-label">Nivel</span>
                            <Chips label="Nivel" options={['Inicial', 'Medio', 'Avanzado']} value={f.level} onChange={(level) => setF({ ...f, level })} />
                        </div>
                        <Field label="Duración (min)" id="ac-min"><input id="ac-min" type="number" min="1" className="input" value={f.minutes} onChange={set('minutes')} /></Field>
                        <Field label="Visible para" id="ac-aud">
                            <select id="ac-aud" className="select" value={f.audience} onChange={set('audience')}>{['Todos', 'PRO y STUDIO', 'Solo STUDIO'].map((a) => <option key={a}>{a}</option>)}</select>
                        </Field>
                    </div>

                    <div className="field">
                        <span className="field-label">Bloques de contenido</span>
                        <ol className="blocks">
                            {blocks.map((b, i) => (
                                <li key={b.id} className="block">
                                    <div className="row between">
                                        <span className="code-tag">{i + 1} · {b.type}</span>
                                        <div className="row">
                                            <Button size="sm" variant="ghost" icon="up" aria-label="Subir bloque" onClick={() => move(i, -1)} disabled={i === 0} />
                                            <Button size="sm" variant="ghost" icon="down" aria-label="Bajar bloque" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} />
                                            <Button size="sm" variant="ghost" icon="trash" aria-label="Eliminar bloque" onClick={() => removeBlock(b.id)} />
                                        </div>
                                    </div>
                                    <label htmlFor={`blk-${b.id}`} className="sr-only">Contenido del bloque {b.type}</label>
                                    <textarea id={`blk-${b.id}`} className="textarea" rows={b.type === 'Texto' ? 4 : 2} value={b.content} onChange={(e) => updateBlock(b.id, e.target.value)} placeholder={placeholder[b.type]} />
                                </li>
                            ))}
                        </ol>
                        <div className="row wrap">
                            {BLOCK_TYPES.map((t) => <Button key={t} size="sm" icon="plus" onClick={() => addBlock(t)}>{t}</Button>)}
                        </div>
                    </div>

                    <div className="row between wrap">
                        <div className="row">
                            <Toggle checked={featured} onChange={setFeatured} label="Destacar en la portada de Academia" />
                            <span className="muted">Destacar en la portada de Academia</span>
                        </div>
                        <div className="row">
                            <Button onClick={() => submit('revisión')} disabled={!f.title.trim()}>Enviar a revisión</Button>
                            <Button variant="primary" icon="send" onClick={() => submit('publicado')} disabled={!f.title.trim()}>Publicar</Button>
                        </div>
                    </div>
                </div>
            </Card>
            <Card title="Esquema de la lección">
                <div className="stack">
                    <div className="stack-tight">
                        <span className="faint mono">{f.module}</span>
                        <span className="lesson-title">{f.title || 'Título de la lección'}</span>
                        <span className="muted">{f.level} · {f.minutes} min · {f.audience}{featured ? ' · Destacada' : ''}</span>
                    </div>
                    <ol className="outline">
                        {blocks.map((b) => (
                            <li key={b.id}>
                                <span className="code-tag">{b.type}</span>
                                <span className={b.content ? '' : 'faint'}>{b.content ? b.content.slice(0, 60) : 'Sin contenido'}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            </Card>
        </div>
    );
}

export function ContentStudio({ toast }) {
    const [tab, setTab] = useState('Redes');
    const [library, setLibrary] = useState(CONTENT_LIBRARY);
    const [filter, setFilter] = useState('Todo');

    const onCreate = (item, msg) => {
        setLibrary((l) => [{ id: `c${Date.now()}`, author: 'Carlos R.', views: 0, ...item }, ...l]);
        toast(msg);
    };
    const rows = filter === 'Todo' ? library : library.filter((c) => c.type === filter);

    return (
        <>
            <SectionHeader eyebrow="Contenido" title="Estudio de contenido" desc="Crea publicaciones para redes, artículos para el blog y lecciones internas para las secciones de aprendizaje.">
                <Chips label="Tipo de contenido" options={['Redes', 'Blog', 'Academia']} value={tab} onChange={setTab} />
            </SectionHeader>

            {tab === 'Redes' && <SocialComposer onCreate={onCreate} />}
            {tab === 'Blog' && <BlogEditor onCreate={onCreate} />}
            {tab === 'Academia' && <LessonBuilder onCreate={onCreate} />}

            <Card title="Biblioteca de contenido" action={<Chips label="Filtrar biblioteca" options={['Todo', 'Redes', 'Blog', 'Academia']} value={filter} onChange={setFilter} />} bodyClass="tbl-wrap">
                <table className="tbl">
                    <thead><tr><th scope="col">Título</th><th scope="col">Tipo</th><th scope="col">Estado</th><th scope="col">Autor</th><th scope="col">Fecha</th><th scope="col" className="num">Vistas</th></tr></thead>
                    <tbody>
                        {rows.map((c) => (
                            <tr key={c.id}>
                                <td>{c.title}</td>
                                <td><span className="code-tag">{c.type}</span></td>
                                <td><Badge tone={statusTone[c.status]}>{c.status}</Badge></td>
                                <td className="muted">{c.author}</td>
                                <td className="mono muted">{c.date}</td>
                                <td className="num mono">{c.views ? num(c.views) : '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </>
    );
}
