import React from 'react';

/**
 * TrackRow — Fila técnica de biblioteca de audio con metadatos DJ y análisis espectral
 * Identificador Figma: Component 7 (Node 32:45885)
 */
export const TrackRow = ({
    track = {},
    index = 1,
    isSelected = false,
    isPlaying = false,
    onSelect,
    onPlay,
    onShowCues,
    onAddToSet,
    onDelete
}) => {
    const {
        id,
        title = 'Pista sin título',
        artist = 'Artista desconocido',
        bpm = 126,
        key = '8A',
        format = 'FLAC',
        is_lossless = true,
        integrated_lufs = -8.2
    } = track;

    return (
        <tr 
            onClick={() => onSelect && onSelect(track)}
            className={`border-b border-djzinc-850/80 transition-colors cursor-pointer select-none group ${
                isSelected 
                    ? 'bg-cyan-950/30 border-l-2 border-cyan-400' 
                    : isPlaying
                        ? 'bg-pink-950/20 border-l-2 border-pink-500'
                        : 'hover:bg-[#121218]'
            }`}
        >
            {/* Índice numérico tabular */}
            <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-500 w-10 text-center">
                {String(index).padStart(2, '0')}
            </td>

            {/* Play button */}
            <td className="py-2.5 px-2 w-10 text-center" onClick={(e) => { e.stopPropagation(); onPlay && onPlay(track); }}>
                <button 
                    type="button"
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isPlaying 
                            ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.7)]' 
                            : 'bg-[#181822] text-cyan-400 hover:bg-cyan-950/60 border border-zinc-800'
                    }`}
                >
                    {isPlaying ? '❚❚' : '▶'}
                </button>
            </td>

            {/* Título & Artista */}
            <td className="py-2.5 px-3 min-w-[220px]">
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-mono font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                        {title}
                    </span>
                    <span className="text-[11px] text-zinc-400 truncate">
                        {artist}
                    </span>
                </div>
            </td>

            {/* BPM */}
            <td className="py-2.5 px-3 font-mono text-xs font-bold text-white text-center w-20">
                {typeof bpm === 'number' ? bpm.toFixed(1) : bpm}
            </td>

            {/* Camelot Key Badge */}
            <td className="py-2.5 px-3 text-center w-20">
                <span className="px-2 py-0.5 rounded-md font-mono text-xs font-black bg-amber-950 text-amber-300 border border-amber-700/60 shadow-sm">
                    {key}
                </span>
            </td>

            {/* Calidad / Certificación Lossless */}
            <td className="py-2.5 px-3 text-center w-24">
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                    is_lossless 
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-700/60' 
                        : 'bg-zinc-900 text-zinc-400 border-zinc-750'
                }`}>
                    {format}
                </span>
            </td>

            {/* Acciones de cabina */}
            <td className="py-2.5 px-3 text-right">
                <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    {onShowCues && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onShowCues(track); }}
                            className="px-2 py-1 rounded bg-[#181820] hover:bg-cyan-950 text-cyan-400 border border-zinc-800 text-[10px] font-mono font-bold cursor-pointer"
                        >
                            Cues
                        </button>
                    )}
                    {onAddToSet && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onAddToSet(track); }}
                            className="px-2 py-1 rounded bg-[#181820] hover:bg-purple-950 text-purple-300 border border-zinc-800 text-[10px] font-mono font-bold cursor-pointer"
                        >
                            + Set
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default TrackRow;
