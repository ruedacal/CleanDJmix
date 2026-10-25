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
from application.taxonomy_service import TaxonomyService
from services.shazam_service import ShazamRecognitionService
from services.tag_sanitizer_service import TagSanitizerService
from services.trends_service import trends_service
from services.knowledge_service import knowledge_service

def compilar_frontend_si_necesario():
    jsx_path = os.path.join("web", "js", "app.jsx")
    bundle_path = os.path.join("web", "js", "app.bundle.js")
    if os.path.exists(jsx_path):
        if not os.path.exists(bundle_path) or os.path.getmtime(jsx_path) > os.path.getmtime(bundle_path):
            try:
                subprocess.run(
                    ["npx", "-y", "esbuild", jsx_path, f"--outfile={bundle_path}"],
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
media_svc = MediaService()
download_svc = DownloadService()
export_svc = ExportService()
taxonomy_svc = TaxonomyService()
shazam_svc = ShazamRecognitionService()

@bottle.route('/cover')
def get_cover():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
    if bottle.request.method == 'OPTIONS':
        return ""
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
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
    if bottle.request.method == 'OPTIONS':
        return ""
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
    if isinstance(ruta_directorio, (list, tuple)) and len(ruta_directorio) > 0:
        audio_playback_svc.establecer_directorio(os.path.dirname(ruta_directorio[0]))
    elif isinstance(ruta_directorio, str):
        audio_playback_svc.establecer_directorio(ruta_directorio)
    return audit_svc.cargar_metadatos_directorio(ruta_directorio, _emitir_progreso_batch)

@eel.expose
def iniciar_auditoria(ruta_directorio, opts=None):
    if isinstance(ruta_directorio, (list, tuple)) and len(ruta_directorio) > 0:
        audio_playback_svc.establecer_directorio(os.path.dirname(ruta_directorio[0]))
    elif isinstance(ruta_directorio, str):
        audio_playback_svc.establecer_directorio(ruta_directorio)
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
def detectar_duplicados_biblioteca(tracks=None):
    if not tracks:
        res_dir = audit_svc.cargar_metadatos_directorio(audit_svc.directorio_actual)
        tracks = res_dir.get("tracks", [])
    return audit_svc.detectar_duplicados_biblioteca(tracks)

@eel.expose
def eliminar_pistas_duplicadas(paths):
    return audit_svc.eliminar_pistas_duplicadas(paths)

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
def identificar_archivo_shazam(filepath, motor="hybrid", audd_token=""):
    return shazam_svc.reconocer_archivo(filepath, motor=motor, audd_token=audd_token)

@eel.expose
def identificar_audio_base64(b64_data, motor="hybrid", audd_token="", filename=""):
    return shazam_svc.reconocer_base64(b64_data, motor=motor, audd_token=audd_token, filename=filename)

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
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    audit_svc.cancelar_proceso()
    download_svc.cancelar_descarga()
    media_svc.cancelar_busqueda()
    print("[SERVER] Cancelación solicitada y ejecutada vía HTTP /api/cancelar_procesos")
    return {"status": "ok", "msg": "Procesos cancelados"}

@bottle.route('/api/analizar_spotify', method=['GET', 'POST', 'OPTIONS'])
def api_analizar_spotify():
    bottle.response.set_header("Access-Control-Allow-Origin", "*")
    bottle.response.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    bottle.response.set_header("Access-Control-Allow-Headers", "*")
    if bottle.request.method == 'OPTIONS':
        return ""
    q = bottle.request.query.get('query', '')
    if not q and bottle.request.json:
        q = bottle.request.json.get('query', '')
    if not q:
        q = bottle.request.forms.get('query', '')
    res = media_svc.analizar_catalogo_spotify(q or "")
    return res

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
    data = bottle.request.json or {}
    tracks = data.get('tracks', [])
    return media_svc.buscar_reemplazos_spotify_batch(tracks)

@eel.expose
def buscar_reemplazos_spotify_batch(tracks):
    """Busca en paralelo versiones oficiales HD en Spotify para una lista de pistas de baja calidad o FLAC fake."""
    return media_svc.buscar_reemplazos_spotify_batch(tracks)

@eel.expose
def cancelar_procesos_activos():
    audit_svc.cancelar_proceso()
    download_svc.cancelar_descarga()
    media_svc.cancelar_busqueda()
    print("[SERVER] Cancelación solicitada y ejecutada vía Eel cancelar_procesos_activos")
    return {"status": "ok", "msg": "Procesos cancelados"}

@eel.expose
def seleccionar_directorio_descarga():
    return download_svc.seleccionar_directorio_descarga()

@eel.expose
def obtener_directorio_descarga_actual():
    return download_svc.obtener_directorio_actual()

@eel.expose
def descargar_pistas_spotify_seleccionadas(tracks_to_download, formato="flac", custom_dir=""):
    return download_svc.ejecutar_lote_descarga(tracks_to_download, formato, custom_dir, audit_svc, eel)

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
def exportar_set_m3u(tracks, nombre_set="BeatWave_DJ_Set", destino_dir="/Users/admin/Music/mi musica"):
    return export_svc.exportar_set_m3u(tracks, destino_dir, nombre_set)

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
                    f.write(f"{i:02d}. {art} - {tit} [{alb} {yr}] - {gen} (ISRC: {isrc})\n")
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
                    writer.writerow(["#", "Artista", "Titulo", "Album", "Genero", "Ano", "ISRC", "Fecha Apunte"])
                    for i, trk in enumerate(tracks, 1):
                        writer.writerow([
                            i,
                            trk.get("artist") or trk.get("a") or "",
                            trk.get("title") or trk.get("t") or "",
                            trk.get("album") or "",
                            trk.get("genre") or "",
                            trk.get("year") or "",
                            trk.get("isrc") or "",
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
            close_callback=lambda page, sockets: None,
            cmdline_args=[
                "--start-maximized",
                "--no-first-run",
                "--disable-default-apps"
            ],
            port=8000
        )
    except (SystemExit, KeyboardInterrupt):
        print("\n[CleanDJmix PRO] Servidor detenido.")
