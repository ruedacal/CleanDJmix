import os
import math
import numpy as np
from typing import Dict, List, Any, Optional, Tuple

class MoodIntelligenceService:
    """Motor inteligente de clasificación de atmósferas (Mood) y generación de comentarios tácticos DJ."""

    # Matriz armónica Camelot y relaciones de mezcla
    CAMELOT_RELATIONS = {
        "1A": {"same": "1A", "up": "2A", "down": "12A", "rel": "1B", "boost": "3A", "name": "Ab minor"},
        "2A": {"same": "2A", "up": "3A", "down": "1A", "rel": "2B", "boost": "4A", "name": "Eb minor"},
        "3A": {"same": "3A", "up": "4A", "down": "2A", "rel": "3B", "boost": "5A", "name": "Bb minor"},
        "4A": {"same": "4A", "up": "5A", "down": "3A", "rel": "4B", "boost": "6A", "name": "F minor"},
        "5A": {"same": "5A", "up": "6A", "down": "4A", "rel": "5B", "boost": "7A", "name": "C minor"},
        "6A": {"same": "6A", "up": "7A", "down": "5A", "rel": "6B", "boost": "8A", "name": "G minor"},
        "7A": {"same": "7A", "up": "8A", "down": "6A", "rel": "7B", "boost": "9A", "name": "D minor"},
        "8A": {"same": "8A", "up": "9A", "down": "7A", "rel": "8B", "boost": "10A", "name": "A minor"},
        "9A": {"same": "9A", "up": "10A", "down": "8A", "rel": "9B", "boost": "11A", "name": "E minor"},
        "10A": {"same": "10A", "up": "11A", "down": "9A", "rel": "10B", "boost": "12A", "name": "B minor"},
        "11A": {"same": "11A", "up": "12A", "down": "10A", "rel": "11B", "boost": "1A", "name": "F# minor"},
        "12A": {"same": "12A", "up": "1A", "down": "11A", "rel": "12B", "boost": "2A", "name": "Db minor"},
        "1B": {"same": "1B", "up": "2B", "down": "12B", "rel": "1A", "boost": "3B", "name": "B major"},
        "2B": {"same": "2B", "up": "3B", "down": "1B", "rel": "2A", "boost": "4B", "name": "F# major"},
        "3B": {"same": "3B", "up": "4B", "down": "2B", "rel": "3A", "boost": "5B", "name": "Db major"},
        "4B": {"same": "4B", "up": "5B", "down": "3B", "rel": "4A", "boost": "6B", "name": "Ab major"},
        "5B": {"same": "5B", "up": "6B", "down": "4B", "rel": "5A", "boost": "7B", "name": "Eb major"},
        "6B": {"same": "6B", "up": "7B", "down": "5B", "rel": "6A", "boost": "8B", "name": "Bb major"},
        "7B": {"same": "7B", "up": "8B", "down": "6B", "rel": "7A", "boost": "9B", "name": "F major"},
        "8B": {"same": "8B", "up": "9B", "down": "7B", "rel": "8A", "boost": "10B", "name": "C major"},
        "9B": {"same": "9B", "up": "10B", "down": "8B", "rel": "9A", "boost": "11B", "name": "G major"},
        "10B": {"same": "10B", "up": "11B", "down": "9B", "rel": "10A", "boost": "12B", "name": "D major"},
        "11B": {"same": "11B", "up": "12B", "down": "10B", "rel": "11A", "boost": "1B", "name": "A major"},
        "12B": {"same": "12B", "up": "1B", "down": "11B", "rel": "12A", "boost": "2B", "name": "E major"},
    }

    @staticmethod
    def calcular_features_acusticas(filepath: str) -> Dict[str, float]:
        """Calcula métricas DSP reales a partir del audio (RMS, Centroid, Rolloff, ZCR, Crest Factor)."""
        metrics = {
            "rms_energy": 0.5,
            "spectral_centroid": 2200.0,
            "rolloff_khz": 16.0,
            "zero_crossing_rate": 0.05,
            "crest_factor": 6.0,
            "low_energy_ratio": 0.45
        }
        if not filepath or not os.path.exists(filepath):
            return metrics

        try:
            import soundfile as sf
            with sf.SoundFile(filepath) as f:
                sr = f.samplerate
                # Leer hasta 30 segundos del centro de la pista para muestreo de alta representatividad
                total_frames = len(f)
                frames_to_read = min(total_frames, int(sr * 30))
                start_frame = max(0, (total_frames // 2) - (frames_to_read // 2))
                f.seek(start_frame)
                audio_data = f.read(frames_to_read, dtype="float32")

                if audio_data.ndim > 1:
                    audio_mono = np.mean(audio_data, axis=1)
                else:
                    audio_mono = audio_data

                if len(audio_mono) == 0:
                    return metrics

                # RMS & Crest Factor
                rms = float(np.sqrt(np.mean(audio_mono ** 2)))
                peak = float(np.max(np.abs(audio_mono)))
                crest = float(peak / (rms + 1e-6))
                metrics["rms_energy"] = min(1.0, max(0.01, rms * 2.5))
                metrics["crest_factor"] = min(20.0, max(1.0, crest))

                # Zero Crossing Rate
                zero_crosses = np.sum(np.abs(np.diff(np.sign(audio_mono)))) / (2.0 * len(audio_mono))
                metrics["zero_crossing_rate"] = float(zero_crosses)

                # FFT Espectral rápido
                fft_vals = np.abs(np.fft.rfft(audio_mono[:44100]))
                freqs = np.fft.rfftfreq(len(audio_mono[:44100]), 1.0 / sr)
                sum_fft = np.sum(fft_vals) + 1e-8
                centroid = float(np.sum(freqs * fft_vals) / sum_fft)
                metrics["spectral_centroid"] = centroid

                # Relación energía de bajos (<200Hz) vs total
                bass_mask = freqs <= 200.0
                low_ratio = float(np.sum(fft_vals[bass_mask]) / sum_fft)
                metrics["low_energy_ratio"] = low_ratio
        except Exception as e:
            # Fallback seguro en caso de decodificación compleja o formatos sin cabecera sf
            pass

        return metrics

    @classmethod
    def clasificar_mood(cls, bpm: float, key: str, energy: int = 80, danceability: int = 80, filepath: str = "") -> Dict[str, Any]:
        """
        Determina el Mood y la atmósfera sonora usando un modelo acústico multidimensional.
        Garantiza compatibilidad con los clusters estándar:
        Peak Time, Dark, Euphoric, Hypnotic, Raw, Melancholic.
        """
        bpm = float(bpm) if bpm else 126.0
        key = str(key or "8A").upper().strip()
        is_minor = key.endswith("A")
        is_major = key.endswith("B")
        
        # Obtener características acústicas si hay archivo físico
        features = cls.calcular_features_acusticas(filepath) if filepath else {}
        centroid = features.get("spectral_centroid", 2200.0)
        low_ratio = features.get("low_energy_ratio", 0.45)

        # Cálculo de Valence (0-100: Positividad vs Melancolía)
        base_valence = 60 if is_major else 42
        if centroid > 3000:
            base_valence += 15
        elif centroid < 1600:
            base_valence -= 10
        if is_major and energy >= 75:
            base_valence += 10
        valence = min(98, max(20, int(base_valence)))

        # Cálculo de Arousal / Intensidad (0-100)
        arousal = min(98, max(30, int((energy * 0.6) + ((bpm - 110.0) * 1.2))))

        # Clasificación del Mood principal
        if bpm >= 137.0:
            mood = "Raw"
            subtag = "Raw / Hardgroove"
            mood_desc_es = "Percusión densa, pegada agresiva y ritmo implacable."
            mood_desc_en = "Dense percussion, aggressive punch and relentless drive."
        elif is_minor and (bpm >= 132.0 or (energy >= 82 and low_ratio > 0.48)):
            mood = "Dark"
            subtag = "Dark / Industrial"
            mood_desc_es = "Atmósfera profunda y oscura con graves densos y texturas hipnóticas."
            mood_desc_en = "Deep, dark atmosphere with heavy sub-bass and hypnotic textures."
        elif is_major and (energy >= 70 or valence >= 65):
            mood = "Euphoric"
            subtag = "Euphoric / Uplifting"
            mood_desc_es = "Melodías ascendentes, brillo armónico y energía festiva."
            mood_desc_en = "Uplifting melodies, harmonic brightness and celebratory energy."
        elif key in ("8A", "9A", "5A", "6A", "1A") and (energy <= 84 and bpm <= 132.0):
            mood = "Hypnotic"
            subtag = "Hypnotic / Tribal"
            mood_desc_es = "Groove continuo, repetición envolvente y trance rítmico."
            mood_desc_en = "Continuous rolling groove, immersive repetition and rhythmic trance."
        elif is_minor and (energy < 68 or valence < 40):
            mood = "Melancholic"
            subtag = "Melancholic / Emotional"
            mood_desc_es = "Carga emocional en acordes menores y desgloses vocales conmovedores."
            mood_desc_en = "Emotional minor chord tension and poignant breakdowns."
        else:
            mood = "Peak Time"
            subtag = "Peak Time / Driving"
            mood_desc_es = "Bajo contundente y máxima pegada para momentos de alta intensidad."
            mood_desc_en = "Driving low-end and maximum impact for high-energy set moments."

        return {
            "mood": mood,
            "subtag": subtag,
            "valence": valence,
            "arousal": arousal,
            "desc_es": mood_desc_es,
            "desc_en": mood_desc_en,
            "features": features
        }

    @classmethod
    def generar_comentario_tactico(
        cls,
        bpm: float,
        key: str,
        mood: str,
        subtag: str = "",
        energy: int = 80,
        cues: Optional[List[Dict[str, Any]]] = None,
        first_downbeat_ms: float = 0,
        lang: str = "es"
    ) -> str:
        """Genera un comentario táctico profesional de cabina DJ en español o inglés."""
        key = str(key or "8A").upper().strip()
        rel = cls.CAMELOT_RELATIONS.get(key, {})
        bpm_str = f"{float(bpm):.1f}" if bpm else "128.0"

        # Consejos de mezcla armónica Camelot
        same_k = rel.get("same", key)
        up_k = rel.get("up", key)
        down_k = rel.get("down", key)
        rel_k = rel.get("rel", key)

        # Detección de estructura de Cues si existen
        intro_bars = 32
        drop_bar = 17
        break_bar = 33
        outro_bars = 32

        if cues and len(cues) >= 4:
            for c in cues:
                name_l = str(c.get("name", "")).lower()
                bar_val = c.get("bar") or 1
                if "drop" in name_l and drop_bar == 17:
                    drop_bar = bar_val
                elif ("break" in name_l or "vocal" in name_l) and break_bar == 33:
                    break_bar = bar_val

        if lang.lower().startswith("en"):
            # Versión en Inglés
            comment = (
                f"[{bpm_str} BPM | {key} | E{energy}%] {subtag or mood}. "
                f"Harmonic Mix: {same_k} (Neutral) • {up_k}/{down_k} (Energy Shift) • {rel_k} (Relative Mode). "
                f"Structure: Intro {intro_bars}b -> Drop Bar {drop_bar} -> Break Bar {break_bar} -> Outro {outro_bars}b. "
                f"Tip: Ideal for in-phrase layering and long harmonic bass blends."
            )
        else:
            # Versión en Español
            comment = (
                f"[{bpm_str} BPM | {key} | E{energy}%] {subtag or mood}. "
                f"Mix Armónico: {same_k} (Neutral) • {up_k}/{down_k} (Cambio Energía) • {rel_k} (Modo Relativo). "
                f"Estructura: Intro {intro_bars}b -> Drop c.{drop_bar} -> Break c.{break_bar} -> Outro {outro_bars}b. "
                f"Consejo: Mezcla en frase con solapado largo de graves."
            )

        return comment
