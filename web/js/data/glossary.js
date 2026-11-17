// Glosario Acústico & Técnico DJ Integral de BeatWave Pro

export const BEATWAVE_MASTER_GLOSSARY = [
    // DSP & ACÚSTICA AVANZADA (AUDIO INFORMATION RETRIEVAL)
    {
        term: "FFT (Fast Fourier Transform)",
        category: "DSP & Acústica",
        tag: "ESPECTRO",
        color: "#06b6d4",
        icon: "🔬",
        definition: "Transformada Rápida de Fourier. Algoritmo matemático que descompone en tiempo real una forma de onda de audio del dominio temporal al espectro de frecuencias (magnitud y fase). Es la base del análisis espectral, la detección precisa de transitorios del bombo y la calibración armónica en BeatWave Pro.",
        formula: "X[k] = ∑ x[n] · e^(-i 2π k n / N) (N=2048, Hop=512)",
        impact: "Permite visualizar el espectro 3-band y aislar frecuencias para Beatgrid y tonalidad."
    },
    {
        term: "Crest Factor (Factor de Cresta)",
        category: "DSP & Acústica",
        tag: "DINÁMICA",
        color: "#f59e0b",
        icon: "📊",
        definition: "Relación en decibelios entre la amplitud pico máxima de la señal y su valor medio cuadrático (RMS). Cuantifica el grado de compresión y limitación en el mastering. Un Crest Factor bajo (< 7.5 dB) indica transitorios comprimidos y bombos saturados propios de Hard Techno o Schranz, mientras que valores altos (> 12 dB) reflejan dinámica orgánica.",
        formula: "CF (dB) = 20 · log10( Peak / RMS )",
        impact: "Diferencia de inmediato pistas ultracomprimidas de temas con dinámica natural para masterizar la ganancia del mixer."
    },
    {
        term: "Zero-Crossing Rate (ZCR)",
        category: "DSP & Acústica",
        tag: "RUGOSIDAD",
        color: "#ec4899",
        icon: "⚡",
        definition: "Tasa de cruces por cero. Mide la frecuencia con la que la onda de audio atraviesa el eje de amplitud cero por unidad de tiempo. En música electrónica revela el contenido de altas frecuencias, la aspereza de sintetizadores distorsionados y la presencia de componentes ruidosos o percusivos frente a tonos sinusoidales puros.",
        formula: "ZCR = (1 / 2N) ∑ |sgn(x[n]) - sgn(x[n-1])|",
        impact: "Identifica texturas industriales, bombos crujientes y saturación analógica en el Drop."
    },
    {
        term: "Spectral Centroid (Centroide Espectral)",
        category: "DSP & Acústica",
        tag: "TIMBRE",
        color: "#8b5cf6",
        icon: "🌈",
        definition: "Centro de gravedad del espectro de frecuencias ponderado por su magnitud. Correlaciona directamente con la percepción psicoacústica de 'brillo' u 'oscuridad' sonora. Un centroide bajo (< 1600 Hz) caracteriza al Raw y Hypnotic Techno; un centroide elevado (> 2600 Hz) define la estridencia de Acid, Industrial o Peak Time.",
        formula: "fc = ∑ (f · |X(f)|) / ∑ |X(f)|",
        impact: "Permite emparejar pistas por balance tímbrico para que la mezcla no suene ni opaca ni chillona."
    },
    {
        term: "Spectral Flatness (Entropía de Wiener)",
        category: "DSP & Acústica",
        tag: "RUIDO / TONAL",
        color: "#10b981",
        icon: "📐",
        definition: "Medida del aplanamiento espectral calculada como el cociente entre la media geométrica y la media aritmética del espectro de potencia. Valores cercanos a 0 indican presencia de tonos armónicos puros (sintetizadores de Melodic Techno), mientras que valores cercanos a 1 indican ruido blanco o percusiones metálicas (Hard Groove / Industrial).",
        formula: "Flatness = exp( (1/N) ∑ ln(|X|^2) ) / ( (1/N) ∑ |X|^2 )",
        impact: "Separa automáticamente tracks melódicos y armónicos de producciones percusivas y ruidosas."
    },
    {
        term: "Drop Window MIR (Ventana de Clímax)",
        category: "DSP & Acústica",
        tag: "DETECCIÓN",
        color: "#ef4444",
        icon: "💥",
        definition: "Algoritmo de perfilado energético por RMS que analiza la canción en bloques de 4 segundos para localizar la ventana de 12 segundos con máxima presión acústica (Drop 1 o Drop 2). Al omitir intros minimalistas y parones etéreos, la extracción de descriptores se realiza exclusivamente en el clímax sonoro.",
        formula: "Ventana 12s @ Max RMS Energy Profile",
        impact: "Evita falsos positivos de género derivados de introducciones desnudas o breakdowns ambientales."
    },
    {
        term: "Rumble Sub-Bass Ratio (20–60 Hz vs 60–140 Hz)",
        category: "DSP & Acústica",
        tag: "SUB-GRAVES",
        color: "#22d3ee",
        icon: "🔊",
        definition: "Cociente entre la energía sub-grave continua (cola de rumble generada con reverb/retraso filtrado) y el golpe seco del bombo (punch). Crucial en el Techno contemporáneo: permite discernir si un track tiene un subgrave rodante masivo (Hard/Raw Techno) o una línea de bajo corta y punteada (Tech House / Melodic).",
        formula: "Ratio = E(20–60 Hz) / E(60–140 Hz)",
        impact: "Previene saturación en el sistema de sonido del club al ecualizar los subgraves en la mezcla."
    },
    {
        term: "Danzabilidad (Danceability)",
        category: "DSP & Acústica",
        tag: "PSICO-RITMO",
        color: "#a855f7",
        icon: "💃",
        definition: "Descriptor psicoacústico que evalúa la regularidad rítmica, la estabilidad del pulso 4-on-the-floor, la fuerza de los transitorios percusivos y la consistencia del groove. Puntuación del 0% al 100% que predice la naturalidad con la que el público responde con movimiento corporal continuo en pista.",
        formula: "Algoritmo Multi-Onsets + Regularidad de Fase",
        impact: "Garantiza tracks con tracción física irresistible para mantener la pista de baile en movimiento."
    },
    {
        term: "LUFS Integrado & True Peak",
        category: "DSP & Acústica",
        tag: "SONORIDAD",
        color: "#14b8a6",
        icon: "📏",
        definition: "Loudness Units relative to Full Scale según norma internacional EBU R128 e ITU-R BS.1770. Mide el volumen percibido por el oído humano en lugar del pico eléctrico. El True Peak detecta picos inter-muestrales generados tras la conversión analógica, evitando distorsión en etapas de potencia.",
        formula: "EBU R128 (-14 a -6 LUFS) • True Peak < -0.5 dBTP",
        impact: "Nivelación matemática de ganancias entre temas para no tocar el trim del mezclador durante la sesión."
    },
    {
        term: "Dynamic Range (DR / Rango Dinámico)",
        category: "DSP & Acústica",
        tag: "DINÁMICA",
        color: "#f97316",
        icon: "🎚️",
        definition: "Diferencia de sonoridad entre los pasajes más enérgicos del track y el promedio RMS general (medición estilo DR Meter). Un rango dinámico adecuado preserva el impacto del kick y evita la fatiga auditiva en el público durante sesiones de más de tres horas.",
        formula: "DR = Top 20% RMS - Media Acústica (dB)",
        impact: "Mantiene la pegada física en el pecho sin emborronar las frecuencias medias del sintetizador."
    },
    {
        term: "ID3v2.4 & Serato GEOB Tags",
        category: "DSP & Acústica",
        tag: "METADATOS",
        color: "#0284c7",
        icon: "💾",
        definition: "Estructura binaria avanzada de encapsulación en formato ID3v2.4 UTF-8. Las etiquetas GEOB (General Encapsulated Object) almacenan Beatgrids milimétricos, puntos Hot Cue nombrados, colores RGB corporativos y mapas de tempo compatibles nativamente con Serato DJ Pro, Rekordbox y Traktor Pro.",
        formula: "Trama GEOB: 'Serato Markers_V2' + 'BeatWave Pro Cues'",
        impact: "Carga instantánea de Cues y BPM de alta fidelidad en cualquier reproductor o cabina sin reanálisis."
    },
    {
        term: "Teorema de Nyquist-Shannon",
        category: "DSP & Acústica",
        tag: "MUESTREO",
        color: "#6366f1",
        icon: "📉",
        definition: "Ley matemática de procesamiento digital de señales: para muestrear una onda analógica sin distorsión por aliasing, la frecuencia de muestreo (Fs) debe ser estrictamente superior al doble de la componente espectral más alta (Fmax). Por ello, el estándar de audio CD a 44.1 kHz cubre exactamente el límite del oído humano hasta 22.05 kHz.",
        formula: "Fs ≥ 2 · Fmax • Límite Nyquist = Fs / 2",
        impact: "Explica por qué un MP3 de 128 kbps con corte a 16 kHz suena apagado frente a un FLAC sin pérdidas a 44.1/48 kHz."
    },
    {
        term: "Dithering & Ruido TPDF",
        category: "DSP & Acústica",
        tag: "CUANTIZACIÓN",
        color: "#84cc16",
        icon: "🎲",
        definition: "Inyección intencional de ruido estocástico no correlacionado con función de densidad triangular (TPDF) al reducir la profundidad de bits (ej. de 24-bit o 32-bit float a 16-bit). Elimina la distorsión armónica no lineal generada por el truncamiento de muestras, transformando el error en un suave siseo uniforme inaudible.",
        formula: "TPDF Dither: e[n] = (rand1 - rand2) · LSB",
        impact: "Preserva la reverberación y colas de silencio sin chirridos digitales en los breakdowns de cabina."
    },
    {
        term: "Cancelación de Fase en Subgraves",
        category: "DSP & Acústica",
        tag: "FASE / CLUB",
        color: "#ef4444",
        icon: "⚠️",
        definition: "Interferencia destructiva originada cuando dos pistas reproducen simultáneamente componentes en la banda de 30-100 Hz con desfase cercano a 180°. Las presiones acústicas se anulan físicamente en el aire del club, haciendo desaparecer por completo la pegada del bombo en la pista.",
        formula: "Δθ = 180° ⇒ y_total = y1 - y2 ≈ 0",
        impact: "Exige la regla de oro: nunca mezclar dos bombos con sus faders de LOW abiertos a la vez (Bass Swapping)."
    },
    {
        term: "Anti-Aliasing Filter (Brickwall LPF)",
        category: "DSP & Acústica",
        tag: "FILTRADO",
        color: "#a855f7",
        icon: "🛡️",
        definition: "Filtro paso-bajas analógico y digital de pendiente ultraempinada (brickwall) situado antes de la digitalización ADC o resampling. Corta cualquier componente armónica por encima de Fs/2 para evitar que se pliegue hacia el espectro audible como frecuencias fantasma inarmónicas.",
        formula: "Atenuación > 96 dB @ F > Fs / 2",
        impact: "Garantiza un sonido cristalino y nítido al cambiar el pitch de una canción en vivo."
    },
    {
        term: "Headroom Acústico del Mixer",
        category: "Cabina & Decks",
        tag: "GANANCIA",
        color: "#f59e0b",
        icon: "🎚️",
        definition: "Margen de seguridad en decibelios existente entre el nivel nominal de trabajo (0 dBVU / +4 dBu) y el umbral de distorsión analógica o clip digital absoluto (0 dBFS). Mantener un headroom de +6 a +12 dB en los canales permite que los transitorios del bombo respiren sin aplastamiento.",
        formula: "Headroom = Nivel de Clip (0 dBFS) - Nivel RMS",
        impact: "Evita que el sonido del club se comprima y sature cuando suenan dos decks a la vez."
    },
    // CABINA & HARDWARE
    {
        term: "Downbeat (Beat 1.0.0)",
        category: "Cabina & Decks",
        tag: "MÉTRICA",
        color: "#06b6d4",
        icon: "🎯",
        definition: "Primer golpe o pulso fuerte de un compás de 4 tiempos (4/4). Marcar el Hot Cue 1 en el downbeat exacto garantiza que las transiciones queden matemáticamente alineadas sin desfase rítmico ni choque de bombos.",
        formula: "Compás 4/4 • T1 (1.0.0)",
        impact: "Alineación de fraseo (frase de 16/32 compases) en Rekordbox, Serato y Traktor."
    },
    {
        term: "Beatgrid & Cuantización",
        category: "Cabina & Decks",
        tag: "TEMPORAL",
        color: "#38bdf8",
        icon: "🎛️",
        definition: "Malla temporal microscópica superpuesta a la forma de onda de audio. La cuantización fuerza a los Hot Cues, bucles y transiciones a anclarse automáticamente al pulso más cercano, evitando desviaciones humanas al tocar los pads.",
        formula: "Resolución: 1/16 beat @ 60fps",
        impact: "Garantiza loops sin imperfecciones y saltos en directo 100% rítmicos."
    },
    {
        term: "Hot Cues Tácticos (1–8)",
        category: "Cabina & Decks",
        tag: "ESTRUCTURA",
        color: "#f59e0b",
        icon: "🏷️",
        definition: "Marcadores de acceso instantáneo mapeados a los 8 pads de la controladora DJ. BeatWave Pro estandariza la convención NV2: CUE 1 (Intro/Downbeat), CUE 2 (Build-up), CUE 3 (Drop Principal), CUE 4 (Break/Breakdown), CUE 5 (Segundo Drop) y CUE 8 (Outro Seguro).",
        formula: "8 Cues • Colores NV2 Corporativos",
        impact: "Navegación espacial instantánea por la estructura del track en cualquier reproductor."
    },
    {
        term: "Slip Mode",
        category: "Cabina & Decks",
        tag: "REPRODUCCIÓN",
        color: "#10b981",
        icon: "⚡",
        definition: "Modo de reproducción donde la música continúa corriendo en silencio en segundo plano mientras el DJ ejecuta scratch, bucles manuales o reverse. Al soltar el pad o jogwheel, la canción retoma exactamente en el compás donde estaría normalmente.",
        formula: "Playhead Virtual Continuo",
        impact: "Permite trucos rítmicos sin perder la sincronización con el otro deck."
    },
    {
        term: "Master Tempo (Key Lock)",
        category: "Cabina & Decks",
        tag: "DSP TONAL",
        color: "#a855f7",
        icon: "🔒",
        definition: "Algoritmo de time-stretching en tiempo real que preserva la tonalidad original (pitch/key) de una pista incluso al alterar drásticamente su velocidad (BPM) con el fader de pitch.",
        formula: "Pitch Shift = 0 semitonos @ ΔBPM",
        impact: "Evita el efecto 'voces de pitufo' o ralentizaciones graves al ajustar tempo."
    },
    {
        term: "Zero-Crossing (Paso por Cero)",
        category: "Cabina & Decks",
        tag: "DSP AUDIO",
        color: "#ec4899",
        icon: "✂️",
        definition: "Punto exacto de la onda sonora donde la amplitud eléctrica cruza el eje de 0 voltios. Colocar cortes y Hot Cues en el zero-crossing previene micro-chasquidos (clicks o pops) que pueden dañar altavoces de gran potencia.",
        formula: "Amplitud: V(t) = 0.00 V",
        impact: "Transiciones limpias sin ruidos parásitos en sistemas de sonido de club."
    },

    // DSP & ACÚSTICA
    {
        term: "Bass Clash (Conflicto de Graves)",
        category: "DSP & Acústica",
        tag: "CRÍTICO",
        color: "#ef4444",
        icon: "⚠️",
        definition: "Solapamiento destructivo de energía de sub-graves (<120 Hz) entre dos pistas reproduciéndose simultáneamente. Genera cancelación de fase acústica, pérdida de pegada en el bombo y sobrecarga en los amplificadores de subgraves del club.",
        formula: "Energía Sub-Bass > 44% en ambos Decks",
        impact: "BeatWave Copilot emite alerta y activa corte preventivo de EQ Low (-6dB a -12dB)."
    },
    {
        term: "Anti-Muddy DSP",
        category: "DSP & Acústica",
        tag: "ALGORITMO",
        color: "#10b981",
        icon: "🛡️",
        definition: "Motor algorítmico exclusivo de BeatWave Pro que analiza el espectro combinado de frecuencias de ambos decks en tiempo real para predecir y disipar el enmascaramiento sonoro antes de que el DJ abra el fader en la mesa de mezclas.",
        formula: "Análisis espectral FFT de 512 bandas",
        impact: "Mezclas diáfanas y cristalinas con punch absoluto en sala grande."
    },
    {
        term: "LUFS Integrado (EBU R128)",
        category: "DSP & Acústica",
        tag: "SONORIDAD",
        color: "#38bdf8",
        icon: "📊",
        definition: "Unidad de Sonoridad Relativa a Escala Completa que mide la potencia acústica percibida por el oído humano a lo largo de toda la pista. Estándar club recomendado: -7.0 a -6.0 LUFS para tracks de música electrónica comercial.",
        formula: "Curva de ponderación K (ITU-R BS.1770)",
        impact: "Asegura niveles homogéneos de ganancia sin saturación ni saltos de volumen."
    },
    {
        term: "True Peak (dBTP)",
        category: "DSP & Acústica",
        tag: "DINÁMICA",
        color: "#fbbf24",
        icon: "📈",
        definition: "Nivel de pico inter-muestra que reconstruye analógicamente la señal sonora entre muestras digitales. Superar 0.0 dBTP genera recorte duro (clipping) en los convertidores DAC de mesas de club como Pioneer DJM-V10 o Allen & Heath Xone:96.",
        formula: "Over-sampling x4 inter-sample peak",
        impact: "Mantiene la señal bajo -0.3 dBTP para evitar distorsión analógica."
    },
    {
        term: "Espectro Tri-Banda (3-Way Split)",
        category: "DSP & Acústica",
        tag: "VISUALIZADOR",
        color: "#06b6d4",
        icon: "🌈",
        definition: "Visualización de forma de onda dividida en 3 rangos espectrales: Azul Oscuro para Graves y Sub-bajos (<200 Hz), Naranja/Cian para Medios y Voces (200 Hz – 2.5 kHz), y Blanco Puro para Agudos y Transitorios (>2.5 kHz).",
        formula: "Low (<200Hz) • Mid • High (>2.5kHz)",
        impact: "Permite al DJ anticipar visualmente bajadas, drops y entradas vocales al segundo."
    },

    // ARMONÍA & CAMELOT
    {
        term: "Camelot Wheel",
        category: "Armonía & Camelot",
        tag: "TEORÍA",
        color: "#ec4899",
        icon: "🎡",
        definition: "Sistema circular de 24 casillas que traduce el círculo de quintas a 12 números (1 al 12) y dos letras: A para tonalidades menores y B para tonalidades mayores. Permite a cualquier DJ seleccionar la pista armónica perfecta de un vistazo.",
        formula: "12 números x 2 modos (A/B)",
        impact: "Evita notas disonantes y melodías enfrentadas en mezclas largas."
    },
    {
        term: "Energy Boost (+2 Camelot)",
        category: "Armonía & Camelot",
        tag: "PSICO-ENERGÍA",
        color: "#f59e0b",
        icon: "🚀",
        definition: "Técnica armónica que consiste en saltar dos posiciones horarias en la rueda de Camelot (ejemplo: de 8A a 10A, o de 11B a 1B). Provoca una elevación inmediata de la tensión emocional y la euforia en la pista de baile.",
        formula: "Key actual + 2 (ej. 8A → 10A / Bm → C#m)",
        impact: "Ideal para momentos culminantes y cambios de energía en festivales."
    },
    {
        term: "Mezcla Diatónica (+1 / -1)",
        category: "Armonía & Camelot",
        tag: "ARMONÍA PURA",
        color: "#10b981",
        icon: "🎵",
        definition: "Mezcla entre casillas vecinas de la rueda Camelot (ejemplo: 8A con 7A o 9A). Al compartir casi todas las notas de sus respectivas escalas, las melodías y líneas de bajo se entrelazan de forma 100% natural sin choques tonales.",
        formula: "Quinta Justa ascendente (+1) o descendente (-1)",
        impact: "La regla de oro para sets continuos, fluidos e hipnóticos."
    },
    {
        term: "Modo Relativo (A ↔ B)",
        category: "Armonía & Camelot",
        tag: "CAMBIO DE COLOR",
        color: "#8b5cf6",
        icon: "🎭",
        definition: "Transición entre la tonalidad menor y su mayor relativa en el mismo número de la rueda (ejemplo: 8A/La menor a 8B/Do mayor). Ambas tonalidades comparten exactamente las mismas notas, transformando el mood de oscuro a luminoso.",
        formula: "Tono relativo: Mismo número, distinta letra",
        impact: "Inyección de luz y épica en breaks vocales sin cambiar centro tonal."
    },

    // PSICOACÚSTICA & IA
    {
        term: "Energía (0–100%)",
        category: "Psicoacústica & IA",
        tag: "POTENCIA",
        color: "#f97316",
        icon: "⚡",
        definition: "Métrica calculada por algoritmos de Machine Learning que combina la densidad rítmica de los transitorios, el volumen de frecuencias medias-altas y la compresión espectral para calibrar la fuerza percibida en pista.",
        formula: "ML Acoustic Energy Index",
        impact: "Permite programar la curva de intensidad del set sin bajones inesperados."
    },
    {
        term: "Intensidad (Arousal)",
        category: "Psicoacústica & IA",
        tag: "ACTIVACIÓN",
        color: "#10b981",
        icon: "📈",
        definition: "Nivel de activación fisiológica y excitación motora que la música induce en el sistema nervioso del oyente (frecuencia cardíaca y ganas de bailar). Rango de 0% (relajación/chillout) a 100% (frenesí rave / peak time).",
        formula: "Russells Circumplex Arousal Axis",
        impact: "Gestiona el ritmo biológico del público durante sesiones de más de 3 horas."
    },
    {
        term: "Positividad (Valence)",
        category: "Psicoacústica & IA",
        tag: "VALENCIA",
        color: "#06b6d4",
        icon: "✨",
        definition: "Valencia afectiva y emocional de una pista de audio. Valores cercanos al 0% indican temas oscuros, industriales, densos o melancólicos; valores cercanos al 100% reflejan temas eufóricos, alegres, veraniegos o festivos.",
        formula: "Affective Valence Meter (0.0 – 1.0)",
        impact: "Alinea la selección musical con la vibra exacta de la noche y el público."
    },
    {
        term: "Mood & Fase de Set",
        category: "Psicoacústica & IA",
        tag: "ESTRATEGIA",
        color: "#c084fc",
        icon: "🧭",
        definition: "Clasificación táctica del rol de cada pista dentro de la sesión DJ: Warm-up (construcción inicial), Mid-Set Groove (mantenimiento de ritmo), Peak Time Climax (momento de máxima euforia) y Afterhours (ritmo hipnótico para cierre).",
        formula: "Clasificador Heurístico Multicriterio",
        impact: "Sugiere automáticamente las mejores pistas de entrada para cada hora del evento."
    },

    // METADATOS & SUITES DJ
    {
        term: "ID3v2.4 UTF-8",
        category: "Metadatos & Suites",
        tag: "ESTÁNDAR",
        color: "#38bdf8",
        icon: "💾",
        definition: "Versión más avanzada y robusta del estándar internacional de metadatos de audio MP3/WAV/AIFF. El uso de codificación UTF-8 previene caracteres corruptos (mojibake) en pantallas táctiles de Pioneer CDJ-3000 y Denon SC6000.",
        formula: "ID3v2.4.0 • Codificación UTF-8 pura",
        impact: "Títulos, artistas y comentarios legibles al 100% en cualquier cabina del mundo."
    },
    {
        term: "Rekordbox XML",
        category: "Metadatos & Suites",
        tag: "PIONEER DJ",
        color: "#0284c7",
        icon: "💿",
        definition: "Estructura jerárquica nativa de Pioneer DJ que almacena metadatos enriquecidos, listas de reproducción, memoria de Hot Cues con milisegundos exactos y coordenadas del beatgrid para exportación rápida a pendrives USB.",
        formula: "Rekordbox 6/7 Master XML Schema",
        impact: "Carga instantánea de colecciones en equipos estándar de club (CDJ/XDJ)."
    },
    {
        term: "Serato Markers2",
        category: "Metadatos & Suites",
        tag: "SERATO DJ",
        color: "#00d1e8",
        icon: "🎚️",
        definition: "Bloque de datos binarios almacenado en el tag ID3 GEOB (General Encapsulated Object) de Serato DJ Pro. Contiene los colores RGB de los 8 Hot Cues, bucles guardados y configuraciones de scratch sin requerir bases de datos externas.",
        formula: "GEOB:Serato Markers2 Binary Chunk",
        impact: "Los Hot Cues aparecen con sus colores corporativos exactos al pinchar en Serato."
    },
    {
        term: "Traktor NML",
        category: "Metadatos & Suites",
        tag: "NATIVE INST.",
        color: "#facc15",
        icon: "⚡",
        definition: "Formato de archivo XML nativo de Native Instruments Traktor Pro 3/4. Registra los puntos de acceso CUE, GRID, FADE-IN, FADE-OUT y bucles tipo POI para sincronización en directo.",
        formula: "Traktor Collection NML v19+",
        impact: "Compatibilidad absoluta con controladores Traktor Kontrol S4/X1/Z2."
    },
    {
        term: "VirtualDJ POI",
        category: "Metadatos & Suites",
        tag: "ATOMIX VDJ",
        color: "#f97316",
        icon: "🎧",
        definition: "Puntos de Interés (POI) propios del motor VirtualDJ 2024. Permite automatizar transiciones por stem separation, avisos de corte de frecuencias y marcas de mezcla armónica por compás.",
        formula: "VirtualDJ Extended VDJ_POI Tag",
        impact: "Desbloquea el máximo potencial de mezcla con Stems acústicos en directo."
    }
];
