import { api } from "../api/endpoints.js";
import { CUE_COLORS, buildClubCues } from "../demo-data.js";
import { AudioWaveCanvas } from "./AudioWaveCanvas.jsx";
import { CueEditor, CueGrid } from "./CueGrid.jsx";
import { Icon } from "./Icon.jsx";
import { Menu, SectionLabel, cx, formatTime } from "./primitives.jsx";

const { useCallback, useEffect, useRef, useState } = React;

const ZOOMS = [1, 4, 8, 16];

export function CuePanel({ track, onCuesChange, notify }) {
    const deckRef = useRef({ pos: 0, playing: false, rate: 1 });
    const timeLabelRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [zoom, setZoom] = useState(4);
    const [selectedCue, setSelectedCue] = useState(0);
    const [draft, setDraft] = useState(track.cues);
    const draftRef = useRef(draft);
    draftRef.current = draft;

    useEffect(() => {
        deckRef.current.pos = 0;
        deckRef.current.playing = false;
        setPlaying(false);
        setDraft(track.cues);
        setSelectedCue(0);
    }, [track.id]);

    const seek = useCallback(
        (time) => {
            deckRef.current.pos = Math.min(Math.max(0, time), track.duration);
        },
        [track.duration]
    );

    const togglePlay = useCallback(() => {
        const deck = deckRef.current;
        if (deck.pos >= track.duration) deck.pos = 0;
        deck.playing = !deck.playing;
        setPlaying(deck.playing);
    }, [track.duration]);

    const commitCue = useCallback(
        async (index, cue) => {
            const next = draftRef.current.map((c, i) => (i === index ? cue : c));
            setDraft(next);
            onCuesChange(track.id, next);
            try {
                if (cue) await api.cues.save(track.id, index, { positionMs: Math.round(cue.time * 1000), color: cue.color, name: cue.name });
                else await api.cues.remove(track.id, index);
            } catch (error) {
                console.error("[studio] PUT/DELETE /api/tracks/:id/cues/:index", error);
                notify(`No se pudo guardar el cue ${index + 1}`, "bad");
            }
        },
        [track.id, onCuesChange, notify]
    );

    const setAtPlayhead = useCallback(
        (index) => {
            const existing = draftRef.current[index];
            const cue = { index, name: existing ? existing.name : `Cue ${index + 1}`, color: existing ? existing.color : CUE_COLORS[index], time: deckRef.current.pos };
            commitCue(index, cue);
        },
        [commitCue]
    );

    const triggerPad = useCallback(
        (index) => {
            setSelectedCue(index);
            const cue = draftRef.current[index];
            if (cue) seek(cue.time);
            else setAtPlayhead(index);
        },
        [seek, setAtPlayhead]
    );

    useEffect(() => {
        const onKey = (event) => {
            const tag = event.target.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || event.metaKey || event.ctrlKey) return;
            if (event.code === "Space" && tag !== "BUTTON") {
                event.preventDefault();
                togglePlay();
            } else if (/^[1-8]$/.test(event.key)) {
                triggerPad(Number(event.key) - 1);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [togglePlay, triggerPad]);

    const readExisting = async () => {
        try {
            const { cues } = await api.cues.list(track.id);
            if (Array.isArray(cues)) {
                setDraft(cues);
                onCuesChange(track.id, cues);
                notify(`${cues.filter(Boolean).length} cues leídos del software DJ`, "good");
            }
        } catch (error) {
            console.error("[studio] GET /api/tracks/:id/cues", error);
            notify("No se pudieron leer los cues existentes", "bad");
        }
    };

    const autoGenerate = () => {
        const cues = buildClubCues(track.bpm, track.duration);
        cues.forEach((cue, index) => commitCue(index, cue));
        notify("Plantilla Club aplicada a los 8 pads", "good");
    };

    const clearAll = () => draftRef.current.forEach((_, index) => commitCue(index, null));

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => seek(draft[selectedCue] ? draft[selectedCue].time : 0)}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-amber-300/70 font-mono text-[11px] font-bold text-amber-300 transition-colors hover:bg-amber-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 active:scale-95"
                    aria-label="Volver al cue seleccionado"
                >
                    CUE
                </button>
                <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={playing ? "Pausar" : "Reproducir"}
                    className={cx(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95",
                        playing ? "border-emerald-400 bg-emerald-400 text-zinc-950 shadow-[0_0_24px_-4px_rgba(52,211,153,0.9)]" : "border-emerald-400/70 text-emerald-400 hover:bg-emerald-400/10"
                    )}
                >
                    <Icon name={playing ? "pause" : "play"} className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                    <p ref={timeLabelRef} className="font-mono text-xl font-semibold tabular-nums text-white" aria-live="off">
                        00:00.00
                    </p>
                    <p className="font-mono text-[10px] tabular-nums text-zinc-600">/ {formatTime(track.duration)}</p>
                </div>
                <Menu
                    label="Acciones de cues"
                    items={[
                        { key: "auto", label: "Auto-generar (Plantilla Club)", icon: "sparkles", onSelect: autoGenerate },
                        { key: "read", label: "Leer cues de Serato/Rekordbox", icon: "download", onSelect: readExisting },
                        { key: "sep", separator: true },
                        { key: "clear", label: "Borrar los 8 cues", icon: "trash", danger: true, onSelect: clearAll },
                    ]}
                />
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <SectionLabel>Forma de onda · 3 bandas</SectionLabel>
                    <div className="flex rounded-md border border-zinc-900 p-0.5" role="group" aria-label="Zoom horizontal">
                        {ZOOMS.map((z) => (
                            <button
                                key={z}
                                type="button"
                                aria-pressed={zoom === z}
                                onClick={() => setZoom(z)}
                                className={cx("rounded px-2 py-0.5 font-mono text-[10px] transition-colors", zoom === z ? "bg-cyan-400 text-zinc-950" : "text-zinc-500 hover:text-zinc-200")}
                            >
                                {z}x
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-44 rounded-lg border border-zinc-900 bg-black p-1.5 sm:h-52">
                    <AudioWaveCanvas
                        track={track}
                        cues={draft}
                        deckRef={deckRef}
                        zoom={zoom}
                        selectedCue={selectedCue}
                        onSeek={seek}
                        timeLabelRef={timeLabelRef}
                        onEnded={() => setPlaying(false)}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <SectionLabel>Hot Cues · teclas 1–8</SectionLabel>
                <CueGrid cues={draft} selected={selectedCue} onTrigger={triggerPad} />
            </div>

            <CueEditor
                index={selectedCue}
                cue={draft[selectedCue]}
                bpm={track.bpm}
                onChange={(cue) => setDraft((d) => d.map((c, i) => (i === selectedCue ? cue : c)))}
                onCommit={(cue) => commitCue(selectedCue, cue)}
                onDelete={() => commitCue(selectedCue, null)}
                onSetAtPlayhead={() => setAtPlayhead(selectedCue)}
            />
        </div>
    );
}
