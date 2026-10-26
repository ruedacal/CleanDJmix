(() => {
  // web/js/app.jsx
  var { useState, useEffect, useRef, useMemo, useCallback } = React;
  var NV2_COLORS = [
    { id: 1, name: "Kick / Intro", color: "#ef4444", text: "text-red-400", border: "border-red-500/50", bg: "bg-red-500/10", time: "00:00.215" },
    { id: 2, name: "Hi-Hats In", color: "#f97316", text: "text-orange-400", border: "border-orange-500/50", bg: "bg-orange-500/10", time: "00:15.110" },
    { id: 3, name: "Bassline", color: "#eab308", text: "text-yellow-400", border: "border-yellow-500/50", bg: "bg-yellow-500/10", time: "00:30.005" },
    { id: 4, name: "Main Break", color: "#22c55e", text: "text-green-400", border: "border-green-500/50", bg: "bg-green-500/10", time: "01:00.120" },
    { id: 5, name: "Drop 1 (Climax)", color: "#06b6d4", text: "text-cyan-400", border: "border-cyan-500/50", bg: "bg-cyan-500/10", time: "01:30.240" },
    { id: 6, name: "Mid Break", color: "#3b82f6", text: "text-blue-400", border: "border-blue-500/50", bg: "bg-blue-500/10", time: "02:30.400" },
    { id: 7, name: "Drop 2 (Re-Kick)", color: "#a855f7", text: "text-purple-400", border: "border-purple-500/50", bg: "bg-purple-500/10", time: "03:00.510" },
    { id: 8, name: "Outro Mix Point", color: "#ec4899", text: "text-pink-400", border: "border-pink-500/50", bg: "bg-pink-500/10", time: "04:15.000" }
  ];
  var DEFAULT_VINYL_SVG = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="12" fill="#0d0d14"/><circle cx="80" cy="80" r="58" fill="#14141f" stroke="#27273a" stroke-width="2"/><circle cx="80" cy="80" r="44" fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/><circle cx="80" cy="80" r="30" fill="none" stroke="#3b82f6" stroke-width="1.5" opacity="0.5"/><circle cx="80" cy="80" r="14" fill="#06b6d4"/><circle cx="80" cy="80" r="5" fill="#09090b"/></svg>');
  function getValidCover(c) {
    if (!c || typeof c !== "string") return DEFAULT_VINYL_SVG;
    if (c.startsWith("data:") || c.startsWith("http://") || c.startsWith("https://") || c.startsWith("/")) return c;
    return "https://i.scdn.co/image/" + c;
  }
  var CAMELOT_TO_MUSICAL = {
    "1A": "G#m",
    "1B": "B",
    "2A": "D#m",
    "2B": "F#",
    "3A": "A#m",
    "3B": "C#",
    "4A": "Fm",
    "4B": "G#",
    "5A": "Cm",
    "5B": "D#",
    "6A": "Gm",
    "6B": "A#",
    "7A": "Dm",
    "7B": "F",
    "8A": "Am",
    "8B": "C",
    "9A": "Em",
    "9B": "G",
    "10A": "Bm",
    "10B": "D",
    "11A": "F#m",
    "11B": "A",
    "12A": "C#m",
    "12B": "E"
  };
  function getHarmonicKeyDisplay(k) {
    if (!k || k === "--") return "--";
    const clean = String(k).trim().toUpperCase();
    const mus = CAMELOT_TO_MUSICAL[clean];
    return mus ? `${clean} (${mus})` : clean;
  }
  var I18N_TRANSLATIONS = {
    es: {
      nav_audit: "Auditor\xEDa & DSP",
      nav_hotcues: "Estudio Hot Cues",
      nav_trends: "Tendencias",
      nav_knowledge: "Conocimiento",
      nav_setbuilder: "Set-Builder & Flow",
      nav_spotify: "Spotify Ingest",
      nav_shazam: "Radar Shazam",
      nav_taxonomy: "Taxonom\xEDa",
      nav_logs: "Consola (Logs)",
      dsp_online: "DSP ENGINE ONLINE",
      btn_audit_batch: "Configurar Lote",
      btn_execute_audit: "Auditar Todo",
      btn_inject_covers: "Inyectar Car\xE1tulas",
      btn_save_all: "Guardar Todo en Ficheros",
      btn_export_xls: "Exportar Excel",
      btn_change_dir: "Cambiar Carpeta",
      btn_cancel: "Cancelar",
      btn_cancel_audit: "Detener Auditor\xEDa",
      btn_cancel_download: "Cancelar Descargas",
      btn_inspector: "Inspector",
      btn_close_panel: "Cerrar Panel",
      btn_edit_cues_studio: "Editar Hot Cues en Estudio \u2192",
      search_placeholder: "Buscar por t\xEDtulo, artista, BPM o tono...",
      track: "Pista",
      bpm: "BPM",
      key: "Tono",
      energy: "Energ\xEDa",
      danceability: "Bailabilidad",
      mood: "Atm\xF3sfera (Mood)",
      format: "Formato",
      actions: "Acciones",
      cues_summary_title: "8 Hot Cues (Resumen T\xE1ctico)",
      cues_open_studio_btn: "Abrir Estudio Hot Cues \u2192",
      studio_title: "Estudio Profesional de Hot Cues & Beatgrid",
      studio_desc: "Waveform con desplazamiento horizontal y zoom milim\xE9trico para fijar puntos de mezcla y beatgrid.",
      zoom_level: "Zoom Horizontal",
      snap_to_grid: "Snap a Rejilla",
      show_beatgrid: "Ver Beatgrid",
      follow_playhead: "Seguir Reproducci\xF3n",
      auto_phrase: "Auto-Frasear 16/32b",
      save_track_disk: "Guardar Pista en Disco",
      save_all_disk: "Guardar Todo el Lote",
      pad: "Pad",
      jump_cue: "Saltar",
      tactical_comment_title: "Comentario T\xE1ctico DJ",
      regenerate_mood_btn: "Regenerar Mood & Comentario IA",
      shazam_radar_title: "Radar Ac\xFAstico ShazamIO",
      shazam_mic_btn: "Escuchar por Micr\xF3fono",
      shazam_drop_text: "Arrastra o selecciona un archivo de audio",
      shazam_send_spotify: "Descargar en Spotify Ingest",
      shazam_send_audit: "A\xF1adir a Auditor\xEDa DJ",
      apply_track_changes: "Aplicar Cambios a este Track",
      lang_switch: "Idioma",
      metric_total: "Total Pistas",
      metric_missing: "Falta Metadata",
      metric_ready: "Listas para Inyectar",
      metric_lossless: "Certificaci\xF3n Lossless",
      filter_all: "Todos",
      filter_missing: "Falta Metadata",
      filter_errors: "Errores",
      th_num: "#",
      th_waveform: "Waveform",
      th_title: "Archivo / T\xEDtulo",
      th_artist: "Artista",
      th_format: "Formato",
      th_khz: "kHz",
      th_kbps: "kbps",
      th_quality: "Calidad",
      th_loss: "P\xE9rdida / Compresi\xF3n",
      th_duration: "Duraci\xF3n",
      th_bpm: "BPM",
      th_key: "Key",
      th_fft: "Cert. FFT",
      th_trim: "Auto-Trim",
      th_beat: "Beat 1.0.0",
      th_cues: "8 Hot Cues",
      th_energy: "Energ\xEDa",
      th_dance: "Dance",
      th_mood: "Atm\xF3sfera",
      th_comment: "Comentario T\xE1ctico DJ",
      th_status: "Estado",
      th_album: "\xC1lbum",
      download_btn: "Descargar",
      fft_auditing_msg: "Auditor\xEDa FFT en curso...",
      fft_certified: "PASS 22.05kHz",
      fft_fake: "Falso FLAC",
      taxonomy_search_title: "Buscador Inteligente por Taxonom\xEDas & Estilos",
      taxonomy_search_prompt: "Pedile la m\xFAsica a la IA: Escribilo con tus palabras, como se lo dir\xEDas a otro DJ",
      taxonomy_tab_search: "Buscador IA",
      taxonomy_tab_crates: "Serato Crates & Rekordbox"
    },
    en: {
      nav_audit: "Audit & DSP",
      nav_hotcues: "Hot Cues Studio",
      nav_trends: "Trends",
      nav_knowledge: "Knowledge",
      nav_setbuilder: "Set-Builder & Flow",
      nav_spotify: "Spotify Ingest",
      nav_shazam: "Radar Shazam",
      nav_taxonomy: "Taxonomy",
      nav_logs: "Console (Logs)",
      dsp_online: "DSP ENGINE ONLINE",
      btn_audit_batch: "Batch Config",
      btn_execute_audit: "Audit All",
      btn_inject_covers: "Inject Covers",
      btn_save_all: "Save All to Files",
      btn_export_xls: "Export Excel",
      btn_change_dir: "Change Folder",
      btn_cancel: "Cancel",
      btn_cancel_audit: "Stop Audit",
      btn_cancel_download: "Cancel Downloads",
      btn_inspector: "Inspector",
      btn_close_panel: "Close Panel",
      btn_edit_cues_studio: "Edit Hot Cues in Studio \u2192",
      search_placeholder: "Search by title, artist, BPM or key...",
      track: "Track",
      bpm: "BPM",
      key: "Key",
      energy: "Energy",
      danceability: "Danceability",
      mood: "Atmosphere (Mood)",
      format: "Format",
      actions: "Actions",
      cues_summary_title: "8 Hot Cues (Tactical Summary)",
      cues_open_studio_btn: "Open in Hot Cues Studio \u2192",
      studio_title: "Professional Hot Cues & Beatgrid Studio",
      studio_desc: "Expanded horizontal scroll waveform with millimetric zoom to anchor mix cues and beatgrid.",
      zoom_level: "Horizontal Zoom",
      snap_to_grid: "Snap to Grid",
      show_beatgrid: "Show Beatgrid",
      follow_playhead: "Follow Playhead",
      auto_phrase: "Auto-Phrase 16/32b",
      save_track_disk: "Save Track to Disk",
      save_all_disk: "Save All Batch",
      pad: "Pad",
      jump_cue: "Jump",
      tactical_comment_title: "Tactical DJ Comment",
      regenerate_mood_btn: "Regenerate Mood & AI Comment",
      shazam_radar_title: "ShazamIO Acoustic Radar",
      shazam_mic_btn: "Listen with Microphone",
      shazam_drop_text: "Drag & drop or browse an audio file",
      shazam_send_spotify: "Download in Spotify Ingest",
      shazam_send_audit: "Add to DJ Audit",
      apply_track_changes: "Apply Changes to this Track",
      lang_switch: "Language",
      metric_total: "Total Tracks",
      metric_missing: "Missing Metadata",
      metric_ready: "Ready to Inject",
      metric_lossless: "Lossless Certification",
      filter_all: "All",
      filter_missing: "Missing Metadata",
      filter_errors: "Errors",
      th_num: "#",
      th_waveform: "Waveform",
      th_title: "File / Title",
      th_artist: "Artist",
      th_format: "Format",
      th_khz: "kHz",
      th_kbps: "kbps",
      th_quality: "Quality",
      th_loss: "Loss / Compression",
      th_duration: "Duration",
      th_bpm: "BPM",
      th_key: "Key",
      th_fft: "Cert. FFT",
      th_trim: "Auto-Trim",
      th_beat: "Beat 1.0.0",
      th_cues: "8 Hot Cues",
      th_energy: "Energy",
      th_dance: "Dance",
      th_mood: "Atmosphere",
      th_comment: "Tactical DJ Comment",
      th_status: "Status",
      th_album: "Album",
      download_btn: "Download",
      fft_auditing_msg: "FFT Audit in progress...",
      fft_certified: "PASS 22.05kHz",
      fft_fake: "Fake FLAC",
      taxonomy_search_title: "Smart Search by Taxonomy & Music Styles",
      taxonomy_search_prompt: "Ask the AI for music: Write it in your own words, like you'd say to another DJ",
      taxonomy_tab_search: "AI Search",
      taxonomy_tab_crates: "Serato Crates & Rekordbox"
    }
  };
  var Icons = {
    Library: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "3", width: "7", height: "7" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "3", width: "7", height: "7" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "14", width: "7", height: "7" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "14", width: "7", height: "7" })),
    Cue: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("polygon", { points: "12 2 2 7 12 12 22 7 12 2" }), /* @__PURE__ */ React.createElement("polyline", { points: "2 17 12 22 22 17" }), /* @__PURE__ */ React.createElement("polyline", { points: "2 12 12 17 22 12" })),
    ZoomIn: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /* @__PURE__ */ React.createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" }), /* @__PURE__ */ React.createElement("line", { x1: "11", y1: "8", x2: "11", y2: "14" }), /* @__PURE__ */ React.createElement("line", { x1: "8", y1: "11", x2: "14", y2: "11" })),
    ZoomOut: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /* @__PURE__ */ React.createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" }), /* @__PURE__ */ React.createElement("line", { x1: "8", y1: "11", x2: "14", y2: "11" })),
    Spotify: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), /* @__PURE__ */ React.createElement("polyline", { points: "7 10 12 15 17 10" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "15", x2: "12", y2: "3" })),
    Routing: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" })),
    Folder: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" })),
    Terminal: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("polyline", { points: "4 17 10 11 4 5" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "19", x2: "20", y2: "19" })),
    Play: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "currentColor" }, /* @__PURE__ */ React.createElement("polygon", { points: "5 3 19 12 5 21 5 3" })),
    Pause: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "currentColor" }, /* @__PURE__ */ React.createElement("rect", { x: "6", y: "4", width: "4", height: "16" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "4", width: "4", height: "16" })),
    Sliders: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("line", { x1: "4", y1: "21", x2: "4", y2: "14" }), /* @__PURE__ */ React.createElement("line", { x1: "4", y1: "10", x2: "4", y2: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "21", x2: "12", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "8", x2: "12", y2: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "20", y1: "21", x2: "20", y2: "16" }), /* @__PURE__ */ React.createElement("line", { x1: "20", y1: "12", x2: "20", y2: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "1", y1: "14", x2: "7", y2: "14" }), /* @__PURE__ */ React.createElement("line", { x1: "9", y1: "8", x2: "15", y2: "8" }), /* @__PURE__ */ React.createElement("line", { x1: "17", y1: "16", x2: "23", y2: "16" })),
    Gear: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3" }), /* @__PURE__ */ React.createElement("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" })),
    Check: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "#10b981", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "20 6 9 17 4 12" })),
    Warning: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "#f59e0b", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "9", x2: "12", y2: "13" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })),
    Excel: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), /* @__PURE__ */ React.createElement("polyline", { points: "14 2 14 8 20 8" }), /* @__PURE__ */ React.createElement("line", { x1: "16", y1: "13", x2: "8", y2: "13" }), /* @__PURE__ */ React.createElement("line", { x1: "16", y1: "17", x2: "8", y2: "17" }), /* @__PURE__ */ React.createElement("polyline", { points: "10 9 9 9 8 9" })),
    Radar: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "6" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "2" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "2", x2: "12", y2: "12" })),
    Mic: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("path", { d: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" }), /* @__PURE__ */ React.createElement("path", { d: "M19 10v2a7 7 0 0 1-14 0v-2" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "19", x2: "12", y2: "23" }), /* @__PURE__ */ React.createElement("line", { x1: "8", y1: "23", x2: "16", y2: "23" })),
    Trends: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("polyline", { points: "23 6 13.5 15.5 8.5 10.5 1 18" }), /* @__PURE__ */ React.createElement("polyline", { points: "17 6 23 6 23 12" })),
    Flow: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("path", { d: "M3 3v18h18" }), /* @__PURE__ */ React.createElement("path", { d: "M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" })),
    Knowledge: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("path", { d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20" }), /* @__PURE__ */ React.createElement("path", { d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" })),
    Menu: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("line", { x1: "3", y1: "12", x2: "21", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "3", y1: "6", x2: "21", y2: "6" }), /* @__PURE__ */ React.createElement("line", { x1: "3", y1: "18", x2: "21", y2: "18" })),
    Close: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" }))
  };
  var InfoTip = ({ text, title }) => {
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
    return /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center ml-1.5 align-middle" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        ref: btnRef,
        type: "button",
        onMouseEnter: handleEnter,
        onMouseLeave: handleLeave,
        onClick: (e) => {
          e.stopPropagation();
          coords ? handleLeave() : handleEnter();
        },
        className: "w-3.5 h-3.5 rounded-full bg-djzinc-800 hover:bg-djcyan-500 hover:text-black border border-djzinc-600 flex items-center justify-center text-[9px] font-mono font-bold text-gray-400 transition-colors cursor-help select-none shrink-0"
      },
      "i"
    ), coords && ReactDOM.createPortal(
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            position: "fixed",
            top: `${coords.top}px`,
            right: `${coords.right}px`,
            transform: "translateY(-50%)",
            zIndex: 999999
          },
          className: "w-72 bg-djzinc-900 border border-djzinc-700 rounded-lg p-3 text-xs text-gray-200 shadow-[0_12px_36px_rgba(0,0,0,0.95),0_0_15px_rgba(6,182,212,0.2)] pointer-events-none select-none"
        },
        /* @__PURE__ */ React.createElement("div", { className: "absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-djzinc-900 border-t border-r border-djzinc-700 rotate-45" }),
        title && /* @__PURE__ */ React.createElement("div", { className: "text-[11px] font-bold text-djcyan-400 mb-1 uppercase tracking-wider flex items-center gap-1.5 border-b border-djzinc-800 pb-1" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-djcyan-400" }), title),
        /* @__PURE__ */ React.createElement("div", { className: "text-[11px] leading-relaxed text-gray-300 font-sans break-words whitespace-normal" }, text)
      ),
      document.body
    ));
  };
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
  function getAudioEQNodes(audioElement) {
    if (!audioElement) return null;
    if (window.__bwAudioNodes && window.__bwAudioNodes.audio === audioElement) {
      if (window.__bwAudioNodes.ctx.state === "suspended") {
        window.__bwAudioNodes.ctx.resume().catch(() => {
        });
      }
      return window.__bwAudioNodes;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(audioElement);
      const low = ctx.createBiquadFilter();
      low.type = "lowshelf";
      low.frequency.value = 250;
      low.gain.value = 0;
      const mid = ctx.createBiquadFilter();
      mid.type = "peaking";
      mid.frequency.value = 1e3;
      mid.Q.value = 1;
      mid.gain.value = 0;
      const high = ctx.createBiquadFilter();
      high.type = "highshelf";
      high.frequency.value = 3500;
      high.gain.value = 0;
      source.connect(low);
      low.connect(mid);
      mid.connect(high);
      high.connect(ctx.destination);
      const nodes = { audio: audioElement, ctx, source, low, mid, high };
      window.__bwAudioNodes = nodes;
      return nodes;
    } catch (e) {
      console.warn("Web Audio EQ initialization note:", e);
      return null;
    }
  }
  var RotaryKnob = ({ label, value = 0, min = -24, max = 6, defaultValue = 0, onChange, color = "#06b6d4" }) => {
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const angle = -135 + normalized * 270;
    const handlePointerDown = (e) => {
      e.preventDefault();
      const startY = e.clientY || e.touches && e.touches[0].clientY || 0;
      const startVal = value;
      const onPointerMove = (me) => {
        const currentY = me.clientY || me.touches && me.touches[0].clientY || 0;
        const deltaY = startY - currentY;
        const range = max - min;
        const step = deltaY * (range / 120);
        const newVal = Math.min(max, Math.max(min, Math.round((startVal + step) * 10) / 10));
        if (onChange) onChange(newVal);
      };
      const onPointerUp = () => {
        window.removeEventListener("mousemove", onPointerMove);
        window.removeEventListener("mouseup", onPointerUp);
        window.removeEventListener("touchmove", onPointerMove);
        window.removeEventListener("touchend", onPointerUp);
      };
      window.addEventListener("mousemove", onPointerMove);
      window.addEventListener("mouseup", onPointerUp);
      window.addEventListener("touchmove", onPointerMove);
      window.addEventListener("touchend", onPointerUp);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center gap-1 select-none" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono font-bold text-gray-400 tracking-wider uppercase" }, label), /* @__PURE__ */ React.createElement(
      "div",
      {
        onMouseDown: handlePointerDown,
        onTouchStart: handlePointerDown,
        onDoubleClick: () => onChange && onChange(defaultValue),
        className: "w-10 h-10 rounded-full bg-gradient-to-b from-[#181826] to-[#0c0c14] border-2 border-djzinc-700 hover:border-gray-400 relative cursor-ns-resize shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_2px_6px_rgba(0,0,0,0.6)] flex items-center justify-center group active:scale-95 transition-transform",
        title: `${label}: ${value > 0 ? "+" : ""}${value.toFixed(1)} dB (Doble clic para 0dB)`
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "absolute w-full h-full rounded-full pointer-events-none",
          style: { transform: `rotate(${angle}deg)` }
        },
        /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "w-1 h-3 rounded-full mx-auto mt-0.5 shadow-sm",
            style: { backgroundColor: color, boxShadow: `0 0 8px ${color}` }
          }
        )
      ),
      /* @__PURE__ */ React.createElement("div", { className: "w-4 h-4 rounded-full bg-[#1e1e2c] border border-djzinc-600 pointer-events-none flex items-center justify-center shadow-inner" }, /* @__PURE__ */ React.createElement("div", { className: "w-1 h-1 rounded-full bg-djzinc-500" }))
    ), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono text-gray-300 font-extrabold" }, value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1), " ", /* @__PURE__ */ React.createElement("span", { className: "text-[7.5px] text-gray-500 font-normal" }, "dB")));
  };
  var TableHarmonicWaveform = ({ track, duration = "05:00", onPlayTrack, isCurrentPlaying, onTogglePlay, playProgress = 0 }) => {
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
      for (let x = 0; x <= width; x += 1) {
        const xNorm = x / width;
        const { bass, drums, vocals, treble, isBreak } = computeTrackStructuralBands(xNorm, seed);
        const hBass = height * 0.44 * bass;
        ctx.fillStyle = isBreak ? "rgba(30, 58, 138, 0.20)" : "rgba(37, 99, 235, 0.88)";
        ctx.fillRect(x, centerY - hBass, 1, hBass * 2);
        const hDrums = height * 0.32 * drums;
        ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
        ctx.fillRect(x, centerY - hDrums, 1, hDrums * 2);
        const hVocals = height * 0.24 * vocals;
        ctx.fillStyle = isBreak ? "rgba(16, 185, 129, 0.95)" : "rgba(245, 158, 11, 0.85)";
        ctx.fillRect(x, centerY - hVocals, 1, hVocals * 2);
        const hTreble = height * 0.14 * treble;
        ctx.fillStyle = "rgba(34, 211, 238, 0.95)";
        ctx.fillRect(x, centerY - hTreble, 1, hTreble * 2);
      }
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
    return /* @__PURE__ */ React.createElement("div", { onClick: handleClickScrub, className: "w-28 h-7 bg-[#040407] rounded border border-djzinc-800 relative overflow-hidden group cursor-pointer hover:border-djcyan-400 transition-colors flex items-center justify-center" }, /* @__PURE__ */ React.createElement("canvas", { ref: canvasRef, style: { width: "112px", height: "28px", display: "block" } }), /* @__PURE__ */ React.createElement("span", { className: "absolute bottom-0.5 right-1 text-[8px] font-mono text-gray-400 opacity-60 group-hover:opacity-100" }, duration), isCurrentPlaying && /* @__PURE__ */ React.createElement("div", { className: "absolute top-1 left-1 w-2 h-2 rounded-full bg-djcyan-400 animate-pulse" }));
  };
  var WAVEFORM_COLOR_LEGEND = [
    { name: "Bass / Sub", color: "#2563eb", rgb: [37, 99, 235], hex: "#2563EB", desc: "Subgraves y pegada de bombos (<150Hz)", text: "text-blue-400", dot: "bg-blue-500" },
    { name: "Drums / Impact", color: "#ef4444", rgb: [239, 68, 68], hex: "#EF4444", desc: "Cajas, claps y transitorios r\xEDtmicos (150-1kHz)", text: "text-red-400", dot: "bg-red-500" },
    { name: "Vocal / Synth", color: "#10b981", rgb: [16, 185, 129], hex: "#10B981", desc: "Vocales, pads y sintetizadores mel\xF3dicos (1k-5kHz)", text: "text-emerald-400", dot: "bg-emerald-500" },
    { name: "Hi-Hat / Treble", color: "#22d3ee", rgb: [34, 211, 238], hex: "#22D3EE", desc: "Platos, shakers y brillo a\xE9reo (>5kHz)", text: "text-djcyan-400", dot: "bg-djcyan-400" }
  ];
  var DJ_PAD_PALETTE = [
    { id: 1, name: "Kick / Intro", color: "#ef4444", hex: "#EF4444", text: "text-red-400", border: "border-red-500/50", bg: "bg-red-500/10", rgb: [239, 68, 68] },
    { id: 2, name: "Hi-Hats In", color: "#f97316", hex: "#F97316", text: "text-orange-400", border: "border-orange-500/50", bg: "bg-orange-500/10", rgb: [249, 115, 22] },
    { id: 3, name: "Bassline", color: "#eab308", hex: "#EAB308", text: "text-yellow-400", border: "border-yellow-500/50", bg: "bg-yellow-500/10", rgb: [234, 179, 8] },
    { id: 4, name: "Main Break", color: "#22c55e", hex: "#22C55E", text: "text-green-400", border: "border-green-500/50", bg: "bg-green-500/10", rgb: [34, 197, 94] },
    { id: 5, name: "Drop 1 (Climax)", color: "#06b6d4", hex: "#06B6D4", text: "text-cyan-400", border: "border-cyan-500/50", bg: "bg-cyan-500/10", rgb: [6, 182, 212] },
    { id: 6, name: "Mid Break", color: "#3b82f6", hex: "#3B82F6", text: "text-blue-400", border: "border-blue-500/50", bg: "bg-blue-500/10", rgb: [59, 130, 246] },
    { id: 7, name: "Drop 2 (Re-Kick)", color: "#a855f7", hex: "#A855F7", text: "text-purple-400", border: "border-purple-500/50", bg: "bg-purple-500/10", rgb: [168, 85, 247] },
    { id: 8, name: "Outro Mix Point", color: "#ec4899", hex: "#EC4899", text: "text-pink-400", border: "border-pink-500/50", bg: "bg-pink-500/10", rgb: [236, 72, 153] },
    { id: 9, name: "Blanco Serato", color: "#f8fafc", hex: "#F8FAFC", text: "text-slate-100", border: "border-slate-400/50", bg: "bg-slate-400/10", rgb: [248, 250, 252] }
  ];
  var parseDurationMs = (dur) => {
    if (!dur || typeof dur !== "string") return 3e5;
    const parts = dur.split(":");
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10) || 0;
      const s = parseFloat(parts[1]) || 0;
      return Math.max(1e3, (m * 60 + s) * 1e3);
    }
    return 3e5;
  };
  var parseTimeToMs = (timeStr) => {
    if (!timeStr || typeof timeStr !== "string") return 0;
    const parts = timeStr.trim().split(":");
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10) || 0;
      const s = parseFloat(parts[1]) || 0;
      return Math.max(0, (m * 60 + s) * 1e3);
    }
    const num = parseFloat(timeStr);
    return !isNaN(num) ? Math.max(0, num * 1e3) : 0;
  };
  var formatMsToTime = (ms) => {
    const totalSec = Math.max(0, ms) / 1e3;
    const m = Math.floor(totalSec / 60);
    const s = (totalSec % 60).toFixed(2);
    const sPadded = s.length < 5 ? "0" + s : s;
    return `${String(m).padStart(2, "0")}:${sPadded}`;
  };
  var RekordboxWaveform = ({
    track,
    cues = NV2_COLORS,
    duration = "06:12",
    onSeekTrack,
    playProgress = 0,
    isCurrentPlaying = false,
    onUpdateCues,
    selectedCueId = 1,
    onSelectCue,
    snapToGrid = true,
    showBeatgrid = true,
    onToggleSnap,
    onToggleGrid
  }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [draggingCueIdx, setDraggingCueIdx] = useState(null);
    const [dragInfo, setDragInfo] = useState(null);
    const rawId = track && track.id ? String(track.id) : "1";
    const seed = rawId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;
    const durMs = parseDurationMs(duration);
    const bpm = track && (track.bpm || track.b) ? Math.max(30, parseFloat(track.bpm || track.b) || 128) : 128;
    const beatMs = 6e4 / bpm;
    const barMs = beatMs * 4;
    const downbeatMs = track && track.first_downbeat_ms ? parseFloat(track.first_downbeat_ms) : 0;
    const trimMs = track && track.trim_start_ms ? parseFloat(track.trim_start_ms) : 0;
    const downbeatPct = downbeatMs > 0 ? Math.max(0.4, Math.min(99, downbeatMs / durMs * 100)) : null;
    const trimPct = trimMs > 0 ? Math.max(0.2, Math.min(99, trimMs / durMs * 100)) : null;
    const activeCues = Array.from({ length: 8 }, (_, idx) => {
      const padNum = idx + 1;
      const existing = cues && cues[idx] ? cues[idx] : null;
      const defaultPreset = NV2_COLORS[idx] || { id: padNum, name: `Cue ${padNum}`, color: "#06b6d4", time: "00:00.00" };
      if (existing) {
        return {
          ...defaultPreset,
          ...existing,
          id: padNum,
          color: existing.color || defaultPreset.color
        };
      }
      return defaultPreset;
    });
    const handleCanvasClick = (e) => {
      if (!containerRef.current || !onSeekTrack || draggingCueIdx !== null) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeekTrack(track, pct, true);
    };
    const handleCueMouseDown = (e, idx) => {
      e.stopPropagation();
      e.preventDefault();
      setDraggingCueIdx(idx);
      if (onSelectCue && activeCues[idx]) {
        onSelectCue(activeCues[idx].id || idx + 1);
      }
    };
    useEffect(() => {
      if (draggingCueIdx === null) return;
      const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const rawPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const rawMs = rawPct * durMs;
        let finalMs = rawMs;
        if (snapToGrid) {
          const beatOffset = Math.round((rawMs - downbeatMs) / beatMs);
          finalMs = Math.max(0, Math.min(durMs, downbeatMs + beatOffset * beatMs));
        }
        const finalPct = durMs > 0 ? finalMs / durMs : 0;
        const timeStr = formatMsToTime(finalMs);
        const barNum = Math.max(1, Math.floor((finalMs - downbeatMs) / barMs) + 1);
        const beatNum = Math.floor(Math.max(0, (finalMs - downbeatMs) % barMs) / beatMs) + 1;
        const barStr = `Bar ${barNum}.${beatNum}`;
        setDragInfo({
          idx: draggingCueIdx,
          pct: finalPct * 100,
          time: timeStr,
          bar: barStr,
          posMs: Math.round(finalMs)
        });
        if (onUpdateCues) {
          const updated = activeCues.map((c, i) => {
            if (i === draggingCueIdx) {
              return {
                ...c,
                pct: finalPct,
                pos_ms: Math.round(finalMs),
                time: timeStr,
                bar: barNum,
                bar_str: `Bar ${barNum}`
              };
            }
            return c;
          });
          onUpdateCues(updated);
        }
      };
      const handleMouseUp = () => {
        setDraggingCueIdx(null);
        setDragInfo(null);
      };
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [draggingCueIdx, durMs, downbeatMs, beatMs, barMs, snapToGrid, activeCues, onUpdateCues]);
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
      if (showBeatgrid && bpm >= 40) {
        for (let t = downbeatMs; t <= durMs; t += beatMs) {
          const bx = t / durMs * width;
          if (bx < 0 || bx > width) continue;
          const bIdx = Math.round((t - downbeatMs) / beatMs);
          const isBar = bIdx % 4 === 0;
          const isPhrase16 = bIdx % 16 === 0;
          ctx.beginPath();
          if (isPhrase16) {
            ctx.strokeStyle = "rgba(6, 182, 212, 0.45)";
            ctx.lineWidth = 1.2;
          } else if (isBar) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
            ctx.lineWidth = 1;
          } else {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
            ctx.lineWidth = 0.75;
          }
          ctx.moveTo(bx, 0);
          ctx.lineTo(bx, height);
          ctx.stroke();
          if (isBar) {
            ctx.fillStyle = isPhrase16 ? "#06b6d4" : "rgba(255, 255, 255, 0.4)";
            ctx.fillRect(bx - 0.5, 0, 1.5, 5);
          }
        }
        for (let t = downbeatMs - beatMs; t >= 0; t -= beatMs) {
          const bx = t / durMs * width;
          if (bx < 0 || bx > width) continue;
          const bIdx = Math.round((t - downbeatMs) / beatMs);
          const isBar = bIdx % 4 === 0;
          ctx.beginPath();
          ctx.strokeStyle = isBar ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.05)";
          ctx.lineWidth = isBar ? 1 : 0.75;
          ctx.moveTo(bx, 0);
          ctx.lineTo(bx, height);
          ctx.stroke();
        }
      }
      for (let x = 0; x <= width; x += 1.5) {
        const xNorm = x / width;
        const { bass, drums, vocals, treble, isBreak } = computeTrackStructuralBands(xNorm, seed);
        if (isBreak) {
          ctx.fillStyle = "rgba(16, 185, 129, 0.07)";
          ctx.fillRect(x, 0, 1.5, height);
        }
        const hBass = height * 0.44 * bass;
        ctx.fillStyle = isBreak ? "rgba(30, 58, 138, 0.20)" : "rgba(37, 99, 235, 0.88)";
        ctx.fillRect(x, centerY - hBass, 1.5, hBass * 2);
        const hDrums = height * 0.32 * drums;
        ctx.fillStyle = "rgba(239, 68, 68, 0.86)";
        ctx.fillRect(x, centerY - hDrums, 1.5, hDrums * 2);
        const hVocals = height * 0.22 * vocals;
        ctx.fillStyle = isBreak ? "rgba(16, 185, 129, 0.95)" : "rgba(245, 158, 11, 0.88)";
        ctx.fillRect(x, centerY - hVocals, 1.5, hVocals * 2);
        const hTreble = height * 0.14 * treble;
        ctx.fillStyle = "rgba(34, 211, 238, 0.95)";
        ctx.fillRect(x, centerY - hTreble, 1.5, hTreble * 2);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
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
    }, [track, seed, playProgress, isCurrentPlaying, showBeatgrid, bpm, downbeatMs, durMs, beatMs]);
    return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1 w-full bg-[#050508] p-2.5 rounded-lg border border-djzinc-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-[10px] font-mono text-gray-400 px-0.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-semibold flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-djcyan-400 animate-pulse" }), "WAVEFORM & BEATGRID REKORDBOX"), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-400 font-mono bg-djzinc-900 px-1.5 py-0.2 rounded border border-djzinc-750" }, bpm.toFixed(2), " BPM \u2022 Grid @ ", Math.round(downbeatMs), "ms")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-[9px]" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onToggleGrid,
        className: `px-1.5 py-0.5 rounded font-mono font-bold text-[8px] transition-colors border cursor-pointer ${showBeatgrid ? "bg-djcyan-950 text-djcyan-400 border-djcyan-700" : "bg-djzinc-900 text-gray-500 border-djzinc-800"}`,
        title: "Activar/Desactivar visualizaci\xF3n de compases del Beatgrid"
      },
      showBeatgrid ? "\u{1F532} Grid: ON" : "\u{1F533} Grid: OFF"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onToggleSnap,
        className: `px-1.5 py-0.5 rounded font-mono font-bold text-[8px] transition-colors border cursor-pointer ${snapToGrid ? "bg-emerald-950 text-emerald-400 border-emerald-700" : "bg-djzinc-900 text-gray-500 border-djzinc-800"}`,
        title: "Imantar / Snap magn\xE9tico al comp\xE1s al arrastrar cues"
      },
      snapToGrid ? "\u{1F9F2} Snap: ON" : "\u{1F9F2} Snap: OFF"
    ), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 font-mono ml-1" }, duration))), /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: containerRef,
        onClick: handleCanvasClick,
        className: "relative w-full h-[114px] bg-[#030306] rounded border border-djzinc-800/80 overflow-hidden cursor-pointer hover:border-djcyan-500/50 transition-colors select-none"
      },
      /* @__PURE__ */ React.createElement("canvas", { ref: canvasRef, style: { width: "100%", height: "114px", display: "block" } }),
      trimPct !== null && /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 bottom-0 flex flex-col items-center pointer-events-none z-20", style: { left: `${trimPct}%` } }, /* @__PURE__ */ React.createElement("div", { className: "px-1 py-0.5 rounded-b text-[7px] font-mono font-black text-black bg-amber-400 flex items-center justify-center shadow" }, "TRIM"), /* @__PURE__ */ React.createElement("div", { className: "w-[1.5px] h-full bg-amber-400 opacity-90 shadow-[0_0_6px_rgba(251,191,36,0.9)]" })),
      downbeatPct !== null && /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 bottom-0 flex flex-col items-center pointer-events-none z-20", style: { left: `${downbeatPct}%` } }, /* @__PURE__ */ React.createElement("div", { className: "px-1 py-0.5 rounded-b text-[7px] font-mono font-black text-black bg-djcyan-400 flex items-center justify-center shadow" }, "1.0.0"), /* @__PURE__ */ React.createElement("div", { className: "w-[1.5px] h-full bg-djcyan-400 opacity-90 shadow-[0_0_6px_rgba(34,211,238,0.9)]" })),
      activeCues.map((c, idx) => {
        let leftPos = c.pct !== void 0 ? c.pct * 100 : Math.min(94, Math.max(4, idx * 12.2 + 3));
        if (idx === 0 && downbeatPct !== null && c.pct === void 0) {
          leftPos = Math.min(94, Math.max(0.5, downbeatPct));
        }
        const isSelected = selectedCueId === (c.id || idx + 1);
        const isDragging = draggingCueIdx === idx;
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: c.id || idx,
            className: "absolute top-0 bottom-0 flex flex-col items-center z-30",
            style: { left: `${leftPos}%`, transform: "translateX(-50%)" }
          },
          /* @__PURE__ */ React.createElement(
            "div",
            {
              onMouseDown: (e) => handleCueMouseDown(e, idx),
              onClick: (e) => {
                e.stopPropagation();
                if (onSelectCue) onSelectCue(c.id || idx + 1);
              },
              onDoubleClick: (e) => {
                e.stopPropagation();
                if (onSeekTrack) onSeekTrack(track, c.pct !== void 0 ? c.pct : leftPos / 100, true);
              },
              title: `Pad ${c.id || idx + 1}: ${c.name || "Cue"} (${c.time || "00:00.0"}) \u2022 ${c.color || "#ef4444"}
Arrastra para mover en el Grid \u2022 Clic para editar \u2022 Doble clic para reproducir`,
              className: `w-4 h-4 rounded-b text-[8px] font-mono font-black text-black flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing select-none transition-all ${isSelected ? "ring-2 ring-white scale-125 z-40" : "hover:scale-115"}`,
              style: { backgroundColor: c.color || "#ef4444" }
            },
            c.id || idx + 1
          ),
          /* @__PURE__ */ React.createElement(
            "div",
            {
              className: `w-[1.5px] h-full ${isSelected || isDragging ? "opacity-100 shadow-[0_0_8px]" : "opacity-65"}`,
              style: { backgroundColor: c.color || "#ef4444", boxShadow: isSelected ? `0 0 8px ${c.color || "#ef4444"}` : void 0 }
            }
          )
        );
      }),
      dragInfo && /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "absolute top-1 pointer-events-none z-50 px-2 py-0.5 bg-black/90 border border-djcyan-400 rounded shadow-xl text-center transform -translate-x-1/2 flex items-center gap-1.5",
          style: { left: `${Math.min(92, Math.max(8, dragInfo.pct))}%` }
        },
        /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full", style: { backgroundColor: activeCues[dragInfo.idx]?.color || "#ef4444" } }),
        /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono font-bold text-white" }, "Pad ", activeCues[dragInfo.idx]?.id || dragInfo.idx + 1, ":"),
        /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono font-bold text-djcyan-400" }, dragInfo.time),
        /* @__PURE__ */ React.createElement("span", { className: "text-[8px] font-mono text-gray-300" }, "(", dragInfo.bar, ")"),
        snapToGrid && /* @__PURE__ */ React.createElement("span", { className: "text-[7px] font-bold text-emerald-400 uppercase bg-emerald-950/80 px-1 rounded" }, "Snap")
      )
    ));
  };
  var CompactHotCuesSummary = ({ track, cues = NV2_COLORS, onOpenStudio, onSelectCue, selectedCueId = 1, t = (k) => k }) => {
    const activeCues = Array.from({ length: 8 }, (_, idx) => {
      const padNum = idx + 1;
      const existing = cues && cues[idx] ? cues[idx] : null;
      const defaultPreset = NV2_COLORS[idx] || { id: padNum, name: `Cue ${padNum}`, color: "#06b6d4", time: "00:00.00" };
      if (existing) {
        return {
          ...defaultPreset,
          ...existing,
          id: padNum,
          color: existing.color || defaultPreset.color
        };
      }
      return defaultPreset;
    });
    return /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950/90 border border-djzinc-800 rounded-lg p-2.5 flex flex-col gap-2 shadow-md" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800 pb-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-djcyan-400 shadow-[0_0_6px_#06b6d4]" }), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-djcyan-300 uppercase tracking-wider font-mono" }, "8 Hot Cues (Resumen)")), onOpenStudio && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onOpenStudio,
        className: "px-2 py-0.5 text-[9px] font-mono font-bold bg-djcyan-500/20 hover:bg-djcyan-500 text-djcyan-300 hover:text-black rounded border border-djcyan-500/40 cursor-pointer shadow transition-all flex items-center gap-1 active:scale-95 group",
        title: "Abrir en el Estudio Completo de Hot Cues con Waveform Ampliado y Scroll Horizontal"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F39B}\uFE0F Abrir Estudio"),
      /* @__PURE__ */ React.createElement("span", { className: "group-hover:translate-x-0.5 transition-transform" }, "\u2192")
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-1.5" }, activeCues.slice(0, 8).map((cue, idx) => {
      const padNum = cue.id !== void 0 ? cue.id : idx + 1;
      const color = cue.color || (NV2_COLORS[idx] ? NV2_COLORS[idx].color : "#06b6d4");
      const isSelected = selectedCueId === padNum;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: idx,
          onClick: () => onSelectCue && onSelectCue(padNum),
          className: `flex items-center justify-between p-1.5 rounded border text-[10px] font-mono cursor-pointer transition-all ${isSelected ? "bg-djzinc-850 border-djcyan-500/80 shadow-[0_0_8px_rgba(6,182,212,0.3)]" : "bg-djzinc-900/60 border-djzinc-800/80 hover:border-djzinc-700 hover:bg-djzinc-850/60"}`
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 truncate" }, /* @__PURE__ */ React.createElement(
          "span",
          {
            className: "w-2.5 h-2.5 rounded-full shrink-0 shadow-sm",
            style: { backgroundColor: color }
          }
        ), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-300 truncate max-w-[70px]" }, "P", padNum, " ", cue.short_name || cue.name || `Cue ${padNum}`)),
        /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-mono text-[9px] shrink-0 font-semibold ml-1" }, cue.time || "00:00.00")
      );
    })));
  };
  var ZoomableRekordboxWaveform = ({
    track,
    cues = NV2_COLORS,
    duration = "06:12",
    onSeekTrack,
    playProgress = 0,
    isCurrentPlaying = false,
    onUpdateCues,
    selectedCueId = 1,
    onSelectCue,
    snapToGrid = true,
    showBeatgrid = true,
    zoom = 4,
    followPlayhead = true,
    height = 160,
    lang = "es"
  }) => {
    const scrollContainerRef = useRef(null);
    const canvasRef = useRef(null);
    const minimapCanvasRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(900);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [draggingCueIdx, setDraggingCueIdx] = useState(null);
    const [dragInfo, setDragInfo] = useState(null);
    const isMinimapDraggingRef = useRef(false);
    const rawId = track && track.id ? String(track.id) : "1";
    const seed = rawId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;
    const durMs = parseDurationMs(duration);
    const bpm = track && (track.bpm || track.b) ? Math.max(30, parseFloat(track.bpm || track.b) || 128) : 128;
    const beatMs = 6e4 / bpm;
    const barMs = beatMs * 4;
    const downbeatMs = track && track.first_downbeat_ms ? parseFloat(track.first_downbeat_ms) : 0;
    const trimMs = track && track.trim_start_ms ? parseFloat(track.trim_start_ms) : 0;
    const activeCues = Array.from({ length: 8 }, (_, idx) => {
      const padNum = idx + 1;
      const existing = cues && cues[idx] ? cues[idx] : null;
      const defaultPreset = NV2_COLORS[idx] || { id: padNum, name: `Cue ${padNum}`, color: "#06b6d4", time: "00:00.00" };
      if (existing) {
        return {
          ...defaultPreset,
          ...existing,
          id: padNum,
          color: existing.color || defaultPreset.color
        };
      }
      return defaultPreset;
    });
    const totalWidth = Math.max(containerWidth, Math.round(containerWidth * Math.max(1, zoom)));
    useEffect(() => {
      const updateWidth = () => {
        if (scrollContainerRef.current) {
          const w = scrollContainerRef.current.clientWidth;
          if (w > 100) setContainerWidth(w);
        }
      };
      updateWidth();
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }, []);
    const handleScroll = (e) => {
      setScrollLeft(e.target.scrollLeft);
    };
    useEffect(() => {
      if (!isCurrentPlaying || !followPlayhead || !scrollContainerRef.current) return;
      const playheadPx = playProgress * totalWidth;
      const targetScroll = playheadPx - containerWidth / 2;
      scrollContainerRef.current.scrollLeft = Math.max(0, Math.min(totalWidth - containerWidth, targetScroll));
    }, [isCurrentPlaying, followPlayhead, playProgress, totalWidth, containerWidth]);
    const handleCueMouseDown = (e, idx) => {
      e.stopPropagation();
      e.preventDefault();
      setDraggingCueIdx(idx);
      if (onSelectCue && activeCues[idx]) {
        onSelectCue(activeCues[idx].id !== void 0 ? activeCues[idx].id : idx + 1);
      }
    };
    useEffect(() => {
      if (draggingCueIdx === null) return;
      const handleMouseMove = (e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawPct = Math.max(0, Math.min(1, rawX / totalWidth));
        const rawMs = rawPct * durMs;
        let finalMs = rawMs;
        if (snapToGrid) {
          const beatOffset = Math.round((rawMs - downbeatMs) / beatMs);
          finalMs = Math.max(0, Math.min(durMs, downbeatMs + beatOffset * beatMs));
        }
        const finalPct = durMs > 0 ? finalMs / durMs : 0;
        const timeStr = formatMsToTime(finalMs);
        const barNum = Math.max(1, Math.floor((finalMs - downbeatMs) / barMs) + 1);
        const beatNum = Math.floor(Math.max(0, (finalMs - downbeatMs) % barMs) / beatMs) + 1;
        const barStr = `Bar ${barNum}.${beatNum}`;
        setDragInfo({
          idx: draggingCueIdx,
          pct: finalPct * 100,
          time: timeStr,
          bar: barStr,
          posMs: Math.round(finalMs)
        });
        if (onUpdateCues) {
          const updated = activeCues.map((c, i) => {
            if (i === draggingCueIdx) {
              return {
                ...c,
                pct: finalPct,
                pos_ms: Math.round(finalMs),
                time: timeStr,
                bar: barNum,
                bar_str: `Bar ${barNum}`
              };
            }
            return c;
          });
          onUpdateCues(updated);
        }
      };
      const handleMouseUp = () => {
        setDraggingCueIdx(null);
        setDragInfo(null);
      };
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [draggingCueIdx, durMs, downbeatMs, beatMs, barMs, snapToGrid, activeCues, onUpdateCues, totalWidth]);
    const handleCanvasClick = (e) => {
      if (!canvasRef.current || !onSeekTrack || draggingCueIdx !== null) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, rawX / totalWidth));
      onSeekTrack(track, pct, true);
    };
    useEffect(() => {
      const canvas = minimapCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      const mWidth = containerWidth;
      const mHeight = 28;
      canvas.width = mWidth * dpr;
      canvas.height = mHeight * dpr;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#07070b";
      ctx.fillRect(0, 0, mWidth, mHeight);
      const mCenterY = mHeight / 2;
      for (let x = 0; x <= mWidth; x += 2) {
        const xNorm = x / mWidth;
        const { bass, drums, isBreak } = computeTrackStructuralBands(xNorm, seed);
        const h = mHeight * 0.42 * Math.max(0.1, (bass + drums) * 0.7);
        ctx.fillStyle = isBreak ? "rgba(16, 185, 129, 0.4)" : "rgba(6, 182, 212, 0.75)";
        ctx.fillRect(x, mCenterY - h, 1.8, h * 2);
      }
      activeCues.slice(0, 8).forEach((cue, idx) => {
        const pct = cue.pct !== void 0 ? cue.pct : parseTimeToMs(cue.time || "0") / durMs;
        const cx = Math.max(0, Math.min(mWidth, pct * mWidth));
        const color = cue.color || (NV2_COLORS[idx] ? NV2_COLORS[idx].color : "#06b6d4");
        ctx.fillStyle = color;
        ctx.fillRect(cx - 1, 0, 2, mHeight);
      });
    }, [containerWidth, seed, durMs, activeCues]);
    const handleMinimapInteraction = (e) => {
      if (!minimapCanvasRef.current || !scrollContainerRef.current) return;
      const rect = minimapCanvasRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const pct = clickX / rect.width;
      const targetScroll = pct * totalWidth - containerWidth / 2;
      scrollContainerRef.current.scrollLeft = Math.max(0, Math.min(totalWidth - containerWidth, targetScroll));
    };
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      canvas.width = totalWidth * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#030306";
      ctx.fillRect(0, 0, totalWidth, height);
      const centerY = height / 2;
      if (showBeatgrid && bpm >= 40) {
        for (let t = downbeatMs; t <= durMs; t += beatMs) {
          const bx = t / durMs * totalWidth;
          if (bx < 0 || bx > totalWidth) continue;
          const bIdx = Math.round((t - downbeatMs) / beatMs);
          const isBar = bIdx % 4 === 0;
          const barNum = Math.floor(bIdx / 4) + 1;
          const isPhrase16 = bIdx % 16 === 0;
          ctx.beginPath();
          if (isPhrase16) {
            ctx.strokeStyle = "rgba(6, 182, 212, 0.75)";
            ctx.lineWidth = 1.5;
          } else if (isBar) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
            ctx.lineWidth = 1;
          } else {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.10)";
            ctx.lineWidth = 0.75;
          }
          ctx.moveTo(bx, 0);
          ctx.lineTo(bx, height);
          ctx.stroke();
          if (isPhrase16) {
            ctx.fillStyle = "#06b6d4";
            ctx.fillRect(bx - 1, 0, 2.5, 10);
            ctx.font = "bold 9px monospace";
            ctx.fillText(`P${barNum}`, bx + 3, 11);
          } else if (isBar && zoom >= 2) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.fillRect(bx - 0.5, 0, 1.5, 6);
            if (zoom >= 4) {
              ctx.font = "8px monospace";
              ctx.fillText(`${barNum}`, bx + 2, 8);
            }
          }
        }
        for (let t = downbeatMs - beatMs; t >= 0; t -= beatMs) {
          const bx = t / durMs * totalWidth;
          if (bx < 0 || bx > totalWidth) continue;
          const bIdx = Math.round((t - downbeatMs) / beatMs);
          const isBar = bIdx % 4 === 0;
          ctx.beginPath();
          ctx.strokeStyle = isBar ? "rgba(255, 255, 255, 0.20)" : "rgba(255, 255, 255, 0.08)";
          ctx.lineWidth = isBar ? 1 : 0.75;
          ctx.moveTo(bx, 0);
          ctx.lineTo(bx, height);
          ctx.stroke();
        }
      }
      for (let x = 0; x <= totalWidth; x += 1.5) {
        const xNorm = x / totalWidth;
        const { bass, drums, vocals, treble, isBreak } = computeTrackStructuralBands(xNorm, seed);
        if (isBreak) {
          ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
          ctx.fillRect(x, 0, 1.5, height);
        }
        const hBass = height * 0.44 * bass;
        ctx.fillStyle = isBreak ? "rgba(30, 58, 138, 0.25)" : "rgba(37, 99, 235, 0.88)";
        ctx.fillRect(x, centerY - hBass, 1.5, hBass * 2);
        const hDrums = height * 0.38 * drums;
        ctx.fillStyle = isBreak ? "rgba(153, 27, 27, 0.2)" : "rgba(239, 68, 68, 0.85)";
        ctx.fillRect(x, centerY - hDrums, 1.5, hDrums * 2);
        const hVocals = height * 0.3 * vocals;
        ctx.fillStyle = isBreak ? "rgba(217, 119, 6, 0.85)" : "rgba(234, 179, 8, 0.88)";
        ctx.fillRect(x, centerY - hVocals, 1.5, hVocals * 2);
        const hTreble = height * 0.2 * treble;
        ctx.fillStyle = isBreak ? "rgba(52, 211, 153, 0.6)" : "rgba(6, 182, 212, 0.95)";
        ctx.fillRect(x, centerY - hTreble, 1.5, hTreble * 2);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.20)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(totalWidth, centerY);
      ctx.stroke();
    }, [totalWidth, height, showBeatgrid, bpm, downbeatMs, durMs, beatMs, barMs, seed, zoom]);
    const viewportLeftPct = totalWidth > 0 ? scrollLeft / totalWidth * 100 : 0;
    const viewportWidthPct = totalWidth > 0 ? Math.min(100, containerWidth / totalWidth * 100) : 100;
    const downbeatPct = downbeatMs > 0 ? downbeatMs / durMs * 100 : null;
    return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1.5 w-full select-none" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "w-full relative h-7 bg-[#07070b] border border-djzinc-800 rounded overflow-hidden cursor-pointer shadow-inner",
        onClick: handleMinimapInteraction,
        onMouseDown: () => {
          isMinimapDraggingRef.current = true;
        },
        onMouseMove: (e) => {
          if (isMinimapDraggingRef.current) handleMinimapInteraction(e);
        },
        onMouseUp: () => {
          isMinimapDraggingRef.current = false;
        },
        onMouseLeave: () => {
          isMinimapDraggingRef.current = false;
        },
        title: "Minimapa de la pista completa. Haz clic o arrastra para desplazarte r\xE1pidamente."
      },
      /* @__PURE__ */ React.createElement("canvas", { ref: minimapCanvasRef, className: "w-full h-full block" }),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: { left: `${viewportLeftPct}%`, width: `${viewportWidthPct}%` },
          className: "absolute top-0 bottom-0 border-2 border-djcyan-400 bg-djcyan-500/20 backdrop-blur-[1px] pointer-events-none rounded shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-75"
        }
      ),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: { left: `${playProgress * 100}%` },
          className: "absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none z-10 shadow-[0_0_5px_#fff]"
        }
      )
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: scrollContainerRef,
        onScroll: handleScroll,
        className: "w-full overflow-x-auto overflow-y-hidden relative select-none custom-scrollbar rounded-lg border border-djzinc-800 bg-[#030306] shadow-xl",
        style: { height: `${height}px` }
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: { width: `${totalWidth}px`, height: `${height}px`, position: "relative" },
          onClick: handleCanvasClick
        },
        /* @__PURE__ */ React.createElement(
          "canvas",
          {
            ref: canvasRef,
            className: "block cursor-crosshair",
            style: { width: `${totalWidth}px`, height: `${height}px` }
          }
        ),
        downbeatPct !== null && /* @__PURE__ */ React.createElement(
          "div",
          {
            style: { left: `${downbeatPct}%` },
            className: "absolute top-0 bottom-0 pointer-events-none z-15 flex flex-col items-center"
          },
          /* @__PURE__ */ React.createElement("div", { className: "w-[1.5px] h-full bg-djcyan-400 shadow-[0_0_8px_#06b6d4]" }),
          /* @__PURE__ */ React.createElement("div", { className: "absolute top-1 -translate-x-1/2 bg-djcyan-500 text-black font-mono font-bold text-[8px] px-1 py-0.5 rounded shadow" }, "1.0.0")
        ),
        /* @__PURE__ */ React.createElement(
          "div",
          {
            style: { left: `${playProgress * 100}%` },
            className: "absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_12px_#fff,0_0_5px_#06b6d4] pointer-events-none z-20 flex flex-col items-center"
          },
          /* @__PURE__ */ React.createElement("div", { className: "w-2.5 h-2.5 -ml-[1px] bg-white rotate-45 border border-djcyan-400 shadow-[0_0_6px_#06b6d4]" })
        ),
        activeCues.map((cue, idx) => {
          const padNum = cue.id !== void 0 ? cue.id : idx + 1;
          const cuePct = cue.pct !== void 0 ? cue.pct * 100 : parseTimeToMs(cue.time || "0") / durMs * 100;
          const isSelected = selectedCueId === padNum;
          const color = cue.color || (NV2_COLORS[idx] ? NV2_COLORS[idx].color : "#ef4444");
          const staggerDelay = `${idx * 110}ms`;
          return /* @__PURE__ */ React.createElement(
            "div",
            {
              key: `${track?.id || "trk"}_wave_cue_${idx}`,
              style: {
                left: `${cuePct}%`,
                animation: "cuePointCascadeBeam 0.65s cubic-bezier(0.16, 1, 0.3, 1) both",
                animationDelay: staggerDelay,
                "--cue-color": color
              },
              onMouseDown: (e) => handleCueMouseDown(e, idx),
              onClick: (e) => {
                e.stopPropagation();
                if (onSelectCue) onSelectCue(padNum);
              },
              className: `absolute top-0 bottom-0 z-20 flex flex-col items-center cursor-ew-resize group select-none transition-transform duration-75`,
              title: `Hot Cue ${padNum}: ${cue.name || "Cue"} (${cue.time || "00:00.00"}) - Arrastra para mover`
            },
            /* @__PURE__ */ React.createElement(
              "div",
              {
                className: `w-[2px] h-full transition-all ${isSelected ? "w-[2.5px]" : "opacity-85 group-hover:opacity-100"}`,
                style: {
                  backgroundColor: color,
                  color,
                  boxShadow: isSelected ? `0 0 16px ${color}, 0 0 6px #ffffff` : `0 0 8px ${color}80`
                }
              }
            ),
            /* @__PURE__ */ React.createElement(
              "div",
              {
                className: `absolute top-1 -translate-x-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-full font-mono text-[9px] font-bold text-white shadow-lg border cursor-ew-resize transition-all ${isSelected ? "scale-110 ring-2 ring-white shadow-[0_0_14px_rgba(255,255,255,0.9)]" : "opacity-90 group-hover:scale-105 group-hover:opacity-100"}`,
                style: {
                  backgroundColor: color,
                  borderColor: isSelected ? "#ffffff" : "rgba(255,255,255,0.4)",
                  boxShadow: `0 0 10px ${color}`
                }
              },
              /* @__PURE__ */ React.createElement("span", null, "P", padNum),
              zoom >= 2 && /* @__PURE__ */ React.createElement("span", { className: "text-[8px] opacity-90 truncate max-w-[50px]" }, cue.short_name || cue.name || "")
            ),
            /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-1 -translate-x-1/2 bg-black/85 px-1 py-0.2 rounded border border-djzinc-700 text-[8px] font-mono text-gray-300 pointer-events-none whitespace-nowrap shadow" }, cue.time || "00:00.00")
          );
        }),
        dragInfo && /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "absolute -top-7 -translate-x-1/2 bg-djzinc-900 text-white px-2 py-0.5 rounded border border-djcyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center gap-1.5 pointer-events-none z-30 whitespace-nowrap",
            style: { left: `${Math.min(92, Math.max(8, dragInfo.pct))}%` }
          },
          /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full", style: { backgroundColor: activeCues[dragInfo.idx]?.color || "#ef4444" } }),
          /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono font-bold text-white" }, "Pad ", activeCues[dragInfo.idx]?.id || dragInfo.idx + 1, ":"),
          /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono font-bold text-djcyan-400" }, dragInfo.time),
          /* @__PURE__ */ React.createElement("span", { className: "text-[8px] font-mono text-gray-300" }, "(", dragInfo.bar, ")"),
          snapToGrid && /* @__PURE__ */ React.createElement("span", { className: "text-[7px] font-bold text-emerald-400 uppercase bg-emerald-950/80 px-1 rounded" }, "Snap")
        )
      )
    ));
  };
  var HotCueStudioModal = ({
    isOpen,
    onClose,
    track,
    cues = NV2_COLORS,
    duration = "05:00",
    onUpdateCues,
    selectedCueId = 1,
    onSelectCue,
    onPlayTrack,
    nowPlayingTrack,
    isPlaying = false,
    onTogglePlay,
    playProgress = 0,
    onGuardarTrack,
    saveFeedback = "",
    onAutoPhraseCues
  }) => {
    if (!isOpen || !track) return null;
    const activeCues = Array.from({ length: 8 }, (_, idx) => {
      const padNum = idx + 1;
      const existing = cues && cues[idx] ? cues[idx] : null;
      const defaultPreset = NV2_COLORS[idx] || { id: padNum, name: `Cue ${padNum}`, color: "#06b6d4", time: "00:00.00" };
      if (existing) {
        return {
          ...defaultPreset,
          ...existing,
          id: padNum,
          color: existing.color || defaultPreset.color
        };
      }
      return defaultPreset;
    });
    const currentCue = activeCues.find((c) => (c.id || 1) === selectedCueId) || activeCues[0] || {};
    const durMs = parseDurationMs(duration);
    const bpm = track && (track.bpm || track.b) ? Math.max(30, parseFloat(track.bpm || track.b) || 128) : 128;
    const beatMs = 6e4 / bpm;
    const barMs = beatMs * 4;
    const downbeatMs = track && track.first_downbeat_ms ? parseFloat(track.first_downbeat_ms) : 0;
    const trimMs = track && track.trim_start_ms ? parseFloat(track.trim_start_ms) : 0;
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [showBeatgrid, setShowBeatgrid] = useState(true);
    const [timeInputValue, setTimeInputValue] = useState(currentCue.time || "00:00.00");
    const [nameInputValue, setNameInputValue] = useState(currentCue.name || "");
    const [isSavingLocal, setIsSavingLocal] = useState(false);
    const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
    useEffect(() => {
      setTimeInputValue(currentCue.time || "00:00.00");
      setNameInputValue(currentCue.name || currentCue.short_name || `Cue ${currentCue.id || 1}`);
    }, [selectedCueId, currentCue.time, currentCue.name]);
    const updateSingleCue = (updatedFields) => {
      if (!onUpdateCues) return;
      const targetId = currentCue.id || 1;
      const newCues = activeCues.map((c, idx) => {
        const cid = c.id !== void 0 ? c.id : idx + 1;
        if (cid === targetId) {
          return { ...c, ...updatedFields };
        }
        return c;
      });
      onUpdateCues(newCues);
    };
    const handleTimeInputChange = (e) => {
      const val = e.target.value;
      setTimeInputValue(val);
      const ms = parseTimeToMs(val);
      const newPct = durMs > 0 ? Math.max(0, Math.min(1, ms / durMs)) : 0;
      const barNum = Math.max(1, Math.floor((ms - downbeatMs) / barMs) + 1);
      updateSingleCue({
        time: val,
        pos_ms: Math.round(ms),
        pct: newPct,
        bar: barNum,
        bar_str: `Bar ${barNum}`
      });
    };
    const handleNudge = (deltaMs) => {
      const curMs = currentCue.pos_ms !== void 0 ? currentCue.pos_ms : parseTimeToMs(currentCue.time || "00:00.00");
      const nextMs = Math.max(0, Math.min(durMs, curMs + deltaMs));
      const newPct = durMs > 0 ? nextMs / durMs : 0;
      const formattedTime = formatMsToTime(nextMs);
      const barNum = Math.max(1, Math.floor((nextMs - downbeatMs) / barMs) + 1);
      setTimeInputValue(formattedTime);
      updateSingleCue({
        pos_ms: Math.round(nextMs),
        time: formattedTime,
        pct: newPct,
        bar: barNum,
        bar_str: `Bar ${barNum}`
      });
    };
    const handleSnapCurrentCue = () => {
      const curMs = currentCue.pos_ms !== void 0 ? currentCue.pos_ms : parseTimeToMs(currentCue.time || "00:00.00");
      const beatOffset = Math.round((curMs - downbeatMs) / beatMs);
      const snappedMs = Math.max(0, Math.min(durMs, downbeatMs + beatOffset * beatMs));
      const newPct = durMs > 0 ? snappedMs / durMs : 0;
      const formattedTime = formatMsToTime(snappedMs);
      const barNum = Math.max(1, Math.floor((snappedMs - downbeatMs) / barMs) + 1);
      setTimeInputValue(formattedTime);
      updateSingleCue({
        pos_ms: Math.round(snappedMs),
        time: formattedTime,
        pct: newPct,
        bar: barNum,
        bar_str: `Bar ${barNum}`
      });
    };
    const handleSetToPlayhead = () => {
      const playheadMs = Math.max(0, Math.min(durMs, playProgress * durMs));
      let targetMs = playheadMs;
      if (snapToGrid) {
        const beatOffset = Math.round((playheadMs - downbeatMs) / beatMs);
        targetMs = Math.max(0, Math.min(durMs, downbeatMs + beatOffset * beatMs));
      }
      const newPct = durMs > 0 ? targetMs / durMs : 0;
      const formattedTime = formatMsToTime(targetMs);
      const barNum = Math.max(1, Math.floor((targetMs - downbeatMs) / barMs) + 1);
      setTimeInputValue(formattedTime);
      updateSingleCue({
        pos_ms: Math.round(targetMs),
        time: formattedTime,
        pct: newPct,
        bar: barNum,
        bar_str: `Bar ${barNum}`
      });
    };
    const handleSaveTrackInternal = async () => {
      setIsSavingLocal(true);
      try {
        if (onGuardarTrack) {
          await onGuardarTrack();
          setSaveSuccessMsg("\u2713 Guardado en disco con \xE9xito");
          setTimeout(() => setSaveSuccessMsg(""), 3500);
        }
      } finally {
        setIsSavingLocal(false);
      }
    };
    const handlePreviousCue = () => {
      const currentIdx = activeCues.findIndex((c) => (c.id || 1) === (currentCue.id || 1));
      const prevIdx = currentIdx > 0 ? currentIdx - 1 : activeCues.length - 1;
      const targetCue = activeCues[prevIdx];
      if (targetCue && onSelectCue) {
        onSelectCue(targetCue.id || prevIdx + 1);
        if (onPlayTrack) onPlayTrack(track, targetCue.pct !== void 0 ? targetCue.pct : 0, true);
      }
    };
    const handleNextCue = () => {
      const currentIdx = activeCues.findIndex((c) => (c.id || 1) === (currentCue.id || 1));
      const nextIdx = currentIdx < activeCues.length - 1 ? currentIdx + 1 : 0;
      const targetCue = activeCues[nextIdx];
      if (targetCue && onSelectCue) {
        onSelectCue(targetCue.id || nextIdx + 1);
        if (onPlayTrack) onPlayTrack(track, targetCue.pct !== void 0 ? targetCue.pct : 0, true);
      }
    };
    const isThisTrackPlaying = isPlaying && nowPlayingTrack && (String(nowPlayingTrack.id) === String(track.id) || nowPlayingTrack.path === track.path || nowPlayingTrack.f === track.f);
    return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-6xl max-h-[95vh] bg-[#09090e] border border-djcyan-500/40 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden text-gray-200" }, /* @__PURE__ */ React.createElement("div", { className: "px-5 py-3.5 bg-djzinc-950 border-b border-djzinc-800 flex items-center justify-between shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 min-w-0" }, /* @__PURE__ */ React.createElement(
      "img",
      {
        src: getValidCover(track.cover || (track.path ? `/cover?path=${encodeURIComponent(track.path)}` : null)),
        alt: "Cover",
        className: "w-12 h-12 rounded border border-djzinc-700 object-cover shrink-0 shadow"
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("h3", { className: "font-extrabold text-sm sm:text-base text-white truncate max-w-md", title: track.t || track.title }, track.t || track.title || "Pista de Audio"), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-djcyan-950 text-djcyan-400 border border-djcyan-800" }, track.format || "FLAC"), /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800" }, track.k || track.key || "8A")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 truncate max-w-sm" }, track.a || track.artist || "--", " \u2022 ", /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 font-mono" }, track.album || "--")))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, saveSuccessMsg ? /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono font-bold text-djgreen-400 bg-djgreen-950/80 px-3 py-1 rounded border border-djgreen-700 animate-pulse" }, saveSuccessMsg) : saveFeedback ? /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono font-bold text-djgreen-400 bg-djgreen-950/80 px-3 py-1 rounded border border-djgreen-700 animate-pulse" }, saveFeedback) : null, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleSaveTrackInternal,
        disabled: isSavingLocal,
        className: "flex items-center gap-1.5 px-3 py-1.5 bg-djgreen-950 hover:bg-djgreen-900 text-djgreen-400 hover:text-white border border-djgreen-700/80 rounded-lg font-mono font-bold text-xs cursor-pointer shadow-lg active:scale-95 transition-all",
        title: "Guardar metadatos, tags y cues directamente en el archivo en disco"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4BE}"),
      /* @__PURE__ */ React.createElement("span", null, isSavingLocal ? "Guardando..." : "Guardar Pista en Disco")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onClose,
        className: "w-8 h-8 rounded-lg bg-djzinc-900 hover:bg-djzinc-800 text-gray-400 hover:text-white flex items-center justify-center font-bold text-sm border border-djzinc-750 transition-colors cursor-pointer",
        title: "Cerrar estudio"
      },
      "\u2715"
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-4 sm:p-5 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-djzinc-950/90 rounded-lg border border-djzinc-800 flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          if (isThisTrackPlaying) {
            onTogglePlay && onTogglePlay();
          } else {
            onPlayTrack && onPlayTrack(track, 0, true);
          }
        },
        className: "px-4 py-2 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-black text-xs rounded-lg shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
      },
      isThisTrackPlaying ? "\u275A\u275A PAUSAR" : "\u25B6 REPRODUCIR"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handlePreviousCue,
        className: "px-2.5 py-1.5 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 font-mono text-xs rounded border border-djzinc-750 cursor-pointer shadow transition-colors",
        title: "Saltar al Cue anterior"
      },
      "\u23EE Cue Anterior"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleNextCue,
        className: "px-2.5 py-1.5 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 font-mono text-xs rounded border border-djzinc-750 cursor-pointer shadow transition-colors",
        title: "Saltar al siguiente Cue"
      },
      "Siguiente Cue \u23ED"
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 text-xs font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#050508] px-3 py-1.5 rounded border border-djzinc-800 flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "Posici\xF3n:"), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold" }, formatMsToTime(playProgress * durMs)), /* @__PURE__ */ React.createElement("span", { className: "text-gray-600" }, "/"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-300" }, duration)), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleSetToPlayhead,
        className: "px-3 py-1.5 bg-djcyan-950 hover:bg-djcyan-900 text-djcyan-400 border border-djcyan-700/60 rounded font-mono font-bold text-xs cursor-pointer shadow active:scale-95 transition-all",
        title: "Fijar el cue seleccionado exactamente en la posici\xF3n actual del playhead"
      },
      "\u{1F4CD} Posicionar Pad ",
      currentCue.id || 1,
      " en Playhead"
    ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
      RekordboxWaveform,
      {
        track,
        cues: activeCues,
        duration,
        onSeekTrack: onPlayTrack,
        playProgress: isThisTrackPlaying ? playProgress : 0,
        isCurrentPlaying: isThisTrackPlaying,
        onUpdateCues,
        selectedCueId,
        onSelectCue,
        snapToGrid,
        showBeatgrid,
        onToggleSnap: () => setSnapToGrid((prev) => !prev),
        onToggleGrid: () => setShowBeatgrid((prev) => !prev)
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "bg-[#05050a] p-3 rounded-lg border border-djzinc-800 space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-xs font-mono font-bold" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-300 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F3A8}"), /* @__PURE__ */ React.createElement("span", null, "C\xD3DIGOS DE COLOR DE FORMA DE ONDA & BANDA ESPECTRAL")), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500" }, "Pioneer DJ RGB Multi-Frequency Standard")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono" }, WAVEFORM_COLOR_LEGEND.map((stem) => /* @__PURE__ */ React.createElement("div", { key: stem.name, className: "flex items-center gap-2 p-2 rounded bg-djzinc-900/80 border border-djzinc-800", title: stem.desc }, /* @__PURE__ */ React.createElement("span", { className: "w-3.5 h-3.5 rounded-full shrink-0 shadow-md", style: { backgroundColor: stem.color } }), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: `font-bold block truncate ${stem.text}` }, stem.name), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 text-[10px]" }, stem.hex, " \u2022 ", stem.desc)))))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-xs font-mono px-1" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-300 uppercase" }, "8 HOT CUES PERFORMANCE (Pioneer DJ / Numark NV2)"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 text-[11px]" }, "Clic en Pad para seleccionar y editar \u2022 Bot\xF3n \u25B6 para pre-escucha instant\xE1nea")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2.5" }, activeCues.map((c, idx) => {
      const cueId = c.id !== void 0 ? c.id : idx + 1;
      const isSelected = selectedCueId === cueId;
      const cuePct = c.pct !== void 0 ? c.pct : idx * 0.12 + 0.02;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: cueId,
          onClick: () => onSelectCue && onSelectCue(cueId),
          className: `p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all select-none shadow-md ${isSelected ? "bg-djzinc-800 border-djcyan-400 ring-2 ring-djcyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]" : `${c.bg || "bg-djzinc-900"} ${c.border || "border-djzinc-750"} hover:border-gray-500 hover:scale-[1.01]`}`
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(
          "span",
          {
            className: "text-[10px] font-mono font-black px-2 py-0.5 rounded text-black shadow",
            style: { backgroundColor: c.color || "#ef4444" }
          },
          "PAD ",
          cueId
        ), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono font-semibold text-gray-400" }, c.color || "#ef4444")), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: (e) => {
              e.stopPropagation();
              if (onPlayTrack) onPlayTrack(track, cuePct, true);
            },
            className: "w-6 h-6 rounded-md bg-djzinc-950 hover:bg-djcyan-500 hover:text-black text-djcyan-400 flex items-center justify-center text-xs font-bold border border-djzinc-700 transition-colors shadow",
            title: `Reproducir desde ${c.time || "00:00.0"}`
          },
          "\u25B6"
        )),
        /* @__PURE__ */ React.createElement("span", { className: `text-xs font-bold truncate ${c.text || "text-gray-100"}` }, c.short_name || c.name || `Cue ${cueId}`),
        /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-[10px] font-mono text-gray-400 mt-2 pt-1.5 border-t border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-200 font-bold" }, c.time || "00:00.0"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, c.bar_str || `Bar ${c.bar || idx * 16 + 1}`))
      );
    }))), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-4 rounded-xl border border-djcyan-500/30 space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap justify-between items-center border-b border-djzinc-850 pb-2.5 gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "span",
      {
        className: "px-2.5 py-1 rounded text-xs font-black font-mono text-black shadow-md",
        style: { backgroundColor: currentCue.color || "#ef4444" }
      },
      "PAD ",
      currentCue.id || 1
    ), /* @__PURE__ */ React.createElement("span", { className: "font-extrabold text-white text-sm" }, "Editando: ", /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400" }, currentCue.name || `Cue ${currentCue.id || 1}`)), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-gray-400" }, "(", currentCue.color || "#ef4444", ")")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleSetToPlayhead,
        className: "px-2.5 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-200 text-xs font-mono rounded border border-djzinc-700 cursor-pointer shadow active:scale-95 transition-colors",
        title: "Mover este cue a la posici\xF3n actual de reproducci\xF3n"
      },
      "\u{1F4CD} Fijar en Playhead"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleSnapCurrentCue,
        className: "px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 text-xs font-mono rounded border border-emerald-800 cursor-pointer shadow active:scale-95 transition-colors",
        title: "Alinear al beatgrid m\xE1s pr\xF3ximo"
      },
      "\u{1F9F2} Snap a Beat"
    ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-xs font-mono text-gray-400 mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-gray-300" }, "TIEMPO EXACTO (mm:ss.ms)"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 font-mono" }, currentCue.pos_ms || 0, " ms")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: timeInputValue,
        onChange: handleTimeInputChange,
        placeholder: "00:00.00",
        className: "w-full bg-[#050508] border border-djzinc-700 focus:border-djcyan-400 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-djcyan-300 outline-none"
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const cuePct = currentCue.pct !== void 0 ? currentCue.pct : 0;
          if (onPlayTrack) onPlayTrack(track, cuePct, true);
        },
        className: "px-3 py-1.5 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-bold text-xs rounded-lg cursor-pointer shadow shrink-0",
        title: "Audicionar este punto de cue"
      },
      "\u25B6"
    ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-xs font-mono text-gray-400 mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-gray-300" }, "NOMBRE DEL CUE / FRASE"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, currentCue.bar_str || "Bar 1")), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: nameInputValue,
        onChange: (e) => {
          setNameInputValue(e.target.value);
          updateSingleCue({ name: e.target.value, short_name: e.target.value });
        },
        placeholder: "Nombre t\xE1ctico del cue...",
        className: "w-full bg-[#050508] border border-djzinc-700 focus:border-djcyan-400 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-200 outline-none"
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-djzinc-850" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 text-xs font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 mr-1" }, "Micro-Ajuste:"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleNudge(-barMs),
        className: "px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95",
        title: "Retroceder 1 comp\xE1s (4 beats)"
      },
      "\u25C0\u25C0 -1 Comp\xE1s"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleNudge(-beatMs),
        className: "px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95",
        title: "Retroceder 1 beat"
      },
      "\u25C0 -1 Beat"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleNudge(-10),
        className: "px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95",
        title: "Retroceder 10ms"
      },
      "-10ms"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleNudge(10),
        className: "px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95",
        title: "Avanzar 10ms"
      },
      "+10ms"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleNudge(beatMs),
        className: "px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95",
        title: "Avanzar 1 beat"
      },
      "+1 Beat \u25B6"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleNudge(barMs),
        className: "px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95",
        title: "Avanzar 1 comp\xE1s (4 beats)"
      },
      "+1 Comp\xE1s \u25B6\u25B6"
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 text-[10px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 mr-1" }, "Presets:"), ["Kick", "Hi-Hats", "Bass", "Break", "Drop 1", "Drop 2", "Outro"].map((p) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: p,
        type: "button",
        onClick: () => {
          setNameInputValue(p);
          updateSingleCue({ name: p, short_name: p });
        },
        className: "px-1.5 py-0.5 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-750 cursor-pointer transition-colors"
      },
      p
    )))), /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-djzinc-850" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-xs font-mono text-gray-400 mb-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-gray-300" }, "ASIGNAR COLOR DE PAD (PIONEER DJ / NUMARK RGB)"), /* @__PURE__ */ React.createElement("span", null, "Actual: ", /* @__PURE__ */ React.createElement("span", { className: "font-mono text-white font-bold" }, currentCue.color || "#ef4444"))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, DJ_PAD_PALETTE.map((pal) => {
      const isCurrentColor = (currentCue.color || "#ef4444").toLowerCase() === pal.color.toLowerCase();
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: pal.color,
          type: "button",
          onClick: () => {
            updateSingleCue({
              color: pal.color,
              hex: pal.hex,
              rgb: pal.rgb,
              text: pal.text,
              border: pal.border,
              bg: pal.bg
            });
          },
          className: `px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-2 border transition-all cursor-pointer ${isCurrentColor ? "ring-2 ring-white border-white scale-105 shadow-md bg-djzinc-800" : "bg-djzinc-900 border-djzinc-750 hover:border-gray-500"}`,
          title: `${pal.name} \u2022 ${pal.hex}`
        },
        /* @__PURE__ */ React.createElement("span", { className: "w-3 h-3 rounded-full shadow", style: { backgroundColor: pal.color } }),
        /* @__PURE__ */ React.createElement("span", { className: "text-gray-200" }, pal.hex)
      );
    }))))), /* @__PURE__ */ React.createElement("div", { className: "px-5 py-3.5 bg-djzinc-950 border-t border-djzinc-800 flex items-center justify-between shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-gray-400 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-djcyan-400" }), "Estudio sincronizado con Serato Markers2 & BeatGrid oficial."), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onClose,
        className: "px-4 py-2 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 font-mono text-xs rounded-lg border border-djzinc-750 cursor-pointer transition-colors"
      },
      "Cerrar"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleSaveTrackInternal,
        disabled: isSavingLocal,
        className: "px-4 py-2 bg-djgreen-950 hover:bg-djgreen-900 text-djgreen-400 hover:text-white border border-djgreen-700/80 rounded-lg font-mono font-bold text-xs cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4BE}"),
      /* @__PURE__ */ React.createElement("span", null, isSavingLocal ? "Guardando en Archivo..." : "Guardar Pista en Fichero")
    )))));
  };
  var FooterMasterWaveform = ({ track, isPlaying, playProgress = 0, onSeek, cues = NV2_COLORS }) => {
    const canvasRef = useRef(null);
    const rawId = track && track.id ? String(track.id) : "1";
    const seed = rawId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;
    const handleScrub = (e) => {
      if (!canvasRef.current || !onSeek || !track) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      onSeek(pct);
    };
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (!track) {
        const ctx2 = canvas.getContext("2d");
        ctx2.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
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
      for (let x = 0; x <= width; x += 1.5) {
        const xNorm = x / width;
        const { bass, drums, vocals, treble, isBreak } = computeTrackStructuralBands(xNorm, seed);
        if (isBreak) {
          ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
          ctx.fillRect(x, 0, 1.5, height);
        }
        const hBass = height * 0.44 * bass;
        ctx.fillStyle = isBreak ? "rgba(30, 58, 138, 0.20)" : "rgba(37, 99, 235, 0.88)";
        ctx.fillRect(x, centerY - hBass, 1.5, hBass * 2);
        const hDrums = height * 0.32 * drums;
        ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
        ctx.fillRect(x, centerY - hDrums, 1.5, hDrums * 2);
        const hVocals = height * 0.22 * vocals;
        ctx.fillStyle = isBreak ? "rgba(16, 185, 129, 0.95)" : "rgba(245, 158, 11, 0.85)";
        ctx.fillRect(x, centerY - hVocals, 1.5, hVocals * 2);
        const hTreble = height * 0.14 * treble;
        ctx.fillStyle = "rgba(34, 211, 238, 0.95)";
        ctx.fillRect(x, centerY - hTreble, 1.5, hTreble * 2);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
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
    if (!track) {
      return /* @__PURE__ */ React.createElement("div", { className: "flex-1 h-11 bg-[#060609]/70 rounded-lg border border-djzinc-850/80 mx-6 flex items-center justify-center select-none shadow-inner" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-[10px] font-mono text-gray-600 uppercase tracking-widest" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-gray-600" }), /* @__PURE__ */ React.createElement("span", null, "DECK 1 STANDBY \u2022 SIN PISTA CARGADA")));
    }
    return /* @__PURE__ */ React.createElement("div", { onClick: handleScrub, className: "flex-1 h-11 bg-[#060609] rounded-lg border border-djzinc-800/90 relative overflow-hidden group cursor-pointer hover:border-djcyan-500/70 transition-colors shadow-inner flex items-center mx-6" }, /* @__PURE__ */ React.createElement("canvas", { ref: canvasRef, style: { width: "100%", height: "42px", display: "block" } }), cues.map((cue, idx) => {
      const leftPos = cue.pct !== void 0 ? cue.pct * 100 : Math.min(96, Math.max(3, idx * 12.4 + 2.5));
      return /* @__PURE__ */ React.createElement("div", { key: cue.id || idx, className: "absolute top-0 bottom-0 flex flex-col items-center pointer-events-none z-10", style: { left: `${leftPos}%` } }, /* @__PURE__ */ React.createElement("div", { className: "w-3.5 h-3 rounded-b text-[8px] font-mono font-black text-black flex items-center justify-center shadow", style: { backgroundColor: cue.color || "#ef4444" } }, cue.id || idx + 1), /* @__PURE__ */ React.createElement("div", { className: "w-[1px] h-full opacity-50", style: { backgroundColor: cue.color || "#ef4444" } }));
    }));
  };
  var CAMELOT_WHEEL_DATA = {
    "1A": { classical: "G#m", name: "Sol# menor", rel: "1B", up: "2A", down: "12A", color: "#06b6d4" },
    "1B": { classical: "B", name: "Si Mayor", rel: "1A", up: "2B", down: "12B", color: "#38bdf8" },
    "2A": { classical: "D#m", name: "Re# menor", rel: "2B", up: "3A", down: "1A", color: "#0284c7" },
    "2B": { classical: "F#", name: "Fa# Mayor", rel: "2A", up: "3B", down: "1B", color: "#0369a1" },
    "3A": { classical: "A#m", name: "La# menor", rel: "3B", up: "4A", down: "2A", color: "#2563eb" },
    "3B": { classical: "Db", name: "Re\u266D Mayor", rel: "3A", up: "4B", down: "2B", color: "#1d4ed8" },
    "4A": { classical: "Fm", name: "Fa menor", rel: "4B", up: "5A", down: "3A", color: "#4f46e5" },
    "4B": { classical: "Ab", name: "La\u266D Mayor", rel: "4A", up: "5B", down: "3B", color: "#4338ca" },
    "5A": { classical: "Cm", name: "Do menor", rel: "5B", up: "6A", down: "4A", color: "#7c3aed" },
    "5B": { classical: "Eb", name: "Mi\u266D Mayor", rel: "5A", up: "6B", down: "4B", color: "#6d28d9" },
    "6A": { classical: "Gm", name: "Sol menor", rel: "6B", up: "7A", down: "5A", color: "#9333ea" },
    "6B": { classical: "Bb", name: "Si\u266D Mayor", rel: "6A", up: "7B", down: "5B", color: "#7e22ce" },
    "7A": { classical: "Dm", name: "Re menor", rel: "7B", up: "8A", down: "6A", color: "#c026d3" },
    "7B": { classical: "F", name: "Fa Mayor", rel: "7A", up: "8B", down: "6B", color: "#a21caf" },
    "8A": { classical: "Am", name: "La menor", rel: "8B", up: "9A", down: "7A", color: "#db2777" },
    "8B": { classical: "C", name: "Do Mayor", rel: "8A", up: "9B", down: "7B", color: "#be185d" },
    "9A": { classical: "Em", name: "Mi menor", rel: "9B", up: "10A", down: "8A", color: "#e11d48" },
    "9B": { classical: "G", name: "Sol Mayor", rel: "9A", up: "10B", down: "8B", color: "#be123c" },
    "10A": { classical: "Bm", name: "Si menor", rel: "10B", up: "11A", down: "9A", color: "#ea580c" },
    "10B": { classical: "D", name: "Re Mayor", rel: "10A", up: "11B", down: "9B", color: "#c2410c" },
    "11A": { classical: "F#m", name: "Fa# menor", rel: "11B", up: "12A", down: "10A", color: "#d97706" },
    "11B": { classical: "A", name: "La Mayor", rel: "11A", up: "12B", down: "10B", color: "#b45309" },
    "12A": { classical: "C#m", name: "Do# menor", rel: "12B", up: "1A", down: "11A", color: "#16a34a" },
    "12B": { classical: "E", name: "Mi Mayor", rel: "12A", up: "1B", down: "11B", color: "#15803d" }
  };
  var TAXONOMY_TREE = {
    "Hard Techno": [
      "Hard Techno / Schranz (150-160 BPM)",
      "Industrial Hard Techno",
      "Neo-Rave / Hard Dance",
      "Acid Hard Techno"
    ],
    "Techno": [
      "Peak Time / Driving (130-135 BPM)",
      "Raw / Deep / Hypnotic",
      "Melodic Techno",
      "Acid Techno",
      "Dark / Industrial Techno"
    ],
    "House": [
      "Tech House (126-129 BPM)",
      "Afro House",
      "Deep House",
      "Minimal / Deep Tech",
      "Melodic / Progressive House",
      "Bass House"
    ],
    "Trance": [
      "Psy-Trance (138-145 BPM)",
      "Uplifting Trance",
      "Tech Trance",
      "Progressive Trance"
    ],
    "Drum & Bass": [
      "Dancefloor DnB (174 BPM)",
      "Neurofunk",
      "Liquid Drum & Bass",
      "Jump Up"
    ],
    "Electro & Breaks": [
      "Breakbeat",
      "UK Garage / 2-Step",
      "Electro House"
    ],
    "Downtempo & Organic": [
      "Organic House / Downtempo",
      "Electronica / Melodic Ambient",
      "Chillout / Lounge"
    ],
    "Latin & Urban": [
      "Latin House",
      "Guaracha / Tribal",
      "Reggaet\xF3n & RKT"
    ]
  };
  var DJ_GENRES_LIST = Object.keys(TAXONOMY_TREE);
  var DJ_VERSIONS_LIST = [
    "Extended Mix",
    "Intro / Outro",
    "Remix / Club Mix",
    "Mashup / Bootleg",
    "Transition",
    "Acapella / DIY",
    "Short Edit / Radio"
  ];
  var AI_PROMPT_CHIPS = [
    { label: "\u{1F528} Hard Techno 150 BPM Ca\xF1a", query: "hard techno 150 bpm a tope de ca\xF1a" },
    { label: "\u26A1 Techno Peak Time 132 BPM", query: "techno peak time driving 132 bpm" },
    { label: "\u{1F9EA} Acid Techno en 8A 140 BPM", query: "acid techno en 8A a 140 bpm" },
    { label: "\u{1F30C} Melodic Techno en 6A", query: "melodic techno en 6A" },
    { label: "\u{1F525} Tech House a 128 BPM", query: "tech house a 128 bpm" },
    { label: "\u{1F334} Afro House Groove", query: "afro house groove para bailar" },
    { label: "\u{1F941} Minimal / Deep Tech 126 BPM", query: "minimal deep tech 126 bpm" },
    { label: "\u{1F680} Psy-Trance 142 BPM Ca\xF1a", query: "psy-trance 142 bpm ca\xF1a" },
    { label: "\u{1F4A5} Drum & Bass 174 BPM", query: "drum & bass neurofunk 174 bpm" },
    { label: "\u{1F39B}\uFE0F Progressive House 124 BPM", query: "progressive house 124 bpm" }
  ];
  var DJ_CURATED_CATALOG = [
    {
      id: "cat_0",
      title: "Legacy (Original Mix)",
      artist: "Sara Landry",
      genre: "Hard Techno",
      subgenre: "Hard Techno / Schranz (150-160 BPM)",
      bpm: 155,
      key: "11A",
      version: "Original Mix",
      mood: "A Tope de Ca\xF1a",
      year: 2024,
      cover: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=300&h=300&fit=crop",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: "05:42",
      cues: NV2_COLORS
    },
    {
      id: "cat_1",
      title: "Losing It (Extended Mix)",
      artist: "Fisher",
      genre: "House",
      subgenre: "Tech House",
      bpm: 126,
      key: "8A",
      version: "Extended Mix",
      mood: "Peak Time / Pista",
      year: 2018,
      cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: "06:40",
      cues: NV2_COLORS
    },
    {
      id: "cat_2",
      title: "The Garden (Original Mix)",
      artist: "Black Coffee, Caiiro",
      genre: "House",
      subgenre: "Afro House",
      bpm: 122,
      key: "4A",
      version: "Extended Mix",
      mood: "Chill / Sunset / After",
      year: 2021,
      cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      duration: "07:15",
      cues: NV2_COLORS
    },
    {
      id: "cat_3",
      title: "Eternity (Club Edit)",
      artist: "Anyma & Chris Avantgarde",
      genre: "Techno",
      subgenre: "Melodic Techno",
      bpm: 125,
      key: "6A",
      version: "Remix / Club Mix",
      mood: "Peak Time / Pista",
      year: 2023,
      cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      duration: "05:50",
      cues: NV2_COLORS
    },
    {
      id: "cat_4",
      title: "Gasolina (DJ Intro Previa Edit)",
      artist: "Daddy Yankee",
      genre: "Latin & Urban",
      subgenre: "Reggaet\xF3n",
      bpm: 96,
      key: "11A",
      version: "Intro / Outro",
      mood: "Previa / Warm Up",
      year: 2004,
      cover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=300&fit=crop",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      duration: "03:45",
      cues: NV2_COLORS
    },
    {
      id: "cat_5",
      title: "RKT Session (Mashup Bailable)",
      artist: "L-Gante x Bizarrap",
      genre: "Latin & Urban",
      subgenre: "Cachengue / RKT",
      bpm: 100,
      key: "2A",
      version: "Mashup / Bootleg",
      mood: "Peak Time / Pista",
      year: 2021,
      cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
      duration: "03:12",
      cues: NV2_COLORS
    },
    {
      id: "cat_6",
      title: "Me Provocas (Guaracha Tribal Mix)",
      artist: "Fumaratto",
      genre: "Latin & Urban",
      subgenre: "Guaracha",
      bpm: 130,
      key: "7A",
      version: "Extended Mix",
      mood: "Peak Time / Pista",
      year: 2020,
      cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
      duration: "04:30",
      cues: NV2_COLORS
    },
    {
      id: "cat_7",
      title: "Cola (VIP Extended Mix)",
      artist: "CamelPhat & Elderbrook",
      genre: "House",
      subgenre: "Melodic / Progressive House",
      bpm: 122,
      key: "8A",
      version: "Extended Mix",
      mood: "Previa / Warm Up",
      year: 2017,
      cover: "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=300&h=300&fit=crop",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
      duration: "06:55",
      cues: NV2_COLORS
    },
    {
      id: "cat_8",
      title: "Feel It (Driving Acid Techno)",
      artist: "Amelie Lens",
      genre: "Techno",
      subgenre: "Peak Time / Driving",
      bpm: 134,
      key: "10A",
      version: "Extended Mix",
      mood: "Peak Time / Pista",
      year: 2022,
      cover: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&h=300&fit=crop",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
      duration: "06:10",
      cues: NV2_COLORS
    },
    {
      id: "cat_9",
      title: "Lo Mejor del Amor (Transition Cuarteto)",
      artist: "Rodrigo",
      genre: "Latin & Urban",
      subgenre: "Cuarteto",
      bpm: 140,
      key: "5B",
      version: "Transition",
      mood: "Peak Time / Pista",
      year: 2e3,
      cover: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
      duration: "03:50",
      cues: NV2_COLORS
    },
    {
      id: "cat_10",
      title: "Hanging Tree (Groove Edit)",
      artist: "Michael Bibi",
      genre: "Electro & Breaks",
      subgenre: "Minimal / Deep Tech",
      bpm: 128,
      key: "3A",
      version: "Short Edit / Radio",
      mood: "Peak Time / Pista",
      year: 2019,
      cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
      duration: "05:15",
      cues: NV2_COLORS
    },
    {
      id: "cat_11",
      title: "Communication (Uplifting Euphoria)",
      artist: "Armin van Buuren",
      genre: "Trance",
      subgenre: "Uplifting Trance",
      bpm: 138,
      key: "1B",
      version: "Extended Mix",
      mood: "Peak Time / Pista",
      year: 2007,
      cover: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&h=300&fit=crop",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: "07:40",
      cues: NV2_COLORS
    },
    {
      id: "cat_12",
      title: "Aguila (Latin House Extended)",
      artist: "Hugel & Westend",
      genre: "House",
      subgenre: "Latin House",
      bpm: 126,
      key: "9A",
      version: "Extended Mix",
      mood: "Peak Time / Pista",
      year: 2022,
      cover: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&h=300&fit=crop",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      duration: "05:30",
      cues: NV2_COLORS
    }
  ];
  function parseAIDJQuery(query) {
    if (!query || typeof query !== "string") {
      return {
        raw: "",
        genre: null,
        subgenre: null,
        targetBpm: null,
        minBpm: null,
        maxBpm: null,
        key: null,
        compatibleKeys: [],
        version: null,
        mood: null,
        year: null,
        tokens: []
      };
    }
    const q = query.toLowerCase().trim();
    const result = {
      raw: query,
      genre: null,
      subgenre: null,
      targetBpm: null,
      minBpm: null,
      maxBpm: null,
      key: null,
      compatibleKeys: [],
      version: null,
      mood: null,
      year: null,
      tokens: []
    };
    const bpmRangeMatch = q.match(/(\d{2,3})\s*(?:-|a|to)\s*(\d{2,3})\s*(?:bpm)?/);
    if (bpmRangeMatch) {
      result.minBpm = parseInt(bpmRangeMatch[1], 10);
      result.maxBpm = parseInt(bpmRangeMatch[2], 10);
      result.targetBpm = Math.round((result.minBpm + result.maxBpm) / 2);
      result.tokens.push({ type: "bpm", label: `${result.minBpm}-${result.maxBpm} BPM`, rawMatch: bpmRangeMatch[0] });
    } else {
      const singleBpmMatch = q.match(/(?:a\s+)?(\b1[0-9]{2}\b|\b[6-9][0-9]\b)\s*(?:bpm)?/);
      if (singleBpmMatch) {
        const val = parseInt(singleBpmMatch[1], 10);
        if (val >= 60 && val <= 200) {
          result.targetBpm = val;
          result.minBpm = val - 3;
          result.maxBpm = val + 3;
          result.tokens.push({ type: "bpm", label: `${val} BPM (\xB13)`, rawMatch: singleBpmMatch[0] });
        }
      }
    }
    const camelotMatch = q.match(/\b(1[0-2]|[1-9])([abAB])\b/);
    if (camelotMatch) {
      const k = (camelotMatch[1] + camelotMatch[2]).toUpperCase();
      result.key = k;
      if (CAMELOT_WHEEL_DATA[k]) {
        result.compatibleKeys = [k, CAMELOT_WHEEL_DATA[k].rel, CAMELOT_WHEEL_DATA[k].up, CAMELOT_WHEEL_DATA[k].down];
      }
      result.tokens.push({ type: "key", label: `Key ${k}`, rawMatch: camelotMatch[0] });
    } else {
      for (const [camKey, data] of Object.entries(CAMELOT_WHEEL_DATA)) {
        const cls = data.classical.toLowerCase();
        const nm = data.name.toLowerCase();
        if (q.includes(`en ${cls}`) || q.includes(`en ${nm}`) || q.includes(` ${cls}`)) {
          result.key = camKey;
          result.compatibleKeys = [camKey, data.rel, data.up, data.down];
          result.tokens.push({ type: "key", label: `Key ${camKey} (${data.classical})`, rawMatch: cls });
          break;
        }
      }
    }
    if (q.includes("extended") || q.includes("ext")) {
      result.version = "Extended Mix";
      result.tokens.push({ type: "version", label: "Extended Mix", rawMatch: q.includes("extended") ? "extended" : "ext" });
    } else if (q.includes("intro") || q.includes("outro")) {
      result.version = "Intro / Outro";
      result.tokens.push({ type: "version", label: "Intro / Outro", rawMatch: q.includes("intro") ? "intro" : "outro" });
    } else if (q.includes("mashup") || q.includes("bootleg")) {
      result.version = "Mashup / Bootleg";
      result.tokens.push({ type: "version", label: "Mashup", rawMatch: q.includes("mashup") ? "mashup" : "bootleg" });
    } else if (q.includes("remix") || q.includes("club mix")) {
      result.version = "Remix / Club Mix";
      result.tokens.push({ type: "version", label: "Remix", rawMatch: q.includes("remix") ? "remix" : "club mix" });
    } else if (q.includes("acapella") || q.includes("acappella")) {
      result.version = "Acapella";
      result.tokens.push({ type: "version", label: "Acapella", rawMatch: q.includes("acapella") ? "acapella" : "acappella" });
    } else if (q.includes("transition") || q.includes("transicion")) {
      result.version = "Transition";
      result.tokens.push({ type: "version", label: "Transition", rawMatch: q.includes("transition") ? "transition" : "transicion" });
    }
    if (q.includes("previa") || q.includes("warm up") || q.includes("warmup")) {
      result.mood = "Previa / Warm Up";
      result.tokens.push({ type: "mood", label: "Previa / Warm Up", rawMatch: q.includes("warm up") ? "warm up" : q.includes("warmup") ? "warmup" : "previa" });
    } else if (q.includes("pista") || q.includes("peak time") || q.includes("festival") || q.includes("driving") || q.includes("bailar") || q.includes("baile")) {
      result.mood = "Peak Time / Pista";
      result.tokens.push({ type: "mood", label: "Peak Time / Pista", rawMatch: q.includes("peak time") ? "peak time" : q.includes("pista") ? "pista" : q.includes("driving") ? "driving" : "bailar" });
    } else if (q.includes("sunset") || q.includes("chill") || q.includes("after") || q.includes("lounge")) {
      result.mood = "Chill / Sunset / After";
      result.tokens.push({ type: "mood", label: "Chill / Sunset", rawMatch: q.includes("sunset") ? "sunset" : q.includes("chill") ? "chill" : q.includes("after") ? "after" : "lounge" });
    }
    const yearMatch = q.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      result.year = parseInt(yearMatch[1], 10);
      result.tokens.push({ type: "year", label: `A\xF1o ${result.year}`, rawMatch: yearMatch[0] });
    } else if (q.includes("retro") || q.includes("90s") || q.includes("80s") || q.includes("2000s")) {
      result.year = "Retro";
      result.tokens.push({ type: "year", label: "Retro", rawMatch: q.includes("retro") ? "retro" : q.includes("90s") ? "90s" : q.includes("80s") ? "80s" : "2000s" });
    }
    if (q.includes("bass driver") || q.includes("subgrave") || q.includes("bombo") || q.includes("sub-bass") || q.includes("sub bass")) {
      result.acousticRole = "Bass Driver";
      result.tokens.push({ type: "role", label: "Rol: Bass Driver (Graves)", rawMatch: "bass driver" });
    } else if (q.includes("vocal") || q.includes("vocales") || q.includes("lead") || q.includes("melodia") || q.includes("mel\xF3dico") || q.includes("melodica")) {
      result.acousticRole = "Vocal / Lead";
      result.tokens.push({ type: "role", label: "Rol: Vocal / Lead (Medios)", rawMatch: "vocal" });
    } else if (q.includes("percussive") || q.includes("percusivo") || q.includes("percursion") || q.includes("tool") || q.includes("hats") || q.includes("platos")) {
      result.acousticRole = "Percussive Tool";
      result.tokens.push({ type: "role", label: "Rol: Percussive Tool (Agudos)", rawMatch: "percussive" });
    }
    if (q.includes("energico") || q.includes("en\xE9rgico") || q.includes("alta energia") || q.includes("alta energ\xEDa") || q.includes("high energy")) {
      result.minEnergy = 80;
      result.tokens.push({ type: "energy", label: "Energ\xEDa > 80%", rawMatch: "en\xE9rgico" });
    } else if (q.includes("chill") || q.includes("baja energia") || q.includes("baja energ\xEDa") || q.includes("suave")) {
      result.maxEnergy = 65;
      result.tokens.push({ type: "energy", label: "Energ\xEDa < 65%", rawMatch: "chill" });
    }
    if (q.includes("tech house")) {
      result.genre = "House";
      result.subgenre = "Tech House";
      result.tokens.push({ type: "genre", label: "Tech House", rawMatch: "tech house" });
    } else if (q.includes("afro house") || q.includes("afro")) {
      result.genre = "House";
      result.subgenre = "Afro House";
      result.tokens.push({ type: "genre", label: "Afro House", rawMatch: q.includes("afro house") ? "afro house" : "afro" });
    } else if (q.includes("melodic techno")) {
      result.genre = "Techno";
      result.subgenre = "Melodic Techno";
      result.tokens.push({ type: "genre", label: "Melodic Techno", rawMatch: "melodic techno" });
    } else if (q.includes("progressive house") || q.includes("house progresivo")) {
      result.genre = "House";
      result.subgenre = "Melodic / Progressive House";
      result.tokens.push({ type: "genre", label: "Progressive House", rawMatch: q.includes("progressive house") ? "progressive house" : "house progresivo" });
    } else if (q.includes("deep house")) {
      result.genre = "House";
      result.subgenre = "Deep House";
      result.tokens.push({ type: "genre", label: "Deep House", rawMatch: "deep house" });
    } else if (q.includes("minimal") || q.includes("deep tech")) {
      result.genre = "Electro & Breaks";
      result.subgenre = "Minimal / Deep Tech";
      result.tokens.push({ type: "genre", label: "Minimal / Deep Tech", rawMatch: q.includes("minimal") ? "minimal" : "deep tech" });
    } else if (q.includes("reggaeton") || q.includes("reggaet\xF3n")) {
      result.genre = "Latin & Urban";
      result.subgenre = "Reggaet\xF3n";
      result.tokens.push({ type: "genre", label: "Reggaet\xF3n", rawMatch: q.includes("reggaet\xF3n") ? "reggaet\xF3n" : "reggaeton" });
    } else if (q.includes("cachengue") || q.includes("rkt")) {
      result.genre = "Latin & Urban";
      result.subgenre = "Cachengue / RKT";
      result.tokens.push({ type: "genre", label: "Cachengue / RKT", rawMatch: q.includes("cachengue") ? "cachengue" : "rkt" });
    } else if (q.includes("cuarteto")) {
      result.genre = "Latin & Urban";
      result.subgenre = "Cuarteto";
      result.tokens.push({ type: "genre", label: "Cuarteto", rawMatch: "cuarteto" });
    } else if (q.includes("guaracha")) {
      result.genre = "Latin & Urban";
      result.subgenre = "Guaracha";
      result.tokens.push({ type: "genre", label: "Guaracha", rawMatch: "guaracha" });
    } else if (q.includes("cumbia")) {
      result.genre = "Latin & Urban";
      result.subgenre = "Cumbia";
      result.tokens.push({ type: "genre", label: "Cumbia", rawMatch: "cumbia" });
    } else if (q.includes("latin house")) {
      result.genre = "House";
      result.subgenre = "Latin House";
      result.tokens.push({ type: "genre", label: "Latin House", rawMatch: "latin house" });
    } else if (q.includes("techno") || q.includes("tecno")) {
      result.genre = "Techno";
      result.subgenre = "Techno";
      result.tokens.push({ type: "genre", label: "Techno", rawMatch: q.includes("techno") ? "techno" : "tecno" });
    } else if (q.includes("house")) {
      result.genre = "House";
      result.subgenre = "House";
      result.tokens.push({ type: "genre", label: "House", rawMatch: "house" });
    } else if (q.includes("trance")) {
      result.genre = "Trance";
      result.subgenre = "Trance";
      result.tokens.push({ type: "genre", label: "Trance", rawMatch: "trance" });
    } else if (q.includes("drum & bass") || q.includes("drum and bass") || q.includes("dnb")) {
      result.genre = "Drum & Bass";
      result.subgenre = "Drum & Bass";
      result.tokens.push({ type: "genre", label: "Drum & Bass", rawMatch: q.includes("drum & bass") ? "drum & bass" : q.includes("drum and bass") ? "drum and bass" : "dnb" });
    }
    return result;
  }
  var DJ_MOODS_LIST = [
    { id: "Peak Time", label: "\u{1F525} Peak Time", desc: "Cl\xEDmax de pista, alta pegada" },
    { id: "Dark", label: "\u{1F311} Dark", desc: "Oscuro, industrial, contundente" },
    { id: "Euphoric", label: "\u2728 Euphoric", desc: "Melod\xEDas \xE9picas, subid\xF3n emotivo" },
    { id: "Hypnotic", label: "\u{1F300} Hypnotic", desc: "Groove continuo y envolvente" },
    { id: "Raw", label: "\u26A1 Raw", desc: "Seco, crudo y minimalista" },
    { id: "Melancholic", label: "\u{1F327} Melancholic", desc: "Atmosf\xE9rico y profundo" }
  ];
  var CamelotWheelModal = ({ isOpen, onClose, currentKey, onSelectKey }) => {
    if (!isOpen) return null;
    const currentData = CAMELOT_WHEEL_DATA[currentKey] || CAMELOT_WHEEL_DATA["8A"];
    const compatibleKeys = [
      { key: currentKey, desc: "Mismo tono (Mezcla arm\xF3nica pura)", badge: "0", color: "bg-djcyan-500 text-black border-djcyan-400" },
      { key: currentData.rel, desc: "Relativo menor/mayor (Cambio de color suave)", badge: "A \u2194 B", color: "bg-emerald-500 text-black border-emerald-400" },
      { key: currentData.up, desc: "Sube energ\xEDa (+1 escala)", badge: "+1", color: "bg-amber-500 text-black border-amber-400" },
      { key: currentData.down, desc: "Relaja energ\xEDa (-1 escala)", badge: "-1", color: "bg-blue-500 text-white border-blue-400" }
    ];
    return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 border border-djzinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "px-6 py-4 border-b border-djzinc-800 flex items-center justify-between bg-djzinc-900/70" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl" }, "\u{1F3A1}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-sm uppercase tracking-wider text-white" }, "Rueda Arm\xF3nica Camelot (Circle of Fifths)"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-gray-400" }, "Gu\xEDa de compatibilidad para transiciones arm\xF3nicas fluidas y mezclas sin disonancia"))), /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "w-7 h-7 rounded-full bg-djzinc-800 text-gray-400 hover:text-white flex items-center justify-center text-xs cursor-pointer" }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "p-6 space-y-5" }, /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/90 p-3.5 rounded-xl border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono text-gray-400 uppercase tracking-wider block mb-2" }, "Pistas Arm\xF3nicamente Compatibles con ", /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold" }, currentKey, " (", currentData.classical, " \u2022 ", currentData.name, ")"), ":"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2" }, compatibleKeys.map((c, i) => {
      const kInfo = CAMELOT_WHEEL_DATA[c.key] || {};
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: i,
          onClick: () => {
            onSelectKey(c.key);
            onClose();
          },
          className: "p-2.5 rounded-lg bg-djzinc-950 border border-djzinc-750 hover:border-djcyan-400 cursor-pointer flex flex-col justify-between transition-colors shadow-sm"
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "font-mono font-black text-sm text-white" }, c.key), /* @__PURE__ */ React.createElement("span", { className: `text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${c.color}` }, c.badge)),
        /* @__PURE__ */ React.createElement("span", { className: "text-xs font-semibold text-gray-300 mt-1" }, kInfo.classical),
        /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 truncate mt-0.5" }, c.desc)
      );
    }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-gray-300 uppercase tracking-wider" }, "Selector de 24 Tonos"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 font-mono" }, "Fila B: Mayores \u2022 Fila A: Menores")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-6 sm:grid-cols-12 gap-1 mb-2" }, Array.from({ length: 12 }, (_, i) => `${i + 1}B`).map((k) => {
      const kInfo = CAMELOT_WHEEL_DATA[k];
      const isSelected = k === currentKey;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: k,
          type: "button",
          onClick: () => {
            onSelectKey(k);
            onClose();
          },
          className: `p-1.5 rounded flex flex-col items-center justify-center border transition-all cursor-pointer ${isSelected ? "bg-djcyan-500 text-black border-djcyan-300 shadow-[0_0_10px_rgba(34,211,238,0.6)] font-bold" : "bg-djzinc-900 hover:bg-djzinc-800 text-gray-200 border-djzinc-800"}`
        },
        /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono font-bold" }, k),
        /* @__PURE__ */ React.createElement("span", { className: `text-[9px] font-mono ${isSelected ? "text-black" : "text-gray-400"}` }, kInfo.classical)
      );
    })), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-6 sm:grid-cols-12 gap-1" }, Array.from({ length: 12 }, (_, i) => `${i + 1}A`).map((k) => {
      const kInfo = CAMELOT_WHEEL_DATA[k];
      const isSelected = k === currentKey;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: k,
          type: "button",
          onClick: () => {
            onSelectKey(k);
            onClose();
          },
          className: `p-1.5 rounded flex flex-col items-center justify-center border transition-all cursor-pointer ${isSelected ? "bg-djcyan-500 text-black border-djcyan-300 shadow-[0_0_10px_rgba(34,211,238,0.6)] font-bold" : "bg-djzinc-900 hover:bg-djzinc-800 text-gray-200 border-djzinc-800"}`
        },
        /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono font-bold" }, k),
        /* @__PURE__ */ React.createElement("span", { className: `text-[9px] font-mono ${isSelected ? "text-black" : "text-gray-400"}` }, kInfo.classical)
      );
    })))), /* @__PURE__ */ React.createElement("div", { className: "px-6 py-3.5 bg-djzinc-900/60 border-t border-djzinc-800 flex justify-end" }, /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "px-4 py-1.5 bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 text-xs font-semibold rounded-lg cursor-pointer" }, "Cerrar"))));
  };
  var BatchAuditorModal = ({ isOpen, onClose, onRunBatch }) => {
    const [opts, setOpts] = useState({
      fftLossless: true,
      trimSilences: true,
      beatgrid: true,
      bpmKey: true,
      energyDance: true,
      moodDetect: true,
      hotCues8: true,
      tacticalComments: true,
      injectCovers: true,
      detectDuplicates: true,
      fixMissingNames: true,
      onlyIncomplete: false
    });
    if (!isOpen) return null;
    const toggle = (key) => setOpts((prev) => ({ ...prev, [key]: !prev[key] }));
    const activeCount = Object.values(opts).filter(Boolean).length;
    const modules = [
      {
        group: "DSP & Audio Forensics",
        items: [
          { key: "fftLossless", title: "Inspecci\xF3n FFT Lossless Real", desc: "An\xE1lisis espectral por FFT para cazar transcodificaciones falsas a 16kHz/19kHz.", badge: "FFT 4096", badgeColor: "text-djcyan-400 bg-djcyan-950/80 border-djcyan-800/60" },
          { key: "trimSilences", title: "Zero-Crossing Silence Trim", desc: "Elimina silencios de cabecera y cola cortando en cruce por cero a -48 dBFS.", badge: "DSP Fast", badgeColor: "text-djgreen-400 bg-djgreen-950/80 border-djgreen-800/60" },
          { key: "detectDuplicates", title: "Buscar & Deduplicar por Calidad", desc: "Compara pistas duplicadas por Nyquist FFT, formato y tama\xF1o para depurar biblioteca.", badge: "Lossless Win", badgeColor: "text-amber-400 bg-amber-950/80 border-amber-800/60" }
        ]
      },
      {
        group: "Metadatos, Nombres & Mezcla Arm\xF3nica",
        items: [
          { key: "fixMissingNames", title: "Auto-Completar T\xEDtulo / Artista", desc: "Deduce t\xEDtulos y artistas faltantes desde la nomenclatura del archivo.", badge: "Tags Auto", badgeColor: "text-emerald-400 bg-emerald-950/80 border-emerald-800/60" },
          { key: "beatgrid", title: "Fijaci\xF3n Downbeat Beatgrid 1.0.0", desc: "Encuentra el primer golpe de bombo real y ancla el grid para evitar desfases de sincro.", badge: "Grid Auto", badgeColor: "text-blue-400 bg-blue-950/80 border-blue-800/60" },
          { key: "bpmKey", title: "BPM Decimal & Notaci\xF3n Camelot", desc: "Calcula tempo con 2 decimales y mapea tono a notaci\xF3n Camelot est\xE1ndar.", badge: "Key Wheel", badgeColor: "text-amber-400 bg-amber-950/80 border-amber-800/60" },
          { key: "injectCovers", title: "Inyecci\xF3n de Car\xE1tulas 1:1 (Artwork)", desc: "Detecta car\xE1tulas de carpeta o car\xE1tula oficial y las incrusta 600x600 en APIC/FLAC.", badge: "Cover 1:1", badgeColor: "text-amber-400 bg-amber-950/80 border-amber-800/60" },
          { key: "onlyIncomplete", title: "Auditar Solo Pistas Incompletas", desc: "Omite pistas que ya tengan todos los metadatos completos para acelerar auditor\xEDas.", badge: "Speed Fast", badgeColor: "text-purple-400 bg-purple-950/80 border-purple-800/60" }
        ]
      },
      {
        group: "Perfil Psicoac\xFAstico & Hardware Cues",
        items: [
          { key: "energyDance", title: "C\xE1lculo Energ\xEDa & Danceability", desc: "Calcula la pegada RMS de graves y solidez r\xEDtmica de 1 a 100.", badge: "RMS Core", badgeColor: "text-purple-400 bg-purple-950/80 border-purple-800/60" },
          { key: "moodDetect", title: "Clasificaci\xF3n de Atm\xF3sfera & Fase DJ", desc: "Etiqueta ubicaci\xF3n de sesi\xF3n (Warm-Up, Build-Up, Cl\xEDmax Ca\xF1a, Cierre, Calma).", badge: "AI Cluster", badgeColor: "text-emerald-400 bg-emerald-950/80 border-emerald-800/60" },
          { key: "hotCues8", title: "Inyecci\xF3n 8 Hot Cues (Numark NV2)", desc: "Genera los 8 puntos estructurales est\xE1ndar de sesi\xF3n en pads RGB.", badge: "NV2 Cues", badgeColor: "text-pink-400 bg-pink-950/80 border-pink-800/60" },
          { key: "tacticalComments", title: "Inyecci\xF3n de Comentario T\xE1ctico DJ", desc: "Inyecta en el tag ID3 COMM la gu\xEDa r\xE1pida de mezcla visible en pantalla de la mesa.", badge: "Tag ID3", badgeColor: "text-gray-300 bg-djzinc-800 border-djzinc-700" }
        ]
      }
    ];
    return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 border border-djzinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" }, /* @__PURE__ */ React.createElement("div", { className: "px-6 py-4 border-b border-djzinc-800 flex items-center justify-between bg-djzinc-900/60" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icons.Sliders, null), /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-sm uppercase tracking-wider text-white" }, "Configurar Procesamiento Masivo (Batch)")), /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "w-7 h-7 rounded-full bg-djzinc-800 text-gray-400 hover:text-white flex items-center justify-center text-xs" }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "p-6 overflow-y-auto space-y-5" }, modules.map((group, gIdx) => /* @__PURE__ */ React.createElement("div", { key: gIdx, className: "space-y-2.5" }, /* @__PURE__ */ React.createElement("h4", { className: "text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-djcyan-400" }), group.group), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-2" }, group.items.map((item) => {
      const active = opts[item.key];
      return /* @__PURE__ */ React.createElement("div", { key: item.key, onClick: () => toggle(item.key), className: `p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${active ? "bg-djzinc-900/90 border-djcyan-500/40 shadow-sm" : "bg-djzinc-950/40 border-djzinc-850 opacity-60 hover:opacity-90"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: `w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${active ? "bg-djcyan-500 border-djcyan-400 text-black" : "border-djzinc-700 bg-djzinc-900 text-transparent"}` }, "\u2713"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-semibold text-white" }, item.title), /* @__PURE__ */ React.createElement("span", { className: `text-[9px] font-mono px-1.5 py-0.2 rounded border ${item.badgeColor}` }, item.badge)), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-gray-400 mt-0.5" }, item.desc))));
    }))))), /* @__PURE__ */ React.createElement("div", { className: "px-6 py-4 bg-djzinc-900 border-t border-djzinc-800 flex items-center justify-end gap-3 shrink-0" }, /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-djzinc-800 border border-djzinc-700 cursor-pointer" }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { onClick: () => onRunBatch(opts), className: "px-5 py-2 rounded-xl text-xs font-bold bg-djcyan-500 hover:bg-djcyan-400 text-black cursor-pointer shadow-lg shadow-djcyan-500/20" }, "Ejecutar Procesamiento Masivo (", activeCount, ")"))));
  };
  var DuplicateComparisonModal = ({ isOpen, onClose, tracks = [], onDuplicatesDeleted }) => {
    const [dupData, setDupData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedToDelete, setSelectedToDelete] = useState({});
    const [statusMsg, setStatusMsg] = useState("");
    useEffect(() => {
      if (!isOpen) return;
      const loadDups = async () => {
        setLoading(true);
        setStatusMsg("Analizando biblioteca en busca de duplicados y calculando \xEDndice de calidad ac\xFAstica...");
        try {
          if (window.eel && window.eel.detectar_duplicados_biblioteca) {
            const res = await window.eel.detectar_duplicados_biblioteca(tracks)();
            setDupData(res);
            const initialSel = {};
            if (res && res.grupos) {
              res.grupos.forEach((g) => {
                g.tracks.forEach((t) => {
                  if (!t.is_winner && t.path) {
                    initialSel[t.path] = true;
                  }
                });
              });
            }
            setSelectedToDelete(initialSel);
          }
        } catch (err) {
          console.error("Error detectando duplicados:", err);
        } finally {
          setLoading(false);
          setStatusMsg("");
        }
      };
      loadDups();
    }, [isOpen, tracks]);
    if (!isOpen) return null;
    const toggleSelect = (path) => {
      setSelectedToDelete((prev) => ({
        ...prev,
        [path]: !prev[path]
      }));
    };
    const handleSelectAllInferiors = () => {
      if (!dupData || !dupData.grupos) return;
      const nxt = {};
      dupData.grupos.forEach((g) => {
        g.tracks.forEach((t) => {
          if (!t.is_winner && t.path) {
            nxt[t.path] = true;
          }
        });
      });
      setSelectedToDelete(nxt);
    };
    const handleDeselectAll = () => {
      setSelectedToDelete({});
    };
    const countSelected = Object.values(selectedToDelete).filter(Boolean).length;
    let totalMbSelected = 0;
    if (dupData && dupData.grupos) {
      dupData.grupos.forEach((g) => {
        g.tracks.forEach((t) => {
          if (selectedToDelete[t.path]) {
            totalMbSelected += t.size_mb || 0;
          }
        });
      });
    }
    const handleConfirmDelete = async () => {
      const pathsToDelete = Object.keys(selectedToDelete).filter((p) => selectedToDelete[p]);
      if (pathsToDelete.length === 0) {
        alert("No has seleccionado ninguna pista duplicada para eliminar.");
        return;
      }
      const confirmMsg = `\xBFEst\xE1s seguro de que deseas eliminar ${pathsToDelete.length} archivos duplicados? (${totalMbSelected.toFixed(1)} MB a liberar)

Esta acci\xF3n mover\xE1 los archivos a la papelera o los eliminar\xE1 de forma segura.`;
      if (!window.confirm(confirmMsg)) return;
      setDeleting(true);
      setStatusMsg(`Eliminando ${pathsToDelete.length} archivos duplicados del disco...`);
      try {
        if (window.eel && window.eel.eliminar_pistas_duplicadas) {
          const res = await window.eel.eliminar_pistas_duplicadas(pathsToDelete)();
          if (res && res.status === "ok") {
            alert(`\u2713 Se eliminaron ${res.eliminados || pathsToDelete.length} pistas duplicadas con \xE9xito.`);
            if (onDuplicatesDeleted) {
              onDuplicatesDeleted(res.paths_eliminados || pathsToDelete);
            }
            onClose();
          } else {
            alert(`Error al eliminar: ${res?.errores?.join(", ") || "Fallo de permisos en disco"}`);
          }
        }
      } catch (err) {
        console.error("Error al eliminar duplicados:", err);
        alert("Error al ejecutar eliminaci\xF3n de archivos.");
      } finally {
        setDeleting(false);
        setStatusMsg("");
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#0c0c12] border border-djzinc-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" }, /* @__PURE__ */ React.createElement("div", { className: "px-6 py-4 border-b border-djzinc-800 bg-djzinc-950 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "p-2 bg-amber-500/10 text-amber-400 rounded-lg text-lg border border-amber-500/20" }, "\u2696\uFE0F"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-sm uppercase tracking-wider text-white font-mono" }, "Comparador & Deduplicador Ac\xFAstico"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-gray-400" }, "Compara duplicados cara a cara (FLAC vs MP3, Bitrate, Cutoff Nyquist FFT, tama\xF1o) y conserva la m\xE1xima calidad."))), /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "w-7 h-7 rounded-full bg-djzinc-800 text-gray-400 hover:text-white flex items-center justify-center text-xs cursor-pointer" }, "\u2715")), dupData && /* @__PURE__ */ React.createElement("div", { className: "px-6 py-3 bg-djzinc-900 border-b border-djzinc-800 flex items-center justify-between text-xs font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-300" }, "Grupos: ", /* @__PURE__ */ React.createElement("strong", { className: "text-djcyan-400" }, dupData.total_grupos)), /* @__PURE__ */ React.createElement("span", { className: "text-gray-300" }, "Duplicados: ", /* @__PURE__ */ React.createElement("strong", { className: "text-amber-400" }, dupData.total_duplicados)), /* @__PURE__ */ React.createElement("span", { className: "text-gray-300" }, "Espacio recuperable: ", /* @__PURE__ */ React.createElement("strong", { className: "text-emerald-400" }, dupData.espacio_recuperable_mb, " MB"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("button", { onClick: handleSelectAllInferiors, className: "px-2.5 py-1 bg-djzinc-800 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 text-[11px] cursor-pointer" }, "Marcar Inferiores"), /* @__PURE__ */ React.createElement("button", { onClick: handleDeselectAll, className: "px-2.5 py-1 bg-djzinc-800 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 text-[11px] cursor-pointer" }, "Desmarcar"))), /* @__PURE__ */ React.createElement("div", { className: "p-6 overflow-y-auto space-y-4 flex-1" }, loading ? /* @__PURE__ */ React.createElement("div", { className: "py-20 text-center space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 border-2 border-djcyan-400 border-t-transparent rounded-full animate-spin mx-auto" }), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-mono text-gray-400" }, statusMsg || "Comparando espectrogramas y pureza de audio...")) : !dupData || dupData.grupos.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "py-20 text-center space-y-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-4xl block" }, "\u2728"), /* @__PURE__ */ React.createElement("h4", { className: "text-sm font-bold text-white" }, "\xA1Biblioteca 100% Limpia de Duplicados!"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 max-w-md mx-auto" }, "No se encontraron versiones repetidas ni pistas con nombres duplicados en la biblioteca auditada.")) : dupData.grupos.map((grupo, gIdx) => /* @__PURE__ */ React.createElement("div", { key: grupo.clave || gIdx, className: "bg-[#101018] border border-djzinc-800 rounded-xl overflow-hidden shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "px-4 py-2.5 bg-djzinc-950/80 border-b border-djzinc-800/80 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-djcyan-400 truncate font-mono" }, "\u{1F3B5} ", grupo.display_name), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-400 bg-djzinc-900 px-2 py-0.5 rounded border border-djzinc-800" }, grupo.total_versiones, " versiones detectadas")), /* @__PURE__ */ React.createElement("div", { className: "divide-y divide-djzinc-850" }, grupo.tracks.map((t, tIdx) => {
      const isSelected = Boolean(selectedToDelete[t.path]);
      return /* @__PURE__ */ React.createElement("div", { key: t.path || tIdx, className: `p-3.5 flex items-center justify-between transition-colors ${t.is_winner ? "bg-emerald-950/15" : isSelected ? "bg-red-950/20" : "bg-transparent"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 min-w-0 flex-1" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          checked: isSelected,
          onChange: () => toggleSelect(t.path),
          className: "w-4 h-4 rounded border-djzinc-700 bg-djzinc-900 text-red-500 focus:ring-0 cursor-pointer shrink-0",
          title: t.is_winner ? "\xA1Cuidado! Esta es la versi\xF3n de mayor calidad" : "Marcar para eliminar"
        }
      ), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-semibold text-white truncate max-w-[280px]", title: t.title || t.filename }, t.title || t.filename), /* @__PURE__ */ React.createElement("span", { className: `text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${t.is_winner ? "bg-emerald-950 text-emerald-400 border-emerald-800" : "bg-red-950/80 text-red-400 border-red-800"}` }, t.badge_recommendation), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono bg-djzinc-850 text-gray-300 px-1.5 py-0.5 rounded border border-djzinc-750" }, "Score: ", t.quality_score, " pts")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 text-[10px] font-mono text-gray-400 mt-1 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold uppercase" }, t.format), /* @__PURE__ */ React.createElement("span", null, t.sample_rate_khz || 44.1, " kHz"), /* @__PURE__ */ React.createElement("span", null, t.bitrate_kbps ? `${t.bitrate_kbps} kbps` : t.format === "MP3" ? "320 kbps" : "1411 kbps"), /* @__PURE__ */ React.createElement("span", null, "FFT: ", /* @__PURE__ */ React.createElement("strong", { className: t.cutoff_khz >= 20 ? "text-emerald-400" : "text-amber-400" }, t.cutoff_khz ? `${t.cutoff_khz}kHz` : "22kHz")), /* @__PURE__ */ React.createElement("span", null, "Peso: ", /* @__PURE__ */ React.createElement("strong", { className: "text-gray-300" }, t.size_mb || 0, " MB")), /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 truncate max-w-[220px]", title: t.path }, t.path)))));
    }))))), /* @__PURE__ */ React.createElement("div", { className: "px-6 py-4 bg-djzinc-950 border-t border-djzinc-800 flex items-center justify-between shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-mono text-gray-400" }, countSelected > 0 ? /* @__PURE__ */ React.createElement("span", null, "Seleccionadas para eliminar: ", /* @__PURE__ */ React.createElement("strong", { className: "text-red-400" }, countSelected, " pistas"), " (", totalMbSelected.toFixed(1), " MB)") : /* @__PURE__ */ React.createElement("span", null, "Ninguna pista seleccionada para eliminaci\xF3n")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-djzinc-850 border border-djzinc-750 cursor-pointer" }, "Cerrar"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleConfirmDelete,
        disabled: countSelected === 0 || deleting,
        className: "px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white cursor-pointer shadow-lg shadow-red-600/20 flex items-center gap-1.5 transition-all"
      },
      deleting ? "Eliminando..." : `\u{1F5D1}\uFE0F Eliminar Duplicados Seleccionados (${countSelected})`
    )))));
  };
  var AuditWorkspace = ({
    tracks: externalTracks,
    setTracks: setExternalTracks,
    selectedTrack,
    setSelectedTrack,
    onPlayTrack,
    nowPlayingTrack,
    isPlaying,
    onTogglePlay,
    playProgress = 0,
    onNavigateTab,
    onAddTrackToSet,
    onSendToSpotify,
    lang = "es",
    t = (k) => k,
    currentFolder = "",
    setCurrentFolder,
    audioRef,
    onAuditProgressChange
  }) => {
    const [localRutaOrigen, setLocalRutaOrigen] = useState("");
    const rutaOrigen = currentFolder || localRutaOrigen;
    const setRutaOrigen = setCurrentFolder || setLocalRutaOrigen;
    const [selectedLooseFiles, setSelectedLooseFiles] = useState([]);
    const [isAuditing, setIsAuditing] = useState(false);
    const [isLoadingDir, setIsLoadingDir] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isInjecting, setIsInjecting] = useState(false);
    const [metrics, setMetrics] = useState({ total: 0, missing: 0, missing_title: 0, missing_artist: 0, missing_cover: 0, duplicates: 0, ready: 0, errors: 0 });
    const [filtro, setFiltro] = useState("todos");
    const [busqueda, setBusqueda] = useState("");
    const [filterHeaderAcousticRole, setFilterHeaderAcousticRole] = useState("ALL");
    const [batchModalOpen, setBatchModalOpen] = useState(false);
    const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
    const [batchProgress, setBatchProgress] = useState(0);
    const [batchStatusMsg, setBatchStatusMsg] = useState("");
    const [saveFeedback, setSaveFeedback] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedAuditIds, setSelectedAuditIds] = useState(/* @__PURE__ */ new Set());
    const [isSearchingSpotifyHD, setIsSearchingSpotifyHD] = useState(false);
    const [internalTracks, setInternalTracks] = useState([]);
    const tracks = externalTracks !== void 0 ? externalTracks : internalTracks;
    const setTracks = setExternalTracks !== void 0 ? setExternalTracks : setInternalTracks;
    const [fftModalOpen, setFftModalOpen] = useState(false);
    const [fftAnalysisData, setFftAnalysisData] = useState(null);
    const [isAnalyzingFft, setIsAnalyzingFft] = useState(false);
    const [fsBrowserOpen, setFsBrowserOpen] = useState(false);
    const [fsCurrentPath, setFsCurrentPath] = useState("");
    const [fsParentPath, setFsParentPath] = useState("");
    const [fsFolders, setFsFolders] = useState([]);
    const [fsFiles, setFsFiles] = useState([]);
    const [selectedFsFiles, setSelectedFsFiles] = useState([]);
    const [stagedFolders, setStagedFolders] = useState([]);
    const [stagedFiles, setStagedFiles] = useState([]);
    const [fsActiveTab, setFsActiveTab] = useState("folders");
    const [fsLoading, setFsLoading] = useState(false);
    const [camelotModalOpen, setCamelotModalOpen] = useState(false);
    const tapTimesRef = useRef([]);
    const [selectedCueId, setSelectedCueId] = useState(1);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [showBeatgrid, setShowBeatgrid] = useState(true);
    const [cueStudioModalOpen, setCueStudioModalOpen] = useState(false);
    const currentTrack = tracks.find((t2) => t2.id === selectedTrack) || tracks[0] || {};
    useEffect(() => {
      if (window.eel && typeof window.eel.expose === "function") {
        window.actualizar_progreso_batch = (pct, msg) => {
          setBatchProgress(pct);
          setBatchStatusMsg(msg);
        };
        window.eel.expose(window.actualizar_progreso_batch, "actualizar_progreso_batch");
      }
    }, []);
    useEffect(() => {
      if (typeof onAuditProgressChange === "function") {
        onAuditProgressChange({
          isAuditing,
          progress: batchProgress,
          statusMsg: batchStatusMsg
        });
      }
    }, [isAuditing, batchProgress, batchStatusMsg, onAuditProgressChange]);
    const updateCurrentTrackField = (field, val) => {
      setTracks((prev) => prev.map((t2) => t2.id === currentTrack.id ? { ...t2, [field]: val } : t2));
    };
    const isFlacUpgradeCandidate = (t2) => {
      if (!t2) return false;
      const fmt = String(t2.format || "").toUpperCase();
      if (fmt !== "FLAC") return false;
      if (Boolean(t2.es_fake) || String(t2.status || "").toLowerCase().includes("fake")) return true;
      const cal = String(t2.calidad || "").toLowerCase();
      if (cal.includes("baja") || cal.includes("media") || cal.includes("regular") || cal.includes("poor") || cal.includes("bad") || cal.includes("transcode")) {
        return true;
      }
      const cutoff = Number(t2.cutoff_khz) || 0;
      if (cutoff > 0 && cutoff < 20) return true;
      const bitrate = Number(t2.bitrate_kbps) || 0;
      if (bitrate > 0 && bitrate < 650) return true;
      const perdida = Number(t2.perdida_pct) || 0;
      if (perdida >= 15) return true;
      return false;
    };
    const isBadQualityTrack = (t2) => {
      if (!t2) return false;
      if (isFlacUpgradeCandidate(t2)) return true;
      const cal = String(t2.calidad || "").toLowerCase();
      if (cal.includes("baja") || cal.includes("poor") || cal.includes("bad") || cal.includes("transcode")) {
        return true;
      }
      const bitrate = Number(t2.bitrate_kbps) || 0;
      if (t2.format === "MP3" && bitrate > 0 && bitrate < 310) {
        return true;
      }
      const cutoff = Number(t2.cutoff_khz) || 0;
      if (cutoff > 0 && cutoff < 18) {
        return true;
      }
      const perdida = Number(t2.perdida_pct) || 0;
      if (perdida >= 20) {
        return true;
      }
      return false;
    };
    const badQualityTracks = useMemo(() => {
      return (tracks || []).filter((t2) => isBadQualityTrack(t2));
    }, [tracks]);
    const flacUpgradeTracks = useMemo(() => {
      return (tracks || []).filter((t2) => isFlacUpgradeCandidate(t2));
    }, [tracks]);
    const handleToggleSelectRow = (id, e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      setSelectedAuditIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    };
    const handleSelectAllBadQuality = () => {
      const badIds = badQualityTracks.map((t2) => t2.id);
      if (badIds.length === 0) {
        alert("No se han detectado pistas de mala calidad en la lista actual.");
        return;
      }
      const allBadAlreadySelected = badIds.every((id) => selectedAuditIds.has(id));
      if (allBadAlreadySelected) {
        setSelectedAuditIds(/* @__PURE__ */ new Set());
      } else {
        setSelectedAuditIds(new Set(badIds));
      }
    };
    const handleBuscarReemplazosSpotify = async (customTracks = null) => {
      let targetTracks = customTracks;
      if (!targetTracks || targetTracks.length === 0) {
        if (selectedAuditIds.size > 0) {
          targetTracks = (tracks || []).filter((t2) => selectedAuditIds.has(t2.id));
        } else if (badQualityTracks.length > 0) {
          targetTracks = badQualityTracks;
        }
      }
      if (!targetTracks || targetTracks.length === 0) {
        alert("No hay pistas seleccionadas ni pistas de baja calidad detectadas para buscar en Spotify.");
        return;
      }
      setIsSearchingSpotifyHD(true);
      setBatchProgress(20);
      setBatchStatusMsg(`Buscando reemplazos oficiales en Spotify HD para ${targetTracks.length} pista(s)...`);
      try {
        let rawRes = null;
        if (window.eel && window.eel.buscar_reemplazos_spotify_batch) {
          rawRes = await window.eel.buscar_reemplazos_spotify_batch(targetTracks)();
        } else {
          const res = await fetch("/api/buscar_reemplazos_spotify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tracks: targetTracks })
          });
          rawRes = await res.json();
        }
        const results = rawRes && Array.isArray(rawRes.tracks) ? rawRes.tracks : Array.isArray(rawRes) ? rawRes : [];
        if (!results || results.length === 0) {
          setBatchStatusMsg("No se encontraron coincidencias en Spotify.");
          alert("No se encontraron pistas oficiales en Spotify para los t\xEDtulos/artistas seleccionados.");
          return;
        }
        setBatchProgress(90);
        setBatchStatusMsg(`\u2713 ${results.length} pistas encontradas en Spotify HD. Redirigiendo a Spotify Ingest...`);
        const formattedTracks = results.map((r, i) => ({
          id: `sp_hd_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
          title: r.title,
          artist: r.artist,
          album: r.album || "Oficial Spotify HD",
          bpm: parseFloat(r.bpm) || 128,
          key: (r.key || "8A").toUpperCase(),
          cover: r.cover || null,
          duration: r.duration || "03:45",
          origin: "audit_upgrade",
          reemplazo_de: r.reemplazo_de || r.filename || null,
          original_file: r.original_file || r.filename || null,
          original_path: r.original_path || null,
          downloaded: false,
          selected: true,
          format: "FLAC",
          calidad: "Oficial Spotify HD",
          status: "Pendiente Descarga",
          spotify_id: r.spotify_id || null,
          spotify_url: r.spotify_url || null,
          isrc: r.isrc || null,
          preview_url: r.preview_url || null,
          energy: r.energy || 80,
          danceability: r.danceability || 80,
          fase_badge: r.fase_badge || null,
          comment: `Reemplazo HD para: ${r.reemplazo_de || r.filename || "Pista local"}`
        }));
        if (typeof onSendToSpotify === "function") {
          onSendToSpotify(formattedTracks, "audit_upgrade");
        } else if (typeof onNavigateTab === "function") {
          onNavigateTab("spotify");
        }
        setBatchProgress(100);
      } catch (err) {
        console.error("Error buscando reemplazos en Spotify:", err);
        setBatchStatusMsg("Error al conectar con el servicio de Spotify.");
        alert("Ocurri\xF3 un error al buscar reemplazos en Spotify: " + (err.message || err));
      } finally {
        setTimeout(() => {
          setIsSearchingSpotifyHD(false);
          setBatchProgress(0);
          setBatchStatusMsg("");
        }, 1e3);
      }
    };
    const handleTapTempo = () => {
      const now = Date.now();
      const taps = tapTimesRef.current.filter((t2) => now - t2 < 2500);
      taps.push(now);
      tapTimesRef.current = taps;
      if (taps.length >= 2) {
        const intervals = [];
        for (let i = 1; i < taps.length; i++) {
          intervals.push(taps[i] - taps[i - 1]);
        }
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const bpmCalc = 6e4 / avg;
        if (bpmCalc >= 40 && bpmCalc <= 240) {
          const formatted = bpmCalc.toFixed(2);
          updateCurrentTrackField("b", formatted);
          updateCurrentTrackField("bpm", formatted);
        }
      }
    };
    const handleMicroAjusteTrim = (deltaMs) => {
      if (!currentTrack || !currentTrack.id) return;
      const cur = parseFloat(currentTrack.trim_start_ms || 0);
      const nxt = Math.max(0, parseFloat((cur + deltaMs).toFixed(1)));
      updateCurrentTrackField("trim_start_ms", nxt);
    };
    const handleMicroAjusteDownbeat = (deltaMs) => {
      if (!currentTrack || !currentTrack.id) return;
      const cur = parseFloat(currentTrack.first_downbeat_ms || 0);
      const nxt = Math.max(0, parseFloat((cur + deltaMs).toFixed(1)));
      updateCurrentTrackField("first_downbeat_ms", nxt);
    };
    const handleAutoDetectarTrimDownbeat = async () => {
      if (!currentTrack || !currentTrack.id) return;
      const targetPath = currentTrack.path || currentTrack.f;
      if (!targetPath) return;
      setBatchProgress(25);
      setBatchStatusMsg(`Calculando Zero-Crossing y Beat 1.0.0 en ${currentTrack.t || currentTrack.title || currentTrack.f}...`);
      try {
        if (window.eel && window.eel.calcular_trim_downbeat_track) {
          const res = await window.eel.calcular_trim_downbeat_track(targetPath, currentTrack.id)();
          if (res && res.status === "ok") {
            updateCurrentTrackField("trim_start_ms", res.trim_start_ms);
            updateCurrentTrackField("first_downbeat_ms", res.first_downbeat_ms);
            setBatchProgress(100);
            setBatchStatusMsg(`\u2713 Trim: -${res.trim_start_ms}ms | Beatgrid 1.0.0: ${res.first_downbeat_ms}ms`);
          } else {
            setBatchStatusMsg("No se pudo detectar el corte de silencio.");
          }
        }
      } catch (err) {
        console.error("Error auto-detecting trim/downbeat:", err);
        setBatchStatusMsg("Error al calcular DSP.");
      } finally {
        setTimeout(() => {
          setBatchProgress(0);
          setBatchStatusMsg("");
        }, 1200);
      }
    };
    const handleAutoPhraseCues = async () => {
      if (!currentTrack || !currentTrack.id) return;
      const durMs = parseDurationMs(currentTrack.duration || "05:00");
      const bpm = parseFloat(currentTrack.b || currentTrack.bpm || 128);
      const downbeatMs = parseFloat(currentTrack.first_downbeat_ms || 0);
      setBatchProgress(40);
      setBatchStatusMsg(`Calculando 8 Hot Cues por frases musicales (16/32b) para ${currentTrack.t || currentTrack.title || currentTrack.f}...`);
      try {
        if (window.eel && window.eel.calcular_hot_cues_fraseo) {
          const res = await window.eel.calcular_hot_cues_fraseo(durMs, bpm, downbeatMs)();
          if (res && Array.isArray(res) && res.length > 0) {
            updateCurrentTrackField("cues", res);
            setBatchProgress(100);
            setBatchStatusMsg(`\u2713 8 Hot Cues anclados al Beatgrid 1.0.0 (Compases 1, 17, 33...) generados.`);
          } else {
            setBatchStatusMsg("No se pudieron generar los cues.");
          }
        }
      } catch (err) {
        console.error("Error auto-calculating hot cues:", err);
        setBatchStatusMsg("Error calculando frases.");
      } finally {
        setTimeout(() => {
          setBatchProgress(0);
          setBatchStatusMsg("");
        }, 1500);
      }
    };
    const handleEnrutarPistaActual = async () => {
      if (!currentTrack || !currentTrack.id) return;
      const targetPath = currentTrack.path || currentTrack.f;
      if (!targetPath) return;
      const gen = currentTrack.genre || "Tech House";
      const subg = currentTrack.subgenre || (TAXONOMY_TREE[gen] ? TAXONOMY_TREE[gen][0] : "General");
      setBatchProgress(40);
      setBatchStatusMsg(`Enrutando ${currentTrack.t || currentTrack.title} a crate /${gen}/${subg}...`);
      try {
        if (window.eel && window.eel.organizar_pista_en_crate) {
          const res = await window.eel.organizar_pista_en_crate(
            { ...currentTrack, genre: gen, subgenre: subg },
            destinoDescarga || "/Users/admin/Music/mi musica",
            "copy"
          )();
          if (res && res.status === "ok") {
            setBatchProgress(100);
            setBatchStatusMsg(`\u2713 Archivo enrutado con \xE9xito a /${gen}/${subg}`);
            setSaveFeedback("\u2713 Enrutado a Crate Serato");
            setTimeout(() => setSaveFeedback(""), 3e3);
          } else {
            setBatchStatusMsg(res?.msg || "Error al enrutar archivo.");
          }
        }
      } catch (err) {
        console.error("Error al enrutar pista:", err);
        setBatchStatusMsg("Error al enrutar.");
      } finally {
        setTimeout(() => {
          setBatchProgress(0);
          setBatchStatusMsg("");
        }, 1500);
      }
    };
    const handlePreescuchaOffset = (offsetMs) => {
      if (!currentTrack) return;
      const offsetSec = Math.max(0, parseFloat(offsetMs || 0) / 1e3);
      if (onPlayTrack) {
        onPlayTrack(currentTrack, 0, true, offsetSec);
      }
    };
    const handleAbrirNavegadorCarpetas = async (initialPath = "") => {
      setFsBrowserOpen(true);
      setFsLoading(true);
      const startPath = initialPath || (typeof rutaOrigen === "string" && !rutaOrigen.includes("pista") ? rutaOrigen : "") || "";
      if (window.eel && window.eel.listar_subcarpetas_sistema) {
        try {
          const res = await window.eel.listar_subcarpetas_sistema(startPath)();
          if (res) {
            setFsCurrentPath(res.current || "");
            setFsParentPath(res.parent || "");
            setFsFolders(res.folders || []);
            setFsFiles(res.files || []);
            if ((!res.folders || res.folders.length === 0) && (res.files && res.files.length > 0)) {
              setFsActiveTab("files");
            }
          }
        } catch (err) {
          console.error("Error al listar carpetas:", err);
        } finally {
          setFsLoading(false);
        }
      } else {
        setFsLoading(false);
      }
    };
    const handleNavegarACarpeta = async (targetPath) => {
      setFsLoading(true);
      if (window.eel && window.eel.listar_subcarpetas_sistema) {
        try {
          const res = await window.eel.listar_subcarpetas_sistema(targetPath)();
          if (res) {
            setFsCurrentPath(res.current || "");
            setFsParentPath(res.parent || "");
            setFsFolders(res.folders || []);
            setFsFiles(res.files || []);
            if ((!res.folders || res.folders.length === 0) && (res.files && res.files.length > 0)) {
              setFsActiveTab("files");
            }
          }
        } catch (err) {
          console.error("Error navegando:", err);
        } finally {
          setFsLoading(false);
        }
      }
    };
    const toggleStageFolder = (folderPath) => {
      setStagedFolders((prev) => {
        if (prev.includes(folderPath)) {
          return prev.filter((p) => p !== folderPath);
        } else {
          return [...prev, folderPath];
        }
      });
    };
    const toggleStageFile = (filePath) => {
      setStagedFiles((prev) => {
        if (prev.includes(filePath)) {
          return prev.filter((p) => p !== filePath);
        } else {
          return [...prev, filePath];
        }
      });
    };
    const toggleStageAllCurrentFsFiles = () => {
      const currentPaths = (fsFiles || []).map((f) => f.path);
      const allPresent = currentPaths.length > 0 && currentPaths.every((p) => stagedFiles.includes(p));
      if (allPresent) {
        setStagedFiles((prev) => prev.filter((p) => !currentPaths.includes(p)));
      } else {
        setStagedFiles((prev) => {
          const combined = /* @__PURE__ */ new Set([...prev, ...currentPaths]);
          return Array.from(combined);
        });
      }
    };
    const clearStagedSelection = () => {
      setStagedFolders([]);
      setStagedFiles([]);
      setSelectedFsFiles([]);
    };
    const handleConfirmarSeleccionLote = async () => {
      const combined = [...stagedFolders, ...stagedFiles];
      if (combined.length === 0) {
        if (fsCurrentPath) {
          setSelectedLooseFiles([]);
          setRutaOrigen(fsCurrentPath);
          setFsBrowserOpen(false);
          await handleCargarDirectorio(fsCurrentPath);
        }
        return;
      }
      setSelectedLooseFiles(stagedFiles);
      const descParts = [];
      if (stagedFolders.length > 0) descParts.push(`${stagedFolders.length} carpeta(s)`);
      if (stagedFiles.length > 0) descParts.push(`${stagedFiles.length} pista(s)`);
      setRutaOrigen(descParts.join(" + "));
      setFsBrowserOpen(false);
      await handleCargarDirectorio(combined);
    };
    const handleSeleccionarCarpetaUI = async (targetPath) => {
      const finalPath = targetPath || fsCurrentPath;
      setSelectedLooseFiles([]);
      setRutaOrigen(finalPath);
      setFsBrowserOpen(false);
      await handleCargarDirectorio(finalPath);
    };
    const handleExplorar = async () => {
      handleAbrirNavegadorCarpetas(rutaOrigen);
    };
    const resolveAuditTargets = (pathOverride) => {
      if (pathOverride) return pathOverride;
      if (selectedAuditIds && selectedAuditIds.size > 0) {
        const selectedPaths = (tracks || []).filter((t2) => selectedAuditIds.has(t2.id)).map((t2) => t2.path || t2.f).filter(Boolean);
        if (selectedPaths.length > 0) return selectedPaths;
      }
      if (stagedFolders.length > 0 || stagedFiles.length > 0) {
        return [...stagedFolders, ...stagedFiles];
      }
      if (selectedLooseFiles && selectedLooseFiles.length > 0) {
        return selectedLooseFiles;
      }
      if (rutaOrigen && typeof rutaOrigen === "string") {
        const isSynthetic = rutaOrigen.includes(" pistas") || rutaOrigen.includes(" archivos)");
        if (!isSynthetic && (rutaOrigen.startsWith("/") || rutaOrigen.includes(":\\") || rutaOrigen.length > 2)) {
          return rutaOrigen;
        }
      }
      if (tracks && tracks.length > 0) {
        const trackPaths = tracks.map((t2) => t2.path || t2.f).filter(Boolean);
        if (trackPaths.length > 0) return trackPaths;
      }
      return null;
    };
    const handleCargarDirectorio = async (pathOverride) => {
      const target = pathOverride || rutaOrigen;
      if (!target) return;
      if (window.eel && window.eel.cargar_metadatos_directorio) {
        setIsLoadingDir(true);
        setBatchProgress(5);
        const targetDesc = Array.isArray(target) ? `${target.length} pistas seleccionadas` : `archivos en ${target}`;
        setBatchStatusMsg(`Leyendo metadatos de ${targetDesc}...`);
        setSelectedTrack(null);
        try {
          const res = await window.eel.cargar_metadatos_directorio(target)();
          if (res && Array.isArray(res.tracks)) {
            setTracks(res.tracks);
            if (res.tracks.length > 0) {
              setSelectedTrack(res.tracks[0].id);
            } else {
              setSelectedTrack(null);
            }
            setMetrics({
              total: res.total || 0,
              missing: res.sin_meta || 0,
              missing_title: res.missing_title !== void 0 ? res.missing_title : res.tracks.filter((t2) => t2.missing_title).length,
              missing_artist: res.missing_artist !== void 0 ? res.missing_artist : res.tracks.filter((t2) => t2.missing_artist).length,
              missing_cover: res.missing_cover !== void 0 ? res.missing_cover : res.tracks.filter((t2) => t2.missing_cover).length,
              duplicates: res.duplicates !== void 0 ? res.duplicates : 0,
              ready: res.ready !== void 0 ? res.ready : Math.max(0, (res.total || 0) - (res.sin_meta || 0)),
              errors: res.errors || 0
            });
          } else {
            setTracks([]);
            setSelectedTrack(null);
            setMetrics({ total: 0, missing: 0, missing_title: 0, missing_artist: 0, missing_cover: 0, duplicates: 0, ready: 0, errors: 0 });
          }
          setBatchProgress(100);
          setBatchStatusMsg(`\u2713 Completado: ${res?.total || 0} pistas cargadas.`);
        } catch (e) {
          console.error("Fallo carga metadatos de directorio:", e);
          setBatchStatusMsg("Error al leer metadatos del directorio.");
        } finally {
          setTimeout(() => {
            setIsLoadingDir(false);
            setBatchProgress(0);
            setBatchStatusMsg("");
          }, 600);
        }
      }
    };
    const handleAuditar = async (pathOverride) => {
      const target = resolveAuditTargets(pathOverride);
      if (!target || Array.isArray(target) && target.length === 0) {
        alert("Por favor selecciona una carpeta o carga pistas sueltas primero.");
        return;
      }
      if (window.eel && window.eel.iniciar_auditoria && !isAuditing) {
        setIsAuditing(true);
        setBatchProgress(5);
        const targetDesc = Array.isArray(target) ? `${target.length} pistas seleccionadas` : target;
        setBatchStatusMsg(`Iniciando auditor\xEDa ac\xFAstica avanzada en ${targetDesc}...`);
        try {
          const res = await window.eel.iniciar_auditoria(target)();
          if (res && Array.isArray(res.tracks)) {
            setTracks(res.tracks);
            if (res.tracks.length > 0) {
              setSelectedTrack(res.tracks[0].id);
            }
            const badDetected = res.tracks.filter((t2) => isBadQualityTrack(t2));
            if (badDetected.length > 0) {
              setSelectedAuditIds(new Set(badDetected.map((t2) => t2.id)));
            }
            setMetrics({
              total: res.total || 0,
              missing: res.sin_meta || 0,
              missing_title: res.missing_title !== void 0 ? res.missing_title : res.tracks.filter((t2) => t2.missing_title).length,
              missing_artist: res.missing_artist !== void 0 ? res.missing_artist : res.tracks.filter((t2) => t2.missing_artist).length,
              missing_cover: res.missing_cover !== void 0 ? res.missing_cover : res.tracks.filter((t2) => t2.missing_cover).length,
              duplicates: res.duplicates !== void 0 ? res.duplicates : 0,
              ready: res.ready !== void 0 ? res.ready : Math.max(0, (res.total || 0) - (res.sin_meta || 0)),
              errors: res.errors !== void 0 ? res.errors : res.tracks.filter((x) => Boolean(x.es_fake) || x.format === "FLAC" && String(x.status).includes("Fake")).length
            });
          }
          setBatchProgress(100);
          setBatchStatusMsg(`\u2713 Auditor\xEDa completada: ${res?.total || 0} pistas procesadas.`);
        } catch (e) {
          console.error("Fallo auditor\xEDa:", e);
          setBatchStatusMsg("Error durante la auditor\xEDa.");
        } finally {
          setTimeout(() => {
            setIsAuditing(false);
            setBatchProgress(0);
            setBatchStatusMsg("");
          }, 600);
        }
      }
    };
    const handleExportarXLS = async () => {
      if (!tracks || tracks.length === 0) {
        alert("No hay pistas auditadas para exportar.");
        return;
      }
      if (window.eel && window.eel.exportar_auditoria_xls) {
        setIsExporting(true);
        setBatchProgress(25);
        setBatchStatusMsg("Generando reporte de auditor\xEDa en formato Excel (XLSX)...");
        try {
          const res = await window.eel.exportar_auditoria_xls(tracks, rutaOrigen)();
          setBatchProgress(100);
          if (res && res.status === "ok") {
            const nombreArchivo = res.path ? res.path.split("/").pop() : "CleanDJmix_Audit_Respaldo.xlsx";
            setBatchStatusMsg(`\u2713 Exportado con \xE9xito: ${nombreArchivo}`);
            setSaveFeedback(`\u2713 Exportado con \xE9xito: ${nombreArchivo}`);
            setTimeout(() => setSaveFeedback(""), 4e3);
          } else {
            setBatchStatusMsg("Error al exportar a Excel.");
            alert(res?.msg || "Error al exportar a Excel.");
          }
        } catch (e) {
          console.error("Error al exportar XLS:", e);
          setBatchStatusMsg("Error durante la exportaci\xF3n.");
          alert("Error al exportar reporte XLS.");
        } finally {
          setTimeout(() => {
            setIsExporting(false);
            setBatchProgress(0);
            setBatchStatusMsg("");
          }, 800);
        }
      }
    };
    const handleExportarSeratoCrates = async () => {
      if (!tracks || tracks.length === 0) {
        alert("No hay pistas auditadas para exportar.");
        return;
      }
      if (window.eel && window.eel.exportar_serato_crates) {
        setIsExporting(true);
        setBatchProgress(40);
        setBatchStatusMsg("Generando archivos .crate oficiales para Serato DJ Pro...");
        try {
          const res = await window.eel.exportar_serato_crates(tracks)();
          setBatchProgress(100);
          if (res && res.status === "ok") {
            setBatchStatusMsg(`\u2713 ${res.total_crates} crates generados en ~/Music/_Serato_/Subcrates`);
            setSaveFeedback(`\u2713 ${res.total_crates} crates exportados a Serato`);
            setTimeout(() => setSaveFeedback(""), 4e3);
          } else {
            setBatchStatusMsg("Error al exportar crates de Serato.");
            alert(res?.msg || "Error al exportar crates de Serato.");
          }
        } catch (e) {
          console.error("Error al exportar crates Serato:", e);
          setBatchStatusMsg("Error durante la exportaci\xF3n.");
        } finally {
          setTimeout(() => {
            setIsExporting(false);
            setBatchProgress(0);
            setBatchStatusMsg("");
          }, 1e3);
        }
      }
    };
    const handleExportarRekordboxXml = async () => {
      if (!tracks || tracks.length === 0) {
        alert("No hay pistas auditadas para exportar.");
        return;
      }
      if (window.eel && window.eel.exportar_rekordbox_xml) {
        setIsExporting(true);
        setBatchProgress(40);
        setBatchStatusMsg("Generando archivo rekordbox.xml est\xE1ndar Pioneer DJ...");
        try {
          const targetDir = rutaOrigen || "/Users/admin/Music/mi musica";
          const res = await window.eel.exportar_rekordbox_xml(tracks, targetDir, "rekordbox.xml")();
          setBatchProgress(100);
          if (res && res.status === "ok") {
            setBatchStatusMsg(`\u2713 rekordbox.xml generado exitosamente (${res.total_tracks} pistas, ${res.playlists} playlists)`);
            setSaveFeedback(`\u2713 rekordbox.xml generado en ${res.path}`);
            setTimeout(() => setSaveFeedback(""), 4e3);
          } else {
            setBatchStatusMsg("Error al exportar rekordbox.xml.");
            alert(res?.msg || "Error al exportar rekordbox.xml.");
          }
        } catch (e) {
          console.error("Error al exportar rekordbox XML:", e);
          setBatchStatusMsg("Error durante la exportaci\xF3n.");
        } finally {
          setTimeout(() => {
            setIsExporting(false);
            setBatchProgress(0);
            setBatchStatusMsg("");
          }, 1e3);
        }
      }
    };
    const handleAbrirFftModal = async (trackParaAnalisis) => {
      const trk = trackParaAnalisis || currentTrack;
      const targetPath = trk?.path || trk?.f;
      if (!targetPath) {
        alert("No hay ruta de archivo disponible para el an\xE1lisis espectral FFT.");
        return;
      }
      setFftModalOpen(true);
      setIsAnalyzingFft(true);
      setFftAnalysisData(null);
      if (window.eel && window.eel.analizar_espectro_fft) {
        try {
          const res = await window.eel.analizar_espectro_fft(targetPath, trk.id)();
          setFftAnalysisData(res);
          if (res && res.cutoff_khz !== void 0) {
            updateCurrentTrackField("cutoff_khz", res.cutoff_khz);
            if (res.estado) {
              updateCurrentTrackField("status", res.estado);
            }
          }
        } catch (err) {
          console.error("Error al ejecutar an\xE1lisis FFT:", err);
        } finally {
          setIsAnalyzingFft(false);
        }
      } else {
        setIsAnalyzingFft(false);
      }
    };
    const handleGuardarTrack = async () => {
      if (!currentTrack) return;
      setIsInjecting(true);
      setBatchProgress(30);
      setBatchStatusMsg(`Inyectando tags ID3v2.4 y marcas Serato en ${currentTrack.t || currentTrack.title || currentTrack.f}...`);
      try {
        if (window.eel && window.eel.guardar_cambios_track) {
          const res = await window.eel.guardar_cambios_track(currentTrack)();
          if (res && res.status === "ok") {
            setBatchProgress(100);
            setBatchStatusMsg("\u2713 Inyecci\xF3n completada y guardada en disco.");
            setSaveFeedback("\u2713 Guardado en disco e inyectado");
            setTimeout(() => setSaveFeedback(""), 3e3);
          } else {
            setBatchStatusMsg(res?.msg || "Error al inyectar metadatos.");
            alert(res?.msg || "Error al inyectar metadatos.");
          }
        }
      } catch (err) {
        setBatchStatusMsg("Error al inyectar metadatos.");
      } finally {
        setTimeout(() => {
          setIsInjecting(false);
          setBatchProgress(0);
          setBatchStatusMsg("");
        }, 800);
      }
    };
    const handleInyectarCaratulasLote = async () => {
      if (!tracks || tracks.length === 0) {
        alert("No hay pistas cargadas para inyectar car\xE1tulas.");
        return;
      }
      setIsInjecting(true);
      setBatchProgress(5);
      setBatchStatusMsg(`Buscando e inyectando car\xE1tulas 1:1 en ${tracks.length} pistas...`);
      try {
        if (window.eel && window.eel.inyectar_caratulas_lote) {
          const res = await window.eel.inyectar_caratulas_lote(tracks)();
          setBatchProgress(100);
          if (res && res.status === "ok") {
            setBatchStatusMsg(`\u2713 Car\xE1tulas actualizadas: ${res.actualizadas} pistas con artwork.`);
            setSaveFeedback(`\u2713 ${res.actualizadas} car\xE1tulas incrustadas en archivos`);
            setTimeout(() => setSaveFeedback(""), 4e3);
          } else {
            setBatchStatusMsg("Error al inyectar car\xE1tulas.");
          }
        }
      } catch (e) {
        console.error("Error al inyectar car\xE1tulas:", e);
        setBatchStatusMsg("Fallo durante la inyecci\xF3n de car\xE1tulas.");
      } finally {
        setTimeout(() => {
          setIsInjecting(false);
          setBatchProgress(0);
          setBatchStatusMsg("");
        }, 1e3);
      }
    };
    const handleSanitizarMetadatos = async () => {
      if (!tracks || tracks.length === 0) {
        alert("No hay pistas cargadas para sanitizar.");
        return;
      }
      setIsInjecting(true);
      setBatchProgress(10);
      setBatchStatusMsg(`Higienizando metadatos, eliminando spam promocional y normalizando feats en ${tracks.length} pistas...`);
      try {
        let res = null;
        if (window.eel && window.eel.sanitizar_metadatos_pistas) {
          res = await window.eel.sanitizar_metadatos_pistas(tracks, false)();
        } else {
          const resp = await fetch("/api/sanitizar_metadatos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tracks, guardar_en_disco: false })
          });
          if (resp.ok) res = await resp.json();
        }
        if (res && res.status === "ok") {
          if (res.tracks && res.tracks.length > 0) {
            setTracks(res.tracks);
          }
          setBatchProgress(100);
          const msg = `\u2713 Higienizaci\xF3n DJ completada: ${res.modificados} pista(s) corregidas (spam eliminado, feats normalizados, versiones etiquetadas).`;
          setBatchStatusMsg(msg);
          setSaveFeedback(msg);
          setTimeout(() => setSaveFeedback(""), 5e3);
        } else {
          setBatchStatusMsg("No se detect\xF3 spam o modificaciones pendientes.");
        }
      } catch (e) {
        console.error("Error al sanitizar etiquetas:", e);
        setBatchStatusMsg("Fallo durante la higienizaci\xF3n de etiquetas.");
      } finally {
        setTimeout(() => {
          setIsInjecting(false);
          setBatchProgress(0);
          setBatchStatusMsg("");
        }, 1200);
      }
    };
    const handleGuardarTodoEnFicheros = async () => {
      if (!tracks || tracks.length === 0) {
        alert("No hay pistas cargadas para guardar.");
        return;
      }
      setIsInjecting(true);
      setBatchProgress(5);
      setBatchStatusMsg(`Guardando todos los metadatos en ${tracks.length} archivos f\xEDsicos...`);
      try {
        if (window.eel && window.eel.inyectar_lote_metadatos) {
          const res = await window.eel.inyectar_lote_metadatos(tracks)();
          setBatchProgress(100);
          if (res && res.status === "ok") {
            setBatchStatusMsg(`\u2713 Guardado completo: ${res.inyectados} archivos actualizados en disco con \xE9xito.`);
            setSaveFeedback(`\u2713 ${res.inyectados} archivos guardados con metadatos completos`);
            setTimeout(() => setSaveFeedback(""), 4e3);
          } else {
            setBatchStatusMsg("Error durante el guardado de archivos.");
          }
        }
      } catch (e) {
        console.error("Error al guardar todo en ficheros:", e);
        setBatchStatusMsg("Error al guardar metadatos.");
      } finally {
        setTimeout(() => {
          setIsInjecting(false);
          setBatchProgress(0);
          setBatchStatusMsg("");
        }, 1e3);
      }
    };
    const handleInyectarSeratoLote = handleGuardarTodoEnFicheros;
    const handleCancelarProceso = async () => {
      try {
        fetch("/api/cancelar_procesos", { method: "POST" }).catch(() => {
        });
      } catch (e) {
      }
      if (window.eel && window.eel.cancelar_procesos_activos) {
        try {
          await window.eel.cancelar_procesos_activos()();
        } catch (e) {
          console.error("Error al cancelar procesos:", e);
        }
      }
      setIsAuditing(false);
      setIsLoadingDir(false);
      setIsInjecting(false);
      setIsExporting(false);
      setBatchProgress(0);
      setBatchStatusMsg(lang === "en" ? "\u2715 Process stopped by user." : "\u2715 Proceso cancelado por el usuario.");
      setTimeout(() => setBatchStatusMsg(""), 2500);
    };
    const [auditSortField, setAuditSortField] = useState("id");
    const [auditSortDir, setAuditSortDir] = useState("asc");
    const [filterHeaderSearch, setFilterHeaderSearch] = useState("");
    const [filterHeaderFormat, setFilterHeaderFormat] = useState("ALL");
    const [filterHeaderQuality, setFilterHeaderQuality] = useState("ALL");
    const [filterHeaderStatus, setFilterHeaderStatus] = useState("ALL");
    const [filterHeaderEnergy, setFilterHeaderEnergy] = useState("ALL");
    const [filterHeaderDance, setFilterHeaderDance] = useState("ALL");
    const handleSortAudit = (field) => {
      setAuditSortDir((prev) => auditSortField === field && prev === "asc" ? "desc" : "asc");
      setAuditSortField(field);
    };
    const renderSortArrowAudit = (field) => {
      if (auditSortField !== field) return /* @__PURE__ */ React.createElement("span", { className: "text-gray-600 ml-1 text-[9px]" }, "\u2195");
      return /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 ml-1 font-bold text-[10px]" }, auditSortDir === "asc" ? "\u25B2" : "\u25BC");
    };
    const tracksFiltrados = useMemo(() => {
      const parsed = busqueda && busqueda.length > 2 ? parseAIDJQuery(busqueda) : null;
      let result = tracks.filter((t2) => {
        const term = busqueda.toLowerCase();
        if (parsed && parsed.tokens && parsed.tokens.length > 0) {
          if (parsed.targetBpm) {
            const trkBpm = parseFloat(t2?.bpm || t2?.b) || 0;
            if (trkBpm > 0 && Math.abs(trkBpm - parsed.targetBpm) > 4.5) return false;
          } else if (parsed.minBpm && parsed.maxBpm) {
            const trkBpm = parseFloat(t2?.bpm || t2?.b) || 0;
            if (trkBpm < parsed.minBpm || trkBpm > parsed.maxBpm) return false;
          }
          if (parsed.key) {
            const trkKey = (t2?.key || t2?.k || "").toUpperCase();
            if (trkKey !== parsed.key && !parsed.compatibleKeys.includes(trkKey)) return false;
          }
          if (parsed.acousticRole) {
            if (t2?.acoustic_role !== parsed.acousticRole) return false;
          }
          if (parsed.minEnergy) {
            const trkE = Number(t2?.e || t2?.energy || 80);
            if (trkE < parsed.minEnergy) return false;
          }
          if (parsed.maxEnergy) {
            const trkE = Number(t2?.e || t2?.energy || 80);
            if (trkE > parsed.maxEnergy) return false;
          }
          if (parsed.subgenre) {
            const sub = (t2?.subgenre || t2?.genre || "").toLowerCase();
            if (!sub.includes(parsed.subgenre.toLowerCase())) return false;
          } else if (parsed.genre) {
            const g = (t2?.genre || "").toLowerCase();
            if (!g.includes(parsed.genre.toLowerCase())) return false;
          }
        } else {
          const m = (t2?.t || t2?.title || "").toLowerCase().includes(term) || (t2?.a || t2?.artist || "").toLowerCase().includes(term) || (t2?.f || t2?.filename || "").toLowerCase().includes(term);
          if (!m) return false;
        }
        if (filtro === "missing") return t2?.b === "--" || t2?.k === "--";
        if (filtro === "missing_title") return Boolean(t2?.missing_title || !t2?.title || t2?.title.toLowerCase().trim() === "untitled");
        if (filtro === "missing_artist") return Boolean(t2?.missing_artist || !t2?.artist || t2?.artist.toLowerCase().trim() === "desconocido");
        if (filtro === "missing_cover") return Boolean(t2?.missing_cover || !t2?.cover);
        if (filtro === "error") return Boolean(t2?.es_fake) || t2?.format === "FLAC" && String(t2?.status || "").includes("Fake");
        if (filtro === "bad_quality") return isBadQualityTrack(t2);
        if (filterHeaderSearch) {
          const hTerm = filterHeaderSearch.toLowerCase();
          const matchHeader = (t2?.t || t2?.title || "").toLowerCase().includes(hTerm) || (t2?.a || t2?.artist || "").toLowerCase().includes(hTerm) || (t2?.f || t2?.filename || "").toLowerCase().includes(hTerm);
          if (!matchHeader) return false;
        }
        if (filterHeaderFormat !== "ALL") {
          if (String(t2?.format || "").toUpperCase() !== filterHeaderFormat) return false;
        }
        if (filterHeaderQuality !== "ALL") {
          if (!String(t2?.calidad || "").toLowerCase().includes(filterHeaderQuality.toLowerCase())) return false;
        }
        if (filterHeaderStatus !== "ALL") {
          const isFake = Boolean(t2?.es_fake || t2?.format === "FLAC" && String(t2?.status || "").includes("Fake"));
          if (filterHeaderStatus === "FAKE" && !isFake) return false;
          if (filterHeaderStatus === "LOSSLESS" && (isFake || !String(t2?.status || "").includes("Lossless") && !String(t2?.status || "").includes("VERDADERO") && !String(t2?.status || "").includes("HI-RES"))) return false;
          if (filterHeaderStatus === "MP3" && (t2?.format !== "MP3" && !String(t2?.status || "").includes("MP3"))) return false;
        }
        if (filterHeaderEnergy !== "ALL") {
          const eVal = Number(t2?.e || t2?.energy || 80);
          if (filterHeaderEnergy === "HIGH" && eVal < 80) return false;
          if (filterHeaderEnergy === "MED" && (eVal < 65 || eVal >= 80)) return false;
          if (filterHeaderEnergy === "LOW" && eVal >= 65) return false;
        }
        if (filterHeaderDance !== "ALL") {
          const dVal = Number(t2?.dance || t2?.danceability || 80);
          if (filterHeaderDance === "HIGH" && dVal < 80) return false;
          if (filterHeaderDance === "MED" && (dVal < 65 || dVal >= 80)) return false;
          if (filterHeaderDance === "LOW" && dVal >= 65) return false;
        }
        if (filterHeaderAcousticRole !== "ALL") {
          if (t2?.acoustic_role !== filterHeaderAcousticRole) return false;
        }
        return true;
      });
      result.sort((a, b) => {
        let valA = a[auditSortField];
        let valB = b[auditSortField];
        if (auditSortField === "title") {
          valA = a.t || a.title || "";
          valB = b.t || b.title || "";
        } else if (auditSortField === "artist") {
          valA = a.a || a.artist || "";
          valB = b.a || b.artist || "";
        } else if (auditSortField === "bpm") {
          valA = parseFloat(a.b || a.bpm) || 0;
          valB = parseFloat(b.b || b.bpm) || 0;
        } else if (auditSortField === "key") {
          valA = a.k || a.key || "";
          valB = b.k || b.key || "";
        } else if (auditSortField === "duration") {
          const parseSec = (d) => {
            if (!d || !d.includes(":")) return 0;
            const p = d.split(":");
            return parseInt(p[0]) * 60 + parseFloat(p[1]);
          };
          valA = parseSec(a.duration);
          valB = parseSec(b.duration);
        } else if (["id", "cutoff_khz", "sample_rate_khz", "bitrate_kbps", "e", "dance"].includes(auditSortField)) {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else if (auditSortField === "fase_badge" || auditSortField === "mood") {
          valA = a.fase_badge || a.mood || "";
          valB = b.fase_badge || b.mood || "";
        } else if (auditSortField === "comment") {
          valA = a.comment || "";
          valB = b.comment || "";
        }
        if (typeof valA === "number" && typeof valB === "number") {
          return auditSortDir === "asc" ? valA - valB : valB - valA;
        }
        return auditSortDir === "asc" ? String(valA || "").localeCompare(String(valB || "")) : String(valB || "").localeCompare(String(valA || ""));
      });
      return result;
    }, [tracks, busqueda, filtro, filterHeaderSearch, filterHeaderFormat, filterHeaderQuality, filterHeaderStatus, filterHeaderEnergy, filterHeaderDance, auditSortField, auditSortDir]);
    const handleToggleSelectAllVisible = () => {
      const visibleIds = (tracksFiltrados || []).map((t2) => t2.id);
      if (visibleIds.length === 0) return;
      const allVisibleSelected = visibleIds.every((id) => selectedAuditIds.has(id));
      if (allVisibleSelected) {
        setSelectedAuditIds((prev) => {
          const next = new Set(prev);
          visibleIds.forEach((id) => next.delete(id));
          return next;
        });
      } else {
        setSelectedAuditIds((prev) => {
          const next = new Set(prev);
          visibleIds.forEach((id) => next.add(id));
          return next;
        });
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "flex w-full h-full overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "p-3.5 border-b border-djzinc-800 bg-djzinc-950 flex flex-wrap justify-between items-center shrink-0 gap-3" }, /* @__PURE__ */ React.createElement("div", { "data-tour": "tour-audit-select", className: "flex gap-2.5 items-center" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleExplorar,
        className: "bg-djcyan-500 hover:bg-djcyan-400 text-black font-black px-4 py-1.5 rounded-lg text-xs shadow-md shadow-djcyan-500/20 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 font-mono",
        title: "Seleccionar carpetas completas y/o pistas sueltas navegando libremente por la biblioteca"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4C2}"),
      /* @__PURE__ */ React.createElement("span", null, "Seleccionar")
    ), tracks && tracks.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-3 py-1 rounded-lg bg-djzinc-900 border border-djzinc-750 text-xs font-mono text-gray-300 shadow-sm max-w-sm truncate", title: typeof rutaOrigen === "string" ? rutaOrigen : "Selecci\xF3n m\xFAltiple" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-djgreen-400 shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: "truncate" }, typeof rutaOrigen === "string" && rutaOrigen ? rutaOrigen.split("/").pop() || rutaOrigen : "Colecci\xF3n Activa"), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 bg-djzinc-800 text-djcyan-300 font-bold rounded text-[10px] shrink-0 border border-djzinc-700" }, tracks.length, " pistas")) : /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-gray-500 italic px-2" }, "Ninguna carpeta o pista seleccionada"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleCargarDirectorio(resolveAuditTargets()),
        className: "px-2.5 py-1.5 bg-djzinc-850 hover:bg-djzinc-800 text-gray-300 rounded-lg border border-djzinc-700 cursor-pointer shadow transition-all shrink-0 active:scale-95 text-xs font-mono",
        title: "Recargar selecci\xF3n actual"
      },
      "\u{1F504}"
    )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2.5 items-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 bg-djzinc-900/90 p-1 rounded-lg border border-djzinc-800 shadow-sm" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setBatchModalOpen(true), className: "bg-djzinc-800 hover:bg-djzinc-750 border border-djzinc-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors font-mono", title: "Configurar opciones avanzadas de auditor\xEDa por lotes y car\xE1tulas" }, /* @__PURE__ */ React.createElement(Icons.Sliders, null), " ", t("btn_audit_batch") || "Configurar"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleAuditar(), disabled: isAuditing, className: "bg-djcyan-500 hover:bg-djcyan-400 disabled:opacity-50 text-black px-3.5 py-1.5 rounded-lg font-black text-xs shadow-md shadow-djcyan-500/25 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 font-mono" }, /* @__PURE__ */ React.createElement(Icons.Library, null), " ", isAuditing ? lang === "en" ? "Auditing..." : "Auditando..." : t("btn_execute_audit") || "Auditar Todo")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 bg-djzinc-900/90 p-1 rounded-lg border border-djzinc-800 shadow-sm" }, /* @__PURE__ */ React.createElement("button", { onClick: handleInyectarCaratulasLote, disabled: isInjecting || tracks.length === 0, className: "bg-djzinc-800 hover:bg-djzinc-750 text-gray-300 hover:text-white border border-djzinc-700 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow disabled:opacity-50 transition-colors font-mono", title: "Detecta o busca car\xE1tulas 1:1 e incrusta artwork (600x600) en todos los archivos de audio" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F5BC}\uFE0F"), /* @__PURE__ */ React.createElement("span", null, t("btn_inject_covers") || "Car\xE1tulas")), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleSanitizarMetadatos,
        disabled: isInjecting || tracks.length === 0,
        className: "bg-djzinc-800 hover:bg-djzinc-750 text-gray-300 hover:text-white border border-djzinc-700 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow disabled:opacity-50 transition-colors font-mono",
        title: "Higieniza etiquetas: elimina spam [Free Download], URLs, calidades y normaliza feats y versiones DJ"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F9F9}"),
      /* @__PURE__ */ React.createElement("span", null, "Limpiar Tags")
    ), flacUpgradeTracks.length > 0 && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleBuscarReemplazosSpotify(flacUpgradeTracks),
        disabled: isSearchingSpotifyHD || isAuditing,
        className: "bg-djzinc-800 hover:bg-djzinc-750 text-djcyan-400 border border-djcyan-500/40 hover:border-djcyan-400 disabled:opacity-40 text-xs font-mono font-bold px-3 py-1.5 rounded-lg shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1.5",
        title: "Detectados archivos FLAC que no cumplen con calidad Lossless (calidad media o transcode). Buscar masters oficiales en Spotify"
      },
      /* @__PURE__ */ React.createElement("span", { className: isSearchingSpotifyHD ? "animate-spin" : "" }, isSearchingSpotifyHD ? "\u23F3" : "\u{1F48E}"),
      /* @__PURE__ */ React.createElement("span", null, "SuperFLAC"),
      /* @__PURE__ */ React.createElement("span", { className: "bg-djcyan-950 text-djcyan-300 text-[10px] px-1.5 py-0.2 rounded border border-djcyan-500/50 font-mono" }, flacUpgradeTracks.length)
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => handleBuscarReemplazosSpotify(),
        disabled: isSearchingSpotifyHD || isAuditing || selectedAuditIds.size === 0 && badQualityTracks.length === 0,
        className: "bg-djzinc-800 hover:bg-djzinc-750 text-gray-300 hover:text-white border border-djzinc-700 disabled:opacity-40 font-mono font-bold px-3 py-1.5 rounded-lg text-xs shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1.5",
        title: "Buscar versiones oficiales en Spotify Ingest para sustituir pistas de baja calidad o transcodes"
      },
      /* @__PURE__ */ React.createElement("span", { className: isSearchingSpotifyHD ? "animate-spin" : "" }, isSearchingSpotifyHD ? "\u23F3" : "\u{1F4E5}"),
      /* @__PURE__ */ React.createElement("span", null, isSearchingSpotifyHD ? "Buscando..." : "Reemplazos HD"),
      (selectedAuditIds.size > 0 || badQualityTracks.length > 0) && /* @__PURE__ */ React.createElement("span", { className: "bg-djzinc-950 text-amber-400 text-[10px] px-1.5 py-0.2 rounded border border-amber-600/50 font-mono" }, selectedAuditIds.size > 0 ? selectedAuditIds.size : badQualityTracks.length)
    )), /* @__PURE__ */ React.createElement("div", { "data-tour": "tour-export-crates", className: "flex items-center bg-[#09090f] p-1 rounded-lg border border-djzinc-800 shadow-inner" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono font-bold text-gray-500 uppercase px-2 hidden lg:inline" }, "Exportar:"), /* @__PURE__ */ React.createElement("button", { onClick: handleExportarXLS, disabled: tracks.length === 0, className: "px-2.5 py-1 rounded-md text-xs font-mono font-bold text-gray-300 hover:text-white hover:bg-djzinc-800 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40", title: "Exportar reporte de auditor\xEDa a Excel (.xlsx / .csv)" }, /* @__PURE__ */ React.createElement(Icons.Excel, null), " XLS"), /* @__PURE__ */ React.createElement("button", { onClick: handleExportarSeratoCrates, disabled: tracks.length === 0, className: "px-2.5 py-1 rounded-md text-xs font-mono font-bold text-gray-300 hover:text-white hover:bg-djzinc-800 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40", title: "Exportar archivos .crate oficiales a Serato DJ Pro" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4BD}"), " Crates"), /* @__PURE__ */ React.createElement("button", { onClick: handleExportarRekordboxXml, disabled: tracks.length === 0, className: "px-2.5 py-1 rounded-md text-xs font-mono font-bold text-gray-300 hover:text-white hover:bg-djzinc-800 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40", title: "Exportar rekordbox.xml est\xE1ndar Pioneer DJ" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"), " Rekordbox")), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleGuardarTodoEnFicheros,
        disabled: isInjecting || tracks.length === 0,
        className: "bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black px-3.5 py-1.5 rounded-lg font-black text-xs shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 font-mono",
        title: "Guarda y persiste todos los metadatos editados directamente en los archivos f\xEDsicos de audio en disco"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4BE}"),
      /* @__PURE__ */ React.createElement("span", null, t("btn_save_all") || "Guardar en Archivos", " (", tracks.length, ")")
    ), (isAuditing || isLoadingDir || isInjecting || isExporting || batchProgress > 0) && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleCancelarProceso,
        className: "bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/60 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 font-mono",
        title: "Detener el proceso actual inmediatamente"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u2715"),
      /* @__PURE__ */ React.createElement("span", null, t("btn_cancel") || "Cancelar")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setSidebarOpen((prev) => !prev),
        className: `px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${sidebarOpen ? "bg-djcyan-950 text-djcyan-400 border-djcyan-700/60 shadow-inner" : "bg-djzinc-900 text-gray-400 border-djzinc-750 hover:text-white"}`,
        title: sidebarOpen ? "Ocultar panel inspector" : "Mostrar panel inspector"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u25E8"),
      /* @__PURE__ */ React.createElement("span", null, t("btn_inspector") || "Inspector")
    ))), (isAuditing || isLoadingDir || isExporting || isInjecting || batchProgress > 0) && /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900 border-b border-djzinc-800 px-4 py-2.5 flex flex-col gap-1.5 shrink-0 transition-all" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-xs font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-semibold truncate flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-djcyan-400 animate-pulse" }), batchStatusMsg || (isLoadingDir ? "Leyendo metadatos de archivos..." : isAuditing ? "Auditando biblioteca..." : isExporting ? "Generando Excel..." : isInjecting ? "Inyectando metadatos..." : "Procesando...")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-300 font-bold" }, batchProgress, "%"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleCancelarProceso,
        className: "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 hover:bg-red-900 text-red-300 border border-red-750 cursor-pointer transition-colors shadow flex items-center gap-1"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u2715"),
      /* @__PURE__ */ React.createElement("span", null, t("btn_cancel") || "Cancelar")
    ))), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-djzinc-950 h-2 rounded-full overflow-hidden border border-djzinc-800 shadow-inner" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "bg-gradient-to-r from-djcyan-500 to-djgreen-400 h-full transition-all duration-300 ease-out shadow-lg shadow-djcyan-500/50",
        style: { width: `${Math.max(5, Math.min(100, batchProgress))}%` }
      }
    ))), /* @__PURE__ */ React.createElement("div", { "data-tour": "tour-audit-table", className: "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-px bg-djzinc-800 border-b border-djzinc-800 shrink-0" }, /* @__PURE__ */ React.createElement("div", { onClick: () => setFiltro("todos"), className: `p-3.5 flex flex-col justify-center cursor-pointer transition-colors ${filtro === "todos" ? "bg-djcyan-950/40 border-b-2 border-djcyan-400" : "bg-djzinc-950 hover:bg-djzinc-900"}` }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-bold uppercase mb-1" }, t("metric_total") || "Total Pistas"), /* @__PURE__ */ React.createElement("span", { className: "text-xl font-mono text-white font-bold" }, (metrics.total || 0).toLocaleString())), /* @__PURE__ */ React.createElement("div", { onClick: () => setFiltro(filtro === "bad_quality" ? "todos" : "bad_quality"), className: `p-3.5 flex flex-col justify-center cursor-pointer transition-colors ${filtro === "bad_quality" ? "bg-amber-950/50 border-b-2 border-amber-400" : "bg-djzinc-950 hover:bg-djzinc-900"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-bold uppercase" }, "Mala Calidad"), badQualityTracks.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "text-[8px] bg-amber-900 text-amber-200 px-1 rounded font-mono font-bold" }, "HD")), /* @__PURE__ */ React.createElement("span", { className: `text-xl font-mono font-bold ${badQualityTracks.length > 0 ? "text-amber-400 animate-pulse" : "text-gray-400"}` }, badQualityTracks.length.toLocaleString())), /* @__PURE__ */ React.createElement("div", { onClick: () => setFiltro("missing"), className: `p-3.5 flex flex-col justify-center cursor-pointer transition-colors ${filtro === "missing" ? "bg-amber-950/40 border-b-2 border-amber-400" : "bg-djzinc-950 hover:bg-djzinc-900"}` }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-bold uppercase mb-1" }, "Falta BPM/Key"), /* @__PURE__ */ React.createElement("span", { className: "text-xl font-mono text-amber-400 font-bold" }, (metrics.missing || 0).toLocaleString())), /* @__PURE__ */ React.createElement("div", { onClick: () => setFiltro("missing_title"), className: `p-3.5 flex flex-col justify-center cursor-pointer transition-colors ${filtro === "missing_title" ? "bg-amber-950/40 border-b-2 border-amber-400" : "bg-djzinc-950 hover:bg-djzinc-900"}` }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-bold uppercase mb-1" }, "Falta T\xEDtulo"), /* @__PURE__ */ React.createElement("span", { className: "text-xl font-mono text-amber-300 font-bold" }, (metrics.missing_title || 0).toLocaleString())), /* @__PURE__ */ React.createElement("div", { onClick: () => setFiltro("missing_artist"), className: `p-3.5 flex flex-col justify-center cursor-pointer transition-colors ${filtro === "missing_artist" ? "bg-amber-950/40 border-b-2 border-amber-400" : "bg-djzinc-950 hover:bg-djzinc-900"}` }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-bold uppercase mb-1" }, "Falta Artista"), /* @__PURE__ */ React.createElement("span", { className: "text-xl font-mono text-amber-300 font-bold" }, (metrics.missing_artist || 0).toLocaleString())), /* @__PURE__ */ React.createElement("div", { onClick: () => setFiltro("missing_cover"), className: `p-3.5 flex flex-col justify-center cursor-pointer transition-colors ${filtro === "missing_cover" ? "bg-amber-950/40 border-b-2 border-amber-400" : "bg-djzinc-950 hover:bg-djzinc-900"}` }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-bold uppercase mb-1" }, "Falta Cover"), /* @__PURE__ */ React.createElement("span", { className: "text-xl font-mono text-amber-300 font-bold" }, (metrics.missing_cover || 0).toLocaleString())), /* @__PURE__ */ React.createElement("div", { onClick: () => setDuplicateModalOpen(true), className: "p-3.5 bg-djzinc-950 hover:bg-djzinc-900 flex flex-col justify-center cursor-pointer transition-colors group" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-bold uppercase" }, "Duplicados"), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono text-amber-400 bg-amber-950/80 px-1 rounded border border-amber-800" }, "Comparar \u2696\uFE0F")), /* @__PURE__ */ React.createElement("span", { className: "text-xl font-mono text-amber-400 font-bold group-hover:text-amber-300" }, (metrics.duplicates || 0).toLocaleString())), /* @__PURE__ */ React.createElement("div", { onClick: () => setFiltro("error"), className: `p-3.5 flex flex-col justify-center cursor-pointer transition-colors ${filtro === "error" ? "bg-red-950/40 border-b-2 border-red-400" : "bg-djzinc-950 hover:bg-djzinc-900"}` }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-bold uppercase mb-1" }, t("metric_lossless") || "Cert. Lossless"), /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl font-mono text-djcyan-400 font-bold" }, tracks.filter((t2) => t2.cutoff_khz && !String(t2.status || "").includes("Fake")).length), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-500" }, "/ ", tracks.length, " PASS")))), /* @__PURE__ */ React.createElement("div", { className: "px-4 py-2 bg-djzinc-900 border-b border-djzinc-800 flex items-center justify-between shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-1 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: busqueda,
        onChange: (e) => setBusqueda(e.target.value),
        placeholder: t("search_placeholder") || "Buscar (ej: Tech House 126 bpm 8A en\xE9rgico con vocales)...",
        className: "w-72 bg-djzinc-950 border border-djzinc-700 rounded-full px-4 py-1.5 text-xs text-gray-300 focus:border-djcyan-500 outline-none font-mono"
      }
    ), (() => {
      const p = busqueda && busqueda.length > 2 ? parseAIDJQuery(busqueda) : null;
      if (!p || !p.tokens || p.tokens.length === 0) return null;
      return /* @__PURE__ */ React.createElement("div", { className: "hidden lg:flex items-center gap-1.5 flex-wrap" }, p.tokens.map((tok, tIdx) => /* @__PURE__ */ React.createElement("span", { key: tIdx, className: "px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-djcyan-950 text-djcyan-300 border border-djcyan-500/50 shadow-sm animate-fadeIn" }, tok.label)));
    })()), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5 ml-0 sm:ml-1 overflow-x-auto scrollbar-none pb-1 max-w-full items-center" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setFiltro("todos"),
        className: `px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all border ${filtro === "todos" ? "bg-djcyan-500 text-black border-djcyan-400 font-black shadow-sm shadow-djcyan-500/20" : "bg-djzinc-900 text-gray-400 hover:text-white border-djzinc-800 hover:border-djzinc-700"}`
      },
      t("filter_all") || "Todos",
      " (",
      metrics.total || 0,
      ")"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleSelectAllBadQuality,
        disabled: badQualityTracks.length === 0,
        className: `px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-1.5 border ${badQualityTracks.length === 0 ? "bg-djzinc-900/50 text-gray-600 border-djzinc-800/50 cursor-not-allowed" : selectedAuditIds.size > 0 && Array.from(selectedAuditIds).some((id) => badQualityTracks.some((b) => b.id === id)) ? "bg-amber-500 text-black border-amber-400 font-black shadow-sm shadow-amber-500/20 active:scale-95" : "bg-djzinc-850 hover:bg-djzinc-800 text-amber-400 border-amber-500/30 hover:border-amber-500/60 active:scale-95"}`,
        title: "Seleccionar o deseleccionar todas las pistas de mala calidad"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u26A1"),
      /* @__PURE__ */ React.createElement("span", null, "Mala Calidad (", badQualityTracks.length, ")"),
      selectedAuditIds.size > 0 && /* @__PURE__ */ React.createElement("span", { className: "bg-black/40 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono ml-0.5" }, selectedAuditIds.size)
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setFiltro("bad_quality"),
        className: `px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all border ${filtro === "bad_quality" ? "bg-amber-500 text-black border-amber-400 font-black shadow-sm shadow-amber-500/20" : "bg-djzinc-900 text-gray-400 hover:text-amber-300 border-djzinc-800 hover:border-amber-500/40"}`
      },
      "Ver Solo Malas (",
      badQualityTracks.length,
      ")"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setFiltro("missing"),
        className: `px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all border ${filtro === "missing" ? "bg-amber-500 text-black border-amber-400 font-black shadow-sm shadow-amber-500/20" : "bg-djzinc-900 text-gray-400 hover:text-white border-djzinc-800 hover:border-djzinc-700"}`
      },
      "Falta BPM/Key (",
      metrics.missing || 0,
      ")"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setFiltro("missing_title"),
        className: `px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all border ${filtro === "missing_title" ? "bg-amber-500 text-black border-amber-400 font-black shadow-sm shadow-amber-500/20" : "bg-djzinc-900 text-gray-400 hover:text-white border-djzinc-800 hover:border-djzinc-700"}`
      },
      "Falta T\xEDtulo (",
      metrics.missing_title || 0,
      ")"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setFiltro("missing_artist"),
        className: `px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all border ${filtro === "missing_artist" ? "bg-amber-500 text-black border-amber-400 font-black shadow-sm shadow-amber-500/20" : "bg-djzinc-900 text-gray-400 hover:text-white border-djzinc-800 hover:border-djzinc-700"}`
      },
      "Falta Artista (",
      metrics.missing_artist || 0,
      ")"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setFiltro("missing_cover"),
        className: `px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all border ${filtro === "missing_cover" ? "bg-amber-500 text-black border-amber-400 font-black shadow-sm shadow-amber-500/20" : "bg-djzinc-900 text-gray-400 hover:text-white border-djzinc-800 hover:border-djzinc-700"}`
      },
      "Falta Cover (",
      metrics.missing_cover || 0,
      ")"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setDuplicateModalOpen(true),
        className: "px-3 py-1 rounded-lg text-xs font-mono font-bold bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 hover:text-amber-300 border border-djzinc-800 hover:border-amber-500/40 cursor-pointer flex items-center gap-1.5 shadow transition-all active:scale-95"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u2696\uFE0F"),
      /* @__PURE__ */ React.createElement("span", null, "Duplicados (", metrics.duplicates || 0, ")")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setFiltro("error"),
        className: `px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all border ${filtro === "error" ? "bg-red-500 text-black border-red-400 font-black shadow-sm shadow-red-500/20" : "bg-djzinc-900 text-gray-400 hover:text-red-400 border-djzinc-800 hover:border-red-500/40"}`
      },
      t("filter_errors") || "FLAC Fake",
      " (",
      metrics.errors || 0,
      ")"
    ))), saveFeedback && /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-djgreen-400 font-bold animate-pulse" }, saveFeedback)), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-auto bg-[#0f0f13]" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left border-collapse text-xs whitespace-nowrap hidden md:table" }, /* @__PURE__ */ React.createElement("thead", { className: "sticky top-0 z-10 bg-djzinc-900/95 border-b border-djzinc-800 text-[11px] font-mono uppercase text-djzinc-400" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-2 w-12 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-1" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        checked: tracksFiltrados.length > 0 && tracksFiltrados.every((t2) => selectedAuditIds.has(t2.id)),
        onChange: handleToggleSelectAllVisible,
        className: "accent-djcyan-500 cursor-pointer w-3.5 h-3.5 rounded",
        title: "Seleccionar / deseleccionar todas las pistas visibles"
      }
    ), /* @__PURE__ */ React.createElement("span", { onClick: () => handleSortAudit("id"), className: "cursor-pointer hover:text-white text-[9px] font-mono" }, "#"), renderSortArrowAudit("id"))), /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-2 w-28 text-center text-djcyan-400" }, t("th_waveform") || "Waveform"), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("title"), className: "py-2.5 px-3 min-w-[220px] cursor-pointer hover:text-white transition-colors" }, t("th_title") || "Archivo / T\xEDtulo", " ", renderSortArrowAudit("title")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("artist"), className: "py-2.5 px-2 w-28 cursor-pointer hover:text-white transition-colors" }, t("th_artist") || "Artista", " ", renderSortArrowAudit("artist")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("format"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, t("th_format") || "Formato", " ", renderSortArrowAudit("format")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("sample_rate_khz"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, t("th_khz") || "kHz", " ", renderSortArrowAudit("sample_rate_khz")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("bitrate_kbps"), className: "py-2.5 px-2 text-center w-20 cursor-pointer hover:text-white transition-colors" }, t("th_kbps") || "kbps", " ", renderSortArrowAudit("bitrate_kbps")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("calidad"), className: "py-2.5 px-2 text-center w-24 cursor-pointer hover:text-white transition-colors" }, t("th_quality") || "Calidad", " ", renderSortArrowAudit("calidad")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("perdida_pct"), className: "py-2.5 px-3 text-center min-w-[170px] cursor-pointer hover:text-white transition-colors" }, t("th_loss") || "P\xE9rdida / Compresi\xF3n", " ", renderSortArrowAudit("perdida_pct")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("cutoff_khz"), className: "py-2.5 px-1.5 text-center cursor-pointer hover:text-white transition-colors" }, t("th_fft") || "Cert. FFT", " ", renderSortArrowAudit("cutoff_khz")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("lufs"), className: "py-2.5 px-1.5 text-center cursor-pointer hover:text-white transition-colors", title: "Sonoridad integrada LUFS (EBU R128) y pico True Peak (dBFS)" }, "LUFS / Peak ", renderSortArrowAudit("lufs")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("duration"), className: "py-2.5 px-1.5 text-center cursor-pointer hover:text-white transition-colors" }, t("th_duration") || "Time", " ", renderSortArrowAudit("duration")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("bpm"), className: "py-2.5 px-1.5 text-center cursor-pointer hover:text-white transition-colors" }, "BPM ", renderSortArrowAudit("bpm")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("key"), className: "py-2.5 px-1.5 text-center cursor-pointer hover:text-white transition-colors" }, "Key ", renderSortArrowAudit("key")), /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-1.5 text-center" }, t("th_cues") || "8 Hot Cues"), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("e"), className: "py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors" }, "\u26A1 Energ\xEDa ", renderSortArrowAudit("e")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("dance"), className: "py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors" }, "\u{1F57A} Dance ", renderSortArrowAudit("dance")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("fase_badge"), className: "py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors" }, "Fase DJ ", renderSortArrowAudit("fase_badge")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("acoustic_role"), className: "py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors text-djcyan-400", title: "Rol espectral (Bass Driver, Vocal/Lead, Percussive) y compatibilidad Anti-Muddy" }, "Rol Ac\xFAstico & Anti-Muddy ", renderSortArrowAudit("acoustic_role")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("comment"), className: "py-2.5 px-2 text-left cursor-pointer hover:text-white transition-colors" }, "Comentario Pro DJ ", renderSortArrowAudit("comment")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("status"), className: "py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors" }, t("th_status") || "Estado", " ", renderSortArrowAudit("status"))), /* @__PURE__ */ React.createElement("tr", { className: "bg-djzinc-950/90 border-b border-djzinc-800 text-[10px] lowercase font-sans" }, /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center font-mono text-[9px] text-gray-500" }, filterHeaderSearch || filterHeaderFormat !== "ALL" || filterHeaderQuality !== "ALL" || filterHeaderStatus !== "ALL" || filterHeaderEnergy !== "ALL" || filterHeaderDance !== "ALL" ? /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setFilterHeaderSearch("");
          setFilterHeaderFormat("ALL");
          setFilterHeaderQuality("ALL");
          setFilterHeaderStatus("ALL");
          setFilterHeaderEnergy("ALL");
          setFilterHeaderDance("ALL");
        },
        title: "Limpiar filtros de cabecera",
        className: "text-amber-400 hover:text-white cursor-pointer"
      },
      "\u2715"
    ) : "filtro"), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: filterHeaderSearch,
        onChange: (e) => setFilterHeaderSearch(e.target.value),
        placeholder: "Filtrar t\xEDtulo/archivo...",
        className: "w-full bg-djzinc-900 border border-djzinc-750 rounded px-1.5 py-0.5 text-[11px] text-gray-200 outline-none focus:border-djcyan-400 font-sans"
      }
    )), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: filterHeaderFormat,
        onChange: (e) => setFilterHeaderFormat(e.target.value),
        className: "bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todos"),
      /* @__PURE__ */ React.createElement("option", { value: "FLAC" }, "FLAC"),
      /* @__PURE__ */ React.createElement("option", { value: "MP3" }, "MP3"),
      /* @__PURE__ */ React.createElement("option", { value: "WAV" }, "WAV"),
      /* @__PURE__ */ React.createElement("option", { value: "AIFF" }, "AIFF"),
      /* @__PURE__ */ React.createElement("option", { value: "M4A" }, "M4A")
    )), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: filterHeaderQuality,
        onChange: (e) => setFilterHeaderQuality(e.target.value),
        className: "bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todas"),
      /* @__PURE__ */ React.createElement("option", { value: "Hi-Res" }, "Hi-Res"),
      /* @__PURE__ */ React.createElement("option", { value: "Alta" }, "Alta"),
      /* @__PURE__ */ React.createElement("option", { value: "Media" }, "Media"),
      /* @__PURE__ */ React.createElement("option", { value: "Baja" }, "Baja")
    )), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: filterHeaderEnergy,
        onChange: (e) => setFilterHeaderEnergy(e.target.value),
        className: "bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todas"),
      /* @__PURE__ */ React.createElement("option", { value: "HIGH" }, ">80% Alta"),
      /* @__PURE__ */ React.createElement("option", { value: "MED" }, "65-80% Media"),
      /* @__PURE__ */ React.createElement("option", { value: "LOW" }, "<65% Baja")
    )), /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: filterHeaderDance,
        onChange: (e) => setFilterHeaderDance(e.target.value),
        className: "bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todas"),
      /* @__PURE__ */ React.createElement("option", { value: "HIGH" }, ">80% Alta"),
      /* @__PURE__ */ React.createElement("option", { value: "MED" }, "65-80% Media"),
      /* @__PURE__ */ React.createElement("option", { value: "LOW" }, "<65% Baja")
    )), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: filterHeaderAcousticRole,
        onChange: (e) => setFilterHeaderAcousticRole(e.target.value),
        className: "bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[9.5px] text-djcyan-300 outline-none font-mono"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todos Roles"),
      /* @__PURE__ */ React.createElement("option", { value: "Bass Driver" }, "\u{1F534} Bass Driver"),
      /* @__PURE__ */ React.createElement("option", { value: "Vocal / Lead" }, "\u{1F7E1} Vocal / Lead"),
      /* @__PURE__ */ React.createElement("option", { value: "Percussive Tool" }, "\u{1F7E2} Percussive"),
      /* @__PURE__ */ React.createElement("option", { value: "Balanced Full-Range" }, "\u{1F535} Balanced")
    )), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: filterHeaderStatus,
        onChange: (e) => setFilterHeaderStatus(e.target.value),
        className: "bg-djzinc-900 border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todos"),
      /* @__PURE__ */ React.createElement("option", { value: "LOSSLESS" }, "Lossless"),
      /* @__PURE__ */ React.createElement("option", { value: "MP3" }, "MP3"),
      /* @__PURE__ */ React.createElement("option", { value: "FAKE" }, "FLAC Fake")
    )))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-djzinc-850/60 font-sans" }, tracksFiltrados.length === 0 && !isAuditing && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "20", className: "py-12 text-center text-gray-500 font-mono text-xs" }, 'No hay pistas cargadas en esta vista. Selecciona una carpeta y pulsa "Auditar Todo".')), tracksFiltrados.map((row) => {
      const isRowPlaying = nowPlayingTrack && String(nowPlayingTrack.id) === String(row.id) && isPlaying;
      const coverUrl = getValidCover(row.cover || (row.path ? `/cover?path=${encodeURIComponent(row.path)}` : row.f ? `/cover?path=${encodeURIComponent(row.f)}` : null));
      const isFake = Boolean(row.es_fake || row.format === "FLAC" && String(row.status || "").includes("Fake"));
      return /* @__PURE__ */ React.createElement("tr", { key: row.id, onClick: () => {
        setSelectedTrack(row.id);
        setSidebarOpen(true);
        if (onPlayTrack) onPlayTrack(row, 0, false);
      }, className: `cursor-pointer select-none transition-colors ${selectedTrack === row.id ? "bg-djcyan-950/40 border-l-2 border-djcyan-400" : "hover:bg-djzinc-850/40"}` }, /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-1.5" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          checked: selectedAuditIds.has(row.id),
          onChange: (e) => handleToggleSelectRow(row.id, e),
          className: "accent-djcyan-500 cursor-pointer w-3.5 h-3.5 rounded"
        }
      ), /* @__PURE__ */ React.createElement("span", { className: "text-djzinc-500 font-mono text-[10px] w-4 text-right" }, row.id))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement(
        TableHarmonicWaveform,
        {
          track: row,
          duration: row.duration || "05:00",
          onPlayTrack,
          onTogglePlay,
          isCurrentPlaying: isRowPlaying,
          playProgress: isRowPlaying ? playProgress : 0
        }
      )), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
        "img",
        {
          src: coverUrl,
          className: "w-9 h-9 rounded bg-djzinc-800 object-cover shrink-0 border border-djzinc-700 shadow-sm",
          alt: "cover",
          onError: (e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_VINYL_SVG;
          }
        }
      ), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-w-0 text-left" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-djcyan-400 text-xs truncate max-w-[210px] flex items-center gap-1.5", title: row.t || row.title || row.f }, /* @__PURE__ */ React.createElement("span", { className: "truncate" }, row.t || row.title || row.f || "Desconocido"), row.version_type && row.version_type !== "standard" && /* @__PURE__ */ React.createElement("span", { className: "px-1 py-0.2 rounded text-[8px] font-mono font-black uppercase bg-purple-950 text-purple-300 border border-purple-700/60 shrink-0" }, row.version_type)), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 font-mono truncate max-w-[210px]", title: row.f }, row.f || "")))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-gray-300 truncate max-w-[120px]", title: row.a || row.artist }, row.a || row.artist), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-djzinc-850 text-djcyan-400 border border-djzinc-750" }, row.format || (row.f ? row.f.split(".").pop().toUpperCase() : "FLAC"))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center font-mono text-[10px] text-gray-300" }, row.sample_rate_khz ? `${row.sample_rate_khz} kHz` : "44.1 kHz"), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center font-mono text-[10px] text-gray-300" }, row.bitrate_kbps ? `${row.bitrate_kbps} kbps` : row.format === "MP3" ? "320 kbps" : "1062 kbps"), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center gap-1" }, /* @__PURE__ */ React.createElement("span", { className: `px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${isFake ? "bg-red-950 text-red-400 border-red-800" : String(row.calidad || "").includes("Alta") || String(row.calidad || "").includes("Hi-Res") ? "bg-emerald-950/80 text-emerald-400 border-emerald-800" : String(row.calidad || "").includes("Media") ? "bg-amber-950/80 text-amber-400 border-amber-800" : row.calidad && row.calidad !== "Pendiente Auditor\xEDa" ? "bg-red-950/80 text-red-400 border-red-800" : "bg-djzinc-850 text-gray-400 border-djzinc-750"}` }, row.calidad || (isFake ? "Baja" : "Alta")), isFlacUpgradeCandidate(row) ? /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: (e) => {
            e.stopPropagation();
            handleBuscarReemplazosSpotify([row]);
          },
          className: "px-1.5 py-0.5 rounded text-[8.5px] font-mono font-black bg-gradient-to-r from-cyan-950 to-purple-950 hover:from-cyan-900 hover:to-purple-900 text-cyan-300 border border-cyan-500/70 cursor-pointer shadow-sm flex items-center justify-center gap-1 transition-all active:scale-95",
          title: "FLAC no cumple est\xE1ndares lossless o es de calidad media/fake. Buscar master oficial en Spotify (SuperFLAC)"
        },
        /* @__PURE__ */ React.createElement("span", null, "\u{1F48E}"),
        /* @__PURE__ */ React.createElement("span", null, "SuperFLAC")
      ) : isBadQualityTrack(row) ? /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: (e) => {
            e.stopPropagation();
            handleBuscarReemplazosSpotify([row]);
          },
          className: "px-1.5 py-0.5 rounded text-[8px] font-mono font-black bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-600/70 cursor-pointer shadow flex items-center justify-center gap-1 transition-all active:scale-95",
          title: "Buscar versi\xF3n oficial en Spotify Ingest para sustituir este track"
        },
        /* @__PURE__ */ React.createElement("span", null, "\u{1F504}"),
        /* @__PURE__ */ React.createElement("span", null, "Spotify HD")
      ) : null)), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-center" }, isFake ? /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800", title: `Corte espectral a ${row.cutoff_khz || "--"}kHz` }, "\u26A0\uFE0F Transcode (", row.perdida_pct || 0, "%)") : row.perdida === "Sin P\xE9rdida" ? /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/60" }, "Sin P\xE9rdida") : /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-300" }, row.perdida || "Sin auditar")), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-1.5 text-center" }, /* @__PURE__ */ React.createElement("span", { className: `px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${isFake ? "bg-red-950 text-red-400 border-red-800" : "bg-djgreen-950/80 text-djgreen-400 border-djgreen-800"}` }, row.cutoff_khz ? `${row.cutoff_khz}kHz` : "PASS")), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-1.5 text-center font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center" }, /* @__PURE__ */ React.createElement("span", { className: `text-[10px] font-bold ${row.lufs > -7 ? "text-amber-400" : row.lufs && row.lufs <= -14 ? "text-cyan-400" : "text-emerald-400"}` }, row.lufs !== void 0 ? `${row.lufs} LUFS` : "-9.0 LUFS"), /* @__PURE__ */ React.createElement("span", { className: `text-[9px] ${row.clipping ? "text-red-400 font-black animate-pulse" : "text-gray-500"}`, title: row.clipping ? "Clipping detectado: pico real supera 0.0 dBFS" : "Pico inter-sample en rango" }, row.clipping ? "\u26A0\uFE0F CLIP" : `${row.true_peak !== void 0 ? row.true_peak > 0 ? `+${row.true_peak}` : row.true_peak : "-0.1"}dB`))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-1.5 text-center text-gray-400 font-mono" }, row.duration), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-1.5 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "bg-djzinc-850 text-gray-200 px-1.5 py-0.5 rounded font-mono border border-djzinc-750" }, row.b)), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-1.5 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded font-mono font-bold bg-djcyan-950 text-djcyan-400 border border-djcyan-800/50", title: getHarmonicKeyDisplay(row.k) }, getHarmonicKeyDisplay(row.k))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-1.5 text-center" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: (e) => {
            e.stopPropagation();
            setSelectedTrack(row.id);
            if (onNavigateTab) {
              onNavigateTab("hotcues");
            } else {
              setCueStudioModalOpen(true);
            }
          },
          className: "px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-pink-950/80 hover:bg-pink-900 text-pink-300 border border-pink-800/60 transition-all shadow active:scale-95 cursor-pointer",
          title: "Abrir Estudio de Hot Cues a pantalla completa con reproductor"
        },
        "\u{1F39B}\uFE0F 8 Cues"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: (e) => {
            e.stopPropagation();
            if (onAddTrackToSet) {
              onAddTrackToSet(row);
            }
          },
          className: "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-djcyan-950/80 hover:bg-djcyan-900 text-djcyan-300 border border-djcyan-800/60 transition-all shadow active:scale-95 cursor-pointer ml-1",
          title: "A\xF1adir pista a Set-Builder & Energy Flow Canvas"
        },
        "\u2795 Set"
      )), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center gap-0.5 w-16 mx-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between w-full text-[9px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "\u26A1"), /* @__PURE__ */ React.createElement("span", { className: `font-bold ${row.e >= 82 ? "text-red-400" : row.e >= 68 ? "text-amber-400" : "text-djcyan-400"}` }, row.e || 80, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `h-full rounded-full ${row.e >= 82 ? "bg-gradient-to-r from-amber-500 to-red-500" : row.e >= 68 ? "bg-gradient-to-r from-yellow-400 to-amber-500" : "bg-gradient-to-r from-cyan-400 to-blue-500"}`,
          style: { width: `${Math.min(100, Math.max(10, row.e || 80))}%` }
        }
      )))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center gap-0.5 w-16 mx-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between w-full text-[9px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "\u{1F57A}"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-purple-300" }, row.dance || row.danceability || 80, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500",
          style: { width: `${Math.min(100, Math.max(10, row.dance || row.danceability || 80))}%` }
        }
      )))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, (() => {
        const badge = row.fase_badge || (row.e >= 82 ? "CA\xD1A" : row.e >= 68 ? "BUILD-UP" : row.bpm && parseFloat(row.bpm) < 118 ? "CALMA" : "WARM-UP");
        const colorMap = {
          "CA\xD1A": "bg-red-950/80 text-red-300 border-red-700 shadow-[0_0_8px_rgba(239,68,68,0.3)]",
          "BUILD-UP": "bg-amber-950/80 text-amber-300 border-amber-700",
          "WARM-UP": "bg-cyan-950/80 text-cyan-300 border-cyan-700",
          "CIERRE": "bg-purple-950/80 text-purple-300 border-purple-700",
          "CALMA": "bg-teal-950/80 text-teal-300 border-teal-700"
        };
        const iconMap = {
          "CA\xD1A": "\u{1F525}",
          "BUILD-UP": "\u{1F680}",
          "WARM-UP": "\u{1F3A7}",
          "CIERRE": "\u{1F30C}",
          "CALMA": "\u2615"
        };
        return /* @__PURE__ */ React.createElement("span", { className: `px-2 py-0.5 rounded text-[9px] font-mono font-bold border inline-flex items-center gap-1 ${colorMap[badge] || "bg-djzinc-800 text-gray-300 border-djzinc-700"}`, title: row.fase_dj || row.recomendacion_dj || row.mood }, /* @__PURE__ */ React.createElement("span", null, iconMap[badge] || "\u{1F3B5}"), /* @__PURE__ */ React.createElement("span", null, badge));
      })()), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center gap-1" }, /* @__PURE__ */ React.createElement("span", { className: `px-2 py-0.5 rounded text-[9.5px] font-mono font-bold border ${row.acoustic_role === "Bass Driver" ? "bg-rose-950/80 text-rose-300 border-rose-700/80" : row.acoustic_role === "Vocal / Lead" ? "bg-amber-950/80 text-amber-300 border-amber-700/80" : row.acoustic_role === "Percussive Tool" ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/80" : "bg-djzinc-850 text-gray-300 border-djzinc-700"}`, title: `Ratio Espectral: Low ${row.low_ratio || 33}% | Mid ${row.mid_ratio || 33}% | High ${row.high_ratio || 34}%` }, row.acoustic_role === "Bass Driver" ? "\u{1F534} Bass Driver" : row.acoustic_role === "Vocal / Lead" ? "\u{1F7E1} Vocal / Lead" : row.acoustic_role === "Percussive Tool" ? "\u{1F7E2} Percussive" : "\u{1F535} Balanced"), currentTrack && String(currentTrack.id) !== String(row.id) && (() => {
        const isCurBass = (currentTrack.low_ratio || 33) >= 45 || currentTrack.acoustic_role === "Bass Driver";
        const isRowBass = (row.low_ratio || 33) >= 45 || row.acoustic_role === "Bass Driver";
        if (isCurBass && isRowBass) {
          return /* @__PURE__ */ React.createElement("span", { className: "text-[8px] font-mono px-1 py-0.2 rounded bg-red-950 text-red-300 border border-red-700/80 animate-pulse", title: "Riesgo de colisi\xF3n en subgraves 30-80 Hz" }, "\u26A0\uFE0F Colisi\xF3n Bass");
        } else if (isCurBass && (row.acoustic_role === "Vocal / Lead" || row.acoustic_role === "Percussive Tool") || isRowBass && (currentTrack.acoustic_role === "Vocal / Lead" || currentTrack.acoustic_role === "Percussive Tool")) {
          return /* @__PURE__ */ React.createElement("span", { className: "text-[8px] font-mono px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/80", title: "Frecuencias complementarias: Mezcla limpia garantizada" }, "\u{1F7E2} Anti-Muddy Compl.");
        }
        return null;
      })())), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-left" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 max-w-[220px]" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-400 truncate", title: row.comment || `[${row.b || "--"} BPM | ${row.k || "--"}] Intro limpia 32b \u2022 Drop contundente \u2022 Outro 64b` }, row.comment || `[${row.b || "--"} BPM | ${row.k || "--"}] Intro limpia 32b \u2022 Drop contundente \u2022 Outro 64b`))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, isFake ? /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[10px] font-mono font-black bg-red-950 text-red-400 border border-red-700 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse", title: "\xA1Alerta! Falso FLAC con corte lossy previo" }, "FLAC FAKE") : String(row.status || "").includes("VERDADERO") || String(row.status || "").includes("True") || String(row.status || "").includes("HI-RES") ? /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800" }, row.status) : row.format === "MP3" || String(row.status || "").includes("MP3") ? /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-djzinc-850 text-cyan-300 border border-djzinc-700" }, row.status) : /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-mono bg-djzinc-850 text-gray-300 border border-djzinc-750" }, row.status)));
    }))), /* @__PURE__ */ React.createElement("div", { className: "block md:hidden p-2 space-y-2.5 pb-36" }, tracksFiltrados.length === 0 && !isAuditing && /* @__PURE__ */ React.createElement("div", { className: "py-12 text-center text-gray-500 font-mono text-xs" }, "No hay pistas cargadas en esta vista. Selecciona una carpeta o audita pistas sueltas."), tracksFiltrados.map((row) => {
      const isRowPlaying = nowPlayingTrack && String(nowPlayingTrack.id) === String(row.id) && isPlaying;
      const coverUrl = getValidCover(row.cover || (row.path ? `/cover?path=${encodeURIComponent(row.path)}` : row.f ? `/cover?path=${encodeURIComponent(row.f)}` : null));
      const isFake = Boolean(row.es_fake || row.format === "FLAC" && String(row.status || "").includes("Fake"));
      const isSelected = selectedTrack === row.id;
      const isChecked = selectedAuditIds.has(row.id);
      const isSuperFlacCandidate = row.format === "FLAC" && (row.calidad === "Media" || row.calidad === "Baja" || isFake);
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: `mob_trk_${row.id}`,
          onClick: () => {
            setSelectedTrack(row.id);
            setSidebarOpen(true);
            if (onPlayTrack) onPlayTrack(row, 0, false);
          },
          className: `p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? "bg-gradient-to-r from-djcyan-950/70 to-djzinc-900 border-djcyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]" : "bg-djzinc-900/90 border-djzinc-800 hover:border-djzinc-700"}`
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "relative shrink-0", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement(
          "img",
          {
            src: coverUrl,
            className: "w-12 h-12 rounded-lg bg-djzinc-800 object-cover border border-djzinc-700 shadow-md",
            alt: "cover",
            onError: (e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_VINYL_SVG;
            }
          }
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: (e) => {
              e.stopPropagation();
              if (isRowPlaying) {
                if (onTogglePlay) onTogglePlay();
              } else {
                if (onPlayTrack) onPlayTrack(row, 0, true);
              }
            },
            className: `absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-lg border border-black/50 ${isRowPlaying ? "bg-emerald-400 text-black font-black animate-pulse" : "bg-djcyan-500 text-black font-bold"}`
          },
          isRowPlaying ? "\u275A\u275A" : "\u25B6"
        )), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-1" }, /* @__PURE__ */ React.createElement("h4", { className: "font-bold text-xs text-white truncate", title: row.t || row.title || row.f }, row.t || row.title || row.f || "Desconocido"), /* @__PURE__ */ React.createElement(
          "input",
          {
            type: "checkbox",
            checked: isChecked,
            onChange: (e) => {
              e.stopPropagation();
              handleToggleSelectRow(row.id, e);
            },
            className: "accent-djcyan-500 cursor-pointer w-4 h-4 rounded shrink-0 mt-0.5"
          }
        )), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-djcyan-400 font-medium truncate", title: row.a || row.artist }, row.a || row.artist || "Artista Desconocido"), /* @__PURE__ */ React.createElement("p", { className: "text-[9.5px] text-gray-500 font-mono truncate" }, row.f || ""))),
        /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-djzinc-800/80" }, /* @__PURE__ */ React.createElement("span", { className: `px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${isFake ? "bg-red-950/80 text-red-300 border-red-700/80 animate-pulse" : row.format === "FLAC" ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/60" : "bg-djzinc-850 text-gray-300 border-djzinc-700"}` }, isFake ? "\u26A0\uFE0F FLAC FALSO" : row.format || "FLAC"), /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0d0d16] text-djcyan-400 border border-djzinc-750" }, row.b ? `${parseFloat(row.b).toFixed(1)} BPM` : row.bpm ? `${parseFloat(row.bpm).toFixed(1)} BPM` : "-- BPM"), /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#130d1e] text-purple-300 border border-purple-800/60" }, row.k || row.key || "--"), /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-300 bg-djzinc-850 border border-djzinc-750" }, row.sample_rate_khz ? `${row.sample_rate_khz} kHz` : "--"), /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-300 bg-djzinc-850 border border-djzinc-750" }, row.cutoff_khz ? `FFT ${row.cutoff_khz}k` : "--"), row.fase_badge && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-cyan-950 text-cyan-300 border border-cyan-800/60" }, row.fase_badge), row.e && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-amber-950/60 text-amber-300 border border-amber-800/60" }, "\u26A1 ", row.e, "%"), /* @__PURE__ */ React.createElement("div", { className: "ml-auto flex items-center gap-1.5", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              setSelectedTrack(row.id);
              if (onNavigateTab) onNavigateTab("hotcues");
            },
            className: "px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-pink-950/80 text-pink-300 border border-pink-800/60 cursor-pointer"
          },
          "\u{1F39B}\uFE0F Cues"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              if (onAddTrackToSet) onAddTrackToSet(row);
            },
            className: "px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-djcyan-950/80 text-djcyan-300 border border-djcyan-800/60 cursor-pointer"
          },
          "\u2795 Set"
        ))),
        isSuperFlacCandidate && /* @__PURE__ */ React.createElement("div", { className: "mt-2 pt-2 border-t border-djzinc-800/60 flex items-center justify-between gap-2", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-amber-400" }, "Calidad ", row.calidad || "Mejorable"), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              if (onSendToSpotify) {
                onSendToSpotify({
                  title: row.t || row.title,
                  artist: row.a || row.artist,
                  format: "FLAC",
                  origin: "audit_upgrade",
                  reemplazo_de: row.id,
                  original_file: row.f || row.title,
                  original_path: row.path
                }, "audit_upgrade");
              }
              if (onNavigateTab) onNavigateTab("spotify");
            },
            className: "px-2.5 py-1 rounded bg-gradient-to-r from-emerald-500 to-djcyan-500 hover:from-emerald-400 hover:to-djcyan-400 text-black text-[10px] font-mono font-black flex items-center gap-1 shadow cursor-pointer active:scale-95"
          },
          /* @__PURE__ */ React.createElement("span", null, "\u{1F50D}"),
          /* @__PURE__ */ React.createElement("span", null, "SuperFLAC Spotify HD")
        ))
      );
    })))), sidebarOpen && /* @__PURE__ */ React.createElement("aside", { key: currentTrack ? currentTrack.id : "none", className: "w-full sm:w-96 fixed sm:relative inset-y-0 right-0 bg-djzinc-900 border-l border-djzinc-800 flex flex-col shrink-0 slide-in-right z-50 sm:z-20 overflow-hidden shadow-2xl" }, /* @__PURE__ */ React.createElement("div", { className: "p-3 border-b border-djzinc-800 bg-djzinc-950 flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icons.Gear, null), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-xs uppercase tracking-wider text-gray-200" }, "Inspector DJ Granular")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono bg-djzinc-800 text-gray-400 px-2 py-0.5 rounded" }, "Track #", currentTrack.id || "--"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setSidebarOpen(false),
        className: "w-6 h-6 rounded-full bg-djzinc-850 hover:bg-djzinc-750 text-gray-400 hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer border border-djzinc-700 transition-colors",
        title: t("btn_close_panel") || "Cerrar Panel"
      },
      "\u2715"
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-4 space-y-4" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          if (currentTrack && currentTrack.id) {
            setSelectedTrack(currentTrack.id);
          }
          if (onNavigateTab) {
            onNavigateTab("hotcues");
          }
        },
        className: "w-full py-2 px-3 rounded-lg bg-gradient-to-r from-pink-950/80 via-purple-950/80 to-djzinc-900 hover:from-pink-900/90 hover:via-purple-900/90 hover:to-djzinc-850 text-pink-300 hover:text-white border border-pink-700/60 font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-pink-950/40 transition-all active:scale-[0.98]",
        title: "Abrir este track en la pesta\xF1a Estudio Hot Cues a pantalla completa con Beatgrid ampliado"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F39B}\uFE0F"),
      /* @__PURE__ */ React.createElement("span", null, t("btn_edit_cues_studio") || "Editar Hot Cues en Estudio \u2192")
    ), /* @__PURE__ */ React.createElement("div", { className: "w-full aspect-video bg-djzinc-950 rounded-lg border border-djzinc-800 relative group overflow-hidden flex items-center justify-center shadow-inner" }, /* @__PURE__ */ React.createElement(
      "img",
      {
        src: getValidCover(currentTrack.cover || (currentTrack.path ? `/cover?path=${encodeURIComponent(currentTrack.path)}` : currentTrack.f ? `/cover?path=${encodeURIComponent(currentTrack.f)}` : null)),
        alt: "Cover Art",
        onError: (e) => {
          e.target.onerror = null;
          e.target.src = DEFAULT_VINYL_SVG;
        },
        className: "w-full h-full object-cover"
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-gray-300 font-mono backdrop-blur border border-djzinc-700" }, "ID3v2.4")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("h4", { className: "font-bold text-sm text-djcyan-400 truncate", title: currentTrack.t || currentTrack.title }, currentTrack.t || currentTrack.title || "Selecciona un track"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 truncate", title: currentTrack.a || currentTrack.artist }, currentTrack.a || currentTrack.artist || "--")), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          if (nowPlayingTrack && (String(nowPlayingTrack.id) === String(currentTrack.id) || nowPlayingTrack.path === currentTrack.path || nowPlayingTrack.f === currentTrack.f)) {
            onTogglePlay && onTogglePlay();
          } else {
            onPlayTrack && onPlayTrack(currentTrack, 0, true);
          }
        },
        className: "px-2.5 py-1 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-bold text-[10px] rounded shadow cursor-pointer shrink-0 transition-colors"
      },
      nowPlayingTrack && (String(nowPlayingTrack.id) === String(currentTrack.id) || nowPlayingTrack.path === currentTrack.path || nowPlayingTrack.f === currentTrack.f) && isPlaying ? "\u275A\u275A PAUSE" : "\u25B6 PLAY"
    )), isFlacUpgradeCandidate(currentTrack) ? /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-gradient-to-br from-cyan-950/60 via-purple-950/40 to-djzinc-900 border border-cyan-500/70 rounded-xl flex flex-col gap-2 shadow-lg shadow-cyan-950/30" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-black text-cyan-300 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F48E}"), " SuperFLAC: No Cumple Hi-Res"), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-700/60 font-bold" }, currentTrack.es_fake ? "FAKE / TRANSCODE" : currentTrack.calidad || "CALIDAD MEDIA")), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-300 leading-tight" }, "Este archivo FLAC presenta corte de frecuencia (", currentTrack.cutoff_khz || "--", " kHz) o bitrate insuficiente para considerarse True Lossless. Puedes buscar y descargar el master original en Spotify Ingest."), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleBuscarReemplazosSpotify([currentTrack]),
        disabled: isSearchingSpotifyHD,
        className: "w-full py-1.5 px-3 rounded bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400 text-black font-black text-xs cursor-pointer shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
      },
      /* @__PURE__ */ React.createElement("span", null, isSearchingSpotifyHD ? "\u23F3" : "\u{1F48E}"),
      /* @__PURE__ */ React.createElement("span", null, isSearchingSpotifyHD ? "Buscando en Spotify..." : "Buscar SuperFLAC Lossless en Spotify")
    )) : isBadQualityTrack(currentTrack) ? /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-amber-950/40 border border-amber-600/70 rounded-lg flex flex-col gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-bold text-amber-300 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "\u26A0\uFE0F"), " Calidad Sub-\xF3ptima Detectada"), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono text-red-400 bg-red-950 px-1.5 py-0.5 rounded border border-red-800 font-bold" }, currentTrack.es_fake ? "FLAC FAKE" : currentTrack.calidad || "Baja Calidad")), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-300 leading-tight" }, "Esta pista presenta compresi\xF3n lossy o corte espectral (", currentTrack.cutoff_khz || "--", " kHz). Puedes reemplazarla autom\xE1ticamente por su versi\xF3n oficial en FLAC."), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleBuscarReemplazosSpotify([currentTrack]),
        disabled: isSearchingSpotifyHD,
        className: "w-full py-1.5 px-3 rounded bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black font-black text-xs cursor-pointer shadow transition-all active:scale-95 flex items-center justify-center gap-1.5"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F504}"),
      /* @__PURE__ */ React.createElement("span", null, isSearchingSpotifyHD ? "Buscando en Spotify..." : "Buscar Reemplazo HD en Spotify")
    )) : null, /* @__PURE__ */ React.createElement(
      RekordboxWaveform,
      {
        track: currentTrack,
        cues: currentTrack && currentTrack.cues && currentTrack.cues.length > 0 ? currentTrack.cues : NV2_COLORS,
        duration: currentTrack.duration || "05:00",
        onSeekTrack: onPlayTrack,
        playProgress: isPlaying && nowPlayingTrack && (String(nowPlayingTrack.id) === String(currentTrack.id) || nowPlayingTrack.path === currentTrack.path || nowPlayingTrack.f === currentTrack.f) ? playProgress : 0,
        isCurrentPlaying: isPlaying && nowPlayingTrack && (String(nowPlayingTrack.id) === String(currentTrack.id) || nowPlayingTrack.path === currentTrack.path || nowPlayingTrack.f === currentTrack.f),
        onUpdateCues: (newCues) => updateCurrentTrackField("cues", newCues),
        selectedCueId,
        onSelectCue: setSelectedCueId,
        snapToGrid,
        showBeatgrid,
        onToggleSnap: () => setSnapToGrid((prev) => !prev),
        onToggleGrid: () => setShowBeatgrid((prev) => !prev)
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-3 rounded-lg border border-djzinc-800 space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-xs pb-2 border-b border-djzinc-850" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-300 font-bold flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F52C} Pureza & Calidad Ac\xFAstica"), /* @__PURE__ */ React.createElement(InfoTip, { title: "Teorema de Nyquist y P\xE9rdida", text: "En audio sin p\xE9rdida (FLAC/WAV a 44.1kHz), la frecuencia m\xE1xima te\xF3rica es de 22.05kHz cubriendo todo el rango audible humano. Un corte abrupto a 16kHz o 20kHz evidencia transcode falso desde MP3 con p\xE9rdida." })), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => handleAbrirFftModal(currentTrack),
        className: "px-2 py-0.5 bg-djzinc-800 hover:bg-djzinc-700 text-djcyan-400 text-[10px] font-mono font-bold rounded border border-djzinc-650 cursor-pointer transition-colors",
        title: "Abrir an\xE1lisis espectral FFT en detalle"
      },
      "VER FFT \u{1F4CA}"
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2 text-[11px] font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/80 p-2 rounded border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[9px] uppercase block" }, "Formato / Tasa"), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-300 font-bold" }, currentTrack.format || "FLAC", " \u2022 ", currentTrack.sample_rate_khz || 44.1, " kHz")), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/80 p-2 rounded border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[9px] uppercase block" }, "Bitrate / Bits"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-200 font-bold" }, currentTrack.bitrate_kbps ? `${currentTrack.bitrate_kbps} kbps` : currentTrack.format === "MP3" ? "320 kbps" : "1062 kbps")), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/80 p-2 rounded border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[9px] uppercase block" }, "Corte Espectral FFT"), /* @__PURE__ */ React.createElement("span", { className: `font-bold ${Boolean(currentTrack.es_fake || currentTrack.format === "FLAC" && String(currentTrack.status || "").includes("Fake")) ? "text-red-400" : "text-emerald-400"}` }, currentTrack.cutoff_khz ? `${currentTrack.cutoff_khz} kHz` : "PASS 22.05 kHz")), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/80 p-2 rounded border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[9px] uppercase block" }, "Calidad & P\xE9rdida"), /* @__PURE__ */ React.createElement("span", { className: `font-bold ${Boolean(currentTrack.es_fake || currentTrack.format === "FLAC" && String(currentTrack.status || "").includes("Fake")) ? "text-red-400" : "text-emerald-400"}` }, currentTrack.calidad || (Boolean(currentTrack.es_fake) ? "Baja" : "Alta"), " (", currentTrack.perdida_pct ? `${currentTrack.perdida_pct}%` : "0%", ")"))), Boolean(currentTrack.es_fake || currentTrack.format === "FLAC" && String(currentTrack.status || "").includes("Fake")) ? /* @__PURE__ */ React.createElement("div", { className: "p-2 bg-red-950/80 border border-red-700/80 rounded text-[11px] font-mono text-red-300 flex items-center gap-2 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]" }, /* @__PURE__ */ React.createElement("span", null, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "font-bold block uppercase" }, "FLAC FAKE DETECTADO"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-red-400" }, "Corte a ", currentTrack.cutoff_khz, "kHz. Archivo inflado desde MP3 con p\xE9rdida."))) : /* @__PURE__ */ React.createElement("div", { className: "p-2 bg-emerald-950/50 border border-emerald-800/60 rounded text-[11px] font-mono text-emerald-300 flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", null, "\u2713"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "font-bold block uppercase" }, currentTrack.status || "Audio Aut\xE9ntico"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-emerald-400/90" }, currentTrack.perdida || "Sin P\xE9rdida (Rango audible 100% preservado)"))), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/80 p-2.5 rounded border border-djzinc-800 space-y-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-xs" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-300 font-bold flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F50A} Sonoridad & Din\xE1mica (EBU R128)"), /* @__PURE__ */ React.createElement(InfoTip, { title: "Sonoridad LUFS y True Peak", text: "Mide el volumen percibido para evitar saltos en cabina. -8 a -11 LUFS es el est\xE1ndar de club moderno. True Peak > 0.0 dBFS indica clipping y distorsi\xF3n." })), /* @__PURE__ */ React.createElement("span", { className: `px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${currentTrack.clipping ? "bg-red-950 text-red-400 border border-red-700 animate-pulse" : "bg-emerald-950 text-emerald-400 border border-emerald-800"}` }, currentTrack.clipping ? "\u26A0\uFE0F CLIPPING" : "\u2713 CLEAN PEAK")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-1.5 text-center font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-1.5 rounded border border-djzinc-800/80" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-500 block" }, "LUFS Int."), /* @__PURE__ */ React.createElement("span", { className: `font-bold text-xs ${currentTrack.lufs > -7 ? "text-amber-400" : currentTrack.lufs && currentTrack.lufs <= -14 ? "text-cyan-400" : "text-emerald-400"}` }, currentTrack.lufs !== void 0 ? `${currentTrack.lufs} LUFS` : "-9.0 LUFS")), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-1.5 rounded border border-djzinc-800/80" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-500 block" }, "True Peak"), /* @__PURE__ */ React.createElement("span", { className: `font-bold text-xs ${currentTrack.clipping ? "text-red-400 font-black" : "text-gray-200"}` }, currentTrack.true_peak !== void 0 ? `${currentTrack.true_peak > 0 ? "+" : ""}${currentTrack.true_peak} dB` : "-0.1 dB")), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-1.5 rounded border border-djzinc-800/80" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-500 block" }, "Rango (LRA)"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-xs text-gray-300" }, currentTrack.lra ? `${currentTrack.lra} LU` : "3.5 LU")))), /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-djzinc-850 flex flex-col gap-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-300 font-semibold flex items-center" }, "Trim Silencio (Zero-Cross)", /* @__PURE__ */ React.createElement(InfoTip, { title: "Recorte de Silencio", text: "Elimina el silencio muerto en cabecera cortando en paso por cero de amplitud (-60dBFS) para evitar clicks al mezclar." })), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60" }, `-${Number(currentTrack.trim_start_ms || 0).toFixed(1)} ms`)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("button", { onClick: () => handleMicroAjusteTrim(-10), className: "px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer", title: "Restar 10ms" }, "-10ms"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleMicroAjusteTrim(-1), className: "px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer", title: "Restar 1ms" }, "-1ms"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleMicroAjusteTrim(1), className: "px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer", title: "Sumar 1ms" }, "+1ms"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleMicroAjusteTrim(10), className: "px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer", title: "Sumar 10ms" }, "+10ms"), /* @__PURE__ */ React.createElement("button", { onClick: handleAutoDetectarTrimDownbeat, className: "px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-800 hover:bg-djzinc-700 text-amber-300 rounded border border-amber-800/60 cursor-pointer", title: "Auto-detectar con DSP" }, "Auto")), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => handlePreescuchaOffset(currentTrack.trim_start_ms || 0),
        className: "px-2 py-0.5 text-[9px] font-bold bg-amber-950/70 hover:bg-amber-900 text-amber-300 rounded border border-amber-800/80 cursor-pointer transition-colors",
        title: "Preescucha directa desde el punto de recorte"
      },
      "\u25B6 Trim"
    ))), /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-djzinc-850 flex flex-col gap-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-300 font-semibold flex items-center" }, "Beatgrid 1.0.0 (Downbeat)", /* @__PURE__ */ React.createElement(InfoTip, { title: "Beatgrid Downbeat", text: "Fija el primer golpe de bombo real para que el sincro de Serato/Rekordbox nunca quede a contratiempo." })), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono font-black text-djcyan-300 bg-djcyan-950/80 px-2 py-0.5 rounded border border-djcyan-800/60" }, `${Number(currentTrack.first_downbeat_ms || 0).toFixed(1)} ms`)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("button", { onClick: () => handleMicroAjusteDownbeat(-10), className: "px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer", title: "Restar 10ms" }, "-10ms"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleMicroAjusteDownbeat(-1), className: "px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer", title: "Restar 1ms" }, "-1ms"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleMicroAjusteDownbeat(1), className: "px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer", title: "Sumar 1ms" }, "+1ms"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleMicroAjusteDownbeat(10), className: "px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer", title: "Sumar 10ms" }, "+10ms"), /* @__PURE__ */ React.createElement("button", { onClick: handleAutoDetectarTrimDownbeat, className: "px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-800 hover:bg-djzinc-700 text-djcyan-300 rounded border border-djcyan-800/60 cursor-pointer", title: "Auto-detectar con DSP" }, "Auto")), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => handlePreescuchaOffset(currentTrack.first_downbeat_ms || 0),
        className: "px-2 py-0.5 text-[9px] font-bold bg-djcyan-950/70 hover:bg-djcyan-900 text-djcyan-300 rounded border border-djcyan-800/80 cursor-pointer transition-colors",
        title: "Preescucha directa desde el primer golpe de bombo"
      },
      "\u25B6 Beat 1"
    )))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-2.5 rounded border border-djzinc-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] text-gray-400 mb-1" }, /* @__PURE__ */ React.createElement("span", null, "BPM Decimal"), /* @__PURE__ */ React.createElement(InfoTip, { title: "BPM Exacto & TAP", text: "Tempo con precisi\xF3n de dos decimales con bot\xF3n TAP para marcar pulsaciones y micro-ajustes finos." })), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: currentTrack.b || "",
        onChange: (e) => updateCurrentTrackField("b", e.target.value),
        className: "w-full bg-djzinc-900 border border-djzinc-700 rounded px-1.5 py-1 text-xs font-mono font-bold text-white outline-none"
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleTapTempo,
        className: "px-2 py-1 text-[9px] font-mono font-black bg-djcyan-950 hover:bg-djcyan-900 text-djcyan-400 rounded border border-djcyan-800/80 cursor-pointer shadow active:scale-95 transition-all",
        title: "Pulsa repetidamente al ritmo de la m\xFAsica para calcular el tempo"
      },
      "TAP"
    ), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      const v = parseFloat(currentTrack.b);
      if (!isNaN(v)) updateCurrentTrackField("b", (v - 0.1).toFixed(2));
    }, className: "px-1 py-1 text-[9px] font-mono bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 rounded border border-djzinc-700 cursor-pointer", title: "Restar 0.1 BPM" }, "-0.1"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      const v = parseFloat(currentTrack.b);
      if (!isNaN(v)) updateCurrentTrackField("b", (v + 0.1).toFixed(2));
    }, className: "px-1 py-1 text-[9px] font-mono bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 rounded border border-djzinc-700 cursor-pointer", title: "Sumar 0.1 BPM" }, "+0.1"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      const v = parseFloat(currentTrack.b);
      if (!isNaN(v)) updateCurrentTrackField("b", (v / 2).toFixed(2));
    }, className: "px-1 py-1 text-[9px] font-mono bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 rounded border border-djzinc-700 cursor-pointer", title: "Dividir por 2" }, "/2"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      const v = parseFloat(currentTrack.b);
      if (!isNaN(v)) updateCurrentTrackField("b", (v * 2).toFixed(2));
    }, className: "px-1 py-1 text-[9px] font-mono bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 rounded border border-djzinc-700 cursor-pointer", title: "Multiplicar por 2" }, "x2"))), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-2.5 rounded border border-djzinc-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] text-gray-400 mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", null, "Key"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-djcyan-400 font-bold" }, "(", CAMELOT_WHEEL_DATA[currentTrack.k]?.classical || "Am", ")")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setCamelotModalOpen(true),
        className: "text-[9px] font-mono font-bold text-djcyan-400 hover:text-djcyan-300 flex items-center gap-0.5 cursor-pointer",
        title: "Abrir Rueda Arm\xF3nica Camelot Interactiva"
      },
      "\u{1F3A1} Rueda"
    )), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: currentTrack.k || "8A",
        onChange: (e) => updateCurrentTrackField("k", e.target.value),
        className: "w-full bg-djzinc-900 border border-djzinc-700 rounded px-2 py-1 text-xs font-mono font-bold text-djcyan-400 outline-none cursor-pointer"
      },
      Object.entries(CAMELOT_WHEEL_DATA).map(([kKey, kData]) => /* @__PURE__ */ React.createElement("option", { key: kKey, value: kKey }, kKey, " \u2022 ", kData.classical, " (", kData.name, ")"))
    ))), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-3 rounded border border-djzinc-800 space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] text-gray-400" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold flex items-center" }, "Nivel de Energ\xEDa & Pegada", /* @__PURE__ */ React.createElement(InfoTip, { title: "V\xFAmetro de Energ\xEDa", text: "Medidor de pegada e intensidad sonora (rango 1-100) en escala de 5 segmentos LED de club." })), /* @__PURE__ */ React.createElement("span", { className: "font-mono font-bold text-xs text-white" }, currentTrack.e || 80, "%")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-5 gap-1.5 h-6 p-1 bg-black/60 rounded border border-djzinc-850" }, [
      { val: 20, color: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]", off: "bg-emerald-950/40 border-emerald-900/40" },
      { val: 40, color: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]", off: "bg-emerald-950/40 border-emerald-900/40" },
      { val: 60, color: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]", off: "bg-amber-950/40 border-amber-900/40" },
      { val: 80, color: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]", off: "bg-orange-950/40 border-orange-900/40" },
      { val: 100, color: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-pulse", off: "bg-red-950/40 border-red-900/40" }
    ].map((seg, sIdx) => {
      const isActive = (currentTrack.e || 80) >= seg.val;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: sIdx,
          type: "button",
          onClick: () => updateCurrentTrackField("e", seg.val),
          className: `h-full rounded-sm border transition-all cursor-pointer ${isActive ? `${seg.color} border-transparent` : `${seg.off}`}`,
          title: `Nivel ${sIdx + 1} (${seg.val}%)`
        }
      );
    })), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "range",
        min: "1",
        max: "100",
        value: currentTrack.e || 80,
        onChange: (e) => updateCurrentTrackField("e", Number(e.target.value)),
        className: "w-full accent-djgreen-500 h-1.5 bg-djzinc-800 rounded-lg cursor-pointer"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-2.5 rounded border border-djzinc-800 flex flex-col justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] text-gray-400 mb-1" }, /* @__PURE__ */ React.createElement("span", null, "Danceability"), /* @__PURE__ */ React.createElement(InfoTip, { title: "Bailabilidad", text: "Fuerza del comp\xE1s y estabilidad r\xEDtmica para mantener la pista bailando." })), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono font-bold text-djcyan-400" }, currentTrack.dance || 85, "%"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "range",
        min: "1",
        max: "100",
        value: currentTrack.dance || 85,
        onChange: (e) => updateCurrentTrackField("dance", Number(e.target.value)),
        className: "w-20 accent-djcyan-400 h-1.5 bg-djzinc-800 rounded-lg cursor-pointer"
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-2.5 rounded border border-djzinc-800 flex flex-col justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] text-gray-400 mb-1" }, /* @__PURE__ */ React.createElement("span", null, "Mood / Color"), /* @__PURE__ */ React.createElement(InfoTip, { title: "Atm\xF3sfera Sonora", text: "Clasificador del color sonoro y momento ideal de sesi\xF3n." })), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: currentTrack.mood || "Peak Time",
        onChange: (e) => updateCurrentTrackField("mood", e.target.value),
        className: "w-full bg-djzinc-900 border border-djzinc-700 rounded px-1.5 py-1 text-xs font-semibold text-emerald-400 outline-none cursor-pointer"
      },
      DJ_MOODS_LIST.map((m) => /* @__PURE__ */ React.createElement("option", { key: m.id, value: m.id }, m.label))
    ))), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-2.5 rounded border border-djzinc-800 space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] text-gray-400" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Taxonom\xEDa Serato Crate"), /* @__PURE__ */ React.createElement(InfoTip, { title: "G\xE9nero y Taxonom\xEDa", text: "Clasificaci\xF3n en dos niveles (G\xE9nero Ra\xEDz \u27A1 Subg\xE9nero Estilo) que determina el etiquetado TCON y el ruteo f\xEDsico a carpetas y crates de Serato / Rekordbox." })), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 block mb-1" }, "G\xE9nero Ra\xEDz"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: currentTrack.genre || "Tech House",
        onChange: (e) => {
          const newG = e.target.value;
          updateCurrentTrackField("genre", newG);
          const subList = TAXONOMY_TREE[newG] || [];
          updateCurrentTrackField("subgenre", subList[0] || newG);
        },
        className: "w-full bg-djzinc-900 border border-djzinc-700 rounded px-2 py-1 text-xs font-semibold text-gray-200 outline-none cursor-pointer"
      },
      Object.keys(TAXONOMY_TREE).map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }, g))
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 block mb-1" }, "Subg\xE9nero / Crate"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: currentTrack.subgenre || (TAXONOMY_TREE[currentTrack.genre || "Tech House"] ? TAXONOMY_TREE[currentTrack.genre || "Tech House"][0] : "Tech House"),
        onChange: (e) => updateCurrentTrackField("subgenre", e.target.value),
        className: "w-full bg-djzinc-900 border border-djzinc-700 rounded px-2 py-1 text-xs font-semibold text-djcyan-400 outline-none cursor-pointer"
      },
      (TAXONOMY_TREE[currentTrack.genre || "Tech House"] || [currentTrack.subgenre || "Tech House"]).map((sg) => /* @__PURE__ */ React.createElement("option", { key: sg, value: sg }, sg))
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between pt-1 border-t border-djzinc-850 text-[10px]" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 font-mono truncate max-w-[210px]", title: `/${currentTrack.genre || "Tech House"}/${currentTrack.subgenre || ""}/` }, "\u{1F4C1} /", currentTrack.genre || "Tech House", "/", currentTrack.subgenre || "General", "/"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleEnrutarPistaActual,
        className: "px-2 py-1 bg-djcyan-950 hover:bg-djcyan-900 text-djcyan-400 border border-djcyan-700/60 rounded font-bold text-[9px] cursor-pointer transition-colors shadow active:scale-95",
        title: "Enrutar y copiar/mover archivo a su carpeta f\xEDsica y crate Serato"
      },
      "\u{1F69A} Enrutar a Crate"
    ))), /* @__PURE__ */ React.createElement(
      CompactHotCuesSummary,
      {
        track: currentTrack,
        cues: currentTrack && currentTrack.cues && currentTrack.cues.length > 0 ? currentTrack.cues : NV2_COLORS,
        selectedCueId,
        onSelectCue: setSelectedCueId,
        onOpenStudio: () => {
          if (onNavigateTab) {
            onNavigateTab("hotcues");
          } else {
            setCueStudioModalOpen(true);
          }
        }
      }
    ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase mb-1" }, /* @__PURE__ */ React.createElement("span", null, "Comentario T\xE1ctico DJ"), /* @__PURE__ */ React.createElement(InfoTip, { title: "Comentario de Mezcla", text: "Texto estrat\xE9gico inyectado en el tag ID3 COMM visible en las pantallas de la mesa para recordar qu\xE9 hacer con la pista." })), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1 mb-1.5" }, [
      { label: "\u{1F525} Peak Time", text: "Peak Time \u2022 Drop Contundente \u2022 Outro R\xE1pido 32b" },
      { label: "\u{1F3A7} Warm Up", text: "Warm Up \u2022 Groovy 64b \u2022 Entrada Progresiva" },
      { label: "\u{1F3A4} Breakdown", text: "Breakdown Vocal Intenso \u2022 Mezcla Larga con Bajos" },
      { label: "\u26A1 After", text: "Afterhours \u2022 Dark Hypnotic \u2022 Bombo Pesado" }
    ].map((tpl, tIdx) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: tIdx,
        type: "button",
        onClick: () => updateCurrentTrackField("comment", tpl.text),
        className: "px-1.5 py-0.5 text-[9px] font-mono bg-djzinc-850 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-750 cursor-pointer transition-colors",
        title: `Insertar: "${tpl.text}"`
      },
      tpl.label
    ))), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        value: currentTrack.comment || "",
        onChange: (e) => updateCurrentTrackField("comment", e.target.value),
        rows: "2",
        className: "w-full bg-djzinc-950 border border-djzinc-700 rounded p-2 text-xs text-gray-200 outline-none font-mono resize-none"
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-djzinc-950 border-t border-djzinc-800" }, /* @__PURE__ */ React.createElement("button", { onClick: handleGuardarTrack, className: "w-full py-2 bg-djcyan-600 hover:bg-djcyan-500 text-black rounded font-bold text-xs shadow-md cursor-pointer transition-colors" }, "Aplicar Cambios a este Track"))), /* @__PURE__ */ React.createElement(BatchAuditorModal, { isOpen: batchModalOpen, onClose: () => setBatchModalOpen(false), onRunBatch: async (opts) => {
      setBatchModalOpen(false);
      const target = resolveAuditTargets();
      if (!target || Array.isArray(target) && target.length === 0) {
        alert("Por favor selecciona una carpeta o carga pistas sueltas primero.");
        return;
      }
      setIsAuditing(true);
      setBatchProgress(5);
      const targetDesc = Array.isArray(target) ? `${target.length} pistas seleccionadas` : target;
      setBatchStatusMsg(`Ejecutando procesamiento masivo de lote en ${targetDesc}...`);
      try {
        if (window.eel && window.eel.ejecutar_auditoria_lote) {
          const res = await window.eel.ejecutar_auditoria_lote(target, opts)();
          if (res && res.tracks) {
            setTracks(res.tracks);
            const badDetected = res.tracks.filter((t2) => isBadQualityTrack(t2));
            if (badDetected.length > 0) {
              setSelectedAuditIds(new Set(badDetected.map((t2) => t2.id)));
            }
            setMetrics({ total: res.total, missing: res.sin_meta, ready: res.ready, errors: res.errors || 0 });
            if (opts.injectCovers && window.eel.inyectar_caratulas_lote) {
              setBatchStatusMsg("Inyectando car\xE1tulas 1:1 en archivos f\xEDsicos...");
              await window.eel.inyectar_caratulas_lote(res.tracks)();
            }
            if (opts.tacticalComments && window.eel.inyectar_lote_metadatos) {
              setBatchStatusMsg("Inyectando comentarios t\xE1cticos y tags en archivos f\xEDsicos...");
              await window.eel.inyectar_lote_metadatos(res.tracks)();
            }
          }
        }
      } finally {
        setTimeout(() => {
          setIsAuditing(false);
          setBatchProgress(0);
          setBatchStatusMsg("");
        }, 800);
      }
    } }), /* @__PURE__ */ React.createElement(
      DuplicateComparisonModal,
      {
        isOpen: duplicateModalOpen,
        onClose: () => setDuplicateModalOpen(false),
        tracks,
        onDuplicatesDeleted: (deletedPaths) => {
          setTracks((prev) => prev.filter((t2) => !deletedPaths.includes(t2.path) && !deletedPaths.includes(t2.f)));
          setMetrics((prev) => ({
            ...prev,
            total: Math.max(0, prev.total - deletedPaths.length),
            duplicates: 0
          }));
        }
      }
    ), fftModalOpen && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#0b0b10] border border-djzinc-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 border-b border-djzinc-800 bg-djzinc-950 flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-djcyan-400 animate-pulse" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-white uppercase tracking-wider font-mono" }, "An\xE1lisis de Espectro FFT \u2022 Certificaci\xF3n Lossless"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-gray-400 truncate max-w-md" }, currentTrack.t || currentTrack.title || currentTrack.f))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setFftModalOpen(false),
        className: "w-7 h-7 rounded-full bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 flex items-center justify-center font-bold text-xs cursor-pointer"
      },
      "\u2715"
    )), /* @__PURE__ */ React.createElement("div", { className: "p-5 space-y-4 font-sans" }, isAnalyzingFft ? /* @__PURE__ */ React.createElement("div", { className: "py-16 flex flex-col items-center justify-center space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 border-2 border-djcyan-400 border-t-transparent rounded-full animate-spin" }), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-gray-400" }, "Calculando transformada r\xE1pida de Fourier (FFT 4096 / Blackman-Harris)...")) : fftAnalysisData ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-3 rounded-lg border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 font-bold uppercase block mb-1" }, "Diagn\xF3stico"), /* @__PURE__ */ React.createElement("span", { className: `text-base font-mono font-bold ${fftAnalysisData.estado === "True Lossless" ? "text-djgreen-400" : "text-red-400"}` }, fftAnalysisData.estado)), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-3 rounded-lg border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 font-bold uppercase block mb-1" }, "Frecuencia de Corte"), /* @__PURE__ */ React.createElement("span", { className: "text-base font-mono font-bold text-djcyan-400" }, fftAnalysisData.corte || `${fftAnalysisData.cutoff_khz} kHz`)), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-3 rounded-lg border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 font-bold uppercase block mb-1" }, "P\xE9rdida Espectral"), /* @__PURE__ */ React.createElement("span", { className: "text-base font-mono font-bold text-amber-400" }, fftAnalysisData.perdida || 0, "%"))), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-4 rounded-lg border border-djzinc-800 flex flex-col space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-[10px] font-mono text-gray-400" }, /* @__PURE__ */ React.createElement("span", null, "20 Hz"), /* @__PURE__ */ React.createElement("span", null, "1 kHz"), /* @__PURE__ */ React.createElement("span", null, "5 kHz"), /* @__PURE__ */ React.createElement("span", null, "10 kHz"), /* @__PURE__ */ React.createElement("span", null, "16 kHz"), /* @__PURE__ */ React.createElement("span", { className: "text-amber-400 font-bold" }, "20 kHz (Corte MP3)"), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold" }, "22.05 kHz (Nyquist FLAC)")), /* @__PURE__ */ React.createElement("div", { className: "h-32 w-full bg-[#050508] rounded border border-djzinc-850 flex items-end gap-1 p-2 relative overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 bottom-0 right-[9%] w-0.5 bg-amber-500/50 border-r border-dashed border-amber-400/80 pointer-events-none z-10" }), (fftAnalysisData.spectrum && fftAnalysisData.spectrum.length > 0 ? fftAnalysisData.spectrum : Array.from({ length: 64 }, (_, i) => Math.max(0.05, Math.sin(i / 10) * 0.8))).map((bar, i) => {
      const heightPct = Math.max(4, Math.round(bar * 100));
      const isHighFreq = i >= 50;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: i,
          className: "flex-1 rounded-t-sm transition-all duration-300",
          style: {
            height: `${heightPct}%`,
            backgroundColor: isHighFreq ? fftAnalysisData.cutoff_khz >= 20 ? "#06b6d4" : "#ef4444" : i < 15 ? "#3b82f6" : "#f59e0b"
          },
          title: `Banda #${i + 1}: ${Math.round(i / 64 * 24)} kHz (${heightPct}%)`
        }
      );
    })), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-[10px] font-mono text-gray-500" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded bg-blue-500" }), " Graves"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded bg-amber-500" }), " Medios"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded bg-djcyan-500" }), " Agudos / Aire FLAC"))), /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-djzinc-900/60 rounded border border-djzinc-800 text-xs text-gray-300 leading-relaxed font-sans" }, /* @__PURE__ */ React.createElement("p", null, fftAnalysisData.cutoff_khz >= 20 ? "\u2705 El archivo contiene arm\xF3nicos reales y energ\xEDa sostenida por encima de los 20 kHz. Se certifica como audio aut\xE9nticamente Lossless (no re-codificado desde MP3 a 320kbps)." : "\u26A0\uFE0F Se detecta una ca\xEDda vertical de energ\xEDa en el corte de alta frecuencia t\xEDpico de transcodificaciones con p\xE9rdida (MP3/AAC inflado a WAV/FLAC)."))) : /* @__PURE__ */ React.createElement("div", { className: "py-12 text-center text-gray-500 text-xs font-mono" }, "No se pudo obtener el espectro para este archivo.")), /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-djzinc-950 border-t border-djzinc-800 flex justify-end gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => handleAbrirFftModal(currentTrack),
        className: "px-4 py-1.5 bg-djzinc-800 hover:bg-djzinc-700 text-gray-200 rounded font-mono font-semibold text-xs border border-djzinc-700 cursor-pointer transition-colors"
      },
      "Re-analizar"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setFftModalOpen(false),
        className: "px-4 py-1.5 bg-djcyan-600 hover:bg-djcyan-500 text-black rounded font-mono font-bold text-xs cursor-pointer transition-colors shadow"
      },
      "Cerrar"
    )))), fsBrowserOpen && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#0c0c12] border border-djzinc-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 border-b border-djzinc-800 bg-djzinc-950 flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold text-sm uppercase tracking-wider font-mono flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icons.Library, null), " Explorador de Biblioteca & Selecci\xF3n de Archivos")), /* @__PURE__ */ React.createElement("button", { onClick: () => setFsBrowserOpen(false), className: "w-7 h-7 rounded-full bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 flex items-center justify-center text-xs cursor-pointer" }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "px-4 py-2.5 bg-djzinc-900/90 border-b border-djzinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 shrink-0" }, "Ruta:"), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-semibold truncate", title: fsCurrentPath }, fsCurrentPath || "Cargando...")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 shrink-0" }, fsCurrentPath && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => toggleStageFolder(fsCurrentPath),
        className: `px-2.5 py-1 rounded text-[11px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${stagedFolders.includes(fsCurrentPath) ? "bg-emerald-500 text-black border-emerald-400 font-black shadow" : "bg-djcyan-950/80 hover:bg-djcyan-900 border-djcyan-700/70 text-djcyan-300"}`,
        title: "A\xF1adir o quitar toda esta carpeta de la cesta de selecci\xF3n conjunta"
      },
      /* @__PURE__ */ React.createElement("span", null, stagedFolders.includes(fsCurrentPath) ? "\u2713" : "+"),
      /* @__PURE__ */ React.createElement("span", null, stagedFolders.includes(fsCurrentPath) ? "Carpeta A\xF1adida" : "A\xF1adir Toda Esta Carpeta")
    ), fsParentPath && fsParentPath !== fsCurrentPath && /* @__PURE__ */ React.createElement("button", { onClick: () => handleNavegarACarpeta(fsParentPath), className: "px-2.5 py-1 bg-djzinc-800 hover:bg-djzinc-700 text-white rounded text-[11px] border border-djzinc-700 cursor-pointer shrink-0" }, "\u25B2 Subir Nivel"))), /* @__PURE__ */ React.createElement("div", { className: "flex border-b border-djzinc-800 bg-[#07070a] px-4 pt-2 gap-2 text-xs font-mono" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setFsActiveTab("folders"),
        className: `px-3 py-1.5 rounded-t font-bold transition-all cursor-pointer flex items-center gap-1.5 ${fsActiveTab === "folders" ? "bg-djzinc-900 text-djcyan-400 border-t border-x border-djzinc-700" : "text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4C1} Subcarpetas"),
      /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 bg-djzinc-800 text-[10px] rounded-full text-gray-300" }, fsFolders.length),
      stagedFolders.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 bg-emerald-500 text-black text-[10px] font-bold rounded-full" }, stagedFolders.length, " en cesta")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setFsActiveTab("files"),
        className: `px-3 py-1.5 rounded-t font-bold transition-all cursor-pointer flex items-center gap-1.5 ${fsActiveTab === "files" ? "bg-djzinc-900 text-djcyan-400 border-t border-x border-djzinc-700" : "text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F3B5} Pistas Sueltas"),
      /* @__PURE__ */ React.createElement("span", { className: `px-1.5 py-0.2 text-[10px] rounded-full font-bold ${stagedFiles.length > 0 ? "bg-djcyan-500 text-black" : "bg-djzinc-800 text-gray-300"}` }, stagedFiles.length > 0 ? `${stagedFiles.length} en cesta` : fsFiles.length)
    )), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-3 space-y-1 bg-[#07070a]" }, fsLoading ? /* @__PURE__ */ React.createElement("div", { className: "py-14 text-center text-gray-400 text-xs font-mono flex flex-col items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-6 h-6 border-2 border-djcyan-400 border-t-transparent rounded-full animate-spin" }), /* @__PURE__ */ React.createElement("span", null, "Leyendo directorio y pistas de audio...")) : fsActiveTab === "folders" ? fsFolders.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "py-12 text-center text-gray-500 text-xs font-mono" }, "No hay subcarpetas en este directorio.") : fsFolders.map((f, idx) => {
      const isFolderStaged = stagedFolders.includes(f.path);
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: idx,
          onClick: () => handleNavegarACarpeta(f.path),
          className: `p-2.5 rounded-lg border flex items-center justify-between cursor-pointer group transition-all ${isFolderStaged ? "bg-emerald-950/20 border-emerald-500/50" : "bg-djzinc-900/60 hover:bg-djcyan-950/40 border-djzinc-800/80 hover:border-djcyan-500/50"}`
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-amber-400 text-base" }, "\u{1F4C1}"), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-200 group-hover:text-white font-medium truncate" }, f.name)),
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 shrink-0" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: (e) => {
              e.stopPropagation();
              toggleStageFolder(f.path);
            },
            className: `px-2.5 py-1 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer flex items-center gap-1 ${isFolderStaged ? "bg-emerald-500 text-black border-emerald-400 font-black" : "bg-djzinc-800 hover:bg-djcyan-950 text-djcyan-300 border-djzinc-700 hover:border-djcyan-600"}`,
            title: "A\xF1adir o quitar esta subcarpeta de la cesta"
          },
          /* @__PURE__ */ React.createElement("span", null, isFolderStaged ? "\u2713" : "+"),
          /* @__PURE__ */ React.createElement("span", null, isFolderStaged ? "A\xF1adida a Cesta" : "A\xF1adir Carpeta")
        ), /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-xs group-hover:text-djcyan-400 font-mono" }, "\u2794"))
      );
    }) : (
      /* Pestaña de Archivos de Audio con Selección Incremental */
      /* @__PURE__ */ React.createElement("div", null, fsFiles.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between p-2 mb-2 bg-djzinc-900/80 rounded border border-djzinc-800 text-xs font-mono" }, /* @__PURE__ */ React.createElement("label", { className: "flex items-center gap-2 text-gray-300 cursor-pointer select-none" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          checked: fsFiles.length > 0 && fsFiles.every((f) => stagedFiles.includes(f.path)),
          onChange: toggleStageAllCurrentFsFiles,
          className: "rounded bg-djzinc-950 border-djzinc-700 text-djcyan-500 focus:ring-0 cursor-pointer"
        }
      ), /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Seleccionar todas las de este nivel (", fsFiles.length, ")")), stagedFiles.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 text-[11px] font-bold" }, "\u2713 ", stagedFiles.length, " pista(s) acumuladas en cesta")), fsFiles.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "py-12 text-center text-gray-500 text-xs font-mono" }, "No se encontraron archivos de audio directos (.flac, .mp3, .wav, etc.) en este nivel.", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 mt-1 inline-block" }, "Navega a una subcarpeta para explorar m\xE1s pistas.")) : fsFiles.map((fileItem, idx) => {
        const isSelected = stagedFiles.includes(fileItem.path);
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: idx,
            onClick: () => toggleStageFile(fileItem.path),
            className: `p-2 rounded flex items-center justify-between cursor-pointer border transition-colors ${isSelected ? "bg-djcyan-950/40 border-djcyan-500/60 text-white" : "bg-djzinc-900/40 hover:bg-djzinc-800/60 border-djzinc-800 text-gray-300"}`
          },
          /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 min-w-0 flex-1" }, /* @__PURE__ */ React.createElement(
            "input",
            {
              type: "checkbox",
              checked: isSelected,
              onChange: () => {
              },
              className: "rounded bg-djzinc-950 border-djzinc-700 text-djcyan-500 focus:ring-0 cursor-pointer"
            }
          ), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 text-sm" }, "\u{1F3B5}"), /* @__PURE__ */ React.createElement("span", { className: "text-xs truncate font-mono" }, fileItem.name)),
          /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 shrink-0 text-[10px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded bg-djzinc-800 text-djcyan-300 font-bold border border-djzinc-700" }, fileItem.ext || "AUDIO"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, fileItem.size_mb ? `${fileItem.size_mb} MB` : ""))
        );
      }))
    )), /* @__PURE__ */ React.createElement("div", { className: "p-3.5 bg-djzinc-950 border-t border-djzinc-800 flex flex-wrap justify-between items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono font-bold text-gray-300 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-djcyan-400 animate-pulse" }), /* @__PURE__ */ React.createElement("span", null, "Cesta:"), /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400" }, stagedFolders.length, " carpeta(s)"), /* @__PURE__ */ React.createElement("span", null, "\u2022"), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-300" }, stagedFiles.length, " pista(s)")), (stagedFolders.length > 0 || stagedFiles.length > 0) && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: clearStagedSelection,
        className: "px-2 py-0.5 text-[10px] font-mono text-red-400 hover:text-red-300 hover:underline cursor-pointer",
        title: "Vaciar la selecci\xF3n acumulada"
      },
      "[Vaciar Cesta]"
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setFsBrowserOpen(false), className: "px-3.5 py-1.5 bg-djzinc-800 hover:bg-djzinc-750 text-gray-300 rounded text-xs cursor-pointer font-mono" }, "Cancelar"), stagedFolders.length > 0 || stagedFiles.length > 0 ? /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleConfirmarSeleccionLote,
        className: "px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-djcyan-400 hover:from-emerald-400 hover:to-djcyan-300 text-black font-extrabold text-xs rounded-lg shadow-lg shadow-emerald-950/40 cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5 font-mono"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4E5} Cargar Cesta Completa (", stagedFolders.length, " carp., ", stagedFiles.length, " pistas)")
    ) : /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleSeleccionarCarpetaUI(fsCurrentPath),
        className: "px-4 py-1.5 bg-djcyan-500 hover:bg-djcyan-400 text-black font-bold text-xs rounded-lg shadow cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5 font-mono"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4C1} Cargar Toda la Carpeta Actual")
    ))))), camelotModalOpen && /* @__PURE__ */ React.createElement(
      CamelotWheelModal,
      {
        isOpen: camelotModalOpen,
        onClose: () => setCamelotModalOpen(false),
        currentKey: currentTrack.k || "8A",
        onSelectKey: (newKey) => updateCurrentTrackField("k", newKey)
      }
    ), cueStudioModalOpen && /* @__PURE__ */ React.createElement(
      HotCueStudioModal,
      {
        isOpen: cueStudioModalOpen,
        onClose: () => setCueStudioModalOpen(false),
        track: currentTrack,
        cues: currentTrack && currentTrack.cues && currentTrack.cues.length > 0 ? currentTrack.cues : NV2_COLORS,
        duration: currentTrack.duration || "05:00",
        onUpdateCues: (newCues) => updateCurrentTrackField("cues", newCues),
        selectedCueId,
        onSelectCue: setSelectedCueId,
        onPlayTrack,
        nowPlayingTrack,
        isPlaying,
        onTogglePlay,
        playProgress,
        onGuardarTrack: handleGuardarTrack,
        saveFeedback,
        onAutoPhraseCues: handleAutoPhraseCues
      }
    ));
  };
  var HotCuesWorkspace = ({
    tracks = [],
    setTracks,
    selectedTrack,
    setSelectedTrack,
    onPlayTrack,
    nowPlayingTrack,
    isPlaying,
    onTogglePlay,
    playProgress = 0,
    onNavigateTab,
    lang = "es",
    t = (k) => k,
    currentFolder = "/Users/admin/Music/mi musica",
    setCurrentFolder,
    audioRef
  }) => {
    const currentTrack = tracks && tracks.length > 0 ? tracks.find((t2) => String(t2.id) === String(selectedTrack)) || tracks[0] : null;
    const [zoom, setZoom] = useState(4);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [showBeatgrid, setShowBeatgrid] = useState(true);
    const [followPlayhead, setFollowPlayhead] = useState(true);
    const [selectedCueId, setSelectedCueId] = useState(1);
    const [isRegeneratingMood, setIsRegeneratingMood] = useState(false);
    const [saveStatus, setSaveStatus] = useState("");
    const [isSavingBatch, setIsSavingBatch] = useState(false);
    const [filterQuery, setFilterQuery] = useState("");
    const [fsBrowserOpen, setFsBrowserOpen] = useState(false);
    const [carpetasSistema, setCarpetasSistema] = useState([]);
    const [rutaNavegacion, setRutaNavegacion] = useState(currentFolder || "/Users/admin/Music/mi musica");
    const [isLoadingDir, setIsLoadingDir] = useState(false);
    const [showTrackListDrawer, setShowTrackListDrawer] = useState(false);
    const [pitchPercent, setPitchPercent] = useState(0);
    const [pitchRange, setPitchRange] = useState(8);
    const [eqBass, setEqBass] = useState(0);
    const [eqMid, setEqMid] = useState(0);
    const [eqTreble, setEqTreble] = useState(0);
    const [mobileDeckMode, setMobileDeckMode] = useState("pads");
    const [autoMappingStatus, setAutoMappingStatus] = useState("");
    const handleAutoGenerateClubTemplate = () => {
      if (!currentTrack) return;
      const durClean = durMs > 1e3 ? durMs : 3e5;
      const bpmClean = bpm > 20 ? bpm : 128;
      const beatMs2 = 6e4 / bpmClean;
      const barMsCalc = beatMs2 * 4;
      const downbeatClean = downbeatMs || 0;
      const totalBars = Math.max(8, (durClean - downbeatClean) / barMsCalc);
      let barOffsets = [];
      if (totalBars >= 128) {
        barOffsets = [0, 32, 64, 80, 96, 112, Math.max(116, Math.floor(totalBars - 32)), Math.max(124, Math.floor(totalBars - 8))];
      } else if (totalBars >= 64) {
        barOffsets = [0, 16, 32, 40, 48, 56, Math.max(58, Math.floor(totalBars - 16)), Math.max(62, Math.floor(totalBars - 4))];
      } else {
        const step = Math.max(1, totalBars / 8);
        barOffsets = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => Math.floor(i * step));
      }
      const templateNames = [
        "Intro / Downbeat",
        "First Beat (Percussion)",
        "Breakdown Principal",
        "Drop (Climax)",
        "Loop R\xEDtmico (16 Compases)",
        "Loop R\xEDtmico (32 Compases)",
        "Outro Mix Point",
        "Outro End"
      ];
      const generatedCues = NV2_COLORS.map((cfg, idx) => {
        const bOffset = barOffsets[idx] !== void 0 ? barOffsets[idx] : idx * 16;
        const compas = bOffset + 1;
        const pMs = Math.min(durClean - 1e3, Math.floor(downbeatClean + bOffset * barMsCalc));
        const sec = pMs / 1e3;
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        const timeStr = `${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
        const pctVal = durClean > 0 ? pMs / durClean : 0;
        return {
          id: idx + 1,
          name: `${templateNames[idx]} (Bar ${compas})`,
          short_name: templateNames[idx],
          time: timeStr,
          pos_ms: pMs,
          pct: pctVal,
          color: cfg.color,
          rgb: cfg.rgb,
          text: cfg.text,
          border: cfg.border,
          bg: cfg.bg
        };
      });
      const updatedTrack = { ...currentTrack, cues: generatedCues };
      if (setTracks) {
        setTracks((prev) => prev.map((t2) => String(t2.id) === String(currentTrack.id) ? updatedTrack : t2));
      }
      setAutoMappingStatus("\xA1Plantilla Club Extended auto-generada con \xE9xito en los 8 pads!");
      setTimeout(() => setAutoMappingStatus(""), 4e3);
    };
    const handlePitchChange = (newPitch) => {
      const clamped = Math.max(-pitchRange, Math.min(pitchRange, Math.round(newPitch * 100) / 100));
      setPitchPercent(clamped);
      const rate = 1 + clamped / 100;
      const audio = audioRef?.current || window.__bwGlobalAudio;
      if (audio) {
        audio.playbackRate = Math.max(0.2, Math.min(2, rate));
      }
    };
    const handleNudgePitch = (delta) => {
      handlePitchChange(pitchPercent + delta);
    };
    const handleEqChange = (band, val) => {
      const audio = audioRef?.current || window.__bwGlobalAudio;
      const nodes = getAudioEQNodes(audio);
      if (band === "bass") {
        setEqBass(val);
        if (nodes && nodes.low) nodes.low.gain.value = val;
      } else if (band === "mid") {
        setEqMid(val);
        if (nodes && nodes.mid) nodes.mid.gain.value = val;
      } else if (band === "treble") {
        setEqTreble(val);
        if (nodes && nodes.high) nodes.high.gain.value = val;
      }
    };
    const handleResetEQ = () => {
      handleEqChange("bass", 0);
      handleEqChange("mid", 0);
      handleEqChange("treble", 0);
    };
    const handleDeckTogglePlay = () => {
      if (!currentTrack) return;
      if (isCurrentPlayingThis) {
        if (onTogglePlay) onTogglePlay();
      } else {
        if (onPlayTrack) {
          onPlayTrack(currentTrack, playProgress > 0 ? playProgress : 0, true);
        }
      }
    };
    const handleDeckCue = () => {
      if (!currentTrack) return;
      const firstCue = activeCues[0] || {};
      const cueMs = firstCue.pos_ms !== void 0 ? firstCue.pos_ms : downbeatMs || 0;
      const cuePct = durMs > 0 ? cueMs / durMs : 0;
      if (onPlayTrack) {
        onPlayTrack(currentTrack, cuePct, false);
      }
    };
    const audioDurMs = audioRef && audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0.5 ? Math.round(audioRef.current.duration * 1e3) : null;
    const durMs = audioDurMs || parseDurationMs(currentTrack?.duration || "05:00");
    const bpm = currentTrack && (currentTrack.bpm || currentTrack.b) ? Math.max(30, parseFloat(currentTrack.bpm || currentTrack.b) || 128) : 128;
    const beatMs = 6e4 / bpm;
    const barMs = beatMs * 4;
    const downbeatMs = currentTrack && currentTrack.first_downbeat_ms ? parseFloat(currentTrack.first_downbeat_ms) : 0;
    const CLUB_CUE_RATIOS = [5e-3, 0.12, 0.25, 0.4, 0.55, 0.7, 0.85, 0.94];
    const CLUB_CUE_NAMES = [
      "Intro / Downbeat",
      "Percussion / Beat",
      "Bassline Groove",
      "Breakdown 1",
      "Drop 1 (Climax)",
      "Mid Breakdown",
      "Drop 2 (Re-Kick)",
      "Outro Mix Point"
    ];
    const activeCues = Array.from({ length: 8 }, (_, idx) => {
      const padNum = idx + 1;
      const existing = currentTrack && currentTrack.cues && currentTrack.cues[idx] ? currentTrack.cues[idx] : null;
      const defaultColor = NV2_COLORS[idx] ? NV2_COLORS[idx].color : "#06b6d4";
      const defaultName = CLUB_CUE_NAMES[idx] || `Cue ${padNum}`;
      const defaultPosMs = Math.round(durMs * CLUB_CUE_RATIOS[idx]);
      const defaultTime = formatMsToTime(defaultPosMs);
      if (existing) {
        let cuePos = existing.pos_ms !== void 0 ? existing.pos_ms : parseTimeToMs(existing.time || defaultTime);
        if (cuePos >= durMs - 250) {
          cuePos = defaultPosMs;
        }
        return {
          id: padNum,
          name: existing.name || defaultName,
          color: existing.color || defaultColor,
          time: formatMsToTime(cuePos),
          pos_ms: cuePos,
          pct: durMs > 0 ? cuePos / durMs : CLUB_CUE_RATIOS[idx],
          bar: existing.bar || Math.max(1, Math.floor((cuePos - downbeatMs) / barMs) + 1),
          bar_str: existing.bar_str || `Bar ${Math.max(1, Math.floor((cuePos - downbeatMs) / barMs) + 1)}`
        };
      }
      return {
        id: padNum,
        name: defaultName,
        color: defaultColor,
        time: defaultTime,
        pos_ms: defaultPosMs,
        pct: CLUB_CUE_RATIOS[idx],
        bar: Math.max(1, Math.floor((defaultPosMs - downbeatMs) / barMs) + 1),
        bar_str: `Bar ${Math.max(1, Math.floor((defaultPosMs - downbeatMs) / barMs) + 1)}`
      };
    });
    const currentCue = activeCues.find((c) => (c.id !== void 0 ? c.id : 1) === selectedCueId) || activeCues[0] || {};
    const [cueNameInput, setCueNameInput] = useState(currentCue.name || "");
    const [cueTimeInput, setCueTimeInput] = useState(currentCue.time || "00:00.00");
    const [tacticalComment, setTacticalComment] = useState(currentTrack?.comment || "");
    useEffect(() => {
      if (currentTrack) {
        setTacticalComment(currentTrack.comment || "");
      }
    }, [currentTrack?.id, currentTrack?.comment]);
    useEffect(() => {
      setCueNameInput(currentCue.name || currentCue.short_name || `Cue ${selectedCueId}`);
      setCueTimeInput(currentCue.time || "00:00.00");
    }, [selectedCueId, currentCue.time, currentCue.name]);
    const currentMs = playProgress * durMs;
    let activePlayingCueId = 1;
    if (activeCues && activeCues.length > 0) {
      for (let i = activeCues.length - 1; i >= 0; i--) {
        const c = activeCues[i];
        const pos = c.pos_ms !== void 0 ? c.pos_ms : parseTimeToMs(c.time || "0");
        if (currentMs >= pos - 150) {
          activePlayingCueId = c.id !== void 0 ? c.id : i + 1;
          break;
        }
      }
    }
    const updateCurrentTrackField = (field, val) => {
      if (!currentTrack || !setTracks) return;
      const updated = tracks.map((t2) => {
        if (String(t2.id) === String(currentTrack.id)) {
          return { ...t2, [field]: val };
        }
        return t2;
      });
      setTracks(updated);
    };
    const updateCues = (newCues) => {
      updateCurrentTrackField("cues", newCues);
    };
    const updateSingleCue = (updatedFields) => {
      const targetId = currentCue.id !== void 0 ? currentCue.id : selectedCueId;
      const newCues = activeCues.map((c, idx) => {
        const cid = c.id !== void 0 ? c.id : idx + 1;
        if (cid === targetId) {
          return { ...c, ...updatedFields };
        }
        return c;
      });
      updateCues(newCues);
    };
    const handleTimeInputChange = (e) => {
      const val = e.target.value;
      setCueTimeInput(val);
      const ms = parseTimeToMs(val);
      const newPct = durMs > 0 ? Math.max(0, Math.min(1, ms / durMs)) : 0;
      const barNum = Math.max(1, Math.floor((ms - downbeatMs) / barMs) + 1);
      updateSingleCue({
        time: val,
        pos_ms: Math.round(ms),
        pct: newPct,
        bar: barNum,
        bar_str: `Bar ${barNum}`
      });
    };
    const handleNudgeMs = (deltaMs) => {
      const currentMs2 = currentCue.pos_ms !== void 0 ? currentCue.pos_ms : parseTimeToMs(currentCue.time || "00:00.00");
      let newMs = Math.max(0, Math.min(durMs, currentMs2 + deltaMs));
      if (snapToGrid) {
        const beatOffset = Math.round((newMs - downbeatMs) / beatMs);
        newMs = Math.max(0, Math.min(durMs, downbeatMs + beatOffset * beatMs));
      }
      const timeStr = formatMsToTime(newMs);
      const newPct = durMs > 0 ? newMs / durMs : 0;
      const barNum = Math.max(1, Math.floor((newMs - downbeatMs) / barMs) + 1);
      setCueTimeInput(timeStr);
      updateSingleCue({
        time: timeStr,
        pos_ms: Math.round(newMs),
        pct: newPct,
        bar: barNum,
        bar_str: `Bar ${barNum}`
      });
    };
    const handleJumpToCue = (cue) => {
      if (!currentTrack || !onPlayTrack) return;
      const audioDur = audioRef && audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0.5 ? audioRef.current.duration : durMs / 1e3;
      let posMs = cue.pos_ms !== void 0 ? cue.pos_ms : parseTimeToMs(cue.time || "00:00.00");
      const maxMs = Math.max(500, audioDur * 1e3 - 250);
      if (posMs >= maxMs) {
        const padIdx = cue.id ? cue.id - 1 : 0;
        posMs = Math.round(maxMs * CLUB_CUE_RATIOS[padIdx]);
      }
      posMs = Math.max(0, Math.min(maxMs, posMs));
      const targetSec = posMs / 1e3;
      const pct = audioDur > 0 ? targetSec / audioDur : 0;
      onPlayTrack(currentTrack, pct, true, targetSec);
    };
    const handleSetCueAtPlayhead = () => {
      if (!currentTrack) return;
      let currentPlayheadMs = playProgress * durMs;
      if (snapToGrid) {
        const beatOffset = Math.round((currentPlayheadMs - downbeatMs) / beatMs);
        currentPlayheadMs = Math.max(0, Math.min(durMs, downbeatMs + beatOffset * beatMs));
      }
      const timeStr = formatMsToTime(currentPlayheadMs);
      const newPct = durMs > 0 ? currentPlayheadMs / durMs : 0;
      const barNum = Math.max(1, Math.floor((currentPlayheadMs - downbeatMs) / barMs) + 1);
      setCueTimeInput(timeStr);
      updateSingleCue({
        time: timeStr,
        pos_ms: Math.round(currentPlayheadMs),
        pct: newPct,
        bar: barNum,
        bar_str: `Bar ${barNum}`
      });
      setSaveStatus(`\u2713 Pad ${selectedCueId} anclado en ${timeStr}`);
      setTimeout(() => setSaveStatus(""), 2500);
    };
    const handleAutoPhraseCues = async () => {
      if (!currentTrack) return;
      try {
        let calculated = null;
        if (window.eel && window.eel.calcular_hot_cues_fraseo) {
          try {
            calculated = await window.eel.calcular_hot_cues_fraseo(durMs, bpm, Math.round(downbeatMs))();
          } catch (_) {
          }
        }
        if (!calculated || !Array.isArray(calculated) || calculated.length === 0) {
          calculated = CLUB_CUE_RATIOS.map((ratio, idx) => {
            const padNum = idx + 1;
            const posMs = Math.round(durMs * ratio);
            const barNum = Math.max(1, Math.floor((posMs - downbeatMs) / barMs) + 1);
            return {
              id: padNum,
              name: CLUB_CUE_NAMES[idx] || `Cue ${padNum}`,
              color: NV2_COLORS[idx] ? NV2_COLORS[idx].color : "#06b6d4",
              time: formatMsToTime(posMs),
              pos_ms: posMs,
              pct: ratio,
              bar: barNum,
              bar_str: `Bar ${barNum}`
            };
          });
        }
        if (calculated && Array.isArray(calculated)) {
          updateCues(calculated);
          setSaveStatus("\u2713 8 Hot Cues auto-mapeados (Plantilla Club Extended)");
          setTimeout(() => setSaveStatus(""), 2500);
        }
      } catch (e) {
        console.error("Error auto-fraseando:", e);
      }
    };
    const handleGuardarPista = async () => {
      if (!currentTrack) return;
      setSaveStatus("Guardando marcas en disco...");
      try {
        if (window.eel && window.eel.guardar_cambios_track) {
          const trackToSave = {
            ...currentTrack,
            cues: activeCues,
            comment: tacticalComment
          };
          const res = await window.eel.guardar_cambios_track(trackToSave)();
          if (res && res.status === "ok") {
            setSaveStatus("\u2713 Pista guardada en disco con \xE9xito");
          } else {
            setSaveStatus(res?.msg || "Error al guardar pista");
          }
        }
      } catch (e) {
        setSaveStatus("Error de comunicaci\xF3n al guardar");
      } finally {
        setTimeout(() => setSaveStatus(""), 3e3);
      }
    };
    const handleGuardarLote = async () => {
      if (!tracks || tracks.length === 0) return;
      setIsSavingBatch(true);
      setSaveStatus("Inyectando marcas en todas las pistas...");
      try {
        if (window.eel && window.eel.inyectar_lote_metadatos) {
          const res = await window.eel.inyectar_lote_metadatos(tracks)();
          if (res && res.status === "ok") {
            setSaveStatus(`\u2713 ${tracks.length} pistas guardadas e inyectadas`);
          } else {
            setSaveStatus("Guardado de lote completado con advertencias");
          }
        }
      } catch (e) {
        setSaveStatus("Error en guardado masivo");
      } finally {
        setIsSavingBatch(false);
        setTimeout(() => setSaveStatus(""), 3e3);
      }
    };
    const handleRegenerarMood = async () => {
      if (!currentTrack) return;
      setIsRegeneratingMood(true);
      try {
        if (window.eel && window.eel.regenerar_mood_y_comentario) {
          const res = await window.eel.regenerar_mood_y_comentario(currentTrack, lang)();
          if (res && res.status === "ok") {
            updateCurrentTrackField("mood", res.mood);
            updateCurrentTrackField("mood_subtag", res.mood_subtag);
            updateCurrentTrackField("valence", res.valence);
            updateCurrentTrackField("arousal", res.arousal);
            updateCurrentTrackField("comment", res.comment);
            setTacticalComment(res.comment);
            setSaveStatus(`\u2713 Mood: ${res.mood_subtag || res.mood}`);
            setTimeout(() => setSaveStatus(""), 2500);
          }
        }
      } catch (e) {
        console.error("Error regenerando mood:", e);
      } finally {
        setIsRegeneratingMood(false);
      }
    };
    const handleAbrirNavegador = async (dir) => {
      const target = dir || currentFolder || "/Users/admin/Music/mi musica";
      setRutaNavegacion(target);
      setFsBrowserOpen(true);
      if (window.eel && window.eel.listar_subcarpetas_sistema) {
        try {
          const res = await window.eel.listar_subcarpetas_sistema(target)();
          if (res) {
            if (res.current) setRutaNavegacion(res.current);
            if (Array.isArray(res.folders)) {
              setCarpetasSistema(res.folders);
            } else if (Array.isArray(res)) {
              setCarpetasSistema(res);
            } else {
              setCarpetasSistema([]);
            }
          } else {
            setCarpetasSistema([]);
          }
        } catch (err) {
          console.error("Error al listar carpetas:", err);
          setCarpetasSistema([]);
        }
      }
    };
    const handleCargarDirectorio = async (nuevaRuta) => {
      setFsBrowserOpen(false);
      if (setCurrentFolder) setCurrentFolder(nuevaRuta);
      if (window.eel && window.eel.cargar_metadatos_directorio) {
        setIsLoadingDir(true);
        try {
          const res = await window.eel.cargar_metadatos_directorio(nuevaRuta)();
          if (res && Array.isArray(res.tracks)) {
            setTracks(res.tracks);
            if (res.tracks.length > 0) {
              setSelectedTrack(res.tracks[0].id);
            }
          }
        } catch (e) {
          console.error("Error cargando carpeta:", e);
        } finally {
          setIsLoadingDir(false);
        }
      }
    };
    const filteredTracks = (tracks || []).filter((t2) => {
      if (!filterQuery) return true;
      const q = filterQuery.toLowerCase();
      return (t2.title || t2.t || "").toLowerCase().includes(q) || (t2.artist || t2.a || "").toLowerCase().includes(q) || (t2.bpm || t2.b || "").toLowerCase().includes(q) || (t2.key || t2.k || "").toLowerCase().includes(q);
    });
    const isCurrentPlayingThis = isPlaying && nowPlayingTrack && (String(nowPlayingTrack.id) === String(currentTrack?.id) || nowPlayingTrack.path === currentTrack?.path || nowPlayingTrack.f === currentTrack?.f);
    return /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-h-0 w-full flex flex-col bg-[#07070a] overflow-hidden text-gray-200" }, /* @__PURE__ */ React.createElement("header", { className: "h-14 border-b border-djzinc-800 bg-[#0a0a0f] px-4 flex items-center justify-between shrink-0 gap-3 z-10 shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 min-w-0 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-djzinc-900 border border-djzinc-750 text-xs font-mono text-gray-300 truncate max-w-[200px]", title: currentFolder }, /* @__PURE__ */ React.createElement(Icons.Folder, null), /* @__PURE__ */ React.createElement("span", { className: "truncate" }, currentFolder ? currentFolder.split("/").pop() || currentFolder : "Sin carpeta")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleAbrirNavegador(currentFolder),
        className: "px-3 py-1.5 text-xs font-mono font-black bg-djcyan-500 hover:bg-djcyan-400 text-black rounded-lg shadow-sm transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer",
        title: "Seleccionar carpeta de m\xFAsica"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4C2}"),
      /* @__PURE__ */ React.createElement("span", null, t("btn_change_dir") || "Seleccionar")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleCargarDirectorio(currentFolder),
        className: "px-2.5 py-1.5 text-xs font-mono bg-djzinc-850 hover:bg-djzinc-800 text-gray-300 rounded-lg border border-djzinc-700 cursor-pointer shadow-sm transition-all shrink-0 active:scale-95",
        title: "Recargar directorio actual"
      },
      "\u{1F504}"
    )), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0 max-w-xl flex items-center gap-2" }, filteredTracks && filteredTracks.length > 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "relative flex-1 min-w-0" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: currentTrack ? String(currentTrack.id) : "",
        onChange: (e) => {
          const targetId = e.target.value;
          setSelectedTrack(targetId);
          const found = tracks.find((t2) => String(t2.id) === String(targetId));
          if (found && onPlayTrack) {
            onPlayTrack(found, 0, false);
          }
        },
        className: "w-full bg-djzinc-900 border border-djzinc-750 text-white text-xs font-mono rounded-lg px-2.5 py-1.5 outline-none focus:border-djcyan-500 cursor-pointer truncate shadow-sm",
        title: "Selecciona la pista para editar sus Hot Cues"
      },
      filteredTracks.map((trk, idx) => /* @__PURE__ */ React.createElement("option", { key: trk.id, value: trk.id }, idx + 1, ". ", trk.artist || trk.a || "Artista", " - ", trk.title || trk.t || trk.filename, " (", trk.bpm || trk.b || "--", " BPM \u2022 ", trk.key || trk.k || "--", ")"))
    )), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowTrackListDrawer((prev) => !prev),
        className: `px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow ${showTrackListDrawer ? "bg-djcyan-500 text-black border-djcyan-400 font-black shadow-[0_0_10px_rgba(6,182,212,0.4)]" : "bg-djzinc-900 text-gray-300 border-djzinc-750 hover:bg-djzinc-850 hover:text-white"}`,
        title: "Ver o esconder la tabla completa de pistas de la carpeta"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"),
      /* @__PURE__ */ React.createElement("span", null, showTrackListDrawer ? "Ocultar Lista" : `Ver Lista (${filteredTracks.length})`)
    )) : /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-gray-500 italic" }, "No hay pistas cargadas en esta carpeta.")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 shrink-0" }, saveStatus && /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono font-bold text-djcyan-400 animate-pulse bg-djcyan-950/80 px-2.5 py-1 rounded border border-djcyan-700/60 shadow" }, saveStatus), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleGuardarPista,
        className: "px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black text-xs rounded-lg shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5",
        title: "Guardar cues, downbeat y metadatos de esta pista en el archivo f\xEDsico"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4BE}"),
      /* @__PURE__ */ React.createElement("span", null, t("save_track_disk") || "Guardar Pista")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleGuardarLote,
        disabled: isSavingBatch,
        className: "px-3 py-1.5 bg-djzinc-800 hover:bg-djzinc-750 text-gray-200 hover:text-white border border-djzinc-700 font-mono font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50",
        title: "Inyectar y guardar todos los tracks del lote en disco"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4E6}"),
      /* @__PURE__ */ React.createElement("span", null, t("save_all_disk") || "Guardar Lote")
    ))), showTrackListDrawer && filteredTracks && filteredTracks.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "bg-[#08080d] border-b border-djzinc-800 p-4 shadow-2xl animate-fadeIn max-h-72 overflow-hidden flex flex-col shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between pb-2 mb-2 border-b border-djzinc-800/80" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm" }, "\u{1F3B5}"), /* @__PURE__ */ React.createElement("h3", { className: "text-xs font-bold text-white font-mono uppercase tracking-wider" }, "Pistas en Carpeta: ", filteredTracks.length, " archivos")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: filterQuery,
        onChange: (e) => setFilterQuery(e.target.value),
        placeholder: "Filtrar por t\xEDtulo, artista, BPM...",
        className: "w-56 bg-djzinc-900 border border-djzinc-750 rounded-lg px-2.5 py-1 text-xs text-gray-200 outline-none font-mono placeholder-gray-500"
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowTrackListDrawer(false),
        className: "text-gray-400 hover:text-white text-xs font-mono px-2 py-1 bg-djzinc-900 rounded border border-djzinc-750 cursor-pointer"
      },
      "\u2715 Cerrar"
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto custom-scrollbar divide-y divide-djzinc-850/60 pr-1" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left text-xs font-mono" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "text-gray-500 border-b border-djzinc-800 text-[10px] uppercase" }, /* @__PURE__ */ React.createElement("th", { className: "py-1 px-2 w-10" }, "#"), /* @__PURE__ */ React.createElement("th", { className: "py-1 px-2 w-12" }, "Cover"), /* @__PURE__ */ React.createElement("th", { className: "py-1 px-2" }, "T\xEDtulo / Artista"), /* @__PURE__ */ React.createElement("th", { className: "py-1 px-2 w-20" }, "BPM"), /* @__PURE__ */ React.createElement("th", { className: "py-1 px-2 w-16" }, "Tono"), /* @__PURE__ */ React.createElement("th", { className: "py-1 px-2 w-20" }, "Duraci\xF3n"), /* @__PURE__ */ React.createElement("th", { className: "py-1 px-2 w-24 text-right" }, "Acci\xF3n"))), /* @__PURE__ */ React.createElement("tbody", null, filteredTracks.map((trk, idx) => {
      const isSel = currentTrack && String(currentTrack.id) === String(trk.id);
      return /* @__PURE__ */ React.createElement(
        "tr",
        {
          key: trk.id,
          onClick: () => {
            setSelectedTrack(trk.id);
            if (onPlayTrack) onPlayTrack(trk, 0, false);
          },
          className: `hover:bg-djzinc-900/80 cursor-pointer transition-colors ${isSel ? "bg-djcyan-950/40 text-djcyan-300 font-bold" : "text-gray-300"}`
        },
        /* @__PURE__ */ React.createElement("td", { className: "py-1.5 px-2 text-gray-500" }, idx + 1),
        /* @__PURE__ */ React.createElement("td", { className: "py-1.5 px-2" }, /* @__PURE__ */ React.createElement(
          "img",
          {
            src: getValidCover(trk.cover || (trk.path ? `/cover?path=${encodeURIComponent(trk.path)}` : null)),
            alt: "Cover",
            onError: (e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_VINYL_SVG;
            },
            className: "w-7 h-7 rounded object-cover border border-djzinc-750"
          }
        )),
        /* @__PURE__ */ React.createElement("td", { className: "py-1.5 px-2" }, /* @__PURE__ */ React.createElement("div", { className: "truncate max-w-xs sm:max-w-md font-bold text-white" }, trk.title || trk.t || trk.filename), /* @__PURE__ */ React.createElement("div", { className: "truncate max-w-xs text-[11px] text-gray-400" }, trk.artist || trk.a || "Artista Desconocido")),
        /* @__PURE__ */ React.createElement("td", { className: "py-1.5 px-2 font-mono text-gray-300" }, trk.bpm || trk.b || "--"),
        /* @__PURE__ */ React.createElement("td", { className: "py-1.5 px-2 font-mono text-djcyan-400" }, trk.key || trk.k || "--"),
        /* @__PURE__ */ React.createElement("td", { className: "py-1.5 px-2 text-gray-400" }, trk.duration || "--"),
        /* @__PURE__ */ React.createElement("td", { className: "py-1.5 px-2 text-right" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: (e) => {
              e.stopPropagation();
              setSelectedTrack(trk.id);
              setShowTrackListDrawer(false);
              if (onPlayTrack) onPlayTrack(trk, 0, true);
            },
            className: "px-2.5 py-1 bg-djcyan-500 hover:bg-djcyan-400 text-black text-[10px] font-mono font-bold rounded cursor-pointer shadow active:scale-95"
          },
          "\u25B6 Cargar"
        ))
      );
    }))))), currentTrack ? /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-h-0 flex flex-col p-4 overflow-y-auto custom-scrollbar gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-b from-[#181826] via-[#101018] to-[#0a0a0f] border-2 border-djzinc-800 rounded-2xl p-4 shadow-2xl relative" }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-djcyan-500/40 to-transparent" }), /* @__PURE__ */ React.createElement("div", { className: "flex md:hidden items-center justify-between p-1 bg-[#090912] border border-djzinc-800 rounded-xl mb-4 gap-1" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setMobileDeckMode("pads"),
        className: `flex-1 py-2 rounded-lg text-xs font-mono font-black transition-all text-center cursor-pointer ${mobileDeckMode === "pads" ? "bg-gradient-to-r from-djcyan-400 to-djcyan-500 text-black shadow-md scale-[1.02]" : "text-gray-400 hover:text-white hover:bg-djzinc-850"}`
      },
      "\u{1F39B}\uFE0F 8 PADS"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setMobileDeckMode("eq_pitch"),
        className: `flex-1 py-2 rounded-lg text-xs font-mono font-black transition-all text-center cursor-pointer ${mobileDeckMode === "eq_pitch" ? "bg-gradient-to-r from-djcyan-400 to-djcyan-500 text-black shadow-md scale-[1.02]" : "text-gray-400 hover:text-white hover:bg-djzinc-850"}`
      },
      "\u{1F39A}\uFE0F EQ & TEMPO"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setMobileDeckMode("vinyl"),
        className: `flex-1 py-2 rounded-lg text-xs font-mono font-black transition-all text-center cursor-pointer ${mobileDeckMode === "vinyl" ? "bg-gradient-to-r from-djcyan-400 to-djcyan-500 text-black shadow-md scale-[1.02]" : "text-gray-400 hover:text-white hover:bg-djzinc-850"}`
      },
      '\u{1F4BD} VINILO 12"'
    )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col xl:flex-row items-center justify-between gap-6" }, /* @__PURE__ */ React.createElement("div", { className: `flex-wrap sm:flex-nowrap items-center gap-5 shrink-0 ${mobileDeckMode === "vinyl" ? "flex" : "hidden md:flex"}` }, /* @__PURE__ */ React.createElement("div", { className: "relative group shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-full bg-gradient-to-tr from-[#0a0a0f] via-[#161622] to-[#0c0c14] border-4 border-[#2c2c3e] shadow-[0_12px_40px_rgba(0,0,0,0.85),inset_0_2px_6px_rgba(255,255,255,0.18)] p-2.5 flex items-center justify-center relative select-none" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-1 rounded-full border border-dashed border-djzinc-650/40 pointer-events-none" }), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "w-full h-full rounded-full relative overflow-hidden flex items-center justify-center shadow-2xl select-none pointer-events-none",
        title: "Plato de Vinilo Direct-Drive (Visual)",
        style: {
          background: "radial-gradient(circle, #22222a 0%, #121217 38%, #1a1a24 49%, #0d0d12 62%, #161620 78%, #08080c 100%)",
          boxShadow: "inset 0 0 18px rgba(0,0,0,0.95), 0 0 15px rgba(0,0,0,0.8)",
          animation: isCurrentPlayingThis ? "spinVinylContinuous 3s linear infinite" : "none"
        }
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "absolute inset-0 rounded-full pointer-events-none opacity-40",
          style: {
            background: "repeating-radial-gradient(circle, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3.5px)"
          }
        }
      ),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "absolute inset-0 rounded-full pointer-events-none opacity-25",
          style: {
            background: "conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.12) 60deg, transparent 120deg, transparent 180deg, rgba(255,255,255,0.12) 240deg, transparent 300deg)"
          }
        }
      ),
      /* @__PURE__ */ React.createElement("div", { className: "w-20 h-20 sm:w-24 sm:h-24 md:w-26 md:h-26 rounded-full border-2 border-djzinc-500/80 shadow-[0_0_12px_rgba(0,0,0,0.8),inset_0_0_8px_rgba(0,0,0,0.6)] relative overflow-hidden flex items-center justify-center z-10 bg-black" }, /* @__PURE__ */ React.createElement(
        "img",
        {
          src: getValidCover(currentTrack.cover || (currentTrack.path ? `/cover?path=${encodeURIComponent(currentTrack.path)}` : null)),
          alt: "Vinyl Label Cover",
          onError: (e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_VINYL_SVG;
          },
          className: "w-full h-full object-cover rounded-full"
        }
      ), /* @__PURE__ */ React.createElement("div", { className: "absolute w-4 h-4 rounded-full bg-gradient-to-tr from-amber-700 via-amber-400 to-amber-200 border border-black shadow-[inset_0_1px_3px_rgba(0,0,0,0.9),0_0_4px_rgba(0,0,0,0.8)] z-20 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-1.5 h-1.5 rounded-full bg-black" })))
    ), /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-1.5 left-2 bg-black/85 backdrop-blur px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-gray-300 border border-djzinc-750 flex items-center gap-1.5 shadow-lg" }, /* @__PURE__ */ React.createElement("span", { className: `w-1.5 h-1.5 rounded-full ${isCurrentPlayingThis ? "bg-emerald-400 shadow-[0_0_6px_#10b981] animate-pulse" : "bg-gray-500"}` }), /* @__PURE__ */ React.createElement("span", null, "33\u2153 RPM")), /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-1.5 right-2 bg-black/85 backdrop-blur px-2 py-0.5 rounded-full text-[9px] font-mono font-black text-djcyan-400 border border-djzinc-750 shadow-lg" }, currentTrack.format || "FLAC"))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-3 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleDeckCue,
        className: `w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center font-mono font-black text-xs cursor-pointer shadow-xl transition-all active:scale-90 select-none ${!isCurrentPlayingThis ? "bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse" : "bg-[#181824] border-amber-700/60 text-amber-500 hover:border-amber-400 hover:text-amber-300"}`,
        title: "CUE: Regresar al punto de inicio maestro"
      },
      /* @__PURE__ */ React.createElement("span", { className: "tracking-wider text-xs" }, "CUE")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleDeckTogglePlay,
        className: `w-12 h-12 rounded-full border-2 flex items-center justify-center cursor-pointer shadow-xl transition-all active:scale-90 select-none ${isCurrentPlayingThis ? "bg-emerald-500 border-white text-black font-black shadow-[0_0_25px_rgba(16,185,129,0.9)]" : "bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse"}`,
        title: "PLAY/PAUSE: Iniciar o pausar reproducci\xF3n"
      },
      isCurrentPlayingThis ? /* @__PURE__ */ React.createElement("span", { className: "text-black font-black text-base" }, "\u275A\u275A") : /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400 font-black text-lg ml-0.5" }, "\u25B6")
    ), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-0.5" }, /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-600/50 text-[10px] font-mono font-black uppercase tracking-wider w-fit" }, "DECK 1 \u2022 MASTER"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-400" }, isCurrentPlayingThis ? "\u25CF REPRODUCIENDO" : "\u25CB EN ESPERA"))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-w-0 max-w-[240px]" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-djcyan-400 font-extrabold bg-[#0d0d16] px-2 py-0.5 rounded border border-djzinc-750" }, bpm.toFixed(1), " BPM"), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-purple-300 font-extrabold bg-[#130d1e] px-2 py-0.5 rounded border border-purple-800/60" }, currentTrack.key || "8A")), /* @__PURE__ */ React.createElement("h3", { className: "text-sm sm:text-base font-black text-white truncate mt-1.5", title: currentTrack.title || currentTrack.t }, currentTrack.title || currentTrack.t || "Track"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-djcyan-400 font-bold truncate", title: currentTrack.artist || currentTrack.a }, currentTrack.artist || currentTrack.a || "Artista"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-1.5 text-xs font-mono font-bold" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-300 bg-djcyan-950/60 px-2 py-0.5 rounded border border-djcyan-800/40" }, formatMsToTime(playProgress * durMs)), /* @__PURE__ */ React.createElement("span", { className: "text-gray-500" }, "/"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "-", formatMsToTime(Math.max(0, durMs - playProgress * durMs)))))), /* @__PURE__ */ React.createElement("div", { className: `flex-col items-center justify-between bg-[#080811] p-2 rounded-xl border border-djzinc-800 shadow-inner shrink-0 ${mobileDeckMode === "eq_pitch" ? "flex w-full sm:w-auto" : "hidden md:flex"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between w-full border-b border-djzinc-800/80 pb-1 mb-1 text-[9px] font-mono font-bold" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "EQ 3-BAND"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleResetEQ,
        className: "text-[8px] font-mono text-gray-400 hover:text-djcyan-400 px-1 py-0.5 rounded hover:bg-djzinc-800 transition-colors",
        title: "Resetear EQ a 0.0 dB"
      },
      "FLAT"
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(RotaryKnob, { label: "HI", value: eqTreble, onChange: (v) => handleEqChange("treble", v), color: "#06b6d4" }), /* @__PURE__ */ React.createElement(RotaryKnob, { label: "MID", value: eqMid, onChange: (v) => handleEqChange("mid", v), color: "#f59e0b" }), /* @__PURE__ */ React.createElement(RotaryKnob, { label: "LOW", value: eqBass, onChange: (v) => handleEqChange("bass", v), color: "#ef4444" })))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0 max-w-3xl flex flex-col md:flex-row items-stretch gap-3 w-full" }, /* @__PURE__ */ React.createElement("div", { "data-tour": "tour-hotcues-deck", className: `flex-1 min-w-0 bg-[#09090f] p-3 rounded-xl border border-djzinc-800 shadow-inner ${mobileDeckMode === "pads" ? "block" : "hidden md:block"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800/80 pb-2 mb-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 bg-[#12121c] px-2 py-0.5 rounded border border-djzinc-750" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-djcyan-400 shadow-[0_0_8px_#06b6d4]" }), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono font-black text-white uppercase tracking-wider" }, "HOT CUE MODE")), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-400" }, "8 Multi-Color Performance Pads \u2022 Halos RGB 1 a 1")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleAutoGenerateClubTemplate,
        className: "px-3 py-1 bg-djcyan-500 hover:bg-djcyan-400 text-black rounded-lg text-xs font-mono font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95",
        title: "Auto-mapear los 8 pads con la Plantilla Club Extended (Intro, Beat, Break, Drop, Loops, Outro) cuantizados al beatgrid"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u26A1"),
      /* @__PURE__ */ React.createElement("span", null, "Auto-Generate Cues (Club Template)")
    ), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-djcyan-400 font-bold" }, isCurrentPlayingThis ? `\u25CF EN SECCI\xD3N: CUE ${activePlayingCueId}` : "PAUSA"))), autoMappingStatus && /* @__PURE__ */ React.createElement("div", { className: "mb-2 px-3 py-1 bg-emerald-950/80 border border-emerald-500/60 rounded text-[10px] font-mono text-emerald-300 font-bold flex items-center gap-2 animate-fadeIn" }, /* @__PURE__ */ React.createElement("span", null, "\u2713"), /* @__PURE__ */ React.createElement("span", null, autoMappingStatus)), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2" }, activeCues.map((cue, idx) => {
      const padNum = cue.id !== void 0 ? cue.id : idx + 1;
      const isSelected = selectedCueId === padNum;
      const isPlayingThisCue = activePlayingCueId === padNum && isCurrentPlayingThis;
      const color = cue.color || (NV2_COLORS[idx] ? NV2_COLORS[idx].color : "#ef4444");
      const cueMs = cue.pos_ms !== void 0 ? cue.pos_ms : parseTimeToMs(cue.time || "00:00.00");
      const barNum = Math.max(1, Math.floor((cueMs - downbeatMs) / barMs) + 1);
      const staggerDelay = `${idx * 110}ms`;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: `${currentTrack?.id || "cue"}_pad_${idx}`,
          onClick: () => {
            setSelectedCueId(padNum);
            handleJumpToCue(cue);
          },
          className: `p-2 rounded-lg border-2 flex flex-col justify-between cursor-pointer transition-all select-none relative overflow-hidden group min-h-[68px] ${isPlayingThisCue ? "bg-[#1a1a2c] scale-[1.04] ring-2 ring-white/90 shadow-xl" : isSelected ? "bg-[#141420] border-white shadow-lg" : "bg-[#0e0e16] hover:bg-[#141420] border-djzinc-800"}`,
          style: {
            borderColor: isPlayingThisCue ? color : isSelected ? "#ffffff" : `${color}75`,
            animation: "padHaloIgnite 0.65s cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: staggerDelay,
            "--cue-color": color,
            "--cue-color-alpha": `${color}75`,
            "--cue-color-alpha2": `${color}35`,
            boxShadow: isPlayingThisCue ? `0 0 28px ${color}, 0 0 10px #ffffff, inset 0 0 12px ${color}80` : isSelected ? `0 0 20px #ffffff, 0 0 10px ${color}` : `0 0 16px ${color}55, inset 0 0 8px ${color}20`
          }
        },
        /* @__PURE__ */ React.createElement(
          "div",
          {
            className: `absolute top-0 left-0 right-0 h-1.5 transition-all ${isPlayingThisCue ? "opacity-100 shadow-[0_0_12px_currentColor]" : "opacity-75"}`,
            style: { backgroundColor: color, color }
          }
        ),
        /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "absolute -top-4 -right-4 w-12 h-12 rounded-full pointer-events-none opacity-20 blur-md group-hover:opacity-40 transition-opacity",
            style: { backgroundColor: color }
          }
        ),
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mt-0.5 relative z-10" }, /* @__PURE__ */ React.createElement("span", { className: `text-[10px] font-mono font-black px-1.5 py-0.5 rounded shadow ${isPlayingThisCue ? "bg-white text-black" : "bg-black/70 text-white"}` }, "PAD ", padNum), /* @__PURE__ */ React.createElement(
          "span",
          {
            className: `w-2.5 h-2.5 rounded-full transition-all ${isPlayingThisCue ? "scale-125 animate-ping" : "shadow-[0_0_8px_currentColor]"}`,
            style: { backgroundColor: color, color }
          }
        )),
        /* @__PURE__ */ React.createElement("div", { className: "my-1 truncate relative z-10" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-bold text-gray-200 block truncate group-hover:text-white", title: cue.name || cue.short_name }, cue.name || cue.short_name || `Cue ${padNum}`)),
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[10px] font-mono pt-1 border-t border-djzinc-800/80 relative z-10" }, /* @__PURE__ */ React.createElement("span", { className: "font-extrabold text-djcyan-300" }, cue.time || "00:00.00"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 text-[9px] font-semibold" }, "Bar ", barNum))
      );
    }))), /* @__PURE__ */ React.createElement("div", { className: `flex-col items-center bg-[#07070c] p-2.5 rounded-xl border border-djzinc-800 shadow-inner shrink-0 justify-between w-full md:w-28 ${mobileDeckMode === "eq_pitch" ? "flex" : "hidden md:flex"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between w-full border-b border-djzinc-800/80 pb-1 mb-1 text-[9px] font-mono font-bold" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "TEMPO"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setPitchRange((r) => r === 8 ? 16 : 8),
        className: "text-[8px] px-1 rounded bg-[#151522] border border-djzinc-700 text-djcyan-400 hover:text-white cursor-pointer",
        title: "Alternar rango de pitch"
      },
      "\xB1",
      pitchRange,
      "%"
    )), /* @__PURE__ */ React.createElement("div", { className: "text-center my-0.5" }, /* @__PURE__ */ React.createElement("div", { className: "text-[11px] font-mono font-black text-djcyan-300 tracking-tight" }, pitchPercent > 0 ? `+${pitchPercent.toFixed(2)}` : pitchPercent.toFixed(2), "%"), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] font-mono font-extrabold text-amber-400" }, (bpm * (1 + pitchPercent / 100)).toFixed(1), " ", /* @__PURE__ */ React.createElement("span", { className: "text-[7.5px] text-gray-500 font-normal" }, "BPM"))), /* @__PURE__ */ React.createElement("div", { className: "relative flex items-center justify-center my-1 h-24" }, /* @__PURE__ */ React.createElement("div", { className: "absolute w-5 h-0.5 bg-djcyan-500/60 top-1/2 -translate-y-1/2 pointer-events-none z-10 shadow-[0_0_6px_#06b6d4]" }), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "range",
        min: -pitchRange,
        max: pitchRange,
        step: 0.05,
        value: pitchPercent,
        onChange: (e) => handlePitchChange(parseFloat(e.target.value)),
        className: "pitch-slider-vertical",
        style: {
          writingMode: "vertical-lr",
          direction: "rtl",
          height: "95px",
          width: "18px",
          accentColor: "#06b6d4",
          cursor: "pointer"
        },
        title: "Pitch Fader: Ajusta velocidad y tempo din\xE1micamente"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 w-full pt-1.5 border-t border-djzinc-800/80 justify-center" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleNudgePitch(-0.1),
        className: "w-6 h-5 rounded bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 font-mono font-black text-[10px] flex items-center justify-center border border-djzinc-700 active:scale-95 shadow cursor-pointer",
        title: "Nudge BPM -"
      },
      "-"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handlePitchChange(0),
        className: "px-1.5 h-5 rounded bg-[#141420] hover:bg-djcyan-950 text-gray-400 hover:text-djcyan-300 font-mono font-bold text-[8px] flex items-center justify-center border border-djzinc-750 active:scale-95 shadow cursor-pointer",
        title: "Reset Tempo (0.0%)"
      },
      "0%"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleNudgePitch(0.1),
        className: "w-6 h-5 rounded bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 font-mono font-black text-[10px] flex items-center justify-center border border-djzinc-700 active:scale-95 shadow cursor-pointer",
        title: "Nudge BPM +"
      },
      "+"
    )))))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-djzinc-950/80 border border-djzinc-850 px-3 py-2 rounded-lg gap-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold font-mono text-gray-300 uppercase flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(Icons.ZoomIn, null), /* @__PURE__ */ React.createElement("span", null, t("zoom_level") || "Zoom Horizontal", ":")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center bg-djzinc-900 p-0.5 rounded-lg border border-djzinc-800 text-xs font-mono" }, [
      { z: 1, label: "1x (Total)" },
      { z: 2, label: "2x" },
      { z: 4, label: "4x (DJ)" },
      { z: 8, label: "8x (Beat)" },
      { z: 16, label: "16x (Micro)" }
    ].map((lvl) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: lvl.z,
        type: "button",
        onClick: () => setZoom(lvl.z),
        className: `px-2.5 py-1 rounded cursor-pointer font-bold transition-all ${zoom === lvl.z ? "bg-djcyan-500 text-black shadow" : "text-gray-400 hover:text-white hover:bg-djzinc-800"}`
      },
      lvl.label
    )))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setSnapToGrid((prev) => !prev),
        className: `px-3 py-1 text-xs font-mono font-bold rounded-lg border cursor-pointer transition-all flex items-center gap-1.5 shadow-sm ${snapToGrid ? "bg-djzinc-800 text-djcyan-400 border-djcyan-500/60 font-black shadow-[0_0_8px_rgba(6,182,212,0.25)]" : "bg-djzinc-900 text-gray-400 border-djzinc-750 hover:text-white"}`,
        title: "Alinear marcadores autom\xE1ticamente a los tiempos del comp\xE1s"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F9F2}"),
      /* @__PURE__ */ React.createElement("span", null, snapToGrid ? "Snap: ON" : "Snap: OFF")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowBeatgrid((prev) => !prev),
        className: `px-3 py-1 text-xs font-mono font-bold rounded-lg border cursor-pointer transition-all flex items-center gap-1.5 shadow-sm ${showBeatgrid ? "bg-djzinc-800 text-djcyan-400 border-djcyan-500/60 font-black shadow-[0_0_8px_rgba(6,182,212,0.25)]" : "bg-djzinc-900 text-gray-400 border-djzinc-750 hover:text-white"}`,
        title: "Mostrar l\xEDneas de comp\xE1s y frases de 16 compases"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F532}"),
      /* @__PURE__ */ React.createElement("span", null, showBeatgrid ? "Beatgrid: ON" : "Beatgrid: OFF")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setFollowPlayhead((prev) => !prev),
        className: `px-3 py-1 text-xs font-mono font-bold rounded-lg border cursor-pointer transition-all flex items-center gap-1.5 shadow-sm ${followPlayhead ? "bg-djzinc-800 text-djcyan-400 border-djcyan-500/60 font-black shadow-[0_0_8px_rgba(6,182,212,0.25)]" : "bg-djzinc-900 text-gray-400 border-djzinc-750 hover:text-white"}`,
        title: "Centrar autom\xE1ticamente el scroll horizontal en la aguja de reproducci\xF3n"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F3AF}"),
      /* @__PURE__ */ React.createElement("span", null, followPlayhead ? "Seguir: ON" : "Seguir: OFF")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleAutoPhraseCues,
        className: "px-3.5 py-1 bg-djzinc-850 hover:bg-djzinc-750 text-gray-200 hover:text-white font-mono font-bold text-xs rounded-lg border border-djzinc-700 cursor-pointer shadow-sm transition-all active:scale-95 flex items-center gap-1.5",
        title: "Calcular autom\xE1ticamente 8 Hot Cues por frases musicales (16/32 compases)"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u26A1"),
      /* @__PURE__ */ React.createElement("span", null, t("auto_phrase") || "Auto-Frasear 16/32b")
    ))), /* @__PURE__ */ React.createElement("div", { className: "bg-[#09090e] border border-djzinc-800 rounded-xl p-3 shadow-xl" }, /* @__PURE__ */ React.createElement(
      ZoomableRekordboxWaveform,
      {
        track: currentTrack,
        cues: activeCues,
        duration: currentTrack.duration || "05:00",
        onSeekTrack: onPlayTrack,
        playProgress: isCurrentPlayingThis ? playProgress : 0,
        isCurrentPlaying: isCurrentPlayingThis,
        onUpdateCues: updateCues,
        selectedCueId,
        onSelectCue: setSelectedCueId,
        snapToGrid,
        showBeatgrid,
        zoom,
        followPlayhead,
        height: 160,
        lang
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[10px] font-mono text-gray-400 pt-2 border-t border-djzinc-800/80 mt-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_6px_#2563eb]" }), " \u{1F534} Sub/Bass (<150Hz)"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_6px_#dc2626]" }), " \u{1F7E0} Low-Mid / Drums (150-800Hz)"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]" }), " \u{1F7E2} Mid-High / Vocales (800-4kHz)"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" }), " \u{1F535} Treble / Platos (>4kHz)")), /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 font-mono" }, "Desplazamiento horizontal milim\xE9trico \u2022 Rejilla Serato/Rekordbox"))), /* @__PURE__ */ React.createElement("div", { className: "bg-[#0a0a10] border border-djzinc-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-djcyan-400 font-mono bg-djcyan-950/80 px-2.5 py-1 rounded border border-djcyan-700/60" }, "PAD ", selectedCueId, " (", currentCue.name || `Cue ${selectedCueId}`, ")"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: cueNameInput,
        onChange: (e) => {
          setCueNameInput(e.target.value);
          updateSingleCue({ name: e.target.value, short_name: e.target.value });
        },
        placeholder: "Nombre del punto (ej. Drop A)",
        className: "w-48 bg-djzinc-900 border border-djzinc-750 rounded-lg px-2.5 py-1 text-xs text-white font-mono outline-none"
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: cueTimeInput,
        onChange: handleTimeInputChange,
        placeholder: "00:00.00",
        className: "w-24 bg-djzinc-900 border border-djzinc-750 rounded-lg px-2 py-1 text-xs text-djcyan-400 font-mono font-bold outline-none text-center"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 font-mono text-xs" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-bold uppercase mr-1" }, "Nudge:"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleNudgeMs(-barMs),
        className: "px-2.5 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 hover:text-white rounded border border-djzinc-750 font-bold cursor-pointer shadow-sm active:scale-95 transition-colors",
        title: "Retroceder 1 comp\xE1s (4 beats)"
      },
      "-1c"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleNudgeMs(-beatMs),
        className: "px-2.5 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 hover:text-white rounded border border-djzinc-750 font-bold cursor-pointer shadow-sm active:scale-95 transition-colors",
        title: "Retroceder 1 beat (negra)"
      },
      "-1b"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleNudgeMs(-10),
        className: "px-2.5 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 hover:text-white rounded border border-djzinc-750 font-bold cursor-pointer shadow-sm active:scale-95 transition-colors",
        title: "Retroceder 10 milisegundos"
      },
      "-10ms"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleNudgeMs(10),
        className: "px-2.5 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 hover:text-white rounded border border-djzinc-750 font-bold cursor-pointer shadow-sm active:scale-95 transition-colors",
        title: "Avanzar 10 milisegundos"
      },
      "+10ms"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleNudgeMs(beatMs),
        className: "px-2.5 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 hover:text-white rounded border border-djzinc-750 font-bold cursor-pointer shadow-sm active:scale-95 transition-colors",
        title: "Avanzar 1 beat (negra)"
      },
      "+1b"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleNudgeMs(barMs),
        className: "px-2.5 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 hover:text-white rounded border border-djzinc-750 font-bold cursor-pointer shadow-sm active:scale-95 transition-colors",
        title: "Avanzar 1 comp\xE1s (4 beats)"
      },
      "+1c"
    )), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleSetCueAtPlayhead,
        className: "px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-xs rounded-lg shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5",
        title: "Fijar el Pad seleccionado en la posici\xF3n actual de reproducci\xF3n"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4CD}"),
      /* @__PURE__ */ React.createElement("span", null, "Fijar Pad ", selectedCueId, " en Playhead")
    )), /* @__PURE__ */ React.createElement("div", { className: "bg-[#0c0c14] border border-djzinc-800 rounded-xl p-4 shadow-lg space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800 pb-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" }), t("tactical_comment_title") || "Comentario T\xE1ctico DJ & Inteligencia Ac\xFAstica"), /* @__PURE__ */ React.createElement(
      InfoTip,
      {
        title: "Motor de Inteligencia Ac\xFAstica",
        text: "Clasifica la atm\xF3sfera sonora (Mood) analizando la energ\xEDa arm\xF3nica Camelot y genera comentarios t\xE1cticos de mezcla inyectables en el tag ID3 COMM visible en las pantallas de la mesa de mezclas."
      }
    )), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleRegenerarMood,
        disabled: isRegeneratingMood,
        className: "px-3 py-1 bg-djzinc-800 hover:bg-djzinc-750 text-gray-200 hover:text-white border border-djzinc-700 rounded-lg text-xs font-mono font-bold shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50",
        title: "Recalcular m\xE9tricas de atm\xF3sfera sonora y comentario t\xE1ctico con IA ac\xFAstica"
      },
      /* @__PURE__ */ React.createElement("span", null, isRegeneratingMood ? "\u23F3" : "\u2728"),
      /* @__PURE__ */ React.createElement("span", null, t("regenerate_mood_btn") || "Regenerar con IA Ac\xFAstica")
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-4 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-2.5 rounded-lg border border-djzinc-800 flex flex-col justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 uppercase font-mono" }, "Atm\xF3sfera Sonora"), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-amber-300 font-mono mt-1" }, currentTrack.mood_subtag || currentTrack.mood || "Peak Time / Driving")), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-2.5 rounded-lg border border-djzinc-800 flex flex-col justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 uppercase font-mono" }, "Positividad (Valence)"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mt-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-djcyan-400 font-mono" }, currentTrack.valence || 55, "%"), /* @__PURE__ */ React.createElement("div", { className: "w-20 bg-djzinc-800 h-1.5 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "bg-djcyan-400 h-full rounded-full",
        style: { width: `${currentTrack.valence || 55}%` }
      }
    )))), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-2.5 rounded-lg border border-djzinc-800 flex flex-col justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 uppercase font-mono" }, "Intensidad (Arousal)"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mt-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-emerald-400 font-mono" }, currentTrack.arousal || currentTrack.energy || 85, "%"), /* @__PURE__ */ React.createElement("div", { className: "w-20 bg-djzinc-800 h-1.5 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "bg-emerald-400 h-full rounded-full",
        style: { width: `${currentTrack.arousal || currentTrack.energy || 85}%` }
      }
    )))), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-950 p-2.5 rounded-lg border border-djzinc-800 flex flex-col justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 uppercase font-mono" }, "Mix Arm\xF3nico Camelot"), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-white font-mono mt-1 truncate" }, currentTrack.key || "8A", ": neutral | rel ", (currentTrack.key || "8A").endsWith("A") ? (currentTrack.key || "8A").replace("A", "B") : (currentTrack.key || "8A").replace("B", "A")))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] font-mono text-gray-400 mb-1" }, /* @__PURE__ */ React.createElement("span", null, "Texto que se inyectar\xE1 en el tag ID3 COMM de la pista:"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-djcyan-400" }, "Editable manualmente")), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        value: tacticalComment,
        onChange: (e) => {
          setTacticalComment(e.target.value);
          updateCurrentTrackField("comment", e.target.value);
        },
        rows: "3",
        className: "w-full bg-djzinc-950 border border-djzinc-750 rounded-lg p-2.5 text-xs text-gray-200 outline-none font-mono resize-none focus:border-djcyan-500 transition-colors shadow-inner",
        placeholder: "Escribe aqu\xED el comentario estrat\xE9gico para cabina DJ..."
      }
    )))) : /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-h-0 flex flex-col p-6 overflow-y-auto custom-scrollbar gap-6 items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-4xl w-full bg-gradient-to-b from-[#181828] via-[#10101a] to-[#08080f] border-2 border-djzinc-800 rounded-2xl p-6 shadow-2xl relative flex flex-col items-center" }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-djcyan-400 to-pink-500 rounded-t-2xl" }), /* @__PURE__ */ React.createElement("div", { className: "w-full flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-djzinc-800 pb-4 mb-4 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, "\u{1F39B}\uFE0F"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-black text-white font-mono tracking-wider flex items-center gap-2" }, "PIONEER DJ \u2022 HOT CUES STUDIO", /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[10px] bg-djcyan-950 text-djcyan-300 border border-djcyan-700/60 font-bold" }, "LISTO")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 font-mono" }, "Mapeo de 8 Hot Cues por frases musicales, beatgrid milim\xE9trico y compatibilidad Rekordbox & Serato"))), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleAbrirNavegador(currentFolder),
        className: "px-4 py-2 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-bold text-xs rounded-lg shadow-lg hover:shadow-djcyan-500/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4C2}"),
      /* @__PURE__ */ React.createElement("span", null, "Cargar Carpeta de M\xFAsica")
    )), tracks && tracks.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "w-full bg-[#09090f] p-4 rounded-xl border border-djzinc-800 shadow-inner my-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800/80 pb-2 mb-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono font-black text-white uppercase tracking-wider flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F3B5}"), " Pistas disponibles en la carpeta (", tracks.length, ")"), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-gray-400" }, "Haz clic en cualquier pista para cargarla en el Deck")), /* @__PURE__ */ React.createElement("div", { className: "max-h-60 overflow-y-auto custom-scrollbar divide-y divide-djzinc-850" }, tracks.map((trk, idx) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: trk.id,
        onClick: () => {
          setSelectedTrack(trk.id);
          if (onPlayTrack) onPlayTrack(trk, 0, false);
        },
        className: "p-2.5 hover:bg-djzinc-900 cursor-pointer flex items-center justify-between text-xs font-mono transition-colors"
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 w-6" }, idx + 1), /* @__PURE__ */ React.createElement(
        "img",
        {
          src: getValidCover(trk.cover || (trk.path ? `/cover?path=${encodeURIComponent(trk.path)}` : null)),
          alt: "Cover",
          onError: (e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_VINYL_SVG;
          },
          className: "w-8 h-8 rounded object-cover border border-djzinc-750 shrink-0"
        }
      ), /* @__PURE__ */ React.createElement("div", { className: "truncate" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-white block truncate" }, trk.title || trk.t || trk.filename), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 text-[11px] block truncate" }, trk.artist || trk.a || "Artista"))),
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 text-[11px]" }, trk.bpm || trk.b || "--", " BPM"), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 text-[11px] font-bold" }, trk.key || trk.k || "--"), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: (e) => {
            e.stopPropagation();
            setSelectedTrack(trk.id);
            if (onPlayTrack) onPlayTrack(trk, 0, true);
          },
          className: "px-3 py-1 bg-djcyan-500 hover:bg-djcyan-400 text-black text-[10px] font-bold rounded cursor-pointer shadow active:scale-95"
        },
        "\u25B6 Cargar"
      ))
    )))) : null, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-2xl bg-[#09090f] p-4 rounded-xl border border-djzinc-800 shadow-inner mt-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800/80 pb-2 mb-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono font-black text-white uppercase tracking-wider flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" }), "8 Hot Cues Performance \u2022 C\xF3digo de Colores Oficial"), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-gray-400" }, "Pads 1-4 (Superior) \u2022 Pads 5-8 (Inferior)")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-4 gap-2.5" }, NV2_COLORS.slice(0, 8).map((cue, idx) => {
      const padNum = idx + 1;
      const isSelected = selectedCueId === padNum;
      const color = cue.color || "#ef4444";
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: idx,
          onClick: () => setSelectedCueId(padNum),
          className: `p-2.5 rounded-lg border-2 flex flex-col justify-between cursor-pointer transition-all select-none relative overflow-hidden group min-h-[66px] ${isSelected ? "bg-[#181826] scale-105 shadow-xl" : "bg-[#0f0f18] hover:bg-[#14141e]"}`,
          style: {
            borderColor: isSelected ? "#ffffff" : `${color}80`,
            boxShadow: isSelected ? `0 0 20px ${color}` : `0 0 8px ${color}30`
          }
        },
        /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 left-0 right-0 h-1", style: { backgroundColor: color } }),
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mt-0.5" }, /* @__PURE__ */ React.createElement("span", { className: `text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${isSelected ? "bg-white text-black" : "bg-black/60 text-white"}` }, "PAD ", padNum), /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full animate-ping", style: { backgroundColor: color } })),
        /* @__PURE__ */ React.createElement("div", { className: "mt-1.5 text-left" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-bold text-white truncate" }, cue.name), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-mono font-semibold", style: { color } }, cue.time))
      );
    }))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-center gap-3 mt-4" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleAbrirNavegador(currentFolder),
        className: "px-5 py-2.5 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-bold text-xs rounded-lg shadow-xl cursor-pointer transition-all active:scale-95 flex items-center gap-2"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4C2}"),
      /* @__PURE__ */ React.createElement("span", null, "Explorar y Cargar Carpeta")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => onNavigateTab && onNavigateTab("auditoria"),
        className: "px-5 py-2.5 bg-djzinc-850 hover:bg-djzinc-800 text-gray-200 border border-djzinc-700 font-mono font-bold text-xs rounded-lg shadow cursor-pointer transition-all active:scale-95 flex items-center gap-2"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"),
      /* @__PURE__ */ React.createElement("span", null, "Ir a Auditor\xEDa de Archivos")
    )))), fsBrowserOpen && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#0e0e16] border border-djzinc-700 rounded-xl max-w-xl w-full p-4 shadow-2xl flex flex-col max-h-[80vh]" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800 pb-3 mb-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-base" }, "\u{1F4C2}"), /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-white font-mono" }, "Seleccionar Carpeta para Hot Cues")), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setFsBrowserOpen(false),
        className: "text-gray-400 hover:text-white text-sm cursor-pointer"
      },
      "\u2715"
    )), /* @__PURE__ */ React.createElement("div", { className: "text-xs font-mono text-gray-400 mb-2 truncate bg-djzinc-950 p-2 rounded border border-djzinc-800" }, "Ruta: ", rutaNavegacion), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto custom-scrollbar border border-djzinc-800 rounded-lg p-1 divide-y divide-djzinc-850 max-h-60 bg-djzinc-950" }, (Array.isArray(carpetasSistema) ? carpetasSistema : []).map((folder, idx) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: idx,
        onClick: () => handleAbrirNavegador(folder.path),
        className: "p-2 hover:bg-djzinc-900 cursor-pointer flex items-center justify-between text-xs font-mono text-gray-300 transition-colors"
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 truncate" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4C1}"), /* @__PURE__ */ React.createElement("span", { className: "truncate" }, folder.name)),
      /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500" }, "Subir / Entrar \u2192")
    )), (!carpetasSistema || Array.isArray(carpetasSistema) && carpetasSistema.length === 0) && /* @__PURE__ */ React.createElement("div", { className: "p-4 text-center text-xs text-gray-500 font-mono" }, "No hay subcarpetas en este directorio.")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mt-4 pt-3 border-t border-djzinc-800" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const parent = rutaNavegacion.substring(0, rutaNavegacion.lastIndexOf("/")) || "/";
          handleAbrirNavegador(parent);
        },
        className: "px-3 py-1.5 bg-djzinc-900 hover:bg-djzinc-850 text-gray-300 text-xs font-mono rounded border border-djzinc-800 cursor-pointer"
      },
      "\u2B06 Carpeta Superior"
    ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setFsBrowserOpen(false),
        className: "px-3 py-1.5 bg-djzinc-850 hover:bg-djzinc-800 text-gray-300 text-xs font-mono rounded border border-djzinc-750 cursor-pointer"
      },
      "Cancelar"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleCargarDirectorio(rutaNavegacion),
        className: "px-4 py-1.5 bg-djcyan-500 hover:bg-djcyan-400 text-black text-xs font-mono font-bold rounded shadow cursor-pointer transition-transform active:scale-95"
      },
      "\u2713 Cargar Esta Carpeta"
    ))))));
  };
  var SpotifyWorkspace = ({
    tracks: externalTracks,
    setTracks: externalSetTracks,
    onPlayTrack,
    nowPlayingTrack,
    isPlaying,
    onTogglePlay,
    lang = "es",
    t = (k) => k
  }) => {
    const [spotifyUrl, setSpotifyUrl] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [destDir, setDestDir] = useState("/Users/admin/Music/mi musica");
    const [selectedFormat, setSelectedFormat] = useState("flac");
    const [downloadingMsg, setDownloadingMsg] = useState("");
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isAuditingFft, setIsAuditingFft] = useState(false);
    const [fftProgress, setFftProgress] = useState(0);
    const [fftMsg, setFftMsg] = useState("");
    const [selectedId, setSelectedId] = useState(null);
    const [spInspectorOpen, setSpInspectorOpen] = useState(false);
    const [downloadSession, setDownloadSession] = useState({ downloaded: [], failed: [] });
    const [isExportingXls, setIsExportingXls] = useState(false);
    const [xlsToast, setXlsToast] = useState("");
    const [internalTracks, setInternalTracks] = useState([]);
    const tracks = externalTracks !== void 0 ? externalTracks : internalTracks;
    const setTracks = externalSetTracks !== void 0 ? externalSetTracks : setInternalTracks;
    const [fsBrowserOpen, setFsBrowserOpen] = useState(false);
    const [fsCurrentPath, setFsCurrentPath] = useState("");
    const [fsParentPath, setFsParentPath] = useState("");
    const [fsFolders, setFsFolders] = useState([]);
    const [fsLoading, setFsLoading] = useState(false);
    useEffect(() => {
      if (window.eel && typeof window.eel.expose === "function") {
        const updateDownload = (pct, msg) => {
          setDownloadProgress(pct);
          setDownloadingMsg(msg || "");
          setIsDownloading(true);
        };
        const updateFft = (pct, msg) => {
          setIsAuditingFft(true);
          setFftProgress(pct);
          setFftMsg(msg || "");
        };
        const notifyFftResult = (res) => {
          if (res && res.id) {
            setTracks((prev) => {
              const trk = prev.find((t2) => String(t2.id) === String(res.id));
              if (trk) {
                const completedItem = {
                  id: res.id,
                  title: trk.title || res.name || "Desconocido",
                  artist: trk.artist || res.artist || "Desconocido",
                  album: trk.album || "",
                  format: res.format || (selectedFormat ? selectedFormat.toUpperCase() : "FLAC"),
                  cutoff_khz: res.cutoff_khz,
                  calidad: res.calidad || "Alta",
                  status: res.status || res.estado || "Lossless OK",
                  sample_rate_khz: res.sample_rate_khz || 44.1,
                  bitrate_kbps: res.bitrate_kbps || 0,
                  perdida: res.perdida || "Sin P\xE9rdida",
                  path: res.path || trk.path || ""
                };
                setDownloadSession((sPrev) => ({
                  ...sPrev,
                  downloaded: [...sPrev.downloaded.filter((x) => String(x.id) !== String(res.id)), completedItem]
                }));
              }
              return prev.filter((t2) => String(t2.id) !== String(res.id));
            });
            if (res.audit_msg) {
              setFftMsg(res.audit_msg);
            }
          }
        };
        const notifyDownloadFailure = (errData) => {
          if (errData && errData.id) {
            setTracks((prev) => {
              const trk = prev.find((t2) => String(t2.id) === String(errData.id));
              if (trk) {
                setDownloadSession((sPrev) => ({
                  ...sPrev,
                  failed: [...sPrev.failed.filter((x) => String(x.id) !== String(errData.id)), {
                    ...trk,
                    error: errData.error || "Error en descarga",
                    title: errData.title || trk.title,
                    artist: errData.artist || trk.artist
                  }]
                }));
              }
              return prev.map((t2) => {
                if (String(t2.id) === String(errData.id)) {
                  return {
                    ...t2,
                    status: "Fallo de Descarga",
                    badge_color: "red",
                    download_error: errData.error,
                    selected: true
                  };
                }
                return t2;
              });
            });
          }
        };
        const finishBatch = (msg) => {
          setIsDownloading(false);
          setIsAuditingFft(false);
          setDownloadProgress(100);
          setFftProgress(100);
          setDownloadingMsg(msg || "Lote completado con \xE9xito.");
          setTimeout(() => {
            setDownloadProgress(0);
            setFftProgress(0);
            setIsAuditingFft(false);
          }, 7e3);
        };
        window.actualizar_estado_descarga = updateDownload;
        window.actualizar_progreso_descarga = updateDownload;
        window.actualizar_estado_fft = updateFft;
        window.notificar_resultado_auditoria = notifyFftResult;
        window.notificar_fallo_descarga = notifyDownloadFailure;
        window.notificar_fin_lote = finishBatch;
        window.eel.expose(window.actualizar_estado_descarga, "actualizar_estado_descarga");
        window.eel.expose(window.actualizar_progreso_descarga, "actualizar_progreso_descarga");
        window.eel.expose(window.actualizar_estado_fft, "actualizar_estado_fft");
        window.eel.expose(window.notificar_resultado_auditoria, "notificar_resultado_auditoria");
        window.eel.expose(window.notificar_fallo_descarga, "notificar_fallo_descarga");
        window.eel.expose(window.notificar_fin_lote, "notificar_fin_lote");
      }
    }, []);
    const handleCancelarDescargas = async () => {
      try {
        fetch("/api/cancelar_procesos", { method: "POST" }).catch(() => {
        });
      } catch (e) {
      }
      if (window.eel && window.eel.cancelar_procesos_activos) {
        try {
          await window.eel.cancelar_procesos_activos()();
        } catch (e) {
          console.error("Error al cancelar procesos:", e);
        }
      }
      setIsAnalyzing(false);
      setIsDownloading(false);
      setIsAuditingFft(false);
      setDownloadProgress(0);
      setFftProgress(0);
      setDownloadingMsg(lang === "en" ? "[CANCELLED] Process stopped by user." : "[CANCELADO] Proceso detenido por el usuario.");
      setTimeout(() => setDownloadingMsg(""), 3e3);
    };
    const handleDescargarReporteXLS = async () => {
      if (downloadSession.downloaded.length === 0 && downloadSession.failed.length === 0) {
        alert("No hay descargas ni fallos registrados en esta sesi\xF3n todav\xEDa para exportar.");
        return;
      }
      setIsExportingXls(true);
      try {
        let res = null;
        if (window.eel && window.eel.exportar_reporte_descargas_xls) {
          res = await window.eel.exportar_reporte_descargas_xls(downloadSession, destDir)();
        } else {
          const resp = await fetch("/api/descargar_reporte_xls", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ report_data: downloadSession, destino_dir: destDir })
          });
          res = await resp.json();
        }
        if (res && res.status === "ok") {
          if (res.b64) {
            const byteChars = atob(res.b64);
            const byteNums = new Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) {
              byteNums[i] = byteChars.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNums);
            const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = res.filename || `Reporte_Descargas_Spotify_${Date.now()}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
          setXlsToast(`\u2713 Reporte Excel generado (${res.descargadas} descargadas, ${res.fallidas} fallidas) en: ${res.path}`);
          setTimeout(() => setXlsToast(""), 6e3);
        } else {
          alert(`Error al generar reporte: ${res?.msg || "Error desconocido"}`);
        }
      } catch (err) {
        console.error("Error exportando reporte XLS:", err);
        alert(`Error de comunicaci\xF3n al generar XLS: ${err.message || err}`);
      } finally {
        setIsExportingXls(false);
      }
    };
    const handleAbrirNavegadorCarpetas = async (initialPath = "") => {
      setFsBrowserOpen(true);
      setFsLoading(true);
      const startPath = initialPath || destDir || "";
      let res = null;
      if (window.eel && window.eel.listar_subcarpetas_sistema) {
        try {
          res = await window.eel.listar_subcarpetas_sistema(startPath)();
        } catch (err) {
          console.warn("[EXPLORADOR] Fallo llamada Eel, recurriendo a HTTP:", err);
        }
      }
      if (!res) {
        try {
          const resp = await fetch(`/api/listar_subcarpetas?ruta=${encodeURIComponent(startPath)}`);
          if (resp.ok) res = await resp.json();
        } catch (httpErr) {
          console.error("[EXPLORADOR] Fallo HTTP al listar carpetas:", httpErr);
        }
      }
      if (res) {
        setFsCurrentPath(res.current || "");
        setFsParentPath(res.parent || "");
        setFsFolders(res.folders || []);
      }
      setFsLoading(false);
    };
    const handleNavegarACarpeta = async (targetPath) => {
      setFsLoading(true);
      let res = null;
      if (window.eel && window.eel.listar_subcarpetas_sistema) {
        try {
          res = await window.eel.listar_subcarpetas_sistema(targetPath)();
        } catch (err) {
          console.warn("[EXPLORADOR] Fallo llamada Eel al navegar:", err);
        }
      }
      if (!res) {
        try {
          const resp = await fetch(`/api/listar_subcarpetas?ruta=${encodeURIComponent(targetPath)}`);
          if (resp.ok) res = await resp.json();
        } catch (httpErr) {
          console.error("[EXPLORADOR] Fallo HTTP al navegar:", httpErr);
        }
      }
      if (res) {
        setFsCurrentPath(res.current || "");
        setFsParentPath(res.parent || "");
        setFsFolders(res.folders || []);
      }
      setFsLoading(false);
    };
    const handleSeleccionarCarpetaDestino = (targetPath) => {
      const finalPath = targetPath || fsCurrentPath;
      setDestDir(finalPath);
      setFsBrowserOpen(false);
      try {
        fetch("/api/directorio_descarga", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: finalPath })
        }).catch(() => {
        });
      } catch (_) {
      }
    };
    const [spSortField, setSpSortField] = useState("title");
    const [spSortDir, setSpSortDir] = useState("asc");
    const [spFilterSearch, setSpFilterSearch] = useState("");
    const [spFilterFormat, setSpFilterFormat] = useState("ALL");
    const [spFilterQuality, setSpFilterQuality] = useState("ALL");
    const [spFilterStatus, setSpFilterStatus] = useState("ALL");
    const [spFilterOrigin, setSpFilterOrigin] = useState("ALL");
    const [spFilterEnergy, setSpFilterEnergy] = useState("ALL");
    const [spFilterDance, setSpFilterDance] = useState("ALL");
    const handleSortSp = (field) => {
      setSpSortDir((prev) => spSortField === field && prev === "asc" ? "desc" : "asc");
      setSpSortField(field);
    };
    const renderSortArrowSp = (field) => {
      if (spSortField !== field) return /* @__PURE__ */ React.createElement("span", { className: "text-gray-600 ml-1 text-[9px]" }, "\u2195");
      return /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 ml-1 font-bold text-[10px]" }, spSortDir === "asc" ? "\u25B2" : "\u25BC");
    };
    const tracksFiltradosSp = useMemo(() => {
      let result = tracks.filter((t2) => {
        if (spFilterSearch) {
          const term = spFilterSearch.toLowerCase();
          const m = (t2.title || "").toLowerCase().includes(term) || (t2.artist || "").toLowerCase().includes(term) || (t2.album || "").toLowerCase().includes(term);
          if (!m) return false;
        }
        if (spFilterOrigin !== "ALL") {
          const o = t2.origin || "spotify";
          if (o !== spFilterOrigin) return false;
        }
        if (spFilterFormat !== "ALL") {
          const fmt = (t2.format || selectedFormat || "").toUpperCase();
          if (fmt !== spFilterFormat) return false;
        }
        if (spFilterQuality !== "ALL") {
          if (!String(t2.calidad || "").toLowerCase().includes(spFilterQuality.toLowerCase())) return false;
        }
        if (spFilterStatus !== "ALL") {
          const isFake = Boolean(t2.es_fake || String(t2.status || "").includes("Fake"));
          if (spFilterStatus === "FAKE" && !isFake) return false;
          if (spFilterStatus === "DOWNLOADED" && !t2.downloaded) return false;
          if (spFilterStatus === "PENDING" && t2.downloaded) return false;
          if (spFilterStatus === "LOSSLESS" && (!t2.downloaded || isFake || String(t2.format || selectedFormat).toLowerCase() === "mp3")) return false;
        }
        if (spFilterEnergy !== "ALL") {
          const eVal = Number(t2.energy || t2.e || 80);
          if (spFilterEnergy === "HIGH" && eVal < 80) return false;
          if (spFilterEnergy === "MED" && (eVal < 65 || eVal >= 80)) return false;
          if (spFilterEnergy === "LOW" && eVal >= 65) return false;
        }
        if (spFilterDance !== "ALL") {
          const dVal = Number(t2.danceability || t2.dance || 80);
          if (spFilterDance === "HIGH" && dVal < 80) return false;
          if (spFilterDance === "MED" && (dVal < 65 || dVal >= 80)) return false;
          if (spFilterDance === "LOW" && dVal >= 65) return false;
        }
        return true;
      });
      result.sort((a, b) => {
        let valA = a[spSortField];
        let valB = b[spSortField];
        if (spSortField === "duration") {
          const parseSec = (d) => {
            if (!d || !d.includes(":")) return 0;
            const p = d.split(":");
            return parseInt(p[0]) * 60 + parseFloat(p[1]);
          };
          valA = parseSec(a.duration);
          valB = parseSec(b.duration);
        } else if (["id", "sample_rate_khz", "bitrate_kbps", "cutoff_khz", "bpm", "energy", "danceability"].includes(spSortField)) {
          valA = Number(valA || a.energy || a.danceability) || 0;
          valB = Number(valB || b.energy || b.danceability) || 0;
        } else if (spSortField === "origin") {
          valA = a.origin || "spotify";
          valB = b.origin || "spotify";
        }
        if (typeof valA === "number" && typeof valB === "number") {
          return spSortDir === "asc" ? valA - valB : valB - valA;
        }
        return spSortDir === "asc" ? String(valA || "").localeCompare(String(valB || "")) : String(valB || "").localeCompare(String(valA || ""));
      });
      return result;
    }, [tracks, spFilterSearch, spFilterOrigin, spFilterFormat, spFilterQuality, spFilterStatus, spFilterEnergy, spFilterDance, spSortField, spSortDir, selectedFormat]);
    const currentTrack = tracks.find((t2) => t2.id === selectedId) || tracks[0] || {};
    const selectedCount = tracks.filter((t2) => t2.selected).length;
    const allSelected = tracksFiltradosSp.length > 0 && tracksFiltradosSp.every((t2) => t2.selected);
    const handleToggleSelectAll = () => {
      const targetState = !allSelected;
      const idsToToggle = new Set(tracksFiltradosSp.map((t2) => t2.id));
      setTracks((prev) => prev.map((t2) => idsToToggle.has(t2.id) ? { ...t2, selected: targetState } : t2));
    };
    const handleToggleRow = (id) => {
      setSelectedId(id);
      setTracks((prev) => prev.map((t2) => t2.id === id ? { ...t2, selected: !t2.selected } : t2));
    };
    const handlePlayPreview = async (track, e, seekPct = null) => {
      if (e && e.stopPropagation) e.stopPropagation();
      setSelectedId(track.id);
      if (nowPlayingTrack && (String(nowPlayingTrack.id) === String(track.id) || nowPlayingTrack.title === track.title)) {
        if (seekPct !== null && onPlayTrack) {
          const durSec = parseDurationToSeconds(track.duration || 210);
          onPlayTrack(nowPlayingTrack, seekPct, true, seekPct * durSec);
          return;
        }
        if (onTogglePlay) {
          onTogglePlay();
          return;
        }
      }
      let streamUrl = track.preview_url;
      let coverHd = track.cover;
      if (!streamUrl) {
        setDownloadingMsg(`[PRE-ESCUCHA] Resolviendo stream para: ${track.artist} - ${track.title}...`);
        if (window.eel && window.eel.resolver_stream_preescucha) {
          try {
            const res = await window.eel.resolver_stream_preescucha(track.title, track.artist)();
            if (res && res.stream_url) {
              streamUrl = res.stream_url;
              if (res.cover) coverHd = res.cover;
            }
          } catch (err) {
          }
        }
        if (!streamUrl) {
          try {
            const resp = await fetch(`/api/resolver_stream_preescucha?titulo=${encodeURIComponent(track.title)}&artista=${encodeURIComponent(track.artist)}`);
            if (resp.ok) {
              const res = await resp.json();
              if (res && res.stream_url) {
                streamUrl = res.stream_url;
                if (res.cover) coverHd = res.cover;
              }
            }
          } catch (httpErr) {
          }
        }
      }
      if (onPlayTrack) {
        const durSec = parseDurationToSeconds(track.duration || 210);
        const startSec = seekPct !== null && seekPct > 0 ? seekPct * durSec : 0;
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
        }, seekPct || 0, true, startSec);
      }
    };
    const handleAnalizar = async (queryOverride = null) => {
      const queryToSearch = (typeof queryOverride === "string" ? queryOverride : spotifyUrl).trim();
      if (!queryToSearch) {
        setDownloadingMsg("[AVISO] Introduce un artista, tema o URL de Spotify, o pulsa en una de las sugerencias r\xE1pidas.");
        return;
      }
      if (typeof queryOverride === "string") {
        setSpotifyUrl(queryOverride);
      }
      if (isAnalyzing) return;
      setIsAnalyzing(true);
      setDownloadProgress(20);
      setDownloadingMsg(`[ANALIZANDO] Extrayendo metadatos para: "${queryToSearch}"...`);
      try {
        setDownloadProgress(45);
        let res = null;
        if (window.eel && window.eel.analizar_catalogo_spotify) {
          try {
            const eelCall = window.eel.analizar_catalogo_spotify(queryToSearch)();
            const timeoutPromise = new Promise(
              (_, reject) => setTimeout(() => reject(new Error("Eel timeout")), 8e3)
            );
            res = await Promise.race([eelCall, timeoutPromise]);
          } catch (eelErr) {
            console.warn("[SPOTIFY] Llamada Eel lenta o con error, usando fallback HTTP:", eelErr);
          }
        }
        if (!res || !res.tracks) {
          setDownloadProgress(65);
          try {
            const resp = await fetch("/api/analizar_spotify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query: queryToSearch })
            });
            if (resp.ok) {
              res = await resp.json();
            }
          } catch (httpErr) {
            console.error("[SPOTIFY] Fallback HTTP tambi\xE9n fall\xF3:", httpErr);
          }
        }
        setDownloadProgress(95);
        if (res && res.tracks && res.tracks.length > 0) {
          const mapped = res.tracks.map((t2, i) => ({
            ...t2,
            selected: i === 0,
            origin: t2.origin || "spotify",
            energy: t2.energy || 80,
            danceability: t2.danceability || 80
          }));
          setTracks((prev) => {
            const existingTax = (prev || []).filter((item) => item.origin === "taxonomy" || item.origin === "audit_upgrade");
            return [...existingTax, ...mapped];
          });
          setSelectedId(mapped[0].id);
          setDownloadProgress(100);
          setDownloadingMsg(`[LISTO] ${mapped.length} pistas cargadas con car\xE1tulas oficiales.`);
        } else {
          setDownloadProgress(0);
          setDownloadingMsg("[AVISO] No se encontraron pistas para este enlace o b\xFAsqueda.");
        }
      } catch (e) {
        setDownloadProgress(0);
        setDownloadingMsg(`[ERROR] Fallo al analizar cat\xE1logo: ${e.message || e}`);
      } finally {
        setTimeout(() => {
          setIsAnalyzing(false);
          setDownloadProgress(0);
        }, 1200);
      }
    };
    const lanzarDescargaReal = async (listaPistas) => {
      if (!listaPistas || listaPistas.length === 0) return;
      setIsDownloading(true);
      setDownloadProgress(10);
      setDownloadingMsg(`[DESCARGANDO] Iniciando lote de ${listaPistas.length} pista(s) en formato .${selectedFormat.toUpperCase()}...`);
      let descargadoV\u00EDaEel = false;
      if (window.eel && window.eel.descargar_pistas_spotify_seleccionadas) {
        try {
          await window.eel.descargar_pistas_spotify_seleccionadas(listaPistas, selectedFormat, destDir)();
          descargadoV\u00EDaEel = true;
        } catch (e) {
          console.warn("[SPOTIFY] Error en llamada Eel de descarga, recurriendo a HTTP:", e);
        }
      }
      if (!descargadoV\u00EDaEel) {
        try {
          const resp = await fetch("/api/descargar_spotify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tracks: listaPistas,
              formato: selectedFormat,
              custom_dir: destDir
            })
          });
          const res = await resp.json();
          if (res && (res.status === "ok" || res.status === "iniciado")) {
            setDownloadingMsg(`[DESCARGANDO] Lote en segundo plano (${listaPistas.length} pistas) hacia: ${res.dest || destDir}`);
            setDownloadProgress(35);
          } else {
            setDownloadingMsg(`[ERROR] ${res?.msg || "Error al iniciar descarga"}`);
            setIsDownloading(false);
            setDownloadProgress(0);
          }
        } catch (httpErr) {
          console.error("[SPOTIFY] Fallo HTTP de descarga:", httpErr);
          setIsDownloading(false);
          setDownloadProgress(0);
          setDownloadingMsg(`[ERROR] Conexi\xF3n fallida: ${httpErr.message || httpErr}`);
        }
      }
    };
    const handleCambiarCarpeta = () => {
      handleAbrirNavegadorCarpetas(destDir);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "flex w-full h-full bg-[#09090c] text-gray-300 font-sans select-none overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "p-3.5 border-b border-djzinc-800 bg-[#0c0c10] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1.5 flex-1 max-w-2xl w-full" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 w-full" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 bg-[#060609] border border-djzinc-750 focus-within:border-djcyan-500 rounded flex items-center overflow-hidden" }, /* @__PURE__ */ React.createElement("span", { className: "px-2.5 py-1.5 text-[11px] font-mono text-djcyan-400 bg-[#0e0e13] border-r border-djzinc-800 font-semibold shrink-0" }, "B\xDASQUEDA / SPOTIFY"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: spotifyUrl,
        onChange: (e) => setSpotifyUrl(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") {
            handleAnalizar();
          }
        },
        placeholder: "Pega enlace de Spotify o busca por artista, \xE1lbum, canci\xF3n, g\xE9nero...",
        className: "bg-transparent px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none flex-1 font-mono"
      }
    ), spotifyUrl && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setSpotifyUrl(""),
        className: "px-2 text-gray-500 hover:text-white text-xs cursor-pointer",
        title: "Borrar texto"
      },
      "\u2715"
    )), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => handleAnalizar(),
        disabled: isAnalyzing,
        className: "px-4 py-1.5 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono rounded text-xs font-bold cursor-pointer transition-colors shadow flex items-center gap-1.5 disabled:opacity-50 shrink-0"
      },
      isAnalyzing ? "Buscando..." : "\u{1F50D} Buscar / Analizar"
    ), (isAnalyzing || isDownloading || isAuditingFft || downloadProgress > 0) && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleCancelarDescargas,
        className: "px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 rounded font-bold font-mono text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95 shrink-0",
        title: "Detener y cancelar la b\xFAsqueda o descarga activa inmediatamente"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u2715"),
      /* @__PURE__ */ React.createElement("span", null, lang === "en" ? "Cancel Processes" : "Cancelar Procesos")
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-500" }, "Sugerencias:"), [
      "Marco Bailey",
      "Charlotte de Witte",
      "Tech House Peak",
      "Melodic Techno 126",
      "Amelie Lens",
      "Carl Cox"
    ].map((sug) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: sug,
        type: "button",
        onClick: () => handleAnalizar(sug),
        className: "px-2 py-0.5 rounded text-[10px] font-mono bg-[#14141d] hover:bg-djcyan-950 text-gray-400 hover:text-djcyan-300 border border-djzinc-800 hover:border-djcyan-700/60 transition-colors cursor-pointer"
      },
      "+ ",
      sug
    )))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 flex-wrap" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          const seleccionadas = tracks.filter((t2) => t2.selected);
          if (seleccionadas.length === 0) {
            alert("Por favor marca al menos una casilla de la tabla para descargar.");
            return;
          }
          lanzarDescargaReal(seleccionadas);
        },
        disabled: isDownloading || tracks.length === 0,
        className: `px-3.5 py-1.5 rounded-lg text-xs font-mono font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 ${selectedCount > 0 ? "bg-djcyan-500 hover:bg-djcyan-400 text-black shadow-djcyan-500/20" : "bg-djzinc-800 text-gray-400 hover:text-white border border-djzinc-700"}`
      },
      /* @__PURE__ */ React.createElement("span", null, "\u2B07 Descargar Seleccionadas (", selectedCount, ")")
    ), tracks.length > 0 && (downloadSession.downloaded.length > 0 || downloadSession.failed.length > 0) && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => lanzarDescargaReal(tracks),
        disabled: isDownloading,
        className: "px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95",
        title: "Reintentar descarga de todas las pistas pendientes/fallidas restantes"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F504} Reintentar Pendientes (", tracks.length, ")")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleDescargarReporteXLS,
        disabled: isExportingXls || downloadSession.downloaded.length === 0 && downloadSession.failed.length === 0,
        className: `px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 ${downloadSession.downloaded.length > 0 || downloadSession.failed.length > 0 ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20" : "bg-djzinc-900 text-gray-500 border border-djzinc-800 cursor-not-allowed"}`,
        title: "Descargar informe Excel con las pistas descargadas con certificaci\xF3n FFT y las que fallaron"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4CA}"),
      /* @__PURE__ */ React.createElement("span", null, isExportingXls ? "Generando XLS..." : downloadSession.downloaded.length > 0 || downloadSession.failed.length > 0 ? `Reporte XLS (${downloadSession.downloaded.length}\u2713 | ${downloadSession.failed.length}\u2715)` : "Reporte XLS")
    ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-xs font-mono text-gray-400" }, /* @__PURE__ */ React.createElement("span", null, "Destino:"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-200 truncate max-w-[140px]", title: destDir }, destDir.split("/").pop() || destDir), /* @__PURE__ */ React.createElement("button", { onClick: handleCambiarCarpeta, className: "text-gray-300 hover:text-white px-2 py-0.5 bg-djzinc-850 hover:bg-djzinc-800 border border-djzinc-700 rounded-md text-[11px] font-mono cursor-pointer transition-colors" }, "Cambiar")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 bg-[#060609] border border-djzinc-750 rounded-lg p-1" }, [
      { id: "flac", label: "FLAC Hi-Res", badge: "24b Master" },
      { id: "wav", label: "WAV", badge: "24-bit" },
      { id: "aiff", label: "AIFF", badge: "Club" },
      { id: "mp3", label: "MP3", badge: "320k" }
    ].map((f) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: f.id,
        onClick: () => setSelectedFormat(f.id),
        className: `px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${selectedFormat === f.id ? "bg-djcyan-500 text-black shadow-sm font-black" : "text-gray-400 hover:text-white hover:bg-djzinc-850"}`,
        title: `Descargar en formato ${f.label} (${f.badge})`
      },
      /* @__PURE__ */ React.createElement("span", null, f.label),
      /* @__PURE__ */ React.createElement("span", { className: `text-[8px] px-1 rounded font-normal ${selectedFormat === f.id ? "bg-black/25 text-black font-bold" : "bg-djzinc-800 text-djcyan-400"}` }, f.badge)
    ))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setSpInspectorOpen((prev) => !prev),
        className: `px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${spInspectorOpen ? "bg-djzinc-800 text-white border-djcyan-500 shadow-sm" : "bg-djzinc-900 text-gray-400 border-djzinc-750 hover:text-white"}`,
        title: spInspectorOpen ? "Ocultar panel inspector" : "Mostrar panel inspector"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u25E8"),
      /* @__PURE__ */ React.createElement("span", null, t("btn_inspector") || "Inspector")
    ))), xlsToast && /* @__PURE__ */ React.createElement("div", { className: "mx-4 mt-2 p-2.5 bg-emerald-950/80 border border-emerald-500/60 rounded-lg text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4CA}"), /* @__PURE__ */ React.createElement("span", null, xlsToast)), /* @__PURE__ */ React.createElement("button", { onClick: () => setXlsToast(""), className: "text-emerald-400 hover:text-white px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700 text-[10px] cursor-pointer" }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "px-4 py-2.5 bg-[#09090c] border-b border-djzinc-850 flex flex-col gap-2 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-xs font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-semibold flex items-center gap-1.5 truncate" }, /* @__PURE__ */ React.createElement("span", { className: `w-2 h-2 rounded-full ${isAnalyzing || isDownloading ? "bg-djcyan-400 animate-pulse" : tracks.length > 0 ? "bg-djgreen-400" : "bg-gray-500"}` }), /* @__PURE__ */ React.createElement("span", null, downloadingMsg || (tracks.length === 0 ? "[STANDBY] Listo para buscar o importar pistas desde Auditor\xEDa DJ." : `[LISTO] ${tracks.length} pista(s) en cat\xE1logo.`))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, (isDownloading || isAnalyzing || downloadProgress > 0) && /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-300 font-mono font-bold text-xs" }, downloadProgress, "%"), (isAnalyzing || isDownloading || isAuditingFft || downloadProgress > 0) && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleCancelarDescargas,
        className: "px-2 py-0.5 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[10px] font-mono font-bold cursor-pointer transition-colors shadow flex items-center gap-1",
        title: "Cancelar b\xFAsqueda, descarga y procesos activos"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u2715"),
      /* @__PURE__ */ React.createElement("span", null, t("btn_cancel") || "Cancelar")
    ), /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[11px] font-bold" }, tracks.length, " Pistas detectadas"))), (downloadProgress > 0 || isAnalyzing || isDownloading) && /* @__PURE__ */ React.createElement("div", { className: "w-full bg-[#121217] h-2 rounded-full overflow-hidden border border-djzinc-800 shadow-inner" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `h-full transition-all duration-300 ease-out shadow-lg shadow-djcyan-500/50 ${isAnalyzing && downloadProgress <= 25 ? "bg-gradient-to-r from-djcyan-500 via-djpurple-500 to-djcyan-500 animate-pulse" : downloadProgress >= 100 ? "bg-emerald-400" : "bg-gradient-to-r from-djcyan-500 to-djgreen-400"}`,
        style: { width: `${Math.max(5, Math.min(100, downloadProgress))}%` }
      }
    ))), (isAuditingFft || fftProgress > 0) && /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-djzinc-850/80 flex flex-col gap-1 transition-all" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-xs font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400 font-semibold flex items-center gap-1.5 truncate" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-pulse" }), /* @__PURE__ */ React.createElement("span", null, fftMsg || "Auditor\xEDa FFT Certificando corte espectral...")), /* @__PURE__ */ React.createElement("span", { className: "text-emerald-300 font-mono font-bold text-xs" }, fftProgress, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-[#121217] h-2 rounded-full overflow-hidden border border-emerald-950 shadow-inner" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "h-full bg-gradient-to-r from-emerald-500 via-djcyan-400 to-emerald-400 transition-all duration-300 ease-out shadow-lg shadow-emerald-500/50",
        style: { width: `${Math.max(5, Math.min(100, fftProgress))}%` }
      }
    )))), tracks.some((t2) => t2.origin === "audit_upgrade") && /* @__PURE__ */ React.createElement("div", { className: "px-4 py-2 bg-gradient-to-r from-amber-950/70 via-emerald-950/40 to-djzinc-950 border-b border-amber-600/40 flex items-center justify-between text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-amber-400 font-bold text-sm" }, "\u{1F504}"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-200" }, /* @__PURE__ */ React.createElement("strong", { className: "text-amber-300 font-semibold" }, tracks.filter((t2) => t2.origin === "audit_upgrade").length, " reemplazo(s) HD"), " importado(s) desde Auditor\xEDa para sustituir pistas de baja calidad.")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-gray-400 font-mono" }, "Formato seleccionado: ", /* @__PURE__ */ React.createElement("strong", { className: "text-djcyan-400 font-bold" }, selectedFormat.toUpperCase())))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-auto bg-[#08080b]" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left border-collapse text-xs whitespace-nowrap" }, /* @__PURE__ */ React.createElement("thead", { className: "sticky top-0 z-10 bg-[#0d0d12] border-b border-djzinc-800 text-[10px] font-mono uppercase text-gray-400" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-3 w-8 text-center" }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: allSelected, onChange: handleToggleSelectAll, className: "accent-djcyan-500 cursor-pointer" })), /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-2 w-10 text-center" }, "PLAY"), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("title"), className: "py-2.5 px-3 min-w-[260px] cursor-pointer hover:text-white transition-colors" }, t("th_title") || "T\xCDTULO", " / ", t("th_album") || "\xC1LBUM", " ", renderSortArrowSp("title")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("artist"), className: "py-2.5 px-3 min-w-[150px] cursor-pointer hover:text-white transition-colors" }, t("th_artist") || "ARTISTA", " ", renderSortArrowSp("artist")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("origin"), className: "py-2.5 px-2.5 text-center min-w-[105px] cursor-pointer hover:text-white transition-colors" }, "ORIGEN ", renderSortArrowSp("origin")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("format"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, t("th_format") || "FORMATO", " ", renderSortArrowSp("format")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("sample_rate_khz"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, t("th_khz") || "KHZ", " ", renderSortArrowSp("sample_rate_khz")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("bitrate_kbps"), className: "py-2.5 px-2 text-center w-20 cursor-pointer hover:text-white transition-colors" }, t("th_kbps") || "KBPS", " ", renderSortArrowSp("bitrate_kbps")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("calidad"), className: "py-2.5 px-2 text-center w-24 cursor-pointer hover:text-white transition-colors" }, t("th_quality") || "CALIDAD", " ", renderSortArrowSp("calidad")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("cutoff_khz"), className: "py-2.5 px-3 text-center min-w-[170px] cursor-pointer hover:text-white transition-colors" }, t("th_loss") || "P\xC9RDIDA / CORTE", " ", renderSortArrowSp("cutoff_khz")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("duration"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, t("th_duration") || "DURACI\xD3N", " ", renderSortArrowSp("duration")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("bpm"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, "BPM ", renderSortArrowSp("bpm")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("key"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, "KEY ", renderSortArrowSp("key")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("energy"), className: "py-2.5 px-2 text-center w-20 cursor-pointer hover:text-white transition-colors" }, "\u26A1 ENERG\xCDA ", renderSortArrowSp("energy")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("danceability"), className: "py-2.5 px-2 text-center w-20 cursor-pointer hover:text-white transition-colors" }, "\u{1F57A} DANCE ", renderSortArrowSp("danceability")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("status"), className: "py-2.5 px-3 text-center min-w-[140px] cursor-pointer hover:text-white transition-colors" }, t("th_status") || "ESTADO", " / ", t("download_btn") || "ACCI\xD3N", " ", renderSortArrowSp("status"))), /* @__PURE__ */ React.createElement("tr", { className: "bg-[#07070a] border-b border-djzinc-800 text-[10px] lowercase font-sans" }, /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center font-mono text-[9px] text-gray-500" }, spFilterSearch || spFilterOrigin !== "ALL" || spFilterFormat !== "ALL" || spFilterQuality !== "ALL" || spFilterStatus !== "ALL" || spFilterEnergy !== "ALL" || spFilterDance !== "ALL" ? /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setSpFilterSearch("");
          setSpFilterOrigin("ALL");
          setSpFilterFormat("ALL");
          setSpFilterQuality("ALL");
          setSpFilterStatus("ALL");
          setSpFilterEnergy("ALL");
          setSpFilterDance("ALL");
        },
        title: "Limpiar filtros",
        className: "text-amber-400 hover:text-white cursor-pointer"
      },
      "\u2715"
    ) : "filtro"), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: spFilterSearch,
        onChange: (e) => setSpFilterSearch(e.target.value),
        placeholder: "Filtrar por t\xEDtulo o \xE1lbum...",
        className: "w-full bg-[#111116] border border-djzinc-750 rounded px-1.5 py-0.5 text-[11px] text-gray-200 outline-none focus:border-djcyan-400 font-sans"
      }
    )), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: spFilterOrigin,
        onChange: (e) => setSpFilterOrigin(e.target.value),
        className: "bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todos"),
      /* @__PURE__ */ React.createElement("option", { value: "audit_upgrade" }, "\u{1F504} Reemplazo HD"),
      /* @__PURE__ */ React.createElement("option", { value: "taxonomy" }, "\u{1F3F7}\uFE0F Taxonom\xEDa"),
      /* @__PURE__ */ React.createElement("option", { value: "spotify" }, "\u{1F3A7} Spotify"),
      /* @__PURE__ */ React.createElement("option", { value: "shazam" }, "\u26A1 Shazam")
    )), /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: spFilterFormat,
        onChange: (e) => setSpFilterFormat(e.target.value),
        className: "bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todos"),
      /* @__PURE__ */ React.createElement("option", { value: "FLAC" }, "FLAC"),
      /* @__PURE__ */ React.createElement("option", { value: "MP3" }, "MP3"),
      /* @__PURE__ */ React.createElement("option", { value: "WAV" }, "WAV")
    )), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: spFilterQuality,
        onChange: (e) => setSpFilterQuality(e.target.value),
        className: "bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todas"),
      /* @__PURE__ */ React.createElement("option", { value: "Alta" }, "Alta"),
      /* @__PURE__ */ React.createElement("option", { value: "Media" }, "Media"),
      /* @__PURE__ */ React.createElement("option", { value: "Baja" }, "Baja")
    )), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: spFilterEnergy,
        onChange: (e) => setSpFilterEnergy(e.target.value),
        className: "bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todas"),
      /* @__PURE__ */ React.createElement("option", { value: "HIGH" }, ">80% Alta"),
      /* @__PURE__ */ React.createElement("option", { value: "MED" }, "65-80% Media"),
      /* @__PURE__ */ React.createElement("option", { value: "LOW" }, "<65% Baja")
    )), /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: spFilterDance,
        onChange: (e) => setSpFilterDance(e.target.value),
        className: "bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todas"),
      /* @__PURE__ */ React.createElement("option", { value: "HIGH" }, ">80% Alta"),
      /* @__PURE__ */ React.createElement("option", { value: "MED" }, "65-80% Media"),
      /* @__PURE__ */ React.createElement("option", { value: "LOW" }, "<65% Baja")
    )), /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: spFilterStatus,
        onChange: (e) => setSpFilterStatus(e.target.value),
        className: "bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todos"),
      /* @__PURE__ */ React.createElement("option", { value: "DOWNLOADED" }, "Descargado"),
      /* @__PURE__ */ React.createElement("option", { value: "PENDING" }, "Pendiente"),
      /* @__PURE__ */ React.createElement("option", { value: "LOSSLESS" }, "Lossless"),
      /* @__PURE__ */ React.createElement("option", { value: "FAKE" }, "FLAC Fake")
    )))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-djzinc-850/60 font-sans" }, tracksFiltradosSp.length === 0 && !isAnalyzing && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "16", className: "py-16 text-center select-none" }, tracks.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "max-w-xl mx-auto flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-[#0c0c12] border border-djzinc-800 shadow-xl" }, /* @__PURE__ */ React.createElement("div", { className: "w-14 h-14 rounded-full bg-emerald-950/70 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]" }, /* @__PURE__ */ React.createElement(Icons.Spotify, null)), /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-black text-white uppercase tracking-wider font-mono" }, "Spotify Ingest \u2022 Modo Standby"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 max-w-lg w-full text-center leading-relaxed break-words px-2" }, "Escribe una b\xFAsqueda (artista, tema o g\xE9nero) o pega un enlace de Spotify en la barra superior. Tambi\xE9n puedes importar pistas de baja calidad desde ", /* @__PURE__ */ React.createElement("strong", { className: "text-amber-400 font-semibold" }, "Auditor\xEDa & DSP"), ' usando el bot\xF3n "Buscar Reemplazos Spotify".'), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 pt-2 text-[11px] font-mono text-gray-500" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-emerald-500" }), /* @__PURE__ */ React.createElement("span", null, "Descargas Lossless FLAC / WAV \u2022 Certificaci\xF3n Espectral FFT"))) : /* @__PURE__ */ React.createElement("div", { className: "py-8 text-gray-500 font-mono text-xs" }, "No hay pistas que coincidan con los filtros aplicados."))), tracksFiltradosSp.map((row) => {
      const isSelectedRow = row.id === selectedId;
      const isRowPlaying = nowPlayingTrack && String(nowPlayingTrack.id) === String(row.id) && isPlaying;
      const isFake = Boolean(row.es_fake || String(row.status || "").includes("Fake"));
      const isTaxonomy = row.origin === "taxonomy";
      const isAuditUpgrade = row.origin === "audit_upgrade";
      const isPendingTaxonomy = isTaxonomy && !row.downloaded;
      return /* @__PURE__ */ React.createElement(
        "tr",
        {
          key: row.id,
          onClick: () => {
            setSelectedId(row.id);
            setSpInspectorOpen(true);
          },
          className: `cursor-pointer select-none transition-colors ${isSelectedRow ? isAuditUpgrade ? "bg-amber-950/50 border-l-2 border-amber-400" : isTaxonomy ? "bg-emerald-950/50 border-l-2 border-emerald-400" : "bg-djcyan-950/35 border-l-2 border-djcyan-400" : isAuditUpgrade ? "bg-amber-950/20 border-l-2 border-amber-500/60 hover:bg-amber-950/40" : isTaxonomy ? "bg-emerald-950/20 border-l-2 border-emerald-500/60 hover:bg-emerald-950/40" : "hover:bg-[#101015]"}`
        },
        /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-center", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: row.selected, onChange: () => handleToggleRow(row.id), className: "accent-djcyan-500 cursor-pointer" })),
        /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center", onClick: (e) => handlePlayPreview(row, e) }, /* @__PURE__ */ React.createElement("button", { className: `w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isRowPlaying ? "bg-djcyan-500 text-black font-bold shadow-[0_0_8px_rgba(6,182,212,0.6)]" : "bg-[#181820] text-gray-400 hover:text-white hover:bg-djzinc-800"}` }, isRowPlaying ? "\u275A\u275A" : "\u25B6")),
        /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("img", { src: getValidCover(row.cover), alt: "Cover", onError: (e) => {
          e.target.onerror = null;
          e.target.src = DEFAULT_VINYL_SVG;
        }, className: "w-9 h-9 rounded object-cover border border-djzinc-700 shrink-0 shadow-sm" }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 min-w-0" }, isAuditUpgrade && /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0", title: "Pista de reemplazo HD para audio de baja calidad" }), isTaxonomy && /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0", title: "Pista importada desde Taxonom\xEDa" }), /* @__PURE__ */ React.createElement("span", { className: `text-xs truncate max-w-sm ${isAuditUpgrade ? "font-bold text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]" : isTaxonomy ? "font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.35)]" : "font-semibold text-djcyan-400"}`, title: row.title }, row.title), isAuditUpgrade && /* @__PURE__ */ React.createElement("span", { className: "text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-900/90 text-amber-200 border border-amber-600/80 shrink-0" }, "REEMPLAZO HD"), isTaxonomy && /* @__PURE__ */ React.createElement("span", { className: "text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-600/70 shrink-0" }, "TAXONOM\xCDA")), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 font-mono truncate max-w-sm", title: row.album }, row.album), row.reemplazo_de && /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-amber-400/90 font-mono truncate max-w-sm flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", null, "Sustituye a:"), " ", /* @__PURE__ */ React.createElement("span", { className: "underline decoration-amber-500/50" }, row.reemplazo_de))))),
        /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-gray-300 text-xs truncate max-w-xs" }, row.artist),
        /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2.5 text-center" }, row.origin === "audit_upgrade" ? /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-600/80 shadow-[0_0_8px_rgba(245,158,11,0.35)] inline-flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F504}"), /* @__PURE__ */ React.createElement("span", null, "Reemplazo HD")) : row.origin === "taxonomy" ? /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/80 shadow-[0_0_8px_rgba(16,185,129,0.35)] inline-flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F3F7}\uFE0F"), /* @__PURE__ */ React.createElement("span", null, "Taxonom\xEDa")) : row.origin === "shazam" ? /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-600 inline-flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", null, "\u26A1"), /* @__PURE__ */ React.createElement("span", null, "Shazam")) : /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-djzinc-850 text-djcyan-300 border border-djzinc-750 inline-flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F3A7}"), /* @__PURE__ */ React.createElement("span", null, "Spotify"))),
        /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-djzinc-850 text-djcyan-400 border border-djzinc-750" }, row.format || (selectedFormat || "flac").toUpperCase())),
        /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center font-mono text-[10px] text-gray-300" }, row.sample_rate_khz ? `${row.sample_rate_khz} kHz` : row.downloaded ? "44.1 kHz" : "--"),
        /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center font-mono text-[10px] text-gray-300" }, row.bitrate_kbps ? `${row.bitrate_kbps} kbps` : row.downloaded ? selectedFormat === "mp3" ? "320 kbps" : "1062 kbps" : "--"),
        /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, row.downloaded ? /* @__PURE__ */ React.createElement("span", { className: `px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${isFake ? "bg-red-950 text-red-400 border-red-800" : String(row.calidad || "").includes("Alta") || String(row.calidad || "").includes("Hi-Res") ? "bg-emerald-950/80 text-emerald-400 border-emerald-800" : String(row.calidad || "").includes("Media") ? "bg-amber-950/80 text-amber-400 border-amber-800" : "bg-red-950/80 text-red-400 border-red-800"}` }, row.calidad || (isFake ? "Baja" : "Alta")) : /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-500" }, "Pendiente")),
        /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-center" }, row.downloaded ? isFake ? /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800", title: `Corte espectral a ${row.cutoff_khz || "--"}kHz` }, "\u26A0\uFE0F Transcode (", row.perdida_pct || 0, "%)") : /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/60", title: `Corte a ${row.cutoff_khz || 22.05}kHz` }, row.perdida === "Sin P\xE9rdida" ? "Sin P\xE9rdida" : row.perdida || "Sin P\xE9rdida") : /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-500" }, "--")),
        /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center font-mono text-gray-400 text-xs" }, row.duration),
        /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "bg-[#14141c] text-gray-200 px-1.5 py-0.5 rounded text-[11px] font-mono border border-djzinc-800" }, row.bpm)),
        /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-mono font-bold text-xs" }, row.key)),
        /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center gap-0.5 w-16 mx-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between w-full text-[9px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "\u26A1"), /* @__PURE__ */ React.createElement("span", { className: `font-bold ${(row.energy || 80) >= 82 ? "text-red-400" : (row.energy || 80) >= 68 ? "text-amber-400" : "text-djcyan-400"}` }, row.energy || 80, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750" }, /* @__PURE__ */ React.createElement(
          "div",
          {
            className: `h-full rounded-full ${(row.energy || 80) >= 82 ? "bg-gradient-to-r from-amber-500 to-red-500" : (row.energy || 80) >= 68 ? "bg-gradient-to-r from-yellow-400 to-amber-500" : "bg-gradient-to-r from-cyan-400 to-blue-500"}`,
            style: { width: `${Math.min(100, Math.max(10, row.energy || 80))}%` }
          }
        )))),
        /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center gap-0.5 w-16 mx-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between w-full text-[9px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "\u{1F57A}"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-purple-300" }, row.danceability || 80, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750" }, /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500",
            style: { width: `${Math.min(100, Math.max(10, row.danceability || 80))}%` }
          }
        )))),
        /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-center", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-1.5" }, row.downloaded ? isFake ? /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[10px] font-mono font-black bg-red-950 text-red-400 border border-red-700 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse", title: "\xA1Alerta! Falso FLAC con corte lossy previo" }, "FLAC FAKE") : /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 shadow", title: `Corte detectado: ${row.cutoff_khz || 22.05}kHz` }, row.status || "FLAC VERDADERO") : row.download_error ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800", title: row.download_error }, "\u26A0\uFE0F Error"), /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => lanzarDescargaReal([row]),
            className: "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black cursor-pointer shadow",
            title: "Reintentar descarga de esta pista"
          },
          "Reintentar"
        )) : /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => lanzarDescargaReal([row]),
            className: `px-3 py-1 rounded text-[11px] font-mono font-semibold border transition-colors cursor-pointer ${isPendingTaxonomy ? "bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-[#14141c] hover:bg-djcyan-600 hover:text-black text-gray-300 border-djzinc-750"}`
          },
          `${t("download_btn") || "Descargar"} .${selectedFormat}`
        )))
      );
    }))))), spInspectorOpen && currentTrack && /* @__PURE__ */ React.createElement("aside", { key: currentTrack ? currentTrack.id : "sp_none", className: "w-96 bg-djzinc-900 border-l border-djzinc-800 flex flex-col shrink-0 slide-in-right z-20 overflow-hidden shadow-2xl" }, /* @__PURE__ */ React.createElement("div", { className: "p-3 border-b border-djzinc-800 bg-djzinc-950 flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icons.Spotify, null), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-xs uppercase tracking-wider text-djcyan-400" }, "Spotify Ingest Inspector")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono bg-djzinc-800 text-gray-400 px-2 py-0.5 rounded" }, "ID #", currentTrack.id || "--"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setSpInspectorOpen(false),
        title: "Cerrar inspector",
        className: "w-6 h-6 rounded-full bg-djzinc-850 hover:bg-djzinc-750 text-gray-400 hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer border border-djzinc-700 transition-colors"
      },
      "\u2715"
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-4 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-full aspect-video bg-[#050508] rounded-lg border border-djzinc-800 overflow-hidden relative shadow-inner flex items-center justify-center" }, /* @__PURE__ */ React.createElement("img", { src: getValidCover(currentTrack.cover), alt: "Cover", onError: (e) => {
      e.target.onerror = null;
      e.target.src = DEFAULT_VINYL_SVG;
    }, className: "w-full h-full object-cover" }), /* @__PURE__ */ React.createElement("span", { className: "absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-gray-300 font-mono border border-djzinc-700" }, "HD Cover 640px")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("h4", { className: "font-bold text-sm text-djcyan-400 truncate", title: currentTrack.title }, currentTrack.title || "Selecciona una pista"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 truncate" }, currentTrack.artist || "--")), /* @__PURE__ */ React.createElement("button", { onClick: (e) => handlePlayPreview(currentTrack, e), className: "px-3 py-1 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-bold text-[10px] rounded shadow cursor-pointer shrink-0" }, nowPlayingTrack && (String(nowPlayingTrack.id) === String(currentTrack.id) || nowPlayingTrack.title === currentTrack.title) && isPlaying ? "\u275A\u275A PAUSE" : "\u25B6 PRE-ESCUCHA")), /* @__PURE__ */ React.createElement(RekordboxWaveform, { track: currentTrack, duration: currentTrack.duration || "03:30", onSeekTrack: (trk, pct) => handlePlayPreview(trk, null, pct) }), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2 text-xs font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#050508] p-2.5 rounded border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 block uppercase" }, "Tempo"), /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold" }, currentTrack.bpm ? `${currentTrack.bpm} BPM` : "--")), /* @__PURE__ */ React.createElement("div", { className: "bg-[#050508] p-2.5 rounded border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 block uppercase" }, "Clave Camelot"), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold" }, currentTrack.key || "--"))), /* @__PURE__ */ React.createElement("div", { className: "bg-[#050508] p-3 rounded border border-djzinc-800 space-y-2 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "\xC1lbum:"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-200 truncate max-w-[200px]" }, currentTrack.album || "--")), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "ISRC:"), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-gray-300" }, currentTrack.isrc || "Auto-Tag")), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "Formato Destino:"), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-djcyan-400 font-bold uppercase" }, ".", selectedFormat, " Lossless")))), /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-djzinc-950 border-t border-djzinc-800" }, /* @__PURE__ */ React.createElement("button", { onClick: () => lanzarDescargaReal(selectedCount > 0 ? tracks.filter((t2) => t2.selected) : [currentTrack]), className: "w-full py-2 bg-djcyan-600 hover:bg-djcyan-500 text-black rounded font-bold text-xs shadow-md cursor-pointer transition-colors" }, "Descargar ", selectedCount > 1 ? `Seleccionadas (${selectedCount})` : "Pista Actual", " .", selectedFormat.toUpperCase()))), fsBrowserOpen && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#0b0b10] border border-djzinc-800 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 border-b border-djzinc-800 bg-djzinc-950 flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icons.Library, null), /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-white uppercase tracking-wider font-mono" }, "Seleccionar Carpeta de Destino")), /* @__PURE__ */ React.createElement("button", { onClick: () => setFsBrowserOpen(false), className: "text-gray-400 hover:text-white text-xs px-2 py-1 rounded bg-djzinc-900 border border-djzinc-800 cursor-pointer" }, "\u2715 Cerrar")), /* @__PURE__ */ React.createElement("div", { className: "px-4 py-2.5 bg-djzinc-900 border-b border-djzinc-800 flex items-center gap-2 text-xs font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 shrink-0" }, "Ruta:"), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 truncate flex-1" }, fsCurrentPath || "/"), fsParentPath && /* @__PURE__ */ React.createElement("button", { onClick: () => handleNavegarACarpeta(fsParentPath), className: "px-2.5 py-1 bg-djzinc-800 hover:bg-djzinc-750 text-gray-200 rounded border border-djzinc-700 cursor-pointer text-xs" }, "\u2B06 Subir nivel")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-3 space-y-1 min-h-[250px] max-h-[400px]" }, fsLoading ? /* @__PURE__ */ React.createElement("div", { className: "py-12 text-center text-xs font-mono text-djcyan-400 animate-pulse" }, "Explorando directorios...") : fsFolders.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "py-12 text-center text-xs font-mono text-gray-500" }, "No se encontraron subdirectorios") : fsFolders.map((f, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, onDoubleClick: () => handleNavegarACarpeta(f.path), className: "flex items-center justify-between p-2 rounded hover:bg-djzinc-900 cursor-pointer border border-transparent hover:border-djzinc-800 transition-colors" }, /* @__PURE__ */ React.createElement("div", { onClick: () => handleNavegarACarpeta(f.path), className: "flex items-center gap-2.5 flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-amber-400 text-sm" }, "\u{1F4C1}"), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-gray-300 truncate" }, f.name)), /* @__PURE__ */ React.createElement("button", { onClick: () => handleSeleccionarCarpetaDestino(f.path), className: "px-2.5 py-1 bg-djcyan-500 hover:bg-djcyan-400 text-black font-bold text-[10px] rounded cursor-pointer shrink-0" }, "Seleccionar")))), /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-djzinc-950 border-t border-djzinc-800 flex justify-between items-center" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setFsBrowserOpen(false), className: "px-3 py-1.5 rounded text-xs bg-djzinc-900 border border-djzinc-800 text-gray-400 hover:text-white cursor-pointer" }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleSeleccionarCarpetaDestino(fsCurrentPath), className: "px-4 py-1.5 rounded text-xs font-bold bg-djcyan-500 hover:bg-djcyan-400 text-black cursor-pointer shadow" }, "Usar esta Carpeta")))));
  };
  var TaxonomyWorkspace = ({
    tracks = [],
    onTracksUpdated,
    onNavigateTab,
    onPlayTrack,
    nowPlayingTrack = null,
    isPlaying = false,
    onTogglePlay = () => {
    },
    onSelectTrackForCues,
    onSendToSpotify,
    onAddTrackToSpotify,
    onAddTracksToSpotify
  }) => {
    const [activeSubView, setActiveSubView] = useState("search");
    const [searchScope, setSearchScope] = useState("all");
    const [isSearchingOnline, setIsSearchingOnline] = useState(false);
    const [onlineResults, setOnlineResults] = useState([]);
    const [searchLocalResults, setSearchLocalResults] = useState([]);
    const [hasExecutedSearch, setHasExecutedSearch] = useState(false);
    const [selectedTaxIds, setSelectedTaxIds] = useState(/* @__PURE__ */ new Set());
    const [displayMode, setDisplayMode] = useState("table");
    const [taxSortField, setTaxSortField] = useState("matchScore");
    const [taxSortDir, setTaxSortDir] = useState("desc");
    const [taxFilterSearch, setTaxFilterSearch] = useState("");
    const [taxFilterGenre, setTaxFilterGenre] = useState("ALL");
    const [taxFilterOrigin, setTaxFilterOrigin] = useState("ALL");
    const [taxFilterEnergy, setTaxFilterEnergy] = useState("ALL");
    const [taxFilterDance, setTaxFilterDance] = useState("ALL");
    const handleSortTax = (field) => {
      setTaxSortDir((prev) => taxSortField === field && prev === "asc" ? "desc" : "asc");
      setTaxSortField(field);
    };
    const renderSortArrowTax = (field) => {
      if (taxSortField !== field) return /* @__PURE__ */ React.createElement("span", { className: "text-gray-600 ml-1 text-[9px]" }, "\u2195");
      return /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 ml-1 font-bold text-[10px]" }, taxSortDir === "asc" ? "\u25B2" : "\u25BC");
    };
    const [aiQuery, setAiQuery] = useState("");
    const [selectedGenreFilter, setSelectedGenreFilter] = useState("ALL");
    const [selectedSubgenreFilterUI, setSelectedSubgenreFilterUI] = useState("ALL");
    const [selectedVersionFilter, setSelectedVersionFilter] = useState("ALL");
    const [selectedBpmFilter, setSelectedBpmFilter] = useState("ALL");
    const [selectedKeyFilter, setSelectedKeyFilter] = useState("ALL");
    const [selectedMoodFilter, setSelectedMoodFilter] = useState("ALL");
    const [isCamelotModalOpen, setIsCamelotModalOpen] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState("");
    const [isAddTagMenuOpen, setIsAddTagMenuOpen] = useState(false);
    const [activeTagTab, setActiveTagTab] = useState("bpm");
    const handleRemoveToken = (tok) => {
      if (!tok) return;
      let newQuery = aiQuery;
      const matchStr = tok.rawMatch || tok.label;
      if (matchStr) {
        newQuery = newQuery.replace(new RegExp(`\\b${matchStr.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "i"), "");
        if (newQuery === aiQuery) {
          newQuery = newQuery.replace(new RegExp(matchStr.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i"), "");
        }
      }
      newQuery = newQuery.replace(/\s+/g, " ").trim();
      setAiQuery(newQuery);
      handleEjecutarBusqueda(newQuery);
    };
    const handleAddTagToQuery = (tagStr) => {
      const newQuery = (aiQuery ? `${aiQuery} ${tagStr}` : tagStr).trim();
      setAiQuery(newQuery);
      setIsAddTagMenuOpen(false);
      handleEjecutarBusqueda(newQuery);
    };
    const [rutaBase, setRutaBase] = useState("/Users/admin/Music/mi musica");
    const [modo, setModo] = useState("copy");
    const [isRouting, setIsRouting] = useState(false);
    const [routeProgress, setRouteProgress] = useState(0);
    const [routeStatusMsg, setRouteStatusMsg] = useState("");
    const [resultSummary, setResultSummary] = useState(null);
    const [expandedGenre, setExpandedGenre] = useState("Techno");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSubgenreFilter, setSelectedSubgenreFilter] = useState(null);
    useEffect(() => {
      handleEjecutarBusqueda("");
    }, []);
    const parsedQuery = useMemo(() => parseAIDJQuery(aiQuery), [aiQuery]);
    const localTracks = useMemo(() => {
      return (Array.isArray(tracks) ? tracks : []).map((t) => ({
        ...t,
        isLocal: true,
        displayTitle: t.t || t.title || "Pista Local",
        displayArtist: t.a || t.artist || "Artista",
        displayAlbum: t.album || "",
        displayBpm: parseFloat(t.b || t.bpm || 128),
        displayKey: (t.k || t.key || "8A").toUpperCase(),
        displayGenre: t.genre || "House",
        displaySubgenre: t.subgenre || "Tech House",
        displayVersion: t.version || "Extended Mix",
        displayMood: t.mood_subtag || t.mood || "Peak Time / Pista",
        displayCover: t.cover || (t.path ? `/cover?path=${encodeURIComponent(t.path)}` : null)
      }));
    }, [tracks]);
    const catalogTracks = useMemo(() => {
      return DJ_CURATED_CATALOG.map((t) => ({
        ...t,
        isCatalog: true,
        displayTitle: t.title,
        displayArtist: t.artist,
        displayAlbum: t.album || "",
        displayBpm: t.bpm,
        displayKey: t.key,
        displayGenre: t.genre,
        displaySubgenre: t.subgenre,
        displayVersion: t.version,
        displayMood: t.mood,
        displayCover: t.cover
      }));
    }, []);
    const allPoolTracks = useMemo(() => {
      const combinedLocals = searchLocalResults.length > 0 ? searchLocalResults : localTracks;
      const combinedOnline = onlineResults.length > 0 ? onlineResults : catalogTracks;
      if (searchScope === "local") {
        return combinedLocals;
      } else if (searchScope === "online") {
        return combinedOnline;
      } else {
        return [...combinedLocals, ...combinedOnline];
      }
    }, [localTracks, searchLocalResults, onlineResults, catalogTracks, searchScope]);
    const handleEjecutarBusqueda = async (queryOverride) => {
      const q = (queryOverride !== void 0 ? queryOverride : aiQuery).trim();
      setIsSearchingOnline(true);
      setHasExecutedSearch(true);
      const scopeLabel = searchScope === "local" ? "Biblioteca Local" : searchScope === "online" ? "Record Pool Online" : "Local y Pool Online";
      setFeedbackMsg(`Buscando ${q ? `"${q}"` : "cat\xE1logo"} en ${scopeLabel}...`);
      try {
        if (window.eel && window.eel.buscar_temas_taxonomia) {
          const res = await window.eel.buscar_temas_taxonomia(q, searchScope, rutaBase, 40)();
          if (res && res.status === "ok") {
            const onlineItems = (res.online || []).map((item) => ({
              ...item,
              isOnlinePool: true,
              isFromSearch: true,
              displayTitle: item.title,
              displayArtist: item.artist,
              displayAlbum: item.album || "",
              displayBpm: parseFloat(item.bpm || 128),
              displayKey: (item.key || "8A").toUpperCase(),
              displayGenre: item.genre || "House",
              displaySubgenre: item.subgenre || "Tech House",
              displayVersion: item.version || "Original Mix",
              displayMood: item.mood || "Peak Time / Pista",
              displayCover: item.cover,
              matchScore: 98
            }));
            const localItems = (res.locales || []).map((item) => ({
              ...item,
              isLocal: true,
              isLocalSearch: true,
              isFromSearch: true,
              displayTitle: item.title || item.t || "Pista Local",
              displayArtist: item.artist || item.a || "Artista Local",
              displayAlbum: item.album || "",
              displayBpm: parseFloat(item.bpm || item.b || 128),
              displayKey: (item.key || item.k || "8A").toUpperCase(),
              displayGenre: item.genre || "House",
              displaySubgenre: item.subgenre || "Tech House",
              displayVersion: item.version || "Extended Mix",
              displayMood: item.mood || "Peak Time / Pista",
              displayCover: item.cover || (item.path ? `/cover?path=${encodeURIComponent(item.path)}` : null),
              matchScore: 98
            }));
            setOnlineResults(onlineItems);
            setSearchLocalResults(localItems);
            const totalFound = localItems.length + onlineItems.length;
            setFeedbackMsg(`\u2713 Encontrados ${totalFound} temas (${localItems.length} en disco + ${onlineItems.length} en Record Pool)`);
          }
        }
      } catch (err) {
        console.error("Error al buscar temas en taxonom\xEDa:", err);
        setFeedbackMsg(`\u2713 B\xFAsqueda filtrada en pistas de biblioteca.`);
      } finally {
        setIsSearchingOnline(false);
        setTimeout(() => setFeedbackMsg(""), 4500);
      }
    };
    const searchResults = useMemo(() => {
      const hasTextQuery = Boolean(aiQuery && aiQuery.trim().length > 0);
      const qLower = (aiQuery || "").toLowerCase().trim();
      const queryWords = qLower.split(/\s+/).filter((w) => w.length >= 2 && !["para", "con", "del", "the", "los", "las", "por", "and"].includes(w));
      let scored = allPoolTracks.map((trk) => {
        let score = 0;
        let matchedReasons = [];
        const trkGenre = (trk.displayGenre || "").toLowerCase();
        const trkSubgenre = (trk.displaySubgenre || "").toLowerCase();
        const trkBpm = trk.displayBpm || 128;
        const trkKey = (trk.displayKey || "").toUpperCase();
        const trkTitle = (trk.displayTitle || "").toLowerCase();
        const trkArtist = (trk.displayArtist || "").toLowerCase();
        const trkAlbum = (trk.displayAlbum || "").toLowerCase();
        const trkVersion = (trk.displayVersion || "").toLowerCase();
        const trkMood = (trk.displayMood || "").toLowerCase();
        if (hasTextQuery) {
          if (trk.isFromSearch) {
            score += 80;
            matchedReasons.push("Resultado directo");
          }
          if (trkTitle.includes(qLower) || trkArtist.includes(qLower) || trkAlbum.includes(qLower) || trkGenre.includes(qLower) || trkSubgenre.includes(qLower)) {
            score += 65;
            matchedReasons.push("Coincidencia directa");
          }
          if (parsedQuery.genre && trkGenre.includes(parsedQuery.genre.toLowerCase())) {
            score += 35;
            matchedReasons.push(parsedQuery.genre);
          }
          if (parsedQuery.subgenre && (trkSubgenre.includes(parsedQuery.subgenre.toLowerCase()) || trkTitle.includes(parsedQuery.subgenre.toLowerCase()))) {
            score += 30;
            matchedReasons.push(parsedQuery.subgenre);
          }
          if (parsedQuery.targetBpm && trkBpm > 0) {
            const diff = Math.abs(trkBpm - parsedQuery.targetBpm);
            if (diff <= 1.5) {
              score += 30;
              matchedReasons.push(`${trkBpm} BPM`);
            } else if (diff <= 3.5) {
              score += 20;
              matchedReasons.push(`\xB1${Math.round(diff)} BPM`);
            } else if (diff <= 6) {
              score += 10;
            }
          } else if (parsedQuery.minBpm && parsedQuery.maxBpm && trkBpm >= parsedQuery.minBpm && trkBpm <= parsedQuery.maxBpm) {
            score += 25;
            matchedReasons.push(`${trkBpm} BPM`);
          }
          if (parsedQuery.key) {
            if (trkKey === parsedQuery.key) {
              score += 30;
              matchedReasons.push(`Key ${trkKey}`);
            } else if (parsedQuery.compatibleKeys.includes(trkKey)) {
              score += 20;
              matchedReasons.push(`Harmonic ${trkKey}`);
            }
          }
          if (parsedQuery.version) {
            const vLower = parsedQuery.version.toLowerCase();
            if (trkVersion.includes(vLower) || trkTitle.includes(vLower)) {
              score += 20;
              matchedReasons.push(parsedQuery.version);
            }
          }
          if (parsedQuery.mood) {
            const mLower = parsedQuery.mood.toLowerCase();
            if (trkMood.includes(mLower) || parsedQuery.mood.includes("Previa") && (trkBpm < 118 || trkMood.includes("warm")) || parsedQuery.mood.includes("Pista") && (trkBpm >= 124 || trkMood.includes("peak"))) {
              score += 15;
              matchedReasons.push(parsedQuery.mood);
            }
          }
          queryWords.forEach((word) => {
            if (trkArtist.includes(word)) {
              score += 35;
              matchedReasons.push(`Artista: ${word}`);
            }
            if (trkTitle.includes(word)) {
              score += 30;
              matchedReasons.push(`T\xEDtulo: ${word}`);
            }
            if (trkAlbum.includes(word)) {
              score += 25;
              matchedReasons.push(`\xC1lbum: ${word}`);
            }
            if (trkGenre.includes(word) || trkSubgenre.includes(word)) {
              score += 25;
              matchedReasons.push(`Estilo: ${word}`);
            }
          });
        } else {
          score = 85;
        }
        let matchesManual = true;
        if (selectedGenreFilter !== "ALL" && !trkGenre.includes(selectedGenreFilter.toLowerCase())) {
          matchesManual = false;
        }
        if (selectedSubgenreFilterUI !== "ALL" && !trkSubgenre.includes(selectedSubgenreFilterUI.toLowerCase())) {
          matchesManual = false;
        }
        if (selectedVersionFilter !== "ALL") {
          const sv = selectedVersionFilter.toLowerCase();
          if (!trkVersion.includes(sv) && !trkTitle.includes(sv)) matchesManual = false;
        }
        if (selectedBpmFilter !== "ALL") {
          if (selectedBpmFilter === "<120" && trkBpm >= 120) matchesManual = false;
          if (selectedBpmFilter === "120-125" && (trkBpm < 120 || trkBpm > 125)) matchesManual = false;
          if (selectedBpmFilter === "126-129" && (trkBpm < 126 || trkBpm > 129)) matchesManual = false;
          if (selectedBpmFilter === "130-135" && (trkBpm < 130 || trkBpm > 135)) matchesManual = false;
          if (selectedBpmFilter === ">135" && trkBpm <= 135) matchesManual = false;
        }
        if (selectedKeyFilter !== "ALL" && trkKey !== selectedKeyFilter) {
          matchesManual = false;
        }
        if (selectedMoodFilter !== "ALL" && !trkMood.includes(selectedMoodFilter.toLowerCase())) {
          matchesManual = false;
        }
        if (taxFilterSearch) {
          const hTerm = taxFilterSearch.toLowerCase();
          const mSearch = trkTitle.includes(hTerm) || trkArtist.includes(hTerm) || trkAlbum.includes(hTerm);
          if (!mSearch) matchesManual = false;
        }
        if (taxFilterGenre !== "ALL") {
          if (!trkGenre.includes(taxFilterGenre.toLowerCase())) matchesManual = false;
        }
        if (taxFilterOrigin !== "ALL") {
          const isLoc = Boolean(trk.isLocal || trk.is_local);
          if (taxFilterOrigin === "local" && !isLoc) matchesManual = false;
          if (taxFilterOrigin === "online" && isLoc) matchesManual = false;
        }
        if (taxFilterEnergy !== "ALL") {
          const eVal = Number(trk.energy || trk.e || 80);
          if (taxFilterEnergy === "HIGH" && eVal < 80) matchesManual = false;
          if (taxFilterEnergy === "MED" && (eVal < 65 || eVal >= 80)) matchesManual = false;
          if (taxFilterEnergy === "LOW" && eVal >= 65) matchesManual = false;
        }
        if (taxFilterDance !== "ALL") {
          const dVal = Number(trk.danceability || trk.dance || 80);
          if (taxFilterDance === "HIGH" && dVal < 80) matchesManual = false;
          if (taxFilterDance === "MED" && (dVal < 65 || dVal >= 80)) matchesManual = false;
          if (taxFilterDance === "LOW" && dVal >= 65) matchesManual = false;
        }
        const finalPct = Math.min(100, Math.max(10, score));
        return {
          ...trk,
          matchScore: finalPct,
          matchedReasons,
          matchesManual
        };
      }).filter((t) => t.matchesManual && (!hasTextQuery || t.matchScore >= 15 || t.isFromSearch));
      scored.sort((a, b) => {
        let valA = a[taxSortField];
        let valB = b[taxSortField];
        if (taxSortField === "title") {
          valA = a.displayTitle || "";
          valB = b.displayTitle || "";
        } else if (taxSortField === "artist") {
          valA = a.displayArtist || "";
          valB = b.displayArtist || "";
        } else if (taxSortField === "album") {
          valA = a.displayAlbum || "";
          valB = b.displayAlbum || "";
        } else if (taxSortField === "genre") {
          valA = a.displayGenre || "";
          valB = b.displayGenre || "";
        } else if (taxSortField === "subgenre") {
          valA = a.displaySubgenre || "";
          valB = b.displaySubgenre || "";
        } else if (taxSortField === "key") {
          valA = a.displayKey || "";
          valB = b.displayKey || "";
        } else if (taxSortField === "origin") {
          valA = Boolean(a.isLocal || a.is_local) ? "local" : "online";
          valB = Boolean(b.isLocal || b.is_local) ? "local" : "online";
        } else if (["matchScore", "displayBpm", "energy", "danceability"].includes(taxSortField)) {
          valA = Number(valA || (taxSortField === "energy" ? a.energy || a.e : a.danceability || a.dance)) || 0;
          valB = Number(valB || (taxSortField === "energy" ? b.energy || b.e : b.danceability || b.dance)) || 0;
        }
        if (typeof valA === "number" && typeof valB === "number") {
          return taxSortDir === "asc" ? valA - valB : valB - valA;
        }
        return taxSortDir === "asc" ? String(valA || "").localeCompare(String(valB || "")) : String(valB || "").localeCompare(String(valA || ""));
      });
      return scored;
    }, [allPoolTracks, aiQuery, parsedQuery, selectedGenreFilter, selectedSubgenreFilterUI, selectedVersionFilter, selectedBpmFilter, selectedKeyFilter, selectedMoodFilter, taxFilterSearch, taxFilterGenre, taxFilterOrigin, taxFilterEnergy, taxFilterDance, taxSortField, taxSortDir]);
    const handleToggleTaxRow = (id) => {
      setSelectedTaxIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    };
    const allTaxSelected = searchResults.length > 0 && searchResults.every((t) => selectedTaxIds.has(t.id));
    const handleToggleSelectAllTax = () => {
      if (allTaxSelected) {
        setSelectedTaxIds(/* @__PURE__ */ new Set());
      } else {
        setSelectedTaxIds(new Set(searchResults.map((t) => t.id)));
      }
    };
    const handleAnadirADescargas = (trk) => {
      if (!trk) return;
      const addFn = onAddTracksToSpotify || onAddTrackToSpotify;
      if (addFn) {
        addFn([trk], "taxonomy");
        setFeedbackMsg(`\u2713 "${trk.displayTitle || trk.title}" a\xF1adido a Descargas (Spotify Ingest). Redirigiendo a descargas...`);
      } else if (onSendToSpotify) {
        onSendToSpotify(trk.displayTitle || trk.title);
      } else if (onNavigateTab) {
        onNavigateTab("spotify");
      }
    };
    const handleAnadirSeleccionadasADescargas = () => {
      const seleccionadas = searchResults.filter((t) => selectedTaxIds.has(t.id));
      if (seleccionadas.length === 0) return;
      const addFn = onAddTracksToSpotify || onAddTrackToSpotify;
      if (addFn) {
        addFn(seleccionadas, "taxonomy");
        setFeedbackMsg(`\u2713 ${seleccionadas.length} pista(s) seleccionadas a\xF1adidas a Descargas (Spotify Ingest). Redirigiendo a descargas...`);
      } else if (onNavigateTab) {
        onNavigateTab("spotify");
      }
    };
    const handleAnadirTodasADescargas = () => {
      if (searchResults.length === 0) return;
      const addFn = onAddTracksToSpotify || onAddTrackToSpotify;
      if (addFn) {
        addFn(searchResults, "taxonomy");
        setFeedbackMsg(`\u2713 ${searchResults.length} pista(s) a\xF1adidas a Descargas (Spotify Ingest). Redirigiendo a descargas...`);
      } else if (onNavigateTab) {
        onNavigateTab("spotify");
      }
    };
    const handleCargarEnDeck = async (trk) => {
      if (!trk) return;
      const isCurrent = isPlaying && nowPlayingTrack && (String(nowPlayingTrack.id) === String(trk.id) || nowPlayingTrack.path && nowPlayingTrack.path === trk.path || nowPlayingTrack.title && (nowPlayingTrack.title === trk.displayTitle || nowPlayingTrack.title === trk.title));
      if (isCurrent && onTogglePlay) {
        onTogglePlay();
        return;
      }
      let streamUrl = trk.preview_url || trk.previewUrl || (trk.path && (trk.path.startsWith("http://") || trk.path.startsWith("https://")) ? trk.path : "");
      let coverHd = trk.displayCover || trk.cover;
      if (!streamUrl && !trk.path && !trk.f && window.eel && window.eel.resolver_stream_preescucha) {
        try {
          setFeedbackMsg(`[PRE-ESCUCHA] Resolviendo audio para: ${trk.displayArtist || trk.artist} - ${trk.displayTitle || trk.title}...`);
          const res = await window.eel.resolver_stream_preescucha(trk.displayTitle || trk.title, trk.displayArtist || trk.artist)();
          if (res && res.stream_url) {
            streamUrl = res.stream_url;
            if (res.cover) coverHd = res.cover;
          }
        } catch (err) {
          console.warn("Fallo al resolver preescucha en taxonom\xEDa:", err);
        }
      }
      const trackToPlay = {
        ...trk,
        id: trk.id || `tax_${Date.now()}`,
        t: trk.displayTitle || trk.title || trk.t || "Audio Track",
        title: trk.displayTitle || trk.title || trk.t || "Audio Track",
        a: trk.displayArtist || trk.artist || trk.a || "Artista",
        artist: trk.displayArtist || trk.artist || trk.a || "Artista",
        album: trk.displayAlbum || trk.album || "",
        b: trk.displayBpm || trk.bpm || trk.b || 128,
        bpm: trk.displayBpm || trk.bpm || trk.b || 128,
        k: trk.displayKey || trk.key || trk.k || "8A",
        key: trk.displayKey || trk.key || trk.k || "8A",
        cover: coverHd,
        path: trk.path || trk.f || streamUrl || "",
        f: trk.path || trk.f || "",
        preview_url: streamUrl
      };
      if (onPlayTrack) {
        onPlayTrack(trackToPlay, 0, true);
        setFeedbackMsg(`\u2713 "${trackToPlay.title}" reproduciendo en Deck 1`);
        setTimeout(() => setFeedbackMsg(""), 3500);
      }
    };
    const handleAbrirEnHotCues = (trk) => {
      if (!trk) return;
      if (onSelectTrackForCues) {
        onSelectTrackForCues(trk);
      } else if (onNavigateTab) {
        onNavigateTab("hotcues");
      }
    };
    const handleApuntarEnLibreta = (trk) => {
      try {
        const saved = localStorage.getItem("beatwave_shazam_notebook");
        const list = saved ? JSON.parse(saved) : [];
        const exists = list.some((item) => item.title === trk.displayTitle && item.artist === trk.displayArtist);
        if (!exists) {
          const now = /* @__PURE__ */ new Date();
          const item = {
            title: trk.displayTitle,
            artist: trk.displayArtist,
            bpm: trk.displayBpm,
            key: trk.displayKey,
            genre: trk.displayGenre,
            cover: trk.displayCover,
            added_at: now.toLocaleDateString() + " " + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            notebook_id: Date.now()
          };
          list.unshift(item);
          localStorage.setItem("beatwave_shazam_notebook", JSON.stringify(list));
          setFeedbackMsg(`\u2713 "${trk.displayTitle}" guardado en tu Libreta Digital.`);
        } else {
          setFeedbackMsg(`\u2139 "${trk.displayTitle}" ya estaba en tu libreta.`);
        }
        setTimeout(() => setFeedbackMsg(""), 3e3);
      } catch (e) {
        console.error(e);
      }
    };
    const handleAsignarACrateIndividual = async (trk) => {
      if (!trk) return;
      try {
        if (window.eel && window.eel.organizar_pista_en_crate) {
          const res = await window.eel.organizar_pista_en_crate(trk, rutaBase, modo)();
          if (res && res.status === "ok") {
            setFeedbackMsg(`\u2713 Pista enrutada a Crate /${trk.displayGenre}/${trk.displaySubgenre}/`);
          } else {
            setFeedbackMsg(`\u26A0 ${res?.msg || "Error al enrutar pista"}`);
          }
          setTimeout(() => setFeedbackMsg(""), 3500);
        }
      } catch (e) {
        console.error(e);
      }
    };
    const handleSeleccionarDestino = async () => {
      try {
        if (window.eel && window.eel.seleccionar_directorio) {
          const dir = await window.eel.seleccionar_directorio()();
          if (dir) {
            setRutaBase(dir);
          }
        }
      } catch (err) {
        console.error("Error al seleccionar carpeta destino:", err);
      }
    };
    const handleOrganizarLote = async () => {
      if (!tracks || tracks.length === 0) return;
      setIsRouting(true);
      setRouteProgress(5);
      setRouteStatusMsg(`Iniciando ruteo de ${tracks.length} pistas a ${rutaBase}...`);
      setResultSummary(null);
      try {
        if (window.eel && window.eel.organizar_lote_en_crates) {
          const res = await window.eel.organizar_lote_en_crates(tracks, rutaBase, modo)();
          if (res && res.status === "ok") {
            setResultSummary(res);
            setRouteProgress(100);
            setRouteStatusMsg(`\u2713 Lote completado: ${res.procesados} pistas organizadas.`);
          } else {
            setResultSummary({ status: "error", msg: res?.msg || "Error en el ruteo de lote." });
            setRouteStatusMsg(res?.msg || "Error durante la operaci\xF3n.");
          }
        }
      } catch (err) {
        console.error("Error al organizar lote:", err);
        setResultSummary({ status: "error", msg: String(err) });
        setRouteStatusMsg("Fallo inesperado al enrutar lote.");
      } finally {
        setIsRouting(false);
        setTimeout(() => setRouteProgress(0), 4e3);
      }
    };
    const handleExportarSeratoCrates = async () => {
      if (!tracks || tracks.length === 0) return;
      setIsRouting(true);
      setRouteProgress(50);
      setRouteStatusMsg("Generando archivos binarios .crate para Serato DJ Pro...");
      try {
        if (window.eel && window.eel.exportar_serato_crates) {
          const res = await window.eel.exportar_serato_crates(tracks)();
          setRouteProgress(100);
          if (res && res.status === "ok") {
            setResultSummary({
              status: "ok",
              procesados: res.total_pistas,
              errores: 0,
              msg: `\u2713 ${res.total_crates} crates generados exitosamente en ${res.destino}`
            });
          } else {
            setResultSummary({ status: "error", msg: res?.msg || "Error al exportar crates Serato." });
          }
        }
      } catch (err) {
        console.error("Error al exportar crates Serato:", err);
        setResultSummary({ status: "error", msg: String(err) });
      } finally {
        setIsRouting(false);
        setTimeout(() => setRouteProgress(0), 4e3);
      }
    };
    const handleExportarRekordboxXml = async () => {
      if (!tracks || tracks.length === 0) return;
      setIsRouting(true);
      setRouteProgress(50);
      setRouteStatusMsg("Generando archivo rekordbox.xml est\xE1ndar Pioneer DJ...");
      try {
        if (window.eel && window.eel.exportar_rekordbox_xml) {
          const res = await window.eel.exportar_rekordbox_xml(tracks, rutaBase, "rekordbox.xml")();
          setRouteProgress(100);
          if (res && res.status === "ok") {
            setResultSummary({
              status: "ok",
              procesados: res.total_tracks,
              errores: 0,
              msg: `\u2713 Archivo rekordbox.xml generado exitosamente (${res.total_tracks} pistas, ${res.playlists} playlists) en ${res.path}`
            });
          } else {
            setResultSummary({ status: "error", msg: res?.msg || "Error al exportar rekordbox.xml." });
          }
        }
      } catch (err) {
        console.error("Error al exportar rekordbox XML:", err);
        setResultSummary({ status: "error", msg: String(err) });
      } finally {
        setIsRouting(false);
        setTimeout(() => setRouteProgress(0), 4e3);
      }
    };
    const getGenreStats = (gen) => {
      return tracks.filter((t) => (t.genre || "Tech House").toLowerCase() === gen.toLowerCase()).length;
    };
    const getSubgenreStats = (gen, subg) => {
      return tracks.filter((t) => {
        const g = (t.genre || "Tech House").toLowerCase();
        const sg = (t.subgenre || (TAXONOMY_TREE[t.genre || "Tech House"] ? TAXONOMY_TREE[t.genre || "Tech House"][0] : "")).toLowerCase();
        return g === gen.toLowerCase() && sg === subg.toLowerCase();
      });
    };
    const genresList = Object.keys(TAXONOMY_TREE);
    const totalCratesCount = genresList.reduce((acc, g) => acc + (TAXONOMY_TREE[g] ? TAXONOMY_TREE[g].length : 0), 0);
    const filteredGenres = genresList.filter((g) => {
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      if (g.toLowerCase().includes(s)) return true;
      return TAXONOMY_TREE[g] && TAXONOMY_TREE[g].some((sg) => sg.toLowerCase().includes(s));
    });
    const resetFilters = () => {
      setAiQuery("");
      setOnlineResults([]);
      setHasExecutedSearch(false);
      setSelectedGenreFilter("ALL");
      setSelectedSubgenreFilterUI("ALL");
      setSelectedVersionFilter("ALL");
      setSelectedBpmFilter("ALL");
      setSelectedKeyFilter("ALL");
      setSelectedMoodFilter("ALL");
      setTaxFilterSearch("");
      setTaxFilterGenre("ALL");
      setTaxFilterOrigin("ALL");
      setTaxFilterEnergy("ALL");
      setTaxFilterDance("ALL");
    };
    return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col h-full w-full overflow-hidden bg-djzinc-950 text-gray-200" }, /* @__PURE__ */ React.createElement("div", { className: "px-5 pt-4 pb-3 border-b border-djzinc-800 bg-[#08080c] shrink-0 space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-lg bg-djcyan-500/10 border border-djcyan-500/40 flex items-center justify-center text-djcyan-400 font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]" }, "\u26A1"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-black text-white uppercase tracking-wider font-mono flex items-center gap-2" }, "Centro de Taxonom\xEDa Musical & Crates"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 text-xs" }, "Buscador inteligente en lenguaje natural y ruteo jer\xE1rquico a crates de Serato / Rekordbox."))), /* @__PURE__ */ React.createElement("div", { className: "inline-flex rounded-xl border border-djzinc-700/80 p-1 bg-djzinc-900/90 shadow" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setActiveSubView("search"),
        className: `px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeSubView === "search" ? "bg-gradient-to-r from-djcyan-500 to-blue-500 text-black shadow-md" : "text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F50D} Buscador IA"),
      /* @__PURE__ */ React.createElement("span", { className: "text-[9px] px-1.5 py-0.2 rounded font-mono bg-black/30 text-white font-black" }, searchResults.length)
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setActiveSubView("routing"),
        className: `px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeSubView === "routing" ? "bg-djcyan-500 text-black shadow-md" : "text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F5C2}\uFE0F Serato Crates & Rekordbox"),
      /* @__PURE__ */ React.createElement("span", { className: "text-[9px] px-1.5 py-0.2 rounded font-mono bg-black/30 text-white font-black" }, totalCratesCount)
    ))), feedbackMsg && /* @__PURE__ */ React.createElement("div", { className: "p-2.5 rounded-lg bg-djcyan-950/80 border border-djcyan-500/50 text-djcyan-300 text-xs font-mono flex items-center justify-between shadow-lg animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "animate-pulse" }, "\u25CF"), /* @__PURE__ */ React.createElement("span", null, feedbackMsg)), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setFeedbackMsg(""), className: "text-gray-400 hover:text-white cursor-pointer px-1" }, "\u2715"))), activeSubView === "search" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "p-5 border-b border-djzinc-850 bg-[#09090e] shrink-0 space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 bg-[#050509] p-1 rounded-xl border border-djzinc-800 shadow-inner" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono font-bold text-gray-400 px-2 uppercase tracking-wider" }, "Buscar en:"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setSearchScope("all"),
        className: `px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${searchScope === "all" ? "bg-gradient-to-r from-djcyan-500 to-blue-500 text-black shadow" : "text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F310} Todo (H\xEDbrido)")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setSearchScope("local"),
        className: `px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${searchScope === "local" ? "bg-djcyan-500 text-black shadow" : "text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4C1} Mi Biblioteca Local"),
      /* @__PURE__ */ React.createElement("span", { className: "text-[9px] px-1.5 py-0.2 rounded bg-black/30 text-white font-mono" }, localTracks.length)
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setSearchScope("online"),
        className: `px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${searchScope === "online" ? "bg-purple-500 text-white shadow" : "text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement("span", null, "\u2601\uFE0F Record Pool Online"),
      /* @__PURE__ */ React.createElement("span", { className: "text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-purple-200 font-mono" }, "SuperFLAC / Pool")
    )), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowAdvancedFilters(!showAdvancedFilters),
        className: `text-xs px-2.5 py-1.5 rounded-lg border font-mono transition-all flex items-center gap-1.5 cursor-pointer ${showAdvancedFilters || selectedGenreFilter !== "ALL" || selectedBpmFilter !== "ALL" || selectedKeyFilter !== "ALL" ? "bg-djcyan-950 text-djcyan-300 border-djcyan-600" : "bg-djzinc-900 text-gray-400 border-djzinc-750 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F39A}\uFE0F Filtros Manuales"),
      /* @__PURE__ */ React.createElement("span", null, showAdvancedFilters ? "\u25B2" : "\u25BC")
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "relative flex-1 flex items-center" }, /* @__PURE__ */ React.createElement("span", { className: "absolute left-3.5 text-gray-400 text-base pointer-events-none" }, "\u{1F50D}"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: aiQuery,
        onChange: (e) => setAiQuery(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") {
            handleEjecutarBusqueda();
          }
        },
        placeholder: "Ej: tech house a 128 bpm en 8A, afro house para bailar, reggaeton retro para la previa, extended mix...",
        className: "w-full bg-[#040407] border-2 border-djzinc-750 focus:border-djcyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] rounded-xl pl-10 pr-12 py-3 text-sm font-medium text-white placeholder-gray-500 outline-none transition-all shadow-inner"
      }
    ), aiQuery && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setAiQuery("");
          setOnlineResults([]);
        },
        className: "absolute right-3.5 text-gray-400 hover:text-white text-xs font-bold cursor-pointer",
        title: "Borrar texto"
      },
      "\u2715"
    )), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleEjecutarBusqueda(),
        disabled: isSearchingOnline,
        className: "px-6 py-3 bg-djcyan-500 hover:bg-djcyan-400 active:scale-95 text-black font-black text-xs font-mono uppercase tracking-wider rounded-xl shadow-[0_0_18px_rgba(6,182,212,0.45)] transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
      },
      isSearchingOnline ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "animate-spin" }, "\u23F3"), /* @__PURE__ */ React.createElement("span", null, "Buscando...")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", null, "\u{1F50D}"), /* @__PURE__ */ React.createElement("span", null, "Buscar Temas"))
    )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2 pt-1" }, parsedQuery.tokens && parsedQuery.tokens.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-400 mr-0.5" }, "Filtros Activos:"), parsedQuery.tokens.map((tok, idx) => /* @__PURE__ */ React.createElement(
      "span",
      {
        key: idx,
        className: "text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-djcyan-950/90 text-djcyan-300 border border-djcyan-600/80 shadow-sm flex items-center gap-1.5 group"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u2713"),
      /* @__PURE__ */ React.createElement("span", null, tok.label),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => handleRemoveToken(tok),
          className: "w-3.5 h-3.5 rounded-full hover:bg-red-500 hover:text-white text-djcyan-400 flex items-center justify-center text-[9px] font-black cursor-pointer transition-colors ml-0.5",
          title: `Eliminar filtro ${tok.label}`
        },
        "\u2715"
      )
    ))), /* @__PURE__ */ React.createElement("div", { className: "relative inline-block" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setIsAddTagMenuOpen((prev) => !prev),
        className: "text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#12121f] hover:bg-djcyan-950 text-djcyan-400 hover:text-djcyan-300 border border-djcyan-700/60 shadow flex items-center gap-1.5 cursor-pointer transition-all active:scale-95",
        title: "A\xF1adir manualmente filtros de BPM, Tono, G\xE9nero, Versi\xF3n o Mood"
      },
      /* @__PURE__ */ React.createElement("span", { className: "font-black text-xs" }, "+"),
      /* @__PURE__ */ React.createElement("span", null, "A\xF1adir Tag"),
      /* @__PURE__ */ React.createElement("span", { className: "text-[8px] text-gray-500" }, isAddTagMenuOpen ? "\u25B2" : "\u25BC")
    ), isAddTagMenuOpen && /* @__PURE__ */ React.createElement("div", { className: "absolute top-full left-0 mt-1.5 w-84 bg-[#0a0a14] border-2 border-djcyan-500/70 rounded-xl p-3 shadow-2xl z-50 animate-fadeIn text-xs font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800 pb-1.5 mb-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black text-white uppercase tracking-wider" }, "A\xF1adir Tag a la B\xFAsqueda"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setIsAddTagMenuOpen(false),
        className: "text-gray-400 hover:text-white text-xs font-bold cursor-pointer"
      },
      "\u2715"
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 mb-2 border-b border-djzinc-800/80 pb-1" }, [
      { id: "bpm", label: "BPM" },
      { id: "key", label: "Key" },
      { id: "genre", label: "G\xE9nero" },
      { id: "version", label: "Versi\xF3n" },
      { id: "mood", label: "Mood" }
    ].map((cat) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: cat.id,
        type: "button",
        onClick: () => setActiveTagTab(cat.id),
        className: `px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${activeTagTab === cat.id ? "bg-djcyan-500 text-black shadow" : "text-gray-400 hover:text-white hover:bg-djzinc-850"}`
      },
      cat.label
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scrollbar p-0.5" }, activeTagTab === "bpm" && [
      "120 bpm",
      "124 bpm",
      "126 bpm",
      "128 bpm",
      "130 bpm",
      "132 bpm",
      "138 bpm",
      "140 bpm",
      "145 bpm",
      "150 bpm",
      "160 bpm",
      "174 bpm"
    ].map((tag) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: tag,
        type: "button",
        onClick: () => handleAddTagToQuery(tag),
        className: "px-2 py-1 rounded bg-[#161622] hover:bg-djcyan-500 hover:text-black border border-djzinc-750 text-gray-200 text-[10px] font-bold cursor-pointer transition-all"
      },
      "+ ",
      tag
    )), activeTagTab === "key" && [
      "1A",
      "2A",
      "3A",
      "4A",
      "5A",
      "6A",
      "7A",
      "8A",
      "9A",
      "10A",
      "11A",
      "12A",
      "1B",
      "2B",
      "3B",
      "4B",
      "5B",
      "6B",
      "7B",
      "8B",
      "9B",
      "10B",
      "11B",
      "12B"
    ].map((tag) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: tag,
        type: "button",
        onClick: () => handleAddTagToQuery(tag),
        className: "px-2 py-1 rounded bg-[#161622] hover:bg-djcyan-500 hover:text-black border border-djzinc-750 text-gray-200 text-[10px] font-bold cursor-pointer transition-all"
      },
      "+ ",
      tag
    )), activeTagTab === "genre" && [
      "Tech House",
      "Afro House",
      "Melodic Techno",
      "Progressive House",
      "Deep House",
      "Minimal / Deep Tech",
      "Hard Techno",
      "Psy-Trance",
      "Drum & Bass",
      "Reggaet\xF3n",
      "Latin House"
    ].map((tag) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: tag,
        type: "button",
        onClick: () => handleAddTagToQuery(tag),
        className: "px-2 py-1 rounded bg-[#161622] hover:bg-djcyan-500 hover:text-black border border-djzinc-750 text-gray-200 text-[10px] font-bold cursor-pointer transition-all"
      },
      "+ ",
      tag
    )), activeTagTab === "version" && [
      "Extended Mix",
      "Intro",
      "Outro",
      "Remix",
      "Club Mix",
      "Acapella",
      "Transition",
      "Mashup"
    ].map((tag) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: tag,
        type: "button",
        onClick: () => handleAddTagToQuery(tag),
        className: "px-2 py-1 rounded bg-[#161622] hover:bg-djcyan-500 hover:text-black border border-djzinc-750 text-gray-200 text-[10px] font-bold cursor-pointer transition-all"
      },
      "+ ",
      tag
    )), activeTagTab === "mood" && [
      "Peak Time",
      "Warm Up",
      "Chill",
      "Sunset",
      "Retro"
    ].map((tag) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: tag,
        type: "button",
        onClick: () => handleAddTagToQuery(tag),
        className: "px-2 py-1 rounded bg-[#161622] hover:bg-djcyan-500 hover:text-black border border-djzinc-750 text-gray-200 text-[10px] font-bold cursor-pointer transition-all"
      },
      "+ ",
      tag
    )))))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-1.5 pt-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-500 mr-1 shrink-0" }, "Sugerencias R\xE1pidas:"), AI_PROMPT_CHIPS.map((chip, cIdx) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: cIdx,
        type: "button",
        onClick: () => {
          setAiQuery(chip.query);
          handleEjecutarBusqueda(chip.query);
        },
        className: `text-[10.5px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${aiQuery === chip.query ? "bg-djcyan-500 text-black border-djcyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)] font-bold" : "bg-djzinc-900/90 text-gray-300 border-djzinc-800 hover:border-djcyan-500/50 hover:text-white"}`
      },
      chip.label
    ))), showAdvancedFilters && /* @__PURE__ */ React.createElement("div", { className: "p-3.5 bg-djzinc-900/90 border border-djzinc-800 rounded-xl grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs font-mono animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 text-[10px]" }, "G\xE9nero Ra\xEDz:"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: selectedGenreFilter,
        onChange: (e) => setSelectedGenreFilter(e.target.value),
        className: "bg-djzinc-950 border border-djzinc-700 rounded px-2 py-1 text-gray-200 outline-none"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todos los G\xE9neros"),
      genresList.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }, g))
    )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 text-[10px]" }, "Versi\xF3n / Edit:"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: selectedVersionFilter,
        onChange: (e) => setSelectedVersionFilter(e.target.value),
        className: "bg-djzinc-950 border border-djzinc-700 rounded px-2 py-1 text-gray-200 outline-none"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todas las Versiones"),
      DJ_VERSIONS_LIST.map((v) => /* @__PURE__ */ React.createElement("option", { key: v, value: v }, v))
    )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 text-[10px]" }, "Rango BPM:"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: selectedBpmFilter,
        onChange: (e) => setSelectedBpmFilter(e.target.value),
        className: "bg-djzinc-950 border border-djzinc-700 rounded px-2 py-1 text-gray-200 outline-none"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Cualquier Tempo"),
      /* @__PURE__ */ React.createElement("option", { value: "<120" }, "< 120 BPM (Previa/Downtempo)"),
      /* @__PURE__ */ React.createElement("option", { value: "120-125" }, "120 - 125 BPM (Afro/Deep)"),
      /* @__PURE__ */ React.createElement("option", { value: "126-129" }, "126 - 129 BPM (Tech House Clave)"),
      /* @__PURE__ */ React.createElement("option", { value: "130-135" }, "130 - 135 BPM (Driving / Techno)"),
      /* @__PURE__ */ React.createElement("option", { value: ">135" }, "> 135 BPM (Peak Time / Trance)")
    )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 text-[10px]" }, "Tonalidad:"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setIsCamelotModalOpen(true),
        className: "text-[9px] text-djcyan-400 hover:underline cursor-pointer"
      },
      "\u{1F3A1} Rueda"
    )), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: selectedKeyFilter,
        onChange: (e) => setSelectedKeyFilter(e.target.value),
        className: "bg-djzinc-950 border border-djzinc-700 rounded px-2 py-1 text-gray-200 outline-none"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Cualquier Tono"),
      Object.keys(CAMELOT_WHEEL_DATA).map((k) => /* @__PURE__ */ React.createElement("option", { key: k, value: k }, k, " (", CAMELOT_WHEEL_DATA[k].classical, ")"))
    )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 text-[10px]" }, "Atm\xF3sfera / Mood:"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: selectedMoodFilter,
        onChange: (e) => setSelectedMoodFilter(e.target.value),
        className: "bg-djzinc-950 border border-djzinc-700 rounded px-2 py-1 text-gray-200 outline-none"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Cualquier Mood"),
      /* @__PURE__ */ React.createElement("option", { value: "Previa / Warm Up" }, "Previa / Warm Up"),
      /* @__PURE__ */ React.createElement("option", { value: "Peak Time / Pista" }, "Peak Time / Pista"),
      /* @__PURE__ */ React.createElement("option", { value: "Chill / Sunset / After" }, "Chill / Sunset / After")
    )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 text-[10px]" }, "\u26A1 Energ\xEDa DJ:"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: taxFilterEnergy,
        onChange: (e) => setTaxFilterEnergy(e.target.value),
        className: "bg-djzinc-950 border border-djzinc-700 rounded px-2 py-1 text-gray-200 outline-none"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Cualquier Nivel"),
      /* @__PURE__ */ React.createElement("option", { value: "HIGH" }, ">80% Alta (Peak Time)"),
      /* @__PURE__ */ React.createElement("option", { value: "MED" }, "65-80% Media (Build-Up)"),
      /* @__PURE__ */ React.createElement("option", { value: "LOW" }, "<65% Baja (Warm Up/Calma)")
    )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 text-[10px]" }, "\u{1F57A} Danceability:"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: taxFilterDance,
        onChange: (e) => setTaxFilterDance(e.target.value),
        className: "bg-djzinc-950 border border-djzinc-700 rounded px-2 py-1 text-gray-200 outline-none"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Cualquier Nivel"),
      /* @__PURE__ */ React.createElement("option", { value: "HIGH" }, ">80% Alta (Club/Groove)"),
      /* @__PURE__ */ React.createElement("option", { value: "MED" }, "65-80% Media"),
      /* @__PURE__ */ React.createElement("option", { value: "LOW" }, "<65% Baja")
    )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col justify-end" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: resetFilters,
        className: "w-full py-1 bg-djzinc-800 hover:bg-djzinc-750 text-gray-300 hover:text-white rounded border border-djzinc-700 text-xs font-bold cursor-pointer transition-colors"
      },
      "\u21BA Reset Filtros"
    )))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-5 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between text-xs font-mono text-gray-400 gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Mostrando "), /* @__PURE__ */ React.createElement("strong", { className: "text-white font-bold" }, searchResults.length), /* @__PURE__ */ React.createElement("span", null, " temas para "), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold" }, aiQuery ? `"${aiQuery}"` : "Exploraci\xF3n Taxon\xF3mica"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 ml-2" }, "(", searchScope === "local" ? "Solo Biblioteca Local" : searchScope === "online" ? "Solo Record Pool Online" : "Biblioteca Local + Record Pool", ")")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        disabled: selectedTaxIds.size === 0,
        onClick: handleAnadirSeleccionadasADescargas,
        className: `px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all ${selectedTaxIds.size > 0 ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)] active:scale-95" : "bg-djzinc-850 text-gray-500 border border-djzinc-750 cursor-not-allowed opacity-40"}`,
        title: "A\xF1adir pistas seleccionadas a la cola de descargas en Spotify Ingest"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4E5}"),
      /* @__PURE__ */ React.createElement("span", null, "A\xF1adir Seleccionadas (", selectedTaxIds.size, ")")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        disabled: searchResults.length === 0,
        onClick: handleAnadirTodasADescargas,
        className: "px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-500 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed",
        title: "A\xF1adir todas las pistas de esta b\xFAsqueda a la cola de descargas en Spotify Ingest"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4E5}"),
      /* @__PURE__ */ React.createElement("span", null, "A\xF1adir Todas (", searchResults.length, ")")
    )), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-djcyan-400" }), /* @__PURE__ */ React.createElement("span", null, "Biblioteca (", localTracks.length + searchLocalResults.length, ")")), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-purple-400" }), /* @__PURE__ */ React.createElement("span", null, "Record Pool Online (", onlineResults.length > 0 ? onlineResults.length : catalogTracks.length, ")")), /* @__PURE__ */ React.createElement("div", { className: "inline-flex rounded-lg border border-djzinc-750 p-0.5 bg-[#050508] ml-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setDisplayMode("table"),
        className: `px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1 ${displayMode === "table" ? "bg-djcyan-500 text-black" : "text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1D11C}"),
      " Tabla"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setDisplayMode("grid"),
        className: `px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1 ${displayMode === "grid" ? "bg-djcyan-500 text-black" : "text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement("span", null, "\u229E"),
      " Mosaico"
    )))), searchResults.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "p-8 border border-dashed border-djzinc-800 rounded-2xl bg-djzinc-900/30 text-center space-y-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-3xl" }, "\u{1F50E}"), /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white" }, "No se encontraron temas coincidentes"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 max-w-md mx-auto" }, 'No hay pistas que cumplan los criterios de "', aiQuery, '". Puedes pulsar ', /* @__PURE__ */ React.createElement("strong", null, "Buscar Temas"), " para rastrear en el Record Pool Online o descargarlas en SuperFLAC / Spotify Ingest."), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-2 pt-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: resetFilters,
        className: "px-3.5 py-1.5 bg-djzinc-800 hover:bg-djzinc-700 text-white rounded-lg text-xs font-bold cursor-pointer"
      },
      "\u21BA Limpiar B\xFAsqueda"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setSearchScope("online");
          handleEjecutarBusqueda();
        },
        className: "px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
      },
      "\u2601\uFE0F Buscar en Record Pool Online"
    ), onSendToSpotify && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => onSendToSpotify(aiQuery),
        className: "px-3.5 py-1.5 bg-djcyan-500 hover:bg-djcyan-400 text-black rounded-lg text-xs font-bold shadow-md cursor-pointer"
      },
      "\u{1F310} Ingestar desde SuperFLAC / Spotify \u2192"
    ))) : displayMode === "table" ? (
      /* VISTA DE TABLA CON ORDENACIÓN Y FILTROS EN CABECERA */
      /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto rounded-xl border border-djzinc-800 bg-[#07070a] shadow-lg" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left border-collapse text-xs whitespace-nowrap" }, /* @__PURE__ */ React.createElement("thead", { className: "sticky top-0 z-10 bg-[#0d0d12] border-b border-djzinc-800 text-[10px] font-mono uppercase text-gray-400" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-3 w-8 text-center" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          checked: allTaxSelected,
          onChange: handleToggleSelectAllTax,
          className: "accent-djcyan-500 cursor-pointer",
          title: "Seleccionar / Deseleccionar todas las pistas"
        }
      )), /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-2 w-10 text-center" }, "PLAY"), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("title"), className: "py-2.5 px-3 min-w-[240px] cursor-pointer hover:text-white transition-colors" }, "T\xCDTULO / \xC1LBUM ", renderSortArrowTax("title")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("artist"), className: "py-2.5 px-3 min-w-[150px] cursor-pointer hover:text-white transition-colors" }, "ARTISTA ", renderSortArrowTax("artist")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("genre"), className: "py-2.5 px-2.5 cursor-pointer hover:text-white transition-colors" }, "G\xC9NERO ", renderSortArrowTax("genre")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("subgenre"), className: "py-2.5 px-2.5 cursor-pointer hover:text-white transition-colors" }, "SUBG\xC9NERO ", renderSortArrowTax("subgenre")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("displayBpm"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, "BPM ", renderSortArrowTax("displayBpm")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("key"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, "KEY ", renderSortArrowTax("key")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("version"), className: "py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors" }, "VERSI\xD3N ", renderSortArrowTax("version")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("origin"), className: "py-2.5 px-2.5 text-center cursor-pointer hover:text-white transition-colors" }, "ORIGEN ", renderSortArrowTax("origin")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("matchScore"), className: "py-2.5 px-2.5 text-center cursor-pointer hover:text-white transition-colors" }, "MATCH % ", renderSortArrowTax("matchScore")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("energy"), className: "py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors" }, "\u26A1 ENERG\xCDA ", renderSortArrowTax("energy")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("danceability"), className: "py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors" }, "\u{1F57A} DANCE ", renderSortArrowTax("danceability")), /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-2 text-center" }, "FASE DJ"), /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-2.5 text-left" }, "COMENTARIO PRO"), /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-3 text-center min-w-[150px]" }, "ACCIONES DJ")), /* @__PURE__ */ React.createElement("tr", { className: "bg-[#050508] border-b border-djzinc-800 text-[10px] lowercase font-sans" }, /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center font-mono text-[9px] text-gray-500" }, taxFilterSearch || taxFilterGenre !== "ALL" || taxFilterOrigin !== "ALL" || taxFilterEnergy !== "ALL" || taxFilterDance !== "ALL" ? /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            setTaxFilterSearch("");
            setTaxFilterGenre("ALL");
            setTaxFilterOrigin("ALL");
            setTaxFilterEnergy("ALL");
            setTaxFilterDance("ALL");
          },
          title: "Limpiar filtros",
          className: "text-amber-400 hover:text-white cursor-pointer"
        },
        "\u2715"
      ) : "filtro"), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          value: taxFilterSearch,
          onChange: (e) => setTaxFilterSearch(e.target.value),
          placeholder: "Filtrar por t\xEDtulo, \xE1lbum o artista...",
          className: "w-full bg-[#111116] border border-djzinc-750 rounded px-1.5 py-0.5 text-[11px] text-gray-200 outline-none focus:border-djcyan-400 font-sans"
        }
      )), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }, /* @__PURE__ */ React.createElement(
        "select",
        {
          value: taxFilterGenre,
          onChange: (e) => setTaxFilterGenre(e.target.value),
          className: "bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
        },
        /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todos"),
        /* @__PURE__ */ React.createElement("option", { value: "Hard Techno" }, "Hard Techno"),
        /* @__PURE__ */ React.createElement("option", { value: "Techno" }, "Techno"),
        /* @__PURE__ */ React.createElement("option", { value: "House" }, "House"),
        /* @__PURE__ */ React.createElement("option", { value: "Trance" }, "Trance"),
        /* @__PURE__ */ React.createElement("option", { value: "Drum & Bass" }, "Drum & Bass"),
        /* @__PURE__ */ React.createElement("option", { value: "Afro House" }, "Afro House")
      )), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center" }, /* @__PURE__ */ React.createElement(
        "select",
        {
          value: taxFilterOrigin,
          onChange: (e) => setTaxFilterOrigin(e.target.value),
          className: "bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
        },
        /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todos"),
        /* @__PURE__ */ React.createElement("option", { value: "local" }, "\u{1F4C1} Local"),
        /* @__PURE__ */ React.createElement("option", { value: "online" }, "\u2601\uFE0F Pool Online")
      )), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center" }, /* @__PURE__ */ React.createElement(
        "select",
        {
          value: taxFilterEnergy,
          onChange: (e) => setTaxFilterEnergy(e.target.value),
          className: "bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
        },
        /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todas"),
        /* @__PURE__ */ React.createElement("option", { value: "HIGH" }, ">80% Alta"),
        /* @__PURE__ */ React.createElement("option", { value: "MED" }, "65-80% Media"),
        /* @__PURE__ */ React.createElement("option", { value: "LOW" }, "<65% Baja")
      )), /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center" }, /* @__PURE__ */ React.createElement(
        "select",
        {
          value: taxFilterDance,
          onChange: (e) => setTaxFilterDance(e.target.value),
          className: "bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
        },
        /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todas"),
        /* @__PURE__ */ React.createElement("option", { value: "HIGH" }, ">80% Alta"),
        /* @__PURE__ */ React.createElement("option", { value: "MED" }, "65-80% Media"),
        /* @__PURE__ */ React.createElement("option", { value: "LOW" }, "<65% Baja")
      )), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-djzinc-850/60 font-sans" }, searchResults.map((trk, idx) => {
        const keyData = CAMELOT_WHEEL_DATA[trk.displayKey] || CAMELOT_WHEEL_DATA["8A"];
        const isLocal = Boolean(trk.isLocal || trk.is_local);
        const isOnline = Boolean(trk.isOnlinePool || trk.is_online);
        const isPlayingRow = nowPlayingTrack && (String(nowPlayingTrack.id) === String(trk.id) || nowPlayingTrack.title && (nowPlayingTrack.title === trk.displayTitle || nowPlayingTrack.title === trk.title) || nowPlayingTrack.path && nowPlayingTrack.path === trk.path) && isPlaying;
        const isSelected = selectedTaxIds.has(trk.id);
        return /* @__PURE__ */ React.createElement(
          "tr",
          {
            key: trk.id || idx,
            className: `hover:bg-[#101016] transition-colors cursor-pointer select-none ${isSelected ? "bg-[#0f172a]/50 border-l-2 border-djcyan-400" : ""}`
          },
          /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-center", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement(
            "input",
            {
              type: "checkbox",
              checked: isSelected,
              onChange: () => handleToggleTaxRow(trk.id),
              className: "accent-djcyan-500 cursor-pointer"
            }
          )),
          /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center", onClick: (e) => {
            e.stopPropagation();
            handleCargarEnDeck(trk);
          } }, /* @__PURE__ */ React.createElement("button", { className: `w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isPlayingRow ? "bg-djcyan-500 text-black font-bold shadow-[0_0_8px_rgba(6,182,212,0.6)]" : "bg-[#181820] text-gray-400 hover:text-white hover:bg-djzinc-800"}` }, isPlayingRow ? "\u275A\u275A" : "\u25B6")),
          /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("img", { src: getValidCover(trk.displayCover), alt: "Cover", onError: (e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_VINYL_SVG;
          }, className: "w-9 h-9 rounded object-cover border border-djzinc-700 shrink-0 shadow-sm" }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-djcyan-400 text-xs truncate max-w-sm", title: trk.displayTitle }, trk.displayTitle), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 font-mono truncate max-w-sm", title: trk.displayAlbum }, trk.displayAlbum || "--")))),
          /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-gray-300 text-xs truncate max-w-xs" }, trk.displayArtist),
          /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2.5 font-mono text-[11px] text-gray-300" }, trk.displayGenre),
          /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2.5 font-mono text-[10px] text-djcyan-400 font-semibold" }, trk.displaySubgenre),
          /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center font-mono text-xs text-white font-bold" }, trk.displayBpm),
          /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement(
            "span",
            {
              className: "px-1.5 py-0.5 rounded font-mono font-bold text-[10px] border cursor-pointer",
              style: { backgroundColor: `${keyData.color}20`, borderColor: `${keyData.color}80`, color: keyData.color },
              onClick: () => setIsCamelotModalOpen(true),
              title: `Key ${trk.displayKey} (${keyData.classical})`
            },
            trk.displayKey
          )),
          /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center font-mono text-[10px] text-gray-400" }, trk.displayVersion || "Original Mix"),
          /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2.5 text-center" }, /* @__PURE__ */ React.createElement("span", { className: `text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${isLocal ? "bg-djcyan-950 text-djcyan-300 border-djcyan-700/60" : isOnline ? "bg-purple-950 text-purple-300 border-purple-700/60" : "bg-emerald-950 text-emerald-300 border-emerald-700/60"}` }, isLocal ? "\u{1F4C1} Local" : isOnline ? "\u2601\uFE0F Record Pool" : "\u{1F31F} BeatWave Pool")),
          /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2.5 text-center font-mono text-xs font-bold text-emerald-400" }, "\u26A1 ", trk.matchScore, "%"),
          /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center gap-0.5 w-16 mx-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between w-full text-[9px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "\u26A1"), /* @__PURE__ */ React.createElement("span", { className: `font-bold ${(trk.energy || trk.e || 80) >= 82 ? "text-red-400" : (trk.energy || trk.e || 80) >= 68 ? "text-amber-400" : "text-djcyan-400"}` }, trk.energy || trk.e || 80, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750" }, /* @__PURE__ */ React.createElement(
            "div",
            {
              className: `h-full rounded-full ${(trk.energy || trk.e || 80) >= 82 ? "bg-gradient-to-r from-amber-500 to-red-500" : (trk.energy || trk.e || 80) >= 68 ? "bg-gradient-to-r from-yellow-400 to-amber-500" : "bg-gradient-to-r from-cyan-400 to-blue-500"}`,
              style: { width: `${Math.min(100, Math.max(10, trk.energy || trk.e || 80))}%` }
            }
          )))),
          /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center gap-0.5 w-16 mx-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between w-full text-[9px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "\u{1F57A}"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-purple-300" }, trk.danceability || trk.dance || 80, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750" }, /* @__PURE__ */ React.createElement(
            "div",
            {
              className: "h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500",
              style: { width: `${Math.min(100, Math.max(10, trk.danceability || trk.dance || 80))}%` }
            }
          )))),
          /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, (() => {
            const eVal = trk.energy || trk.e || 80;
            const bVal = parseFloat(trk.displayBpm || trk.bpm || 128);
            const badge = trk.fase_badge || (eVal >= 82 || bVal >= 135 ? "CA\xD1A" : eVal >= 68 ? "BUILD-UP" : bVal < 118 ? "CALMA" : "WARM-UP");
            const colorMap = {
              "CA\xD1A": "bg-red-950/80 text-red-300 border-red-700 shadow-[0_0_8px_rgba(239,68,68,0.3)]",
              "BUILD-UP": "bg-amber-950/80 text-amber-300 border-amber-700",
              "WARM-UP": "bg-cyan-950/80 text-cyan-300 border-cyan-700",
              "CIERRE": "bg-purple-950/80 text-purple-300 border-purple-700",
              "CALMA": "bg-teal-950/80 text-teal-300 border-teal-700"
            };
            const iconMap = {
              "CA\xD1A": "\u{1F525}",
              "BUILD-UP": "\u{1F680}",
              "WARM-UP": "\u{1F3A7}",
              "CIERRE": "\u{1F30C}",
              "CALMA": "\u2615"
            };
            return /* @__PURE__ */ React.createElement("span", { className: `px-2 py-0.5 rounded text-[9px] font-mono font-bold border inline-flex items-center gap-1 ${colorMap[badge] || "bg-djzinc-800 text-gray-300 border-djzinc-700"}` }, /* @__PURE__ */ React.createElement("span", null, iconMap[badge] || "\u{1F3B5}"), /* @__PURE__ */ React.createElement("span", null, badge));
          })()),
          /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2.5 text-left" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 max-w-[210px]" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-400 truncate", title: trk.comment || `[${trk.displayBpm} BPM | ${trk.displayKey}] Intro 32b \u2022 Drop contundente \u2022 Outro 64b` }, trk.comment || `[${trk.displayBpm} BPM | ${trk.displayKey}] Intro 32b \u2022 Drop contundente \u2022 Outro 64b`))),
          /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-1.5" }, /* @__PURE__ */ React.createElement("button", { onClick: () => handleCargarEnDeck(trk), className: "px-2 py-1 rounded bg-djcyan-500 hover:bg-djcyan-400 text-black font-bold text-[10px] font-mono cursor-pointer", title: "Cargar y Reproducir en Deck 1" }, "\u25B6 Deck"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleAbrirEnHotCues(trk), className: "px-2 py-1 rounded bg-djzinc-850 hover:bg-djzinc-750 text-gray-200 border border-djzinc-700 text-[10px] font-mono cursor-pointer", title: "Hot Cues Studio" }, "\u{1F39B}\uFE0F"), /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => handleAnadirADescargas(trk),
              className: "px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-[10px] cursor-pointer shadow flex items-center gap-1 transition-all active:scale-95",
              title: "A\xF1adir pista a la cola de descargas en Spotify Ingest"
            },
            /* @__PURE__ */ React.createElement("span", null, "\u{1F4E5}"),
            /* @__PURE__ */ React.createElement("span", null, "A\xF1adir a Descargas")
          ), isOnline ? /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => {
                if (onSendToSpotify) onSendToSpotify(`${trk.displayArtist} - ${trk.displayTitle}`);
                else if (onNavigateTab) onNavigateTab("spotify");
              },
              className: "px-2 py-1 rounded bg-purple-950 hover:bg-purple-900 border border-purple-600 text-purple-300 text-[10px] font-mono cursor-pointer",
              title: "Buscar en Spotify Ingest"
            },
            "\u{1F50D} Spotify"
          ) : /* @__PURE__ */ React.createElement("button", { onClick: () => handleAsignarACrateIndividual(trk), className: "px-2 py-1 rounded bg-purple-950 hover:bg-purple-900 border border-purple-600 text-purple-300 text-[10px] font-mono cursor-pointer", title: "Rutar a Crate" }, "\u{1F4C1} Crate")))
        );
      }))))
    ) : (
      /* VISTA DE MOSAICO / TARJETAS */
      /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5" }, searchResults.map((trk, idx) => {
        const keyData = CAMELOT_WHEEL_DATA[trk.displayKey] || CAMELOT_WHEEL_DATA["8A"];
        const isLocal = Boolean(trk.isLocal || trk.is_local);
        const isOnline = Boolean(trk.isOnlinePool || trk.is_online);
        const isSelected = selectedTaxIds.has(trk.id);
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: trk.id || idx,
            className: `p-3.5 bg-[#0a0a0f] rounded-xl border transition-all shadow-md hover:shadow-cyan-500/10 flex flex-col justify-between gap-3 group ${isSelected ? "border-djcyan-400 bg-djcyan-950/20" : "border-djzinc-850 hover:border-djcyan-500/50"}`
          },
          /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-djzinc-800 shadow" }, /* @__PURE__ */ React.createElement(
            "img",
            {
              src: getValidCover(trk.displayCover),
              alt: "Cover",
              onError: (e) => {
                e.target.onerror = null;
                e.target.src = DEFAULT_VINYL_SVG;
              },
              className: "w-full h-full object-cover"
            }
          ), /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: () => handleCargarEnDeck(trk),
              className: "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-base transition-opacity cursor-pointer shadow",
              title: "Cargar y Reproducir en Deck 1"
            },
            isPlaying && nowPlayingTrack && (String(nowPlayingTrack.id) === String(trk.id) || nowPlayingTrack.path && nowPlayingTrack.path === trk.path || nowPlayingTrack.title && (nowPlayingTrack.title === trk.displayTitle || nowPlayingTrack.title === trk.title)) ? "\u275A\u275A" : "\u25B6"
          )), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
            "input",
            {
              type: "checkbox",
              checked: isSelected,
              onChange: () => handleToggleTaxRow(trk.id),
              className: "accent-djcyan-500 cursor-pointer",
              title: "Marcar pista"
            }
          ), /* @__PURE__ */ React.createElement("span", { className: `text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${isLocal ? "bg-djcyan-950 text-djcyan-300 border-djcyan-700/60" : isOnline ? "bg-purple-950 text-purple-300 border-purple-700/60" : "bg-emerald-950 text-emerald-300 border-emerald-700/60"}` }, isLocal ? "\u{1F4C1} Local" : isOnline ? "\u2601\uFE0F Online Pool" : "\u{1F31F} BeatWave Pool")), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-1.5 py-0.2 rounded shadow-sm" }, "\u26A1 ", trk.matchScore, "% Match")), /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-bold text-white truncate mt-1", title: trk.displayTitle }, trk.displayTitle), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-djcyan-400 truncate", title: trk.displayArtist }, trk.displayArtist))),
          /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-1.5 font-mono text-[9.5px]" }, /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded bg-djzinc-900 border border-djzinc-750 text-gray-300 font-semibold" }, "\u{1F3A7} ", trk.displaySubgenre || trk.displayGenre), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded bg-djzinc-900 border border-djzinc-750 text-djcyan-300 font-bold" }, "\u{1F39A}\uFE0F ", trk.displayBpm, " BPM"), /* @__PURE__ */ React.createElement(
            "span",
            {
              className: "px-2 py-0.5 rounded border font-black flex items-center gap-1 cursor-pointer hover:brightness-125",
              style: {
                backgroundColor: `${keyData.color}20`,
                borderColor: `${keyData.color}80`,
                color: keyData.color
              },
              onClick: () => setIsCamelotModalOpen(true),
              title: `Key ${trk.displayKey} (${keyData.classical}). Click para ver Rueda Arm\xF3nica`
            },
            /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full", style: { backgroundColor: keyData.color } }),
            /* @__PURE__ */ React.createElement("span", null, trk.displayKey)
          ), trk.displayVersion && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-600/50 text-amber-300" }, "\u{1F39B}\uFE0F ", trk.displayVersion), trk.displayMood && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded bg-pink-950/40 border border-pink-600/50 text-pink-300" }, "\u{1F525} ", trk.displayMood)),
          /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-djzinc-850 flex items-center justify-between gap-1.5" }, /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: () => handleCargarEnDeck(trk),
              className: "flex-1 py-1 px-2 rounded bg-djcyan-500 hover:bg-djcyan-400 text-black font-bold text-[10px] font-mono flex items-center justify-center gap-1 shadow cursor-pointer transition-transform active:scale-95"
            },
            /* @__PURE__ */ React.createElement("span", null, "\u25B6"),
            /* @__PURE__ */ React.createElement("span", null, "Cargar Deck")
          ), /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: () => handleAbrirEnHotCues(trk),
              className: "py-1 px-2 rounded bg-djzinc-900 hover:bg-djzinc-800 border border-djzinc-750 text-gray-200 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors",
              title: "Editar Hot Cues en el Estudio"
            },
            /* @__PURE__ */ React.createElement("span", null, "\u{1F39B}\uFE0F"),
            /* @__PURE__ */ React.createElement("span", null, "Cues")
          ), /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: () => handleAnadirADescargas(trk),
              className: "py-1 px-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow",
              title: "A\xF1adir a la cola de descargas en Spotify Ingest"
            },
            /* @__PURE__ */ React.createElement("span", null, "\u{1F4E5}"),
            /* @__PURE__ */ React.createElement("span", null, "A\xF1adir a Descargas")
          ), /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: () => handleApuntarEnLibreta(trk),
              className: "py-1 px-2 rounded bg-djzinc-900 hover:bg-djzinc-800 border border-djzinc-750 text-gray-200 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors",
              title: "Apuntar en Libreta Digital"
            },
            /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}")
          ), isOnline ? /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: () => {
                if (onSendToSpotify) onSendToSpotify(`${trk.displayArtist} - ${trk.displayTitle}`);
                else if (onNavigateTab) onNavigateTab("spotify");
              },
              className: "py-1 px-2 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-500/70 text-purple-300 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors shadow",
              title: "Descargar versi\xF3n HQ/FLAC en SuperFLAC / Spotify Ingest"
            },
            /* @__PURE__ */ React.createElement("span", null, "\u{1F4E5}"),
            /* @__PURE__ */ React.createElement("span", null, "SuperFLAC")
          ) : /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: () => handleAsignarACrateIndividual(trk),
              className: "py-1 px-2 rounded bg-purple-950/60 hover:bg-purple-900 border border-purple-500/60 text-purple-300 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors",
              title: "Rutar f\xEDsicamente a Serato Crate"
            },
            /* @__PURE__ */ React.createElement("span", null, "\u{1F4C1}")
          ))
        );
      }))
    ), /* @__PURE__ */ React.createElement("div", { className: "p-4 bg-gradient-to-r from-djzinc-900 via-djzinc-900 to-djcyan-950/40 border border-djzinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, "\u{1F310}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-bold text-white uppercase tracking-wider font-mono" }, "\xBFBuscas canciones que no est\xE1n en tu biblioteca local?"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-gray-400" }, "Explora y descarga temas por taxonom\xEDa en SuperFLAC / Spotify Ingest con car\xE1tula en alta definici\xF3n y tags autom\xE1ticos."))), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          if (onSendToSpotify) onSendToSpotify(aiQuery || "Tech House 2024");
          else if (onNavigateTab) onNavigateTab("spotify");
        },
        className: "px-3.5 py-2 bg-djcyan-500 hover:bg-djcyan-400 text-black font-bold text-xs rounded-lg shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
      },
      "Ingestar en Spotify / SuperFLAC \u2192"
    )))), activeSubView === "routing" && /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "p-5 border-b border-djzinc-800 bg-djzinc-950 shrink-0 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col lg:flex-row lg:items-center justify-between gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-djcyan-400 shadow-[0_0_8px_#06b6d4]" }), /* @__PURE__ */ React.createElement("h3", { className: "text-base font-black text-white uppercase tracking-wider font-mono" }, "Ruteo F\xEDsico de Biblioteca a Crates Serato / Rekordbox"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-djcyan-950 text-djcyan-300 border border-djcyan-700/60 px-2 py-0.5 rounded font-mono font-bold" }, "2-TIER CRATES")), /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 text-xs" }, "Clasificaci\xF3n jer\xE1rquica en dos niveles (G\xE9nero Ra\xEDz \u27A1 Subg\xE9nero Estilo) con ruteo f\xEDsico a carpetas y crates de Serato DJ Pro y Rekordbox.")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2 shrink-0" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        disabled: isRouting || tracks.length === 0,
        onClick: handleExportarSeratoCrates,
        className: `px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${isRouting || tracks.length === 0 ? "bg-djzinc-900 border-djzinc-800 text-gray-500 cursor-not-allowed opacity-60" : "bg-purple-950/60 hover:bg-purple-900 border-purple-500/60 text-purple-300 shadow hover:shadow-purple-500/20 active:scale-95"}`,
        title: "Exporta archivos .crate oficiales a ~/Music/_Serato_/Subcrates para importaci\xF3n instant\xE1nea en Serato DJ Pro"
      },
      "\u{1F4BD} Exportar Serato (.crate)"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        disabled: isRouting || tracks.length === 0,
        onClick: handleExportarRekordboxXml,
        className: `px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${isRouting || tracks.length === 0 ? "bg-djzinc-900 border-djzinc-800 text-gray-500 cursor-not-allowed opacity-60" : "bg-blue-950/60 hover:bg-blue-900 border-blue-500/60 text-blue-300 shadow hover:shadow-blue-500/20 active:scale-95"}`,
        title: "Genera archivo rekordbox.xml est\xE1ndar Pioneer DJ con Hot Cues y playlists"
      },
      "\u{1F4CB} Exportar Rekordbox XML"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        disabled: isRouting || tracks.length === 0,
        onClick: handleOrganizarLote,
        className: `px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all ${isRouting || tracks.length === 0 ? "bg-djzinc-800 text-gray-500 border border-djzinc-700 cursor-not-allowed opacity-60" : "bg-djcyan-500 hover:bg-djcyan-400 text-black shadow-djcyan-500/25 active:scale-95"}`
      },
      /* @__PURE__ */ React.createElement(Icons.Routing, null),
      isRouting ? "Ruteando a Crates..." : `Enrutar Biblioteca (${tracks.length})`
    ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-djzinc-900/90 border border-djzinc-800 p-3 rounded-xl" }, /* @__PURE__ */ React.createElement("div", { className: "md:col-span-7 flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono font-bold text-gray-400 shrink-0" }, "\u{1F4C1} Destino Crates:"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: rutaBase,
        onChange: (e) => setRutaBase(e.target.value),
        className: "flex-1 bg-djzinc-950 border border-djzinc-700 rounded px-2.5 py-1.5 text-xs font-mono text-gray-200 outline-none focus:border-djcyan-500",
        placeholder: "/Users/admin/Music/mi musica"
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleSeleccionarDestino,
        className: "px-2.5 py-1.5 bg-djzinc-800 hover:bg-djzinc-700 border border-djzinc-600 rounded text-xs font-semibold text-gray-300 cursor-pointer"
      },
      "Examinar..."
    )), /* @__PURE__ */ React.createElement("div", { className: "md:col-span-3 flex items-center gap-2 justify-start md:justify-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-gray-400" }, "Modo:"), /* @__PURE__ */ React.createElement("div", { className: "inline-flex rounded-lg border border-djzinc-700 p-0.5 bg-djzinc-950" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setModo("copy"),
        className: `px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer transition-colors ${modo === "copy" ? "bg-djcyan-500 text-black shadow" : "text-gray-400 hover:text-white"}`,
        title: "Copia los archivos sin borrar los originales"
      },
      "Copiar (Seguro)"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setModo("move"),
        className: `px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer transition-colors ${modo === "move" ? "bg-amber-500 text-black shadow" : "text-gray-400 hover:text-white"}`,
        title: "Mueve los archivos directamente a las carpetas destino"
      },
      "Mover"
    ))), /* @__PURE__ */ React.createElement("div", { className: "md:col-span-2 flex items-center" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: searchTerm,
        onChange: (e) => setSearchTerm(e.target.value),
        placeholder: "Filtrar crate...",
        className: "w-full bg-djzinc-950 border border-djzinc-700 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-djcyan-500"
      }
    ))), isRouting && /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-djzinc-900 border border-djcyan-700/60 rounded-xl space-y-1.5 animate-pulse" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-xs font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold" }, routeStatusMsg || "Procesando ruteo de lote..."), /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold" }, routeProgress, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full h-2 bg-djzinc-950 rounded-full overflow-hidden border border-djzinc-800" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "h-full bg-gradient-to-r from-djcyan-500 to-emerald-400 transition-all duration-200",
        style: { width: `${routeProgress}%` }
      }
    ))), resultSummary && /* @__PURE__ */ React.createElement("div", { className: `p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${resultSummary.status === "ok" ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300" : "bg-red-950/40 border-red-500/50 text-red-300"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", null, resultSummary.status === "ok" ? "\u2713" : "\u26A0"), /* @__PURE__ */ React.createElement("span", null, resultSummary.status === "ok" ? `Ruteo completado con \xE9xito: ${resultSummary.procesados} pistas procesadas (${resultSummary.errores} errores) hacia ${rutaBase}.` : resultSummary.msg || "Fallo durante el ruteo de lote.")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setResultSummary(null),
        className: "text-gray-400 hover:text-white cursor-pointer px-2 py-0.5 rounded"
      },
      "\u2715"
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/60 border border-djzinc-800 p-2.5 rounded-lg flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-gray-400" }, "Pistas en Sesi\xF3n"), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-black text-white font-mono" }, tracks.length)), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/60 border border-djzinc-800 p-2.5 rounded-lg flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-gray-400" }, "G\xE9neros Ra\xEDz"), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-black text-djcyan-400 font-mono" }, genresList.length)), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/60 border border-djzinc-800 p-2.5 rounded-lg flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-gray-400" }, "Crates / Subg\xE9neros"), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-black text-purple-400 font-mono" }, totalCratesCount)), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/60 border border-djzinc-800 p-2.5 rounded-lg flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-gray-400" }, "Estructura Serato"), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-bold text-emerald-400 font-mono" }, "/[G\xE9nero]/[Subg\xE9nero]/")))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-5 space-y-4" }, tracks.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "h-64 border-2 border-dashed border-djzinc-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-djzinc-900/20" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-full bg-djzinc-800 flex items-center justify-center text-djcyan-400 mb-3 shadow-inner" }, /* @__PURE__ */ React.createElement(Icons.Routing, null)), /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-gray-200 mb-1" }, "No hay pistas cargadas en la Auditor\xEDa"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 max-w-md mb-4" }, "Carga una carpeta en la pesta\xF1a ", /* @__PURE__ */ React.createElement("strong", null, "Auditor\xEDa & DSP"), " para ver el desglose en tiempo real de pistas asignadas a cada Crate y ejecutar el ruteo f\xEDsico inteligente."), onNavigateTab && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => onNavigateTab("audit"),
        className: "px-3.5 py-1.5 bg-djcyan-500 hover:bg-djcyan-400 text-black text-xs font-bold rounded-lg cursor-pointer transition-colors shadow"
      },
      "Ir a Auditor\xEDa & DSP"
    )) : /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, filteredGenres.map((genre) => {
      const subgenres = TAXONOMY_TREE[genre] || [];
      const genreTracksCount = getGenreStats(genre);
      const isExpanded = expandedGenre === genre;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: genre,
          className: "bg-djzinc-900/80 border border-djzinc-800 rounded-xl overflow-hidden shadow-md transition-all hover:border-djzinc-700"
        },
        /* @__PURE__ */ React.createElement(
          "div",
          {
            onClick: () => setExpandedGenre(isExpanded ? null : genre),
            className: "p-3.5 bg-djzinc-900 flex items-center justify-between cursor-pointer hover:bg-djzinc-850 select-none border-b border-djzinc-800/60"
          },
          /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-500 font-mono" }, isExpanded ? "\u25BC" : "\u25B6"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-black text-white uppercase tracking-wider font-mono" }, genre), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 ml-2 font-mono" }, "(", subgenres.length, " subg\xE9neros)"))),
          /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: `text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${genreTracksCount > 0 ? "bg-djcyan-950 text-djcyan-400 border border-djcyan-700/60 shadow-[0_0_8px_rgba(6,182,212,0.2)]" : "bg-djzinc-800 text-gray-500 border border-djzinc-700"}` }, genreTracksCount, " pistas"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-xs font-mono" }, "\u{1F4C1} /", genre, "/"))
        ),
        isExpanded && /* @__PURE__ */ React.createElement("div", { className: "p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-djzinc-950/40" }, subgenres.map((subg) => {
          const matchingTracks = getSubgenreStats(genre, subg);
          const isFilterSelected = selectedSubgenreFilter === `${genre}__${subg}`;
          return /* @__PURE__ */ React.createElement(
            "div",
            {
              key: subg,
              className: `p-3 rounded-lg border transition-all ${isFilterSelected ? "bg-djcyan-950/30 border-djcyan-500 shadow-[0_0_12px_rgba(6,182,212,0.15)]" : "bg-djzinc-900 border-djzinc-800 hover:border-djzinc-700"}`
            },
            /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-2 mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-xs text-gray-200" }, subg), /* @__PURE__ */ React.createElement("span", { className: `text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0 ${matchingTracks.length > 0 ? "bg-djcyan-500 text-black" : "bg-djzinc-800 text-gray-500"}` }, matchingTracks.length)),
            /* @__PURE__ */ React.createElement("div", { className: "text-[10px] font-mono text-gray-400 truncate mb-2", title: `${rutaBase}/${genre}/${subg}/` }, "\u{1F4C1} /", genre, "/", subg, "/"),
            matchingTracks.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-djzinc-800/80 space-y-1" }, /* @__PURE__ */ React.createElement(
              "button",
              {
                type: "button",
                onClick: () => setSelectedSubgenreFilter(isFilterSelected ? null : `${genre}__${subg}`),
                className: "text-[10px] text-djcyan-400 hover:text-djcyan-300 font-semibold cursor-pointer underline flex items-center gap-1"
              },
              isFilterSelected ? "Ocultar pistas" : `Ver ${matchingTracks.length} pistas`
            ), isFilterSelected && /* @__PURE__ */ React.createElement("div", { className: "mt-2 max-h-36 overflow-y-auto space-y-1 pr-1 font-mono text-[9.5px]" }, matchingTracks.map((tr, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "p-1 rounded bg-djzinc-950 border border-djzinc-800/80 truncate text-gray-300" }, /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold" }, tr.t || tr.title), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, " - ", tr.a || tr.artist), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 ml-1" }, "(", tr.b || tr.bpm || "--", " BPM)"))))) : /* @__PURE__ */ React.createElement("div", { className: "text-[9.5px] text-gray-400 italic" }, "Sin pistas asignadas")
          );
        }))
      );
    })))), /* @__PURE__ */ React.createElement(
      CamelotWheelModal,
      {
        isOpen: isCamelotModalOpen,
        onClose: () => setIsCamelotModalOpen(false),
        currentKey: selectedKeyFilter !== "ALL" ? selectedKeyFilter : "8A",
        onSelectKey: (k) => {
          setSelectedKeyFilter(k);
          setIsCamelotModalOpen(false);
        }
      }
    ));
  };
  var ShazamWorkspace = ({ onSendToSpotify, onSendToAudit, onNavigateTab }) => {
    const [isListening, setIsListening] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    const [identifiedTrack, setIdentifiedTrack] = useState(null);
    const [history, setHistory] = useState([]);
    const [previewPlaying, setPreviewPlaying] = useState(false);
    const [micLevel, setMicLevel] = useState(0);
    const audioRef = useRef(new Audio());
    const mediaRecorderRef = useRef(null);
    const audioStreamRef = useRef(null);
    const fileInputRef = useRef(null);
    const timerRef = useRef(null);
    const animFrameRef = useRef(null);
    const audioCtxRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const [selectedEngine, setSelectedEngine] = useState(() => {
      try {
        return localStorage.getItem("bw_radar_engine") || "hybrid";
      } catch (e) {
        return "hybrid";
      }
    });
    const [auddToken, setAuddToken] = useState(() => {
      try {
        return localStorage.getItem("bw_audd_token") || "";
      } catch (e) {
        return "";
      }
    });
    const [showConfig, setShowConfig] = useState(false);
    useEffect(() => {
      try {
        localStorage.setItem("bw_radar_engine", selectedEngine);
      } catch (e) {
      }
    }, [selectedEngine]);
    useEffect(() => {
      try {
        localStorage.setItem("bw_audd_token", auddToken);
      } catch (e) {
      }
    }, [auddToken]);
    const [notebookTracks, setNotebookTracks] = useState(() => {
      try {
        const saved = localStorage.getItem("beatwave_shazam_notebook");
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    });
    const [notebookFeedback, setNotebookFeedback] = useState("");
    useEffect(() => {
      try {
        localStorage.setItem("beatwave_shazam_notebook", JSON.stringify(notebookTracks));
      } catch (e) {
      }
    }, [notebookTracks]);
    const handleApuntarEnLista = (trk) => {
      const trackToAdd = trk || identifiedTrack;
      if (!trackToAdd) return;
      const exists = notebookTracks.some((t) => t.title === trackToAdd.title && t.artist === trackToAdd.artist);
      if (!exists) {
        const now = /* @__PURE__ */ new Date();
        const dateStr = now.toLocaleDateString() + " " + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const item = {
          ...trackToAdd,
          notebook_id: Date.now(),
          added_at: dateStr
        };
        setNotebookTracks((prev) => [item, ...prev]);
        setNotebookFeedback(`\u2713 "${trackToAdd.title}" apuntado en tu libreta digital.`);
        setTimeout(() => setNotebookFeedback(""), 3500);
      } else {
        setNotebookFeedback(`\u2139 "${trackToAdd.title}" ya estaba en la libreta.`);
        setTimeout(() => setNotebookFeedback(""), 3e3);
      }
    };
    const handleDescartarDeteccion = () => {
      if (previewPlaying) {
        audioRef.current.pause();
        setPreviewPlaying(false);
      }
      setIdentifiedTrack(null);
      setStatusMsg("Detecci\xF3n descartada. Listo para una nueva captura.");
      setTimeout(() => setStatusMsg(""), 2500);
    };
    const handleEliminarDeNotebook = (notebookId) => {
      setNotebookTracks((prev) => prev.filter((t) => t.notebook_id !== notebookId));
    };
    const handleVaciarNotebook = () => {
      if (window.confirm("\xBFSeguro que deseas vaciar todas las pistas de tu libreta de apuntes?")) {
        setNotebookTracks([]);
        setNotebookFeedback("Libreta de apuntes vaciada.");
        setTimeout(() => setNotebookFeedback(""), 2500);
      }
    };
    const handleExportarNotebookXLS = async () => {
      if (notebookTracks.length === 0) {
        alert("No hay pistas en la libreta para exportar.");
        return;
      }
      if (window.eel && window.eel.exportar_apuntes_shazam) {
        try {
          const res = await window.eel.exportar_apuntes_shazam(notebookTracks, "xls")();
          if (res && res.status === "ok") {
            setNotebookFeedback(`\u2713 Archivo Excel generado: ${res.filename}`);
            setTimeout(() => setNotebookFeedback(""), 4e3);
          }
        } catch (e) {
          console.error("Fallo exportando a disco:", e);
        }
      }
      const headers = ["#", "Artista", "T\xEDtulo", "\xC1lbum", "G\xE9nero", "A\xF1o", "ISRC", "Fecha de Apunte"];
      const rows = notebookTracks.map((t, idx) => [
        idx + 1,
        `"${(t.artist || "").replace(/"/g, '""')}"`,
        `"${(t.title || "").replace(/"/g, '""')}"`,
        `"${(t.album || "").replace(/"/g, '""')}"`,
        `"${(t.genre || "").replace(/"/g, '""')}"`,
        `"${(t.year || "").replace(/"/g, '""')}"`,
        `"${(t.isrc || "").replace(/"/g, '""')}"`,
        `"${(t.added_at || "").replace(/"/g, '""')}"`
      ]);
      const csvContent = "\uFEFF" + [headers.join("	"), ...rows.map((r) => r.join("	"))].join("\n");
      const blob = new Blob([csvContent], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BeatWave_Shazam_Apuntes_${Date.now()}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };
    const handleExportarNotebookTXT = async () => {
      if (notebookTracks.length === 0) {
        alert("No hay pistas en la libreta para exportar.");
        return;
      }
      if (window.eel && window.eel.exportar_apuntes_shazam) {
        try {
          const res = await window.eel.exportar_apuntes_shazam(notebookTracks, "txt")();
          if (res && res.status === "ok") {
            setNotebookFeedback(`\u2713 Archivo TXT guardado: ${res.filename}`);
            setTimeout(() => setNotebookFeedback(""), 4e3);
          }
        } catch (e) {
        }
      }
      let txt = "====================================================\n";
      txt += "BEATWAVE PRO \u2022 LIBRETA DIGITAL DE APUNTES SHAZAM\n";
      txt += `Fecha: ${(/* @__PURE__ */ new Date()).toLocaleString()}
`;
      txt += `Total pistas: ${notebookTracks.length}
`;
      txt += "====================================================\n\n";
      notebookTracks.forEach((t, i) => {
        txt += `${String(i + 1).padStart(2, "0")}. ${t.artist} - ${t.title} [${t.album || ""} ${t.year || ""}] \u2022 ${t.genre || "Electronic"}${t.isrc ? ` (ISRC: ${t.isrc})` : ""}
`;
      });
      const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BeatWave_Shazam_Tracklist_${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };
    useEffect(() => {
      const audio = audioRef.current;
      const handleEnded = () => setPreviewPlaying(false);
      const handlePause = () => setPreviewPlaying(false);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("pause", handlePause);
      return () => {
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("pause", handlePause);
        audio.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        if (audioCtxRef.current) {
          try {
            audioCtxRef.current.close();
          } catch (e) {
          }
          audioCtxRef.current = null;
        }
        if (audioStreamRef.current) {
          try {
            audioStreamRef.current.getTracks().forEach((t) => t.stop());
          } catch (e) {
          }
          audioStreamRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          try {
            mediaRecorderRef.current.stop();
          } catch (e) {
          }
        }
      };
    }, []);
    const togglePlayPreview = (url) => {
      if (!url) return;
      const audio = audioRef.current;
      if (previewPlaying && audio.src === url) {
        audio.pause();
        setPreviewPlaying(false);
      } else {
        audio.src = url;
        audio.play().then(() => setPreviewPlaying(true)).catch((e) => console.error("Error reproduciendo preview:", e));
      }
    };
    const cancelListening = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch (e) {
        }
        audioCtxRef.current = null;
      }
      if (audioStreamRef.current) {
        try {
          audioStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch (e) {
        }
        audioStreamRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
        }
      }
      setIsListening(false);
      setIsAnalyzing(false);
      setMicLevel(0);
      setStatusMsg("Escucha cancelada. Listo para una nueva consulta.");
      setTimeout(() => setStatusMsg(""), 3e3);
    };
    const stopMicrophoneListeningEarly = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
    const executeRecognition = async (base64Data, filename) => {
      setIsAnalyzing(true);
      const engineLabel = selectedEngine === "hybrid" ? "Modo H\xEDbrido" : selectedEngine === "audd" ? "AudD API" : "ShazamIO Smart";
      setStatusMsg(`Consultando huella ac\xFAstica en [${engineLabel}]...`);
      try {
        let res = null;
        try {
          const response = await fetch("/api/identificar_audio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audio_b64: base64Data,
              motor: selectedEngine,
              audd_token: auddToken,
              filename
            })
          });
          if (response.ok) {
            res = await response.json();
          }
        } catch (httpErr) {
          console.warn("HTTP /api/identificar_audio fall\xF3, recurriendo a Eel:", httpErr);
        }
        if (!res && window.eel && window.eel.identificar_audio_base64) {
          try {
            res = await window.eel.identificar_audio_base64(base64Data, selectedEngine, auddToken, filename)();
          } catch (eelErr) {
            console.warn("Eel RPC tambi\xE9n fall\xF3:", eelErr);
          }
        }
        handleRecognitionResponse(res);
      } catch (err) {
        console.error("Error en reconocimiento ac\xFAstico:", err);
        setStatusMsg("Error de comunicaci\xF3n con el motor de reconocimiento ac\xFAstico: " + (err.message || String(err)));
        setIsAnalyzing(false);
      }
    };
    const startMicrophoneListening = async () => {
      if (isListening || isAnalyzing) return;
      cancelListening();
      setStatusMsg("Solicitando acceso al micr\xF3fono...");
      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              channelCount: 2,
              sampleRate: 44100
            }
          });
        } catch (errStrict) {
          console.warn("Fallback a getUserMedia b\xE1sico:", errStrict);
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        audioStreamRef.current = stream;
        setIsListening(true);
        setCountdown(10);
        setStatusMsg("Escuchando audio ambiental (10s)...");
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioCtxRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateMeter = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setMicLevel(Math.min(100, Math.round(avg / 128 * 100)));
            animFrameRef.current = requestAnimationFrame(updateMeter);
          };
          updateMeter();
        } catch (e) {
          console.warn("Web Audio VU meter no disponible:", e);
        }
        let recorderOptions = { audioBitsPerSecond: 128e3 };
        let selectedMime = "audio/webm";
        if (typeof MediaRecorder.isTypeSupported === "function") {
          if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
            selectedMime = "audio/webm;codecs=opus";
          } else if (MediaRecorder.isTypeSupported("audio/webm")) {
            selectedMime = "audio/webm";
          } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
            selectedMime = "audio/mp4";
          } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
            selectedMime = "audio/ogg";
          }
        }
        try {
          recorderOptions.mimeType = selectedMime;
        } catch (e) {
          console.warn("No se pudo fijar mimeType estricto:", e);
        }
        const mediaRecorder = new MediaRecorder(stream, recorderOptions);
        mediaRecorderRef.current = mediaRecorder;
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        mediaRecorder.onstop = async () => {
          if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
          }
          if (audioCtxRef.current) {
            try {
              audioCtxRef.current.close();
            } catch (e) {
            }
            audioCtxRef.current = null;
          }
          setMicLevel(0);
          if (audioStreamRef.current) {
            try {
              audioStreamRef.current.getTracks().forEach((t) => t.stop());
            } catch (e) {
            }
            audioStreamRef.current = null;
          }
          setIsListening(false);
          if (chunks.length === 0) {
            setStatusMsg("El micr\xF3fono no captur\xF3 se\xF1al de audio. Verifica los permisos del navegador.");
            return;
          }
          const actualMime = chunks[0]?.type || selectedMime || "audio/webm";
          const ext = actualMime.includes("mp4") ? "m4a" : actualMime.includes("ogg") ? "ogg" : "webm";
          const audioBlob = new Blob(chunks, { type: actualMime });
          const reader = new FileReader();
          reader.onloadend = () => {
            executeRecognition(reader.result, `mic_sample.${ext}`);
          };
          reader.readAsDataURL(audioBlob);
        };
        mediaRecorder.start(1e3);
        let timeLeft = 10;
        timerRef.current = setInterval(() => {
          timeLeft -= 1;
          setCountdown(timeLeft);
          if (timeLeft <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            if (mediaRecorder.state !== "inactive") {
              mediaRecorder.stop();
            }
          }
        }, 1e3);
      } catch (err) {
        console.error("Error acceso micr\xF3fono:", err);
        setStatusMsg("No se pudo acceder al micr\xF3fono: " + (err.message || "Permiso denegado"));
        setIsListening(false);
      }
    };
    const handleFileSelect = (file) => {
      if (!file) return;
      setIsAnalyzing(true);
      setStatusMsg(`Leyendo "${file.name}"...`);
      const fileToRead = file.size > 8 * 1024 * 1024 ? file.slice(0, 8 * 1024 * 1024) : file;
      const reader = new FileReader();
      reader.onloadend = () => {
        executeRecognition(reader.result, file.name);
      };
      reader.readAsDataURL(fileToRead);
    };
    const handleRecognitionResponse = (res) => {
      setIsAnalyzing(false);
      if (res && res.status === "ok") {
        const engineTag = res.motor_usado ? ` [v\xEDa ${res.motor_usado}]` : "";
        const cacheTag = res.de_cache ? " \u26A1(Cach\xE9)" : "";
        setStatusMsg(`\u2713 Identificado${engineTag}${cacheTag}: "${res.title}" por ${res.artist}`);
        setIdentifiedTrack(res);
        setHistory((prev) => [res, ...prev.filter((item) => item.title !== res.title || item.artist !== res.artist)]);
        if (res.preview_url) {
          togglePlayPreview(res.preview_url);
        }
      } else {
        setStatusMsg(res?.msg || "No se encontraron coincidencias para este fragmento de audio.");
      }
    };
    const handleSendToAuditInternal = (trk) => {
      if (!trk || !onSendToAudit) return;
      const newTrackItem = {
        id: Date.now(),
        t: trk.title,
        title: trk.title,
        a: trk.artist,
        artist: trk.artist,
        album: trk.album || `${trk.title} - Single`,
        genre: trk.genre || "Electronic",
        subgenre: "Tech House",
        year: trk.year || "",
        b: "126.00",
        bpm: "126.00",
        k: "8A",
        key: "8A",
        duration: "03:30",
        format: "FLAC",
        cover: trk.cover || "",
        status: "Pass 22.05kHz",
        first_downbeat_ms: 250,
        trim_start_ms: 25,
        cues: NV2_COLORS
      };
      onSendToAudit(newTrackItem);
    };
    const handleSendToSpotifyInternal = (trk) => {
      if (!trk || !onSendToSpotify) return;
      onSendToSpotify(trk.spotify_query || `${trk.title} ${trk.artist}`);
    };
    const handleCopyToClipboard = (trk) => {
      const text = `${trk.artist} - ${trk.title} [${trk.album || ""} ${trk.year || ""}]`;
      navigator.clipboard.writeText(text);
      alert(`Copiado al portapapeles:
${text}`);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col h-full w-full bg-[#040407] overflow-y-auto p-4 sm:p-6 text-gray-200 space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-4 border-b border-djzinc-800 pb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-djcyan-500 to-indigo-500 p-0.5 shadow-lg shadow-djcyan-500/20 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-full h-full bg-[#08080d] rounded-[10px] flex items-center justify-center text-djcyan-400" }, /* @__PURE__ */ React.createElement(Icons.Radar, null))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-black text-white tracking-wide" }, "RADAR AC\xDASTICO BEATWAVE"), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 text-[9px] font-mono font-bold bg-gradient-to-r from-blue-950 to-indigo-950 text-djcyan-400 border border-djcyan-800/80 rounded shadow" }, selectedEngine === "hybrid" ? "\u26A1 Modo H\xEDbrido Pro (Shazam + AudD)" : selectedEngine === "audd" ? "\u{1F7E3} AudD Music API" : "\u{1F535} ShazamIO Smart Drop")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, "Identifica pistas desconocidas al instante escuchando con el micr\xF3fono o cargando archivos de audio."))), statusMsg && /* @__PURE__ */ React.createElement("div", { className: "px-3 py-1.5 rounded-lg bg-djzinc-900 border border-djzinc-750 text-xs font-mono flex items-center gap-2 shadow" }, /* @__PURE__ */ React.createElement("span", { className: `w-2 h-2 rounded-full ${isAnalyzing || isListening ? "bg-djcyan-400 animate-pulse" : "bg-djgreen-400"}` }), /* @__PURE__ */ React.createElement("span", { className: "text-gray-300" }, statusMsg))), /* @__PURE__ */ React.createElement("div", { className: "bg-[#08080f] border border-djzinc-800 rounded-2xl p-3.5 shadow-xl space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider" }, "Motor Activo:"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-1 bg-djzinc-900 p-1 rounded-xl border border-djzinc-750" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setSelectedEngine("hybrid"),
        className: `px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${selectedEngine === "hybrid" ? "bg-gradient-to-r from-emerald-500 to-djcyan-400 text-black shadow-lg shadow-djcyan-500/20" : "text-gray-400 hover:text-white"}`,
        title: "Combina ShazamIO con escaneo de drop y respaldo autom\xE1tico en AudD API para m\xE1xima precisi\xF3n"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u26A1"),
      /* @__PURE__ */ React.createElement("span", null, "H\xEDbrido Pro (Recomendado)")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setSelectedEngine("shazamio"),
        className: `px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${selectedEngine === "shazamio" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-gray-400 hover:text-white"}`,
        title: "ShazamIO nativo con escaneo multi-segmento de drops y breakdowns para pistas de DJ"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F535}"),
      /* @__PURE__ */ React.createElement("span", null, "ShazamIO Smart Drop")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setSelectedEngine("audd"),
        className: `px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${selectedEngine === "audd" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" : "text-gray-400 hover:text-white"}`,
        title: "AudD Music Recognition API (ISRC, Spotify, Apple Music)"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F7E3}"),
      /* @__PURE__ */ React.createElement("span", null, "AudD Music API")
    ))), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowConfig(!showConfig),
        className: `px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${showConfig || auddToken ? "bg-purple-950/60 border-purple-700 text-purple-300" : "bg-djzinc-900 border-djzinc-750 text-gray-400 hover:text-white"}`,
        title: "Configurar claves de API o token personalizado"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u2699\uFE0F"),
      /* @__PURE__ */ React.createElement("span", null, showConfig ? "Ocultar Opciones" : "Opciones API"),
      auddToken && /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400" })
    )), showConfig && /* @__PURE__ */ React.createElement("div", { className: "bg-[#05050a] p-3 rounded-xl border border-djzinc-800 text-xs font-mono space-y-2 animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-gray-200 font-bold block" }, "Token de AudD Music API:"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400" }, 'Por defecto BeatWave usa el token p\xFAblico comunitario ("test"). Si posees tu propio token de audd.io, ingr\xE9salo aqu\xED para consultas comerciales ilimitadas.')), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: auddToken,
        onChange: (e) => setAuddToken(e.target.value),
        placeholder: "test (predeterminado)",
        className: "w-full sm:w-64 px-2.5 py-1.5 bg-djzinc-900 border border-djzinc-750 rounded-lg text-xs text-white font-mono focus:border-purple-500 outline-none"
      }
    )))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#09090f] p-5 rounded-2xl border border-djzinc-800 flex flex-col items-center text-center justify-between relative overflow-hidden shadow-lg group hover:border-djcyan-500/40 transition-all" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1 mb-4" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono font-bold uppercase text-djcyan-400 tracking-wider" }, "MODO A \u2022 CAPTURA AMBIENTAL"), /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white" }, "Escucha en Directo por Micr\xF3fono"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 max-w-xs mx-auto" }, "Captura 10 segundos de m\xFAsica sonando en tus monitores o altavoces y consulta los servidores ac\xFAsticos.")), /* @__PURE__ */ React.createElement("div", { className: "my-3 relative flex flex-col items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "relative flex items-center justify-center" }, isListening && /* @__PURE__ */ React.createElement("div", { className: "absolute w-36 h-36 rounded-full bg-djcyan-500/20 animate-ping pointer-events-none" }), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: startMicrophoneListening,
        disabled: isListening || isAnalyzing,
        className: `w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer shadow-2xl relative z-10 ${isListening ? "bg-gradient-to-tr from-red-600 to-pink-600 text-white scale-110 shadow-red-500/40" : "bg-gradient-to-tr from-blue-600 to-djcyan-400 text-black hover:scale-105 shadow-djcyan-500/30"}`
      },
      /* @__PURE__ */ React.createElement(Icons.Mic, null),
      /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono font-black mt-1" }, isListening ? `${countdown}s...` : "ESCUCHAR")
    )), isListening && /* @__PURE__ */ React.createElement("div", { className: "w-52 mt-3.5 flex flex-col items-center gap-1.5 animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between w-full text-[10px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "SE\xD1AL DE MICR\xD3FONO"), /* @__PURE__ */ React.createElement("span", { className: micLevel > 15 ? "text-djcyan-400 font-bold" : "text-amber-400" }, micLevel, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full h-2 bg-djzinc-950 rounded-full overflow-hidden border border-djzinc-800 p-0.5" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `h-full transition-all duration-75 rounded-full ${micLevel > 70 ? "bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500" : micLevel > 20 ? "bg-gradient-to-r from-cyan-500 to-emerald-400" : "bg-djcyan-500"}`,
        style: { width: `${Math.max(4, micLevel)}%` }
      }
    )), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-500" }, micLevel > 10 ? "\u2713 Captando audio ambiental" : "Acerca el altavoz o sube el volumen")), isListening && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-3 z-10" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: (e) => {
          e.stopPropagation();
          stopMicrophoneListeningEarly();
        },
        className: "px-3 py-1 rounded-lg text-xs font-mono font-bold bg-djcyan-500 hover:bg-djcyan-400 text-black shadow-lg shadow-djcyan-500/20 cursor-pointer flex items-center gap-1 transition-all",
        title: "Enviar grabaci\xF3n inmediatamente sin esperar al final de los 10 segundos"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u26A1"),
      /* @__PURE__ */ React.createElement("span", null, "Identificar Ya")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: (e) => {
          e.stopPropagation();
          cancelListening();
        },
        className: "px-3 py-1 rounded-lg text-xs font-mono font-bold bg-djzinc-800 hover:bg-red-950 text-gray-300 hover:text-red-300 border border-djzinc-700 cursor-pointer transition-all",
        title: "Cancelar la captura actual"
      },
      "\u2715 Cancelar"
    ))), /* @__PURE__ */ React.createElement("div", { className: "text-[11px] font-mono text-gray-400" }, isListening ? /* @__PURE__ */ React.createElement("span", { className: "text-red-400 font-bold animate-pulse" }, "\u25CF Grabando audio del micr\xF3fono...") : isAnalyzing ? /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold" }, "\u25CF Analizando huella ac\xFAstica...") : /* @__PURE__ */ React.createElement("span", null, "Haz clic para iniciar la escucha de 10 segundos"))), /* @__PURE__ */ React.createElement(
      "div",
      {
        onDragOver: (e) => {
          e.preventDefault();
          setDragOver(true);
        },
        onDragLeave: () => setDragOver(false),
        onDrop: (e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
          }
        },
        className: `bg-[#09090f] p-5 rounded-2xl border flex flex-col items-center text-center justify-between transition-all cursor-pointer shadow-lg ${dragOver ? "border-djcyan-400 bg-djcyan-950/20 scale-[1.01]" : "border-djzinc-800 hover:border-djcyan-500/40"}`,
        onClick: () => fileInputRef.current && fileInputRef.current.click()
      },
      /* @__PURE__ */ React.createElement("div", { className: "space-y-1 mb-4" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono font-bold uppercase text-purple-400 tracking-wider" }, "MODO B \u2022 ANALIZADOR DE ARCHIVO"), /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white" }, "Subir o Arrastrar Archivo de Audio"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 max-w-xs mx-auto" }, "Arrastra cualquier archivo local (.mp3, .flac, .wav, .m4a) para extraer su huella digital y metadatos.")),
      /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "file",
          ref: fileInputRef,
          onChange: (e) => {
            if (e.target.files && e.target.files.length > 0) {
              const selected = e.target.files[0];
              e.target.value = "";
              handleFileSelect(selected);
            }
          },
          accept: "audio/*",
          className: "hidden"
        }
      ),
      /* @__PURE__ */ React.createElement("div", { className: "my-3 w-28 h-28 rounded-2xl border-2 border-dashed border-djzinc-700 hover:border-djcyan-400 flex flex-col items-center justify-center transition-colors bg-djzinc-950" }, /* @__PURE__ */ React.createElement("span", { className: "text-3xl mb-1" }, "\u{1F4C1}"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono font-bold text-gray-300" }, "ARRASTRAR AQU\xCD")),
      /* @__PURE__ */ React.createElement("div", { className: "text-[11px] font-mono text-gray-400" }, /* @__PURE__ */ React.createElement("span", null, "Formatos: MP3, FLAC, WAV, M4A, OGG"))
    )), identifiedTrack && /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-r from-blue-950/50 via-djzinc-950 to-indigo-950/50 p-5 rounded-2xl border-2 border-djcyan-500/50 shadow-2xl space-y-4 animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800/80 pb-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-djcyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse" }), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono font-black text-djcyan-400 uppercase tracking-wider" }, "PISTA IDENTIFICADA"), identifiedTrack.motor_usado && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gradient-to-r from-blue-950 to-indigo-950 text-djcyan-300 border border-djcyan-700/60 shadow" }, "\u26A1 ", identifiedTrack.motor_usado)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, identifiedTrack.isrc && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-400 bg-djzinc-900 px-2 py-0.5 rounded border border-djzinc-750" }, "ISRC: ", identifiedTrack.isrc), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleDescartarDeteccion,
        className: "w-6 h-6 rounded-full bg-djzinc-850 hover:bg-red-950 text-gray-400 hover:text-red-400 flex items-center justify-center text-xs font-bold border border-djzinc-750 cursor-pointer transition-colors",
        title: "Descartar esta detecci\xF3n"
      },
      "\u2715"
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row items-center gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "relative group shrink-0" }, /* @__PURE__ */ React.createElement(
      "img",
      {
        src: getValidCover(identifiedTrack.cover),
        alt: "Shazam Artwork",
        className: "w-44 h-44 rounded-2xl object-cover border-2 border-djzinc-700 shadow-2xl"
      }
    ), identifiedTrack.preview_url && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => togglePlayPreview(identifiedTrack.preview_url),
        className: `absolute inset-0 m-auto w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer font-black text-lg ${previewPlaying ? "bg-emerald-500 text-black scale-105 shadow-[0_0_20px_rgba(16,185,129,0.7)]" : "bg-djcyan-500 text-black hover:scale-110 shadow-[0_0_20px_rgba(6,182,212,0.6)]"}`,
        title: "Reproducir pre-escucha de audio oficial"
      },
      previewPlaying ? "\u275A\u275A" : "\u25B6"
    ), /* @__PURE__ */ React.createElement("span", { className: "absolute bottom-2 left-2 bg-black/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-gray-300 border border-djzinc-700" }, "Pre-Escucha 30s")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0 space-y-3.5" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-black text-white truncate", title: identifiedTrack.title }, identifiedTrack.title), /* @__PURE__ */ React.createElement("p", { className: "text-lg font-bold text-djcyan-400 truncate mt-0.5", title: identifiedTrack.artist }, identifiedTrack.artist)), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#050508] p-2.5 rounded-lg border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-500 block uppercase" }, "\xC1lbum"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-200 font-semibold truncate block", title: identifiedTrack.album }, identifiedTrack.album || "--")), /* @__PURE__ */ React.createElement("div", { className: "bg-[#050508] p-2.5 rounded-lg border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-500 block uppercase" }, "G\xE9nero"), /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400 font-semibold truncate block" }, identifiedTrack.genre || "Electronic")), /* @__PURE__ */ React.createElement("div", { className: "bg-[#050508] p-2.5 rounded-lg border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-500 block uppercase" }, "Lanzamiento"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-200 font-semibold truncate block" }, identifiedTrack.year || "--")), /* @__PURE__ */ React.createElement("div", { className: "bg-[#050508] p-2.5 rounded-lg border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-500 block uppercase" }, "Sello / Label"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-300 font-semibold truncate block", title: identifiedTrack.label }, identifiedTrack.label || "--"))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-3 pt-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleApuntarEnLista(identifiedTrack),
        className: "px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95",
        title: "A\xF1adir esta pista a tu Libreta Digital de Apuntes DJ"
      },
      /* @__PURE__ */ React.createElement("span", { className: "text-base" }, "\u{1F4DD}"),
      /* @__PURE__ */ React.createElement("span", null, "Apuntar en Lista")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleDescartarDeteccion,
        className: "px-4 py-2.5 bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800 font-mono font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1.5",
        title: "Descartar esta detecci\xF3n y dejar el radar listo"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F5D1}\uFE0F"),
      /* @__PURE__ */ React.createElement("span", null, "Descartar")
    ), /* @__PURE__ */ React.createElement("div", { className: "h-6 w-px bg-djzinc-800 hidden sm:block" }), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleSendToSpotifyInternal(identifiedTrack),
        className: "px-3.5 py-2 bg-djzinc-900 hover:bg-djzinc-850 text-djgreen-400 border border-djgreen-800/80 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95",
        title: "Enviar a la cola de descarga en FLAC"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4E5}"),
      /* @__PURE__ */ React.createElement("span", null, "Spotify Ingest")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleSendToAuditInternal(identifiedTrack),
        className: "px-3.5 py-2 bg-djzinc-900 hover:bg-djzinc-850 text-djcyan-400 border border-djcyan-800/80 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95",
        title: "A\xF1adir a la tabla de auditor\xEDa para an\xE1lisis DSP"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4CB}"),
      /* @__PURE__ */ React.createElement("span", null, "Auditor\xEDa DJ")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleCopyToClipboard(identifiedTrack),
        className: "px-3 py-2 bg-djzinc-900 hover:bg-djzinc-850 text-gray-300 border border-djzinc-750 rounded-xl text-xs font-mono cursor-pointer transition-colors",
        title: "Copiar texto al portapapeles"
      },
      "Copiar"
    ))))), /* @__PURE__ */ React.createElement("div", { className: "bg-[#09090f] border border-djzinc-800 rounded-2xl p-5 shadow-xl space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-djzinc-800 pb-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400 font-bold text-sm shadow" }, "\u{1F4D3}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-black text-white font-mono uppercase tracking-wider" }, "Libreta Digital de Apuntes DJ"), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-black" }, notebookTracks.length, " apuntes")), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-gray-400" }, "Colecci\xF3n de pistas cazadas en vivo en el radar, listas para exportar o enviar a producci\xF3n."))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, notebookFeedback && /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono font-bold text-emerald-400 animate-pulse mr-2" }, notebookFeedback), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleExportarNotebookXLS,
        disabled: notebookTracks.length === 0,
        className: "px-3 py-1.5 bg-djzinc-850 hover:bg-djzinc-800 text-djgreen-400 border border-djgreen-700/60 font-mono font-bold text-xs rounded-lg shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-40",
        title: "Descargar listado en formato Excel (.xls / .xlsx)"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4CA}"),
      /* @__PURE__ */ React.createElement("span", null, "Descargar XLS")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleExportarNotebookTXT,
        disabled: notebookTracks.length === 0,
        className: "px-3 py-1.5 bg-djzinc-850 hover:bg-djzinc-800 text-djcyan-400 border border-djcyan-700/60 font-mono font-bold text-xs rounded-lg shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-40",
        title: "Descargar tracklist limpio en formato texto (.txt)"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4C4}"),
      /* @__PURE__ */ React.createElement("span", null, "Descargar TXT")
    ), notebookTracks.length > 0 && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleVaciarNotebook,
        className: "px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/80 font-mono font-bold text-xs rounded-lg shadow cursor-pointer transition-colors",
        title: "Vaciar todos los apuntes"
      },
      "\u{1F5D1}\uFE0F Vaciar"
    ))), notebookTracks.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "py-10 text-center text-gray-500 font-mono text-xs border border-dashed border-djzinc-850 rounded-xl bg-djzinc-950/50" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl block mb-1" }, "\u{1F4DD}"), "Tu libreta de apuntes est\xE1 vac\xEDa. Cuando identifiques un track en el Radar, pulsa ", /* @__PURE__ */ React.createElement("strong", { className: "text-emerald-400" }, '"Apuntar en Lista"'), " para guardarlo aqu\xED.") : /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left border-collapse text-xs whitespace-nowrap" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-[#0d0d14] border-b border-djzinc-800 text-[10px] font-mono uppercase text-gray-400" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "py-2 px-2 text-center w-8" }, "#"), /* @__PURE__ */ React.createElement("th", { className: "py-2 px-2 w-10 text-center" }, "PLAY"), /* @__PURE__ */ React.createElement("th", { className: "py-2 px-3 min-w-[260px]" }, "PISTA / \xC1LBUM"), /* @__PURE__ */ React.createElement("th", { className: "py-2 px-3 min-w-[160px]" }, "ARTISTA"), /* @__PURE__ */ React.createElement("th", { className: "py-2 px-2 text-center w-24" }, "G\xC9NERO"), /* @__PURE__ */ React.createElement("th", { className: "py-2 px-2 text-center w-16" }, "A\xD1O"), /* @__PURE__ */ React.createElement("th", { className: "py-2 px-3 text-center w-28" }, "HORA APUNTE"), /* @__PURE__ */ React.createElement("th", { className: "py-2 px-3 text-center w-36" }, "ACCIONES"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-djzinc-850/60 font-sans" }, notebookTracks.map((row, idx) => {
      const isRowPlaying = previewPlaying && audioRef.current.src === row.preview_url;
      return /* @__PURE__ */ React.createElement("tr", { key: row.notebook_id || idx, className: "hover:bg-[#12121a] transition-colors" }, /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center text-gray-500 font-mono" }, idx + 1), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, row.preview_url ? /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => togglePlayPreview(row.preview_url),
          className: `w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${isRowPlaying ? "bg-emerald-500 text-black font-bold shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-djzinc-850 hover:bg-djcyan-500 hover:text-black text-djcyan-400"}`,
          title: "Reproducir pre-escucha"
        },
        isRowPlaying ? "\u275A\u275A" : "\u25B6"
      ) : /* @__PURE__ */ React.createElement("span", { className: "text-gray-600 text-[10px] font-mono" }, "--")), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement(
        "img",
        {
          src: getValidCover(row.cover),
          alt: "Cover",
          onError: (e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_VINYL_SVG;
          },
          className: "w-8 h-8 rounded object-cover border border-djzinc-700 shrink-0 shadow-sm"
        }
      ), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-white text-xs truncate max-w-xs", title: row.title }, row.title), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-mono truncate max-w-xs", title: row.album }, row.album || "--")))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-gray-300 font-medium truncate max-w-xs" }, row.artist), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center font-mono text-[10px] text-emerald-400" }, row.genre || "Electronic"), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center font-mono text-gray-400" }, row.year || "--"), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-center font-mono text-[10px] text-gray-400" }, row.added_at || "--"), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-1.5" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => handleSendToSpotifyInternal(row),
          className: "px-2 py-0.5 bg-djzinc-850 hover:bg-djgreen-950 text-djgreen-400 border border-djzinc-700 hover:border-djgreen-700/60 rounded text-[10px] font-mono cursor-pointer transition-colors",
          title: "Enviar a Spotify Ingest"
        },
        "\u{1F4E5} Spotify"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => handleSendToAuditInternal(row),
          className: "px-2 py-0.5 bg-djzinc-850 hover:bg-djcyan-950 text-djcyan-400 border border-djzinc-700 hover:border-djcyan-700/60 rounded text-[10px] font-mono cursor-pointer transition-colors",
          title: "A\xF1adir a Auditor\xEDa"
        },
        "\u{1F4CB} Auditar"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => handleEliminarDeNotebook(row.notebook_id),
          className: "px-1.5 py-0.5 text-gray-500 hover:text-red-400 text-xs cursor-pointer transition-colors",
          title: "Eliminar de la libreta"
        },
        "\u2715"
      ))));
    }))))), history.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800 pb-2" }, /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F552}"), /* @__PURE__ */ React.createElement("span", null, "HISTORIAL DE PISTAS IDENTIFICADAS (", history.length, ")")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setHistory([]),
        className: "text-[10px] font-mono text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
      },
      "Limpiar Historial"
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" }, history.map((trk, hIdx) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: hIdx,
        className: "p-3 bg-[#07070b] rounded-xl border border-djzinc-850 flex items-center gap-3 hover:border-djcyan-500/30 transition-all group"
      },
      /* @__PURE__ */ React.createElement(
        "img",
        {
          src: getValidCover(trk.cover),
          alt: "Cover",
          className: "w-12 h-12 rounded-lg object-cover border border-djzinc-800 shrink-0 shadow"
        }
      ),
      /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("h5", { className: "text-xs font-bold text-white truncate", title: trk.title }, trk.title), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-djcyan-400 truncate", title: trk.artist }, trk.artist), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono text-gray-500" }, trk.genre || "Electronic", " ", trk.year ? `\u2022 ${trk.year}` : "")),
      /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1 shrink-0" }, trk.preview_url && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => togglePlayPreview(trk.preview_url),
          className: "w-7 h-7 rounded bg-djzinc-900 hover:bg-djcyan-500 hover:text-black text-djcyan-400 flex items-center justify-center text-xs font-bold border border-djzinc-750 transition-colors shadow",
          title: "Pre-escucha"
        },
        "\u25B6"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => handleSendToAuditInternal(trk),
          className: "w-7 h-7 rounded bg-djzinc-900 hover:bg-djgreen-500 hover:text-black text-djgreen-400 flex items-center justify-center text-xs font-bold border border-djzinc-750 transition-colors shadow",
          title: "A\xF1adir a Auditor\xEDa"
        },
        "+"
      ))
    )))));
  };
  var TrendsWorkspace = ({ lang = "es" }) => {
    const [trendsData, setTrendsData] = useState({
      last_crawled_at: "Sincronizando...",
      next_scheduled_run: "Martes 23:00",
      items: [],
      festivals_calendar: [],
      set_breakdowns: [],
      interviews: [],
      trends_radar: []
    });
    const [loading, setLoading] = useState(true);
    const [isCrawling, setIsCrawling] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("todas");
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState("all");
    const [readingArticle, setReadingArticle] = useState(null);
    const [copiedRef, setCopiedRef] = useState(false);
    const categories = [
      { id: "todas", label: lang === "en" ? "All Trends" : "Todas las Novedades", icon: "\u{1F310}" },
      { id: "Tendencias", label: lang === "en" ? "Trends & Sounds" : "Tendencias Globales", icon: "\u{1F525}" },
      { id: "Festivales & Eventos", label: lang === "en" ? "Festivals & Clubs (Calendar)" : "Festivales & Clubs (Calendario)", icon: "\u{1F3AA}" },
      { id: "SetBreakdowns", label: lang === "en" ? "Set Breakdowns" : "An\xE1lisis de Sesiones Pasadas", icon: "\u{1F39B}\uFE0F" },
      { id: "Entrevistas", label: lang === "en" ? "Interviews" : "Entrevistas Exclusivas", icon: "\u{1F399}\uFE0F" },
      { id: "Radar", label: lang === "en" ? "Tech Radar & DSP" : "Radar Nuevos Temas & DSP", icon: "\u{1F4E1}" },
      { id: "Tecnolog\xEDa & Hardware", label: lang === "en" ? "Tech & Audio DSP" : "Tecnolog\xEDa & Hardware", icon: "\u{1F527}" },
      { id: "Lanzamientos & Charts", label: lang === "en" ? "Charts & Labels" : "Lanzamientos & Charts", icon: "\u{1F4C8}" }
    ];
    const fetchTrends = async () => {
      try {
        setLoading(true);
        if (window.eel && window.eel.obtener_tendencias_web) {
          const res = await window.eel.obtener_tendencias_web()();
          if (res && res.items) setTrendsData(res);
        } else {
          const resp = await fetch("/api/trends");
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.items) setTrendsData(data);
          }
        }
      } catch (e) {
        console.error("Error cargando tendencias:", e);
      } finally {
        setLoading(false);
      }
    };
    useEffect(() => {
      fetchTrends();
    }, []);
    const handleRunCrawler = async () => {
      setIsCrawling(true);
      try {
        if (window.eel && window.eel.ejecutar_crawler_tendencias) {
          const res = await window.eel.ejecutar_crawler_tendencias()();
          if (res && res.items) setTrendsData(res);
        } else {
          const resp = await fetch("/api/trends/crawl", { method: "POST" });
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.items) setTrendsData(data);
          }
        }
      } catch (e) {
        console.error("Error al ejecutar crawler:", e);
      } finally {
        setIsCrawling(false);
      }
    };
    const handleCopyReference = (refText) => {
      if (!refText) return;
      try {
        navigator.clipboard.writeText(refText);
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2500);
      } catch (_) {
      }
    };
    const filteredItems = useMemo(() => {
      const items = trendsData.items || [];
      return items.filter((item) => {
        const matchCat = selectedCategory === "todas" || item.category === selectedCategory;
        const q = searchQuery.toLowerCase().trim();
        const matchSearch = !q || (item.title || "").toLowerCase().includes(q) || (item.summary || "").toLowerCase().includes(q) || (item.source || "").toLowerCase().includes(q) || (item.key_tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchCat || !matchSearch) return false;
        if (dateFilter !== "all" && item.date) {
          try {
            const itemDate = new Date(item.date);
            if (!isNaN(itemDate.getTime())) {
              const now = /* @__PURE__ */ new Date();
              const diffDays = (now.getTime() - itemDate.getTime()) / (1e3 * 60 * 60 * 24);
              if (dateFilter === "7days" && diffDays > 7) return false;
              if (dateFilter === "30days" && diffDays > 30) return false;
              if (dateFilter === "90days" && diffDays > 90) return false;
            }
          } catch (_) {
          }
        }
        return true;
      });
    }, [trendsData, selectedCategory, searchQuery, dateFilter]);
    const festivals = useMemo(() => {
      const list = trendsData.festivals_calendar || [];
      const q = searchQuery.toLowerCase().trim();
      if (!q) return list;
      return list.filter(
        (f) => (f.name || "").toLowerCase().includes(q) || (f.city || "").toLowerCase().includes(q) || (f.venue || "").toLowerCase().includes(q) || (f.headliners || []).some((h) => h.toLowerCase().includes(q))
      );
    }, [trendsData, searchQuery]);
    const setBreakdowns = useMemo(() => {
      const list = trendsData.set_breakdowns || [];
      const q = searchQuery.toLowerCase().trim();
      if (!q) return list;
      return list.filter(
        (s) => (s.artist || "").toLowerCase().includes(q) || (s.event || "").toLowerCase().includes(q) || (s.tactical_breakdown || "").toLowerCase().includes(q)
      );
    }, [trendsData, searchQuery]);
    const interviews = useMemo(() => {
      const list = trendsData.interviews || [];
      const q = searchQuery.toLowerCase().trim();
      if (!q) return list;
      return list.filter(
        (it) => (it.artist || "").toLowerCase().includes(q) || (it.headline || "").toLowerCase().includes(q) || (it.quote || "").toLowerCase().includes(q)
      );
    }, [trendsData, searchQuery]);
    const radarItems = useMemo(() => {
      const list = trendsData.trends_radar || [];
      const q = searchQuery.toLowerCase().trim();
      if (!q) return list;
      return list.filter(
        (r) => (r.topic || "").toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q)
      );
    }, [trendsData, searchQuery]);
    return /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col h-full bg-[#08080c] overflow-y-auto text-gray-200 pb-36 md:pb-8" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 md:p-6 border-b border-djzinc-800/80 bg-gradient-to-b from-[#10101a] to-[#08080c] flex flex-col gap-4 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "p-2 bg-gradient-to-br from-djcyan-500/20 to-purple-500/20 border border-djcyan-500/40 rounded-xl text-djcyan-400" }, /* @__PURE__ */ React.createElement(Icons.Trends, null)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-lg md:text-xl font-black text-white tracking-wide flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", null, "TENDENCIAS DE M\xDASICA ELECTR\xD3NICA"), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-djcyan-950 border border-djcyan-500/50 text-djcyan-300" }, "RADAR WEB & FESTIVALES")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-0.5" }, "Nuevas corrientes, calendario oficial de festivales, an\xE1lisis de sesiones de DJ y entrevistas exclusivas con referencias bibliogr\xE1ficas.")))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-3 bg-[#0d0d15] p-2 rounded-xl border border-djzinc-800 shadow-inner" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col text-right px-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-400 flex items-center gap-1.5 justify-end" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" }), /* @__PURE__ */ React.createElement("span", null, "Crawler semanal: ", /* @__PURE__ */ React.createElement("strong", null, "Martes noche (23:00)"))), /* @__PURE__ */ React.createElement("span", { className: "text-[9.5px] font-mono text-gray-500" }, "\xDAltima sync: ", trendsData.last_crawled_at || "Reciente")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleRunCrawler,
        disabled: isCrawling,
        className: "px-3.5 py-1.5 bg-gradient-to-r from-djcyan-500 to-djcyan-400 hover:from-djcyan-400 hover:to-djcyan-300 disabled:opacity-50 text-black font-black text-xs rounded-lg shadow-md shadow-djcyan-500/30 flex items-center gap-2 cursor-pointer transition-transform active:scale-95 shrink-0",
        title: "Lanza el crawler para buscar noticias y tendencias de m\xFAsica electr\xF3nica en la web ahora mismo"
      },
      /* @__PURE__ */ React.createElement("span", { className: isCrawling ? "animate-spin" : "" }, "\u{1F504}"),
      /* @__PURE__ */ React.createElement("span", null, isCrawling ? "Rastreando la Web..." : "Sincronizar Crawler")
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none" }, categories.map((cat) => {
      const isSelected = selectedCategory === cat.id;
      let count = 0;
      if (cat.id === "todas") count = (trendsData.items || []).length;
      else if (cat.id === "Festivales & Eventos") count = (trendsData.festivals_calendar || []).length;
      else if (cat.id === "SetBreakdowns") count = (trendsData.set_breakdowns || []).length;
      else if (cat.id === "Entrevistas") count = (trendsData.interviews || []).length;
      else if (cat.id === "Radar") count = (trendsData.trends_radar || []).length;
      else count = (trendsData.items || []).filter((i) => i.category === cat.id).length;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: cat.id,
          type: "button",
          onClick: () => setSelectedCategory(cat.id),
          className: `px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${isSelected ? "bg-gradient-to-r from-djcyan-500 to-djcyan-400 text-black shadow-md font-black" : "bg-djzinc-900/80 text-gray-400 hover:text-white hover:bg-djzinc-800 border border-djzinc-800"}`
        },
        /* @__PURE__ */ React.createElement("span", null, cat.icon),
        /* @__PURE__ */ React.createElement("span", null, cat.label),
        /* @__PURE__ */ React.createElement("span", { className: `px-1.5 py-0.2 rounded-full text-[9px] font-mono ${isSelected ? "bg-black text-djcyan-300 font-bold" : "bg-djzinc-800 text-gray-400"}` }, count)
      );
    })), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 bg-[#0d0d15] border border-djzinc-800 rounded-lg px-2.5 py-1 text-xs font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "\u{1F4C5}"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: dateFilter,
        onChange: (e) => setDateFilter(e.target.value),
        className: "bg-transparent text-gray-300 text-xs font-mono outline-none cursor-pointer",
        title: "Filtrar tendencias por fecha de publicaci\xF3n"
      },
      /* @__PURE__ */ React.createElement("option", { value: "all", className: "bg-[#0d0d15] text-gray-200" }, "Todas las fechas"),
      /* @__PURE__ */ React.createElement("option", { value: "7days", className: "bg-[#0d0d15] text-gray-200" }, "\xDAltima semana"),
      /* @__PURE__ */ React.createElement("option", { value: "30days", className: "bg-[#0d0d15] text-gray-200" }, "\xDAltimo mes"),
      /* @__PURE__ */ React.createElement("option", { value: "90days", className: "bg-[#0d0d15] text-gray-200" }, "\xDAltimos 3 meses")
    )), /* @__PURE__ */ React.createElement("div", { className: "relative min-w-[200px] md:w-64" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value),
        placeholder: "Buscar noticias, artistas...",
        className: "w-full bg-[#0d0d15] border border-djzinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 outline-none focus:border-djcyan-500 transition-colors font-mono"
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "absolute left-2.5 top-2 text-gray-500 text-xs" }, "\u{1F50D}"), searchQuery && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setSearchQuery(""),
        className: "absolute right-2.5 top-1.5 text-gray-500 hover:text-white text-xs cursor-pointer"
      },
      "\u2715"
    ))))), selectedCategory === "Festivales & Eventos" && /* @__PURE__ */ React.createElement("div", { className: "p-4 md:p-6 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800 pb-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl" }, "\u{1F3AA}"), /* @__PURE__ */ React.createElement("h2", { className: "text-base font-black text-white uppercase tracking-wider font-mono" }, "Calendario Oficial de Festivales & Clubs (Temporada 2026 - 2027)")), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-djcyan-400" }, festivals.length, " Eventos Confirmados")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" }, festivals.map((fest) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: fest.id,
        className: "bg-[#0e0e16] border border-djzinc-800/90 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-[0_4px_24px_rgba(245,158,11,0.15)] flex flex-col group cursor-pointer",
        onClick: () => setReadingArticle({
          id: fest.id,
          title: `${fest.name} (${fest.city}, ${fest.country})`,
          category: "Festivales & Clubs",
          category_badge: "\u{1F3AA} FESTIVAL OFICIAL",
          source: "Tour Calendar Global",
          author: fest.venue,
          date: fest.dates,
          read_time: "Gu\xEDa de Cabina",
          image_url: fest.image_url,
          summary: fest.description,
          content: `${fest.name} se celebra en ${fest.venue}. Sistema de sonido oficial: ${fest.sound_system}. Line-up confirmado: ${fest.headliners.join(", ")}. Se recomienda a los DJs preparar sus pistas en rangos de ${fest.recommended_bpm} con mastering certificado sin cortes lossy.`,
          takeaways: [
            `Fechas: ${fest.dates} en ${fest.city} (${fest.country})`,
            `Sistema de Sonido: ${fest.sound_system}`,
            `BPM Recomendado: ${fest.recommended_bpm}`,
            `Line-up: ${fest.headliners.join(" \u2022 ")}`
          ],
          reference: fest.reference,
          url: fest.ticket_url,
          key_tags: [fest.city, fest.country, "Festival 2026", fest.sound_system.split(" ")[0]]
        })
      },
      /* @__PURE__ */ React.createElement("div", { className: "h-44 w-full relative overflow-hidden bg-djzinc-900" }, /* @__PURE__ */ React.createElement(
        "img",
        {
          src: fest.image_url,
          alt: fest.name,
          className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        }
      ), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-[#0e0e16] via-transparent to-black/40" }), /* @__PURE__ */ React.createElement("div", { className: "absolute top-3 left-3 flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl" }, fest.flag), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-black/80 text-amber-300 border border-amber-500/50" }, fest.dates)), /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-2.5 right-3 text-[10px] font-mono text-gray-200 bg-black/80 px-2 py-0.5 rounded border border-djzinc-750" }, "\u{1F4CD} ", fest.city)),
      /* @__PURE__ */ React.createElement("div", { className: "p-4 flex-1 flex flex-col justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-black text-white group-hover:text-amber-300 transition-colors" }, fest.name), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 line-clamp-2" }, fest.description), /* @__PURE__ */ React.createElement("div", { className: "p-2 bg-[#12121c] rounded-lg border border-djzinc-800 space-y-1 text-[11px] font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-gray-400" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F50A} Sistema:"), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold truncate max-w-[170px]", title: fest.sound_system }, fest.sound_system)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-gray-400" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F39B}\uFE0F BPM \xD3ptimo:"), /* @__PURE__ */ React.createElement("span", { className: "text-amber-400 font-bold" }, fest.recommended_bpm)))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1" }, fest.headliners.slice(0, 3).map((hl, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "text-[9.5px] font-mono px-2 py-0.5 rounded bg-djzinc-900 text-gray-300 border border-djzinc-800" }, "\u2605 ", hl)), fest.headliners.length > 3 && /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono text-gray-500 self-center" }, "+", fest.headliners.length - 3, " m\xE1s")), /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-djzinc-800/80 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9.5px] font-mono text-gray-400 truncate max-w-[140px]", title: fest.venue }, "\u{1F3DB}\uFE0F ", fest.venue), /* @__PURE__ */ React.createElement(
        "a",
        {
          href: fest.ticket_url,
          target: "_blank",
          rel: "noopener noreferrer",
          onClick: (e) => e.stopPropagation(),
          className: "px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black rounded text-[10px] font-mono font-black flex items-center gap-1 transition-colors"
        },
        /* @__PURE__ */ React.createElement("span", null, "Entradas"),
        /* @__PURE__ */ React.createElement("span", null, "\u2197")
      ))))
    )))), selectedCategory === "SetBreakdowns" && /* @__PURE__ */ React.createElement("div", { className: "p-4 md:p-6 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800 pb-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl" }, "\u{1F39B}\uFE0F"), /* @__PURE__ */ React.createElement("h2", { className: "text-base font-black text-white uppercase tracking-wider font-mono" }, "Desglose T\xE9cnico de Sesiones Hist\xF3ricas (Harmonic & Energy Flow)")), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-purple-400" }, setBreakdowns.length, " Sesiones Auditadas")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-5" }, setBreakdowns.map((sb) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: sb.id,
        className: "bg-[#0e0e16] border border-djzinc-800 hover:border-purple-500/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-4 transition-all hover:shadow-[0_4px_24px_rgba(168,85,247,0.15)] group cursor-pointer",
        onClick: () => setReadingArticle({
          id: sb.id,
          title: `${sb.artist} \u2022 ${sb.event}`,
          category: "Set Breakdowns",
          category_badge: "\u{1F39B}\uFE0F AN\xC1LISIS DE SESI\xD3N",
          source: "BeatWave Audio Forensics",
          author: sb.artist,
          date: sb.duration,
          read_time: "5 min an\xE1lisis",
          image_url: sb.image_url,
          summary: `Desglose arm\xF3nico y de sonoridad del set de ${sb.artist} en ${sb.event}.`,
          content: `${sb.tactical_breakdown} Transici\xF3n clave: ${sb.key_transition}`,
          takeaways: [
            `Flujo de BPM: ${sb.bpm_flow}`,
            `Viaje Camelot: ${sb.camelot_journey}`,
            `Sonoridad Integrada: ${sb.lufs_integrated} (Rango din\xE1mico: ${sb.dynamic_range})`,
            `Balance Tri-Banda: ${sb.acoustic_profile}`
          ],
          reference: sb.reference,
          url: "https://www.bbc.co.uk/programmes/b006wkfp",
          key_tags: [sb.artist, "Set Analysis", "Camelot", "LUFS"]
        })
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-djzinc-700 bg-djzinc-900" }, /* @__PURE__ */ React.createElement("img", { src: sb.image_url, alt: sb.artist, className: "w-full h-full object-cover group-hover:scale-105 transition-transform" })), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-[10px] font-mono text-purple-400 font-bold mb-1" }, /* @__PURE__ */ React.createElement("span", null, "\u23F1\uFE0F ", sb.duration), /* @__PURE__ */ React.createElement("span", null, "\u2022"), /* @__PURE__ */ React.createElement("span", null, sb.event)), /* @__PURE__ */ React.createElement("h3", { className: "text-base font-black text-white group-hover:text-purple-300 transition-colors" }, sb.artist), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-1 line-clamp-2" }, sb.tactical_breakdown))),
      /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#12121c] p-2 rounded-lg border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-500 block uppercase" }, "Flujo BPM"), /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400 font-bold text-[11px] truncate block", title: sb.bpm_flow }, sb.bpm_flow)), /* @__PURE__ */ React.createElement("div", { className: "bg-[#12121c] p-2 rounded-lg border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-500 block uppercase" }, "Viaje Camelot"), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold text-[11px] truncate block", title: sb.camelot_journey }, sb.camelot_journey)), /* @__PURE__ */ React.createElement("div", { className: "bg-[#12121c] p-2 rounded-lg border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-500 block uppercase" }, "Sonoridad LUFS"), /* @__PURE__ */ React.createElement("span", { className: "text-amber-400 font-bold text-[11px]" }, sb.lufs_integrated)), /* @__PURE__ */ React.createElement("div", { className: "bg-[#12121c] p-2 rounded-lg border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-500 block uppercase" }, "Tri-Banda %"), /* @__PURE__ */ React.createElement("span", { className: "text-purple-300 font-bold text-[10px] truncate block", title: sb.acoustic_profile }, sb.acoustic_profile.split("(")[0]))),
      /* @__PURE__ */ React.createElement("div", { className: "p-2.5 bg-[#141420] rounded-xl border border-djzinc-800 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "text-[10px] font-mono text-gray-400 mb-0.5" }, "\u26A1 Transici\xF3n Maestra:"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-200 italic font-medium" }, '"', sb.key_transition, '"')),
      /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-djzinc-800 flex items-center justify-between text-[10px] font-mono text-gray-400" }, /* @__PURE__ */ React.createElement("span", { className: "truncate max-w-xs" }, "\u{1F4DA} Ref: ", sb.reference), /* @__PURE__ */ React.createElement("span", { className: "text-purple-400 font-bold group-hover:translate-x-1 transition-transform" }, "Ver Desglose \u2192"))
    )))), selectedCategory === "Entrevistas" && /* @__PURE__ */ React.createElement("div", { className: "p-4 md:p-6 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800 pb-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl" }, "\u{1F399}\uFE0F"), /* @__PURE__ */ React.createElement("h2", { className: "text-base font-black text-white uppercase tracking-wider font-mono" }, "Entrevistas de Cabina & Filosof\xEDa de Mezcla")), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-rose-400" }, interviews.length, " Entrevistas T\xE9cnicas")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" }, interviews.map((it) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: it.id,
        className: "bg-[#0e0e16] border border-djzinc-800 hover:border-rose-500/50 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group cursor-pointer transition-all hover:shadow-[0_4px_24px_rgba(244,63,94,0.15)]",
        onClick: () => setReadingArticle({
          id: it.id,
          title: `${it.artist}: "${it.headline}"`,
          category: "Entrevistas",
          category_badge: "\u{1F399}\uFE0F ENTREVISTA EXCLUSIVA",
          source: it.role,
          author: it.artist,
          date: it.date,
          read_time: it.read_time,
          image_url: it.image_url,
          summary: it.quote,
          content: (it.q_and_a || []).map((qa) => `Pregunta: ${qa.q}

Respuesta: ${qa.a}`).join("\n\n"),
          takeaways: [
            `Artista: ${it.artist} (${it.role})`,
            `Cita Destacada: ${it.quote}`,
            `Referencia Editorial: ${it.reference}`
          ],
          reference: it.reference,
          url: "https://djmag.com/features",
          key_tags: [it.artist, "Interview", "Studio Secrets"]
        })
      },
      /* @__PURE__ */ React.createElement("div", { className: "h-44 w-full relative overflow-hidden bg-djzinc-900" }, /* @__PURE__ */ React.createElement("img", { src: it.image_url, alt: it.artist, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" }), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-[#0e0e16] via-transparent to-black/30" }), /* @__PURE__ */ React.createElement("div", { className: "absolute top-3 left-3" }, /* @__PURE__ */ React.createElement("span", { className: "px-2.5 py-1 rounded-md text-[10px] font-mono font-black uppercase bg-black/80 text-rose-300 border border-rose-500/50" }, it.read_time)), /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-2.5 left-3 right-3 text-white" }, /* @__PURE__ */ React.createElement("div", { className: "text-base font-black drop-shadow" }, it.artist), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] font-mono text-gray-300 drop-shadow truncate" }, it.role))),
      /* @__PURE__ */ React.createElement("div", { className: "p-4 flex-1 flex flex-col justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-bold text-white group-hover:text-rose-300 transition-colors line-clamp-2 leading-snug" }, it.headline), /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-[#13131e] rounded-xl border border-djzinc-800 text-xs italic text-gray-300 line-clamp-3 leading-relaxed" }, it.quote)), /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-djzinc-800 flex items-center justify-between text-[10px] font-mono text-gray-400" }, /* @__PURE__ */ React.createElement("span", { className: "truncate max-w-[160px]", title: it.reference }, "\u{1F4D6} ", it.reference), /* @__PURE__ */ React.createElement("span", { className: "text-rose-400 font-bold group-hover:translate-x-1 transition-transform" }, "Leer Q&A \u2192")))
    )))), selectedCategory === "Radar" && /* @__PURE__ */ React.createElement("div", { className: "p-4 md:p-6 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800 pb-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl" }, "\u{1F4E1}"), /* @__PURE__ */ React.createElement("h2", { className: "text-base font-black text-white uppercase tracking-wider font-mono" }, "Radar Ac\xFAstico & Nuevas Metodolog\xEDas de Cabina")), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-djcyan-400" }, radarItems.length, " Puntos Clave")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-5" }, radarItems.map((rad, rIdx) => /* @__PURE__ */ React.createElement("div", { key: rad.id || rIdx, className: "bg-[#0e0e16] border border-djzinc-800 hover:border-djcyan-500/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-djcyan-950 text-djcyan-300 border border-djcyan-700/60 uppercase" }, "METODOLOG\xCDA #", rIdx + 1), /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-black text-white" }, rad.topic), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 leading-relaxed" }, rad.description)), /* @__PURE__ */ React.createElement("div", { className: "p-2.5 bg-[#12121c] rounded-xl border border-djzinc-800 text-xs font-mono space-y-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-djcyan-400 font-bold" }, "Emparejamiento:"), /* @__PURE__ */ React.createElement("div", { className: "text-gray-300" }, rad.recommended_pairing), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-gray-500 pt-1 border-t border-djzinc-850" }, "Benchmark: ", rad.ratio_benchmark)), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] font-mono text-gray-500 pt-1 border-t border-djzinc-850" }, "Fuente: ", rad.reference))))), (selectedCategory === "todas" || selectedCategory === "Tendencias" || selectedCategory === "Tecnolog\xEDa & Hardware" || selectedCategory === "Lanzamientos & Charts") && /* @__PURE__ */ React.createElement("div", { className: "flex-1 p-4 md:p-6" }, loading ? /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center h-64 gap-3 text-gray-400" }, /* @__PURE__ */ React.createElement("span", { className: "w-8 h-8 border-2 border-djcyan-500 border-t-transparent rounded-full animate-spin" }), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono" }, "Cargando radar de tendencias...")) : filteredItems.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center h-64 gap-3 text-gray-500" }, /* @__PURE__ */ React.createElement("span", { className: "text-3xl" }, "\u{1F4E1}"), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono font-bold text-gray-400" }, "No se encontraron noticias con los filtros actuales"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setSelectedCategory("todas");
          setSearchQuery("");
        },
        className: "text-xs text-djcyan-400 underline cursor-pointer"
      },
      "Restablecer filtros"
    )) : /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" }, filteredItems.map((item) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: item.id,
        className: "bg-[#0e0e16] border border-djzinc-800/90 hover:border-djcyan-500/50 rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-[0_4px_24px_rgba(6,182,212,0.15)] hover:-translate-y-0.5 flex flex-col group cursor-pointer",
        onClick: () => setReadingArticle(item)
      },
      /* @__PURE__ */ React.createElement("div", { className: "h-44 w-full relative overflow-hidden bg-djzinc-900" }, /* @__PURE__ */ React.createElement(
        "img",
        {
          src: item.image_url,
          alt: item.title,
          className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500",
          onError: (e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80";
          }
        }
      ), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-[#0e0e16] via-transparent to-black/30" }), /* @__PURE__ */ React.createElement("div", { className: "absolute top-3 left-3" }, /* @__PURE__ */ React.createElement("span", { className: `px-2.5 py-1 rounded-md text-[9.5px] font-mono font-black uppercase tracking-wider border backdrop-blur-md ${item.badge_color || "bg-djcyan-950/80 text-djcyan-300 border-djcyan-500/50"}` }, item.category_badge || item.category)), /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-2.5 right-3 text-[10px] font-mono text-gray-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur border border-djzinc-800" }, "\u23F1\uFE0F ", item.read_time || "4 min")),
      /* @__PURE__ */ React.createElement("div", { className: "p-4 flex-1 flex flex-col justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[10px] font-mono text-gray-400" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold" }, item.source), /* @__PURE__ */ React.createElement("span", null, item.date)), /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-white group-hover:text-djcyan-300 transition-colors line-clamp-2 leading-snug" }, item.title), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 line-clamp-3 leading-relaxed" }, item.summary)), /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-djzinc-800/80 flex items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1" }, (item.key_tags || []).slice(0, 2).map((tg, idx) => /* @__PURE__ */ React.createElement("span", { key: idx, className: "text-[9px] font-mono px-1.5 py-0.2 rounded bg-djzinc-900 text-gray-400 border border-djzinc-800" }, "#", tg))), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: (e) => {
            e.stopPropagation();
            setReadingArticle(item);
          },
          className: "px-2.5 py-1 bg-djzinc-900 hover:bg-djcyan-950 text-djcyan-400 hover:text-djcyan-300 border border-djzinc-800 hover:border-djcyan-500/60 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-colors"
        },
        /* @__PURE__ */ React.createElement("span", null, "Leer En App"),
        /* @__PURE__ */ React.createElement("span", null, "\u2192")
      )))
    )))), readingArticle && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#0f1019] border border-djcyan-500/50 rounded-2xl max-w-2xl w-full p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col gap-4 relative text-gray-200 max-h-[90vh] overflow-y-auto" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setReadingArticle(null),
        className: "absolute top-3 right-3 z-50 text-white hover:text-white text-sm font-black font-mono cursor-pointer w-9 h-9 rounded-full bg-black/85 hover:bg-red-600 border border-white/30 shadow-2xl flex items-center justify-center transition-all active:scale-90",
        title: "Cerrar art\xEDculo"
      },
      "\u2715"
    ), /* @__PURE__ */ React.createElement("div", { className: "h-56 w-full rounded-xl overflow-hidden relative" }, /* @__PURE__ */ React.createElement(
      "img",
      {
        src: readingArticle.image_url,
        alt: readingArticle.title,
        className: "w-full h-full object-cover"
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-[#0f1019] via-transparent to-black/30" }), /* @__PURE__ */ React.createElement("span", { className: "absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-black/80 text-djcyan-300 border border-djcyan-500/50" }, readingArticle.category_badge || readingArticle.category)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-xs font-mono text-gray-400 mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold" }, readingArticle.source), /* @__PURE__ */ React.createElement("span", null, "\u2022"), /* @__PURE__ */ React.createElement("span", null, readingArticle.date), /* @__PURE__ */ React.createElement("span", null, "\u2022"), /* @__PURE__ */ React.createElement("span", null, readingArticle.read_time)), /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-black text-white" }, readingArticle.title)), /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-djzinc-900/90 border border-djzinc-800 rounded-xl" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-medium text-djcyan-300 leading-relaxed italic" }, '"', readingArticle.summary, '"')), readingArticle.takeaways && readingArticle.takeaways.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "p-3.5 bg-[#12121e] border border-djcyan-500/30 rounded-xl space-y-2" }, /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-mono font-black text-djcyan-400 uppercase tracking-wider flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F3AF}"), /* @__PURE__ */ React.createElement("span", null, "Puntos Clave & Especificaciones T\xE9cnicas:")), /* @__PURE__ */ React.createElement("ul", { className: "space-y-1.5 text-xs text-gray-300 font-mono" }, readingArticle.takeaways.map((tk, idx) => /* @__PURE__ */ React.createElement("li", { key: idx, className: "flex items-start gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400 font-bold shrink-0" }, "\u2713"), /* @__PURE__ */ React.createElement("span", null, tk))))), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-300 leading-relaxed space-y-3 whitespace-pre-line font-sans" }, readingArticle.content), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5 pt-2 border-t border-djzinc-800" }, (readingArticle.key_tags || []).map((tg, idx) => /* @__PURE__ */ React.createElement("span", { key: idx, className: "text-[10px] font-mono px-2 py-0.5 rounded bg-djzinc-900 text-djcyan-300 border border-djzinc-800" }, "#", tg))), /* @__PURE__ */ React.createElement("div", { className: "pt-3 border-t border-djzinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col text-xs font-mono text-gray-400" }, /* @__PURE__ */ React.createElement("span", null, "Redacci\xF3n: ", readingArticle.author || readingArticle.source), readingArticle.reference && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 italic mt-0.5" }, "\u{1F4DA} Ref: ", readingArticle.reference)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, readingArticle.reference && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleCopyReference(readingArticle.reference),
        className: "px-3 py-1.5 bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 text-xs font-mono rounded-lg border border-djzinc-700 transition-colors flex items-center gap-1",
        title: "Copiar cita bibliogr\xE1fica al portapapeles"
      },
      /* @__PURE__ */ React.createElement("span", null, copiedRef ? "\u2713 Copiado" : "\u{1F4CB} Citar")
    ), readingArticle.url && /* @__PURE__ */ React.createElement(
      "a",
      {
        href: readingArticle.url,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "px-4 py-1.5 bg-gradient-to-r from-djcyan-500 to-djcyan-400 text-black font-black text-xs rounded-lg shadow cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
      },
      /* @__PURE__ */ React.createElement("span", null, "Abrir Enlace Web"),
      /* @__PURE__ */ React.createElement("span", null, "\u2197")
    ))))));
  };
  function parseCamelotKey(keyStr) {
    if (!keyStr || keyStr === "--" || keyStr === "?") return null;
    const match = String(keyStr).trim().toUpperCase().match(/^(\d{1,2})([AB])$/);
    if (match) {
      return { num: parseInt(match[1], 10), letter: match[2] };
    }
    return null;
  }
  function getTrackBpm(t) {
    if (!t) return null;
    for (const k of [t.bpm, t.b, t.displayBpm]) {
      if (k !== void 0 && k !== null && k !== "" && k !== "--") {
        const v = parseFloat(k);
        if (!isNaN(v) && v > 40 && v < 250) return Math.round(v * 100) / 100;
      }
    }
    return null;
  }
  function getTrackKey(t) {
    if (!t) return null;
    for (const k of [t.key, t.k, t.tonalidad, t.initial_key]) {
      if (k && k !== "--" && k !== "?" && k !== "N/D") {
        return String(k).trim().toUpperCase();
      }
    }
    return null;
  }
  function getTrackLufs(t) {
    if (!t) return -8.5;
    for (const k of [t.lufs, t.integrated_lufs, t.loudness_lufs]) {
      if (k !== void 0 && k !== null && k !== "" && k !== "--") {
        const v = parseFloat(k);
        if (!isNaN(v) && v < 0) return Math.round(v * 10) / 10;
      }
    }
    return -8.5;
  }
  function evaluateHarmonicTransition(keyA, keyB) {
    const kA = parseCamelotKey(keyA);
    const kB = parseCamelotKey(keyB);
    if (!kA || !kB) {
      return {
        type: "UNKNOWN",
        badge: "\u2753 Tonalidad N/D",
        color: "bg-djzinc-800 text-gray-400 border-djzinc-700",
        score: 50,
        desc: "Una de las pistas no tiene tonalidad Camelot detectada. Audita las pistas para calcular compatibilidad."
      };
    }
    if (kA.num === kB.num && kA.letter === kB.letter) {
      return {
        type: "EXACT",
        badge: "\u{1F7E2} Misma Clave (0)",
        color: "bg-emerald-950/90 text-emerald-300 border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.3)]",
        score: 100,
        desc: "Armon\xEDa perfecta (0): Mismo tono y modo. Fusi\xF3n de bajo y melod\xEDas completamente transparente."
      };
    }
    if (kA.num === kB.num && kA.letter !== kB.letter) {
      return {
        type: "MODAL",
        badge: "\u{1F7E3} Cambio Modal (A\u2194B)",
        color: "bg-purple-950/90 text-purple-300 border-purple-600 shadow-[0_0_8px_rgba(168,85,247,0.3)]",
        score: 95,
        desc: "Giro emocional (A\u2194B): Modulaci\xF3n entre escala menor y mayor relativa."
      };
    }
    const diff = (kB.num - kA.num + 12) % 12;
    if (diff === 1 && kA.letter === kB.letter) {
      return {
        type: "BOOST_PLUS_1",
        badge: "\u26A1 Subida Energ\xEDa (+1)",
        color: "bg-amber-950/90 text-amber-300 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]",
        score: 90,
        desc: "Subida de tensi\xF3n (+1): Inyecci\xF3n natural de energ\xEDa arm\xF3nica en pista."
      };
    }
    if (diff === 11 && kA.letter === kB.letter) {
      return {
        type: "DROP_MINUS_1",
        badge: "\u{1F535} Descenso Suave (-1)",
        color: "bg-cyan-950/90 text-cyan-300 border-cyan-600 shadow-[0_0_8px_rgba(6,182,212,0.3)]",
        score: 85,
        desc: "Descenso suave (-1): Relajaci\xF3n arm\xF3nica hacia tonalidades m\xE1s profundas o oscuras."
      };
    }
    if (diff === 2 && kA.letter === kB.letter) {
      return {
        type: "BOOST_PLUS_2",
        badge: "\u{1F525} Salto Doble (+2)",
        color: "bg-orange-950/90 text-orange-300 border-orange-500",
        score: 75,
        desc: "Salto doble de energ\xEDa (+2): Mezclar en drop o corte percusivo para impacto m\xE1ximo."
      };
    }
    if ((diff === 1 || diff === 11) && kA.letter !== kB.letter) {
      return {
        type: "DIAGONAL",
        badge: "\u{1F537} Diagonal (\xB11 A/B)",
        color: "bg-blue-950/90 text-blue-300 border-blue-600",
        score: 70,
        desc: "Modulaci\xF3n diagonal: Transici\xF3n cruzada arm\xF3nicamente aceptable con frases largas."
      };
    }
    return {
      type: "CLASH",
      badge: "\u26A0\uFE0F Choque Disonante",
      color: "bg-rose-950/90 text-rose-300 border-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.3)]",
      score: 30,
      desc: "Conflicto arm\xF3nico. No solapar sintes o voces; mezclar en secci\xF3n percusiva limpia."
    };
  }
  function evaluateLufsTransition(lufsA, lufsB) {
    const vA = lufsA !== void 0 && lufsA !== null ? parseFloat(lufsA) : -9;
    const vB = lufsB !== void 0 && lufsB !== null ? parseFloat(lufsB) : -9;
    const delta = Math.round((vB - vA) * 10) / 10;
    const absDelta = Math.abs(delta);
    if (absDelta > 2.5) {
      const sign = delta > 0 ? `+${delta}` : `${delta}`;
      const advice = delta > 0 ? `Bajar Trim/Ganancia ~${absDelta} dB en mesa antes de abrir el fader.` : `Subir Trim/Ganancia ~${absDelta} dB para compensar ca\xEDda de volumen.`;
      return {
        isAlert: true,
        delta,
        badge: `\u26A0\uFE0F Salto LUFS ${sign} dB`,
        color: "bg-amber-950/90 text-amber-300 border-amber-600",
        advice
      };
    }
    return {
      isAlert: false,
      delta,
      badge: `\u{1F7E2} LUFS Equilibrado (${delta > 0 ? "+" : ""}${delta} dB)`,
      color: "bg-djzinc-850 text-emerald-400 border-djzinc-700",
      advice: "Sonoridad uniforme sin saltos de volumen en pista."
    };
  }
  function evaluateAntiMuddyTransition(trackA, trackB) {
    const isBassA = (trackA?.low_ratio || 33) >= 45 || trackA?.acoustic_role === "Bass Driver";
    const isBassB = (trackB?.low_ratio || 33) >= 45 || trackB?.acoustic_role === "Bass Driver";
    if (isBassA && isBassB) {
      return {
        isCollision: true,
        badge: "\u26A0\uFE0F Colisi\xF3n Bass (30-80 Hz)",
        color: "bg-red-950/90 text-red-300 border-red-700 animate-pulse",
        advice: "Ambos temas son Bass Drivers. Cortar EQ Low del tema saliente antes del drop para evitar barrizal de graves y cancelaci\xF3n de fase."
      };
    }
    const isCompA = isBassA && (trackB?.acoustic_role === "Vocal / Lead" || trackB?.acoustic_role === "Percussive Tool");
    const isCompB = isBassB && (trackA?.acoustic_role === "Vocal / Lead" || trackA?.acoustic_role === "Percussive Tool");
    if (isCompA || isCompB) {
      return {
        isCollision: false,
        badge: "\u{1F7E2} Espectros Complementarios",
        color: "bg-emerald-950/90 text-emerald-300 border-emerald-700",
        advice: "Mezcla limpia garantizada: Una pista aporta el cuerpo subgrave y la otra rellena medios/agudos sin empastar."
      };
    }
    return {
      isCollision: false,
      badge: "\u{1F535} Espectro Neutro",
      color: "bg-djzinc-850 text-gray-300 border-djzinc-700",
      advice: "Distribuci\xF3n de frecuencias equilibrada."
    };
  }
  var SetBuilderWorkspace = ({
    setTracks = [],
    setSetTracks,
    auditTracks = [],
    setAuditTracks,
    onPlayTrack,
    nowPlayingTrack,
    isPlaying,
    onTogglePlay,
    onNavigateTab,
    lang = "es"
  }) => {
    const [setName, setSetName] = useState("BeatWave_Mainstage_Set");
    const [selectedTrackIdx, setSelectedTrackIdx] = useState(null);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [searchAddQuery, setSearchAddQuery] = useState("");
    const [exportStatus, setExportStatus] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isAuditingSet, setIsAuditingSet] = useState(false);
    const [auditSetProgress, setAuditSetProgress] = useState(0);
    useEffect(() => {
      if (!auditTracks || auditTracks.length === 0 || !setTracks || setTracks.length === 0) return;
      let hasChanges = false;
      const updated = setTracks.map((st) => {
        const found = auditTracks.find(
          (at) => at.id && String(at.id) === String(st.id) || at.path && st.path && at.path === st.path || at.filename && st.filename && at.filename === st.filename
        );
        if (found) {
          const newBpm = found.bpm || found.b;
          const newKey = found.key || found.k;
          const newLufs = found.lufs || found.integrated_lufs;
          const newRole = found.acoustic_role;
          if (newBpm && newBpm !== "--" && st.bpm !== newBpm || newKey && newKey !== "--" && st.key !== newKey || newRole && st.acoustic_role !== newRole) {
            hasChanges = true;
            return {
              ...st,
              ...found,
              bpm: newBpm && newBpm !== "--" ? newBpm : st.bpm,
              key: newKey && newKey !== "--" ? newKey : st.key,
              lufs: newLufs && newLufs !== "--" ? newLufs : st.lufs,
              acoustic_role: newRole || st.acoustic_role || "Balanced Full-Range",
              low_ratio: found.low_ratio || st.low_ratio || 33.3,
              mid_ratio: found.mid_ratio || st.mid_ratio || 33.3,
              high_ratio: found.high_ratio || st.high_ratio || 33.4
            };
          }
        }
        return st;
      });
      if (hasChanges) {
        setSetTracks(updated);
      }
    }, [auditTracks]);
    const stats = useMemo(() => {
      if (!setTracks || setTracks.length === 0) {
        return { totalDurationSec: 0, minBpm: 0, maxBpm: 0, avgBpm: 0, avgLufs: 0, harmonicScore: 100, pendingAuditCount: 0 };
      }
      let totalSec = 0;
      let validBpms = [];
      let validLufs = [];
      let pendingAudit = 0;
      setTracks.forEach((t) => {
        const d = parseFloat(t.duration_sec || t.duration || 0);
        totalSec += d > 0 ? d : 240;
        const b = getTrackBpm(t);
        if (b !== null) {
          validBpms.push(b);
        } else {
          pendingAudit++;
        }
        const l = getTrackLufs(t);
        validLufs.push(l);
      });
      const minBpm = validBpms.length > 0 ? Math.round(Math.min(...validBpms)) : 124;
      const maxBpm = validBpms.length > 0 ? Math.round(Math.max(...validBpms)) : 128;
      const avgBpm = validBpms.length > 0 ? Math.round(validBpms.reduce((a, b) => a + b, 0) / validBpms.length * 10) / 10 : 126;
      const avgLufs = validLufs.length > 0 ? Math.round(validLufs.reduce((a, b) => a + b, 0) / validLufs.length * 10) / 10 : -8.5;
      let totalScore = 0;
      let transitionsCount = Math.max(1, setTracks.length - 1);
      for (let i = 0; i < setTracks.length - 1; i++) {
        const trkA = setTracks[i];
        const trkB = setTracks[i + 1];
        const harm = evaluateHarmonicTransition(getTrackKey(trkA), getTrackKey(trkB));
        totalScore += harm.score;
      }
      const harmonicScore = setTracks.length <= 1 ? 100 : Math.round(totalScore / transitionsCount);
      return { totalDurationSec: totalSec, minBpm, maxBpm, avgBpm, avgLufs, harmonicScore, pendingAuditCount: pendingAudit };
    }, [setTracks]);
    const formattedDuration = useMemo(() => {
      const s = stats.totalDurationSec;
      const hrs = Math.floor(s / 3600);
      const mins = Math.floor(s % 3600 / 60);
      const secs = Math.floor(s % 60);
      if (hrs > 0) {
        return `${hrs}h ${mins < 10 ? "0" : ""}${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
      }
      return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
    }, [stats.totalDurationSec]);
    const handleMoveTrack = (index, direction) => {
      const newIdx = index + direction;
      if (newIdx < 0 || newIdx >= setTracks.length) return;
      const updated = [...setTracks];
      const [moved] = updated.splice(index, 1);
      updated.splice(newIdx, 0, moved);
      setSetTracks(updated);
      setSelectedTrackIdx(newIdx);
    };
    const handleRemoveTrack = (index) => {
      const updated = setTracks.filter((_, i) => i !== index);
      setSetTracks(updated);
      if (selectedTrackIdx === index) setSelectedTrackIdx(null);
    };
    const handleAddTrack = (track) => {
      if (!track) return;
      const normalized = {
        ...track,
        id: track.id || `set_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
        path: track.path || track.filepath || track.f || "",
        f: track.f || track.path || track.filepath || "",
        title: track.title || track.t || track.filename || "Pista",
        t: track.title || track.t || track.filename || "Pista",
        artist: track.artist || track.a || "Artista",
        a: track.artist || track.a || "Artista",
        bpm: getTrackBpm(track) || track.bpm || track.b,
        key: getTrackKey(track) || track.key || track.k,
        lufs: getTrackLufs(track),
        acoustic_role: track.acoustic_role || "Balanced Full-Range",
        low_ratio: track.low_ratio || 33.3,
        mid_ratio: track.mid_ratio || 33.3,
        high_ratio: track.high_ratio || 33.4,
        duration_sec: track.duration_sec || track.duration || 240
      };
      setSetTracks((prev) => [...prev, normalized]);
    };
    const handleClearSet = () => {
      if (window.confirm("\xBFSeguro que deseas vaciar todas las pistas de este set?")) {
        setSetTracks([]);
        setSelectedTrackIdx(null);
      }
    };
    const handleLoadDemoSet = () => {
      if (auditTracks && auditTracks.length >= 3) {
        setSetTracks([...auditTracks.slice(0, 8)]);
        return;
      }
      const demo = [
        {
          id: 101,
          title: "Scorpia (Original Mix)",
          artist: "Marco Bailey",
          bpm: 126,
          key: "8A",
          duration_sec: 390,
          lufs: -8.8,
          acoustic_role: "Bass Driver",
          low_ratio: 48,
          mid_ratio: 32,
          high_ratio: 20,
          format: "FLAC",
          path: "/Users/admin/Music/mi musica/Marco Bailey - Scorpia.flac",
          f: "/Users/admin/Music/mi musica/Marco Bailey - Scorpia.flac"
        },
        {
          id: 102,
          title: "Horny Tiger (Club Edit)",
          artist: "Marco Bailey",
          bpm: 127,
          key: "9A",
          duration_sec: 360,
          lufs: -8.5,
          acoustic_role: "Vocal / Lead",
          low_ratio: 30,
          mid_ratio: 46,
          high_ratio: 24,
          format: "MP3",
          path: "/Users/admin/Music/mi musica/Marco Bailey - Horny Tiger.mp3",
          f: "/Users/admin/Music/mi musica/Marco Bailey - Horny Tiger.mp3"
        },
        {
          id: 103,
          title: "Frostbite (Peak Tool)",
          artist: "Marco Bailey",
          bpm: 128,
          key: "9A",
          duration_sec: 330,
          lufs: -8.4,
          acoustic_role: "Percussive Tool",
          low_ratio: 25,
          mid_ratio: 40,
          high_ratio: 35,
          format: "FLAC",
          path: "/Users/admin/Music/mi musica/Marco Bailey - Frostbite.flac",
          f: "/Users/admin/Music/mi musica/Marco Bailey - Frostbite.flac"
        },
        {
          id: 104,
          title: "From My Mind (Hypnotic Mix)",
          artist: "Marco Bailey",
          bpm: 128,
          key: "10A",
          duration_sec: 375,
          lufs: -7.9,
          acoustic_role: "Bass Driver",
          low_ratio: 49,
          mid_ratio: 31,
          high_ratio: 20,
          format: "FLAC",
          path: "/Users/admin/Music/mi musica/Marco Bailey - From My Mind.flac",
          f: "/Users/admin/Music/mi musica/Marco Bailey - From My Mind.flac"
        },
        {
          id: 105,
          title: "Jungle Laps (Rhythm Driver)",
          artist: "Marco Bailey",
          bpm: 129,
          key: "10A",
          duration_sec: 420,
          lufs: -7.5,
          acoustic_role: "Bass Driver",
          low_ratio: 52,
          mid_ratio: 30,
          high_ratio: 18,
          format: "FLAC",
          path: "/Users/admin/Music/mi musica/Marco Bailey - Jungle Laps.flac",
          f: "/Users/admin/Music/mi musica/Marco Bailey - Jungle Laps.flac"
        },
        {
          id: 106,
          title: "Caliente (Outro Groove)",
          artist: "Marco Bailey",
          bpm: 126,
          key: "9A",
          duration_sec: 345,
          lufs: -8.9,
          acoustic_role: "Balanced Full-Range",
          low_ratio: 35,
          mid_ratio: 35,
          high_ratio: 30,
          format: "FLAC",
          path: "/Users/admin/Music/mi musica/Marco Bailey - Caliente.flac",
          f: "/Users/admin/Music/mi musica/Marco Bailey - Caliente.flac"
        }
      ];
      setSetTracks(demo);
    };
    const handleOptimizeHarmonicFlow = () => {
      if (!setTracks || setTracks.length < 2) return;
      let remaining = [...setTracks];
      remaining.sort((a, b) => {
        const bA = getTrackBpm(a) || 126;
        const bB = getTrackBpm(b) || 126;
        return bA - bB;
      });
      const optimized = [remaining.shift()];
      while (remaining.length > 0) {
        const current = optimized[optimized.length - 1];
        const curBpm = getTrackBpm(current) || 126;
        const curKey = getTrackKey(current) || "";
        let bestIdx = 0;
        let bestScore = -9999;
        for (let i = 0; i < remaining.length; i++) {
          const candidate = remaining[i];
          const candBpm = getTrackBpm(candidate) || curBpm || 126;
          const candKey = getTrackKey(candidate) || "";
          const harm = evaluateHarmonicTransition(curKey, candKey);
          const bpmDiff = Math.abs(candBpm - curBpm);
          const bpmScore = Math.max(0, 100 - bpmDiff * 15);
          const isCurBass = (current.low_ratio || 33) >= 45 || current.acoustic_role === "Bass Driver";
          const isCandBass = (candidate.low_ratio || 33) >= 45 || candidate.acoustic_role === "Bass Driver";
          const antiMuddyScore = isCurBass && isCandBass ? -20 : isCurBass || isCandBass ? 20 : 0;
          const totalAffinity = harm.score * 0.6 + bpmScore * 0.3 + antiMuddyScore;
          if (totalAffinity > bestScore) {
            bestScore = totalAffinity;
            bestIdx = i;
          }
        }
        optimized.push(remaining.splice(bestIdx, 1)[0]);
      }
      setSetTracks(optimized);
      setExportStatus({ type: "success", msg: "\u2713 \xA1Set auto-optimizado! Progresi\xF3n arm\xF3nica y curva de BPM reorganizadas sin choques tonales." });
      setTimeout(() => setExportStatus(null), 4500);
    };
    const handleAuditSetTracks = async () => {
      const paths = setTracks.map((t) => t.path || t.filepath || t.f).filter((p) => Boolean(p));
      if (paths.length === 0) {
        alert("Las pistas del set no cuentan con una ruta de archivo local v\xE1lida para auditar.");
        return;
      }
      setIsAuditingSet(true);
      setAuditSetProgress(15);
      setExportStatus({ type: "loading", msg: `Iniciando auditor\xEDa ac\xFAstica DSP de ${paths.length} pistas del set...` });
      try {
        if (window.eel && window.eel.iniciar_auditoria) {
          const res = await window.eel.iniciar_auditoria(paths)();
          if (res && res.tracks) {
            const mapRes = {};
            res.tracks.forEach((tr) => {
              if (tr.path) mapRes[tr.path] = tr;
              if (tr.id) mapRes[String(tr.id)] = tr;
            });
            const updated = setTracks.map((st) => {
              const found = mapRes[st.path] || mapRes[String(st.id)];
              return found ? { ...st, ...found } : st;
            });
            setSetTracks(updated);
            if (setAuditTracks) {
              setAuditTracks((prev) => {
                const merged = [...prev];
                res.tracks.forEach((newTr) => {
                  const exIdx = merged.findIndex((x) => x.path && x.path === newTr.path || x.id && String(x.id) === String(newTr.id));
                  if (exIdx >= 0) merged[exIdx] = { ...merged[exIdx], ...newTr };
                  else merged.push(newTr);
                });
                return merged;
              });
            }
            setExportStatus({ type: "success", msg: `\u2713 Auditor\xEDa completada: ${res.tracks.length} pistas analizadas con BPM, Camelot Key, LUFS y Roles Espectrales.` });
          }
        } else {
          setExportStatus({ type: "error", msg: "Servicio de auditor\xEDa backend no disponible en este entorno." });
        }
      } catch (err) {
        console.error("Error auditando pistas del set:", err);
        setExportStatus({ type: "error", msg: `Error durante la auditor\xEDa: ${err.message || err}` });
      } finally {
        setIsAuditingSet(false);
        setAuditSetProgress(0);
        setTimeout(() => setExportStatus(null), 5e3);
      }
    };
    const handleAuditSingleTrack = async (track, e) => {
      if (e) e.stopPropagation();
      const pth = track.path || track.filepath || track.f;
      if (!pth) {
        alert("No se encontr\xF3 la ruta del archivo de audio para auditar.");
        return;
      }
      setExportStatus({ type: "loading", msg: `Auditando "${track.title || track.t || "pista"}"...` });
      try {
        if (window.eel && window.eel.iniciar_auditoria) {
          const res = await window.eel.iniciar_auditoria([pth])();
          if (res && res.tracks && res.tracks.length > 0) {
            const audited = res.tracks[0];
            setSetTracks((prev) => prev.map((t) => t.id === track.id || t.path === pth ? { ...t, ...audited } : t));
            if (setAuditTracks) {
              setAuditTracks((prev) => prev.map((t) => t.id === track.id || t.path === pth ? { ...t, ...audited } : t));
            }
            setExportStatus({ type: "success", msg: `\u2713 Pista auditada: ${audited.bpm || "--"} BPM | ${audited.key || "--"} Camelot` });
          }
        }
      } catch (err) {
        setExportStatus({ type: "error", msg: `Error al auditar pista: ${err.message || err}` });
      } finally {
        setTimeout(() => setExportStatus(null), 4e3);
      }
    };
    const handleExportM3U = async () => {
      if (!setTracks || setTracks.length === 0) {
        alert("No hay pistas en el set para exportar.");
        return;
      }
      setIsExporting(true);
      setExportStatus({ type: "loading", msg: "Generando archivo M3U8..." });
      try {
        let res = null;
        if (window.eel && window.eel.exportar_set_m3u) {
          res = await window.eel.exportar_set_m3u(setTracks, setName, "/Users/admin/Music/mi musica")();
        } else {
          const resp = await fetch("/api/setbuilder/export_m3u", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tracks: setTracks, nombre_set: setName, destino_dir: "/Users/admin/Music/mi musica" })
          });
          if (resp.ok) res = await resp.json();
        }
        const lines = ["#EXTM3U", `#PLAYLIST:${setName}`, `#EXTENC:UTF-8`, ""];
        setTracks.forEach((t) => {
          const dur = parseInt(t.duration_sec || t.duration || 240, 10);
          const art = t.artist || t.a || "Desconocido";
          const tit = t.title || t.t || "Pista";
          const pth = t.path || t.filepath || t.f || t.filename || "";
          lines.push(`#EXTINF:${dur},${art} - ${tit}`);
          lines.push(pth);
        });
        const blob = new Blob([lines.join("\n")], { type: "audio/x-mpegurl;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${setName.replace(/\s+/g, "_")}.m3u8`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        const savedPath = res && res.path ? res.path : "Descargado en tu navegador";
        setExportStatus({ type: "success", msg: `\u2713 Set exportado con \xE9xito (${setTracks.length} pistas): ${savedPath}` });
      } catch (e) {
        setExportStatus({ type: "error", msg: `Error al exportar set: ${e.message || e}` });
      } finally {
        setIsExporting(false);
        setTimeout(() => setExportStatus(null), 6e3);
      }
    };
    const isThisTrack = (trk) => {
      if (!nowPlayingTrack || !trk) return false;
      if (trk.id !== void 0 && nowPlayingTrack.id !== void 0 && String(nowPlayingTrack.id) === String(trk.id)) return true;
      if (trk.path && (nowPlayingTrack.path === trk.path || nowPlayingTrack.f === trk.path)) return true;
      if (trk.f && (nowPlayingTrack.f === trk.f || nowPlayingTrack.path === trk.f)) return true;
      if (trk.title && nowPlayingTrack.title && trk.title.toLowerCase() === nowPlayingTrack.title.toLowerCase()) return true;
      return false;
    };
    const renderFlowCanvas = () => {
      if (!setTracks || setTracks.length < 2) {
        return /* @__PURE__ */ React.createElement("div", { className: "h-32 flex flex-col items-center justify-center text-gray-500 font-mono text-xs border border-dashed border-djzinc-800 rounded-xl bg-djzinc-950/40" }, /* @__PURE__ */ React.createElement("span", null, "A\xF1ade al menos 2 pistas para visualizar la curva de BPM y flujo de energ\xEDa."));
      }
      const width = 900;
      const height = 140;
      const padX = 55;
      const padY = 28;
      const validBpms = setTracks.map(getTrackBpm).filter((v) => v !== null);
      const fallbackBpm = validBpms.length > 0 ? Math.round(validBpms.reduce((a, b) => a + b, 0) / validBpms.length) : 126;
      const minB = validBpms.length > 0 ? Math.max(60, Math.floor(Math.min(...validBpms)) - 2) : 122;
      const maxB = validBpms.length > 0 ? Math.min(180, Math.ceil(Math.max(...validBpms)) + 2) : 130;
      const bpmRange = Math.max(2, maxB - minB);
      const points = setTracks.map((t, idx) => {
        const x = padX + idx / Math.max(1, setTracks.length - 1) * (width - 2 * padX);
        const parsedBpm = getTrackBpm(t);
        const bpm = parsedBpm !== null ? parsedBpm : fallbackBpm;
        const y = height - padY - (bpm - minB) / bpmRange * (height - 2 * padY);
        return {
          x: isFinite(x) ? Math.round(x * 10) / 10 : padX,
          y: isFinite(y) ? Math.round(y * 10) / 10 : Math.round(height / 2),
          bpm,
          hasRealBpm: parsedBpm !== null,
          track: t,
          idx
        };
      });
      const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
      const areaPoints = `${padX},${height - padY} ` + polylinePoints + ` ${width - padX},${height - padY}`;
      return /* @__PURE__ */ React.createElement("div", { className: "relative w-full bg-gradient-to-b from-djzinc-900/95 to-[#07070a] border border-djzinc-800 rounded-2xl p-4 shadow-xl overflow-x-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-djcyan-400 animate-ping" }), /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-mono font-bold uppercase tracking-wider text-djcyan-300" }, "Lienzo de Curva de BPM & Flujo de Tensi\xF3n Arm\xF3nica")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 text-[10px] font-mono text-gray-400" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-0.5 bg-djcyan-400 inline-block" }), " Progresi\xF3n BPM (", stats.minBpm, " \u2192 ", stats.maxBpm, ")"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-purple-500 inline-block" }), " Tonalidad Camelot"), /* @__PURE__ */ React.createElement("span", { className: `font-bold ${stats.harmonicScore >= 85 ? "text-emerald-400" : stats.harmonicScore >= 70 ? "text-amber-400" : "text-rose-400"}` }, "Score Arm\xF3nico: ", stats.harmonicScore, "%"))), /* @__PURE__ */ React.createElement("div", { className: "w-full overflow-hidden" }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${width} ${height}`, className: "w-full h-28 sm:h-36 overflow-visible select-none" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "bpmCurveGrad", x1: "0%", y1: "0%", x2: "100%", y2: "0%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#06b6d4" }), /* @__PURE__ */ React.createElement("stop", { offset: "50%", stopColor: "#a855f7" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#ec4899" })), /* @__PURE__ */ React.createElement("linearGradient", { id: "areaFillGrad", x1: "0%", y1: "0%", x2: "0%", y2: "100%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#06b6d4", stopOpacity: "0.25" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#06b6d4", stopOpacity: "0.0" }))), [0, 0.5, 1].map((ratio, i) => {
        const val = Math.round(minB + ratio * bpmRange);
        const yPos = Math.round((height - padY - ratio * (height - 2 * padY)) * 10) / 10;
        if (!isFinite(val) || !isFinite(yPos)) return null;
        return /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("line", { x1: padX, y1: yPos, x2: width - padX, y2: yPos, stroke: "#27272a", strokeDasharray: "3 3" }), /* @__PURE__ */ React.createElement("text", { x: padX - 8, y: yPos + 3, fill: "#71717a", fontSize: "9", fontFamily: "monospace", textAnchor: "end" }, val));
      }), /* @__PURE__ */ React.createElement("polygon", { points: areaPoints, fill: "url(#areaFillGrad)" }), /* @__PURE__ */ React.createElement(
        "polyline",
        {
          points: polylinePoints,
          fill: "none",
          stroke: "url(#bpmCurveGrad)",
          strokeWidth: "3.5",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      ), points.map((p, idx) => {
        const isSelected = selectedTrackIdx === idx;
        const isCurPlaying = isThisTrack(p.track) && isPlaying;
        const keyStr = getTrackKey(p.track);
        return /* @__PURE__ */ React.createElement(
          "g",
          {
            key: idx,
            className: "cursor-pointer group",
            onClick: () => {
              setSelectedTrackIdx(idx);
              if (isThisTrack(p.track)) {
                if (onTogglePlay) onTogglePlay();
              } else if (onPlayTrack) {
                onPlayTrack(p.track, 0, true);
              }
            }
          },
          /* @__PURE__ */ React.createElement(
            "circle",
            {
              cx: p.x,
              cy: p.y,
              r: isSelected || isCurPlaying ? "11" : "6.5",
              fill: isCurPlaying ? "#ec4899" : isSelected ? "#06b6d4" : p.hasRealBpm ? "#18181b" : "#27272a",
              stroke: isCurPlaying ? "#ffffff" : isSelected ? "#38bdf8" : p.hasRealBpm ? "#a855f7" : "#f59e0b",
              strokeWidth: isSelected || isCurPlaying ? "3" : p.hasRealBpm ? "2" : "1.5",
              strokeDasharray: p.hasRealBpm ? "none" : "2 2",
              className: "transition-all duration-200 group-hover:scale-125"
            },
            /* @__PURE__ */ React.createElement("title", null, `Track #${idx + 1}: ${p.track.title || p.track.t || "Pista"} | BPM: ${p.hasRealBpm ? p.bpm : "-- (Sin auditar)"} | Key: ${keyStr || "--"} (Clic para reproducir/pausar)`)
          ),
          (isSelected || isCurPlaying) && /* @__PURE__ */ React.createElement(
            "text",
            {
              x: p.x,
              y: p.y + 3,
              fill: "#ffffff",
              fontSize: "8",
              fontWeight: "black",
              fontFamily: "monospace",
              textAnchor: "middle"
            },
            isCurPlaying ? "\u23F8" : "\u25B6"
          ),
          /* @__PURE__ */ React.createElement(
            "text",
            {
              x: p.x,
              y: p.y - 13,
              fill: isSelected ? "#38bdf8" : p.hasRealBpm ? "#d4d4d8" : "#f59e0b",
              fontSize: "9.5",
              fontWeight: "bold",
              fontFamily: "monospace",
              textAnchor: "middle"
            },
            "#",
            idx + 1
          ),
          /* @__PURE__ */ React.createElement(
            "text",
            {
              x: p.x,
              y: height - padY + 14,
              fill: keyStr ? "#a855f7" : "#71717a",
              fontSize: "9",
              fontWeight: "black",
              fontFamily: "monospace",
              textAnchor: "middle"
            },
            keyStr || "--"
          )
        );
      }))));
    };
    return /* @__PURE__ */ React.createElement("div", { "data-tour": "tour-setbuilder", className: "flex-1 flex flex-col h-full bg-[#08080c] overflow-y-auto text-gray-200 pb-36 md:pb-8" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 md:p-6 border-b border-djzinc-800/80 bg-gradient-to-b from-[#10101a] to-[#08080c] flex flex-col gap-4 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col lg:flex-row lg:items-center justify-between gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "p-1.5 rounded-lg bg-gradient-to-br from-djcyan-500/20 to-purple-500/20 text-djcyan-400 border border-djcyan-500/30" }, /* @__PURE__ */ React.createElement(Icons.Flow, null)), /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-mono font-black tracking-tight text-white uppercase flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", null, "Set-Builder & Energy Flow Canvas"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-djcyan-950 text-djcyan-400 border border-djcyan-800 px-2 py-0.5 rounded-full font-mono font-normal" }, "PRO DJ SET ENGINE"))), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-1 max-w-2xl font-sans" }, "Estructura la progresi\xF3n arm\xF3nica de tu sesi\xF3n en vivo. Visualiza curvas de BPM, transiciones Camelot (+1, -1, cambios modales), saltos de volumen LUFS y alertas Anti-Muddy en tiempo real.")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 flex-wrap" }, stats.pendingAuditCount > 0 && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleAuditSetTracks,
        disabled: isAuditingSet,
        className: "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/30 transition-all active:scale-95 disabled:opacity-40 cursor-pointer animate-pulse",
        title: "Calcula BPM exacto, Tonalidad Camelot, LUFS y Roles Espectrales para las pistas del set sin auditar"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u26A1"),
      /* @__PURE__ */ React.createElement("span", null, isAuditingSet ? "Auditando..." : `Auditar Pistas del Set (${stats.pendingAuditCount} pend.)`)
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleOptimizeHarmonicFlow,
        disabled: setTracks.length < 2 || isAuditingSet,
        className: "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-40 cursor-pointer",
        title: "Reordena autom\xE1ticamente las pistas para maximizar la compatibilidad arm\xF3nica Camelot y progresi\xF3n de BPM"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u26A1"),
      /* @__PURE__ */ React.createElement("span", null, "Auto-Optimizar Pro (Flow Arm\xF3nico)")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleExportM3U,
        disabled: isExporting || setTracks.length === 0,
        className: "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider bg-gradient-to-r from-djcyan-400 to-djcyan-500 hover:from-djcyan-300 hover:to-djcyan-400 text-black shadow-lg shadow-djcyan-500/20 transition-all active:scale-95 disabled:opacity-40 cursor-pointer",
        title: "Exportar archivo M3U8 para Pioneer Rekordbox, Serato DJ Pro, Traktor Pro y VirtualDJ"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4BE}"),
      /* @__PURE__ */ React.createElement("span", null, isExporting ? "Exportando..." : "Exportar Set (.M3U8)")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setIsAddDrawerOpen(true),
        className: "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-djzinc-850 hover:bg-djzinc-800 text-gray-200 border border-djzinc-700 transition-all cursor-pointer"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u2795 A\xF1adir Pistas")
    ), setTracks.length > 0 && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleClearSet,
        className: "px-2.5 py-2 rounded-xl text-xs font-mono text-rose-400 hover:bg-rose-950/50 border border-rose-900/40 transition-all cursor-pointer",
        title: "Vaciar set"
      },
      "\u{1F5D1}\uFE0F"
    ))), exportStatus && /* @__PURE__ */ React.createElement("div", { className: `p-3 rounded-xl border text-xs font-mono flex items-center justify-between animate-fadeIn ${exportStatus.type === "success" ? "bg-emerald-950/80 border-emerald-700 text-emerald-300" : exportStatus.type === "error" ? "bg-rose-950/80 border-rose-700 text-rose-300" : "bg-djcyan-950/80 border-djcyan-700 text-djcyan-300"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, exportStatus.type === "loading" && /* @__PURE__ */ React.createElement("span", { className: "animate-spin text-base" }, "\u2699"), /* @__PURE__ */ React.createElement("span", null, exportStatus.msg)), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setExportStatus(null), className: "text-gray-400 hover:text-white" }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-6 gap-3 pt-2 border-t border-djzinc-800/60" }, /* @__PURE__ */ React.createElement("div", { className: "col-span-2 flex items-center gap-2 bg-djzinc-900/80 border border-djzinc-800 rounded-xl px-3 py-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-400 uppercase" }, "Nombre:"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: setName,
        onChange: (e) => setSetName(e.target.value),
        className: "bg-transparent text-xs font-mono text-white font-bold outline-none flex-1 focus:text-djcyan-300",
        placeholder: "Nombre del Set..."
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/60 border border-djzinc-800 rounded-xl p-2.5 flex flex-col items-center justify-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9.5px] font-mono text-gray-400 uppercase" }, "Pistas"), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-mono font-black text-djcyan-400" }, setTracks.length)), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/60 border border-djzinc-800 rounded-xl p-2.5 flex flex-col items-center justify-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9.5px] font-mono text-gray-400 uppercase" }, "Duraci\xF3n"), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-mono font-black text-purple-300" }, formattedDuration)), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/60 border border-djzinc-800 rounded-xl p-2.5 flex flex-col items-center justify-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9.5px] font-mono text-gray-400 uppercase" }, "Rango BPM"), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-mono font-black text-amber-300" }, stats.minBpm, " - ", stats.maxBpm)), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/60 border border-djzinc-800 rounded-xl p-2.5 flex flex-col items-center justify-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9.5px] font-mono text-gray-400 uppercase" }, "Score Arm\xF3nico"), /* @__PURE__ */ React.createElement("span", { className: `text-sm font-mono font-black ${stats.harmonicScore >= 85 ? "text-emerald-400" : stats.harmonicScore >= 70 ? "text-amber-400" : "text-rose-400"}` }, stats.harmonicScore, "%")))), /* @__PURE__ */ React.createElement("div", { className: "p-3 sm:p-4 md:p-6 flex flex-col gap-5 flex-1 pb-36 md:pb-8" }, renderFlowCanvas(), setTracks.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col items-center justify-center py-16 text-center border border-dashed border-djzinc-800 rounded-2xl bg-djzinc-950/40 p-6" }, /* @__PURE__ */ React.createElement("div", { className: "w-14 h-14 rounded-2xl bg-djzinc-900 flex items-center justify-center text-djcyan-400 mb-4 border border-djzinc-800" }, /* @__PURE__ */ React.createElement(Icons.Flow, null)), /* @__PURE__ */ React.createElement("h3", { className: "text-base font-mono font-bold text-gray-300" }, "Tu Set est\xE1 vac\xEDo"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 max-w-md mt-1 mb-5 font-sans" }, "Agrega pistas desde el bot\xF3n superior o carga una demostraci\xF3n para explorar el an\xE1lisis arm\xF3nico Camelot, compensaci\xF3n LUFS y Anti-Muddy en transiciones."), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleLoadDemoSet,
        className: "px-4 py-2 rounded-xl text-xs font-mono font-bold bg-djcyan-950 hover:bg-djcyan-900 text-djcyan-300 border border-djcyan-700/60 transition-all cursor-pointer shadow"
      },
      "\u{1F3B5} Cargar Set de Demostraci\xF3n"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setIsAddDrawerOpen(true),
        className: "px-4 py-2 rounded-xl text-xs font-mono font-bold bg-djzinc-850 hover:bg-djzinc-800 text-gray-200 border border-djzinc-700 transition-all cursor-pointer"
      },
      "\u2795 A\xF1adir desde Biblioteca"
    ))) : /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-xs font-mono text-gray-400 px-1" }, /* @__PURE__ */ React.createElement("span", null, "SECUENCIA DE LA SESI\xD3N (", setTracks.length, " PISTAS)"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500" }, "Usa las flechas \u25B2 \u25BC para reordenar pistas manualmente")), setTracks.map((track, idx) => {
      const isCurPlaying = isThisTrack(track) && isPlaying;
      const isSelected = selectedTrackIdx === idx;
      const nextTrack = idx < setTracks.length - 1 ? setTracks[idx + 1] : null;
      const trackBpm = getTrackBpm(track);
      const trackKey = getTrackKey(track);
      const trackLufs = getTrackLufs(track);
      const harmTrans = nextTrack ? evaluateHarmonicTransition(trackKey, getTrackKey(nextTrack)) : null;
      const lufsTrans = nextTrack ? evaluateLufsTransition(trackLufs, getTrackLufs(nextTrack)) : null;
      const antiMuddyTrans = nextTrack ? evaluateAntiMuddyTransition(track, nextTrack) : null;
      return /* @__PURE__ */ React.createElement(React.Fragment, { key: `set_trk_${track.id || idx}_${idx}` }, /* @__PURE__ */ React.createElement(
        "div",
        {
          onClick: () => setSelectedTrackIdx(idx),
          className: `p-3 md:p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${isSelected ? "bg-gradient-to-r from-[#141422] to-djzinc-900 border-djcyan-500/80 shadow-[0_0_18px_rgba(6,182,212,0.2)]" : isCurPlaying ? "bg-gradient-to-r from-pink-950/40 to-djzinc-900 border-pink-500 shadow-[0_0_18px_rgba(236,72,153,0.25)]" : "bg-djzinc-900/80 border-djzinc-800 hover:border-djzinc-700"}`
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3.5 flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center gap-0.5" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            disabled: idx === 0,
            onClick: (e) => {
              e.stopPropagation();
              handleMoveTrack(idx, -1);
            },
            className: "w-5 h-5 flex items-center justify-center rounded bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 disabled:opacity-20 text-[10px] cursor-pointer",
            title: "Mover arriba"
          },
          "\u25B2"
        ), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono font-bold text-gray-500" }, "#", idx + 1), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            disabled: idx === setTracks.length - 1,
            onClick: (e) => {
              e.stopPropagation();
              handleMoveTrack(idx, 1);
            },
            className: "w-5 h-5 flex items-center justify-center rounded bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 disabled:opacity-20 text-[10px] cursor-pointer",
            title: "Mover abajo"
          },
          "\u25BC"
        )), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: (e) => {
              e.stopPropagation();
              if (isThisTrack(track)) {
                if (onTogglePlay) onTogglePlay();
              } else if (onPlayTrack) {
                onPlayTrack(track, 0, true);
              }
            },
            className: `w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all cursor-pointer ${isCurPlaying ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.5)]" : "bg-djzinc-850 hover:bg-djzinc-800 text-djcyan-400 border-djzinc-700"}`
          },
          isCurPlaying ? "\u23F8" : "\u25B6"
        ), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-mono font-bold text-white truncate" }, track.title || track.t || track.filename || "Pista sin t\xEDtulo"), track.format && /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono px-1 rounded bg-djzinc-800 text-gray-400" }, track.format)), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-gray-400 truncate font-sans" }, track.artist || track.a || "Artista desconocido"))),
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 sm:gap-2 flex-wrap justify-between md:justify-end w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-djzinc-800/60" }, /* @__PURE__ */ React.createElement("div", { className: "px-2 py-1 rounded-lg bg-djzinc-950 border border-djzinc-800 font-mono text-[11px] text-center min-w-[55px]" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 block text-[8px]" }, "BPM"), /* @__PURE__ */ React.createElement("span", { className: `font-bold ${trackBpm ? "text-white" : "text-amber-400"}` }, trackBpm ? trackBpm.toFixed(1) : "--")), /* @__PURE__ */ React.createElement("div", { className: "px-2 py-1 rounded-lg bg-purple-950/60 border border-purple-800/80 font-mono text-[11px] text-center min-w-[50px]" }, /* @__PURE__ */ React.createElement("span", { className: "text-purple-300 block text-[8px]" }, "KEY"), /* @__PURE__ */ React.createElement("span", { className: `font-black ${trackKey ? "text-purple-200" : "text-gray-500"}` }, trackKey || "--")), /* @__PURE__ */ React.createElement("div", { className: `px-2 py-1 rounded-lg border font-mono text-[10px] text-center min-w-[80px] ${track.acoustic_role === "Bass Driver" ? "bg-rose-950/60 text-rose-300 border-rose-800/80" : track.acoustic_role === "Vocal / Lead" ? "bg-amber-950/60 text-amber-300 border-amber-800/80" : track.acoustic_role === "Percussive Tool" ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/80" : "bg-djzinc-950 text-gray-300 border-djzinc-800"}` }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 block text-[8px]" }, "ROL DSP"), /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, track.acoustic_role === "Bass Driver" ? "\u{1F534} Bass Driver" : track.acoustic_role === "Vocal / Lead" ? "\u{1F7E1} Vocal / Lead" : track.acoustic_role === "Percussive Tool" ? "\u{1F7E2} Percussive" : "\u{1F535} Balanced")), /* @__PURE__ */ React.createElement("div", { className: "px-2 py-1 rounded-lg bg-djzinc-950 border border-djzinc-800 font-mono text-[11px] text-center min-w-[65px]" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 block text-[8px]" }, "LUFS"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-djcyan-400" }, trackLufs, " dB")), (!trackBpm || !trackKey) && /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: (e) => handleAuditSingleTrack(track, e),
            className: "px-2 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 text-[10px] font-mono font-bold cursor-pointer transition-all shadow",
            title: "Auditar ac\xFAsticamente esta pista ahora para detectar BPM y Key"
          },
          "\u26A1 Auditar"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: (e) => {
              e.stopPropagation();
              handleRemoveTrack(idx);
            },
            className: "w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer ml-1",
            title: "Quitar pista del set"
          },
          "\u2715"
        ))
      ), nextTrack && /* @__PURE__ */ React.createElement("div", { className: "mx-1 sm:mx-4 md:mx-10 my-1 p-2 sm:p-2.5 rounded-xl bg-[#0b0b12] border border-djzinc-800/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-500 font-bold" }, "TRANSICI\xD3N #", idx + 1, " \u2794 #", idx + 2, ":"), /* @__PURE__ */ React.createElement("span", { className: `px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${harmTrans.color}`, title: harmTrans.desc }, harmTrans.badge), /* @__PURE__ */ React.createElement("span", { className: `px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${lufsTrans.color}`, title: lufsTrans.advice }, lufsTrans.badge), /* @__PURE__ */ React.createElement("span", { className: `px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${antiMuddyTrans.color}`, title: antiMuddyTrans.advice }, antiMuddyTrans.badge)), /* @__PURE__ */ React.createElement("div", { className: "text-[9.5px] font-mono text-gray-400 flex items-center gap-2" }, harmTrans.type === "UNKNOWN" ? /* @__PURE__ */ React.createElement("span", { className: "text-amber-400 font-bold flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", null, "\u26A0\uFE0F"), " ", /* @__PURE__ */ React.createElement("span", null, "Tonalidad pendiente de auditor\xEDa")) : antiMuddyTrans.isCollision ? /* @__PURE__ */ React.createElement("span", { className: "text-red-400 font-bold flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", null, "\u26A0\uFE0F"), " ", /* @__PURE__ */ React.createElement("span", null, "Cortar EQ Low canal saliente")) : lufsTrans.isAlert ? /* @__PURE__ */ React.createElement("span", { className: "text-amber-400 font-bold flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F39A}\uFE0F"), " ", /* @__PURE__ */ React.createElement("span", null, lufsTrans.delta > 0 ? `Bajar Trim ~${Math.abs(lufsTrans.delta)}dB` : `Subir Trim ~${Math.abs(lufsTrans.delta)}dB`)) : /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400" }, "\u2728 Mezcla fluida garantizada"))));
    }))), isAddDrawerOpen && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#0e0e16] border border-djzinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 border-b border-djzinc-800 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400" }, "\u2795"), /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-mono font-bold text-white uppercase" }, "A\xF1adir Pistas de Auditor\xEDa al Set")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setIsAddDrawerOpen(false),
        className: "text-gray-400 hover:text-white text-sm"
      },
      "\u2715"
    )), /* @__PURE__ */ React.createElement("div", { className: "p-3 border-b border-djzinc-800/80 bg-djzinc-950" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: searchAddQuery,
        onChange: (e) => setSearchAddQuery(e.target.value),
        placeholder: "Filtrar pistas por t\xEDtulo, artista o BPM...",
        className: "w-full bg-djzinc-900 border border-djzinc-750 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-djcyan-500 font-mono"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "p-3 overflow-y-auto flex-1 space-y-2" }, auditTracks.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "text-center py-10 text-gray-400 text-xs font-mono flex flex-col items-center gap-3" }, /* @__PURE__ */ React.createElement("span", null, "No hay pistas cargadas en memoria de Auditor\xEDa."), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: async () => {
          if (window.eel && window.eel.cargar_metadatos_directorio) {
            setExportStatus({ type: "loading", msg: 'Cargando pistas de "mi musica"...' });
            try {
              const res = await window.eel.cargar_metadatos_directorio("/Users/admin/Music/mi musica")();
              if (res && res.tracks && setAuditTracks) {
                setAuditTracks(res.tracks);
                setExportStatus({ type: "success", msg: `\u2713 ${res.tracks.length} pistas cargadas desde "mi musica".` });
              }
            } catch (err) {
              setExportStatus({ type: "error", msg: `Error: ${err.message || err}` });
            } finally {
              setTimeout(() => setExportStatus(null), 3500);
            }
          }
        },
        className: "px-4 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-djcyan-600 to-blue-600 hover:from-djcyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
      },
      '\u{1F4C2} Cargar Pistas de "mi musica"'
    )) : auditTracks.filter((t) => {
      const q = searchAddQuery.toLowerCase();
      return !q || (t.title || t.t || "").toLowerCase().includes(q) || (t.artist || t.a || "").toLowerCase().includes(q) || (t.bpm || t.b || "").toString().includes(q);
    }).map((t) => {
      const isAlreadyInSet = setTracks.some((st) => String(st.id) === String(t.id) || st.path && t.path && st.path === t.path);
      const isTrkPlaying = isThisTrack(t) && isPlaying;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: `audit_add_${t.id || t.path}`,
          className: "p-2.5 rounded-xl bg-djzinc-900/60 border border-djzinc-800/80 flex items-center justify-between gap-3 hover:border-djzinc-700"
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 min-w-0 flex-1" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: (e) => {
              e.stopPropagation();
              if (isThisTrack(t)) {
                if (onTogglePlay) onTogglePlay();
              } else if (onPlayTrack) {
                onPlayTrack(t, 0, true);
              }
            },
            className: `w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border text-[11px] transition-all cursor-pointer ${isTrkPlaying ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white border-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.5)]" : "bg-djzinc-800 hover:bg-djzinc-750 text-djcyan-400 border-djzinc-700"}`,
            title: "Preescuchar pista"
          },
          isTrkPlaying ? "\u23F8" : "\u25B6"
        ), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-mono font-bold text-white truncate" }, t.title || t.t || t.filename || "Pista"), /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-gray-400 truncate" }, t.artist || t.a || "Artista", " \u2022 ", t.bpm || t.b || "--", " BPM \u2022 ", t.key || t.k || "--", " \u2022 ", t.acoustic_role || "Balanced"))),
        /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => handleAddTrack(t),
            className: "px-3 py-1 rounded-lg text-xs font-mono font-bold bg-djcyan-950 hover:bg-djcyan-900 text-djcyan-300 border border-djcyan-700 transition-all cursor-pointer shadow shrink-0"
          },
          isAlreadyInSet ? "+ A\xF1adir Otra Vez" : "+ A\xF1adir"
        )
      );
    })), /* @__PURE__ */ React.createElement("div", { className: "p-3 border-t border-djzinc-800 bg-djzinc-950 flex justify-end" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setIsAddDrawerOpen(false),
        className: "px-4 py-1.5 rounded-xl text-xs font-mono font-bold bg-djzinc-800 text-gray-200 hover:bg-djzinc-700 cursor-pointer"
      },
      "Cerrar"
    )))));
  };
  var KnowledgeWorkspace = ({ lang = "es" }) => {
    const [activeSection, setActiveSection] = useState("courses");
    const [knowledgeData, setKnowledgeData] = useState({
      courses: [],
      videos: [],
      manuals: [],
      glossary: []
    });
    const [loading, setLoading] = useState(true);
    const [expandedCourseId, setExpandedCourseId] = useState("course_01");
    const [glossarySearch, setGlossarySearch] = useState("");
    const fetchKnowledge = async () => {
      try {
        setLoading(true);
        if (window.eel && window.eel.obtener_recursos_conocimiento) {
          const res = await window.eel.obtener_recursos_conocimiento()();
          if (res) setKnowledgeData(res);
        } else {
          const resp = await fetch("/api/knowledge");
          if (resp.ok) {
            const data = await resp.json();
            if (data) setKnowledgeData(data);
          }
        }
      } catch (e) {
        console.error("Error cargando conocimiento:", e);
      } finally {
        setLoading(false);
      }
    };
    useEffect(() => {
      fetchKnowledge();
    }, []);
    const filteredGlossary = useMemo(() => {
      const items = knowledgeData.glossary || [];
      if (!glossarySearch.trim()) return items;
      const q = glossarySearch.toLowerCase();
      return items.filter(
        (g) => (g.term || "").toLowerCase().includes(q) || (g.definition || "").toLowerCase().includes(q) || (g.category || "").toLowerCase().includes(q)
      );
    }, [knowledgeData.glossary, glossarySearch]);
    return /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col h-full bg-[#08080c] overflow-y-auto text-gray-200" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 md:p-6 border-b border-djzinc-800/80 bg-gradient-to-b from-[#10101a] to-[#08080c] flex flex-col gap-4 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "p-2 bg-gradient-to-br from-djcyan-500/20 to-purple-500/20 border border-djcyan-500/40 rounded-xl text-djcyan-400" }, /* @__PURE__ */ React.createElement(Icons.Knowledge, null)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-lg md:text-xl font-black text-white tracking-wide flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", null, "ACADEMIA & CONOCIMIENTO DJ"), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-purple-950 border border-purple-500/50 text-purple-300" }, "PRO MASTERY")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-0.5" }, "Cursos estructurados por niveles, masterclasses en v\xEDdeo, manuales t\xE9cnicos descargables y glosario ac\xFAstico."))), /* @__PURE__ */ React.createElement(
      "a",
      {
        href: "/api/manual/pdf",
        download: "CleanDJmix_PRO_Manual_Funcional_y_Tecnico.pdf",
        className: "px-4 py-2 bg-gradient-to-r from-djcyan-500 to-purple-600 hover:from-djcyan-400 hover:to-purple-500 text-black font-black text-xs rounded-xl shadow-lg shadow-djcyan-500/20 flex items-center gap-2 cursor-pointer transition-transform active:scale-95",
        title: "Descargar el manual completo en formato PDF con capturas de la aplicaci\xF3n y arquitectura de c\xF3digo"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4C4}"),
      /* @__PURE__ */ React.createElement("span", null, "Descargar Manual PDF (8 P\xE1gs)")
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 border-b border-djzinc-800 pt-2 overflow-x-auto scrollbar-none" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setActiveSection("courses"),
        className: `px-4 py-2 text-xs font-mono font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeSection === "courses" ? "border-djcyan-400 text-djcyan-300 bg-djcyan-950/30" : "border-transparent text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F393} Cursos Estructurados"),
      /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded-full text-[9px] bg-djzinc-800 text-gray-300" }, (knowledgeData.courses || []).length)
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setActiveSection("videos"),
        className: `px-4 py-2 text-xs font-mono font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeSection === "videos" ? "border-djcyan-400 text-djcyan-300 bg-djcyan-950/30" : "border-transparent text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4FA} V\xEDdeos & Masterclasses"),
      /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded-full text-[9px] bg-djzinc-800 text-gray-300" }, (knowledgeData.videos || []).length)
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setActiveSection("manuals"),
        className: `px-4 py-2 text-xs font-mono font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeSection === "manuals" ? "border-djcyan-400 text-djcyan-300 bg-djcyan-950/30" : "border-transparent text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4C4} Manuales & Gu\xEDas T\xE9cnicas"),
      /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded-full text-[9px] bg-djzinc-800 text-gray-300" }, (knowledgeData.manuals || []).length)
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setActiveSection("glossary"),
        className: `px-4 py-2 text-xs font-mono font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeSection === "glossary" ? "border-djcyan-400 text-djcyan-300 bg-djcyan-950/30" : "border-transparent text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4D6} Glosario Ac\xFAstico DJ"),
      /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded-full text-[9px] bg-djzinc-800 text-gray-300" }, (knowledgeData.glossary || []).length)
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 p-4 md:p-6" }, activeSection === "courses" && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-5" }, (knowledgeData.courses || []).map((course) => {
      const isExpanded = expandedCourseId === course.id;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: course.id,
          className: "bg-[#0e0e16] border border-djzinc-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between"
        },
        /* @__PURE__ */ React.createElement("div", { className: "h-40 relative bg-djzinc-900" }, /* @__PURE__ */ React.createElement(
          "img",
          {
            src: course.image_url,
            alt: course.title,
            className: "w-full h-full object-cover"
          }
        ), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-[#0e0e16] via-transparent to-black/30" }), /* @__PURE__ */ React.createElement("div", { className: "absolute top-3 left-3" }, /* @__PURE__ */ React.createElement("span", { className: `px-2.5 py-1 rounded-md text-[9.5px] font-mono font-black uppercase tracking-wider border backdrop-blur-md ${course.badge_color}` }, course.level_badge)), /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-2.5 right-3 text-[10px] font-mono text-gray-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur" }, "\u23F1\uFE0F ", course.duration, " \u2022 ", course.lessons_count, " lecciones")),
        /* @__PURE__ */ React.createElement("div", { className: "p-4 flex-1 flex flex-col justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-djcyan-400 font-bold" }, "Instructor: ", course.instructor), /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-white leading-snug" }, course.title), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 leading-relaxed" }, course.description)), isExpanded && /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-djzinc-900/90 rounded-xl border border-djzinc-800 space-y-2 animate-fadeIn" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block" }, "Temario de Lecciones:"), (course.modules || []).map((mod, mIdx) => /* @__PURE__ */ React.createElement("div", { key: mIdx, className: "flex items-center justify-between text-xs py-1 border-b border-djzinc-800/60 last:border-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-300 font-medium" }, mod.title), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-500 shrink-0 ml-2" }, mod.duration)))), /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-djzinc-800 flex items-center justify-between" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setExpandedCourseId(isExpanded ? null : course.id),
            className: "text-xs font-mono text-djcyan-400 hover:text-djcyan-300 cursor-pointer font-bold flex items-center gap-1"
          },
          /* @__PURE__ */ React.createElement("span", null, isExpanded ? "Ocultar Temario" : "Ver Temario Completo"),
          /* @__PURE__ */ React.createElement("span", null, isExpanded ? "\u25B2" : "\u25BC")
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => alert(`Iniciando m\xF3dulo interactivo: ${course.title}`),
            className: "px-3.5 py-1.5 bg-djzinc-800 hover:bg-djcyan-950 text-gray-200 hover:text-djcyan-300 border border-djzinc-700 hover:border-djcyan-500/60 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors"
          },
          "Iniciar Lecci\xF3n \u2192"
        )))
      );
    }))), activeSection === "videos" && /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" }, (knowledgeData.videos || []).map((vid) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: vid.id,
        className: "bg-[#0e0e16] border border-djzinc-800 hover:border-djcyan-500/50 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group"
      },
      /* @__PURE__ */ React.createElement("div", { className: "h-36 relative bg-djzinc-900 overflow-hidden" }, /* @__PURE__ */ React.createElement(
        "img",
        {
          src: vid.thumbnail,
          alt: vid.title,
          className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        }
      ), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-djcyan-500/90 text-black flex items-center justify-center font-bold pl-0.5 shadow-lg group-hover:scale-110 transition-transform" }, "\u25B6")), /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-2 right-2 text-[10px] font-mono text-white bg-black/80 px-1.5 py-0.2 rounded backdrop-blur" }, vid.duration)),
      /* @__PURE__ */ React.createElement("div", { className: "p-3.5 flex-1 flex flex-col justify-between gap-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-djcyan-400 font-bold block" }, vid.category, " \u2022 ", vid.views, " vistas"), /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-bold text-white line-clamp-2 leading-snug" }, vid.title), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 block font-mono" }, "Por ", vid.instructor)), /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-djzinc-800/80 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-1 flex-wrap" }, (vid.tags || []).slice(0, 2).map((tg, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "text-[9px] font-mono px-1 py-0.2 rounded bg-djzinc-900 text-gray-400" }, "#", tg))), /* @__PURE__ */ React.createElement(
        "a",
        {
          href: vid.url,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "px-2.5 py-1 bg-djcyan-950 hover:bg-djcyan-900 text-djcyan-300 border border-djcyan-700/60 rounded text-[10px] font-mono font-bold flex items-center gap-1"
        },
        /* @__PURE__ */ React.createElement("span", null, "Ver"),
        /* @__PURE__ */ React.createElement("span", null, "\u2197")
      )))
    ))), activeSection === "manuals" && /* @__PURE__ */ React.createElement("div", { className: "space-y-5" }, /* @__PURE__ */ React.createElement("div", { className: "p-6 bg-gradient-to-br from-[#0e0e18] via-[#101024] to-[#0a0a14] border-2 border-djcyan-500/60 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-3 max-w-xl" }, /* @__PURE__ */ React.createElement("span", { className: "px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-djcyan-950 text-djcyan-300 border border-djcyan-500/60" }, "DOCUMENTACI\xD3N OFICIAL CERTIFICADA"), /* @__PURE__ */ React.createElement("h3", { className: "text-lg md:text-xl font-black text-white" }, "Manual Funcional y T\xE9cnico Ilustrado CleanDJmix PRO (v2.4.0)"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-300 leading-relaxed" }, "8 p\xE1ginas de ingenier\xEDa que cubren la arquitectura limpia del sistema, el mapa exhaustivo de c\xF3digo en ", /* @__PURE__ */ React.createElement("code", null, "services/"), " y ", /* @__PURE__ */ React.createElement("code", null, "web/"), ", f\xEDsica de tornamesa directa, ecualizador Web Audio API de 3 v\xEDas, detecci\xF3n SuperFLAC, endpoints REST y resultados de la suite Pytest (117 tests superados)."), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4 text-xs font-mono text-gray-400" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4C4} Formato: PDF Corporativo A4"), /* @__PURE__ */ React.createElement("span", null, "\u2022"), /* @__PURE__ */ React.createElement("span", null, "\u{1F4CA} 8 P\xE1ginas Ilustradas"), /* @__PURE__ */ React.createElement("span", null, "\u2022"), /* @__PURE__ */ React.createElement("span", null, "\u{1F4BE} ~2.1 MB"))), /* @__PURE__ */ React.createElement(
      "a",
      {
        href: "/api/manual/pdf",
        download: "CleanDJmix_PRO_Manual_Funcional_y_Tecnico.pdf",
        className: "px-6 py-3 bg-gradient-to-r from-djcyan-400 via-sky-400 to-purple-500 hover:from-djcyan-300 hover:to-purple-400 text-black font-black text-sm rounded-xl shadow-lg shadow-djcyan-500/30 flex items-center gap-2.5 cursor-pointer transition-transform active:scale-95 shrink-0"
      },
      /* @__PURE__ */ React.createElement("span", { className: "text-base" }, "\u{1F4E5}"),
      /* @__PURE__ */ React.createElement("span", null, "Descargar Manual PDF")
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" }, (knowledgeData.manuals || []).slice(1).map((man) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: man.id,
        className: "p-4 bg-[#0e0e16] border border-djzinc-800 rounded-xl flex flex-col justify-between gap-3 shadow"
      },
      /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("span", { className: `px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${man.badge_color}` }, man.badge), /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-bold text-white leading-snug" }, man.title), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-gray-400 leading-relaxed" }, man.description)),
      /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-djzinc-800 flex items-center justify-between text-[10px] font-mono text-gray-400" }, /* @__PURE__ */ React.createElement("span", null, man.format, " \u2022 ", man.pages), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => alert(`Consultando especificaci\xF3n t\xE9cnica: ${man.title}`),
          className: "text-djcyan-400 hover:underline font-bold cursor-pointer"
        },
        "Consultar \u2192"
      ))
    )))), activeSection === "glossary" && /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-3 max-w-md" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: glossarySearch,
        onChange: (e) => setGlossarySearch(e.target.value),
        placeholder: "Filtrar t\xE9rminos (ej. LUFS, Camelot, Zero-Crossing)...",
        className: "w-full bg-[#0d0d15] border border-djzinc-800 rounded-lg px-3 py-1.5 text-xs text-gray-200 outline-none focus:border-djcyan-500 font-mono"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" }, filteredGlossary.map((term, tIdx) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: tIdx,
        className: "p-4 bg-[#0e0e16] border border-djzinc-800/80 rounded-xl space-y-1.5 shadow"
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-black text-djcyan-300 font-mono" }, term.term), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono px-2 py-0.5 rounded bg-djzinc-900 text-gray-400 border border-djzinc-800" }, term.category)),
      /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-300 leading-relaxed" }, term.definition)
    ))))));
  };
  var CommercialBeatEngine = class {
    constructor() {
      this.ctx = null;
      this.timer = null;
      this.isPlaying = false;
      this.isMuted = false;
      this.step = 0;
    }
    init() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
      } catch (e) {
        console.warn("AudioContext error:", e);
      }
    }
    start() {
      if (!this.ctx) this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      this.isPlaying = true;
      this.step = 0;
      this.scheduleTick();
    }
    scheduleTick() {
      if (!this.isPlaying || !this.ctx) return;
      const bpm = 126;
      const stepInterval = 60 / bpm / 4;
      this.playStep(this.step);
      this.step = (this.step + 1) % 16;
      this.timer = setTimeout(() => this.scheduleTick(), stepInterval * 1e3);
    }
    playStep(s) {
      if (this.isMuted || !this.ctx) return;
      const now = this.ctx.currentTime;
      if (s % 4 === 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(135, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.12);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
      if (s % 4 === 2) {
        const bufSize = Math.floor(this.ctx.sampleRate * 0.04);
        const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.25));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(7500, now);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.05);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
      }
      if (s % 2 === 0 && s % 4 !== 0) {
        const bass = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        const bFilter = this.ctx.createBiquadFilter();
        bass.type = "sawtooth";
        bass.frequency.setValueAtTime(55, now);
        bFilter.type = "lowpass";
        bFilter.frequency.setValueAtTime(280, now);
        bGain.gain.setValueAtTime(0.35, now);
        bGain.gain.exponentialRampToValueAtTime(1e-3, now + 0.16);
        bass.connect(bFilter);
        bFilter.connect(bGain);
        bGain.connect(this.ctx.destination);
        bass.start(now);
        bass.stop(now + 0.18);
      }
    }
    setMuted(m) {
      this.isMuted = m;
    }
    stop() {
      this.isPlaying = false;
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }
    destroy() {
      this.stop();
      if (this.ctx && this.ctx.state !== "closed") {
        try {
          this.ctx.close();
        } catch (e) {
        }
      }
      this.ctx = null;
    }
  };
  var COMMERCIAL_SCENES = [
    {
      id: "fft_fake",
      startSec: 0,
      endSec: 12,
      badge: "01/05 \u2022 INGESTA H\xCDBRIDA & RADAR FFT",
      tag: "DETECCI\xD3N FAKE LOSSLESS",
      title: "\xA1NUNCA M\xC1S UN MP3 DISFRAZADO EN FESTIVAL!",
      hook: "Transformada R\xE1pida de Fourier (FFT) en proceso multihilo as\xEDncrono",
      description: "Muchos DJs descargan supuestos WAV o FLAC que son ripeos inflados desde MP3 a 128 kbps. CleanDJmix analiza el espectro al milisegundo: si corta en seco a 16 kHz, activa la alerta roja y busca el master oficial original en la pasarela SuperFLAC.",
      metricLabel: "CORTE FFT DETECTADO",
      metricVal: "16.0 kHz \u274C FAKE",
      metricSuccess: "22.05 kHz \u2713 LOSSLESS REAL",
      accent: "from-red-500 via-amber-500 to-djcyan-400"
    },
    {
      id: "anti_muddy",
      startSec: 12,
      endSec: 24,
      badge: "02/05 \u2022 ESCUDO ANTI-MUDDY TRI-BANDA",
      tag: "BALANCE ESPECTRAL CABINA",
      title: "PROTEGE TU MEZCLA DE LA COLISI\xD3N DE GRAVES",
      hook: "Ratio de Energ\xEDa Espectral Tri-Banda (Low / Mid / High %)",
      description: "El error n\xFAmero 1 al mezclar es solapar dos pistas con excesiva carga de subgraves (30-80 Hz). La app calcula la densidad espectral de cada tema y clasifica su Rol Ac\xFAstico: Bass Driver, Vocal/Lead o Percussive Tool para mezclas limpias y potentes.",
      metricLabel: "DISTRIBUCI\xD3N TRI-BANDA",
      metricVal: "LOW: 45% | MID: 35% | HI: 20%",
      metricSuccess: "ROL: BASS DRIVER (COMPLEMENTARIO)",
      accent: "from-cyan-500 via-blue-500 to-emerald-400"
    },
    {
      id: "hot_cues",
      startSec: 24,
      endSec: 36,
      badge: "03/05 \u2022 8 HOT CUES & AUTO-MAPPING",
      tag: "ESTRUCTURA DE CLUB EXTENDED",
      title: "TUS 8 PADS LISTOS EN MENOS DE 1 SEGUNDO",
      hook: "Auto-Mapping algor\xEDtmico a 16 y 32 compases",
      description: "Se acab\xF3 colocar cues a mano tema por tema en librer\xEDas de 2.000 pistas. Con un clic, la app detecta el primer beat y mapea la plantilla Club: Pad 1 Intro, Pad 2 Percusi\xF3n, Pad 3 Breakdown, Pad 4 Drop, Pads 5-6 Loops de 16/32c y Pads 7-8 Outro con colores oficiales RGB.",
      metricLabel: "CUANTIZACI\xD3N DE FRASE",
      metricVal: "16 & 32 COMPASES (AUTO)",
      metricSuccess: "8 PADS RGB SERATO & REKORDBOX",
      accent: "from-emerald-400 via-teal-400 to-cyan-400"
    },
    {
      id: "set_builder",
      startSec: 36,
      endSec: 48,
      badge: "04/05 \u2022 SET-BUILDER & FLUJO ARM\xD3NICO",
      tag: "CAMELOT WHEEL & ENERGY CURVE",
      title: "DISE\xD1A EL VIAJE SONORO PERFECTO DE TU SESI\xD3N",
      hook: "Canvas interactivo con visualizaci\xF3n de curva de energ\xEDa",
      description: "Un DJ improvisando sin rumbo se pierde. Arrastra temas al canvas interactivo y la app dibuja la progresi\xF3n de BPM y energ\xEDa en tiempo real, advirti\xE9ndote al instante de saltos arm\xF3nicos bruscos o ca\xEDdas de din\xE1mica para mantener la pista de baile en llamas.",
      metricLabel: "COMPATIBILIDAD TONAL",
      metricVal: "CAMELOT: 8A \u2192 9A (+1 COMPATIBLE)",
      metricSuccess: "CURVA DE ENERG\xCDA: ASCENDENTE (126 \u2192 128 BPM)",
      accent: "from-purple-500 via-pink-500 to-djcyan-400"
    },
    {
      id: "export",
      startSec: 48,
      endSec: 60,
      badge: "05/05 \u2022 EXPORTACI\xD3N NATIVA ZERO-LATENCY",
      tag: "COMPATIBILIDAD SERATO & REKORDBOX",
      title: "DE TU PORT\xC1TIL A LA CABINA EN UN SOLO CLIC",
      hook: "Paridad binaria Serato GEOB Markers2 y Rekordbox XML",
      description: "Exportaci\xF3n nativa inmediata para Pioneer DJ (rekordbox.xml) y Serato DJ Pro (.crate). Conecta tu USB al mixer o a los CDJs y tendr\xE1s todos tus Hot Cues, beatgrids decimales, car\xE1tulas y etiquetas listos para tocar en directo sin ning\xFAn paso extra.",
      metricLabel: "COMPATIBILIDAD DE HARDWARE",
      metricVal: "SERATO DJ PRO (.crate) + PIONEER CDJ (XML)",
      metricSuccess: "PARIDAD GEOB 100% CERTIFICADA",
      accent: "from-djcyan-400 via-emerald-400 to-amber-400"
    }
  ];
  var TOUR_STEPS = [
    {
      id: "audit-select",
      target: "tour-audit-select",
      tab: "audit",
      badge: "PASO 1 DE 5 \u2022 INGESTA H\xCDBRIDA",
      icon: "\u{1F4C2}",
      title: "Selecci\xF3n H\xEDbrida de Carpetas & Pistas",
      description: "Navega libremente por tu biblioteca y a\xF1ade carpetas enteras o pistas sueltas sin perder tu selecci\xF3n previa en la cesta. Toda la ingesta se ejecuta con procesos as\xEDncronos multihilo sin congelar la interfaz.",
      tip: "Pulsa '\u{1F4C2} Seleccionar' para explorar carpetas, marcar pistas y cargar todo en conjunto."
    },
    {
      id: "audit-table",
      target: "tour-audit-table",
      tab: "audit",
      badge: "PASO 2 DE 5 \u2022 INTELIGENCIA AC\xDASTICA",
      icon: "\u26A1",
      title: "FFT Anti-Muddy & Rol Ac\xFAstico",
      description: "An\xE1lisis espectral por FFT para cazar falsos Lossless (cortes a 16 kHz), medici\xF3n EBU R128 LUFS y c\xE1lculo del Ratio Tri-Banda (Low 20-250Hz, Mid 250-4kHz, High 4-20kHz).",
      tip: "La columna 'Rol Ac\xFAstico' clasifica cada tema como Bass Driver, Vocal/Lead o Percussive para mezclar sin colisi\xF3n de frecuencias."
    },
    {
      id: "hotcues-deck",
      target: "tour-hotcues-deck",
      tab: "hotcues",
      badge: "PASO 3 DE 5 \u2022 HARDWARE HOT CUES",
      icon: "\u{1F39B}\uFE0F",
      title: "8 Pads RGB con Auto-Mapping de Frase",
      description: "Cabina t\xE1ctil profesional con 8 pads RGB, pitch fader de rango dual y forma de onda 64x. El motor de Auto-Mapping detecta el downbeat y cuantiza autom\xE1ticamente Drops, Breaks y Loops a 16 y 32 compases.",
      tip: "Pulsa 'Auto-Generate Cues (Club)' para poblar los 8 pads con offsets cuantizados en 1 segundo."
    },
    {
      id: "setbuilder",
      target: "tour-setbuilder",
      tab: "setbuilder",
      badge: "PASO 4 DE 5 \u2022 FLUJO ARM\xD3NICO",
      icon: "\u{1F5FA}\uFE0F",
      title: "Set-Builder & Curva de Energ\xEDa",
      description: "Canvas interactivo donde dise\xF1as la narrativa de tu noche. Visualiza la curva de energ\xEDa din\xE1mica y las transiciones tonales en la Rueda Camelot para evitar saltos bruscos o ca\xEDdas de ritmo.",
      tip: "Arrastra y organiza tus bloques de pistas para comprobar la compatibilidad arm\xF3nica en tiempo real."
    },
    {
      id: "export-crates",
      target: "tour-export-crates",
      tab: "audit",
      badge: "PASO 5 DE 5 \u2022 EXPORTACI\xD3N CLUB",
      icon: "\u{1F680}",
      title: "Exportaci\xF3n Directa a Serato & Rekordbox",
      description: "Exporta tus listas y cues a Serato DJ Pro (.crate con paridad binaria GEOB Markers2) o Rekordbox XML para Pioneer CDJ en cero latencia.",
      tip: "Tus Hot Cues con colores oficiales y grids milim\xE9tricos se escriben directamente en tu USB para el soundsystem."
    }
  ];
  var CommercialTeaserModal = ({ isOpen, onClose, onOpenTour }) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const beatEngineRef = useRef(null);
    useEffect(() => {
      if (!isOpen) return;
      const engine = new CommercialBeatEngine();
      beatEngineRef.current = engine;
      engine.init();
      if (isPlaying && !isMuted) {
        engine.start();
      }
      return () => {
        if (beatEngineRef.current) {
          beatEngineRef.current.destroy();
          beatEngineRef.current = null;
        }
      };
    }, [isOpen]);
    useEffect(() => {
      if (!isOpen || !isPlaying) {
        if (beatEngineRef.current) beatEngineRef.current.stop();
        return;
      }
      if (beatEngineRef.current && !beatEngineRef.current.isPlaying && !isMuted) {
        beatEngineRef.current.start();
      }
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= 60) {
            setIsPlaying(false);
            if (beatEngineRef.current) beatEngineRef.current.stop();
            return 60;
          }
          return Math.round((prev + 0.1) * 10) / 10;
        });
      }, 100);
      return () => clearInterval(interval);
    }, [isOpen, isPlaying, isMuted]);
    if (!isOpen) return null;
    const currentScene = COMMERCIAL_SCENES.find((s) => currentTime >= s.startSec && currentTime < s.endSec) || COMMERCIAL_SCENES[COMMERCIAL_SCENES.length - 1];
    const isFinished = currentTime >= 60;
    const handleTogglePlay = () => {
      if (isFinished) {
        setCurrentTime(0);
        setIsPlaying(true);
        if (beatEngineRef.current && !isMuted) beatEngineRef.current.start();
      } else {
        setIsPlaying((prev) => !prev);
      }
    };
    const handleToggleMute = () => {
      const nextMute = !isMuted;
      setIsMuted(nextMute);
      if (beatEngineRef.current) {
        beatEngineRef.current.setMuted(nextMute);
        if (!nextMute && isPlaying && !beatEngineRef.current.isPlaying) {
          beatEngineRef.current.start();
        }
      }
    };
    const handleSeek = (sec) => {
      setCurrentTime(sec);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-[9990] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-full max-w-4xl bg-[#0a0a12] border border-djcyan-500/50 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.35)] overflow-hidden flex flex-col max-h-[92vh]" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 sm:p-5 border-b border-djzinc-800 bg-djzinc-950/90 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "w-3 h-3 rounded-full bg-red-500 animate-ping" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono tracking-widest text-djcyan-400 font-black uppercase block" }, "DEMO OFICIAL EN 60 SEGUNDOS \u2022 CLEANDJMIX PRO"), /* @__PURE__ */ React.createElement("h2", { className: "text-base sm:text-lg font-black text-white" }, currentScene.tag))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleToggleMute,
        className: `px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${!isMuted ? "bg-djcyan-500/20 text-djcyan-300 border border-djcyan-500/50" : "bg-djzinc-800 text-gray-400 hover:text-white"}`,
        title: isMuted ? "Activar audio synth club" : "Silenciar audio synth"
      },
      /* @__PURE__ */ React.createElement("span", null, !isMuted ? "\u{1F50A}" : "\u{1F507}"),
      /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline" }, !isMuted ? "Audio Club ON" : "Mudo")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onClose,
        className: "p-1.5 rounded-lg bg-djzinc-800 hover:bg-djzinc-700 text-gray-400 hover:text-white cursor-pointer transition-colors",
        title: "Cerrar reproductor"
      },
      "\u2715"
    ))), /* @__PURE__ */ React.createElement("div", { className: "relative flex-1 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto bg-gradient-to-b from-[#0e0e18] via-[#0a0a14] to-[#05050a]" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 flex-wrap mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, COMMERCIAL_SCENES.map((sc, sIdx) => {
      const isActive = currentScene.id === sc.id;
      const isPassed = currentTime >= sc.endSec;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: sc.id,
          type: "button",
          onClick: () => handleSeek(sc.startSec),
          className: `h-2 rounded-full transition-all cursor-pointer ${isActive ? "w-10 sm:w-16 bg-gradient-to-r from-djcyan-400 to-djcyan-500 shadow-[0_0_10px_#06b6d4]" : isPassed ? "w-6 bg-djcyan-800" : "w-4 bg-djzinc-800 hover:bg-gray-600"}`,
          title: `Saltar a: ${sc.badge}`
        }
      );
    })), /* @__PURE__ */ React.createElement("div", { className: "px-3 py-1 rounded-full bg-djzinc-900 border border-djzinc-800 text-xs font-mono font-bold text-djcyan-300 flex items-center gap-1.5 shadow-sm" }, /* @__PURE__ */ React.createElement("span", null, "\u23F1\uFE0F"), /* @__PURE__ */ React.createElement("span", null, Math.floor(currentTime), "s / 60s"))), /* @__PURE__ */ React.createElement("div", { className: "space-y-4 my-auto" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono font-black uppercase tracking-widest text-djcyan-400 bg-djcyan-950/80 px-3 py-1 rounded-md border border-djcyan-500/40 inline-block shadow-sm" }, currentScene.badge), /* @__PURE__ */ React.createElement("h1", { className: "text-xl sm:text-3xl font-black text-white tracking-tight uppercase leading-tight max-w-2xl drop-shadow-md" }, currentScene.title), /* @__PURE__ */ React.createElement("p", { className: "text-xs sm:text-sm font-mono font-bold text-djcyan-300 flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", null, "\u26A1"), /* @__PURE__ */ React.createElement("span", null, currentScene.hook)), /* @__PURE__ */ React.createElement("p", { className: "text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl" }, currentScene.description), /* @__PURE__ */ React.createElement("div", { className: "p-4 rounded-2xl bg-djzinc-950/90 border border-djzinc-800/90 shadow-xl max-w-xl flex flex-col gap-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 font-bold uppercase tracking-wider" }, currentScene.metricLabel), /* @__PURE__ */ React.createElement("span", { className: "text-red-400 font-bold" }, currentScene.metricVal)), /* @__PURE__ */ React.createElement("div", { className: "h-10 flex items-end gap-1.5 px-2 py-1 bg-black/60 rounded-lg border border-djzinc-850" }, [40, 65, 85, 95, 80, 60, 45, 90, 75, 50, 30, 20, 15].map((h, i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: i,
        className: `flex-1 rounded-t transition-all duration-150 ${i < 4 ? "bg-red-500" : i < 8 ? "bg-amber-400" : "bg-djcyan-400"}`,
        style: {
          height: isPlaying ? `${Math.max(15, Math.min(100, h * (0.6 + Math.random() * 0.5)))}%` : `${h}%`
        }
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[11px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400 font-bold flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" }), currentScene.metricSuccess), /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[10px]" }, "VERIFICACI\xD3N 100% HARDWARE")))), /* @__PURE__ */ React.createElement("div", { className: "pt-4 mt-6 border-t border-djzinc-800/80 flex flex-col gap-3" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "relative w-full h-3 bg-djzinc-950 rounded-full overflow-hidden border border-djzinc-800 cursor-pointer group",
        onClick: (e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          handleSeek(Math.round(pct * 60));
        }
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "h-full bg-gradient-to-r from-djcyan-400 via-emerald-400 to-amber-400 transition-all duration-100 ease-linear shadow-[0_0_15px_#06b6d4]",
          style: { width: `${currentTime / 60 * 100}%` }
        }
      )
    ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between flex-wrap gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleTogglePlay,
        className: "px-4 py-2 rounded-xl bg-gradient-to-r from-djcyan-400 to-djcyan-500 hover:from-djcyan-300 hover:to-djcyan-400 text-black font-black text-xs cursor-pointer shadow-lg shadow-djcyan-500/30 flex items-center gap-1.5 active:scale-95 transition-all"
      },
      /* @__PURE__ */ React.createElement("span", null, isFinished ? "\u{1F504}" : isPlaying ? "\u23F8" : "\u25B6"),
      /* @__PURE__ */ React.createElement("span", null, isFinished ? "Repetir Teaser" : isPlaying ? "Pausar" : "Reanudar")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleSeek(0),
        className: "px-3 py-2 rounded-xl bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 font-bold text-xs cursor-pointer",
        title: "Volver al inicio (00:00)"
      },
      "\u23EE 00s"
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          onClose();
          if (onOpenTour) onOpenTour();
        },
        className: "px-4 py-2 rounded-xl bg-djzinc-800 hover:bg-djzinc-750 text-djcyan-400 border border-djcyan-500/40 font-black text-xs cursor-pointer flex items-center gap-1.5 transition-all"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F3AF}"),
      /* @__PURE__ */ React.createElement("span", null, "Hacer Tour Paso a Paso en Cabina")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onClose,
        className: "px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-black text-xs cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
      },
      "\u{1F3A7} Entrar a la Aplicaci\xF3n"
    )))))));
  };
  var SpotlightTourOverlay = ({ isOpen, onClose, activeTab, setActiveTab, onOpenTeaser }) => {
    const [stepIdx, setStepIdx] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const curStep = TOUR_STEPS[stepIdx];
    const isLast = stepIdx === TOUR_STEPS.length - 1;
    useEffect(() => {
      if (!isOpen || !curStep) return;
      if (curStep.tab && activeTab !== curStep.tab && setActiveTab) {
        setActiveTab(curStep.tab);
      }
    }, [stepIdx, isOpen]);
    const updateTargetRect = () => {
      if (!curStep) return;
      const el = document.querySelector(`[data-tour="${curStep.target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        setTargetRect({
          x: Math.max(8, r.left),
          y: Math.max(8, r.top),
          w: r.width,
          h: r.height
        });
      } else {
        setTargetRect(null);
      }
    };
    useEffect(() => {
      if (!isOpen) return;
      updateTargetRect();
      const t1 = setTimeout(updateTargetRect, 80);
      const t2 = setTimeout(updateTargetRect, 250);
      const t3 = setTimeout(updateTargetRect, 600);
      window.addEventListener("resize", updateTargetRect);
      window.addEventListener("scroll", updateTargetRect, true);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        window.removeEventListener("resize", updateTargetRect);
        window.removeEventListener("scroll", updateTargetRect, true);
      };
    }, [stepIdx, isOpen, activeTab]);
    if (!isOpen) return null;
    const handleFinish = () => {
      if (dontShowAgain) {
        try {
          localStorage.setItem("cleandjmix_tutorial_completed", "true");
        } catch (e) {
        }
      }
      onClose();
    };
    let tooltipStyle = {};
    if (targetRect) {
      const spaceBelow = window.innerHeight - (targetRect.y + targetRect.h);
      const spaceAbove = targetRect.y;
      const placeBelow = spaceBelow >= 260 || spaceBelow >= spaceAbove;
      const top = placeBelow ? Math.min(window.innerHeight - 300, targetRect.y + targetRect.h + 16) : Math.max(20, targetRect.y - 300);
      const left = Math.max(16, Math.min(window.innerWidth - 400, targetRect.x + targetRect.w / 2 - 190));
      tooltipStyle = {
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        maxWidth: "390px",
        width: "calc(100vw - 32px)",
        zIndex: 9999
      };
    } else {
      tooltipStyle = {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: "420px",
        width: "calc(100vw - 32px)",
        zIndex: 9999
      };
    }
    return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-[9990] animate-fadeIn" }, /* @__PURE__ */ React.createElement("svg", { className: "fixed inset-0 w-full h-full pointer-events-none", style: { zIndex: 9991 } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("mask", { id: "tour-spotlight-mask" }, /* @__PURE__ */ React.createElement("rect", { x: "0", y: "0", width: "100%", height: "100%", fill: "white" }), targetRect && /* @__PURE__ */ React.createElement(
      "rect",
      {
        x: targetRect.x - 6,
        y: targetRect.y - 6,
        width: targetRect.w + 12,
        height: targetRect.h + 12,
        rx: "14",
        fill: "black"
      }
    ))), /* @__PURE__ */ React.createElement(
      "rect",
      {
        x: "0",
        y: "0",
        width: "100%",
        height: "100%",
        fill: "rgba(0, 0, 0, 0.85)",
        mask: "url(#tour-spotlight-mask)"
      }
    )), targetRect && /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          position: "fixed",
          left: targetRect.x - 6,
          top: targetRect.y - 6,
          width: targetRect.w + 12,
          height: targetRect.h + 12,
          borderRadius: "14px",
          border: "2px solid #06b6d4",
          boxShadow: "0 0 35px rgba(6, 182, 212, 0.85), inset 0 0 15px rgba(6, 182, 212, 0.4)",
          pointerEvents: "none",
          zIndex: 9992,
          transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        },
        className: "animate-pulse"
      }
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        style: tooltipStyle,
        className: "bg-[#0b0c14] border border-djcyan-500/60 shadow-[0_0_50px_rgba(6,182,212,0.35)] rounded-2xl p-5 text-gray-200 flex flex-col gap-3.5 animate-fadeIn"
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800 pb-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl" }, curStep.icon), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono tracking-widest text-djcyan-400 font-black uppercase" }, curStep.badge), /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-black text-white" }, curStep.title))), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: handleFinish,
          className: "text-gray-400 hover:text-white text-xs font-mono cursor-pointer p-1",
          title: "Salir del tour"
        },
        "\u2715"
      )),
      /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-300 leading-relaxed font-sans" }, curStep.description),
      /* @__PURE__ */ React.createElement("div", { className: "p-2.5 bg-djzinc-950 rounded-xl border border-djzinc-800/90 text-xs text-djcyan-300 font-mono flex items-start gap-2 shadow-inner" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold shrink-0" }, "\u{1F4A1}"), /* @__PURE__ */ React.createElement("span", null, curStep.tip)),
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-2 pt-1" }, TOUR_STEPS.map((s, idx) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: idx,
          type: "button",
          onClick: () => setStepIdx(idx),
          className: `h-1.5 rounded-full transition-all cursor-pointer ${idx === stepIdx ? "w-6 bg-djcyan-400" : "w-2 bg-djzinc-700 hover:bg-gray-400"}`
        }
      ))),
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between pt-2 border-t border-djzinc-800" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            if (onOpenTeaser) onOpenTeaser();
          },
          className: "text-[11px] font-mono text-gray-400 hover:text-djcyan-300 cursor-pointer flex items-center gap-1",
          title: "Ver v\xEDdeo teaser comercial de 60 segundos"
        },
        /* @__PURE__ */ React.createElement("span", null, "\u{1F3AC}"),
        /* @__PURE__ */ React.createElement("span", null, "Ver Teaser 60s")
      ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, stepIdx > 0 && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setStepIdx((prev) => prev - 1),
          className: "px-3 py-1.5 rounded-lg bg-djzinc-800 hover:bg-djzinc-700 text-gray-200 font-bold text-xs cursor-pointer"
        },
        "Anterior"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            if (isLast) {
              handleFinish();
            } else {
              setStepIdx((prev) => prev + 1);
            }
          },
          className: "px-4 py-1.5 rounded-lg bg-gradient-to-r from-djcyan-400 to-djcyan-500 hover:from-djcyan-300 hover:to-djcyan-400 text-black font-black text-xs cursor-pointer shadow-md shadow-djcyan-500/30 transition-transform active:scale-95"
        },
        isLast ? "\u2713 Finalizar Tour" : "Siguiente \u2192"
      )))
    ));
  };
  var TutorialLauncherModal = ({ isOpen, onClose, onLaunchTeaser, onLaunchTour }) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);
    if (!isOpen) return null;
    const handleSkip = () => {
      if (dontShowAgain) {
        try {
          localStorage.setItem("cleandjmix_tutorial_completed", "true");
        } catch (e) {
        }
      }
      onClose();
    };
    return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-[9990] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#0c0d16] border border-djcyan-500/50 rounded-2xl max-w-lg w-full p-6 shadow-[0_0_60px_rgba(6,182,212,0.3)] flex flex-col gap-5 text-gray-200" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800 pb-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, "\u{1F39B}\uFE0F"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono tracking-widest text-djcyan-400 font-black uppercase" }, "BIENVENIDO A CLEANDJMIX PRO"), /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-black text-white" }, "\xBFC\xF3mo prefieres descubrir la cabina?"))), /* @__PURE__ */ React.createElement("button", { onClick: handleSkip, className: "text-gray-400 hover:text-white cursor-pointer p-1" }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3.5" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: onLaunchTeaser,
        className: "p-4 rounded-xl bg-gradient-to-b from-[#141524] to-[#0c0d16] border border-djcyan-500/40 hover:border-djcyan-400 cursor-pointer transition-all hover:scale-[1.02] shadow-lg flex flex-col justify-between group"
      },
      /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl block group-hover:scale-110 transition-transform" }, "\u{1F3AC}"), /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-black text-white uppercase group-hover:text-djcyan-300" }, "V\xEDdeo Teaser (60s)"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 leading-relaxed font-sans" }, "Demostraci\xF3n r\xE1pida con audio synth club en 128 BPM, visualizador FFT y las 5 funciones clave en 1 minuto.")),
      /* @__PURE__ */ React.createElement("span", { className: "mt-3 text-[11px] font-mono font-bold text-djcyan-400 flex items-center gap-1" }, "\u25B6 Ver V\xEDdeo 60s \u2192")
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: onLaunchTour,
        className: "p-4 rounded-xl bg-gradient-to-b from-[#141524] to-[#0c0d16] border border-djzinc-750 hover:border-djcyan-400 cursor-pointer transition-all hover:scale-[1.02] shadow-lg flex flex-col justify-between group"
      },
      /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl block group-hover:scale-110 transition-transform" }, "\u{1F3AF}"), /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-black text-white uppercase group-hover:text-djcyan-300" }, "Tour en Cabina (Spotlight)"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 leading-relaxed font-sans" }, "Fondo alpha con tooltips interactivos directamente sobre tus controles, Hot Cues y Set-Builder paso a paso.")),
      /* @__PURE__ */ React.createElement("span", { className: "mt-3 text-[11px] font-mono font-bold text-djcyan-400 flex items-center gap-1" }, "\u{1F50D} Iniciar Tour Guiado \u2192")
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between pt-3 border-t border-djzinc-800 text-xs text-gray-400" }, /* @__PURE__ */ React.createElement("label", { className: "flex items-center gap-2 cursor-pointer select-none" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        checked: dontShowAgain,
        onChange: (e) => setDontShowAgain(e.target.checked),
        className: "rounded bg-djzinc-900 border-djzinc-700 text-djcyan-500 focus:ring-0 cursor-pointer"
      }
    ), /* @__PURE__ */ React.createElement("span", null, "No volver a mostrar autom\xE1ticamente")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleSkip,
        className: "text-gray-400 hover:text-white font-mono text-xs cursor-pointer"
      },
      "Entrar directamente a la aplicaci\xF3n"
    ))));
  };
  var AppTutorialModal = ({ isOpen, onClose, activeTab, setActiveTab, initialMode = "launcher" }) => {
    const [viewMode, setViewMode] = useState(initialMode);
    useEffect(() => {
      if (isOpen) {
        setViewMode(initialMode || "launcher");
      }
    }, [isOpen, initialMode]);
    if (!isOpen) return null;
    if (viewMode === "teaser") {
      return /* @__PURE__ */ React.createElement(
        CommercialTeaserModal,
        {
          isOpen,
          onClose: () => {
            setViewMode("launcher");
            onClose();
          },
          onOpenTour: () => setViewMode("tour")
        }
      );
    }
    if (viewMode === "tour") {
      return /* @__PURE__ */ React.createElement(
        SpotlightTourOverlay,
        {
          isOpen,
          onClose: () => {
            setViewMode("launcher");
            onClose();
          },
          activeTab,
          setActiveTab,
          onOpenTeaser: () => setViewMode("teaser")
        }
      );
    }
    return /* @__PURE__ */ React.createElement(
      TutorialLauncherModal,
      {
        isOpen,
        onClose,
        onLaunchTeaser: () => setViewMode("teaser"),
        onLaunchTour: () => setViewMode("tour")
      }
    );
  };
  var App = () => {
    const [lang, setLang] = useState(() => {
      try {
        return localStorage.getItem("beatwave_lang") || "es";
      } catch (e) {
        return "es";
      }
    });
    const changeLang = (newLang) => {
      setLang(newLang);
      try {
        localStorage.setItem("beatwave_lang", newLang);
      } catch (e) {
      }
    };
    const t = (k) => I18N_TRANSLATIONS[lang] && I18N_TRANSLATIONS[lang][k] || I18N_TRANSLATIONS["es"][k] || k;
    const [activeTab, setActiveTab] = useState("audit");
    const [currentFolder, setCurrentFolder] = useState("/Users/admin/Music/mi musica");
    const [auditTracks, setAuditTracks] = useState([]);
    const [setBuilderTracks, setSetBuilderTracks] = useState([]);
    const [spotifyTracks, setSpotifyTracks] = useState([]);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const currentTrack = selectedTrack ? auditTracks.find((t2) => t2.id === selectedTrack) || null : null;
    const [nowPlayingTrack, setNowPlayingTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playProgress, setPlayProgress] = useState(0);
    const audioRef = useRef(null);
    const [globalAuditInfo, setGlobalAuditInfo] = useState({ isAuditing: false, progress: 0, statusMsg: "" });
    const [tutorialOpen, setTutorialOpen] = useState(false);
    const [tutorialInitialMode, setTutorialInitialMode] = useState("launcher");
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    useEffect(() => {
      window.abrirTutorial = (mode = "launcher") => {
        setTutorialInitialMode(mode);
        setTutorialOpen(true);
      };
      try {
        const hasSeen = localStorage.getItem("cleandjmix_tutorial_completed");
        if (!hasSeen) {
          setTutorialOpen(true);
        }
      } catch (e) {
      }
    }, []);
    const handleAddTracksToSpotify = (tracksData, origin = "taxonomy") => {
      if (!tracksData) return;
      const list = Array.isArray(tracksData) ? tracksData : [tracksData];
      if (list.length === 0) return;
      const newTracks = list.map((trackData, idx) => ({
        id: trackData.id || `tax_${Date.now()}_${idx}_${Math.floor(Math.random() * 1e3)}`,
        title: trackData.displayTitle || trackData.title || trackData.t || "Pista Taxonom\xEDa",
        artist: trackData.displayArtist || trackData.artist || trackData.a || "Artista",
        album: trackData.displayAlbum || trackData.album || (origin === "audit_upgrade" || trackData.origin === "audit_upgrade" ? "Oficial Spotify HD" : "Taxonom\xEDa AI"),
        bpm: parseFloat(trackData.displayBpm || trackData.bpm || trackData.b || 128),
        key: (trackData.displayKey || trackData.key || trackData.k || "8A").toUpperCase(),
        cover: trackData.displayCover || trackData.cover || null,
        duration: trackData.duration || "04:00",
        origin: trackData.origin || origin,
        reemplazo_de: trackData.reemplazo_de || null,
        original_file: trackData.original_file || null,
        original_path: trackData.original_path || null,
        downloaded: false,
        selected: true,
        format: trackData.format || "FLAC",
        energy: trackData.energy || trackData.e || 80,
        danceability: trackData.danceability || trackData.dance || 80,
        fase_badge: trackData.fase_badge || null,
        comment: trackData.comment || null,
        calidad: trackData.calidad || (origin === "audit_upgrade" || trackData.origin === "audit_upgrade" ? "Oficial Spotify HD" : "Pendiente"),
        status: trackData.status || "Pendiente Descarga",
        spotify_id: trackData.spotify_id || null,
        spotify_url: trackData.spotify_url || null,
        isrc: trackData.isrc || null,
        preview_url: trackData.preview_url || null
      }));
      setSpotifyTracks((prev) => {
        const current = prev || [];
        const filteredNew = newTracks.filter((nt) => !current.some(
          (c) => (c.title || "").toLowerCase() === nt.title.toLowerCase() && (c.artist || "").toLowerCase() === nt.artist.toLowerCase()
        ));
        return [...filteredNew, ...current];
      });
      setActiveTab("spotify");
    };
    const handleAddTrackToSpotify = handleAddTracksToSpotify;
    const [logs, setLogs] = useState([
      { type: "info", text: "> CleanDJmix PRO v2.0 - Core Engine Initialized" },
      { type: "divider", text: "--------------------------------------------------" },
      { type: "success", text: "[ OK ] Audio Engine & Stream Router Online." },
      { type: "success", text: "[ OK ] Serato Database XML Link Ready." }
    ]);
    const synthAudioCtxRef = useRef(null);
    const synthIntervalRef = useRef(null);
    const stopSynthPreview = () => {
      if (synthIntervalRef.current) {
        clearInterval(synthIntervalRef.current);
        synthIntervalRef.current = null;
      }
      if (synthAudioCtxRef.current) {
        try {
          synthAudioCtxRef.current.close();
        } catch (e) {
        }
        synthAudioCtxRef.current = null;
      }
    };
    const playSynthPreview = (track) => {
      stopSynthPreview();
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        synthAudioCtxRef.current = ctx;
        const bpm = parseFloat(track.bpm || track.b || 126) || 126;
        const intervalMs = 60 / bpm * 1e3;
        const triggerBeat = () => {
          if (ctx.state === "suspended") ctx.resume();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(140, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.08);
          gain.gain.setValueAtTime(0.65, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(1e-3, ctx.currentTime + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.2);
          setTimeout(() => {
            if (!synthAudioCtxRef.current) return;
            const c = synthAudioCtxRef.current;
            const hatOsc = c.createOscillator();
            const hatGain = c.createGain();
            hatOsc.type = "triangle";
            hatOsc.frequency.setValueAtTime(7500, c.currentTime);
            hatGain.gain.setValueAtTime(0.1, c.currentTime);
            hatGain.gain.exponentialRampToValueAtTime(1e-3, c.currentTime + 0.04);
            hatOsc.connect(hatGain);
            hatGain.connect(c.destination);
            hatOsc.start(c.currentTime);
            hatOsc.stop(c.currentTime + 0.05);
          }, intervalMs / 2);
        };
        triggerBeat();
        synthIntervalRef.current = setInterval(triggerBeat, intervalMs);
      } catch (e) {
        console.warn("Synth preview error:", e);
      }
    };
    useEffect(() => {
      const audio = new Audio();
      audio.preload = "auto";
      audio.onended = () => {
        setIsPlaying(false);
        setPlayProgress(0);
      };
      audio.onerror = (err) => {
        console.warn("Global audio element error:", err);
        setIsPlaying(false);
      };
      audio.ontimeupdate = () => {
        if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
          setPlayProgress(audio.currentTime / audio.duration);
        }
      };
      audioRef.current = audio;
      if (window.eel && typeof window.eel.expose === "function") {
        window.log_to_console = (msg) => {
          setLogs((prev) => [...prev, { type: "info", text: `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] ${msg}` }]);
        };
        window.eel.expose(window.log_to_console, "log_to_console");
      }
      return () => {
        stopSynthPreview();
        audio.pause();
        audio.src = "";
      };
    }, []);
    const handlePlayTrack = (track, seekPct = 0, autoPlay = true, startOffsetSec = null) => {
      if (!track) return;
      stopSynthPreview();
      const resolvedCover = track.cover || (track.path ? `/cover?path=${encodeURIComponent(track.path)}` : track.f ? `/cover?path=${encodeURIComponent(track.f)}` : null);
      const trackTitle = track.title || track.t || track.displayTitle || "Audio Track";
      const trackArtist = track.artist || track.a || track.displayArtist || "Unknown Artist";
      const trackWithCover = {
        ...track,
        cover: resolvedCover,
        title: trackTitle,
        t: trackTitle,
        artist: trackArtist,
        a: trackArtist
      };
      setNowPlayingTrack(trackWithCover);
      window.__bwCurrentTrack = trackWithCover;
      if (autoPlay) {
        const audio = audioRef.current;
        if (audio) {
          let targetSrc = "";
          if (track.path && (track.path.startsWith("http://") || track.path.startsWith("https://"))) {
            targetSrc = track.path;
          } else if (track.preview_url && (track.preview_url.startsWith("http://") || track.preview_url.startsWith("https://"))) {
            targetSrc = track.preview_url;
          } else if (track.previewUrl && (track.previewUrl.startsWith("http://") || track.previewUrl.startsWith("https://"))) {
            targetSrc = track.previewUrl;
          } else if (track.path) {
            targetSrc = `/stream_audio?path=${encodeURIComponent(track.path)}`;
          } else if (track.f) {
            targetSrc = `/stream_audio?path=${encodeURIComponent(track.f)}`;
          }
          if (targetSrc) {
            const isSameSrc = audio.src === targetSrc || audio.src.endsWith(targetSrc);
            const applyPosition = () => {
              const dur = audio.duration;
              if (startOffsetSec !== null && !isNaN(startOffsetSec)) {
                const safeOffset = dur && !isNaN(dur) && dur > 0.5 ? Math.max(0, Math.min(dur - 0.25, startOffsetSec)) : Math.max(0, startOffsetSec);
                try {
                  audio.currentTime = safeOffset;
                } catch (_) {
                }
                if (dur && !isNaN(dur) && dur > 0) {
                  setPlayProgress(safeOffset / dur);
                }
              } else if (seekPct > 0) {
                const safePct = Math.min(0.99, Math.max(0, seekPct));
                if (dur && !isNaN(dur) && dur > 0.5) {
                  const targetSec = Math.max(0, Math.min(dur - 0.25, dur * safePct));
                  try {
                    audio.currentTime = targetSec;
                  } catch (_) {
                  }
                  setPlayProgress(targetSec / dur);
                } else {
                  setPlayProgress(safePct);
                }
              }
            };
            if (isSameSrc) {
              applyPosition();
              audio.play().then(() => setIsPlaying(true)).catch((err) => {
                console.warn("Audio HTML5 play error:", err);
                if (track.path || track.f) {
                  if (window.eel && window.eel.reproducir_pista_mac) {
                    window.eel.reproducir_pista_mac(track.path || track.f)();
                    setIsPlaying(true);
                  }
                }
              });
            } else {
              audio.src = targetSrc;
              const onMeta = () => {
                applyPosition();
                audio.removeEventListener("loadedmetadata", onMeta);
              };
              audio.addEventListener("loadedmetadata", onMeta);
              audio.play().then(() => {
                setIsPlaying(true);
                applyPosition();
              }).catch((err) => {
                console.warn("Audio HTML5 play fallback to afplay:", err);
                if (track.path || track.f) {
                  if (window.eel && window.eel.reproducir_pista_mac) {
                    window.eel.reproducir_pista_mac(track.path || track.f)();
                    setIsPlaying(true);
                  }
                }
              });
            }
          } else if (track.path || track.f) {
            if (window.eel && window.eel.reproducir_pista_mac) {
              window.eel.reproducir_pista_mac(track.path || track.f)();
              setIsPlaying(true);
            }
          } else {
            playSynthPreview(track);
            setIsPlaying(true);
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
          audio.play().then(() => setIsPlaying(true)).catch(() => {
          });
        }
      }
    };
    const togglePlayPause = () => {
      const audio = audioRef.current;
      if (isPlaying) {
        if (audio) {
          audio.pause();
        }
        stopSynthPreview();
        setIsPlaying(false);
        if (window.eel && window.eel.detener_audio_mac) {
          window.eel.detener_audio_mac()();
        }
      } else {
        if (audio && audio.src && audio.src !== window.location.href && !audio.ended) {
          audio.play().then(() => setIsPlaying(true)).catch((err) => {
            console.warn("Play error:", err);
            if (nowPlayingTrack) {
              handlePlayTrack(nowPlayingTrack, playProgress, true);
            }
          });
        } else if (nowPlayingTrack) {
          handlePlayTrack(nowPlayingTrack, playProgress, true);
        }
      }
    };
    const handleCue = () => {
      stopSynthPreview();
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
    return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col h-screen w-screen bg-djzinc-950 text-gray-300 overflow-hidden font-sans select-none" }, /* @__PURE__ */ React.createElement("header", { className: "h-16 border-b border-djzinc-800/80 bg-[#06060c]/95 backdrop-blur-md px-5 flex items-center justify-between shrink-0 select-none z-30 relative shadow-md" }, /* @__PURE__ */ React.createElement("svg", { width: "0", height: "0", className: "absolute pointer-events-none" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("filter", { id: "waveDistortion", x: "-20%", y: "-20%", width: "140%", height: "140%" }, /* @__PURE__ */ React.createElement("feTurbulence", { type: "fractalNoise", baseFrequency: "0 0.25", numOctaves: "2", result: "warp" }, /* @__PURE__ */ React.createElement("animate", { attributeName: "baseFrequency", values: "0 0.05; 0 0.45; 0 0.05", dur: "0.4s", repeatCount: "indefinite" })), /* @__PURE__ */ React.createElement("feDisplacementMap", { xChannelSelector: "R", yChannelSelector: "G", scale: "0", in: "SourceGraphic", in2: "warp" }, /* @__PURE__ */ React.createElement(
      "animate",
      {
        attributeName: "scale",
        values: "0; 0; 60; 25; 75; 0; 0",
        keyTimes: "0; 0.25; 0.3; 0.5; 0.7; 0.75; 1",
        dur: "8s",
        repeatCount: "5",
        fill: "freeze"
      }
    ))))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3.5 select-none" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0e0e18] via-[#080810] to-[#040408] border-2 border-djcyan-400/60 flex items-center justify-center relative overflow-hidden shrink-0 shadow-[0_0_22px_rgba(6,182,212,0.45)] group" }, /* @__PURE__ */ React.createElement("svg", { className: "w-8 h-8", viewBox: "0 0 32 32", fill: "none" }, /* @__PURE__ */ React.createElement("rect", { className: "svg-bar b1-epic", x: "2.5", y: "6", width: "3", rx: "1.5", height: "22" }), /* @__PURE__ */ React.createElement("rect", { className: "svg-bar b2-epic", x: "8", y: "2", width: "3.5", rx: "1.75", height: "28" }), /* @__PURE__ */ React.createElement("rect", { className: "svg-bar b3-epic", x: "14", y: "4", width: "3", rx: "1.5", height: "26" }), /* @__PURE__ */ React.createElement("rect", { className: "svg-bar b4-epic", x: "19.5", y: "2", width: "3.5", rx: "1.75", height: "28" }), /* @__PURE__ */ React.createElement("rect", { className: "svg-bar b5-epic", x: "25.5", y: "8", width: "3", rx: "1.5", height: "20" }))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 sm:gap-2.5 leading-none" }, /* @__PURE__ */ React.createElement("span", { className: "text-lg sm:text-[23px] tracking-wider uppercase font-black anim-soundwave truncate", style: { fontFamily: "'Syne', sans-serif" } }, "BEAT", /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400" }, "WAVE")), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-md font-black tracking-widest border border-djcyan-400/80 bg-djcyan-950 text-djcyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)] shrink-0" }, "PRO")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 mt-1 sm:mt-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "hidden sm:flex text-[9.5px] uppercase tracking-[0.26em] font-mono font-bold items-center gap-1.5 text-gray-300" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-djcyan-400 animate-pulse" }), "PRECISION AUDIO INTELLIGENCE"), /* @__PURE__ */ React.createElement("span", { className: "flex sm:hidden text-[8.5px] uppercase tracking-wider font-mono font-bold items-center gap-1 text-djcyan-400" }, /* @__PURE__ */ React.createElement("span", { className: "w-1 h-1 rounded-full bg-djcyan-400 animate-pulse" }), "DJ INTELLIGENCE"))))), /* @__PURE__ */ React.createElement("nav", { className: "hidden xl:flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#090912]/95 border border-djzinc-800/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_4px_16px_rgba(0,0,0,0.5)] backdrop-blur-md absolute left-1/2 -translate-x-1/2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setActiveTab("audit"),
        className: `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 ${activeTab === "audit" ? "bg-gradient-to-r from-djcyan-400 to-djcyan-500 text-black shadow-[0_0_18px_rgba(6,182,212,0.55),inset_0_1px_1px_rgba(255,255,255,0.6)] font-black scale-[1.02]" : "text-gray-400 hover:text-white hover:bg-djzinc-850/80 border border-transparent hover:border-djzinc-750 font-bold"}`
      },
      /* @__PURE__ */ React.createElement(Icons.Library, null),
      " ",
      /* @__PURE__ */ React.createElement("span", null, t("nav_audit") || "Auditor\xEDa & DSP"),
      globalAuditInfo.isAuditing && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 bg-amber-400 text-black rounded text-[9px] font-black animate-pulse shadow-sm" }, globalAuditInfo.progress, "%")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setActiveTab("hotcues"),
        className: `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 ${activeTab === "hotcues" ? "bg-gradient-to-r from-djcyan-400 to-djcyan-500 text-black shadow-[0_0_18px_rgba(6,182,212,0.55),inset_0_1px_1px_rgba(255,255,255,0.6)] font-black scale-[1.02]" : "text-gray-400 hover:text-white hover:bg-djzinc-850/80 border border-transparent hover:border-djzinc-750 font-bold"}`
      },
      /* @__PURE__ */ React.createElement(Icons.Cue, null),
      " ",
      /* @__PURE__ */ React.createElement("span", null, t("nav_hotcues") || "Estudio Hot Cues")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setActiveTab("trends"),
        className: `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 ${activeTab === "trends" ? "bg-gradient-to-r from-djcyan-400 to-djcyan-500 text-black shadow-[0_0_18px_rgba(6,182,212,0.55),inset_0_1px_1px_rgba(255,255,255,0.6)] font-black scale-[1.02]" : "text-gray-400 hover:text-white hover:bg-djzinc-850/80 border border-transparent hover:border-djzinc-750 font-bold"}`
      },
      /* @__PURE__ */ React.createElement(Icons.Trends, null),
      " ",
      /* @__PURE__ */ React.createElement("span", null, t("nav_trends") || "Tendencias")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setActiveTab("setbuilder"),
        className: `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 ${activeTab === "setbuilder" ? "bg-gradient-to-r from-djcyan-400 to-djcyan-500 text-black shadow-[0_0_18px_rgba(6,182,212,0.55),inset_0_1px_1px_rgba(255,255,255,0.6)] font-black scale-[1.02]" : "text-gray-400 hover:text-white hover:bg-djzinc-850/80 border border-transparent hover:border-djzinc-750 font-bold"}`
      },
      /* @__PURE__ */ React.createElement(Icons.Flow, null),
      " ",
      /* @__PURE__ */ React.createElement("span", null, t("nav_setbuilder") || "Set-Builder & Flow")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setActiveTab("knowledge"),
        className: `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 ${activeTab === "knowledge" ? "bg-gradient-to-r from-djcyan-400 to-djcyan-500 text-black shadow-[0_0_18px_rgba(6,182,212,0.55),inset_0_1px_1px_rgba(255,255,255,0.6)] font-black scale-[1.02]" : "text-gray-400 hover:text-white hover:bg-djzinc-850/80 border border-transparent hover:border-djzinc-750 font-bold"}`
      },
      /* @__PURE__ */ React.createElement(Icons.Knowledge, null),
      " ",
      /* @__PURE__ */ React.createElement("span", null, t("nav_knowledge") || "Conocimiento")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setActiveTab("spotify"),
        className: `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 ${activeTab === "spotify" ? "bg-gradient-to-r from-djcyan-400 to-djcyan-500 text-black shadow-[0_0_18px_rgba(6,182,212,0.55),inset_0_1px_1px_rgba(255,255,255,0.6)] font-black scale-[1.02]" : "text-gray-400 hover:text-white hover:bg-djzinc-850/80 border border-transparent hover:border-djzinc-750 font-bold"}`
      },
      /* @__PURE__ */ React.createElement(Icons.Spotify, null),
      " ",
      /* @__PURE__ */ React.createElement("span", null, t("nav_spotify") || "Spotify Ingest")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setActiveTab("shazam"),
        className: `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 ${activeTab === "shazam" ? "bg-gradient-to-r from-djcyan-400 to-djcyan-500 text-black shadow-[0_0_18px_rgba(6,182,212,0.55),inset_0_1px_1px_rgba(255,255,255,0.6)] font-black scale-[1.02]" : "text-gray-400 hover:text-white hover:bg-djzinc-850/80 border border-transparent hover:border-djzinc-750 font-bold"}`
      },
      /* @__PURE__ */ React.createElement(Icons.Radar, null),
      " ",
      /* @__PURE__ */ React.createElement("span", null, t("nav_shazam") || "Radar Shazam")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setActiveTab("taxonomy"),
        className: `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 ${activeTab === "taxonomy" ? "bg-gradient-to-r from-djcyan-400 to-djcyan-500 text-black shadow-[0_0_18px_rgba(6,182,212,0.55),inset_0_1px_1px_rgba(255,255,255,0.6)] font-black scale-[1.02]" : "text-gray-400 hover:text-white hover:bg-djzinc-850/80 border border-transparent hover:border-djzinc-750 font-bold"}`
      },
      /* @__PURE__ */ React.createElement(Icons.Routing, null),
      " ",
      /* @__PURE__ */ React.createElement("span", null, t("nav_taxonomy") || "Taxonom\xEDa")
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 sm:gap-3" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setMobileDrawerOpen(true),
        className: "flex xl:hidden p-2 rounded-xl bg-djzinc-900 hover:bg-djzinc-800 text-djcyan-400 border border-djcyan-500/40 cursor-pointer shadow-md active:scale-95",
        title: "Men\xFA de Navegaci\xF3n y M\xF3dulos"
      },
      /* @__PURE__ */ React.createElement(Icons.Menu, null)
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setTutorialOpen(true),
        className: "flex px-2.5 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-djcyan-400 border border-djcyan-500/40 rounded-lg text-[11px] font-mono font-bold items-center gap-1.5 cursor-pointer shadow-sm transition-all hover:scale-105",
        title: "Abrir Selector de Tutoriales (Teaser 60s o Tour Spotlight en Cabina)"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u2753"),
      /* @__PURE__ */ React.createElement("span", null, lang === "en" ? "Tutorial" : "Tutorial")
    ), globalAuditInfo.isAuditing && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-2.5 py-1 rounded bg-djcyan-950/90 border border-djcyan-500/60 text-[11px] font-mono text-djcyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)] animate-fadeIn", title: globalAuditInfo.statusMsg || "Auditor\xEDa en proceso" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-djcyan-400 animate-ping" }), /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Lote: ", globalAuditInfo.progress, "%")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center bg-djzinc-900 border border-djzinc-800 rounded-lg p-0.5 text-[11px] font-mono font-bold shadow-inner" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => changeLang("es"),
        className: `px-2 py-0.5 rounded cursor-pointer transition-all ${lang === "es" ? "bg-djcyan-500 text-black shadow font-bold" : "text-gray-400 hover:text-white"}`,
        title: "Cambiar idioma a Espa\xF1ol"
      },
      "\u{1F1EA}\u{1F1F8} ES"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => changeLang("en"),
        className: `px-2 py-0.5 rounded cursor-pointer transition-all ${lang === "en" ? "bg-djcyan-500 text-black shadow font-bold" : "text-gray-400 hover:text-white"}`,
        title: "Switch language to English"
      },
      "\u{1F1EC}\u{1F1E7} EN"
    )), /* @__PURE__ */ React.createElement("div", { className: "hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-djzinc-900 border border-djzinc-800 text-[11px] font-mono text-gray-400" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-djgreen-400 animate-pulse shadow-[0_0_5px_#22c55e]" }), t("dsp_online") || "DSP ENGINE ONLINE"))), /* @__PURE__ */ React.createElement("main", { className: "flex-1 min-h-0 w-full overflow-hidden relative" }, /* @__PURE__ */ React.createElement("div", { style: { display: activeTab === "audit" ? "flex" : "none" }, className: "w-full h-full" }, /* @__PURE__ */ React.createElement(
      AuditWorkspace,
      {
        tracks: auditTracks,
        setTracks: setAuditTracks,
        selectedTrack,
        setSelectedTrack,
        onPlayTrack: handlePlayTrack,
        onTogglePlay: togglePlayPause,
        nowPlayingTrack,
        isPlaying,
        playProgress,
        onNavigateTab: setActiveTab,
        onSendToSpotify: handleAddTracksToSpotify,
        lang,
        t,
        currentFolder,
        setCurrentFolder,
        audioRef,
        onAuditProgressChange: setGlobalAuditInfo
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { display: activeTab === "hotcues" ? "flex" : "none" }, className: "w-full h-full" }, /* @__PURE__ */ React.createElement(
      HotCuesWorkspace,
      {
        tracks: auditTracks,
        setTracks: setAuditTracks,
        selectedTrack,
        setSelectedTrack,
        onPlayTrack: handlePlayTrack,
        onTogglePlay: togglePlayPause,
        nowPlayingTrack,
        isPlaying,
        playProgress,
        onNavigateTab: setActiveTab,
        onSendToSpotify: handleAddTracksToSpotify,
        lang,
        t,
        currentFolder,
        setCurrentFolder,
        audioRef
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { display: activeTab === "spotify" ? "flex" : "none" }, className: "w-full h-full" }, /* @__PURE__ */ React.createElement(
      SpotifyWorkspace,
      {
        tracks: spotifyTracks,
        setTracks: setSpotifyTracks,
        onPlayTrack: handlePlayTrack,
        nowPlayingTrack,
        isPlaying,
        onTogglePlay: togglePlayPause,
        lang,
        t
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { display: activeTab === "shazam" ? "flex" : "none" }, className: "w-full h-full" }, /* @__PURE__ */ React.createElement(
      ShazamWorkspace,
      {
        onSendToSpotify: (query) => {
          if (typeof query === "object" && query !== null) {
            handleAddTrackToSpotify(query, "shazam");
          } else {
            setActiveTab("spotify");
          }
        },
        onSendToAudit: (trackData) => {
          setAuditTracks((prev) => [trackData, ...prev]);
          setSelectedTrack(trackData.id);
          setActiveTab("audit");
        },
        onNavigateTab: setActiveTab
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { display: activeTab === "taxonomy" ? "flex" : "none" }, className: "w-full h-full" }, /* @__PURE__ */ React.createElement(
      TaxonomyWorkspace,
      {
        tracks: auditTracks,
        onTracksUpdated: setAuditTracks,
        onNavigateTab: setActiveTab,
        onPlayTrack: handlePlayTrack,
        nowPlayingTrack,
        isPlaying,
        onTogglePlay: togglePlayPause,
        onSelectTrackForCues: (trk) => {
          if (!trk) return;
          const existing = auditTracks.find((t2) => t2.id === trk.id || t2.path && t2.path === trk.path);
          if (existing) {
            setSelectedTrack(existing.id);
          } else {
            const newId = auditTracks.length > 0 ? Math.max(...auditTracks.map((t2) => Number(t2.id) || 0)) + 1 : 1;
            const newTrk = { ...trk, id: newId };
            setAuditTracks((prev) => [newTrk, ...prev]);
            setSelectedTrack(newId);
          }
          setActiveTab("hotcues");
        },
        onSendToSpotify: (query) => {
          setActiveTab("spotify");
        },
        onAddTrackToSet: (track) => {
          if (!track) return;
          setSetBuilderTracks((prev) => [...prev, track]);
          setActiveTab("setbuilder");
        },
        onAddTrackToSpotify: handleAddTracksToSpotify,
        onAddTracksToSpotify: handleAddTracksToSpotify
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { display: activeTab === "trends" ? "flex" : "none" }, className: "w-full h-full" }, /* @__PURE__ */ React.createElement(TrendsWorkspace, { lang })), /* @__PURE__ */ React.createElement("div", { style: { display: activeTab === "setbuilder" ? "flex" : "none" }, className: "w-full h-full" }, /* @__PURE__ */ React.createElement(
      SetBuilderWorkspace,
      {
        setTracks: setBuilderTracks,
        setSetTracks: setSetBuilderTracks,
        auditTracks,
        setAuditTracks,
        onPlayTrack: handlePlayTrack,
        nowPlayingTrack,
        isPlaying,
        onTogglePlay: togglePlayPause,
        onNavigateTab: setActiveTab,
        lang
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { display: activeTab === "knowledge" ? "flex" : "none" }, className: "w-full h-full" }, /* @__PURE__ */ React.createElement(KnowledgeWorkspace, { lang }))), /* @__PURE__ */ React.createElement("footer", { className: `${!nowPlayingTrack ? "hidden md:flex" : "flex"} h-14 sm:h-16 bg-[#0a0a0e] border-t border-djzinc-800 px-2.5 sm:px-5 items-center justify-between shrink-0 glass-panel z-30 relative` }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 left-0 right-0 h-0.5 bg-djzinc-850 md:hidden overflow-hidden" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "h-full bg-djcyan-400 transition-all duration-200",
        style: { width: `${Math.min(100, Math.max(0, playProgress * 100))}%` }
      }
    )), !nowPlayingTrack ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 min-w-0 flex-1 md:w-80 md:flex-initial shrink-0 opacity-40 select-none" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 md:w-11 md:h-11 rounded-md bg-[#0a0a0f] border border-djzinc-850 flex items-center justify-center text-gray-600 shadow-inner shrink-0" }, /* @__PURE__ */ React.createElement("svg", { className: "w-5 h-5 text-gray-600", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10", strokeDasharray: "3 3" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3" }))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono font-bold text-gray-500 uppercase tracking-wider" }, "DECK 1 STANDBY"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-600 font-mono" }, "Sin pista seleccionada"))) : /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 md:gap-3 min-w-0 flex-1 md:w-80 md:flex-initial pr-2" }, /* @__PURE__ */ React.createElement(
      "img",
      {
        src: getValidCover(nowPlayingTrack.cover || (nowPlayingTrack.path ? `/cover?path=${encodeURIComponent(nowPlayingTrack.path)}` : nowPlayingTrack.f ? `/cover?path=${encodeURIComponent(nowPlayingTrack.f)}` : null)),
        alt: "Deck Cover",
        onError: (e) => {
          e.target.onerror = null;
          e.target.src = DEFAULT_VINYL_SVG;
        },
        className: "w-10 h-10 md:w-11 md:h-11 rounded-md object-cover border border-djzinc-700 shrink-0 shadow-md"
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-white truncate", title: nowPlayingTrack.t || nowPlayingTrack.title }, nowPlayingTrack.t || nowPlayingTrack.title), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-djcyan-400 font-medium truncate", title: nowPlayingTrack.a || nowPlayingTrack.artist }, nowPlayingTrack.a || nowPlayingTrack.artist), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 font-mono truncate" }, `${nowPlayingTrack.b || nowPlayingTrack.bpm || "--"} BPM \u2022 Key ${nowPlayingTrack.k || nowPlayingTrack.key || "--"}`))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 md:gap-2.5 shrink-0" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        disabled: !nowPlayingTrack,
        onClick: handleCue,
        className: `px-2.5 md:px-3 py-1.5 rounded font-mono font-bold text-xs border transition-all ${!nowPlayingTrack ? "bg-[#101016] text-gray-600 border-djzinc-850 opacity-40 cursor-not-allowed pointer-events-none" : "bg-[#16161d] hover:bg-[#20202a] text-gray-300 border-djzinc-700 active:translate-y-[1px] cursor-pointer"}`
      },
      "CUE"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        disabled: !nowPlayingTrack,
        onClick: togglePlayPause,
        className: `w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all ${!nowPlayingTrack ? "bg-djzinc-900 border border-djzinc-800 text-gray-600 opacity-40 cursor-not-allowed pointer-events-none" : "bg-djcyan-500 hover:bg-djcyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)] active:translate-y-[1px] cursor-pointer"}`
      },
      isPlaying ? /* @__PURE__ */ React.createElement(Icons.Pause, null) : /* @__PURE__ */ React.createElement(Icons.Play, null)
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        disabled: !nowPlayingTrack,
        onClick: () => setPlayProgress(0.22),
        className: `hidden sm:block px-3 py-1.5 rounded font-mono font-bold text-xs border transition-all ${!nowPlayingTrack ? "bg-[#101016] text-gray-600 border-djzinc-850 opacity-40 cursor-not-allowed pointer-events-none" : "bg-[#16161d] hover:bg-[#20202a] text-gray-300 border-djzinc-700 active:translate-y-[1px] cursor-pointer"}`
      },
      "SYNC"
    )), /* @__PURE__ */ React.createElement("div", { className: "hidden md:flex flex-1 max-w-2xl ml-4" }, /* @__PURE__ */ React.createElement(
      FooterMasterWaveform,
      {
        track: nowPlayingTrack,
        isPlaying,
        playProgress,
        onSeek: handleFooterSeek,
        cues: nowPlayingTrack && nowPlayingTrack.cues && nowPlayingTrack.cues.length > 0 ? nowPlayingTrack.cues : currentTrack && currentTrack.cues && currentTrack.cues.length > 0 ? currentTrack.cues : NV2_COLORS
      }
    ))), /* @__PURE__ */ React.createElement("nav", { className: "flex md:hidden h-14 bg-[#07070d]/95 backdrop-blur-md border-t border-djzinc-800 px-1 items-center justify-around shrink-0 z-40 select-none shadow-[0_-4px_16px_rgba(0,0,0,0.5)] safe-area-bottom" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setActiveTab("audit"),
        className: `flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all ${activeTab === "audit" ? "text-djcyan-400 font-bold scale-105" : "text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement(Icons.Library, null),
      /* @__PURE__ */ React.createElement("span", { className: "text-[9.5px] font-mono mt-0.5" }, "Auditor\xEDa")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setActiveTab("hotcues"),
        className: `flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all ${activeTab === "hotcues" ? "text-djcyan-400 font-bold scale-105" : "text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement(Icons.Cue, null),
      /* @__PURE__ */ React.createElement("span", { className: "text-[9.5px] font-mono mt-0.5" }, "Deck Cues")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setActiveTab("setbuilder"),
        className: `flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all ${activeTab === "setbuilder" ? "text-djcyan-400 font-bold scale-105" : "text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement(Icons.Flow, null),
      /* @__PURE__ */ React.createElement("span", { className: "text-[9.5px] font-mono mt-0.5" }, "Set-Flow")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setActiveTab("trends"),
        className: `flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all ${activeTab === "trends" ? "text-djcyan-400 font-bold scale-105" : "text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement(Icons.Trends, null),
      /* @__PURE__ */ React.createElement("span", { className: "text-[9.5px] font-mono mt-0.5" }, "Tendencias")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setActiveTab("knowledge"),
        className: `flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all ${activeTab === "knowledge" ? "text-djcyan-400 font-bold scale-105" : "text-gray-400 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement(Icons.Knowledge, null),
      /* @__PURE__ */ React.createElement("span", { className: "text-[9.5px] font-mono mt-0.5" }, "Academia")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setMobileDrawerOpen(true),
        className: "flex flex-col items-center justify-center flex-1 py-1 cursor-pointer text-gray-400 hover:text-white transition-all"
      },
      /* @__PURE__ */ React.createElement(Icons.Menu, null),
      /* @__PURE__ */ React.createElement("span", { className: "text-[9.5px] font-mono mt-0.5" }, "M\xE1s...")
    )), mobileDrawerOpen && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity",
        onClick: () => setMobileDrawerOpen(false)
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "relative ml-auto w-4/5 max-w-sm h-full bg-[#0a0a10] border-l border-djzinc-800 flex flex-col p-5 shadow-2xl z-10 overflow-y-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between pb-4 border-b border-djzinc-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "w-9 h-9 rounded-xl bg-gradient-to-br from-djcyan-400 to-djcyan-600 flex items-center justify-center text-black font-black text-xs shadow-md shadow-djcyan-500/30" }, "BW"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-base font-black tracking-wider uppercase", style: { fontFamily: "'Syne', sans-serif" } }, "BEAT", /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400" }, "WAVE"), " ", /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-djcyan-300 font-mono px-1 border border-djcyan-400/60 rounded" }, "PRO")), /* @__PURE__ */ React.createElement("div", { className: "text-[9px] font-mono text-gray-500" }, "Precision DJ Intelligence"))), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setMobileDrawerOpen(false),
        className: "w-8 h-8 rounded-full bg-djzinc-900 hover:bg-djzinc-800 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer border border-djzinc-700 transition-colors"
      },
      /* @__PURE__ */ React.createElement(Icons.Close, null)
    )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1.5 py-4 flex-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono uppercase tracking-widest text-gray-500 px-2 mb-1" }, "M\xF3dulos Principales"), [
      { id: "audit", icon: /* @__PURE__ */ React.createElement(Icons.Library, null), label: t("nav_audit") || "Auditor\xEDa & DSP" },
      { id: "hotcues", icon: /* @__PURE__ */ React.createElement(Icons.Cue, null), label: t("nav_hotcues") || "Estudio Hot Cues" },
      { id: "trends", icon: /* @__PURE__ */ React.createElement(Icons.Trends, null), label: t("nav_trends") || "Tendencias Electr\xF3nica" },
      { id: "setbuilder", icon: /* @__PURE__ */ React.createElement(Icons.Flow, null), label: t("nav_setbuilder") || "Set-Builder & Flow" },
      { id: "knowledge", icon: /* @__PURE__ */ React.createElement(Icons.Knowledge, null), label: t("nav_knowledge") || "Academia & Conocimiento" },
      { id: "spotify", icon: /* @__PURE__ */ React.createElement(Icons.Spotify, null), label: t("nav_spotify") || "Spotify Ingest" },
      { id: "shazam", icon: /* @__PURE__ */ React.createElement(Icons.Radar, null), label: t("nav_shazam") || "Radar Shazam" },
      { id: "taxonomy", icon: /* @__PURE__ */ React.createElement(Icons.Routing, null), label: t("nav_taxonomy") || "Taxonom\xEDa AI" }
    ].map((item) => {
      const isActive = activeTab === item.id;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: item.id,
          type: "button",
          onClick: () => {
            setActiveTab(item.id);
            setMobileDrawerOpen(false);
          },
          className: `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${isActive ? "bg-gradient-to-r from-djcyan-400 to-djcyan-500 text-black shadow-lg shadow-djcyan-500/30 font-black" : "text-gray-300 hover:bg-djzinc-900 border border-transparent hover:border-djzinc-800"}`
        },
        /* @__PURE__ */ React.createElement("span", { className: isActive ? "text-black" : "text-djcyan-400" }, item.icon),
        /* @__PURE__ */ React.createElement("span", { className: "flex-1" }, item.label),
        item.id === "audit" && globalAuditInfo.isAuditing && /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded bg-amber-400 text-black text-[9px] font-black animate-pulse" }, globalAuditInfo.progress, "%")
      );
    }), /* @__PURE__ */ React.createElement("div", { className: "border-t border-djzinc-800 my-2 pt-3 flex flex-col gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono uppercase tracking-widest text-gray-500 px-2" }, "Recursos & Ayuda"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setMobileDrawerOpen(false);
          setTutorialOpen(true);
        },
        className: "flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-djzinc-900 text-xs font-mono text-djcyan-400 border border-djcyan-500/30 text-left hover:bg-djzinc-850 cursor-pointer"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u2753"),
      /* @__PURE__ */ React.createElement("span", null, "Tutorial Interactivo")
    ), /* @__PURE__ */ React.createElement(
      "a",
      {
        href: "/api/manual/pdf",
        download: "CleanDJmix_PRO_Manual_Funcional_y_Tecnico.pdf",
        className: "flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-djzinc-900 text-xs font-mono text-emerald-400 border border-emerald-500/30 text-left hover:bg-djzinc-850 cursor-pointer"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F4C4}"),
      /* @__PURE__ */ React.createElement("span", null, "Descargar Manual PDF")
    ))), /* @__PURE__ */ React.createElement("div", { className: "pt-3 border-t border-djzinc-800 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 bg-djzinc-900 p-1 rounded-lg border border-djzinc-800" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => changeLang("es"),
        className: `px-2 py-1 rounded text-xs font-mono font-bold ${lang === "es" ? "bg-djcyan-500 text-black" : "text-gray-400"}`
      },
      "\u{1F1EA}\u{1F1F8} ES"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => changeLang("en"),
        className: `px-2 py-1 rounded text-xs font-mono font-bold ${lang === "en" ? "bg-djcyan-500 text-black" : "text-gray-400"}`
      },
      "\u{1F1EC}\u{1F1E7} EN"
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 text-[10px] font-mono text-gray-400" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-djgreen-400 animate-pulse" }), /* @__PURE__ */ React.createElement("span", null, "DSP ONLINE"))))), /* @__PURE__ */ React.createElement(
      AppTutorialModal,
      {
        isOpen: tutorialOpen,
        onClose: () => setTutorialOpen(false),
        activeTab,
        setActiveTab,
        initialMode: tutorialInitialMode
      }
    ));
  };
  var root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(/* @__PURE__ */ React.createElement(App, null));
})();
