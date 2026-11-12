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
        for connection in list(self.active_connections):
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

class RpcPayload(BaseModel):
    args: Optional[List[Any]] = []
    kwargs: Optional[Dict[str, Any]] = {}

# Lazy loading de main_web para arranque instantáneo sin bloquear imports
_main_web_module = None
_main_event_loop = None

def get_main_web():
    global _main_web_module
    if _main_web_module is None:
        try:
            import main_web
            _main_web_module = main_web

            # Enganchar emisor de progreso hacia el WebSocket de telemetría
            def _ws_actualizar_progreso(pct, msg=""):
                try:
                    payload = {
                        "type": "rpc_callback",
                        "name": "actualizar_progreso_batch",
                        "args": [int(pct), str(msg)]
                    }
                    if _main_event_loop and _main_event_loop.is_running():
                        asyncio.run_coroutine_threadsafe(telemetry.broadcast(payload), _main_event_loop)
                except Exception:
                    pass

            _main_web_module.eel.actualizar_progreso_batch = _ws_actualizar_progreso
            print(f"[FastAPI Engine] Enlazadas {len(_main_web_module.eel._exposed_functions)} funciones RPC locales.")
        except Exception as e:
            print(f"[FastAPI Engine] Error importando main_web: {e}")
            _main_web_module = False
    return _main_web_module if _main_web_module else None

@app.on_event("startup")
async def on_startup():
    global _main_event_loop
    _main_event_loop = asyncio.get_running_loop()
    # Calentar servicios en hilo separado para no ralentizar el arranque
    _main_event_loop.run_in_executor(None, get_main_web)

# --- ENDPOINTS API ---

@app.get("/api/health")
async def health():
    mw = get_main_web()
    exposed_count = len(mw.eel._exposed_functions) if mw and hasattr(mw, "eel") and hasattr(mw.eel, "_exposed_functions") else 0
    return {
        "status": "ok",
        "app": "BEATWAVE PRO",
        "engine": "FastAPI + Uvicorn ASGI",
        "zero_cloud_ingest": True,
        "audio_service": "native-local",
        "version": "2.4.0",
        "exposed_rpc_functions": exposed_count,
        "timestamp": time.time()
    }

@app.get("/eel.js")
async def serve_eel_shim():
    """Shim para que el tag <script src='eel.js'> resuelva 200 OK en entornos web/FastAPI sin error."""
    js_content = "/* BeatWave PRO Eel Shim */ window.eel = window.eel || {};"
    return Response(content=js_content, media_type="application/javascript")

@app.post("/api/rpc/{method_name}")
async def handle_rpc(method_name: str, payload: RpcPayload):
    """Enrutador RPC universal para todas las operaciones de audio, carpetas y auditoría."""
    mw = get_main_web()
    if not mw or not hasattr(mw, "eel") or not hasattr(mw.eel, "_exposed_functions"):
        raise HTTPException(status_code=503, detail="Motor de audio local inicializando...")

    fn = mw.eel._exposed_functions.get(method_name)
    if not fn:
        raise HTTPException(status_code=404, detail=f"Método RPC '{method_name}' no registrado.")

    args = payload.args or []
    kwargs = payload.kwargs or {}

    loop = asyncio.get_running_loop()
    try:
        result = await loop.run_in_executor(None, lambda: fn(*args, **kwargs))
        return {"status": "ok", "method": method_name, "result": result}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"status": "error", "method": method_name, "error": str(e)}
        )

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
    return JSONResponse(status_code=204, content={"message": "Sin carátula"})

@app.get("/stream_audio")
async def stream_audio(request: Request, path: str = Query(...)):
    """Streaming de audio local con soporte Range para reproductor de cabina."""
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Pista no encontrada en disco local")

    file_size = os.path.getsize(path)
    range_header = request.headers.get("range")
    
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

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await telemetry.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
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
