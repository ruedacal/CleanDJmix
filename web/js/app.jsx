const { useState, useEffect, useRef } = React;

const NV2_COLORS = [
    { id: 1, name: "Kick / Intro", color: "#ef4444", text: "text-red-400", border: "border-red-500/50", bg: "bg-red-500/10", time: "00:00.215" },
    { id: 2, name: "Hi-Hats In", color: "#f97316", text: "text-orange-400", border: "border-orange-500/50", bg: "bg-orange-500/10", time: "00:15.110" },
    { id: 3, name: "Bassline", color: "#eab308", text: "text-yellow-400", border: "border-yellow-500/50", bg: "bg-yellow-500/10", time: "00:30.005" },
    { id: 4, name: "Main Break", color: "#22c55e", text: "text-green-400", border: "border-green-500/50", bg: "bg-green-500/10", time: "01:00.120" },
    { id: 5, name: "Drop 1 (Climax)", color: "#06b6d4", text: "text-cyan-400", border: "border-cyan-500/50", bg: "bg-cyan-500/10", time: "01:30.240" },
    { id: 6, name: "Mid Break", color: "#3b82f6", text: "text-blue-400", border: "border-blue-500/50", bg: "bg-blue-500/10", time: "02:30.400" },
    { id: 7, name: "Drop 2 (Re-Kick)", color: "#a855f7", text: "text-purple-400", border: "border-purple-500/50", bg: "bg-purple-500/10", time: "03:00.510" },
    { id: 8, name: "Outro Mix Point", color: "#ec4899", text: "text-pink-400", border: "border-pink-500/50", bg: "bg-pink-500/10", time: "04:15.000" }
];

const DEFAULT_VINYL_SVG = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="12" fill="#0d0d14"/><circle cx="80" cy="80" r="58" fill="#14141f" stroke="#27273a" stroke-width="2"/><circle cx="80" cy="80" r="44" fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/><circle cx="80" cy="80" r="30" fill="none" stroke="#3b82f6" stroke-width="1.5" opacity="0.5"/><circle cx="80" cy="80" r="14" fill="#06b6d4"/><circle cx="80" cy="80" r="5" fill="#09090b"/></svg>');

function getValidCover(c) {
    if (!c || typeof c !== 'string') return DEFAULT_VINYL_SVG;
    if (c.startsWith("data:") || c.startsWith("http://") || c.startsWith("https://") || c.startsWith("/")) return c;
    return "https://i.scdn.co/image/" + c;
}

const Icons = {
    Library: () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
    Spotify: () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
    Routing: () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>,
    Folder: () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>,
    Terminal: () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>,
    Play: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>,
    Pause: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>,
    Sliders: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>,
    Gear: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
    Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
    Warning: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
    Excel: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
};

// Tooltip Flotante Educativo Desacoplado de Overflows mediante ReactDOM.createPortal
const InfoTip = ({ text, title }) => {
    const [coords, setCoords] = useState(null);
    const btnRef = useRef(null);

    const handleEnter = () => {
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        setCoords({
            top: rect.top + rect.height / 2,
            right: window.innerWidth - rect.left + 12
        });
    };

    const handleLeave = () => setCoords(null);

    return (
        <span className="inline-flex items-center ml-1.5 align-middle">
            <button 
                ref={btnRef}
                type="button"
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                onClick={(e) => { e.stopPropagation(); coords ? handleLeave() : handleEnter(); }}
                className="w-3.5 h-3.5 rounded-full bg-djzinc-800 hover:bg-djcyan-500 hover:text-black border border-djzinc-600 flex items-center justify-center text-[9px] font-mono font-bold text-gray-400 transition-colors cursor-help select-none shrink-0"
            >
                i
            </button>

            {coords && ReactDOM.createPortal(
                <div 
                    style={{ 
                        position: 'fixed', 
                        top: `${coords.top}px`, 
                        right: `${coords.right}px`, 
                        transform: 'translateY(-50%)',
                        zIndex: 999999
                    }}
                    className="w-72 bg-djzinc-900 border border-djzinc-700 rounded-lg p-3 text-xs text-gray-200 shadow-[0_12px_36px_rgba(0,0,0,0.95),0_0_15px_rgba(6,182,212,0.2)] pointer-events-none select-none"
                >
                    <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-djzinc-900 border-t border-r border-djzinc-700 rotate-45"></div>

                    {title && (
                        <div className="text-[11px] font-bold text-djcyan-400 mb-1 uppercase tracking-wider flex items-center gap-1.5 border-b border-djzinc-800 pb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-djcyan-400"></span>
                            {title}
                        </div>
                    )}
                    <div className="text-[11px] leading-relaxed text-gray-300 font-sans break-words whitespace-normal">
                        {text}
                    </div>
                </div>,
                document.body
            )}
        </span>
    );
};

// Función auxiliar para calcular la envolvente estructural real (Tri-banda: Bajos, Medios, Agudos)
function computeTrackStructuralBands(xNorm, seed) {
    const s = ((seed % 11) - 5) * 0.008;
    const b1Start = Math.max(0.15, 0.22 + s);
    const b1End = b1Start + 0.12;
    const drop1End = b1End + 0.22;
    const b2Start = drop1End;
    const b2End = b2Start + 0.14;
    const drop2End = Math.min(0.88, b2End + 0.18);

    let bass = 0.20, mid = 0.20, treble = 0.20;

    if (xNorm < b1Start) {
        // Intro: Bombo presente, hi-hats entrando progresivamente
        const p = xNorm / b1Start;
        bass = 0.72 + 0.20 * Math.sin(xNorm * 38 + seed);
        mid = 0.40 + 0.25 * p;
        treble = 0.35 + 0.35 * p;
    } else if (xNorm >= b1Start && xNorm < b1End) {
        // Break 1: Silencio de bombo (bass cae), subida de sintetizadores y vocales (medios/agudos)
        const p = (xNorm - b1Start) / (b1End - b1Start);
        bass = 0.10 + 0.05 * Math.sin(xNorm * 20);
        mid = 0.70 + 0.25 * Math.sin(p * Math.PI);
        treble = 0.45 + 0.45 * p;
    } else if (xNorm >= b1End && xNorm < drop1End) {
        // Drop 1 (Climax): Pegada máxima en graves, medios densos, agudos abiertos
        bass = 0.94 + 0.06 * Math.sin(xNorm * 45 + seed);
        mid = 0.82 + 0.10 * Math.sin(xNorm * 30);
        treble = 0.85 + 0.10 * Math.cos(xNorm * 25);
    } else if (xNorm >= b2Start && xNorm < b2End) {
        // Mid Break: Desaparición de rítmica pesada, tensión armónica
        const p = (xNorm - b2Start) / (b2End - b2Start);
        bass = 0.12 + 0.06 * Math.cos(xNorm * 18);
        mid = 0.85 + 0.12 * Math.sin(p * Math.PI);
        treble = 0.55 + 0.35 * p;
    } else if (xNorm >= b2End && xNorm < drop2End) {
        // Drop 2 (Re-Kick): Máxima energía bailable
        bass = 0.98 + 0.02 * Math.sin(xNorm * 50 + seed);
        mid = 0.85 + 0.10 * Math.sin(xNorm * 35);
        treble = 0.88 + 0.08 * Math.cos(xNorm * 28);
    } else {
        // Outro: Desvanecimiento gradual de capas para mezcla limpia
        const p = (xNorm - drop2End) / (1 - drop2End);
        bass = Math.max(0.10, (0.75 - 0.55 * p) + 0.10 * Math.sin(xNorm * 30));
        mid = Math.max(0.10, (0.45 - 0.35 * p));
        treble = Math.max(0.10, (0.35 - 0.28 * p));
    }
    return { bass, mid, treble };
}

// Mini visualizador armónico tri-banda interactivo en celda de tabla
const TableHarmonicWaveform = ({ track, duration = "05:00", onPlayTrack, isCurrentPlaying, onTogglePlay, playProgress = 0 }) => {
    const canvasRef = useRef(null);
    const rawId = track && track.id ? String(track.id) : "1";
    const seed = rawId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;

    const handleClickScrub = (e) => {
        e.stopPropagation();
        if (isCurrentPlaying && onTogglePlay) {
            onTogglePlay();
            return;
        }
        if (!canvasRef.current || !onPlayTrack) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, clickX / rect.width));
        onPlayTrack(track, pct, true);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const width = 112;
        const height = 28;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = "#040407";
        ctx.fillRect(0, 0, width, height);
        const centerY = height / 2;

        // Renderizado estático y nítido de la estructura tri-banda
        for (let x = 0; x <= width; x += 1) {
            const xNorm = x / width;
            const { bass, mid, treble } = computeTrackStructuralBands(xNorm, seed);

            // Bajos (Azul profundo)
            const hBass = (height * 0.42) * bass;
            ctx.fillStyle = "rgba(30, 64, 175, 0.85)";
            ctx.fillRect(x, centerY - hBass, 1, hBass * 2);

            // Medios (Naranja/Ámbar)
            const hMid = (height * 0.30) * mid;
            ctx.fillStyle = "rgba(249, 115, 22, 0.85)";
            ctx.fillRect(x, centerY - hMid, 1, hMid * 2);

            // Agudos (Cian brillante)
            const hTreble = (height * 0.18) * treble;
            ctx.fillStyle = "rgba(34, 211, 238, 0.95)";
            ctx.fillRect(x, centerY - hTreble, 1, hTreble * 2);
        }

        // Cursor playhead si se está reproduciendo
        if (isCurrentPlaying && playProgress > 0) {
            const px = width * Math.min(1, Math.max(0, playProgress));
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(px, 0);
            ctx.lineTo(px, height);
            ctx.stroke();
        }
    }, [track, seed, isCurrentPlaying, playProgress]);

    return (
        <div onClick={handleClickScrub} className="w-28 h-7 bg-[#040407] rounded border border-djzinc-800 relative overflow-hidden group cursor-pointer hover:border-djcyan-400 transition-colors flex items-center justify-center">
            <canvas ref={canvasRef} style={{ width: "112px", height: "28px", display: "block" }} />
            <span className="absolute bottom-0.5 right-1 text-[8px] font-mono text-gray-400 opacity-60 group-hover:opacity-100">{duration}</span>
            {isCurrentPlaying && (
                <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-djcyan-400 animate-pulse"></div>
            )}
        </div>
    );
};

// Visualizador de Onda Rekordbox Style con Marcadores Numark NV2 en el Inspector
const RekordboxWaveform = ({ track, cues = NV2_COLORS, duration = "06:12", onSeekTrack, playProgress = 0, isCurrentPlaying = false }) => {
    const canvasRef = useRef(null);
    const rawId = track && track.id ? String(track.id) : "1";
    const seed = rawId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;

    const handleCanvasClick = (e) => {
        if (!canvasRef.current || !onSeekTrack) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        onSeekTrack(track, pct, true);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.parentElement.clientWidth || 340;
        const height = 114;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = "#030306";
        ctx.fillRect(0, 0, width, height);
        const centerY = height / 2;

        // Cuadrícula de compases de fondo (32 compases)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 1;
        for (let b = 0; b <= 32; b++) {
            const bx = (b / 32) * width;
            ctx.beginPath();
            ctx.moveTo(bx, 0);
            ctx.lineTo(bx, height);
            ctx.stroke();
        }

        // Renderizado estático estructural por franjas de frecuencia (Bajos, Medios, Agudos)
        for (let x = 0; x <= width; x += 1.5) {
            const xNorm = x / width;
            const { bass, mid, treble } = computeTrackStructuralBands(xNorm, seed);

            // Capa 1: Bajos (Azul profundo de club)
            const hBass = (height * 0.44) * bass;
            ctx.fillStyle = "rgba(30, 64, 175, 0.85)";
            ctx.fillRect(x, centerY - hBass, 1.5, hBass * 2);

            // Capa 2: Medios (Naranja armónico de vocales/leads)
            const hMid = (height * 0.32) * mid;
            ctx.fillStyle = "rgba(249, 115, 22, 0.85)";
            ctx.fillRect(x, centerY - hMid, 1.5, hMid * 2);

            // Capa 3: Agudos (Cian brillante de percusión y platos)
            const hTreble = (height * 0.20) * treble;
            ctx.fillStyle = "rgba(34, 211, 238, 0.95)";
            ctx.fillRect(x, centerY - hTreble, 1.5, hTreble * 2);
        }

        // Línea central de referencia cero
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Cursor blanco de posición de reproducción
        if (playProgress > 0) {
            const px = width * Math.min(1, Math.max(0, playProgress));
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.moveTo(px, 0);
            ctx.lineTo(px, height);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }, [track, seed, playProgress, isCurrentPlaying]);

    return (
        <div className="flex flex-col gap-1 w-full bg-[#050508] p-2.5 rounded-lg border border-djzinc-800">
            <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 px-0.5">
                <span className="text-djcyan-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-djcyan-400"></span>
                    ESTRUCTURA DE PISTA Y POSICIÓN DE CUES (REKORDBOX)
                </span>
                <span>{duration}</span>
            </div>
            <div onClick={handleCanvasClick} className="relative w-full h-[114px] bg-[#030306] rounded border border-djzinc-800/80 overflow-hidden cursor-pointer hover:border-djcyan-500/50 transition-colors">
                <canvas ref={canvasRef} style={{ width: "100%", height: "114px", display: "block" }} />
                {cues.map((c, idx) => {
                    const leftPos = Math.min(94, Math.max(4, (idx * 12.2) + 3));
                    return (
                        <div key={c.id} className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none z-10" style={{ left: `${leftPos}%` }}>
                            <div className="w-4 h-3.5 rounded-b text-[8px] font-mono font-black text-black flex items-center justify-center shadow" style={{ backgroundColor: c.color }}>
                                {c.id}
                            </div>
                            <div className="w-[1px] h-full opacity-60" style={{ backgroundColor: c.color }}></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Master Waveform Scrubber en el Footer Deck
const FooterMasterWaveform = ({ track, isPlaying, playProgress = 0, onSeek, cues = NV2_COLORS }) => {
    const canvasRef = useRef(null);
    const rawId = track && track.id ? String(track.id) : "1";
    const seed = rawId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;

    const handleScrub = (e) => {
        if (!canvasRef.current || !onSeek) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, clickX / rect.width));
        onSeek(pct);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.parentElement.clientWidth || 640;
        const height = 42;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = "#060609";
        ctx.fillRect(0, 0, width, height);
        const centerY = height / 2;

        // Renderizado estático estructural sin deformaciones senoidales
        for (let x = 0; x <= width; x += 1.5) {
            const xNorm = x / width;
            const { bass, mid, treble } = computeTrackStructuralBands(xNorm, seed);

            // Bajos
            const hBass = (height * 0.42) * bass;
            ctx.fillStyle = "rgba(30, 64, 175, 0.82)";
            ctx.fillRect(x, centerY - hBass, 1.5, hBass * 2);

            // Medios
            const hMid = (height * 0.30) * mid;
            ctx.fillStyle = "rgba(249, 115, 22, 0.82)";
            ctx.fillRect(x, centerY - hMid, 1.5, hMid * 2);

            // Agudos
            const hTreble = (height * 0.18) * treble;
            ctx.fillStyle = "rgba(34, 211, 238, 0.90)";
            ctx.fillRect(x, centerY - hTreble, 1.5, hTreble * 2);
        }

        // Línea central
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Línea blanca Playhead / Scrubber sincronizada con playProgress
        const px = width * Math.min(1, Math.max(0, playProgress));
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }, [track, playProgress, seed]);

    return (
        <div onClick={handleScrub} className="flex-1 h-11 bg-[#060609] rounded-lg border border-djzinc-800/90 relative overflow-hidden group cursor-pointer hover:border-djcyan-500/70 transition-colors shadow-inner flex items-center mx-6">
            <canvas ref={canvasRef} style={{ width: "100%", height: "42px", display: "block" }} />
            {cues.map((cue, idx) => {
                const leftPos = Math.min(96, Math.max(3, (idx * 12.4) + 2.5));
                return (
                    <div key={cue.id} className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none z-10" style={{ left: `${leftPos}%` }}>
                        <div className="w-3.5 h-3 rounded-b text-[8px] font-mono font-black text-black flex items-center justify-center shadow" style={{ backgroundColor: cue.color }}>{cue.id}</div>
                        <div className="w-[1px] h-full opacity-50" style={{ backgroundColor: cue.color }}></div>
                    </div>
                );
            })}
        </div>
    );
};


// Modal de configuración por lotes para Auditoría
const BatchAuditorModal = ({ isOpen, onClose, onRunBatch }) => {
    const [opts, setOpts] = useState({ fftLossless: true, trimSilences: true, beatgrid: true, bpmKey: true, energyDance: true, moodDetect: true, hotCues8: true, tacticalComments: true });
    if (!isOpen) return null;
    const toggle = (key) => setOpts(prev => ({ ...prev, [key]: !prev[key] }));
    const activeCount = Object.values(opts).filter(Boolean).length;

    const modules = [
        {
            group: "DSP & Audio Forensics",
            items: [
                { key: "fftLossless", title: "Inspección FFT Lossless Real", desc: "Análisis espectral por FFT para cazar transcodificaciones falsas a 16kHz/19kHz.", badge: "FFT 4096", badgeColor: "text-djcyan-400 bg-djcyan-950/80 border-djcyan-800/60" },
                { key: "trimSilences", title: "Zero-Crossing Silence Trim", desc: "Elimina silencios de cabecera y cola cortando en cruce por cero a -48 dBFS.", badge: "DSP Fast", badgeColor: "text-djgreen-400 bg-djgreen-950/80 border-djgreen-800/60" }
            ]
        },
        {
            group: "Metadatos & Mezcla Armónica",
            items: [
                { key: "beatgrid", title: "Fijación Downbeat Beatgrid 1.0.0", desc: "Encuentra el primer golpe de bombo real y ancla el grid para evitar desfases de sincro.", badge: "Grid Auto", badgeColor: "text-blue-400 bg-blue-950/80 border-blue-800/60" },
                { key: "bpmKey", title: "BPM Decimal & Notación Camelot", desc: "Calcula tempo con 2 decimales y mapea tono a notación Camelot estándar.", badge: "Key Wheel", badgeColor: "text-amber-400 bg-amber-950/80 border-amber-800/60" }
            ]
        },
        {
            group: "Perfil Psicoacústico & Hardware Cues",
            items: [
                { key: "energyDance", title: "Cálculo Energía & Danceability", desc: "Calcula la pegada RMS de graves y solidez rítmica de 1 a 100.", badge: "RMS Core", badgeColor: "text-purple-400 bg-purple-950/80 border-purple-800/60" },
                { key: "moodDetect", title: "Clasificación de Atmósfera (Mood)", desc: "Etiqueta el estilo sonoro de la sesión (Peak Time, Raw, Hypnotic, Deep).", badge: "AI Cluster", badgeColor: "text-emerald-400 bg-emerald-950/80 border-emerald-800/60" },
                { key: "hotCues8", title: "Inyección 8 Hot Cues (Numark NV2)", desc: "Genera los 8 puntos estructurales estándar de sesión en pads RGB.", badge: "NV2 Cues", badgeColor: "text-pink-400 bg-pink-950/80 border-pink-800/60" },
                { key: "tacticalComments", title: "Inyección de Comentario Táctico DJ", desc: "Inyecta en el tag ID3 COMM la guía rápida de mezcla visible en pantalla de la mesa.", badge: "Tag ID3", badgeColor: "text-gray-300 bg-djzinc-800 border-djzinc-700" }
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-djzinc-950 border border-djzinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-djzinc-800 flex items-center justify-between bg-djzinc-900/60">
                    <div className="flex items-center gap-2">
                        <Icons.Sliders />
                        <h3 className="font-bold text-sm uppercase tracking-wider text-white">Configurar Procesamiento Masivo (Batch)</h3>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-full bg-djzinc-800 text-gray-400 hover:text-white flex items-center justify-center text-xs">✕</button>
                </div>
                <div className="p-6 overflow-y-auto space-y-5">
                    {modules.map((group, gIdx) => (
                        <div key={gIdx} className="space-y-2.5">
                            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-djcyan-400"></span>
                                {group.group}
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                                {group.items.map(item => {
                                    const active = opts[item.key];
                                    return (
                                        <div key={item.key} onClick={() => toggle(item.key)} className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${active ? 'bg-djzinc-900/90 border-djcyan-500/40 shadow-sm' : 'bg-djzinc-950/40 border-djzinc-850 opacity-60 hover:opacity-90'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${active ? 'bg-djcyan-500 border-djcyan-400 text-black' : 'border-djzinc-700 bg-djzinc-900 text-transparent'}`}>
                                                    ✓
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-white">{item.title}</span>
                                                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${item.badgeColor}`}>{item.badge}</span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="px-6 py-4 bg-djzinc-900 border-t border-djzinc-800 flex items-center justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-djzinc-800 border border-djzinc-700 cursor-pointer">Cancelar</button>
                    <button onClick={() => onRunBatch(opts)} className="px-5 py-2 rounded-xl text-xs font-bold bg-djcyan-500 hover:bg-djcyan-400 text-black cursor-pointer shadow-lg shadow-djcyan-500/20">Ejecutar Procesamiento Masivo ({activeCount})</button>
                </div>
            </div>
        </div>
    );
};

// Espacio de Trabajo: Auditoría & DSP
const AuditWorkspace = ({ selectedTrack, setSelectedTrack, onPlayTrack, nowPlayingTrack, isPlaying, onTogglePlay, playProgress = 0 }) => {
    const [rutaOrigen, setRutaOrigen] = useState('');
    const [isAuditing, setIsAuditing] = useState(false);
    const [isLoadingDir, setIsLoadingDir] = useState(false);
    const [metrics, setMetrics] = useState({ total: 0, missing: 0, ready: 0, errors: 0 });
    const [filtro, setFiltro] = useState('todos');
    const [busqueda, setBusqueda] = useState('');
    const [batchModalOpen, setBatchModalOpen] = useState(false);
    const [batchProgress, setBatchProgress] = useState(0);
    const [batchStatusMsg, setBatchStatusMsg] = useState('');
    const [saveFeedback, setSaveFeedback] = useState('');

    const [tracks, setTracks] = useState([]);
    const [fftModalOpen, setFftModalOpen] = useState(false);
    const [fftAnalysisData, setFftAnalysisData] = useState(null);
    const [isAnalyzingFft, setIsAnalyzingFft] = useState(false);

    const currentTrack = tracks.find(t => t.id === selectedTrack) || tracks[0] || {};

    useEffect(() => {
        if (window.eel && typeof window.eel.expose === 'function') {
            window.actualizar_progreso_batch = (pct, msg) => {
                setBatchProgress(pct);
                setBatchStatusMsg(msg);
            };
            window.eel.expose(window.actualizar_progreso_batch, "actualizar_progreso_batch");
        }
    }, []);

    const updateCurrentTrackField = (field, val) => {
        setTracks(prev => prev.map(t => t.id === currentTrack.id ? { ...t, [field]: val } : t));
    };

    const handleExplorar = async () => {
        if (window.eel && window.eel.seleccionar_directorio) {
            const nuevaRuta = await window.eel.seleccionar_directorio()();
            if (nuevaRuta) {
                setRutaOrigen(nuevaRuta);
                await handleCargarDirectorio(nuevaRuta);
            }
        }
    };

    const handleCargarDirectorio = async (pathOverride) => {
        const target = pathOverride || rutaOrigen;
        if (!target) return;
        if (window.eel && window.eel.cargar_metadatos_directorio && !isLoadingDir) {
            setIsLoadingDir(true);
            setBatchStatusMsg(`Leyendo metadatos de archivos en ${target}...`);
            try {
                const res = await window.eel.cargar_metadatos_directorio(target)();
                if (res && Array.isArray(res.tracks)) {
                    setTracks(res.tracks);
                    if (res.tracks.length > 0) {
                        setSelectedTrack(res.tracks[0].id);
                    }
                    setMetrics({
                        total: res.total || 0,
                        missing: res.sin_meta || 0,
                        ready: res.ready !== undefined ? res.ready : Math.max(0, (res.total || 0) - (res.sin_meta || 0)),
                        errors: res.errors || 0
                    });
                }
            } catch (e) {
                console.error("Fallo carga metadatos de directorio:", e);
            } finally {
                setIsLoadingDir(false);
                setBatchStatusMsg('');
            }
        }
    };

    const handleAuditar = async (pathOverride) => {
        const target = pathOverride || rutaOrigen;
        if (!target) {
            alert("Por favor selecciona o explora una carpeta primero.");
            return;
        }
        if (window.eel && window.eel.iniciar_auditoria && !isAuditing) {
            setIsAuditing(true);
            setBatchStatusMsg(`Auditando biblioteca en ${target}...`);
            setBatchProgress(35);
            try {
                const res = await window.eel.iniciar_auditoria(target)();
                if (res && Array.isArray(res.tracks) && res.tracks.length > 0) {
                    setTracks(res.tracks);
                    setSelectedTrack(res.tracks[0].id);
                    setMetrics({
                        total: res.total || 0,
                        missing: res.sin_meta || 0,
                        ready: res.ready !== undefined ? res.ready : Math.max(0, (res.total || 0) - (res.sin_meta || 0)),
                        errors: res.errors !== undefined ? res.errors : res.tracks.filter(x => String(x.status).includes('Fake')).length
                    });
                }
            } catch (e) {
                console.error("Fallo auditoría:", e);
            } finally {
                setBatchProgress(100);
                setTimeout(() => { setIsAuditing(false); setBatchProgress(0); setBatchStatusMsg(''); }, 400);
            }
        }
    };

    const handleExportarXLS = async () => {
        if (!tracks || tracks.length === 0) {
            alert("No hay pistas auditadas para exportar.");
            return;
        }
        if (window.eel && window.eel.exportar_auditoria_xls) {
            try {
                const res = await window.eel.exportar_auditoria_xls(tracks, rutaOrigen)();
                if (res && res.status === 'ok') {
                    const nombreArchivo = res.path ? res.path.split('/').pop() : "CleanDJmix_Audit_Respaldo.xlsx";
                    setSaveFeedback(`✓ Exportado con éxito: ${nombreArchivo}`);
                    setTimeout(() => setSaveFeedback(''), 4000);
                } else {
                    alert(res?.msg || "Error al exportar a Excel.");
                }
            } catch (e) {
                console.error("Error al exportar XLS:", e);
                alert("Error al exportar reporte XLS.");
            }
        }
    };

    const handleAbrirFftModal = async (trackParaAnalisis) => {
        const trk = trackParaAnalisis || currentTrack;
        const targetPath = trk?.path || trk?.f;
        if (!targetPath) {
            alert("No hay ruta de archivo disponible para el análisis espectral FFT.");
            return;
        }
        setFftModalOpen(true);
        setIsAnalyzingFft(true);
        setFftAnalysisData(null);
        if (window.eel && window.eel.analizar_espectro_fft) {
            try {
                const res = await window.eel.analizar_espectro_fft(targetPath, trk.id)();
                setFftAnalysisData(res);
                if (res && res.cutoff_khz !== undefined) {
                    updateCurrentTrackField('cutoff_khz', res.cutoff_khz);
                    if (res.estado) {
                        updateCurrentTrackField('status', res.estado);
                    }
                }
            } catch (err) {
                console.error("Error al ejecutar análisis FFT:", err);
            } finally {
                setIsAnalyzingFft(false);
            }
        } else {
            setIsAnalyzingFft(false);
        }
    };

    const handleGuardarTrack = async () => {
        if (!currentTrack) return;
        if (window.eel && window.eel.guardar_cambios_track) {
            await window.eel.guardar_cambios_track(currentTrack)();
        }
        setSaveFeedback('✓ Guardado en disco');
        setTimeout(() => setSaveFeedback(''), 2500);
    };

    const tracksFiltrados = tracks.filter(t => {
        const term = busqueda.toLowerCase();
        const m = (t?.t || t?.title || '').toLowerCase().includes(term) || (t?.a || t?.artist || '').toLowerCase().includes(term) || (t?.f || t?.filename || '').toLowerCase().includes(term);
        if (!m) return false;
        if (filtro === 'missing') return (t?.b === '--' || t?.k === '--');
        if (filtro === 'error') return String(t?.status || '').includes('Fake');
        return true;
    });

    return (
        <div className="flex w-full h-full overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="p-4 border-b border-djzinc-800 bg-djzinc-950 flex justify-between items-center shrink-0">
                    <div className="flex gap-3 items-center w-1/2">
                        <div className="flex-1 max-w-md bg-djzinc-900 rounded-md border border-djzinc-700 flex overflow-hidden">
                            <span className="bg-djzinc-800 px-3 py-1.5 text-xs text-gray-400 font-mono border-r border-djzinc-700 flex items-center">ORIGEN</span>
                            <input type="text" value={rutaOrigen} onChange={(e) => setRutaOrigen(e.target.value)} className="flex-1 bg-transparent px-3 py-1.5 text-sm text-gray-200 outline-none font-mono" />
                        </div>
                        <button onClick={handleExplorar} className="bg-djzinc-800 hover:bg-djzinc-700 border border-djzinc-600 rounded px-4 py-1.5 text-xs font-bold text-gray-300 cursor-pointer">Explorar</button>
                    </div>
                    <div className="flex gap-2.5 items-center">
                        <button onClick={() => setBatchModalOpen(true)} className="bg-djzinc-800 hover:bg-djzinc-750 border border-djcyan-500/40 text-djcyan-400 px-3.5 py-2 rounded-md font-bold text-xs flex items-center gap-1.5 cursor-pointer">
                            <Icons.Sliders /> Configurar Lote (Batch)
                        </button>
                        <button onClick={() => handleAuditar()} disabled={isAuditing} className="bg-djzinc-800 hover:bg-djzinc-700 text-white px-4 py-2 rounded-md font-semibold text-xs border border-djzinc-600 flex items-center gap-1.5 cursor-pointer">
                            <Icons.Library /> {isAuditing ? 'Auditando...' : 'Auditar Directorio'}
                        </button>
                        <button onClick={handleExportarXLS} className="bg-djzinc-800 hover:bg-djzinc-700 text-djgreen-400 border border-djgreen-700/60 px-3.5 py-2 rounded-md font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow" title="Exportar reporte de auditoría a Excel (.xlsx / .csv)">
                            <Icons.Excel /> Exportar XLS
                        </button>
                        <button onClick={handleGuardarTrack} className="bg-djcyan-600 hover:bg-djcyan-500 text-black px-4 py-2 rounded-md font-bold text-xs shadow-md cursor-pointer">
                            Inyectar a Serato
                        </button>
                    </div>
                </div>

                {isAuditing && (
                    <div className="bg-djzinc-900 border-b border-djzinc-800 px-4 py-2 flex flex-col gap-1.5 shrink-0">
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-djcyan-400 font-semibold truncate">{batchStatusMsg}</span>
                            <span className="text-gray-300 font-bold">{batchProgress}%</span>
                        </div>
                        <div className="w-full bg-djzinc-950 h-1.5 rounded-full overflow-hidden border border-djzinc-800">
                            <div className="bg-djcyan-500 h-full transition-all duration-200" style={{ width: `${batchProgress}%` }}></div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-4 gap-px bg-djzinc-800 border-b border-djzinc-800 shrink-0">
                    <div className="bg-djzinc-950 p-4 flex flex-col justify-center"><span className="text-[10px] text-gray-500 font-bold uppercase mb-1">Total Pistas</span><span className="text-2xl font-mono text-white">{(metrics.total || 0).toLocaleString()}</span></div>
                    <div className="bg-djzinc-950 p-4 flex flex-col justify-center"><span className="text-[10px] text-gray-500 font-bold uppercase mb-1">Falta Metadata (BPM/Key)</span><span className="text-2xl font-mono text-amber-500">{(metrics.missing || 0).toLocaleString()}</span></div>
                    <div className="bg-djzinc-950 p-4 flex flex-col justify-center"><span className="text-[10px] text-gray-500 font-bold uppercase mb-1">Listas para Inyectar</span><span className="text-2xl font-mono text-djgreen-400">{(metrics.ready || 0).toLocaleString()}</span></div>
                    <div className="bg-djzinc-950 p-4 flex items-center justify-between"><div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold uppercase mb-1">Motor Lossless</span><span className="text-sm font-medium text-djcyan-400">Activo (FFT / Mutagen)</span></div><div className="w-10 h-5 bg-djcyan-600 rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5"></div></div></div>
                </div>

                <div className="px-4 py-2 bg-djzinc-900 border-b border-djzinc-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 flex-1">
                        <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por track, artista o clave..." className="w-64 bg-djzinc-950 border border-djzinc-700 rounded-full px-4 py-1.5 text-xs text-gray-300 focus:border-djcyan-500 outline-none" />
                        <div className="flex gap-2 ml-2">
                            <button onClick={() => setFiltro('todos')} className={`px-3 py-1 rounded-full text-[10px] font-medium cursor-pointer ${filtro === 'todos' ? 'bg-djcyan-600 text-white' : 'bg-djzinc-800 text-gray-300'}`}>Todos ({metrics.total})</button>
                            <button onClick={() => setFiltro('missing')} className={`px-3 py-1 rounded-full text-[10px] font-medium cursor-pointer ${filtro === 'missing' ? 'bg-amber-600 text-white' : 'bg-amber-900/30 text-amber-500'}`}>Falta Metadata ({metrics.missing})</button>
                            <button onClick={() => setFiltro('error')} className={`px-3 py-1 rounded-full text-[10px] font-medium cursor-pointer ${filtro === 'error' ? 'bg-red-600 text-white' : 'bg-red-900/30 text-red-400'}`}>Errores ({metrics.errors})</button>
                        </div>
                    </div>
                    {saveFeedback && <span className="text-xs font-mono text-djgreen-400 font-bold animate-pulse">{saveFeedback}</span>}
                </div>

                <div className="flex-1 overflow-auto bg-[#0f0f13]">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                        <thead className="sticky top-0 z-10 bg-djzinc-900/95 border-b border-djzinc-800 text-[11px] font-mono uppercase text-djzinc-400">
                            <tr>
                                <th className="py-2.5 px-2 w-7 text-center">#</th>
                                <th className="py-2.5 px-2 w-28 text-center text-djcyan-400">Waveform</th>
                                <th className="py-2.5 px-3 min-w-[240px]">Archivo / Título</th>
                                <th className="py-2.5 px-2 w-28">Artista</th>
                                <th className="py-2.5 px-1.5 text-center">Time</th>
                                <th className="py-2.5 px-1.5 text-center">BPM</th>
                                <th className="py-2.5 px-1.5 text-center">Key</th>
                                <th className="py-2.5 px-1.5 text-center">Cert. FFT</th>
                                <th className="py-2.5 px-1.5 text-center">Auto-Trim</th>
                                <th className="py-2.5 px-1.5 text-center">Beat 1.0.0</th>
                                <th className="py-2.5 px-1.5 text-center">8 Hot Cues</th>
                                <th className="py-2.5 px-1.5 text-center">Energía</th>
                                <th className="py-2.5 px-1.5 text-center">Dance</th>
                                <th className="py-2.5 px-2 text-center">Atmósfera</th>
                                <th className="py-2.5 px-3 min-w-[180px]">Comentario Táctico DJ</th>
                                <th className="py-2.5 px-2 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-djzinc-850/60 font-sans">
                            {tracksFiltrados.length === 0 && !isAuditing && (
                                <tr>
                                    <td colSpan="16" className="py-12 text-center text-gray-500 font-mono text-xs">
                                        No hay pistas cargadas en esta vista. Selecciona una carpeta y pulsa "Auditar Directorio".
                                    </td>
                                </tr>
                            )}
                            {tracksFiltrados.map((row) => {
                                const isRowPlaying = nowPlayingTrack && String(nowPlayingTrack.id) === String(row.id) && isPlaying;
                                const coverUrl = getValidCover(row.cover || (row.path ? `/cover?path=${encodeURIComponent(row.path)}` : (row.f ? `/cover?path=${encodeURIComponent(row.f)}` : null)));
                                return (
                                    <tr key={row.id} onClick={() => { setSelectedTrack(row.id); if (onPlayTrack) onPlayTrack(row, 0, false); }} className={`cursor-pointer select-none transition-colors ${selectedTrack === row.id ? 'bg-djcyan-950/40 border-l-2 border-djcyan-400' : 'hover:bg-djzinc-850/40'}`}>
                                        <td className="py-2 px-2 text-center text-djzinc-500 font-mono">{row.id}</td>
                                        <td className="py-2 px-2 text-center">
                                            <TableHarmonicWaveform 
                                                track={row} 
                                                duration={row.duration || '05:00'} 
                                                onPlayTrack={onPlayTrack} 
                                                onTogglePlay={onTogglePlay} 
                                                isCurrentPlaying={isRowPlaying} 
                                                playProgress={isRowPlaying ? playProgress : 0} 
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <div className="flex items-center gap-3">
                                                <img 
                                                    src={coverUrl} 
                                                    className="w-9 h-9 rounded bg-djzinc-800 object-cover shrink-0 border border-djzinc-700 shadow-sm" 
                                                    alt="cover" 
                                                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }} 
                                                />
                                                <div className="flex flex-col min-w-0 text-left">
                                                    <span className="font-semibold text-djcyan-400 text-xs truncate max-w-[210px]" title={row.t || row.title || row.f}>
                                                        {row.t || row.title || row.f || 'Desconocido'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-mono truncate max-w-[210px]" title={row.f}>
                                                        {row.f || ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-300 truncate max-w-[120px]" title={row.a || row.artist}>{row.a || row.artist}</td>
                                        <td className="py-2 px-1.5 text-center text-gray-400 font-mono">{row.duration}</td>
                                        <td className="py-2 px-1.5 text-center"><span className="bg-djzinc-850 text-gray-200 px-1.5 py-0.5 rounded font-mono border border-djzinc-750">{row.b}</span></td>
                                        <td className="py-2 px-1.5 text-center"><span className="px-1.5 py-0.5 rounded font-mono font-bold bg-djcyan-950 text-djcyan-400 border border-djcyan-800/50">{row.k}</span></td>
                                        <td className="py-2 px-1.5 text-center"><span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${String(row.status).includes('Fake') ? 'bg-red-950/80 text-red-400 border-red-800' : 'bg-djgreen-950/80 text-djgreen-400 border-djgreen-800'}`}>{row.cutoff_khz ? `${row.cutoff_khz}kHz` : 'PASS'}</span></td>
                                        <td className="py-2 px-1.5 text-center font-mono text-[10px] text-amber-300">{row.trim_start_ms > 0 ? `-${row.trim_start_ms}ms` : '0ms'}</td>
                                        <td className="py-2 px-1.5 text-center font-mono text-[10px] text-blue-300">{row.first_downbeat_ms ? `${row.first_downbeat_ms}ms` : '0ms'}</td>
                                        <td className="py-2 px-1.5 text-center font-mono text-[10px] text-amber-400">8 NV2</td>
                                        <td className="py-2 px-1.5 text-center font-mono text-[10px] text-pink-300 font-bold">{row.e || 80}%</td>
                                        <td className="py-2 px-1.5 text-center font-mono text-[10px] text-indigo-300 font-bold">{row.dance || 85}%</td>
                                        <td className="py-2 px-2 text-center text-[9px] font-mono text-emerald-300">{row.mood || 'Peak Time'}</td>
                                        <td className="py-2 px-3 text-[10px] font-mono text-gray-300 truncate max-w-[200px]" title={row.comment}>💬 {row.comment}</td>
                                        <td className="py-2 px-2 text-center"><span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-djzinc-850 text-djgreen-400 border border-djzinc-750">{row.status}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <aside key={currentTrack ? currentTrack.id : "none"} className="w-96 bg-djzinc-900 border-l border-djzinc-800 flex flex-col shrink-0 slide-in-right z-20 overflow-hidden shadow-2xl">
                <div className="p-3 border-b border-djzinc-800 bg-djzinc-950 flex justify-between items-center">
                    <div className="flex items-center gap-2"><Icons.Gear /><span className="font-bold text-xs uppercase tracking-wider text-gray-200">Inspector DJ Granular</span></div>
                    <span className="text-[10px] font-mono bg-djzinc-800 text-gray-400 px-2 py-0.5 rounded">Track #{currentTrack.id || '--'}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Carátula Replicada en el Inspector */}
                    <div className="w-full aspect-video bg-djzinc-950 rounded-lg border border-djzinc-800 relative group overflow-hidden flex items-center justify-center shadow-inner">
                        <img 
                            src={getValidCover(currentTrack.cover || (currentTrack.path ? `/cover?path=${encodeURIComponent(currentTrack.path)}` : (currentTrack.f ? `/cover?path=${encodeURIComponent(currentTrack.f)}` : null)))} 
                            alt="Cover Art" 
                            onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }}
                            className="w-full h-full object-cover" 
                        />
                        <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-gray-300 font-mono backdrop-blur border border-djzinc-700">
                            ID3v2.4
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <h4 className="font-bold text-sm text-djcyan-400 truncate" title={currentTrack.t || currentTrack.title}>{currentTrack.t || currentTrack.title || 'Selecciona un track'}</h4>
                            <p className="text-xs text-gray-400 truncate" title={currentTrack.a || currentTrack.artist}>{currentTrack.a || currentTrack.artist || '--'}</p>
                        </div>
                        <button 
                            onClick={() => {
                                if (nowPlayingTrack && (String(nowPlayingTrack.id) === String(currentTrack.id) || nowPlayingTrack.path === currentTrack.path || nowPlayingTrack.f === currentTrack.f)) {
                                    onTogglePlay && onTogglePlay();
                                } else {
                                    onPlayTrack && onPlayTrack(currentTrack, 0, true);
                                }
                            }} 
                            className="px-2.5 py-1 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-bold text-[10px] rounded shadow cursor-pointer shrink-0 transition-colors"
                        >
                            {nowPlayingTrack && (String(nowPlayingTrack.id) === String(currentTrack.id) || nowPlayingTrack.path === currentTrack.path || nowPlayingTrack.f === currentTrack.f) && isPlaying ? '❚❚ PAUSE' : '▶ PLAY'}
                        </button>
                    </div>

                    <RekordboxWaveform track={currentTrack} duration={currentTrack.duration || "05:00"} onSeekTrack={onPlayTrack} />

                    <div className="bg-djzinc-950 p-3 rounded-lg border border-djzinc-800 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-semibold flex items-center">
                                Certificación FFT
                                <InfoTip title="Análisis FFT de Pérdida" text="Comprueba si el espectro rebasa los 20kHz reales o si es un MP3 inflado artificialmente a FLAC." />
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${String(currentTrack.status || '').includes('Fake') ? 'bg-red-950 text-red-400 border-red-800' : 'bg-djgreen-950 text-djgreen-400 border-djgreen-800'}`}>
                                    {currentTrack.cutoff_khz ? `${currentTrack.cutoff_khz} kHz` : 'PASS 22.05kHz'}
                                </span>
                                <button 
                                    onClick={() => handleAbrirFftModal(currentTrack)} 
                                    className="px-2 py-0.5 bg-djzinc-800 hover:bg-djzinc-700 text-djcyan-400 text-[10px] font-mono font-bold rounded border border-djzinc-650 cursor-pointer transition-colors"
                                    title="Abrir análisis espectral FFT en detalle"
                                >
                                    VER FFT
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-djzinc-850">
                            <span className="text-xs text-gray-400 flex items-center">
                                Trim Silencio (Zero-Cross)
                                <InfoTip title="Recorte de Silencio" text="Elimina el silencio muerto en cabecera y cola cortando en paso por cero de amplitud (-60dBfs)." />
                            </span>
                            <button onClick={() => updateCurrentTrackField('trim_start_ms', 0)} className="text-[10px] font-bold bg-djzinc-800 text-gray-200 px-2 py-1 rounded border border-djzinc-700">{`Auto-Trim (-${currentTrack.trim_start_ms || 0}ms)`}</button>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-djzinc-850">
                            <span className="text-xs text-gray-400 flex items-center">
                                Alinear Beatgrid 1.0.0
                                <InfoTip title="Beatgrid Downbeat" text="Fija el primer golpe de bombo real para que el sincro de Serato nunca quede a contratiempo." />
                            </span>
                            <button onClick={() => updateCurrentTrackField('first_downbeat_ms', 0)} className="text-[10px] font-bold bg-djcyan-950 text-djcyan-400 px-2 py-1 rounded border border-djcyan-800/60">{`Anclar Beat 1 (${currentTrack.first_downbeat_ms || 0}ms)`}</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-djzinc-950 p-2.5 rounded border border-djzinc-800">
                            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                                <span>BPM Decimal</span>
                                <InfoTip title="BPM Exacto" text="Tempo con precisión de dos decimales para evitar desfases tras varias frases de mezcla." />
                            </div>
                            <div className="flex items-center gap-1">
                                <input type="text" value={currentTrack.b || ''} onChange={(e) => updateCurrentTrackField('b', e.target.value)} className="w-full bg-djzinc-900 border border-djzinc-700 rounded px-2 py-1 text-xs font-mono font-bold text-white outline-none" />
                                <button onClick={() => { const v = parseFloat(currentTrack.b); if (!isNaN(v)) updateCurrentTrackField('b', (v / 2).toFixed(2)); }} className="px-1.5 py-1 text-[9px] font-mono bg-djzinc-800 rounded border border-djzinc-700 cursor-pointer">/2</button>
                                <button onClick={() => { const v = parseFloat(currentTrack.b); if (!isNaN(v)) updateCurrentTrackField('b', (v * 2).toFixed(2)); }} className="px-1.5 py-1 text-[9px] font-mono bg-djzinc-800 rounded border border-djzinc-700 cursor-pointer">x2</button>
                            </div>
                        </div>
                        <div className="bg-djzinc-950 p-2.5 rounded border border-djzinc-800">
                            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                                <span>Key (Camelot)</span>
                                <InfoTip title="Tono Armónico" text="Notación de la rueda Camelot para mezcla armónica compatible (+1/-1, mismo número A/B)." />
                            </div>
                            <select value={currentTrack.k || '8A'} onChange={(e) => updateCurrentTrackField('k', e.target.value)} className="w-full bg-djzinc-900 border border-djzinc-700 rounded px-2 py-1 text-xs font-mono font-bold text-djcyan-400 outline-none cursor-pointer">
                                {['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B','7A','7B','8A','8B','9A','9B','10A','10B','11A','11B','12A','12B'].map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="bg-djzinc-950 p-3 rounded border border-djzinc-800 space-y-3">
                        <div>
                            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                                <span>Energy Level ({currentTrack.e || 80}%)</span>
                                <InfoTip title="Nivel de Energía" text="Calculado según la pegada de graves y densidad espectral RMS (1-100). Indica la potencia en la pista." />
                            </div>
                            <input type="range" min="1" max="100" value={currentTrack.e || 80} onChange={(e) => updateCurrentTrackField('e', Number(e.target.value))} className="w-full accent-djgreen-500 h-1.5 bg-djzinc-800 rounded-lg cursor-pointer" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                                <span>Danceability ({currentTrack.dance || 85}%)</span>
                                <InfoTip title="Danceability" text="Mide la regularidad del ritmo y solidez del beat. Cuanto más alto, más fácil es bailar y mezclar en compás." />
                            </div>
                            <input type="range" min="1" max="100" value={currentTrack.dance || 85} onChange={(e) => updateCurrentTrackField('dance', Number(e.target.value))} className="w-full accent-djcyan-500 h-1.5 bg-djzinc-800 rounded-lg cursor-pointer" />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase mb-1">
                            <span>8 Hot Cues (Pads Numark NV2)</span>
                            <InfoTip title="Pads Numark NV2" text="Mapeo exacto de los 8 pads RGB de la controladora Numark NV2 con los 8 puntos estructurales estándar de sesión." />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            {NV2_COLORS.map((c, idx) => (
                                <div key={c.id} onClick={() => onPlayTrack && onPlayTrack(currentTrack, (idx * 0.12) + 0.02, true)} className={`p-2 rounded border flex flex-col justify-between cursor-pointer ${c.bg} ${c.border}`}>
                                    <div className="flex justify-between items-center"><span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded text-black" style={{ backgroundColor: c.color }}>Pad {c.id}</span><span className="text-[9px] font-mono text-gray-400">{c.time}</span></div>
                                    <span className={`text-[11px] font-semibold truncate mt-1 ${c.text}`}>{c.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase mb-1">
                            <span>Comentario Táctico DJ</span>
                            <InfoTip title="Comentario de Mezcla" text="Texto estratégico inyectado en el tag ID3 COMM visible en las pantallas de la mesa para recordar qué hacer con la pista." />
                        </div>
                        <textarea value={currentTrack.comment || ""} onChange={(e) => updateCurrentTrackField('comment', e.target.value)} rows="2" className="w-full bg-djzinc-950 border border-djzinc-700 rounded p-2 text-xs text-gray-200 outline-none font-mono resize-none"></textarea>
                    </div>
                </div>
                <div className="p-3 bg-djzinc-950 border-t border-djzinc-800">
                    <button onClick={handleGuardarTrack} className="w-full py-2 bg-djcyan-600 hover:bg-djcyan-500 text-black rounded font-bold text-xs shadow-md cursor-pointer transition-colors">
                        Aplicar Cambios a este Track
                    </button>
                </div>
            </aside>

            <BatchAuditorModal isOpen={batchModalOpen} onClose={() => setBatchModalOpen(false)} onRunBatch={async (opts) => {
                setBatchModalOpen(false);
                setIsAuditing(true);
                try {
                    if (window.eel && window.eel.ejecutar_auditoria_lote) {
                        const res = await window.eel.ejecutar_auditoria_lote(rutaOrigen, opts)();
                        if (res && res.tracks) {
                            setTracks(res.tracks);
                            setMetrics({ total: res.total, missing: res.sin_meta, ready: res.ready, errors: res.errors || 0 });
                        }
                    }
                } finally {
                    setIsAuditing(false);
                }
            }} />

            {/* Modal Espectral FFT Profesional */}
            {fftModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#0b0b10] border border-djzinc-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-4 border-b border-djzinc-800 bg-djzinc-950 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-djcyan-400 animate-pulse"></span>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                                        Análisis de Espectro FFT • Certificación Lossless
                                    </h3>
                                    <p className="text-[11px] text-gray-400 truncate max-w-md">
                                        {currentTrack.t || currentTrack.title || currentTrack.f}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setFftModalOpen(false)} 
                                className="w-7 h-7 rounded-full bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 flex items-center justify-center font-bold text-xs cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-5 space-y-4 font-sans">
                            {isAnalyzingFft ? (
                                <div className="py-16 flex flex-col items-center justify-center space-y-3">
                                    <div className="w-8 h-8 border-2 border-djcyan-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs font-mono text-gray-400">Calculando transformada rápida de Fourier (FFT 4096 / Blackman-Harris)...</span>
                                </div>
                            ) : fftAnalysisData ? (
                                <>
                                    {/* Métricas clave */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-djzinc-950 p-3 rounded-lg border border-djzinc-800">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Diagnóstico</span>
                                            <span className={`text-base font-mono font-bold ${fftAnalysisData.estado === 'True Lossless' ? 'text-djgreen-400' : 'text-red-400'}`}>
                                                {fftAnalysisData.estado}
                                            </span>
                                        </div>
                                        <div className="bg-djzinc-950 p-3 rounded-lg border border-djzinc-800">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Frecuencia de Corte</span>
                                            <span className="text-base font-mono font-bold text-djcyan-400">
                                                {fftAnalysisData.corte || `${fftAnalysisData.cutoff_khz} kHz`}
                                            </span>
                                        </div>
                                        <div className="bg-djzinc-950 p-3 rounded-lg border border-djzinc-800">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Pérdida Espectral</span>
                                            <span className="text-base font-mono font-bold text-amber-400">
                                                {fftAnalysisData.perdida || 0}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Gráfica de barras de espectro FFT */}
                                    <div className="bg-djzinc-950 p-4 rounded-lg border border-djzinc-800 flex flex-col space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                                            <span>20 Hz</span>
                                            <span>1 kHz</span>
                                            <span>5 kHz</span>
                                            <span>10 kHz</span>
                                            <span>16 kHz</span>
                                            <span className="text-amber-400 font-bold">20 kHz (Corte MP3)</span>
                                            <span className="text-djcyan-400 font-bold">22.05 kHz (Nyquist FLAC)</span>
                                        </div>
                                        <div className="h-32 w-full bg-[#050508] rounded border border-djzinc-850 flex items-end gap-1 p-2 relative overflow-hidden">
                                            {/* Línea guía 20kHz */}
                                            <div className="absolute top-0 bottom-0 right-[9%] w-0.5 bg-amber-500/50 border-r border-dashed border-amber-400/80 pointer-events-none z-10"></div>
                                            {(fftAnalysisData.spectrum && fftAnalysisData.spectrum.length > 0 ? fftAnalysisData.spectrum : Array.from({ length: 64 }, (_, i) => Math.max(0.05, Math.sin(i / 10) * 0.8))).map((bar, i) => {
                                                const heightPct = Math.max(4, Math.round(bar * 100));
                                                const isHighFreq = i >= 50;
                                                return (
                                                    <div 
                                                        key={i} 
                                                        className="flex-1 rounded-t-sm transition-all duration-300"
                                                        style={{
                                                            height: `${heightPct}%`,
                                                            backgroundColor: isHighFreq 
                                                                ? (fftAnalysisData.cutoff_khz >= 20.0 ? '#06b6d4' : '#ef4444')
                                                                : (i < 15 ? '#3b82f6' : '#f59e0b')
                                                        }}
                                                        title={`Banda #${i + 1}: ${Math.round((i / 64) * 24)} kHz (${heightPct}%)`}
                                                    ></div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex justify-between text-[10px] font-mono text-gray-500">
                                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-blue-500"></span> Graves</span>
                                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-500"></span> Medios</span>
                                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-djcyan-500"></span> Agudos / Aire FLAC</span>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-djzinc-900/60 rounded border border-djzinc-800 text-xs text-gray-300 leading-relaxed font-sans">
                                        <p>
                                            {fftAnalysisData.cutoff_khz >= 20.0 
                                                ? "✅ El archivo contiene armónicos reales y energía sostenida por encima de los 20 kHz. Se certifica como audio auténticamente Lossless (no re-codificado desde MP3 a 320kbps)."
                                                : "⚠️ Se detecta una caída vertical de energía en el corte de alta frecuencia típico de transcodificaciones con pérdida (MP3/AAC inflado a WAV/FLAC)."}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="py-12 text-center text-gray-500 text-xs font-mono">
                                    No se pudo obtener el espectro para este archivo.
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-djzinc-950 border-t border-djzinc-800 flex justify-end gap-2">
                            <button 
                                onClick={() => handleAbrirFftModal(currentTrack)} 
                                className="px-4 py-1.5 bg-djzinc-800 hover:bg-djzinc-700 text-gray-200 rounded font-mono font-semibold text-xs border border-djzinc-700 cursor-pointer transition-colors"
                            >
                                Re-analizar
                            </button>
                            <button 
                                onClick={() => setFftModalOpen(false)} 
                                className="px-4 py-1.5 bg-djcyan-600 hover:bg-djcyan-500 text-black rounded font-mono font-bold text-xs cursor-pointer transition-colors shadow"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Espacio de Trabajo: Spotify Ingest
const SpotifyWorkspace = ({ onPlayTrack, nowPlayingTrack, isPlaying, onTogglePlay }) => {
    const [spotifyUrl, setSpotifyUrl] = useState('https://open.spotify.com/intl-es/artist/23zJj2W0TQ0SvF4Fwo7mZK');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [destDir, setDestDir] = useState('/Users/admin/Music/mi musica');
    const [selectedFormat, setSelectedFormat] = useState('flac');
    const [downloadingMsg, setDownloadingMsg] = useState('');
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [selectedId, setSelectedId] = useState("10");

    const [tracks, setTracks] = useState([]);

    useEffect(() => {
        if (window.eel && typeof window.eel.expose === 'function') {
            const updateDownload = (pct, msg) => {
                setDownloadProgress(pct);
                setDownloadingMsg(msg || '');
                setIsDownloading(true);
            };
            const finishBatch = (msg) => {
                setIsDownloading(false);
                setDownloadProgress(100);
                setDownloadingMsg(msg || 'Lote completado con éxito.');
                setTimeout(() => setDownloadProgress(0), 4000);
            };

            window.actualizar_estado_descarga = updateDownload;
            window.actualizar_progreso_descarga = updateDownload;
            window.notificar_fin_lote = finishBatch;

            window.eel.expose(window.actualizar_estado_descarga, "actualizar_estado_descarga");
            window.eel.expose(window.actualizar_progreso_descarga, "actualizar_progreso_descarga");
            window.eel.expose(window.notificar_fin_lote, "notificar_fin_lote");
        }
        handleAnalizar();
    }, []);

    const currentTrack = tracks.find(t => t.id === selectedId) || tracks[0] || {};
    const selectedCount = tracks.filter(t => t.selected).length;
    const allSelected = tracks.length > 0 && selectedCount === tracks.length;

    const handleToggleSelectAll = () => {
        const targetState = !allSelected;
        setTracks(prev => prev.map(t => ({ ...t, selected: targetState })));
    };

    const handleToggleRow = (id) => {
        setSelectedId(id);
        setTracks(prev => prev.map(t => t.id === id ? ({ ...t, selected: !t.selected }) : t));
    };

    const handlePlayPreview = async (track, e) => {
        if (e) e.stopPropagation();
        setSelectedId(track.id);

        if (nowPlayingTrack && String(nowPlayingTrack.id) === String(track.id)) {
            if (onTogglePlay) {
                onTogglePlay();
                return;
            }
        }

        let streamUrl = track.preview_url;
        let coverHd = track.cover;
        if (!streamUrl && window.eel && window.eel.resolver_stream_preescucha) {
            try {
                setDownloadingMsg(`[PRE-ESCUCHA] Resolviendo stream para: ${track.artist} - ${track.title}...`);
                const res = await window.eel.resolver_stream_preescucha(track.title, track.artist)();
                if (res && res.stream_url) {
                    streamUrl = res.stream_url;
                    if (res.cover) coverHd = res.cover;
                }
            } catch (err) {}
        }
        if (onPlayTrack) {
            onPlayTrack({ 
                id: track.id, 
                t: track.title, 
                title: track.title, 
                a: track.artist, 
                artist: track.artist, 
                album: track.album, 
                b: track.bpm, 
                k: track.key, 
                duration: track.duration, 
                cover: coverHd, 
                path: streamUrl || "" 
            }, 0, true);
        }
    };

    const handleAnalizar = async () => {
        if (!spotifyUrl || isAnalyzing) return;
        setIsAnalyzing(true);
        setDownloadingMsg("[ANALIZANDO] Consultando catálogo Spotify...");
        try {
            if (window.eel && window.eel.analizar_catalogo_spotify) {
                const res = await window.eel.analizar_catalogo_spotify(spotifyUrl)();
                if (res && res.tracks && res.tracks.length > 0) {
                    const mapped = res.tracks.map((t, i) => ({ ...t, selected: i === 0 }));
                    setTracks(mapped);
                    setSelectedId(mapped[0].id);
                    setDownloadingMsg(`[LISTO] ${mapped.length} pistas cargadas.`);
                } else {
                    setDownloadingMsg("[AVISO] No se encontraron pistas para este enlace.");
                }
            }
        } catch (e) {
            setDownloadingMsg(`[ERROR] Fallo al analizar catálogo: ${e}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const lanzarDescargaReal = async (listaPistas) => {
        if (!listaPistas || listaPistas.length === 0) return;
        setIsDownloading(true);
        setDownloadProgress(8);
        setDownloadingMsg(`[DESCARGANDO] Iniciando lote de ${listaPistas.length} pista(s) en .${selectedFormat.toUpperCase()}...`);
        if (window.eel && window.eel.descargar_pistas_spotify_seleccionadas) {
            try {
                await window.eel.descargar_pistas_spotify_seleccionadas(listaPistas, selectedFormat, destDir)();
            } catch (e) {
                setIsDownloading(false);
            }
        }
    };

    const handleCambiarCarpeta = async () => {
        if (window.eel && window.eel.seleccionar_directorio_descarga) {
            const res = await window.eel.seleccionar_directorio_descarga()();
            if (res && res.status === 'ok' && res.path) {
                setDestDir(res.path);
            }
        }
    };

    return (
        <div className="flex w-full h-full bg-[#09090c] text-gray-300 font-sans select-none overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="p-3.5 border-b border-djzinc-800 bg-[#0c0c10] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 flex-1 max-w-xl">
                        <div className="flex-1 bg-[#060609] border border-djzinc-750 rounded flex items-center overflow-hidden">
                            <span className="px-2.5 py-1.5 text-[11px] font-mono text-djcyan-400 bg-[#0e0e13] border-r border-djzinc-800 font-semibold">SPOTIFY</span>
                            <input type="text" value={spotifyUrl} onChange={(e) => setSpotifyUrl(e.target.value)} className="bg-transparent px-3 py-1.5 text-xs text-white outline-none flex-1 font-mono" />
                        </div>
                        <button onClick={handleAnalizar} disabled={isAnalyzing} className="px-4 py-1.5 bg-[#14141a] hover:bg-[#1c1c24] border border-djzinc-700 text-white rounded text-xs font-bold cursor-pointer transition-colors">
                            {isAnalyzing ? 'Analizando...' : 'Analizar Enlace'}
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                            <span>Destino:</span>
                            <span className="text-gray-200 truncate max-w-[140px]" title={destDir}>{destDir.split('/').pop() || destDir}</span>
                            <button onClick={handleCambiarCarpeta} className="text-djcyan-400 hover:text-white px-2 py-1 bg-djzinc-900 border border-djzinc-700 rounded text-[11px] cursor-pointer">Cambiar</button>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#060609] border border-djzinc-750 rounded p-1">
                            {['flac', 'mp3', 'wav'].map(f => (
                                <button key={f} onClick={() => setSelectedFormat(f)} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors ${selectedFormat === f ? 'bg-djcyan-500 text-black' : 'text-gray-400 hover:text-white'}`}>{f}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Franja de Estado y Barra de Progreso Dinámica */}
                <div className="px-4 py-2 bg-[#09090c] border-b border-djzinc-850 flex flex-col gap-1.5 shrink-0">
                    <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-djcyan-400 font-semibold flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full bg-djcyan-400 animate-pulse"></span>
                            <span>{downloadingMsg || `[LISTO] Introduce un enlace de Spotify o pulsa Analizar Enlace.`}</span>
                        </span>
                        <div className="flex items-center gap-3">
                            {isDownloading && downloadProgress > 0 && (
                                <span className="text-djcyan-300 font-mono font-bold text-xs">{downloadProgress}%</span>
                            )}
                            <span className="text-gray-500 text-[11px] font-bold">{tracks.length} Pistas detectadas</span>
                        </div>
                    </div>
                    {downloadProgress > 0 && (
                        <div className="w-full bg-[#121217] h-2 rounded-full overflow-hidden border border-djzinc-800 shadow-inner">
                            <div 
                                className="bg-gradient-to-r from-djcyan-500 to-djgreen-400 h-full transition-all duration-300 ease-out shadow-lg shadow-djcyan-500/50" 
                                style={{ width: `${downloadProgress}%` }}
                            ></div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-auto bg-[#08080b]">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                        <thead className="sticky top-0 z-10 bg-[#0d0d12] border-b border-djzinc-800 text-[10px] font-mono uppercase text-gray-400">
                            <tr>
                                <th className="py-2.5 px-3 w-8 text-center"><input type="checkbox" checked={allSelected} onChange={handleToggleSelectAll} className="accent-djcyan-500 cursor-pointer" /></th>
                                <th className="py-2.5 px-2 w-10 text-center">PLAY</th>
                                <th className="py-2.5 px-3 min-w-[280px]">TÍTULO / ÁLBUM</th>
                                <th className="py-2.5 px-3 min-w-[180px]">ARTISTA</th>
                                <th className="py-2.5 px-3 text-center w-20">DURACIÓN</th>
                                <th className="py-2.5 px-3 text-center w-20">BPM EST.</th>
                                <th className="py-2.5 px-3 text-center w-20">KEY EST.</th>
                                <th className="py-2.5 px-4 text-center w-28">ACCIÓN</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-djzinc-850/60 font-sans">
                            {tracks.length === 0 && !isAnalyzing && (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-gray-500 font-mono text-xs">
                                        Pega una URL de Spotify arriba y haz clic en "Analizar Enlace".
                                    </td>
                                </tr>
                            )}
                            {tracks.map((row) => {
                                const isSelectedRow = row.id === selectedId;
                                const isRowPlaying = nowPlayingTrack && String(nowPlayingTrack.id) === String(row.id) && isPlaying;
                                return (
                                    <tr key={row.id} onClick={() => { setSelectedId(row.id); }} className={`cursor-pointer select-none transition-colors ${isSelectedRow ? 'bg-djcyan-950/35 border-l-2 border-djcyan-400' : 'hover:bg-[#101015]'}`}>
                                        <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={row.selected} onChange={() => handleToggleRow(row.id)} className="accent-djcyan-500 cursor-pointer" /></td>
                                        <td className="py-2 px-2 text-center" onClick={(e) => handlePlayPreview(row, e)}>
                                            <button className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isRowPlaying ? 'bg-djcyan-500 text-black font-bold shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-[#181820] text-gray-400 hover:text-white hover:bg-djzinc-800'}`}>
                                                {isRowPlaying ? '❚❚' : '▶'}
                                            </button>
                                        </td>
                                        <td className="py-2 px-3">
                                            <div className="flex items-center gap-3">
                                                <img src={getValidCover(row.cover)} alt="Cover" onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }} className="w-9 h-9 rounded object-cover border border-djzinc-700 shrink-0 shadow-sm" />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-semibold text-djcyan-400 text-xs truncate max-w-sm" title={row.title}>{row.title}</span>
                                                    <span className="text-[10px] text-gray-500 font-mono truncate max-w-sm" title={row.album}>{row.album}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 text-gray-300 text-xs truncate max-w-xs">{row.artist}</td>
                                        <td className="py-2 px-3 text-center font-mono text-gray-400 text-xs">{row.duration}</td>
                                        <td className="py-2 px-3 text-center"><span className="bg-[#14141c] text-gray-200 px-2 py-0.5 rounded text-[11px] font-mono border border-djzinc-800">{row.bpm}</span></td>
                                        <td className="py-2 px-3 text-center"><span className="text-djcyan-400 font-mono font-bold text-xs">{row.key}</span></td>
                                        <td className="py-2 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => lanzarDescargaReal([row])} className="px-3 py-1 bg-[#14141c] hover:bg-djcyan-600 hover:text-black text-gray-300 rounded text-[11px] font-mono font-semibold border border-djzinc-750 cursor-pointer transition-colors">Descargar .{selectedFormat}</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <aside key={currentTrack ? currentTrack.id : "sp_none"} className="w-96 bg-djzinc-900 border-l border-djzinc-800 flex flex-col shrink-0 slide-in-right z-20 overflow-hidden shadow-2xl">
                <div className="p-3 border-b border-djzinc-800 bg-djzinc-950 flex justify-between items-center">
                    <div className="flex items-center gap-2"><Icons.Spotify /><span className="font-bold text-xs uppercase tracking-wider text-djcyan-400">Spotify Ingest Inspector</span></div>
                    <span className="text-[10px] font-mono bg-djzinc-800 text-gray-400 px-2 py-0.5 rounded">ID #{currentTrack.id || '--'}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="w-full aspect-video bg-[#050508] rounded-lg border border-djzinc-800 overflow-hidden relative shadow-inner flex items-center justify-center">
                        <img src={getValidCover(currentTrack.cover)} alt="Cover" onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }} className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-gray-300 font-mono border border-djzinc-700">HD Cover 640px</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <h4 className="font-bold text-sm text-djcyan-400 truncate" title={currentTrack.title}>{currentTrack.title || 'Selecciona una pista'}</h4>
                            <p className="text-xs text-gray-400 truncate">{currentTrack.artist || '--'}</p>
                        </div>
                        <button onClick={(e) => handlePlayPreview(currentTrack, e)} className="px-3 py-1 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-bold text-[10px] rounded shadow cursor-pointer shrink-0">
                            {nowPlayingTrack && (String(nowPlayingTrack.id) === String(currentTrack.id) || nowPlayingTrack.title === currentTrack.title) && isPlaying ? '❚❚ PAUSE' : '▶ PRE-ESCUCHA'}
                        </button>
                    </div>

                    {/* Waveform Rekordbox Estructural en Spotify Ingest */}
                    <RekordboxWaveform track={currentTrack} duration={currentTrack.duration || "03:30"} onSeekTrack={(trk, pct) => handlePlayPreview(trk)} />

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-[#050508] p-2.5 rounded border border-djzinc-800">
                            <span className="text-[10px] text-gray-500 block uppercase">Tempo</span>
                            <span className="text-white font-bold">{currentTrack.bpm ? `${currentTrack.bpm} BPM` : '--'}</span>
                        </div>
                        <div className="bg-[#050508] p-2.5 rounded border border-djzinc-800">
                            <span className="text-[10px] text-gray-500 block uppercase">Clave Camelot</span>
                            <span className="text-djcyan-400 font-bold">{currentTrack.key || '--'}</span>
                        </div>
                    </div>

                    <div className="bg-[#050508] p-3 rounded border border-djzinc-800 space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-gray-400">Álbum:</span><span className="text-gray-200 truncate max-w-[200px]">{currentTrack.album || '--'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">ISRC:</span><span className="font-mono text-gray-300">{currentTrack.isrc || 'Auto-Tag'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Formato Destino:</span><span className="font-mono text-djcyan-400 font-bold uppercase">.{selectedFormat} Lossless</span></div>
                    </div>
                </div>
                <div className="p-3 bg-djzinc-950 border-t border-djzinc-800">
                    <button onClick={() => lanzarDescargaReal(selectedCount > 0 ? tracks.filter(t => t.selected) : [currentTrack])} className="w-full py-2 bg-djcyan-600 hover:bg-djcyan-500 text-black rounded font-bold text-xs shadow-md cursor-pointer transition-colors">
                        Descargar {selectedCount > 1 ? `Seleccionadas (${selectedCount})` : 'Pista Actual'} .{selectedFormat.toUpperCase()}
                    </button>
                </div>
            </aside>
        </div>
    );
};

// Espacio de Trabajo: Taxonomía
const TaxonomyWorkspace = () => {
    const [subgenres, setSubgenres] = useState([
        { name: 'Hard Techno', path: '/Users/admin/Music/Serato/Techno/Hard Techno/' },
        { name: 'Melodic Techno', path: '/Users/admin/Music/Serato/Techno/Melodic Techno/' },
        { name: 'Peak Time', path: '/Users/admin/Music/Serato/Techno/Peak Time/' },
        { name: 'Deep House', path: '/Users/admin/Music/Serato/House/Deep House/' },
        { name: 'Tech House', path: '/Users/admin/Music/Serato/House/Tech House/' }
    ]);
    return (
        <div className="flex flex-col h-full p-6 w-full overflow-auto bg-djzinc-950">
            <div className="mb-6 flex justify-between items-end border-b border-djzinc-800 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">Ruteo de Destinos (Taxonomía)</h2>
                    <p className="text-gray-400 text-sm">Define dónde se guardan los archivos físicos basándose en su género principal para Serato Crates.</p>
                </div>
                <button className="bg-djzinc-800 hover:bg-djzinc-700 border border-djzinc-600 text-white px-4 py-2 rounded text-sm font-medium cursor-pointer">
                    Añadir Nueva Regla
                </button>
            </div>
            <div className="bg-djzinc-900 border border-djzinc-700 rounded-xl mb-6 shadow-lg overflow-hidden">
                <div className="p-2 divide-y divide-djzinc-800">
                    {subgenres.map((sub, idx) => (
                        <div key={idx} className="flex gap-4 items-center p-3 hover:bg-djzinc-800/50 rounded-lg transition-colors">
                            <div className="w-40 text-sm font-bold text-gray-300">{sub.name}</div>
                            <input type="text" value={sub.path} readOnly className="flex-1 bg-djzinc-950 border border-djzinc-800 rounded px-3 py-2 text-xs font-mono text-gray-300" />
                            <button className="px-3 py-1.5 bg-djzinc-800 hover:bg-djzinc-700 border border-djzinc-600 rounded text-xs text-gray-300 cursor-pointer">Examinar</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Espacio de Trabajo: Consola de Sistema / Logs
const LogsWorkspace = ({ logs, setLogs }) => (
    <div className="flex flex-col h-full p-6 w-full bg-black font-mono">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
                <Icons.Terminal />
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">System Console</h2>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={() => setLogs([])} className="text-xs text-djcyan-400 hover:text-white transition-colors cursor-pointer">[ Clear ]</button>
                <button className="text-xs text-gray-500 hover:text-white transition-colors cursor-pointer">[ Export .log ]</button>
            </div>
        </div>
        <div className="flex-1 border border-djzinc-800 rounded p-4 text-xs overflow-auto flex flex-col-reverse shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
            <div>
                {logs.map((log, idx) => (
                    <div key={idx} className={`mb-1 ${log.type === 'info' ? 'text-djcyan-500' : log.type === 'success' ? 'text-djgreen-400' : log.type === 'warn' ? 'text-amber-400' : log.type === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
                        {log.text}
                    </div>
                ))}
                <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-4 bg-djcyan-400 animate-pulse"></span>
                </div>
            </div>
        </div>
    </div>
);

// Componente Principal de la Aplicación
const App = () => {
    const [activeTab, setActiveTab] = useState('audit');
    const [selectedTrack, setSelectedTrack] = useState(1);
    const [nowPlayingTrack, setNowPlayingTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playProgress, setPlayProgress] = useState(0);
    const audioRef = useRef(null);
    const [logs, setLogs] = useState([
        { type: 'info', text: "> CleanDJmix PRO v2.0 - Core Engine Initialized" },
        { type: 'divider', text: "--------------------------------------------------" },
        { type: 'success', text: "[ OK ] Audio Engine & Stream Router Online." },
        { type: 'success', text: "[ OK ] Serato Database XML Link Ready." }
    ]);

    useEffect(() => {
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.preload = "auto";

        audio.onended = () => {
            setIsPlaying(false);
            setPlayProgress(0);
        };

        audio.ontimeupdate = () => {
            if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                setPlayProgress(audio.currentTime / audio.duration);
            }
        };

        audioRef.current = audio;

        if (window.eel && typeof window.eel.expose === 'function') {
            window.log_to_console = (msg) => {
                setLogs(prev => [...prev, { type: 'info', text: `[${new Date().toLocaleTimeString()}] ${msg}` }]);
            };
            window.eel.expose(window.log_to_console, "log_to_console");
        }

        return () => {
            audio.pause();
            audio.src = "";
        };
    }, []);

    const handlePlayTrack = (track, seekPct = 0, autoPlay = true) => {
        if (!track) return;
        const resolvedCover = track.cover || (track.path ? `/cover?path=${encodeURIComponent(track.path)}` : (track.f ? `/cover?path=${encodeURIComponent(track.f)}` : null));
        const trackWithCover = { ...track, cover: resolvedCover };
        setNowPlayingTrack(trackWithCover);
        window.__bwCurrentTrack = trackWithCover;

        if (autoPlay) {
            const audio = audioRef.current;
            if (audio) {
                let targetSrc = "";
                if (track.path && (track.path.startsWith("http://") || track.path.startsWith("https://"))) {
                    targetSrc = track.path;
                } else if (track.preview_url && track.preview_url.startsWith("http")) {
                    targetSrc = track.preview_url;
                } else if (track.path) {
                    targetSrc = `/stream_audio?path=${encodeURIComponent(track.path)}`;
                } else if (track.f) {
                    targetSrc = `/stream_audio?path=${encodeURIComponent(track.f)}`;
                }

                if (targetSrc) {
                    if (audio.src !== targetSrc && !audio.src.endsWith(targetSrc)) {
                        audio.src = targetSrc;
                    }
                    audio.play().then(() => {
                        setIsPlaying(true);
                        if (seekPct > 0 && audio.duration && !isNaN(audio.duration)) {
                            audio.currentTime = audio.duration * seekPct;
                            setPlayProgress(seekPct);
                        }
                    }).catch((err) => {
                        console.warn("Audio HTML5 play fallback to afplay:", err);
                        // Fallback a afplay nativo
                        if (track.path || track.f) {
                            if (window.eel && window.eel.reproducir_pista_mac) {
                                window.eel.reproducir_pista_mac(track.path || track.f)();
                                setIsPlaying(true);
                            }
                        }
                    });
                } else if (track.path || track.f) {
                    if (window.eel && window.eel.reproducir_pista_mac) {
                        window.eel.reproducir_pista_mac(track.path || track.f)();
                        setIsPlaying(true);
                    }
                }
            }
        }
    };

    const handleFooterSeek = (pct) => {
        setPlayProgress(pct);
        const audio = audioRef.current;
        if (audio && audio.duration && !isNaN(audio.duration)) {
            audio.currentTime = audio.duration * pct;
            if (!isPlaying) {
                audio.play().then(() => setIsPlaying(true)).catch(() => {});
            }
        }
    };

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (audio && audio.src && audio.src !== window.location.href) {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
                if (window.eel && window.eel.detener_audio_mac) {
                    window.eel.detener_audio_mac()();
                }
            } else {
                audio.play().then(() => setIsPlaying(true)).catch((err) => {
                    console.warn("Play error:", err);
                });
            }
        } else if (nowPlayingTrack && (nowPlayingTrack.path || nowPlayingTrack.f || nowPlayingTrack.preview_url)) {
            handlePlayTrack(nowPlayingTrack, playProgress, true);
        }
    };

    const handleCue = () => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        setIsPlaying(false);
        setPlayProgress(0);
        if (window.eel && window.eel.cue_audio_mac) {
            const trk = window.__bwCurrentTrack || nowPlayingTrack || {};
            window.eel.cue_audio_mac(trk.path || trk.f || "")();
        }
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-djzinc-950 text-gray-300 overflow-hidden font-sans select-none">
            {/* TOP NAVIGATION BAR */}
            <header className="h-14 border-b border-djzinc-800 bg-djzinc-950/90 backdrop-blur px-4 flex items-center justify-between shrink-0 select-none z-30 relative">
                {/* MOTOR DE DISTORSIÓN FRACTAL (5 Iteraciones de 8 Segundos) */}
                <svg width="0" height="0" className="absolute pointer-events-none">
                    <defs>
                        <filter id="waveDistortion" x="-20%" y="-20%" width="140%" height="140%">
                            <feTurbulence type="fractalNoise" baseFrequency="0 0.25" numOctaves="2" result="warp">
                                <animate attributeName="baseFrequency" values="0 0.05; 0 0.45; 0 0.05" dur="0.4s" repeatCount="indefinite" />
                            </feTurbulence>
                            <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="0" in="SourceGraphic" in2="warp">
                                <animate 
                                    attributeName="scale" 
                                    values="0; 0; 60; 25; 75; 0; 0" 
                                    keyTimes="0; 0.25; 0.3; 0.5; 0.7; 0.75; 1" 
                                    dur="8s" 
                                    repeatCount="5" 
                                    fill="freeze"
                                />
                            </feDisplacementMap>
                        </filter>
                    </defs>
                </svg>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-4 select-none">
                        {/* ISOTIPO */}
                        <div className="w-11 h-11 rounded-xl bg-[#08080e] border border-djcyan-500/50 flex items-center justify-center relative overflow-hidden shrink-0 shadow-[0_0_18px_rgba(6,182,212,0.35)]">
                            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                                <rect className="svg-bar b1-epic" x="2.5" y="6" width="3" rx="1.5" height="22" />
                                <rect className="svg-bar b2-epic" x="8" y="2" width="3.5" rx="1.75" height="28" />
                                <rect className="svg-bar b3-epic" x="14" y="4" width="3" rx="1.5" height="26" />
                                <rect className="svg-bar b4-epic" x="19.5" y="2" width="3.5" rx="1.75" height="28" />
                                <rect className="svg-bar b5-epic" x="25.5" y="8" width="3" rx="1.5" height="20" />
                            </svg>
                        </div>

                        {/* RÓTULO BEATWAVE COREOGRAFIADO */}
                        <div className="flex flex-col pt-1">
                            <div className="flex items-center gap-3 leading-none h-6">
                                <span className="text-[22px] tracking-wider uppercase font-black anim-soundwave" style={{ fontFamily: "'Syne', sans-serif" }}>
                                    BEAT<span className="text-djcyan-400">WAVE</span>
                                </span>
                                <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded-md font-black tracking-wider border shadow-md ml-1 bg-djcyan-950/90 text-djcyan-300 border-djcyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                                    PRO
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[9px] uppercase tracking-[0.28em] font-mono font-bold flex items-center gap-1.5 text-gray-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-djcyan-400 animate-pulse"></span>
                                    PRECISION AUDIO INTELLIGENCE
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pestañas de Navegación Exactas: Auditoría, Spotify Ingest, Taxonomía, Consola */}
                <nav className="flex space-x-1.5 h-full absolute left-1/2 -translate-x-1/2 items-center">
                    <button 
                        onClick={() => setActiveTab('audit')} 
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            activeTab === 'audit' 
                            ? 'bg-djcyan-500 text-black shadow-lg shadow-djcyan-500/20 font-bold' 
                            : 'text-gray-400 hover:text-white hover:bg-djzinc-900'
                        }`}
                    >
                        <Icons.Library /> Auditoría & DSP
                    </button>
                    <button 
                        onClick={() => setActiveTab('spotify')} 
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            activeTab === 'spotify' 
                            ? 'bg-djcyan-500 text-black shadow-lg shadow-djcyan-500/20 font-bold' 
                            : 'text-gray-400 hover:text-white hover:bg-djzinc-900'
                        }`}
                    >
                        <Icons.Spotify /> Spotify Ingest
                    </button>
                    <button 
                        onClick={() => setActiveTab('taxonomy')} 
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            activeTab === 'taxonomy' 
                            ? 'bg-djcyan-500 text-black shadow-lg shadow-djcyan-500/20 font-bold' 
                            : 'text-gray-400 hover:text-white hover:bg-djzinc-900'
                        }`}
                    >
                        <Icons.Routing /> Taxonomía
                    </button>
                    <button 
                        onClick={() => setActiveTab('logs')} 
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            activeTab === 'logs' 
                            ? 'bg-djcyan-500 text-black shadow-lg shadow-djcyan-500/20 font-bold' 
                            : 'text-gray-400 hover:text-white hover:bg-djzinc-900'
                        }`}
                    >
                        <Icons.Terminal /> Consola (Logs)
                    </button>
                </nav>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-djzinc-900 border border-djzinc-800 text-[11px] font-mono text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-djgreen-400 animate-pulse shadow-[0_0_5px_#22c55e]"></span>
                        DSP ENGINE ONLINE
                    </div>
                </div>
            </header>

            {/* MAIN WORKSPACES: Persistencia Total de Estado Manteniendo Todo Montado */}
            <main className="flex-1 min-h-0 w-full overflow-hidden relative">
                <div style={{ display: activeTab === 'audit' ? 'flex' : 'none' }} className="w-full h-full">
                    <AuditWorkspace 
                        selectedTrack={selectedTrack} 
                        setSelectedTrack={setSelectedTrack} 
                        onPlayTrack={handlePlayTrack} 
                        onTogglePlay={togglePlayPause} 
                        nowPlayingTrack={nowPlayingTrack} 
                        isPlaying={isPlaying} 
                        playProgress={playProgress} 
                    />
                </div>
                <div style={{ display: activeTab === 'spotify' ? 'flex' : 'none' }} className="w-full h-full">
                    <SpotifyWorkspace 
                        onPlayTrack={handlePlayTrack} 
                        nowPlayingTrack={nowPlayingTrack} 
                        isPlaying={isPlaying} 
                        onTogglePlay={togglePlayPause} 
                    />
                </div>
                <div style={{ display: activeTab === 'taxonomy' ? 'flex' : 'none' }} className="w-full h-full">
                    <TaxonomyWorkspace />
                </div>
                <div style={{ display: activeTab === 'logs' ? 'flex' : 'none' }} className="w-full h-full">
                    <LogsWorkspace logs={logs} setLogs={setLogs} />
                </div>
            </main>

            {/* GLOBAL DECK PLAYER (Footer) */}
            <footer className="h-16 bg-[#0a0a0e] border-t border-djzinc-800 px-5 flex items-center justify-between shrink-0 glass-panel z-30">
                <div className="flex items-center gap-3 min-w-0 w-80 shrink-0">
                    <img 
                        src={getValidCover(nowPlayingTrack?.cover)} 
                        alt="Deck Cover" 
                        onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }} 
                        className="w-11 h-11 rounded-md object-cover border border-djzinc-700 shrink-0 shadow-md" 
                    />
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate" title={nowPlayingTrack ? (nowPlayingTrack.t || nowPlayingTrack.title) : ''}>
                            {nowPlayingTrack ? (nowPlayingTrack.t || nowPlayingTrack.title) : 'Selecciona una pista'}
                        </span>
                        <span className="text-[11px] text-djcyan-400 font-medium truncate" title={nowPlayingTrack ? (nowPlayingTrack.a || nowPlayingTrack.artist) : ''}>
                            {nowPlayingTrack ? (nowPlayingTrack.a || nowPlayingTrack.artist) : '--'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono truncate">
                            {nowPlayingTrack ? `${nowPlayingTrack.b || nowPlayingTrack.bpm || '--'} BPM • Key ${nowPlayingTrack.k || nowPlayingTrack.key || '--'}` : '-- BPM'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <button 
                        onClick={handleCue} 
                        className="px-3 py-1.5 bg-[#16161d] hover:bg-[#20202a] text-gray-300 rounded font-mono font-bold text-xs border border-djzinc-700 active:translate-y-[1px] transition-all cursor-pointer"
                    >
                        CUE
                    </button>
                    <button 
                        onClick={togglePlayPause} 
                        className="w-10 h-10 rounded-lg bg-djcyan-500 hover:bg-djcyan-400 text-black flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] active:translate-y-[1px] transition-all cursor-pointer"
                    >
                        {isPlaying ? <Icons.Pause /> : <Icons.Play />}
                    </button>
                    <button 
                        onClick={() => setPlayProgress(0.22)} 
                        className="px-3 py-1.5 bg-[#16161d] hover:bg-[#20202a] text-gray-300 rounded font-mono font-bold text-xs border border-djzinc-700 active:translate-y-[1px] transition-all cursor-pointer"
                    >
                        SYNC
                    </button>
                </div>

                <FooterMasterWaveform 
                    track={nowPlayingTrack} 
                    isPlaying={isPlaying} 
                    playProgress={playProgress} 
                    onSeek={handleFooterSeek} 
                    cues={NV2_COLORS} 
                />
            </footer>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
