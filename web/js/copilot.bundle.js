(() => {
  // web/js/copilot.jsx
  var { useState, useEffect, useRef } = React;
  var DEFAULT_VINYL_SVG = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="12" fill="#0d0d14"/><circle cx="80" cy="80" r="58" fill="#14141f" stroke="#27273a" stroke-width="2"/><circle cx="80" cy="80" r="44" fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/><circle cx="80" cy="80" r="30" fill="none" stroke="#3b82f6" stroke-width="1.5" opacity="0.5"/><circle cx="80" cy="80" r="14" fill="#06b6d4"/><circle cx="80" cy="80" r="5" fill="#09090b"/></svg>');
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
    partnerDeck = null
  }) => {
    const canvasRef = useRef(null);
    const minimapRef = useRef(null);
    const minimapCacheRef = useRef(null);
    const [zoom, setZoom] = useState(4);
    const [showTacticalAids, setShowTacticalAids] = useState(true);
    const [hoveredMilestone, setHoveredMilestone] = useState(null);
    const [progress, setProgress] = useState(deck.play_progress || 0.15);
    const progressRef = useRef(deck.play_progress || 0.15);
    const isPlayingRef = useRef(Boolean(deck.is_playing));
    const bpmRef = useRef(deck.bpm || 130);
    const durationSecRef = useRef(deck.duration_sec || 390);
    useEffect(() => {
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
    useEffect(() => {
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
      { id: 6, name: "Climax 2", color: "#3b82f6", pct: 0.74, time: "05:04.00", directive: "Segundo impacto de sala. Mant\xE9n energ\xEDa alta." },
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
    useEffect(() => {
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
          ctx.fillStyle = "#2563eb";
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
          oCtx.fillStyle = "#2563eb";
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
    return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2 p-2 sm:p-2.5 rounded-2xl bg-[#030308] border border-zinc-800/90 shadow-inner" }, showTacticalAids && /* @__PURE__ */ React.createElement("div", { className: "relative p-2 rounded-xl bg-zinc-950/90 border border-zinc-800/80 shadow-md" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, isBassClashDanger ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500 text-red-200 font-mono text-[11px] font-bold shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse ring-1 ring-red-400" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm" }, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("span", null, "EN 8 COMPASES (00:12) \u2794 BASS CLASH: Cortar Low EQ")) : nextCue ? timeToNextCue <= 5 && timeToNextCue > 0 ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white font-mono text-[11px] font-black shadow-[0_0_25px_rgba(239,68,68,1)] ring-2 ring-red-400 border border-white animate-pulse scale-105" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm animate-bounce" }, "\u{1F6A8}"), /* @__PURE__ */ React.createElement("span", null, "\xA1ATENCI\xD3N! EN ", /* @__PURE__ */ React.createElement("strong", { className: "text-yellow-300 font-orbitron" }, formatSec(timeToNextCue)), " \u2794 ", /* @__PURE__ */ React.createElement("span", { className: "uppercase tracking-wider" }, nextCue.name))) : /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-djcyan-950/60 border border-djcyan-500/60 text-djcyan-300 font-mono text-[11px] font-bold" }, /* @__PURE__ */ React.createElement("span", null, "\u23F3"), /* @__PURE__ */ React.createElement("span", null, "EN ", /* @__PURE__ */ React.createElement("strong", { className: "text-white font-orbitron" }, barsToNextCue), " BARS (", formatSec(timeToNextCue), ") \u2794 ", /* @__PURE__ */ React.createElement("span", { className: "text-white uppercase" }, nextCue.name))) : /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F7E2}"), /* @__PURE__ */ React.createElement("span", null, "EN ZONA SEGURA DE MEZCLA (OUTRO)"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono uppercase text-amber-400 font-bold mr-1 hidden md:inline" }, "\u{1F3AF} Hitos:"), phases.map((ph) => {
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
    }))), hoveredMilestone && /* @__PURE__ */ React.createElement("div", { className: "absolute left-2 right-2 top-full mt-1.5 z-30 p-2.5 rounded-xl bg-black/95 border border-djcyan-500/60 shadow-2xl backdrop-blur-md text-xs font-mono animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-zinc-800 pb-1 mb-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "font-syne font-bold text-white flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full", style: { backgroundColor: hoveredMilestone.color } }), hoveredMilestone.name, " (", hoveredMilestone.time, ")"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-djcyan-400 font-mono" }, "Comp\xE1s ", Math.round(hoveredMilestone.pct * durSec / (60 / (deck.bpm || 130)) / 4))), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-zinc-300 leading-relaxed" }, /* @__PURE__ */ React.createElement("strong", { className: "text-emerald-400" }, "Acci\xF3n DJ:"), " ", hoveredMilestone.directive || "Ajuste de ganancia y sincron\xEDa arm\xF3nica antes del drop."))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 flex-wrap text-xs font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowTacticalAids(!showTacticalAids),
        className: `flex items-center gap-1.5 px-2 py-0.5 rounded-lg font-bold uppercase transition-all cursor-pointer border text-[10px] sm:text-[11px] ${showTacticalAids ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300"}`,
        title: "Habilitar/Deshabilitar ayudas visuales (Drops, Cues, Zonas Seguras y Anti-Muddy) en el waveform"
      },
      /* @__PURE__ */ React.createElement("span", null, showTacticalAids ? "\u{1F3AF}" : "\u26AA"),
      /* @__PURE__ */ React.createElement("span", null, showTacticalAids ? "Ayudas DJ" : "Puro Wave")
    ), /* @__PURE__ */ React.createElement("div", { className: "hidden sm:flex items-center gap-2 px-2 py-0.5 rounded-md bg-zinc-950/80 border border-zinc-800 text-[9px] text-zinc-400" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-[#2563eb]" }), "Graves (<200Hz)"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-[#f59e0b]" }), "Medios"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-[#ffffff]" }), "Agudos"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px]" }, [2, 4, 8, 16].map((z) => /* @__PURE__ */ React.createElement(
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
    "source": "SIMULATION_MODE",
    "platform": "serato",
    "platform_mode": "auto",
    "platform_name": "Serato DJ Pro",
    "platform_icon": "\u{1F4BF}",
    "platform_color": "#06b6d4",
    "platform_status": "LIVE",
    "detected_platforms": {
      "serato": true,
      "rekordbox": true,
      "virtualdj": true,
      "traktor": false
    },
    "deck_1": {
      "deck_num": "1",
      "status": "ON AIR (MASTER)",
      "is_master": true,
      "is_playing": true,
      "artist": "Mauro Picotto",
      "title": "Komodo (Megavoices Claxixx)",
      "bpm": 137.68,
      "camelot": "10A",
      "camelot_color": "#f472b6",
      "raw_key": "Bm",
      "file_path": "Users/admin/Music/FLAC quality/The Midnight - Deep Blue.flac",
      "genre": "Melodic Techno",
      "subgenre": "Club Master",
      "energy": 92,
      "danceability": 88,
      "format": "FLAC 24-bit",
      "duration": "06:30",
      "duration_sec": 390,
      "elapsed_sec": 182.25,
      "play_progress": 0.4673,
      "phase": "Peak Time",
      "year": "2024",
      "cover": "/cover?path=Users/admin/Music/FLAC quality/The Midnight - Deep Blue.flac",
      "cues": [
        {
          "id": 1,
          "name": "Downbeat 1.0.0",
          "color": "#ef4444",
          "pct": 0.04,
          "time": "00:00.25"
        },
        {
          "id": 2,
          "name": "Intro Perc",
          "color": "#f97316",
          "pct": 0.16,
          "time": "01:04.00"
        },
        {
          "id": 3,
          "name": "Bassline In",
          "color": "#eab308",
          "pct": 0.32,
          "time": "02:08.00"
        },
        {
          "id": 4,
          "name": "MAIN DROP",
          "color": "#10b981",
          "pct": 0.48,
          "time": "03:12.00"
        },
        {
          "id": 5,
          "name": "Breakdown",
          "color": "#06b6d4",
          "pct": 0.62,
          "time": "04:16.00"
        },
        {
          "id": 6,
          "name": "Climax 2",
          "color": "#3b82f6",
          "pct": 0.74,
          "time": "05:04.00"
        },
        {
          "id": 7,
          "name": "Outro 32b",
          "color": "#8b5cf6",
          "pct": 0.86,
          "time": "06:08.00"
        },
        {
          "id": 8,
          "name": "Cut / Fade",
          "color": "#ec4899",
          "pct": 0.96,
          "time": "07:15.00"
        }
      ],
      "structural_phases": [
        {
          "id": "intro",
          "name": "Intro Percusiva",
          "start_pct": 0,
          "end_pct": 0.16,
          "type": "intro",
          "label": "Intro 32b \u2022 Mezcla In",
          "color": "#06b6d4"
        },
        {
          "id": "build",
          "name": "Bassline In",
          "start_pct": 0.16,
          "end_pct": 0.35,
          "type": "build",
          "label": "Bassline Activa",
          "color": "#eab308"
        },
        {
          "id": "break",
          "name": "Breakdown",
          "start_pct": 0.35,
          "end_pct": 0.48,
          "type": "break",
          "label": "Breakdown (Sin Graves)",
          "color": "#38bdf8"
        },
        {
          "id": "drop",
          "name": "MAIN DROP",
          "start_pct": 0.48,
          "end_pct": 0.74,
          "type": "drop",
          "label": "\u26A1 DROP PRINCIPAL (Cl\xEDmax)",
          "color": "#ef4444"
        },
        {
          "id": "break2",
          "name": "Segundo Par\xF3n",
          "start_pct": 0.74,
          "end_pct": 0.82,
          "type": "break",
          "label": "Puente Mel\xF3dico",
          "color": "#a855f7"
        },
        {
          "id": "outro",
          "name": "Outro Limpio",
          "start_pct": 0.82,
          "end_pct": 1,
          "type": "outro",
          "label": "\u{1F7E2} OUTRO SEGURO \u2022 Mezcla Out",
          "color": "#10b981"
        }
      ],
      "lufs": -8.7,
      "low_ratio": 48,
      "mid_ratio": 32,
      "high_ratio": 20,
      "acoustic_role": "Bass Driver",
      "is_audited": true,
      "comment": "[Bass Driver] Intro 32b \u2022 Drop contundente \u2022 Outro 64b",
      "tactical_comment": "[Bass Driver] Intro 32b \u2022 Drop contundente \u2022 Outro 64b",
      "mood": "Peak Time Climax"
    },
    "deck_2": {
      "deck_num": "2",
      "status": "CUE / PREPARADO",
      "is_master": false,
      "is_playing": false,
      "artist": "Marco Bailey / Sigvard",
      "title": "Smooth Mind",
      "bpm": 140,
      "camelot": "6A",
      "camelot_color": "#c084fc",
      "raw_key": "Gm",
      "file_path": "Users/admin/Music/FLAC quality/Snog - Turn on your Brain Baby vs. Acid Outburst 06.flac",
      "genre": "Raw / Deep Techno",
      "subgenre": "Drumcode Core",
      "energy": 91,
      "danceability": 95,
      "format": "FLAC 16-bit",
      "duration": "05:48",
      "duration_sec": 348,
      "elapsed_sec": 88.25,
      "play_progress": 0.2536,
      "phase": "Hypnotic Groove",
      "year": "2023",
      "cover": "/cover?path=Users/admin/Music/FLAC quality/Snog - Turn on your Brain Baby vs. Acid Outburst 06.flac",
      "cues": [
        {
          "id": 1,
          "name": "Downbeat 1.0.0",
          "color": "#ef4444",
          "pct": 0.05,
          "time": "00:00.30"
        },
        {
          "id": 2,
          "name": "Vocal Hook",
          "color": "#f97316",
          "pct": 0.19,
          "time": "01:08.00"
        },
        {
          "id": 3,
          "name": "Build-Up 16b",
          "color": "#eab308",
          "pct": 0.35,
          "time": "02:16.00"
        },
        {
          "id": 4,
          "name": "PEAK DROP",
          "color": "#10b981",
          "pct": 0.5,
          "time": "03:20.00"
        },
        {
          "id": 5,
          "name": "Acid Meltdown",
          "color": "#06b6d4",
          "pct": 0.64,
          "time": "04:24.00"
        },
        {
          "id": 6,
          "name": "Second Drop",
          "color": "#3b82f6",
          "pct": 0.76,
          "time": "05:12.00"
        },
        {
          "id": 7,
          "name": "Outro Limpio",
          "color": "#8b5cf6",
          "pct": 0.88,
          "time": "06:16.00"
        },
        {
          "id": 8,
          "name": "Fade Out",
          "color": "#ec4899",
          "pct": 0.97,
          "time": "06:45.00"
        }
      ],
      "structural_phases": [
        {
          "id": "intro",
          "name": "Intro Percusiva",
          "start_pct": 0,
          "end_pct": 0.16,
          "type": "intro",
          "label": "Intro 32b \u2022 Mezcla In",
          "color": "#06b6d4"
        },
        {
          "id": "build",
          "name": "Bassline In",
          "start_pct": 0.16,
          "end_pct": 0.35,
          "type": "build",
          "label": "Bassline Activa",
          "color": "#eab308"
        },
        {
          "id": "break",
          "name": "Breakdown",
          "start_pct": 0.35,
          "end_pct": 0.48,
          "type": "break",
          "label": "Breakdown (Sin Graves)",
          "color": "#38bdf8"
        },
        {
          "id": "drop",
          "name": "MAIN DROP",
          "start_pct": 0.48,
          "end_pct": 0.74,
          "type": "drop",
          "label": "\u26A1 DROP PRINCIPAL (Cl\xEDmax)",
          "color": "#ef4444"
        },
        {
          "id": "break2",
          "name": "Segundo Par\xF3n",
          "start_pct": 0.74,
          "end_pct": 0.82,
          "type": "break",
          "label": "Puente Mel\xF3dico",
          "color": "#a855f7"
        },
        {
          "id": "outro",
          "name": "Outro Limpio",
          "start_pct": 0.82,
          "end_pct": 1,
          "type": "outro",
          "label": "\u{1F7E2} OUTRO SEGURO \u2022 Mezcla Out",
          "color": "#10b981"
        }
      ],
      "lufs": -9.5,
      "low_ratio": 51,
      "mid_ratio": 31,
      "high_ratio": 18,
      "acoustic_role": "Bass Driver",
      "is_audited": true,
      "comment": "[Bass Driver] Intro 32b \u2022 Drop contundente \u2022 Outro 64b",
      "tactical_comment": "[Bass Driver] Intro 32b \u2022 Drop contundente \u2022 Outro 64b",
      "mood": "Hypnotic Groove"
    },
    "anti_muddy": {
      "clash_detected": true,
      "severity": "CRITICAL",
      "badge": "BASS CLASH",
      "color": "#ef4444",
      "message": "Ambos tracks tienen sub-graves dominantes (>44%). El solape directo crear\xE1 empaste y distorsi\xF3n en el sistema de sala.",
      "tactical_advice": "Corta la EQ de graves (Low) en el canal entrante (-6dB a -12dB) antes de abrir el fader, o usa filtro paso-alto."
    },
    "harmonic": {
      "compatible": false,
      "match_type": "HARMONIC CLASH",
      "camelot_diff": "+4 Pasos",
      "energy_trend": "Disonancia Tonal",
      "badge": "HARMONIC CLASH",
      "color": "#ef4444",
      "advice": "Choque arm\xF3nico severo (10A \u2794 6A). Usa par\xF3n o transici\xF3n por percusi\xF3n."
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
    const [state, setState] = useState(DEFAULT_COPILOT_STATE);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [clock, setClock] = useState("");
    const [latency, setLatency] = useState(2);
    const [errorCount, setErrorCount] = useState(0);
    const [visibleCount, setVisibleCount] = useState(4);
    const [tracksList, setTracksList] = useState(DEFAULT_COPILOT_STATE.recommendations);
    const [draggedIdx, setDraggedIdx] = useState(null);
    const [transitionAnalysis, setTransitionAnalysis] = useState(null);
    const [lowEqApplied, setLowEqApplied] = useState(false);
    const [manualPickerOpen, setManualPickerOpen] = useState(false);
    const [manualSearchQuery, setManualSearchQuery] = useState("");
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
    const [controllerState, setControllerState] = useState({
      detected: true,
      name: "PIONEER DDJ-FLX4 (USB)",
      status: "CONECTADA"
    });
    useEffect(() => {
      if (typeof navigator !== "undefined" && navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({ sysex: false }).then((access) => {
          const checkDevices = () => {
            const inputs = Array.from(access.inputs.values());
            const djDev = inputs.find((d) => /ddj|pioneer|traktor|kontrol|denon|numark|hercules|reloop|dj/i.test(d.name || ""));
            if (djDev) {
              setControllerState({
                detected: true,
                name: djDev.name.toUpperCase(),
                status: "CONECTADA"
              });
            } else if (inputs.length > 0) {
              setControllerState({
                detected: true,
                name: inputs[0].name.toUpperCase(),
                status: "MIDI ACTIVO"
              });
            }
          };
          checkDevices();
          access.onstatechange = checkDevices;
        }).catch(() => {
        });
      }
    }, []);
    useEffect(() => {
      const timer = setInterval(() => {
        const now = /* @__PURE__ */ new Date();
        setClock(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }, 1e3);
      return () => clearInterval(timer);
    }, []);
    useEffect(() => {
      let isMounted = true;
      let eventSource = null;
      let isFetching = false;
      let fallbackInterval = null;
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
                setLatency(dt > 0 ? dt : 2);
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
        fallbackInterval = setInterval(fetchStatus, 1500);
      };
      if (typeof EventSource !== "undefined") {
        try {
          eventSource = new EventSource("/api/copilot/stream");
          eventSource.onmessage = (event) => {
            if (!isMounted) return;
            try {
              const data = JSON.parse(event.data);
              setState(data);
              setLatency(2);
              setErrorCount(0);
              if (data.recommendations && data.recommendations.length > 0) {
                setTracksList((prev) => prev.length === 0 ? data.recommendations : prev);
              }
            } catch (_) {
            }
          };
          eventSource.onerror = () => {
            if (eventSource) {
              eventSource.close();
              eventSource = null;
            }
            startPollingFallback();
          };
        } catch (_) {
          startPollingFallback();
        }
      } else {
        startPollingFallback();
      }
      return () => {
        isMounted = false;
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
    return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-h-screen p-3 sm:p-5 lg:p-6 select-none bg-[#040407] text-gray-200" }, /* @__PURE__ */ React.createElement("header", { className: "flex flex-col md:flex-row md:items-center justify-between pb-3 sm:pb-4 border-b border-zinc-800/80 mb-4 sm:mb-6 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: `w-3.5 h-3.5 rounded-full ${isLive ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse" : isStandby ? "bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)] animate-pulse" : "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"}` }), /* @__PURE__ */ React.createElement("h1", { className: "font-syne font-black text-lg sm:text-2xl text-white tracking-wider uppercase" }, "BEATWAVE ", /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400" }, "COPILOT"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700/60 font-mono text-xs" }, renderPlatformLogo(platform || "serato", 16), /* @__PURE__ */ React.createElement("strong", { style: { color: platform_color || "#00d1e8" } }, platform_name || "DJ LINK"), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-600" }, "|"), /* @__PURE__ */ React.createElement("span", { className: isLive ? "text-red-400 font-bold" : isStandby ? "text-blue-400" : "text-amber-400 font-bold" }, platform_status || (isLive ? "LIVE" : "STANDBY"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-emerald-500/50 font-mono text-[11px] text-emerald-300" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" }), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-400" }, "\u{1F39B}\uFE0F CONTROLADORA:"), /* @__PURE__ */ React.createElement("strong", { className: "text-white" }, controllerState.name), /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400 font-bold" }, "(", controllerState.status, ")")), /* @__PURE__ */ React.createElement("span", { className: "hidden xl:inline-block font-mono text-[11px] text-zinc-500" }, "LATENCIA: ", /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400 font-bold" }, latency, "ms"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap justify-between md:justify-end" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center p-0.5 bg-zinc-950/90 rounded-xl border border-zinc-800/90 shadow-inner" }, platformsList.map((p) => {
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
        onClick: toggleSimulation,
        className: `px-2.5 py-1 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer border ${state.source === "SIMULATION_MODE" ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]" : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-700/60"}`,
        title: "Alternar simulaci\xF3n"
      },
      "\u{1F9EA} ",
      state.source === "SIMULATION_MODE" ? "Simulando" : "Simular"
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
        className: "p-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 cursor-pointer transition-all",
        title: "Pantalla Completa"
      },
      /* @__PURE__ */ React.createElement("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" }))
    ))), /* @__PURE__ */ React.createElement("section", { className: "mb-3.5" }, /* @__PURE__ */ React.createElement("div", { className: `p-2.5 sm:px-4 sm:py-2 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-2.5 ${anti_muddy.status === "danger" ? "bg-red-950/40 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.3)]" : anti_muddy.status === "warning" ? "bg-amber-950/40 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.25)]" : "bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl shrink-0" }, anti_muddy.status === "danger" ? "\u{1F6E1}\uFE0F" : anti_muddy.status === "warning" ? "\u26A1" : "\u{1F7E2}"), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("h2", { className: "font-syne font-black text-xs sm:text-sm text-white tracking-wide" }, anti_muddy.title), /* @__PURE__ */ React.createElement("span", { className: `px-2 py-0.2 rounded-full text-[9px] font-mono font-black uppercase tracking-wider shrink-0 ${anti_muddy.status === "danger" ? "bg-red-600 text-white" : anti_muddy.status === "warning" ? "bg-amber-500 text-black" : "bg-emerald-500 text-black"}` }, anti_muddy.tag)), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-zinc-300 truncate mt-0.5" }, anti_muddy.message))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 shrink-0 flex-wrap justify-between md:justify-end text-[11px] font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 border border-zinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold" }, "ACCI\xD3N:"), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-200 font-semibold" }, anti_muddy.action)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 text-zinc-400" }, /* @__PURE__ */ React.createElement("span", null, "CAMELOT: ", /* @__PURE__ */ React.createElement("strong", { style: { color: harmonic.color } }, harmonic.badge)), /* @__PURE__ */ React.createElement("span", null, "\u0394 LUFS: ", /* @__PURE__ */ React.createElement("strong", { className: "text-white" }, state.lufs_delta > 0 ? `+${state.lufs_delta}` : state.lufs_delta, " dB")))))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-4" }, /* @__PURE__ */ React.createElement(DeckCard, { deck: deck_1, side: "A", isMaster: deck_1.is_master, antiMuddy: anti_muddy, partnerDeck: deck_2 }), /* @__PURE__ */ React.createElement(DeckCard, { deck: deck_2, side: "B", isMaster: deck_2.is_master, antiMuddy: anti_muddy, partnerDeck: deck_1 })), /* @__PURE__ */ React.createElement("section", { className: "mt-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2.5 flex-wrap gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-base" }, "\u{1F3AF}"), /* @__PURE__ */ React.createElement("h3", { className: "font-syne font-black text-xs sm:text-sm uppercase tracking-wider text-zinc-300" }, "Pr\xF3ximas Pistas Sugeridas (", displayRecommendations.length, ")"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-zinc-500 hidden sm:inline" }, "\u2022 Arrastra para reordenar")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement(
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
    ))), transitionAnalysis && /* @__PURE__ */ React.createElement("div", { className: "mb-3 p-2.5 rounded-xl bg-zinc-950 border border-djcyan-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-base" }, "\u26A1"), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-300" }, "Transici\xF3n con ", /* @__PURE__ */ React.createElement("strong", { className: "text-white" }, transitionAnalysis.trackTitle), ":"), /* @__PURE__ */ React.createElement("span", { className: `px-2 py-0.5 rounded font-bold text-[10px] ${transitionAnalysis.isHarmonic ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-red-500/20 text-red-300 border border-red-500/40"}` }, transitionAnalysis.matchType), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-400" }, "\u0394 BPM: ", /* @__PURE__ */ React.createElement("strong", { className: "text-white" }, transitionAnalysis.bpmDelta)), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-400" }, "Sub-Graves: ", /* @__PURE__ */ React.createElement("strong", { className: transitionAnalysis.safeBass ? "text-emerald-400" : "text-amber-400" }, transitionAnalysis.lowRatio, "%"))), /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-zinc-300 truncate" }, /* @__PURE__ */ React.createElement("strong", { className: "text-djcyan-400" }, "Acci\xF3n:"), " ", transitionAnalysis.advice)), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5" }, displayRecommendations.slice(0, visibleCount).map((rec, idx) => {
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
    }))), qrModalOpen && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center" }, /* @__PURE__ */ React.createElement(
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
  function DeckCard({ deck, side, isMaster, antiMuddy = null, partnerDeck = null }) {
    if (!deck) return null;
    return /* @__PURE__ */ React.createElement("div", { className: `p-4 sm:p-5 lg:p-6 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${isMaster ? "bg-gradient-to-b from-[#0c0d1c] to-[#06060c] border-djcyan-500/70 shadow-[0_0_30px_rgba(6,182,212,0.25)]" : "bg-[#07070f] border-zinc-800 hover:border-zinc-700"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/60" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "font-orbitron font-black text-base sm:text-lg text-zinc-400" }, "DECK ", side), /* @__PURE__ */ React.createElement("span", { className: `px-2.5 py-0.5 rounded-full font-mono text-[10px] font-black uppercase tracking-wider ${isMaster ? "bg-djcyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse" : "bg-zinc-800 text-zinc-300"}` }, isMaster ? "\u{1F50A} MASTER (ON AIR)" : "\u{1F3A7} EN CUE (PREPARADO)"), deck.phase && /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline-flex px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/40 text-[10px] font-mono font-bold text-purple-300 uppercase" }, "\u2728 ", deck.phase)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 font-mono text-xs text-zinc-500 uppercase" }, deck.format && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/60 text-[10px] font-bold text-zinc-300" }, deck.format), /* @__PURE__ */ React.createElement("span", null, deck.is_audited ? "\u2713 DSP BEATWAVE" : "DEFAULT DSP"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 mb-2.5 p-2.5 rounded-2xl bg-black/40 border border-zinc-800/80 items-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-700/70 shadow-md bg-black group" }, /* @__PURE__ */ React.createElement(
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
    ), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" }), deck.duration && /* @__PURE__ */ React.createElement("span", { className: "absolute bottom-0.5 right-1 px-1 py-0.2 rounded bg-black/85 text-[8px] font-mono font-bold text-zinc-300" }, deck.duration), deck.year && /* @__PURE__ */ React.createElement("span", { className: "absolute top-0.5 left-1 px-1 py-0.2 rounded bg-black/75 text-[8px] font-mono text-zinc-400" }, deck.year)), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("h2", { className: "font-syne font-bold text-xs sm:text-sm text-white tracking-tight leading-tight truncate", title: deck.title }, deck.title), /* @__PURE__ */ React.createElement("p", { className: "font-syne font-bold text-xs text-zinc-400 mt-0.5 truncate", title: deck.artist }, deck.artist), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 flex-wrap mt-1" }, deck.genre && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded bg-djcyan-950/70 border border-djcyan-500/40 text-[9px] font-mono font-bold text-djcyan-300 truncate" }, deck.genre), deck.subgenre && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-700/60 text-[9px] font-mono text-zinc-400 truncate" }, deck.subgenre)))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between sm:justify-end gap-2 sm:gap-3 border-t md:border-t-0 md:border-l border-zinc-800/80 pt-2 md:pt-0 md:pl-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1 p-1 rounded-xl bg-zinc-950/90 border border-zinc-800 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg bg-zinc-900/80" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "w-5 h-4 rounded text-[9px] font-orbitron font-black text-black flex items-center justify-center shrink-0 shadow-sm",
        style: { backgroundColor: deck.camelot_color || "#ec4899" }
      },
      deck.camelot || "10A"
    ), /* @__PURE__ */ React.createElement("span", { className: "text-[7px] font-mono uppercase text-zinc-500 font-bold" }, "TONO"), /* @__PURE__ */ React.createElement("span", { className: "font-syne font-bold text-[10px] text-white truncate" }, deck.raw_key || deck.camelot)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg bg-zinc-900/80" }, /* @__PURE__ */ React.createElement("span", { className: "text-[7px] font-mono uppercase text-zinc-500 font-bold" }, "TEMPO"), /* @__PURE__ */ React.createElement("span", { className: "font-orbitron font-black text-[10px] text-white" }, deck.bpm ? Number(deck.bpm).toFixed(2) : "130.00"), /* @__PURE__ */ React.createElement("span", { className: "text-[7px] text-zinc-400 font-mono" }, "BPM"))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-[125px] flex flex-col justify-center gap-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[8px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-amber-400 font-bold flex items-center gap-0.5" }, "\u26A1 ENERG\xCDA ", deck.energy || 90, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-zinc-900 rounded-full h-1 overflow-hidden flex" }, /* @__PURE__ */ React.createElement("div", { className: "h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full", style: { width: `${deck.energy || 90}%` } })), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[8px] font-mono mt-0.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-purple-400 font-bold flex items-center gap-0.5" }, "\u3030\uFE0F INTENSIDAD (AROUSAL) ", deck.arousal || deck.danceability || 88, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-zinc-900 rounded-full h-1 overflow-hidden flex" }, /* @__PURE__ */ React.createElement("div", { className: "h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 rounded-full", style: { width: `${deck.arousal || deck.danceability || 88}%` } })), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-start mt-0.5" }, /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded bg-purple-950/70 border border-purple-500/40 text-[8px] font-mono font-bold text-purple-300 truncate max-w-full", title: deck.mood || deck.phase || "Peak Time Climax" }, "\u2728 ", deck.mood || deck.phase || "Peak Time Climax"))))), /* @__PURE__ */ React.createElement("div", { className: "mb-3 p-2.5 rounded-2xl bg-black/60 border border-zinc-800/80" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono uppercase text-zinc-400 tracking-wider font-bold flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-djcyan-400" }), " 8 HOT CUES DE CABINA"), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono text-zinc-500" }, "Puntos de Salto & Estructura")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-4 sm:grid-cols-8 gap-1.5" }, (deck.cues || [
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
    )))), /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, /* @__PURE__ */ React.createElement(
      CopilotSeratoWaveform,
      {
        deck,
        side,
        antiMuddy,
        partnerDeck
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
