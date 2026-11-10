import React from 'react';

/**
 * MetricCard — Tarjeta HUD de telemetría acústica y salud de la biblioteca
 * Identificador Figma: MetricCard (Node 32:46247 en el lienzo maestro)
 */
export const MetricCard = ({
    title = 'SALUD GLOBAL',
    value = '16',
    sublabel = 'pistas',
    status = 'active', // 'active' | 'warn' | 'ok' | 'fail'
    onClick,
    tooltip
}) => {
    const statusClasses = {
        active: 'border-cyan-500/60 bg-[#090d14] text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
        warn: 'border-amber-500/60 bg-[#141008] text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
        ok: 'border-emerald-500/60 bg-[#08140e] text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
        fail: 'border-rose-500/60 bg-[#16080b] text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
    };

    const statusBadge = {
        active: { text: '100%', bg: 'bg-cyan-950 text-cyan-300 border-cyan-800' },
        warn: { text: 'WARN', bg: 'bg-amber-950 text-amber-300 border-amber-800' },
        ok: { text: 'OK', bg: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
        fail: { text: 'FAIL', bg: 'bg-rose-950 text-rose-300 border-rose-800' }
    };

    const currentStyle = statusClasses[status] || statusClasses.active;
    const currentBadge = statusBadge[status] || statusBadge.active;

    return (
        <div
            onClick={onClick}
            title={tooltip}
            className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all select-none cursor-pointer ${currentStyle}`}
        >
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    {title}
                </span>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold ${currentBadge.bg}`}>
                    {currentBadge.text}
                </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-mono font-black text-white">
                    {value}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                    {sublabel}
                </span>
            </div>
        </div>
    );
};

export default MetricCard;
