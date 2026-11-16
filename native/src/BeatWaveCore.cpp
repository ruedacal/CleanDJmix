#include "BeatWaveCore.h"
#include <chrono>
#include <cmath>
#include <thread>
#include <iostream>

namespace beatwave {

BeatWaveCore& BeatWaveCore::getInstance() {
    static BeatWaveCore instance;
    return instance;
}

BeatWaveCore::BeatWaveCore() {
    initialize();
}

BeatWaveCore::~BeatWaveCore() {
    shutdown();
}

void BeatWaveCore::initialize() {
    if (m_initialized) return;
    // Inicialización de aceleración SIMD / FFmpeg / Miniaudio / KissFFT si corresponde
    m_initialized = true;
}

void BeatWaveCore::shutdown() {
    std::lock_guard<std::mutex> lock(m_cacheMutex);
    m_analysisCache.clear();
    m_overviewBuffers.clear();
    m_initialized = false;
}

std::future<TrackAnalysisResult> BeatWaveCore::analyzeTrackAsync(const std::string& filePath) {
    return std::async(std::launch::async, [this, filePath]() {
        return this->analyzeTrackSync(filePath);
    });
}

TrackAnalysisResult BeatWaveCore::analyzeTrackSync(const std::string& filePath) {
    // 1. Comprobar caché en memoria
    {
        std::lock_guard<std::mutex> lock(m_cacheMutex);
        auto it = m_analysisCache.find(filePath);
        if (it != m_analysisCache.end()) {
            return it->second;
        }
    }

    TrackAnalysisResult result;
    result.file_path = filePath;

    if (filePath.empty()) {
        result.success = false;
        result.error_message = "Path vacio o invalido";
        return result;
    }

    try {
        // En una implementación de producción aquí se decodifica con dr_flac / dr_mp3 / FFmpeg
        // y se procesa mediante FFT (KissFFT / vDSP en Apple Silicon / PocketFFT)
        
        // Simulación determinista de pipeline DSP nativo
        result.success = true;
        result.duration_ms = 240000.0; // 4 minutos típicos

        // 1. RITMO (Rhythm)
        result.rhythm.bpm = 128.0;
        result.rhythm.first_downbeat_ms = 120.0;
        result.rhythm.grid_offset_ms = 120.0;
        result.rhythm.time_signature_num = 4.0;
        result.rhythm.time_signature_den = 4.0;
        result.rhythm.confidence = 0.98;
        
        // Generar 16 primeros compases de referencia
        double beatInterval = 60000.0 / result.rhythm.bpm;
        for (int i = 0; i < 64; ++i) {
            result.rhythm.beat_positions_ms.push_back(result.rhythm.first_downbeat_ms + (i * beatInterval));
        }

        // 2. 8 HOT CUES TÁCTICOS (Hotcues)
        std::vector<std::pair<std::string, double>> cueTemplates = {
            {"Kick / Intro", 120.0},
            {"Hi-Hats In", 120.0 + (32 * beatInterval)},
            {"Bassline In", 120.0 + (64 * beatInterval)},
            {"Main Break", 120.0 + (96 * beatInterval)},
            {"Drop 1", 120.0 + (128 * beatInterval)},
            {"Mid Break", 120.0 + (160 * beatInterval)},
            {"Drop 2", 120.0 + (192 * beatInterval)},
            {"Outro Mix Point", 240000.0 - (64 * beatInterval)}
        };

        const std::vector<std::string> colors = {
            "#ef4444", "#3b82f6", "#10b981", "#f59e0b",
            "#8b5cf6", "#ec4899", "#06b6d4", "#64748b"
        };

        for (size_t i = 0; i < cueTemplates.size(); ++i) {
            HotCue c;
            c.id = static_cast<int32_t>(i + 1);
            c.name = cueTemplates[i].first;
            c.pos_ms = cueTemplates[i].second;
            c.color_hex = colors[i % colors.size()];
            c.type = (i == 0) ? "IN" : ((i == 4 || i == 6) ? "DROP" : (i == 7 ? "OUTRO" : "BREAK"));
            result.hotcues.cues.push_back(c);
        }

        // 3. TONALIDAD Y ARMONÍA (Harmony)
        result.harmony.standard_key = "A minor";
        result.harmony.camelot_key = "8A";
        result.harmony.open_key = "1m";
        result.harmony.root_freq_hz = 220.0;
        result.harmony.scale_confidence = 0.94;
        result.harmony.chroma_vector = {0.12, 0.05, 0.08, 0.04, 0.15, 0.09, 0.03, 0.22, 0.06, 0.11, 0.02, 0.03};

        // 4. DESCRIPTORES PSICOACÚSTICOS (Descriptors)
        result.descriptors.energy = 0.88;
        result.descriptors.danceability = 0.82;
        result.descriptors.intensity = 0.85;
        result.descriptors.valence = 0.55;
        result.descriptors.arousal = 0.78;
        result.descriptors.sub_bass_density = 0.42;
        result.descriptors.mid_density = 0.38;
        result.descriptors.high_density = 0.20;
        result.descriptors.integrated_lufs = -8.5;
        result.descriptors.dynamic_range_db = 6.2;
        result.descriptors.canonical_genre = "Tech House";
        result.descriptors.tactical_comment = "[128.00 BPM | 8A | A TOPE DE CAÑA] Intro 32b • Drop contundente • Outro 64b";

        // Almacenar en caché y generar silueta espectral (3840 bytes = 1280 cols x 3 bandas)
        {
            std::lock_guard<std::mutex> lock(m_cacheMutex);
            m_analysisCache[filePath] = result;
            
            std::vector<uint8_t> overview(3840, 128);
            m_overviewBuffers[filePath] = std::move(overview);
        }

    } catch (const std::exception& e) {
        result.success = false;
        result.error_message = e.what();
    }

    return result;
}

const uint8_t* BeatWaveCore::getSpectralOverviewBuffer(const std::string& filePath, size_t& outSize) {
    std::lock_guard<std::mutex> lock(m_cacheMutex);
    auto it = m_overviewBuffers.find(filePath);
    if (it != m_overviewBuffers.end()) {
        outSize = it->second.size();
        return it->second.data();
    }
    outSize = 0;
    return nullptr;
}

} // namespace beatwave
