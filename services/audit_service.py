import os
import subprocess
import threading
import numpy as np
import soundfile as sf
import eel
from mutagen import File as MutagenFile
from mutagen.flac import FLAC
from mutagen.mp3 import MP3
from mutagen.id3 import ID3
from infrastructure.audio_processor import AudioProcessorService

class AuditService:
    def __init__(self):
        self.directorio_actual = "/Users/admin/Music/mi musica"
        self._lock = threading.Lock()
        self._cancelar_proceso = False

    @staticmethod
    def extraer_info_tecnica_audio(filepath: str) -> dict:
        """Extrae de forma ultrarrápida formato, sample_rate (kHz), bit_depth y bitrate (kbps)."""
        ext = os.path.splitext(filepath)[1].lower() if filepath else ""
        fmt = ext.replace(".", "").upper()
        samplerate = 44100
        bit_depth = 16
        bitrate_kbps = 0
        channels = 2
        duration_sec = 0.0

        try:
            if ext in (".flac", ".wav", ".aiff", ".aif"):
                try:
                    info_sf = sf.info(filepath)
                    samplerate = info_sf.samplerate
                    channels = info_sf.channels
                    duration_sec = info_sf.duration
                    subtype = str(info_sf.subtype)
                    if "24" in subtype:
                        bit_depth = 24
                    elif "32" in subtype:
                        bit_depth = 32
                    elif "16" in subtype:
                        bit_depth = 16
                    elif "8" in subtype:
                        bit_depth = 8
                except Exception:
                    pass

                if ext == ".flac":
                    try:
                        f = FLAC(filepath)
                        if f.info:
                            samplerate = f.info.sample_rate
                            bit_depth = f.info.bits_per_sample
                            channels = f.info.channels
                            duration_sec = f.info.length
                            if getattr(f.info, "bitrate", 0):
                                bitrate_kbps = round(f.info.bitrate / 1000)
                    except Exception:
                        pass
                elif ext in (".wav", ".aiff", ".aif"):
                    if samplerate > 0 and bit_depth > 0 and channels > 0:
                        bitrate_kbps = round((samplerate * bit_depth * channels) / 1000)
            elif ext == ".mp3":
                try:
                    mp = MP3(filepath)
                    if mp and mp.info:
                        samplerate = mp.info.sample_rate
                        bitrate_kbps = round(mp.info.bitrate / 1000)
                        duration_sec = mp.info.length
                        channels = mp.info.channels
                except Exception:
                    m = MutagenFile(filepath)
                    if m and m.info:
                        samplerate = getattr(m.info, "sample_rate", 44100)
                        bitrate_bps = getattr(m.info, "bitrate", 0)
                        if bitrate_bps:
                            bitrate_kbps = round(bitrate_bps / 1000)
                        duration_sec = getattr(m.info, "length", 0.0)
            else:
                try:
                    m = MutagenFile(filepath)
                    if m and m.info:
                        samplerate = getattr(m.info, "sample_rate", 44100)
                        bitrate_bps = getattr(m.info, "bitrate", 0)
                        if bitrate_bps:
                            bitrate_kbps = round(bitrate_bps / 1000)
                        bit_depth = getattr(m.info, "bits_per_sample", 16)
                        duration_sec = getattr(m.info, "length", 0.0)
                except Exception:
                    pass
        except Exception as e:
            print(f"[AUDIO INFO ERROR] {e}")

        # Fallback de bitrate mediante bytes de archivo y duración si aplica
        if bitrate_kbps <= 0 and duration_sec > 0:
            try:
                file_bytes = os.path.getsize(filepath)
                bitrate_kbps = round((file_bytes * 8) / (duration_sec * 1000))
            except Exception:
                bitrate_kbps = 320 if ext == ".mp3" else 1411

        if bitrate_kbps <= 0:
            bitrate_kbps = 320 if ext == ".mp3" else (1411 if ext in (".wav", ".aiff") else 950)

        return {
            "format": fmt,
            "samplerate": samplerate,
            "sample_rate_khz": round(samplerate / 1000.0, 1),
            "bit_depth": bit_depth,
            "bitrate_kbps": bitrate_kbps,
            "channels": channels,
            "duration_sec": duration_sec
        }

    @staticmethod
    def diagnosticar_calidad_audio(
        filepath: str,
        cutoff_khz: float = 0.0,
        samplerate: int = 44100,
        bit_depth: int = 16,
        bitrate_kbps: int = 0,
        fmt: str = ""
    ) -> dict:
        """Determina con rigor acústico y según Nyquist si el archivo es Lossless puro, Hi-Res,
        MP3 legítimo por tramos de bitrate/corte, o un FLAC FAKE (upscale de MP3 con frecuencias cortadas)."""
        ext = os.path.splitext(filepath)[1].lower() if filepath else ""
        format_clean = (fmt or ext.replace(".", "")).upper()
        is_lossless = format_clean in ("FLAC", "WAV", "AIFF", "AIF", "ALAC")
        sr_khz = round(samplerate / 1000.0, 1) if samplerate else 44.1
        nyquist_khz = round(samplerate / 2000.0, 2) if samplerate else 22.05
        cutoff = round(float(cutoff_khz), 1) if cutoff_khz > 0 else 0.0

        if is_lossless:
            if cutoff == 0.0:
                estado = f"{format_clean} (Cargado)"
                calidad = "Pendiente Auditoría"
                perdida_desc = "Sin auditar"
                perdida_pct = 0.0
                compresion = f"Lossless {bit_depth}-bit / {sr_khz}kHz"
                es_fake = False
                badge_color = "zinc"
            elif samplerate >= 88200 and cutoff >= 24.0:
                estado = "HI-RES LOSSLESS"
                calidad = "Alta (Hi-Res Master)"
                perdida_desc = "Sin Pérdida (Lossless Puro)"
                perdida_pct = 0.0
                compresion = f"Lossless {bit_depth}-bit / {sr_khz}kHz"
                es_fake = False
                badge_color = "purple"
            elif cutoff >= 20.0:
                estado = f"{format_clean} VERDADERO"
                calidad = "Alta"
                perdida_desc = "Sin Pérdida (Lossless)"
                perdida_pct = 0.0
                compresion = f"Lossless {bit_depth}-bit / {sr_khz}kHz"
                es_fake = False
                badge_color = "green"
            else:
                # Upscale / Transcode Falso: Contenedor lossless pero corte de frecuencias típico de MP3
                estado = f"{format_clean} FAKE"
                es_fake = True
                badge_color = "red"
                perdida_desc = "Pérdida por Transcode Falso"
                perdida_pct = round(max(0.0, (1.0 - (cutoff / min(nyquist_khz, 22.05))) * 100.0), 1)
                if cutoff <= 16.5:
                    calidad = "Baja (Origen MP3 128k)"
                    compresion = "Transcode Falso (MP3 128k → Lossless)"
                elif cutoff <= 18.5:
                    calidad = "Media (Origen MP3 192k)"
                    compresion = "Transcode Falso (MP3 192k → Lossless)"
                else:
                    calidad = "Media-Alta (Origen MP3 320k)"
                    compresion = "Transcode Falso (MP3 320k → Lossless)"
        else:
            # Formatos Comprimidos con Pérdida Legítimos (MP3, AAC, M4A, OGG)
            es_fake = False
            effective_kbps = bitrate_kbps if bitrate_kbps > 0 else (320 if cutoff >= 20.0 else (192 if cutoff >= 17.5 else 128))
            if effective_kbps >= 310 or cutoff >= 20.0:
                estado = f"{format_clean} 320k (HQ)"
                calidad = "Alta"
                perdida_desc = "Compresión Ligera (Corte ~20.5kHz)"
                perdida_pct = round(max(0.0, (1.0 - (cutoff / 22.05)) * 100.0), 1) if cutoff > 0 else 7.0
                compresion = f"Lossy CBR/VBR ({effective_kbps} kbps)"
                badge_color = "cyan"
            elif effective_kbps >= 190 or cutoff >= 17.5:
                estado = f"{format_clean} {effective_kbps}k (MQ)"
                calidad = "Media"
                perdida_desc = "Compresión Media (Corte ~18.5kHz)"
                perdida_pct = round(max(0.0, (1.0 - (cutoff / 22.05)) * 100.0), 1) if cutoff > 0 else 18.0
                compresion = f"Lossy ({effective_kbps} kbps)"
                badge_color = "yellow"
            else:
                estado = f"{format_clean} {effective_kbps}k (Baja)"
                calidad = "Baja"
                perdida_desc = "Pérdida Severa (Corte ~16kHz)"
                perdida_pct = round(max(0.0, (1.0 - (cutoff / 22.05)) * 100.0), 1) if cutoff > 0 else 28.0
                compresion = f"Lossy Compresión Alta ({effective_kbps} kbps)"
                badge_color = "red"

        return {
            "status": estado,
            "calidad": calidad,
            "perdida": perdida_desc,
            "perdida_pct": perdida_pct,
            "compresion": compresion,
            "cutoff_khz": cutoff,
            "sample_rate_khz": sr_khz,
            "bitrate_kbps": bitrate_kbps,
            "bit_depth": bit_depth,
            "format": format_clean,
            "es_fake": es_fake,
            "badge_color": badge_color
        }

    def cancelar_proceso(self):
        """Activa la bandera de cancelación para abortar auditorías, inyecciones o descargas activas."""
        self._cancelar_proceso = True
        print("[AUDIT SERVICE] Solicitud de cancelación recibida.")

    def reiniciar_cancelacion(self):
        self._cancelar_proceso = False

    def listar_subcarpetas_sistema(self, ruta_base=""):
        """Permite navegar por el árbol de carpetas directamente en la UI sin popups de permisos del SO."""
        base = os.path.expanduser("~")
        target = ruta_base if (ruta_base and os.path.isdir(ruta_base)) else os.path.join(base, "Music")
        if not os.path.isdir(target):
            target = base

        carpetas = []
        try:
            for entry in sorted(os.scandir(target), key=lambda e: e.name.lower()):
                if entry.is_dir() and not entry.name.startswith(".") and not entry.name.startswith("$"):
                    carpetas.append({
                        "name": entry.name,
                        "path": entry.path
                    })
        except Exception as e:
            print(f"[EXPLORADOR FS] Error leyendo {target}: {e}")

        parent = os.path.dirname(os.path.abspath(target)) if target != "/" else "/"
        return {
            "current": target,
            "parent": parent,
            "folders": carpetas
        }

    def seleccionar_directorio(self):
        if not self._lock.acquire(blocking=False):
            return ""
        try:
            # Script estándar con timeout y captura segura
            script = 'POSIX path of (choose folder with prompt "Selecciona tu carpeta de música DJ:")'
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
        if not filepath:
            return {"id": spotify_id, "estado": "Error I/O", "corte": "N/A", "cutoff_khz": 22.0, "perdida": 0, "spectrum": []}
        if not os.path.exists(filepath):
            if self.directorio_actual and os.path.basename(filepath):
                cand = os.path.join(self.directorio_actual, os.path.basename(filepath))
                if os.path.exists(cand):
                    filepath = cand
        print(f"[AUDITORIA FFT] Analizando espectro de: {os.path.basename(filepath)}")
        try:
            fs = 44100
            data = None
            samplerate = 44100
            try:
                info_sf = sf.info(filepath)
                start_frame = min(fs * 30, max(0, int(info_sf.frames * 0.25)))
                frames_to_read = min(fs * 10, max(4096, info_sf.frames - start_frame))
                data, samplerate = sf.read(filepath, start=start_frame, frames=frames_to_read)
            except Exception as sf_err:
                # Fallback seguro con pydub / ffmpeg para MP3, M4A, AIFF o FLACs con cabeceras complejas
                try:
                    from pydub import AudioSegment
                    seg = AudioSegment.from_file(filepath)
                    dur_ms = len(seg)
                    start_ms = max(0, int(dur_ms * 0.25))
                    end_ms = min(dur_ms, start_ms + 10000)
                    sub_seg = seg[start_ms:end_ms]
                    samplerate = sub_seg.frame_rate
                    samples = np.array(sub_seg.get_array_of_samples(), dtype=np.float32)
                    if sub_seg.channels > 1:
                        samples = samples.reshape((-1, sub_seg.channels)).mean(axis=1)
                    data = samples / (2.0 ** (sub_seg.sample_width * 8 - 1))
                except Exception as pydub_err:
                    print(f"[AUDITORIA FFT] Error decodificando audio: {pydub_err}")
                    raise sf_err

            if data is None or len(data) == 0:
                raise ValueError("Buffer de audio vacío tras decodificación")

            if len(data.shape) > 1:
                data = data.mean(axis=1)
            yf, xf = np.fft.rfft(data), np.fft.rfftfreq(len(data), 1 / samplerate)
            mag = np.where(np.abs(yf) > 0, np.abs(yf), 1e-10)
            mag_db = 20 * np.log10(mag)
            frecuencias_validas = xf[mag_db > (np.max(mag_db) - 80)]
            cutoff_khz = (np.max(frecuencias_validas) if len(frecuencias_validas) > 0 else 0) / 1000.0

            # Extracción técnica y diagnóstico físico de pureza y pérdida
            tech = self.extraer_info_tecnica_audio(filepath)
            diag = self.diagnosticar_calidad_audio(
                filepath=filepath,
                cutoff_khz=cutoff_khz,
                samplerate=samplerate or tech.get("samplerate", 44100),
                bit_depth=tech.get("bit_depth", 16),
                bitrate_kbps=tech.get("bitrate_kbps", 0),
                fmt=tech.get("format", "")
            )

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
                "status": diag["status"],
                "estado": diag["status"],
                "calidad": diag["calidad"],
                "perdida": diag["perdida"],
                "perdida_pct": diag["perdida_pct"],
                "compresion": diag["compresion"],
                "es_fake": diag["es_fake"],
                "badge_color": diag["badge_color"],
                "corte": f"{cutoff_khz:.1f} kHz",
                "cutoff_khz": round(float(cutoff_khz), 1),
                "spectrum": spectrum_points,
                "samplerate": samplerate,
                "sample_rate_khz": diag["sample_rate_khz"],
                "bitrate_kbps": diag["bitrate_kbps"],
                "bit_depth": diag["bit_depth"],
                "format": diag["format"],
                "diagnostico": diag
            }
            if spotify_id is not None and hasattr(eel, "notificar_resultado_auditoria"):
                try:
                    eel.notificar_resultado_auditoria(resultado)()
                except Exception:
                    pass
            return resultado
        except Exception as e:
            print(f"[ERROR DSP] {e}")
            err_res = {
                "id": spotify_id, 
                "status": "Error I/O",
                "estado": "Error I/O", 
                "calidad": "Desconocida",
                "perdida": "Error",
                "perdida_pct": 0,
                "compresion": "--",
                "es_fake": False,
                "badge_color": "red",
                "corte": "N/A", 
                "cutoff_khz": 22.0, 
                "sample_rate_khz": 44.1,
                "bitrate_kbps": 0,
                "bit_depth": 16,
                "format": "FLAC",
                "spectrum": []
            }
            if spotify_id is not None and hasattr(eel, "notificar_resultado_auditoria"):
                try:
                    eel.notificar_resultado_auditoria(err_res)()
                except Exception:
                    pass
            return err_res

    def analizar_trim_downbeat(self, filepath: str, track_id=None) -> dict:
        """Calcula de forma específica bajo demanda el trim zero-crossing y el primer downbeat."""
        if not filepath or not os.path.exists(filepath):
            real_path = self.directorio_actual and os.path.join(self.directorio_actual, os.path.basename(filepath or ""))
            if real_path and os.path.exists(real_path):
                filepath = real_path
            else:
                return {"status": "error", "msg": "Archivo no encontrado", "trim_start_ms": 0.0, "first_downbeat_ms": 0.0}

        trim_ms, downbeat_ms = AudioProcessorService.detectar_trim_y_downbeat(filepath)
        return {
            "status": "ok",
            "id": track_id,
            "path": filepath,
            "trim_start_ms": trim_ms,
            "first_downbeat_ms": downbeat_ms
        }

    def iniciar_auditoria(self, ruta_directorio, emitir_log_cb=None, progreso_cb=None, opts=None):
        if not ruta_directorio or not os.path.exists(ruta_directorio):
            return {"total": 0, "sin_meta": 0, "ready": 0, "errors": 0, "tracks": []}

        self.reiniciar_cancelacion()
        self.directorio_actual = ruta_directorio
        if emitir_log_cb:
            emitir_log_cb(f"Iniciando auditoría avanzada en: {ruta_directorio}")

        extensiones = (".flac", ".mp3", ".wav", ".aiff", ".m4a", ".aac", ".ogg", ".wma", ".alac", ".opus")
        archivos = []
        for root, _, files in os.walk(ruta_directorio):
            for file in sorted(files):
                if not file.startswith(".") and file.lower().endswith(extensiones):
                    archivos.append((root, file))
                    if len(archivos) >= 50000:
                        break
            if len(archivos) >= 50000:
                break

        total_files = len(archivos)
        if total_files == 0:
            return {"total": 0, "sin_meta": 0, "ready": 0, "errors": 0, "tracks": []}

        if progreso_cb:
            progreso_cb(5, f"Iniciando auditoría acústica ({total_files} pistas encontradas)...")

        tracks_auditados = []
        sin_meta_count = 0
        fake_count = 0

        ejecutar_fft = bool(opts is None or (isinstance(opts, dict) and opts.get("fftLossless", True)))
        inyectar_covers = bool(isinstance(opts, dict) and opts.get("injectCovers", False))

        for idx, (root, file) in enumerate(archivos, 1):
            if self._cancelar_proceso:
                print(f"[AUDITORIA] Detenida por el usuario en ({idx}/{total_files})")
                if progreso_cb:
                    progreso_cb(100, f"Auditoría detenida por el usuario. {len(tracks_auditados)} pistas listas.")
                break

            full_path = os.path.join(root, file)
            pct = int(5 + (idx / total_files) * 90)
            if total_files <= 30 or idx % max(1, total_files // 25) == 0 or idx == total_files:
                if progreso_cb:
                    progreso_cb(pct, f"Auditando ({idx}/{total_files}): {file}")

            info = AudioProcessorService.analizar_track_avanzado(full_path)
            bpm_val = info.get("bpm")
            key_val = info.get("key")
            is_missing = bool(info.get("missing_meta", False) or not bpm_val or not key_val or str(bpm_val) == "--" or str(key_val) == "--")
            if is_missing:
                sin_meta_count += 1

            cutoff_khz = float(info.get("cutoff_khz") or 22.0)
            perdida = 0
            spectrum_points = []

            if ejecutar_fft:
                try:
                    fft_res = self.analizar_espectro_fft(full_path)
                    cutoff_khz = float(fft_res.get("cutoff_khz", 22.0))
                    perdida = fft_res.get("perdida", 0)
                    spectrum_points = fft_res.get("spectrum", [])
                    diag = fft_res.get("diagnostico") or self.diagnosticar_calidad_audio(
                        filepath=full_path,
                        cutoff_khz=cutoff_khz,
                        samplerate=fft_res.get("samplerate", 44100),
                        bit_depth=fft_res.get("bit_depth", 16),
                        bitrate_kbps=fft_res.get("bitrate_kbps", 0),
                        fmt=fft_res.get("format", "")
                    )
                    status_str = diag.get("status", "Lossless OK")
                    if diag.get("es_fake", False):
                        fake_count += 1
                except Exception:
                    tech = self.extraer_info_tecnica_audio(full_path)
                    diag = self.diagnosticar_calidad_audio(
                        filepath=full_path,
                        cutoff_khz=cutoff_khz,
                        samplerate=tech.get("samplerate", 44100),
                        bit_depth=tech.get("bit_depth", 16),
                        bitrate_kbps=tech.get("bitrate_kbps", 0),
                        fmt=tech.get("format", "")
                    )
                    status_str = diag.get("status", "Lossless OK")
                    if diag.get("es_fake", False):
                        fake_count += 1
            else:
                tech = self.extraer_info_tecnica_audio(full_path)
                diag = self.diagnosticar_calidad_audio(
                    filepath=full_path,
                    cutoff_khz=0.0,
                    samplerate=tech.get("samplerate", 44100),
                    bit_depth=tech.get("bit_depth", 16),
                    bitrate_kbps=tech.get("bitrate_kbps", 0),
                    fmt=tech.get("format", "")
                )
                status_str = diag.get("status", "Lossless OK")
                if diag.get("es_fake", False):
                    fake_count += 1

            # Inyección opcional de carátulas durante la auditoría por lote
            track_cover = str(info.get("cover") or "")
            if inyectar_covers:
                resolved_c = AudioProcessorService.resolver_caratula_local_o_remota(
                    full_path, 
                    str(info.get("artist") or ""), 
                    str(info.get("title") or "")
                )
                if resolved_c:
                    track_cover = resolved_c
                    AudioProcessorService.escribir_metadatos_pro(full_path, info, cover_url=resolved_c)

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
                "dance": int(info.get("danceability") or info.get("dance") or 85),
                "danceability": int(info.get("danceability") or info.get("dance") or 85),
                "mood": str(info.get("mood") or "Peak Time"),
                "duration": str(info.get("duration") or "05:30"),
                "cover": track_cover,
                "format": str(diag.get("format") or os.path.splitext(file)[1].replace(".", "").upper()),
                "sample_rate_khz": float(diag.get("sample_rate_khz", 44.1)),
                "bitrate_kbps": int(diag.get("bitrate_kbps", 0)),
                "bit_depth": int(diag.get("bit_depth", 16)),
                "calidad": str(diag.get("calidad", "Alta")),
                "perdida": str(diag.get("perdida", "Sin Pérdida")),
                "perdida_pct": float(diag.get("perdida_pct", 0.0)),
                "compresion": str(diag.get("compresion", "")),
                "es_fake": bool(diag.get("es_fake", False)),
                "badge_color": str(diag.get("badge_color", "green")),
                "status": status_str,
                "cutoff_khz": cutoff_khz,
                "perdida": perdida or diag.get("perdida", "Sin Pérdida"),
                "spectrum": spectrum_points,
                "trim_start_ms": float(info.get("trim_start_ms") or 0.0),
                "first_downbeat_ms": float(info.get("first_downbeat_ms") or 0.0),
                "comment": str(info.get("comment") or "Intro limpia 32b • Drop contundente • Outro 64b"),
                "genre": str(info.get("genre") or "Tech House"),
                "subgenre": str(info.get("subgenre") or "Tech House"),
                "cues": info.get("cues") or []
            })

        total = len(tracks_auditados)
        ready_count = max(0, total - sin_meta_count)
        if progreso_cb:
            progreso_cb(100, f"Auditoría finalizada: {total} pistas procesadas.")

        return {
            "total": total,
            "sin_meta": sin_meta_count,
            "ready": ready_count,
            "errors": fake_count,
            "tracks": tracks_auditados
        }

    def cargar_metadatos_directorio(self, ruta_directorio, progreso_cb=None):
        """Lee únicamente los metadatos existentes de los archivos sin ejecutar procesos pesados."""
        if not ruta_directorio or not os.path.exists(ruta_directorio):
            return {"total": 0, "sin_meta": 0, "ready": 0, "errors": 0, "tracks": []}

        self.directorio_actual = ruta_directorio
        extensiones = (".flac", ".mp3", ".wav", ".aiff", ".m4a", ".aac", ".ogg", ".wma", ".alac", ".opus")
        archivos = []
        for root, _, files in os.walk(ruta_directorio):
            for file in sorted(files):
                if not file.startswith(".") and file.lower().endswith(extensiones):
                    archivos.append((root, file))
                    if len(archivos) >= 50000:
                        break
            if len(archivos) >= 50000:
                break

        total_files = len(archivos)
        if total_files == 0:
            return {"total": 0, "sin_meta": 0, "ready": 0, "errors": 0, "tracks": []}

        if progreso_cb:
            progreso_cb(5, f"Leyendo metadatos locales ({total_files} pistas encontradas)...")

        tracks_cargados = []
        sin_meta_count = 0

        for idx, (root, file) in enumerate(archivos, 1):
            full_path = os.path.join(root, file)
            pct = int(5 + (idx / total_files) * 90)
            if total_files <= 30 or idx % max(1, total_files // 30) == 0 or idx == total_files:
                if progreso_cb:
                    progreso_cb(pct, f"Leyendo tags ({idx}/{total_files}): {file}")

            filename = os.path.basename(full_path)
            ext = os.path.splitext(filename)[1].lower()
            artist_fb, title_fb = AudioProcessorService._parsear_nombre(filename)

            title = ""
            artist = ""
            bpm_str = "--"
            key_str = "--"
            dur_str = "00:00"
            genre_str = ""
            subgenre_str = ""
            trim_start_ms = 0.0
            first_downbeat_ms = 0.0

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
                        raw_trim = f.get("TRIM_START_MS", [""])[0]
                        if raw_trim:
                            try:
                                trim_start_ms = float(raw_trim)
                            except Exception:
                                pass
                        raw_down = f.get("FIRST_DOWNBEAT_MS", [""])[0]
                        if raw_down:
                            try:
                                first_downbeat_ms = float(raw_down)
                            except Exception:
                                pass
                        raw_g = f.get("GENRE", [""])[0]
                        raw_sg = f.get("SUBGENRE", [""])[0]
                        if raw_g:
                            genre_str = str(raw_g)
                        if raw_sg:
                            subgenre_str = str(raw_sg)
                    except Exception:
                        m = MutagenFile(full_path, easy=True)
                        if m:
                            title = str(m.get("title", [""])[0])
                            artist = str(m.get("artist", [""])[0])
                            genre_str = str(m.get("genre", [""])[0])
                            if m.info and hasattr(m.info, "length"):
                                dur_str = f"{int(m.info.length)//60}:{int(m.info.length)%60:02d}"
                else:
                    try:
                        id3_tags = ID3(full_path)
                        t_frame = id3_tags.get("TXXX:TRIM_START_MS")
                        d_frame = id3_tags.get("TXXX:FIRST_DOWNBEAT_MS")
                        tcon_frame = id3_tags.get("TCON")
                        subg_frame = id3_tags.get("TXXX:SUBGENRE")
                        if tcon_frame and tcon_frame.text:
                            genre_str = str(tcon_frame.text[0])
                        if subg_frame and subg_frame.text:
                            subgenre_str = str(subg_frame.text[0])
                        if t_frame and t_frame.text:
                            trim_start_ms = float(t_frame.text[0])
                        if d_frame and d_frame.text:
                            first_downbeat_ms = float(d_frame.text[0])
                    except Exception:
                        pass

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
                        if not genre_str:
                            genre_str = str(m.get("genre", [""])[0])
                        if m.info and hasattr(m.info, "length"):
                            dur_str = f"{int(m.info.length)//60}:{int(m.info.length)%60:02d}"
            except Exception:
                pass

            if not title:
                title = title_fb
            if not artist:
                artist = artist_fb

            if " / " in genre_str:
                parts = genre_str.split(" / ", 1)
                genre_str = parts[0].strip()
                if not subgenre_str:
                    subgenre_str = parts[1].strip()
            genre_str = genre_str or "Tech House"
            subgenre_str = subgenre_str or "Tech House"

            missing = (bpm_str == "--" or key_str == "--")
            if missing:
                sin_meta_count += 1

            cues_frase = []
            if bpm_str != "--" and dur_str != "00:00":
                try:
                    dur_calc_ms = 300000
                    if ":" in dur_str:
                        dp = dur_str.split(":")
                        dur_calc_ms = int((int(dp[0]) * 60 + float(dp[1])) * 1000)
                    cues_frase = AudioProcessorService.calcular_8_hot_cues_fraseo(
                        duration_ms=dur_calc_ms,
                        bpm=float(bpm_str),
                        downbeat_ms=int(first_downbeat_ms)
                    )
                except Exception:
                    pass

            tech = self.extraer_info_tecnica_audio(full_path)
            diag = self.diagnosticar_calidad_audio(
                filepath=full_path,
                cutoff_khz=0.0,
                samplerate=tech.get("samplerate", 44100),
                bit_depth=tech.get("bit_depth", 16),
                bitrate_kbps=tech.get("bitrate_kbps", 0),
                fmt=tech.get("format", ext.replace(".", "").upper())
            )

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
                "genre": genre_str,
                "subgenre": subgenre_str,
                "duration": dur_str,
                "format": str(diag.get("format") or ext.replace(".", "").upper()),
                "sample_rate_khz": float(diag.get("sample_rate_khz", 44.1)),
                "bitrate_kbps": int(diag.get("bitrate_kbps", 0)),
                "bit_depth": int(diag.get("bit_depth", 16)),
                "calidad": str(diag.get("calidad", "Pendiente")),
                "perdida": str(diag.get("perdida", "Sin auditar")),
                "perdida_pct": float(diag.get("perdida_pct", 0.0)),
                "compresion": str(diag.get("compresion", "")),
                "es_fake": bool(diag.get("es_fake", False)),
                "badge_color": str(diag.get("badge_color", "zinc")),
                "status": str(diag.get("status") or "Cargado (Sin auditar)"),
                "cutoff_khz": 0.0,
                "trim_start_ms": trim_start_ms,
                "first_downbeat_ms": first_downbeat_ms,
                "comment": "",
                "cover": "",
                "cues": cues_frase
            })

        total = len(tracks_cargados)
        ready_count = max(0, total - sin_meta_count)
        if progreso_cb:
            progreso_cb(100, f"Carga completada: {total} pistas listas.")

        return {
            "total": total,
            "sin_meta": sin_meta_count,
            "ready": ready_count,
            "errors": 0,
            "tracks": tracks_cargados
        }

    def inyectar_caratulas_lote(self, tracks: list, progreso_cb=None) -> dict:
        """Busca o extrae carátulas 1:1 en alta resolución (local o remota) e incrusta en los archivos físicos."""
        if not tracks or not isinstance(tracks, list):
            return {"status": "error", "msg": "Lista de pistas vacía", "actualizadas": 0}

        total = len(tracks)
        actualizadas = 0
        errores = 0

        if progreso_cb:
            progreso_cb(5, f"Buscando e inyectando carátulas 1:1 ({total} pistas)...")

        for idx, t in enumerate(tracks, 1):
            if self._cancelar_proceso:
                print(f"[CARATULAS] Cancelado por usuario en ({idx}/{total})")
                break
            pct = int(5 + (idx / total) * 90)
            target_path = t.get("path")
            filename = t.get("filename") or t.get("f") or os.path.basename(target_path or "")
            if progreso_cb:
                progreso_cb(pct, f"Inyectando carátula ({idx}/{total}): {filename}")

            if not target_path or not os.path.exists(target_path):
                real = self.directorio_actual and os.path.join(self.directorio_actual, filename)
                if real and os.path.exists(real):
                    target_path = real

            if not target_path or not os.path.exists(target_path):
                errores += 1
                continue

            artista = str(t.get("artist") or t.get("a") or "")
            titulo = str(t.get("title") or t.get("t") or "")

            cover_src = t.get("cover") or t.get("cover_url")
            if not cover_src:
                cover_src = AudioProcessorService.resolver_caratula_local_o_remota(target_path, artista, titulo)

            if cover_src:
                ok = AudioProcessorService.escribir_metadatos_pro(target_path, t, cover_url=cover_src)
                if ok:
                    t["cover"] = cover_src
                    actualizadas += 1
                else:
                    errores += 1
            else:
                errores += 1

        if progreso_cb:
            progreso_cb(100, f"Inyección de carátulas completada: {actualizadas} pistas actualizadas.")

        return {
            "status": "ok",
            "total": total,
            "actualizadas": actualizadas,
            "errores": errores
        }

    def inyectar_lote_metadatos(self, tracks: list, progreso_cb=None) -> dict:
        """Inyecta metadatos profesionales (BPM, Camelot TKEY, Serato Markers2, COMM) en lote."""
        if not tracks or not isinstance(tracks, list):
            return {"status": "error", "msg": "Lista de pistas vacía", "inyectados": 0}

        total = len(tracks)
        inyectados = 0
        errores = 0

        if progreso_cb:
            progreso_cb(5, f"Iniciando inyección profunda de metadatos ({total} pistas)...")

        for idx, t in enumerate(tracks, 1):
            if self._cancelar_proceso:
                print(f"[CARATULAS] Cancelado por usuario en ({idx}/{total})")
                break
            pct = int(5 + (idx / total) * 90)
            target_path = t.get("path")
            filename = t.get("filename") or t.get("f") or os.path.basename(target_path or "")
            if progreso_cb:
                progreso_cb(pct, f"Inyectando ID3v2.4 / Serato ({idx}/{total}): {filename}")

            if not target_path or not os.path.exists(target_path):
                real = self.directorio_actual and os.path.join(self.directorio_actual, filename)
                if real and os.path.exists(real):
                    target_path = real

            if target_path and os.path.exists(target_path):
                ok = AudioProcessorService.escribir_metadatos_pro(target_path, t)
                if ok:
                    inyectados += 1
                else:
                    errores += 1
            else:
                errores += 1

        if progreso_cb:
            progreso_cb(100, f"Inyección completada: {inyectados} pistas inyectadas con éxito.")

        return {
            "status": "ok",
            "total": total,
            "inyectados": inyectados,
            "errores": errores
        }
