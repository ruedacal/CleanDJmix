const { useState, useEffect, useMemo } = React;
import { Icons } from '../shell/icons.jsx';
import { CAMELOT_WHEEL_DATA } from '../data/djCatalog.js';


export const MixOracleModal = ({ isOpen, onClose, currentTrack, allTracks = [], onPlayTrack, onSelectTrack }) => {
    if (!isOpen || !currentTrack) return null;

    const baseBpm = parseFloat(currentTrack.bpm || currentTrack.b) || 128.0;
    const baseKey = (currentTrack.key || currentTrack.k || '8A').toUpperCase();
    const baseRole = currentTrack.acoustic_role || 'Balanced Full-Range';
    const isBaseBass = (currentTrack.low_ratio || 33) >= 44 || baseRole === 'Bass Driver';

    // Rueda Camelot: descomponer número y letra
    const parseCamelot = (k) => {
        const m = String(k || '').trim().toUpperCase().match(/^(\d{1,2})([AB])$/);
        if (m) return { num: parseInt(m[1]), mode: m[2] };
        return { num: 8, mode: 'A' };
    };

    const curCam = parseCamelot(baseKey);

    // Evaluar compatibilidad de mezcla para cada pista de la biblioteca
    const scoredCandidates = (allTracks || [])
        .filter(t => String(t.id) !== String(currentTrack.id))
        .map(t => {
            const trkBpm = parseFloat(t.bpm || t.b) || 128.0;
            const trkKey = (t.key || t.k || '8A').toUpperCase();
            const trkCam = parseCamelot(trkKey);
            const trkRole = t.acoustic_role || 'Balanced Full-Range';
            const isTrkBass = (t.low_ratio || 33) >= 44 || trkRole === 'Bass Driver';

            // 1. PUNTUACIÓN ARMÓNICA (0-50 pts)
            let harmonicScore = 0;
            let harmonicStrategy = "Clash";
            let harmonicBadge = "DISONANTE";
            let harmonicColor = "#ef4444";

            const upNum = curCam.num === 12 ? 1 : curCam.num + 1;
            const downNum = curCam.num === 1 ? 12 : curCam.num - 1;
            const surgeNum = curCam.num >= 11 ? (curCam.num + 2 - 12) : curCam.num + 2;

            if (curCam.num === trkCam.num && curCam.mode === trkCam.mode) {
                harmonicScore = 50;
                harmonicStrategy = "Tono Idéntico";
                harmonicBadge = "PERFECT KEY";
                harmonicColor = "#10b981";
            } else if (curCam.mode === trkCam.mode && (trkCam.num === upNum)) {
                harmonicScore = 48;
                harmonicStrategy = "Subidón +1 Camelot";
                harmonicBadge = "ENERGY BOOST";
                harmonicColor = "#06b6d4";
            } else if (curCam.mode === trkCam.mode && (trkCam.num === downNum)) {
                harmonicScore = 45;
                harmonicStrategy = "Calma / Profundo -1";
                harmonicBadge = "DEEP CALM";
                harmonicColor = "#818cf8";
            } else if (curCam.num === trkCam.num && curCam.mode !== trkCam.mode) {
                harmonicScore = 42;
                harmonicStrategy = "Cambio Modal Relativo";
                harmonicBadge = "MODAL SHIFT";
                harmonicColor = "#f59e0b";
            } else if (curCam.mode === trkCam.mode && trkCam.num === surgeNum) {
                harmonicScore = 40;
                harmonicStrategy = "Salto de Tensión +2";
                harmonicBadge = "SURGE +2";
                harmonicColor = "#ec4899";
            } else {
                harmonicScore = 10;
            }

            // 2. PUNTUACIÓN DE TEMPO (0-30 pts)
            const bpmDiff = Math.abs(trkBpm - baseBpm);
            const pitchBendPct = baseBpm > 0 ? ((trkBpm - baseBpm) / baseBpm) * 100 : 0;
            let tempoScore = Math.max(0, 30 - (bpmDiff * 5));

            // 3. PUNTUACIÓN ANTI-MUDDY & ROL ACÚSTICO (0-20 pts)
            let muddyScore = 15;
            let muddyAlert = "Seguro";
            let muddyColor = "#10b981";

            if (isBaseBass && isTrkBass) {
                muddyScore = 2;
                muddyAlert = "⚠️ Colisión Bass (Corta Low)";
                muddyColor = "#ef4444";
            } else if ((isBaseBass && (trkRole === 'Vocal / Lead' || trkRole === 'Percussive Tool')) || (isTrkBass && (baseRole === 'Vocal / Lead' || baseRole === 'Percussive Tool'))) {
                muddyScore = 20;
                muddyAlert = "🟢 Anti-Muddy Perfecto";
                muddyColor = "#10b981";
            } else {
                muddyScore = 15;
                muddyAlert = "Equilibrado";
                muddyColor = "#38bdf8";
            }

            const totalScore = Math.min(100, Math.round(harmonicScore + tempoScore + muddyScore));

            return {
                track: t,
                totalScore,
                harmonicScore,
                harmonicStrategy,
                harmonicBadge,
                harmonicColor,
                pitchBendPct: pitchBendPct.toFixed(1),
                bpmDiff: bpmDiff.toFixed(1),
                muddyAlert,
                muddyColor
            };
        })
        .filter(c => c.totalScore >= 45)
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 8);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans animate-fadeIn">
            <div className="bg-[#0b0b14] border border-purple-500/50 rounded-2xl w-full max-w-3xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.25)] flex flex-col max-h-[88vh]">
                {/* Cabecera Mix Oracle */}
                <div className="p-4 bg-gradient-to-r from-purple-950 via-[#10101f] to-indigo-950 border-b border-purple-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Icons.Compass size={14} className="inline-block align-[-2px] p-2 rounded-xl bg-purple-900/60 border border-purple-500/50 text-purple-300" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-syne font-black text-white text-base tracking-wide">EL RADAR DE MEZCLA MÁGICA (MIX ORACLE)</h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-900 text-purple-200 border border-purple-700">
                                    AI HARMONIC RADAR
                                </span>
                            </div>
                            <p className="text-xs text-purple-300/80 font-mono mt-0.5">
                                Calculando compatibilidad Camelot, pitch bend exacto y separación acústica Anti-Muddy
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 flex items-center justify-center text-xs cursor-pointer">
                        <Icons.Close size={14} className="inline-block align-[-2px]" />
                    </button>
                </div>

                {/* Tarjeta del Tema de Referencia */}
                <div className="p-3.5 bg-[#08080f] border-b border-zinc-800 flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">TEMA ACTUAL:</span>
                        <div className="font-bold text-white truncate max-w-xs">{currentTrack.title || currentTrack.t}</div>
                        <span className="text-gray-400 truncate max-w-[140px] hidden sm:inline">• {currentTrack.artist || currentTrack.a}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-750 text-djcyan-400 font-bold">
                            {baseBpm} BPM
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-black">
                            {baseKey}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-gray-300 text-[10px]">
                            {baseRole}
                        </span>
                    </div>
                </div>

                {/* Lista de Recomendaciones de Mezcla */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#05050a]">
                    {scoredCandidates.length === 0 ? (
                        <div className="py-12 text-center text-gray-500 font-mono text-xs">
                            No se encontraron pistas armónicamente compatibles en la biblioteca actual. Carga más canciones o audita el lote completo.
                        </div>
                    ) : (
                        scoredCandidates.map((c, idx) => (
                            <div 
                                key={c.track.id || idx}
                                className="p-3 rounded-xl bg-[#0e0e18] hover:bg-[#151524] border border-zinc-800/90 hover:border-purple-500/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-8 h-8 rounded-lg bg-black border border-purple-900/60 flex items-center justify-center font-mono font-black text-xs text-purple-300 shrink-0">
                                        #{idx + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white text-xs truncate max-w-xs group-hover:text-purple-300 transition-colors">
                                                {c.track.title || c.track.t}
                                            </span>
                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black" style={{ color: c.harmonicColor, backgroundColor: `${c.harmonicColor}22` }}>
                                                {c.harmonicBadge}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-gray-400 font-mono truncate">
                                            {c.track.artist || c.track.a}
                                        </div>
                                    </div>
                                </div>

                                {/* Métricas del Cruce de Mezcla */}
                                <div className="flex items-center gap-3 font-mono text-xs shrink-0">
                                    <div className="text-right">
                                        <div className="font-bold text-white">{c.track.bpm || c.track.b} BPM</div>
                                        <div className={`text-[10px] ${parseFloat(c.pitchBendPct) > 0 ? 'text-amber-400' : 'text-djcyan-400'}`}>
                                            {parseFloat(c.pitchBendPct) >= 0 ? `+${c.pitchBendPct}%` : `${c.pitchBendPct}%`} pitch
                                        </div>
                                    </div>

                                    <div className="px-2 py-1 rounded-lg bg-purple-950 text-purple-200 border border-purple-800/80 font-black text-center min-w-[50px]">
                                        {c.track.key || c.track.k || '8A'}
                                    </div>

                                    <div className="hidden md:block text-[10px]" style={{ color: c.muddyColor }}>
                                        {c.muddyAlert}
                                    </div>

                                    {/* Puntuación Global Match */}
                                    <div className="flex flex-col items-center justify-center px-2 py-1 rounded-lg bg-black/60 border border-purple-500/40 min-w-[58px]">
                                        <span className="text-[9px] text-gray-400 uppercase font-bold">Match</span>
                                        <span className="text-sm font-black text-emerald-400">{c.totalScore}%</span>
                                    </div>

                                    {/* Botón de Preescucha / Seleccionar */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (onPlayTrack) onPlayTrack(c.track, 0, true);
                                            if (onSelectTrack) onSelectTrack(c.track.id);
                                            onClose();
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-xs cursor-pointer shadow-md transition-all active:scale-95 flex items-center gap-1"
                                        title="Cargar y reproducir esta pista sugerida"
                                    >
                                        <Icons.Play size={14} className="inline-block align-[-2px]" />
                                        <span>Cargar</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-3 bg-[#08080f] border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-gray-400">
                    <span>Consejo DJ: Empareja bombos opuestos (Bass Driver con Percussive) para mezclas largas impecables.</span>
                    <button 
                        onClick={onClose}
                        className="px-4 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold cursor-pointer"
                    >
                        Cerrar (ESC)
                    </button>
                </div>
            </div>
        </div>
    );
};

