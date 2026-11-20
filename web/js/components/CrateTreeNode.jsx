import React from 'react';

/**
 * CrateTreeNode — Nodo de estructura jerárquica de Crates (Serato & Rekordbox)
 * Identificador Figma: Component 10 (Node 32:45919)
 */
export const CrateTreeNode = ({
    name = 'Crate',
    count = 0,
    icon = '📂',
    color = 'cyan', // 'cyan' | 'purple' | 'amber' | 'neutral'
    isSubcrate = false,
    isSelected = false,
    onClick
}) => {
    const colorStyles = {
        cyan: {
            border: 'border-cyan-500/60',
            badge: 'bg-cyan-950 text-cyan-300 border-cyan-800'
        },
        purple: {
            border: 'border-purple-500/60',
            badge: 'bg-purple-950 text-purple-300 border-purple-800'
        },
        amber: {
            border: 'border-amber-500/60',
            badge: 'bg-amber-950 text-amber-300 border-amber-800'
        },
        neutral: {
            border: 'border-zinc-700',
            badge: 'bg-zinc-800 text-zinc-400 border-zinc-700'
        }
    };

    const activeColor = colorStyles[color] || colorStyles.neutral;

    return (
        <div
            onClick={onClick}
            className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer select-none font-mono text-xs ${
                isSubcrate ? 'pl-6 border-l-2 ml-2' : ''
            } ${
                isSubcrate ? activeColor.border : ''
            } ${
                isSelected 
                    ? 'bg-zinc-800 text-white font-bold shadow-md' 
                    : 'hover:bg-zinc-900/80 text-zinc-300'
            }`}
        >
            <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm shrink-0">{icon}</span>
                <span className="truncate">{name}</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${activeColor.badge}`}>
                {count}
            </span>
        </div>
    );
};

export default CrateTreeNode;
