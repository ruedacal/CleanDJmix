"""
Módulo de Infraestructura: Adaptadores para mutagen, Shazam, Discogs, 
Librosa, exportación CSV y spotDL desacoplado con pre-escaneo selectivo.
"""

import os
import asyncio
import csv
import logging
import requests
from mutagen.easyid3 import EasyID3
from mutagen import File as MutagenFile
from shazamio import Shazam
import librosa
import numpy as np

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
    """Adaptador spotDL con pre-escaneo de metadatos y descarga selectiva."""

    @staticmethod
    def obtener_instancia(directorio_salida: str):
        from spotdl import Spotdl
        return Spotdl(
            client_id=None,
            client_secret=None,
            downloader_settings={
                "output": os.path.join(directorio_salida, "{artist} - {title}.{output-ext}"),
                "format": "mp3",
                "bitrate": "320k"
            }
        )

    @staticmethod
    def escanear_lista(spotify_url: str, callback_log=None) -> list:
        """Obtiene las canciones de la URL de Spotify sin descargarlas."""
        try:
            from spotdl import Spotdl
            spotdl_inst = Spotdl(client_id=None, client_secret=None)
            if callback_log:
                callback_log(f"[SpotDL] Buscando canciones y metadatos para: {spotify_url}...")
            
            songs = spotdl_inst.search([spotify_url])
            lista_info = []
            for s in songs:
                dur_seg = int(getattr(s, 'duration', 0) or 0)
                dur_str = f"{dur_seg // 60:02d}:{dur_seg % 60:02d}"
                lista_info.append({
                    "song_obj": s,
                    "titulo": getattr(s, 'name', 'Desconocido'),
                    "artista": getattr(s, 'artist', 'Desconocido'),
                    "album": getattr(s, 'album_name', 'Single / Desconocido'),
                    "duracion": dur_str,
                    "cover_url": getattr(s, 'cover_url', '')
                })
            return lista_info
        except Exception as e:
            if callback_log:
                callback_log(f"[SpotDL] Error al escanear: {str(e)}", "error")
            return []

    @staticmethod
    def descargar_canciones_seleccionadas(songs_list: list, directorio_salida: str, callback_log=None) -> list:
        """Descarga únicamente los objetos de canciones pasados en songs_list."""
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
