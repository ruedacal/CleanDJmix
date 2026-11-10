/**
 * BeatWave PRO — Official Brand Logo Component
 * Domain: Brand Identity / Foundations
 * 
 * Implements the 5-bar animated/static equalizer corporate badge,
 * linear cyan gradient, and typography lockup.
 */
import React from 'react';

export const BeatWaveLogoBadge = ({ size = 'sm', isAnimated = true, isTechnoActive = false, className = '' }) => {
    // Size presets: 'xs' (24px), 'sm' (36px), 'md' (44px), 'lg' (96px/112px), 'xl' (128px)
    const sizeConfig = {
        xs: { dims: 'w-6 h-6', border: 'border-[1.5px]' },
        sm: { dims: 'w-9 h-9', border: 'border-2' },
        md: { dims: 'w-11 h-11', border: 'border-[3px]' },
        lg: { dims: 'w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32', border: 'border-[5px] sm:border-[6px]' },
        xl: { dims: 'w-32 h-32', border: 'border-[8px]' }
    }[size] || { dims: size, border: 'border-2' };

    const animBarClasses = isAnimated ? [
        'bw-equalizer-bar-1',
        'bw-equalizer-bar-2',
        'bw-equalizer-bar-3',
        'bw-equalizer-bar-4',
        'bw-equalizer-bar-5'
    ] : ['', '', '', '', ''];

    return (
        <div 
            className={`relative rounded-full flex items-center justify-center shrink-0 ${sizeConfig.border} border-white bg-[#030712]/95 shadow-[0_0_24px_rgba(6,182,212,0.9),inset_0_0_12px_rgba(6,182,212,0.4)] backdrop-blur-md select-none group-hover:shadow-[0_0_32px_rgba(6,182,212,1),inset_0_0_16px_rgba(6,182,212,0.55)] transition-all duration-300 ${isTechnoActive ? 'anim-soundwave drop-shadow-[0_0_24px_rgba(6,182,212,1)] scale-105' : ''} ${sizeConfig.dims} ${className}`}
        >
            <svg 
                viewBox="0 0 100 100" 
                className="w-[74%] h-[74%] overflow-visible" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="bw-bar-cyan-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a5f3fc" />
                        <stop offset="25%" stopColor="#67e8f9" />
                        <stop offset="55%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#0891b2" />
                    </linearGradient>
                    <filter id="bw-bar-glow-fx" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#06b6d4" floodOpacity="0.95" />
                    </filter>
                </defs>

                <g filter="url(#bw-bar-glow-fx)">
                    {/* Bar 1 (Left exterior) */}
                    <rect 
                        x="13.3" y="40.3" width="11.8" height="35.9" rx="5.9" ry="5.9" 
                        fill="url(#bw-bar-cyan-grad)" 
                        className={animBarClasses[0]} 
                    />
                    {/* Bar 2 (Left interior) */}
                    <rect 
                        x="28.7" y="27.1" width="11.8" height="53.8" rx="5.9" ry="5.9" 
                        fill="url(#bw-bar-cyan-grad)" 
                        className={animBarClasses[1]} 
                    />
                    {/* Bar 3 (Center Peak) */}
                    <rect 
                        x="44.1" y="17.0" width="11.8" height="66.0" rx="5.9" ry="5.9" 
                        fill="url(#bw-bar-cyan-grad)" 
                        className={animBarClasses[2]} 
                    />
                    {/* Bar 4 (Right interior) */}
                    <rect 
                        x="59.5" y="30.0" width="11.8" height="50.1" rx="5.9" ry="5.9" 
                        fill="url(#bw-bar-cyan-grad)" 
                        className={animBarClasses[3]} 
                    />
                    {/* Bar 5 (Right exterior) */}
                    <rect 
                        x="74.9" y="44.2" width="11.8" height="32.0" rx="5.9" ry="5.9" 
                        fill="url(#bw-bar-cyan-grad)" 
                        className={animBarClasses[4]} 
                    />
                </g>
            </svg>
        </div>
    );
};

export const BeatWaveLogoLockup = ({ size = 'sm', isAnimated = true, showSubtitle = true, orientation = 'horizontal', className = '' }) => {
    const isVertical = orientation === 'vertical';

    return (
        <div className={`flex items-center gap-3 ${isVertical ? 'flex-col text-center' : 'flex-row'} ${className}`}>
            <BeatWaveLogoBadge size={size} isAnimated={isAnimated} />
            <div className={`flex flex-col ${isVertical ? 'items-center' : 'items-start'}`}>
                <span className="font-['Syne'] font-extrabold text-white tracking-[0.06em] leading-none text-base sm:text-lg select-none">
                    BEATWAVE <span className="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]">PRO</span>
                </span>
                {showSubtitle && (
                    <span className="font-['Nimbus_Mono_PS',monospace] text-[9px] text-zinc-400 tracking-[0.22em] uppercase mt-1 select-none">
                        AUDIO INTELLIGENCE SUITE
                    </span>
                )}
            </div>
        </div>
    );
};

export default BeatWaveLogoBadge;
