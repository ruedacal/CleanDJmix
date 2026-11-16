#pragma once

#include "BeatWaveTypes.h"
#include "AudioDecoderResampler.h"
#include "MelSpectrogram.h"
#include <string>
#include <vector>
#include <memory>

// ONNX Runtime C++ API forward declarations / includes
#if __has_include(<onnxruntime_cxx_api.h>)
    #include <onnxruntime_cxx_api.h>
    #define HAVE_ONNXRUNTIME 1
#else
    #define HAVE_ONNXRUNTIME 0
#endif

namespace beatwave {

struct BeatThisInferenceResult {
    std::vector<float> beat_logits;       // Logits temporales de Beat [num_frames]
    std::vector<float> downbeat_logits;   // Logits temporales de Downbeat [num_frames]
    size_t num_frames{0};
    double frame_duration_ms{0.0};
};

class BeatThisRhythmEngine {
public:
    BeatThisRhythmEngine();
    ~BeatThisRhythmEngine();

    /**
     * @brief Carga el modelo ONNX de "Beat This! (Transformer)".
     * Configura el entorno Ort::Env con optimizaciones SIMD y ejecución multi-core.
     */
    bool loadModel(const std::string& modelPath);

    /**
     * @brief Pipeline completo: Decodifica a 22.05 kHz -> Mel-Spectrogram -> ONNX -> IOI Median -> Beatgrid.
     */
    RhythmAnalysis analyzeTrack(const std::string& audioFilePath);

    /**
     * @brief Ejecución de inferencia sobre buffer PCM precargado
     */
    RhythmAnalysis analyzePcm(const AudioPcmBuffer& pcm);

    /**
     * @brief Reverse Engineering: Cálculo de BPM fraccional exacto a partir de la mediana
     * de los Inter-Onset Intervals (IOI) y folding en la ventana de club 120–160 BPM.
     */
    static double calculateFractionalBpmFromIOI(
        const std::vector<double>& onsetTimesMs,
        double& outConfidence,
        double minBpmWindow = 120.0,
        double maxBpmWindow = 160.0
    );

    /**
     * @brief Extracción de picos discretos (Peak Picking) con umbral dinámico adaptativo
     */
    static std::vector<double> extractPeaks(
        const std::vector<float>& activations,
        double frameDurationMs,
        float threshold = 0.40f,
        double minDistanceMs = 180.0
    );

    bool isModelLoaded() const { return m_modelLoaded; }

private:
    bool runInference(
        const std::vector<float>& melSpec,
        size_t numFrames,
        BeatThisInferenceResult& outResult
    );

    MelSpectrogramExtractor m_melExtractor;
    bool m_modelLoaded{false};

#if HAVE_ONNXRUNTIME
    std::unique_ptr<Ort::Env> m_ortEnv;
    std::unique_ptr<Ort::Session> m_ortSession;
    std::unique_ptr<Ort::SessionOptions> m_sessionOptions;
    std::string m_inputName;
    std::vector<std::string> m_outputNames;
#endif
};

} // namespace beatwave
