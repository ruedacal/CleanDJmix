#pragma once

#include "BeatWaveTypes.h"
#include <memory>
#include <future>
#include <functional>
#include <mutex>
#include <unordered_map>

namespace beatwave {

class BeatWaveCore {
public:
    // Acceso Singleton seguro para concurrencia (Meyers Singleton)
    static BeatWaveCore& getInstance();

    // Eliminar constructores de copia y asignación
    BeatWaveCore(const BeatWaveCore&) = delete;
    BeatWaveCore& operator=(const BeatWaveCore&) = delete;

    // Inicialización del motor nativo (hilos, SIMD, aceleradores de hardware)
    void initialize();
    void shutdown();

    /**
     * @brief Análisis asíncrono nativo no bloqueante de una pista de audio.
     * Retorna un std::future con TrackAnalysisResult conteniendo los 4 sub-objetos:
     * rhythm, hotcues, harmony y descriptors.
     */
    std::future<TrackAnalysisResult> analyzeTrackAsync(const std::string& filePath);

    /**
     * @brief Versión síncrona interna para ejecución directa en Worker Threads / TBB
     */
    TrackAnalysisResult analyzeTrackSync(const std::string& filePath);

    /**
     * @brief Acceso a buffers de forma de onda espectral Zero-Copy
     */
    const uint8_t* getSpectralOverviewBuffer(const std::string& filePath, size_t& outSize);

private:
    BeatWaveCore();
    ~BeatWaveCore();

    // Caché en memoria para evitar reanálisis redundante
    std::mutex m_cacheMutex;
    std::unordered_map<std::string, TrackAnalysisResult> m_analysisCache;
    std::unordered_map<std::string, std::vector<uint8_t>> m_overviewBuffers;

    bool m_initialized{false};
};

} // namespace beatwave
