import time
import os
import subprocess
import threading
import atexit
import eel
import bottle

from services.audio_service import AudioService
from services.media_service import MediaService
from services.download_service import DownloadService

eel.init("web")

audio_svc = AudioService()
media_svc = MediaService()
download_svc = DownloadService()

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

# Puente Eel - Audio y Reproducción macOS
@eel.expose
def reproducir_pista_mac(nombre_archivo):
    audio_svc.reproducir_mac(nombre_archivo)

@eel.expose
def detener_audio_mac():
    audio_svc.detener_mac()

atexit.register(lambda: audio_svc.detener_mac())

@eel.expose
def seleccionar_directorio():
    return audio_svc.seleccionar_directorio()

@eel.expose
def iniciar_auditoria(ruta_directorio):
    return audio_svc.iniciar_auditoria(ruta_directorio, _emitir_log_ui)

# Puente Eel - Spotify / Medios / Streaming
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

# Puente Eel - Descargas y Ingesta FLAC
@eel.expose
def seleccionar_directorio_descarga():
    return download_svc.seleccionar_directorio_descarga()

@eel.expose
def obtener_directorio_descarga_actual():
    return download_svc.obtener_directorio_actual()

@eel.expose
def descargar_pistas_spotify_seleccionadas(tracks_to_download, formato="flac", custom_dir=""):
    return download_svc.ejecutar_lote_descarga(tracks_to_download, formato, custom_dir, audio_svc, eel)

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
