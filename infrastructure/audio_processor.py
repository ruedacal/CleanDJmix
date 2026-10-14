import librosa
import numpy as np
from pydub import AudioSegment

class AudioProcessorService:
    @staticmethod
    def limpiar_silencios(ruta_archivo, umbral_db=-50.0):
        try:
            audio = AudioSegment.from_file(ruta_archivo)
            inicio_ms = next((ms for ms in range(0, len(audio), 10) if audio[ms:ms+10].dBFS > umbral_db), 0)
            fin_ms = next((ms for ms in range(len(audio)-1, 0, -10) if audio[ms-10:ms].dBFS > umbral_db), len(audio))
            ruta_limpia = ruta_archivo.replace(".mp3", "_cleaned.mp3").replace(".wav", "_cleaned.wav")
            audio[inicio_ms:fin_ms].export(ruta_limpia, format=ruta_archivo[-3:])
            return {"status": "ok", "ruta": ruta_limpia, "recorte_ms": inicio_ms + (len(audio) - fin_ms)}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    @staticmethod
    def analizar_track_avanzado(ruta_archivo, key_actual="--"):
        try:
            y, sr = librosa.load(ruta_archivo, sr=None, duration=120)
            onset_env = librosa.onset.onset_strength(y=y, sr=sr)
            tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
            bpm = round(float(tempo[0] if isinstance(tempo, np.ndarray) else tempo), 2)
            
            beat_strength = np.var(onset_env)
            danceability = min(100, max(0, int((beat_strength / 10.0) * 100)))
            centroide = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
            
            mood = "Oscuro / Contundente" if centroide < 2500 and bpm > 132 else "Groovy / Hipnótico"
            if bpm > 140: mood = "Agresivo / Peak Time"
            elif bpm < 125: mood = "Deep / Melancólico" if centroide < 2500 else "Uplifting / Warm-up"

            comment = f"[{mood}] "
            if bpm > 138: comment += "Track de alta energía, clímax. "
            elif bpm < 126: comment += "Inicio de sesión o transición. "
            else: comment += "Herramienta driving. "
            if danceability > 80: comment += "Rompe pistas (graves sólidos)."
            elif danceability < 50: comment += "Pista compleja (layering)."

            return {"status": "ok", "danceability": danceability, "mood": mood, "dj_comment": comment}
        except Exception as e:
            return {"status": "error", "error": str(e)}
