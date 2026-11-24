const { memo } = React;

/**
 * CopilotCleanMixBanner — Banner Táctico Compacto de Cabina (2 Filas)
 * Optimizado para máxima densidad de información, cero espacio vertical muerto
 * y legibilidad íntegra de mensajes tácticos tanto en vista embebida como POP-OUT.
 */
export const CopilotCleanMixBanner = memo(({
    antiMuddy = null,
    harmonic = null,
    controllerState = null,
    lufsDelta = null,
    lowEqApplied = false,
    onApplyCorrection = null,
    isAppOpen = true,
    latency = 2
}) => {
    const isDanger = isAppOpen && antiMuddy && antiMuddy.status === 'danger';
    const isWarning = isAppOpen && antiMuddy && antiMuddy.status === 'warning';

    const controllerName = (controllerState?.name || 'NUMARK NV II').replace(/\s*\(USB\)\s*/i, '').trim();

    const camelotLabel = harmonic?.badge || (
        harmonic?.type === 'HARMONIC_CLASH' || harmonic?.is_clash
            ? 'CHOQUE'
            : harmonic?.type === 'STANDBY'
            ? 'STANDBY'
            : harmonic?.type === 'PERFECT_MATCH'
            ? 'MATCH'
            : harmonic?.score != null
            ? `${harmonic.score}% OK`
            : 'OK'
    );

    const actionText = lowEqApplied
        ? '✓ EQ RESTABLECIDO'
        : (antiMuddy?.action || (isDanger ? 'CORTAR LOW CH2 (-12 dB)' : 'Frec. equilibradas'))
            .replace(/Frecuencias equilibradas/i, 'Frec. equilibradas');

    return (
        <section
            className={`bw-msg-banner !flex !flex-col !items-stretch !gap-1.5 !py-2 !px-3 ${isDanger ? 'is-danger' : ''} ${!isAppOpen ? 'opacity-50' : ''}`}
            aria-live="polite"
        >
            {/* FILA 1: Estado de Fase + Título + Badge + Telemetría compacta */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                    {/* Visualizador de fase compacto */}
                    <div className="bw-msg-visual !py-0.5 !px-2 !gap-2 shrink-0">
                        <div className="bw-phase-bars">
                            <span className="bw-p-bar"></span>
                            <span className="bw-p-bar"></span>
                            <span className="bw-p-bar"></span>
                            <span className="bw-p-bar"></span>
                            <span className="bw-p-bar"></span>
                        </div>
                        <div className="font-mono text-[11px] leading-none flex items-center gap-1.5 select-none">
                            <span className="text-zinc-400 font-bold">SUB-BASS</span>
                            <span className={`font-black ${isDanger ? 'text-[#ff6b88]' : 'text-emerald-400'}`}>
                                {!isAppOpen ? 'STANDBY' : isDanger ? 'COLISIÓN 142°' : 'FASE 0° OK'}
                            </span>
                        </div>
                    </div>

                    <span className="font-syne font-black text-[13px] tracking-wider text-white leading-none">
                        {!isAppOpen
                            ? 'CABINA EN STANDBY'
                            : isDanger
                            ? (antiMuddy?.title || 'ALERTA DE GRAVES')
                            : isWarning
                            ? (antiMuddy?.title || 'AVISO DE FRECUENCIAS')
                            : 'MEZCLA LIMPIA'}
                    </span>

                    <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-full tracking-wider leading-none ${
                        !isAppOpen
                            ? 'bg-zinc-800 text-zinc-400'
                            : isDanger
                            ? 'bg-[#FF2A54] text-white shadow-[0_0_10px_rgba(255,42,84,0.72)]'
                            : isWarning
                            ? 'bg-amber-400 text-black'
                            : 'bg-emerald-500 text-[#03140E]'
                    }`}>
                        {!isAppOpen
                            ? 'SIN CONEXIÓN'
                            : isDanger
                            ? (antiMuddy?.tag || 'BASS CLASH · -0.2 dB CLIP')
                            : (antiMuddy?.tag || 'CLEAR MIX · HEADROOM +2.4 dB')}
                    </span>
                </div>

                {/* Chips de telemetría compactos */}
                <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/50 font-mono text-[11px] text-cyan-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse"></span>
                        <span className="font-bold tracking-tight">⚡ <strong className="text-white font-extrabold">{latency}ms</strong> • SYNC</span>
                    </span>

                    {controllerState?.detected && (
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#0F172A] border border-cyan-500/40 text-cyan-300">
                            {isDanger ? `${controllerName} · LOW CH2 ACTIVO` : controllerName}
                        </span>
                    )}

                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#0F172A] border border-[#26354F] text-zinc-300">
                        CAMELOT: <strong style={{ color: harmonic?.color || '#38bdf8' }}>{camelotLabel}</strong>
                        {' · '}
                        {lufsDelta != null ? `${lufsDelta > 0 ? '+' : ''}${lufsDelta} dB` : '-8.4 LUFS'}
                    </span>
                </div>
            </div>

            {/* FILA 2: Explicación completa a ancho completo + Acción Táctica */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5 flex-wrap sm:flex-nowrap">
                <div className={`text-[13px] font-sans whitespace-normal leading-snug min-w-0 flex-1 ${
                    isDanger ? 'text-[#ffe4e6] font-semibold' : 'text-zinc-300 font-medium'
                }`}>
                    {!isAppOpen
                        ? 'Supervisión inactiva hasta conectar software y hardware DJ.'
                        : antiMuddy?.message || (isDanger
                            ? 'Choque de sub-graves detectado entre DK1 y DK2. Riesgo de saturación en PA.'
                            : 'Espectro de graves despejado (30–120 Hz). Sin riesgo de cancelación acústica.')}
                </div>

                {onApplyCorrection && isAppOpen ? (
                    <button
                        type="button"
                        onClick={onApplyCorrection}
                        className={`font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md border transition-all cursor-pointer shrink-0 ${
                            lowEqApplied
                                ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500 text-emerald-300'
                                : isDanger
                                ? 'bg-[#FF2A54] hover:bg-red-500 border-red-200 text-white font-black shadow-[0_0_12px_rgba(255,42,84,0.5)] animate-pulse'
                                : 'bg-[#0F172A] hover:bg-zinc-800 border-emerald-500/60 text-emerald-300'
                        }`}
                        title="Aplicar ajuste correctivo anti-muddy"
                    >
                        {actionText}
                    </button>
                ) : (
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-500 shrink-0">
                        EQ STANDBY
                    </span>
                )}
            </div>
        </section>
    );
});
