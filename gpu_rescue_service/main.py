"""
BeatWave PRO - Phase 2 GPU Neural Rescue: FastAPI Main Routing
==============================================================================
Microservice API handling heavy neural source separation and speculative tempo-warping.
Designed for cloud GPU instances (AWS EC2 G5/G6, RunPod, Lambda Labs, GCP A100/T4).

Endpoints:
- POST /v1/rescue: Ingests multipart/form-data with 16 kHz FLAC payload and returns rescued match.
- GET  /health: Telemetry and GPU hardware status (CUDA/MPS/CPU, VRAM usage).
- POST /v1/export-onnx: Exports the OpenUnmix/Demucs Lite model to ONNX for TensorRT runtime.
"""

import os
import sys
import json
import time
import logging
from typing import Optional, Dict, Any

from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Configuración de Logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s"
)
logger = logging.getLogger("BeatWave.RescueMicroservice")

# Importar procesador de audio GPU
try:
    from .audio_processor import AudioProcessor, DEVICE, detect_device
except ImportError:
    from audio_processor import AudioProcessor, DEVICE, detect_device

app = FastAPI(
    title="BeatWave PRO - Phase 2 GPU Neural Rescue Service",
    description="Microservicio Cloud GPU para rescate acústico: Source Separation y Tempo-Warping",
    version="2.5.0"
)

# CORS permisivo para clientes híbridos y pruebas locales
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instancia global del procesador de audio en memoria GPU
app.state.processor = None
app.state.start_time = time.time()


@app.on_event("startup")
async def startup_event():
    """Inicializa los tensores y modelos neuronales en VRAM de la GPU al arrancar."""
    logger.info("==================================================================")
    logger.info(" INICIANDO BEATWAVE PRO PHASE 2 GPU RESCUE MICROSERVICE           ")
    logger.info("==================================================================")
    device = detect_device()
    logger.info(f"Dispositivo de aceleración seleccionado: {device}")
    app.state.processor = AudioProcessor(device=device)
    app.state.start_time = time.time()
    logger.info("✓ Modelos de Time-Stretch y Source Separation listos para inferencia.")


@app.get("/health")
async def health_check():
    """Endpoint de telemetría de salud y diagnóstico de GPU."""
    uptime = time.time() - (app.state.start_time or time.time())
    gpu_telemetry = {"device": DEVICE}

    try:
        import torch
        if torch.cuda.is_available():
            gpu_telemetry.update({
                "device_name": torch.cuda.get_device_name(0),
                "memory_allocated_mb": round(torch.cuda.memory_allocated(0) / (1024 * 1024), 2),
                "memory_reserved_mb": round(torch.cuda.memory_reserved(0) / (1024 * 1024), 2),
                "max_memory_mb": round(torch.cuda.get_device_properties(0).total_memory / (1024 * 1024), 2)
            })
    except Exception:
        pass

    return {
        "status": "ok",
        "service": "BeatWave-Phase2-GPU-Rescue",
        "version": "2.5.0",
        "uptime_seconds": round(uptime, 2),
        "hardware": gpu_telemetry
    }


@app.post("/v1/rescue")
async def rescue_track_endpoint(request: Request):
    """
    Punto de entrada para el rescate acústico de pistas problemáticas.
    Recibe el payload multipart con el archivo FLAC generado en memoria RAM.
    """
    if app.state.processor is None:
        app.state.processor = AudioProcessor(device=detect_device())

    content_type = request.headers.get("content-type", "")
    reason = request.headers.get("x-escalation-reason")
    rho = 1.0
    environment = "club"
    candidate_hint = None
    flac_bytes = b""

    # 1. Intento primario: parseo estructurado de multipart/form-data
    try:
        form = await request.form()
        if not reason and "reason" in form:
            reason = str(form["reason"])
        if "rho" in form:
            try:
                rho = float(form["rho"])
            except (ValueError, TypeError):
                pass
        if "environment" in form:
            environment = str(form["environment"])
        if "candidate_hint" in form:
            hint_val = form["candidate_hint"]
            if isinstance(hint_val, str):
                try:
                    candidate_hint = json.loads(hint_val)
                except Exception:
                    pass
            elif isinstance(hint_val, dict):
                candidate_hint = hint_val
        if "audio" in form:
            audio_field = form["audio"]
            if hasattr(audio_field, "read"):
                flac_bytes = await audio_field.read()
            elif isinstance(audio_field, (bytes, bytearray)):
                flac_bytes = bytes(audio_field)
    except Exception as e:
        logger.debug(f"[POST /v1/rescue] Fallback en request.form(): {e}")

    # 2. Fallback de contingencia: parseo manual de raw body
    if not flac_bytes:
        body = await request.body()
        if not body:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El cuerpo de la petición está vacío"
            )

        flac_offset = body.find(b"fLaC")
        if flac_offset == -1:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "status": "error",
                    "message": "Cabecera binaria FLAC ('fLaC') no encontrada en el payload recibido"
                }
            )

        flac_bytes = body[flac_offset:]
        if b"--" in flac_bytes:
            parts = flac_bytes.split(b"\r\n--")
            flac_bytes = parts[0]

        if not reason:
            if b'name="reason"' in body:
                try:
                    reason = body.split(b'name="reason"')[1].split(b'\r\n\r\n')[1].split(b'\r\n')[0].decode("utf-8").strip()
                except Exception:
                    pass

        if b'name="rho"' in body:
            try:
                rho_str = body.split(b'name="rho"')[1].split(b'\r\n\r\n')[1].split(b'\r\n')[0].decode("utf-8").strip()
                rho = float(rho_str)
            except Exception:
                pass

        if b'name="candidate_hint"' in body:
            try:
                hint_str = body.split(b'name="candidate_hint"')[1].split(b'\r\n\r\n')[1].split(b'\r\n')[0].decode("utf-8").strip()
                candidate_hint = json.loads(hint_str)
            except Exception:
                pass

    if not reason:
        reason = "TIME_DRIFT_SUSPECTED_PITCH"

    # Verificar que el audio contenga la cabecera 'fLaC'
    if not flac_bytes.startswith(b"fLaC"):
        f_idx = flac_bytes.find(b"fLaC")
        if f_idx != -1:
            flac_bytes = flac_bytes[f_idx:]
        else:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "status": "error",
                    "message": "Cabecera binaria FLAC ('fLaC') no encontrada en el audio recibido"
                }
            )

    logger.info(f"[POST /v1/rescue] Recibido payload FLAC ({len(flac_bytes)} bytes) | Motivo: {reason} | Rho: {rho}")

    # 3. Ejecución del pipeline de audio en GPU (Tempo-Warp o Source Separation)
    t0 = time.time()
    try:
        rescue_response = app.state.processor.process_rescue_payload(
            flac_bytes=flac_bytes,
            reason=reason,
            rho=rho,
            environment=environment,
            candidate_hint=candidate_hint
        )
        elapsed_ms = (time.time() - t0) * 1000.0
        rescue_response["latency_ms"] = round(elapsed_ms, 2)
        return rescue_response

    except Exception as e:
        logger.error(f"[POST /v1/rescue] Error durante el procesamiento de audio: {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "message": f"Fallo en la inferencia GPU: {str(e)}"
            }
        )


@app.post("/v1/export-onnx")
async def export_onnx_endpoint():
    """Exporta el modelo de separación de fuentes a formato estándar ONNX para TensorRT."""
    if app.state.processor is None:
        app.state.processor = AudioProcessor(device=detect_device())

    onnx_path = os.path.join(os.path.dirname(__file__), "openunmix_lite.onnx")
    ok = app.state.processor.separator.export_onnx(onnx_path)
    if ok:
        return {"status": "success", "onnx_model_path": onnx_path}
    else:
        raise HTTPException(status_code=500, detail="No se pudo exportar el modelo a ONNX")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=False)
