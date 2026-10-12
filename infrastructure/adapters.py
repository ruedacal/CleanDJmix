"""
Módulo de Infraestructura: Adaptadores para mutagen, Shazam, Discogs, 
Librosa, exportación CSV, descarga directa de audio con Spotify API + yt-dlp,
inyección estricta de carátulas ID3v2.3 y soporte de preescucha preview_url.
"""

import os
import re
import io
import asyncio
import csv
import logging
import requests
from mutagen.easyid3 import EasyID3
from mutagen import File as MutagenFile
from mutagen.id3 import ID3, APIC, ID3NoHeaderError
from shazamio import Shazam
import librosa
import numpy as np
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

SPOTIPY_CLIENT_ID = os.getenv("SPOTIPY_CLIENT_ID")
SPOTIPY_CLIENT_SECRET = os.getenv("SPOTIPY_CLIENT_SECRET")
SPOTIPY_REDIRECT_URI = os.getenv("SPOTIPY_REDIRECT_URI", "https://127.0.0.1:8888/callback")

if SPOTIPY_CLIENT_ID:
    os.environ["SPOTIPY_CLIENT_ID"] = SPOTIPY_CLIENT_ID
if SPOTIPY_CLIENT_SECRET:
    os.environ["SPOTIPY_CLIENT_SECRET"] = SPOTIPY_CLIENT_SECRET
if SPOTIPY_REDIRECT_URI:
    os.environ["SPOTIPY_REDIRECT_URI"] = SPOTIPY_REDIRECT_URI


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
    def obtener_perfil_onda(ruta_completa: str, num_puntos: int = 120) -> list:
        try:
            y, _ = librosa.load(ruta_completa, sr=11025, mono=True, duration=60)
            bloque = max(1, len(y) // num_puntos)
            puntos = []
            for i in range(num_puntos):
                sub = y[i * bloque:(i + 1) * bloque]
                puntos.append(float(np.max(np.abs(sub))) if len(sub) > 0 else 0.0)
            max_v = max(puntos) if puntos and max(puntos) > 0 else 1.0
            return [p / max_v for p in puntos]
        except Exception:
            return [0.1 + 0.6 * (np.sin(i / 5.0) ** 2) for i in range(num_puntos)]

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


class SpotifyDownloaderAdapter:
    """Motor oficial Spotify API + yt-dlp."""

    @staticmethod
    def _limpiar_url(url: str) -> str:
        url = url.strip()
        if "https://" in url:
            partes = [p for p in url.split("https://") if p]
            url = "https://" + partes[0]
        url = url.split("?")[0]
        url = re.sub(r'open\.spotify\.com/intl-[a-zA-Z-]+/', 'open.spotify.com/', url)
        return url

    @staticmethod
    def _obtener_cliente_spotify():
        try:
            import spotipy
            from spotipy.oauth2 import SpotifyClientCredentials
            cid = os.getenv("SPOTIPY_CLIENT_ID")
            csec = os.getenv("SPOTIPY_CLIENT_SECRET")
            if cid and csec:
                auth_mgr = SpotifyClientCredentials(client_id=cid, client_secret=csec)
                return spotipy.Spotify(auth_manager=auth_mgr)
        except Exception as e:
            logging.error(f"[Spotify Client Error] {e}")
        return None

    @staticmethod
    def escanear_lista(spotify_url: str, callback_log=None) -> list:
        try:
            url_limpia = SpotifyDownloaderAdapter._limpiar_url(spotify_url)
            sp = SpotifyDownloaderAdapter._obtener_cliente_spotify()

            if not sp:
                if callback_log:
                    callback_log("[Spotify] Falta configurar credenciales en .env", "error")
                return []

            if callback_log:
                callback_log(f"[Spotify] Analizando catálogo: {url_limpia}...")

            lista_info = []

            # 1. PLAYLIST
            if "/playlist/" in url_limpia:
                p_id = url_limpia.split("/playlist/")[1].split("/")[0]
                res = sp.playlist_items(p_id)
                items = res.get("items", [])
                while res.get("next") and len(items) < 300:
                    res = sp.next(res)
                    items.extend(res.get("items", []))

                for item in items:
                    t = item.get("track")
                    if not t or not t.get("name"):
                        continue
                    art = ", ".join([a.get("name", "") for a in t.get("artists", [])])
                    alb = t.get("album", {}).get("name", "Single")
                    dur_seg = int(t.get("duration_ms", 0) / 1000)
                    imgs = t.get("album", {}).get("images", [])
                    c_url = imgs[0].get("url") if imgs else ""
                    
                    datos = {
                        "titulo": t.get("name"),
                        "artista": art,
                        "album": alb,
                        "duracion": f"{dur_seg // 60:02d}:{dur_seg % 60:02d}",
                        "cover_url": c_url,
                        "preview_url": t.get("preview_url") or "",
                        "year": (t.get("album", {}).get("release_date") or "2026")[:4]
                    }
                    lista_info.append({**datos, "song_obj": datos})

            # 2. ARTISTA
            elif "/artist/" in url_limpia:
                a_id = url_limpia.split("/artist/")[1].split("/")[0]
                albums_res = sp.artist_albums(a_id, album_type='album,single', limit=10)
                items_albums = albums_res.get("items", [])
                
                track_ids_vistos = set()
                for alb in items_albums:
                    alb_id = alb.get("id")
                    alb_name = alb.get("name", "Album")
                    c_url = alb.get("images", [{}])[0].get("url", "")
                    year = (alb.get("release_date") or "2026")[:4]
                    
                    alb_tracks = sp.album_tracks(alb_id)
                    for t in alb_tracks.get("items", []):
                        t_id = t.get("id")
                        if not t_id or t_id in track_ids_vistos:
                            continue
                        track_ids_vistos.add(t_id)
                        art = ", ".join([a.get("name", "") for a in t.get("artists", [])])
                        dur_seg = int(t.get("duration_ms", 0) / 1000)
                        datos = {
                            "titulo": t.get("name"),
                            "artista": art,
                            "album": alb_name,
                            "duracion": f"{dur_seg // 60:02d}:{dur_seg % 60:02d}",
                            "cover_url": c_url,
                            "preview_url": t.get("preview_url") or "",
                            "year": year
                        }
                        lista_info.append({**datos, "song_obj": datos})
                        if len(lista_info) >= 50:
                            break
                    if len(lista_info) >= 50:
                        break

            # 3. ÁLBUM
            elif "/album/" in url_limpia:
                alb_id = url_limpia.split("/album/")[1].split("/")[0]
                alb_obj = sp.album(alb_id)
                alb_name = alb_obj.get("name", "Album")
                imgs = alb_obj.get("images", [])
                c_url = imgs[0].get("url") if imgs else ""
                year = (alb_obj.get("release_date") or "2026")[:4]

                for t in alb_obj.get("tracks", {}).get("items", []):
                    art = ", ".join([a.get("name", "") for a in t.get("artists", [])])
                    dur_seg = int(t.get("duration_ms", 0) / 1000)
                    datos = {
                        "titulo": t.get("name"),
                        "artista": art,
                        "album": alb_name,
                        "duracion": f"{dur_seg // 60:02d}:{dur_seg % 60:02d}",
                        "cover_url": c_url,
                        "preview_url": t.get("preview_url") or "",
                        "year": year
                    }
                    lista_info.append({**datos, "song_obj": datos})

            # 4. TRACK INDIVIDUAL
            elif "/track/" in url_limpia:
                tr_id = url_limpia.split("/track/")[1].split("/")[0]
                t = sp.track(tr_id)
                art = ", ".join([a.get("name", "") for a in t.get("artists", [])])
                alb = t.get("album", {}).get("name", "Single")
                dur_seg = int(t.get("duration_ms", 0) / 1000)
                imgs = t.get("album", {}).get("images", [])
                c_url = imgs[0].get("url") if imgs else ""
                
                datos = {
                    "titulo": t.get("name"),
                    "artista": art,
                    "album": alb,
                    "duracion": f"{dur_seg // 60:02d}:{dur_seg % 60:02d}",
                    "cover_url": c_url,
                    "preview_url": t.get("preview_url") or "",
                    "year": (t.get("album", {}).get("release_date") or "2026")[:4]
                }
                lista_info.append({**datos, "song_obj": datos})

            if callback_log:
                callback_log(f"[Spotify] {len(lista_info)} pista(s) encontradas.", "success")

            return lista_info
        except Exception as e:
            if callback_log:
                callback_log(f"[Spotify Error] {str(e)}", "error")
            return []

    @staticmethod
    def descargar_canciones_seleccionadas(songs_list: list, directorio_salida: str, callback_log=None) -> list:
        import yt_dlp
        os.makedirs(directorio_salida, exist_ok=True)
        archivos_generados = []

        for idx, item in enumerate(songs_list, start=1):
            datos = item if isinstance(item, dict) else getattr(item, "__dict__", {})
            artista = datos.get("artista", "Desconocido")
            titulo = datos.get("titulo", "Pista")
            album = datos.get("album", "Single")
            año = datos.get("year", "2026")
            cover_url = datos.get("cover_url", "")

            nombre_base = f"{artista} - {titulo}"
            nombre_base = "".join(c for c in nombre_base if c.isalnum() or c in (' ', '-', '_', '.')).strip()
            archivo_final = os.path.join(directorio_salida, f"{nombre_base}.mp3")

            query = f"ytsearch1:{artista} - {titulo} audio"
            if callback_log:
                callback_log(f"[{idx}/{len(songs_list)}] Descargando: {artista} - {titulo}...")

            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': os.path.join(directorio_salida, f"{nombre_base}.%(ext)s"),
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '320',
                }],
                'quiet': True,
                'no_warnings': True,
            }

            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([query])

                if os.path.exists(archivo_final):
                    try:
                        id3 = ID3(archivo_final)
                    except ID3NoHeaderError:
                        id3 = ID3()

                    if cover_url:
                        try:
                            resp = requests.get(cover_url, timeout=7)
                            if resp.status_code == 200:
                                img = Image.open(io.BytesIO(resp.content)).convert('RGB')
                                img_buffer = io.BytesIO()
                                img.save(img_buffer, format='JPEG', quality=95)
                                jpeg_data = img_buffer.getvalue()

                                id3.delall("APIC")
                                id3.add(APIC(
                                    encoding=3,
                                    mime='image/jpeg',
                                    type=3,
                                    desc='Cover',
                                    data=jpeg_data
                                ))
                        except Exception:
                            pass

                    id3.save(archivo_final, v2_version=3)

                    try:
                        easy = EasyID3(archivo_final)
                        easy['artist'] = [artista]
                        easy['title'] = [titulo]
                        easy['album'] = [album]
                        easy['date'] = [str(año)]
                        easy.save()
                    except Exception:
                        pass

                    archivos_generados.append(archivo_final)
            except Exception as e:
                if callback_log:
                    callback_log(f"[Descarga] Error en {titulo}: {e}", "error")

        return archivos_generados

SpotifyAdapter = SpotifyDownloaderAdapter
SpotDLAdapter = SpotifyDownloaderAdapter
