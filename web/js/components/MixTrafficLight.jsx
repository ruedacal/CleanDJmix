import React from 'react';

/**
 * MixTrafficLight — Semáforo de mezcla armónica y anti-masking en cabina
 * Identificador Figma: MixTrafficLight (Node 32:46450 en el lienzo maestro)
 */
export const MixTrafficLight = ({
    status = 'safe', // 'safe' | 'caution' | 'clash'
    bpmDelta = '+0.2',
    keyRelation = 'Camelot 8A ➔ 8A',
    message = 'Sync 100% · Sin enmascaramiento de subgraves',
    actionText = 'Corte de Bajos no requerido'
}) => {
    const config = {
        safe: {
            bg: 'bg-[#091a14]',
            border: 'border-emerald-600',
            dot: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
            label: '🟢 SAFE MIX',
            color: 'text-emerald-300',
            sub: 'text-emerald-400'
        },
        caution: {
            bg: 'bg-[#1c1809]',
            border: 'border-amber-600',
            dot: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
            label: '🟡 CAUTION',
            color: 'text-amber-300',
            sub: 'text-amber-400'
        },
        clash: {
            bg: 'bg-[#20090f]',
            border: 'border-rose-600',
            dot: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]',
            label: '🔴 BASS CLASH',
            color: 'text-rose-300',
            sub: 'text-rose-400'
        }
    };

    const cur = config[status] || config.safe;

    return (
        <div className={`p-3 rounded-xl border flex flex-col gap-2 font-mono text-xs select-none ${cur.bg} ${cur.border}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${cur.dot}`}></span>
                    <span className={`font-black ${cur.color}`}>{cur.label}</span>
                </div>
                <span className="text-[10px] text-zinc-400">
                    Δ BPM: <strong className="text-white">{bpmDelta}</strong> · {keyRelation}
                </span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
                <span className="text-zinc-300">{message}</span>
                <span className={`font-bold ${cur.sub}`}>{actionText}</span>
            </div>
        </div>
    );
};

export default MixTrafficLight;
