const { useState, useEffect, useRef, useMemo, useCallback } = React;
import { Icons, renderPlatformLogo } from '../shell/icons.jsx';
import { CopilotSeratoWaveform, computeTrackStructuralBands } from '../waveforms/index.js';
import { DEFAULT_VINYL_SVG, getValidCover, NV2_COLORS } from '../data/constants.js';
import { BeatWaveLogoBadge, BeatWaveBrandIdentity } from '../shell/workspace-ui.jsx';

// =======================================================
// WORKSPACE IN-APP: BEATWAVE LIVE COPILOT (CABINA)
// =======================================================

const MASTER_TRACKS_POOL = [
    {
        id: 'rec_1',
        title: 'Higher (Original Mix)',
        artist: 'Amelie Lens',
        bpm: 138.0,
        camelot: '10A',
        raw_key: 'Bm',
        role: 'Percussive Tool',
        lufs: -6.5,
        low_ratio: 36.0,
        genre: 'Acid / Peak Techno',
        subgenre: 'Lenske Peak',
        energy: 94,
        danceability: 89,
        arousal: 92,
        mood: 'Acid Drive',
        format: 'FLAC 24-bit',
        duration: '06:12',
        year: '2023',
        cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
        strategy: 'Mezcla Armónica Segura',
        reason: 'Mismo tono (10A) y espectro percusivo limpio. Cero riesgo de embarre en graves.',
        camelot_color: '#f472b6'
    },
    {
        id: 'rec_2',
        title: 'Your Mind (Extended Club)',
        artist: 'Adam Beyer & Bart Skils',
        bpm: 138.5,
        camelot: '11A',
        raw_key: 'F#m',
        role: 'Peak Time Driver',
        lufs: -5.9,
        low_ratio: 49.0,
        genre: 'Drumcode Techno',
        subgenre: 'Drumcode Peak',
        energy: 96,
        danceability: 92,
        arousal: 95,
        mood: 'Peak Time Climax',
        format: 'FLAC Hi-Res',
        duration: '07:22',
        year: '2022',
        cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
        strategy: 'Subidón de Energía (+1)',
        reason: 'Aumento armónico a 11A con +1.0 BPM. Eleva la intensidad del club para el clímax.',
        camelot_color: '#fb7185'
    },
    {
        id: 'rec_3',
        title: 'Old School',
        artist: 'Hertz',
        bpm: 138.0,
        camelot: '10A',
        raw_key: 'Bm',
        role: 'Industrial Driver',
        lufs: -6.2,
        low_ratio: 38.0,
        genre: 'Hard Techno Industrial',
        subgenre: 'Sway Records',
        energy: 93,
        danceability: 91,
        arousal: 90,
        mood: 'Raw Industrial',
        format: 'FLAC 24-bit',
        duration: '05:12',
        year: '2024',
        cover: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop',
        strategy: 'Groove Industrial Limpio',
        reason: 'Mismo Camelot (10A), pegada seca sin saturar sub-graves. Transición directa perfecta.',
        camelot_color: '#f472b6'
    },
    {
        id: 'rec_4',
        title: 'Booster (Gary Beck Remix)',
        artist: 'Planetary Assault Systems',
        bpm: 137.5,
        camelot: '10A',
        raw_key: 'Bm',
        role: 'Percussive Descongestor',
        lufs: -7.1,
        low_ratio: 32.0,
        genre: 'Hypnotic / Raw',
        subgenre: 'Mote-Evolver',
        energy: 88,
        danceability: 86,
        arousal: 85,
        mood: 'Hypnotic Groove',
        format: 'WAV 24-bit',
        duration: '05:48',
        year: '2021',
        cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=300&fit=crop',
        strategy: 'Descongestión de Sala',
        reason: 'Textura enfocada en medios y agudos. Ideal para limpiar la sala tras un drop saturado.',
        camelot_color: '#f472b6'
    },
    {
        id: 'rec_5',
        title: 'Subversion',
        artist: 'Enrico Sangiuliano',
        bpm: 138.0,
        camelot: '11A',
        raw_key: 'F#m',
        role: 'Cosmic Climax',
        lufs: -6.0,
        low_ratio: 44.0,
        genre: 'Peak Time Techno',
        subgenre: 'NINETOZERO',
        energy: 95,
        danceability: 90,
        arousal: 94,
        mood: 'Cosmic Meltdown',
        format: 'FLAC Hi-Res',
        duration: '06:48',
        year: '2023',
        cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
        strategy: 'Ascensión Hipnótica',
        reason: 'Sintetizadores espaciales que abren el panorama estéreo antes de cortar los bajos.',
        camelot_color: '#fb7185'
    },
    {
        id: 'rec_6',
        title: 'Rave Generation',
        artist: 'Reinier Zonneveld',
        bpm: 139.0,
        camelot: '11A',
        raw_key: 'F#m',
        role: 'Acid Meltdown',
        lufs: -5.5,
        low_ratio: 46.0,
        genre: 'Acid Techno',
        subgenre: 'Filth on Acid',
        energy: 98,
        danceability: 94,
        arousal: 98,
        mood: 'High Energy Climax',
        format: 'WAV 24-bit',
        duration: '06:15',
        year: '2024',
        cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop',
        strategy: 'Explosión Peak Time',
        reason: 'Energía máxima para cerrar el set. Requiere swap rápido de EQ Low en drop.',
        camelot_color: '#fb7185'
    },
    {
        id: 'rec_7',
        title: 'Age of Love (Charlotte de Witte Remix)',
        artist: 'Age of Love',
        bpm: 138.0,
        camelot: '9A',
        raw_key: 'Em',
        role: 'Peak Acid Driver',
        lufs: -5.8,
        low_ratio: 41.0,
        genre: 'Peak Techno',
        subgenre: 'Diki Records',
        energy: 96,
        danceability: 92,
        arousal: 95,
        mood: 'Euphoric Peak',
        format: 'FLAC 24-bit',
        duration: '07:30',
        year: '2021',
        cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop',
        strategy: 'Descenso Armónico Suave (-1)',
        reason: 'Transición diagonal suave a 9A, manteniendo la tensión alta en el público.',
        camelot_color: '#818cf8'
    },
    {
        id: 'rec_8',
        title: 'Consciousness',
        artist: 'Anyma & Chris Avantgarde',
        bpm: 130.0,
        camelot: '8A',
        raw_key: 'Am',
        role: 'Melodic Journey',
        lufs: -6.4,
        low_ratio: 35.0,
        genre: 'Melodic Techno',
        subgenre: 'Afterlife',
        energy: 90,
        danceability: 88,
        arousal: 89,
        mood: 'Atmospheric Meltdown',
        format: 'FLAC Hi-Res',
        duration: '05:48',
        year: '2022',
        cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
        strategy: 'Cruce Melódico Espacioso',
        reason: 'Ideal para bajar de BPM o abrir el viaje melódico con graves limpios.',
        camelot_color: '#c084fc'
    }
];

const DEFAULT_COPILOT_STATE = {
    "connected": true,
    "source": "SIMULATION_MODE",
    "platform": "serato",
    "platform_mode": "auto",
    "platform_name": "Serato DJ Pro",
    "platform_icon": "\ud83d\udcbf",
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
        "valence": 55,
        "arousal": 88,
        "format": "FLAC 24-bit",
        "duration": "06:30",
        "duration_sec": 390.0,
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
                "color": "#22d3ee",
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
                "start_pct": 0.0,
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
                "label": "\u26a1 DROP PRINCIPAL (Cl\u00edmax)",
                "color": "#ef4444"
            },
            {
                "id": "break2",
                "name": "Segundo Par\u00f3n",
                "start_pct": 0.74,
                "end_pct": 0.82,
                "type": "break",
                "label": "Puente Mel\u00f3dico",
                "color": "#a855f7"
            },
            {
                "id": "outro",
                "name": "Outro Limpio",
                "start_pct": 0.82,
                "end_pct": 1.0,
                "type": "outro",
                "label": "\ud83d\udfe2 OUTRO SEGURO \u2022 Mezcla Out",
                "color": "#10b981"
            }
        ],
        "lufs": -8.7,
        "low_ratio": 48.0,
        "mid_ratio": 32.0,
        "high_ratio": 20.0,
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
        "bpm": 140.0,
        "camelot": "6A",
        "camelot_color": "#c084fc",
        "raw_key": "Gm",
        "file_path": "Users/admin/Music/FLAC quality/Snog - Turn on your Brain Baby vs. Acid Outburst 06.flac",
        "genre": "Raw / Deep Techno",
        "subgenre": "Drumcode Core",
        "energy": 91,
        "danceability": 95,
        "valence": 62,
        "arousal": 91,
        "format": "FLAC 16-bit",
        "duration": "05:48",
        "duration_sec": 348.0,
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
                "color": "#22d3ee",
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
                "start_pct": 0.0,
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
                "label": "\u26a1 DROP PRINCIPAL (Cl\u00edmax)",
                "color": "#ef4444"
            },
            {
                "id": "break2",
                "name": "Segundo Par\u00f3n",
                "start_pct": 0.74,
                "end_pct": 0.82,
                "type": "break",
                "label": "Puente Mel\u00f3dico",
                "color": "#a855f7"
            },
            {
                "id": "outro",
                "name": "Outro Limpio",
                "start_pct": 0.82,
                "end_pct": 1.0,
                "type": "outro",
                "label": "\ud83d\udfe2 OUTRO SEGURO \u2022 Mezcla Out",
                "color": "#10b981"
            }
        ],
        "lufs": -9.5,
        "low_ratio": 51.0,
        "mid_ratio": 31.0,
        "high_ratio": 18.0,
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
        "message": "Ambos tracks tienen sub-graves dominantes (>44%). El solape directo crear\u00e1 empaste y distorsi\u00f3n en el sistema de sala.",
        "tactical_advice": "Corta la EQ de graves (Low) en el canal entrante (-6dB a -12dB) antes de abrir el fader, o usa filtro paso-alto."
    },
    "harmonic": {
        "compatible": false,
        "match_type": "HARMONIC CLASH",
        "camelot_diff": "+4 Pasos",
        "energy_trend": "Disonancia Tonal",
        "badge": "HARMONIC CLASH",
        "color": "#ef4444",
        "advice": "Choque arm\u00f3nico severo (10A \u2794 6A). Usa par\u00f3n o transici\u00f3n por percusi\u00f3n."
    },
    "lufs_delta": -0.8,
    "bpm_delta": -0.37,
    "bpm_pct": -0.28,
    "recommendations": [
        {
            "id": "rec_1",
            "title": "Higher (Original Mix)",
            "artist": "Amelie Lens",
            "bpm": 130.0,
            "camelot": "10A",
            "role": "Percussive Tool",
            "lufs": -6.5,
            "low_ratio": 36.0,
            "genre": "Acid / Peak Techno",
            "subgenre": "Lenske Peak",
            "energy": 94,
            "danceability": 89,
            "mood": "Acid Drive",
            "format": "FLAC 24-bit",
            "duration": "06:12",
            "year": "2023",
            "cover": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
            "strategy": "Mezcla Arm\u00f3nica Segura",
            "reason": "Mismo tono (10A) y espectro percusivo limpio. Cero riesgo de embarre en graves.",
            "camelot_color": "#f472b6"
        },
        {
            "id": "rec_2",
            "title": "Your Mind (Extended Club)",
            "artist": "Adam Beyer & Bart Skils",
            "bpm": 131.0,
            "camelot": "11A",
            "role": "Peak Time Driver",
            "lufs": -5.9,
            "low_ratio": 49.0,
            "genre": "Drumcode Techno",
            "subgenre": "Drumcode Peak",
            "energy": 96,
            "danceability": 92,
            "mood": "Peak Time Climax",
            "format": "FLAC Hi-Res",
            "duration": "07:22",
            "year": "2022",
            "cover": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
            "strategy": "Subid\u00f3n de Energ\u00eda (+1)",
            "reason": "Aumento arm\u00f3nico a 11A con +1.0 BPM. Eleva la intensidad del club para el cl\u00edmax.",
            "camelot_color": "#fb7185"
        },
        {
            "id": "rec_3",
            "title": "Old School",
            "artist": "Hertz",
            "bpm": 130.0,
            "camelot": "10A",
            "role": "Industrial Driver",
            "lufs": -6.2,
            "low_ratio": 38.0,
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
            "reason": "Mismo Camelot (10A), pegada seca sin saturar sub-graves. Transici\u00f3n directa perfecta.",
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
            "low_ratio": 32.0,
            "genre": "Hypnotic / Raw",
            "subgenre": "Mote-Evolver",
            "energy": 88,
            "danceability": 86,
            "mood": "Hypnotic Groove",
            "format": "WAV 24-bit",
            "duration": "05:48",
            "year": "2021",
            "cover": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=300&fit=crop",
            "strategy": "Descongesti\u00f3n de Sala",
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
            "lufs": -6.0,
            "low_ratio": 44.0,
            "genre": "Peak Time Techno",
            "subgenre": "NINETOZERO",
            "energy": 95,
            "danceability": 90,
            "mood": "Cosmic Meltdown",
            "format": "FLAC Hi-Res",
            "duration": "06:48",
            "year": "2023",
            "cover": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
            "strategy": "Ascensi\u00f3n Hipn\u00f3tica",
            "reason": "Sintetizadores espaciales que abren el panorama est\u00e9reo antes de cortar los bajos.",
            "camelot_color": "#fb7185"
        },
        {
            "id": "rec_6",
            "title": "Rave Generation",
            "artist": "Reinier Zonneveld",
            "bpm": 132.0,
            "camelot": "11A",
            "role": "Acid Meltdown",
            "lufs": -5.5,
            "low_ratio": 46.0,
            "genre": "Acid Techno",
            "subgenre": "Filth on Acid",
            "energy": 98,
            "danceability": 94,
            "mood": "High Energy Climax",
            "format": "WAV 24-bit",
            "duration": "06:15",
            "year": "2024",
            "cover": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
            "strategy": "Explosi\u00f3n Peak Time",
            "reason": "Energ\u00eda m\u00e1xima para cerrar el set. Requiere swap r\u00e1pido de EQ Low en drop.",
            "camelot_color": "#fb7185"
        }
    ],
    "local_ip": "192.168.1.151",
    "timestamp": 1794309847.254317,
    "last_updated": "12:24:07",
    "is_simulating": true
};

export const CopilotDeckCard = ({ deck, side, isMaster, antiMuddy = null, partnerDeck = null, onSetMaster = null, onTogglePlay = null, onCue = null }) => {
    if (!deck) return null;
    return (
        <div className={`p-3.5 sm:p-4 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${
            isMaster 
            ? 'bg-gradient-to-b from-[#0c0d1c] to-[#06060c] border-djcyan-500/70 shadow-[0_0_25px_rgba(6,182,212,0.2)]' 
            : 'bg-[#07070f] border-zinc-800 hover:border-zinc-700'
        }`}>
            {/* Cabecera del Deck */}
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                    <span className="font-orbitron font-black text-sm sm:text-base text-zinc-400">DECK {side}</span>
                    <button
                        type="button"
                        onClick={() => onSetMaster && onSetMaster(side)}
                        className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-black uppercase tracking-wider cursor-pointer hover:scale-105 active:scale-95 transition-all ${
                            isMaster ? 'bg-djcyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                        }`}
                        title={`Haz clic para establecer DECK ${side} como MASTER (o pulsa 'M')`}
                    >
                        {isMaster ? '🔊 MASTER (ON AIR)' : '🎧 EN CUE (PREPARADO)'}
                    </button>

                    {/* BOTONES TÁCTICOS DE TRANSPORTE CABINA: PLAY/PAUSA & CUE */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onTogglePlay && onTogglePlay(side);
                        }}
                        className={`px-3 py-1 rounded-full font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center gap-1 border shadow-sm ${
                            deck.is_playing
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-600 hover:text-white'
                        }`}
                        title={`Alternar Play/Pausa en Deck ${side} (Atajo de teclado: '${side}')`}
                    >
                        <span>{deck.is_playing ? '⏸ PAUSA' : '▶ PLAY'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCue && onCue(side);
                        }}
                        className="px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider cursor-pointer hover:scale-105 active:scale-95 transition-all bg-zinc-900 hover:bg-zinc-800 text-indigo-300 border border-indigo-500/50 hover:text-white"
                        title={`Rebobinar a CUE Bar 1 (Atajo: tecla 'C')`}
                    >
                        <span>⏮ CUE</span>
                    </button>

                    {(deck.mood || deck.phase) && (
                        <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/40 text-[9px] font-mono font-bold text-purple-300 uppercase">
                            <Icons.Sparkles size={12} className="inline-block align-[-1px] mr-1" /> {deck.mood || deck.phase}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500 uppercase">
                    {deck.format && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700/60 text-[9px] font-bold text-zinc-300">
                            {deck.format}
                        </span>
                    )}
                    <span className="hidden sm:inline">{deck.is_audited ? '✓ DSP BEATWAVE' : 'DEFAULT DSP'}</span>
                </div>
            </div>

            {/* SECCIÓN PISTA EN 2 COLUMNAS (IZQUIERDA: COVER+INFO | DERECHA: CAMELOT+BPM+ENERGÍA+MOOD) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2.5 p-2.5 rounded-2xl bg-black/40 border border-zinc-800/80 items-stretch">
                {/* COLUMNA IZQUIERDA: Carátula 1:1 Cuadrada Full Height + Título + Artista + Taxonomía */}
                <div className="flex items-stretch gap-3 min-w-0">
                    <div 
                        className="relative rounded-xl overflow-hidden shrink-0 border border-zinc-700/70 shadow-md bg-black group flex-none"
                        style={{ width: '68px', height: '68px', minWidth: '68px', minHeight: '68px', aspectRatio: '1 / 1' }}
                    >
                        <img 
                            src={getValidCover(deck.cover)} 
                            alt="Carátula" 
                            onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                        {deck.duration && (
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/85 text-[8px] font-mono font-bold text-zinc-300">
                                {deck.duration}
                            </span>
                        )}
                        {deck.year && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[8px] font-mono text-zinc-400">
                                {deck.year}
                            </span>
                        )}
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <h2 className="font-syne font-bold text-xs sm:text-sm text-white tracking-tight leading-tight truncate" title={deck.title}>
                            {deck.title}
                        </h2>
                        <p className="font-syne font-bold text-xs text-zinc-400 mt-0.5 truncate" title={deck.artist}>
                            {deck.artist}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            {deck.genre && (
                                <span className="px-1.5 py-0.2 rounded bg-djcyan-950/70 border border-djcyan-500/40 text-[9px] font-mono font-bold text-djcyan-300 truncate">
                                    {deck.genre}
                                </span>
                            )}
                            {deck.subgenre && (
                                <span className="px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-700/60 text-[9px] font-mono text-zinc-400 truncate">
                                    {deck.subgenre}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: TONO Y TEMPO APILADOS CON MOOD DEBAJO + ENERGÍA, INTENSIDAD, DANZABILIDAD Y POSITIVIDAD */}
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 border-t md:border-t-0 md:border-l border-zinc-800/80 pt-2 md:pt-0 md:pl-3">
                    {/* BLOQUE TONO, TEMPO Y MOOD DEBAJO DE LOS BPM */}
                    <div className="flex flex-col gap-1 p-1 rounded-xl bg-zinc-950/90 border border-zinc-800 shrink-0 min-w-[100px]">
                        {/* Fila Tono */}
                        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg bg-zinc-900/80">
                            <div 
                                className="w-5 h-4 rounded text-[9px] font-orbitron font-black text-black flex items-center justify-center shrink-0 shadow-sm"
                                style={{ backgroundColor: deck.camelot_color || '#ec4899' }}
                            >
                                {deck.camelot || '10A'}
                            </div>
                            <span className="text-[7px] font-mono uppercase text-zinc-500 font-bold">TONO</span>
                            <span className="font-syne font-bold text-[10px] text-white truncate">{deck.raw_key || deck.camelot}</span>
                        </div>

                        {/* Fila Tempo (BPM) */}
                        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg bg-zinc-900/80">
                            <span className="text-[7px] font-mono uppercase text-zinc-500 font-bold">TEMPO</span>
                            <span className="font-orbitron font-black text-[10px] text-white">
                                {deck.bpm ? Number(deck.bpm).toFixed(2) : '130.00'}
                            </span>
                            <span className="text-[7px] text-zinc-400 font-mono">BPM</span>
                        </div>

                        {/* Cuadro morado con el Mood ubicado debajo de los BPM */}
                        <div className="px-1.5 py-0.5 rounded-lg bg-purple-950/70 border border-purple-500/40 text-[8px] font-mono font-bold text-purple-300 truncate max-w-full text-center" title={deck.mood || deck.phase || 'Peak Time Climax'}>
                            ✨ {deck.mood || deck.phase || 'Peak Time Climax'}
                        </div>
                    </div>

                    {/* COLUMNA PSICOMETRÍA: ENERGÍA, INTENSIDAD, DANZABILIDAD Y POSITIVIDAD APILADAS */}
                    <div className="flex-1 min-w-[130px] flex flex-col justify-center gap-1">
                        {/* Fila 1: Energía */}
                        <div>
                            <div className="flex items-center justify-between text-[8px] font-mono mb-0.5">
                                <span className="text-amber-400 font-bold flex items-center gap-1">
                                    <Icons.Zap size={9} /> ENERGÍA
                                </span>
                                <span className="text-amber-400 font-bold">{deck.energy || 90}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden flex">
                                <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full" style={{ width: `${deck.energy || 90}%` }}></div>
                            </div>
                        </div>

                        {/* Fila 2: Intensidad */}
                        <div>
                            <div className="flex items-center justify-between text-[8px] font-mono mb-0.5">
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <Icons.Activity size={9} /> INTENSIDAD
                                </span>
                                <span className="text-emerald-400 font-bold">{deck.arousal || Math.round((deck.energy || 90) * 0.95)}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden flex">
                                <div className="h-full bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.8)]" style={{ width: `${deck.arousal || Math.round((deck.energy || 90) * 0.95)}%` }}></div>
                            </div>
                        </div>

                        {/* Fila 3: Danzabilidad */}
                        <div>
                            <div className="flex items-center justify-between text-[8px] font-mono mb-0.5">
                                <span className="text-purple-300 font-bold flex items-center gap-1">
                                    <Icons.Sliders size={9} /> DANZABILIDAD
                                </span>
                                <span className="text-purple-300 font-bold">{deck.danceability || 85}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden flex">
                                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-[0_0_6px_rgba(168,85,247,0.8)]" style={{ width: `${deck.danceability || 85}%` }}></div>
                            </div>
                        </div>

                        {/* Fila 4: Positividad */}
                        <div>
                            <div className="flex items-center justify-between text-[8px] font-mono mb-0.5">
                                <span className="text-djcyan-400 font-bold flex items-center gap-1">
                                    <Icons.Sparkles size={9} /> POSITIVIDAD
                                </span>
                                <span className="text-djcyan-400 font-bold">{deck.valence != null ? deck.valence : (side === '1' || side === 'A' ? 55 : 62)}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden flex">
                                <div className="h-full bg-djcyan-400 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.8)]" style={{ width: `${deck.valence != null ? deck.valence : (side === '1' || side === 'A' ? 55 : 62)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tira Visual de 8 Hot Cues de Cabina */}
            <div className="mb-2.5 p-2 rounded-2xl bg-black/60 border border-zinc-800/80">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono uppercase text-zinc-400 tracking-wider font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-djcyan-400"></span> 8 HOT CUES DE CABINA
                    </span>
                    <span className="text-[8px] font-mono text-zinc-500">Puntos de Salto & Estructura</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                    {(deck.cues || [
                        { id: 1, name: "Downbeat", color: "#ef4444", time: "00:00" },
                        { id: 2, name: "Intro", color: "#f97316", time: "01:04" },
                        { id: 3, name: "Bass In", color: "#eab308", time: "02:08" },
                        { id: 4, name: "MAIN DROP", color: "#10b981", time: "03:12" },
                        { id: 5, name: "Break", color: "#06b6d4", time: "04:16" },
                        { id: 6, name: "Climax", color: "#22d3ee", time: "05:04" },
                        { id: 7, name: "Outro 32b", color: "#8b5cf6", time: "06:08" },
                        { id: 8, name: "Cut / Fade", color: "#ec4899", time: "07:15" },
                    ]).map((cue, cIdx) => (
                        <div 
                            key={cue.id || cIdx}
                            className="p-1 rounded-xl border flex flex-col justify-between transition-all bg-zinc-950/80 hover:bg-zinc-900 cursor-default"
                            style={{ borderColor: `${cue.color || '#06b6d4'}55` }}
                        >
                            <div className="flex items-center justify-between">
                                <span 
                                    className="w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-black text-black font-mono shadow-sm"
                                    style={{ backgroundColor: cue.color || '#06b6d4' }}
                                >
                                    {cue.id || (cIdx + 1)}
                                </span>
                                <span className="text-[7px] font-mono text-zinc-500">{cue.time || '--:--'}</span>
                            </div>
                            <div className="text-[7px] font-syne font-bold text-zinc-200 truncate mt-0.5" title={cue.name}>
                                {cue.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* WAVEFORM SERATO EN TIEMPO REAL CON ZOOM Y AYUDAS TÁCTICAS */}
            <div className="mb-2">
                <CopilotSeratoWaveform 
                    deck={deck} 
                    side={side} 
                    antiMuddy={antiMuddy} 
                    partnerDeck={partnerDeck} 
                />
            </div>

            {/* Densidad Sub-Graves y Espectro */}
            <div className="space-y-1 pt-1.5 border-t border-zinc-800/60 font-mono text-[11px]">
                <div className="flex items-center justify-between text-zinc-400">
                    <span>Densidad Sub-Graves (Sub-Bass)</span>
                    <span className={deck.low_ratio >= 44 ? 'text-red-400 font-bold' : 'text-zinc-200'}>{deck.low_ratio}%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden flex">
                    <div className={`h-full transition-all duration-300 ${deck.low_ratio >= 44 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-djcyan-400'}`} style={{ width: `${Math.min(100, deck.low_ratio * 1.5)}%` }}></div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                    <span>Medios: {deck.mid_ratio}%</span>
                    <span>Agudos: {deck.high_ratio}%</span>
                    <span>LUFS: <strong className="text-zinc-300">{deck.lufs} dB</strong></span>
                </div>
            </div>

            {/* Comentario Táctico DJ */}
            <div className="mt-2 p-2 rounded-xl bg-black/50 border border-zinc-800/80 flex items-start gap-2">
                <Icons.MessageSquare size={13} className="inline-block text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                    <div className="text-[8px] font-mono uppercase text-zinc-500 tracking-wider">Comentario Táctico DJ (Tag ID3)</div>
                    <div className="font-mono text-[11px] text-zinc-200 truncate" title={deck.comment || deck.tactical_comment || `[${deck.bpm ? Number(deck.bpm).toFixed(1) : '--'} BPM | ${deck.camelot}] Intro 32b • Drop contundente • Outro 64b`}>
                        {deck.comment || deck.tactical_comment || `[${deck.bpm ? Number(deck.bpm).toFixed(1) : '--'} BPM | ${deck.camelot}] Intro 32b • Drop contundente • Outro 64b`}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CopilotWorkspace = ({ onOpenPopOut, onOpenQr }) => {
    const [state, setState] = useState(DEFAULT_COPILOT_STATE);
    const [clock, setClock] = useState('');
    const [latency, setLatency] = useState(2);
    const [visibleCount, setVisibleCount] = useState(4);
    const [tracksList, setTracksList] = useState(DEFAULT_COPILOT_STATE.recommendations);
    const [draggedIdx, setDraggedIdx] = useState(null);
    const [transitionAnalysis, setTransitionAnalysis] = useState(null);
    const [lowEqApplied, setLowEqApplied] = useState(false);
    const [manualPickerOpen, setManualPickerOpen] = useState(false);
    const [manualSearchQuery, setManualSearchQuery] = useState('');
    const wsRef = useRef(null);

    const togglePlayDeck = async (targetSide) => {
        const sideStr = targetSide === '2' ? '2' : '1';
        // 1. Optimistic UI update inmediato para 0ms de respuesta táctica
        setState(prev => {
            if (!prev) return prev;
            const curDeck = sideStr === '1' ? prev.deck_1 : prev.deck_2;
            if (!curDeck) return prev;
            const newIsPlaying = !curDeck.is_playing;
            return {
                ...prev,
                [`deck_${sideStr}`]: {
                    ...curDeck,
                    is_playing: newIsPlaying,
                    status: newIsPlaying ? (curDeck.is_master ? 'ON AIR (MASTER)' : 'REPRODUCIENDO') : 'CUE / PREPARADO'
                }
            };
        });

        // 2. Transmitir comando a 0ms vía WebSocket o REST
        try {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ action: 'toggle_play', deck: sideStr }));
            } else {
                const res = await fetch('/api/copilot/toggle_play', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deck: sideStr })
                });
                if (res.ok) {
                    const data = await res.json();
                    setState(data);
                }
            }
        } catch (_) {}
    };

    const cueDeck = async (targetSide) => {
        const sideStr = targetSide === '2' ? '2' : '1';
        setState(prev => {
            if (!prev) return prev;
            const curDeck = sideStr === '1' ? prev.deck_1 : prev.deck_2;
            if (!curDeck) return prev;
            return {
                ...prev,
                [`deck_${sideStr}`]: {
                    ...curDeck,
                    is_playing: false,
                    play_progress: 0.0,
                    elapsed_sec: 0.0,
                    status: 'CUE / PREPARADO'
                }
            };
        });

        try {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ action: 'cue_deck', deck: sideStr }));
            } else {
                const res = await fetch('/api/copilot/cue_deck', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deck: sideStr })
                });
                if (res.ok) {
                    const data = await res.json();
                    setState(data);
                }
            }
        } catch (_) {}
    };

    const handleApplyCorrection = () => {
        setLowEqApplied(prev => {
            const next = !prev;
            setState(curr => {
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
                        status: next ? 'safe' : 'danger',
                        tag: next ? 'EQ LOW -10dB APLICADO' : 'BASS CLASH',
                        color: next ? '#10b981' : '#ef4444',
                        message: next 
                            ? 'Low EQ cortado en Deck 2 (-10dB). Espectro de sub-graves despejado y sin distorsión en sala.' 
                            : 'Ambos tracks tienen sub-graves dominantes (>44%). El solape directo creará empaste y distorsión en el sistema de sala.',
                        action: next ? 'Restablecer EQ (Deshacer)' : 'Corta la EQ de graves (Low) en el canal entrante (-6dB a -12dB)'
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
        setTracksList(prev => {
            if (prev.some(t => t.id === track.id)) return prev;
            if (prev.length >= 8) {
                return [...prev.slice(0, 7), track];
            }
            return [...prev, track];
        });
        setVisibleCount(v => Math.max(v, Math.min(8, tracksList.length + 1)));
        setManualPickerOpen(false);
    };

    const [controllerState, setControllerState] = useState({
        detected: true,
        name: 'NUMARK NV II (USB)',
        status: 'CONECTADA'
    });

    // Detección automática y mapeo reactivo de Controladora DJ (WebMIDI API <1ms)
    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess({ sysex: false })
                .then(access => {
                    const checkDevices = () => {
                        const inputs = Array.from(access.inputs.values());
                        const djDev = inputs.find(d => /nv|numark|mkii|ddj|flx|pioneer|traktor|kontrol|denon|hercules|reloop|dj/i.test(d.name || ''));
                        if (djDev) {
                            let cleanName = djDev.name.toUpperCase();
                            if (/nv|mkii/i.test(cleanName)) {
                                cleanName = 'NUMARK NV II (USB)';
                            }
                            setControllerState({
                                detected: true,
                                name: cleanName,
                                status: 'CONECTADA'
                            });
                        } else if (inputs.length > 0) {
                            setControllerState({
                                detected: true,
                                name: inputs[0].name.toUpperCase(),
                                status: 'MIDI ACTIVO'
                            });
                        }

                        // Escuchar mensajes MIDI en vivo para transporte DJ (Play/Pause, Cue)
                        inputs.forEach(input => {
                            input.onmidimessage = (msg) => {
                                if (!msg || !msg.data || msg.data.length < 2) return;
                                const status = msg.data[0];
                                const note = msg.data[1];
                                const vel = msg.data.length > 2 ? msg.data[2] : 0;
                                const isNoteOn = ((status & 0xf0) === 0x90 && vel > 0) || ((status & 0xf0) === 0xb0 && vel > 0);
                                const channel = status & 0x0f;

                                if (isNoteOn) {
                                    // Numark NV / NV II / Pioneer / Traktor transport:
                                    // Ch 0 o Ch 2 (Deck 1 / 3):
                                    if ((channel === 0 || channel === 2) && (note === 0 || note === 8 || note === 11 || note === 39 || note === 64 || note === 67 || note === 71 || note === 75)) {
                                        togglePlayDeck('1');
                                    } else if ((channel === 1 || channel === 3) && (note === 0 || note === 8 || note === 12 || note === 39 || note === 64 || note === 67 || note === 72 || note === 75)) {
                                        togglePlayDeck('2');
                                    } else if (note === 11 || note === 71) {
                                        togglePlayDeck('1');
                                    } else if (note === 12 || note === 72) {
                                        togglePlayDeck('2');
                                    } else if (note === 1 || note === 9 || note === 51 || note === 68) {
                                        if (channel === 1 || channel === 3) {
                                            cueDeck('2');
                                        } else {
                                            cueDeck('1');
                                        }
                                    }
                                }
                            };
                        });
                    };
                    checkDevices();
                    access.onstatechange = checkDevices;
                })
                .catch(() => {});
        }
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setClock(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Conexión en tiempo real: WebSocket nativo 60 FPS (<25ms) con fallback a Polling reactivo
    useEffect(() => {
        let isMounted = true;
        let ws = null;
        let fallbackInterval = null;
        let isFetching = false;

        const startPollingFallback = () => {
            if (fallbackInterval) return;
            const fetchStatus = async () => {
                if (isFetching || document.hidden) return;
                isFetching = true;
                const t0 = performance.now();
                try {
                    const res = await fetch('/api/copilot/status');
                    if (res.ok) {
                        const data = await res.json();
                        const dt = Math.round(performance.now() - t0);
                        if (isMounted) {
                            setState(data);
                            if (data.controller && data.controller.name) {
                                setControllerState(data.controller);
                            }
                            const measured = data.capture_latency_ms ? Math.round(data.capture_latency_ms + (dt * 0.15)) : dt;
                            setLatency(Math.max(1, measured));
                            if (data.recommendations && data.recommendations.length > 0) {
                                setTracksList(prev => (prev.length === 0 ? data.recommendations : prev));
                            }
                        }
                    }
                } catch (e) {
                    if (isMounted) {
                        setState(prev => prev || DEFAULT_COPILOT_STATE);
                        setLatency(1);
                        setTracksList(prev => (prev.length === 0 ? DEFAULT_COPILOT_STATE.recommendations : prev));
                    }
                } finally {
                    isFetching = false;
                }
            };
            fetchStatus();
            fallbackInterval = setInterval(fetchStatus, 150);
        };

        const connectWebSocket = () => {
            try {
                const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const host = window.location.host || '127.0.0.1:8000';
                ws = new WebSocket(`${proto}//${host}/ws/copilot`);
                wsRef.current = ws;

                let lastPingTime = performance.now();
                const pingInterval = setInterval(() => {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        lastPingTime = performance.now();
                        ws.send(JSON.stringify({ action: 'ping', client_ts: lastPingTime }));
                    }
                }, 2000);

                ws.onmessage = (event) => {
                    if (!isMounted) return;
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'pong') {
                            const rtt = Math.round(performance.now() - (data.client_ts || lastPingTime));
                            setLatency(Math.max(1, Math.min(25, rtt)));
                            return;
                        }
                        setState(data);
                        if (data.controller && data.controller.name) {
                            setControllerState(data.controller);
                        }
                        const cap = data.capture_latency_ms || 0.4;
                        const netDt = data.server_ts ? Math.max(1, Math.round((Date.now() / 1000 - data.server_ts) * 1000)) : 1;
                        const totalLat = Math.min(25, Math.max(1, Math.round(cap + netDt)));
                        setLatency(totalLat);
                        if (data.recommendations && data.recommendations.length > 0) {
                            setTracksList(prev => (prev.length === 0 ? data.recommendations : prev));
                        }
                    } catch (_) {}
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
            if (fallbackInterval) clearInterval(fallbackInterval);
        };
    }, []);

    const setMasterDeck = async (deckTarget) => {
        const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isLocalHost) {
            try {
                const res = await fetch('/api/copilot/set_master', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ master: deckTarget })
                });
                if (res.ok) {
                    const data = await res.json();
                    setState(data);
                    return;
                }
            } catch (_) {}
        }
        // Fallback local:
        setState(prev => {
            if (!prev) return prev;
            const cur1Master = prev.deck_1?.is_master;
            const new1Master = deckTarget === '1' ? true : deckTarget === '2' ? false : !cur1Master;
            return {
                ...prev,
                deck_1: {
                    ...prev.deck_1,
                    is_master: new1Master,
                    status: new1Master ? 'ON AIR (MASTER)' : 'CUE / PREPARADO',
                    is_playing: new1Master,
                    elapsed_sec: new1Master ? prev.deck_1.elapsed_sec : 0.0
                },
                deck_2: {
                    ...prev.deck_2,
                    is_master: !new1Master,
                    status: !new1Master ? 'ON AIR (MASTER)' : 'CUE / PREPARADO',
                    is_playing: !new1Master,
                    elapsed_sec: !new1Master ? prev.deck_2.elapsed_sec : 0.0
                }
            };
        });
    };

    // Atajos de teclado para cabina DJ: '1' Play D1, '2' Play D2, Espacio Play Master, 'C' Cue, 'M' Master
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
            if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                setMasterDeck('toggle');
            } else if (e.key === '1') {
                e.preventDefault();
                togglePlayDeck('1');
            } else if (e.key === '2') {
                e.preventDefault();
                togglePlayDeck('2');
            } else if (e.code === 'Space') {
                e.preventDefault();
                const masterTarget = state?.deck_1?.is_master ? '1' : '2';
                togglePlayDeck(masterTarget);
            } else if (e.key === 'c' || e.key === 'C') {
                e.preventDefault();
                const cueTarget = state?.deck_1?.is_master ? '2' : '1';
                cueDeck(cueTarget);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state]);

    const toggleSimulation = async () => {
        const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isLocalHost) {
            try {
                const res = await fetch('/api/copilot/toggle_simulation', { method: 'POST' });
                if (res.ok) {
                    const data = await res.json();
                    setState(data);
                    if (data.recommendations) setTracksList(data.recommendations);
                    return;
                }
            } catch (e) {}
        }

        // Fallback interactivo local para Figma / Offline:
        setState(prev => {
            const current = prev || DEFAULT_COPILOT_STATE;
            const newSim = !current.is_simulating;
            return {
                ...current,
                is_simulating: newSim,
                source: newSim ? 'SIMULATION_MODE' : 'SERATO_LIVE',
                deck_1: {
                    ...current.deck_1,
                    title: newSim ? 'Komodo (Megavoices Claxixx)' : 'Deep Blue',
                    artist: newSim ? 'Mauro Picotto' : 'The Midnight',
                    bpm: newSim ? 137.68 : 130.0,
                    camelot: newSim ? '10A' : '10A',
                    mood: newSim ? 'Peak Time Climax' : 'Melodic Club'
                },
                deck_2: {
                    ...current.deck_2,
                    title: newSim ? 'Smooth Mind' : 'Turn on your Brain Baby',
                    artist: newSim ? 'Marco Bailey / Sigvard' : 'Snog',
                    bpm: newSim ? 140.0 : 129.63,
                    camelot: newSim ? '6A' : '8A',
                    mood: newSim ? 'Hypnotic Groove' : 'Drumcode Core'
                },
                anti_muddy: {
                    clash_detected: newSim,
                    severity: newSim ? 'CRITICAL' : 'SAFE',
                    color: newSim ? '#ef4444' : '#10b981',
                    badge: newSim ? 'BASS CLASH' : 'SAFE MIX',
                    message: newSim 
                        ? 'Ambos tracks tienen sub-graves dominantes (>44%). El solape directo creará empaste y distorsión en el sistema de sala.'
                        : 'Equilibrio de frecuencias óptimo entre Decks. Transición limpia sin solape.',
                    tactical_advice: newSim 
                        ? 'Corta la EQ de graves (Low) en el canal entrante (-6dB a -12dB) antes de abrir el fader, o usa filtro paso-alto.'
                        : 'Curva de mezcla perfecta en compás 32.'
                }
            };
        });
    };

    const setPlatform = async (plat) => {
        try {
            const res = await fetch('/api/copilot/set_platform', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform: plat })
            });
            if (res.ok) {
                const data = await res.json();
                setState(data);
                return;
            }
        } catch (e) {}
        setState(prev => {
            const current = prev || DEFAULT_COPILOT_STATE;
            return {
                ...current,
                platform: plat,
                platform_mode: plat,
                platform_name: plat === 'serato' ? 'Serato DJ Pro' : plat === 'rekordbox' ? 'Rekordbox' : plat === 'virtualdj' ? 'VirtualDJ Pro' : plat === 'traktor' ? 'Traktor Pro' : 'Auto-Detect'
            };
        });
    };

    // Lógica Drag and Drop para reordenar pistas próximas + Análisis dinámico
    const handleDragStart = (e, index) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetIdx) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === targetIdx) return;

        const updated = [...tracksList];
        const [movedItem] = updated.splice(draggedIdx, 1);
        updated.splice(targetIdx, 0, movedItem);
        setTracksList(updated);
        setDraggedIdx(null);

        // Análisis dinámico instantáneo de la transición resultante
        const masterTrack = state?.deck_1 || {};
        const incomingTrack = updated[0];
        const mCamelot = masterTrack.camelot || '10A';
        const inCamelot = incomingTrack.camelot || '10A';
        const mBpm = parseFloat(masterTrack.bpm) || 138.0;
        const inBpm = parseFloat(incomingTrack.bpm) || 138.0;
        const bpmDelta = (inBpm - mBpm).toFixed(1);

        const mNum = parseInt(mCamelot);
        const inNum = parseInt(inCamelot);
        const isExactMatch = mCamelot === inCamelot;
        const isEnergyBoost = (inNum === ((mNum % 12) + 1));
        const isHarmonic = isExactMatch || isEnergyBoost || (mNum === ((inNum % 12) + 1));

        setTransitionAnalysis({
            trackTitle: incomingTrack.title,
            isHarmonic,
            matchType: isExactMatch ? 'MATCH PERFECTO (Mismo Tono)' : isEnergyBoost ? 'SUBIDÓN DE ENERGÍA (+1 Camelot)' : isHarmonic ? 'COMPATIBLE' : 'CHOQUE ARMÓNICO (Cuidado)',
            bpmDelta: bpmDelta >= 0 ? `+${bpmDelta}` : bpmDelta,
            lowRatio: incomingTrack.low_ratio,
            safeBass: incomingTrack.low_ratio < 44,
            advice: isExactMatch 
                ? 'Excelente acople tímbrico. Realiza el cruce en el compás 32 con EQ Low compensado.'
                : isEnergyBoost 
                ? 'Sube la intensidad de la pista. Filtra graves con HPF antes del drop para impacto limpio.'
                : 'Diferencia armónica. Usa un parón (breakdown) o reverb out para no desafinar.'
        });
    };

    const activeState = state || DEFAULT_COPILOT_STATE;
    const { deck_1, deck_2, anti_muddy, harmonic } = activeState;
    const isLive = state.source && state.source.endsWith('_LIVE');
    const isStandby = state.source && state.source.endsWith('_STANDBY');
    const displayRecommendations = tracksList.length > 0 ? tracksList : (state.recommendations || []);

    const platformsList = [
        { id: 'auto', label: 'Auto', color: '#a855f7' },
        { id: 'serato', label: 'Serato', color: '#00d1e8' },
        { id: 'rekordbox', label: 'Rekordbox', color: '#38bdf8' },
        { id: 'virtualdj', label: 'VirtualDJ', color: '#f97316' },
        { id: 'traktor', label: 'Traktor', color: '#facc15' }
    ];

    return (
        <div className="flex flex-col w-full h-full p-3 sm:p-5 pb-32 md:pb-6 overflow-y-auto select-none bg-[#040407] text-gray-200">
            {/* Cabecera de la Pantalla Táctica */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-2.5 border-b border-zinc-800 mb-3 gap-2">
                {/* IZQUIERDA: PUNTO Y TEXTO EN LA MISMA LÍNEA + BADGES DE CABINA */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`w-3 h-3 rounded-full shrink-0 ${
                            isLive 
                            ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse' 
                            : isStandby
                            ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)] animate-pulse'
                            : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                        }`}></span>
                        <span className="w-7 h-7 rounded-lg bg-djcyan-500/10 border border-djcyan-500/30 flex items-center justify-center text-djcyan-400 shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                            <Icons.Turntable size={16} />
                        </span>
                        <h2 className="font-syne font-black text-sm sm:text-base leading-none text-white tracking-wide uppercase whitespace-nowrap flex items-center gap-1">
                            Copilot <span className="text-djcyan-400">Cabina DJ</span>
                        </h2>
                    </div>

                    {/* BADGE DEL SOFTWARE ACTIVO CON LOGO VECTORIAL */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700/60 font-mono text-[10px]">
                        {renderPlatformLogo(state.platform || 'serato', 13)}
                        <strong style={{ color: state.platform_color || '#00d1e8' }}>{state.platform_name || 'DJ LINK'}</strong>
                        <span className="text-zinc-600">|</span>
                        <span className={isLive ? 'text-red-400 font-bold' : isStandby ? 'text-cyan-400' : 'text-amber-400 font-bold'}>
                            {state.platform_status || (isLive ? 'LIVE' : 'STANDBY')}
                        </span>
                    </div>

                    {/* BADGE DETECCIÓN DE CONTROLADORA DJ */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-emerald-500/50 font-mono text-[10px] text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse"></span>
                        <span className="text-zinc-400">🎛️</span>
                        <strong className="text-white">{controllerState.name}</strong>
                    </div>

                    {/* BADGE ABLETON LINK SYNC (Solo visible si hay peers activos) */}
                    {state.ableton_link?.peers > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[10px] border bg-purple-950/70 border-purple-500/80 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.35)]" title="Ableton Link Activo: sincronizado con software DJ">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                            <span>🔗 LINK:</span>
                            <strong className="text-white">
                                {`${state.ableton_link.peers} PEER (${state.ableton_link.playing ? 'PLAY' : 'PAUSA'})`}
                            </strong>
                        </div>
                    )}

                    {/* HUD BADGE LATENCIA CABINA (<25ms) & SELECTOR MASTER */}
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/50 font-mono text-[10px] text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse"></span>
                        <span className="font-bold tracking-tight">⚡ Latencia Cabina: <strong className="text-white font-extrabold">{latency}ms</strong> • Sincronizado</span>
                        <button
                            type="button"
                            onClick={() => setMasterDeck('toggle')}
                            className="ml-1 px-1.5 py-0.2 rounded bg-zinc-800 hover:bg-zinc-700 text-cyan-300 hover:text-white border border-cyan-500/40 font-bold transition-all cursor-pointer active:scale-95 text-[9px]"
                            title="Intercambiar qué Deck es Master en vivo (Atajo de teclado: M)"
                        >
                            ⇄ DECK {deck_1.is_master ? '1' : '2'} [M]
                        </button>
                    </div>
                </div>

                {/* DERECHA: SELECTOR DE CABINA + RELOJ + SIMULADOR + POP-OUT EN LÍNEA COMPACTO */}
                <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
                    {/* SELECTOR DE PLATAFORMA */}
                    <div className="flex items-center p-0.5 bg-zinc-950/90 rounded-xl border border-zinc-800 shadow-inner">
                        {platformsList.map(p => {
                            const isSelected = (state.platform_mode === p.id) || (state.platform_mode === 'auto' && p.id === 'auto');
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setPlatform(p.id)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                                        isSelected 
                                        ? 'bg-zinc-800 text-white shadow-md border border-zinc-600'
                                        : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                    style={isSelected ? { color: p.color, borderColor: `${p.color}66` } : {}}
                                    title={`Conectar con ${p.label}`}
                                >
                                    {renderPlatformLogo(p.id, 13)}
                                    <span className="hidden sm:inline text-[10px]">{p.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="font-mono text-xs font-bold text-white bg-zinc-900 px-2 py-1 rounded-xl border border-zinc-800 shadow-inner">
                        {clock || state.last_updated}
                    </div>

                    <button
                        type="button"
                        onClick={toggleSimulation}
                        className={`px-2 py-1 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer border ${
                            state.source === 'SIMULATION_MODE'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-700/60'
                        }`}
                        title="Alternar simulación"
                    >
                        <Icons.Brain size={12} className="inline-block align-[-1px]" /> {state.source === 'SIMULATION_MODE' ? 'Simulando' : 'Simular'}
                    </button>

                    {onOpenPopOut && (
                        <button
                            type="button"
                            onClick={onOpenPopOut}
                            className="px-2 py-1 rounded-xl text-xs font-mono font-bold text-white bg-red-600/90 hover:bg-red-500 uppercase transition-all cursor-pointer shadow-sm flex items-center gap-1 shrink-0"
                            title="Abrir en ventana independiente Pop-Out para segundo monitor"
                        >
                            <Icons.Grid size={12} />
                            <span>Pop-Out ↗</span>
                        </button>
                    )}
                </div>
            </div>

            {/* GUARDIÁN TÁCTICO ANTI-MUDDY (REDUCIDO Y UBICADO ENCIMA DE LOS DECKS) */}
            <section className="mb-2.5">
                <div className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-2 ${
                    anti_muddy.status === 'danger'
                    ? 'bg-red-950/40 border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                    : anti_muddy.status === 'warning'
                    ? 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                }`}>
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">
                            {anti_muddy.status === 'danger' ? '🛡️' : anti_muddy.status === 'warning' ? '⚡' : '🟢'}
                        </span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="font-syne font-black text-xs text-white tracking-wide">{anti_muddy.title}</h3>
                                <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-mono font-black uppercase tracking-wider shrink-0 ${
                                    anti_muddy.status === 'danger' ? 'bg-red-600 text-white' : anti_muddy.status === 'warning' ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-black'
                                }`}>
                                    {anti_muddy.tag}
                                </span>
                            </div>
                            <p className="text-[10.5px] text-zinc-300 truncate mt-0.5">{anti_muddy.message}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-between md:justify-end text-[10.5px] font-mono">
                        {(anti_muddy.controller_knobs || anti_muddy.flx4) && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 font-bold text-[10px] shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                <span>🎛️ {(state.controller?.name || controllerState.name || 'NUMARK NV II').replace(' (USB)', '')}:</span>
                                <span className="text-white font-extrabold">{(anti_muddy.controller_knobs || anti_muddy.flx4).filter_knob}</span>
                                <span className="text-zinc-400">•</span>
                                <span className="text-amber-300 font-extrabold">{(anti_muddy.controller_knobs || anti_muddy.flx4).eq_low}</span>
                            </div>
                        )}
                        {/* BOTÓN INTERACTIVO DE ACCIÓN CORRECTIVA ANTI-MUDDY */}
                        <button
                            type="button"
                            onClick={handleApplyCorrection}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer shadow-sm border ${
                                lowEqApplied
                                ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500 text-emerald-300 hover:text-white'
                                : 'bg-red-900/90 hover:bg-red-800 border-red-500 text-white animate-pulse'
                            }`}
                            title="Aplicar corte táctico de EQ para resolver choque de sub-graves"
                        >
                            <span>{lowEqApplied ? '✓' : '⚡'}</span>
                            <span className="text-djcyan-300 font-bold">ACCIÓN:</span>
                            <span className="truncate max-w-[280px]">{lowEqApplied ? 'Restablecer EQ (Deshacer)' : (anti_muddy.action || 'Corta Low EQ en Deck 2 (-10dB)')}</span>
                        </button>

                        <div className="flex items-center gap-2 text-zinc-400 text-[10px]">
                            <span>CAMELOT: <strong style={{ color: harmonic.color }}>{harmonic.badge}</strong></span>
                            <span>Δ LUFS: <strong className="text-white">{state.lufs_delta > 0 ? `+${state.lufs_delta}` : state.lufs_delta} dB</strong></span>
                        </div>
                    </div>
                </div>
            </section>

            {/* DUAL DECK HEADS-UP DISPLAY ENRIQUECIDO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-4">
                <CopilotDeckCard 
                    deck={deck_1} 
                    side="1" 
                    isMaster={deck_1.is_master} 
                    antiMuddy={anti_muddy} 
                    partnerDeck={deck_2} 
                    onSetMaster={setMasterDeck} 
                    onTogglePlay={togglePlayDeck}
                    onCue={cueDeck}
                />
                <CopilotDeckCard 
                    deck={deck_2} 
                    side="2" 
                    isMaster={deck_2.is_master} 
                    antiMuddy={anti_muddy} 
                    partnerDeck={deck_1} 
                    onSetMaster={setMasterDeck} 
                    onTogglePlay={togglePlayDeck}
                    onCue={cueDeck}
                />
            </div>

            {/* PRÓXIMAS PISTAS (4 VISIBLES, CARGAR MÁS, DRAG & DROP Y ANÁLISIS DINÁMICO) */}
            <section className="mt-auto">
                <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <h4 className="font-syne font-bold text-xs sm:text-sm text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Icons.Bulb size={14} className="text-amber-400 inline-block" />
                            <span>PRÓXIMAS PISTAS SUGERIDAS ({displayRecommendations.length})</span>
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">• Arrastra para reordenar la secuencia</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* CARGAR MÁS DE 4 EN 4 HASTA MÁXIMO 8 */}
                        <button
                            type="button"
                            onClick={() => setVisibleCount(v => v === 4 ? Math.min(8, displayRecommendations.length) : 4)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-mono font-bold text-djcyan-400 transition-colors cursor-pointer"
                            title="Alternar entre 4 y 8 pistas visibles"
                        >
                            {visibleCount === 4 ? 'Cargar más (+4)' : 'Mostrar 4 (-4)'}
                        </button>

                        {/* BOTÓN CARGA ALEATORIA */}
                        <button
                            type="button"
                            onClick={handleRandomLoad}
                            className="px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-500/60 text-xs font-mono font-bold text-purple-300 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                            title="Cargar selección aleatoria de candidatos de la biblioteca"
                        >
                            <span>🎲</span>
                            <span>Carga Aleatoria</span>
                        </button>

                        {/* BOTÓN CARGA MANUAL */}
                        <button
                            type="button"
                            onClick={() => setManualPickerOpen(true)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/60 text-xs font-mono font-bold text-emerald-300 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                            title="Buscar y añadir manualmente una pista a la cola"
                        >
                            <span>➕</span>
                            <span>Carga Manual</span>
                        </button>
                    </div>
                </div>

                {/* MODAL / BANNER DE ANÁLISIS DE TRANSICIÓN TRAS DRAG & DROP */}
                {transitionAnalysis && (
                    <div className="mb-3 p-2.5 rounded-xl bg-zinc-950 border border-djcyan-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono animate-fadeIn">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base">⚡</span>
                            <span className="text-zinc-300">Transición con <strong className="text-white">{transitionAnalysis.trackTitle}</strong>:</span>
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                transitionAnalysis.isHarmonic ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'
                            }`}>
                                {transitionAnalysis.matchType}
                            </span>
                            <span className="text-zinc-400">Δ BPM: <strong className="text-white">{transitionAnalysis.bpmDelta}</strong></span>
                            <span className="text-zinc-400">Sub-Graves: <strong className={transitionAnalysis.safeBass ? 'text-emerald-400' : 'text-amber-400'}>{transitionAnalysis.lowRatio}%</strong></span>
                        </div>
                        <div className="text-[11px] text-zinc-300 truncate">
                            <strong className="text-djcyan-400">Acción:</strong> {transitionAnalysis.advice}
                        </div>
                    </div>
                )}

                {/* GRID DE 4 PISTAS VISIBLES REORDENABLES MEDIANTE DRAG AND DROP */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {displayRecommendations.slice(0, visibleCount).map((rec, idx) => {
                        const isDragging = draggedIdx === idx;
                        return (
                            <div 
                                key={rec.id || idx}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, idx)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, idx)}
                                className={`p-2.5 rounded-2xl bg-[#090912] border transition-all shadow-md group flex flex-col justify-between cursor-grab active:cursor-grabbing ${
                                    isDragging 
                                    ? 'opacity-40 border-djcyan-400 scale-95' 
                                    : 'border-zinc-800 hover:border-djcyan-500/50 hover:bg-[#0c0c17]'
                                }`}
                                title="Arrastra para cambiar el orden de mezcla"
                            >
                                <div className="flex items-start gap-2.5 mb-1.5">
                                    {/* Thumbnail Carátula con orden numérico */}
                                    <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-zinc-700/60 bg-black">
                                        <img 
                                            src={getValidCover(rec.cover)} 
                                            alt="Cover" 
                                            onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }} 
                                            className="w-full h-full object-cover"
                                        />
                                        <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded bg-black/80 text-[8px] font-mono font-bold text-zinc-300 flex items-center justify-center">
                                            #{idx + 1}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="font-syne font-bold text-xs text-white group-hover:text-djcyan-300 transition-colors truncate">{rec.title}</span>
                                            <span className="w-6 h-6 rounded flex items-center justify-center font-orbitron font-black text-[10px] text-black shadow shrink-0" style={{ backgroundColor: rec.camelot_color }}>
                                                {rec.camelot}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-zinc-400 truncate font-mono">{rec.artist}</div>
                                        <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-mono">
                                            <span className="text-djcyan-400 font-bold">{rec.bpm} BPM</span>
                                            {rec.mood && <span className="text-purple-400 truncate">• {rec.mood}</span>}
                                            {rec.energy && <span className="text-amber-400 font-bold shrink-0">• {rec.energy}%</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1.5 border-t border-zinc-800/60">
                                    <span className="text-djcyan-400 font-semibold truncate max-w-[130px]">{rec.strategy}</span>
                                    <span className="text-zinc-500 shrink-0">Sub: {rec.low_ratio}%</span>
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{rec.reason}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* MODAL DE CARGA MANUAL DE PISTAS (HASTA 8 MÁXIMO) */}
            {manualPickerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn" onClick={() => setManualPickerOpen(false)}>
                    <div className="bg-[#0b0b12] border border-zinc-700 rounded-2xl w-full max-w-xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">➕</span>
                                <h3 className="font-syne font-bold text-base text-white">Carga Manual de Pistas a la Cola</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setManualPickerOpen(false)}
                                className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-mono cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="relative">
                            <input
                                type="text"
                                value={manualSearchQuery}
                                onChange={e => setManualSearchQuery(e.target.value)}
                                placeholder="Buscar por título, artista, tono Camelot o género..."
                                className="w-full h-10 px-3 pl-9 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-djcyan-400 font-mono"
                                autoFocus
                            />
                            <span className="absolute left-3 top-2.5 text-zinc-500 text-xs">🔍</span>
                        </div>

                        <div className="overflow-y-auto flex-1 flex flex-col gap-2 pr-1 max-h-[45vh]">
                            {MASTER_TRACKS_POOL
                                .filter(t => {
                                    if (!manualSearchQuery) return true;
                                    const q = manualSearchQuery.toLowerCase();
                                    return (t.title || '').toLowerCase().includes(q) ||
                                           (t.artist || '').toLowerCase().includes(q) ||
                                           (t.camelot || '').toLowerCase().includes(q) ||
                                           (t.genre || '').toLowerCase().includes(q);
                                })
                                .map(t => {
                                    const isAlreadyAdded = tracksList.some(item => item.id === t.id);
                                    return (
                                        <div key={t.id} className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-all gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div 
                                                    className="w-7 h-7 rounded text-[10px] font-orbitron font-black text-black flex items-center justify-center shrink-0"
                                                    style={{ backgroundColor: t.camelot_color || '#f472b6' }}
                                                >
                                                    {t.camelot}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-syne font-bold text-xs text-white truncate">{t.title}</div>
                                                    <div className="text-[10px] font-mono text-zinc-400">{t.artist} • {t.bpm} BPM • {t.genre}</div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={isAlreadyAdded || tracksList.length >= 8}
                                                onClick={() => handleAddManualTrack(t)}
                                                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                                                    isAlreadyAdded
                                                    ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                                                    : tracksList.length >= 8
                                                    ? 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed'
                                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                                                }`}
                                            >
                                                {isAlreadyAdded ? 'En cola ✓' : tracksList.length >= 8 ? 'Cola llena (8 máx)' : '+ Añadir'}
                                            </button>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// =======================================================
// MODAL SELECTOR Y LANZADOR DE BEATWAVE LIVE COPILOT
// =======================================================
export const CopilotLaunchModal = ({ isOpen, onClose, onSelectEmbedded }) => {
    const [copilotInfo, setCopilotInfo] = useState({ local_ip: '127.0.0.1', companion_url: '/copilot.html', simulation_mode: false, platform_mode: 'auto', platforms: [] });
    const [copied, setCopied] = useState(false);
    const [qrShown, setQrShown] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetch('/api/copilot/info')
                .then(r => r.json())
                .then(data => setCopilotInfo(data))
                .catch(() => {});
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const launchPopOut = () => {
        const w = 1380;
        const h = 880;
        const left = (window.screen.width - w) / 2;
        const top = (window.screen.height - h) / 2;
        window.open(
            '/copilot.html',
            'BeatWaveLiveCopilot',
            `width=${w},height=${h},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
        );
        onClose();
    };

    const copyCompanionUrl = () => {
        const url = copilotInfo.companion_url || (window.location.origin + '/copilot.html');
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const toggleSimulation = async () => {
        try {
            const res = await fetch('/api/copilot/toggle_simulation', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setCopilotInfo(prev => ({ ...prev, simulation_mode: !prev.simulation_mode }));
                return;
            }
        } catch (e) {}
        setCopilotInfo(prev => ({ ...prev, simulation_mode: !prev.simulation_mode }));
    };

    const selectPlatform = async (pId) => {
        try {
            const res = await fetch('/api/copilot/set_platform', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform: pId })
            });
            if (res.ok) {
                const data = await res.json();
                setCopilotInfo(prev => ({
                    ...prev,
                    platform_mode: pId,
                    active_platform: data.platform
                }));
                return;
            }
        } catch (e) {}
        setCopilotInfo(prev => ({
            ...prev,
            platform_mode: pId,
            active_platform: pId === 'auto' ? 'serato' : pId
        }));
    };

    const companionUrl = copilotInfo.companion_url || `${window.location.protocol}//${copilotInfo.local_ip || '127.0.0.1'}:8000/copilot.html`;

    const activePlatObj = (copilotInfo.platforms || []).find(p => p.id === copilotInfo.active_platform) || { name: 'Suite DJ', id: 'serato' };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn" onClick={onClose}>
            <div 
                className="ws-booth relative w-full max-w-2xl flex flex-col gap-5 p-5 sm:p-6 max-h-[88vh] overflow-y-auto custom-scrollbar" role="dialog" aria-modal="true" aria-labelledby="copilot-launch-title"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabecera */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-[var(--bw-line)]">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                            <span className="ws-badge-live"><span className="ws-dot ws-dot-alert" />LIVE</span>
                            <span className="ws-glass-kicker">Booth monitor</span>
                        </div>
                        <h2 id="copilot-launch-title" className="text-lg sm:text-xl font-semibold text-[var(--bw-white)] tracking-tight">Live Copilot</h2>
                        <p className="text-xs text-[var(--bw-text-2)] leading-relaxed">Compatibilidad armónica Camelot y anti-muddy en tiempo real, sobre tu software de cabina.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="ws-glass-icon shrink-0"
                    >
                        <Icons.Close size={14} className="inline-block align-[-2px]" />
                    </button>
                </div>

                {/* SELECTOR DE PLATAFORMA DE CABINA CON LOGOS VECTORIALES */}
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                        <span className="ws-glass-kicker">Software de cabina</span>
                        <button 
                            type="button" 
                            onClick={() => selectPlatform('auto')} 
                            className={`text-[11px] font-mono transition-colors cursor-pointer ${copilotInfo.platform_mode === 'auto' || !copilotInfo.platform_mode ? 'text-cyan-400 font-semibold' : 'text-zinc-500 hover:text-zinc-300'}`}
                            title="Alternar modo detección automática en cabina"
                        >
                            {copilotInfo.platform_mode === 'auto' || !copilotInfo.platform_mode ? '● Auto-detectar activo' : 'Modo Auto'}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                            { id: 'rekordbox', label: 'Rekordbox', color: '#38bdf8' },
                            { id: 'virtualdj', label: 'VirtualDJ', color: '#f97316' },
                            { id: 'serato', label: 'Serato', color: '#00d1e8' },
                            { id: 'traktor', label: 'Traktor', color: '#facc15' }
                        ].map(p => {
                            const isSelected = copilotInfo.platform_mode === p.id;
                            const platData = (copilotInfo.platforms || []).find(x => x.id === p.id);
                            const isDetected = platData ? platData.detected : false;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => selectPlatform(isSelected ? 'auto' : p.id)}
                                    className={`flex items-center justify-between h-10 px-3 rounded-xl border transition-all cursor-pointer select-none ${
                                        isSelected 
                                        ? 'bg-zinc-800/90 text-white shadow-md' 
                                        : 'bg-zinc-950/70 hover:bg-zinc-900 text-zinc-300 hover:text-white border-zinc-800/90'
                                    }`}
                                    aria-pressed={isSelected}
                                    style={isSelected ? { borderColor: p.color, boxShadow: `0 0 12px ${p.color}33` } : {}}
                                    title={isDetected ? `${p.label} (Detectado en cabina)` : `${p.label} (Standby)`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                            {renderPlatformLogo(p.id, 20)}
                                        </div>
                                        <span className="text-xs font-mono font-semibold truncate tracking-tight text-white">
                                            {p.label}
                                        </span>
                                    </div>
                                    <span 
                                        className={`w-2 h-2 rounded-full shrink-0 ml-1.5 transition-all ${
                                            isDetected 
                                            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] ring-1 ring-emerald-300' 
                                            : 'bg-zinc-600'
                                        }`} 
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3 Modos de Visualización en Cabina */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Tarjeta 1: Segundo Monitor / Pop-Out */}
                    <div 
                        onClick={launchPopOut}
                        className="ws-card ws-card-action p-4 flex flex-col justify-between gap-4 cursor-pointer"
                    >
                        <div>
                            <span className="ws-card-icon"><Icons.Grid size={16} /></span>
                            <h3 className="mt-3 text-sm font-semibold text-[var(--bw-white)]">
                                Segundo Monitor
                            </h3>
                            <p className="text-xs text-[var(--bw-text-2)] mt-1 leading-relaxed">
                                Ventana flotante limpia para arrastrar a tu pantalla secundaria o proyector con soporte F11.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="ws-btn ws-btn-outline w-full justify-center h-9"
                        >
                            <Icons.External size={13} /> Lanzar Pop-Out
                        </button>
                    </div>

                    {/* Tarjeta 2: iPad / Tablet Companion */}
                    <div 
                        onClick={() => setQrShown(!qrShown)}
                        className="ws-card ws-card-action p-4 flex flex-col justify-between gap-4 cursor-pointer"
                    >
                        <div>
                            <span className="ws-card-icon"><Icons.Grid size={16} /></span>
                            <h3 className="mt-3 text-sm font-semibold text-[var(--bw-white)]">
                                iPad / Tablet
                            </h3>
                            <p className="text-xs text-[var(--bw-text-2)] mt-1 leading-relaxed">
                                Abre en el navegador de tu iPad sin cables. Enlace Wi-Fi directo para cabina.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="ws-btn ws-btn-outline w-full justify-center h-9"
                        >
                            {qrShown ? 'Ocultar QR' : 'Ver Código QR'}
                        </button>
                    </div>

                    {/* Tarjeta 3: Esta Pantalla (In-App) */}
                    <div 
                        onClick={onSelectEmbedded}
                        className="ws-card ws-card-action p-4 flex flex-col justify-between gap-4 cursor-pointer"
                    >
                        <div>
                            <span className="ws-card-icon"><Icons.Sliders size={16} /></span>
                            <h3 className="mt-3 text-sm font-semibold text-[var(--bw-white)]">
                                Esta Pantalla
                            </h3>
                            <p className="text-xs text-[var(--bw-text-2)] mt-1 leading-relaxed">
                                Maximiza el HUD en esta misma ventana para preparar el set antes de la actuación.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="ws-btn ws-btn-primary w-full justify-center h-9"
                        >
                            Ver en la App <Icons.ChevronRight size={13} />
                        </button>
                    </div>
                </div>

                {/* Desplegable QR & Enlace */}
                {qrShown && (
                    <div className="ws-card p-4 flex flex-col sm:flex-row items-center gap-4 animate-fadeIn">
                        <div className="p-2 bg-white rounded-xl shrink-0 shadow-lg">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(companionUrl)}`} 
                                alt="Código QR iPad"
                                className="w-28 h-28 object-contain"
                            />
                        </div>
                        <div className="flex-1 flex flex-col gap-2 min-w-0">
                            <div className="ws-glass-kicker">
                                Dirección local de cabina (misma red Wi-Fi):
                            </div>
                            <div className="p-2 rounded-md bg-[var(--bw-black)] border border-[var(--bw-line)] font-mono text-xs text-[var(--bw-cyan)] break-all select-all">
                                {companionUrl}
                            </div>
                            <button
                                type="button"
                                onClick={copyCompanionUrl}
                                className="ws-btn ws-btn-ghost self-start h-8"
                            >
                                {copied ? <><Icons.Check size={13} /> Enlace copiado</> : <><Icons.Copy size={13} /> Copiar enlace</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* Barra de Estado y Simulación */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[var(--bw-line)] text-xs">
                    <div className="flex items-center gap-2 text-[var(--bw-text-2)]">
                        <span className="ws-dot ws-dot-ok"></span>
                        <div className="flex items-center gap-1.5">
                            <span>Motor Activo:</span>
                            {renderPlatformLogo(copilotInfo.active_platform || 'serato', 16)}
                            <strong className="text-[var(--bw-white)] font-medium">{activePlatObj.name}</strong>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[var(--bw-text-3)]">¿Sin software activo?</span>
                        <button
                            type="button"
                            onClick={toggleSimulation}
                            className={`ws-btn h-8 ${copilotInfo.simulation_mode ? 'ws-btn-warn' : 'ws-btn-ghost'}`}
                            aria-pressed={!!copilotInfo.simulation_mode}
                        >
                            <Icons.Brain size={13} /> {copilotInfo.simulation_mode ? 'Simulación Activa' : 'Activar Simulación'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==============================================================================
// BEATWAVE HERO SHOWCASE STUDIO · 01 WARP DEPTH & LASER SCRAMBLE
// ==============================================================================
const HERO_SHOWCASE_SLIDES = [
    {
        title: "AUDITORÍA FORENSE DE AUDIO LOSSLESS",
        subtitle: "Detecta transcodificaciones falsas MP3-a-FLAC al instante mediante análisis FFT de corte espectral, clics digitales y silencios anómalos.",
        badge: "Escaneo FFT 24-bit · Detección Fake 320"
    },
    {
        title: "SEPARACIÓN NEURONAL DE STEMS EN VIVO",
        subtitle: "Aísla voces, baterías, bajos y melodías en segundos con aceleración nativa en Apple Silicon conservando todos tus metadatos ID3.",
        badge: "Motor BS-Roformer · 4 Canales Sin Pérdida"
    },
    {
        title: "DETECCIÓN AUTOMÁTICA DE DROPS Y HOT CUES",
        subtitle: "Analiza la energía sub-bass y alinea la rejilla de compases 4/4 para marcar Intro, Breakdown, Drop y Outro listos para Rekordbox.",
        badge: "Beatgrid 1.1 Exacto · Exportación XML"
    },
    {
        title: "SINCRONIZACIÓN ARMÓNICA CAMELOT 4/4",
        subtitle: "Navega toda tu colección como una galaxia espacial en 3D: agrupa temas por compatibilidad armónica Camelot, densidad de graves y BPM para sets hipnóticos sin esfuerzo.",
        badge: "Clustering 3D Espectral · Compatibilidad +1/-1"
    },
    {
        title: "BÚSQUEDA SEMÁNTICA POR VIBRA SONORA",
        subtitle: "Encuentra al instante el track exacto describiendo su textura, atmósfera o energía sin depender de etiquetas manuales incompletas.",
        badge: "Embeddings Vectoriales · Similitud Tímbrica"
    }
];

const GLYPHS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+/<>[]=";

const CleanLineKineticStudioStage = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const slideRef = useRef(null);
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const badgeRef = useRef(null);
    const trailRef = useRef(null);

    const timersRef = useRef([]);
    const intervalsRef = useRef([]);
    const isHoveredRef = useRef(false);
    isHoveredRef.current = isHovered;
    const isTransitioningRef = useRef(false);

    const clearAsync = () => {
        timersRef.current.forEach(t => clearTimeout(t));
        intervalsRef.current.forEach(i => clearInterval(i));
        timersRef.current = [];
        intervalsRef.current = [];
    };

    const addTimeout = (fn, delay) => {
        const id = setTimeout(fn, delay);
        timersRef.current.push(id);
        return id;
    };

    const addInterval = (fn, delay) => {
        const id = setInterval(fn, delay);
        intervalsRef.current.push(id);
        return id;
    };

    const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    const scrambleText = (str) => str.split('').map(c => (c === ' ' ? ' ' : randomGlyph())).join('');

    const resetAnimationClasses = () => {
        const slideEl = slideRef.current;
        const titleEl = titleRef.current;
        const trailEl = trailRef.current;
        const badgeEl = badgeRef.current;

        if (slideEl) slideEl.classList.remove('choreo-01-exit');
        if (titleEl) titleEl.classList.remove('title-fly-in');
        if (trailEl) trailEl.classList.remove('trail-active');
        if (badgeEl) badgeEl.classList.remove('badge-sweep-run');
        if (slideEl) void slideEl.offsetWidth; // Reflow forzado
    };

    const transitionToSlide = (targetIndex, skipExit = false) => {
        if (isTransitioningRef.current && !skipExit) return;
        clearAsync();
        isTransitioningRef.current = true;

        const exitDuration = skipExit ? 0 : 480;
        const slideEl = slideRef.current;

        if (!skipExit && slideEl) {
            resetAnimationClasses();
            slideEl.classList.add('choreo-01-exit');
        }

        addTimeout(() => {
            setCurrentIndex(targetIndex);
            const slideData = HERO_SHOWCASE_SLIDES[targetIndex];

            resetAnimationClasses();

            const titleEl = titleRef.current;
            const subtitleEl = subtitleRef.current;
            const badgeEl = badgeRef.current;
            const trailEl = trailRef.current;

            if (subtitleEl) {
                subtitleEl.textContent = slideData.subtitle;
                subtitleEl.style.opacity = '0';
                subtitleEl.style.transform = 'translateY(14px)';
                subtitleEl.style.filter = 'blur(8px)';
            }

            if (badgeEl) {
                badgeEl.style.opacity = '0';
                badgeEl.style.transform = 'translateY(16px) scale(0.96)';
                badgeEl.style.filter = 'blur(8px)';
            }

            if (titleEl) {
                titleEl.innerHTML = `<span class="glyph-scramble">${scrambleText(slideData.title)}</span>`;
                titleEl.classList.add('title-fly-in');
            }
            if (trailEl) {
                trailEl.classList.add('trail-active');
            }

            const flightMutator = addInterval(() => {
                if (titleEl) {
                    titleEl.innerHTML = `<span class="glyph-scramble">${scrambleText(slideData.title)}</span>`;
                }
            }, 32);

            // Desplegar subtítulo y badge con escalonamiento
            addTimeout(() => {
                if (subtitleEl) {
                    subtitleEl.style.opacity = '1';
                    subtitleEl.style.transform = 'translateY(0px)';
                    subtitleEl.style.filter = 'blur(0px)';
                }
                if (badgeEl) {
                    badgeEl.style.opacity = '1';
                    badgeEl.style.transform = 'translateY(0px) scale(1)';
                    badgeEl.style.filter = 'blur(0px)';
                }
            }, 180);

            // Decodificar caracteres de izquierda a derecha al aterrizar
            addTimeout(() => {
                clearInterval(flightMutator);
                let iter = 0;
                const totalLen = slideData.title.length;

                const decodeLoop = addInterval(() => {
                    let html = '';
                    for (let i = 0; i < totalLen; i++) {
                        const ch = slideData.title[i];
                        if (ch === ' ') {
                            html += ' ';
                        } else if (i < iter) {
                            html += `<span class="glyph-locked">${ch}</span>`;
                        } else {
                            html += `<span class="glyph-scramble">${randomGlyph()}</span>`;
                        }
                    }
                    if (titleEl) titleEl.innerHTML = html;

                    if (iter >= totalLen) {
                        clearInterval(decodeLoop);
                        if (titleEl) titleEl.innerHTML = `<span class="glyph-locked">${slideData.title}</span>`;
                        if (badgeEl) badgeEl.classList.add('badge-sweep-run');
                        isTransitioningRef.current = false;
                        scheduleNextAutoSlide(targetIndex);
                    }
                    iter += 1.6;
                }, 22);
            }, 360);

        }, exitDuration);
    };

    const scheduleNextAutoSlide = (activeIdx) => {
        addTimeout(() => {
            if (isHoveredRef.current) {
                const checkHover = addInterval(() => {
                    if (!isHoveredRef.current) {
                        clearInterval(checkHover);
                        scheduleNextAutoSlide(activeIdx);
                    }
                }, 800);
                return;
            }

            const nextIdx = (activeIdx + 1) % HERO_SHOWCASE_SLIDES.length;
            transitionToSlide(nextIdx, false);
        }, 4200);
    };

    useEffect(() => {
        transitionToSlide(0, true);
        return () => clearAsync();
    }, []);

    const currentSlide = HERO_SHOWCASE_SLIDES[currentIndex] || HERO_SHOWCASE_SLIDES[0];

    return (
        <div 
            className="w-full flex flex-col items-center justify-center relative select-none hero-stage"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <style dangerouslySetInnerHTML={{ __html: `
                .hero-stage { perspective: 1200px; perspective-origin: 50% 50%; width: 100%; }
                .hero-slide { width: 100%; max-width: 960px; display: flex; flex-direction: column; align-items: center; text-align: center; will-change: transform, opacity, filter; margin: 0 auto; }
                .hero-title { font-family: 'Inter', -apple-system, sans-serif !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 0.02em !important; line-height: 1.15 !important; color: #ffffff !important; white-space: nowrap !important; will-change: transform, opacity, filter; }
                @media (max-width: 768px) { .hero-title { white-space: normal !important; } }
                .glyph-scramble { font-family: 'JetBrains Mono', monospace !important; color: #22d3ee !important; text-shadow: 0 0 16px rgba(34, 211, 238, 0.95), 0 0 32px rgba(6, 182, 212, 0.7) !important; font-weight: 700 !important; }
                .glyph-locked { color: #ffffff !important; text-shadow: 0 0 24px rgba(56, 189, 248, 0.16) !important; font-family: 'Inter', sans-serif !important; font-weight: 700 !important; }
                .title-fly-in { animation: titleStreakFromRight 560ms cubic-bezier(0.08, 0.96, 0.18, 1.14) forwards; }
                @keyframes titleStreakFromRight {
                  0% { opacity: 0; transform: translateX(105vw) scaleX(2.1) skewX(-14deg); filter: blur(20px); }
                  48% { opacity: 1; transform: translateX(-18px) scaleX(1.05) skewX(3deg); filter: blur(3px); }
                  78% { transform: translateX(6px) scaleX(0.99) skewX(-1deg); filter: blur(0px); }
                  100% { opacity: 1; transform: translateX(0px) scaleX(1) skewX(0deg); filter: blur(0px); }
                }
                .hero-subtitle { max-width: 760px; color: #cbd5e1 !important; font-weight: 400 !important; line-height: 1.55 !important; will-change: transform, opacity, filter; transition: opacity 480ms cubic-bezier(0.16, 1, 0.3, 1), transform 480ms cubic-bezier(0.16, 1, 0.3, 1), filter 480ms cubic-bezier(0.16, 1, 0.3, 1); }
                .tech-pill-badge { position: relative !important; display: inline-flex !important; align-items: center !important; gap: 10px !important; padding: 8px 22px !important; border-radius: 9999px !important; background: rgba(5, 11, 18, 0.92) !important; border: 1px solid rgba(255, 255, 255, 0.78) !important; box-shadow: 0 0 24px rgba(34, 211, 238, 0.22), inset 0 0 12px rgba(34, 211, 238, 0.12) !important; overflow: hidden !important; will-change: transform, opacity, filter; transition: opacity 480ms cubic-bezier(0.16, 1, 0.3, 1) 80ms, transform 480ms cubic-bezier(0.16, 1, 0.3, 1) 80ms, filter 480ms cubic-bezier(0.16, 1, 0.3, 1) 80ms, border-color 300ms ease, box-shadow 300ms ease; }
                .badge-shimmer-bar { position: absolute; inset: 0; background: linear-gradient(90deg, transparent 0%, rgba(34, 211, 238, 0.45) 50%, transparent 100%); transform: translateX(-100%); pointer-events: none; }
                .badge-sweep-run .badge-shimmer-bar { animation: badgeLightPass 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards; }
                @keyframes badgeLightPass { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                .choreo-01-exit { animation: c01WarpOut 520ms cubic-bezier(0.4, 0, 0.2, 1) forwards !important; }
                @keyframes c01WarpOut { 0% { opacity: 1; transform: scale(1) translateZ(0px); filter: blur(0px); } 100% { opacity: 0; transform: scale(1.12) translateZ(80px); filter: blur(22px); } }
                .page-dot { height: 8px !important; width: 8px !important; border-radius: 9999px !important; background-color: #475569 !important; transition: all 380ms cubic-bezier(0.16, 1, 0.3, 1) !important; cursor: pointer !important; border: none !important; outline: none !important; padding: 0 !important; margin: 0 !important; display: inline-block !important; }
                .page-dot:hover { background-color: #94a3b8 !important; }
                .page-dot.is-active { width: 34px !important; background: linear-gradient(90deg, #0891b2, #22d3ee) !important; box-shadow: 0 0 16px rgba(34, 211, 238, 0.85) !important; }
                .laser-trail { position: absolute; height: 1px; background: linear-gradient(90deg, transparent 0%, #0891b2 40%, #22d3ee 85%, transparent 100%); box-shadow: 0 0 14px rgba(34, 211, 238, 0.75); opacity: 0; pointer-events: none; will-change: transform, opacity; }
                .trail-active .laser-trail.t1 { top: calc(50% - 76px); width: 45vw; animation: trailShoot 520ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .trail-active .laser-trail.t2 { top: calc(50% - 22px); width: 34vw; animation: trailShoot 480ms cubic-bezier(0.16, 1, 0.3, 1) 40ms forwards; }
                @keyframes trailShoot { 0% { opacity: 0; transform: translateX(100vw) scaleX(2.4); } 35% { opacity: 0.9; transform: translateX(5vw) scaleX(2.8); } 100% { opacity: 0; transform: translateX(-75vw) scaleX(0.4); } }
            ` }} />
            {/* Estelas láser horizontales en azul corporativo */}
            <div ref={trailRef} className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="laser-trail t1" />
                <div className="laser-trail t2" />
            </div>

            {/* BLOQUE HERO DE DIAPOSITIVA (SIN TELEMETRÍA LOCKED READABLE) */}
            <section ref={slideRef} className="hero-slide px-4">
                {/* 1. TÍTULO SIN MARCO EN TIPOGRAFÍA INTER */}
                <h1 
                    ref={titleRef} 
                    className="hero-title text-2xl sm:text-4xl md:text-[42px] lg:text-[46px] mb-4 text-center"
                >
                    {currentSlide.title}
                </h1>

                {/* 2. SUBTÍTULO DESCRIPTIVO DE 2 LÍNEAS */}
                <p 
                    ref={subtitleRef} 
                    className="hero-subtitle text-sm sm:text-base md:text-[18px] mb-6 px-2 text-center"
                >
                    {currentSlide.subtitle}
                </p>

                {/* 3. FILA INFERIOR: PILL BADGE TÉCNICO + DOTS DE PAGINACIÓN */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                    {/* Pill Badge técnico con check verde esmeralda y texto cian */}
                    <div ref={badgeRef} className="tech-pill-badge">
                        <div className="badge-shimmer-bar" />
                        <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="4 10.5 8 14.5 16 6" />
                        </svg>
                        <span className="font-mono text-xs sm:text-[13px] font-semibold tracking-wide text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                            {currentSlide.badge}
                        </span>
                    </div>

                    {/* Indicadores de paginación con píldora activa alargada */}
                    <div className="flex items-center space-x-2.5">
                        {HERO_SHOWCASE_SLIDES.map((_, dotIdx) => (
                            <button
                                key={dotIdx}
                                type="button"
                                onClick={() => {
                                    if (dotIdx !== currentIndex) {
                                        transitionToSlide(dotIdx, false);
                                    }
                                }}
                                className={`page-dot ${dotIdx === currentIndex ? 'is-active' : ''}`}
                                aria-label={`Diapositiva ${dotIdx + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export const AppCinematicIntro = ({ isOpen, onClose, onOpenLogin, onOpenRegister, onOpenTour, onOpenPricing }) => {
    if (!isOpen) return null;

    const [phase, setPhase] = useState('video'); // 'video' | 'portal'
    const [videoOpacity, setVideoOpacity] = useState(1.0); // Opacidad visible directa
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [selectedAlpha, setSelectedAlpha] = useState(0.85); // Alpha 85% exacto solicitado por el usuario
    const [isMuted, setIsMuted] = useState(false);
    const [isBassShaking, setIsBassShaking] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // ENTRADA DEL VÍDEO: Suave aparición inicial
    useEffect(() => {
        const timer = setTimeout(() => {
            setVideoOpacity(1.0);
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    // Reproducción automática limpia: desmutear de inmediato sin forzar al usuario a hacer clic en la pantalla
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid) return;

        vid.currentTime = 0;
        vid.muted = false;
        vid.volume = 1.0;

        const tryUnmute = () => {
            if (vid) {
                vid.muted = false;
                vid.volume = 1.0;
                setIsMuted(false);
                vid.play().catch(() => {});
            }
        };

        const playPromise = vid.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                setIsMuted(false);
            }).catch(() => {
                vid.muted = true;
                setIsMuted(true);
                vid.play().catch(() => {});

                const triggerEvents = ['pointermove', 'mousemove', 'mouseenter', 'touchstart', 'focus', 'wheel', 'scroll', 'keydown', 'pointerdown'];
                const onUserInteract = () => {
                    tryUnmute();
                    triggerEvents.forEach(ev => window.removeEventListener(ev, onUserInteract));
                };
                triggerEvents.forEach(ev => window.addEventListener(ev, onUserInteract, { passive: true, once: true }));
            });
        }
    }, []);

    // SEGUIMIENTO DE TIEMPO Y DISOLUCIÓN ULTRA-SUAVE
    const handleTimeUpdate = () => {
        const vid = videoRef.current;
        if (!vid || !vid.duration) return;

        // Vibración de cámara y distorsión de graves desde el drop sincronizado con el play (9.259s)
        if (vid.currentTime >= 9.258 && !isBassShaking) {
            setIsBassShaking(true);
        }

        // Alpha fijo al 85% solicitado por el usuario para todas las etapas del vídeo
        if (selectedAlpha !== 0.85) {
            setSelectedAlpha(0.85);
        }

        // SALIDA DEL VÍDEO: Disolución cruzada gradual en los últimos 1.8 segundos sin corte negro
        const timeLeft = vid.duration - vid.currentTime;
        if (timeLeft <= 1.8 && !isTransitioning) {
            setIsTransitioning(true);
            setVideoOpacity(0.0);
            setTimeout(() => {
                setPhase('portal');
            }, 1100);
        }
    };

    const handleVideoEnded = () => {
        setIsTransitioning(true);
        setVideoOpacity(0.0);
        setTimeout(() => {
            setPhase('portal');
        }, 1000);
    };

    const handleSkip = () => {
        setIsTransitioning(true);
        setVideoOpacity(0.0);
        setTimeout(() => {
            setPhase('portal');
        }, 900);
    };

    // Acciones al pulsar los botones del portal
    const handleAction = (action) => {
        if (action === 'login') {
            onClose();
            if (onOpenLogin) onOpenLogin();
        } else if (action === 'register') {
            onClose();
            if (onOpenRegister) onOpenRegister();
        } else if (action === 'tour') {
            onClose();
            if (onOpenTour) onOpenTour();
        } else if (action === 'pricing') {
            if (onOpenPricing) onOpenPricing();
            onClose();
        } else {
            onClose();
        }
    };

    // Atmósfera 3D y Rayos Láser en Fase Portal
    useEffect(() => {
        if (phase !== 'portal' && !isTransitioning) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        let t = 0;

        const render3D = () => {
            t += 0.035;
            const w = canvas.width = window.innerWidth;
            const h = canvas.height = window.innerHeight;
            ctx.clearRect(0, 0, w, h);

            // Láseres Neón volumétricos en perspectiva
            const count = 10;
            for (let i = 0; i < count; i++) {
                const angle = Math.sin(t * 0.8 + i * 0.7) * 0.45;
                const startX = (w / (count + 1)) * (i + 1);
                ctx.beginPath();
                ctx.moveTo(startX, 0);
                ctx.lineTo(startX + Math.tan(angle) * h, h);
                const g = ctx.createLinearGradient(startX, 0, startX + Math.tan(angle) * h, h);
                g.addColorStop(0, i % 2 === 0 ? 'rgba(34, 211, 238, 0.55)' : 'rgba(250, 250, 250, 0.28)');
                g.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.strokeStyle = g;
                ctx.lineWidth = 2.5 + Math.sin(t * 2 + i) * 1.5;
                ctx.stroke();
            }

            animId = requestAnimationFrame(render3D);
        };

        render3D();
        return () => cancelAnimationFrame(animId);
    }, [phase, isTransitioning]);

    return (
        <div 
            className="fixed inset-0 z-[99999] bg-[#09090b] overflow-hidden flex flex-col justify-between font-sans text-white select-none"
            onClick={() => {
                const vid = videoRef.current;
                if (vid && vid.muted) {
                    vid.muted = false;
                    setIsMuted(false);
                }
            }}
        >
            {/* CAPA 1: PUERTA DE ACCESO Y PORTAL ESPECTACULAR (SIEMPRE DISPONIBLE EN EL FONDO) */}
            <div 
                className="absolute inset-0 z-10 flex flex-col bg-[#09090b] overflow-y-auto custom-scrollbar"
                style={{
                    opacity: phase === 'portal' ? 1.0 : (isTransitioning ? 1.0 : 0.0),
                    pointerEvents: phase === 'portal' || isTransitioning ? 'auto' : 'none',
                    transform: phase === 'portal' || isTransitioning ? 'scale(1)' : 'scale(0.98)',
                    transition: 'opacity 1100ms cubic-bezier(0.16, 1, 0.3, 1), transform 1100ms cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-35" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(34,211,238,0.18),transparent_70%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_45%,#09090b)] pointer-events-none" />

                {/* Topbar del Portal */}
                <div className="relative z-10 flex items-center justify-between gap-4 px-5 sm:px-8 pt-5 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span className="bw-eyebrow text-cyan-300 font-mono text-[11px] font-black uppercase tracking-widest hidden sm:inline">
                            BeatWave Pro · Precision Audio Intelligence
                        </span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            type="button"
                            onClick={() => handleAction('pricing')}
                            className="bw-btn bw-btn-primary font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                        >
                            <Icons.Crown size={14} />
                            <span>Desbloquear Licencia Pro</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAction('cabin')}
                            className="bw-btn bw-btn-ghost hover:text-white"
                        >
                            <span>Entrar a la cabina</span>
                            <Icons.ChevronRight size={14} />
                        </button>
                    </div>
                </div>

                {/* Contenido Principal con Logo y Rotador de Hooks Persuasivos */}
                <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-6 text-center max-w-5xl mx-auto w-full my-auto">
                    {/* Logo Oficial + Tipografía Idéntica al Header (Misma Tipografía Syne, Diseño y Proporción 1:1) Separado del Carrusel */}
                    <div 
                        className="flex items-center justify-center select-none group"
                        style={{ marginTop: '16px', marginBottom: '84px' }}
                    >
                        <BeatWaveBrandIdentity variant="hero" />
                    </div>

                    {/* ESCENARIO LIBRE SIN MARCOS NI TARJETAS: CLEAN-LINE KINETIC SCRAMBLE STUDIO (MISMO ESPACIO INFERIOR DE 84PX) */}
                    <div className="w-full flex flex-col items-center justify-center select-none" style={{ marginBottom: '84px' }}>
                        <CleanLineKineticStudioStage />
                    </div>

                    {/* BOTONES DE CONVERSIÓN & ACCESO A LICENCIA */}
                    <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <button
                            type="button"
                            onClick={() => handleAction('pricing')}
                            className="bw-gate-rise is-primary relative overflow-hidden group shadow-[0_15px_40px_rgba(34,211,238,0.45)] cursor-pointer flex flex-col justify-between p-5 min-h-[112px] rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black text-left transition-all hover:-translate-y-0.5 active:scale-98"
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/15 group-hover:scale-110 transition-transform text-black shrink-0">
                                    <Icons.Crown size={22} />
                                </span>
                                <div className="px-2.5 py-1 rounded bg-black/20 text-[9.5px] font-mono font-black uppercase tracking-wider text-black">
                                    MÁS ELEGIDO
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5 text-left mt-3">
                                <span className="text-base font-black tracking-tight text-black">Desbloquear Licencia Pro</span>
                                <span className="text-xs text-black/75 font-medium leading-tight">Acceso total e ilimitado al motor DSP y Hot Cues</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleAction('login')}
                            className="bw-gate-rise bg-[#141524]/90 hover:bg-[#1a1c30] border border-cyan-500/30 hover:border-cyan-400 relative overflow-hidden group shadow-lg cursor-pointer flex flex-col justify-between p-5 min-h-[112px] rounded-2xl text-left transition-all hover:-translate-y-0.5 active:scale-98"
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-cyan-300 group-hover:scale-110 transition-transform shrink-0">
                                    <Icons.LogIn size={20} />
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5 text-left mt-3">
                                <span className="text-base font-bold text-white tracking-tight">Iniciar Sesión en Cabina</span>
                                <span className="text-xs text-zinc-400 font-medium leading-tight">Continúa tu sesión, maleta y preferencias</span>
                            </div>
                        </button>
                    </div>

                    <p className="text-[11px] font-mono text-zinc-500 mt-3 flex items-center gap-1.5">
                        <Icons.Check size={12} className="text-emerald-400" />
                        Garantía de rendimiento en directo · 100% Offline tras activación · Sin cuelgues
                    </p>
                </main>

                {/* Footer del Portal */}
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-1.5 border-t border-white/5 px-5 sm:px-8 py-3.5 font-mono text-[11px] text-zinc-500 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-zinc-400 font-bold">ECOSISTEMA UNIVERSAL:</span>
                        <span>CDJ-3000 · Rekordbox · Serato DJ Pro · Traktor Pro 3 · VirtualDJ</span>
                    </div>
                    <span className="text-cyan-400/80 font-bold">v2.4 Studio Pro · Ready for Tour</span>
                </div>
            </div>

            {/* CAPA 2: VÍDEO CINEMÁTICO (SE DISUELVE SUAVEMENTE SIN CORTE NEGRO) */}
            {phase === 'video' && (
                <div 
                    className="duotone-video-container absolute inset-0 z-20 w-full h-full bg-[#191414] overflow-hidden flex items-center justify-center transition-opacity duration-1000 ease-out"
                    style={{ 
                        opacity: videoOpacity * selectedAlpha,
                        pointerEvents: videoOpacity < 0.1 ? 'none' : 'auto'
                    }}
                >
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        preload="auto"
                        muted={isMuted}
                        onError={() => { setVideoOpacity(0.0); setPhase('portal'); }}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleVideoEnded}
                        src="assets/intro_cinematic.mp4"
                        className="duotone-video duotone-filter w-full h-full object-cover pointer-events-none"
                        style={{ 
                            transform: 'translateZ(0)',
                            filter: 'grayscale(100%) contrast(120%) sepia(100%) hue-rotate(145deg) saturate(200%)'
                        }}
                    />

                    {/* Botón en esquina inferior derecha para saltar si el usuario lo desea */}
                    <div className="absolute bottom-6 right-6 z-50">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSkip(); }}
                            className="px-4 py-2 rounded-full bg-black/75 hover:bg-black/95 border border-white/20 hover:border-cyan-400 text-gray-300 hover:text-white text-xs font-mono font-bold tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center gap-1.5"
                        >
                            <span>Saltar Intro</span>
                            <Icons.ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

