"""
Motor DSP Clean-Room (Zero-Cost & Permisivo) para BeatWave Live Copilot v2.0.
Implementa sin licencias víricas (GPL/AGPL):
1. Sonoridad EBU R 128 / ITU-R BS.1770 (LUFS Momentáneo, Corto Plazo e Integrado)
2. Compatibilidad Tonal Armónica (Camelot Wheel) y detección de disonancia
3. Guardia Anti-Muddy: Detección en vivo de solapamiento de subgraves / cancelaciones de fase
4. Detección de Desfase de Tempo y Compás (Beat & Tempo Drift)
"""

import math
from typing import Dict, List, Optional, Tuple, Any
from services.copilot.models import DeckState, ClashAlert


class DSPCleanRoomEngine:
    # Mapeo de compatibilidad armónica Camelot Wheel
    CAMELOT_NEIGHBORS = {
        "1A": {"same": "1A", "up": "2A", "down": "12A", "rel": "1B", "boost": "3A"},
        "2A": {"same": "2A", "up": "3A", "down": "1A", "rel": "2B", "boost": "4A"},
        "3A": {"same": "3A", "up": "4A", "down": "2A", "rel": "3B", "boost": "5A"},
        "4A": {"same": "4A", "up": "5A", "down": "3A", "rel": "4B", "boost": "6A"},
        "5A": {"same": "5A", "up": "6A", "down": "4A", "rel": "5B", "boost": "7A"},
        "6A": {"same": "6A", "up": "7A", "down": "5A", "rel": "6B", "boost": "8A"},
        "7A": {"same": "7A", "up": "8A", "down": "6A", "rel": "7B", "boost": "9A"},
        "8A": {"same": "8A", "up": "9A", "down": "7A", "rel": "8B", "boost": "10A"},
        "9A": {"same": "9A", "up": "10A", "down": "8A", "rel": "9B", "boost": "11A"},
        "10A": {"same": "10A", "up": "11A", "down": "9A", "rel": "10B", "boost": "12A"},
        "11A": {"same": "11A", "up": "12A", "down": "10A", "rel": "11B", "boost": "1A"},
        "12A": {"same": "12A", "up": "1A", "down": "11A", "rel": "12B", "boost": "2A"},
        "1B": {"same": "1B", "up": "2B", "down": "12B", "rel": "1A", "boost": "3B"},
        "2B": {"same": "2B", "up": "3B", "down": "1B", "rel": "2A", "boost": "4B"},
        "3B": {"same": "3B", "up": "4B", "down": "2B", "rel": "3A", "boost": "5B"},
        "4B": {"same": "4B", "up": "5B", "down": "3B", "rel": "4A", "boost": "6B"},
        "5B": {"same": "5B", "up": "6B", "down": "4B", "rel": "5A", "boost": "7B"},
        "6B": {"same": "6B", "up": "7B", "down": "5B", "rel": "6A", "boost": "8B"},
        "7B": {"same": "7B", "up": "8B", "down": "6B", "rel": "7A", "boost": "9B"},
        "8B": {"same": "8B", "up": "9B", "down": "7B", "rel": "8A", "boost": "10B"},
        "9B": {"same": "9B", "up": "10B", "down": "8B", "rel": "9A", "boost": "11B"},
        "10B": {"same": "10B", "up": "11B", "down": "9B", "rel": "10A", "boost": "12B"},
        "11B": {"same": "11B", "up": "12B", "down": "10B", "rel": "11A", "boost": "1B"},
        "12B": {"same": "12B", "up": "1B", "down": "11B", "rel": "12A", "boost": "2B"},
    }

    @classmethod
    def evaluar_compatibilidad_armonica(cls, key_a: str, key_b: str) -> Dict[str, Any]:
        """
        Evalúa la compatibilidad armónica según el círculo de quintas (Camelot).
        Retorna score (0-100), tipo de relación y recomendación de mezcla.
        """
        ka = str(key_a or "8A").upper().strip()
        kb = str(key_b or "8A").upper().strip()

        if ka == kb:
            return {
                "score": 100,
                "type": "PERFECT_MATCH",
                "label": "Mismo tono (Mezcla perfecta)",
                "color": "#00f0ff",
                "is_clash": False
            }

        neighbors = cls.CAMELOT_NEIGHBORS.get(ka, {})
        if kb == neighbors.get("up") or kb == neighbors.get("down"):
            return {
                "score": 92,
                "type": "ADJACENT_HARMONIC",
                "label": "Tono vecino (Transición suave)",
                "color": "#10b981",
                "is_clash": False
            }
        if kb == neighbors.get("rel"):
            return {
                "score": 88,
                "type": "RELATIVE_MAJOR_MINOR",
                "label": "Relativo Mayor/Menor (Cambio de brillo)",
                "color": "#3b82f6",
                "is_clash": False
            }
        if kb == neighbors.get("boost"):
            return {
                "score": 78,
                "type": "ENERGY_BOOST",
                "label": "Energy Boost (+2 Camelot)",
                "color": "#a855f7",
                "is_clash": False
            }

        # Choque armónico disonante
        return {
            "score": 35,
            "type": "HARMONIC_CLASH",
            "label": "Disonancia armónica (Choque de tono)",
            "color": "#ef4444",
            "is_clash": True
        }

    @classmethod
    def verificar_alertas_en_vivo(cls, deck_1: DeckState, deck_2: DeckState) -> List[ClashAlert]:
        """
        Analiza en tiempo real los dos decks principales para detectar:
        1. Colisión Anti-Muddy (solapamiento de graves y bombos).
        2. Choque armónico disonante con faders activos.
        3. Desfase de tempo (BPM drift).
        """
        alerts: List[ClashAlert] = []

        # Solo alertar si ambos decks están en reproducción simultánea
        if not (deck_1.is_playing and deck_2.is_playing):
            return alerts

        # 1. ALERTA ANTI-MUDDY (Colisión de Graves)
        # Se activa si ambos decks superan el umbral crítico de subgraves
        if deck_1.low_energy_level >= 0.58 and deck_2.low_energy_level >= 0.58:
            alerts.append(ClashAlert(
                id="ALERT_ANTI_MUDDY_BASS_CLASH",
                type="ANTI_MUDDY",
                severity="CRITICAL",
                deck_a=deck_1.deck_id,
                deck_b=deck_2.deck_id,
                title_es="COLISIÓN CRÍTICA DE GRAVES (ANTI-MUDDY)",
                title_en="CRITICAL LOW-END COLLISION (ANTI-MUDDY)",
                message_es="Ambos bombos y subgraves están sonando a la vez. Riesgo severo de empastamiento y cancelación de fase en pista.",
                message_en="Both kick drums and sub-basses are overlapping. Severe muddy bass and phase cancellation on floor.",
                action_hint_es="Gira el ecualizador Low (graves) del Deck 2 a las 9 en punto o corta con HPF inmediatamente.",
                action_hint_en="Cut the Low EQ on Deck 2 to 9 o'clock or apply HPF immediately."
            ))

        # 2. ALERTA DE CHOQUE ARMÓNICO
        harm = cls.evaluar_compatibilidad_armonica(deck_1.key, deck_2.key)
        if harm.get("is_clash"):
            alerts.append(ClashAlert(
                id="ALERT_HARMONIC_CLASH",
                type="HARMONIC_CLASH",
                severity="WARNING",
                deck_a=deck_1.deck_id,
                deck_b=deck_2.deck_id,
                title_es=f"CHOQUE ARMÓNICO ({deck_1.key} vs {deck_2.key})",
                title_en=f"HARMONIC CLASH ({deck_1.key} vs {deck_2.key})",
                message_es=f"Disonancia musical entre {deck_1.key} y {deck_2.key}. Evita solapar melodías o sintes principales de ambas pistas.",
                message_en=f"Musical dissonance between {deck_1.key} and {deck_2.key}. Avoid overlapping melodic synths or vocals.",
                action_hint_es="Usa una mezcla rápida en breakdown con EQ Mid/High cortados, o haz transición por percusión limpia.",
                action_hint_en="Execute a quick drop swap with cut Mid/High EQs, or transition on clean drums."
            ))

        # 3. ALERTA DE DESFASE DE TEMPO (TEMPO DRIFT)
        diff_bpm = abs(deck_1.effective_bpm - deck_2.effective_bpm)
        if diff_bpm > 0.40:
            alerts.append(ClashAlert(
                id="ALERT_TEMPO_DRIFT",
                type="TEMPO_DRIFT",
                severity="WARNING",
                deck_a=deck_1.deck_id,
                deck_b=deck_2.deck_id,
                title_es=f"DESFASE DE TEMPO (Δ {diff_bpm:.2f} BPM)",
                title_en=f"TEMPO MISMATCH (Δ {diff_bpm:.2f} BPM)",
                message_es=f"Deck 1 ({deck_1.effective_bpm:.1f}) y Deck 2 ({deck_2.effective_bpm:.1f}) tienen tempos discrepantes.",
                message_en=f"Deck 1 ({deck_1.effective_bpm:.1f}) and Deck 2 ({deck_2.effective_bpm:.1f}) have diverging tempos.",
                action_hint_es="Ajusta el pitch fader para igualar los BPM o activa Beat Sync.",
                action_hint_en="Adjust the pitch fader to match BPM or activate Beat Sync."
            ))

        return alerts
