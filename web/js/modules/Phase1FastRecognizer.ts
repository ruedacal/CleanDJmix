/**
 * BeatWave PRO — Phase 1 Fast Recognizer (Omnichannel Edge & Native Orchestrator)
 * ==============================================================================
 * Orchestrator service consuming native JSI (iOS/Android) or N-API (Desktop) DSP
 * buffers when available, coordinating concurrent local (Olaf LMDB) and remote
 * (Cloudflare Worker Gateway) recognition without platform-locked bridges.
 *
 * Guarantees:
 * 1. Hard latency budget: strictly under 1,750 ms via Promise.race + AbortController.
 * 2. Temporal coherence mechanics: rho = delta_db / delta_sample anchored to capture timestamp.
 * 3. Escalation state machine:
 *    - rho outside [0.96, 1.04] -> ESCALATE_PHASE2 (pitch-shift / tempo fader moved)
 *    - Score >= 88 (Studio) or >= 92 (Club) -> MATCH_CONFIRMED
 *    - Score in [76, minConfirmed - 1] -> PROBATION_BUFFER (requires confirmation on next stride)
 *    - Score < 76 -> NO_MATCH
 * 4. Zero fake fingerprints in production: simulation requires explicit allowSimulationFallback.
 */

import { Phase2RescueClient, EscalationReason } from './Phase2RescueClient';

export type EnvironmentProfile = 'club' | 'studio';

export type RecognitionState =
    | 'IDLE'
    | 'CAPTURING'
    | 'MATCH_CONFIRMED'
    | 'PROBATION_BUFFER'
    | 'ESCALATE_PHASE2'
    | 'RESCUING_PHASE2'
    | 'UNIDENTIFIED_ID'
    | 'NO_MATCH'
    | 'TIMEOUT_FALLBACK'
    | 'ERROR';

export interface TrackMatch {
    title: string;
    artist: string;
    album?: string;
    acrid?: string;
    score: number;             // [0 - 100]
    playOffsetMs: number;       // Posición detectada dentro del tema (ms)
    timestampQueryMs: number;   // Timestamp de captura de la muestra analizada (ms)
    source: 'local_olaf' | 'remote_acrcloud' | 'gpu_neural_conformer' | 'gpu_grafprint_ann';
    label?: string;
    genres?: string[];
    bpmEstimated?: number;
    stemIsolated?: 'drums' | 'bass' | 'other' | 'vocals' | 'full_mix';
    tempoWarpApplied?: number;  // Variación especulativa aplicada por la GPU
}

export interface TelemetryData {
    rmsDbfs: number;
    peakDbfs: number;
    isClipping: boolean;
    durationMs: number;
    sampleRate: number;
    environment: EnvironmentProfile;
    latencyMs: number;
}

export interface RecognitionEvent {
    state: RecognitionState;
    match: TrackMatch | null;
    rho: number;                // Coherencia temporal: delta_db / delta_sample
    pitchShiftSuspected: boolean;
    telemetry: TelemetryData | null;
    message: string;
    timestamp: number;
}

export interface NativeDspResult {
    telemetry: {
        rmsDbfs: number;
        peakDbfs: number;
        isClipping: boolean;
        durationMs: number;
        sampleRate: number;
        environment: string;
    };
    acrcloudFingerprint: Uint8Array | null;
    olafFingerprint: Uint8Array | null;
    landmarksCount: number;
    isValid: boolean;
    nativeAvailable?: boolean;
}

export interface RecognizerConfig {
    workerGatewayUrl: string;
    environment: EnvironmentProfile;
    totalBudgetMs?: number;          // Default 1750 ms
    minScoreStudio?: number;         // Default 88
    minScoreClub?: number;           // Default 92
    probationMinScore?: number;      // Default 76
    rescueEndpoint?: string;         // Default '/v1/rescue' (Fase 2 GPU Cloud)
    rescueTimeoutMs?: number;        // Default 8000 ms
    autoRescuePhase2?: boolean;      // Default true
    allowSimulationFallback?: boolean; // Default false (solo activar en unit tests)
    onStateChange?: (event: RecognitionEvent) => void;
}

interface ProbationRecord {
    candidate: TrackMatch;
    observedAtMs: number;
    strideCount: number;
}

const PROBATION_TTL_MS = 10000;

export class Phase1FastRecognizer {
    private readonly workerGatewayUrl: string;
    private environment: EnvironmentProfile;
    private readonly totalBudgetMs: number;
    private readonly minScoreStudio: number;
    private readonly minScoreClub: number;
    private readonly probationMinScore: number;
    private readonly allowSimulationFallback: boolean;
    private readonly onStateChange?: (event: RecognitionEvent) => void;

    private readonly rescueClient: Phase2RescueClient;
    private readonly autoRescuePhase2: boolean;

    private probationBuffer: Map<string, ProbationRecord> = new Map();
    private lastConfirmedTrack: TrackMatch | null = null;
    private isBusy = false;

    constructor(config: RecognizerConfig) {
        this.workerGatewayUrl = config.workerGatewayUrl.replace(/\/+$/, '');
        this.environment = config.environment || 'club';
        this.totalBudgetMs = config.totalBudgetMs || 1750;
        this.minScoreStudio = config.minScoreStudio || 88;
        this.minScoreClub = config.minScoreClub || 92;
        this.probationMinScore = config.probationMinScore || 76;
        this.allowSimulationFallback = config.allowSimulationFallback === true;
        this.onStateChange = config.onStateChange;

        this.autoRescuePhase2 = config.autoRescuePhase2 !== false;
        this.rescueClient = new Phase2RescueClient({
            rescueEndpoint: config.rescueEndpoint || '/v1/rescue',
            timeoutMs: config.rescueTimeoutMs || 8000,
            onRescueProgress: (stage, message) => {
                if (stage === 'PROCESSING_GPU' || stage === 'UPLOADING') {
                    this.emitState(
                        'RESCUING_PHASE2',
                        null,
                        1.0,
                        true,
                        null,
                        `[Fase 2 GPU] ${message}`
                    );
                }
            }
        });
    }

    public setEnvironment(env: EnvironmentProfile): void {
        this.environment = env;
    }

    public getEnvironment(): EnvironmentProfile {
        return this.environment;
    }

    /**
     * Comprueba si existe un puente DSP nativo real en el runtime actual
     * (JSI en iOS/Android, N-API en shell de escritorio o addon Node compilado).
     */
    public isNativeDspAvailable(): boolean {
        const globalJsi = (typeof globalThis !== 'undefined' ? (globalThis as any).BeatWaveCore : null);
        if (globalJsi && typeof globalJsi.processAudioBuffer === 'function') {
            return true;
        }

        if (typeof window !== 'undefined' && (window as any).beatwaveCore && typeof (window as any).beatwaveCore.processAudioBuffer === 'function') {
            return true;
        }

        try {
            // @ts-ignore
            if (typeof process !== 'undefined' && process.versions && process.versions.node) {
                // @ts-ignore
                const nodeRequire = (typeof require === 'function')
                    // @ts-ignore
                    ? require
                    : ((typeof module !== 'undefined' && module.require) ? module.require : null);
                if (nodeRequire) {
                    const fsMod = nodeRequire('fs');
                    const pathMod = nodeRequire('path');
                    const nodeAddonPath = pathMod.resolve('native/build/beatwave_core.node');
                    return Boolean(fsMod.existsSync(nodeAddonPath));
                }
            }
        } catch {
            return false;
        }

        return false;
    }

    public reset(): void {
        this.probationBuffer.clear();
        this.lastConfirmedTrack = null;
        this.isBusy = false;
        this.emitState('IDLE', null, 1.0, false, null, 'Motor reseteado');
    }

    /**
     * Orquesta el reconocimiento de un buffer Float32Array entrante de hasta 10.0s (stride 2.0s).
     * Aplica Promise.race + AbortController con presupuesto estricto de 1,750 ms.
     */
    public async recognizeBuffer(
        audioPcm: Float32Array,
        sampleRate = 44100
    ): Promise<RecognitionEvent> {
        if (this.isBusy) {
            return this.buildEvent(
                'CAPTURING',
                null,
                1.0,
                false,
                null,
                'Reconocedor ocupado procesando ventana previa'
            );
        }

        this.isBusy = true;
        const startTime = Date.now();
        const budgetController = new AbortController();
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        try {
            const timeoutPromise = new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => {
                    budgetController.abort();
                    reject(new Error(`ABSOLUTE_TIMEOUT_EXCEEDED: Operación superó el límite de ${this.totalBudgetMs} ms`));
                }, this.totalBudgetMs);
            });

            const recognitionPromise = this.executePipeline(
                audioPcm,
                sampleRate,
                startTime,
                budgetController.signal
            );

            const result = await Promise.race([recognitionPromise, timeoutPromise]);
            return result;

        } catch (err: unknown) {
            const error = err as Error;
            const elapsed = Date.now() - startTime;

            if (error.message?.includes('ABSOLUTE_TIMEOUT_EXCEEDED') || error.name === 'AbortError') {
                const event = this.buildEvent(
                    'TIMEOUT_FALLBACK',
                    null,
                    1.0,
                    false,
                    {
                        rmsDbfs: -96,
                        peakDbfs: -96,
                        isClipping: false,
                        durationMs: 0,
                        sampleRate: 8000,
                        environment: this.environment,
                        latencyMs: elapsed
                    },
                    `Fallback preventivo: la búsqueda excedió el presupuesto absoluto de ${this.totalBudgetMs} ms (${elapsed} ms transcurridos)`
                );
                this.notifyListener(event);
                return event;
            }

            const errorEvent = this.buildEvent(
                'ERROR',
                null,
                1.0,
                false,
                null,
                `Fallo en el pipeline de reconocimiento: ${error.message || 'Error desconocido'}`
            );
            this.notifyListener(errorEvent);
            return errorEvent;
        } finally {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
            this.isBusy = false;
        }
    }

    /**
     * Pipeline de ejecución concurrente C++ Native DSP + Parallel Local/Remote matching
     */
    private async executePipeline(
        audioPcm: Float32Array,
        sampleRate: number,
        captureTimestampMs: number,
        signal: AbortSignal
    ): Promise<RecognitionEvent> {
        // 1. Invocación nativa Zero-Copy (JSI o N-API)
        const dspResult = await this.invokeNativeDsp(audioPcm, this.environment, sampleRate);
        const dspDuration = Date.now() - captureTimestampMs;

        if (!dspResult || !dspResult.isValid) {
            const reason = dspResult?.nativeAvailable === false
                ? 'Bridge nativo C++ DSP no disponible en este runtime (requiere enrutamiento REST omnichannel)'
                : 'El buffer procesado no contiene suficiente energía o huellas válidas';

            const noMatchEv = this.buildEvent(
                'NO_MATCH',
                null,
                1.0,
                false,
                dspResult ? {
                    rmsDbfs: dspResult.telemetry.rmsDbfs,
                    peakDbfs: dspResult.telemetry.peakDbfs,
                    isClipping: dspResult.telemetry.isClipping,
                    durationMs: dspResult.telemetry.durationMs,
                    sampleRate: dspResult.telemetry.sampleRate,
                    environment: this.environment,
                    latencyMs: dspDuration
                } : null,
                reason
            );
            this.notifyListener(noMatchEv);
            return noMatchEv;
        }

        const telemetry: TelemetryData = {
            rmsDbfs: dspResult.telemetry.rmsDbfs,
            peakDbfs: dspResult.telemetry.peakDbfs,
            isClipping: dspResult.telemetry.isClipping,
            durationMs: dspResult.telemetry.durationMs,
            sampleRate: dspResult.telemetry.sampleRate,
            environment: this.environment,
            latencyMs: dspDuration
        };

        // 2. Ejecución Concurrente: Local Olaf DB y Remote Cloudflare Gateway
        const localPromise = this.queryLocalOlaf(
            dspResult.olafFingerprint,
            dspResult.landmarksCount,
            captureTimestampMs
        );
        const remotePromise = this.queryRemoteGateway(
            dspResult.acrcloudFingerprint,
            captureTimestampMs,
            signal
        );

        const [localSettled, remoteSettled] = await Promise.allSettled([localPromise, remotePromise]);

        const localMatch = localSettled.status === 'fulfilled' ? localSettled.value : null;
        const remoteMatch = remoteSettled.status === 'fulfilled' ? remoteSettled.value : null;

        const bestCandidate = this.selectBestCandidate(localMatch, remoteMatch);
        telemetry.latencyMs = Date.now() - captureTimestampMs;

        if (!bestCandidate) {
            const event = this.buildEvent(
                'NO_MATCH',
                null,
                1.0,
                false,
                telemetry,
                'Sin coincidencias en catálogo local ni remoto'
            );
            this.notifyListener(event);
            return event;
        }

        // 3. Mecánica Temporal: Cálculo de Coherencia rho = delta_db / delta_sample (sin jitter de red)
        this.pruneStaleProbation(captureTimestampMs);
        const { rho, pitchShiftSuspected } = this.calculateTemporalCoherence(bestCandidate);

        // 4. Máquina de Estados con Escalado Táctico
        const event = this.evaluateStateMachine(bestCandidate, rho, pitchShiftSuspected, telemetry, captureTimestampMs);
        this.notifyListener(event);

        if (event.state === 'ESCALATE_PHASE2' && this.autoRescuePhase2) {
            this.triggerPhase2Rescue(event, audioPcm).catch(err => {
                console.error('[Phase1FastRecognizer] Error no capturado en rescate Fase 2:', err);
            });
        }

        return event;
    }

    /**
     * Orquesta el Rescate Neuronal de Fase 2 (GPU Cloud)
     */
    public async triggerPhase2Rescue(
        escalationEvent: RecognitionEvent,
        _fallbackAudio?: Float32Array
    ): Promise<RecognitionEvent> {
        const startTime = Date.now();
        let reason: EscalationReason = 'TIME_DRIFT_SUSPECTED_PITCH';
        if (escalationEvent.pitchShiftSuspected) {
            reason = 'TIME_DRIFT_SUSPECTED_PITCH';
        } else if (escalationEvent.match && escalationEvent.match.score < this.probationMinScore) {
            reason = 'LOW_CONFIDENCE_PROBATION_EXHAUSTED';
        } else {
            reason = 'MANUAL_RESCUE_TRIGGER';
        }

        this.emitState(
            'RESCUING_PHASE2',
            escalationEvent.match,
            escalationEvent.rho,
            true,
            escalationEvent.telemetry,
            `🚀 Rescate Neuronal Fase 2 activo: aislando stems y corrigiendo pitch-shift en GPU (Motivo: ${reason})...`
        );

        const rescueResult = await this.rescueClient.rescueTrack({
            reason,
            rho: escalationEvent.rho,
            environment: this.environment,
            candidateHint: escalationEvent.match ? {
                artist: escalationEvent.match.artist,
                title: escalationEvent.match.title,
                score: escalationEvent.match.score
            } : null,
            timestampQueryMs: escalationEvent.timestamp
        });

        const elapsed = Date.now() - startTime;
        const telemetry: TelemetryData = {
            rmsDbfs: escalationEvent.telemetry?.rmsDbfs ?? -16.0,
            peakDbfs: escalationEvent.telemetry?.peakDbfs ?? -1.0,
            isClipping: escalationEvent.telemetry?.isClipping ?? false,
            durationMs: 10000,
            sampleRate: 16000,
            environment: this.environment,
            latencyMs: elapsed
        };

        if (rescueResult.success && rescueResult.match) {
            const confirmedMatch: TrackMatch = {
                title: rescueResult.match.title,
                artist: rescueResult.match.artist,
                album: rescueResult.match.album,
                label: rescueResult.match.label,
                score: rescueResult.match.score,
                playOffsetMs: rescueResult.match.playOffsetMs || 0,
                timestampQueryMs: escalationEvent.timestamp,
                source: rescueResult.match.source,
                genres: rescueResult.match.genres,
                stemIsolated: rescueResult.match.stemIsolated,
                tempoWarpApplied: rescueResult.match.tempoWarpApplied
            };

            const confirmedEvent = this.buildEvent(
                'MATCH_CONFIRMED',
                confirmedMatch,
                escalationEvent.rho,
                false,
                telemetry,
                `✓ Pista identificada mediante Rescate Neuronal GPU (${confirmedMatch.artist} - ${confirmedMatch.title}, Stem: ${confirmedMatch.stemIsolated || 'mix'}, Warp: ${confirmedMatch.tempoWarpApplied ? confirmedMatch.tempoWarpApplied + '%' : '0%'})`
            );
            this.lastConfirmedTrack = confirmedMatch;
            this.notifyListener(confirmedEvent);
            return confirmedEvent;
        }

        const unidentifiedEvent = this.buildEvent(
            'UNIDENTIFIED_ID',
            null,
            escalationEvent.rho,
            escalationEvent.pitchShiftSuspected,
            telemetry,
            `❌ UNIDENTIFIED_ID: Pista no identificada tras agotar escaneo rápido y rescate neuronal (${rescueResult.errorMessage || 'Sin coincidencias en catálogo vectorial'}).`
        );
        this.notifyListener(unidentifiedEvent);
        return unidentifiedEvent;
    }

    private pruneStaleProbation(nowMs: number): void {
        for (const [key, record] of this.probationBuffer.entries()) {
            if (nowMs - record.observedAtMs > PROBATION_TTL_MS) {
                this.probationBuffer.delete(key);
            }
        }
    }

    /**
     * Cálculo de Coherencia Temporal rho = delta_db / delta_sample.
     * Utiliza timestamps de captura para evitar distorsión por latencia de red.
     * Descarta saltos negativos (cue/loop rewind) para no falsificar pitch-shift.
     */
    private calculateTemporalCoherence(candidate: TrackMatch): { rho: number; pitchShiftSuspected: boolean } {
        const candidateKey = `${candidate.artist} - ${candidate.title}`.toLowerCase();
        const existingRecord = this.probationBuffer.get(candidateKey);

        const referenceMatch: TrackMatch | null = existingRecord
            ? existingRecord.candidate
            : (this.lastConfirmedTrack && `${this.lastConfirmedTrack.artist} - ${this.lastConfirmedTrack.title}`.toLowerCase() === candidateKey
                ? this.lastConfirmedTrack
                : null);

        if (!referenceMatch) {
            return { rho: 1.000, pitchShiftSuspected: false };
        }

        const deltaSample = candidate.timestampQueryMs - referenceMatch.timestampQueryMs;
        const deltaDb = candidate.playOffsetMs - referenceMatch.playOffsetMs;

        // Requerir ventana mínima de 500ms y avance temporal positivo (evita falsos positivos en hot-cue/loop)
        if (deltaSample < 500 || deltaDb <= 0) {
            return { rho: 1.000, pitchShiftSuspected: false };
        }

        const rho = deltaDb / deltaSample;
        const pitchShiftSuspected = (rho < 0.96 || rho > 1.04);

        return { rho: Number(rho.toFixed(4)), pitchShiftSuspected };
    }

    /**
     * Máquina de Estados de Reconocimiento y Escalado
     */
    private evaluateStateMachine(
        candidate: TrackMatch,
        rho: number,
        pitchShiftSuspected: boolean,
        telemetry: TelemetryData,
        nowMs: number
    ): RecognitionEvent {
        const candidateKey = `${candidate.artist} - ${candidate.title}`.toLowerCase();
        const minConfirmedScore = (this.environment === 'club') ? this.minScoreClub : this.minScoreStudio;

        // Regla 1: Escalado Fase 2 si hay sospecha de Pitch-Shift (rho fuera de [0.96, 1.04])
        if (pitchShiftSuspected) {
            const shiftPct = ((rho - 1.0) * 100).toFixed(1);
            return this.buildEvent(
                'ESCALATE_PHASE2',
                candidate,
                rho,
                true,
                telemetry,
                `Pitch-shift detectado (rho: ${rho}, variación estimada ${shiftPct}%). Escalando a Fase 2 para alineación espectral.`
            );
        }

        // Regla 2: Match Confirmado Directo
        if (candidate.score >= minConfirmedScore) {
            this.probationBuffer.delete(candidateKey);
            this.lastConfirmedTrack = candidate;
            return this.buildEvent(
                'MATCH_CONFIRMED',
                candidate,
                rho,
                false,
                telemetry,
                `✓ Pista identificada con alta certeza (${candidate.score}% en modo ${this.environment.toUpperCase()})`
            );
        }

        // Regla 3: Buffer de Probación [76 - minConfirmedScore)
        if (candidate.score >= this.probationMinScore) {
            const existing = this.probationBuffer.get(candidateKey);
            if (existing && existing.strideCount >= 1) {
                this.probationBuffer.delete(candidateKey);
                this.lastConfirmedTrack = candidate;
                return this.buildEvent(
                    'MATCH_CONFIRMED',
                    candidate,
                    rho,
                    false,
                    telemetry,
                    `✓ Confirmación por consenso temporal acumulado en stride 2 (${candidate.score}%)`
                );
            }

            this.probationBuffer.set(candidateKey, {
                candidate,
                observedAtMs: nowMs,
                strideCount: existing ? existing.strideCount + 1 : 1
            });

            return this.buildEvent(
                'PROBATION_BUFFER',
                candidate,
                rho,
                false,
                telemetry,
                `Score preliminar (${candidate.score}%). En probación: esperando confirmación en el próximo stride de 2s.`
            );
        }

        // Regla 4: Score insuficiente
        return this.buildEvent(
            'NO_MATCH',
            null,
            rho,
            false,
            telemetry,
            `Coincidencia con score bajo (${candidate.score}% < ${this.probationMinScore}%). Continuando escaneo.`
        );
    }

    /**
     * Cálculo real de telemetría PCM (RMS/Peak dBFS) en JS para diagnósticos sin nativo
     */
    private computePcmTelemetry(audio: Float32Array, sampleRate: number, profile: EnvironmentProfile) {
        if (!audio || audio.length === 0) {
            return {
                rmsDbfs: -96.0,
                peakDbfs: -96.0,
                isClipping: false,
                durationMs: 0,
                sampleRate,
                environment: profile
            };
        }
        let sumSq = 0;
        let peak = 0;
        const step = Math.max(1, Math.floor(audio.length / 32768));
        let count = 0;
        for (let i = 0; i < audio.length; i += step) {
            const v = Math.abs(audio[i]);
            sumSq += v * v;
            if (v > peak) peak = v;
            count++;
        }
        const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
        const rmsDbfs = rms > 1e-6 ? 20 * Math.log10(rms) : -96.0;
        const peakDbfs = peak > 1e-6 ? 20 * Math.log10(peak) : -96.0;
        return {
            rmsDbfs: Number(rmsDbfs.toFixed(1)),
            peakDbfs: Number(peakDbfs.toFixed(1)),
            isClipping: peak >= 0.99,
            durationMs: Math.round((audio.length / Math.max(1, sampleRate)) * 1000),
            sampleRate,
            environment: profile
        };
    }

    /**
     * Invocación del bridge nativo Zero-Copy JSI (iOS/Android) / N-API (Desktop)
     */
    private async invokeNativeDsp(
        audio: Float32Array,
        profile: EnvironmentProfile,
        sampleRate: number
    ): Promise<NativeDspResult> {
        // Entorno 1: JSI en React Native / iOS / Android (global.BeatWaveCore)
        const globalJsi = (typeof globalThis !== 'undefined' ? (globalThis as any).BeatWaveCore : null);
        if (globalJsi && typeof globalJsi.processAudioBuffer === 'function') {
            const res = await globalJsi.processAudioBuffer(audio, profile, sampleRate);
            return { ...res, nativeAvailable: true };
        }

        // Entorno 2: N-API en Desktop shell (window.beatwaveCore)
        if (typeof window !== 'undefined' && (window as any).beatwaveCore && typeof (window as any).beatwaveCore.processAudioBuffer === 'function') {
            const res = await (window as any).beatwaveCore.processAudioBuffer(audio, profile, sampleRate);
            return { ...res, nativeAvailable: true };
        }

        // Entorno 3: Addon Node directo compilado localmente
        try {
            // @ts-ignore
            if (typeof process !== 'undefined' && process.versions && process.versions.node) {
                // @ts-ignore
                const nodeRequire = (typeof require === 'function')
                    // @ts-ignore
                    ? require
                    : ((typeof module !== 'undefined' && module.require) ? module.require : null);
                if (nodeRequire) {
                    const pathMod = nodeRequire('path');
                    const nodeAddonPath = pathMod.resolve('native/build/beatwave_core.node');
                    const napiModule = nodeRequire(nodeAddonPath);
                    const res = await napiModule.processAudioBuffer(audio, profile, sampleRate);
                    return { ...res, nativeAvailable: true };
                }
            }
        } catch {
            // Sin addon nativo compilado en este entorno
        }

        const realTelemetry = this.computePcmTelemetry(audio, sampleRate, profile);

        // Solo emitir huellas simuladas si se habilita explícitamente para unit tests
        if (this.allowSimulationFallback) {
            return {
                telemetry: realTelemetry,
                acrcloudFingerprint: new Uint8Array(2532).fill(0xAA),
                olafFingerprint: new Uint8Array(4096).fill(0x55),
                landmarksCount: 512,
                isValid: true,
                nativeAvailable: false
            };
        }

        // En producción sin bridge nativo: nunca enviar bytes falsos a ACRCloud
        return {
            telemetry: realTelemetry,
            acrcloudFingerprint: null,
            olafFingerprint: null,
            landmarksCount: 0,
            isValid: false,
            nativeAvailable: false
        };
    }

    /**
     * Búsqueda en catálogo local Olaf LMDB
     */
    private async queryLocalOlaf(
        olafFingerprint: Uint8Array | null,
        landmarksCount: number,
        captureTimestampMs: number
    ): Promise<TrackMatch | null> {
        if (!olafFingerprint || landmarksCount === 0) return null;

        const globalCore = (typeof globalThis !== 'undefined' ? (globalThis as any).BeatWaveCore : null);
        if (globalCore && typeof globalCore.matchOlafLandmarks === 'function') {
            const match = await globalCore.matchOlafLandmarks(olafFingerprint);
            if (match) {
                return { ...match, timestampQueryMs: captureTimestampMs };
            }
        }

        return null;
    }

    /**
     * Búsqueda en catálogo remoto vía Cloudflare Worker Gateway
     */
    private async queryRemoteGateway(
        acrcloudFingerprint: Uint8Array | null,
        captureTimestampMs: number,
        signal: AbortSignal
    ): Promise<TrackMatch | null> {
        if (!acrcloudFingerprint || acrcloudFingerprint.byteLength === 0) return null;

        const response = await fetch(this.workerGatewayUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'X-Client-Platform': 'BeatWave-Omnichannel-TS'
            },
            body: acrcloudFingerprint,
            signal
        });

        if (!response.ok) {
            return null;
        }

        const data: any = await response.json();
        if (data?.status?.code !== undefined && data.status.code !== 0) {
            return null;
        }

        const music = data?.metadata?.music?.[0];
        if (!music) {
            return null;
        }

        return {
            title: music.title || 'Desconocido',
            artist: music.artists?.[0]?.name || 'Artista Desconocido',
            album: music.album?.name,
            acrid: music.acrid,
            score: Number(music.score ?? 85),
            playOffsetMs: Number(music.play_offset_ms ?? 0),
            timestampQueryMs: captureTimestampMs,
            source: 'remote_acrcloud',
            label: music.label,
            genres: music.genres?.map((g: any) => g.name) || []
        };
    }

    /**
     * Selección del mejor candidato entre resultado local y remoto
     */
    private selectBestCandidate(local: TrackMatch | null, remote: TrackMatch | null): TrackMatch | null {
        if (local && !remote) return local;
        if (!local && remote) return remote;
        if (!local && !remote) return null;

        const adjustedLocalScore = local!.score + 4;
        return (adjustedLocalScore >= remote!.score) ? local : remote;
    }

    private buildEvent(
        state: RecognitionState,
        match: TrackMatch | null,
        rho: number,
        pitchShiftSuspected: boolean,
        telemetry: TelemetryData | null,
        message: string
    ): RecognitionEvent {
        return {
            state,
            match,
            rho,
            pitchShiftSuspected,
            telemetry,
            message,
            timestamp: Date.now()
        };
    }

    private emitState(
        state: RecognitionState,
        match: TrackMatch | null,
        rho: number,
        pitchShiftSuspected: boolean,
        telemetry: TelemetryData | null,
        message: string
    ): void {
        const ev = this.buildEvent(state, match, rho, pitchShiftSuspected, telemetry, message);
        this.notifyListener(ev);
    }

    private notifyListener(event: RecognitionEvent): void {
        if (this.onStateChange) {
            try {
                this.onStateChange(event);
            } catch (e) {
                console.error('[Phase1FastRecognizer] Error en listener onStateChange:', e);
            }
        }
    }
}

export default Phase1FastRecognizer;