"""
Pruebas exhaustivas para AudioAdapter y SpotifyDownloaderAdapter.
"""

import os
import pytest
import numpy as np
from unittest.mock import patch, MagicMock
from infrastructure.adapters import AudioAdapter, SpotifyDownloaderAdapter

def test_audio_metadatos_id3(tmp_path):
    p = tmp_path / "Tiesto - Lethal Industry.mp3"
    p.touch()
    art, tit = AudioAdapter.obtener_metadatos_id3(str(p), p.name)
    assert art == "Tiesto"
    assert tit == "Lethal Industry"

def test_limpiar_url_spotify():
    url = "https://open.spotify.com/intl-es/artist/23zJj2W0TQ0SvF4Fwo7mZK?si=999"
    limpia = SpotifyDownloaderAdapter._limpiar_url(url)
    assert limpia == "https://open.spotify.com/artist/23zJj2W0TQ0SvF4Fwo7mZK"

def test_escanear_artista_sin_error_403():
    mock_sp = MagicMock()
    mock_sp.artist_albums.return_value = {
        "items": [{"id": "alb1", "name": "Album Test", "images": [{"url": "http://img.jpg"}], "release_date": "2026"}]
    }
    mock_sp.album_tracks.return_value = {
        "items": [{"id": "trk1", "name": "Track Test", "artists": [{"name": "Artista Test"}], "duration_ms": 180000}]
    }
    with patch.object(SpotifyDownloaderAdapter, '_obtener_cliente_spotify', return_value=mock_sp):
        res = SpotifyDownloaderAdapter.escanear_lista("https://open.spotify.com/artist/23zJj2W0TQ0SvF4Fwo7mZK")
        assert len(res) == 1
        assert res[0]["titulo"] == "Track Test"
        assert res[0]["artista"] == "Artista Test"

def test_descargar_canciones_mock(tmp_path):
    mock_track = {"titulo": "Demo", "artista": "DJ", "album": "Single", "year": "2026", "cover_url": ""}
    destino = str(tmp_path / "descargas")
    
    with patch("yt_dlp.YoutubeDL") as mock_ydl:
        def crear_mp3(*args, **kwargs):
            os.makedirs(destino, exist_ok=True)
            with open(os.path.join(destino, "DJ - Demo.mp3"), "w") as f:
                f.write("audio_data")
        
        mock_ydl.return_value.__enter__.return_value.download.side_effect = crear_mp3
        archivos = SpotifyDownloaderAdapter.descargar_canciones_seleccionadas([mock_track], destino)
        assert len(archivos) == 1
        assert os.path.exists(archivos[0])
