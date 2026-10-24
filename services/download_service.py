import os
import subprocess
import time
import threading
from concurrent.futures import ThreadPoolExecutor
from infrastructure.spotify_flac_ingest import SpotifyFlacIngestService

class DownloadService:
    def __init__(self):
        self.ingest_service = SpotifyFlacIngestService()
        self.directorio_descargas = "/Users/admin/Music/mi musica"

    def seleccionar_directorio_descarga(self):
        try:
            script = '''
            tell application "Finder"
                activate
                set chosenFolder to choose folder with prompt "Selecciona la carpeta de destino para las descargas DJ:"
                return POSIX path of chosenFolder
            end tell
            '''
            res = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=60).stdout.strip()
            if res and os.path.isdir(res):
                self.directorio_descargas = res
                return {"status": "ok", "path": self.directorio_descargas}
        except Exception as e:
            print(f"[EXPLORADOR NATIVO] Diálogo cancelado o error: {e}")
        return {"status": "cancelado", "path": self.directorio_descargas}

    def obtener_directorio_actual(self):
        return self.directorio_descargas

    def ejecutar_lote_descarga(self, tracks_to_download, formato, custom_dir, audio_service_ref, eel_ref):
        target_dir = custom_dir if (custom_dir and os.path.isdir(custom_dir)) else self.directorio_descargas
        os.makedirs(target_dir, exist_ok=True)

        def worker():
            total = len(tracks_to_download)
            if total == 0:
                return

            counter_lock = threading.Lock()
            completadas = 0
            fallidas = 0
            procesadas = 0

            def procesar_una_pista(indice_pista, t):
                nonlocal completadas, fallidas, procesadas

                nombre = t.get('title', f"Track_{indice_pista+1}")
                artista = t.get('artist', 'Artista')
                spotify_id = t.get('id', '')
                isrc = t.get('isrc', '')

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
                        res_ingest = self.ingest_service.descargar_e_inyectar_flac(meta, target_dir)
                        if res_ingest and res_ingest.get("status") == "ok":
                            ruta_final = res_ingest.get("path")
                            break
                        msg_error = res_ingest.get("msg", "") if res_ingest else "Respuesta nula"
                        if any(code in msg_error for code in ["403", "409", "429"]):
                            time.sleep(2.0 + (intento * 1.5))
                        else:
                            break
                    except Exception as e:
                        msg_error = str(e)
                        time.sleep(2.0 + (intento * 1.5))

                exito = bool(ruta_final and os.path.exists(ruta_final) and os.path.getsize(ruta_final) > 2048)

                with counter_lock:
                    procesadas += 1
                    pct = int((procesadas / total) * 100)
                    if exito:
                        completadas += 1
                        try:
                            eel_ref.actualizar_estado_descarga(
                                pct, 
                                f"[DESCARGANDO] ({procesadas}/{total}) ✓ {artista} - {nombre}"
                            )()
                            eel_ref.log_to_console(f"✅ Guardado: {os.path.basename(ruta_final)}")()
                        except Exception:
                            pass
                    else:
                        fallidas += 1
                        try:
                            eel_ref.actualizar_estado_descarga(
                                pct, 
                                f"[DESCARGANDO] ({procesadas}/{total}) ⚠ Fallo: {artista} - {nombre}"
                            )()
                            eel_ref.log_to_console(f"❌ Error en {nombre}: {msg_error}")()
                        except Exception:
                            pass

                if exito and audio_service_ref:
                    try:
                        fft_res = audio_service_ref.analizar_espectro_fft(ruta_final)
                        eel_ref.notificar_resultado_auditoria({"id": spotify_id, **fft_res})()
                    except Exception:
                        pass

            # Pool controlado de 2 workers concurrentes con Lock de negociación anti-409/429
            num_workers = min(2, max(1, total))
            with ThreadPoolExecutor(max_workers=num_workers) as executor:
                futures = [
                    executor.submit(procesar_una_pista, idx, trk)
                    for idx, trk in enumerate(tracks_to_download)
                ]
                for fut in futures:
                    try:
                        fut.result()
                    except Exception as err:
                        print(f"[DOWNLOAD WORKER EXCEPTION] {err}")

            resumen_msg = f"[COMPLETADO] Lote finalizado. Éxitos: {completadas}, Fallos: {fallidas}."
            try:
                eel_ref.actualizar_estado_descarga(100, resumen_msg)()
                eel_ref.notificar_fin_lote(resumen_msg)()
            except Exception:
                pass

        threading.Thread(target=worker, daemon=True).start()
        return {"status": "iniciado"}
