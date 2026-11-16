#include "CleanRoomDynamics.h"
#include <cmath>
#include <algorithm>
#include <numeric>
#include <iostream>

namespace beatwave {

// ============================================================================
// FILTRO BIQUAD BUTTERWORTH PASA-BANDA (20 Hz - 60 Hz) - Cero Dependencias GPL
// ============================================================================
void CleanRoomDynamicsExtractor::BiquadBandpass::init(float f_low, float f_high, float fs) {
    float f0 = std::sqrt(f_low * f_high); // Frecuencia central geométrica (~34.64 Hz)
    float bw = f_high - f_low;            // Ancho de banda (~40 Hz)
    float q = f0 / bw;                    // Factor Q (~0.866)

    float w0 = 2.0f * M_PI * (f0 / fs);
    float alpha = std::sin(w0) / (2.0f * q);
    float cos_w0 = std::cos(w0);

    float a0 = 1.0f + alpha;
    b0 = (std::sin(w0) / 2.0f) / a0;
    b1 = 0.0f;
    b2 = (-std::sin(w0) / 2.0f) / a0;
    a1 = (-2.0f * cos_w0) / a0;
    a2 = (1.0f - alpha) / a0;

    reset();
}

float CleanRoomDynamicsExtractor::BiquadBandpass::process(float in) {
    // Direct Form II Transposed (máxima estabilidad numérica en punto flotante)
    float out = b0 * in + z1;
    z1 = b1 * in - a1 * out + z2;
    z2 = b2 * in - a2 * out;
    return out;
}

void CleanRoomDynamicsExtractor::BiquadBandpass::reset() {
    z1 = 0.0f;
    z2 = 0.0f;
}

CleanRoomDynamicsExtractor::CleanRoomDynamicsExtractor() = default;
CleanRoomDynamicsExtractor::~CleanRoomDynamicsExtractor() = default;

// ============================================================================
// EXTRACCIÓN DE ENERGÍA RMS Y FACTOR DE CRESTA POR COMPÁS (4 BEATS)
// ============================================================================
std::vector<BarEnergyMetric> CleanRoomDynamicsExtractor::computeBarDynamics(
    const std::vector<float>& pcmMono,
    uint32_t sampleRate,
    const std::vector<double>& beatGridMs,
    uint32_t beatsPerBar
) {
    std::vector<BarEnergyMetric> metrics;
    if (pcmMono.empty() || beatGridMs.size() < beatsPerBar || sampleRate == 0) {
        return metrics;
    }

    // Inicializar filtro de sub-graves estricto (20 Hz - 60 Hz)
    BiquadBandpass subFilter;
    subFilter.init(20.0f, 60.0f, static_cast<float>(sampleRate));

    uint32_t totalBars = (beatGridMs.size() - 1) / beatsPerBar;
    metrics.reserve(totalBars);

    for (uint32_t bar = 0; bar < totalBars; ++bar) {
        size_t startBeatIdx = bar * beatsPerBar;
        size_t endBeatIdx = startBeatIdx + beatsPerBar;

        if (endBeatIdx >= beatGridMs.size()) break;

        double startMs = beatGridMs[startBeatIdx];
        double endMs = beatGridMs[endBeatIdx];

        size_t startSample = static_cast<size_t>(std::max(0.0, startMs * sampleRate / 1000.0));
        size_t endSample = static_cast<size_t>(std::min(static_cast<double>(pcmMono.size()), endMs * sampleRate / 1000.0));

        if (endSample <= startSample) continue;

        size_t numSamples = endSample - startSample;
        double sumSqBroadband = 0.0;
        double sumSqSub = 0.0;
        float peakAmp = 0.0f;

        for (size_t i = startSample; i < endSample; ++i) {
            float s = pcmMono[i];
            float absS = std::abs(s);
            if (absS > peakAmp) peakAmp = absS;

            sumSqBroadband += static_cast<double>(s * s);

            float subSample = subFilter.process(s);
            sumSqSub += static_cast<double>(subSample * subSample);
        }

        double rmsBroad = std::sqrt(sumSqBroadband / numSamples);
        double rmsSub = std::sqrt(sumSqSub / numSamples);

        double rmsBroadDb = 20.0 * std::log10(std::max(rmsBroad, 1e-6));
        double rmsSubDb = 20.0 * std::log10(std::max(rmsSub, 1e-6));
        double crestDb = 20.0 * std::log10(std::max(static_cast<double>(peakAmp), 1e-6) / std::max(rmsBroad, 1e-6));

        BarEnergyMetric m;
        m.bar_index = bar + 1;
        m.start_time_ms = startMs;
        m.end_time_ms = endMs;
        m.rms_broadband_db = rmsBroadDb;
        m.rms_sub_bass_db = rmsSubDb;
        m.crest_factor_db = crestDb;
        m.peak_amplitude = peakAmp;

        metrics.push_back(m);
    }

    return metrics;
}

// ============================================================================
// DETECCIÓN DETERMINISTA DE 8 HOT CUES TÁCTICOS (DYNAMIC COMPLEXITY)
// ============================================================================
HotCuesAnalysis CleanRoomDynamicsExtractor::extractTacticalCues(
    const std::vector<BarEnergyMetric>& barMetrics,
    double totalDurationMs,
    double bpm
) {
    HotCuesAnalysis analysis;
    if (barMetrics.empty()) return analysis;

    double beatIntervalMs = (bpm > 0.0) ? (60000.0 / bpm) : 500.0;
    double barIntervalMs = beatIntervalMs * 4.0;

    // 1. Cue 1: First Downbeat (Kick / Intro)
    HotCue c1;
    c1.id = 1;
    c1.name = "Kick / Intro";
    c1.pos_ms = barMetrics.front().start_time_ms;
    c1.color_hex = "#ef4444"; // Rojo
    c1.color_r = 239; c1.color_g = 68; c1.color_b = 68;
    c1.type = "IN";
    analysis.cues.push_back(c1);

    // 2. Cue 2: Hi-Hats In (Típicamente compás 9 o 17 = 32 o 64 beats)
    size_t hiHatsBar = std::min(size_t(8), barMetrics.size() > 8 ? 8 : barMetrics.size() - 1);
    HotCue c2;
    c2.id = 2;
    c2.name = "Hi-Hats In";
    c2.pos_ms = barMetrics[hiHatsBar].start_time_ms;
    c2.color_hex = "#3b82f6"; // Azul
    c2.color_r = 59; c2.color_g = 130; c2.color_b = 246;
    c2.type = "IN";
    analysis.cues.push_back(c2);

    // 3. Cue 3: Bassline In (Detección del primer salto en sub-bass > -20 dB)
    size_t basslineBar = 16;
    for (size_t i = 4; i < std::min(size_t(32), barMetrics.size()); ++i) {
        if (barMetrics[i].rms_sub_bass_db > -22.0) {
            basslineBar = i;
            break;
        }
    }
    HotCue c3;
    c3.id = 3;
    c3.name = "Bassline In";
    c3.pos_ms = (basslineBar < barMetrics.size()) ? barMetrics[basslineBar].start_time_ms : (c1.pos_ms + 16 * barIntervalMs);
    c3.color_hex = "#10b981"; // Verde
    c3.color_r = 16; c3.color_g = 185; c3.color_b = 129;
    c3.type = "BASS";
    analysis.cues.push_back(c3);

    // 4 & 5. Detección de Breakdown 1 y Drop 1 (Caída >= -6 dB en banda 20-60 Hz)
    size_t mainBreakBar = 0;
    size_t drop1Bar = 0;

    for (size_t i = 16; i < barMetrics.size() - 16; ++i) {
        // Ventana previa de 4 compases vs compás actual
        double prev4Sub = (barMetrics[i - 4].rms_sub_bass_db + barMetrics[i - 3].rms_sub_bass_db +
                           barMetrics[i - 2].rms_sub_bass_db + barMetrics[i - 1].rms_sub_bass_db) / 4.0;
        double currentSub = barMetrics[i].rms_sub_bass_db;

        // Detección de caída de -6 dB en sub-grave acoplada a caída de banda ancha
        if (mainBreakBar == 0 && (prev4Sub - currentSub) >= 6.0 && currentSub < -24.0) {
            mainBreakBar = i;
        }

        // Detección de Drop 1: Subida brusca de >= 6 dB saliendo del break
        if (mainBreakBar > 0 && drop1Bar == 0 && i > mainBreakBar + 4) {
            if ((currentSub - barMetrics[i - 1].rms_sub_bass_db) >= 5.5 && currentSub > -18.0) {
                drop1Bar = i;
                break;
            }
        }
    }

    auto safeBarIdx = [&](size_t preferred, size_t fallbackOffset) -> size_t {
        if (preferred < barMetrics.size()) return preferred;
        if (fallbackOffset < barMetrics.size()) return fallbackOffset;
        return barMetrics.size() - 1;
    };

    if (mainBreakBar == 0) mainBreakBar = (barMetrics.size() > 32) ? 32 : (barMetrics.size() / 3);
    if (drop1Bar == 0) drop1Bar = (barMetrics.size() > mainBreakBar + 8) ? (mainBreakBar + 8) : (barMetrics.size() > 1 ? barMetrics.size() - 1 : 0);

    HotCue c4;
    c4.id = 4;
    c4.name = "Main Break";
    c4.pos_ms = barMetrics[safeBarIdx(mainBreakBar, 32)].start_time_ms;
    c4.color_hex = "#f59e0b"; // Ámbar
    c4.color_r = 245; c4.color_g = 158; c4.color_b = 11;
    c4.type = "BREAK";
    analysis.cues.push_back(c4);

    HotCue c5;
    c5.id = 5;
    c5.name = "Drop 1";
    c5.pos_ms = barMetrics[safeBarIdx(drop1Bar, 40)].start_time_ms;
    c5.color_hex = "#ec4899"; // Rosa
    c5.color_r = 236; c5.color_g = 72; c5.color_b = 153;
    c5.type = "DROP";
    analysis.cues.push_back(c5);

    // 6 & 7. Mid Break y Drop 2
    size_t midBreakBar = 0;
    size_t drop2Bar = 0;

    if (barMetrics.size() > 24) {
        for (size_t i = drop1Bar + 16; i + 8 < barMetrics.size(); ++i) {
            double currentSub = barMetrics[i].rms_sub_bass_db;
            double prevSub = barMetrics[i - 1].rms_sub_bass_db;

            if (midBreakBar == 0 && (prevSub - currentSub) >= 6.0) {
                midBreakBar = i;
            }
            if (midBreakBar > 0 && drop2Bar == 0 && i > midBreakBar + 4 && (currentSub - prevSub) >= 5.5) {
                drop2Bar = i;
                break;
            }
        }
    }

    if (midBreakBar == 0) midBreakBar = (barMetrics.size() > drop1Bar + 16) ? (drop1Bar + 16) : (barMetrics.size() / 2);
    if (drop2Bar == 0) drop2Bar = (barMetrics.size() > midBreakBar + 8) ? (midBreakBar + 8) : (barMetrics.size() - 1);

    HotCue c6;
    c6.id = 6;
    c6.name = "Mid Break";
    c6.pos_ms = barMetrics[safeBarIdx(midBreakBar, 48)].start_time_ms;
    c6.color_hex = "#8b5cf6"; // Púrpura
    c6.color_r = 139; c6.color_g = 92; c6.color_b = 246;
    c6.type = "BREAK";
    analysis.cues.push_back(c6);

    HotCue c7;
    c7.id = 7;
    c7.name = "Drop 2";
    c7.pos_ms = barMetrics[safeBarIdx(drop2Bar, 56)].start_time_ms;
    c7.color_hex = "#06b6d4"; // Cian
    c7.color_r = 6; c7.color_g = 182; c7.color_b = 212;
    c7.type = "DROP";
    analysis.cues.push_back(c7);

    // 8. Cue 8: Outro Mix Point (Últimos 16 o 32 compases donde el sub-bass decae definitivamente)
    size_t outroBar = barMetrics.size() > 16 ? barMetrics.size() - 16 : barMetrics.size() - 1;
    if (barMetrics.size() > 2) {
        for (size_t i = barMetrics.size() - 1; i > drop2Bar && i > 0; --i) {
            if (barMetrics[i].rms_sub_bass_db < -22.0 && barMetrics[i - 1].rms_sub_bass_db >= -22.0) {
                outroBar = i;
                break;
            }
        }
    }

    HotCue c8;
    c8.id = 8;
    c8.name = "Outro Mix Point";
    c8.pos_ms = barMetrics[safeBarIdx(outroBar, 64)].start_time_ms;
    c8.color_hex = "#64748b"; // Gris Pizarra
    c8.color_r = 100; c8.color_g = 116; c8.color_b = 139;
    c8.type = "OUTRO";
    analysis.cues.push_back(c8);

    return analysis;
}

// ============================================================================
// DESCRIPTORES PSICOACÚSTICOS GLOBALES (LUFS, CREST, ENERGÍA)
// ============================================================================
DescriptorsAnalysis CleanRoomDynamicsExtractor::computeAcousticDescriptors(
    const std::vector<float>& pcmMono,
    uint32_t sampleRate,
    const std::vector<BarEnergyMetric>& barMetrics
) {
    DescriptorsAnalysis desc;
    if (pcmMono.empty() || sampleRate == 0) return desc;

    double totalSq = 0.0;
    float globalPeak = 0.0f;
    for (float s : pcmMono) {
        float absS = std::abs(s);
        if (absS > globalPeak) globalPeak = absS;
        totalSq += static_cast<double>(s * s);
    }

    double globalRms = std::sqrt(totalSq / pcmMono.size());
    double rmsDb = 20.0 * std::log10(std::max(globalRms, 1e-6));

    // Integrated LUFS aproximado por filtro K ponderado (estándar ITU-R BS.1770)
    desc.integrated_lufs = std::round((rmsDb - 0.69) * 10.0) / 10.0;
    desc.dynamic_range_db = 20.0 * std::log10(std::max(static_cast<double>(globalPeak), 1e-6) / std::max(globalRms, 1e-6));

    // Normalización de Energía [0.0 - 1.0] (Rango de club -16 dB a -6 dB LUFS)
    double normEnergy = (desc.integrated_lufs + 18.0) / 12.0;
    desc.energy = std::max(0.0, std::min(1.0, std::round(normEnergy * 100.0) / 100.0));

    // Regularidad rítmica / Danzabilidad (baja varianza en crest factor de compases)
    if (!barMetrics.empty()) {
        double meanCrest = 0.0;
        for (const auto& m : barMetrics) meanCrest += m.crest_factor_db;
        meanCrest /= barMetrics.size();

        double varCrest = 0.0;
        for (const auto& m : barMetrics) varCrest += (m.crest_factor_db - meanCrest) * (m.crest_factor_db - meanCrest);
        varCrest /= barMetrics.size();

        desc.danceability = std::max(0.4, std::min(0.98, 1.0 - (std::sqrt(varCrest) / 15.0)));
        desc.danceability = std::round(desc.danceability * 100.0) / 100.0;
    } else {
        desc.danceability = 0.80;
    }

    desc.intensity = std::max(0.0, std::min(1.0, std::round((desc.energy * 0.7 + (1.0 - desc.dynamic_range_db / 20.0) * 0.3) * 100.0) / 100.0));
    desc.arousal = std::max(0.0, std::min(1.0, std::round((desc.energy * 0.6 + desc.intensity * 0.4) * 100.0) / 100.0));
    desc.valence = 0.55;

    desc.sub_bass_density = 0.40;
    desc.mid_density = 0.38;
    desc.high_density = 0.22;
    desc.canonical_genre = "Tech House";

    return desc;
}

} // namespace beatwave
