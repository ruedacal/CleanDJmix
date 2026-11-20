// Utilidades y funciones matemáticas de renderizado espectral y temporal de formas de onda

// Leyenda oficial de bandas espectrales Rekordbox / Pioneer DJ
export const WAVEFORM_COLOR_LEGEND = [
    { name: "Bass / Sub", color: "#22d3ee", rgb: [37, 99, 235], hex: "#2563EB", desc: "Subgraves y pegada de bombos (<150Hz)", text: "text-cyan-400", dot: "bg-blue-500" },
    { name: "Drums / Impact", color: "#ef4444", rgb: [239, 68, 68], hex: "#EF4444", desc: "Cajas, claps y transitorios rítmicos (150-1kHz)", text: "text-red-400", dot: "bg-red-500" },
    { name: "Vocal / Synth", color: "#10b981", rgb: [16, 185, 129], hex: "#10B981", desc: "Vocales, pads y sintetizadores melódicos (1k-5kHz)", text: "text-emerald-400", dot: "bg-emerald-500" },
    { name: "Hi-Hat / Treble", color: "#22d3ee", rgb: [34, 211, 238], hex: "#22D3EE", desc: "Platos, shakers y brillo aéreo (>5kHz)", text: "text-djcyan-400", dot: "bg-djcyan-400" }
];

// Paleta oficial de 8 pads RGB Numark NV2 / Pioneer DJ con códigos HEX
export const DJ_PAD_PALETTE = [
    { id: 1, name: "Kick / Intro", color: "#ef4444", hex: "#EF4444", text: "text-red-400", border: "border-red-500/50", bg: "bg-red-500/10", rgb: [239, 68, 68] },
    { id: 2, name: "Hi-Hats In", color: "#f97316", hex: "#F97316", text: "text-orange-400", border: "border-orange-500/50", bg: "bg-orange-500/10", rgb: [249, 115, 22] },
    { id: 3, name: "Bassline", color: "#eab308", hex: "#EAB308", text: "text-yellow-400", border: "border-yellow-500/50", bg: "bg-yellow-500/10", rgb: [234, 179, 8] },
    { id: 4, name: "Main Break", color: "#22c55e", hex: "#22C55E", text: "text-green-400", border: "border-green-500/50", bg: "bg-green-500/10", rgb: [34, 197, 94] },
    { id: 5, name: "Drop 1 (Climax)", color: "#06b6d4", hex: "#06B6D4", text: "text-cyan-400", border: "border-cyan-500/50", bg: "bg-cyan-500/10", rgb: [6, 182, 212] },
    { id: 6, name: "Mid Break", color: "#22d3ee", hex: "#3B82F6", text: "text-cyan-400", border: "border-blue-500/50", bg: "bg-blue-500/10", rgb: [59, 130, 246] },
    { id: 7, name: "Drop 2 (Re-Kick)", color: "#a855f7", hex: "#A855F7", text: "text-purple-400", border: "border-purple-500/50", bg: "bg-purple-500/10", rgb: [168, 85, 247] },
    { id: 8, name: "Outro Mix Point", color: "#ec4899", hex: "#EC4899", text: "text-pink-400", border: "border-pink-500/50", bg: "bg-pink-500/10", rgb: [236, 72, 153] },
    { id: 9, name: "Blanco Serato", color: "#f8fafc", hex: "#F8FAFC", text: "text-slate-100", border: "border-slate-400/50", bg: "bg-slate-400/10", rgb: [248, 250, 252] }
];

// Helper para parsear formato mm:ss a milisegundos
export const parseDurationMs = (dur) => {
    if (!dur || typeof dur !== "string") return 300000;
    const parts = dur.split(":");
    if (parts.length === 2) {
        const m = parseInt(parts[0], 10) || 0;
        const s = parseFloat(parts[1]) || 0;
        return Math.max(1000, (m * 60 + s) * 1000);
    }
    return 300000;
};

// Helper para parsear mm:ss.ms o segundos a milisegundos
export const parseTimeToMs = (timeStr) => {
    if (!timeStr || typeof timeStr !== "string") return 0;
    const parts = timeStr.trim().split(":");
    if (parts.length === 2) {
        const m = parseInt(parts[0], 10) || 0;
        const s = parseFloat(parts[1]) || 0;
        return Math.max(0, (m * 60 + s) * 1000);
    }
    const num = parseFloat(timeStr);
    return !isNaN(num) ? Math.max(0, num * 1000) : 0;
};

// Helper para parsear duración (número, mm:ss o string) a segundos
export const parseDurationToSeconds = (dur) => {
    if (typeof dur === 'number') return dur > 0 ? dur : 210;
    if (!dur) return 210;
    const ms = parseTimeToMs(String(dur));
    return ms > 0 ? (ms / 1000) : 210;
};

// Helper para formatear milisegundos a mm:ss.ms
export const formatMsToTime = (ms) => {
    const totalSec = Math.max(0, ms) / 1000;
    const m = Math.floor(totalSec / 60);
    const s = (totalSec % 60).toFixed(2);
    const sPadded = s.length < 5 ? "0" + s : s;
    return `${String(m).padStart(2, "0")}:${sPadded}`;
};


// Hash robusto determinista FNV-1a para huella única de cada pista
export function getTrackHash(track) {
    if (!track) return 1337;
    const str = `${track.id || ''}|${track.title || track.t || ''}|${track.artist || track.a || ''}|${track.bpm || track.b || ''}|${track.key || track.k || ''}|${track.f || track.path || ''}`;
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return Math.abs(h >>> 0) || 1;
}

// Función auxiliar para calcular la envolvente estructural profesional por componentes DJ:
// - Genera arquetipos de estructura diferenciados (Club Extended, Radio Edit, Festival Climax, Melodic, Beat Tool)
// - Modula densidad rítmica según BPM, alturas y contrastes según Energía, y proporciones según Rol Acústico
// - Asegura huella visual y silueta única y reconocible para cada tema musical
export function computeTrackStructuralBands(xNorm, seed, track = null) {
    const trackSeed = track ? getTrackHash(track) : (seed || 1);
    
    // Arquetipo estructural (0 a 4) según la semilla única de cada canción
    const archetype = trackSeed % 5;
    
    // Variación determinista de puntos estructurales
    const s1 = ((trackSeed % 23) - 11) * 0.007; // [-0.077, +0.077]
    const s2 = (((trackSeed >> 3) % 19) - 9) * 0.006;
    
    let b1Start, b1End, drop1End, b2Start, b2End, drop2End;
    
    if (archetype === 0) {
        // Extended Club Mix: Intro larga, primer drop potente, parón central prolongado, re-kick brutal
        b1Start = Math.max(0.18, 0.25 + s1);
        b1End = b1Start + 0.12 + Math.abs(s2);
        drop1End = Math.min(0.68, b1End + 0.22);
        b2Start = drop1End + 0.04;
        b2End = Math.min(0.84, b2Start + 0.10);
        drop2End = 0.90;
    } else if (archetype === 1) {
        // Radio / Vocal Edit: Intro corta, drop / estribillo muy temprano, puente vocal
        b1Start = Math.max(0.08, 0.14 + s1);
        b1End = b1Start + 0.08;
        drop1End = Math.min(0.50, b1End + 0.20);
        b2Start = drop1End + 0.05;
        b2End = Math.min(0.72, b2Start + 0.12);
        drop2End = 0.86;
    } else if (archetype === 2) {
        // Peak-Time Festival Banger: Build rápido, drop colosal y sostenido, mini break, segundo drop masivo
        b1Start = Math.max(0.14, 0.18 + s1);
        b1End = b1Start + 0.10;
        drop1End = Math.min(0.58, b1End + 0.26);
        b2Start = drop1End + 0.03;
        b2End = Math.min(0.76, b2Start + 0.08);
        drop2End = 0.92;
    } else if (archetype === 3) {
        // Progressive / Melodic: Construcción suave, gran breakdown melódico central, clímax tardío
        b1Start = Math.max(0.22, 0.30 + s1);
        b1End = b1Start + 0.16 + Math.abs(s2);
        drop1End = Math.min(0.78, b1End + 0.24);
        b2Start = 0.99; // 1 solo gran break
        b2End = 0.99;
        drop2End = 0.99;
    } else {
        // Underground Groove / Tool: Varios micro-cortes y drops constantes
        b1Start = Math.max(0.12, 0.16 + s1);
        b1End = b1Start + 0.07;
        drop1End = Math.min(0.48, b1End + 0.18);
        b2Start = drop1End + 0.08;
        b2End = Math.min(0.78, b2Start + 0.09);
        drop2End = 0.88;
    }

    // Parámetros acústicos específicos de la pista
    const durMs = track ? parseDurationMs(track.duration || "05:00") : 300000;
    const curMs = xNorm * durMs;
    const trimMs = (track && track.trim_start_ms) ? parseFloat(track.trim_start_ms) : 0;
    const downbeatMs = (track && track.first_downbeat_ms) ? parseFloat(track.first_downbeat_ms) : 0;

    // Si la posición analizada pertenece a la zona de silencio previa al recorte:
    if (trimMs > 0 && curMs < trimMs) {
        return { bass: 0.005, drums: 0.005, vocals: 0.005, treble: 0.005, isBreak: false, isSilence: true };
    }

    const bpm = track ? (parseFloat(track.bpm || track.b) || 124) : 124;
    const beatMs = 60000.0 / Math.max(30.0, bpm);
    
    // Fase rítmica armónica anclada al Downbeat 1.0.0
    // En curMs = downbeatMs, beatPhase = 0 -> cos(PI * 0) = 1.0 (golpe exacto de bombo coincidente con la línea de beatgrid)
    const beatPhase = (curMs - downbeatMs) / beatMs;
    
    const rawEnergy = track ? (track.energy !== undefined ? parseFloat(track.energy) : (track.e !== undefined ? parseFloat(track.e) : 0.65)) : 0.65;
    const energy = Math.max(0.35, Math.min(1.0, rawEnergy <= 1.0 ? rawEnergy : rawEnergy / 10));
    
    const role = String(track?.acoustic_role || track?.role || track?.genre || '').toLowerCase();
    const isBassDriver = role.includes('bass') || role.includes('sub') || role.includes('techno') || role.includes('tech');
    const isVocalLead = role.includes('vocal') || role.includes('lead') || role.includes('melodic') || role.includes('anthem');
    const isPercussive = role.includes('drum') || role.includes('perc') || role.includes('tool') || role.includes('groove');

    // Micro-modulaciones armónicas deterministas por pista
    const f1 = 18 + (trackSeed % 29);
    const f2 = 37 + ((trackSeed >> 3) % 41);
    const f3 = 73 + ((trackSeed >> 6) % 53);
    const microRipple = 0.85 + 0.15 * Math.sin(xNorm * f1) * Math.cos(xNorm * f2);
    const transientSpike = Math.pow(Math.abs(Math.sin(xNorm * f3)), 12);

    // Patrón rítmico sincrónico milimétrico con el Beatgrid:
    // Bombo en cada negra (beatPhase = 0, 1, 2, 3...)
    const beatGridKick = Math.pow(Math.abs(Math.cos(Math.PI * beatPhase)), 10);
    // Caja en tiempos 2 y 4 (beatPhase = 1, 3, 5...)
    const snareHit = Math.pow(Math.abs(Math.cos(Math.PI * (beatPhase - 1) * 0.5)), 8);
    // Hi-hats en contratiempos (offbeats beatPhase = 0.5, 1.5, 2.5...)
    const hatPattern = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(Math.PI * beatPhase)), 4);

    let bass = 0.15, drums = 0.15, vocals = 0.15, treble = 0.15;
    let isBreak = false;

    if (xNorm < b1Start) {
        // INTRO: Bombo limpio, hi-hats entrando, vocales lejanas
        const p = xNorm / b1Start;
        bass = (0.55 + 0.35 * beatGridKick) * (isBassDriver ? 1.3 : 1.0);
        drums = (0.45 + 0.40 * snareHit) * Math.min(1, p * 1.6);
        vocals = (0.15 + 0.25 * p) * (isVocalLead ? 1.4 : 0.8);
        treble = (0.30 + 0.50 * p) * hatPattern;
    } else if (xNorm >= b1Start && xNorm < b1End) {
        // BREAK 1 (PARÓN): Subida de sintetizadores, vocales prominentes
        isBreak = true;
        const p = (xNorm - b1Start) / (b1End - b1Start);
        bass = 0.03 + 0.03 * Math.sin(xNorm * 15);
        drums = (0.08 + 0.45 * Math.pow(p, 2.2) * snareHit);
        vocals = (0.80 + 0.20 * Math.sin(p * Math.PI)) * (isVocalLead ? 1.3 : 1.0);
        treble = 0.35 + 0.60 * Math.pow(p, 1.6);
    } else if (xNorm >= b1End && xNorm < drop1End) {
        // DROP 1 (CLÍMAX): Pegada atronadora en graves, caja con impacto
        bass = (0.88 + 0.12 * beatGridKick) * (isBassDriver ? 1.15 : 1.0) * energy;
        drums = (0.84 + 0.16 * snareHit) * (isPercussive ? 1.2 : 1.0) * energy;
        vocals = (0.60 + 0.30 * Math.sin(xNorm * 35)) * (isVocalLead ? 1.1 : 0.8);
        treble = (0.75 + 0.25 * hatPattern) * energy;
    } else if (xNorm >= b2Start && xNorm < b2End) {
        // BREAK 2 (PUENTE VOCAL / PARÓN CENTRAL)
        isBreak = true;
        const p = (xNorm - b2Start) / (b2End - b2Start);
        bass = 0.02 + 0.03 * Math.cos(xNorm * 10);
        drums = 0.06 + 0.50 * Math.pow(p, 2.5) * snareHit;
        vocals = (0.92 + 0.08 * Math.sin(p * Math.PI)) * (isVocalLead ? 1.25 : 1.0);
        treble = 0.40 + 0.55 * p;
    } else if (xNorm >= b2End && xNorm < drop2End) {
        // DROP 2 (RE-KICK MÁXIMO)
        bass = (0.95 + 0.05 * beatGridKick) * (isBassDriver ? 1.2 : 1.0) * energy;
        drums = (0.90 + 0.10 * snareHit) * (isPercussive ? 1.2 : 1.0) * energy;
        vocals = (0.65 + 0.25 * Math.sin(xNorm * 45)) * (isVocalLead ? 1.1 : 0.8);
        treble = (0.85 + 0.15 * hatPattern) * energy;
    } else {
        // OUTRO: Desvanecimiento progresivo para mezcla suave de salida en cabina
        const p = (xNorm - drop2End) / Math.max(0.01, 1 - drop2End);
        bass = Math.max(0.06, (0.70 - 0.55 * p) * (0.75 + 0.25 * beatGridKick));
        drums = Math.max(0.06, (0.50 - 0.42 * p));
        vocals = Math.max(0.04, (0.30 - 0.26 * p));
        treble = Math.max(0.04, (0.40 - 0.35 * p));
    }

    // Aplicar micro-modulación y energía
    bass = Math.min(1.0, bass * microRipple);
    drums = Math.min(1.0, drums * (0.9 + 0.2 * transientSpike));
    treble = Math.min(1.0, treble * (0.85 + 0.15 * microRipple));

    return { bass, drums, vocals, treble, isBreak, energy, archetype };
}

