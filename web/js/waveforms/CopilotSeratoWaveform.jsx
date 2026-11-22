const { useState, useEffect, useRef, useMemo } = React;
import { computeTrackStructuralBands } from './waveformUtils.js';

// Caché en memoria de picos reales Rekordbox 3Band HD (400 cols/s) para evitar re-descargas
const RB3BAND_HD_CACHE = new Map();

function decodeBase64ToU8(b64) {
    if (!b64 || typeof b64 !== 'string') return null;
    try {
        const bin = atob(b64);
        const len = bin.length;
        const u8 = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            u8[i] = bin.charCodeAt(i);
        }
        return u8;
    } catch (_) {
        return null;
    }
}

// Muestreo HD sin aliasing ni escalones: range-max en zoom alejado + interpolación lineal en zoom cercano
function sample3BandHD(bands, totalCols, fStart, fEnd) {
    if (fEnd < 0 || fStart >= totalCols) return [0, 0, 0];
    const s0 = Math.max(0, Math.min(totalCols - 1, fStart));
    const s1 = Math.max(s0, Math.min(totalCols - 1, fEnd));
    const span = s1 - s0;

    if (span <= 1.0) {
        const i0 = Math.floor(s0);
        const i1 = Math.min(totalCols - 1, i0 + 1);
        const frac = s0 - i0;
        const o0 = i0 * 3;
        const o1 = i1 * 3;
        return [
            (bands[o0] + (bands[o1] - bands[o0]) * frac) / 255.0,
            (bands[o0 + 1] + (bands[o1 + 1] - bands[o0 + 1]) * frac) / 255.0,
            (bands[o0 + 2] + (bands[o1 + 2] - bands[o0 + 2]) * frac) / 255.0,
        ];
    }

    const iStart = Math.floor(s0);
    const iEnd = Math.min(totalCols - 1, Math.ceil(s1));
    const step = Math.max(1, Math.floor((iEnd - iStart) / 16));
    let maxL = 0;
    let maxM = 0;
    let maxH = 0;
    for (let idx = iStart; idx <= iEnd; idx += step) {
        const off = idx * 3;
        if (bands[off] > maxL) maxL = bands[off];
        if (bands[off + 1] > maxM) maxM = bands[off + 1];
        if (bands[off + 2] > maxH) maxH = bands[off + 2];
    }
    return [maxL / 255.0, maxM / 255.0, maxH / 255.0];
}

// =======================================================
export const CopilotSeratoWaveform = ({
    deck,
    side = "1",
    antiMuddy = null,
    partnerDeck = null,
    isCompact = false
}) => {
    const canvasRef = useRef(null);
    const minimapRef = useRef(null);
    const minimapCacheRef = useRef(null);
    const [zoom, setZoom] = useState(4); // 2x (32s), 4x (16s), 8x (8s), 16x (4s)
    const [showTacticalAids, setShowTacticalAids] = useState(true);
    const [hoveredMilestone, setHoveredMilestone] = useState(null);
    const [hdWave, setHdWave] = useState(null);
    const initialProgress = (typeof deck.play_progress === 'number' && !isNaN(deck.play_progress)) ? deck.play_progress : 0.0;
    const [progress, setProgress] = useState(initialProgress);
    const progressRef = useRef(initialProgress);
    const isPlayingRef = useRef(Boolean(deck.is_playing));
    const bpmRef = useRef(deck.bpm || 130.0);
    const durationSecRef = useRef(deck.duration_sec || 390.0);

    const deckNum = (side === "2" || side === 2 || deck?.deck_num === 2) ? 2 : 1;
    const trackFilePath = deck?.filepath || deck?.file_path || "";
    const isEmptyDeck = !deck || !deck.title || !deck.bpm || Number(deck.bpm) <= 0 || deck.status === 'STANDBY (VACÍO)';

    useEffect(() => {
        if (deck.play_progress !== undefined && deck.play_progress !== null) {
            const diff = Math.abs(progressRef.current - deck.play_progress);
            if (diff > 0.002 || !deck.is_playing || deck.play_progress === 0) {
                progressRef.current = deck.play_progress;
                setProgress(deck.play_progress);
            }
        }
        isPlayingRef.current = Boolean(deck.is_playing);
        bpmRef.current = parseFloat(deck.bpm) || 130.0;
        durationSecRef.current = parseFloat(deck.duration_sec) || 390.0;
    }, [deck.play_progress, deck.is_playing, deck.bpm, deck.duration_sec]);

    // Descarga no bloqueante de picos reales 3Band HD (400 cols/s) desde el backend local
    const hdTrackKey = isEmptyDeck
        ? ""
        : `${deckNum}|${trackFilePath || deck.title}|${deck.artist || ''}|${deck.duration_sec || 0}`;

    useEffect(() => {
        if (!hdTrackKey) {
            setHdWave(null);
            return;
        }
        if (RB3BAND_HD_CACHE.has(hdTrackKey)) {
            setHdWave(RB3BAND_HD_CACHE.get(hdTrackKey));
            return;
        }

        const isLocalHost =
            typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (!isLocalHost) {
            setHdWave(null);
            return;
        }

        let cancelled = false;
        setHdWave(null);

        const fetchHD = async (attempt = 0) => {
            try {
                const res = await fetch(`/api/copilot/waveform/${deckNum}?k=${encodeURIComponent(hdTrackKey)}`);
                if (!res.ok) return;
                const payload = await res.json();
                if (cancelled) return;

                if (payload && payload.ready && payload.bands_b64) {
                    const bands = decodeBase64ToU8(payload.bands_b64);
                    const overview = decodeBase64ToU8(payload.overview_b64);
                    if (bands && bands.length >= 3) {
                        const parsed = {
                            cacheKey: payload.cache_key || hdTrackKey,
                            version: payload.version || 'rb3b',
                            columns: payload.columns || Math.floor(bands.length / 3),
                            overviewColumns: payload.overview_columns || (overview ? Math.floor(overview.length / 3) : 0),
                            durationSec: payload.duration_sec || deck.duration_sec || 240,
                            bands,
                            overview,
                            realFft: Boolean(payload.real_fft),
                        };
                        RB3BAND_HD_CACHE.set(hdTrackKey, parsed);
                        if (RB3BAND_HD_CACHE.size > 16) {
                            const oldest = RB3BAND_HD_CACHE.keys().next().value;
                            RB3BAND_HD_CACHE.delete(oldest);
                        }
                        setHdWave(parsed);
                        return;
                    }
                }
                if (payload && payload.pending && attempt < 24 && !cancelled) {
                    setTimeout(() => fetchHD(attempt + 1), 320);
                }
            } catch (_) {
                // Mantiene fallback a Serato Overview o síntesis en modo offline
            }
        };

        fetchHD(0);
        return () => {
            cancelled = true;
        };
    }, [deckNum, hdTrackKey]);

    // Reproducción optimizada en tiempo real: solo corre rAF cuando deck.is_playing es verdadero
    useEffect(() => {
        let animId;
        let lastTime = performance.now();
        let lastUiUpdate = 0;

        const tick = (now) => {
            const dt = (now - lastTime) / 1000.0;
            lastTime = now;

            if (isPlayingRef.current && durationSecRef.current > 0) {
                const advance = dt / durationSecRef.current;
                const next = (progressRef.current + advance) % 1.0;
                progressRef.current = next;

                // Throttled UI state updates a ~60fps fluidos para el canvas
                if (now - lastUiUpdate >= 16) {
                    lastUiUpdate = now;
                    setProgress(next);
                }
            }
            if (isPlayingRef.current) {
                animId = requestAnimationFrame(tick);
            }
        };

        if (isPlayingRef.current) {
            animId = requestAnimationFrame(tick);
        }
        return () => {
            if (animId) cancelAnimationFrame(animId);
        };
    }, [deck.is_playing]);

    const rawId = trackFilePath || deck.title || "1";
    const seed = rawId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;
    const durSec = deck.duration_sec || hdWave?.durationSec || 390.0;
    const elapsedSec = progress * durSec;
    const remainSec = Math.max(0, durSec - elapsedSec);

    // Fallback: decodificación de silueta Serato Overview (1280 columnas x 3 bandas)
    const overviewBytes = useMemo(() => {
        if (!deck.serato_overview) return null;
        return decodeBase64ToU8(deck.serato_overview);
    }, [deck.serato_overview]);

    const formatSec = (s) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const cues = deck.cues || [
        { id: 1, name: "Downbeat 1.0.0", color: "#ef4444", pct: 0.04, time: "00:00.25", directive: "Punto de anclaje inicial. Arranca beatmatching aquí." },
        { id: 2, name: "Intro Perc", color: "#f97316", pct: 0.16, time: "01:04.00", directive: "Entrada de caja y charles. Inicia subida gradual del fader." },
        { id: 3, name: "Bassline In", color: "#eab308", pct: 0.32, time: "02:08.00", directive: "Aparecen graves dominantes. Revisa EQ Low del otro deck." },
        { id: 4, name: "MAIN DROP", color: "#10b981", pct: 0.48, time: "03:12.00", directive: "Clímax 100% de potencia. Corta totalmente los graves del deck saliente." },
        { id: 5, name: "Breakdown", color: "#06b6d4", pct: 0.62, time: "04:16.00", directive: "Parón melódico sin bombo. Ventana idónea para transiciones vocales." },
        { id: 6, name: "Climax 2", color: "#22d3ee", pct: 0.74, time: "05:04.00", directive: "Segundo impacto de sala. Mantén energía alta." },
        { id: 7, name: "Outro 32b", color: "#8b5cf6", pct: 0.86, time: "06:08.00", directive: "Se retiran capas rítmicas. Zona recomendada para mezclar track entrante." },
        { id: 8, name: "Cut / Fade", color: "#ec4899", pct: 0.96, time: "07:15.00", directive: "Final de pista. Fade-out o corte antes del silencio." }
    ];

    const phases = deck.structural_phases || [
        { id: "intro", name: "Intro", start_pct: 0.0, end_pct: 0.16, type: "intro", label: "Intro 32b • Mezcla In", color: "#06b6d4", directive: "32 compases de entrada. Sincroniza beatgrid." },
        { id: "build", name: "Bassline In", start_pct: 0.16, end_pct: 0.35, type: "build", label: "Bassline Activa", color: "#eab308", directive: "Filtra frecuencias sub con filtro High-Pass." },
        { id: "break", name: "Breakdown", start_pct: 0.35, end_pct: 0.48, type: "break", label: "Breakdown (Sin Graves)", color: "#38bdf8", directive: "Sin bombo. Oportunidad para cruce de leads o acapellas." },
        { id: "drop", name: "MAIN DROP", start_pct: 0.48, end_pct: 0.74, type: "drop", label: "⚡ DROP PRINCIPAL (Clímax)", color: "#ef4444", directive: "Energía máxima en pista. Kill switch en graves opuestos." },
        { id: "break2", name: "Segundo Parón", start_pct: 0.74, end_pct: 0.82, type: "break", label: "Puente Melódico", color: "#a855f7", directive: "Transición melódica antes del outro." },
        { id: "outro", name: "Outro", start_pct: 0.82, end_pct: 1.0, type: "outro", label: "🟢 MEZCLA SEGURA (Outro)", color: "#10b981", directive: "Zona segura de mezcla. Abre canal entrante." }
    ];

    const nextCue = cues.find(c => (c.pct || 0) > progress);
    const beatsToNextCue = nextCue && deck.bpm ? Math.round(((nextCue.pct - progress) * durSec) / (60.0 / deck.bpm)) : null;
    const barsToNextCue = beatsToNextCue ? Math.max(1, Math.ceil(beatsToNextCue / 4)) : null;
    const timeToNextCue = nextCue ? Math.max(0, (nextCue.pct - progress) * durSec) : 0;

    const bothPlaying = Boolean(deck.is_playing && partnerDeck && partnerDeck.is_playing);
    const isBassClashDanger = bothPlaying && antiMuddy && antiMuddy.status === 'danger' && (deck.low_ratio || 0) >= 44;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const w = rect.width || canvas.parentElement.clientWidth || 550;
        const h = 88;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        const ctx = canvas.getContext('2d');
        if (ctx.resetTransform) ctx.resetTransform(); else ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        // Fondo negro profundo estilo Rekordbox / CDJ-3000
        ctx.fillStyle = '#050507';
        ctx.fillRect(0, 0, w, h);

        const midY = h / 2;
        const playheadX = w / 2;

        // Línea horizontal central sutil
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(w, midY);
        ctx.stroke();

        if (isEmptyDeck) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ARRASTRAR CANCIÓN AQUÍ (STANDBY)', w / 2, midY + 4);

            const miniCanvas = minimapRef.current;
            if (miniCanvas) {
                const mRect = miniCanvas.getBoundingClientRect();
                const mw = mRect.width || miniCanvas.parentElement.clientWidth || 550;
                const mh = 22;
                miniCanvas.width = Math.round(mw * dpr);
                miniCanvas.height = Math.round(mh * dpr);
                const mCtx = miniCanvas.getContext('2d');
                if (mCtx.resetTransform) mCtx.resetTransform(); else mCtx.setTransform(1, 0, 0, 1, 0, 0);
                mCtx.scale(dpr, dpr);
                mCtx.fillStyle = '#050507';
                mCtx.fillRect(0, 0, mw, mh);
                mCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                mCtx.lineWidth = 1;
                mCtx.beginPath();
                mCtx.moveTo(0, mh / 2);
                mCtx.lineTo(mw, mh / 2);
                mCtx.stroke();
            }
            return;
        }

        // Ventana calibrada a escala Rekordbox CDJ-3000: 2x=32s, 4x=16s, 8x=8s, 16x=4s
        const windowSec = 64.0 / zoom;
        const halfWindowSec = windowSec / 2;
        const currentSec = progress * durSec;
        const startSec = currentSec - halfWindowSec;
        const endSec = currentSec + halfWindowSec;

        // 1. Zonas de fases tácticas (tintado discreto superior cuando Ayudas DJ está activo)
        if (showTacticalAids) {
            phases.forEach(ph => {
                const phStartSec = ph.start_pct * durSec;
                const phEndSec = ph.end_pct * durSec;
                if (phEndSec >= startSec && phStartSec <= endSec) {
                    const x1 = Math.max(0, playheadX + ((phStartSec - currentSec) / windowSec) * w);
                    const x2 = Math.min(w, playheadX + ((phEndSec - currentSec) / windowSec) * w);
                    if (x2 > x1) {
                        ctx.fillStyle = `${ph.color}12`;
                        ctx.fillRect(x1, 0, x2 - x1, h);

                        ctx.fillStyle = `${ph.color}99`;
                        ctx.fillRect(x1, 0, x2 - x1, 2);
                    }
                }
            });

            if (isBassClashDanger) {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
                ctx.fillRect(playheadX - 60, 0, 120, h);
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
                ctx.lineWidth = 1;
                ctx.strokeRect(playheadX - 60, 0, 120, h);
            }
        }

        // 2. Espectro REKORDBOX 3BAND HD en resolución física Retina (Azul Graves -> Ámbar Medios -> Blanco Agudos)
        const maxAmp = (h / 2) - 5;
        const physCols = Math.max(1, Math.round(w * dpr));
        const colW = w / physCols;
        const hasRealHD = Boolean(hdWave && hdWave.bands && hdWave.columns > 0);
        const waveDur = hasRealHD ? Math.max(1, hdWave.durationSec || durSec) : durSec;
        const colsPerSec = hasRealHD ? (hdWave.columns / waveDur) : 0;

        for (let i = 0; i < physCols; i++) {
            const x = i * colW;
            const t0 = startSec + (i / physCols) * windowSec;
            const t1 = startSec + ((i + 1) / physCols) * windowSec;
            const sliceNorm = t0 / durSec;

            if (t1 < 0.0 || t0 > waveDur) continue;

            let low = 0;
            let mid = 0;
            let high = 0;

            if (hasRealHD) {
                const [l, m, hi] = sample3BandHD(hdWave.bands, hdWave.columns, t0 * colsPerSec, t1 * colsPerSec);
                low = l;
                mid = m;
                high = hi;
            } else if (overviewBytes && overviewBytes.length >= 3840 && sliceNorm >= 0 && sliceNorm <= 1) {
                const colIdx = Math.min(1279, Math.max(0, Math.floor(sliceNorm * 1280)));
                const byteOffset = colIdx * 3;
                low = Math.min(1.0, (overviewBytes[byteOffset] || 0) / 220.0);
                mid = Math.min(1.0, (overviewBytes[byteOffset + 1] || 0) / 140.0);
                high = Math.min(1.0, (overviewBytes[byteOffset + 2] || 0) / 140.0);
            } else if (sliceNorm >= 0 && sliceNorm <= 1) {
                const bands = computeTrackStructuralBands(sliceNorm, seed, deck);
                low = bands.bass;
                mid = Math.max(bands.drums, bands.vocals);
                high = bands.treble;
            }

            const isPlayed = x < playheadX;
            const lowAmp = low * maxAmp * 0.96;
            const midAmp = Math.pow(mid, 1.15) * maxAmp * 0.72;
            const highAmp = Math.pow(high, 1.45) * maxAmp * 0.42;

            // Capa 1: Graves (<250 Hz) — Azul profundo CDJ-3000
            if (lowAmp >= 0.5) {
                ctx.fillStyle = isPlayed ? 'rgba(29, 78, 216, 0.78)' : '#2563eb';
                ctx.fillRect(x, midY - lowAmp, colW + 0.15, lowAmp * 2);
            }

            // Capa 2: Medios (250 Hz - 2.5 kHz) — Ámbar / Naranja Rekordbox
            if (midAmp >= 0.5) {
                ctx.fillStyle = isPlayed ? 'rgba(245, 158, 11, 0.80)' : '#f59e0b';
                ctx.fillRect(x, midY - midAmp, colW + 0.15, midAmp * 2);
            }

            // Capa 3: Agudos (>2.5 kHz) — Blanco nítido en transitorios
            if (highAmp >= 0.5) {
                ctx.fillStyle = isPlayed ? 'rgba(248, 250, 252, 0.85)' : '#ffffff';
                ctx.fillRect(x, midY - highAmp, colW + 0.15, highAmp * 2);
            }
        }

        // 3. Beatgrid Rekordbox (Downbeat ROJO en Beat 1 + ticks blancos finos en Beats 2, 3, 4)
        const bpm = deck.bpm || 130.0;
        const beatSec = 60.0 / bpm;
        const downbeatSec =
            (deck && deck.first_downbeat_ms)
                ? (parseFloat(deck.first_downbeat_ms) / 1000.0)
                : (Array.isArray(deck.cues) && deck.cues.length > 0 && typeof deck.cues[0].pos_sec === 'number'
                    ? deck.cues[0].pos_sec
                    : 0.0);

        if (beatSec > 0) {
            const firstBeatIdx = Math.floor((startSec - downbeatSec) / beatSec);
            const lastBeatIdx = Math.ceil((endSec - downbeatSec) / beatSec);
            for (let b = firstBeatIdx; b <= lastBeatIdx; b++) {
                const bSec = downbeatSec + (b * beatSec);
                if (bSec < 0 || bSec > durSec) continue;
                const bx = playheadX + ((bSec - currentSec) / windowSec) * w;
                if (bx >= 0 && bx <= w) {
                    const isDownbeat = (((b % 4) + 4) % 4) === 0;
                    if (isDownbeat) {
                        const barNum = Math.floor(b / 4) + 1;
                        ctx.strokeStyle = 'rgba(239, 68, 68, 0.82)';
                        ctx.lineWidth = 1.2;
                        ctx.beginPath();
                        ctx.moveTo(bx, 0);
                        ctx.lineTo(bx, h);
                        ctx.stroke();

                        ctx.fillStyle = '#ef4444';
                        ctx.fillRect(bx - 1.5, 0, 3, 5);

                        if (barNum > 0 && bx > 14 && bx < w - 24) {
                            ctx.fillStyle = 'rgba(248, 250, 252, 0.78)';
                            ctx.font = 'bold 8.5px ui-monospace, SFMono-Regular, Menlo, monospace';
                            ctx.textAlign = 'left';
                            ctx.fillText(`${barNum}.1`, bx + 3, 11);
                        }
                    } else {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(bx, 6);
                        ctx.lineTo(bx, h - 4);
                        ctx.stroke();

                        ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
                        ctx.fillRect(bx - 0.5, 0, 1, 3.5);
                    }
                }
            }
        }

        // 4. Banderas de Hot Cues (1 a 8) estilo Rekordbox
        if (showTacticalAids) {
            cues.forEach(cue => {
                const cueSec = typeof cue.pos_sec === 'number'
                    ? cue.pos_sec
                    : (cue.pct !== undefined ? cue.pct : 0) * durSec;
                if (cueSec >= startSec && cueSec <= endSec) {
                    const cx = playheadX + ((cueSec - currentSec) / windowSec) * w;
                    if (cx >= 0 && cx <= w) {
                        const color = cue.color || '#22d3ee';
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 1.4;
                        ctx.beginPath();
                        ctx.moveTo(cx, 0);
                        ctx.lineTo(cx, h);
                        ctx.stroke();

                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.moveTo(cx, 0);
                        ctx.lineTo(cx + 15, 0);
                        ctx.lineTo(cx + 15, 11);
                        ctx.lineTo(cx + 4, 11);
                        ctx.lineTo(cx, 15);
                        ctx.closePath();
                        ctx.fill();

                        ctx.fillStyle = '#050507';
                        ctx.font = 'bold 8px ui-monospace, SFMono-Regular, Menlo, monospace';
                        ctx.textAlign = 'left';
                        ctx.fillText(`C${cue.id || ''}`, cx + 2, 8.5);
                    }
                }
            });
        }

        // 5. Aguja Central Playhead Rekordbox / CDJ-3000 (Roja con flechas triangulares)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(playheadX - 0.85, 0, 1.7, h);

        ctx.beginPath();
        ctx.moveTo(playheadX - 5.5, 0);
        ctx.lineTo(playheadX + 5.5, 0);
        ctx.lineTo(playheadX, 7);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(playheadX - 5.5, h);
        ctx.lineTo(playheadX + 5.5, h);
        ctx.lineTo(playheadX, h - 7);
        ctx.closePath();
        ctx.fill();

        // 6. Minimapa Overview Rekordbox 3Band HD (1200 columnas con caché offscreen)
        const miniCanvas = minimapRef.current;
        if (!miniCanvas) return;
        const mRect = miniCanvas.getBoundingClientRect();
        const mw = mRect.width || miniCanvas.parentElement.clientWidth || 550;
        const mh = 22;
        miniCanvas.width = Math.round(mw * dpr);
        miniCanvas.height = Math.round(mh * dpr);
        const mCtx = miniCanvas.getContext('2d');
        if (mCtx.resetTransform) mCtx.resetTransform(); else mCtx.setTransform(1, 0, 0, 1, 0, 0);
        mCtx.scale(dpr, dpr);

        const dataTag = hdWave?.cacheKey ? `hd_${hdWave.cacheKey}` : (overviewBytes ? 'serato' : 'synth');
        const cacheKey = `${rawId}_${Math.round(mw)}_${showTacticalAids}_${dataTag}`;
        if (!minimapCacheRef.current || minimapCacheRef.current.key !== cacheKey) {
            const off = document.createElement('canvas');
            off.width = Math.round(mw * dpr);
            off.height = Math.round(mh * dpr);
            const oCtx = off.getContext('2d');
            if (oCtx.resetTransform) oCtx.resetTransform(); else oCtx.setTransform(1, 0, 0, 1, 0, 0);
            oCtx.scale(dpr, dpr);

            oCtx.fillStyle = '#050507';
            oCtx.fillRect(0, 0, mw, mh);

            const mHalf = mh / 2;
            const mPhysCols = Math.max(1, Math.round(mw * dpr));
            const mColW = mw / mPhysCols;
            const hasOvHD = Boolean(hdWave && hdWave.overview && hdWave.overviewColumns > 0);

            for (let j = 0; j < mPhysCols; j++) {
                const mx = j * mColW;
                const mNorm0 = j / mPhysCols;
                const mNorm1 = (j + 1) / mPhysCols;
                let bVal = 0;
                let mVal = 0;
                let tVal = 0;

                if (hasOvHD) {
                    const [l, m, hi] = sample3BandHD(
                        hdWave.overview,
                        hdWave.overviewColumns,
                        mNorm0 * hdWave.overviewColumns,
                        mNorm1 * hdWave.overviewColumns
                    );
                    bVal = l;
                    mVal = m;
                    tVal = hi;
                } else if (overviewBytes && overviewBytes.length >= 3840) {
                    const colIdx = Math.min(1279, Math.max(0, Math.floor(mNorm0 * 1280)));
                    const byteOffset = colIdx * 3;
                    bVal = Math.min(1.0, (overviewBytes[byteOffset] || 0) / 220.0);
                    mVal = Math.min(1.0, (overviewBytes[byteOffset + 1] || 0) / 140.0);
                    tVal = Math.min(1.0, (overviewBytes[byteOffset + 2] || 0) / 140.0);
                } else {
                    const bands = computeTrackStructuralBands(mNorm0, seed, deck);
                    bVal = bands.bass;
                    mVal = Math.max(bands.drums, bands.vocals);
                    tVal = bands.treble;
                }

                const bAmp = bVal * (mHalf - 1.5);
                const mAmp = Math.pow(mVal, 1.2) * (mHalf - 3.0);
                const tAmp = Math.pow(tVal, 1.65) * (mHalf - 5.0);

                if (bAmp >= 0.4) {
                    oCtx.fillStyle = '#2563eb';
                    oCtx.fillRect(mx, mHalf - bAmp, mColW + 0.15, bAmp * 2);
                }
                if (mAmp >= 0.4) {
                    oCtx.fillStyle = '#f59e0b';
                    oCtx.fillRect(mx, mHalf - mAmp, mColW + 0.15, mAmp * 2);
                }
                if (tAmp >= 0.4) {
                    oCtx.fillStyle = '#ffffff';
                    oCtx.fillRect(mx, mHalf - tAmp, mColW + 0.15, tAmp * 2);
                }
            }

            if (showTacticalAids) {
                phases.forEach(ph => {
                    const px1 = ph.start_pct * mw;
                    const px2 = ph.end_pct * mw;
                    oCtx.fillStyle = `${ph.color}20`;
                    oCtx.fillRect(px1, 0, px2 - px1, mh);
                    oCtx.fillStyle = ph.color;
                    oCtx.fillRect(px1, 0, px2 - px1, 1.5);
                });

                cues.forEach(cue => {
                    const cx = (cue.pct || 0) * mw;
                    oCtx.fillStyle = cue.color || '#22d3ee';
                    oCtx.fillRect(cx - 0.5, 0, 1.2, mh);
                });
            }

            minimapCacheRef.current = { key: cacheKey, canvas: off };
        }

        // Dibujar el fondo estático precalculado instantáneamente
        mCtx.drawImage(minimapCacheRef.current.canvas, 0, 0, mw, mh);

        // Atenuar zona ya reproducida en el overview estilo CDJ-3000
        const mPlayheadX = progress * mw;
        if (mPlayheadX > 0) {
            mCtx.fillStyle = 'rgba(5, 5, 8, 0.46)';
            mCtx.fillRect(0, 0, mPlayheadX, mh);
        }

        // Ventana de zoom visible
        const vStart = Math.max(0, (startSec / durSec) * mw);
        const vEnd = Math.min(mw, (endSec / durSec) * mw);
        mCtx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        mCtx.fillRect(vStart, 0, Math.max(4, vEnd - vStart), mh);
        mCtx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
        mCtx.lineWidth = 1;
        mCtx.strokeRect(vStart, 0.5, Math.max(4, vEnd - vStart), mh - 1);

        // Aguja playhead roja en el minimapa
        mCtx.fillStyle = '#ef4444';
        mCtx.fillRect(mPlayheadX - 0.85, 0, 1.7, mh);
    }, [zoom, showTacticalAids, progress, deck, antiMuddy, isBassClashDanger, hdWave, overviewBytes]);

    const handleMinimapClick = (e) => {
        const miniCanvas = minimapRef.current;
        if (!miniCanvas) return;
        const rect = miniCanvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newPct = Math.max(0, Math.min(1, clickX / rect.width));
        progressRef.current = newPct;
        setProgress(newPct);
    };

    return (
        <div className="flex flex-col gap-2 p-2 sm:p-2.5 rounded-2xl bg-[#030308] border border-zinc-800/90 shadow-inner">
            {/* TACTICAL ANTICIPATION HUD BOX: CONTADOR Y PUNTOS CLAVE CON TOOLTIP DETALLADO (SUPRIMIDO EN MODO COMPACTO CON PANEL CENTRAL) */}
            {(!isCompact && showTacticalAids) && (
                <div className="relative p-2 rounded-xl bg-zinc-950/90 border border-zinc-800/80 shadow-md">
                    {isEmptyDeck ? (
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/70 border border-zinc-800 text-zinc-400 font-mono text-[11px] font-medium">
                                <span className="text-sm">⏹️</span>
                                <span>DECK VACÍO ➔ Arrastrar canción aquí para activar análisis</span>
                            </div>
                            <div className="text-[10px] font-mono text-zinc-600">
                                STANDBY
                            </div>
                        </div>
                    ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* CONTADOR DE ANTICIPACIÓN (URGENCIA EN ROJO < 5s) */}
                        <div className="flex items-center gap-2">
                            {!deck.is_playing ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-500/70 text-indigo-200 font-mono text-[11px] font-bold shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                                    <span className="text-sm">🎧</span>
                                    <span>EN CUE (PREPARADO) ➔ Listo para soltar en primer bombo (Bar 1)</span>
                                </div>
                            ) : isBassClashDanger ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500 text-red-200 font-mono text-[11px] font-bold shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse ring-1 ring-red-400">
                                    <span className="text-sm">⚠️</span>
                                    <span>EN {barsToNextCue || 8} COMPASES ({formatSec(timeToNextCue || 16)}) ➔ BASS CLASH: Cortar Low EQ</span>
                                </div>
                            ) : nextCue ? (
                                (timeToNextCue <= 5.0 && timeToNextCue > 0) ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white font-mono text-[11px] font-black shadow-[0_0_25px_rgba(239,68,68,1)] ring-2 ring-red-400 border border-white animate-pulse scale-105">
                                        <span className="text-sm animate-bounce">🚨</span>
                                        <span>¡ATENCIÓN! EN <strong className="text-yellow-300 font-orbitron">{formatSec(timeToNextCue)}</strong> ➔ <span className="uppercase tracking-wider">{nextCue.name}</span></span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-djcyan-950/60 border border-djcyan-500/60 text-djcyan-300 font-mono text-[11px] font-bold">
                                        <span>⏳</span>
                                        <span>EN <strong className="text-white font-orbitron">{barsToNextCue}</strong> BARS ({formatSec(timeToNextCue)}) ➔ <span className="text-white uppercase">{nextCue.name}</span></span>
                                    </div>
                                )
                            ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold">
                                    <span>🟢</span>
                                    <span>EN ZONA SEGURA DE MEZCLA (OUTRO)</span>
                                </div>
                            )}
                        </div>

                        {/* HITOS DE AYUDA TÁCTICOS DIFERENCIADOS CLARAMENTE DE LOS CUES */}
                        <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[9px] font-mono uppercase text-amber-400 font-bold mr-1 hidden md:inline">🎯 Hitos:</span>
                            {phases.map((ph) => {
                                const phStart = ph.start_pct || 0;
                                const isPassed = phStart <= progress;
                                const isCurrent = progress >= ph.start_pct && progress < ph.end_pct;
                                const iconsMap = { intro: '🚀', build: '🛑', break: '🌊', break2: '🌊', drop: '🎯', outro: '🏁' };
                                const icon = iconsMap[ph.type] || '⚡';
                                return (
                                    <div
                                        key={ph.id}
                                        onMouseEnter={() => setHoveredMilestone({
                                            name: ph.name || ph.label,
                                            time: formatSec(ph.start_pct * durSec),
                                            pct: ph.start_pct,
                                            color: ph.color,
                                            directive: ph.directive || ph.label
                                        })}
                                        onMouseLeave={() => setHoveredMilestone(null)}
                                        className={`relative px-1.5 py-0.5 rounded cursor-pointer transition-all text-[9px] font-mono font-bold flex items-center gap-1 border ${
                                            isCurrent
                                                ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.9)] scale-105 ring-1 ring-white'
                                                : isPassed
                                                ? 'bg-zinc-900/80 text-zinc-400 border-zinc-800'
                                                : 'bg-zinc-950 text-zinc-300 border-zinc-700/60 hover:border-amber-400'
                                        }`}
                                    >
                                        <span>{icon}</span>
                                        <span className="truncate max-w-[70px]">{ph.name.toUpperCase()}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    )}

                    {/* POPOVER CON INSTRUCCIÓN DETALLADA AL HACER HOVER */}
                    {hoveredMilestone && (
                        <div className="absolute left-2 right-2 top-full mt-1.5 z-30 p-2.5 rounded-xl bg-black/95 border border-djcyan-500/60 shadow-2xl backdrop-blur-md text-xs font-mono animate-fadeIn">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-1 mb-1.5">
                                <span className="font-syne font-bold text-white flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredMilestone.color }}></span>
                                    {hoveredMilestone.name} ({hoveredMilestone.time})
                                </span>
                                <span className="text-[10px] text-djcyan-400 font-mono">
                                    Compás {Math.round((hoveredMilestone.pct * durSec) / (60 / (deck.bpm || 130)) / 4)}
                                </span>
                            </div>
                            <p className="text-[11px] text-zinc-300 leading-relaxed">
                                <strong className="text-emerald-400">Acción DJ:</strong> {hoveredMilestone.directive || "Ajuste de ganancia y sincronía armónica antes del drop."}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Barra de Control del Waveform + LEYENDA REKORDBOX 3BAND */}
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
                <div className="flex items-center gap-2 flex-wrap">
                    {!isCompact && (
                        <button
                            type="button"
                            onClick={() => setShowTacticalAids(!showTacticalAids)}
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg font-bold uppercase transition-all cursor-pointer border text-[10px] sm:text-[11px] ${
                                showTacticalAids
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                                : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                            }`}
                            title="Habilitar/Deshabilitar ayudas visuales (Drops, Cues, Zonas Seguras y Anti-Muddy) en el waveform"
                        >
                            <span>{showTacticalAids ? '🎯' : '⚪'}</span>
                            <span>{showTacticalAids ? 'Ayudas DJ' : 'Puro Wave'}</span>
                        </button>
                    )}

                    {/* LEYENDA VISUAL DE FRECUENCIAS REKORDBOX 3BAND (CDJ-3000) */}
                    <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 rounded-md bg-zinc-950/80 border border-zinc-800 text-[9px] text-zinc-400">
                        {hdWave?.realFft && (
                            <span
                                className="flex items-center gap-1 font-mono font-black px-1.5 py-0.2 rounded"
                                style={{
                                    fontSize: '8.5px',
                                    backgroundColor: 'rgba(34, 211, 238, 0.14)',
                                    border: '1px solid rgba(34, 211, 238, 0.45)',
                                    color: '#22d3ee',
                                }}
                            >
                                <span style={{ width: 5, height: 5, borderRadius: '9999px', backgroundColor: '#22d3ee', display: 'inline-block' }} />
                                3BAND HD
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <span style={{ width: 6, height: 6, borderRadius: '9999px', backgroundColor: '#2563eb', display: 'inline-block' }} />
                            Graves (&lt;250Hz)
                        </span>
                        <span className="flex items-center gap-1">
                            <span style={{ width: 6, height: 6, borderRadius: '9999px', backgroundColor: '#f59e0b', display: 'inline-block' }} />
                            Medios (250Hz-2.5kHz)
                        </span>
                        <span className="flex items-center gap-1">
                            <span style={{ width: 6, height: 6, borderRadius: '9999px', backgroundColor: '#ffffff', display: 'inline-block' }} />
                            Agudos (&gt;2.5kHz)
                        </span>
                    </div>
                </div>

                {/* CONTROLES DE ZOOM Y TIEMPOS */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px]">
                        {[2, 4, 8, 16].map(z => (
                            <button
                                key={z}
                                type="button"
                                onClick={() => setZoom(z)}
                                className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                                    zoom === z ? 'bg-djcyan-500 text-black shadow' : 'text-zinc-400 hover:text-white'
                                }`}
                            >
                                {z}x
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[10px] sm:text-[11px]">
                        <span className={isEmptyDeck ? 'text-zinc-500 font-bold' : 'text-white font-bold'}>{isEmptyDeck ? '00:00' : formatSec(elapsedSec)}</span>
                        <span className="text-zinc-600">/</span>
                        <span className="text-zinc-500">-{isEmptyDeck ? '00:00' : formatSec(remainSec)}</span>
                    </div>
                </div>
            </div>

            {/* Canvas Waveform Zoom Rekordbox 3Band HD (Centrado en Playhead Rojo) */}
            <div className="relative w-full rounded-xl overflow-hidden border border-zinc-800/80 bg-[#050507]">
                <canvas
                    ref={canvasRef}
                    style={{ width: '100%', height: '88px', display: 'block' }}
                />
            </div>

            {/* Canvas Minimap Track Overview Completo 3Band HD (0-100%) */}
            <div
                onClick={handleMinimapClick}
                className="relative w-full rounded-lg overflow-hidden border border-zinc-800/60 bg-[#050507] cursor-pointer hover:border-zinc-700 transition-colors"
                title="Haz clic en cualquier punto para saltar en la pista"
            >
                <canvas
                    ref={minimapRef}
                    style={{ width: '100%', height: '22px', display: 'block' }}
                />
            </div>
        </div>
    );
};
