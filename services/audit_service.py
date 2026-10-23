import os
import subprocess
import threading
import numpy as np
import soundfile as sf
from infrastructure.audio_processor import AudioProcessorService

class AuditService:
    def __init__(self):
        self.directorio_actual = ""
        self._lock = threading.Lock()

    def seleccionar_directorio(self):
        with self._lock:
            try:
                # Script optimizado para forzar foco inmediato en macOS sin latencia de WindowServer
                ascript = '''
                tell application "System Events"
                    activate
                    set folderPath to POSIX path of (choose folder with prompt "Selecciona tu carpeta de música DJ")
                end tell
                return folderPath
                '''
                proc = subprocess.run(["osascript", "-e", ascript], capture_output=True, text=True, timeout=60)
                if proc.returncode == 0:
                    res = proc.stdout.strip()
                    if res and os.path.isdir(res):
                        self.directorio_actual = res
                        return res
            except Exception as e:
                print(f"[AUDIT] Diálogo cancelado o error: {e}")
            return ""

    def iniciar_auditoria(self, ruta_directorio, emitir_log_cb=None):
        if not ruta_directorio or not os.path.exists(ruta_directorio):
            return {"total": 0, "sin_meta": 0, "tracks": []}
        
        self.directorio_actual = ruta_directorio
        if emitir_log_cb:
            emitir_log_cb(f"Iniciando auditoría en: {ruta_directorio}")
        
        tracks_auditados = []
        extensiones = (".flac", ".mp3", ".wav", ".aiff", ".m4a")
        idx = 1
        sin_meta_count = 0

        for root, _, files in os.walk(ruta_directorio):
            for file in sorted(files):
                if file.startswith(".") or not file.lower().endswith(extensiones):
                    continue
                full_path = os.path.join(root, file)
                info = AudioProcessorService.analizar_track_avanzado(full_path)
                if info.get("missing_meta", False):
                    sin_meta_count += 1
                
                tracks_auditados.append({
                    "id": idx, "f": str(file or ""), "path": str(full_path or ""),
                    "t": str(info.get("title") or file or ""), "a": str(info.get("artist") or "Desconocido"),
                    "b": float(info.get("bpm") or 124.0), "k": str(info.get("key") or "8A"),
                    "e": int(info.get("energy") or 75), "duration": str(info.get("duration") or "5:00"),
                    "format": str(info.get("format") or "FLAC"), "s": "Ready"
                })
                idx += 1
                if len(tracks_auditados) >= 2500:
                    break

        return {"total": len(tracks_auditados), "sin_meta": sin_meta_count, "tracks": tracks_auditados}

    def analizar_espectro_fft(self, filepath):
        try:
            fs = 44100
            data, samplerate = sf.read(filepath, start=fs * 30, frames=fs * 10)
            if len(data.shape) > 1:
                data = data.mean(axis=1)
            yf, xf = np.fft.rfft(data), np.fft.rfftfreq(len(data), 1 / samplerate)
            mag = np.where(np.abs(yf) > 0, np.abs(yf), 1e-10)
            mag_db = 20 * np.log10(mag)
            frecuencias_validas = xf[mag_db > (np.max(mag_db) - 80)]
            cutoff_khz = (np.max(frecuencias_validas) if len(frecuencias_validas) > 0 else 0) / 1000.0
            estado = "True Lossless" if cutoff_khz >= 20.0 else "Falso FLAC"
            perdida = 0 if estado == "True Lossless" else max(0, round((1.0 - (cutoff_khz / 22.05)) * 100, 1))
            return {"estado": estado, "corte": f"{cutoff_khz:.1f} kHz", "perdida": perdida}
        except Exception as e:
            return {"estado": "Error I/O", "corte": "N/A", "perdida": 0}
