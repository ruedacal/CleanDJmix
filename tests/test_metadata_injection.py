import os
import shutil
import pytest
from infrastructure.audio_processor import AudioProcessorService
from services.audit_service import AuditService

def test_generar_serato_markers2_estructura():
    b64 = AudioProcessorService.generar_serato_markers2(
        duration_ms=240000,
        bpm=128.0,
        cues=[
            {"id": 0, "pos_ms": 100, "name": "Intro Mix Point", "rgb": (6, 182, 212)},
            {"id": 1, "pos_ms": 30000, "name": "Buildup 16 Bars", "rgb": (168, 85, 247)}
        ],
        downbeat_ms=50
    )
    assert b64 is not None
    assert len(b64) > 50
    import base64
    decoded = base64.b64decode(b64)
    assert b"COLOR" in decoded
    assert b"BPMLOCK" in decoded
    assert b"CUE" in decoded

def test_escribir_metadatos_pro_mp3(tmp_path):
    # Crear archivo dummy mp3 con frame sync
    mp3_file = tmp_path / "test_track.mp3"
    with open(str(mp3_file), "wb") as f:
        f.write(b"\xff\xfb\x90\x64" * 1000)

    meta = {
        "title": "Deep Pulse",
        "artist": "Marco Bailey",
        "album": "Materia Records",
        "bpm": "136.00",
        "key": "8A",
        "comment": "Intro 32b • Peak Drop • Outro 64b",
        "genre": "Techno",
        "isrc": "BEM012345678",
        "duration": "06:30"
    }

    ok = AudioProcessorService.escribir_metadatos_pro(str(mp3_file), meta)
    assert ok is True

    from mutagen.id3 import ID3
    id3 = ID3(str(mp3_file))
    assert id3["TIT2"].text == ["Deep Pulse"]
    assert id3["TPE1"].text == ["Marco Bailey"]
    assert id3["TALB"].text == ["Materia Records"]
    assert id3["TBPM"].text == ["136.00"]
    assert id3["TKEY"].text == ["8A"]
    assert id3["COMM::eng"].text == ["Intro 32b • Peak Drop • Outro 64b"]
    assert "GEOB:Serato Markers2" in id3

def test_escribir_metadatos_pro_flac_invalido(tmp_path):
    fake_flac = tmp_path / "fake.flac"
    fake_flac.write_bytes(b"NOT_FLAC_HEADER" * 100)
    meta = {"title": "Test"}
    assert AudioProcessorService.escribir_metadatos_pro(str(fake_flac), meta) is False

def test_inyectar_lote_metadatos(tmp_path):
    audit_svc = AuditService()
    
    # Crear 2 archivos mp3 temporales
    p1 = tmp_path / "track1.mp3"
    p2 = tmp_path / "track2.mp3"
    with open(str(p1), "wb") as f:
        f.write(b"\xff\xfb\x90\x64" * 1000)
    with open(str(p2), "wb") as f:
        f.write(b"\xff\xfb\x90\x64" * 1000)

    tracks = [
        {"path": str(p1), "title": "Track 1", "artist": "Artist 1", "bpm": "128.00", "key": "8A"},
        {"path": str(p2), "title": "Track 2", "artist": "Artist 2", "bpm": "130.00", "key": "11A"}
    ]

    progress_events = []
    def on_progress(pct, msg):
        progress_events.append((pct, msg))

    res = audit_svc.inyectar_lote_metadatos(tracks, on_progress)
    assert res["status"] == "ok"
    assert res["total"] == 2
    assert res["inyectados"] == 2
    assert res["errores"] == 0
    assert len(progress_events) >= 2
