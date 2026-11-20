const { useState, useEffect } = React;
import { Icons } from '../shell/icons.jsx';

/**
 * Modal Unificada de Exploración de Bibliotecas & Archivos
 * Compartida de forma 100% idéntica entre Auditoría, Cues, Sets, Maps, Pool y Radar.
 */
export const UnifiedLibraryBrowserModal = ({
    isOpen = false,
    onClose = () => {},
    title = "Explorador de Biblioteca & Selección de Archivos",
    initialPath = "",
    onSelectPath = null,            // (path: string, append: boolean) => void
    onSelectMultiple = null,        // (targets: string[], append: boolean) => void
    customLibraries = [],
    activeCustomLibId = null,
    onImportCollection = null,      // (libId: string) => void
    isAppendMode = false
}) => {
    if (!isOpen) return null;

    const [currentPath, setCurrentPath] = useState(initialPath || "");
    const [parentPath, setParentPath] = useState("");
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('folders'); // 'folders' | 'files'

    // Cesta de selección acumulativa
    const [stagedFolders, setStagedFolders] = useState([]);
    const [stagedFiles, setStagedFiles] = useState([]);

    // Selección de biblioteca si hay más de una
    const [selectedLibId, setSelectedLibId] = useState(() => {
        if (activeCustomLibId) return activeCustomLibId;
        if (customLibraries && customLibraries.length > 0) return customLibraries[0].id;
        return "";
    });

    const fetchDirectoryListing = async (targetPath = "") => {
        setLoading(true);
        let res = null;
        if (window.eel && window.eel.listar_subcarpetas_sistema) {
            try {
                res = await window.eel.listar_subcarpetas_sistema(targetPath)();
            } catch (err) {
                console.warn("[UNIFIED MODAL] Fallo llamada Eel, recurriendo a HTTP:", err);
            }
        }
        if (!res || (!res.folders?.length && !res.files?.length && !res.current)) {
            try {
                const resp = await fetch(`/api/listar_subcarpetas?ruta=${encodeURIComponent(targetPath || '')}`);
                if (resp.ok) res = await resp.json();
            } catch (e) {
                console.warn("[UNIFIED MODAL] Fallo HTTP subcarpetas:", e);
            }
        }
        if (res) {
            setCurrentPath(res.current || targetPath || "/");
            setParentPath(res.parent || "");
            setFolders(res.folders || []);
            setFiles(res.files || []);
        } else {
            setCurrentPath(targetPath || "/");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDirectoryListing(initialPath);
    }, [initialPath]);

    const handleAbrirFinder = async () => {
        try {
            let res = null;
            if (window.eel && window.eel.seleccionar_carpeta_dialogo) {
                res = await window.eel.seleccionar_carpeta_dialogo()();
            } else {
                const resp = await fetch('/api/seleccionar_carpeta_dialogo');
                if (resp.ok) res = await resp.json();
            }
            if (res && res.ruta) {
                if (onSelectPath) {
                    onSelectPath(res.ruta, isAppendMode);
                    onClose();
                } else {
                    fetchDirectoryListing(res.ruta);
                }
            }
        } catch (err) {
            console.error("[UNIFIED MODAL] Error abriendo diálogo nativo:", err);
        }
    };

    const toggleStageFolder = (fPath) => {
        setStagedFolders(prev => 
            prev.includes(fPath) ? prev.filter(x => x !== fPath) : [...prev, fPath]
        );
    };

    const toggleStageFile = (fileItem) => {
        const filePath = typeof fileItem === 'string' ? fileItem : (fileItem.path || fileItem.filepath);
        if (!filePath) return;
        setStagedFiles(prev => 
            prev.includes(filePath) ? prev.filter(x => x !== filePath) : [...prev, filePath]
        );
    };

    const handleConfirmSelection = () => {
        const allTargets = [...stagedFolders, ...stagedFiles];
        if (allTargets.length > 0) {
            if (onSelectMultiple) {
                onSelectMultiple(allTargets, isAppendMode);
            } else if (onSelectPath) {
                onSelectPath(allTargets[0], isAppendMode);
            }
            onClose();
        } else if (currentPath) {
            if (onSelectPath) {
                onSelectPath(currentPath, isAppendMode);
            }
            onClose();
        }
    };

    const handleExecuteImportCollection = () => {
        if (!onImportCollection) return;
        const targetId = selectedLibId || (customLibraries[0] && customLibraries[0].id);
        onImportCollection(targetId);
        onClose();
    };

    const totalStaged = stagedFolders.length + stagedFiles.length;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn">
            <div className="bg-[#0c0c12] border border-djzinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                
                {/* 1. Header de la Modal */}
                <div className="p-3.5 sm:p-4 border-b border-djzinc-800 bg-djzinc-950 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-djcyan-400 font-bold text-xs sm:text-sm uppercase tracking-wider font-mono flex items-center gap-2">
                            <Icons.Library size={16} /> {title}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Botón Finder macOS */}
                        <button
                            type="button"
                            onClick={handleAbrirFinder}
                            className="px-3 py-1.5 min-h-[32px] bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/70 text-emerald-300 hover:text-white rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shadow flex items-center gap-1.5 active:scale-95"
                            title="Abrir ventana nativa del Finder de macOS para seleccionar carpeta"
                        >
                            <Icons.Folder size={14} />
                            <span>Abrir Finder</span>
                        </button>

                        {/* Botón de Importar Colección en la Cabecera si hay bibliotecas */}
                        {onImportCollection && customLibraries && customLibraries.length > 0 && (
                            <div className="flex items-center gap-1 bg-purple-950/60 border border-purple-500/50 rounded-lg p-0.5">
                                {customLibraries.length > 1 && (
                                    <select
                                        value={selectedLibId}
                                        onChange={(e) => setSelectedLibId(e.target.value)}
                                        className="bg-purple-900/80 text-purple-200 text-[11px] font-mono font-bold rounded px-2 py-1 outline-none border-none cursor-pointer"
                                        title="Seleccionar qué colección cargar"
                                    >
                                        {customLibraries.map(lib => (
                                            <option key={lib.id} value={lib.id}>
                                                {lib.name} ({lib.folders?.reduce((acc, f) => acc + (f.tracks?.length || 0), 0) || 0} pistas)
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <button
                                    type="button"
                                    onClick={handleExecuteImportCollection}
                                    className="px-2.5 py-1 min-h-[28px] bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow"
                                    title="Importar colección guardada"
                                >
                                    <Icons.Layers size={13} />
                                    <span>Importar Colección</span>
                                </button>
                            </div>
                        )}

                        <button 
                            type="button"
                            onClick={onClose} 
                            className="w-7 h-7 rounded-full bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 flex items-center justify-center text-xs cursor-pointer ml-1"
                        >
                            <Icons.Close size={14} />
                        </button>
                    </div>
                </div>

                {/* 2. Barra de Ruta y Acciones Rápidas */}
                <div className="px-4 py-2.5 bg-djzinc-900/90 border-b border-djzinc-800 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-gray-400 shrink-0 font-bold">Ruta:</span>
                        <span className="text-djcyan-400 font-bold truncate max-w-md" title={currentPath}>
                            {currentPath || "Cargando..."}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {currentPath && (
                            <button 
                                type="button"
                                onClick={() => toggleStageFolder(currentPath)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 shadow ${
                                    stagedFolders.includes(currentPath)
                                        ? 'bg-emerald-500 text-black border-emerald-400 font-black'
                                        : 'bg-djcyan-950/80 hover:bg-djcyan-900 border-djcyan-700/70 text-djcyan-300'
                                }`}
                                title="Añadir o quitar toda esta carpeta de la cesta de selección conjunta"
                            >
                                <span>{stagedFolders.includes(currentPath) ? '✓' : '+'}</span>
                                <span>{stagedFolders.includes(currentPath) ? 'Carpeta Añadida' : 'Añadir Toda Esta Carpeta'}</span>
                            </button>
                        )}
                        {parentPath && parentPath !== currentPath && (
                            <button 
                                type="button"
                                onClick={() => fetchDirectoryListing(parentPath)} 
                                className="px-2.5 py-1.5 bg-djzinc-800 hover:bg-djzinc-700 text-white rounded-lg text-xs font-mono font-bold border border-djzinc-700 cursor-pointer shrink-0 flex items-center gap-1 shadow"
                            >
                                <span>▲</span> <span>Subir Nivel</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. Pestañas de Vista (Subcarpetas / Archivos) */}
                <div className="px-4 py-2 bg-[#09090f] border-b border-djzinc-800/80 flex items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('folders')}
                            className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'folders'
                                    ? 'bg-djzinc-800 text-white border border-djzinc-600 font-bold'
                                    : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            <Icons.Folder size={13} className="text-amber-400" />
                            <span>Subcarpetas ({folders.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('files')}
                            className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'files'
                                    ? 'bg-djzinc-800 text-white border border-djzinc-600 font-bold'
                                    : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            <Icons.Music size={13} className="text-djcyan-400" />
                            <span>Archivos de Audio ({files.length})</span>
                        </button>
                    </div>

                    {totalStaged > 0 && (
                        <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                            <span>🛒 Cesta:</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/60">
                                {stagedFolders.length} carp. + {stagedFiles.length} pist.
                            </span>
                        </span>
                    )}
                </div>

                {/* 4. Lista de Directorios o Archivos */}
                <div className="p-3 overflow-y-auto custom-scrollbar flex-1 min-h-[220px] max-h-[380px] bg-[#07070b]">
                    {loading ? (
                        <div className="py-16 text-center text-xs font-mono text-djcyan-400 animate-pulse flex flex-col items-center justify-center gap-2">
                            <span className="w-6 h-6 border-2 border-djcyan-400 border-t-transparent rounded-full animate-spin"></span>
                            <span>Explorando disco...</span>
                        </div>
                    ) : activeTab === 'folders' ? (
                        folders.length === 0 ? (
                            <div className="py-12 text-center text-xs font-mono text-gray-500">
                                No se encontraron subcarpetas en este directorio.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-1.5">
                                {folders.map((f, idx) => {
                                    const isStaged = stagedFolders.includes(f.path);
                                    return (
                                        <div 
                                            key={idx}
                                            className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                                                isStaged 
                                                    ? 'bg-emerald-950/40 border-emerald-500/60' 
                                                    : 'bg-[#0f0f18] hover:bg-[#161624] border-djzinc-800/80 hover:border-djzinc-700'
                                            }`}
                                        >
                                            <div 
                                                onClick={() => fetchDirectoryListing(f.path)}
                                                className="flex items-center gap-2.5 flex-1 min-w-0"
                                                title="Hacer clic para entrar a esta carpeta"
                                            >
                                                <Icons.Folder size={15} className="text-amber-400 shrink-0" />
                                                <span className="text-xs font-mono text-gray-200 font-medium truncate">{f.name}</span>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); toggleStageFolder(f.path); }}
                                                    className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                                                        isStaged
                                                            ? 'bg-emerald-500 text-black'
                                                            : 'bg-djzinc-800 hover:bg-djzinc-700 text-djcyan-400'
                                                    }`}
                                                    title="Añadir esta subcarpeta a la cesta"
                                                >
                                                    {isStaged ? '✓ Añadida' : '+ Cesta'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => fetchDirectoryListing(f.path)}
                                                    className="px-2 py-1 bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 text-[11px] font-mono rounded cursor-pointer"
                                                >
                                                    Entrar →
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        files.length === 0 ? (
                            <div className="py-12 text-center text-xs font-mono text-gray-500">
                                No se encontraron archivos de audio compatibles (.mp3, .flac, .wav, .aiff, .m4a) en esta carpeta.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-1">
                                {files.map((file, idx) => {
                                    const fPath = typeof file === 'string' ? file : (file.path || file.filepath);
                                    const fName = typeof file === 'string' ? file.split('/').pop() : (file.name || fPath.split('/').pop());
                                    const isStaged = stagedFiles.includes(fPath);
                                    return (
                                        <div 
                                            key={idx}
                                            onClick={() => toggleStageFile(fPath)}
                                            className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                                                isStaged 
                                                    ? 'bg-emerald-950/40 border-emerald-500/60' 
                                                    : 'bg-[#0f0f18] hover:bg-[#161624] border-djzinc-800/80'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                                <Icons.Music size={13} className="text-djcyan-400 shrink-0" />
                                                <span className="text-xs font-mono text-gray-300 truncate">{fName}</span>
                                            </div>
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                                isStaged ? 'bg-emerald-500 text-black' : 'bg-djzinc-800 text-gray-400'
                                            }`}>
                                                {isStaged ? '✓ Seleccionada' : '+ Añadir'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}
                </div>

                {/* 5. Footer con Botones de Confirmación y Cesta */}
                <div className="p-3.5 bg-djzinc-950 border-t border-djzinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-2">
                        {totalStaged > 0 ? (
                            <button
                                type="button"
                                onClick={() => { setStagedFolders([]); setStagedFiles([]); }}
                                className="px-2.5 py-1 text-gray-400 hover:text-red-400 text-xs font-mono cursor-pointer"
                            >
                                Vaciar Cesta ({totalStaged})
                            </button>
                        ) : (
                            <span className="text-gray-500 text-[11px]">
                                Selecciona carpetas o pistas para carga múltiple o pulsa el botón directo.
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-2 bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 rounded-xl font-bold cursor-pointer transition-all"
                        >
                            Cancelar
                        </button>

                        {totalStaged > 0 ? (
                            <button
                                type="button"
                                onClick={handleConfirmSelection}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black rounded-xl font-black shadow-lg shadow-emerald-500/20 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                            >
                                <span>✓ Cargar Cesta ({totalStaged})</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleConfirmSelection}
                                className="px-4 py-2 bg-gradient-to-r from-djcyan-500 to-djcyan-400 hover:from-djcyan-400 hover:to-djcyan-300 text-black rounded-xl font-black shadow-lg shadow-djcyan-500/20 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                            >
                                <Icons.Folder size={14} />
                                <span>Cargar Esta Carpeta</span>
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
