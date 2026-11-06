import { ShellIcons } from './icons.jsx';
import { NAV_GROUPS, MOBILE_PRIMARY_TABS, findNavItem, navLabel } from './navigation.js';

const { useEffect, useRef } = React;

export const MobileTabBar = ({ activeTab, onSelect, onOpenMore, moreOpen, t }) => {
    const inMore = !MOBILE_PRIMARY_TABS.includes(activeTab);
    return (
        <nav aria-label="Navegación principal" className="bw-tabbar md:hidden flex shrink-0 items-stretch justify-around px-1 z-40">
            {MOBILE_PRIMARY_TABS.map((id) => {
                const item = findNavItem(id);
                const Icon = ShellIcons[item.icon];
                const isActive = activeTab === id;
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onSelect(id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`bw-tab ${isActive ? 'is-active' : ''}`}
                    >
                        <span className="bw-tab-led" aria-hidden="true" />
                        <Icon size={20} />
                        <span>{navLabel(item, t)}</span>
                    </button>
                );
            })}
            <button
                type="button"
                onClick={onOpenMore}
                aria-haspopup="dialog"
                aria-expanded={moreOpen}
                className={`bw-tab ${inMore ? 'is-active' : ''}`}
            >
                <span className="bw-tab-led" aria-hidden="true" />
                <ShellIcons.Grid size={20} />
                <span>{inMore ? navLabel(findNavItem(activeTab), t) : 'Más'}</span>
            </button>
        </nav>
    );
};

export const MoreSheet = ({ open, onClose, activeTab, onSelect, onOpenCopilot, helpItems, clubMode, onToggleClubMode, lang, onChangeLang, onOpenBitacora, t }) => {
    const panelRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const handleKey = (event) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        if (panelRef.current) panelRef.current.focus();
        return () => document.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    if (!open) return null;

    const choose = (id) => {
        onSelect(id);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Todos los módulos">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm bw-fade-in" onClick={onClose} />
            <div ref={panelRef} tabIndex={-1} className="bw-sheet absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col outline-none">
                <div className="flex justify-center pt-2.5 pb-1" aria-hidden="true">
                    <span className="h-1 w-10 rounded-full bg-white/20" />
                </div>
                <div className="flex items-center justify-between px-5 pb-3 pt-1">
                    <h2 className="text-base font-semibold text-white">Módulos</h2>
                    <button type="button" onClick={onClose} className="bw-icon-btn" aria-label="Cerrar">
                        <ShellIcons.Close size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-5 bw-safe-bottom">
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onOpenCopilot();
                        }}
                        className="bw-sheet-live"
                    >
                        <span className="bw-live-dot" aria-hidden="true" />
                        <span className="flex flex-col items-start">
                            <span className="text-sm font-semibold text-white">Live Copilot</span>
                            <span className="text-xs text-zinc-400">Monitor táctico de cabina en vivo</span>
                        </span>
                        <ShellIcons.ChevronRight size={16} className="ml-auto text-zinc-500" />
                    </button>

                    {NAV_GROUPS.map((group) => (
                        <section key={group.id} className="flex flex-col gap-2" aria-label={group.label}>
                            <h3 className="bw-eyebrow px-1">{group.label}</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {group.items.map((item) => {
                                    const Icon = ShellIcons[item.icon];
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => choose(item.id)}
                                            aria-current={isActive ? 'page' : undefined}
                                            className={`bw-sheet-tile ${isActive ? 'is-active' : ''}`}
                                        >
                                            <Icon size={20} />
                                            <span className="flex flex-col items-start min-w-0">
                                                <span className="text-sm font-medium text-white truncate">{navLabel(item, t)}</span>
                                                <span className="text-xs text-zinc-500 leading-snug text-left">{item.hint}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    ))}

                    <section className="flex flex-col gap-2" aria-label="Ayuda y recursos">
                        <h3 className="bw-eyebrow px-1">Ayuda y recursos</h3>
                        <div className="bw-list">
                            {helpItems.map((item) => {
                                const Icon = ShellIcons[item.icon] || ShellIcons.Help;
                                const inner = (
                                    <>
                                        <Icon size={18} className="text-zinc-400" />
                                        <span className="flex-1 text-left text-sm text-white">{item.label}</span>
                                        <ShellIcons.ChevronRight size={14} className="text-zinc-600" />
                                    </>
                                );
                                return item.href ? (
                                    <a key={item.id} href={item.href} download={item.download} className="bw-list-row">{inner}</a>
                                ) : (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className="bw-list-row"
                                        onClick={() => {
                                            onClose();
                                            item.onClick();
                                        }}
                                    >
                                        {inner}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                className="bw-list-row"
                                onClick={() => {
                                    onClose();
                                    onOpenBitacora();
                                }}
                            >
                                <ShellIcons.Notebook size={18} className="text-zinc-400" />
                                <span className="flex-1 text-left text-sm text-white">Bitácora y exportación Excel</span>
                                <ShellIcons.ChevronRight size={14} className="text-zinc-600" />
                            </button>
                        </div>
                    </section>

                    <section className="flex items-center gap-3" aria-label="Preferencias">
                        <button type="button" onClick={onToggleClubMode} aria-pressed={clubMode} className={`bw-btn flex-1 justify-center ${clubMode ? 'bw-btn-on' : 'bw-btn-ghost border border-white/10'}`}>
                            <ShellIcons.Moon size={16} />
                            <span>Modo club</span>
                        </button>
                        <div className="bw-segmented" role="radiogroup" aria-label="Idioma">
                            {['es', 'en'].map((code) => (
                                <button
                                    key={code}
                                    type="button"
                                    role="radio"
                                    aria-checked={lang === code}
                                    onClick={() => onChangeLang(code)}
                                    className={lang === code ? 'is-active' : ''}
                                >
                                    {code.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
