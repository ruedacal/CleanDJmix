import React from 'react';

/**
 * TransportButton — Botón de control de reproducción y sincronización en cabina (CUE, PLAY, SYNC)
 * Identificador Figma: Component 2 (Node 32:45819) / Component 4 (Node 32:45849)
 */
export const TransportButton = ({
    type = 'cue', // 'cue' | 'play' | 'sync'
    label,
    isPlaying = false,
    isActive = false,
    disabled = false,
    onClick,
    size = 'md' // 'sm' | 'md' | 'lg'
}) => {
    const isPlay = type === 'play';
    const isCue = type === 'cue';
    const isSync = type === 'sync';

    const displayLabel = label || (isPlay ? (isPlaying ? '❚❚' : '▶') : isCue ? 'CUE' : 'SYNC');

    let baseClasses = "font-mono font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center select-none disabled:opacity-40 disabled:cursor-not-allowed";

    if (isPlay) {
        return (
            <button
                type="button"
                disabled={disabled}
                onClick={onClick}
                className={`${baseClasses} w-11 h-11 text-base ${
                    isPlaying 
                        ? 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.7)] hover:bg-cyan-300' 
                        : 'bg-[#14141c] text-cyan-400 border border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-950/40 shadow-sm'
                }`}
                title={isPlaying ? 'Pausar' : 'Reproducir'}
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
            >
                {displayLabel}
            </button>
        );
    }

    if (isCue) {
        return (
            <button
                type="button"
                disabled={disabled}
                onClick={onClick}
                className={`${baseClasses} px-4 py-2 text-xs border ${
                    isActive
                        ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                        : 'bg-[#121218] text-amber-400 border-amber-700/60 hover:bg-amber-950/30 hover:border-amber-500'
                }`}
                title="Cue Point"
            >
                {displayLabel}
            </button>
        );
    }

    // Default SYNC
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`${baseClasses} px-4 py-2 text-xs border ${
                isActive
                    ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                    : 'bg-[#121218] text-purple-300 border-purple-800/60 hover:bg-purple-950/30 hover:border-purple-500'
            }`}
            title="Sincronizar Beat & Camelot"
        >
            {displayLabel}
        </button>
    );
};

export default TransportButton;
