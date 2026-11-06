import { getApiConfig } from "../api/config.js";
import { api } from "../api/endpoints.js";
import { ApiError } from "../api/http.js";
import { computeMatch, keyRelation, bpmDeltaPercent } from "../camelot.js";
import { FileDropzone } from "./FileDropzone.jsx";
import { Icon } from "./Icon.jsx";
import { IngestionQueue } from "./IngestionQueue.jsx";
import { KeyBadge } from "./CompatibilityBadge.jsx";
import { LibraryToolbar, TrackGrid } from "./TrackGrid.jsx";
import { TrackInspector } from "./TrackInspector.jsx";
import { Menu, Sheet, cx } from "./primitives.jsx";

const { useCallback, useEffect, useMemo, useRef, useState } = React;

const SORT_ACCESSORS = {
    title: (row) => row.track.title.toLowerCase(),
    bpm: (row) => row.track.bpm,
    key: (row) => {
        const m = /^(\d+)([AB])$/.exec(row.track.key) || [];
        return Number(m[1] || 0) * 2 + (m[2] === "B" ? 1 : 0);
    },
    match: (row) => (row.isMaster ? 101 : row.match ? row.match.score : -1),
    energy: (row) => row.track.energy,
};

const HARMONIC = new Set(["perfect", "adjacent", "relative"]);

const API_STATUS = {
    mock: { label: "Mock API", dot: "bg-amber-300", title: "Sin servidor configurado: endpoints REST simulados en memoria" },
    checking: { label: "API…", dot: "bg-zinc-500 animate-pulse", title: "Comprobando GET /api/health" },
    online: { label: "API", dot: "bg-emerald-400", title: "Servidor REST conectado" },
    offline: { label: "Offline", dot: "bg-rose-500", title: "El servidor REST no responde" },
};

function useToasts() {
    const [toasts, setToasts] = useState([]);
    const notify = useCallback((message, tone = "good") => {
        const id = Math.random().toString(36).slice(2);
        setToasts((list) => [...list.slice(-2), { id, message, tone }]);
        setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
    }, []);
    return [toasts, notify];
}

const MOBILE_TABS = [
    { value: "library", label: "Biblioteca", icon: "library" },
    { value: "acoustic", label: "Acústica", icon: "radar" },
    { value: "cues", label: "Cue Editor", icon: "cues" },
];

export function StudioApp() {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [masterId, setMasterId] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [remoteScores, setRemoteScores] = useState(null);
    const [filters, setFilters] = useState({ query: "", bpmLock: false, keyLock: false, issuesOnly: false });
    const [sort, setSort] = useState({ field: "match", dir: "desc" });
    const [queue, setQueue] = useState([]);
    const [inspectorView, setInspectorView] = useState("cues");
    const [mobileTab, setMobileTab] = useState("library");
    const [importOpen, setImportOpen] = useState(false);
    const [toasts, notify] = useToasts();
    const apiMode = useMemo(() => getApiConfig().mode, []);
    const [apiStatus, setApiStatus] = useState(apiMode === "mock" ? "mock" : "checking");
    const notifyRef = useRef(notify);
    notifyRef.current = notify;
    const lifetime = useRef(null);

    useEffect(() => {
        const controller = new AbortController();
        lifetime.current = controller;
        return () => controller.abort();
    }, []);

    useEffect(() => {
        if (apiMode === "mock") return;
        const controller = new AbortController();
        api.health({ signal: controller.signal })
            .then(() => setApiStatus("online"))
            .catch((error) => !controller.signal.aborted && (console.error("[studio] GET /api/health", error), setApiStatus("offline")));
        return () => controller.abort();
    }, [apiMode]);

    useEffect(() => {
        const controller = new AbortController();
        api.tracks
            .list({ signal: controller.signal })
            .then(({ items = [] } = {}) => {
                setTracks(items);
                if (items[0]) {
                    setMasterId(items[0].id);
                    setSelectedId(items[0].id);
                }
            })
            .catch((error) => {
                if (controller.signal.aborted) return;
                console.error("[studio] GET /api/tracks", error);
                notifyRef.current("No se pudo cargar la biblioteca", "bad");
            })
            .finally(() => !controller.signal.aborted && setLoading(false));
        return () => controller.abort();
    }, []);

    useEffect(() => {
        if (!masterId) return;
        const controller = new AbortController();
        setRemoteScores(null);
        api.tracks
            .compatibility(masterId, { signal: controller.signal })
            .then(({ scores } = {}) => scores && setRemoteScores(scores))
            .catch((error) => !controller.signal.aborted && console.error("[studio] GET /api/tracks/:id/compatibility", error));
        return () => controller.abort();
    }, [masterId]);

    const applyJobSnapshot = useCallback((job) => {
        setQueue((list) => {
            const next = list.slice();
            job.items.forEach((item) => {
                const index = next.findIndex((q) => q.id === item.id);
                if (index === -1) next.push(item);
                else next[index] = { ...next[index], ...item };
            });
            return next;
        });
        const ready = job.items.filter((item) => item.estado === "listo" && item.track).map((item) => item.track);
        if (ready.length) {
            setTracks((list) => {
                const fresh = ready.filter((t) => !list.some((existing) => existing.id === t.id));
                return fresh.length ? [...fresh, ...list] : list;
            });
        }
    }, []);

    const master = tracks.find((t) => t.id === masterId) || null;
    const selected = tracks.find((t) => t.id === selectedId) || null;

    const matchFor = useCallback(
        (track) => {
            const local = computeMatch(master, track);
            if (local && remoteScores && remoteScores[track.id] != null) return { ...local, score: Math.round(remoteScores[track.id]) };
            return local;
        },
        [master, remoteScores]
    );

    const rows = useMemo(() => {
        const query = filters.query.trim().toLowerCase();
        const list = tracks
            .map((track) => ({ track, match: matchFor(track), isMaster: track.id === masterId }))
            .filter(({ track, isMaster }) => {
                if (query && !`${track.title} ${track.artist} ${track.album} ${track.genre} ${track.subgenre}`.toLowerCase().includes(query)) return false;
                if (filters.issuesOnly && track.quality === "verified") return false;
                if (master && !isMaster) {
                    if (filters.bpmLock && Math.abs(bpmDeltaPercent(master.bpm, track.bpm)) > 5) return false;
                    if (filters.keyLock && !HARMONIC.has(keyRelation(master.key, track.key))) return false;
                }
                return true;
            });
        const accessor = SORT_ACCESSORS[sort.field];
        const dir = sort.dir === "asc" ? 1 : -1;
        return list.sort((a, b) => {
            const va = accessor(a);
            const vb = accessor(b);
            return va < vb ? -dir : va > vb ? dir : 0;
        });
    }, [tracks, filters, sort, matchFor, master, masterId]);

    const issues = tracks.filter((t) => t.quality !== "verified").length;

    const onSort = (field) =>
        setSort((s) => (s.field === field ? { field, dir: s.dir === "asc" ? "desc" : "asc" } : { field, dir: field === "title" || field === "key" ? "asc" : "desc" }));

    const ingest = async (accepted, rejected) => {
        setImportOpen(false);
        if (rejected.length) {
            const stamp = Date.now();
            setQueue((list) => [
                ...list,
                ...rejected.map((file, i) => ({ id: `rej_${stamp}_${i}`, nombre: file.name, progreso: 0, estado: "error", mensaje: "Formato no compatible" })),
            ]);
        }
        if (!accepted.length) return;
        const signal = lifetime.current && lifetime.current.signal;
        try {
            const job = await api.library.upload(accepted, { signal });
            applyJobSnapshot(job);
            notify(`${accepted.length} archivo${accepted.length > 1 ? "s" : ""} enviado${accepted.length > 1 ? "s" : ""} a análisis`, "good");
            if (job.status !== "completed") await api.ingest.watch(job.jobId, applyJobSnapshot, { signal });
        } catch (error) {
            if (signal && signal.aborted) return;
            console.error("[studio] POST /api/library/upload", error);
            notify(error instanceof ApiError && error.status === 413 ? "Lote demasiado grande para el servidor" : "El motor de análisis no respondió", "bad");
        }
    };

    const requestExport = async (format, label) => {
        try {
            await api.exports.create(format);
            notify(`Exportación ${label} en cola`, "good");
        } catch (error) {
            console.error("[studio] POST /api/exports", error);
            notify(`No se pudo exportar a ${label}`, "bad");
        }
    };

    const onAction = (action, track) => {
        if (action === "master") {
            setMasterId(track.id);
            notify(`${track.title} cargada en Deck Master`, "good");
        } else if (action === "cues" || action === "radar") {
            setSelectedId(track.id);
            const view = action === "cues" ? "cues" : "acoustic";
            setInspectorView(view);
            setMobileTab(view);
        } else if (action === "copyPath") {
            navigator.clipboard && navigator.clipboard.writeText(track.path);
            notify("Ruta copiada al portapapeles", "good");
        }
    };

    const onCuesChange = useCallback((trackId, cues) => setTracks((list) => list.map((t) => (t.id === trackId ? { ...t, cues } : t))), []);
    const onMetaApplied = useCallback((trackId, datos) => setTracks((list) => list.map((t) => (t.id === trackId ? { ...t, ...datos } : t))), []);

    const libraryPane = (
        <div className="flex h-full min-h-0 flex-col">
            <LibraryToolbar
                filters={filters}
                onFilters={(patch) => setFilters((f) => ({ ...f, ...patch }))}
                master={master}
                resultCount={rows.length}
                totalCount={tracks.length}
                onImport={() => setImportOpen(true)}
            />
            {loading ? (
                <div className="flex flex-1 flex-col gap-2 p-4" aria-busy="true" aria-label="Cargando biblioteca">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-900/60" />
                    ))}
                </div>
            ) : (
                <TrackGrid rows={rows} masterId={masterId} selectedId={selectedId} sort={sort} onSort={onSort} onSelect={(t) => setSelectedId(t.id)} onAction={onAction} />
            )}
        </div>
    );

    const inspectorProps = {
        track: selected,
        match: selected ? matchFor(selected) : null,
        isMaster: selected && selected.id === masterId,
        onCuesChange,
        onMetaApplied,
        notify,
    };

    const activeIngest = queue.filter((q) => q.estado === "cola" || q.estado === "analizando").length;

    return (
        <div className="flex h-[100dvh] flex-col bg-black text-zinc-200">
            <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-900 px-3 pt-[env(safe-area-inset-top)] lg:px-4">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_-6px_rgba(34,211,238,0.9)]">
                        <Icon name="disc" className="h-4 w-4" />
                    </span>
                    <div className="leading-none">
                        <p className="font-display text-sm font-bold tracking-wider text-white">BEATWAVE</p>
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">DJ Copilot Studio</p>
                    </div>
                </div>

                {master && (
                    <div className="ml-2 hidden min-w-0 items-center gap-2.5 rounded-lg border border-zinc-900 bg-zinc-950 py-1 pl-1 pr-3 md:flex">
                        <img src={master.cover} alt="" className="h-8 w-8 rounded-md object-cover" crossOrigin="anonymous" />
                        <div className="min-w-0 leading-tight">
                            <p className="font-mono text-[9px] uppercase tracking-widest text-cyan-400">Deck Master</p>
                            <p className="max-w-[200px] truncate text-xs text-zinc-200">{master.title}</p>
                        </div>
                        <span className="ml-1 font-mono text-sm font-semibold tabular-nums text-white">{master.bpm}</span>
                        <KeyBadge camelot={master.key} relation="perfect" />
                    </div>
                )}

                <div className="ml-auto flex items-center gap-2">
                    {issues > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setFilters((f) => ({ ...f, issuesOnly: !f.issuesOnly }));
                                setMobileTab("library");
                            }}
                            className="flex items-center gap-1.5 rounded-md border border-rose-500/40 px-2 py-1 font-mono text-[10px] uppercase text-rose-400 hover:bg-rose-500/10"
                        >
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" aria-hidden="true" />
                            {issues} anomalías
                        </button>
                    )}
                    <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase text-zinc-500 sm:flex" title={API_STATUS[apiStatus].title}>
                        <span className={cx("h-1.5 w-1.5 rounded-full", API_STATUS[apiStatus].dot)} aria-hidden="true" />
                        {API_STATUS[apiStatus].label}
                    </span>
                    <Menu
                        label="Exportar y ajustes"
                        items={[
                            { key: "rb", label: "Exportar Rekordbox XML", icon: "download", onSelect: () => requestExport("rekordbox", "Rekordbox") },
                            { key: "serato", label: "Exportar Serato Crates", icon: "download", onSelect: () => requestExport("serato", "Serato") },
                            { key: "traktor", label: "Exportar Traktor NML", icon: "download", onSelect: () => requestExport("traktor", "Traktor") },
                        ]}
                    />
                </div>
            </header>

            <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[280px_minmax(0,1fr)_400px] 2xl:grid-cols-[320px_minmax(0,1fr)_460px]">
                <aside className="flex min-h-0 flex-col gap-5 overflow-y-auto border-r border-zinc-900 p-4" aria-label="Ingesta">
                    <FileDropzone onFiles={ingest} compact />
                    <IngestionQueue items={queue} onClearDone={() => setQueue((q) => q.filter((i) => i.estado !== "listo"))} />
                </aside>
                <main className="flex min-h-0 flex-col" aria-label="Biblioteca">
                    {libraryPane}
                </main>
                <aside className="min-h-0 overflow-y-auto border-l border-zinc-900" aria-label="Inspector de pista">
                    <TrackInspector {...inspectorProps} view={inspectorView} onViewChange={setInspectorView} showTabs />
                </aside>
            </div>

            <div className="flex min-h-0 flex-1 flex-col lg:hidden">
                <main className="min-h-0 flex-1 overflow-y-auto">
                    {mobileTab === "library" ? libraryPane : <TrackInspector {...inspectorProps} view={mobileTab} showTabs={false} />}
                </main>

                {mobileTab === "library" && selected && (
                    <button
                        type="button"
                        onClick={() => setMobileTab("cues")}
                        className="flex items-center gap-3 border-t border-zinc-900 bg-zinc-950 px-3 py-2 text-left"
                    >
                        <img src={selected.cover} alt="" className="h-9 w-9 rounded-md object-cover" crossOrigin="anonymous" />
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-white">{selected.title}</span>
                            <span className="block truncate text-xs text-zinc-500">{selected.artist}</span>
                        </span>
                        <span className="font-mono text-sm font-semibold tabular-nums text-white">{selected.bpm}</span>
                        <KeyBadge camelot={selected.key} relation={selected.id === masterId ? "perfect" : (matchFor(selected) || {}).relation} />
                    </button>
                )}

                <nav aria-label="Navegación principal" className="grid shrink-0 grid-cols-3 border-t border-zinc-900 bg-black pb-[env(safe-area-inset-bottom)]">
                    {MOBILE_TABS.map((tab) => {
                        const active = mobileTab === tab.value;
                        return (
                            <button
                                key={tab.value}
                                type="button"
                                aria-current={active ? "page" : undefined}
                                onClick={() => setMobileTab(tab.value)}
                                className={cx(
                                    "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400",
                                    active ? "text-cyan-300" : "text-zinc-500"
                                )}
                            >
                                {active && <span className="absolute inset-x-8 top-0 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" aria-hidden="true" />}
                                <Icon name={tab.icon} className="h-5 w-5" />
                                {tab.label}
                                {tab.value === "library" && activeIngest > 0 && (
                                    <span className="absolute right-[30%] top-2 h-2 w-2 animate-pulse rounded-full bg-cyan-400" aria-label={`${activeIngest} pistas analizándose`} />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <Sheet open={importOpen} onClose={() => setImportOpen(false)} title="Importar música">
                <div className="flex flex-col gap-5">
                    <FileDropzone onFiles={ingest} />
                    <IngestionQueue items={queue} onClearDone={() => setQueue((q) => q.filter((i) => i.estado !== "listo"))} />
                </div>
            </Sheet>

            <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-6" aria-live="polite">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cx(
                            "flex items-center gap-2 rounded-lg border bg-zinc-950/95 px-3 py-2 text-sm shadow-2xl shadow-black backdrop-blur",
                            toast.tone === "bad" ? "border-rose-500/50 text-rose-300" : "border-emerald-400/40 text-emerald-300"
                        )}
                    >
                        <Icon name={toast.tone === "bad" ? "alert" : "check"} className="h-4 w-4" />
                        {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
}
