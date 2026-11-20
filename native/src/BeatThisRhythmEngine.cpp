#include "BeatThisRhythmEngine.h"
#include <iostream>
#include <cmath>
#include <algorithm>
#include <numeric>

namespace beatwave {

BeatThisRhythmEngine::BeatThisRhythmEngine() = default;

BeatThisRhythmEngine::~BeatThisRhythmEngine() = default;

bool BeatThisRhythmEngine::loadModel(const std::string& modelPath) {
#if HAVE_ONNXRUNTIME
    try {
        m_ortEnv = std::make_unique<Ort::Env>(ORT_LOGGING_LEVEL_WARNING, "BeatWave_BeatThis_Engine");
        m_sessionOptions = std::make_unique<Ort::SessionOptions>();

        // Optimizaciones SIMD y multiprocesamiento
        m_sessionOptions->SetIntraOpNumThreads(std::max(1u, std::thread::hardware_concurrency()));
        m_sessionOptions->SetGraphOptimizationLevel(GraphOptimizationLevel::ORT_ENABLE_ALL);

        // Aceleración por hardware si está disponible (CoreML en macOS / DirectML en Windows)
#if defined(__APPLE__)
        try {
            // OrtSessionOptionsAppendExecutionProvider_CoreML(*m_sessionOptions, 0);
        } catch (...) {}
#endif

        m_ortSession = std::make_unique<Ort::Session>(*m_ortEnv, modelPath.c_str(), *m_sessionOptions);

        Ort::AllocatorWithDefaultOptions allocator;
        size_t numInputNodes = m_ortSession->GetInputCount();
        if (numInputNodes > 0) {
            auto inputNameAlloc = m_ortSession->GetInputNameAllocated(0, allocator);
            m_inputName = inputNameAlloc.get();
        }

        size_t numOutputNodes = m_ortSession->GetOutputCount();
        m_outputNames.clear();
        for (size_t i = 0; i < numOutputNodes; ++i) {
            auto outputNameAlloc = m_ortSession->GetOutputNameAllocated(i, allocator);
            m_outputNames.push_back(outputNameAlloc.get());
        }

        m_modelLoaded = true;
        std::cout << "[BeatThisRhythmEngine] Modelo ONNX cargado exitosamente: " << modelPath << std::endl;
        return true;
    } catch (const std::exception& e) {
        std::cerr << "[BeatThisRhythmEngine] Error al cargar modelo ONNX: " << e.what() << std::endl;
        m_modelLoaded = false;
        return false;
    }
#else
    std::cout << "[BeatThisRhythmEngine] ONNX Runtime no compilado en este target; operando en modo DSP nativo." << std::endl;
    m_modelLoaded = false;
    return false;
#endif
}

std::vector<double> BeatThisRhythmEngine::extractPeaks(
    const std::vector<float>& activations,
    double frameDurationMs,
    float threshold,
    double minDistanceMs
) {
    std::vector<double> peaks;
    if (activations.size() < 3) return peaks;

    for (size_t t = 1; t < activations.size() - 1; ++t) {
        float prev = activations[t - 1];
        float curr = activations[t];
        float next = activations[t + 1];

        // 1. Condición de pico local superando umbral
        if (curr > threshold && curr > prev && curr >= next) {
            // 2. Refinamiento parabólico sub-frame para precisión temporal exacta
            float denom = prev - 2.0f * curr + next;
            float delta = 0.0f;
            if (std::abs(denom) > 1e-6f) {
                delta = 0.5f * (prev - next) / denom;
                delta = std::max(-0.5f, std::min(0.5f, delta));
            }

            double exactTimeMs = (static_cast<double>(t) + delta) * frameDurationMs;

            // 3. Supresión de picos espurios por período refractario
            if (peaks.empty() || (exactTimeMs - peaks.back() >= minDistanceMs)) {
                peaks.push_back(exactTimeMs);
            } else if (!peaks.empty() && curr > activations[static_cast<size_t>(peaks.back() / frameDurationMs)]) {
                peaks.back() = exactTimeMs; // Actualizar por pico más prominente
            }
        }
    }

    return peaks;
}

double BeatThisRhythmEngine::calculateFractionalBpmFromIOI(
    const std::vector<double>& onsetTimesMs,
    double& outConfidence,
    double minBpmWindow,
    double maxBpmWindow
) {
    if (onsetTimesMs.size() < 2) {
        outConfidence = 0.0;
        return 128.0; // Valor canónico por defecto
    }

    // 1. Cálculo de todos los Inter-Onset Intervals (IOI)
    std::vector<double> iois;
    iois.reserve(onsetTimesMs.size() - 1);

    for (size_t i = 0; i < onsetTimesMs.size() - 1; ++i) {
        double interval = onsetTimesMs[i + 1] - onsetTimesMs[i];
        // Filtrar intervalos físicamente coherentes en música dance (180ms ~ 333 BPM a 1500ms ~ 40 BPM)
        if (interval >= 180.0 && interval <= 1500.0) {
            iois.push_back(interval);
        }
    }

    if (iois.empty()) {
        outConfidence = 0.0;
        return 128.0;
    }

    // 2. Cálculo robusto de la MEDIANA estadística de IOI (inmune a breaks o redobles)
    std::sort(iois.begin(), iois.end());
    double medianIoi = 0.0;
    size_t n = iois.size();
    if (n % 2 == 1) {
        medianIoi = iois[n / 2];
    } else {
        medianIoi = 0.5 * (iois[n / 2 - 1] + iois[n / 2]);
    }

    if (medianIoi <= 0.0) {
        outConfidence = 0.0;
        return 128.0;
    }

    // 3. Conversión de intervalo modal a BPM fraccional continuo
    double rawBpm = 60000.0 / medianIoi;

    // 4. Reverse Engineering: Octave Folding estricto a ventana de club DJ [120 - 160 BPM]
    double bpm = rawBpm;
    while (bpm < minBpmWindow && bpm > 0.0) {
        bpm *= 2.0;
    }
    while (bpm > maxBpmWindow) {
        bpm /= 2.0;
    }

    // 5. Cálculo de métrica de confianza: % de IOIs alineados con la cuadrícula plegada (±3.5%)
    double targetIntervalMs = 60000.0 / bpm;
    size_t matchingCount = 0;
    for (double ioi : iois) {
        // Comprobar coincidencia con beat simple, doble o mitad
        double err1 = std::abs(ioi - targetIntervalMs) / targetIntervalMs;
        double err2 = std::abs(ioi - (targetIntervalMs * 2.0)) / (targetIntervalMs * 2.0);
        double errHalf = std::abs(ioi - (targetIntervalMs * 0.5)) / (targetIntervalMs * 0.5);

        if (err1 < 0.035 || err2 < 0.035 || errHalf < 0.035) {
            matchingCount++;
        }
    }

    outConfidence = static_cast<double>(matchingCount) / n;
    return std::round(bpm * 100.0) / 100.0; // Redondeo a 2 decimales exactos
}

bool BeatThisRhythmEngine::runInference(
    const std::vector<float>& melSpec,
    size_t numFrames,
    BeatThisInferenceResult& outResult
) {
    outResult.num_frames = numFrames;
    outResult.frame_duration_ms = (512.0 / 22050.0) * 1000.0; // ~23.2199 ms por frame
    outResult.beat_logits.assign(numFrames, 0.0f);
    outResult.downbeat_logits.assign(numFrames, 0.0f);

#if HAVE_ONNXRUNTIME
    if (m_modelLoaded && m_ortSession) {
        try {
            // Forma del tensor de entrada: [1, num_frames, 128]
            std::vector<int64_t> inputShape = {1, static_cast<int64_t>(numFrames), 128};
            Ort::MemoryInfo memInfo = Ort::MemoryInfo::CreateCpu(OrtArenaAllocator, OrtMemTypeDefault);

            Ort::Value inputTensor = Ort::Value::CreateTensor<float>(
                memInfo,
                const_cast<float*>(melSpec.data()),
                melSpec.size(),
                inputShape.data(),
                inputShape.size()
            );

            const char* inputNames[] = { m_inputName.c_str() };
            std::vector<const char*> outputNames;
            for (const auto& name : m_outputNames) {
                outputNames.push_back(name.c_str());
            }

            auto outputTensors = m_ortSession->Run(
                Ort::RunOptions{nullptr},
                inputNames,
                &inputTensor,
                1,
                outputNames.data(),
                outputNames.size()
            );

            if (outputTensors.size() >= 2) {
                float* beatData = outputTensors[0].GetTensorMutableData<float>();
                float* downbeatData = outputTensors[1].GetTensorMutableData<float>();

                for (size_t t = 0; t < numFrames; ++t) {
                    // Sigmoide para convertir logits a probabilidades [0.0, 1.0]
                    outResult.beat_logits[t] = 1.0f / (1.0f + std::exp(-beatData[t]));
                    outResult.downbeat_logits[t] = 1.0f / (1.0f + std::exp(-downbeatData[t]));
                }
                return true;
            }
        } catch (const std::exception& e) {
            std::cerr << "[BeatThisRhythmEngine] Inferencia ONNX falló: " << e.what() << std::endl;
        }
    }
#endif

    // Fallback acústico determinista: Flujo de energía transitoria en bajas frecuencias (<120Hz)
    // Se calcula sobre los primeros 12 bins Mel correspondientes al sub-grave y bombo
    for (size_t t = 0; t < numFrames; ++t) {
        float lowEnergy = 0.0f;
        for (size_t b = 0; b < 12; ++b) {
            lowEnergy += melSpec[t * 128 + b];
        }
        // Activación normalizada por gradiente temporal
        float prevLow = (t > 0) ? outResult.beat_logits[t - 1] : lowEnergy;
        float onsetFlux = std::max(0.0f, lowEnergy - prevLow);
        outResult.beat_logits[t] = std::min(1.0f, onsetFlux / 15.0f);
    }

    return true;
}

RhythmAnalysis BeatThisRhythmEngine::analyzePcm(const AudioPcmBuffer& pcm) {
    RhythmAnalysis rhythm;
    if (pcm.samples.empty()) {
        rhythm.bpm = 128.0;
        return rhythm;
    }

    // 1. Extracción de Mel-Spectrogram (128 bins, 30 Hz - 10 kHz, 1024 ventana)
    size_t numFrames = 0;
    std::vector<float> melSpec = m_melExtractor.compute(pcm.samples, numFrames);

    if (numFrames == 0 || melSpec.empty()) {
        rhythm.bpm = 128.0;
        return rhythm;
    }

    // 2. Inferencia Rítmica (ONNX Beat This! Transformer o Flujo Acústico)
    BeatThisInferenceResult inference;
    runInference(melSpec, numFrames, inference);

    // 3. Extracción de Picos de Beats y Downbeats
    std::vector<double> beatPeaks = extractPeaks(inference.beat_logits, inference.frame_duration_ms, 0.35f, 180.0);
    std::vector<double> downbeatPeaks = extractPeaks(inference.downbeat_logits, inference.frame_duration_ms, 0.40f, 700.0);

    // 4. Reverse Engineering de BPM por Mediana de IOI + Octave Folding [120 - 160 BPM]
    double confidence = 0.0;
    double fractionalBpm = calculateFractionalBpmFromIOI(beatPeaks, confidence, 120.0, 160.0);

    rhythm.bpm = fractionalBpm;
    rhythm.confidence = confidence;
    rhythm.time_signature_num = 4.0;
    rhythm.time_signature_den = 4.0;

    // 5. Determinación del First Downbeat (Compás 1.1)
    double beatIntervalMs = 60000.0 / rhythm.bpm;
    double firstDownbeat = 0.0;

    if (!downbeatPeaks.empty()) {
        firstDownbeat = downbeatPeaks.front();
    } else if (!beatPeaks.empty()) {
        firstDownbeat = beatPeaks.front();
    } else {
        firstDownbeat = 120.0;
    }

    rhythm.first_downbeat_ms = std::round(firstDownbeat * 10.0) / 10.0;
    rhythm.grid_offset_ms = rhythm.first_downbeat_ms;

    // 6. Generación de cuadrícula continua de compases
    double totalDurationMs = pcm.duration_seconds * 1000.0;
    rhythm.beat_positions_ms.clear();

    double currentBeat = rhythm.first_downbeat_ms;
    while (currentBeat <= totalDurationMs) {
        rhythm.beat_positions_ms.push_back(std::round(currentBeat * 10.0) / 10.0);
        currentBeat += beatIntervalMs;
    }

    return rhythm;
}

RhythmAnalysis BeatThisRhythmEngine::analyzeTrack(const std::string& audioFilePath) {
    AudioPcmBuffer pcm;
    bool ok = AudioDecoderResampler::decodeAndResample(audioFilePath, pcm, 22050, 1);
    if (!ok) {
        RhythmAnalysis fallback;
        fallback.bpm = 128.0;
        fallback.confidence = 0.0;
        return fallback;
    }

    return analyzePcm(pcm);
}

} // namespace beatwave
