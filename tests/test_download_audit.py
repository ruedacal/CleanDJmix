import os
import pytest
from services.download_service import DownloadService

class DummyAudioService:
    def analizar_espectro_fft(self, filepath, spotify_id=None):
        if "fake" in filepath.lower():
            return {
                "id": spotify_id,
                "status": "FLAC FAKE",
                "estado": "FLAC FAKE",
                "calidad": "Baja",
                "cutoff_khz": 15.5,
                "corte": "15.5 kHz",
                "perdida": "45%",
                "perdida_pct": 45,
                "samplerate": 44100,
                "bitrate_kbps": 320,
                "format": "FLAC",
                "diagnostico": {
                    "es_fake": True,
                    "status": "FLAC FAKE",
                    "calidad": "Baja",
                    "sample_rate_khz": 44.1,
                    "bitrate_kbps": 320
                }
            }
        else:
            return {
                "id": spotify_id,
                "status": "Lossless OK",
                "estado": "Lossless OK",
                "calidad": "Alta",
                "cutoff_khz": 22.0,
                "corte": "22.0 kHz",
                "perdida": "Sin Pérdida",
                "perdida_pct": 0,
                "samplerate": 44100,
                "bitrate_kbps": 1050,
                "format": "FLAC",
                "diagnostico": {
                    "es_fake": False,
                    "status": "Lossless OK",
                    "calidad": "Alta",
                    "sample_rate_khz": 44.1,
                    "bitrate_kbps": 1050
                }
            }

class DummyEel:
    def __init__(self):
        self.fft_updates = []
        self.audit_results = []
        self.finished = []

    def actualizar_estado_fft(self, pct, msg):
        self.fft_updates.append((pct, msg))
        return lambda: None

    def notificar_resultado_auditoria_post_descarga(self, data):
        self.audit_results.append(data)
        return lambda: None

    def notificar_fin_auditoria_post_descarga(self, results):
        self.finished.append(results)
        return lambda: None

def test_ejecutar_auditoria_descargas_fft(tmp_path):
    dl_svc = DownloadService()
    audio_svc = DummyAudioService()
    eel_ref = DummyEel()

    # Create dummy files
    f_real = tmp_path / "Artist - RealTrack.flac"
    f_real.write_text("dummy audio real")
    f_fake = tmp_path / "Artist - FakeTrack.flac"
    f_fake.write_text("dummy audio fake")

    tracks = [
        {
            "id": "trk_1",
            "title": "RealTrack",
            "artist": "Artist",
            "path": str(f_real),
            "format": "FLAC"
        },
        {
            "id": "trk_2",
            "title": "FakeTrack",
            "artist": "Artist",
            "path": str(f_fake),
            "format": "FLAC"
        }
    ]

    res = dl_svc.ejecutar_auditoria_descargas_fft(tracks, audio_svc, eel_ref)
    assert res.get("status") == "iniciado"

    import time
    for _ in range(30):
        if len(eel_ref.finished) > 0:
            break
        time.sleep(0.1)

    assert len(eel_ref.audit_results) == 2
    res_real = [r for r in eel_ref.audit_results if r["id"] == "trk_1"][0]
    res_fake = [r for r in eel_ref.audit_results if r["id"] == "trk_2"][0]

    # Verification: Real track gets optimal advice
    assert res_real["es_fake"] is False
    assert "Máxima" in res_real["consejo"]
    assert res_real["sugerencia_formato"] is None

    # Verification: Fake track gets MP3 320 advice
    assert res_fake["es_fake"] is True
    assert "MP3 320" in res_fake["consejo"]
    assert res_fake["sugerencia_formato"] == "mp3"
