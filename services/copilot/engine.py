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
        {"id": "traktor", "name": "Native Instruments Traktor", "icon": "🎚️", "color": "#eab308", "badge": "TRAKTOR"},
        {"id": "simulation", "name": "Simulación de Cabina", "icon": "🧪", "color": "#10b981", "badge": "SIMULADOR"}
    ]

    def __init__(self):
        self.state = LiveSessionState()
        self._lock = threading.Lock()
        self.simulation_mode = True
        self.platform_mode = "prodjlink"
        self.serato_db_path = os.path.expanduser("~/Music/_Serato_")
        self.loaded_library_tracks: List[Dict[str, Any]] = []

        # Inicializar los decks con pistas de alta fidelidad para demo / live
        self.state.decks = {
            1: DeckState(
                deck_id=1,
                title="Scream",
                artist="Michael Jackson",
                bpm=151.73,
                effective_bpm=151.73,
                key="9A",
                key_name="E minor",
                genre="Pop",
                subgenre="Desconocido",
                is_master=True,
                is_playing=True,
                duration_sec=278.0,
                elapsed_sec=84.0,
                energy=55,
                danceability=82,
                low_energy_level=0.45
            ),
            2: DeckState(
                deck_id=2,
                title="Your Touch",
                artist="Saâda Bonaire",
                bpm=110.0,
                effective_bpm=110.0,
                key="6B",
                key_name="Bb major",
                genre="Pop",
                subgenre="Desconocido",
                is_master=False,
                is_playing=False,
                duration_sec=255.0,
                elapsed_sec=32.0,
                energy=45,
                danceability=78,
                low_energy_level=0.35
            ),
            3: DeckState(deck_id=3, bpm=128.0, key="8A", is_playing=False),
            4: DeckState(deck_id=4, bpm=130.0, key="7A", is_playing=False)
        }

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

    def _format_deck_ui(self, deck: DeckState) -> Dict[str, Any]:
        """Formatea un deck con los campos exigidos por CopilotWorkspace en React."""
        prog = round(deck.elapsed_sec / deck.duration_sec, 4) if deck.duration_sec > 0 else 0.25
        status_label = "ON AIR (MASTER)" if deck.is_master and deck.is_playing else ("ON AIR" if deck.is_playing else "STANDBY")
        
        # Cues cuantizados
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

            alerts = []
            if d1 and d2:
                alerts = DSPCleanRoomEngine.verificar_alertas_en_vivo(d1, d2)
                self.state.active_alerts = alerts
                self.state.harmonic_relation = DSPCleanRoomEngine.evaluar_compatibilidad_armonica(d1.key, d2.key)

            # Estructurar módulo Anti-Muddy para la barra de alerta del frontend
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

            return {
                "connected": True,
                "source": "PRODJLINK_LIVE" if self.platform_mode == "prodjlink" and not self.simulation_mode else "SIMULATION_MODE",
                "platform": self.platform_mode,
                "platform_mode": self.platform_mode,
                "platform_name": self.state.platform_name,
                "platform_icon": "🎛️" if self.platform_mode == "prodjlink" else "🎧",
                "platform_color": "#3b82f6",
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
        """Ticker continuo de alta frecuencia (20 Hz / 50ms) para avance de frase y simulación."""
        last_tick = time.time()
        while self._running:
            now = time.time()
            dt = now - last_tick
            last_tick = now

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
