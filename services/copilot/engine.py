"""
Motor Principal de BeatWave Live Copilot v2.0 (Clean-Room & Zero-Cost).
Orquesta los receptores de red (Pro DJ Link, OS2L), la lectura de bibliotecas
y el análisis DSP Clean-Room (Anti-Muddy, Armonía y Sonoridad).
Formatea el estado para compatibilidad con la UI de CopilotWorkspace (Desktop & PWA).
"""


import base64
import io
import os
import re
import socket
import struct
import threading
import time
import unicodedata
from typing import Any, Dict, List, Optional

from services.copilot.dsp_cleanroom import DSPCleanRoomEngine
from services.copilot.library_reader import LibraryReader
from services.copilot.models import ClashAlert, DeckState, LiveSessionState
from services.copilot.os2l import OS2LReceiver
from services.copilot.prodjlink import ProDJLinkReceiver
from services.copilot.waveform_3band import waveform_3band_extractor
from services.copilot.mixer_audit import CopilotMixerAuditor


CAMELOT_PALETTE = {
    "1A": "#4ade80", "2A": "#2dd4bf", "3A": "#22d3ee", "4A": "#38bdf8",
    "5A": "#60a5fa", "6A": "#818cf8", "7A": "#a78bfa", "8A": "#c084fc",
    "9A": "#e879f9", "10A": "#f472b6", "11A": "#fb7185", "12A": "#34d399",
    "1B": "#86efac", "2B": "#67e8f9", "3B": "#7dd3fc", "4B": "#93c5fd",
    "5B": "#a5b4fc", "6B": "#c4b5fd", "7B": "#ddd6fe", "8B": "#f0abfc",
    "9B": "#f43f5e", "10B": "#fb923c", "11B": "#facc15", "12B": "#a3e635"
}

# Mapa verificado por captura CoreMIDI real sobre Numark NV II (NV mkII Control)
NV2_CHANNEL_TO_DECK: Dict[int, int] = {0: 1, 1: 2, 2: 3, 3: 4}
NV2_NOTE_CUE: int = 32           # 0x20
NV2_NOTE_PLAY: int = 33          # 0x21
NV2_HOT_CUE_BASE_NOTE: int = 71  # 0x47 (Pads 1..8 -> notas 71..78)
NV2_HOT_CUE_COUNT: int = 8


class CopilotEngine:
    AVAILABLE_PLATFORMS = [
        {"id": "prodjlink", "name": "Pioneer Pro DJ Link", "icon": "🎛️", "color": "#3b82f6", "badge": "PRO DJ LINK"},
        {"id": "os2l", "name": "VirtualDJ / OS2L", "icon": "🎧", "color": "#f97316", "badge": "OS2L TCP"},
        {"id": "rekordbox", "name": "Pioneer Rekordbox", "icon": "💿", "color": "#06b6d4", "badge": "REKORDBOX"},
        {"id": "serato", "name": "Serato DJ Pro", "icon": "⚡", "color": "#8b5cf6", "badge": "SERATO"},
        {"id": "traktor", "name": "Native Instruments Traktor", "icon": "🎚️", "color": "#eab308", "badge": "TRAKTOR"}
    ]

    @staticmethod
    def _resolve_audio_path(raw_path: str) -> Optional[str]:
        """Resuelve rutas absolutas y normalización Unicode NFC/NFD en macOS APFS."""
        if not raw_path:
            return None
        normalized_abs = "/" + raw_path.lstrip("/")
        candidates = (
            raw_path,
            normalized_abs,
            unicodedata.normalize("NFC", normalized_abs),
            unicodedata.normalize("NFD", normalized_abs),
        )
        for candidate in candidates:
            if os.path.isfile(candidate):
                return candidate
        return None

    @staticmethod
    def _decode_base64_clean(raw: bytes) -> bytes:
        """Limpia saltos de línea, espacios y nulos antes de calcular el padding Base64."""
        trimmed = raw.split(b"\x00", 1)[0]
        cleaned = re.sub(rb"[^A-Za-z0-9+/=]", b"", trimmed).rstrip(b"=")
        if not cleaned:
            return b""
        pad = (-len(cleaned)) % 4
        return base64.b64decode(cleaned + (b"=" * pad))

    @staticmethod
    def _parse_serato_markers2_tlv(payload: bytes) -> List[Dict[str, Any]]:
        """Parsea secuencialmente registros TLV binarios de Serato Markers2."""
        cues: List[Dict[str, Any]] = []
        if not payload:
            return cues

        data = payload[2:] if payload.startswith(b"\x01\x01") else payload
        offset = 0
        total = len(data)

        while offset < total:
            null_idx = data.find(b"\x00", offset)
            if null_idx <= offset:
                break
            entry_type = data[offset:null_idx].decode("ascii", errors="ignore")
            offset = null_idx + 1
            if offset + 4 > total:
                break
            entry_len = struct.unpack(">I", data[offset : offset + 4])[0]
            offset += 4
            if offset + entry_len > total:
                break
            cdata = data[offset : offset + entry_len]
            offset += entry_len

            if entry_type == "CUE" and len(cdata) >= 12:
                cid = cdata[1]
                pos_ms = struct.unpack(">I", cdata[2:6])[0]
                r, g, b = cdata[7], cdata[8], cdata[9]
                color = f"#{r:02x}{g:02x}{b:02x}"
                name = cdata[12:].split(b"\x00", 1)[0].decode("utf-8", errors="ignore").strip()
                pos_sec = round(pos_ms / 1000.0, 3)
                cues.append({
                    "id": cid + 1,
                    "cid": cid,
                    "name": name or f"Cue {cid + 1}",
                    "color": color,
                    "pos_ms": pos_ms,
                    "pos_sec": pos_sec,
                    "time": f"{int(pos_ms // 60000):02d}:{(pos_ms % 60000) / 1000.0:05.2f}"
                })

        cues.sort(key=lambda item: item["cid"])
        return cues

    @classmethod
    def _extract_serato_markers_cues(cls, fpath: str) -> List[Dict[str, Any]]:
        """Extrae los hot cues oficiales (FLAC, MP3 ID3 GEOB y MP4) ordenados por slot CUE 1..8."""
        resolved = cls._resolve_audio_path(fpath)
        if not resolved:
            return []

        try:
            import mutagen
            from mutagen.id3 import ID3
            from mutagen.mp4 import MP4

            audio = mutagen.File(resolved)
            if not audio:
                return []

            raw_blob: Optional[bytes] = None
            is_outer_b64 = False

            tags = getattr(audio, "tags", None)
            if isinstance(tags, ID3):
                for key, frame in tags.items():
                    if key.startswith("GEOB:") and getattr(frame, "desc", "") == "Serato Markers2":
                        raw_blob = bytes(frame.data)
                        is_outer_b64 = False
                        break
            elif isinstance(audio, MP4) and tags is not None:
                m_key = "----:com.serato.dj:markersv2"
                if m_key in tags and tags[m_key]:
                    raw_blob = bytes(tags[m_key][0])
                    is_outer_b64 = True
            else:
                val = None
                if tags is not None:
                    for key in tags.keys():
                        if key.lower() in ("serato_markers_v2", "serato markers2"):
                            val = tags.get(key)
                            break
                if val:
                    first = val[0] if isinstance(val, list) else val
                    raw_blob = first.encode("latin1") if isinstance(first, str) else bytes(first)
                    is_outer_b64 = True

            if not raw_blob:
                return []

            stage = cls._decode_base64_clean(raw_blob) if is_outer_b64 else raw_blob
            marker_sig = b"Serato Markers2\x00"
            if marker_sig in stage:
                stage = stage.split(marker_sig, 1)[1]
            if stage.startswith(b"\x01\x01"):
                stage = stage[2:]

            if b"CUE\x00" in stage:
                payload = stage
            else:
                payload = cls._decode_base64_clean(stage)
                if b"CUE\x00" not in payload:
                    for prefix in (b"AQE", b"AQF", b"AQG", b"AQH"):
                        idx = stage.find(prefix)
                        if idx != -1:
                            payload = cls._decode_base64_clean(stage[idx:])
                            if b"CUE\x00" in payload:
                                break

            return cls._parse_serato_markers2_tlv(payload)
        except Exception:
            return []

    @classmethod
    def _extract_track_artwork(cls, fpath: str) -> str:
        """Extrae y cachea la carátula incrustada (FLAC, MP3, MP4) como Data URI ligera."""
        resolved = cls._resolve_audio_path(fpath)
        if not resolved:
            return ""

        try:
            import mutagen
            from mutagen.flac import FLAC
            from mutagen.id3 import ID3
            from mutagen.mp4 import MP4, MP4Cover

            audio = mutagen.File(resolved)
            if not audio:
                return ""

            img_bytes: Optional[bytes] = None
            mime = "image/jpeg"

            if isinstance(audio, FLAC) and audio.pictures:
                pic = audio.pictures[0]
                img_bytes = bytes(pic.data)
                mime = pic.mime or "image/jpeg"
            elif isinstance(getattr(audio, "tags", None), ID3):
                for key, frame in audio.tags.items():
                    if key.startswith("APIC:") and getattr(frame, "data", None):
                        img_bytes = bytes(frame.data)
                        mime = getattr(frame, "mime", "image/jpeg") or "image/jpeg"
                        break
            elif isinstance(audio, MP4) and audio.tags and "covr" in audio.tags and audio.tags["covr"]:
                cover = audio.tags["covr"][0]
                img_bytes = bytes(cover)
                if getattr(cover, "imageformat", None) == MP4Cover.FORMAT_PNG:
                    mime = "image/png"
                else:
                    mime = "image/jpeg"

            if not img_bytes:
                return ""

            try:
                from PIL import Image

                with Image.open(io.BytesIO(img_bytes)) as im:
                    im = im.convert("RGB")
                    im.thumbnail((240, 240), Image.Resampling.LANCZOS)
                    out = io.BytesIO()
                    im.save(out, format="JPEG", quality=78, optimize=True)
                    img_bytes = out.getvalue()
                    mime = "image/jpeg"
            except Exception:
                pass

            b64_img = base64.b64encode(img_bytes).decode("ascii")
            return f"data:{mime};base64,{b64_img}"
        except Exception:
            return ""

    @staticmethod
    def _get_primary_cue_sec(deck: DeckState) -> float:
        """Devuelve el punto CUE 1 oficial en segundos, acotado a la duración de la pista."""
        cue_sec = 0.0
        if deck.hot_cues:
            cue_sec = float(deck.hot_cues[0].get("pos_sec", 0.0))
        if deck.duration_sec > 0:
            return max(0.0, min(deck.duration_sec, cue_sec))
        return max(0.0, cue_sec)

    @staticmethod
    def _sync_deck_metrics(deck: DeckState) -> None:
        """Recalcula beat (1-4), compás (1-32) y frase (128 compases) desde elapsed_sec."""
        if deck.effective_bpm > 0:
            beats_per_sec = deck.effective_bpm / 60.0
            total_beats = max(0.0, deck.elapsed_sec * beats_per_sec)
            deck.beat_number = int(total_beats % 4) + 1
            deck.bar_number = int((total_beats / 4) % 32) + 1
            deck.phrase_progress = round(((total_beats % 128) / 128.0), 3)
        else:
            deck.beat_number = 1
            deck.bar_number = 1
            deck.phrase_progress = 0.0

    @classmethod
    def _reset_deck_clock(cls, deck: DeckState, elapsed_sec: float) -> None:
        """Ancla el reloj monotónico de alta precisión para evitar deriva de playhead."""
        clamped = max(0.0, elapsed_sec)
        if deck.duration_sec > 0:
            clamped = min(deck.duration_sec, clamped)
        deck.elapsed_sec = clamped
        deck.remaining_sec = max(0.0, deck.duration_sec - clamped)
        deck._anchor_perf_ts = time.perf_counter()
        deck._anchor_elapsed_sec = clamped
        cls._sync_deck_metrics(deck)

    def _update_master_deck_auto(self, preferred_deck_id: Optional[int] = None) -> None:
        """Gestiona la asignación y relevo automático del Deck Maestro entre Deck 1 y Deck 2."""
        d1 = self.state.decks.get(1)
        d2 = self.state.decks.get(2)
        if not d1 or not d2:
            return

        current_master = self.state.decks.get(self.state.master_deck)
        current_master_playing = bool(current_master and current_master.is_playing and current_master.bpm > 0)

        new_master_id: Optional[int] = None
        if preferred_deck_id in (1, 2):
            pref = self.state.decks[preferred_deck_id]
            if pref.is_playing and pref.bpm > 0 and not current_master_playing:
                new_master_id = preferred_deck_id
        if new_master_id is None and not current_master_playing:
            if d1.is_playing and d1.bpm > 0:
                new_master_id = 1
            elif d2.is_playing and d2.bpm > 0:
                new_master_id = 2
            elif d1.bpm > 0 and d2.bpm == 0.0:
                new_master_id = 1
            elif d2.bpm > 0 and d1.bpm == 0.0:
                new_master_id = 2

        if new_master_id is not None:
            self.state.master_deck = new_master_id
            for d_id, deck in self.state.decks.items():
                deck.is_master = (d_id == new_master_id)
                if deck.is_playing:
                    if getattr(deck, "_cue_hold_active", False):
                        deck.status = "CUE (PREVIEW)"
                    elif getattr(deck, "_hot_cue_hold_index", None) is not None:
                        hc_idx = int(getattr(deck, "_hot_cue_hold_index", 0))
                        deck.status = f"HOT CUE {hc_idx + 1}"
                    else:
                        deck.status = "ON AIR (MASTER)" if deck.is_master else "REPRODUCIENDO"
            self.state.global_bpm = self.state.decks[new_master_id].effective_bpm

    def __init__(self):
        self.state = LiveSessionState()
        self._lock = threading.RLock()
        self.simulation_mode = False
        self.platform_mode = "serato"
        self.state.platform = "serato"
        self.state.platform_name = "Serato DJ Pro"
        self.serato_db_path = os.path.expanduser("~/Music/_Serato_")
        self.loaded_library_tracks: List[Dict[str, Any]] = []
        self._active_midi_port_name: str = ""
        self._last_midi_trigger: Dict[str, float] = {}
        self._mixer_audit = CopilotMixerAuditor()
        self._shift_held: Dict[int, bool] = {1: False, 2: False}
        self._jog_lsb: Dict[int, int] = {1: 0, 2: 0}
        self._jog_msb: Dict[int, int] = {1: 0, 2: 0}
        self._jog_last_raw: Dict[int, Optional[int]] = {1: None, 2: None}

        self.state.decks = {
            1: DeckState(
                deck_id=1,
                title="",
                artist="",
                bpm=0.0,
                effective_bpm=0.0,
                key="",
                key_name="",
                genre="",
                subgenre="",
                is_master=False,
                is_playing=False,
                duration_sec=0.0,
                elapsed_sec=0.0,
                remaining_sec=0.0,
                energy=0,
                danceability=0,
                low_energy_level=0.0,
                hot_cues=[]
            ),
            2: DeckState(
                deck_id=2,
                title="",
                artist="",
                bpm=0.0,
                effective_bpm=0.0,
                key="",
                key_name="",
                genre="",
                subgenre="",
                is_master=False,
                is_playing=False,
                duration_sec=0.0,
                elapsed_sec=0.0,
                remaining_sec=0.0,
                energy=0,
                danceability=0,
                low_energy_level=0.0,
                hot_cues=[]
            ),
            3: DeckState(deck_id=3, bpm=0.0, key="", is_playing=False),
            4: DeckState(deck_id=4, bpm=0.0, key="", is_playing=False)
        }
        self.state.global_bpm = 0.0

        try:
            self._sync_serato_live_state()
        except Exception:
            pass

        self.prodjlink_receiver = ProDJLinkReceiver(on_packet_callback=self._on_prodjlink_packet)
        self.os2l_receiver = OS2LReceiver(on_event_callback=self._on_os2l_event)

        self._running = True
        self._ticker_thread = threading.Thread(target=self._engine_ticker, name="Copilot-Engine-Ticker", daemon=True)
        self._ticker_thread.start()

        self._midi_thread = threading.Thread(target=self._midi_listener_worker, name="Copilot-Midi-Listener", daemon=True)
        self._midi_thread.start()

        try:
            self.prodjlink_receiver.start()
        except Exception:
            pass
        try:
            self.os2l_receiver.start()
        except Exception:
            pass

    def get_local_ip(self) -> str:
        """Obtiene la IP local de red para visualización en UI y conexión de PWA."""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"

    def _check_running_dj_apps(self) -> Dict[str, Any]:
        """Detecta procesos DJ activos en el sistema operativo y en la red con caché de 2.5s."""
        now = time.time()
        if hasattr(self, "_last_proc_check") and (now - self._last_proc_check) < 2.5:
            return getattr(self, "_cached_proc_result", {"is_open": False, "app_id": None, "app_name": None})

        self._last_proc_check = now
        active_app_id = None
        active_app_name = None

        if self.prodjlink_receiver and (now - self.prodjlink_receiver.last_packet_time) < 3.0:
            active_app_id = "prodjlink"
            active_app_name = "Pioneer Pro DJ Link"
        elif self.os2l_receiver and (now - self.os2l_receiver.last_event_time) < 3.0:
            active_app_id = "os2l"
            active_app_name = "VirtualDJ / OS2L"
        else:
            app_signatures = {
                "serato": ("Serato DJ Pro", ["Serato DJ Pro", "SeratoDJ", "Serato DJ"]),
                "rekordbox": ("Pioneer Rekordbox", ["rekordbox", "rekordboxAgent"]),
                "traktor": ("Native Instruments Traktor", ["Traktor"]),
                "virtualdj": ("VirtualDJ Pro", ["virtualdj", "VirtualDJ"])
            }
            try:
                import subprocess
                import sys

                if sys.platform == "win32":
                    out = subprocess.check_output(["tasklist", "/NH", "/FO", "CSV"], text=True, errors="ignore")
                else:
                    out = subprocess.check_output(["ps", "-A", "-o", "comm="], text=True, errors="ignore")

                lines = out.splitlines()
                for app_id, (app_name, sigs) in app_signatures.items():
                    for sig in sigs:
                        if any(sig.lower() in line.lower() for line in lines):
                            active_app_id = app_id
                            active_app_name = app_name
                            break
                    if active_app_id:
                        break
            except Exception:
                pass

        self._cached_proc_result = {
            "is_open": active_app_id is not None,
            "app_id": active_app_id,
            "app_name": active_app_name
        }
        return self._cached_proc_result

    def detect_active_platform(self) -> str:
        """Detecta si hay hardware activo en la red o bibliotecas en el host."""
        now = time.time()
        if self.prodjlink_receiver and (now - self.prodjlink_receiver.last_packet_time) < 3.0:
            return "prodjlink"
        if self.os2l_receiver and (now - self.os2l_receiver.last_event_time) < 3.0:
            return "os2l"
        rutas = LibraryReader.detectar_rutas_locales()
        if rutas.get("rekordbox_db") or rutas.get("rekordbox_xml"):
            return "rekordbox"
        if rutas.get("serato_dir"):
            return "serato"
        if rutas.get("traktor_nml"):
            return "traktor"
        return "simulation"

    def get_available_platforms(self) -> List[Dict[str, Any]]:
        return self.AVAILABLE_PLATFORMS

    def _apply_library_tracks(self, tracks: List[Dict[str, Any]]):
        """Carga pistas reales extraídas de Rekordbox, Serato o Traktor en los decks."""
        if not tracks:
            return
        self.loaded_library_tracks = tracks
        t1 = tracks[0]
        t2 = tracks[1] if len(tracks) > 1 else tracks[0]

        d1 = self.state.decks.get(1)
        if d1:
            d1.title = t1.get("title", "Track 1")
            d1.artist = t1.get("artist", "Desconocido")
            d1.bpm = float(t1.get("bpm", 128.0))
            d1.effective_bpm = d1.bpm
            d1.key = t1.get("key", "8A")
            d1.key_name = t1.get("key_name", "Am")
            d1.genre = t1.get("genre", "Desconocido")
            d1.subgenre = t1.get("subgenre", "Desconocido")
            d1.duration_sec = float(t1.get("duration", 240))
            self._reset_deck_clock(d1, 24.0)
            d1.is_playing = True
            d1.is_master = True

        d2 = self.state.decks.get(2)
        if d2:
            d2.title = t2.get("title", "Track 2")
            d2.artist = t2.get("artist", "Desconocido")
            d2.bpm = float(t2.get("bpm", 128.0))
            d2.effective_bpm = d2.bpm
            d2.key = t2.get("key", "8A")
            d2.key_name = t2.get("key_name", "Am")
            d2.genre = t2.get("genre", "Desconocido")
            d2.subgenre = t2.get("subgenre", "Desconocido")
            d2.duration_sec = float(t2.get("duration", 240))
            self._reset_deck_clock(d2, 0.0)
            d2.is_playing = False
            d2.is_master = False

        if d1:
            self.state.global_bpm = d1.effective_bpm

    def _restore_simulation_tracks(self):
        """Restaura las pistas de demostración de alta fidelidad."""
        d1 = self.state.decks.get(1)
        if d1:
            d1.title = "Scream"
            d1.artist = "Michael Jackson"
            d1.bpm = 151.73
            d1.effective_bpm = 151.73
            d1.key = "9A"
            d1.key_name = "E minor"
            d1.genre = "Pop"
            d1.subgenre = "Desconocido"
            d1.duration_sec = 278.0
            self._reset_deck_clock(d1, 84.0)
            d1.is_master = True
            d1.is_playing = True

        d2 = self.state.decks.get(2)
        if d2:
            d2.title = "Your Touch"
            d2.artist = "Saâda Bonaire"
            d2.bpm = 110.0
            d2.effective_bpm = 110.0
            d2.key = "6B"
            d2.key_name = "Bb major"
            d2.genre = "Pop"
            d2.subgenre = "Desconocido"
            d2.duration_sec = 255.0
            self._reset_deck_clock(d2, 32.0)
            d2.is_master = False
            d2.is_playing = False

        self.state.global_bpm = 151.73
        self.loaded_library_tracks = []

    def set_platform(self, platform_id: str) -> Dict[str, Any]:
        """Cambia el modo de plataforma activa y carga pistas de la biblioteca correspondiente."""
        with self._lock:
            self.platform_mode = platform_id
            self.state.platform = platform_id
            for p in self.AVAILABLE_PLATFORMS:
                if p["id"] == platform_id:
                    self.state.platform_name = p["name"]
                    break
            self.simulation_mode = (platform_id == "simulation")

            rutas = LibraryReader.detectar_rutas_locales()
            if platform_id == "rekordbox":
                tracks = LibraryReader.leer_rekordbox_tracks(rutas.get("rekordbox_db"))
                self._apply_library_tracks(tracks)
            elif platform_id == "serato":
                tracks = LibraryReader.leer_serato_tracks(rutas.get("serato_dir"))
                self.loaded_library_tracks = tracks
                self._sync_serato_live_state()
            elif platform_id == "traktor":
                tracks = LibraryReader.leer_traktor_tracks(rutas.get("traktor_nml"))
                self._apply_library_tracks(tracks)
            elif platform_id == "simulation":
                self._restore_simulation_tracks()

        return self.get_live_state()

    def set_manual_master(self, deck_id: Any) -> Dict[str, Any]:
        """Designa manualmente el deck Maestro de tempo y tono."""
        with self._lock:
            try:
                target_id = int(deck_id)
            except Exception:
                target_id = 2 if self.state.master_deck == 1 else 1

            if target_id in self.state.decks:
                self.state.master_deck = target_id
                for d_id, deck in self.state.decks.items():
                    deck.is_master = (d_id == target_id)
                    if deck.is_playing:
                        deck.status = "ON AIR (MASTER)" if deck.is_master else "REPRODUCIENDO"
                self.state.global_bpm = self.state.decks[target_id].effective_bpm
        return self.get_live_state()

    def toggle_deck_play(self, deck_id: Any) -> Dict[str, Any]:
        """Alterna el estado de reproducción (Play / Pausa) de un deck con sincronización en cabina."""
        with self._lock:
            try:
                target_id = int(deck_id)
            except Exception:
                target_id = 1
            d = self.state.decks.get(target_id)
            if d and d.title and d.bpm > 0:
                if os.environ.get("COPILOT_MIDI_DEBUG") == "1":
                    import inspect
                    _caller = inspect.stack()[1].function
                    print(f"[COPILOT-TRACE] toggle_deck_play(deck={target_id}) caller={_caller} prev={d.is_playing}", flush=True)
                d._manual_transport_override = True
                # Combo Serato: pulsar Play manteniendo CUE o un Pad Hot Cue bloquea reproducción continua
                if getattr(d, "_cue_hold_active", False) or getattr(d, "_hot_cue_hold_index", None) is not None:
                    d._cue_hold_active = False
                    d._hot_cue_hold_index = None
                    d.is_playing = True
                    self._reset_deck_clock(d, d.elapsed_sec)
                    self._update_master_deck_auto(preferred_deck_id=target_id)
                    d.status = "ON AIR (MASTER)" if d.is_master else "REPRODUCIENDO"
                    return self.get_live_state()

                d.is_playing = not d.is_playing
                if d.is_playing:
                    if d.duration_sec > 0 and d.elapsed_sec >= (d.duration_sec - 0.05):
                        d.elapsed_sec = self._get_primary_cue_sec(d)
                    self._reset_deck_clock(d, d.elapsed_sec)
                    self._update_master_deck_auto(preferred_deck_id=target_id)
                    d.status = "ON AIR (MASTER)" if d.is_master else "REPRODUCIENDO"
                else:
                    d._anchor_perf_ts = None
                    d.status = "PAUSA"
                    self._update_master_deck_auto()
        return self.get_live_state()

    def cue_deck(self, deck_id: Any) -> Dict[str, Any]:
        """Detiene y posiciona el deck en el punto Cue de Serato (exactamente como Serato DJ Pro)."""
        with self._lock:
            try:
                target_id = int(deck_id)
            except Exception:
                target_id = 1
            d = self.state.decks.get(target_id)
            if d and d.title and d.bpm > 0:
                d._manual_transport_override = True
                d._cue_hold_active = False
                d._hot_cue_hold_index = None
                d.is_playing = False
                d._anchor_perf_ts = None
                cue_sec = self._get_primary_cue_sec(d)
                d.elapsed_sec = cue_sec
                d.remaining_sec = max(0.0, d.duration_sec - cue_sec)
                d.status = "CUE (PREPARADO)"
                self._sync_deck_metrics(d)
                self._update_master_deck_auto()
        return self.get_live_state()

    def _cue_hold_start(self, deck_id: int) -> None:
        """Inicia reproducción momentánea (Cue-Hold) desde el CUE 1 mientras se mantiene pulsado CUE."""
        with self._lock:
            d = self.state.decks.get(deck_id)
            if d and d.title and d.bpm > 0:
                d._manual_transport_override = True
                d._cue_hold_active = True
                d._hot_cue_hold_index = None
                cue_sec = self._get_primary_cue_sec(d)
                self._reset_deck_clock(d, cue_sec)
                d.is_playing = True
                d.status = "CUE (PREVIEW)"

    def _handle_nv2_hot_cue_press(self, deck_id: int, cue_index: int) -> None:
        """Gestiona pulsación de Pad Hot Cue 1..8 con paridad exacta respecto a Serato DJ Pro."""
        with self._lock:
            d = self.state.decks.get(deck_id)
            if not d or not d.title or d.bpm <= 0 or not d.hot_cues:
                return
            target_cue = next(
                (c for c in d.hot_cues if int(c.get("cid", -1)) == cue_index),
                None
            )
            if target_cue is None:
                return

            pos_sec = float(target_cue.get("pos_sec", 0.0))
            d._manual_transport_override = True
            in_continuous_play = (
                d.is_playing
                and not getattr(d, "_cue_hold_active", False)
                and getattr(d, "_hot_cue_hold_index", None) is None
            )

            if in_continuous_play:
                # Reproduciendo: salto inmediato al Hot Cue sin interrumpir reproducción
                self._reset_deck_clock(d, pos_sec)
            else:
                # Detenido/en CUE: reproducción momentánea mientras el Pad sigue pulsado
                d._cue_hold_active = False
                d._hot_cue_hold_index = cue_index
                d._hot_cue_hold_pos_sec = pos_sec
                self._reset_deck_clock(d, pos_sec)
                d.is_playing = True
                d.status = f"HOT CUE {cue_index + 1}"

    def _handle_nv2_hot_cue_release(self, deck_id: int, cue_index: int) -> None:
        """Al soltar un Pad en modo Hot-Cue Hold, detiene y retorna exactamente a ese Hot Cue."""
        with self._lock:
            d = self.state.decks.get(deck_id)
            if not d or getattr(d, "_hot_cue_hold_index", None) != cue_index:
                return
            snap_pos = float(getattr(d, "_hot_cue_hold_pos_sec", self._get_primary_cue_sec(d)))
            d._hot_cue_hold_index = None
            d.is_playing = False
            d._anchor_perf_ts = None
            if d.duration_sec > 0:
                snap_pos = max(0.0, min(d.duration_sec, snap_pos))
            else:
                snap_pos = max(0.0, snap_pos)
            d.elapsed_sec = snap_pos
            d.remaining_sec = max(0.0, d.duration_sec - snap_pos)
            d.status = "CUE (PREPARADO)"
            self._sync_deck_metrics(d)
            self._update_master_deck_auto()

    def jump_to_cue(self, deck_id: Any, cue_index: int = 0) -> Dict[str, Any]:
        """Salta milimétricamente al Hot Cue indicado (0..7) desde UI o API preservando reproducción."""
        with self._lock:
            try:
                target_id = int(deck_id)
            except Exception:
                target_id = 1
            d = self.state.decks.get(target_id)
            if d and d.title and d.bpm > 0 and d.hot_cues:
                target_cue = next(
                    (c for c in d.hot_cues if int(c.get("cid", -1)) == cue_index),
                    d.hot_cues[cue_index] if 0 <= cue_index < len(d.hot_cues) else None
                )
                if target_cue:
                    d._manual_transport_override = True
                    pos_sec = float(target_cue.get("pos_sec", 0.0))
                    self._reset_deck_clock(d, pos_sec)
                    if not d.is_playing:
                        d._anchor_perf_ts = None
        return self.get_live_state()

    def _generate_recommendations(self) -> List[Dict[str, Any]]:
        """Genera recomendaciones armónicas y de tempo a partir de la biblioteca cargada."""
        master_id = self.state.master_deck
        master_deck = self.state.decks.get(master_id)
        if not master_deck or master_deck.bpm <= 0:
            master_deck = self.state.decks.get(1) or self.state.decks.get(2)
        if not master_deck:
            return []

        m_key = master_deck.key
        m_bpm = master_deck.effective_bpm

        recs = []
        for i, tr in enumerate(self.loaded_library_tracks[2:12]):
            t_key = tr.get("key", "8A")
            t_bpm = float(tr.get("bpm", 128.0))
            harm = DSPCleanRoomEngine.evaluar_compatibilidad_armonica(m_key, t_key)
            bpm_diff = round(t_bpm - m_bpm, 1)

            recs.append({
                "id": f"rec_{i+1}",
                "title": tr.get("title", f"Track {i+1}"),
                "artist": tr.get("artist", "Desconocido"),
                "bpm": t_bpm,
                "camelot": t_key,
                "camelot_color": CAMELOT_PALETTE.get(t_key, "#00f0ff"),
                "role": "Next Track",
                "lufs": -6.5,
                "low_ratio": 38.0,
                "genre": tr.get("genre", "Desconocido"),
                "subgenre": tr.get("subgenre", "Desconocido"),
                "energy": 85,
                "danceability": 80,
                "duration": "05:30",
                "strategy": harm.get("label", "Mezcla Armónica"),
                "reason": f"{harm.get('label')}. Diferencia de tempo: {bpm_diff:+.1f} BPM.",
                "filepath": tr.get("filepath", "")
            })
        return recs

    def _sync_serato_live_state(self) -> bool:
        """Sincroniza en tiempo real los decks con la sesión activa de Serato DJ Pro en macOS/Windows."""
        serato_db = os.path.expanduser("~/Library/Application Support/Serato/Library/master.sqlite")
        if not os.path.exists(serato_db):
            return False

        try:
            import sqlite3

            conn = sqlite3.connect(f"file:{serato_db}?mode=ro", uri=True, timeout=0.5)
            cur = conn.cursor()

            cur.execute("SELECT id FROM history_session WHERE end_time = -1 ORDER BY id DESC LIMIT 1;")
            s_row = cur.fetchone()
            if not s_row:
                conn.close()
                return False

            active_session_id = s_row[0]

            cur.execute("""
                SELECT id, deck, name, artist, bpm, key, length_ms, portable_id,
                       start_time, end_time, played, genre, format, comments
                FROM history_entry
                WHERE session_id = ? AND end_time = -1
                ORDER BY id DESC;
            """, (active_session_id,))
            rows = cur.fetchall()

            active_decks: Dict[str, Dict[str, Any]] = {}
            for r in rows:
                d_key = str(r[1])
                if d_key not in active_decks:
                    active_decks[d_key] = {
                        "id": r[0],
                        "deck": d_key,
                        "title": r[2] or "",
                        "artist": r[3] or "",
                        "bpm": float(r[4] or 120.0),
                        "key": r[5] or "",
                        "length_ms": int(r[6] or 240000),
                        "portable_id": r[7] or "",
                        "start_time": int(r[8] or time.time()),
                        "end_time": int(r[9] or -1),
                        "played": int(r[10] or 0),
                        "genre": r[11] or "",
                        "format": (r[12] or "").upper(),
                        "comments": r[13] or "",
                    }

            with self._lock:
                for deck_id, deck_key in [(1, "1"), (2, "2")]:
                    d = self.state.decks.get(deck_id)
                    if not d:
                        continue
                    if deck_key in active_decks:
                        t = active_decks[deck_key]
                        dur = (t["length_ms"] / 1000.0) if t["length_ms"] > 0 else 240.0

                        is_new_track = (
                            d.title != t["title"]
                            or abs(d.bpm - t["bpm"]) > 0.05
                            or getattr(d, "_serato_entry_id", None) != t["id"]
                        )
                        if is_new_track:
                            _now_wall = time.time()
                            _was_playing_near_end = bool(
                                d.title and d.is_playing and d.duration_sec > 0 and d.remaining_sec <= 22.0
                            )
                            _ended_naturally_recently = (
                                (_now_wall - float(getattr(d, "_natural_end_ts", 0.0))) <= 15.0
                            )
                            _is_autoplay_handoff = _was_playing_near_end or _ended_naturally_recently
                            d._natural_end_ts = 0.0
                            d.title = t["title"]
                            d.artist = t["artist"]
                            d.bpm = t["bpm"]
                            d.effective_bpm = t["bpm"]
                            d.key = t["key"]
                            d.key_name = t["key"]
                            d.genre = t["genre"]
                            d.duration_sec = dur
                            d._serato_entry_id = t["id"]
                            d._last_serato_played = t["played"]
                            d._manual_transport_override = False
                            d._cue_hold_active = False
                            d._hot_cue_hold_index = None
                            d._hot_cue_hold_pos_sec = 0.0
                            d._audio_format = t["format"] or "AUDIO"
                            d._serato_comments = t["comments"]

                            resolved_path = self._resolve_audio_path(t["portable_id"])
                            d._filepath = resolved_path or ("/" + t["portable_id"].lstrip("/"))

                            # Limpiar SIEMPRE los cues previos y extraer los del archivo físico real
                            d.hot_cues = self._extract_serato_markers_cues(resolved_path) if resolved_path else []
                            d._artwork_data_uri = self._extract_track_artwork(resolved_path) if resolved_path else ""
                            if resolved_path:
                                waveform_3band_extractor.prefetch_async(resolved_path)

                            cue_sec = self._get_primary_cue_sec(d)

                            if _is_autoplay_handoff:
                                _lag_sec = max(0.0, min(15.0, time.time() - float(t["start_time"])))
                                _start_pos = min(dur, _lag_sec)
                                d.is_playing = True
                                d._anchor_perf_ts = time.perf_counter()
                                d._anchor_elapsed_sec = _start_pos
                                d.elapsed_sec = _start_pos
                                d.remaining_sec = max(0.0, dur - _start_pos)
                                d.status = "REPRODUCIENDO (AUTOPLAY)"
                            else:
                                # Carga manual: arrancar posicionado en CUE 1 sin extrapolar
                                d.is_playing = False
                                d._anchor_perf_ts = None
                                d._anchor_elapsed_sec = cue_sec
                                d.elapsed_sec = cue_sec
                                d.remaining_sec = max(0.0, dur - cue_sec)
                                d.status = "CUE (PREPARADO)"
                            self._sync_deck_metrics(d)
                        else:
                            # SQLite nunca fuerza is_playing=True; solo actualiza estado informativo
                            d._last_serato_played = t["played"]
                            if d.is_playing and getattr(d, "_anchor_perf_ts", None) is None:
                                self._reset_deck_clock(d, d.elapsed_sec)
                    else:
                        d.title = ""
                        d.artist = ""
                        d.bpm = 0.0
                        d.effective_bpm = 0.0
                        d.key = ""
                        d.key_name = ""
                        d.duration_sec = 0.0
                        d.elapsed_sec = 0.0
                        d.remaining_sec = 0.0
                        d.is_playing = False
                        d.is_master = False
                        d.status = "STANDBY (VACÍO)"
                        d.hot_cues = []
                        d.genre = ""
                        d.subgenre = ""
                        d._serato_entry_id = None
                        d._last_serato_played = 0
                        d._manual_transport_override = False
                        d._cue_hold_active = False
                        d._hot_cue_hold_index = None
                        d._hot_cue_hold_pos_sec = 0.0
                        d._anchor_perf_ts = None
                        d._filepath = ""
                        d._artwork_data_uri = ""
                        d._audio_format = ""
                        d._serato_comments = ""
                        self._sync_deck_metrics(d)

                self._update_master_deck_auto()

                d1 = self.state.decks.get(1)
                d2 = self.state.decks.get(2)
                master_d = self.state.decks.get(self.state.master_deck)
                if master_d and master_d.bpm > 0:
                    self.state.global_bpm = master_d.effective_bpm
                elif d1 and d1.bpm > 0:
                    self.state.global_bpm = d1.effective_bpm
                elif d2 and d2.bpm > 0:
                    self.state.global_bpm = d2.effective_bpm
                else:
                    self.state.global_bpm = 0.0

                ref_deck = master_d if (master_d and master_d.bpm > 0 and master_d.key) else d1
                if ref_deck and ref_deck.bpm > 0 and ref_deck.key:
                    cur.execute("""
                        SELECT name, artist, bpm, key, genre, length_ms, portable_id
                        FROM asset
                        WHERE bpm BETWEEN ? AND ?
                        LIMIT 20;
                    """, (max(60.0, ref_deck.bpm - 10.0), ref_deck.bpm + 10.0))
                    asset_rows = cur.fetchall()
                    if asset_rows:
                        self.loaded_library_tracks = [
                            {
                                "title": ar[0] or "",
                                "artist": ar[1] or "",
                                "bpm": float(ar[2] or 120.0),
                                "key": ar[3] or "6B",
                                "genre": ar[4] or "Tech House",
                                "duration": "05:30",
                                "filepath": "/" + (ar[6] or "").lstrip("/")
                            }
                            for ar in asset_rows
                        ]

            conn.close()
            return True
        except Exception:
            return False

    def _format_deck_ui(self, deck: DeckState) -> Dict[str, Any]:
        """Formatea un deck con los campos exigidos por CopilotWorkspace en React."""
        if not deck.title or deck.bpm == 0.0:
            return {
                "deck_num": str(deck.deck_id),
                "status": "STANDBY (VACÍO)",
                "is_master": False,
                "is_playing": False,
                "artist": "Deck Vacío",
                "title": "",
                "bpm": 0.0,
                "effective_bpm": 0.0,
                "pitch": 0.0,
                "key": "",
                "camelot": "--",
                "camelot_color": "#27272a",
                "raw_key": "",
                "genre": "",
                "subgenre": "",
                "energy": 0,
                "danceability": 0,
                "duration_sec": 0.0,
                "elapsed_sec": 0.0,
                "remaining_sec": 0.0,
                "play_progress": 0.0,
                "beat_number": 1,
                "bar_number": 1,
                "phrase_progress": 0.0,
                "cues": [],
                "format": "",
                "filepath": "",
                "cover": "",
                "artwork": "",
                "artwork_url": "",
                "cover_url": "",
                "tactical_comment": "Deck vacío • Sin pista cargada en Serato ni en la mesa",
                "low_energy_level": 0.0,
                "lufs_momentary": -99.0,
                "lufs_short_term": -99.0
            }

        prog = round(deck.elapsed_sec / deck.duration_sec, 4) if deck.duration_sec > 0 else 0.0
        if deck.status:
            status_label = deck.status
        elif deck.is_playing:
            status_label = "ON AIR (MASTER)" if deck.is_master else "REPRODUCIENDO"
        else:
            status_label = "PAUSA" if deck.elapsed_sec > 0 else "CUE (PREPARADO)"

        dur = deck.duration_sec if deck.duration_sec > 0 else 240.0
        cues: List[Dict[str, Any]] = []
        if deck.hot_cues:
            for c in deck.hot_cues:
                pos_sec = float(c.get("pos_sec", c.get("position_ms", 0) / 1000.0))
                cues.append({
                    "id": c.get("id", 1),
                    "cid": c.get("cid", int(c.get("id", 1)) - 1),
                    "name": c.get("name", "Cue"),
                    "color": c.get("color", "#06b6d4"),
                    "pos_ms": int(pos_sec * 1000),
                    "pos_sec": pos_sec,
                    "pct": round(pos_sec / dur, 4) if dur > 0 else 0.0,
                    "time": c.get("time", f"{int(pos_sec // 60):02d}:{pos_sec % 60:05.2f}")
                })

        artwork_uri = getattr(deck, "_artwork_data_uri", "") or ""
        filepath = getattr(deck, "_filepath", "") or ""
        audio_fmt = getattr(deck, "_audio_format", "") or "FLAC"
        serato_comments = getattr(deck, "_serato_comments", "") or ""
        tactical_comment = (
            serato_comments
            if serato_comments
            else f"[{deck.effective_bpm:.1f} BPM | {deck.key}] Intro limpia 32b • Fraseo cuantizado"
        )

        return {
            "deck_num": str(deck.deck_id),
            "status": status_label,
            "is_master": deck.is_master,
            "is_playing": deck.is_playing,
            "artist": deck.artist,
            "title": deck.title,
            "bpm": deck.bpm,
            "effective_bpm": deck.effective_bpm,
            "pitch": deck.pitch,
            "key": deck.key,
            "camelot": deck.key,
            "camelot_color": CAMELOT_PALETTE.get(deck.key, "#00f0ff"),
            "raw_key": deck.key_name,
            "genre": deck.genre,
            "subgenre": deck.subgenre,
            "energy": deck.energy,
            "danceability": deck.danceability,
            "duration_sec": deck.duration_sec,
            "elapsed_sec": round(deck.elapsed_sec, 2),
            "remaining_sec": round(max(0.0, deck.duration_sec - deck.elapsed_sec), 2),
            "play_progress": min(1.0, max(0.0, prog)),
            "beat_number": deck.beat_number,
            "bar_number": deck.bar_number,
            "phrase_progress": deck.phrase_progress,
            "cues": cues,
            "format": audio_fmt,
            "filepath": filepath,
            "cover": artwork_uri,
            "artwork": artwork_uri,
            "artwork_url": artwork_uri,
            "cover_url": artwork_uri,
            "tactical_comment": tactical_comment,
            "low_energy_level": deck.low_energy_level,
            "lufs_momentary": deck.lufs_momentary,
            "lufs_short_term": deck.lufs_short_term
        }

    def get_deck_waveform_3band(self, deck_id: Any) -> Dict[str, Any]:
        """Devuelve picos FFT 3Band del deck activo validando siempre contra la ruta en memoria."""
        try:
            target_id = int(deck_id)
        except Exception:
            return {"ready": False, "pending": False, "error": "invalid_deck"}

        with self._lock:
            d = self.state.decks.get(target_id)
            filepath = getattr(d, "_filepath", "") if d else ""

        resolved = self._resolve_audio_path(filepath) if filepath else None
        if not resolved:
            return {"ready": False, "pending": False, "error": "no_local_file"}

        cached = waveform_3band_extractor.get_waveform(resolved, block=False)
        if cached is not None:
            return {"ready": True, "pending": False, **cached}
        return {"ready": False, "pending": True, "filepath": resolved}

    def get_live_state(self) -> Dict[str, Any]:
        """Retorna el estado completo serializado para CopilotWorkspace y endpoints REST/WebSocket."""
        with self._lock:
            d1 = self.state.decks.get(1)
            d2 = self.state.decks.get(2)

            is_deck_2_empty = (not d2 or not d2.title or d2.bpm == 0.0)

            alerts = []
            if d1 and d2 and not is_deck_2_empty:
                alerts = DSPCleanRoomEngine.verificar_alertas_en_vivo(d1, d2)
                self.state.active_alerts = alerts
                self.state.harmonic_relation = DSPCleanRoomEngine.evaluar_compatibilidad_armonica(d1.key, d2.key)

            if is_deck_2_empty:
                anti_muddy_data = {
                    "status": "safe",
                    "tag": "CLEAN MIX",
                    "title": "MEZCLA LIMPIA",
                    "message": "Deck 2 sin pista cargada. Cero riesgo de cancelación acústica. Carga la siguiente pista en Serato o la mesa.",
                    "action": "Frecuencias equilibradas",
                    "controller_knobs": {"filter_knob": "Centrado (12h)", "eq_low": "0 dB"}
                }
            else:
                anti_muddy_alert = next((a for a in alerts if a.type == "ANTI_MUDDY"), None)
                if anti_muddy_alert:
                    anti_muddy_data = {
                        "status": "danger",
                        "tag": "BASS CLASH",
                        "title": anti_muddy_alert.title_es,
                        "message": anti_muddy_alert.message_es,
                        "action": anti_muddy_alert.action_hint_es,
                        "controller_knobs": {"filter_knob": "HPF +20%", "eq_low": "Cut Low EQ -12dB"}
                    }
                elif any(a.type == "HARMONIC_CLASH" for a in alerts):
                    h_alert = next(a for a in alerts if a.type == "HARMONIC_CLASH")
                    anti_muddy_data = {
                        "status": "warning",
                        "tag": "DISONANCIA",
                        "title": h_alert.title_es,
                        "message": h_alert.message_es,
                        "action": h_alert.action_hint_es,
                        "controller_knobs": {"filter_knob": "HPF Transición", "eq_low": "EQ Low 0dB"}
                    }
                else:
                    anti_muddy_data = {
                        "status": "safe",
                        "tag": "CLEAN MIX",
                        "title": "MEZCLA LIMPIA",
                        "message": "Espectro de graves despejado. Sin riesgo de cancelación acústica.",
                        "action": "Frecuencias equilibradas",
                        "controller_knobs": {"filter_knob": "Centrado (12h)", "eq_low": "0 dB"}
                    }

            anti_muddy_data, mixer_audit_data = self._mixer_audit.evaluate_and_audit(
                anti_muddy_data, self.state.master_deck, is_deck_2_empty
            )
            mixer_snapshot = self._mixer_audit.get_mixer_snapshot()

            formatted_decks = {d_id: self._format_deck_ui(d) for d_id, d in self.state.decks.items()}
            dj_app = self._check_running_dj_apps()
            is_serato_running = dj_app.get("is_open") and dj_app.get("app_id") == "serato"

            active_plat = self.platform_mode or ("serato" if is_serato_running else "simulation")
            active_name = self.state.platform_name or ("Serato DJ Pro" if is_serato_running else "Simulación")

            return {
                "connected": True,
                "source": "SERATO_LIVE" if (active_plat == "serato" and is_serato_running) else ("DJLINK_LIVE" if dj_app.get("is_open") else "DJLINK_STANDBY"),
                "platform": active_plat,
                "platform_mode": active_plat,
                "platform_name": active_name,
                "platform_icon": "⚡" if active_plat == "serato" else ("🎛️" if active_plat == "prodjlink" else "🎧"),
                "platform_color": "#00d1e8" if active_plat == "serato" else "#3b82f6",
                "dj_app": dj_app,
                "is_app_open": dj_app.get("is_open", False),
                "is_simulating": False,
                "master_deck": self.state.master_deck,
                "global_bpm": round(self.state.global_bpm, 2),
                "deck_1": formatted_decks.get(1, {}),
                "deck_2": formatted_decks.get(2, {}),
                "deck_3": formatted_decks.get(3, {}),
                "deck_4": formatted_decks.get(4, {}),
                "decks": formatted_decks,
                "anti_muddy": anti_muddy_data,
                "mixer": mixer_snapshot,
                "audit": mixer_audit_data,
                "harmonic": self.state.harmonic_relation,
                "harmonic_relation": self.state.harmonic_relation,
                "active_alerts": [a.to_dict() for a in self.state.active_alerts],
                "recommendations": self._generate_recommendations(),
                "capture_latency_ms": 1.2,
                "last_updated": time.time()
            }

    def _on_prodjlink_packet(self, packet: Dict[str, Any]):
        """Procesa datagramas decodificados de Pioneer Pro DJ Link en caliente."""
        if packet.get("type") == "BEAT_PACKET":
            player_id = packet.get("player_id", 1)
            with self._lock:
                if player_id in self.state.decks:
                    d = self.state.decks[player_id]
                    d.bpm = packet.get("bpm", d.bpm)
                    d.pitch = packet.get("pitch", d.pitch)
                    d.effective_bpm = packet.get("effective_bpm", d.effective_bpm)
                    d.beat_number = packet.get("beat", d.beat_number)
                    d.is_playing = packet.get("is_playing", d.is_playing)
                    if packet.get("is_master"):
                        self.state.master_deck = player_id
                        d.is_master = True
                        self.state.global_bpm = d.effective_bpm

    def _on_os2l_event(self, evt: Dict[str, Any]):
        """Procesa eventos JSON de OS2L (VirtualDJ / Rekordbox)."""
        evt_name = evt.get("evt", "")
        deck_id = evt.get("deck", 1)
        with self._lock:
            if deck_id in self.state.decks:
                d = self.state.decks[deck_id]
                if evt_name == "beat":
                    d.beat_number = evt.get("beat", d.beat_number)
                    if "bpm" in evt:
                        d.bpm = float(evt["bpm"])
                        d.effective_bpm = d.bpm
                elif evt_name == "track":
                    d.title = evt.get("title", d.title)
                    d.artist = evt.get("artist", d.artist)
                    if "bpm" in evt:
                        d.bpm = float(evt["bpm"])
                        d.effective_bpm = d.bpm
                    if "key" in evt:
                        d.key = evt.get("key", d.key)
                elif evt_name in ("play", "pause"):
                    d.is_playing = bool(evt.get("playing", evt_name == "play"))

    def _engine_ticker(self):
        """Ticker continuo de alta frecuencia (20 Hz / 50ms) con reloj monotónico sin deriva."""
        tick_count = 0
        while self._running:
            tick_count += 1

            if tick_count % 5 == 0:
                try:
                    dj_app = self._check_running_dj_apps()
                    if dj_app.get("is_open") and dj_app.get("app_id") == "serato":
                        self._sync_serato_live_state()
                except Exception:
                    pass

            now_perf = time.perf_counter()
            with self._lock:
                for _, d in self.state.decks.items():
                    if d.is_playing and d.title and d.bpm > 0 and d.duration_sec > 0:
                        if getattr(d, "_anchor_perf_ts", None) is None:
                            d._anchor_perf_ts = now_perf
                            d._anchor_elapsed_sec = d.elapsed_sec
                        rate = (d.effective_bpm / d.bpm) if d.bpm > 0 else 1.0
                        d.elapsed_sec = d._anchor_elapsed_sec + (now_perf - d._anchor_perf_ts) * rate
                        if d.elapsed_sec >= d.duration_sec:
                            d.elapsed_sec = d.duration_sec
                            d.is_playing = False
                            d._anchor_perf_ts = None
                            d._cue_hold_active = False
                            d._hot_cue_hold_index = None
                            d._natural_end_ts = time.time()
                        d.remaining_sec = max(0.0, d.duration_sec - d.elapsed_sec)
                        self._sync_deck_metrics(d)

            time.sleep(0.05)

    def _midi_listener_worker(self):
        """Monitorea puertos MIDI de la controladora (Numark NV II, etc.) en segundo plano sin bloquear."""
        try:
            import mido
        except ImportError:
            return

        inport = None
        last_scan = 0.0

        while self._running:
            try:
                now = time.time()
                if inport is None and (now - last_scan) > 2.0:
                    last_scan = now
                    try:
                        available = mido.get_input_names()
                    except Exception:
                        available = []

                    target_port = None
                    for name in available:
                        if "NV mkII Control" in name or "NV" in name:
                            target_port = name
                            break
                    if not target_port:
                        for name in available:
                            if any(k in name.lower() for k in ["numark", "control", "dj", "pioneer", "ddj", "traktor"]):
                                target_port = name
                                break
                    if target_port:
                        try:
                            inport = mido.open_input(target_port)
                            self._active_midi_port_name = target_port
                            if os.environ.get("COPILOT_MIDI_DEBUG") == "1":
                                print(f"[COPILOT-MIDI] Conectado a puerto: {target_port}", flush=True)
                        except Exception:
                            inport = None
                            self._active_midi_port_name = ""

                if inport:
                    for msg in inport.iter_pending():
                        self._process_midi_message(msg)

                time.sleep(0.005)
            except Exception:
                if inport:
                    try:
                        inport.close()
                    except Exception:
                        pass
                inport = None
                self._active_midi_port_name = ""
                time.sleep(1.0)

    def _process_midi_message(self, msg: Any):
        """Máquina de estados MIDI estricta para Numark NV II (ch1/ch2, Play 33, CUE 32, Pads 71..78)."""
        try:
            if self._mixer_audit.ingest_midi(msg):
                return
            msg_type = getattr(msg, "type", "")
            if msg_type == "control_change":
                ch_cc = int(getattr(msg, "channel", -1))
                cc_num = int(getattr(msg, "control", -1))
                cc_val = int(getattr(msg, "value", 0))
                target_deck_cc = NV2_CHANNEL_TO_DECK.get(ch_cc)
                if target_deck_cc in (1, 2) and cc_num in (0, 32):
                    if cc_num == 0:
                        self._jog_lsb[target_deck_cc] = cc_val
                    else:
                        self._jog_msb[target_deck_cc] = cc_val
                        raw = (self._jog_msb[target_deck_cc] << 7) | self._jog_lsb[target_deck_cc]
                        prev = self._jog_last_raw.get(target_deck_cc)
                        self._jog_last_raw[target_deck_cc] = raw
                        if prev is not None and self._shift_held.get(target_deck_cc, False):
                            delta = (raw - prev) % 16384
                            if delta > 8192:
                                delta -= 16384
                            if delta != 0:
                                sec_per_tick = float(os.environ.get("NV2_SHIFT_JOG_SEC_PER_TICK", "0.025"))
                                with self._lock:
                                    d = self.state.decks.get(target_deck_cc)
                                    if d and d.title and d.duration_sec > 0:
                                        new_pos = max(0.0, min(d.duration_sec, d.elapsed_sec + (delta * sec_per_tick)))
                                        d.elapsed_sec = new_pos
                                        d._anchor_elapsed_sec = new_pos
                                        if d.is_playing:
                                            d._anchor_perf_ts = time.perf_counter()
                                        d.remaining_sec = max(0.0, d.duration_sec - new_pos)
                                        self._sync_deck_metrics(d)
                return

            if msg_type not in ("note_on", "note_off"):
                return

            note = getattr(msg, "note", -1)
            if note < 0:
                return

            val = int(getattr(msg, "velocity", 0))
            channel = int(getattr(msg, "channel", -1))
            is_press = (msg_type == "note_on" and val > 0)
            is_release = (msg_type == "note_off" or (msg_type == "note_on" and val == 0))

            port_lower = self._active_midi_port_name.lower()
            is_nv2 = ("nv" in port_lower) or ("numark" in port_lower)

            if is_nv2:
                target_deck = NV2_CHANNEL_TO_DECK.get(channel)
                if target_deck not in (1, 2):
                    return

                if os.environ.get("COPILOT_MIDI_DEBUG") == "1":
                    print(f"[COPILOT-MIDI] deck={target_deck} {msg_type} ch={channel} note={note} vel={val}", flush=True)
                if note == 13:
                    self._shift_held[target_deck] = is_press
                    return
                now = time.perf_counter()

                # 1. PLAY / PAUSE (note 33 / 0x21 o alias 4)
                if note in (NV2_NOTE_PLAY, 4):
                    if not is_press:
                        return
                    k = f"nv2_play_{target_deck}"
                    if now - self._last_midi_trigger.get(k, 0.0) < 0.06:
                        return
                    self._last_midi_trigger[k] = now
                    self.toggle_deck_play(target_deck)
                    return

                # 2. CUE (note 32 / 0x20 o alias 1): parada a CUE + cue-hold momentáneo en note_off
                if note in (NV2_NOTE_CUE, 1):
                    if is_press:
                        k = f"nv2_cue_{target_deck}"
                        if now - self._last_midi_trigger.get(k, 0.0) < 0.04:
                            return
                        self._last_midi_trigger[k] = now
                        with self._lock:
                            d = self.state.decks.get(target_deck)
                            was_playing = bool(d and d.is_playing)
                        if was_playing:
                            self.cue_deck(target_deck)
                        else:
                            self._cue_hold_start(target_deck)
                    elif is_release:
                        with self._lock:
                            d = self.state.decks.get(target_deck)
                            in_cue_hold = bool(d and getattr(d, "_cue_hold_active", False))
                        if in_cue_hold:
                            self.cue_deck(target_deck)
                    return

                # 3. PADS HOT CUE 1..8 (notes 71..78 / 0x47..0x4E)
                if NV2_HOT_CUE_BASE_NOTE <= note < (NV2_HOT_CUE_BASE_NOTE + NV2_HOT_CUE_COUNT):
                    cue_index = note - NV2_HOT_CUE_BASE_NOTE
                    if is_press:
                        k = f"nv2_hc_{target_deck}_{cue_index}"
                        if now - self._last_midi_trigger.get(k, 0.0) < 0.025:
                            return
                        self._last_midi_trigger[k] = now
                        self._handle_nv2_hot_cue_press(target_deck, cue_index)
                    elif is_release:
                        self._handle_nv2_hot_cue_release(target_deck, cue_index)
                    return

                return

            # Respaldo estricto solo Note On para otras mesas (Pioneer DDJ / Traktor)
            if not is_press:
                return
            target_deck = 2 if channel in (1, 3) else 1
            now = time.perf_counter()
            k = f"gen_{target_deck}_{note}"
            if now - self._last_midi_trigger.get(k, 0.0) < 0.08:
                return
            self._last_midi_trigger[k] = now

            if note in (0x0B, 0x3B):
                self.toggle_deck_play(target_deck)
            elif note in (0x0C, 0x3C):
                self.cue_deck(target_deck)
        except Exception:
            pass


# Instancia Singleton compartida
copilot_engine = CopilotEngine()
