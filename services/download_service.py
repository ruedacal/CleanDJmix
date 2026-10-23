import os
import subprocess
import time
import threading
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
            completadas = 0
            fallidas = 0

            for i, t in enumerate(tracks_to_download):
                nombre = t.get('title', f"Track_{i+1}")
                artista = t.get('artist', 'Artista')
                spotify_id = t.get('id', '')
                isrc = t.get('isrc', '')

                porcentaje = int((i / total) * 100)
                try:
                    eel_ref.actualizar_estado_descarga(porcentaje, f"[DESCARGANDO] ({i+1}/{total}) Procesando: {artista} - {nombre}")()
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
                        res_ingest = self.ingest_service.descargar_e_inyectar_flac(meta, target_dir)
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
                        eel_ref.log_to_console(f"✅ Guardado: {os.path.basename(ruta_final)}")()
                        fft_res = audio_service_ref.analizar_espectro_fft(ruta_final)
                        eel_ref.notificar_resultado_auditoria({"id": spotify_id, **fft_res})()
                    except:
                        pass
                else:
                    fallidas += 1
                    try:
                        eel_ref.log_to_console(f"❌ Error en {nombre}: {msg_error}")()
                    except:
                        pass

            resumen_msg = f"[COMPLETADO] Lote finalizado. Éxitos: {completadas}, Fallos: {fallidas}."
            try:
                eel_ref.actualizar_estado_descarga(100, resumen_msg)()
                eel_ref.notificar_fin_lote(resumen_msg)()
            except Exception:
                pass

        threading.Thread(target=worker, daemon=True).start()
        return {"status": "iniciado"}
