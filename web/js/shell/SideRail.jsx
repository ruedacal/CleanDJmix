import { ShellIcons } from './icons.jsx';
import { NAV_GROUPS, COPILOT_ITEM, navLabel } from './navigation.js';

const RailButton = ({ item, isActive, expanded, onSelect, t, badge }) => {
    const Icon = ShellIcons[item.icon] || ShellIcons.Grid;
    const label = navLabel(item, t);
    return (
        <button
            type="button"
            onClick={() => onSelect(item.id)}
            aria-current={isActive ? 'page' : undefined}
            title={expanded ? item.hint : `${label} — ${item.hint}`}
            className={`bw-rail-item group ${isActive ? 'is-active' : ''} ${expanded ? 'is-expanded' : ''}`}
        >
            <span className="bw-led" aria-hidden="true" />
            <Icon size={18} />
            <span className="bw-rail-label">{label}</span>
            <span className="bw-rail-caption">{label}</span>
            {badge != null && <span className="bw-rail-badge">{badge}</span>}
        </button>
    );
};

export const SideRail = ({ 
    activeTab, 
    onSelect, 
    t, 
    expanded, 
    onToggleExpanded, 
    auditInfo, 
    trackCount, 
    onOpenCopilot,
    onOpenLibrary,
    libraryCount = 0,
    isLibraryOpen = false
}) => {
    const copilotActive = activeTab === 'copilot';

    return (
        <nav
            aria-label="Módulos principales"
            className={`bw-rail hidden md:flex flex-col shrink-0 min-h-0 ${expanded ? 'w-56' : 'w-[76px]'}`}
            data-expanded={expanded ? 'true' : 'false'}
        >
            <div className="flex flex-col gap-1.5 p-2">
                <button
                    type="button"
                    onClick={onOpenCopilot}
                    aria-current={copilotActive ? 'page' : undefined}
                    title="Live Copilot — monitor táctico de cabina"
                    className={`bw-rail-live ${copilotActive ? 'is-active' : ''} ${expanded ? 'is-expanded' : ''}`}
                >
                    <span className="bw-live-dot" aria-hidden="true" />
                    <ShellIcons.Turntable size={16} className="text-cyan-400" />
                    <span className="bw-rail-label">{COPILOT_ITEM.fallback}</span>
                    <span className="bw-rail-caption">{COPILOT_ITEM.fallback}</span>
                    {expanded && <span className="bw-kbd ml-auto">LIVE</span>}
                </button>

                {/* Sección de menú Colección debajo de Copilot */}
                <button
                    type="button"
                    onClick={() => {
                        if (onSelect) onSelect('library');
                        else if (onOpenLibrary) onOpenLibrary();
                    }}
                    aria-current={activeTab === 'library' || isLibraryOpen ? 'page' : undefined}
                    title="Colección — Gestor y creador de colecciones persistentes"
                    className={`bw-rail-item group ${activeTab === 'library' || isLibraryOpen ? 'is-active' : ''} ${expanded ? 'is-expanded' : ''}`}
                >
                    <span className="bw-led" aria-hidden="true" />
                    <ShellIcons.Library size={18} className={activeTab === 'library' || isLibraryOpen ? "text-cyan-400" : "text-gray-400 group-hover:text-white"} />
                    <span className="bw-rail-label">Colección</span>
                    <span className="bw-rail-caption">Colección</span>
                    {libraryCount > 0 && <span className="bw-rail-badge">{libraryCount}</span>}
                </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto bw-scroll-thin flex flex-col gap-4 px-2 pb-3">
                {NAV_GROUPS.map((group) => (
                    <div key={group.id} className="flex flex-col gap-0.5" role="group" aria-label={group.label}>
                        <span className={`bw-eyebrow px-2 pb-1 pt-2 ${expanded ? 'block' : 'hidden'}`}>{group.label}</span>
                        <span className={`mx-auto my-1 h-px w-6 bg-white/10 ${expanded ? 'hidden' : ''}`} aria-hidden="true" />
                        {group.items.map((item) => {
                            let badge = null;
                            if (item.id === 'audit' && auditInfo && auditInfo.isAuditing) badge = `${auditInfo.progress}%`;
                            if (item.showTrackCount && trackCount > 0) badge = trackCount;
                            return (
                                <RailButton
                                    key={item.id}
                                    item={item}
                                    isActive={activeTab === item.id}
                                    expanded={expanded}
                                    onSelect={onSelect}
                                    t={t}
                                    badge={badge}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>

            <div className={`hidden md:flex p-2 border-t border-white/5 ${expanded ? 'justify-end' : 'justify-center'}`}>
                <button
                    type="button"
                    onClick={onToggleExpanded}
                    data-rail-toggle="true"
                    className="bw-icon-btn"
                    aria-label={expanded ? 'Contraer navegación' : 'Expandir navegación'}
                    aria-expanded={expanded}
                >
                    <ShellIcons.PanelLeft size={16} />
                </button>
            </div>
        </nav>
    );
};
