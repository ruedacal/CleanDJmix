import os
import subprocess
import threading
import eel
from infrastructure.audio_processor import AudioProcessorService
from infrastructure.spotify_flac_ingest import SpotifyFlacIngestService

eel.init("web")

# Instancia global del servicio de ingesta Spotify + FLAC
ingest_service = SpotifyFlacIngestService()

# Semáforo para impedir que múltiples clics o promesas pendientes abran el Finder en bucle
_DIALOG_LOCK = threading.Lock()


def _emitir_log_ui(mensaje: str):
    print(f"[CleanDJmix PRO] {mensaje}")
    try:
        eel.log_to_console(mensaje)
    except Exception:
        pass


@eel.expose
def seleccionar_directorio():
    """
    Abre el diálogo nativo de macOS una única vez (protegido por Lock)
    y sin invocar 'System Events' para evitar bloqueos de permisos y bucles.
    """
    if not _DIALOG_LOCK.acquire(blocking=False):
        return ""

    try:
        script = 'POSIX path of (choose folder with prompt "Selecciona tu carpeta de música DJ")'
        proc = subprocess.run(
            ["osascript", "-e", script],
            capture_output=True,
            text=True,
            timeout=60
        )
        if proc.returncode == 0:
            ruta = proc.stdout.strip()
            if ruta and os.path.isdir(ruta):
                _emitir_log_ui(f"Directorio seleccionado: {ruta}")
                return str(ruta)
    except subprocess.TimeoutExpired:
        _emitir_log_ui("Tiempo de espera agotado al seleccionar carpeta.")
    except Exception as e:
        _emitir_log_ui(f"Cancelado o error en diálogo de carpeta: {e}")
    finally:
        _DIALOG_LOCK.release()

    return ""


@eel.expose
def iniciar_auditoria(ruta_directorio):
    """
    Escanea el directorio seleccionado priorizando archivos FLAC y MP3,
    extrae sus metadatos reales y devuelve el resumen y listado completo para la tabla Director's Cut.
    """
    if not ruta_directorio or not os.path.exists(ruta_directorio):
        _emitir_log_ui(f"Ruta no encontrada: {ruta_directorio}")
        return {
            "status": "error",
            "total": 0,
            "missing_meta": 0,
            "ready": 0,
            "errors": 0,
            "tracks": [],
            "msg": "El directorio especificado no existe."
        }

    _emitir_log_ui(f"Iniciando auditoría profunda en: {ruta_directorio}")
    tracks_auditados = []
    extensiones_soportadas = (".flac", ".mp3", ".wav", ".aiff", ".m4a")

    idx = 1
    missing_count = 0
    ready_count = 0
    error_count = 0

    for root, _, files in os.walk(ruta_directorio):
        for file in sorted(files):
            if file.startswith(".") or not file.lower().endswith(extensiones_soportadas):
                continue

            full_path = os.path.join(root, file)
            info = AudioProcessorService.analizar_track_avanzado(full_path)
            info["id"] = idx
            idx += 1

            if info["status"] == "Ready":
                ready_count += 1
            elif info["status"] == "Missing Meta":
                missing_count += 1
            else:
                error_count += 1

            tracks_auditados.append(info)

            # Límite de seguridad por lote para mantener 60 FPS en el DOM
            if len(tracks_auditados) >= 2500:
                break

    _emitir_log_ui(
        f"Auditoría completada: {len(tracks_auditados)} pistas ({ready_count} listas, {missing_count} sin metadatos)."
    )

    return {
        "status": "ok",
        "total": len(tracks_auditados),
        "missing_meta": missing_count,
        "ready": ready_count,
        "errors": error_count,
        "tracks": tracks_auditados
    }


@eel.expose
def analizar_url_spotify(spotify_url):
    """
    Extrae las pistas de una Playlist, Álbum o Track de Spotify junto con su ISRC,
    BPM, Key Camelot y Carátula HD para la pestaña 'Spotify Ingest'.
    """
    _emitir_log_ui(f"Consultando Spotify API para: {spotify_url}")
    pistas = ingest_service.extraer_metadatos_spotify_url(spotify_url)
    return {
        "status": "ok" if pistas else "empty",
        "total": len(pistas),
        "tracks": pistas
    }


@eel.expose
def descargar_track_spotify_flac(meta_track, directorio_destino=None):
    """
    Resuelve el código ISRC en los servidores Lossless, descarga el archivo .flac
    auténtico (verificando cabecera fLaC) e inyecta Vorbis Comments + Portada HD.
    """
    titulo = f"{meta_track.get('artist', '')} - {meta_track.get('title', '')}"
    _emitir_log_ui(f"Iniciando ingesta FLAC Lossless para: {titulo} [ISRC: {meta_track.get('isrc', 'N/A')}]")
    res = ingest_service.descargar_e_inyectar_flac(meta_track, directorio_destino)
    _emitir_log_ui(res.get("msg", ""))
    return res


@eel.expose
def enriquecer_pista_local(ruta_archivo):
    """
    Repara un archivo local con 'Missing Meta' consultando Spotify API e inyectando
    BPM, Key Camelot, ISRC y carátula directamente en el FLAC o MP3.
    """
    _emitir_log_ui(f"Enriqueciendo metadatos con Spotify para: {os.path.basename(ruta_archivo)}")
    res = ingest_service.enriquecer_track_local_con_spotify(ruta_archivo)
    _emitir_log_ui(res.get("msg", ""))
    return res


@eel.expose
def guardar_configuracion_ingest(nueva_config):
    """Permite guardar Client ID/Secret de Spotify y tokens Lossless en config_ingest.json."""
    return ingest_service.guardar_config(nueva_config)


@eel.expose
def inyectar_lote_serato(rutas_archivos):
    """
    Normaliza y graba las etiquetas Camelot Key y BPM en los archivos seleccionados
    para que Serato DJ Pro y Rekordbox los lean de inmediato.
    """
    procesados = 0
    for ruta in rutas_archivos or []:
        if os.path.exists(ruta):
            info = AudioProcessorService.analizar_track_avanzado(ruta)
            if AudioProcessorService.escribir_metadatos_pro(ruta, info):
                procesados += 1
    _emitir_log_ui(f"Inyección a Serato completada: {procesados} pistas actualizadas.")
    return {"status": "ok", "procesados": procesados}


@eel.expose
def log_to_console(msg):
    print(f"[UI Console] {msg}")


if __name__ == "__main__":
    print("======================================================")
    print(" CleanDJmix PRO - Director's Cut (FLAC & Spotify Core)")
    print("======================================================")
    try:
        eel.start("index.html", size=(1360, 840), port=8000)
    except (SystemExit, KeyboardInterrupt):
        print("Servidor detenido correctamente.")
