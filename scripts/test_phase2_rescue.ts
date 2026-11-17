import { Phase2RescueClient, Phase2RescueRequest, Phase2RescueResult } from '../web/js/modules/Phase2RescueClient';
import { Phase1FastRecognizer, RecognitionEvent } from '../web/js/modules/Phase1FastRecognizer';
import * as path from 'path';

async function runTestSuite() {
    console.log('================================================================');
    console.log(' [TEST SUITE] BEATWAVE PHASE 2 RESCUE CLIENT & ORCHESTRATOR    ');
    console.log('================================================================\n');

    // ------------------------------------------------------------------------
    // TEST 1: Native In-Memory FLAC Retrieval via N-API / JSI Bridge
    // ------------------------------------------------------------------------
    console.log('[TEST 1] Extracción de buffer FLAC nativo en RAM (Zero-Disk)...');
    
    // Ingestar 10s de audio en el addon nativo para alimentar el buffer circular
    const sampleRate = 44100;
    const testAudio = new Float32Array(sampleRate * 10);
    for (let i = 0; i < testAudio.length; i++) {
        testAudio[i] = Math.sin((2 * Math.PI * 135 * i) / sampleRate) * 0.7;
    }

    const nativeAddon = require(path.resolve('native/build/beatwave_core.node'));
    nativeAddon.processAudioBuffer(testAudio, 'club', sampleRate);

    const flacU8 = Phase2RescueClient.retrieveNativeFlacBuffer(testAudio, sampleRate);
    if (!flacU8 || !(flacU8 instanceof Uint8Array) || flacU8.byteLength === 0) {
        throw new Error('Fallo al extraer buffer FLAC desde el bridge nativo');
    }

    const header = String.fromCharCode(...flacU8.slice(0, 4));
    console.log(`  - FLAC bytes extraídos: ${flacU8.byteLength} bytes (~${(flacU8.byteLength / 1024).toFixed(1)} KB)`);
    console.log(`  - Número mágico: '${header}'`);
    if (header !== 'fLaC') {
        throw new Error(`Número mágico inválido: esperado 'fLaC', obtenido '${header}'`);
    }
    console.log('✓ TEST 1 PASADO: retrieveNativeFlacBuffer() extrajo payload FLAC válido en RAM.\n');

    // ------------------------------------------------------------------------
    // TEST 2: HTTP POST Multipart /v1/rescue contra Microservicio Cloud (Local)
    // ------------------------------------------------------------------------
    console.log('[TEST 2] Envío multipart/form-data a /v1/rescue con AbortController...');
    
    let lastProgressStage = '';
    const rescueClient = new Phase2RescueClient({
        rescueEndpoint: 'http://127.0.0.1:8000/v1/rescue',
        timeoutMs: 8000,
        onRescueProgress: (stage, msg) => {
            lastProgressStage = stage;
            console.log(`    [Rescue Stage: ${stage}] ${msg}`);
        }
    });

    const request: Phase2RescueRequest = {
        flacBuffer: flacU8,
        reason: 'TIME_DRIFT_SUSPECTED_PITCH',
        rho: 1.08, // +8% pitch shift
        environment: 'club',
        candidateHint: {
            artist: 'Amelie Lens',
            title: 'In My Mind',
            score: 74
        },
        timestampQueryMs: Date.now()
    };

    const rescueResult = await rescueClient.rescueTrack(request);
    console.log('  - Resultado de Rescate:');
    console.log(`    * Éxito: ${rescueResult.success}`);
    console.log(`    * Estado: ${rescueResult.state}`);
    console.log(`    * Latencia: ${rescueResult.latencyMs} ms`);
    if (rescueResult.match) {
        console.log(`    * Pista: ${rescueResult.match.artist} - ${rescueResult.match.title}`);
        console.log(`    * Score: ${rescueResult.match.score}%`);
        console.log(`    * Stem Aislado: ${rescueResult.match.stemIsolated}`);
        console.log(`    * Tempo Warp Aplicado: ${rescueResult.match.tempoWarpApplied}%`);
    }

    if (!rescueResult.success || rescueResult.state !== 'RESCUED_MATCH') {
        throw new Error(`Fallo en el rescate: ${rescueResult.errorMessage}`);
    }
    console.log('✓ TEST 2 PASADO: /v1/rescue procesó el FLAC y devolvió coincidencia neuronal.\n');

    // ------------------------------------------------------------------------
    // TEST 3: Timeout Extendado (8s AbortController) y Marcado UNIDENTIFIED_ID
    // ------------------------------------------------------------------------
    console.log('[TEST 3] Timeout y Marcado Definitivo como UNIDENTIFIED_ID...');
    
    // Cliente con timeout ultracorto (1 ms) para forzar la activación del AbortController
    const timeoutClient = new Phase2RescueClient({
        rescueEndpoint: 'http://127.0.0.1:8000/v1/rescue',
        timeoutMs: 1, // 1 ms forzará abort inmediato
        onRescueProgress: (stage, msg) => {
            console.log(`    [Timeout Test Progress: ${stage}] ${msg}`);
        }
    });

    const timeoutResult = await timeoutClient.rescueTrack(request);
    console.log(`  - Estado final tras timeout: ${timeoutResult.state}`);
    console.log(`  - Mensaje de diagnóstico: ${timeoutResult.diagnosticLog}`);

    if (timeoutResult.state !== 'UNIDENTIFIED_ID') {
        throw new Error(`Esperado UNIDENTIFIED_ID tras timeout, obtenido ${timeoutResult.state}`);
    }
    if (timeoutResult.success !== false) {
        throw new Error('success debe ser false tras fallo de rescate');
    }
    console.log('✓ TEST 3 PASADO: AbortController abortó la petición y marcó UNIDENTIFIED_ID.\n');

    // ------------------------------------------------------------------------
    // TEST 4: Integración Completa en Phase1FastRecognizer (Auto-Escalado)
    // ------------------------------------------------------------------------
    console.log('[TEST 4] Auto-Escalado e Integración en Phase1FastRecognizer...');

    const emittedEvents: RecognitionEvent[] = [];
    const recognizer = new Phase1FastRecognizer({
        workerGatewayUrl: 'https://beatwave-radar-gateway.workers.dev',
        environment: 'club',
        totalBudgetMs: 1750,
        minScoreClub: 92,
        minScoreStudio: 88,
        probationMinScore: 76,
        rescueEndpoint: 'http://127.0.0.1:8000/v1/rescue',
        rescueTimeoutMs: 8000,
        autoRescuePhase2: true,
        onStateChange: (ev) => {
            emittedEvents.push(ev);
            console.log(`    [Recognizer Event] -> ${ev.state} | ${ev.message}`);
        }
    });

    // Simular evento de escalado
    const escalationEvent: RecognitionEvent = {
        state: 'ESCALATE_PHASE2',
        match: {
            title: 'Overdrive',
            artist: 'Charlotte de Witte',
            score: 72,
            playOffsetMs: 45000,
            timestampQueryMs: Date.now(),
            source: 'remote_acrcloud'
        },
        rho: 1.075, // Pitch acelerado
        pitchShiftSuspected: true,
        telemetry: {
            rmsDbfs: -16.0,
            peakDbfs: -1.2,
            isClipping: false,
            durationMs: 10000,
            sampleRate: 8000,
            environment: 'club',
            latencyMs: 180
        },
        message: 'Pitch shift detectado (rho 1.075)',
        timestamp: Date.now()
    };

    console.log('  - Invocando triggerPhase2Rescue()...');
    const finalEvent = await recognizer.triggerPhase2Rescue(escalationEvent, testAudio);
    console.log(`  - Evento Final Emitido: ${finalEvent.state}`);
    console.log(`  - Pista Rescatada: ${finalEvent.match?.artist} - ${finalEvent.match?.title}`);
    console.log(`  - Warp Aplicado: ${finalEvent.match?.tempoWarpApplied}%`);

    if (finalEvent.state !== 'MATCH_CONFIRMED' || !finalEvent.match) {
        throw new Error('triggerPhase2Rescue no logró recuperar la pista');
    }

    // Verificar secuencia de estados: RESCUING_PHASE2 seguido de MATCH_CONFIRMED
    const hasRescuing = emittedEvents.some(e => e.state === 'RESCUING_PHASE2');
    const hasConfirmed = emittedEvents.some(e => e.state === 'MATCH_CONFIRMED');

    if (!hasRescuing || !hasConfirmed) {
        throw new Error('Secuencia de estados incorrecta durante el auto-escalado');
    }

    console.log('✓ TEST 4 PASADO: Orquestación completa Fase 1 -> Fase 2 validada.\n');

    console.log('================================================================');
    console.log(' TODOS LOS TESTS DE FASE 2 CLIENT & ORQUESTADOR PASARON 100% OK ');
    console.log('================================================================');
}

runTestSuite().catch(err => {
    console.error('\n❌ ERROR EN TEST SUITE:', err);
    process.exit(1);
});
