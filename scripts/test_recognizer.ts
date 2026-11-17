import { Phase1FastRecognizer, RecognitionEvent } from '../web/js/modules/Phase1FastRecognizer';

async function runTests() {
    console.log('=== TEST SUITE: Phase1FastRecognizer (TypeScript Orchestrator) ===\n');

    let lastEmittedEvent: RecognitionEvent | null = null;
    const recognizer = new Phase1FastRecognizer({
        workerGatewayUrl: 'https://beatwave-radar-gateway.workers.dev',
        environment: 'club',
        totalBudgetMs: 1750,
        minScoreClub: 92,
        minScoreStudio: 88,
        probationMinScore: 76,
        onStateChange: (event) => {
            lastEmittedEvent = event;
            console.log(`  [State Event] -> ${event.state} | Rho: ${event.rho} | Msg: ${event.message}`);
        }
    });

    // 1. Simulación de Buffer de audio (10.0s @ 44.1 kHz)
    const audio = new Float32Array(44100 * 10);
    for (let i = 0; i < audio.length; i++) {
        audio[i] = Math.sin((2 * Math.PI * 440 * i) / 44100) * 0.5;
    }

    console.log('[Test 1] Reconocimiento básico con simulación de fallback...');
    const result1 = await recognizer.recognizeBuffer(audio, 44100);
    console.log(`✓ Resultado Test 1: Estado = ${result1.state}\n`);

    // 2. Test de Coherencia Temporal rho: Normal vs Pitch-Shift
    console.log('[Test 2] Simulación de Coherencia Temporal (Escalado Fase 2)...');
    // Acceso a métodos privados para test determinista de caja blanca
    const rec = recognizer as any;

    // Caso A: Normal Playback (rho = 1.000)
    rec.lastConfirmedTrack = {
        title: 'Universal Nation',
        artist: 'Push',
        score: 95,
        playOffsetMs: 60000,
        timestampQueryMs: 10000,
        source: 'remote_acrcloud'
    };

    const nextNormalSample = {
        title: 'Universal Nation',
        artist: 'Push',
        score: 95,
        playOffsetMs: 62000, // Avanzó 2000 ms en track
        timestampQueryMs: 12000, // Avanzó 2000 ms en sample real
        source: 'remote_acrcloud'
    };

    const normalRho = rec.calculateTemporalCoherence(nextNormalSample);
    console.log(`  - Normal Playback: rho = ${normalRho.rho} (Pitch-shift suspected: ${normalRho.pitchShiftSuspected})`);
    if (normalRho.rho !== 1.0 || normalRho.pitchShiftSuspected) {
        throw new Error('Fallo en cálculo de rho normal');
    }
    console.log('✓ Test 2A: Coherencia temporal estándar verificada.\n');

    // Caso B: Pitch Fader a +8% (Hard Techno DJ mix) -> delta_db = 2160 ms para delta_sample = 2000 ms
    const pitchShiftedSample = {
        title: 'Universal Nation',
        artist: 'Push',
        score: 95,
        playOffsetMs: 62160, // Avanzó 2160 ms en track (más rápido)
        timestampQueryMs: 12000, // Avanzó 2000 ms en sample real
        source: 'remote_acrcloud'
    };

    const shiftedRho = rec.calculateTemporalCoherence(pitchShiftedSample);
    console.log(`  - Pitch +8%: rho = ${shiftedRho.rho} (Pitch-shift suspected: ${shiftedRho.pitchShiftSuspected})`);
    if (shiftedRho.rho !== 1.08 || !shiftedRho.pitchShiftSuspected) {
        throw new Error(`Fallo en detección de pitch shift. Esperado 1.08, obtenido ${shiftedRho.rho}`);
    }

    const stateResult = rec.evaluateStateMachine(pitchShiftedSample, shiftedRho.rho, shiftedRho.pitchShiftSuspected, {
        rmsDbfs: -16, peakDbfs: -2.0, isClipping: false, durationMs: 10000, sampleRate: 8000, environment: 'club', latencyMs: 250
    });
    console.log(`  - Transición de Estado resultante: ${stateResult.state}`);
    if (stateResult.state !== 'ESCALATE_PHASE2') {
        throw new Error(`Esperado ESCALATE_PHASE2, obtenido ${stateResult.state}`);
    }
    console.log('✓ Test 2B: Detección y emisión de ESCALATE_PHASE2 validada al 100%.\n');

    // 3. Test de Buffer de Probación [76-91] y Confirmación en Segundo Stride
    console.log('[Test 3] Test de Probación [76-91] y Confirmación en Stride 2...');
    recognizer.reset();

    const probationCandidate = {
        title: 'Age of Love',
        artist: 'Age of Love',
        score: 82, // Dentro de [76, 91]
        playOffsetMs: 30000,
        timestampQueryMs: 10000,
        source: 'remote_acrcloud'
    };

    const probationState1 = rec.evaluateStateMachine(probationCandidate, 1.0, false, {
        rmsDbfs: -16, peakDbfs: -2.0, isClipping: false, durationMs: 10000, sampleRate: 8000, environment: 'club', latencyMs: 200
    });
    console.log(`  - Stride 1: Estado = ${probationState1.state}`);
    if (probationState1.state !== 'PROBATION_BUFFER') {
        throw new Error(`Esperado PROBATION_BUFFER, obtenido ${probationState1.state}`);
    }

    // Stride 2: El mismo candidato llega 2.0s después
    const probationCandidateStride2 = {
        title: 'Age of Love',
        artist: 'Age of Love',
        score: 84,
        playOffsetMs: 32000,
        timestampQueryMs: 12000,
        source: 'remote_acrcloud'
    };

    const probationState2 = rec.evaluateStateMachine(probationCandidateStride2, 1.0, false, {
        rmsDbfs: -16, peakDbfs: -2.0, isClipping: false, durationMs: 10000, sampleRate: 8000, environment: 'club', latencyMs: 210
    });
    console.log(`  - Stride 2: Estado = ${probationState2.state}`);
    if (probationState2.state !== 'MATCH_CONFIRMED') {
        throw new Error(`Esperado MATCH_CONFIRMED en stride 2, obtenido ${probationState2.state}`);
    }
    console.log('✓ Test 3: Buffer de Probación y consenso temporal acumulado validado.\n');

    // 4. Test de Presupuesto Absoluto (Timeout 1,750 ms)
    console.log('[Test 4] Verificación de Presupuesto Absoluto y Fallback no bloqueante...');
    const slowRecognizer = new Phase1FastRecognizer({
        workerGatewayUrl: 'https://beatwave-radar-gateway.workers.dev',
        environment: 'club',
        totalBudgetMs: 50 // Timeout artificial de 50 ms para forzar disparo de timeout
    });

    // Mock de pipeline lento
    (slowRecognizer as any).executePipeline = () => new Promise((resolve) => setTimeout(resolve, 200));

    const timeoutEvent = await slowRecognizer.recognizeBuffer(audio, 44100);
    console.log(`  - Evento recibido tras exceder tiempo: ${timeoutEvent.state} (${timeoutEvent.message})`);
    if (timeoutEvent.state !== 'TIMEOUT_FALLBACK') {
        throw new Error(`Esperado TIMEOUT_FALLBACK, obtenido ${timeoutEvent.state}`);
    }
    console.log('✓ Test 4: Presupuesto absoluto y fallback no bloqueante verificados.\n');

    console.log('=== TODOS LOS TESTS Phase1FastRecognizer HAN PASADO 100% OK ===');
}

runTests().catch((err) => {
    console.error('Error en ejecución de tests:', err);
    process.exit(1);
});
