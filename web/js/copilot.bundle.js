const { useState, useEffect, useRef } = React;
const DEFAULT_VINYL_SVG = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="12" fill="#0d0d14"/><circle cx="80" cy="80" r="58" fill="#14141f" stroke="#27273a" stroke-width="2"/><circle cx="80" cy="80" r="44" fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/><circle cx="80" cy="80" r="30" fill="none" stroke="#3b82f6" stroke-width="1.5" opacity="0.5"/><circle cx="80" cy="80" r="14" fill="#06b6d4"/><circle cx="80" cy="80" r="5" fill="#09090b"/></svg>');
function getValidCover(c) {
  if (!c || typeof c !== "string") return DEFAULT_VINYL_SVG;
  if (c.startsWith("data:") || c.startsWith("http://") || c.startsWith("https://") || c.startsWith("/")) return c;
  return "https://i.scdn.co/image/" + c;
}
const PlatformSeratoLogo = ({ size = 20, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 32 32", fill: "none", xmlns: "http://www.w3.org/2000/svg", className }, /* @__PURE__ */ React.createElement("rect", { width: "32", height: "32", rx: "7", fill: "#021a24" }), /* @__PURE__ */ React.createElement("path", { d: "M7 21.5L12.5 9H16.5L11 21.5H7Z", fill: "#00d1e8" }), /* @__PURE__ */ React.createElement("path", { d: "M14 23L19.5 10.5H23.5L18 23H14Z", fill: "#00d1e8" }), /* @__PURE__ */ React.createElement("path", { d: "M21 21.5L24.5 13.5H27.5L24 21.5H21Z", fill: "#22d3ee", fillOpacity: "0.8" }), /* @__PURE__ */ React.createElement("circle", { cx: "26", cy: "23", r: "1.5", fill: "#00d1e8" }));
const PlatformRekordboxLogo = ({ size = 20, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 32 32", fill: "none", xmlns: "http://www.w3.org/2000/svg", className }, /* @__PURE__ */ React.createElement("rect", { width: "32", height: "32", rx: "7", fill: "#091b33" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "9", stroke: "#38bdf8", strokeWidth: "2", strokeDasharray: "3 1.5" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "5", stroke: "#00e5ff", strokeWidth: "1.8" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "2", fill: "#38bdf8" }), /* @__PURE__ */ React.createElement("path", { d: "M16 4V8M16 24V28M4 16H8M24 16H28", stroke: "#00e5ff", strokeWidth: "1.5", strokeLinecap: "round" }));
const PlatformVirtualDjLogo = ({ size = 20, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 32 32", fill: "none", xmlns: "http://www.w3.org/2000/svg", className }, /* @__PURE__ */ React.createElement("rect", { width: "32", height: "32", rx: "7", fill: "#2a1202" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "10", stroke: "#f97316", strokeWidth: "1.6" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "6.5", stroke: "#fb923c", strokeWidth: "0.8", strokeDasharray: "1.5 1.5" }), /* @__PURE__ */ React.createElement("text", { x: "16", y: "19", textAnchor: "middle", fill: "#ffedd5", fontSize: "8", fontWeight: "900", fontFamily: "system-ui, sans-serif", letterSpacing: "0.5" }, "VDJ"));
const PlatformTraktorLogo = ({ size = 20, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 32 32", fill: "none", xmlns: "http://www.w3.org/2000/svg", className }, /* @__PURE__ */ React.createElement("rect", { width: "32", height: "32", rx: "7", fill: "#241a02" }), /* @__PURE__ */ React.createElement("rect", { x: "7", y: "8", width: "18", height: "4", rx: "1", fill: "#facc15" }), /* @__PURE__ */ React.createElement("path", { d: "M13.5 12H18.5V23.5C18.5 24.3 17.8 25 17 25H15C14.2 25 13.5 24.3 13.5 23.5V12Z", fill: "#facc15" }), /* @__PURE__ */ React.createElement("circle", { cx: "22", cy: "19", r: "2", fill: "#eab308" }));
const PlatformAutoLogo = ({ size = 20, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 32 32", fill: "none", xmlns: "http://www.w3.org/2000/svg", className }, /* @__PURE__ */ React.createElement("rect", { width: "32", height: "32", rx: "7", fill: "#1e0c2e" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "9", stroke: "#a855f7", strokeWidth: "1.5", strokeDasharray: "3 2" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "5", stroke: "#c084fc", strokeWidth: "1.5" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "2", fill: "#e9d5ff" }), /* @__PURE__ */ React.createElement("path", { d: "M16 6L18.5 10.5L16 9.2L13.5 10.5L16 6Z", fill: "#a855f7" }), /* @__PURE__ */ React.createElement("path", { d: "M16 26L13.5 21.5L16 22.8L18.5 21.5L16 26Z", fill: "#a855f7" }));
const PlatformLogos = {
  auto: PlatformAutoLogo,
  serato: PlatformSeratoLogo,
  rekordbox: PlatformRekordboxLogo,
  virtualdj: PlatformVirtualDjLogo,
  traktor: PlatformTraktorLogo
};
const renderPlatformLogo = (id, size = 20, className = "") => {
  const key = (id || "auto").toLowerCase();
  const Comp = PlatformLogos[key] || PlatformLogos.auto;
  return /* @__PURE__ */ React.createElement(Comp, { size, className });
};
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
  const setPlatform = async (plat) => {
    try {
      const res = await fetch("/api/copilot/set_platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: plat })
      });
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (e) {
    }
  };
  if (!state) {
    return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center min-h-screen gap-4 bg-[#040407]" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-full border-4 border-djcyan-500/20 border-t-djcyan-400 animate-spin" }), /* @__PURE__ */ React.createElement("p", { className: "font-mono text-xs text-djcyan-400 uppercase tracking-widest animate-pulse" }, "Sincronizando con suites DJ (Serato, Rekordbox, VDJ, Traktor) & BeatWave DSP..."));
  }
  const { deck_1, deck_2, anti_muddy, harmonic, recommendations, local_ip, platform, platform_mode, platform_name, platform_icon, platform_color, platform_status } = state;
  const companionUrl = `http://${local_ip || "127.0.0.1"}:8000/copilot.html`;
  const platformsList = [
    { id: "auto", label: "Auto", color: "#a855f7" },
    { id: "serato", label: "Serato", color: "#00d1e8" },
    { id: "rekordbox", label: "Rekordbox", color: "#38bdf8" },
    { id: "virtualdj", label: "VirtualDJ", color: "#f97316" },
    { id: "traktor", label: "Traktor", color: "#facc15" }
  ];
  const isLive = state.source && state.source.endsWith("_LIVE");
  const isStandby = state.source && state.source.endsWith("_STANDBY");
  return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-h-screen p-3 sm:p-5 lg:p-6 select-none bg-[#040407] text-gray-200" }, /* @__PURE__ */ React.createElement("header", { className: "flex flex-col md:flex-row md:items-center justify-between pb-3 sm:pb-4 border-b border-zinc-800/80 mb-4 sm:mb-6 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: `w-3.5 h-3.5 rounded-full ${isLive ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse" : isStandby ? "bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)] animate-pulse" : "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"}` }), /* @__PURE__ */ React.createElement("h1", { className: "font-syne font-black text-lg sm:text-2xl text-white tracking-wider uppercase" }, "BEATWAVE ", /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400" }, "COPILOT"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700/60 font-mono text-xs" }, renderPlatformLogo(platform || "serato", 16), /* @__PURE__ */ React.createElement("strong", { style: { color: platform_color || "#00d1e8" } }, platform_name || "DJ LINK"), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-600" }, "|"), /* @__PURE__ */ React.createElement("span", { className: isLive ? "text-red-400 font-bold" : isStandby ? "text-blue-400" : "text-amber-400 font-bold" }, platform_status || (isLive ? "LIVE" : "STANDBY"))), /* @__PURE__ */ React.createElement("span", { className: "hidden xl:inline-block font-mono text-[11px] text-zinc-500" }, "LATENCIA: ", /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400 font-bold" }, latency, "ms"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 sm:gap-3 flex-wrap justify-between md:justify-end" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center p-1 bg-zinc-950/90 rounded-xl border border-zinc-800/90 shadow-inner" }, platformsList.map((p) => {
    const isSelected = platform_mode === p.id || platform_mode === "auto" && p.id === "auto";
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: p.id,
        type: "button",
        onClick: () => setPlatform(p.id),
        className: `flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${isSelected ? "bg-zinc-800 text-white shadow-md border border-zinc-600" : "text-zinc-400 hover:text-zinc-200"}`,
        style: isSelected ? { color: p.color, borderColor: `${p.color}66` } : {},
        title: `Conectar con ${p.label}`
      },
      renderPlatformLogo(p.id, 16),
      /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline text-[11px]" }, p.label)
    );
  })), /* @__PURE__ */ React.createElement("div", { className: "font-mono text-sm sm:text-base font-bold text-white bg-zinc-900/90 px-3 py-1 rounded-xl border border-zinc-800 shadow-inner" }, clock || state.last_updated), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: toggleSimulation,
      className: `px-2.5 sm:px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer border ${state.source === "SIMULATION_MODE" ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]" : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-700/60"}`,
      title: "Alternar entre lectura real del software DJ o simulaci\xF3n de pistas"
    },
    "\u{1F9EA} ",
    state.source === "SIMULATION_MODE" ? "Simulando" : "Simular"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setQrModalOpen(true),
      className: "px-2.5 sm:px-3 py-1 rounded-xl text-xs font-mono font-bold text-djcyan-400 bg-djcyan-950/40 hover:bg-djcyan-900/50 border border-djcyan-500/40 uppercase transition-all cursor-pointer shadow-sm",
      title: "Mostrar enlace y c\xF3digo QR para conectar iPad o m\xF3vil en cabina"
    },
    "\u{1F4F1} iPad"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: toggleFullscreen,
      className: "p-1.5 sm:p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 cursor-pointer transition-all",
      title: "Alternar Pantalla Completa (F11)"
    },
    /* @__PURE__ */ React.createElement("svg", { className: "w-4 h-4 sm:w-5 sm:h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" }))
  ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6" }, /* @__PURE__ */ React.createElement(DeckCard, { deck: deck_1, side: "A", isMaster: deck_1.is_master }), /* @__PURE__ */ React.createElement(DeckCard, { deck: deck_2, side: "B", isMaster: deck_2.is_master })), /* @__PURE__ */ React.createElement("section", { className: "mb-4 sm:mb-6" }, /* @__PURE__ */ React.createElement("div", { className: `p-4 sm:p-5 rounded-2xl border transition-all ${anti_muddy.status === "danger" ? "bg-red-950/25 border-red-500/80 animate-danger-pulse" : anti_muddy.status === "warning" ? "bg-amber-950/25 border-amber-500/80 animate-warning-pulse" : "bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl sm:text-2xl" }, anti_muddy.status === "danger" ? "\u{1F6E1}\uFE0F" : anti_muddy.status === "warning" ? "\u26A1" : "\u{1F7E2}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "font-syne font-black text-base sm:text-lg text-white tracking-wide" }, anti_muddy.title), /* @__PURE__ */ React.createElement("p", { className: "text-xs sm:text-sm text-zinc-300 mt-0.5" }, anti_muddy.message))), /* @__PURE__ */ React.createElement("div", { className: "px-3.5 py-1.5 rounded-xl bg-black/60 border border-zinc-700/60 font-mono text-xs flex items-center gap-2 self-start md:self-auto" }, /* @__PURE__ */ React.createElement("span", { className: "text-zinc-500 uppercase tracking-wider" }, "ACCI\xD3N:"), /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold" }, anti_muddy.action))), /* @__PURE__ */ React.createElement("div", { className: "pt-3 mt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-zinc-400" }, "Transici\xF3n Arm\xF3nica:"), /* @__PURE__ */ React.createElement(
    "span",
    {
      className: "px-2 py-0.5 rounded-lg font-bold text-black uppercase text-[10px]",
      style: { backgroundColor: harmonic.color || "#06b6d4" }
    },
    harmonic.badge
  ), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-300 font-sans" }, harmonic.label)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4 text-zinc-400" }, /* @__PURE__ */ React.createElement("div", null, "\u0394 LUFS: ", /* @__PURE__ */ React.createElement("strong", { className: Math.abs(state.lufs_delta) > 3 ? "text-amber-400" : "text-emerald-400" }, state.lufs_delta > 0 ? `+${state.lufs_delta}` : state.lufs_delta, " dB")), /* @__PURE__ */ React.createElement("div", null, "\u0394 BPM: ", /* @__PURE__ */ React.createElement("strong", { className: "text-white" }, state.bpm_delta > 0 ? `+${state.bpm_delta}` : state.bpm_delta, " (", state.bpm_pct > 0 ? `+${state.bpm_pct}` : state.bpm_pct, "%)")))))), /* @__PURE__ */ React.createElement("section", { className: "mt-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-base" }, "\u{1F3AF}"), /* @__PURE__ */ React.createElement("h3", { className: "font-syne font-black text-xs sm:text-sm uppercase tracking-wider text-zinc-300" }, "Sugerencias T\xE1cticas Compatibles (Anti-Muddy & Camelot)")), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono text-zinc-500" }, "FILTRADAS DE TU BIBLIOTECA AUDITADA")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3" }, recommendations && recommendations.map((rec) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: rec.id,
      className: "p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 hover:border-djcyan-500/50 hover:bg-zinc-900/60 transition-all flex flex-col justify-between group"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3 mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-zinc-700/60 bg-black" }, /* @__PURE__ */ React.createElement(
      "img",
      {
        src: getValidCover(rec.cover),
        alt: "Cover",
        onError: (e) => {
          e.target.onerror = null;
          e.target.src = DEFAULT_VINYL_SVG;
        },
        className: "w-full h-full object-cover"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-1" }, /* @__PURE__ */ React.createElement("div", { className: "font-syne font-bold text-sm text-white group-hover:text-djcyan-400 transition-colors truncate" }, rec.title), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "px-2 py-0.5 rounded-lg font-orbitron font-bold text-xs text-black shrink-0",
        style: { backgroundColor: rec.camelot_color }
      },
      rec.camelot
    )), /* @__PURE__ */ React.createElement("div", { className: "font-syne text-xs text-zinc-400 truncate" }, rec.artist), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-1 text-[10px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold" }, rec.bpm, " BPM"), rec.genre && /* @__PURE__ */ React.createElement("span", { className: "text-zinc-500 truncate" }, "\u2022 ", rec.genre), rec.energy && /* @__PURE__ */ React.createElement("span", { className: "text-amber-400 font-bold shrink-0" }, "\u26A1", rec.energy, "%")))),
    /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-zinc-400 font-mono mb-2 line-clamp-2" }, rec.reason),
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between pt-2 border-t border-zinc-800/60 font-mono text-[10px] text-zinc-500" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold uppercase" }, rec.strategy), /* @__PURE__ */ React.createElement("span", null, "Sub: ", rec.low_ratio, "%"), /* @__PURE__ */ React.createElement("span", null, rec.lufs, " dB"))
  )))), qrModalOpen && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setQrModalOpen(false),
      className: "absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800 transition-colors"
    },
    "\u2715"
  ), /* @__PURE__ */ React.createElement("h3", { className: "font-syne font-black text-xl text-white mb-1 uppercase tracking-wide" }, "Conectar iPad en Cabina"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-zinc-400 font-mono mb-4" }, "Escanea con la c\xE1mara de tu tablet o m\xF3vil estando conectado al mismo Wi-Fi:"), /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-white rounded-2xl shadow-lg mb-4" }, /* @__PURE__ */ React.createElement(
    "img",
    {
      src: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(companionUrl)}`,
      alt: "C\xF3digo QR iPad",
      className: "w-44 h-44 object-contain"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs text-djcyan-400 font-bold break-all select-all mb-4" }, companionUrl), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        navigator.clipboard.writeText(companionUrl);
        setQrModalOpen(false);
      },
      className: "w-full py-2.5 rounded-xl bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono text-xs font-bold uppercase transition-all shadow-md cursor-pointer"
    },
    "Copiar Enlace Directo"
  ))));
}
function DeckCard({ deck, side, isMaster }) {
  if (!deck) return null;
  return /* @__PURE__ */ React.createElement("div", { className: `p-4 sm:p-5 lg:p-6 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${isMaster ? "bg-gradient-to-b from-[#0c0d1c] to-[#06060c] border-djcyan-500/70 shadow-[0_0_30px_rgba(6,182,212,0.25)]" : "bg-[#07070f] border-zinc-800 hover:border-zinc-700"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/60" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "font-orbitron font-black text-base sm:text-lg text-zinc-400" }, "DECK ", side), /* @__PURE__ */ React.createElement("span", { className: `px-2.5 py-0.5 rounded-full font-mono text-[10px] font-black uppercase tracking-wider ${isMaster ? "bg-djcyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse" : "bg-zinc-800 text-zinc-300"}` }, isMaster ? "\u{1F50A} MASTER (ON AIR)" : "\u{1F3A7} EN CUE (PREPARADO)"), deck.phase && /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline-flex px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/40 text-[10px] font-mono font-bold text-purple-300 uppercase" }, "\u2728 ", deck.phase)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 font-mono text-xs text-zinc-500 uppercase" }, deck.format && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/60 text-[10px] font-bold text-zinc-300" }, deck.format), /* @__PURE__ */ React.createElement("span", null, deck.is_audited ? "\u2713 DSP BEATWAVE" : "DEFAULT DSP"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3.5 mb-3.5" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-18 h-18 sm:w-22 sm:h-22 rounded-2xl overflow-hidden shrink-0 border border-zinc-700/70 shadow-lg bg-black group" }, /* @__PURE__ */ React.createElement(
    "img",
    {
      src: getValidCover(deck.cover),
      alt: "Car\xE1tula",
      onError: (e) => {
        e.target.onerror = null;
        e.target.src = DEFAULT_VINYL_SVG;
      },
      className: "w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" }), deck.duration && /* @__PURE__ */ React.createElement("span", { className: "absolute bottom-1 right-1.5 px-1.5 py-0.2 rounded bg-black/85 text-[9px] font-mono font-bold text-zinc-300" }, deck.duration), deck.year && /* @__PURE__ */ React.createElement("span", { className: "absolute top-1 left-1.5 px-1 py-0.2 rounded bg-black/75 text-[9px] font-mono text-zinc-400" }, deck.year)), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("h2", { className: "font-syne font-black text-xl sm:text-2xl lg:text-3xl text-white tracking-wide leading-tight line-clamp-1", title: deck.title }, deck.title), /* @__PURE__ */ React.createElement("p", { className: "font-syne font-bold text-sm sm:text-base text-zinc-400 mt-0.5 line-clamp-1", title: deck.artist }, deck.artist), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 flex-wrap mt-1.5" }, deck.genre && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded-md bg-djcyan-950/60 border border-djcyan-500/40 text-[10px] font-mono font-bold text-djcyan-300" }, deck.genre), deck.subgenre && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700/60 text-[10px] font-mono text-zinc-400" }, deck.subgenre)))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 p-2.5 rounded-2xl bg-black/40 border border-zinc-800/80" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-orbitron font-black text-base sm:text-lg text-black shadow-lg shrink-0",
      style: { backgroundColor: deck.camelot_color }
    },
    deck.camelot
  ), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "text-[9px] font-mono uppercase text-zinc-500 tracking-wider" }, "Tonalidad"), /* @__PURE__ */ React.createElement("div", { className: "font-syne font-bold text-xs sm:text-sm text-white truncate" }, deck.raw_key || deck.camelot))), /* @__PURE__ */ React.createElement("div", { className: "p-2.5 rounded-2xl bg-black/40 border border-zinc-800/80 flex flex-col justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-[9px] font-mono uppercase text-zinc-500 tracking-wider" }, "Tempo Estricto"), /* @__PURE__ */ React.createElement("div", { className: "font-orbitron font-black text-lg sm:text-xl text-white" }, deck.bpm ? Number(deck.bpm).toFixed(2) : "130.00", " ", /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-normal text-zinc-400 font-mono" }, "BPM"))), /* @__PURE__ */ React.createElement("div", { className: "col-span-2 sm:col-span-1 p-2 rounded-2xl bg-black/40 border border-zinc-800/80 flex flex-col justify-center gap-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[10px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-amber-400 font-bold flex items-center gap-1" }, "\u26A1 ENERG\xCDA"), /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold" }, deck.energy || 90, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full", style: { width: `${deck.energy || 90}%` } })), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[10px] font-mono pt-0.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-purple-400 font-bold flex items-center gap-1" }, "\u{1F57A} GROOVE"), /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold" }, deck.danceability || 88, "%")))), /* @__PURE__ */ React.createElement("div", { className: "mb-3 p-2.5 rounded-2xl bg-black/60 border border-zinc-800/80" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono uppercase text-zinc-400 tracking-wider font-bold flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-djcyan-400" }), " 8 HOT CUES DE CABINA"), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono text-zinc-500" }, "Puntos de Salto & Estructura")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-4 sm:grid-cols-8 gap-1.5" }, (deck.cues || [
    { id: 1, name: "Downbeat", color: "#ef4444", time: "00:00" },
    { id: 2, name: "Intro", color: "#f97316", time: "01:04" },
    { id: 3, name: "Bass In", color: "#eab308", time: "02:08" },
    { id: 4, name: "MAIN DROP", color: "#10b981", time: "03:12" },
    { id: 5, name: "Break", color: "#06b6d4", time: "04:16" },
    { id: 6, name: "Climax", color: "#3b82f6", time: "05:04" },
    { id: 7, name: "Outro 32b", color: "#8b5cf6", time: "06:08" },
    { id: 8, name: "Cut / Fade", color: "#ec4899", time: "07:15" }
  ]).map((cue, cIdx) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: cue.id || cIdx,
      className: "p-1 rounded-xl border flex flex-col justify-between transition-all bg-zinc-950/80 hover:bg-zinc-900 cursor-default",
      style: { borderColor: `${cue.color || "#06b6d4"}55` }
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement(
      "span",
      {
        className: "w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black text-black font-mono shadow-sm",
        style: { backgroundColor: cue.color || "#06b6d4" }
      },
      cue.id || cIdx + 1
    ), /* @__PURE__ */ React.createElement("span", { className: "text-[8px] font-mono text-zinc-500" }, cue.time || "--:--")),
    /* @__PURE__ */ React.createElement("div", { className: "text-[8px] font-syne font-bold text-zinc-200 truncate mt-1", title: cue.name }, cue.name)
  )))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5 pt-2 border-t border-zinc-800/60 font-mono text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-zinc-400" }, /* @__PURE__ */ React.createElement("span", null, "Densidad Sub-Graves (Sub-Bass)"), /* @__PURE__ */ React.createElement("span", { className: deck.low_ratio >= 44 ? "text-red-400 font-bold" : "text-zinc-200" }, deck.low_ratio, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-zinc-900 rounded-full h-2 overflow-hidden flex" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `h-full transition-all duration-300 ${deck.low_ratio >= 44 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-djcyan-400"}`,
      style: { width: `${Math.min(100, deck.low_ratio * 1.5)}%` }
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] text-zinc-500 pt-0.5" }, /* @__PURE__ */ React.createElement("span", null, "Medios: ", deck.mid_ratio, "%"), /* @__PURE__ */ React.createElement("span", null, "Agudos: ", deck.high_ratio, "%"), /* @__PURE__ */ React.createElement("span", null, "LUFS: ", /* @__PURE__ */ React.createElement("strong", { className: "text-zinc-300" }, deck.lufs, " dB")))), /* @__PURE__ */ React.createElement("div", { className: "mt-2.5 p-2.5 rounded-2xl bg-black/50 border border-zinc-800/80 flex items-start gap-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400 text-sm shrink-0" }, "\u{1F4AC}"), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-[9px] font-mono uppercase text-zinc-500 tracking-wider" }, "Comentario T\xE1ctico DJ (Tag ID3)"), /* @__PURE__ */ React.createElement("div", { className: "font-mono text-xs text-zinc-200 truncate", title: deck.comment || deck.tactical_comment || `[${deck.bpm ? Number(deck.bpm).toFixed(1) : "--"} BPM | ${deck.camelot}] Intro 32b \u2022 Drop contundente \u2022 Outro 64b` }, deck.comment || deck.tactical_comment || `[${deck.bpm ? Number(deck.bpm).toFixed(1) : "--"} BPM | ${deck.camelot}] Intro 32b \u2022 Drop contundente \u2022 Outro 64b`))));
}
if (document.getElementById("copilot-root")) {
  ReactDOM.render(/* @__PURE__ */ React.createElement(LiveCopilotApp, null), document.getElementById("copilot-root"));
}
window.LiveCopilotApp = LiveCopilotApp;
window.DeckCard = DeckCard;
