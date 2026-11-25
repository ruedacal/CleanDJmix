import { FilterMenu } from '../shell/workspace-ui.jsx';
const { useState, useEffect, useRef, useMemo, useCallback } = React;
import { Icons } from '../shell/icons.jsx';
import { TableHarmonicWaveform, formatMsToTime, parseDurationMs } from '../waveforms/index.js';
import { DEFAULT_VINYL_SVG, getValidCover } from '../data/constants.js';
import { useDrawerResize } from '../shell/hooks.js';
import { CamelotKeyBadge, SectionTitle } from '../shell/workspace-ui.jsx';

// ─── PALETA Y CONSTANTES DE COLOR PARA CARPETAS Y CRATES ────────────────────
export const FOLDER_COLORS = [
    { id: 'cyan', name: 'Cian Neón', bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500', dot: 'bg-cyan-400' },
    { id: 'emerald', name: 'Verde Club', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500', dot: 'bg-emerald-400' },
    { id: 'purple', name: 'Púrpura Deep', bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500', dot: 'bg-purple-400' },
    { id: 'amber', name: 'Ámbar Warm', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500', dot: 'bg-amber-400' },
    { id: 'rose', name: 'Rosa Festival', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500', dot: 'bg-rose-400' },
    { id: 'blue', name: 'Azul Eléctrico', bg: 'bg-blue-500', text: 'text-cyan-400', border: 'border-blue-500', dot: 'bg-blue-400' },
    { id: 'indigo', name: 'Índigo Techno', bg: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500', dot: 'bg-indigo-400' },
    { id: 'orange', name: 'Naranja Sunset', bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500', dot: 'bg-orange-400' }
];

const getColorObj = (colorId) => FOLDER_COLORS.find(c => c.id === colorId) || FOLDER_COLORS[0];

const findFolderOrSub = (folders, targetId) => {
    if (!folders || !targetId) return null;
    for (const f of folders) {
        if (f.id === targetId) return { folder: f, parent: null };
        if (f.subfolders) {
            for (const s of f.subfolders) {
                if (s.id === targetId) return { folder: s, parent: f };
            }
        }
    }
    return null;
};

const getFolderTrackKeysSet = (folder) => {
    const keys = new Set();
    if (!folder) return keys;
    (folder.trackIds || []).forEach(k => keys.add(k));
    if (folder.subfolders) {
        folder.subfolders.forEach(sub => {
            (sub.trackIds || []).forEach(k => keys.add(k));
        });
    }
    return keys;
};

// ─── PANEL LATERAL DE CARPETAS Y CRATES DE BIBLIOTECA (AUDIT WORKSPACE) ───────
const LibraryFolderSidebar = ({
    folders = [],
    selectedFolderId = 'all',
    onSelectFolder,
    totalTracksCount = 0,
    onAddFolder,
    onAddSubfolder,
    onRenameFolder,
    onChangeFolderColor,
    onDeleteFolder,
    onToggleCollapse,
    onAssignTracks,
    onAutoGroupByGenre,
    onMaterializarEnDisco,
    onClose
}) => {
    const [editingFolderId, setEditingFolderId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [colorPickerFolderId, setColorPickerFolderId] = useState(null);
    const [newFolderNameInput, setNewFolderNameInput] = useState('');
    const [isAddingRoot, setIsAddingRoot] = useState(false);
    const [dragOverFolderId, setDragOverFolderId] = useState(null);
    const [draggedFolderId, setDraggedFolderId] = useState(null);

        const containsId = (fld, id) => {
            if (!fld) return false;
            if (fld.id === id) return true;
            return (fld.subfolders || []).some(s => containsId(s, id));
        };

        const updated = libraries.map(l => {
            if (l.id !== currentLib.id) return l;
            const rootFolders = l.folders || [];
            const sourceObj = (() => {
                const walk = (arr) => {
                    for (const item of (arr || [])) {
                        if (item.id === sourceFolderId) return item;
                        const hit = walk(item.subfolders);
                        if (hit) return hit;
                    }
                    return null;
                };
                return walk(rootFolders);
            })();
            if (!sourceObj || containsId(sourceObj, targetFolderId)) return l;

            if (shiftReorder) {
                const { extracted, remaining } = findAndExtract(rootFolders);
                if (!extracted) return l;
                const targetIdx = remaining.findIndex(f => f.id === targetFolderId);
                if (targetIdx === -1) {
                    return { ...l, folders: [...remaining, extracted] };
                }
                const reordered = [...remaining.slice(0, targetIdx), extracted, ...remaining.slice(targetIdx)];
                return { ...l, folders: reordered };
            } else {
                const { extracted, remaining } = findAndExtract(rootFolders);
                if (!extracted) return l;
                const nestInto = (arr) => (arr || []).map(fld => {
                    const nextSubs = fld.subfolders ? nestInto(fld.subfolders) : [];
                    if (fld.id === targetFolderId) {
                        const subs = [...nextSubs];
                        const existingIdx = subs.findIndex(s => s.id === extracted.id);
                        if (existingIdx >= 0) subs[existingIdx] = extracted;
                        else subs.push(extracted);
                        return { ...fld, subfolders: subs };
                    }
                    return { ...fld, subfolders: nextSubs };
                });
                return { ...l, folders: nestInto(remaining) };
            }
        });

        if (onSaveLibraries) onSaveLibraries(updated, currentLib.id);
        setFeedbackMsg(shiftReorder ? '✓ Carpeta reordenada' : '✓ Carpeta anidada como subcarpeta');
        setTimeout(() => setFeedbackMsg(''), 2500);
    

    const startEditing = (f, e) => {
        if (e) e.stopPropagation();
        setEditingFolderId(f.id);
        setEditingName(f.name);
    };

    const submitRename = (fId) => {
        if (editingName.trim()) {
            onRenameFolder(fId, editingName.trim());
        }
        setEditingFolderId(null);
    };

    const handleCreateRoot = (e) => {
        e.preventDefault();
        if (newFolderNameInput.trim()) {
            onAddFolder(newFolderNameInput.trim());
            setNewFolderNameInput('');
            setIsAddingRoot(false);
        }
    };


    return (
        <aside className="w-[270px] shrink-0 bg-[#09090f] border-r border-djzinc-800 flex flex-col h-full select-none text-xs font-mono z-10">
            {/* Cabecera del Panel */}
            <div className="p-3 border-b border-djzinc-800 flex items-center justify-between gap-2 bg-[#0c0d16]">
                <div className="flex items-center gap-1.5 min-w-0">
                    <Icons.Folder size={15} className="text-cyan-400 shrink-0" />
                    <span className="font-bold text-white tracking-wide truncate uppercase text-[11px]">Carpetas & Crates</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={onAutoGroupByGenre}
                        className="px-2 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 hover:text-white border border-cyan-700/80 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                        title="Auto-organizar automáticamente por Género y Subgénero"
                    >
                        <Icons.Zap size={11} className="text-amber-400" />
                        <span>Auto Género</span>
                    </button>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                            title="Ocultar panel de carpetas"
                        >
                            <Icons.ChevronLeft size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Raíz: Todas las Pistas */}
            <div className="p-2 border-b border-djzinc-800/80 bg-[#07070c]">
                <button
                    type="button"
                    onClick={() => onSelectFolder('all')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        selectedFolderId === 'all'
                            ? 'bg-cyan-950/90 text-cyan-200 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold'
                            : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                    }`}
                >
                    <div className="flex items-center gap-2 truncate">
                        <Icons.Music size={13} className={selectedFolderId === 'all' ? 'text-cyan-400' : 'text-zinc-400'} />
                        <span className="truncate">Todas las pistas</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300 font-bold border border-zinc-700">
                        {totalTracksCount}
                    </span>
                </button>
            </div>

            {/* Lista Jerárquica de Carpetas & Subcarpetas */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {folders.length === 0 ? (
                    <div className="py-8 text-center text-zinc-500 text-[11px] px-3">
                        <Icons.Folder size={24} className="mx-auto mb-2 opacity-40 text-cyan-400" />
                        <p className="mb-2">No hay carpetas creadas</p>
                        <button
                            type="button"
                            onClick={() => setIsAddingRoot(true)}
                            className="px-2.5 py-1 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-600/60 text-[10px] font-bold cursor-pointer"
                        >
                            + Crear primera carpeta
                        </button>
                    </div>
                ) : (
                    folders.map((f) => {
                        const color = getColorObj(f.color);
                        const isSelected = selectedFolderId === f.id;
                        const isDragTarget = dragOverFolderId === f.id;
                        const subCount = f.subfolders ? f.subfolders.length : 0;
                        const totalFolderTracks = getFolderTrackKeysSet(f).size;

                        return (
                            <div key={f.id} className="space-y-0.5">
                                {/* Fila Carpeta Padre */}
                                <div
                                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragOverFolderId(f.id); }}
                                    onDragLeave={() => setDragOverFolderId(null)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragOverFolderId(null);
                                        try {
                                            const data = e.dataTransfer.getData('text/plain');
                                            if (data) {
                                                const keys = JSON.parse(data);
                                                if (Array.isArray(keys)) onAssignTracks(f.id, keys);
                                            }
                                        } catch (_) {}
                                    }}
                                    onClick={() => onSelectFolder(f.id)}
                                    className={`group flex items-center justify-between px-2 py-1.5 rounded-lg transition-all cursor-pointer border ${
                                        isDragTarget
                                            ? 'bg-cyan-900/90 border-cyan-400 ring-2 ring-cyan-400'
                                            : isSelected
                                                ? 'bg-gradient-to-r from-zinc-850 to-zinc-900 border-cyan-500/60 text-white shadow-sm'
                                                : 'border-transparent hover:bg-zinc-850/60 text-zinc-300 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        {/* Botón Colapso si tiene subcarpetas */}
                                        {subCount > 0 ? (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); onToggleCollapse(f.id); }}
                                                className="p-0.5 text-zinc-400 hover:text-white"
                                            >
                                                <Icons.ChevronRight size={11} className={`transition-transform duration-200 ${f.collapsed ? '' : 'rotate-90'}`} />
                                            </button>
                                        ) : (
                                            <span className="w-3.5 inline-block" />
                                        )}

                                        {/* Dot de Color con Selector Popover */}
                                        <div className="relative shrink-0">
                                            <span
                                                onClick={(e) => { e.stopPropagation(); setColorPickerFolderId(colorPickerFolderId === f.id ? null : f.id); }}
                                                className={`w-2.5 h-2.5 rounded-full ${color.dot} inline-block cursor-pointer ring-1 ring-white/20 hover:scale-125 transition-transform`}
                                                title={`Color: ${color.name} (haz clic para cambiar)`}
                                            />
                                            {colorPickerFolderId === f.id && (
                                                <div 
                                                    onClick={(e) => e.stopPropagation()} 
                                                    className="absolute left-0 top-5 z-50 p-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl grid grid-cols-4 gap-1.5 w-32"
                                                >
                                                    {FOLDER_COLORS.map(c => (
                                                        <span
                                                            key={c.id}
                                                            onClick={() => { onChangeFolderColor(f.id, c.id); setColorPickerFolderId(null); }}
                                                            className={`w-5 h-5 rounded-full ${c.dot} cursor-pointer hover:scale-110 transition-transform ring-1 ring-white/30`}
                                                            title={c.name}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Nombre editable */}
                                        {editingFolderId === f.id ? (
                                            <input
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onBlur={() => submitRename(f.id)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') submitRename(f.id); if (e.key === 'Escape') setEditingFolderId(null); }}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                                className="bg-black border border-cyan-400 rounded px-1.5 py-0.5 text-xs text-white w-full font-mono outline-none"
                                            />
                                        ) : (
                                            <span 
                                                onDoubleClick={(e) => startEditing(f, e)}
                                                className="truncate font-bold text-[11px]" 
                                                title={`${f.name} (Doble clic para renombrar)`}
                                            >
                                                {f.name}
                                            </span>
                                        )}
                                    </div>

                                    {/* Insignia de conteo y botones de acción rápida */}
                                    <div className="flex items-center gap-1 shrink-0 ml-1">
                                        <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-400 font-bold group-hover:hidden">
                                            {totalFolderTracks}
                                        </span>
                                        <div className="hidden group-hover:flex items-center gap-0.5">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const subName = prompt(`Nueva subcarpeta dentro de "${f.name}":`);
                                                    if (subName && subName.trim()) onAddSubfolder(f.id, subName.trim());
                                                }}
                                                className="p-1 hover:text-cyan-300 text-zinc-400 rounded hover:bg-zinc-800"
                                                title="Añadir subcarpeta"
                                            >
                                                <Icons.Plus size={11} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => startEditing(f, e)}
                                                className="p-1 hover:text-amber-300 text-zinc-400 rounded hover:bg-zinc-800"
                                                title="Renombrar"
                                            >
                                                <Icons.Pencil size={11} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`¿Eliminar la carpeta "${f.name}"? Las pistas no se borrarán del disco.`)) {
                                                        onDeleteFolder(f.id);
                                                    }
                                                }}
                                                className="p-1 hover:text-red-400 text-zinc-400 rounded hover:bg-zinc-800"
                                                title="Eliminar carpeta"
                                            >
                                                <Icons.Trash size={11} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Subcarpetas (Hijos) */}
                                {!f.collapsed && f.subfolders && f.subfolders.map((sub) => {
                                    const subColor = getColorObj(sub.color || f.color);
                                    const isSubSelected = selectedFolderId === sub.id;
                                    const isSubDragTarget = dragOverFolderId === sub.id;
                                    const subTrackCount = (sub.trackIds || []).length;

                                    return (
                                        <div
                                            key={sub.id}
                                            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragOverFolderId(sub.id); }}
                                            onDragLeave={() => setDragOverFolderId(null)}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                setDragOverFolderId(null);
                                                try {
                                                    const data = e.dataTransfer.getData('text/plain');
                                                    if (data) {
                                                        const keys = JSON.parse(data);
                                                        if (Array.isArray(keys)) onAssignTracks(sub.id, keys);
                                                    }
                                                } catch (_) {}
                                            }}
                                            onClick={() => onSelectFolder(sub.id)}
                                            className={`group pl-6 pr-2 py-1 rounded-lg transition-all cursor-pointer flex items-center justify-between border ${
                                                isSubDragTarget
                                                    ? 'bg-cyan-900/90 border-cyan-400 ring-2 ring-cyan-400'
                                                    : isSubSelected
                                                        ? 'bg-zinc-800 border-cyan-500/50 text-white font-bold'
                                                        : 'border-transparent hover:bg-zinc-850/60 text-zinc-400 hover:text-zinc-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                <span className={`w-2 h-2 rounded-full ${subColor.dot} shrink-0`} />
                                                {editingFolderId === sub.id ? (
                                                    <input
                                                        type="text"
                                                        value={editingName}
                                                        onChange={(e) => setEditingName(e.target.value)}
                                                        onBlur={() => submitRename(sub.id)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') submitRename(sub.id); if (e.key === 'Escape') setEditingFolderId(null); }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        autoFocus
                                                        className="bg-black border border-cyan-400 rounded px-1 py-0.2 text-[11px] text-white w-full font-mono outline-none"
                                                    />
                                                ) : (
                                                    <span 
                                                        onDoubleClick={(e) => startEditing(sub, e)}
                                                        className="truncate text-[10.5px]" 
                                                        title={`${sub.name} (Doble clic para renombrar)`}
                                                    >
                                                        {sub.name}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0 ml-1">
                                                <span className="text-[9.5px] text-zinc-500 font-bold group-hover:hidden">
                                                    {subTrackCount}
                                                </span>
                                                <div className="hidden group-hover:flex items-center gap-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => startEditing(sub, e)}
                                                        className="p-0.5 hover:text-amber-300 text-zinc-400 rounded"
                                                        title="Renombrar subcarpeta"
                                                    >
                                                        <Icons.Pencil size={10} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm(`¿Eliminar la subcarpeta "${sub.name}"?`)) {
                                                                onDeleteFolder(sub.id);
                                                            }
                                                        }}
                                                        className="p-0.5 hover:text-red-400 text-zinc-400 rounded"
                                                        title="Eliminar subcarpeta"
                                                    >
                                                        <Icons.Trash size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })
                )}

                {/* Formulario rápido para crear carpeta raíz */}
                {isAddingRoot ? (
                    <form onSubmit={handleCreateRoot} className="pt-2">
                        <div className="flex items-center gap-1">
                            <input
                                type="text"
                                value={newFolderNameInput}
                                onChange={(e) => setNewFolderNameInput(e.target.value)}
                                placeholder="Nombre de carpeta..."
                                autoFocus
                                className="flex-1 bg-zinc-950 border border-cyan-500 rounded px-2 py-1 text-xs text-white font-mono outline-none"
                            />
                            <button
                                type="submit"
                                className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs cursor-pointer"
                            >
                                ✓
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAddingRoot(false)}
                                className="px-1.5 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white text-xs cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsAddingRoot(true)}
                        className="w-full mt-2 py-1 px-2 rounded-lg border border-dashed border-zinc-700 hover:border-cyan-500/80 text-zinc-400 hover:text-cyan-300 text-[10.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                        <Icons.Plus size={12} />
                        <span>Nueva Carpeta</span>
                    </button>
                )}
            </div>

            {/* Pie del Panel: Crear en Disco (Materializar) */}
            <div className="p-2.5 border-t border-djzinc-800 bg-[#07070c] shrink-0 space-y-2">
                <button
                    type="button"
                    onClick={onMaterializarEnDisco}
                    className="w-full py-2 px-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-black font-black text-[11px] shadow-md shadow-emerald-900/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    title="Crea una copia estructurada de tus carpetas en una unidad USB o disco local"
                >
                    <Icons.Save size={13} />
                    <span>Crear en Disco (Copia Física)</span>
                </button>
                <div className="text-[9.5px] text-zinc-500 text-center">
                    Arrastra pistas desde la tabla para organizarlas
                </div>
            </div>
        </aside>
    );
};
export const LibraryWorkspace = ({
    libraries = [],
    activeLibraryId,
    onSaveLibraries,
    onSelectLibrary,
    currentTracks = [],
    selectedTrackIds = new Set(),
    onMaterializarEnDisco,
    onAuditarCrate,
    onNavigateTab,
    onLoadFolderFromDisk,
    currentFolder = '',
    onPlayTrack,
    onTogglePlay,
    nowPlayingTrack,
    isPlaying,
    playProgress,
    setAuditTracks,
    setSelectedTrack
}) => {

    const getRowKey = (t, idx = 0) => t?.id || t?.file_path || t?.path || t?.f || t?.filename || idx;

    const handleRowSelectClick = (e, tr, rowIdx) => {
        const key = getRowKey(tr, rowIdx);
        const isCmd = Boolean(e.metaKey || e.ctrlKey);
        const isShift = Boolean(e.shiftKey);

        if (isShift && lastClickedRowIdx !== null && filteredTracks.length > 0) {
            const start = Math.max(0, Math.min(lastClickedRowIdx, rowIdx));
            const end = Math.min(filteredTracks.length - 1, Math.max(lastClickedRowIdx, rowIdx));
            setSelectedTrackKeys(prev => {
                const next = new Set(isCmd ? prev : []);
                for (let i = start; i <= end; i++) {
                    next.add(getRowKey(filteredTracks[i], i));
                }
                return next;
            });
            return;
        }

        if (isCmd) {
            setSelectedTrackKeys(prev => {
                const next = new Set(prev);
                if (next.has(key)) next.delete(key);
                else next.add(key);
                return next;
            });
            setLastClickedRowIdx(rowIdx);
            return;
        }

        setSelectedTrackKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
        setLastClickedRowIdx(rowIdx);
    };

    const handleRenameFolderCommit = (folderId) => {
        const trimmed = String(editingFolderName || '').trim();
        setEditingFolderId(null);
        if (!trimmed) return;
        const renameRecursive = (list) => (list || []).map(fld => ({
            ...fld,
            name: fld.id === folderId ? trimmed : fld.name,
            subfolders: fld.subfolders ? renameRecursive(fld.subfolders) : []
        }));
        const updated = libraries.map(l => l.id === currentLib.id ? { ...l, folders: renameRecursive(l.folders) } : l);
        if (onSaveLibraries) onSaveLibraries(updated, currentLib.id);
    };

    const handleDropMultipleTracksIntoFolder = (targetFolderId, draggedTrack) => {
        if (!targetFolderId) return;
        const draggedKey = draggedTrack ? (draggedTrack.id || draggedTrack.file_path || draggedTrack.path || draggedTrack.f || draggedTrack.filename) : null;
        const useSelection = draggedKey && selectedTrackKeys && selectedTrackKeys.has(draggedKey) && selectedTrackKeys.size > 1;

        const payloadTracks = useSelection
            ? filteredTracks.filter((t, idx) => selectedTrackKeys.has(getRowKey(t, idx)))
            : (draggedTrack ? [draggedTrack] : []);

        if (payloadTracks.length === 0) return;

        const addToTarget = (list) => (list || []).map(fld => {
            const nextSub = fld.subfolders ? addToTarget(fld.subfolders) : [];
            if (fld.id !== targetFolderId) return { ...fld, subfolders: nextSub };
            const existing = new Set((fld.tracks || []).map(t => t.id || t.file_path || t.path || t.f || t.filename));
            const fresh = payloadTracks.filter(t => {
                const k = t.id || t.file_path || t.path || t.f || t.filename;
                if (!k || existing.has(k)) return false;
                existing.add(k);
                return true;
            });
            return { ...fld, tracks: [...(fld.tracks || []), ...fresh], subfolders: nextSub };
        });

        const updated = libraries.map(l => l.id === currentLib.id ? { ...l, folders: addToTarget(l.folders) } : l);
        if (onSaveLibraries) onSaveLibraries(updated, currentLib.id);
        setFeedbackMsg(`✓ ${payloadTracks.length} pista(s) guardada(s) en carpeta`);
        setTimeout(() => setFeedbackMsg(''), 2500);
    };

    const handleFolderDropAction = (sourceFolderId, targetFolderId, shiftReorder = false) => {
        if (!sourceFolderId || !targetFolderId || sourceFolderId === targetFolderId) return;

        const findAndExtract = (list) => {
            let extracted = null;
            const remaining = [];
            for (const fld of (list || [])) {
                if (fld.id === sourceFolderId) {
                    extracted = fld;
                    continue;
                }
                const subRes = fld.subfolders ? findAndExtract(fld.subfolders) : { extracted: null, remaining: [] };
                if (subRes.extracted) extracted = subRes.extracted;
                remaining.push({ ...fld, subfolders: subRes.remaining });
            }
            return { extracted, remaining };
        };

        const containsId = (fld, id) => {
            if (!fld) return false;
            if (fld.id === id) return true;
            return (fld.subfolders || []).some(s => containsId(s, id));
        };

        const updated = libraries.map(l => {
            if (l.id !== currentLib.id) return l;
            const rootFolders = l.folders || [];
            const sourceObj = (() => {
                const walk = (arr) => {
                    for (const item of (arr || [])) {
                        if (item.id === sourceFolderId) return item;
                        const hit = walk(item.subfolders);
                        if (hit) return hit;
                    }
                    return null;
                };
                return walk(rootFolders);
            })();
            if (!sourceObj || containsId(sourceObj, targetFolderId)) return l;

            if (shiftReorder) {
                const { extracted, remaining } = findAndExtract(rootFolders);
                if (!extracted) return l;
                const targetIdx = remaining.findIndex(f => f.id === targetFolderId);
                if (targetIdx === -1) {
                    return { ...l, folders: [...remaining, extracted] };
                }
                const reordered = [...remaining.slice(0, targetIdx), extracted, ...remaining.slice(targetIdx)];
                return { ...l, folders: reordered };
            } else {
                const { extracted, remaining } = findAndExtract(rootFolders);
                if (!extracted) return l;
                const nestInto = (arr) => (arr || []).map(fld => {
                    const nextSubs = fld.subfolders ? nestInto(fld.subfolders) : [];
                    if (fld.id === targetFolderId) {
                        const subs = [...nextSubs];
                        const existingIdx = subs.findIndex(s => s.id === extracted.id);
                        if (existingIdx >= 0) subs[existingIdx] = extracted;
                        else subs.push(extracted);
                        return { ...fld, subfolders: subs };
                    }
                    return { ...fld, subfolders: nextSubs };
                });
                return { ...l, folders: nestInto(remaining) };
            }
        });

        if (onSaveLibraries) onSaveLibraries(updated, currentLib.id);
        setFeedbackMsg(shiftReorder ? '✓ Carpeta reordenada' : '✓ Carpeta anidada como subcarpeta');
        setTimeout(() => setFeedbackMsg(''), 2500);
    };


    const [editingFolderId, setEditingFolderId] = useState(null);
    const [editingFolderName, setEditingFolderName] = useState('');
    const [draggedFolderId, setDraggedFolderId] = useState(null);
    const [collapsedTrackFolders, setCollapsedTrackFolders] = useState({});
    const [lastClickedRowIdx, setLastClickedRowIdx] = useState(null);

    const [activeLibId, setActiveLibId] = useState(activeLibraryId || (libraries[0] && libraries[0].id) || 'lib_default');
    const [libNameInput, setLibNameInput] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState('__ALL__');
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [searchTrack, setSearchTrack] = useState('');
    const [tableFilter, setTableFilter] = useState('all');
    const [colFilters, setColFilters] = useState({
        file: '',
        artist: '',
        genre: '',
        format: 'ALL',
        bpm: '',
        key: '',
        energy: '',
        dance: '',
        intensity: ''
    });
    const [sortConfig, setSortConfig] = useState({ key: null, dir: 'asc' });

    const hasActiveColFilters = Object.entries(colFilters).some(([k, v]) => k === 'format' ? v !== 'ALL' : Boolean(String(v).trim()));
    const resetColFilters = () => setColFilters({ file: '', artist: '', genre: '', format: 'ALL', bpm: '', key: '', energy: '', dance: '', intensity: '' });
    const toggleSort = (key) => setSortConfig(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
    const [dragOverFolderId, setDragOverFolderId] = useState(null);

    // Selección múltiple para acciones por lote en la colección
    const [selectedTrackKeys, setSelectedTrackKeys] = useState(new Set());

    // Navegador de archivos integrado multi-carpeta / multi-pista
    const [fsBrowserOpen, setFsBrowserOpen] = useState(false);
    const [fsCurrentPath, setFsCurrentPath] = useState('/Users/admin/Music');
    const [fsParentPath, setFsParentPath] = useState('/Users/admin');
    const [fsFolders, setFsFolders] = useState([]);
    const [fsFiles, setFsFiles] = useState([]);
    const [stagedFolders, setStagedFolders] = useState([]);
    const [stagedFiles, setStagedFiles] = useState([]);
    const [fsActiveTab, setFsActiveTab] = useState('folders');
    const [fsLoading, setFsLoading] = useState(false);

    // Ancho interactivo redimensionable de la columna de carpetas (con persistencia en localStorage)
    const [leftColWidth, setLeftColWidth] = useState(() => {
        try {
            const saved = localStorage.getItem('bw_library_col_width');
            return saved ? Math.max(260, Math.min(680, parseInt(saved, 10))) : 360;
        } catch (e) {
            return 360;
        }
    });
    const [isResizing, setIsResizing] = useState(false);

    const handleSplitterPointerDown = (e) => {
        e.preventDefault();
        setIsResizing(true);
        const startX = e.clientX;
        const startWidth = leftColWidth;

        const onPointerMove = (moveEvt) => {
            const deltaX = moveEvt.clientX - startX;
            const newW = Math.max(260, Math.min(680, startWidth + deltaX));
            setLeftColWidth(newW);
        };

        const onPointerUp = (upEvt) => {
            setIsResizing(false);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            const finalDelta = upEvt.clientX - startX;
            const finalW = Math.max(260, Math.min(680, startWidth + finalDelta));
            try {
                localStorage.setItem('bw_library_col_width', String(finalW));
            } catch (err) {}
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    };

    const currentLib = libraries.find(l => l.id === activeLibId) || libraries[0] || {
        id: 'lib_default',
        name: 'Mi Biblioteca Principal',
        tracks: [],
        folders: []
    };

    // Sincronizar activeLibId cuando cambie la prop activeLibraryId o se hidrate libraries
    useEffect(() => {
        if (activeLibraryId && libraries.some(l => l.id === activeLibraryId)) {
            if (activeLibId !== activeLibraryId) {
                setActiveLibId(activeLibraryId);
                setSelectedFolderId('__ALL__');
            }
        } else if (libraries.length > 0 && !libraries.some(l => l.id === activeLibId)) {
            setActiveLibId(libraries[0].id);
            setSelectedFolderId('__ALL__');
        }
    }, [activeLibraryId, libraries]);

    useEffect(() => {
        if (currentLib) {
            setLibNameInput(currentLib.name || '');
        }
    }, [currentLib?.id, currentLib?.name]);

    // Limpiar selección de tracks al cambiar de carpeta o librería
    useEffect(() => {
        setSelectedTrackKeys(new Set());
    }, [selectedFolderId, activeLibId]);

    // Crear nueva biblioteca en blanco (sin carpetas precreadas)
    const handleCreateNewLibrary = () => {
        const newId = `lib_${Date.now()}`;
        const newLib = {
            id: newId,
            name: `Nueva Biblioteca ${libraries.length + 1}`,
            createdAt: new Date().toISOString(),
            tracks: [],
            folders: []
        };
        const updated = [...libraries, newLib];
        if (onSaveLibraries) onSaveLibraries(updated, newId);
        setActiveLibId(newId);
        setSelectedFolderId('__ALL__');
        setFeedbackMsg('✓ Nueva biblioteca en blanco creada');
        setTimeout(() => setFeedbackMsg(''), 2500);
    };

    // Renombrar biblioteca
    const handleUpdateLibraryName = () => {
        if (!libNameInput.trim()) return;
        const updated = libraries.map(l => l.id === activeLibId ? { ...l, name: libNameInput.trim() } : l);
        if (onSaveLibraries) onSaveLibraries(updated, activeLibId);
        setFeedbackMsg(`✓ Nombre actualizado: ${libNameInput.trim()}`);
        setTimeout(() => setFeedbackMsg(''), 2500);
    };

    // Añadir carpeta virtual
    const handleAddFolder = () => {
        if (!newFolderName.trim()) return;
        const newF = {
            id: `f_${Date.now()}`,
            name: newFolderName.trim(),
            tracks: []
        };
        const updated = libraries.map(l => {
            if (l.id === activeLibId) {
                return { ...l, folders: [...(l.folders || []), newF] };
            }
            return l;
        });
        if (onSaveLibraries) onSaveLibraries(updated, activeLibId);
        setNewFolderName('');
        setSelectedFolderId(newF.id);
        setFeedbackMsg(`✓ Carpeta virtual "${newF.name}" creada`);
        setTimeout(() => setFeedbackMsg(''), 2500);
    };

    // Eliminar carpeta
    const handleDeleteFolder = (folderId) => {
        const updated = libraries.map(l => {
            if (l.id === activeLibId) {
                return { ...l, folders: (l.folders || []).filter(f => f.id !== folderId) };
            }
            return l;
        });
        if (onSaveLibraries) onSaveLibraries(updated, activeLibId);
        if (selectedFolderId === folderId) {
            setSelectedFolderId('__ALL__');
        }
    };

    // Vaciar carpeta activa (quitar todas las pistas de la carpeta seleccionada)
    const handleEmptyActiveFolder = () => {
        const f = (currentLib.folders || []).find(x => x.id === selectedFolderId);
        if (!f) return;
        const trackCount = (f.tracks || []).length;
        if (trackCount === 0) {
            alert(`La carpeta "${f.name}" ya está vacía.`);
            return;
        }
        if (!window.confirm(`¿Estás seguro de que deseas vaciar las ${trackCount} pista(s) de la carpeta "${f.name}"? (Permanecerán en la colección general)`)) {
            return;
        }
        const updated = libraries.map(l => {
            if (l.id === activeLibId) {
                return {
                    ...l,
                    folders: (l.folders || []).map(folder => folder.id === selectedFolderId ? { ...folder, tracks: [] } : folder)
                };
            }
            return l;
        });
        if (onSaveLibraries) onSaveLibraries(updated, activeLibId);
        setSelectedTrackKeys(new Set());
        setFeedbackMsg(`✓ Carpeta "${f.name}" vaciada`);
        setTimeout(() => setFeedbackMsg(''), 2500);
    };

    // Vaciar colección completa (quitar todas las pistas y carpetas)
    const handleEmptyEntireLibrary = () => {
        const total = allLibTracks.length;
        if (total === 0 && (!currentLib.folders || currentLib.folders.length === 0)) {
            alert(`La colección "${currentLib.name}" ya está vacía.`);
            return;
        }
        if (!window.confirm(`¿Estás seguro de que deseas VACIAR TODA la colección "${currentLib.name}"?\nSe eliminarán todas sus ${total} pista(s) y ${currentLib.folders?.length || 0} carpeta(s).`)) {
            return;
        }
        const updated = libraries.map(l => {
            if (l.id === activeLibId) {
                return { ...l, tracks: [], folders: [] };
            }
            return l;
        });
        if (onSaveLibraries) onSaveLibraries(updated, activeLibId);
        setSelectedFolderId('__ALL__');
        setSelectedTrackKeys(new Set());
        setFeedbackMsg(`✓ Colección "${currentLib.name}" vaciada por completo`);
        setTimeout(() => setFeedbackMsg(''), 3000);
    };

    // Importar lo que esté en Auditoría a esta Colección
    const handleCargarDesdeAuditoria = () => {
        const sourceTracks = currentTracks || [];
        if (sourceTracks.length === 0) {
            alert("No hay pistas cargadas en la Mesa de Auditoría para importar.");
            return;
        }

        const updated = libraries.map(l => {
            if (l.id === activeLibId) {
                const existing = new Set((l.tracks || []).map(t => t.id || t.path || t.file_path || t.f));
                let count = 0;
                const newRoot = [...(l.tracks || [])];
                sourceTracks.forEach(t => {
                    const k = t.id || t.path || t.file_path || t.f;
                    if (!existing.has(k)) {
                        existing.add(k);
                        newRoot.push(t);
                        count++;
                    }
                });

                let newFolders = l.folders || [];
                if (selectedFolderId && selectedFolderId !== '__ALL__') {
                    newFolders = newFolders.map(f => {
                        if (f.id === selectedFolderId) {
                            const fExisting = new Set((f.tracks || []).map(t => t.id || t.path || t.file_path || t.f));
                            const fAdded = sourceTracks.filter(t => !fExisting.has(t.id || t.path || t.file_path || t.f));
                            return { ...f, tracks: [...(f.tracks || []), ...fAdded] };
                        }
                        return f;
                    });
                }
                return { ...l, tracks: newRoot, folders: newFolders };
            }
            return l;
        });

        if (onSaveLibraries) onSaveLibraries(updated, activeLibId);
        setFeedbackMsg(`✓ ${sourceTracks.length} pista(s) sincronizadas desde Auditoría`);
        setTimeout(() => setFeedbackMsg(''), 3000);
    };

    // Asignar pistas actuales o seleccionadas a la carpeta seleccionada
    const handleAssignTracksToActiveFolder = (folderId, onlySelected = false) => {
        const tracksToAssign = onlySelected 
            ? (currentTracks || []).filter(t => selectedTrackIds.has(t.id))
            : (currentTracks || []);

        if (tracksToAssign.length === 0) {
            alert("No hay pistas cargadas para asignar.");
            return;
        }

        const updated = libraries.map(l => {
            if (l.id === activeLibId) {
                const newFolders = (l.folders || []).map(f => {
                    if (f.id === folderId) {
                        const existingIds = new Set((f.tracks || []).map(t => t.id || t.file_path || t.path));
                        const added = tracksToAssign.filter(t => !existingIds.has(t.id || t.file_path || t.path));
                        return { ...f, tracks: [...(f.tracks || []), ...added] };
                    }
                    return f;
                });
                return { ...l, folders: newFolders };
            }
            return l;
        });
        if (onSaveLibraries) onSaveLibraries(updated, activeLibId);
        setFeedbackMsg(`✓ ${tracksToAssign.length} pista(s) asignadas`);
        setTimeout(() => setFeedbackMsg(''), 3000);
    };

    // Asignar pista individual arrastrada a una carpeta vía Drag & Drop
    const handleDropTrackIntoFolder = (folderId, trackData) => {
        if (!trackData) return;
        const trackKey = trackData.id || trackData.file_path || trackData.path || trackData.filename;
        const updated = libraries.map(l => {
            if (l.id === activeLibId) {
                const newFolders = (l.folders || []).map(f => {
                    if (f.id === folderId) {
                        const existingIds = new Set((f.tracks || []).map(t => t.id || t.file_path || t.path || t.filename));
                        if (!existingIds.has(trackKey)) {
                            return { ...f, tracks: [...(f.tracks || []), trackData] };
                        }
                    }
                    return f;
                });
                return { ...l, folders: newFolders };
            }
            return l;
        });
        if (onSaveLibraries) onSaveLibraries(updated, activeLibId);
        setFeedbackMsg(`✓ Pista agregada a la carpeta`);
        setTimeout(() => setFeedbackMsg(''), 2500);
    };

    // Auto-organizar por Género (crea carpetas y reparte pistas automáticamente con motor BeatWave)
    const handleAutoGroupByGenre = () => {
        const pool = allLibTracks.length > 0 ? allLibTracks : (currentTracks || []);
        if (pool.length === 0) {
            alert("Carga pistas en la colección para auto-organizar por género.");
            return;
        }
        const byGenre = {};
        pool.forEach(t => {
            const rawBpm = parseFloat(t.bpm || t.b) || 126.0;
            const rawEnergy = t.energy !== undefined ? (parseFloat(t.energy) > 1.0 ? parseFloat(t.energy) / 100.0 : parseFloat(t.energy)) : 0.65;
            const rawIntensity = t.intensity !== undefined ? parseFloat(t.intensity) : (rawEnergy * 0.7 + 0.25);
            const rawAtmo = t.atmosphere !== undefined ? parseFloat(t.atmosphere) : 0.50;
            const camelot = t.camelot_key || t.key || t.k || "8A";

            let classified = null;
            try {
                if (typeof classifyTrackGenre === 'function') {
                    classified = classifyTrackGenre({
                        bpm: rawBpm,
                        energy: rawEnergy,
                        intensity: rawIntensity,
                        atmosphere: rawAtmo,
                        camelotKey: camelot
                    });
                }
            } catch (err) {
                console.warn("[AutoGenre] Fallback a metadata ID3:", err);
            }

            let g = String(t.genre || t.subgenre || '').trim();
            const genericGenres = ['electronic', 'electrónica', 'dance', 'club', 'pop', 'other', 'unknown', 'desconocido', 'electrónica general'];
            const isHardRule = String(classified?.ruleApplied || '').startsWith("HARD_RULE");
            if ((!g || genericGenres.includes(g.toLowerCase()) || isHardRule) && classified?.canonicalGenre) {
                g = classified.canonicalGenre;
            }
            if (!g) g = 'Sin Género';

            if (!byGenre[g]) byGenre[g] = [];
            byGenre[g].push(t);
        });

        const baseTs = Date.now();
        const newFolders = Object.entries(byGenre)
            .sort((a, b) => b[1].length - a[1].length)
            .map(([genreName, trList], idx) => ({
                id: `f_auto_${idx}_${baseTs}`,
                name: genreName,
                tracks: trList
            }));

        const targetId = currentLib.id;
        const existsInList = libraries.some(l => l.id === targetId);
        const updated = existsInList
            ? libraries.map(l => {
                if (l.id === targetId) {
                    return {
                        ...l,
                        tracks: (l.tracks && l.tracks.length > 0) ? l.tracks : pool,
                        folders: newFolders
                    };
                }
                return l;
            })
            : [...libraries, { ...currentLib, id: targetId, tracks: pool, folders: newFolders }];

        setActiveLibId(targetId);
        if (onSaveLibraries) onSaveLibraries(updated, targetId);
        if (newFolders.length > 0) setSelectedFolderId(newFolders[0].id);
        setFeedbackMsg(`✓ ${newFolders.length} carpetas generadas automáticamente por género (Motor BeatWave Neural)`);
        setTimeout(() => setFeedbackMsg(''), 3500);
    };

    // Quitar pista de carpeta o de la colección raíz
    const handleRemoveTrack = (trackKey) => {
        const updated = libraries.map(l => {
            if (l.id === activeLibId) {
                const newTracks = (l.tracks || []).filter(t => (t.id || t.file_path || t.path) !== trackKey);
                const newFolders = (l.folders || []).map(f => {
                    if (selectedFolderId !== '__ALL__' && f.id === selectedFolderId) {
                        return { ...f, tracks: (f.tracks || []).filter(t => (t.id || t.file_path || t.path) !== trackKey) };
                    }
                    return f;
                });
                return { ...l, tracks: newTracks, folders: newFolders };
            }
            return l;
        });
        if (onSaveLibraries) onSaveLibraries(updated, activeLibId);
        setSelectedTrackKeys(prev => {
            const next = new Set(prev);
            next.delete(trackKey);
            return next;
        });
    };

    // ─── ACCIONES POR LOTE (SELECCIÓN MÚLTIPLE DE PISTAS) ───
    const handleToggleSelectAll = () => {
        if (filteredTracks.length === 0) return;
        const allKeys = filteredTracks.map(t => t.id || t.file_path || t.path || t.f);
        const allSelected = allKeys.every(k => selectedTrackKeys.has(k));
        if (allSelected) {
            setSelectedTrackKeys(new Set());
        } else {
            setSelectedTrackKeys(new Set(allKeys));
        }
    };

    const handleToggleSelectTrack = (trackKey, e) => {
        e.stopPropagation();
        setSelectedTrackKeys(prev => {
            const next = new Set(prev);
            if (next.has(trackKey)) {
                next.delete(trackKey);
            } else {
                next.add(trackKey);
            }
            return next;
        });
    };

    // Asignar pistas seleccionadas por lote a una carpeta
    const handleBatchAssignToFolder = (targetFolderId) => {
        if (selectedTrackKeys.size === 0 || !targetFolderId) return;
        const tracksToAssign = displayedTracks.filter(t => selectedTrackKeys.has(t.id || t.file_path || t.path || t.f));
        const targetFolderName = (currentLib.folders || []).find(f => f.id === targetFolderId)?.name || 'Carpeta';

        const updated = libraries.map(l => {
            if (l.id === activeLibId) {
                const newFolders = (l.folders || []).map(f => {
                    if (f.id === targetFolderId) {
                        const existingIds = new Set((f.tracks || []).map(t => t.id || t.file_path || t.path || t.f));
                        const added = tracksToAssign.filter(t => !existingIds.has(t.id || t.file_path || t.path || t.f));
                        return { ...f, tracks: [...(f.tracks || []), ...added] };
                    }
                    return f;
                });
                return { ...l, folders: newFolders };
            }
            return l;
        });
        if (onSaveLibraries) onSaveLibraries(updated, activeLibId);
        setFeedbackMsg(`✓ ${tracksToAssign.length} pista(s) asignadas a "${targetFolderName}"`);
        setTimeout(() => setFeedbackMsg(''), 2500);
        setSelectedTrackKeys(new Set());
    };

    // Sacar de la carpeta actual las pistas seleccionadas por lote (sin borrarlas de la colección)
    const handleBatchRemoveFromActiveFolder = () => {
        if (selectedFolderId === '__ALL__' || selectedTrackKeys.size === 0) return;
        const f = (currentLib.folders || []).find(x => x.id === selectedFolderId);
        if (!f) return;

        const count = selectedTrackKeys.size;
        const updated = libraries.map(l => {
            if (l.id === activeLibId) {
                return {
                    ...l,
                    folders: (l.folders || []).map(folder => {
                        if (folder.id === selectedFolderId) {
                            return {
                                ...folder,
                                tracks: (folder.tracks || []).filter(t => !selectedTrackKeys.has(t.id || t.file_path || t.path || t.f))
                            };
                        }
                        return folder;
                    })
                };
            }
            return l;
        });
        if (onSaveLibraries) onSaveLibraries(updated, activeLibId);
        setSelectedTrackKeys(new Set());
        setFeedbackMsg(`✓ ${count} pista(s) sacadas de "${f.name}"`);
        setTimeout(() => setFeedbackMsg(''), 2500);
    };

    // Eliminar de la colección completa las pistas seleccionadas por lote
    const handleBatchDeleteFromLibrary = () => {
        if (selectedTrackKeys.size === 0) return;
        const count = selectedTrackKeys.size;
        if (!window.confirm(`¿Estás seguro de que deseas eliminar las ${count} pista(s) seleccionadas de toda la colección y sus carpetas?`)) {
            return;
        }

        const updated = libraries.map(l => {
            if (l.id === activeLibId) {
                const newRoot = (l.tracks || []).filter(t => !selectedTrackKeys.has(t.id || t.file_path || t.path || t.f));
                const newFolders = (l.folders || []).map(folder => ({
                    ...folder,
                    tracks: (folder.tracks || []).filter(t => !selectedTrackKeys.has(t.id || t.file_path || t.path || t.f))
                }));
                return { ...l, tracks: newRoot, folders: newFolders };
            }
            return l;
        });
        if (onSaveLibraries) onSaveLibraries(updated, activeLibId);
        setSelectedTrackKeys(new Set());
        setFeedbackMsg(`✓ ${count} pista(s) eliminadas de la colección`);
        setTimeout(() => setFeedbackMsg(''), 2500);
    };

    // ─── EXPLORADOR DE ARCHIVOS UNIVERSAL (N CARPETAS Y N PISTAS SUELTAS) ───
    const fetchDirListing = async (path) => {
        try {
            const r = await fetch('/api/listar_subcarpetas?ruta=' + encodeURIComponent(path || ''));
            if (r.ok) {
                const data = await r.json();
                if (data && (data.folders || data.files || data.current)) return data;
            }
        } catch (_) {}
        if (window.eel && window.eel.listar_subcarpetas_sistema) {
            try {
                const res = await window.eel.listar_subcarpetas_sistema(path)();
                if (res && (res.folders || res.files || res.current)) return res;
            } catch (_) {}
        }
        return null;
    };

    const handleAbrirNavegadorCarpetas = async (initialPath = "") => {
        setFsBrowserOpen(true);
        setFsLoading(true);
        const startPath = initialPath || currentFolder || "/Users/admin/Music";
        try {
            let res = await fetchDirListing(startPath);
            if (!res || (!res.folders?.length && !res.files?.length && !res.current)) {
                res = await fetchDirListing("/Users/admin/Music");
            }
            if (res) {
                setFsCurrentPath(res.current || "/Users/admin/Music");
                setFsParentPath(res.parent || "/Users/admin");
                setFsFolders(res.folders || []);
                setFsFiles(res.files || []);
            }
        } catch (err) {
            console.error("Error abriendo explorador:", err);
        } finally {
            setFsLoading(false);
        }
    };

    const handleNavegarACarpeta = async (targetPath) => {
        setFsLoading(true);
        try {
            const res = await fetchDirListing(targetPath);
            if (res) {
                setFsCurrentPath(res.current || targetPath);
                setFsParentPath(res.parent || "");
                setFsFolders(res.folders || []);
                setFsFiles(res.files || []);
            }
        } catch (err) {
            console.error("Error navegando:", err);
        } finally {
            setFsLoading(false);
        }
    };

    const toggleStageFolder = (folderPath) => {
        setStagedFolders(prev => prev.includes(folderPath) ? prev.filter(p => p !== folderPath) : [...prev, folderPath]);
    };

    const toggleStageFile = (filePath) => {
        setStagedFiles(prev => prev.includes(filePath) ? prev.filter(p => p !== filePath) : [...prev, filePath]);
    };

    const toggleStageAllCurrentFsFiles = () => {
        const currentPaths = (fsFiles || []).map(f => f.path);
        const allPresent = currentPaths.length > 0 && currentPaths.every(p => stagedFiles.includes(p));
        if (allPresent) {
            setStagedFiles(prev => prev.filter(p => !currentPaths.includes(p)));
        } else {
            setStagedFiles(prev => Array.from(new Set([...prev, ...currentPaths])));
        }
    };

    const clearStagedSelection = () => {
        setStagedFolders([]);
        setStagedFiles([]);
    };

    const handleConfirmarSeleccionLote = async () => {
        const combined = [...stagedFolders, ...stagedFiles];
        const targets = combined.length > 0 ? combined : [fsCurrentPath];
        setFsBrowserOpen(false);
        setFeedbackMsg(`Cargando ${targets.length} elemento(s)...`);

        try {
            const r = await fetch('/api/load_directory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paths: targets })
            });
            if (r.ok) {
                const res = await r.json();
                const rawTracks = (res && Array.isArray(res.tracks)) ? res.tracks : (Array.isArray(res) ? res : []);
                if (rawTracks.length > 0) {
                    if (setAuditTracks) setAuditTracks(rawTracks);
                    if (setSelectedTrack && rawTracks[0]) setSelectedTrack(rawTracks[0].id);

                    // Añadir a la colección activa
                    const updated = libraries.map(l => {
                        if (l.id === activeLibId) {
                            const existing = new Set((l.tracks || []).map(t => t.id || t.path || t.file_path || t.f));
                            const added = rawTracks.filter(t => !existing.has(t.id || t.path || t.file_path || t.f));
                            const newRoot = [...(l.tracks || []), ...added];
                            let newFolders = l.folders || [];
                            if (selectedFolderId && selectedFolderId !== '__ALL__') {
                                newFolders = newFolders.map(f => {
                                    if (f.id === selectedFolderId) {
                                        const fExisting = new Set((f.tracks || []).map(t => t.id || t.path || t.file_path || t.f));
                                        const fAdded = rawTracks.filter(t => !fExisting.has(t.id || t.path || t.file_path || t.f));
                                        return { ...f, tracks: [...(f.tracks || []), ...fAdded] };
                                    }
                                    return f;
                                });
                            }
                            return { ...l, tracks: newRoot, folders: newFolders };
                        }
                        return l;
                    });
                    if (onSaveLibraries) onSaveLibraries(updated, activeLibId);
                    setFeedbackMsg(`✓ ${rawTracks.length} pista(s) cargadas en tu Colección`);
                    setTimeout(() => setFeedbackMsg(''), 3000);
                } else {
                    setFeedbackMsg('No se encontraron pistas de audio compatibles.');
                    setTimeout(() => setFeedbackMsg(''), 3000);
                }
            }
        } catch (e) {
            console.error("Error al cargar archivos:", e);
            setFeedbackMsg('Error al comunicar con el motor de carga.');
            setTimeout(() => setFeedbackMsg(''), 3000);
        }
    };

    // Colección completa: pistas en raíz + pistas en todas las carpetas (sin duplicados)
    const allLibTracks = useMemo(() => {
        const map = new Map();
        (currentLib.tracks || []).forEach(t => {
            const k = t.id || t.path || t.file_path || t.f || t.filename;
            if (k) map.set(k, t);
        });
        (currentLib.folders || []).forEach(f => {
            (f.tracks || []).forEach(t => {
                const k = t.id || t.path || t.file_path || t.f || t.filename;
                if (k && !map.has(k)) map.set(k, t);
            });
        });
        return Array.from(map.values());
    }, [currentLib]);

    const activeFolder = (currentLib.folders || []).find(f => f.id === selectedFolderId);

    const displayedTracks = (selectedFolderId === '__ALL__' || !selectedFolderId || !activeFolder)
        ? (allLibTracks.length > 0 ? allLibTracks : (currentLib.tracks || []))
        : (activeFolder?.tracks || []);

    const _filterSourceTracks = displayedTracks;

    const matchesTableFilter = (t, filterId) => {
        if (!filterId || filterId === 'all') return true;
        const bpm = parseFloat(t.bpm || t.b || 0);
        const key = String(t.camelot_key || t.key || t.k || '').trim();
        const artist = String(t.artist || t.a || '').trim();
        const title = String(t.title || t.t || '').trim();
        const hasCover = Boolean(t.cover || t.has_cover || t.artwork);
        const cues = t.hot_cues || t.cues || t.cue_points || [];
        const fmt = String(t.format || t.ext || '').toUpperCase();
        const bitrate = parseFloat(t.bitrate || t.kbps || 0);
        const qStatus = String(t.quality_status || t.audit_status || t.quality || '').toLowerCase();
        const isFake = Boolean(t.is_fake || t.fake || qStatus.includes('fake') || qStatus.includes('bad') || qStatus.includes('mala') || (bitrate > 0 && bitrate < 256));
        const isLossless = ['FLAC', 'WAV', 'AIFF', 'ALAC'].some(x => fmt.includes(x));
        const isExcellent = !isFake && (isLossless || bitrate >= 320 || qStatus.includes('excel') || qStatus.includes('lossless'));
        const isTrimmed = Boolean(t.silence_trimmed || t.trimmed || t.silences_trimmed);
        const rawEnergy = parseFloat(t.energy ?? 0);
        const energyPct = rawEnergy > 1 ? rawEnergy : rawEnergy * 100;

        switch (filterId) {
            case 'missing': return !bpm || bpm <= 0 || !key || key === '-' || key === 'N/A';
            case 'missing_meta': return !artist || !title || artist.toLowerCase() === 'desconocido' || artist.toLowerCase() === 'unknown';
            case 'missing_cover': return !hasCover;
            case 'missing_cues': return !Array.isArray(cues) || cues.length === 0;
            case 'bad_quality': return isFake;
            case 'excellent_quality': return isExcellent;
            case 'silences_trimmed': return isTrimmed;
            case 'high_energy': return energyPct >= 75;
            default: return true;
        }
    };

    const filterCounts = useMemo(() => ({
        total: _filterSourceTracks.length,
        missing: _filterSourceTracks.filter(t => matchesTableFilter(t, 'missing')).length,
        missing_meta: _filterSourceTracks.filter(t => matchesTableFilter(t, 'missing_meta')).length,
        missing_cover: _filterSourceTracks.filter(t => matchesTableFilter(t, 'missing_cover')).length,
        missing_cues: _filterSourceTracks.filter(t => matchesTableFilter(t, 'missing_cues')).length,
        bad_quality: _filterSourceTracks.filter(t => matchesTableFilter(t, 'bad_quality')).length,
        excellent_quality: _filterSourceTracks.filter(t => matchesTableFilter(t, 'excellent_quality')).length,
        silences_trimmed: _filterSourceTracks.filter(t => matchesTableFilter(t, 'silences_trimmed')).length,
        high_energy: _filterSourceTracks.filter(t => matchesTableFilter(t, 'high_energy')).length,
    }), [_filterSourceTracks]);

    const filteredTracks = _filterSourceTracks.filter(t => {
        if (!matchesTableFilter(t, tableFilter)) return false;
        if (!searchTrack.trim()) return true;
        const q = searchTrack.toLowerCase();
        const title = (t.title || t.t || t.filename || t.f || '').toLowerCase();
        const artist = (t.artist || t.a || '').toLowerCase();
        const genre = (t.genre || t.subgenre || '').toLowerCase();
        return title.includes(q) || artist.includes(q) || genre.includes(q);
    }).filter(t => {
        const matchNum = (val, query) => {
            const q = String(query || '').trim();
            if (!q) return true;
            const n = parseFloat(val);
            if (isNaN(n)) return false;
            if (q.startsWith('>=')) return n >= parseFloat(q.slice(2));
            if (q.startsWith('<=')) return n <= parseFloat(q.slice(2));
            if (q.startsWith('>')) return n > parseFloat(q.slice(1));
            if (q.startsWith('<')) return n < parseFloat(q.slice(1));
            if (q.includes('-')) {
                const [a, b] = q.split('-').map(x => parseFloat(x.trim()));
                if (!isNaN(a) && !isNaN(b)) return n >= a && n <= b;
            }
            return String(Math.round(n)).includes(q) || String(val).includes(q);
        };

        if (colFilters.file.trim()) {
            const q = colFilters.file.trim().toLowerCase();
            const fStr = `${t.title || t.t || ''} ${t.filename || t.f || ''} ${t.path || ''}`.toLowerCase();
            if (!fStr.includes(q)) return false;
        }
        if (colFilters.artist.trim()) {
            const q = colFilters.artist.trim().toLowerCase();
            if (!String(t.artist || t.a || '').toLowerCase().includes(q)) return false;
        }
        if (colFilters.genre.trim()) {
            const q = colFilters.genre.trim().toLowerCase();
            const gStr = `${t.genre || ''} ${t.subgenre || ''}`.toLowerCase();
            if (!gStr.includes(q)) return false;
        }
        if (colFilters.format && colFilters.format !== 'ALL') {
            const fmt = String(t.format || (t.filename || t.f || t.path || '').split('.').pop() || '').toUpperCase();
            if (fmt !== colFilters.format) return false;
        }
        if (colFilters.bpm.trim() && !matchNum(t.bpm || t.b, colFilters.bpm)) return false;
        if (colFilters.key.trim()) {
            const q = colFilters.key.trim().toLowerCase();
            const kStr = String(t.key || t.k || t.camelot || t.camelot_key || '').toLowerCase();
            if (!kStr.includes(q)) return false;
        }
        const eVal = t.energy !== undefined ? Math.round(parseFloat(t.energy) > 1.0 ? parseFloat(t.energy) : parseFloat(t.energy) * 100) : (t.e ?? 80);
        const dVal = t.dance !== undefined ? Math.round(parseFloat(t.dance) > 1.0 ? parseFloat(t.dance) : parseFloat(t.dance) * 100) : (t.danceability ?? 80);
        const iVal = t.intensity !== undefined ? Math.round(parseFloat(t.intensity) > 1.0 ? parseFloat(t.intensity) : parseFloat(t.intensity) * 100) : (t.int ?? 75);
        if (colFilters.energy.trim() && !matchNum(eVal, colFilters.energy)) return false;
        if (colFilters.dance.trim() && !matchNum(dVal, colFilters.dance)) return false;
        if (colFilters.intensity.trim() && !matchNum(iVal, colFilters.intensity)) return false;
        return true;
    }).sort((a, b) => {
        if (!sortConfig.key) return 0;
        const dir = sortConfig.dir === 'asc' ? 1 : -1;
        const getVal = (t, k) => {
            switch (k) {
                case 'file': return String(t.title || t.t || t.filename || t.f || '').toLowerCase();
                case 'artist': return String(t.artist || t.a || '').toLowerCase();
                case 'genre': return String(t.genre || t.subgenre || '').toLowerCase();
                case 'format': return String(t.format || (t.filename || t.f || t.path || '').split('.').pop() || '').toUpperCase();
                case 'bpm': return parseFloat(t.bpm || t.b || 0);
                case 'key': return String(t.key || t.k || t.camelot || t.camelot_key || '').toLowerCase();
                case 'energy': return t.energy !== undefined ? (parseFloat(t.energy) > 1.0 ? parseFloat(t.energy) : parseFloat(t.energy) * 100) : (t.e || 0);
                case 'dance': return t.dance !== undefined ? (parseFloat(t.dance) > 1.0 ? parseFloat(t.dance) : parseFloat(t.dance) * 100) : (t.danceability || 0);
                case 'intensity': return t.intensity !== undefined ? (parseFloat(t.intensity) > 1.0 ? parseFloat(t.intensity) : parseFloat(t.intensity) * 100) : (t.int || 0);
                default: return '';
            }
        };
        const va = getVal(a, sortConfig.key);
        const vb = getVal(b, sortConfig.key);
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb)) * dir;
    });

    const availableFormats = useMemo(() => {
        const set = new Set();
        _filterSourceTracks.forEach(t => {
            const fmt = String(t.format || (t.filename || t.f || t.path || '').split('.').pop() || '').toUpperCase().trim();
            if (fmt && fmt.length <= 6) set.add(fmt);
        });
        return Array.from(set).sort();
    }, [_filterSourceTracks]);

    const totalTracksInLib = allLibTracks.length;

    return (
        <div className="w-full h-full flex flex-col bg-[#09090e] text-gray-200 select-none overflow-hidden font-sans">
            {/* Cabecera Principal de Página Corporativa — Idéntica en estilo, tipografía, recuadro y espaciado a Auditoría */}
            <div className="px-3.5 py-2 border-b border-djzinc-800 bg-[#09090f]/95 backdrop-blur flex items-center justify-between shrink-0 gap-3 z-20">
                <div className="flex items-center gap-3 shrink-0">
                    <SectionTitle icon={Icons.Library} title="Colección" accent="Biblioteca" badge={`${totalTracksInLib} PISTAS`} />
                </div>

                <div className="flex items-center gap-2">
                    {feedbackMsg && (
                        <span className="text-xs font-mono text-emerald-400 font-bold animate-pulse px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-700/60">
                            {feedbackMsg}
                        </span>
                    )}

                    {/* Botón para cargar pistas desde la Mesa de Auditoría */}
                    <button
                        type="button"
                        onClick={handleCargarDesdeAuditoria}
                        className="px-3 py-1.5 min-h-[34px] rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 hover:text-white flex items-center gap-2 font-mono text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                        title="Importar a esta colección las pistas que tienes cargadas actualmente en la Mesa de Auditoría"
                    >
                        <Icons.Download size={14} />
                        <span>Cargar desde Auditoría ({currentTracks?.length || 0})</span>
                    </button>

                    {/* Botón para cargar archivos o carpetas desde el ordenador */}
                    <button
                        type="button"
                        onClick={() => handleAbrirNavegadorCarpetas()}
                        className="px-3 py-1.5 min-h-[34px] rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 hover:text-white flex items-center gap-2 font-mono text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                        title="Seleccionar y cargar archivos sueltos o carpetas de música desde tu ordenador"
                    >
                        <Icons.Folder size={14} />
                        <span>Cargar desde Ordenador</span>
                    </button>
                </div>
            </div>

            {/* Barra de Selección y Nombre de Biblioteca */}
            <div className="px-3.5 py-2 border-b border-djzinc-800 bg-[#0c0d14] flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
                    <span className="text-[11px] font-mono uppercase font-bold text-gray-400">Biblioteca:</span>
                    <select
                        value={currentLib.id}
                        onChange={(e) => {
                            const id = e.target.value;
                            setActiveLibId(id);
                            setSelectedFolderId('__ALL__');
                            setSearchTrack('');
                            setSelectedTrackKeys(new Set());
                            if (onSelectLibrary) onSelectLibrary(id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-white font-bold outline-none focus:border-cyan-400"
                    >
                        {libraries.map(lib => (
                            <option key={lib.id} value={lib.id}>
                                {lib.name} ({lib.folders?.length || 0} carpetas)
                            </option>
                        ))}
                    </select>

                    <div className="flex items-center gap-1">
                        <input 
                            type="text"
                            value={libNameInput}
                            onChange={(e) => setLibNameInput(e.target.value)}
                            placeholder="Nombre de la biblioteca"
                            className="px-3 py-1 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-mono text-white outline-none focus:border-cyan-400 w-48"
                        />
                        <button
                            type="button"
                            onClick={handleUpdateLibraryName}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-200 text-xs font-mono font-bold cursor-pointer transition-colors"
                            title="Guardar nombre"
                        >
                            Guardar
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleEmptyEntireLibrary}
                        className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-950 text-red-300 border border-red-800/60 text-xs font-mono font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                        title="Vaciar por completo toda la colección activa (carpetas y pistas)"
                    >
                        <Icons.Trash size={13} className="inline-block" />
                        <span>Vaciar Colección</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleCreateNewLibrary}
                        className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/60 text-xs font-mono font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                        title="Crear una nueva biblioteca en blanco"
                    >
                        <Icons.Plus size={14} className="inline-block align-[-2px]" />
                        <span>Nueva Biblioteca</span>
                    </button>
                </div>
            </div>

            {/* Contenido Principal: Carpetas a la izquierda, Separador Redimensionable, y Tabla Simplificada de 10 Columnas */}
            <div style={{ display: 'flex', flexDirection: 'row', flex: 1, minHeight: 0, overflow: 'hidden' }} className="flex-1 min-h-0 flex flex-row overflow-hidden relative">
                
                {/* PANEL IZQUIERDO: Estructura de Carpetas */}
                <div 
                    style={{ 
                        width: `${leftColWidth}px`, 
                        minWidth: '260px', 
                        maxWidth: '680px', 
                        backgroundColor: '#080914', 
                        borderRight: '1px solid rgba(255, 255, 255, 0.08)' 
                    }} 
                    className="p-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar shrink-0 select-none"
                >
                    {/* Biblioteca Activa (raíz de la colección, siempre visible encima de Carpetas Creadas) */}
                    <div
                        onClick={() => setSelectedFolderId('__ALL__')}
                        style={{
                            backgroundColor: selectedFolderId === '__ALL__' ? 'rgba(39, 39, 42, 0.85)' : 'rgba(24, 24, 27, 0.55)'
                        }}
                        className={`p-3 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
                            selectedFolderId === '__ALL__' ? 'text-white shadow-md' : 'text-gray-300 hover:bg-zinc-800/70'
                        }`}
                        title={`Ver todas las pistas de ${currentLib.name || 'Mi Biblioteca Principal'}`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <Icons.Library size={18} className="text-cyan-400 shrink-0" />
                            <div className="min-w-0">
                                <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                                    Biblioteca Activa
                                </span>
                                <span className="text-xs font-mono font-bold text-white block truncate">
                                    {currentLib.name || 'Mi Biblioteca Principal'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono block">
                                    {totalTracksInLib} pista(s) · Colección completa
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                            <Icons.Folder size={14} className="inline-block align-[-2px]" />
                            <span>Carpetas Creadas ({currentLib.folders?.length || 0})</span>
                        </h4>
                        <button
                            type="button"
                            onClick={handleAutoGroupByGenre}
                            className="px-2 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-700/60 text-[10px] font-mono font-bold cursor-pointer transition-colors"
                            title="Crea carpetas automáticamente a partir de los géneros musicales de tus pistas cargadas"
                        >
                            <Icons.Zap size={14} className="inline-block align-[-2px]" /> Auto género
                        </button>
                    </div>

                    {/* Input para añadir nueva carpeta (el usuario debe crearlas él) */}
                    <div className="flex items-center gap-1.5">
                        <input 
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddFolder(); }}
                            placeholder="Nombre de nueva carpeta..."
                            className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-mono text-white placeholder-gray-500 outline-none focus:border-cyan-400"
                        />
                        <button
                            type="button"
                            onClick={handleAddFolder}
                            className="px-3 py-1.5 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black font-mono font-bold text-xs rounded-xl cursor-pointer active:scale-95 shadow-sm"
                        >
                            + Crear
                        </button>
                    </div>

                    {/* Lista de Carpetas creadas por el usuario */}
                    <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                        {(!currentLib.folders || currentLib.folders.length === 0) ? (
                            <div className="p-5 text-center text-gray-500 font-mono text-xs border border-dashed border-zinc-800 rounded-xl">
                                No hay carpetas creadas. Crea tu primera carpeta arriba o pulsa "Auto por Género".
                            </div>
                        ) : (
                            ((currentLib.folders || []).map(f => {
                                const renderFolderNode = (fld, depth = 0) => {
                                    const isSelected = selectedFolderId === fld.id;
                                    const isDropOver = dragOverFolderId === fld.id;
                                    const trCount = fld.tracks?.length || 0;
                                    const subs = fld.subfolders || [];

                                    return (
                                        <div key={fld.id} className={depth > 0 ? 'ml-3.5 pl-2 border-l border-cyan-500/25 space-y-1' : 'space-y-1'}>
                                            <div
                                                draggable={editingFolderId !== fld.id}
                                                onDragStart={(e) => {
                                                    setDraggedFolderId(fld.id);
                                                    e.dataTransfer.setData('application/x-bw-folder', fld.id);
                                                    e.dataTransfer.effectAllowed = 'copyMove';
                                                }}
                                                onDragEnd={() => {
                                                    setDraggedFolderId(null);
                                                    setDragOverFolderId(null);
                                                }}
                                                onClick={() => setSelectedFolderId(fld.id)}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    e.dataTransfer.dropEffect = draggedFolderId ? 'move' : 'copy';
                                                    if (dragOverFolderId !== fld.id) setDragOverFolderId(fld.id);
                                                }}
                                                onDragLeave={(e) => {
                                                    if (e.currentTarget.contains(e.relatedTarget)) return;
                                                    setDragOverFolderId(null);
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const shiftReorder = Boolean(e.shiftKey);
                                                    const folderSrcId = draggedFolderId || e.dataTransfer.getData('application/x-bw-folder');
                                                    setDragOverFolderId(null);
                                                    setDraggedFolderId(null);

                                                    if (folderSrcId && folderSrcId !== fld.id) {
                                                        handleFolderDropAction(folderSrcId, fld.id, shiftReorder);
                                                        return;
                                                    }
                                                    try {
                                                        const raw = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json');
                                                        if (raw) {
                                                            const trData = JSON.parse(raw);
                                                            handleDropMultipleTracksIntoFolder(fld.id, trData);
                                                        }
                                                    } catch (err) {}
                                                }}
                                                style={{
                                                    backgroundColor: isDropOver
                                                        ? 'rgba(6, 182, 212, 0.25)'
                                                        : (isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(24, 24, 27, 0.6)'),
                                                    borderColor: isDropOver
                                                        ? '#06b6d4'
                                                        : (isSelected ? 'rgba(6, 182, 212, 0.8)' : 'rgba(255, 255, 255, 0.08)'),
                                                    boxShadow: isDropOver ? '0 0 16px rgba(6, 182, 212, 0.45)' : undefined
                                                }}
                                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                                    isSelected ? 'text-white shadow-md' : 'text-gray-300 hover:border-zinc-600'
                                                }`}
                                                title="Arrastra pistas (o varias con Shift/Cmd) aquí, arrastra sobre otra carpeta para anidar o Shift+arrastra para reordenar"
                                            >
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCollapsedTrackFolders(prev => ({ ...prev, [fld.id]: !prev[fld.id] }));
                                                        }}
                                                        className="w-5 h-5 flex items-center justify-center rounded bg-zinc-900/80 hover:bg-cyan-500/20 text-[11px] font-mono text-cyan-400 border border-zinc-700/70 shrink-0 cursor-pointer transition-colors"
                                                        title={collapsedTrackFolders[fld.id] ? "Desplegar pistas" : "Ocultar pistas"}
                                                    >
                                                        {collapsedTrackFolders[fld.id] ? '▸' : '▾'}
                                                    </button>
                                                    <Icons.Folder size={15} className={`shrink-0 ${isDropOver || isSelected ? 'text-cyan-400' : 'text-cyan-500/70'}`} />
                                                    <div className="truncate flex-1" onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingFolderId(fld.id);
                                                        setEditingFolderName(fld.name || '');
                                                    }}>
                                                        {editingFolderId === fld.id ? (
                                                            <input
                                                                type="text"
                                                                autoFocus
                                                                value={editingFolderName}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) => setEditingFolderName(e.target.value)}
                                                                onBlur={() => handleRenameFolderCommit(fld.id)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') { e.preventDefault(); handleRenameFolderCommit(fld.id); }
                                                                    if (e.key === 'Escape') { setEditingFolderId(null); }
                                                                }}
                                                                className="w-full px-1.5 py-0.5 rounded bg-zinc-950 border border-cyan-400 text-xs font-mono text-white outline-none"
                                                            />
                                                        ) : (
                                                            <span className="text-xs font-mono font-bold block truncate">{fld.name}</span>
                                                        )}
                                                        <span className="text-[10px] text-gray-400 font-mono">{trCount} pista(s) asignadas</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingFolderId(fld.id);
                                                            setEditingFolderName(fld.name || '');
                                                        }}
                                                        className="px-1.5 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-cyan-300 text-[10px] font-mono border border-zinc-700/80 cursor-pointer"
                                                        title="Renombrar carpeta"
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            let libsToSave = libraries;
                                                            if (selectedTrackKeys && selectedTrackKeys.size > 0) {
                                                                const picked = filteredTracks.filter((t, idx) => selectedTrackKeys.has(getRowKey(t, idx)));
                                                                if (picked.length > 0) {
                                                                    const addPicked = (arr) => (arr || []).map(item => ({
                                                                        ...item,
                                                                        tracks: item.id === fld.id
                                                                            ? [...(item.tracks || []), ...picked.filter(pk => !(item.tracks || []).some(ex => getRowKey(ex) === getRowKey(pk)))]
                                                                            : (item.tracks || []),
                                                                        subfolders: item.subfolders ? addPicked(item.subfolders) : []
                                                                    }));
                                                                    libsToSave = libraries.map(l => l.id === currentLib.id ? { ...l, folders: addPicked(l.folders) } : l);
                                                                    setSelectedTrackKeys(new Set());
                                                                }
                                                            }
                                                            if (onSaveLibraries) onSaveLibraries(libsToSave, currentLib.id);
                                                            setFeedbackMsg(`✓ Carpeta "${fld.name}" guardada`);
                                                            setTimeout(() => setFeedbackMsg(''), 2500);
                                                        }}
                                                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-emerald-950 hover:text-emerald-300 text-gray-300 text-[10px] font-mono border border-zinc-700 hover:border-emerald-600/60 cursor-pointer transition-colors"
                                                        title="Guardar la información y pistas de esta carpeta"
                                                    >
                                                        Guardar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteFolder(fld.id)}
                                                        className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-950/40 text-xs cursor-pointer"
                                                        title="Eliminar carpeta"
                                                    >
                                                        <Icons.Close size={14} className="inline-block align-[-2px]" />
                                                    </button>
                                                </div>
                                            </div>
                                            {/* LISTADO INLINE DE PISTAS (COVER, TÍTULO, AUTOR) CON DRAG & DROP */}
                                            {!collapsedTrackFolders[fld.id] && (
                                                <div className="ml-3 pl-2 border-l border-zinc-800/90 space-y-1 py-1">
                                                    {(fld.tracks || []).length === 0 ? (
                                                        <div className="px-2 py-1 text-[10px] font-mono text-gray-500 italic">
                                                            Carpeta vacía
                                                        </div>
                                                    ) : (
                                                        (fld.tracks || []).map((trk, tIdx) => {
                                                            const coverUrl = getValidCover(
                                                                trk.cover || (trk.path ? `/cover?path=${encodeURIComponent(trk.path)}` : (trk.f ? `/cover?path=${encodeURIComponent(trk.f)}` : null))
                                                            );
                                                            return (
                                                                <div
                                                                    key={trk.id ?? `${fld.id}_tr_${tIdx}`}
                                                                    draggable={true}
                                                                    onDragStart={(e) => {
                                                                        e.stopPropagation();
                                                                        const payload = JSON.stringify(trk);
                                                                        e.dataTransfer.setData('text/plain', payload);
                                                                        e.dataTransfer.setData('application/json', payload);
                                                                        e.dataTransfer.effectAllowed = 'copyMove';
                                                                    }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedFolderId(fld.id);
                                                                        if (typeof setSelectedTrack === 'function') setSelectedTrack(trk.id);
                                                                        if (typeof onPlayTrack === 'function') onPlayTrack(trk, 0, false);
                                                                    }}
                                                                    className="px-2 py-1 rounded-lg bg-[#0d0d16] hover:bg-djcyan-950/40 border border-zinc-800/70 hover:border-cyan-500/50 flex items-center gap-2 cursor-grab active:cursor-grabbing transition-colors"
                                                                    title="Arrastra esta pista a otra carpeta o haz clic para seleccionarla"
                                                                >
                                                                    <img
                                                                        src={coverUrl}
                                                                        alt="Cover"
                                                                        onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }}
                                                                        className="w-7 h-7 rounded object-cover border border-djzinc-750 shrink-0 bg-black pointer-events-none"
                                                                    />
                                                                    <div className="min-w-0 flex-1 pointer-events-none">
                                                                        <div className="text-[11px] font-bold text-white truncate leading-tight">
                                                                            {trk.title || trk.t || trk.filename || 'Sin título'}
                                                                        </div>
                                                                        <div className="text-[10px] text-gray-400 truncate leading-tight mt-0.5">
                                                                            {trk.artist || trk.a || 'Artista Desconocido'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            )}
                                            {subs.map(sub => renderFolderNode(sub, depth + 1))}
                                        </div>
                                    );
                                };
                                return renderFolderNode(f, 0);
                            }))                        )}
                    </div>
                
                    {/* Botón Guardar Todo al final del listado de carpetas */}
                    <div className="pt-2 border-t border-white/10 shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                if (onSaveLibraries) onSaveLibraries(libraries, currentLib.id);
                                setFeedbackMsg('✓ Cambios y carpetas guardados');
                                setTimeout(() => setFeedbackMsg(''), 2500);
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-xs font-mono font-bold cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                            title="Guardar toda la biblioteca y la clasificación de carpetas"
                        >
                            <span>Guardar Todo</span>
                        </button>
                    </div>
                </div>

                {/* SEPARADOR INTERACTIVO DRAG-AND-DROP RESIZABLE */}
                <div
                    role="separator"
                    tabIndex={0}
                    aria-orientation="vertical"
                    aria-valuenow={leftColWidth}
                    title="Arrastra para cambiar el ancho de la columna de carpetas"
                    onPointerDown={handleSplitterPointerDown}
                    className={`w-1.5 hover:w-2 transition-all cursor-col-resize shrink-0 relative flex items-center justify-center select-none z-20 group ${
                        isResizing 
                            ? 'bg-cyan-500 shadow-[0_0_12px_#06b6d4] w-2' 
                            : 'bg-white/5 hover:bg-cyan-500/80 hover:shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                    }`}
                >
                    <div className="w-0.5 h-8 bg-zinc-600 rounded-full group-hover:bg-cyan-200 transition-colors"></div>
                </div>

                {/* PANEL DERECHO: TABLA SIMPLIFICADA DE 10 COLUMNAS EXACTAS */}
                <div style={{ flex: 1, backgroundColor: '#0a0b18', minWidth: 0, display: 'flex', flexDirection: 'column' }} className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
                    <div className="flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2.5">
                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                                <Icons.Music size={14} className="inline-block align-[-2px] text-cyan-400" />
                                <span>Pistas en: <span className="text-cyan-300 font-bold">{selectedFolderId === '__ALL__' ? 'Colección Completa' : (activeFolder?.name || 'Colección')}</span></span>
                            </h4>
                            <span className="text-[10px] font-mono text-gray-400">
                                ({filteredTracks.length} pista(s) visibles)
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {selectedFolderId !== '__ALL__' && activeFolder && (
                                <button
                                    type="button"
                                    onClick={handleEmptyActiveFolder}
                                    className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-950 border border-red-800/60 text-red-300 text-[11px] font-mono font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                                    title="Quitar todas las pistas de esta carpeta"
                                >
                                    <Icons.Trash size={12} />
                                    <span>Vaciar Carpeta</span>
                                </button>
                            )}
                            {selectedFolderId !== '__ALL__' && activeFolder && onAuditarCrate && (
                                <button
                                    type="button"
                                    onClick={() => onAuditarCrate(activeFolder, currentLib)}
                                    className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-[11px] font-mono font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                                    title="Filtrar la mesa de auditoría mostrando exclusivamente esta carpeta"
                                >
                                    <Icons.AuditEye size={13} />
                                    <span>Auditar en Mesa</span>
                                </button>
                            )}
                            {onNavigateTab && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (setAuditTracks && allLibTracks.length > 0) {
                                                setAuditTracks(allLibTracks);
                                            }
                                            onNavigateTab('audit');
                                        }}
                                        className="px-3 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-600/70 text-cyan-300 text-[11px] font-mono font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                                        title="Auditar las pistas de esta colección en la mesa de Auditoría"
                                    >
                                        <Icons.AuditEye size={13} />
                                        <span>Auditar</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (setAuditTracks && allLibTracks.length > 0) {
                                                setAuditTracks(allLibTracks);
                                            }
                                            onNavigateTab('map');
                                        }}
                                        className="px-3 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-600/70 text-cyan-300 text-[11px] font-mono font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                                        title="Ver compatibilidad armónica y energía en el Mapa 2D"
                                    >
                                        <Icons.Map size={13} />
                                        <span>Ver el Mapa</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Buscador de pistas */}
                    <div className="relative shrink-0">
                        <Icons.Search size={14} className="inline-block align-[-2px] absolute left-3 top-2.5 text-gray-500" />
                        <input 
                            type="text"
                            value={searchTrack}
                            onChange={(e) => setSearchTrack(e.target.value)}
                            placeholder="Buscar en la colección por título, artista o género..."
                            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder-gray-500 outline-none focus:border-cyan-400"
                        />
                    </div>

                    {/* BARRA FLOTANTE DE ACCIONES POR LOTE (MULTISELECCIÓN) */}
                    {selectedTrackKeys.size > 0 && (
                        <div className="bg-cyan-950/90 border border-cyan-500/60 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-lg shadow-cyan-950/50 animate-fadeIn shrink-0">
                            <div className="flex items-center gap-2 text-white">
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                <span className="font-bold">{selectedTrackKeys.size} pista(s) seleccionada(s)</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Mover / Asignar a carpeta */}
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-400 text-[11px]">Asignar a:</span>
                                    <select
                                        defaultValue=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                handleBatchAssignToFolder(e.target.value);
                                                e.target.value = "";
                                            }
                                        }}
                                        className="bg-zinc-900 border border-zinc-700 text-white rounded px-2 py-1 text-xs outline-none focus:border-cyan-400 cursor-pointer"
                                    >
                                        <option value="" disabled>Seleccionar carpeta...</option>
                                        {(currentLib.folders || []).map(f => (
                                            <option key={f.id} value={f.id}>📁 {f.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Sacar de esta carpeta si estamos en una carpeta específica */}
                                {selectedFolderId !== '__ALL__' && activeFolder && (
                                    <button
                                        type="button"
                                        onClick={handleBatchRemoveFromActiveFolder}
                                        className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/70 text-amber-300 font-bold rounded cursor-pointer transition-all"
                                        title="Quitar las pistas seleccionadas de esta carpeta sin borrarlas de la colección"
                                    >
                                        📤 Sacar de Carpeta
                                    </button>
                                )}

                                {/* Eliminar pistas seleccionadas de la colección completa */}
                                <button
                                    type="button"
                                    onClick={handleBatchDeleteFromLibrary}
                                    className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-600/70 text-red-300 font-bold rounded cursor-pointer transition-all"
                                    title="Eliminar las pistas seleccionadas de la colección y de todas sus carpetas"
                                >
                                    🗑️ Eliminar de Colección
                                </button>

                                {/* Deseleccionar */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedTrackKeys(new Set())}
                                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded cursor-pointer transition-colors"
                                >
                                    ✕ Deseleccionar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TABLA SIMPLIFICADA CON LAS 10 COLUMNAS EXACTAS (CON CHECKBOX DE SELECCIÓN Y FORMATO) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#09090f] border border-djzinc-800 rounded-xl overflow-x-auto">
                        {filteredTracks.length === 0 ? (
                            <div className="py-16 text-center text-gray-500 font-mono text-xs flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                                    <Icons.Library size={24} />
                                </div>
                                <div className="space-y-1">
                                    <strong className="text-white text-sm font-syne font-bold block">Colección Vacía</strong>
                                    <p className="text-xs text-gray-400 font-sans max-w-sm">
                                        Carga pistas desde tu ordenador o importa lo que tengas en la Mesa de Auditoría para gestionar tu biblioteca.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => handleAbrirNavegadorCarpetas()}
                                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black font-mono font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                                    >
                                        <Icons.Folder size={14} />
                                        <span>Cargar desde el ordenador</span>
                                    </button>
                                    {currentTracks && currentTracks.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleCargarDesdeAuditoria}
                                            className="px-3.5 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/70 text-cyan-300 hover:text-white font-mono font-bold text-xs shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                                        >
                                            <Icons.Download size={14} />
                                            <span>Cargar pistas de Auditoría ({currentTracks.length})</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                                <thead className="sticky top-0 z-10 bg-[#0d0f1e] border-b border-white/10 text-[11px] font-mono uppercase text-gray-400">
                                    <tr>
                                        <th className="py-2.5 px-2 w-10 text-center">
                                            <input 
                                                type="checkbox"
                                                checked={filteredTracks.length > 0 && filteredTracks.every(t => selectedTrackKeys.has(t.id || t.file_path || t.path || t.f))}
                                                onChange={handleToggleSelectAll}
                                                className="accent-cyan-500 cursor-pointer w-3.5 h-3.5 rounded"
                                                title="Seleccionar / deseleccionar todas las pistas visibles"
                                            />
                                        </th>
                                        <th className="py-2.5 px-3 w-28 text-center text-cyan-400 font-bold">Waveform</th>
                                        <th onClick={() => toggleSort('file')} className="py-2.5 px-3 min-w-[200px] cursor-pointer hover:text-white select-none">
                                            Archivo / Título <span className={sortConfig.key === 'file' ? 'text-cyan-400' : 'text-zinc-600'}>{sortConfig.key === 'file' ? (sortConfig.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
                                        </th>
                                        <th onClick={() => toggleSort('artist')} className="py-2.5 px-3 w-32 cursor-pointer hover:text-white select-none">
                                            Artista <span className={sortConfig.key === 'artist' ? 'text-cyan-400' : 'text-zinc-600'}>{sortConfig.key === 'artist' ? (sortConfig.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
                                        </th>
                                        <th onClick={() => toggleSort('genre')} className="py-2.5 px-2 text-center w-28 cursor-pointer hover:text-white select-none">
                                            Género <span className={sortConfig.key === 'genre' ? 'text-cyan-400' : 'text-zinc-600'}>{sortConfig.key === 'genre' ? (sortConfig.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
                                        </th>
                                        <th onClick={() => toggleSort('format')} className="py-2.5 px-2 text-center w-20 cursor-pointer hover:text-white select-none">
                                            Formato <span className={sortConfig.key === 'format' ? 'text-cyan-400' : 'text-zinc-600'}>{sortConfig.key === 'format' ? (sortConfig.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
                                        </th>
                                        <th onClick={() => toggleSort('bpm')} className="py-2.5 px-2 text-center w-20 cursor-pointer hover:text-white select-none">
                                            BPM <span className={sortConfig.key === 'bpm' ? 'text-cyan-400' : 'text-zinc-600'}>{sortConfig.key === 'bpm' ? (sortConfig.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
                                        </th>
                                        <th onClick={() => toggleSort('key')} className="py-2.5 px-2 text-center w-20 cursor-pointer hover:text-white select-none">
                                            Key <span className={sortConfig.key === 'key' ? 'text-cyan-400' : 'text-zinc-600'}>{sortConfig.key === 'key' ? (sortConfig.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
                                        </th>
                                        <th onClick={() => toggleSort('energy')} className="py-2.5 px-3 text-center w-28 cursor-pointer hover:text-white select-none">
                                            Energy <span className={sortConfig.key === 'energy' ? 'text-cyan-400' : 'text-zinc-600'}>{sortConfig.key === 'energy' ? (sortConfig.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
                                        </th>
                                        <th onClick={() => toggleSort('dance')} className="py-2.5 px-3 text-center w-28 cursor-pointer hover:text-white select-none">
                                            Dance <span className={sortConfig.key === 'dance' ? 'text-cyan-400' : 'text-zinc-600'}>{sortConfig.key === 'dance' ? (sortConfig.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
                                        </th>
                                        <th onClick={() => toggleSort('intensity')} className="py-2.5 px-3 text-center w-28 cursor-pointer hover:text-white select-none">
                                            Intensidad <span className={sortConfig.key === 'intensity' ? 'text-cyan-400' : 'text-zinc-600'}>{sortConfig.key === 'intensity' ? (sortConfig.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
                                        </th>
                                    </tr>
                                    <tr className="bg-[#090a12] border-t border-white/5 normal-case">
                                        <th className="py-1.5 px-1.5 text-center">
                                            {hasActiveColFilters ? (
                                                <button
                                                    type="button"
                                                    onClick={resetColFilters}
                                                    className="px-1.5 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-[9px] font-mono cursor-pointer"
                                                    title="Limpiar filtros de columna"
                                                >
                                                    ✕
                                                </button>
                                            ) : (
                                                <span className="text-[9px] font-mono text-zinc-500 font-normal">filtro</span>
                                            )}
                                        </th>
                                        <th className="py-1.5 px-2"></th>
                                        <th className="py-1.5 px-2">
                                            <input
                                                type="text"
                                                value={colFilters.file}
                                                onChange={(e) => setColFilters(prev => ({ ...prev, file: e.target.value }))}
                                                placeholder="Filtrar título/archivo..."
                                                className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 focus:border-cyan-400 text-[10px] font-mono text-white placeholder-zinc-600 outline-none"
                                            />
                                        </th>
                                        <th className="py-1.5 px-2">
                                            <input
                                                type="text"
                                                value={colFilters.artist}
                                                onChange={(e) => setColFilters(prev => ({ ...prev, artist: e.target.value }))}
                                                placeholder="Artista..."
                                                className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 focus:border-cyan-400 text-[10px] font-mono text-white placeholder-zinc-600 outline-none"
                                            />
                                        </th>
                                        <th className="py-1.5 px-1.5">
                                            <input
                                                type="text"
                                                value={colFilters.genre}
                                                onChange={(e) => setColFilters(prev => ({ ...prev, genre: e.target.value }))}
                                                placeholder="Género..."
                                                className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 focus:border-cyan-400 text-[10px] font-mono text-white placeholder-zinc-600 outline-none"
                                            />
                                        </th>
                                        <th className="py-1.5 px-1.5">
                                            <select
                                                value={colFilters.format}
                                                onChange={(e) => setColFilters(prev => ({ ...prev, format: e.target.value }))}
                                                className="w-full px-1.5 py-1 rounded bg-zinc-950 border border-zinc-800 focus:border-cyan-400 text-[10px] font-mono text-white outline-none cursor-pointer"
                                            >
                                                <option value="ALL">Todos</option>
                                                {availableFormats.map(fmt => (
                                                    <option key={fmt} value={fmt}>{fmt}</option>
                                                ))}
                                            </select>
                                        </th>
                                        <th className="py-1.5 px-1.5">
                                            <input
                                                type="text"
                                                value={colFilters.bpm}
                                                onChange={(e) => setColFilters(prev => ({ ...prev, bpm: e.target.value }))}
                                                placeholder="128..."
                                                title="Ej: 128, 126-132, >=135"
                                                className="w-full px-1.5 py-1 rounded bg-zinc-950 border border-zinc-800 focus:border-cyan-400 text-[10px] font-mono text-white placeholder-zinc-600 text-center outline-none"
                                            />
                                        </th>
                                        <th className="py-1.5 px-1.5">
                                            <input
                                                type="text"
                                                value={colFilters.key}
                                                onChange={(e) => setColFilters(prev => ({ ...prev, key: e.target.value }))}
                                                placeholder="8A..."
                                                className="w-full px-1.5 py-1 rounded bg-zinc-950 border border-zinc-800 focus:border-cyan-400 text-[10px] font-mono text-white placeholder-zinc-600 text-center outline-none"
                                            />
                                        </th>
                                        <th className="py-1.5 px-1.5">
                                            <input
                                                type="text"
                                                value={colFilters.energy}
                                                onChange={(e) => setColFilters(prev => ({ ...prev, energy: e.target.value }))}
                                                placeholder=">=75..."
                                                className="w-full px-1.5 py-1 rounded bg-zinc-950 border border-zinc-800 focus:border-cyan-400 text-[10px] font-mono text-white placeholder-zinc-600 text-center outline-none"
                                            />
                                        </th>
                                        <th className="py-1.5 px-1.5">
                                            <input
                                                type="text"
                                                value={colFilters.dance}
                                                onChange={(e) => setColFilters(prev => ({ ...prev, dance: e.target.value }))}
                                                placeholder=">=70..."
                                                className="w-full px-1.5 py-1 rounded bg-zinc-950 border border-zinc-800 focus:border-cyan-400 text-[10px] font-mono text-white placeholder-zinc-600 text-center outline-none"
                                            />
                                        </th>
                                        <th className="py-1.5 px-1.5">
                                            <input
                                                type="text"
                                                value={colFilters.intensity}
                                                onChange={(e) => setColFilters(prev => ({ ...prev, intensity: e.target.value }))}
                                                placeholder=">=70..."
                                                className="w-full px-1.5 py-1 rounded bg-zinc-950 border border-zinc-800 focus:border-cyan-400 text-[10px] font-mono text-white placeholder-zinc-600 text-center outline-none"
                                            />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTracks.map((tr, tIdx) => {
                                        const trKey = tr.id || tr.file_path || tr.path || tIdx;
                                        const isSelected = selectedTrackKeys.has(trKey);
                                        const trTitle = tr.title || tr.t || tr.filename || (tr.path ? tr.path.split('/').pop() : 'Desconocido');
                                        const trFile = tr.filename || tr.f || (tr.path ? tr.path.split('/').pop() : '');
                                        const trArtist = tr.artist || tr.a || 'Desconocido';
                                        const trGenre = tr.genre || tr.subgenre || 'House';
                                        const trFormat = tr.format || (tr.filename || tr.f || tr.path || '').split('.').pop().toUpperCase() || 'FLAC';
                                        const trBpm = tr.bpm || tr.b || '--';
                                        const trKeyVal = tr.key || tr.k || tr.camelot || tr.camelot_key || '8A';
                                        const trEnergy = tr.energy !== undefined ? Math.round(parseFloat(tr.energy) > 1.0 ? parseFloat(tr.energy) : parseFloat(tr.energy) * 100) : (tr.e || 80);
                                        const trDance = tr.dance !== undefined ? Math.round(parseFloat(tr.dance) > 1.0 ? parseFloat(tr.dance) : parseFloat(tr.dance) * 100) : (tr.danceability || 80);
                                        const trIntensity = tr.intensity !== undefined ? Math.round(parseFloat(tr.intensity) > 1.0 ? parseFloat(tr.intensity) : parseFloat(tr.intensity) * 100) : (tr.int || 75);

                                        const isRowPlaying = nowPlayingTrack && (String(nowPlayingTrack.id) === String(tr.id) || (nowPlayingTrack.path && nowPlayingTrack.path === tr.path));
                                        const coverSrc = getValidCover ? getValidCover(tr.cover) : (tr.cover || DEFAULT_VINYL_SVG);

                                        return (
                                            <tr 
                                                key={trKey}
                                                draggable={true}
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData('text/plain', JSON.stringify(tr));
                                                    e.dataTransfer.effectAllowed = 'copy';
                                                }}
                                                onClick={(e) => {
                                                    if (e.shiftKey || e.metaKey || e.ctrlKey) {
                                                        e.preventDefault();
                                                        handleRowSelectClick(e, tr, tIdx);
                                                        return;
                                                    }
                                                    if (onPlayTrack) onPlayTrack(tr);
                                                }}
                                                className={`border-b border-white/5 hover:bg-cyan-950/20 transition-colors group cursor-pointer ${
                                                    isSelected ? 'bg-cyan-950/30' : ''
                                                }`}
                                                title="Arrastra para clasificar en cualquier carpeta de la izquierda o haz clic para reproducir"
                                            >
                                                {/* 0. Casilla de selección múltiple */}
                                                <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <input 
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => handleToggleSelectTrack(trKey, e)}
                                                        className="accent-cyan-500 cursor-pointer w-3.5 h-3.5 rounded"
                                                    />
                                                </td>

                                                {/* 1. Waveform */}
                                                <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <TableHarmonicWaveform 
                                                        track={tr} 
                                                        duration={tr.duration || '05:00'} 
                                                        onPlayTrack={onPlayTrack} 
                                                        onTogglePlay={onTogglePlay} 
                                                        isCurrentPlaying={isRowPlaying} 
                                                        playProgress={isRowPlaying ? playProgress : 0} 
                                                    />
                                                </td>

                                                {/* 2. File / Título */}
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <img 
                                                            src={coverSrc} 
                                                            className="w-8 h-8 rounded bg-zinc-800 object-cover shrink-0 border border-zinc-700 shadow-sm" 
                                                            alt="cover" 
                                                            onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }} 
                                                        />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-semibold text-cyan-400 text-xs truncate max-w-[210px]" title={trTitle}>
                                                                {trTitle}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500 font-mono truncate max-w-[210px]" title={trFile}>
                                                                {trFile}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 3. Artist */}
                                                <td className="py-2 px-3 text-gray-300 font-mono text-xs truncate max-w-[130px]" title={trArtist}>
                                                    {trArtist}
                                                </td>

                                                {/* 4. Género */}
                                                <td className="py-2 px-2 text-center">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/70 text-purple-300 border border-purple-800/60 truncate max-w-[100px] inline-block shadow-sm">
                                                        {trGenre}
                                                    </span>
                                                </td>

                                                {/* 5. Formato (Sustituto exacto de Kilobytes, tomado de Auditoría) */}
                                                <td className="py-2 px-2 text-center">
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-cyan-400 border border-zinc-700 shadow-sm">
                                                        {trFormat}
                                                    </span>
                                                </td>

                                                {/* 6. BPM */}
                                                <td className="py-2 px-2 text-center">
                                                    <span className="ws-bpm text-xs font-mono font-bold">{trBpm}</span>
                                                </td>

                                                {/* 7. Key */}
                                                <td className="py-2 px-2 text-center">
                                                    <CamelotKeyBadge value={trKeyVal} />
                                                </td>

                                                {/* 8. Energy */}
                                                <td className="py-2 px-3 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-0.5 w-16 mx-auto">
                                                        <div className="flex items-center justify-between w-full text-[9px] font-mono">
                                                            <Icons.Zap size={12} className="inline-block text-gray-400" />
                                                            <span className={`font-bold ${trEnergy >= 82 ? 'text-red-400' : trEnergy >= 68 ? 'text-amber-400' : 'text-cyan-400'}`}>
                                                                {trEnergy}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden border border-zinc-700">
                                                            <div 
                                                                className={`h-full rounded-full ${trEnergy >= 82 ? 'bg-gradient-to-r from-amber-500 to-red-500' : trEnergy >= 68 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500'}`} 
                                                                style={{ width: `${Math.min(100, Math.max(10, trEnergy))}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 9. Dance */}
                                                <td className="py-2 px-3 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-0.5 w-16 mx-auto">
                                                        <div className="flex items-center justify-between w-full text-[9px] font-mono">
                                                            <Icons.Activity size={12} className="inline-block text-gray-400" />
                                                            <span className="font-bold text-purple-300">{trDance}%</span>
                                                        </div>
                                                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden border border-zinc-700">
                                                            <div 
                                                                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" 
                                                                style={{ width: `${Math.min(100, Math.max(10, trDance))}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 10. Intensidad */}
                                                <td className="py-2 px-3 text-center">
                                                    <div className="flex items-center justify-between gap-1 w-20 mx-auto">
                                                        <div className="flex flex-col items-center justify-center gap-0.5 flex-1">
                                                            <div className="flex items-center justify-between w-full text-[9px] font-mono">
                                                                <Icons.Sliders size={12} className="inline-block text-gray-400" />
                                                                <span className="font-bold text-amber-300">{trIntensity}%</span>
                                                            </div>
                                                            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden border border-zinc-700">
                                                                <div 
                                                                    className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500" 
                                                                    style={{ width: `${Math.min(100, Math.max(10, trIntensity))}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveTrack(trKey);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 text-xs transition-opacity cursor-pointer shrink-0"
                                                            title="Quitar de esta vista"
                                                        >
                                                            <Icons.Close size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Pie: Acciones de Guardado y Crear en Disco */}
            <div style={{ backgroundColor: '#07080e', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }} className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-gray-400">
                        <Icons.Lock size={14} className="inline-block align-[-2px]" /> Los cambios quedan guardados automáticamente para tu próxima sesión.
                    </span>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => onMaterializarEnDisco && onMaterializarEnDisco(currentLib)}
                        disabled={!currentLib.folders || currentLib.folders.length === 0}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-black font-mono font-bold text-xs shadow-lg shadow-emerald-500/25 border border-emerald-300 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                        title="Selecciona una carpeta o USB en disco para crear una copia física de tus pistas organizadas por carpetas"
                    >
                        <Icons.Save size={14} className="inline-block align-[-2px]" />
                        <span>Copia en disco</span>
                    </button>


                </div>
            </div>

            {/* MODAL NAVEGADOR DE ARCHIVOS Y SELECCIÓN MULTI-CARPETA / MULTI-PISTA */}
            {fsBrowserOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans animate-fadeIn">
                    <div className="bg-[#0c0c12] border border-zinc-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <span className="text-cyan-400 font-bold text-sm uppercase tracking-wider font-mono flex items-center gap-2">
                                    <Icons.Library size={16} /> Explorador de Colección & Carga Universal
                                </span>
                            </div>
                            <button onClick={() => setFsBrowserOpen(false)} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 flex items-center justify-center text-xs cursor-pointer">
                                <Icons.Close size={15} />
                            </button>
                        </div>

                        <div className="px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-gray-400 shrink-0 font-bold">Ruta:</span>
                                <span className="text-cyan-400 font-bold truncate" title={fsCurrentPath}>{fsCurrentPath || "Cargando..."}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {fsCurrentPath && (
                                    <button 
                                        type="button"
                                        onClick={() => toggleStageFolder(fsCurrentPath)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow ${
                                            stagedFolders.includes(fsCurrentPath)
                                                ? 'bg-emerald-500 text-black border-emerald-400 font-black'
                                                : 'bg-cyan-950/80 hover:bg-cyan-900 border-cyan-700/70 text-cyan-300'
                                        }`}
                                    >
                                        <span>{stagedFolders.includes(fsCurrentPath) ? '✓' : '+'}</span>
                                        <span>{stagedFolders.includes(fsCurrentPath) ? 'Carpeta Añadida' : 'Añadir Toda Esta Carpeta'}</span>
                                    </button>
                                )}
                                {fsParentPath && fsParentPath !== fsCurrentPath && (
                                    <button onClick={() => handleNavegarACarpeta(fsParentPath)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-mono font-bold border border-zinc-700 cursor-pointer shrink-0 flex items-center gap-1.5 shadow">
                                        <span>▲</span> <span>Subir Nivel</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Pestañas: Subcarpetas / Pistas Sueltas */}
                        <div className="flex border-b border-zinc-800 bg-[#07070a] px-4 pt-2.5 gap-2 text-xs font-mono">
                            <button
                                onClick={() => setFsActiveTab('folders')}
                                className={`px-4 py-2 rounded-t-lg font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                    fsActiveTab === 'folders'
                                        ? 'bg-zinc-900 text-cyan-400 border-t border-x border-zinc-700'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <span><Icons.Folder size={14} className="inline-block" /> Subcarpetas</span>
                                <span className="px-2 py-0.5 bg-zinc-800 text-[11px] rounded-full text-gray-300 font-mono font-bold">{fsFolders.length}</span>
                                {stagedFolders.length > 0 && (
                                    <span className="px-2 py-0.5 bg-emerald-500 text-black text-[11px] font-bold rounded-full font-mono">
                                        {stagedFolders.length} en cesta
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setFsActiveTab('files')}
                                className={`px-4 py-2 rounded-t-lg font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                    fsActiveTab === 'files'
                                        ? 'bg-zinc-900 text-cyan-400 border-t border-x border-zinc-700'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <span><Icons.Music size={14} className="inline-block" /> Pistas Sueltas</span>
                                <span className={`px-2 py-0.5 text-[11px] rounded-full font-bold font-mono ${
                                    stagedFiles.length > 0 ? 'bg-cyan-500 text-black' : 'bg-zinc-800 text-gray-300'
                                }`}>
                                    {stagedFiles.length > 0 ? `${stagedFiles.length} en cesta` : fsFiles.length}
                                </span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-[#07070a] max-h-[350px]">
                            {fsLoading ? (
                                <div className="py-12 text-center text-gray-400 text-xs font-mono flex flex-col items-center gap-2">
                                    <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Leyendo directorio y pistas de audio...</span>
                                </div>
                            ) : fsActiveTab === 'folders' ? (
                                fsFolders.length === 0 ? (
                                    <div className="py-10 text-center text-gray-500 text-xs font-mono">
                                        No hay subcarpetas en este directorio.
                                    </div>
                                ) : (
                                    fsFolders.map((f, idx) => {
                                        const isFolderStaged = stagedFolders.includes(f.path);
                                        return (
                                            <div 
                                                key={idx} 
                                                onClick={() => handleNavegarACarpeta(f.path)}
                                                className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer group transition-all ${
                                                    isFolderStaged 
                                                        ? 'bg-emerald-950/20 border-emerald-500/50' 
                                                        : 'bg-zinc-900/60 hover:bg-cyan-950/40 border-zinc-800/80 hover:border-cyan-500/50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <Icons.Folder size={14} className="inline-block text-amber-400" />
                                                    <span className="text-xs text-gray-200 group-hover:text-white font-medium truncate">{f.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleStageFolder(f.path); }}
                                                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                                                            isFolderStaged
                                                                ? 'bg-emerald-500 text-black border-emerald-400 font-black'
                                                                : 'bg-zinc-800 hover:bg-cyan-950 text-cyan-300 border-zinc-700 hover:border-cyan-600'
                                                        }`}
                                                    >
                                                        <span>{isFolderStaged ? '✓' : '+'}</span>
                                                        <span>{isFolderStaged ? 'Añadida a Cesta' : 'Añadir Carpeta'}</span>
                                                    </button>
                                                    <span className="text-gray-500 text-xs group-hover:text-cyan-400 font-mono">➔</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            ) : (
                                <div>
                                    {fsFiles.length > 0 && (
                                        <div className="flex items-center justify-between p-2 mb-2 bg-zinc-900/80 rounded border border-zinc-800 text-xs font-mono">
                                            <label className="flex items-center gap-2 text-gray-300 cursor-pointer select-none">
                                                <input 
                                                    type="checkbox" 
                                                    checked={fsFiles.length > 0 && fsFiles.every(f => stagedFiles.includes(f.path))}
                                                    onChange={toggleStageAllCurrentFsFiles}
                                                    className="rounded bg-zinc-950 border-zinc-700 text-cyan-500 focus:ring-0 cursor-pointer"
                                                />
                                                <span className="font-bold">Seleccionar todas las de este nivel ({fsFiles.length})</span>
                                            </label>
                                            {stagedFiles.length > 0 && (
                                                <span className="text-cyan-400 text-[11px] font-bold">
                                                    <Icons.Check size={14} className="inline-block" /> {stagedFiles.length} pista(s) en cesta
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {fsFiles.length === 0 ? (
                                        <div className="py-10 text-center text-gray-500 text-xs font-mono">
                                            No se encontraron archivos de audio directos en este nivel.
                                        </div>
                                    ) : (
                                        fsFiles.map((fileItem, idx) => {
                                            const isSelected = stagedFiles.includes(fileItem.path);
                                            return (
                                                <div 
                                                    key={idx}
                                                    onClick={() => toggleStageFile(fileItem.path)}
                                                    className={`p-2 rounded flex items-center justify-between cursor-pointer border transition-colors ${
                                                        isSelected 
                                                            ? 'bg-cyan-950/40 border-cyan-500/60 text-white' 
                                                            : 'bg-zinc-900/40 hover:bg-zinc-800/60 border-zinc-800 text-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isSelected}
                                                            onChange={() => {}}
                                                            className="rounded bg-zinc-950 border-zinc-700 text-cyan-500 focus:ring-0 cursor-pointer"
                                                        />
                                                        <Icons.Music size={14} className="inline-block text-cyan-400" />
                                                        <span className="text-xs truncate font-mono">{fileItem.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
                                                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 font-bold border border-zinc-700">
                                                            {fileItem.ext || 'AUDIO'}
                                                        </span>
                                                        <span className="text-gray-400">{fileItem.size_mb ? `${fileItem.size_mb} MB` : ''}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Pie del modal con cesta acumulativa */}
                        <div className="p-3.5 bg-zinc-950 border-t border-zinc-800 flex flex-wrap justify-between items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-gray-300 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                                    <span>Cesta:</span>
                                    <span className="text-emerald-400">{stagedFolders.length} carpeta(s)</span>
                                    <span>•</span>
                                    <span className="text-cyan-300">{stagedFiles.length} pista(s)</span>
                                </span>
                                {(stagedFolders.length > 0 || stagedFiles.length > 0) && (
                                    <button 
                                        type="button" 
                                        onClick={clearStagedSelection}
                                        className="px-2 py-0.5 text-[10px] font-mono text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                                    >
                                        [Vaciar]
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2.5">
                                <button 
                                    type="button"
                                    onClick={() => setFsBrowserOpen(false)} 
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-200 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all border border-zinc-700"
                                >
                                    Cancelar
                                </button>
                                {(stagedFolders.length > 0 || stagedFiles.length > 0) ? (
                                    <button 
                                        type="button"
                                        onClick={handleConfirmarSeleccionLote}
                                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-black font-mono font-extrabold text-xs rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Icons.Download size={14} />
                                        <span>Cargar Cesta Completa ({stagedFolders.length} carp., {stagedFiles.length} pistas)</span>
                                    </button>
                                ) : (
                                    <button 
                                        type="button"
                                        onClick={handleConfirmarSeleccionLote} 
                                        className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Icons.Folder size={14} />
                                        <span>Cargar Toda la Carpeta Actual</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export const CustomLibraryModal = LibraryWorkspace;


