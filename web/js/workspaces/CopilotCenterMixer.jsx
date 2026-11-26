const { useState, useEffect, useRef, useMemo, memo } = React;

/**
 * SVG Rotary Knob para la mesa de mezclas
 * Rota visualmente según el valor de entrada [0..1] (0.5 = 12 en punto / 0°)
 */
const HardwareKnob = memo(({
    value = 0.5,
    color = '#00F0FF',
    label = '',
    isFilter = false,
    onChange = null
}) => {
    const parsedVal = Number(value);
    const v = Number.isFinite(parsedVal) ? Math.max(0, Math.min(1, parsedVal)) : 0.5;
    // Rotación: de -135° a +135° (270° de recorrido total)
    const angle = Math.round((v - 0.5) * 270);

    return (
        <svg 
            className="dj-knob-svg bw-dj-knob-svg select-none" 
            viewBox="0 0 40 40"
            title={`${label}: ${v >= 0.5 ? '+' : ''}${Math.round((v - 0.5) * 200)}%`}
        >
            <circle 
                cx="20" cy="20" r="14" 
                fill="none" 
                stroke="#162033" 
                strokeWidth="2.2" 
                strokeDasharray="66 24" 
                transform="rotate(135 20 20)"
            />
            <circle 
                cx="20" cy="20" r="14" 
                fill="none" 
                stroke={color} 
                strokeWidth="2.2" 
                strokeDasharray="38 56" 
                transform="rotate(135 20 20)" 
                opacity="0.88"
            />
            <circle cx="20" cy="20" r="10.5" fill="#0A101C" stroke="#334155" strokeWidth="1.3" />
            <circle cx="20" cy="20" r="8.2" fill="#151F32" />
            <g transform={`rotate(${angle} 20 20)`}>
                <line x1="20" y1="20" x2="20" y2="10" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
            </g>
        </svg>
    );
});

// Iconos vectoriales idénticos a los prototipos HTML oficiales (10x10 viewBox 0 0 24 24)
const HitoIcons = {
    intro: () => <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
    bassline: () => <svg viewBox="0 0 24 24"><polyline points="2 12 6 12 9 4 13 20 16 9 18 12 22 12"/></svg>,
    buildup: () => <svg viewBox="0 0 24 24"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>,
    drop: () => <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="1.5"/></svg>,
    breakdown: () => <svg viewBox="0 0 24 24"><path d="M2 9c2.5-2.5 5.5-2.5 8 0s5.5 2.5 8 0 4-2.5 4-2.5"/><path d="M2 15c2.5-2.5 5.5-2.5 8 0s5.5 2.5 8 0 4-2.5 4-2.5"/></svg>,
    break2: () => <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="10" y1="8" x2="10" y2="16"/><line x1="14" y1="8" x2="14" y2="16"/></svg>,
    drop2: () => <svg viewBox="0 0 24 24"><polygon points="13 2 4 14 12 14 11 22 20 10 12 10 13 2"/></svg>,
    outro: () => <svg viewBox="0 0 24 24"><path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/></svg>
};

const DEFAULT_HITOS_D1 = [
    { id: 1, key: 'intro', label: 'INTRO', time: '00:00', pos_sec: 0 },
    { id: 2, key: 'bassline', label: 'BASSLINE IN', time: '00:32', pos_sec: 32 },
    { id: 3, key: 'buildup', label: 'BUILD UP', time: '01:04', pos_sec: 64 },
    { id: 4, key: 'drop', label: 'MAIN DROP', time: '01:36', pos_sec: 96 },
    { id: 5, key: 'breakdown', label: 'BREAKDOWN', time: '02:15', pos_sec: 135 },
    { id: 6, key: 'break2', label: '2ND BREAK', time: '02:58', pos_sec: 178 },
    { id: 7, key: 'drop2', label: 'DROP 2', time: '03:30', pos_sec: 210 },
    { id: 8, key: 'outro', label: 'OUTRO', time: '04:12', pos_sec: 252 }
];

const DEFAULT_HITOS_D2 = [
    { id: 1, key: 'intro', label: 'INTRO', time: '00:00', pos_sec: 0 },
    { id: 2, key: 'bassline', label: 'BASSLINE IN', time: '00:16', pos_sec: 16 },
    { id: 3, key: 'buildup', label: 'BUILD UP', time: '00:48', pos_sec: 48 },
    { id: 4, key: 'drop', label: 'MAIN DROP', time: '01:04', pos_sec: 64 },
    { id: 5, key: 'breakdown', label: 'BREAKDOWN', time: '01:48', pos_sec: 108 },
    { id: 6, key: 'break2', label: '2ND BREAK', time: '02:30', pos_sec: 150 },
    { id: 7, key: 'drop2', label: 'DROP 2', time: '03:02', pos_sec: 182 },
    { id: 8, key: 'outro', label: 'OUTRO', time: '03:45', pos_sec: 225 }
];

/**
 * CopilotCenterMixer — Mesa Central Slim (448px) con Botones Slim de Hitos y Hardware Mixer
 * Replica milimétrica del diseño beatwave-pro-mesa-central-slim.html y beatwave-copilot-pro-v3.html
 */
export const CopilotCenterMixer = memo(({
    deck1 = null,
    deck2 = null,
    mixer = null,
    audit = null,
    isAppOpen = true,
    showInlineHud = true // HUD integrado en la mesa central slim
}) => {
    // Selección interactiva de hitos en cliente
    const [d1ActiveHito, setD1ActiveHito] = useState(0); // INTRO activo en DK 1
    const [d2ActiveHito, setD2ActiveHito] = useState(2); // BUILD UP activo en DK 2
    const [pflState, setPflState] = useState({ ch1: false, ch2: true });

    // Pulso rítmico de compases [1][2][3][4]
    const [currentBeat, setCurrentBeat] = useState(1);
    useEffect(() => {
        const bpm = Number(deck1?.bpm || deck2?.bpm || 136);
        const beatMs = Math.round((60 / bpm) * 1000);
        const interval = setInterval(() => {
            setCurrentBeat(b => (b % 4) + 1);
        }, beatMs);
        return () => clearInterval(interval);
    }, [deck1?.bpm, deck2?.bpm]);

    // Hitos sincronizados con la pista
    const hitosD1 = useMemo(() => {
        if (deck1?.cues && deck1.cues.length >= 4) {
            return deck1.cues.map((c, i) => ({
                id: c.id || (i + 1),
                key: DEFAULT_HITOS_D1[i]?.key || 'intro',
                label: c.name || DEFAULT_HITOS_D1[i]?.label || `CUE ${i + 1}`,
                time: c.time || DEFAULT_HITOS_D1[i]?.time || '00:00',
                pos_sec: c.pos_sec !== undefined ? c.pos_sec : (DEFAULT_HITOS_D1[i]?.pos_sec || 0)
            }));
        }
        return DEFAULT_HITOS_D1;
    }, [deck1?.cues]);

    const hitosD2 = useMemo(() => {
        if (deck2?.cues && deck2.cues.length >= 4) {
            return deck2.cues.map((c, i) => ({
                id: c.id || (i + 1),
                key: DEFAULT_HITOS_D2[i]?.key || 'intro',
                label: c.name || DEFAULT_HITOS_D2[i]?.label || `CUE ${i + 1}`,
                time: c.time || DEFAULT_HITOS_D2[i]?.time || '00:00',
                pos_sec: c.pos_sec !== undefined ? c.pos_sec : (DEFAULT_HITOS_D2[i]?.pos_sec || 0)
            }));
        }
        return DEFAULT_HITOS_D2;
    }, [deck2?.cues]);

    // Helper de formato mm:ss o 00:ss
    const formatSec = (sec) => {
        const s = Math.max(0, Math.round(sec));
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Tracking de posición de reproducción real (en segundos)
    const d1Duration = Number(deck1?.duration_sec) || 240;
    const d2Duration = Number(deck2?.duration_sec) || 240;

    const [d1PlayPos, setD1PlayPos] = useState(() => (typeof deck1?.play_progress === 'number' ? deck1.play_progress : 0.15) * d1Duration);
    const [d2PlayPos, setD2PlayPos] = useState(() => (typeof deck2?.play_progress === 'number' ? deck2.play_progress : 0.0) * d2Duration);

    useEffect(() => {
        if (typeof deck1?.play_progress === 'number') {
            setD1PlayPos(deck1.play_progress * d1Duration);
        }
    }, [deck1?.play_progress, d1Duration]);

    useEffect(() => {
        if (typeof deck2?.play_progress === 'number') {
            setD2PlayPos(deck2.play_progress * d2Duration);
        }
    }, [deck2?.play_progress, d2Duration]);

    // Timer en tiempo real para avance de reproducción
    useEffect(() => {
        if (!isAppOpen) return;
        const interval = setInterval(() => {
            if (deck1?.is_playing) {
                setD1PlayPos(p => (p + 1 > d1Duration ? 0 : p + 1));
            }
            if (deck2?.is_playing) {
                setD2PlayPos(p => (p + 1 > d2Duration ? 0 : p + 1));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isAppOpen, deck1?.is_playing, deck2?.is_playing, d1Duration, d2Duration]);

    // Cálculos rítmicos y de compás
    const d1Bpm = Number(deck1?.bpm) || 136;
    const d2Bpm = Number(deck2?.bpm) || 136;
    const d1BarSec = (60 / d1Bpm) * 4;
    const d2BarSec = (60 / d2Bpm) * 4;

    // Próximo hito y segundos reales en DECK 1
    const d1NextHito = useMemo(() => {
        const upcoming = hitosD1.find(h => h.pos_sec > d1PlayPos + 0.5);
        return upcoming || hitosD1[d1ActiveHito] || hitosD1[0];
    }, [hitosD1, d1PlayPos, d1ActiveHito]);

    const d1RemainingSec = Math.max(0, Math.round((d1NextHito?.pos_sec || 32) - d1PlayPos));
    const d1RemainingBars = Math.max(1, Math.ceil(d1RemainingSec / d1BarSec));
    const d1IsPlaying = Boolean(deck1?.is_playing);
    const d1IsAlert = d1IsPlaying && d1RemainingSec <= 5 && d1RemainingSec > 0;
    const d1ProgressPct = Math.min(100, Math.max(0, Math.round(((d1NextHito.pos_sec - d1RemainingSec) / (d1NextHito.pos_sec || 1)) * 100)));

    // Próximo hito y segundos reales en DECK 2
    const d2NextHito = useMemo(() => {
        const upcoming = hitosD2.find(h => h.pos_sec > d2PlayPos + 0.5);
        return upcoming || hitosD2[d2ActiveHito] || hitosD2[2] || hitosD2[0];
    }, [hitosD2, d2PlayPos, d2ActiveHito]);

    const d2IsPlaying = Boolean(deck2?.is_playing);
    const d2RemainingSec = d2IsPlaying 
        ? Math.max(0, Math.round((d2NextHito?.pos_sec || 48) - d2PlayPos))
        : (d1IsPlaying ? d1RemainingSec : 14);
    const d2RemainingBars = Math.max(1, Math.ceil(d2RemainingSec / d2BarSec));
    const d2IsAlert = (d2IsPlaying || (d1IsPlaying && !d2IsPlaying)) && d2RemainingSec <= 5 && d2RemainingSec > 0;
    const d2ProgressPct = Math.min(100, Math.max(0, Math.round(((d2NextHito.pos_sec - d2RemainingSec) / (d2NextHito.pos_sec || 1)) * 100)));

    const isCriticalAlert = d1IsAlert || d2IsAlert;

    // Extracción de valores de EQ y faders desde state.mixer
    const ch1Mix = mixer?.deck_1 || mixer?.ch1 || {};
    const ch2Mix = mixer?.deck_2 || mixer?.ch2 || {};

    const ch1Gain = ch1Mix.gain !== undefined ? ch1Mix.gain : 0.5;
    const ch2Gain = ch2Mix.gain !== undefined ? ch2Mix.gain : 0.52;

    const ch1Hi = ch1Mix.high ?? ch1Mix.eq_high ?? 0.5;
    const ch2Hi = ch2Mix.high ?? ch2Mix.eq_high ?? 0.45;

    const ch1Mid = ch1Mix.mid ?? ch1Mix.eq_mid ?? 0.53;
    const ch2Mid = ch2Mix.mid ?? ch2Mix.eq_mid ?? 0.40;

    const ch1Low = ch1Mix.low ?? ch1Mix.eq_low ?? 0.5;
    const ch2Low = ch2Mix.low ?? ch2Mix.eq_low ?? (isCriticalAlert ? 0.20 : 0.38);

    const ch1Fltr = ch1Mix.filter !== undefined ? ch1Mix.filter : 0.5;
    const ch2Fltr = ch2Mix.filter !== undefined ? ch2Mix.filter : 0.58;

    const ch1Fader = ch1Mix.volume ?? ch1Mix.fader ?? 0.88;
    const ch2Fader = ch2Mix.volume ?? ch2Mix.fader ?? 0.42;

    const crossfader = mixer?.crossfader !== undefined ? mixer.crossfader : 0.22;
    const auditScore = audit?.score_pct !== undefined ? audit.score_pct : 100;

    return (
        <div 
            className={`bw-center-mixer center-mixer ${isCriticalAlert ? 'is-alert-5s' : ''}`} 
            id="mixer-main"
            role="region"
            aria-label="Mesa de Mezclas Central Táctica"
        >
            {/* 1. BARRA SUPERIOR COMPACTA DE SINCRONIZACIÓN Y PULSO RÍTMICO */}
            <div className="mx-topbar bw-mx-topbar select-none">
                <div className="mx-sync bw-mx-sync">
                    <span className="sync-dot bw-sync-dot"></span>
                    <span>SYNC · {Math.round(deck1?.bpm || deck2?.bpm || 136)} BPM</span>
                </div>
                <div className="mx-beat-strip bw-mx-beat-strip">
                    {[1, 2, 3, 4].map(b => (
                        <span 
                            key={b}
                            className={`b-box bw-b-box ${currentBeat === b ? (b === 4 ? 'pulse' : 'on') : ''}`}
                        >
                            {b}
                        </span>
                    ))}
                </div>
                <div className="mx-alert-badge bw-mx-alert-badge">
                    {isCriticalAlert ? '⚠ <5S ALERTA' : '⚠ <5S'}
                </div>
            </div>

            {/* 2. HUDS TÁCTICOS REGRESIVOS DUALES: UNO PARA CADA DECK */}
            {showInlineHud && (
                <div className="bw-dual-huds">
                    {/* HUD DECK 1 */}
                    <div 
                        className={`cue-hud bw-cue-hud d1-hud select-none ${d1IsAlert ? 'is-impact' : ''}`}
                        role="status"
                        aria-live="assertive"
                    >
                        <div className="cue-hud-ico bw-cue-hud-ico">
                            {d1IsAlert ? (
                                <svg viewBox="0 0 24 24"><path d="M7 18v-6a5 5 0 1 1 10 0v6"/><path d="M5 21h14"/><path d="M12 2v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/></svg>
                            ) : (
                                <svg viewBox="0 0 24 24"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
                            )}
                        </div>
                        <div className="cue-hud-body bw-cue-hud-body">
                            <div className="cue-hud-kicker bw-cue-hud-kicker">
                                <span className="cue-hud-dot bw-cue-hud-dot" style={{ backgroundColor: '#00F0FF', boxShadow: '0 0 7px #00F0FF' }}></span>
                                <span className="text-[#00F0FF] font-black mr-1">DK 1</span>
                                <span>
                                    {d1IsAlert 
                                        ? (d1RemainingSec === 0 ? '¡IMPACTO AHORA! SOLTAR PISTA' : '¡ATENCIÓN! QUEDAN < 5 SEGUNDOS') 
                                        : (d1IsPlaying ? `EN PLAY · PROXIMO: ${d1NextHito?.label || 'HITO'}` : 'EN CUE (PREPARADO)')}
                                </span>
                            </div>
                            <div className="cue-hud-text bw-cue-hud-text truncate">
                                {d1IsAlert 
                                    ? `PRIMER GOLPE (${d1NextHito?.label || 'INTRO'})` 
                                    : (d1IsPlaying ? `Transición a ${d1NextHito?.label || 'Hito'} en ${d1RemainingBars} compases` : 'Listo para soltar en primer bombo')}
                            </div>
                            <div className="cue-hud-progress bw-cue-hud-progress">
                                <div 
                                    className="cue-hud-progress-fill bw-cue-hud-progress-fill" 
                                    style={{ width: `${d1ProgressPct}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="cue-hud-right bw-cue-hud-right">
                            <span className="cue-hud-timer bw-cue-hud-timer">
                                {formatSec(d1RemainingSec)}
                            </span>
                            <span className="cue-hud-bar-pill bw-cue-hud-bar-pill">
                                BAR {d1RemainingBars}
                            </span>
                        </div>
                    </div>

                    {/* HUD DECK 2 */}
                    <div 
                        className={`cue-hud bw-cue-hud d2-hud select-none ${d2IsAlert ? 'is-impact' : ''}`}
                        role="status"
                        aria-live="assertive"
                    >
                        <div className="cue-hud-ico bw-cue-hud-ico">
                            {d2IsAlert ? (
                                <svg viewBox="0 0 24 24"><path d="M7 18v-6a5 5 0 1 1 10 0v6"/><path d="M5 21h14"/><path d="M12 2v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/></svg>
                            ) : (
                                <svg viewBox="0 0 24 24"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
                            )}
                        </div>
                        <div className="cue-hud-body bw-cue-hud-body">
                            <div className="cue-hud-kicker bw-cue-hud-kicker">
                                <span className="cue-hud-dot bw-cue-hud-dot" style={{ backgroundColor: '#818CF8', boxShadow: '0 0 7px #818CF8' }}></span>
                                <span className="text-[#38BDF8] font-black mr-1">DK 2</span>
                                <span>
                                    {d2IsAlert 
                                        ? (d2RemainingSec === 0 ? '¡IMPACTO AHORA! SOLTAR PISTA' : '¡ATENCIÓN! QUEDAN < 5 SEGUNDOS') 
                                        : (d2IsPlaying ? `EN PLAY · PROXIMO: ${d2NextHito?.label || 'HITO'}` : 'EN CUE (PREPARADO)')}
                                </span>
                            </div>
                            <div className="cue-hud-text bw-cue-hud-text truncate">
                                {d2IsAlert 
                                    ? `PRIMER GOLPE (${d2NextHito?.label || 'INTRO'})` 
                                    : (d2IsPlaying ? `Transición a ${d2NextHito?.label || 'Hito'} en ${d2RemainingBars} compases` : 'Listo para soltar en primer bombo')}
                            </div>
                            <div className="cue-hud-progress bw-cue-hud-progress">
                                <div 
                                    className="cue-hud-progress-fill bw-cue-hud-progress-fill" 
                                    style={{ width: `${d2ProgressPct}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="cue-hud-right bw-cue-hud-right">
                            <span className="cue-hud-timer bw-cue-hud-timer">
                                {formatSec(d2RemainingSec)}
                            </span>
                            <span className="cue-hud-bar-pill bw-cue-hud-bar-pill">
                                BAR {d2RemainingBars}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. CUERPO DE 3 COLUMNAS ENCAJADO: DK 1 (1fr) | HARDWARE MIXER (108px) | DK 2 (1fr) */}
            <div className="mx-body bw-mx-body select-none">

                {/* COLUMNA 1: DECK 1 HITOS */}
                <div className="deck-pane d1-pane bw-deck-pane bw-d1-pane">
                    <div className="dp-head bw-dp-head">
                        <span className="dp-title bw-dp-title">DK 1</span>
                        <span className="dp-rem bw-dp-rem">{deck1?.duration || '-03:14'}</span>
                    </div>
                    <div className="hito-banner bw-hito-banner">
                        <div className="hb-bars bw-hb-bars">{d1RemainingBars} BARS · {formatSec(d1RemainingSec)}</div>
                        <div className="hb-name bw-hb-name">NEXT: {d1NextHito?.label || 'BASSLINE IN'}</div>
                        <div className="hb-bar bw-hb-bar"><div className="hb-fill bw-hb-fill" style={{ width: `${d1ProgressPct}%` }}></div></div>
                    </div>
                    <div className="cue-list bw-cue-list" id="main-d1-list">
                        {hitosD1.map((h, idx) => {
                            const IconComponent = HitoIcons[h.key] || HitoIcons.intro;
                            const isActive = d1ActiveHito === idx;
                            const isNext = !isActive && idx === 1; // BASSLINE IN es NEXT por defecto
                            return (
                                <button
                                    key={h.id || idx}
                                    type="button"
                                    onClick={() => setD1ActiveHito(idx)}
                                    className={`cue-btn bw-cue-btn ${isActive ? 'is-active' : isNext ? 'is-next' : ''}`}
                                    title={`Hito DK1: ${h.label} (${h.time})`}
                                >
                                    <span className="c-ico bw-c-ico"><IconComponent /></span>
                                    <span className="c-lbl bw-c-lbl">{h.label}</span>
                                    <span className="c-time bw-c-time">{h.time}</span>
                                    <span className="c-led bw-c-led"></span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* COLUMNA 2: MESA DE MEZCLAS HARDWARE DUAL COMPACTA (108px) */}
                <div className="hardware-mixer bw-hardware-mixer">
                    <div className="hm-col-headers bw-hm-col-headers">
                        <span className="ch-tag ch1 bw-ch-tag ch1">CH1</span>
                        <span className="ch-mid bw-ch-mid">EQ</span>
                        <span className="ch-tag ch2 bw-ch-tag ch2">CH2</span>
                    </div>

                    {/* Fila GAIN */}
                    <div className="knob-row bw-knob-row">
                        <div className="knob-cell bw-knob-cell">
                            <HardwareKnob value={ch1Gain} color="#00F0FF" label="CH1 Gain" />
                        </div>
                        <div className="knob-lbl bw-knob-lbl">GAIN</div>
                        <div className="knob-cell bw-knob-cell">
                            <HardwareKnob value={ch2Gain} color="#38BDF8" label="CH2 Gain" />
                        </div>
                    </div>

                    {/* Fila HI */}
                    <div className="knob-row bw-knob-row">
                        <div className="knob-cell bw-knob-cell">
                            <HardwareKnob value={ch1Hi} color="#00F0FF" label="CH1 Treb" />
                        </div>
                        <div className="knob-lbl bw-knob-lbl">TREB</div>
                        <div className="knob-cell bw-knob-cell">
                            <HardwareKnob value={ch2Hi} color="#38BDF8" label="CH2 Treb" />
                        </div>
                    </div>

                    {/* Fila MID */}
                    <div className="knob-row bw-knob-row">
                        <div className="knob-cell bw-knob-cell">
                            <HardwareKnob value={ch1Mid} color="#00F0FF" label="CH1 Mid" />
                        </div>
                        <div className="knob-lbl bw-knob-lbl">MID</div>
                        <div className="knob-cell bw-knob-cell">
                            <HardwareKnob value={ch2Mid} color="#38BDF8" label="CH2 Mid" />
                        </div>
                    </div>

                    {/* Fila LOW */}
                    <div className="knob-row bw-knob-row">
                        <div className="knob-cell bw-knob-cell">
                            <HardwareKnob value={ch1Low} color="#00F0FF" label="CH1 Bass" />
                        </div>
                        <div className="knob-lbl bw-knob-lbl">BASS</div>
                        <div className="knob-cell bw-knob-cell">
                            <HardwareKnob 
                                value={ch2Low} 
                                color={isCriticalAlert ? '#FF2A54' : '#38BDF8'} 
                                label="CH2 Bass" 
                            />
                        </div>
                    </div>

                    {/* Fila FILTER */}
                    <div className="knob-row bw-knob-row">
                        <div className="knob-cell bw-knob-cell">
                            <HardwareKnob value={ch1Fltr} color="#38BDF8" label="CH1 Filter" isFilter />
                        </div>
                        <div className="knob-lbl fltr bw-knob-lbl fltr">FLTR</div>
                        <div className="knob-cell bw-knob-cell">
                            <HardwareKnob value={ch2Fltr} color="#38BDF8" label="CH2 Filter" isFilter />
                        </div>
                    </div>

                    {/* Botones PFL CUE 1 / CUE 2 */}
                    <div className="pfl-row bw-pfl-row">
                        <button 
                            type="button" 
                            className={`pfl-btn bw-pfl-btn ${pflState.ch1 ? 'is-on' : ''}`}
                            onClick={() => setPflState(p => ({ ...p, ch1: !p.ch1 }))}
                        >
                            CUE 1
                        </button>
                        <button 
                            type="button" 
                            className={`pfl-btn bw-pfl-btn ${pflState.ch2 ? 'is-on' : ''}`}
                            onClick={() => setPflState(p => ({ ...p, ch2: !p.ch2 }))}
                        >
                            CUE 2
                        </button>
                    </div>

                    {/* Faders verticales de canal + Puente central de vúmetros */}
                    <div className="faders-deck bw-faders-deck">
                        <div className="fader-unit bw-fader-unit">
                            <div className="fader-slot bw-fader-slot">
                                <div 
                                    className="fader-cap bw-fader-cap" 
                                    style={{ top: `${Math.round((1 - ch1Fader) * 80)}%` }}
                                >
                                    <span className="cap-line bw-cap-line"></span>
                                </div>
                            </div>
                        </div>

                        {/* Vúmetros estéreo de 10 segmentos LED */}
                        <div className="vu-bridge bw-vu-bridge">
                            <div className="vu-col bw-vu-col">
                                <span className="vu-led bw-vu-led"></span>
                                <span className="vu-led bw-vu-led"></span>
                                <span className="vu-led on-amber bw-vu-led on-amber"></span>
                                <span className="vu-led on-amber bw-vu-led on-amber"></span>
                                <span className="vu-led on-cyan bw-vu-led on-cyan"></span>
                                <span className="vu-led on-cyan bw-vu-led on-cyan"></span>
                                <span className="vu-led on-cyan bw-vu-led on-cyan"></span>
                                <span className="vu-led on-cyan bw-vu-led on-cyan"></span>
                                <span className="vu-led on-cyan bw-vu-led on-cyan"></span>
                                <span className="vu-led on-cyan bw-vu-led on-cyan"></span>
                            </div>
                            <div className="vu-col bw-vu-col">
                                <span className={`vu-led bw-vu-led ${isCriticalAlert ? 'on-red' : ''}`}></span>
                                <span className="vu-led bw-vu-led"></span>
                                <span className="vu-led on-amber bw-vu-led on-amber"></span>
                                <span className="vu-led bw-vu-led"></span>
                                <span className="vu-led on-cyan bw-vu-led on-cyan"></span>
                                <span className="vu-led on-cyan bw-vu-led on-cyan"></span>
                                <span className="vu-led on-cyan bw-vu-led on-cyan"></span>
                                <span className="vu-led on-cyan bw-vu-led on-cyan"></span>
                                <span className="vu-led on-cyan bw-vu-led on-cyan"></span>
                                <span className="vu-led on-cyan bw-vu-led on-cyan"></span>
                            </div>
                        </div>

                        <div className="fader-unit bw-fader-unit">
                            <div className="fader-slot bw-fader-slot">
                                <div 
                                    className="fader-cap ch2-cap bw-fader-cap bw-ch2-cap" 
                                    style={{ top: `${Math.round((1 - ch2Fader) * 80)}%` }}
                                >
                                    <span className="cap-line bw-cap-line"></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Crossfader horizontal */}
                    <div className="xfader-box bw-xfader-box">
                        <div className="xf-slot bw-xf-slot">
                            <div 
                                className="xf-thumb bw-xf-thumb" 
                                style={{ left: `calc(${Math.round(crossfader * 100)}% - 5px)` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* COLUMNA 3: DECK 2 HITOS */}
                <div className="deck-pane d2-pane bw-deck-pane bw-d2-pane">
                    <div className="dp-head bw-dp-head">
                        <span className="dp-title bw-dp-title">DK 2</span>
                        <span className="dp-rem bw-dp-rem">{deck2?.duration || '-02:41'}</span>
                    </div>
                    <div className={`hito-banner bw-hito-banner ${d2IsAlert ? 'alert-mode' : ''}`}>
                        <div className="hb-bars bw-hb-bars">
                            {d2IsAlert ? `2 BARS · ${formatSec(d2RemainingSec)}` : `${d2RemainingBars} BARS · ${formatSec(d2RemainingSec)}`}
                        </div>
                        <div className="hb-name bw-hb-name">
                            {d2IsAlert ? `INMINENTE: ${d2NextHito?.label || 'MAIN DROP'}` : `NEXT: ${d2NextHito?.label || 'MAIN DROP'}`}
                        </div>
                        <div className="hb-bar bw-hb-bar">
                            <div 
                                className="hb-fill bw-hb-fill" 
                                style={{ width: `${d2ProgressPct}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="cue-list bw-cue-list" id="main-d2-list">
                        {hitosD2.map((h, idx) => {
                            const IconComponent = HitoIcons[h.key] || HitoIcons.intro;
                            const isActive = d2ActiveHito === idx;
                            const isAlert = isCriticalAlert && idx === 3; // MAIN DROP en alerta roja <5s
                            const isNext = !isActive && !isAlert && idx === 3; // MAIN DROP es NEXT antes de activarse
                            return (
                                <button
                                    key={h.id || idx}
                                    type="button"
                                    onClick={() => setD2ActiveHito(idx)}
                                    className={`cue-btn bw-cue-btn ${
                                        isAlert ? 'is-alert' : isActive ? 'is-active' : isNext ? 'is-next' : ''
                                    }`}
                                    title={`Hito DK2: ${h.label} (${h.time})`}
                                >
                                    <span className="c-ico bw-c-ico"><IconComponent /></span>
                                    <span className="c-lbl bw-c-lbl">{h.label}</span>
                                    <span className="c-time bw-c-time">{h.time}</span>
                                    <span className="c-led bw-c-led"></span>
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* 4. FOOTER DE MESA CENTRAL */}
            <div className="mx-footer bw-mx-footer select-none">
                <span>LOW SWAP: ARMED</span>
                <span>·</span>
                <span className="mx-status-label bw-mx-status-label">
                    {isCriticalAlert ? 'ALERTA < 5S' : `AUDIT: ${auditScore}%`}
                </span>
            </div>
        </div>
    );
});
