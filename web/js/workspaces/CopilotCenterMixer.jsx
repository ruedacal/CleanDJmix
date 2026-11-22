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
    const v = Math.max(0, Math.min(1, Number(value) || 0.5));
    // Rotación: de -135° a +135° (270° de recorrido total)
    const angle = Math.round((v - 0.5) * 270);

    return (
        <svg 
            className="bw-dj-knob-svg select-none" 
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

// Iconos vectoriales de los 8 hitos
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
 * CopilotCenterMixer — Mesa Central Slim (448px) con HUD Regresivo
 * Integra HUD dinámico con alerta roja <5s, Hitos interactivos y mixer hardware 2-CH.
 */
export const CopilotCenterMixer = memo(({
    deck1 = null,
    deck2 = null,
    mixer = null,
    audit = null,
    isAppOpen = true
}) => {
    // Selección visual de hitos en cliente (interacción táctica sin seek API)
    const [d1ActiveHito, setD1ActiveHito] = useState(0);
    const [d2ActiveHito, setD2ActiveHito] = useState(2); // BUILD UP activo por defecto en D2
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

    // Hitos combinados con datos de pista si existen
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

    // Cálculo dinámico de cuenta atrás hacia el próximo hito en la pista entrante (DK 2)
    const targetDeck = deck2?.is_playing ? deck1 : deck2;
    const targetHitos = deck2?.is_playing ? hitosD1 : hitosD2;
    const nextHitoIdx = deck2?.is_playing ? (d1ActiveHito + 1) % targetHitos.length : 3; // MAIN DROP por defecto
    const nextHito = targetHitos[nextHitoIdx] || targetHitos[0];

    const [countdownSeconds, setCountdownSeconds] = useState(14);
    const [totalSeconds] = useState(14);

    // Motor de cuenta atrás reactivo
    useEffect(() => {
        let timer = null;
        if (isAppOpen) {
            timer = setInterval(() => {
                setCountdownSeconds(s => {
                    if (s <= 1) return totalSeconds; // bucle de demostración continuo en vivo
                    return s - 1;
                });
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isAppOpen, totalSeconds]);

    const isCriticalAlert = countdownSeconds <= 5;
    const progressPct = Math.min(100, Math.max(0, Math.round(((totalSeconds - countdownSeconds) / totalSeconds) * 100)));

    // Extracción de valores de potenciómetros desde state.mixer
    const ch1Mix = mixer?.ch1 || {};
    const ch2Mix = mixer?.ch2 || {};

    const ch1Gain = ch1Mix.gain !== undefined ? ch1Mix.gain : 0.5;
    const ch2Gain = ch2Mix.gain !== undefined ? ch2Mix.gain : 0.52;

    const ch1Hi = ch1Mix.eq_high !== undefined ? ch1Mix.eq_high : 0.5;
    const ch2Hi = ch2Mix.eq_high !== undefined ? ch2Mix.eq_high : 0.45;

    const ch1Mid = ch1Mix.eq_mid !== undefined ? ch1Mix.eq_mid : 0.53;
    const ch2Mid = ch2Mix.eq_mid !== undefined ? ch2Mix.eq_mid : 0.40;

    const ch1Low = ch1Mix.eq_low !== undefined ? ch1Mix.eq_low : 0.5;
    const ch2Low = ch2Mix.eq_low !== undefined ? ch2Mix.eq_low : (isCriticalAlert ? 0.20 : 0.38);

    const ch1Fltr = ch1Mix.filter !== undefined ? ch1Mix.filter : 0.5;
    const ch2Fltr = ch2Mix.filter !== undefined ? ch2Mix.filter : 0.58;

    const ch1Fader = ch1Mix.fader !== undefined ? ch1Mix.fader : 0.88;
    const ch2Fader = ch2Mix.fader !== undefined ? ch2Mix.fader : 0.42;

    const crossfader = mixer?.crossfader !== undefined ? mixer.crossfader : 0.22;
    const auditScore = audit?.score_pct !== undefined ? audit.score_pct : 100;

    return (
        <div 
            className={`bw-center-mixer ${isCriticalAlert ? 'is-alert-5s' : ''}`} 
            id="mixer-main"
            role="region"
            aria-label="Mesa de Mezclas Central Táctica"
        >
            {/* 1. BARRA SUPERIOR COMPACTA DE SINCRONIZACIÓN Y PULSO RÍTMICO */}
            <div className="bw-mx-topbar select-none">
                <div className="bw-mx-sync">
                    <span className="bw-sync-dot"></span>
                    <span>SYNC · {Math.round(deck1?.bpm || deck2?.bpm || 136)} BPM</span>
                </div>
                <div className="bw-mx-beat-strip">
                    {[1, 2, 3, 4].map(b => (
                        <span 
                            key={b}
                            className={`bw-b-box ${currentBeat === b ? (b === 4 ? 'pulse' : 'on') : ''}`}
                        >
                            {b}
                        </span>
                    ))}
                </div>
                <div className="bw-mx-alert-badge">
                    {isCriticalAlert ? '⚠ <5S ALERTA' : '⚠ <5S'}
                </div>
            </div>

            {/* 2. HUD TÁCTICO CENTRAL CON CONTADOR REGRESIVO Y TRANSICIÓN ROJA <5S */}
            <div 
                className={`bw-cue-hud select-none ${isCriticalAlert ? 'is-impact' : ''}`}
                role="status"
                aria-live="assertive"
            >
                <div className="bw-cue-hud-ico">
                    {isCriticalAlert ? (
                        <svg viewBox="0 0 24 24">
                            <path d="M7 18v-6a5 5 0 1 1 10 0v6"/>
                            <path d="M5 21h14"/>
                            <path d="M12 2v2"/>
                            <path d="M4.93 4.93l1.41 1.41"/>
                            <path d="M19.07 4.93l-1.41 1.41"/>
                            <path d="M2 12h2"/>
                            <path d="M20 12h2"/>
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24">
                            <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
                            <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
                        </svg>
                    )}
                </div>
                <div className="bw-cue-hud-body">
                    <div className="bw-cue-hud-kicker">
                        <span className="bw-cue-hud-dot"></span>
                        <span>
                            {isCriticalAlert 
                                ? (countdownSeconds === 0 ? '¡IMPACTO AHORA! SOLTAR PISTA' : '¡ATENCIÓN! QUEDAN < 5 SEGUNDOS') 
                                : 'EN CUE (PREPARADO)'}
                        </span>
                    </div>
                    <div className="bw-cue-hud-text truncate">
                        {isCriticalAlert ? `PRIMER GOLPE (${nextHito?.label || 'INTRO'})` : 'Listo para soltar en primer bombo'}
                    </div>
                    <div className="bw-cue-hud-progress">
                        <div 
                            className="bw-cue-hud-progress-fill" 
                            style={{ width: `${progressPct}%` }}
                        ></div>
                    </div>
                </div>
                <div className="bw-cue-hud-right">
                    <span className="bw-cue-hud-timer">
                        00:{String(Math.max(0, countdownSeconds)).padStart(2, '0')}
                    </span>
                    <span className="bw-cue-hud-bar-pill">
                        BAR {Math.max(1, Math.ceil(countdownSeconds / 2))}
                    </span>
                </div>
            </div>

            {/* 3. CUERPO DE 3 COLUMNAS: DECK 1 HITOS | HARDWARE MIXER | DECK 2 HITOS */}
            <div className="bw-mx-body select-none">

                {/* COLUMNA 1: DECK 1 HITOS */}
                <div className="bw-deck-pane bw-d1-pane">
                    <div className="bw-dp-head">
                        <span className="bw-dp-title">DK 1</span>
                        <span className="bw-dp-rem">{deck1?.duration || '-03:14'}</span>
                    </div>
                    <div className="bw-hito-banner">
                        <div className="bw-hb-bars">16 BARS · 00:29</div>
                        <div className="bw-hb-name">NEXT: BASSLINE IN</div>
                        <div className="bw-hb-bar"><div className="bw-hb-fill" style={{ width: '36%' }}></div></div>
                    </div>
                    <div className="bw-cue-list">
                        {hitosD1.map((h, idx) => {
                            const IconComponent = HitoIcons[h.key] || HitoIcons.intro;
                            const isActive = d1ActiveHito === idx;
                            const isNext = !isActive && idx === (d1ActiveHito + 1);
                            return (
                                <button
                                    key={h.id || idx}
                                    type="button"
                                    onClick={() => setD1ActiveHito(idx)}
                                    className={`bw-cue-btn ${isActive ? 'is-active' : isNext ? 'is-next' : ''}`}
                                    title={`Hito DK1: ${h.label} (${h.time})`}
                                >
                                    <span className="bw-c-ico"><IconComponent /></span>
                                    <span className="bw-c-lbl">{h.label}</span>
                                    <span className="bw-c-time">{h.time}</span>
                                    <span className="bw-c-led"></span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* COLUMNA 2: MESA DE MEZCLAS HARDWARE DUAL COMPACTA */}
                <div className="bw-hardware-mixer">
                    <div className="bw-hm-col-headers">
                        <span className="bw-ch-tag ch1">CH1</span>
                        <span className="bw-ch-mid">EQ</span>
                        <span className="bw-ch-tag ch2">CH2</span>
                    </div>

                    {/* Fila GAIN */}
                    <div className="bw-knob-row">
                        <div className="bw-knob-cell">
                            <HardwareKnob value={ch1Gain} color="#00F0FF" label="CH1 Gain" />
                        </div>
                        <div className="bw-knob-lbl">GAIN</div>
                        <div className="bw-knob-cell">
                            <HardwareKnob value={ch2Gain} color="#38BDF8" label="CH2 Gain" />
                        </div>
                    </div>

                    {/* Fila HI */}
                    <div className="bw-knob-row">
                        <div className="bw-knob-cell">
                            <HardwareKnob value={ch1Hi} color="#00F0FF" label="CH1 High" />
                        </div>
                        <div className="bw-knob-lbl">HI</div>
                        <div className="bw-knob-cell">
                            <HardwareKnob value={ch2Hi} color="#38BDF8" label="CH2 High" />
                        </div>
                    </div>

                    {/* Fila MID */}
                    <div className="bw-knob-row">
                        <div className="bw-knob-cell">
                            <HardwareKnob value={ch1Mid} color="#00F0FF" label="CH1 Mid" />
                        </div>
                        <div className="bw-knob-lbl">MID</div>
                        <div className="bw-knob-cell">
                            <HardwareKnob value={ch2Mid} color="#38BDF8" label="CH2 Mid" />
                        </div>
                    </div>

                    {/* Fila LOW */}
                    <div className="bw-knob-row">
                        <div className="bw-knob-cell">
                            <HardwareKnob value={ch1Low} color="#00F0FF" label="CH1 Low" />
                        </div>
                        <div className="bw-knob-lbl">LOW</div>
                        <div className="bw-knob-cell">
                            <HardwareKnob 
                                value={ch2Low} 
                                color={isCriticalAlert ? '#FF2A54' : '#38BDF8'} 
                                label="CH2 Low" 
                            />
                        </div>
                    </div>

                    {/* Fila FILTER */}
                    <div className="bw-knob-row">
                        <div className="bw-knob-cell">
                            <HardwareKnob value={ch1Fltr} color="#38BDF8" label="CH1 Filter" isFilter />
                        </div>
                        <div className="bw-knob-lbl fltr">FLTR</div>
                        <div className="bw-knob-cell">
                            <HardwareKnob value={ch2Fltr} color="#38BDF8" label="CH2 Filter" isFilter />
                        </div>
                    </div>

                    {/* Botones PFL CUE 1 / CUE 2 */}
                    <div className="bw-pfl-row">
                        <button 
                            type="button" 
                            className={`bw-pfl-btn ${pflState.ch1 ? 'is-on' : ''}`}
                            onClick={() => setPflState(p => ({ ...p, ch1: !p.ch1 }))}
                        >
                            CUE 1
                        </button>
                        <button 
                            type="button" 
                            className={`bw-pfl-btn ${pflState.ch2 ? 'is-on' : ''}`}
                            onClick={() => setPflState(p => ({ ...p, ch2: !p.ch2 }))}
                        >
                            CUE 2
                        </button>
                    </div>

                    {/* Faders verticales de canal + Puente central de vúmetros */}
                    <div className="bw-faders-deck">
                        <div className="bw-fader-unit">
                            <div className="bw-fader-slot">
                                <div 
                                    className="bw-fader-cap" 
                                    style={{ top: `${Math.round((1 - ch1Fader) * 80)}%` }}
                                >
                                    <span className="bw-cap-line"></span>
                                </div>
                            </div>
                        </div>

                        {/* Vúmetros estéreo de 10 segmentos LED */}
                        <div className="bw-vu-bridge">
                            <div className="bw-vu-col">
                                <span className="bw-vu-led"></span>
                                <span className="bw-vu-led"></span>
                                <span className="bw-vu-led on-amber"></span>
                                <span className="bw-vu-led on-amber"></span>
                                <span className="bw-vu-led on-cyan"></span>
                                <span className="bw-vu-led on-cyan"></span>
                                <span className="bw-vu-led on-cyan"></span>
                                <span className="bw-vu-led on-cyan"></span>
                                <span className="bw-vu-led on-cyan"></span>
                                <span className="bw-vu-led on-cyan"></span>
                            </div>
                            <div className="bw-vu-col">
                                <span className={`bw-vu-led ${isCriticalAlert ? 'on-red' : ''}`}></span>
                                <span className="bw-vu-led"></span>
                                <span className="bw-vu-led on-amber"></span>
                                <span className="bw-vu-led"></span>
                                <span className="bw-vu-led on-cyan"></span>
                                <span className="bw-vu-led on-cyan"></span>
                                <span className="bw-vu-led on-cyan"></span>
                                <span className="bw-vu-led on-cyan"></span>
                                <span className="bw-vu-led on-cyan"></span>
                                <span className="bw-vu-led on-cyan"></span>
                            </div>
                        </div>

                        <div className="bw-fader-unit">
                            <div className="bw-fader-slot">
                                <div 
                                    className="bw-fader-cap bw-ch2-cap" 
                                    style={{ top: `${Math.round((1 - ch2Fader) * 80)}%` }}
                                >
                                    <span className="bw-cap-line"></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Crossfader horizontal */}
                    <div className="bw-xfader-box">
                        <div className="bw-xf-slot">
                            <div 
                                className="bw-xf-thumb" 
                                style={{ left: `calc(${Math.round(crossfader * 100)}% - 5px)` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* COLUMNA 3: DECK 2 HITOS */}
                <div className="bw-deck-pane bw-d2-pane">
                    <div className="bw-dp-head">
                        <span className="bw-dp-title">DK 2</span>
                        <span className="bw-dp-rem">{deck2?.duration || '-02:41'}</span>
                    </div>
                    <div className={`bw-hito-banner ${isCriticalAlert ? 'alert-mode' : ''}`}>
                        <div className="bw-hb-bars">
                            {isCriticalAlert ? `2 BARS · 00:${String(countdownSeconds).padStart(2, '0')}` : '8 BARS · 00:14'}
                        </div>
                        <div className="bw-hb-name">
                            {isCriticalAlert ? 'INMINENTE: MAIN DROP' : 'NEXT: MAIN DROP'}
                        </div>
                        <div className="bw-hb-bar">
                            <div 
                                className="bw-hb-fill" 
                                style={{ width: `${isCriticalAlert ? 92 : 54}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="bw-cue-list">
                        {hitosD2.map((h, idx) => {
                            const IconComponent = HitoIcons[h.key] || HitoIcons.intro;
                            const isActive = d2ActiveHito === idx;
                            const isAlert = isCriticalAlert && idx === 3; // MAIN DROP en alerta roja
                            const isNext = !isActive && !isAlert && idx === 3;
                            return (
                                <button
                                    key={h.id || idx}
                                    type="button"
                                    onClick={() => setD2ActiveHito(idx)}
                                    className={`bw-cue-btn ${
                                        isAlert ? 'is-alert' : isActive ? 'is-active' : isNext ? 'is-next' : ''
                                    }`}
                                    title={`Hito DK2: ${h.label} (${h.time})`}
                                >
                                    <span className="bw-c-ico"><IconComponent /></span>
                                    <span className="bw-c-lbl">{h.label}</span>
                                    <span className="bw-c-time">{h.time}</span>
                                    <span className="bw-c-led"></span>
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* 4. FOOTER DE MESA CENTRAL */}
            <div className="bw-mx-footer select-none">
                <span>LOW SWAP: ARMED</span>
                <span>·</span>
                <span className="bw-mx-status-label">
                    {isCriticalAlert ? 'ALERTA < 5S' : `AUDIT: ${auditScore}%`}
                </span>
            </div>
        </div>
    );
});
