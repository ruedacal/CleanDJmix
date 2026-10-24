import os
import subprocess
import atexit
import eel
import bottle

from services.audio_service import AudioPlaybackService
from services.audit_service import AuditService
from services.media_service import MediaService
from services.download_service import DownloadService
from services.export_service import ExportService

eel.init("web")

audio_playback_svc = AudioPlaybackService()
audit_svc = AuditService()
media_svc = MediaService()
download_svc = DownloadService()
export_svc = ExportService()

@bottle.route('/cover')
def get_cover():
    file_path = bottle.request.query.get('path', '')
    real_path = audio_playback_svc._resolver_ruta(file_path) if file_path else ''
    target = real_path if real_path else file_path
    data, mime = media_svc.obtener_caratula_binaria(target)
    if data and mime:
        bottle.response.content_type = mime
        return data
    return bottle.redirect("https://placehold.co/100x100/18181b/22d3ee?text=CleanDJ")

@bottle.route('/stream_audio')
def stream_audio():
    file_path = bottle.request.query.get('path', '')
    if file_path:
        real_path = audio_playback_svc._resolver_ruta(file_path)
        if real_path and os.path.exists(real_path) and os.path.isfile(real_path):
            dir_name = os.path.dirname(real_path)
            file_name = os.path.basename(real_path)
            return bottle.static_file(file_name, root=dir_name, mimetype='auto')
    bottle.response.status = 404
    return "Audio file not found"

def _emitir_log_ui(mensaje: str):
    print(f"[CleanDJmix PRO] {mensaje}")
    try:
        eel.log_to_console(mensaje)
    except Exception:
        pass

def _emitir_progreso_batch(pct: int, msg: str):
    try:
        if hasattr(eel, "actualizar_progreso_batch"):
            eel.actualizar_progreso_batch(pct, msg)()
    except Exception:
        pass

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
def seleccionar_directorio():
    return audit_svc.seleccionar_directorio()

@eel.expose
def listar_subcarpetas_sistema(ruta_base=""):
    return audit_svc.listar_subcarpetas_sistema(ruta_base)

@eel.expose
def cargar_metadatos_directorio(ruta_directorio):
    audio_playback_svc.establecer_directorio(ruta_directorio)
    return audit_svc.cargar_metadatos_directorio(ruta_directorio, _emitir_progreso_batch)

@eel.expose
def iniciar_auditoria(ruta_directorio, opts=None):
    audio_playback_svc.establecer_directorio(ruta_directorio)
    return audit_svc.iniciar_auditoria(ruta_directorio, _emitir_log_ui, _emitir_progreso_batch, opts=opts)

@eel.expose
def ejecutar_auditoria_lote(ruta_directorio, opts=None):
    audio_playback_svc.establecer_directorio(ruta_directorio)
    return audit_svc.iniciar_auditoria(ruta_directorio, _emitir_log_ui, _emitir_progreso_batch, opts=opts)

@eel.expose
def analizar_espectro_fft(filepath, spotify_id=None):
    return audit_svc.analizar_espectro_fft(filepath, spotify_id)

@eel.expose
def calcular_trim_downbeat_track(filepath, track_id=None):
    return audit_svc.analizar_trim_downbeat(filepath, track_id)

@eel.expose
def exportar_auditoria_xls(tracks, destino_dir="/Users/admin/Music/mi musica"):
    return export_svc.exportar_tracks_xls(tracks, destino_dir)

@eel.expose
def inyectar_lote_metadatos(tracks):
    return audit_svc.inyectar_lote_metadatos(tracks, _emitir_progreso_batch)

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
def descargar_track_spotify_flac(meta, dest=None):
    return download_svc.ejecutar_lote_descarga([meta], "flac", dest or "", audit_svc, eel)

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
def seleccionar_directorio_descarga():
    return download_svc.seleccionar_directorio_descarga()

@eel.expose
def obtener_directorio_descarga_actual():
    return download_svc.obtener_directorio_actual()

@eel.expose
def descargar_pistas_spotify_seleccionadas(tracks_to_download, formato="flac", custom_dir=""):
    return download_svc.ejecutar_lote_descarga(tracks_to_download, formato, custom_dir, audit_svc, eel)

if __name__ == "__main__":
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
            mode="chrome",
            size=(w, h),
            position=(0, 0),
            cmdline_args=[
                "--start-maximized",
                "--no-first-run",
                "--disable-default-apps"
            ],
            port=8000
        )
    except (SystemExit, KeyboardInterrupt):
        print("\n[CleanDJmix PRO] Servidor detenido.")
