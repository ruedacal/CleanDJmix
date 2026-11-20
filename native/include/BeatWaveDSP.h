#ifndef BEATWAVE_DSP_H
#define BEATWAVE_DSP_H

#include <vector>
#include <string>
#include <cstdint>
#include <memory>
#include <cmath>
#include <mutex>
#include <functional>
#include "FlacMemoryEncoder.h"

namespace beatwave {
namespace radar {

/**
 * Modo de entorno acústico para el filtro pasa-altos (HPF).
 * - Studio: Corte a 35 Hz (elimina DC offset y subsónicos inaudibles).
 * - Club: Corte a 120 Hz (optimizado para estrés Hard Techno: elimina
 *   la saturación por retumbe de subwoofer y vibración de cabina DJ).
 */
enum class RadarEnvironmentMode : uint8_t {
    Studio = 0, // HPF 35 Hz
    Club = 1    // HPF 120 Hz
};

/**
 * Resultado binario de extracción de huellas acústicas en memoria (Zero-Copy).
 */
struct FingerprintResult {
    bool is_valid = false;
    uint32_t duration_ms = 0;
    uint32_t sample_rate = 8000;
    float rms_dbfs = 0.0f;
    float peak_dbfs = 0.0f;
    
    // Huella binaria remota (compatible con ACRCloud Cloud Catalog)
    std::vector<uint8_t> acrcloud_fingerprint;

    // Huella binaria local (compatible con Olaf LMDB Local Database)
    // Pares de picos espectrales [hash_32bit, time_offset_ms]
    std::vector<uint8_t> olaf_fingerprint;
    uint32_t olaf_landmarks_count = 0;

    std::string error_message;
};

/**
 * Filtro Biquad Direct Form II Transposed (IIR) de alta precisión.
 */
class BiquadFilter {
public:
    BiquadFilter();
    void reset();
    void configureHPF(double cutoffHz, double sampleRate, double q = 0.7071067811865475);
    void configureLPF(double cutoffHz, double sampleRate, double q = 0.7071067811865475);
    
    // Procesa un buffer de muestras contiguas usando SIMD/vectorización
    void process(const float* input, float* output, size_t count);
    float processSample(float in);

private:
    double b0 = 1.0, b1 = 0.0, b2 = 0.0;
    double a1 = 0.0, a2 = 0.0;
    double s1 = 0.0, s2 = 0.0;
};

/**
 * Filtro en cascada de 4º orden (2 etapas Biquad Butterworth)
 */
class CascadedFilter4thOrder {
public:
    void reset();
    void configureHPF(double cutoffHz, double sampleRate);
    void configureLPF(double cutoffHz, double sampleRate);
    void process(const float* input, float* output, size_t count);

private:
    BiquadFilter stage1;
    BiquadFilter stage2;
};

/**
 * Ring Buffer continuo de 10.0s con Stride de 2.0s para streams en tiempo real.
 */
class AudioRingBuffer {
public:
    AudioRingBuffer(size_t windowCapacitySamples, size_t strideSamples);
    void reset();

    // Inserta muestras mono en el buffer circular
    void pushSamples(const float* samples, size_t count);

    // Indica si se ha acumulado al menos un paso de stride (2.0s) con ventana completa (10.0s)
    bool isReadyForExtraction() const;

    // Extrae la ventana completa de 10.0s más reciente y avanza el cursor por el stride (2.0s)
    bool extractWindow(std::vector<float>& outWindow);

    size_t getCapacity() const { return capacity_; }
    size_t getStride() const { return stride_; }
    size_t getAvailableSamples() const { return available_; }

private:
    std::vector<float> buffer_;
    size_t capacity_;
    size_t stride_;
    size_t writeHead_ = 0;
    size_t available_ = 0;
    size_t samplesSinceLastExtract_ = 0;
    mutable std::mutex mutex_;
};

/**
 * Interfaz C/C++ externa de ACRCloud (acrcloud_extr_tool SDK)
 */
extern "C" {
    // Declaración ABI del extractor estático de ACRCloud
    int acr_create_fingerprint(
        const char *pcm_buffer,
        int pcm_buffer_len,
        int is_silence,
        char **fps_buffer,
        int *fps_buffer_len
    );
    void acr_free_fingerprint(char *fps_buffer);
}

/**
 * Motor DSP y Extractor de Huellas Acústicas Radar de BeatWave PRO.
 */
class BeatWaveDSP {
public:
    explicit BeatWaveDSP(RadarEnvironmentMode envMode = RadarEnvironmentMode::Club);
    ~BeatWaveDSP();

    // Configuración del entorno (Studio vs Club)
    void setEnvironmentMode(RadarEnvironmentMode mode);
    RadarEnvironmentMode getEnvironmentMode() const { return envMode_; }

    // Resetea todos los estados internos, filtros y buffers
    void reset();

    /**
     * Procesa un bloque de audio entrante en streaming (micrófono o línea DJ).
     * @param pcmData Puntero a muestras de audio float [-1.0f, +1.0f]
     * @param numSamples Cantidad de muestras totales en pcmData
     * @param numChannels Número de canales de entrada (1=mono, 2=stereo)
     * @param inSampleRate Frecuencia de muestreo original (ej. 44100, 48000 Hz)
     * @param onFingerprintReady Callback invocado cada 2.0s cuando una huella de 10.0s es extraída
     */
    void ingestAudioStream(
        const float* pcmData,
        size_t numSamples,
        uint32_t numChannels,
        uint32_t inSampleRate,
        std::function<void(const FingerprintResult&)> onFingerprintReady
    );

    /**
     * Procesa un buffer estático completo de audio (ej. archivo pre-decodificado de 10s o más)
     * y genera inmediatamente el FingerprintResult en memoria sin tocar disco.
     */
    FingerprintResult processSingleBuffer(
        const float* pcmData,
        size_t numSamples,
        uint32_t numChannels,
        uint32_t inSampleRate
    );

    /**
     * Pipeline de Acondicionamiento DSP en Memoria:
     * 1. Reducción a mono: (L + R) * 0.5 (SIMD)
     * 2. Filtro HPF (35Hz o 120Hz)
     * 3. Filtro LPF (3800Hz anti-aliasing)
     * 4. Resampleo de alta fidelidad a 8000 Hz
     * 5. Normalización RMS a -16 dBFS (Peak ceiling -1.0 dBFS)
     * 6. Conversión a 16-bit PCM little-endian
     */
    std::vector<int16_t> conditionAudioForFingerprint(
        const float* pcmData,
        size_t numSamples,
        uint32_t numChannels,
        uint32_t inSampleRate,
        float& outRmsDbfs,
        float& outPeakDbfs
    );

    /**
     * Extracción de huella ACRCloud en memoria
     */
    std::vector<uint8_t> extractAcrCloudFingerprint(const int16_t* pcm8k, size_t numSamples);

    /**
     * Extracción de huella Olaf LMDB (Landmark constellation map) en memoria
     */
    std::vector<uint8_t> extractOlafFingerprint(
        const int16_t* pcm8k,
        size_t numSamples,
        uint32_t& outLandmarksCount
    );

    /**
     * FASE 2: Retención de Alta Fidelidad y Compresión FLAC en Memoria (Zero-Disk)
     * Extrae la ventana circular de 10.0s retenida a 16 kHz mono y la comprime a FLAC
     * en RAM reduciendo el payload ~50% para streaming hacia microservicios GPU.
     */
    std::vector<uint8_t> getEscalationBufferFLAC() const;

    /**
     * Codifica un búfer float arbitrario a FLAC 16 kHz mono en memoria.
     */
    std::vector<uint8_t> encodeBufferToFLAC(
        const float* pcmData,
        size_t numSamples,
        uint32_t inSampleRate
    ) const;

    // Métricas de estado del búfer de escalado a 16 kHz
    size_t getEscalationBufferedSamples() const;
    size_t getEscalationCapacitySamples() const { return ESCALATION_BUFFER_SAMPLES; }

private:
    RadarEnvironmentMode envMode_;
    std::unique_ptr<AudioRingBuffer> ringBuffer_;
    CascadedFilter4thOrder hpfFilter_;
    CascadedFilter4thOrder lpfFilter_;
    
    // Parámetros canónicos de fingerprinting (Fase 1: 8 kHz)
    static constexpr double TARGET_SAMPLE_RATE = 8000.0;
    static constexpr double HPF_STUDIO_CUTOFF = 35.0;
    static constexpr double HPF_CLUB_CUTOFF = 120.0;
    static constexpr double LPF_ANTI_ALIASING_CUTOFF = 3800.0;
    static constexpr float TARGET_RMS_DBFS = -16.0f;
    static constexpr float PEAK_LIMIT_DBFS = -1.0f;
    static constexpr double WINDOW_DURATION_SEC = 10.0;
    static constexpr double STRIDE_DURATION_SEC = 2.0;

    // Parámetros canónicos de rescate neuronal (Fase 2: 16 kHz)
    static constexpr double ESCALATION_SAMPLE_RATE = 16000.0;
    static constexpr double ESCALATION_WINDOW_SEC = 10.0;
    static constexpr size_t ESCALATION_BUFFER_SAMPLES = 160000; // 10.0s * 16000 Hz

    // Ring Buffer de escalado en paralelo a 16 kHz mono
    mutable std::mutex escalationMutex_;
    std::vector<float> escalationRingBuffer16k_;
    size_t escalationWriteHead_ = 0;
    size_t escalationCount_ = 0;

    void pushEscalationSamples(const float* samples16k, size_t count);

    void updateFilterCoefficients(double inSampleRate);
    double lastConfiguredSampleRate_ = 0.0;

    // Resamplers deterministas
    void resampleTo8kHz(
        const float* input,
        size_t inCount,
        uint32_t inRate,
        std::vector<float>& output
    );

    void resampleTo16kHz(
        const float* input,
        size_t inCount,
        uint32_t inRate,
        std::vector<float>& output
    ) const;

    // Normalizador de energía RMS a -16 dBFS y Limitador a -1 dBFS
    void normalizeAndLimit(
        std::vector<float>& audio,
        float& outRmsDbfs,
        float& outPeakDbfs
    );
};

} // namespace radar
} // namespace beatwave

#endif // BEATWAVE_DSP_H
