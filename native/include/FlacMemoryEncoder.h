#ifndef BEATWAVE_FLAC_MEMORY_ENCODER_H
#define BEATWAVE_FLAC_MEMORY_ENCODER_H

#include <vector>
#include <cstdint>
#include <cstddef>

namespace beatwave {
namespace audio {

/**
 * Codificador FLAC en memoria (RAM) ultra-rápido y determinista (Zero-Disk).
 * 
 * Diseñado específicamente para BeatWave Phase 2 (Radar Acústico de Alta Fidelidad).
 * Comprime búferes de audio PCM lineal (16 kHz mono) reduciendo el tamaño en ~50%
 * sin pérdida alguna de información espectral (lossless bit-exact), permitiendo el
 * streaming hacia microservicios cloud sin agotar la batería ni la red móvil.
 */
class FlacMemoryEncoder {
public:
    /**
     * Codifica un búfer de muestras PCM de 16 bits en memoria RAM a formato FLAC.
     * 
     * @param pcm16 Puntero al búfer de enteros signed de 16 bits [-32768, 32767]
     * @param numSamples Cantidad total de muestras en el búfer
     * @param sampleRate Tasa de muestreo (por defecto 16000 Hz para Fase 2)
     * @param numChannels Cantidad de canales (1 = Mono)
     * @return std::vector<uint8_t> con el payload binario FLAC completo ('fLaC'...)
     */
    static std::vector<uint8_t> encode(
        const int16_t* pcm16,
        size_t numSamples,
        uint32_t sampleRate = 16000,
        uint32_t numChannels = 1
    );

    /**
     * Sobrecarga para codificar muestras float [-1.0f, +1.0f] directamente.
     */
    static std::vector<uint8_t> encodeFloats(
        const float* pcmFloat,
        size_t numSamples,
        uint32_t sampleRate = 16000,
        uint32_t numChannels = 1
    );
};

} // namespace audio
} // namespace beatwave

#endif // BEATWAVE_FLAC_MEMORY_ENCODER_H
