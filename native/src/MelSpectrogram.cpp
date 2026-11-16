#include "MelSpectrogram.h"
#include <iostream>
#include <algorithm>
#include <complex>

#if __has_include(<fftw3.h>)
    #include <fftw3.h>
    #define HAVE_FFTW3 1
#else
    #define HAVE_FFTW3 0
#endif

namespace beatwave {

MelSpectrogramExtractor::MelSpectrogramExtractor(const MelConfig& config)
    : m_config(config) {
    initHannWindow();
    initMelFilterbank();

#if HAVE_FFTW3
    m_fftwIn = (double*)fftw_malloc(sizeof(double) * m_config.n_fft);
    m_fftwOut = (fftw_complex*)fftw_malloc(sizeof(fftw_complex) * (m_config.n_fft / 2 + 1));
    m_fftwPlan = (void*)fftw_plan_dft_r2c_1d(
        m_config.n_fft,
        m_fftwIn,
        (fftw_complex*)m_fftwOut,
        FFTW_ESTIMATE
    );
#endif
}

MelSpectrogramExtractor::~MelSpectrogramExtractor() {
#if HAVE_FFTW3
    if (m_fftwPlan) {
        fftw_destroy_plan((fftw_plan)m_fftwPlan);
    }
    if (m_fftwIn) {
        fftw_free(m_fftwIn);
    }
    if (m_fftwOut) {
        fftw_free(m_fftwOut);
    }
#endif
}

void MelSpectrogramExtractor::initHannWindow() {
    m_window.resize(m_config.n_fft);
    const float twoPi = 2.0f * M_PI;
    for (uint32_t i = 0; i < m_config.n_fft; ++i) {
        // Ventana Hann periódica (standard para STFT)
        m_window[i] = 0.5f * (1.0f - std::cos(twoPi * i / m_config.n_fft));
    }
}

void MelSpectrogramExtractor::initMelFilterbank() {
    const uint32_t numBins = m_config.n_fft / 2 + 1;
    m_filterbank.assign(m_config.n_mels * numBins, 0.0f);

    float melMin = hzToMel(m_config.f_min);
    float melMax = hzToMel(m_config.f_max);

    std::vector<float> melPoints(m_config.n_mels + 2);
    float melStep = (melMax - melMin) / (m_config.n_mels + 1);

    for (size_t i = 0; i < melPoints.size(); ++i) {
        melPoints[i] = melMin + i * melStep;
    }

    std::vector<float> binPoints(m_config.n_mels + 2);
    float fftBinWidth = static_cast<float>(m_config.sample_rate) / m_config.n_fft;

    for (size_t i = 0; i < binPoints.size(); ++i) {
        float hz = melToHz(melPoints[i]);
        binPoints[i] = hz / fftBinWidth;
    }

    // Construcción de filtros triangulares con ponderación Slaney
    for (uint32_t m = 0; m < m_config.n_mels; ++m) {
        float left = binPoints[m];
        float center = binPoints[m + 1];
        float right = binPoints[m + 2];

        float enorm = 2.0f / (melToHz(right) - melToHz(left)); // Normalización de área unitaria

        for (uint32_t k = 0; k < numBins; ++k) {
            float kf = static_cast<float>(k);
            float weight = 0.0f;

            if (kf >= left && kf <= center && center > left) {
                weight = (kf - left) / (center - left);
            } else if (kf > center && kf <= right && right > center) {
                weight = (right - kf) / (right - center);
            }

            m_filterbank[m * numBins + k] = weight * enorm;
        }
    }
}

// Fallback nativo: FFT Cooley-Tukey recursiva/iterativa si FFTW no está compilado
static void fallback_fft(std::vector<std::complex<float>>& a) {
    size_t n = a.size();
    if (n <= 1) return;

    for (size_t i = 1, j = 0; i < n; i++) {
        size_t bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) std::swap(a[i], a[j]);
    }

    for (size_t len = 2; len <= n; len <<= 1) {
        float ang = 2.0f * M_PI / len;
        std::complex<float> wlen(std::cos(ang), -std::sin(ang));
        for (size_t i = 0; i < n; i += len) {
            std::complex<float> w(1.0f, 0.0f);
            for (size_t j = 0; j < len / 2; j++) {
                std::complex<float> u = a[i + j];
                std::complex<float> v = a[i + j + len / 2] * w;
                a[i + j] = u + v;
                a[i + j + len / 2] = u - v;
                w *= wlen;
            }
        }
    }
}

std::vector<float> MelSpectrogramExtractor::compute(const std::vector<float>& audio, size_t& outNumFrames) {
    if (audio.size() < m_config.n_fft) {
        outNumFrames = 0;
        return {};
    }

    const uint32_t numBins = m_config.n_fft / 2 + 1;
    outNumFrames = (audio.size() - m_config.n_fft) / m_config.hop_length + 1;

    std::vector<float> melSpec(outNumFrames * m_config.n_mels, 0.0f);
    std::vector<float> powerSpectrum(numBins, 0.0f);

#if !HAVE_FFTW3
    std::vector<std::complex<float>> fftBuffer(m_config.n_fft);
#endif

    for (size_t frame = 0; frame < outNumFrames; ++frame) {
        size_t sampleOffset = frame * m_config.hop_length;

#if HAVE_FFTW3
        // 1. Enventanado y copia directa al buffer de entrada de FFTW
        for (uint32_t i = 0; i < m_config.n_fft; ++i) {
            m_fftwIn[i] = static_cast<double>(audio[sampleOffset + i] * m_window[i]);
        }

        // 2. Ejecutar FFTW
        fftw_execute((fftw_plan)m_fftwPlan);
        fftw_complex* cOut = (fftw_complex*)m_fftwOut;

        // 3. Espectro de potencia
        for (uint32_t k = 0; k < numBins; ++k) {
            double re = cOut[k][0];
            double im = cOut[k][1];
            powerSpectrum[k] = static_cast<float>(re * re + im * im);
        }
#else
        // Fallback FFT
        for (uint32_t i = 0; i < m_config.n_fft; ++i) {
            fftBuffer[i] = std::complex<float>(audio[sampleOffset + i] * m_window[i], 0.0f);
        }
        fallback_fft(fftBuffer);
        for (uint32_t k = 0; k < numBins; ++k) {
            float re = fftBuffer[k].real();
            float im = fftBuffer[k].imag();
            powerSpectrum[k] = re * re + im * im;
        }
#endif

        // 4. Multiplicación de Matriz Mel Filterbank x Power Spectrum (SIMD vectorizable)
        size_t frameOffset = frame * m_config.n_mels;
        for (uint32_t m = 0; m < m_config.n_mels; ++m) {
            float energy = 0.0f;
            const float* filterRow = &m_filterbank[m * numBins];

            // Acumulación de energía por bin Mel
            for (uint32_t k = 0; k < numBins; ++k) {
                energy += filterRow[k] * powerSpectrum[k];
            }

            // 5. Compresión Logarítmica Mel: log(1 + 10000 * energy)
            float logMel = std::log1p(m_config.log_multiplier * energy);
            melSpec[frameOffset + m] = logMel;
        }
    }

    return melSpec;
}

} // namespace beatwave
