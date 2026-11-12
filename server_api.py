"""
BEATWAVE PRO - Modern High-Performance FastAPI & ASGI Backend.
Motor local de alto rendimiento: análisis de audio nativo (FFT/DSP, BPM, ID3v2.4, Serato)
sin subida física de archivos a la nube (Zero Cloud Ingestion, coste de servidor cero).
"""

import os
import sys
import json
import asyncio
import time
from typing import List, Optional, Dict, Any

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel

# Servicios locales de audio
from services.media_service import MediaService
try:
    from services.audit_service import AuditService
except Exception as e:
    AuditService = None

app = FastAPI(
    title="BEATWAVE PRO - Local Audio Engine",
    description="Motor local de metadatos, análisis de señal FFT y streaming para BeatWave PRO",
    version="2.4.0"
)

# CORS permisivo para desarrollo y acceso local/remoto controlado
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gestor de conexiones WebSocket para telemetría en tiempo real
class TelemetryManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

telemetry = TelemetryManager()

# Modelos Pydantic para endpoints tipados
class ScanRequest(BaseModel):
    directory: str
    recursive: bool = True

class BatchAuditRequest(BaseModel):
    track_paths: List[str]
    options: Optional[Dict[str, Any]] = None

class CrateFolderRequest(BaseModel):
    name: str
    color: Optional[str] = "#00F0FF"
    parent_id: Optional[str] = None
    track_ids: Optional[List[str]] = []

# --- ENDPOINTS API ---

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "app": "BEATWAVE PRO",
        "engine": "FastAPI + Uvicorn ASGI",
        "zero_cloud_ingest": True,
        "audio_service": "native-local",
        "version": "2.4.0",
        "timestamp": time.time()
    }

@app.get("/cover")
async def get_cover(path: str = Query(...)):
    """Extrae la carátula ID3 incrustada localmente sin transferir el audio."""
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    try:
        data = MediaService.extract_embedded_cover(path)
        if data:
            mime = "image/jpeg" if data.startswith(b'\xff\xd8') else "image/png"
            return Response(content=data, media_type=mime)
    except Exception as e:
        pass
    # Imagen placeholder transparente o svg
    return JSONResponse(status_code=204, content={"message": "Sin carátula"})

@app.get("/stream_audio")
async def stream_audio(request: Request, path: str = Query(...)):
    """Streaming de audio local con soporte Range para reproductor de cabina."""
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Pista no encontrada en disco local")

    file_size = os.path.getsize(path)
    range_header = request.headers.get("range")
    
    # Determinar tipo de contenido
    ext = os.path.splitext(path)[1].lower()
    media_types = {
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".aif": "audio/aiff",
        ".aiff": "audio/aiff",
        ".flac": "audio/flac",
        ".m4a": "audio/mp4"
    }
    media_type = media_types.get(ext, "audio/mpeg")

    if range_header:
        byte1, byte2 = 0, None
        range_str = range_header.replace("bytes=", "")
        parts = range_str.split("-")
        byte1 = int(parts[0])
        if parts[1]:
            byte2 = int(parts[1])
        length = (byte2 - byte1 + 1) if byte2 is not None else (file_size - byte1)

        def iter_file():
            with open(path, "rb") as f:
                f.seek(byte1)
                remaining = length
                while remaining > 0:
                    chunk_size = min(64 * 1024, remaining)
                    data = f.read(chunk_size)
                    if not data:
                        break
                    remaining -= len(data)
                    yield data

        headers = {
            "Content-Range": f"bytes {byte1}-{byte2 or file_size - 1}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(length),
        }
        return StreamingResponse(iter_file(), status_code=206, headers=headers, media_type=media_type)

    return FileResponse(path, media_type=media_type)

@app.post("/api/library/scan")
async def scan_directory(payload: ScanRequest):
    """Escaneo ultrarrápido de directorio local a velocidad SSD de bus."""
    target_dir = os.path.expanduser(payload.directory)
    if not os.path.isdir(target_dir):
        raise HTTPException(status_code=400, detail="El directorio especificado no existe.")

    tracks = []
    audio_exts = {".mp3", ".wav", ".aif", ".aiff", ".flac", ".m4a"}
    
    for root, _, files in os.walk(target_dir):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in audio_exts:
                full_path = os.path.join(root, f)
                tracks.append({
                    "id": full_path,
                    "filename": f,
                    "filepath": full_path,
                    "size": os.path.getsize(full_path),
                    "modified": os.path.getmtime(full_path)
                })

    return {
        "status": "success",
        "directory": target_dir,
        "total_tracks": len(tracks),
        "tracks": tracks
    }

@app.post("/api/audit/batch")
async def audit_batch(payload: BatchAuditRequest):
    """Ejecuta análisis de lote en hilos locales notificando vía WebSocket."""
    total = len(payload.track_paths)
    results = []

    for idx, path in enumerate(payload.track_paths):
        # Notificar progreso en tiempo real
        await telemetry.broadcast({
            "type": "audit_progress",
            "current": idx + 1,
            "total": total,
            "percent": int(((idx + 1) / total) * 100),
            "current_track": os.path.basename(path)
        })
        # Lectura de metadatos locales instantánea
        try:
            meta = MediaService.extract_full_metadata(path) if hasattr(MediaService, "extract_full_metadata") else {}
            results.append({"path": path, "metadata": meta, "status": "ok"})
        except Exception as e:
            results.append({"path": path, "error": str(e), "status": "error"})

    return {
        "status": "complete",
        "processed": len(results),
        "results": results
    }

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await telemetry.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo o recepción de comandos interactivos desde la UI
            await websocket.send_json({"type": "pong", "received": data})
    except WebSocketDisconnect:
        telemetry.disconnect(websocket)

# Montar interfaz frontend React compilada (web/)
WEB_DIR = os.path.join(BASE_DIR, "web")
if os.path.isdir(WEB_DIR):
    app.mount("/", StaticFiles(directory=WEB_DIR, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    print("[BEATWAVE PRO] Arrancando servidor FastAPI en http://127.0.0.1:8000 ...")
    uvicorn.run("server_api:app", host="0.0.0.0", port=8000, reload=False, log_level="info")
