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
        self._cancelar = False

    def cancelar_descarga(self):
        """Activa la bandera para detener las descargas y análisis en curso."""
        self._cancelar = True
        print("[DOWNLOAD SERVICE] Cancelación de descargas activada.")

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

    def ejecutar_lote_descarga(self, tracks_to_download, formato, custom_dir, audio_service_ref, eel_ref, eliminar_originales=False):
        target_dir = custom_dir if (custom_dir and os.path.isdir(custom_dir)) else self.directorio_descargas
        os.makedirs(target_dir, exist_ok=True)
        self._cancelar = False

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
                if self._cancelar:
                    return

                nombre = t.get('title', f"Track_{indice_pista+1}")
                artista = t.get('artist', 'Artista')
                spotify_id = t.get('id', '')
                isrc = t.get('isrc', '')
                spotify_url = t.get('spotify_url') or t.get('url') or ""
                if not spotify_url and spotify_id:
                    if "spotify.com" in str(spotify_id):
                        spotify_url = str(spotify_id)
                    elif len(str(spotify_id)) == 22:
                        spotify_url = f"https://open.spotify.com/track/{spotify_id}"

                meta = {
                    "id": str(spotify_id),
                    "spotify_url": spotify_url,
                    "title": nombre,
                    "artist": artista,
                    "album": t.get("album", "CleanDJmix PRO"),
                    "cover_url": t.get("cover", t.get("cover_url", "")),
                    "bpm": t.get("bpm", 135.0),
                    "key": t.get("key", "8A"),
                    "genre": t.get("genre", "Electronic"),
                    "subgenre": t.get("subgenre", "Tech House"),
                    "duration": t.get("duration", ""),
                    "original_duration": t.get("original_duration", t.get("duration", "")),
                    "isrc": isrc,
                    "apple_url": t.get("apple_url", ""),
                    "format": formato.lower()
                }

                max_intentos = 3
                ruta_final = None
                msg_error = ""

                for intento in range(max_intentos):
                    if self._cancelar:
                        return
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

                if self._cancelar:
                    return

                exito = bool(ruta_final and os.path.exists(ruta_final) and os.path.getsize(ruta_final) > 2048)

                with counter_lock:
                    procesadas += 1
                    pct = int((procesadas / total) * 100)
                    if exito:
                        completadas += 1
                        fmt_final = os.path.splitext(ruta_final)[1].replace(".", "").upper()
                        try:
                            eel_ref.actualizar_estado_descarga(
                                100 if procesadas == total else pct, 
                                f"[DESCARGADO 100%] ({procesadas}/{total}) ✓ {artista} - {nombre}"
                            )()
                            eel_ref.log_to_console(f"✅ Descarga finalizada: {os.path.basename(ruta_final)}")()
                            if hasattr(eel_ref, "notificar_resultado_auditoria"):
                                eel_ref.notificar_resultado_auditoria({
                                    "id": spotify_id,
                                    "title": nombre,
                                    "name": nombre,
                                    "artist": artista,
                                    "album": t.get("album", ""),
                                    "format": fmt_final,
                                    "status": "Descargado",
                                    "estado": "Descargado",
                                    "calidad": "Pendiente de Auditoría",
                                    "corte": "--",
                                    "cutoff_khz": None,
                                    "sample_rate_khz": None,
                                    "bitrate_kbps": None,
                                    "perdida": "--",
                                    "es_fake": False,
                                    "badge_color": "gray",
                                    "audit_status": "pendiente",
                                    "consejo": "Pendiente de análisis FFT",
                                    "spotify_url": spotify_url,
                                    "path": ruta_final,
                                    "downloaded": True,
                                    "selected": True
                                })()
                        except Exception:
                            pass

                        # ── PURGA AUTOMÁTICA DEL ARCHIVO ORIGINAL DE BAJA CALIDAD SI SE SELECCIONÓ EL CHECK ──
                        if eliminar_originales:
                            orig_path = t.get('original_path') or (t.get('path') if t.get('origin') == 'audit_upgrade' else None)
                            if orig_path and os.path.exists(orig_path) and os.path.isfile(orig_path):
                                real_orig = os.path.realpath(orig_path)
                                real_dest = os.path.realpath(ruta_final)
                                if real_orig != real_dest:
                                    borrado_ok = False
                                    err_borrado = ""
                                    # Intentar eliminación segura con audio_service_ref si está disponible
                                    if audio_service_ref and hasattr(audio_service_ref, 'eliminar_pistas_disco'):
                                        try:
                                            res_del = audio_service_ref.eliminar_pistas_disco([real_orig], permanente=True)
                                            if res_del.get("eliminados", 0) > 0:
                                                borrado_ok = True
                                            else:
                                                err_borrado = "; ".join(res_del.get("errores", []))
                                        except Exception as e_del:
                                            err_borrado = str(e_del)
                                    
                                    # Fallback directo a os.remove
                                    if not borrado_ok:
                                        try:
                                            os.remove(real_orig)
                                            borrado_ok = True
                                        except Exception as e_os:
                                            err_borrado = str(e_os)

                                    if borrado_ok:
                                        nombre_orig = os.path.basename(real_orig)
                                        print(f"[PURGA AUTO] ✅ Pista original de baja calidad eliminada: {real_orig}")
                                        try:
                                            eel_ref.log_to_console(f"🗑️ [PURGA] Archivo original de baja calidad eliminado del disco: {nombre_orig}")()
                                        except Exception:
                                            pass
                                        try:
                                            if hasattr(eel_ref, "notificar_archivo_original_eliminado"):
                                                eel_ref.notificar_archivo_original_eliminado({
                                                    "id": spotify_id,
                                                    "original_path": real_orig,
                                                    "filename": nombre_orig
                                                })()
                                        except Exception:
                                            pass
                                        try:
                                            if hasattr(eel_ref, "notificar_archivo_original_eliminado_global"):
                                                eel_ref.notificar_archivo_original_eliminado_global({
                                                    "id": spotify_id,
                                                    "original_path": real_orig,
                                                    "filename": nombre_orig
                                                })()
                                        except Exception:
                                            pass
                                    else:
                                        print(f"[PURGA AUTO] ⚠️ No se pudo eliminar el archivo original {real_orig}: {err_borrado}")
                                        try:
                                            eel_ref.log_to_console(f"⚠️ [AVISO] No se pudo eliminar el original {os.path.basename(real_orig)}: {err_borrado}")()
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
                            if hasattr(eel_ref, "notificar_fallo_descarga"):
                                eel_ref.notificar_fallo_descarga({
                                    "id": spotify_id,
                                    "title": nombre,
                                    "name": nombre,
                                    "artist": artista,
                                    "error": msg_error or "Fallo de descarga en servidor o fuente inaccesible"
                                })()
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

            if self._cancelar:
                resumen_msg = f"[CANCELADO] Lote cancelado. Descargadas: {completadas}, Pendientes: {total - procesadas}."
                try:
                    eel_ref.actualizar_estado_descarga(0, resumen_msg)()
                    stats = {"total": total, "completadas": completadas, "fallidas": fallidas, "cancelado": True}
                    try:
                        eel_ref.notificar_fin_lote(resumen_msg, stats)()
                    except Exception:
                        eel_ref.notificar_fin_lote(resumen_msg)()
                except Exception:
                    pass
            else:
                resumen_msg = f"✅ [COMPLETADO 100%] Lote finalizado: {completadas} pistas descargadas con éxito."
                try:
                    eel_ref.actualizar_estado_descarga(100, resumen_msg)()
                    stats = {"total": total, "completadas": completadas, "fallidas": fallidas}
                    try:
                        eel_ref.notificar_fin_lote(resumen_msg, stats)()
                    except Exception:
                        eel_ref.notificar_fin_lote(resumen_msg)()
                except Exception:
                    pass

        threading.Thread(target=worker, daemon=True).start()
        return {"status": "iniciado"}

    def ejecutar_auditoria_descargas_fft(self, tracks_to_audit, audio_service_ref, eel_ref):
        """
        Ejecuta la auditoría acústica FFT y diagnóstico de fidelidad sobre pistas ya descargadas.
        Evalúa corte espectral, detecta falsos upsamples y formula el consejo de formato óptimo para el DJ.
        """
        self._cancelar = False

        def worker():
            total = len(tracks_to_audit)
            if total == 0:
                return

            resultados = []
            for idx, trk in enumerate(tracks_to_audit):
                if self._cancelar:
                    break

                ruta = trk.get("path") or trk.get("local_path") or ""
                nombre = trk.get("title") or trk.get("name") or "Pista"
                artista = trk.get("artist") or "Artista"
                spotify_id = trk.get("id", "")
                fmt = trk.get("format") or (os.path.splitext(ruta)[1].replace(".", "").upper() if ruta else "FLAC")

                pct = int(((idx + 1) / total) * 100)
                try:
                    if hasattr(eel_ref, "actualizar_estado_fft"):
                        eel_ref.actualizar_estado_fft(
                            pct,
                            f"[AUDITORÍA FFT] ({idx + 1}/{total}) Analizando espectro: {artista} - {nombre}..."
                        )()
                except Exception:
                    pass

                if not ruta or not os.path.exists(ruta):
                    res_item = {
                        **trk,
                        "audit_status": "error",
                        "status": "Archivo no encontrado",
                        "calidad": "Error",
                        "corte": "--",
                        "consejo": "No se localizó el archivo en disco."
                    }
                    resultados.append(res_item)
                    continue

                try:
                    fft_res = audio_service_ref.analizar_espectro_fft(ruta, spotify_id=spotify_id) if audio_service_ref else {}
                    diag = fft_res.get("diagnostico") or {}
                    status_cert = diag.get("status") or fft_res.get("estado") or fft_res.get("status") or "Lossless OK"
                    calidad_cert = diag.get("calidad") or "Alta"
                    perdida_cert = diag.get("perdida") or (f"{fft_res.get('perdida')}%" if fft_res.get('perdida') else "Sin Pérdida")
                    perdida_pct = diag.get("perdida_pct", fft_res.get("perdida", 0))
                    compresion_cert = diag.get("compresion") or "Lossless"
                    cutoff = fft_res.get("cutoff_khz", 22.0)
                    corte_cert = fft_res.get("corte") or f"{cutoff} kHz"
                    khz_cert = diag.get("sample_rate_khz") or round(fft_res.get("samplerate", 44100) / 1000.0, 1)
                    kbps_cert = diag.get("bitrate_kbps") or 0
                    fmt_cert = diag.get("format") or fmt
                    es_fake = bool(diag.get("es_fake", False) or ("Fake" in str(status_cert)) or (cutoff and cutoff < 18.0 and fmt_cert in ["FLAC", "WAV", "AIFF"]))
                    badge_color = "red" if es_fake else ("amber" if "Media" in calidad_cert else "green")

                    # Generar dictamen y consejo experto DJ
                    if es_fake:
                        consejo = f"⚠️ Fake Upsample detectado (Corte {corte_cert}). Se recomienda descargar en MP3 320 kbps para eliminar peso artificial en CDJs."
                        sugerencia_formato = "mp3"
                    elif fmt_cert.upper() == "MP3" and cutoff and cutoff >= 19.5:
                        consejo = f"✓ MP3 320 kbps CBR Verificado (Corte {corte_cert}). Espectro óptimo para club."
                        sugerencia_formato = None
                    elif fmt_cert.upper() == "MP3" and cutoff and cutoff < 16.0:
                        consejo = f"⚠️ MP3 con compresión agresiva (Corte {corte_cert}). Se recomienda reintentar en FLAC Hi-Res."
                        sugerencia_formato = "flac"
                    else:
                        consejo = f"✓ Calidad Máxima Certificada (Corte {corte_cert}). Archivo {fmt_cert} genuino sin pérdida."
                        sugerencia_formato = None

                    audit_data = {
                        **trk,
                        "id": spotify_id,
                        "title": nombre,
                        "artist": artista,
                        "path": ruta,
                        "status": "FLAC FAKE" if es_fake else status_cert,
                        "estado": "FLAC FAKE" if es_fake else status_cert,
                        "calidad": calidad_cert,
                        "perdida": perdida_cert,
                        "perdida_pct": perdida_pct,
                        "compresion": compresion_cert,
                        "cutoff_khz": cutoff,
                        "corte": corte_cert,
                        "format": fmt_cert,
                        "sample_rate_khz": khz_cert,
                        "bitrate_kbps": kbps_cert,
                        "es_fake": es_fake,
                        "badge_color": badge_color,
                        "audit_status": "completada",
                        "consejo": consejo,
                        "sugerencia_formato": sugerencia_formato
                    }
                    resultados.append(audit_data)

                    # Notificar a la UI en vivo por cada pista auditada
                    if hasattr(eel_ref, "notificar_resultado_auditoria_post_descarga"):
                        eel_ref.notificar_resultado_auditoria_post_descarga(audit_data)()

                except Exception as e_fft:
                    print(f"[AUDITORIA POST-DESCARGA ERROR] {e_fft}")
                    err_item = {
                        **trk,
                        "audit_status": "error",
                        "consejo": f"Error en análisis: {e_fft}"
                    }
                    resultados.append(err_item)

            if self._cancelar:
                msg_fin = "[CANCELADO] Auditoría FFT detenida por el usuario."
                pct_fin = 0
            else:
                msg_fin = f"✅ [AUDITORÍA FINALIZADA] {len(resultados)} pista(s) certificadas por FFT."
                pct_fin = 100

            try:
                if hasattr(eel_ref, "actualizar_estado_fft"):
                    eel_ref.actualizar_estado_fft(pct_fin, msg_fin)()
                if hasattr(eel_ref, "notificar_fin_auditoria_post_descarga"):
                    eel_ref.notificar_fin_auditoria_post_descarga(resultados)()
            except Exception:
                pass

        threading.Thread(target=worker, daemon=True).start()
        return {"status": "iniciado"}

        threading.Thread(target=worker, daemon=True).start()
        return {"status": "iniciado"}
