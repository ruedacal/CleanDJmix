import { api } from "../api/endpoints.js";
import { Icon } from "./Icon.jsx";
import { Button, SectionLabel, cx } from "./primitives.jsx";

const { useEffect, useState } = React;

export function FingerprintTrigger({ status, onStart }) {
    const listening = status === "listening";
    return (
        <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative flex h-40 w-40 items-center justify-center">
                {listening && (
                    <>
                        <span className="absolute inset-0 animate-ping rounded-full border border-cyan-400/40" aria-hidden="true" />
                        <span className="absolute inset-4 animate-ping rounded-full border border-cyan-400/30 [animation-delay:400ms]" aria-hidden="true" />
                    </>
                )}
                <button
                    type="button"
                    onClick={onStart}
                    disabled={listening}
                    aria-label={listening ? "Escuchando huella acústica" : "Iniciar identificación acústica"}
                    className={cx(
                        "relative flex h-32 w-32 flex-col items-center justify-center gap-1.5 rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-950 active:scale-95",
                        listening
                            ? "border-cyan-400 bg-cyan-400/10 text-cyan-300 shadow-[0_0_60px_-10px_rgba(34,211,238,0.9)]"
                            : "border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-cyan-400/60 hover:text-cyan-300 hover:shadow-[0_0_40px_-12px_rgba(34,211,238,0.8)]"
                    )}
                >
                    <Icon name="radar" className={cx("h-8 w-8", listening && "animate-spin [animation-duration:2.5s]")} />
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-widest">{listening ? "Escuchando" : "Identificar"}</span>
                </button>
            </div>
            <p className="text-center text-xs text-zinc-500" aria-live="polite">
                {listening ? "Generando huella de 10 s y consultando la red…" : status === "error" ? "Sin coincidencias. Prueba otro fragmento." : "Huella acústica de la pista seleccionada."}
            </p>
        </div>
    );
}

const FIELDS = [
    ["title", "Título"],
    ["artist", "Artista"],
    ["album", "Álbum"],
    ["label", "Sello"],
    ["year", "Año"],
    ["genre", "Género"],
    ["isrc", "ISRC"],
];

export function MetaInspector({ track, candidates, selectedId, onSelectCandidate, fields, onToggleField }) {
    const candidate = candidates.find((c) => c.id === selectedId);
    return (
        <div className="flex flex-col gap-3">
            <SectionLabel>Candidatos ({candidates.length})</SectionLabel>
            <div role="radiogroup" aria-label="Candidatos de identificación" className="flex flex-col gap-1.5">
                {candidates.map((c) => {
                    const active = c.id === selectedId;
                    const tone = c.confidence >= 85 ? "text-emerald-400" : c.confidence >= 60 ? "text-amber-300" : "text-rose-400";
                    return (
                        <button
                            key={c.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => onSelectCandidate(c.id)}
                            className={cx(
                                "flex items-center gap-3 rounded-lg border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                                active ? "border-cyan-400/60 bg-cyan-400/5" : "border-zinc-900 bg-zinc-950 hover:border-zinc-700"
                            )}
                        >
                            <img src={c.cover} alt="" className="h-11 w-11 shrink-0 rounded-md object-cover" crossOrigin="anonymous" />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-zinc-100">{c.title}</span>
                                <span className="block truncate text-xs text-zinc-500">
                                    {c.artist} · {c.label} · {c.year}
                                </span>
                            </span>
                            <span className={cx("font-mono text-sm font-semibold tabular-nums", tone)}>{c.confidence}%</span>
                        </button>
                    );
                })}
            </div>

            {candidate && (
                <fieldset className="rounded-xl border border-zinc-900">
                    <legend className="sr-only">Campos a sobrescribir</legend>
                    <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 border-b border-zinc-900 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                        <span className="w-4" />
                        <span>Actual</span>
                        <span>Propuesto</span>
                    </div>
                    {FIELDS.map(([key, label]) => {
                        const current = track[key] != null ? String(track[key]) : "—";
                        const proposed = String(candidate[key] ?? "—");
                        const changed = current !== proposed;
                        return (
                            <label key={key} className="grid cursor-pointer grid-cols-[auto_1fr_1fr] items-center gap-x-3 border-b border-zinc-900 px-3 py-2 last:border-0 hover:bg-zinc-900/40">
                                <input
                                    type="checkbox"
                                    checked={fields[key]}
                                    onChange={() => onToggleField(key)}
                                    className="h-4 w-4 rounded border-zinc-700 bg-black accent-cyan-400"
                                    aria-label={`Sobrescribir ${label}`}
                                />
                                <span className="min-w-0">
                                    <span className="block font-mono text-[9px] uppercase text-zinc-600">{label}</span>
                                    <span className="block truncate text-xs text-zinc-500">{current}</span>
                                </span>
                                <span className={cx("truncate text-xs", changed ? "text-cyan-200" : "text-zinc-500")}>{proposed}</span>
                            </label>
                        );
                    })}
                </fieldset>
            )}
        </div>
    );
}

const TARGETS = [
    { value: "id3", label: "Tags del archivo", hint: "ID3 / Vorbis" },
    { value: "serato", label: "Serato", hint: "Crates XML" },
    { value: "rekordbox", label: "Rekordbox", hint: "master.db" },
    { value: "traktor", label: "Traktor", hint: "NML" },
    { value: "virtualdj", label: "VirtualDJ", hint: "database.xml" },
];

export function TargetSelector({ value, onChange }) {
    const toggle = (target) => onChange(value.includes(target) ? value.filter((t) => t !== target) : [...value, target]);
    return (
        <fieldset className="flex flex-col gap-2">
            <legend className="mb-2">
                <SectionLabel>Destino de sincronización</SectionLabel>
            </legend>
            <div className="grid grid-cols-2 gap-1.5">
                {TARGETS.map((target) => {
                    const active = value.includes(target.value);
                    return (
                        <button
                            key={target.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggle(target.value)}
                            className={cx(
                                "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                                active ? "border-emerald-400/50 bg-emerald-400/5" : "border-zinc-900 hover:border-zinc-700"
                            )}
                        >
                            <span className={cx("flex h-4 w-4 shrink-0 items-center justify-center rounded border", active ? "border-emerald-400 bg-emerald-400 text-zinc-950" : "border-zinc-700")}>
                                {active && <Icon name="check" className="h-3 w-3" strokeWidth={3} />}
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-xs font-medium text-zinc-100">{target.label}</span>
                                <span className="block font-mono text-[9px] text-zinc-600">{target.hint}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
}

const DEFAULT_FIELDS = { title: true, artist: true, album: true, label: true, year: true, genre: false, isrc: true };

export function AcousticPanel({ track, onApplied, notify }) {
    const [status, setStatus] = useState("idle");
    const [candidates, setCandidates] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [fields, setFields] = useState(DEFAULT_FIELDS);
    const [targets, setTargets] = useState(["id3", "rekordbox"]);
    const [injecting, setInjecting] = useState(false);

    useEffect(() => {
        setStatus("idle");
        setCandidates([]);
        setSelectedId(null);
    }, [track.id]);

    const identify = async () => {
        setStatus("listening");
        try {
            const { candidates: result = [] } = (await api.tracks.fingerprint(track.id)) || {};
            setCandidates(result);
            setSelectedId(result[0] ? result[0].id : null);
            setStatus(result.length ? "done" : "error");
        } catch (error) {
            console.error("[studio] POST /api/tracks/fingerprint", error);
            setStatus("error");
        }
    };

    const inject = async () => {
        const candidate = candidates.find((c) => c.id === selectedId);
        if (!candidate) return;
        const datos = Object.fromEntries(Object.keys(fields).filter((k) => fields[k]).map((k) => [k, candidate[k]]));
        setInjecting(true);
        try {
            await api.tracks.updateMetadata(track.id, datos, targets);
            onApplied(track.id, datos);
            notify(`Metadatos inyectados en ${targets.length} destino${targets.length > 1 ? "s" : ""}`, "good");
        } catch (error) {
            console.error("[studio] inyectar_metadatos_dj", error);
            notify("No se pudieron escribir los metadatos", "bad");
        } finally {
            setInjecting(false);
        }
    };

    const anyField = Object.values(fields).some(Boolean);

    return (
        <div className="flex flex-col gap-5">
            <FingerprintTrigger status={status} onStart={identify} />
            {candidates.length > 0 && (
                <>
                    <MetaInspector
                        track={track}
                        candidates={candidates}
                        selectedId={selectedId}
                        onSelectCandidate={setSelectedId}
                        fields={fields}
                        onToggleField={(key) => setFields((f) => ({ ...f, [key]: !f[key] }))}
                    />
                    <TargetSelector value={targets} onChange={setTargets} />
                    <Button variant="success" size="lg" disabled={injecting || !targets.length || !anyField} onClick={inject} className="w-full">
                        <Icon name={injecting ? "refresh" : "save"} className={cx("h-4 w-4", injecting && "animate-spin")} />
                        {injecting ? "Escribiendo…" : "Inyectar metadatos"}
                    </Button>
                </>
            )}
        </div>
    );
}
