#include "BeatWaveDSP.h"
#include <iostream>
#include <vector>
#include <cmath>
#include <cassert>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

using namespace beatwave::radar;

int main() {
    std::cout << "=== RUNNING BEATWAVE RADAR DSP TESTS (Phase 1) ===" << std::endl;

    // 1. Inicialización en Modo Club (HPF 120 Hz para estrés Hard Techno)
    BeatWaveDSP radarDsp(RadarEnvironmentMode::Club);
    assert(radarDsp.getEnvironmentMode() == RadarEnvironmentMode::Club);
    std::cout << "✓ Modo Club configurado (HPF 120Hz + LPF 3800Hz)." << std::endl;

    // 2. Generación de 10 segundos de audio sintético estéreo a 44100 Hz
    // Simula estrés Hard Techno:
    // - Sub-grave agresivo a 45 Hz (debe ser filtrado drásticamente por el HPF 120 Hz)
    // - Golpe de bombo/caja y armónicos de sintetizador a 800 Hz, 1500 Hz y 2800 Hz
    const uint32_t sampleRate = 44100;
    const uint32_t channels = 2;
    const double durationSec = 10.0;
    const size_t totalFrames = static_cast<size_t>(durationSec * sampleRate);
    const size_t totalSamples = totalFrames * channels;

    std::vector<float> testAudio(totalSamples);
    for (size_t i = 0; i < totalFrames; ++i) {
        double t = static_cast<double>(i) / sampleRate;
        // Sub-grave masivo (45 Hz) con alta amplitud (debe ser eliminado)
        double subBass = 0.8 * std::sin(2.0 * M_PI * 45.0 * t);
        // Contenido tonal reconocible (800 Hz, 1600 Hz, 2400 Hz)
        double midSynth = 0.4 * std::sin(2.0 * M_PI * 800.0 * t) +
                          0.3 * std::sin(2.0 * M_PI * 1600.0 * t) +
                          0.2 * std::sin(2.0 * M_PI * 2400.0 * t);

        float val = static_cast<float>(subBass + midSynth);
        testAudio[i * 2] = val;     // Canal L
        testAudio[i * 2 + 1] = val; // Canal R
    }

    std::cout << "[DSP Pipeline] Procesando buffer de 10.0s estéreo @ 44.1 kHz..." << std::endl;

    // 3. Ejecución del pipeline de acondicionamiento y extracción
    FingerprintResult fpResult = radarDsp.processSingleBuffer(
        testAudio.data(),
        testAudio.size(),
        channels,
        sampleRate
    );

    std::cout << "[Métricas DSP Resultantes]" << std::endl;
    std::cout << "  - Tasa de muestreo objetivo: " << fpResult.sample_rate << " Hz" << std::endl;
    std::cout << "  - Duración procesada: " << fpResult.duration_ms << " ms" << std::endl;
    std::cout << "  - Nivel RMS: " << fpResult.rms_dbfs << " dBFS (Target: -16.0 dBFS)" << std::endl;
    std::cout << "  - Techo de Pico: " << fpResult.peak_dbfs << " dBFS (Limit: <= -1.0 dBFS)" << std::endl;

    // Validaciones de contrato DSP
    assert(fpResult.sample_rate == 8000);
    assert(fpResult.duration_ms >= 9900 && fpResult.duration_ms <= 10100);
    assert(fpResult.peak_dbfs <= -0.99f); // Pico nunca supera -1.0 dBFS
    assert(std::abs(fpResult.rms_dbfs - (-16.0f)) < 0.5f); // RMS dentro de -16 ± 0.5 dBFS
    std::cout << "✓ Normalización RMS a -16 dBFS y Limitador a -1 dBFS verificados." << std::endl;

    // 4. Validación de Huella Remota ACRCloud
    assert(!fpResult.acrcloud_fingerprint.empty());
    std::cout << "  - Huella ACRCloud generada en memoria: " 
              << fpResult.acrcloud_fingerprint.size() << " bytes (Zero-Copy)." << std::endl;
    std::cout << "✓ Extracción ACRCloud en RAM validada." << std::endl;

    // 5. Validación de Huella Local Olaf LMDB
    assert(!fpResult.olaf_fingerprint.empty());
    assert(fpResult.olaf_landmarks_count > 0);
    // Verificar encabezado binario "OLAF"
    assert(fpResult.olaf_fingerprint[0] == 'O');
    assert(fpResult.olaf_fingerprint[1] == 'L');
    assert(fpResult.olaf_fingerprint[2] == 'A');
    assert(fpResult.olaf_fingerprint[3] == 'F');

    std::cout << "  - Huella Olaf LMDB generada en memoria: " 
              << fpResult.olaf_fingerprint.size() << " bytes con " 
              << fpResult.olaf_landmarks_count << " landmarks." << std::endl;
    std::cout << "✓ Extracción Olaf LMDB en RAM validada." << std::endl;

    // 6. Test de Ingestión en Streaming con Ring Buffer (10.0s ventana / 2.0s stride)
    std::cout << "[Ring Buffer Test] Simulando streaming en tiempo real (12.5s de audio en bloques de 1024 muestras)..." << std::endl;
    int extractionCount = 0;
    const size_t chunkSize = 1024;
    const size_t streamTotalSamples = static_cast<size_t>(12.5 * sampleRate * channels);
    std::vector<float> streamBuffer(streamTotalSamples, 0.2f);

    for (size_t offset = 0; offset < streamTotalSamples; offset += chunkSize) {
        size_t count = std::min(chunkSize, streamTotalSamples - offset);
        radarDsp.ingestAudioStream(
            streamBuffer.data() + offset,
            count,
            channels,
            sampleRate,
            [&](const FingerprintResult& res) {
                extractionCount++;
                assert(res.is_valid);
                std::cout << "  [Stream Callback #" << extractionCount << "] Huella extraída @ "
                          << res.duration_ms << " ms | RMS: " << res.rms_dbfs << " dBFS" << std::endl;
            }
        );
    }

    // A los 12.5s deben haberse disparado extracciones (10s inicial + 2s stride)
    assert(extractionCount >= 2);
    std::cout << "✓ Ring Buffer (10.0s / 2.0s stride) streaming validado (" << extractionCount << " triggers)." << std::endl;

    std::cout << "\n=== TODOS LOS TESTS BEATWAVE RADAR DSP HAN PASADO 100% OK ===" << std::endl;
    return 0;
}
