const { useState, useEffect, useRef } = React;

// Carátula por defecto (SVG Vinilo Minimalista DJ)
const DEFAULT_VINYL_SVG = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="12" fill="#0d0d14"/><circle cx="80" cy="80" r="58" fill="#14141f" stroke="#27273a" stroke-width="2"/><circle cx="80" cy="80" r="44" fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/><circle cx="80" cy="80" r="30" fill="none" stroke="#3b82f6" stroke-width="1.5" opacity="0.5"/><circle cx="80" cy="80" r="14" fill="#06b6d4"/><circle cx="80" cy="80" r="5" fill="#09090b"/></svg>');

function getValidCover(c) {
    if (!c || typeof c !== 'string') return DEFAULT_VINYL_SVG;
    if (c.startsWith("data:") || c.startsWith("http://") || c.startsWith("https://") || c.startsWith("/")) return c;
    return "https://i.scdn.co/image/" + c;
}

// Función auxiliar para calcular la envolvente estructural profesional por componentes DJ:
// - bass: Sub-graves (bombo 4x4, sub-bass 30-100Hz) en Azul Cobalto / Índigo profundo
// - drums: Pegada y caja (kick punch, snare, claps 100-500Hz) en Bermellón enérgico
// - vocals: Vocales y leads melódicos (sintetizadores, formantes vocales 500-3000Hz) en Ámbar / Verde Esmeralda
// - treble: Agudos y platos (hi-hats, shakers, cymbals, aire >3000Hz) en Cian / Blanco Eléctrico
function computeTrackStructuralBands(xNorm, seed) {
    const s = ((seed % 17) - 8) * 0.006;
    const b1Start = Math.max(0.16, 0.22 + s);
    const b1End = b1Start + 0.12;
    const drop1End = b1End + 0.24;
    const b2Start = drop1End;
    const b2End = b2Start + 0.14;
    const drop2End = Math.min(0.88, b2End + 0.20);

    let bass = 0.15, drums = 0.15, vocals = 0.15, treble = 0.15;
    let isBreak = false;

    const beatGridKick = Math.pow(Math.abs(Math.cos(xNorm * 180 + seed)), 8);
    const snareHit = Math.pow(Math.abs(Math.sin(xNorm * 90 + seed)), 10);
    const hatPattern = 0.4 + 0.6 * Math.pow(Math.abs(Math.sin(xNorm * 360)), 3);

    if (xNorm < b1Start) {
        const p = xNorm / b1Start;
        bass = (0.70 + 0.25 * beatGridKick);
        drums = (0.50 + 0.35 * snareHit) * Math.min(1, p * 1.5);
        vocals = 0.20 + 0.25 * p * (0.6 + 0.4 * Math.sin(xNorm * 40));
        treble = (0.30 + 0.45 * p) * hatPattern;
    } else if (xNorm >= b1Start && xNorm < b1End) {
        isBreak = true;
        const p = (xNorm - b1Start) / (b1End - b1Start);
        bass = 0.04 + 0.03 * Math.sin(xNorm * 15);
        drums = 0.10 + 0.40 * Math.pow(p, 2) * snareHit;
        vocals = 0.85 + 0.15 * Math.sin(p * Math.PI) * (0.8 + 0.2 * Math.cos(xNorm * 30));
        treble = 0.40 + 0.55 * Math.pow(p, 1.8);
    } else if (xNorm >= b1End && xNorm < drop1End) {
        bass = 0.92 + 0.08 * beatGridKick;
        drums = 0.88 + 0.12 * snareHit;
        vocals = 0.65 + 0.25 * Math.sin(xNorm * 35);
        treble = 0.82 + 0.18 * hatPattern;
    } else if (xNorm >= b2Start && xNorm < b2End) {
        isBreak = true;
        const p = (xNorm - b2Start) / (b2End - b2Start);
        bass = 0.03 + 0.02 * Math.cos(xNorm * 10);
        drums = 0.08 + 0.50 * Math.pow(p, 2.5) * snareHit;
        vocals = 0.95 + 0.05 * Math.sin(p * Math.PI);
        treble = 0.45 + 0.50 * p;
    } else if (xNorm >= b2End && xNorm < drop2End) {
        bass = 0.98 + 0.02 * beatGridKick;
        drums = 0.92 + 0.08 * snareHit;
        vocals = 0.70 + 0.20 * Math.sin(xNorm * 45);
        treble = 0.88 + 0.12 * hatPattern;
    } else {
        const p = (xNorm - drop2End) / (1 - drop2End);
        bass = Math.max(0.08, (0.75 - 0.60 * p) * (0.8 + 0.2 * beatGridKick));
        drums = Math.max(0.08, (0.55 - 0.45 * p));
        vocals = Math.max(0.05, (0.35 - 0.30 * p));
        treble = Math.max(0.05, (0.45 - 0.38 * p));
    }

    return { bass, drums, vocals, treble, isBreak };
}

// =======================================================
// VECTOR SVG BRAND LOGOS PARA SUITES DJ DE CABINA
// =======================================================
const PlatformSeratoLogo = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="32" height="32" rx="7" fill="#021a24" />
        <path d="M7 21.5L12.5 9H16.5L11 21.5H7Z" fill="#00d1e8" />
        <path d="M14 23L19.5 10.5H23.5L18 23H14Z" fill="#00d1e8" />
        <path d="M21 21.5L24.5 13.5H27.5L24 21.5H21Z" fill="#22d3ee" fillOpacity="0.8" />
        <circle cx="26" cy="23" r="1.5" fill="#00d1e8" />
    </svg>
);

const PlatformRekordboxLogo = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="32" height="32" rx="7" fill="#091b33" />
        <circle cx="16" cy="16" r="9" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 1.5" />
        <circle cx="16" cy="16" r="5" stroke="#00e5ff" strokeWidth="1.8" />
        <circle cx="16" cy="16" r="2" fill="#38bdf8" />
        <path d="M16 4V8M16 24V28M4 16H8M24 16H28" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

const PlatformVirtualDjLogo = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="32" height="32" rx="7" fill="#2a1202" />
        <circle cx="16" cy="16" r="10" stroke="#f97316" strokeWidth="1.6" />
        <circle cx="16" cy="16" r="6.5" stroke="#fb923c" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
        <text x="16" y="19" textAnchor="middle" fill="#ffedd5" fontSize="8" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="0.5">VDJ</text>
    </svg>
);

const PlatformTraktorLogo = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="32" height="32" rx="7" fill="#241a02" />
        <rect x="7" y="8" width="18" height="4" rx="1" fill="#facc15" />
        <path d="M13.5 12H18.5V23.5C18.5 24.3 17.8 25 17 25H15C14.2 25 13.5 24.3 13.5 23.5V12Z" fill="#facc15" />
        <circle cx="22" cy="19" r="2" fill="#eab308" />
    </svg>
);

const PlatformAutoLogo = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="32" height="32" rx="7" fill="#1e0c2e" />
        <circle cx="16" cy="16" r="9" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 2" />
        <circle cx="16" cy="16" r="5" stroke="#c084fc" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="2" fill="#e9d5ff" />
        <path d="M16 6L18.5 10.5L16 9.2L13.5 10.5L16 6Z" fill="#a855f7" />
        <path d="M16 26L13.5 21.5L16 22.8L18.5 21.5L16 26Z" fill="#a855f7" />
    </svg>
);

const PlatformLogos = {
    auto: PlatformAutoLogo,
    serato: PlatformSeratoLogo,
    rekordbox: PlatformRekordboxLogo,
    virtualdj: PlatformVirtualDjLogo,
    traktor: PlatformTraktorLogo
};

const renderPlatformLogo = (id, size = 20, className = "") => {
    const key = (id || 'auto').toLowerCase();
    const Comp = PlatformLogos[key] || PlatformLogos.auto;
    return <Comp size={size} className={className} />;
};

// =======================================================
// WAVEFORM SERATO EN TIEMPO REAL CON ZOOM Y AYUDAS TÁCTICAS
// =======================================================
const CopilotSeratoWaveform = ({
    deck,
    side = "1",
    antiMuddy = null,
    partnerDeck = null
}) => {
    const canvasRef = useRef(null);
    const minimapRef = useRef(null);
    const minimapCacheRef = useRef(null);
    const [zoom, setZoom] = useState(4); // 2x, 4x, 8x, 16x
    const [showTacticalAids, setShowTacticalAids] = useState(true);
    const [progress, setProgress] = useState(deck.play_progress || 0.15);
    const progressRef = useRef(deck.play_progress || 0.15);
    const isPlayingRef = useRef(Boolean(deck.is_playing));
    const bpmRef = useRef(deck.bpm || 130.0);
    const durationSecRef = useRef(deck.duration_sec || 390.0);

    useEffect(() => {
        if (deck.play_progress !== undefined) {
            const diff = Math.abs(progressRef.current - deck.play_progress);
            if (diff > 0.02) {
                progressRef.current = deck.play_progress;
                setProgress(deck.play_progress);
            }
        }
        isPlayingRef.current = Boolean(deck.is_playing);
        bpmRef.current = parseFloat(deck.bpm) || 130.0;
        durationSecRef.current = parseFloat(deck.duration_sec) || 390.0;
    }, [deck.play_progress, deck.is_playing, deck.bpm, deck.duration_sec]);

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

                // Throttled UI state updates a ~30fps para mantener el hilo principal ágil
                if (now - lastUiUpdate >= 33) {
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

    const rawId = deck.file_path || deck.title || "1";
    const seed = rawId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;
    const durSec = deck.duration_sec || 390.0;
    const elapsedSec = progress * durSec;
    const remainSec = Math.max(0, durSec - elapsedSec);

    const formatSec = (s) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const cues = deck.cues || [];
    const phases = deck.structural_phases || [
        { id: "intro", name: "Intro", start_pct: 0.0, end_pct: 0.16, type: "intro", label: "Intro 32b • Mezcla In", color: "#06b6d4" },
        { id: "build", name: "Bassline In", start_pct: 0.16, end_pct: 0.35, type: "build", label: "Bassline Activa", color: "#eab308" },
        { id: "break", name: "Breakdown", start_pct: 0.35, end_pct: 0.48, type: "break", label: "Breakdown (Sin Graves)", color: "#38bdf8" },
        { id: "drop", name: "MAIN DROP", start_pct: 0.48, end_pct: 0.74, type: "drop", label: "⚡ DROP PRINCIPAL (Clímax)", color: "#ef4444" },
        { id: "break2", name: "Segundo Parón", start_pct: 0.74, end_pct: 0.82, type: "break", label: "Puente Melódico", color: "#a855f7" },
        { id: "outro", name: "Outro", start_pct: 0.82, end_pct: 1.0, type: "outro", label: "🟢 MEZCLA SEGURA (Outro)", color: "#10b981" }
    ];

    const nextCue = cues.find(c => (c.pct || 0) > progress);
    const beatsToNextCue = nextCue && deck.bpm ? Math.round(((nextCue.pct - progress) * durSec) / (60.0 / deck.bpm)) : null;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const w = rect.width || canvas.parentElement.clientWidth || 550;
        const h = 100;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        const ctx = canvas.getContext('2d');
        if (ctx.resetTransform) ctx.resetTransform(); else ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#05050a';
        ctx.fillRect(0, 0, w, h);

        const midY = h / 2;
        const playheadX = w / 2;

        const windowSec = durSec / zoom;
        const halfWindowSec = windowSec / 2;
        const currentSec = progress * durSec;
        const startSec = currentSec - halfWindowSec;
        const endSec = currentSec + halfWindowSec;

        // Rejilla de compases (Beatgrid Serato)
        const bpm = deck.bpm || 130.0;
        const beatSec = 60.0 / bpm;
        if (beatSec > 0) {
            const firstBeatIdx = Math.floor(startSec / beatSec);
            const lastBeatIdx = Math.ceil(endSec / beatSec);
            for (let b = firstBeatIdx; b <= lastBeatIdx; b++) {
                const bSec = b * beatSec;
                const bx = playheadX + ((bSec - currentSec) / windowSec) * w;
                if (bx >= 0 && bx <= w) {
                    const isBar = (b % 4 === 0);
                    const isPhrase = (b % 16 === 0);
                    ctx.strokeStyle = isPhrase ? 'rgba(255, 255, 255, 0.40)' : isBar ? 'rgba(255, 255, 255, 0.20)' : 'rgba(255, 255, 255, 0.07)';
                    ctx.lineWidth = isPhrase ? 1.5 : 1;
                    ctx.beginPath();
                    ctx.moveTo(bx, isBar ? 8 : 16);
                    ctx.lineTo(bx, h - (isBar ? 8 : 16));
                    ctx.stroke();

                    if (isBar && bx > 15 && bx < w - 25) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                        ctx.font = '8px monospace';
                        ctx.fillText(`${Math.floor(b / 4) + 1}`, bx + 2, 14);
                    }
                }
            }
        }

        // Zonas y Ayudas Tácticas en el Waveform
        if (showTacticalAids) {
            phases.forEach(ph => {
                const phStartSec = ph.start_pct * durSec;
                const phEndSec = ph.end_pct * durSec;
                if (phEndSec >= startSec && phStartSec <= endSec) {
                    const x1 = Math.max(0, playheadX + ((phStartSec - currentSec) / windowSec) * w);
                    const x2 = Math.min(w, playheadX + ((phEndSec - currentSec) / windowSec) * w);
                    if (x2 > x1) {
                        ctx.fillStyle = `${ph.color}15`;
                        ctx.fillRect(x1, 0, x2 - x1, h);

                        ctx.fillStyle = `${ph.color}88`;
                        ctx.fillRect(x1, 0, x2 - x1, 2);

                        if (x2 - x1 > 70) {
                            ctx.fillStyle = ph.color;
                            ctx.font = 'bold 9px sans-serif';
                            ctx.fillText(ph.label, x1 + 6, 15);
                        }
                    }
                }
            });

            if (antiMuddy && antiMuddy.status === 'danger' && (deck.low_ratio || 0) >= 44) {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
                ctx.fillRect(playheadX - 50, 0, 100, h);
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
                ctx.lineWidth = 1;
                ctx.strokeRect(playheadX - 50, 0, 100, h);
            }
        }

        // Espectro Dinámico 3-Bandas
        const stepPx = 2;
        const totalSlices = Math.ceil(w / stepPx);
        for (let i = 0; i < totalSlices; i++) {
            const x = i * stepPx;
            const sliceSec = startSec + (x / w) * windowSec;
            const sliceNorm = sliceSec / durSec;

            if (sliceNorm >= 0.0 && sliceNorm <= 1.0) {
                const { bass, drums, vocals, treble } = computeTrackStructuralBands(sliceNorm, seed);
                const maxAmp = (h / 2) - 10;

                const bassAmp = bass * maxAmp * 0.95;
                ctx.fillStyle = '#2563eb';
                ctx.fillRect(x, midY - bassAmp, stepPx - 0.4, bassAmp * 2);

                const midAmp = Math.max(drums, vocals) * maxAmp * 0.75;
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(x, midY - midAmp, stepPx - 0.4, midAmp * 2);

                const trebAmp = treble * maxAmp * 0.5;
                ctx.fillStyle = '#06b6d4';
                ctx.fillRect(x, midY - trebAmp, stepPx - 0.4, trebAmp * 2);

                if (bass > 0.8 || treble > 0.8) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x, midY - 1, stepPx - 0.4, 2);
                }
            }
        }

        // Pines y Banderines de Hot Cues (1 a 8)
        if (showTacticalAids) {
            cues.forEach(cue => {
                const cueSec = (cue.pct !== undefined ? cue.pct : 0) * durSec;
                if (cueSec >= startSec && cueSec <= endSec) {
                    const cx = playheadX + ((cueSec - currentSec) / windowSec) * w;
                    if (cx >= 0 && cx <= w) {
                        ctx.strokeStyle = cue.color || '#06b6d4';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(cx, 0);
                        ctx.lineTo(cx, h);
                        ctx.stroke();

                        ctx.fillStyle = cue.color || '#06b6d4';
                        if (ctx.roundRect) {
                            ctx.beginPath();
                            ctx.roundRect(cx - 2, 4, 38, 14, 3);
                            ctx.fill();
                        } else {
                            ctx.fillRect(cx - 2, 4, 38, 14);
                        }

                        ctx.fillStyle = '#000000';
                        ctx.font = 'bold 9px monospace';
                        ctx.fillText(`C${cue.id || ''}`, cx + 2, 14);
                    }
                }
            });
        }

        // Aguja Central Playhead Serato (Línea Blanca con Flechas)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, h);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(playheadX - 6, 0);
        ctx.lineTo(playheadX + 6, 0);
        ctx.lineTo(playheadX, 9);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(playheadX - 6, h);
        ctx.lineTo(playheadX + 6, h);
        ctx.lineTo(playheadX, h - 9);
        ctx.closePath();
        ctx.fill();

        // Insignias Flotantes Tácticas
        if (showTacticalAids) {
            if (antiMuddy && antiMuddy.status === 'danger' && (deck.low_ratio || 0) >= 44) {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
                if (ctx.roundRect) {
                    ctx.beginPath();
                    ctx.roundRect(playheadX - 70, h - 26, 140, 20, 5);
                    ctx.fill();
                } else {
                    ctx.fillRect(playheadX - 70, h - 26, 140, 20);
                }
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('🛡️ BASS CLASH: Cortar Low EQ', playheadX, h - 13);
                ctx.textAlign = 'left';
            } else if (beatsToNextCue !== null && beatsToNextCue > 0 && beatsToNextCue <= 32) {
                ctx.fillStyle = 'rgba(234, 179, 8, 0.95)';
                if (ctx.roundRect) {
                    ctx.beginPath();
                    ctx.roundRect(playheadX - 60, h - 26, 120, 20, 5);
                    ctx.fill();
                } else {
                    ctx.fillRect(playheadX - 60, h - 26, 120, 20);
                }
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 9px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`⚡ ${nextCue.name || 'CUE'} en ${beatsToNextCue}b`, playheadX, h - 13);
                ctx.textAlign = 'left';
            }
        }

        // Minimapa Overview de la Pista Completa con Capa Pre-renderizada en Cache
        const miniCanvas = minimapRef.current;
        if (!miniCanvas) return;
        const mRect = miniCanvas.getBoundingClientRect();
        const mw = mRect.width || miniCanvas.parentElement.clientWidth || 550;
        const mh = 26;
        miniCanvas.width = Math.round(mw * dpr);
        miniCanvas.height = Math.round(mh * dpr);
        const mCtx = miniCanvas.getContext('2d');
        if (mCtx.resetTransform) mCtx.resetTransform(); else mCtx.setTransform(1, 0, 0, 1, 0, 0);
        mCtx.scale(dpr, dpr);

        const cacheKey = `${rawId}_${mw}_${showTacticalAids}`;
        if (!minimapCacheRef.current || minimapCacheRef.current.key !== cacheKey) {
            const off = document.createElement('canvas');
            off.width = Math.round(mw * dpr);
            off.height = Math.round(mh * dpr);
            const oCtx = off.getContext('2d');
            if (oCtx.resetTransform) oCtx.resetTransform(); else oCtx.setTransform(1, 0, 0, 1, 0, 0);
            oCtx.scale(dpr, dpr);

            oCtx.fillStyle = '#06060e';
            oCtx.fillRect(0, 0, mw, mh);

            const mStep = 2;
            const mSlices = Math.ceil(mw / mStep);
            for (let j = 0; j < mSlices; j++) {
                const mx = j * mStep;
                const mNorm = mx / mw;
                const { bass, treble } = computeTrackStructuralBands(mNorm, seed);
                const mHalf = mh / 2;
                const bAmp = bass * (mHalf - 2);
                const tAmp = treble * (mHalf - 4);

                oCtx.fillStyle = '#2563eb';
                oCtx.fillRect(mx, mHalf - bAmp, mStep - 0.4, bAmp * 2);

                oCtx.fillStyle = '#06b6d4';
                oCtx.fillRect(mx, mHalf - tAmp, mStep - 0.4, tAmp * 2);
            }

            if (showTacticalAids) {
                phases.forEach(ph => {
                    const px1 = ph.start_pct * mw;
                    const px2 = ph.end_pct * mw;
                    oCtx.fillStyle = `${ph.color}25`;
                    oCtx.fillRect(px1, 0, px2 - px1, mh);
                    oCtx.fillStyle = ph.color;
                    oCtx.fillRect(px1, 0, px2 - px1, 2);
                });

                cues.forEach(cue => {
                    const cx = (cue.pct || 0) * mw;
                    oCtx.fillStyle = cue.color || '#06b6d4';
                    oCtx.fillRect(cx - 1, 0, 2, mh);
                });
            }

            minimapCacheRef.current = { key: cacheKey, canvas: off };
        }

        // Dibujar el fondo estático precalculado instantáneamente
        mCtx.drawImage(minimapCacheRef.current.canvas, 0, 0, mw, mh);

        // Aguja playhead y ventana de zoom visible
        const vStart = Math.max(0, (startSec / durSec) * mw);
        const vEnd = Math.min(mw, (endSec / durSec) * mw);
        mCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        mCtx.fillRect(vStart, 0, Math.max(4, vEnd - vStart), mh);
        mCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        mCtx.lineWidth = 1;
        mCtx.strokeRect(vStart, 0, Math.max(4, vEnd - vStart), mh);

        const mPlayheadX = progress * mw;
        mCtx.fillStyle = '#ffffff';
        mCtx.fillRect(mPlayheadX - 1, 0, 2, mh);
    }, [zoom, showTacticalAids, progress, deck, antiMuddy]);

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
        <div className="flex flex-col gap-1.5 p-2 sm:p-2.5 rounded-2xl bg-[#030308] border border-zinc-800/90 shadow-inner">
            {/* Barra de Control del Waveform */}
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
                {/* BOTÓN TOGGLE DE AYUDAS TÁCTICAS DJ */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowTacticalAids(!showTacticalAids)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer border text-[10px] sm:text-[11px] ${
                            showTacticalAids
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                        }`}
                        title="Habilitar/Deshabilitar ayudas visuales (Drops, Cues, Zonas Seguras y Anti-Muddy) en el waveform"
                    >
                        <span>{showTacticalAids ? '🎯' : '⚪'}</span>
                        <span>{showTacticalAids ? 'Ayudas DJ: ACTIVAS' : 'Ayudas DJ: OFF'}</span>
                    </button>

                    <span className="hidden sm:inline-block text-[10px] text-zinc-500">
                        {showTacticalAids ? 'Drops & Cues Visibles' : 'Puro Serato'}
                    </span>
                </div>

                {/* CONTROLES DE ZOOM Y TIEMPOS */}
                <div className="flex items-center gap-2">
                    {/* Zoom Presets */}
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

                    {/* Tiempo Transcurrido y Restante */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[10px] sm:text-[11px]">
                        <span className="text-white font-bold">{formatSec(elapsedSec)}</span>
                        <span className="text-zinc-600">/</span>
                        <span className="text-zinc-400">-{formatSec(remainSec)}</span>
                    </div>
                </div>
            </div>

            {/* Canvas Waveform Zoom Serato (Centrado en Playhead) */}
            <div className="relative w-full rounded-xl overflow-hidden border border-zinc-800/80 bg-[#05050b]">
                <canvas
                    ref={canvasRef}
                    style={{ width: '100%', height: '100px', display: 'block' }}
                />
            </div>

            {/* Canvas Minimap Track Overview Completo (0-100%) */}
            <div 
                onClick={handleMinimapClick}
                className="relative w-full rounded-lg overflow-hidden border border-zinc-800/60 bg-[#06060e] cursor-pointer hover:border-zinc-700 transition-colors"
                title="Haz clic en cualquier punto para saltar en la pista"
            >
                <canvas
                    ref={minimapRef}
                    style={{ width: '100%', height: '26px', display: 'block' }}
                />
            </div>
        </div>
    );
};

function LiveCopilotApp() {
    const [state, setState] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [clock, setClock] = useState('');
    const [latency, setLatency] = useState(2);
    const [errorCount, setErrorCount] = useState(0);

    // Reloj en tiempo real de cabina
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setClock(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Conexión en tiempo real: Server-Sent Events (SSE) con fallback a Polling
    useEffect(() => {
        let isMounted = true;
        let eventSource = null;
        let isFetching = false;
        let fallbackInterval = null;

        const startPollingFallback = () => {
            if (fallbackInterval) return;
            const fetchStatus = async () => {
                if (isFetching || document.hidden) return;
                isFetching = true;
                const t0 = performance.now();
                try {
                    const res = await fetch('/api/copilot/status');
                    if (res.ok) {
                        const data = await res.json();
                        const dt = Math.round(performance.now() - t0);
                        if (isMounted) {
                            setState(data);
                            setLatency(dt > 0 ? dt : 2);
                            setErrorCount(0);
                        }
                    }
                } catch (e) {
                    if (isMounted) setErrorCount(prev => prev + 1);
                } finally {
                    isFetching = false;
                }
            };
            fetchStatus();
            fallbackInterval = setInterval(fetchStatus, 1500);
        };

        // 1. Intentar Server-Sent Events (SSE) para latencia instantánea (<10ms)
        if (typeof EventSource !== 'undefined') {
            try {
                eventSource = new EventSource('/api/copilot/stream');
                eventSource.onmessage = (event) => {
                    if (!isMounted) return;
                    try {
                        const data = JSON.parse(event.data);
                        setState(data);
                        setLatency(2);
                        setErrorCount(0);
                    } catch (_) {}
                };
                eventSource.onerror = () => {
                    // Si SSE falla, activar polling transparente
                    if (eventSource) {
                        eventSource.close();
                        eventSource = null;
                    }
                    startPollingFallback();
                };
            } catch (_) {
                startPollingFallback();
            }
        } else {
            startPollingFallback();
        }

        return () => {
            isMounted = false;
            if (eventSource) eventSource.close();
            if (fallbackInterval) clearInterval(fallbackInterval);
        };
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
        }
    };

    const toggleSimulation = async () => {
        try {
            const res = await fetch('/api/copilot/toggle_simulation', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setState(data);
            }
        } catch (e) {}
    };

    const setPlatform = async (plat) => {
        try {
            const res = await fetch('/api/copilot/set_platform', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform: plat })
            });
            if (res.ok) {
                const data = await res.json();
                setState(data);
            }
        } catch (e) {}
    };

    if (!state) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#040407]">
                <div className="w-12 h-12 rounded-full border-4 border-djcyan-500/20 border-t-djcyan-400 animate-spin"></div>
                <p className="font-mono text-xs text-djcyan-400 uppercase tracking-widest animate-pulse">
                    Sincronizando con suites DJ (Serato, Rekordbox, VDJ, Traktor) & BeatWave DSP...
                </p>
            </div>
        );
    }

    const { deck_1, deck_2, anti_muddy, harmonic, recommendations, local_ip, platform, platform_mode, platform_name, platform_icon, platform_color, platform_status } = state;
    const companionUrl = `http://${local_ip || '127.0.0.1'}:8000/copilot.html`;

    const platformsList = [
        { id: 'auto', label: 'Auto', color: '#a855f7' },
        { id: 'serato', label: 'Serato', color: '#00d1e8' },
        { id: 'rekordbox', label: 'Rekordbox', color: '#38bdf8' },
        { id: 'virtualdj', label: 'VirtualDJ', color: '#f97316' },
        { id: 'traktor', label: 'Traktor', color: '#facc15' }
    ];

    const isLive = state.source && state.source.endsWith('_LIVE');
    const isStandby = state.source && state.source.endsWith('_STANDBY');

    return (
        <div className="flex flex-col min-h-screen p-3 sm:p-5 lg:p-6 select-none bg-[#040407] text-gray-200">
            {/* BARRA SUPERIOR DE CABINA HUD */}
            <header className="flex flex-col md:flex-row md:items-center justify-between pb-3 sm:pb-4 border-b border-zinc-800/80 mb-4 sm:mb-6 gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full ${
                            isLive 
                            ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse' 
                            : isStandby 
                            ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)] animate-pulse'
                            : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                        }`}></span>
                        <h1 className="font-syne font-black text-lg sm:text-2xl text-white tracking-wider uppercase">
                            BEATWAVE <span className="text-djcyan-400">COPILOT</span>
                        </h1>
                    </div>

                    {/* BADGE DEL SOFTWARE ACTIVO CON LOGO OFICIAL */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700/60 font-mono text-xs">
                        {renderPlatformLogo(platform || 'serato', 16)}
                        <strong style={{ color: platform_color || '#00d1e8' }}>{platform_name || 'DJ LINK'}</strong>
                        <span className="text-zinc-600">|</span>
                        <span className={isLive ? 'text-red-400 font-bold' : isStandby ? 'text-blue-400' : 'text-amber-400 font-bold'}>
                            {platform_status || (isLive ? 'LIVE' : 'STANDBY')}
                        </span>
                    </div>

                    <span className="hidden xl:inline-block font-mono text-[11px] text-zinc-500">
                        LATENCIA: <span className="text-emerald-400 font-bold">{latency}ms</span>
                    </span>
                </div>

                {/* SELECTOR DE PLATAFORMA & CONTROLES */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between md:justify-end">
                    {/* SELECTOR DE PLATAFORMA MULTI-DJ CON LOGOS OFICIALES */}
                    <div className="flex items-center p-1 bg-zinc-950/90 rounded-xl border border-zinc-800/90 shadow-inner">
                        {platformsList.map(p => {
                            const isSelected = (platform_mode === p.id) || (platform_mode === 'auto' && p.id === 'auto');
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setPlatform(p.id)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                                        isSelected 
                                        ? 'bg-zinc-800 text-white shadow-md border border-zinc-600'
                                        : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                    style={isSelected ? { color: p.color, borderColor: `${p.color}66` } : {}}
                                    title={`Conectar con ${p.label}`}
                                >
                                    {renderPlatformLogo(p.id, 16)}
                                    <span className="hidden sm:inline text-[11px]">{p.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* RELOJ CABINA */}
                    <div className="font-mono text-sm sm:text-base font-bold text-white bg-zinc-900/90 px-3 py-1 rounded-xl border border-zinc-800 shadow-inner">
                        {clock || state.last_updated}
                    </div>

                    {/* BOTÓN MODO SIMULACIÓN */}
                    <button
                        onClick={toggleSimulation}
                        className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer border ${
                            state.source === 'SIMULATION_MODE'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-700/60'
                        }`}
                        title="Alternar entre lectura real del software DJ o simulación de pistas"
                    >
                        🧪 {state.source === 'SIMULATION_MODE' ? 'Simulando' : 'Simular'}
                    </button>

                    {/* BOTÓN CONECTAR IPAD */}
                    <button
                        onClick={() => setQrModalOpen(true)}
                        className="px-2.5 sm:px-3 py-1 rounded-xl text-xs font-mono font-bold text-djcyan-400 bg-djcyan-950/40 hover:bg-djcyan-900/50 border border-djcyan-500/40 uppercase transition-all cursor-pointer shadow-sm"
                        title="Mostrar enlace y código QR para conectar iPad o móvil en cabina"
                    >
                        📱 iPad
                    </button>

                    {/* BOTÓN PANTALLA COMPLETA */}
                    <button
                        onClick={toggleFullscreen}
                        className="p-1.5 sm:p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 cursor-pointer transition-all"
                        title="Alternar Pantalla Completa (F11)"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* CUERPO PRINCIPAL: DUAL DECK HEADS-UP DISPLAY ENRIQUECIDO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <DeckCard deck={deck_1} side="A" isMaster={deck_1.is_master} antiMuddy={anti_muddy} partnerDeck={deck_2} />
                <DeckCard deck={deck_2} side="B" isMaster={deck_2.is_master} antiMuddy={anti_muddy} partnerDeck={deck_1} />
            </div>

            {/* GUARDIÁN TÁCTICO ANTI-MUDDY & RADAR ARMÓNICO */}
            <section className="mb-4 sm:mb-6">
                <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    anti_muddy.status === 'danger'
                    ? 'bg-red-950/25 border-red-500/80 animate-danger-pulse'
                    : anti_muddy.status === 'warning'
                    ? 'bg-amber-950/25 border-amber-500/80 animate-warning-pulse'
                    : 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                }`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                            <span className="text-xl sm:text-2xl">
                                {anti_muddy.status === 'danger' ? '🛡️' : anti_muddy.status === 'warning' ? '⚡' : '🟢'}
                            </span>
                            <div>
                                <h2 className="font-syne font-black text-base sm:text-lg text-white tracking-wide">
                                    {anti_muddy.title}
                                </h2>
                                <p className="text-xs sm:text-sm text-zinc-300 mt-0.5">
                                    {anti_muddy.message}
                                </p>
                            </div>
                        </div>

                        {/* ACCIÓN RECOMENDADA INMEDIATA */}
                        <div className="px-3.5 py-1.5 rounded-xl bg-black/60 border border-zinc-700/60 font-mono text-xs flex items-center gap-2 self-start md:self-auto">
                            <span className="text-zinc-500 uppercase tracking-wider">ACCIÓN:</span>
                            <span className="text-white font-bold">{anti_muddy.action}</span>
                        </div>
                    </div>

                    {/* CRUCE ARMÓNICO CAMELOT & ENERGÍA */}
                    <div className="pt-3 mt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                        <div className="flex items-center gap-2">
                            <span className="text-zinc-400">Transición Armónica:</span>
                            <span 
                                className="px-2 py-0.5 rounded-lg font-bold text-black uppercase text-[10px]"
                                style={{ backgroundColor: harmonic.color || '#06b6d4' }}
                            >
                                {harmonic.badge}
                            </span>
                            <span className="text-zinc-300 font-sans">{harmonic.label}</span>
                        </div>

                        {/* DELTA DE ENERGÍA LUFS & TEMPO */}
                        <div className="flex items-center gap-4 text-zinc-400">
                            <div>
                                Δ LUFS: <strong className={Math.abs(state.lufs_delta) > 3 ? 'text-amber-400' : 'text-emerald-400'}>
                                    {state.lufs_delta > 0 ? `+${state.lufs_delta}` : state.lufs_delta} dB
                                </strong>
                            </div>
                            <div>
                                Δ BPM: <strong className="text-white">
                                    {state.bpm_delta > 0 ? `+${state.bpm_delta}` : state.bpm_delta} ({state.bpm_pct > 0 ? `+${state.bpm_pct}` : state.bpm_pct}%)
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECCIÓN DE RECOMENDACIONES TÁCTICAS INMEDIATAS ENRIQUECIDAS */}
            <section className="mt-auto">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-base">🎯</span>
                        <h3 className="font-syne font-black text-xs sm:text-sm uppercase tracking-wider text-zinc-300">
                            Sugerencias Tácticas Compatibles (Anti-Muddy & Camelot)
                        </h3>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500">
                        FILTRADAS DE TU BIBLIOTECA AUDITADA
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {recommendations && recommendations.map(rec => (
                        <div 
                            key={rec.id}
                            className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 hover:border-djcyan-500/50 hover:bg-zinc-900/60 transition-all flex flex-col justify-between group"
                        >
                            <div className="flex items-start gap-3 mb-2">
                                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-zinc-700/60 bg-black">
                                    <img 
                                        src={getValidCover(rec.cover)} 
                                        alt="Cover" 
                                        onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                        <div className="font-syne font-bold text-sm text-white group-hover:text-djcyan-400 transition-colors truncate">
                                            {rec.title}
                                        </div>
                                        <div 
                                            className="px-2 py-0.5 rounded-lg font-orbitron font-bold text-xs text-black shrink-0"
                                            style={{ backgroundColor: rec.camelot_color }}
                                        >
                                            {rec.camelot}
                                        </div>
                                    </div>
                                    <div className="font-syne text-xs text-zinc-400 truncate">
                                        {rec.artist}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] font-mono">
                                        <span className="text-djcyan-400 font-bold">{rec.bpm} BPM</span>
                                        {rec.genre && <span className="text-zinc-500 truncate">• {rec.genre}</span>}
                                        {rec.energy && <span className="text-amber-400 font-bold shrink-0">⚡{rec.energy}%</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="text-[11px] text-zinc-400 font-mono mb-2 line-clamp-2">
                                {rec.reason}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 font-mono text-[10px] text-zinc-500">
                                <span className="text-djcyan-400 font-bold uppercase">{rec.strategy}</span>
                                <span>Sub: {rec.low_ratio}%</span>
                                <span>{rec.lufs} dB</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* MODAL QR PARA CONEXIÓN IPAD */}
            {qrModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
                        <button
                            onClick={() => setQrModalOpen(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800 transition-colors"
                        >
                            ✕
                        </button>
                        <h3 className="font-syne font-black text-xl text-white mb-1 uppercase tracking-wide">
                            Conectar iPad en Cabina
                        </h3>
                        <p className="text-xs text-zinc-400 font-mono mb-4">
                            Escanea con la cámara de tu tablet o móvil estando conectado al mismo Wi-Fi:
                        </p>
                        <div className="p-3 bg-white rounded-2xl shadow-lg mb-4">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(companionUrl)}`} 
                                alt="Código QR iPad"
                                className="w-44 h-44 object-contain"
                            />
                        </div>
                        <div className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs text-djcyan-400 font-bold break-all select-all mb-4">
                            {companionUrl}
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(companionUrl);
                                setQrModalOpen(false);
                            }}
                            className="w-full py-2.5 rounded-xl bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono text-xs font-bold uppercase transition-all shadow-md cursor-pointer"
                        >
                            Copiar Enlace Directo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Subcomponente de Tarjeta de Deck A/B Enriquecido
function DeckCard({ deck, side, isMaster, antiMuddy = null, partnerDeck = null }) {
    if (!deck) return null;

    return (
        <div className={`p-4 sm:p-5 lg:p-6 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${
            isMaster 
            ? 'bg-gradient-to-b from-[#0c0d1c] to-[#06060c] border-djcyan-500/70 shadow-[0_0_30px_rgba(6,182,212,0.25)]' 
            : 'bg-[#07070f] border-zinc-800 hover:border-zinc-700'
        }`}>
            {/* CABECERA DEL DECK */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                    <span className="font-orbitron font-black text-base sm:text-lg text-zinc-400">
                        DECK {side}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-black uppercase tracking-wider ${
                        isMaster 
                        ? 'bg-djcyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse' 
                        : 'bg-zinc-800 text-zinc-300'
                    }`}>
                        {isMaster ? '🔊 MASTER (ON AIR)' : '🎧 EN CUE (PREPARADO)'}
                    </span>
                    {deck.phase && (
                        <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/40 text-[10px] font-mono font-bold text-purple-300 uppercase">
                            ✨ {deck.phase}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 uppercase">
                    {deck.format && (
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/60 text-[10px] font-bold text-zinc-300">
                            {deck.format}
                        </span>
                    )}
                    <span>{deck.is_audited ? '✓ DSP BEATWAVE' : 'DEFAULT DSP'}</span>
                </div>
            </div>

            {/* SECCIÓN CARÁTULA 1:1 + TÍTULO / ARTISTA / GÉNERO / DURACIÓN */}
            <div className="flex items-start gap-3.5 mb-3.5">
                {/* CARÁTULA 1:1 CON BADGE */}
                <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-2xl overflow-hidden shrink-0 border border-zinc-700/70 shadow-lg bg-black group">
                    <img 
                        src={getValidCover(deck.cover)} 
                        alt="Carátula" 
                        onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                    {deck.duration && (
                        <span className="absolute bottom-1 right-1.5 px-1.5 py-0.2 rounded bg-black/85 text-[9px] font-mono font-bold text-zinc-300">
                            {deck.duration}
                        </span>
                    )}
                    {deck.year && (
                        <span className="absolute top-1 left-1.5 px-1 py-0.2 rounded bg-black/75 text-[9px] font-mono text-zinc-400">
                            {deck.year}
                        </span>
                    )}
                </div>

                {/* TÍTULO Y ARTISTA */}
                <div className="min-w-0 flex-1">
                    <h2 className="font-syne font-black text-xl sm:text-2xl lg:text-3xl text-white tracking-wide leading-tight line-clamp-1" title={deck.title}>
                        {deck.title}
                    </h2>
                    <p className="font-syne font-bold text-sm sm:text-base text-zinc-400 mt-0.5 line-clamp-1" title={deck.artist}>
                        {deck.artist}
                    </p>
                    {/* BADGES TAXONOMÍA */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        {deck.genre && (
                            <span className="px-2 py-0.5 rounded-md bg-djcyan-950/60 border border-djcyan-500/40 text-[10px] font-mono font-bold text-djcyan-300">
                                {deck.genre}
                            </span>
                        )}
                        {deck.subgenre && (
                            <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700/60 text-[10px] font-mono text-zinc-400">
                                {deck.subgenre}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* CAMELOT BADGE, BPM HERO & ENERGÍA/DANCEABILITY */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3.5">
                {/* INSIGNIA CAMELOT */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-black/40 border border-zinc-800/80">
                    <div 
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-orbitron font-black text-base sm:text-lg text-black shadow-lg shrink-0"
                        style={{ backgroundColor: deck.camelot_color }}
                    >
                        {deck.camelot}
                    </div>
                    <div className="min-w-0">
                        <div className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">Tonalidad</div>
                        <div className="font-syne font-bold text-xs sm:text-sm text-white truncate">{deck.raw_key || deck.camelot}</div>
                    </div>
                </div>

                {/* BPM & TEMPO */}
                <div className="p-2.5 rounded-2xl bg-black/40 border border-zinc-800/80 flex flex-col justify-center">
                    <div className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">Tempo Estricto</div>
                    <div className="font-orbitron font-black text-lg sm:text-xl text-white">
                        {deck.bpm ? Number(deck.bpm).toFixed(2) : '130.00'} <span className="text-[10px] font-normal text-zinc-400 font-mono">BPM</span>
                    </div>
                </div>

                {/* ENERGÍA & DANCEABILITY */}
                <div className="col-span-2 sm:col-span-1 p-2 rounded-2xl bg-black/40 border border-zinc-800/80 flex flex-col justify-center gap-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-amber-400 font-bold flex items-center gap-1">⚡ ENERGÍA</span>
                        <span className="text-white font-bold">{deck.energy || 90}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full" style={{ width: `${deck.energy || 90}%` }}></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
                        <span className="text-purple-400 font-bold flex items-center gap-1">🕺 GROOVE</span>
                        <span className="text-white font-bold">{deck.danceability || 88}%</span>
                    </div>
                </div>
            </div>

            {/* TIRA VISUAL DE 8 HOT CUES DE CABINA */}
            <div className="mb-3 p-2.5 rounded-2xl bg-black/60 border border-zinc-800/80">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-mono uppercase text-zinc-400 tracking-wider font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-djcyan-400"></span> 8 HOT CUES DE CABINA
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">Puntos de Salto & Estructura</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {(deck.cues || [
                        { id: 1, name: "Downbeat", color: "#ef4444", time: "00:00" },
                        { id: 2, name: "Intro", color: "#f97316", time: "01:04" },
                        { id: 3, name: "Bass In", color: "#eab308", time: "02:08" },
                        { id: 4, name: "MAIN DROP", color: "#10b981", time: "03:12" },
                        { id: 5, name: "Break", color: "#06b6d4", time: "04:16" },
                        { id: 6, name: "Climax", color: "#3b82f6", time: "05:04" },
                        { id: 7, name: "Outro 32b", color: "#8b5cf6", time: "06:08" },
                        { id: 8, name: "Cut / Fade", color: "#ec4899", time: "07:15" },
                    ]).map((cue, cIdx) => (
                        <div 
                            key={cue.id || cIdx}
                            className="p-1 rounded-xl border flex flex-col justify-between transition-all bg-zinc-950/80 hover:bg-zinc-900 cursor-default"
                            style={{ borderColor: `${cue.color || '#06b6d4'}55` }}
                        >
                            <div className="flex items-center justify-between">
                                <span 
                                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black text-black font-mono shadow-sm"
                                    style={{ backgroundColor: cue.color || '#06b6d4' }}
                                >
                                    {cue.id || (cIdx + 1)}
                                </span>
                                <span className="text-[8px] font-mono text-zinc-500">{cue.time || '--:--'}</span>
                            </div>
                            <div className="text-[8px] font-syne font-bold text-zinc-200 truncate mt-1" title={cue.name}>
                                {cue.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* WAVEFORM SERATO EN TIEMPO REAL CON ZOOM Y AYUDAS TÁCTICAS */}
            <div className="mb-3">
                <CopilotSeratoWaveform 
                    deck={deck} 
                    side={side} 
                    antiMuddy={antiMuddy} 
                    partnerDeck={partnerDeck} 
                />
            </div>

            {/* HUELLA ESPECTRAL ACÚSTICA (SUB / MED / HI) */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800/60 font-mono text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                    <span>Densidad Sub-Graves (Sub-Bass)</span>
                    <span className={deck.low_ratio >= 44 ? 'text-red-400 font-bold' : 'text-zinc-200'}>{deck.low_ratio}%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden flex">
                    <div 
                        className={`h-full transition-all duration-300 ${
                            deck.low_ratio >= 44 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-djcyan-400'
                        }`} 
                        style={{ width: `${Math.min(100, deck.low_ratio * 1.5)}%` }}
                    ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
                    <span>Medios: {deck.mid_ratio}%</span>
                    <span>Agudos: {deck.high_ratio}%</span>
                    <span>LUFS: <strong className="text-zinc-300">{deck.lufs} dB</strong></span>
                </div>
            </div>

            {/* COMENTARIO TÁCTICO CABINA */}
            <div className="mt-2.5 p-2.5 rounded-2xl bg-black/50 border border-zinc-800/80 flex items-start gap-2.5">
                <span className="text-emerald-400 text-sm shrink-0">💬</span>
                <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">Comentario Táctico DJ (Tag ID3)</div>
                    <div className="font-mono text-xs text-zinc-200 truncate" title={deck.comment || deck.tactical_comment || `[${deck.bpm ? Number(deck.bpm).toFixed(1) : '--'} BPM | ${deck.camelot}] Intro 32b • Drop contundente • Outro 64b`}>
                        {deck.comment || deck.tactical_comment || `[${deck.bpm ? Number(deck.bpm).toFixed(1) : '--'} BPM | ${deck.camelot}] Intro 32b • Drop contundente • Outro 64b`}
                    </div>
                </div>
            </div>
        </div>
    );
}

if (document.getElementById('copilot-root')) {
    ReactDOM.render(<LiveCopilotApp />, document.getElementById('copilot-root'));
}

window.LiveCopilotApp = LiveCopilotApp;
window.DeckCard = DeckCard;
