/**
 * BeatWave PRO — BoothPlatformSelector Component
 * Domain: Copilot / Live Booth
 * 
 * Hardware-style selector for live DJ software suites (Rekordbox, VirtualDJ, Serato, Traktor).
 * Displays official vector logos, clean single-word labels, and circular status LEDs
 * without verbose text labels.
 */
import React from 'react';

export const BOOTH_PLATFORMS = [
    { id: 'rekordbox', label: 'Rekordbox', color: '#38bdf8' },
    { id: 'virtualdj', label: 'VirtualDJ', color: '#f97316' },
    { id: 'serato', label: 'Serato', color: '#00d1e8' },
    { id: 'traktor', label: 'Traktor', color: '#facc15' }
];

export const BoothPlatformSelector = ({
    activePlatform = 'auto',
    detectedPlatforms = {},
    onSelectPlatform,
    className = ''
}) => {
    return (
        <div className={`flex flex-col gap-2.5 ${className}`}>
            <div className="flex items-center justify-between">
                <span className="ws-glass-kicker text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Software de cabina
                </span>
                <button
                    type="button"
                    onClick={() => onSelectPlatform && onSelectPlatform('auto')}
                    className={`text-[11px] font-mono transition-colors cursor-pointer ${
                        activePlatform === 'auto' || !activePlatform 
                        ? 'text-cyan-400 font-semibold' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title="Alternar modo detección automática en cabina"
                >
                    {activePlatform === 'auto' || !activePlatform ? '● Auto-detectar activo' : 'Modo Auto'}
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {BOOTH_PLATFORMS.map(p => {
                    const isSelected = activePlatform === p.id;
                    const isDetected = Boolean(detectedPlatforms[p.id]);

                    return (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => onSelectPlatform && onSelectPlatform(isSelected ? 'auto' : p.id)}
                            className={`flex items-center justify-between h-10 px-3 rounded-xl border transition-all cursor-pointer select-none ${
                                isSelected 
                                ? 'bg-zinc-800/90 text-white shadow-md' 
                                : 'bg-zinc-950/70 hover:bg-zinc-900 text-zinc-300 hover:text-white border-zinc-800/90'
                            }`}
                            aria-pressed={isSelected}
                            style={isSelected ? { borderColor: p.color, boxShadow: `0 0 12px ${p.color}33` } : {}}
                            title={isDetected ? `${p.label} (Detectado en cabina)` : `${p.label} (Standby)`}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-mono font-semibold truncate tracking-tight text-white">
                                    {p.label}
                                </span>
                            </div>
                            <span 
                                className={`w-2 h-2 rounded-full shrink-0 ml-1.5 transition-all ${
                                    isDetected 
                                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] ring-1 ring-emerald-300' 
                                    : 'bg-zinc-600'
                                }`} 
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BoothPlatformSelector;
