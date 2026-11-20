const { useState } = React;
import { Icons } from '../shell/icons.jsx';

// Modal de configuración por lotes para Auditoría
export const BatchAuditorModal = ({ isOpen, onClose, onRunBatch, onSaveConfig }) => {
    const [opts, setOpts] = useState({ 
        fftLossless: true, 
        trimSilences: true, 
        beatgrid: false, 
        bpmKey: true, 
        energyDance: true, 
        moodDetect: true, 
        hotCues8: true, 
        tacticalComments: true, 
        injectCovers: true,
        detectDuplicates: true,
        fixMissingNames: true,
        normalizeNames: true,
        stripWhitespace: true,
        onlyIncomplete: false
    });
    if (!isOpen) return null;
    const toggle = (key) => setOpts(prev => ({ ...prev, [key]: !prev[key] }));
    const activeCount = Object.values(opts).filter(Boolean).length;

    const modules = [
        {
            group: "DSP & Audio Forensics",
            items: [
                { key: "fftLossless", title: "Inspección FFT Lossless Real", desc: "Análisis espectral por FFT para cazar transcodificaciones falsas a 16kHz/19kHz.", badge: "FFT 4096", badgeColor: "text-djcyan-400 bg-djcyan-950/80 border-djcyan-800/60" },
                { key: "trimSilences", title: "Zero-Crossing Silence Auto-Trim (Cabecera & Cola)", desc: "Elimina espacios en blanco y silencios muertos cortando a cruce por cero a -48 dBFS al inicio y fin.", badge: "Trim 2-Way", badgeColor: "text-djgreen-400 bg-djgreen-950/80 border-djgreen-800/60" },
                { key: "beatgrid", title: "Fijación & Corrección Acústica Beatgrid 1.0.0 (Anti-Drift)", desc: "Calcula el tempo físico real en subgraves (40-120Hz), corrige desvíos de BPM y ancla el Beatgrid 1.0.0 exactamente en el golpe inicial del bombo.", badge: "Grid Anti-Drift", badgeColor: "text-cyan-300 bg-cyan-950 border-cyan-500/70" },
                { key: "detectDuplicates", title: "Buscar & Deduplicar por Calidad", desc: "Compara pistas duplicadas por Nyquist FFT, formato y tamaño para depurar biblioteca.", badge: "Lossless Win", badgeColor: "text-amber-400 bg-amber-950/80 border-amber-800/60" }
            ]
        },
        {
            group: "Metadatos, Nombres & Mezcla Armónica",
            items: [
                { key: "fixMissingNames", title: "Auto-Completar Título / Artista", desc: "Deduce títulos y artistas faltantes desde la nomenclatura del archivo y metatags.", badge: "Tags Auto", badgeColor: "text-emerald-400 bg-emerald-950/80 border-emerald-800/60" },
                { key: "normalizeNames", title: "Normalizar Nombres & Limpiar Feats", desc: "Higieniza títulos, limpia spam promocional y normaliza feats.", badge: "Higienizar", badgeColor: "text-purple-400 bg-purple-950/80 border-purple-800/60" },
                { key: "stripWhitespace", title: "Saneamiento de Espacios al Inicio y Final (.strip())", desc: "Erradica espacios en blanco parásitos iniciales y finales en títulos, artistas y álbumes.", badge: "Anti-Whitespace", badgeColor: "text-djcyan-400 bg-djcyan-950/80 border-djcyan-800/60" },
                { key: "bpmKey", title: "BPM Decimal & Notación Camelot", desc: "Calcula tempo con 2 decimales y mapea tono a notación Camelot estándar.", badge: "Key Wheel", badgeColor: "text-amber-400 bg-amber-950/80 border-amber-800/60" },
                { key: "injectCovers", title: "Inyección de Carátulas 1:1 (Artwork)", desc: "Detecta carátulas de carpeta o carátula oficial y las incrusta 600x600 en APIC/FLAC.", badge: "Cover 1:1", badgeColor: "text-amber-400 bg-amber-950/80 border-amber-800/60" },
                { key: "onlyIncomplete", title: "Auditar Solo Pistas Incompletas", desc: "Omite pistas que ya tengan todos los metadatos completos para acelerar auditorías.", badge: "Speed Fast", badgeColor: "text-purple-400 bg-purple-950/80 border-purple-800/60" }
            ]
        },
        {
            group: "Perfil Psicoacústico & Hardware Cues",
            items: [
                { key: "energyDance", title: "Cálculo Energía & Danceability", desc: "Calcula la pegada RMS de graves y solidez rítmica de 1 a 100.", badge: "RMS Core", badgeColor: "text-purple-400 bg-purple-950/80 border-purple-800/60" },
                { key: "moodDetect", title: "Clasificación de Atmósfera & Fase DJ", desc: "Etiqueta ubicación de sesión (Warm-Up, Build-Up, Clímax Caña, Cierre, Calma).", badge: "AI Cluster", badgeColor: "text-emerald-400 bg-emerald-950/80 border-emerald-800/60" },
                { key: "hotCues8", title: "8 Hot Cues Acústicos (Drops & Fraseo 16/32b)", desc: "Analiza caídas de graves y explosión real de Drops (Sub-Bass + RMS) cuantizados al compás.", badge: "NV2 / Pioneer", badgeColor: "text-pink-400 bg-pink-950/80 border-pink-800/60" },
                { key: "tacticalComments", title: "Inyección de Comentario Táctico DJ", desc: "Inyecta en el tag ID3 COMM la guía rápida de mezcla visible en pantalla de la mesa.", badge: "Tag ID3", badgeColor: "text-gray-300 bg-djzinc-800 border-djzinc-700" }
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-djzinc-950 border border-djzinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-djzinc-800 flex items-center justify-between bg-djzinc-900/60">
                    <div className="flex items-center gap-2">
                        <Icons.Sliders />
                        <h3 className="font-bold text-sm uppercase tracking-wider text-white">Configurar Acciones de Auditoría (Batch)</h3>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-full bg-djzinc-800 text-gray-400 hover:text-white flex items-center justify-center text-xs"><Icons.Close size={14} className="inline-block align-[-2px]" /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-5">
                    {modules.map((group, gIdx) => (
                        <div key={gIdx} className="space-y-2.5">
                            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-djcyan-400"></span>
                                {group.group}
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                                {group.items.map(item => {
                                    const active = opts[item.key];
                                    return (
                                        <div key={item.key} onClick={() => toggle(item.key)} className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${active ? 'bg-djzinc-900/90 border-djcyan-500/40 shadow-sm' : 'bg-djzinc-950/40 border-djzinc-850 opacity-60 hover:opacity-90'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${active ? 'bg-djcyan-500 border-djcyan-400 text-black' : 'border-djzinc-700 bg-djzinc-900 text-transparent'}`}>
                                                    <Icons.Check size={14} className="inline-block align-[-2px]" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-white">{item.title}</span>
                                                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${item.badgeColor}`}>{item.badge}</span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="px-6 py-4 bg-djzinc-900 border-t border-djzinc-800 flex items-center justify-between gap-3 shrink-0">
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-djzinc-800 border border-djzinc-700 cursor-pointer transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button" 
                        onClick={() => {
                            if (onSaveConfig) onSaveConfig(opts);
                            onClose();
                        }} 
                        className="px-6 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-djcyan-400 to-djcyan-500 hover:from-djcyan-300 hover:to-djcyan-400 text-black cursor-pointer shadow-lg shadow-djcyan-500/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Icons.Check size={14} className="inline-block align-[-2px]" />
                        <span>Guardar Ajustes ({activeCount} activas)</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

