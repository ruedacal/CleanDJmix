import os
import csv
import numpy as np
import soundfile as sf
import librosa
from typing import Dict, Any, List, Optional, Callable
from concurrent.futures import ProcessPoolExecutor, as_completed
from mutagen.easyid3 import EasyID3
from mutagen.mp3 import MP3

NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

def estimar_tonalidad(y: np.ndarray, sr: int) -> str:
    """Calcula la tonalidad musical (Key) usando perfiles de cromagrama armónico."""
    try:
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        chroma_mean = np.mean(chroma, axis=1)
        idx_max = int(np.argmax(chroma_mean))
        return NOTAS[idx_max]
    except Exception:
        return ""

def procesar_archivo_audio(ruta_archivo: str) -> Optional[Dict[str, Any]]:
    """Función de trabajo aislada para ejecución concurrente."""
    if not os.path.isfile(ruta_archivo) or not ruta_archivo.lower().endswith(".mp3"):
        return None

    resultado = {
        "ruta": ruta_archivo,
        "nombre_archivo": os.path.basename(ruta_archivo),
        "artista": "Desconocido",
        "titulo": "Desconocido",
        "album": "Desconocido",
        "duracion": "0:00",
        "frecuencia": 44100,
        "bpm": 0.0,
        "key": ""
    }

    # 1. Extracción de Metadatos ID3 rápidos
    try:
        audio_info = MP3(ruta_archivo)
        duracion_seg = audio_info.info.length
        minutos = int(duracion_seg // 60)
        segundos = int(duracion_seg % 60)
        resultado["duracion"] = f"{minutos}:{segundos:02d}"
        resultado["frecuencia"] = audio_info.info.sample_rate

        tags = EasyID3(ruta_archivo)
        resultado["artista"] = tags.get('artist', ['Desconocido'])[0]
        resultado["titulo"] = tags.get('title', ['Desconocido'])[0]
        resultado["album"] = tags.get('album', ['Desconocido'])[0]
    except Exception:
        pass

    # 2. Análisis Espectral (BPM y Key) optimizado con ventana de audio
    try:
        # Cargar segmento de 60s central para máxima velocidad y precisión
        y, sr = librosa.load(ruta_archivo, sr=22050, mono=True, duration=60.0, offset=30.0)
        
        # Detección de BPM
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        bpm_val = float(tempo[0] if isinstance(tempo, (np.ndarray, list)) else tempo)
        resultado["bpm"] = round(bpm_val, 1)

        # Detección de Tonalidad
        resultado["key"] = estimar_tonalidad(y, sr)
    except Exception:
        pass

    return resultado


class AudioAnalysisService:
    """Servicio de orquestación para análisis masivo de bibliotecas de audio."""

    def __init__(self, max_workers: int = 4):
        self.max_workers = max_workers

    def escanear_directorio(
        self, 
        directorio_raiz: str, 
        subcarpetas: Optional[List[str]] = None,
        callback_progreso: Optional[Callable[[int, int, str], None]] = None
    ) -> List[Dict[str, Any]]:
        
        archivos_a_procesar = []
        carpetas = subcarpetas if subcarpetas else [""]

        for sub in carpetas:
            ruta_dir = os.path.join(directorio_raiz, sub) if sub else directorio_raiz
            if not os.path.exists(ruta_dir):
                continue
            for root, _, files in os.walk(ruta_dir):
                for f in files:
                    if f.lower().endswith(".mp3"):
                        archivos_a_procesar.append(os.path.join(root, f))

        total = len(archivos_a_procesar)
        resultados = []

        if total == 0:
            return resultados

        with ProcessPoolExecutor(max_workers=self.max_workers) as executor:
            futuros = {executor.submit(procesar_archivo_audio, path): path for path in archivos_a_procesar}
            completados = 0
            for future in as_completed(futuros):
                completados += 1
                try:
                    res = future.result()
                    if res:
                        resultados.append(res)
                        if callback_progreso:
                            callback_progreso(completados, total, res["nombre_archivo"])
                except Exception:
                    pass

        return resultados

    def exportar_csv(self, resultados: List[Dict[str, Any]], ruta_salida_csv: str) -> bool:
        if not resultados:
            return False
        try:
            campos = ["nombre_archivo", "artista", "titulo", "album", "duracion", "frecuencia", "bpm", "key", "ruta"]
            with open(ruta_salida_csv, mode="w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=campos)
                writer.writeheader()
                for r in resultados:
                    writer.writerow(r)
            return True
        except Exception as e:
            print(f"[AnalysisService CSV Error] {e}")
            return False
