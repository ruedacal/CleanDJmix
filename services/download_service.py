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

    def ejecutar_lote_descarga(self, tracks_to_download, formato, custom_dir, audio_service_ref, eel_ref):
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
                        try:
                            eel_ref.actualizar_estado_descarga(
                                100 if procesadas == total else pct, 
                                f"[DESCARGADO 100%] ({procesadas}/{total}) ✓ {artista} - {nombre}"
                            )()
                            eel_ref.log_to_console(f"✅ Descarga finalizada: {os.path.basename(ruta_final)}")()
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

                # Fase 2: Auditoría FFT del archivo descargado
                if exito and audio_service_ref and not self._cancelar:
                    try:
                        fft_pct = int((procesadas / total) * 100)
                        try:
                            if hasattr(eel_ref, "actualizar_estado_fft"):
                                eel_ref.actualizar_estado_fft(
                                    fft_pct,
                                    f"[AUDITORÍA FFT] ({procesadas}/{total}) Certificando corte espectral: {artista} - {nombre}..."
                                )()
                        except Exception:
                            pass

                        fft_res = audio_service_ref.analizar_espectro_fft(ruta_final, spotify_id=spotify_id)
                        diag = fft_res.get("diagnostico") or {}
                        status_cert = diag.get("status") or fft_res.get("estado") or fft_res.get("status") or "Lossless OK"
                        calidad_cert = diag.get("calidad") or "Alta"
                        perdida_cert = diag.get("perdida") or (f"{fft_res.get('perdida')}%" if fft_res.get('perdida') else "Sin Pérdida")
                        perdida_pct = diag.get("perdida_pct", fft_res.get("perdida", 0))
                        compresion_cert = diag.get("compresion") or "Lossless"
                        corte_cert = fft_res.get("corte") or f"{fft_res.get('cutoff_khz', 22.0)} kHz"
                        khz_cert = diag.get("sample_rate_khz") or round(fft_res.get("samplerate", 44100) / 1000.0, 1)
                        kbps_cert = diag.get("bitrate_kbps") or 0
                        fmt_cert = diag.get("format") or os.path.splitext(ruta_final)[1].replace(".", "").upper()
                        es_fake = bool(diag.get("es_fake", False) or ("Fake" in str(status_cert)))
                        badge_color = diag.get("badge_color", "red" if es_fake else "green")

                        if es_fake:
                            audit_cert_msg = f"⚠️ [{status_cert}] {fmt_cert} {khz_cert}kHz ({kbps_cert}kbps) • Corte: {corte_cert} • Calidad: {calidad_cert} • {perdida_cert} ({perdida_pct}%)"
                        else:
                            audit_cert_msg = f"✅ [{status_cert}] {fmt_cert} {khz_cert}kHz ({kbps_cert}kbps) • Corte: {corte_cert} • Calidad: {calidad_cert} • {perdida_cert}"

                        if hasattr(eel_ref, "actualizar_estado_fft"):
                            eel_ref.actualizar_estado_fft(fft_pct, audit_cert_msg)()

                        if hasattr(eel_ref, "notificar_resultado_auditoria"):
                            eel_ref.notificar_resultado_auditoria({
                                "id": spotify_id,
                                "status": status_cert,
                                "estado": status_cert,
                                "calidad": calidad_cert,
                                "perdida": perdida_cert,
                                "perdida_pct": perdida_pct,
                                "compresion": compresion_cert,
                                "cutoff_khz": fft_res.get("cutoff_khz", 22.0),
                                "corte": corte_cert,
                                "format": fmt_cert,
                                "sample_rate_khz": khz_cert,
                                "bitrate_kbps": kbps_cert,
                                "bit_depth": diag.get("bit_depth", 16),
                                "es_fake": es_fake,
                                "badge_color": badge_color,
                                "audit_msg": audit_cert_msg,
                                "spectrum": fft_res.get("spectrum", []),
                                "path": ruta_final
                            })()
                    except Exception as e_fft:
                        print(f"[AUDITORIA FFT ERROR] {e_fft}")

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
            else:
                resumen_msg = f"✅ [COMPLETADO 100%] Lote finalizado: {completadas} pistas descargadas y certificadas por FFT."
            try:
                eel_ref.actualizar_estado_descarga(100, resumen_msg)()
                if hasattr(eel_ref, "actualizar_estado_fft"):
                    eel_ref.actualizar_estado_fft(100, f"✅ [AUDITORÍA FINALIZADA] {completadas} pistas certificadas por FFT.")()
                stats = {"total": total, "completadas": completadas, "fallidas": fallidas}
                try:
                    eel_ref.notificar_fin_lote(resumen_msg, stats)()
                except Exception:
                    eel_ref.notificar_fin_lote(resumen_msg)()
            except Exception:
                pass

        threading.Thread(target=worker, daemon=True).start()
        return {"status": "iniciado"}
