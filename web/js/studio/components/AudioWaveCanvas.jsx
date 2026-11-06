import { barSeconds } from "../demo-data.js";
import { formatTime } from "./primitives.jsx";

const { useEffect, useMemo, useRef } = React;

const SAMPLES = 2400;
const OVERVIEW_H = 22;
const GAP = 8;

function hashSeed(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967295;
}

// Deterministic 3-band envelope that follows a club arrangement (intro → drop → breakdown → drop → outro).
// Python can replace it by sending real `peaks: { low, mid, high }` arrays on the track object.
function buildPeaks(track) {
    if (track.peaks && track.peaks.low) {
        return { low: Float32Array.from(track.peaks.low), mid: Float32Array.from(track.peaks.mid), high: Float32Array.from(track.peaks.high) };
    }
    const seed = hashSeed(track.id);
    const low = new Float32Array(SAMPLES);
    const mid = new Float32Array(SAMPLES);
    const high = new Float32Array(SAMPLES);
    const beat = 60 / track.bpm;
    const bar = barSeconds(track.bpm);
    for (let i = 0; i < SAMPLES; i++) {
        const t = (i / SAMPLES) * track.duration;
        const barIndex = t / bar;
        const inBeat = (t % beat) / beat;
        const kick = Math.exp(-inBeat * 7);
        const hat = 0.5 + 0.5 * Math.abs(Math.sin((inBeat + 0.5) * Math.PI));
        const breakdown = (barIndex >= 48 && barIndex < 64) || (barIndex >= 96 && barIndex < 112);
        const intro = barIndex < 16;
        const outro = t > track.duration - bar * 16;
        const drop = (barIndex >= 64 && barIndex < 96) || (barIndex >= 112 && !outro);
        const wobble = 0.85 + 0.15 * Math.sin(t * 0.9 + seed * 40);
        const noise = 0.92 + 0.08 * Math.sin(i * 12.9898 + seed * 78.233);
        let l = 0.25 + 0.7 * kick;
        let m = 0.35 + 0.2 * Math.sin(t * 2.1 + seed * 10);
        let h = 0.2 + 0.25 * hat;
        if (intro) {
            const ramp = barIndex / 16;
            m *= 0.4 + 0.6 * ramp;
            h *= 0.5 + 0.5 * ramp;
        }
        if (breakdown) {
            l = 0.08;
            m = 0.45 + 0.25 * Math.sin(t * 0.7 + seed);
            h = 0.18 + 0.1 * Math.sin(t * 3);
        }
        if (drop) {
            l = Math.min(1, l * 1.1);
            m *= 1.25;
            h *= 1.3;
        }
        if (outro) {
            const fade = Math.max(0.2, (track.duration - t) / (bar * 16));
            m *= fade;
            h *= fade;
        }
        low[i] = Math.min(1, l * wobble * noise);
        mid[i] = Math.min(1, m * noise);
        high[i] = Math.min(1, h * noise);
    }
    return { low, mid, high };
}

const BAND_COLORS = { low: "#0891b2", mid: "#22d3ee", high: "#e0f2fe" };

function drawBands(ctx, peaks, duration, viewStart, viewDur, x0, y0, w, h, playhead, scaleHigh) {
    const center = y0 + h / 2;
    const half = h / 2;
    const columns = Math.max(1, Math.floor(w));
    for (let x = 0; x < columns; x++) {
        const t = viewStart + (x / columns) * viewDur;
        if (t < 0 || t > duration) continue;
        const idx = Math.min(SAMPLES - 1, Math.floor((t / duration) * SAMPLES));
        ctx.globalAlpha = t < playhead ? 0.4 : 1;
        const lowH = peaks.low[idx] * half;
        const midH = peaks.mid[idx] * half * 0.72;
        const highH = peaks.high[idx] * half * scaleHigh;
        ctx.fillStyle = BAND_COLORS.low;
        ctx.fillRect(x0 + x, center - lowH, 1, lowH * 2);
        ctx.fillStyle = BAND_COLORS.mid;
        ctx.fillRect(x0 + x, center - midH, 1, midH * 2);
        ctx.fillStyle = BAND_COLORS.high;
        ctx.fillRect(x0 + x, center - highH, 1, highH * 2);
    }
    ctx.globalAlpha = 1;
}

function viewWindow(duration, pos, zoom) {
    const viewDur = duration / zoom;
    if (zoom <= 1) return { viewStart: 0, viewDur };
    const start = Math.min(Math.max(0, pos - viewDur * 0.35), Math.max(0, duration - viewDur));
    return { viewStart: start, viewDur };
}

export function AudioWaveCanvas({ track, cues, deckRef, zoom, selectedCue, onSeek, timeLabelRef, onEnded }) {
    const canvasRef = useRef(null);
    const peaks = useMemo(() => buildPeaks(track), [track.id, track.bpm, track.duration, track.peaks]);
    const live = useRef({});
    live.current = { track, cues, zoom, peaks, selectedCue, onEnded };
    const dragging = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let frame = 0;
        let last = performance.now();
        let lastLabel = "";
        let width = 0;
        let height = 0;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);
        resize();

        const render = (now) => {
            const deck = deckRef.current;
            const state = live.current;
            const duration = state.track.duration;
            const dt = Math.min(0.1, (now - last) / 1000);
            last = now;
            if (deck.playing) {
                deck.pos += dt * deck.rate;
                if (deck.pos >= duration) {
                    deck.pos = duration;
                    deck.playing = false;
                    if (state.onEnded) state.onEnded();
                }
            }

            const label = formatTime(deck.pos);
            if (timeLabelRef.current && label !== lastLabel) {
                timeLabelRef.current.textContent = label;
                lastLabel = label;
            }

            ctx.clearRect(0, 0, width, height);
            const mainY = OVERVIEW_H + GAP;
            const mainH = height - mainY;

            ctx.fillStyle = "#050507";
            ctx.fillRect(0, 0, width, OVERVIEW_H);
            drawBands(ctx, state.peaks, duration, 0, duration, 0, 0, width, OVERVIEW_H, deck.pos, 0.5);

            const { viewStart, viewDur } = viewWindow(duration, deck.pos, state.zoom);
            if (state.zoom > 1) {
                ctx.strokeStyle = "rgba(34,211,238,0.9)";
                ctx.lineWidth = 1;
                ctx.strokeRect((viewStart / duration) * width + 0.5, 0.5, Math.max(4, (viewDur / duration) * width) - 1, OVERVIEW_H - 1);
            }
            ctx.fillStyle = "#ffffff";
            ctx.fillRect((deck.pos / duration) * width - 0.5, 0, 1, OVERVIEW_H);

            ctx.fillStyle = "#030304";
            ctx.fillRect(0, mainY, width, mainH);

            const bar = barSeconds(state.track.bpm);
            const firstBar = Math.max(0, Math.floor(viewStart / bar));
            const lastBar = Math.ceil((viewStart + viewDur) / bar);
            const barPx = (bar / viewDur) * width;
            const labelEvery = barPx > 28 ? 1 : barPx > 10 ? 4 : 16;
            ctx.font = "9px 'JetBrains Mono', monospace";
            for (let b = firstBar; b <= lastBar; b++) {
                const x = ((b * bar - viewStart) / viewDur) * width;
                const phrase = b % 16 === 0;
                if (barPx < 3 && !phrase) continue;
                ctx.fillStyle = phrase ? "rgba(34,211,238,0.28)" : b % 4 === 0 ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.04)";
                ctx.fillRect(Math.round(x), mainY, 1, mainH);
                if (b % labelEvery === 0) {
                    ctx.fillStyle = phrase ? "rgba(34,211,238,0.8)" : "rgba(161,161,170,0.6)";
                    ctx.fillText(String(b + 1), Math.round(x) + 3, mainY + 10);
                }
            }

            drawBands(ctx, state.peaks, duration, viewStart, viewDur, 0, mainY + 14, width, mainH - 18, deck.pos, 0.42);

            state.cues.forEach((cue, index) => {
                if (!cue) return;
                const x = Math.round(((cue.time - viewStart) / viewDur) * width);
                const ox = Math.round((cue.time / duration) * width);
                ctx.fillStyle = cue.color;
                ctx.fillRect(ox, OVERVIEW_H - 5, 2, 5);
                if (x < -20 || x > width + 2) return;
                const active = state.selectedCue === index;
                ctx.globalAlpha = active ? 1 : 0.8;
                ctx.fillRect(x, mainY, active ? 2 : 1, mainH);
                ctx.fillRect(x, mainY + mainH - 14, 16, 14);
                ctx.globalAlpha = 1;
                ctx.fillStyle = "#09090b";
                ctx.font = "bold 9px 'JetBrains Mono', monospace";
                ctx.fillText(String(index + 1), x + 5, mainY + mainH - 4);
            });

            const px = Math.round(((deck.pos - viewStart) / viewDur) * width);
            ctx.save();
            ctx.shadowColor = "rgba(34,211,238,0.9)";
            ctx.shadowBlur = 10;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(px - 1, mainY, 2, mainH);
            ctx.restore();

            frame = requestAnimationFrame(render);
        };
        frame = requestAnimationFrame(render);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [deckRef, timeLabelRef]);

    const seekFromPointer = (event) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = Math.min(Math.max(0, event.clientX - rect.left), rect.width);
        const y = event.clientY - rect.top;
        const duration = track.duration;
        if (y <= OVERVIEW_H + GAP / 2) {
            onSeek((x / rect.width) * duration);
            return;
        }
        const { viewStart, viewDur } = viewWindow(duration, deckRef.current.pos, zoom);
        onSeek(viewStart + (x / rect.width) * viewDur);
    };

    const onKeyDown = (event) => {
        const beat = 60 / track.bpm;
        const step = event.shiftKey ? beat * 4 : beat;
        if (event.key === "ArrowRight") onSeek(deckRef.current.pos + step);
        else if (event.key === "ArrowLeft") onSeek(deckRef.current.pos - step);
        else if (event.key === "Home") onSeek(0);
        else return;
        event.preventDefault();
    };

    return (
        <canvas
            ref={canvasRef}
            role="slider"
            tabIndex={0}
            aria-label={`Forma de onda de ${track.title}. Flechas: mover 1 beat, Mayús + flechas: 1 compás`}
            aria-valuemin={0}
            aria-valuemax={Math.round(track.duration)}
            aria-valuenow={Math.round(deckRef.current.pos)}
            className="block h-full w-full cursor-crosshair touch-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            onPointerDown={(e) => {
                dragging.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                seekFromPointer(e);
            }}
            onPointerMove={(e) => dragging.current && seekFromPointer(e)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
            onKeyDown={onKeyDown}
        />
    );
}
