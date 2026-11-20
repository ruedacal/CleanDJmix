"""
Unit and Integration Test Suite for BeatWave Phase 2 GPU Rescue Microservice.
"""

import os
import sys
import io
import time
import json
import numpy as np

# Asegurar path de importación
SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
if SERVICE_DIR not in sys.path:
    sys.path.insert(0, SERVICE_DIR)

from audio_processor import (
    AudioProcessor,
    detect_device,
    decode_flac_in_memory,
    generate_speculative_warps,
    LightweightSourceSeparator,
    PhaseVocoderTimeStretch
)
from main import app
from fastapi.testclient import TestClient


def create_synthetic_flac(duration_sec=2.0, sr=16000) -> bytes:
    """Genera un archivo FLAC válido en memoria para tests sintéticos."""
    t = np.linspace(0, duration_sec, int(sr * duration_sec), endpoint=False)
    # Onda sintética con frecuencias graves (kick/bajo) y agudos (leads)
    audio = (np.sin(2 * np.pi * 135 * t) * 0.7 + np.sin(2 * np.pi * 440 * t) * 0.3).astype(np.float32)
    
    # Intentar con soundfile si está disponible
    try:
        import soundfile as sf
        buf = io.BytesIO()
        sf.write(buf, audio, sr, format="FLAC")
        return buf.getvalue()
    except Exception:
        pass

    # Fallback si soundfile no estuviese en el runtime actual: leer dump del test C++
    dump_path = "/tmp/beatwave_escalation_test.flac"
    if os.path.exists(dump_path):
        with open(dump_path, "rb") as f:
            return f.read()

    # Si no existe, crear un blob mínimo con magic header 'fLaC'
    return b"fLaC" + b"\x80\x00\x00\x22" + bytes(34) + (audio * 32767).astype(np.int16).tobytes()


def run_tests():
    print("==================================================================")
    print(" [TEST SUITE] BEATWAVE PHASE 2 GPU RESCUE MICROSERVICE           ")
    print("==================================================================\n")

    device = detect_device()
    print(f"Dispositivo de hardware detectado: {device}\n")

    # --------------------------------------------------------------------
    # TEST 1: In-Memory FLAC Decoding
    # --------------------------------------------------------------------
    print("[TEST 1] Decodificación de audio FLAC en memoria RAM...")
    flac_bytes = create_synthetic_flac(duration_sec=3.0, sr=16000)
    waveform, sr = decode_flac_in_memory(flac_bytes, target_sr=16000)

    num_samples = waveform.shape[-1] if hasattr(waveform, "shape") else len(waveform)
    print(f"  - Muestras decodificadas: {num_samples} (Tasa: {sr} Hz)")
    assert num_samples > 0, "El audio decodificado no debe estar vacío"
    assert sr == 16000, f"Tasa esperada 16000, obtenida {sr}"
    print("✓ TEST 1 PASADO: Decodificación en RAM verificada sin archivos en disco.\n")

    # --------------------------------------------------------------------
    # TEST 2: Speculative Tempo-Warp Pipeline (+3%, +6%, -3%, rho)
    # --------------------------------------------------------------------
    print("[TEST 2] Generación de 3 Tensores Especulativos (+3%, +6%, -3%)...")
    warps = generate_speculative_warps(
        waveform=waveform,
        sample_rate=sr,
        rates=[1.03, 1.06, 0.97],
        exact_rho=1.075, # +7.5% en fader de cabina DJ
        device=device
    )

    print(f"  - Tensores generados: {list(warps.keys())}")
    assert "warp_+3%" in warps, "Debe existir warp_+3%"
    assert "warp_+6%" in warps, "Debe existir warp_+6%"
    assert "warp_-3%" in warps, "Debe existir warp_-3%"
    assert "warp_exact_rho_compensation" in warps, "Debe existir compensación exacta de rho"

    w3 = warps["warp_+3%"]
    print(f"  - Warp +3%: rate={w3['rate']}, muestras={w3['num_samples']}, duración={w3['duration_sec']}s (Calc: {w3['compute_time_ms']}ms)")
    w6 = warps["warp_+6%"]
    print(f"  - Warp +6%: rate={w6['rate']}, muestras={w6['num_samples']}, duración={w6['duration_sec']}s (Calc: {w6['compute_time_ms']}ms)")
    wm3 = warps["warp_-3%"]
    print(f"  - Warp -3%: rate={wm3['rate']}, muestras={wm3['num_samples']}, duración={wm3['duration_sec']}s (Calc: {wm3['compute_time_ms']}ms)")
    w_rho = warps["warp_exact_rho_compensation"]
    print(f"  - Compensación Rho ({w_rho['original_rho']}): factor={w_rho['rate']}, stretch={w_rho['stretch_pct']}%")

    # Verificar que time-stretch modifica la duración adecuadamente
    assert w6["num_samples"] < w3["num_samples"], "+6% debe tener menor duración que +3%"
    assert wm3["num_samples"] > w3["num_samples"], "-3% debe tener mayor duración que +3%"
    print("✓ TEST 2 PASADO: Tensores especulativos de time-stretch generados con éxito.\n")

    # --------------------------------------------------------------------
    # TEST 3: Lightweight Source Separation (Drums & Synth Stems)
    # --------------------------------------------------------------------
    print("[TEST 3] Separación de Fuentes Neuronal (Drums & Synth Stems)...")
    separator = LightweightSourceSeparator(device=device)
    stems = separator.separate_stems(waveform, sample_rate=sr)

    print(f"  - Stems aislados: drums, synth, mix")
    print(f"  - Drums RMS: {stems['drums']['rms_energy']} | Muestras: {stems['drums']['num_samples']}")
    print(f"  - Synth RMS: {stems['synth']['rms_energy']} | Muestras: {stems['synth']['num_samples']}")
    print(f"  - Tiempo de inferencia: {stems['separation_time_ms']} ms en {stems['device']}")

    assert "drums" in stems and "synth" in stems
    assert stems["drums"]["rms_energy"] > 0.0
    assert stems["synth"]["rms_energy"] > 0.0
    print("✓ TEST 3 PASADO: Separación de fuentes neuronal completada.\n")

    # --------------------------------------------------------------------
    # TEST 4: FastAPI Microservice Endpoints (TestClient)
    # --------------------------------------------------------------------
    print("[TEST 4] Test de Integración FastAPI Endpoints (/health y /v1/rescue)...")
    client = TestClient(app)

    # 4A. Health
    res_health = client.get("/health")
    print(f"  - /health status: {res_health.status_code} | Body: {res_health.json()}")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "ok"

    # 4B. POST /v1/rescue con TIME_DRIFT_SUSPECTED_PITCH
    multipart_data = {
        "reason": (None, "TIME_DRIFT_SUSPECTED_PITCH"),
        "rho": (None, "1.08"),
        "environment": (None, "club"),
        "candidate_hint": (None, json.dumps({"artist": "Charlotte de Witte", "title": "Overdrive"}))
    }
    files = {
        "audio": ("escalation_rescue.flac", flac_bytes, "audio/flac")
    }

    res_rescue_pitch = client.post("/v1/rescue", data=multipart_data, files=files)
    print(f"  - /v1/rescue (PITCH) status: {res_rescue_pitch.status_code}")
    assert res_rescue_pitch.status_code == 200
    body_pitch = res_rescue_pitch.json()
    print(f"    * Pipeline seleccionado: {body_pitch.get('pipeline')}")
    print(f"    * Coincidencia rescatada: {body_pitch.get('match', {}).get('artist')} - {body_pitch.get('match', {}).get('title')}")
    print(f"    * Score: {body_pitch.get('match', {}).get('score')}% | Warp: {body_pitch.get('match', {}).get('tempo_warp_applied')}%")
    assert body_pitch["status"] == "success"
    assert body_pitch["pipeline"] == "TEMPO_WARP_SPECULATIVE"
    assert "warp_+3%" in body_pitch["tensors_generated"]

    # 4C. POST /v1/rescue con LOW_CONFIDENCE (Separación de Fuentes)
    multipart_blend = {
        "reason": (None, "LOW_CONFIDENCE"),
        "rho": (None, "1.0"),
        "environment": (None, "club"),
        "candidate_hint": (None, json.dumps({"artist": "Amelie Lens", "title": "In My Mind"}))
    }
    files_blend = {
        "audio": ("blend_rescue.flac", flac_bytes, "audio/flac")
    }

    res_rescue_blend = client.post("/v1/rescue", data=multipart_blend, files=files_blend)
    print(f"  - /v1/rescue (LOW_CONFIDENCE) status: {res_rescue_blend.status_code}")
    assert res_rescue_blend.status_code == 200
    body_blend = res_rescue_blend.json()
    print(f"    * Pipeline seleccionado: {body_blend.get('pipeline')}")
    print(f"    * Coincidencia rescatada: {body_blend.get('match', {}).get('artist')} - {body_blend.get('match', {}).get('title')}")
    print(f"    * Stem aislado: {body_blend.get('match', {}).get('stem_isolated')}")
    assert body_blend["status"] == "success"
    assert body_blend["pipeline"] == "SOURCE_SEPARATION_DEMUCS"
    assert "stems" in body_blend["tensors_generated"]

    print("✓ TEST 4 PASADO: Endpoints FastAPI de Fase 2 validados al 100%.\n")

    print("==================================================================")
    print(" TODOS LOS TESTS DEL BACKEND GPU DE FASE 2 PASARON 100% OK       ")
    print("==================================================================")


if __name__ == "__main__":
    run_tests()
