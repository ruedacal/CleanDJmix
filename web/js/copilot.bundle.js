(() => {
  // web/js/workspaces/CopilotCleanMixBanner.jsx
  var { memo } = React;
  var CopilotCleanMixBanner = memo(({
    antiMuddy = null,
    harmonic = null,
    controllerState = null,
    lufsDelta = null,
    lowEqApplied = false,
    onApplyCorrection = null,
    isAppOpen = true
  }) => {
    const isDanger = isAppOpen && antiMuddy && antiMuddy.status === "danger";
    const isWarning = isAppOpen && antiMuddy && antiMuddy.status === "warning";
    const isClean = !isDanger && !isWarning;
    const controllerName = ((controllerState == null ? void 0 : controllerState.name) || "NUMARK NV II").replace(/\s*\(USB\)\s*/i, "").trim();
    return /* @__PURE__ */ React.createElement(
      "section",
      {
        className: `bw-msg-banner ${isDanger ? "is-danger" : ""} ${!isAppOpen ? "opacity-50" : ""}`,
        "aria-live": "polite"
      },
      /* @__PURE__ */ React.createElement("div", { className: "bw-msg-visual" }, /* @__PURE__ */ React.createElement("div", { className: "bw-phase-bars" }, /* @__PURE__ */ React.createElement("span", { className: "bw-p-bar" }), /* @__PURE__ */ React.createElement("span", { className: "bw-p-bar" }), /* @__PURE__ */ React.createElement("span", { className: "bw-p-bar" }), /* @__PURE__ */ React.createElement("span", { className: "bw-p-bar" }), /* @__PURE__ */ React.createElement("span", { className: "bw-p-bar" })), /* @__PURE__ */ React.createElement("div", { className: "msg-phase-meta font-mono text-[10px] leading-tight select-none" }, /* @__PURE__ */ React.createElement("div", { className: "text-zinc-400 font-bold" }, "SUB-BASS"), /* @__PURE__ */ React.createElement("div", { className: `font-black ${isDanger ? "text-[#ff6b88]" : "text-emerald-400"}` }, !isAppOpen ? "STANDBY" : isDanger ? "COLISI\xD3N 142\xB0" : "FASE 0\xB0 OK"))),
      /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-0.5 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "font-syne font-black text-sm tracking-wider text-white" }, !isAppOpen ? "CABINA EN STANDBY" : isDanger ? (antiMuddy == null ? void 0 : antiMuddy.title) || "ALERTA DE GRAVES" : isWarning ? (antiMuddy == null ? void 0 : antiMuddy.title) || "AVISO DE FRECUENCIAS" : "MEZCLA LIMPIA"), /* @__PURE__ */ React.createElement("span", { className: `text-[10px] font-mono font-black px-2 py-0.5 rounded-full tracking-wider ${!isAppOpen ? "bg-zinc-800 text-zinc-400" : isDanger ? "bg-[#FF2A54] text-white shadow-[0_0_10px_rgba(255,42,84,0.72)]" : isWarning ? "bg-amber-400 text-black" : "bg-emerald-500 text-[#03140E]"}` }, !isAppOpen ? "SIN CONEXI\xD3N" : isDanger ? (antiMuddy == null ? void 0 : antiMuddy.tag) || "BASS CLASH \xB7 -0.2 dB CLIP" : (antiMuddy == null ? void 0 : antiMuddy.tag) || "CLEAR MIX \xB7 HEADROOM +2.4 dB")), /* @__PURE__ */ React.createElement("div", { className: `text-[11.5px] font-syne truncate ${isDanger ? "text-[#ffe4e6] font-semibold" : "text-zinc-300 font-medium"}` }, !isAppOpen ? "Supervisi\xF3n inactiva hasta conectar software y hardware DJ." : (antiMuddy == null ? void 0 : antiMuddy.message) || (isDanger ? "Choque de sub-graves detectado entre DK1 y DK2. Riesgo de saturaci\xF3n en PA." : "Espectro de graves despejado (30\u2013120 Hz). Sin riesgo de cancelaci\xF3n ac\xFAstica."))),
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap justify-end" }, (controllerState == null ? void 0 : controllerState.detected) && /* @__PURE__ */ React.createElement("span", { className: "font-mono text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-[#0F172A] border border-cyan-500/40 text-cyan-300" }, controllerName, " \xB7 ", isDanger ? "LOW CH2 ACTIVO" : "Centrado (12h) \xB7 0 dB"), onApplyCorrection && isAppOpen ? /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onApplyCorrection,
          className: `font-mono text-[10.5px] font-bold px-3 py-1 rounded-lg border transition-all cursor-pointer ${lowEqApplied ? "bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500 text-emerald-300" : isDanger ? "bg-[#FF2A54] hover:bg-red-500 border-red-200 text-white font-black shadow-[0_0_12px_rgba(255,42,84,0.5)] animate-pulse" : "bg-[#0F172A] hover:bg-zinc-800 border-emerald-500/60 text-emerald-300"}`,
          title: "Aplicar ajuste correctivo anti-muddy"
        },
        lowEqApplied ? "\u2713 EQ RESTABLECIDO" : (antiMuddy == null ? void 0 : antiMuddy.action) || (isDanger ? "ACCI\xD3N: CORTAR LOW CH2 (-12 dB) AHORA" : "ACCI\xD3N: Frecuencias equilibradas")
      ) : /* @__PURE__ */ React.createElement("span", { className: "font-mono text-[10.5px] px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500" }, "EQ STANDBY"), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-[10.5px] font-bold px-2 py-1 rounded-lg bg-[#0F172A] border border-[#26354F] text-zinc-300" }, "CAMELOT: ", /* @__PURE__ */ React.createElement("strong", { style: { color: (harmonic == null ? void 0 : harmonic.color) || "#38bdf8" } }, (harmonic == null ? void 0 : harmonic.badge) || "--"), " \xB7 ", lufsDelta != null ? `${lufsDelta > 0 ? "+" : ""}${lufsDelta} dB` : "-8.4 LUFS"))
    );
  });

  // web/js/workspaces/CopilotCenterMixer.jsx
  var { useState, useEffect, useRef, useMemo, memo: memo2 } = React;
  var HardwareKnob = memo2(({
    value = 0.5,
    color = "#00F0FF",
    label = "",
    isFilter = false,
    onChange = null
  }) => {
    const v = Math.max(0, Math.min(1, Number(value) || 0.5));
    const angle = Math.round((v - 0.5) * 270);
    return /* @__PURE__ */ React.createElement(
      "svg",
      {
        className: "dj-knob-svg bw-dj-knob-svg select-none",
        viewBox: "0 0 40 40",
        title: `${label}: ${v >= 0.5 ? "+" : ""}${Math.round((v - 0.5) * 200)}%`
      },
      /* @__PURE__ */ React.createElement(
        "circle",
        {
          cx: "20",
          cy: "20",
          r: "14",
          fill: "none",
          stroke: "#162033",
          strokeWidth: "2.2",
          strokeDasharray: "66 24",
          transform: "rotate(135 20 20)"
        }
      ),
      /* @__PURE__ */ React.createElement(
        "circle",
        {
          cx: "20",
          cy: "20",
          r: "14",
          fill: "none",
          stroke: color,
          strokeWidth: "2.2",
          strokeDasharray: "38 56",
          transform: "rotate(135 20 20)",
          opacity: "0.88"
        }
      ),
      /* @__PURE__ */ React.createElement("circle", { cx: "20", cy: "20", r: "10.5", fill: "#0A101C", stroke: "#334155", strokeWidth: "1.3" }),
      /* @__PURE__ */ React.createElement("circle", { cx: "20", cy: "20", r: "8.2", fill: "#151F32" }),
      /* @__PURE__ */ React.createElement("g", { transform: `rotate(${angle} 20 20)` }, /* @__PURE__ */ React.createElement("line", { x1: "20", y1: "20", x2: "20", y2: "10", stroke: color, strokeWidth: "2.2", strokeLinecap: "round" }))
    );
  });
  var HitoIcons = {
    intro: () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "9" }), /* @__PURE__ */ React.createElement("polygon", { points: "10 8 16 12 10 16 10 8" })),
    bassline: () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("polyline", { points: "2 12 6 12 9 4 13 20 16 9 18 12 22 12" })),
    buildup: () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("polyline", { points: "17 11 12 6 7 11" }), /* @__PURE__ */ React.createElement("polyline", { points: "17 18 12 13 7 18" })),
    drop: () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "8" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "2", x2: "12", y2: "6" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "18", x2: "12", y2: "22" }), /* @__PURE__ */ React.createElement("line", { x1: "2", y1: "12", x2: "6", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "12", x2: "22", y2: "12" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "1.5" })),
    breakdown: () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { d: "M2 9c2.5-2.5 5.5-2.5 8 0s5.5 2.5 8 0 4-2.5 4-2.5" }), /* @__PURE__ */ React.createElement("path", { d: "M2 15c2.5-2.5 5.5-2.5 8 0s5.5 2.5 8 0 4-2.5 4-2.5" })),
    break2: () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "10", y1: "8", x2: "10", y2: "16" }), /* @__PURE__ */ React.createElement("line", { x1: "14", y1: "8", x2: "14", y2: "16" })),
    drop2: () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("polygon", { points: "13 2 4 14 12 14 11 22 20 10 12 10 13 2" })),
    outro: () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { d: "M5 21V4" }), /* @__PURE__ */ React.createElement("path", { d: "M5 4h12l-2.5 4L17 12H5" }))
  };
  var DEFAULT_HITOS_D1 = [
    { id: 1, key: "intro", label: "INTRO", time: "00:00", pos_sec: 0 },
    { id: 2, key: "bassline", label: "BASSLINE IN", time: "00:32", pos_sec: 32 },
    { id: 3, key: "buildup", label: "BUILD UP", time: "01:04", pos_sec: 64 },
    { id: 4, key: "drop", label: "MAIN DROP", time: "01:36", pos_sec: 96 },
    { id: 5, key: "breakdown", label: "BREAKDOWN", time: "02:15", pos_sec: 135 },
    { id: 6, key: "break2", label: "2ND BREAK", time: "02:58", pos_sec: 178 },
    { id: 7, key: "drop2", label: "DROP 2", time: "03:30", pos_sec: 210 },
    { id: 8, key: "outro", label: "OUTRO", time: "04:12", pos_sec: 252 }
  ];
  var DEFAULT_HITOS_D2 = [
    { id: 1, key: "intro", label: "INTRO", time: "00:00", pos_sec: 0 },
    { id: 2, key: "bassline", label: "BASSLINE IN", time: "00:16", pos_sec: 16 },
    { id: 3, key: "buildup", label: "BUILD UP", time: "00:48", pos_sec: 48 },
    { id: 4, key: "drop", label: "MAIN DROP", time: "01:04", pos_sec: 64 },
    { id: 5, key: "breakdown", label: "BREAKDOWN", time: "01:48", pos_sec: 108 },
    { id: 6, key: "break2", label: "2ND BREAK", time: "02:30", pos_sec: 150 },
    { id: 7, key: "drop2", label: "DROP 2", time: "03:02", pos_sec: 182 },
    { id: 8, key: "outro", label: "OUTRO", time: "03:45", pos_sec: 225 }
  ];
  var CopilotCenterMixer = memo2(({
    deck1 = null,
    deck2 = null,
    mixer = null,
    audit = null,
    isAppOpen = true,
    showInlineHud = true
    // HUD integrado en la mesa central slim
  }) => {
    const [d1ActiveHito, setD1ActiveHito] = useState(0);
    const [d2ActiveHito, setD2ActiveHito] = useState(2);
    const [pflState, setPflState] = useState({ ch1: false, ch2: true });
    const [currentBeat, setCurrentBeat] = useState(1);
    useEffect(() => {
      const bpm = Number((deck1 == null ? void 0 : deck1.bpm) || (deck2 == null ? void 0 : deck2.bpm) || 136);
      const beatMs = Math.round(60 / bpm * 1e3);
      const interval = setInterval(() => {
        setCurrentBeat((b) => b % 4 + 1);
      }, beatMs);
      return () => clearInterval(interval);
    }, [deck1 == null ? void 0 : deck1.bpm, deck2 == null ? void 0 : deck2.bpm]);
    const hitosD1 = useMemo(() => {
      if ((deck1 == null ? void 0 : deck1.cues) && deck1.cues.length >= 4) {
        return deck1.cues.map((c, i) => {
          var _a, _b, _c, _d;
          return {
            id: c.id || i + 1,
            key: ((_a = DEFAULT_HITOS_D1[i]) == null ? void 0 : _a.key) || "intro",
            label: c.name || ((_b = DEFAULT_HITOS_D1[i]) == null ? void 0 : _b.label) || `CUE ${i + 1}`,
            time: c.time || ((_c = DEFAULT_HITOS_D1[i]) == null ? void 0 : _c.time) || "00:00",
            pos_sec: c.pos_sec !== void 0 ? c.pos_sec : ((_d = DEFAULT_HITOS_D1[i]) == null ? void 0 : _d.pos_sec) || 0
          };
        });
      }
      return DEFAULT_HITOS_D1;
    }, [deck1 == null ? void 0 : deck1.cues]);
    const hitosD2 = useMemo(() => {
      if ((deck2 == null ? void 0 : deck2.cues) && deck2.cues.length >= 4) {
        return deck2.cues.map((c, i) => {
          var _a, _b, _c, _d;
          return {
            id: c.id || i + 1,
            key: ((_a = DEFAULT_HITOS_D2[i]) == null ? void 0 : _a.key) || "intro",
            label: c.name || ((_b = DEFAULT_HITOS_D2[i]) == null ? void 0 : _b.label) || `CUE ${i + 1}`,
            time: c.time || ((_c = DEFAULT_HITOS_D2[i]) == null ? void 0 : _c.time) || "00:00",
            pos_sec: c.pos_sec !== void 0 ? c.pos_sec : ((_d = DEFAULT_HITOS_D2[i]) == null ? void 0 : _d.pos_sec) || 0
          };
        });
      }
      return DEFAULT_HITOS_D2;
    }, [deck2 == null ? void 0 : deck2.cues]);
    const formatSec = (sec) => {
      const s = Math.max(0, Math.round(sec));
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };
    const d1Duration = Number(deck1 == null ? void 0 : deck1.duration_sec) || 240;
    const d2Duration = Number(deck2 == null ? void 0 : deck2.duration_sec) || 240;
    const [d1PlayPos, setD1PlayPos] = useState(() => (typeof (deck1 == null ? void 0 : deck1.play_progress) === "number" ? deck1.play_progress : 0.15) * d1Duration);
    const [d2PlayPos, setD2PlayPos] = useState(() => (typeof (deck2 == null ? void 0 : deck2.play_progress) === "number" ? deck2.play_progress : 0) * d2Duration);
    useEffect(() => {
      if (typeof (deck1 == null ? void 0 : deck1.play_progress) === "number") {
        setD1PlayPos(deck1.play_progress * d1Duration);
      }
    }, [deck1 == null ? void 0 : deck1.play_progress, d1Duration]);
    useEffect(() => {
      if (typeof (deck2 == null ? void 0 : deck2.play_progress) === "number") {
        setD2PlayPos(deck2.play_progress * d2Duration);
      }
    }, [deck2 == null ? void 0 : deck2.play_progress, d2Duration]);
    useEffect(() => {
      if (!isAppOpen) return;
      const interval = setInterval(() => {
        if (deck1 == null ? void 0 : deck1.is_playing) {
          setD1PlayPos((p) => p + 1 > d1Duration ? 0 : p + 1);
        }
        if (deck2 == null ? void 0 : deck2.is_playing) {
          setD2PlayPos((p) => p + 1 > d2Duration ? 0 : p + 1);
        }
      }, 1e3);
      return () => clearInterval(interval);
    }, [isAppOpen, deck1 == null ? void 0 : deck1.is_playing, deck2 == null ? void 0 : deck2.is_playing, d1Duration, d2Duration]);
    const d1Bpm = Number(deck1 == null ? void 0 : deck1.bpm) || 136;
    const d2Bpm = Number(deck2 == null ? void 0 : deck2.bpm) || 136;
    const d1BarSec = 60 / d1Bpm * 4;
    const d2BarSec = 60 / d2Bpm * 4;
    const d1NextHito = useMemo(() => {
      const upcoming = hitosD1.find((h) => h.pos_sec > d1PlayPos + 0.5);
      return upcoming || hitosD1[d1ActiveHito] || hitosD1[0];
    }, [hitosD1, d1PlayPos, d1ActiveHito]);
    const d1RemainingSec = Math.max(0, Math.round(((d1NextHito == null ? void 0 : d1NextHito.pos_sec) || 32) - d1PlayPos));
    const d1RemainingBars = Math.max(1, Math.ceil(d1RemainingSec / d1BarSec));
    const d1IsPlaying = Boolean(deck1 == null ? void 0 : deck1.is_playing);
    const d1IsAlert = d1IsPlaying && d1RemainingSec <= 5 && d1RemainingSec > 0;
    const d1ProgressPct = Math.min(100, Math.max(0, Math.round((d1NextHito.pos_sec - d1RemainingSec) / (d1NextHito.pos_sec || 1) * 100)));
    const d2NextHito = useMemo(() => {
      const upcoming = hitosD2.find((h) => h.pos_sec > d2PlayPos + 0.5);
      return upcoming || hitosD2[d2ActiveHito] || hitosD2[2] || hitosD2[0];
    }, [hitosD2, d2PlayPos, d2ActiveHito]);
    const d2IsPlaying = Boolean(deck2 == null ? void 0 : deck2.is_playing);
    const d2RemainingSec = d2IsPlaying ? Math.max(0, Math.round(((d2NextHito == null ? void 0 : d2NextHito.pos_sec) || 48) - d2PlayPos)) : d1IsPlaying ? d1RemainingSec : 14;
    const d2RemainingBars = Math.max(1, Math.ceil(d2RemainingSec / d2BarSec));
    const d2IsAlert = (d2IsPlaying || d1IsPlaying && !d2IsPlaying) && d2RemainingSec <= 5 && d2RemainingSec > 0;
    const d2ProgressPct = Math.min(100, Math.max(0, Math.round((d2NextHito.pos_sec - d2RemainingSec) / (d2NextHito.pos_sec || 1) * 100)));
    const isCriticalAlert = d1IsAlert || d2IsAlert;
    const ch1Mix = (mixer == null ? void 0 : mixer.ch1) || {};
    const ch2Mix = (mixer == null ? void 0 : mixer.ch2) || {};
    const ch1Gain = ch1Mix.gain !== void 0 ? ch1Mix.gain : 0.5;
    const ch2Gain = ch2Mix.gain !== void 0 ? ch2Mix.gain : 0.52;
    const ch1Hi = ch1Mix.eq_high !== void 0 ? ch1Mix.eq_high : 0.5;
    const ch2Hi = ch2Mix.eq_high !== void 0 ? ch2Mix.eq_high : 0.45;
    const ch1Mid = ch1Mix.eq_mid !== void 0 ? ch1Mix.eq_mid : 0.53;
    const ch2Mid = ch2Mix.eq_mid !== void 0 ? ch2Mix.eq_mid : 0.4;
    const ch1Low = ch1Mix.eq_low !== void 0 ? ch1Mix.eq_low : 0.5;
    const ch2Low = ch2Mix.eq_low !== void 0 ? ch2Mix.eq_low : isCriticalAlert ? 0.2 : 0.38;
    const ch1Fltr = ch1Mix.filter !== void 0 ? ch1Mix.filter : 0.5;
    const ch2Fltr = ch2Mix.filter !== void 0 ? ch2Mix.filter : 0.58;
    const ch1Fader = ch1Mix.fader !== void 0 ? ch1Mix.fader : 0.88;
    const ch2Fader = ch2Mix.fader !== void 0 ? ch2Mix.fader : 0.42;
    const crossfader = (mixer == null ? void 0 : mixer.crossfader) !== void 0 ? mixer.crossfader : 0.22;
    const auditScore = (audit == null ? void 0 : audit.score_pct) !== void 0 ? audit.score_pct : 100;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `bw-center-mixer center-mixer ${isCriticalAlert ? "is-alert-5s" : ""}`,
        id: "mixer-main",
        role: "region",
        "aria-label": "Mesa de Mezclas Central T\xE1ctica"
      },
      /* @__PURE__ */ React.createElement("div", { className: "mx-topbar bw-mx-topbar select-none" }, /* @__PURE__ */ React.createElement("div", { className: "mx-sync bw-mx-sync" }, /* @__PURE__ */ React.createElement("span", { className: "sync-dot bw-sync-dot" }), /* @__PURE__ */ React.createElement("span", null, "SYNC \xB7 ", Math.round((deck1 == null ? void 0 : deck1.bpm) || (deck2 == null ? void 0 : deck2.bpm) || 136), " BPM")), /* @__PURE__ */ React.createElement("div", { className: "mx-beat-strip bw-mx-beat-strip" }, [1, 2, 3, 4].map((b) => /* @__PURE__ */ React.createElement(
        "span",
        {
          key: b,
          className: `b-box bw-b-box ${currentBeat === b ? b === 4 ? "pulse" : "on" : ""}`
        },
        b
      ))), /* @__PURE__ */ React.createElement("div", { className: "mx-alert-badge bw-mx-alert-badge" }, isCriticalAlert ? "\u26A0 <5S ALERTA" : "\u26A0 <5S")),
      showInlineHud && /* @__PURE__ */ React.createElement("div", { className: "bw-dual-huds" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `cue-hud bw-cue-hud d1-hud select-none ${d1IsAlert ? "is-impact" : ""}`,
          role: "status",
          "aria-live": "assertive"
        },
        /* @__PURE__ */ React.createElement("div", { className: "cue-hud-ico bw-cue-hud-ico" }, d1IsAlert ? /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { d: "M7 18v-6a5 5 0 1 1 10 0v6" }), /* @__PURE__ */ React.createElement("path", { d: "M5 21h14" }), /* @__PURE__ */ React.createElement("path", { d: "M12 2v2" }), /* @__PURE__ */ React.createElement("path", { d: "M4.93 4.93l1.41 1.41" }), /* @__PURE__ */ React.createElement("path", { d: "M19.07 4.93l-1.41 1.41" }), /* @__PURE__ */ React.createElement("path", { d: "M2 12h2" }), /* @__PURE__ */ React.createElement("path", { d: "M20 12h2" })) : /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { d: "M3 18v-6a9 9 0 0 1 18 0v6" }), /* @__PURE__ */ React.createElement("path", { d: "M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" }), /* @__PURE__ */ React.createElement("path", { d: "M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" }))),
        /* @__PURE__ */ React.createElement("div", { className: "cue-hud-body bw-cue-hud-body" }, /* @__PURE__ */ React.createElement("div", { className: "cue-hud-kicker bw-cue-hud-kicker" }, /* @__PURE__ */ React.createElement("span", { className: "cue-hud-dot bw-cue-hud-dot", style: { backgroundColor: "#00F0FF", boxShadow: "0 0 7px #00F0FF" } }), /* @__PURE__ */ React.createElement("span", { className: "text-[#00F0FF] font-black mr-1" }, "DK 1"), /* @__PURE__ */ React.createElement("span", null, d1IsAlert ? d1RemainingSec === 0 ? "\xA1IMPACTO AHORA! SOLTAR PISTA" : "\xA1ATENCI\xD3N! QUEDAN < 5 SEGUNDOS" : d1IsPlaying ? `EN PLAY \xB7 PROXIMO: ${(d1NextHito == null ? void 0 : d1NextHito.label) || "HITO"}` : "EN CUE (PREPARADO)")), /* @__PURE__ */ React.createElement("div", { className: "cue-hud-text bw-cue-hud-text truncate" }, d1IsAlert ? `PRIMER GOLPE (${(d1NextHito == null ? void 0 : d1NextHito.label) || "INTRO"})` : d1IsPlaying ? `Transici\xF3n a ${(d1NextHito == null ? void 0 : d1NextHito.label) || "Hito"} en ${d1RemainingBars} compases` : "Listo para soltar en primer bombo"), /* @__PURE__ */ React.createElement("div", { className: "cue-hud-progress bw-cue-hud-progress" }, /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "cue-hud-progress-fill bw-cue-hud-progress-fill",
            style: { width: `${d1ProgressPct}%` }
          }
        ))),
        /* @__PURE__ */ React.createElement("div", { className: "cue-hud-right bw-cue-hud-right" }, /* @__PURE__ */ React.createElement("span", { className: "cue-hud-timer bw-cue-hud-timer" }, formatSec(d1RemainingSec)), /* @__PURE__ */ React.createElement("span", { className: "cue-hud-bar-pill bw-cue-hud-bar-pill" }, "BAR ", d1RemainingBars))
      ), /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `cue-hud bw-cue-hud d2-hud select-none ${d2IsAlert ? "is-impact" : ""}`,
          role: "status",
          "aria-live": "assertive"
        },
        /* @__PURE__ */ React.createElement("div", { className: "cue-hud-ico bw-cue-hud-ico" }, d2IsAlert ? /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { d: "M7 18v-6a5 5 0 1 1 10 0v6" }), /* @__PURE__ */ React.createElement("path", { d: "M5 21h14" }), /* @__PURE__ */ React.createElement("path", { d: "M12 2v2" }), /* @__PURE__ */ React.createElement("path", { d: "M4.93 4.93l1.41 1.41" }), /* @__PURE__ */ React.createElement("path", { d: "M19.07 4.93l-1.41 1.41" }), /* @__PURE__ */ React.createElement("path", { d: "M2 12h2" }), /* @__PURE__ */ React.createElement("path", { d: "M20 12h2" })) : /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { d: "M3 18v-6a9 9 0 0 1 18 0v6" }), /* @__PURE__ */ React.createElement("path", { d: "M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" }), /* @__PURE__ */ React.createElement("path", { d: "M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" }))),
        /* @__PURE__ */ React.createElement("div", { className: "cue-hud-body bw-cue-hud-body" }, /* @__PURE__ */ React.createElement("div", { className: "cue-hud-kicker bw-cue-hud-kicker" }, /* @__PURE__ */ React.createElement("span", { className: "cue-hud-dot bw-cue-hud-dot", style: { backgroundColor: "#818CF8", boxShadow: "0 0 7px #818CF8" } }), /* @__PURE__ */ React.createElement("span", { className: "text-[#38BDF8] font-black mr-1" }, "DK 2"), /* @__PURE__ */ React.createElement("span", null, d2IsAlert ? d2RemainingSec === 0 ? "\xA1IMPACTO AHORA! SOLTAR PISTA" : "\xA1ATENCI\xD3N! QUEDAN < 5 SEGUNDOS" : d2IsPlaying ? `EN PLAY \xB7 PROXIMO: ${(d2NextHito == null ? void 0 : d2NextHito.label) || "HITO"}` : "EN CUE (PREPARADO)")), /* @__PURE__ */ React.createElement("div", { className: "cue-hud-text bw-cue-hud-text truncate" }, d2IsAlert ? `PRIMER GOLPE (${(d2NextHito == null ? void 0 : d2NextHito.label) || "INTRO"})` : d2IsPlaying ? `Transici\xF3n a ${(d2NextHito == null ? void 0 : d2NextHito.label) || "Hito"} en ${d2RemainingBars} compases` : "Listo para soltar en primer bombo"), /* @__PURE__ */ React.createElement("div", { className: "cue-hud-progress bw-cue-hud-progress" }, /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "cue-hud-progress-fill bw-cue-hud-progress-fill",
            style: { width: `${d2ProgressPct}%` }
          }
        ))),
        /* @__PURE__ */ React.createElement("div", { className: "cue-hud-right bw-cue-hud-right" }, /* @__PURE__ */ React.createElement("span", { className: "cue-hud-timer bw-cue-hud-timer" }, formatSec(d2RemainingSec)), /* @__PURE__ */ React.createElement("span", { className: "cue-hud-bar-pill bw-cue-hud-bar-pill" }, "BAR ", d2RemainingBars))
      )),
      /* @__PURE__ */ React.createElement("div", { className: "mx-body bw-mx-body select-none" }, /* @__PURE__ */ React.createElement("div", { className: "deck-pane d1-pane bw-deck-pane bw-d1-pane" }, /* @__PURE__ */ React.createElement("div", { className: "dp-head bw-dp-head" }, /* @__PURE__ */ React.createElement("span", { className: "dp-title bw-dp-title" }, "DK 1"), /* @__PURE__ */ React.createElement("span", { className: "dp-rem bw-dp-rem" }, (deck1 == null ? void 0 : deck1.duration) || "-03:14")), /* @__PURE__ */ React.createElement("div", { className: "hito-banner bw-hito-banner" }, /* @__PURE__ */ React.createElement("div", { className: "hb-bars bw-hb-bars" }, d1RemainingBars, " BARS \xB7 ", formatSec(d1RemainingSec)), /* @__PURE__ */ React.createElement("div", { className: "hb-name bw-hb-name" }, "NEXT: ", (d1NextHito == null ? void 0 : d1NextHito.label) || "BASSLINE IN"), /* @__PURE__ */ React.createElement("div", { className: "hb-bar bw-hb-bar" }, /* @__PURE__ */ React.createElement("div", { className: "hb-fill bw-hb-fill", style: { width: `${d1ProgressPct}%` } }))), /* @__PURE__ */ React.createElement("div", { className: "cue-list bw-cue-list", id: "main-d1-list" }, hitosD1.map((h, idx) => {
        const IconComponent = HitoIcons[h.key] || HitoIcons.intro;
        const isActive = d1ActiveHito === idx;
        const isNext = !isActive && idx === 1;
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: h.id || idx,
            type: "button",
            onClick: () => setD1ActiveHito(idx),
            className: `cue-btn bw-cue-btn ${isActive ? "is-active" : isNext ? "is-next" : ""}`,
            title: `Hito DK1: ${h.label} (${h.time})`
          },
          /* @__PURE__ */ React.createElement("span", { className: "c-ico bw-c-ico" }, /* @__PURE__ */ React.createElement(IconComponent, null)),
          /* @__PURE__ */ React.createElement("span", { className: "c-lbl bw-c-lbl" }, h.label),
          /* @__PURE__ */ React.createElement("span", { className: "c-time bw-c-time" }, h.time),
          /* @__PURE__ */ React.createElement("span", { className: "c-led bw-c-led" })
        );
      }))), /* @__PURE__ */ React.createElement("div", { className: "hardware-mixer bw-hardware-mixer" }, /* @__PURE__ */ React.createElement("div", { className: "hm-col-headers bw-hm-col-headers" }, /* @__PURE__ */ React.createElement("span", { className: "ch-tag ch1 bw-ch-tag ch1" }, "CH1"), /* @__PURE__ */ React.createElement("span", { className: "ch-mid bw-ch-mid" }, "EQ"), /* @__PURE__ */ React.createElement("span", { className: "ch-tag ch2 bw-ch-tag ch2" }, "CH2")), /* @__PURE__ */ React.createElement("div", { className: "knob-row bw-knob-row" }, /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch1Gain, color: "#00F0FF", label: "CH1 Gain" })), /* @__PURE__ */ React.createElement("div", { className: "knob-lbl bw-knob-lbl" }, "GAIN"), /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch2Gain, color: "#38BDF8", label: "CH2 Gain" }))), /* @__PURE__ */ React.createElement("div", { className: "knob-row bw-knob-row" }, /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch1Hi, color: "#00F0FF", label: "CH1 High" })), /* @__PURE__ */ React.createElement("div", { className: "knob-lbl bw-knob-lbl" }, "HI"), /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch2Hi, color: "#38BDF8", label: "CH2 High" }))), /* @__PURE__ */ React.createElement("div", { className: "knob-row bw-knob-row" }, /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch1Mid, color: "#00F0FF", label: "CH1 Mid" })), /* @__PURE__ */ React.createElement("div", { className: "knob-lbl bw-knob-lbl" }, "MID"), /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch2Mid, color: "#38BDF8", label: "CH2 Mid" }))), /* @__PURE__ */ React.createElement("div", { className: "knob-row bw-knob-row" }, /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch1Low, color: "#00F0FF", label: "CH1 Low" })), /* @__PURE__ */ React.createElement("div", { className: "knob-lbl bw-knob-lbl" }, "LOW"), /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(
        HardwareKnob,
        {
          value: ch2Low,
          color: isCriticalAlert ? "#FF2A54" : "#38BDF8",
          label: "CH2 Low"
        }
      ))), /* @__PURE__ */ React.createElement("div", { className: "knob-row bw-knob-row" }, /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch1Fltr, color: "#38BDF8", label: "CH1 Filter", isFilter: true })), /* @__PURE__ */ React.createElement("div", { className: "knob-lbl fltr bw-knob-lbl fltr" }, "FLTR"), /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch2Fltr, color: "#38BDF8", label: "CH2 Filter", isFilter: true }))), /* @__PURE__ */ React.createElement("div", { className: "pfl-row bw-pfl-row" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: `pfl-btn bw-pfl-btn ${pflState.ch1 ? "is-on" : ""}`,
          onClick: () => setPflState((p) => ({ ...p, ch1: !p.ch1 }))
        },
        "CUE 1"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: `pfl-btn bw-pfl-btn ${pflState.ch2 ? "is-on" : ""}`,
          onClick: () => setPflState((p) => ({ ...p, ch2: !p.ch2 }))
        },
        "CUE 2"
      )), /* @__PURE__ */ React.createElement("div", { className: "faders-deck bw-faders-deck" }, /* @__PURE__ */ React.createElement("div", { className: "fader-unit bw-fader-unit" }, /* @__PURE__ */ React.createElement("div", { className: "fader-slot bw-fader-slot" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "fader-cap bw-fader-cap",
          style: { top: `${Math.round((1 - ch1Fader) * 80)}%` }
        },
        /* @__PURE__ */ React.createElement("span", { className: "cap-line bw-cap-line" })
      ))), /* @__PURE__ */ React.createElement("div", { className: "vu-bridge bw-vu-bridge" }, /* @__PURE__ */ React.createElement("div", { className: "vu-col bw-vu-col" }, /* @__PURE__ */ React.createElement("span", { className: "vu-led bw-vu-led" }), /* @__PURE__ */ React.createElement("span", { className: "vu-led bw-vu-led" }), /* @__PURE__ */ React.createElement("span", { className: "vu-led on-amber bw-vu-led on-amber" }), /* @__PURE__ */ React.createElement("span", { className: "vu-led on-amber bw-vu-led on-amber" }), /* @__PURE__ */ React.createElement("span", { className: "vu-led on-cyan bw-vu-led on-cyan" }), /* @__PURE__ */ React.createElement("span", { className: "vu-led on-cyan bw-vu-led on-cyan" }), /* @__PURE__ */ React.createElement("span", { className: "vu-led on-cyan bw-vu-led on-cyan" }), /* @__PURE__ */ React.createElement("span", { className: "vu-led on-cyan bw-vu-led on-cyan" }), /* @__PURE__ */ React.createElement("span", { className: "vu-led on-cyan bw-vu-led on-cyan" }), /* @__PURE__ */ React.createElement("span", { className: "vu-led on-cyan bw-vu-led on-cyan" })), /* @__PURE__ */ React.createElement("div", { className: "vu-col bw-vu-col" }, /* @__PURE__ */ React.createElement("span", { className: `vu-led bw-vu-led ${isCriticalAlert ? "on-red" : ""}` }), /* @__PURE__ */ React.createElement("span", { className: "vu-led bw-vu-led" }), /* @__PURE__ */ React.createElement("span", { className: "vu-led on-amber bw-vu-led on-amber" }), /* @__PURE__ */ React.createElement("span", { className: "vu-led bw-vu-led" }), /* @__PURE__ */ React.createElement("span", { className: "vu-led on-cyan bw-vu-led on-cyan" }), /* @__PURE__ */ React.createElement("span", { className: "vu-led on-cyan bw-vu-led on-cyan" }), /* @__PURE__ */ React.createElement("span", { className: "vu-led on-cyan bw-vu-led on-cyan" }), /* @__PURE__ */ React.createElement("span", { className: "vu-led on-cyan bw-vu-led on-cyan" }), /* @__PURE__ */ React.createElement("span", { className: "vu-led on-cyan bw-vu-led on-cyan" }), /* @__PURE__ */ React.createElement("span", { className: "vu-led on-cyan bw-vu-led on-cyan" }))), /* @__PURE__ */ React.createElement("div", { className: "fader-unit bw-fader-unit" }, /* @__PURE__ */ React.createElement("div", { className: "fader-slot bw-fader-slot" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "fader-cap ch2-cap bw-fader-cap bw-ch2-cap",
          style: { top: `${Math.round((1 - ch2Fader) * 80)}%` }
        },
        /* @__PURE__ */ React.createElement("span", { className: "cap-line bw-cap-line" })
      )))), /* @__PURE__ */ React.createElement("div", { className: "xfader-box bw-xfader-box" }, /* @__PURE__ */ React.createElement("div", { className: "xf-slot bw-xf-slot" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "xf-thumb bw-xf-thumb",
          style: { left: `calc(${Math.round(crossfader * 100)}% - 5px)` }
        }
      )))), /* @__PURE__ */ React.createElement("div", { className: "deck-pane d2-pane bw-deck-pane bw-d2-pane" }, /* @__PURE__ */ React.createElement("div", { className: "dp-head bw-dp-head" }, /* @__PURE__ */ React.createElement("span", { className: "dp-title bw-dp-title" }, "DK 2"), /* @__PURE__ */ React.createElement("span", { className: "dp-rem bw-dp-rem" }, (deck2 == null ? void 0 : deck2.duration) || "-02:41")), /* @__PURE__ */ React.createElement("div", { className: `hito-banner bw-hito-banner ${d2IsAlert ? "alert-mode" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "hb-bars bw-hb-bars" }, d2IsAlert ? `2 BARS \xB7 ${formatSec(d2RemainingSec)}` : `${d2RemainingBars} BARS \xB7 ${formatSec(d2RemainingSec)}`), /* @__PURE__ */ React.createElement("div", { className: "hb-name bw-hb-name" }, d2IsAlert ? `INMINENTE: ${(d2NextHito == null ? void 0 : d2NextHito.label) || "MAIN DROP"}` : `NEXT: ${(d2NextHito == null ? void 0 : d2NextHito.label) || "MAIN DROP"}`), /* @__PURE__ */ React.createElement("div", { className: "hb-bar bw-hb-bar" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "hb-fill bw-hb-fill",
          style: { width: `${d2ProgressPct}%` }
        }
      ))), /* @__PURE__ */ React.createElement("div", { className: "cue-list bw-cue-list", id: "main-d2-list" }, hitosD2.map((h, idx) => {
        const IconComponent = HitoIcons[h.key] || HitoIcons.intro;
        const isActive = d2ActiveHito === idx;
        const isAlert = isCriticalAlert && idx === 3;
        const isNext = !isActive && !isAlert && idx === 3;
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: h.id || idx,
            type: "button",
            onClick: () => setD2ActiveHito(idx),
            className: `cue-btn bw-cue-btn ${isAlert ? "is-alert" : isActive ? "is-active" : isNext ? "is-next" : ""}`,
            title: `Hito DK2: ${h.label} (${h.time})`
          },
          /* @__PURE__ */ React.createElement("span", { className: "c-ico bw-c-ico" }, /* @__PURE__ */ React.createElement(IconComponent, null)),
          /* @__PURE__ */ React.createElement("span", { className: "c-lbl bw-c-lbl" }, h.label),
          /* @__PURE__ */ React.createElement("span", { className: "c-time bw-c-time" }, h.time),
          /* @__PURE__ */ React.createElement("span", { className: "c-led bw-c-led" })
        );
      })))),
      /* @__PURE__ */ React.createElement("div", { className: "mx-footer bw-mx-footer select-none" }, /* @__PURE__ */ React.createElement("span", null, "LOW SWAP: ARMED"), /* @__PURE__ */ React.createElement("span", null, "\xB7"), /* @__PURE__ */ React.createElement("span", { className: "mx-status-label bw-mx-status-label" }, isCriticalAlert ? "ALERTA < 5S" : `AUDIT: ${auditScore}%`))
    );
  });

  // web/js/copilot.jsx
  var { useState: useState2, useEffect: useEffect2, useRef: useRef2, useMemo: useMemo2 } = React;
  var SlidersIcon = ({ size = 14, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className }, /* @__PURE__ */ React.createElement("line", { x1: "4", y1: "21", x2: "4", y2: "14" }), /* @__PURE__ */ React.createElement("line", { x1: "4", y1: "10", x2: "4", y2: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "21", x2: "12", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "8", x2: "12", y2: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "20", y1: "21", x2: "20", y2: "16" }), /* @__PURE__ */ React.createElement("line", { x1: "20", y1: "12", x2: "20", y2: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "1", y1: "14", x2: "7", y2: "14" }), /* @__PURE__ */ React.createElement("line", { x1: "9", y1: "8", x2: "15", y2: "8" }), /* @__PURE__ */ React.createElement("line", { x1: "17", y1: "16", x2: "23", y2: "16" }));
  var DEFAULT_VINYL_SVG = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="12" fill="#0d0d14"/><circle cx="80" cy="80" r="58" fill="#14141f" stroke="#27273a" stroke-width="2"/><circle cx="80" cy="80" r="44" fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/><circle cx="80" cy="80" r="30" fill="none" stroke="#22d3ee" stroke-width="1.5" opacity="0.5"/><circle cx="80" cy="80" r="14" fill="#06b6d4"/><circle cx="80" cy="80" r="5" fill="#09090b"/></svg>');
  function getValidCover(c) {
    if (!c || typeof c !== "string") return DEFAULT_VINYL_SVG;
    if (c.startsWith("data:") || c.startsWith("http://") || c.startsWith("https://") || c.startsWith("/")) return c;
    return "https://i.scdn.co/image/" + c;
  }
  function computeTrackStructuralBands(xNorm, seed) {
    const s = (seed % 17 - 8) * 6e-3;
    const b1Start = Math.max(0.16, 0.22 + s);
    const b1End = b1Start + 0.12;
    const drop1End = b1End + 0.24;
    const b2Start = drop1End;
    const b2End = b2Start + 0.14;
    const drop2End = Math.min(0.88, b2End + 0.2);
    let bass = 0.15, drums = 0.15, vocals = 0.15, treble = 0.15;
    let isBreak = false;
    const beatGridKick = Math.pow(Math.abs(Math.cos(xNorm * 180 + seed)), 8);
    const snareHit = Math.pow(Math.abs(Math.sin(xNorm * 90 + seed)), 10);
    const hatPattern = 0.4 + 0.6 * Math.pow(Math.abs(Math.sin(xNorm * 360)), 3);
    if (xNorm < b1Start) {
      const p = xNorm / b1Start;
      bass = 0.7 + 0.25 * beatGridKick;
      drums = (0.5 + 0.35 * snareHit) * Math.min(1, p * 1.5);
      vocals = 0.2 + 0.25 * p * (0.6 + 0.4 * Math.sin(xNorm * 40));
      treble = (0.3 + 0.45 * p) * hatPattern;
    } else if (xNorm >= b1Start && xNorm < b1End) {
      isBreak = true;
      const p = (xNorm - b1Start) / (b1End - b1Start);
      bass = 0.04 + 0.03 * Math.sin(xNorm * 15);
      drums = 0.1 + 0.4 * Math.pow(p, 2) * snareHit;
      vocals = 0.85 + 0.15 * Math.sin(p * Math.PI) * (0.8 + 0.2 * Math.cos(xNorm * 30));
      treble = 0.4 + 0.55 * Math.pow(p, 1.8);
    } else if (xNorm >= b1End && xNorm < drop1End) {
      bass = 0.92 + 0.08 * beatGridKick;
      drums = 0.88 + 0.12 * snareHit;
      vocals = 0.65 + 0.25 * Math.sin(xNorm * 35);
      treble = 0.82 + 0.18 * hatPattern;
    } else if (xNorm >= b2Start && xNorm < b2End) {
      isBreak = true;
      const p = (xNorm - b2Start) / (b2End - b2Start);
      bass = 0.03 + 0.02 * Math.cos(xNorm * 10);
      drums = 0.08 + 0.5 * Math.pow(p, 2.5) * snareHit;
      vocals = 0.95 + 0.05 * Math.sin(p * Math.PI);
      treble = 0.45 + 0.5 * p;
    } else if (xNorm >= b2End && xNorm < drop2End) {
      bass = 0.98 + 0.02 * beatGridKick;
      drums = 0.92 + 0.08 * snareHit;
      vocals = 0.7 + 0.2 * Math.sin(xNorm * 45);
      treble = 0.88 + 0.12 * hatPattern;
    } else {
      const p = (xNorm - drop2End) / (1 - drop2End);
      bass = Math.max(0.08, (0.75 - 0.6 * p) * (0.8 + 0.2 * beatGridKick));
      drums = Math.max(0.08, 0.55 - 0.45 * p);
      vocals = Math.max(0.05, 0.35 - 0.3 * p);
      treble = Math.max(0.05, 0.45 - 0.38 * p);
    }
    return { bass, drums, vocals, treble, isBreak };
  }
  var PlatformSeratoLogo = ({ size = 20, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 32 32", fill: "none", xmlns: "http://www.w3.org/2000/svg", className }, /* @__PURE__ */ React.createElement("rect", { width: "32", height: "32", rx: "7", fill: "#021a24" }), /* @__PURE__ */ React.createElement("path", { d: "M7 21.5L12.5 9H16.5L11 21.5H7Z", fill: "#00d1e8" }), /* @__PURE__ */ React.createElement("path", { d: "M14 23L19.5 10.5H23.5L18 23H14Z", fill: "#00d1e8" }), /* @__PURE__ */ React.createElement("path", { d: "M21 21.5L24.5 13.5H27.5L24 21.5H21Z", fill: "#22d3ee", fillOpacity: "0.8" }), /* @__PURE__ */ React.createElement("circle", { cx: "26", cy: "23", r: "1.5", fill: "#00d1e8" }));
  var PlatformRekordboxLogo = ({ size = 20, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 32 32", fill: "none", xmlns: "http://www.w3.org/2000/svg", className }, /* @__PURE__ */ React.createElement("rect", { width: "32", height: "32", rx: "7", fill: "#091b33" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "9", stroke: "#38bdf8", strokeWidth: "2", strokeDasharray: "3 1.5" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "5", stroke: "#00e5ff", strokeWidth: "1.8" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "2", fill: "#38bdf8" }), /* @__PURE__ */ React.createElement("path", { d: "M16 4V8M16 24V28M4 16H8M24 16H28", stroke: "#00e5ff", strokeWidth: "1.5", strokeLinecap: "round" }));
  var PlatformVirtualDjLogo = ({ size = 20, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 32 32", fill: "none", xmlns: "http://www.w3.org/2000/svg", className }, /* @__PURE__ */ React.createElement("rect", { width: "32", height: "32", rx: "7", fill: "#2a1202" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "10", stroke: "#f97316", strokeWidth: "1.6" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "6.5", stroke: "#fb923c", strokeWidth: "0.8", strokeDasharray: "1.5 1.5" }), /* @__PURE__ */ React.createElement("text", { x: "16", y: "19", textAnchor: "middle", fill: "#ffedd5", fontSize: "8", fontWeight: "900", fontFamily: "system-ui, sans-serif", letterSpacing: "0.5" }, "VDJ"));
  var PlatformTraktorLogo = ({ size = 20, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 32 32", fill: "none", xmlns: "http://www.w3.org/2000/svg", className }, /* @__PURE__ */ React.createElement("rect", { width: "32", height: "32", rx: "7", fill: "#241a02" }), /* @__PURE__ */ React.createElement("rect", { x: "7", y: "8", width: "18", height: "4", rx: "1", fill: "#facc15" }), /* @__PURE__ */ React.createElement("path", { d: "M13.5 12H18.5V23.5C18.5 24.3 17.8 25 17 25H15C14.2 25 13.5 24.3 13.5 23.5V12Z", fill: "#facc15" }), /* @__PURE__ */ React.createElement("circle", { cx: "22", cy: "19", r: "2", fill: "#eab308" }));
  var PlatformAutoLogo = ({ size = 20, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 32 32", fill: "none", xmlns: "http://www.w3.org/2000/svg", className }, /* @__PURE__ */ React.createElement("rect", { width: "32", height: "32", rx: "7", fill: "#1e0c2e" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "9", stroke: "#a855f7", strokeWidth: "1.5", strokeDasharray: "3 2" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "5", stroke: "#c084fc", strokeWidth: "1.5" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "2", fill: "#e9d5ff" }), /* @__PURE__ */ React.createElement("path", { d: "M16 6L18.5 10.5L16 9.2L13.5 10.5L16 6Z", fill: "#a855f7" }), /* @__PURE__ */ React.createElement("path", { d: "M16 26L13.5 21.5L16 22.8L18.5 21.5L16 26Z", fill: "#a855f7" }));
  var CopilotTurntableLogo = ({ size = 20, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", className }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "8.5" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3.2" }), /* @__PURE__ */ React.createElement("path", { d: "M12 3.5v5.3M12 15.2v5.3" }));
  var ZapIcon = ({ size = 10, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", className }, /* @__PURE__ */ React.createElement("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" }));
  var ActivityIcon = ({ size = 10, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", className }, /* @__PURE__ */ React.createElement("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }));
  var SparklesIcon = ({ size = 10, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", className }, /* @__PURE__ */ React.createElement("path", { d: "m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" }));
  var PlatformLogos = {
    auto: PlatformAutoLogo,
    serato: PlatformSeratoLogo,
    rekordbox: PlatformRekordboxLogo,
    virtualdj: PlatformVirtualDjLogo,
    traktor: PlatformTraktorLogo
  };
  var renderPlatformLogo = (id, size = 20, className = "") => {
    const key = (id || "auto").toLowerCase();
    const Comp = PlatformLogos[key] || PlatformLogos.auto;
    return /* @__PURE__ */ React.createElement(Comp, { size, className });
  };
  var CopilotSeratoWaveform = ({
    deck,
    side = "1",
    antiMuddy = null,
    partnerDeck = null,
    isCompact = false
  }) => {
    const canvasRef = useRef2(null);
    const minimapRef = useRef2(null);
    const minimapCacheRef = useRef2(null);
    const [zoom, setZoom] = useState2(4);
    const [showTacticalAids, setShowTacticalAids] = useState2(true);
    const [hoveredMilestone, setHoveredMilestone] = useState2(null);
    const [progress, setProgress] = useState2(deck.play_progress || 0.15);
    const progressRef = useRef2(deck.play_progress || 0.15);
    const isPlayingRef = useRef2(Boolean(deck.is_playing));
    const bpmRef = useRef2(deck.bpm || 130);
    const durationSecRef = useRef2(deck.duration_sec || 390);
    useEffect2(() => {
      if (deck.play_progress !== void 0) {
        const diff = Math.abs(progressRef.current - deck.play_progress);
        if (diff > 0.02) {
          progressRef.current = deck.play_progress;
          setProgress(deck.play_progress);
        }
      }
      isPlayingRef.current = Boolean(deck.is_playing);
      bpmRef.current = parseFloat(deck.bpm) || 130;
      durationSecRef.current = parseFloat(deck.duration_sec) || 390;
    }, [deck.play_progress, deck.is_playing, deck.bpm, deck.duration_sec]);
    useEffect2(() => {
      let animId;
      let lastTime = performance.now();
      let lastUiUpdate = 0;
      const tick = (now) => {
        const dt = (now - lastTime) / 1e3;
        lastTime = now;
        if (isPlayingRef.current && durationSecRef.current > 0) {
          const advance = dt / durationSecRef.current;
          const next = (progressRef.current + advance) % 1;
          progressRef.current = next;
          if (now - lastUiUpdate >= 33) {
            lastUiUpdate = now;
            setProgress(next);
          }
        }
        if (isPlayingRef.current) {
          animId = requestAnimationFrame(tick);
        }
      };
      if (isPlayingRef.current) {
        animId = requestAnimationFrame(tick);
      }
      return () => {
        if (animId) cancelAnimationFrame(animId);
      };
    }, [deck.is_playing]);
    const rawId = deck.file_path || deck.title || "1";
    const seed = rawId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;
    const durSec = deck.duration_sec || 390;
    const elapsedSec = progress * durSec;
    const remainSec = Math.max(0, durSec - elapsedSec);
    const formatSec = (s) => {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };
    const cues = deck.cues || [
      { id: 1, name: "Downbeat 1.0.0", color: "#ef4444", pct: 0.04, time: "00:00.25", directive: "Punto de anclaje inicial. Arranca beatmatching aqu\xED." },
      { id: 2, name: "Intro Perc", color: "#f97316", pct: 0.16, time: "01:04.00", directive: "Entrada de caja y charles. Inicia subida gradual del fader." },
      { id: 3, name: "Bassline In", color: "#eab308", pct: 0.32, time: "02:08.00", directive: "Aparecen graves dominantes. Revisa EQ Low del otro deck." },
      { id: 4, name: "MAIN DROP", color: "#10b981", pct: 0.48, time: "03:12.00", directive: "Cl\xEDmax 100% de potencia. Corta totalmente los graves del deck saliente." },
      { id: 5, name: "Breakdown", color: "#06b6d4", pct: 0.62, time: "04:16.00", directive: "Par\xF3n mel\xF3dico sin bombo. Ventana id\xF3nea para transiciones vocales." },
      { id: 6, name: "Climax 2", color: "#22d3ee", pct: 0.74, time: "05:04.00", directive: "Segundo impacto de sala. Mant\xE9n energ\xEDa alta." },
      { id: 7, name: "Outro 32b", color: "#8b5cf6", pct: 0.86, time: "06:08.00", directive: "Se retiran capas r\xEDtmicas. Zona recomendada para mezclar track entrante." },
      { id: 8, name: "Cut / Fade", color: "#ec4899", pct: 0.96, time: "07:15.00", directive: "Final de pista. Fade-out o corte antes del silencio." }
    ];
    const phases = deck.structural_phases || [
      { id: "intro", name: "Intro", start_pct: 0, end_pct: 0.16, type: "intro", label: "Intro 32b \u2022 Mezcla In", color: "#06b6d4", directive: "32 compases de entrada. Sincroniza beatgrid." },
      { id: "build", name: "Bassline In", start_pct: 0.16, end_pct: 0.35, type: "build", label: "Bassline Activa", color: "#eab308", directive: "Filtra frecuencias sub con filtro High-Pass." },
      { id: "break", name: "Breakdown", start_pct: 0.35, end_pct: 0.48, type: "break", label: "Breakdown (Sin Graves)", color: "#38bdf8", directive: "Sin bombo. Oportunidad para cruce de leads o acapellas." },
      { id: "drop", name: "MAIN DROP", start_pct: 0.48, end_pct: 0.74, type: "drop", label: "\u26A1 DROP PRINCIPAL (Cl\xEDmax)", color: "#ef4444", directive: "Energ\xEDa m\xE1xima en pista. Kill switch en graves opuestos." },
      { id: "break2", name: "Segundo Par\xF3n", start_pct: 0.74, end_pct: 0.82, type: "break", label: "Puente Mel\xF3dico", color: "#a855f7", directive: "Transici\xF3n mel\xF3dica antes del outro." },
      { id: "outro", name: "Outro", start_pct: 0.82, end_pct: 1, type: "outro", label: "\u{1F7E2} MEZCLA SEGURA (Outro)", color: "#10b981", directive: "Zona segura de mezcla. Abre canal entrante." }
    ];
    const nextCue = cues.find((c) => (c.pct || 0) > progress);
    const beatsToNextCue = nextCue && deck.bpm ? Math.round((nextCue.pct - progress) * durSec / (60 / deck.bpm)) : null;
    const barsToNextCue = beatsToNextCue ? Math.max(1, Math.ceil(beatsToNextCue / 4)) : null;
    const timeToNextCue = nextCue ? Math.max(0, (nextCue.pct - progress) * durSec) : 0;
    const isBassClashDanger = antiMuddy && antiMuddy.status === "danger" && (deck.low_ratio || 0) >= 44;
    useEffect2(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || canvas.parentElement.clientWidth || 550;
      const h = 88;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx.resetTransform) ctx.resetTransform();
      else ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#05050a";
      ctx.fillRect(0, 0, w, h);
      const midY = h / 2;
      const playheadX = w / 2;
      const windowSec = durSec / zoom;
      const halfWindowSec = windowSec / 2;
      const currentSec = progress * durSec;
      const startSec = currentSec - halfWindowSec;
      const endSec = currentSec + halfWindowSec;
      const bpm = deck.bpm || 130;
      const beatSec = 60 / bpm;
      if (beatSec > 0) {
        const firstBeatIdx = Math.floor(startSec / beatSec);
        const lastBeatIdx = Math.ceil(endSec / beatSec);
        for (let b = firstBeatIdx; b <= lastBeatIdx; b++) {
          const bSec = b * beatSec;
          const bx = playheadX + (bSec - currentSec) / windowSec * w;
          if (bx >= 0 && bx <= w) {
            const isBar = b % 4 === 0;
            const isPhrase = b % 16 === 0;
            ctx.strokeStyle = isPhrase ? "rgba(255, 255, 255, 0.45)" : isBar ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.08)";
            ctx.lineWidth = isPhrase ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(bx, isBar ? 6 : 14);
            ctx.lineTo(bx, h - (isBar ? 6 : 14));
            ctx.stroke();
            if (isBar && bx > 15 && bx < w - 25) {
              ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
              ctx.font = "8px monospace";
              ctx.fillText(`${Math.floor(b / 4) + 1}`, bx + 2, 12);
            }
          }
        }
      }
      if (showTacticalAids) {
        phases.forEach((ph) => {
          const phStartSec = ph.start_pct * durSec;
          const phEndSec = ph.end_pct * durSec;
          if (phEndSec >= startSec && phStartSec <= endSec) {
            const x1 = Math.max(0, playheadX + (phStartSec - currentSec) / windowSec * w);
            const x2 = Math.min(w, playheadX + (phEndSec - currentSec) / windowSec * w);
            if (x2 > x1) {
              ctx.fillStyle = `${ph.color}14`;
              ctx.fillRect(x1, 0, x2 - x1, h);
              ctx.fillStyle = `${ph.color}88`;
              ctx.fillRect(x1, 0, x2 - x1, 2);
            }
          }
        });
        if (isBassClashDanger) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.18)";
          ctx.fillRect(playheadX - 60, 0, 120, h);
          ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
          ctx.lineWidth = 1;
          ctx.strokeRect(playheadX - 60, 0, 120, h);
        }
      }
      const stepPx = 2;
      const totalSlices = Math.ceil(w / stepPx);
      for (let i = 0; i < totalSlices; i++) {
        const x = i * stepPx;
        const sliceSec = startSec + x / w * windowSec;
        const sliceNorm = sliceSec / durSec;
        if (sliceNorm >= 0 && sliceNorm <= 1) {
          const { bass, drums, vocals, treble } = computeTrackStructuralBands(sliceNorm, seed);
          const maxAmp = h / 2 - 8;
          const bassAmp = bass * maxAmp * 0.95;
          ctx.fillStyle = "#22d3ee";
          ctx.fillRect(x, midY - bassAmp, stepPx - 0.4, bassAmp * 2);
          const midAmp = Math.max(drums, vocals) * maxAmp * 0.72;
          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(x, midY - midAmp, stepPx - 0.4, midAmp * 2);
          const trebAmp = treble * maxAmp * 0.48;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x, midY - trebAmp, stepPx - 0.4, trebAmp * 2);
          if (bass > 0.85) {
            ctx.fillStyle = "#38bdf8";
            ctx.fillRect(x, midY - 2, stepPx - 0.4, 4);
          }
        }
      }
      if (showTacticalAids) {
        cues.forEach((cue) => {
          const cueSec = (cue.pct !== void 0 ? cue.pct : 0) * durSec;
          if (cueSec >= startSec && cueSec <= endSec) {
            const cx = playheadX + (cueSec - currentSec) / windowSec * w;
            if (cx >= 0 && cx <= w) {
              ctx.strokeStyle = cue.color || "#06b6d4";
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(cx, 0);
              ctx.lineTo(cx, h);
              ctx.stroke();
              ctx.fillStyle = cue.color || "#06b6d4";
              ctx.fillRect(cx - 1, 2, 16, 12);
              ctx.fillStyle = "#000000";
              ctx.font = "bold 8px monospace";
              ctx.fillText(`C${cue.id || ""}`, cx + 2, 11);
            }
          }
        });
      }
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(playheadX - 5, 0);
      ctx.lineTo(playheadX + 5, 0);
      ctx.lineTo(playheadX, 8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(playheadX - 5, h);
      ctx.lineTo(playheadX + 5, h);
      ctx.lineTo(playheadX, h - 8);
      ctx.closePath();
      ctx.fill();
      const miniCanvas = minimapRef.current;
      if (!miniCanvas) return;
      const mRect = miniCanvas.getBoundingClientRect();
      const mw = mRect.width || miniCanvas.parentElement.clientWidth || 550;
      const mh = 22;
      miniCanvas.width = Math.round(mw * dpr);
      miniCanvas.height = Math.round(mh * dpr);
      const mCtx = miniCanvas.getContext("2d");
      if (mCtx.resetTransform) mCtx.resetTransform();
      else mCtx.setTransform(1, 0, 0, 1, 0, 0);
      mCtx.scale(dpr, dpr);
      const cacheKey = `${rawId}_${mw}_${showTacticalAids}`;
      if (!minimapCacheRef.current || minimapCacheRef.current.key !== cacheKey) {
        const off = document.createElement("canvas");
        off.width = Math.round(mw * dpr);
        off.height = Math.round(mh * dpr);
        const oCtx = off.getContext("2d");
        if (oCtx.resetTransform) oCtx.resetTransform();
        else oCtx.setTransform(1, 0, 0, 1, 0, 0);
        oCtx.scale(dpr, dpr);
        oCtx.fillStyle = "#06060e";
        oCtx.fillRect(0, 0, mw, mh);
        const mStep = 2;
        const mSlices = Math.ceil(mw / mStep);
        for (let j = 0; j < mSlices; j++) {
          const mx = j * mStep;
          const mNorm = mx / mw;
          const { bass, treble } = computeTrackStructuralBands(mNorm, seed);
          const mHalf = mh / 2;
          const bAmp = bass * (mHalf - 2);
          const tAmp = treble * (mHalf - 3);
          oCtx.fillStyle = "#22d3ee";
          oCtx.fillRect(mx, mHalf - bAmp, mStep - 0.4, bAmp * 2);
          oCtx.fillStyle = "#06b6d4";
          oCtx.fillRect(mx, mHalf - tAmp, mStep - 0.4, tAmp * 2);
        }
        if (showTacticalAids) {
          phases.forEach((ph) => {
            const px1 = ph.start_pct * mw;
            const px2 = ph.end_pct * mw;
            oCtx.fillStyle = `${ph.color}25`;
            oCtx.fillRect(px1, 0, px2 - px1, mh);
            oCtx.fillStyle = ph.color;
            oCtx.fillRect(px1, 0, px2 - px1, 1.5);
          });
          cues.forEach((cue) => {
            const cx = (cue.pct || 0) * mw;
            oCtx.fillStyle = cue.color || "#06b6d4";
            oCtx.fillRect(cx - 0.5, 0, 1.5, mh);
          });
        }
        minimapCacheRef.current = { key: cacheKey, canvas: off };
      }
      mCtx.drawImage(minimapCacheRef.current.canvas, 0, 0, mw, mh);
      const vStart = Math.max(0, startSec / durSec * mw);
      const vEnd = Math.min(mw, endSec / durSec * mw);
      mCtx.fillStyle = "rgba(255, 255, 255, 0.15)";
      mCtx.fillRect(vStart, 0, Math.max(4, vEnd - vStart), mh);
      mCtx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      mCtx.lineWidth = 1;
      mCtx.strokeRect(vStart, 0, Math.max(4, vEnd - vStart), mh);
      const mPlayheadX = progress * mw;
      mCtx.fillStyle = "#ffffff";
      mCtx.fillRect(mPlayheadX - 1, 0, 2, mh);
    }, [zoom, showTacticalAids, progress, deck, antiMuddy, isBassClashDanger]);
    const handleMinimapClick = (e) => {
      const miniCanvas = minimapRef.current;
      if (!miniCanvas) return;
      const rect = miniCanvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newPct = Math.max(0, Math.min(1, clickX / rect.width));
      progressRef.current = newPct;
      setProgress(newPct);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2 p-2 sm:p-2.5 rounded-2xl bg-[#030308] border border-zinc-800/90 shadow-inner" }, !isCompact && showTacticalAids && /* @__PURE__ */ React.createElement("div", { className: "relative p-2 rounded-xl bg-zinc-950/90 border border-zinc-800/80 shadow-md" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, isBassClashDanger ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500 text-red-200 font-mono text-[11px] font-bold shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse ring-1 ring-red-400" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm" }, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("span", null, "EN 8 COMPASES (00:12) \u2794 BASS CLASH: Cortar Low EQ")) : nextCue ? timeToNextCue <= 5 && timeToNextCue > 0 ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white font-mono text-[11px] font-black shadow-[0_0_25px_rgba(239,68,68,1)] ring-2 ring-red-400 border border-white animate-pulse scale-105" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm animate-bounce" }, "\u{1F6A8}"), /* @__PURE__ */ React.createElement("span", null, "\xA1ATENCI\xD3N! EN ", /* @__PURE__ */ React.createElement("strong", { className: "text-yellow-300 font-orbitron" }, formatSec(timeToNextCue)), " \u2794 ", /* @__PURE__ */ React.createElement("span", { className: "uppercase tracking-wider" }, nextCue.name))) : /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-djcyan-950/60 border border-djcyan-500/60 text-djcyan-300 font-mono text-[11px] font-bold" }, /* @__PURE__ */ React.createElement("span", null, "\u23F3"), /* @__PURE__ */ React.createElement("span", null, "EN ", /* @__PURE__ */ React.createElement("strong", { className: "text-white font-orbitron" }, barsToNextCue), " BARS (", formatSec(timeToNextCue), ") \u2794 ", /* @__PURE__ */ React.createElement("span", { className: "text-white uppercase" }, nextCue.name))) : /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F7E2}"), /* @__PURE__ */ React.createElement("span", null, "EN ZONA SEGURA DE MEZCLA (OUTRO)"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono uppercase text-amber-400 font-bold mr-1 hidden md:inline" }, "\u{1F3AF} Hitos:"), phases.map((ph) => {
      const phStart = ph.start_pct || 0;
      const isPassed = phStart <= progress;
      const isCurrent = progress >= ph.start_pct && progress < ph.end_pct;
      const iconsMap = { intro: "\u{1F680}", build: "\u{1F6D1}", break: "\u{1F30A}", break2: "\u{1F30A}", drop: "\u{1F3AF}", outro: "\u{1F3C1}" };
      const icon = iconsMap[ph.type] || "\u26A1";
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: ph.id,
          onMouseEnter: () => setHoveredMilestone({
            name: ph.name || ph.label,
            time: formatSec(ph.start_pct * durSec),
            pct: ph.start_pct,
            color: ph.color,
            directive: ph.directive || ph.label
          }),
          onMouseLeave: () => setHoveredMilestone(null),
          className: `relative px-1.5 py-0.5 rounded cursor-pointer transition-all text-[9px] font-mono font-bold flex items-center gap-1 border ${isCurrent ? "bg-amber-400 text-black border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.9)] scale-105 ring-1 ring-white" : isPassed ? "bg-zinc-900/80 text-zinc-400 border-zinc-800" : "bg-zinc-950 text-zinc-300 border-zinc-700/60 hover:border-amber-400"}`
        },
        /* @__PURE__ */ React.createElement("span", null, icon),
        /* @__PURE__ */ React.createElement("span", { className: "truncate max-w-[70px]" }, ph.name.toUpperCase())
      );
    }))), hoveredMilestone && /* @__PURE__ */ React.createElement("div", { className: "absolute left-2 right-2 top-full mt-1.5 z-30 p-2.5 rounded-xl bg-black/95 border border-djcyan-500/60 shadow-2xl backdrop-blur-md text-xs font-mono animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-zinc-800 pb-1 mb-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "font-syne font-bold text-white flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full", style: { backgroundColor: hoveredMilestone.color } }), hoveredMilestone.name, " (", hoveredMilestone.time, ")"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-djcyan-400 font-mono" }, "Comp\xE1s ", Math.round(hoveredMilestone.pct * durSec / (60 / (deck.bpm || 130)) / 4))), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-zinc-300 leading-relaxed" }, /* @__PURE__ */ React.createElement("strong", { className: "text-emerald-400" }, "Acci\xF3n DJ:"), " ", hoveredMilestone.directive || "Ajuste de ganancia y sincron\xEDa arm\xF3nica antes del drop."))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 flex-wrap text-xs font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, !isCompact && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowTacticalAids(!showTacticalAids),
        className: `flex items-center gap-1.5 px-2 py-0.5 rounded-lg font-bold uppercase transition-all cursor-pointer border text-[10px] sm:text-[11px] ${showTacticalAids ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300"}`,
        title: "Habilitar/Deshabilitar ayudas visuales (Drops, Cues, Zonas Seguras y Anti-Muddy) en el waveform"
      },
      /* @__PURE__ */ React.createElement("span", null, showTacticalAids ? "\u{1F3AF}" : "\u26AA"),
      /* @__PURE__ */ React.createElement("span", null, showTacticalAids ? "Ayudas DJ" : "Puro Wave")
    ), /* @__PURE__ */ React.createElement("div", { className: "hidden sm:flex items-center gap-2 px-2 py-0.5 rounded-md bg-zinc-950/80 border border-zinc-800 text-[9px] text-zinc-400" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-[#22d3ee]" }), "Graves (<200Hz)"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-[#f59e0b]" }), "Medios"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-[#ffffff]" }), "Agudos"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px]" }, [2, 4, 8, 16].map((z) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: z,
        type: "button",
        onClick: () => setZoom(z),
        className: `px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${zoom === z ? "bg-djcyan-500 text-black shadow" : "text-zinc-400 hover:text-white"}`
      },
      z,
      "x"
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[10px] sm:text-[11px]" }, /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold" }, formatSec(elapsedSec)), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-600" }, "/"), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-400" }, "-", formatSec(remainSec))))), /* @__PURE__ */ React.createElement("div", { className: "relative w-full rounded-xl overflow-hidden border border-zinc-800/80 bg-[#05050b]" }, /* @__PURE__ */ React.createElement(
      "canvas",
      {
        ref: canvasRef,
        style: { width: "100%", height: "88px", display: "block" }
      }
    )), /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: handleMinimapClick,
        className: "relative w-full rounded-lg overflow-hidden border border-zinc-800/60 bg-[#06060e] cursor-pointer hover:border-zinc-700 transition-colors",
        title: "Haz clic en cualquier punto para saltar en la pista"
      },
      /* @__PURE__ */ React.createElement(
        "canvas",
        {
          ref: minimapRef,
          style: { width: "100%", height: "22px", display: "block" }
        }
      )
    ));
  };
  var MASTER_TRACKS_POOL = [
    {
      id: "rec_1",
      title: "Higher (Original Mix)",
      artist: "Amelie Lens",
      bpm: 138,
      camelot: "10A",
      raw_key: "Bm",
      role: "Percussive Tool",
      lufs: -6.5,
      low_ratio: 36,
      genre: "Acid / Peak Techno",
      subgenre: "Lenske Peak",
      energy: 94,
      danceability: 89,
      arousal: 92,
      mood: "Acid Drive",
      format: "FLAC 24-bit",
      duration: "06:12",
      year: "2023",
      cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
      strategy: "Mezcla Arm\xF3nica Segura",
      reason: "Mismo tono (10A) y espectro percusivo limpio. Cero riesgo de embarre en graves.",
      camelot_color: "#f472b6"
    },
    {
      id: "rec_2",
      title: "Your Mind (Extended Club)",
      artist: "Adam Beyer & Bart Skils",
      bpm: 138.5,
      camelot: "11A",
      raw_key: "F#m",
      role: "Peak Time Driver",
      lufs: -5.9,
      low_ratio: 49,
      genre: "Drumcode Techno",
      subgenre: "Drumcode Peak",
      energy: 96,
      danceability: 92,
      arousal: 95,
      mood: "Peak Time Climax",
      format: "FLAC Hi-Res",
      duration: "07:22",
      year: "2022",
      cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
      strategy: "Subid\xF3n de Energ\xEDa (+1)",
      reason: "Aumento arm\xF3nico a 11A con +1.0 BPM. Eleva la intensidad del club para el cl\xEDmax.",
      camelot_color: "#fb7185"
    },
    {
      id: "rec_3",
      title: "Old School",
      artist: "Hertz",
      bpm: 138,
      camelot: "10A",
      raw_key: "Bm",
      role: "Industrial Driver",
      lufs: -6.2,
      low_ratio: 38,
      genre: "Hard Techno Industrial",
      subgenre: "Sway Records",
      energy: 93,
      danceability: 91,
      arousal: 90,
      mood: "Raw Industrial",
      format: "FLAC 24-bit",
      duration: "05:12",
      year: "2024",
      cover: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop",
      strategy: "Groove Industrial Limpio",
      reason: "Mismo Camelot (10A), pegada seca sin saturar sub-graves. Transici\xF3n directa perfecta.",
      camelot_color: "#f472b6"
    },
    {
      id: "rec_4",
      title: "Booster (Gary Beck Remix)",
      artist: "Planetary Assault Systems",
      bpm: 137.5,
      camelot: "10A",
      raw_key: "Bm",
      role: "Percussive Descongestor",
      lufs: -7.1,
      low_ratio: 32,
      genre: "Hypnotic / Raw",
      subgenre: "Mote-Evolver",
      energy: 88,
      danceability: 86,
      arousal: 85,
      mood: "Hypnotic Groove",
      format: "WAV 24-bit",
      duration: "05:48",
      year: "2021",
      cover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=300&fit=crop",
      strategy: "Descongesti\xF3n de Sala",
      reason: "Textura enfocada en medios y agudos. Ideal para limpiar la sala tras un drop saturado.",
      camelot_color: "#f472b6"
    },
    {
      id: "rec_5",
      title: "Subversion",
      artist: "Enrico Sangiuliano",
      bpm: 138,
      camelot: "11A",
      raw_key: "F#m",
      role: "Cosmic Climax",
      lufs: -6,
      low_ratio: 44,
      genre: "Peak Time Techno",
      subgenre: "NINETOZERO",
      energy: 95,
      danceability: 90,
      arousal: 94,
      mood: "Cosmic Meltdown",
      format: "FLAC Hi-Res",
      duration: "06:48",
      year: "2023",
      cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
      strategy: "Ascensi\xF3n Hipn\xF3tica",
      reason: "Sintetizadores espaciales que abren el panorama est\xE9reo antes de cortar los bajos.",
      camelot_color: "#fb7185"
    },
    {
      id: "rec_6",
      title: "Rave Generation",
      artist: "Reinier Zonneveld",
      bpm: 139,
      camelot: "11A",
      raw_key: "F#m",
      role: "Acid Meltdown",
      lufs: -5.5,
      low_ratio: 46,
      genre: "Acid Techno",
      subgenre: "Filth on Acid",
      energy: 98,
      danceability: 94,
      arousal: 98,
      mood: "High Energy Climax",
      format: "WAV 24-bit",
      duration: "06:15",
      year: "2024",
      cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
      strategy: "Explosi\xF3n Peak Time",
      reason: "Energ\xEDa m\xE1xima para cerrar el set. Requiere swap r\xE1pido de EQ Low en drop.",
      camelot_color: "#fb7185"
    },
    {
      id: "rec_7",
      title: "Age of Love (Charlotte de Witte Remix)",
      artist: "Age of Love",
      bpm: 138,
      camelot: "9A",
      raw_key: "Em",
      role: "Peak Acid Driver",
      lufs: -5.8,
      low_ratio: 41,
      genre: "Peak Techno",
      subgenre: "Diki Records",
      energy: 96,
      danceability: 92,
      arousal: 95,
      mood: "Euphoric Peak",
      format: "FLAC 24-bit",
      duration: "07:30",
      year: "2021",
      cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop",
      strategy: "Descenso Arm\xF3nico Suave (-1)",
      reason: "Transici\xF3n diagonal suave a 9A, manteniendo la tensi\xF3n alta en el p\xFAblico.",
      camelot_color: "#818cf8"
    },
    {
      id: "rec_8",
      title: "Consciousness",
      artist: "Anyma & Chris Avantgarde",
      bpm: 130,
      camelot: "8A",
      raw_key: "Am",
      role: "Melodic Journey",
      lufs: -6.4,
      low_ratio: 35,
      genre: "Melodic Techno",
      subgenre: "Afterlife",
      energy: 90,
      danceability: 88,
      arousal: 89,
      mood: "Atmospheric Meltdown",
      format: "FLAC Hi-Res",
      duration: "05:48",
      year: "2022",
      cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
      strategy: "Cruce Mel\xF3dico Espacioso",
      reason: "Ideal para bajar de BPM o abrir el viaje mel\xF3dico con graves limpios.",
      camelot_color: "#c084fc"
    }
  ];
  var DEFAULT_COPILOT_STATE = {
    "connected": true,
    "source": "SERATO_LIVE",
    "platform": "serato",
    "platform_mode": "serato",
    "platform_name": "Serato DJ Pro",
    "platform_icon": "\u26A1",
    "platform_color": "#00d1e8",
    "platform_status": "LIVE",
    "detected_platforms": {
      "serato": true,
      "rekordbox": true,
      "virtualdj": true,
      "traktor": false
    },
    "deck_1": {
      "deck_num": "1",
      "status": "STANDBY (VAC\xCDO)",
      "is_master": false,
      "is_playing": false,
      "artist": "Deck Vac\xEDo",
      "title": "",
      "bpm": 0,
      "camelot": "--",
      "camelot_color": "#27272a",
      "raw_key": "",
      "file_path": "",
      "genre": "",
      "subgenre": "",
      "energy": 0,
      "danceability": 0,
      "valence": 0,
      "arousal": 0,
      "format": "",
      "duration": "--:--",
      "duration_sec": 0,
      "elapsed_sec": 0,
      "play_progress": 0,
      "phase": "Standby",
      "year": "",
      "cover": "",
      "cues": [],
      "structural_phases": [],
      "lufs": -99,
      "low_ratio": 0,
      "mid_ratio": 0,
      "high_ratio": 0,
      "acoustic_role": "Standby",
      "is_audited": false,
      "comment": "Deck vac\xEDo \u2022 Sin pista cargada en Serato ni en la mesa",
      "tactical_comment": "Deck vac\xEDo \u2022 Sin pista cargada en Serato ni en la mesa",
      "mood": "Standby"
    },
    "deck_2": {
      "deck_num": "2",
      "status": "STANDBY (VAC\xCDO)",
      "is_master": false,
      "is_playing": false,
      "artist": "Deck Vac\xEDo",
      "title": "",
      "bpm": 0,
      "camelot": "--",
      "camelot_color": "#27272a",
      "raw_key": "",
      "file_path": "",
      "genre": "",
      "subgenre": "",
      "energy": 0,
      "danceability": 0,
      "valence": 0,
      "arousal": 0,
      "format": "",
      "duration": "",
      "duration_sec": 0,
      "elapsed_sec": 0,
      "play_progress": 0,
      "phase": "Standby",
      "year": "",
      "cover": "",
      "cues": [],
      "structural_phases": [],
      "lufs": -99,
      "low_ratio": 0,
      "mid_ratio": 0,
      "high_ratio": 0,
      "acoustic_role": "",
      "is_audited": false,
      "comment": "Deck vac\xEDo \u2022 Sin pista cargada en Serato ni en la mesa",
      "tactical_comment": "Deck vac\xEDo \u2022 Sin pista cargada en Serato ni en la mesa",
      "mood": "Standby"
    },
    "anti_muddy": {
      "status": "safe",
      "tag": "CLEAN MIX",
      "title": "MEZCLA LIMPIA",
      "message": "Deck 2 sin pista cargada. Cero riesgo de cancelaci\xF3n ac\xFAstica. Carga la siguiente pista en Serato o la mesa.",
      "action": "Frecuencias equilibradas",
      "controller_knobs": {
        "filter_knob": "Centrado (12h)",
        "eq_low": "0 dB"
      }
    },
    "harmonic": {
      "score": 100,
      "type": "STANDBY",
      "label": "Deck 2 en Espera",
      "badge": "STANDBY",
      "color": "#10b981",
      "is_clash": false,
      "advice": "Deck 2 preparado. Carga una pista arm\xF3nicamente compatible en Serato o la mesa."
    },
    "lufs_delta": -0.8,
    "bpm_delta": -0.37,
    "bpm_pct": -0.28,
    "recommendations": [
      {
        "id": "rec_1",
        "title": "Higher (Original Mix)",
        "artist": "Amelie Lens",
        "bpm": 130,
        "camelot": "10A",
        "role": "Percussive Tool",
        "lufs": -6.5,
        "low_ratio": 36,
        "genre": "Acid / Peak Techno",
        "subgenre": "Lenske Peak",
        "energy": 94,
        "danceability": 89,
        "mood": "Acid Drive",
        "format": "FLAC 24-bit",
        "duration": "06:12",
        "year": "2023",
        "cover": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
        "strategy": "Mezcla Arm\xF3nica Segura",
        "reason": "Mismo tono (10A) y espectro percusivo limpio. Cero riesgo de embarre en graves.",
        "camelot_color": "#f472b6"
      },
      {
        "id": "rec_2",
        "title": "Your Mind (Extended Club)",
        "artist": "Adam Beyer & Bart Skils",
        "bpm": 131,
        "camelot": "11A",
        "role": "Peak Time Driver",
        "lufs": -5.9,
        "low_ratio": 49,
        "genre": "Drumcode Techno",
        "subgenre": "Drumcode Peak",
        "energy": 96,
        "danceability": 92,
        "mood": "Peak Time Climax",
        "format": "FLAC Hi-Res",
        "duration": "07:22",
        "year": "2022",
        "cover": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
        "strategy": "Subid\xF3n de Energ\xEDa (+1)",
        "reason": "Aumento arm\xF3nico a 11A con +1.0 BPM. Eleva la intensidad del club para el cl\xEDmax.",
        "camelot_color": "#fb7185"
      },
      {
        "id": "rec_3",
        "title": "Old School",
        "artist": "Hertz",
        "bpm": 130,
        "camelot": "10A",
        "role": "Industrial Driver",
        "lufs": -6.2,
        "low_ratio": 38,
        "genre": "Hard Techno Industrial",
        "subgenre": "Sway Records",
        "energy": 93,
        "danceability": 91,
        "mood": "Raw Industrial",
        "format": "FLAC 24-bit",
        "duration": "05:12",
        "year": "2024",
        "cover": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop",
        "strategy": "Groove Industrial Limpio",
        "reason": "Mismo Camelot (10A), pegada seca sin saturar sub-graves. Transici\xF3n directa perfecta.",
        "camelot_color": "#f472b6"
      },
      {
        "id": "rec_4",
        "title": "Booster (Gary Beck Remix)",
        "artist": "Planetary Assault Systems",
        "bpm": 129.5,
        "camelot": "10A",
        "role": "Percussive Descongestor",
        "lufs": -7.1,
        "low_ratio": 32,
        "genre": "Hypnotic / Raw",
        "subgenre": "Mote-Evolver",
        "energy": 88,
        "danceability": 86,
        "mood": "Hypnotic Groove",
        "format": "WAV 24-bit",
        "duration": "05:48",
        "year": "2021",
        "cover": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=300&fit=crop",
        "strategy": "Descongesti\xF3n de Sala",
        "reason": "Textura enfocada en medios y agudos. Ideal para limpiar la sala tras un drop saturado.",
        "camelot_color": "#f472b6"
      },
      {
        "id": "rec_5",
        "title": "Subversion",
        "artist": "Enrico Sangiuliano",
        "bpm": 130.5,
        "camelot": "11A",
        "role": "Cosmic Climax",
        "lufs": -6,
        "low_ratio": 44,
        "genre": "Peak Time Techno",
        "subgenre": "NINETOZERO",
        "energy": 95,
        "danceability": 90,
        "mood": "Cosmic Meltdown",
        "format": "FLAC Hi-Res",
        "duration": "06:48",
        "year": "2023",
        "cover": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
        "strategy": "Ascensi\xF3n Hipn\xF3tica",
        "reason": "Sintetizadores espaciales que abren el panorama est\xE9reo antes de cortar los bajos.",
        "camelot_color": "#fb7185"
      },
      {
        "id": "rec_6",
        "title": "Rave Generation",
        "artist": "Reinier Zonneveld",
        "bpm": 132,
        "camelot": "11A",
        "role": "Acid Meltdown",
        "lufs": -5.5,
        "low_ratio": 46,
        "genre": "Acid Techno",
        "subgenre": "Filth on Acid",
        "energy": 98,
        "danceability": 94,
        "mood": "High Energy Climax",
        "format": "WAV 24-bit",
        "duration": "06:15",
        "year": "2024",
        "cover": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
        "strategy": "Explosi\xF3n Peak Time",
        "reason": "Energ\xEDa m\xE1xima para cerrar el set. Requiere swap r\xE1pido de EQ Low en drop.",
        "camelot_color": "#fb7185"
      }
    ],
    "local_ip": "192.168.1.151",
    "timestamp": 1794309847254317e-6,
    "last_updated": "12:24:07",
    "is_simulating": true
  };
  function LiveCopilotApp() {
    const [state, setState] = useState2(DEFAULT_COPILOT_STATE);
    const [isFullscreen, setIsFullscreen] = useState2(false);
    const [qrModalOpen, setQrModalOpen] = useState2(false);
    const [clock, setClock] = useState2("");
    const [latency, setLatency] = useState2(2);
    const [errorCount, setErrorCount] = useState2(0);
    const [visibleCount, setVisibleCount] = useState2(4);
    const [tracksList, setTracksList] = useState2(DEFAULT_COPILOT_STATE.recommendations);
    const [draggedIdx, setDraggedIdx] = useState2(null);
    const [transitionAnalysis, setTransitionAnalysis] = useState2(null);
    const [lowEqApplied, setLowEqApplied] = useState2(false);
    const [manualPickerOpen, setManualPickerOpen] = useState2(false);
    const [manualSearchQuery, setManualSearchQuery] = useState2("");
    const handleApplyCorrection = () => {
      setLowEqApplied((prev) => {
        const next = !prev;
        setState((curr) => {
          if (!curr) return curr;
          return {
            ...curr,
            deck_2: {
              ...curr.deck_2,
              low_ratio: next ? 24 : 51,
              lufs: next ? -7.8 : -6.3
            },
            anti_muddy: {
              ...curr.anti_muddy,
              status: next ? "safe" : "danger",
              tag: next ? "EQ LOW -10dB APLICADO" : "BASS CLASH",
              color: next ? "#10b981" : "#ef4444",
              message: next ? "Low EQ cortado en Deck 2 (-10dB). Espectro de sub-graves despejado y sin distorsi\xF3n en sala." : "Ambos tracks tienen sub-graves dominantes (>44%). El solape directo crear\xE1 empaste y distorsi\xF3n en el sistema de sala.",
              action: next ? "Restablecer EQ (Deshacer)" : "Corta la EQ de graves (Low) en el canal entrante (-6dB a -12dB)"
            }
          };
        });
        return next;
      });
    };
    const handleRandomLoad = () => {
      const poolCopy = [...MASTER_TRACKS_POOL];
      for (let i = poolCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [poolCopy[i], poolCopy[j]] = [poolCopy[j], poolCopy[i]];
      }
      setTracksList(poolCopy.slice(0, 8));
      setVisibleCount(8);
    };
    const handleAddManualTrack = (track) => {
      setTracksList((prev) => {
        if (prev.some((t) => t.id === track.id)) return prev;
        if (prev.length >= 8) {
          return [...prev.slice(0, 7), track];
        }
        return [...prev, track];
      });
      setVisibleCount((v) => Math.max(v, Math.min(8, tracksList.length + 1)));
      setManualPickerOpen(false);
    };
    const [controllerState, setControllerState] = useState2({
      detected: false,
      name: "",
      status: "SIN CONEXI\xD3N"
    });
    const [testDisconnectSkin, setTestDisconnectSkin] = useState2(false);
    useEffect2(() => {
      if (typeof navigator !== "undefined" && navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({ sysex: false }).then((access) => {
          const checkDevices = () => {
            const inputs = Array.from(access.inputs.values());
            const connectedInputs = inputs.filter((d) => !d.state || d.state === "connected");
            const djDev = connectedInputs.find((d) => /nv|numark|mkii|ddj|flx|pioneer|traktor|kontrol|denon|hercules|reloop|dj/i.test(d.name || ""));
            if (djDev) {
              let cleanName = djDev.name.toUpperCase().replace(/\s*\(USB\)\s*/i, "").trim();
              if (/nv|mkii/i.test(cleanName)) {
                cleanName = "NUMARK NV II";
              }
              setControllerState({
                detected: true,
                name: cleanName,
                status: "CONECTADA"
              });
            } else if (connectedInputs.length > 0) {
              setControllerState({
                detected: true,
                name: connectedInputs[0].name.toUpperCase().replace(/\s*\(USB\)\s*/i, "").trim(),
                status: "MIDI ACTIVO"
              });
            } else {
              setControllerState({
                detected: false,
                name: "",
                status: "SIN CONEXI\xD3N"
              });
            }
          };
          checkDevices();
          access.onstatechange = checkDevices;
        }).catch(() => {
        });
      }
    }, []);
    useEffect2(() => {
      const timer = setInterval(() => {
        const now = /* @__PURE__ */ new Date();
        setClock(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }, 1e3);
      return () => clearInterval(timer);
    }, []);
    useEffect2(() => {
      let isMounted = true;
      let ws = null;
      let eventSource = null;
      let fallbackInterval = null;
      let isFetching = false;
      const startPollingFallback = () => {
        if (fallbackInterval) return;
        const fetchStatus = async () => {
          if (isFetching || document.hidden) return;
          isFetching = true;
          const t0 = performance.now();
          try {
            const res = await fetch("/api/copilot/status");
            if (res.ok) {
              const data = await res.json();
              const dt = Math.round(performance.now() - t0);
              if (isMounted) {
                setState(data);
                const measured = data.capture_latency_ms ? Math.round(data.capture_latency_ms + dt * 0.15) : dt;
                setLatency(Math.max(1, measured));
                setErrorCount(0);
                if (data.recommendations && data.recommendations.length > 0) {
                  setTracksList((prev) => prev.length === 0 ? data.recommendations : prev);
                }
              }
            }
          } catch (e) {
            if (isMounted) setErrorCount((prev) => prev + 1);
          } finally {
            isFetching = false;
          }
        };
        fetchStatus();
        fallbackInterval = setInterval(fetchStatus, 150);
      };
      const connectWebSocket = () => {
        try {
          const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
          const host = window.location.host || "127.0.0.1:8000";
          ws = new WebSocket(`${proto}//${host}/ws/copilot`);
          let lastPingTime = performance.now();
          const pingInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              lastPingTime = performance.now();
              ws.send(JSON.stringify({ action: "ping", client_ts: lastPingTime }));
            }
          }, 2e3);
          ws.onmessage = (event) => {
            if (!isMounted) return;
            try {
              const data = JSON.parse(event.data);
              if (data.type === "pong") {
                const rtt = Math.round(performance.now() - (data.client_ts || lastPingTime));
                setLatency(Math.max(1, Math.min(25, rtt)));
                return;
              }
              setState(data);
              const cap = data.capture_latency_ms || 0.4;
              const netDt = data.server_ts ? Math.max(1, Math.round((Date.now() / 1e3 - data.server_ts) * 1e3)) : 1;
              const totalLat = Math.min(25, Math.max(1, Math.round(cap + netDt)));
              setLatency(totalLat);
              setErrorCount(0);
              if (data.recommendations && data.recommendations.length > 0) {
                setTracksList((prev) => prev.length === 0 ? data.recommendations : prev);
              }
            } catch (_) {
            }
          };
          ws.onerror = () => {
            if (ws) ws.close();
          };
          ws.onclose = () => {
            clearInterval(pingInterval);
            if (isMounted) {
              startPollingFallback();
            }
          };
        } catch (_) {
          startPollingFallback();
        }
      };
      connectWebSocket();
      return () => {
        isMounted = false;
        if (ws) ws.close();
        if (eventSource) eventSource.close();
        if (fallbackInterval) clearInterval(fallbackInterval);
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
    const setMasterDeck = async (deckTarget) => {
      const isLocalHost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      if (isLocalHost) {
        try {
          const res = await fetch("/api/copilot/set_master", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ master: deckTarget })
          });
          if (res.ok) {
            const data = await res.json();
            setState(data);
            return;
          }
        } catch (_) {
        }
      }
      setState((prev) => {
        var _a;
        if (!prev) return prev;
        const cur1Master = (_a = prev.deck_1) == null ? void 0 : _a.is_master;
        const new1Master = deckTarget === "1" ? true : deckTarget === "2" ? false : !cur1Master;
        return {
          ...prev,
          deck_1: {
            ...prev.deck_1,
            is_master: new1Master,
            status: new1Master ? "ON AIR (MASTER)" : "CUE / PREPARADO",
            is_playing: new1Master,
            elapsed_sec: prev.deck_1.elapsed_sec
          },
          deck_2: {
            ...prev.deck_2,
            is_master: !new1Master,
            status: !new1Master ? "ON AIR (MASTER)" : "CUE / PREPARADO",
            is_playing: !new1Master,
            elapsed_sec: prev.deck_2.elapsed_sec
          }
        };
      });
    };
    const toggleDeckPlay = async (deckTarget) => {
      const deckNum = deckTarget === "2" || deckTarget === "B" || deckTarget === 2 ? 2 : 1;
      const dKey = deckNum === 1 ? "deck_1" : "deck_2";
      setState((prev) => {
        if (!prev || !prev.decks) return prev;
        const cur = prev.decks[dKey];
        if (!cur || !cur.title) return prev;
        const nextPlaying = !cur.is_playing;
        return {
          ...prev,
          decks: {
            ...prev.decks,
            [dKey]: {
              ...cur,
              is_playing: nextPlaying,
              status: nextPlaying ? cur.is_master ? "ON AIR (MASTER)" : "REPRODUCIENDO" : "PAUSA"
            }
          }
        };
      });
      try {
        const res = await fetch(`/api/copilot/deck/${deckNum}/toggle_play`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setState(data);
        }
      } catch (_) {
      }
    };
    const cueDeck = async (deckTarget) => {
      const deckNum = deckTarget === "2" || deckTarget === "B" || deckTarget === 2 ? 2 : 1;
      const dKey = deckNum === 1 ? "deck_1" : "deck_2";
      setState((prev) => {
        if (!prev || !prev.decks) return prev;
        const cur = prev.decks[dKey];
        if (!cur || !cur.title) return prev;
        const cueSec = cur.cues && cur.cues.length > 0 && cur.cues[0].pos_sec !== void 0 ? cur.cues[0].pos_sec : 0;
        const dur = cur.duration_sec || 240;
        const prog = dur > 0 ? Math.min(1, cueSec / dur) : 0;
        return {
          ...prev,
          decks: {
            ...prev.decks,
            [dKey]: {
              ...cur,
              is_playing: false,
              elapsed_sec: cueSec,
              play_progress: prog,
              status: "CUE (PREPARADO)"
            }
          }
        };
      });
      try {
        const res = await fetch(`/api/copilot/deck/${deckNum}/cue`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setState(data);
        }
      } catch (_) {
      }
    };
    useEffect2(() => {
      const handleKeyDown = (e) => {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable)) return;
        if (e.key === "m" || e.key === "M") {
          e.preventDefault();
          setMasterDeck("toggle");
        } else if (e.key === "1") {
          e.preventDefault();
          toggleDeckPlay(1);
        } else if (e.key === "2") {
          e.preventDefault();
          toggleDeckPlay(2);
        } else if (e.key === " " || e.code === "Space") {
          e.preventDefault();
          toggleDeckPlay(state && state.master_deck ? state.master_deck : 1);
        } else if (e.key === "q" || e.key === "Q") {
          e.preventDefault();
          cueDeck(1);
        } else if (e.key === "w" || e.key === "W") {
          e.preventDefault();
          cueDeck(2);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [state]);
    useEffect2(() => {
      const isLocalHost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      if (isLocalHost) return;
      if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) return;
      let midiAccess = null;
      const lastMidiTrigger = {};
      const onMidiMessage = (e) => {
        if (!e.data || e.data.length < 2) return;
        const [status, note, velocity = 0] = e.data;
        const cmd = status & 240;
        const ch = status & 15;
        if (cmd !== 144 || velocity <= 0) return;
        const targetDeck = ch === 1 ? 1 : ch === 2 ? 2 : 0;
        if (!targetDeck) return;
        const now = Date.now();
        const key = `${targetDeck}_${note}`;
        if (now - (lastMidiTrigger[key] || 0) < 60) return;
        lastMidiTrigger[key] = now;
        if (note === 33) {
          toggleDeckPlay(targetDeck);
        } else if (note === 32) {
          cueDeck(targetDeck);
        }
      };
      navigator.requestMIDIAccess().then((access) => {
        midiAccess = access;
        for (const input of midiAccess.inputs.values()) {
          input.onmidimessage = onMidiMessage;
        }
        midiAccess.onstatechange = (ev) => {
          if (ev.port && ev.port.type === "input" && ev.port.state === "connected") {
            ev.port.onmidimessage = onMidiMessage;
          }
        };
      }).catch(() => {
      });
      return () => {
        if (midiAccess) {
          for (const input of midiAccess.inputs.values()) {
            input.onmidimessage = null;
          }
        }
      };
    }, []);
    const toggleSimulation = async () => {
      const isLocalHost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      if (isLocalHost) {
        try {
          const res = await fetch("/api/copilot/toggle_simulation", { method: "POST" });
          if (res.ok) {
            const data = await res.json();
            setState(data);
            if (data.recommendations) setTracksList(data.recommendations);
            return;
          }
        } catch (e) {
        }
      }
      setState((prev) => {
        const current = prev || DEFAULT_COPILOT_STATE;
        const newSim = !current.is_simulating;
        return {
          ...current,
          is_simulating: newSim,
          source: newSim ? "SIMULATION_MODE" : "SERATO_LIVE",
          deck_1: {
            ...current.deck_1,
            title: newSim ? "Komodo (Megavoices Claxixx)" : "Deep Blue",
            artist: newSim ? "Mauro Picotto" : "The Midnight",
            bpm: newSim ? 137.68 : 130,
            camelot: newSim ? "10A" : "10A",
            mood: newSim ? "Peak Time Climax" : "Melodic Club"
          },
          deck_2: {
            ...current.deck_2,
            title: newSim ? "Smooth Mind" : "Turn on your Brain Baby",
            artist: newSim ? "Marco Bailey / Sigvard" : "Snog",
            bpm: newSim ? 140 : 129.63,
            camelot: newSim ? "6A" : "8A",
            mood: newSim ? "Hypnotic Groove" : "Drumcode Core"
          },
          anti_muddy: {
            clash_detected: newSim,
            severity: newSim ? "CRITICAL" : "SAFE",
            color: newSim ? "#ef4444" : "#10b981",
            badge: newSim ? "BASS CLASH" : "SAFE MIX",
            message: newSim ? "Ambos tracks tienen sub-graves dominantes (>44%). El solape directo crear\xE1 empaste y distorsi\xF3n en el sistema de sala." : "Equilibrio de frecuencias \xF3ptimo entre Decks. Transici\xF3n limpia sin solape.",
            tactical_advice: newSim ? "Corta la EQ de graves (Low) en el canal entrante (-6dB a -12dB) antes de abrir el fader, o usa filtro paso-alto." : "Curva de mezcla perfecta en comp\xE1s 32."
          }
        };
      });
    };
    const handleDragStart = (e, index) => {
      setDraggedIdx(index);
      e.dataTransfer.effectAllowed = "move";
    };
    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };
    const handleDrop = (e, targetIdx) => {
      e.preventDefault();
      if (draggedIdx === null || draggedIdx === targetIdx) return;
      const updated = [...tracksList];
      const [movedItem] = updated.splice(draggedIdx, 1);
      updated.splice(targetIdx, 0, movedItem);
      setTracksList(updated);
      setDraggedIdx(null);
      const masterTrack = (state == null ? void 0 : state.deck_1) || {};
      const incomingTrack = updated[0];
      const mCamelot = masterTrack.camelot || "10A";
      const inCamelot = incomingTrack.camelot || "10A";
      const mBpm = parseFloat(masterTrack.bpm) || 138;
      const inBpm = parseFloat(incomingTrack.bpm) || 138;
      const bpmDelta = (inBpm - mBpm).toFixed(1);
      const mNum = parseInt(mCamelot);
      const inNum = parseInt(inCamelot);
      const isExactMatch = mCamelot === inCamelot;
      const isEnergyBoost = inNum === mNum % 12 + 1;
      const isHarmonic = isExactMatch || isEnergyBoost || mNum === inNum % 12 + 1;
      setTransitionAnalysis({
        trackTitle: incomingTrack.title,
        isHarmonic,
        matchType: isExactMatch ? "MATCH PERFECTO (Mismo Tono)" : isEnergyBoost ? "SUBID\xD3N DE ENERG\xCDA (+1 Camelot)" : isHarmonic ? "COMPATIBLE" : "CHOQUE ARM\xD3NICO (Cuidado)",
        bpmDelta: bpmDelta >= 0 ? `+${bpmDelta}` : bpmDelta,
        lowRatio: incomingTrack.low_ratio,
        safeBass: incomingTrack.low_ratio < 44,
        advice: isExactMatch ? "Excelente acople t\xEDmbrico. Realiza el cruce en el comp\xE1s 32 con EQ Low compensado." : isEnergyBoost ? "Sube la intensidad de la pista. Filtra graves con HPF antes del drop para impacto limpio." : "Diferencia arm\xF3nica. Usa un par\xF3n (breakdown) o reverb out para no desafinar."
      });
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
    const activeState = state || DEFAULT_COPILOT_STATE;
    const { deck_1, deck_2, anti_muddy, harmonic, recommendations, local_ip, platform, platform_mode, platform_name, platform_icon, platform_color, platform_status } = activeState;
    const displayRecommendations = Array.isArray(tracksList) && tracksList.length > 0 ? tracksList : recommendations || [];
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
    const isAppRunning = state.is_app_open !== void 0 ? state.is_app_open : state.dj_app ? state.dj_app.is_open : false;
    const isAppOpen = !testDisconnectSkin && isAppRunning;
    const hasActiveTrack = Boolean(
      (deck_1 == null ? void 0 : deck_1.title) && deck_1.title !== "Deck Vac\xEDo" || (deck_2 == null ? void 0 : deck_2.title) && deck_2.title !== "Deck Vac\xEDo" || (deck_1 == null ? void 0 : deck_1.is_playing) || (deck_2 == null ? void 0 : deck_2.is_playing)
    );
    const isLiveStage = hasActiveTrack;
    return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-h-screen p-3 sm:p-5 lg:p-6 select-none bg-[#040407] text-gray-200" }, /* @__PURE__ */ React.createElement("header", { className: "relative flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-800/80 mb-4 sm:mb-6 px-1 select-none" }, /* @__PURE__ */ React.createElement("div", { className: "relative z-10 flex items-center justify-between gap-3 w-full" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1.5 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: `w-3.5 h-3.5 rounded-full shrink-0 ${isLive ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse" : isStandby ? "bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)] animate-pulse" : "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"}` }), /* @__PURE__ */ React.createElement("span", { className: "w-8 h-8 rounded-lg bg-djcyan-500/10 border border-djcyan-500/30 flex items-center justify-center text-djcyan-400 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.3)]" }, /* @__PURE__ */ React.createElement(CopilotTurntableLogo, { size: 18 })), /* @__PURE__ */ React.createElement("h1", { className: "font-syne font-black text-lg sm:text-2xl text-white tracking-wider uppercase" }, "BEATWAVE ", /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400" }, "COPILOT"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700/60 font-mono text-xs" }, renderPlatformLogo(platform || "serato", 16), /* @__PURE__ */ React.createElement("strong", { style: { color: platform_color || "#00d1e8" } }, platform_name || "Serato DJ Pro"), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-600" }, "|"), /* @__PURE__ */ React.createElement("span", { className: isLive ? "text-red-400 font-bold" : "text-cyan-400 font-bold" }, platform_status || (isLive ? "LIVE" : "STANDBY")))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/50 font-mono text-[11px] text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" }), /* @__PURE__ */ React.createElement("span", { className: "font-bold tracking-tight" }, "\u26A1 Latencia Cabina: ", /* @__PURE__ */ React.createElement("strong", { className: "text-white font-extrabold" }, latency, "ms"), " \u2022 Sincronizado"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setMasterDeck("toggle"),
        className: "ml-1 px-1.5 py-0.2 rounded bg-zinc-800 hover:bg-zinc-700 text-cyan-300 hover:text-white border border-cyan-500/40 font-bold transition-all cursor-pointer active:scale-95 text-[10px]",
        title: "Intercambiar qu\xE9 Deck es Master en vivo (Atajo de teclado: M)"
      },
      "\u21C4 MASTER: DECK ",
      deck_1.is_master ? "1" : "2",
      " ",
      /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-zinc-400" }, "[M]")
    )))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 flex-wrap justify-end shrink-0" }, controllerState.detected ? /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex items-center gap-2 select-none cursor-pointer py-1 px-2.5 rounded-lg hover:bg-white/5 transition-colors",
        onClick: () => setControllerState({
          detected: false,
          name: "",
          status: "SIN CONEXI\xD3N"
        }),
        title: "Haz clic para alternar prueba de desconexi\xF3n"
      },
      /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse shrink-0" }),
      /* @__PURE__ */ React.createElement(
        "h3",
        {
          className: "font-syne font-black text-sm sm:text-base tracking-wider uppercase leading-none whitespace-nowrap",
          style: {
            textShadow: "0 0 14px rgba(6, 182, 212, 0.85), 0 0 28px rgba(6, 182, 212, 0.5), 0 0 50px rgba(6, 182, 212, 0.25)"
          }
        },
        (() => {
          const rawName = (controllerState.name || "NUMARK NV II").replace(/\s*\(USB\)\s*/i, "").trim();
          const parts = rawName.split(/\s+/);
          const firstWord = parts[0] || "NUMARK";
          const restWords = parts.slice(1).join(" ") || "";
          return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" }, firstWord), restWords && /* @__PURE__ */ React.createElement(React.Fragment, null, " ", /* @__PURE__ */ React.createElement("span", { className: "text-[#00d1e8] text-djcyan-400 drop-shadow-[0_0_14px_rgba(6,182,212,0.9)]" }, restWords)));
        })()
      )
    ) : /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex items-center gap-2 py-1.5 px-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-500 font-syne font-semibold text-xs tracking-wider uppercase select-none cursor-pointer hover:text-zinc-300 hover:border-zinc-700 transition-colors",
        onClick: () => setControllerState({
          detected: true,
          name: "NUMARK NV II",
          status: "CONECTADA"
        }),
        title: "Haz clic para conectar controladora (Numark NV II)"
      },
      /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-zinc-600 shrink-0" }),
      /* @__PURE__ */ React.createElement("span", null, "SIN CONEXI\xD3N")
    ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center p-0.5 bg-zinc-950/90 rounded-xl border border-zinc-800/90 shadow-inner" }, platformsList.map((p) => {
      const isSelected = platform_mode === p.id || platform_mode === "auto" && p.id === "auto";
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: p.id,
          type: "button",
          onClick: () => setPlatform(p.id),
          className: `flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${isSelected ? "bg-zinc-800 text-white shadow-md border border-zinc-600" : "text-zinc-400 hover:text-zinc-200"}`,
          style: isSelected ? { color: p.color, borderColor: `${p.color}66` } : {},
          title: `Conectar con ${p.label}`
        },
        renderPlatformLogo(p.id, 14),
        /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline text-[10px]" }, p.label)
      );
    })), /* @__PURE__ */ React.createElement("div", { className: "font-mono text-xs sm:text-sm font-bold text-white bg-zinc-900/90 px-2.5 py-1 rounded-xl border border-zinc-800 shadow-inner" }, clock || state.last_updated), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setTestDisconnectSkin((v) => !v),
        className: `px-2.5 py-1 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer border ${testDisconnectSkin ? "bg-red-900/80 border-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse" : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700/60"}`,
        title: "Alternar prueba de aplicaci\xF3n desconectada (modo skin con bordes rojos)"
      },
      testDisconnectSkin ? "Standby Skin" : "Probar Standby"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setQrModalOpen(true),
        className: "px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-djcyan-400 bg-djcyan-950/40 hover:bg-djcyan-900/50 border border-djcyan-500/40 uppercase transition-all cursor-pointer shadow-sm",
        title: "Mostrar enlace y c\xF3digo QR para iPad"
      },
      "\u{1F4F1} iPad"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: toggleFullscreen,
        className: "p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 cursor-pointer transition-all",
        title: "Pantalla Completa"
      },
      /* @__PURE__ */ React.createElement("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" }))
    )))), testDisconnectSkin && /* @__PURE__ */ React.createElement("div", { className: "mb-3 p-3 sm:p-3.5 rounded-2xl bg-red-950/80 border border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-between gap-3 animate-pulse" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl shrink-0" }, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "font-syne font-bold text-xs sm:text-sm text-red-100 uppercase tracking-wide" }, "Es necesario conectar la aplicaci\xF3n y la controladora"), /* @__PURE__ */ React.createElement("p", { className: "font-syne text-[11px] text-red-200/90 mt-0.5" }, "Conecta la aplicaci\xF3n de m\xFAsica (Serato, Rekordbox, Traktor o VirtualDJ) y la controladora DJ para activar el an\xE1lisis en vivo."))), /* @__PURE__ */ React.createElement("div", { className: "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-900/60 border border-red-500/50 font-mono text-[9px] text-red-300 uppercase shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" }), /* @__PURE__ */ React.createElement("span", null, "SKIN STANDBY"))), /* @__PURE__ */ React.createElement(
      CopilotCleanMixBanner,
      {
        antiMuddy: anti_muddy,
        harmonic,
        controllerState,
        lufsDelta: state == null ? void 0 : state.lufs_delta,
        lowEqApplied,
        onApplyCorrection: handleApplyCorrection,
        isAppOpen
      }
    ), /* @__PURE__ */ React.createElement("div", { className: `bw-copilot-stage ${isLiveStage ? "is-live" : ""} mb-4` }, /* @__PURE__ */ React.createElement(
      DeckCard,
      {
        deck: deck_1,
        side: "A",
        isMaster: deck_1.is_master,
        antiMuddy: anti_muddy,
        partnerDeck: deck_2,
        onSetMaster: setMasterDeck,
        onTogglePlay: toggleDeckPlay,
        isAppOpen,
        isCompact: isLiveStage
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "bw-center-slot" }, /* @__PURE__ */ React.createElement(
      CopilotCenterMixer,
      {
        deck1: deck_1,
        deck2: deck_2,
        mixer: state == null ? void 0 : state.mixer,
        audit: state == null ? void 0 : state.audit,
        isAppOpen,
        showInlineHud: true
      }
    )), /* @__PURE__ */ React.createElement(
      DeckCard,
      {
        deck: deck_2,
        side: "B",
        isMaster: deck_2.is_master,
        antiMuddy: anti_muddy,
        partnerDeck: deck_1,
        onSetMaster: setMasterDeck,
        onTogglePlay: toggleDeckPlay,
        isAppOpen,
        isCompact: isLiveStage
      }
    )), /* @__PURE__ */ React.createElement("section", { className: `mt-auto transition-all ${!isAppOpen ? "p-3 rounded-2xl bg-[#06060c] border border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2.5 flex-wrap gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-base" }, "\u{1F3AF}"), /* @__PURE__ */ React.createElement("h3", { className: "font-syne font-black text-xs sm:text-sm uppercase tracking-wider text-zinc-300" }, "Pr\xF3ximas Pistas Sugeridas (", isAppOpen ? displayRecommendations.length : 0, ")"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-zinc-500 hidden sm:inline" }, isAppOpen ? "\u2022 Arrastra para reordenar" : "\u2022 Modo Standby Skin")), isAppOpen && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setVisibleCount((v) => v === 4 ? Math.min(8, displayRecommendations.length) : 4),
        className: "px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-mono font-bold text-djcyan-400 transition-colors cursor-pointer",
        title: "Alternar entre 4 y 8 pistas visibles"
      },
      visibleCount === 4 ? "Cargar m\xE1s (+4)" : "Mostrar 4 (-4)"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleRandomLoad,
        className: "px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-500/60 text-xs font-mono font-bold text-purple-300 transition-colors cursor-pointer flex items-center gap-1 shadow-sm",
        title: "Cargar selecci\xF3n aleatoria de candidatos de la biblioteca"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F3B2}"),
      /* @__PURE__ */ React.createElement("span", null, "Carga Aleatoria")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setManualPickerOpen(true),
        className: "px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/60 text-xs font-mono font-bold text-emerald-300 transition-colors cursor-pointer flex items-center gap-1 shadow-sm",
        title: "Buscar y a\xF1adir manualmente una pista a la cola"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u2795"),
      /* @__PURE__ */ React.createElement("span", null, "Carga Manual")
    ))), !isAppOpen ? (
      /* MODO SKIN VACÍO CON BORDES EN STANDBY */
      /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5" }, [1, 2, 3, 4].map((slot) => /* @__PURE__ */ React.createElement("div", { key: slot, className: "p-3 rounded-2xl bg-[#080811] border border-zinc-800/80 flex flex-col justify-between opacity-50" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-2.5 mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-zinc-800 bg-black flex items-center justify-center" }, /* @__PURE__ */ React.createElement("img", { src: DEFAULT_VINYL_SVG, alt: "Standby", className: "w-6 h-6 opacity-25" }), /* @__PURE__ */ React.createElement("span", { className: "absolute top-0.5 left-0.5 w-4 h-4 rounded bg-black/80 text-[8px] font-mono font-bold text-zinc-600 flex items-center justify-center" }, "#", slot)), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("span", { className: "font-syne font-bold text-xs text-zinc-500 truncate block" }, "-- Esperando Pista --"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-zinc-600 truncate font-mono block" }, "Standby"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 mt-0.5 text-[9px] font-mono text-zinc-600" }, /* @__PURE__ */ React.createElement("span", null, "-- BPM"), /* @__PURE__ */ React.createElement("span", null, "\u2022 -- Camelot")))), /* @__PURE__ */ React.createElement("div", { className: "text-[9.5px] font-mono text-zinc-600 pt-1.5 border-t border-zinc-800/60" }, "Conecta software DJ y controladora"))))
    ) : /* @__PURE__ */ React.createElement(React.Fragment, null, transitionAnalysis && /* @__PURE__ */ React.createElement("div", { className: "mb-3 p-2.5 rounded-xl bg-zinc-950 border border-djcyan-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-base" }, "\u26A1"), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-300" }, "Transici\xF3n con ", /* @__PURE__ */ React.createElement("strong", { className: "text-white" }, transitionAnalysis.trackTitle), ":"), /* @__PURE__ */ React.createElement("span", { className: `px-2 py-0.5 rounded font-bold text-[10px] ${transitionAnalysis.isHarmonic ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-red-500/20 text-red-300 border border-red-500/40"}` }, transitionAnalysis.matchType), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-400" }, "\u0394 BPM: ", /* @__PURE__ */ React.createElement("strong", { className: "text-white" }, transitionAnalysis.bpmDelta)), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-400" }, "Sub-Graves: ", /* @__PURE__ */ React.createElement("strong", { className: transitionAnalysis.safeBass ? "text-emerald-400" : "text-amber-400" }, transitionAnalysis.lowRatio, "%"))), /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-zinc-300 truncate" }, /* @__PURE__ */ React.createElement("strong", { className: "text-djcyan-400" }, "Acci\xF3n:"), " ", transitionAnalysis.advice)), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5" }, displayRecommendations.slice(0, visibleCount).map((rec, idx) => {
      const isDragging = draggedIdx === idx;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: rec.id || idx,
          draggable: true,
          onDragStart: (e) => handleDragStart(e, idx),
          onDragOver: handleDragOver,
          onDrop: (e) => handleDrop(e, idx),
          className: `p-2.5 rounded-2xl bg-zinc-950/70 border transition-all flex flex-col justify-between group cursor-grab active:cursor-grabbing ${isDragging ? "opacity-40 border-djcyan-400 scale-95" : "border-zinc-800 hover:border-djcyan-500/50 hover:bg-zinc-900/60"}`,
          title: "Arrastra para reordenar"
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-2.5 mb-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-zinc-700/60 bg-black" }, /* @__PURE__ */ React.createElement(
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
        ), /* @__PURE__ */ React.createElement("span", { className: "absolute top-0.5 left-0.5 w-4 h-4 rounded bg-black/80 text-[8px] font-mono font-bold text-zinc-300 flex items-center justify-center" }, "#", idx + 1)), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-1" }, /* @__PURE__ */ React.createElement("div", { className: "font-syne font-bold text-xs text-white group-hover:text-djcyan-400 transition-colors truncate" }, rec.title), /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "w-6 h-6 rounded flex items-center justify-center font-orbitron font-bold text-[10px] text-black shrink-0",
            style: { backgroundColor: rec.camelot_color }
          },
          rec.camelot
        )), /* @__PURE__ */ React.createElement("div", { className: "font-syne text-[11px] text-zinc-400 truncate" }, rec.artist), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 mt-0.5 text-[9px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold" }, rec.bpm, " BPM"), rec.mood && /* @__PURE__ */ React.createElement("span", { className: "text-purple-400 truncate" }, "\u2022 ", rec.mood), rec.energy && /* @__PURE__ */ React.createElement("span", { className: "text-amber-400 font-bold shrink-0" }, "\u26A1", rec.energy, "%")))),
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between pt-1.5 border-t border-zinc-800/60 font-mono text-[10px] text-zinc-400" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold uppercase truncate max-w-[130px]" }, rec.strategy), /* @__PURE__ */ React.createElement("span", null, "Sub: ", rec.low_ratio, "%")),
        /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed" }, rec.reason)
      );
    })))), qrModalOpen && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center" }, /* @__PURE__ */ React.createElement(
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
  var DEFAULT_CABINA_HOT_CUES = [
    { id: 1, time: "00:00.01", color: "#EF4444" },
    { id: 2, time: "00:28.25", color: "#F97316" },
    { id: 3, time: "00:56.48", color: "#FBBF24" },
    { id: 4, time: "01:24.72", color: "#10B981" },
    { id: 5, time: "01:52.95", color: "#00F0FF" },
    { id: 6, time: "02:21.19", color: "#A855F7" },
    { id: 7, time: "02:49.42", color: "#EC4899" },
    { id: 8, time: "03:17.65", color: "#3B82F6" }
  ];
  function DeckCard({ deck, side, isMaster, antiMuddy = null, partnerDeck = null, onSetMaster = null, onTogglePlay = null, isAppOpen = true, isCompact = false }) {
    if (!deck) return null;
    const cabinaHotCues = useMemo2(() => {
      if ((deck == null ? void 0 : deck.cues) && deck.cues.length > 0) {
        return deck.cues.slice(0, 8).map((c, i) => {
          var _a, _b;
          return {
            id: c.id || i + 1,
            time: c.time || ((_a = DEFAULT_CABINA_HOT_CUES[i]) == null ? void 0 : _a.time) || "00:00.00",
            color: c.color || ((_b = DEFAULT_CABINA_HOT_CUES[i]) == null ? void 0 : _b.color) || "#00F0FF"
          };
        });
      }
      return DEFAULT_CABINA_HOT_CUES;
    }, [deck == null ? void 0 : deck.cues]);
    if (!isAppOpen) {
      return /* @__PURE__ */ React.createElement("div", { className: `rounded-3xl border border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse relative overflow-hidden flex flex-col justify-between bg-[#06060c] transition-all ${isCompact ? "p-2.5 sm:p-3" : "p-4 sm:p-5 lg:p-6"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/60" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "font-orbitron font-black text-base sm:text-lg text-zinc-500" }, "DECK ", side), /* @__PURE__ */ React.createElement("span", { className: "px-2.5 py-0.5 rounded-full font-mono text-[9px] font-black uppercase tracking-wider bg-red-950/60 border border-red-500/40 text-red-300" }, "STANDBY \u2022 SIN CONEXI\xD3N")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 font-mono text-xs text-zinc-600 uppercase" }, /* @__PURE__ */ React.createElement("span", null, "STANDBY SKIN"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 mb-2.5 p-2.5 rounded-2xl bg-black/40 border border-zinc-800/60 items-stretch opacity-60" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-stretch gap-3 min-w-0" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "relative rounded-xl overflow-hidden shrink-0 border border-zinc-800 bg-zinc-950 flex items-center justify-center",
          style: { width: "68px", height: "68px", minWidth: "68px", minHeight: "68px", aspectRatio: "1 / 1" }
        },
        /* @__PURE__ */ React.createElement("img", { src: DEFAULT_VINYL_SVG, alt: "Sin pista", className: "w-10 h-10 opacity-30" }),
        /* @__PURE__ */ React.createElement("span", { className: "absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/85 text-[8px] font-mono text-zinc-500" }, "--:--")
      ), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1 flex flex-col justify-center" }, /* @__PURE__ */ React.createElement("h2", { className: "font-syne font-bold text-xs sm:text-sm text-zinc-400 tracking-tight leading-tight truncate" }, "-- Esperando Pista --"), /* @__PURE__ */ React.createElement("p", { className: "font-syne font-medium text-xs text-zinc-600 mt-0.5 truncate" }, "Conecta Serato, Rekordbox, Traktor o VirtualDJ"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 mt-1" }, /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-mono text-zinc-600" }, "-- G\xC9NERO --")))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between sm:justify-end gap-2 sm:gap-3 border-t md:border-t-0 md:border-l border-zinc-800/60 pt-2 md:pt-0 md:pl-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1 p-1 rounded-xl bg-zinc-950/90 border border-zinc-800 shrink-0 min-w-[100px]" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg bg-zinc-900/60 text-zinc-600" }, /* @__PURE__ */ React.createElement("div", { className: "w-5 h-4 rounded text-[9px] font-orbitron font-black bg-zinc-800 text-zinc-500 flex items-center justify-center" }, "--"), /* @__PURE__ */ React.createElement("span", { className: "text-[7px] font-mono uppercase font-bold" }, "TONO"), /* @__PURE__ */ React.createElement("span", { className: "font-syne font-bold text-[10px]" }, "--")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg bg-zinc-900/60 text-zinc-600" }, /* @__PURE__ */ React.createElement("span", { className: "text-[7px] font-mono uppercase font-bold" }, "TEMPO"), /* @__PURE__ */ React.createElement("span", { className: "font-orbitron font-black text-[10px]" }, "--.--"))))), /* @__PURE__ */ React.createElement("div", { className: "mb-2.5 p-2 rounded-2xl bg-black/50 border border-zinc-800/60" }, /* @__PURE__ */ React.createElement("div", { className: "h-10 w-full flex items-center justify-center bg-zinc-950/80 rounded-lg" }, /* @__PURE__ */ React.createElement("span", { className: "font-mono text-[10px] text-zinc-600" }, "STANDBY \u2022 FORMA DE ONDA INACTIVA"))));
    }
    const deckNum = side === "A" ? "1" : side === "B" ? "2" : side;
    const isEmptyDeck = !deck.title || !deck.bpm || Number(deck.bpm) <= 0 || deck.status === "STANDBY (VAC\xCDO)";
    return /* @__PURE__ */ React.createElement("div", { className: `rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${isCompact ? "p-2.5 sm:p-3" : "p-4 sm:p-5 lg:p-6"} ${isMaster ? "bg-gradient-to-b from-[#0c0d1c] to-[#06060c] border-djcyan-500/70 shadow-[0_0_30px_rgba(6,182,212,0.25)]" : "bg-[#07070f] border-zinc-800 hover:border-zinc-700"}` }, /* @__PURE__ */ React.createElement("div", { className: "dk-top-bar select-none" }, /* @__PURE__ */ React.createElement("div", { className: "dk-id-group" }, /* @__PURE__ */ React.createElement("span", { className: "dk-id" }, "DECK ", deckNum), isEmptyDeck ? /* @__PURE__ */ React.createElement("span", { className: "px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-500" }, "STANDBY (VAC\xCDO)") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => onSetMaster && onSetMaster(deckNum),
        className: `dk-pill-btn ${isMaster ? "is-master" : ""}`,
        title: `Haz clic para alternar DECK ${side} como MASTER (o pulsa 'M')`
      },
      /* @__PURE__ */ React.createElement("span", null, isMaster ? "\u{1F50A}" : "\u{1F3A7}"),
      /* @__PURE__ */ React.createElement("span", null, isMaster ? "MASTER" : "EN CUE")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => onTogglePlay && onTogglePlay(deckNum),
        className: `dk-pill-btn ${deck.is_playing ? "is-playing" : ""}`,
        title: `Haz clic para alternar Play/Pausa en DECK ${side} (o pulsa tecla '${deckNum}')`
      },
      /* @__PURE__ */ React.createElement("span", { className: `w-1.5 h-1.5 rounded-full ${deck.is_playing ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}` }),
      /* @__PURE__ */ React.createElement("span", null, deck.is_playing ? "EN VIVO" : "CUE")
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "dk-format-badge" }, deck.format || "FLAC"), /* @__PURE__ */ React.createElement("span", { className: "dk-dsp-lbl" }, isEmptyDeck ? "STANDBY" : deck.is_audited ? "\u2713 DSP BEATWAVE" : "DEFAULT DSP"))), /* @__PURE__ */ React.createElement("div", { className: "dk-track-row select-none" }, /* @__PURE__ */ React.createElement("div", { className: "dk-track-left" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: () => !isEmptyDeck && onTogglePlay && onTogglePlay(deckNum),
        className: "dk-vinyl-avatar",
        title: !isEmptyDeck ? `Reproducir / Pausar DECK ${side}` : ""
      },
      deck.cover && !isEmptyDeck ? /* @__PURE__ */ React.createElement(
        "img",
        {
          src: getValidCover(deck.cover),
          alt: "Cover",
          onError: (e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_VINYL_SVG;
          }
        }
      ) : /* @__PURE__ */ React.createElement("span", { className: "text-[7px] font-mono font-black text-black select-none" }, "AEPX")
    ), /* @__PURE__ */ React.createElement("div", { className: "dk-track-titles" }, /* @__PURE__ */ React.createElement("span", { className: "dk-title", title: deck.title || "Track" }, deck.title || (isEmptyDeck ? "-- Esperando Pista --" : "Whip")), /* @__PURE__ */ React.createElement("span", { className: "dk-artist", title: deck.artist || "Artista" }, deck.artist || (isEmptyDeck ? "Conecta Serato o mesa" : "Mark Broom")))), /* @__PURE__ */ React.createElement("div", { className: "dk-track-right" }, /* @__PURE__ */ React.createElement("div", { className: "dk-bpm-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "dk-bpm-val" }, deck.bpm ? Number(deck.bpm).toFixed(2) : isEmptyDeck ? "--.--" : "136.00"), /* @__PURE__ */ React.createElement("span", { className: "dk-bpm-unit" }, "BPM")), /* @__PURE__ */ React.createElement(
      "span",
      {
        className: `dk-key-pill ${side === "2" || side === "B" ? "d2" : ""}`,
        style: deck.camelot_color ? { backgroundColor: deck.camelot_color, borderColor: `${deck.camelot_color}cc` } : {}
      },
      deck.camelot || deck.raw_key || (side === "1" || side === "A" ? "6A" : "8A")
    ), /* @__PURE__ */ React.createElement("div", { className: "dk-metrics-strip" }, /* @__PURE__ */ React.createElement("span", { className: "dk-metric-item energy", title: "Energ\xEDa" }, /* @__PURE__ */ React.createElement(ZapIcon, { size: 11, className: "text-amber-400" }), " ", isEmptyDeck ? 0 : deck.energy || 90, "%"), /* @__PURE__ */ React.createElement("span", { className: "dk-metric-item groove", title: "Groove / Intensidad" }, /* @__PURE__ */ React.createElement(ActivityIcon, { size: 11, className: "text-emerald-400" }), " ", isEmptyDeck ? 0 : deck.groove || 86, "%"), /* @__PURE__ */ React.createElement("span", { className: "dk-metric-item dance", title: "Danzabilidad" }, /* @__PURE__ */ React.createElement(SlidersIcon, { size: 11, className: "text-purple-400" }), " ", isEmptyDeck ? 0 : deck.danceability || 85, "%"), /* @__PURE__ */ React.createElement("span", { className: "dk-metric-item valence", title: "Positividad / Brillo" }, /* @__PURE__ */ React.createElement(SparklesIcon, { size: 11, className: "text-cyan-400" }), " ", isEmptyDeck ? 0 : deck.valence != null ? deck.valence : side === "1" || side === "A" ? 55 : 62, "%")))), /* @__PURE__ */ React.createElement("div", { className: "dk-hotcues-box select-none" }, /* @__PURE__ */ React.createElement("div", { className: "dk-hc-lbl" }, /* @__PURE__ */ React.createElement("span", { className: "dk-hc-dot" }), /* @__PURE__ */ React.createElement("span", null, "8 HOT CUES DE CABINA")), /* @__PURE__ */ React.createElement("div", { className: "dk-hc-strip" }, cabinaHotCues.map((cue, idx) => /* @__PURE__ */ React.createElement(
      "span",
      {
        key: cue.id || idx,
        className: "hc-chip",
        style: { borderColor: cue.color || "#00F0FF" }
      },
      /* @__PURE__ */ React.createElement(
        "span",
        {
          className: "hc-badge",
          style: { backgroundColor: cue.color || "#00F0FF" }
        },
        cue.id || idx + 1
      ),
      /* @__PURE__ */ React.createElement("span", null, cue.time)
    )))), /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, /* @__PURE__ */ React.createElement(
      CopilotSeratoWaveform,
      {
        deck,
        side,
        antiMuddy,
        partnerDeck,
        isCompact
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5 pt-2 border-t border-zinc-800/60 font-mono text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-zinc-400" }, /* @__PURE__ */ React.createElement("span", null, "Densidad Sub-Graves (Sub-Bass)"), /* @__PURE__ */ React.createElement("span", { className: deck.low_ratio >= 44 ? "text-red-400 font-bold" : "text-zinc-200" }, deck.low_ratio, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-zinc-900 rounded-full h-2 overflow-hidden flex" }, /* @__PURE__ */ React.createElement(
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
})();
