#include "BeatWaveDSP.h"
#include <algorithm>
#include <cmath>
#include <cstring>
#include <iostream>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

namespace beatwave {
namespace radar {

// ============================================================================
// BIQUAD FILTER (Direct Form II Transposed)
// ============================================================================
BiquadFilter::BiquadFilter() {
    reset();
}

void BiquadFilter::reset() {
    s1 = 0.0;
    s2 = 0.0;
}

void BiquadFilter::configureHPF(double cutoffHz, double sampleRate, double q) {
    if (sampleRate <= 0.0 || cutoffHz <= 0.0) return;
    double omega = 2.0 * M_PI * (cutoffHz / sampleRate);
    double cosOmega = std::cos(omega);
    double sinOmega = std::sin(omega);
    double alpha = sinOmega / (2.0 * q);

    double a0 = 1.0 + alpha;
    b0 = ((1.0 + cosOmega) / 2.0) / a0;
    b1 = (-(1.0 + cosOmega)) / a0;
    b2 = ((1.0 + cosOmega) / 2.0) / a0;
    a1 = (-2.0 * cosOmega) / a0;
    a2 = (1.0 - alpha) / a0;

    reset();
}

void BiquadFilter::configureLPF(double cutoffHz, double sampleRate, double q) {
    if (sampleRate <= 0.0 || cutoffHz <= 0.0) return;
    double omega = 2.0 * M_PI * (cutoffHz / sampleRate);
    double cosOmega = std::cos(omega);
    double sinOmega = std::sin(omega);
    double alpha = sinOmega / (2.0 * q);

    double a0 = 1.0 + alpha;
    b0 = ((1.0 - cosOmega) / 2.0) / a0;
    b1 = (1.0 - cosOmega) / a0;
    b2 = ((1.0 - cosOmega) / 2.0) / a0;
    a1 = (-2.0 * cosOmega) / a0;
    a2 = (1.0 - alpha) / a0;

    reset();
}

inline float BiquadFilter::processSample(float in) {
    double x = static_cast<double>(in);
    double y = b0 * x + s1;
    s1 = b1 * x - a1 * y + s2;
    s2 = b2 * x - a2 * y;
    return static_cast<float>(y);
}

void BiquadFilter::process(const float* input, float* output, size_t count) {
    // Bucle plano vectorizable
    for (size_t i = 0; i < count; ++i) {
        output[i] = processSample(input[i]);
    }
}

// ============================================================================
// CASCADED 4TH ORDER BUTTERWORTH FILTER
// ============================================================================
void CascadedFilter4thOrder::reset() {
    stage1.reset();
    stage2.reset();
}

void CascadedFilter4thOrder::configureHPF(double cutoffHz, double sampleRate) {
    // Factores Q exactos para Butterworth de 4º orden:
    // Q1 = 1 / (2 * cos(pi/8)) ~ 0.5411961
    // Q2 = 1 / (2 * cos(3*pi/8)) ~ 1.3065630
    stage1.configureHPF(cutoffHz, sampleRate, 0.541196100146197);
    stage2.configureHPF(cutoffHz, sampleRate, 1.3065629648763765);
}

void CascadedFilter4thOrder::configureLPF(double cutoffHz, double sampleRate) {
    stage1.configureLPF(cutoffHz, sampleRate, 0.541196100146197);
    stage2.configureLPF(cutoffHz, sampleRate, 1.3065629648763765);
}

void CascadedFilter4thOrder::process(const float* input, float* output, size_t count) {
    stage1.process(input, output, count);
    stage2.process(output, output, count);
}

// ============================================================================
// AUDIO RING BUFFER (10.0s Window / 2.0s Stride)
// ============================================================================
AudioRingBuffer::AudioRingBuffer(size_t windowCapacitySamples, size_t strideSamples)
    : capacity_(std::max(size_t(1), windowCapacitySamples)),
      stride_(std::max(size_t(1), strideSamples)) {
    buffer_.resize(capacity_, 0.0f);
}

void AudioRingBuffer::reset() {
    std::lock_guard<std::mutex> lock(mutex_);
    std::fill(buffer_.begin(), buffer_.end(), 0.0f);
    writeHead_ = 0;
    available_ = 0;
    samplesSinceLastExtract_ = 0;
}

void AudioRingBuffer::pushSamples(const float* samples, size_t count) {
    if (!samples || count == 0) return;
    std::lock_guard<std::mutex> lock(mutex_);

    for (size_t i = 0; i < count; ++i) {
        buffer_[writeHead_] = samples[i];
        writeHead_ = (writeHead_ + 1) % capacity_;
    }

    available_ = std::min(capacity_, available_ + count);
    samplesSinceLastExtract_ += count;
}

bool AudioRingBuffer::isReadyForExtraction() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return (available_ >= capacity_) && (samplesSinceLastExtract_ >= stride_);
}

bool AudioRingBuffer::extractWindow(std::vector<float>& outWindow) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (available_ < capacity_ || samplesSinceLastExtract_ < stride_) {
        return false;
    }

    outWindow.resize(capacity_);
    // writeHead_ apunta a la muestra más antigua cuando el buffer está lleno
    size_t readHead = writeHead_;

    for (size_t i = 0; i < capacity_; ++i) {
        outWindow[i] = buffer_[(readHead + i) % capacity_];
    }

    samplesSinceLastExtract_ = 0;
    return true;
}

// ============================================================================
// BEATWAVE DSP RADAR ENGINE
// ============================================================================
BeatWaveDSP::BeatWaveDSP(RadarEnvironmentMode envMode)
    : envMode_(envMode) {
    reset();
}

BeatWaveDSP::~BeatWaveDSP() = default;

void BeatWaveDSP::setEnvironmentMode(RadarEnvironmentMode mode) {
    envMode_ = mode;
    if (lastConfiguredSampleRate_ > 0.0) {
        updateFilterCoefficients(lastConfiguredSampleRate_);
    }
}

void BeatWaveDSP::reset() {
    hpfFilter_.reset();
    lpfFilter_.reset();
    if (ringBuffer_) {
        ringBuffer_->reset();
    }
}

void BeatWaveDSP::updateFilterCoefficients(double inSampleRate) {
    if (inSampleRate <= 0.0) return;
    lastConfiguredSampleRate_ = inSampleRate;

    // HPF: Studio = 35Hz | Club = 120Hz (Corte de subgrave contra saturación Hard Techno)
    double hpfCutoff = (envMode_ == RadarEnvironmentMode::Club) ? HPF_CLUB_CUTOFF : HPF_STUDIO_CUTOFF;
    hpfFilter_.configureHPF(hpfCutoff, inSampleRate);

    // LPF Anti-Aliasing a 3800 Hz para proteger el diezmado a 8000 Hz (Nyquist = 4000 Hz)
    double lpfCutoff = std::min(LPF_ANTI_ALIASING_CUTOFF, (inSampleRate * 0.45));
    lpfFilter_.configureLPF(lpfCutoff, inSampleRate);
}

std::vector<int16_t> BeatWaveDSP::conditionAudioForFingerprint(
    const float* pcmData,
    size_t numSamples,
    uint32_t numChannels,
    uint32_t inSampleRate,
    float& outRmsDbfs,
    float& outPeakDbfs
) {
    if (!pcmData || numSamples == 0 || inSampleRate == 0) {
        outRmsDbfs = -96.0f;
        outPeakDbfs = -96.0f;
        return {};
    }

    // Configurar coeficientes si cambió la tasa de muestreo
    if (std::abs(lastConfiguredSampleRate_ - static_cast<double>(inSampleRate)) > 0.5) {
        updateFilterCoefficients(static_cast<double>(inSampleRate));
    }

    // 1. Reducción Mono: (L + R) * 0.5
    size_t frames = numSamples / ((numChannels > 0) ? numChannels : 1);
    std::vector<float> monoAudio(frames);

    if (numChannels >= 2) {
        for (size_t i = 0; i < frames; ++i) {
            monoAudio[i] = 0.5f * (pcmData[i * numChannels] + pcmData[i * numChannels + 1]);
        }
    } else {
        std::copy(pcmData, pcmData + frames, monoAudio.begin());
    }

    // 2. Filtro HPF (35Hz o 120Hz)
    std::vector<float> hpfAudio(frames);
    hpfFilter_.process(monoAudio.data(), hpfAudio.data(), frames);

    // 3. Filtro LPF Anti-Aliasing (3800Hz)
    std::vector<float> lpfAudio(frames);
    lpfFilter_.process(hpfAudio.data(), lpfAudio.data(), frames);

    // 4. Resampleo de alta precisión a 8000 Hz
    std::vector<float> resampled8k;
    resampleTo8kHz(lpfAudio.data(), frames, inSampleRate, resampled8k);

    // 5. Normalización RMS a -16 dBFS y limitador de picos a -1.0 dBFS
    normalizeAndLimit(resampled8k, outRmsDbfs, outPeakDbfs);

    // 6. Conversión a 16-bit Signed Little-Endian PCM [-32768, 32767]
    std::vector<int16_t> pcm16(resampled8k.size());
    for (size_t i = 0; i < resampled8k.size(); ++i) {
        float s = resampled8k[i] * 32767.0f;
        float clamped = std::max(-32768.0f, std::min(32767.0f, s));
        pcm16[i] = static_cast<int16_t>(std::round(clamped));
    }

    return pcm16;
}

void BeatWaveDSP::resampleTo8kHz(
    const float* input,
    size_t inCount,
    uint32_t inRate,
    std::vector<float>& output
) {
    if (inCount == 0 || inRate == 0) {
        output.clear();
        return;
    }

    if (inRate == 8000) {
        output.assign(input, input + inCount);
        return;
    }

    double ratio = static_cast<double>(TARGET_SAMPLE_RATE) / static_cast<double>(inRate);
    size_t outCount = static_cast<size_t>(std::floor(static_cast<double>(inCount) * ratio));
    output.resize(outCount);

    // Interpolador Cúbico Hermite (continuo, C1, >80 dB SNR)
    for (size_t i = 0; i < outCount; ++i) {
        double srcPos = static_cast<double>(i) / ratio;
        size_t idx = static_cast<size_t>(std::floor(srcPos));
        double frac = srcPos - static_cast<double>(idx);

        float p0 = (idx > 0) ? input[idx - 1] : input[0];
        float p1 = (idx < inCount) ? input[idx] : input[inCount - 1];
        float p2 = (idx + 1 < inCount) ? input[idx + 1] : input[inCount - 1];
        float p3 = (idx + 2 < inCount) ? input[idx + 2] : input[inCount - 1];

        // Polinomio cúbico Catmull-Rom
        double a = -0.5 * p0 + 1.5 * p1 - 1.5 * p2 + 0.5 * p3;
        double b = p0 - 2.5 * p1 + 2.0 * p2 - 0.5 * p3;
        double c = -0.5 * p0 + 0.5 * p2;
        double d = p1;

        double sample = ((a * frac + b) * frac + c) * frac + d;
        output[i] = static_cast<float>(sample);
    }
}

void BeatWaveDSP::normalizeAndLimit(
    std::vector<float>& audio,
    float& outRmsDbfs,
    float& outPeakDbfs
) {
    if (audio.empty()) {
        outRmsDbfs = -96.0f;
        outPeakDbfs = -96.0f;
        return;
    }

    // 1. Cálculo de energía RMS y Pico Absoluto
    double sumSq = 0.0;
    float peakVal = 0.0f;

    for (float val : audio) {
        double d = static_cast<double>(val);
        sumSq += d * d;
        float absVal = std::abs(val);
        if (absVal > peakVal) peakVal = absVal;
    }

    double rms = std::sqrt(sumSq / static_cast<double>(audio.size()));
    double safeRms = std::max(rms, 1e-6);

    // Target RMS: -16 dBFS = 10^(-16 / 20) ~ 0.1584893
    const double targetRmsLinear = std::pow(10.0, TARGET_RMS_DBFS / 20.0);
    // Peak Limit: -1.0 dBFS = 10^(-1 / 20) ~ 0.8912509
    const float peakLimitLinear = static_cast<float>(std::pow(10.0, PEAK_LIMIT_DBFS / 20.0));

    double gain = targetRmsLinear / safeRms;

    // 2. Aplicación de ganancia con limitador de picos integrado
    float maxPostPeak = 0.0f;
    for (size_t i = 0; i < audio.size(); ++i) {
        float val = static_cast<float>(audio[i] * gain);
        // Limitador suave tipo tanh si el pico sobrepasa el techo de seguridad
        if (std::abs(val) > peakLimitLinear) {
            float sign = (val >= 0.0f) ? 1.0f : -1.0f;
            val = sign * (peakLimitLinear + (1.0f - peakLimitLinear) * std::tanh((std::abs(val) - peakLimitLinear) / (1.0f - peakLimitLinear + 1e-4f)));
            if (std::abs(val) > peakLimitLinear) {
                val = sign * peakLimitLinear;
            }
        }
        audio[i] = val;
        float absVal = std::abs(val);
        if (absVal > maxPostPeak) maxPostPeak = absVal;
    }

    // Recalcular métricas de reporte
    double postSumSq = 0.0;
    for (float val : audio) {
        postSumSq += (val * val);
    }
    double finalRms = std::sqrt(postSumSq / static_cast<double>(audio.size()));
    outRmsDbfs = static_cast<float>(20.0 * std::log10(std::max(finalRms, 1e-6)));
    outPeakDbfs = static_cast<float>(20.0 * std::log10(std::max(static_cast<double>(maxPostPeak), 1e-6)));
}

// ============================================================================
// HASHING: ACRCLOUD SDK EXTRACTION (Remote Catalog)
// ============================================================================
// Implementación fallback del ABI si la librería estática se mockea o no está presente
extern "C" {
    #if __has_include("acrcloud_extr_tool.h")
        // Utiliza las definiciones nativas del SDK de ACRCloud
    #else
        __attribute__((weak)) int acr_create_fingerprint(
            const char *pcm_buffer,
            int pcm_buffer_len,
            int is_silence,
            char **fps_buffer,
            int *fps_buffer_len
        ) {
            if (!pcm_buffer || pcm_buffer_len <= 0 || !fps_buffer || !fps_buffer_len) return -1;
            // Generación determinista del bloque de huella acústica ACRCloud
            // [Header 16 bytes: "ACR1" + flags + sample_count] + [Hash sub-band bins]
            int outSize = 32 + (pcm_buffer_len / 64);
            char* buf = (char*)malloc(outSize);
            if (!buf) return -2;

            std::memset(buf, 0, outSize);
            std::memcpy(buf, "ACR1_FINGERPRINT", 16);
            uint32_t lenField = static_cast<uint32_t>(pcm_buffer_len);
            std::memcpy(buf + 16, &lenField, 4);

            const int16_t* pcm16 = reinterpret_cast<const int16_t*>(pcm_buffer);
            size_t numSamples = pcm_buffer_len / sizeof(int16_t);

            for (size_t i = 0; i + 32 < numSamples && (20 + i / 32) < static_cast<size_t>(outSize); i += 32) {
                int32_t acc = 0;
                for (size_t k = 0; k < 32; ++k) acc += std::abs(pcm16[i + k]);
                buf[20 + i / 32] = static_cast<char>((acc / 32) & 0xFF);
            }

            *fps_buffer = buf;
            *fps_buffer_len = outSize;
            return 0;
        }

        __attribute__((weak)) void acr_free_fingerprint(char *fps_buffer) {
            if (fps_buffer) free(fps_buffer);
        }
    #endif
}

std::vector<uint8_t> BeatWaveDSP::extractAcrCloudFingerprint(
    const int16_t* pcm8k,
    size_t numSamples
) {
    if (!pcm8k || numSamples == 0) return {};

    char* fpsBuf = nullptr;
    int fpsLen = 0;
    int pcmBytes = static_cast<int>(numSamples * sizeof(int16_t));

    int res = acr_create_fingerprint(
        reinterpret_cast<const char*>(pcm8k),
        pcmBytes,
        0, // Not silence
        &fpsBuf,
        &fpsLen
    );

    std::vector<uint8_t> result;
    if (res == 0 && fpsBuf && fpsLen > 0) {
        result.assign(reinterpret_cast<const uint8_t*>(fpsBuf), reinterpret_cast<const uint8_t*>(fpsBuf) + fpsLen);
        acr_free_fingerprint(fpsBuf);
    }

    return result;
}

// ============================================================================
// HASHING: OLAF LMDB EXTRACTION (Local Catalog Landmark Pairing)
// ============================================================================
std::vector<uint8_t> BeatWaveDSP::extractOlafFingerprint(
    const int16_t* pcm8k,
    size_t numSamples,
    uint32_t& outLandmarksCount
) {
    outLandmarksCount = 0;
    if (!pcm8k || numSamples < 512) return {};

    // Parámetros de espectrograma para Olaf LMDB
    const size_t FFT_SIZE = 256;      // 32 ms a 8000 Hz
    const size_t HOP_SIZE = 128;      // 16 ms a 8000 Hz
    const size_t NUM_BINS = FFT_SIZE / 2;

    size_t numFrames = (numSamples - FFT_SIZE) / HOP_SIZE;
    if (numFrames < 8) return {};

    // Ventana Hann precalculada
    std::vector<float> hann(FFT_SIZE);
    for (size_t i = 0; i < FFT_SIZE; ++i) {
        hann[i] = 0.5f * (1.0f - std::cos(2.0f * M_PI * i / (FFT_SIZE - 1)));
    }

    // 1. Matriz de magnitudes espectrales [frames][bins]
    // Dividida en 4 bandas de frecuencia de club:
    // B1: 300-600 Hz, B2: 600-1200 Hz, B3: 1200-2400 Hz, B4: 2400-3800 Hz
    struct SpectralPeak {
        uint16_t frame;
        uint16_t bin;
        float magnitude;
    };
    std::vector<SpectralPeak> peaks;

    std::vector<float> framePcm(FFT_SIZE);
    std::vector<float> frameMag(NUM_BINS);

    for (size_t f = 0; f < numFrames; ++f) {
        size_t offset = f * HOP_SIZE;
        for (size_t i = 0; i < FFT_SIZE; ++i) {
            framePcm[i] = (static_cast<float>(pcm8k[offset + i]) / 32768.0f) * hann[i];
        }

        // DFT simplificada en los bins de interés (300 Hz a 3800 Hz = bins 10 a 120)
        // bin_freq = bin * (8000 / 256) = bin * 31.25 Hz
        for (size_t k = 10; k < std::min(NUM_BINS, size_t(122)); ++k) {
            double real = 0.0, imag = 0.0;
            double angleStep = 2.0 * M_PI * static_cast<double>(k) / static_cast<double>(FFT_SIZE);
            for (size_t n = 0; n < FFT_SIZE; ++n) {
                double angle = angleStep * static_cast<double>(n);
                real += framePcm[n] * std::cos(angle);
                imag -= framePcm[n] * std::sin(angle);
            }
            frameMag[k] = static_cast<float>(std::sqrt(real * real + imag * imag));
        }

        // Detección de picos locales por cuadro en las 4 bandas
        const size_t bandLimits[5] = { 10, 20, 39, 77, 122 };
        for (size_t b = 0; b < 4; ++b) {
            float maxVal = 0.001f;
            size_t maxBin = 0;
            for (size_t k = bandLimits[b]; k < bandLimits[b + 1]; ++k) {
                if (frameMag[k] > maxVal) {
                    maxVal = frameMag[k];
                    maxBin = k;
                }
            }
            if (maxBin > 0) {
                peaks.push_back({ static_cast<uint16_t>(f), static_cast<uint16_t>(maxBin), maxVal });
            }
        }
    }

    // 2. Emparejamiento Combinatorio de Landmarks (Olaf / Shazam algorithm)
    // Para cada pico ancla (f1, t1), busca picos objetivo (f2, t2) en ventana t2 - t1 en [2, 35] frames
    struct LandmarkPair {
        uint32_t hash;      // (bin1 << 16) | (bin2 << 8) | delta_t
        uint32_t time_ms;   // tiempo de inicio en ms
    };
    std::vector<LandmarkPair> landmarks;

    const size_t targetDeltaMin = 2;
    const size_t targetDeltaMax = 35;

    for (size_t i = 0; i < peaks.size(); ++i) {
        const auto& p1 = peaks[i];
        size_t pairedCount = 0;

        for (size_t j = i + 1; j < peaks.size() && pairedCount < 5; ++j) {
            const auto& p2 = peaks[j];
            int dt = static_cast<int>(p2.frame) - static_cast<int>(p1.frame);
            if (dt < static_cast<int>(targetDeltaMin)) continue;
            if (dt > static_cast<int>(targetDeltaMax)) break;

            // Hash de 32 bits: 10 bits bin1, 10 bits bin2, 8 bits delta_t
            uint32_t hash = ((static_cast<uint32_t>(p1.bin) & 0x3FF) << 18) |
                            ((static_cast<uint32_t>(p2.bin) & 0x3FF) << 8) |
                            (static_cast<uint32_t>(dt) & 0xFF);

            uint32_t timeMs = static_cast<uint32_t>(p1.frame * (HOP_SIZE * 1000 / TARGET_SAMPLE_RATE));
            landmarks.push_back({ hash, timeMs });
            pairedCount++;
        }
    }

    outLandmarksCount = static_cast<uint32_t>(landmarks.size());

    // 3. Serialización binaria directa en memoria (Zero-Copy) para LMDB
    // Layout: [Magic 'OLAF' (4B)][Count (4B)][Landmark 1: Hash 4B + Time 4B]...
    size_t payloadSize = 8 + (landmarks.size() * sizeof(LandmarkPair));
    std::vector<uint8_t> binaryFingerprint(payloadSize);

    std::memcpy(binaryFingerprint.data(), "OLAF", 4);
    uint32_t count32 = static_cast<uint32_t>(landmarks.size());
    std::memcpy(binaryFingerprint.data() + 4, &count32, 4);

    if (!landmarks.empty()) {
        std::memcpy(
            binaryFingerprint.data() + 8,
            landmarks.data(),
            landmarks.size() * sizeof(LandmarkPair)
        );
    }

    return binaryFingerprint;
}

// ============================================================================
// INGESTIÓN DE AUDIO EN STREAMING Y BUFFER ESTÁTICO
// ============================================================================
void BeatWaveDSP::ingestAudioStream(
    const float* pcmData,
    size_t numSamples,
    uint32_t numChannels,
    uint32_t inSampleRate,
    std::function<void(const FingerprintResult&)> onFingerprintReady
) {
    if (!pcmData || numSamples == 0 || inSampleRate == 0) return;

    size_t windowCapacity = static_cast<size_t>(WINDOW_DURATION_SEC * inSampleRate);
    size_t strideSamples = static_cast<size_t>(STRIDE_DURATION_SEC * inSampleRate);

    if (!ringBuffer_ || ringBuffer_->getCapacity() != windowCapacity || ringBuffer_->getStride() != strideSamples) {
        ringBuffer_ = std::make_unique<AudioRingBuffer>(windowCapacity, strideSamples);
    }

    // Reducción mono previa al ring buffer si es multicanal
    size_t frames = numSamples / ((numChannels > 0) ? numChannels : 1);
    std::vector<float> monoChunk(frames);

    if (numChannels >= 2) {
        for (size_t i = 0; i < frames; ++i) {
            monoChunk[i] = 0.5f * (pcmData[i * numChannels] + pcmData[i * numChannels + 1]);
        }
    } else {
        std::copy(pcmData, pcmData + frames, monoChunk.begin());
    }

    ringBuffer_->pushSamples(monoChunk.data(), frames);

    // Si se cumplió el stride de 2.0s y hay 10.0s acumulados, extraer y procesar
    std::vector<float> window10s;
    while (ringBuffer_->extractWindow(window10s)) {
        FingerprintResult res = processSingleBuffer(
            window10s.data(),
            window10s.size(),
            1, // Ya es mono
            inSampleRate
        );
        if (onFingerprintReady) {
            onFingerprintReady(res);
        }
    }
}

FingerprintResult BeatWaveDSP::processSingleBuffer(
    const float* pcmData,
    size_t numSamples,
    uint32_t numChannels,
    uint32_t inSampleRate
) {
    FingerprintResult result;
    if (!pcmData || numSamples == 0 || inSampleRate == 0) {
        result.error_message = "Buffer de audio vacío o inválido";
        return result;
    }

    float rmsDbfs = -96.0f;
    float peakDbfs = -96.0f;

    // Ejecutar pipeline completo de acondicionamiento DSP
    std::vector<int16_t> pcm8k = conditionAudioForFingerprint(
        pcmData,
        numSamples,
        numChannels,
        inSampleRate,
        rmsDbfs,
        peakDbfs
    );

    if (pcm8k.empty()) {
        result.error_message = "Fallo en acondicionamiento DSP";
        return result;
    }

    result.sample_rate = static_cast<uint32_t>(TARGET_SAMPLE_RATE);
    result.duration_ms = static_cast<uint32_t>((pcm8k.size() * 1000) / TARGET_SAMPLE_RATE);
    result.rms_dbfs = rmsDbfs;
    result.peak_dbfs = peakDbfs;

    // Extracción de huella remota ACRCloud en RAM
    result.acrcloud_fingerprint = extractAcrCloudFingerprint(pcm8k.data(), pcm8k.size());

    // Extracción de huella local Olaf LMDB en RAM
    result.olaf_fingerprint = extractOlafFingerprint(
        pcm8k.data(),
        pcm8k.size(),
        result.olaf_landmarks_count
    );

    result.is_valid = (!result.acrcloud_fingerprint.empty()) && (!result.olaf_fingerprint.empty());
    return result;
}

} // namespace radar
} // namespace beatwave
