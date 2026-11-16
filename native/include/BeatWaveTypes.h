#pragma once

#include <string>
#include <vector>
#include <cstdint>

namespace beatwave {

// 1. Estructura de Análisis de Ritmo y Métrica
struct RhythmAnalysis {
    double bpm{0.0};
    double first_downbeat_ms{0.0};
    double grid_offset_ms{0.0};
    double time_signature_num{4.0};
    double time_signature_den{4.0};
    double confidence{0.0};
    std::vector<double> beat_positions_ms;
};

// 2. Estructura de Hot Cue individual y lista de 8 Hot Cues tácticos
struct HotCue {
    int32_t id{0};
    std::string name;
    double pos_ms{0.0};
    std::string color_hex;
    uint8_t color_r{0};
    uint8_t color_g{0};
    uint8_t color_b{0};
    std::string type; // "IN", "DROP", "BREAK", "OUTRO", etc.
};

struct HotCuesAnalysis {
    std::vector<HotCue> cues; // Cues oficiales (Serato/Rekordbox) o calculados por DSP
};

// 3. Estructura de Tonalidad y Análisis Armónico
struct HarmonyAnalysis {
    std::string standard_key; // ej. "A minor"
    std::string camelot_key;  // ej. "8A"
    std::string open_key;     // ej. "1m"
    double root_freq_hz{0.0};
    double scale_confidence{0.0};
    std::vector<double> chroma_vector; // 12 bins de energía de clase de tono (Pitch Class Profile)
};

// 4. Descriptores Psicoacústicos y Métricas de Pista
struct DescriptorsAnalysis {
    double energy{0.0};          // 0.0 - 1.0 (RMS / Loudness ponderado)
    double danceability{0.0};    // 0.0 - 1.0 (Regularidad rítmica)
    double intensity{0.0};       // 0.0 - 1.0 (Densidad espectral)
    double valence{0.0};         // 0.0 - 1.0 (Positividad musical)
    double arousal{0.0};         // 0.0 - 1.0 (Excitación psicoacústica)
    double sub_bass_density{0.0};// % energía <120Hz (Anti-Muddy)
    double mid_density{0.0};     // % energía 120Hz - 2500Hz
    double high_density{0.0};    // % energía >2500Hz
    double integrated_lufs{-14.0};
    double dynamic_range_db{0.0};
    std::string canonical_genre;
    std::string tactical_comment;
};

// Estructura Consolidada de Retorno del Análisis
struct TrackAnalysisResult {
    bool success{false};
    std::string error_message;
    std::string file_path;
    double duration_ms{0.0};
    
    // 4 Sub-objetos arquitectónicos
    RhythmAnalysis rhythm;
    HotCuesAnalysis hotcues;
    HarmonyAnalysis harmony;
    DescriptorsAnalysis descriptors;
};

} // namespace beatwave
