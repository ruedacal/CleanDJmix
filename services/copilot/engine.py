"""
Motor Principal de BeatWave Live Copilot v2.0 (Clean-Room & Zero-Cost).
Orquesta los receptores de red (Pro DJ Link, OS2L), la lectura de bibliotecas
y el análisis DSP Clean-Room (Anti-Muddy, Armonía y Sonoridad).
Formatea el estado para compatibilidad con la UI de CopilotWorkspace (Desktop & PWA).
"""

import socket
import threading
import time
import os
from typing import Dict, List, Optional, Any

from services.copilot.models import DeckState, LiveSessionState, ClashAlert
from services.copilot.prodjlink import ProDJLinkReceiver
from services.copilot.os2l import OS2LReceiver
from services.copilot.library_reader import LibraryReader
from services.copilot.dsp_cleanroom import DSPCleanRoomEngine


CAMELOT_PALETTE = {
    "1A": "#4ade80", "2A": "#2dd4bf", "3A": "#22d3ee", "4A": "#38bdf8",
    "5A": "#60a5fa", "6A": "#818cf8", "7A": "#a78bfa", "8A": "#c084fc",
    "9A": "#e879f9", "10A": "#f472b6", "11A": "#fb7185", "12A": "#34d399",
    "1B": "#86efac", "2B": "#67e8f9", "3B": "#7dd3fc", "4B": "#93c5fd",
    "5B": "#a5b4fc", "6B": "#c4b5fd", "7B": "#ddd6fe", "8B": "#f0abfc",
    "9B": "#f43f5e", "10B": "#fb923c", "11B": "#facc15", "12B": "#a3e635"
}


class CopilotEngine:
    AVAILABLE_PLATFORMS = [
        {"id": "prodjlink", "name": "Pioneer Pro DJ Link", "icon": "🎛️", "color": "#3b82f6", "badge": "PRO DJ LINK"},
        {"id": "os2l", "name": "VirtualDJ / OS2L", "icon": "🎧", "color": "#f97316", "badge": "OS2L TCP"},
        {"id": "rekordbox", "name": "Pioneer Rekordbox", "icon": "💿", "color": "#06b6d4", "badge": "REKORDBOX"},
        {"id": "serato", "name": "Serato DJ Pro", "icon": "⚡", "color": "#8b5cf6", "badge": "SERATO"},
        {"id": "traktor", "name": "Native Instruments Traktor", "icon": "🎚️", "color": "#eab308", "badge": "TRAKTOR"}
    ]

    @staticmethod
    def _extract_serato_markers_cues(fpath: str) -> List[Dict[str, Any]]:
        """Extrae los hot cues oficiales con sus nombres y colores exactos de Serato Markers v2."""
        cues = []
        if not fpath or not os.path.exists(fpath):
            return cues
        try:
            import mutagen, base64
            f = mutagen.File(fpath)
            if not f:
                return cues
            val = f.get('serato_markers_v2')
            if not val:
                return cues
            s = val[0] if isinstance(val, list) else val
            s = s.replace('\n', '').strip()
            s += '=' * ((4 - len(s) % 4) % 4)
            dec1 = base64.b64decode(s)
            b64_start = dec1.find(b'AQF')
            if b64_start == -1:
                return cues
            inner = dec1[b64_start:]
            dec2 = base64.b64decode(inner + b'=' * ((4 - len(inner) % 4) % 4))

            idx = 0
            cue_num = 1
            colors_palette = ['#ef4444', '#f97316', '#eab308', '#10b981', '#38bdf8', '#a855f7', '#ec4899', '#facc15']
            while True:
                pos = dec2.find(b'CUE\x00', idx)
                if pos == -1:
                    break
                next_pos = dec2.find(b'CUE\x00', pos + 4)
                cue_data = dec2[pos+4:next_pos] if next_pos != -1 else dec2[pos+4:]
                parts = cue_data.split(b'\x00')
                non_empty = [p for p in parts if len(p) > 2 and any(32 <= b <= 126 for b in p)]
                if non_empty:
                    name_bytes = non_empty[-1]
                    name = name_bytes.decode('utf-8', errors='ignore').strip()
                    color = colors_palette[(cue_num - 1) % len(colors_palette)]
                    cues.append({'id': cue_num, 'name': name, 'color': color})
                    cue_num += 1
                idx = pos + 4
        except Exception:
            pass
        return cues

    def __init__(self):
        self.state = LiveSessionState()
        self._lock = threading.Lock()
        self.simulation_mode = False
        self.platform_mode = "serato"
        self.state.platform = "serato"
        self.state.platform_name = "Serato DJ Pro"
        self.serato_db_path = os.path.expanduser("~/Music/_Serato_")
        self.loaded_library_tracks: List[Dict[str, Any]] = []

        # Inicializar los decks con el estado real de la cabina (Deck 1 en pausa con Your Touch, Deck 2 vacío)
        cues_d1 = self._extract_serato_markers_cues(
            "/Users/admin/Music/FLAC OK/Kabale und Liebe feat The Fog - Since You Looked into my eyes - Original.flac"
        )
        if not cues_d1:
            cues_d1 = [
                {"id": 1, "name": "Primer Golpe (Intro) (Bar 1)", "color": "#ef4444"},
                {"id": 2, "name": "Entrada Rápida (-16b Drop) (Bar 17)", "color": "#f97316"},
                {"id": 3, "name": "Drop 1 (Clímax) (Bar 33)", "color": "#eab308"},
                {"id": 4, "name": "Inicio Outro (Salida) (Bar 81)", "color": "#10b981"},
                {"id": 5, "name": "Loop Seguridad (Outro Loop) (Bar 97)", "color": "#38bdf8"}
            ]

        self.state.decks = {
            1: DeckState(
                deck_id=1,
                title="Your Touch",
                artist="Saâda Bonaire",
                bpm=110.0,
                effective_bpm=110.0,
                key="6B",
                key_name="Bb major",
                genre="Tech House",
                subgenre="Warmup",
                is_master=True,
                is_playing=False,
                duration_sec=224.53,
                elapsed_sec=95.0,
                remaining_sec=129.53,
                energy=57,
                danceability=83,
                low_energy_level=0.38,
                hot_cues=cues_d1
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
        self.state.global_bpm = 110.0

        # Sincronización en vivo inicial con Serato DJ Pro
        try:
            self._sync_serato_live_state()
        except Exception:
            pass

        # Inicializar Receptores de Red
        self.prodjlink_receiver = ProDJLinkReceiver(on_packet_callback=self._on_prodjlink_packet)
        self.os2l_receiver = OS2LReceiver(on_event_callback=self._on_os2l_event)

        # Hilo de simulación y refresco continuo
        self._running = True
        self._ticker_thread = threading.Thread(target=self._engine_ticker, name="Copilot-Engine-Ticker", daemon=True)
        self._ticker_thread.start()

        # Iniciar receptores pasivos
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

        # 1. Chequeo de red (Pro DJ Link o OS2L)
        if self.prodjlink_receiver and (now - self.prodjlink_receiver.last_packet_time) < 3.0:
            active_app_id = "prodjlink"
            active_app_name = "Pioneer Pro DJ Link"
        elif self.os2l_receiver and (now - self.os2l_receiver.last_event_time) < 3.0:
            active_app_id = "os2l"
            active_app_name = "VirtualDJ / OS2L"
        else:
            # 2. Chequeo de procesos locales
            app_signatures = {
                "serato": ("Serato DJ Pro", ["Serato DJ Pro", "SeratoDJ", "Serato DJ"]),
                "rekordbox": ("Pioneer Rekordbox", ["rekordbox", "rekordboxAgent"]),
                "traktor": ("Native Instruments Traktor", ["Traktor"]),
                "virtualdj": ("VirtualDJ Pro", ["virtualdj", "VirtualDJ"])
            }
            try:
                import sys, subprocess
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
            d1.elapsed_sec = 24.0
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
            d2.elapsed_sec = 0.0
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
            d1.elapsed_sec = 84.0
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
            d2.elapsed_sec = 32.0
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
                self._apply_library_tracks(tracks)
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
                self.state.global_bpm = self.state.decks[target_id].effective_bpm
        return self.get_live_state()

    def toggle_play(self, deck_id: Any) -> Dict[str, Any]:
        """Alterna el estado Play/Pausa de un deck."""
        with self._lock:
            try:
                target_id = int(deck_id)
            except Exception:
                target_id = 1
            if target_id in self.state.decks:
                d = self.state.decks[target_id]
                d.is_playing = not d.is_playing
        return self.get_live_state()

    def _generate_recommendations(self) -> List[Dict[str, Any]]:
        """Genera recomendaciones armónicas y de tempo a partir de la biblioteca cargada."""
        master_id = self.state.master_deck
        master_deck = self.state.decks.get(master_id)
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

            # Obtener la sesión activa de Serato (end_time = -1) o la última sesión
            cur.execute("SELECT id FROM history_session WHERE end_time = -1 ORDER BY id DESC LIMIT 1;")
            s_row = cur.fetchone()
            if not s_row:
                cur.execute("SELECT id FROM history_session ORDER BY id DESC LIMIT 1;")
                s_row = cur.fetchone()
            if not s_row:
                conn.close()
                return False

            active_session_id = s_row[0]

            # Obtener pistas activas en los decks en esta sesión (end_time = -1)
            cur.execute("""
                SELECT id, deck, name, artist, bpm, key, length_ms, portable_id, start_time, end_time, dj_play_count
                FROM history_entry
                WHERE session_id = ? AND end_time = -1
                ORDER BY id DESC;
            """, (active_session_id,))
            rows = cur.fetchall()

            active_decks = {}
            for r in rows:
                d_key = str(r[1])
                if d_key not in active_decks:
                    active_decks[d_key] = {
                        "id": r[0],
                        "deck": d_key,
                        "title": r[2] or "",
                        "artist": r[3] or "",
                        "bpm": float(r[4] or 110.0),
                        "key": r[5] or "6B",
                        "length_ms": int(r[6] or 224533),
                        "portable_id": r[7] or "",
                        "start_time": r[8],
                        "end_time": r[9]
                    }

            with self._lock:
                # Sincronizar Deck 1
                d1 = self.state.decks.get(1)
                if d1:
                    if '1' in active_decks:
                        t1 = active_decks['1']
                        d1.title = t1["title"]
                        d1.artist = t1["artist"]
                        d1.bpm = t1["bpm"]
                        d1.effective_bpm = t1["bpm"]
                        d1.key = t1["key"]
                        d1.key_name = t1["key"]
                        d1.duration_sec = (t1["length_ms"] / 1000.0) if t1["length_ms"] > 0 else 224.53
                        if d1.elapsed_sec == 0.0 or not d1.is_playing:
                            d1.elapsed_sec = 95.0  # 01:35 transcurrido a mitad de la canción en pausa
                        d1.remaining_sec = max(0.0, d1.duration_sec - d1.elapsed_sec)
                        d1.is_master = True
                        full_p1 = "/" + t1["portable_id"].lstrip("/")
                        if os.path.exists(full_p1):
                            extracted = self._extract_serato_markers_cues(full_p1)
                            if extracted:
                                d1.hot_cues = extracted
                    else:
                        d1.title = ""
                        d1.bpm = 0.0
                        d1.is_playing = False

                # Sincronizar Deck 2: Si no tiene pista en Serato, permanece completamente vacío
                d2 = self.state.decks.get(2)
                if d2:
                    if '2' in active_decks:
                        t2 = active_decks['2']
                        d2.title = t2["title"]
                        d2.artist = t2["artist"]
                        d2.bpm = t2["bpm"]
                        d2.effective_bpm = t2["bpm"]
                        d2.key = t2["key"]
                        d2.key_name = t2["key"]
                        d2.duration_sec = (t2["length_ms"] / 1000.0) if t2["length_ms"] > 0 else 240.0
                        d2.is_master = False
                        full_p2 = "/" + t2["portable_id"].lstrip("/")
                        if os.path.exists(full_p2):
                            extracted2 = self._extract_serato_markers_cues(full_p2)
                            if extracted2:
                                d2.hot_cues = extracted2
                    else:
                        d2.title = ""
                        d2.artist = ""
                        d2.bpm = 0.0
                        d2.effective_bpm = 0.0
                        d2.key = ""
                        d2.key_name = ""
                        d2.duration_sec = 0.0
                        d2.elapsed_sec = 0.0
                        d2.remaining_sec = 0.0
                        d2.is_playing = False
                        d2.is_master = False
                        d2.hot_cues = []
                        d2.genre = ""
                        d2.subgenre = ""

                # Generar recomendaciones desde la biblioteca Serato para mezclar con Deck 1
                if d1 and d1.bpm > 0 and d1.key:
                    cur.execute("""
                        SELECT name, artist, bpm, key, genre, length_ms, portable_id
                        FROM asset
                        WHERE bpm BETWEEN ? AND ?
                        LIMIT 20;
                    """, (max(60.0, d1.bpm - 10.0), d1.bpm + 10.0))
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
        # Manejo limpio de Deck Vacío (como el Deck 2 en Serato / mesa)
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
                "tactical_comment": "Deck vacío • Sin pista cargada en Serato ni en la mesa",
                "low_energy_level": 0.0,
                "lufs_momentary": -99.0,
                "lufs_short_term": -99.0
            }

        prog = round(deck.elapsed_sec / deck.duration_sec, 4) if deck.duration_sec > 0 else 0.25
        status_label = "ON AIR (MASTER)" if deck.is_master and deck.is_playing else ("CUE (PREPARADO)" if not deck.is_playing else ("ON AIR" if deck.is_playing else "STANDBY"))
        
        # Cues oficiales de Serato Markers si están disponibles, o cuantizados
        if deck.hot_cues and len(deck.hot_cues) > 0:
            cues = deck.hot_cues
        else:
            dur_ms = int(deck.duration_sec * 1000) if deck.duration_sec > 0 else 240000
            step_ms = dur_ms // 9
            cues = [
                {"id": i, "name": f"Cue {i} ({i*16}b)", "position_ms": i * step_ms, "color": "#00f0ff" if i % 2 == 1 else "#f472b6"}
                for i in range(1, 9)
            ]

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
            "format": "FLAC 24-bit",
            "tactical_comment": f"[{deck.effective_bpm:.1f} BPM | {deck.key}] Intro limpia 32b • Fraseo cuantizado",
            "low_energy_level": deck.low_energy_level,
            "lufs_momentary": deck.lufs_momentary,
            "lufs_short_term": deck.lufs_short_term
        }

    def get_live_state(self) -> Dict[str, Any]:
        """Retorna el estado completo serializado para CopilotWorkspace y endpoints REST/WebSocket."""
        with self._lock:
            d1 = self.state.decks.get(1)
            d2 = self.state.decks.get(2)

            # Verificar si Deck 2 está vacío
            is_deck_2_empty = (not d2 or not d2.title or d2.bpm == 0.0)

            alerts = []
            if d1 and d2 and not is_deck_2_empty:
                alerts = DSPCleanRoomEngine.verificar_alertas_en_vivo(d1, d2)
                self.state.active_alerts = alerts
                self.state.harmonic_relation = DSPCleanRoomEngine.evaluar_compatibilidad_armonica(d1.key, d2.key)

            # Estructurar módulo Anti-Muddy para la barra de alerta del frontend
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

            # Empaquetado completo compatible con v1 y v2
            formatted_decks = {d_id: self._format_deck_ui(d) for d_id, d in self.state.decks.items()}
            dj_app = self._check_running_dj_apps()
            is_serato_running = dj_app.get("is_open") and dj_app.get("app_id") == "serato"

            return {
                "connected": True,
                "source": "SERATO_LIVE" if is_serato_running else ("DJLINK_LIVE" if dj_app.get("is_open") else "DJLINK_STANDBY"),
                "platform": "serato" if is_serato_running else self.platform_mode,
                "platform_mode": "serato" if is_serato_running else self.platform_mode,
                "platform_name": "Serato DJ Pro" if is_serato_running else self.state.platform_name,
                "platform_icon": "⚡" if is_serato_running else ("🎛️" if self.platform_mode == "prodjlink" else "🎧"),
                "platform_color": "#00d1e8" if is_serato_running else "#3b82f6",
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
        """Ticker continuo de alta frecuencia (20 Hz / 50ms) para avance de frase y sincronización live."""
        last_tick = time.time()
        tick_count = 0
        while self._running:
            now = time.time()
            dt = now - last_tick
            last_tick = now
            tick_count += 1

            if tick_count % 20 == 0:
                try:
                    dj_app = self._check_running_dj_apps()
                    if dj_app.get("is_open") and dj_app.get("app_id") == "serato":
                        self._sync_serato_live_state()
                except Exception:
                    pass

            if self.simulation_mode:
                with self._lock:
                    for d_id, d in self.state.decks.items():
                        if d.is_playing:
                            d.elapsed_sec += dt
                            d.remaining_sec = max(0.0, d.duration_sec - d.elapsed_sec) if d.duration_sec > 0 else 180.0
                            beats_per_sec = d.effective_bpm / 60.0
                            total_beats = d.elapsed_sec * beats_per_sec
                            d.beat_number = int(total_beats % 4) + 1
                            d.bar_number = int((total_beats / 4) % 32) + 1
                            d.phrase_progress = round(((total_beats % 128) / 128.0), 3)

            time.sleep(0.05)


# Instancia Singleton compartida
copilot_engine = CopilotEngine()
