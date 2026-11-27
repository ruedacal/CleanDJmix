import { ShellIcons } from './icons.jsx';
import { findNavItem, navLabel } from './navigation.js';

const { useState, useEffect, useRef } = React;

const HelpMenu = ({ items }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const handlePointer = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
        };
        const handleKey = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', handlePointer);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('pointerdown', handlePointer);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    return (
        <div ref={rootRef} className="relative z-50" style={{ zIndex: 1050 }}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-haspopup="menu"
                aria-expanded={open}
                className="bw-btn bw-btn-ghost"
            >
                <ShellIcons.Help size={16} />
                <span className="hidden xl:inline">Ayuda</span>
                <ShellIcons.ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div role="menu" className="bw-popover absolute right-0 top-full mt-2 w-72 p-1.5 z-50 shadow-2xl" style={{ zIndex: 1100 }}>
                    {items.map((item) => {
                        const Icon = ShellIcons[item.icon] || ShellIcons.Help;
                        const content = (
                            <>
                                <Icon size={16} className="text-zinc-400" />
                                <span className="flex flex-col min-w-0 flex-1 text-left">
                                    <span className="text-sm text-white">{item.label}</span>
                                    {item.description && <span className="text-xs text-zinc-500 truncate">{item.description}</span>}
                                </span>
                                {item.kbd && <kbd className="bw-kbd">{item.kbd}</kbd>}
                            </>
                        );
                        if (item.href) {
                            return (
                                <a key={item.id} role="menuitem" href={item.href} download={item.download} className="bw-menu-item" onClick={() => setOpen(false)}>
                                    {content}
                                </a>
                            );
                        }
                        return (
                            <button
                                key={item.id}
                                type="button"
                                role="menuitem"
                                className="bw-menu-item"
                                onClick={() => {
                                    setOpen(false);
                                    item.onClick();
                                }}
                            >
                                {content}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const TopBar = ({
    logo,
    activeTab,
    t,
    auditInfo,
    clubMode,
    onToggleClubMode,
    onOpenCopilot,
    onOpenMenu,
    helpItems,
    onOpenBitacora,
    onOpenUser,
    userProfile,
    lang,
    onToggleLang,
}) => {
    const current = findNavItem(activeTab);
    const alias = (userProfile && userProfile.alias) || 'DJ';

    return (
        <header
            className="bw-topbar relative z-50 flex min-h-[56px] md:min-h-[64px] w-full max-w-full shrink-0 items-center justify-between gap-2 px-2.5 sm:px-4 py-2 overflow-x-clip"
            style={{ zIndex: 1000 }}
        >
            {/* Marca compacta en móvil (<768px) para eliminar recorte horizontal; identidad completa en tablet/desktop */}
            <div className="flex items-center shrink-0 min-w-0">
                <div className="hidden md:flex items-center shrink-0">{logo}</div>
                <button
                    type="button"
                    onClick={onOpenMenu}
                    className="flex md:hidden items-center gap-2 min-w-0 text-left cursor-pointer"
                    aria-label="BeatWave Menú"
                >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 border border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]">
                        <ShellIcons.Radar size={16} />
                    </span>
                    <span className="flex items-baseline gap-1.5 min-w-0">
                        <span className="font-mono text-sm font-black tracking-[0.14em] text-white">BEATWAVE</span>
                        <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold text-cyan-300 border border-cyan-400/50 bg-cyan-950/60">PRO</span>
                    </span>
                </button>
            </div>

            <div className="hidden md:flex items-center gap-2 min-w-0 pl-3 ml-1 border-l border-white/10">
                <span className="text-xs text-zinc-500">{current.group}</span>
                <ShellIcons.ChevronRight size={12} className="text-zinc-600" />
                <h1 className="text-sm font-semibold text-white truncate">{navLabel(current, t)}</h1>
            </div>

            <div className="ml-auto flex items-center gap-1.5 shrink-0">
                {/* Botón explícito Menú (Móvil y Tablet <1024px) */}
                {onOpenMenu && (
                    <button
                        type="button"
                        onClick={onOpenMenu}
                        className="bw-btn bw-btn-ghost lg:hidden border border-white/15 px-2.5 h-8 text-xs font-mono font-semibold text-white"
                        aria-label="Abrir menú de secciones"
                    >
                        <ShellIcons.Grid size={14} className="text-cyan-400" />
                        <span>Menú</span>
                    </button>
                )}

                <button type="button" onClick={onOpenCopilot} className="bw-btn bw-btn-live md:hidden h-8 px-2 text-xs" aria-label="Abrir Live Copilot">
                    <span className="bw-live-dot" aria-hidden="true" />
                    <span>LIVE</span>
                </button>

                <button
                    type="button"
                    onClick={onToggleClubMode}
                    aria-pressed={clubMode}
                    className={`bw-btn hidden sm:inline-flex ${clubMode ? 'bw-btn-on' : 'bw-btn-ghost'}`}
                    title="Modo cabina oscura (L)"
                >
                    <ShellIcons.Moon size={16} />
                    <span className="hidden xl:inline">{clubMode ? 'Club' : 'Normal'}</span>
                    <kbd className="bw-kbd hidden xl:inline-flex">L</kbd>
                </button>

                <div className="hidden md:block">
                    <HelpMenu items={helpItems} />
                </div>

                <button type="button" onClick={onOpenBitacora} className="bw-btn bw-btn-ghost hidden md:inline-flex shrink-0 whitespace-nowrap" title="Bitácora de procesos y exportación Excel">
                    <ShellIcons.Notebook size={16} className="shrink-0" />
                    <span className="hidden xl:inline whitespace-nowrap">Bitácora</span>
                </button>

                <button
                    type="button"
                    onClick={onToggleLang}
                    className="bw-btn bw-btn-ghost hidden md:inline-flex font-mono"
                    aria-label={lang === 'es' ? 'Cambiar idioma a inglés' : 'Switch to Spanish'}
                >
                    <ShellIcons.Globe size={16} />
                    <span className="uppercase">{lang}</span>
                </button>

                <button type="button" onClick={onOpenUser} className="bw-user-chip shrink-0" title="Centro de control DJ: perfil, sesiones y preferencias">
                    <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-zinc-800 ring-1 ring-white/15">
                        {userProfile && userProfile.avatarUrl ? (
                            <img loading="lazy" decoding="async" src={userProfile.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <ShellIcons.User size={14} className="text-zinc-300" />
                        )}
                    </span>
                    <span className="hidden xl:inline max-w-[110px] truncate text-sm text-white">{alias}</span>
                    <span className="hidden xl:inline bw-pro-tag">PRO</span>
                </button>
            </div>
        </header>
    );
};