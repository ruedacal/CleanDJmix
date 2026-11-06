import os
import signal
import subprocess
import threading
from typing import Optional, Callable, Dict, Any
from application.stream_service import AudioStreamService

class AudioPlayerDeck:
    """Deck de preescucha profesional optimizado para macOS CoreAudio."""

    def __init__(self, stream_service: Optional[AudioStreamService] = None):
        self.stream_service = stream_service or AudioStreamService()
        self._proc: Optional[subprocess.Popen] = None
        self._is_paused = False
        self._current_track: Optional[Dict[str, Any]] = None
        self._volume: float = 1.0  # 0.0 a 1.0 (afplay soporta factor de escala)
        self._lock = threading.Lock()
        self._worker_thread: Optional[threading.Thread] = None

        # Callback para la UI: callback(estado, track) -> estado: "loading", "playing", "paused", "stopped", "error"
        self.on_state_change: Optional[Callable[[str, Dict[str, Any]], None]] = None

    def _notify(self, estado: str):
        if self.on_state_change and self._current_track:
            try:
                self.on_state_change(estado, self._current_track)
            except Exception:
                pass

    def is_playing(self) -> bool:
        with self._lock:
            return self._proc is not None and self._proc.poll() is None and not self._is_paused

    def is_paused(self) -> bool:
        with self._lock:
            return self._proc is not None and self._is_paused

    def get_current_track(self) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._current_track

    def play_track(self, track: Dict[str, Any]):
        """Descarga en hilo secundario y arranca reproduccion instantanea."""
        self.stop()

        with self._lock:
            self._current_track = track
            self._is_paused = False
            self._notify("loading")

        def _runner():
            archivo = self.stream_service.obtener_audio_track(track)
            with self._lock:
                # Si el usuario seleccionó otro track mientras se descargaba este, descartar
                if self._current_track != track:
                    return

                if not archivo or not os.path.exists(archivo):
                    self._notify("error")
                    return

                try:
                    # Iniciar afplay desacoplado
                    cmd = ["afplay", "-v", str(self._volume), archivo]
                    self._proc = subprocess.Popen(
                        cmd,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL
                    )
                    self._is_paused = False
                    self._notify("playing")
                except Exception as e:
                    print(f"[PlayerDeck Error] No se pudo invocar afplay: {e}")
                    self._notify("error")

        self._worker_thread = threading.Thread(target=_runner, daemon=True)
        self._worker_thread.start()

    def pause(self):
        with self._lock:
            if self._proc and self._proc.poll() is None and not self._is_paused:
                try:
                    os.kill(self._proc.pid, signal.SIGSTOP)
                    self._is_paused = True
                    self._notify("paused")
                except Exception:
                    pass

    def unpause(self):
        with self._lock:
            if self._proc and self._proc.poll() is None and self._is_paused:
                try:
                    os.kill(self._proc.pid, signal.SIGCONT)
                    self._is_paused = False
                    self._notify("playing")
                except Exception:
                    pass

    def toggle_play_pause(self, track: Optional[Dict[str, Any]] = None):
        with self._lock:
            target_track = track or self._current_track

        if not target_track:
            return

        if self._current_track and target_track.get("titulo") == self._current_track.get("titulo") and target_track.get("artista") == self._current_track.get("artista"):
            if self.is_playing():
                self.pause()
            elif self.is_paused():
                self.unpause()
            else:
                self.play_track(target_track)
        else:
            self.play_track(target_track)

    def stop(self):
        with self._lock:
            if self._proc:
                try:
                    if self._is_paused:
                        os.kill(self._proc.pid, signal.SIGCONT)
                    self._proc.terminate()
                    self._proc.wait(timeout=0.2)
                except Exception:
                    try:
                        self._proc.kill()
                    except Exception:
                        pass
                self._proc = None

            self._is_paused = False
            self._notify("stopped")

    def set_volume(self, vol: float):
        self._volume = max(0.0, min(2.0, float(vol)))
