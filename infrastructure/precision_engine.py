import os
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from pydub import AudioSegment

class TruthEngineService:
    def __init__(self):
        # Utilizamos la misma lógica de entorno de tu spotify_adapter original
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
        if self.client_id and self.client_secret:
            auth_manager = SpotifyClientCredentials(client_id=self.client_id, client_secret=self.client_secret)
            self.sp = spotipy.Spotify(auth_manager=auth_manager)
        else:
            self.sp = None

    def obtener_metadatos_exactos(self, track_id: str) -> dict:
        """Extrae la verdad algorítmica directamente desde la base de datos de Spotify."""
        if not self.sp:
            return {"status": "error", "error": "Credenciales de Spotify no configuradas."}
            
        try:
            # 1. Llamadas paralelas a los endpoints de alta precisión
            features = self.sp.audio_features(tracks=[track_id])[0]
            track_info = self.sp.track(track_id)
            artista_info = self.sp.artist(track_info['artists'][0]['id'])
            analysis = self.sp.audio_analysis(track_id)

            # 2. Extracción de Bailabilidad, Energía y Mood (Valence)
            danceability = round(features['danceability'] * 100, 1)
            energy = round(features['energy'] * 100, 1)
            valence = features['valence']
            bpm = round(features['tempo'], 2)
            
            # Mood deducido matemáticamente por el Valence (positividad de la pista)
            mood = "Melancólico / Deep" if valence < 0.4 else ("Eufórico / Peak" if valence > 0.7 else "Driving / Groove")
            
            # Mapeo de subgéneros (Everynoise/Iskur)
            generos = artista_info.get('genres', [])
            
            # 3. Generación de Smart DJ Comment
            dj_comment = f"[{mood}] Eng: {energy}% | Dnc: {danceability}%. "
            if energy > 80 and danceability > 75:
                dj_comment += "Rompe-pistas, ideal para clímax o Peak Time. "
            elif energy < 60:
                dj_comment += "Atmosférico, perfecto para warm-up o layering. "
                
            # 4. Extracción de la estructura (Grid y CUEs) de Spotify Analysis
            cues = []
            if analysis.get('beats'):
                primer_beat_ms = float(analysis['beats'][0]['start']) * 1000
                cues.append({"name": "Grid Start", "time_ms": primer_beat_ms, "color": "white"})
                
            for sec in analysis.get('sections', []):
                start_ms = float(sec['start']) * 1000
                if 30000 < start_ms < 90000 and len(cues) < 2:
                    cues.append({"name": "Mix In", "time_ms": start_ms, "color": "blue"})
                elif sec['loudness'] > -5.0 and len(cues) < 3:
                    cues.append({"name": "Main Drop", "time_ms": start_ms, "color": "red"})

            return {
                "status": "ok",
                "bpm": bpm,
                "danceability": danceability,
                "energy": energy,
                "mood": mood,
                "genres": generos,
                "dj_comment": dj_comment.strip(),
                "cues": cues,
                "first_beat_ms_original": primer_beat_ms if 'primer_beat_ms' in locals() else 0
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    @staticmethod
    def ajustar_grid_y_recortar(ruta_archivo: str, first_beat_ms: float, umbral_db: float = -45.0):
        """Recorta silencios físicos y recalcula el offset del Beatgrid."""
        try:
            audio = AudioSegment.from_file(ruta_archivo)
            
            # Buscar el primer frame con sonido real
            inicio_ms = 0
            for ms in range(0, len(audio), 10):
                if audio[ms:ms+10].dBFS > umbral_db:
                    inicio_ms = ms
                    break
                    
            fin_ms = len(audio)
            for ms in range(len(audio)-1, 0, -10):
                if audio[ms-10:ms].dBFS > umbral_db:
                    fin_ms = ms
                    break
                    
            # Exportar archivo limpio
            audio_limpio = audio[inicio_ms:fin_ms]
            ruta_limpia = ruta_archivo.replace(".mp3", "_ready.mp3").replace(".wav", "_ready.wav")
            audio_limpio.export(ruta_limpia, format=ruta_archivo[-3:])
            
            # El nuevo grid offset se desplaza restando el silencio eliminado
            nuevo_grid_ms = max(0.0, first_beat_ms - inicio_ms)
            
            return {
                "status": "ok",
                "ruta_final": ruta_limpia,
                "ms_recortados": inicio_ms,
                "nuevo_grid_offset_ms": nuevo_grid_ms
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
