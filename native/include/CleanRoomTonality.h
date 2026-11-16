#pragma once

#include "BeatWaveTypes.h"
#include <vector>
#include <string>
#include <cstdint>

namespace beatwave {

struct HpcpResult {
    std::vector<double> hpcp_36;      // Vector de 36 bins de Harmonic Pitch Class Profile
    std::vector<double> chroma_12;    // Vector comprimido de 12 semitonos (C a B)
};

class CleanRoomTonalityExtractor {
public:
    CleanRoomTonalityExtractor();
    ~CleanRoomTonalityExtractor();

    /**
     * @brief Computa el HPCP de 36 bins a partir de audio PCM a 44.1 kHz (o cualquier sample rate).
     * Detecta picos espectrales cuadráticos entre 40 Hz y 5000 Hz.
     * Cero dependencias Essentia/GPL (Clean-Room).
     */
    static HpcpResult computeHpcp36(
        const std::vector<float>& pcm,
        uint32_t sampleRate = 44100,
        uint32_t nFft = 4096,
        uint32_t hopLength = 2048
    );

    /**
     * @brief Correlaciona el vector cromático con los perfiles armónicos EDMA (Electronic Dance Music Adapted)
     * para extraer la tonalidad exacta, Camelot, Open Key y confianza de escala.
     */
    static HarmonyAnalysis detectKeyFromHpcp(const HpcpResult& hpcp);

    /**
     * @brief Pipeline completo de análisis armónico desde buffer PCM
     */
    static HarmonyAnalysis analyzeTonality(
        const std::vector<float>& pcm,
        uint32_t sampleRate = 44100
    );

    // Mapeo canónico a Camelot Wheel y Open Key
    static std::string toCamelot(int rootC, bool isMinor);
    static std::string toOpenKey(int rootC, bool isMinor);
    static std::string toStandardKey(int rootC, bool isMinor);
};

} // namespace beatwave
