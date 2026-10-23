import re
import sys
import os

target_path = "web/index.html"
if not os.path.exists(target_path):
    print(f"[ERROR] No se encontró {target_path}.")
    sys.exit(1)

with open(target_path, "r", encoding="utf-8") as f:
    content = f.read()

# MOTOR CSS DEFINITIVO (Gama Cian/Blanco y Balística)
brand_css = """
        /* --- BEATWAVE PRO: DEFINITIVE MOTION ENGINE --- */
        /* CHROMATIC BARS (Estrictamente Cian y Blanco) */
        @keyframes chroma1 { 0%, 100% { fill: #22d3ee; } 50% { fill: #ffffff; } }
        @keyframes chroma2 { 0%, 100% { fill: #ffffff; } 50% { fill: #22d3ee; } }
        @keyframes chroma3 { 0%, 100% { fill: #22d3ee; } 50% { fill: #ffffff; } }
        @keyframes chroma4 { 0%, 100% { fill: #ffffff; } 50% { fill: #22d3ee; } }
        @keyframes chroma5 { 0%, 100% { fill: #22d3ee; } 50% { fill: #ffffff; } }

        /* BALÍSTICA BARRAS */
        @keyframes bounce1 { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(0.85); } }
        @keyframes bounce2 { 0%, 100% { transform: scaleY(0.6); } 50% { transform: scaleY(1.0); } }
        @keyframes bounce3 { 0%, 100% { transform: scaleY(0.9); } 50% { transform: scaleY(0.45); } }
        @keyframes bounce4 { 0%, 100% { transform: scaleY(0.5); } 50% { transform: scaleY(0.95); } }
        @keyframes bounce5 { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(0.75); } }

        .svg-bar { transform-box: fill-box; transform-origin: bottom; }
        .b1-epic { animation: bounce1 0.85s infinite cubic-bezier(0.16,1,0.3,1), chroma1 2.4s infinite; }
        .b2-epic { animation: bounce2 0.72s infinite cubic-bezier(0.16,1,0.3,1), chroma2 1.8s infinite; filter: drop-shadow(0 0 6px rgba(255,255,255,0.8)); }
        .b3-epic { animation: bounce3 0.96s infinite cubic-bezier(0.16,1,0.3,1), chroma3 2.8s infinite; }
        .b4-epic { animation: bounce4 0.65s infinite cubic-bezier(0.16,1,0.3,1), chroma4 1.2s infinite; filter: drop-shadow(0 0 8px rgba(6,182,212,0.6)); }
        .b5-epic { animation: bounce5 0.88s infinite cubic-bezier(0.16,1,0.3,1), chroma5 2.6s infinite; }

        .anim-soundwave {
            color: #ffffff;
            display: inline-block;
            filter: url(#waveDistortion);
        }
"""

if "b1-epic" not in content:
    content = content.replace("</head>", f"    <style>{brand_css}    </style>\n</head>")

# HEADER DEFINITIVO (Animación fractal limitada a 5 iteraciones)
header_regex = r'<header className="h-14[\s\S]*?</header>'

definitive_header = """<header className="h-14 border-b border-djzinc-800 bg-djzinc-950/90 backdrop-blur px-4 flex items-center justify-between shrink-0 z-30">
                        {/* MOTOR DE DISTORSIÓN FRACTAL (5 Iteraciones de 8 Segundos) */}
                        <svg width="0" height="0" className="absolute">
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

                        <div className="flex items-center gap-2">
                            <button onClick={() => setActiveTab('audit')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'audit' ? 'bg-djcyan-500 text-black shadow-lg shadow-djcyan-500/20' : 'text-gray-400 hover:text-white hover:bg-djzinc-900'}`}>
                                <Icons.Audit /> Auditoría & DSP
                            </button>
                            <button onClick={() => setActiveTab('spotify')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'spotify' ? 'bg-djcyan-500 text-black shadow-lg shadow-djcyan-500/20' : 'text-gray-400 hover:text-white hover:bg-djzinc-900'}`}>
                                <Icons.Spotify /> Spotify Ingest
                            </button>
                            <button onClick={() => setActiveTab('taxonomy')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'taxonomy' ? 'bg-djcyan-500 text-black shadow-lg shadow-djcyan-500/20' : 'text-gray-400 hover:text-white hover:bg-djzinc-900'}`}>
                                <Icons.Folder /> Serato Crates
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-djzinc-900 border border-djzinc-800 text-[11px] font-mono text-gray-400">
                                <span className="w-2 h-2 rounded-full bg-djgreen-400 animate-pulse"></span>
                                DSP ENGINE ONLINE
                            </div>
                        </div>
                    </header>"""

content = re.sub(header_regex, definitive_header, content, count=1)

with open(target_path, "w", encoding="utf-8") as f:
    f.write(content)

print("[OK] Identidad BEATWAVE PRO inyectada correctamente.")
