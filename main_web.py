import sys
import os
import secrets
import uuid

# Asegurar que el directorio raíz del proyecto esté en sys.path y como cwd
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
os.chdir(BASE_DIR)

import subprocess
import atexit
import json
import eel
import bottle

# ─── SEGURIDAD: Token de sesión efímero para el modo remoto (tablet/móvil) ───
# Si el servidor escucha en 0.0.0.0 (--remote), los endpoints de mutación
# exigen este token como cabecera X-Session-Token o parámetro ?token=
_REMOTE_MODE = False          # se activa con el argumento --remote al arrancar
_SESSION_TOKEN: str = secrets.token_hex(24)   # 48 caracteres hex aleatorios
_PORT: int = 8000

def _cors_localhost_only():
    """Establece cabeceras CORS restringidas al origen localhost."""
    origin = bottle.request.environ.get("HTTP_ORIGIN", "")
    # Permitimos solo orígenes del propio host local
    allowed_origins = {
        f"http://localhost:{_PORT}", f"http://127.0.0.1:{_PORT}",
        "http://localhost:8000", "http://127.0.0.1:8000",
        "http://localhost",      "http://127.0.0.1",
    }
    if origin in allowed_origins:
        bottle.response.set_header("Access-Control-Allow-Origin", origin)
    else:
        # Sin cabecera → el navegador bloqueará peticiones cross-origin no locales
        pass
    bottle.response.set_header("Access-Control-Allow-Headers", "X-Session-Token, Content-Type, Range")
    bottle.response.set_header("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS")
    bottle.response.set_header("Vary", "Origin")

# Directorios base autorizados para servir archivos. Se amplían dinámicamente.
_DIRECTORIOS_AUTORIZADOS: list = []

def _registrar_directorio_autorizado(ruta: str):
    """Registra un directorio de música como autorizado para servir archivos."""
    try:
        real = os.path.realpath(os.path.expanduser(ruta))
        if real and os.path.isdir(real) and real not in _DIRECTORIOS_AUTORIZADOS:
            _DIRECTORIOS_AUTORIZADOS.append(real)
    except Exception:
        pass

# Pre-autorizar bibliotecas de audio del sistema por defecto para arranque inmediato
_registrar_directorio_autorizado("/Users/admin/Music/mi musica")
_registrar_directorio_autorizado("~/Music")
_registrar_directorio_autorizado("~/Downloads")

def es_ruta_segura(ruta_solicitada: str) -> bool:
    """
    Verifica que la ruta resuelta pertenezca a alguno de los directorios
    autorizados (biblioteca de música o carpeta de descargas).
    Rechaza cualquier intento de path-traversal o acceso a rutas del sistema.

    Returns True si la ruta es segura, False en caso contrario.
    """
    if not ruta_solicitada:
        return False
    real = os.path.realpath(ruta_solicitada)
    if not os.path.isfile(real):
        return False
    for base in _DIRECTORIOS_AUTORIZADOS:
        try:
            common = os.path.commonpath([real, base])
            if common == base:
                return True
        except ValueError:
            continue
    return False

def _verificar_token_remoto():
    """
    En modo remoto verifica que la petición incluya el token de sesión.
    Devuelve None si es válido o una respuesta HTTP 403 si no lo es.
    """
    if not _REMOTE_MODE:
        return None
    token = (
        bottle.request.headers.get("X-Session-Token", "")
        or bottle.request.query.get("token", "")
        or (bottle.request.json or {}).get("token", "")
    )
    if not secrets.compare_digest(token, _SESSION_TOKEN):
        bottle.response.status = 403
        return {"status": "error", "msg": "Token de sesión inválido o ausente."}

# CRÍTICO: Permitir subidas de audio en Base64 desde micrófono y archivos (hasta 50 MB)
# Evita el fallo HTTP 413 ('Request entity too large') que bloqueaba la escucha de Shazam (100 KB por defecto)
bottle.BaseRequest.MEMFILE_MAX = 50 * 1024 * 1024

from services.audio_service import AudioPlaybackService
from services.audit_service import AuditService
from services.media_service import MediaService
from services.download_service import DownloadService
from services.export_service import ExportService
from application.taxonomy_service import TaxonomyService
from services.shazam_service import ShazamRecognitionService
from services.tag_sanitizer_service import TagSanitizerService
from services.trends_service import trends_service
from services.knowledge_service import knowledge_service
from services.genre_classifier_service import GenreClassifierDSP
from services.copilot_service import copilot_service
from services.session_graph_advisor_service import SessionGraphAdvisorService

def compilar_frontend_si_necesario():
    jsx_path = os.path.join("web", "js", "app.jsx")
    bundle_path = os.path.join("web", "js", "app.bundle.js")
    if os.path.exists(jsx_path):
        if not os.path.exists(bundle_path) or os.path.getmtime(jsx_path) > os.path.getmtime(bundle_path):
            try:
                subprocess.run(
                    [
                        "npx", "-y", "esbuild", jsx_path,
                        f"--outfile={bundle_path}",
                        "--bundle",
                        "--loader:.jsx=jsx",
                        "--loader:.js=jsx",
                        "--target=es2019",
                        '--define:process.env.NODE_ENV="production"'
                    ],
                    check=False,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
            except Exception:
                pass

    copilot_jsx = os.path.join("web", "js", "copilot.jsx")
    copilot_bundle = os.path.join("web", "js", "copilot.bundle.js")
    if os.path.exists(copilot_jsx):
        if not os.path.exists(copilot_bundle) or os.path.getmtime(copilot_jsx) > os.path.getmtime(copilot_bundle):
            try:
                subprocess.run(
                    [
                        "npx", "-y", "esbuild", copilot_jsx,
                        f"--outfile={copilot_bundle}",
                        "--bundle",
                        "--loader:.jsx=jsx",
                        "--loader:.js=jsx",
                        "--target=es2019",
                        '--define:process.env.NODE_ENV="production"'
                    ],
                    check=False,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
            except Exception:
                pass

compilar_frontend_si_necesario()

eel.init("web")

audio_playback_svc = AudioPlaybackService()
audit_svc = AuditService()
audit_svc.set_playback_checker(lambda: audio_playback_svc.esta_reproduciendo())
media_svc = MediaService()
download_svc = DownloadService()
export_svc = ExportService()
taxonomy_svc = TaxonomyService()
shazam_svc = ShazamRecognitionService()
session_advisor_svc = SessionGraphAdvisorService()

def _decodificar_parametro_ruta(raw_val: str) -> str:
    """
    Decodifica parámetros de ruta enviados por HTTP query string.
    Resuelve la incompatibilidad de Bottle (PEP 3333) donde bytes UTF-8 en QUERY_STRING
    son interpretados como latin-1 (creando caracteres corruptos 'mojibake' como Ã± o Ãº).
    """
    if not raw_val:
        return ""
    import urllib.parse
    unquoted = urllib.parse.unquote(raw_val)
    try:
        val = unquoted.encode('latin1').decode('utf-8')
    except (UnicodeEncodeError, UnicodeDecodeError):
        val = unquoted
    return val

@bottle.route('/cover')
@bottle.route('/cover', method='OPTIONS')
def get_cover():
    _cors_localhost_only()
    if bottle.request.method == 'OPTIONS':
        bottle.response.status = 204
        return ""
    raw_path = bottle.request.query.get('path', '')
    thumb_str = bottle.request.query.get('thumb', '')
    thumb_size = 96 if thumb_str in ('1', 'true', '96') else (int(thumb_str) if thumb_str.isdigit() else None)
    file_path = _decodificar_parametro_ruta(raw_path)
    real_path = audio_playback_svc._resolver_ruta(file_path) if file_path else ''
    target = real_path if real_path else file_path

    # ── Seguridad: bloquear path-traversal fuera de directorios autorizados ──
    if target and not es_ruta_segura(target):
        # Si no hay directorios registrados aún (arranque frío), solo validamos
        # que no sea una ruta de sistema crítico
        ruta_real_abs = os.path.realpath(target) if target else ''
        rutas_sistema = ['/etc', '/usr', '/bin', '/sbin', '/System', '/private',
                         '/Library/Keychains', os.path.expanduser('~/.ssh'),
                         os.path.expanduser('~/.gnupg')]
        if any(ruta_real_abs.startswith(r) for r in rutas_sistema):
            bottle.response.status = 403
            return "Acceso denegado"

    data, mime = media_svc.obtener_caratula_binaria(target, thumbnail_size=thumb_size)
    if data and mime:
        bottle.response.content_type = mime
        bottle.response.set_header("Cache-Control", "public, max-age=86400")
        return data

    # Fallback local SVG offline seguro (cero llamadas de red externas a placehold.co)
    svg_fallback = (
        b'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">'
        b'<rect width="100" height="100" fill="#14141c"/>'
        b'<circle cx="50" cy="50" r="36" fill="#09090e" stroke="#22d3ee" stroke-width="2"/>'
        b'<circle cx="50" cy="50" r="14" fill="#181822" stroke="#22d3ee" stroke-width="1.5"/>'
        b'<circle cx="50" cy="50" r="4" fill="#22d3ee"/>'
        b'<text x="50" y="90" font-family="monospace" font-size="9" font-weight="bold" fill="#22d3ee" text-anchor="middle">BEATWAVE</text>'
        b'</svg>'
    )
    bottle.response.content_type = "image/svg+xml"
    return svg_fallback

@bottle.route('/stream_audio')
@bottle.route('/stream_audio', method='OPTIONS')
def stream_audio():
    _cors_localhost_only()
    if bottle.request.method == 'OPTIONS':
        bottle.response.status = 204
        return ""
    raw_path = bottle.request.query.get('path', '')
    file_path = _decodificar_parametro_ruta(raw_path)
    if file_path:
        # ── Snippets de preescucha local descargados en web/previews ──
        if file_path.startswith('/previews/') or file_path.startswith('previews/') or 'prev_' in file_path:
            clean_name = os.path.basename(file_path)
            previews_dir = os.path.join(BASE_DIR, "web", "previews")
            preview_file = os.path.join(previews_dir, clean_name)
            if os.path.exists(preview_file) and os.path.isfile(preview_file):
                ext = os.path.splitext(clean_name)[1].lower()
                mime_map = {
                    '.flac': 'audio/flac',
                    '.mp3': 'audio/mpeg',
                    '.wav': 'audio/wav',
                    '.m4a': 'audio/mp4',
                    '.aac': 'audio/aac',
                    '.webm': 'audio/webm'
                }
                return bottle.static_file(clean_name, root=previews_dir, mimetype=mime_map.get(ext, 'audio/mpeg'))

        real_path = audio_playback_svc._resolver_ruta(file_path)
        if real_path and os.path.exists(real_path) and os.path.isfile(real_path):
            # ── Seguridad: verificar que el archivo pertenece a un directorio autorizado ──
            if not es_ruta_segura(real_path):
                # Si la colección aún no se ha registrado, permitir si la ruta no es de sistema
                ruta_real_abs = os.path.realpath(real_path)
                rutas_sistema = ['/etc', '/usr', '/bin', '/sbin', '/System', '/private',
                                 '/Library/Keychains', os.path.expanduser('~/.ssh'),
                                 os.path.expanduser('~/.gnupg')]
                if any(ruta_real_abs.startswith(r) for r in rutas_sistema):
                    bottle.response.status = 403
                    return "Acceso denegado"
            dir_name = os.path.dirname(real_path)
            file_name = os.path.basename(real_path)
            ext = os.path.splitext(file_name)[1].lower()
            mime_map = {
                '.flac': 'audio/flac',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.m4a': 'audio/mp4',
                '.aac': 'audio/aac',
                '.ogg': 'audio/ogg',
                '.aiff': 'audio/aiff',
                '.aif': 'audio/aiff'
            }
            mime = mime_map.get(ext, 'audio/mpeg')
            return bottle.static_file(file_name, root=dir_name, mimetype=mime)
    bottle.response.status = 404
    return "Audio file not found"

@bottle.route('/previews/<filename:path>')
def serve_previews(filename):
    _cors_localhost_only()
    clean_name = os.path.basename(filename)
    previews_dir = os.path.join(BASE_DIR, "web", "previews")
    return bottle.static_file(clean_name, root=previews_dir)

def _sanitize_for_json(data):
    """Sanitiza estructuras para JSON. Optimizado: si ya es válido UTF-8 no realiza recorrido recursivo en Python."""
    try:
        json.dumps(data)
        return data
    except (UnicodeEncodeError, ValueError, TypeError):
        pass

    def _clean(obj):
        if isinstance(obj, str):
            return obj.encode('utf-8', 'ignore').decode('utf-8', 'ignore')
        elif isinstance(obj, dict):
            return {_clean(k): _clean(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [_clean(item) for item in obj]
        return obj

    return _clean(data)

def _emitir_log_ui(mensaje: str):
    clean = str(mensaje).encode('utf-8', 'ignore').decode('utf-8', 'ignore')
    print(f"[CleanDJmix PRO] {clean}")
    try:
        eel.log_to_console(clean)
    except Exception:
        pass

_GLOBAL_BATCH_PROGRESS = {"pct": 0, "msg": "", "active": False, "ts": time.time()}

def _emitir_progreso_batch(pct: int, msg: str):
    global _GLOBAL_BATCH_PROGRESS
    try:
        clean_msg = str(msg).encode('utf-8', 'ignore').decode('utf-8', 'ignore')
        _GLOBAL_BATCH_PROGRESS["pct"] = int(pct)
        _GLOBAL_BATCH_PROGRESS["msg"] = clean_msg
        _GLOBAL_BATCH_PROGRESS["active"] = (int(pct) > 0 and int(pct) < 100)
        _GLOBAL_BATCH_PROGRESS["ts"] = time.time()

        try:
            if hasattr(eel, "actualizar_progreso_batch"):
                eel.actualizar_progreso_batch(int(pct), clean_msg)
            elif hasattr(eel, "_import_js_function"):
                fn = eel._import_js_function("actualizar_progreso_batch")
                if fn:
                    fn(int(pct), clean_msg)
            elif hasattr(eel, "_js_call"):
                eel._js_call("actualizar_progreso_batch", (int(pct), clean_msg))
        except Exception:
            pass

        try:
            eel.sleep(0.001)
        except Exception:
            pass
    except Exception as e:
        print(f"[PROGRESS ERROR] {e}")

@eel.expose
def reproducir_pista_mac(nombre_archivo):
    return audio_playback_svc.reproducir_mac(nombre_archivo)

@eel.expose
def detener_audio_mac():
    return audio_playback_svc.detener_mac()

@eel.expose
def cue_audio_mac(nombre_archivo=""):
    return audio_playback_svc.cue_mac(nombre_archivo)

atexit.register(lambda: audio_playback_svc.detener_mac())

@eel.expose
def seleccionar_directorio(prompt="Selecciona tu carpeta de música DJ (FLAC, MP3, WAV):"):
    return audit_svc.seleccionar_directorio(prompt)

@eel.expose
def crear_biblioteca_en_disco(nombre_biblioteca, estructura_carpetas, destino_dir):
    return export_svc.crear_biblioteca_en_disco(nombre_biblioteca, estructura_carpetas, destino_dir)

@eel.expose
def listar_subcarpetas_sistema(ruta_base=""):
    return audit_svc.listar_subcarpetas_sistema(ruta_base)

@eel.expose
def cargar_metadatos_directorio(ruta_directorio):
    if isinstance(ruta_directorio, (list, tuple)) and len(ruta_directorio) > 0:
        dir_base = os.path.dirname(ruta_directorio[0])
        audio_playback_svc.establecer_directorio(dir_base)
        _registrar_directorio_autorizado(dir_base)
    elif isinstance(ruta_directorio, str):
        audio_playback_svc.establecer_directorio(ruta_directorio)
        _registrar_directorio_autorizado(ruta_directorio)
    return _sanitize_for_json(audit_svc.cargar_metadatos_directorio(ruta_directorio, _emitir_progreso_batch))

@bottle.route('/api/load_directory', method=['POST', 'OPTIONS'])
def api_load_directory():
    _cors_localhost_only()
    if bottle.request.method == 'OPTIONS':
        bottle.response.status = 204
        return ""
    data = bottle.request.json or {}
    path = data.get("path", "")
    if not path or not os.path.isdir(path):
        ruta = audit_svc.seleccionar_directorio()
        if isinstance(ruta, dict):
            path = ruta.get("path") or ""
        elif isinstance(ruta, str):
            path = ruta.strip()
    if not path or not os.path.isdir(path):
        return {"status": "error", "msg": "Ruta inválida o cancelada", "tracks": []}
    _registrar_directorio_autorizado(path)
    res = audit_svc.cargar_metadatos_directorio(path, _emitir_progreso_batch)
    return _sanitize_for_json(res)

@bottle.route('/api/audit/progress', method=['GET', 'OPTIONS'])
def api_audit_progress():
    _cors_localhost_only()
    if bottle.request.method == 'OPTIONS':
        bottle.response.status = 204
        return ""
    bottle.response.content_type = 'application/json'
    return json.dumps(_GLOBAL_BATCH_PROGRESS)

@eel.expose
def iniciar_auditoria(ruta_directorio, opts=None):
    if isinstance(ruta_directorio, (list, tuple)) and len(ruta_directorio) > 0:
        dir_base = os.path.dirname(ruta_directorio[0])
        audio_playback_svc.establecer_directorio(dir_base)
        _registrar_directorio_autorizado(dir_base)
    elif isinstance(ruta_directorio, str):
        audio_playback_svc.establecer_directorio(ruta_directorio)
        _registrar_directorio_autorizado(ruta_directorio)
    return audit_svc.iniciar_auditoria(ruta_directorio, _emitir_log_ui, _emitir_progreso_batch, opts=opts)

@eel.expose
def ejecutar_auditoria_lote(ruta_directorio, opts=None):
    if isinstance(ruta_directorio, (list, tuple)) and len(ruta_directorio) > 0:
        audio_playback_svc.establecer_directorio(os.path.dirname(ruta_directorio[0]))
    elif isinstance(ruta_directorio, str):
        audio_playback_svc.establecer_directorio(ruta_directorio)
    return audit_svc.iniciar_auditoria(ruta_directorio, _emitir_log_ui, _emitir_progreso_batch, opts=opts)

@eel.expose
def analizar_espectro_fft(filepath, spotify_id=None):
    return audit_svc.analizar_espectro_fft(filepath, spotify_id)

@eel.expose
def calcular_trim_downbeat_track(filepath, track_id=None):
    return audit_svc.analizar_trim_downbeat(filepath, track_id)

@eel.expose
def detectar_bpm_tonalidad_local(filepath):
    """Calcula BPM y escala Camelot localmente vía Librosa/FFT (100% offline)."""
    return audit_svc.detectar_bpm_tonalidad_librosa(filepath)

@eel.expose
def calcular_hot_cues_fraseo(duration_ms, bpm, downbeat_ms=0):
    from infrastructure.audio_processor import AudioProcessorService
    return AudioProcessorService.calcular_8_hot_cues_fraseo(
        duration_ms=int(duration_ms) if duration_ms else 300000,
        bpm=float(bpm) if bpm else 128.0,
        downbeat_ms=int(downbeat_ms) if downbeat_ms else 0
    )

@eel.expose
def exportar_auditoria_xls(tracks, destino_dir="/Users/admin/Music/mi musica"):
    return export_svc.exportar_tracks_xls(tracks, destino_dir)

@eel.expose
def inyectar_lote_metadatos(tracks):
    return audit_svc.inyectar_lote_metadatos(tracks, _emitir_progreso_batch)

@eel.expose
def inyectar_caratulas_lote(tracks):
    return audit_svc.inyectar_caratulas_lote(tracks, _emitir_progreso_batch)

@eel.expose
def detectar_duplicados_biblioteca(tracks=None, proteger_versiones_hermanas=True):
    if not tracks:
        res_dir = audit_svc.cargar_metadatos_directorio(audit_svc.directorio_actual)
        tracks = res_dir.get("tracks", [])
    return audit_svc.detectar_duplicados_biblioteca(tracks, proteger_versiones_hermanas=proteger_versiones_hermanas)

@eel.expose
def eliminar_pistas_duplicadas(paths):
    return audit_svc.eliminar_pistas_duplicadas(paths)

@eel.expose
def eliminar_pistas_disco(paths, permanente=False):
    """Elimina pistas físicas del disco o las traslada a la Papelera de reciclaje."""
    return audit_svc.eliminar_pistas_disco(paths, permanente=permanente)

@bottle.route('/api/eliminar_pistas_disco', method=['POST', 'OPTIONS'])
def api_eliminar_pistas_disco():
    _cors_localhost_only()
    if bottle.request.method == 'OPTIONS':
        bottle.response.status = 204
        return ""
    auth_err = _verificar_token_remoto()
    if auth_err:
        return auth_err
    data = bottle.request.json or {}
    paths = data.get("paths", [])
    permanente = bool(data.get("permanente", False))
    return audit_svc.eliminar_pistas_disco(paths, permanente=permanente)

@eel.expose
def guardar_cambios_track(track):
    if not track or not isinstance(track, dict):
        return {"status": "error", "msg": "Datos inválidos"}
    path = track.get("path")
    if not path or not os.path.exists(path):
        real_path = audio_playback_svc._resolver_ruta(track.get("f", "") or track.get("filename", ""))
        if real_path and os.path.exists(real_path):
            path = real_path
        else:
            return {"status": "error", "msg": "Archivo no encontrado en disco"}
    try:
        from infrastructure.audio_processor import AudioProcessorService
        ok = AudioProcessorService.escribir_metadatos_pro(path, track)
        return {"status": "ok" if ok else "error"}
    except Exception as e:
        print(f"[ERROR GUARDAR TRACK] {e}")
        return {"status": "error", "msg": str(e)}

@eel.expose
def analizar_url_spotify(spotify_url):
    return media_svc.analizar_catalogo_spotify(spotify_url)

@eel.expose
def descargar_track_spotify_flac(meta, dest=None, eliminar_originales=False):
    return download_svc.ejecutar_lote_descarga([meta], "flac", dest or "", audit_svc, eel, eliminar_originales=eliminar_originales)

@eel.expose
def enriquecer_pista_local(ruta):
    return {"status": "ok", "ruta": ruta}

@eel.expose
def analizar_catalogo_spotify(spotify_url):
    return media_svc.analizar_catalogo_spotify(spotify_url)

@eel.expose
def resolver_stream_preescucha(titulo, artista):
    return media_svc.resolver_stream_preescucha(titulo, artista)

@eel.expose
def detener_preescucha():
    return audio_playback_svc.detener_mac()

@eel.expose
def log_to_console(msg):
    print(f"[UI] {msg}")

@eel.expose
def identificar_archivo_shazam(filepath, motor="hybrid", audd_token=""):
    return shazam_svc.reconocer_archivo(filepath, motor=motor, audd_token=audd_token)

@eel.expose
def identificar_audio_base64(b64_data, motor="hybrid", audd_token="", filename=""):
    return shazam_svc.reconocer_base64(b64_data, motor=motor, audd_token=audd_token, filename=filename)

@eel.expose
def grabar_microfono_shazam(duration_sec=7, motor="hybrid", audd_token=""):
    """Graba directamente desde el hardware de sonido del sistema mediante FFmpeg y reconoce la pista."""
    return shazam_svc.grabar_microfono_sistema(duration_sec=duration_sec, motor=motor, audd_token=audd_token)

@eel.expose
def regenerar_mood_y_comentario(track, lang="es"):
    from services.mood_intelligence_service import MoodIntelligenceService
    if not track or not isinstance(track, dict):
        return {"status": "error", "msg": "Track inválido"}
    try:
        bpm = float(track.get("bpm") or track.get("b") or 128.0)
    except Exception:
        bpm = 128.0
    key = str(track.get("key") or track.get("k") or "8A")
    try:
        energy = int(track.get("energy") or track.get("e") or 80)
    except Exception:
        energy = 80
    try:
        dance = int(track.get("danceability") or track.get("dance") or 80)
    except Exception:
        dance = 80
    path = str(track.get("path") or track.get("f") or "")
    cues = track.get("cues") or []
    try:
        downbeat = float(track.get("first_downbeat_ms") or 0.0)
    except Exception:
        downbeat = 0.0

    res = MoodIntelligenceService.clasificar_mood(bpm=bpm, key=key, energy=energy, danceability=dance, filepath=path)
    comment = MoodIntelligenceService.generar_comentario_tactico(
        bpm=bpm, key=key, mood=res["mood"], subtag=res["subtag"], energy=energy, cues=cues, first_downbeat_ms=downbeat, lang=lang
    )
    return {
        "status": "ok",
        "mood": res["mood"],
        "mood_subtag": res["subtag"],
        "valence": res["valence"],
        "arousal": res["arousal"],
        "comment": comment
    }

@bottle.route('/api/cancelar_procesos', method=['GET', 'POST', 'OPTIONS'])
def api_cancelar_procesos():
    _cors_localhost_only()
    if bottle.request.method == 'OPTIONS':
        bottle.response.status = 204
        return ""
    # ── Seguridad: en modo remoto esta acción de mutación requiere token ──
    err = _verificar_token_remoto()
    if err is not None:
        return err
    audit_svc.cancelar_proceso()
    download_svc.cancelar_descarga()
    media_svc.cancelar_busqueda()
    print("[SERVER] Cancelación solicitada y ejecutada vía HTTP /api/cancelar_procesos")
    return {"status": "ok", "msg": "Procesos cancelados"}

@bottle.route('/api/analizar_spotify', method=['GET', 'POST', 'OPTIONS'])
def api_analizar_spotify():
    _cors_localhost_only()
    if bottle.request.method == 'OPTIONS':
        bottle.response.status = 204
        return ""
    q = bottle.request.query.get('query', '')
    if not q and bottle.request.json:
        q = bottle.request.json.get('query', '')
    if not q:
        q = bottle.request.forms.get('query', '')
    res = media_svc.analizar_catalogo_spotify(q or "")
    return res

@bottle.route('/api/identificar_audio', method=['POST', 'OPTIONS'])
def api_identificar_audio():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    try:
        data = bottle.request.json or {}
        b64 = data.get('audio_b64', '')
        motor = data.get('motor', 'hybrid')
        token = data.get('audd_token', '')
        filename = data.get('filename', '')
        return shazam_svc.reconocer_base64(b64, motor=motor, audd_token=token, filename=filename)
    except Exception as e:
        return {"status": "error", "msg": f"Error en /api/identificar_audio: {e}"}

@bottle.route('/api/shazam/record_mic', method=['POST', 'OPTIONS'])
def api_shazam_record_mic():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    try:
        data = bottle.request.json or {}
        duration = data.get('duration', 7)
        motor = data.get('motor', 'hybrid')
        token = data.get('audd_token', '')
        return shazam_svc.grabar_microfono_sistema(duration_sec=duration, motor=motor, audd_token=token)
    except Exception as e:
        return {"status": "error", "msg": f"Error grabando micrófono de sistema: {e}"}

@bottle.route('/api/sanitizar_metadatos', method=['POST', 'OPTIONS'])
def api_sanitizar_metadatos():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    data = bottle.request.json or {}
    tracks = data.get('tracks', [])
    guardar = bool(data.get('guardar_en_disco', False))
    return sanitizar_metadatos_pistas(tracks, guardar)

@eel.expose
def sanitizar_metadatos_pistas(tracks, guardar_en_disco=False):
    """Higieniza masivamente títulos, artistas y versiones eliminando spam promocional y estandarizando feats."""
    if not tracks or not isinstance(tracks, list):
        return {"status": "error", "msg": "Lista de pistas vacía", "modificados": 0, "tracks": []}
    
    modificados = 0
    nuevos_tracks = []
    from infrastructure.audio_processor import AudioProcessorService
    
    for t in tracks:
        t_copy = dict(t)
        orig_title = t.get("title") or t.get("t") or ""
        orig_artist = t.get("artist") or t.get("a") or ""
        orig_album = t.get("album") or ""
        
        san = TagSanitizerService.sanitizar_track(orig_title, orig_artist, orig_album)
        if san.get("cleaned"):
            modificados += 1
            t_copy["title"] = san["title"]
            t_copy["t"] = san["title"]
            t_copy["artist"] = san["artist"]
            t_copy["a"] = san["artist"]
            t_copy["album"] = san["album"]
            t_copy["version_type"] = san["version_type"]
            t_copy["cleaned"] = True
            
            # Guardar opcionalmente en archivo físico ID3 / FLAC
            p = t.get("path") or t.get("f")
            if guardar_en_disco and p and os.path.exists(p):
                try:
                    AudioProcessorService.escribir_metadatos_pro(p, t_copy)
                except Exception as err:
                    print(f"[SANITIZER ERROR ESCRITURA] {err}")
        else:
            t_copy["version_type"] = san.get("version_type", "standard")
            
        nuevos_tracks.append(t_copy)
        
    return {
        "status": "ok",
        "total": len(nuevos_tracks),
        "modificados": modificados,
        "tracks": nuevos_tracks
    }

@bottle.route('/api/buscar_reemplazos_spotify', method=['POST', 'OPTIONS'])
def api_buscar_reemplazos_spotify():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    try:
        data = bottle.request.json or {}
        tracks = data.get('tracks', [])
        return media_svc.buscar_reemplazos_spotify_batch(tracks)
    except Exception as e:
        print(f"[API BUSCAR REEMPLAZOS ERROR] {e}")
        return {"status": "error", "msg": str(e), "tracks": []}

@eel.expose
def buscar_reemplazos_spotify_batch(tracks):
    """Busca en paralelo versiones oficiales HD en Spotify/Deezer/iTunes para una lista de pistas de baja calidad o FLAC fake."""
    try:
        if not tracks or not isinstance(tracks, list):
            return {"status": "error", "msg": "Lista de pistas vacía", "tracks": []}
        return media_svc.buscar_reemplazos_spotify_batch(tracks)
    except Exception as e:
        print(f"[EEL BUSCAR REEMPLAZOS ERROR] {e}")
        return {"status": "error", "msg": str(e), "tracks": []}

@eel.expose
def buscar_candidatos_manuales_spotify(query, pista_origen=None):
    """Búsqueda manual de versiones alternativas en Spotify/Apple Music con validación de coincidencia."""
    return media_svc.buscar_candidatos_manuales_spotify(query, pista_origen=pista_origen)

@bottle.route('/api/buscar_candidatos_manuales_spotify', method=['POST', 'OPTIONS'])
def api_buscar_candidatos_manuales_spotify():
    _cors_localhost_only()
    if bottle.request.method == 'OPTIONS':
        bottle.response.status = 204
        return ""
    auth_err = _verificar_token_remoto()
    if auth_err:
        return auth_err
    data = bottle.request.json or {}
    query = data.get('query', '')
    pista_origen = data.get('pista_origen', None)
    return media_svc.buscar_candidatos_manuales_spotify(query, pista_origen=pista_origen)

@eel.expose
def cancelar_procesos_activos():
    audit_svc.cancelar_proceso()
    download_svc.cancelar_descarga()
    media_svc.cancelar_busqueda()
    print("[SERVER] Cancelación solicitada y ejecutada vía Eel cancelar_procesos_activos")
    return {"status": "ok", "msg": "Procesos cancelados"}

@eel.expose
def pausar_auditoria():
    audit_svc.pausar_proceso()
    return {"status": "ok", "msg": "Auditoría en pausa"}

@eel.expose
def reanudar_auditoria():
    audit_svc.reanudar_proceso()
    return {"status": "ok", "msg": "Auditoría reanudada"}

@eel.expose
def seleccionar_directorio_descarga():
    return download_svc.seleccionar_directorio_descarga()

@eel.expose
def obtener_directorio_descarga_actual():
    return download_svc.obtener_directorio_actual()

@bottle.route('/api/descargar_spotify', method=['POST', 'OPTIONS'])
def api_descargar_spotify():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    try:
        data = bottle.request.json or {}
        tracks = data.get('tracks', [])
        formato = data.get('formato', 'flac')
        custom_dir = data.get('custom_dir', '')
        eliminar_originales = bool(data.get('eliminar_originales', False) or data.get('delete_originals', False))
        res = download_svc.ejecutar_lote_descarga(tracks, formato, custom_dir, audit_svc, eel, eliminar_originales=eliminar_originales)
        return res or {"status": "ok", "msg": f"Descarga iniciada para {len(tracks)} pistas"}
    except Exception as e:
        return {"status": "error", "msg": str(e)}

@bottle.route('/api/auditar_descargas_fft', method=['POST', 'OPTIONS'])
def api_auditar_descargas_fft():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    try:
        data = bottle.request.json or {}
        tracks = data.get('tracks', [])
        res = download_svc.ejecutar_auditoria_descargas_fft(tracks, audit_svc, eel)
        return res or {"status": "ok", "msg": f"Auditoría iniciada para {len(tracks)} pistas"}
    except Exception as e:
        return {"status": "error", "msg": str(e)}

@bottle.route('/api/listar_subcarpetas', method=['GET', 'POST', 'OPTIONS'])
def api_listar_subcarpetas():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    ruta = bottle.request.query.get('ruta', '')
    if not ruta and bottle.request.json:
        ruta = bottle.request.json.get('ruta', '')
    return audit_svc.listar_subcarpetas_sistema(ruta)

@bottle.route('/api/directorio_descarga', method=['GET', 'POST', 'OPTIONS'])
def api_directorio_descarga():
    _cors_localhost_only()
    if bottle.request.method == 'OPTIONS':
        bottle.response.status = 204
        return ""
    # ── Seguridad: el cambio de directorio es una operación de mutación; verificar token en modo remoto ──
    if bottle.request.method == 'POST':
        err = _verificar_token_remoto()
        if err is not None:
            return err
        if bottle.request.json:
            nueva_ruta = bottle.request.json.get('path', '')
            if nueva_ruta and os.path.isdir(nueva_ruta):
                download_svc.directorio_descargas = nueva_ruta
                _registrar_directorio_autorizado(nueva_ruta)
    return {"status": "ok", "path": download_svc.obtener_directorio_actual()}

@bottle.route('/api/resolver_stream_preescucha', method=['GET', 'POST', 'OPTIONS'])
def api_resolver_stream_preescucha():
    _cors_localhost_only()
    if bottle.request.method == 'OPTIONS':
        bottle.response.status = 204
        return ""
    titulo = bottle.request.query.get('titulo', '')
    artista = bottle.request.query.get('artista', '')
    if not titulo and bottle.request.json:
        titulo = bottle.request.json.get('titulo') or bottle.request.json.get('title', '')
        artista = bottle.request.json.get('artista') or bottle.request.json.get('artist', '')
    return media_svc.resolver_stream_preescucha(titulo, artista)

@eel.expose
def descargar_pistas_spotify_seleccionadas(tracks_to_download, formato="flac", custom_dir="", eliminar_originales=False):
    return download_svc.ejecutar_lote_descarga(tracks_to_download, formato, custom_dir, audit_svc, eel, eliminar_originales=eliminar_originales)

@eel.expose
def auditar_descargas_fft(tracks_to_audit):
    return download_svc.ejecutar_auditoria_descargas_fft(tracks_to_audit, audit_svc, eel)

@eel.expose
def buscar_temas_taxonomia(query="", ambito="all", ruta_local="/Users/admin/Music/mi musica", limite=25):
    return taxonomy_svc.buscar_temas_unificado(
        query=query,
        ambito=ambito,
        ruta_local=ruta_local,
        limite=limite
    )

@eel.expose
def obtener_taxonomia_dj():
    return taxonomy_svc.obtener_arbol_taxonomia()

@eel.expose
def organizar_pista_en_crate(track, ruta_base="/Users/admin/Music/mi musica", modo="copy"):
    if not track or not isinstance(track, dict):
        return {"status": "error", "msg": "Pista inválida"}
    path = track.get("path") or track.get("f")
    if not path or not os.path.exists(path):
        real_path = audio_playback_svc._resolver_ruta(path or "")
        if real_path and os.path.exists(real_path):
            path = real_path
        else:
            return {"status": "error", "msg": "Archivo no encontrado"}

    genero = track.get("genre") or "Tech House"
    subgenero = track.get("subgenre") or "General"
    artista = track.get("artist") or track.get("a") or "Desconocido"
    titulo = track.get("title") or track.get("t") or os.path.splitext(os.path.basename(path))[0]
    try:
        bpm = int(float(str(track.get("bpm") or track.get("b") or 128).replace(",", ".")))
    except Exception:
        bpm = 128

    res = taxonomy_svc.organizar_pista(
        ruta_origen=path,
        artista=artista,
        titulo=titulo,
        bpm=bpm,
        año=2024,
        genero=genero,
        subgenero=subgenero,
        ruta_base=ruta_base,
        modo_seguro=False,
        mover_archivo=(modo == "move")
    )
    return {"status": "ok" if res.get("estado") == "OK" else "error", "res": res}

@eel.expose
def organizar_lote_en_crates(tracks, ruta_base="/Users/admin/Music/mi musica", modo="copy"):
    return taxonomy_svc.organizar_lote(
        tracks=tracks,
        ruta_base=ruta_base,
        mover_archivo=(modo == "move"),
        progreso_cb=_emitir_progreso_batch
    )

@eel.expose
def exportar_serato_crates(tracks, destino_serato_dir=None):
    return export_svc.exportar_serato_crates(tracks, destino_serato_dir)

@eel.expose
def exportar_rekordbox_xml(tracks, destino_dir="/Users/admin/Music/mi musica", nombre_archivo="rekordbox.xml"):
    return export_svc.exportar_rekordbox_xml(tracks, destino_dir, nombre_archivo, incluir_memory_cues=True)

@eel.expose
def exportar_traktor_nml(tracks, destino_dir="/Users/admin/Music/mi musica"):
    return export_svc.exportar_traktor_nml(tracks, destino_dir)

@eel.expose
def sincronizar_pasaporte_universal(tracks, destino_dir="/Users/admin/Music/mi musica"):
    return export_svc.sincronizar_pasaporte_universal(tracks, destino_dir)

@bottle.route('/api/export/universal_sync', method=['POST', 'OPTIONS'])
def api_sincronizar_pasaporte_universal():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    data = bottle.request.json or {}
    tracks = data.get("tracks", [])
    destino_dir = data.get("destino_dir", "/Users/admin/Music/mi musica")
    return json.dumps(export_svc.sincronizar_pasaporte_universal(tracks, destino_dir))

@eel.expose
def exportar_set_m3u(tracks, nombre_set="BeatWave_DJ_Set", destino_dir="/Users/admin/Music/mi musica"):
    return export_svc.exportar_set_m3u(tracks, destino_dir, nombre_set)

@eel.expose
def seleccionar_carpeta_para_set(ruta_override=None):
    """Permite seleccionar una carpeta completa y cargar sus pistas directamente para Sets/SetBuilder."""
    try:
        if ruta_override and os.path.isdir(ruta_override):
            path = ruta_override
        else:
            ruta = audit_svc.seleccionar_directorio()
            path = ""
            if isinstance(ruta, dict):
                path = ruta.get("path") or ruta.get("directorio") or ""
            elif isinstance(ruta, str):
                path = ruta.strip()
        if not path or not os.path.isdir(path):
            return {"status": "cancelado", "tracks": []}
        _registrar_directorio_autorizado(path)
        res_dir = audit_svc.cargar_metadatos_directorio(path, _emitir_progreso_batch)
        tracks_list = res_dir.get("tracks", []) if isinstance(res_dir, dict) else res_dir
        return {"status": "ok", "path": path, "tracks": _sanitize_for_json(tracks_list)}
    except Exception as e:
        print(f"[SETBUILDER] Error cargando carpeta para set: {e}")
        return {"status": "error", "msg": str(e), "tracks": []}

@bottle.route('/api/setbuilder/load_folder', method=['POST', 'OPTIONS'])
def api_setbuilder_load_folder():
    _cors_localhost_only()
    if bottle.request.method == 'OPTIONS':
        bottle.response.status = 204
        return ""
    data = bottle.request.json or {}
    path = data.get("path", "")
    if not path or not os.path.isdir(path):
        ruta = audit_svc.seleccionar_directorio()
        if isinstance(ruta, dict):
            path = ruta.get("path") or ""
        elif isinstance(ruta, str):
            path = ruta.strip()
    if not path or not os.path.isdir(path):
        return {"status": "error", "msg": "Ruta inválida o cancelada", "tracks": []}
    _registrar_directorio_autorizado(path)
    res_dir = audit_svc.cargar_metadatos_directorio(path, _emitir_progreso_batch)
    tracks_list = res_dir.get("tracks", []) if isinstance(res_dir, dict) else res_dir
    return {"status": "ok", "path": path, "tracks": _sanitize_for_json(tracks_list)}

@eel.expose
def generar_grafo_playlist(set_tracks, library_tracks=None):
    """Genera la estructura DAG para Graph Playlists (DJOID Graph)."""
    return session_advisor_svc.generar_grafo_playlist(set_tracks, library_tracks)

@bottle.route('/api/session/graph', method=['POST', 'OPTIONS'])
def api_session_graph():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    data = bottle.request.json or {}
    set_tracks = data.get("set_tracks", [])
    library_tracks = data.get("library_tracks", [])
    return session_advisor_svc.generar_grafo_playlist(set_tracks, library_tracks)

@eel.expose
def auditar_calidad_sesion_ai(set_tracks, library_tracks=None, user_gemini_key=""):
    """Audita el flujo armónico/energético de la sesión y consulta Gemini AI."""
    return session_advisor_svc.auditar_calidad_sesion(set_tracks, library_tracks, user_gemini_key)

@bottle.route('/api/session/audit_ai', method=['POST', 'OPTIONS'])
def api_session_audit_ai():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    data = bottle.request.json or {}
    set_tracks = data.get("set_tracks", [])
    library_tracks = data.get("library_tracks", [])
    user_gemini_key = data.get("gemini_key", "")
    return session_advisor_svc.auditar_calidad_sesion(set_tracks, library_tracks, user_gemini_key)

@bottle.route('/api/setbuilder/export_m3u', method=['POST', 'OPTIONS'])
def api_exportar_set_m3u():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    data = bottle.request.json or {}
    tracks = data.get("tracks", [])
    nombre_set = data.get("nombre_set", "BeatWave_DJ_Set")
    destino_dir = data.get("destino_dir", "/Users/admin/Music/mi musica")
    return export_svc.exportar_set_m3u(tracks, destino_dir, nombre_set)

@eel.expose
def exportar_reporte_descargas_xls(report_data, destino_dir="/Users/admin/Music/mi musica"):
    return export_svc.exportar_reporte_descargas_xls(report_data, destino_dir)

@bottle.route('/api/descargar_reporte_xls', method=['POST', 'OPTIONS'])
def api_descargar_reporte_xls():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    data = bottle.request.json or {}
    report_data = data.get("report_data", data)
    destino = data.get("destino_dir", "/Users/admin/Music/mi musica")
    return export_svc.exportar_reporte_descargas_xls(report_data, destino)

@eel.expose
def exportar_apuntes_shazam(tracks, formato="xls", destino_dir="/Users/admin/Music/mi musica"):
    try:
        import datetime
        os.makedirs(destino_dir, exist_ok=True)
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        if formato == "txt":
            filename = f"BeatWave_Shazam_Apuntes_{timestamp}.txt"
            filepath = os.path.join(destino_dir, filename)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write("=" * 60 + "\n")
                f.write("BEATWAVE PRO • LIBRETA DIGITAL DE APUNTES SHAZAM\n")
                f.write(f"Fecha de exportacion: {datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n")
                f.write(f"Total de pistas: {len(tracks)}\n")
                f.write("=" * 60 + "\n\n")
                for i, trk in enumerate(tracks, 1):
                    art = trk.get("artist") or trk.get("a") or "Desconocido"
                    tit = trk.get("title") or trk.get("t") or "Desconocido"
                    alb = trk.get("album") or ""
                    gen = trk.get("genre") or "Electronic"
                    yr = trk.get("year") or ""
                    isrc = trk.get("isrc") or ""
                    comm = trk.get("comment") or trk.get("comentario") or ""
                    comm_line = f" [💬 {comm}]" if comm else ""
                    f.write(f"{i:02d}. {art} - {tit} [{alb} {yr}] - {gen}{comm_line} (ISRC: {isrc})\n")
            return {"status": "ok", "path": filepath, "filename": filename, "total": len(tracks)}
        else:
            filename = f"BeatWave_Shazam_Apuntes_{timestamp}.xlsx"
            filepath = os.path.join(destino_dir, filename)
            try:
                import pandas as pd
                data = []
                for i, trk in enumerate(tracks, 1):
                    data.append({
                        "#": i,
                        "Artista": trk.get("artist") or trk.get("a") or "",
                        "Titulo": trk.get("title") or trk.get("t") or "",
                        "Album": trk.get("album") or "",
                        "Genero": trk.get("genre") or "Electronic",
                        "Ano": trk.get("year") or "",
                        "ISRC": trk.get("isrc") or "",
                        "Comentario DJ": trk.get("comment") or trk.get("comentario") or "",
                        "Fecha Apunte": trk.get("added_at") or datetime.datetime.now().strftime("%d/%m/%Y %H:%M"),
                        "Spotify Query": trk.get("spotify_query") or f"{trk.get('title','')} {trk.get('artist','')}"
                    })
                df = pd.DataFrame(data)
                df.to_excel(filepath, index=False)
                return {"status": "ok", "path": filepath, "filename": filename, "total": len(tracks)}
            except Exception:
                filename = f"BeatWave_Shazam_Apuntes_{timestamp}.csv"
                filepath = os.path.join(destino_dir, filename)
                import csv
                with open(filepath, "w", encoding="utf-8-sig", newline="") as f:
                    writer = csv.writer(f)
                    writer.writerow(["#", "Artista", "Titulo", "Album", "Genero", "Ano", "ISRC", "Comentario DJ", "Fecha Apunte"])
                    for i, trk in enumerate(tracks, 1):
                        writer.writerow([
                            i,
                            trk.get("artist") or trk.get("a") or "",
                            trk.get("title") or trk.get("t") or "",
                            trk.get("album") or "",
                            trk.get("genre") or "",
                            trk.get("year") or "",
                            trk.get("isrc") or "",
                            trk.get("comment") or trk.get("comentario") or "",
                            trk.get("added_at") or ""
                        ])
                return {"status": "ok", "path": filepath, "filename": filename, "total": len(tracks)}
    except Exception as e:
        return {"status": "error", "msg": str(e)}

# =========================================================================
# MÓDULOS DE TENDENCIAS Y CONOCIMIENTO (API & EEL)
# =========================================================================

@eel.expose
def obtener_tendencias_web():
    return trends_service.obtener_tendencias()

@eel.expose
def ejecutar_crawler_tendencias():
    return trends_service.ejecutar_crawler(forzar=True)

@eel.expose
def obtener_recursos_conocimiento():
    return knowledge_service.obtener_recursos()

@bottle.route('/api/trends', method=['GET', 'OPTIONS'])
def api_trends():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    return trends_service.obtener_tendencias()

@bottle.route('/api/trends/crawl', method=['POST', 'OPTIONS'])
def api_trends_crawl():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    return trends_service.ejecutar_crawler(forzar=True)

@bottle.route('/api/knowledge', method=['GET', 'OPTIONS'])
def api_knowledge():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    return knowledge_service.obtener_recursos()

@bottle.route('/api/manual/pdf', method=['GET'])
def api_download_manual_pdf():
    pdf_filename = "CleanDJmix_PRO_Manual_Funcional_y_Tecnico.pdf"
    root_dir = os.path.dirname(os.path.abspath(__file__))
    return bottle.static_file(pdf_filename, root=root_dir, download=pdf_filename, mimetype='application/pdf')

@bottle.route('/api/warmup/status', method=['GET', 'OPTIONS'])
def api_warmup_status():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    bottle.response.content_type = 'application/json'
    import json
    from services.audit_service import AuditCacheDB
    db = AuditCacheDB()
    return json.dumps({
        "ready": db.is_warm_ready(),
        "total_cached": len(db.get_warm_cache())
    })

@bottle.route('/api/audit/pause', method=['POST', 'OPTIONS'])
def api_audit_pause():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    bottle.response.content_type = 'application/json'
    import json
    audit_svc.pausar_proceso()
    return json.dumps({"status": "ok", "paused": True})

@bottle.route('/api/audit/resume', method=['POST', 'OPTIONS'])
def api_audit_resume():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    bottle.response.content_type = 'application/json'
    import json
    audit_svc.reanudar_proceso()
    return json.dumps({"status": "ok", "paused": False})

# ==========================================
# RUTAS Y EEL EXPOSURES: BEATWAVE LIVE COPILOT
# ==========================================

@bottle.route('/api/copilot/status', method=['GET', 'OPTIONS'])
def api_copilot_status():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    bottle.response.content_type = 'application/json'
    import json
    return json.dumps(copilot_service.get_live_state())

@bottle.route('/api/copilot/stream')
def api_copilot_stream():
    """Endpoint SSE (Server-Sent Events) para Live Copilot en tiempo real (baja latencia sin polling)."""
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    bottle.response.content_type = 'text/event-stream'
    bottle.response.cache_control = 'no-cache'
    bottle.response.set_header('Connection', 'keep-alive')
    bottle.response.set_header('X-Accel-Buffering', 'no')

    def event_stream():
        import json, time
        for _ in range(600):
            try:
                state = copilot_service.get_live_state()
                raw = json.dumps(state)
                yield f"data: {raw}\n\n"
                time.sleep(0.5)
            except Exception:
                break

    return event_stream()

@bottle.route('/api/copilot/platforms', method=['GET', 'OPTIONS'])
def api_copilot_platforms():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    bottle.response.content_type = 'application/json'
    import json
    return json.dumps({
        "platform_mode": copilot_service.platform_mode,
        "active_platform": copilot_service.detect_active_platform(),
        "platforms": copilot_service.get_available_platforms()
    })

@bottle.route('/api/copilot/set_platform', method=['POST', 'OPTIONS'])
def api_copilot_set_platform():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    bottle.response.content_type = 'application/json'
    data = bottle.request.json or {}
    platform = data.get('platform', 'auto')
    new_state = copilot_service.set_platform(platform)
    import json
    return json.dumps(new_state)

@bottle.route('/api/copilot/set_master', method=['POST', 'OPTIONS'])
def api_copilot_set_master():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    bottle.response.content_type = 'application/json'
    try:
        data = bottle.request.json or {}
    except Exception:
        data = {}
    master_val = data.get('master') or bottle.request.params.get('master', 'toggle')
    import json
    return json.dumps(copilot_service.set_manual_master(master_val))

@bottle.route('/api/copilot/toggle_play', method=['POST', 'OPTIONS'])
def api_copilot_toggle_play():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    bottle.response.content_type = 'application/json'
    try:
        data = bottle.request.json or {}
    except Exception:
        data = {}
    deck_val = data.get('deck') or bottle.request.params.get('deck', 'master')
    import json
    return json.dumps(copilot_service.toggle_play(deck_val))

@bottle.route('/api/copilot/toggle_simulation', method=['POST', 'OPTIONS'])
def api_copilot_toggle_simulation():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    bottle.response.content_type = 'application/json'
    copilot_service.simulation_mode = not copilot_service.simulation_mode
    import json
    return json.dumps(copilot_service.get_live_state())

@bottle.route('/api/copilot/info', method=['GET', 'OPTIONS'])
def api_copilot_info():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    bottle.response.content_type = 'application/json'
    import json
    ip = copilot_service.get_local_ip()
    return json.dumps({
        "local_ip": ip,
        "companion_url": f"http://{ip}:{_PORT}/copilot.html",
        "active_platform": copilot_service.detect_active_platform(),
        "platform_mode": copilot_service.platform_mode,
        "platforms": copilot_service.get_available_platforms(),
        "serato_detected": os.path.exists(copilot_service.serato_db_path),
        "serato_db_path": copilot_service.serato_db_path,
        "simulation_mode": copilot_service.simulation_mode
    })

@bottle.route('/copilot')
@bottle.route('/copilot.html')
def route_copilot_page():
    root_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")
    return bottle.static_file("copilot.html", root=root_dir)

@eel.expose
def eel_copilot_get_state():
    return copilot_service.get_live_state()

@eel.expose
def eel_copilot_get_platforms():
    return {
        "platform_mode": copilot_service.platform_mode,
        "active_platform": copilot_service.detect_active_platform(),
        "platforms": copilot_service.get_available_platforms()
    }

@eel.expose
def eel_copilot_set_platform(platform):
    return copilot_service.set_platform(platform)

@eel.expose
def eel_copilot_toggle_simulation():
    copilot_service.simulation_mode = not copilot_service.simulation_mode
    return copilot_service.get_live_state()

@eel.expose
def eel_copilot_get_info():
    ip = copilot_service.get_local_ip()
    return {
        "local_ip": ip,
        "companion_url": f"http://{ip}:{_PORT}/copilot.html",
        "active_platform": copilot_service.detect_active_platform(),
        "platform_mode": copilot_service.platform_mode,
        "platforms": copilot_service.get_available_platforms(),
        "serato_detected": os.path.exists(copilot_service.serato_db_path),
        "simulation_mode": copilot_service.simulation_mode
    }

if __name__ == "__main__":
    import socket

    def _is_port_in_use(port_num, host_ip="127.0.0.1"):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.3)
            return s.connect_ex((host_ip, port_num)) == 0

    # ── Soporte de puerto configurable o auto-detección si 8000 está ocupado ──
    custom_port = None
    for i, arg in enumerate(sys.argv):
        if arg == "--port" and i + 1 < len(sys.argv):
            try:
                custom_port = int(sys.argv[i + 1])
            except ValueError:
                pass
        elif arg.startswith("--port="):
            try:
                custom_port = int(arg.split("=", 1)[1])
            except ValueError:
                pass

    if custom_port:
        _PORT = custom_port
    else:
        while _is_port_in_use(_PORT):
            print(f"[BEATWAVE PRO] ℹ️ Puerto {_PORT} en uso por otra instancia. Probando puerto siguiente...")
            _PORT += 1

    # ── Modo de red: por defecto solo localhost; --remote habilita LAN con token ──
    if "--remote" in sys.argv:
        _REMOTE_MODE = True
        _host = "0.0.0.0"
        print(f"\n[BEATWAVE PRO] ⚠️  Modo REMOTO activado.")
        print(f"[BEATWAVE PRO] 🔑 Token de sesión (cópialo al dispositivo remoto):")
        print(f"               {_SESSION_TOKEN}\n")
    else:
        _REMOTE_MODE = False
        _host = "127.0.0.1"

    print(f"[BEATWAVE PRO] 🚀 Iniciando servidor en http://{_host}:{_PORT}...")

    try:
        try:
            cmd = "system_profiler SPDisplaysDataType | grep Resolution"
            res_line = subprocess.check_output(cmd, shell=True).decode()
            parts = res_line.strip().split()
            w, h = int(parts[1]), int(parts[3])
        except Exception:
            w, h = 1920, 1080

        eel.start(
            "index.html",
            host=_host,
            mode="chrome",
            size=(w, h),
            position=(0, 0),
            close_callback=lambda page, sockets: None,
            cmdline_args=[
                "--start-maximized",
                "--no-first-run",
                "--disable-default-apps"
            ],
            port=_PORT
        )
    except (SystemExit, KeyboardInterrupt):
        print("\n[CleanDJmix PRO] Servidor detenido.")

@eel.expose
def clasificar_genero_pista(filepath, bpm=0.0):
    return GenreClassifierDSP.classify_track(filepath, known_bpm=float(bpm or 0.0))

@bottle.route('/api/taxonomy/classify', method=['POST', 'GET', 'OPTIONS'])
def api_taxonomy_classify():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    filepath = bottle.request.params.get('filepath') or (bottle.request.json or {}).get('filepath')
    bpm = float(bottle.request.params.get('bpm') or (bottle.request.json or {}).get('bpm') or 0.0)
    return GenreClassifierDSP.classify_track(filepath, known_bpm=bpm)
