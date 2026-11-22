const { memo } = React;

/**
 * CopilotCleanMixBanner — Banner Táctico de Cabina: Mezcla Limpia / Alerta de Graves
 * Implementa el diseño fiel de v3 con visualizador de fase animado y telemetría de hardware.
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
    const isClean = !isDanger && !isWarning;

    const controllerName = (controllerState?.name || 'NUMARK NV II').replace(/\s*\(USB\)\s*/i, '').trim();

    return (
        <section 
            className={`bw-msg-banner ${isDanger ? 'is-danger' : ''} ${!isAppOpen ? 'opacity-50' : ''}`} 
            aria-live="polite"
        >
            {/* Visualizador de fase animado */}
            <div className="bw-msg-visual">
                <div className="bw-phase-bars">
                    <span className="bw-p-bar"></span>
                    <span className="bw-p-bar"></span>
                    <span className="bw-p-bar"></span>
                    <span className="bw-p-bar"></span>
                    <span className="bw-p-bar"></span>
                </div>
                <div className="msg-phase-meta font-mono text-[10px] leading-tight select-none">
                    <div className="text-zinc-400 font-bold">SUB-BASS</div>
                    <div className={`font-black ${isDanger ? 'text-[#ff6b88]' : 'text-emerald-400'}`}>
                        {!isAppOpen ? 'STANDBY' : isDanger ? 'COLISIÓN 142°' : 'FASE 0° OK'}
                    </div>
                </div>
            </div>

            {/* Núcleo de información del estado acústico */}
            <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-syne font-black text-sm tracking-wider text-white">
                        {!isAppOpen 
                            ? 'CABINA EN STANDBY' 
                            : isDanger 
                            ? (antiMuddy?.title || 'ALERTA DE GRAVES') 
                            : isWarning 
                            ? (antiMuddy?.title || 'AVISO DE FRECUENCIAS') 
                            : 'MEZCLA LIMPIA'}
                    </span>
                    <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full tracking-wider ${
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
                <div className={`text-[11.5px] font-syne truncate ${
                    isDanger ? 'text-[#ffe4e6] font-semibold' : 'text-zinc-300 font-medium'
                }`}>
                    {!isAppOpen 
                        ? 'Supervisión inactiva hasta conectar software y hardware DJ.' 
                        : antiMuddy?.message || (isDanger 
                            ? 'Choque de sub-graves detectado entre DK1 y DK2. Riesgo de saturación en PA.' 
                            : 'Espectro de graves despejado (30–120 Hz). Sin riesgo de cancelación acústica.')}
                </div>
            </div>

            {/* Telemetría y acciones de controladora */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Latencia en vivo integrada (sin palabra Cabina y sin botón Deck) */}
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/50 font-mono text-[10.5px] text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse"></span>
                    <span className="font-bold tracking-tight">⚡ Latencia: <strong className="text-white font-extrabold">{latency}ms</strong> • Sincronizado</span>
                </span>

                {controllerState?.detected && (
                    <span className="font-mono text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-[#0F172A] border border-cyan-500/40 text-cyan-300">
                        {controllerName} · {isDanger ? 'LOW CH2 ACTIVO' : 'Centrado (12h) · 0 dB'}
                    </span>
                )}

                {onApplyCorrection && isAppOpen ? (
                    <button
                        type="button"
                        onClick={onApplyCorrection}
                        className={`font-mono text-[10.5px] font-bold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                            lowEqApplied
                                ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500 text-emerald-300'
                                : isDanger
                                ? 'bg-[#FF2A54] hover:bg-red-500 border-red-200 text-white font-black shadow-[0_0_12px_rgba(255,42,84,0.5)] animate-pulse'
                                : 'bg-[#0F172A] hover:bg-zinc-800 border-emerald-500/60 text-emerald-300'
                        }`}
                        title="Aplicar ajuste correctivo anti-muddy"
                    >
                        {lowEqApplied ? '✓ EQ RESTABLECIDO' : (antiMuddy?.action || (isDanger ? 'ACCIÓN: CORTAR LOW CH2 (-12 dB) AHORA' : 'ACCIÓN: Frecuencias equilibradas'))}
                    </button>
                ) : (
                    <span className="font-mono text-[10.5px] px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500">
                        EQ STANDBY
                    </span>
                )}

                <span className="font-mono text-[10.5px] font-bold px-2 py-1 rounded-lg bg-[#0F172A] border border-[#26354F] text-zinc-300">
                    CAMELOT: <strong style={{ color: harmonic?.color || '#38bdf8' }}>{harmonic?.badge || '--'}</strong>
                    {' · '}
                    {lufsDelta != null ? `${lufsDelta > 0 ? '+' : ''}${lufsDelta} dB` : '-8.4 LUFS'}
                </span>
            </div>
        </section>
    );
});
