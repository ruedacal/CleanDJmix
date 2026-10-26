const { useState, useEffect, useRef } = React;

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

    // Polling de baja latencia (450ms) a /api/copilot/status
    useEffect(() => {
        let isMounted = true;
        const fetchStatus = async () => {
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
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 450);
        return () => {
            isMounted = false;
            clearInterval(interval);
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
        { id: 'auto', label: 'Auto', icon: '🔄', color: '#a855f7' },
        { id: 'serato', label: 'Serato', icon: '💿', color: '#06b6d4' },
        { id: 'rekordbox', label: 'Rekordbox', icon: '🎛️', color: '#3b82f6' },
        { id: 'virtualdj', label: 'VirtualDJ', icon: '🎧', color: '#f97316' },
        { id: 'traktor', label: 'Traktor', icon: '⚡', color: '#eab308' }
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

                    {/* BADGE DEL SOFTWARE ACTIVO */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700/60 font-mono text-xs">
                        <span>{platform_icon || '🎛️'}</span>
                        <strong style={{ color: platform_color || '#06b6d4' }}>{platform_name || 'DJ LINK'}</strong>
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
                    {/* SELECTOR DE PLATAFORMA MULTI-DJ */}
                    <div className="flex items-center p-1 bg-zinc-950/90 rounded-xl border border-zinc-800/90 shadow-inner">
                        {platformsList.map(p => {
                            const isSelected = (platform_mode === p.id) || (platform_mode === 'auto' && p.id === 'auto');
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setPlatform(p.id)}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                                        isSelected 
                                        ? 'bg-zinc-800 text-white shadow-md border border-zinc-600'
                                        : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                    style={isSelected ? { color: p.color, borderColor: `${p.color}66` } : {}}
                                    title={`Conectar con ${p.label}`}
                                >
                                    <span className="text-xs">{p.icon}</span>
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

            {/* CUERPO PRINCIPAL: DUAL DECK HEADS-UP DISPLAY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <DeckCard deck={deck_1} side="A" isMaster={deck_1.is_master} />
                <DeckCard deck={deck_2} side="B" isMaster={deck_2.is_master} />
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

            {/* SECCIÓN DE RECOMENDACIONES TÁCTICAS INMEDIATAS */}
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
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="min-w-0">
                                    <div className="font-syne font-bold text-sm text-white group-hover:text-djcyan-400 transition-colors truncate">
                                        {rec.title}
                                    </div>
                                    <div className="font-syne text-xs text-zinc-400 truncate">
                                        {rec.artist}
                                    </div>
                                </div>
                                <div 
                                    className="px-2 py-0.5 rounded-lg font-orbitron font-bold text-xs text-black shrink-0"
                                    style={{ backgroundColor: rec.camelot_color }}
                                >
                                    {rec.camelot}
                                </div>
                            </div>

                            <div className="text-[11px] text-zinc-400 font-mono mb-2 line-clamp-2">
                                {rec.reason}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 font-mono text-[10px] text-zinc-500">
                                <span>{rec.bpm} BPM</span>
                                <span className="text-djcyan-400 font-bold uppercase">{rec.strategy}</span>
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

// Subcomponente de Tarjeta de Deck A/B
function DeckCard({ deck, side, isMaster }) {
    if (!deck) return null;

    return (
        <div className={`p-4 sm:p-5 lg:p-6 rounded-3xl border transition-all relative overflow-hidden ${
            isMaster 
            ? 'bg-gradient-to-b from-[#0c0d1c] to-[#06060c] border-djcyan-500/70 shadow-[0_0_30px_rgba(6,182,212,0.25)]' 
            : 'bg-[#07070f] border-zinc-800 hover:border-zinc-700'
        }`}>
            {/* CABECERA DEL DECK */}
            <div className="flex items-center justify-between mb-3">
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
                </div>
                <span className="font-mono text-xs text-zinc-500 uppercase">
                    {deck.is_audited ? '✓ DSP BEATWAVE' : 'DEFAULT DSP'}
                </span>
            </div>

            {/* TÍTULO Y ARTISTA (GIGANTES PARA CABINA) */}
            <div className="mb-4">
                <h2 className="font-syne font-black text-xl sm:text-2xl lg:text-3xl text-white tracking-wide leading-tight line-clamp-1">
                    {deck.title}
                </h2>
                <p className="font-syne font-bold text-sm sm:text-base text-zinc-400 mt-0.5 line-clamp-1">
                    {deck.artist}
                </p>
            </div>

            {/* CAMELOT BADGE & BPM HERO */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* INSIGNIA CAMELOT */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-zinc-800/80">
                    <div 
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-orbitron font-black text-lg sm:text-xl text-black shadow-[0_0_15px_rgba(0,0,0,0.8)] shrink-0"
                        style={{ backgroundColor: deck.camelot_color }}
                    >
                        {deck.camelot}
                    </div>
                    <div>
                        <div className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Tonalidad</div>
                        <div className="font-syne font-bold text-sm sm:text-base text-white">{deck.raw_key || deck.camelot}</div>
                    </div>
                </div>

                {/* BPM & TEMPO */}
                <div className="p-3 rounded-2xl bg-black/40 border border-zinc-800/80 flex flex-col justify-center">
                    <div className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Tempo Estricto</div>
                    <div className="font-orbitron font-black text-xl sm:text-2xl text-white">
                        {deck.bpm ? Number(deck.bpm).toFixed(2) : '130.00'} <span className="text-xs font-normal text-zinc-400">BPM</span>
                    </div>
                </div>
            </div>

            {/* HUELLA ESPECTRAL ACÚSTICA (SUB / MED / HI) */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/60 font-mono text-xs">
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

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                    <span>Medios: {deck.mid_ratio}%</span>
                    <span>Agudos: {deck.high_ratio}%</span>
                    <span>LUFS: <strong className="text-zinc-300">{deck.lufs} dB</strong></span>
                </div>
            </div>

            {/* COMENTARIO TÁCTICO CABINA */}
            <div className="mt-3 p-2.5 rounded-2xl bg-black/50 border border-zinc-800/80 flex items-start gap-2.5">
                <span className="text-emerald-400 text-sm shrink-0">💬</span>
                <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">Comentario Táctico DJ</div>
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
