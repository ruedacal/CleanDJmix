import { Icon, useToast } from './admin/ui.jsx';
import { Overview, Database, Logs } from './admin/sections-core.jsx';
import { Promotions, Codes, Skills, Banners } from './admin/sections-growth.jsx';
import { Analytics, Seo, Billing, Notices, Settings } from './admin/sections-insights.jsx';
import { QueryConsole, Behavior } from './admin/sections-data.jsx';
import { Social, ContentStudio } from './admin/sections-content.jsx';

const { useState, useEffect } = React;

const NAV = [
    { group: 'Operación', items: [
        { id: 'overview', label: 'Resumen', icon: 'home', C: Overview },
        { id: 'database', label: 'Base de datos', icon: 'db', C: Database },
        { id: 'query', label: 'Consultas SQL', icon: 'code', C: QueryConsole },
    ] },
    { group: 'Crecimiento', items: [
        { id: 'promos', label: 'Promociones', icon: 'megaphone', C: Promotions, count: 2 },
        { id: 'codes', label: 'Códigos descuento', icon: 'ticket', C: Codes, count: 3 },
        { id: 'skills', label: 'Skills en campañas', icon: 'spark', C: Skills },
        { id: 'banners', label: 'Banners', icon: 'image', C: Banners },
    ] },
    { group: 'Insights', items: [
        { id: 'analytics', label: 'Analítica', icon: 'chart', C: Analytics },
        { id: 'behavior', label: 'Comportamiento', icon: 'flow', C: Behavior },
        { id: 'seo', label: 'SEO', icon: 'search', C: Seo },
    ] },
    { group: 'Contenido', items: [
        { id: 'social', label: 'Redes sociales', icon: 'share', C: Social },
        { id: 'content', label: 'Estudio de contenido', icon: 'pen', C: ContentStudio },
    ] },
    { group: 'Negocio', items: [
        { id: 'billing', label: 'Facturación', icon: 'card', C: Billing },
    ] },
    { group: 'Sistema', items: [
        { id: 'notices', label: 'Avisos', icon: 'bell', C: Notices, count: 1 },
        { id: 'logs', label: 'Logs', icon: 'terminal', C: Logs },
        { id: 'settings', label: 'Ajustes', icon: 'gear', C: Settings },
    ] },
];
const ALL = NAV.flatMap((g) => g.items);
const fromHash = () => (ALL.some((i) => i.id === location.hash.slice(1)) ? location.hash.slice(1) : 'overview');

function AdminApp() {
    const [active, setActive] = useState(fromHash);
    const [menuOpen, setMenuOpen] = useState(false);
    const [toastNode, toast] = useToast();

    useEffect(() => {
        const onHash = () => setActive(fromHash());
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);

    const go = (id) => {
        location.hash = id;
        setActive(id);
        setMenuOpen(false);
        window.scrollTo(0, 0);
    };
    const current = ALL.find((i) => i.id === active);
    const Section = current.C;

    return (
        <div className="adm">
            <aside className={`adm-side ${menuOpen ? 'open' : ''}`} aria-label="Navegación del panel">
                <div className="adm-brand">
                    <div className="adm-brand-mark">BW</div>
                    <div>
                        <div className="adm-brand-name">BEATWAVE</div>
                        <div className="adm-brand-sub">Admin Console</div>
                    </div>
                </div>
                <nav className="adm-nav">
                    {NAV.map((g) => (
                        <div key={g.group} className="adm-nav-group">
                            <div className="adm-nav-label">{g.group}</div>
                            {g.items.map((it) => (
                                <button key={it.id} type="button" className="adm-nav-item" aria-current={active === it.id ? 'page' : undefined} onClick={() => go(it.id)}>
                                    <Icon name={it.icon} />
                                    {it.label}
                                    {it.count ? <span className="adm-nav-count">{it.count}</span> : null}
                                </button>
                            ))}
                        </div>
                    ))}
                </nav>
                <div className="adm-side-foot">
                    <div className="adm-avatar">CR</div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500 }}>Carlos Rueda</div>
                        <div className="faint" style={{ fontSize: 11 }}>Propietario</div>
                    </div>
                </div>
            </aside>

            <div className="adm-main">
                <header className="adm-top">
                    <button type="button" className="btn btn-ghost adm-menu-btn" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
                        <Icon name={menuOpen ? 'x' : 'menu'} />
                    </button>
                    <div className="adm-search">
                        <Icon name="search" size={14} />
                        <label htmlFor="global-q" className="sr-only">Buscar en el panel</label>
                        <input id="global-q" placeholder="Buscar usuarios, códigos, facturas…" />
                        <span className="adm-kbd">⌘K</span>
                    </div>
                    <div className="adm-env">
                        <span className="adm-dot" aria-hidden="true" />
                        <span className="label">Producción · datos de ejemplo</span>
                    </div>
                </header>
                <main className="adm-content">
                    <Section go={go} toast={toast} />
                </main>
            </div>
            {toastNode}
        </div>
    );
}

ReactDOM.render(<AdminApp />, document.getElementById('admin-root'));
