import os
import re
import subprocess
import threading
import hashlib
import sqlite3
import json
import time
import urllib.parse
import shutil
import concurrent.futures
import numpy as np
import soundfile as sf
import eel
from mutagen import File as MutagenFile
from mutagen.flac import FLAC
from mutagen.mp3 import MP3
from mutagen.id3 import ID3
from infrastructure.audio_processor import AudioProcessorService
from services.tag_sanitizer_service import TagSanitizerService
from services.mood_intelligence_service import MoodIntelligenceService
from services.genre_classifier_service import GenreClassifierDSP

def _cooperative_yield():
    """Cede el control del bucle de eventos a gevent/hilos para procesar cancelaciones instantáneamente."""
    try:
        import gevent
        gevent.sleep(0.002)
    except Exception:
        import time
        time.sleep(0.002)


class AuditCacheDB:
    """Motor de persistencia y caché SQLite para perfiles espectrales, LUFS y huellas acústicas."""
    def __init__(self, db_path="data/audit_cache.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path) or ".", exist_ok=True)
        self._lock = threading.Lock()
        self._init_db()

    def _get_conn(self):
        conn = sqlite3.connect(self.db_path, timeout=30)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._lock:
            with self._get_conn() as conn:
                try:
                    conn.execute("PRAGMA journal_mode = WAL;")
                    conn.execute("PRAGMA synchronous = NORMAL;")
                    conn.execute("PRAGMA cache_size = -64000;")
                    conn.execute("PRAGMA temp_store = MEMORY;")
                except Exception:
                    pass
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS audit_cache (
                        filepath TEXT PRIMARY KEY,
                        file_hash TEXT,
                        mtime REAL,
                        filesize INTEGER,
                        cutoff_khz REAL,
                        lufs REAL,
                        true_peak REAL,
                        low_ratio REAL,
                        mid_ratio REAL,
                        high_ratio REAL,
                        acoustic_role TEXT,
                        format TEXT,
                        bitrate_kbps INTEGER,
                        sample_rate_khz REAL,
                        calidad TEXT,
                        status TEXT,
                        es_fake INTEGER,
                        acoustic_fp TEXT,
                        spectrum_json TEXT,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                conn.execute("CREATE INDEX IF NOT EXISTS idx_audit_fp ON audit_cache(acoustic_fp)")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_audit_hash ON audit_cache(file_hash)")

                conn.execute("""
                    CREATE TABLE IF NOT EXISTS metadata_cache (
                        filepath TEXT PRIMARY KEY,
                        mtime REAL,
                        filesize INTEGER,
                        track_json TEXT,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                conn.execute("CREATE INDEX IF NOT EXISTS idx_meta_lookup ON metadata_cache(filepath, mtime, filesize)")

    def get_metadata_batch(self, file_tuples: list) -> dict:
        """
        file_tuples: lista de tuplas (filepath, mtime, filesize)
        Retorna: dict con {filepath: track_dict} para todas las coincidencias válidas en caché.
        """
        if not file_tuples:
            return {}
        hits = {}
        chunk_size = 800
        with self._lock:
            try:
                with self._get_conn() as conn:
                    cur = conn.cursor()
                    for i in range(0, len(file_tuples), chunk_size):
                        chunk = file_tuples[i : i + chunk_size]
                        paths = [t[0] for t in chunk]
                        placeholders = ",".join("?" for _ in paths)
                        cur.execute(
                            f"SELECT filepath, mtime, filesize, track_json FROM metadata_cache WHERE filepath IN ({placeholders})",
                            paths
                        )
                        chunk_map = {t[0]: (t[1], t[2]) for t in chunk}
                        for row in cur.fetchall():
                            fpath = row["filepath"]
                            expected = chunk_map.get(fpath)
                            if not expected:
                                continue
                            exp_mtime, exp_size = expected
                            if abs(float(row["mtime"]) - float(exp_mtime)) <= 1.0 and int(row["filesize"]) == int(exp_size):
                                try:
                                    hits[fpath] = json.loads(row["track_json"])
                                except Exception:
                                    pass
            except Exception as e:
                print(f"[CACHE DB BATCH GET ERROR] {e}")
        return hits

    def set_metadata_batch(self, items: list):
        """
        items: lista de tuplas (filepath, mtime, filesize, track_json_str)
        """
        if not items:
            return
        with self._lock:
            try:
                with self._get_conn() as conn:
                    conn.executemany("""
                        INSERT OR REPLACE INTO metadata_cache (filepath, mtime, filesize, track_json, updated_at)
                        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """, items)
            except Exception as e:
                print(f"[CACHE DB BATCH SET ERROR] {e}")

    def get(self, filepath: str, mtime: float = None, filesize: int = None):
        if not filepath:
            return None
        with self._lock:
            try:
                with self._get_conn() as conn:
                    cur = conn.cursor()
                    cur.execute("SELECT * FROM audit_cache WHERE filepath = ?", (filepath,))
                    row = cur.fetchone()
                    if not row:
                        return None
                    if mtime is not None and abs(float(row["mtime"]) - float(mtime)) > 1.0:
                        return None
                    if filesize is not None and int(row["filesize"]) != int(filesize):
                        return None
                    return dict(row)
            except Exception as e:
                print(f"[CACHE DB GET ERROR] {e}")
                return None

    def set(self, data: dict):
        if not data or not data.get("filepath"):
            return
        with self._lock:
            try:
                with self._get_conn() as conn:
                    conn.execute("""
                        INSERT OR REPLACE INTO audit_cache (
                            filepath, file_hash, mtime, filesize, cutoff_khz, lufs, true_peak,
                            low_ratio, mid_ratio, high_ratio, acoustic_role, format,
                            bitrate_kbps, sample_rate_khz, calidad, status, es_fake,
                            acoustic_fp, spectrum_json, updated_at
                        ) VALUES (
                            ?, ?, ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?,
                            ?, ?, CURRENT_TIMESTAMP
                        )
                    """, (
                        data.get("filepath"),
                        data.get("file_hash", ""),
                        float(data.get("mtime", 0.0)),
                        int(data.get("filesize", 0)),
                        float(data.get("cutoff_khz", 22.0)),
                        float(data.get("lufs", -14.0)),
                        float(data.get("true_peak", -0.1)),
                        float(data.get("low_ratio", 33.3)),
                        float(data.get("mid_ratio", 33.3)),
                        float(data.get("high_ratio", 33.4)),
                        data.get("acoustic_role", "Balanced Full-Range"),
                        data.get("format", ""),
                        int(data.get("bitrate_kbps", 0)),
                        float(data.get("sample_rate_khz", 44.1)),
                        data.get("calidad", "Alta"),
                        data.get("status", "Lossless OK"),
                        1 if data.get("es_fake") else 0,
                        data.get("acoustic_fp", ""),
                        data.get("spectrum_json", "")
                    ))
            except Exception as e:
                print(f"[CACHE DB SET ERROR] {e}")


def calcular_huella_acustica(data, samplerate):
    """Genera una huella acústica perceptual resistente a variaciones de ganancia y transcodes."""
    try:
        if data is None or len(data) == 0:
            return ""
        sr = int(samplerate) if samplerate else 44100
        step = max(1, sr // 11025)
        mono_sub = data[::step]
        target_len = min(len(mono_sub), 11025 * 30)
        start_idx = max(0, (len(mono_sub) - target_len) // 2)
        segment = mono_sub[start_idx : start_idx + target_len]
        n_fft = 2048
        hop = 1024
        num_frames = (len(segment) - n_fft) // hop
        if num_frames < 4:
            return hashlib.md5(segment[:1000].tobytes()).hexdigest()
        freq_bins = np.logspace(np.log10(100), np.log10(5000), num=17)
        freqs = np.fft.rfftfreq(n_fft, 1.0 / 11025)
        band_energies = []
        for i in range(min(num_frames, 120)):
            window = segment[i * hop : i * hop + n_fft] * np.hanning(n_fft)
            spectrum = np.abs(np.fft.rfft(window))
            frame_bands = []
            for b in range(16):
                mask = (freqs >= freq_bins[b]) & (freqs < freq_bins[b+1])
                band_energy = float(np.sum(spectrum[mask])) if np.any(mask) else 0.0
                frame_bands.append(band_energy)
            frame_sum = sum(frame_bands) or 1.0
            frame_bands = [be / frame_sum for be in frame_bands]
            band_energies.append(frame_bands)
        band_energies = np.array(band_energies)
        bits = []
        for t in range(len(band_energies) - 1):
            for b in range(15):
                diff_f = band_energies[t, b+1] - band_energies[t, b]
                diff_t = band_energies[t+1, b] - band_energies[t, b]
                bits.append('1' if (diff_f + diff_t) > 0 else '0')
        bitstring = ''.join(bits)
        h = hashlib.sha256(bitstring.encode('utf-8')).hexdigest()[:32]
        summary_hash = hashlib.md5(np.round(band_energies.mean(axis=0), 3).tobytes()).hexdigest()[:16]
        return f"{h}_{summary_hash}"
    except Exception as e:
        print(f"[FINGERPRINT ERROR] {e}")
        return ""

class AuditService:
    def __init__(self):
        self.directorio_actual = "/Users/admin/Music/mi musica"
        self._lock = threading.Lock()
        self._cancelar_proceso = False
        try:
            self.db_cache = AuditCacheDB()
        except Exception as e:
            print(f"[CACHE DB INIT ERROR] {e}")
            self.db_cache = None

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
    def medir_lufs_y_true_peak(filepath: str) -> dict:
        """
        Mide la sonoridad integrada (LUFS según ITU-R BS.1770 / EBU R128),
        el rango dinámico (LRA) y el pico real inter-sample (True Peak en dBFS).
        Detecta clipping digital (> 0.0 dBFS) que provoca distorsión en cabina.
        """
        if not filepath or not os.path.exists(filepath):
            return {
                "lufs": -14.0,
                "lra": 0.0,
                "true_peak": -0.1,
                "clipping": False,
                "status_lufs": "Normal",
                "badge_lufs": "green"
            }

        ffmpeg_bin = "/usr/local/bin/ffmpeg" if os.path.exists("/usr/local/bin/ffmpeg") else "ffmpeg"
        try:
            cmd = [
                ffmpeg_bin, "-nostats", "-i", filepath,
                "-filter_complex", "ebur128=peak=true",
                "-f", "null", "-"
            ]
            p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=8)
            out = p.stderr

            m_i = re.search(r'Integrated loudness:\s+I:\s+([-\d\.]+)\s+LUFS', out)
            m_lra = re.search(r'Loudness range:\s+LRA:\s+([-\d\.]+)\s+LU', out)
            m_tp = re.search(r'True peak:\s+Peak:\s+([-\d\.]+)\s+dBFS', out)

            if m_i:
                lufs = float(m_i.group(1))
                lra = float(m_lra.group(1)) if m_lra else 0.0
                tp = float(m_tp.group(1)) if m_tp else -0.1
                clipping = bool(tp > 0.0)

                if lufs > -7.0:
                    status = "Muy Alto (Loudness War)"
                    badge = "amber"
                elif lufs >= -11.0:
                    status = "Óptimo Club (-8 a -11 LUFS)"
                    badge = "green"
                elif lufs >= -14.0:
                    status = "Streaming Estándar (-14 LUFS)"
                    badge = "cyan"
                else:
                    status = "Bajo (< -14 LUFS)"
                    badge = "blue"

                if clipping:
                    status += " • CLIPPING"
                    badge = "red"

                return {
                    "lufs": round(lufs, 1),
                    "lra": round(lra, 1),
                    "true_peak": round(tp, 1),
                    "clipping": clipping,
                    "status_lufs": status,
                    "badge_lufs": badge
                }
        except Exception:
            pass

        # Fallback rápido mediante numpy (estimación RMS)
        try:
            data, sr = sf.read(filepath, start=0, frames=min(44100 * 30, 800000))
            if len(data.shape) > 1:
                data = data.mean(axis=1)
            rms = np.sqrt(np.mean(data**2))
            lufs = round(20 * np.log10(rms + 1e-10) - 0.691, 1)
            peak = round(20 * np.log10(np.max(np.abs(data)) + 1e-10), 1)
            clipping = peak >= 0.0
            return {
                "lufs": max(-30.0, min(0.0, lufs)),
                "lra": 3.0,
                "true_peak": peak,
                "clipping": clipping,
                "status_lufs": "Aprox. RMS" + (" • CLIPPING" if clipping else ""),
                "badge_lufs": "red" if clipping else "green"
            }
        except Exception:
            return {
                "lufs": -9.0,
                "lra": 0.0,
                "true_peak": -0.1,
                "clipping": False,
                "status_lufs": "Estándar DJ",
                "badge_lufs": "green"
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
        """Permite navegar por el árbol de carpetas y ficheros de audio directamente en la UI sin popups de permisos del SO."""
        base = os.path.expanduser("~")
        target = ruta_base if (ruta_base and os.path.isdir(ruta_base)) else os.path.join(base, "Music")
        if not os.path.isdir(target):
            target = base

        extensiones_audio = (".flac", ".mp3", ".wav", ".aiff", ".m4a", ".aac", ".ogg", ".wma", ".alac", ".opus")
        carpetas = []
        ficheros = []
        try:
            for entry in sorted(os.scandir(target), key=lambda e: e.name.lower()):
                if entry.is_dir() and not entry.name.startswith((".", "$")):
                    carpetas.append({
                        "name": entry.name,
                        "path": entry.path
                    })
                elif entry.is_file() and not entry.name.startswith((".", "$")) and entry.name.lower().endswith(extensiones_audio):
                    ficheros.append({
                        "name": entry.name,
                        "path": entry.path,
                        "ext": os.path.splitext(entry.name)[1].replace(".", "").upper(),
                        "size_mb": round(entry.stat().st_size / (1024 * 1024), 2)
                    })
        except Exception as e:
            print(f"[EXPLORADOR FS] Error leyendo {target}: {e}")

        parent = os.path.dirname(os.path.abspath(target)) if target != "/" else "/"
        return {
            "current": target,
            "parent": parent,
            "folders": carpetas,
            "files": ficheros
        }

    def seleccionar_directorio(self, prompt="Selecciona tu carpeta de música DJ (FLAC, MP3, WAV):"):
        if not self._lock.acquire(blocking=False):
            return ""
        try:
            # Script con activación de System Events para ventana en primer plano sin lag
            safe_prompt = prompt.replace('"', '\\"')
            script = f'''tell application "System Events"
    activate
    set folderPath to POSIX path of (choose folder with prompt "{safe_prompt}")
end tell
return folderPath'''
            proc = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=30)
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
            return {"id": spotify_id, "estado": "Error I/O", "corte": "N/A", "cutoff_khz": 22.0, "perdida": 0, "spectrum": [], "low_ratio": 33.3, "mid_ratio": 33.3, "high_ratio": 33.4, "acoustic_role": "Balanced Full-Range", "acoustic_fp": ""}
        if not os.path.exists(filepath):
            if self.directorio_actual and os.path.basename(filepath):
                cand = os.path.join(self.directorio_actual, os.path.basename(filepath))
                if os.path.exists(cand):
                    filepath = cand

        # Verificación en Caché SQLite previa a procesamiento intensivo
        mtime = None
        fsize = None
        if os.path.exists(filepath):
            try:
                mtime = os.path.getmtime(filepath)
                fsize = os.path.getsize(filepath)
            except Exception:
                pass

        if hasattr(self, "db_cache") and self.db_cache:
            cached = self.db_cache.get(filepath, mtime, fsize)
            if cached:
                spec = []
                if cached.get("spectrum_json"):
                    try:
                        spec = json.loads(cached["spectrum_json"])
                    except Exception:
                        pass
                res = {
                    "id": spotify_id,
                    "status": cached.get("status", "Lossless OK"),
                    "estado": cached.get("status", "Lossless OK"),
                    "calidad": cached.get("calidad", "Alta"),
                    "perdida": "Sin Pérdida" if not cached.get("es_fake") else "Compresión",
                    "perdida_pct": 0.0 if not cached.get("es_fake") else 35.0,
                    "compresion": "Ninguna" if not cached.get("es_fake") else "Lossy Transcode",
                    "es_fake": bool(cached.get("es_fake")),
                    "badge_color": "red" if cached.get("es_fake") else "green",
                    "corte": f"{cached.get('cutoff_khz', 22.0):.1f} kHz",
                    "cutoff_khz": round(float(cached.get("cutoff_khz", 22.0)), 1),
                    "spectrum": spec,
                    "samplerate": int(float(cached.get("sample_rate_khz", 44.1)) * 1000),
                    "sample_rate_khz": float(cached.get("sample_rate_khz", 44.1)),
                    "bitrate_kbps": int(cached.get("bitrate_kbps", 0)),
                    "bit_depth": 16,
                    "format": cached.get("format", "FLAC"),
                    "lufs": float(cached.get("lufs", -14.0)),
                    "lra": 0.0,
                    "true_peak": float(cached.get("true_peak", -0.1)),
                    "clipping": float(cached.get("true_peak", -0.1)) > 0.0,
                    "status_lufs": "Normal",
                    "badge_lufs": "green",
                    "low_ratio": float(cached.get("low_ratio", 33.3)),
                    "mid_ratio": float(cached.get("mid_ratio", 33.3)),
                    "high_ratio": float(cached.get("high_ratio", 33.4)),
                    "acoustic_role": cached.get("acoustic_role", "Balanced Full-Range"),
                    "acoustic_fp": cached.get("acoustic_fp", "")
                }
                if spotify_id is not None and hasattr(eel, "notificar_resultado_auditoria"):
                    try:
                        eel.notificar_resultado_auditoria(res)()
                    except Exception:
                        pass
                return res

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

            # Medición de sonoridad profesional LUFS y True Peak (EBU R128)
            lufs_res = self.medir_lufs_y_true_peak(filepath)

            # Cálculo de Ratio Espectral Tri-Banda (Anti-Muddy / Densidad Espectral)
            # Low: 20 - 250 Hz (Subgrave y pegada de bombo)
            # Mid: 250 - 4.000 Hz (Cuerpo, leads y presencia vocal)
            # High: 4.000 - 20.000 Hz (Agudos, platos y aire)
            low_mask = (xf >= 20) & (xf < 250)
            mid_mask = (xf >= 250) & (xf < 4000)
            high_mask = (xf >= 4000) & (xf <= 20000)

            power = (np.abs(yf) ** 2)
            low_energy = float(np.sum(power[low_mask])) if np.any(low_mask) else 0.0
            mid_energy = float(np.sum(power[mid_mask])) if np.any(mid_mask) else 0.0
            high_energy = float(np.sum(power[high_mask])) if np.any(high_mask) else 0.0
            total_tri_energy = low_energy + mid_energy + high_energy

            if total_tri_energy > 0:
                low_ratio = round((low_energy / total_tri_energy) * 100.0, 1)
                mid_ratio = round((mid_energy / total_tri_energy) * 100.0, 1)
                high_ratio = round(max(0.0, 100.0 - (low_ratio + mid_ratio)), 1)
            else:
                low_ratio, mid_ratio, high_ratio = 33.3, 33.3, 33.4

            # Determinación determinista del Rol Acústico de Cabina
            if low_ratio >= 45.0:
                acoustic_role = "Bass Driver"
            elif mid_ratio >= 45.0:
                acoustic_role = "Vocal / Lead"
            elif high_ratio >= 30.0 or low_ratio <= 30.0:
                acoustic_role = "Percussive Tool"
            else:
                acoustic_role = "Balanced Full-Range"

            # Huella acústica perceptual para deduplicación transparente
            acoustic_fp = calcular_huella_acustica(data, samplerate)

            # Persistencia en Caché SQLite
            if hasattr(self, "db_cache") and self.db_cache and filepath and os.path.exists(filepath):
                try:
                    f_hash = hashlib.md5(f"{os.path.basename(filepath)}_{fsize}".encode("utf-8")).hexdigest()
                    self.db_cache.set({
                        "filepath": filepath,
                        "file_hash": f_hash,
                        "mtime": mtime or 0.0,
                        "filesize": fsize or 0,
                        "cutoff_khz": float(cutoff_khz),
                        "lufs": float(lufs_res.get("lufs", -14.0)),
                        "true_peak": float(lufs_res.get("true_peak", -0.1)),
                        "low_ratio": low_ratio,
                        "mid_ratio": mid_ratio,
                        "high_ratio": high_ratio,
                        "acoustic_role": acoustic_role,
                        "format": diag["format"],
                        "bitrate_kbps": int(diag["bitrate_kbps"]),
                        "sample_rate_khz": float(diag["sample_rate_khz"]),
                        "calidad": diag["calidad"],
                        "status": diag["status"],
                        "es_fake": diag["es_fake"],
                        "acoustic_fp": acoustic_fp,
                        "spectrum_json": json.dumps(spectrum_points)
                    })
                except Exception as e_cache:
                    print(f"[CACHE DB SAVE ERROR] {e_cache}")

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
                "lufs": lufs_res.get("lufs", -14.0),
                "lra": lufs_res.get("lra", 0.0),
                "true_peak": lufs_res.get("true_peak", -0.1),
                "clipping": lufs_res.get("clipping", False),
                "status_lufs": lufs_res.get("status_lufs", "Normal"),
                "badge_lufs": lufs_res.get("badge_lufs", "green"),
                "low_ratio": low_ratio,
                "mid_ratio": mid_ratio,
                "high_ratio": high_ratio,
                "acoustic_role": acoustic_role,
                "acoustic_fp": acoustic_fp,
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
                "lufs": -14.0,
                "lra": 0.0,
                "true_peak": -0.1,
                "clipping": False,
                "status_lufs": "Error I/O",
                "badge_lufs": "gray",
                "spectrum": [],
                "low_ratio": 33.3,
                "mid_ratio": 33.3,
                "high_ratio": 33.4,
                "acoustic_role": "Balanced Full-Range",
                "acoustic_fp": "" 
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
        cues = []
        try:
            info = AudioProcessorService.analizar_track_avanzado(filepath)
            bpm_val = float(info.get("bpm") or 128.0)
            dur_ms = int(float(info.get("duration_sec", 300)) * 1000)
            cues = AudioProcessorService.calcular_8_hot_cues_fraseo(
                duration_ms=dur_ms,
                bpm=bpm_val,
                downbeat_ms=int(downbeat_ms)
            )
        except Exception:
            pass

        return {
            "status": "ok",
            "id": track_id,
            "path": filepath,
            "trim_start_ms": trim_ms,
            "first_downbeat_ms": downbeat_ms,
            "cues": cues
        }

    @staticmethod
    def detectar_bpm_tonalidad_librosa(filepath: str, duration_sec: float = 40.0) -> dict:
        """Calcula BPM y Tonalidad Camelot de forma 100% nativa y offline mediante Librosa/DSP.
        Analiza un segmento de audio del tema con perfil de armónicos Krumhansl-Schmuckler."""
        if not filepath or not os.path.exists(filepath):
            return {"status": "error", "msg": "Archivo no encontrado"}

        try:
            import librosa
            import numpy as np

            # Carga de segmento central (25s a 65s) para capturar el drop/ritmo
            y, sr = librosa.load(filepath, sr=22050, mono=True, offset=25.0, duration=duration_sec)
            if len(y) == 0:
                y, sr = librosa.load(filepath, sr=22050, mono=True, duration=duration_sec)
            if len(y) == 0:
                return {"status": "error", "msg": "Audio vacío o ilegible"}

            # 1. Detección de BPM
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            bpm_float = float(tempo[0] if isinstance(tempo, (list, np.ndarray)) else tempo)
            if bpm_float < 70 and bpm_float > 0:
                bpm_float *= 2.0
            elif bpm_float > 180:
                bpm_float /= 2.0
            bpm_res = round(bpm_float, 2)

            # 2. Detección de Tonalidad Musical mediante Correlación Cromagrama Krumhansl-Schmuckler
            chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
            chroma_avg = np.mean(chroma, axis=1)

            major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
            minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
            pitches = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

            camelot_map = {
                ('C', 'maj'): '8B', ('G', 'maj'): '9B', ('D', 'maj'): '10B', ('A', 'maj'): '11B',
                ('E', 'maj'): '12B', ('B', 'maj'): '1B', ('F#', 'maj'): '2B', ('C#', 'maj'): '3B',
                ('G#', 'maj'): '4B', ('D#', 'maj'): '5B', ('A#', 'maj'): '6B', ('F', 'maj'): '7B',
                ('A', 'min'): '8A', ('E', 'min'): '9A', ('B', 'min'): '10A', ('F#', 'min'): '11A',
                ('C#', 'min'): '12A', ('G#', 'min'): '1A', ('D#', 'min'): '2A', ('A#', 'min'): '3A',
                ('F', 'min'): '4A', ('C', 'min'): '5A', ('G', 'min'): '6A', ('D', 'min'): '7A',
            }

            best_r = -2.0
            best_pitch = 'C'
            best_mode = 'maj'

            for i in range(12):
                r_maj = float(np.corrcoef(chroma_avg, np.roll(major_profile, i))[0, 1])
                if r_maj > best_r:
                    best_r = r_maj
                    best_pitch = pitches[i]
                    best_mode = 'maj'
                r_min = float(np.corrcoef(chroma_avg, np.roll(minor_profile, i))[0, 1])
                if r_min > best_r:
                    best_r = r_min
                    best_pitch = pitches[i]
                    best_mode = 'min'

            camelot_key = camelot_map.get((best_pitch, best_mode), '8A')
            classical_name = f"{best_pitch} {'Major' if best_mode == 'maj' else 'minor'}"

            return {
                "status": "ok",
                "bpm": bpm_res,
                "key": camelot_key,
                "classical_key": classical_name,
                "confidence": round(float(best_r), 3)
            }
        except Exception as e:
            print(f"[LIBROSA DSP] Error analizando {os.path.basename(filepath)}: {e}")
            return {"status": "error", "msg": str(e)}

    def iniciar_auditoria(self, ruta_directorio, emitir_log_cb=None, progreso_cb=None, opts=None):
        if not ruta_directorio:
            return {"total": 0, "sin_meta": 0, "ready": 0, "errors": 0, "tracks": []}

        self.reiniciar_cancelacion()
        extensiones = (".flac", ".mp3", ".wav", ".aiff", ".m4a", ".aac", ".ogg", ".wma", ".alac", ".opus")
        archivos = []
        seen_files = set()

        if isinstance(ruta_directorio, (list, tuple)):
            for item in ruta_directorio:
                if not isinstance(item, str):
                    continue
                if os.path.isfile(item):
                    if item.lower().endswith(extensiones) and item not in seen_files:
                        archivos.append((os.path.dirname(item), os.path.basename(item)))
                        seen_files.add(item)
                elif os.path.isdir(item):
                    for root, _, files in os.walk(item):
                        for file in sorted(files):
                            if not file.startswith(".") and file.lower().endswith(extensiones):
                                full_p = os.path.join(root, file)
                                if full_p not in seen_files:
                                    archivos.append((root, file))
                                    seen_files.add(full_p)
                                    if len(archivos) >= 50000:
                                        break
                        if len(archivos) >= 50000:
                            break
            if archivos:
                self.directorio_actual = archivos[0][0]
            if emitir_log_cb:
                emitir_log_cb(f"Iniciando auditoría avanzada de {len(archivos)} pistas seleccionadas (de carpetas y pistas sueltas)")
        elif isinstance(ruta_directorio, str):
            if os.path.isfile(ruta_directorio):
                if ruta_directorio.lower().endswith(extensiones):
                    archivos.append((os.path.dirname(ruta_directorio), os.path.basename(ruta_directorio)))
                    self.directorio_actual = os.path.dirname(ruta_directorio)
            elif os.path.isdir(ruta_directorio):
                self.directorio_actual = ruta_directorio
                for root, _, files in os.walk(ruta_directorio):
                    for file in sorted(files):
                        if not file.startswith(".") and file.lower().endswith(extensiones):
                            full_p = os.path.join(root, file)
                            if full_p not in seen_files:
                                archivos.append((root, file))
                                seen_files.add(full_p)
                                if len(archivos) >= 50000:
                                    break
                    if len(archivos) >= 50000:
                        break
            if emitir_log_cb:
                emitir_log_cb(f"Iniciando auditoría avanzada en: {ruta_directorio}")
        else:
            return {"total": 0, "sin_meta": 0, "ready": 0, "errors": 0, "tracks": []}

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
            _cooperative_yield()
            if self._cancelar_proceso:
                print(f"[AUDITORIA] Detenida por el usuario en ({idx}/{total_files})")
                if progreso_cb:
                    progreso_cb(0, f"Auditoría detenida por el usuario.")
                break

            full_path = os.path.join(root, file)
            pct = int(5 + (idx / total_files) * 90)
            if total_files <= 30 or idx % max(1, total_files // 25) == 0 or idx == total_files:
                if progreso_cb:
                    progreso_cb(pct, f"Auditando ({idx}/{total_files}): {file}")

            info = AudioProcessorService.analizar_track_avanzado(full_path)
            if self._cancelar_proceso:
                break
            bpm_val = info.get("bpm")
            key_val = info.get("key")
            is_missing = bool(info.get("missing_meta", False) or not bpm_val or not key_val or str(bpm_val) == "--" or str(key_val) == "--")
            if is_missing:
                # Fallback acústico nativo offline: análisis local de BPM y Camelot Key vía Librosa/FFT
                try:
                    local_dsp = self.detectar_bpm_tonalidad_librosa(full_path)
                    if local_dsp and local_dsp.get("status") == "ok":
                        if not bpm_val or str(bpm_val) == "--":
                            bpm_val = str(local_dsp.get("bpm"))
                            info["bpm"] = bpm_val
                            info["b"] = bpm_val
                        if not key_val or str(key_val) == "--":
                            key_val = str(local_dsp.get("key"))
                            info["key"] = key_val
                            info["k"] = key_val
                        is_missing = False
                    else:
                        sin_meta_count += 1
                except Exception:
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

            # Detección ultrarrápida y/o inyección de carátulas durante la auditoría
            has_cover = AudioProcessorService.tiene_caratula(full_path)
            track_cover = f"/cover?path={urllib.parse.quote(full_path)}" if has_cover else str(info.get("cover") or "")
            if inyectar_covers and not has_cover:
                resolved_c = AudioProcessorService.resolver_caratula_local_o_remota(
                    full_path, 
                    str(info.get("artist") or ""), 
                    str(info.get("title") or "")
                )
                if resolved_c:
                    track_cover = resolved_c
                    has_cover = True
                    AudioProcessorService.escribir_metadatos_pro(full_path, info, cover_url=resolved_c)

            # Clasificación de Fase en Sesión DJ
            bpm_num = float(bpm_val) if bpm_val and str(bpm_val) != "--" else 126.0
            key_clean = str(key_val or "8A")
            e_num = int(info.get("energy") or 85)
            dance_num = int(info.get("danceability") or info.get("dance") or 85)
            from services.mood_intelligence_service import MoodIntelligenceService
            from services.genre_classifier_service import GenreClassifierDSP
            fase_info = MoodIntelligenceService.clasificar_fase_sesion_dj(
                bpm=bpm_num,
                key=key_clean,
                energy=e_num,
                danceability=dance_num,
                genre=str(info.get("genre") or "Tech House"),
                filepath=full_path
            )

            title_str = str(info.get("title") or os.path.splitext(file)[0])
            artist_str = str(info.get("artist") or "Desconocido")
            has_title = bool(title_str and title_str.lower().strip() not in ("untitled", "desconocido", "unknown", "track", "pista"))
            has_artist = bool(artist_str and artist_str.lower().strip() not in ("desconocido", "unknown", "various artists", "various", "artist"))

            tactical_comment = str(info.get("comment") or "")
            if not tactical_comment or "Intro" not in tactical_comment:
                tactical_comment = MoodIntelligenceService.generar_comentario_tactico(
                    bpm=bpm_num,
                    key=key_clean,
                    mood=fase_info.get("vibe", "Peak Time"),
                    subtag=fase_info.get("fase", "Clímax"),
                    energy=e_num,
                    cues=info.get("cues") or [],
                    first_downbeat_ms=float(info.get("first_downbeat_ms") or 0.0),
                    lang="es"
                )

            # Medición de sonoridad profesional LUFS y True Peak (EBU R128)
            if ejecutar_fft and 'fft_res' in locals() and isinstance(fft_res, dict) and 'lufs' in fft_res:
                lufs_val = fft_res.get("lufs", -10.0)
                lra_val = fft_res.get("lra", 0.0)
                tp_val = fft_res.get("true_peak", -0.1)
                is_clipping = fft_res.get("clipping", False)
                status_lufs = fft_res.get("status_lufs", "Normal")
                badge_lufs = fft_res.get("badge_lufs", "green")
            else:
                lufs_data = self.medir_lufs_y_true_peak(full_path)
                lufs_val = lufs_data.get("lufs", -10.0)
                lra_val = lufs_data.get("lra", 0.0)
                tp_val = lufs_data.get("true_peak", -0.1)
                is_clipping = lufs_data.get("clipping", False)
                status_lufs = lufs_data.get("status_lufs", "Normal")
                badge_lufs = lufs_data.get("badge_lufs", "green")

                        # Clasificación Acústica de Género y Subgénero (GenreClassifierDSP MIR)
            try:
                bpm_float = float(bpm_val) if bpm_val and str(bpm_val) != "--" else 0.0
                cls_data = GenreClassifierDSP.classify_track(full_path, known_bpm=bpm_float)
                track_genre = cls_data.get("genre", "TECHNO")
                track_subgenre = cls_data.get("subgenre", "Peak Time / Driving")
                track_mood = cls_data.get("mood", "Peak Time Hypnotic")
                track_crate = cls_data.get("crate_path", "")
                track_confidence = cls_data.get("confidence", 85.0)
                track_sig = cls_data.get("signature", {})
            except Exception as e_cls:
                track_genre = "TECHNO"
                track_subgenre = "Peak Time / Driving"
                track_mood = "Peak Time Hypnotic"
                track_crate = "/Music/Serato/Techno/Peak Time / Driving/"
                track_confidence = 75.0
                track_sig = {}

            v_type = TagSanitizerService.extraer_tipo_version(f"{title_str} {file}")

            tracks_auditados.append({
                "id": idx,
                "f": str(file),
                "filename": str(file),
                "path": str(full_path),
                "t": title_str,
                "title": title_str,
                "a": artist_str,
                "artist": artist_str,
                "b": f"{float(bpm_val):.2f}" if bpm_val and str(bpm_val) != "--" else "--",
                "bpm": f"{float(bpm_val):.2f}" if bpm_val and str(bpm_val) != "--" else "--",
                "k": str(key_val or "--"),
                "key": str(key_val or "--"),
                "e": e_num,
                "dance": dance_num,
                "danceability": dance_num,
                "mood": str(info.get("mood") or fase_info.get("vibe", "Peak Time")),
                "fase_dj": fase_info.get("fase", "Medio"),
                "fase_badge": fase_info.get("fase_badge", "BUILD-UP"),
                "fase_color": fase_info.get("fase_color", "amber"),
                "vibe": fase_info.get("vibe", "Agitado"),
                "recomendacion_dj": fase_info.get("recomendacion", ""),
                "missing_title": not has_title,
                "missing_artist": not has_artist,
                "missing_cover": not has_cover,
                "has_cover": bool(has_cover),
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
                "lufs": lufs_val,
                "lra": lra_val,
                "true_peak": tp_val,
                "clipping": is_clipping,
                "status_lufs": status_lufs,
                "badge_lufs": badge_lufs,
                "version_type": v_type,
                "genre": track_genre,
                "subgenre": track_subgenre,
                "g": track_subgenre,
                "mood": track_mood,
                "crate_path": track_crate,
                "confidence": track_confidence,
                "acoustic_sig": track_sig,
                "spectrum": spectrum_points,
                "trim_start_ms": float(info.get("trim_start_ms") or 0.0),
                "first_downbeat_ms": float(info.get("first_downbeat_ms") or 0.0),
                "comment": tactical_comment,
                "genre": str(info.get("genre") or "Tech House"),
                "subgenre": str(info.get("subgenre") or "Tech House"),
                "cues": info.get("cues") or [],
                "low_ratio": float(fft_res.get("low_ratio", 33.3)) if 'fft_res' in locals() and isinstance(fft_res, dict) else 33.3,
                "mid_ratio": float(fft_res.get("mid_ratio", 33.3)) if 'fft_res' in locals() and isinstance(fft_res, dict) else 33.3,
                "high_ratio": float(fft_res.get("high_ratio", 33.4)) if 'fft_res' in locals() and isinstance(fft_res, dict) else 33.4,
                "acoustic_role": str(fft_res.get("acoustic_role", "Balanced Full-Range")) if 'fft_res' in locals() and isinstance(fft_res, dict) else "Balanced Full-Range",
                "acoustic_fp": str(fft_res.get("acoustic_fp", "")) if 'fft_res' in locals() and isinstance(fft_res, dict) else ""
            })

        total = len(tracks_auditados)
        ready_count = max(0, total - sin_meta_count)
        missing_title_count = sum(1 for t in tracks_auditados if t.get("missing_title"))
        missing_artist_count = sum(1 for t in tracks_auditados if t.get("missing_artist"))
        missing_cover_count = sum(1 for t in tracks_auditados if t.get("missing_cover"))

        # Detección inicial de duplicados para el resumen (protegiendo versiones hermanas DJ)
        dup_summary = self.detectar_duplicados_biblioteca(tracks_auditados, proteger_versiones_hermanas=True)
        dup_count = dup_summary.get("total_duplicados", 0)

        if progreso_cb:
            progreso_cb(100, f"Auditoría finalizada: {total} pistas procesadas.")

        return {
            "total": total,
            "sin_meta": sin_meta_count,
            "missing_title": missing_title_count,
            "missing_artist": missing_artist_count,
            "missing_cover": missing_cover_count,
            "duplicates": dup_count,
            "ready": ready_count,
            "errors": fake_count,
            "tracks": tracks_auditados
        }

    @staticmethod
    def _escanear_archivos_audio_recursivo(ruta_directorio, extensiones, max_files=50000):
        archivos = []
        seen = set()

        def _escanear_dir(dir_path):
            try:
                with os.scandir(dir_path) as it:
                    for entry in it:
                        if len(archivos) >= max_files:
                            break
                        try:
                            if entry.is_dir(follow_symlinks=False):
                                if not entry.name.startswith("."):
                                    _escanear_dir(entry.path)
                            elif entry.is_file(follow_symlinks=False):
                                name_lower = entry.name.lower()
                                if not entry.name.startswith(".") and name_lower.endswith(extensiones):
                                    full_p = entry.path
                                    if full_p not in seen:
                                        seen.add(full_p)
                                        st = entry.stat()
                                        archivos.append((full_p, dir_path, entry.name, float(st.st_mtime), int(st.st_size)))
                        except Exception:
                            continue
            except Exception:
                pass

        if isinstance(ruta_directorio, (list, tuple)):
            for item in ruta_directorio:
                if not isinstance(item, str):
                    continue
                if os.path.isfile(item):
                    name_lower = os.path.basename(item).lower()
                    if not os.path.basename(item).startswith(".") and name_lower.endswith(extensiones) and item not in seen:
                        seen.add(item)
                        try:
                            st = os.stat(item)
                            archivos.append((item, os.path.dirname(item), os.path.basename(item), float(st.st_mtime), int(st.st_size)))
                        except Exception:
                            pass
                elif os.path.isdir(item):
                    _escanear_dir(item)
        elif isinstance(ruta_directorio, str):
            if os.path.isfile(ruta_directorio):
                name_lower = os.path.basename(ruta_directorio).lower()
                if not os.path.basename(ruta_directorio).startswith(".") and name_lower.endswith(extensiones):
                    try:
                        st = os.stat(ruta_directorio)
                        archivos.append((ruta_directorio, os.path.dirname(ruta_directorio), os.path.basename(ruta_directorio), float(st.st_mtime), int(st.st_size)))
                    except Exception:
                        pass
            elif os.path.isdir(ruta_directorio):
                _escanear_dir(ruta_directorio)

        return archivos

    def _extraer_metadatos_pista_individual(self, full_path, root, file, mtime, filesize, dir_cover_cache=None):
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
        has_cover = False

        tech_sr = 44100
        tech_depth = 16
        tech_kbps = 0
        tech_channels = 2

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
                        tech_sr = getattr(f.info, "sample_rate", 44100)
                        tech_depth = getattr(f.info, "bits_per_sample", 16)
                        tech_channels = getattr(f.info, "channels", 2)
                        raw_br = getattr(f.info, "bitrate", 0)
                        tech_kbps = round(raw_br / 1000) if raw_br else round((tech_sr * tech_depth * tech_channels) / 1000)
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
                    if getattr(f, "pictures", None):
                        has_cover = True
                except Exception:
                    m = MutagenFile(full_path, easy=True)
                    if m:
                        title = str(m.get("title", [""])[0])
                        artist = str(m.get("artist", [""])[0])
                        genre_str = str(m.get("genre", [""])[0])
                        if m.info and hasattr(m.info, "length"):
                            dur_str = f"{int(m.info.length)//60}:{int(m.info.length)%60:02d}"
                            tech_sr = getattr(m.info, "sample_rate", 44100)
                            tech_depth = getattr(m.info, "bits_per_sample", 16)
                            tech_kbps = round(getattr(m.info, "bitrate", 0) / 1000)
            else:
                id3_tags = None
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
                    if any(k.startswith('APIC') for k in id3_tags.keys()):
                        has_cover = True
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
                        tech_sr = getattr(m.info, "sample_rate", 44100)
                        tech_kbps = round(getattr(m.info, "bitrate", 0) / 1000)
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

        if tech_kbps == 0:
            tech = self.extraer_info_tecnica_audio(full_path)
            tech_sr = tech.get("samplerate", tech_sr)
            tech_depth = tech.get("bit_depth", tech_depth)
            tech_kbps = tech.get("bitrate_kbps", tech_kbps)

        diag = self.diagnosticar_calidad_audio(
            filepath=full_path,
            cutoff_khz=0.0,
            samplerate=tech_sr,
            bit_depth=tech_depth,
            bitrate_kbps=tech_kbps,
            fmt=ext.replace(".", "").upper()
        )

        if not has_cover:
            dir_has_img = False
            if dir_cover_cache is not None:
                if root in dir_cover_cache:
                    dir_has_img = dir_cover_cache[root]
                else:
                    dir_has_img = any(
                        os.path.exists(os.path.join(root, cand))
                        for cand in ("cover.jpg", "cover.png", "folder.jpg", "front.jpg")
                    )
                    dir_cover_cache[root] = dir_has_img
            else:
                dir_has_img = any(
                    os.path.exists(os.path.join(root, cand))
                    for cand in ("cover.jpg", "cover.png", "folder.jpg", "front.jpg")
                )
            has_cover = dir_has_img

        track_cover = f"/cover?path={urllib.parse.quote(full_path)}" if has_cover else ""

        if bpm_str != "--":
            try:
                b_num = float(bpm_str)
                e_initial = min(98, max(45, int(60 + (b_num - 118.0) * 1.5)))
                dance_initial = min(98, max(50, int(92 - abs(b_num - 126.0) * 0.9)))
            except Exception:
                b_num = 126.0
                e_initial = 80
                dance_initial = 80
        else:
            b_num = 126.0
            e_initial = 75
            dance_initial = 75

        fase_init = MoodIntelligenceService.clasificar_fase_sesion_dj(
            bpm=b_num,
            key=key_str if key_str != "--" else "8A",
            energy=e_initial,
            danceability=dance_initial,
            genre=genre_str,
            filepath=full_path
        )

        has_title = bool(title and str(title).strip().lower() not in ("untitled", "desconocido", "unknown", "track", "pista"))
        has_artist = bool(artist and str(artist).strip().lower() not in ("desconocido", "unknown", "various artists", "various", "artist"))

        initial_comment = f"[{bpm_str} BPM | {key_str} | {fase_init['fase_badge']}] Intro 32b • Drop contundente • Outro 64b"

        return {
            "id": 0,
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
            "e": e_initial,
            "dance": dance_initial,
            "danceability": dance_initial,
            "mood": fase_init.get("vibe", "Build-Up"),
            "fase_dj": fase_init.get("fase", "Medio"),
            "fase_badge": fase_init.get("fase_badge", "BUILD-UP"),
            "fase_color": fase_init.get("fase_color", "amber"),
            "vibe": fase_init.get("vibe", "Agitado"),
            "recomendacion_dj": fase_init.get("recomendacion", ""),
            "missing_title": not has_title,
            "missing_artist": not has_artist,
            "missing_cover": not has_cover,
            "has_cover": bool(has_cover),
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
            "filesize": filesize,
            "comment": initial_comment,
            "cover": track_cover,
            "cues": cues_frase
        }

    def cargar_metadatos_directorio(self, ruta_directorio, progreso_cb=None):
        """Lee metadatos existentes con motor multi-hilo en paralelo y caché persistente SQLite WAL (soporte 50.000 pistas)."""
        if not ruta_directorio:
            return {"total": 0, "sin_meta": 0, "ready": 0, "errors": 0, "tracks": []}

        self.reiniciar_cancelacion()
        extensiones = (".flac", ".mp3", ".wav", ".aiff", ".m4a", ".aac", ".ogg", ".wma", ".alac", ".opus")

        # 1. ESCANEO CON OS.SCANDIR (Lectura dirent de kernel, sin stat() redundantes)
        archivos = self._escanear_archivos_audio_recursivo(ruta_directorio, extensiones, max_files=50000)
        total_files = len(archivos)
        if total_files == 0:
            return {"total": 0, "sin_meta": 0, "ready": 0, "errors": 0, "tracks": []}

        self.directorio_actual = archivos[0][1]

        if progreso_cb:
            progreso_cb(3, f"Localizados {total_files} archivos en disco...")

        # 2. VERIFICACIÓN MASIVA EN CACHÉ PERSISTENTE SQLITE WAL (Sub-segundo para 50k pistas ya indexadas)
        file_tuples = [(item[0], item[3], item[4]) for item in archivos]
        cached_dict = self.db_cache.get_metadata_batch(file_tuples) if self.db_cache else {}

        tracks_cargados = []
        archivos_pendientes = []
        path_to_item = {}

        for item in archivos:
            fpath = item[0]
            path_to_item[fpath] = item
            if fpath in cached_dict:
                tracks_cargados.append(cached_dict[fpath])
            else:
                archivos_pendientes.append(item)

        total_pendientes = len(archivos_pendientes)

        # 3. PROCESAMIENTO MULTIHILO EN PARALELO PARA CACHE MISSES (ThreadPoolExecutor sin dependencias)
        if total_pendientes > 0:
            num_workers = min(32, max(4, (os.cpu_count() or 4) * 2))
            dir_cover_cache = {}
            items_to_save_cache = []
            emit_interval = min(50, max(5, total_pendientes // 40))

            with concurrent.futures.ThreadPoolExecutor(max_workers=num_workers) as executor:
                future_to_path = {
                    executor.submit(
                        self._extraer_metadatos_pista_individual,
                        item[0], item[1], item[2], item[3], item[4], dir_cover_cache
                    ): item[0]
                    for item in archivos_pendientes
                }

                done_count = 0
                for future in concurrent.futures.as_completed(future_to_path):
                    if self._cancelar_proceso:
                        print(f"[AUDIT SERVICE] Carga cancelada por usuario en {done_count}/{total_pendientes}")
                        executor.shutdown(wait=False)
                        break

                    done_count += 1
                    fpath = future_to_path[future]
                    try:
                        res_track = future.result()
                        if res_track:
                            tracks_cargados.append(res_track)
                            orig_item = path_to_item.get(fpath)
                            if orig_item:
                                items_to_save_cache.append((
                                    fpath,
                                    float(orig_item[3]),
                                    int(orig_item[4]),
                                    json.dumps(res_track)
                                ))
                    except Exception as err:
                        print(f"[METADATA EXTRACT ERROR] {fpath}: {err}")

                    if progreso_cb and (done_count % emit_interval == 0 or done_count == total_pendientes):
                        pct = int(5 + (done_count / total_pendientes) * 90)
                        progreso_cb(pct, f"Indexando pistas ({done_count}/{total_pendientes})...")

            # Guardar en SQLite en lote en una única transacción WAL atómica
            if items_to_save_cache and self.db_cache:
                self.db_cache.set_metadata_batch(items_to_save_cache)

        # 4. PRESERVAR ORDEN EXACTO DE ARCHIVOS Y REASIGNAR ID SECUENCIAL
        path_order = {item[0]: idx for idx, item in enumerate(archivos)}
        tracks_cargados.sort(key=lambda t: path_order.get(t.get("path") or "", 999999))
        for idx, t in enumerate(tracks_cargados, 1):
            t["id"] = idx

        # 5. CÁLCULO DE MÉTRICAS Y DUPLICADOS
        total = len(tracks_cargados)
        sin_meta_count = sum(1 for t in tracks_cargados if (t.get("b") == "--" or t.get("k") == "--" or t.get("bpm") == "--" or t.get("key") == "--"))
        missing_title_count = sum(1 for t in tracks_cargados if t.get("missing_title"))
        missing_artist_count = sum(1 for t in tracks_cargados if t.get("missing_artist"))
        missing_cover_count = sum(1 for t in tracks_cargados if t.get("missing_cover"))
        ready_count = max(0, total - sin_meta_count)

        dup_summary = self.detectar_duplicados_biblioteca(tracks_cargados, proteger_versiones_hermanas=True)
        dup_count = dup_summary.get("total_duplicados", 0)

        if progreso_cb:
            progreso_cb(100, f"Carga completada: {total} pistas listas.")

        return {
            "total": total,
            "sin_meta": sin_meta_count,
            "missing_title": missing_title_count,
            "missing_artist": missing_artist_count,
            "missing_cover": missing_cover_count,
            "duplicates": dup_count,
            "ready": ready_count,
            "errors": sum(1 for t in tracks_cargados if t.get("es_fake")),
            "tracks": tracks_cargados
        }

    def inyectar_caratulas_lote(self, tracks: list, progreso_cb=None) -> dict:
        """Busca o extrae carátulas 1:1 en alta resolución (local o remota) e incrusta en los archivos físicos."""
        if not tracks or not isinstance(tracks, list):
            return {"status": "error", "msg": "Lista de pistas vacía", "actualizadas": 0}

        self.reiniciar_cancelacion()
        total = len(tracks)
        actualizadas = 0
        errores = 0

        if progreso_cb:
            progreso_cb(5, f"Buscando e inyectando carátulas 1:1 ({total} pistas)...")

        for idx, t in enumerate(tracks, 1):
            _cooperative_yield()
            if self._cancelar_proceso:
                print(f"[CARATULAS] Cancelado por usuario en ({idx}/{total})")
                if progreso_cb:
                    progreso_cb(0, "Inyección de carátulas cancelada.")
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

        self.reiniciar_cancelacion()
        total = len(tracks)
        inyectados = 0
        errores = 0

        if progreso_cb:
            progreso_cb(5, f"Iniciando inyección profunda de metadatos ({total} pistas)...")

        for idx, t in enumerate(tracks, 1):
            _cooperative_yield()
            if self._cancelar_proceso:
                print(f"[METADATOS] Cancelado por usuario en ({idx}/{total})")
                if progreso_cb:
                    progreso_cb(0, "Inyección de metadatos cancelada.")
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

    @staticmethod
    def _normalizar_para_deduplicacion(texto: str) -> str:
        """Normaliza cadenas de texto para agrupar tracks duplicados eliminando paréntesis, versiones y caracteres especiales."""
        import re
        if not texto:
            return ""
        s = str(texto).lower().strip()
        # Eliminar sufijos entre paréntesis o corchetes como (Original Mix), [Extended Mix], etc.
        s = re.sub(r'[\(\[\{].*?[\)\]\}]', '', s)
        # Quitar palabras clave de versión
        for w in ["original mix", "extended mix", "club mix", "remix", "edit", "radio edit", "dub mix", "vip mix"]:
            s = s.replace(w, "")
        # Quitar caracteres especiales y puntuación
        s = re.sub(r'[^a-z0-9]', '', s)
        return s

    @staticmethod
    def _normalizar_artista_deduplicacion(artist: str) -> str:
        """Normaliza el artista para deduplicación ignorando colaboraciones (feat, vs) y signos de puntuación."""
        import re
        if not artist:
            return ""
        s = str(artist).lower().strip()
        s = re.sub(r'[\(\[\{].*?[\)\]\}]', '', s)
        s = re.sub(r'\b(feat|ft|featuring|pres|presents|vs|and)\b\.?', '', s)
        s = re.sub(r'[^a-z0-9]', '', s)
        return s

    @staticmethod
    def _extraer_artista_titulo_de_ruta(filepath: str) -> tuple:
        """Extrae de forma robusta artista y título a partir del nombre de archivo."""
        import os, re
        if not filepath:
            return "", ""
        fname = os.path.splitext(os.path.basename(filepath))[0]
        # Quitar números de pista iniciales: '01. ', '01 - ', '01_ '
        fname = re.sub(r'^\d+[\s\.\-_]+', '', fname).strip()
        if " - " in fname:
            partes = fname.split(" - ", 1)
            return partes[0].strip(), partes[1].strip()
        return "", fname

    def calcular_puntuacion_calidad_track(self, track: dict) -> float:
        """Calcula un índice técnico (0-100+) para dirimir con rigor acústico qué versión duplicada conservar."""
        fmt = str(track.get("format") or "").upper()
        if not fmt:
            ext = os.path.splitext(track.get("path") or track.get("f") or "")[1].lower()
            fmt = ext.replace(".", "").upper()

        sr = float(track.get("sample_rate_khz") or 44.1)
        bitrate = int(track.get("bitrate_kbps") or 0)
        bit_depth = int(track.get("bit_depth") or 16)
        cutoff = float(track.get("cutoff_khz") or 0.0)
        es_fake = bool(track.get("es_fake", False)) or ("FAKE" in str(track.get("status") or "").upper())

        score = 50.0

        if fmt in ("FLAC", "WAV", "AIFF", "AIF", "ALAC"):
            if es_fake:
                # Transcode falso: penalizar fuertemente
                score = 30.0 + min(20.0, cutoff)
            else:
                score = 90.0
                if sr >= 88.2:
                    score += 10.0  # Hi-Res Lossless 96k/192k
                elif sr >= 48.0:
                    score += 2.0
                if bit_depth >= 24:
                    score += 5.0
                if cutoff >= 20.0:
                    score += 5.0
        elif fmt in ("MP3", "M4A", "AAC", "OGG"):
            if bitrate >= 310 or cutoff >= 20.0:
                score = 75.0
            elif bitrate >= 240:
                score = 65.0
            elif bitrate >= 190 or cutoff >= 17.5:
                score = 52.0
            elif bitrate >= 120:
                score = 35.0
            else:
                score = 20.0

        # Rango dinámico y preservación de True Peak sin distorsión (EBU R128)
        tp = float(track.get("true_peak") or -0.1)
        clipping = bool(track.get("clipping", False)) or tp > 0.0
        if clipping:
            score -= 12.0  # Penalización severa por distorsión inter-sample (clipping digital)
        elif cutoff >= 20.0 and tp <= -0.1:
            score += 6.0   # Masterización profesional limpia con headroom

        # Tamaño en disco como desempate técnico fidedigno
        p = track.get("path")
        if p and os.path.exists(p):
            try:
                mb = os.path.getsize(p) / (1024 * 1024)
                score += min(5.0, mb * 0.1)
            except Exception:
                pass

        # Completitud de metadatos (BPM, Key, Cover)
        if track.get("bpm") and str(track.get("bpm")) != "--":
            score += 1.5
        if track.get("key") and str(track.get("key")) != "--":
            score += 1.5
        if track.get("cover"):
            score += 1.0

        return round(score, 2)

    @staticmethod
    def evaluar_compatibilidad_antimuddy(track_a: dict, track_b: dict) -> dict:
        """Evalúa la compatibilidad de densidad espectral tri-banda entre dos pistas
        para prevenir mezclas saturadas/embarradas (Anti-Muddy DSP)."""
        if not track_a or not track_b:
            return {"compatible": True, "status": "Unknown", "badge": "N/A", "badge_color": "gray", "detalles": ""}

        low_a = float(track_a.get("low_ratio") or 33.3)
        low_b = float(track_b.get("low_ratio") or 33.3)
        role_a = str(track_a.get("acoustic_role") or "Balanced Full-Range")
        role_b = str(track_b.get("acoustic_role") or "Balanced Full-Range")

        # Alerta de colisión si ambos tracks tienen low_ratio >= 45% (ambos Bass Drivers)
        if low_a >= 45.0 and low_b >= 45.0:
            return {
                "compatible": False,
                "is_collision": True,
                "status": "Muddy Sub-Bass Collision Risk",
                "badge": "⚠️ Colisión Subgrave (30-80 Hz)",
                "badge_color": "bg-red-950/80 text-red-300 border-red-700/80",
                "detalles": f"Ambos temas son Bass Drivers ({low_a}% y {low_b}% en graves). Saturación inminente en 30-80 Hz si se mezclan sin BASS swap total."
            }
        elif (low_a >= 45.0 and role_b in ("Vocal / Lead", "Percussive Tool")) or (low_b >= 45.0 and role_a in ("Vocal / Lead", "Percussive Tool")):
            return {
                "compatible": True,
                "is_collision": False,
                "status": "Complementary Acoustic Pairing",
                "badge": "🟢 Frecuencias Complementarias",
                "badge_color": "bg-emerald-950/80 text-emerald-300 border-emerald-700/80",
                "detalles": f"Emparejamiento perfecto: {role_a} + {role_b}. El balance de graves y medios evita enmascaramiento."
            }
        else:
            return {
                "compatible": True,
                "is_collision": False,
                "status": "Balanced Mix",
                "badge": "🔵 Mezcla Equilibrada",
                "badge_color": "bg-blue-950/80 text-blue-300 border-blue-700/80",
                "detalles": f"Densidad espectral balanceada ({low_a}% vs {low_b}% en graves)."
            }

    def detectar_duplicados_biblioteca(self, tracks: list, proteger_versiones_hermanas: bool = False) -> dict:
        """Agrupa y compara cara a cara duplicados de la biblioteca identificando la versión óptima a conservar."""
        if not tracks or not isinstance(tracks, list):
            return {"total_grupos": 0, "total_duplicados": 0, "espacio_recuperable_mb": 0.0, "grupos": []}

        import collections
        grupos_dict = collections.defaultdict(list)

        for trk in tracks:
            art_raw = trk.get("artist") or trk.get("a") or ""
            tit_raw = trk.get("title") or trk.get("t") or ""
            path_val = trk.get("path") or trk.get("f") or trk.get("filename") or ""

            # Si faltan metadatos, extraer del nombre de archivo
            if not art_raw or not tit_raw:
                f_art, f_tit = self._extraer_artista_titulo_de_ruta(path_val)
                if not art_raw:
                    art_raw = f_art
                if not tit_raw:
                    tit_raw = f_tit

            art_norm = self._normalizar_artista_deduplicacion(art_raw)
            tit_base = TagSanitizerService.extraer_titulo_base(tit_raw)
            tit_norm = self._normalizar_para_deduplicacion(tit_base if tit_base else tit_raw)

            # Clave de agrupación primaria segura: Artista normalizado + Título base nuclear
            # DIFERENTES CANCIONES NUNCA SE AGRUPAN JUNTAS
            if art_norm and tit_norm:
                clave = f"{art_norm}__{tit_norm}"
            elif tit_norm:
                clave = f"tit__{tit_norm}"
            else:
                fname = os.path.splitext(os.path.basename(path_val))[0]
                fname_norm = self._normalizar_para_deduplicacion(fname)
                clave = f"file__{fname_norm}" if fname_norm else f"track_{trk.get('id', id(trk))}"

            grupos_dict[clave].append(trk)

        grupos_resultado = []
        total_duplicados_inferiores = 0
        espacio_recuperable_bytes = 0

        for clave, trks_en_grupo in grupos_dict.items():
            if len(trks_en_grupo) < 2:
                continue

            # Evaluar calidad técnica de cada track del grupo
            trks_evaluados = []
            for t in trks_en_grupo:
                score = self.calcular_puntuacion_calidad_track(t)
                path = t.get("path") or t.get("f") or ""
                size_bytes = 0
                size_mb = 0.0
                if path and os.path.exists(path):
                    try:
                        size_bytes = os.path.getsize(path)
                        size_mb = round(size_bytes / (1024 * 1024), 2)
                    except Exception:
                        pass
                elif t.get("filesize"):
                    size_bytes = int(t["filesize"])
                    size_mb = round(size_bytes / (1024 * 1024), 2)

                t_copy = dict(t)
                t_copy["quality_score"] = round(score, 2)
                t_copy["size_mb"] = size_mb
                t_copy["size_bytes"] = size_bytes

                # Detección inteligente de versión DJ (Extended vs Radio vs Dub vs Remix vs Acapella)
                search_v = f"{t.get('title', '')} {t.get('t', '')} {t.get('filename', '')} {t.get('f', '')} {path}"
                            # Clasificación Acústica de Género y Subgénero (GenreClassifierDSP MIR)
            try:
                bpm_float = float(bpm_val) if bpm_val and str(bpm_val) != "--" else 0.0
                cls_data = GenreClassifierDSP.classify_track(full_path, known_bpm=bpm_float)
                track_genre = cls_data.get("genre", "TECHNO")
                track_subgenre = cls_data.get("subgenre", "Peak Time / Driving")
                track_mood = cls_data.get("mood", "Peak Time Hypnotic")
                track_crate = cls_data.get("crate_path", "")
                track_confidence = cls_data.get("confidence", 85.0)
                track_sig = cls_data.get("signature", {})
            except Exception as e_cls:
                track_genre = "TECHNO"
                track_subgenre = "Peak Time / Driving"
                track_mood = "Peak Time Hypnotic"
                track_crate = "/Music/Serato/Techno/Peak Time / Driving/"
                track_confidence = 75.0
                track_sig = {}

            v_type = TagSanitizerService.extraer_tipo_version(search_v)
            v_key = TagSanitizerService.extraer_clave_version(search_v)
            t_copy["version_type"] = v_type
            t_copy["version_key"] = v_key
            trks_evaluados.append(t_copy)

            # Clasificación y marcado de duplicados (agrupando por clave de versión exacta para proteger remixes distintos)
            por_version = collections.defaultdict(list)
            for t_item in trks_evaluados:
                por_version[t_item["version_key"]].append(t_item)

            duplicados_en_este_grupo = 0
            tiene_hermanas = len(por_version) > 1

            if proteger_versiones_hermanas:
                # Cada versión DJ (Original, Extended, Remix, Dub) tiene su propio ganador
                # NUNCA se elimina un Extended Mix ni un Remix si no hay otra copia duplicada de esa misma versión
                for v_key_item, trks_v in por_version.items():
                    trks_v.sort(key=lambda x: (x["quality_score"], x["size_bytes"]), reverse=True)
                    best_of_type = trks_v[0]
                    best_of_type["is_winner"] = True

                    if v_key_item.startswith("remix_"):
                        remix_name = v_key_item.replace("remix_", "").upper()
                        v_label = f"REMIX {remix_name}" if len(remix_name) <= 12 else "REMIX"
                    elif v_key_item != "standard":
                        v_label = v_key_item.upper()
                    else:
                        v_label = "ORIGINAL"

                    if tiene_hermanas:
                        best_of_type["recommendation"] = f"CONSERVAR (Versión {v_label})"
                        best_of_type["badge_recommendation"] = f"🎧 VERSIÓN {v_label}"
                        best_of_type["badge_color"] = "cyan"
                    else:
                        best_of_type["recommendation"] = "CONSERVAR (Mayor Calidad)"
                        best_of_type["badge_recommendation"] = "★ MEJOR CALIDAD"
                        best_of_type["badge_color"] = "green"
                    best_of_type["delete_selected"] = False

                    # Duplicados reales del MISMO tipo de versión inferior (p. ej. MP3 cuando hay FLAC de esa versión)
                    for inf in trks_v[1:]:
                        inf["is_winner"] = False
                        inf["recommendation"] = f"ELIMINAR (Duplicado Inferior {v_label})"
                        inf["badge_recommendation"] = "🗑️ DUPLICADO INFERIOR"
                        inf["badge_color"] = "red"
                        inf["delete_selected"] = True
                        duplicados_en_este_grupo += 1
                        total_duplicados_inferiores += 1
                        espacio_recuperable_bytes += inf["size_bytes"]

                # Ordenar visualización: conservados primero, luego duplicados para eliminar
                trks_evaluados.sort(key=lambda x: (x["delete_selected"], -x["quality_score"]))
                winner = trks_evaluados[0]
            else:
                # Modo estricto sin protección: sólo 1 único ganador por grupo
                trks_evaluados.sort(key=lambda x: (x["quality_score"], x["size_bytes"]), reverse=True)
                winner = trks_evaluados[0]
                winner["is_winner"] = True
                winner["recommendation"] = "CONSERVAR (Mayor Calidad)"
                winner["badge_recommendation"] = "★ MEJOR CALIDAD"
                winner["badge_color"] = "green"
                winner["delete_selected"] = False

                for inf in trks_evaluados[1:]:
                    inf["is_winner"] = False
                    inf["recommendation"] = "ELIMINAR (Duplicado Inferior)"
                    inf["badge_recommendation"] = "🗑️ DUPLICADO INFERIOR"
                    inf["badge_color"] = "red"
                    inf["delete_selected"] = True
                    duplicados_en_este_grupo += 1
                    total_duplicados_inferiores += 1
                    espacio_recuperable_bytes += inf["size_bytes"]

            display_artist = winner.get('artist') or ''
            raw_t = winner.get('title') or winner.get('filename') or ''
            clean_display_title = TagSanitizerService.extraer_titulo_base(raw_t) or raw_t
            display_name = f"{display_artist} - {clean_display_title}" if display_artist else clean_display_title

            grupos_resultado.append({
                "clave": clave,
                "display_name": display_name,
                "total_versiones": len(trks_evaluados),
                "tiene_versiones_hermanas": tiene_hermanas,
                "duplicados_a_eliminar": duplicados_en_este_grupo,
                "winner": winner,
                "tracks": trks_evaluados
            })

        # Priorizar grupos que contienen duplicados reales a eliminar
        grupos_resultado.sort(key=lambda g: (-g["duplicados_a_eliminar"], g["display_name"]))

        return {
            "total_grupos": len(grupos_resultado),
            "total_duplicados": total_duplicados_inferiores,
            "espacio_recuperable_mb": round(espacio_recuperable_bytes / (1024 * 1024), 2),
            "grupos": grupos_resultado
        }

    def eliminar_pistas_disco(self, paths: list, permanente: bool = False) -> dict:
        """Elimina de forma segura del almacenamiento local pistas seleccionadas (o las traslada a la Papelera de macOS)."""
        if not paths or not isinstance(paths, list):
            return {"status": "error", "msg": "Lista de rutas vacía", "eliminados": 0, "errores": []}

        extensiones_validas = {".mp3", ".flac", ".wav", ".aiff", ".aif", ".m4a", ".aac", ".ogg"}
        rutas_sistema = [
            '/etc', '/usr', '/bin', '/sbin', '/System',
            '/Library/Keychains', '/private/etc',
            os.path.expanduser('~/.ssh'), os.path.expanduser('~/.gnupg')
        ]

        trash_dir = os.path.expanduser("~/.Trash")
        tiene_trash = os.path.isdir(trash_dir) and os.access(trash_dir, os.W_OK)

        eliminados = 0
        errores = []
        paths_eliminados = []

        for p in paths:
            if not p:
                continue
            real_path = p
            if not os.path.exists(real_path) and self.directorio_actual:
                cand = os.path.join(self.directorio_actual, os.path.basename(p))
                if os.path.exists(cand):
                    real_path = cand

            if not os.path.exists(real_path) or not os.path.isfile(real_path):
                errores.append(f"Archivo no encontrado: {p}")
                continue

            real_abs = os.path.realpath(real_path)
            ext = os.path.splitext(real_abs)[1].lower()

            # Seguridad: solo permitir eliminar archivos con extensiones de audio y fuera de rutas críticas de sistema
            if ext not in extensiones_validas:
                errores.append(f"Denegado (no es un archivo de audio válido): {os.path.basename(real_abs)}")
                continue

            if any(real_abs.startswith(r) for r in rutas_sistema):
                errores.append(f"Denegado (ruta protegida de sistema): {os.path.basename(real_abs)}")
                continue

            try:
                if not permanente:
                    # Intento 1: AppleScript vía Finder (Papelera nativa de macOS)
                    script_lines = [
                        "on run argv",
                        "  tell application \"Finder\" to delete POSIX file (item 1 of argv)",
                        "end run",
                    ]
                    osa_script = "\n".join(script_lines)
                    res_proc = subprocess.run(
                        ["osascript", "-e", osa_script, real_abs],
                        capture_output=True,
                        text=True,
                        timeout=6
                    )
                    if res_proc.returncode == 0:
                        eliminados += 1
                        paths_eliminados.append(real_abs)
                        continue

                    # Intento 2: Mover directamente a ~/.Trash
                    if tiene_trash:
                        base_name = os.path.basename(real_abs)
                        dest_path = os.path.join(trash_dir, base_name)
                        if os.path.exists(dest_path):
                            name_root, name_ext = os.path.splitext(base_name)
                            dest_path = os.path.join(trash_dir, f"{name_root}_{int(time.time()*1000)}{name_ext}")
                        shutil.move(real_abs, dest_path)
                        eliminados += 1
                        paths_eliminados.append(real_abs)
                        continue

                # Borrado permanente directo con os.remove
                os.remove(real_abs)
                eliminados += 1
                paths_eliminados.append(real_abs)

            except Exception as e:
                errores.append(f"No se pudo eliminar {os.path.basename(real_abs)}: {e}")

        return {
            "status": "ok" if eliminados > 0 or len(errores) == 0 else "error",
            "eliminados": eliminados,
            "paths_eliminados": paths_eliminados,
            "errores": errores,
            "mensaje": f"{eliminados} pista(s) trasladada(s) a la Papelera de reciclaje." if not permanente else f"{eliminados} pista(s) eliminada(s) definitivamente del disco."
        }

    def eliminar_pistas_duplicadas(self, paths: list) -> dict:
        """Elimina de forma segura del almacenamiento local las pistas duplicadas seleccionadas."""
        return self.eliminar_pistas_disco(paths, permanente=False)
