import os
import struct
import base64
import numpy as np
import pytest
from infrastructure.audio_processor import AudioProcessorService
from services.audit_service import AuditService, calcular_huella_acustica


def test_club_template_generates_8_quantized_cues():
    """Verifica que la plantilla Club Extended genere exactamente 8 Hot Cues ordenados temporalmente."""
    cues = AudioProcessorService.generar_hot_cues_plantilla_club(
        duration_ms=360000, # 6 min
        bpm=128.0,
        downbeat_ms=100
    )
    assert len(cues) == 8
    # Verificar que los IDs van de 1 a 8
    ids = [c["id"] for c in cues]
    assert ids == [1, 2, 3, 4, 5, 6, 7, 8]
    # Verificar orden estrictamente ascendente o igual
    positions = [c["pos_ms"] for c in cues]
    for i in range(len(positions) - 1):
        assert positions[i] <= positions[i + 1]


def test_club_template_downbeat_alignment():
    """Verifica que el Pad 1 esté alineado exactamente con el downbeat detectado."""
    downbeat = 350
    cues = AudioProcessorService.generar_hot_cues_plantilla_club(
        duration_ms=300000,
        bpm=125.0,
        downbeat_ms=downbeat
    )
    assert cues[0]["pos_ms"] == downbeat
    assert "Intro" in cues[0]["name"] or "Downbeat" in cues[0]["name"]


def test_club_template_outro_bounds():
    """Verifica que los Cues de salida (Outro) nunca excedan la duración física del track."""
    dur = 240000 # 4 min
    cues = AudioProcessorService.generar_hot_cues_plantilla_club(
        duration_ms=dur,
        bpm=130.0,
        downbeat_ms=0
    )
    assert len(cues) == 8
    assert cues[7]["pos_ms"] < dur
    assert cues[6]["pos_ms"] < dur


def test_serato_markers2_header_byte_parity():
    """Verifica la paridad de bytes de la cabecera oficial Serato Markers2 (b'\\x01\\x01')."""
    b64 = AudioProcessorService.generar_serato_markers2(duration_ms=300000, bpm=128.0)
    raw = base64.b64decode(b64)
    # Cabecera binaria oficial Serato Markers2
    assert raw[:2] == b"\x01\x01"


def test_serato_markers2_cue_block_structure():
    """Verifica que cada pad esté serializado como un bloque 'CUE\\x00' con longitud de 4 bytes en formato big-endian."""
    cues = AudioProcessorService.generar_hot_cues_plantilla_club(duration_ms=300000, bpm=128.0)
    b64 = AudioProcessorService.generar_serato_markers2(duration_ms=300000, bpm=128.0, cues=cues)
    raw = base64.b64decode(b64)

    assert b"CUE\x00" in raw
    # Contar ocurrencias de b"CUE\x00"
    cue_count = raw.count(b"CUE\x00")
    assert cue_count == 8


def test_serato_markers2_color_and_bpmlock_fields():
    """Verifica los campos obligatorios COLOR y BPMLOCK con sus longitudes big-endian."""
    b64 = AudioProcessorService.generar_serato_markers2(duration_ms=300000, bpm=128.0)
    raw = base64.b64decode(b64)

    assert b"COLOR\x00" in raw
    idx_color = raw.find(b"COLOR\x00")
    color_len = struct.unpack(">I", raw[idx_color + 6 : idx_color + 10])[0]
    assert color_len == 4

    assert b"BPMLOCK\x00" in raw
    idx_bpm = raw.find(b"BPMLOCK\x00")
    bpm_len = struct.unpack(">I", raw[idx_bpm + 8 : idx_bpm + 12])[0]
    assert bpm_len == 1


def test_serato_markers2_rgb_color_parity():
    """Verifica que los colores RGB se empaqueten fielmente en los bytes de cada Cue."""
    custom_cues = [
        {"id": 1, "pos_ms": 1000, "name": "Test Cyan", "rgb": (6, 182, 212)},
        {"id": 2, "pos_ms": 5000, "name": "Test Amber", "rgb": (245, 158, 11)}
    ]
    b64 = AudioProcessorService.generar_serato_markers2(
        duration_ms=300000,
        bpm=128.0,
        cues=custom_cues
    )
    raw = base64.b64decode(b64)
    # Verificar presencia de bytes de color
    assert bytes([6, 182, 212]) in raw
    assert bytes([245, 158, 11]) in raw


def test_serato_markers2_base64_roundtrip_id3_geob():
    """Verifica que el resultado sea codificable y decodificable en base64 para inyección ID3 GEOB."""
    b64 = AudioProcessorService.generar_serato_markers2(duration_ms=300000, bpm=128.0)
    assert isinstance(b64, bytes)
    # Debe ser base64 válido
    decoded = base64.b64decode(b64)
    reencoded = base64.b64encode(decoded)
    assert b64 == reencoded


def test_tri_band_spectral_ratio_sum_to_100():
    """Verifica el cálculo del Ratio Espectral Tri-Banda derivado de la FFT (Low/Mid/High)."""
    # Crear señal sintética de prueba con baja frecuencia dominante (100 Hz = Bass Driver)
    sr = 44100
    t = np.linspace(0, 1, sr)
    bass_heavy_signal = np.sin(2 * np.pi * 60 * t) * 1.0 + np.sin(2 * np.pi * 1000 * t) * 0.1

    yf = np.fft.rfft(bass_heavy_signal)
    xf = np.fft.rfftfreq(len(bass_heavy_signal), 1.0 / sr)
    power = np.abs(yf) ** 2

    low_mask = (xf >= 20) & (xf < 250)
    mid_mask = (xf >= 250) & (xf < 4000)
    high_mask = (xf >= 4000) & (xf <= 20000)

    low_energy = float(np.sum(power[low_mask]))
    mid_energy = float(np.sum(power[mid_mask]))
    high_energy = float(np.sum(power[high_mask]))
    total = low_energy + mid_energy + high_energy

    low_ratio = round((low_energy / total) * 100.0, 1)
    mid_ratio = round((mid_energy / total) * 100.0, 1)
    high_ratio = round(max(0.0, 100.0 - (low_ratio + mid_ratio)), 1)

    assert abs((low_ratio + mid_ratio + high_ratio) - 100.0) < 0.2
    assert low_ratio > 80.0 # Domina el grave de 60 Hz


def test_acoustic_fingerprint_and_duplicate_detection():
    """Verifica que pistas con nombres distintos pero huella acústica idéntica se detecten como duplicados."""
    sr = 44100
    t = np.linspace(0, 5, sr * 5)
    audio = np.sin(2 * np.pi * 440 * t) + 0.3 * np.sin(2 * np.pi * 880 * t)

    fp1 = calcular_huella_acustica(audio, sr)
    fp2 = calcular_huella_acustica(audio * 0.75, sr) # Misma canción a diferente volumen

    assert len(fp1) > 20
    assert fp1.split("_")[0] == fp2.split("_")[0]

    # Verificar evaluación Anti-Muddy
    track_bass = {"id": 1, "low_ratio": 55.0, "acoustic_role": "Bass Driver"}
    track_vocal = {"id": 2, "low_ratio": 20.0, "acoustic_role": "Vocal / Lead"}
    track_bass2 = {"id": 3, "low_ratio": 52.0, "acoustic_role": "Bass Driver"}

    eval_comp = AuditService.evaluar_compatibilidad_antimuddy(track_bass, track_vocal)
    assert eval_comp["compatible"] is True
    assert "Complementary" in eval_comp["status"]

    eval_collision = AuditService.evaluar_compatibilidad_antimuddy(track_bass, track_bass2)
    assert eval_collision["compatible"] is False
    assert eval_collision["is_collision"] is True


def test_exportar_set_m3u_standard_format(tmp_path):
    """Verifica que exportar_set_m3u genere un archivo M3U8 con cabecera y directivas válidas."""
    from services.export_service import ExportService
    svc = ExportService()
    test_tracks = [
        {"title": "Track One", "artist": "Artist A", "duration_sec": 360, "path": "/Music/track1.flac"},
        {"title": "Track Two", "artist": "Artist B", "duration_sec": 240, "path": "/Music/track2.mp3"}
    ]
    res = svc.exportar_set_m3u(test_tracks, destino_dir=str(tmp_path), nombre_set="Festival_Mainstage")
    assert res["status"] == "ok"
    assert res["total_tracks"] == 2
    assert os.path.exists(res["path"])

    content = res["content"]
    assert "#EXTM3U" in content
    assert "#PLAYLIST:Festival_Mainstage" in content
    assert "#EXTINF:360,Artist A - Track One" in content
    assert "/Music/track1.flac" in content
    assert "#EXTINF:240,Artist B - Track Two" in content
    assert "/Music/track2.mp3" in content
