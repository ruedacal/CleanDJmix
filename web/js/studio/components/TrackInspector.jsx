import { RELATION_LABEL } from "../camelot.js";
import { AcousticPanel } from "./AcousticPanel.jsx";
import { CompatibilityBadge, KeyBadge, QualityBadge } from "./CompatibilityBadge.jsx";
import { CuePanel } from "./CuePanel.jsx";
import { Icon } from "./Icon.jsx";
import { Segmented, SectionLabel } from "./primitives.jsx";

export function InspectorHeader({ track, match, isMaster }) {
    const anomaly = track.quality !== "verified";
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <img src={track.cover} alt={`Carátula de ${track.title}`} className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-zinc-800" crossOrigin="anonymous" />
                <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-white">{track.title}</h2>
                    <p className="truncate text-sm text-cyan-300">{track.artist}</p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-zinc-600">
                        {track.version} · {track.subgenre}
                    </p>
                </div>
            </div>
            <dl className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-zinc-900 bg-zinc-950 px-3 py-2">
                    <dt className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">BPM</dt>
                    <dd className="font-mono text-2xl font-semibold tabular-nums text-white">{track.bpm}</dd>
                </div>
                <div className="rounded-lg border border-zinc-900 bg-zinc-950 px-3 py-2">
                    <dt className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">Key</dt>
                    <dd className="pt-0.5">
                        <KeyBadge camelot={track.key} relation={isMaster ? "perfect" : match && match.relation} size="lg" />
                    </dd>
                </div>
                <div className="rounded-lg border border-zinc-900 bg-zinc-950 px-3 py-2">
                    <dt className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">Match</dt>
                    <dd className="flex h-8 items-center">
                        <CompatibilityBadge match={match} isReference={isMaster} size="lg" />
                    </dd>
                </div>
            </dl>
            <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[10px] text-zinc-500">{isMaster ? "Pista en Deck Master" : match ? RELATION_LABEL[match.relation] : ""}</span>
                <QualityBadge track={track} />
            </div>
            {anomaly && (
                <p role="alert" className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/5 px-3 py-2 text-xs text-rose-300">
                    <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {track.quality === "fake"
                        ? "Corte espectral en 16 kHz: este FLAC proviene de un MP3. Reemplázalo antes de pinchar."
                        : "Frames dañados detectados. Puede producir silencios o clics en cabina."}
                </p>
            )}
        </div>
    );
}

export function TrackInspector({ track, match, isMaster, view, onViewChange, showTabs, onCuesChange, onMetaApplied, notify }) {
    if (!track) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
                <Icon name="disc" className="h-8 w-8 text-zinc-800" />
                <SectionLabel>Inspector</SectionLabel>
                <p className="text-sm text-zinc-500">Selecciona una pista de la biblioteca.</p>
            </div>
        );
    }
    return (
        <div className="flex flex-col gap-5 p-4">
            <InspectorHeader track={track} match={match} isMaster={isMaster} />
            {showTabs && (
                <Segmented
                    label="Herramientas del inspector"
                    value={view}
                    onChange={onViewChange}
                    options={[
                        { value: "cues", label: "Cue Editor", icon: "cues" },
                        { value: "acoustic", label: "Acústica", icon: "radar" },
                    ]}
                />
            )}
            {view === "cues" ? (
                <CuePanel track={track} onCuesChange={onCuesChange} notify={notify} />
            ) : (
                <AcousticPanel track={track} onApplied={onMetaApplied} notify={notify} />
            )}
        </div>
    );
}
