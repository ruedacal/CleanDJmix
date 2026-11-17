const { useState, useEffect, useMemo } = React;
import { Icons } from '../shell/icons.jsx';

// ─── UX CABINA: Detección Automática de Sistema Operativo ──────────────────
export const detectClientOS = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'mac';
    const ua = (navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || '').toLowerCase();
    if (ua.includes('mac') || ua.includes('darwin') || ua.includes('iphone') || ua.includes('ipad')) return 'mac';
    if (ua.includes('win')) return 'windows';
    if (ua.includes('linux')) return 'linux';
    return 'mac';
};

// ─── UX CABINA: Modal de Atajos de Teclado Profesionales (DJ Cheatsheet Adaptada por SO) ─────
export const DJShortcutsModal = ({ isOpen, onClose, clubMode, onToggleClubMode }) => {
    if (!isOpen) return null;

    const detectedOS = useMemo(() => detectClientOS(), []);
    const [selectedOS, setSelectedOS] = useState(() => detectedOS);

    const isMac = selectedOS === 'mac';
    const modKey = isMac ? '⌘' : 'Ctrl';
    const altKey = isMac ? '⌥' : 'Alt';
    const shiftKey = isMac ? '⇧' : 'Shift';
    const escKey = isMac ? '⎋ ESC' : 'ESC';
    const spaceKey = isMac ? '␣ Espacio' : 'Espacio';

    const shortcutGroups = [
        {
            title: "Transporte & Mezcla",
            icon: "🎛️",
            items: [
                { key: spaceKey, desc: "Play / Pausa del tema activo o seleccionado" },
                { key: "C", desc: "CUE: Pausa y regresa al punto de inicio (00:00)" },
                { key: "1 a 8", desc: "Salto directo a Hot Cue 1-8 (Intro, Drop, Break, Outro...)" },
                { key: "← / →", desc: "Salto rápido de fraseo musical (32 compases)" },
            ]
        },
        {
            title: "Navegación & Vistas",
            icon: "📋",
            items: [
                { key: "↑ / ↓", desc: "Navegar hacia arriba o abajo en la tabla de temas" },
                { key: `${modKey} + 1..7`, desc: "Cambio directo de pantalla (Auditar, Cues, Sets, Map, Pool, Radar, Crates)" },
                { key: "M", desc: "Plegar / Desplegar panel superior de métricas" },
                { key: `${modKey} + B`, desc: "Colapsar / Desplegar barra lateral (Side Rail)" },
            ]
        },
        {
            title: "Búsqueda & Acceso Rápido",
            icon: "🔍",
            items: [
                { key: `${modKey} + F  /  ${modKey} + K`, desc: "Enfocar buscador rápido en cualquier espacio de trabajo" },
                { key: `F1  /  ${modKey} + /`, desc: "Abrir o cerrar el Manual Maestro Interactivo" },
                { key: "? / H", desc: "Abrir o cerrar esta guía de atajos de teclado" },
            ]
        },
        {
            title: "Entorno & Visibilidad",
            icon: "🕶️",
            items: [
                { key: "L", desc: "Alternar Modo Cabina Oscura (High-Contrast Club Mode)" },
                { key: escKey, desc: "Cerrar cualquier ventana modal activa" },
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn" onClick={onClose}>
            <div 
                className="w-full max-w-3xl bg-[#09090f] border border-djcyan-500/50 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-djzinc-800 bg-[#0d0d14] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Icons.Keyboard size={16} className="text-djcyan-400" />
                        <div>
                            <h3 className="text-sm font-mono font-black uppercase text-white tracking-wider flex items-center gap-2">
                                ATAJOS DE TECLADO — CABINA PROFESIONAL
                                <span className="text-[10px] bg-djcyan-950 text-djcyan-400 border border-djcyan-500/40 px-2 py-0.5 rounded-full font-bold">
                                    {isMac ? 'macOS NATIVO' : selectedOS === 'windows' ? 'WINDOWS' : 'LINUX'}
                                </span>
                            </h3>
                            <p className="text-[11px] text-gray-400 font-mono">
                                Control instantáneo sin tocar el ratón durante la sesión en vivo
                            </p>
                        </div>
                    </div>

                    {/* Selector Elegante de Sistema Operativo con Detección Automática */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-[#05060d] p-1 rounded-xl border border-djzinc-750">
                            <span className="text-[10px] font-mono text-gray-400 px-1.5 hidden sm:inline">Teclado:</span>
                            <button
                                type="button"
                                onClick={() => setSelectedOS('mac')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                    selectedOS === 'mac'
                                        ? 'bg-gradient-to-r from-djcyan-500 to-cyan-600 text-black font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                                        : 'text-gray-400 hover:text-white hover:bg-djzinc-800'
                                }`}
                                title="Atajos adaptados para Mac con tecla Command (⌘) y Option (⌥)"
                            >
                                <span></span> macOS {detectedOS === 'mac' && <span className="text-[9px] opacity-75 font-normal">(auto)</span>}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedOS('windows')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                    selectedOS === 'windows'
                                        ? 'bg-gradient-to-r from-djcyan-500 to-cyan-600 text-black font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                                        : 'text-gray-400 hover:text-white hover:bg-djzinc-800'
                                }`}
                                title="Atajos adaptados para Windows con tecla Control (Ctrl) y Alt"
                            >
                                <span>⊞</span> Windows {detectedOS === 'windows' && <span className="text-[9px] opacity-75 font-normal">(auto)</span>}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedOS('linux')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                    selectedOS === 'linux'
                                        ? 'bg-gradient-to-r from-djcyan-500 to-cyan-600 text-black font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                                        : 'text-gray-400 hover:text-white hover:bg-djzinc-800'
                                }`}
                                title="Atajos adaptados para Linux"
                            >
                                <span>🐧</span> Linux {detectedOS === 'linux' && <span className="text-[9px] opacity-75 font-normal">(auto)</span>}
                            </button>
                        </div>

                        <button 
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-djzinc-850 hover:bg-djzinc-750 text-gray-400 hover:text-white flex items-center justify-center font-mono text-sm border border-djzinc-700 transition-colors"
                        >
                            <Icons.Close size={14} />
                        </button>
                    </div>
                </div>

                {/* Body: Grupos de Atajos */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                    {shortcutGroups.map((grp, gIdx) => (
                        <div key={gIdx} className="p-4 rounded-xl border border-djzinc-800 bg-[#0c0c14] flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-xs font-mono font-bold text-djcyan-300 uppercase">
                                <span>{grp.icon}</span>
                                <span>{grp.title}</span>
                            </div>
                            <div className="space-y-2">
                                {grp.items.map((item, iIdx) => (
                                    <div key={iIdx} className="flex items-center justify-between gap-3 text-xs font-mono">
                                        <span className="text-gray-300 leading-tight">{item.desc}</span>
                                        <kbd className="px-2.5 py-1 bg-djzinc-900 border border-djzinc-700 rounded-md text-djcyan-400 font-bold text-[11px] shadow-inner shrink-0 tracking-wider">
                                            {item.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer con toggle de Modo Club */}
                <div className="px-6 py-3.5 bg-[#0b0b12] border-t border-djzinc-800 flex items-center justify-between">
                    <button
                        onClick={onToggleClubMode}
                        className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                            clubMode 
                                ? 'bg-djcyan-500 text-black border-djcyan-400 font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                                : 'bg-djzinc-900 text-gray-300 border-djzinc-750 hover:border-djcyan-500/50 hover:text-white'
                        }`}
                    >
                        <span>{clubMode ? '🕶️ Modo Cabina Oscura: ACTIVO' : '🕶️ Activar Modo Cabina Oscura'}</span>
                    </button>
                    <button 
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-lg bg-djzinc-850 hover:bg-djzinc-750 text-white font-mono text-xs font-bold transition-colors cursor-pointer"
                    >
                        Entendido ({escKey})
                    </button>
                </div>
            </div>
        </div>
    );
};

