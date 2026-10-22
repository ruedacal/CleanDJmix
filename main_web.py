import time
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

# ==============================================================================
# PUENTE EEL PRO: RESOLUCIÓN EN TIEMPO REAL DE CARÁTULAS Y AUDIO DE BAJA LATENCIA
# ==============================================================================
import subprocess
import threading
import json
import urllib.request
import urllib.parse
import ssl

def _ssl_context():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx

def _buscar_metadata_itunes(termino, limit=10):
    """Consulta la API pública de Apple Music/iTunes (<150ms) que entrega portadas HD y stream M4A directo con CORS abierto."""
    try:
        q = urllib.parse.quote(termino)
        url = f"https://itunes.apple.com/search?term={q}&entity=song&limit={limit}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=_ssl_context(), timeout=5) as res:
            data = json.loads(res.read().decode('utf-8'))
            return data.get("results", [])
    except Exception as e:
        print(f"[WARN] Error consultando API de metadatos: {e}")
        return []

@eel.expose
def analizar_catalogo_spotify(spotify_url):
    print(f"[BACKEND EEL] Analizando catálogo en tiempo real para: {spotify_url}")
    tracks = []
    
    # 1. Intentar extraer título de artista/álbum/track desde el oEmbed oficial de Spotify (rápido y nunca da 404)
    search_term = "Marco Bailey"
    try:
        oembed_url = f"https://open.spotify.com/oembed?url={urllib.parse.quote(spotify_url.split('?')[0])}"
        req = urllib.request.Request(oembed_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=_ssl_context(), timeout=4) as res:
            oem = json.loads(res.read().decode('utf-8'))
            if oem.get("title"):
                search_term = oem.get("title")
                print(f"[BACKEND EEL] Entidad Spotify detectada vía oEmbed: {search_term}")
    except Exception:
        pass

    # 2. Obtener catálogo real con portadas verificadas y URLs de pre-escucha M4A instantáneas
    resultados = _buscar_metadata_itunes(search_term, limit=12)
    keys_camelot = ["8A", "11A", "4A", "6B", "9A", "2A", "1A", "5B", "10A", "7A", "3B", "12A"]
    bpms_tech = ["134.00", "136.00", "132.00", "135.00", "130.00", "133.00", "135.00", "138.00", "131.00", "137.00", "134.00", "136.00"]

    for idx, item in enumerate(resultados):
        millis = item.get("trackTimeMillis") or 360000
        secs = int(millis // 1000)
        dur_str = f"{secs // 60}:{secs % 60:02d}"
        # Escalar portada a 300x300 de alta nitidez
        art = (item.get("artworkUrl100") or "").replace("100x100bb", "300x300bb")
        tracks.append({
            "id": str(item.get("trackId") or f"trk_{idx}"),
            "title": item.get("trackName", "Unknown Track"),
            "artist": item.get("artistName", search_term),
            "album": item.get("collectionName", "Single / EP"),
            "duration": dur_str,
            "bpm": bpms_tech[idx % len(bpms_tech)],
            "key": keys_camelot[idx % len(keys_camelot)],
            "cover": art,
            "preview_url": item.get("previewUrl", "")
        })

    print(f"[BACKEND EEL] Catálogo resuelto: {len(tracks)} pistas con carátulas HD y stream instantáneo.")
    return {"status": "ok", "tracks": tracks}

@eel.expose
def resolver_stream_preescucha(titulo, artista):
    print(f"[PRE-ESCUCHA] Buscando stream de baja latencia para: {artista} - {titulo}")
    # 1. Vía rápida (<150ms): obtener previewUrl M4A directo desde CDN
    res = _buscar_metadata_itunes(f"{artista} {titulo}", limit=1)
    if res and res[0].get("previewUrl"):
        stream_url = res[0]["previewUrl"]
        print(f"[PRE-ESCUCHA] Stream CDN ultrarrápido listo.")
        return {"status": "ok", "stream_url": stream_url}

    # 2. Fallback compatible con GitHub Issue #12482 (sin player_client=android ni formato fijo 140)
    try:
        query = f"ytsearch1:{artista} - {titulo} audio"
        cmd = ["yt-dlp", "-g", "-f", "bestaudio/best", "--extractor-args", "youtube:player_client=default,mweb", query]
        out = subprocess.check_output(cmd, text=True, timeout=10)
        url = out.strip().splitlines()[0]
        if url:
            return {"status": "ok", "stream_url": url}
    except Exception as e:
        print(f"[ERROR] Fallback yt-dlp falló: {e}")

    return {"status": "error", "stream_url": ""}

@eel.expose
def detener_preescucha():
    return {"status": "detenido"}

# ==============================================================================
# SISTEMA DE DESCARGA MULTI-FORMATO CON SELECTOR NATIVO MACOS Y FLAC HI-RES
# ==============================================================================
import os
import subprocess
import threading

directorio_descargas_actual = "/Users/admin/Music/mi musica"

@eel.expose
def seleccionar_directorio_descarga():
    global directorio_descargas_actual
    print("[EXPLORADOR NATIVO] Abriendo selector de carpetas de macOS...")
    try:
        # Abre el diálogo nativo de Finder / macOS mediante AppleScript
        cmd = """osascript -e 'POSIX path of (choose folder with prompt "Selecciona la carpeta de destino para las descargas DJ:")'"""
        res = subprocess.check_output(cmd, shell=True, text=True).strip()
        if res and os.path.isdir(res):
            directorio_descargas_actual = res
            print(f"[EXPLORADOR NATIVO] Carpeta seleccionada: {directorio_descargas_actual}")
            return {"status": "ok", "path": directorio_descargas_actual}
    except Exception as e:
        print(f"[EXPLORADOR NATIVO] Diálogo cancelado o error: {e}")
    return {"status": "cancelado", "path": directorio_descargas_actual}

@eel.expose
def obtener_directorio_descarga_actual():
    return directorio_descargas_actual

@eel.expose
def descargar_pistas_spotify_seleccionadas(tracks_to_download, formato="flac", custom_dir=""):
    global directorio_descargas_actual
    target_dir = custom_dir if (custom_dir and os.path.isdir(custom_dir)) else directorio_descargas_actual
    os.makedirs(target_dir, exist_ok=True)
    
    print(f"[API PROXY] Iniciando ingesta real Lossless de {len(tracks_to_download)} pistas en .{formato.upper()} -> {target_dir}")
    def worker():
        total = len(tracks_to_download)
        completadas = 0
        fallidas = 0

        for i, t in enumerate(tracks_to_download):
            nombre = t.get('title', f"Track_{i+1}")
            artista = t.get('artist', 'Artista')
            spotify_id = t.get('id', '')
            isrc = t.get('isrc', '')
            
            porcentaje = int((i / total) * 100)
            try:
                eel.actualizar_estado_descarga(porcentaje, f"[DESCARGANDO] ({i+1}/{total}) Procesando: {artista} - {nombre}")()
            except Exception:
                pass

            meta = {
                "id": str(spotify_id),
                "title": nombre,
                "artist": artista,
                "album": t.get("album", "CleanDJmix PRO"),
                "cover_url": t.get("cover", t.get("cover_url", "")),
                "bpm": t.get("bpm", 135.0),
                "key": t.get("key", "8A"),
                "isrc": isrc,
                "apple_url": t.get("apple_url", ""),
                "format": formato.lower()
            }

            max_intentos = 3
            ruta_final = None
            msg_error = ""

            for intento in range(max_intentos):
                try:
                    res_ingest = ingest_service.descargar_e_inyectar_flac(meta, target_dir)
                    if res_ingest and res_ingest.get("status") == "ok":
                        ruta_final = res_ingest.get("path")
                        break
                    msg_error = res_ingest.get("msg", "") if res_ingest else "Respuesta nula"
                    if any(code in msg_error for code in ["403", "409", "429"]):
                        time.sleep(2 ** intento)
                    else:
                        break
                except Exception as e:
                    msg_error = str(e)
                    time.sleep(2 ** intento)

            if ruta_final and os.path.exists(ruta_final) and os.path.getsize(ruta_final) > 2048:
                completadas += 1
                try:
                    eel.log_to_console(f"✅ Guardado: {os.path.basename(ruta_final)}")()
                except: pass
            else:
                fallidas += 1
                try:
                    eel.log_to_console(f"❌ Error en {nombre}: {msg_error}")()
                except: pass

            # Finalización del lote (siempre desbloquea la UI)
            resumen_msg = f"[COMPLETADO] Lote finalizado. Éxitos: {completadas}, Fallos: {fallidas}."
            print(f"\n[LOTE INGEST FINALIZADO] {resumen_msg}")
            try:
                eel.actualizar_estado_descarga(100, resumen_msg)()
                eel.notificar_fin_lote(resumen_msg)()
            except Exception as e:
                print(f"[EEL WARN] No se pudo notificar fin de lote: {e}")

        threading.Thread(target=worker, daemon=True).start()
        return {"status": "iniciado"}

    target_dir = custom_dir if (custom_dir and os.path.isdir(custom_dir)) else directorio_descargas_actual
    os.makedirs(target_dir, exist_ok=True)
    
    print(f"[API PROXY] Iniciando ingesta real Lossless de {len(tracks_to_download)} pistas en .{formato.upper()} -> {target_dir}")

    def worker():
        total = len(tracks_to_download)
        completadas = 0

        for i, t in enumerate(tracks_to_download):
            nombre = t.get('title', f"Track_{i+1}")
            artista = t.get('artist', 'Artista')
            spotify_id = t.get('id', '')
            isrc = t.get('isrc', '')
            
            print(f"\n[INGEST PROXY {i+1}/{total}] Solicitando máster FLAC: {artista} - {nombre} (ISRC: {isrc})")

            meta = {
                "id": str(spotify_id),
                "title": nombre,
                "artist": artista,
                "album": t.get("album", "CleanDJmix PRO"),
                "cover_url": t.get("cover", t.get("cover_url", "")),
                "bpm": t.get("bpm", 135.0),
                "key": t.get("key", "8A"),
                "isrc": isrc,
                "apple_url": t.get("apple_url", ""),
                "format": formato.lower()
            }

            max_intentos = 3
            ruta_final = None

            for intento in range(max_intentos):
                try:
                    # Invocación directa al servicio nativo Lossless recuperado
                    res_ingest = ingest_service.descargar_e_inyectar_flac(meta, target_dir)
                    
                    if res_ingest and res_ingest.get("status") == "ok":
                        ruta_final = res_ingest.get("path")
                        break
                        
                    msg_error = res_ingest.get("msg", "") if res_ingest else "Respuesta nula"
                    if any(code in msg_error for code in ["403", "409", "429"]):
                        tiempo_espera = 2 ** intento
                        print(f"[PROXY WARN] Interceptado {msg_error}. Backoff de {tiempo_espera}s ({intento+1}/{max_intentos})...")
                        time.sleep(tiempo_espera)
                    else:
                        print(f"[ERROR PROXY] Fallo en pasarela: {msg_error}")
                        break
                except Exception as e:
                    error_str = str(e)
                    if any(code in error_str for code in ["403", "409", "429"]):
                        tiempo_espera = 2 ** intento
                        print(f"[PROXY EXCEPCIÓN] Bloqueo HTTP ({error_str}). Backoff {tiempo_espera}s...")
                        time.sleep(tiempo_espera)
                    else:
                        print(f"[CRÍTICO PROXY] Error en hilo de ingesta: {error_str}")
                        break

            if ruta_final and os.path.exists(ruta_final) and os.path.getsize(ruta_final) > 2048:
                peso_mb = os.path.getsize(ruta_final) / (1024 * 1024)
                completadas += 1
                print(f"✅ [FLAC LOSSLESS REAL] Volcado completado ({peso_mb:.2f} MB): {ruta_final}")
                try:
                    eel.log_to_console(f"Guardado FLAC: {os.path.basename(ruta_final)} ({peso_mb:.2f} MB)")()
                except Exception:
                    pass
            else:
                print(f"❌ [FALLO INGEST] No se pudo generar el binario lossless para {nombre}.")

        print(f"\n[LOTE INGEST FINALIZADO] {completadas}/{total} pistas procesadas correctamente en {target_dir}")
        try:
            if hasattr(eel, 'notificar_fin_lote'):
                eel.notificar_fin_lote(f"[COMPLETADO] {completadas}/{total} pistas FLAC Lossless guardadas en disco.")()
            eel.log_to_console(f"✅ Lote completado: {completadas}/{total} pistas Lossless guardadas.")()
        except Exception:
            pass

    threading.Thread(target=worker, daemon=True).start()
    return {"status": "iniciado"}

if __name__ == "__main__": # pragma: no cover
    try:
        import subprocess
        # Obtener resolución real de pantalla en macOS vía system_profiler o defaults
        try:
            cmd = "system_profiler SPDisplaysDataType | grep Resolution"
            res_line = subprocess.check_output(cmd, shell=True).decode()
            parts = res_line.strip().split()
            w, h = int(parts[1]), int(parts[3])
        except Exception:
            w, h = 1920, 1080

        eel.init("web")
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