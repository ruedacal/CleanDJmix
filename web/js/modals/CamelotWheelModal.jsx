const { useState } = React;
import { Icons } from '../shell/icons.jsx';
import { CAMELOT_WHEEL_DATA } from '../data/djCatalog.js';

// Modal de Rueda Armónica Camelot (Circle of Fifths para DJs)
export const CamelotWheelModal = ({ isOpen, onClose, currentKey, onSelectKey }) => {
    if (!isOpen) return null;
    const currentData = CAMELOT_WHEEL_DATA[currentKey] || CAMELOT_WHEEL_DATA["8A"];
    const compatibleKeys = [
        { key: currentKey, desc: "Mismo tono (Mezcla armónica pura)", badge: "0", color: "bg-djcyan-500 text-black border-djcyan-400" },
        { key: currentData.rel, desc: "Relativo menor/mayor (Cambio de color suave)", badge: "A ↔ B", color: "bg-emerald-500 text-black border-emerald-400" },
        { key: currentData.up, desc: "Sube energía (+1 escala)", badge: "+1", color: "bg-amber-500 text-black border-amber-400" },
        { key: currentData.down, desc: "Relaja energía (-1 escala)", badge: "-1", color: "bg-blue-500 text-white border-blue-400" }
    ];

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-djzinc-950 border border-djzinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
                <div className="px-6 py-4 border-b border-djzinc-800 flex items-center justify-between bg-djzinc-900/70">
                    <div className="flex items-center gap-2.5">
                        <Icons.Disc size={14} className="inline-block align-[-2px]" />
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider text-white">Rueda Armónica Camelot (Circle of Fifths)</h3>
                            <p className="text-[11px] text-gray-400">Guía de compatibilidad para transiciones armónicas fluidas y mezclas sin disonancia</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-full bg-djzinc-800 text-gray-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"><Icons.Close size={14} className="inline-block align-[-2px]" /></button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Claves compatibles con la actual */}
                    <div className="bg-djzinc-900/90 p-3.5 rounded-xl border border-djzinc-800">
                        <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block mb-2">
                            Pistas Armónicamente Compatibles con <span className="text-djcyan-400 font-bold">{currentKey} ({currentData.classical} • {currentData.name})</span>:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {compatibleKeys.map((c, i) => {
                                const kInfo = CAMELOT_WHEEL_DATA[c.key] || {};
                                return (
                                    <div 
                                        key={i}
                                        onClick={() => { onSelectKey(c.key); onClose(); }}
                                        className="p-2.5 rounded-lg bg-djzinc-950 border border-djzinc-750 hover:border-djcyan-400 cursor-pointer flex flex-col justify-between transition-colors shadow-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-black text-sm text-white">{c.key}</span>
                                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${c.color}`}>{c.badge}</span>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-300 mt-1">{kInfo.classical}</span>
                                        <span className="text-[10px] text-gray-500 truncate mt-0.5">{c.desc}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Matriz 24 Claves Camelot */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Selector de 24 Tonos</span>
                            <span className="text-[10px] text-gray-500 font-mono">Fila B: Mayores • Fila A: Menores</span>
                        </div>

                        {/* Fila B: Mayores */}
                        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 mb-2">
                            {Array.from({ length: 12 }, (_, i) => `${i + 1}B`).map(k => {
                                const kInfo = CAMELOT_WHEEL_DATA[k];
                                const isSelected = k === currentKey;
                                return (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => { onSelectKey(k); onClose(); }}
                                        className={`p-1.5 rounded flex flex-col items-center justify-center border transition-all cursor-pointer ${
                                            isSelected 
                                                ? 'bg-djcyan-500 text-black border-djcyan-300 shadow-[0_0_10px_rgba(34,211,238,0.6)] font-bold' 
                                                : 'bg-djzinc-900 hover:bg-djzinc-800 text-gray-200 border-djzinc-800'
                                        }`}
                                    >
                                        <span className="text-[11px] font-mono font-bold">{k}</span>
                                        <span className={`text-[9px] font-mono ${isSelected ? 'text-black' : 'text-gray-400'}`}>{kInfo.classical}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Fila A: Menores */}
                        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
                            {Array.from({ length: 12 }, (_, i) => `${i + 1}A`).map(k => {
                                const kInfo = CAMELOT_WHEEL_DATA[k];
                                const isSelected = k === currentKey;
                                return (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => { onSelectKey(k); onClose(); }}
                                        className={`p-1.5 rounded flex flex-col items-center justify-center border transition-all cursor-pointer ${
                                            isSelected 
                                                ? 'bg-djcyan-500 text-black border-djcyan-300 shadow-[0_0_10px_rgba(34,211,238,0.6)] font-bold' 
                                                : 'bg-djzinc-900 hover:bg-djzinc-800 text-gray-200 border-djzinc-800'
                                        }`}
                                    >
                                        <span className="text-[11px] font-mono font-bold">{k}</span>
                                        <span className={`text-[9px] font-mono ${isSelected ? 'text-black' : 'text-gray-400'}`}>{kInfo.classical}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-3.5 bg-djzinc-900/60 border-t border-djzinc-800 flex justify-end">
                    <button onClick={onClose} className="px-4 py-1.5 bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 text-xs font-semibold rounded-lg cursor-pointer">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

