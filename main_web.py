import time
import os
import subprocess
import threading
import atexit
import eel
import bottle

from services.audio_service import AudioPlaybackService
from services.audit_service import AuditService
from services.media_service import MediaService
from services.download_service import DownloadService
from services.export_service import ExportService

print("=" * 60)
print("🚀 [BEATWAVE PRO] ARQUITECTURA MODULAR ACTIVA (Backend v2)")
print("📂 Servicios cargados: services/audio_service.py")
print("📂 Servicios cargados: services/audit_service.py")
print("📂 Servicios cargados: services/media_service.py")
print("📂 Servicios cargados: services/download_service.py")
print("=" * 60)

eel.init("web")

audio_playback_svc = AudioPlaybackService()
audit_svc = AuditService()
media_svc = MediaService()
download_svc = DownloadService()
export_svc = ExportService()

# Endpoint Bottle para carátulas en tiempo real
@bottle.route('/cover')
def get_cover():
    file_path = bottle.request.query.get('path', '')
    data, mime = media_svc.obtener_caratula_binaria(file_path)
    if data and mime:
        bottle.response.content_type = mime
        return data
    return bottle.redirect("https://placehold.co/100x100/18181b/22d3ee?text=CleanDJ")

def _emitir_log_ui(mensaje: str):
    print(f"[CleanDJmix PRO] {mensaje}")
    try:
        eel.log_to_console(mensaje)
    except Exception:
        pass

# Puente Eel - Reproducción macOS
@eel.expose
def reproducir_pista_mac(nombre_archivo):
    audio_playback_svc.reproducir_mac(nombre_archivo)

@eel.expose
def detener_audio_mac():
    audio_playback_svc.detener_mac()

atexit.register(lambda: audio_playback_svc.detener_mac())

# Puente Eel - Auditoría y Directorios
@eel.expose
def seleccionar_directorio():
    return audit_svc.seleccionar_directorio()

@eel.expose
def iniciar_auditoria(ruta_directorio):
    res = audit_svc.iniciar_auditoria(ruta_directorio, _emitir_log_ui)
    if res.get("total", 0) > 0:
        audio_playback_svc.establecer_directorio(ruta_directorio)
    return res

# Puente Eel - Spotify Ingest Service & Medios
@eel.expose
def analizar_url_spotify(spotify_url):
    return media_svc.analizar_url_spotify(spotify_url)

@eel.expose
def descargar_track_spotify_flac(meta, dest=None):
    return media_svc.descargar_track_spotify_flac(meta, dest)

@eel.expose
def enriquecer_pista_local(ruta):
    return media_svc.enriquecer_pista_local(ruta)

@eel.expose
def analizar_catalogo_spotify(spotify_url):
    return media_svc.analizar_catalogo_spotify(spotify_url)

@eel.expose
def resolver_stream_preescucha(titulo, artista):
    return media_svc.resolver_stream_preescucha(titulo, artista)

@eel.expose
def detener_preescucha():
    return {"status": "detenido"}

@eel.expose
def log_to_console(msg):
    print(f"[UI] {msg}")

# Puente Eel - Descargas y Lotes Lossless
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
                "--start-fullscreen",
                "--kiosk",
                "--no-first-run",
                "--disable-default-apps"
            ],
            port=8000
        )
    except (SystemExit, KeyboardInterrupt):
        print("\n[CleanDJmix] Servidor detenido por el usuario.")
    except Exception as ex:
        print(f"[ERROR CRÍTICO] Error en tiempo de ejecución: {ex}")


# Puente Eel - Exportación XLS / Respaldo
@eel.expose
def exportar_auditoria_xls(tracks):
    return export_svc.exportar_tracks_xls(tracks)
