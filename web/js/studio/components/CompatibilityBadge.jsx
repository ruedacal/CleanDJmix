import { matchTone, RELATION_LABEL } from "../camelot.js";
import { cx } from "./primitives.jsx";

const MATCH_TEXT = { good: "text-emerald-400", warn: "text-amber-300", bad: "text-zinc-500", muted: "text-zinc-600" };
const MATCH_BAR = { good: "bg-emerald-400", warn: "bg-amber-300", bad: "bg-zinc-600", muted: "bg-zinc-700" };

export function CompatibilityBadge({ match, isReference, size = "md" }) {
    if (isReference) {
        return (
            <span className="inline-flex items-center rounded border border-cyan-400/40 bg-cyan-400/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                Master
            </span>
        );
    }
    const score = match ? match.score : null;
    const tone = matchTone(score);
    return (
        <span className="inline-flex flex-col items-end gap-1" title={match ? RELATION_LABEL[match.relation] : undefined}>
            <span className={cx("font-mono font-semibold tabular-nums", size === "lg" ? "text-lg" : "text-sm", MATCH_TEXT[tone])}>
                {score == null ? "--" : `${score}%`}
            </span>
            <span className="h-0.5 w-10 overflow-hidden rounded-full bg-zinc-800" aria-hidden="true">
                <span className={cx("block h-full", MATCH_BAR[tone])} style={{ width: `${score || 0}%` }} />
            </span>
        </span>
    );
}

const KEY_TONE = {
    perfect: "border-emerald-400/50 text-emerald-300 bg-emerald-400/10",
    adjacent: "border-emerald-400/30 text-emerald-300",
    relative: "border-emerald-400/30 text-emerald-300",
    energy: "border-amber-300/30 text-amber-200",
    clash: "border-zinc-800 text-zinc-400",
    unknown: "border-zinc-800 text-zinc-400",
};

export function KeyBadge({ camelot, relation, size = "md" }) {
    return (
        <span
            className={cx(
                "inline-flex items-center justify-center rounded border font-mono font-semibold tabular-nums",
                size === "lg" ? "h-8 min-w-[3rem] px-2 text-base" : "h-6 min-w-[2.5rem] px-1.5 text-xs",
                KEY_TONE[relation || "unknown"]
            )}
        >
            {camelot}
        </span>
    );
}

const LOSSLESS = new Set(["FLAC", "WAV", "AIFF"]);

export function QualityBadge({ track }) {
    if (track.quality === "fake") {
        return (
            <span className="inline-flex items-center gap-1 rounded border border-rose-500/50 bg-rose-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-rose-400" title="Corte espectral a 16 kHz: transcodificado desde MP3">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" aria-hidden="true" />
                Fake
            </span>
        );
    }
    if (track.quality === "corrupt") {
        return (
            <span className="inline-flex items-center gap-1 rounded border border-rose-500/50 bg-rose-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-rose-400" title="Frames dañados detectados">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" aria-hidden="true" />
                Error
            </span>
        );
    }
    const lossless = LOSSLESS.has(track.format);
    return (
        <span
            className={cx(
                "inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase",
                lossless ? "border-emerald-400/20 text-emerald-400/90" : "border-zinc-800 text-zinc-500"
            )}
            title={track.bitrate}
        >
            {track.format}
        </span>
    );
}

export function EnergyMeter({ value }) {
    return (
        <span className="flex items-center gap-1.5" aria-label={`Energía ${value}%`}>
            <span className="flex h-3 items-end gap-px" aria-hidden="true">
                {[20, 40, 60, 80, 100].map((step) => (
                    <span
                        key={step}
                        className={cx("w-1 rounded-sm", value >= step - 10 ? "bg-cyan-400" : "bg-zinc-800")}
                        style={{ height: `${step}%` }}
                    />
                ))}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-zinc-500">{value}</span>
        </span>
    );
}
