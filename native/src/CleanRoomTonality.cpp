#include "CleanRoomTonality.h"
#include <cmath>
#include <algorithm>
#include <numeric>
#include <complex>
#include <iostream>

#if __has_include(<fftw3.h>)
    #include <fftw3.h>
    #define HAVE_FFTW3 1
#else
    #define HAVE_FFTW3 0
#endif

namespace beatwave {

CleanRoomTonalityExtractor::CleanRoomTonalityExtractor() = default;
CleanRoomTonalityExtractor::~CleanRoomTonalityExtractor() = default;

// ============================================================================
// PERFILES ARMÓNICOS EDMA (ELECTRONIC DANCE MUSIC ADAPTED) - CLEAN-ROOM
// ============================================================================
// Optimizados para música dance/electrónica (donde predominan modos eólicos y
// progresiones I-VI-VII o I-IV-V sin cadencias tensas clásicas V7-I).
static const double EDMA_MAJOR_PROFILE[12] = {
    5.0, // 0: Tónica (I)
    1.2, // 1: b2
    3.5, // 2: Segunda Mayor (II)
    1.2, // 3: b3
    4.0, // 4: Tercera Mayor (III)
    3.2, // 5: Cuarta Justa (IV)
    1.2, // 6: b5 / Trítono
    4.8, // 7: Quinta Justa (V)
    1.2, // 8: b6
    3.5, // 9: Sexta Mayor (VI)
    1.2, // 10: b7
    3.0  // 11: Séptima Mayor (VII)
};

static const double EDMA_MINOR_PROFILE[12] = {
    5.0, // 0: Tónica (i)
    1.5, // 1: b2
    3.8, // 2: Segunda Mayor (ii)
    4.5, // 3: Tercera Menor (biii) - Clave tonal menor
    2.0, // 4: Tercera Mayor
    3.8, // 5: Cuarta Justa (iv)
    1.2, // 6: b5 / Trítono
    4.8, // 7: Quinta Justa (v)
    3.8, // 8: Sexta Menor (bVI) - Muy prominente en Techno/House
    1.5, // 9: Sexta Mayor
    3.8, // 10: Séptima Menor (bVII) - Típica progresión eólica
    1.5  // 11: Séptima Mayor
};

static const char* NOTE_NAMES[12] = {
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
};

// ============================================================================
// EXTRACCIÓN DE 36-BIN HPCP (HARMONIC PITCH CLASS PROFILE)
// ============================================================================
HpcpResult CleanRoomTonalityExtractor::computeHpcp36(
    const std::vector<float>& pcm,
    uint32_t sampleRate,
    uint32_t nFft,
    uint32_t hopLength
) {
    HpcpResult result;
    result.hpcp_36.assign(36, 0.0);
    result.chroma_12.assign(12, 0.0);

    if (pcm.size() < nFft || sampleRate == 0) return result;

    // 1. Ventana Blackman-Harris de 4096 muestras (atenuación de lóbulos secundarios a -92 dB)
    std::vector<float> window(nFft);
    const float a0 = 0.35875f, a1 = 0.48829f, a2 = 0.14128f, a3 = 0.01168f;
    for (uint32_t i = 0; i < nFft; ++i) {
        float theta = 2.0f * M_PI * i / (nFft - 1);
        window[i] = a0 - a1 * std::cos(theta) + a2 * std::cos(2.0f * theta) - a3 * std::cos(3.0f * theta);
    }

    const uint32_t numBins = nFft / 2 + 1;
    const float binWidth = static_cast<float>(sampleRate) / nFft;

    // Rango espectral musical estricto: 40 Hz a 5000 Hz
    const uint32_t minBin = std::max(1u, static_cast<uint32_t>(40.0f / binWidth));
    const uint32_t maxBin = std::min(numBins - 2, static_cast<uint32_t>(5000.0f / binWidth));

    size_t numFrames = (pcm.size() - nFft) / hopLength + 1;
    std::vector<float> magnitude(numBins, 0.0f);
    std::vector<std::complex<float>> fftBuf(nFft);

    // Iteración cuadro a cuadro
    for (size_t frame = 0; frame < numFrames; ++frame) {
        size_t offset = frame * hopLength;

        // Enventanado
        for (uint32_t i = 0; i < nFft; ++i) {
            fftBuf[i] = std::complex<float>(pcm[offset + i] * window[i], 0.0f);
        }

        // FFT Radix-2
        size_t n = nFft;
        for (size_t i = 1, j = 0; i < n; i++) {
            size_t bit = n >> 1;
            for (; j & bit; bit >>= 1) j ^= bit;
            j ^= bit;
            if (i < j) std::swap(fftBuf[i], fftBuf[j]);
        }
        for (size_t len = 2; len <= n; len <<= 1) {
            float ang = 2.0f * M_PI / len;
            std::complex<float> wlen(std::cos(ang), -std::sin(ang));
            for (size_t i = 0; i < n; i += len) {
                std::complex<float> w(1.0f, 0.0f);
                for (size_t j = 0; j < len / 2; j++) {
                    std::complex<float> u = fftBuf[i + j];
                    std::complex<float> v = fftBuf[i + j + len / 2] * w;
                    fftBuf[i + j] = u + v;
                    fftBuf[i + j + len / 2] = u - v;
                    w *= wlen;
                }
            }
        }

        for (uint32_t k = 0; k < numBins; ++k) {
            magnitude[k] = std::abs(fftBuf[k]);
        }

        // 2. Detección de Picos Espectrales e Interpolación Cuadrática Parabólica
        for (uint32_t k = minBin; k <= maxBin; ++k) {
            float prev = magnitude[k - 1];
            float curr = magnitude[k];
            float next = magnitude[k + 1];

            // Condición de pico local
            if (curr > prev && curr >= next && curr > 1e-4f) {
                // Interpolación cuadrática en escala logarítmica (dB)
                float alpha = std::log(std::max(prev, 1e-6f));
                float beta = std::log(std::max(curr, 1e-6f));
                float gamma = std::log(std::max(next, 1e-6f));

                float denom = alpha - 2.0f * beta + gamma;
                float delta = 0.0f;
                if (std::abs(denom) > 1e-6f) {
                    delta = 0.5f * (alpha - gamma) / denom;
                    delta = std::max(-0.5f, std::min(0.5f, delta));
                }

                float exactBin = static_cast<float>(k) + delta;
                float exactFreqHz = exactBin * binWidth;

                if (exactFreqHz < 40.0f || exactFreqHz > 5000.0f) continue;

                // 3. Proyección a 36-bin HPCP (3 bins por semitono = 33.33 cents)
                // Referencia canónica de afinación: A4 = 440 Hz -> Nota 9 en escala de C (0..11)
                // Pitch continuo en semitonos respecto a C0:
                double pitchFromA4 = 12.0 * std::log2(exactFreqHz / 440.0);
                double pitchFromC = std::fmod(pitchFromA4 + 9.0 + 120.0, 12.0); // Rango [0.0, 12.0)

                // Posición continua en el histograma de 36 bins
                double binCont = pitchFromC * 3.0; // 36 / 12 = 3

                // Amplitud ponderada por energía
                double peakWeight = curr * curr;

                // Distribución gaussiana con ventana cos^2 a bins vecinos
                for (int b = 0; b < 36; ++b) {
                    double dist = std::abs(static_cast<double>(b) - binCont);
                    if (dist > 18.0) dist = 36.0 - dist;

                    if (dist <= 1.5) { // Ventana de 1 semitono completo
                        double w = std::cos((M_PI * dist) / 3.0);
                        result.hpcp_36[b] += peakWeight * (w * w);
                    }
                }
            }
        }
    }

    // 4. Normalización L1 del vector 36-HPCP
    double sum36 = std::accumulate(result.hpcp_36.begin(), result.hpcp_36.end(), 0.0);
    if (sum36 > 1e-9) {
        for (double& val : result.hpcp_36) val /= sum36;
    }

    // 5. Condensación a 12 bins Chroma (C a B)
    for (int i = 0; i < 12; ++i) {
        result.chroma_12[i] = result.hpcp_36[i * 3] +
                              result.hpcp_36[i * 3 + 1] +
                              result.hpcp_36[i * 3 + 2];
    }

    // Normalización unitaria de Chroma 12
    double sum12 = std::accumulate(result.chroma_12.begin(), result.chroma_12.end(), 0.0);
    if (sum12 > 1e-9) {
        for (double& val : result.chroma_12) val /= sum12;
    }

    return result;
}

// ============================================================================
// CORRELACIÓN PEARSON CON PERFILES EDMA (MAJOR / MINOR)
// ============================================================================
HarmonyAnalysis CleanRoomTonalityExtractor::detectKeyFromHpcp(const HpcpResult& hpcp) {
    HarmonyAnalysis harmony;
    harmony.chroma_vector = hpcp.chroma_12;

    const auto& X = hpcp.chroma_12;
    if (X.size() != 12) {
        harmony.standard_key = "A minor";
        harmony.camelot_key = "8A";
        harmony.open_key = "1m";
        harmony.scale_confidence = 0.0;
        return harmony;
    }

    // Media de X
    double meanX = std::accumulate(X.begin(), X.end(), 0.0) / 12.0;
    double varX = 0.0;
    for (double x : X) varX += (x - meanX) * (x - meanX);

    if (varX < 1e-12) {
        harmony.standard_key = "A minor";
        harmony.camelot_key = "8A";
        harmony.open_key = "1m";
        harmony.scale_confidence = 0.0;
        return harmony;
    }

    double bestCorrelation = -2.0;
    double runnerUpCorrelation = -2.0;
    int bestRoot = 9; // Por defecto A
    bool bestIsMinor = true;

    // Evaluar las 24 tonalidades (12 Mayores + 12 Menores)
    for (int isMinor = 0; isMinor <= 1; ++isMinor) {
        const double* baseProfile = (isMinor == 1) ? EDMA_MINOR_PROFILE : EDMA_MAJOR_PROFILE;

        for (int root = 0; root < 12; ++root) {
            // Construir perfil rotado a la tónica
            double Y[12];
            double meanY = 0.0;
            for (int i = 0; i < 12; ++i) {
                Y[i] = baseProfile[(i - root + 12) % 12];
                meanY += Y[i];
            }
            meanY /= 12.0;

            double num = 0.0;
            double varY = 0.0;
            for (int i = 0; i < 12; ++i) {
                double diffX = X[i] - meanX;
                double diffY = Y[i] - meanY;
                num += diffX * diffY;
                varY += diffY * diffY;
            }

            double r = num / (std::sqrt(varX * varY) + 1e-9);

            if (r > bestCorrelation) {
                runnerUpCorrelation = bestCorrelation;
                bestCorrelation = r;
                bestRoot = root;
                bestIsMinor = (isMinor == 1);
            } else if (r > runnerUpCorrelation) {
                runnerUpCorrelation = r;
            }
        }
    }

    // Mapeo a nomenclaturas profesionales
    harmony.standard_key = toStandardKey(bestRoot, bestIsMinor);
    harmony.camelot_key = toCamelot(bestRoot, bestIsMinor);
    harmony.open_key = toOpenKey(bestRoot, bestIsMinor);

    // Frecuencia fundamental canónica de la tónica
    double noteOffsetA4 = (bestRoot - 9); // Respecto a A4 (440 Hz)
    harmony.root_freq_hz = 440.0 * std::pow(2.0, (noteOffsetA4 - 24.0) / 12.0); // Octava baja

    // Confianza de escala normalizada [0.0, 1.0]
    double conf = (bestCorrelation - runnerUpCorrelation) / std::max(0.01, (1.0 - runnerUpCorrelation));
    harmony.scale_confidence = std::max(0.40, std::min(0.99, std::round(conf * 100.0) / 100.0));

    return harmony;
}

HarmonyAnalysis CleanRoomTonalityExtractor::analyzeTonality(
    const std::vector<float>& pcm,
    uint32_t sampleRate
) {
    HpcpResult hpcp = computeHpcp36(pcm, sampleRate, 4096, 2048);
    return detectKeyFromHpcp(hpcp);
}

// ============================================================================
// MAPEOS A CAMELOT WHEEL, OPEN KEY Y TONALIDAD ESTÁNDAR
// ============================================================================
std::string CleanRoomTonalityExtractor::toStandardKey(int rootC, bool isMinor) {
    if (rootC < 0 || rootC >= 12) rootC = 0;
    return std::string(NOTE_NAMES[rootC]) + (isMinor ? " minor" : " major");
}

std::string CleanRoomTonalityExtractor::toCamelot(int rootC, bool isMinor) {
    // 0=C, 1=C#, 2=D, 3=D#, 4=E, 5=F, 6=F#, 7=G, 8=G#, 9=A, 10=A#, 11=B
    if (isMinor) {
        // Camelot A (Menor)
        static const char* camelotMinor[12] = {
            "5A",  // C minor
            "12A", // C# minor
            "7A",  // D minor
            "2A",  // D# minor
            "9A",  // E minor
            "4A",  // F minor
            "11A", // F# minor
            "6A",  // G minor
            "1A",  // G# minor
            "8A",  // A minor
            "3A",  // A# minor
            "10A"  // B minor
        };
        return camelotMinor[rootC % 12];
    } else {
        // Camelot B (Mayor)
        static const char* camelotMajor[12] = {
            "8B",  // C major
            "3B",  // C# major
            "10B", // D major
            "5B",  // D# major
            "12B", // E major
            "7B",  // F major
            "2B",  // F# major
            "9B",  // G major
            "4B",  // G# major
            "11B", // A major
            "6B",  // A# major
            "1B"   // B major
        };
        return camelotMajor[rootC % 12];
    }
}

std::string CleanRoomTonalityExtractor::toOpenKey(int rootC, bool isMinor) {
    if (isMinor) {
        static const char* openMinor[12] = {
            "1m", "8m", "3m", "10m", "5m", "12m", "7m", "2m", "9m", "4m", "11m", "6m"
        };
        return openMinor[rootC % 12];
    } else {
        static const char* openMajor[12] = {
            "1d", "8d", "3d", "10d", "5d", "12d", "7d", "2d", "9d", "4d", "11d", "6d"
        };
        return openMajor[rootC % 12];
    }
}

} // namespace beatwave
