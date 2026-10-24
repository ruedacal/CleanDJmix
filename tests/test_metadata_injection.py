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

def test_escribir_y_persistir_danceability_y_mood_mp3(tmp_path):
    mp3_file = tmp_path / "test_dance_mood.mp3"
    with open(str(mp3_file), "wb") as f:
        f.write(b"\xff\xfb\x90\x64" * 1000)

    meta = {
        "title": "Strobo Hypnotic",
        "artist": "Techno Collective",
        "bpm": "132.00",
        "key": "8A",
        "danceability": 92,
        "mood": "Peak Time",
        "genre": "Techno (Peak Time / Driving)"
    }

    ok = AudioProcessorService.escribir_metadatos_pro(str(mp3_file), meta)
    assert ok is True

    from mutagen.id3 import ID3
    id3 = ID3(str(mp3_file))
    assert id3["TXXX:DANCEABILITY"].text == ["92"]
    assert id3["TXXX:MOOD"].text == ["Peak Time"]
    assert id3["TCON"].text == ["Techno (Peak Time / Driving)"]

def test_analizar_track_avanzado_danceability_y_mood(tmp_path):
    mp3_file = tmp_path / "test_track_calc.mp3"
    with open(str(mp3_file), "wb") as f:
        f.write(b"\xff\xfb\x90\x64" * 1000)

    info = AudioProcessorService.analizar_track_avanzado(str(mp3_file))
    assert "danceability" in info
    assert "mood" in info
    assert 50 <= info["danceability"] <= 100
    assert info["mood"] in ("Peak Time", "Dark", "Euphoric", "Hypnotic", "Raw", "Melancholic")

def test_iniciar_auditoria_con_opts_fft(tmp_path):
    import soundfile as sf
    import numpy as np

    wav_file = tmp_path / "test_flac_ok.wav"
    data = np.zeros(44100 * 2, dtype=np.float32)
    # Sine burst
    data[1000:20000] = np.sin(np.linspace(0, 100, 19000)) * 0.8
    sf.write(str(wav_file), data, 44100, format="WAV")

    audit_svc = AuditService()
    res = audit_svc.iniciar_auditoria(str(tmp_path), opts={"fftLossless": True})
    assert res["total"] >= 1
    track = res["tracks"][0]
    assert "cutoff_khz" in track
    assert "status" in track
    assert "dance" in track
    assert "mood" in track
    assert "cues" in track
    assert len(track["cues"]) == 8

def test_calcular_8_hot_cues_fraseo_estructura():
    # Track estándar de club: 360 segundos (6 min) a 128 BPM con downbeat en 800ms
    cues = AudioProcessorService.calcular_8_hot_cues_fraseo(duration_ms=360000, bpm=128.0, downbeat_ms=800)
    assert len(cues) == 8
    # Pad 1 debe coincidir con el downbeat (Bar 1)
    assert cues[0]["id"] == 1
    assert cues[0]["bar"] == 1
    assert cues[0]["pos_ms"] == 800
    assert "Bar 1" in cues[0]["bar_str"]

    # 1 bar = 4 * (60000/128) = 1875 ms. 16 bars = 30000 ms.
    # Pad 2 debe ser Bar 17 (+16 bars = 30000ms -> 30800ms)
    assert cues[1]["id"] == 2
    assert cues[1]["bar"] == 17
    assert cues[1]["pos_ms"] == 30800

    # Pad 3 debe ser Bar 33 (+32 bars = 60000ms -> 60800ms)
    assert cues[2]["id"] == 3
    assert cues[2]["bar"] == 33
    assert cues[2]["pos_ms"] == 60800

    # Colores y propiedades para UI
    for c in cues:
        assert "color" in c
        assert "rgb" in c
        assert "time" in c
        assert "pct" in c
        assert 0.0 <= c["pct"] <= 1.0

def test_generar_serato_markers2_con_fraseo_automatico():
    # Al pasar cues=None, debe generar automáticamente los 8 cues por frases y empaquetar en base64
    b64 = AudioProcessorService.generar_serato_markers2(duration_ms=300000, bpm=124.0, cues=None, downbeat_ms=250)
    assert b64 is not None
    import base64
    raw = base64.b64decode(b64)
    assert b"COLOR" in raw
    assert b"BPMLOCK" in raw
    # Debe contener 8 chunks "CUE\x00"
    assert raw.count(b"CUE\x00") == 8

def test_generar_serato_markers2_con_cues_editados_personalizados():
    # Permite editar tiempos con texto mm:ss.ms y colores hexadecimales
    cues_editados = [
        {"id": 1, "name": "Entrada Bombo Pro", "time": "00:15.500", "color": "#ef4444"},
        {"id": 2, "name": "Climax Drop 1", "time": "01:30.250", "color": "#06b6d4"},
        {"id": 3, "name": "Breakdown Melodico", "pos_ms": 120000, "color": "#22c55e"}
    ]
    b64 = AudioProcessorService.generar_serato_markers2(duration_ms=360000, bpm=128.0, cues=cues_editados, downbeat_ms=0)
    import base64
    raw = base64.b64decode(b64)
    assert b"Entrada Bombo Pro" in raw
    assert b"Climax Drop 1" in raw
    assert b"Breakdown Melodico" in raw
    # Verificar que los 3 cues están presentes
    assert raw.count(b"CUE\x00") == 3

def test_serializar_serato_beatgrid_binario():
    # Beatgrid para 128.0 BPM con downbeat a 500ms (0.5s)
    grid_bin = AudioProcessorService.serializar_serato_beatgrid(bpm=128.0, downbeat_ms=500.0)
    assert len(grid_bin) == 15  # 2 header + 4 count + 4 pos + 4 bpm + 1 footer
    assert grid_bin[:2] == b"\x01\x00"
    import struct
    marker_count = struct.unpack(">I", grid_bin[2:6])[0]
    assert marker_count == 1
    pos_sec, bpm_val = struct.unpack(">ff", grid_bin[6:14])
    assert abs(pos_sec - 0.5) < 0.001
    assert abs(bpm_val - 128.0) < 0.001
    assert grid_bin[14:] == b"\x00"

def test_procesar_caratula_cuadrada_reescalado():
    from PIL import Image
    import io
    # Crear imagen rectangular 800x400
    img = Image.new("RGB", (800, 400), color=(0, 200, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    raw_input = buf.getvalue()

    # Procesar
    sq_bytes = AudioProcessorService.procesar_caratula_cuadrada(raw_input, max_dim=600)
    assert len(sq_bytes) > 0
    res_img = Image.open(io.BytesIO(sq_bytes))
    assert res_img.format == "JPEG"
    assert res_img.size == (600, 600)

def test_escribir_metadatos_pro_beatgrid_y_artwork_mp3(tmp_path):
    mp3_file = tmp_path / "track_beatgrid.mp3"
    with open(str(mp3_file), "wb") as f:
        f.write(b"\xff\xfb\x90\x64" * 1000)

    from PIL import Image
    import io
    img = Image.new("RGB", (400, 300), color=(255, 100, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()

    meta = {
        "title": "Subtle Rhythm",
        "artist": "Techno Master",
        "album": "CleanDJmix Records",
        "bpm": "130.00",
        "key": "11A",
        "first_downbeat_ms": 350.0,
        "cover": img_bytes
    }

    ok = AudioProcessorService.escribir_metadatos_pro(str(mp3_file), meta)
    assert ok is True

    from mutagen.id3 import ID3
    id3 = ID3(str(mp3_file))
    # Verifica GEOB Serato BeatGrid
    assert "GEOB:Serato BeatGrid" in id3
    beatgrid_frame = id3["GEOB:Serato BeatGrid"]
    assert beatgrid_frame.desc == "Serato BeatGrid"
    assert len(beatgrid_frame.data) == 15

    # Verifica APIC Artwork Cover
    apic_keys = [k for k in id3.keys() if k.startswith("APIC")]
    assert len(apic_keys) > 0
    apic_frame = id3[apic_keys[0]]
    assert apic_frame.mime == "image/jpeg"
    assert apic_frame.type == 3  # Front cover
    cover_loaded = Image.open(io.BytesIO(apic_frame.data))
    assert cover_loaded.size == (600, 600)

def test_escribir_y_leer_genero_subgenero_mp3(tmp_path):
    mp3_file = tmp_path / "track_taxonomy.mp3"
    with open(str(mp3_file), "wb") as f:
        f.write(b"\xff\xfb\x90\x64" * 1000)

    meta = {
        "title": "Solar Wind",
        "artist": "Cosmic Gate",
        "genre": "Trance",
        "subgenre": "Uplifting Trance",
        "bpm": "138.00",
        "key": "4A"
    }

    ok = AudioProcessorService.escribir_metadatos_pro(str(mp3_file), meta)
    assert ok is True

    from mutagen.id3 import ID3
    id3 = ID3(str(mp3_file))
    assert "TCON" in id3
    assert "Trance / Uplifting Trance" in str(id3["TCON"].text[0])
    assert "TXXX:SUBGENRE" in id3
    assert id3["TXXX:SUBGENRE"].text[0] == "Uplifting Trance"

    # Verificar que el analizador avanzado extrae ambos campos adecuadamente
    info = AudioProcessorService.analizar_track_avanzado(str(mp3_file))
    assert info["genre"] == "Trance"
    assert info["subgenre"] == "Uplifting Trance"

def test_resolver_caratula_local_encontrada(tmp_path):
    mp3_file = tmp_path / "song.mp3"
    mp3_file.write_bytes(b"\xff\xfb\x90\x64" * 500)
    cover_file = tmp_path / "cover.jpg"
    cover_file.write_bytes(b"\xff\xd8\xff\xe0" + b"\x00" * 100)

    res = AudioProcessorService.resolver_caratula_local_o_remota(str(mp3_file))
    assert res == str(cover_file)

def test_inyectar_caratulas_lote(tmp_path):
    from PIL import Image
    import io
    from services.audit_service import AuditService

    mp3_file = tmp_path / "track_art.mp3"
    mp3_file.write_bytes(b"\xff\xfb\x90\x64" * 1000)

    cover_file = tmp_path / "folder.jpg"
    img = Image.new("RGB", (300, 300), color=(100, 150, 200))
    img.save(str(cover_file), format="JPEG")

    tracks = [
        {"path": str(mp3_file), "title": "Track Art", "artist": "Art Master"}
    ]

    svc = AuditService()
    res = svc.inyectar_caratulas_lote(tracks)
    assert res["status"] == "ok"
    assert res["actualizadas"] == 1

    from mutagen.id3 import ID3
    id3 = ID3(str(mp3_file))
    apic_keys = [k for k in id3.keys() if k.startswith("APIC")]
    assert len(apic_keys) > 0
