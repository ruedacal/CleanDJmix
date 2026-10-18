import os
import subprocess
import threading
import atexit
import eel
import bottle
from mutagen import File as MutagenFile
from infrastructure.audio_processor import AudioProcessorService
from infrastructure.spotify_flac_ingest import SpotifyFlacIngestService

eel.init("web")

ingest_service = SpotifyFlacIngestService()
_DIALOG_LOCK = threading.Lock()
DIRECTORIO_ACTUAL = ""

# Endpoint para extraer la carátula en tiempo real sin saturar la memoria
@bottle.route('/cover')
def get_cover():
    file_path = bottle.request.query.get('path', '')
    if os.path.exists(file_path):
        try:
            m = MutagenFile(file_path)
            if m:
                # Soporte FLAC
                if hasattr(m, 'pictures') and m.pictures:
                    bottle.response.content_type = m.pictures[0].mime
                    return m.pictures[0].data
                # Soporte ID3 (MP3, AIFF)
                elif hasattr(m, 'tags') and m.tags:
                    for tag in m.tags.values():
                        if tag.FrameID == 'APIC':
                            bottle.response.content_type = tag.mime
                            return tag.data
        except Exception:
            pass
    # Cover por defecto si la pista no tiene
    return bottle.redirect("https://placehold.co/100x100/18181b/22d3ee?text=CleanDJ")

def _emitir_log_ui(mensaje: str):
    print(f"[CleanDJmix PRO] {mensaje}")
    try: eel.log_to_console(mensaje)
    except Exception: pass

@eel.expose
def reproducir_pista_mac(nombre_archivo):
    global DIRECTORIO_ACTUAL
    subprocess.run(["killall", "afplay"], stderr=subprocess.DEVNULL)
    if nombre_archivo and DIRECTORIO_ACTUAL:
        ruta = os.path.join(DIRECTORIO_ACTUAL, nombre_archivo)
        if os.path.exists(ruta):
            subprocess.Popen(["afplay", ruta])

@eel.expose
def detener_audio_mac():
    subprocess.run(["killall", "afplay"], stderr=subprocess.DEVNULL)

atexit.register(lambda: subprocess.run(["killall", "afplay"], stderr=subprocess.DEVNULL))

@eel.expose
def seleccionar_directorio():
    if not _DIALOG_LOCK.acquire(blocking=False): return ""
    try:
        script = 'POSIX path of (choose folder with prompt "Selecciona tu carpeta de música DJ")'
        proc = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=60)
        if proc.returncode == 0 and proc.stdout.strip() and os.path.isdir(proc.stdout.strip()):
            return str(proc.stdout.strip())
    except Exception: pass
    finally: _DIALOG_LOCK.release()
    return ""

@eel.expose
def iniciar_auditoria(ruta_directorio):
    global DIRECTORIO_ACTUAL
    if not ruta_directorio or not os.path.exists(ruta_directorio):
        return {"total": 0, "sin_meta": 0, "tracks": []}
    
    DIRECTORIO_ACTUAL = ruta_directorio
    _emitir_log_ui(f"Iniciando auditoría en: {ruta_directorio}")
    
    tracks_auditados = []
    extensiones = (".flac", ".mp3", ".wav", ".aiff", ".m4a")
    idx = 1
    sin_meta_count = 0

    for root, _, files in os.walk(ruta_directorio):
        for file in sorted(files):
            if file.startswith(".") or not file.lower().endswith(extensiones): continue
            full_path = os.path.join(root, file)
            info = AudioProcessorService.analizar_track_avanzado(full_path)
            if info.get("missing_meta", False): sin_meta_count += 1
            
            tracks_auditados.append({
                "id": idx, "f": str(file or ""), "path": str(full_path or ""),
                "t": str(info.get("title") or file or ""), "a": str(info.get("artist") or "Desconocido"),
                "b": float(info.get("bpm") or 124.0), "k": str(info.get("key") or "8A"),
                "e": int(info.get("energy") or 75), "duration": str(info.get("duration") or "5:00"),
                "format": str(info.get("format") or "FLAC"), "s": "Ready"
            })
            idx += 1
            if len(tracks_auditados) >= 2500: break

    return {"total": len(tracks_auditados), "sin_meta": sin_meta_count, "tracks": tracks_auditados}

@eel.expose
def analizar_url_spotify(spotify_url): return ingest_service.extraer_metadatos_spotify_url(spotify_url) or []
@eel.expose
def descargar_track_spotify_flac(meta, dest=None): return ingest_service.descargar_e_inyectar_flac(meta, dest)
@eel.expose
def enriquecer_pista_local(ruta): return ingest_service.enriquecer_track_local_con_spotify(ruta)
@eel.expose
def log_to_console(msg): print(f"[UI] {msg}")

if __name__ == "__main__":
    try: eel.start("index.html", size=(2560, 1440), position=(0,0))
    except (SystemExit, KeyboardInterrupt): pass
