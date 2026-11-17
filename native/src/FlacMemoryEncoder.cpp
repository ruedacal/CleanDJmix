#include "FlacMemoryEncoder.h"
#include <algorithm>
#include <cmath>
#include <cstring>

namespace beatwave {
namespace audio {

namespace {

// ============================================================================
// BITSTREAM WRITER (Big-Endian Bit Packing)
// ============================================================================
class BitWriter {
public:
    BitWriter() : currentByte_(0), bitPos_(0) {
        buffer_.reserve(8192);
    }

    void writeBits(uint32_t val, uint32_t numBits) {
        if (numBits == 0) return;
        val &= ((1ULL << numBits) - 1);
        for (int i = static_cast<int>(numBits) - 1; i >= 0; --i) {
            uint32_t bit = (val >> i) & 1U;
            currentByte_ = static_cast<uint8_t>((currentByte_ << 1) | bit);
            bitPos_++;
            if (bitPos_ == 8) {
                buffer_.push_back(currentByte_);
                currentByte_ = 0;
                bitPos_ = 0;
            }
        }
    }

    void writeUnary(uint32_t count) {
        for (uint32_t i = 0; i < count; ++i) {
            writeBits(0, 1);
        }
        writeBits(1, 1);
    }

    void writeRice(int32_t val, uint32_t k) {
        // Mapeo signed -> unsigned Zig-Zag de FLAC
        uint32_t u = (val >= 0) 
            ? (static_cast<uint32_t>(val) << 1) 
            : ((static_cast<uint32_t>(-val - 1) << 1) | 1U);
        uint32_t q = u >> k;
        uint32_t rem = u & ((1U << k) - 1);

        writeUnary(q);
        if (k > 0) {
            writeBits(rem, k);
        }
    }

    void flush() {
        if (bitPos_ > 0) {
            currentByte_ = static_cast<uint8_t>(currentByte_ << (8 - bitPos_));
            buffer_.push_back(currentByte_);
            currentByte_ = 0;
            bitPos_ = 0;
        }
    }

    const std::vector<uint8_t>& getBytes() const { return buffer_; }
    void clear() {
        buffer_.clear();
        currentByte_ = 0;
        bitPos_ = 0;
    }

private:
    std::vector<uint8_t> buffer_;
    uint8_t currentByte_;
    uint8_t bitPos_;
};

// ============================================================================
// POLINOMIOS CRC DE FLAC (CRC-8 y CRC-16)
// ============================================================================
uint8_t calculateCRC8(const uint8_t* data, size_t length) {
    uint8_t crc = 0;
    for (size_t i = 0; i < length; ++i) {
        crc ^= data[i];
        for (int b = 0; b < 8; ++b) {
            if (crc & 0x80) {
                crc = static_cast<uint8_t>((crc << 1) ^ 0x07);
            } else {
                crc = static_cast<uint8_t>(crc << 1);
            }
        }
    }
    return crc;
}

uint16_t calculateCRC16(const uint8_t* data, size_t length) {
    uint16_t crc = 0;
    for (size_t i = 0; i < length; ++i) {
        crc ^= (static_cast<uint16_t>(data[i]) << 8);
        for (int b = 0; b < 8; ++b) {
            if (crc & 0x8000) {
                crc = static_cast<uint16_t>((crc << 1) ^ 0x8005);
            } else {
                crc = static_cast<uint16_t>(crc << 1);
            }
        }
    }
    return crc;
}

void writeUtf8FrameNumber(BitWriter& bw, uint32_t frameNum) {
    if (frameNum < 0x80) {
        bw.writeBits(frameNum, 8);
    } else if (frameNum < 0x800) {
        bw.writeBits(0xC0 | (frameNum >> 6), 8);
        bw.writeBits(0x80 | (frameNum & 0x3F), 8);
    } else if (frameNum < 0x10000) {
        bw.writeBits(0xE0 | (frameNum >> 12), 8);
        bw.writeBits(0x80 | ((frameNum >> 6) & 0x3F), 8);
        bw.writeBits(0x80 | (frameNum & 0x3F), 8);
    } else {
        bw.writeBits(0xF0 | (frameNum >> 18), 8);
        bw.writeBits(0x80 | ((frameNum >> 12) & 0x3F), 8);
        bw.writeBits(0x80 | ((frameNum >> 6) & 0x3F), 8);
        bw.writeBits(0x80 | (frameNum & 0x3F), 8);
    }
}

// Estima la cantidad de bits necesarios para codificar residuos con Rice(k)
uint64_t estimateRiceBits(const std::vector<int32_t>& residuals, uint32_t k) {
    uint64_t totalBits = 0;
    for (int32_t val : residuals) {
        uint32_t u = (val >= 0) 
            ? (static_cast<uint32_t>(val) << 1) 
            : ((static_cast<uint32_t>(-val - 1) << 1) | 1U);
        uint32_t q = u >> k;
        totalBits += (q + 1) + k;
    }
    return totalBits;
}

uint32_t calculateOptimalRiceParam(const std::vector<int32_t>& residuals) {
    if (residuals.empty()) return 0;
    double sumAbs = 0.0;
    for (int32_t val : residuals) {
        sumAbs += std::abs(static_cast<double>(val));
    }
    double meanAbs = sumAbs / static_cast<double>(residuals.size());
    if (meanAbs <= 0.0) return 0;

    // k óptimo analítico ~ round(log2(mean * ln(2)))
    double kFloat = std::round(std::log2(std::max(1.0, meanAbs * 0.6931471805599453)));
    int kInt = static_cast<int>(kFloat);
    return static_cast<uint32_t>(std::max(0, std::min(14, kInt)));
}

} // anonymous namespace

// ============================================================================
// FLAC MEMORY ENCODER MAIN ENTRY
// ============================================================================
std::vector<uint8_t> FlacMemoryEncoder::encode(
    const int16_t* pcm16,
    size_t numSamples,
    uint32_t sampleRate,
    uint32_t numChannels
) {
    if (!pcm16 || numSamples == 0 || sampleRate == 0 || numChannels != 1) {
        return {};
    }

    constexpr uint32_t BLOCK_SIZE = 4096;
    std::vector<uint8_t> flacBytes;
    flacBytes.reserve(sizeof(int16_t) * numSamples / 2 + 1024);

    // 1. Número Mágico "fLaC" (4 bytes)
    flacBytes.push_back('f');
    flacBytes.push_back('L');
    flacBytes.push_back('a');
    flacBytes.push_back('C');

    // 2. Encabezado METADATA_BLOCK (STREAMINFO, último bloque)
    // Bit 0: Last-block (1), Bits 1-7: Block type 0 (STREAMINFO) -> 0x80
    // Longitud: 34 bytes (0x00, 0x00, 0x22)
    flacBytes.push_back(0x80);
    flacBytes.push_back(0x00);
    flacBytes.push_back(0x00);
    flacBytes.push_back(0x22);

    // 3. Payload de STREAMINFO (34 bytes)
    BitWriter infoBw;
    infoBw.writeBits(BLOCK_SIZE, 16);               // min_blocksize
    infoBw.writeBits(BLOCK_SIZE, 16);               // max_blocksize
    infoBw.writeBits(0, 24);                        // min_framesize
    infoBw.writeBits(0, 24);                        // max_framesize
    infoBw.writeBits(sampleRate, 20);               // sample_rate (16000)
    infoBw.writeBits(numChannels - 1, 3);           // channels - 1 (0 para mono)
    infoBw.writeBits(15, 5);                        // bits_per_sample - 1 (15 para 16-bit)
    
    // Total de muestras en 36 bits
    uint64_t totalSamples64 = static_cast<uint64_t>(numSamples);
    infoBw.writeBits(static_cast<uint32_t>((totalSamples64 >> 32) & 0x0F), 4);
    infoBw.writeBits(static_cast<uint32_t>(totalSamples64 & 0xFFFFFFFF), 32);
    infoBw.flush();

    const auto& streamInfoBytes = infoBw.getBytes();
    flacBytes.insert(flacBytes.end(), streamInfoBytes.begin(), streamInfoBytes.end());
    // MD5 Signature: 16 bytes ceros (especificación FLAC: si no se calcula, debe ser 0)
    for (int i = 0; i < 16; ++i) {
        flacBytes.push_back(0x00);
    }

    // 4. Codificación de Cuadros de Audio (Audio Frames)
    uint32_t frameNum = 0;
    size_t offset = 0;

    std::vector<int32_t> resOrder1;
    std::vector<int32_t> resOrder2;

    while (offset < numSamples) {
        size_t curBlock = std::min(static_cast<size_t>(BLOCK_SIZE), numSamples - offset);
        const int16_t* blockData = pcm16 + offset;

        // --- Encabezado del Cuadro ---
        BitWriter headerBw;
        headerBw.writeBits(0x3FFE, 14);            // Sync code
        headerBw.writeBits(0, 1);                 // Reserved
        headerBw.writeBits(0, 1);                 // Blocking strategy (0 = fixed)
        if (curBlock == BLOCK_SIZE) {
            headerBw.writeBits(12, 4);            // 1100 = 4096 samples
        } else {
            headerBw.writeBits(7, 4);             // 0111 = 16-bit blocksize - 1 follows
        }
        headerBw.writeBits(0, 4);                 // Sample rate: get from STREAMINFO
        headerBw.writeBits(0, 4);                 // Channel assignment: mono
        headerBw.writeBits(0, 3);                 // Sample size: get from STREAMINFO
        headerBw.writeBits(0, 1);                 // Reserved
        writeUtf8FrameNumber(headerBw, frameNum); // Frame number UTF-8
        if (curBlock != BLOCK_SIZE) {
            headerBw.writeBits(static_cast<uint32_t>(curBlock - 1), 16);
        }
        headerBw.flush();

        const auto& hBytes = headerBw.getBytes();
        uint8_t headerCrc8 = calculateCRC8(hBytes.data(), hBytes.size());

        // --- Subcuadro Mono (SUBFRAME_FIXED Adaptativo) ---
        // Evaluación de Orden 1 vs Orden 2
        uint32_t bestOrder = 1;
        uint32_t bestK = 0;

        if (curBlock >= 2) {
            resOrder1.resize(curBlock - 1);
            for (size_t i = 1; i < curBlock; ++i) {
                resOrder1[i - 1] = static_cast<int32_t>(blockData[i]) - static_cast<int32_t>(blockData[i - 1]);
            }
            uint32_t k1 = calculateOptimalRiceParam(resOrder1);
            uint64_t bits1 = 16 + estimateRiceBits(resOrder1, k1);

            resOrder2.resize(curBlock - 2);
            for (size_t i = 2; i < curBlock; ++i) {
                resOrder2[i - 2] = static_cast<int32_t>(blockData[i]) 
                                 - 2 * static_cast<int32_t>(blockData[i - 1]) 
                                 + static_cast<int32_t>(blockData[i - 2]);
            }
            uint32_t k2 = calculateOptimalRiceParam(resOrder2);
            uint64_t bits2 = 32 + estimateRiceBits(resOrder2, k2);

            if (bits2 < bits1) {
                bestOrder = 2;
                bestK = k2;
            } else {
                bestOrder = 1;
                bestK = k1;
            }
        } else {
            bestOrder = 0;
            bestK = 0;
        }

        BitWriter bodyBw;
        bodyBw.writeBits(0, 1);                                 // Zero bit padding
        bodyBw.writeBits(0b001000 | (bestOrder & 0x07), 6);     // Subframe type: SUBFRAME_FIXED
        bodyBw.writeBits(0, 1);                                 // Wasted bits-per-sample: 0

        // Muestras de warm-up sin codificar
        for (uint32_t i = 0; i < bestOrder; ++i) {
            bodyBw.writeBits(static_cast<uint32_t>(blockData[i]) & 0xFFFF, 16);
        }

        // Residuos Rice
        bodyBw.writeBits(0b00, 2);                              // Coding method: 4-bit Rice
        bodyBw.writeBits(0b0000, 4);                            // Partition order: 0 (1 partition)
        bodyBw.writeBits(bestK, 4);                             // Rice parameter k

        const std::vector<int32_t>& activeResiduals = (bestOrder == 2) ? resOrder2 : resOrder1;
        for (int32_t r : activeResiduals) {
            bodyBw.writeRice(r, bestK);
        }
        bodyBw.flush();

        // Ensamble del cuadro completo y cálculo de CRC-16
        const auto& bodyBytes = bodyBw.getBytes();
        size_t frameDataSize = hBytes.size() + 1 + bodyBytes.size();

        std::vector<uint8_t> frameBuffer;
        frameBuffer.reserve(frameDataSize);
        frameBuffer.insert(frameBuffer.end(), hBytes.begin(), hBytes.end());
        frameBuffer.push_back(headerCrc8);
        frameBuffer.insert(frameBuffer.end(), bodyBytes.begin(), bodyBytes.end());

        uint16_t frameCrc16 = calculateCRC16(frameBuffer.data(), frameBuffer.size());

        // Anexar cuadro y CRC-16 al stream de salida
        flacBytes.insert(flacBytes.end(), frameBuffer.begin(), frameBuffer.end());
        flacBytes.push_back(static_cast<uint8_t>(frameCrc16 >> 8));
        flacBytes.push_back(static_cast<uint8_t>(frameCrc16 & 0xFF));

        offset += curBlock;
        frameNum++;
    }

    return flacBytes;
}

std::vector<uint8_t> FlacMemoryEncoder::encodeFloats(
    const float* pcmFloat,
    size_t numSamples,
    uint32_t sampleRate,
    uint32_t numChannels
) {
    if (!pcmFloat || numSamples == 0) return {};

    std::vector<int16_t> pcm16(numSamples);
    for (size_t i = 0; i < numSamples; ++i) {
        float s = pcmFloat[i] * 32767.0f;
        float clamped = std::max(-32768.0f, std::min(32767.0f, s));
        pcm16[i] = static_cast<int16_t>(std::round(clamped));
    }

    return encode(pcm16.data(), pcm16.size(), sampleRate, numChannels);
}

} // namespace audio
} // namespace beatwave
