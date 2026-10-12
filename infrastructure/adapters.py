import os
import re
import asyncio
import requests
import librosa
import numpy as np
import soundfile as sf
from mutagen.easyid3 import EasyID3
import mutagen.id3
from shazamio import Shazam
from domain.models import TrackDomain

DISCOGS_TOKEN = "oCKSbtPTEZswVFlXCvKLkHxAVAIpauwnnJZUERVD"
CARPETAS_DESTINO = ["Techno", "Tech House", "Remember", "Cantaditas", "Trance", "House", "Revision_Manual"]
DEV_CONTACT = "rueda.v@gmail.com"

class AudioAdapter:
    @staticmethod
    def obtener_metadatos_id3(ruta_completa, nombre_archivo):
        artista, titulo = "", ""
        try:
            tags = EasyID3(ruta_completa)
            artista = tags.get('artist', [''])[0]
            titulo = tags.get('title', [''])[0]
        except:
            pass

        artista = TrackDomain.limpiar_texto(artista)
        titulo = TrackDomain.limpiar_texto(titulo)
        nombre_limpio = TrackDomain.limpiar_texto(nombre_archivo)

        if re.search(r'(?i)future trance|compilation|vol\.|album|mix cd', nombre_limpio):
            if not artista: artista = "Various Artists"
            if not titulo: titulo = nombre_limpio
            return artista, titulo

        if not artista or not titulo:
            if '-' in nombre_limpio:
                partes = nombre_limpio.split('-', 1)
                if not artista: artista = partes[0].strip()
                if not titulo: titulo = partes[1].strip()
            else:
                if not titulo: titulo = nombre_limpio.strip()
                
        if not artista: artista = "VRC_MISSING"
        if not titulo: titulo = "VRC_MISSING"
                
        return artista, titulo

    @staticmethod
    def rescate_shazam(ruta_archivo):
        async def _reconocer():
            shazam = Shazam()
            return await shazam.recognize_song(ruta_archivo)
        
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            resultado = loop.run_until_complete(_reconocer())
            loop.close()
            
            if 'track' in resultado and resultado['track']:
                artista = resultado['track'].get('subtitle', '')
                titulo = resultado['track'].get('title', '')
                return TrackDomain.limpiar_texto(artista), TrackDomain.limpiar_texto(titulo)
        except Exception:
            pass
        return "VRC_MISSING", "VRC_MISSING"

    @staticmethod
    def buscar_discogs(artista, titulo):
        if artista == "VRC_MISSING" and titulo == "VRC_MISSING":
            return 2026, [], "VRC_Unidentified", "Track"

        query = f"{artista} {titulo}".replace(" ", "+").replace("VRC_MISSING", "")
        url = f"https://api.discogs.com/database/search?q={query}&type=release&token={DISCOGS_TOKEN}"
        
        try:
            respuesta = requests.get(url, headers={"User-Agent": "CleanDJmix/2.2"}, timeout=5)
            if respuesta.status_code == 200 and respuesta.json().get('results'):
                res = respuesta.json()['results'][0]
                año = int(res.get('year', 2026)) if str(res.get('year', '')).isdigit() else 2026
                estilos = [e.lower() for e in res.get('style', [])]
                titulo_completo = res.get('title', '')
                
                if " - " in titulo_completo:
                    partes = titulo_completo.split(" - ", 1)
                    art_descubierto = re.sub(r'\s\(\d+\)$', '', partes[0].strip())
                    tit_descubierto = partes[1].strip()
                    if "various" not in art_descubierto.lower():
                        artista = art_descubierto
                    titulo = tit_descubierto
                    
                return año, estilos, artista, titulo
        except:
            pass
        return 2026, [], artista, titulo

    @staticmethod
    def analizar_acustica(ruta_completa):
        y, sr = librosa.load(ruta_completa, sr=44100, duration=60.0)
        y_trimmed, indices = librosa.effects.trim(y, top_db=40)
        silencio_ms = round((indices[0] / sr) * 1000)
        if silencio_ms > 40:
            y_full, sr_full = librosa.load(ruta_completa, sr=None)
            y_full_trimmed, _ = librosa.effects.trim(y_full, top_db=40)
            sf.write(ruta_completa, y_full_trimmed, sr_full)
            y = y_trimmed

        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        bpm = round(tempo[0], 2) if isinstance(tempo, (list, np.ndarray)) else round(tempo, 2)
        energia = min(100, max(0, int((np.mean(librosa.feature.rms(y=y)) / 0.35) * 100)))
        
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        groove = min(100, max(0, int(((np.var(onset_env) / np.mean(onset_env)) / 5.0) * 100))) if np.mean(onset_env) > 0 else 0
        
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        presencia_vocal = np.mean(np.var(mfcc[1:13], axis=1))
        zcr = np.mean(librosa.feature.zero_crossing_rate(y))
        centroide = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
        
        return bpm, energia, groove, presencia_vocal, zcr, centroide

    @staticmethod
    def actualizar_fichero(ruta_completa, artista, titulo, año, bpm, modo_seguro=False):
        if not modo_seguro:
            try:
                try: tags = EasyID3(ruta_completa)
                except:
                    tags = mutagen.File(ruta_completa, easy=True)
                    if tags is None:
                        tags = mutagen.File(ruta_completa)
                        tags.add_tags()
                        tags = EasyID3(ruta_completa)
                tags['artist'] = artista
                tags['title'] = titulo
                tags['date'] = str(año)
                tags['bpm'] = str(int(bpm))
                tags.save(ruta_completa)
            except: pass

        if "VRC_Unidentified" in artista or "VRC_MISSING" in artista:
            nombre = f"VRC_Unidentified_Track_{int(bpm)}BPM.mp3"
        else:
            nombre = f"{artista} - {titulo}.mp3"
            if nombre.startswith("VRC_MISSING - "): nombre = f"{titulo}.mp3"
        return re.sub(r'[\\/*?:"<>|]', "", nombre)
