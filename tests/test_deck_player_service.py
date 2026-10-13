import time
from unittest.mock import MagicMock
from application.deck_player_service import DeckPlayerService, DeckState

def test_deck_play_sin_pista():
    cb_log = MagicMock()
    service = DeckPlayerService(player=MagicMock(), stream_service=MagicMock())
    service.play_o_pausar(on_log=cb_log)
    cb_log.assert_called_with("[!] Selecciona primero un track pulsando Cargar.", "error")

def test_deck_pausar_cuando_reproduce():
    mock_player = MagicMock()
    mock_player.is_playing = True
    cb_state = MagicMock()

    service = DeckPlayerService(player=mock_player, stream_service=MagicMock())
    service.current_item = {"artista": "Test", "titulo": "Track"}
    service.state = DeckState.PLAYING

    service.play_o_pausar(forzar_play=False, on_state_change=cb_state)

    mock_player.pause.assert_called_once()
    assert service.state == DeckState.PAUSED
    cb_state.assert_called_with(DeckState.PAUSED)

def test_deck_reanudar_cuando_pausado():
    mock_player = MagicMock()
    mock_player.is_playing = False
    mock_player.current_file = "/tmp/audio.mp3"
    cb_state = MagicMock()

    service = DeckPlayerService(player=mock_player, stream_service=MagicMock())
    service.current_item = {"artista": "Test", "titulo": "Track"}
    service.state = DeckState.PAUSED

    service.play_o_pausar(forzar_play=False, on_state_change=cb_state)

    mock_player.resume.assert_called_once()
    assert service.state == DeckState.PLAYING
    cb_state.assert_called_with(DeckState.PLAYING)

def test_deck_reproducir_exito():
    mock_player = MagicMock()
    mock_player.is_playing = False
    mock_player.current_file = None
    mock_player.play.return_value = True

    mock_stream = MagicMock()
    mock_stream.obtener_audio_track.return_value = "/tmp/stream.mp3"

    cb_state = MagicMock()
    cb_log = MagicMock()

    service = DeckPlayerService(player=mock_player, stream_service=mock_stream)
    item = {"artista": "Adam Beyer", "titulo": "Your Mind"}

    service.cargar_pista(item, on_state_change=cb_state, on_log=cb_log, auto_play=True)

    time.sleep(0.1)  # Esperar a que el worker daemon termine
    mock_player.play.assert_called_with("/tmp/stream.mp3")
    assert service.state == DeckState.PLAYING
    assert any("Reproduciendo en Deck" in call[0][0] for call in cb_log.call_args_list)

def test_deck_reproducir_fallo_stream():
    mock_player = MagicMock()
    mock_player.is_playing = False
    mock_player.current_file = None

    mock_stream = MagicMock()
    mock_stream.obtener_audio_track.side_effect = Exception("Conexion perdida")

    cb_state = MagicMock()
    cb_log = MagicMock()

    service = DeckPlayerService(player=mock_player, stream_service=mock_stream)
    item = {"artista": "Adam Beyer", "titulo": "Your Mind"}

    service.cargar_pista(item, on_state_change=cb_state, on_log=cb_log, auto_play=True)

    time.sleep(0.1)
    assert service.state == DeckState.IDLE
    assert any("No se pudo obtener el stream" in call[0][0] for call in cb_log.call_args_list)

def test_deck_detener():
    mock_player = MagicMock()
    cb_state = MagicMock()

    service = DeckPlayerService(player=mock_player, stream_service=MagicMock())
    service.state = DeckState.PLAYING

    service.detener(on_state_change=cb_state)

    mock_player.stop.assert_called_once()
    assert service.state == DeckState.IDLE
    cb_state.assert_called_with(DeckState.IDLE)
