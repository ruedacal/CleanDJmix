# -*- coding: utf-8 -*-
"""
Servicio de Conocimiento y Academia DJ para CleanDJmix PRO
Provee cursos estructurados, vídeos/masterclasses formativas,
manuales técnicos oficiales y descarga del Manual en PDF.
"""

import os
import json

MANUAL_PDF_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "CleanDJmix_PRO_Manual_Funcional_y_Tecnico.pdf"
)

DJ_COURSES = [
    {
        "id": "course_01",
        "title": "Fundamentos de Cabina: Estructura de Compases y Beatmatching",
        "level": "Iniciación",
        "level_badge": "🟢 NIVEL 1 • BÁSICO",
        "badge_color": "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        "duration": "1h 45m",
        "lessons_count": 6,
        "instructor": "Victor R. (BeatWave Academy)",
        "image_url": "https://images.unsplash.com/photo-1563841930606-67e2bce48b78?w=800&auto=format&fit=crop&q=80",
        "description": "Aprende a contar la música electrónica en bloques de 4, 8, 16 y 32 compases (phrasing), comprender el primer downbeat y realizar el ajuste de tempo mediante el Pitch Fader sin depender del botón Sync.",
        "modules": [
            {"title": "1. Anatomía de una pista: Intro, Buildup, Drop, Breakdown y Outro", "duration": "15 min"},
            {"title": "2. La regla de los 32 beats: Cuándo lanzar la siguiente pista", "duration": "20 min"},
            {"title": "3. Calibración manual del Pitch Fader (±8% / ±16%)", "duration": "20 min"},
            {"title": "4. Empuje y frenado con el borde del plato vinilo (Nudge)", "duration": "18 min"},
            {"title": "5. Configuración del Cue point principal en el compás 1.0.0", "duration": "16 min"},
            {"title": "6. Práctica de mezcla completa intro-outro a 126 BPM", "duration": "16 min"}
        ]
    },
    {
        "id": "course_02",
        "title": "Mezcla Armónica Avanzada: La Rueda Camelot y Transiciones Energéticas",
        "level": "Intermedio",
        "level_badge": "🟡 NIVEL 2 • INTERMEDIO",
        "badge_color": "bg-amber-500/20 text-amber-300 border-amber-500/40",
        "duration": "2h 15m",
        "lessons_count": 7,
        "instructor": "Marc S. (Harmonic DJ Lab)",
        "image_url": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
        "description": "Domina el sistema Camelot (1A a 12B) para realizar mezclas continuas sin colisiones tonales en bajos y sintetizadores. Técnicas para subir la energía (+1 o +2 números) y modulación emotiva (cambio de A a B).",
        "modules": [
            {"title": "1. ¿Por qué chocan dos pistas aunque estén a compás?", "duration": "15 min"},
            {"title": "2. La Rueda Camelot: Movimiento en círculo, horario y antihorario", "duration": "22 min"},
            {"title": "3. Mezclas de Energía Ascendente (+1 número, ej. 8A a 9A)", "duration": "20 min"},
            {"title": "4. Mezcla de Contraste Mayor/Menor (mismo número, cambio A <-> B)", "duration": "18 min"},
            {"title": "5. El Salto de Tensión (+7 semitonos) para momentos cumbre", "duration": "20 min"},
            {"title": "6. Cómo usar el Buscador IA de CleanDJmix para encontrar compatibilidad", "duration": "20 min"},
            {"title": "7. Caso práctico: Sesión melódica progresiva de 45 minutos", "duration": "20 min"}
        ]
    },
    {
        "id": "course_03",
        "title": "Ecualización Quirúrgica de 3 Bandas: Escultura Sonora y Bass Swapping",
        "level": "Avanzado",
        "level_badge": "🟣 NIVEL 3 • AVANZADO",
        "badge_color": "bg-purple-500/20 text-purple-300 border-purple-500/40",
        "duration": "2h 00m",
        "lessons_count": 5,
        "instructor": "David K. (Club Audio Engineer)",
        "image_url": "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80",
        "description": "El control milimétrico de las frecuencias LOW (250Hz), MID (1kHz) y HI (3.5kHz). Aprende el intercambio de graves sin cancelación de fase y la apertura de espacio en medios para vocales limpias.",
        "modules": [
            {"title": "1. Espectro acústico en cabina: LOW vs MID vs HIGH", "duration": "20 min"},
            {"title": "2. La regla de oro: Nunca dos bombos a plena potencia simultáneamente", "duration": "25 min"},
            {"title": "3. Técnica de Bass Swapping milimétrico en el downbeat", "duration": "30 min"},
            {"title": "4. Atenuación de medios para realzar vocales sin saturación", "duration": "25 min"},
            {"title": "5. Uso del botón FLAT y doble clic de reset en CleanDJmix PRO", "duration": "20 min"}
        ]
    },
    {
        "id": "course_04",
        "title": "Hot Cues Creativos & Tone Play: De la Pista Lineal al Live Remix",
        "level": "Master",
        "level_badge": "🔴 NIVEL 4 • MASTER",
        "badge_color": "bg-rose-500/20 text-rose-300 border-rose-500/40",
        "duration": "2h 30m",
        "lessons_count": 6,
        "instructor": "Kira Novak (Festival Live Performer)",
        "image_url": "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=800&auto=format&fit=crop&q=80",
        "description": "Estrategias profesionales para configurar la matriz de 8 Hot Cues. Reordenación de compases en directo, saltos de fraseo, redobles y ejecución de Tone Play utilizando notas tonales de la pista.",
        "modules": [
            {"title": "1. Mapeo estándar de los 8 Hot Cues: Intro, Drop 1, Vocal, Break, Drop 2, Outro", "duration": "25 min"},
            {"title": "2. Anclaje de Cues al Beatgrid 1.0.0 con Zero-Crossing", "duration": "25 min"},
            {"title": "3. Tone Play: Crear melodías alternativas golpeando los pads", "duration": "30 min"},
            {"title": "4. Saltos de sección para evitar fragmentos largos o aburridos", "duration": "20 min"},
            {"title": "5. Scratching rítmico sobre Hot Cues usando el plato vinilo de 33 RPM", "duration": "30 min"},
            {"title": "6. Exportación de Hot Cues a Serato Markers2 y Rekordbox", "duration": "20 min"}
        ]
    }
]

DJ_VIDEOS = [
    {
        "id": "vid_01",
        "title": "Masterclass: Cómo preparar una biblioteca de 1.000 tracks para club en 30 minutos",
        "instructor": "Victor R. • CleanDJmix PRO Lead",
        "duration": "24:18",
        "views": "14.2K",
        "category": "Preparación de Sets",
        "thumbnail": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
        "url": "https://www.youtube.com/results?search_query=dj+library+preparation+rekordbox+serato",
        "tags": ["Auditoría Lote", "Metadatos", "Serato Crates", "Rekordbox XML"]
    },
    {
        "id": "vid_02",
        "title": "Física de Scratch en Vinilo Direct-Drive y Scrub de Audio Digital",
        "instructor": "DJ Spinmaster • DMC Finalist",
        "duration": "18:45",
        "views": "28.9K",
        "category": "Tornamesa & Scratch",
        "thumbnail": "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=600&auto=format&fit=crop&q=80",
        "url": "https://www.youtube.com/results?search_query=turntable+scratching+techniques+baby+scratch+chirp",
        "tags": ["Scratch", "33 RPM", "Technics 1200", "Latencia Cero"]
    },
    {
        "id": "vid_03",
        "title": "Detección de Fakes y Transcodes en FLAC: Análisis por Espectrograma FFT",
        "instructor": "Dr. Audio DSP • Forensics Lab",
        "duration": "15:30",
        "views": "9.8K",
        "category": "Ingeniería de Audio",
        "thumbnail": "https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=600&auto=format&fit=crop&q=80",
        "url": "https://www.youtube.com/results?search_query=flac+fake+lossless+spectrogram+analysis+audio",
        "tags": ["SuperFLAC", "Cutoff kHz", "True Lossless", "Spotify Ingest"]
    },
    {
        "id": "vid_04",
        "title": "Estrategias de Pitch Fader (±8% vs ±16%): Mezclas a Tempo Elevado",
        "instructor": "Marc S. • Festival Resident",
        "duration": "21:05",
        "views": "19.4K",
        "category": "Técnicas de Mezcla",
        "thumbnail": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
        "url": "https://www.youtube.com/results?search_query=dj+pitch+fader+riding+the+pitch+technique",
        "tags": ["Pitch Fader", "Micro-Nudge", "140 BPM", "Techno"]
    }
]

DJ_MANUALS = [
    {
        "id": "man_01",
        "title": "Manual Funcional y Técnico Ilustrado CleanDJmix PRO (v2.4.0)",
        "badge": "DOCUMENTO OFICIAL PDF",
        "badge_color": "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
        "format": "PDF",
        "pages": "8 Páginas",
        "size": "2.1 MB",
        "description": "El documento técnico definitivo con capturas reales de la aplicación, mapa de código fuente, arquitectura del motor DSP, detección SuperFLAC, física de tornamesa y catálogo completo de endpoints REST.",
        "download_url": "/api/manual/pdf",
        "filename": "CleanDJmix_PRO_Manual_Funcional_y_Tecnico.pdf"
    },
    {
        "id": "man_02",
        "title": "Especificación Técnica Serato GEOB Markers2 & Cues",
        "badge": "GUÍA DE PROTOCOLO",
        "badge_color": "bg-purple-500/20 text-purple-300 border-purple-500/40",
        "format": "DOCUMENTACIÓN",
        "pages": "Referencia Técnica",
        "size": "Web",
        "description": "Estructura de tramas binarias para el frame ID3v2.4 GEOB:Serato Markers2. Empaquetado de los 8 Hot Cues con milisegundos, colores RGB de pad y marcadores de Beatgrid compatibles con Serato DJ Pro.",
        "download_url": "#serato-spec",
        "filename": "Serato_Markers2_Spec.pdf"
    },
    {
        "id": "man_03",
        "title": "Guía de Preparación de USB para Pioneer CDJ-3000 / Rekordbox",
        "badge": "ESTÁNDAR DE CLUB",
        "badge_color": "bg-blue-500/20 text-blue-300 border-blue-500/40",
        "format": "DOCUMENTACIÓN",
        "pages": "Referencia Técnica",
        "size": "Web",
        "description": "Estructura XML de rekordbox.xml (DJMD), jerarquía de crates, colocación de Hot Cues en milisegundos y formato de exportación para unidades flash FAT32 / HFS+ de alta velocidad.",
        "download_url": "#rekordbox-spec",
        "filename": "Rekordbox_XML_CDJ_Export_Guide.pdf"
    },
    {
        "id": "man_04",
        "title": "Carta Rápida de la Rueda Armónica Camelot & OpenKey",
        "badge": "CHEAT SHEET DJ",
        "badge_color": "bg-amber-500/20 text-amber-300 border-amber-500/40",
        "format": "TABLA GRÁFICA",
        "pages": "1 Página",
        "size": "Gráfico",
        "description": "Tabla de referencia rápida para cabina con las 24 tonalidades musicales, su equivalencia en escala mayor/menor, código Camelot (1A-12B), color armónico oficial y reglas de compatibilidad de energía.",
        "download_url": "#camelot-chart",
        "filename": "Camelot_Harmonic_Wheel_Chart.pdf"
    }
]

GLOSSARY_ITEMS = [
    {
        "term": "BPM (Beats Per Minute)",
        "category": "Tempo",
        "definition": "Número de pulsaciones por minuto que determina la velocidad de una pista. En CleanDJmix PRO se calcula con resolución centesimal (ej. 128.00)."
    },
    {
        "term": "Camelot Wheel",
        "category": "Armonía",
        "definition": "Sistema visual creado por Mark Davis que mapea las 24 claves musicales a números del 1 al 12 y letras A (menor) y B (mayor) para mezclas armónicas intuitivas."
    },
    {
        "term": "Downbeat (Beat 1.0.0)",
        "category": "Estructura",
        "definition": "El primer pulso fuerte de un compás de cuatro tiempos. Marcar el primer Hot Cue en el downbeat exacto garantiza mezclas sin desfase métrico."
    },
    {
        "term": "LUFS (Loudness Units Full Scale)",
        "category": "DSP & Master",
        "definition": "Estándar de medición acústica EBU R128 que calcula la sonoridad percibida por el oído humano en lugar de los picos matemáticos aislados."
    },
    {
        "term": "Transcode / Fake FLAC",
        "category": "Forensics",
        "definition": "Archivo con extensión de formato sin pérdidas (como .flac) que en realidad fue generado a partir de una fuente lossy (MP3). Se detecta por un corte abrupto de frecuencias por debajo de 20 kHz."
    },
    {
        "term": "Zero-Crossing (Cruce por Cero)",
        "category": "Edición DSP",
        "definition": "Punto de la señal de audio donde la amplitud es exactamente 0 voltios / 0 dBFS. Cortar o fijar Hot Cues en un cruce por cero evita los clics y chasquidos digitales."
    }
]


class KnowledgeService:
    def obtener_recursos(self):
        return {
            "courses": DJ_COURSES,
            "videos": DJ_VIDEOS,
            "manuals": DJ_MANUALS,
            "glossary": GLOSSARY_ITEMS,
            "pdf_manual_available": os.path.exists(MANUAL_PDF_PATH),
            "pdf_manual_path": MANUAL_PDF_PATH
        }


knowledge_service = KnowledgeService()
