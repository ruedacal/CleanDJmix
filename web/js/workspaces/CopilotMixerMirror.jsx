const { memo } = React;

const KnobSVG = memo(({
    label,
    value = 0.5,
    bipolar = true,
    alertTarget = false,
    resolved = false,
    touched = false,
}) => {
    const v = Math.max(0, Math.min(1, Number(value) || 0));
    const startDeg = -135;
    const sweepDeg = 270;
    const angleDeg = startDeg + v * sweepDeg;
    const rad = (angleDeg - 90) * (Math.PI / 180);

    const cx = 18;
    const cy = 18;
    const r = 13;
    const px = cx + Math.cos(rad) * (r - 2);
    const py = cy + Math.sin(rad) * (r - 2);

    const polarToXY = (deg) => {
        const a = (deg - 90) * (Math.PI / 180);
        return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    };

    const describeArc = (a0, a1) => {
        const [x0, y0] = polarToXY(a0);
        const [x1, y1] = polarToXY(a1);
        const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
        const sweep = a1 >= a0 ? 1 : 0;
        return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
    };

    const activeArc = bipolar
        ? (Math.abs(v - 0.5) > 0.015 ? describeArc(0, angleDeg) : '')
        : (v > 0.015 ? describeArc(startDeg, angleDeg) : '');

    const strokeColor = resolved
        ? '#10b981'
        : alertTarget
        ? '#ef4444'
        : touched
        ? '#ffffff'
        : '#22d3ee';

    const pctLabel = bipolar
        ? `${v >= 0.5 ? '+' : ''}${Math.round((v - 0.5) * 200)}%`
        : `${Math.round(v * 100)}%`;

    return (
        <div
            className="flex flex-col items-center select-none"
            style={{ width: 42 }}
            title={`${label}: ${pctLabel}`}
        >
            <svg width="36" height="36" viewBox="0 0 36 36" style={{ overflow: 'visible' }}>
                {/* Track base */}
                <path
                    d={describeArc(startDeg, startDeg + sweepDeg)}
                    fill="none"
                    stroke="#27272a"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                {/* Zona objetivo pulsante cuando hay directiva de recorte activa */}
                {alertTarget && !resolved && (
                    <path
                        d={describeArc(startDeg, startDeg + 0.30 * sweepDeg)}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="4"
                        strokeLinecap="round"
                        opacity="0.85"
                    />
                )}
                {/* Arco de valor físico real */}
                {activeArc && (
                    <path
                        d={activeArc}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                )}
                {/* Cuerpo del potenciómetro */}
                <circle
                    cx={cx}
                    cy={cy}
                    r="8.5"
                    fill="#111116"
                    stroke={alertTarget ? '#ef4444' : touched ? '#22d3ee' : '#3f3f46'}
                    strokeWidth="1.2"
                />
                {/* Indicador de aguja */}
                <line
                    x1={cx}
                    y1={cy}
                    x2={px}
                    y2={py}
                    stroke={strokeColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
            <span
                className="font-mono font-bold tracking-wider"
                style={{
                    fontSize: 8.5,
                    marginTop: -2,
                    color: resolved ? '#6ee7b7' : alertTarget ? '#fca5a5' : '#a1a1aa',
                }}
            >
                {label}{alertTarget && !resolved ? ' ↙' : resolved ? ' ✓' : ''}
            </span>
        </div>
    );
});

const ChannelStrip = memo(({ deckNum, ch, touched = {}, directive = null }) => {
    const isTargetLow = Boolean(
        directive && directive.deck === deckNum && directive.control === 'low' && directive.status !== 'RESOLVED'
    );
    const isResolvedLow = Boolean(
        directive && directive.deck === deckNum && directive.control === 'low' && directive.status === 'RESOLVED'
    );
    const volPct = Math.round(Math.max(0, Math.min(1, Number(ch?.volume ?? 1))) * 100);
    const pfx = `deck_${deckNum}`;

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            <span
                className="font-mono font-bold px-1.5 py-0.5 rounded"
                style={{
                    fontSize: 9,
                    backgroundColor: 'rgba(34,211,238,0.10)',
                    border: '1px solid rgba(34,211,238,0.32)',
                    color: '#22d3ee',
                }}
            >
                D{deckNum}
            </span>
            <KnobSVG label="GAIN" value={ch?.gain ?? 0.5} bipolar={true} />
            <KnobSVG label="HIGH" value={ch?.high ?? 0.5} bipolar={true} touched={Boolean(touched[`${pfx}.high`])} />
            <KnobSVG label="MID" value={ch?.mid ?? 0.5} bipolar={true} touched={Boolean(touched[`${pfx}.mid`])} />
            <KnobSVG
                label="LOW"
                value={ch?.low ?? 0.5}
                bipolar={true}
                alertTarget={isTargetLow}
                resolved={isResolvedLow}
            />
            <KnobSVG label="FLTR" value={ch?.filter ?? 0.5} bipolar={true} touched={Boolean(touched[`${pfx}.filter`])} />

            {/* Barra de Fader de Volumen */}
            <div className="flex flex-col items-center ml-1" style={{ width: 26 }} title={`Volumen D${deckNum}: ${volPct}%`}>
                <div
                    style={{
                        width: 8,
                        height: 30,
                        borderRadius: 4,
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: `${volPct}%`,
                            backgroundColor: volPct > 12 ? '#22d3ee' : '#52525b',
                            transition: 'height 40ms linear',
                        }}
                    />
                </div>
                <span className="font-mono font-bold text-zinc-400" style={{ fontSize: 8, marginTop: 2 }}>
                    VOL
                </span>
            </div>
        </div>
    );
});

export const CopilotMixerMirror = memo(({ mixer = null, audit = null }) => {
    const d1 = mixer?.deck_1 || { gain: 0.5, high: 0.5, mid: 0.5, low: 0.5, filter: 0.5, volume: 1.0 };
    const d2 = mixer?.deck_2 || { gain: 0.5, high: 0.5, mid: 0.5, low: 0.5, filter: 0.5, volume: 1.0 };
    const touched = mixer?.touched || {};
    const xf = Math.max(0, Math.min(1, Number(mixer?.crossfader ?? 0.5)));
    const directive = audit?.active_directive || null;
    const scorePct = audit?.score_pct ?? 100;
    const resolved = audit?.resolved ?? 0;
    const total = audit?.total ?? 0;

    return (
        <section
            className="w-full rounded-2xl border border-zinc-800/90 px-3 py-2 mb-3.5 flex items-center justify-between gap-3 flex-wrap"
            style={{ backgroundColor: '#07070c' }}
        >
            {/* Canal Deck 1 */}
            <ChannelStrip deckNum={1} ch={d1} touched={touched} directive={directive} />

            {/* Centro: Crossfader + Estado de Auditoría en Vivo */}
            <div className="flex flex-col items-center gap-1.5 min-w-[175px]">
                <div className="flex items-center gap-2 font-mono" style={{ fontSize: 9.5 }}>
                    <span
                        className="px-1.5 py-0.5 rounded font-bold"
                        style={{
                            backgroundColor: mixer?.active ? 'rgba(16,185,129,0.14)' : '#18181b',
                            border: mixer?.active ? '1px solid rgba(16,185,129,0.4)' : '1px solid #3f3f46',
                            color: mixer?.active ? '#6ee7b7' : '#a1a1aa',
                        }}
                    >
                        {mixer?.active ? 'MIXER 14-BIT LIVE' : 'MIXER STANDBY'}
                    </span>
                    <span className="text-zinc-300 font-bold">
                        AUDIT: <span style={{ color: scorePct >= 80 ? '#22d3ee' : '#f59e0b' }}>{scorePct}%</span>
                        {total > 0 ? ` (${resolved}/${total})` : ''}
                    </span>
                </div>

                {/* Crossfader horizontal */}
                <div className="flex items-center gap-1.5 w-full max-w-[160px]">
                    <span className="font-mono text-zinc-500" style={{ fontSize: 8.5 }}>A</span>
                    <div
                        style={{
                            position: 'relative',
                            flex: 1,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#18181b',
                            border: '1px solid #27272a',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: -3,
                                left: `calc(${(xf * 100).toFixed(1)}% - 5px)`,
                                width: 10,
                                height: 10,
                                borderRadius: 2,
                                backgroundColor: '#ffffff',
                                border: '1px solid #22d3ee',
                            }}
                        />
                    </div>
                    <span className="font-mono text-zinc-500" style={{ fontSize: 8.5 }}>B</span>
                </div>

                {directive && (
                    <div
                        className="font-mono font-bold px-2 py-0.5 rounded text-center"
                        style={{
                            fontSize: 9,
                            backgroundColor: directive.status === 'RESOLVED' ? 'rgba(16,185,129,0.16)' : 'rgba(239,68,68,0.16)',
                            border: directive.status === 'RESOLVED' ? '1px solid rgba(16,185,129,0.45)' : '1px solid rgba(239,68,68,0.45)',
                            color: directive.status === 'RESOLVED' ? '#6ee7b7' : '#fca5a5',
                        }}
                    >
                        {directive.status === 'RESOLVED'
                            ? `✓ EJECUTADO EN ${directive.reaction_ms}ms`
                            : directive.label}
                    </div>
                )}
            </div>

            {/* Canal Deck 2 */}
            <ChannelStrip deckNum={2} ch={d2} touched={touched} directive={directive} />
        </section>
    );
});
