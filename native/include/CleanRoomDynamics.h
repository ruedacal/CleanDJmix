#pragma once

#include "BeatWaveTypes.h"
#include <vector>
#include <cstdint>
#include <string>

namespace beatwave {

struct BarEnergyMetric {
    uint32_t bar_index{0};
    double start_time_ms{0.0};
    double end_time_ms{0.0};
    double rms_broadband_db{0.0};
    double rms_sub_bass_db{0.0};    // 20 Hz - 60 Hz
    double crest_factor_db{0.0};
    double peak_amplitude{0.0};
};

class CleanRoomDynamicsExtractor {
public:
    CleanRoomDynamicsExtractor();
    ~CleanRoomDynamicsExtractor();

    /**
     * @brief Extrae métricas de dinámica por compás (4 beats) a partir del beatgrid y audio PCM.
     * Detecta caídas bruscas de >= -6 dB acopladas a pérdida de energía sub-bass (20-60 Hz)
     * para ubicar breakdowns, drops y puntos de mezcla (Outro).
     */
    static std::vector<BarEnergyMetric> computeBarDynamics(
        const std::vector<float>& pcmMono,
        uint32_t sampleRate,
        const std::vector<double>& beatGridMs,
        uint32_t beatsPerBar = 4
    );

    /**
     * @brief Genera los 8 Hot Cues tácticos usando análisis de complejidad dinámica determinista.
     * Cero dependencias GPL/Essentia.
     */
    static HotCuesAnalysis extractTacticalCues(
        const std::vector<BarEnergyMetric>& barMetrics,
        double totalDurationMs,
        double bpm
    );

    /**
     * @brief Calcula RMS global, factor de cresta y densidad por bandas de frecuencia
     */
    static DescriptorsAnalysis computeAcousticDescriptors(
        const std::vector<float>& pcmMono,
        uint32_t sampleRate,
        const std::vector<BarEnergyMetric>& barMetrics
    );

private:
    // Filtro Biquad Butterworth pasa-banda IIR de 2º orden para sub-bass (20-60 Hz)
    struct BiquadBandpass {
        float b0{0.0f}, b1{0.0f}, b2{0.0f}, a1{0.0f}, a2{0.0f};
        float z1{0.0f}, z2{0.0f};

        void init(float f_low, float f_high, float fs);
        float process(float in);
        void reset();
    };
};

} // namespace beatwave
