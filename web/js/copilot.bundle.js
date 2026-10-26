const { useState, useEffect, useRef } = React;
function LiveCopilotApp() {
  const [state, setState] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [clock, setClock] = useState("");
  const [latency, setLatency] = useState(2);
  const [errorCount, setErrorCount] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      const now = /* @__PURE__ */ new Date();
      setClock(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1e3);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      const t0 = performance.now();
      try {
        const res = await fetch("/api/copilot/status");
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
        if (isMounted) setErrorCount((prev) => prev + 1);
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
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
      });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {
      });
    }
  };
  const toggleSimulation = async () => {
    try {
      const res = await fetch("/api/copilot/toggle_simulation", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (e) {
    }
  };
  if (!state) {
    return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center min-h-screen gap-4 bg-[#040407]" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-full border-4 border-djcyan-500/20 border-t-djcyan-400 animate-spin" }), /* @__PURE__ */ React.createElement("p", { className: "font-mono text-xs text-djcyan-400 uppercase tracking-widest animate-pulse" }, "Sincronizando con Serato DJ Pro & BeatWave DSP..."));
  }
  const { deck_1, deck_2, anti_muddy, harmonic, recommendations, local_ip } = state;
  const companionUrl = `http://${local_ip || "127.0.0.1"}:8000/copilot.html`;
  return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-h-screen p-3 sm:p-5 lg:p-6 select-none bg-[#040407] text-gray-200" }, /* @__PURE__ */ React.createElement("header", { className: "flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-800/80 mb-4 sm:mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: `w-3 h-3 rounded-full ${state.source === "SERATO_LIVE" ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse" : "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"}` }), /* @__PURE__ */ React.createElement("h1", { className: "font-syne font-black text-lg sm:text-2xl text-white tracking-wider uppercase" }, "BEATWAVE ", /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400" }, "COPILOT"))), /* @__PURE__ */ React.createElement("span", { className: "hidden md:inline-block px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-700/60 font-mono text-[11px] text-zinc-300" }, state.source === "SERATO_LIVE" ? "SERATO LINK ACTIVO" : "MODO SIMULACI\xD3N"), /* @__PURE__ */ React.createElement("span", { className: "hidden lg:inline-block font-mono text-[11px] text-zinc-500" }, "LATENCIA: ", /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400 font-bold" }, latency, "ms"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 sm:gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "font-mono text-sm sm:text-base font-bold text-white bg-zinc-900/90 px-3 py-1 rounded-xl border border-zinc-800 shadow-inner" }, clock || state.last_updated), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: toggleSimulation,
      className: `px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer border ${state.source === "SIMULATION_MODE" ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]" : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-700/60"}`,
      title: "Alternar entre lectura real de Serato o simulaci\xF3n de pistas"
    },
    "\u{1F9EA} ",
    state.source === "SIMULATION_MODE" ? "Simulando" : "Simular"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setQrModalOpen(true),
      className: "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-mono font-bold text-djcyan-400 bg-djcyan-950/40 hover:bg-djcyan-900/50 border border-djcyan-500/40 uppercase transition-all cursor-pointer shadow-sm",
      title: "Mostrar enlace y c\xF3digo QR para conectar iPad o m\xF3vil en cabina"
    },
    "\u{1F4F1} Conectar iPad"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: toggleFullscreen,
      className: "p-1.5 sm:p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 cursor-pointer transition-all",
      title: "Alternar Pantalla Completa (F11)"
    },
    /* @__PURE__ */ React.createElement("svg", { className: "w-4 h-4 sm:w-5 sm:h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" }))
  ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6" }, /* @__PURE__ */ React.createElement(DeckCard, { deck: deck_1, side: "A", isMaster: deck_1.is_master }), /* @__PURE__ */ React.createElement(DeckCard, { deck: deck_2, side: "B", isMaster: deck_2.is_master })), /* @__PURE__ */ React.createElement("section", { className: "mb-4 sm:mb-6" }, /* @__PURE__ */ React.createElement("div", { className: `p-4 sm:p-5 rounded-2xl border transition-all ${anti_muddy.status === "danger" ? "bg-red-950/25 border-red-500/80 animate-danger-pulse" : anti_muddy.status === "warning" ? "bg-amber-950/25 border-amber-500/80 animate-warning-pulse" : "bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl sm:text-2xl" }, anti_muddy.status === "danger" ? "\u{1F6E1}\uFE0F" : anti_muddy.status === "warning" ? "\u26A1" : "\u{1F7E2}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "font-syne font-black text-base sm:text-lg text-white tracking-wide" }, anti_muddy.title), /* @__PURE__ */ React.createElement("p", { className: "text-xs sm:text-sm text-zinc-300 mt-0.5" }, anti_muddy.message))), /* @__PURE__ */ React.createElement("span", { className: `self-start md:self-auto px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider shrink-0 ${anti_muddy.status === "danger" ? "bg-red-600 text-white" : anti_muddy.status === "warning" ? "bg-amber-500 text-black" : "bg-emerald-500 text-black"}` }, anti_muddy.tag)), /* @__PURE__ */ React.createElement("div", { className: "mt-3 pt-3 border-t border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-zinc-300" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold" }, "\u{1F449} ACCI\xD3N T\xC1CTICA:"), /* @__PURE__ */ React.createElement("span", null, anti_muddy.action)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 text-zinc-400" }, /* @__PURE__ */ React.createElement("span", null, "CAMELOT: ", /* @__PURE__ */ React.createElement("strong", { style: { color: harmonic.color } }, harmonic.badge)), /* @__PURE__ */ React.createElement("span", null, "\u0394 LUFS: ", /* @__PURE__ */ React.createElement("strong", { className: "text-white" }, state.lufs_delta > 0 ? `+${state.lufs_delta}` : state.lufs_delta, " dB")))))), /* @__PURE__ */ React.createElement("section", { className: "mt-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-3" }, /* @__PURE__ */ React.createElement("h3", { className: "font-syne font-bold text-xs sm:text-sm text-zinc-400 uppercase tracking-wider flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4A1} PR\xD3XIMAS PISTAS SUGERIDAS (RESCATE & PROGRESI\xD3N)")), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono text-zinc-500" }, "Filtrado por Rueda Camelot & Anti-Muddy")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4" }, recommendations.map((rec, idx) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: rec.id || idx,
      className: "p-3.5 rounded-2xl bg-[#090912] border border-zinc-800/80 hover:border-djcyan-500/50 transition-all shadow-md group relative overflow-hidden"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-2 mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "span",
      {
        className: "w-8 h-8 rounded-xl flex items-center justify-center font-orbitron font-black text-xs text-black shadow-md shrink-0",
        style: { backgroundColor: rec.camelot_color }
      },
      rec.camelot
    ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "font-syne font-bold text-sm text-white group-hover:text-djcyan-300 transition-colors line-clamp-1" }, rec.title), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-zinc-400 line-clamp-1 font-mono" }, rec.artist))), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-mono font-bold text-zinc-300 uppercase shrink-0" }, rec.bpm, " BPM")),
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] font-mono text-zinc-400 mt-2 pt-2 border-t border-zinc-800/60" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-semibold" }, rec.strategy), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-500" }, "Sub: ", rec.low_ratio, "%")),
    /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-zinc-400 mt-1 line-clamp-2" }, rec.reason)
  )))), qrModalOpen && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" }, /* @__PURE__ */ React.createElement("div", { className: "p-6 max-w-md w-full bg-[#0a0a14] rounded-3xl border border-djcyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.3)]" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, "\u{1F4F1}"), /* @__PURE__ */ React.createElement("h3", { className: "font-syne font-black text-lg text-white" }, "CONECTAR IPAD / TABLET")), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setQrModalOpen(false),
      className: "p-1 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 cursor-pointer"
    },
    "\u2715"
  )), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-zinc-300 mb-4 leading-relaxed" }, "Conecta tu iPad o tel\xE9fono a la misma red Wi-Fi de cabina y entra a este enlace:"), /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-black rounded-2xl border border-zinc-800 font-mono text-center text-sm font-bold text-djcyan-400 break-all select-all mb-4" }, companionUrl), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center p-4 bg-white rounded-2xl w-48 h-48 mx-auto mb-4 shadow-xl" }, /* @__PURE__ */ React.createElement(
    "img",
    {
      src: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(companionUrl)}`,
      alt: "C\xF3digo QR para iPad",
      className: "w-40 h-40 object-contain"
    }
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        navigator.clipboard.writeText(companionUrl);
        alert("Enlace copiado al portapapeles: " + companionUrl);
      },
      className: "w-full py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-djcyan-400 to-djcyan-500 text-black shadow-lg hover:brightness-110 active:scale-98 transition-all cursor-pointer"
    },
    "\u{1F4CB} Copiar Enlace Directo"
  ))));
}
function DeckCard({ deck, side, isMaster }) {
  return /* @__PURE__ */ React.createElement("div", { className: `p-4 sm:p-5 rounded-3xl border transition-all relative overflow-hidden ${isMaster ? "bg-gradient-to-b from-[#0c0d1c] to-[#06060c] border-djcyan-500/70 shadow-[0_0_30px_rgba(6,182,212,0.25)]" : "bg-[#07070f] border-zinc-800 hover:border-zinc-700"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "font-orbitron font-black text-sm sm:text-base text-zinc-400" }, "DECK ", deck.deck_num || side), /* @__PURE__ */ React.createElement("span", { className: `px-2.5 py-0.5 rounded-full font-mono text-[10px] font-black uppercase tracking-wider ${isMaster ? "bg-djcyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse" : "bg-zinc-800 text-zinc-300"}` }, isMaster ? "\u{1F50A} MASTER (ON AIR)" : "\u{1F3A7} EN CUE (PREPARADO)")), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-xs text-zinc-500 uppercase" }, deck.is_audited ? "\u2713 DSP BEATWAVE" : "DEFAULT DSP")), /* @__PURE__ */ React.createElement("div", { className: "mb-4" }, /* @__PURE__ */ React.createElement("h2", { className: "font-syne font-black text-xl sm:text-2xl lg:text-3xl text-white tracking-wide leading-tight line-clamp-1" }, deck.title), /* @__PURE__ */ React.createElement("p", { className: "font-syne font-bold text-sm sm:text-base text-zinc-400 mt-0.5 line-clamp-1" }, deck.artist)), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3 mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-zinc-800/80" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-orbitron font-black text-lg sm:text-xl text-black shadow-[0_0_15px_rgba(0,0,0,0.8)] shrink-0",
      style: { backgroundColor: deck.camelot_color }
    },
    deck.camelot
  ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-[10px] font-mono uppercase text-zinc-500 tracking-wider" }, "Tonalidad"), /* @__PURE__ */ React.createElement("div", { className: "font-syne font-bold text-sm sm:text-base text-white" }, deck.raw_key || deck.camelot))), /* @__PURE__ */ React.createElement("div", { className: "p-3 rounded-2xl bg-black/40 border border-zinc-800/80 flex flex-col justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-[10px] font-mono uppercase text-zinc-500 tracking-wider" }, "Tempo Estricto"), /* @__PURE__ */ React.createElement("div", { className: "font-orbitron font-black text-xl sm:text-2xl text-white" }, deck.bpm ? Number(deck.bpm).toFixed(2) : "130.00", " ", /* @__PURE__ */ React.createElement("span", { className: "text-xs font-normal text-zinc-400" }, "BPM")))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 pt-2 border-t border-zinc-800/60 font-mono text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-zinc-400" }, /* @__PURE__ */ React.createElement("span", null, "Densidad Sub-Graves (Sub-Bass)"), /* @__PURE__ */ React.createElement("span", { className: deck.low_ratio >= 44 ? "text-red-400 font-bold" : "text-zinc-200" }, deck.low_ratio, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-zinc-900 rounded-full h-2 overflow-hidden flex" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `h-full transition-all duration-300 ${deck.low_ratio >= 44 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-djcyan-400"}`,
      style: { width: `${Math.min(100, deck.low_ratio * 1.5)}%` }
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] text-zinc-500 pt-1" }, /* @__PURE__ */ React.createElement("span", null, "Medios: ", deck.mid_ratio, "%"), /* @__PURE__ */ React.createElement("span", null, "Agudos: ", deck.high_ratio, "%"), /* @__PURE__ */ React.createElement("span", null, "LUFS: ", /* @__PURE__ */ React.createElement("strong", { className: "text-zinc-300" }, deck.lufs, " dB")))));
}
if (document.getElementById("copilot-root")) {
  ReactDOM.render(/* @__PURE__ */ React.createElement(LiveCopilotApp, null), document.getElementById("copilot-root"));
}
window.LiveCopilotApp = LiveCopilotApp;
window.DeckCard = DeckCard;
