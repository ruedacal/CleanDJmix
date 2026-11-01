#!/usr/bin/env python3
import re

with open("web/js/app.jsx", "r", encoding="utf-8") as f:
    text = f.read()

s1 = text.find("const AppCinematicIntro =")
s2 = text.find("const AppTutorialModal =")
assert s1 != -1 and s2 != -1, f"Could not find AppCinematicIntro block: s1={s1}, s2={s2}"

cinematic_component = """const AppCinematicIntro = ({ isOpen, onClose, onOpenLogin, onOpenRegister, onOpenTour }) => {
    if (!isOpen) return null;

    const [phase, setPhase] = useState('video'); // 'video' | 'portal'
    const [videoOpacity, setVideoOpacity] = useState(0); // Entrada: 0 -> 0.25 (75% transparente sobre negro)
    const [isMuted, setIsMuted] = useState(false);
    const [isBassShaking, setIsBassShaking] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // ENTRADA DEL VÍDEO: Fade-in suave de 2 segundos desde negro absoluto hasta 25% de opacidad (75% transparente)
    useEffect(() => {
        const timer = setTimeout(() => {
            setVideoOpacity(0.25);
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    // Reproducción automática limpia: si el navegador requiere interacción previa, desmutear silenciosamente al primer clic/tecla
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid) return;

        vid.currentTime = 0;
        const playPromise = vid.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                setIsMuted(false);
            }).catch(() => {
                vid.muted = true;
                setIsMuted(true);
                vid.play().catch(() => {});

                const unmuteSilently = () => {
                    if (vid) {
                        vid.muted = false;
                        setIsMuted(false);
                    }
                    window.removeEventListener('pointerdown', unmuteSilently);
                    window.removeEventListener('keydown', unmuteSilently);
                };
                window.addEventListener('pointerdown', unmuteSilently, { once: true });
                window.addEventListener('keydown', unmuteSilently, { once: true });
            });
        }
    }, []);

    // SEGUIMIENTO DE TIEMPO: Vibración de bajos en el drop y Fade-Out de salida de 2 segundos
    const handleTimeUpdate = () => {
        const vid = videoRef.current;
        if (!vid || !vid.duration) return;

        // Vibración de cámara y distorsión de graves desde el drop (11.534s)
        if (vid.currentTime >= 11.534 && !isBassShaking) {
            setIsBassShaking(true);
        }

        // SALIDA DEL VÍDEO: Fade-out suave de 2.0 segundos a negro absoluto
        const timeLeft = vid.duration - vid.currentTime;
        if (timeLeft <= 2.0 && videoOpacity > 0.02) {
            setVideoOpacity(0.0);
        }
    };

    const handleVideoEnded = () => {
        setVideoOpacity(0.0);
        setTimeout(() => {
            setPhase('portal');
        }, 300);
    };

    const handleSkip = () => {
        setVideoOpacity(0.0);
        setTimeout(() => {
            setPhase('portal');
        }, 200);
    };

    // Acciones al pulsar los botones del portal
    const handleAction = (action) => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                const ctx = new AudioCtx();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(130, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.28);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.35);
            }
        } catch (_) {}

        if (action === 'login') {
            onClose();
            if (onOpenLogin) onOpenLogin();
        } else if (action === 'register') {
            onClose();
            if (onOpenRegister) onOpenRegister();
        } else if (action === 'tour') {
            onClose();
            if (onOpenTour) onOpenTour();
        } else {
            onClose();
        }
    };

    // Atmósfera 3D y Rayos Láser en Fase Portal
    useEffect(() => {
        if (phase !== 'portal') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        let t = 0;

        const render3D = () => {
            t += 0.035;
            const w = canvas.width = window.innerWidth;
            const h = canvas.height = window.innerHeight;
            ctx.clearRect(0, 0, w, h);

            // Láseres Neón volumétricos en perspectiva
            const count = 10;
            for (let i = 0; i < count; i++) {
                const angle = Math.sin(t * 0.8 + i * 0.7) * 0.45;
                const startX = (w / (count + 1)) * (i + 1);
                ctx.beginPath();
                ctx.moveTo(startX, 0);
                ctx.lineTo(startX + Math.tan(angle) * h, h);
                const g = ctx.createLinearGradient(startX, 0, startX + Math.tan(angle) * h, h);
                g.addColorStop(0, i % 2 === 0 ? 'rgba(6, 182, 212, 0.65)' : 'rgba(217, 70, 239, 0.60)');
                g.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.strokeStyle = g;
                ctx.lineWidth = 2.5 + Math.sin(t * 2 + i) * 1.5;
                ctx.stroke();
            }

            animId = requestAnimationFrame(render3D);
        };

        render3D();
        return () => cancelAnimationFrame(animId);
    }, [phase]);

    return (
        <div 
            className="fixed inset-0 z-[99999] bg-[#000000] overflow-hidden flex flex-col justify-between font-sans text-white select-none"
            onClick={() => {
                const vid = videoRef.current;
                if (vid && vid.muted) {
                    vid.muted = false;
                    setIsMuted(false);
                }
            }}
        >
            {/* FASE 1: SOLO Y EXCLUSIVAMENTE EL VÍDEO A PANTALLA COMPLETA OSCURECIDO AL 75% DE TRANSPARENCIA */}
            {phase === 'video' && (
                <div className="absolute inset-0 w-full h-full bg-[#000000] overflow-hidden flex items-center justify-center">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={isMuted}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleVideoEnded}
                        src="/assets/intro_cinematic.mp4"
                        className={`w-full h-full object-cover pointer-events-none ${isBassShaking ? 'anim-bass-shake' : ''}`}
                        style={{ 
                            opacity: videoOpacity, 
                            transition: 'opacity 2000ms cubic-bezier(0.4, 0, 0.2, 1)' 
                        }}
                    />

                    {/* Botón sutil en esquina inferior derecha para saltar si el usuario lo desea */}
                    <div className="absolute bottom-6 right-6 z-50">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSkip(); }}
                            className="px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 hover:border-cyan-400 text-gray-400 hover:text-white text-xs font-mono font-bold tracking-wider transition-all cursor-pointer shadow-lg backdrop-blur-md"
                        >
                            Saltar ➔
                        </button>
                    </div>
                </div>
            )}

            {/* FASE 2: ENTRADA ESPECTACULAR SUAVE EN 3D DE NUESTRO LOGO REAL Y BOTONES DE LUJO */}
            {phase === 'portal' && (
                <div className="relative z-50 flex-1 flex flex-col justify-between p-6 sm:p-10 bg-[#000000] animate-fadeIn">
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-45" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.18),transparent_70%)] pointer-events-none" />

                    {/* Botón de cierre minimalista superior derecho */}
                    <div className="relative z-10 flex items-center justify-end">
                        <button
                            type="button"
                            onClick={() => handleAction('cabin')}
                            className="text-gray-500 hover:text-white font-mono text-base cursor-pointer transition-colors p-2"
                            title="Entrar a la cabina"
                        >
                            ✕
                        </button>
                    </div>

                    {/* CENTRO: ENTRADA CINEMÁTICA Y SUAVE DEL LOGOTIPO BEATWAVE PRO EN 3D */}
                    <div 
                        className="relative z-10 flex flex-col items-center justify-center my-auto text-center"
                        style={{ perspective: '1200px' }}
                    >
                        {/* WOOFER SUBWOOFER ÓPTICO 3D CON ENTRADA SUAVE */}
                        <div 
                            className="w-32 h-32 sm:w-40 sm:h-40 relative flex items-center justify-center anim-smooth-logo-entrance"
                            style={{ 
                                filter: 'drop-shadow(0 0 45px rgba(6,182,212,0.8))'
                            }}
                        >
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="portalSubMagnetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#252836" />
                                        <stop offset="45%" stopColor="#151722" />
                                        <stop offset="85%" stopColor="#0d0e15" />
                                        <stop offset="100%" stopColor="#050609" />
                                    </linearGradient>
                                    <linearGradient id="portalSubChromeGrad" x1="20%" y1="0%" x2="80%" y2="100%">
                                        <stop offset="0%" stopColor="#f8fafc" />
                                        <stop offset="35%" stopColor="#94a3b8" />
                                        <stop offset="70%" stopColor="#334155" />
                                        <stop offset="100%" stopColor="#0f172a" />
                                    </linearGradient>
                                    <linearGradient id="portalSubBasketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#2a2c3a" />
                                        <stop offset="50%" stopColor="#181a24" />
                                        <stop offset="100%" stopColor="#0c0d13" />
                                    </linearGradient>
                                    <radialGradient id="portalSubSurroundGrad" cx="42%" cy="38%" r="62%">
                                        <stop offset="0%" stopColor="#353748" />
                                        <stop offset="35%" stopColor="#222432" />
                                        <stop offset="75%" stopColor="#111219" />
                                        <stop offset="100%" stopColor="#07070b" />
                                    </radialGradient>
                                    <radialGradient id="portalSubConeGrad" cx="48%" cy="45%" r="55%">
                                        <stop offset="0%" stopColor="#05060a" />
                                        <stop offset="35%" stopColor="#0e1017" />
                                        <stop offset="75%" stopColor="#181a25" />
                                        <stop offset="100%" stopColor="#0a0b10" />
                                    </radialGradient>
                                    <radialGradient id="portalSubCapGrad" cx="44%" cy="40%" r="58%">
                                        <stop offset="0%" stopColor="#222533" />
                                        <stop offset="30%" stopColor="#12131b" />
                                        <stop offset="75%" stopColor="#06070a" />
                                        <stop offset="100%" stopColor="#020204" />
                                    </radialGradient>
                                </defs>

                                {/* Bloque posterior del motor e imán pesado */}
                                <g id="portal-sub-motor">
                                    <ellipse cx="14" cy="38" rx="10" ry="14" fill="#000000" opacity="0.6" transform="rotate(-14 14 38)" />
                                    <path d="M 8 23 C 13 21, 20 23, 22 28 L 22 41 C 20 46, 13 47, 8 43 Z" fill="url(#portalSubMagnetGrad)" stroke="#1a1c26" strokeWidth="0.8" />
                                    <ellipse cx="9" cy="33" rx="4.5" ry="10" fill="url(#portalSubChromeGrad)" stroke="#1e293b" strokeWidth="0.6" transform="rotate(-14 9 33)" />
                                    <ellipse cx="8.8" cy="33" rx="1.6" ry="3.8" fill="#050608" stroke="#334155" strokeWidth="0.5" transform="rotate(-14 8.8 33)" />
                                    <rect x="14" y="44" width="3" height="4.5" rx="1" fill="url(#portalSubChromeGrad)" stroke="#0f172a" strokeWidth="0.4" />
                                    <rect x="18" y="45.5" width="3" height="4.5" rx="1" fill="url(#portalSubChromeGrad)" stroke="#0f172a" strokeWidth="0.4" />
                                    <circle cx="15.5" cy="48" r="0.8" fill="#06b6d4" />
                                    <circle cx="19.5" cy="49.5" r="0.8" fill="#06b6d4" />
                                    <path d="M 18 24 L 28 14 L 32 17 L 21 27 Z" fill="url(#portalSubBasketGrad)" stroke="#222432" strokeWidth="0.6" />
                                    <path d="M 16 41 L 27 49 L 31 46 L 19 38 Z" fill="url(#portalSubBasketGrad)" stroke="#222432" strokeWidth="0.6" />
                                    <path d="M 17 32 L 25 32 L 26 35 L 18 35 Z" fill="#13141c" />
                                </g>

                                {/* Ondas de Choque Sónicas en Azul Cian */}
                                <g id="portal-sub-blastwaves">
                                    <path d="M 44 14 C 54 20, 54 38, 44 44" stroke="#06b6d4" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="1" />
                                    <path d="M 49 10 C 61 18, 61 40, 49 48" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85" />
                                    <path d="M 54 6 C 68 16, 68 42, 54 52" stroke="#67e8f9" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.65" />
                                </g>

                                {/* Aro frontal de fundición con pernos de montaje */}
                                <g id="portal-sub-rim">
                                    <ellipse cx="36" cy="29" rx="18" ry="23" fill="url(#portalSubBasketGrad)" stroke="#2f3244" strokeWidth="1.2" transform="rotate(-14 36 29)" />
                                    <ellipse cx="36" cy="29" rx="16" ry="20.8" fill="none" stroke="#161720" strokeWidth="1" transform="rotate(-14 36 29)" />
                                    <circle cx="37" cy="7" r="1.1" fill="#64748b" stroke="#0f172a" strokeWidth="0.4" />
                                    <circle cx="51.5" cy="18" r="1.1" fill="#64748b" stroke="#0f172a" strokeWidth="0.4" />
                                    <circle cx="53" cy="35" r="1.1" fill="#64748b" stroke="#0f172a" strokeWidth="0.4" />
                                    <circle cx="39" cy="51" r="1.1" fill="#64748b" stroke="#0f172a" strokeWidth="0.4" />
                                    <circle cx="23" cy="44" r="1.1" fill="#64748b" stroke="#0f172a" strokeWidth="0.4" />
                                    <circle cx="20.5" cy="20" r="1.1" fill="#64748b" stroke="#0f172a" strokeWidth="0.4" />
                                </g>

                                {/* Suspensión toroidal de goma sobredimensionada 3D */}
                                <g>
                                    <ellipse cx="36" cy="29" rx="14.8" ry="19.2" fill="url(#portalSubSurroundGrad)" stroke="#0e0f15" strokeWidth="1.4" transform="rotate(-14 36 29)" />
                                    <path d="M 28 13 C 39 8, 48 18, 50 31" stroke="#474b60" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5" />
                                </g>

                                {/* Cono profundo con nervaduras y bobina móvil cian */}
                                <g>
                                    <ellipse cx="36" cy="29" rx="12.2" ry="16" fill="url(#portalSubConeGrad)" stroke="#1a1c26" strokeWidth="0.8" transform="rotate(-14 36 29)" />
                                    <line x1="36" y1="14" x2="36" y2="21" stroke="#222533" strokeWidth="0.7" strokeLinecap="round" transform="rotate(-14 36 29)" />
                                    <line x1="36" y1="37" x2="36" y2="44" stroke="#222533" strokeWidth="0.7" strokeLinecap="round" transform="rotate(-14 36 29)" />
                                    <line x1="25" y1="29" x2="30" y2="29" stroke="#222533" strokeWidth="0.7" strokeLinecap="round" transform="rotate(-14 36 29)" />
                                    <line x1="42" y1="29" x2="47" y2="29" stroke="#222533" strokeWidth="0.7" strokeLinecap="round" transform="rotate(-14 36 29)" />
                                    <ellipse cx="36" cy="29" rx="7.4" ry="9.8" stroke="#06b6d4" strokeWidth="1.2" fill="none" opacity="0.95" transform="rotate(-14 36 29)" />
                                    <ellipse cx="36" cy="29" rx="5.8" ry="7.6" fill="url(#portalSubCapGrad)" stroke="#161822" strokeWidth="0.8" transform="rotate(-14 36 29)" />
                                    <path d="M 33 25 Q 36 23 39 26" stroke="#ffffff" strokeWidth="0.6" strokeLinecap="round" opacity="0.45" fill="none" />
                                    <circle cx="36" cy="29" r="1.4" fill="#06b6d4" className="animate-pulse" />
                                </g>
                            </svg>
                        </div>

                        {/* RÓTULO OFICIAL BEATWAVE PRO */}
                        <div className="flex items-center justify-center gap-3 mt-6">
                            <span className="text-4xl sm:text-6xl md:text-7xl font-black uppercase text-white tracking-wider drop-shadow-[0_0_40px_rgba(6,182,212,0.5)]" style={{ fontFamily: "'Syne', sans-serif" }}>
                                BEAT<span className="text-cyan-400 font-bold">WAVE</span>
                            </span>
                            <span className="text-xs sm:text-sm font-mono px-3 py-1 rounded-lg font-black tracking-widest border border-cyan-400/80 bg-cyan-950/90 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.7)]">
                                PRO
                            </span>
                        </div>

                        <span className="text-xs sm:text-sm font-mono tracking-widest uppercase text-gray-400 mt-2 font-bold flex items-center justify-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                            PRECISION AUDIO INTELLIGENCE
                        </span>

                        {/* BOTONES PRINCIPALES: "Log-In" / "Registrar" / "Tour" (DISEÑO HARDWARE LUXURY) */}
                        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-9 w-full max-w-2xl">
                            {/* Botón 1: Log-In */}
                            <button
                                type="button"
                                onClick={() => handleAction('login')}
                                className="group px-8 sm:px-10 py-4 rounded-2xl bg-gradient-to-b from-[#181c30] to-[#0b0d18] hover:from-[#222944] hover:to-[#121626] text-white border-2 border-cyan-500/70 hover:border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_45px_rgba(6,182,212,0.8)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center min-w-[170px]"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg text-cyan-300">🔐</span>
                                    <span className="font-mono font-black text-sm uppercase tracking-wider">Log-In</span>
                                </div>
                                <span className="text-[10px] font-mono text-cyan-300/80 uppercase mt-0.5 tracking-wider">Acceso DJ & Sesión</span>
                            </button>

                            {/* Botón 2: Registrar */}
                            <button
                                type="button"
                                onClick={() => handleAction('register')}
                                className="group px-8 sm:px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-2 border-fuchsia-400/90 shadow-[0_0_30px_rgba(217,70,239,0.5)] hover:shadow-[0_0_55px_rgba(217,70,239,0.9)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center min-w-[170px]"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">⚡</span>
                                    <span className="font-mono font-black text-sm uppercase tracking-wider">Registrar</span>
                                </div>
                                <span className="text-[10px] font-mono text-pink-200/90 uppercase mt-0.5 tracking-wider">Nueva Licencia Club</span>
                            </button>

                            {/* Botón 3: Tour */}
                            <button
                                type="button"
                                onClick={() => handleAction('tour')}
                                className="group px-8 sm:px-10 py-4 rounded-2xl bg-gradient-to-b from-[#14232c] to-[#0a1218] hover:from-[#1b313d] hover:to-[#0e1a22] text-teal-200 border-2 border-teal-500/70 hover:border-teal-400 shadow-[0_0_25px_rgba(20,184,166,0.3)] hover:shadow-[0_0_45px_rgba(20,184,166,0.7)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center min-w-[170px]"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg text-teal-300">🚀</span>
                                    <span className="font-mono font-black text-sm uppercase tracking-wider text-white">Tour</span>
                                </div>
                                <span className="text-[10px] font-mono text-teal-300/80 uppercase mt-0.5 tracking-wider">Masterclass & Guías</span>
                            </button>
                        </div>
                    </div>

                    {/* Barra Inferior */}
                    <div className="relative z-10 flex items-center justify-between text-xs font-mono text-gray-600 border-t border-zinc-900 pt-4">
                        <span>Pioneer CDJ-3000 • Serato • Rekordbox • Traktor Compatible</span>
                        <span>V2.4 STUDIO PRO</span>
                    </div>
                </div>
            )}
        </div>
    );
};"""

text = text[:s1] + cinematic_component + "\n\n" + text[s2:]

with open("web/js/app.jsx", "w", encoding="utf-8") as f:
    f.write(text)

print("SUCCESS: web/js/app.jsx updated cleanly with V3 intro specifications!")
