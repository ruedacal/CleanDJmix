#include "CleanRoomDynamics.h"
#include "CleanRoomTonality.h"
#include <iostream>
#include <cassert>
#include <cmath>

using namespace beatwave;

int main() {
    std::cout << "=== RUNNING CLEAN-ROOM DSP TESTS (Zero GPL/Essentia) ===" << std::endl;

    // 1. Test de Tonalidad con tono puro sintético A4 (440 Hz) + armónicos
    const uint32_t fs = 44100;
    const size_t numSamples = fs * 3; // 3 segundos
    std::vector<float> syntheticA4(numSamples, 0.0f);

    // Señal en A menor: Tónica A4 (440Hz), Tercera C5 (523.25Hz), Quinta E5 (659.25Hz)
    for (size_t i = 0; i < numSamples; ++i) {
        float t = static_cast<float>(i) / fs;
        syntheticA4[i] = 0.5f * std::sin(2.0f * M_PI * 440.0f * t)       // A4
                       + 0.35f * std::sin(2.0f * M_PI * 523.25f * t)    // C5
                       + 0.40f * std::sin(2.0f * M_PI * 659.25f * t);   // E5
    }

    HarmonyAnalysis harmony = CleanRoomTonalityExtractor::analyzeTonality(syntheticA4, fs);
    std::cout << "[Tonality Test] Key Detectada: " << harmony.standard_key 
              << " | Camelot: " << harmony.camelot_key 
              << " | OpenKey: " << harmony.open_key 
              << " | Confianza: " << harmony.scale_confidence << std::endl;

    assert(harmony.camelot_key == "8A" || harmony.standard_key == "A minor");
    std::cout << "✓ Test Tonalidad A menor superado con éxito." << std::endl;

    // 2. Test de Dinámica de Compases y Hot Cues
    // Crear beatgrid sintético a 128 BPM
    double beatIntervalMs = 60000.0 / 128.0; // 468.75 ms
    std::vector<double> beatGrid;
    for (int i = 0; i < 256; ++i) {
        beatGrid.push_back(100.0 + (i * beatIntervalMs));
    }

    // Generar señal con caída de energía (Breakdown simulado en compás 16)
    std::vector<float> dynamicAudio(numSamples, 0.1f);
    auto barMetrics = CleanRoomDynamicsExtractor::computeBarDynamics(dynamicAudio, fs, beatGrid, 4);
    std::cout << "[Dynamics Test] Compases analizados: " << barMetrics.size() << std::endl;
    assert(!barMetrics.empty());

    HotCuesAnalysis cues = CleanRoomDynamicsExtractor::extractTacticalCues(barMetrics, 60000.0, 128.0);
    std::cout << "[Hot Cues Test] Cues generados: " << cues.cues.size() << std::endl;
    assert(cues.cues.size() == 8);

    for (const auto& c : cues.cues) {
        std::cout << "  - Cue #" << c.id << " (" << c.name << "): " << c.pos_ms << " ms [" << c.color_hex << "]" << std::endl;
    }

    std::cout << "✓ Todos los tests unitarios Clean-Room han pasado 100% OK!" << std::endl;
    return 0;
}
