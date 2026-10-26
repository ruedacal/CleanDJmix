import pytest
from unittest.mock import MagicMock, patch
from services.shazam_service import ShazamRecognitionService

def test_shazam_normalizar_resultado_vacio():
    service = ShazamRecognitionService()
    res = service.normalizar_resultado({})
    assert res["status"] == "no_match"

def test_shazam_normalizar_resultado_sin_matches():
    service = ShazamRecognitionService()
    res = service.normalizar_resultado({"matches": [], "track": None})
    assert res["status"] == "no_match"

def test_shazam_normalizar_resultado_valido():
    service = ShazamRecognitionService()
    dummy_raw = {
        "matches": [{"id": "123"}],
        "track": {
            "title": "Strobe",
            "subtitle": "deadmau5",
            "isrc": "USUL10900224",
            "url": "https://www.shazam.com/track/40375624/strobe",
            "genres": {"primary": "Dance"},
            "images": {
                "coverarthq": "https://example.com/strobe_hq.jpg",
                "coverart": "https://example.com/strobe.jpg"
            },
            "hub": {
                "actions": [
                    {"type": "applemusicplay", "id": "12345"},
                    {"type": "uri", "uri": "https://example.com/preview.m4a"}
                ]
            },
            "sections": [
                {
                    "type": "SONG",
                    "metadata": [
                        {"title": "Album", "text": "For Lack of a Better Name"},
                        {"title": "Label", "text": "mau5trap"},
                        {"title": "Released", "text": "2009"}
                    ]
                }
            ]
        }
    }
    norm = service.normalizar_resultado(dummy_raw)
    assert norm["status"] == "ok"
    assert norm["title"] == "Strobe"
    assert norm["artist"] == "deadmau5"
    assert norm["album"] == "For Lack of a Better Name"
    assert norm["genre"] == "Dance"
    assert norm["year"] == "2009"
    assert norm["isrc"] == "USUL10900224"
    assert norm["cover"] == "https://example.com/strobe_hq.jpg"
    assert norm["preview_url"] == "https://example.com/preview.m4a"
    assert norm["apple_music_url"] == "https://music.apple.com/song/12345"
    assert "deadmau5" in norm["spotify_query"]

def test_shazam_reconocer_archivo_inexistente():
    service = ShazamRecognitionService()
    res = service.reconocer_archivo("/path/inexistente/random_track.mp3")
    assert res["status"] == "error"
    assert "Archivo no encontrado" in res["msg"]

def test_shazam_reconocer_base64_invalido():
    service = ShazamRecognitionService()
    res = service.reconocer_base64("not_a_valid_base64!@#$")
    assert res["status"] == "error"

def test_shazam_cache_consecutivo():
    service = ShazamRecognitionService()
    dummy_bytes = b"RIFF" + b"\x00" * 400
    h = service._obtener_audio_hash(dummy_bytes)
    assert h is not None

    assert service._consultar_cache(h) is None
    dummy_res = {"status": "ok", "title": "Test Title", "artist": "Test Artist"}
    service._guardar_cache(h, dummy_res)

    cached = service._consultar_cache(h)
    assert cached is not None
    assert cached["status"] == "ok"
    assert cached["title"] == "Test Title"
    assert cached.get("de_cache") is True

def test_shazam_rate_limited_breakout():
    service = ShazamRecognitionService()
    with patch.object(service, '_ejecutar_async', return_value={"matches": [], "rate_limited": True}):
        res = service.reconocer_shazamio("dummy_target")
        assert res["status"] == "rate_limited"
        assert "límite de tasa" in res["msg"].lower()

def test_shazam_reconocer_bytes_insuficientes():
    service = ShazamRecognitionService()
    res = service.reconocer_bytes(b"short")
    assert res["status"] == "error"
    assert "insuficientes" in res["msg"]

def test_shazam_hybrid_fallback_audd_with_test_token():
    service = ShazamRecognitionService()
    with patch.object(service, 'reconocer_shazamio', return_value={"status": "no_match"}), \
         patch.object(service, 'reconocer_audd', return_value={"status": "ok", "title": "Fallback Track", "artist": "Artist X"}) as mock_audd:
        with patch('os.path.exists', return_value=True):
            res = service.reconocer_archivo("/path/to/test.mp3", motor="hybrid", audd_token="")
            assert res["status"] == "ok"
            assert res["title"] == "Fallback Track"
            mock_audd.assert_called_once_with("/path/to/test.mp3", audd_token="test")

def test_shazam_grabar_microfono_sistema_success():
    service = ShazamRecognitionService()
    with patch('subprocess.run') as mock_run, \
         patch('os.path.exists', return_value=True), \
         patch('os.path.getsize', return_value=5000), \
         patch.object(service, 'reconocer_archivo', return_value={"status": "ok", "title": "Club Track", "artist": "DJ Victor"}):
        mock_proc = MagicMock()
        mock_proc.returncode = 0
        mock_run.return_value = mock_proc

        res = service.grabar_microfono_sistema(duration_sec=3, motor="hybrid")
        assert res["status"] == "ok"
        assert res["title"] == "Club Track"
        assert res.get("origen_captura") == "hardware_mic"

def test_shazam_grabar_microfono_sistema_failure():
    service = ShazamRecognitionService()
    with patch('subprocess.run') as mock_run, \
         patch('os.path.exists', return_value=False):
        mock_proc = MagicMock()
        mock_proc.returncode = 1
        mock_proc.stderr = "Device not found"
        mock_run.return_value = mock_proc

        res = service.grabar_microfono_sistema(duration_sec=3)
        assert res["status"] == "error"
        assert "No se pudo capturar audio" in res["msg"]
