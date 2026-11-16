#pragma once

#include <string>
#include <vector>
#include <cstdint>
#include <memory>

namespace beatwave {

struct AudioPcmBuffer {
    std::vector<float> samples; // Muestras mono normalizadas [-1.0f, 1.0f]
    uint32_t sample_rate{22050};
    uint32_t channels{1};
    uint64_t total_frames{0};
    double duration_seconds{0.0};
};

class AudioDecoderResampler {
public:
    AudioDecoderResampler();
    ~AudioDecoderResampler();

    /**
     * @brief Decodifica cualquier contenedor de audio (FLAC, MP3, WAV, AIFF, M4A)
     * y remuestrea al vuelo a 22.050 Hz Mono en precisión flotante IEEE 754 de 32 bits.
     * Utiliza internamente miniaudio para decodificación y remuestreador Kaiser-window sinc.
     */
    static bool decodeAndResample(
        const std::string& filePath,
        AudioPcmBuffer& outBuffer,
        uint32_t targetSampleRate = 22050,
        uint32_t targetChannels = 1
    );

    /**
     * @brief Decodificación desde buffer de memoria sin tocar disco (Zero-Copy compatible)
     */
    static bool decodeFromMemory(
        const uint8_t* data,
        size_t size,
        AudioPcmBuffer& outBuffer,
        uint32_t targetSampleRate = 22050,
        uint32_t targetChannels = 1
    );
};

} // namespace beatwave
