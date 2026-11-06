import threading
from enum import Enum
from typing import Optional, Callable, Dict, Any

class DeckState(Enum):
    IDLE = "IDLE"
    LOADING = "LOADING"
    PLAYING = "PLAYING"
    PAUSED = "PAUSED"

class DeckPlayerService:
    """Gestiona el estado y la reproduccion de preescucha DJ de forma desacoplada."""

    def __init__(self, player=None, stream_service=None):
        if player is None:
            from application.audio_player import MacAudioPlayer
            self.player = MacAudioPlayer()
        else:
            self.player = player

        if stream_service is None:
            from application.stream_service import AudioStreamService
            self.stream_service = AudioStreamService()
        else:
            self.stream_service = stream_service

        self.current_item: Optional[Dict[str, Any]] = None
        self.state: DeckState = DeckState.IDLE

    def cargar_pista(
        self,
        item: Dict[str, Any],
        on_state_change: Optional[Callable[[DeckState], None]] = None,
        on_log: Optional[Callable[[str, str], None]] = None,
        auto_play: bool = True
    ) -> None:
        """Carga una pista en el deck e inicia la reproduccion si auto_play es True."""
        self.current_item = item
        if auto_play:
            self.play_o_pausar(forzar_play=True, on_state_change=on_state_change, on_log=on_log)

    def play_o_pausar(
        self,
        forzar_play: bool = False,
        on_state_change: Optional[Callable[[DeckState], None]] = None,
        on_log: Optional[Callable[[str, str], None]] = None
    ) -> None:
        """Controla el flujo de play/pause/resume segun el estado actual."""
        if not self.current_item:
            if on_log:
                on_log("[!] Selecciona primero un track pulsando Cargar.", "error")
            return

        # 1. Si esta reproduciendo y no forzamos play -> pausar
        if getattr(self.player, "is_playing", False) and not forzar_play:
            self.player.pause()
            self.state = DeckState.PAUSED
            if on_state_change:
                on_state_change(self.state)
            return

        # 2. Si estaba pausada con archivo cargado -> reanudar
        if not getattr(self.player, "is_playing", False) and not forzar_play and getattr(self.player, "current_file", None):
            self.player.resume()
            self.state = DeckState.PLAYING
            if on_state_change:
                on_state_change(self.state)
            return

        # 3. Detener previa y resolver stream para reproducir
        self.player.stop()
        self.state = DeckState.LOADING
        if on_state_change:
            on_state_change(self.state)

        def worker():
            file_path = None
            try:
                file_path = self.stream_service.obtener_audio_track(self.current_item)
            except Exception as e:
                if on_log:
                    on_log(f"[!] Error al resolver stream: {e}", "error")

            if file_path and self.player.play(file_path):
                self.state = DeckState.PLAYING
                if on_state_change:
                    on_state_change(self.state)
                if on_log:
                    artista = self.current_item.get("artista", "")
                    titulo = self.current_item.get("titulo", "")
                    on_log(f"▶ Reproduciendo en Deck: {artista} - {titulo}", "success")
            else:
                self.state = DeckState.IDLE
                if on_state_change:
                    on_state_change(self.state)
                if on_log:
                    on_log("[!] No se pudo obtener el stream de audio para este track.", "error")

        threading.Thread(target=worker, daemon=True).start()

    def detener(self, on_state_change: Optional[Callable[[DeckState], None]] = None) -> None:
        """Detiene la reproduccion por completo y vuelve al estado IDLE."""
        if self.player:
            self.player.stop()
        self.state = DeckState.IDLE
        if on_state_change:
            on_state_change(self.state)
