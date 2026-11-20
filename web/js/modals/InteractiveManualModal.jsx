const { useState, useEffect, useRef } = React;
import { Icons } from '../shell/icons.jsx';
import { useDrawerResize } from '../shell/hooks.js';

// =========================================================================
// 📖 MANUAL INTERACTIVO & MASTERCLASS BEATWAVE PRO (8 SECCIONES & DRAWER 60% PLEGABLE)
// =========================================================================

export const MANUAL_SECTIONS = {
    copilot: {
        id: "copilot",
        tabId: "copilot",
        title: "Live Copilot en Cabina",
        badge: "COPILOT",
        color: "#ef4444",
        gradient: "from-red-500 to-rose-600",
        tag: "SERATO LINK & ANTI-MUDDY DSP EN VIVO",
        hook: "Ese momento en el que la pista está en éxtasis... y la mezcla se vuelve una bola de graves ininteligible.",
        story: "Tío, escúchame bien: a todos los DJs nos ha pasado estar en plena sesión en un club o festival con un equipo de 20.000W, meter dos temas que sobre el papel encajaban de lujo... y de repente notar que la música se 'ahoga'. El público no sabe de frecuencias, pero siente que el bombo ya no pega y la gente empieza a pararse. ¿Qué ha ocurrido? Dos bombos de 50 Hz sonando a la vez se cancelan por fase en los graves o saturan el procesador del local. Live Copilot es literalmente tener a tu colega técnico de sonido de gira al lado tuya en la cabina. Se conecta a Serato en tiempo real con cero latencia, analiza lo que tienes en el Deck 1 y lo que estás cargando en el Deck 2, y antes de que abras el fader te avisa en rojo brillante: '¡Ojo, corta el EQ Low del tema saliente!' o '¡Sube 1.8 dB de trim al entrante!'. Vas a cabina con una tranquilidad y una pegada que parece que lleves 20 años pinchando en los mejores festivales del mundo.",
        jargon: [
            { term: "Anti-Muddy DSP", desc: "La zona entre 30Hz y 100Hz es sagrada. Si dos bombos o subbajos suenan a la vez en esa banda, las ondas colisionan y el sonido se convierte en 'barro'. Nuestro algoritmo detecta esa colisión acústica y te indica exactamente qué EQ recortar." },
            { term: "Diferencial LUFS", desc: "Un tema masterizado en 2024 viene comprimido a -6 LUFS, mientras que un clásico de 2005 suena a -10 LUFS. El Copilot calcula el desnivel exacto en decibelios para que ajustes la ganancia (Trim) antes de abrir el fader." },
            { term: "Serato Link Invisible", desc: "Monitoriza los metadatos y la reproducción de Serato directamente desde la memoria del sistema sin cables adicionales ni retraso alguno (0 latencia)." }
        ],
        steps: [
            "1. Abre Live Copilot en modo embebido dentro de BeatWave o como ventana secundaria flotante para tu segundo monitor.",
            "2. Carga dos canciones en Serato o en tu software DJ habitual; verás cómo los vúmetros y roles espectrales se sincronizan al instante.",
            "3. Fíjate en el radar central: si aparece en verde '✨ Mezcla Limpia', abre fader sin miedo; si salta la alerta roja '⚠️ Choque de Subgraves', recorta el ecualizador Low del canal saliente.",
            "4. Ajusta la ganancia siguiendo la recomendación de Trim para que ambos temas entren con el mismo impacto sonoro."
        ],
        proTip: "No te fíes nunca de la ganancia automática de tu software DJ. El oído humano percibe el volumen según la escala LUFS (rango dinámico integrado). Si Copilot te marca '+1.8 dB', sube ese toque de ganancia antes de soltar el drop: el tema nuevo entrará con la misma pegada que el que estaba sonando.",
        controls: [
            { btn: "[ COPILOT ] (Barra Superior / F2)", desc: "Abre o cierra el monitor táctico de cabina Live Copilot en tiempo real.", when: "Siempre activo durante tu sesión en directo." },
            { btn: "[ Serato Link 0-Latencia ]", desc: "Activa la sincronización con el motor de memoria de Serato DJ Pro sin cables.", when: "Al conectar tu controladora o reproductores CDJ." },
            { btn: "[ Radar Anti-Muddy DSP ]", desc: "Monitorea en tiempo real las frecuencias <100Hz para prevenir cancelaciones de fase.", when: "Antes de soltar el drop en una mezcla de dos pistas." },
            { btn: "[ Trim Differential dB ]", desc: "Calcula la diferencia de sonoridad perceptual (LUFS) entre Deck 1 y Deck 2.", when: "Ajusta la ganancia del canal entrante para evitar caídas de volumen." },
            { btn: "[ Espectrograma Dual en Vivo ]", desc: "Radiografía acústica de ambos decks comparando subgraves, medios y agudos.", when: "Para ecualizar con precisión quirúrgica antes del corte." },
            { btn: "[ Ventana Flotante / Popout ]", desc: "Separa el Copilot en una ventana independiente para enviarla a un segundo monitor.", when: "Si tienes un portátil secundario o tablet en cabina." }
        ],
        simulationSteps: [
            { label: "Deck 1 & 2 Activos", desc: "Detección instantánea de pistas en cabina con lectura de BPM, tonalidad y espectro", focus: "decks" },
            { label: "Análisis Anti-Muddy", desc: "El motor DSP compara las frecuencias bajas (<100Hz) en busca de cancelaciones de fase", focus: "dsp" },
            { label: "Alerta Táctica en Rojo", desc: "Aviso en cabina: '⚠️ Choque de Subgraves — Bajar EQ Low Deck 1'", focus: "alert" },
            { label: "Mezcla Optimizada", desc: "Tras ecualizar, el radar pasa a verde '✨ Mezcla Limpia y Contundente'", focus: "clean" }
        ]
    },
    audit: {
        id: "audit",
        tabId: "audit",
        title: "Diagnóstico DSP, Fakes & Calidad",
        badge: "AUDITAR",
        color: "#06b6d4",
        gradient: "from-cyan-500 to-blue-600",
        tag: "ESPECTROGRAMA FFT & RECHAZO DE TRANSCODES FALSOS",
        hook: "¿Seguro que ese archivo que te descargaste como 'FLAC 24-bit Lossless' es de verdad sonido de alta fidelidad?",
        story: "Colega, prepárate para flipar con esto: en internet hay toneladas de música que te venden o regalan como 'WAV Master' o 'FLAC 24-bit 1411 kbps' y resulta que son una estafa total. Alguien cogió un audio comprimido de YouTube a 128 kbps y lo guardó con extensión .flac para engordar el archivo. En tus auriculares del móvil parece que suena bien, pero cuando lo tiras en los altavoces de un club... ¡sorpresa!: agudos metálicos distorsionados, platos que suenan como siseos y un bajo sin definición. Con AUDITAR, pasas tu colección entera en segundos. Nuestro motor ejecuta una Transformada Rápida de Fourier (FFT) matemática directa sobre las frecuencias reales: te dibuja la radiografía del tema y te dice con precisión milimétrica si llega a 22kHz (Lossless Real) o si tiene un corte de tijera a 16kHz (MP3 falso). Con un solo clic puedes purgar y mandar a cuarentena toda la morralla de baja calidad.",
        jargon: [
            { term: "Espectrograma FFT", desc: "Es la radiografía de las frecuencias de la música. En un tema de calidad de estudio las frecuencias llegan limpias hasta los 20.000 - 22.000 Hz. En un MP3 barato mueren en los 16.000 Hz." },
            { term: "Brickwall Cutoff (Corte Muro)", desc: "El algoritmo de compresión MP3 elimina de golpe todo lo que está por encima de un umbral para ahorrar espacio. BeatWave detecta esa línea de corte artificial al instante." },
            { term: "Lossless Certification PASS", desc: "El sello verde que garantiza que el archivo tiene rango dinámico completo y que puedes pincharlo en el escenario más grande del mundo sin miedo a que suene a lata." }
        ],
        steps: [
            "1. Pulsa '📂 Abrir' y selecciona tu carpeta de música (por ejemplo 'mi musica' o tus descargas recientes).",
            "2. Haz clic en '⚡ Auditar Todo' en la barra central; el motor analizará BPM exacto, Tonalidad Camelot, corte FFT y LUFS.",
            "3. Revisa la columna 'Calidad': las pistas verdes son Lossless 100% auténticas; las rojas indican 'Pérdida Severa / Transcode Falso'.",
            "4. Pulsa '🗑️ Purgar Fakes' para borrar las pistas que no cumplen el estándar o llévatelas con un clic a la pestaña POOL para descargarlas en FLAC auténtico."
        ],
        proTip: "Si una canción de tu biblioteca tiene corte por debajo de 16kHz, bórrala sin dudarlo. En un sistema de sonido profesional, pinchar un transcode falso daña la experiencia del público y hace que la cabina suene amateur. Usa el botón de auditar siempre antes de cada fin de semana.",
        controls: [
            { btn: "[ 📂 Abrir / Directorio ]", desc: "Selecciona una carpeta del disco duro para cargar todas sus canciones.", when: "Al iniciar una sesión de preparación musical o tras descargar temas." },
            { btn: "[ ⚡ Auditar Todo ]", desc: "Ejecuta el análisis espectral FFT, cálculo de BPM, Key Camelot y LUFS en lote.", when: "Para procesar tu biblioteca al completo de manera desatendida." },
            { btn: "[ 🏷️ Escribir Tags ID3 ]", desc: "Graba de forma permanente los metadatos analizados (BPM, Key, Rol) en los archivos.", when: "Para que Serato, Rekordbox y Traktor lean los datos automáticamente." },
            { btn: "[ 🗑️ Purgar Fakes ]", desc: "Elimina del disco o mueve a cuarentena los temas que no pasan la prueba de 16kHz.", when: "Para limpiar tu colección de ripeos de mala calidad de YouTube/SoundCloud." },
            { btn: "[ 💎 Reemplazos HD a Pool ]", desc: "Envía pistas defectuosas a la cola de descarga SuperFLAC para bajarlas en alta fidelidad.", when: "Para sustituir MP3 viejos por archivos FLAC de 24 bits auténticos." },
            { btn: "[ 📊 Reporte Excel (.xlsx) ]", desc: "Genera una hoja de cálculo con la radiografía técnica y diagnóstico de cada tema.", when: "Para auditar tu biblioteca o entregar un informe a promotores." },
            { btn: "[ 🔍 Espectrograma FFT ]", desc: "Visualizador interactivo de frecuencias que muestra la pendiente espectral en tiempo real.", when: "Al hacer clic en cualquier pista para verificar su techo de frecuencia." }
        ],
        simulationSteps: [
            { label: "Ingesta & DNA Acústico", desc: "Evaluación de Mood, Energía (88%), Danceability (74%) y Valencia", focus: "dna" },
            { label: "Espectro FFT 24-Bit", desc: "Radiografía acústica de alta resolución con caída natural a 22.05 kHz", focus: "fft" },
            { label: "Detección Fake Cutoff", desc: "Corte brickwall abrupto detectado en 16.0 kHz (Transcode MP3 falso)", focus: "fake" },
            { label: "Purga y Reemplazo", desc: "Un clic para enviar fakes a cuarentena o llevarlos a la cola de reemplazo SuperFLAC", focus: "purge" }
        ]
    },
    hotcues: {
        id: "hotcues",
        tabId: "hotcues",
        title: "Preparación Quirúrgica de Fraseo & Cues",
        badge: "CUES",
        color: "#f59e0b",
        gradient: "from-amber-400 to-orange-500",
        tag: "8 HOT CUES AUTOMÁTICOS & FRASEO DE 32 TIEMPOS",
        hook: "¿Cuánto tiempo de tu vida has perdido poniendo Hot Cues a mano, tema por tema, compás por compás?",
        story: "Piénsalo un segundo: si tienes 300 canciones nuevas para el fin de semana, ponerle 8 cues a cada una escuchando la intro, buscando el drop y ajustando el beatgrid te lleva fácilmente 6 o 7 horas de trabajo monótono. Con el motor de CUES de BeatWave le das a un botón y en segundos tienes colocadas las 8 marcas estándar de cabina en los puntos matemáticos exactos del tema: Cue 1 en el Downbeat de arranque, Cue 2 en la entrada del ritmo, Cue 3 en el Breakdown melódico, Cue 5 en el Build-up y Cue 7 en el Drop principal. Lo mejor es que respeta el fraseo musical de 32 tiempos: cuando estás pinchando en directo, lanzas el Cue 1 del tema entrante en el Cue 5 del saliente y la mezcla cuadra perfecta como un guante sin tocar nada. Te ahorras semanas enteras de trabajo técnico.",
        jargon: [
            { term: "Downbeat (Primer Golpe)", desc: "El golpe número 1 del primer compás de la canción. Es el inicio del ciclo de energía. Si pones el cue en el tiempo 2 o 3, todo el tema irá cojo." },
            { term: "Fraseo Musical (32 Beats)", desc: "La música electrónica se compone en bloques de 32 tiempos (8 compases de 4/4). Los cambios de sonido (entra un bajo, entra un sintetizador, rompe el drop) siempre ocurren en múltiplos de 32." },
            { term: "Codificación de Color Serato/CDJ", desc: "Cada tipo de cue tiene su color estándar de la industria (Verde para intros, Naranja para breakdowns, Rojo para drops de máxima energía)." }
        ],
        steps: [
            "1. Entra en CUES o pulsa el botón '8 Cues' en la barra de cualquier pista auditada.",
            "2. Selecciona tu perfil de mapeo: 'Club Mainstage' (enfocado a drops explosivos) o 'Extended Journey' (enfocado a transiciones largas).",
            "3. Haz clic en '⚡ Generar 8 Hot Cues Inteligentes'.",
            "4. Observa cómo se colocan las 8 banderas sobre la forma de onda; puedes ajustar milimétricamente cualquier punto o exportarlos directamente a Serato y Rekordbox."
        ],
        proTip: "Usa el Cue 3 (Breakdown) como tu punto de salvación en directo: si estás en cabina y ves que te estás quedando sin tiempo en el tema saliente, salta directamente al Cue 3 del tema nuevo; como entra sin bombos agresivos, la transición quedará superlimpia y tendrás 32 tiempos de relax para preparar la siguiente mezcla.",
        controls: [
            { btn: "[ ⚡ Generar 8 Hot Cues ]", desc: "Calcula matemáticamente las 8 marcas oficiales de cabina respetando el fraseo musical.", when: "Para preparar pistas nuevas en cuestión de segundos sin hacerlo a mano." },
            { btn: "[ 🎯 Selector de Perfil ]", desc: "Alterna entre 'Club Mainstage' (drops rápidos) y 'Extended Journey' (transiciones progresivas).", when: "Según el estilo de música (Techno/EDM vs Deep/House progresivo)." },
            { btn: "[ 🎚️ Waveform Scrubbing ]", desc: "Permite desplazarte por la forma de onda milisegundo a milisegundo con lupa de aumento.", when: "Para ajustar manualmente la posición exacta de un golpe o vocal." },
            { btn: "[ 🎨 Codificación de Color CDJ ]", desc: "Aplica los colores oficiales de Pioneer y Serato (Verde=Intro, Naranja=Breakdown, Rojo=Drop).", when: "Para que en la pantalla de la CDJ identifiques la sección al instante." },
            { btn: "[ 💾 Inyectar en Metadatos ]", desc: "Escribe las 8 marcas de Hot Cues directamente en la base de datos de Serato y Rekordbox.", when: "Antes de exportar tus canciones al pendrive USB de cabina." },
            { btn: "[ 🔄 Resetear Cues ]", desc: "Borra todas las marcas para volver a calcular desde cero o redefinir puntos.", when: "Si deseas reestructurar una canción con otro perfil de fraseo." }
        ],
        simulationSteps: [
            { label: "Fraseo de 32 Tiempos", desc: "Detección matemática de bloques de 8 compases (32 / 64 beats) y Downbeats", focus: "phrasing" },
            { label: "Mapeo Transitorios & Cues", desc: "Colocación de marcas tácticas en Intro, Breakdown, Vocal y Drop", focus: "cues" },
            { label: "8 Pads Iluminados RGB", desc: "Respuesta física retroiluminada según estándar Pioneer CDJ y Serato", focus: "pads" },
            { label: "Exportación Directa", desc: "Inyección permanente en metadatos ID3 y bases de datos de cabina", focus: "export" }
        ]
    },
    setbuilder: {
        id: "setbuilder",
        tabId: "setbuilder",
        title: "Set Builder, Graph Playlists & Asesor AI",
        badge: "SETS",
        color: "#a855f7",
        gradient: "from-purple-500 to-indigo-600",
        tag: "DJOID DAG GRAPH & ASESOR GOOGLE GEMINI 2.5 FLASH",
        hook: "Una sesión de DJ nunca es una línea recta. ¿Por qué tus playlists siguen siéndolo?",
        story: "Hermano, preparar un set ordenando canciones de arriba a abajo es cosa del pasado. En una cabina real la pista está viva: a veces tienes que subir el tempo porque el público está eufórico, y a veces tienes que desviar la sesión hacia un rollo más deep. Inspirado en las revolucionarias Graph Playlists de DJOID, nuestro Set Builder convierte tu sesión en un mapa no lineal (grafo DAG). En cada paso, BeatWave analiza tu biblioteca y te despliega ramas alternativas compatibles armónicamente. Y cuando tengas el borrador de tu set, pulsas 'Auditar con Gemini AI': el motor de inteligencia artificial con Google Gemini 2.5 Flash y DSP acústico evalúa la progresión de tu sesión, te da una nota del 0 al 100, detecta si vas a tener choques tonales y te propone 'pistas puente' de tu propio disco para salvar transiciones imposibles. Te hace sonar como si hubieras ensayado la sesión durante meses.",
        jargon: [
            { term: "Grafo Dirigido Acíclico (DAG)", desc: "Una red visual de nodos donde cada canción tiene un camino principal y ramas alternativas para bifurcar tu sesión en vivo si la pista reacciona de forma diferente." },
            { term: "Pistas Puente (Harmonic Bridges)", desc: "Si quieres pasar de una pista 8A a una 3A (que chocarían como dos trenes), el motor busca en tu colección un tema intermedio que module la tonalidad de forma elegante y natural." },
            { term: "Curva de Progresión de BPM", desc: "El lienzo visual que dibuja la pendiente de tempo y energía de tu set para asegurar que la sesión va 'in crescendo' y no pega bajones involuntarios." }
        ],
        steps: [
            "1. Pulsa '🕸️ GENERAR FLUJO DE SESIÓN' para convertir cualquier conjunto de pistas en un grafo DAG no lineal.",
            "2. Usa '📁 Añadir Carpeta' para cargar un lote completo de música de un solo golpe.",
            "3. Explora las ramas alternativas con el botón '⇄ Sustituir' o '+ Puente' para salvar saltos tonales.",
            "4. Pulsa '🤖 Asesor AI & Calidad' para que Google Gemini 2.5 Flash califique tu set del 0 al 100% y exporta a M3U8 para tu software DJ."
        ],
        proTip: "Presta especial atención al Score Armónico global. Un set con una puntuación superior al 85% crea un efecto hipnótico en el público: la gente no puede parar de bailar porque las melodías y notas de los temas parecen pertenecer a una misma obra sinfónica continua.",
        controls: [
            { btn: "[ 🕸️ GENERAR FLUJO DE SESIÓN ]", desc: "¡El botón estrella estilo DJOID! Construye el mapa interactivo en grafo DAG con alternativas y compatibilidad armónica.", when: "Al planificar tu sesión para tener alternativas listas según la reacción de la pista." },
            { btn: "[ 📁 Añadir Carpeta ]", desc: "Permite seleccionar un directorio completo e inyectar todas sus canciones en el set en 1 clic.", when: "Para preparar sets rápidos a partir de carpetas de música recién adquirida." },
            { btn: "[ ⚡ Auto-Optimizar Pro ]", desc: "Reorganiza las pistas matemáticamente para maximizar el flujo armónico Camelot y suavizar saltos de BPM.", when: "Cuando tienes muchas pistas sueltas y quieres un orden perfecto automático." },
            { btn: "[ 🤖 Asesor AI & Calidad ]", desc: "Auditoría inteligente con Google Gemini 2.5 Flash y DSP acústico. Genera una nota del 0 al 100%.", when: "Antes de dar por cerrado un set para asegurarte de que no hay choques tonales." },
            { btn: "[ 🌉 Inyectar Pista Puente ]", desc: "Busca en tu colección canciones intermedias que sirvan de puente armónico entre dos tonos disonantes.", when: "Para pasar suavemente de una tonalidad lejana a otra sin corte abrupto." },
            { btn: "[ 💾 Exportar (.M3U8) ]", desc: "Genera el archivo M3U8 compatible con Rekordbox, Serato, Traktor y VirtualDJ.", when: "Para llevar la lista directamente al pendrive o a tu software de directo." },
            { btn: "[ 📈 Lienzo de Curva de BPM ]", desc: "Visualizador SVG interactivo con nodos clickeables para preescuchar cada punto del set.", when: "Para comprobar visualmente que la energía va en crescendo y no hay baches." }
        ],
        simulationSteps: [
            { label: "Curva Bézier de Energía", desc: "Progresión armónica continua con información técnica por pista", focus: "curve" },
            { label: "Bifurcaciones DAG DJOID", desc: "Caminos alternativos de sesión desplegados para improvisar en directo", focus: "dag" },
            { label: "Auditoría Gemini AI", desc: "Google Gemini 2.5 Flash evalúa flujo y score armónico del set (0-100%)", focus: "ai" },
            { label: "Puentes Automáticos", desc: "Inserción con 1 clic de canciones intermedias para resolver choques tonales", focus: "bridges" }
        ]
    },
    map: {
        id: "map",
        tabId: "map",
        title: "Scatter Map 2D & Rueda de Camelot",
        badge: "MAP",
        color: "#14b8a6",
        gradient: "from-teal-400 to-cyan-500",
        tag: "PAISAJE ESPACIAL 2D & HARDWARE FADER ZOOM",
        hook: "¿Alguna vez has tenido miles de temas en el disco duro y la sensación de que siempre acabas poniendo los mismos?",
        story: "Mirar carpetas con listas interminables de texto apaga tu creatividad. El Scatter Map 2D transforma tu biblioteca en un universo espacial interactivo donde la distancia física equivale a compatibilidad acústica: los temas que están cerca en la pantalla mezclan de forma natural y orgánica. Tienes una Rueda de Camelot circular al 60% de transparencia con carátulas de alta definición dentro de cada nodo, controles tipo mesa de mezclas con cruceta analógica para desplazarte de forma continua, y un Fader de Zoom de tacto analógico. Puedes agarrar la herramienta Lasso (lápiz), rodear un racimo de 8 temas que te gusten cómo vibran juntos y mandarlos directamente a tu sesión. Es la forma más visual, divertida y rápida de redescubrir joyas ocultas en tu propia música.",
        jargon: [
            { term: "Rueda de Camelot (1A - 12A / 1B - 12B)", desc: "El mapa definitivo de mezcla armónica. Las 'A' son escalas menores (oscuras, introspectivas), las 'B' son mayores (luminosas, eufóricas). Los números adyacentes (8 a 9, 8 a 7) combinan sin disonancia armónica." },
            { term: "Herramienta Lasso / Spatial Collect", desc: "Te permite dibujar libremente un círculo sobre la pantalla para capturar todas las pistas de un área de energía específica y exportarlas en bloque." },
            { term: "Proyección Multi-Dimensional", desc: "Algoritmo que sitúa en el eje X la energía y en el eje Y la bailabilidad, o proyecta los temas radialmente según su tonalidad." }
        ],
        steps: [
            "1. Entra en MAP; verás todas tus canciones flotando como orbes en un lienzo espacial oscuro.",
            "2. Usa el selector superior para cambiar la proyección: '⚡ Energía / Dance', '🥁 BPM / Energía' o '☸ Rueda Camelot'.",
            "3. Haz clic en cualquier tema: se iluminará su tonalidad exacta en la Rueda de Camelot superior y verás encenderse en verde sus vecinas compatibles.",
            "4. Dale a '▶ Escuchar Preview' para preescucharla, o usa la cruceta y el fader de zoom de la derecha para explorar el mapa con total fluidez."
        ],
        proTip: "Usa la herramienta Lasso en la esquina superior derecha del mapa (zona Peak Time: alta energía y alta bailabilidad) para armar en 30 segundos la hora dorada de tu set del sábado por la noche.",
        controls: [
            { btn: "[ 🎡 Rueda Camelot 60% Alpha ]", desc: "Visualizador armónico circular con transparencias en la esquina superior izquierda. Resalta la clave de la pista y sus adyacentes.", when: "Para ver qué temas son armónicamente compatibles (+1, -1, cambios de modo A/B)." },
            { btn: "[ 🧭 Cruceta D-Pad de 4 Flechas ]", desc: "Controles analógicos de navegación fluida continua para desplazarte suavemente por el cosmos sonoro.", when: "Para explorar galaxias acústicas de tu biblioteca sin usar el ratón." },
            { btn: "[ 🎚️ Fader Zoom Hardware ]", desc: "Deslizador de zoom continuo inspirado en los faders de pitch de los platos Technics y CDJs.", when: "Para acercarte a un racimo denso de temas o alejarte para ver la biblioteca completa." },
            { btn: "[ ✏️ Herramienta Lasso ]", desc: "Dibuja un lazo a mano alzada para capturar un área de temas afines y mandarlos al Set.", when: "Para recolectar en bloque 5 a 10 canciones que vibran en la misma frecuencia." },
            { btn: "[ ⬚ Herramienta Caja ]", desc: "Selección rectangular rápida de pistas por zona de coordenadas acústicas.", when: "Para capturar rangos específicos de tempo o energía en bloque." },
            { btn: "[ 🎛️ Modos de Proyección ]", desc: "Alterna entre '⚡ Energía / Dance', '🥁 BPM / Energía' y '☸ Rueda Camelot'.", when: "Para analizar tu música desde diferentes perspectivas acústicas." },
            { btn: "[ ▶ Escuchar Preview (0.8ms) ]", desc: "Reproductor de pre-escucha ultraveloz con audio precargado en memoria.", when: "Para escuchar fragmentos clave de las pistas sin cortes ni esperas." }
        ],
        simulationSteps: [
            { label: "Universo Espacial 2D", desc: "Pistas proyectadas en 2D donde cercanía representa afinidad acústica", focus: "constellation" },
            { label: "Zoom a Pista & Mini-Map", desc: "Ampliación de pista enfocada con ficha técnica y radar de contexto", focus: "zoom" },
            { label: "Rueda Camelot 60%", desc: "Sectores tonales iluminados con compatibilidad armónica adyacente (+1, -1, Modo)", focus: "camelot" },
            { label: "Selección Lasso Táctica", desc: "Captura de racimos de temas afines con dibujo libre y envío directo a Set", focus: "lasso" }
        ]
    },
    spotify: {
        id: "spotify",
        tabId: "spotify",
        title: "SuperFLAC Lossless Ingest & Pool",
        badge: "POOL",
        color: "#10b981",
        gradient: "from-emerald-400 to-teal-500",
        tag: "DESCARGA CERTIFICADA 24-BIT & REPRODUCTOR A/B",
        hook: "¿Tienes listas de reproducción con temazos brutales pero no puedes pincharlos con calidad profesional en cabina?",
        story: "Todos los DJs descubrimos música en plataformas de streaming, en la radio o en listas de amigos, pero pinchar desde streaming en un club es jugársela a cortes de internet, sin contar con que los ripeos de baja calidad suenan desastrosos. El módulo POOL resuelve esto para siempre: pegas el enlace de cualquier canción, álbum o lista (o buscas por texto), y nuestro motor SuperFLAC localiza el máster original en catálogo audiófilo y lo descarga en FLAC Lossless auténtico de 24 o 16 bits. Inmediatamente al descargarse, el motor le pasa una auditoría FFT automática para certificar que el archivo tiene frecuencias intactas hasta los 22kHz, y te ofrece un Reproductor A/B de Pre-escucha Dual para que compares tu tema local viejo con la nueva descarga en alta resolución antes de reemplazarlo.",
        jargon: [
            { term: "FLAC Hi-Res 24-Bit Master", desc: "Formato de compresión sin pérdida (Lossless) con una profundidad de 24 bits y rango dinámico de 144 dB, idéntico al master original de estudio." },
            { term: "Pre-escucha Dual A/B", desc: "Dos botones de reproducción simultáneos que te permiten alternar en tiempo real entre la versión que ya tenías en tu disco y la nueva versión descargada para verificar que es la versión extendida correcta." },
            { term: "Inyección de Metadatos ID3v2.4", desc: "Escribe automáticamente la carátula oficial en 1400x1400px, el nombre correcto del artista, el álbum, año y el género oficial en las etiquetas del archivo." }
        ],
        steps: [
            "1. Pega un enlace de canción, lista o álbum en la barra de búsqueda (o escribe artista y título) y pulsa 'Buscar / Analizar'.",
            "2. Selecciona tu formato deseado: 'FLAC Hi-Res (24b Master)' o 'FLAC Lossless'.",
            "3. Haz clic en '⬇️ Descargar' y observa la barra de progreso en streaming.",
            "4. Al completarse, la pista se audita automáticamente por FFT y queda guardada con carátula HD en tu carpeta de música de cabina."
        ],
        proTip: "Si en la auditoría tienes canciones marcadas en rojo como 'Mala Calidad', usa el botón 'Llevar Reemplazos HD a Pool'. Te las importará en bloque para que las sustituyas por copias Lossless impecables sin tener que buscarlas una por una.",
        controls: [
            { btn: "[ 🔍 Buscar / Analizar ]", desc: "Resuelve metadatos de enlaces de audio (canción, álbum, lista) o búsquedas de texto directo.", when: "Para encontrar cualquier tema que quieras incorporar a tu maleta." },
            { btn: "[ ⬇️ Descargar (Lote) ]", desc: "Inicia la descarga paralela multihilo del máster original de estudio en alta resolución.", when: "Para descargar temas individuales o listas completas de 50 temas a la vez." },
            { btn: "[ 🎛️ Formato: FLAC 24b / 16b / MP3 ]", desc: "Selector de códec y tasa de bits para la descarga (FLAC Hi-Res, WAV, AIFF, MP3 320k).", when: "Elige FLAC Hi-Res para directos y MP3 320k para ahorrar espacio." },
            { btn: "[ 🎧 Pre-escucha Dual A/B ]", desc: "Alterna en tiempo real entre la versión que ya tenías en local y la nueva descarga.", when: "Para certificar que la descarga es la versión Club Extended correcta." },
            { btn: "[ ⚡ Certificación FFT en Vuelo ]", desc: "Comprobación matemática inmediata del techo de frecuencias tras finalizar la descarga.", when: "Garantiza que ningún archivo descargado sea un transcode falso." },
            { btn: "[ 📁 Cambiar Carpeta Destino ]", desc: "Configura el directorio local donde se guardan tus canciones descargadas.", when: "Para dirigir la música a tu disco duro externo o carpeta de Serato/Rekordbox." }
        ],
        simulationSteps: [
            { label: "Resolución de Catálogo", desc: "Extracción de ISRC y localización de máster original de estudio en alta resolución", focus: "search" },
            { label: "Pipeline SuperFLAC", desc: "Descarga multihilo en FLAC 24-bit / 48kHz (2.304 kbps) con token dinámico", focus: "download" },
            { label: "Comparativa Dual A/B", desc: "Pre-escucha en vivo alternando entre la copia local antigua y el nuevo máster", focus: "ab" },
            { label: "Certificación FFT en Vuelo", desc: "Comprobación matemática espectral garantizando 100% fidelidad Lossless", focus: "cert" }
        ]
    },
    radar: {
        id: "radar",
        tabId: "radar",
        title: "Radar Acústico & Tendencias Globales",
        badge: "RADAR",
        color: "#6366f1",
        gradient: "from-indigo-500 to-purple-600",
        tag: "TRACKLIST SCANNER & MICRO-GÉNEROS EMERGENTES",
        hook: "Los DJs corrientes pinchan lo que ya es famoso. Los headliners pinchan lo que va a ser famoso dentro de tres meses.",
        story: "El público de club tiene un sexto sentido: cuando un tema se ha puesto mil veces en TikTok o en la radio, pierde frescura. La magia de ser DJ reside en la curaduría, en esa sensación de poner un track desconocido y que toda la pista levante los brazos preguntándose: '¿Qué temazo es este?'. El Radar Acústico de BeatWave es tu antena parabólica hacia el futuro de la electrónica. Escanea tendencias de festivales como Tomorrowland, Sonar y Creamfields, monitoriza charts de 1001Tracklists y detecta micro-géneros emergentes antes de que tengan nombre oficial. Te da recomendaciones precisas basadas en los estilos de tu biblioteca para que tu maleta de temas sea siempre única e insustituible.",
        jargon: [
            { term: "Índice de Velocidad de Tendencia", desc: "Mide el crecimiento porcentual de inclusiones de una canción en sets de DJs internacionales durante los últimos 14 días." },
            { term: "Micro-géneros Acústicos", desc: "Clasificaciones de nicho (como Afro-Melodic, Acid Trance Revival o Raw Peak-Time) que definen la vibra exacta de una sesión mejor que etiquetas genéricas como 'House' o 'Techno'." },
            { term: "Previsión de Éxito de Pista", desc: "Puntuación calculada según la energía rítmica y la acogida en cabinas profesionales para predecir si un tema funcionará como bombazo de pista." }
        ],
        steps: [
            "1. Entra en RADAR y observa el escaneo radial de géneros activos en festivales y clubes.",
            "2. Explora las tarjetas de tendencias por estilo (Melodic, Tech House, Afro, Peak Time).",
            "3. Escucha la pre-escucha rápida de los temas en ascenso que encajan con los BPMs de tu biblioteca.",
            "4. Añade los descubrimientos a tu cola de descargas de POOL o directamente a tu Set Builder con un solo clic."
        ],
        proTip: "Dedica 15 minutos cada jueves a mirar el Radar. Descubrir dos o tres temas exclusivos antes del fin de semana es la diferencia entre ser un DJ más del cartel o ser el que se lleva las felicitaciones del promotor y del público al terminar la noche.",
        controls: [
            { btn: "[ 🎙️ Escuchar con Micrófono ]", desc: "Reconocimiento acústico en tiempo real por huella sonora de lo que suena en la sala o altavoces.", when: "Cuando estás en un club o viendo un streaming y quieres identificar el track al vuelo." },
            { btn: "[ 📡 Escáner 1001Tracklists ]", desc: "Monitoriza sesiones de DJs headliners en festivales mundiales (Tomorrowland, Ultra, Awakenings).", when: "Para ver qué IDs y temas inéditos están pinchando los mejores del mundo." },
            { btn: "[ 📈 Velocidad de Tendencia ]", desc: "Métrica que indica si un tema está creciendo exponencialmente en las pistas de baile.", when: "Para comprar y pinchar canciones antes de que se vuelvan virales comerciales." },
            { btn: "[ 🧩 Filtro por Micro-Géneros ]", desc: "Segmenta las tendencias por corrientes emergentes (Afro-Melodic, Hard Groove, Indie Dance).", when: "Para encontrar música que encaje al 100% con tu estilo de cabina." },
            { btn: "[ ➕ Añadir a POOL / SET ]", desc: "Envía los temas identificados directamente a tu cola de descarga FLAC o a tu Set Builder.", when: "Para incorporar descubrimientos sin perder tiempo buscándolos manualmente." }
        ],
        simulationSteps: [
            { label: "Escaneo Global", desc: "Monitorización de sesiones en festivales internacionales y charts especializados", focus: "scan" },
            { label: "Mapeo de Micro-Géneros", desc: "Detección de corrientes emergentes antes de su difusión comercial masiva", focus: "genres" },
            { label: "Afinidad con tu Maleta", desc: "Filtrado automático de canciones que combinan con tu rango de BPM habitual", focus: "match" },
            { label: "1-Click Curation", desc: "Envío directo de pistas a la cola de descargas o al Set Builder", focus: "curate" }
        ]
    },
    crates: {
        id: "crates",
        tabId: "taxonomy",
        title: "Taxonomía & Pasaporte Universal DJ",
        badge: "CRATES",
        color: "#f97316",
        gradient: "from-orange-500 to-amber-600",
        tag: "PASAPORTE UNIVERSAL 1-CLIC & CRATE BUILDER",
        hook: "¿Tienes que pinchar mañana con Rekordbox y tu música está organizada en Serato? Bienvenido al infierno... hasta hoy.",
        story: "El dolor de cabeza número uno de cualquier DJ profesional es la incompatibilidad de formatos. Te pasas meses creando crates y carpetas en Serato DJ; de repente te contratan en un festival donde hay cabinas con reproductores Pioneer CDJ-3000 y necesitas un pendrive exportado con Rekordbox... y tienes que volver a hacer las listas a mano una por una, perdiendo horas de sueño. Con el botón Pasaporte Universal DJ de BeatWave se acabaron las pesadillas: un solo clic y tu colección se exporta y sincroniza automáticamente hacia Serato Crates (.crate), Pioneer Rekordbox (.xml), Native Instruments Traktor (.nml) y VirtualDJ (.m3u). Da igual la cabina a la que vayas, da igual el equipo que haya: tu música, tus géneros y tu estructura van siempre contigo.",
        jargon: [
            { term: "Estructura Binaria .crate de Serato", desc: "Archivos propietarios que Serato guarda en su subcarpeta oculta de usuario. BeatWave genera directamente estos archivos binarios sin necesidad de abrir la aplicación." },
            { term: "Rekordbox XML Interoperability", desc: "El formato de intercambio profesional estándar que leen las librerías de Pioneer DJ para sincronizar hot cues, tonalidades y carpetas a pendrives USB." },
            { term: "Taxonomía de 2 Niveles (Género / Subgénero)", desc: "Organización en dos capas (ej. Tech House $\\rightarrow$ Latin Groove / Acid Tech) para encontrar cualquier canción en menos de 5 segundos en cabina." }
        ],
        steps: [
            "1. Entra en CRATES / TAXONOMÍA para visualizar tu árbol jerárquico de estilos y energía.",
            "2. Clasifica o filtra tus pistas por Género, Subgénero o Rol Acústico (Bass Driver, Vocal Lead, Percussive Tool).",
            "3. Despliega el menú '🚀 Exportar' en la esquina superior derecha.",
            "4. Pulsa '🛂 Pasaporte Universal DJ': BeatWave inyectará simultáneamente los crates en Serato, Rekordbox, Traktor y VDJ en cuestión de segundos."
        ],
        proTip: "Organiza tus crates por momentos de la noche (01_Warmup, 02_PeakTime, 03_Afterhours) en lugar de solo por géneros musicales. Cuando la pista te pida subir la intensidad a las 3:00 AM, sabrás exactamente a qué crate acudir sin dudar un milisegundo.",
        controls: [
            { btn: "[ 🛂 Pasaporte Universal DJ ]", desc: "Sincroniza simultáneamente toda tu colección hacia Serato (.crate), Rekordbox (XML), Traktor (NML) y VDJ.", when: "Antes de preparar tus pendrives USB para actuar en cualquier club o festival." },
            { btn: "[ 🌳 Árbol Jerárquico de 2 Niveles ]", desc: "Estructura de navegación por Género Principal y Subgénero Tímbrico real sin basarse solo en BPM.", when: "Para organizar y catalogar miles de canciones de manera coherente y rápida." },
            { btn: "[ 🎭 Clasificación por Roles Acústicos ]", desc: "Asigna roles según su función sonora: Bass Driver, Vocal Lead, Percussive Tool, Synth Riser.", when: "Para saber exactamente qué función cumple cada tema en la mezcla." },
            { btn: "[ 🏷️ Batch Tagging Masivo ]", desc: "Modifica o enriquece metadatos de decenas de pistas seleccionadas en un solo paso.", when: "Para unificar nombres de sellos discográficos, años o géneros." },
            { btn: "[ 📁 Exportar Crates Serato (.crate) ]", desc: "Generación binaria directa de cajas para Serato DJ sin abrir la app.", when: "Para usuarios de Serato que quieren mantener sus crates sincronizados." },
            { btn: "[ 🎧 Exportar Rekordbox XML ]", desc: "Genera el archivo XML universal listo para importar en Rekordbox 6 y 7.", when: "Para usuarios de Pioneer CDJ-3000 / CDJ-2000NXS2." }
        ],
        simulationSteps: [
            { label: "Taxonomía Timbral 2 Niveles", desc: "Organización por Género principal y Rol Acústico (Bass Driver, Tool, Vocal)", focus: "tree" },
            { label: "Pasaporte Universal DJ", desc: "Traducción simultánea hacia Serato (.crate) y Rekordbox (XML)", focus: "passport" },
            { label: "Traktor NML & VirtualDJ", desc: "Exportación multiplataforma sin recrear carpetas manualmente", focus: "multi" },
            { label: "Cabina Ready USB", desc: "Pendrives USB listos para conectar a Pioneer CDJ-3000 o reproductores", focus: "ready" }
        ]
    }
};

export const InteractiveManualModal = ({ isOpen, onClose, initialSection = 'audit', onNavigateTab, lang = 'es' }) => {
    if (!isOpen) return null;

    const { width: drawerWidth, onPointerDown: onResizeDown, resetWidth: onResetWidth } = useDrawerResize('bw_manual_drawer_width', 540);

    // Estado de Plegado / Desplegado: Colapsa a pestaña vertical lateral para interactuar libremente con la app detrás
    const [isFolded, setIsFolded] = useState(false);
    const [activeSectionKey, setActiveSectionKey] = useState(initialSection || 'audit');
    const activeSec = MANUAL_SECTIONS[activeSectionKey] || MANUAL_SECTIONS.audit || {};
    const [simStep, setSimStep] = useState(0);
    const [isSimPlaying, setIsSimPlaying] = useState(true);
    const [simSpeed, setSimSpeed] = useState(1); // 1x o 2x
    const [zoomFocus, setZoomFocus] = useState(null); // null | 'deck' | 'ai' | 'eq' | 'spectrum' | 'pads' | 'graph' | 'radar' | 'usb'
    const [activeManualTab, setActiveManualTab] = useState('all'); // 'all' | 'sim' | 'controls' | 'guide'

    const canvasRef = useRef(null);

    useEffect(() => {
        if (initialSection && MANUAL_SECTIONS[initialSection]) {
            setActiveSectionKey(initialSection);
            setSimStep(0);
            setZoomFocus(null);
        }
    }, [initialSection]);

    // Auto-Play del Simulador (3.0s por paso a 1x, 1.5s a 2x)
    useEffect(() => {
        if (!isSimPlaying) return;
        const interval = simSpeed === 2 ? 1500 : 3000;
        const timer = setInterval(() => {
            setSimStep(prev => (prev + 1) % 4);
        }, interval);
        return () => clearInterval(timer);
    }, [isSimPlaying, activeSectionKey, simSpeed]);

    // Tecla Escape para cerrar o botón Atrás de móvil (History API popstate)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        try {
            window.history.pushState({ modal: 'manual' }, '');
        } catch (_) {}
        const handlePopState = () => {
            onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [onClose]);

    // ─────────────────────────────────────────────────────────────────────────
    // MOTOR VISUAL 60 FPS (CANVAS INTERACTIVO CON SIMULACIÓN DINÁMICA DE CABINA)
    // ─────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        let frame = 0;

        const drawRoundRect = (c, x, y, width, height, radius, fill, stroke) => {
            const r = Math.min(radius, width / 2, height / 2);
            c.beginPath();
            c.moveTo(x + r, y);
            c.lineTo(x + width - r, y);
            c.quadraticCurveTo(x + width, y, x + width, y + r);
            c.lineTo(x + width, y + height - r);
            c.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
            c.lineTo(x + r, y + height);
            c.quadraticCurveTo(x, y + height, x, y + height - r);
            c.lineTo(x, y + r);
            c.quadraticCurveTo(x, y, x + r, y);
            c.closePath();
            if (fill) c.fill();
            if (stroke) c.stroke();
        };

        const render = () => {
            frame++;
            const t = frame * 0.04 * simSpeed;
            const w = canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : 500;
            const h = canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight : 280;

            ctx.clearRect(0, 0, w, h);

            // Rejilla de Fondo Estilo Monitor Pioneer / CDJ Display
            ctx.fillStyle = '#060712';
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = '#12142a';
            ctx.lineWidth = 1;
            const gridStep = 24;
            for (let x = 0; x < w; x += gridStep) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }
            for (let y = 0; y < h; y += gridStep) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }

            // Dimensiones seguras de renderizado (evita colisiones con el HUD superior y la barra inferior)
            const boxY = 36;
            const boxH = Math.max(140, h - boxY - 14);
            const bottomY = boxY + boxH;

            // ─────────────────────────────────────────────────────────────────
            // 1. MAP: Scatter Map 2D + Mini-Map + Zoom a Pista + Rueda Camelot
            // ─────────────────────────────────────────────────────────────────
            if (activeSectionKey === 'map') {
                const mapW = w * 0.60;

                // Ejes del Mapa
                ctx.fillStyle = '#475569';
                ctx.font = 'bold 8.5px monospace';
                ctx.fillText('120 BPM ──────────────────────────────── 138 BPM', 24, bottomY - 6);

                // Constelación de Pistas en el Universo 2D
                const sampleTracks = [
                    { x: 0.14, y: 0.68, col: '#f59e0b', k: '7A', bpm: 122 },
                    { x: 0.20, y: 0.50, col: '#06b6d4', k: '8A', bpm: 126 },
                    { x: 0.30, y: 0.42, col: '#06b6d4', k: '8A', bpm: 132, target: true },
                    { x: 0.38, y: 0.32, col: '#0ea5e9', k: '9A', bpm: 134 },
                    { x: 0.25, y: 0.78, col: '#10b981', k: '8B', bpm: 124 },
                    { x: 0.46, y: 0.24, col: '#a855f7', k: '10A', bpm: 138 },
                    { x: 0.48, y: 0.45, col: '#0ea5e9', k: '9A', bpm: 135 },
                    { x: 0.16, y: 0.32, col: '#eab308', k: '7B', bpm: 125 },
                    { x: 0.35, y: 0.62, col: '#06b6d4', k: '8A', bpm: 128 },
                    { x: 0.52, y: 0.60, col: '#22d3ee', k: '9B', bpm: 130 },
                    { x: 0.42, y: 0.72, col: '#10b981', k: '8B', bpm: 128 },
                    { x: 0.55, y: 0.28, col: '#ec4899', k: '11A', bpm: 140 }
                ];

                sampleTracks.forEach((st, idx) => {
                    const driftX = Math.sin(t * 0.8 + idx) * 1.5;
                    const driftY = Math.cos(t * 0.6 + idx) * 1.5;
                    const px = 20 + st.x * (mapW - 40) + driftX;
                    const py = boxY + 12 + st.y * (boxH - 36) + driftY;

                    // Halo de nodo
                    ctx.beginPath();
                    ctx.arc(px, py, st.target ? 6 : 3.5, 0, Math.PI * 2);
                    ctx.fillStyle = st.col;
                    ctx.fill();

                    if (!st.target) {
                        ctx.beginPath();
                        ctx.arc(px, py, 6.5, 0, Math.PI * 2);
                        ctx.strokeStyle = st.col + '44';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                });

                // Selección Lasso animada alrededor del cluster Peak-Time
                const lassoX = 20 + 0.40 * (mapW - 40);
                const lassoY = boxY + 12 + 0.34 * (boxH - 36);
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(lassoX, lassoY, 44, 32, t * 0.2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);

                // Pista Seleccionada: Mira Retículo + Zoom Loupe
                const sel = sampleTracks.find(s => s.target);
                const selX = 20 + sel.x * (mapW - 40) + Math.sin(t * 0.8 + 2) * 1.5;
                const selY = boxY + 12 + sel.y * (boxH - 36) + Math.cos(t * 0.6 + 2) * 1.5;

                // Retículo de Selección
                ctx.beginPath();
                ctx.arc(selX, selY, 14 + Math.sin(t * 4) * 2, 0, Math.PI * 2);
                ctx.strokeStyle = '#06b6d4';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(selX - 18, selY); ctx.lineTo(selX - 8, selY);
                ctx.moveTo(selX + 8, selY); ctx.lineTo(selX + 18, selY);
                ctx.moveTo(selX, selY - 18); ctx.lineTo(selX, selY - 8);
                ctx.moveTo(selX, selY + 8); ctx.lineTo(selX, selY + 18);
                ctx.stroke();

                // Zoom a la Pista Seleccionada (Card Flotante Detallada)
                const cardW = 158;
                const cardH = 64;
                const cardX = Math.min(selX + 22, mapW - cardW - 5);
                const cardY = Math.max(boxY + 6, Math.min(selY - 32, bottomY - cardH - 6));

                // Línea conector líder
                ctx.beginPath();
                ctx.moveTo(selX, selY);
                ctx.lineTo(cardX, cardY + cardH / 2);
                ctx.strokeStyle = '#06b6d4';
                ctx.lineWidth = 1.2;
                ctx.stroke();

                ctx.fillStyle = '#0a0e22f2';
                ctx.strokeStyle = '#06b6d4';
                ctx.lineWidth = 1.2;
                drawRoundRect(ctx, cardX, cardY, cardW, cardH, 8, true, true);

                ctx.fillStyle = '#06b6d4';
                ctx.font = 'bold 8px monospace';
                ctx.fillText('🔍 ZOOM PISTA ENFOCADA', cardX + 8, cardY + 13);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9.5px sans-serif';
                ctx.fillText('Charlotte - Tales (8A)', cardX + 8, cardY + 27);

                // Badges técnicos
                ctx.fillStyle = '#083344';
                ctx.strokeStyle = '#06b6d488';
                drawRoundRect(ctx, cardX + 8, cardY + 33, 24, 13, 3, true, true);
                ctx.fillStyle = '#22d3ee';
                ctx.font = 'bold 8px monospace';
                ctx.fillText('8A', cardX + 13, cardY + 43);

                ctx.fillStyle = '#94a3b8';
                ctx.font = '8px monospace';
                ctx.fillText('132 BPM • ⚡88% • 💃74%', cardX + 36, cardY + 43);

                // Mini Waveform 3-Band dentro del Zoom Card
                for (let wx = 0; wx < cardW - 16; wx += 3) {
                    const wh = Math.sin((wx + t * 30) * 0.15) * 4 + 5;
                    ctx.fillStyle = wx % 6 === 0 ? '#06b6d4' : '#f59e0b';
                    ctx.fillRect(cardX + 8 + wx, cardY + 50, 2, wh);
                }

                // Mini-Map de Contexto en la Esquina Superior Izquierda
                const mmX = 14;
                const mmY = boxY + 6;
                const mmW = 72;
                const mmH = 44;
                ctx.fillStyle = '#050714ee';
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
                drawRoundRect(ctx, mmX, mmY, mmW, mmH, 6, true, true);

                ctx.fillStyle = '#22d3ee';
                ctx.font = 'bold 7px monospace';
                ctx.fillText('MINI-MAP [1:4]', mmX + 6, mmY + 10);

                sampleTracks.forEach(st => {
                    ctx.fillStyle = st.col + 'aa';
                    ctx.fillRect(mmX + 6 + st.x * (mmW - 14), mmY + 12 + st.y * (mmH - 18), 2, 2);
                });

                // Ventana Viewport móvil en el mini-map
                const vpX = mmX + 16 + Math.sin(t * 0.4) * 6;
                const vpY = mmY + 16 + Math.cos(t * 0.3) * 4;
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 1;
                ctx.strokeRect(vpX, vpY, 24, 16);

                // Rueda Camelot en el Lado Derecho (60% alpha)
                const cx = w * 0.81;
                const cy = boxY + boxH * 0.50;
                const rOuter = Math.min(w * 0.17, boxH * 0.42);
                const rInner = rOuter * 0.55;

                const camelotKeys = ['1A','2A','3A','4A','5A','6A','7A','8A','9A','10A','11A','12A'];
                const colors = ['#06b6d4', '#0ea5e9', '#22d3ee', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#10b981'];

                for (let i = 0; i < 12; i++) {
                    const startA = (i * Math.PI) / 6 - Math.PI / 2;
                    const endA = ((i + 1) * Math.PI) / 6 - Math.PI / 2;
                    const isKey8A = camelotKeys[i] === '8A';

                    ctx.beginPath();
                    ctx.arc(cx, cy, isKey8A ? rOuter + 3 : rOuter, startA, endA);
                    ctx.arc(cx, cy, rInner, endA, startA, true);
                    ctx.closePath();
                    ctx.fillStyle = colors[i] + (isKey8A ? 'ee' : '66');
                    ctx.fill();
                    ctx.strokeStyle = isKey8A ? '#ffffff' : '#05060f';
                    ctx.lineWidth = isKey8A ? 2 : 1;
                    ctx.stroke();

                    // Etiqueta Camelot en el sector
                    const midA = (startA + endA) / 2;
                    const labelR = (rOuter + rInner) / 2;
                    const lx = cx + Math.cos(midA) * labelR;
                    const ly = cy + Math.sin(midA) * labelR;
                    ctx.fillStyle = '#ffffff';
                    ctx.font = isKey8A ? 'bold 8.5px monospace' : '7px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(camelotKeys[i], lx, ly);
                }
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';

                // Rayo Armónico Conector: Une la pista 8A seleccionada con el sector 8A de la rueda
                ctx.beginPath();
                ctx.moveTo(cardX + cardW, cardY + cardH / 2);
                ctx.quadraticCurveTo((cardX + cardW + cx) / 2, cy - 20, cx - rOuter, cy);
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([3, 3]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // ─────────────────────────────────────────────────────────────────
            // 2. SETBUILDER: Curva Bézier de Energía + Info Real en Puntos + DAG
            // ─────────────────────────────────────────────────────────────────
            else if (activeSectionKey === 'setbuilder') {
                // Header Score AI
                ctx.fillStyle = '#a855f7';
                ctx.font = 'bold 9px monospace';
                ctx.fillText('SCORE ARMÓNICO GEMINI AI: 96% ✨ (DJOID DAG Graph • Flujo Sin Choques Tonales)', 20, boxY + 14);

                // Nodos de la Curva de Energía con Datos Reales
                const setNodes = [
                    { x: w * 0.12, y: boxY + boxH * 0.74, tag: '01 WARM-UP', title: 'Jon Hopkins - Singularity', bpm: '120 BPM', key: '7A', energy: '⚡61%', col: '#06b6d4' },
                    { x: w * 0.35, y: boxY + boxH * 0.56, tag: '02 BUILD', title: 'Kölsch - Mirage', bpm: '126 BPM', key: '7A', energy: '⚡69%', col: '#22d3ee', match: 'Clave Idéntica ✨' },
                    { x: w * 0.63, y: boxY + boxH * 0.36, tag: '03 PEAK MAIN', title: 'Charlotte - Tales', bpm: '132 BPM', key: '8A', energy: '⚡88%', col: '#a855f7', match: '+1 Armónico 🚀' },
                    { x: w * 0.88, y: boxY + boxH * 0.20, tag: '04 CLIMAX', title: 'Chlär - Burning Sky', bpm: '138 BPM', key: '9A', energy: '⚡93%', col: '#f43f5e' }
                ];

                // Bifurcación Alternativa DAG (Rama hacia abajo)
                const forkNode = { x: w * 0.63, y: boxY + boxH * 0.84, tag: '03b ALT GROOVE (DAG)', title: 'Drunken Kong - How Far', bpm: '130 BPM', key: '9B', energy: '⚡81%', col: '#f59e0b' };

                // Curva Bézier Principal
                ctx.strokeStyle = '#a855f7';
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.moveTo(setNodes[0].x, setNodes[0].y);
                ctx.bezierCurveTo(setNodes[1].x, setNodes[1].y, setNodes[2].x, setNodes[2].y, setNodes[3].x, setNodes[3].y);
                ctx.stroke();

                // Rama DAG Alternativa (Punteada)
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(setNodes[1].x, setNodes[1].y);
                ctx.quadraticCurveTo((setNodes[1].x + forkNode.x) / 2, setNodes[1].y + 20, forkNode.x, forkNode.y);
                ctx.stroke();
                ctx.setLineDash([]);

                // Pulso de Energía Viajero a lo largo de la curva
                const flowProg = (t * 0.25) % 1;
                const fx = setNodes[0].x + (setNodes[3].x - setNodes[0].x) * flowProg;
                const fy = setNodes[0].y + (setNodes[3].y - setNodes[0].y) * flowProg;
                ctx.beginPath();
                ctx.arc(fx, fy, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#a855f7';
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.shadowBlur = 0;

                // Render de Nodos y Fichas Flotantes de Pista
                [...setNodes, forkNode].forEach((node, nIdx) => {
                    // Círculo del Punto
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 7 + Math.sin(t * 3 + nIdx) * 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = node.col;
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Ficha Flotante de Pista Anclada al Punto
                    const cardW = 120;
                    const cardH = 34;
                    const isFork = nIdx === 4;
                    const isClimax = nIdx === 3;
                    const cx = isClimax ? node.x - cardW + 8 : Math.max(8, node.x - cardW / 2);
                    const cy = isFork ? node.y + 12 : Math.max(26, node.y - cardH - 10);

                    ctx.fillStyle = '#0a0d1eeb';
                    ctx.strokeStyle = node.col + 'aa';
                    ctx.lineWidth = 1;
                    drawRoundRect(ctx, cx, cy, cardW, cardH, 6, true, true);

                    // Tag y Título
                    ctx.fillStyle = node.col;
                    ctx.font = 'bold 7px monospace';
                    ctx.fillText(node.tag, cx + 5, cy + 9);

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 8px sans-serif';
                    ctx.fillText(node.title, cx + 5, cy + 20);

                    // Métricas
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '7.5px monospace';
                    ctx.fillText(`${node.bpm} • ${node.key} • ${node.energy}`, cx + 5, cy + 30);
                });
            }

            // ─────────────────────────────────────────────────────────────────
            // 3. CUES: Fraseo Musical 32 Beats + 8 Performance Pads RGB
            // ─────────────────────────────────────────────────────────────────
            else if (activeSectionKey === 'hotcues') {
                const waveY = boxY + boxH * 0.30;
                const waveH = 42;

                // Bloques de Fraseo Musical de 32 Tiempos
                const phraseBlocks = [
                    { name: 'INTRO (32b)', w: w * 0.24, col: 'rgba(16, 185, 129, 0.15)', border: '#10b981' },
                    { name: 'PERCUSSION (32b)', w: w * 0.24, col: 'rgba(6, 182, 212, 0.15)', border: '#06b6d4' },
                    { name: 'BREAKDOWN (32b)', w: w * 0.24, col: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b' },
                    { name: 'MAIN DROP (64b)', w: w * 0.28, col: 'rgba(239, 68, 68, 0.18)', border: '#ef4444' }
                ];

                let curX = 14;
                phraseBlocks.forEach(pb => {
                    ctx.fillStyle = pb.col;
                    ctx.strokeStyle = pb.border + '55';
                    ctx.lineWidth = 1;
                    drawRoundRect(ctx, curX, waveY - 26, pb.w - 4, waveH + 32, 6, true, true);

                    ctx.fillStyle = pb.border;
                    ctx.font = 'bold 7.5px monospace';
                    ctx.fillText(pb.name, curX + 6, waveY - 14);
                    curX += pb.w;
                });

                // Forma de Onda Tricromática (Lows, Mids, Highs)
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#06b6d4';
                ctx.beginPath();
                for (let x = 16; x < w - 16; x += 3) {
                    const wave = Math.sin((x + t * 40) * 0.04) * 16 * Math.cos(x * 0.015);
                    const y = waveY + wave;
                    if (x === 16) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();

                // Playhead que avanza
                const playX = 16 + ((t * 35) % (w - 32));
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(playX, waveY - 22);
                ctx.lineTo(playX, waveY + 28);
                ctx.stroke();

                // 8 Performance Pads Hardware Iluminados
                const padAreaY = boxY + boxH * 0.64;
                const padW = (w - 36) / 8;
                const padH = Math.min(46, boxH * 0.30);

                const padDefs = [
                    { num: 1, label: 'INTRO', col: '#10b981' },
                    { num: 2, label: 'PERC', col: '#06b6d4' },
                    { num: 3, label: 'VOX', col: '#facc15' },
                    { num: 4, label: 'BREAK', col: '#f97316' },
                    { num: 5, label: 'DROP 1', col: '#ef4444' },
                    { num: 6, label: 'DROP 2', col: '#a855f7' },
                    { num: 7, label: 'BRIDGE', col: '#ec4899' },
                    { num: 8, label: 'OUTRO', col: '#22d3ee' }
                ];

                const activePadIdx = Math.floor(((t * 35) % (w - 32)) / (padW));

                padDefs.forEach((p, idx) => {
                    const px = 18 + idx * padW;
                    const isLit = idx === activePadIdx;

                    ctx.fillStyle = isLit ? p.col + '44' : '#0c0f1e';
                    ctx.strokeStyle = isLit ? p.col : '#1e2438';
                    ctx.lineWidth = isLit ? 2 : 1;
                    drawRoundRect(ctx, px, padAreaY, padW - 4, padH, 6, true, true);

                    // Indicador LED en esquina del Pad
                    ctx.beginPath();
                    ctx.arc(px + 6, padAreaY + 7, isLit ? 3 : 2, 0, Math.PI * 2);
                    ctx.fillStyle = isLit ? p.col : '#334155';
                    ctx.fill();

                    // Número del Cue
                    ctx.fillStyle = isLit ? '#ffffff' : '#64748b';
                    ctx.font = 'bold 11px monospace';
                    ctx.fillText(String(p.num), px + padW / 2 - 6, padAreaY + 22);

                    // Etiqueta del Pad
                    ctx.fillStyle = isLit ? p.col : '#475569';
                    ctx.font = 'bold 7px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(p.label, px + (padW - 4) / 2, padAreaY + 36);
                    ctx.textAlign = 'left';
                });

                // Telemetría inferior
                ctx.fillStyle = '#64748b';
                ctx.font = '8px monospace';
                ctx.fillText('QUANTIZE 1/4 BEAT • ALINEACIÓN AUTOMÁTICA A 32 TIEMPOS • REKORDBOX & SERATO SYNCED', 18, bottomY - 6);
            }

            // ─────────────────────────────────────────────────────────────────
            // 4. AUDITAR: DNA Acústico (Mood, Energía, Dance) + FFT Anti-Fake
            // ─────────────────────────────────────────────────────────────────
            else if (activeSectionKey === 'audit') {
                const radCX = w * 0.24;
                const radCY = boxY + boxH * 0.50;
                const radR = Math.min(w * 0.18, boxH * 0.40);

                // 1. Radar Pentagonal de DNA Acústico (Izquierda)
                const axes = [
                    { name: 'Energía', val: 0.88, icon: '⚡88%' },
                    { name: 'Dance', val: 0.74, icon: '💃74%' },
                    { name: 'Mood', val: 0.65, icon: '🌊65%' },
                    { name: 'Dinámica', val: 0.82, icon: '🔊-7.1' },
                    { name: 'Pureza', val: 0.99, icon: '💎99%' }
                ];

                // Anillos concéntricos del radar
                for (let rFrac of [0.33, 0.66, 1.0]) {
                    ctx.beginPath();
                    for (let a = 0; a < 5; a++) {
                        const angle = (a * Math.PI * 2) / 5 - Math.PI / 2;
                        const rx = radCX + Math.cos(angle) * (radR * rFrac);
                        const ry = radCY + Math.sin(angle) * (radR * rFrac);
                        if (a === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
                    }
                    ctx.closePath();
                    ctx.strokeStyle = '#182038';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

                // Polígono del DNA Acústico
                ctx.beginPath();
                for (let a = 0; a < 5; a++) {
                    const angle = (a * Math.PI * 2) / 5 - Math.PI / 2;
                    const breathe = 1 + Math.sin(t * 2.5 + a) * 0.03;
                    const rDist = radR * axes[a].val * breathe;
                    const rx = radCX + Math.cos(angle) * rDist;
                    const ry = radCY + Math.sin(angle) * rDist;
                    if (a === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
                }
                ctx.closePath();
                ctx.fillStyle = 'rgba(6, 182, 212, 0.28)';
                ctx.fill();
                ctx.strokeStyle = '#06b6d4';
                ctx.lineWidth = 1.8;
                ctx.stroke();

                // Etiquetas de los ejes
                axes.forEach((ax, a) => {
                    const angle = (a * Math.PI * 2) / 5 - Math.PI / 2;
                    const lx = radCX + Math.cos(angle) * (radR + 14);
                    const ly = radCY + Math.sin(angle) * (radR + 14);
                    ctx.fillStyle = '#38bdf8';
                    ctx.font = 'bold 7.5px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(ax.icon, lx, ly);
                });
                ctx.textAlign = 'left';

                ctx.fillStyle = '#22d3ee';
                ctx.font = 'bold 8.5px monospace';
                ctx.fillText('DNA ACÚSTICO & MOOD', 18, boxY + 14);

                ctx.fillStyle = '#64748b';
                ctx.font = '7.5px monospace';
                ctx.fillText('Peak-Time • Bass Driver', 18, bottomY - 6);

                // 2. Espectrograma FFT Quirúrgico (Derecha)
                const fftX = w * 0.48;
                const fftW = w - fftX - 16;
                const fftH = boxH - 12;
                const fftY = boxY + 4;

                ctx.fillStyle = '#070914';
                ctx.strokeStyle = '#1e243b';
                drawRoundRect(ctx, fftX, fftY, fftW, fftH, 8, true, true);

                // Eje Frecuencial
                ctx.fillStyle = '#475569';
                ctx.font = '7px monospace';
                ctx.fillText('20Hz        500Hz        2kHz        8kHz      16kHz    22kHz', fftX + 8, fftY + fftH - 5);

                const isFake = simStep >= 2;
                const cutX = fftX + fftW * 0.72; // Corte de 16kHz

                // Curva Espectral Real
                ctx.beginPath();
                ctx.moveTo(fftX + 8, fftY + fftH - 18);
                for (let fx = fftX + 8; fx < fftX + fftW - 8; fx += 3) {
                    const frac = (fx - fftX) / fftW;
                    let drop = Math.pow(frac, 1.8) * (fftH - 25);
                    if (isFake && fx >= cutX) {
                        drop = fftH - 18; // Caída vertical muro en fake
                    }
                    const jitter = Math.sin(fx * 0.1 + t * 4) * 2;
                    ctx.lineTo(fx, fftY + 12 + drop + jitter);
                }
                ctx.strokeStyle = isFake ? '#f43f5e' : '#10b981';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Zona de Alerta de Corte
                if (isFake) {
                    ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
                    ctx.fillRect(cutX, fftY + 8, fftX + fftW - cutX - 8, fftH - 24);

                    // Línea vertical tijera 16kHz
                    ctx.setLineDash([3, 3]);
                    ctx.strokeStyle = '#f43f5e';
                    ctx.beginPath();
                    ctx.moveTo(cutX, fftY + 8);
                    ctx.lineTo(cutX, fftY + fftH - 16);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    ctx.fillStyle = '#f43f5e';
                    ctx.font = 'bold 8px monospace';
                    ctx.fillText('⚠️ FAKE 16kHz CUTOFF', cutX - 45, fftY + 22);

                    ctx.fillStyle = '#fda4af';
                    ctx.font = '7px monospace';
                    ctx.fillText('MP3 128k inflado a FLAC', cutX - 45, fftY + 32);
                } else {
                    ctx.fillStyle = '#10b981';
                    ctx.font = 'bold 8px monospace';
                    ctx.fillText('✓ LOSSLESS REAL (22.05 kHz PASS)', fftX + 10, fftY + 20);
                }
            }

            // ─────────────────────────────────────────────────────────────────
            // 5. COPILOT: Monitor Táctico de Cabina (Dual Decks + Anti-Muddy Radar)
            // ─────────────────────────────────────────────────────────────────
            else if (activeSectionKey === 'copilot') {
                const deckW = (w - 44) / 2;
                const deckH = (boxH - 24) * 0.46;

                // Deck 1 (Master / On Air)
                ctx.fillStyle = '#080d1a';
                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = 1.2;
                drawRoundRect(ctx, 16, boxY + 4, deckW, deckH, 8, true, true);

                ctx.fillStyle = '#10b981';
                ctx.font = 'bold 8px monospace';
                ctx.fillText('● DECK 1 [MASTER / ON AIR]', 24, boxY + 18);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9px sans-serif';
                ctx.fillText('Tales of the Desert - Charlotte', 24, boxY + 30);

                ctx.fillStyle = '#94a3b8';
                ctx.font = '7.5px monospace';
                ctx.fillText('8A • 132.0 BPM • Trim 0.0dB • LUFS -6.4', 24, boxY + 41);

                // Forma de onda Deck 1
                ctx.strokeStyle = '#06b6d4';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let x = 0; x < deckW - 16; x += 3) {
                    const wave = Math.sin((x + t * 40) * 0.06) * 7 + Math.cos((x - t * 20) * 0.12) * 3;
                    const wy = boxY + deckH - 8 + wave;
                    if (x === 0) ctx.moveTo(24 + x, wy); else ctx.lineTo(24 + x, wy);
                }
                ctx.stroke();

                // Deck 2 (Incoming / Cue)
                const d2X = 24 + deckW;
                ctx.fillStyle = '#080d1a';
                ctx.strokeStyle = '#06b6d4';
                ctx.lineWidth = 1.2;
                drawRoundRect(ctx, d2X, boxY + 4, deckW, deckH, 8, true, true);

                ctx.fillStyle = '#06b6d4';
                ctx.font = 'bold 8px monospace';
                ctx.fillText('● DECK 2 [CUE / SYNC]', d2X + 8, boxY + 18);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9px sans-serif';
                ctx.fillText('Burning Sky - Chlär', d2X + 8, boxY + 30);

                ctx.fillStyle = '#94a3b8';
                ctx.font = '7.5px monospace';
                ctx.fillText('8A • 132.0 BPM (Sync) • Trim -1.8dB • LUFS -8.8', d2X + 8, boxY + 41);

                // Forma de onda Deck 2
                ctx.strokeStyle = '#ec4899';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let x = 0; x < deckW - 16; x += 3) {
                    const wave = Math.sin((x + t * 40) * 0.06) * 6 + Math.sin((x + t * 15) * 0.08) * 3;
                    const wy = boxY + deckH - 8 + wave;
                    if (x === 0) ctx.moveTo(d2X + 8 + x, wy); else ctx.lineTo(d2X + 8 + x, wy);
                }
                ctx.stroke();

                // Panel Central: Radar Anti-Muddy DSP (<100Hz)
                const dspY = boxY + deckH + 10;
                const dspH = boxH - deckH - 14;
                const isClash = simStep < 2;

                ctx.fillStyle = '#0a0d20';
                ctx.strokeStyle = isClash ? '#ef4444' : '#10b981';
                ctx.lineWidth = 1.2;
                drawRoundRect(ctx, 16, dspY, w - 32, dspH, 8, true, true);

                if (isClash) {
                    // Alerta de Choque de Subgraves
                    ctx.fillStyle = '#ef4444';
                    ctx.font = 'bold 8.5px monospace';
                    ctx.fillText('⚠️ CHOQUE DE SUBGRAVES (<100Hz) — Cancelación de fase -3.6 dB', 26, dspY + 16);

                    ctx.fillStyle = '#fca5a5';
                    ctx.font = '8px sans-serif';
                    ctx.fillText('ACCIÓN RECOMENDADA: Corta el EQ Low de Deck 1 antes de abrir el fader', 26, dspY + 30);
                } else {
                    // Mezcla Limpia Optimizada
                    ctx.fillStyle = '#10b981';
                    ctx.font = 'bold 8.5px monospace';
                    ctx.fillText('✨ MEZCLA LIMPIA Y CONTUNDENTE — Pegada 100% Preservada', 26, dspY + 16);

                    ctx.fillStyle = '#86efac';
                    ctx.font = '8px sans-serif';
                    ctx.fillText('Frecuencias subgraves alineadas • Sin cancelación de pegada en club', 26, dspY + 30);
                }

                // Vúmetro de Diferencial LUFS a la derecha
                const meterX = w - 120;
                ctx.fillStyle = '#38bdf8';
                ctx.font = 'bold 7.5px monospace';
                ctx.fillText('Δ LUFS: +2.4 dB', meterX, dspY + 16);
                ctx.fillStyle = '#64748b';
                ctx.fillText('Sube Trim Deck 2', meterX, dspY + 28);
            }

            // ─────────────────────────────────────────────────────────────────
            // 6. POOL (Spotify / SuperFLAC): Pipeline de Descarga + A/B Dual
            // ─────────────────────────────────────────────────────────────────
            else if (activeSectionKey === 'spotify') {
                const colW = (w - 48) / 3;
                const cY = boxY + 4;
                const cH = boxH - 8;

                // 1. Etapa de Búsqueda y Resolución ISRC (Izquierda)
                ctx.fillStyle = '#080d1a';
                ctx.strokeStyle = '#10b98166';
                drawRoundRect(ctx, 16, cY, colW, cH, 8, true, true);

                ctx.fillStyle = '#34d399';
                ctx.font = 'bold 8px monospace';
                ctx.fillText('1. RESOLUCIÓN ISRC', 24, cY + 16);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 8.5px sans-serif';
                ctx.fillText('Charlotte - Tales', 24, cY + 32);

                ctx.fillStyle = '#64748b';
                ctx.font = '7.5px monospace';
                ctx.fillText('ISRC: BE-A12-24-00031', 24, cY + 46);
                ctx.fillText('Tidal / Qobuz Master', 24, cY + 58);

                // Scanning line
                const scanY = cY + 68 + ((t * 20) % Math.max(30, cH - 80));
                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(24, scanY);
                ctx.lineTo(24 + colW - 16, scanY);
                ctx.stroke();

                // 2. Pipeline Multihilo de Descarga (Centro)
                const c2X = 20 + colW + 8;
                ctx.fillStyle = '#080d1a';
                ctx.strokeStyle = '#06b6d466';
                drawRoundRect(ctx, c2X, cY, colW, cH, 8, true, true);

                ctx.fillStyle = '#22d3ee';
                ctx.font = 'bold 8px monospace';
                ctx.fillText('2. PIPELINE FLAC 24-BIT', c2X + 8, cY + 16);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 8px monospace';
                ctx.fillText('2.304 kbps / 48kHz', c2X + 8, cY + 32);

                // 4 Canales de streaming
                for (let ch = 0; ch < 4; ch++) {
                    const chy = cY + 44 + ch * 14;
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(c2X + 8, chy, colW - 16, 8);

                    const packetX = c2X + 8 + ((t * 40 + ch * 25) % (colW - 24));
                    ctx.fillStyle = '#06b6d4';
                    ctx.fillRect(packetX, chy, 12, 8);
                }

                ctx.fillStyle = '#10b981';
                ctx.font = 'bold 7.5px monospace';
                ctx.fillText('✓ BUFFER 100% LOSSLESS', c2X + 8, cY + cH - 12);

                // 3. Comparador Dual A/B & Certificación FFT (Derecha)
                const c3X = c2X + colW + 8;
                ctx.fillStyle = '#080d1a';
                ctx.strokeStyle = '#a855f766';
                drawRoundRect(ctx, c3X, cY, colW, cH, 8, true, true);

                ctx.fillStyle = '#c084fc';
                ctx.font = 'bold 8px monospace';
                ctx.fillText('3. AUDITORÍA A/B', c3X + 8, 40);

                // Selector A/B
                ctx.fillStyle = '#334155';
                drawRoundRect(ctx, c3X + 8, 48, (colW - 18) / 2, 16, 4, true, false);
                ctx.fillStyle = '#94a3b8';
                ctx.font = 'bold 7px monospace';
                ctx.fillText('A: MP3 128k', c3X + 11, 59);

                ctx.fillStyle = '#10b981';
                drawRoundRect(ctx, c3X + 10 + (colW - 18) / 2, 48, (colW - 18) / 2, 16, 4, true, false);
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 7px monospace';
                ctx.fillText('B: FLAC 24b', c3X + 13 + (colW - 18) / 2, 59);

                // Sello de Certificación
                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = 1.2;
                drawRoundRect(ctx, c3X + 8, 74, colW - 16, 32, 6, false, true);
                ctx.fillStyle = '#10b981';
                ctx.font = 'bold 7.5px monospace';
                ctx.fillText('💎 SUPERFLAC PASS', c3X + 12, 88);
                ctx.fillStyle = '#94a3b8';
                ctx.font = '6.5px monospace';
                ctx.fillText('Frecuencias hasta 22kHz', c3X + 12, 98);
            }

            // ─────────────────────────────────────────────────────────────────
            // 7. CRATES: Árbol Timbral 2 Niveles + Pasaporte Universal DJ
            // ─────────────────────────────────────────────────────────────────
            else if (activeSectionKey === 'crates') {
                const treeW = w * 0.42;
                const cY = boxY + 4;
                const cH = boxH - 8;

                // Árbol Jerárquico (Izquierda)
                ctx.fillStyle = '#070918';
                ctx.strokeStyle = '#f9731666';
                drawRoundRect(ctx, 16, cY, treeW, cH, 8, true, true);

                ctx.fillStyle = '#fb923c';
                ctx.font = 'bold 8px monospace';
                ctx.fillText('ÁRBOL TIMBRAL DE GÉNERO', 24, cY + 16);

                const branches = [
                    { name: '├─ Peak Time', role: '[Bass Driver]', count: '420 trk' },
                    { name: '├─ Raw / Hypnotic', role: '[Percussive Tool]', count: '310 trk' },
                    { name: '├─ Melodic', role: '[Vocal Lead]', count: '280 trk' },
                    { name: '└─ Deep / Warmup', role: '[Atmospheric]', count: '230 trk' }
                ];

                branches.forEach((br, bIdx) => {
                    const by = cY + 36 + bIdx * 18;
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '8px monospace';
                    ctx.fillText(br.name, 24, by);

                    ctx.fillStyle = '#f97316';
                    ctx.font = 'bold 7px monospace';
                    ctx.fillText(br.role, 24 + 86, by);

                    ctx.fillStyle = '#64748b';
                    ctx.font = '7px monospace';
                    ctx.fillText(br.count, treeW - 32, by);
                });

                // Pasaporte Universal DJ Translation Core (Derecha)
                const coreX = 24 + treeW;
                const coreW = w - coreX - 16;

                ctx.fillStyle = '#070918';
                ctx.strokeStyle = '#06b6d466';
                drawRoundRect(ctx, coreX, cY, coreW, cH, 8, true, true);

                ctx.fillStyle = '#22d3ee';
                ctx.font = 'bold 8px monospace';
                ctx.fillText('PASAPORTE UNIVERSAL DJ', coreX + 8, cY + 16);

                const targets = [
                    { name: '➔ SERATO DJ PRO', fmt: '.crate binario' },
                    { name: '➔ PIONEER REKORDBOX', fmt: 'rekordbox.xml' },
                    { name: '➔ NI TRAKTOR', fmt: 'collection.nml' },
                    { name: '➔ VIRTUAL DJ', fmt: 'playlist.m3u8' }
                ];

                targets.forEach((tgt, tIdx) => {
                    const ty = cY + 36 + tIdx * 18;
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 7.5px monospace';
                    ctx.fillText(tgt.name, coreX + 8, ty);

                    ctx.fillStyle = '#10b981';
                    ctx.font = '7px monospace';
                    ctx.fillText(tgt.fmt, coreX + coreW - 68, ty);
                });

                // USB Pendrive Status (dentro del panel derecho)
                ctx.fillStyle = '#10b981';
                ctx.font = 'bold 8px monospace';
                ctx.fillText('✓ CABINA READY: Sincronizado a USB en 1 Clic', coreX + 8, cY + cH - 14);
            }

            // ─────────────────────────────────────────────────────────────────
            // 8. RADAR: Barrido Acústico 360° & Detección de Micro-Géneros
            // ─────────────────────────────────────────────────────────────────
            else if (activeSectionKey === 'radar') {
                const rx = w * 0.40;
                const ry = boxY + boxH * 0.50;
                const rr = Math.min(w * 0.28, boxH * 0.42);

                ctx.strokeStyle = '#4338ca';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(rx, ry, rr, 0, Math.PI * 2);
                ctx.arc(rx, ry, rr * 0.66, 0, Math.PI * 2);
                ctx.arc(rx, ry, rr * 0.33, 0, Math.PI * 2);
                ctx.stroke();

                // Haz de barrido giratorio
                const sweepAngle = t * 2.2;
                const sweepGrad = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr);
                sweepGrad.addColorStop(0, 'rgba(99, 102, 241, 0.45)');
                sweepGrad.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
                ctx.beginPath();
                ctx.moveTo(rx, ry);
                ctx.arc(rx, ry, rr, sweepAngle, sweepAngle + 0.6);
                ctx.closePath();
                ctx.fillStyle = sweepGrad;
                ctx.fill();

                // Blips de Micro-Géneros Detectados
                const blips = [
                    { a: 0.8, r: 0.75, name: 'Hard Groove (138)' },
                    { a: 2.2, r: 0.50, name: 'Afro-Melodic (124)' },
                    { a: 3.9, r: 0.85, name: 'Raw Peak-Time (134)' },
                    { a: 5.1, r: 0.40, name: 'Indie Dance (122)' }
                ];

                blips.forEach(b => {
                    const bx = rx + Math.cos(b.a) * (rr * b.r);
                    const by = ry + Math.sin(b.a) * (rr * b.r);
                    ctx.beginPath();
                    ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = '#6366f1';
                    ctx.shadowBlur = 8;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                });

                // Panel Lateral de Detección en Tiempo Real
                const pX = rx + rr + 24;
                const pW = w - pX - 16;
                ctx.fillStyle = '#0a0d24';
                ctx.strokeStyle = '#6366f1';
                drawRoundRect(ctx, pX, boxY + 4, pW, boxH - 8, 8, true, true);

                ctx.fillStyle = '#818cf8';
                ctx.font = 'bold 8px monospace';
                ctx.fillText('1001TRACKLISTS SCAN', pX + 8, boxY + 20);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 8.5px sans-serif';
                ctx.fillText('Tales of the Desert', pX + 8, boxY + 36);

                ctx.fillStyle = '#a5b4fc';
                ctx.font = '7.5px monospace';
                ctx.fillText('Charlotte de Witte', pX + 8, boxY + 50);

                ctx.fillStyle = '#10b981';
                ctx.font = 'bold 7.5px monospace';
                ctx.fillText('Match 98% con tu Maleta', pX + 8, boxY + 66);
            }

            animId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animId);
    }, [activeSectionKey, simStep, simSpeed, zoomFocus]);

    // Render del Simulador Visual Animado de Alta Fidelidad
    const renderVisualSimulator = () => {
        const stepInfo = (activeSec.simulationSteps && activeSec.simulationSteps[simStep]) || { label: "Paso Activo", desc: "Simulación en curso", focus: "default" };

        return (
            <div className="flex flex-col h-full justify-between gap-3 select-none">
                {/* Barra de Controles de Reproducción y Pasos */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-[#0e1022] border border-djzinc-750">
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setIsSimPlaying(prev => !prev)}
                            className={`px-3 py-1 rounded-lg text-xs font-mono font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSimPlaying 
                                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.6)]' 
                                    : 'bg-djzinc-800 text-gray-200 hover:text-white'
                            }`}
                            title={isSimPlaying ? "Pausar simulación" : "Reproducir simulación continua"}
                        >
                            <span>{isSimPlaying ? '⏸' : '▶'}</span>
                            <span>{isSimPlaying ? 'Pausa' : 'Play'}</span>
                        </button>

                        <div className="flex items-center gap-1">
                            {[0, 1, 2, 3].map(st => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => { setSimStep(st); setIsSimPlaying(false); }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black transition-all cursor-pointer ${
                                        simStep === st
                                            ? 'bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-md scale-105 border border-pink-400'
                                            : 'bg-djzinc-900 text-gray-300 hover:text-white border border-djzinc-800'
                                    }`}
                                >
                                    P{st + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setSimSpeed(prev => (prev === 1 ? 2 : 1))}
                            className="px-2 py-1 rounded-lg bg-djzinc-850 hover:bg-djzinc-750 text-gray-200 hover:text-white border border-djzinc-700 text-[10.5px] font-mono font-bold cursor-pointer"
                        >
                            Velocidad: {simSpeed}x
                        </button>

                        <button
                            type="button"
                            onClick={() => setZoomFocus(prev => (prev ? null : 'active'))}
                            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                zoomFocus
                                    ? 'bg-pink-950 text-pink-200 border border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                                    : 'bg-djzinc-850 text-gray-300 border border-djzinc-700'
                            }`}
                        >
                            <Icons.Search size={14} className="inline-block align-[-2px]" />
                            <span>{zoomFocus ? 'Zoom 1.6x Activo' : 'Zoom Enfoque'}</span>
                        </button>
                    </div>
                </div>

                {/* Lienzo Visual Animado con Renderizado Canvas Dinámico a 60 FPS */}
                <div className="flex-1 rounded-2xl bg-[#060712] border-2 border-djzinc-750 relative overflow-hidden p-3 shadow-inner" style={{ minHeight: "320px" }}>
                    {/* Canvas a 60 FPS */}
                    <div className="absolute inset-0 w-full h-full pointer-events-none">
                        <canvas ref={canvasRef} className="w-full h-full" />
                    </div>

                    {/* HUD Superpuesto con Información de Estado del Paso */}
                    <div className="relative z-10 flex items-center justify-between w-full pointer-events-none">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/85 border border-pink-500/80 text-white font-mono text-[10.5px] font-black shadow-md">
                            <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
                            <span>{stepInfo.label}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-black/85 border border-cyan-500/70 text-cyan-300 font-mono text-[10px] font-bold">
                            60 FPS LIVE SIMULATOR
                        </span>
                    </div>
                </div>

                {/* Barra Inferior Desacoplada con Botones Spotlight y Descripción del Paso (Sin colisiones ni cortes) */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#080a1c] border border-djzinc-750 rounded-xl shrink-0 shadow-md">
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {activeSectionKey === 'copilot' && (
                            <>
                                <button type="button" onClick={() => setZoomFocus('deck')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${zoomFocus === 'deck' ? 'bg-cyan-500 text-black' : 'bg-black/70 text-cyan-300 border border-cyan-800'}`}><Icons.Search size={14} className="inline-block align-[-2px]" /> Decks Master/Cue</button>
                                <button type="button" onClick={() => setZoomFocus('dsp')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${zoomFocus === 'dsp' ? 'bg-pink-500 text-black' : 'bg-black/70 text-pink-300 border border-pink-800'}`}><Icons.Search size={14} className="inline-block align-[-2px]" /> Anti-Muddy Radar</button>
                            </>
                        )}
                        {activeSectionKey === 'audit' && (
                            <>
                                <button type="button" onClick={() => setZoomFocus('dna')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${zoomFocus === 'dna' ? 'bg-cyan-500 text-black' : 'bg-black/70 text-cyan-300 border border-cyan-800'}`}><Icons.Search size={14} className="inline-block align-[-2px]" /> DNA Acústico & Mood</button>
                                <button type="button" onClick={() => setZoomFocus('fft')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${zoomFocus === 'fft' ? 'bg-emerald-500 text-black' : 'bg-black/70 text-emerald-300 border border-emerald-800'}`}><Icons.Search size={14} className="inline-block align-[-2px]" /> FFT Anti-Fake 16k</button>
                            </>
                        )}
                        {activeSectionKey === 'hotcues' && (
                            <>
                                <button type="button" onClick={() => setZoomFocus('phrase')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${zoomFocus === 'phrase' ? 'bg-amber-500 text-black' : 'bg-black/70 text-amber-300 border border-amber-800'}`}><Icons.Search size={14} className="inline-block align-[-2px]" /> Fraseo 32 Beats</button>
                                <button type="button" onClick={() => setZoomFocus('pads')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${zoomFocus === 'pads' ? 'bg-rose-500 text-black' : 'bg-black/70 text-rose-300 border border-rose-800'}`}><Icons.Search size={14} className="inline-block align-[-2px]" /> 8 Pads RGB CDJ</button>
                            </>
                        )}
                        {activeSectionKey === 'setbuilder' && (
                            <>
                                <button type="button" onClick={() => setZoomFocus('curve')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${zoomFocus === 'curve' ? 'bg-fuchsia-500 text-black' : 'bg-black/70 text-fuchsia-300 border border-fuchsia-800'}`}><Icons.Search size={14} className="inline-block align-[-2px]" /> Curva Bézier & Pistas</button>
                                <button type="button" onClick={() => setZoomFocus('dag')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${zoomFocus === 'dag' ? 'bg-amber-500 text-black' : 'bg-black/70 text-amber-300 border border-amber-800'}`}><Icons.Search size={14} className="inline-block align-[-2px]" /> Rama DAG DJOID</button>
                            </>
                        )}
                        {activeSectionKey === 'map' && (
                            <>
                                <button type="button" onClick={() => setZoomFocus('zoomtrack')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${zoomFocus === 'zoomtrack' ? 'bg-cyan-500 text-black' : 'bg-black/70 text-cyan-300 border border-cyan-800'}`}><Icons.Search size={14} className="inline-block align-[-2px]" /> Zoom a Pista</button>
                                <button type="button" onClick={() => setZoomFocus('minimap')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${zoomFocus === 'minimap' ? 'bg-teal-500 text-black' : 'bg-black/70 text-teal-300 border border-teal-800'}`}><Icons.Search size={14} className="inline-block align-[-2px]" /> Mini-Map & Camelot</button>
                            </>
                        )}
                        {activeSectionKey === 'spotify' && (
                            <>
                                <button type="button" onClick={() => setZoomFocus('pipeline')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${zoomFocus === 'pipeline' ? 'bg-emerald-500 text-black' : 'bg-black/70 text-emerald-300 border border-emerald-800'}`}><Icons.Search size={14} className="inline-block align-[-2px]" /> Pipeline SuperFLAC</button>
                                <button type="button" onClick={() => setZoomFocus('ab')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${zoomFocus === 'ab' ? 'bg-cyan-500 text-black' : 'bg-black/70 text-cyan-300 border border-cyan-800'}`}><Icons.Search size={14} className="inline-block align-[-2px]" /> Comparador A/B</button>
                            </>
                        )}
                        {activeSectionKey === 'crates' && (
                            <>
                                <button type="button" onClick={() => setZoomFocus('tree')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${zoomFocus === 'tree' ? 'bg-orange-500 text-black' : 'bg-black/70 text-orange-300 border border-orange-800'}`}><Icons.Search size={14} className="inline-block align-[-2px]" /> Árbol Timbral</button>
                                <button type="button" onClick={() => setZoomFocus('passport')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${zoomFocus === 'passport' ? 'bg-cyan-500 text-black' : 'bg-black/70 text-cyan-300 border border-cyan-800'}`}><Icons.Search size={14} className="inline-block align-[-2px]" /> Pasaporte DJ USB</button>
                            </>
                        )}
                        {activeSectionKey === 'radar' && (
                            <>
                                <button type="button" onClick={() => setZoomFocus('scan')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${zoomFocus === 'scan' ? 'bg-indigo-500 text-black' : 'bg-black/70 text-indigo-300 border border-indigo-800'}`}><Icons.Search size={14} className="inline-block align-[-2px]" /> Barrido 360°</button>
                                <button type="button" onClick={() => setZoomFocus('genres')} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${zoomFocus === 'genres' ? 'bg-purple-500 text-black' : 'bg-black/70 text-purple-300 border border-purple-800'}`}><Icons.Search size={14} className="inline-block align-[-2px]" /> Micro-Géneros</button>
                            </>
                        )}
                        </div>
                        <div className="text-[10px] sm:text-[10.5px] text-gray-200 font-mono truncate max-w-[280px] sm:max-w-[420px] ml-auto bg-black/80 px-2.5 py-1 rounded-md border border-djzinc-700/80 shadow-sm text-right shrink-0">
                            {stepInfo.desc}
                        </div>
                    </div>
                </div>
        );
    };

    // Render de la Tarjeta del Simulador
    const renderSimulatorCard = () => (
        <div className="flex flex-col gap-2.5 bg-[#0a0c18] border border-djzinc-750 rounded-2xl p-3.5 sm:p-4 shadow-inner relative overflow-hidden shrink-0" style={{ height: "520px", minHeight: "520px" }}>
            <div className="flex items-center justify-between border-b border-djzinc-800/80 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping"></span>
                    <h4 className="text-xs font-mono font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                        <span>Simulación Interactiva en Vivo</span>
                        <span className="text-[9px] bg-gradient-to-r from-pink-600 to-rose-600 text-white px-2 py-0.5 rounded font-black shadow-sm">60 FPS</span>
                    </h4>
                </div>
                <span className="text-[10.5px] font-mono text-gray-300 font-bold uppercase">
                    Paso {simStep + 1}/4
                </span>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
                {renderVisualSimulator()}
            </div>
        </div>
    );

    // Render del Catálogo Completo de Botones y Controles
    const renderControlsCatalog = () => (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <Icons.Sliders size={14} className="inline-block align-[-2px]" />
                    <span>Guía Completa de Botones & Funcionalidades</span>
                </h4>
                <span className="text-[10.5px] font-mono px-2.5 py-0.5 rounded bg-pink-950 text-pink-200 border border-pink-500/80 font-black">
                    {(activeSec.controls || []).length} Controles
                </span>
            </div>

            <p className="text-xs font-sans text-gray-300 leading-relaxed">
                A continuación tienes el detalle meticuloso de cada botón, selector y atajo disponible en <strong className="text-white">{activeSec.badge}</strong>:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
                {(activeSec.controls || []).map((ctrl, cIdx) => (
                    <div key={cIdx} className="p-3.5 rounded-2xl bg-[#0d0f1e] border border-djzinc-750 hover:border-pink-500/70 transition-all shadow-md">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-mono text-xs font-black text-pink-200 bg-pink-950/80 px-2.5 py-0.5 rounded border border-pink-600/60 shadow-sm">
                                {ctrl.btn}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">
                                Control #{cIdx + 1}
                            </span>
                        </div>
                        <p className="text-xs font-sans text-gray-200 leading-relaxed mb-2 font-medium">
                            {ctrl.desc}
                        </p>
                        <div className="p-2 rounded-xl bg-[#060710] border border-djzinc-800 text-[11px] font-sans text-amber-200 flex items-start gap-1.5">
                            <Icons.Target size={14} className="inline-block align-[-2px] shrink-0 text-amber-400" />
                            <div>
                                <strong className="font-mono text-[10px] uppercase text-amber-400 mr-1">En Cabina:</strong>
                                <span>{ctrl.when}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Render del Relato Humano, Glosario y Pro Tip
    const renderSectionStoryAndDetails = () => (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-black text-white shadow-sm" style={{ backgroundColor: activeSec.color }}>
                        {activeSec.badge}
                    </span>
                    <span className="text-xs font-mono text-gray-300 uppercase tracking-wider font-bold">
                        {activeSec.tag}
                    </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-mono font-black text-white mt-1">
                    {activeSec.title}
                </h2>
                <div className="p-3 rounded-xl bg-pink-950/40 border border-pink-700/60 text-pink-200 font-sans text-xs italic font-semibold leading-relaxed mt-1">
                    "{activeSec.hook}"
                </div>
            </div>

            {/* Historia Cercana */}
            <div className="p-4 rounded-2xl bg-[#0d0f20] border border-djzinc-750 text-xs font-sans text-gray-200 leading-relaxed space-y-2">
                <p>{activeSec.story}</p>
            </div>

            {/* Tecnicismos Explicados */}
            <div className="space-y-2">
                <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Icons.Bulb size={14} className="inline-block align-[-2px]" /> <span>Conceptos Clave Explicados Fácilmente</span>
                </h4>
                <div className="grid grid-cols-1 gap-2">
                    {(activeSec.jargon || []).map((jg, jIdx) => (
                        <div key={jIdx} className="p-3 rounded-xl bg-[#070814] border border-djzinc-750 text-xs font-sans">
                            <div className="font-mono font-bold text-pink-300 mb-0.5 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                                <span>{jg.term}</span>
                            </div>
                            <p className="text-gray-300 leading-relaxed text-[11.5px]">{jg.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Paso a Paso */}
            <div className="p-4 rounded-2xl bg-[#0c0e1c] border border-djzinc-750 space-y-2">
                <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Icons.Gear size={14} className="inline-block align-[-2px]" /> <span>Flujo de Trabajo Paso a Paso</span>
                </h4>
                <div className="space-y-1.5 text-xs font-sans text-gray-200">
                    {(activeSec.steps || []).map((st, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2">
                            <Icons.Check size={14} className="inline-block align-[-2px] text-pink-400 font-bold shrink-0" />
                            <span className="leading-snug">{st}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pro DJ Tip */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 to-[#0e1022] border border-amber-600/60 text-xs font-sans text-amber-200 flex items-start gap-2.5 shadow-md">
                <Icons.Star size={14} className="inline-block align-[-2px] shrink-0" />
                <div>
                    <strong className="font-mono uppercase tracking-wider text-amber-300 block text-[11px] mb-0.5">Secreto Pro de Cabina</strong>
                    <p className="text-gray-200 leading-relaxed">{activeSec.proTip}</p>
                </div>
            </div>

            {/* Botón de Acción Directo */}
            <div className="pt-2 pb-4">
                <button
                    type="button"
                    onClick={() => {
                        if (onNavigateTab) {
                            onNavigateTab(activeSec.tabId);
                        }
                        onClose();
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 via-fuchsia-600 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-mono font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(236,72,153,0.5)] cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Icons.Rocket size={14} className="inline-block align-[-2px]" />
                    <span>Abrir e Ir a la Sección {activeSec.badge} Ahora</span>
                </button>
            </div>
        </div>
    );

    // Barra de las 8 Secciones Maestras con ALTO CONTRASTE (Sin texto negro)
    const renderSectionsBar = () => (
        <div className="px-3 sm:px-4 py-2 bg-[#080916] border-b border-djzinc-750 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {Object.values(MANUAL_SECTIONS).map(sec => {
                const isActive = activeSectionKey === sec.id;
                return (
                    <button
                        key={sec.id}
                        type="button"
                        onClick={() => {
                            setActiveSectionKey(sec.id);
                            setSimStep(0);
                            setZoomFocus(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                            isActive
                                ? 'bg-gradient-to-r from-pink-500 via-fuchsia-600 to-rose-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.6)] border border-pink-400 scale-105'
                                : 'bg-[#121426] text-gray-200 hover:text-white hover:bg-[#1b1e38] border border-djzinc-750'
                        }`}
                        style={{ color: '#ffffff' }}
                    >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sec.color }}></span>
                        <span>{sec.badge}</span>
                    </button>
                );
            })}
        </div>
    );

    // ─────────────────────────────────────────────────────────────────────────
    // ESTADO PLEGADO: Pestaña vertical adherida al borde derecho
    // ─────────────────────────────────────────────────────────────────────────
    if (isFolded) {
        return ReactDOM.createPortal(
            <div 
                onClick={() => setIsFolded(false)}
                className="fixed top-1/2 -translate-y-1/2 right-0 z-[99999] bg-[#090a18] border-l-2 border-y border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.6)] px-3.5 py-4 rounded-l-2xl cursor-pointer hover:bg-pink-950 hover:translate-x-[-4px] transition-all flex flex-col items-center gap-2 text-white font-mono text-xs select-none animate-fadeIn"
                title="Haga clic para desplegar el Manual Interactivo"
            >
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping"></span>
                <span className="font-black text-pink-200 [writing-mode:vertical-rl] tracking-wider uppercase text-xs rotate-180 flex items-center gap-1.5">
                    <Icons.Knowledge size={14} className="inline-block align-[-2px]" /> MANUAL • {activeSec.badge}
                </span>
                <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-pink-950 text-pink-200 border border-pink-600 font-bold uppercase mt-1">
                    ◀ Desplegar
                </span>
            </div>,
            document.body
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MANUAL EXCLUSIVO: COLUMNA LATERAL DERECHA (DESACOPLADA CON PORTAL)
    // ─────────────────────────────────────────────────────────────────────────
    return ReactDOM.createPortal(
        <div className="fixed inset-0 overflow-hidden select-none pointer-events-none" style={{ zIndex: 99998 }}>
            {/* Backdrop sutil clicable para cerrar */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-[1px] pointer-events-auto transition-opacity"
                style={{ zIndex: 99998 }}
                onClick={onClose}
                title="Haz clic fuera para cerrar el manual y volver a la cabina"
            />

            {/* Columna Lateral Derecha - Redimensionable en Desktop (Drag & Drop), 100% en Móvil */}
            <aside 
                style={{ width: '100%', maxWidth: `${drawerWidth}px`, zIndex: 99999 }}
                className="fixed top-0 bottom-0 right-0 h-full bg-[#080914] border-l-4 border-l-pink-500 shadow-[-30px_0_70px_rgba(0,0,0,0.95)] flex flex-col font-sans text-gray-100 animate-slideInRight select-none pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Manija táctil de redimensión (Drag to Resize) para Desktop */}
                <div 
                    onPointerDown={onResizeDown}
                    onDoubleClick={onResetWidth}
                    className="hidden md:flex absolute top-0 bottom-0 -left-2 w-4 cursor-ew-resize items-center justify-center z-50 group select-none hover:bg-pink-500/10 transition-colors"
                    title="Arrastra para redimensionar el manual (Doble clic para restablecer a 500px)"
                >
                    <div className="w-1 h-12 rounded-full bg-zinc-600 group-hover:bg-pink-400 group-hover:scale-y-125 transition-all shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
                </div>
                {/* Cabecera del Drawer */}
                <div className="px-5 py-3.5 border-b border-djzinc-750 bg-[#0d0f20] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-lg shadow-[0_0_15px_rgba(236,72,153,0.5)] shrink-0">
                            <Icons.Knowledge size={14} className="inline-block align-[-2px]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs sm:text-sm font-mono font-black uppercase text-white tracking-wider">
                                    MANUAL MAESTRO DE CABINA
                                </h3>
                                <span className="text-[9.5px] bg-pink-950 text-pink-200 border border-pink-500 px-2 py-0.5 rounded-full font-black">
                                    60% ANCHO • CABINA ACTIVA
                                </span>
                            </div>
                            <p className="text-[10.5px] text-gray-300 font-mono truncate max-w-[280px] sm:max-w-[400px]">
                                {activeSec.tag}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Botón Plegar */}
                        <button 
                            type="button"
                            onClick={() => setIsFolded(true)}
                            className="px-3 py-1.5 rounded-xl bg-[#14162a] hover:bg-pink-950 text-gray-200 hover:text-pink-200 flex items-center gap-1 font-mono text-xs border border-djzinc-700 hover:border-pink-500 transition-colors cursor-pointer"
                            title="Plegar manual a pestaña lateral para interactuar libremente con la cabina"
                        >
                            <span>⇥</span>
                            <span>Plegar</span>
                        </button>

                        {/* Cerrar */}
                        <button 
                            type="button"
                            onClick={onClose}
                            className="h-8 px-2.5 sm:px-2 rounded-xl bg-[#14162a] hover:bg-rose-950 text-gray-300 hover:text-white flex items-center justify-center gap-1.5 font-mono text-xs border border-djzinc-700 transition-colors cursor-pointer"
                            title="Cerrar manual (ESC)"
                        >
                            <Icons.Close size={14} className="inline-block align-[-2px]" />
                            <span className="sm:hidden font-mono text-[11px]">Cerrar</span>
                        </button>
                    </div>
                </div>

                {/* Barra de Secciones */}
                {renderSectionsBar()}

                {/* Subtabs del Drawer con Alto Contraste (Sin texto negro) */}
                <div className="px-5 py-2 bg-[#0c0e1e] border-b border-djzinc-750 flex items-center justify-between text-xs font-mono shrink-0">
                    <span className="text-gray-300 font-bold uppercase text-[10px] tracking-wider hidden sm:inline">Vistas de Contenido:</span>
                    <div className="flex items-center gap-1 bg-[#14162c] p-1 rounded-xl border border-djzinc-750">
                        {[
                            { id: 'all', label: '🌟 Todo' },
                            { id: 'sim', label: '🎬 Simulador' },
                            { id: 'controls', label: `🎛️ Controles (${activeSec.controls ? activeSec.controls.length : 0})` },
                            { id: 'guide', label: '📖 Guía Pro' }
                        ].map(tb => (
                            <button
                                key={tb.id}
                                type="button"
                                onClick={() => setActiveManualTab(tb.id)}
                                className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                                    activeManualTab === tb.id 
                                        ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)] border border-pink-400' 
                                        : 'text-gray-300 hover:text-white hover:bg-[#1f2242]'
                                }`}
                                style={{ color: '#ffffff' }}
                            >
                                {tb.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cuerpo Scrollable del Drawer */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-6">
                    {(activeManualTab === 'all' || activeManualTab === 'sim') && (
                        renderSimulatorCard()
                    )}

                    {(activeManualTab === 'all' || activeManualTab === 'controls') && (
                        renderControlsCatalog()
                    )}

                    {(activeManualTab === 'all' || activeManualTab === 'guide') && (
                        renderSectionStoryAndDetails()
                    )}
                </div>

                {/* Pie del Drawer - Sticky en móvil para máxima ergonomía */}
                <div className="sticky bottom-0 px-4 sm:px-5 py-3 bg-[#0a0c18]/95 backdrop-blur-md border-t border-djzinc-750 flex items-center justify-between shrink-0 font-mono text-xs z-20">
                    <span className="text-gray-300 text-[10.5px] hidden sm:flex items-center gap-1.5">
                        <Icons.Bulb size={14} className="inline-block align-[-2px]" />
                        <span>Pulsa <strong>Plegar</strong> para usar la cabina visible al 40% detrás sin cerrar</span>
                    </span>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-[10px] text-pink-400 font-bold sm:hidden flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse"></span>
                            MANUAL DJ
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 sm:py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-xs border border-pink-500/60 transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
                        >
                            <Icons.Close size={14} className="inline-block align-[-2px]" />
                            <span>Cerrar Manual</span>
                        </button>
                    </div>
                </div>
            </aside>
        </div>,
        document.body
    );
};

