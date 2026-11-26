const { useState, useEffect } = React;
import { Icons } from '../shell/icons.jsx';

import { apiClient } from '../services/apiClient.js';
// Modal de Comparación Cara a Cara & Eliminación de Duplicados
export const DuplicateComparisonModal = ({ isOpen, onClose, tracks = [], onDuplicatesDeleted }) => {
    const [dupData, setDupData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedToDelete, setSelectedToDelete] = useState({});
    const [statusMsg, setStatusMsg] = useState('');
    const [protectSisters, setProtectSisters] = useState(true);
    const [filterOnlyWithDups, setFilterOnlyWithDups] = useState(false);

    const loadDups = async (protect = true) => {
        setLoading(true);
        setStatusMsg('Analizando biblioteca en busca de duplicados y calculando índice de calidad acústica...');
        try {
            if (true) {
                const res = await apiClient.rpc('detectar_duplicados_biblioteca', tracks, protect);
                setDupData(res);
                const initialSel = {};
                if (res && res.grupos) {
                    res.grupos.forEach(g => {
                        g.tracks.forEach(t => {
                            if (!t.is_winner && t.delete_selected && t.path) {
                                initialSel[t.path] = true;
                            }
                        });
                    });
                }
                setSelectedToDelete(initialSel);
            }
        } catch (err) {
            console.error("Error detectando duplicados:", err);
        } finally {
            setLoading(false);
            setStatusMsg('');
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        loadDups(protectSisters);
    }, [isOpen, tracks]);

    if (!isOpen) return null;

    const toggleSelect = (path) => {
        setSelectedToDelete(prev => ({
            ...prev,
            [path]: !prev[path]
        }));
    };

    const handleSelectAllInferiors = () => {
        if (!dupData || !dupData.grupos) return;
        const nxt = {};
        dupData.grupos.forEach(g => {
            g.tracks.forEach(t => {
                if (!t.is_winner && t.delete_selected && t.path) {
                    nxt[t.path] = true;
                }
            });
        });
        setSelectedToDelete(nxt);
    };

    const handleDeselectAll = () => {
        setSelectedToDelete({});
    };

    const countSelected = Object.values(selectedToDelete).filter(Boolean).length;

    let totalMbSelected = 0;
    if (dupData && dupData.grupos) {
        dupData.grupos.forEach(g => {
            g.tracks.forEach(t => {
                if (selectedToDelete[t.path]) {
                    totalMbSelected += (t.size_mb || 0);
                }
            });
        });
    }

    const handleConfirmDelete = async () => {
        const pathsToDelete = Object.keys(selectedToDelete).filter(p => selectedToDelete[p]);
        if (pathsToDelete.length === 0) {
            alert("No has seleccionado ninguna pista duplicada para eliminar.");
            return;
        }

        const confirmMsg = `¿Estás seguro de que deseas eliminar ${pathsToDelete.length} archivos duplicados? (${totalMbSelected.toFixed(1)} MB a liberar)\n\nEsta acción moverá los archivos a la papelera o los eliminará de forma segura.`;
        if (!window.confirm(confirmMsg)) return;

        setDeleting(true);
        setStatusMsg(`Eliminando ${pathsToDelete.length} archivos duplicados del disco...`);
        try {
            if (true) {
                const res = await apiClient.rpc('eliminar_pistas_duplicadas', pathsToDelete);
                if (res && res.status === 'ok') {
                    alert(`✓ Se eliminaron ${res.eliminados || pathsToDelete.length} pistas duplicadas con éxito.`);
                    if (onDuplicatesDeleted) {
                        onDuplicatesDeleted(res.paths_eliminados || pathsToDelete);
                    }
                    onClose();
                } else {
                    alert(`Error al eliminar: ${res?.errores?.join(', ') || 'Fallo de permisos en disco'}`);
                }
            }
        } catch (err) {
            console.error("Error al eliminar duplicados:", err);
            alert("Error al ejecutar eliminación de archivos.");
        } finally {
            setDeleting(false);
            setStatusMsg('');
        }
    };

    const displayedGrupos = dupData?.grupos ? (
        filterOnlyWithDups ? dupData.grupos.filter(g => (g.duplicados_a_eliminar || 0) > 0) : dupData.grupos
    ) : [];

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0c0c12] border border-djzinc-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-djzinc-800 bg-djzinc-950 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Icons.Scale size={14} className="inline-block align-[-2px] p-2 bg-amber-500/10 text-amber-400 rounded-lg  border border-amber-500/20" />
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider text-white font-mono">Comparador & Deduplicador Acústico</h3>
                            <p className="text-[11px] text-gray-400">Compara duplicados cara a cara (FLAC vs MP3, Bitrate, Cutoff Nyquist FFT, tamaño) y conserva la máxima calidad protegiendo versiones DJ.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-full bg-djzinc-800 text-gray-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"><Icons.Close size={14} className="inline-block align-[-2px]" /></button>
                </div>

                {dupData && (
                    <div className="px-6 py-3 bg-djzinc-900 border-b border-djzinc-800 flex items-center justify-between text-xs font-mono flex-wrap gap-2">
                        <div className="flex items-center gap-4">
                            <span className="text-gray-300">Grupos: <strong className="text-djcyan-400">{dupData.total_grupos}</strong></span>
                            <span className="text-gray-300">Duplicados: <strong className="text-amber-400">{dupData.total_duplicados}</strong></span>
                            <span className="text-gray-300">Espacio recuperable: <strong className="text-emerald-400">{dupData.espacio_recuperable_mb} MB</strong></span>
                        </div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <label className="flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer select-none">
                                <input 
                                    type="checkbox" 
                                    checked={protectSisters} 
                                    onChange={(e) => { 
                                        const nxt = e.target.checked; 
                                        setProtectSisters(nxt); 
                                        loadDups(nxt); 
                                    }} 
                                    className="w-3.5 h-3.5 rounded text-djcyan-500 bg-djzinc-800 border-djzinc-700 focus:ring-0 cursor-pointer" 
                                /> 
                                <span className="text-djcyan-300">Proteger versiones DJ</span>
                            </label>
                            <button 
                                onClick={() => setFilterOnlyWithDups(!filterOnlyWithDups)} 
                                className={`px-2 py-0.5 rounded border text-[11px] cursor-pointer transition-colors ${filterOnlyWithDups ? 'bg-amber-950/60 text-amber-300 border-amber-700/80 font-semibold' : 'bg-djzinc-800 text-gray-400 border-djzinc-700 hover:text-white'}`}
                            >
                                Solo a eliminar
                            </button>
                            <button onClick={handleSelectAllInferiors} className="px-2 py-0.5 bg-djzinc-800 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 text-[11px] cursor-pointer">Marcar Inferiores</button>
                            <button onClick={handleDeselectAll} className="px-2 py-0.5 bg-djzinc-800 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 text-[11px] cursor-pointer">Desmarcar</button>
                        </div>
                    </div>
                )}

                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                    {loading ? (
                        <div className="py-20 text-center space-y-3">
                            <div className="w-8 h-8 border-2 border-djcyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-xs font-mono text-gray-400">{statusMsg || 'Comparando espectrogramas y pureza de audio...'}</p>
                        </div>
                    ) : !dupData || displayedGrupos.length === 0 ? (
                        <div className="py-20 text-center space-y-3">
                            <Icons.Sparkles size={14} className="inline-block align-[-2px] block" />
                            <h4 className="text-sm font-bold text-white">¡Biblioteca 100% Limpia de Duplicados!</h4>
                            <p className="text-xs text-gray-400 max-w-md mx-auto">
                                {filterOnlyWithDups 
                                    ? 'No hay duplicados inferiores pendientes de eliminar (las versiones hermanas están protegidas).' 
                                    : 'No se encontraron versiones repetidas ni pistas con nombres duplicados en la biblioteca auditada.'}
                            </p>
                        </div>
                    ) : (
                        displayedGrupos.map((grupo, gIdx) => (
                            <div key={grupo.clave || gIdx} className="bg-[#101018] border border-djzinc-800 rounded-xl overflow-hidden shadow-sm">
                                <div className="px-4 py-2.5 bg-djzinc-950/80 border-b border-djzinc-800/80 flex items-center justify-between">
                                    <span className="text-xs font-bold text-djcyan-400 truncate font-mono"><Icons.Music size={14} className="inline-block align-[-2px]" /> {grupo.display_name}</span>
                                    <div className="flex items-center gap-2">
                                        {(grupo.duplicados_a_eliminar || 0) > 0 ? (
                                            <span className="text-[10px] font-mono text-red-400 bg-red-950/70 px-2 py-0.5 rounded border border-red-800/60 font-bold">
                                                🗑️ {grupo.duplicados_a_eliminar} duplicado{grupo.duplicados_a_eliminar > 1 ? 's' : ''} a eliminar
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                                                ✓ Versiones conservadas (0 a eliminar)
                                            </span>
                                        )}
                                        <span className="text-[10px] font-mono text-gray-400 bg-djzinc-900 px-2 py-0.5 rounded border border-djzinc-800">{grupo.total_versiones} archivos</span>
                                    </div>
                                </div>
                                <div className="divide-y divide-djzinc-850">
                                    {grupo.tracks.map((t, tIdx) => {
                                        const isSelected = Boolean(selectedToDelete[t.path]);
                                        return (
                                            <div key={t.path || tIdx} className={`p-3.5 flex items-center justify-between transition-colors ${t.is_winner ? 'bg-emerald-950/15' : isSelected ? 'bg-red-950/20' : 'bg-transparent'}`}>
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(t.path)}
                                                        className="w-4 h-4 rounded border-djzinc-700 bg-djzinc-900 text-red-500 focus:ring-0 cursor-pointer shrink-0"
                                                        title={t.is_winner ? "¡Cuidado! Esta es una versión protegida a conservar" : "Marcar para eliminar"}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs font-semibold text-white truncate max-w-[280px]" title={t.title || t.filename}>{t.title || t.filename}</span>
                                                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                                                t.is_winner 
                                                                    ? (t.badge_color === 'cyan' ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800') 
                                                                    : 'bg-red-950/80 text-red-400 border-red-800'
                                                            }`}>
                                                                {t.badge_recommendation}
                                                            </span>
                                                            <span className="text-[9px] font-mono bg-djzinc-850 text-gray-300 px-1.5 py-0.5 rounded border border-djzinc-750">
                                                                Score: {t.quality_score} pts
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400 mt-1 flex-wrap">
                                                            <span className="text-djcyan-400 font-bold uppercase">{t.format}</span>
                                                            <span>{t.sample_rate_khz || 44.1} kHz</span>
                                                            <span>{t.bitrate_kbps ? `${t.bitrate_kbps} kbps` : (t.format === 'MP3' ? '320 kbps' : '1411 kbps')}</span>
                                                            <span>FFT: <strong className={t.cutoff_khz >= 20 ? 'text-emerald-400' : 'text-amber-400'}>{t.cutoff_khz ? `${t.cutoff_khz}kHz` : '22kHz'}</strong></span>
                                                            <span>Peso: <strong className="text-gray-300">{t.size_mb || 0} MB</strong></span>
                                                            <span className="text-gray-500 truncate max-w-[220px]" title={t.path}>{t.path}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="px-6 py-4 bg-djzinc-950 border-t border-djzinc-800 flex items-center justify-between shrink-0">
                    <div className="text-xs font-mono text-gray-400">
                        {countSelected > 0 ? (
                            <span>Seleccionadas para eliminar: <strong className="text-red-400">{countSelected} pistas</strong> ({totalMbSelected.toFixed(1)} MB)</span>
                        ) : (
                            <span>Ninguna pista seleccionada para eliminación</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-djzinc-850 border border-djzinc-750 cursor-pointer">Cerrar</button>
                        <button 
                            onClick={handleConfirmDelete}
                            disabled={countSelected === 0 || deleting}
                            className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white cursor-pointer shadow-lg shadow-red-600/20 flex items-center gap-1.5 transition-all"
                        >
                            {deleting ? 'Eliminando...' : `🗑️ Eliminar Duplicados Seleccionados (${countSelected})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

