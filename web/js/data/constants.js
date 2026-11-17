// Constantes visuales, colores y utilidades armónicas de BeatWave Pro

export const NV2_COLORS = [
    { id: 1, name: "Kick / Intro", color: "#ef4444", text: "text-red-400", border: "border-red-500/50", bg: "bg-red-500/10", time: "00:00.215" },
    { id: 2, name: "Hi-Hats In", color: "#f97316", text: "text-orange-400", border: "border-orange-500/50", bg: "bg-orange-500/10", time: "00:15.110" },
    { id: 3, name: "Bassline", color: "#eab308", text: "text-yellow-400", border: "border-yellow-500/50", bg: "bg-yellow-500/10", time: "00:30.005" },
    { id: 4, name: "Main Break", color: "#22c55e", text: "text-green-400", border: "border-green-500/50", bg: "bg-green-500/10", time: "01:00.120" },
    { id: 5, name: "Drop 1 (Climax)", color: "#06b6d4", text: "text-cyan-400", border: "border-cyan-500/50", bg: "bg-cyan-500/10", time: "01:30.240" },
    { id: 6, name: "Mid Break", color: "#22d3ee", text: "text-cyan-400", border: "border-blue-500/50", bg: "bg-blue-500/10", time: "02:30.400" },
    { id: 7, name: "Drop 2 (Re-Kick)", color: "#a855f7", text: "text-purple-400", border: "border-purple-500/50", bg: "bg-purple-500/10", time: "03:00.510" },
    { id: 8, name: "Outro Mix Point", color: "#ec4899", text: "text-pink-400", border: "border-pink-500/50", bg: "bg-pink-500/10", time: "04:15.000" }
];


export const DEFAULT_VINYL_SVG = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="12" fill="#0d0d14"/><circle cx="80" cy="80" r="58" fill="#14141f" stroke="#27273a" stroke-width="2"/><circle cx="80" cy="80" r="44" fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/><circle cx="80" cy="80" r="30" fill="none" stroke="#22d3ee" stroke-width="1.5" opacity="0.5"/><circle cx="80" cy="80" r="14" fill="#06b6d4"/><circle cx="80" cy="80" r="5" fill="#09090b"/></svg>');


export function getValidCover(c) {
    if (!c || typeof c !== 'string') return DEFAULT_VINYL_SVG;
    if (c.startsWith("data:") || c.startsWith("http://") || c.startsWith("https://") || c.startsWith("/")) return c;
    return "https://i.scdn.co/image/" + c;
}

export const CAMELOT_TO_MUSICAL = {
    "1A": "G#m", "1B": "B",
    "2A": "D#m", "2B": "F#",
    "3A": "A#m", "3B": "C#",
    "4A": "Fm",  "4B": "G#",
    "5A": "Cm",  "5B": "D#",
    "6A": "Gm",  "6B": "A#",
    "7A": "Dm",  "7B": "F",
    "8A": "Am",  "8B": "C",
    "9A": "Em",  "9B": "G",
    "10A": "Bm", "10B": "D",
    "11A": "F#m","11B": "A",
    "12A": "C#m","12B": "E"
};

export function getHarmonicKeyDisplay(k) {
    if (!k || k === '--') return '--';
    const clean = String(k).trim().toUpperCase();
    const mus = CAMELOT_TO_MUSICAL[clean];
    return mus ? `${clean} (${mus})` : clean;
}

// Configuración y Categorías de Columnas Visibles para Record Pool
export const DEFAULT_POOL_COLUMNS = {
    select: true,
    play: true,
    title: true,
    match_score: true,
    artist: true,
    genre: true,
    subgenre: true,
    origin: true,
    pre_quality_tier: true,
    format: true,
    sample_rate_khz: true,
    bitrate_kbps: true,
    calidad: true,
    cutoff_khz: true,
    duration: true,
    bpm: true,
    key: true,
    energy: true,
    danceability: true,
    intensity: true,
    valence: true,
    status: true
};

export const POOL_COLUMN_CATEGORIES = [
    {
        id: 'identity',
        name: 'Identificación & Catálogo',
        icon: '🎵',
        color: 'text-djcyan-400',
        columns: [
            { key: 'select', label: 'Selector (#)', desc: 'Casilla para selección de descargas por lote' },
            { key: 'play', label: 'Play / Previa', desc: 'Botón de reproducción instantánea' },
            { key: 'title', label: 'Título / Álbum', desc: 'Nombre del track, portada y álbum' },
            { key: 'artist', label: 'Artista', desc: 'Intérprete o productor principal' },
            { key: 'origin', label: 'Origen', desc: 'Fuente de procedencia (Búsqueda, Reemplazo HD, etc.)' }
        ]
    },
    {
        id: 'fidelity',
        name: 'Fidelidad & Pre-Auditoría',
        icon: '💎',
        color: 'text-amber-400',
        columns: [
            { key: 'match_score', label: 'Match Acústico (%)', desc: 'Fidelidad de coincidencia respecto a la búsqueda' },
            { key: 'pre_quality_tier', label: 'Nivel Fidelidad', desc: 'Tier FLAC / MP3 / Transcode detectado' },
            { key: 'format', label: 'Formato Contenedor', desc: 'Extensión y códec de audio' },
            { key: 'sample_rate_khz', label: 'Muestreo (kHz)', desc: 'Frecuencia de muestreo (44.1, 48, 96 kHz)' },
            { key: 'bitrate_kbps', label: 'Bitrate (kbps)', desc: 'Tasa de bits por segundo' },
            { key: 'calidad', label: 'Calidad Serato (%)', desc: 'Puntuación global de calidad' },
            { key: 'cutoff_khz', label: 'Corte Nyquist (kHz)', desc: 'Frecuencia de corte espectral observada' }
        ]
    },
    {
        id: 'dj_metrics',
        name: 'Métricas DJ & Armonía',
        icon: '⚡',
        color: 'text-emerald-400',
        columns: [
            { key: 'duration', label: 'Duración', desc: 'Tiempo total de reproducción' },
            { key: 'bpm', label: 'BPM', desc: 'Tempo cuantizado' },
            { key: 'key', label: 'Tonalidad Camelot', desc: 'Clave armónica para mezcla' },
            { key: 'energy', label: 'Energía (%)', desc: 'Intensidad sonora percibida' },
            { key: 'danceability', label: 'Bailabilidad (%)', desc: 'Fuerza del pulso rítmico' },
            { key: 'intensity', label: 'Intensidad', desc: 'Nivel dinámico en vivo' },
            { key: 'valence', label: 'Positividad (Valence)', desc: 'Carácter emocional del track' },
            { key: 'genre', label: 'Género Raíz', desc: 'Categoría musical principal' },
            { key: 'subgenre', label: 'Subgénero Estilo', desc: 'Estilo específico de pista' },
            { key: 'status', label: 'Estado / Descarga', desc: 'Progreso y botón de acción individual' }
        ]
    }
];


