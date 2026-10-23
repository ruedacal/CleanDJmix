import os
import subprocess
import threading
import numpy as np
import soundfile as sf
import eel
from mutagen import File as MutagenFile
from mutagen.flac import FLAC
from infrastructure.audio_processor import AudioProcessorService

class AuditService:
    def __init__(self):
        self.directorio_actual = "/Users/admin/Music/mi musica"
        self._lock = threading.Lock()

    def seleccionar_directorio(self):
        if not self._lock.acquire(blocking=False):
            return ""
        try:
            # Desbloqueo instantáneo frente a Chrome Kiosk: sacar SystemUIServer a primer plano sin esperar a Finder
            script = """
            tell application "SystemUIServer"
                activate
                set chosenFolder to choose folder with prompt "Selecciona tu carpeta de música DJ:"
                return POSIX path of chosenFolder
            end tell
            """
            proc = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=60)
            if proc.returncode == 0 and proc.stdout.strip():
                ruta = proc.stdout.strip()
                if os.path.isdir(ruta):
                    self.directorio_actual = ruta
                    return ruta
        except Exception as e:
            print(f"[EXPLORADOR ERROR] {e}")
        finally:
            self._lock.release()
        return ""

    def analizar_espectro_fft(self, filepath, spotify_id=None):
        print(f"[AUDITORIA FFT] Analizando espectro de: {os.path.basename(filepath)}")
        try:
            fs = 44100
            info_sf = sf.info(filepath)
            start_frame = min(fs * 30, max(0, int(info_sf.frames * 0.25)))
            frames_to_read = min(fs * 10, max(4096, info_sf.frames - start_frame))
            data, samplerate = sf.read(filepath, start=start_frame, frames=frames_to_read)
            if len(data.shape) > 1:
                data = data.mean(axis=1)
            yf, xf = np.fft.rfft(data), np.fft.rfftfreq(len(data), 1 / samplerate)
            mag = np.where(np.abs(yf) > 0, np.abs(yf), 1e-10)
            mag_db = 20 * np.log10(mag)
            frecuencias_validas = xf[mag_db > (np.max(mag_db) - 80)]
            cutoff_khz = (np.max(frecuencias_validas) if len(frecuencias_validas) > 0 else 0) / 1000.0
            estado = "True Lossless" if cutoff_khz >= 20.0 else "Falso FLAC"
            perdida = 0 if estado == "True Lossless" else max(0, round((1.0 - (cutoff_khz / 22.05)) * 100, 1))

            # Reducir magnitudes a un submuestreo de 64 bandas para visualizador UI
            bins_count = 64
            max_idx = min(len(mag_db), int(len(mag_db) * (24000.0 / (samplerate / 2.0)))) if samplerate > 0 else len(mag_db)
            chunk_size = max(1, max_idx // bins_count)
            spectrum_points = []
            max_db_val = float(np.max(mag_db))
            for i in range(bins_count):
                chunk = mag_db[i * chunk_size : (i + 1) * chunk_size]
                if len(chunk) > 0:
                    val = float(np.mean(chunk))
                    norm = max(0.0, min(1.0, (val - (max_db_val - 80)) / 80.0))
                    spectrum_points.append(round(norm, 3))
                else:
                    spectrum_points.append(0.0)

            resultado = {
                "id": spotify_id,
                "estado": estado,
                "corte": f"{cutoff_khz:.1f} kHz",
                "cutoff_khz": round(float(cutoff_khz), 1),
                "perdida": perdida,
                "spectrum": spectrum_points,
                "samplerate": samplerate
            }
            if spotify_id is not None and hasattr(eel, "notificar_resultado_auditoria"):
                try:
                    eel.notificar_resultado_auditoria(resultado)()
                except Exception:
                    pass
            return resultado
        except Exception as e:
            print(f"[ERROR DSP] {e}")
            err_res = {"id": spotify_id, "estado": "Error I/O", "corte": "N/A", "cutoff_khz": 22.0, "perdida": 0, "spectrum": []}
            if spotify_id is not None and hasattr(eel, "notificar_resultado_auditoria"):
                try:
                    eel.notificar_resultado_auditoria(err_res)()
                except Exception:
                    pass
            return err_res

    def iniciar_auditoria(self, ruta_directorio, emitir_log_cb=None):
        if not ruta_directorio or not os.path.exists(ruta_directorio):
            return {"total": 0, "sin_meta": 0, "ready": 0, "errors": 0, "tracks": []}

        self.directorio_actual = ruta_directorio
        if emitir_log_cb:
            emitir_log_cb(f"Iniciando auditoría avanzada en: {ruta_directorio}")

        tracks_auditados = []
        extensiones = (".flac", ".mp3", ".wav", ".aiff", ".m4a")
        idx = 1
        sin_meta_count = 0
        fake_count = 0

        for root, _, files in os.walk(ruta_directorio):
            for file in sorted(files):
                if file.startswith(".") or not file.lower().endswith(extensiones):
                    continue
                full_path = os.path.join(root, file)
                info = AudioProcessorService.analizar_track_avanzado(full_path)
                bpm_val = info.get("bpm")
                key_val = info.get("key")
                is_missing = bool(info.get("missing_meta", False) or not bpm_val or not key_val or str(bpm_val) == "--" or str(key_val) == "--")
                if is_missing:
                    sin_meta_count += 1

                status_str = str(info.get("status") or "Lossless OK")
                if "Fake" in status_str or "Error" in status_str:
                    fake_count += 1

                tracks_auditados.append({
                    "id": idx,
                    "f": str(file),
                    "filename": str(file),
                    "path": str(full_path),
                    "t": str(info.get("title") or os.path.splitext(file)[0]),
                    "title": str(info.get("title") or os.path.splitext(file)[0]),
                    "a": str(info.get("artist") or "Desconocido"),
                    "artist": str(info.get("artist") or "Desconocido"),
                    "b": f"{float(bpm_val):.2f}" if bpm_val and str(bpm_val) != "--" else "--",
                    "bpm": f"{float(bpm_val):.2f}" if bpm_val and str(bpm_val) != "--" else "--",
                    "k": str(key_val or "--"),
                    "key": str(key_val or "--"),
                    "e": int(info.get("energy") or 85),
                    "dance": int(info.get("danceability") or 85),
                    "mood": str(info.get("mood") or "Peak Time Hypnotic"),
                    "duration": str(info.get("duration") or "05:30"),
                    "format": str(info.get("format") or os.path.splitext(file)[1].replace(".", "").upper()),
                    "status": status_str,
                    "cutoff_khz": float(info.get("cutoff_khz") or 22.0),
                    "trim_start_ms": float(info.get("trim_start_ms") or 0.0),
                    "first_downbeat_ms": float(info.get("first_downbeat_ms") or 0.0),
                    "comment": str(info.get("comment") or "Intro limpia 32b • Drop contundente • Outro 64b")
                })
                idx += 1
                if len(tracks_auditados) >= 2500:
                    break

        total = len(tracks_auditados)
        ready_count = max(0, total - sin_meta_count)
        return {
            "total": total,
            "sin_meta": sin_meta_count,
            "ready": ready_count,
            "errors": fake_count,
            "tracks": tracks_auditados
        }

    def cargar_metadatos_directorio(self, ruta_directorio):
        """Lee únicamente los metadatos existentes de los archivos sin ejecutar procesos pesados."""
        if not ruta_directorio or not os.path.exists(ruta_directorio):
            return {"total": 0, "sin_meta": 0, "ready": 0, "errors": 0, "tracks": []}

        self.directorio_actual = ruta_directorio
        tracks_cargados = []
        extensiones = (".flac", ".mp3", ".wav", ".aiff", ".m4a")
        idx = 1
        sin_meta_count = 0

        for root, _, files in os.walk(ruta_directorio):
            for file in sorted(files):
                if file.startswith(".") or not file.lower().endswith(extensiones):
                    continue
                full_path = os.path.join(root, file)
                filename = os.path.basename(full_path)
                ext = os.path.splitext(filename)[1].lower()
                artist_fb, title_fb = AudioProcessorService._parsear_nombre(filename)

                title = ""
                artist = ""
                bpm_str = "--"
                key_str = "--"
                dur_str = "00:00"

                try:
                    if ext == ".flac":
                        try:
                            f = FLAC(full_path)
                            title = f.get("TITLE", [""])[0]
                            artist = f.get("ARTIST", [""])[0]
                            raw_k = f.get("INITIALKEY", f.get("KEY", [""]))[0]
                            if raw_k:
                                key_str = AudioProcessorService.normalizar_key(raw_k)
                            bpm_val = f.get("BPM", [""])[0]
                            if bpm_val:
                                try:
                                    bpm_str = f"{float(str(bpm_val).replace(',', '.')):.2f}"
                                except Exception:
                                    pass
                            if f.info and f.info.length:
                                m = int(f.info.length) // 60
                                s = int(f.info.length) % 60
                                dur_str = f"{m}:{s:02d}"
                        except Exception:
                            m = MutagenFile(full_path, easy=True)
                            if m:
                                title = str(m.get("title", [""])[0])
                                artist = str(m.get("artist", [""])[0])
                                if m.info and hasattr(m.info, "length"):
                                    dur_str = f"{int(m.info.length)//60}:{int(m.info.length)%60:02d}"
                    else:
                        m = MutagenFile(full_path, easy=True)
                        if m:
                            title = str(m.get("title", [""])[0])
                            artist = str(m.get("artist", [""])[0])
                            raw_bpm = str(m.get("bpm", [""])[0]).replace(",", ".")
                            if raw_bpm:
                                try:
                                    bpm_str = f"{float(raw_bpm):.2f}"
                                except Exception:
                                    pass
                            raw_key = str(m.get("initialkey", m.get("key", [""]))[0])
                            if raw_key:
                                key_str = AudioProcessorService.normalizar_key(raw_key)
                            if m.info and hasattr(m.info, "length"):
                                dur_str = f"{int(m.info.length)//60}:{int(m.info.length)%60:02d}"
                except Exception:
                    pass

                if not title:
                    title = title_fb
                if not artist:
                    artist = artist_fb

                missing = (bpm_str == "--" or key_str == "--")
                if missing:
                    sin_meta_count += 1

                tracks_cargados.append({
                    "id": idx,
                    "f": str(file),
                    "filename": str(file),
                    "path": str(full_path),
                    "t": str(title),
                    "title": str(title),
                    "a": str(artist),
                    "artist": str(artist),
                    "b": bpm_str,
                    "bpm": bpm_str,
                    "k": key_str,
                    "key": key_str,
                    "e": 0,
                    "dance": 0,
                    "mood": "Pendiente Auditoría",
                    "duration": dur_str,
                    "format": ext.replace(".", "").upper(),
                    "status": "Cargado (Sin auditar)",
                    "cutoff_khz": 0.0,
                    "trim_start_ms": 0.0,
                    "first_downbeat_ms": 0.0,
                    "comment": ""
                })
                idx += 1
                if len(tracks_cargados) >= 2500:
                    break

        total = len(tracks_cargados)
        ready_count = max(0, total - sin_meta_count)
        return {
            "total": total,
            "sin_meta": sin_meta_count,
            "ready": ready_count,
            "errors": 0,
            "tracks": tracks_cargados
        }
