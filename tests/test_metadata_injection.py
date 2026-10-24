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

def test_detectar_trim_y_downbeat_silencio(tmp_path):
    import soundfile as sf
    import numpy as np

    wav_file = tmp_path / "silence.wav"
    silence = np.zeros((44100, 2), dtype=np.float32)
    sf.write(str(wav_file), silence, 44100, format="WAV")

    trim_ms, downbeat_ms = AudioProcessorService.detectar_trim_y_downbeat(str(wav_file))
    assert trim_ms == 0.0
    assert downbeat_ms == 0.0

def test_detectar_trim_y_downbeat_synthetic_kick(tmp_path):
    import soundfile as sf
    import numpy as np

    wav_file = tmp_path / "kick.wav"
    # 100 ms of silence (4410 samples at 44.1kHz) followed by kick transient
    data = np.zeros(44100 * 2, dtype=np.float32)
    kick_samples = np.sin(np.linspace(0, 100, 4410)) * 0.9
    data[4410:4410 + 4410] = kick_samples
    sf.write(str(wav_file), data, 44100, format="WAV")

    trim_ms, downbeat_ms = AudioProcessorService.detectar_trim_y_downbeat(str(wav_file))
    assert 90.0 <= trim_ms <= 110.0
    assert downbeat_ms >= trim_ms

def test_detectar_trim_y_downbeat_archivo_inexistente():
    trim_ms, downbeat_ms = AudioProcessorService.detectar_trim_y_downbeat("archivo_no_existente_12345.mp3")
    assert trim_ms == 0.0
    assert downbeat_ms == 0.0

def test_escribir_y_persistir_trim_downbeat_mp3(tmp_path):
    mp3_file = tmp_path / "test_trim.mp3"
    with open(str(mp3_file), "wb") as f:
        f.write(b"\xff\xfb\x90\x64" * 1000)

    meta = {
        "title": "Minimal Acid",
        "artist": "Techno Collective",
        "bpm": "130.00",
        "key": "11A",
        "trim_start_ms": 23.5,
        "first_downbeat_ms": 850.0
    }

    ok = AudioProcessorService.escribir_metadatos_pro(str(mp3_file), meta)
    assert ok is True

    from mutagen.id3 import ID3
    id3 = ID3(str(mp3_file))
    assert id3["TXXX:TRIM_START_MS"].text == ["23.5"]
    assert id3["TXXX:FIRST_DOWNBEAT_MS"].text == ["850.0"]

def test_audit_service_analizar_trim_downbeat(tmp_path):
    import soundfile as sf
    import numpy as np

    wav_file = tmp_path / "test_audit.wav"
    data = np.zeros(44100, dtype=np.float32)
    data[2205:] = np.sin(np.linspace(0, 50, 44100 - 2205)) * 0.8
    sf.write(str(wav_file), data, 44100, format="WAV")

    audit_svc = AuditService()
    res = audit_svc.analizar_trim_downbeat(str(wav_file), track_id=42)
    assert res["status"] == "ok"
    assert res["id"] == 42
    assert "trim_start_ms" in res
    assert "first_downbeat_ms" in res
    assert res["trim_start_ms"] >= 40.0
