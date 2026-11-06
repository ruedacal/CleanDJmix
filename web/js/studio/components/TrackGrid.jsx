import { Icon } from "./Icon.jsx";
import { SortHeader } from "./SortHeader.jsx";
import { CompatibilityBadge, EnergyMeter, KeyBadge, QualityBadge } from "./CompatibilityBadge.jsx";
import { IconButton, Menu, Toggle, cx } from "./primitives.jsx";

function rowActions(track, onAction) {
    return [
        { key: "master", label: "Cargar en Deck Master", icon: "disc", onSelect: () => onAction("master", track) },
        { key: "cues", label: "Abrir en Cue Editor", icon: "cues", onSelect: () => onAction("cues", track) },
        { key: "radar", label: "Identificar acústicamente", icon: "radar", onSelect: () => onAction("radar", track) },
        { key: "sep", separator: true },
        { key: "reveal", label: "Copiar ruta del archivo", icon: "folder", onSelect: () => onAction("copyPath", track) },
    ];
}

export function LibraryToolbar({ filters, onFilters, master, resultCount, totalCount, onImport }) {
    return (
        <div className="flex flex-col gap-2 border-b border-zinc-900 px-3 py-3 lg:px-4">
            <div className="flex items-center gap-2">
                <label className="relative flex-1">
                    <span className="sr-only">Filtrar biblioteca</span>
                    <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                    <input
                        type="search"
                        value={filters.query}
                        onChange={(e) => onFilters({ query: e.target.value })}
                        placeholder="Título, artista o género"
                        className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-400/60 focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
                    />
                </label>
                {onImport && (
                    <IconButton label="Importar pistas" icon="upload" onClick={onImport} className="h-10 w-10 border border-zinc-800 lg:hidden" />
                )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
                <Toggle pressed={filters.bpmLock} onChange={(v) => onFilters({ bpmLock: v })} icon="lock">
                    BPM ±5%
                </Toggle>
                <Toggle pressed={filters.keyLock} onChange={(v) => onFilters({ keyLock: v })} icon="target">
                    Armónicas
                </Toggle>
                <Toggle pressed={filters.issuesOnly} onChange={(v) => onFilters({ issuesOnly: v })} icon="alert">
                    Anomalías
                </Toggle>
                <span className="ml-auto shrink-0 pl-2 font-mono text-[10px] tabular-nums text-zinc-600">
                    {resultCount}/{totalCount}
                </span>
            </div>
            {master && (filters.bpmLock || filters.keyLock) && (
                <p className="font-mono text-[10px] text-zinc-500">
                    {"Referencia: "}
                    <span className="text-cyan-300">
                        {master.bpm} BPM · {master.key}
                    </span>
                    {` — ${master.title}`}
                </p>
            )}
        </div>
    );
}

export function TrackGrid({ rows, masterId, selectedId, sort, onSort, onSelect, onAction }) {
    if (!rows.length) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                <Icon name="search" className="h-6 w-6 text-zinc-700" />
                <p className="text-sm text-zinc-400">Ninguna pista cumple los filtros.</p>
                <p className="text-xs text-zinc-600">Desactiva BPM ±5% o Armónicas para ampliar la búsqueda.</p>
            </div>
        );
    }

    return (
        <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="hidden w-full table-fixed border-separate border-spacing-0 text-sm xl:table">
                <caption className="sr-only">Biblioteca analizada con compatibilidad de mezcla respecto al Deck Master</caption>
                <thead className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur">
                    <tr className="text-left">
                        <SortHeader field="title" sort={sort} onSort={onSort} className="pl-4">
                            Pista
                        </SortHeader>
                        <SortHeader field="bpm" sort={sort} onSort={onSort} align="right" className="w-[72px] text-right">
                            BPM
                        </SortHeader>
                        <SortHeader field="key" sort={sort} onSort={onSort} className="w-[64px]">
                            Key
                        </SortHeader>
                        <SortHeader field="match" sort={sort} onSort={onSort} align="right" className="w-[76px] text-right">
                            Match
                        </SortHeader>
                        <SortHeader field="energy" sort={sort} onSort={onSort} className="w-[84px]">
                            Energía
                        </SortHeader>
                        <th scope="col" className="w-[72px] px-2 py-2 text-left font-mono text-[10px] font-normal uppercase tracking-[0.14em] text-zinc-500">
                            Audio
                        </th>
                        <th scope="col" className="w-[44px] pr-3">
                            <span className="sr-only">Acciones</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(({ track, match }) => {
                        const selected = track.id === selectedId;
                        const isMaster = track.id === masterId;
                        return (
                            <tr
                                key={track.id}
                                onClick={() => onSelect(track)}
                                onDoubleClick={() => onAction("master", track)}
                                aria-selected={selected}
                                className={cx(
                                    "group cursor-pointer transition-colors",
                                    selected ? "bg-cyan-400/[0.06]" : "hover:bg-zinc-900/60"
                                )}
                            >
                                <td className={cx("border-b border-zinc-900 py-2 pl-4 pr-2", selected && "shadow-[inset_2px_0_0_0_#22d3ee]")}>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelect(track);
                                        }}
                                        className="flex w-full min-w-0 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                                    >
                                        <img src={track.cover} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" crossOrigin="anonymous" />
                                        <span className="min-w-0">
                                            <span className={cx("block truncate font-medium", selected ? "text-cyan-200" : "text-zinc-100")}>{track.title}</span>
                                            <span className="block truncate text-xs text-zinc-500">
                                                {track.artist} · {track.subgenre}
                                            </span>
                                        </span>
                                    </button>
                                </td>
                                <td className="border-b border-zinc-900 px-2 text-right font-mono text-base font-semibold tabular-nums text-white">{track.bpm}</td>
                                <td className="border-b border-zinc-900 px-2">
                                    <KeyBadge camelot={track.key} relation={isMaster ? "perfect" : match && match.relation} />
                                </td>
                                <td className="border-b border-zinc-900 px-2 text-right">
                                    <CompatibilityBadge match={match} isReference={isMaster} />
                                </td>
                                <td className="border-b border-zinc-900 px-2">
                                    <EnergyMeter value={track.energy} />
                                </td>
                                <td className="border-b border-zinc-900 px-2">
                                    <QualityBadge track={track} />
                                </td>
                                <td className="border-b border-zinc-900 pr-3" onClick={(e) => e.stopPropagation()}>
                                    <Menu label={`Acciones para ${track.title}`} items={rowActions(track, onAction)} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <ul className="divide-y divide-zinc-900 xl:hidden" aria-label="Biblioteca">
                {rows.map(({ track, match }) => {
                    const selected = track.id === selectedId;
                    const isMaster = track.id === masterId;
                    return (
                        <li key={track.id} className={cx("flex items-center", selected && "bg-cyan-400/[0.06] shadow-[inset_2px_0_0_0_#22d3ee]")}>
                            <button
                                type="button"
                                onClick={() => onSelect(track)}
                                aria-current={selected ? "true" : undefined}
                                className="flex min-h-[64px] min-w-0 flex-1 items-center gap-3 py-2 pl-3 pr-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"
                            >
                                <img src={track.cover} alt="" className="h-11 w-11 shrink-0 rounded-md object-cover" crossOrigin="anonymous" />
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1.5">
                                        <span className={cx("truncate text-sm font-medium", selected ? "text-cyan-200" : "text-zinc-100")}>{track.title}</span>
                                        {track.quality !== "verified" && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-label="Anomalía de audio" />}
                                    </span>
                                    <span className="block truncate text-xs text-zinc-500">{track.artist}</span>
                                </span>
                                <span className="font-mono text-base font-semibold tabular-nums text-white">{track.bpm}</span>
                                <KeyBadge camelot={track.key} relation={isMaster ? "perfect" : match && match.relation} />
                                <span className="w-12 text-right">
                                    <CompatibilityBadge match={match} isReference={isMaster} />
                                </span>
                            </button>
                            <div className="pr-1">
                                <Menu label={`Acciones para ${track.title}`} items={rowActions(track, onAction)} />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
