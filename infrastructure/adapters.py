"""
Módulo de Infraestructura: Adaptadores para mutagen, Shazam, Discogs, 
Librosa, exportación CSV y spotDL con saneamiento de URLs internacionales.
"""

import os
import re
import asyncio
import csv
import logging
import requests
from mutagen.easyid3 import EasyID3
from mutagen import File as MutagenFile
from shazamio import Shazam
import librosa
import numpy as np
from dotenv import load_dotenv

load_dotenv()

if os.getenv("SPOTIPY_CLIENT_ID"):
    os.environ["SPOTIPY_CLIENT_ID"] = os.getenv("SPOTIPY_CLIENT_ID")
if os.getenv("SPOTIPY_CLIENT_SECRET"):
    os.environ["SPOTIPY_CLIENT_SECRET"] = os.getenv("SPOTIPY_CLIENT_SECRET")
if os.getenv("SPOTIPY_REDIRECT_URI"):
    os.environ["SPOTIPY_REDIRECT_URI"] = os.getenv("SPOTIPY_REDIRECT_URI")


class AudioAdapter:
    @staticmethod
    def obtener_metadatos_id3(ruta_completa: str, nombre_archivo: str) -> tuple:
        try:
            audio = EasyID3(ruta_completa)
            artista = audio.get('artist', ['VRC_MISSING'])[0]
            titulo = audio.get('title', ['VRC_MISSING'])[0]
            return artista, titulo
        except Exception:
            if " - " in nombre_archivo:
                partes = nombre_archivo.replace('.mp3', '').split(' - ', 1)
                return partes[0].strip(), partes[1].strip()
            elif "Future Trance" in nombre_archivo:
                return "Various Artists", nombre_archivo.replace('.mp3', '')
            return "VRC_MISSING", "VRC_MISSING"

    @staticmethod
    def buscar_discogs(artista: str, titulo: str) -> tuple:
        try:
            url = f"https://api.discogs.com/database/search?q={artista} - {titulo}&type=release"
            headers = {'User-Agent': 'CleanDJmixPRO/3.0'}
            response = requests.get(url, headers=headers, timeout=3)
            if response.status_code == 200:
                data = response.json()
                if data.get('results'):
                    item = data['results'][0]
                    año = int(item.get('year', 2026))
                    estilos = [s.lower() for s in item.get('style', [])]
                    titulo_completo = item.get('title', f"{artista} - {titulo}")
                    if " - " in titulo_completo:
                        art_res, tit_res = titulo_completo.split(" - ", 1)
                        return año, estilos, art_res.strip(), tit_res.strip()
                    return año, estilos, artista, titulo
        except Exception:
            pass
        return 2026, [], artista, titulo

    @staticmethod
    def analizar_acustica(ruta_completa: str) -> tuple:
        try:
            y, sr = librosa.load(ruta_completa, duration=30)
            y_trimmed, _ = librosa.effects.trim(y, top_db=20)
            
            tempo, beats = librosa.beat.beat_track(y=y_trimmed, sr=sr)
            bpm = float(tempo[0]) if isinstance(tempo, np.ndarray) else float(tempo)
            
            rms = librosa.feature.rms(y=y_trimmed)
            energia = int(np.mean(rms) * 1000)
            
            onset_env = librosa.onset.onset_strength(y=y_trimmed, sr=sr)
            groove = int(np.std(onset_env) * 100)
            
            mfcc = librosa.feature.mfcc(y=y_trimmed, sr=sr, n_mfcc=13)
            presencia_vocal = float(np.mean(mfcc))
            
            zcr = float(np.mean(librosa.feature.zero_crossing_rate(y_trimmed)))
            centroide = float(np.mean(librosa.feature.spectral_centroid(y=y_trimmed, sr=sr)))
            
            return bpm, energia, groove, presencia_vocal, zcr, centroide
        except Exception:
            return 128.0, 50, 20, 1000.0, 0.05, 1500.0

    @staticmethod
    def rescate_shazam(ruta_completa: str) -> tuple:
        async def _shazam_coro():
            shazam = Shazam()
            out = await shazam.recognize_song(ruta_completa)
            track = out.get('track', {})
            subtitle = track.get('subtitle', 'VRC_MISSING')
            title = track.get('title', 'VRC_MISSING')
            return subtitle, title

        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            art, tit = loop.run_until_complete(_shazam_coro())
            return art, tit
        except Exception:
            return "VRC_MISSING", "VRC_MISSING"

    @staticmethod
    def actualizar_fichero(ruta_completa: str, artista: str, titulo: str, año: int, bpm: int, modo_seguro: bool) -> str:
        nombre_limpio = f"{artista} - {titulo}.mp3"
        if artista == "VRC_MISSING" or titulo == "VRC_MISSING":
            nombre_limpio = f"VRC_Unidentified_Track_{int(bpm)}BPM.mp3"
        
        nombre_limpio = "".join(c for c in nombre_limpio if c.isalnum() or c in (' ', '-', '_', '.')).strip()
        
        if not modo_seguro:
            try:
                audio = MutagenFile(ruta_completa, easy=True)
                if audio is not None:
                    audio['artist'] = [artista]
                    audio['title'] = [titulo]
                    audio['date'] = [str(año)]
                    audio.save()
            except Exception:
                pass
        return nombre_limpio

    @staticmethod
    def exportar_informe_csv(resultados: list, ruta_destino: str):
        archivo_csv = os.path.join(ruta_destino, "cleandjmix_report.csv")
        try:
            with open(archivo_csv, mode='w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(["Artista", "Titulo", "BPM", "Año", "Genero", "Subgenero", "Ruta Final"])
                for r in resultados:
                    writer.writerow([r['artista'], r['titulo'], r['bpm'], r['anio'], r['genero'], r['subgenero'], r['ruta_final']])
            return archivo_csv
        except Exception:
            return None


class SpotDLAdapter:
    """Adaptador spotDL con pre-escaneo y compatibilidad universal de URLs de Spotify."""

    @staticmethod
    def _limpiar_url(url: str) -> str:
        url = url.strip()
        # Si se pegaron múltiples URLs concatenadas, tomar la primera
        if "https://" in url:
            partes = [p for p in url.split("https://") if p]
            url = "https://" + partes[0]
        
        # Eliminar query params (?si=...)
        url = url.split("?")[0]
        
        # Eliminar prefijos de localización como /intl-es/, /intl-de/, etc.
        url = re.sub(r'open\.spotify\.com/intl-[a-zA-Z-]+/', 'open.spotify.com/', url)
        return url

    @staticmethod
    def obtener_instancia(directorio_salida: str = None):
        from spotdl import Spotdl
        cid = os.getenv("SPOTIPY_CLIENT_ID")
        csec = os.getenv("SPOTIPY_CLIENT_SECRET")
        
        downloader_settings = None
        if directorio_salida:
            downloader_settings = {
                "output": os.path.join(directorio_salida, "{artist} - {title}.{output-ext}"),
                "format": "mp3",
                "bitrate": "320k"
            }

        return Spotdl(
            client_id=cid,
            client_secret=csec,
            downloader_settings=downloader_settings
        )

    @staticmethod
    def escanear_lista(spotify_url: str, callback_log=None) -> list:
        try:
            from spotdl import Spotdl
            url_limpia = SpotDLAdapter._limpiar_url(spotify_url)
            cid = os.getenv("SPOTIPY_CLIENT_ID")
            csec = os.getenv("SPOTIPY_CLIENT_SECRET")

            spotdl_inst = Spotdl(client_id=cid, client_secret=csec)
            
            if callback_log:
                callback_log(f"[SpotDL] Buscando catálogo para: {url_limpia}...")
            
            songs = spotdl_inst.search([url_limpia])
            lista_info = []
            for s in songs:
                dur_seg = int(getattr(s, 'duration', 0) or 0)
                dur_str = f"{dur_seg // 60:02d}:{dur_seg % 60:02d}"
                nombre = getattr(s, 'name', None) or 'Desconocido'
                artista = getattr(s, 'artist', None) or 'Desconocido'
                album = getattr(s, 'album_name', None) or 'Single / Desconocido'
                cover = getattr(s, 'cover_url', None) or ''
                
                lista_info.append({
                    "song_obj": s,
                    "titulo": nombre,
                    "artista": artista,
                    "album": album,
                    "duracion": dur_str,
                    "cover_url": cover
                })
            return lista_info
        except Exception as e:
            if callback_log:
                callback_log(f"[SpotDL] Error al escanear: {str(e)}", "error")
            return []

    @staticmethod
    def descargar_canciones_seleccionadas(songs_list: list, directorio_salida: str, callback_log=None) -> list:
        os.makedirs(directorio_salida, exist_ok=True)
        archivos_antes = set(os.listdir(directorio_salida))

        try:
            spotdl_inst = SpotDLAdapter.obtener_instancia(directorio_salida)
            if callback_log:
                callback_log(f"[SpotDL] Iniciando descarga de {len(songs_list)} pista(s) seleccionada(s)...")

            spotdl_inst.download_songs(songs_list)

            archivos_despues = set(os.listdir(directorio_salida))
            nuevos = [
                os.path.join(directorio_salida, f)
                for f in (archivos_despues - archivos_antes)
                if f.lower().endswith(".mp3")
            ]

            if callback_log:
                callback_log(f"[SpotDL] Descarga completada: {len(nuevos)} archivo(s) generado(s).", "success")

            return nuevos
        except Exception as e:
            if callback_log:
                callback_log(f"[SpotDL] Error en la descarga: {str(e)}", "error")
            return []
