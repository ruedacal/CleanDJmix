import React from 'react';

/**
 * UserChip — Ficha de perfil de usuario en cabina
 * Identificador Figma: Component 1 (Node 32:45806)
 */
export const UserChip = ({
    user = 'DJ Alex',
    subtitle = 'BeatWave',
    isPro = true,
    avatarIcon = '🎧',
    onClick
}) => {
    return (
        <div 
            onClick={onClick}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-[#121218] border border-djzinc-800 hover:border-cyan-500/60 transition-all select-none cursor-pointer group shadow-sm"
            title={`${user} • Suscripción PRO`}
        >
            <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-xs text-cyan-300 group-hover:scale-105 transition-transform shrink-0">
                {avatarIcon}
            </div>
            <div className="flex flex-col min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-white truncate max-w-[110px]">
                        {user}
                    </span>
                    {isPro && (
                        <span className="px-1.5 py-0.2 rounded font-mono font-black text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/50 leading-none">
                            PRO
                        </span>
                    )}
                </div>
                {subtitle && (
                    <span className="text-[10px] text-zinc-500 truncate hidden md:inline">
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    );
};

export default UserChip;
