import os
import sys
import json
import base64
import asyncio
from typing import Dict, Any, Optional

try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except Exception as e:
    print(f"[SHAZAM WARN] static_ffmpeg not initialized: {e}")

try:
    from shazamio import Shazam
except ImportError:
    Shazam = None


class ShazamRecognitionService:
    """Servicio de reconocimiento acústico inteligente alimentado por ShazamIO."""

    def __init__(self):
        self._shazam = Shazam() if Shazam else None

    def _ejecutar_coro(self, coro):
        """Ejecuta una corrutina asíncrona de forma segura en un bucle síncrono."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                    return pool.submit(asyncio.run, coro).result()
            return loop.run_until_complete(coro)
        except Exception:
            new_loop = asyncio.new_event_loop()
            try:
                asyncio.set_event_loop(new_loop)
                return new_loop.run_until_complete(coro)
            finally:
                new_loop.close()

    def normalizar_resultado(self, raw_result: Dict[str, Any]) -> Dict[str, Any]:
        """Normaliza la respuesta nativa de ShazamIO a un formato estandarizado para BeatWave PRO."""
        if not raw_result or not isinstance(raw_result, dict):
            return {"status": "no_match", "msg": "No se encontraron coincidencias acústicas."}

        matches = raw_result.get("matches", [])
        track = raw_result.get("track")
        if not track or len(matches) == 0:
            return {"status": "no_match", "msg": "Pista no identificada en la base de datos Shazam."}

        title = track.get("title", "Desconocido")
        artist = track.get("subtitle", "Desconocido")
        isrc = track.get("isrc", "")
        shazam_url = track.get("url", "")
        genres = track.get("genres", {})
        genre_name = genres.get("primary", "Electronic") if isinstance(genres, dict) else "Electronic"

        images = track.get("images", {})
        cover_url = ""
        if isinstance(images, dict):
            cover_url = images.get("coverarthq") or images.get("coverart") or images.get("background") or ""

        # Extraer preview de audio de 30 segundos (iTunes / Apple Music Hub)
        preview_url = ""
        apple_music_url = ""
        hub = track.get("hub", {})
        if isinstance(hub, dict):
            actions = hub.get("actions", [])
            for act in actions:
                if act.get("type") == "uri" and act.get("uri"):
                    preview_url = act.get("uri")
                elif act.get("type") == "applemusicplay" and act.get("id"):
                    apple_music_url = f"https://music.apple.com/song/{act.get('id')}"

        # Extraer metadatos de secciones (Álbum, Sello, Año, Letras)
        album_name = ""
        label_name = ""
        released_year = ""
        lyrics = []

        sections = track.get("sections", [])
        if isinstance(sections, list):
            for sec in sections:
                sec_type = sec.get("type", "")
                if sec_type == "SONG":
                    for meta_item in sec.get("metadata", []):
                        title_key = str(meta_item.get("title", "")).lower()
                        text_val = meta_item.get("text", "")
                        if "album" in title_key:
                            album_name = text_val
                        elif "label" in title_key:
                            label_name = text_val
                        elif "released" in title_key or "año" in title_key:
                            released_year = text_val
                elif sec_type == "LYRICS":
                    lyrics = sec.get("text", [])

        return {
            "status": "ok",
            "title": title,
            "artist": artist,
            "album": album_name or f"{title} - Single",
            "label": label_name,
            "genre": genre_name,
            "year": released_year,
            "isrc": isrc,
            "cover": cover_url,
            "preview_url": preview_url,
            "shazam_url": shazam_url,
            "apple_music_url": apple_music_url,
            "lyrics": lyrics,
            "spotify_query": f"{title} {artist}",
            "raw": track
        }

    def reconocer_archivo(self, filepath: str) -> Dict[str, Any]:
        """Identifica una pista a partir de la ruta absoluta de un archivo de audio local."""
        if not self._shazam:
            return {"status": "error", "msg": "Biblioteca ShazamIO no disponible"}
        if not filepath or not os.path.exists(filepath):
            return {"status": "error", "msg": "Archivo no encontrado"}

        try:
            raw = self._ejecutar_coro(self._shazam.recognize_song(filepath))
            return self.normalizar_resultado(raw)
        except Exception as e:
            print(f"[SHAZAM ERROR] Reconocimiento de archivo falló: {e}")
            return {"status": "error", "msg": str(e)}

    def reconocer_bytes(self, audio_bytes: bytes) -> Dict[str, Any]:
        """Identifica una pista a partir de bytes binarios de audio en memoria."""
        if not self._shazam:
            return {"status": "error", "msg": "Biblioteca ShazamIO no disponible"}
        if not audio_bytes or len(audio_bytes) < 100:
            return {"status": "error", "msg": "Datos de audio insuficientes"}

        try:
            raw = self._ejecutar_coro(self._shazam.recognize_song(audio_bytes))
            return self.normalizar_resultado(raw)
        except Exception as e:
            print(f"[SHAZAM ERROR] Reconocimiento por bytes falló: {e}")
            return {"status": "error", "msg": str(e)}

    def reconocer_base64(self, b64_str: str) -> Dict[str, Any]:
        """Identifica una pista recibiendo audio codificado en Base64 (grabación de micrófono o carga web)."""
        if not b64_str or not isinstance(b64_str, str):
            return {"status": "error", "msg": "Audio Base64 no proporcionado"}

        try:
            # Limpiar posible prefijo data URI (ej. 'data:audio/webm;base64,')
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            audio_bytes = base64.b64decode(b64_str)
            return self.reconocer_bytes(audio_bytes)
        except Exception as e:
            print(f"[SHAZAM ERROR] Decodificación Base64 falló: {e}")
            return {"status": "error", "msg": f"Error procesando audio: {e}"}
