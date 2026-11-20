/**
 * BeatWave PRO — Client-Side Genre & Acoustic Descriptors Classifier
 * ==============================================================================
 * Hybrid Frontend discriminatory logic running on bare-metal client (Web / Desktop / Mobile).
 * Ingests 3 neural continuous regression outputs [0.0 - 1.0] (Energy, Intensity, Atmosphere)
 * combined with fractional BPM to enforce deterministic DJ club genre rules.
 */

export interface AcousticDescriptorsInput {
    bpm: number;
    energy: number;       // [0.0 - 1.0] Arousal / Dancefloor drive
    intensity: number;    // [0.0 - 1.0] Aggressiveness / Distortion / Spectral Grit
    atmosphere: number;   // [0.0 - 1.0] Dark / Hypnotic / Reverb depth
    camelotKey?: string;  // e.g. "8A", "11B"
}

export type EnergyTier = "A TOPE DE CAÑA" | "AGITADO" | "CALMA";

export interface GenreClassificationResult {
    canonicalGenre: string;
    subGenre: string;
    energyTier: EnergyTier;
    tacticalComment: string;
    ruleApplied: string;
    confidence: number;
    isClubPeakTime: boolean;
    isAfterHours: boolean;
    recommendation: {
        djAction: string;
        mixInStrategy: string;
        mixOutStrategy: string;
    };
}

/**
 * Discriminador determinista de géneros y comentarios tácticos para DJ.
 * Implementa las reglas duras estipuladas para sustituir modelos no comerciales de MTG.
 *
 * @param input Objeto con BPM y los 3 descriptores neuronales continuos
 * @returns GenreClassificationResult con género canónico, subgénero y comentario DJ
 */
export function classifyTrackGenre(input: AcousticDescriptorsInput): GenreClassificationResult {
    const { bpm, energy, intensity, atmosphere, camelotKey = "8A" } = input;

    // Normalización de seguridad en rangos [0.0 - 1.0]
    const clampedEnergy = Math.max(0.0, Math.min(1.0, energy || 0.0));
    const clampedIntensity = Math.max(0.0, Math.min(1.0, intensity || 0.0));
    const clampedAtmosphere = Math.max(0.0, Math.min(1.0, atmosphere || 0.0));
    const cleanBpm = Math.max(60.0, Math.min(220.0, bpm || 128.0));

    let canonicalGenre = "Electronic";
    let subGenre = "Club";
    let ruleApplied = "Default fallback";
    let confidence = 0.85;

    // ==========================================================================
    // REGLAS DURAS OBLIGATORIAS (HARD-RULES)
    // ==========================================================================

    // Regla 1: BPM > 133 e Intensidad > 0.65 -> Forzar "Peak-Time Techno"
    if (cleanBpm > 133.0 && clampedIntensity > 0.65) {
        canonicalGenre = "Peak-Time Techno";
        subGenre = cleanBpm >= 140.0 ? "Hard / Driving Techno" : "Peak-Time Techno";
        ruleApplied = "HARD_RULE: (BPM > 133 && Intensity > 0.65) -> Peak-Time Techno";
        confidence = 0.98;
    }
    // Regla 2: Intensidad < 0.40 y BPM < 132 -> Forzar "Tech House"
    else if (clampedIntensity < 0.40 && cleanBpm < 132.0) {
        canonicalGenre = "Tech House";
        subGenre = clampedAtmosphere > 0.55 ? "Minimal Tech House" : "Groove Tech House";
        ruleApplied = "HARD_RULE: (Intensity < 0.40 && BPM < 132) -> Tech House";
        confidence = 0.96;
    }
    // ==========================================================================
    // TAXONOMÍA EXTENDIDA CLUB / DANCE
    // ==========================================================================
    else if (cleanBpm >= 142.0 && clampedIntensity >= 0.75) {
        canonicalGenre = "Hard Techno";
        subGenre = "Industrial / Schranz";
        ruleApplied = "RULE: BPM >= 142 & High Intensity";
        confidence = 0.95;
    }
    else if (cleanBpm >= 129.0 && clampedAtmosphere >= 0.68 && clampedIntensity >= 0.45) {
        canonicalGenre = "Raw Techno";
        subGenre = "Deep / Hypnotic Techno";
        ruleApplied = "RULE: BPM >= 129 & High Atmosphere";
        confidence = 0.92;
    }
    else if (cleanBpm >= 122.0 && cleanBpm <= 128.0 && clampedAtmosphere >= 0.55 && clampedEnergy <= 0.78) {
        canonicalGenre = "Melodic Techno";
        subGenre = "Melodic House & Techno";
        ruleApplied = "RULE: 122 <= BPM <= 128 & Atmospheric Melodic";
        confidence = 0.90;
    }
    else if (cleanBpm >= 124.0 && cleanBpm <= 129.0 && clampedIntensity < 0.48 && clampedAtmosphere >= 0.48) {
        canonicalGenre = "Minimal / Deep Tech";
        subGenre = "Microhouse / Romanian Club";
        ruleApplied = "RULE: 124 <= BPM <= 129 & Low Intensity + Mid Atmosphere";
        confidence = 0.89;
    }
    else if (cleanBpm >= 118.0 && cleanBpm <= 125.0 && clampedIntensity < 0.35) {
        canonicalGenre = "Deep House";
        subGenre = "Classic Deep House";
        ruleApplied = "RULE: BPM <= 125 & Very Low Intensity";
        confidence = 0.91;
    }
    else if (cleanBpm >= 138.0 && clampedEnergy >= 0.80 && clampedAtmosphere >= 0.50) {
        canonicalGenre = "Trance";
        subGenre = "Uplifting / Psytrance";
        ruleApplied = "RULE: BPM >= 138 & High Energy + Atmosphere";
        confidence = 0.93;
    }
    else if (cleanBpm >= 126.0 && cleanBpm <= 133.0) {
        canonicalGenre = clampedIntensity >= 0.55 ? "Techno" : "Tech House";
        subGenre = "Driving Club";
        ruleApplied = "HEURISTIC: Median Dance Window";
        confidence = 0.84;
    }

    // Clasificación de Nivel de Energía para Cabina
    let energyTier: EnergyTier = "CALMA";
    if (clampedEnergy >= 0.85) {
        energyTier = "A TOPE DE CAÑA";
    } else if (clampedEnergy >= 0.65) {
        energyTier = "AGITADO";
    }

    const isClubPeakTime = (cleanBpm >= 132.0 && clampedEnergy >= 0.80) || canonicalGenre === "Peak-Time Techno";
    const isAfterHours = (clampedAtmosphere >= 0.65 && clampedIntensity <= 0.50) || canonicalGenre === "Minimal / Deep Tech";

    // Generación de Comentario Táctico Canónico para Serato / Rekordbox / ID3 Tag
    const tacticalComment = `[${cleanBpm.toFixed(2)} BPM | ${camelotKey} | ${canonicalGenre.toUpperCase()}] Intro 32b • Drop contundente • Outro 64b`;

    // Recomendación estratégica para mezcla en cabina
    const recommendation = {
        djAction: isClubPeakTime
            ? "Pista de máxima tensión. Soltar en el primer beat de la frase (Bar 1) tras un drop o breakdown."
            : (isAfterHours
                ? "Mezcla continua y prolongada de 32 o 64 compases. Fundir graves mediante ecualizador aislador."
                : "Alineación de fraseo en Hot Cue 3 (Bassline In). Respetar regla armónica Camelot."),
        mixInStrategy: clampedIntensity > 0.60
            ? "Corte seco o ecualización agresiva: cortar graves de la pista saliente en beat 1 del drop."
            : "Entrada suave progresiva: subir fader progresivamente a lo largo de 16 compases.",
        mixOutStrategy: clampedAtmosphere > 0.60
            ? "Filtrar con High-Pass Filter (HPF) para dejar flotando las colas de reverberación."
            : "Swap de graves en el Hot Cue 8 (Outro Mix Point)."
    };

    return {
        canonicalGenre,
        subGenre,
        energyTier,
        tacticalComment,
        ruleApplied,
        confidence,
        isClubPeakTime,
        isAfterHours,
        recommendation
    };
}

export default classifyTrackGenre;
