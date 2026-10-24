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
