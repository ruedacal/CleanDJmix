const { useEffect, useRef } = React;
import { NV2_COLORS } from '../data/constants.js';
import { getTrackHash, computeTrackStructuralBands } from './waveformUtils.js';

// PERF: FooterMasterWaveform — OffscreenCanvas + rAF loop para que playProgressRef
// nunca dispare re-renders en App. Recibe playProgressRef (un ref, no state).
export const FooterMasterWaveform = ({ track, isPlaying, playProgressRef, onSeek, cues = NV2_COLORS, t = (k) => k }) => {
    const canvasRef    = useRef(null);
    const containerRef = useRef(null);
    const bitmapRef    = useRef(null);   // ImageBitmap del fondo precalculado
    const rafRef       = useRef(null);
    const seed = getTrackHash(track);

    // Construye el bitmap estático del fondo con diseño corporativo de rayas BeatWave Pro
    const buildBitmap = useCallback((width) => {
        const height = 42;
        let offscreen;
        try {
            offscreen = new OffscreenCanvas(width, height);
        } catch (_) {
            offscreen = document.createElement("canvas");
            offscreen.width  = width;
            offscreen.height = height;
        }
        const ctx = offscreen.getContext("2d");
        const centerY = height / 2;
        ctx.fillStyle = "#07080b";
        ctx.fillRect(0, 0, width, height);

        // DS 3.0 three-band split: lows (deep blue) → mids (cyan) → highs (white core), mirrored around center.
        const barStep = 2;
        const amp = height * 0.47;
        for (let x = 0; x < width; x += barStep) {
            const { bass, drums, vocals, treble, isBreak } = computeTrackStructuralBands(x / width, seed, track);
            const dim = isBreak ? 0.55 : 1;
            const low  = Math.min(1, (bass * 0.75 + drums * 0.35)) * dim;
            const mid  = Math.min(1, (vocals * 0.6 + drums * 0.3)) * 0.78 * dim;
            const high = Math.min(1, treble * 0.9 + drums * 0.15) * 0.48 * dim;
            const hl = Math.max(1, amp * low), hm = Math.max(0.5, amp * mid), hh = Math.max(0.5, amp * high);
            ctx.fillStyle = "rgba(37, 99, 235, 0.95)";
            ctx.fillRect(x, centerY - hl, barStep - 0.6, hl * 2);
            ctx.fillStyle = "rgba(34, 211, 238, 0.95)";
            ctx.fillRect(x, centerY - hm, barStep - 0.6, hm * 2);
            ctx.fillStyle = "rgba(240, 253, 255, 0.92)";
            ctx.fillRect(x, centerY - hh, barStep - 0.6, hh * 2);
        }

        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        if (typeof offscreen.transferToImageBitmap === "function") {
            bitmapRef.current = offscreen.transferToImageBitmap();
        } else {
            bitmapRef.current = offscreen; // fallback canvas
        }
    }, [seed, track]);

    // Reconstruir bitmap cuando cambia la pista, con ResizeObserver para cambios de layout
    useEffect(() => {
        if (!track || !containerRef.current) { bitmapRef.current = null; return; }
        const el = containerRef.current;
        const w  = el.clientWidth || 640;
        buildBitmap(w);
        const ro = new ResizeObserver(entries => {
            const newW = entries[0]?.contentRect.width | 0;
            if (newW > 0) buildBitmap(newW);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [track, buildBitmap]);

    // rAF loop: dibuja bitmap + playhead, nunca cambia estado React
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (!track) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        const dpr    = window.devicePixelRatio || 1;
        const height = 42;
        let lastPx   = -1;

        const loop = () => {
            rafRef.current = requestAnimationFrame(loop);
            const bitmap = bitmapRef.current;
            if (!bitmap) return;
            const width  = canvas.parentElement ? (canvas.parentElement.clientWidth || 640) : 640;
            // Resize canvas si cambia el layout
            if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
                canvas.width  = width * dpr;
                canvas.height = height * dpr;
            }
            const pct = playProgressRef ? playProgressRef.current : 0;
            const px  = Math.round(width * Math.min(1, Math.max(0, pct)));
            if (px === lastPx) return; // evitar redibujado innecesario
            lastPx = px;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save(); ctx.scale(dpr, dpr);
            // Dibuja el bitmap precalculado
            if (bitmap.width && bitmap.height) {
                ctx.drawImage(bitmap, 0, 0, width, height);
            }
            // Played region dims back so the unplayed side reads as "ahead".
            ctx.fillStyle = "rgba(7, 8, 11, 0.55)";
            ctx.fillRect(0, 0, px, height);
            // Sharp 1px playhead with cap triangles, no blur.
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(px - 0.5, 0, 1, height);
            ctx.beginPath(); ctx.moveTo(px - 4, 0); ctx.lineTo(px + 4, 0); ctx.lineTo(px, 4); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(px - 4, height); ctx.lineTo(px + 4, height); ctx.lineTo(px, height - 4); ctx.closePath(); ctx.fill();
            ctx.restore();
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [track, playProgressRef]);

    if (!track) {
        return (
            <div className="flex-1 h-11 bg-[#060609]/70 rounded-lg border border-djzinc-850/80 mx-6 flex items-center justify-center select-none shadow-inner">
                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                    <span>{t('deck_standby_ready_hint') || 'DECK 1 STANDBY • COMENTARIO TÁCTICO & WAVEFORM LISTOS'}</span>
                </div>
            </div>
        );
    }

    // handleScrub usa containerRef para calcular el pct de click
    const handleScrub = (e) => {
        if (!containerRef.current || !onSeek || !track) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, clickX / rect.width));
        onSeek(pct);
    };

    return (
        <div ref={containerRef} onClick={handleScrub} className="ws-wave flex-1 h-11 relative overflow-hidden group cursor-pointer flex items-center mx-6">
            <canvas ref={canvasRef} style={{ width: "100%", height: "42px", display: "block" }} />
            {cues.map((cue, idx) => {
                const leftPos = cue.pct !== undefined ? (cue.pct * 100) : Math.min(96, Math.max(3, (idx * 12.4) + 2.5));
                return (
                    <div key={cue.id || idx} className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none z-10" style={{ left: `${leftPos}%` }}>
                        <div className="w-3.5 h-3 rounded-b text-[8px] font-mono font-black text-black flex items-center justify-center shadow" style={{ backgroundColor: cue.color || '#ef4444' }}>{cue.id || (idx + 1)}</div>
                        <div className="w-[1px] h-full opacity-50" style={{ backgroundColor: cue.color || '#ef4444' }}></div>
                    </div>
                );
            })}
        </div>
    );
};

