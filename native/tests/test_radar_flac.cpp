#include <iostream>
#include <vector>
#include <cmath>
#include <cassert>
#include <fstream>
#include "BeatWaveDSP.h"
#include "FlacMemoryEncoder.h"

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

int main() {
    std::cout << "========================================================\n";
    std::cout << " [TEST SUITE] BEATWAVE PHASE 2 FLAC & ESCALATION BUFFER \n";
    std::cout << "========================================================\n\n";

    // ------------------------------------------------------------------------
    // TEST 1: Direct FlacMemoryEncoder on 10.0s of 16 kHz Mono Audio
    // ------------------------------------------------------------------------
    std::cout << "[TEST 1] FlacMemoryEncoder: 10.0s @ 16 kHz Mono...\n";
    constexpr uint32_t SAMPLE_RATE = 16000;
    constexpr size_t NUM_SAMPLES = SAMPLE_RATE * 10; // 160,000 samples

    std::vector<int16_t> syntheticPcm(NUM_SAMPLES);
    for (size_t i = 0; i < NUM_SAMPLES; ++i) {
        double t = static_cast<double>(i) / SAMPLE_RATE;
        // Kick & sub-bass hard techno synthetic signal: 135 BPM kick sweep + bass rumble
        double kick = std::sin(2.0 * M_PI * 55.0 * t) * 18000.0;
        double sub = std::sin(2.0 * M_PI * 110.0 * t) * 8000.0;
        double lead = std::sin(2.0 * M_PI * 440.0 * t) * 4000.0;
        syntheticPcm[i] = static_cast<int16_t>(kick + sub + lead);
    }

    std::vector<uint8_t> flacBytes = beatwave::audio::FlacMemoryEncoder::encode(
        syntheticPcm.data(),
        syntheticPcm.size(),
        SAMPLE_RATE,
        1
    );

    std::cout << "  - Uncompressed PCM size: " << (syntheticPcm.size() * sizeof(int16_t)) << " bytes (320 KB)\n";
    std::cout << "  - Compressed FLAC size:   " << flacBytes.size() << " bytes\n";
    float compressionRatio = static_cast<float>(flacBytes.size()) / (syntheticPcm.size() * sizeof(int16_t));
    std::cout << "  - Compression Ratio:      " << (compressionRatio * 100.0f) << "%\n";

    assert(!flacBytes.empty());
    assert(flacBytes.size() >= 4);
    // Verificar número mágico 'fLaC'
    assert(flacBytes[0] == 'f' && flacBytes[1] == 'L' && flacBytes[2] == 'a' && flacBytes[3] == 'C');
    // Verificar metadata block header: STREAMINFO (0x80) con longitud 34 bytes (0x22)
    assert(flacBytes[4] == 0x80);
    assert(flacBytes[5] == 0x00 && flacBytes[6] == 0x00 && flacBytes[7] == 0x22);
    // Verificar que comprimió por debajo del 70% del tamaño original
    assert(compressionRatio < 0.70f);
    std::cout << "  -> [PASS] Magic Header, STREAMINFO y ratio de compresión verificados.\n\n";

    // ------------------------------------------------------------------------
    // TEST 2: Parallel 16 kHz Ring Buffer Retention in BeatWaveDSP
    // ------------------------------------------------------------------------
    std::cout << "[TEST 2] BeatWaveDSP Parallel Ingestion & 16 kHz Circular Retention...\n";
    beatwave::radar::BeatWaveDSP dsp(beatwave::radar::RadarEnvironmentMode::Club);

    // Ingestar 5 bloques de 2.0s a 44100 Hz estéreo (total 10.0s de audio)
    constexpr uint32_t IN_SAMPLE_RATE = 44100;
    constexpr size_t BLOCK_SAMPLES_PER_CHANNEL = IN_SAMPLE_RATE * 2; // 2 segundos
    constexpr size_t TOTAL_SAMPLES_STEREO = BLOCK_SAMPLES_PER_CHANNEL * 2; // 2 canales

    std::vector<float> stereoChunk(TOTAL_SAMPLES_STEREO);
    int fingerprintCallbacksCount = 0;

    for (int chunkIdx = 0; chunkIdx < 5; ++chunkIdx) {
        for (size_t i = 0; i < BLOCK_SAMPLES_PER_CHANNEL; ++i) {
            double t = static_cast<double>(chunkIdx * 2) + static_cast<double>(i) / IN_SAMPLE_RATE;
            float left = static_cast<float>(std::sin(2.0 * M_PI * 135.0 * t) * 0.7);
            float right = static_cast<float>(std::sin(2.0 * M_PI * 135.0 * t) * 0.7);
            stereoChunk[i * 2] = left;
            stereoChunk[i * 2 + 1] = right;
        }

        dsp.ingestAudioStream(
            stereoChunk.data(),
            stereoChunk.size(),
            2, // Stereo
            IN_SAMPLE_RATE,
            [&fingerprintCallbacksCount](const beatwave::radar::FingerprintResult& fp) {
                if (fp.is_valid) {
                    fingerprintCallbacksCount++;
                }
            }
        );
    }

    std::cout << "  - Fingerprint Phase 1 callbacks disparados: " << fingerprintCallbacksCount << "\n";
    std::cout << "  - Muestras acumuladas en buffer de escalado (16 kHz): " 
              << dsp.getEscalationBufferedSamples() << " / " << dsp.getEscalationCapacitySamples() << "\n";

    assert(dsp.getEscalationBufferedSamples() == dsp.getEscalationCapacitySamples());

    // ------------------------------------------------------------------------
    // TEST 3: Extraer Buffer de Escalado Comprimido en FLAC (Zero-Copy)
    // ------------------------------------------------------------------------
    std::cout << "\n[TEST 3] Extraction via getEscalationBufferFLAC()...\n";
    std::vector<uint8_t> escalationFlac = dsp.getEscalationBufferFLAC();

    std::cout << "  - Escalation FLAC bytes: " << escalationFlac.size() << "\n";
    assert(!escalationFlac.empty());
    assert(escalationFlac[0] == 'f' && escalationFlac[1] == 'L' && escalationFlac[2] == 'a' && escalationFlac[3] == 'C');

    // Guardar archivo temporal para validación con soundfile / ffmpeg
    const std::string flacDumpPath = "/tmp/beatwave_escalation_test.flac";
    std::ofstream flacFile(flacDumpPath, std::ios::binary);
    flacFile.write(reinterpret_cast<const char*>(escalationFlac.data()), escalationFlac.size());
    flacFile.close();
    std::cout << "  - Guardado dump para verificación externa: " << flacDumpPath << "\n";
    std::cout << "  -> [PASS] getEscalationBufferFLAC() 100% operativo.\n\n";

    std::cout << "========================================================\n";
    std::cout << " ALL BEATWAVE PHASE 2 FLAC & RETENTION TESTS PASSED!   \n";
    std::cout << "========================================================\n";
    return 0;
}
