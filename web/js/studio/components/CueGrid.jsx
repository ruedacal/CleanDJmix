import { CUE_COLORS } from "../demo-data.js";
import { Icon } from "./Icon.jsx";
import { Button, cx, formatTime } from "./primitives.jsx";

export function CueTrigger({ index, cue, selected, onTrigger }) {
    const color = cue ? cue.color : CUE_COLORS[index];
    return (
        <button
            type="button"
            onClick={() => onTrigger(index)}
            aria-pressed={selected}
            aria-label={cue ? `Hot cue ${index + 1}: ${cue.name}, ${formatTime(cue.time)}` : `Hot cue ${index + 1} vacío: fijar en el playhead`}
            className={cx(
                "relative flex min-h-[64px] flex-col justify-between rounded-lg border p-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97]",
                cue ? "bg-zinc-950" : "border-dashed border-zinc-800 bg-transparent hover:border-zinc-600"
            )}
            style={
                cue
                    ? {
                          borderColor: selected ? color : `${color}66`,
                          boxShadow: selected ? `0 0 18px -4px ${color}, inset 0 0 14px -8px ${color}` : undefined,
                      }
                    : undefined
            }
        >
            <span className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold" style={{ color: cue ? color : "#52525b" }}>
                    {index + 1}
                </span>
                {cue ? (
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                ) : (
                    <Icon name="target" className="h-3 w-3 text-zinc-700" />
                )}
            </span>
            {cue ? (
                <span className="min-w-0">
                    <span className="block truncate text-[11px] font-medium text-zinc-100">{cue.name}</span>
                    <span className="block font-mono text-[10px] tabular-nums text-zinc-500">{formatTime(cue.time).slice(0, 5)}</span>
                </span>
            ) : (
                <span className="font-mono text-[10px] uppercase text-zinc-600">Fijar</span>
            )}
        </button>
    );
}

export function CueGrid({ cues, selected, onTrigger }) {
    return (
        <div className="grid grid-cols-4 gap-2" role="group" aria-label="Matriz de 8 Hot Cues (teclas 1-8)">
            {cues.map((cue, index) => (
                <CueTrigger key={index} index={index} cue={cue} selected={selected === index} onTrigger={onTrigger} />
            ))}
        </div>
    );
}

export function CueEditor({ index, cue, bpm, onChange, onCommit, onDelete, onSetAtPlayhead }) {
    if (index == null) {
        return <p className="rounded-lg border border-zinc-900 px-3 py-3 text-center text-xs text-zinc-600">Pulsa un pad para editar su etiqueta y posición.</p>;
    }
    const beat = 60 / bpm;
    const nudge = (delta) => cue && onCommit({ ...cue, time: Math.max(0, cue.time + delta) });
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-900 bg-zinc-950 p-3">
            <div className="flex items-center gap-2">
                <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold text-zinc-950"
                    style={{ backgroundColor: cue ? cue.color : CUE_COLORS[index] }}
                >
                    {index + 1}
                </span>
                <label className="min-w-0 flex-1">
                    <span className="sr-only">Etiqueta del hot cue {index + 1}</span>
                    <input
                        type="text"
                        value={cue ? cue.name : ""}
                        disabled={!cue}
                        placeholder="Pad vacío"
                        maxLength={32}
                        onChange={(e) => onChange({ ...cue, name: e.target.value })}
                        onBlur={() => cue && onCommit(cue)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) e.currentTarget.blur();
                        }}
                        className="h-10 w-full rounded-lg border border-zinc-800 bg-black px-3 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-400/60 focus:outline-none disabled:opacity-50"
                    />
                </label>
                <span className="hidden font-mono text-xs tabular-nums text-cyan-300 sm:block">{cue ? formatTime(cue.time) : "--:--.--"}</span>
            </div>

            {cue && (
                <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Color del cue">
                    {CUE_COLORS.map((color) => (
                        <button
                            key={color}
                            type="button"
                            role="radio"
                            aria-checked={cue.color === color}
                            aria-label={`Color ${color}`}
                            onClick={() => onCommit({ ...cue, color })}
                            className={cx("h-6 w-6 rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white", cue.color === color && "scale-110 ring-2 ring-white/80 ring-offset-2 ring-offset-zinc-950")}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
                {cue &&
                    [
                        ["-1 compás", -beat * 4],
                        ["-1 beat", -beat],
                        ["+1 beat", beat],
                        ["+1 compás", beat * 4],
                    ].map(([label, delta]) => (
                        <Button key={label} size="sm" variant="outline" className="font-mono" onClick={() => nudge(delta)}>
                            {label}
                        </Button>
                    ))}
                <div className="ml-auto flex gap-1.5">
                    {cue && (
                        <Button size="sm" variant="danger" onClick={onDelete} aria-label={`Borrar hot cue ${index + 1}`}>
                            <Icon name="trash" className="h-3.5 w-3.5" />
                        </Button>
                    )}
                    <Button size="sm" variant="primary" onClick={onSetAtPlayhead}>
                        <Icon name="target" className="h-3.5 w-3.5" />
                        Fijar en playhead
                    </Button>
                </div>
            </div>
        </div>
    );
}
