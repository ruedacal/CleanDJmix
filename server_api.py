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
from services.cloud_sync_service import CloudSyncService
from services.copilot_service import copilot_service
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

class SyncPushPayload(BaseModel):
    library_name: Optional[str] = "Mi Biblioteca DJ"
    folders: Optional[List[Dict[str, Any]]] = []
    tracks_metadata: Optional[Dict[str, Any]] = {}

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
    
    # RAM Warm-up: Precargar base de datos de metadatos en memoria RAM en background
    def _run_warmup():
        try:
            from services.audit_service import AuditCacheDB
            db = AuditCacheDB()
            db.warm_up_ram_cache()
        except Exception as e:
            print(f"[WARMUP BG ERROR] {e}")
    _main_event_loop.run_in_executor(None, _run_warmup)

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

@app.post("/api/sync/push")
async def sync_push(payload: SyncPushPayload):
    """Sincroniza el snapshot ligero de carpetas y metadatos (Zero Audio Ingestion)."""
    res = CloudSyncService.push_sync(payload.dict())
    await telemetry.broadcast({
        "type": "sync_event",
        "action": "push",
        "total_tracks": res.get("total_tracks", 0),
        "total_folders": res.get("total_folders", 0),
        "timestamp": res.get("timestamp")
    })
    return res

@app.get("/api/sync/pull")
async def sync_pull():
    """Recupera el último snapshot de metadatos y carpetas del usuario."""
    return CloudSyncService.pull_sync()

@app.get("/api/sync/status")
async def sync_status():
    """Estado y métricas de sincronización ultraligera sin transferencia de audio."""
    return CloudSyncService.get_sync_status()

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
    return Response(status_code=204)

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

    # Escaneo recursivo multinúcleo ultra optimizado con os.scandir (PEP 471)
    from services.audit_service import AuditService, AuditCacheDB
    auditor = AuditService()
    archivos = auditor._escanear_archivos_audio_recursivo(
        target_dir,
        extensiones=(".mp3", ".wav", ".aif", ".aiff", ".flac", ".m4a")
    )

    tracks = [
        {
            "id": item[0],
            "filepath": item[0],
            "filename": item[2],
            "modified": item[3],
            "size": item[4]
        }
        for item in archivos
    ]

    return {
        "status": "success",
        "directory": target_dir,
        "total_tracks": len(tracks),
        "tracks": tracks
    }

@app.get("/api/search")
async def fast_search(q: str = Query(..., min_length=1), limit: int = Query(100, ge=1, le=1000)):
    """
    Búsqueda Full-Text ultra veloz (<0.05ms) sobre RAM Warm-up cache o SQLite (PASO 3 y 4).
    """
    term = q.strip().lower()
    if not term:
        return {"query": q, "total": 0, "results": []}

    results = []
    try:
        from services.audit_service import AuditCacheDB
        db = AuditCacheDB()
        
        # ⚡ 1. Consulta directa en memoria RAM Warm-up si está precalentado (<0.05ms)
        if db.is_warm_ready():
            warm_cache = db.get_warm_cache()
            for fpath, data in warm_cache.items():
                title = str(data.get("title") or data.get("t") or "").lower()
                artist = str(data.get("artist") or data.get("a") or "").lower()
                if term in title or term in artist or term in fpath.lower():
                    results.append(data)
                    if len(results) >= limit:
                        break
        else:
            with db._get_conn() as conn:
                cur = conn.cursor()
                cur.execute(
                    """
                    SELECT filepath, track_json 
                    FROM metadata_cache 
                    WHERE filepath LIKE ? OR track_json LIKE ? 
                    LIMIT ?
                    """,
                    (f"%{term}%", f"%{term}%", limit)
                )
                for row in cur.fetchall():
                    try:
                        data = json.loads(row["track_json"])
                        results.append(data)
                    except Exception:
                        results.append({"filepath": row["filepath"]})
    except Exception as e:
        print(f"[FAST SEARCH ERROR] {e}")

    return {
        "query": q,
        "total": len(results),
        "results": results
    }

@app.get("/api/warmup/status")
async def warmup_status():
    """Estado de precarga en memoria RAM de la base de datos de auditoría."""
    from services.audit_service import AuditCacheDB
    db = AuditCacheDB()
    return {
        "ready": db.is_warm_ready(),
        "total_cached": len(db.get_warm_cache())
    }

@app.post("/api/audit/pause")
async def audit_pause():
    """Pausa en background la auditoría sin quemar CPU ni perder progreso (PASO 5)."""
    mw = get_main_web()
    if mw and hasattr(mw, "audit_svc"):
        mw.audit_svc.pausar_proceso()
    return {"status": "ok", "paused": True}

@app.post("/api/audit/resume")
async def audit_resume():
    """Reanuda la auditoría desde el punto exacto (PASO 5)."""
    mw = get_main_web()
    if mw and hasattr(mw, "audit_svc"):
        mw.audit_svc.reanudar_proceso()
    return {"status": "ok", "paused": False}

@app.post("/api/cancelar_procesos")
@app.post("/api/audit/cancel")
async def audit_cancel():
    """Cancelación suave con commit atómico de lotes procesados a disco."""
    mw = get_main_web()
    if mw and hasattr(mw, "cancelar_procesos_activos"):
        mw.cancelar_procesos_activos()
    elif mw and hasattr(mw, "audit_svc"):
        mw.audit_svc.cancelar_proceso()
    return {"status": "ok", "cancelled": True}

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await telemetry.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({"type": "pong", "received": data})
    except WebSocketDisconnect:
        telemetry.disconnect(websocket)

# ============================================================================
# BEATWAVE LIVE COPILOT: WEBSOCKET 60 FPS & ULTRA LOW-LATENCY REST API (<25ms)
# ============================================================================

class CopilotWebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._loop_task: Optional[asyncio.Task] = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        if self._loop_task is None or self._loop_task.done():
            self._loop_task = asyncio.create_task(self._push_loop())

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def _push_loop(self):
        """Ciclo reactivo a 60 FPS (~16ms) con latencia <25ms y push inmediato."""
        while len(self.active_connections) > 0:
            try:
                state = copilot_service.get_live_state()
                state["server_ts"] = time.time()
                for ws in list(self.active_connections):
                    try:
                        await ws.send_json(state)
                    except Exception:
                        self.disconnect(ws)
            except Exception:
                pass
            await asyncio.sleep(0.016)

copilot_ws_mgr = CopilotWebSocketManager()

@app.websocket("/ws/copilot")
async def websocket_copilot(websocket: WebSocket):
    await copilot_ws_mgr.connect(websocket)
    try:
        # Enviar primer frame de inmediato
        init_state = copilot_service.get_live_state()
        init_state["server_ts"] = time.time()
        await websocket.send_json(init_state)
        while True:
            msg = await websocket.receive_text()
            try:
                data = json.loads(msg)
                action = data.get("action")
                if action == "set_master":
                    copilot_service.set_manual_master(data.get("master", "toggle"))
                elif action == "set_platform":
                    copilot_service.set_platform(data.get("platform", "auto"))
                elif action == "toggle_simulation":
                    copilot_service.simulation_mode = not copilot_service.simulation_mode
                elif action == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "client_ts": data.get("client_ts"),
                        "server_ts": time.time()
                    })
            except Exception:
                pass
    except WebSocketDisconnect:
        copilot_ws_mgr.disconnect(websocket)

@app.get("/api/copilot/status")
async def api_copilot_status():
    """Estado en tiempo real consolidado de cabina DJ (<1ms)."""
    return copilot_service.get_live_state()

@app.get("/api/copilot/stream")
async def api_copilot_stream():
    """Fallback Server-Sent Events (SSE) a 30 FPS cuando WebSocket no está disponible."""
    async def event_generator():
        while True:
            state = copilot_service.get_live_state()
            yield f"data: {json.dumps(state)}\n\n"
            await asyncio.sleep(0.033)
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/copilot/platforms")
async def api_copilot_platforms():
    """Plataformas soportadas y activas (Serato, Rekordbox, VirtualDJ, Traktor)."""
    return {
        "platform_mode": copilot_service.platform_mode,
        "active_platform": copilot_service.detect_active_platform(),
        "platforms": copilot_service.get_available_platforms()
    }

@app.post("/api/copilot/set_platform")
async def api_copilot_set_platform(request: Request):
    platform = "auto"
    try:
        body = await request.json()
        platform = body.get("platform", "auto")
    except Exception:
        platform = request.query_params.get("platform", "auto")
    return copilot_service.set_platform(platform)

@app.post("/api/copilot/set_master")
async def api_copilot_set_master(request: Request):
    master_val = "1"
    try:
        body = await request.json()
        master_val = body.get("master", "1")
    except Exception:
        master_val = request.query_params.get("master", "1")
    return copilot_service.set_manual_master(master_val)

@app.post("/api/copilot/toggle_simulation")
async def api_copilot_toggle_simulation():
    copilot_service.simulation_mode = not copilot_service.simulation_mode
    return copilot_service.get_live_state()

@app.get("/api/copilot/info")
async def api_copilot_info():
    ip = copilot_service.get_local_ip()
    return {
        "local_ip": ip,
        "companion_url": f"http://{ip}:8000/copilot.html",
        "active_platform": copilot_service.detect_active_platform(),
        "platform_mode": copilot_service.platform_mode,
        "platforms": copilot_service.get_available_platforms(),
        "serato_detected": os.path.exists(copilot_service.serato_db_path),
        "serato_db_path": copilot_service.serato_db_path,
        "simulation_mode": copilot_service.simulation_mode
    }

WEB_DIR = os.path.join(BASE_DIR, "web")

@app.get("/copilot")
@app.get("/copilot.html")
async def serve_copilot_page():
    copilot_html = os.path.join(WEB_DIR, "copilot.html")
    if os.path.exists(copilot_html):
        return FileResponse(copilot_html)
    return JSONResponse({"error": "copilot.html no encontrado"}, status_code=404)

# Montar interfaz frontend React compilada (web/)
WEB_DIR = os.path.join(BASE_DIR, "web")
if os.path.isdir(WEB_DIR):
    app.mount("/", StaticFiles(directory=WEB_DIR, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    print("[BEATWAVE PRO] Arrancando servidor FastAPI en http://127.0.0.1:8000 ...")
    uvicorn.run("server_api:app", host="0.0.0.0", port=8000, reload=False, log_level="info")
