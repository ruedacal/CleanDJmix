// Catálogo Musical Curado, Taxonomía, Notación Camelot y Query Parser DJ
import { NV2_COLORS } from './constants.js';

export const CAMELOT_WHEEL_DATA = {
    "1A": { classical: "G#m", name: "Sol# menor", rel: "1B", up: "2A", down: "12A", color: "#06b6d4" },
    "1B": { classical: "B", name: "Si Mayor", rel: "1A", up: "2B", down: "12B", color: "#38bdf8" },
    "2A": { classical: "D#m", name: "Re# menor", rel: "2B", up: "3A", down: "1A", color: "#0284c7" },
    "2B": { classical: "F#", name: "Fa# Mayor", rel: "2A", up: "3B", down: "1B", color: "#0369a1" },
    "3A": { classical: "A#m", name: "La# menor", rel: "3B", up: "4A", down: "2A", color: "#22d3ee" },
    "3B": { classical: "Db", name: "Re♭ Mayor", rel: "3A", up: "4B", down: "2B", color: "#1d4ed8" },
    "4A": { classical: "Fm", name: "Fa menor", rel: "4B", up: "5A", down: "3A", color: "#4f46e5" },
    "4B": { classical: "Ab", name: "La♭ Mayor", rel: "4A", up: "5B", down: "3B", color: "#4338ca" },
    "5A": { classical: "Cm", name: "Do menor", rel: "5B", up: "6A", down: "4A", color: "#7c3aed" },
    "5B": { classical: "Eb", name: "Mi♭ Mayor", rel: "5A", up: "6B", down: "4B", color: "#6d28d9" },
    "6A": { classical: "Gm", name: "Sol menor", rel: "6B", up: "7A", down: "5A", color: "#9333ea" },
    "6B": { classical: "Bb", name: "Si♭ Mayor", rel: "6A", up: "7B", down: "5B", color: "#7e22ce" },
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

export const TAXONOMY_TREE = {
    "Peak-Time Techno": [
        "Peak Time / Driving (130-135 BPM)",
        "Raw / Driving Techno",
        "Acid Peak-Time",
        "Festival Techno"
    ],
    "Tech House": [
        "Tech House (126-129 BPM)",
        "Groove Tech House",
        "Minimal Tech House",
        "Latin Tech House",
        "Mainstage Tech"
    ],
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
        "Reggaetón & RKT"
    ]
};

export const DJ_GENRES_LIST = Object.keys(TAXONOMY_TREE);

export const DJ_VERSIONS_LIST = [
    "Extended Mix",
    "Intro / Outro",
    "Remix / Club Mix",
    "Mashup / Bootleg",
    "Transition",
    "Acapella / DIY",
    "Short Edit / Radio"
];

export const AI_PROMPT_CHIPS = [
    { label: "🔨 Hard Techno 150 BPM Caña", query: "hard techno 150 bpm a tope de caña" },
    { label: "⚡ Techno Peak Time 132 BPM", query: "techno peak time driving 132 bpm" },
    { label: "🧪 Acid Techno en 8A 140 BPM", query: "acid techno en 8A a 140 bpm" },
    { label: "🌌 Melodic Techno en 6A", query: "melodic techno en 6A" },
    { label: "🔥 Tech House a 128 BPM", query: "tech house a 128 bpm" },
    { label: "🌴 Afro House Groove", query: "afro house groove para bailar" },
    { label: "🥁 Minimal / Deep Tech 126 BPM", query: "minimal deep tech 126 bpm" },
    { label: "🚀 Psy-Trance 142 BPM Caña", query: "psy-trance 142 bpm caña" },
    { label: "💥 Drum & Bass 174 BPM", query: "drum & bass neurofunk 174 bpm" },
    { label: "🎛️ Progressive House 124 BPM", query: "progressive house 124 bpm" }
];
export const CUENCA_PROMPT_CHIPS = AI_PROMPT_CHIPS;

// Catálogo Curado de Muestra para Demostración y Descubrimiento Instantáneo
export const DJ_CURATED_CATALOG = [
    {
        id: "cat_0",
        title: "Legacy (Original Mix)",
        artist: "Sara Landry",
        genre: "Hard Techno",
        subgenre: "Hard Techno / Schranz (150-160 BPM)",
        bpm: 155,
        key: "11A",
        version: "Original Mix",
        mood: "A Tope de Caña",
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
        subgenre: "Reggaetón",
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
        year: 2000,
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

// Parser de Lenguaje Natural DJ Inteligente
export function parseAIDJQuery(query) {
    if (!query || typeof query !== 'string') {
        return {
            raw: '',
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

    // 1. Rango o BPM exacto
    const bpmRangeMatch = q.match(/(\d{2,3})\s*(?:-|a|to)\s*(\d{2,3})\s*(?:bpm)?/);
    if (bpmRangeMatch) {
        result.minBpm = parseInt(bpmRangeMatch[1], 10);
        result.maxBpm = parseInt(bpmRangeMatch[2], 10);
        result.targetBpm = Math.round((result.minBpm + result.maxBpm) / 2);
        result.tokens.push({ type: 'bpm', label: `${result.minBpm}-${result.maxBpm} BPM`, rawMatch: bpmRangeMatch[0] });
    } else {
        const singleBpmMatch = q.match(/(?:a\s+)?(\b1[0-9]{2}\b|\b[6-9][0-9]\b)\s*(?:bpm)?/);
        if (singleBpmMatch) {
            const val = parseInt(singleBpmMatch[1], 10);
            if (val >= 60 && val <= 200) {
                result.targetBpm = val;
                result.minBpm = val - 3;
                result.maxBpm = val + 3;
                result.tokens.push({ type: 'bpm', label: `${val} BPM (±3)`, rawMatch: singleBpmMatch[0] });
            }
        }
    }

    // 2. Tonalidad Camelot o Clásica
    const camelotMatch = q.match(/\b(1[0-2]|[1-9])([abAB])\b/);
    if (camelotMatch) {
        const k = (camelotMatch[1] + camelotMatch[2]).toUpperCase();
        result.key = k;
        if (CAMELOT_WHEEL_DATA[k]) {
            result.compatibleKeys = [k, CAMELOT_WHEEL_DATA[k].rel, CAMELOT_WHEEL_DATA[k].up, CAMELOT_WHEEL_DATA[k].down];
        }
        result.tokens.push({ type: 'key', label: `Key ${k}`, rawMatch: camelotMatch[0] });
    } else {
        for (const [camKey, data] of Object.entries(CAMELOT_WHEEL_DATA)) {
            const cls = data.classical.toLowerCase();
            const nm = data.name.toLowerCase();
            if (q.includes(`en ${cls}`) || q.includes(`en ${nm}`) || q.includes(` ${cls}`)) {
                result.key = camKey;
                result.compatibleKeys = [camKey, data.rel, data.up, data.down];
                result.tokens.push({ type: 'key', label: `Key ${camKey} (${data.classical})`, rawMatch: cls });
                break;
            }
        }
    }

    // 3. Versión / Tag DJ
    if (q.includes("extended") || q.includes("ext")) {
        result.version = "Extended Mix";
        result.tokens.push({ type: 'version', label: 'Extended Mix', rawMatch: q.includes("extended") ? "extended" : "ext" });
    } else if (q.includes("intro") || q.includes("outro")) {
        result.version = "Intro / Outro";
        result.tokens.push({ type: 'version', label: 'Intro / Outro', rawMatch: q.includes("intro") ? "intro" : "outro" });
    } else if (q.includes("mashup") || q.includes("bootleg")) {
        result.version = "Mashup / Bootleg";
        result.tokens.push({ type: 'version', label: 'Mashup', rawMatch: q.includes("mashup") ? "mashup" : "bootleg" });
    } else if (q.includes("remix") || q.includes("club mix")) {
        result.version = "Remix / Club Mix";
        result.tokens.push({ type: 'version', label: 'Remix', rawMatch: q.includes("remix") ? "remix" : "club mix" });
    } else if (q.includes("acapella") || q.includes("acappella")) {
        result.version = "Acapella";
        result.tokens.push({ type: 'version', label: 'Acapella', rawMatch: q.includes("acapella") ? "acapella" : "acappella" });
    } else if (q.includes("transition") || q.includes("transicion")) {
        result.version = "Transition";
        result.tokens.push({ type: 'version', label: 'Transition', rawMatch: q.includes("transition") ? "transition" : "transicion" });
    }

    // 4. Mood / Momento
    if (q.includes("previa") || q.includes("warm up") || q.includes("warmup")) {
        result.mood = "Previa / Warm Up";
        result.tokens.push({ type: 'mood', label: 'Previa / Warm Up', rawMatch: q.includes("warm up") ? "warm up" : (q.includes("warmup") ? "warmup" : "previa") });
    } else if (q.includes("pista") || q.includes("peak time") || q.includes("festival") || q.includes("driving") || q.includes("bailar") || q.includes("baile")) {
        result.mood = "Peak Time / Pista";
        result.tokens.push({ type: 'mood', label: 'Peak Time / Pista', rawMatch: q.includes("peak time") ? "peak time" : (q.includes("pista") ? "pista" : (q.includes("driving") ? "driving" : "bailar")) });
    } else if (q.includes("sunset") || q.includes("chill") || q.includes("after") || q.includes("lounge")) {
        result.mood = "Chill / Sunset / After";
        result.tokens.push({ type: 'mood', label: 'Chill / Sunset', rawMatch: q.includes("sunset") ? "sunset" : (q.includes("chill") ? "chill" : (q.includes("after") ? "after" : "lounge")) });
    }

    // 5. Año o Época
    const yearMatch = q.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
        result.year = parseInt(yearMatch[1], 10);
        result.tokens.push({ type: 'year', label: `Año ${result.year}`, rawMatch: yearMatch[0] });
    } else if (q.includes("retro") || q.includes("90s") || q.includes("80s") || q.includes("2000s")) {
        result.year = "Retro";
        result.tokens.push({ type: 'year', label: 'Retro', rawMatch: q.includes("retro") ? "retro" : (q.includes("90s") ? "90s" : (q.includes("80s") ? "80s" : "2000s")) });
    }

    // 7. Rol Acústico de Cabina (Anti-Muddy)
    if (q.includes("bass driver") || q.includes("subgrave") || q.includes("bombo") || q.includes("sub-bass") || q.includes("sub bass")) {
        result.acousticRole = "Bass Driver";
        result.tokens.push({ type: 'role', label: 'Rol: Bass Driver (Graves)', rawMatch: 'bass driver' });
    } else if (q.includes("vocal") || q.includes("vocales") || q.includes("lead") || q.includes("melodia") || q.includes("melódico") || q.includes("melodica")) {
        result.acousticRole = "Vocal / Lead";
        result.tokens.push({ type: 'role', label: 'Rol: Vocal / Lead (Medios)', rawMatch: 'vocal' });
    } else if (q.includes("percussive") || q.includes("percusivo") || q.includes("percursion") || q.includes("tool") || q.includes("hats") || q.includes("platos")) {
        result.acousticRole = "Percussive Tool";
        result.tokens.push({ type: 'role', label: 'Rol: Percussive Tool (Agudos)', rawMatch: 'percussive' });
    }

    // 8. Rango Dinámico y Energía
    if (q.includes("energico") || q.includes("enérgico") || q.includes("alta energia") || q.includes("alta energía") || q.includes("high energy")) {
        result.minEnergy = 80;
        result.tokens.push({ type: 'energy', label: 'Energía > 80%', rawMatch: 'enérgico' });
    } else if (q.includes("chill") || q.includes("baja energia") || q.includes("baja energía") || q.includes("suave")) {
        result.maxEnergy = 65;
        result.tokens.push({ type: 'energy', label: 'Energía < 65%', rawMatch: 'chill' });
    }

    // 6. Género y Subgénero
    if (q.includes("tech house")) {
        result.genre = "House";
        result.subgenre = "Tech House";
        result.tokens.push({ type: 'genre', label: 'Tech House', rawMatch: 'tech house' });
    } else if (q.includes("afro house") || q.includes("afro")) {
        result.genre = "House";
        result.subgenre = "Afro House";
        result.tokens.push({ type: 'genre', label: 'Afro House', rawMatch: q.includes("afro house") ? 'afro house' : 'afro' });
    } else if (q.includes("melodic techno")) {
        result.genre = "Techno";
        result.subgenre = "Melodic Techno";
        result.tokens.push({ type: 'genre', label: 'Melodic Techno', rawMatch: 'melodic techno' });
    } else if (q.includes("progressive house") || q.includes("house progresivo")) {
        result.genre = "House";
        result.subgenre = "Melodic / Progressive House";
        result.tokens.push({ type: 'genre', label: 'Progressive House', rawMatch: q.includes("progressive house") ? 'progressive house' : 'house progresivo' });
    } else if (q.includes("deep house")) {
        result.genre = "House";
        result.subgenre = "Deep House";
        result.tokens.push({ type: 'genre', label: 'Deep House', rawMatch: 'deep house' });
    } else if (q.includes("minimal") || q.includes("deep tech")) {
        result.genre = "Electro & Breaks";
        result.subgenre = "Minimal / Deep Tech";
        result.tokens.push({ type: 'genre', label: 'Minimal / Deep Tech', rawMatch: q.includes("minimal") ? 'minimal' : 'deep tech' });
    } else if (q.includes("reggaeton") || q.includes("reggaetón")) {
        result.genre = "Latin & Urban";
        result.subgenre = "Reggaetón";
        result.tokens.push({ type: 'genre', label: 'Reggaetón', rawMatch: q.includes("reggaetón") ? 'reggaetón' : 'reggaeton' });
    } else if (q.includes("cachengue") || q.includes("rkt")) {
        result.genre = "Latin & Urban";
        result.subgenre = "Cachengue / RKT";
        result.tokens.push({ type: 'genre', label: 'Cachengue / RKT', rawMatch: q.includes("cachengue") ? 'cachengue' : 'rkt' });
    } else if (q.includes("cuarteto")) {
        result.genre = "Latin & Urban";
        result.subgenre = "Cuarteto";
        result.tokens.push({ type: 'genre', label: 'Cuarteto', rawMatch: 'cuarteto' });
    } else if (q.includes("guaracha")) {
        result.genre = "Latin & Urban";
        result.subgenre = "Guaracha";
        result.tokens.push({ type: 'genre', label: 'Guaracha', rawMatch: 'guaracha' });
    } else if (q.includes("cumbia")) {
        result.genre = "Latin & Urban";
        result.subgenre = "Cumbia";
        result.tokens.push({ type: 'genre', label: 'Cumbia', rawMatch: 'cumbia' });
    } else if (q.includes("latin house")) {
        result.genre = "House";
        result.subgenre = "Latin House";
        result.tokens.push({ type: 'genre', label: 'Latin House', rawMatch: 'latin house' });
    } else if (q.includes("techno") || q.includes("tecno")) {
        result.genre = "Techno";
        result.subgenre = "Techno";
        result.tokens.push({ type: 'genre', label: 'Techno', rawMatch: q.includes("techno") ? 'techno' : 'tecno' });
    } else if (q.includes("house")) {
        result.genre = "House";
        result.subgenre = "House";
        result.tokens.push({ type: 'genre', label: 'House', rawMatch: 'house' });
    } else if (q.includes("trance")) {
        result.genre = "Trance";
        result.subgenre = "Trance";
        result.tokens.push({ type: 'genre', label: 'Trance', rawMatch: 'trance' });
    } else if (q.includes("drum & bass") || q.includes("drum and bass") || q.includes("dnb")) {
        result.genre = "Drum & Bass";
        result.subgenre = "Drum & Bass";
        result.tokens.push({ type: 'genre', label: 'Drum & Bass', rawMatch: q.includes("drum & bass") ? 'drum & bass' : (q.includes("drum and bass") ? 'drum and bass' : 'dnb') });
    }

    return result;
}
export const parseCuencaDJQuery = parseAIDJQuery;

export const DJ_MOODS_LIST = [
    { id: "Peak Time", label: "🔥 Peak Time", desc: "Clímax de pista, alta pegada" },
    { id: "Dark", label: "🌑 Dark", desc: "Oscuro, industrial, contundente" },
    { id: "Euphoric", label: "✨ Euphoric", desc: "Melodías épicas, subidón emotivo" },
    { id: "Hypnotic", label: "🌀 Hypnotic", desc: "Groove continuo y envolvente" },
    { id: "Raw", label: "⚡ Raw", desc: "Seco, crudo y minimalista" },
    { id: "Melancholic", label: "🌧 Melancholic", desc: "Atmosférico y profundo" }
];

