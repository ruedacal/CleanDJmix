const { useRef, useEffect } = React;
import { getTrackHash, computeTrackStructuralBands } from './waveformUtils.js';

// ─── PERF: TableHarmonicWaveform ─────────────────────────────────────────────
// 1. React.memo + comparación de props: solo re-renderiza si cambia la pista,
//    el estado play/pause, o el progreso supera un umbral del 2%.
// 2. OffscreenCanvas: las 4 bandas espectrales se precalculan UNA VEZ por pista
//    y se almacenan en bgBitmapRef. Cambiar de pista regenera el bitmap.
// 3. rAF para el playhead: el cursor se actualiza con requestAnimationFrame
//    leyendo progressRef (una ref, no estado) → sin renders de React.
// ─────────────────────────────────────────────────────────────────────────────
export const TableHarmonicWaveform = React.memo(
  ({ track, duration = "05:00", onPlayTrack, isCurrentPlaying, onTogglePlay, playProgress = 0 }) => {
    const canvasRef   = useRef(null);
    const bgBitmapRef = useRef(null);   // bitmap precalculado de bandas espectrales
    const rafRef      = useRef(null);   // handle de requestAnimationFrame
    const progressRef = useRef(playProgress); // progreso leído por rAF sin setState
    const WIDTH = 112, HEIGHT = 28;

    const seed = getTrackHash(track);

    const handleClickScrub = (e) => {
        e.stopPropagation();
        if (isCurrentPlaying && onTogglePlay) { onTogglePlay(); return; }
        if (!canvasRef.current || !onPlayTrack) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        onPlayTrack(track, pct, true);
    };

    // ── Paso 1: Generar bitmap de fondo UNA VEZ por pista (Diseño Rayas BeatWave Logo) ─────
    useEffect(() => {
        let offscreen;
        try { offscreen = new OffscreenCanvas(WIDTH, HEIGHT); }
        catch (_) {
            offscreen = document.createElement('canvas');
            offscreen.width = WIDTH; offscreen.height = HEIGHT;
        }
        const ctx = offscreen.getContext('2d');
        const centerY = HEIGHT / 2;
        ctx.fillStyle = "#07080b";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // DS 3.0 three-band split (lows / mids / highs), mirrored around center.
        const amp = HEIGHT * 0.47;
        for (let x = 0; x < WIDTH; x += 2) {
            const { bass, drums, vocals, treble, isBreak } = computeTrackStructuralBands(x / WIDTH, seed, track);
            const dim = isBreak ? 0.55 : 1;
            const hl = Math.max(1, amp * Math.min(1, bass * 0.75 + drums * 0.35) * dim);
            const hm = Math.max(0.5, amp * Math.min(1, vocals * 0.6 + drums * 0.3) * 0.78 * dim);
            const hh = Math.max(0.5, amp * Math.min(1, treble * 0.9 + drums * 0.15) * 0.48 * dim);
            ctx.fillStyle = "rgba(37, 99, 235, 0.95)";  ctx.fillRect(x, centerY - hl, 1.4, hl * 2);
            ctx.fillStyle = "rgba(34, 211, 238, 0.95)"; ctx.fillRect(x, centerY - hm, 1.4, hm * 2);
            ctx.fillStyle = "rgba(240, 253, 255, 0.92)"; ctx.fillRect(x, centerY - hh, 1.4, hh * 2);
        }

        // Línea central tenue en cian corporativo
        ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(WIDTH, centerY);
        ctx.stroke();

        // Convertir a ImageBitmap para renderizado GPU (fallback: canvas auxiliar)
        if (typeof offscreen.transferToImageBitmap === 'function') {
            bgBitmapRef.current = offscreen.transferToImageBitmap();
        } else {
            bgBitmapRef.current = offscreen;
        }
    }, [seed, track]); // seed y track estables por pista → recalcula al cambiar de pista o datos

    // ── Paso 2: Configurar canvas principal con DPR correcto ──────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width  = WIDTH * dpr;
        canvas.height = HEIGHT * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
    }, []); // solo al montar

    // ── Paso 3: Bucle rAF para dibujar el playhead ────────────────────────────
    // No lee ningún estado React → cero re-renders durante la reproducción.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const draw = () => {
            if (!bgBitmapRef.current) return;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(bgBitmapRef.current, 0, 0, WIDTH, HEIGHT);
            if (isCurrentPlaying) {
                const px = WIDTH * Math.min(1, Math.max(0, progressRef.current));
                ctx.fillStyle = "rgba(7, 8, 11, 0.55)"; ctx.fillRect(0, 0, px, HEIGHT);
                ctx.fillStyle = "#ffffff"; ctx.fillRect(Math.round(px) - 0.5, 0, 1, HEIGHT);
            }
        };
        if (isCurrentPlaying) {
            const loop = () => { draw(); rafRef.current = requestAnimationFrame(loop); };
            rafRef.current = requestAnimationFrame(loop);
        } else {
            draw();
            if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        }
        return () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    }, [isCurrentPlaying, seed]);

    // ── Paso 4: Sincronizar ref de progreso sin provocar renders ─────────────
    useEffect(() => { progressRef.current = playProgress; }, [playProgress]);

    return (
        <div onClick={handleClickScrub} className="ws-wave w-28 h-7 relative overflow-hidden group cursor-pointer flex items-center justify-center">
            <canvas ref={canvasRef} style={{ width: "112px", height: "28px", display: "block" }} />
            <span className="absolute bottom-0.5 right-1 text-[9px] font-mono tabular-nums text-[var(--bw-text-2)] opacity-70 group-hover:opacity-100">{duration}</span>
            {isCurrentPlaying && (
                <span className="absolute top-1 left-1 ws-dot ws-dot-live" aria-hidden="true"></span>
            )}
        </div>
    );
  },
  // ── Función de comparación (areEqual): evita re-renders innecesarios ────────
  (prev, next) => {
      if ((prev.track && prev.track.id) !== (next.track && next.track.id)) return false;
      if (prev.isCurrentPlaying !== next.isCurrentPlaying) return false;
      // Si está sonando, solo re-renderiza si el progreso cambia >2% (umbral visual)
      if (prev.isCurrentPlaying && Math.abs(prev.playProgress - next.playProgress) > 0.02) return false;
      if (prev.onPlayTrack !== next.onPlayTrack) return false;
      if (prev.onTogglePlay !== next.onTogglePlay) return false;
      if (prev.duration !== next.duration) return false;
      return true; // props equivalentes → saltar render
  }
);

