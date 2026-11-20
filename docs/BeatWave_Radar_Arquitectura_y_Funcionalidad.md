# BeatWave Pro — Radar Acústico (Shazam & Edge DSP)
## Memoria Técnica de Arquitectura, Motores de Reconocimiento y Resumen Funcional

- **Versión:** 2.0 (Clean-Room & Edge Architecture)
- **Plataformas:** Web / macOS / Windows / iOS / Android
- **Fecha:** Noviembre 2026

---

## 1. Dónde están subidos los cambios (Control de Versiones)

Todos los cambios, optimizaciones y arquitectura del **Radar Acústico** se encuentran subidos y versionados en el repositorio Git central del proyecto:

- **Repositorio Remoto:** [https://github.com/ruedacal/CleanDJmix.git](https://github.com/ruedacal/CleanDJmix.git)
- **Rama Activa:** `feature/copilot-v2-native`
- **Últimos Commits Clave en Remoto:**
  - `7dee59e`: *docs(copilot): agregar documento tecnico de arquitectura y resumen funcional en PDF, DOC y MD*
  - `41e1ee7`: *fix(copilot-transport): sincronizacion total en tiempo real para Decks 1 y 2 con Serato y Numark NV II*
  - `bfcf456`: *feat(radar): integrate hybrid local/cloud rescue API with FAISS catalog and live acoustic endpoints*
  - `d579628`: *feat(radar): implement Phase2RescueClient upload orchestrator with AbortController, FLAC Zero-Disk retrieval, and UNIDENTIFIED_ID fallback*
  - `783901b`: *feat(radar): add parallel 16kHz ring buffer and zero-disk FLAC in-memory encoder for Phase 2 neural escalation*
  - `9318c34`: *feat(radar): integrate Phase1FastRecognizer, Live Telemetry HUD and dual Club/Studio DSP into Radar Workspace*
  - `6ddd5ea`: *feat(radar): implement Phase1FastRecognizer orchestrator with 1750ms budget, rho temporal coherence and escalation state machine*
  - `b1b2dd9`: *feat(radar): create Cloudflare Worker edge gateway for secure ACRCloud HMAC-SHA1 fingerprint identification with 1200ms timeout*
  - `2ac2149`: *feat(radar): expose zero-copy processAudioBuffer via JSI (TurboModules) and N-API bindings*
  - `0678a67`: *feat(radar): implement BeatWaveDSP recognition engine, ring buffer, 8kHz normalization and universal CMake toolchain*
  - `5d6a002`: *refactor(workspaces): subfase 4.2 - extraccion modular de Taxonomy, Shazam, Logs y Trends*

---

## 2. Dónde está toda la lógica de Radar (Arquitectura en Detalle)

El subsistema de **Radar Acústico** opera bajo una arquitectura distribuida de 4 niveles:

### A. Frontend — Espacio de Trabajo e Interfaz de Cabina
- **Fichero:** [ShazamWorkspace.jsx](file:///Users/admin/Desktop/DJ_MetaTagger/web/js/workspaces/ShazamWorkspace.jsx)
- **Captura de Micrófono con VU Meter:** Permite escucha pasiva en tiempo real mediante `navigator.mediaDevices.getUserMedia` o grabación hardware por backend. Incluye medidor de nivel RMS acústico, cuenta atrás visual y animación de pulso de radar.
- **Arrastrar y Soltar / Subida de Archivos:** Soporta análisis instantáneo arrastrando cualquier archivo de audio local (WAV, FLAC, MP3, AIFF, AAC) o seleccionando pistas directamente desde el modal de colecciones persistentes.
- **Selector de Motor y Entorno:**
  - Motores: `radar_edge` (Nativo C++ / Edge), `hybrid` (Híbrido ShazamIO + ACRCloud), `shazamio` (ShazamIO nativo) y `audd` (AudD Music API).
  - Perfiles de Entorno: **Club Mode** (umbral estricto Score > 92, calibrado para sonido saturado con reverberación de sala) y **Studio Mode** (Score > 88, alta precisión en entornos limpios).
- **Acciones Directas en 1 Clic:**
  - *Enviar al Pool (Spotify):* Permite buscar y añadir la pista identificada al gestor de descargas o listas.
  - *Enviar a Auditoría:* Traspasa la pista a la mesa de análisis FFT para inyectar tags y Hot Cues.
  - *Preescucha de Muestra:* Reproductor rápido del fragmento oficial identificado.
  - *Historial Persistente:* Registro cronológico local de canciones identificadas con carátulas y enlaces.

### B. Orquestador de Reconocimiento y Coherencia Temporal (Fase 1 y Fase 2)
- **Ficheros:** [Phase1FastRecognizer.ts](file:///Users/admin/Desktop/DJ_MetaTagger/web/js/modules/Phase1FastRecognizer.ts) y [Phase2RescueClient.ts](file:///Users/admin/Desktop/DJ_MetaTagger/web/js/modules/Phase2RescueClient.ts)
- **Presupuesto de Tiempo Estricto (< 1.750 ms):** Mediante `Promise.race` ejecuta la consulta sin bloquear la interfaz de cabina.
- **Cálculo de Coherencia Temporal (Factor $\rho$):** Mide la relación temporal `rho = delta_db / delta_sample`. Si el DJ está alterando el pitch en la controladora (pitch fader movido o pitch-bending en el jog wheel), detecta si la canción está acelerada o ralentizada fuera del rango [0.96, 1.04] para compensarla antes de fallar.
- **Máquina de Estados de Reconocimiento:**
  - `MATCH_CONFIRMED`: Coincidencia certera (Score > 92 en Club o > 88 en Studio).
  - `PROBATION_BUFFER`: Coincidencia provisional (Score 76-91), requiere confirmación en el siguiente bloque de 2 segundos.
  - `ESCALATE_PHASE2` / `RESCUING_PHASE2`: Si la pista es un remix no comercial, un live bootleg o tiene stems aislados (solo vocal o solo percusión), eleva la muestra al motor neuronal de rescate.
  - `UNIDENTIFIED_ID`: Aviso de pista no catalogada en bases de datos acústicas comerciales.

### C. Gateway en el Edge (Cloudflare Worker)
- **Fichero:** [worker.ts](file:///Users/admin/Desktop/DJ_MetaTagger/cloudflare/radar-gateway/worker.ts)
- **Aislamiento de Seguridad:** Las claves maestras de autenticación upstream nunca se exponen al cliente navegador ni a las aplicaciones móviles/escritorio.
- **Firma Criptográfica WebCrypto:** Ejecuta HMAC-SHA1 acelerado por hardware en el Edge en menos de 5 ms sin librerías externas.
- **SLA Garantizado:** Aplica un `AbortController` con timeout de 1.200 ms hacia los servidores centrales de ACRCloud.

### D. Backend — Servicio Multi-Motor en Python
- **Fichero:** [shazam_service.py](file:///Users/admin/Desktop/DJ_MetaTagger/services/shazam_service.py) (Clase: `ShazamRecognitionService`)
- **Escaneo Multi-Segmento Inteligente:** Cuando se analiza un archivo completo en disco, no se limita a escuchar los primeros segundos (que en música electrónica suelen ser intros planas de bombos sin melodía). Escanea estratégicamente: inicio, 25%, mitad (zona de drop) y 75% del archivo.
- **ShazamIO Precision Engine:** Genera huellas acústicas a 16 kHz con rotación automática de User-Agents y gestión de cabeceras para evitar bloqueos por cuota HTTP 429.
- **Fallback de Metadatos Apple Music / iTunes:** Si la huella identifica el track pero faltan datos de alta resolución, consulta automáticamente la API de Apple Music para extraer el arte original en 1400x1400 o 3000x3000px, año exacto de lanzamiento, sello discográfico e ISRC.
- **Caché Acústica Persistente:** Hash MD5/SHA256 del bloque de audio en SQLite para responder en 0 ms si la pista ya fue identificada con anterioridad.

### E. Núcleo C++ Nativo de Audio
- **Ficheros:** [MelSpectrogram.cpp](file:///Users/admin/Desktop/DJ_MetaTagger/native/src/MelSpectrogram.cpp), [BeatWaveDSP.cpp](file:///Users/admin/Desktop/DJ_MetaTagger/native/src/BeatWaveDSP.cpp), [FlacMemoryEncoder.cpp](file:///Users/admin/Desktop/DJ_MetaTagger/native/src/FlacMemoryEncoder.cpp) y cabeceras en `native/include/`.
- Compilado en la librería dinámica `native/build/libbeatwave_radar.dylib`.
- Extracción de espectrogramas Mel acelerados por instrucciones SIMD (AVX / ARM Neon) y compresión en memoria de fragmentos FLAC sin tocar el disco físico.

---

## 3. Resumen Funcional: Qué es la sección Radar y qué buscamos

### A. El Concepto Funcional
El **Radar Acústico** de BeatWave Pro es el módulo de **inteligencia de reconocimiento e ingesta de temas desconocidos**. Resuelve el eterno problema del DJ: *"¿Qué tema está sonando ahora mismo en el club?"* o *"Tengo una grabación de un set o un archivo descargado sin nombre ('Track 01.mp3'), ¿cómo sé qué es y cómo lo incorporo a mi biblioteca?"*.

Funciona como un radar de escucha activa de alta sensibilidad, capaz de identificar tracks comerciales, temas underground de club, remixes y edits no catalogados incluso bajo condiciones acústicas adversas (ruido de público, sonido rebotado en sala o alteraciones de pitch).

### B. Los 4 Objetivos Fundamentales del Radar

| Objetivo Funcional | El Desafío en Cabina / Estudio | La Solución que Aporta el Radar |
| :--- | :--- | :--- |
| **1. Identificación Instantánea por Micrófono** | Estar en cabina escuchando la sesión de otro DJ o en la pista y necesitar saber el tema al instante sin teclear. | Un botón central de Radar activa el micrófono del sistema o de la tarjeta de sonido, captura 7-10 segundos con VU Meter y entrega en menos de 2 segundos título, artista, álbum y sello discográfico. |
| **2. Identificación de Archivos y Sets** | Tener pistas sueltas sin metadatos (IDs de rips de radio, temas de SoundCloud sin tag, o descargas no etiquetadas). | Arrastrar el archivo físico sobre la ventana del Radar. El motor analiza múltiples secciones clave (incluyendo el drop central) y recupera la ficha completa oficial. |
| **3. Tolerancia a Pitch y Ruido de Club** | Los identificadores convencionales fallan si el DJ tiene el pitch subido al +4% o si hay eco y graves retumbando. | El orquestador mide el factor de estiramiento temporal ($\rho$). Si la canción está acelerada en la controladora, compensa la huella acústica y la valida con el perfil *Club Mode* (>92% de coincidencia). |
| **4. Enlace Inmediato con Ingesta y Auditoría** | Tener que copiar a mano el nombre para buscarlo en Spotify o volver a descargarlo. | Botones de acción directa: con 1 clic envías el resultado a **Pool (Spotify)** para descargarlo/sincronizarlo, o a **Auditoría** para inyectar los metadatos y calcular Hot Cues. |

### C. Flujo Operativo Típico en el Radar
1. **Modo Escucha en Cabina:** Pulsas el botón circular central de *"Activar Radar"*. El sistema escucha el sonido del altavoz o del club mediante la tarjeta de audio o micrófono.
2. **Análisis y Filtrado:** El orquestador descarta el ruido de fondo, normaliza el espectro y consulta en paralelo la huella acústica en menos de 1.750 ms.
3. **Ficha de Resultado:** Aparece la carátula en alta definición (1400x1400), el artista, título exacto, versión (Original Mix, Extended, Remix), sello discográfico y segundo exacto de la pista que estaba sonando (`play_offset_ms`).
4. **Preescucha de Confirmación:** Si lo deseas, pulsas el botón de Play en la ficha para escuchar la muestra oficial y verificar que es la versión correcta.
5. **Destino y Guardado:**
   - Pulsas *"Llevar a Pool"*: se abre la pestaña de Spotify para integrarlo en tu playlist de descargas.
   - Pulsas *"Llevar a Auditoría"*: se prepara para etiquetado profesional en tu biblioteca física FLAC/MP3.

---
*BeatWave Pro • CleanDJmix Native Architecture*
