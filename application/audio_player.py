import os
import signal
import subprocess
from typing import Optional

class MacAudioPlayer:
    """Gestiona la reproducción de audio nativa en macOS vía CoreAudio (afplay)."""
    
    def __init__(self):
        self._proc: Optional[subprocess.Popen] = None
        self._is_playing: bool = False
        self._current_path: Optional[str] = None

    @property
    def is_playing(self) -> bool:
        return self._is_playing

    @property
    def current_file(self) -> Optional[str]:
        return self._current_path

    def play(self, file_path: str) -> bool:
        if not os.path.exists(file_path) or os.path.getsize(file_path) < 1000:
            return False

        self.stop()
        try:
            self._proc = subprocess.Popen(["afplay", file_path])
            self._current_path = file_path
            self._is_playing = True
            return True
        except Exception as e:
            print(f"[AudioPlayer Error] {e}")
            self._is_playing = False
            return False

    def pause(self) -> None:
        if self._proc and self._proc.poll() is None and self._is_playing:
            try:
                os.kill(self._proc.pid, signal.SIGSTOP)
                self._is_playing = False
            except Exception:
                pass

    def resume(self) -> None:
        if self._proc and self._proc.poll() is None and not self._is_playing:
            try:
                os.kill(self._proc.pid, signal.SIGCONT)
                self._is_playing = True
            except Exception:
                pass

    def stop(self) -> None:
        if self._proc:
            try:
                self._proc.terminate()
                self._proc.kill()
            except Exception:
                pass
            self._proc = None
        self._is_playing = False
        self._current_path = None
