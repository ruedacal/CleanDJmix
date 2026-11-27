const { useState, useMemo } = React;
import { Icons } from './icons.jsx';
import { getValidCover, DEFAULT_VINYL_SVG } from '../data/constants.js';

const getTrackKey = (trk) =>
    String(trk?.id ?? trk?.path ?? trk?.filepath ?? trk?.file_path ?? trk?.f ?? trk?.filename ?? "");

const countTracksRecursive = (folders = []) =>
    folders.reduce((acc, f) => {
        const own = Array.isArray(f.tracks) ? f.tracks.length : 0;
        const sub = Array.isArray(f.subfolders) ? countTracksRecursive(f.subfolders) : 0;
        return acc + own + sub;
    }, 0);

const moveTrackInTree = (folders, sourceFolderId, targetFolderId, trackObj) => {
    const tKey = getTrackKey(trackObj);
    const updateNode = (node) => {
        let nextTracks = Array.isArray(node.tracks) ? [...node.tracks] : [];
        if (sourceFolderId && String(node.id) === String(sourceFolderId) && String(sourceFolderId) !== String(targetFolderId)) {
            nextTracks = nextTracks.filter((t) => getTrackKey(t) !== tKey);
        }
        if (String(node.id) === String(targetFolderId)) {
            if (!nextTracks.some((t) => getTrackKey(t) === tKey)) {
                nextTracks.push(trackObj);
            }
        }
        const nextSubs = Array.isArray(node.subfolders) ? node.subfolders.map(updateNode) : node.subfolders;
        return { ...node, tracks: nextTracks, ...(nextSubs !== undefined ? { subfolders: nextSubs } : {}) };
    };
    return (folders || []).map(updateNode);
};

/**
 * Columna izquierda compartida para Hot Cues y Colección:
 * - Árbol recursivo de carpetas y subcarpetas con botón ▸/▾
 * - Listado inline de pistas mostrando SOLO: Cover, Título y Autor
 * - Drag & Drop de pistas entre carpetas con persistencia en customLibraries
 */
export const CollectionTreeSidebar = ({
    tracks = [],
    customLibraries = [],
    activeCustomLibId = null,
    onSaveCustomLibraries = null,
    selectedTrackId = null,
    onSelectTrack,
    title = "Colección",
    onExploreFolder = null,
    className = "w-72",
}) => {
    const [search, setSearch] = useState("");
    const [collapsedFolders, setCollapsedFolders] = useState({});
    const [dragOverFolderId, setDragOverFolderId] = useState(null);

    const activeLib = useMemo(() => {
        if (!Array.isArray(customLibraries) || customLibraries.length === 0) return null;
        return (
            customLibraries.find((l) => String(l.id) === String(activeCustomLibId)) ||
            customLibraries[0]
        );
    }, [customLibraries, activeCustomLibId]);

    const { rootFolders, totalTracksCount, isLibraryBacked } = useMemo(() => {
        // Prioridad 1: Estructura real de carpetas/subcarpetas de la Colección guardada
        if (activeLib && Array.isArray(activeLib.folders) && activeLib.folders.length > 0) {
            return {
                rootFolders: activeLib.folders,
                totalTracksCount: countTracksRecursive(activeLib.folders),
                isLibraryBacked: true,
            };
        }

        // Fallback: Agrupar tracks cargados por carpeta del sistema de archivos
        const map = new Map();
        (tracks || []).forEach((trk) => {
            const rawPath = String(trk.path || trk.filepath || trk.file_path || trk.f || "");
            let folderLabel = trk.folder || trk.crate || "";
            if (!folderLabel && rawPath) {
                const normalized = rawPath.replace(/\\/g, "/");
                const parts = normalized.split("/").filter(Boolean);
                if (parts.length >= 3) {
                    folderLabel = `${parts[parts.length - 3]} / ${parts[parts.length - 2]}`;
                } else if (parts.length === 2) {
                    folderLabel = parts[0];
                }
            }
            if (!folderLabel) folderLabel = trk.genre || "Colección General";
            if (!map.has(folderLabel)) map.set(folderLabel, []);
            map.get(folderLabel).push(trk);
        });

        const fallbackFolders = Array.from(map.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, items], idx) => ({
                id: `fs_${idx}_${name}`,
                name,
                tracks: items,
                subfolders: [],
            }));

        return {
            rootFolders: fallbackFolders,
            totalTracksCount: (tracks || []).length,
            isLibraryBacked: false,
        };
    }, [activeLib, tracks]);

    const toggleFolder = (folderId) => {
        setCollapsedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    const handleDropTrackOnFolder = (e, targetFolderId) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverFolderId(null);
        if (!isLibraryBacked || !activeLib || typeof onSaveCustomLibraries !== "function") return;
        try {
            const raw = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
            if (!raw) return;
            const parsed = JSON.parse(raw);
            const trackObj = parsed?.track ? parsed.track : parsed;
            const sourceFolderId = parsed?.sourceFolderId || null;
            if (!trackObj || typeof trackObj !== "object") return;

            const updatedLibs = customLibraries.map((lib) => {
                if (String(lib.id) !== String(activeLib.id)) return lib;
                return {
                    ...lib,
                    folders: moveTrackInTree(lib.folders, sourceFolderId, targetFolderId, trackObj),
                };
            });
            onSaveCustomLibraries(updatedLibs, activeLib.id);
        } catch (_) {}
    };

    const q = search.trim().toLowerCase();

    const renderFolderNode = (fld, depth = 0) => {
        const folderName = String(fld.name || fld.title || "Carpeta");
        const rawItems = Array.isArray(fld.tracks) ? fld.tracks : [];
        const subs = Array.isArray(fld.subfolders) ? fld.subfolders : [];

        const filteredItems = q
            ? rawItems.filter((trk) => {
                  const t = String(trk.title || trk.t || trk.filename || "").toLowerCase();
                  const a = String(trk.artist || trk.a || "").toLowerCase();
                  return t.includes(q) || a.includes(q) || folderName.toLowerCase().includes(q);
              })
            : rawItems;

        const renderedSubs = subs.map((sub) => renderFolderNode(sub, depth + 1)).filter(Boolean);
        if (q && filteredItems.length === 0 && renderedSubs.length === 0 && !folderName.toLowerCase().includes(q)) {
            return null;
        }

        const isCollapsed = Boolean(collapsedFolders[fld.id]);
        const isDropOver = dragOverFolderId === fld.id;

        return (
            <div key={fld.id} className={depth > 0 ? "ml-2.5 pl-2 border-l border-cyan-500/25 space-y-1 mt-1" : "space-y-1"}>
                <div
                    onDragOver={(e) => {
                        if (!isLibraryBacked) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverFolderId !== fld.id) setDragOverFolderId(fld.id);
                    }}
                    onDragLeave={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget)) return;
                        setDragOverFolderId(null);
                    }}
                    onDrop={(e) => handleDropTrackOnFolder(e, fld.id)}
                    className={`rounded-lg border overflow-hidden transition-colors ${
                        isDropOver
                            ? "border-cyan-400 bg-cyan-950/30 shadow-[0_0_12px_rgba(6,182,212,0.35)]"
                            : "border-djzinc-800/70 bg-[#0b0b12]"
                    }`}
                >
                    {/* Cabecera de carpeta con botón ▸/▾ */}
                    <div
                        onClick={() => toggleFolder(fld.id)}
                        className="w-full px-2 py-1.5 flex items-center justify-between gap-1.5 bg-[#10101a] hover:bg-[#151524] cursor-pointer transition-colors"
                    >
                        <div className="flex items-center gap-1.5 min-w-0">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFolder(fld.id);
                                }}
                                className="w-5 h-5 flex items-center justify-center rounded bg-zinc-900/80 hover:bg-cyan-500/20 text-[11px] font-mono text-cyan-400 border border-zinc-700/70 shrink-0 cursor-pointer transition-colors"
                                title={isCollapsed ? "Desplegar pistas" : "Ocultar pistas"}
                            >
                                {isCollapsed ? "▸" : "▾"}
                            </button>
                            <Icons.Folder size={13} className={`shrink-0 ${isDropOver ? "text-cyan-300" : "text-amber-400/90"}`} />
                            <span className="text-[11px] font-mono font-bold text-gray-200 truncate" title={folderName}>
                                {folderName}
                            </span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 shrink-0">
                            {rawItems.length}
                        </span>
                    </div>

                    {/* Listado inline de pistas: SOLO Cover, Título y Autor + Drag & Drop */}
                    {!isCollapsed && (
                        <div className="divide-y divide-djzinc-800/50">
                            {filteredItems.length === 0 ? (
                                renderedSubs.length === 0 && (
                                    <div className="px-3 py-1.5 text-[10px] font-mono text-gray-600 italic">
                                        Carpeta vacía
                                    </div>
                                )
                            ) : (
                                filteredItems.map((trk, idx) => {
                                    const isSel = selectedTrackId !== null && String(selectedTrackId) === String(trk.id);
                                    const coverUrl = getValidCover(
                                        trk.cover || (trk.path ? `/cover?path=${encodeURIComponent(trk.path)}` : (trk.f ? `/cover?path=${encodeURIComponent(trk.f)}` : null))
                                    );
                                    return (
                                        <div
                                            key={trk.id ?? `${fld.id}_${idx}`}
                                            draggable={isLibraryBacked && typeof onSaveCustomLibraries === "function"}
                                            onDragStart={(e) => {
                                                e.stopPropagation();
                                                const payload = JSON.stringify({ track: trk, sourceFolderId: fld.id });
                                                e.dataTransfer.setData("application/json", payload);
                                                e.dataTransfer.setData("text/plain", JSON.stringify(trk));
                                                e.dataTransfer.effectAllowed = "copyMove";
                                            }}
                                            onClick={() => onSelectTrack && onSelectTrack(trk)}
                                            className={`w-full px-2 py-1.5 flex items-center gap-2 text-left transition-colors ${
                                                isLibraryBacked && typeof onSaveCustomLibraries === "function"
                                                    ? "cursor-grab active:cursor-grabbing"
                                                    : "cursor-pointer"
                                            } ${
                                                isSel
                                                    ? "bg-djcyan-950/50 border-l-2 border-l-djcyan-400"
                                                    : "hover:bg-djzinc-900/70 border-l-2 border-l-transparent"
                                            }`}
                                            title={isLibraryBacked ? "Clic para cargar · Arrastra a otra carpeta para mover" : "Clic para cargar pista"}
                                        >
                                            <img loading="lazy" decoding="async"
                                                src={coverUrl}
                                                alt="Cover"
                                                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }}
                                                className="w-8 h-8 rounded object-cover border border-djzinc-750 shrink-0 bg-black pointer-events-none"
                                            />
                                            <div className="min-w-0 flex-1 pointer-events-none">
                                                <div className={`text-[11px] font-bold truncate leading-tight ${isSel ? "text-djcyan-300" : "text-white"}`}>
                                                    {trk.title || trk.t || trk.filename || "Sin título"}
                                                </div>
                                                <div className="text-[10px] text-gray-400 truncate leading-tight mt-0.5">
                                                    {trk.artist || trk.a || "Artista Desconocido"}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* Subcarpetas recursivas */}
                {!isCollapsed && renderedSubs.length > 0 && (
                    <div className="space-y-1">{renderedSubs}</div>
                )}
            </div>
        );
    };

    return (
        <aside className={`${className} shrink-0 border-r border-djzinc-800 bg-[#09090f] flex flex-col min-h-0 overflow-hidden select-none`}>
            {/* Cabecera del panel */}
            <div className="px-3 py-2.5 border-b border-djzinc-800 bg-[#0c0c14] flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <Icons.Folder size={14} className="text-djcyan-400 shrink-0" />
                    <span className="text-xs font-mono font-black uppercase tracking-wider text-white truncate" title={activeLib?.name || title}>
                        {activeLib?.name || title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-djzinc-900 border border-djzinc-750 text-[10px] font-mono text-djcyan-300 font-bold shrink-0">
                        {totalTracksCount}
                    </span>
                </div>
                {onExploreFolder && (
                    <button
                        type="button"
                        onClick={onExploreFolder}
                        className="p-1 rounded bg-djzinc-900 hover:bg-djzinc-800 text-gray-400 hover:text-djcyan-300 border border-djzinc-750 cursor-pointer transition-colors shrink-0"
                        title="Cargar o cambiar carpeta"
                    >
                        <Icons.Plus size={12} />
                    </button>
                )}
            </div>

            {/* Buscador rápido */}
            <div className="p-2 border-b border-djzinc-800/80 bg-[#08080e] shrink-0">
                <div className="relative">
                    <Icons.Search size={12} className="absolute left-2.5 top-2 text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filtrar carpeta, título o autor..."
                        className="w-full pl-7 pr-6 py-1 bg-[#11111a] border border-djzinc-800 rounded-lg text-[11px] font-mono text-gray-200 placeholder-gray-500 outline-none focus:border-djcyan-500/60"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="absolute right-2 top-1.5 text-gray-500 hover:text-white cursor-pointer"
                        >
                            <Icons.Close size={11} />
                        </button>
                    )}
                </div>
            </div>

            {/* Árbol recursivo de carpetas desplegables */}
            <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-1">
                {rootFolders.length === 0 ? (
                    <div className="py-8 px-3 text-center text-[11px] font-mono text-gray-500">
                        Sin pistas en la colección
                    </div>
                ) : (
                    rootFolders.map((fld) => renderFolderNode(fld, 0))
                )}
            </div>
        </aside>
    );
};
