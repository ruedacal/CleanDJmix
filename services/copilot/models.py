"""
Modelos de Datos para BeatWave Live Copilot v2.0 (Clean-Room & Zero-Cost).
Define los contratos de estado, telemetría y alertas para cabina en tiempo real.
"""

from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Any
import time


@dataclass
class HotCueCuePoint:
    index: int
    name: str
    position_ms: int
    color: str = "#00f0ff"
    type: str = "cue"  # 'cue', 'loop', 'fade_in', 'fade_out'


@dataclass
class DeckState:
    deck_id: int
    title: str = "DECK STANDBY"
    artist: str = "Preparado para carga"
    bpm: float = 126.0
    pitch: float = 0.0  # Porcentaje de desviación (+/- 8%, +/- 16%)
    effective_bpm: float = 126.0
    key: str = "8A"
    key_name: str = "A minor"
    genre: str = "Desconocido"
    subgenre: str = "Desconocido"
    is_playing: bool = False
    is_master: bool = False
    is_synced: bool = False
    elapsed_sec: float = 0.0
    remaining_sec: float = 0.0
    duration_sec: float = 0.0
    beat_number: int = 1  # 1, 2, 3, 4
    bar_number: int = 1   # Compás dentro de la frase
    phrase_progress: float = 0.0  # 0.0 a 1.0 dentro del ciclo de 32 compases
    hot_cues: List[Dict[str, Any]] = field(default_factory=list)
    energy: int = 70
    danceability: int = 75
    lufs_momentary: float = -14.0
    lufs_short_term: float = -14.0
    low_energy_level: float = 0.5  # Nivel relativo de graves (0.0 a 1.0)
    waveform_overview: List[float] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["effective_bpm"] = round(self.bpm * (1.0 + (self.pitch / 100.0)), 2)
        return d


@dataclass
class ClashAlert:
    id: str
    type: str  # 'ANTI_MUDDY', 'HARMONIC_CLASH', 'TEMPO_DRIFT', 'PHRASE_CLASH'
    severity: str  # 'CRITICAL', 'WARNING', 'INFO'
    deck_a: int
    deck_b: int
    title_es: str
    title_en: str
    message_es: str
    message_en: str
    action_hint_es: str
    action_hint_en: str
    created_at: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class LiveSessionState:
    platform: str = "prodjlink"
    platform_name: str = "Pioneer Pro DJ Link"
    master_deck: int = 1
    global_bpm: float = 126.0
    decks: Dict[int, DeckState] = field(default_factory=dict)
    active_alerts: List[ClashAlert] = field(default_factory=list)
    harmonic_relation: Dict[str, Any] = field(default_factory=dict)
    recommendations: List[Dict[str, Any]] = field(default_factory=list)
    last_updated: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "platform": self.platform,
            "platform_name": self.platform_name,
            "master_deck": self.master_deck,
            "global_bpm": round(self.global_bpm, 2),
            "decks": {k: v.to_dict() if hasattr(v, "to_dict") else v for k, v in self.decks.items()},
            "active_alerts": [a.to_dict() if hasattr(a, "to_dict") else a for a in self.active_alerts],
            "harmonic_relation": self.harmonic_relation,
            "recommendations": self.recommendations,
            "last_updated": self.last_updated
        }
