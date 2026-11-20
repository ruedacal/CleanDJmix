"""
Decodificador CoreMIDI 14-bit (Numark NV II, ch=0) y Motor de Auditoría Cerrada en Vivo.
Registra posición física exacta de GAIN, HIGH, MID, LOW, FILTER, VOLUME y CROSSFADER,
pondera alertas Anti-Muddy en tiempo real y audita el cumplimiento del DJ (ms de reacción).
"""

from __future__ import annotations

import threading
import time
from typing import Any, Dict, Optional, Tuple


# Mapa oficial 14-bit verificado en Numark NV II (ch=0): MSB -> (target_key, control_name)
NV2_MIXER_MSB_MAP: Dict[int, Tuple[str, str]] = {
    12: ("deck_1", "gain"),
    9:  ("deck_1", "high"),
    10: ("deck_1", "mid"),
    11: ("deck_1", "low"),
    91: ("deck_1", "filter"),
    8:  ("deck_1", "volume"),
    17: ("deck_2", "gain"),
    14: ("deck_2", "high"),
    15: ("deck_2", "mid"),
    16: ("deck_2", "low"),
    92: ("deck_2", "filter"),
    13: ("deck_2", "volume"),
    7:  ("master", "crossfader"),
}

# LSB = MSB + 32 en todos los controles 14-bit de la Numark NV II
NV2_MIXER_LSB_MAP: Dict[int, int] = {msb + 32: msb for msb in NV2_MIXER_MSB_MAP}

# Notas capacitivas de toque en ch=0
NV2_TOUCH_MAP: Dict[int, Tuple[str, str]] = {
    69: ("deck_1", "high"),
    70: ("deck_1", "mid"),
    95: ("deck_1", "filter"),
    96: ("deck_2", "filter"),
}


class CopilotMixerAuditor:
    """Gestiona telemetría 14-bit del mixer físico y auditoría de directivas tácticas."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._msb_raw: Dict[int, int] = {}
        self._lsb_raw: Dict[int, int] = {}
        self._has_midi_activity: bool = False
        self._last_cc_ts: float = 0.0

        self._state: Dict[str, Any] = {
            "deck_1": {"gain": 0.5, "high": 0.5, "mid": 0.5, "low": 0.5, "filter": 0.5, "volume": 1.0},
            "deck_2": {"gain": 0.5, "high": 0.5, "mid": 0.5, "low": 0.5, "filter": 0.5, "volume": 1.0},
            "crossfader": 0.5,
            "touched": {},
            "active": False,
        }

        # Estado de auditoría cerrada de sesión
        self._active_directive: Optional[Dict[str, Any]] = None
        self._in_range_since: Optional[float] = None
        self._total_directives: int = 0
        self._resolved_directives: int = 0
        self._last_reaction_ms: Optional[int] = None
        self._last_resolved_ts: float = 0.0
        self._history: list[Dict[str, Any]] = []

    def ingest_midi(self, msg: Any) -> bool:
        """
        Consume mensajes del mixer NV II en ch=0 (14-bit CC y touch capacitivo).
        Devuelve True si el mensaje fue consumido (no debe pasar al transporte).
        """
        msg_type = getattr(msg, "type", "")
        channel = getattr(msg, "channel", -1)
        if channel != 0:
            return False

        if msg_type == "control_change":
            cc = int(getattr(msg, "control", -1))
            val = int(getattr(msg, "value", 0))

            if cc in NV2_MIXER_MSB_MAP:
                msb_cc = cc
                with self._lock:
                    self._msb_raw[msb_cc] = val
                    lsb_val = self._lsb_raw.get(msb_cc, 0)
                    norm = ((val << 7) | lsb_val) / 16383.0
                    self._apply_control(msb_cc, norm)
                return True

            if cc in NV2_MIXER_LSB_MAP:
                msb_cc = NV2_MIXER_LSB_MAP[cc]
                with self._lock:
                    self._lsb_raw[msb_cc] = val
                    msb_val = self._msb_raw.get(msb_cc)
                    if msb_val is not None:
                        norm = ((msb_val << 7) | val) / 16383.0
                        self._apply_control(msb_cc, norm)
                return True
            return False

        if msg_type in ("note_on", "note_off"):
            note = int(getattr(msg, "note", -1))
            if note in NV2_TOUCH_MAP:
                vel = int(getattr(msg, "velocity", 0))
                is_touched = (msg_type == "note_on") and (vel > 0)
                target, ctrl = NV2_TOUCH_MAP[note]
                with self._lock:
                    self._state["touched"][f"{target}.{ctrl}"] = is_touched
                    self._has_midi_activity = True
                    self._state["active"] = True
                return True

        return False

    def _apply_control(self, msb_cc: int, norm: float) -> None:
        norm_clamped = round(max(0.0, min(1.0, norm)), 4)
        target, ctrl = NV2_MIXER_MSB_MAP[msb_cc]
        if target == "master":
            self._state["crossfader"] = norm_clamped
        else:
            self._state[target][ctrl] = norm_clamped
        self._has_midi_activity = True
        self._state["active"] = True
        self._last_cc_ts = time.time()

    def get_mixer_snapshot(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "active": self._state["active"],
                "crossfader": self._state["crossfader"],
                "deck_1": dict(self._state["deck_1"]),
                "deck_2": dict(self._state["deck_2"]),
                "touched": dict(self._state["touched"]),
                "last_cc_ts": self._last_cc_ts,
            }

    def evaluate_and_audit(
        self,
        anti_muddy_data: Dict[str, Any],
        master_deck: int,
        is_deck_2_empty: bool,
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Evalúa si el DJ mitigó físicamente un Bass Clash y actualiza el estado de auditoría.
        """
        now = time.monotonic()
        with self._lock:
            target_deck = 2 if master_deck == 1 else 1
            d_key = f"deck_{target_deck}"
            ch = self._state[d_key]
            low_val = float(ch["low"])
            filt_val = float(ch["filter"])
            vol_val = float(ch["volume"])
            xf = float(self._state["crossfader"])

            # Comprobar mitigación física real (Low recortado, HPF abierto, fader abajo o crossfader aislado)
            xf_isolated = (target_deck == 2 and xf <= 0.10) or (target_deck == 1 and xf >= 0.90)
            is_mitigated = self._has_midi_activity and (
                low_val <= 0.30 or filt_val >= 0.62 or vol_val <= 0.12 or xf_isolated
            )

            is_danger = (not is_deck_2_empty) and (anti_muddy_data.get("status") == "danger")

            if is_danger:
                if self._active_directive is None or self._active_directive.get("status") == "RESOLVED":
                    self._total_directives += 1
                    self._in_range_since = None
                    self._active_directive = {
                        "id": self._total_directives,
                        "type": "ANTI_MUDDY",
                        "deck": target_deck,
                        "control": "low",
                        "direction": "DOWN",
                        "target_max": 0.30,
                        "label": f"Recortar LOW en Deck {target_deck} (≤30%) o abrir HPF",
                        "status": "PENDING",
                        "created_at": now,
                        "reaction_ms": None,
                    }

                directive = self._active_directive
                if is_mitigated:
                    if self._in_range_since is None:
                        self._in_range_since = now
                        directive["status"] = "IN_PROGRESS"
                    elif (now - self._in_range_since) >= 0.25:
                        if directive["status"] != "RESOLVED":
                            reaction_ms = int(round((now - directive["created_at"]) * 1000.0))
                            directive["status"] = "RESOLVED"
                            directive["reaction_ms"] = reaction_ms
                            self._resolved_directives += 1
                            self._last_reaction_ms = reaction_ms
                            self._last_resolved_ts = now
                            self._history.append({
                                "id": directive["id"],
                                "deck": target_deck,
                                "control": "low",
                                "reaction_ms": reaction_ms,
                                "status": "RESOLVED",
                            })
                            self._history = self._history[-10:]
                else:
                    self._in_range_since = None
                    # Si el usuario empezó a bajar el knob o a tocarlo, marcar IN_PROGRESS
                    if self._has_midi_activity and (low_val < 0.45 or filt_val > 0.55):
                        directive["status"] = "IN_PROGRESS"
                    else:
                        directive["status"] = "PENDING"

                # Si ya está mitigado físicamente, actualizar el banner Anti-Muddy a SAFE
                if is_mitigated:
                    anti_muddy_data = {
                        **anti_muddy_data,
                        "status": "safe",
                        "tag": "MITIGADO ✓",
                        "title": "BASS CLASH RESUELTO EN MESA",
                        "message": f"Recorte físico verificado en Deck {target_deck} (LOW {int(low_val * 100)}% / HPF {int(filt_val * 100)}%). Mezcla despejada.",
                        "action": "Ejecución verificada",
                    }
            else:
                if self._active_directive and self._active_directive.get("status") != "RESOLVED":
                    self._active_directive = None
                    self._in_range_since = None

            score_pct = (
                int(round((self._resolved_directives / self._total_directives) * 100.0))
                if self._total_directives > 0
                else 100
            )

            audit_payload: Dict[str, Any] = {
                "score_pct": score_pct,
                "resolved": self._resolved_directives,
                "total": self._total_directives,
                "last_reaction_ms": self._last_reaction_ms,
                "active_directive": (
                    {
                        "deck": self._active_directive["deck"],
                        "control": self._active_directive["control"],
                        "direction": self._active_directive["direction"],
                        "target_max": self._active_directive["target_max"],
                        "label": self._active_directive["label"],
                        "status": self._active_directive["status"],
                        "reaction_ms": self._active_directive["reaction_ms"],
                    }
                    if self._active_directive
                    else None
                ),
                "recent_flash": (now - self._last_resolved_ts) < 2.5 if self._last_resolved_ts > 0 else False,
            }

            return anti_muddy_data, audit_payload
