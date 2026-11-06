import os
import pytest
from unittest.mock import MagicMock
from application.spotify_download_service import SpotifyDownloadService

def test_escanear_enlace_url_vacia():
    cb = MagicMock()
    service = SpotifyDownloadService()
    res = service.escanear_enlace("", callback_log=cb)
    assert res == []
    cb.assert_called_with("[!] URL vacia proporcionada.", "error")

def test_escanear_enlace_exitoso():
    mock_adapter = MagicMock()
    mock_adapter.escanear_lista.return_value = [
        {"titulo": "Space Date", "artista": "Adam Beyer", "duracion": "06:30"}
    ]
    cb = MagicMock()
    service = SpotifyDownloadService(downloader_adapter=mock_adapter)

    res = service.escanear_enlace("https://open.spotify.com/track/123", callback_log=cb)
    assert len(res) == 1
    assert res[0]["titulo"] == "Space Date"
    assert cb.call_count >= 2

def test_escanear_enlace_excepcion_adapter():
    mock_adapter = MagicMock()
    mock_adapter.escanear_lista.side_effect = RuntimeError("Error conexion red")
    cb = MagicMock()
    service = SpotifyDownloadService(downloader_adapter=mock_adapter)

    res = service.escanear_enlace("https://open.spotify.com/playlist/xyz", callback_log=cb)
    assert res == []
    assert any("Error durante el escaneo" in call[0][0] for call in cb.call_args_list)

def test_descargar_seleccion_lista_vacia(tmp_path):
    cb = MagicMock()
    service = SpotifyDownloadService()
    res = service.descargar_seleccion([], str(tmp_path), callback_log=cb)
    assert res == []
    cb.assert_called_with("[!] No hay pistas seleccionadas para descargar.", "error")

def test_descargar_seleccion_directorio_invalido():
    cb = MagicMock()
    service = SpotifyDownloadService()
    res = service.descargar_seleccion(["dummy_song"], "/ruta/inexistente/xyz", callback_log=cb)
    assert res == []
    assert any("Directorio de destino invalido" in call[0][0] for call in cb.call_args_list)

def test_descargar_seleccion_sin_archivos_resultantes(tmp_path):
    mock_adapter = MagicMock()
    mock_adapter.descargar_canciones_seleccionadas.return_value = []
    cb = MagicMock()
    service = SpotifyDownloadService(downloader_adapter=mock_adapter)

    res = service.descargar_seleccion(["song1"], str(tmp_path), callback_log=cb)
    assert res == []
    assert any("no produjo nuevos archivos" in call[0][0] for call in cb.call_args_list)

def test_descargar_seleccion_exitosa_con_autoclasificar(tmp_path):
    fichero1 = tmp_path / "Enrico Sangiuliano - Astral Projection.mp3"
    fichero1.touch()
    fichero2 = tmp_path / "TrackSinSeparador.mp3"
    fichero2.touch()

    mock_adapter = MagicMock()
    mock_adapter.descargar_canciones_seleccionadas.return_value = [str(fichero1), str(fichero2)]
    
    mock_taxonomy = MagicMock()
    cb = MagicMock()

    service = SpotifyDownloadService(
        downloader_adapter=mock_adapter,
        taxonomy_service=mock_taxonomy
    )

    res = service.descargar_seleccion(
        canciones=["obj1", "obj2"],
        directorio_destino=str(tmp_path),
        callback_log=cb,
        auto_clasificar=True,
        modo_seguro=False
    )

    assert len(res) == 2
    assert mock_taxonomy.organizar_pista.call_count == 2
    # Verificar que el artista y titulo se extrajeron correctamente
    call_args = mock_taxonomy.organizar_pista.call_args_list[0][1]
    assert call_args["artista"] == "Enrico Sangiuliano"
    assert call_args["titulo"] == "Astral Projection"

def test_descargar_seleccion_error_en_autoclasificar(tmp_path):
    fichero = tmp_path / "Test - Track.mp3"
    fichero.touch()

    mock_adapter = MagicMock()
    mock_adapter.descargar_canciones_seleccionadas.return_value = [str(fichero)]
    
    mock_taxonomy = MagicMock()
    mock_taxonomy.organizar_pista.side_effect = PermissionError("Permiso denegado")
    cb = MagicMock()

    service = SpotifyDownloadService(
        downloader_adapter=mock_adapter,
        taxonomy_service=mock_taxonomy
    )

    res = service.descargar_seleccion(
        canciones=["obj1"],
        directorio_destino=str(tmp_path),
        callback_log=cb,
        auto_clasificar=True
    )

    assert len(res) == 1
    assert any("Error auto-clasificando" in call[0][0] for call in cb.call_args_list)

# -------------------------------------------------------------
# PRUEBAS DEL MOTOR CONCURRENTE PIPELINE ANTI 409/429
# -------------------------------------------------------------

def test_solicitar_descarga_segura_lock_y_recuperacion(monkeypatch):
    from infrastructure.spotify_flac_ingest import SpotifyFlacIngestService
    svc = SpotifyFlacIngestService()

    call_count = 0
    def mock_solicitar(music_url, quality="FLAC_HIRES"):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return None, 409, "Conflicto simulado"
        return "mock_res_obj", 200, "OK"

    monkeypatch.setattr(svc, "_solicitar_descarga_superflac", mock_solicitar)
    monkeypatch.setattr(svc, "_inicializar_sesion_superflac", lambda force_refresh: None)
    monkeypatch.setattr("time.sleep", lambda s: None)

    res, status, msg = svc._solicitar_descarga_segura("https://apple.com/test", quality="FLAC_HIRES")
    assert status == 200
    assert res == "mock_res_obj"
    assert call_count == 2  # Reintentó exitosamente tras el 409

def test_download_service_ejecutar_lote_concurrente(tmp_path, monkeypatch):
    from services.download_service import DownloadService
    svc = DownloadService()

    # Mock de ingesta para simular descarga inmediata
    def mock_descarga(meta, target_dir):
        track_path = os.path.join(target_dir, f"{meta.get('title')}.flac")
        with open(track_path, "wb") as f:
            f.write(b"fLaC" + b"\x00" * 4096)
        return {"status": "ok", "path": track_path}

    monkeypatch.setattr(svc.ingest_service, "descargar_e_inyectar_flac", mock_descarga)

    mock_eel = MagicMock()
    mock_audio = MagicMock()
    mock_audio.analizar_espectro_fft.return_value = {"cutoff_khz": 22.05, "status": "Lossless FLAC"}

    tracks = [
        {"id": "t1", "title": "Track One", "artist": "Artist 1"},
        {"id": "t2", "title": "Track Two", "artist": "Artist 2"}
    ]

    import time
    res = svc.ejecutar_lote_descarga(tracks, "flac", str(tmp_path), mock_audio, mock_eel)
    assert res["status"] == "iniciado"

    # Esperar a que el worker finalice
    time.sleep(0.5)

    assert os.path.exists(os.path.join(str(tmp_path), "Track One.flac"))
    assert os.path.exists(os.path.join(str(tmp_path), "Track Two.flac"))
    assert mock_eel.actualizar_estado_descarga.call_count >= 2
