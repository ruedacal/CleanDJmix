/**
 * BeatWave PRO — Official Brand Logo Component
 * Domain: Brand Identity / Foundations
 * 
 * Implements the 5-bar animated/static equalizer corporate badge,
 * linear cyan gradient, and typography lockup.
 */
import React from 'react';

export const BeatWaveLogoBadge = ({ size = 'sm', isAnimated = true, isTechnoActive = false, className = '' }) => {
    const animBarClasses = isAnimated ? [
        'bw-equalizer-bar-1',
        'bw-equalizer-bar-2',
        'bw-equalizer-bar-3',
        'bw-equalizer-bar-4',
        'bw-equalizer-bar-5'
    ] : ['', '', '', '', ''];

    return (
        <div 
            className={`relative rounded-full flex items-center justify-center shrink-0 bw-brand-logo-badge size-${size} select-none transition-all duration-300 ${isTechnoActive ? 'anim-soundwave scale-105' : ''} ${className}`}
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
    const isLg = size === 'lg';

    return (
        <div className={`flex items-center ${isLg ? 'gap-4 sm:gap-6' : 'gap-2.5'} ${isVertical ? 'flex-col text-center' : 'flex-row'} ${className}`}>
            <BeatWaveLogoBadge size={size} isAnimated={isAnimated} />
            <div className={`flex flex-col ${isVertical ? 'items-center' : 'items-start'}`}>
                <div className={`flex items-center ${isLg ? 'gap-3 sm:gap-4' : 'gap-2'} leading-none`}>
                    <span className={`font-syne font-black tracking-[0.02em] leading-none select-none ${
                        isLg 
                            ? 'text-3xl sm:text-4xl block mb-16 mb-16 drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]' 
                            : 'text-xl sm:text-2xl'
                    }`}>
                        <span className="text-white">BEAT</span><span className="text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.85)]">WAVE</span>
                    </span>
                    <span className={`${
                        isLg 
                            ? 'text-sm sm:text-xl md:text-2xl font-mono px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl border-2' 
                            : 'text-[10px] font-mono px-1.5 py-0.5 rounded-md border'
                    } font-black tracking-widest border-cyan-400/80 bg-cyan-950 text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.5)] shrink-0 self-center`}>
                        PRO
                    </span>
                </div>
                {showSubtitle && (
                    <div className={`w-full flex justify-between items-center font-mono font-bold tracking-[0.06em] text-cyan-300/90 select-none leading-none ${
                        isLg 
                            ? 'text-xs sm:text-base md:text-[22px] mt-2 sm:mt-3' 
                            : 'text-[9px] mt-1'
                    }`}>
                        <span>PRECISION</span>
                        <span className={`text-cyan-400 font-black leading-none ${isLg ? 'text-sm sm:text-xl md:text-2xl' : 'text-xs'}`}>•</span>
                        <span>AUDIO</span>
                        <span className={`text-cyan-400 font-black leading-none ${isLg ? 'text-sm sm:text-xl md:text-2xl' : 'text-xs'}`}>•</span>
                        <span>INTELLIGENCE</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BeatWaveLogoBadge;
