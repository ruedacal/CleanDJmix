
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

const Icons = {
    Library: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
    Routing: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>,
    Terminal: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>,
    Play: () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>,
    Pause: () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>,
    Sliders: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>,
    Gear: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
};

const InfoTip = ({ text, title }) => {
    const [coords, setCoords] = useState(null);
    const btnRef = useRef(null);

    const handleEnter = () => {
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        setCoords({ top: rect.top + rect.height / 2, right: window.innerWidth - rect.left + 12 });
    };
    const handleLeave = () => setCoords(null);

    return (
        <span className="inline-flex items-center ml-1.5 align-middle">
            <button ref={btnRef} type="button" onMouseEnter={handleEnter} onMouseLeave={handleLeave} onClick={(e) => { e.stopPropagation(); coords ? handleLeave() : handleEnter(); }} className="w-3.5 h-3.5 rounded-full bg-djzinc-800 hover:bg-djcyan-500 hover:text-black border border-djzinc-600 flex items-center justify-center text-[9px] font-mono font-bold text-gray-400 transition-colors cursor-help select-none shrink-0">i</button>
            {coords && (
                <div style={{ position: 'fixed', top: `${coords.top}px`, right: `${coords.right}px`, transform: 'translateY(-50%)', zIndex: 999999 }} className="w-72 bg-djzinc-900 border border-djzinc-700 rounded-lg p-3 text-xs text-gray-200 shadow-[0_12px_36px_rgba(0,0,0,0.95),0_0_15px_rgba(6,182,212,0.2)] pointer-events-none select-none">
                    <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-djzinc-900 border-t border-r border-djzinc-700 rotate-45"></div>
                    {title && <div className="text-[11px] font-bold text-djcyan-400 mb-1 uppercase tracking-wider flex items-center gap-1.5 border-b border-djzinc-800 pb-1"><span className="w-1.5 h-1.5 rounded-full bg-djcyan-400"></span>{title}</div>}
                    <div className="text-[11px] leading-relaxed text-gray-300 font-sans break-words whitespace-normal">{text}</div>
                </div>
            )}
        </span>
    );
};

const TableHarmonicWaveform = ({ track, duration = "05:00" }) => {
    const canvasRef = useRef(null);
    const seed = (track && track.id) ? Number(track.id) : 1;
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const width = 112; const height = 28;
        canvas.width = width * dpr; canvas.height = height * dpr; ctx.scale(dpr, dpr);
        ctx.fillStyle = "#040407"; ctx.fillRect(0, 0, width, height);
        const centerY = height / 2;
        const getBandEnergy = (xNorm) => {
            let bass = 0.3, mid = 0.2, treble = 0.25;
            if (xNorm > 0.12 && xNorm < 0.40) { bass = 0.95; mid = 0.75; treble = 0.70; }
            else if (xNorm >= 0.40 && xNorm <= 0.55) { bass = 0.15; mid = 0.85; treble = 0.50; }
            else if (xNorm > 0.55 && xNorm < 0.85) { bass = 1.00; mid = 0.80; treble = 0.85; }
            return { bass, mid, treble };
        };
        ctx.beginPath(); ctx.fillStyle = "rgba(30, 64, 175, 0.75)";
        for (let x = 0; x <= width; x += 2) {
            const { bass } = getBandEnergy(x / width);
            const kickPound = (Math.sin(x * 0.45 + seed) > 0.3) ? 1.2 : 0.8;
            const yH = (height * 0.38) * bass * kickPound;
            if (x === 0) ctx.moveTo(x, centerY - yH); else ctx.lineTo(x, centerY - yH);
        }
        for (let x = width; x >= 0; x -= 2) {
            const { bass } = getBandEnergy(x / width);
            const kickPound = (Math.sin(x * 0.45 + seed) > 0.3) ? 1.2 : 0.8;
            const yH = (height * 0.38) * bass * kickPound;
            ctx.lineTo(x, centerY + yH);
        }
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.strokeStyle = "#f97316"; ctx.lineWidth = 1.2;
        for (let x = 0; x <= width; x += 2) {
            const { mid } = getBandEnergy(x / width);
            const yMid = centerY - Math.sin(x * 0.18 + seed * 2) * (height * 0.32) * mid;
            if (x === 0) ctx.moveTo(x, yMid); else ctx.lineTo(x, yMid);
        }
        ctx.stroke();
    }, [seed, track]);
    return (
        <div className="w-28 h-7 bg-[#040407] rounded-md border border-djzinc-800 relative overflow-hidden group cursor-pointer hover:border-djcyan-500/80 transition-all flex items-center shadow-[inset_0_1px_4px_rgba(0,0,0,0.9)]">
            <canvas ref={canvasRef} style={{ width: '112px', height: '28px', display: 'block' }} />
        </div>
    );
};

const RekordboxWaveform = ({ track, cues = NV2_COLORS, duration = "06:12" }) => {
    const canvasRef = useRef(null);
    const seed = (track && track.id) ? Number(track.id) : 1;
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationId;
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.parentElement.clientWidth || 340;
        const height = 114;
        canvas.width = width * dpr; canvas.height = height * dpr; ctx.scale(dpr, dpr);
        let phase = 0;
        const render = () => {
            ctx.clearRect(0, 0, width, height); ctx.fillStyle = "#040407"; ctx.fillRect(0, 0, width, height);
            const centerY = height / 2;
            const getProfile = (xNorm) => {
                let b = 0.25, m = 0.20, t = 0.25;
                if (xNorm > 0.12 && xNorm < 0.40) { b = 0.95; m = 0.70; t = 0.80; }
                else if (xNorm >= 0.40 && xNorm <= 0.56) { b = 0.15; m = 0.92; t = 0.45; }
                else if (xNorm > 0.56 && xNorm < 0.86) { b = 1.00; m = 0.85; t = 0.90; }
                return { b, m, t };
            };
            ctx.beginPath(); ctx.fillStyle = "rgba(29, 78, 216, 0.50)";
            for (let x = 0; x <= width; x += 3) {
                const { b } = getProfile(x / width);
                const kickBeat = (Math.sin(x * 0.15 + phase * 0.03 + seed) > 0.4) ? 1.15 : 0.85;
                const yH = (height * 0.40) * b * kickBeat;
                if (x === 0) ctx.moveTo(x, centerY - yH); else ctx.lineTo(x, centerY - yH);
            }
            for (let x = width; x >= 0; x -= 3) {
                const { b } = getProfile(x / width);
                const kickBeat = (Math.sin(x * 0.15 + phase * 0.03 + seed) > 0.4) ? 1.15 : 0.85;
                const yH = (height * 0.40) * b * kickBeat;
                ctx.lineTo(x, centerY + yH);
            }
            ctx.closePath(); ctx.fill();
            phase += 1; animationId = requestAnimationFrame(render);
        };
        render(); return () => cancelAnimationFrame(animationId);
    }, [seed, track]);
    return (
        <div className="flex flex-col gap-1.5 w-full bg-[#050508] p-3 rounded-xl border border-djzinc-800 shadow-2xl relative">
            <div className="flex justify-between items-center text-[10px] font-mono px-0.5">
                <span className="text-djcyan-400 font-bold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-djcyan-400 animate-pulse"></span>REKORDBOX 3-BAND SPECTRUM</span>
                <span className="text-gray-400 font-bold">{duration}</span>
            </div>
            <div className="relative w-full rounded-lg overflow-hidden border border-djzinc-800/90 shadow-[inset_0_2px_12px_rgba(0,0,0,0.95)]">
                <canvas ref={canvasRef} style={{ width: '100%', height: '114px', display: 'block' }} />
                {cues.map((cue, idx) => {
                    const leftPos = Math.min(94, Math.max(4, (idx * 12.2) + 3));
                    return (
                        <div key={cue.id} className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none z-20" style={{ left: `${leftPos}%` }}>
                            <div className="w-3.5 h-3.5 rounded-b text-[8px] font-mono font-black text-black flex items-center justify-center shadow-lg" style={{ backgroundColor: cue.color }}>{cue.id}</div>
                            <div className="w-[1px] h-full opacity-60" style={{ backgroundColor: cue.color }}></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const BatchAuditorModal = ({ isOpen, onClose, onRunBatch }) => {
    const [opts, setOpts] = useState({ fftLossless: true, trimSilences: true, beatgrid: true, bpmKey: true, energyDance: true, moodDetect: true, hotCues8: true, tacticalComments: true });
    if (!isOpen) return null;
    const toggle = (key) => setOpts(prev => ({ ...prev, [key]: !prev[key] }));
    const activeCount = Object.values(opts).filter(Boolean).length;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="bg-djzinc-925 border border-djzinc-750 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 bg-djzinc-900 border-b border-djzinc-800 flex items-center justify-between shrink-0">
                    <h3 className="text-sm font-bold text-white uppercase">Batch Audio Processing Engine</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-djzinc-850 hover:bg-djzinc-750 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer">✕</button>
                </div>
                <div className="p-6 overflow-y-auto space-y-5 flex-1"><p className="text-xs text-gray-400">Configura el lote de análisis DSP antes de escribir los tags maestros.</p></div>
                <div className="px-6 py-4 bg-djzinc-900 border-t border-djzinc-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 bg-djzinc-800 cursor-pointer">Cancelar</button>
                    <button onClick={() => onRunBatch(opts)} className="px-5 py-2 rounded-xl text-xs font-bold bg-djcyan-500 text-black cursor-pointer">Ejecutar Procesamiento Masivo</button>
                </div>
            </div>
        </div>
    );
};

const AuditWorkspace = ({ tracks, setTracks, metrics, setMetrics, rutaOrigen, setRutaOrigen, selectedTrack, setSelectedTrack }) => {
    const [isAuditing, setIsAuditing] = useState(false);
    const [filtro, setFiltro] = useState('todos');
    const [busqueda, setBusqueda] = useState('');
    const [batchModalOpen, setBatchModalOpen] = useState(false);

    const currentTrack = tracks.find(t => t.id === selectedTrack) || tracks[0] || {};

    const handleExplorar = async () => {
        if (window.eel && window.eel.seleccionar_directorio) {
            const nuevaRuta = await window.eel.seleccionar_directorio()();
            if (nuevaRuta) { setRutaOrigen(nuevaRuta); handleAuditar(nuevaRuta); }
        }
    };

    const handleAuditar = async (pathOverride) => {
        const target = pathOverride || rutaOrigen;
        if (window.eel && window.eel.iniciar_auditoria && !isAuditing) {
            setIsAuditing(true);
            try {
                const res = await window.eel.iniciar_auditoria(target)();
                if (res) {
                    setMetrics({ total: res.total, missing: res.sin_meta, ready: res.total - res.sin_meta, errors: 0 });
                    if (res.tracks) { setTracks(res.tracks); if (res.tracks.length > 0) setSelectedTrack(res.tracks[0].id); }
                }
            } catch (e) { console.error("Fallo de auditoría:", e); }
            setIsAuditing(false);
        }
    };

    const handleExportarXLS = async () => {
        if (window.eel && window.eel.exportar_auditoria_xls) {
            const res = await window.eel.exportar_auditoria_xls(tracks)();
            if (res && res.status === 'ok') alert(`Respaldo guardado en:\n${res.path}`);
            else alert(`Error: ${res?.msg || 'Desconocido'}`);
        }
    };

    const tracksFiltrados = tracks.filter(t => {
        const titulo = (t?.t || t?.title || '').toLowerCase();
        const artista = (t?.a || t?.artist || '').toLowerCase();
        const archivo = (t?.f || t?.filename || '').toLowerCase();
        const clave = (t?.k || t?.key || '').toLowerCase();
        const term = busqueda.toLowerCase();
        const matchBusqueda = titulo.includes(term) || artista.includes(term) || archivo.includes(term) || clave.includes(term);
        if (!matchBusqueda) return false;
        const bpmVal = String(t?.b || t?.bpm || '--');
        const keyVal = String(t?.k || t?.key || '--');
        const statusVal = String(t?.status || '');
        if (filtro === 'missing') return (bpmVal === '--' || keyVal === '--');
        if (filtro === 'error') return (statusVal.includes('Fake') || statusVal.includes('Error'));
        return true;
    });

    return (
        <div className="flex w-full h-full">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="p-4 border-b border-djzinc-800 bg-djzinc-950 flex justify-between items-center shrink-0">
                    <div className="flex gap-4 items-center w-1/2">
                        <div className="flex-1 max-w-md bg-djzinc-900 rounded-md border border-djzinc-700 flex focus-within:border-djcyan-500 transition-colors overflow-hidden">
                            <span className="bg-djzinc-800 px-3 py-1.5 text-xs text-gray-400 font-mono border-r border-djzinc-700 flex items-center">ORIGEN</span>
                            <input type="text" value={rutaOrigen} onChange={(e) => setRutaOrigen(e.target.value)} className="flex-1 bg-transparent px-3 py-1.5 text-sm text-gray-200 outline-none font-mono" />
                        </div>
                        <button onClick={handleExplorar} className="bg-djzinc-800 hover:bg-djzinc-700 border border-djzinc-600 rounded px-4 py-1.5 text-xs font-bold text-gray-300 transition-colors cursor-pointer">Explorar</button>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={handleExportarXLS} className="bg-djzinc-800 hover:bg-djzinc-750 border border-djzinc-600 text-djgreen-400 px-4 py-2 rounded-md font-bold text-xs flex items-center gap-2 transition-all cursor-pointer">
                            📊 Exportar XLS
                        </button>
                        <button onClick={() => setBatchModalOpen(true)} className="bg-djzinc-800 hover:bg-djzinc-750 border border-djcyan-500/40 text-djcyan-400 px-4 py-2 rounded-md font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer">
                            <Icons.Sliders /> Configurar Lote
                        </button>
                        <button onClick={() => handleAuditar()} disabled={isAuditing} className={`text-white px-5 py-2 rounded-md font-semibold text-sm border flex items-center gap-2 transition-all shadow-lg cursor-pointer ${isAuditing ? 'bg-djzinc-800 border-djzinc-700 opacity-70' : 'bg-djzinc-800 hover:bg-djzinc-700 border-djzinc-600'}`}>
                            {isAuditing ? <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <Icons.Library />}
                            {isAuditing ? 'Auditando...' : 'Auditar Directorio'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-px bg-djzinc-800 border-b border-djzinc-800 shrink-0">
                    <div className="bg-djzinc-950 p-4 flex flex-col justify-center">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Total Pistas</span>
                        <span className="text-2xl font-mono text-white">{(metrics.total || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-djzinc-950 p-4 flex flex-col justify-center">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Falta Metadata (BPM/Key)</span>
                        <span className="text-2xl font-mono text-amber-500">{(metrics.missing || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-djzinc-950 p-4 flex flex-col justify-center">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Listas para Inyectar</span>
                        <span className="text-2xl font-mono text-djgreen-400">{(metrics.ready || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-djzinc-950 p-4 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Motor Lossless</span>
                            <span className="text-sm font-medium text-djcyan-400">Activo (FFT / Mutagen)</span>
                        </div>
                        <div className="w-10 h-5 bg-djcyan-600 rounded-full relative shadow-[0_0_10px_rgba(8,145,178,0.4)]">
                            <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-2 bg-djzinc-900 border-b border-djzinc-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative w-64">
                            <svg className="absolute left-2.5 top-2 text-gray-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por track, artista o clave..." className="w-full bg-djzinc-950 border border-djzinc-700 rounded-full pl-8 pr-3 py-1.5 text-xs text-gray-300 focus:border-djcyan-500 focus:outline-none transition-colors" />
                        </div>
                        <div className="h-4 w-px bg-djzinc-700 mx-2"></div>
                        <div className="flex gap-2">
                            <button onClick={() => setFiltro('todos')} className={`px-3 py-1 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${filtro === 'todos' ? 'bg-djcyan-600 text-white' : 'bg-djzinc-800 hover:bg-djzinc-700 text-gray-300'}`}>Todos ({(metrics.total || 0).toLocaleString()})</button>
                            <button onClick={() => setFiltro('missing')} className={`px-3 py-1 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${filtro === 'missing' ? 'bg-amber-600 text-white' : 'bg-amber-900/30 text-amber-500 hover:bg-amber-900/50'}`}>Falta Metadata ({(metrics.missing || 0).toLocaleString()})</button>
                            <button onClick={() => setFiltro('error')} className={`px-3 py-1 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${filtro === 'error' ? 'bg-red-600 text-white' : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'}`}>Errores ({metrics.errors || 0})</button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-[#0f0f13]">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                        <thead className="sticky top-0 z-10 bg-djzinc-900/95 backdrop-blur border-b border-djzinc-800 text-[11px] font-mono uppercase tracking-wider text-djzinc-400">
                            <tr>
                                <th className="py-2.5 px-2 w-7 text-center text-djzinc-500">#</th>
                                <th className="py-2.5 px-2 w-28 text-center text-djcyan-400">Waveform</th>
                                <th className="py-2.5 px-3 min-w-[170px] text-left">Archivo / Título</th>
                                <th className="py-2.5 px-2 w-28 max-w-[120px] text-left">Artista</th>
                                <th className="py-2.5 px-1.5 w-14 text-center">Time</th>
                                <th className="py-2.5 px-1.5 w-16 text-center">BPM</th>
                                <th className="py-2.5 px-1.5 w-14 text-center">Key</th>
                                <th className="py-2.5 px-1.5 w-24 text-center">Cert. FFT</th>
                                <th className="py-2.5 px-1.5 w-20 text-center">Auto-Trim</th>
                                <th className="py-2.5 px-1.5 w-20 text-center">Beat 1.0.0</th>
                                <th className="py-2.5 px-1.5 w-20 text-center">8 Hot Cues</th>
                                <th className="py-2.5 px-1.5 w-16 text-center">Energía</th>
                                <th className="py-2.5 px-1.5 w-16 text-center">Dance</th>
                                <th className="py-2.5 px-2 w-24 text-center">Atmósfera</th>
                                <th className="py-2.5 px-3 min-w-[180px] text-left">Comentario Táctico DJ</th>
                                <th className="py-2.5 px-2 w-24 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-djzinc-850/60 font-sans">
                            {tracksFiltrados.map((row) => (
                                <tr key={row.id} onClick={() => setSelectedTrack(row.id)} className={`transition-colors cursor-pointer select-none ${selectedTrack === row.id ? 'bg-djcyan-950/40 border-l-2 border-djcyan-400' : 'hover:bg-djzinc-850/40'}`}>
                                    <td className="py-2 px-2 text-center text-djzinc-500 text-xs font-mono">{row.id}</td>
                                    <td className="py-2 px-2 text-center"><TableHarmonicWaveform track={row} duration={row.duration || row.d || '05:00'} /></td>
                                    <td className="py-2 px-3 text-left">
                                        <div className="flex flex-col min-w-0">
                                            <div className="font-semibold text-gray-200 truncate max-w-[170px] text-xs" title={row.t || row.title}>{row.t || row.title}</div>
                                            <div className="text-[10px] text-gray-500 font-mono truncate max-w-[170px]" title={row.f || row.filename}>{row.f || row.filename}</div>
                                        </div>
                                    </td>
                                    <td className="py-2 px-2 text-left w-28 max-w-[120px]"><div className="text-gray-300 truncate text-xs" title={row.a || row.artist}>{row.a || row.artist || 'Desconocido'}</div></td>
                                    <td className="py-2 px-1.5 text-center text-gray-400 font-mono text-xs">{row.duration || row.d || '0:00'}</td>
                                    <td className="py-2 px-1.5 text-center"><span className="bg-djzinc-850 text-gray-200 px-1.5 py-0.5 rounded text-[11px] font-mono border border-djzinc-750">{row.b || row.bpm || '--'}</span></td>
                                    <td className="py-2 px-1.5 text-center"><span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-djcyan-950 text-djcyan-400 border border-djcyan-800/50">{row.k || row.key || '--'}</span></td>
                                    <td className="py-2 px-1.5 text-center">
                                        {(() => {
                                            const isFake = String(row?.status || '').includes('Fake');
                                            const khz = row?.cutoff_khz ? `${row.cutoff_khz}kHz` : (isFake ? '16.0kHz' : '22.0kHz');
                                            return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${isFake ? 'bg-red-950/80 text-red-400 border-red-800/80' : 'bg-djgreen-950/80 text-djgreen-400 border-djgreen-800/60'}`}>{isFake ? `CUT ${khz}` : `PASS ${khz}`}</span>;
                                        })()}
                                    </td>
                                    <td className="py-2 px-1.5 text-center font-mono text-xs">
                                        {(() => {
                                            const trimVal = row?.trim_start_ms !== undefined ? Number(row.trim_start_ms) : 0;
                                            const hasSilence = trimVal > 40.0;
                                            return <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${hasSilence ? 'bg-amber-950/70 text-amber-300 border-amber-800/60' : 'bg-djzinc-850 text-gray-400 border-djzinc-750'}`}>{trimVal > 0 ? `-${trimVal}ms` : '0ms'}</span>;
                                        })()}
                                    </td>
                                    <td className="py-2 px-1.5 text-center font-mono text-xs"><span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-950/60 text-blue-300 border border-blue-800/50 font-semibold">{row?.first_downbeat_ms ? `${row.first_downbeat_ms}ms` : '0ms'}</span></td>
                                    <td className="py-2 px-1.5 text-center"><span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-djzinc-850 text-amber-400 border border-amber-800/40"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>8 NV2</span></td>
                                    <td className="py-2 px-1.5 text-center font-mono text-[10px]"><span className="px-1.5 py-0.5 rounded bg-pink-950/50 text-pink-300 border border-pink-800/40 font-bold">{row.e || 80}%</span></td>
                                    <td className="py-2 px-1.5 text-center font-mono text-[10px]"><span className="px-1.5 py-0.5 rounded bg-indigo-950/50 text-indigo-300 border border-indigo-800/40 font-bold">{row.dance || 85}%</span></td>
                                    <td className="py-2 px-2 text-center"><span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-medium truncate max-w-[90px] bg-emerald-950/50 text-emerald-300 border border-emerald-800/40" title={row.mood || 'Peak Time Hypnotic'}>{row.mood || 'Peak Time'}</span></td>
                                    <td className="py-2 px-3 text-left"><div className="text-[10px] font-mono text-gray-300 truncate max-w-[200px] flex items-center gap-1.5" title={row.comment || 'Intro limpio 32b • Drop contundente'}><span className="text-djcyan-500">💬</span><span className="truncate">{row.comment || 'Intro limpia 32b • Drop 01:15 • Outro'}</span></div></td>
                                    <td className="py-2 px-2 text-center">
                                        {(() => {
                                            const s = String(row?.status || 'Lossless');
                                            const isFake = s.includes('Fake');
                                            return <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold truncate max-w-[95px] ${isFake ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-djzinc-850 text-djgreen-400 border border-djzinc-750'}`} title={s}>{isFake ? 'Fake FLAC' : 'Lossless OK'}</span>;
                                        })()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <aside className="w-96 bg-djzinc-900 border-l border-djzinc-800 flex flex-col shrink-0 slide-in-right z-20 overflow-hidden shadow-2xl">
                <div className="p-3 border-b border-djzinc-800 bg-djzinc-950 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Icons.Gear />
                        <span className="font-bold text-xs uppercase tracking-wider text-gray-200">Inspector DJ Granular</span>
                    </div>
                    <span className="text-[10px] font-mono bg-djzinc-800 text-gray-400 px-2 py-0.5 rounded">Track #{currentTrack.id}</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div>
                        <h4 className="font-bold text-sm text-white truncate" title={currentTrack.t}>{currentTrack.t}</h4>
                        <p className="text-xs text-djcyan-400 truncate">{currentTrack.a}</p>
                    </div>

                    <div>
                        <div className="flex items-center mb-1">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Espectro & 8 Cues NV2</span>
                            <InfoTip title="Visualizador Tri-Banda" text="Onda en 3 bandas (bajos en azul, medios en ámbar y agudos en cian) con los 8 puntos Hot Cues de la Numark NV2." />
                        </div>
                        <RekordboxWaveform track={currentTrack} duration={currentTrack.duration || "05:00"} />
                    </div>

                    <div className="bg-djzinc-950 p-3 rounded-lg border border-djzinc-800 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-semibold flex items-center">
                                Certificación FFT
                                <InfoTip title="Análisis FFT de Pérdida" text="Comprueba si el espectro rebasa los 20kHz reales o si es un MP3 inflado artificialmente a FLAC." />
                            </span>
                            {(() => {
                                const s = String(currentTrack?.status || '');
                                const isFake = s.includes('Fake') || s.includes('Error');
                                return <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${isFake ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-djgreen-950 text-djgreen-400 border border-djgreen-800'}`}>{isFake ? 'CUTOFF 16kHz' : 'PASS 22.05kHz'}</span>;
                            })()}
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-djzinc-850">
                            <span className="text-xs text-gray-400 flex items-center">Trim Silencio (Zero-Cross)</span>
                            <button className="text-[10px] font-bold bg-djzinc-800 hover:bg-djzinc-700 text-gray-200 px-2 py-1 rounded border border-djzinc-700 cursor-pointer">{`Auto-Trim (-${currentTrack?.trim_start_ms !== undefined ? currentTrack.trim_start_ms : 0}ms)`}</button>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-djzinc-850">
                            <span className="text-xs text-gray-400 flex items-center">Alinear Beatgrid 1.0.0</span>
                            <button className="text-[10px] font-bold bg-djcyan-950 hover:bg-djcyan-900 text-djcyan-400 px-2 py-1 rounded border border-djcyan-800/60 cursor-pointer">{`Anclar Beat 1 (${currentTrack?.first_downbeat_ms !== undefined ? currentTrack.first_downbeat_ms : 0}ms)`}</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-djzinc-950 p-2.5 rounded border border-djzinc-800">
                            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1"><span>BPM Decimal</span></div>
                            <div className="flex items-center gap-1">
                                <input type="text" defaultValue={currentTrack.b} className="w-full bg-djzinc-900 border border-djzinc-700 rounded px-2 py-1 text-xs font-mono font-bold text-white outline-none focus:border-djcyan-500" />
                                <button className="px-1.5 py-1 text-[9px] font-mono bg-djzinc-800 hover:bg-djzinc-700 rounded border border-djzinc-700">/2</button>
                                <button className="px-1.5 py-1 text-[9px] font-mono bg-djzinc-800 hover:bg-djzinc-700 rounded border border-djzinc-700">x2</button>
                            </div>
                        </div>
                        <div className="bg-djzinc-950 p-2.5 rounded border border-djzinc-800">
                            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1"><span>Key (Camelot)</span></div>
                            <select defaultValue={currentTrack.k} className="w-full bg-djzinc-900 border border-djzinc-700 rounded px-2 py-1 text-xs font-mono font-bold text-djcyan-400 outline-none">
                                {['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B','7A','7B','8A','8B','9A','9B','10A','10B','11A','11B','12A','12B'].map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="bg-djzinc-950 p-3 rounded border border-djzinc-800 space-y-3">
                        <div>
                            <div className="flex justify-between items-center text-[11px] text-gray-400 mb-1"><span>Energy Level ({currentTrack.e || 80}%)</span></div>
                            <input type="range" min="1" max="100" defaultValue={currentTrack.e || 80} className="w-full accent-djgreen-500 h-1.5 bg-djzinc-800 rounded-lg cursor-pointer" />
                        </div>
                        <div>
                            <div className="flex justify-between items-center text-[11px] text-gray-400 mb-1"><span>Danceability ({currentTrack.dance || 85}%)</span></div>
                            <input type="range" min="1" max="100" defaultValue={currentTrack.dance || 85} className="w-full accent-djcyan-500 h-1.5 bg-djzinc-800 rounded-lg cursor-pointer" />
                        </div>
                        <div>
                            <div className="flex justify-between items-center text-[11px] text-gray-400 mb-1"><span>Atmósfera (Mood)</span></div>
                            <select defaultValue={currentTrack.mood || "Peak Time Hypnotic"} className="w-full bg-djzinc-900 border border-djzinc-700 rounded px-2 py-1 text-xs text-gray-200 outline-none">
                                <option>Peak Time Hypnotic</option><option>Dark Driving</option><option>Euphoric Melodic</option><option>Raw Industrial</option><option>Deep & Minimal</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">8 Hot Cues (Numark NV2)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {NV2_COLORS.map(c => (
                                <div key={c.id} className={`p-2 rounded border flex flex-col justify-between ${c.bg} ${c.border}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded text-black" style={{ backgroundColor: c.color }}>Pad {c.id}</span>
                                        <span className="text-[9px] font-mono text-gray-400">{c.time}</span>
                                    </div>
                                    <span className={`text-[11px] font-semibold truncate mt-1 ${c.text}`}>{c.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Comentario Táctico DJ</span>
                        </div>
                        <textarea defaultValue={currentTrack.comment || "Inicio limpio 32b • Drop contundente • Outro 64b"} rows="2" className="w-full bg-djzinc-950 border border-djzinc-700 rounded p-2 text-xs text-gray-200 outline-none focus:border-djcyan-500 font-mono resize-none leading-relaxed"></textarea>
                    </div>
                </div>

                <div className="p-3 bg-djzinc-950 border-t border-djzinc-800">
                    <button className="w-full py-2 bg-djcyan-600 hover:bg-djcyan-500 text-white rounded font-bold text-xs shadow-md transition-all cursor-pointer">
                        Aplicar Cambios a este Track
                    </button>
                </div>
            </aside>

            <BatchAuditorModal isOpen={batchModalOpen} onClose={() => setBatchModalOpen(false)} onRunBatch={() => { setBatchModalOpen(false); alert("Procesamiento en lote iniciado."); }} />
        </div>
    );
};

const TaxonomyWorkspace = () => (
    <div className="flex flex-col h-full p-6 w-full overflow-auto">
        <div className="mb-6 flex justify-between items-end border-b border-djzinc-800 pb-4">
            <div>
                <h2 className="text-xl font-bold text-white mb-1">Ruteo de Destinos (Serato Crates)</h2>
                <p className="text-gray-400 text-sm">Define dónde se guardan los archivos físicos basándose en su género principal.</p>
            </div>
            <button className="bg-djzinc-800 hover:bg-djzinc-700 border border-djzinc-600 text-white px-4 py-2 rounded text-sm font-medium">Añadir Nueva Regla</button>
        </div>
        
        <div className="bg-djzinc-900 border border-djzinc-700 rounded-xl mb-6 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-djzinc-800 to-djzinc-900 px-5 py-3 border-b border-djzinc-700 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-djcyan-500 shadow-[0_0_8px_#06b6d4]"></div>
                <h3 className="font-bold text-white tracking-wide">TECHNO <span className="font-normal text-gray-500 text-xs ml-2">(Raíz Serato)</span></h3>
            </div>
            <div className="p-2">
                {['Hard Techno', 'Melodic Techno', 'Peak Time'].map(sub => (
                    <div key={sub} className="flex gap-4 items-center p-3 hover:bg-djzinc-800/50 rounded-lg group transition-colors">
                        <div className="w-6 h-6 border-l-2 border-b-2 border-djzinc-700 rounded-bl-lg ml-2 opacity-50"></div>
                        <div className="w-32 text-sm font-bold text-gray-300">{sub}</div>
                        <div className="flex-1 flex items-center gap-2">
                            <span className="text-xs text-gray-600 uppercase font-mono">➡ Ruta Fija:</span>
                            <input type="text" defaultValue={`/Music/Serato/Techno/${sub}/`} className="flex-1 bg-djzinc-950 border border-djzinc-800 rounded px-3 py-2 text-xs font-mono text-gray-400 focus:border-djcyan-500 outline-none transition-colors" />
                            <button className="bg-djzinc-800 hover:bg-djzinc-700 border border-djzinc-600 rounded p-2 text-gray-400"><Icons.Routing /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const LogsWorkspace = ({ logs, setLogs }) => (
    <div className="flex flex-col h-full p-6 w-full bg-black font-mono">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
                <Icons.Terminal />
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">System Console</h2>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setLogs([])} className="text-xs text-djcyan-400 hover:text-white transition-colors">[ Clear ]</button>
                <button className="text-xs text-gray-500 hover:text-white transition-colors">[ Export .log ]</button>
            </div>
        </div>
        <div className="flex-1 border border-djzinc-800 rounded p-4 text-xs overflow-auto flex flex-col-reverse shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
            <div>
                {logs.map((log, idx) => (
                    <div key={idx} className={`mb-1 ${
                        log.type === 'info' ? 'text-djcyan-500' : 
                        log.type === 'divider' ? 'text-gray-500 mb-2' : 
                        log.type === 'success' ? 'text-djgreen-400' : 
                        log.type === 'warn' ? 'text-amber-400' : 
                        'text-gray-300'
                    }`}>
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

const App = () => {
    const [activeTab, setActiveTab] = useState('audit');
    const [selectedTrack, setSelectedTrack] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // ESTADO ELEVADO: Persiste aunque la pestaña se oculte
    const [rutaOrigen, setRutaOrigen] = useState('/Users/admin/Music/mi musica');
    const [tracks, setTracks] = useState([
        { id: 1, f: "Marco Bailey - Jungle Laps.flac", t: "Jungle Laps", a: "Marco Bailey", duration: "06:12", b: "134.00", k: "8A", e: 88, dance: 92, mood: "Peak Time Hypnotic", status: "Lossless OK", cutoff_khz: 22.0, trim_start_ms: 1938.8, first_downbeat_ms: 2417.2, comment: "Intro limpia 32b • Drop 01:15 • Outro 64b", path: "/Users/admin/Music/mi musica/Marco Bailey - Jungle Laps.flac" },
        { id: 2, f: "Mau P - Horny Tiger.mp3", t: "Horny Tiger", a: "Mau P", duration: "05:45", b: "128.00", k: "5A", e: 95, dance: 85, mood: "Tech Driving", status: "Lossy 320", cutoff_khz: 20.2, trim_start_ms: 23.9, first_downbeat_ms: 1774.3, comment: "Kick pegado • Mucho groove • Drop contundente", path: "/Users/admin/Music/mi musica/Mau P - Horny Tiger.mp3" },
        { id: 3, f: "Frostbite - Frozen Heart.wav", t: "Frozen Heart", a: "Frostbite", duration: "05:20", b: "--", k: "--", e: 65, dance: 70, mood: "Raw Industrial", status: "Lossless OK", cutoff_khz: 22.0, trim_start_ms: 0.0, first_downbeat_ms: 1200.0, comment: "Falta analizado de clave • Curva variable", path: "/Users/admin/Music/mi musica/Frostbite - Frozen Heart.wav" },
        { id: 4, f: "David Bowie - DJ (Remix Edit).flac", t: "DJ (Remix Edit)", a: "David Bowie", duration: "07:02", b: "115.00", k: "9A", e: 60, dance: 78, mood: "Melodic Drive", status: "Fake FLAC", cutoff_khz: 16.0, trim_start_ms: 320.0, first_downbeat_ms: 2100.0, comment: "Transcodificado falso • Recortado a 16kHz", path: "/Users/admin/Music/mi musica/David Bowie - DJ (Remix Edit).flac" },
    ]);
    const [metrics, setMetrics] = useState({ total: 4, missing: 1, ready: 3, errors: 12 });
    const [logs, setLogs] = useState([
        { type: 'info', text: 'CleanDJmix PRO DSP Engine Initialized.' },
        { type: 'success', text: 'FFT Lossless & Zero-Cross modules armed.' }
    ]);

    const handlePlay = () => {
        const nextState = !isPlaying;
        setIsPlaying(nextState);
        if (window.eel) {
            const track = tracks.find(t => t.id === selectedTrack) || tracks[0];
            if (nextState && track && track.path) {
                window.eel.reproducir_pista_mac(track.path)();
            } else {
                window.eel.detener_audio_mac()();
            }
        }
    };

    return (
        <div className="flex h-screen w-screen bg-djzinc-950 text-gray-300 overflow-hidden font-sans pb-16">
            {/* Barra Lateral Navegación */}
            <div className="w-16 bg-djzinc-950 border-r border-djzinc-800 flex flex-col items-center py-4 gap-6 shrink-0 z-30">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-djcyan-500 to-blue-600 flex items-center justify-center text-black font-extrabold text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer">
                    <div className="flex items-end gap-[2px] h-4">
                        <span className="w-1 bg-black rounded-sm logo-bar" style={{ animationDuration: '0.6s' }}></span>
                        <span className="w-1 bg-black rounded-sm logo-bar" style={{ animationDuration: '0.4s' }}></span>
                        <span className="w-1 bg-black rounded-sm logo-bar" style={{ animationDuration: '0.8s' }}></span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button onClick={() => setActiveTab('audit')} className={`p-3 rounded-xl transition-all cursor-pointer ${activeTab === 'audit' ? 'bg-djcyan-500 text-black shadow-lg shadow-djcyan-500/20' : 'text-gray-400 hover:text-white hover:bg-djzinc-850'}`} title="Mesa de Auditoría">
                        <Icons.Library />
                    </button>
                    <button onClick={() => setActiveTab('taxonomy')} className={`p-3 rounded-xl transition-all cursor-pointer ${activeTab === 'taxonomy' ? 'bg-djcyan-500 text-black shadow-lg shadow-djcyan-500/20' : 'text-gray-400 hover:text-white hover:bg-djzinc-850'}`} title="Ruteo y Taxonomía">
                        <Icons.Routing />
                    </button>
                    <button onClick={() => setActiveTab('logs')} className={`p-3 rounded-xl transition-all cursor-pointer ${activeTab === 'logs' ? 'bg-djcyan-500 text-black shadow-lg shadow-djcyan-500/20' : 'text-gray-400 hover:text-white hover:bg-djzinc-850'}`} title="Consola del Sistema">
                        <Icons.Terminal />
                    </button>
                </div>
            </div>

            {/* Contenedor Persistente por Visibilidad CSS */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                <div className={`absolute inset-0 ${activeTab === 'audit' ? 'flex flex-col' : 'hidden'}`}>
                    <AuditWorkspace 
                        tracks={tracks} setTracks={setTracks} 
                        metrics={metrics} setMetrics={setMetrics} 
                        rutaOrigen={rutaOrigen} setRutaOrigen={setRutaOrigen} 
                        selectedTrack={selectedTrack} setSelectedTrack={setSelectedTrack} 
                    />
                </div>
                <div className={`absolute inset-0 ${activeTab === 'taxonomy' ? 'block' : 'hidden'} overflow-auto`}>
                    <TaxonomyWorkspace />
                </div>
                <div className={`absolute inset-0 ${activeTab === 'logs' ? 'block' : 'hidden'} overflow-auto`}>
                    <LogsWorkspace logs={logs} setLogs={setLogs} />
                </div>
            </div>

            {/* Deck Footer Master Reproductor */}
            <div className="h-16 bg-djzinc-950 border-t border-djzinc-800 px-4 flex items-center justify-between shrink-0 glass-panel z-30 absolute bottom-0 left-0 right-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-djzinc-900 border border-djzinc-800 flex items-center justify-center font-bold text-xs text-djcyan-400 font-mono">
                        CleanDJ
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">{tracks.find(t => t.id === selectedTrack)?.t || 'Esperando pista...'}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{tracks.find(t => t.id === selectedTrack)?.b || '--'} BPM</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="px-3 py-1 bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 rounded font-mono font-bold text-xs border border-djzinc-700">CUE</button>
                    <button onClick={handlePlay} className="w-8 h-8 rounded-full bg-djcyan-500 hover:bg-djcyan-400 text-black flex items-center justify-center transition-all shadow-[0_0_10px_rgba(6,182,212,0.4)] cursor-pointer">
                        {isPlaying ? <Icons.Pause /> : <Icons.Play />}
                    </button>
                    <button className="px-3 py-1 bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 rounded font-mono font-bold text-xs border border-djzinc-700">SYNC</button>
                </div>

                <div className={`flex items-end gap-[2px] h-6 ${isPlaying ? '' : 'vu-paused'}`}>
                    {[...Array(18)].map((_, i) => (
                        <span key={i} className="w-1 bg-gradient-to-t from-djcyan-500 via-amber-400 to-red-500 rounded-sm vu-meter-bar" style={{ height: `${Math.max(20, Math.sin(i * 0.4) * 80 + 20)}%`, animationDuration: `${0.3 + (i % 5) * 0.1}s` }}></span>
                    ))}
                </div>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
