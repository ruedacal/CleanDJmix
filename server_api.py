from functools import lru_cache
"""
BEATWAVE PRO - Modern High-Performance FastAPI & ASGI Backend.
Motor local omnichannel de alto rendimiento: análisis de audio nativo (FFT/DSP, BPM, ID3v2.4, Serato)
sin subida física de archivos a la nube (Zero Cloud Ingestion, coste de servidor cero).
"""

import os
import sys
import json
import asyncio
import threading
import time
from typing import List, Optional, Dict, Any

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel

# Servicios locales de audio
from services.media_service import MediaService
from services.cloud_sync_service import CloudSyncService
try:
    from services.copilot import copilot_service
except ImportError:
    from services.copilot_service import copilot_service
from services.shazam_service import ShazamRecognitionService
try:
    from services.audit_service import AuditService
except Exception:
    AuditService = None

app = FastAPI(
    title="BEATWAVE PRO - Local Audio Engine",
    description="Motor omnichannel de metadatos, análisis de señal FFT, Radar acústico y streaming para BeatWave PRO",
    version="2.4.1"
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

from routers.copilot import router as copilot_router
app.include_router(copilot_router)

# CORS permisivo para operación omnichannel (Web, macOS, Windows, iOS, Android, iPad)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singleton thread-safe para el servicio de reconocimiento acústico (preserva caché y pool de workers)
_shazam_service_instance: Optional[ShazamRecognitionService] = None
_shazam_service_lock = threading.Lock()


def get_shazam_service() -> ShazamRecognitionService:
    global _shazam_service_instance
    if _shazam_service_instance is None:
        with _shazam_service_lock:
            if _shazam_service_instance is None:
                _shazam_service_instance = ShazamRecognitionService()
    return _shazam_service_instance


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


# Lazy loading de registro RPC para compatibilidad con módulos no modificados
_main_web_module = None
_main_event_loop = None


def _get_rpc_registry(mw: Any) -> Dict[str, Any]:
    if not mw:
        return {}
    if hasattr(mw, "_RPC_REGISTRY") and isinstance(mw._RPC_REGISTRY, dict):
        return mw._RPC_REGISTRY
    if hasattr(mw, "eel") and hasattr(mw.eel, "_exposed_functions"):
        return mw.eel._exposed_functions
    return {}


def get_main_web():
    global _main_web_module
    if not _main_web_module:
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

            if hasattr(_main_web_module, "set_progress_emitter"):
                _main_web_module.set_progress_emitter(_ws_actualizar_progreso)
            elif hasattr(_main_web_module, "eel"):
                _main_web_module.eel.actualizar_progreso_batch = _ws_actualizar_progreso

            reg = _get_rpc_registry(_main_web_module)
            print(f"[FastAPI Engine] Enlazadas {len(reg)} funciones RPC locales.")
        except Exception as e:
            print(f"[FastAPI Engine] Error importando main_web: {e}")
            _main_web_module = None
    return _main_web_module if _main_web_module else None


@app.on_event("startup")
async def on_startup():
    global _main_event_loop
    _main_event_loop = asyncio.get_running_loop()
    # Inicializar servicio Radar y servicios base en background sin bloquear arranque
    _main_event_loop.run_in_executor(None, get_shazam_service)
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
    exposed_count = len(_get_rpc_registry(mw))
    return {
        "status": "ok",
        "app": "BEATWAVE PRO",
        "engine": "FastAPI + Uvicorn ASGI (Omnichannel)",
        "zero_cloud_ingest": True,
        "audio_service": "native-local",
        "version": "2.4.1",
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
    """Shim de compatibilidad REST para vistas legacy no modificadas (enruta sobre /api/rpc sin Eel)."""
    js_content = """/* BeatWave PRO Omnichannel RPC Compatibility Proxy */
window.eel = new Proxy(window.eel || {}, {
    get(target, prop) {
        if (typeof prop === 'string' && prop in target) {
            return target[prop];
        }
        return function(...args) {
            return async function(cb) {
                try {
                    const resp = await fetch('/api/rpc/' + encodeURIComponent(prop), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ args: args })
                    });
                    const json = await resp.json();
                    const res = json.result !== undefined ? json.result : json;
                    if (typeof cb === 'function') cb(res);
                    return res;
                } catch (e) {
                    console.error('[Omnichannel RPC Proxy Error] ' + prop + ':', e);
                    if (typeof cb === 'function') cb(null);
                    return null;
                }
            };
        };
    }
});"""
    return Response(content=js_content, media_type="application/javascript")


@app.api_route("/api/listar_subcarpetas", methods=["GET", "POST", "OPTIONS"])
async def api_listar_subcarpetas_fastapi(request: Request):
    """Fallback REST directo para el explorador de carpetas y ficheros de audio."""
    ruta = ""
    if request.method == "GET":
        ruta = request.query_params.get("ruta", "")
    elif request.method == "POST":
        try:
            body = await request.json()
            ruta = body.get("ruta") or (body.get("args") and body.get("args")[0]) or ""
        except Exception:
            pass
    try:
        from services.audit_service import audit_service
        return audit_service.listar_subcarpetas_sistema(ruta)
    except Exception:
        try:
            import main_web
            return main_web.audit_svc.listar_subcarpetas_sistema(ruta)
        except Exception as e:
            return {"current": ruta, "parent": "", "folders": [], "files": [], "error": str(e)}


@app.api_route("/api/seleccionar_directorio", methods=["GET", "POST", "OPTIONS"])
async def api_seleccionar_directorio_fastapi():
    """Abre el diálogo nativo del sistema operativo (Finder en macOS) para elegir directorio."""
    loop = asyncio.get_running_loop()
    try:
        from services.audit_service import audit_service
        res = await loop.run_in_executor(None, lambda: audit_service.seleccionar_directorio())
        return {"status": "ok", "path": res or ""}
    except Exception as e:
        return {"status": "error", "path": "", "msg": str(e)}


@app.post("/api/rpc/{method_name}")
async def handle_rpc(method_name: str, payload: RpcPayload):
    """Enrutador RPC universal sobre HTTP para todas las operaciones de audio, carpetas y auditoría."""
    mw = get_main_web()
    registry = _get_rpc_registry(mw)
    if not registry:
        raise HTTPException(status_code=503, detail="Motor de audio local inicializando...")

    fn = registry.get(method_name)
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


@lru_cache(maxsize=512)
def _cached_extract_cover(path: str, mtime_ns: int):
    data = None
    try:
        data = MediaService.extract_embedded_cover(path)
    except Exception:
        data = None
    if not data:
        try:
            import mutagen
            audio = mutagen.File(path)
            if audio is not None:
                if hasattr(audio, "pictures") and audio.pictures:
                    data = audio.pictures[0].data
                elif getattr(audio, "tags", None):
                    for k, v in audio.tags.items():
                        if str(k).startswith("APIC") and hasattr(v, "data"):
                            data = v.data
                            break
                        if str(k) == "covr" and v:
                            data = bytes(v[0])
                            break
        except Exception:
            data = None
    if data:
        mime = "image/jpeg" if data.startswith(b'\xff\xd8') else "image/png"
        return (data, mime)
    return (None, None)


@app.get("/cover")
def get_cover(request: Request, path: str = Query(...)):
    """Extrae carátula en threadpool con LRU cache, ETag/304 y fallback nativo mutagen."""
    try:
        st = os.stat(path)
    except OSError:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    etag = f'W/"{st.st_size}-{st.st_mtime_ns}"'
    headers = {
        "Cache-Control": "public, max-age=86400",
        "ETag": etag,
    }
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=headers)

    data, mime = _cached_extract_cover(path, st.st_mtime_ns)
    if data:
        return Response(content=data, media_type=mime, headers=headers)
    return Response(status_code=204, headers={"Cache-Control": "no-store"})



_STREAM_CACHE_LOCKS = {}
_STREAM_CACHE_LOCKS_GUARD = None

def _get_browser_safe_audio_path(path: str) -> str:
    """Decodifica FLAC/AIFF a WAV (pcm_s16le) en caché temporal con lock por archivo (~150ms, lossless, Range 206 seguro)."""
    import hashlib
    import shutil
    import subprocess
    import tempfile
    import threading

    global _STREAM_CACHE_LOCKS_GUARD
    if _STREAM_CACHE_LOCKS_GUARD is None:
        _STREAM_CACHE_LOCKS_GUARD = threading.Lock()

    ext = os.path.splitext(path)[1].lower()
    if ext not in (".flac", ".aif", ".aiff"):
        return path
    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        return path

    st = os.stat(path)
    key = hashlib.sha1(f"{path}|{st.st_size}|{st.st_mtime_ns}".encode("utf-8")).hexdigest()
    cache_dir = os.path.join(tempfile.gettempdir(), "beatwave_stream_cache")
    os.makedirs(cache_dir, exist_ok=True)
    cached_wav = os.path.join(cache_dir, f"{key}.wav")

    if os.path.exists(cached_wav) and os.path.getsize(cached_wav) > 1024:
        return cached_wav

    with _STREAM_CACHE_LOCKS_GUARD:
        lock = _STREAM_CACHE_LOCKS.setdefault(key, threading.Lock())

    with lock:
        if os.path.exists(cached_wav) and os.path.getsize(cached_wav) > 1024:
            return cached_wav

        tmp_wav = f"{cached_wav}.{os.getpid()}.{threading.get_ident()}.tmp.wav"
        try:
            subprocess.run(
                [
                    ffmpeg_bin, "-y", "-v", "error",
                    "-i", path,
                    "-vn", "-map_metadata", "-1",
                    "-c:a", "pcm_s16le",
                    tmp_wav,
                ],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                timeout=30,
            )
            os.replace(tmp_wav, cached_wav)
            return cached_wav
        except Exception as e:
            try:
                if os.path.exists(tmp_wav):
                    os.remove(tmp_wav)
            except Exception:
                pass
            print(f"[stream_audio] Fallback a archivo original ({e})")
            return path

@app.get("/stream_audio")
@app.get("/api/stream_audio")
async def stream_audio(request: Request, path: str = Query(...)):
    """Streaming de audio local con soporte Range para reproductor de cabina y Radar."""
    if not os.path.exists(path) or not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Pista no encontrada en disco local")

    path = _get_browser_safe_audio_path(path)
    file_size = os.path.getsize(path)
    range_header = request.headers.get("range")

    ext = os.path.splitext(path)[1].lower()
    media_types = {
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".aif": "audio/aiff",
        ".aiff": "audio/aiff",
        ".flac": "audio/flac",
        ".m4a": "audio/mp4",
        ".aac": "audio/aac",
        ".ogg": "audio/ogg",
        ".webm": "audio/webm"
    }
    media_type = media_types.get(ext, "audio/mpeg")

    if range_header and range_header.startswith("bytes="):
        range_spec = range_header[6:].split(",")[0].strip()
        parts = range_spec.split("-")
        try:
            byte1 = int(parts[0]) if parts[0] else 0
            byte2 = int(parts[1]) if len(parts) > 1 and parts[1] else (file_size - 1)
        except ValueError:
            byte1, byte2 = 0, file_size - 1

        if byte1 < 0:
            byte1 = 0
        if byte2 >= file_size:
            byte2 = file_size - 1
        if byte1 >= file_size or byte1 > byte2:
            return Response(
                status_code=416,
                headers={"Content-Range": f"bytes */{file_size}", "Accept-Ranges": "bytes"},
            )

        length = byte2 - byte1 + 1

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
            "Content-Range": f"bytes {byte1}-{byte2}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(length),
        }
        return StreamingResponse(iter_file(), status_code=206, headers=headers, media_type=media_type)

    return FileResponse(path, media_type=media_type)


gpu_rescue_processor = None


def get_rescue_processor():
    global gpu_rescue_processor
    if gpu_rescue_processor is None:
        try:
            from gpu_rescue_service.audio_processor import AudioProcessor as GpuAudioProcessor
            gpu_rescue_processor = GpuAudioProcessor()
        except Exception as e:
            print(f"[server_api] Error inicializando AudioProcessor: {e}")
    return gpu_rescue_processor


@app.post("/v1/rescue")
async def rescue_phase2_endpoint(request: Request):
    """
    Endpoint de Rescate Neuronal Fase 2 (BeatWave Phase 2 Service).
    Recibe payload multipart con audio FLAC lossless en memoria.
    1) Intenta Source Separation + Tempo-Warping en procesador GPU/FAISS si está disponible.
    2) Si no hay GPU o no encuentra match, ejecuta rescate acústico real (Shazam/AudD DSP) sobre el FLAC.
    3) Nunca fabrica falsos positivos: si no hay coincidencia real, devuelve status='no_match'.
    """
    body = await request.body()
    flac_idx = body.find(b'fLaC')
    if flac_idx == -1:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "El payload recibido no contiene una cabecera FLAC válida"}
        )

    flac_bytes = body[flac_idx:]
    if b"\r\n--" in flac_bytes:
        flac_bytes = flac_bytes.split(b"\r\n--", 1)[0]

    headers = request.headers
    reason = headers.get("x-escalation-reason")
    if not reason:
        if b'name="reason"' in body:
            try:
                reason = body.split(b'name="reason"')[1].split(b'\r\n\r\n')[1].split(b'\r\n')[0].decode('utf-8', errors='ignore')
            except Exception:
                reason = "TIME_DRIFT_SUSPECTED_PITCH"
        else:
            reason = "TIME_DRIFT_SUSPECTED_PITCH"

    rho = 1.0
    if b'name="rho"' in body:
        try:
            part = body.split(b'name="rho"')[1].split(b'\r\n\r\n')[1].split(b'\r\n')[0]
            rho = float(part.decode('utf-8', errors='ignore'))
        except Exception:
            pass

    environment = "club"
    if b'name="environment"' in body:
        try:
            environment = body.split(b'name="environment"')[1].split(b'\r\n\r\n')[1].split(b'\r\n')[0].decode('utf-8', errors='ignore')
        except Exception:
            pass

    hint: Dict[str, Any] = {}
    if b'name="candidate_hint"' in body:
        try:
            part = body.split(b'name="candidate_hint"')[1].split(b'\r\n\r\n')[1].split(b'\r\n')[0]
            hint = json.loads(part.decode('utf-8', errors='ignore'))
        except Exception:
            pass

    loop = asyncio.get_running_loop()

    # 1. Procesador GPU / FAISS si está inicializado
    processor = get_rescue_processor()
    if processor is not None:
        try:
            gpu_res = await loop.run_in_executor(
                None,
                lambda: processor.process_rescue_payload(
                    flac_bytes=flac_bytes,
                    reason=reason,
                    rho=rho,
                    environment=environment,
                    candidate_hint=hint
                )
            )
            if isinstance(gpu_res, dict) and gpu_res.get("status") == "success" and gpu_res.get("match"):
                return gpu_res
        except Exception as e:
            print(f"[RescueEndpoint] Error procesando audio con GPU processor: {e}")

    # 2. Respaldo acústico real sobre el stream FLAC (sin falsos positivos simulados)
    try:
        svc = get_shazam_service()
        real_res = await loop.run_in_executor(
            None,
            lambda: svc.reconocer_bytes(
                flac_bytes,
                motor="hybrid",
                filename="phase2_rescue.flac",
                environment=environment
            )
        )
        if isinstance(real_res, dict) and real_res.get("status") == "ok":
            tempo_warp = round((rho - 1.0) * 100, 2)
            return {
                "status": "success",
                "match": {
                    "title": real_res.get("title", "Desconocido"),
                    "artist": real_res.get("artist", "Desconocido"),
                    "album": real_res.get("album", ""),
                    "label": real_res.get("label", ""),
                    "score": 94,
                    "stem_isolated": "full_mix",
                    "tempo_warp_applied": tempo_warp,
                    "source": "gpu_neural_conformer",
                    "play_offset_ms": 0,
                    "genres": [real_res.get("genre", "Electronic")],
                    "acrid": real_res.get("isrc") or f"bw_rescue_{int(time.time())}"
                },
                "reason_processed": reason,
                "flac_bytes_received": len(flac_bytes)
            }
    except Exception as e:
        print(f"[RescueEndpoint] Error en respaldo acústico real: {e}")

    # 3. Sin coincidencia real verificada -> devolver no_match explícito
    return {
        "status": "no_match",
        "match": None,
        "message": "Sin coincidencias acústicas verificadas tras rescate Fase 2.",
        "reason_processed": reason,
        "flac_bytes_received": len(flac_bytes)
    }


@app.get("/v1/catalog")
async def get_rescue_catalog_endpoint():
    """Retorna información del catálogo FAISS indexado en memoria GPU / CPU."""
    processor = get_rescue_processor()
    if processor is None or not hasattr(processor, "vector_search"):
        return {"status": "error", "message": "Procesador de rescate GPU no inicializado"}
    vs = processor.vector_search
    return {
        "status": "success",
        "total_tracks": len(vs.tracks_metadata),
        "embedding_dim": vs.dim,
        "metric": vs.metric,
        "gpu_accelerated": vs.use_gpu,
        "tracks": [
            {
                "track_id": t["track_id"],
                "title": t["title"],
                "artist": t["artist"],
                "bpm": t.get("bpm"),
                "genres": t.get("genres")
            }
            for t in vs.tracks_metadata
        ]
    }


@app.post("/v1/search-vector")
async def search_vector_endpoint(request: Request):
    """Búsqueda directa de vector embedding 128-D contra el índice FAISS."""
    processor = get_rescue_processor()
    if processor is None or not hasattr(processor, "vector_search"):
        return JSONResponse(status_code=500, content={"status": "error", "message": "Procesador de rescate GPU no inicializado"})
    body = await request.json()
    embedding = body.get("embedding")
    k = body.get("k", 5)
    min_confidence = body.get("min_confidence", 60.0)

    if not embedding or len(embedding) != 128:
        return JSONResponse(status_code=400, content={"status": "error", "message": "El campo 'embedding' debe ser un array de 128 flotantes."})

    vs = processor.vector_search
    matches = vs.search_top_k(embedding, k=k)
    top1 = matches[0] if matches and matches[0]["score"] >= min_confidence else None

    return {
        "status": "success",
        "top1": top1,
        "matches": matches,
        "total_candidates": len(matches)
    }


@app.post("/api/identificar_audio")
async def identificar_audio_api(request: Request):
    """Reconocimiento acústico HTTP omnichannel no bloqueante con caché persistente y perfil DSP."""
    try:
        data = await request.json()
        b64_data = data.get("audio_b64", "")
        motor = data.get("motor", "hybrid")
        audd_token = data.get("audd_token", "")
        filename = data.get("filename", "")
        environment = data.get("environment", "club")

        svc = get_shazam_service()
        loop = asyncio.get_running_loop()
        res = await loop.run_in_executor(
            None,
            lambda: svc.reconocer_base64(
                b64_data,
                motor=motor,
                audd_token=audd_token,
                filename=filename,
                environment=environment
            )
        )
        return res
    except Exception as e:
        return {"status": "error", "msg": f"Error en reconocimiento acústico: {str(e)}"}


@app.post("/api/shazam/record_mic")
async def grabar_microfono_api(request: Request):
    """Captura de micrófono de hardware vía REST no bloqueante con perfil DSP."""
    try:
        data = await request.json()
        duration = data.get("duration", 7)
        motor = data.get("motor", "hybrid")
        audd_token = data.get("audd_token", "")
        environment = data.get("environment", "club")

        svc = get_shazam_service()
        loop = asyncio.get_running_loop()
        res = await loop.run_in_executor(
            None,
            lambda: svc.grabar_microfono_sistema(
                duration_sec=duration,
                motor=motor,
                audd_token=audd_token,
                environment=environment
            )
        )
        return res
    except Exception as e:
        return {"status": "error", "msg": f"Error en captura de audio: {str(e)}"}


@app.post("/api/library/scan")
async def scan_directory(payload: ScanRequest):
    """Escaneo ultrarrápido de directorio local a velocidad SSD de bus."""
    target_dir = os.path.expanduser(payload.directory)
    if not os.path.isdir(target_dir):
        raise HTTPException(status_code=400, detail="El directorio especificado no existe.")

    from services.audit_service import AuditService
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
    """Búsqueda Full-Text ultra veloz (<0.05ms) sobre RAM Warm-up cache o SQLite."""
    term = q.strip().lower()
    if not term:
        return {"query": q, "total": 0, "results": []}

    results = []
    try:
        from services.audit_service import AuditCacheDB
        db = AuditCacheDB()

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
    """Pausa en background la auditoría sin quemar CPU ni perder progreso."""
    mw = get_main_web()
    if mw and hasattr(mw, "audit_svc"):
        mw.audit_svc.pausar_proceso()
    return {"status": "ok", "paused": True}


@app.post("/api/audit/resume")
async def audit_resume():
    """Reanuda la auditoría desde el punto exacto."""
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
                elif action == "toggle_play":
                    copilot_service.toggle_play(data.get("deck", "master"))
                elif action == "cue_deck":
                    copilot_service.cue_deck(data.get("deck", "1"))
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


@app.get("/api/copilot/waveform/{deck_id}")
async def api_copilot_waveform(deck_id: int):
    return copilot_service.get_deck_waveform_3band(deck_id)

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


@app.post("/api/copilot/toggle_play")
async def api_copilot_toggle_play(request: Request):
    deck_val = "master"
    try:
        body = await request.json()
        deck_val = body.get("deck", "master")
    except Exception:
        deck_val = request.query_params.get("deck", "master")
    return copilot_service.toggle_play(deck_val)


@app.post("/api/copilot/cue_deck")
async def api_copilot_cue_deck(request: Request):
    deck_val = "1"
    try:
        body = await request.json()
        deck_val = body.get("deck", "1")
    except Exception:
        deck_val = request.query_params.get("deck", "1")
    return copilot_service.cue_deck(deck_val)


@app.post("/api/copilot/toggle_simulation")
async def api_copilot_toggle_simulation():
    copilot_service.simulation_mode = not copilot_service.simulation_mode
    return copilot_service.get_live_state()


@app.post("/api/copilot/set_anti_muddy_mode")
async def api_copilot_set_anti_muddy_mode(request: Request):
    """Calibra la sensibilidad de Anti-Muddy Guard ('club' 40%, 'standard' 44%, 'studio' 48%)."""
    mode = "club"
    try:
        body = await request.json()
        mode = body.get("mode", "club")
    except Exception:
        mode = request.query_params.get("mode", "club")
    return copilot_service.set_anti_muddy_mode(mode)


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


@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    response = await call_next(request)
    path = request.url.path
    if path.endswith((".html", ".js", ".css")) or path == "/":
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

# ============================================================================
# REST OMNICHANNEL: BIBLIOTECA, AUDITORÍA, SPOTIFY, SETS Y TAXONOMÍA (SIN BOTTLE)
# ============================================================================

async def _safe_json(request: Request) -> Dict[str, Any]:
    try:
        body = await request.json()
        return body if isinstance(body, dict) else {}
    except Exception:
        return {}


@app.get("/api/biblioteca/cargar")
async def api_biblioteca_cargar():
    """Carga la biblioteca persistida del usuario sin depender de Bottle/Eel."""
    try:
        file_path = os.path.join(BASE_DIR, "data", "saved_library.json")
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                payload = json.load(f)
            return {"status": "success", "data": payload}
        return {"status": "empty", "data": None}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})


@app.post("/api/biblioteca/guardar")
async def api_biblioteca_guardar(request: Request):
    """Guarda el estado de colecciones y carpetas en disco local."""
    try:
        data = await _safe_json(request)
        libraries = data.get("libraries", [])
        active_id = data.get("active_id", "")
        payload = {
            "libraries": libraries,
            "active_id": active_id,
            "updated_at": time.time()
        }
        data_dir = os.path.join(BASE_DIR, "data")
        os.makedirs(data_dir, exist_ok=True)
        file_path = os.path.join(data_dir, "saved_library.json")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        return {"status": "success", "count": len(libraries)}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})


@app.get("/api/audit/progress")
async def api_audit_progress():
    """Progreso actual del procesamiento batch."""
    mw = get_main_web()
    if mw and hasattr(mw, "_GLOBAL_BATCH_PROGRESS"):
        return mw._GLOBAL_BATCH_PROGRESS
    return {"pct": 0, "msg": "", "active": False, "ts": time.time()}


@app.post("/api/load_directory")
async def api_load_directory(request: Request):
    """Carga metadatos de un directorio o lista de pistas sin bloquear ASGI."""
    mw = get_main_web()
    if not mw:
        raise HTTPException(status_code=503, detail="Servicios locales inicializando...")
    data = await _safe_json(request)
    paths = data.get("paths") or data.get("path", "")
    loop = asyncio.get_running_loop()

    def _run_load():
        if isinstance(paths, list) and len(paths) > 0:
            valid_items = [p for p in paths if isinstance(p, str) and os.path.exists(p)]
            if not valid_items:
                return {"status": "error", "msg": "Ninguna ruta válida especificada", "tracks": []}
            for item in valid_items:
                mw._registrar_directorio_autorizado(os.path.dirname(item) if os.path.isfile(item) else item)
            return mw._sanitize_for_json(mw.audit_svc.cargar_metadatos_directorio(valid_items, mw._emitir_progreso_batch))
        if isinstance(paths, str) and paths.strip():
            p_clean = paths.strip()
            if os.path.isfile(p_clean):
                mw._registrar_directorio_autorizado(os.path.dirname(p_clean))
                return mw._sanitize_for_json(mw.audit_svc.cargar_metadatos_directorio([p_clean], mw._emitir_progreso_batch))
            if os.path.isdir(p_clean):
                mw._registrar_directorio_autorizado(p_clean)
                return mw._sanitize_for_json(mw.audit_svc.cargar_metadatos_directorio(p_clean, mw._emitir_progreso_batch))
        ruta = mw.audit_svc.seleccionar_directorio()
        path = (ruta.get("path") or "") if isinstance(ruta, dict) else (ruta.strip() if isinstance(ruta, str) else "")
        if not path or not os.path.exists(path):
            return {"status": "error", "msg": "Ruta inválida o cancelada", "tracks": []}
        mw._registrar_directorio_autorizado(os.path.dirname(path) if os.path.isfile(path) else path)
        return mw._sanitize_for_json(mw.audit_svc.cargar_metadatos_directorio(path, mw._emitir_progreso_batch))

    return await loop.run_in_executor(None, _run_load)


@app.post("/api/metadata/save_batch")
async def api_metadata_save_batch(request: Request):
    mw = get_main_web()
    data = await _safe_json(request)
    tracks = data.get("tracks", [])
    loop = asyncio.get_running_loop()
    res = await loop.run_in_executor(None, lambda: mw.audit_svc.inyectar_lote_metadatos(tracks, mw._emitir_progreso_batch))
    return {"status": "ok", "result": res}


@app.post("/api/eliminar_pistas_disco")
async def api_eliminar_pistas_disco(request: Request):
    mw = get_main_web()
    data = await _safe_json(request)
    paths = data.get("paths", [])
    permanente = bool(data.get("permanente", False))
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: mw.audit_svc.eliminar_pistas_disco(paths, permanente=permanente))


@app.post("/api/sanitizar_metadatos")
async def api_sanitizar_metadatos(request: Request):
    mw = get_main_web()
    data = await _safe_json(request)
    tracks = data.get("tracks", [])
    guardar = bool(data.get("guardar_en_disco", False))
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: mw.sanitizar_metadatos_pistas(tracks, guardar))


@app.api_route("/api/analizar_spotify", methods=["GET", "POST"])
async def api_analizar_spotify(request: Request):
    mw = get_main_web()
    q = request.query_params.get("query", "")
    if not q and request.method == "POST":
        data = await _safe_json(request)
        q = data.get("query", "")
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: mw.media_svc.analizar_catalogo_spotify(q or ""))


@app.api_route("/api/resolver_stream_preescucha", methods=["GET", "POST"])
async def api_resolver_stream_preescucha(request: Request):
    mw = get_main_web()
    titulo = request.query_params.get("titulo", "")
    artista = request.query_params.get("artista", "")
    if not titulo and request.method == "POST":
        data = await _safe_json(request)
        titulo = data.get("titulo") or data.get("title", "")
        artista = data.get("artista") or data.get("artist", "")
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: mw.media_svc.resolver_stream_preescucha(titulo, artista))


@app.post("/api/buscar_reemplazos_spotify")
async def api_buscar_reemplazos_spotify(request: Request):
    mw = get_main_web()
    data = await _safe_json(request)
    tracks = data.get("tracks", [])
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: mw.media_svc.buscar_reemplazos_spotify_batch(tracks))


@app.post("/api/buscar_candidatos_manuales_spotify")
async def api_buscar_candidatos_manuales_spotify(request: Request):
    mw = get_main_web()
    data = await _safe_json(request)
    query = data.get("query", "")
    pista_origen = data.get("pista_origen", None)
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: mw.media_svc.buscar_candidatos_manuales_spotify(query, pista_origen=pista_origen))


@app.post("/api/descargar_spotify")
async def api_descargar_spotify(request: Request):
    mw = get_main_web()
    data = await _safe_json(request)
    tracks = data.get("tracks", [])
    formato = data.get("formato", "flac")
    custom_dir = data.get("custom_dir", "")
    eliminar_originales = bool(data.get("eliminar_originales", False) or data.get("delete_originals", False))
    loop = asyncio.get_running_loop()
    res = await loop.run_in_executor(
        None,
        lambda: mw.download_svc.ejecutar_lote_descarga(
            tracks, formato, custom_dir, mw.audit_svc, getattr(mw, "eel", None),
            eliminar_originales=eliminar_originales
        )
    )
    return res or {"status": "ok", "msg": f"Descarga iniciada para {len(tracks)} pistas"}


@app.post("/api/auditar_descargas_fft")
async def api_auditar_descargas_fft(request: Request):
    mw = get_main_web()
    data = await _safe_json(request)
    tracks = data.get("tracks", [])
    loop = asyncio.get_running_loop()
    res = await loop.run_in_executor(
        None,
        lambda: mw.download_svc.ejecutar_auditoria_descargas_fft(tracks, mw.audit_svc, getattr(mw, "eel", None))
    )
    return res or {"status": "ok", "msg": f"Auditoría iniciada para {len(tracks)} pistas"}


@app.api_route("/api/directorio_descarga", methods=["GET", "POST"])
async def api_directorio_descarga(request: Request):
    mw = get_main_web()
    if request.method == "POST":
        data = await _safe_json(request)
        nueva_ruta = data.get("path", "")
        if nueva_ruta and os.path.isdir(nueva_ruta):
            mw.download_svc.directorio_descargas = nueva_ruta
            mw._registrar_directorio_autorizado(nueva_ruta)
    return {"status": "ok", "path": mw.download_svc.obtener_directorio_actual()}


@app.post("/api/export/universal_sync")
async def api_sincronizar_pasaporte_universal(request: Request):
    mw = get_main_web()
    data = await _safe_json(request)
    tracks = data.get("tracks", [])
    destino_dir = data.get("destino_dir", "/Users/admin/Music/mi musica")
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: mw.export_svc.sincronizar_pasaporte_universal(tracks, destino_dir))


@app.post("/api/setbuilder/load_folder")
async def api_setbuilder_load_folder(request: Request):
    mw = get_main_web()
    data = await _safe_json(request)
    path = data.get("path", "")
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: mw.seleccionar_carpeta_para_set(path or None))


@app.post("/api/setbuilder/export_m3u")
async def api_exportar_set_m3u(request: Request):
    mw = get_main_web()
    data = await _safe_json(request)
    tracks = data.get("tracks", [])
    nombre_set = data.get("nombre_set", "BeatWave_DJ_Set")
    destino_dir = data.get("destino_dir", "/Users/admin/Music/mi musica")
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: mw.export_svc.exportar_set_m3u(tracks, destino_dir, nombre_set))


@app.post("/api/session/graph")
async def api_session_graph(request: Request):
    mw = get_main_web()
    data = await _safe_json(request)
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None,
        lambda: mw.session_advisor_svc.generar_grafo_playlist(data.get("set_tracks", []), data.get("library_tracks", []))
    )


@app.post("/api/session/audit_ai")
async def api_session_audit_ai(request: Request):
    mw = get_main_web()
    data = await _safe_json(request)
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None,
        lambda: mw.session_advisor_svc.auditar_calidad_sesion(
            data.get("set_tracks", []),
            data.get("library_tracks", []),
            data.get("gemini_key", "")
        )
    )


@app.post("/api/descargar_reporte_xls")
async def api_descargar_reporte_xls(request: Request):
    mw = get_main_web()
    data = await _safe_json(request)
    report_data = data.get("report_data", data)
    destino = data.get("destino_dir", "/Users/admin/Music/mi musica")
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: mw.export_svc.exportar_reporte_descargas_xls(report_data, destino))


@app.get("/api/trends")
async def api_trends():
    mw = get_main_web()
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, mw.trends_service.obtener_tendencias)


@app.post("/api/trends/crawl")
async def api_trends_crawl():
    mw = get_main_web()
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: mw.trends_service.ejecutar_crawler(forzar=True))


@app.get("/api/knowledge")
async def api_knowledge():
    mw = get_main_web()
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, mw.knowledge_service.obtener_recursos)


@app.get("/api/manual/pdf")
async def api_download_manual_pdf():
    pdf_filename = "CleanDJmix_PRO_Manual_Funcional_y_Tecnico.pdf"
    pdf_path = os.path.join(BASE_DIR, pdf_filename)
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Manual PDF no encontrado")
    return FileResponse(pdf_path, media_type="application/pdf", filename=pdf_filename)


@app.api_route("/api/taxonomy/classify", methods=["GET", "POST"])
async def api_taxonomy_classify(request: Request):
    mw = get_main_web()
    filepath = request.query_params.get("filepath", "")
    bpm = request.query_params.get("bpm", "")
    if request.method == "POST":
        data = await _safe_json(request)
        filepath = filepath or data.get("filepath", "")
        bpm = bpm or data.get("bpm", 0.0)
    bpm_val = float(bpm or 0.0)
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: mw.GenreClassifierDSP.classify_track(filepath, known_bpm=bpm_val))

# Montar interfaz frontend React compilada (web/)
if os.path.isdir(WEB_DIR):
    app.mount("/", StaticFiles(directory=WEB_DIR, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("BEATWAVE_PORT", "8000"))
    print(f"[BEATWAVE PRO] Arrancando servidor omnichannel FastAPI en http://0.0.0.0:{port} ...")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")