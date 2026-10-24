const { useState, useEffect, useRef, useMemo, useCallback } = React;
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
  if (!c || typeof c !== "string") return DEFAULT_VINYL_SVG;
  if (c.startsWith("data:") || c.startsWith("http://") || c.startsWith("https://") || c.startsWith("/")) return c;
  return "https://i.scdn.co/image/" + c;
}
const I18N_TRANSLATIONS = {
  es: {
    nav_audit: "Auditor\xEDa & DSP",
    nav_hotcues: "Estudio Hot Cues",
    nav_spotify: "Spotify Ingest",
    nav_shazam: "Radar Shazam",
    nav_taxonomy: "Taxonom\xEDa",
    nav_logs: "Consola (Logs)",
    dsp_online: "DSP ENGINE ONLINE",
    btn_audit_batch: "Configurar Lote",
    btn_execute_audit: "Auditar Directorio",
    btn_inject_covers: "Inyectar Car\xE1tulas",
    btn_save_all: "Guardar Todo en Ficheros",
    btn_export_xls: "Exportar Excel",
    btn_change_dir: "Cambiar Carpeta",
    btn_cancel: "\u2715 Cancelar",
    btn_cancel_audit: "\u2715 Detener Auditor\xEDa",
    btn_cancel_download: "\u2715 Cancelar Descargas",
    btn_inspector: "\u25E8 Inspector",
    btn_close_panel: "\u2715 Cerrar Panel",
    btn_edit_cues_studio: "\u{1F39B}\uFE0F Editar Hot Cues en Estudio \u2192",
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
    cues_open_studio_btn: "\u{1F39B}\uFE0F Abrir Estudio Hot Cues \u2192",
    studio_title: "Estudio Profesional de Hot Cues & Beatgrid",
    studio_desc: "Waveform con desplazamiento horizontal y zoom milim\xE9trico para fijar puntos de mezcla y beatgrid.",
    zoom_level: "Zoom Horizontal",
    snap_to_grid: "Snap a Rejilla",
    show_beatgrid: "Ver Beatgrid",
    follow_playhead: "Seguir Reproducci\xF3n",
    auto_phrase: "\u26A1 Auto-Frasear 16/32b",
    save_track_disk: "\u{1F4BE} Guardar Pista en Disco",
    save_all_disk: "\u{1F4BE} Guardar Todo el Lote",
    pad: "Pad",
    jump_cue: "Saltar",
    tactical_comment_title: "Comentario T\xE1ctico DJ",
    regenerate_mood_btn: "\u2728 Regenerar Mood & Comentario IA",
    shazam_radar_title: "Radar Ac\xFAstico ShazamIO",
    shazam_mic_btn: "Escuchar por Micr\xF3fono",
    shazam_drop_text: "Arrastra o selecciona un archivo de audio",
    shazam_send_spotify: "\u{1F4E5} Descargar en Spotify Ingest",
    shazam_send_audit: "\u{1F4CB} A\xF1adir a Auditor\xEDa DJ",
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
    taxonomy_tab_search: "Buscador IA (Cuenca Style)",
    taxonomy_tab_crates: "Serato Crates & Rekordbox"
  },
  en: {
    nav_audit: "Audit & DSP",
    nav_hotcues: "Hot Cues Studio",
    nav_spotify: "Spotify Ingest",
    nav_shazam: "Radar Shazam",
    nav_taxonomy: "Taxonomy",
    nav_logs: "Console (Logs)",
    dsp_online: "DSP ENGINE ONLINE",
    btn_audit_batch: "Batch Config",
    btn_execute_audit: "Audit Directory",
    btn_inject_covers: "Inject Covers",
    btn_save_all: "Save All to Files",
    btn_export_xls: "Export Excel",
    btn_change_dir: "Change Folder",
    btn_cancel: "\u2715 Cancel",
    btn_cancel_audit: "\u2715 Stop Audit",
    btn_cancel_download: "\u2715 Cancel Downloads",
    btn_inspector: "\u25E8 Inspector",
    btn_close_panel: "\u2715 Close Panel",
    btn_edit_cues_studio: "\u{1F39B}\uFE0F Edit Hot Cues in Studio \u2192",
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
    cues_open_studio_btn: "\u{1F39B}\uFE0F Open in Hot Cues Studio \u2192",
    studio_title: "Professional Hot Cues & Beatgrid Studio",
    studio_desc: "Expanded horizontal scroll waveform with millimetric zoom to anchor mix cues and beatgrid.",
    zoom_level: "Horizontal Zoom",
    snap_to_grid: "Snap to Grid",
    show_beatgrid: "Show Beatgrid",
    follow_playhead: "Follow Playhead",
    auto_phrase: "\u26A1 Auto-Phrase 16/32b",
    save_track_disk: "\u{1F4BE} Save Track to Disk",
    save_all_disk: "\u{1F4BE} Save All Batch",
    pad: "Pad",
    jump_cue: "Jump",
    tactical_comment_title: "Tactical DJ Comment",
    regenerate_mood_btn: "\u2728 Regenerate Mood & AI Comment",
    shazam_radar_title: "ShazamIO Acoustic Radar",
    shazam_mic_btn: "Listen with Microphone",
    shazam_drop_text: "Drag & drop or browse an audio file",
    shazam_send_spotify: "\u{1F4E5} Download in Spotify Ingest",
    shazam_send_audit: "\u{1F4CB} Add to DJ Audit",
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
    taxonomy_tab_search: "AI Search (Cuenca Style)",
    taxonomy_tab_crates: "Serato Crates & Rekordbox"
  }
};
const Icons = {
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
  Mic: () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("path", { d: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" }), /* @__PURE__ */ React.createElement("path", { d: "M19 10v2a7 7 0 0 1-14 0v-2" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "19", x2: "12", y2: "23" }), /* @__PURE__ */ React.createElement("line", { x1: "8", y1: "23", x2: "16", y2: "23" }))
};
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
const WAVEFORM_COLOR_LEGEND = [
  { name: "Bass / Sub", color: "#2563eb", rgb: [37, 99, 235], hex: "#2563EB", desc: "Subgraves y pegada de bombos (<150Hz)", text: "text-blue-400", dot: "bg-blue-500" },
  { name: "Drums / Impact", color: "#ef4444", rgb: [239, 68, 68], hex: "#EF4444", desc: "Cajas, claps y transitorios r\xEDtmicos (150-1kHz)", text: "text-red-400", dot: "bg-red-500" },
  { name: "Vocal / Synth", color: "#10b981", rgb: [16, 185, 129], hex: "#10B981", desc: "Vocales, pads y sintetizadores mel\xF3dicos (1k-5kHz)", text: "text-emerald-400", dot: "bg-emerald-500" },
  { name: "Hi-Hat / Treble", color: "#22d3ee", rgb: [34, 211, 238], hex: "#22D3EE", desc: "Platos, shakers y brillo a\xE9reo (>5kHz)", text: "text-djcyan-400", dot: "bg-djcyan-400" }
];
const DJ_PAD_PALETTE = [
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
const parseDurationMs = (dur) => {
  if (!dur || typeof dur !== "string") return 3e5;
  const parts = dur.split(":");
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const s = parseFloat(parts[1]) || 0;
    return Math.max(1e3, (m * 60 + s) * 1e3);
  }
  return 3e5;
};
const parseTimeToMs = (timeStr) => {
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
const formatMsToTime = (ms) => {
  const totalSec = Math.max(0, ms) / 1e3;
  const m = Math.floor(totalSec / 60);
  const s = (totalSec % 60).toFixed(2);
  const sPadded = s.length < 5 ? "0" + s : s;
  return `${String(m).padStart(2, "0")}:${sPadded}`;
};
const RekordboxWaveform = ({
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
        style: { left: `${dragInfo.pct}%` }
      },
      /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full", style: { backgroundColor: activeCues[dragInfo.idx]?.color || "#ef4444" } }),
      /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono font-bold text-white" }, "Pad ", activeCues[dragInfo.idx]?.id || dragInfo.idx + 1, ":"),
      /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono font-bold text-djcyan-400" }, dragInfo.time),
      /* @__PURE__ */ React.createElement("span", { className: "text-[8px] font-mono text-gray-300" }, "(", dragInfo.bar, ")"),
      snapToGrid && /* @__PURE__ */ React.createElement("span", { className: "text-[7px] font-bold text-emerald-400 uppercase bg-emerald-950/80 px-1 rounded" }, "Snap")
    )
  ));
};
const CompactHotCuesSummary = ({ track, cues = NV2_COLORS, onOpenStudio, onSelectCue, selectedCueId = 1, t = (k) => k }) => {
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
const ZoomableRekordboxWaveform = ({
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
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: idx,
            style: { left: `${cuePct}%` },
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
              className: `w-[2px] h-full transition-all ${isSelected ? "w-[2.5px] shadow-[0_0_12px_currentColor]" : "opacity-85 group-hover:opacity-100"}`,
              style: { backgroundColor: color, color }
            }
          ),
          /* @__PURE__ */ React.createElement(
            "div",
            {
              className: `absolute top-1 -translate-x-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-full font-mono text-[9px] font-bold text-white shadow-lg border cursor-ew-resize transition-all ${isSelected ? "scale-110 ring-2 ring-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" : "opacity-90 group-hover:scale-105 group-hover:opacity-100"}`,
              style: {
                backgroundColor: color,
                borderColor: isSelected ? "#ffffff" : "rgba(255,255,255,0.4)"
              }
            },
            /* @__PURE__ */ React.createElement("span", null, "P", padNum),
            zoom >= 2 && /* @__PURE__ */ React.createElement("span", { className: "text-[8px] opacity-90 truncate max-w-[50px]" }, cue.short_name || cue.name || "")
          ),
          /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-1 -translate-x-1/2 bg-black/80 px-1 py-0.2 rounded border border-djzinc-700 text-[8px] font-mono text-gray-300 pointer-events-none whitespace-nowrap" }, cue.time || "00:00.00")
        );
      }),
      dragInfo && /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "absolute -top-7 -translate-x-1/2 bg-djzinc-900 text-white px-2 py-0.5 rounded border border-djcyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center gap-1.5 pointer-events-none z-30 whitespace-nowrap",
          style: { left: `${dragInfo.pct}%` }
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
const HotCueEditorPanel = ({
  track,
  cues = NV2_COLORS,
  duration = "05:00",
  onUpdateCues,
  selectedCueId = 1,
  onSelectCue,
  onPlayTrack,
  onAutoPhraseCues,
  snapToGrid = true,
  onToggleSnap,
  playProgress = 0,
  onGuardarTrack,
  onOpenStudio
}) => {
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
  const [timeInputValue, setTimeInputValue] = useState(currentCue.time || "00:00.00");
  const [nameInputValue, setNameInputValue] = useState(currentCue.name || "");
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
  const handleNameChange = (newName) => {
    setNameInputValue(newName);
    updateSingleCue({
      name: newName,
      short_name: newName
    });
  };
  const handleColorChange = (paletteItem) => {
    updateSingleCue({
      color: paletteItem.color,
      hex: paletteItem.hex,
      rgb: paletteItem.rgb,
      text: paletteItem.text,
      border: paletteItem.border,
      bg: paletteItem.bg
    });
  };
  return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-3 bg-djzinc-900/60 p-3 rounded-lg border border-djzinc-800" }, onOpenStudio && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: onOpenStudio,
      className: "w-full py-2 px-3 bg-gradient-to-r from-blue-950 via-djzinc-900 to-indigo-950 hover:from-blue-900 hover:to-indigo-900 border border-djcyan-500/50 hover:border-djcyan-400 rounded-lg text-xs font-mono font-bold text-djcyan-300 flex items-center justify-between shadow-lg active:scale-[0.99] transition-all cursor-pointer group",
      title: "Abrir estudio completo de Hot Cues a pantalla completa con reproductor y guardado por pista"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm" }, "\u{1F39B}\uFE0F"), /* @__PURE__ */ React.createElement("span", null, "ESTUDIO COMPLETO DE HOT CUES")),
    /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono bg-djcyan-500/20 text-djcyan-300 px-2 py-0.5 rounded border border-djcyan-500/40 group-hover:bg-djcyan-500 group-hover:text-black transition-colors" }, "\u26F6 Pantalla Completa")
  ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800 pb-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-bold text-djcyan-400 uppercase tracking-wide flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-djcyan-400" }), "8 HOT CUES & BEATGRID (NUMARK NV2 / PIONEER RGB)"), /* @__PURE__ */ React.createElement(InfoTip, { title: "Hot Cues & Beatgrid", text: "Editor t\xE1ctico de los 8 pads RGB sincronizados al Beatgrid Rekordbox/Serato. Arrastra los marcadores en la onda, escribe el tiempo exacto en milisegundos y asigna colores est\xE1ndar." })), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, onOpenStudio && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: onOpenStudio,
      className: "px-2 py-1 text-[9px] font-mono font-bold bg-djcyan-950 hover:bg-djcyan-900 text-djcyan-400 rounded border border-djcyan-700/60 cursor-pointer shadow active:scale-95 transition-all",
      title: "Abrir modal espacioso con reproductor y guardado por pista"
    },
    "\u26F6 Estudio"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: onAutoPhraseCues,
      className: "px-2 py-1 text-[9px] font-mono font-bold bg-djcyan-500/20 hover:bg-djcyan-500/30 text-djcyan-400 rounded border border-djcyan-500/40 cursor-pointer shadow active:scale-95 transition-all",
      title: "Auto-calcular 8 Hot Cues por frases musicales (16/32 compases) anclados al Beatgrid 1.0.0"
    },
    "\u26A1 Auto-Frasear 16/32b"
  ), onGuardarTrack && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: onGuardarTrack,
      className: "px-2 py-1 text-[9px] font-mono font-bold bg-djgreen-950 hover:bg-djgreen-900 text-djgreen-400 rounded border border-djgreen-700/60 cursor-pointer shadow active:scale-95 transition-all",
      title: "Guardar cues modificados en archivo de disco"
    },
    "\u{1F4BE} Guardar"
  ))), /* @__PURE__ */ React.createElement("div", { className: "bg-[#040407] p-2 rounded border border-djzinc-800/80 space-y-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-[9px] font-mono font-bold text-gray-400" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-300 flex items-center gap-1" }, "\u{1F3A8} C\xD3DIGOS DE COLOR DE FORMA DE ONDA (FRECUENCIAS)"), /* @__PURE__ */ React.createElement("span", { className: "text-[8px] text-gray-400" }, "Pioneer DJ RGB Standard")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-4 gap-1.5 text-[8px] font-mono" }, WAVEFORM_COLOR_LEGEND.map((stem) => /* @__PURE__ */ React.createElement("div", { key: stem.name, className: "flex items-center gap-1.5 p-1 rounded bg-djzinc-900 border border-djzinc-800", title: stem.desc }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full shrink-0 shadow", style: { backgroundColor: stem.color } }), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: `font-bold block truncate ${stem.text}` }, stem.name), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 text-[7px]" }, stem.hex)))))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-[10px] font-mono text-gray-400 mb-1 px-0.5" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-gray-300" }, "PADS 1 - 8 (Clic para editar \u2022 \u25B6 para reproducir)"), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-djcyan-400" }, "Imantaci\xF3n al Grid: ", snapToGrid ? "ACTIVA" : "LIBRE")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-1.5" }, activeCues.map((c, idx) => {
    const cueId = c.id !== void 0 ? c.id : idx + 1;
    const isSelected = selectedCueId === cueId;
    const cuePct = c.pct !== void 0 ? c.pct : idx * 0.12 + 0.02;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: cueId,
        onClick: () => onSelectCue && onSelectCue(cueId),
        className: `p-2 rounded border flex flex-col justify-between cursor-pointer transition-all select-none relative group ${isSelected ? "bg-djzinc-800 border-djcyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)] ring-1 ring-djcyan-400" : `${c.bg || "bg-djzinc-850"} ${c.border || "border-djzinc-750"} hover:border-gray-500`}`
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement(
        "span",
        {
          className: "text-[9px] font-mono font-black px-1.5 py-0.2 rounded text-black shadow-sm",
          style: { backgroundColor: c.color || "#ef4444" }
        },
        "PAD ",
        cueId
      ), /* @__PURE__ */ React.createElement("span", { className: "text-[7px] font-mono text-gray-400" }, c.color || "#ef4444")), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: (e) => {
            e.stopPropagation();
            if (onPlayTrack) onPlayTrack(track, cuePct, true);
          },
          className: "w-4 h-4 rounded bg-djzinc-900 hover:bg-djcyan-500 hover:text-black text-djcyan-400 flex items-center justify-center text-[8px] font-bold border border-djzinc-700 transition-colors shadow",
          title: `Reproducir desde ${c.time || "00:00.0"}`
        },
        "\u25B6"
      )),
      /* @__PURE__ */ React.createElement("span", { className: `text-[10px] font-bold truncate ${c.text || "text-gray-200"}` }, c.short_name || c.name || `Cue ${cueId}`),
      /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-[8px] font-mono text-gray-400 mt-1 pt-1 border-t border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-300 font-semibold" }, c.time || "00:00.0"), /* @__PURE__ */ React.createElement("span", null, c.bar_str || `Bar ${c.bar || idx * 16 + 1}`))
    );
  }))), /* @__PURE__ */ React.createElement("div", { className: "bg-[#050509] p-2.5 rounded border border-djcyan-500/30 space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-[10px] font-mono border-b border-djzinc-800 pb-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
    "span",
    {
      className: "px-2 py-0.5 rounded text-[9px] font-black font-mono text-black shadow",
      style: { backgroundColor: currentCue.color || "#ef4444" }
    },
    "PAD ",
    currentCue.id || 1
  ), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-200" }, "Editando: ", /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400" }, currentCue.name || `Cue ${currentCue.id || 1}`)), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-400 font-mono" }, "(", currentCue.color || "#ef4444", ")")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleSetToPlayhead,
      className: "px-2 py-0.5 bg-djzinc-850 hover:bg-djzinc-750 text-gray-200 text-[8px] font-mono rounded border border-djzinc-700 cursor-pointer shadow active:scale-95 transition-colors",
      title: "Mover este cue a la posici\xF3n actual de reproducci\xF3n"
    },
    "\u{1F4CD} Fijar en Playhead"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleSnapCurrentCue,
      className: "px-2 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 text-[8px] font-mono rounded border border-emerald-800/60 cursor-pointer shadow active:scale-95 transition-colors",
      title: "Alinear magn\xE9ticamente al beatgrid m\xE1s pr\xF3ximo"
    },
    "\u{1F9F2} Snap a Beat"
  ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-[9px] font-mono text-gray-400 mb-0.5" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-gray-300" }, "TIEMPO EXACTO (mm:ss.ms)"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 font-mono" }, currentCue.pos_ms || 0, " ms")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: timeInputValue,
      onChange: handleTimeInputChange,
      placeholder: "00:00.00",
      className: "w-full bg-djzinc-950 border border-djzinc-700 focus:border-djcyan-400 rounded px-2 py-1 text-xs font-mono font-bold text-djcyan-300 outline-none"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        const cuePct = currentCue.pct !== void 0 ? currentCue.pct : 0;
        if (onPlayTrack) onPlayTrack(track, cuePct, true);
      },
      className: "px-2.5 py-1 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-bold text-[10px] rounded cursor-pointer shadow shrink-0",
      title: "Audicionar este punto de cue"
    },
    "\u25B6"
  ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-[9px] font-mono text-gray-400 mb-0.5" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-gray-300" }, "NOMBRE DEL CUE / FRASE"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, currentCue.bar_str || "Bar 1")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: nameInputValue,
      onChange: (e) => handleNameChange(e.target.value),
      placeholder: "Nombre t\xE1ctico del cue...",
      className: "w-full bg-djzinc-950 border border-djzinc-700 focus:border-djcyan-400 rounded px-2 py-1 text-xs font-semibold text-gray-200 outline-none"
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-djzinc-850" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 text-[9px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 mr-0.5" }, "Ajuste Fino:"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleNudge(-barMs),
      className: "px-1.5 py-0.5 bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95",
      title: "Retroceder 1 comp\xE1s (4 beats)"
    },
    "\u25C0\u25C0 -1 Comp\xE1s"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleNudge(-beatMs),
      className: "px-1.5 py-0.5 bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95",
      title: "Retroceder 1 beat"
    },
    "\u25C0 -1 Beat"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleNudge(-10),
      className: "px-1.5 py-0.5 bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95",
      title: "Retroceder 10ms"
    },
    "-10ms"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleNudge(10),
      className: "px-1.5 py-0.5 bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95",
      title: "Avanzar 10ms"
    },
    "+10ms"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleNudge(beatMs),
      className: "px-1.5 py-0.5 bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95",
      title: "Avanzar 1 beat"
    },
    "+1 Beat \u25B6"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleNudge(barMs),
      className: "px-1.5 py-0.5 bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow active:scale-95",
      title: "Avanzar 1 comp\xE1s (4 beats)"
    },
    "+1 Comp\xE1s \u25B6\u25B6"
  )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 text-[8px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "Presets:"), ["Kick", "Hi-Hats", "Bass", "Break", "Drop 1", "Drop 2", "Outro"].map((p) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: p,
      type: "button",
      onClick: () => handleNameChange(p),
      className: "px-1 py-0.2 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-750 cursor-pointer transition-colors"
    },
    p
  )))), /* @__PURE__ */ React.createElement("div", { className: "pt-1 border-t border-djzinc-850" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-[9px] font-mono text-gray-400 mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-gray-300" }, "ASIGNAR COLOR DE PAD (PIONEER DJ / NUMARK RGB)"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "Actual: ", /* @__PURE__ */ React.createElement("span", { className: "font-mono text-white font-bold" }, currentCue.color || "#ef4444"))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5" }, DJ_PAD_PALETTE.map((pal) => {
    const isCurrentColor = (currentCue.color || "#ef4444").toLowerCase() === pal.color.toLowerCase();
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: pal.color,
        type: "button",
        onClick: () => handleColorChange(pal),
        className: `px-1.5 py-1 rounded text-[8px] font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${isCurrentColor ? "ring-2 ring-white border-white scale-105 shadow-md bg-djzinc-800" : "bg-djzinc-900 border-djzinc-750 hover:border-gray-500"}`,
        title: `${pal.name} \u2022 ${pal.hex}`
      },
      /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full shadow", style: { backgroundColor: pal.color } }),
      /* @__PURE__ */ React.createElement("span", { className: "text-gray-200" }, pal.hex)
    );
  })))));
};
const HotCueStudioModal = ({
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
const FooterMasterWaveform = ({ track, isPlaying, playProgress = 0, onSeek, cues = NV2_COLORS }) => {
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
const CAMELOT_WHEEL_DATA = {
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
const TAXONOMY_TREE = {
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
const DJ_GENRES_LIST = Object.keys(TAXONOMY_TREE);
const DJ_VERSIONS_LIST = [
  "Extended Mix",
  "Intro / Outro",
  "Remix / Club Mix",
  "Mashup / Bootleg",
  "Transition",
  "Acapella / DIY",
  "Short Edit / Radio"
];
const CUENCA_PROMPT_CHIPS = [
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
const DJ_CURATED_CATALOG = [
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
function parseCuencaDJQuery(query) {
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
    result.tokens.push({ type: "bpm", label: `${result.minBpm}-${result.maxBpm} BPM` });
  } else {
    const singleBpmMatch = q.match(/(?:a\s+)?(\b1[0-9]{2}\b|\b[6-9][0-9]\b)\s*(?:bpm)?/);
    if (singleBpmMatch) {
      const val = parseInt(singleBpmMatch[1], 10);
      if (val >= 60 && val <= 200) {
        result.targetBpm = val;
        result.minBpm = val - 3;
        result.maxBpm = val + 3;
        result.tokens.push({ type: "bpm", label: `${val} BPM (\xB13)` });
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
    result.tokens.push({ type: "key", label: `Key ${k}` });
  } else {
    for (const [camKey, data] of Object.entries(CAMELOT_WHEEL_DATA)) {
      const cls = data.classical.toLowerCase();
      const nm = data.name.toLowerCase();
      if (q.includes(`en ${cls}`) || q.includes(`en ${nm}`) || q.includes(` ${cls}`)) {
        result.key = camKey;
        result.compatibleKeys = [camKey, data.rel, data.up, data.down];
        result.tokens.push({ type: "key", label: `Key ${camKey} (${data.classical})` });
        break;
      }
    }
  }
  if (q.includes("extended") || q.includes("ext")) {
    result.version = "Extended Mix";
    result.tokens.push({ type: "version", label: "Extended Mix" });
  } else if (q.includes("intro") || q.includes("outro")) {
    result.version = "Intro / Outro";
    result.tokens.push({ type: "version", label: "Intro / Outro" });
  } else if (q.includes("mashup") || q.includes("bootleg")) {
    result.version = "Mashup / Bootleg";
    result.tokens.push({ type: "version", label: "Mashup" });
  } else if (q.includes("remix") || q.includes("club mix")) {
    result.version = "Remix / Club Mix";
    result.tokens.push({ type: "version", label: "Remix" });
  } else if (q.includes("acapella") || q.includes("acappella")) {
    result.version = "Acapella";
    result.tokens.push({ type: "version", label: "Acapella" });
  } else if (q.includes("transition") || q.includes("transicion")) {
    result.version = "Transition";
    result.tokens.push({ type: "version", label: "Transition" });
  }
  if (q.includes("previa") || q.includes("warm up") || q.includes("warmup")) {
    result.mood = "Previa / Warm Up";
    result.tokens.push({ type: "mood", label: "Previa / Warm Up" });
  } else if (q.includes("pista") || q.includes("peak time") || q.includes("festival") || q.includes("driving") || q.includes("bailar") || q.includes("baile")) {
    result.mood = "Peak Time / Pista";
    result.tokens.push({ type: "mood", label: "Peak Time / Pista" });
  } else if (q.includes("sunset") || q.includes("chill") || q.includes("after") || q.includes("lounge")) {
    result.mood = "Chill / Sunset / After";
    result.tokens.push({ type: "mood", label: "Chill / Sunset" });
  }
  const yearMatch = q.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    result.year = parseInt(yearMatch[1], 10);
    result.tokens.push({ type: "year", label: `A\xF1o ${result.year}` });
  } else if (q.includes("retro") || q.includes("90s") || q.includes("80s") || q.includes("2000s")) {
    result.year = "Retro";
    result.tokens.push({ type: "year", label: "Retro" });
  }
  if (q.includes("tech house")) {
    result.genre = "House";
    result.subgenre = "Tech House";
    result.tokens.push({ type: "genre", label: "Tech House" });
  } else if (q.includes("afro house") || q.includes("afro")) {
    result.genre = "House";
    result.subgenre = "Afro House";
    result.tokens.push({ type: "genre", label: "Afro House" });
  } else if (q.includes("melodic techno")) {
    result.genre = "Techno";
    result.subgenre = "Melodic Techno";
    result.tokens.push({ type: "genre", label: "Melodic Techno" });
  } else if (q.includes("progressive house") || q.includes("house progresivo")) {
    result.genre = "House";
    result.subgenre = "Melodic / Progressive House";
    result.tokens.push({ type: "genre", label: "Progressive House" });
  } else if (q.includes("deep house")) {
    result.genre = "House";
    result.subgenre = "Deep House";
    result.tokens.push({ type: "genre", label: "Deep House" });
  } else if (q.includes("minimal") || q.includes("deep tech")) {
    result.genre = "Electro & Breaks";
    result.subgenre = "Minimal / Deep Tech";
    result.tokens.push({ type: "genre", label: "Minimal / Deep Tech" });
  } else if (q.includes("reggaeton") || q.includes("reggaet\xF3n")) {
    result.genre = "Latin & Urban";
    result.subgenre = "Reggaet\xF3n";
    result.tokens.push({ type: "genre", label: "Reggaet\xF3n" });
  } else if (q.includes("cachengue") || q.includes("rkt")) {
    result.genre = "Latin & Urban";
    result.subgenre = "Cachengue / RKT";
    result.tokens.push({ type: "genre", label: "Cachengue / RKT" });
  } else if (q.includes("cuarteto")) {
    result.genre = "Latin & Urban";
    result.subgenre = "Cuarteto";
    result.tokens.push({ type: "genre", label: "Cuarteto" });
  } else if (q.includes("guaracha")) {
    result.genre = "Latin & Urban";
    result.subgenre = "Guaracha";
    result.tokens.push({ type: "genre", label: "Guaracha" });
  } else if (q.includes("cumbia")) {
    result.genre = "Latin & Urban";
    result.subgenre = "Cumbia";
    result.tokens.push({ type: "genre", label: "Cumbia" });
  } else if (q.includes("latin house")) {
    result.genre = "House";
    result.subgenre = "Latin House";
    result.tokens.push({ type: "genre", label: "Latin House" });
  } else if (q.includes("techno") || q.includes("tecno")) {
    result.genre = "Techno";
    result.tokens.push({ type: "genre", label: "Techno" });
  } else if (q.includes("house")) {
    result.genre = "House";
    result.tokens.push({ type: "genre", label: "House" });
  } else if (q.includes("trance")) {
    result.genre = "Trance";
    result.tokens.push({ type: "genre", label: "Trance" });
  } else if (q.includes("drum & bass") || q.includes("drum and bass") || q.includes("dnb")) {
    result.genre = "Drum & Bass";
    result.tokens.push({ type: "genre", label: "Drum & Bass" });
  }
  return result;
}
const DJ_MOODS_LIST = [
  { id: "Peak Time", label: "\u{1F525} Peak Time", desc: "Cl\xEDmax de pista, alta pegada" },
  { id: "Dark", label: "\u{1F311} Dark", desc: "Oscuro, industrial, contundente" },
  { id: "Euphoric", label: "\u2728 Euphoric", desc: "Melod\xEDas \xE9picas, subid\xF3n emotivo" },
  { id: "Hypnotic", label: "\u{1F300} Hypnotic", desc: "Groove continuo y envolvente" },
  { id: "Raw", label: "\u26A1 Raw", desc: "Seco, crudo y minimalista" },
  { id: "Melancholic", label: "\u{1F327} Melancholic", desc: "Atmosf\xE9rico y profundo" }
];
const CamelotWheelModal = ({ isOpen, onClose, currentKey, onSelectKey }) => {
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
const BatchAuditorModal = ({ isOpen, onClose, onRunBatch }) => {
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
const DuplicateComparisonModal = ({ isOpen, onClose, tracks = [], onDuplicatesDeleted }) => {
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
const AuditWorkspace = ({
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
  lang = "es",
  t = (k) => k,
  currentFolder = "",
  setCurrentFolder
}) => {
  const [localRutaOrigen, setLocalRutaOrigen] = useState("");
  const rutaOrigen = currentFolder || localRutaOrigen;
  const setRutaOrigen = setCurrentFolder || setLocalRutaOrigen;
  const [isAuditing, setIsAuditing] = useState(false);
  const [isLoadingDir, setIsLoadingDir] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);
  const [metrics, setMetrics] = useState({ total: 0, missing: 0, missing_title: 0, missing_artist: 0, missing_cover: 0, duplicates: 0, ready: 0, errors: 0 });
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatusMsg, setBatchStatusMsg] = useState("");
  const [saveFeedback, setSaveFeedback] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const updateCurrentTrackField = (field, val) => {
    setTracks((prev) => prev.map((t2) => t2.id === currentTrack.id ? { ...t2, [field]: val } : t2));
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
    const startPath = initialPath || rutaOrigen || "";
    if (window.eel && window.eel.listar_subcarpetas_sistema) {
      try {
        const res = await window.eel.listar_subcarpetas_sistema(startPath)();
        if (res) {
          setFsCurrentPath(res.current || "");
          setFsParentPath(res.parent || "");
          setFsFolders(res.folders || []);
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
        }
      } catch (err) {
        console.error("Error navegando:", err);
      } finally {
        setFsLoading(false);
      }
    }
  };
  const handleSeleccionarCarpetaUI = async (targetPath) => {
    const finalPath = targetPath || fsCurrentPath;
    setRutaOrigen(finalPath);
    setFsBrowserOpen(false);
    await handleCargarDirectorio(finalPath);
  };
  const handleExplorar = async () => {
    handleAbrirNavegadorCarpetas(rutaOrigen);
  };
  const handleCargarDirectorio = async (pathOverride) => {
    const target = pathOverride || rutaOrigen;
    if (!target) return;
    if (window.eel && window.eel.cargar_metadatos_directorio) {
      setIsLoadingDir(true);
      setBatchProgress(5);
      setBatchStatusMsg(`Leyendo metadatos de archivos en ${target}...`);
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
    const target = pathOverride || rutaOrigen;
    if (!target) {
      alert("Por favor selecciona o explora una carpeta primero.");
      return;
    }
    if (window.eel && window.eel.iniciar_auditoria && !isAuditing) {
      setIsAuditing(true);
      setBatchProgress(5);
      setBatchStatusMsg(`Iniciando auditor\xEDa ac\xFAstica avanzada en ${target}...`);
      try {
        const res = await window.eel.iniciar_auditoria(target)();
        if (res && Array.isArray(res.tracks)) {
          setTracks(res.tracks);
          if (res.tracks.length > 0) {
            setSelectedTrack(res.tracks[0].id);
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
  const handleSortAudit = (field) => {
    setAuditSortDir((prev) => auditSortField === field && prev === "asc" ? "desc" : "asc");
    setAuditSortField(field);
  };
  const renderSortArrowAudit = (field) => {
    if (auditSortField !== field) return /* @__PURE__ */ React.createElement("span", { className: "text-gray-600 ml-1 text-[9px]" }, "\u2195");
    return /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 ml-1 font-bold text-[10px]" }, auditSortDir === "asc" ? "\u25B2" : "\u25BC");
  };
  const tracksFiltrados = useMemo(() => {
    let result = tracks.filter((t2) => {
      const term = busqueda.toLowerCase();
      const m = (t2?.t || t2?.title || "").toLowerCase().includes(term) || (t2?.a || t2?.artist || "").toLowerCase().includes(term) || (t2?.f || t2?.filename || "").toLowerCase().includes(term);
      if (!m) return false;
      if (filtro === "missing") return t2?.b === "--" || t2?.k === "--";
      if (filtro === "missing_title") return Boolean(t2?.missing_title || !t2?.title || t2?.title.toLowerCase().trim() === "untitled");
      if (filtro === "missing_artist") return Boolean(t2?.missing_artist || !t2?.artist || t2?.artist.toLowerCase().trim() === "desconocido");
      if (filtro === "missing_cover") return Boolean(t2?.missing_cover || !t2?.cover);
      if (filtro === "error") return Boolean(t2?.es_fake) || t2?.format === "FLAC" && String(t2?.status || "").includes("Fake");
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
  }, [tracks, busqueda, filtro, filterHeaderSearch, filterHeaderFormat, filterHeaderQuality, filterHeaderStatus, auditSortField, auditSortDir]);
  return /* @__PURE__ */ React.createElement("div", { className: "flex w-full h-full overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 border-b border-djzinc-800 bg-djzinc-950 flex justify-between items-center shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 items-center w-1/2" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 max-w-md bg-djzinc-900 rounded-md border border-djzinc-700 flex overflow-hidden" }, /* @__PURE__ */ React.createElement("span", { className: "bg-djzinc-800 px-3 py-1.5 text-xs text-gray-400 font-mono border-r border-djzinc-700 flex items-center" }, "ORIGEN"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: rutaOrigen,
      onChange: (e) => setRutaOrigen(e.target.value),
      onKeyDown: (e) => {
        if (e.key === "Enter") {
          handleCargarDirectorio(e.target.value);
        }
      },
      placeholder: "Escribe o explora una ruta de carpeta...",
      className: "flex-1 bg-transparent px-3 py-1.5 text-sm text-gray-200 outline-none font-mono"
    }
  )), /* @__PURE__ */ React.createElement("button", { onClick: handleExplorar, className: "bg-djzinc-800 hover:bg-djzinc-700 border border-djzinc-600 rounded px-4 py-1.5 text-xs font-bold text-gray-300 cursor-pointer transition-colors" }, t("btn_change_dir") || "Explorar")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2.5 items-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 bg-djzinc-900/90 p-1 rounded-lg border border-djzinc-800 shadow-sm" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setBatchModalOpen(true), className: "bg-djzinc-800 hover:bg-djzinc-750 border border-djcyan-500/40 text-djcyan-400 px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors", title: "Configurar opciones avanzadas de auditor\xEDa por lotes y car\xE1tulas" }, /* @__PURE__ */ React.createElement(Icons.Sliders, null), " ", t("btn_audit_batch") || "Configurar Lote"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleAuditar(), disabled: isAuditing, className: "bg-djzinc-800 hover:bg-djzinc-700 text-white px-3 py-1.5 rounded-md font-semibold text-xs border border-djzinc-650 flex items-center gap-1.5 cursor-pointer transition-colors" }, /* @__PURE__ */ React.createElement(Icons.Library, null), " ", isAuditing ? lang === "en" ? "Auditing..." : "Auditando..." : t("btn_execute_audit") || "Auditar Directorio"), /* @__PURE__ */ React.createElement("button", { onClick: handleInyectarCaratulasLote, disabled: isInjecting || tracks.length === 0, className: "bg-djzinc-800 hover:bg-djzinc-700 text-amber-400 border border-amber-600/60 px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow disabled:opacity-50 transition-colors", title: "Detecta o busca car\xE1tulas 1:1 e incrusta artwork (600x600) en todos los archivos de audio" }, "\u{1F5BC}\uFE0F ", t("btn_inject_covers") || "Inyectar Car\xE1tulas")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 bg-djzinc-900/90 p-1 rounded-lg border border-djzinc-800 shadow-sm" }, /* @__PURE__ */ React.createElement("button", { onClick: handleExportarXLS, disabled: tracks.length === 0, className: "bg-djzinc-800 hover:bg-djzinc-700 text-djgreen-400 border border-djgreen-700/60 px-2.5 py-1.5 rounded-md font-bold text-xs flex items-center gap-1 cursor-pointer shadow disabled:opacity-50 transition-colors", title: "Exportar reporte de auditor\xEDa a Excel (.xlsx / .csv)" }, /* @__PURE__ */ React.createElement(Icons.Excel, null), " XLS"), /* @__PURE__ */ React.createElement("button", { onClick: handleExportarSeratoCrates, disabled: tracks.length === 0, className: "bg-djzinc-800 hover:bg-djzinc-700 text-purple-400 border border-purple-700/60 px-2.5 py-1.5 rounded-md font-bold text-xs flex items-center gap-1 cursor-pointer shadow disabled:opacity-50 transition-colors", title: "Exportar archivos .crate oficiales a Serato DJ Pro" }, "\u{1F4BD} Crates"), /* @__PURE__ */ React.createElement("button", { onClick: handleExportarRekordboxXml, disabled: tracks.length === 0, className: "bg-djzinc-800 hover:bg-djzinc-700 text-blue-400 border border-blue-700/60 px-2.5 py-1.5 rounded-md font-bold text-xs flex items-center gap-1 cursor-pointer shadow disabled:opacity-50 transition-colors", title: "Exportar rekordbox.xml est\xE1ndar Pioneer DJ" }, "\u{1F4CB} Rekordbox")), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleGuardarTodoEnFicheros,
      disabled: isInjecting || tracks.length === 0,
      className: "bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black px-3.5 py-1.5 rounded-lg font-black text-xs shadow-lg shadow-emerald-500/25 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5",
      title: "Guarda y persiste todos los metadatos editados directamente en los archivos f\xEDsicos de audio en disco"
    },
    "\u{1F4BE} ",
    t("btn_save_all") || "Guardar Todo en Ficheros",
    " (",
    tracks.length,
    ")"
  ), (isAuditing || isLoadingDir || isInjecting || isExporting || batchProgress > 0) && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleCancelarProceso,
      className: "bg-red-950 hover:bg-red-900 text-red-300 border border-red-750 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer shadow-md transition-all active:scale-95",
      title: "Detener el proceso actual inmediatamente"
    },
    t("btn_cancel") || "\u2715 Cancelar"
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
      className: "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 hover:bg-red-900 text-red-300 border border-red-750 cursor-pointer transition-colors shadow"
    },
    t("btn_cancel") || "\u2715 Cancelar"
  ))), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-djzinc-950 h-2 rounded-full overflow-hidden border border-djzinc-800 shadow-inner" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "bg-gradient-to-r from-djcyan-500 to-djgreen-400 h-full transition-all duration-300 ease-out shadow-lg shadow-djcyan-500/50",
      style: { width: `${Math.max(5, Math.min(100, batchProgress))}%` }
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-djzinc-800 border-b border-djzinc-800 shrink-0" }, /* @__PURE__ */ React.createElement("div", { onClick: () => setFiltro("todos"), className: `p-3.5 flex flex-col justify-center cursor-pointer transition-colors ${filtro === "todos" ? "bg-djcyan-950/40 border-b-2 border-djcyan-400" : "bg-djzinc-950 hover:bg-djzinc-900"}` }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-bold uppercase mb-1" }, t("metric_total") || "Total Pistas"), /* @__PURE__ */ React.createElement("span", { className: "text-xl font-mono text-white font-bold" }, (metrics.total || 0).toLocaleString())), /* @__PURE__ */ React.createElement("div", { onClick: () => setFiltro("missing"), className: `p-3.5 flex flex-col justify-center cursor-pointer transition-colors ${filtro === "missing" ? "bg-amber-950/40 border-b-2 border-amber-400" : "bg-djzinc-950 hover:bg-djzinc-900"}` }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-bold uppercase mb-1" }, "Falta BPM/Key"), /* @__PURE__ */ React.createElement("span", { className: "text-xl font-mono text-amber-400 font-bold" }, (metrics.missing || 0).toLocaleString())), /* @__PURE__ */ React.createElement("div", { onClick: () => setFiltro("missing_title"), className: `p-3.5 flex flex-col justify-center cursor-pointer transition-colors ${filtro === "missing_title" ? "bg-amber-950/40 border-b-2 border-amber-400" : "bg-djzinc-950 hover:bg-djzinc-900"}` }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-bold uppercase mb-1" }, "Falta T\xEDtulo"), /* @__PURE__ */ React.createElement("span", { className: "text-xl font-mono text-amber-300 font-bold" }, (metrics.missing_title || 0).toLocaleString())), /* @__PURE__ */ React.createElement("div", { onClick: () => setFiltro("missing_artist"), className: `p-3.5 flex flex-col justify-center cursor-pointer transition-colors ${filtro === "missing_artist" ? "bg-amber-950/40 border-b-2 border-amber-400" : "bg-djzinc-950 hover:bg-djzinc-900"}` }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-bold uppercase mb-1" }, "Falta Artista"), /* @__PURE__ */ React.createElement("span", { className: "text-xl font-mono text-amber-300 font-bold" }, (metrics.missing_artist || 0).toLocaleString())), /* @__PURE__ */ React.createElement("div", { onClick: () => setFiltro("missing_cover"), className: `p-3.5 flex flex-col justify-center cursor-pointer transition-colors ${filtro === "missing_cover" ? "bg-amber-950/40 border-b-2 border-amber-400" : "bg-djzinc-950 hover:bg-djzinc-900"}` }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-bold uppercase mb-1" }, "Falta Cover"), /* @__PURE__ */ React.createElement("span", { className: "text-xl font-mono text-amber-300 font-bold" }, (metrics.missing_cover || 0).toLocaleString())), /* @__PURE__ */ React.createElement("div", { onClick: () => setDuplicateModalOpen(true), className: "p-3.5 bg-djzinc-950 hover:bg-djzinc-900 flex flex-col justify-center cursor-pointer transition-colors group" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-bold uppercase" }, "Duplicados"), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono text-amber-400 bg-amber-950/80 px-1 rounded border border-amber-800" }, "Comparar \u2696\uFE0F")), /* @__PURE__ */ React.createElement("span", { className: "text-xl font-mono text-amber-400 font-bold group-hover:text-amber-300" }, (metrics.duplicates || 0).toLocaleString())), /* @__PURE__ */ React.createElement("div", { onClick: () => setFiltro("error"), className: `p-3.5 flex flex-col justify-center cursor-pointer transition-colors ${filtro === "error" ? "bg-red-950/40 border-b-2 border-red-400" : "bg-djzinc-950 hover:bg-djzinc-900"}` }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-bold uppercase mb-1" }, t("metric_lossless") || "Cert. Lossless"), /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl font-mono text-djcyan-400 font-bold" }, tracks.filter((t2) => t2.cutoff_khz && !String(t2.status || "").includes("Fake")).length), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-500" }, "/ ", tracks.length, " PASS")))), /* @__PURE__ */ React.createElement("div", { className: "px-4 py-2 bg-djzinc-900 border-b border-djzinc-800 flex items-center justify-between shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-1 flex-wrap" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: busqueda,
      onChange: (e) => setBusqueda(e.target.value),
      placeholder: t("search_placeholder") || "Buscar por track, artista o clave...",
      className: "w-56 bg-djzinc-950 border border-djzinc-700 rounded-full px-4 py-1.5 text-xs text-gray-300 focus:border-djcyan-500 outline-none"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5 ml-1 flex-wrap" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setFiltro("todos"), className: `px-2.5 py-1 rounded-full text-[10px] font-medium cursor-pointer transition-colors ${filtro === "todos" ? "bg-djcyan-600 text-white font-bold" : "bg-djzinc-800 text-gray-300 hover:text-white"}` }, t("filter_all") || "Todos", " (", metrics.total || 0, ")"), /* @__PURE__ */ React.createElement("button", { onClick: () => setFiltro("missing"), className: `px-2.5 py-1 rounded-full text-[10px] font-medium cursor-pointer transition-colors ${filtro === "missing" ? "bg-amber-600 text-white font-bold" : "bg-amber-950/40 text-amber-400 border border-amber-800/40"}` }, "Falta BPM/Key (", metrics.missing || 0, ")"), /* @__PURE__ */ React.createElement("button", { onClick: () => setFiltro("missing_title"), className: `px-2.5 py-1 rounded-full text-[10px] font-medium cursor-pointer transition-colors ${filtro === "missing_title" ? "bg-amber-600 text-white font-bold" : "bg-amber-950/40 text-amber-300 border border-amber-800/40"}` }, "Falta T\xEDtulo (", metrics.missing_title || 0, ")"), /* @__PURE__ */ React.createElement("button", { onClick: () => setFiltro("missing_artist"), className: `px-2.5 py-1 rounded-full text-[10px] font-medium cursor-pointer transition-colors ${filtro === "missing_artist" ? "bg-amber-600 text-white font-bold" : "bg-amber-950/40 text-amber-300 border border-amber-800/40"}` }, "Falta Artista (", metrics.missing_artist || 0, ")"), /* @__PURE__ */ React.createElement("button", { onClick: () => setFiltro("missing_cover"), className: `px-2.5 py-1 rounded-full text-[10px] font-medium cursor-pointer transition-colors ${filtro === "missing_cover" ? "bg-amber-600 text-white font-bold" : "bg-amber-950/40 text-amber-300 border border-amber-800/40"}` }, "Falta Cover (", metrics.missing_cover || 0, ")"), /* @__PURE__ */ React.createElement("button", { onClick: () => setDuplicateModalOpen(true), className: "px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-900/60 hover:bg-amber-800 text-amber-300 border border-amber-700/80 cursor-pointer flex items-center gap-1 shadow" }, "\u2696\uFE0F Duplicados (", metrics.duplicates || 0, ")"), /* @__PURE__ */ React.createElement("button", { onClick: () => setFiltro("error"), className: `px-2.5 py-1 rounded-full text-[10px] font-medium cursor-pointer transition-colors ${filtro === "error" ? "bg-red-600 text-white font-bold" : "bg-red-950/40 text-red-400 border border-red-800/40"}` }, t("filter_errors") || "FLAC Fake", " (", metrics.errors || 0, ")"))), saveFeedback && /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-djgreen-400 font-bold animate-pulse" }, saveFeedback)), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-auto bg-[#0f0f13]" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left border-collapse text-xs whitespace-nowrap" }, /* @__PURE__ */ React.createElement("thead", { className: "sticky top-0 z-10 bg-djzinc-900/95 border-b border-djzinc-800 text-[11px] font-mono uppercase text-djzinc-400" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("id"), className: "py-2.5 px-2 w-7 text-center cursor-pointer hover:text-white transition-colors" }, t("th_num") || "#", " ", renderSortArrowAudit("id")), /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-2 w-28 text-center text-djcyan-400" }, t("th_waveform") || "Waveform"), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("title"), className: "py-2.5 px-3 min-w-[220px] cursor-pointer hover:text-white transition-colors" }, t("th_title") || "Archivo / T\xEDtulo", " ", renderSortArrowAudit("title")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("artist"), className: "py-2.5 px-2 w-28 cursor-pointer hover:text-white transition-colors" }, t("th_artist") || "Artista", " ", renderSortArrowAudit("artist")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("format"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, t("th_format") || "Formato", " ", renderSortArrowAudit("format")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("sample_rate_khz"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, t("th_khz") || "kHz", " ", renderSortArrowAudit("sample_rate_khz")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("bitrate_kbps"), className: "py-2.5 px-2 text-center w-20 cursor-pointer hover:text-white transition-colors" }, t("th_kbps") || "kbps", " ", renderSortArrowAudit("bitrate_kbps")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("calidad"), className: "py-2.5 px-2 text-center w-24 cursor-pointer hover:text-white transition-colors" }, t("th_quality") || "Calidad", " ", renderSortArrowAudit("calidad")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("perdida_pct"), className: "py-2.5 px-3 text-center min-w-[170px] cursor-pointer hover:text-white transition-colors" }, t("th_loss") || "P\xE9rdida / Compresi\xF3n", " ", renderSortArrowAudit("perdida_pct")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("cutoff_khz"), className: "py-2.5 px-1.5 text-center cursor-pointer hover:text-white transition-colors" }, t("th_fft") || "Cert. FFT", " ", renderSortArrowAudit("cutoff_khz")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("duration"), className: "py-2.5 px-1.5 text-center cursor-pointer hover:text-white transition-colors" }, t("th_duration") || "Time", " ", renderSortArrowAudit("duration")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("bpm"), className: "py-2.5 px-1.5 text-center cursor-pointer hover:text-white transition-colors" }, "BPM ", renderSortArrowAudit("bpm")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("key"), className: "py-2.5 px-1.5 text-center cursor-pointer hover:text-white transition-colors" }, "Key ", renderSortArrowAudit("key")), /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-1.5 text-center" }, t("th_cues") || "8 Hot Cues"), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("e"), className: "py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors" }, "\u26A1 Energ\xEDa ", renderSortArrowAudit("e")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("dance"), className: "py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors" }, "\u{1F57A} Dance ", renderSortArrowAudit("dance")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("fase_badge"), className: "py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors" }, "Fase DJ ", renderSortArrowAudit("fase_badge")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("comment"), className: "py-2.5 px-2 text-left cursor-pointer hover:text-white transition-colors" }, "Comentario Pro DJ ", renderSortArrowAudit("comment")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortAudit("status"), className: "py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors" }, t("th_status") || "Estado", " ", renderSortArrowAudit("status"))), /* @__PURE__ */ React.createElement("tr", { className: "bg-djzinc-950/90 border-b border-djzinc-800 text-[10px] lowercase font-sans" }, /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center font-mono text-[9px] text-gray-500" }, filterHeaderSearch || filterHeaderFormat !== "ALL" || filterHeaderQuality !== "ALL" || filterHeaderStatus !== "ALL" ? /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setFilterHeaderSearch("");
        setFilterHeaderFormat("ALL");
        setFilterHeaderQuality("ALL");
        setFilterHeaderStatus("ALL");
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
  )), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center" }, /* @__PURE__ */ React.createElement(
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
  )))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-djzinc-850/60 font-sans" }, tracksFiltrados.length === 0 && !isAuditing && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "19", className: "py-12 text-center text-gray-500 font-mono text-xs" }, 'No hay pistas cargadas en esta vista. Selecciona una carpeta y pulsa "Auditar Directorio".')), tracksFiltrados.map((row) => {
    const isRowPlaying = nowPlayingTrack && String(nowPlayingTrack.id) === String(row.id) && isPlaying;
    const coverUrl = getValidCover(row.cover || (row.path ? `/cover?path=${encodeURIComponent(row.path)}` : row.f ? `/cover?path=${encodeURIComponent(row.f)}` : null));
    const isFake = Boolean(row.es_fake || row.format === "FLAC" && String(row.status || "").includes("Fake"));
    return /* @__PURE__ */ React.createElement("tr", { key: row.id, onClick: () => {
      setSelectedTrack(row.id);
      setSidebarOpen(true);
      if (onPlayTrack) onPlayTrack(row, 0, false);
    }, className: `cursor-pointer select-none transition-colors ${selectedTrack === row.id ? "bg-djcyan-950/40 border-l-2 border-djcyan-400" : "hover:bg-djzinc-850/40"}` }, /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center text-djzinc-500 font-mono" }, row.id), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement(
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
    ), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-w-0 text-left" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-djcyan-400 text-xs truncate max-w-[210px]", title: row.t || row.title || row.f }, row.t || row.title || row.f || "Desconocido"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 font-mono truncate max-w-[210px]", title: row.f }, row.f || "")))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-gray-300 truncate max-w-[120px]", title: row.a || row.artist }, row.a || row.artist), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-djzinc-850 text-djcyan-400 border border-djzinc-750" }, row.format || (row.f ? row.f.split(".").pop().toUpperCase() : "FLAC"))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center font-mono text-[10px] text-gray-300" }, row.sample_rate_khz ? `${row.sample_rate_khz} kHz` : "44.1 kHz"), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center font-mono text-[10px] text-gray-300" }, row.bitrate_kbps ? `${row.bitrate_kbps} kbps` : row.format === "MP3" ? "320 kbps" : "1062 kbps"), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("span", { className: `px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${isFake ? "bg-red-950 text-red-400 border-red-800" : String(row.calidad || "").includes("Alta") || String(row.calidad || "").includes("Hi-Res") ? "bg-emerald-950/80 text-emerald-400 border-emerald-800" : String(row.calidad || "").includes("Media") ? "bg-amber-950/80 text-amber-400 border-amber-800" : row.calidad && row.calidad !== "Pendiente Auditor\xEDa" ? "bg-red-950/80 text-red-400 border-red-800" : "bg-djzinc-850 text-gray-400 border-djzinc-750"}` }, row.calidad || (isFake ? "Baja" : "Alta"))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-center" }, isFake ? /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800", title: `Corte espectral a ${row.cutoff_khz || "--"}kHz` }, "\u26A0\uFE0F Transcode (", row.perdida_pct || 0, "%)") : row.perdida === "Sin P\xE9rdida" ? /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/60" }, "Sin P\xE9rdida") : /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-300" }, row.perdida || "Sin auditar")), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-1.5 text-center" }, /* @__PURE__ */ React.createElement("span", { className: `px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${isFake ? "bg-red-950 text-red-400 border-red-800" : "bg-djgreen-950/80 text-djgreen-400 border-djgreen-800"}` }, row.cutoff_khz ? `${row.cutoff_khz}kHz` : "PASS")), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-1.5 text-center text-gray-400 font-mono" }, row.duration), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-1.5 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "bg-djzinc-850 text-gray-200 px-1.5 py-0.5 rounded font-mono border border-djzinc-750" }, row.b)), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-1.5 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded font-mono font-bold bg-djcyan-950 text-djcyan-400 border border-djcyan-800/50" }, row.k)), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-1.5 text-center" }, /* @__PURE__ */ React.createElement(
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
    })()), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-left" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 max-w-[220px]" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-400 truncate", title: row.comment || `[${row.b || "--"} BPM | ${row.k || "--"}] Intro limpia 32b \u2022 Drop contundente \u2022 Outro 64b` }, row.comment || `[${row.b || "--"} BPM | ${row.k || "--"}] Intro limpia 32b \u2022 Drop contundente \u2022 Outro 64b`))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, isFake ? /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[10px] font-mono font-black bg-red-950 text-red-400 border border-red-700 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse", title: "\xA1Alerta! Falso FLAC con corte lossy previo" }, "FLAC FAKE") : String(row.status || "").includes("VERDADERO") || String(row.status || "").includes("True") || String(row.status || "").includes("HI-RES") ? /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800" }, row.status) : row.format === "MP3" || String(row.status || "").includes("MP3") ? /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-djzinc-850 text-cyan-300 border border-djzinc-700" }, row.status) : /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-mono bg-djzinc-850 text-gray-300 border border-djzinc-750" }, row.status)));
  }))))), sidebarOpen && /* @__PURE__ */ React.createElement("aside", { key: currentTrack ? currentTrack.id : "none", className: "w-96 bg-djzinc-900 border-l border-djzinc-800 flex flex-col shrink-0 slide-in-right z-20 overflow-hidden shadow-2xl" }, /* @__PURE__ */ React.createElement("div", { className: "p-3 border-b border-djzinc-800 bg-djzinc-950 flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icons.Gear, null), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-xs uppercase tracking-wider text-gray-200" }, "Inspector DJ Granular")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono bg-djzinc-800 text-gray-400 px-2 py-0.5 rounded" }, "Track #", currentTrack.id || "--"), /* @__PURE__ */ React.createElement(
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
  )), /* @__PURE__ */ React.createElement(
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
  )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2 text-[11px] font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/80 p-2 rounded border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[9px] uppercase block" }, "Formato / Tasa"), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-300 font-bold" }, currentTrack.format || "FLAC", " \u2022 ", currentTrack.sample_rate_khz || 44.1, " kHz")), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/80 p-2 rounded border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[9px] uppercase block" }, "Bitrate / Bits"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-200 font-bold" }, currentTrack.bitrate_kbps ? `${currentTrack.bitrate_kbps} kbps` : currentTrack.format === "MP3" ? "320 kbps" : "1062 kbps")), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/80 p-2 rounded border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[9px] uppercase block" }, "Corte Espectral FFT"), /* @__PURE__ */ React.createElement("span", { className: `font-bold ${Boolean(currentTrack.es_fake || currentTrack.format === "FLAC" && String(currentTrack.status || "").includes("Fake")) ? "text-red-400" : "text-emerald-400"}` }, currentTrack.cutoff_khz ? `${currentTrack.cutoff_khz} kHz` : "PASS 22.05 kHz")), /* @__PURE__ */ React.createElement("div", { className: "bg-djzinc-900/80 p-2 rounded border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[9px] uppercase block" }, "Calidad & P\xE9rdida"), /* @__PURE__ */ React.createElement("span", { className: `font-bold ${Boolean(currentTrack.es_fake || currentTrack.format === "FLAC" && String(currentTrack.status || "").includes("Fake")) ? "text-red-400" : "text-emerald-400"}` }, currentTrack.calidad || (Boolean(currentTrack.es_fake) ? "Baja" : "Alta"), " (", currentTrack.perdida_pct ? `${currentTrack.perdida_pct}%` : "0%", ")"))), Boolean(currentTrack.es_fake || currentTrack.format === "FLAC" && String(currentTrack.status || "").includes("Fake")) ? /* @__PURE__ */ React.createElement("div", { className: "p-2 bg-red-950/80 border border-red-700/80 rounded text-[11px] font-mono text-red-300 flex items-center gap-2 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]" }, /* @__PURE__ */ React.createElement("span", null, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "font-bold block uppercase" }, "FLAC FAKE DETECTADO"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-red-400" }, "Corte a ", currentTrack.cutoff_khz, "kHz. Archivo inflado desde MP3 con p\xE9rdida."))) : /* @__PURE__ */ React.createElement("div", { className: "p-2 bg-emerald-950/50 border border-emerald-800/60 rounded text-[11px] font-mono text-emerald-300 flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", null, "\u2713"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "font-bold block uppercase" }, currentTrack.status || "Audio Aut\xE9ntico"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-emerald-400/90" }, currentTrack.perdida || "Sin P\xE9rdida (Rango audible 100% preservado)"))), /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-djzinc-850 flex flex-col gap-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-300 font-semibold flex items-center" }, "Trim Silencio (Zero-Cross)", /* @__PURE__ */ React.createElement(InfoTip, { title: "Recorte de Silencio", text: "Elimina el silencio muerto en cabecera cortando en paso por cero de amplitud (-60dBFS) para evitar clicks al mezclar." })), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60" }, `-${Number(currentTrack.trim_start_ms || 0).toFixed(1)} ms`)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("button", { onClick: () => handleMicroAjusteTrim(-10), className: "px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer", title: "Restar 10ms" }, "-10ms"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleMicroAjusteTrim(-1), className: "px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer", title: "Restar 1ms" }, "-1ms"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleMicroAjusteTrim(1), className: "px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer", title: "Sumar 1ms" }, "+1ms"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleMicroAjusteTrim(10), className: "px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-850 hover:bg-djzinc-750 text-gray-300 rounded border border-djzinc-700 cursor-pointer", title: "Sumar 10ms" }, "+10ms"), /* @__PURE__ */ React.createElement("button", { onClick: handleAutoDetectarTrimDownbeat, className: "px-1.5 py-0.5 text-[9px] font-mono font-bold bg-djzinc-800 hover:bg-djzinc-700 text-amber-300 rounded border border-amber-800/60 cursor-pointer", title: "Auto-detectar con DSP" }, "Auto")), /* @__PURE__ */ React.createElement(
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
    setIsAuditing(true);
    setBatchProgress(5);
    setBatchStatusMsg("Ejecutando procesamiento masivo de lote...");
    try {
      if (window.eel && window.eel.ejecutar_auditoria_lote) {
        const res = await window.eel.ejecutar_auditoria_lote(rutaOrigen, opts)();
        if (res && res.tracks) {
          setTracks(res.tracks);
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
  )))), fsBrowserOpen && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#0c0c12] border border-djzinc-800 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 border-b border-djzinc-800 bg-djzinc-950 flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold text-sm uppercase tracking-wider font-mono flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icons.Library, null), " Seleccionar Carpeta de M\xFAsica")), /* @__PURE__ */ React.createElement("button", { onClick: () => setFsBrowserOpen(false), className: "w-7 h-7 rounded-full bg-djzinc-800 hover:bg-djzinc-700 text-gray-300 flex items-center justify-center text-xs" }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "px-4 py-2.5 bg-djzinc-900/90 border-b border-djzinc-800 flex items-center gap-2 text-xs font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "Ruta:"), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-semibold truncate flex-1" }, fsCurrentPath || "Cargando..."), fsParentPath && fsParentPath !== fsCurrentPath && /* @__PURE__ */ React.createElement("button", { onClick: () => handleNavegarACarpeta(fsParentPath), className: "px-2.5 py-1 bg-djzinc-800 hover:bg-djzinc-700 text-white rounded text-[11px] border border-djzinc-700 cursor-pointer" }, "\u25B2 Subir Nivel")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-3 space-y-1 bg-[#07070a]" }, fsLoading ? /* @__PURE__ */ React.createElement("div", { className: "py-12 text-center text-gray-400 text-xs font-mono flex flex-col items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-6 h-6 border-2 border-djcyan-400 border-t-transparent rounded-full animate-spin" }), /* @__PURE__ */ React.createElement("span", null, "Explorando carpetas...")) : fsFolders.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "py-12 text-center text-gray-500 text-xs font-mono" }, "No hay subcarpetas en este directorio.") : fsFolders.map((f, idx) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: idx,
      onClick: () => handleNavegarACarpeta(f.path),
      className: "p-2.5 rounded-lg bg-djzinc-900/60 hover:bg-djcyan-950/40 border border-djzinc-800/80 hover:border-djcyan-500/50 flex items-center justify-between cursor-pointer group transition-all"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-amber-400 text-base" }, "\u{1F4C1}"), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-200 group-hover:text-white font-medium truncate" }, f.name)),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: (e) => {
          e.stopPropagation();
          handleSeleccionarCarpetaUI(f.path);
        },
        className: "px-3 py-1 bg-djzinc-800 hover:bg-djcyan-600 hover:text-black text-gray-300 text-[10px] font-mono font-bold rounded border border-djzinc-700 cursor-pointer transition-colors"
      },
      "Seleccionar"
    )
  ))), /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-djzinc-950 border-t border-djzinc-800 flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono text-gray-500" }, fsFolders.length, " carpetas disponibles"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setFsBrowserOpen(false), className: "px-4 py-1.5 bg-djzinc-800 text-gray-300 rounded text-xs" }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleSeleccionarCarpetaUI(fsCurrentPath), className: "px-4 py-1.5 bg-djcyan-500 hover:bg-djcyan-400 text-black font-bold text-xs rounded shadow" }, "Cargar Esta Carpeta"))))), camelotModalOpen && /* @__PURE__ */ React.createElement(
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
const HotCuesWorkspace = ({
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
  setCurrentFolder
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
  const activeCues = Array.from({ length: 8 }, (_, idx) => {
    const padNum = idx + 1;
    const existing = currentTrack && currentTrack.cues && currentTrack.cues[idx] ? currentTrack.cues[idx] : null;
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
  const durMs = parseDurationMs(currentTrack?.duration || "05:00");
  const bpm = currentTrack && (currentTrack.bpm || currentTrack.b) ? Math.max(30, parseFloat(currentTrack.bpm || currentTrack.b) || 128) : 128;
  const beatMs = 6e4 / bpm;
  const barMs = beatMs * 4;
  const downbeatMs = currentTrack && currentTrack.first_downbeat_ms ? parseFloat(currentTrack.first_downbeat_ms) : 0;
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
    const posMs = cue.pos_ms !== void 0 ? cue.pos_ms : parseTimeToMs(cue.time || "00:00.00");
    const pct = durMs > 0 ? posMs / durMs : 0;
    onPlayTrack(currentTrack, pct, true);
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
      if (window.eel && window.eel.calcular_hot_cues_fraseo) {
        const calculated = await window.eel.calcular_hot_cues_fraseo(durMs, bpm, Math.round(downbeatMs))();
        if (calculated && Array.isArray(calculated)) {
          updateCues(calculated);
          setSaveStatus("\u2713 8 Hot Cues auto-fraseados (16/32 compases)");
          setTimeout(() => setSaveStatus(""), 2500);
        }
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
      className: "px-2.5 py-1 text-xs font-bold font-mono bg-djcyan-950 hover:bg-djcyan-900 text-djcyan-300 rounded border border-djcyan-700/60 cursor-pointer shadow transition-all flex items-center gap-1.5 shrink-0 active:scale-95",
      title: "Cambiar carpeta de m\xFAsica"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F4C2}"),
    /* @__PURE__ */ React.createElement("span", null, t("btn_change_dir") || "Cambiar Carpeta")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleCargarDirectorio(currentFolder),
      className: "px-2 py-1 text-xs font-mono bg-djzinc-850 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-700 cursor-pointer shadow transition-all shrink-0",
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
      className: "px-3 py-1.5 bg-djgreen-600 hover:bg-djgreen-500 text-black font-mono font-bold text-xs rounded-lg shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5",
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
      className: "px-3 py-1.5 bg-djzinc-850 hover:bg-djzinc-800 text-gray-200 border border-djzinc-700 font-mono font-bold text-xs rounded-lg shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1.5",
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
  }))))), currentTrack ? /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-h-0 flex flex-col p-4 overflow-y-auto custom-scrollbar gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-b from-[#181826] via-[#101018] to-[#0a0a0f] border-2 border-djzinc-800 rounded-2xl p-4 shadow-2xl relative" }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-djcyan-500/40 to-transparent" }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col lg:flex-row items-center justify-between gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-djzinc-950 border-2 border-djzinc-700 p-1 flex items-center justify-center shadow-2xl shrink-0 group" }, /* @__PURE__ */ React.createElement(
    "img",
    {
      src: getValidCover(currentTrack.cover || (currentTrack.path ? `/cover?path=${encodeURIComponent(currentTrack.path)}` : null)),
      alt: "Cover Art",
      onError: (e) => {
        e.target.onerror = null;
        e.target.src = DEFAULT_VINYL_SVG;
      },
      className: "w-full h-full object-cover rounded-lg"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-1.5 right-1.5 bg-black/85 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-djcyan-400 border border-djzinc-750" }, currentTrack.format || "FLAC")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2.5 shrink-0" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        const firstCue = activeCues[0] || {};
        const cueMs = firstCue.pos_ms !== void 0 ? firstCue.pos_ms : downbeatMs || 0;
        const cuePct = durMs > 0 ? cueMs / durMs : 0;
        if (onPlayTrack) {
          onPlayTrack(currentTrack, cuePct, false);
        }
      },
      className: `w-12 h-12 rounded-full border-2 flex items-center justify-center font-mono font-black text-xs cursor-pointer shadow-xl transition-all active:scale-90 select-none ${!isCurrentPlayingThis ? "bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse" : "bg-[#181824] border-amber-700/60 text-amber-500 hover:border-amber-400 hover:text-amber-300"}`,
      title: "CUE: Regresar al punto de inicio maestro"
    },
    /* @__PURE__ */ React.createElement("span", { className: "tracking-wider" }, "CUE")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => onTogglePlay && onTogglePlay(),
      className: `w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm cursor-pointer shadow-xl transition-all active:scale-90 select-none ${isCurrentPlayingThis ? "bg-emerald-500 border-white text-black font-black shadow-[0_0_22px_rgba(16,185,129,0.9)]" : "bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse"}`,
      title: "PLAY/PAUSE: Iniciar o pausar reproducci\xF3n"
    },
    isCurrentPlayingThis ? /* @__PURE__ */ React.createElement("span", { className: "text-black font-black text-sm" }, "\u275A\u275A") : /* @__PURE__ */ React.createElement("span", { className: "text-emerald-400 font-black text-base ml-0.5" }, "\u25B6")
  )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-w-0 max-w-[210px]" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-600/50 text-[9px] font-mono font-black uppercase" }, "DECK 1 \u2022 MASTER"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-djcyan-400 font-bold" }, bpm.toFixed(1), " BPM"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-purple-400 font-bold" }, currentTrack.key || "8A")), /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-black text-white truncate mt-1", title: currentTrack.title || currentTrack.t }, currentTrack.title || currentTrack.t || "Track"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-djcyan-400 font-semibold truncate", title: currentTrack.artist || currentTrack.a }, currentTrack.artist || currentTrack.a || "Artista"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-1.5 text-xs font-mono font-bold" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-300" }, formatMsToTime(playProgress * durMs)), /* @__PURE__ */ React.createElement("span", { className: "text-gray-600" }, "/"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "-", formatMsToTime(Math.max(0, durMs - playProgress * durMs)))))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0 max-w-2xl bg-[#09090f] p-3 rounded-xl border border-djzinc-800 shadow-inner" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800/80 pb-2 mb-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 bg-[#12121c] px-2 py-0.5 rounded border border-djzinc-750" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-djcyan-400 shadow-[0_0_8px_#06b6d4]" }), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono font-black text-white uppercase tracking-wider" }, "HOT CUE MODE")), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-400" }, "8 Multi-Color Performance Pads \u2022 Fraseo & Beatgrid")), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-djcyan-400 font-bold" }, isCurrentPlayingThis ? `\u25CF EN SECCI\xD3N: CUE ${activePlayingCueId}` : "PAUSA")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-4 gap-2" }, activeCues.map((cue, idx) => {
    const padNum = cue.id !== void 0 ? cue.id : idx + 1;
    const isSelected = selectedCueId === padNum;
    const isPlayingThisCue = activePlayingCueId === padNum && isCurrentPlayingThis;
    const color = cue.color || (NV2_COLORS[idx] ? NV2_COLORS[idx].color : "#ef4444");
    const cueMs = cue.pos_ms !== void 0 ? cue.pos_ms : parseTimeToMs(cue.time || "00:00.00");
    const barNum = Math.max(1, Math.floor((cueMs - downbeatMs) / barMs) + 1);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: idx,
        onClick: () => {
          setSelectedCueId(padNum);
          handleJumpToCue(cue);
        },
        className: `p-2 rounded-lg border-2 flex flex-col justify-between cursor-pointer transition-all select-none relative overflow-hidden group min-h-[66px] ${isPlayingThisCue ? "bg-[#181824] scale-[1.03] ring-2 ring-white/90 shadow-lg" : isSelected ? "bg-[#14141f] border-white shadow-md" : "bg-[#0f0f18] hover:bg-[#14141e] border-djzinc-800"}`,
        style: {
          borderColor: isPlayingThisCue ? color : isSelected ? "#ffffff" : `${color}60`,
          boxShadow: isPlayingThisCue ? `0 0 20px ${color}90` : isSelected ? "0 0 10px rgba(255,255,255,0.4)" : `0 0 6px ${color}30`
        }
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `absolute top-0 left-0 right-0 h-1 transition-all ${isPlayingThisCue ? "opacity-100 animate-pulse" : "opacity-60"}`,
          style: { backgroundColor: color }
        }
      ),
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mt-0.5" }, /* @__PURE__ */ React.createElement("span", { className: `text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${isPlayingThisCue ? "bg-white text-black" : "bg-black/60 text-white"}` }, "PAD ", padNum), /* @__PURE__ */ React.createElement(
        "span",
        {
          className: `w-2 h-2 rounded-full transition-all ${isPlayingThisCue ? "scale-125 animate-ping" : ""}`,
          style: { backgroundColor: color }
        }
      )),
      /* @__PURE__ */ React.createElement("div", { className: "my-1 truncate" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-bold text-gray-200 block truncate group-hover:text-white", title: cue.name || cue.short_name }, cue.name || cue.short_name || `Cue ${padNum}`)),
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[10px] font-mono pt-1 border-t border-djzinc-800/80" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-djcyan-300" }, cue.time || "00:00.00"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 text-[9px]" }, "Bar ", barNum))
    );
  }))))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between bg-djzinc-950/80 border border-djzinc-850 px-3.5 py-2 rounded-lg" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold font-mono text-gray-300 uppercase flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(Icons.ZoomIn, null), /* @__PURE__ */ React.createElement("span", null, t("zoom_level") || "Zoom Horizontal", ":")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center bg-djzinc-900 p-0.5 rounded-lg border border-djzinc-800 text-xs font-mono" }, [
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
      className: `px-2.5 py-1 text-xs font-mono font-bold rounded border cursor-pointer transition-all flex items-center gap-1.5 ${snapToGrid ? "bg-emerald-950 text-emerald-400 border-emerald-700/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-djzinc-900 text-gray-400 border-djzinc-800 hover:text-white"}`,
      title: "Alinear marcadores autom\xE1ticamente a los tiempos del comp\xE1s"
    },
    /* @__PURE__ */ React.createElement("span", null, snapToGrid ? "\u2713" : "\u25CB"),
    /* @__PURE__ */ React.createElement("span", null, t("snap_to_grid") || "Snap a Rejilla")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowBeatgrid((prev) => !prev),
      className: `px-2.5 py-1 text-xs font-mono font-bold rounded border cursor-pointer transition-all flex items-center gap-1.5 ${showBeatgrid ? "bg-blue-950 text-blue-400 border-blue-700/80 shadow-[0_0_8px_rgba(59,130,246,0.3)]" : "bg-djzinc-900 text-gray-400 border-djzinc-800 hover:text-white"}`,
      title: "Mostrar l\xEDneas de comp\xE1s y frases de 16 compases"
    },
    /* @__PURE__ */ React.createElement("span", null, showBeatgrid ? "\u2713" : "\u25CB"),
    /* @__PURE__ */ React.createElement("span", null, t("show_beatgrid") || "Ver Beatgrid")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setFollowPlayhead((prev) => !prev),
      className: `px-2.5 py-1 text-xs font-mono font-bold rounded border cursor-pointer transition-all flex items-center gap-1.5 ${followPlayhead ? "bg-djcyan-950 text-djcyan-400 border-djcyan-700/80 shadow-[0_0_8px_rgba(6,182,212,0.3)]" : "bg-djzinc-900 text-gray-400 border-djzinc-800 hover:text-white"}`,
      title: "Centrar autom\xE1ticamente el scroll horizontal en la aguja de reproducci\xF3n"
    },
    /* @__PURE__ */ React.createElement("span", null, followPlayhead ? "\u2713" : "\u25CB"),
    /* @__PURE__ */ React.createElement("span", null, t("follow_playhead") || "Seguir Playhead")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleAutoPhraseCues,
      className: "px-3 py-1 bg-djcyan-500/20 hover:bg-djcyan-500 text-djcyan-300 hover:text-black font-mono font-bold text-xs rounded border border-djcyan-500/40 cursor-pointer shadow transition-all active:scale-95",
      title: "Calcular autom\xE1ticamente 8 Hot Cues por frases musicales (16/32 compases)"
    },
    t("auto_phrase") || "\u26A1 Auto-Frasear 16/32b"
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
  )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 font-mono text-xs" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 uppercase mr-1" }, "Nudge:"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleNudgeMs(-barMs),
      className: "px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-750 cursor-pointer shadow active:scale-95",
      title: "Retroceder 1 comp\xE1s (4 beats)"
    },
    "-1c"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleNudgeMs(-beatMs),
      className: "px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-750 cursor-pointer shadow active:scale-95",
      title: "Retroceder 1 beat (negra)"
    },
    "-1b"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleNudgeMs(-10),
      className: "px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-750 cursor-pointer shadow active:scale-95",
      title: "Retroceder 10 milisegundos"
    },
    "-10ms"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleNudgeMs(10),
      className: "px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-750 cursor-pointer shadow active:scale-95",
      title: "Avanzar 10 milisegundos"
    },
    "+10ms"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleNudgeMs(beatMs),
      className: "px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-750 cursor-pointer shadow active:scale-95",
      title: "Avanzar 1 beat (negra)"
    },
    "+1b"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleNudgeMs(barMs),
      className: "px-2 py-1 bg-djzinc-900 hover:bg-djzinc-800 text-gray-300 rounded border border-djzinc-750 cursor-pointer shadow active:scale-95",
      title: "Avanzar 1 comp\xE1s (4 beats)"
    },
    "+1c"
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleSetCueAtPlayhead,
      className: "px-4 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-black font-mono font-bold text-xs rounded-lg shadow-md cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5",
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
      className: "px-3 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-700/80 rounded-lg text-xs font-mono font-bold shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1.5",
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
const SpotifyWorkspace = ({ onPlayTrack, nowPlayingTrack, isPlaying, onTogglePlay, lang = "es", t = (k) => k }) => {
  const [spotifyUrl, setSpotifyUrl] = useState("https://open.spotify.com/intl-es/artist/23zJj2W0TQ0SvF4Fwo7mZK");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [destDir, setDestDir] = useState("/Users/admin/Music/mi musica");
  const [selectedFormat, setSelectedFormat] = useState("flac");
  const [downloadingMsg, setDownloadingMsg] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAuditingFft, setIsAuditingFft] = useState(false);
  const [fftProgress, setFftProgress] = useState(0);
  const [fftMsg, setFftMsg] = useState("");
  const [selectedId, setSelectedId] = useState("10");
  const [spInspectorOpen, setSpInspectorOpen] = useState(false);
  const [tracks, setTracks] = useState([]);
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
          setTracks((prev) => prev.map((t2) => {
            if (String(t2.id) === String(res.id)) {
              return {
                ...t2,
                cutoff_khz: res.cutoff_khz,
                corte: res.corte,
                status: res.status || res.estado || (res.cutoff_khz >= 20 ? "FLAC VERDADERO" : "FLAC FAKE"),
                estado: res.estado || res.status,
                calidad: res.calidad || (res.cutoff_khz >= 20 ? "Alta" : "Baja"),
                perdida: res.perdida || "Sin P\xE9rdida",
                perdida_pct: res.perdida_pct !== void 0 ? res.perdida_pct : 0,
                compresion: res.compresion || "",
                format: res.format || (selectedFormat ? selectedFormat.toUpperCase() : "FLAC"),
                sample_rate_khz: res.sample_rate_khz || 44.1,
                bitrate_kbps: res.bitrate_kbps || 0,
                bit_depth: res.bit_depth || 16,
                es_fake: Boolean(res.es_fake),
                badge_color: res.badge_color || (res.es_fake ? "red" : "green"),
                audit_msg: res.audit_msg || "",
                spectrum: res.spectrum || [],
                downloaded: true,
                local_path: res.path
              };
            }
            return t2;
          }));
          if (res.audit_msg) {
            setFftMsg(res.audit_msg);
          }
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
      window.notificar_fin_lote = finishBatch;
      window.eel.expose(window.actualizar_estado_descarga, "actualizar_estado_descarga");
      window.eel.expose(window.actualizar_progreso_descarga, "actualizar_progreso_descarga");
      window.eel.expose(window.actualizar_estado_fft, "actualizar_estado_fft");
      window.eel.expose(window.notificar_resultado_auditoria, "notificar_resultado_auditoria");
      window.eel.expose(window.notificar_fin_lote, "notificar_fin_lote");
    }
    handleAnalizar();
  }, []);
  const handleCancelarDescargas = async () => {
    if (window.eel && window.eel.cancelar_procesos_activos) {
      try {
        await window.eel.cancelar_procesos_activos()();
      } catch (e) {
        console.error("Error al cancelar descargas:", e);
      }
    }
    setIsDownloading(false);
    setIsAuditingFft(false);
    setDownloadProgress(0);
    setFftProgress(0);
    setDownloadingMsg(lang === "en" ? "[CANCELLED] Downloads and FFT audit stopped by user." : "[CANCELADO] Descargas y auditor\xEDa FFT detenidas por el usuario.");
    setTimeout(() => setDownloadingMsg(""), 3e3);
  };
  const handleAbrirNavegadorCarpetas = async (initialPath = "") => {
    setFsBrowserOpen(true);
    setFsLoading(true);
    const startPath = initialPath || destDir || "";
    if (window.eel && window.eel.listar_subcarpetas_sistema) {
      try {
        const res = await window.eel.listar_subcarpetas_sistema(startPath)();
        if (res) {
          setFsCurrentPath(res.current || "");
          setFsParentPath(res.parent || "");
          setFsFolders(res.folders || []);
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
        }
      } catch (err) {
        console.error("Error navegando:", err);
      } finally {
        setFsLoading(false);
      }
    }
  };
  const handleSeleccionarCarpetaDestino = (targetPath) => {
    const finalPath = targetPath || fsCurrentPath;
    setDestDir(finalPath);
    setFsBrowserOpen(false);
  };
  const [spSortField, setSpSortField] = useState("title");
  const [spSortDir, setSpSortDir] = useState("asc");
  const [spFilterSearch, setSpFilterSearch] = useState("");
  const [spFilterFormat, setSpFilterFormat] = useState("ALL");
  const [spFilterQuality, setSpFilterQuality] = useState("ALL");
  const [spFilterStatus, setSpFilterStatus] = useState("ALL");
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
      } else if (["id", "sample_rate_khz", "bitrate_kbps", "cutoff_khz", "bpm"].includes(spSortField)) {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return spSortDir === "asc" ? valA - valB : valB - valA;
      }
      return spSortDir === "asc" ? String(valA || "").localeCompare(String(valB || "")) : String(valB || "").localeCompare(String(valA || ""));
    });
    return result;
  }, [tracks, spFilterSearch, spFilterFormat, spFilterQuality, spFilterStatus, spSortField, spSortDir, selectedFormat]);
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
  const handlePlayPreview = async (track, e) => {
    if (e) e.stopPropagation();
    setSelectedId(track.id);
    if (nowPlayingTrack && (String(nowPlayingTrack.id) === String(track.id) || nowPlayingTrack.title === track.title)) {
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
      } catch (err) {
      }
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
    setDownloadProgress(20);
    setDownloadingMsg("[ANALIZANDO] Extrayendo metadatos y car\xE1tulas de alta resoluci\xF3n en Spotify...");
    try {
      if (window.eel && window.eel.analizar_catalogo_spotify) {
        setDownloadProgress(45);
        const res = await window.eel.analizar_catalogo_spotify(spotifyUrl)();
        setDownloadProgress(95);
        if (res && res.tracks && res.tracks.length > 0) {
          const mapped = res.tracks.map((t2, i) => ({ ...t2, selected: i === 0 }));
          setTracks(mapped);
          setSelectedId(mapped[0].id);
          setDownloadProgress(100);
          setDownloadingMsg(`[LISTO] ${mapped.length} pistas cargadas con car\xE1tulas oficiales.`);
        } else {
          setDownloadProgress(0);
          setDownloadingMsg("[AVISO] No se encontraron pistas para este enlace.");
        }
      }
    } catch (e) {
      setDownloadProgress(0);
      setDownloadingMsg(`[ERROR] Fallo al analizar cat\xE1logo: ${e}`);
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
    if (window.eel && window.eel.descargar_pistas_spotify_seleccionadas) {
      try {
        await window.eel.descargar_pistas_spotify_seleccionadas(listaPistas, selectedFormat, destDir)();
      } catch (e) {
        setIsDownloading(false);
        setDownloadProgress(0);
        setDownloadingMsg(`[ERROR] Fallo en la descarga: ${e}`);
      }
    }
  };
  const handleCambiarCarpeta = () => {
    handleAbrirNavegadorCarpetas(destDir);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "flex w-full h-full bg-[#09090c] text-gray-300 font-sans select-none overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "p-3.5 border-b border-djzinc-800 bg-[#0c0c10] flex items-center justify-between shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-1 max-w-xl" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 bg-[#060609] border border-djzinc-750 focus-within:border-djcyan-500 rounded flex items-center overflow-hidden" }, /* @__PURE__ */ React.createElement("span", { className: "px-2.5 py-1.5 text-[11px] font-mono text-djcyan-400 bg-[#0e0e13] border-r border-djzinc-800 font-semibold shrink-0" }, "B\xDASQUEDA / SPOTIFY"), /* @__PURE__ */ React.createElement(
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
      onClick: handleAnalizar,
      disabled: isAnalyzing,
      className: "px-4 py-1.5 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono rounded text-xs font-bold cursor-pointer transition-colors shadow flex items-center gap-1.5 disabled:opacity-50 shrink-0"
    },
    isAnalyzing ? "Buscando..." : "\u{1F50D} Buscar / Analizar"
  )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
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
      className: `px-3.5 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all ${selectedCount > 0 ? "bg-djcyan-500 hover:bg-djcyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]" : "bg-djzinc-800 text-gray-400 hover:text-white border border-djzinc-700"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u2B07 Descargar Seleccionadas (", selectedCount, ")")
  ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-xs font-mono text-gray-400" }, /* @__PURE__ */ React.createElement("span", null, "Destino:"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-200 truncate max-w-[140px]", title: destDir }, destDir.split("/").pop() || destDir), /* @__PURE__ */ React.createElement("button", { onClick: handleCambiarCarpeta, className: "text-djcyan-400 hover:text-white px-2 py-1 bg-djzinc-900 border border-djzinc-700 rounded text-[11px] cursor-pointer" }, "Cambiar")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 bg-[#060609] border border-djzinc-750 rounded p-1" }, ["flac", "mp3", "wav"].map((f) => /* @__PURE__ */ React.createElement("button", { key: f, onClick: () => setSelectedFormat(f), className: `px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors ${selectedFormat === f ? "bg-djcyan-500 text-black" : "text-gray-400 hover:text-white"}` }, f))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setSpInspectorOpen((prev) => !prev),
      className: `px-3 py-1.5 rounded text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${spInspectorOpen ? "bg-djcyan-950 text-djcyan-400 border-djcyan-700/60 shadow-inner" : "bg-djzinc-900 text-gray-400 border-djzinc-750 hover:text-white"}`,
      title: spInspectorOpen ? "Ocultar panel inspector" : "Mostrar panel inspector"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u25E8"),
    /* @__PURE__ */ React.createElement("span", null, spInspectorOpen ? "\u2715 Inspector" : "Inspector")
  ))), /* @__PURE__ */ React.createElement("div", { className: "px-4 py-2.5 bg-[#09090c] border-b border-djzinc-850 flex flex-col gap-2 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-xs font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-semibold flex items-center gap-1.5 truncate" }, /* @__PURE__ */ React.createElement("span", { className: `w-2 h-2 rounded-full ${isAnalyzing || isDownloading ? "bg-djcyan-400 animate-pulse" : "bg-djgreen-400"}` }), /* @__PURE__ */ React.createElement("span", null, downloadingMsg || `[LISTO] Introduce un enlace de Spotify o pulsa Analizar Enlace.`)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, (isDownloading || isAnalyzing || downloadProgress > 0) && /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-300 font-mono font-bold text-xs" }, downloadProgress, "%"), (isDownloading || isAuditingFft) && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleCancelarDescargas,
      className: "px-2 py-0.5 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[10px] font-mono font-bold cursor-pointer transition-colors shadow flex items-center gap-1",
      title: "Cancelar descarga y procesos activos"
    },
    "\u2715 ",
    t("btn_cancel") || "Cancelar"
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
  )))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-auto bg-[#08080b]" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left border-collapse text-xs whitespace-nowrap" }, /* @__PURE__ */ React.createElement("thead", { className: "sticky top-0 z-10 bg-[#0d0d12] border-b border-djzinc-800 text-[10px] font-mono uppercase text-gray-400" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-3 w-8 text-center" }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: allSelected, onChange: handleToggleSelectAll, className: "accent-djcyan-500 cursor-pointer" })), /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-2 w-10 text-center" }, "PLAY"), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("title"), className: "py-2.5 px-3 min-w-[260px] cursor-pointer hover:text-white transition-colors" }, t("th_title") || "T\xCDTULO", " / ", t("th_album") || "\xC1LBUM", " ", renderSortArrowSp("title")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("artist"), className: "py-2.5 px-3 min-w-[160px] cursor-pointer hover:text-white transition-colors" }, t("th_artist") || "ARTISTA", " ", renderSortArrowSp("artist")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("format"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, t("th_format") || "FORMATO", " ", renderSortArrowSp("format")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("sample_rate_khz"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, t("th_khz") || "KHZ", " ", renderSortArrowSp("sample_rate_khz")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("bitrate_kbps"), className: "py-2.5 px-2 text-center w-20 cursor-pointer hover:text-white transition-colors" }, t("th_kbps") || "KBPS", " ", renderSortArrowSp("bitrate_kbps")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("calidad"), className: "py-2.5 px-2 text-center w-24 cursor-pointer hover:text-white transition-colors" }, t("th_quality") || "CALIDAD", " ", renderSortArrowSp("calidad")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("cutoff_khz"), className: "py-2.5 px-3 text-center min-w-[170px] cursor-pointer hover:text-white transition-colors" }, t("th_loss") || "P\xC9RDIDA / CORTE", " ", renderSortArrowSp("cutoff_khz")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("duration"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, t("th_duration") || "DURACI\xD3N", " ", renderSortArrowSp("duration")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("bpm"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, "BPM ", renderSortArrowSp("bpm")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("key"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, "KEY ", renderSortArrowSp("key")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortSp("status"), className: "py-2.5 px-3 text-center min-w-[140px] cursor-pointer hover:text-white transition-colors" }, t("th_status") || "ESTADO", " / ", t("download_btn") || "ACCI\xD3N", " ", renderSortArrowSp("status"))), /* @__PURE__ */ React.createElement("tr", { className: "bg-[#07070a] border-b border-djzinc-800 text-[10px] lowercase font-sans" }, /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center font-mono text-[9px] text-gray-500" }, spFilterSearch || spFilterFormat !== "ALL" || spFilterQuality !== "ALL" || spFilterStatus !== "ALL" ? /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setSpFilterSearch("");
        setSpFilterFormat("ALL");
        setSpFilterQuality("ALL");
        setSpFilterStatus("ALL");
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
      value: spFilterStatus,
      onChange: (e) => setSpFilterStatus(e.target.value),
      className: "bg-[#111116] border border-djzinc-750 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none font-mono"
    },
    /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "Todos"),
    /* @__PURE__ */ React.createElement("option", { value: "DOWNLOADED" }, "Descargado"),
    /* @__PURE__ */ React.createElement("option", { value: "PENDING" }, "Pendiente"),
    /* @__PURE__ */ React.createElement("option", { value: "LOSSLESS" }, "Lossless"),
    /* @__PURE__ */ React.createElement("option", { value: "FAKE" }, "FLAC Fake")
  )))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-djzinc-850/60 font-sans" }, tracksFiltradosSp.length === 0 && !isAnalyzing && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "13", className: "py-12 text-center text-gray-500 font-mono text-xs" }, tracks.length === 0 ? 'Pega una URL de Spotify o escribe una b\xFAsqueda por texto arriba y haz clic en "Buscar / Analizar".' : "No hay pistas que coincidan con los filtros aplicados.")), tracksFiltradosSp.map((row) => {
    const isSelectedRow = row.id === selectedId;
    const isRowPlaying = nowPlayingTrack && String(nowPlayingTrack.id) === String(row.id) && isPlaying;
    const isFake = Boolean(row.es_fake || String(row.status || "").includes("Fake"));
    return /* @__PURE__ */ React.createElement("tr", { key: row.id, onClick: () => {
      setSelectedId(row.id);
      setSpInspectorOpen(true);
    }, className: `cursor-pointer select-none transition-colors ${isSelectedRow ? "bg-djcyan-950/35 border-l-2 border-djcyan-400" : "hover:bg-[#101015]"}` }, /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-center", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: row.selected, onChange: () => handleToggleRow(row.id), className: "accent-djcyan-500 cursor-pointer" })), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center", onClick: (e) => handlePlayPreview(row, e) }, /* @__PURE__ */ React.createElement("button", { className: `w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isRowPlaying ? "bg-djcyan-500 text-black font-bold shadow-[0_0_8px_rgba(6,182,212,0.6)]" : "bg-[#181820] text-gray-400 hover:text-white hover:bg-djzinc-800"}` }, isRowPlaying ? "\u275A\u275A" : "\u25B6")), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("img", { src: getValidCover(row.cover), alt: "Cover", onError: (e) => {
      e.target.onerror = null;
      e.target.src = DEFAULT_VINYL_SVG;
    }, className: "w-9 h-9 rounded object-cover border border-djzinc-700 shrink-0 shadow-sm" }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-djcyan-400 text-xs truncate max-w-sm", title: row.title }, row.title), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 font-mono truncate max-w-sm", title: row.album }, row.album)))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-gray-300 text-xs truncate max-w-xs" }, row.artist), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-djzinc-850 text-djcyan-400 border border-djzinc-750" }, row.format || (selectedFormat || "flac").toUpperCase())), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center font-mono text-[10px] text-gray-300" }, row.sample_rate_khz ? `${row.sample_rate_khz} kHz` : row.downloaded ? "44.1 kHz" : "--"), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center font-mono text-[10px] text-gray-300" }, row.bitrate_kbps ? `${row.bitrate_kbps} kbps` : row.downloaded ? selectedFormat === "mp3" ? "320 kbps" : "1062 kbps" : "--"), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, row.downloaded ? /* @__PURE__ */ React.createElement("span", { className: `px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${isFake ? "bg-red-950 text-red-400 border-red-800" : String(row.calidad || "").includes("Alta") || String(row.calidad || "").includes("Hi-Res") ? "bg-emerald-950/80 text-emerald-400 border-emerald-800" : String(row.calidad || "").includes("Media") ? "bg-amber-950/80 text-amber-400 border-amber-800" : "bg-red-950/80 text-red-400 border-red-800"}` }, row.calidad || (isFake ? "Baja" : "Alta")) : /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-500" }, "Pendiente")), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-center" }, row.downloaded ? isFake ? /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800", title: `Corte espectral a ${row.cutoff_khz || "--"}kHz` }, "\u26A0\uFE0F Transcode (", row.perdida_pct || 0, "%)") : /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/60", title: `Corte a ${row.cutoff_khz || 22.05}kHz` }, row.perdida === "Sin P\xE9rdida" ? "Sin P\xE9rdida" : row.perdida || "Sin P\xE9rdida") : /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-500" }, "--")), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center font-mono text-gray-400 text-xs" }, row.duration), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "bg-[#14141c] text-gray-200 px-1.5 py-0.5 rounded text-[11px] font-mono border border-djzinc-800" }, row.bpm)), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-mono font-bold text-xs" }, row.key)), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-center", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-1.5" }, row.downloaded ? isFake ? /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[10px] font-mono font-black bg-red-950 text-red-400 border border-red-700 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse", title: "\xA1Alerta! Falso FLAC con corte lossy previo" }, "FLAC FAKE") : /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 shadow", title: `Corte detectado: ${row.cutoff_khz || 22.05}kHz` }, row.status || "FLAC VERDADERO") : /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => lanzarDescargaReal([row]),
        className: "px-3 py-1 rounded text-[11px] font-mono font-semibold border transition-colors cursor-pointer bg-[#14141c] hover:bg-djcyan-600 hover:text-black text-gray-300 border-djzinc-750"
      },
      `${t("download_btn") || "Descargar"} .${selectedFormat}`
    ))));
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
  }, className: "w-full h-full object-cover" }), /* @__PURE__ */ React.createElement("span", { className: "absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-gray-300 font-mono border border-djzinc-700" }, "HD Cover 640px")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("h4", { className: "font-bold text-sm text-djcyan-400 truncate", title: currentTrack.title }, currentTrack.title || "Selecciona una pista"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 truncate" }, currentTrack.artist || "--")), /* @__PURE__ */ React.createElement("button", { onClick: (e) => handlePlayPreview(currentTrack, e), className: "px-3 py-1 bg-djcyan-500 hover:bg-djcyan-400 text-black font-mono font-bold text-[10px] rounded shadow cursor-pointer shrink-0" }, nowPlayingTrack && (String(nowPlayingTrack.id) === String(currentTrack.id) || nowPlayingTrack.title === currentTrack.title) && isPlaying ? "\u275A\u275A PAUSE" : "\u25B6 PRE-ESCUCHA")), /* @__PURE__ */ React.createElement(RekordboxWaveform, { track: currentTrack, duration: currentTrack.duration || "03:30", onSeekTrack: (trk, pct) => handlePlayPreview(trk) }), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2 text-xs font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#050508] p-2.5 rounded border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 block uppercase" }, "Tempo"), /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold" }, currentTrack.bpm ? `${currentTrack.bpm} BPM` : "--")), /* @__PURE__ */ React.createElement("div", { className: "bg-[#050508] p-2.5 rounded border border-djzinc-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 block uppercase" }, "Clave Camelot"), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold" }, currentTrack.key || "--"))), /* @__PURE__ */ React.createElement("div", { className: "bg-[#050508] p-3 rounded border border-djzinc-800 space-y-2 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "\xC1lbum:"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-200 truncate max-w-[200px]" }, currentTrack.album || "--")), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "ISRC:"), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-gray-300" }, currentTrack.isrc || "Auto-Tag")), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "Formato Destino:"), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-djcyan-400 font-bold uppercase" }, ".", selectedFormat, " Lossless")))), /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-djzinc-950 border-t border-djzinc-800" }, /* @__PURE__ */ React.createElement("button", { onClick: () => lanzarDescargaReal(selectedCount > 0 ? tracks.filter((t2) => t2.selected) : [currentTrack]), className: "w-full py-2 bg-djcyan-600 hover:bg-djcyan-500 text-black rounded font-bold text-xs shadow-md cursor-pointer transition-colors" }, "Descargar ", selectedCount > 1 ? `Seleccionadas (${selectedCount})` : "Pista Actual", " .", selectedFormat.toUpperCase()))), fsBrowserOpen && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#0b0b10] border border-djzinc-800 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 border-b border-djzinc-800 bg-djzinc-950 flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icons.Library, null), /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-white uppercase tracking-wider font-mono" }, "Seleccionar Carpeta de Destino")), /* @__PURE__ */ React.createElement("button", { onClick: () => setFsBrowserOpen(false), className: "text-gray-400 hover:text-white text-xs px-2 py-1 rounded bg-djzinc-900 border border-djzinc-800 cursor-pointer" }, "\u2715 Cerrar")), /* @__PURE__ */ React.createElement("div", { className: "px-4 py-2.5 bg-djzinc-900 border-b border-djzinc-800 flex items-center gap-2 text-xs font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 shrink-0" }, "Ruta:"), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 truncate flex-1" }, fsCurrentPath || "/"), fsParentPath && /* @__PURE__ */ React.createElement("button", { onClick: () => handleNavegarACarpeta(fsParentPath), className: "px-2.5 py-1 bg-djzinc-800 hover:bg-djzinc-750 text-gray-200 rounded border border-djzinc-700 cursor-pointer text-xs" }, "\u2B06 Subir nivel")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-3 space-y-1 min-h-[250px] max-h-[400px]" }, fsLoading ? /* @__PURE__ */ React.createElement("div", { className: "py-12 text-center text-xs font-mono text-djcyan-400 animate-pulse" }, "Explorando directorios...") : fsFolders.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "py-12 text-center text-xs font-mono text-gray-500" }, "No se encontraron subdirectorios") : fsFolders.map((f, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, onDoubleClick: () => handleNavegarACarpeta(f.path), className: "flex items-center justify-between p-2 rounded hover:bg-djzinc-900 cursor-pointer border border-transparent hover:border-djzinc-800 transition-colors" }, /* @__PURE__ */ React.createElement("div", { onClick: () => handleNavegarACarpeta(f.path), className: "flex items-center gap-2.5 flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-amber-400 text-sm" }, "\u{1F4C1}"), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono text-gray-300 truncate" }, f.name)), /* @__PURE__ */ React.createElement("button", { onClick: () => handleSeleccionarCarpetaDestino(f.path), className: "px-2.5 py-1 bg-djcyan-500 hover:bg-djcyan-400 text-black font-bold text-[10px] rounded cursor-pointer shrink-0" }, "Seleccionar")))), /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-djzinc-950 border-t border-djzinc-800 flex justify-between items-center" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setFsBrowserOpen(false), className: "px-3 py-1.5 rounded text-xs bg-djzinc-900 border border-djzinc-800 text-gray-400 hover:text-white cursor-pointer" }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleSeleccionarCarpetaDestino(fsCurrentPath), className: "px-4 py-1.5 rounded text-xs font-bold bg-djcyan-500 hover:bg-djcyan-400 text-black cursor-pointer shadow" }, "Usar esta Carpeta")))));
};
const TaxonomyWorkspace = ({
  tracks = [],
  onTracksUpdated,
  onNavigateTab,
  onPlayTrack,
  nowPlayingTrack = null,
  isPlaying = false,
  onTogglePlay = () => {
  },
  onSelectTrackForCues,
  onSendToSpotify
}) => {
  const [activeSubView, setActiveSubView] = useState("search");
  const [searchScope, setSearchScope] = useState("all");
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState([]);
  const [searchLocalResults, setSearchLocalResults] = useState([]);
  const [hasExecutedSearch, setHasExecutedSearch] = useState(false);
  const [displayMode, setDisplayMode] = useState("table");
  const [taxSortField, setTaxSortField] = useState("matchScore");
  const [taxSortDir, setTaxSortDir] = useState("desc");
  const [taxFilterSearch, setTaxFilterSearch] = useState("");
  const [taxFilterGenre, setTaxFilterGenre] = useState("ALL");
  const [taxFilterOrigin, setTaxFilterOrigin] = useState("ALL");
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
  const parsedQuery = useMemo(() => parseCuencaDJQuery(aiQuery), [aiQuery]);
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
      } else if (["matchScore", "displayBpm"].includes(taxSortField)) {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return taxSortDir === "asc" ? valA - valB : valB - valA;
      }
      return taxSortDir === "asc" ? String(valA || "").localeCompare(String(valB || "")) : String(valB || "").localeCompare(String(valA || ""));
    });
    return scored;
  }, [allPoolTracks, aiQuery, parsedQuery, selectedGenreFilter, selectedSubgenreFilterUI, selectedVersionFilter, selectedBpmFilter, selectedKeyFilter, selectedMoodFilter, taxFilterSearch, taxFilterGenre, taxFilterOrigin, taxSortField, taxSortDir]);
  const handleCargarEnDeck = (trk) => {
    if (!trk) return;
    const isCurrent = isPlaying && nowPlayingTrack && (String(nowPlayingTrack.id) === String(trk.id) || nowPlayingTrack.path && nowPlayingTrack.path === trk.path || nowPlayingTrack.title === trk.displayTitle);
    if (isCurrent && onTogglePlay) {
      onTogglePlay();
      return;
    }
    if (onPlayTrack) {
      onPlayTrack(trk, 0, true);
      setFeedbackMsg(`\u2713 "${trk.displayTitle}" cargado y reproduciendo en Deck 1`);
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
  };
  return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col h-full w-full overflow-hidden bg-djzinc-950 text-gray-200" }, /* @__PURE__ */ React.createElement("div", { className: "px-5 pt-4 pb-3 border-b border-djzinc-800 bg-[#08080c] shrink-0 space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-lg bg-djcyan-500/10 border border-djcyan-500/40 flex items-center justify-center text-djcyan-400 font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]" }, "\u26A1"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-black text-white uppercase tracking-wider font-mono flex items-center gap-2" }, "Centro de Taxonom\xEDa Musical & Crates"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 text-xs" }, "Buscador inteligente en lenguaje natural inspirado en Cuenca Music y ruteo jer\xE1rquico a crates de Serato / Rekordbox."))), /* @__PURE__ */ React.createElement("div", { className: "inline-flex rounded-xl border border-djzinc-700/80 p-1 bg-djzinc-900/90 shadow" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setActiveSubView("search"),
      className: `px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeSubView === "search" ? "bg-gradient-to-r from-djcyan-500 to-blue-500 text-black shadow-md" : "text-gray-400 hover:text-white"}`
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F50D} Buscador IA Cuenca Style"),
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
  )), parsedQuery.tokens && parsedQuery.tokens.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-1.5 pt-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-400 mr-1" }, "IA Interpret\xF3:"), parsedQuery.tokens.map((tok, idx) => /* @__PURE__ */ React.createElement(
    "span",
    {
      key: idx,
      className: "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-djcyan-950/80 text-djcyan-300 border border-djcyan-600/70 shadow-sm flex items-center gap-1"
    },
    /* @__PURE__ */ React.createElement("span", null, "\u2713"),
    /* @__PURE__ */ React.createElement("span", null, tok.label)
  ))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-1.5 pt-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-500 mr-1 shrink-0" }, "Sugerencias R\xE1pidas:"), CUENCA_PROMPT_CHIPS.map((chip, cIdx) => /* @__PURE__ */ React.createElement(
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
  ))), showAdvancedFilters && /* @__PURE__ */ React.createElement("div", { className: "p-3.5 bg-djzinc-900/90 border border-djzinc-800 rounded-xl grid grid-cols-2 md:grid-cols-6 gap-2.5 text-xs font-mono animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-gray-400 text-[10px]" }, "G\xE9nero Ra\xEDz:"), /* @__PURE__ */ React.createElement(
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
  )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col justify-end" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: resetFilters,
      className: "w-full py-1 bg-djzinc-800 hover:bg-djzinc-750 text-gray-300 hover:text-white rounded border border-djzinc-700 text-xs font-bold cursor-pointer transition-colors"
    },
    "\u21BA Reset Filtros"
  )))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-5 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between text-xs font-mono text-gray-400 gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Mostrando "), /* @__PURE__ */ React.createElement("strong", { className: "text-white font-bold" }, searchResults.length), /* @__PURE__ */ React.createElement("span", null, " temas para "), /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold" }, aiQuery ? `"${aiQuery}"` : "Exploraci\xF3n Taxon\xF3mica"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 ml-2" }, "(", searchScope === "local" ? "Solo Biblioteca Local" : searchScope === "online" ? "Solo Record Pool Online" : "Biblioteca Local + Record Pool", ")")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-djcyan-400" }), /* @__PURE__ */ React.createElement("span", null, "Biblioteca (", localTracks.length + searchLocalResults.length, ")")), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-purple-400" }), /* @__PURE__ */ React.createElement("span", null, "Record Pool Online (", onlineResults.length > 0 ? onlineResults.length : catalogTracks.length, ")")), /* @__PURE__ */ React.createElement("div", { className: "inline-flex rounded-lg border border-djzinc-750 p-0.5 bg-[#050508] ml-2" }, /* @__PURE__ */ React.createElement(
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
    /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto rounded-xl border border-djzinc-800 bg-[#07070a] shadow-lg" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left border-collapse text-xs whitespace-nowrap" }, /* @__PURE__ */ React.createElement("thead", { className: "sticky top-0 z-10 bg-[#0d0d12] border-b border-djzinc-800 text-[10px] font-mono uppercase text-gray-400" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-3 w-8 text-center" }, "#"), /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-2 w-10 text-center" }, "PLAY"), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("title"), className: "py-2.5 px-3 min-w-[240px] cursor-pointer hover:text-white transition-colors" }, "T\xCDTULO / \xC1LBUM ", renderSortArrowTax("title")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("artist"), className: "py-2.5 px-3 min-w-[150px] cursor-pointer hover:text-white transition-colors" }, "ARTISTA ", renderSortArrowTax("artist")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("genre"), className: "py-2.5 px-2.5 cursor-pointer hover:text-white transition-colors" }, "G\xC9NERO ", renderSortArrowTax("genre")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("subgenre"), className: "py-2.5 px-2.5 cursor-pointer hover:text-white transition-colors" }, "SUBG\xC9NERO ", renderSortArrowTax("subgenre")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("displayBpm"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, "BPM ", renderSortArrowTax("displayBpm")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("key"), className: "py-2.5 px-2 text-center w-16 cursor-pointer hover:text-white transition-colors" }, "KEY ", renderSortArrowTax("key")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("version"), className: "py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors" }, "VERSI\xD3N ", renderSortArrowTax("version")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("origin"), className: "py-2.5 px-2.5 text-center cursor-pointer hover:text-white transition-colors" }, "ORIGEN ", renderSortArrowTax("origin")), /* @__PURE__ */ React.createElement("th", { onClick: () => handleSortTax("matchScore"), className: "py-2.5 px-2.5 text-center cursor-pointer hover:text-white transition-colors" }, "MATCH % ", renderSortArrowTax("matchScore")), /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-2 text-center" }, "\u26A1 ENERG\xCDA"), /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-2 text-center" }, "\u{1F57A} DANCE"), /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-2 text-center" }, "FASE DJ"), /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-2.5 text-left" }, "COMENTARIO PRO"), /* @__PURE__ */ React.createElement("th", { className: "py-2.5 px-3 text-center min-w-[150px]" }, "ACCIONES DJ")), /* @__PURE__ */ React.createElement("tr", { className: "bg-[#050508] border-b border-djzinc-800 text-[10px] lowercase font-sans" }, /* @__PURE__ */ React.createElement("th", { className: "p-1 text-center font-mono text-[9px] text-gray-500" }, taxFilterSearch || taxFilterGenre !== "ALL" || taxFilterOrigin !== "ALL" ? /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setTaxFilterSearch("");
          setTaxFilterGenre("ALL");
          setTaxFilterOrigin("ALL");
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
    )), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }), /* @__PURE__ */ React.createElement("th", { className: "p-1" }))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-djzinc-850/60 font-sans" }, searchResults.map((trk, idx) => {
      const keyData = CAMELOT_WHEEL_DATA[trk.displayKey] || CAMELOT_WHEEL_DATA["8A"];
      const isLocal = Boolean(trk.isLocal || trk.is_local);
      const isOnline = Boolean(trk.isOnlinePool || trk.is_online);
      const isPlayingRow = nowPlayingTrack && (String(nowPlayingTrack.id) === String(trk.id) || nowPlayingTrack.title === trk.displayTitle) && isPlaying;
      return /* @__PURE__ */ React.createElement("tr", { key: trk.id || idx, className: "hover:bg-[#101016] transition-colors cursor-pointer select-none" }, /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-center text-gray-500 font-mono text-[10px]" }, idx + 1), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center", onClick: (e) => {
        e.stopPropagation();
        handleCargarEnDeck(trk);
      } }, /* @__PURE__ */ React.createElement("button", { className: `w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isPlayingRow ? "bg-djcyan-500 text-black font-bold shadow-[0_0_8px_rgba(6,182,212,0.6)]" : "bg-[#181820] text-gray-400 hover:text-white hover:bg-djzinc-800"}` }, isPlayingRow ? "\u275A\u275A" : "\u25B6")), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("img", { src: getValidCover(trk.displayCover), alt: "Cover", onError: (e) => {
        e.target.onerror = null;
        e.target.src = DEFAULT_VINYL_SVG;
      }, className: "w-9 h-9 rounded object-cover border border-djzinc-700 shrink-0 shadow-sm" }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-djcyan-400 text-xs truncate max-w-sm", title: trk.displayTitle }, trk.displayTitle), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 font-mono truncate max-w-sm", title: trk.displayAlbum }, trk.displayAlbum || "--")))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-gray-300 text-xs truncate max-w-xs" }, trk.displayArtist), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2.5 font-mono text-[11px] text-gray-300" }, trk.displayGenre), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2.5 font-mono text-[10px] text-djcyan-400 font-semibold" }, trk.displaySubgenre), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center font-mono text-xs text-white font-bold" }, trk.displayBpm), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement(
        "span",
        {
          className: "px-1.5 py-0.5 rounded font-mono font-bold text-[10px] border cursor-pointer",
          style: { backgroundColor: `${keyData.color}20`, borderColor: `${keyData.color}80`, color: keyData.color },
          onClick: () => setIsCamelotModalOpen(true),
          title: `Key ${trk.displayKey} (${keyData.classical})`
        },
        trk.displayKey
      )), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center font-mono text-[10px] text-gray-400" }, trk.displayVersion || "Original Mix"), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2.5 text-center" }, /* @__PURE__ */ React.createElement("span", { className: `text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${isLocal ? "bg-djcyan-950 text-djcyan-300 border-djcyan-700/60" : isOnline ? "bg-purple-950 text-purple-300 border-purple-700/60" : "bg-emerald-950 text-emerald-300 border-emerald-700/60"}` }, isLocal ? "\u{1F4C1} Local" : isOnline ? "\u2601\uFE0F Record Pool" : "\u{1F31F} Cuenca Pool")), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2.5 text-center font-mono text-xs font-bold text-emerald-400" }, "\u26A1 ", trk.matchScore, "%"), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center gap-0.5 w-16 mx-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between w-full text-[9px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "\u26A1"), /* @__PURE__ */ React.createElement("span", { className: `font-bold ${(trk.energy || trk.e || 80) >= 82 ? "text-red-400" : (trk.energy || trk.e || 80) >= 68 ? "text-amber-400" : "text-djcyan-400"}` }, trk.energy || trk.e || 80, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `h-full rounded-full ${(trk.energy || trk.e || 80) >= 82 ? "bg-gradient-to-r from-amber-500 to-red-500" : (trk.energy || trk.e || 80) >= 68 ? "bg-gradient-to-r from-yellow-400 to-amber-500" : "bg-gradient-to-r from-cyan-400 to-blue-500"}`,
          style: { width: `${Math.min(100, Math.max(10, trk.energy || trk.e || 80))}%` }
        }
      )))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center gap-0.5 w-16 mx-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between w-full text-[9px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "\u{1F57A}"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-purple-300" }, trk.danceability || trk.dance || 80, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-djzinc-850 h-1.5 rounded-full overflow-hidden border border-djzinc-750" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500",
          style: { width: `${Math.min(100, Math.max(10, trk.danceability || trk.dance || 80))}%` }
        }
      )))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2 text-center" }, (() => {
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
      })()), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2.5 text-left" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 max-w-[210px]" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-400 truncate", title: trk.comment || `[${trk.displayBpm} BPM | ${trk.displayKey}] Intro 32b \u2022 Drop contundente \u2022 Outro 64b` }, trk.comment || `[${trk.displayBpm} BPM | ${trk.displayKey}] Intro 32b \u2022 Drop contundente \u2022 Outro 64b`))), /* @__PURE__ */ React.createElement("td", { className: "py-2 px-3 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-1.5" }, /* @__PURE__ */ React.createElement("button", { onClick: () => handleCargarEnDeck(trk), className: "px-2 py-1 rounded bg-djcyan-500 hover:bg-djcyan-400 text-black font-bold text-[10px] font-mono cursor-pointer", title: "Cargar y Reproducir en Deck 1" }, "\u25B6 Deck"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleAbrirEnHotCues(trk), className: "px-2 py-1 rounded bg-djzinc-850 hover:bg-djzinc-750 text-gray-200 border border-djzinc-700 text-[10px] font-mono cursor-pointer", title: "Hot Cues Studio" }, "\u{1F39B}\uFE0F"), isOnline ? /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            if (onSendToSpotify) onSendToSpotify(`${trk.displayArtist} - ${trk.displayTitle}`);
            else if (onNavigateTab) onNavigateTab("spotify");
          },
          className: "px-2 py-1 rounded bg-purple-950 hover:bg-purple-900 border border-purple-600 text-purple-300 text-[10px] font-mono cursor-pointer",
          title: "Descargar en SuperFLAC / Spotify Ingest"
        },
        "\u{1F4E5} SuperFLAC"
      ) : /* @__PURE__ */ React.createElement("button", { onClick: () => handleAsignarACrateIndividual(trk), className: "px-2 py-1 rounded bg-purple-950 hover:bg-purple-900 border border-purple-600 text-purple-300 text-[10px] font-mono cursor-pointer", title: "Rutar a Crate" }, "\u{1F4C1} Crate"))));
    }))))
  ) : (
    /* VISTA DE MOSAICO / TARJETAS */
    /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5" }, searchResults.map((trk, idx) => {
      const keyData = CAMELOT_WHEEL_DATA[trk.displayKey] || CAMELOT_WHEEL_DATA["8A"];
      const isLocal = Boolean(trk.isLocal || trk.is_local);
      const isOnline = Boolean(trk.isOnlinePool || trk.is_online);
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: trk.id || idx,
          className: "p-3.5 bg-[#0a0a0f] rounded-xl border border-djzinc-850 hover:border-djcyan-500/50 transition-all shadow-md hover:shadow-cyan-500/10 flex flex-col justify-between gap-3 group"
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
          isPlaying && nowPlayingTrack && (String(nowPlayingTrack.id) === String(trk.id) || nowPlayingTrack.path && nowPlayingTrack.path === trk.path || nowPlayingTrack.title === trk.displayTitle) ? "\u275A\u275A" : "\u25B6"
        )), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("span", { className: `text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${isLocal ? "bg-djcyan-950 text-djcyan-300 border-djcyan-700/60" : isOnline ? "bg-purple-950 text-purple-300 border-purple-700/60" : "bg-emerald-950 text-emerald-300 border-emerald-700/60"}` }, isLocal ? "\u{1F4C1} Local" : isOnline ? "\u2601\uFE0F Online Pool" : "\u{1F31F} Cuenca Pool"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-1.5 py-0.2 rounded shadow-sm" }, "\u26A1 ", trk.matchScore, "% Match")), /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-bold text-white truncate mt-1", title: trk.displayTitle }, trk.displayTitle), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-djcyan-400 truncate", title: trk.displayArtist }, trk.displayArtist))),
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
const ShazamWorkspace = ({ onSendToSpotify, onSendToAudit, onNavigateTab }) => {
  const [isListening, setIsListening] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [identifiedTrack, setIdentifiedTrack] = useState(null);
  const [history, setHistory] = useState([]);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const audioRef = useRef(new Audio());
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
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
  const startMicrophoneListening = async () => {
    if (isListening || isAnalyzing) return;
    setStatusMsg("Solicitando acceso al micr\xF3fono...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setIsListening(true);
      setCountdown(5);
      setStatusMsg("Escuchando audio ambiental (5s)...");
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsListening(false);
        setIsAnalyzing(true);
        setStatusMsg("Consultando huella ac\xFAstica en ShazamIO...");
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result;
          try {
            if (window.eel && window.eel.identificar_audio_base64) {
              const res = await window.eel.identificar_audio_base64(base64Data)();
              handleRecognitionResponse(res);
            } else {
              setStatusMsg("Backend Shazam no disponible.");
              setIsAnalyzing(false);
            }
          } catch (err) {
            console.error("Error Shazam:", err);
            setStatusMsg("Error de comunicaci\xF3n con el motor Shazam.");
            setIsAnalyzing(false);
          }
        };
        reader.readAsDataURL(audioBlob);
      };
      mediaRecorder.start();
      let timeLeft = 5;
      const timer = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);
        if (timeLeft <= 0) {
          clearInterval(timer);
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
    setStatusMsg(`Leyendo archivo "${file.name}"...`);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      setStatusMsg(`Generando huella ac\xFAstica de "${file.name}" en ShazamIO...`);
      try {
        if (window.eel && window.eel.identificar_audio_base64) {
          const res = await window.eel.identificar_audio_base64(base64Data)();
          handleRecognitionResponse(res);
        } else {
          setStatusMsg("Backend Shazam no disponible.");
          setIsAnalyzing(false);
        }
      } catch (err) {
        console.error("Error en Shazam:", err);
        setStatusMsg("Error al procesar el archivo en Shazam.");
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };
  const handleRecognitionResponse = (res) => {
    setIsAnalyzing(false);
    if (res && res.status === "ok") {
      setStatusMsg(`\u2713 Identificado: "${res.title}" por ${res.artist}`);
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
  return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col h-full w-full bg-[#040407] overflow-y-auto p-4 sm:p-6 text-gray-200 space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-4 border-b border-djzinc-800 pb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-djcyan-500 to-indigo-500 p-0.5 shadow-lg shadow-djcyan-500/20 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-full h-full bg-[#08080d] rounded-[10px] flex items-center justify-center text-djcyan-400" }, /* @__PURE__ */ React.createElement(Icons.Radar, null))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-black text-white tracking-wide" }, "RADAR AC\xDASTICO SHAZAMIO"), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 text-[9px] font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800 rounded" }, "Engine Oficial ShazamIO")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, "Identifica pistas desconocidas al instante escuchando con el micr\xF3fono o cargando archivos de audio."))), statusMsg && /* @__PURE__ */ React.createElement("div", { className: "px-3 py-1.5 rounded-lg bg-djzinc-900 border border-djzinc-750 text-xs font-mono flex items-center gap-2 shadow" }, /* @__PURE__ */ React.createElement("span", { className: `w-2 h-2 rounded-full ${isAnalyzing || isListening ? "bg-djcyan-400 animate-pulse" : "bg-djgreen-400"}` }), /* @__PURE__ */ React.createElement("span", { className: "text-gray-300" }, statusMsg))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#09090f] p-5 rounded-2xl border border-djzinc-800 flex flex-col items-center text-center justify-between relative overflow-hidden shadow-lg group hover:border-djcyan-500/40 transition-all" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1 mb-4" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono font-bold uppercase text-djcyan-400 tracking-wider" }, "MODO A \u2022 CAPTURA AMBIENTAL"), /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white" }, "Escucha en Directo por Micr\xF3fono"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 max-w-xs mx-auto" }, "Captura 5 segundos de m\xFAsica sonando en tus monitores o altavoces y consulta los servidores de Shazam.")), /* @__PURE__ */ React.createElement("div", { className: "my-3 relative flex items-center justify-center" }, isListening && /* @__PURE__ */ React.createElement("div", { className: "absolute w-36 h-36 rounded-full bg-djcyan-500/20 animate-ping pointer-events-none" }), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: startMicrophoneListening,
      disabled: isListening || isAnalyzing,
      className: `w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer shadow-2xl relative z-10 ${isListening ? "bg-gradient-to-tr from-red-600 to-pink-600 text-white scale-110 shadow-red-500/40" : "bg-gradient-to-tr from-blue-600 to-djcyan-400 text-black hover:scale-105 shadow-djcyan-500/30"}`
    },
    /* @__PURE__ */ React.createElement(Icons.Mic, null),
    /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono font-black mt-1" }, isListening ? `${countdown}s...` : "ESCUCHAR")
  )), /* @__PURE__ */ React.createElement("div", { className: "text-[11px] font-mono text-gray-400" }, isListening ? /* @__PURE__ */ React.createElement("span", { className: "text-red-400 font-bold animate-pulse" }, "\u25CF Grabando audio del micr\xF3fono...") : isAnalyzing ? /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold" }, "\u25CF Analizando huella ac\xFAstica...") : /* @__PURE__ */ React.createElement("span", null, "Haz clic para iniciar la escucha de 5 segundos"))), /* @__PURE__ */ React.createElement(
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
            handleFileSelect(e.target.files[0]);
          }
        },
        accept: "audio/*",
        className: "hidden"
      }
    ),
    /* @__PURE__ */ React.createElement("div", { className: "my-3 w-28 h-28 rounded-2xl border-2 border-dashed border-djzinc-700 hover:border-djcyan-400 flex flex-col items-center justify-center transition-colors bg-djzinc-950" }, /* @__PURE__ */ React.createElement("span", { className: "text-3xl mb-1" }, "\u{1F4C1}"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono font-bold text-gray-300" }, "ARRASTRAR AQU\xCD")),
    /* @__PURE__ */ React.createElement("div", { className: "text-[11px] font-mono text-gray-400" }, /* @__PURE__ */ React.createElement("span", null, "Formatos: MP3, FLAC, WAV, M4A, OGG"))
  )), identifiedTrack && /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-r from-blue-950/50 via-djzinc-950 to-indigo-950/50 p-5 rounded-2xl border-2 border-djcyan-500/50 shadow-2xl space-y-4 animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-djzinc-800/80 pb-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-djcyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse" }), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono font-black text-djcyan-400 uppercase tracking-wider" }, "PISTA IDENTIFICADA POR SHAZAM")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, identifiedTrack.isrc && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-gray-400 bg-djzinc-900 px-2 py-0.5 rounded border border-djzinc-750" }, "ISRC: ", identifiedTrack.isrc), /* @__PURE__ */ React.createElement(
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
const LogsWorkspace = ({ logs, setLogs }) => /* @__PURE__ */ React.createElement("div", { className: "flex flex-col h-full p-6 w-full bg-black font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icons.Terminal, null), /* @__PURE__ */ React.createElement("h2", { className: "text-sm font-bold text-gray-400 uppercase tracking-widest" }, "System Console")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setLogs([]), className: "text-xs text-djcyan-400 hover:text-white transition-colors cursor-pointer" }, "[ Clear ]"), /* @__PURE__ */ React.createElement("button", { className: "text-xs text-gray-500 hover:text-white transition-colors cursor-pointer" }, "[ Export .log ]"))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 border border-djzinc-800 rounded p-4 text-xs overflow-auto flex flex-col-reverse shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" }, /* @__PURE__ */ React.createElement("div", null, logs.map((log, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: `mb-1 ${log.type === "info" ? "text-djcyan-500" : log.type === "success" ? "text-djgreen-400" : log.type === "warn" ? "text-amber-400" : log.type === "error" ? "text-red-400" : "text-gray-300"}` }, log.text)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-4 bg-djcyan-400 animate-pulse" })))));
const App = () => {
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
  const [selectedTrack, setSelectedTrack] = useState(null);
  const currentTrack = selectedTrack ? auditTracks.find((t2) => t2.id === selectedTrack) || null : null;
  const [nowPlayingTrack, setNowPlayingTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const audioRef = useRef(null);
  const [logs, setLogs] = useState([
    { type: "info", text: "> CleanDJmix PRO v2.0 - Core Engine Initialized" },
    { type: "divider", text: "--------------------------------------------------" },
    { type: "success", text: "[ OK ] Audio Engine & Stream Router Online." },
    { type: "success", text: "[ OK ] Serato Database XML Link Ready." }
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
    if (window.eel && typeof window.eel.expose === "function") {
      window.log_to_console = (msg) => {
        setLogs((prev) => [...prev, { type: "info", text: `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] ${msg}` }]);
      };
      window.eel.expose(window.log_to_console, "log_to_console");
    }
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);
  const handlePlayTrack = (track, seekPct = 0, autoPlay = true, startOffsetSec = null) => {
    if (!track) return;
    const resolvedCover = track.cover || (track.path ? `/cover?path=${encodeURIComponent(track.path)}` : track.f ? `/cover?path=${encodeURIComponent(track.f)}` : null);
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
          const isSameSrc = audio.src === targetSrc || audio.src.endsWith(targetSrc);
          const applyPosition = () => {
            if (startOffsetSec !== null && !isNaN(startOffsetSec)) {
              audio.currentTime = Math.max(0, startOffsetSec);
              if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                setPlayProgress(startOffsetSec / audio.duration);
              }
            } else if (seekPct > 0 && audio.duration && !isNaN(audio.duration)) {
              audio.currentTime = audio.duration * seekPct;
              setPlayProgress(seekPct);
            }
          };
          if (isSameSrc) {
            applyPosition();
            audio.play().then(() => setIsPlaying(true)).catch(() => {
            });
          } else {
            audio.src = targetSrc;
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
  return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col h-screen w-screen bg-djzinc-950 text-gray-300 overflow-hidden font-sans select-none" }, /* @__PURE__ */ React.createElement("header", { className: "h-14 border-b border-djzinc-800 bg-djzinc-950/90 backdrop-blur px-4 flex items-center justify-between shrink-0 select-none z-30 relative" }, /* @__PURE__ */ React.createElement("svg", { width: "0", height: "0", className: "absolute pointer-events-none" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("filter", { id: "waveDistortion", x: "-20%", y: "-20%", width: "140%", height: "140%" }, /* @__PURE__ */ React.createElement("feTurbulence", { type: "fractalNoise", baseFrequency: "0 0.25", numOctaves: "2", result: "warp" }, /* @__PURE__ */ React.createElement("animate", { attributeName: "baseFrequency", values: "0 0.05; 0 0.45; 0 0.05", dur: "0.4s", repeatCount: "indefinite" })), /* @__PURE__ */ React.createElement("feDisplacementMap", { xChannelSelector: "R", yChannelSelector: "G", scale: "0", in: "SourceGraphic", in2: "warp" }, /* @__PURE__ */ React.createElement(
    "animate",
    {
      attributeName: "scale",
      values: "0; 0; 60; 25; 75; 0; 0",
      keyTimes: "0; 0.25; 0.3; 0.5; 0.7; 0.75; 1",
      dur: "8s",
      repeatCount: "5",
      fill: "freeze"
    }
  ))))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4 select-none" }, /* @__PURE__ */ React.createElement("div", { className: "w-11 h-11 rounded-xl bg-[#08080e] border border-djcyan-500/50 flex items-center justify-center relative overflow-hidden shrink-0 shadow-[0_0_18px_rgba(6,182,212,0.35)]" }, /* @__PURE__ */ React.createElement("svg", { className: "w-8 h-8", viewBox: "0 0 32 32", fill: "none" }, /* @__PURE__ */ React.createElement("rect", { className: "svg-bar b1-epic", x: "2.5", y: "6", width: "3", rx: "1.5", height: "22" }), /* @__PURE__ */ React.createElement("rect", { className: "svg-bar b2-epic", x: "8", y: "2", width: "3.5", rx: "1.75", height: "28" }), /* @__PURE__ */ React.createElement("rect", { className: "svg-bar b3-epic", x: "14", y: "4", width: "3", rx: "1.5", height: "26" }), /* @__PURE__ */ React.createElement("rect", { className: "svg-bar b4-epic", x: "19.5", y: "2", width: "3.5", rx: "1.75", height: "28" }), /* @__PURE__ */ React.createElement("rect", { className: "svg-bar b5-epic", x: "25.5", y: "8", width: "3", rx: "1.5", height: "20" }))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col pt-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 leading-none h-6" }, /* @__PURE__ */ React.createElement("span", { className: "text-[22px] tracking-wider uppercase font-black anim-soundwave", style: { fontFamily: "'Syne', sans-serif" } }, "BEAT", /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400" }, "WAVE")), /* @__PURE__ */ React.createElement("span", { className: "text-[9.5px] font-mono px-1.5 py-0.5 rounded-md font-black tracking-wider border shadow-md ml-1 bg-djcyan-950/90 text-djcyan-300 border-djcyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.4)]" }, "PRO")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] uppercase tracking-[0.28em] font-mono font-bold flex items-center gap-1.5 text-gray-300" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-djcyan-400 animate-pulse" }), "PRECISION AUDIO INTELLIGENCE"))))), /* @__PURE__ */ React.createElement("nav", { className: "flex space-x-1.5 h-full absolute left-1/2 -translate-x-1/2 items-center" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setActiveTab("audit"),
      className: `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === "audit" ? "bg-djcyan-500 text-black shadow-lg shadow-djcyan-500/20 font-bold" : "text-gray-400 hover:text-white hover:bg-djzinc-900"}`
    },
    /* @__PURE__ */ React.createElement(Icons.Library, null),
    " ",
    t("nav_audit") || "Auditor\xEDa & DSP"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setActiveTab("hotcues"),
      className: `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === "hotcues" ? "bg-djcyan-500 text-black shadow-lg shadow-djcyan-500/20 font-bold" : "text-gray-400 hover:text-white hover:bg-djzinc-900"}`
    },
    /* @__PURE__ */ React.createElement(Icons.Cue, null),
    " ",
    t("nav_hotcues") || "Estudio Hot Cues"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setActiveTab("spotify"),
      className: `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === "spotify" ? "bg-djcyan-500 text-black shadow-lg shadow-djcyan-500/20 font-bold" : "text-gray-400 hover:text-white hover:bg-djzinc-900"}`
    },
    /* @__PURE__ */ React.createElement(Icons.Spotify, null),
    " ",
    t("nav_spotify") || "Spotify Ingest"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setActiveTab("shazam"),
      className: `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === "shazam" ? "bg-djcyan-500 text-black shadow-lg shadow-djcyan-500/20 font-bold" : "text-gray-400 hover:text-white hover:bg-djzinc-900"}`
    },
    /* @__PURE__ */ React.createElement(Icons.Radar, null),
    " ",
    t("nav_shazam") || "Radar Shazam"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setActiveTab("taxonomy"),
      className: `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === "taxonomy" ? "bg-djcyan-500 text-black shadow-lg shadow-djcyan-500/20 font-bold" : "text-gray-400 hover:text-white hover:bg-djzinc-900"}`
    },
    /* @__PURE__ */ React.createElement(Icons.Routing, null),
    " ",
    t("nav_taxonomy") || "Taxonom\xEDa"
  )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center bg-djzinc-900 border border-djzinc-800 rounded-lg p-0.5 text-[11px] font-mono font-bold shadow-inner" }, /* @__PURE__ */ React.createElement(
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
  )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-2.5 py-1 rounded bg-djzinc-900 border border-djzinc-800 text-[11px] font-mono text-gray-400" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-djgreen-400 animate-pulse shadow-[0_0_5px_#22c55e]" }), t("dsp_online") || "DSP ENGINE ONLINE"))), /* @__PURE__ */ React.createElement("main", { className: "flex-1 min-h-0 w-full overflow-hidden relative" }, /* @__PURE__ */ React.createElement("div", { style: { display: activeTab === "audit" ? "flex" : "none" }, className: "w-full h-full" }, /* @__PURE__ */ React.createElement(
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
      lang,
      t,
      currentFolder,
      setCurrentFolder
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
      lang,
      t,
      currentFolder,
      setCurrentFolder
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { display: activeTab === "spotify" ? "flex" : "none" }, className: "w-full h-full" }, /* @__PURE__ */ React.createElement(
    SpotifyWorkspace,
    {
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
        setActiveTab("spotify");
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
      }
    }
  ))), /* @__PURE__ */ React.createElement("footer", { className: "h-16 bg-[#0a0a0e] border-t border-djzinc-800 px-5 flex items-center justify-between shrink-0 glass-panel z-30" }, !nowPlayingTrack ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 min-w-0 w-80 shrink-0 opacity-40 select-none" }, /* @__PURE__ */ React.createElement("div", { className: "w-11 h-11 rounded-md bg-[#0a0a0f] border border-djzinc-850 flex items-center justify-center text-gray-600 shadow-inner" }, /* @__PURE__ */ React.createElement("svg", { className: "w-5 h-5 text-gray-600", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10", strokeDasharray: "3 3" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3" }))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-mono font-bold text-gray-500 uppercase tracking-wider" }, "DECK 1 STANDBY"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-600 font-mono" }, "Sin pista seleccionada"))) : /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 min-w-0 w-80 shrink-0" }, /* @__PURE__ */ React.createElement(
    "img",
    {
      src: getValidCover(nowPlayingTrack.cover || (nowPlayingTrack.path ? `/cover?path=${encodeURIComponent(nowPlayingTrack.path)}` : nowPlayingTrack.f ? `/cover?path=${encodeURIComponent(nowPlayingTrack.f)}` : null)),
      alt: "Deck Cover",
      onError: (e) => {
        e.target.onerror = null;
        e.target.src = DEFAULT_VINYL_SVG;
      },
      className: "w-11 h-11 rounded-md object-cover border border-djzinc-700 shrink-0 shadow-md"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-white truncate", title: nowPlayingTrack.t || nowPlayingTrack.title }, nowPlayingTrack.t || nowPlayingTrack.title), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-djcyan-400 font-medium truncate", title: nowPlayingTrack.a || nowPlayingTrack.artist }, nowPlayingTrack.a || nowPlayingTrack.artist), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-500 font-mono truncate" }, `${nowPlayingTrack.b || nowPlayingTrack.bpm || "--"} BPM \u2022 Key ${nowPlayingTrack.k || nowPlayingTrack.key || "--"}`))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 shrink-0" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      disabled: !nowPlayingTrack,
      onClick: handleCue,
      className: `px-3 py-1.5 rounded font-mono font-bold text-xs border transition-all ${!nowPlayingTrack ? "bg-[#101016] text-gray-600 border-djzinc-850 opacity-40 cursor-not-allowed pointer-events-none" : "bg-[#16161d] hover:bg-[#20202a] text-gray-300 border-djzinc-700 active:translate-y-[1px] cursor-pointer"}`
    },
    "CUE"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      disabled: !nowPlayingTrack,
      onClick: togglePlayPause,
      className: `w-10 h-10 rounded-lg flex items-center justify-center transition-all ${!nowPlayingTrack ? "bg-djzinc-900 border border-djzinc-800 text-gray-600 opacity-40 cursor-not-allowed pointer-events-none" : "bg-djcyan-500 hover:bg-djcyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)] active:translate-y-[1px] cursor-pointer"}`
    },
    isPlaying ? /* @__PURE__ */ React.createElement(Icons.Pause, null) : /* @__PURE__ */ React.createElement(Icons.Play, null)
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      disabled: !nowPlayingTrack,
      onClick: () => setPlayProgress(0.22),
      className: `px-3 py-1.5 rounded font-mono font-bold text-xs border transition-all ${!nowPlayingTrack ? "bg-[#101016] text-gray-600 border-djzinc-850 opacity-40 cursor-not-allowed pointer-events-none" : "bg-[#16161d] hover:bg-[#20202a] text-gray-300 border-djzinc-700 active:translate-y-[1px] cursor-pointer"}`
    },
    "SYNC"
  )), /* @__PURE__ */ React.createElement(
    FooterMasterWaveform,
    {
      track: nowPlayingTrack,
      isPlaying,
      playProgress,
      onSeek: handleFooterSeek,
      cues: nowPlayingTrack && nowPlayingTrack.cues && nowPlayingTrack.cues.length > 0 ? nowPlayingTrack.cues : currentTrack && currentTrack.cues && currentTrack.cues.length > 0 ? currentTrack.cues : NV2_COLORS
    }
  )));
};
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ React.createElement(App, null));
