"""
Pruebas exhaustivas para AudioAdapter y SpotifyDownloaderAdapter (>90% cobertura).
"""

import os
import json
import pytest
import numpy as np
from unittest.mock import patch, MagicMock
from infrastructure.adapters import AudioAdapter, SpotifyDownloaderAdapter

# ==========================================
# AUDIO ADAPTER
# ==========================================

def test_audio_obtener_metadatos_id3(tmp_path):
    p = tmp_path / "Tiesto - Adagio For Strings.mp3"
    p.touch()
    art, tit = AudioAdapter.obtener_metadatos_id3(str(p), p.name)
    assert art == "Tiesto"
    assert tit == "Adagio For Strings"

    p2 = tmp_path / "Future Trance Vol 1.mp3"
    p2.touch()
    art2, tit2 = AudioAdapter.obtener_metadatos_id3(str(p2), p2.name)
    assert art2 == "Various Artists"

    p3 = tmp_path / "desconocido.mp3"
    p3.touch()
    art3, tit3 = AudioAdapter.obtener_metadatos_id3(str(p3), p3.name)
    assert art3 == "VRC_MISSING"

    with patch("infrastructure.adapters.EasyID3") as mock_id3:
        mock_id3.return_value.get.side_effect = lambda k, default: ["TagValue"] if k in ['artist', 'title'] else default
        art4, tit4 = AudioAdapter.obtener_metadatos_id3(str(p), p.name)
        assert art4 == "TagValue"
        assert tit4 == "TagValue"

def test_audio_buscar_discogs():
    with patch("requests.get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "results": [{
                "year": 2005,
                "style": ["Trance"],
                "title": "Armin - Shivers"
            }]
        }
        mock_get.return_value = mock_resp
        año, estilos, art, tit = AudioAdapter.buscar_discogs("Armin", "Shivers")
        assert año == 2005
        assert "trance" in estilos

    # Caso respuesta sin guión en title
    with patch("requests.get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "results": [{"year": 2010, "style": [], "title": "SinSeparador"}]
        }
        mock_get.return_value = mock_resp
        año, estilos, art, tit = AudioAdapter.buscar_discogs("Artista", "Pista")
        assert art == "Artista"

    # Excepción
    with patch("requests.get", side_effect=Exception("Timeout")):
        año, estilos, art, tit = AudioAdapter.buscar_discogs("A", "B")
        assert año == 2026
        assert estilos == []

def test_audio_analizar_acustica(tmp_path):
    p = tmp_path / "sample.mp3"
    p.touch()
    dummy_y = np.zeros(22050)
    with patch("librosa.load", return_value=(dummy_y, 22050)), \
         patch("librosa.effects.trim", return_value=(dummy_y, None)), \
         patch("librosa.beat.beat_track", return_value=(np.array([138.0]), None)), \
         patch("librosa.feature.rms", return_value=np.array([[0.05]])), \
         patch("librosa.onset.onset_strength", return_value=np.array([0.1, 0.2])), \
         patch("librosa.feature.mfcc", return_value=np.array([[10.0]])), \
         patch("librosa.feature.zero_crossing_rate", return_value=np.array([[0.02]])), \
         patch("librosa.feature.spectral_centroid", return_value=np.array([[1200.0]])):
        bpm, energia, groove, vocal, zcr, centroide = AudioAdapter.analizar_acustica(str(p))
        assert bpm == 138.0

    with patch("librosa.load", side_effect=Exception("Error")):
        bpm_fb, _, _, _, _, _ = AudioAdapter.analizar_acustica(str(p))
        assert bpm_fb == 128.0

def test_audio_rescate_shazam(tmp_path):
    p = tmp_path / "audio.mp3"
    p.touch()
    with patch("infrastructure.adapters.Shazam") as mock_shazam:
        instance = mock_shazam.return_value
        async def mock_recognize(ruta):
            return {"track": {"subtitle": "Paul van Dyk", "title": "For An Angel"}}
        instance.recognize_song.side_effect = mock_recognize
        art, tit = AudioAdapter.rescate_shazam(str(p))
        assert art == "Paul van Dyk"

    with patch("infrastructure.adapters.Shazam", side_effect=Exception("Error")):
        art, tit = AudioAdapter.rescate_shazam(str(p))
        assert art == "VRC_MISSING"

def test_audio_actualizar_fichero_y_reporte(tmp_path):
    p = tmp_path / "test.mp3"
    p.touch()

    # Guardar con éxito
    with patch("infrastructure.adapters.MutagenFile") as mock_mf:
        mock_audio = MagicMock()
        mock_mf.return_value = mock_audio
        nombre = AudioAdapter.actualizar_fichero(str(p), "DJ Tiesto", "Traffic", 2003, 140, modo_seguro=False)
        assert "DJ Tiesto - Traffic.mp3" in nombre

    # Excepción al guardar tags
    with patch("infrastructure.adapters.MutagenFile", side_effect=Exception("Write error")):
        nombre = AudioAdapter.actualizar_fichero(str(p), "DJ Tiesto", "Traffic", 2003, 140, modo_seguro=False)
        assert "DJ Tiesto - Traffic.mp3" in nombre

    # Missing
    nombre_miss = AudioAdapter.actualizar_fichero(str(p), "VRC_MISSING", "VRC_MISSING", 2026, 130, modo_seguro=True)
    assert "VRC_Unidentified_Track_130BPM.mp3" in nombre_miss

    # CSV éxito
    datos = [{"artista": "T", "titulo": "T", "bpm": 140, "anio": 2003, "genero": "Tr", "subgenero": "H", "ruta_final": str(p)}]
    csv_file = AudioAdapter.exportar_informe_csv(datos, str(tmp_path))
    assert os.path.exists(csv_file)

    # CSV error
    with patch("builtins.open", side_effect=Exception("Disk full")):
        assert AudioAdapter.exportar_informe_csv(datos, str(tmp_path)) is None

# ==========================================
# SPOTIFY DOWNLOADER ADAPTER
# ==========================================

def test_limpiar_url_variantes():
    url1 = "https://open.spotify.com/intl-es/playlist/37i9dQZF1DXcBWIGoYBM5M?si=999"
    assert SpotifyDownloaderAdapter._limpiar_url(url1) == "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
    url_dup = "https://open.spotify.com/album/123https://open.spotify.com/album/123"
    assert SpotifyDownloaderAdapter._limpiar_url(url_dup) == "https://open.spotify.com/album/123"

def test_escanear_sin_credenciales():
    with patch.object(SpotifyDownloaderAdapter, '_obtener_cliente_spotify', return_value=None):
        cb = MagicMock()
        res = SpotifyDownloaderAdapter.escanear_lista("https://open.spotify.com/track/123", callback_log=cb)
        assert res == []
        cb.assert_called_once()

def test_escanear_playlist_con_paginacion():
    mock_sp = MagicMock()
    mock_sp.playlist_items.return_value = {
        "items": [{
            "track": {
                "name": "Song 1",
                "artists": [{"name": "Artist 1"}],
                "album": {"name": "Album 1", "images": [{"url": "http://img.jpg"}], "release_date": "2024-05-01"},
                "duration_ms": 120000
            }
        }],
        "next": "url_siguiente"
    }
    mock_sp.next.return_value = {
        "items": [{
            "track": {
                "name": "Song 2",
                "artists": [{"name": "Artist 2"}],
                "album": {"name": "Album 2", "images": []},
                "duration_ms": 150000
            }
        }],
        "next": None
    }
    cb = MagicMock()
    with patch.object(SpotifyDownloaderAdapter, '_obtener_cliente_spotify', return_value=mock_sp):
        res = SpotifyDownloaderAdapter.escanear_lista("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M", callback_log=cb)
        assert len(res) == 2
        assert res[0]["titulo"] == "Song 1"
        assert res[1]["titulo"] == "Song 2"

def test_escanear_artista_y_album():
    mock_sp = MagicMock()
    # Artista
    mock_sp.artist_albums.return_value = {
        "items": [{"id": "alb-1", "name": "Best Hits", "images": [{"url": "http://img.jpg"}], "release_date": "2025-01-01"}]
    }
    mock_sp.album_tracks.return_value = {
        "items": [{"id": "trk-1", "name": "Hit", "artists": [{"name": "Star"}], "duration_ms": 180000}]
    }
    with patch.object(SpotifyDownloaderAdapter, '_obtener_cliente_spotify', return_value=mock_sp):
        res_art = SpotifyDownloaderAdapter.escanear_lista("https://open.spotify.com/artist/23zJj2W0TQ0SvF4Fwo7mZK")
        assert len(res_art) == 1
        assert res_art[0]["titulo"] == "Hit"

    # Álbum
    mock_sp.album.return_value = {
        "name": "Album X", "release_date": "2023-01-01", "images": [],
        "tracks": {"items": [{"name": "Track A", "artists": [{"name": "Band"}], "duration_ms": 200000}]}
    }
    with patch.object(SpotifyDownloaderAdapter, '_obtener_cliente_spotify', return_value=mock_sp):
        res_alb = SpotifyDownloaderAdapter.escanear_lista("https://open.spotify.com/album/123")
        assert len(res_alb) == 1

def test_escanear_track_individual():
    mock_sp = MagicMock()
    mock_sp.track.return_value = {
        "name": "Solo Track",
        "artists": [{"name": "Solo Artist"}],
        "album": {"name": "Single", "images": [], "release_date": "2024"},
        "duration_ms": 100000
    }
    with patch.object(SpotifyDownloaderAdapter, '_obtener_cliente_spotify', return_value=mock_sp):
        res = SpotifyDownloaderAdapter.escanear_lista("https://open.spotify.com/track/456")
        assert len(res) == 1
        assert res[0]["titulo"] == "Solo Track"

def test_escanear_error_general():
    mock_sp = MagicMock()
    mock_sp.playlist_items.side_effect = Exception("Crash")
    cb = MagicMock()
    with patch.object(SpotifyDownloaderAdapter, '_obtener_cliente_spotify', return_value=mock_sp):
        res = SpotifyDownloaderAdapter.escanear_lista("https://open.spotify.com/playlist/123", callback_log=cb)
        assert res == []

def test_descargar_canciones(tmp_path):
    destino = str(tmp_path / "musica")
    track_ok = {"artista": "A", "titulo": "B", "year": "2024", "cover_url": "http://img.jpg"}
    track_sin_cover = {"artista": "C", "titulo": "D", "year": "2024", "cover_url": ""}
    cb = MagicMock()

    with patch("yt_dlp.YoutubeDL") as mock_ydl, \
         patch("requests.get") as mock_req, \
         patch("infrastructure.adapters.EasyID3"), \
         patch("infrastructure.adapters.ID3"):

        def side_dl(*args, **kwargs):
            os.makedirs(destino, exist_ok=True)
            for nombre in ["A - B.mp3", "C - D.mp3"]:
                with open(os.path.join(destino, nombre), "w") as f:
                    f.write("audio")

        mock_ydl.return_value.__enter__.return_value.download.side_effect = side_dl
        mock_req.return_value.status_code = 200
        mock_req.content = b"fake_img"

        archivos = SpotifyDownloaderAdapter.descargar_canciones_seleccionadas([track_ok, track_sin_cover], destino, callback_log=cb)
        assert len(archivos) == 2

    # Error en descarga
    with patch("yt_dlp.YoutubeDL") as mock_ydl2:
        mock_ydl2.return_value.__enter__.return_value.download.side_effect = Exception("YT Down")
        res_fail = SpotifyDownloaderAdapter.descargar_canciones_seleccionadas([track_ok], destino, callback_log=cb)
        assert len(res_fail) == 0
