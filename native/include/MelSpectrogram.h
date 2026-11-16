#pragma once

#include <vector>
#include <cstdint>
#include <cmath>
#include <string>

namespace beatwave {

struct MelConfig {
    uint32_t sample_rate{22050};
    uint32_t n_fft{1024};
    uint32_t hop_length{512};
    uint32_t n_mels{128};
    float f_min{30.0f};
    float f_max{10000.0f};
    float log_multiplier{10000.0f};
    float log_offset{1.0f};
};

class MelSpectrogramExtractor {
public:
    explicit MelSpectrogramExtractor(const MelConfig& config = MelConfig());
    ~MelSpectrogramExtractor();

    /**
     * @brief Computa el Mel-espectrograma de un buffer de audio float mono.
     * Retorna un tensor plano en formato [num_frames, 128] listo para inyección ONNX.
     * @param audio Buffer de audio normalizado.
     * @param outNumFrames Devuelve la cantidad de frames calculados.
     * @return std::vector<float> Tensor contiguo de dimensiones [num_frames * 128].
     */
    std::vector<float> compute(const std::vector<float>& audio, size_t& outNumFrames);

    const MelConfig& getConfig() const { return m_config; }

private:
    void initHannWindow();
    void initMelFilterbank();

    static inline float hzToMel(float hz) {
        return 2595.0f * std::log10(1.0f + hz / 700.0f);
    }

    static inline float melToHz(float mel) {
        return 700.0f * (std::pow(10.0f, mel / 2595.0f) - 1.0f);
    }

    MelConfig m_config;
    std::vector<float> m_window;          // Ventana Hann precalculada
    std::vector<float> m_filterbank;      // Matriz aplanada [n_mels x (n_fft / 2 + 1)]
    
    // Punteros opacos para FFTW si está disponible
    void* m_fftwPlan{nullptr};
    double* m_fftwIn{nullptr};
    void* m_fftwOut{nullptr};
};

} // namespace beatwave
