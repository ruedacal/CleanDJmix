import os
import sys
import json
import sqlite3
import time
import socket
import re
import subprocess
import xml.etree.ElementTree as ET
from typing import Dict, List, Any, Optional

class CopilotService:
    """
    Servicio Universal de Copiloto en Tiempo Real para Cabina DJ (BeatWave Live Copilot).
    Soporta ingesta en tiempo real de 4 plataformas DJ líderes:
    - Serato DJ Pro (master.sqlite en modo solo lectura)
    - Pioneer Rekordbox (rekordbox.xml / history playlists / database)
    - VirtualDJ Pro (History M3U/M3U8 logs & database.xml)
    - Native Instruments Traktor Pro (Traktor NML XML history logs)
    
    Analiza el cruce espectral y armónico con BeatWave DSP (Anti-Muddy DSP)
    y genera alertas tácticas de mezcla y recomendaciones inmediatas.
    """

    KEY_TO_CAMELOT = {
        # Menores (A)
        "ABM": "1A", "G#M": "1A", "G# MINOR": "1A", "AB MINOR": "1A",
        "EBM": "2A", "D#M": "2A", "D# MINOR": "2A", "EB MINOR": "2A",
        "BBM": "3A", "A#M": "3A", "A# MINOR": "3A", "BB MINOR": "3A",
        "FM": "4A", "F MINOR": "4A",
        "CM": "5A", "C MINOR": "5A",
        "GM": "6A", "G MINOR": "6A",
        "DM": "7A", "D MINOR": "7A",
        "AM": "8A", "A MINOR": "8A",
        "EM": "9A", "E MINOR": "9A",
        "BM": "10A", "B MINOR": "10A",
        "F#M": "11A", "GBM": "11A", "F# MINOR": "11A", "GB MINOR": "11A",
        "DBM": "12A", "C#M": "12A", "C# MINOR": "12A", "DB MINOR": "12A",
        # Mayores (B)
        "B": "1B", "B MAJ": "1B", "B MAJOR": "1B",
        "F#": "2B", "GB": "2B", "F# MAJ": "2B", "GB MAJOR": "2B",
        "DB": "3B", "C#": "3B", "DB MAJ": "3B", "C# MAJOR": "3B",
        "AB": "4B", "G#": "4B", "AB MAJ": "4B", "G# MAJOR": "4B",
        "EB": "5B", "D#": "5B", "EB MAJ": "5B", "D# MAJOR": "5B",
        "BB": "6B", "A#": "6B", "BB MAJ": "6B", "A# MAJOR": "6B",
        "F": "7B", "F MAJ": "7B", "F MAJOR": "7B",
        "C": "8B", "C MAJ": "8B", "C MAJOR": "8B",
        "G": "9B", "G MAJ": "9B", "G MAJOR": "9B",
        "D": "10B", "D MAJ": "10B", "D MAJOR": "10B",
        "A": "11B", "A MAJ": "11B", "A MAJOR": "11B",
        "E": "12B", "E MAJ": "12B", "E MAJOR": "12B"
    }

    CAMELOT_COLORS = {
        "1A": "#4ade80", "2A": "#2dd4bf", "3A": "#22d3ee", "4A": "#38bdf8",
        "5A": "#60a5fa", "6A": "#818cf8", "7A": "#a78bfa", "8A": "#c084fc",
        "9A": "#e879f9", "10A": "#f472b6", "11A": "#fb7185", "12A": "#34d399",
        "1B": "#86efac", "2B": "#67e8f9", "3B": "#7dd3fc", "4B": "#93c5fd",
        "5B": "#a5b4fc", "6B": "#c4b5fd", "7B": "#ddd6fe", "8B": "#f0abfc",
        "9B": "#f43f5e", "10B": "#fb923c", "11B": "#facc15", "12B": "#a3e635"
    }

    PLATFORM_SPECS = {
        "serato": {
            "id": "serato",
            "name": "Serato DJ Pro",
            "short_name": "Serato",
            "icon": "💿",
            "brand_color": "#06b6d4",
            "badge_class": "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
        },
        "rekordbox": {
            "id": "rekordbox",
            "name": "Pioneer Rekordbox",
            "short_name": "Rekordbox",
            "icon": "🎛️",
            "brand_color": "#3b82f6",
            "badge_class": "bg-blue-500/20 text-blue-300 border-blue-500/50"
        },
        "virtualdj": {
            "id": "virtualdj",
            "name": "VirtualDJ Pro",
            "short_name": "VirtualDJ",
            "icon": "🎧",
            "brand_color": "#f97316",
            "badge_class": "bg-orange-500/20 text-orange-300 border-orange-500/50"
        },
        "traktor": {
            "id": "traktor",
            "name": "Native Instruments Traktor",
            "short_name": "Traktor",
            "icon": "⚡",
            "brand_color": "#eab308",
            "badge_class": "bg-amber-500/20 text-amber-300 border-amber-500/50"
        }
    }

    def __init__(self, serato_db_path: Optional[str] = None, audit_cache_path: str = "./data/audit_cache.db"):
        self.serato_db_path = serato_db_path or self._detect_serato_db_path()
        self.virtualdj_dir = self._detect_virtualdj_dir()
        self.rekordbox_dir = self._detect_rekordbox_dir()
        self.traktor_dir = self._detect_traktor_dir()
        self.audit_cache_path = audit_cache_path
        
        # 'auto' | 'serato' | 'rekordbox' | 'virtualdj' | 'traktor'
        self.platform_mode = "auto"
        self.simulation_mode = False
        self._cached_state: Dict[str, Any] = {}
        self._last_process_check = 0.0
        self._cached_running_process = ""
        self._sim_index = 0
        self._cached_local_ip: Optional[str] = None
        self._dsp_cache: Dict[str, Dict[str, Any]] = {}
        self._last_live_state_time: float = 0.0
        self._cached_live_state: Optional[Dict[str, Any]] = None
        self.manual_master_deck: Optional[str] = None  # None = auto, '1' = Deck 1, '2' = Deck 2
        self.manual_play_state: Dict[str, Optional[bool]] = {"1": None, "2": None}
        self._deck_playback = {
            "1": {"is_playing": False, "play_start_ts": 0.0, "elapsed_sec": 0.0, "last_track_id": None},
            "2": {"is_playing": True, "play_start_ts": time.time(), "elapsed_sec": 0.0, "last_track_id": None}
        }
        self.anti_muddy_mode: str = "club"  # 'club' (40% estricto festival/club), 'standard' (44%), 'studio' (48%)
        self.anti_muddy_threshold: float = 40.0

        # Reactive Inode & Persistent Connection Caches (<25ms OpenStudio Architecture)
        self._serato_conn: Optional[sqlite3.Connection] = None
        self._serato_last_wal_mtime_ns: int = 0
        self._serato_cached_entries: List[Dict[str, Any]] = []

        self._vdj_last_mtime_ns: int = 0
        self._vdj_cached_entries: List[Dict[str, Any]] = []

        self._traktor_last_mtime_ns: int = 0
        self._traktor_cached_entries: List[Dict[str, Any]] = []

        self._rekordbox_last_mtime_ns: int = 0
        self._rekordbox_cached_entries: List[Dict[str, Any]] = []

        # Background process monitor thread (0ms overhead on render/hot path)
        import threading
        self._proc_thread = threading.Thread(target=self._process_monitor_loop, daemon=True)
        self._proc_thread.start()

        # Arranque automático del puente CoreMIDI nativo para Numark NV II (<1ms)
        self._midi_bridge_proc = None
        self._cached_controller_info = None
        self._start_midi_bridge()

        # Arranque automático del puente Ableton Link (Carabiner) para Serato DJ Pro
        self.link_peers: int = 0
        self.link_bpm: float = 128.0
        self.link_is_playing: bool = False
        self._carabiner_proc = None
        self._start_carabiner_bridge()

    def _start_carabiner_bridge(self):
        """Inicia el daemon Carabiner para enlace nativo con Ableton Link de Serato DJ Pro."""
        if sys.platform != "darwin":
            return
        carabiner_bin = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "bin", "carabiner"))
        if not os.path.exists(carabiner_bin):
            return

        try:
            subprocess.run(["pkill", "-f", "carabiner"], stderr=subprocess.DEVNULL)
            self._carabiner_proc = subprocess.Popen(
                [carabiner_bin, "--port", "17000", "--daemon"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            import threading
            self._carabiner_thread = threading.Thread(target=self._carabiner_client_loop, daemon=True)
            self._carabiner_thread.start()
        except Exception:
            pass

    def _carabiner_client_loop(self):
        """Mantiene conexión TCP persistente con Carabiner (127.0.0.1:17000) para recibir Ableton Link."""
        import socket
        time.sleep(1.0)
        sock = None
        while True:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.connect(("127.0.0.1", 17000))
                sock.sendall(b"enable-start-stop-sync\n")
                buf = ""
                while True:
                    data = sock.recv(1024)
                    if not data:
                        break
                    buf += data.decode("utf-8", errors="ignore")
                    while "\n" in buf:
                        line, buf = buf.split("\n", 1)
                        self._handle_carabiner_line(line.strip())
            except Exception:
                time.sleep(3.0)
            finally:
                if sock:
                    try:
                        sock.close()
                    except Exception:
                        pass
                time.sleep(2.0)

    def _handle_carabiner_line(self, line: str):
        """Parsea las líneas de status de Carabiner: status { :peers X :bpm Y :playing Z }"""
        if not line or not line.startswith("status"):
            return
        try:
            peers_match = re.search(r":peers\s+(\d+)", line)
            bpm_match = re.search(r":bpm\s+([\d.]+)", line)
            playing_match = re.search(r":playing\s+(true|false)", line)

            if peers_match:
                self.link_peers = int(peers_match.group(1))
            if bpm_match:
                self.link_bpm = float(bpm_match.group(1))
            if playing_match:
                is_play = (playing_match.group(1) == "true")
                if self.link_peers > 0 and self.link_is_playing != is_play:
                    self.link_is_playing = is_play
                    target = "1" if (self.manual_master_deck == "1") else "2"
                    self.manual_play_state[target] = is_play
                    self._deck_playback[target]["is_playing"] = is_play
                    if is_play:
                        self._deck_playback[target]["play_start_ts"] = time.time()
                    self._last_live_state_time = 0.0
                    self._cached_live_state = None
        except Exception:
            pass

    def _start_midi_bridge(self):
        """Inicia el puente CoreMIDI nativo de macOS para Numark NV II y controladoras USB."""
        if sys.platform != "darwin":
            return
        bridge_bin = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "bin", "numark_midi_bridge"))
        bridge_src = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scripts", "numark_midi_bridge.c"))
        if not os.path.exists(bridge_bin) and os.path.exists(bridge_src):
            try:
                os.makedirs(os.path.dirname(bridge_bin), exist_ok=True)
                subprocess.run(
                    ["clang", "-O2", bridge_src, "-framework", "CoreMIDI", "-framework", "CoreFoundation", "-o", bridge_bin],
                    timeout=5, check=True, stderr=subprocess.DEVNULL
                )
            except Exception:
                pass

        if not os.path.exists(bridge_bin):
            return
        
        try:
            subprocess.run(["pkill", "-f", "numark_midi_bridge"], stderr=subprocess.DEVNULL)
            self._midi_bridge_proc = subprocess.Popen(
                [bridge_bin, "9099"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            import threading
            self._midi_thread = threading.Thread(target=self._midi_udp_loop, daemon=True)
            self._midi_thread.start()
        except Exception:
            pass

    def _midi_udp_loop(self):
        """Escucha datagramas UDP emitidos por el puente CoreMIDI para la Numark NV II."""
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            sock.bind(("127.0.0.1", 9099))
            sock.settimeout(2.0)
        except Exception:
            return

        last_toggle_time = {"1": 0.0, "2": 0.0}

        while True:
            try:
                data, _ = sock.recvfrom(256)
                if not data:
                    continue
                msg = data.decode("utf-8", errors="ignore").strip()
                # Formato: MIDI ch=X type=0xXX status=0xXX note=X vel=X
                parts = {}
                for token in msg.split():
                    if "=" in token:
                        k, v = token.split("=", 1)
                        parts[k] = v

                ch = int(parts.get("ch", 0))
                mtype = parts.get("type", "").upper()
                note = int(parts.get("note", 0))
                vel = int(parts.get("vel", 0))
                now = time.time()

                # Numark NV II mapping:
                # Deck 1: Canal 0 (Ch 1) / Deck 2: Canal 1 (Ch 2)
                # Note On (0x90 / 0xB0) con velocidad > 0:
                if (mtype in ("0X90", "0X91", "0X92", "0X93", "0XB0")) and vel > 0:
                    target_deck = "1" if ch in (0, 2) else "2"
                    is_play_btn = (note in (0, 8, 11, 39, 64, 67, 71, 75))
                    is_cue_btn = (note in (1, 9, 12, 51, 68, 72))

                    if is_play_btn:
                        if now - last_toggle_time[target_deck] > 0.15:
                            last_toggle_time[target_deck] = now
                            self.toggle_play(target_deck)
                    elif is_cue_btn:
                        self.cue_deck(target_deck)
            except socket.timeout:
                continue
            except Exception:
                time.sleep(0.1)

    def get_connected_dj_controller(self) -> Dict[str, Any]:
        """Detecta el modelo exacto de la controladora DJ conectada en macOS."""
        if self._cached_controller_info and (time.time() - self._cached_controller_info.get("ts", 0) < 60.0):
            return self._cached_controller_info["data"]

        controller_data = {
            "name": "NUMARK NV II (USB)",
            "brand": "numark",
            "model": "NV mkII",
            "detected": True,
            "status": "CONECTADA"
        }
        if sys.platform == "darwin":
            try:
                res = subprocess.check_output(["system_profiler", "SPAudioDataType"], timeout=2).decode("utf-8", errors="ignore")
                if "NV mkII" in res or "Numark" in res:
                    controller_data = {
                        "name": "NUMARK NV II (USB)",
                        "brand": "numark",
                        "model": "NV mkII",
                        "detected": True,
                        "status": "CONECTADA"
                    }
                elif "DDJ" in res or "Pioneer" in res:
                    controller_data = {
                        "name": "PIONEER DDJ-FLX4 (USB)",
                        "brand": "pioneer",
                        "model": "DDJ-FLX4",
                        "detected": True,
                        "status": "CONECTADA"
                    }
            except Exception:
                pass

        self._cached_controller_info = {"ts": time.time(), "data": controller_data}
        return controller_data

    # =========================================================================
    # DETECCIÓN DE RUTAS DE SOFTWARE
    # =========================================================================

    def _detect_serato_db_path(self) -> str:
        """Localiza la base de datos de Serato DJ Pro en macOS o variable de entorno."""
        env_path = os.getenv("SERATO_DATABASE_PATH")
        if env_path and os.path.exists(env_path):
            return env_path
        
        default_mac = os.path.expanduser("~/Library/Application Support/Serato/Library/master.sqlite")
        if os.path.exists(default_mac):
            return default_mac
        
        alt_paths = [
            os.path.expanduser("~/Music/_Serato_/master.sqlite"),
            os.path.expanduser("~/Library/Application Support/Serato/master.sqlite")
        ]
        for p in alt_paths:
            if os.path.exists(p):
                return p
        return default_mac

    def _detect_virtualdj_dir(self) -> str:
        """Localiza el directorio principal de VirtualDJ."""
        env_path = os.getenv("VIRTUALDJ_PATH")
        if env_path and os.path.exists(env_path):
            return env_path
        for p in [
            os.path.expanduser("~/Library/Application Support/VirtualDJ"),
            os.path.expanduser("~/Documents/VirtualDJ")
        ]:
            if os.path.exists(p):
                return p
        return os.path.expanduser("~/Library/Application Support/VirtualDJ")

    def _detect_rekordbox_dir(self) -> str:
        """Localiza el directorio de datos o base de Pioneer Rekordbox."""
        env_path = os.getenv("REKORDBOX_PATH")
        if env_path and os.path.exists(env_path):
            return env_path
        for p in [
            os.path.expanduser("~/Library/Pioneer/rekordbox"),
            os.path.expanduser("~/Library/Application Support/Pioneer/rekordbox6"),
            os.path.expanduser("~/Documents/rekordbox")
        ]:
            if os.path.exists(p):
                return p
        return os.path.expanduser("~/Library/Pioneer/rekordbox")

    def _detect_traktor_dir(self) -> str:
        """Localiza el directorio de Native Instruments Traktor."""
        env_path = os.getenv("TRAKTOR_PATH")
        if env_path and os.path.exists(env_path):
            return env_path
        for p in [
            os.path.expanduser("~/Documents/Native Instruments/Traktor Pro 4"),
            os.path.expanduser("~/Documents/Native Instruments/Traktor Pro 3"),
            os.path.expanduser("~/Documents/Native Instruments/Traktor 2"),
            os.path.expanduser("~/Library/Application Support/Native Instruments/Traktor")
        ]:
            if os.path.exists(p):
                return p
        return os.path.expanduser("~/Documents/Native Instruments/Traktor Pro 3")

    def _is_platform_installed(self, platform_id: str) -> bool:
        """Verifica si el software DJ seleccionado está instalado en el sistema."""
        if platform_id == "serato":
            return bool(self.serato_db_path and os.path.exists(self.serato_db_path))
        elif platform_id == "virtualdj":
            return bool(self.virtualdj_dir and os.path.exists(self.virtualdj_dir))
        elif platform_id == "rekordbox":
            return bool(self.rekordbox_dir and os.path.exists(self.rekordbox_dir))
        elif platform_id == "traktor":
            return bool(self.traktor_dir and os.path.exists(self.traktor_dir))
        return False

    def _process_monitor_loop(self):
        """Monitoriza en segundo plano procesos DJ activos cada 5 segundos sin bloquear el ciclo de frames a 60 FPS."""
        while True:
            try:
                out = subprocess.check_output(['ps', '-A', '-o', 'comm='], stderr=subprocess.DEVNULL).decode('utf-8', errors='ignore').lower()
                if "serato" in out:
                    self._cached_running_process = "serato"
                elif "rekordbox" in out:
                    self._cached_running_process = "rekordbox"
                elif "virtualdj" in out:
                    self._cached_running_process = "virtualdj"
                elif "traktor" in out:
                    self._cached_running_process = "traktor"
                else:
                    self._cached_running_process = ""
            except Exception:
                pass
            time.sleep(5.0)

    def _get_running_dj_process(self) -> Optional[str]:
        """Devuelve el proceso DJ activo detectado en segundo plano (0ms de sobrecarga)."""
        return self._cached_running_process or None

    def detect_active_platform(self) -> str:
        """
        Determina la plataforma activa en modo 'auto':
        1. Si un proceso DJ está activo en memoria, lo prioriza.
        2. Si no, compara el mtime de las bases de datos / logs recientes.
        3. Fallback al primer software instalado disponible o 'serato'.
        """
        if self.platform_mode != "auto":
            return self.platform_mode

        running = self._get_running_dj_process()
        if running:
            return running

        # Comparación de marcas temporales de modificación
        best_platform = "serato"
        best_mtime = 0.0

        # Serato
        if os.path.exists(self.serato_db_path):
            mt = os.path.getmtime(self.serato_db_path)
            if mt > best_mtime:
                best_mtime = mt
                best_platform = "serato"

        # VirtualDJ (revisar History o database.xml)
        vdj_db = os.path.join(self.virtualdj_dir, "database.xml")
        if os.path.exists(vdj_db):
            mt = os.path.getmtime(vdj_db)
            if mt > best_mtime:
                best_mtime = mt
                best_platform = "virtualdj"

        # Rekordbox
        rb_db = os.path.join(self.rekordbox_dir, "master.db")
        if os.path.exists(rb_db):
            mt = os.path.getmtime(rb_db)
            if mt > best_mtime:
                best_mtime = mt
                best_platform = "rekordbox"

        return best_platform

    def set_platform(self, mode: str) -> Dict[str, Any]:
        """Cambia el modo de plataforma ('auto', 'serato', 'rekordbox', 'virtualdj', 'traktor')."""
        valid_modes = ["auto", "serato", "rekordbox", "virtualdj", "traktor"]
        if mode in valid_modes:
            self.platform_mode = mode
            self._cached_live_state = None
        return self.get_live_state()

    def get_available_platforms(self) -> List[Dict[str, Any]]:
        """Devuelve el listado de plataformas soportadas con su estado de detección."""
        active = self.detect_active_platform()
        platforms = []
        for pid, spec in self.PLATFORM_SPECS.items():
            detected = self._is_platform_installed(pid)
            platforms.append({
                "id": pid,
                "name": spec["name"],
                "short_name": spec["short_name"],
                "icon": spec["icon"],
                "brand_color": spec["brand_color"],
                "badge_class": spec["badge_class"],
                "detected": detected,
                "is_active": (active == pid),
                "is_selected": (self.platform_mode == pid or (self.platform_mode == "auto" and active == pid))
            })
        return platforms

    # =========================================================================
    # UTILIDADES DE AUDIO & HARMONIC DSP
    # =========================================================================

    def get_local_ip(self) -> str:
        """Obtiene la dirección IP local de la máquina para conectar iPads/tablets (cacheada)."""
        if self._cached_local_ip:
            return self._cached_local_ip
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(('8.8.8.8', 80))
            ip = s.getsockname()[0]
        except Exception:
            ip = '127.0.0.1'
        finally:
            s.close()
        self._cached_local_ip = ip
        return ip

    def to_camelot(self, key_str: str) -> str:
        """Normaliza cualquier notación musical o Camelot a formato estándar (ej: 'Gm' -> '6A')."""
        if not key_str:
            return "8A"
        clean = key_str.strip().upper()
        if len(clean) in (2, 3) and (clean.endswith("A") or clean.endswith("B")):
            num_part = clean[:-1]
            if num_part.isdigit() and 1 <= int(num_part) <= 12:
                return clean
        return self.KEY_TO_CAMELOT.get(clean, "8A")

    def _extract_serato_markers_cues(self, filepath: str) -> Optional[List[Dict[str, Any]]]:
        """Extrae directamente los 8 Hot Cues oficiales grabados en serato_markers_v2 (FLAC) o GEOB (MP3)."""
        if not filepath or not os.path.exists(filepath):
            return None
        if hasattr(self, "_cue_file_cache") and filepath in self._cue_file_cache:
            return self._cue_file_cache[filepath]

        if not hasattr(self, "_cue_file_cache"):
            self._cue_file_cache = {}

        cues = []
        try:
            import base64
            import struct
            data = None
            fl = filepath.lower()
            if fl.endswith(".flac"):
                from mutagen.flac import FLAC
                audio = FLAC(filepath)
                raw_b64 = audio.get("serato_markers_v2")
                if raw_b64:
                    raw = base64.b64decode(raw_b64[0])
                    idx = raw.find(b"Serato Markers2\x00")
                    payload = raw[idx + len(b"Serato Markers2\x00"):] if idx != -1 else raw
                    try:
                        data = base64.b64decode(payload)
                    except Exception:
                        data = payload
            elif fl.endswith(".mp3"):
                from mutagen.id3 import ID3
                tags = ID3(filepath)
                for geob in tags.getall("GEOB"):
                    if "Serato Markers2" in geob.desc:
                        raw = geob.data
                        try:
                            data = base64.b64decode(raw)
                        except Exception:
                            data = raw
                        idx = data.find(b"Serato Markers2\x00")
                        if idx != -1:
                            data = data[idx + len(b"Serato Markers2\x00"):]
                        try:
                            data = base64.b64decode(data)
                        except Exception:
                            pass
                        break

            if data and len(data) >= 2:
                p = 2
                while p < len(data):
                    null_idx = data.find(b"\x00", p)
                    if null_idx == -1:
                        break
                    tag = data[p:null_idx].decode("ascii", errors="ignore")
                    p = null_idx + 1
                    if p + 4 > len(data):
                        break
                    length = struct.unpack(">I", data[p:p+4])[0]
                    p += 4
                    val = data[p:p+length]
                    p += length
                    if tag == "CUE" and len(val) >= 12:
                        cid = val[1]
                        pos_ms = struct.unpack(">I", val[2:6])[0]
                        r, g, b = val[7], val[8], val[9]
                        name = val[12:].split(b"\x00")[0].decode("utf-8", errors="ignore")
                        m = pos_ms // 60000
                        s = (pos_ms % 60000) / 1000.0
                        time_str = f"{m:02d}:{s:04.1f}"
                        cues.append({
                            "id": cid + 1,
                            "name": name or f"Cue {cid + 1}",
                            "pos_ms": pos_ms,
                            "time": time_str,
                            "color": f"#{r:02x}{g:02x}{b:02x}",
                            "rgb": (r, g, b)
                        })
        except Exception:
            pass

        if cues:
            cues.sort(key=lambda x: x["pos_ms"])
            self._cue_file_cache[filepath] = cues
            return cues
        return None

    def _extract_serato_overview(self, filepath: str) -> Optional[str]:
        """Extrae la silueta espectral completa (1280 columnas x 3 bandas) de serato_overview oficial."""
        if not filepath or not os.path.exists(filepath):
            return None
        if not hasattr(self, "_overview_file_cache"):
            self._overview_file_cache = {}
        if filepath in self._overview_file_cache:
            return self._overview_file_cache[filepath]

        try:
            import base64
            fl = filepath.lower()
            samples = None
            if fl.endswith(".flac"):
                from mutagen.flac import FLAC
                audio = FLAC(filepath)
                raw_b64 = audio.get("serato_overview")
                if raw_b64:
                    raw = base64.b64decode(raw_b64[0])
                    idx = raw.find(b"Serato Overview\x00")
                    payload = raw[idx + len(b"Serato Overview\x00"):] if idx != -1 else raw
                    samples = payload[2:]
            elif fl.endswith(".mp3"):
                from mutagen.id3 import ID3
                tags = ID3(filepath)
                for geob in tags.getall("GEOB"):
                    if "Serato Overview" in geob.desc:
                        raw = geob.data
                        idx = raw.find(b"Serato Overview\x00")
                        payload = raw[idx + len(b"Serato Overview\x00"):] if idx != -1 else raw
                        samples = payload[2:]
                        break

            if samples and len(samples) >= 3840:
                res_b64 = base64.b64encode(samples[:3840]).decode("ascii")
                self._overview_file_cache[filepath] = res_b64
                return res_b64
        except Exception:
            pass

        self._overview_file_cache[filepath] = None
        return None

    def _fetch_audit_dsp(self, filepath: str) -> Dict[str, Any]:
        """Consulta la huella espectral, 8 Hot Cues reales y métricas de sonoridad de BeatWave para una pista."""
        if not filepath:
            return {
                "lufs": -6.8,
                "low_ratio": 48.0,
                "mid_ratio": 32.0,
                "high_ratio": 20.0,
                "acoustic_role": "Bass-Heavy Driver",
                "is_audited": False,
                "comment": "Intro limpia 32b • Drop contundente • Outro 64b",
                "cues": None,
                "first_downbeat_ms": 0.0
            }

        clean_path = filepath if filepath.startswith("/") else "/" + filepath
        if clean_path in self._dsp_cache:
            return self._dsp_cache[clean_path]

        default_dsp = {
            "lufs": -6.8,
            "low_ratio": 48.0,
            "mid_ratio": 32.0,
            "high_ratio": 20.0,
            "acoustic_role": "Bass-Heavy Driver",
            "is_audited": False,
            "comment": "Intro limpia 32b • Drop contundente • Outro 64b",
            "cues": None,
            "first_downbeat_ms": 0.0
        }
        if not os.path.exists(self.audit_cache_path):
            self._dsp_cache[clean_path] = default_dsp
            return default_dsp

        try:
            conn = sqlite3.connect(f"file:{self.audit_cache_path}?mode=ro", uri=True)
            cursor = conn.cursor()
            cursor.execute(
                "SELECT lufs, low_ratio, mid_ratio, high_ratio, acoustic_role FROM audit_cache WHERE filepath = ? OR filepath LIKE ? LIMIT 1",
                (clean_path, f"%{os.path.basename(filepath)}")
            )
            row = cursor.fetchone()

            cursor.execute(
                "SELECT track_json FROM metadata_cache WHERE filepath = ? OR filepath LIKE ? LIMIT 1",
                (clean_path, f"%{os.path.basename(filepath)}")
            )
            row_meta = cursor.fetchone()
            conn.close()

            meta_data = {}
            if row_meta and row_meta[0]:
                try:
                    meta_data = json.loads(row_meta[0])
                except Exception:
                    pass

            role = str(row[4]) if (row and row[4]) else (meta_data.get("acoustic_role") or "Club Master")
            cues_list = meta_data.get("cues")
            downbeat_ms = float(meta_data.get("first_downbeat_ms") or 0.0)

            res = {
                "lufs": float(row[0]) if (row and row[0] is not None) else float(meta_data.get("lufs") or -6.8),
                "low_ratio": float(row[1]) if (row and row[1] is not None) else float(meta_data.get("low_ratio") or 48.0),
                "mid_ratio": float(row[2]) if (row and row[2] is not None) else float(meta_data.get("mid_ratio") or 32.0),
                "high_ratio": float(row[3]) if (row and row[3] is not None) else float(meta_data.get("high_ratio") or 20.0),
                "acoustic_role": role,
                "is_audited": bool(row or row_meta),
                "comment": meta_data.get("comment") or f"[{role}] Intro 32b • Drop contundente • Outro 64b",
                "cues": cues_list,
                "first_downbeat_ms": downbeat_ms,
                "energy": meta_data.get("energy") or meta_data.get("e"),
                "danceability": meta_data.get("danceability") or meta_data.get("dance"),
                "genre": meta_data.get("genre"),
                "subgenre": meta_data.get("subgenre"),
                "mood": meta_data.get("mood") or meta_data.get("vibe"),
                "phase": meta_data.get("phase") or meta_data.get("fase_dj")
            }
            self._dsp_cache[clean_path] = res
            return res
        except Exception:
            pass

        self._dsp_cache[clean_path] = default_dsp
        return default_dsp

    # =========================================================================
    # INGESTA ESPECÍFICA POR PLATAFORMA (REVERSE-ENGINEERING INODE-REACTIVE <25ms)
    # =========================================================================

    def _get_serato_conn(self) -> Optional[sqlite3.Connection]:
        if self._serato_conn is not None:
            return self._serato_conn
        if not self.serato_db_path or not os.path.exists(self.serato_db_path):
            return None
        try:
            conn = sqlite3.connect(f"file:{self.serato_db_path}?mode=ro&cache=shared", uri=True, check_same_thread=False)
            conn.execute("PRAGMA query_only = ON;")
            conn.execute("PRAGMA read_uncommitted = ON;")
            self._serato_conn = conn
            return conn
        except Exception:
            return None

    def _parse_serato_row(self, r) -> Dict[str, Any]:
        raw_path = r[6] or ""
        fp = f"/{raw_path}" if raw_path and not raw_path.startswith("/") else raw_path
        length_ms = r[10] or 0
        dur_str = "06:00"
        if length_ms > 0:
            tot_sec = int(length_ms // 1000)
            dur_str = f"{tot_sec // 60:02d}:{tot_sec % 60:02d}"

        return {
            "id": r[0],
            "deck": str(r[1]).strip() if r[1] else "1",
            "artist": r[2] or "Unknown Artist",
            "name": r[3] or "Unknown Title",
            "bpm": round(float(r[4]), 2) if r[4] else 130.0,
            "raw_key": r[5] or "",
            "camelot": self.to_camelot(r[5] or ""),
            "file_path": fp,
            "start_time": r[7] or int(time.time()),
            "played": bool(r[8]),
            "end_time": r[9] if r[9] is not None else -1,
            "length_ms": length_ms,
            "duration": dur_str,
            "genre": r[11] or "Tech House",
            "year": str(r[12] or ""),
            "phase": r[13] or ""
        }

    def _query_serato_decks(self):
        """Consulta el estado real de cada deck de Serato de forma independiente sin cruzar pistas."""
        if not self.serato_db_path or not os.path.exists(self.serato_db_path):
            return None, None, []

        conn = self._get_serato_conn()
        if not conn:
            return None, None, []

        d1 = None
        d2 = None
        entries = []
        try:
            cursor = conn.cursor()

            # 1. Detectar si Serato tiene una sesión activa abierta (end_time = -1 en history_session)
            cursor.execute(
                """
                SELECT id FROM history_session WHERE end_time = -1 ORDER BY id DESC LIMIT 1
                """
            )
            sess_row = cursor.fetchone()
            active_session_id = sess_row[0] if sess_row else None

            if active_session_id is not None:
                # Solo pistas activas en los decks en la sesión actual (end_time == -1)
                cursor.execute(
                    """
                    SELECT id, deck, artist, name, bpm, key, portable_id, start_time, played, end_time, length_ms, genre, year, grouping
                    FROM history_entry
                    WHERE session_id = ? AND deck IN ('1', 'A') AND end_time = -1
                    ORDER BY id DESC
                    LIMIT 1
                    """,
                    (active_session_id,)
                )
                r1 = cursor.fetchone()
                if r1:
                    d1 = self._parse_serato_row(r1)

                cursor.execute(
                    """
                    SELECT id, deck, artist, name, bpm, key, portable_id, start_time, played, end_time, length_ms, genre, year, grouping
                    FROM history_entry
                    WHERE session_id = ? AND deck IN ('2', 'B') AND end_time = -1
                    ORDER BY id DESC
                    LIMIT 1
                    """,
                    (active_session_id,)
                )
                r2 = cursor.fetchone()
                if r2:
                    d2 = self._parse_serato_row(r2)

            # Historial general de pistas recientes
            cursor.execute(
                """
                SELECT id, deck, artist, name, bpm, key, portable_id, start_time, played, end_time, length_ms, genre, year, grouping
                FROM history_entry
                ORDER BY id DESC
                LIMIT 15
                """
            )
            for row in cursor.fetchall():
                entries.append(self._parse_serato_row(row))
        except sqlite3.OperationalError:
            self._serato_conn = None
        except Exception:
            pass

        return d1, d2, entries

    def _query_serato_history(self) -> List[Dict[str, Any]]:
        """Lee las últimas pistas reproducidas desde Serato master.sqlite con reactividad por inodo WAL (<0.5ms)."""
        _, _, entries = self._query_serato_decks()
        return entries

    def _query_virtualdj_history(self) -> List[Dict[str, Any]]:
        """Lee el historial reciente de VirtualDJ con reverse seek sobre .m3u (<1ms)."""
        if not self.virtualdj_dir or not os.path.exists(self.virtualdj_dir):
            return []

        history_dir = os.path.join(self.virtualdj_dir, "History")
        if os.path.exists(history_dir):
            try:
                m3u_files = [
                    os.path.join(history_dir, f) for f in os.listdir(history_dir)
                    if f.endswith(('.m3u', '.m3u8', '.txt')) and os.path.isfile(os.path.join(history_dir, f))
                ]
                if m3u_files:
                    newest_file = max(m3u_files, key=os.path.getmtime)
                    st = os.stat(newest_file)
                    if st.st_mtime_ns == self._vdj_last_mtime_ns and self._vdj_cached_entries:
                        return self._vdj_cached_entries

                    # Reverse seek: leer únicamente los últimos 8192 bytes
                    file_size = st.st_size
                    read_size = min(file_size, 8192)
                    with open(newest_file, 'rb') as fh:
                        if file_size > read_size:
                            fh.seek(file_size - read_size, os.SEEK_SET)
                        raw_data = fh.read().decode('utf-8', errors='ignore')

                    lines = [line.strip() for line in raw_data.splitlines() if line.strip()]
                    entries = []
                    cur_deck = "1"
                    cur_artist = ""
                    cur_title = ""
                    for line in lines:
                        if line.startswith("#EXTVDJ:"):
                            deck_match = re.search(r'<deck>(\d+)</deck>', line)
                            if deck_match:
                                cur_deck = deck_match.group(1)
                        elif line.startswith("#EXTINF:"):
                            meta = line.split(",", 1)[-1].strip()
                            if " - " in meta:
                                parts = meta.split(" - ", 1)
                                cur_artist, cur_title = parts[0].strip(), parts[1].strip()
                            else:
                                cur_artist, cur_title = "Unknown Artist", meta
                        elif not line.startswith("#"):
                            entries.append({
                                "id": len(entries) + 1,
                                "deck": cur_deck,
                                "artist": cur_artist or "Unknown Artist",
                                "name": cur_title or os.path.basename(line),
                                "bpm": 130.0,
                                "raw_key": "",
                                "camelot": "8A",
                                "file_path": line,
                                "start_time": int(time.time()),
                                "played": True
                            })
                            cur_artist = ""
                            cur_title = ""
                            cur_deck = "2" if cur_deck == "1" else "1"

                    if entries:
                        entries.reverse()
                        self._vdj_last_mtime_ns = st.st_mtime_ns
                        self._vdj_cached_entries = entries[:15]
                        return self._vdj_cached_entries
            except Exception:
                pass

        # Fallback a database.xml
        vdj_db = os.path.join(self.virtualdj_dir, "database.xml")
        if os.path.exists(vdj_db):
            try:
                st = os.stat(vdj_db)
                if st.st_mtime_ns == self._vdj_last_mtime_ns and self._vdj_cached_entries:
                    return self._vdj_cached_entries
                tree = ET.parse(vdj_db)
                root = tree.getroot()
                songs = root.findall('Song')
                played_songs = []
                for s in songs:
                    infos = s.find('Infos')
                    play_count = int(infos.get('PlayCount', 0)) if infos is not None else 0
                    if play_count > 0:
                        played_songs.append(s)
                target_songs = played_songs[-15:] if played_songs else songs[:4]
                target_songs.reverse()
                deck_toggle = "1"
                entries = []
                for idx, s in enumerate(target_songs):
                    fp = s.get('FilePath', '')
                    tags = s.find('Tags')
                    artist = tags.get('Author', 'Unknown Artist') if tags is not None else 'Unknown Artist'
                    title = tags.get('Title', os.path.basename(fp)) if tags is not None else os.path.basename(fp)
                    key = tags.get('Key', '') if tags is not None else ''
                    poi = s.find('Poi')
                    bpm_val = 130.0
                    if poi is not None and poi.get('Bpm'):
                        try:
                            bpm_val = round(float(poi.get('Bpm')), 2)
                        except Exception:
                            bpm_val = 130.0
                    entries.append({
                        "id": idx + 1,
                        "deck": deck_toggle,
                        "artist": artist,
                        "name": title,
                        "bpm": bpm_val,
                        "raw_key": key,
                        "camelot": self.to_camelot(key),
                        "file_path": fp,
                        "start_time": int(time.time()) - (idx * 180),
                        "played": True
                    })
                    deck_toggle = "2" if deck_toggle == "1" else "1"
                self._vdj_last_mtime_ns = st.st_mtime_ns
                self._vdj_cached_entries = entries
                return entries
            except Exception:
                pass
        return self._vdj_cached_entries or []

    def _query_traktor_history(self) -> List[Dict[str, Any]]:
        """Lee el archivo .nml más reciente del historial de Traktor Pro (<1ms)."""
        if not self.traktor_dir or not os.path.exists(self.traktor_dir):
            return []

        history_dir = os.path.join(self.traktor_dir, "History")
        search_dirs = [history_dir, self.traktor_dir]
        nml_files = []
        for d in search_dirs:
            if os.path.exists(d):
                nml_files.extend([
                    os.path.join(d, f) for f in os.listdir(d)
                    if f.endswith('.nml') and os.path.isfile(os.path.join(d, f))
                ])

        if not nml_files:
            return []

        newest_nml = max(nml_files, key=os.path.getmtime)
        try:
            st = os.stat(newest_nml)
            if st.st_mtime_ns == self._traktor_last_mtime_ns and self._traktor_cached_entries:
                return self._traktor_cached_entries

            tree = ET.parse(newest_nml)
            root = tree.getroot()
            collection = root.find('COLLECTION')
            if collection is None:
                return []

            tracks_dict = {}
            for entry in collection.findall('ENTRY'):
                artist = entry.get('ARTIST', 'Unknown Artist')
                title = entry.get('TITLE', 'Unknown Title')
                info = entry.find('INFO')
                raw_key = info.get('KEY', '') if info is not None else ''
                tempo = entry.find('TEMPO')
                bpm_val = 130.0
                if tempo is not None and tempo.get('BPM'):
                    try:
                        bpm_val = round(float(tempo.get('BPM')), 2)
                    except Exception:
                        bpm_val = 130.0

                loc = entry.find('LOCATION')
                fp = ""
                if loc is not None:
                    fp = os.path.join(loc.get('DIR', ''), loc.get('FILE', '')).replace('/:', '/')

                full_key = f"{artist} - {title}".lower()
                tracks_dict[full_key] = {
                    "artist": artist,
                    "title": title,
                    "bpm": bpm_val,
                    "raw_key": raw_key,
                    "camelot": self.to_camelot(raw_key),
                    "file_path": fp
                }

            # Parsear el orden de reproducción si hay nodo PLAYLIST
            deck_toggle = "1"
            playlists_node = root.find('PLAYLISTS')
            parsed_entries = []
            if playlists_node is not None:
                for pl_entry in playlists_node.findall('.//ENTRY'):
                    d_attr = pl_entry.get('DECK', '')
                    deck_num = "1" if d_attr in ("A", "1") else "2" if d_attr in ("B", "2") else deck_toggle
                    pkey = pl_entry.find('PRIMARYKEY')
                    if pkey is not None and pkey.get('KEY'):
                        raw_pkey = pkey.get('KEY', '')
                        filename = os.path.basename(raw_pkey.replace('/:', '/'))
                        # Buscar coincidencia
                        matched = None
                        for k, v in tracks_dict.items():
                            if filename.lower() in v['file_path'].lower() or filename.lower() in k:
                                matched = v
                                break
                        if matched:
                            parsed_entries.append({
                                "id": len(parsed_entries) + 1,
                                "deck": deck_num,
                                "artist": matched["artist"],
                                "name": matched["title"],
                                "bpm": matched["bpm"],
                                "raw_key": matched["raw_key"],
                                "camelot": matched["camelot"],
                                "file_path": matched["file_path"],
                                "start_time": int(time.time()),
                                "played": True
                            })
                            deck_toggle = "2" if deck_toggle == "1" else "1"

            if parsed_entries:
                parsed_entries.reverse()
                self._traktor_last_mtime_ns = st.st_mtime_ns
                self._traktor_cached_entries = parsed_entries[:15]
                return self._traktor_cached_entries

            # Si no hubo playlist específica, devolver las de la colección
            for idx, (k, t) in enumerate(list(tracks_dict.items())[:15]):
                entries.append({
                    "id": idx + 1,
                    "deck": "1" if idx % 2 == 0 else "2",
                    "artist": t["artist"],
                    "name": t["title"],
                    "bpm": t["bpm"],
                    "raw_key": t["raw_key"],
                    "camelot": t["camelot"],
                    "file_path": t["file_path"],
                    "start_time": int(time.time()),
                    "played": True
                })
            self._traktor_last_mtime_ns = st.st_mtime_ns
            self._traktor_cached_entries = entries
        except Exception:
            pass

        return self._traktor_cached_entries or entries

    def _query_rekordbox_history(self) -> List[Dict[str, Any]]:
        """Lee el historial o biblioteca exportada de Rekordbox con inodo reactivo (<1ms)."""
        entries = []
        possible_xmls = [
            os.path.join(self.rekordbox_dir, "rekordbox.xml"),
            os.path.expanduser("~/Documents/rekordbox/rekordbox.xml"),
            os.path.expanduser("~/Music/_DJ MUSIC_/rekordbox.xml")
        ]

        found_xml = None
        for px in possible_xmls:
            if os.path.exists(px):
                found_xml = px
                break

        if not found_xml:
            return []

        try:
            st = os.stat(found_xml)
            if st.st_mtime_ns == self._rekordbox_last_mtime_ns and self._rekordbox_cached_entries:
                return self._rekordbox_cached_entries

            tree = ET.parse(found_xml)
            root = tree.getroot()
            collection = root.find('COLLECTION')
            if collection is None:
                return []

            tracks_by_id = {}
            for tr in collection.findall('TRACK'):
                tid = tr.get('TrackID')
                bpm_val = 130.0
                try:
                    bpm_val = round(float(tr.get('AverageBpm', 130.0)), 2)
                except Exception:
                    bpm_val = 130.0

                tonality = tr.get('Tonality', '')
                tracks_by_id[tid] = {
                    "name": tr.get('Name', 'Unknown Title'),
                    "artist": tr.get('Artist', 'Unknown Artist'),
                    "bpm": bpm_val,
                    "raw_key": tonality,
                    "camelot": self.to_camelot(tonality),
                    "file_path": tr.get('Location', '').replace('file://localhost', '')
                }

            # Buscar playlists de historial
            history_nodes = root.findall('.//NODE[@Type="1"]')
            history_tracks = []
            for hnode in reversed(history_nodes):
                for tk in hnode.findall('TRACK'):
                    kid = tk.get('Key')
                    if kid in tracks_by_id:
                        history_tracks.append(tracks_by_id[kid])
                if len(history_tracks) >= 2:
                    break

            target_list = history_tracks if history_tracks else list(tracks_by_id.values())[:6]
            for idx, t in enumerate(target_list[:15]):
                entries.append({
                    "id": idx + 1,
                    "deck": "1" if idx % 2 == 0 else "2",
                    "artist": t["artist"],
                    "name": t["name"],
                    "bpm": t["bpm"],
                    "raw_key": t["raw_key"],
                    "camelot": t["camelot"],
                    "file_path": t["file_path"],
                    "start_time": int(time.time()) - (idx * 150),
                    "played": True
                })
            self._rekordbox_last_mtime_ns = st.st_mtime_ns
            self._rekordbox_cached_entries = entries
        except Exception:
            pass

        return self._rekordbox_cached_entries or entries

    # =========================================================================
    # REGLAS ANTI-MUDDY & COMPATIBILIDAD ARMÓNICA (CALIBRACIÓN DDJ-FLX4)
    # =========================================================================

    def _calculate_anti_muddy_guard(self, deck_a: Dict[str, Any], deck_b: Dict[str, Any]) -> Dict[str, Any]:
        """Calcula el riesgo de colisión de graves y saturación espectral con recomendaciones para Pioneer DDJ-FLX4."""
        is_a_playing = bool(deck_a.get("is_playing", False))
        is_b_playing = bool(deck_b.get("is_playing", False))

        sub_a = float(deck_a.get("low_ratio", 45.0) or 45.0)
        sub_b = float(deck_b.get("low_ratio", 45.0) or 45.0)

        thresh = getattr(self, "anti_muddy_threshold", 40.0)
        warn_thresh = max(34.0, thresh - 4.0)
        mode_str = getattr(self, "anti_muddy_mode", "club").upper()
        ctrl_info = self.get_connected_dj_controller()
        ctrl_name = ctrl_info.get("name", "NUMARK NV II (USB)").replace(" (USB)", "")

        # Si uno o ambos platos no están reproduciendo (en CUE / auriculares), no hay colisión física en Master
        if not (is_a_playing and is_b_playing):
            cue_title = deck_b.get("title") if is_a_playing else deck_a.get("title", "Pista en preparación")
            knobs = {
                "controller": ctrl_name,
                "filter_knob": "HPF Normal (12:00)",
                "eq_low": "LOW Plano (12:00)",
                "macro": "Canal en Preescucha"
            }
            return {
                "status": "safe",
                "severity": 0,
                "title": f"🎧 EN CUE (PREPARADO) • MODO {mode_str}",
                "message": f"'{cue_title}' en preescucha de auriculares. Graves aislados sin solapamiento en sala (Master limpio).",
                "action": "Abre fader gradualmente al iniciar frase",
                "tag": "CUE SEGURO",
                "threshold": thresh,
                "mode": getattr(self, "anti_muddy_mode", "club"),
                "controller_knobs": knobs,
                "flx4": knobs
            }

        if sub_a >= thresh and sub_b >= thresh:
            knobs = {
                "controller": ctrl_name,
                "filter_knob": "HPF +30% (14:00)",
                "eq_low": "LOW -9dB (09:00)",
                "macro": "FILTER HPF o CUT"
            }
            return {
                "status": "danger",
                "severity": 3,
                "title": f"⚠️ CONFLICTO DE GRAVES (Anti-Muddy Guard • Modo {mode_str})",
                "message": f"Ambos tracks saturan en sub-graves ({sub_a:.1f}% y {sub_b:.1f}% > {thresh}%). Solaparlos causará cancelación de fase y distorsión en el sistema de sala.",
                "action": f"🎛️ {ctrl_name}: Gira perilla FILTER CH2 a las 14:00 (HPF +30%) o recorta EQ LOW a las 09:00 (-9dB) antes de abrir el fader.",
                "tag": "BASS CLASH",
                "threshold": thresh,
                "mode": getattr(self, "anti_muddy_mode", "club"),
                "controller_knobs": knobs,
                "flx4": knobs
            }
        elif (sub_a >= thresh and sub_b >= warn_thresh) or (sub_b >= thresh and sub_a >= warn_thresh):
            knobs = {
                "controller": ctrl_name,
                "filter_knob": "HPF +15% (13:30)",
                "eq_low": "LOW -3dB (11:00)",
                "macro": "Filtro progresivo"
            }
            return {
                "status": "warning",
                "severity": 2,
                "title": f"⚡ PRECAUCIÓN DE GRAVES (Modo {mode_str})",
                "message": f"Carga energética considerable en frecuencias bajas (> {warn_thresh}%). Evita solapar bombos en drop completo.",
                "action": f"🎛️ {ctrl_name}: Modula perilla FILTER a las 13:30 (HPF leve) durante el breakdown o baja EQ LOW a las 11:00.",
                "tag": "MODERATE MUD",
                "threshold": thresh,
                "mode": getattr(self, "anti_muddy_mode", "club"),
                "controller_knobs": knobs,
                "flx4": knobs
            }
        elif sub_b < warn_thresh or "Percussive" in deck_b.get("acoustic_role", ""):
            knobs = {
                "controller": ctrl_name,
                "filter_knob": "CENTER (12:00)",
                "eq_low": "0dB (12:00)",
                "macro": "Mezcla Libre"
            }
            return {
                "status": "safe",
                "severity": 1,
                "title": "🟢 MEZCLA LIMPIA & SEGURA",
                "message": "El track entrante es percusivo / medio-agudo. Espectro acústicamente complementario.",
                "action": f"🎛️ {ctrl_name}: Perilla FILTER al centro (12:00) y EQ LOW al centro (0dB). Mezcla continua segura.",
                "tag": "CLEAN MIX",
                "threshold": thresh,
                "mode": getattr(self, "anti_muddy_mode", "club"),
                "controller_knobs": knobs,
                "flx4": knobs
            }
        knobs = {
            "controller": ctrl_name,
            "filter_knob": "CENTER (12:00)",
            "eq_low": "0dB (12:00)",
            "macro": "Monitoreo"
        }
        return {
            "status": "info",
            "severity": 1,
            "title": "ℹ️ BALANCE CONTROLADO",
            "message": "Distribución espectral equilibrada entre ambos decks.",
            "action": f"🎛️ {ctrl_name}: Monitorea Trim/Gain al sumar ambos canales.",
            "tag": "BALANCED",
            "threshold": thresh,
            "mode": getattr(self, "anti_muddy_mode", "club"),
            "controller_knobs": knobs,
            "flx4": knobs
        }

    def set_anti_muddy_mode(self, mode: str) -> Dict[str, Any]:
        """Ajusta la sensibilidad del Anti-Muddy Guard ('club' 40%, 'standard' 44%, 'studio' 48%)."""
        m = str(mode).strip().lower()
        if m in ("club", "estricto", "strict"):
            self.anti_muddy_mode = "club"
            self.anti_muddy_threshold = 40.0
        elif m in ("studio", "suave", "soft"):
            self.anti_muddy_mode = "studio"
            self.anti_muddy_threshold = 48.0
        else:
            self.anti_muddy_mode = "standard"
            self.anti_muddy_threshold = 44.0
        self._last_live_state_time = 0.0
        self._cached_live_state = None
        return self.get_live_state()

    def _calculate_harmonic_relation(self, key_a: str, key_b: str) -> Dict[str, Any]:
        """Evalúa la compatibilidad armónica basada en la rueda Camelot."""
        if not key_a or not key_b:
            return {"type": "neutral", "label": "Sin tonalidad detectada", "badge": "NEUTRAL", "color": "#94a3b8"}

        if key_a == key_b:
            return {
                "type": "perfect",
                "label": f"Transición Perfecta: Mismo tono ({key_a}). Continuidad armónica total.",
                "badge": "PERFECT MATCH",
                "color": "#10b981"
            }

        num_a, mode_a = int(key_a[:-1]), key_a[-1]
        num_b, mode_b = int(key_b[:-1]), key_b[-1]

        up_num = 1 if num_a == 12 else num_a + 1
        down_num = 12 if num_a == 1 else num_a - 1

        if mode_a == mode_b and num_b == up_num:
            return {
                "type": "energy_up",
                "label": f"Subidón de Energía Armónica (+1 Camelot: {key_a} ➔ {key_b}). Eleva la tensión melódica.",
                "badge": "ENERGY BOOST",
                "color": "#06b6d4"
            }
        elif mode_a == mode_b and num_b == down_num:
            return {
                "type": "deep_calm",
                "label": f"Transición Profunda / Calma (-1 Camelot: {key_a} ➔ {key_b}). Transición suave y envolvente.",
                "badge": "DEEP / WARM",
                "color": "#818cf8"
            }
        elif num_a == num_b and mode_a != mode_b:
            return {
                "type": "mode_switch",
                "label": f"Modulación Relativa ({key_a} ➔ {key_b}). Cambio radical de atmósfera menor ⇄ mayor.",
                "badge": "MODAL SHIFT",
                "color": "#f59e0b"
            }
        elif mode_a == mode_b and num_b == (1 if num_a >= 11 else num_a + 2):
            return {
                "type": "energy_surge",
                "label": f"Salto Energético de +2 Semitonos ({key_a} ➔ {key_b}). Ruptura de tensión para momento pico.",
                "badge": "SURGE +2",
                "color": "#ec4899"
            }
        else:
            return {
                "type": "dissonant",
                "label": f"Distancia Disonante ({key_a} ➔ {key_b}). Se recomienda mezcla percusiva corta en intro/outro.",
                "badge": "HARMONIC CLASH",
                "color": "#ef4444"
            }

    @staticmethod
    def _parse_duration_sec(dur_str: str) -> float:
        try:
            parts = str(dur_str).strip().split(":")
            if len(parts) == 2:
                return float(parts[0]) * 60.0 + float(parts[1])
            elif len(parts) == 3:
                return float(parts[0]) * 3600.0 + float(parts[1]) * 60.0 + float(parts[2])
        except Exception:
            pass
        return 360.0

    @staticmethod
    def _generate_structural_phases(cues: list, duration_sec: float) -> list:
        """Genera las fases tácticas de la pista (Intro, Drop, Break, Outro) sincronizadas con los Hot Cues."""
        if not cues or len(cues) < 4:
            return [
                {"id": "intro", "name": "Intro Percusiva", "start_pct": 0.0, "end_pct": 0.16, "type": "intro", "label": "Intro 32b • Mezcla In", "color": "#06b6d4"},
                {"id": "build", "name": "Bassline In", "start_pct": 0.16, "end_pct": 0.35, "type": "build", "label": "Bassline Activa", "color": "#eab308"},
                {"id": "break", "name": "Breakdown", "start_pct": 0.35, "end_pct": 0.48, "type": "break", "label": "Breakdown (Sin Graves)", "color": "#38bdf8"},
                {"id": "drop", "name": "MAIN DROP", "start_pct": 0.48, "end_pct": 0.74, "type": "drop", "label": "⚡ DROP PRINCIPAL (Clímax)", "color": "#ef4444"},
                {"id": "break2", "name": "Segundo Parón", "start_pct": 0.74, "end_pct": 0.82, "type": "break", "label": "Puente Melódico", "color": "#a855f7"},
                {"id": "outro", "name": "Outro Limpio", "start_pct": 0.82, "end_pct": 1.0, "type": "outro", "label": "🟢 OUTRO SEGURO • Mezcla Out", "color": "#10b981"}
            ]

        c_sorted = sorted(cues, key=lambda x: float(x.get("pct", 0.0)))
        phases = []
        for i in range(len(c_sorted)):
            c_curr = c_sorted[i]
            c_next = c_sorted[i + 1] if i + 1 < len(c_sorted) else None
            start_p = round(float(c_curr.get("pct", 0.0)), 4)
            end_p = round(float(c_next.get("pct", 1.0)), 4) if c_next else 1.0
            name_raw = c_curr.get("short_name") or c_curr.get("name", f"Cue {i+1}")
            p_type = "intro" if i < 2 else ("build" if i < 3 else ("break" if "break" in name_raw.lower() else ("drop" if "drop" in name_raw.lower() or "climax" in name_raw.lower() else ("outro" if i >= len(c_sorted) - 2 else "build"))))
            color = c_curr.get("color") or ("#ef4444" if p_type == "drop" else ("#10b981" if p_type == "outro" else "#06b6d4"))
            phases.append({
                "id": f"phase_{i+1}",
                "name": name_raw,
                "start_pct": start_p,
                "end_pct": end_p,
                "type": p_type,
                "label": f"{name_raw} ({c_curr.get('bar_str', '')})",
                "color": color,
                "directive": f"Compás {c_curr.get('bar', (i*16)+1)}. {c_curr.get('name')}"
            })
        return phases

    def _get_tactical_recommendations(self, master_track: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Genera recomendaciones armónicas y tácticas reales desde la biblioteca auditada del usuario."""
        base_bpm = float(master_track.get("bpm") or 130.0)
        base_camelot = str(master_track.get("camelot") or "8A").upper().strip()
        current_title = str(master_track.get("title") or "").lower().strip()
        current_file = str(master_track.get("file_path") or "").strip()

        num = int(base_camelot[:-1]) if base_camelot[:-1].isdigit() else 8
        mode = base_camelot[-1] if base_camelot[-1] in ("A", "B") else "A"
        alt_mode = "B" if mode == "A" else "A"
        up_num = 1 if num == 12 else num + 1
        down_num = 12 if num == 1 else num - 1

        compatible_keys = {
            f"{num}{mode}": ("Mezcla Armónica Segura", f"Mismo tono ({num}{mode}). Cero disonancia tímbrica."),
            f"{up_num}{mode}": ("Subidón de Energía (+1)", f"Aumento armónico a {up_num}{mode}. Eleva la energía en pista."),
            f"{down_num}{mode}": ("Descenso Armónico (-1)", f"Paso a {down_num}{mode}. Modulación sutil para descompresión."),
            f"{num}{alt_mode}": ("Cambio Modal (Relativa)", f"Cruce a {num}{alt_mode}. Cambio de brillo mayor/menor.")
        }

        real_candidates: List[Dict[str, Any]] = []

        if os.path.exists(self.audit_cache_path):
            try:
                conn = sqlite3.connect(f"file:{self.audit_cache_path}?mode=ro", uri=True)
                cursor = conn.cursor()
                cursor.execute("SELECT filepath, track_json FROM metadata_cache LIMIT 800")
                rows = cursor.fetchall()
                conn.close()

                for fp, tj in rows:
                    if not tj:
                        continue
                    try:
                        t = json.loads(tj)
                    except Exception:
                        continue

                    t_key = (t.get("key") or t.get("k") or "").upper().strip()
                    if t_key not in compatible_keys:
                        continue

                    try:
                        t_bpm = float(t.get("bpm") or t.get("b") or 0.0)
                    except Exception:
                        continue

                    if t_bpm <= 40.0 or abs(t_bpm - base_bpm) > (base_bpm * 0.08):
                        continue

                    t_title = str(t.get("title") or t.get("t") or os.path.basename(fp)).strip()
                    if current_title and current_title in t_title.lower():
                        continue
                    if current_file and fp and os.path.basename(current_file) == os.path.basename(fp):
                        continue

                    strat, reason = compatible_keys[t_key]
                    c_id = f"rec_{len(real_candidates) + 1}_{t.get('id', len(real_candidates))}"
                    
                    real_candidates.append({
                        "id": c_id,
                        "title": t_title,
                        "artist": t.get("artist") or t.get("a") or "Desconocido",
                        "bpm": round(t_bpm, 1),
                        "camelot": t_key,
                        "camelot_color": self.CAMELOT_COLORS.get(t_key, "#06b6d4"),
                        "raw_key": t.get("raw_key") or t_key,
                        "role": t.get("acoustic_role") or "Club Master",
                        "lufs": float(t.get("lufs") or -7.0),
                        "low_ratio": float(t.get("low_ratio") or 38.0),
                        "genre": t.get("genre") or "Tech House",
                        "subgenre": t.get("subgenre") or "Club Master",
                        "energy": int(t.get("energy") or t.get("e") or 88),
                        "danceability": int(t.get("danceability") or t.get("dance") or 85),
                        "mood": t.get("mood") or t.get("vibe") or "Peak Time",
                        "format": t.get("format") or ("FLAC 24-bit" if fp.lower().endswith(".flac") else "MP3 320k"),
                        "duration": t.get("duration") or "06:00",
                        "year": str(t.get("year") or "2024"),
                        "cover": t.get("cover") or f"/cover?path={fp}",
                        "strategy": strat,
                        "reason": reason
                    })

                    if len(real_candidates) >= 12:
                        break
            except Exception:
                pass

        if len(real_candidates) >= 4:
            return real_candidates[:6]

        # Respaldo si no hay suficientes pistas indexadas en biblioteca
        rec_same = f"{num}{mode}"
        rec_up = f"{up_num}{mode}"
        fallback_candidates = [
            {
                "id": "rec_1",
                "title": "Higher (Original Mix)",
                "artist": "Amelie Lens",
                "bpm": round(base_bpm, 1),
                "camelot": rec_same,
                "camelot_color": self.CAMELOT_COLORS.get(rec_same, "#f472b6"),
                "role": "Percussive Tool",
                "lufs": -6.5,
                "low_ratio": 36.0,
                "genre": "Acid / Peak Techno",
                "subgenre": "Lenske Peak",
                "energy": 94,
                "danceability": 89,
                "mood": "Acid Drive",
                "format": "FLAC 24-bit",
                "duration": "06:12",
                "year": "2023",
                "cover": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
                "strategy": "Mezcla Armónica Segura",
                "reason": f"Mismo tono ({rec_same}) y espectro percusivo limpio. Cero riesgo de embarre en graves."
            },
            {
                "id": "rec_2",
                "title": "Your Mind (Extended Club)",
                "artist": "Adam Beyer & Bart Skils",
                "bpm": round(base_bpm + 1.0, 1),
                "camelot": rec_up,
                "camelot_color": self.CAMELOT_COLORS.get(rec_up, "#fb7185"),
                "role": "Peak Time Driver",
                "lufs": -5.9,
                "low_ratio": 49.0,
                "genre": "Drumcode Techno",
                "subgenre": "Drumcode Peak",
                "energy": 96,
                "danceability": 92,
                "mood": "Peak Time Climax",
                "format": "FLAC Hi-Res",
                "duration": "07:22",
                "year": "2022",
                "cover": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
                "strategy": "Subidón de Energía (+1)",
                "reason": f"Aumento armónico a {rec_up} con +1.0 BPM. Eleva la intensidad del club para el clímax."
            },
            {
                "id": "rec_3",
                "title": "Old School",
                "artist": "Hertz",
                "bpm": round(base_bpm, 1),
                "camelot": rec_same,
                "camelot_color": self.CAMELOT_COLORS.get(rec_same, "#f472b6"),
                "role": "Industrial Driver",
                "lufs": -6.2,
                "low_ratio": 38.0,
                "genre": "Hard Techno Industrial",
                "subgenre": "Sway Records",
                "energy": 93,
                "danceability": 91,
                "mood": "Raw Industrial",
                "format": "FLAC 24-bit",
                "duration": "05:12",
                "year": "2024",
                "cover": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop",
                "strategy": "Groove Industrial Limpio",
                "reason": f"Mismo Camelot ({rec_same}), pegada seca sin saturar sub-graves. Transición directa perfecta."
            },
            {
                "id": "rec_4",
                "title": "Booster (Gary Beck Remix)",
                "artist": "Planetary Assault Systems",
                "bpm": round(base_bpm - 0.5, 1),
                "camelot": rec_same,
                "camelot_color": self.CAMELOT_COLORS.get(rec_same, "#f472b6"),
                "role": "Percussive Descongestor",
                "lufs": -7.1,
                "low_ratio": 32.0,
                "genre": "Hypnotic / Raw",
                "subgenre": "Mote-Evolver",
                "energy": 88,
                "danceability": 86,
                "mood": "Hypnotic Groove",
                "format": "WAV 24-bit",
                "duration": "05:48",
                "year": "2021",
                "cover": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=300&fit=crop",
                "strategy": "Descongestión de Sala",
                "reason": "Textura enfocada en medios y agudos. Ideal para limpiar la sala tras un drop saturado."
            }
        ]
        return (real_candidates + fallback_candidates)[:6]

    # =========================================================================
    # ESTADO SIMULADO Y CONSOLIDADO
    # =========================================================================

    def get_simulation_state(self, platform_override: Optional[str] = None) -> Dict[str, Any]:
        """Genera un estado dinámico simulado para pruebas de cabina."""
        sim_decks = [
            (
                {
                    "artist": "Mauro Picotto",
                    "name": "Komodo (Megavoices Claxixx Mix)",
                    "bpm": 137.68,
                    "raw_key": "Bm",
                    "file": "Mauro Picotto - Komodo.flac",
                    "genre": "Trance / Hard Techno",
                    "subgenre": "Peak Classics",
                    "energy": 94,
                    "danceability": 89,
                    "format": "FLAC 24-bit 44.1kHz",
                    "duration": "08:15",
                    "phase": "Peak Time Climax",
                    "year": "2000",
                    "cover": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop"
                },
                {
                    "artist": "Marco Bailey / Sigvard",
                    "name": "Smooth Mind",
                    "bpm": 140.0,
                    "raw_key": "Gm",
                    "file": "Sigvard - Smooth Mind.flac",
                    "genre": "Raw / Deep Techno",
                    "subgenre": "Drumcode Peak",
                    "energy": 91,
                    "danceability": 95,
                    "format": "FLAC 16-bit 44.1kHz",
                    "duration": "05:48",
                    "phase": "Hypnotic Groove",
                    "year": "2023",
                    "cover": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop"
                }
            ),
            (
                {
                    "artist": "Charlotte de Witte",
                    "name": "Doppler",
                    "bpm": 132.0,
                    "raw_key": "Am",
                    "file": "Charlotte de Witte - Doppler.flac",
                    "genre": "Acid Techno",
                    "subgenre": "KNTXT Peak",
                    "energy": 96,
                    "danceability": 88,
                    "format": "FLAC Hi-Res 24-bit",
                    "duration": "06:45",
                    "phase": "Acid Peak",
                    "year": "2021",
                    "cover": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop"
                },
                {
                    "artist": "Enrico Sangiuliano",
                    "name": "Future Acid",
                    "bpm": 132.5,
                    "raw_key": "Em",
                    "file": "Enrico Sangiuliano - Future Acid.flac",
                    "genre": "Peak Time Techno",
                    "subgenre": "NINETOZERO Core",
                    "energy": 93,
                    "danceability": 91,
                    "format": "FLAC 24-bit 96kHz",
                    "duration": "06:38",
                    "phase": "Cosmic Drive",
                    "year": "2022",
                    "cover": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=300&fit=crop"
                }
            ),
            (
                {
                    "artist": "Hertz",
                    "name": "Old School",
                    "bpm": 142.0,
                    "raw_key": "Abm",
                    "file": "Hertz - Old School.flac",
                    "genre": "Hard Techno Industrial",
                    "subgenre": "Sway Records",
                    "energy": 98,
                    "danceability": 86,
                    "format": "WAV 24-bit Master",
                    "duration": "05:12",
                    "phase": "Industrial Assault",
                    "year": "2024",
                    "cover": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop"
                },
                {
                    "artist": "James Ruskin",
                    "name": "Detached",
                    "bpm": 136.0,
                    "raw_key": "Em",
                    "file": "James Ruskin - Detached.flac",
                    "genre": "Minimal / Deep Techno",
                    "subgenre": "Blueprint",
                    "energy": 87,
                    "danceability": 94,
                    "format": "FLAC 16-bit 44.1kHz",
                    "duration": "06:14",
                    "phase": "Warm-Up Driver",
                    "year": "2019",
                    "cover": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop"
                }
            )
        ]
        
        pair = sim_decks[self._sim_index % len(sim_decks)]
        self._sim_index += 1

        t1, t2 = pair[0], pair[1]
        c1 = self.to_camelot(t1["raw_key"])
        c2 = self.to_camelot(t2["raw_key"])

        deck_1_cues = [
            {"id": 1, "name": "Downbeat 1.0.0", "color": "#ef4444", "pct": 0.04, "time": "00:00.25"},
            {"id": 2, "name": "Intro Perc", "color": "#f97316", "pct": 0.16, "time": "01:04.00"},
            {"id": 3, "name": "Bassline In", "color": "#eab308", "pct": 0.32, "time": "02:08.00"},
            {"id": 4, "name": "MAIN DROP", "color": "#10b981", "pct": 0.48, "time": "03:12.00"},
            {"id": 5, "name": "Breakdown", "color": "#06b6d4", "pct": 0.62, "time": "04:16.00"},
            {"id": 6, "name": "Climax 2", "color": "#3b82f6", "pct": 0.74, "time": "05:04.00"},
            {"id": 7, "name": "Outro 32b", "color": "#8b5cf6", "pct": 0.86, "time": "06:08.00"},
            {"id": 8, "name": "Cut / Fade", "color": "#ec4899", "pct": 0.96, "time": "07:15.00"}
        ]
        deck_2_cues = [
            {"id": 1, "name": "Downbeat 1.0.0", "color": "#ef4444", "pct": 0.05, "time": "00:00.30"},
            {"id": 2, "name": "Vocal Hook", "color": "#f97316", "pct": 0.19, "time": "01:08.00"},
            {"id": 3, "name": "Build-Up 16b", "color": "#eab308", "pct": 0.35, "time": "02:16.00"},
            {"id": 4, "name": "PEAK DROP", "color": "#10b981", "pct": 0.50, "time": "03:20.00"},
            {"id": 5, "name": "Acid Meltdown", "color": "#06b6d4", "pct": 0.64, "time": "04:24.00"},
            {"id": 6, "name": "Second Drop", "color": "#3b82f6", "pct": 0.76, "time": "05:12.00"},
            {"id": 7, "name": "Outro Limpio", "color": "#8b5cf6", "pct": 0.88, "time": "06:16.00"},
            {"id": 8, "name": "Fade Out", "color": "#ec4899", "pct": 0.97, "time": "06:45.00"}
        ]

        now = time.time()
        dur_1_sec = self._parse_duration_sec(t1.get("duration", "08:15"))
        elapsed_1 = round((now * 1.0) % dur_1_sec, 2)
        prog_1 = round(elapsed_1 / (dur_1_sec or 1), 4)

        dur_2_sec = self._parse_duration_sec(t2.get("duration", "05:48"))
        elapsed_2 = round(((now * 0.95) + 35) % dur_2_sec, 2)
        prog_2 = round(elapsed_2 / (dur_2_sec or 1), 4)

        deck_1 = {
            "deck_num": "1",
            "status": "ON AIR (MASTER)",
            "is_master": True,
            "is_playing": True,
            "artist": t1["artist"],
            "title": t1["name"],
            "bpm": t1["bpm"],
            "camelot": c1,
            "camelot_color": self.CAMELOT_COLORS.get(c1, "#06b6d4"),
            "raw_key": t1["raw_key"],
            "file_path": t1["file"],
            "genre": t1.get("genre", "Melodic Techno"),
            "subgenre": t1.get("subgenre", "Peak Time"),
            "energy": t1.get("energy", 92),
            "danceability": t1.get("danceability", 88),
            "format": t1.get("format", "FLAC 24-bit"),
            "duration": t1.get("duration", "06:30"),
            "duration_sec": dur_1_sec,
            "elapsed_sec": elapsed_1,
            "play_progress": prog_1,
            "phase": t1.get("phase", "Peak Time"),
            "mood": t1.get("phase", "Peak Time Climax"),
            "year": t1.get("year", "2024"),
            "cover": t1.get("cover", ""),
            "cues": deck_1_cues,
            "structural_phases": self._generate_structural_phases(deck_1_cues, dur_1_sec),
            "lufs": -6.6,
            "low_ratio": 48.0,
            "mid_ratio": 32.0,
            "high_ratio": 20.0,
            "acoustic_role": "Bass-Heavy Driver",
            "is_audited": True,
            "comment": f"[{t1['bpm']} BPM | {c1}] Intro 32b • Drop contundente • Outro 64b",
            "tactical_comment": f"[{t1['bpm']} BPM | {c1}] Intro 32b • Drop contundente • Outro 64b"
        }

        deck_2 = {
            "deck_num": "2",
            "status": "CUE / CARGADO",
            "is_master": False,
            "is_playing": False,
            "artist": t2["artist"],
            "title": t2["name"],
            "bpm": t2["bpm"],
            "camelot": c2,
            "camelot_color": self.CAMELOT_COLORS.get(c2, "#06b6d4"),
            "raw_key": t2["raw_key"],
            "file_path": t2["file"],
            "genre": t2.get("genre", "Raw / Deep Techno"),
            "subgenre": t2.get("subgenre", "Drumcode Core"),
            "energy": t2.get("energy", 91),
            "danceability": t2.get("danceability", 95),
            "format": t2.get("format", "FLAC 16-bit"),
            "duration": t2.get("duration", "05:48"),
            "duration_sec": dur_2_sec,
            "elapsed_sec": elapsed_2,
            "play_progress": prog_2,
            "phase": t2.get("phase", "Hypnotic Groove"),
            "mood": t2.get("phase", "Hypnotic Groove"),
            "year": t2.get("year", "2023"),
            "cover": t2.get("cover", ""),
            "cues": deck_2_cues,
            "structural_phases": self._generate_structural_phases(deck_2_cues, dur_2_sec),
            "lufs": -6.3,
            "low_ratio": 51.0,
            "mid_ratio": 31.0,
            "high_ratio": 18.0,
            "acoustic_role": "Peak Time Driver",
            "is_audited": True,
            "comment": f"[{t2['bpm']} BPM | {c2}] Warm-Up Groovy • Drop vocal intenso",
            "tactical_comment": f"[{t2['bpm']} BPM | {c2}] Warm-Up Groovy • Drop vocal intenso"
        }

        anti_muddy = self._calculate_anti_muddy_guard(deck_1, deck_2)
        harmonic = self._calculate_harmonic_relation(c1, c2)
        recs = self._get_tactical_recommendations(deck_1)

        lufs_delta = round(deck_2["lufs"] - deck_1["lufs"], 1)
        bpm_delta = round(deck_2["bpm"] - deck_1["bpm"], 2)
        bpm_pct = round(((deck_2["bpm"] - deck_1["bpm"]) / deck_1["bpm"]) * 100, 2)

        active_plat = platform_override or self.detect_active_platform()
        spec = self.PLATFORM_SPECS.get(active_plat, self.PLATFORM_SPECS["serato"])

        return {
            "connected": True,
            "source": "SIMULATION_MODE",
            "platform": active_plat,
            "platform_mode": self.platform_mode,
            "platform_name": spec["name"],
            "platform_icon": spec["icon"],
            "platform_color": spec["brand_color"],
            "platform_status": "SIMULACIÓN",
            "capture_latency_ms": 0.35,
            "fps": 60,
            "controller": self.get_connected_dj_controller(),
            "ableton_link": {
                "enabled": True,
                "peers": getattr(self, "link_peers", 0),
                "bpm": getattr(self, "link_bpm", 128.0),
                "playing": getattr(self, "link_is_playing", False)
            },
            "detected_platforms": {
                pid: self._is_platform_installed(pid) for pid in self.PLATFORM_SPECS
            },
            "deck_1": deck_1,
            "deck_2": deck_2,
            "anti_muddy": anti_muddy,
            "harmonic": harmonic,
            "lufs_delta": lufs_delta,
            "bpm_delta": bpm_delta,
            "bpm_pct": bpm_pct,
            "recommendations": recs,
            "local_ip": self.get_local_ip(),
            "timestamp": time.time(),
            "last_updated": time.strftime("%H:%M:%S")
        }

    def get_live_state(self) -> Dict[str, Any]:
        """Obtiene el estado táctico consolidado de la cabina adaptado al software DJ seleccionado con latencia sub-milisegundo (<1ms)."""
        t0 = time.perf_counter()
        now = time.time()
        if (now - self._last_live_state_time < 0.016) and (self._cached_live_state is not None):
            return self._cached_live_state

        active_plat = self.detect_active_platform()
        spec = self.PLATFORM_SPECS.get(active_plat, self.PLATFORM_SPECS["serato"])

        if self.simulation_mode:
            state = self.get_simulation_state(active_plat)
            self._last_live_state_time = time.time()
            self._cached_live_state = state
            return state

        # Ingesta según la plataforma activa
        entries = []
        deck_1_raw = None
        deck_2_raw = None

        if active_plat == "serato":
            deck_1_raw, deck_2_raw, entries = self._query_serato_decks()
        elif active_plat == "virtualdj":
            entries = self._query_virtualdj_history()
        elif active_plat == "rekordbox":
            entries = self._query_rekordbox_history()
        elif active_plat == "traktor":
            entries = self._query_traktor_history()

        # Para plataformas no-serato, agrupar las pistas por Deck (1 y 2) de forma segura
        if active_plat != "serato":
            for entry in entries:
                if entry.get("end_time") == -1:
                    d = str(entry.get("deck", "1")).strip()
                    if d in ("1", "A") and deck_1_raw is None:
                        deck_1_raw = entry
                    elif d in ("2", "B") and deck_2_raw is None:
                        deck_2_raw = entry

            for entry in entries:
                d = str(entry.get("deck", "1")).strip()
                if d in ("1", "A") and deck_1_raw is None:
                    deck_1_raw = entry
                elif d in ("2", "B") and deck_2_raw is None:
                    deck_2_raw = entry
                if deck_1_raw and deck_2_raw:
                    break

            if not deck_1_raw and entries:
                deck_1_raw = entries[0]
            if not deck_2_raw and len(entries) > 1 and str(entries[1].get("deck", "")).strip() in ("2", "B"):
                deck_2_raw = entries[1]

        is_installed = self._is_platform_installed(active_plat)

        if not entries and not deck_1_raw and not deck_2_raw:
            # Standby inteligente con perfil de la plataforma
            state = self.get_simulation_state(active_plat)
            state["source"] = f"{active_plat.upper()}_STANDBY"
            state["platform_status"] = "STANDBY"
            state["platform_detected"] = is_installed
            self._last_live_state_time = time.time()
            self._cached_live_state = state
            return state

        # Determinar si el proceso DJ está activo en memoria
        dj_proc = self._get_running_dj_process()
        is_dj_running = bool(dj_proc)

        # Enriquecer con DSP
        dsp_1 = self._fetch_audit_dsp(deck_1_raw.get("file_path", "")) if deck_1_raw else self._fetch_audit_dsp("")
        dsp_2 = self._fetch_audit_dsp(deck_2_raw.get("file_path", "")) if deck_2_raw else self._fetch_audit_dsp("")

        c1 = (deck_1_raw.get("camelot") if deck_1_raw else "8A") or "8A"
        c2 = (deck_2_raw.get("camelot") if deck_2_raw else "8A") or "8A"

        dur_1_sec = self._parse_duration_sec(deck_1_raw.get("duration") or "06:34") if deck_1_raw else 390.0
        dur_2_sec = self._parse_duration_sec(deck_2_raw.get("duration") or "06:03") if deck_2_raw else 360.0

        t1_start = deck_1_raw.get("start_time", 0) if deck_1_raw else 0
        t1_end = deck_1_raw.get("end_time", -1) if deck_1_raw else 0
        t2_start = deck_2_raw.get("start_time", 0) if deck_2_raw else 0
        t2_end = deck_2_raw.get("end_time", -1) if deck_2_raw else 0

        down_sec_1 = float(dsp_1.get("first_downbeat_ms") or 0.0) / 1000.0
        down_sec_2 = float(dsp_2.get("first_downbeat_ms") or 0.0) / 1000.0

        time_since_1 = now - t1_start if t1_start else 0.0
        time_since_2 = now - t2_start if t2_start else 0.0

        # Detección de cambio de pista por Deck para resetear CUE
        track_id_1 = str(deck_1_raw.get("id") or deck_1_raw.get("file_path") or "") if deck_1_raw else ""
        track_id_2 = str(deck_2_raw.get("id") or deck_2_raw.get("file_path") or "") if deck_2_raw else ""

        pb1 = self._deck_playback["1"]
        if track_id_1 and pb1.get("last_track_id") != track_id_1:
            pb1["last_track_id"] = track_id_1
            pb1["play_start_ts"] = now
            pb1["elapsed_sec"] = down_sec_1

        pb2 = self._deck_playback["2"]
        if track_id_2 and pb2.get("last_track_id") != track_id_2:
            pb2["last_track_id"] = track_id_2
            pb2["play_start_ts"] = now
            pb2["elapsed_sec"] = down_sec_2

        # DETERMINACIÓN DE MASTER (ON AIR) VS CUE (PREPARADO)
        if self.manual_master_deck in ("1", "2"):
            deck_1_is_master = (self.manual_master_deck == "1")
        else:
            if deck_1_raw and deck_2_raw:
                # El track cargado antes es el Master en aire; el recién cargado es el CUE preparado
                deck_1_is_master = (t1_start <= t2_start)
            elif deck_1_raw:
                deck_1_is_master = True
            else:
                deck_1_is_master = False

        # REPRODUCCIÓN FLUIDA AUTÓNOMA Y REACTIVA:
        # El deck Master reproduce y avanza continuamente; el deck Cue permanece preparado en punto Cue
        if self.manual_play_state.get("1") is not None:
            d1_is_playing = bool(self.manual_play_state["1"])
        else:
            d1_is_playing = bool(deck_1_raw and deck_1_is_master)

        if self.manual_play_state.get("2") is not None:
            d2_is_playing = bool(self.manual_play_state["2"])
        else:
            d2_is_playing = bool(deck_2_raw and (not deck_1_is_master))

        # Cálculo de tiempo transcurrido (elapsed):
        if d1_is_playing and deck_1_raw:
            pb1 = self._deck_playback["1"]
            if pb1.get("play_start_ts") and pb1["play_start_ts"] > 0:
                elapsed_1 = round(pb1.get("elapsed_sec", 0.0) + (now - pb1["play_start_ts"]), 2)
            else:
                t1_st = float(t1_start) if t1_start else now
                elapsed_1 = round(max(0.0, now - t1_st) % (dur_1_sec or 1), 2)
            prog_1 = round(min(1.0, elapsed_1 / (dur_1_sec or 1)), 4)
        else:
            elapsed_1 = round(down_sec_1, 2) if deck_1_raw else 0.0
            prog_1 = round(min(1.0, elapsed_1 / (dur_1_sec or 1)), 4) if (deck_1_raw and dur_1_sec > 0) else 0.0

        if d2_is_playing and deck_2_raw:
            pb2 = self._deck_playback["2"]
            if pb2.get("play_start_ts") and pb2["play_start_ts"] > 0:
                elapsed_2 = round(pb2.get("elapsed_sec", 0.0) + (now - pb2["play_start_ts"]), 2)
            else:
                t2_st = float(t2_start) if t2_start else now
                elapsed_2 = round(max(0.0, now - t2_st) % (dur_2_sec or 1), 2)
            prog_2 = round(min(1.0, elapsed_2 / (dur_2_sec or 1)), 4)
        else:
            elapsed_2 = round(down_sec_2, 2) if deck_2_raw else 0.0
            prog_2 = round(min(1.0, elapsed_2 / (dur_2_sec or 1)), 4) if (deck_2_raw and dur_2_sec > 0) else 0.0

        # Hot Cues reales extraídos de la pista Serato o calculados acústicamente
        deck_1_cues_list = self._extract_serato_markers_cues(deck_1_raw.get("file_path", "")) if deck_1_raw else None
        if not deck_1_cues_list:
            deck_1_cues_list = dsp_1.get("cues") or deck_1_raw.get("cues")
        if not deck_1_cues_list:
            from infrastructure.audio_processor import AudioProcessorService
            down_ms = float(dsp_1.get("first_downbeat_ms") or 0.0)
            deck_1_cues_list = AudioProcessorService.calcular_8_hot_cues_fraseo(
                duration_ms=int(dur_1_sec * 1000),
                bpm=float(deck_1_raw.get("bpm") or 130.0),
                downbeat_ms=int(down_ms)
            )
        if deck_1_cues_list:
            for c in deck_1_cues_list:
                if "pct" not in c and dur_1_sec > 0:
                    c["pct"] = round((float(c.get("pos_ms", 0)) / 1000.0) / dur_1_sec, 4)

        deck_2_cues_list = self._extract_serato_markers_cues(deck_2_raw.get("file_path", "")) if deck_2_raw else None
        if not deck_2_cues_list:
            deck_2_cues_list = dsp_2.get("cues") or deck_2_raw.get("cues")
        if not deck_2_cues_list:
            from infrastructure.audio_processor import AudioProcessorService
            down_ms = float(dsp_2.get("first_downbeat_ms") or 0.0)
            deck_2_cues_list = AudioProcessorService.calcular_8_hot_cues_fraseo(
                duration_ms=int(dur_2_sec * 1000),
                bpm=float(deck_2_raw.get("bpm") or 130.0),
                downbeat_ms=int(down_ms)
            )
        if deck_2_cues_list:
            for c in deck_2_cues_list:
                if "pct" not in c and dur_2_sec > 0:
                    c["pct"] = round((float(c.get("pos_ms", 0)) / 1000.0) / dur_2_sec, 4)

        deck_1_status = "ON AIR (MASTER)" if (d1_is_playing and deck_1_is_master) else ("REPRODUCIENDO" if d1_is_playing else ("MASTER (PAUSADO)" if deck_1_is_master else "CUE (DETENIDO)"))
        deck_2_status = "ON AIR (MASTER)" if (d2_is_playing and not deck_1_is_master) else ("REPRODUCIENDO" if d2_is_playing else ("MASTER (PAUSADO)" if not deck_1_is_master else "CUE (DETENIDO)"))

        if deck_1_raw:
            deck_1 = {
                "deck_num": "1",
                "status": deck_1_status,
                "is_master": deck_1_is_master,
                "is_playing": d1_is_playing,
                "artist": deck_1_raw.get("artist", "Desconocido"),
                "title": deck_1_raw.get("name", "Pista 1"),
                "bpm": deck_1_raw.get("bpm", 130.0),
                "camelot": c1,
                "camelot_color": self.CAMELOT_COLORS.get(c1, "#06b6d4"),
                "raw_key": deck_1_raw.get("raw_key", ""),
                "file_path": deck_1_raw.get("file_path", ""),
                "genre": dsp_1.get("genre") or deck_1_raw.get("genre") or "Melodic Techno",
                "subgenre": dsp_1.get("subgenre") or deck_1_raw.get("subgenre") or "Club Master",
                "energy": dsp_1.get("energy") or deck_1_raw.get("energy", 92),
                "danceability": dsp_1.get("danceability") or deck_1_raw.get("danceability", 88),
                "format": deck_1_raw.get("format") or ("FLAC 24-bit" if str(deck_1_raw.get("file_path","")).lower().endswith(".flac") else "MP3 320k"),
                "duration": deck_1_raw.get("duration") or "06:30",
                "duration_sec": dur_1_sec,
                "elapsed_sec": elapsed_1,
                "play_progress": prog_1,
                "phase": dsp_1.get("phase") or deck_1_raw.get("phase") or "Peak Time",
                "mood": dsp_1.get("mood") or "Peak Time",
                "year": deck_1_raw.get("year") or "2024",
                "cover": deck_1_raw.get("cover") or (f"/cover?path={deck_1_raw['file_path']}" if deck_1_raw.get("file_path") else ""),
                "cues": deck_1_cues_list,
                "first_downbeat_ms": dsp_1.get("first_downbeat_ms", 0.0),
                "structural_phases": self._generate_structural_phases(deck_1_cues_list, dur_1_sec),
                "lufs": dsp_1["lufs"],
                "low_ratio": dsp_1["low_ratio"],
                "mid_ratio": dsp_1["mid_ratio"],
                "high_ratio": dsp_1["high_ratio"],
                "acoustic_role": dsp_1["acoustic_role"],
                "is_audited": dsp_1["is_audited"],
                "comment": dsp_1.get("comment") or f"[{deck_1_raw.get('bpm', 130.0)} BPM | {c1}] Intro 32b • Drop contundente • Outro 64b",
                "tactical_comment": dsp_1.get("comment") or f"[{deck_1_raw.get('bpm', 130.0)} BPM | {c1}] Intro 32b • Drop contundente • Outro 64b",
                "serato_overview": self._extract_serato_overview(deck_1_raw.get("file_path"))
            }
        else:
            deck_1 = {
                "deck_num": "1",
                "status": "STANDBY / VACÍO",
                "is_master": False,
                "is_playing": False,
                "artist": "Deck 1 Vacío",
                "title": "Arrastra una canción en Serato Deck 1",
                "bpm": 130.0,
                "camelot": "8A",
                "camelot_color": "#06b6d4",
                "raw_key": "",
                "file_path": "",
                "genre": "Standby",
                "subgenre": "En espera",
                "energy": 0,
                "danceability": 0,
                "format": "--",
                "duration": "00:00",
                "duration_sec": 0.0,
                "elapsed_sec": 0.0,
                "play_progress": 0.0,
                "phase": "Standby",
                "year": "",
                "cover": "",
                "cues": [],
                "structural_phases": [],
                "lufs": -14.0,
                "low_ratio": 33.0,
                "mid_ratio": 33.0,
                "high_ratio": 34.0,
                "acoustic_role": "Standby",
                "is_audited": False,
                "comment": "Deck 1 en espera de carga en Serato",
                "tactical_comment": "Deck 1 en espera de carga en Serato",
                "serato_overview": None
            }

        if deck_2_raw:
            deck_2 = {
                "deck_num": "2",
                "status": deck_2_status,
                "is_master": not deck_1_is_master,
                "is_playing": d2_is_playing,
                "artist": deck_2_raw.get("artist", "Desconocido"),
                "title": deck_2_raw.get("name", "Pista 2"),
                "bpm": round(self.link_bpm, 2) if (self.link_peers > 0 and d2_is_playing) else deck_2_raw.get("bpm", 130.0),
                "camelot": c2,
                "camelot_color": self.CAMELOT_COLORS.get(c2, "#06b6d4"),
                "raw_key": deck_2_raw.get("raw_key", ""),
                "file_path": deck_2_raw.get("file_path", ""),
                "genre": deck_2_raw.get("genre") or "Raw / Deep Techno",
                "subgenre": deck_2_raw.get("subgenre") or "Drumcode Core",
                "energy": deck_2_raw.get("energy", 91),
                "danceability": deck_2_raw.get("danceability", 95),
                "format": deck_2_raw.get("format") or ("FLAC 16-bit" if str(deck_2_raw.get("file_path","")).lower().endswith(".flac") else "MP3 320k"),
                "duration": deck_2_raw.get("duration") or "05:48",
                "duration_sec": dur_2_sec,
                "elapsed_sec": elapsed_2,
                "play_progress": prog_2,
                "phase": deck_2_raw.get("phase") or "Hypnotic Groove",
                "year": deck_2_raw.get("year") or "2023",
                "cover": deck_2_raw.get("cover") or (f"/cover?path={deck_2_raw['file_path']}" if deck_2_raw.get("file_path") else ""),
                "cues": deck_2_cues_list,
                "structural_phases": self._generate_structural_phases(deck_2_cues_list, dur_2_sec),
                "lufs": dsp_2["lufs"],
                "low_ratio": dsp_2["low_ratio"],
                "mid_ratio": dsp_2["mid_ratio"],
                "high_ratio": dsp_2["high_ratio"],
                "acoustic_role": dsp_2["acoustic_role"],
                "is_audited": dsp_2["is_audited"],
                "comment": dsp_2.get("comment") or f"[{deck_2_raw.get('bpm', 130.0)} BPM | {c2}] Entrada armónica limpia • Outro extendido",
                "tactical_comment": dsp_2.get("comment") or f"[{deck_2_raw.get('bpm', 130.0)} BPM | {c2}] Entrada armónica limpia • Outro extendido",
                "serato_overview": self._extract_serato_overview(deck_2_raw.get("file_path")) if deck_2_raw else None
            }
        else:
            deck_2 = {
                "deck_num": "2",
                "status": "STANDBY / VACÍO",
                "is_master": False,
                "is_playing": False,
                "artist": "Deck 2 Vacío",
                "title": "Carga un track en Serato Deck 2",
                "bpm": deck_1["bpm"],
                "camelot": deck_1["camelot"],
                "camelot_color": deck_1["camelot_color"],
                "raw_key": "",
                "file_path": "",
                "genre": "Standby",
                "subgenre": "En espera",
                "energy": 0,
                "danceability": 0,
                "format": "--",
                "duration": "00:00",
                "duration_sec": 0.0,
                "elapsed_sec": 0.0,
                "play_progress": 0.0,
                "phase": "Standby",
                "year": "",
                "cover": "",
                "cues": [],
                "structural_phases": [],
                "lufs": -14.0,
                "low_ratio": 33.0,
                "mid_ratio": 33.0,
                "high_ratio": 34.0,
                "acoustic_role": "Standby",
                "is_audited": False,
                "comment": "Deck 2 en espera de carga en Serato",
                "tactical_comment": "Carga un track en Deck 2 para ver análisis Anti-Muddy"
            }

        master_deck = deck_1 if deck_1_is_master else deck_2
        incoming_deck = deck_2 if deck_1_is_master else deck_1

        anti_muddy = self._calculate_anti_muddy_guard(master_deck, incoming_deck)
        harmonic = self._calculate_harmonic_relation(master_deck["camelot"], incoming_deck["camelot"])
        recs = self._get_tactical_recommendations(master_deck)

        lufs_delta = round(incoming_deck["lufs"] - master_deck["lufs"], 1)
        bpm_delta = round(incoming_deck["bpm"] - master_deck["bpm"], 2)
        bpm_pct = round(((incoming_deck["bpm"] - master_deck["bpm"]) / (master_deck["bpm"] or 1)) * 100, 2)

        capture_latency_ms = round((time.perf_counter() - t0) * 1000, 2)
        res = {
            "connected": True,
            "source": f"{active_plat.upper()}_LIVE",
            "platform": active_plat,
            "platform_mode": self.platform_mode,
            "platform_name": spec["name"],
            "platform_icon": spec["icon"],
            "platform_color": spec["brand_color"],
            "platform_status": "LIVE",
            "capture_latency_ms": max(0.12, capture_latency_ms),
            "fps": 60,
            "controller": self.get_connected_dj_controller(),
            "ableton_link": {
                "enabled": True,
                "peers": getattr(self, "link_peers", 0),
                "bpm": getattr(self, "link_bpm", 128.0),
                "playing": getattr(self, "link_is_playing", False)
            },
            "detected_platforms": {
                pid: self._is_platform_installed(pid) for pid in self.PLATFORM_SPECS
            },
            "deck_1": deck_1,
            "deck_2": deck_2,
            "manual_master_deck": self.manual_master_deck,
            "anti_muddy": anti_muddy,
            "harmonic": harmonic,
            "lufs_delta": lufs_delta,
            "bpm_delta": bpm_delta,
            "bpm_pct": bpm_pct,
            "recommendations": recs,
            "local_ip": self.get_local_ip(),
            "timestamp": time.time(),
            "last_updated": time.strftime("%H:%M:%S")
        }
        self._last_live_state_time = time.time()
        self._cached_live_state = res
        return res

    def set_manual_master(self, deck: str) -> Dict[str, Any]:
        """Fuerza manualmente qué deck es el MASTER (1, 2, 'toggle', o 'auto')."""
        d_str = str(deck).strip().lower()
        if d_str == "toggle":
            cur = self.get_live_state()
            d1_master = cur.get("deck_1", {}).get("is_master", True)
            self.manual_master_deck = "2" if d1_master else "1"
        elif d_str in ("1", "a"):
            self.manual_master_deck = "1"
        elif d_str in ("2", "b"):
            self.manual_master_deck = "2"
        elif d_str in ("auto", "none", ""):
            self.manual_master_deck = None
        self._last_live_state_time = 0.0
        self._cached_live_state = None
        return self.get_live_state()

    def toggle_play(self, deck: str = "master") -> Dict[str, Any]:
        """Conmuta Play/Pausa de un deck en tiempo real ('1', '2', o 'master')."""
        if deck == "master":
            target = "1" if (self.manual_master_deck == "1" or self._deck_playback["1"]["is_playing"]) else "2"
        elif str(deck).strip().lower() in ("2", "b", "deck2"):
            target = "2"
        else:
            target = "1"

        now = time.time()
        pb = self._deck_playback[target]
        if pb["is_playing"]:
            # Pausar acumulando el tiempo avanzado
            pb["elapsed_sec"] = pb.get("elapsed_sec", 0.0) + max(0.0, now - (pb.get("play_start_ts") or now))
            pb["is_playing"] = False
            pb["play_start_ts"] = 0.0
        else:
            # Reanudar Play desde la posición actual
            pb["is_playing"] = True
            pb["play_start_ts"] = now
            if pb.get("elapsed_sec", 0.0) < 0:
                pb["elapsed_sec"] = 0.0

        self.manual_play_state[target] = pb["is_playing"]
        self._last_live_state_time = 0.0
        self._cached_live_state = None
        return self.get_live_state()

    def cue_deck(self, deck: str = "1") -> Dict[str, Any]:
        """Detiene la reproducción y rebobina al punto CUE (Downbeat Bar 1)."""
        target = "2" if str(deck).strip().lower() in ("2", "b", "deck2") else "1"
        pb = self._deck_playback[target]
        pb["is_playing"] = False
        pb["play_start_ts"] = 0.0
        pb["elapsed_sec"] = 0.0
        self.manual_play_state[target] = False
        self._last_live_state_time = 0.0
        self._cached_live_state = None
        return self.get_live_state()

    def set_play_state(self, deck: str, is_playing: bool, position_sec: Optional[float] = None) -> Dict[str, Any]:
        """Fija directamente el estado de reproducción desde WebMIDI o cliente."""
        target = "2" if str(deck).strip().lower() in ("2", "b", "deck2") else "1"
        now = time.time()
        pb = self._deck_playback[target]
        if is_playing and not pb["is_playing"]:
            pb["is_playing"] = True
            pb["play_start_ts"] = now
            if position_sec is not None:
                pb["elapsed_sec"] = max(0.0, float(position_sec))
        elif not is_playing and pb["is_playing"]:
            pb["elapsed_sec"] = pb.get("elapsed_sec", 0.0) + max(0.0, now - (pb.get("play_start_ts") or now))
            pb["is_playing"] = False
            pb["play_start_ts"] = 0.0
            if position_sec is not None:
                pb["elapsed_sec"] = max(0.0, float(position_sec))

        self.manual_play_state[target] = is_playing
        self._last_live_state_time = 0.0
        self._cached_live_state = None
        return self.get_live_state()

copilot_service = CopilotService()
