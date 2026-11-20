# -*- coding: utf-8 -*-
"""
Servicio de Conocimiento y Academia DJ para CleanDJmix PRO
Provee cursos estructurados, vídeos/masterclasses formativas,
manuales técnicos oficiales, trucos creativos de cabina y secretos psicoacústicos.
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
    },
    {
        "id": "course_05",
        "title": "Hacks & Trucos Creativos de Cabina: Polirritmias, Wordplay y Echo Freeze",
        "level": "Creativo PRO",
        "level_badge": "⚡ TÉCNICAS CREATIVAS",
        "badge_color": "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40",
        "duration": "1h 50m",
        "lessons_count": 5,
        "instructor": "Álvaro 'Rhythm' D. (Red Bull Music Champion)",
        "image_url": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
        "description": "Rompe la monotonía de mezclar solo intro-outro. Aprende a sincronizar loops en tresillos (3/4 sobre 4/4), enlazar pistas por rima o frase vocal idéntica (Wordplay) y desvanecimientos infinitos con Reverb/Echo Freeze.",
        "modules": [
            {"title": "1. Polirritmias 3/4 sobre 4/4: Tensión rítmica mediante Loop Roll de 3/4 beat", "duration": "25 min"},
            {"title": "2. Transición Wordplay: Cortar en la sílaba exacta y rematar con el drop entrante", "duration": "25 min"},
            {"title": "3. El Echo Freeze infinito: Cómo cambiar de género y saltar 30 BPM sin aviso", "duration": "20 min"},
            {"title": "4. Scratch de llegada (Baby Scratch + Spinback milimétrico)", "duration": "20 min"},
            {"title": "5. Mashup improvisado en 3 decks: Percusión A + Acapella B + Sintetizador C", "duration": "20 min"}
        ]
    },
    {
        "id": "course_06",
        "title": "Secretos Acústicos de Clubes y Psicoacústica para DJs",
        "level": "Acústica & Sound System",
        "level_badge": "🔊 FÍSICA Y PSICOACÚSTICA",
        "badge_color": "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
        "duration": "2h 10m",
        "lessons_count": 5,
        "instructor": "Ing. Carlos Mendoza (Funktion-One System Tech)",
        "image_url": "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&auto=format&fit=crop&q=80",
        "description": "Comprende la física real del sonido en salas legendarias como Berghain, Fabric o Space Ibiza. La ilusión del 'Missing Fundamental', cómo combatir el efecto Haas y el protocolo de los 15 minutos para proteger tus tímpanos.",
        "modules": [
            {"title": "1. El milagro de Berghain: Trampas de graves de 35 Hz y absorción de hormigón", "duration": "25 min"},
            {"title": "2. La Ilusión de la Fundamental Perdida: Sentir el subgrave sin romper los altavoces", "duration": "25 min"},
            {"title": "3. El Efecto Haas en pistas grandes: Por qué el retardo del monitor confunde tu mezcla", "duration": "25 min"},
            {"title": "4. La regla médica de los 15 minutos: Fatiga ciliar y cómo calibrar el Booth Monitor", "duration": "25 min"},
            {"title": "5. Curvas Fletcher-Munson en directo: La trampa de subir agudos conforme avanza la noche", "duration": "30 min"}
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
    },
    {
        "id": "vid_05",
        "title": "Tone Play con Pads y Transiciones por Wordplay",
        "instructor": "Kira Novak & DJ Beatmaster",
        "duration": "19:12",
        "views": "32.1K",
        "category": "Hacks & Creatividad",
        "thumbnail": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        "url": "https://www.youtube.com/results?search_query=dj+tone+play+tutorial+performance+cue+pads",
        "tags": ["Tone Play", "Wordplay", "Hot Cues", "Live Remix"]
    },
    {
        "id": "vid_06",
        "title": "Secretos Acústicos de Berghain: Absorción de 35Hz en Paredes de Hormigón",
        "instructor": "Funktion-One System Techs",
        "duration": "27:40",
        "views": "45.8K",
        "category": "Acústica de Club",
        "thumbnail": "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&auto=format&fit=crop&q=80",
        "url": "https://www.youtube.com/results?search_query=berghain+sound+system+funktion+one+acoustics",
        "tags": ["Berghain", "Funktion-One", "35Hz", "Sound System"]
    },
    {
        "id": "vid_07",
        "title": "La Ilusión de la Fundamental Perdida (Missing Fundamental) en Subwoofers",
        "instructor": "Audio Engineering Society Lab",
        "duration": "14:55",
        "views": "21.0K",
        "category": "Psicoacústica",
        "thumbnail": "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80",
        "url": "https://www.youtube.com/results?search_query=missing+fundamental+psychoacoustics+bass",
        "tags": ["Armónicos", "Psicoacústica", "Bajos", "Subwoofer"]
    },
    {
        "id": "vid_08",
        "title": "La Regla Médica de los 15 Minutos para el Oído del DJ",
        "instructor": "Dr. Audiología Clínica & Club DJs",
        "duration": "12:10",
        "views": "17.6K",
        "category": "Salud Auditiva",
        "thumbnail": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
        "url": "https://www.youtube.com/results?search_query=dj+hearing+protection+tinnitus+prevention",
        "tags": ["Salud DJ", "Booth Monitor", "Fatiga Ciliar", "Filtros Planos"]
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
    },
    {
        "id": "man_05",
        "title": "Biblia de Hacks & Trucos Creativos de Cabina",
        "badge": "COMPENDIO CREATIVO",
        "badge_color": "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40",
        "format": "GUÍA AVANZADA",
        "pages": "12 Fichas",
        "size": "Interactivo",
        "description": "Guía táctica con diagramas de ejecución paso a paso: Tone Play con escalas pentatónicas, cortes al vuelo de 1/2 compás, polirritmias de 3/4 sobre bases de 4/4 y transiciones de género con Reverb Freeze.",
        "download_url": "#creative-hacks",
        "filename": "DJ_Creative_Hacks_Guide.pdf"
    },
    {
        "id": "man_06",
        "title": "Manual de Acústica de Club y Psicoacústica de Cabina",
        "badge": "INGENIERÍA ACÚSTICA",
        "badge_color": "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
        "format": "MANUAL TÉCNICO",
        "pages": "16 Páginas",
        "size": "1.4 MB",
        "description": "Comprende por qué el sonido que oyes en tus auriculares es radicalmente distinto al del club: modos propios de sala, cancelación en 80-120Hz por rebote de cabina, y calibración de booth monitor.",
        "download_url": "#club-acoustics",
        "filename": "Club_Acoustics_and_Psychoacoustics.pdf"
    }
]

DJ_TRICKS_AND_CURIOSITIES = [
    {
        "id": "trick_01",
        "title": "Tone Play Melódico con Pads Camelot",
        "category": "Técnica Creativa",
        "badge": "PAD PERFORMANCE",
        "badge_color": "bg-purple-500/20 text-purple-300 border-purple-500/40",
        "icon": "🎹",
        "summary": "Recrea la melodía de una pista entrante usando notas vocales o de sintetizador mapeadas en 4 Hot Cues afinados según la escala de la Rueda Camelot.",
        "step_by_step": [
            "1. Localiza un sonido aislado de una nota musical clara en el track (vocal o sinte).",
            "2. Coloca Cue 1 en la tónica, Cue 2 en la 3ª menor (+3 semitonos), Cue 3 en la 5ª justa (+7 semitonos) y Cue 4 en la octava (+12).",
            "3. Durante el breakdown del track en reproducción, ejecuta el arpegio rítmico antes del drop.",
            "4. Suelta el track entrante en el primer downbeat con impacto armónico total."
        ],
        "pro_tip": "En CleanDJmix PRO puedes etiquetar cada Hot Cue con el nombre de la nota para no dudar en directo."
    },
    {
        "id": "trick_02",
        "title": "Polirritmia 3/4 sobre 4/4 (Tensión Rítmica)",
        "category": "Rítmica Avanzada",
        "badge": "HACK MÉTRICO",
        "badge_color": "bg-amber-500/20 text-amber-300 border-amber-500/40",
        "icon": "🥁",
        "summary": "Crea una sensación de aceleración y desorientación controlada en la pista activando un Loop Roll de 3/4 de tiempo sobre una base 4/4 de House o Techno.",
        "step_by_step": [
            "1. En el compás 28 de una frase de 32 compases (justo antes del drop), activa un Loop de 3/4 beat.",
            "2. El acento rítmico rotará en cada compás (1, 4, 3, 2), generando una polirritmia hipnótica.",
            "3. En el compás 32.4 (último pulso antes del drop), apaga el loop y suelta el filtro High Pass.",
            "4. La resolución rítmica en el beat 1.0.0 producirá una explosión de energía inigualable."
        ],
        "pro_tip": "Combínalo con un High Pass Filter al 30% para que los bombos no se emborronen mutuamente."
    },
    {
        "id": "trick_03",
        "title": "Transición por 'Wordplay' (Juego de Palabras)",
        "category": "Transición Viral",
        "badge": "TRANSICIÓN HIPNÓTICA",
        "badge_color": "bg-rose-500/20 text-rose-300 border-rose-500/40",
        "icon": "🎤",
        "summary": "Enlaza dos canciones que comparten una misma palabra clave en sus vocales (ej. 'Tonight', 'Music', 'Drop', 'Love') cortando la pista saliente en la sílaba exacta.",
        "step_by_step": [
            "1. Marca un Hot Cue milimétrico en la primera consonante de la palabra compartida en el Track B.",
            "2. Espera a que la vocal del Track A pronuncie la misma palabra.",
            "3. En el instante de la palabra, pulsa el Cue de la pista B y corta el canal de la pista A con el Crossfader.",
            "4. La mente del público percibe una continuidad lírica mágica sin notar el cambio de base."
        ],
        "pro_tip": "Usa la búsqueda de CleanDJmix PRO para filtrar por comentarios de letras o tags vocales."
    },
    {
        "id": "trick_04",
        "title": "Echo Freeze & Salto de Tempo Extremo",
        "category": "Rescate en Cabina",
        "badge": "SALVAPANTALLAS DJ",
        "badge_color": "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        "icon": "❄️",
        "summary": "Cómo pasar de 125 BPM (House) a 140 BPM (Techno/Trance) o viceversa de manera elegante sin desentonar ni forzar el pitch.",
        "step_by_step": [
            "1. En el último golpe de compás de la pista A, activa un Delay/Echo fijado a 3/4 de compás con Feedback al 85%.",
            "2. Detén inmediatamente el motor del plato (Stop o Brake suave). El eco quedará suspendido en el espacio sonoro del club.",
            "3. Sube el fader del Deck B (a 140 BPM) en un compás vacío o intro atmosférica.",
            "4. El público aceptará el nuevo tempo como un cambio de escena cinematográfico."
        ],
        "pro_tip": "Nunca hagas un cambio brusco de tempo sin crear antes un vacío de bombos (Breakdown)."
    },
    {
        "id": "trick_05",
        "title": "El Secreto de Berghain: Trampas de 35 Hz",
        "category": "Acústica de Club",
        "badge": "SECRETO DE INGENIERÍA",
        "badge_color": "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
        "icon": "🏛️",
        "summary": "¿Por qué el sonido en la sala principal de Berghain pega en el pecho sin aturdir los oídos? El secreto reside en la absorción resonante de subgraves.",
        "step_by_step": [
            "1. La sala cuenta con muros de hormigón de 80 cm de espesor y un techo de 18 metros de altura.",
            "2. Para evitar que las frecuencias de 30-50 Hz creen ondas estacionarias ensordecedoras, los ingenieros de Funktion-One instalaron resonadores Helmholtz de cavidad profunda.",
            "3. Esto absorbe el rebote descontrolado y permite bombos con ataque ultrarrápido sin colapso de fase.",
            "4. Lección para DJs: en cabina, una sala sin tratamiento 'engaña' tus oídos haciéndote creer que falta bajo cuando en realidad sobra."
        ],
        "pro_tip": "Si notas que el bajo en cabina suena hueco, ponte auriculares cerrados para evaluar el balance real."
    },
    {
        "id": "trick_06",
        "title": "La Ilusión de la Fundamental Perdida (Missing Fundamental)",
        "category": "Psicoacústica",
        "badge": "ILUSIÓN AUDITIVA",
        "badge_color": "bg-blue-500/20 text-blue-300 border-blue-500/40",
        "icon": "🧠",
        "summary": "El cerebro humano es capaz de reconstruir un tono de bajo de 40 Hz que los altavoces no pueden reproducir físicamente si estos emiten sus armónicos (80 Hz, 120 Hz, 160 Hz).",
        "step_by_step": [
            "1. Los subwoofers pequeños o monitores de cabina sufren para reproducir frecuencias inferiores a 50 Hz.",
            "2. Los productores de élite saturan suavemente el bajo con saturación armónica de 2º y 3º orden.",
            "3. Cuando tu cerebro escucha los armónicos de 100 Hz y 150 Hz, recrea matemáticamente la nota fundamental de 50 Hz.",
            "4. Lección de EQ: no fuerces la perilla de BASS al máximo; potenciar los medios-bajos (150-250 Hz) a menudo suena más contundente."
        ],
        "pro_tip": "En CleanDJmix PRO, el analizador de espectro te muestra si el corte de energía es de fundamental o armónicos."
    },
    {
        "id": "trick_07",
        "title": "La Regla de Oro de los 15 Minutos en Cabina",
        "category": "Salud & Técnica",
        "badge": "PROTECCIÓN AUDITIVA",
        "badge_color": "bg-violet-500/20 text-violet-300 border-violet-500/40",
        "icon": "⏱️",
        "summary": "Los músculos del oído interno se contraen ante niveles altos (>95 dB) como mecanismo de defensa, insensibilizando el oído a los agudos tras solo 15 minutos.",
        "step_by_step": [
            "1. Al comenzar tu set, tus oídos están frescos y ajustas la ecualización equilibrada.",
            "2. A los 15 minutos, la fatiga auditiva reduce tu sensibilidad en 4 kHz - 8 kHz.",
            "3. La trampa habitual del DJ novato es empezar a subir la ganancia (HI) en la mesa para 'escucharlo brillante'.",
            "4. Para el público, la música se vuelve estridente y dolorosa. Solución: mantén la perilla de agudos fija y baja el Booth Monitor un 10% cada 45 minutos."
        ],
        "pro_tip": "Usa tapones con filtro acústico plano de -15dB (como Alpine MusicSafe o Minuendo) para preservar la escucha fidedigna."
    }
]

GLOSSARY_ITEMS = [
    {
        "term": "FFT (Fast Fourier Transform)",
        "category": "DSP & Acústica",
        "tag": "ESPECTRO",
        "color": "#06b6d4",
        "icon": "🔬",
        "definition": "Transformada Rápida de Fourier. Algoritmo matemático que descompone en tiempo real una forma de onda de audio del dominio temporal al espectro de frecuencias (magnitud y fase). Es la base del análisis espectral, la detección precisa de transitorios del bombo y la calibración armónica en BeatWave Pro.",
        "formula": "X[k] = ∑ x[n] · e^(-i 2π k n / N) (N=2048, Hop=512)",
        "impact": "Permite visualizar el espectro 3-band y aislar frecuencias para Beatgrid y tonalidad."
    },
    {
        "term": "Crest Factor (Factor de Cresta)",
        "category": "DSP & Acústica",
        "tag": "DINÁMICA",
        "color": "#f59e0b",
        "icon": "📊",
        "definition": "Relación en decibelios entre la amplitud pico máxima de la señal y su valor medio cuadrático (RMS). Cuantifica el grado de compresión y limitación en el mastering. Un Crest Factor bajo (< 7.5 dB) indica transitorios comprimidos y bombos saturados propios de Hard Techno o Schranz, mientras que valores altos (> 12 dB) reflejan dinámica orgánica.",
        "formula": "CF (dB) = 20 · log10( Peak / RMS )",
        "impact": "Diferencia de inmediato pistas ultracomprimidas de temas con dinámica natural para masterizar la ganancia del mixer."
    },
    {
        "term": "Zero-Crossing Rate (ZCR)",
        "category": "DSP & Acústica",
        "tag": "RUGOSIDAD",
        "color": "#ec4899",
        "icon": "⚡",
        "definition": "Tasa de cruces por cero. Mide la frecuencia con la que la onda de audio atraviesa el eje de amplitud cero por unidad de tiempo. En música electrónica revela el contenido de altas frecuencias, la aspereza de sintetizadores distorsionados y la presencia de componentes ruidosos o percusivos frente a tonos sinusoidales puros.",
        "formula": "ZCR = (1 / 2N) ∑ |sgn(x[n]) - sgn(x[n-1])|",
        "impact": "Identifica texturas industriales, bombos crujientes y saturación analógica en el Drop."
    },
    {
        "term": "Spectral Centroid (Centroide Espectral)",
        "category": "DSP & Acústica",
        "tag": "TIMBRE",
        "color": "#8b5cf6",
        "icon": "🌈",
        "definition": "Centro de gravedad del espectro de frecuencias ponderado por su magnitud. Correlaciona directamente con la percepción psicoacústica de 'brillo' u 'oscuridad' sonora. Un centroide bajo (< 1600 Hz) caracteriza al Raw y Hypnotic Techno; un centroide elevado (> 2600 Hz) define la estridencia de Acid, Industrial o Peak Time.",
        "formula": "fc = ∑ (f · |X(f)|) / ∑ |X(f)|",
        "impact": "Permite emparejar pistas por balance tímbrico para que la mezcla no suene ni opaca ni chillona."
    },
    {
        "term": "Spectral Flatness (Entropía de Wiener)",
        "category": "DSP & Acústica",
        "tag": "RUIDO / TONAL",
        "color": "#10b981",
        "icon": "📐",
        "definition": "Medida del aplanamiento espectral calculada como el cociente entre la media geométrica y la media aritmética del espectro de potencia. Valores cercanos a 0 indican presencia de tonos armónicos puros (sintetizadores de Melodic Techno), mientras que valores cercanos a 1 indican ruido blanco o percusiones metálicas (Hard Groove / Industrial).",
        "formula": "Flatness = exp( (1/N) ∑ ln(|X|^2) ) / ( (1/N) ∑ |X|^2 )",
        "impact": "Separa automáticamente tracks melódicos y armónicos de producciones percusivas y ruidosas."
    },
    {
        "term": "Drop Window MIR (Ventana de Clímax)",
        "category": "DSP & Acústica",
        "tag": "DETECCIÓN",
        "color": "#ef4444",
        "icon": "💥",
        "definition": "Algoritmo de perfilado energético por RMS que analiza la canción en bloques de 4 segundos para localizar la ventana de 12 segundos con máxima presión acústica (Drop 1 o Drop 2). Al omitir intros minimalistas y parones etéreos, la extracción de descriptores se realiza exclusivamente en el clímax sonoro.",
        "formula": "Ventana 12s @ Max RMS Energy Profile",
        "impact": "Evita falsos positivos de género derivados de introducciones desnudas o breakdowns ambientales."
    },
    {
        "term": "Rumble Sub-Bass Ratio (20–60 Hz vs 60–140 Hz)",
        "category": "DSP & Acústica",
        "tag": "SUB-GRAVES",
        "color": "#3b82f6",
        "icon": "🔊",
        "definition": "Cociente entre la energía sub-grave continua (cola de rumble generada con reverb/retraso filtrado) y el golpe seco del bombo (punch). Crucial en el Techno contemporáneo: permite discernir si un track tiene un subgrave rodante masivo (Hard/Raw Techno) o una línea de bajo corta y punteada (Tech House / Melodic).",
        "formula": "Ratio = E(20–60 Hz) / E(60–140 Hz)",
        "impact": "Previene saturación en el sistema de sonido del club al ecualizar los subgraves en la mezcla."
    },
    {
        "term": "Danzabilidad (Danceability)",
        "category": "DSP & Acústica",
        "tag": "PSICO-RITMO",
        "color": "#a855f7",
        "icon": "💃",
        "definition": "Descriptor psicoacústico que evalúa la regularidad rítmica, la estabilidad del pulso 4-on-the-floor, la fuerza de los transitorios percusivos y la consistencia del groove. Puntuación del 0% al 100% que predice la naturalidad con la que el público responde con movimiento corporal continuo en pista.",
        "formula": "Algoritmo Multi-Onsets + Regularidad de Fase",
        "impact": "Garantiza tracks con tracción física irresistible para mantener la pista de baile en movimiento."
    },
    {
        "term": "LUFS Integrado & True Peak",
        "category": "DSP & Acústica",
        "tag": "SONORIDAD",
        "color": "#14b8a6",
        "icon": "📏",
        "definition": "Loudness Units relative to Full Scale según norma internacional EBU R128 e ITU-R BS.1770. Mide el volumen percibido por el oído humano en lugar del pico eléctrico. El True Peak detecta picos inter-muestrales generados tras la conversión analógica, evitando distorsión en etapas de potencia.",
        "formula": "EBU R128 (-14 a -6 LUFS) • True Peak < -0.5 dBTP",
        "impact": "Nivelación matemática de ganancias entre temas para no tocar el trim del mezclador durante la sesión."
    },
    {
        "term": "Dynamic Range (DR / Rango Dinámico)",
        "category": "DSP & Acústica",
        "tag": "DINÁMICA",
        "color": "#f97316",
        "icon": "🎚️",
        "definition": "Diferencia de sonoridad entre los pasajes más enérgicos del track y el promedio RMS general (medición estilo DR Meter). Un rango dinámico adecuado preserva el impacto del kick y evita la fatiga auditiva en el público durante sesiones de más de tres horas.",
        "formula": "DR = Top 20% RMS - Media Acústica (dB)",
        "impact": "Mantiene la pegada física en el pecho sin emborronar las frecuencias medias del sintetizador."
    },
    {
        "term": "Teorema de Nyquist-Shannon",
        "category": "DSP & Acústica",
        "tag": "MUESTREO",
        "color": "#6366f1",
        "icon": "📉",
        "definition": "Ley matemática de procesamiento digital de señales: para muestrear una onda analógica sin distorsión por aliasing, la frecuencia de muestreo (Fs) debe ser estrictamente superior al doble de la componente espectral más alta (Fmax). Por ello, el estándar de audio CD a 44.1 kHz cubre exactamente el límite del oído humano hasta 22.05 kHz.",
        "formula": "Fs ≥ 2 · Fmax • Límite Nyquist = Fs / 2",
        "impact": "Explica por qué un MP3 de 128 kbps con corte a 16 kHz suena apagado frente a un FLAC sin pérdidas a 44.1/48 kHz."
    },
    {
        "term": "Dithering & Ruido TPDF",
        "category": "DSP & Acústica",
        "tag": "CUANTIZACIÓN",
        "color": "#84cc16",
        "icon": "🎲",
        "definition": "Inyección intencional de ruido estocástico no correlacionado con función de densidad triangular (TPDF) al reducir la profundidad de bits (ej. de 24-bit o 32-bit float a 16-bit). Elimina la distorsión armónica no lineal generada por el truncamiento de muestras, transformando el error en un suave siseo uniforme inaudible.",
        "formula": "TPDF Dither: e[n] = (rand1 - rand2) · LSB",
        "impact": "Preserva la reverberación y colas de silencio sin chirridos digitales en los breakdowns de cabina."
    },
    {
        "term": "Cancelación de Fase en Subgraves",
        "category": "DSP & Acústica",
        "tag": "FASE / CLUB",
        "color": "#ef4444",
        "icon": "⚠️",
        "definition": "Interferencia destructiva originada cuando dos pistas reproducen simultáneamente componentes en la banda de 30-100 Hz con desfase cercano a 180°. Las presiones acústicas se anulan físicamente en el aire del club, haciendo desaparecer por completo la pegada del bombo en la pista.",
        "formula": "Δθ = 180° ⇒ y_total = y1 - y2 ≈ 0",
        "impact": "Exige la regla de oro: nunca mezclar dos bombos con sus faders de LOW abiertos a la vez (Bass Swapping)."
    },
    {
        "term": "BPM (Beats Per Minute)",
        "category": "Cabina & Decks",
        "tag": "TEMPO",
        "color": "#06b6d4",
        "icon": "⏱️",
        "definition": "Número de pulsaciones por minuto que determina la velocidad de una pista. En BeatWave Pro se calcula mediante autocorrelación de onsets con resolución centesimal (ej. 128.00 BPM) para un anclaje de Beatgrid perfecto.",
        "formula": "BPM = 60 / Periodo entre Beats (s)",
        "impact": "Alinea transiciones y loops sin que los temas se descompasen con el tiempo."
    },
    {
        "term": "Camelot Wheel",
        "category": "Armonía & Camelot",
        "tag": "ARMONÍA",
        "color": "#ec4899",
        "icon": "🎡",
        "definition": "Sistema visual creado por Mark Davis que mapea las 24 claves musicales a números del 1 al 12 y letras A (menor) y B (mayor) para mezclas armónicas intuitivas sin notas disonantes.",
        "formula": "12 cuadrantes horarios • Claves Menores (A) / Mayores (B)",
        "impact": "Garantiza transiciones melódicas y acordes en armonía pura (+1, -1, modo relativo)."
    },
    {
        "term": "Tone Play",
        "category": "Cabina & Decks",
        "tag": "TÉCNICA",
        "color": "#38bdf8",
        "icon": "🎹",
        "definition": "Técnica de DJing que consiste en reordenar o cambiar el tono de fragmentos sonoros mediante Hot Cues afinados en los 8 pads para interpretar una melodía diferente sobre el compás.",
        "formula": "8 Cues afinados a notas de la escala diatónica",
        "impact": "Permite crear remixes en riguroso directo sin sintetizadores externos."
    },
    {
        "term": "Wordplay Transition",
        "category": "Cabina & Decks",
        "tag": "TRANSICIÓN",
        "color": "#f59e0b",
        "icon": "🗣️",
        "definition": "Técnica de cambio de pista donde la última palabra de la vocal del tema A se conecta con la misma palabra o rima idéntica en el inicio vocal del tema B.",
        "formula": "Corte de fader milimétrico en la última sílaba vocal",
        "impact": "Crea una conexión mental instantánea en el público en cambios de género imprevistos."
    },
    {
        "term": "Downbeat (Beat 1.0.0)",
        "category": "Cabina & Decks",
        "tag": "ESTRUCTURA",
        "color": "#10b981",
        "icon": "🎯",
        "definition": "El primer pulso fuerte de un compás de cuatro tiempos. Marcar el primer Hot Cue en el downbeat exacto garantiza mezclas sin desfase métrico.",
        "formula": "Compás 4/4 • T1 (1.0.0)",
        "impact": "Alineación de fraseo (16/32 compases) en Pioneer Rekordbox, Serato DJ y Traktor."
    },
    {
        "term": "Efecto Haas (Precedencia)",
        "category": "Psicoacústica & IA",
        "tag": "PSICOACÚSTICA",
        "color": "#8b5cf6",
        "icon": "👂",
        "definition": "Fenómeno psicoacústico donde dos sonidos idénticos separados por menos de 35 ms se perciben como uno solo proveniente de la dirección del primer sonido emitido.",
        "formula": "Δt < 35 ms ⇒ Localización dominada por el primer frente de onda",
        "impact": "Explica por qué un monitor de cabina con retardo excesivo confunde el oído del DJ durante la mezcla."
    },
    {
        "term": "Missing Fundamental",
        "category": "Psicoacústica & IA",
        "tag": "ILUSIÓN AUDITIVA",
        "color": "#3b82f6",
        "icon": "🧠",
        "definition": "Ilusión perceptiva mediante la cual el cerebro infiere el tono grave más bajo a partir de una serie coherente de sus armónicos superiores, incluso si el subwoofer no emite la fundamental física.",
        "formula": "f_fundamental = mcd(f_armónico_1, f_armónico_2, ...)",
        "impact": "Permite que los bombos suenen profundos en altavoces compactos saturando medios-bajos."
    },
    {
        "term": "Transcode / Fake FLAC",
        "category": "Metadatos & Suites",
        "tag": "FORENSE",
        "color": "#ef4444",
        "icon": "🕵️",
        "definition": "Archivo con extensión de formato sin pérdidas (como .flac) que en realidad fue generado a partir de una fuente comprimida con pérdidas (MP3). Se detecta por un corte abrupto de frecuencias por debajo de 20 kHz.",
        "formula": "Corte espectral < 20.0 kHz en contenedor Lossless",
        "impact": "BeatWave Pro detecta y alerta al DJ sobre pistas fake antes de pincharlas en festivales."
    },
    {
        "term": "ID3v2.4 UTF-8 & Serato GEOB Tags",
        "category": "Metadatos & Suites",
        "tag": "METADATOS",
        "color": "#0284c7",
        "icon": "💾",
        "definition": "Estructura binaria de metadatos en formato ID3v2.4 UTF-8 con tramas GEOB encapsuladas. Almacenan Beatgrid milimétrico, BPM dinámico, Hot Cues nombrados y colores RGB leídos directamente por Serato DJ Pro y Pioneer CDJ-3000.",
        "formula": "Trama GEOB: 'Serato Markers_V2' + 'BeatWave Pro Cues'",
        "impact": "Carga instantánea de Cues y BPM de alta fidelidad en cualquier reproductor sin reanalizar."
    }
]


class KnowledgeService:
    def obtener_recursos(self):
        return {
            "courses": DJ_COURSES,
            "videos": DJ_VIDEOS,
            "manuals": DJ_MANUALS,
            "tricks": DJ_TRICKS_AND_CURIOSITIES,
            "glossary": GLOSSARY_ITEMS,
            "pdf_manual_available": os.path.exists(MANUAL_PDF_PATH),
            "pdf_manual_path": MANUAL_PDF_PATH
        }


knowledge_service = KnowledgeService()
