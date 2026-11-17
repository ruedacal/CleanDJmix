/**
 * BeatWave PRO — Phase 2 Neural Rescue Client (Frontend Orchestrator)
 * ==============================================================================
 * Orchestrator service in charge of uploading the high-quality in-memory FLAC
 * buffer (16 kHz mono, 10s window) to the GPU Cloud Rescue Microservice (/v1/rescue)
 * upon receiving the ESCALATE_PHASE2 signal from Phase 1.
 *
 * Guarantees:
 * 1. Non-blocking UI execution: runs entirely asynchronous with zero main thread freezes.
 * 2. Generous latency budget: 8,000 ms absolute timeout controlled via AbortController.
 * 3. Zero-Disk RAM extraction: retrieves the retained FLAC payload directly from
 *    JSI (React Native) or N-API (Desktop / Tauri) without filesystem I/O.
 * 4. Multi-part payload: sends FLAC binary along with temporal drift telemetry
 *    (rho, reason, environment, candidate_hint) to guide GPU source separation / tempo warp.
 * 5. Definitive fallback: transitions explicitly to 'UNIDENTIFIED_ID' if Phase 2 fails or times out.
 */

export type EscalationReason =
    | 'TIME_DRIFT_SUSPECTED_PITCH'
    | 'LOW_CONFIDENCE_PROBATION_EXHAUSTED'
    | 'SPECTRAL_DENSITY_SATURATION'
    | 'MANUAL_RESCUE_TRIGGER';

export interface RescuedTrackMatch {
    title: string;
    artist: string;
    album?: string;
    label?: string;
    score: number;                     // [0 - 100]
    stemIsolated?: 'drums' | 'bass' | 'other' | 'vocals' | 'full_mix';
    tempoWarpApplied?: number;         // Porcentaje de warp aplicado por la GPU (ej. +3.5%)
    source: 'gpu_neural_conformer' | 'gpu_grafprint_ann';
    playOffsetMs?: number;
    genres?: string[];
    acrid?: string;
}

export interface Phase2RescueRequest {
    flacBuffer?: Uint8Array | null;
    reason: EscalationReason;
    rho: number;
    environment: 'club' | 'studio';
    candidateHint?: {
        artist?: string;
        title?: string;
        score?: number;
    } | null;
    timestampQueryMs?: number;
}

export interface Phase2RescueResult {
    success: boolean;
    state: 'RESCUED_MATCH' | 'UNIDENTIFIED_ID';
    match: RescuedTrackMatch | null;
    latencyMs: number;
    reason: EscalationReason;
    errorMessage?: string;
    diagnosticLog?: string;
}

export interface Phase2ClientConfig {
    rescueEndpoint?: string;           // Default: '/v1/rescue' or 'https://api.beatwave.cloud/v1/rescue'
    timeoutMs?: number;                // Default: 8000 ms
    onRescueProgress?: (stage: 'UPLOADING' | 'PROCESSING_GPU' | 'RESOLVED' | 'FAILED', message: string) => void;
}

export class Phase2RescueClient {
    private readonly rescueEndpoint: string;
    private readonly timeoutMs: number;
    private readonly onRescueProgress?: (stage: 'UPLOADING' | 'PROCESSING_GPU' | 'RESOLVED' | 'FAILED', message: string) => void;
    private isRescuing = false;

    constructor(config: Phase2ClientConfig = {}) {
        this.rescueEndpoint = config.rescueEndpoint || '/v1/rescue';
        this.timeoutMs = config.timeoutMs || 8000;
        this.onRescueProgress = config.onRescueProgress;
    }

    /**
     * Extrae el buffer FLAC retenido a 16 kHz en memoria RAM desde el bridge nativo.
     * Soporta JSI (React Native), N-API (Desktop / Tauri) y Node.js.
     */
    public static retrieveNativeFlacBuffer(
        fallbackAudio?: Float32Array,
        sampleRate = 44100
    ): Uint8Array | null {
        // 1. JSI en React Native (global.BeatWaveCore)
        const globalJsi = (typeof globalThis !== 'undefined' ? (globalThis as any).BeatWaveCore : null);
        if (globalJsi && typeof globalJsi.getEscalationBufferFLAC === 'function') {
            try {
                const res = globalJsi.getEscalationBufferFLAC(fallbackAudio, sampleRate);
                if (res && res instanceof Uint8Array && res.byteLength > 0) {
                    return res;
                }
            } catch (e) {
                console.warn('[Phase2RescueClient] Error en JSI getEscalationBufferFLAC:', e);
            }
        }

        // 2. Window object en Desktop (Tauri / Electron)
        if (typeof window !== 'undefined' && (window as any).beatwaveCore?.getEscalationBufferFLAC) {
            try {
                const res = (window as any).beatwaveCore.getEscalationBufferFLAC(fallbackAudio, sampleRate);
                if (res && res instanceof Uint8Array && res.byteLength > 0) {
                    return res;
                }
            } catch (e) {
                console.warn('[Phase2RescueClient] Error en window.beatwaveCore getEscalationBufferFLAC:', e);
            }
        }

        // 3. Node.js N-API directo (Tests / Daemon local)
        try {
            // @ts-ignore
            if (typeof process !== 'undefined' && process.versions && process.versions.node) {
                // @ts-ignore
                const nodeRequire = (typeof require === 'function')
                    // @ts-ignore
                    ? require
                    : ((typeof module !== 'undefined' && module.require) ? module.require : null);
                if (nodeRequire) {
                    const nodePath = 'path';
                    const pathMod = nodeRequire(nodePath);
                    const nodeAddonPath = pathMod.resolve('native/build/beatwave_core.node');
                    const napi = nodeRequire(nodeAddonPath);
                    if (typeof napi.getEscalationBufferFLAC === 'function') {
                        const res = napi.getEscalationBufferFLAC(fallbackAudio, sampleRate);
                        if (res && res instanceof Uint8Array && res.byteLength > 0) {
                            return res;
                        }
                    }
                }
            }
        } catch {
            // Ignorar fuera de entorno Node compilado
        }

        return null;
    }

    /**
     * Orquesta la subida asíncrona del búfer FLAC al microservicio GPU Cloud.
     * No bloquea el hilo de renderizado (UI), aplica AbortController con timeout de 8s.
     */
    public async rescueTrack(request: Phase2RescueRequest): Promise<Phase2RescueResult> {
        const startTime = Date.now();
        this.isRescuing = true;
        this.emitProgress('UPLOADING', `Preparando payload FLAC para rescate neuronal GPU (Motivo: ${request.reason})...`);

        // 1. Obtener buffer FLAC (si no vino inyectado, extraerlo de RAM nativa)
        let flacBytes = request.flacBuffer;
        if (!flacBytes || flacBytes.byteLength === 0) {
            flacBytes = Phase2RescueClient.retrieveNativeFlacBuffer();
        }

        if (!flacBytes || flacBytes.byteLength === 0) {
            this.isRescuing = false;
            const msg = 'No se encontró un búfer FLAC retenido válido en memoria RAM para el rescate';
            this.emitProgress('FAILED', msg);
            return {
                success: false,
                state: 'UNIDENTIFIED_ID',
                match: null,
                latencyMs: Date.now() - startTime,
                reason: request.reason,
                errorMessage: msg,
                diagnosticLog: `[Phase2RescueClient] Buffer FLAC vacío. Estado final marcado como UNIDENTIFIED_ID.`
            };
        }

        // 2. Preparar el formulario multipart/form-data
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, this.timeoutMs);

        try {
            const formData = new FormData();

            // Empaquetar bytes FLAC como Blob / File en memoria
            const blobBytes = flacBytes.buffer.slice(flacBytes.byteOffset, flacBytes.byteOffset + flacBytes.byteLength);
            const flacBlob = new Blob([blobBytes], { type: 'audio/flac' });
            formData.append('audio', flacBlob, 'escalation_rescue.flac');

            // Metadatos tácticos para orientar la red neuronal en la GPU
            formData.append('reason', request.reason);
            formData.append('rho', request.rho.toString());
            formData.append('environment', request.environment);
            formData.append('timestamp', (request.timestampQueryMs || Date.now()).toString());

            if (request.candidateHint) {
                formData.append('candidate_hint', JSON.stringify(request.candidateHint));
            }

            this.emitProgress('PROCESSING_GPU', `Audio FLAC transmitido (${(flacBytes.byteLength / 1024).toFixed(1)} KB). Inferencia Conformer + Source Separation en ejecución...`);

            // 3. Envío HTTP POST asíncrono hacia el endpoint /v1/rescue
            const response = await fetch(this.rescueEndpoint, {
                method: 'POST',
                headers: {
                    'X-Client-Platform': 'BeatWave-Hybrid-Phase2',
                    'X-Escalation-Reason': request.reason
                },
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const elapsed = Date.now() - startTime;

            if (!response.ok) {
                const statusText = response.statusText || `HTTP ${response.status}`;
                const msg = `El servidor GPU respondió con error de rescate: ${statusText}`;
                this.isRescuing = false;
                this.emitProgress('FAILED', msg);
                return {
                    success: false,
                    state: 'UNIDENTIFIED_ID',
                    match: null,
                    latencyMs: elapsed,
                    reason: request.reason,
                    errorMessage: msg,
                    diagnosticLog: `[Phase2RescueClient] Error HTTP ${response.status} tras ${elapsed} ms. Marcado UNIDENTIFIED_ID.`
                };
            }

            const data = await response.json();

            // 4. Procesar respuesta de la red neuronal / búsqueda vectorial ANN
            if (data?.status === 'success' && data?.match) {
                const match: RescuedTrackMatch = {
                    title: data.match.title || 'Desconocido',
                    artist: data.match.artist || 'Artista Desconocido',
                    album: data.match.album,
                    label: data.match.label,
                    score: Number(data.match.score || 95),
                    stemIsolated: data.match.stem_isolated || 'full_mix',
                    tempoWarpApplied: data.match.tempo_warp_applied ? Number(data.match.tempo_warp_applied) : undefined,
                    source: data.match.source || 'gpu_neural_conformer',
                    playOffsetMs: data.match.play_offset_ms,
                    genres: data.match.genres || ['Electronic'],
                    acrid: data.match.acrid
                };

                this.isRescuing = false;
                this.emitProgress('RESOLVED', `✓ Pista rescatada por red neuronal (${match.artist} - ${match.title}, Score: ${match.score}%)`);

                return {
                    success: true,
                    state: 'RESCUED_MATCH',
                    match,
                    latencyMs: elapsed,
                    reason: request.reason,
                    diagnosticLog: `[Phase2RescueClient] Coincidencia neuronal verificada: ${match.artist} - ${match.title} en ${elapsed} ms.`
                };
            }

            // Si el backend no encontró coincidencia en el catálogo ANN
            this.isRescuing = false;
            const notFoundMsg = 'El motor neuronal GPU no halló coincidencias concluyentes en el catálogo vectorial';
            this.emitProgress('FAILED', notFoundMsg);

            return {
                success: false,
                state: 'UNIDENTIFIED_ID',
                match: null,
                latencyMs: elapsed,
                reason: request.reason,
                errorMessage: notFoundMsg,
                diagnosticLog: `[Phase2RescueClient] ANN Search no arrojó vecinos cercanos suficientes. Marcado definitivamente como UNIDENTIFIED_ID.`
            };

        } catch (err: unknown) {
            clearTimeout(timeoutId);
            this.isRescuing = false;
            const elapsed = Date.now() - startTime;
            const error = err as Error;

            const isTimeout = (error.name === 'AbortError' || error.message?.includes('aborted') || elapsed >= this.timeoutMs);
            const errDescription = isTimeout 
                ? `Timeout extendido de rescate agotado tras ${elapsed} ms (límite: ${this.timeoutMs} ms)`
                : `Fallo de red o transporte: ${error.message || 'Error desconocido'}`;

            this.emitProgress('FAILED', errDescription);

            return {
                success: false,
                state: 'UNIDENTIFIED_ID',
                match: null,
                latencyMs: elapsed,
                reason: request.reason,
                errorMessage: errDescription,
                diagnosticLog: `[Phase2RescueClient] ${errDescription}. Pista marcada definitivamente como UNIDENTIFIED_ID.`
            };
        }
    }

    public getIsRescuing(): boolean {
        return this.isRescuing;
    }

    private emitProgress(stage: 'UPLOADING' | 'PROCESSING_GPU' | 'RESOLVED' | 'FAILED', message: string): void {
        if (this.onRescueProgress) {
            try {
                this.onRescueProgress(stage, message);
            } catch (e) {
                console.error('[Phase2RescueClient] Error en callback de progreso:', e);
            }
        }
    }
}

export default Phase2RescueClient;
